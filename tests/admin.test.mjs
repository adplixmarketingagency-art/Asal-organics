import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from "jose";
import { adminConfig, requireAdmin, AdminError, readAdminBody } from "../src/lib/admin-auth.ts";
import { orderQuery, validOrderId, validateTransition } from "../src/lib/admin-orders.ts";
import { createAdminHandlers } from "../src/lib/admin-handlers.ts";
import { notificationConfig, requireNotificationCron, retryDelay, sendNotification, processNotifications, deliveryForOrder } from "../src/lib/order-notifications.ts";

const id = "7dcfc4de-8927-4e6e-9f01-042f6e93fbcd";
const config = { domain: "https://test.cloudflareaccess.com", audience: "test-audience", emails: ["owner@example.com"] };
const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwks = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: "test", alg: "RS256" }] });
async function jwt(overrides = {}, key = privateKey) {
  return new SignJWT({ email: "owner@example.com", iss: config.domain, aud: config.audience, sub: "owner-id",
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 300, ...overrides })
    .setProtectedHeader({ alg: "RS256", kid: "test" }).sign(key);
}
function request(body = {}, overrides = {}) {
  return new Request("http://localhost:3101/api/admin/orders", { method: "POST",
    headers: { Origin: "http://localhost:3101", "X-Asal-Admin": "1", "Content-Type": "application/json" },
    body: JSON.stringify(body), ...overrides });
}
const env = { RESEND_API_KEY: "test-key", SELLER_ORDER_EMAIL: "owner@example.com", SELLER_ORDER_FROM_EMAIL: "orders@example.com" };

