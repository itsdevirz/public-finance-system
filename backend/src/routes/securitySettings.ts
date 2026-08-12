import { Hono } from "hono";
import { getDb } from "../db/index.js";
import { DEFAULT_SECURITY_POLICY } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "../lib/auditLogger.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = new Hono();

// GET /api/security/policy - Read security policy
router.get("/policy", async (c) => {
  try {
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    return c.json({
      success: true,
      data: config?.value || DEFAULT_SECURITY_POLICY
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/security/policy - Update security policy (Admin only)
router.put("/policy", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const body = await c.req.json();
    const db = getDb();

    const newPolicy = {
      passwordPolicy: {
        minLength: Number(body.passwordPolicy?.minLength) || 8,
        requireUppercase: !!body.passwordPolicy?.requireUppercase,
        requireLowercase: !!body.passwordPolicy?.requireLowercase,
        requireNumbers: !!body.passwordPolicy?.requireNumbers,
        requireSpecialChars: !!body.passwordPolicy?.requireSpecialChars,
      },
      lockoutPolicy: {
        maxFailedAttempts: Number(body.lockoutPolicy?.maxFailedAttempts) || 5,
        lockoutDurationMinutes: Number(body.lockoutPolicy?.lockoutDurationMinutes) || 15,
      },
      sessionPolicy: {
        tokenExpiresInHours: Number(body.sessionPolicy?.tokenExpiresInHours) || 8,
        maxConcurrentSessions: Number(body.sessionPolicy?.maxConcurrentSessions) || 3,
        idleTimeoutMinutes: Number(body.sessionPolicy?.idleTimeoutMinutes) || 30,
      }
    };

    await db.collection("system_settings").updateOne(
      { key: "security_policy" },
      { $set: { key: "security_policy", value: newPolicy, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    // ۴. تمامی تغییرات در پیکربندی ثبت‌نشان‌ها و تنظیمات امنیتی
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
      resource: "system_settings",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { newPolicy }
    });

    return c.json({ success: true, message: "خط‌مشی‌های امنیتی با موفقیت به‌روزرسانی شد.", data: newPolicy });
  } catch (error: any) {
    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_CONFIG_CHANGE,
      resource: "system_settings",
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 500,
      details: { error: error.message }
    });

    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/audit-logs - Advanced audit log retrieval (Admin only)
router.get("/audit-logs", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const db = getDb();
    const { username, action, result, page = "1", limit = "50" } = c.req.query();
    
    const query: any = {};
    if (username) query.username = { $regex: username, $options: "i" };
    if (action) query.action = { $regex: action, $options: "i" };
    if (result) query.result = result;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await db.collection("audit_logs").countDocuments(query);
    const logs = await db.collection("audit_logs")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // ۳. خواندن اطلاعات از ثبت‌نشان‌ها (موفق)
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "audit_logs",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { query, totalReturned: logs.length }
    });

    return c.json({
      success: true,
      data: logs,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    // ۲. تلاش‌های ناموفق برای خواندن اطلاعات از ثبت‌نشان‌ها
    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_FAILURE,
      resource: "audit_logs",
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 500,
      details: { error: error.message }
    });

    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/active-sessions - List active user sessions (Admin only)
router.get("/active-sessions", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    const sessions = await db.collection("active_sessions").find().sort({ lastActivity: -1 }).toArray();
    return c.json({ success: true, data: sessions });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/revoke-session - Revoke session / token (Admin only)
router.post("/revoke-session", requireRole(["admin"]), async (c) => {
  try {
    const payload = (c.get as any)("jwtPayload");
    const { token, sessionId } = await c.req.json();
    const db = getDb();

    if (token) {
      await db.collection("revoked_tokens").insertOne({ token, revokedAt: new Date().toISOString() });
      await db.collection("active_sessions").deleteOne({ token });
    } else if (sessionId) {
      const session = await db.collection("active_sessions").findOne({ _id: sessionId });
      if (session?.token) {
        await db.collection("revoked_tokens").insertOne({ token: session.token, revokedAt: new Date().toISOString() });
      }
      await db.collection("active_sessions").deleteOne({ _id: sessionId });
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "ابطال نشست کاربر",
      eventType: AFTA_LOG_EVENT_TYPES.SECURITY_ATTR_CHANGE,
      resource: "active_sessions",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { sessionId, tokenRevoked: !!token }
    });

    return c.json({ success: true, message: "نشست کاربر با موفقیت باطل شد." });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
