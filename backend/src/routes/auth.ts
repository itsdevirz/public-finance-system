import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../lib/auth.js";
import { validatePassword, DEFAULT_SECURITY_POLICY } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "../lib/auditLogger.js";
import { parseUserAgent } from "../lib/uaParser.js";
import { pruneExpiredSessions } from "../lib/sessionHelper.js";

const router = new Hono();

// GET /api/auth/setup-status
router.get("/setup-status", async (c) => {
  const db = getDb();
  const adminCount = await db.collection("users").countDocuments({ role: "admin" });
  return c.json({ hasAdmin: adminCount > 0 });
});

// POST /api/auth/register  (فقط برای ساخت اولین ادمین)
router.post("/register", async (c) => {
  const { username, password, role = "admin" } = await c.req.json();
  if (!username || !password) {
    return c.json({ message: "username و password الزامی است" }, 400);
  }

  const db = getDb();
  const adminExists = await db.collection("users").countDocuments({ role: "admin" }) > 0;
  if (adminExists) {
    return c.json({ message: "ثبت‌نام غیرفعال است زیرا مدیر سیستم از قبل تعریف شده است." }, 403);
  }

  // ۷ & ۱۰. بررسی صحت داده کاربری و کلمه عبور
  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    await logAuditEvent({
      username: username.trim().toLowerCase(),
      action: AFTA_LOG_EVENT_TYPES.USER_DATA_VALIDATION_FAILURE,
      eventType: AFTA_LOG_EVENT_TYPES.PASSWORD_VERIFY_FAILURE,
      resource: "auth/register",
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      details: { reason: passCheck.message }
    });
    return c.json({ message: passCheck.message }, 400);
  }

  const exists = await db.collection("users").findOne({ username: username.trim().toLowerCase() });
  if (exists) return c.json({ message: "این نام کاربری قبلاً ثبت شده" }, 409);

  const hashed = await hashPassword(password);
  const doc = {
    username: username.trim().toLowerCase(),
    password: hashed,
    role,
    status: "فعال",
    failedLoginAttempts: 0,
    created_at: new Date()
  };

  const result = await db.collection("users").insertOne(doc);

  // ۱۱ & ۱۲. انتساب ویژگی‌های امنیتی و ایجاد موجودیت اولیه
  await logAuditEvent({
    userId: result.insertedId,
    username: doc.username,
    action: AFTA_LOG_EVENT_TYPES.SECURITY_ATTR_BINDING_SUCCESS,
    eventType: AFTA_LOG_EVENT_TYPES.SECURITY_ATTR_CHANGE,
    resource: "users",
    result: "SUCCESS",
    ip: c.req.header("x-forwarded-for") || "127.0.0.1",
    details: { role: doc.role, status: doc.status }
  });

  return c.json({ message: "کاربر ثبت شد", id: result.insertedId.toHexString() }, 201);
});

