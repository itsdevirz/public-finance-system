import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/auth.js";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "../lib/auditLogger.js";
import { getAuthTokenFromCookieOrHeader } from "../lib/cookieHelper.js";

export const requireAuth = createMiddleware(async (c, next) => {
  if (c.req.path.includes("/security/audit-failure")) {
    return next();
  }

  const rawToken = getAuthTokenFromCookieOrHeader(c);
  if (!rawToken) {
    return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
  }

  const payload = verifyToken(rawToken);
  if (!payload) {
    return c.json({ success: false, message: "توکن نامعتبر یا منقضی شده است" }, 401);
  }

  try {
    const db = getDb();
    const userId = new ObjectId(payload.sub);
    const user = await db.collection("users").findOne({ _id: userId });

    if (!user) {
      return c.json({ success: false, message: "کاربر یافت نشد" }, 401);
    }

    // Account Status check (Active / Disabled / Locked)
    if (user.status === "غیرفعال") {
      return c.json({ success: false, message: "حساب کاربری شما غیرفعال شده است." }, 403);
    }

    if (user.status === "مسدود") {
      const lockUntil = user.lockoutUntil ? new Date(user.lockoutUntil).valueOf() : 0;
      if (lockUntil && Date.now() < lockUntil) {
        const remainingMin = Math.ceil((lockUntil - Date.now()) / (60 * 1000));
        return c.json({
          success: false,
          message: `حساب کاربری شما به دلیل تلاش‌های ناموفق مکرر مسدود است. لطفاً ${remainingMin} دقیقه دیگر دوباره تلاش کنید.`
        }, 403);
      } else if (lockUntil && Date.now() >= lockUntil) {
        // Automatically unlock after duration expires
        await db.collection("users").updateOne(
          { _id: userId },
          { $set: { status: "فعال", failedLoginAttempts: 0 }, $unset: { lockoutUntil: "" } }
        );
      } else {
        return c.json({ success: false, message: "حساب کاربری شما توسط مدیر سیستم مسدود شده است." }, 403);
      }
    }

    // Token Revocation & Active Session Idle Timeout check
    const revokedSession = await db.collection("revoked_tokens").findOne({ token: rawToken });
    if (revokedSession) {
      return c.json({ success: false, message: "نشست شما باطل شده است. لطفاً دوباره وارد شوید." }, 401);
    }

    const activeSession = await db.collection("active_sessions").findOne({ token: rawToken });
    if (activeSession) {
      const secPolicySetting = await db.collection("system_settings").findOne({ key: "security_policy" });
      const globalIdleTimeout = secPolicySetting?.value?.sessionPolicy?.idleTimeoutMinutes || 30;

      // 🌟 الزام افتا: تعیین زمان غیرفعال بودن برای کاربر مشخص یا پیش‌فرض سیستم
      const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user._id) });
      const idleTimeoutMin = (userDoc && typeof userDoc.idleTimeoutMinutes === "number" && userDoc.idleTimeoutMinutes > 0)
        ? userDoc.idleTimeoutMinutes
        : globalIdleTimeout;

      const lastActivityTime = activeSession.lastActivity ? new Date(activeSession.lastActivity).valueOf() : Date.now();
      const idleMinutes = (Date.now() - lastActivityTime) / (60 * 1000);

      if (idleMinutes > idleTimeoutMin) {
        await db.collection("revoked_tokens").insertOne({
          token: rawToken,
          revokedAt: new Date().toISOString(),
          reason: `خاتمه خودکار نشست غیرفعال کاربر '${user.username}' پس از ${Math.round(idleMinutes)} دقیقه عدم فعالیت (حد مجاز: ${idleTimeoutMin} دقیقه)`
        });
        await db.collection("active_sessions").deleteOne({ token: rawToken });

        await logAuditEvent({
          userId: user._id,
          username: user.username,
          userRole: user.role,
          action: `خاتمه و ابطال خودکار نشست غیرفعال کاربر '${user.username}' پس از ${Math.round(idleMinutes)} دقیقه عدم فعالیت (حد مجاز: ${idleTimeoutMin} دقیقه)`,
          eventType: AFTA_LOG_EVENT_TYPES.INACTIVE_SESSION_TERMINATED_BY_LOCK,
          resource: "active_sessions",
          result: "FAILURE",
          ip: c.req.header("x-forwarded-for") || "127.0.0.1",
          userAgent: c.req.header("user-agent"),
          errorCode: 401,
          details: {
            idleMinutes: Math.round(idleMinutes),
            idleTimeoutMin,
            isUserSpecific: !!userDoc?.idleTimeoutMinutes,
            aftaClause: "8-2-3"
          }
        });

        return c.json({
          success: false,
          message: `نشست شما به دلیل عدم فعالیت به مدت ${Math.round(idleMinutes)} دقیقه (فراتر از حد مجاز تعیین‌شده ${idleTimeoutMin} دقیقه) خاتمه یافت. لطفاً دوباره وارد شوید.`
        }, 401);
      } else {
        // Update last activity timestamp
        await db.collection("active_sessions").updateOne(
          { token: rawToken },
          { $set: { lastActivity: new Date().toISOString() } }
        );
      }
    }

    // Attach enriched user information and permissions to Hono context
    (c.set as any)("jwtPayload", {
      ...payload,
      role: user.role || payload.role || "حسابدار",
      permissions: user.permissions || {},
    });
    
    await next();
  } catch (err) {
    return c.json({ success: false, message: "خطا در احراز هویت سرور" }, 500);
  }
});
