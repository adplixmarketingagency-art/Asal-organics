import { adminJson, adminFailure } from "@/lib/admin-auth";
import { requireNotificationCron, processNotifications } from "@/lib/order-notifications";
export async function POST(request: Request) {
  try {
    requireNotificationCron(request);
    return adminJson(await processNotifications());
  } catch (error) { return adminFailure(error); }
}
