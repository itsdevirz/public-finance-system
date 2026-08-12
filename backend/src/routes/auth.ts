import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../lib/auth.js";
import { validatePassword, DEFAULT_SECURITY_POLICY } from "../lib/securityPolicy.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "../lib/auditLogger.js";

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

  // Get current security policy
  const secPolicySetting = await db.collection("system_settings").findOne({ key: "security_policy" });
  const secPolicy = secPolicySetting?.value || DEFAULT_SECURITY_POLICY;
  const maxAttempts = secPolicy.lockoutPolicy?.maxFailedAttempts || 5;
  const lockoutMin = secPolicy.lockoutPolicy?.lockoutDurationMinutes || 15;

  // ۱۳. بررسی درخواست روی موجودیت غیرفعال یا مسدود
  if (user) {
    if (user.status === "غیرفعال") {
      await logAuditEvent({
        userId: user._id,
        username: user.username,
        action: AFTA_LOG_EVENT_TYPES.INACTIVE_ENTITY_OPERATION,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/login",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: 403,
        details: { status: "غیرفعال" }
      });
      return c.json({ message: "حساب کاربری شما غیرفعال شده است." }, 403);
    }

    if (user.status === "مسدود") {
      const lockUntil = user.lockoutUntil ? new Date(user.lockoutUntil).valueOf() : 0;
      if (lockUntil && Date.now() < lockUntil) {
        const remaining = Math.ceil((lockUntil - Date.now()) / (60 * 1000));
        await logAuditEvent({
          userId: user._id,
          username: user.username,
          action: AFTA_LOG_EVENT_TYPES.INACTIVE_ENTITY_OPERATION,
          eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
          resource: "auth/login",
          result: "FAILURE",
          ip,
          userAgent,
          errorCode: 403,
          details: { status: "مسدود", lockoutRemainingMinutes: remaining }
        });
        return c.json({ message: `حساب کاربری مسدود است. لطفاً ${remaining} دقیقه دیگر دوباره تلاش کنید.` }, 403);
      } else if (lockUntil && Date.now() >= lockUntil) {
        // Unlock expired lockout
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { status: "فعال", failedLoginAttempts: 0 }, $unset: { lockoutUntil: "" } }
        );
        user.status = "فعال";
        user.failedLoginAttempts = 0;
      } else {
        return c.json({ message: "حساب کاربری شما مسدود است." }, 403);
      }
    }
  }

  // ۱۰. بررسی گذرواژه (Constant-time password verification)
  const valid = user
    ? await verifyPassword(password, user.password as string)
    : await verifyPassword(password, "$2b$12$invalidhashpadding000000000000000000000000000000000000");

  if (!user || !valid) {
    if (user) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates: any = { failedLoginAttempts: newAttempts };

      if (newAttempts >= maxAttempts) {
        updates.status = "مسدود";
        updates.lockoutUntil = new Date(Date.now() + lockoutMin * 60 * 1000).toISOString();
      }

      await db.collection("users").updateOne({ _id: user._id }, { $set: updates });

      // ۱۰ & ۹ & ۱۱. ثبت شکست بررسی گذرواژه، نتیجه نهایی و شکست انتساب
      await logAuditEvent({
        userId: user._id,
        username: user.username,
        action: AFTA_LOG_EVENT_TYPES.PASSWORD_VERIFY_FAILURE,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/login",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: 401,
        details: { failedAttempts: newAttempts, locked: newAttempts >= maxAttempts }
      });
    } else {
      await logAuditEvent({
        username: cleanUsername,
        action: AFTA_LOG_EVENT_TYPES.PASSWORD_VERIFY_FAILURE,
        eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
        resource: "auth/login",
        result: "FAILURE",
        ip,
        userAgent,
        errorCode: 401,
        details: { reason: "User not found" }
      });
    }

    return c.json({ message: "نام کاربری یا رمز عبور اشتباه است" }, 401);
  }

  // Successful Login: Reset failed attempts & create token
  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lastLogin: new Date().toISOString() }, $unset: { lockoutUntil: "" } }
  );

  const token = signToken({
    sub: (user._id as ObjectId).toHexString(),
    username: user.username,
    role: user.role || "حسابدار"
  });

  // ۱۱. موفقیت انتساب ویژگی‌های امنیتی به موجودیت فعال (ایجاد نشست)
  await db.collection("active_sessions").insertOne({
    userId: user._id,
    username: user.username,
    token,
    ip,
    userAgent,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  });

  // ۱۰ & ۹ & ۱۱. ثبت موفقیت بررسی پسوورد و نتیجه نهایی ورود
  await logAuditEvent({
    userId: user._id,
    username: user.username,
    action: AFTA_LOG_EVENT_TYPES.PASSWORD_VERIFY_SUCCESS,
    eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
    resource: "auth/login",
    result: "SUCCESS",
    ip,
    userAgent,
    details: { role: user.role }
  });

  const { password: _, ...safeUser } = user;
  return c.json({
    message: "ورود موفق",
    token,
    user: { ...safeUser, id: (user._id as ObjectId).toHexString() },
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
        action: "خروج از سیستم (ابطال نشست)",
        eventType: AFTA_LOG_EVENT_TYPES.SECURITY_ATTR_BINDING_FAILURE,
        resource: "auth/logout",
        result: "SUCCESS",
        ip: c.req.header("x-forwarded-for") || "127.0.0.1"
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

  const { password: _, ...safeUser } = user;
  return c.json({ user: { ...safeUser, id: payload.sub } });
});

export default router;
