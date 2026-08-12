import { createMiddleware } from "hono/factory";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "../lib/auditLogger.js";

export function requireRole(allowedRoles: string[]) {
  return createMiddleware(async (c, next) => {
    const payload = c.get("jwtPayload" as any) as any;
    if (!payload) {
      return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
    }

    const userRole = payload.role || "حسابدار";
    if (userRole === "admin" || allowedRoles.includes(userRole)) {
      if (userRole === "admin" || allowedRoles.includes("admin")) {
        await logAuditEvent({
          userId: payload.sub,
          username: payload.username,
          userRole,
          action: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
          eventType: AFTA_LOG_EVENT_TYPES.ADMIN_FUNCTION_USAGE,
          resource: c.req.path,
          method: c.req.method,
          result: "SUCCESS",
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent"),
          details: { requiredRoles: allowedRoles, userRole }
        });
      }

      await next();
      return;
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole,
      action: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
      eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
      resource: c.req.path,
      method: c.req.method,
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      errorCode: 403,
      details: { reason: "دسترسی غیرمجاز (نقش)", requiredRoles: allowedRoles, userRole }
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

    const userRole = payload.role || "حسابدار";
    // Admin role automatically passes all permission checks
    if (userRole === "admin") {
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
      userRole,
      action: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
      eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
      resource: c.req.path,
      method: c.req.method,
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      errorCode: 403,
      details: { reason: "دسترسی غیرمجاز (مجوز)", requiredPermission: permissionKey }
    });

    return c.json({ success: false, message: `مجوز لازم (${permissionKey}) برای انجام این عملیات را ندارید.` }, 403);
  });
}
