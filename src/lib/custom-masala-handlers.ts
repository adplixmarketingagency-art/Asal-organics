import "server-only";
import { prepareCustomMasalaRequest, type CustomMasalaRequest, type SavedCustomMasalaRequest } from "./custom-masala-request.ts";
import { allowCustomMasalaRequest, saveCustomMasalaRequest } from "./custom-masala-orders.ts";
import { readBoundedBody, BodyTooLargeError } from "./request-body.ts";
import { AdminError } from "./admin-auth.ts";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const json = (body: unknown, status: number) => Response.json(body, { status, headers });
export function createCustomMasalaHandler(deps: {
  allowRequest(ip: string): Promise<boolean>;
  saveRequest(request: CustomMasalaRequest): Promise<SavedCustomMasalaRequest>;
} = { allowRequest: allowCustomMasalaRequest, saveRequest: saveCustomMasalaRequest }) {
  return async (request: Request) => {
    const url = new URL(request.url);
    const origin = process.env.NODE_ENV === "production" ? "https://asaliyarkaiangadi.in"
      : `${url.protocol}//${request.headers.get("host") ?? url.host}`;
    if (request.headers.get("origin") !== origin) return json({ error: "Cross-origin requests are not allowed." }, 403);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "A JSON request is required." }, 415);
    }
    try {
      const bytes = await readBoundedBody(request, 16_384);
      const result = prepareCustomMasalaRequest(JSON.parse(new TextDecoder().decode(bytes)));
      if (!result.ok) return json({ error: result.error }, 422);
      // On production Cloudflare overwrites this header; ignore X-Forwarded-For.
      const ip = process.env.NODE_ENV === "production" ? request.headers.get("cf-connecting-ip") ?? "unknown" : "local";
      if (!await deps.allowRequest(ip)) return json({ error: "Too many requests. Try again in 15 minutes." }, 429);
      const saved = await deps.saveRequest(result.request);
      return json({ status: "custom_request_saved", id: saved.id, receipt: saved.receipt, recipe: saved.recipe, paid: false }, 201);
    } catch (error) {
      if (error instanceof BodyTooLargeError) return json({ error: "Recipe request is too large." }, 413);
      if (error instanceof SyntaxError) return json({ error: "Invalid recipe JSON." }, 400);
      if (error instanceof AdminError) return json({ error: error.message }, error.status);
      return json({ error: "We couldn’t save the request. Please try again; nothing has been sent to WhatsApp." }, 503);
    }
  };
}
