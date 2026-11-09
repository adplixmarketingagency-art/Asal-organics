import "server-only";
import { requireAdmin, readAdminBody, adminJson, adminFailure, AdminError } from "./admin-auth.ts";
import { listAdminOrders, getAdminOrder, updateFulfillment, orderQuery, validOrderId } from "./admin-orders.ts";
import { notificationReadiness, retryNotification, processNotifications } from "./order-notifications.ts";

const dependencies = { requireAdmin, listAdminOrders, getAdminOrder, updateFulfillment, notificationReadiness, retryNotification, processNotifications };
export function createAdminHandlers(deps = dependencies) {
  return {
    async list(request: Request) {
      try {
        const actor = await deps.requireAdmin(request.headers);
        const result = await deps.listAdminOrders(orderQuery(new URL(request.url)));
        return adminJson({ ...result, notification: deps.notificationReadiness(), owner: actor.email });
      } catch (error) { return adminFailure(error); }
    },
    async detail(request: Request, id: string) {
      try {
        await deps.requireAdmin(request.headers);
        validOrderId(id);
        const order = await deps.getAdminOrder(id);
        if (!order) throw new AdminError("Order not found.", 404);
        return adminJson({ order });
      } catch (error) { return adminFailure(error); }
    },
    async update(request: Request, id: string) {
      try {
        const actor = await deps.requireAdmin(request.headers);
        const body = await readAdminBody(request);
        validOrderId(id);
        await deps.updateFulfillment(id, body.from, body.to, actor.email);
        return adminJson({ ok: true });
      } catch (error) { return adminFailure(error); }
    },
    async retry(request: Request, id: string) {
      try {
        await deps.requireAdmin(request.headers);
        await readAdminBody(request);
        validOrderId(id);
        await deps.retryNotification(id);
        return adminJson({ ok: true });
      } catch (error) { return adminFailure(error); }
    },
    async process(request: Request) {
      try {
        await deps.requireAdmin(request.headers);
        await readAdminBody(request);
        return adminJson(await deps.processNotifications());
      } catch (error) { return adminFailure(error); }
    },
  };
}
