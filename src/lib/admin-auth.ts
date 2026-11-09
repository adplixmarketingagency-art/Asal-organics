import "server-only";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { ownerConfig, ownerToken, sessionOwner } from "./owner-session.ts";

export class AdminError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export function adminConfig(env = process.env) {
  const domain = env.ADMIN_ACCESS_TEAM_DOMAIN?.trim().replace(/\/$/, "") ?? "";
  const audience = env.ADMIN_ACCESS_AUD?.trim() ?? "";
  const emails = (env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  return /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) && audience && emails.length
    ? { domain, audience, emails } : null;
}

const keySets = new Map<string, JWTVerifyGetKey>();
export async function requireAdmin(headers: Headers, config = adminConfig(), keys?: JWTVerifyGetKey) {
  const owner = ownerConfig();
  if (owner) {
    if (!ownerToken(headers)) throw new AdminError("Sign in to your owner desk.", 401);
    const session = await sessionOwner(headers, owner);
    if (session) return session;
    throw new AdminError("Your owner session is invalid or expired. Sign in again.", 401);
  }
  if (!config) throw new AdminError("Owner access has not been configured.", 503);
  const token = headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 16384) throw new AdminError("Sign in with the owner's Cloudflare Access account.", 401);
  try {
    let jwks = keys ?? keySets.get(config.domain);
    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(`${config.domain}/cdn-cgi/access/certs`), { timeoutDuration: 5000 });
      keySets.set(config.domain, jwks);
    }
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.domain, audience: config.audience, algorithms: ["RS256"],
      requiredClaims: ["exp", "iat", "sub", "email"], clockTolerance: 5,
    });
    if (typeof payload.email !== "string" || !config.emails.includes(payload.email.toLowerCase())) {
      throw new Error("Not an owner");
    }
    return { email: payload.email.toLowerCase() };
  } catch {
    // Never trust an unsigned identity header or leak token/verification details.
    throw new AdminError("Your owner session is invalid or expired. Sign in again.", 401);
  }
}

export function adminJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: {
    "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie, Cf-Access-Jwt-Assertion",
  } });
}

export function adminFailure(error: unknown) {
  return adminJson({ error: error instanceof AdminError ? error.message : "The order service is unavailable. Please try again." },
    error instanceof AdminError ? error.status : 503);
}

export async function readAdminBody(request: Request) {
  // Require an explicit origin and custom header, including for programmatic clients.
  // Production origin is fixed; never authorize a mutation using a forwarded host.
  const url = new URL(request.url);
  const expectedOrigin = process.env.NODE_ENV === "production" ? "https://asaliyarkaiangadi.in"
    : `${url.protocol}//${request.headers.get("host") ?? url.host}`;
  if (request.headers.get("origin") !== expectedOrigin || request.headers.get("x-asal-admin") !== "1") {
    throw new AdminError("Cross-origin admin requests are not allowed.", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new AdminError("A JSON request is required.", 415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new AdminError("Request body is missing.", 400);
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); throw new AdminError("Request is too large.", 413); }
      text += decoder.decode(value, { stream: true });
    }
    const body: unknown = JSON.parse(text + decoder.decode());
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid object");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError("Invalid request body.", 400);
  } finally { reader.releaseLock(); }
}
