import { createAdminHandlers } from "@/lib/admin-handlers";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return createAdminHandlers().retry(request, (await context.params).id);
}