// POST /api/auth/login
router.post("/login", async (c) => {
  const ip = c.req.header("x-forwarded-for") || "127.0.0.1";
  const userAgent = c.req.header("user-agent") || "Unknown";
  const { username, password } = await c.req.json();

  // ۸. ثبت فراخوانی سازوکار احراز هویت
  await logAuditEvent({
    username: username ? String(username).trim().toLowerCase() : "anonymous",
    action: AFTA_LOG_EVENT_TYPES.AUTH_MECHANISM_USAGE,
    eventType: AFTA_LOG_EVENT_TYPES.AUTH_MECHANISM_USAGE,
    resource: "auth/login",
    result: "SUCCESS",
    ip,
    userAgent
  });

  if (!username || !password) {
    return c.json({ message: "username و password الزامی است" }, 400);
  }

  const db = getDb();
  const cleanUsername = username.trim().toLowerCase();
  const user = await db.collection("users").findOne({ username: cleanUsername });

  // Get current security policy (Admin configured or default positive integer limit)
  const secPolicySetting = await db.collection("system_settings").findOne({ key: "security_policy" });
  const secPolicy = secPolicySetting?.value || DEFAULT_SECURITY_POLICY;
  const globalMaxAttempts = Math.max(1, Number(secPolicy.lockoutPolicy?.maxFailedAttempts) || 5);
  const maxAttempts = (user && typeof user.maxFailedAttempts === "number" && user.maxFailedAttempts > 0)
    ? user.maxFailedAttempts
    : globalMaxAttempts;
  const lockoutMin = Math.max(1, Number(secPolicy.lockoutPolicy?.lockoutDurationMinutes) || 15);

  // ۱۳. بررسی درخواست روی موجودیت غیرفعال یا مسدود
  if (user) {
    if (user.status === "غیرفعال" || user.status === "مسدود") {
      const actionDesc = "کاربر مورد نظر غیرفعال می باشد،لطفا در زمان دیگری مجددا تلاش کنید و یا جهت فعال سازی با مدیر سیستم تماس بگیرید.";
      await logAuditEvent({
        userId: user._id,
        username: user.username,
        userRole: user.role || "کارمند",
        action: actionDesc,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/login",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: 403,
        details: {
          status: user.status,
          requestType: "ورود به سامانه",
          requestResult: "ناموفق"
        }
      });
      return c.json({ message: "حساب کاربری شما غیرفعال شده است. لطفاً جهت فعال‌سازی مجدد با مدیر سیستم تماس بگیرید." }, 403);
    }
  }

  // ۱۰. بررسی گذرواژه (Constant-time password verification)
  const parsedUa = parseUserAgent(userAgent);
  const valid = user
    ? await verifyPassword(password, user.password as string)
    : await verifyPassword(password, "$2b$12$invalidhashpadding000000000000000000000000000000000000");

  if (!user || !valid) {
    if (user) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const isLimitReached = newAttempts >= maxAttempts;
      const updates: any = { failedLoginAttempts: newAttempts };

      if (isLimitReached) {
        updates.status = "غیرفعال";
        updates.deactivatedAt = new Date().toISOString();
      }

      const historyEntry = {
        timestamp: new Date().toISOString(),
        result: "FAILURE",
        ip,
        userAgent,
        osName: parsedUa.osName,
        browserName: parsedUa.browserName,
        authMethod: user.authMethod || "PASSWORD",
        reason: isLimitReached ? "حساب غیرفعال شد (تجاوز از سقف ورود)" : "رمز عبور اشتباه"
      };

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: updates,
          $push: { authHistory: { $each: [historyEntry], $slice: -10 } } as any
        }
      );

      // ۱۰ & ۹ & ۱۱. ثبت شکست بررسی گذرواژه، نتیجه نهایی و شکست انتساب
      const actionDesc = isLimitReached
        ? "کاربر مورد نظر به علت تلاش غیر مجاز جهت ورود به سامانه غیر فعال شد."
        : `تلاش ناموفق جهت ورود به سامانه با نام کاربری '${cleanUsername}'`;

      await logAuditEvent({
        userId: user._id,
        username: user.username,
        userRole: user.role || "کارمند",
        action: actionDesc,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/login",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: isLimitReached ? 403 : 401,
        details: {
          failedAttempts: newAttempts,
          maxAttempts,
          deactivated: isLimitReached,
          requestType: "ورود به سامانه",
          requestResult: "ناموفق"
        }
      });

      if (isLimitReached) {
        return c.json({
          message: "حساب کاربری شما به دلیل تلاش‌های ناموفق مکرر غیرفعال شد. جهت فعال‌سازی مجدد با مدیر سیستم تماس بگیرید."
        }, 403);
      }

      const remainingAttempts = maxAttempts - newAttempts;
      return c.json({
        message: `نام کاربری یا رمز عبور اشتباه است. (تعداد تلاش‌های مجاز باقی‌مانده: ${remainingAttempts})`
      }, 401);
    } else {
      const actionDesc = `تلاش ناموفق جهت ورود به سامانه با نام کاربری '${cleanUsername}'`;
      await logAuditEvent({
        username: cleanUsername,
        userRole: "کارمند",
        action: actionDesc,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/login",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: 401,
        details: {
          reason: "User not found",
          requestType: "ورود به سامانه",
          requestResult: "ناموفق"
        }
      });
      return c.json({ message: "نام کاربری یا رمز عبور اشتباه است." }, 401);
    }
  }

  const preventionRules = secPolicy.activeToInactivePreventionRules;
  const thresholdFromPreventionRule = (preventionRules?.preventAccessOnExceedingSessionThreshold && typeof preventionRules?.sessionThresholdLimit === "number")
    ? preventionRules.sessionThresholdLimit
    : null;

  const userMaxSessions = (user && typeof user.maxConcurrentSessions === "number" && user.maxConcurrentSessions > 0)
    ? user.maxConcurrentSessions
    : (thresholdFromPreventionRule ?? secPolicy.sessionPolicy?.maxConcurrentSessions ?? 3);

  const overflowAction = secPolicy.sessionPolicy?.overflowAction || "block"; // "block" or "evict_oldest"
  
  // 1. Automatically prune expired or revoked sessions first
  const existingActiveSessions = await pruneExpiredSessions(db, user._id);
  const activeCount = existingActiveSessions.length;

  const newSessionNotice = {
    timestamp: new Date().toISOString(),
    newIp: ip,
    newBrowser: parsedUa.browserName,
    newOs: parsedUa.osName
  };

  if (activeCount >= userMaxSessions) {
    if (userMaxSessions === 1 || overflowAction === "evict_oldest") {
      // مرتب‌سازی نشست‌های موجود از قدیمی‌ترین به جدیدترین
      const sortedSessions = [...existingActiveSessions].sort((a: any, b: any) => {
        const timeA = new Date(a.lastActivity || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastActivity || b.createdAt || 0).getTime();
        return timeA - timeB;
      });

      const toEvictCount = activeCount - userMaxSessions + 1;
      const sessionsToEvict = sortedSessions.slice(0, toEvictCount);

      for (const sess of sessionsToEvict) {
        if (sess.token) {
          await db.collection("revoked_tokens").updateOne(
            { token: sess.token },
            {
              $set: {
                token: sess.token,
                revokedAt: new Date().toISOString(),
                reason: userMaxSessions === 1 ? "انقضا به دلیل ورود جدید کاربر (قاعده تک‌نشستی)" : "خروج خودکار قدیمی‌ترین نشست به علت تکمیل سقف همزمانی"
              }
            },
            { upsert: true }
          );
        }
        await db.collection("active_sessions").deleteOne({ _id: sess._id });
      }

      await logAuditEvent({
        userId: user._id,
        username: user.username,
        userRole: user.role === "admin" ? "مدیر" : (user.role || "مدیر مالی"),
        action: `ابطال خودکار ${sessionsToEvict.length} نشست قدیمی کاربر '${user.username}' جهت برقراری نشست جدید`,
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_ATTR_CHANGE,
        resource: "نشست‌های فعال",
        result: "SUCCESS",
        ip,
        userAgent
      });
    } else {
      // 🌟 محدودیت نشست‌های همزمان پرسنلی
      const actionMessage = `کاربر '${user.username}' دارای ${activeCount} نشست فعال می‌باشد و امکان ورود جدید وجود ندارد. (سقف مجاز: ${userMaxSessions} نشست)`;

      await logAuditEvent({
        userId: user._id,
        username: user.username,
        userRole: user.role === "admin" ? "مدیر" : (user.role || "مدیر مالی"),
        action: actionMessage,
        eventType: AFTA_LOG_EVENT_TYPES.CONCURRENT_SESSION_LIMIT_EXCEEDED,
        resource: "لاگ های احراز هویت",
        method: "POST",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: 403,
        details: {
          key: "8-2-1",
          tableName: "لاگ های احراز هویت",
          aftaClause: "8-2-1",
          requestType: "ورود به سامانه",
          requestResult: "ناموفق",
          activeCount,
          maxSessions: userMaxSessions,
          message: actionMessage
        }
      });

      return c.json({ message: actionMessage }, 403);
    }
  }

  // استخراج آخرین تلاش موفق، آخرین تلاش ناموفق و تعداد تلاش‌های ناموفق بر اساس خط‌مشی‌های تنظیم‌شده در سیستم
  const previousAuthHistory = (user.authHistory || []) as any[];
  const lastSuccessfulAttempt = [...previousAuthHistory].reverse().find((h: any) => h.result === "SUCCESS") || null;
  const lastFailedAttempt = [...previousAuthHistory].reverse().find((h: any) => h.result === "FAILURE") || null;
  const failedLoginCount = user.failedLoginAttempts || 0;

  const successPolicy = secPolicy.lastSuccessfulSessionNoticePolicy ?? { enable: true, displayDate: true, displayTime: true, displayOtherInfo: true };
  const failedPolicy = secPolicy.lastFailedSessionNoticePolicy ?? { enable: true, displayDate: true, displayTime: true, displayOtherInfo: true, displayFailedAttemptsCount: true };

  const isSuccessNoticeEnabled = successPolicy.enable !== false && (successPolicy.displayDate || successPolicy.displayTime || successPolicy.displayOtherInfo);
  const isFailedNoticeEnabled = failedPolicy.enable !== false && (failedPolicy.displayDate || failedPolicy.displayTime || failedPolicy.displayOtherInfo || failedPolicy.displayFailedAttemptsCount);

  let sessionNotice: any = null;

  if (isSuccessNoticeEnabled || isFailedNoticeEnabled) {
    sessionNotice = {
      lastSuccessfulAttempt: isSuccessNoticeEnabled ? lastSuccessfulAttempt : null,
      lastFailedAttempt: isFailedNoticeEnabled ? lastFailedAttempt : null,
      failedLoginCount: (isFailedNoticeEnabled && failedPolicy.displayFailedAttemptsCount !== false) ? failedLoginCount : 0,
      loginTimestamp: new Date().toISOString(),
      policy: {
        successPolicy,
        failedPolicy
      }
    };
  }

  // Successful Login: Reset failed attempts, push authHistory & create token
  const successHistoryEntry = {
    timestamp: new Date().toISOString(),
    result: "SUCCESS",
    ip,
    userAgent,
    osName: parsedUa.osName,
    browserName: parsedUa.browserName,
    authMethod: user.authMethod || "PASSWORD"
  };

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: { failedLoginAttempts: 0, lastLogin: new Date().toISOString() },
      $unset: { lockoutUntil: "" },
      $push: { authHistory: { $each: [successHistoryEntry], $slice: -10 } } as any
    }
  );

  const token = signToken({
    sub: (user._id as ObjectId).toHexString(),
    username: user.username,
    role: user.role || "حسابدار"
  });

  // ۱۱. موفقیت انتساب ویژگی‌های امنیتی به موجودیت فعال (ایجاد نشست با متاداده کامل کلاینت)
  await db.collection("active_sessions").insertOne({
    userId: user._id,
    username: user.username,
    role: user.role || "حسابدار",
    permissions: user.permissions || {},
    token,
    ip,
    userAgent,
    osName: parsedUa.osName,
    osType: parsedUa.osType,
    browserName: parsedUa.browserName,
    deviceType: parsedUa.deviceType,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  });

  // ثبت رویداد تلاش موفق برای برقراری نشست (SESSION_ESTABLISHMENT_ATTEMPT)
  await logAuditEvent({
    userId: user._id,
    username: user.username,
    action: AFTA_LOG_EVENT_TYPES.SESSION_ESTABLISHMENT_ATTEMPT,
    eventType: AFTA_LOG_EVENT_TYPES.SESSION_ESTABLISHMENT_ATTEMPT,
    resource: "auth/login",
    result: "SUCCESS",
    ip,
    userAgent,
    details: { role: user.role }
  });

  // ۱۰ & ۹ & ۱۱. ثبت موفقیت بررسی پسوورد و نتیجه نهایی ورود
  await logAuditEvent({
    userId: user._id,
    username: user.username,
    userRole: user.role || "کارمند",
    action: `ورود موفقیت‌آمیز کاربر '${user.username}' به سامانه`,
    eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
    resource: "auth/login",
    result: "SUCCESS",
    ip,
    userAgent,
    details: {
      role: user.role || "کارمند",
      requestType: "ورود به سامانه",
      requestResult: "موفق"
    }
  });

  const { password: _, ...safeUser } = user;
  return c.json({
    message: "ورود موفق",
    token,
    user: { ...safeUser, id: (user._id as ObjectId).toHexString() },
    sessionNotice
  });
});

