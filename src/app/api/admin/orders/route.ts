import { createAdminHandlers } from "@/lib/admin-handlers";
export const dynamic = "force-dynamic";
export const GET = createAdminHandlers().list;