test("owner configuration fails closed; issuer cannot point to arbitrary/private URLs", () => {
  assert.equal(adminConfig({}), null);
  for (const domain of ["http://test.cloudflareaccess.com", "https://test.cloudflareaccess.com.attacker.com", "https://localhost", "https://test.cloudflareaccess.com/path"]) {
    assert.equal(adminConfig({ ADMIN_ACCESS_TEAM_DOMAIN: domain, ADMIN_ACCESS_AUD: "aud", ADMIN_EMAILS: "owner@example.com" }), null);
  }
  assert.deepEqual(adminConfig({ ADMIN_ACCESS_TEAM_DOMAIN: config.domain + "/", ADMIN_ACCESS_AUD: config.audience, ADMIN_EMAILS: "OWNER@example.com, other@example.com" }), { ...config, emails: ["owner@example.com", "other@example.com"] });
});
test("signed Access JWT verifies issuer, audience, expiry and explicit owner allowlist", async () => {
  assert.deepEqual(await requireAdmin(new Headers({ "cf-access-jwt-assertion": await jwt() }), config, jwks), { email: "owner@example.com" });
  for (const overrides of [{ iss: "https://wrong.cloudflareaccess.com" }, { aud: "wrong" }, { exp: 1 }, { email: "stranger@example.com" }, { exp: undefined }, { sub: undefined }]) {
    await assert.rejects(requireAdmin(new Headers({ "cf-access-jwt-assertion": await jwt(overrides) }), config, jwks), { status: 401 });
  }
  const other = await generateKeyPair("RS256");
  await assert.rejects(requireAdmin(new Headers({ "cf-access-jwt-assertion": await jwt({}, other.privateKey) }), config, jwks), { status: 401 });
});
test("unsigned email headers, missing tokens and absent configuration never grant access", async () => {
  await assert.rejects(requireAdmin(new Headers({ "cf-access-authenticated-user-email": "owner@example.com" }), config, jwks), { status: 401 });
  await assert.rejects(requireAdmin(new Headers(), null), { status: 503 });
  await assert.rejects(requireAdmin(new Headers({ "cf-access-jwt-assertion": "forged" }), config, jwks), { status: 401 });
});
test("admin mutations require exact origin, custom header, JSON object and bounded body", async () => {
  assert.deepEqual(await readAdminBody(request({ from: "packed", to: "shipped" })), { from: "packed", to: "shipped" });
  for (const headers of [{}, { Origin: "https://evil.example", "X-Asal-Admin": "1" }, { Origin: "http://localhost:3101" }]) {
    await assert.rejects(readAdminBody(request({}, { headers })), { status: 403 });
  }
  await assert.rejects(readAdminBody(request("x".repeat(2049))), { status: 413 });
  await assert.rejects(readAdminBody(request([], {})), { status: 400 });
  await assert.rejects(readAdminBody(request({}, { body: "{" })), { status: 400 });
});
test("order queries validate pagination, filters and search size", () => {
  assert.deepEqual(orderQuery(new URL("https://example.com/?page=2&status=packed&q=%25")), { page: 2, filter: "packed", search: "%" });
  for (const query of ["page=0", "page=-1", "page=1.2", "page=100000", "status=deleted", `q=${"x".repeat(101)}`]) {
    assert.throws(() => orderQuery(new URL(`https://example.com/?${query}`)), { status: 400 });
  }
  assert.doesNotThrow(() => validOrderId(id));
  assert.throws(() => validOrderId("' OR 1=1"), { status: 404 });
});
test("fulfilment cannot skip, reverse or invent states", () => {
  for (const [from, to] of [["unfulfilled", "packed"], ["packed", "shipped"], ["shipped", "delivered"]]) assert.doesNotThrow(() => validateTransition(from, to));
  for (const [from, to] of [["unfulfilled", "delivered"], ["packed", "packed"], ["shipped", "packed"], ["delivered", undefined], [null, "packed"]]) assert.throws(() => validateTransition(from, to), { status: 400 });
});
function fixture(overrides = {}) {
  const calls = [];
  const deps = {
    requireAdmin: async () => ({ email: "owner@example.com" }),
    listAdminOrders: async (q) => { calls.push(q); return { orders: [], total: 0 }; },
    getAdminOrder: async () => { calls.push("read"); return { id }; },
    updateFulfillment: async (...args) => { calls.push(args); },
    notificationReadiness: () => ({ emailConfigured: false, processorConfigured: false }),
    retryNotification: async () => { calls.push("retry"); },
    processNotifications: async () => { calls.push("send"); return { processed: 0, accepted: 0 }; },
    ...overrides,
  };
  return { ...createAdminHandlers(deps), calls };
}
test("every admin endpoint authorizes before touching orders or notification delivery", async () => {
  const handlers = fixture({ requireAdmin: async () => { throw new AdminError("Unauthorized", 401); } });
  for (const name of ["list", "detail", "update", "retry", "process"]) {
    const response = await handlers[name](request(), id);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  }
  assert.deepEqual(handlers.calls, []);
});
test("admin endpoint returns safe data and records identity from verified session, never browser body", async () => {
  const handlers = fixture();
  const response = await handlers.update(request({ from: "packed", to: "shipped", actor: "attacker@example.com" }), id);
  assert.equal(response.status, 200);
  assert.deepEqual(handlers.calls, [[id, "packed", "shipped", "owner@example.com"]]);
});
test("missing orders return 404, unexpected failures don't disclose SQL or secrets", async () => {
  assert.equal((await fixture({ getAdminOrder: async () => null }).detail(request(), id)).status, 404);
  const response = await fixture({ listAdminOrders: async () => { throw new Error("postgres://secret@db"); } }).list(request());
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes("secret@db"), false);
});
test("notification config is explicit; processor secret uses constant-time comparison", () => {
  assert.equal(notificationConfig({}), null);
  assert.ok(notificationConfig(env));
  assert.equal(notificationConfig({ ...env, SELLER_ORDER_EMAIL: "a@example.com,b@example.com" }), null);
  const secret = "a".repeat(40);
  assert.doesNotThrow(() => requireNotificationCron(new Request("https://example.com", { headers: { Authorization: `Bearer ${secret}` } }), secret));
  for (const value of ["", `Bearer ${"b".repeat(40)}`, `Bearer ${"é".repeat(40)}`]) {
    assert.throws(() => requireNotificationCron(new Request("https://example.com", { headers: { Authorization: value } }), secret), { status: 401 });
  }
});
test("email contains a secure dashboard link, not customer contact details", () => {
  const message = deliveryForOrder({ id, receipt: "asal_test", amountPaise: 12300, customer: { email: "customer@example.com" } }, notificationConfig(env));
  assert.match(message.text, /INR 123.00/);
  assert.match(message.text, new RegExp(`/admin/orders\\?order=${id}`));
  assert.equal(JSON.stringify(message).includes("customer@example.com"), false);
});
test("provider delivery uses stable idempotency and a frozen payload; rejects unconfirmed responses", async () => {
  const job = { id, attempts: 1, leaseId: id, delivery: { from: "orders@example.com", to: ["owner@example.com"], subject: "Test", text: "test" } };
  let captured;
  assert.equal(await sendNotification(job, "test-key", async (url, init) => { captured = { url, init }; return Response.json({ id: "email-id" }); }), null);
  assert.equal(captured.url, "https://api.resend.com/emails");
  assert.equal(captured.init.headers["Idempotency-Key"], `asal-paid-${id}`);
  assert.equal(captured.init.body, JSON.stringify(job.delivery));
  const firstBody = captured.init.body;
  await sendNotification({ ...job, delivery: { text: "test", subject: "Test", to: ["owner@example.com"], from: "orders@example.com" } }, "test-key", async (_url, init) => {
    assert.equal(init.body, firstBody, "JSONB key order must not change provider request bytes");
    return Response.json({ id: "email-id" });
  });
  assert.match(await sendNotification(job, "test-key", async () => Response.json({ error: "secret" }, { status: 429 })), /429/);
  assert.equal((await sendNotification(job, "test-key", async () => Response.json({ error: "secret" }, { status: 400 }))).includes("secret"), false);
  assert.match(await sendNotification(job, "test-key", async () => Response.json({})), /unconfirmed/);
});
test("outbox processing is bounded, persists outcomes and never claims with missing setup", async () => {
  let count = 0;
  const completions = [];
  const deps = { config: () => notificationConfig(env), claim: async () => ({ id: String(++count), delivery: {}, attempts: 1 }),
    send: async () => null, complete: async (job, error) => completions.push([job.id, error]) };
  assert.deepEqual(await processNotifications(deps), { processed: 5, accepted: 5 });
  assert.equal(completions.length, 5);
  await assert.rejects(processNotifications({ ...deps, config: () => null }), { status: 503 });
  assert.equal(count, 5);
  assert.deepEqual([1, 2, 6, 20].map(retryDelay), [60, 120, 1920, 3600]);
});