// POST /api/auth/logout
router.post("/logout", async (c) => {
  const header = c.req.header("Authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    const payload = verifyToken(token);
    const db = getDb();

    await db.collection("revoked_tokens").insertOne({ token, revokedAt: new Date().toISOString() });
    await db.collection("active_sessions").deleteOne({ token });

    if (payload) {
      await logAuditEvent({
        userId: payload.sub,
        username: payload.username,
        userRole: payload.role || "کارمند",
        action: `خروج کاربر '${payload.username}' از حساب کاربری و خاتمه نشست`,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/logout",
        result: "SUCCESS",
        ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
        userAgent: c.req.header("user-agent") || "",
        details: {
          requestType: "خروج از سامانه",
          requestResult: "موفق"
        }
      });
    }
  }

  return c.json({ success: true, message: "با موفقیت از سیستم خارج شدید." });
});

// GET /api/auth/me  (نیاز به توکن دارد)
router.get("/me", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ message: "توکن یافت نشد" }, 401);

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) return c.json({ message: "توکن نامعتبر یا منقضی شده" }, 401);

  const db = getDb();
  // Check if token was revoked
  const revoked = await db.collection("revoked_tokens").findOne({ token });
  if (revoked) return c.json({ message: "نشست شما باطل شده است." }, 401);

  const user = await db.collection("users").findOne({ _id: new ObjectId(payload.sub) });
  if (!user) return c.json({ message: "کاربر یافت نشد" }, 404);

  if (user.status === "غیرفعال" || user.status === "مسدود") {
    await logAuditEvent({
      userId: user._id,
      username: user.username,
      action: AFTA_LOG_EVENT_TYPES.INACTIVE_ENTITY_OPERATION,
      eventType: AFTA_LOG_EVENT_TYPES.INACTIVE_ENTITY_OPERATION,
      resource: "auth/me",
      result: "FAILURE",
      ip: c.req.header("x-forwarded-for") || "127.0.0.1",
      errorCode: 403,
      details: { status: user.status }
    });
    return c.json({ message: "حساب کاربری شما غیرفعال یا مسدود است." }, 403);
  }

  const activeSession = await db.collection("active_sessions").findOne({ token });

  const { password: _, ...safeUser } = user;
  return c.json({
    user: { ...safeUser, id: payload.sub },
    newSessionNotice: activeSession?.newSessionNotice || null
  });
});

