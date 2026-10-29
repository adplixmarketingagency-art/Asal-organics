import { prepareCheckoutReview } from "../../../lib/checkout.ts";

const MAX_BODY_BYTES = 16_384;
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "Send checkout details as JSON." }, { status: 415, headers });
  }
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Checkout details are missing." }, { status: 400, headers });
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return Response.json({ error: "Checkout details are too large." }, { status: 413, headers });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const result = prepareCheckoutReview(JSON.parse(new TextDecoder().decode(body)));
    if (!result.ok) return Response.json(result, { status: 422, headers });
    // No order is saved, no inventory is reserved, and no payment is initiated.
    return Response.json(result.review, { headers });
  } catch {
    return Response.json({ error: "We couldn’t read your checkout details. Please try again." }, { status: 400, headers });
  } finally {
    reader.releaseLock();
  }
}
