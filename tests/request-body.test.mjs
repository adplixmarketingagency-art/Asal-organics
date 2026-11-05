import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { BodyTooLargeError, readBoundedBody } from "../src/lib/request-body.ts";
import { validHmac } from "../src/lib/razorpay.ts";

const limit = 256 * 1024;
function streamedRequest(chunks, contentLength) {
  let cancelled = false;
  let reads = 0;
  const stream = new ReadableStream({
    pull(controller) { reads += 1; const chunk = chunks.shift(); if (chunk) controller.enqueue(chunk); else controller.close(); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const request = new Request("http://localhost/webhook", {
    method: "POST", body: stream, duplex: "half",
    headers: contentLength === undefined ? {} : { "Content-Length": contentLength },
  });
  return { request, cancelled: () => cancelled, reads: () => reads };
}

test("body limit does not trust absent or falsely low Content-Length; cancels at the first oversized chunk", async () => {
  for (const length of [undefined, "1"]) {
    const fixture = streamedRequest([new Uint8Array(limit), new Uint8Array(1), new Uint8Array(limit)], length);
    await assert.rejects(readBoundedBody(fixture.request, limit), BodyTooLargeError);
    assert.equal(fixture.cancelled(), true);
    assert.equal(fixture.reads(), 2);
  }
});

test("exact-limit bodies succeed; oversized declared bodies are cancelled without reading", async () => {
  const exact = streamedRequest([new Uint8Array(limit)]);
  assert.equal((await readBoundedBody(exact.request, limit)).byteLength, limit);
  const oversized = streamedRequest([new Uint8Array(limit)], String(limit + 1));
  await assert.rejects(readBoundedBody(oversized.request, limit), BodyTooLargeError);
  assert.equal(oversized.reads(), 0);
  assert.equal(oversized.cancelled(), true);
});

test("webhook HMAC authenticates original bytes, not a decoded/re-encoded approximation", async () => {
  const bytes = new Uint8Array([0x7b, 0xff, 0x7d]);
  const fixture = streamedRequest([bytes.subarray(0, 1), bytes.subarray(1)]);
  const raw = await readBoundedBody(fixture.request, limit);
  assert.deepEqual(raw, bytes);
  const signature = createHmac("sha256", "dummy-test-secret").update(bytes).digest("hex");
  assert.equal(validHmac(raw, signature, "dummy-test-secret"), true);
  assert.equal(validHmac(new TextDecoder().decode(raw), signature, "dummy-test-secret"), false);
});