// GET /api/auth/my-sessions - List active sessions for the current logged-in user (Session Initiator)
router.get("/my-sessions", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ success: false, message: "توکن یافت نشد" }, 401);

  const currentToken = header.slice(7);
  const payload = verifyToken(currentToken);
  if (!payload) return c.json({ success: false, message: "توکن نامعتبر یا منقضی شده" }, 401);

  const db = getDb();
  const userId = new ObjectId(payload.sub);

  // 1. Prune expired or idle sessions first
  const { pruneExpiredSessions } = await import("../lib/sessionHelper.js");
  const userSessions = await pruneExpiredSessions(db, userId);

  // 2. Mark current session
  const enrichedSessions = userSessions.map((session: any) => ({
    ...session,
    isCurrent: session.token === currentToken
  }));

  return c.json({ success: true, data: enrichedSessions });
});

// POST /api/auth/revoke-my-session - Allow session initiator to terminate a specific session initiated by themselves
router.post("/revoke-my-session", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ success: false, message: "توکن یافت نشد" }, 401);

  const currentToken = header.slice(7);
  const payload = verifyToken(currentToken);
  if (!payload) return c.json({ success: false, message: "توکن نامعتبر یا منقضی شده" }, 401);

  const db = getDb();
  const body = await c.req.json().catch(() => ({}));
  const { sessionId, token: targetToken } = body;

  if (!sessionId && !targetToken) {
    return c.json({ success: false, message: "شناسه نشست یا توکن جهت ابطال الزامی است." }, 400);
  }

  let queryFilter: any = {};
  if (targetToken) {
    queryFilter = { token: targetToken };
  } else if (sessionId) {
    try {
      if (typeof sessionId === "string" && ObjectId.isValid(sessionId)) {
        queryFilter = { $or: [{ _id: sessionId }, { _id: new ObjectId(sessionId) }] };
      } else {
        queryFilter = { _id: sessionId };
      }
    } catch (_) {
      queryFilter = { _id: sessionId };
    }
  }

  const session = await db.collection("active_sessions").findOne(queryFilter);

  if (!session) {
    return c.json({ success: false, message: "نشست مورد نظر یافت نشد یا قبلاً خاتمه یافته است." }, 404);
  }

  // Verification: User must be the initiator of the session (matching userId or username)
  const isInitiator = session.userId?.toString() === payload.sub || session.username === payload.username;
  if (!isInitiator && payload.role !== "admin") {
    return c.json({ success: false, message: "شما تنها مجاز به خاتمه دادن به نشست‌های آغازشده توسط خودتان هستید." }, 403);
  }

  if (session.token) {
    await db.collection("revoked_tokens").updateOne(
      { token: session.token },
      { $set: { token: session.token, revokedAt: new Date().toISOString(), reason: "خاتمه نشست توسط کاربر آغازگر" } },
      { upsert: true }
    );
  }
  await db.collection("active_sessions").deleteOne({ _id: session._id });

  await logAuditEvent({
    userId: payload.sub,
    username: payload.username,
    userRole: payload.role || "کارمند",
    action: `ابطال و خاتمه دستی نشست فعال کاربر '${session.username || payload.username}' توسط سیستم`,
    eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
    resource: "active_sessions",
    result: "SUCCESS",
    ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1",
    userAgent: c.req.header("user-agent") || "",
    details: {
      terminatedSessionId: session._id,
      targetToken: session.token,
      isCurrentSession: session.token === currentToken,
      requestType: "ابطال نشست",
      requestResult: "موفق"
    }
  });

  return c.json({
    success: true,
    message: session.token === currentToken
      ? "نشست جاری شما با موفقیت خاتمه یافت."
      : "نشست منتخب با موفقیت خاتمه یافت.",
    isCurrentTerminated: session.token === currentToken
  });
});

