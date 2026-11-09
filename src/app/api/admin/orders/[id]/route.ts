import { createAdminHandlers } from "@/lib/admin-handlers";
export const dynamic = "force-dynamic";
const handlers = createAdminHandlers();
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handlers.detail(request, (await context.params).id);
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handlers.update(request, (await context.params).id);
}
