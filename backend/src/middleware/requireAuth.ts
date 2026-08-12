import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/auth.js";
import { getDb } from "../db/index.js";
import { ObjectId } from "mongodb";

export const requireAuth = createMiddleware(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ success: false, message: "احراز هویت الزامی است" }, 401);
  }

  const rawToken = header.slice(7);
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

    // Token Revocation check
    const revokedSession = await db.collection("revoked_tokens").findOne({ token: rawToken });
    if (revokedSession) {
      return c.json({ success: false, message: "نشست شما باطل شده است. لطفاً دوباره وارد شوید." }, 401);
    }

    // Attach enriched user information and permissions to Hono context
    c.set("jwtPayload", {
      ...payload,
      role: user.role || payload.role || "حسابدار",
      permissions: user.permissions || {},
    });
    
    await next();
  } catch (err) {
    return c.json({ success: false, message: "خطا در احراز هویت سرور" }, 500);
  }
});
