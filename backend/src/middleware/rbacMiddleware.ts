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

export function requireActiveInactiveACL(getAclRecordFn?: (c: any) => Promise<{ allowedUserIds?: string[]; allowedGroupIds?: string[]; allowedRoles?: string[] } | null>) {
  return createMiddleware(async (c, next) => {
    const payload = c.get("jwtPayload" as any) as any;
    if (!payload) {
      return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
    }

    const { getDb } = await import("../db/index.js");
    const { DEFAULT_SECURITY_POLICY, validateActiveToInactiveInteractionACL, validateActiveToInactivePreventionRules } = await import("../lib/securityPolicy.js");
    
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policyConfig = config?.value || DEFAULT_SECURITY_POLICY;
    const policy = policyConfig.activeInactiveInteractionPolicy || DEFAULT_SECURITY_POLICY.activeInactiveInteractionPolicy;
    const preventionRules = policyConfig.activeToInactivePreventionRules || DEFAULT_SECURITY_POLICY.activeToInactivePreventionRules;

    // 1. Evaluate Active-to-Inactive Access Prevention Rules
    const activeSessionsCount = await db.collection("active_sessions").countDocuments({ userId: payload.sub });
    const preventionCheck = validateActiveToInactivePreventionRules({
      currentActiveSessionsCount: activeSessionsCount,
      isAccountActive: true,
      ipChanged: false
    }, preventionRules);

    if (!preventionCheck.allowed) {
      await logAuditEvent({
        userId: payload.sub,
        username: payload.username,
        userRole: payload.role || "حسابدار",
        action: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: c.req.path,
        method: c.req.method,
        result: "FAILURE",
        ip: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        errorCode: 403,
        details: { reason: "ممانعت از دسترسی به موجودیت غیرفعال (قواعد ممانعت)", details: preventionCheck.reason }
      });

      return c.json({ success: false, message: preventionCheck.reason }, 403);
    }

    const userInfo = {
      userId: payload.sub,
      groupId: payload.groupId || payload.departmentId,
      userRole: payload.role || "حسابدار"
    };

    const aclRecord = getAclRecordFn ? await getAclRecordFn(c) : null;
    const result = validateActiveToInactiveInteractionACL(userInfo, aclRecord, policy);

    if (!result.allowed) {
      await logAuditEvent({
        userId: payload.sub,
        username: payload.username,
        userRole: userInfo.userRole,
        action: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_FUNCTION_FAILURE,
        resource: c.req.path,
        method: c.req.method,
        result: "FAILURE",
        ip: c.req.header("x-forwarded-for") || "127.0.0.1",
        userAgent: c.req.header("user-agent"),
        errorCode: 403,
        details: { reason: "تخلف در تعامل موجودیت فعال و غیرفعال (ACL)", details: result.reason }
      });

      return c.json({ success: false, message: result.reason || "عملیات بین موجودیت فعال و غیرفعال به علت عدم تطابق ACL غیرمجاز است." }, 403);
    }

    await next();
  });
}
