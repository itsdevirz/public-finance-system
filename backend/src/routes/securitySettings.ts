import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import { DEFAULT_SECURITY_POLICY } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES, verifyLogIntegrity, signExistingLogs, runAuditLogRetentionAndRotation } from "../lib/auditLogger.js";
import { requireRole } from "../middleware/rbacMiddleware.js";
import { sendAdminThresholdNotification } from "../lib/notifier.js";
import { pruneExpiredSessions } from "../lib/sessionHelper.js";

const router = new Hono();

// GET /api/security/policy - Read security policy
router.get("/policy", async (c) => {
  try {
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const policy = config?.value ? { ...DEFAULT_SECURITY_POLICY, ...config.value } : DEFAULT_SECURITY_POLICY;
    return c.json({
      success: true,
      data: policy
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

    const maxFailedAttempts = Number(body.lockoutPolicy?.maxFailedAttempts);
    if (body.lockoutPolicy?.maxFailedAttempts !== undefined && (isNaN(maxFailedAttempts) || maxFailedAttempts <= 0 || !Number.isInteger(maxFailedAttempts))) {
      return c.json({ success: false, message: "تعداد تلاش‌های ناموفق احراز هویت باید یک عدد صحیح مثبت (بزرگتر از صفر) باشد." }, 400);
    }

    const existingConfig = await db.collection("system_settings").findOne({ key: "security_policy" });
    const existingVal = existingConfig?.value || DEFAULT_SECURITY_POLICY;

    const newPolicy = {
      passwordPolicy: {
        minLength: Number(body.passwordPolicy?.minLength) || 8,
        requireUppercase: !!body.passwordPolicy?.requireUppercase,
        requireLowercase: !!body.passwordPolicy?.requireLowercase,
        requireNumbers: !!body.passwordPolicy?.requireNumbers,
        requireSpecialChars: !!body.passwordPolicy?.requireSpecialChars,
      },
      lockoutPolicy: {
        maxFailedAttempts: maxFailedAttempts > 0 ? maxFailedAttempts : 5,
        lockoutDurationMinutes: Math.max(1, Number(body.lockoutPolicy?.lockoutDurationMinutes) || 15),
      },
      sessionPolicy: {
        tokenExpiresInHours: Math.max(1, Number(body.sessionPolicy?.tokenExpiresInHours) || 8),
        maxConcurrentSessions: Math.max(1, Number(body.sessionPolicy?.maxConcurrentSessions) || 3),
        idleTimeoutMinutes: Math.max(1, Number(body.sessionPolicy?.idleTimeoutMinutes) || 30),
      },
      entityAccessPolicies: body.entityAccessPolicies || existingVal.entityAccessPolicies || DEFAULT_SECURITY_POLICY.entityAccessPolicies,
      activeUserSecurityChangePolicy: body.activeUserSecurityChangePolicy || existingVal.activeUserSecurityChangePolicy || DEFAULT_SECURITY_POLICY.activeUserSecurityChangePolicy,
    };

    await db.collection("system_settings").updateOne(
      { key: "security_policy" },
      { $set: { key: "security_policy", value: newPolicy, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    // ۴. تمامی تغییرات در پیکربندی و رفتار کارکردی محصول
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      resource: "system_settings",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
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

// GET /api/security/entity-policies - Read active entity access control policies
router.get("/entity-policies", async (c) => {
  try {
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const entityPolicies = config?.value?.entityAccessPolicies || DEFAULT_SECURITY_POLICY.entityAccessPolicies;
    return c.json({
      success: true,
      data: entityPolicies
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// PUT /api/security/entity-policies - Update active entity access control policies (Admin only)
router.put("/entity-policies", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const body = await c.req.json();
    const db = getDb();

    if (!Array.isArray(body.entityAccessPolicies)) {
      return c.json({ success: false, message: "فرمت خط‌مشی‌های کنترل دسترسی نامعتبر است." }, 400);
    }

    const config = await db.collection("system_settings").findOne({ key: "security_policy" });
    const currentVal = config?.value || DEFAULT_SECURITY_POLICY;
    const updatedPolicy = {
      ...currentVal,
      entityAccessPolicies: body.entityAccessPolicies
    };

    await db.collection("system_settings").updateOne(
      { key: "security_policy" },
      { $set: { key: "security_policy", value: updatedPolicy, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: "به‌روزرسانی خط‌مشی‌های کنترل دسترسی موجودیت‌ها و عملیات",
      eventType: AFTA_LOG_EVENT_TYPES.FUNCTION_BEHAVIOR_CHANGE,
      resource: "entity_access_policies",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { updatedPoliciesCount: body.entityAccessPolicies.length }
    });

    return c.json({
      success: true,
      message: "خط‌مشی‌های کنترل دسترسی موجودیت‌ها و عملیات با موفقیت به‌روزرسانی شد.",
      data: body.entityAccessPolicies
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/audit-logs - Advanced audit log retrieval (Admin only)
router.get("/audit-logs", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    const db = getDb();
    const { username, action, eventType, result, osType, ip, resource, shamsiDate, search, sortBy = "createdAt", sortOrder = "desc", page = "1", limit = "50" } = c.req.query();
    
    const query: any = {};
    if (username) query.username = { $regex: username, $options: "i" };
    if (action) query.action = { $regex: action, $options: "i" };
    if (eventType) query.eventType = { $regex: eventType, $options: "i" };
    if (result) query.result = result;
    if (osType) query.osType = osType;
    if (ip) query.ip = { $regex: ip, $options: "i" };
    if (resource) query.resource = { $regex: resource, $options: "i" };
    if (shamsiDate) query.shamsiDate = { $regex: shamsiDate, $options: "i" };

    if (search && typeof search === "string" && search.trim() !== "" && search !== "undefined" && search !== "null" && !search.includes("function")) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { username: searchRegex },
        { userFullName: searchRegex },
        { action: searchRegex },
        { eventType: searchRegex },
        { resource: searchRegex },
        { ip: searchRegex },
        { osName: searchRegex },
        { browser: searchRegex },
        { shamsiDate: searchRegex }
      ];
    }

    const validSortFields: Record<string, string> = {
      createdAt: "createdAt",
      shamsiDateTime: "createdAt",
      username: "username",
      action: "action",
      osName: "osName",
      ip: "ip",
      durationMs: "durationMs"
    };

    const sortField = validSortFields[sortBy] || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const total = await db.collection("audit_logs").countDocuments(query);
    const logs = await db.collection("audit_logs")
      .find(query)
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const enrichedLogs = logs.map((log: any) => ({
      ...log,
      isIntegrityValid: verifyLogIntegrity(log)
    }));

    // ۳. خواندن اطلاعات از ثبت‌نشان‌ها (موفق)
    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "audit_logs",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { query, totalReturned: enrichedLogs.length }
    });

    return c.json({
      success: true,
      data: enrichedLogs,
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

// GET /api/security/audit-logs/verify-integrity - Complete database integrity check (Admin only)
router.get("/audit-logs/verify-integrity", requireRole(["admin"]), async (c) => {
  const payload = (c.get as any)("jwtPayload");
  try {
    await signExistingLogs();
    const db = getDb();
    const allLogs = await db.collection("audit_logs").find({}).limit(2000).toArray();
    
    let validCount = 0;
    let tamperedCount = 0;
    const tamperedEntries: any[] = [];

    for (const log of allLogs) {
      const isValid = verifyLogIntegrity(log);
      if (isValid) {
        validCount++;
      } else {
        tamperedCount++;
        tamperedEntries.push({
          _id: log._id,
          username: log.username,
          action: log.action,
          shamsiDateTime: log.shamsiDateTime,
          timestamp: log.timestamp
        });
      }
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      action: "اسکن و اعتبارسنجی سلامت اصالت ثبت‌نشان‌ها",
      eventType: AFTA_LOG_EVENT_TYPES.AUDIT_LOG_READ_SUCCESS,
      resource: "audit_logs_integrity",
      result: tamperedCount === 0 ? "SUCCESS" : "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { totalScanned: allLogs.length, validCount, tamperedCount }
    });

    return c.json({
      success: true,
      totalScanned: allLogs.length,
      validCount,
      tamperedCount,
      isFullySecure: tamperedCount === 0,
      tamperedEntries
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/active-sessions - List active user sessions (Admin only)
router.get("/active-sessions", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    const sessions = await pruneExpiredSessions(db);
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
      await db.collection("revoked_tokens").updateOne(
        { token },
        { $set: { token, revokedAt: new Date().toISOString(), reason: "خروج توسط مدیر سیستم" } },
        { upsert: true }
      );
      await db.collection("active_sessions").deleteOne({ token });
    } else if (sessionId) {
      let queryFilter: any = { _id: sessionId };
      try {
        if (typeof sessionId === "string" && ObjectId.isValid(sessionId)) {
          queryFilter = { $or: [{ _id: sessionId }, { _id: new ObjectId(sessionId) }] };
        }
      } catch (_) {}

      const session = await db.collection("active_sessions").findOne(queryFilter);
      if (session?.token) {
        await db.collection("revoked_tokens").updateOne(
          { token: session.token },
          { $set: { token: session.token, revokedAt: new Date().toISOString(), reason: "خروج توسط مدیر سیستم" } },
          { upsert: true }
        );
      }
      await db.collection("active_sessions").deleteMany(queryFilter);
    }

    await logAuditEvent({
      userId: payload.sub,
      username: payload.username,
      userRole: payload.role,
      action: AFTA_LOG_EVENT_TYPES.INACTIVE_SESSION_TERMINATED_BY_ADMIN,
      eventType: AFTA_LOG_EVENT_TYPES.INACTIVE_SESSION_TERMINATED_BY_ADMIN,
      resource: "active_sessions",
      result: "SUCCESS",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      userAgent: c.req.header("user-agent"),
      details: { sessionId, tokenRevoked: !!token }
    });

    return c.json({ success: true, message: "نشست کاربر با موفقیت باطل شد." });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// GET /api/security/storage-status - دریافت وضعیت ظرفیت ذخیره‌سازی ثبت‌نشان‌ها و پیام‌های هشدار
router.get("/storage-status", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    const totalLogs = await db.collection("audit_logs").countDocuments();
    const threshold = 10000;
    const notifications = await db.collection("system_notifications")
      .find({ recipientRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const unreadCount = notifications.filter(n => !n.read).length;

    return c.json({
      success: true,
      totalLogs,
      threshold,
      percentageUsed: Number(((totalLogs / threshold) * 100).toFixed(1)),
      unreadNotificationsCount: unreadCount,
      notifications
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/test-threshold-alert - شبیه‌سازی و تست ارسال پیام هشدار حد آستانه ۱۰,۰۰۰ به ادمین
router.post("/test-threshold-alert", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    const totalLogs = await db.collection("audit_logs").countDocuments();
    
    // ارسال پیام هشدار آزمایشی در سامانه
    await sendAdminThresholdNotification({
      currentCount: Math.max(totalLogs, 10000),
      threshold: 10000,
      actionTaken: "تست آزمایشی اعلان سامانه هنگام سرریز حد آستانه ۱۰,۰۰۰ رکورد",
      isSimulated: true
    });

    return c.json({
      success: true,
      message: "هشدار آزمایشی حد آستانه ۱۰,۰۰۰ لاگ با موفقیت در سامانه ثبت و صادر گردید."
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/notifications/mark-read - علامت‌گذاری پیام‌ها به‌عنوان خوانده‌شده
router.post("/notifications/mark-read", requireRole(["admin"]), async (c) => {
  try {
    const db = getDb();
    await db.collection("system_notifications").updateMany(
      { recipientRole: "admin" },
      { $set: { read: true } }
    );
    return c.json({ success: true, message: "پیام‌ها با موفقیت به‌عنوان خوانده‌شده علامت‌گذاری شدند." });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /api/security/prune-logs - اجرای فوری عملیات پاکسازی لاگ‌های قدیمی‌تر از ۳ ماه و چرخش ظرفیت ۱۰,۰۰۰
router.post("/prune-logs", requireRole(["admin"]), async (c) => {
  try {
    const result = await runAuditLogRetentionAndRotation();
    return c.json({
      success: true,
      message: `عملیات پاکسازی و چرخش لاگ‌ها با موفقیت اجرا شد. (پاکسازی ${result.prunedByAge} لاگ قدیمی‌تر از ۳ ماه، چرخش ${result.prunedByCapacity} لاگ ظرفیت ۱۰,۰۰۰)`,
      result
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
