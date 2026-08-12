import { createMiddleware } from "hono/factory";
import { logAuditEvent } from "../lib/auditLogger.js";

export function requireRole(allowedRoles: string[]) {
  return createMiddleware(async (c, next) => {
    const payload = c.get("jwtPayload" as any) as any;
    if (!payload) {
      return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
    }

    const userRole = payload.role || "حسابدار";
    if (userRole === "admin" || allowedRoles.includes(userRole)) {
      await next();
      return;
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "دسترسی غیرمجاز (نقش)",
      resource: c.req.path,
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 403,
      details: { requiredRoles: allowedRoles, userRole }
    });

    return c.json({ success: false, message: "سطح دسترسی شما کافی نیست." }, 403);
  });
}

export function requirePermission(permissionKey: string) {
  return createMiddleware(async (c, next) => {
    const payload = c.get("jwtPayload" as any) as any;
    if (!payload) {
      return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
    }

    // Admin role automatically passes all permission checks
    if (payload.role === "admin") {
      await next();
      return;
    }

    const userPermissions = payload.permissions || {};
    if (userPermissions[permissionKey] === true) {
      await next();
      return;
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "دسترسی غیرمجاز (مجوز)",
      resource: c.req.path,
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 403,
      details: { requiredPermission: permissionKey }
    });

    return c.json({ success: false, message: `مجوز لازم (${permissionKey}) برای انجام این عملیات را ندارید.` }, 403);
  });
}