// POST /api/auth/revoke-other-sessions - Allow user to terminate all other remote active sessions started by themselves
router.post("/revoke-other-sessions", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ success: false, message: "توکن یافت نشد" }, 401);

  const currentToken = header.slice(7);
  const payload = verifyToken(currentToken);
  if (!payload) return c.json({ success: false, message: "توکن نامعتبر یا منقضی شده" }, 401);

  const db = getDb();
  const userId = new ObjectId(payload.sub);

  const otherSessions = await db.collection("active_sessions").find({
    userId,
    token: { $ne: currentToken }
  }).toArray();

  if (otherSessions.length === 0) {
    return c.json({ success: true, message: "هیچ نشست همزمان دیگری برای کاربر یافت نشد." });
  }

  const tokensToRevoke = otherSessions.map((s) => ({
    token: s.token,
    revokedAt: new Date().toISOString(),
    reason: "خاتمه سایر نشست‌ها توسط کاربر آغازگر"
  }));

  await db.collection("revoked_tokens").insertMany(tokensToRevoke);
  const sessionIds = otherSessions.map((s) => s._id);
  await db.collection("active_sessions").deleteMany({ _id: { $in: sessionIds } });

  await logAuditEvent({
    userId: payload.sub,
    username: payload.username,
    userRole: payload.role,
    action: AFTA_LOG_EVENT_TYPES.SESSION_TERMINATED_BY_USER,
    eventType: AFTA_LOG_EVENT_TYPES.SESSION_TERMINATED_BY_USER,
    resource: "active_sessions",
    result: "SUCCESS",
    ip: c.req.header("x-forwarded-for") || "127.0.0.1",
    userAgent: c.req.header("user-agent"),
    details: { count: otherSessions.length }
  });

  return c.json({
    success: true,
    message: `تعداد ${otherSessions.length} نشست فعال دیگر شما با موفقیت خاتمه یافتند.`
  });
});

export default router;
