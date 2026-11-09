import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { ownerConfig, derivePassword, verifyPassword, ownerCookie, ownerToken } from "../src/lib/owner-session.ts";
import { createOwnerHandlers } from "../src/lib/owner-handlers.ts";

const salt = randomBytes(16).toString("hex");
const password = "only-a-synthetic-test-password";
const passwordHash = `scrypt:32768:8:3:${salt}:${(await derivePassword(password, salt)).toString("hex")}`;
const config = ownerConfig({ ADMIN_LOGIN_EMAIL: "OWNER@example.com", ADMIN_PASSWORD_HASH: passwordHash });
const request = (body = {}, headers = {}) => new Request("http://localhost/api/admin/login", {
  method: "POST", headers: { Origin: "http://localhost", "X-Asal-Admin": "1", "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});
test("owner credentials use salted memory-hard hashing; config fails closed", async () => {
  assert.equal(config.email, "owner@example.com");
  assert.equal(ownerConfig({}), null);
  assert.equal(ownerConfig({ ADMIN_LOGIN_EMAIL: config.email, ADMIN_PASSWORD_HASH: "plaintext" }), null);
  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword("not-the-password", passwordHash), false);
  assert.notEqual(config.version, ownerConfig({ ADMIN_LOGIN_EMAIL: "other@example.com", ADMIN_PASSWORD_HASH: passwordHash }).version);
});
test("password login protects CSRF, rate limits, identity, and cookies", async () => {
  let sessions = 0, checks = 0;
  const deps = { ownerConfig: () => config, allowLogin: async () => true,
    verifyPassword: async (value) => { checks++; return value === password; },
    createOwnerSession: async () => { sessions++; return "a".repeat(64); }, revokeOwnerSession: async () => {} };
  const handlers = createOwnerHandlers(deps);
  assert.equal((await handlers.login(request({ email: config.email, password }, { Origin: "https://evil.example" }))).status, 403);
  for (const body of [{ email: "wrong@example.com", password }, { email: config.email, password: "wrong" }]) {
    const response = await handlers.login(request(body));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("set-cookie"), null);
  }
  assert.equal(checks, 2);
  assert.equal(sessions, 0);
  const response = await handlers.login(request({ email: config.email, password }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /__Host-asal-owner=.*HttpOnly; Secure; SameSite=Strict; Max-Age=28800/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const limited = await createOwnerHandlers({ ...deps, allowLogin: async () => false }).login(request({ email: config.email, password }));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "900");
  assert.equal(sessions, 1);
  assert.equal((await createOwnerHandlers({ ...deps, ownerConfig: () => null }).login(request())).status, 503);
  assert.match((await handlers.logout(request())).headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(ownerToken(new Headers({ cookie: ownerCookie("a".repeat(64)) })), "a".repeat(64));
  assert.equal(ownerToken(new Headers({ cookie: "__Host-asal-owner=forged" })), null);
});
