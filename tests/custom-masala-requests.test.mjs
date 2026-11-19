import assert from "node:assert/strict";
import test from "node:test";
import { prepareCustomMasalaRequest } from "../src/lib/custom-masala-request.ts";
import { createCustomMasalaHandler } from "../src/lib/custom-masala-handlers.ts";

const requestId = "7dcfc4de-8927-4e6e-9f01-042f6e93fbcd";
const customer = { fullName: "Synthetic Customer", phone: "+91 9876543210", email: "",
  address: "12 Test Street", apartment: "Near test park", city: "Chennai", state: "Tamil Nadu", pincode: "600001", country: "IN" };
const body = { requestId, quantities: { coriander: "100", "chilli-long": "200" }, otherIngredients: "Pepper 50 g", customer };
const request = (value = body, headers = {}) => new Request("http://localhost:3102/api/custom-masala", {
  method: "POST", headers: { Origin: "http://localhost:3102", "Content-Type": "application/json", ...headers },
  body: JSON.stringify(value),
});
function fixture(overrides = {}) {
  const calls = [];
  const handler = createCustomMasalaHandler({
    allowRequest: async (ip) => { calls.push(["limit", ip]); return true; },
    saveRequest: async (prepared) => { calls.push(["save", prepared]); return { id: requestId, receipt: "custom_test", recipe: prepared.recipe, customer: prepared.customer }; },
    ...overrides,
  });
  return { handler, calls };
}

test("custom request recomputes recipe, preserves note and ignores forged money", () => {
  const result = prepareCustomMasalaRequest({ ...body, totalPaise: 1, paid: true });
  assert.equal(result.ok, true);
  assert.equal(result.request.recipe.totalGrams, 300);
  assert.equal(result.request.recipe.ingredientsPaise, 9200);
  assert.equal(result.request.recipe.grindingPaise, 900);
  assert.equal(result.request.recipe.totalPaise, 10100);
  assert.equal(result.request.recipe.otherIngredients, "Pepper 50 g");
  assert.deepEqual(result.request.recipe.ingredients.map(({ name, grams }) => [name, grams]),
    [["Coriander seeds", 100], ["Dry chilli — long", 200]]);
  assert.equal(result.request.customer.fullName, customer.fullName);
  assert.equal(result.request.customer.phone, "9876543210");
  assert.equal(result.request.customer.address, customer.address);
  assert.equal(prepareCustomMasalaRequest({ requestId, quantities: {}, otherIngredients: "Pepper only", customer }).ok, true);
  assert.equal(prepareCustomMasalaRequest({ requestId, quantities: {}, otherIngredients: "", customer }).ok, false);
});

test("custom order requires a real name, phone and full delivery address; email stays optional", () => {
  for (const changed of [undefined, null, {}, { ...customer, fullName: "" }, { ...customer, phone: "1111111111" },
    { ...customer, address: "" }, { ...customer, city: "" }, { ...customer, state: "" }, { ...customer, pincode: "000000" }]) {
    assert.equal(prepareCustomMasalaRequest({ ...body, customer: changed }).ok, false);
  }
  assert.equal(prepareCustomMasalaRequest(body).ok, true);
  assert.equal(prepareCustomMasalaRequest({ ...body, customer: { ...customer, email: "bad" } }).ok, false);
});

test("custom request rejects malformed IDs, unknown ingredients, numeric input and oversized notes", () => {
  for (const changed of [
    { requestId: "invalid" }, { quantities: [] }, { quantities: { coriander: 100 } },
    { quantities: { madeup: "100" } }, { quantities: { coriander: "-1" } },
    { otherIngredients: "x".repeat(1001) }, { otherIngredients: 1 },
  ]) assert.equal(prepareCustomMasalaRequest({ ...body, ...changed }).ok, false);
});

test("public save uses same-origin bounded JSON, no-store response and never marks an order paid", async () => {
  const api = fixture();
  const response = await api.handler(request({ ...body, amount: 1 }));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const saved = await response.json();
  assert.equal(saved.status, "custom_request_saved");
  assert.equal(saved.receipt, "custom_test");
  assert.equal(saved.recipe.totalPaise, 10100);
  assert.equal(saved.customer.address, customer.address);
  assert.equal(saved.paid, false);
  assert.deepEqual(api.calls.map(([name]) => name), ["limit", "save"]);
  assert.equal(api.calls[1][1].recipe.totalPaise, 10100);
});

test("custom save rejects cross-origin, absent origin, non-JSON and oversized bodies before storage", async () => {
  for (const [req, status] of [
    [request(body, { Origin: "https://evil.example" }), 403],
    [request(body, { Origin: "" }), 403],
    [request(body, { "Content-Type": "text/plain" }), 415],
    [request({ ...body, otherIngredients: "x".repeat(17000) }), 413],
    [request({ ...body, quantities: { coriander: "bad" } }), 422],
  ]) {
    const api = fixture();
    assert.equal((await api.handler(req)).status, status);
    assert.equal(api.calls.some(([name]) => name === "save"), false);
  }
});

test("local same-origin requests use the actual Host when Next reconstructs the bind URL", async () => {
  const api = fixture();
  const response = await api.handler(new Request("http://0.0.0.0:3102/api/custom-masala", {
    method: "POST", headers: { Host: "127.0.0.1:3102", Origin: "http://127.0.0.1:3102", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
  assert.equal(response.status, 201);
});

test("rate limit and persistence failure never return a saved request or expose internals", async () => {
  const limited = fixture({ allowRequest: async () => false });
  assert.equal((await limited.handler(request())).status, 429);
  assert.equal(limited.calls.length, 0);
  const failed = fixture({ saveRequest: async () => { throw new Error("secret database credentials"); } });
  const response = await failed.handler(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|credentials/);
});
