import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cloudflareDatabase, type Database } from "./cloudflare-db.ts";

export const OWNER_COOKIE = "__Host-asal-owner";
export const SESSION_SECONDS = 8 * 60 * 60;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function ownerConfig(env = process.env) {
  const email = env.ADMIN_LOGIN_EMAIL?.trim().toLowerCase() ?? "";
  const passwordHash = env.ADMIN_PASSWORD_HASH ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^scrypt:32768:8:3:[a-f0-9]{32}:[a-f0-9]{64}$/.test(passwordHash)) return null;
  return { email, passwordHash, version: hash(`${email}\n${passwordHash}`) };
}
export type OwnerConfig = NonNullable<ReturnType<typeof ownerConfig>>;
export async function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, Buffer.from(salt, "hex"), 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => error ? reject(error) : resolve(key));
  });
}
export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split(":");
  const actual = await derivePassword(password, parts[4]);
  return timingSafeEqual(actual, Buffer.from(parts[5], "hex"));
}
export function ownerToken(headers: Headers) {
  const token = headers.get("cookie")?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${OWNER_COOKIE}=`))?.slice(OWNER_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function sessionOwner(headers: Headers, config: OwnerConfig, db = cloudflareDatabase()) {
  const token = ownerToken(headers);
  if (!token) return null;
  const session = await db.prepare(`SELECT email FROM asal_owner_sessions
    WHERE token_hash=? AND email=? AND credential_version=? AND expires_at>?`)
    .bind(hash(token), config.email, config.version, Math.floor(Date.now() / 1000)).first<{ email: string }>();
  return session;
}
export async function allowLogin(ip: string, db = cloudflareDatabase(), now = Math.floor(Date.now() / 1000)) {
  const bucket = Math.floor(now / 900);
  const expires = (bucket + 1) * 900;
  // Counts live in D1, not isolate memory. Hash IPs and remove expired records.
  // Cloudflare overwrites CF-Connecting-IP; never trust client X-Forwarded-For.
  const keys = [`ip:${hash(ip)}:${bucket}`, `global:${bucket}`];
  const results = await db.batch([
    db.prepare("DELETE FROM asal_login_limits WHERE expires_at<=?").bind(now),
    ...keys.map((key) => db.prepare(`INSERT INTO asal_login_limits(key,attempts,expires_at) VALUES(?,1,?)
      ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts`).bind(key, expires)),
  ]);
  return Number(results[1].results[0].attempts) <= 10 && Number(results[2].results[0].attempts) <= 60;
}
export async function createOwnerSession(config: OwnerConfig, db: Database = cloudflareDatabase()) {
  const token = randomBytes(32).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare("DELETE FROM asal_owner_sessions WHERE expires_at<=? OR credential_version<>?").bind(now, config.version),
    db.prepare("INSERT INTO asal_owner_sessions(token_hash,email,credential_version,expires_at) VALUES(?,?,?,?)")
      .bind(hash(token), config.email, config.version, now + SESSION_SECONDS),
  ]);
  return token;
}
export async function revokeOwnerSession(headers: Headers, db = cloudflareDatabase()) {
  const token = ownerToken(headers);
  if (token) await db.prepare("DELETE FROM asal_owner_sessions WHERE token_hash=?").bind(hash(token)).run();
}
export function ownerCookie(value: string, maxAge = SESSION_SECONDS) {
  return `${OWNER_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
