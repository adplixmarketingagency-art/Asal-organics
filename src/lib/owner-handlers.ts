import "server-only";
import { adminJson, adminFailure, AdminError, readAdminBody } from "./admin-auth.ts";
import { ownerConfig, allowLogin, verifyPassword, createOwnerSession, ownerCookie, revokeOwnerSession } from "./owner-session.ts";

const dependencies = { ownerConfig, allowLogin, verifyPassword, createOwnerSession, revokeOwnerSession };
export function createOwnerHandlers(deps = dependencies) {
  return {
    async login(request: Request) {
      try {
        const body = await readAdminBody(request);
        const config = deps.ownerConfig();
        if (!config) throw new AdminError("Owner login is not configured.", 503);
        if (!(await deps.allowLogin(request.headers.get("cf-connecting-ip") ?? "unknown"))) {
          const response = adminJson({ error: "Too many sign-in attempts. Try again in 15 minutes." }, 429);
          response.headers.set("Retry-After", "900");
          return response;
        }
        if (typeof body.email !== "string" || typeof body.password !== "string" ||
          body.email.length > 254 || body.password.length > 256) throw new AdminError("Invalid email or password.", 401);
        // Do the same expensive verification for a wrong email; don't enumerate users.
        const valid = await deps.verifyPassword(body.password, config.passwordHash);
        if (!valid || body.email.trim().toLowerCase() !== config.email) throw new AdminError("Invalid email or password.", 401);
        await deps.revokeOwnerSession(request.headers);
        const token = await deps.createOwnerSession(config);
        const response = adminJson({ ok: true });
        response.headers.set("Set-Cookie", ownerCookie(token));
        return response;
      } catch (error) { return adminFailure(error); }
    },
    async logout(request: Request) {
      try {
        await readAdminBody(request);
        await deps.revokeOwnerSession(request.headers);
        const response = adminJson({ ok: true });
        response.headers.set("Set-Cookie", ownerCookie("", 0));
        response.headers.set("Clear-Site-Data", '"cache"');
        return response;
      } catch (error) { return adminFailure(error); }
    },
  };
}
