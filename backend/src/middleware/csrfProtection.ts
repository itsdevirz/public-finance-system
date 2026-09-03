import { createMiddleware } from "hono/factory";
import { generateCsrfToken, validateAndConsumeCsrfToken } from "../lib/csrfHelper.js";
import { logAuditEvent, AFTA_LOG_EVENT_TYPES } from "../lib/auditLogger.js";

// متدهای تغییردهنده حالت که نیازمند اعتبارسنجی توکن Anti-CSRF هستند
const SENSITIVE_HTTP_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

// مسیرهای استثنا (مانند ورود اولیه کاربر که قبل از دریافت توکن انجام می‌شود)
const EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/setup-status",
  "/api/auth/csrf-token",
  "/api/security/audit-failure",
  "/api/security/audit-failure-batch"
]);

export const csrfProtection = createMiddleware(async (c, next) => {
  const method = c.req.method.toUpperCase();
  const path = c.req.path.toLowerCase();

  // ۱. تولید توکن جدید برای چرخش در هر درخواست (Per-Request Rotation)
  const newlyRotatedCsrfToken = generateCsrfToken();

  // همیشه توکن چرخشی جدید را در سرآیند پاسخ قرار می‌دهیم
  c.header("X-CSRF-Token", newlyRotatedCsrfToken);
  c.header("Access-Control-Expose-Headers", "X-CSRF-Token, X-Correlation-ID");

  // اگر مسیر عمومی یا از متدهای خواندن (GET, HEAD, OPTIONS) باشد، اعتبارسنجی را رد می‌کنیم
  if (!SENSITIVE_HTTP_METHODS.has(method) || EXEMPT_PATHS.has(path)) {
    await next();
    return;
  }

  // ۲. دریافت توکن ارسالی کلاینت از هدر یا کوئری/بادی
  const incomingCsrfToken = c.req.header("x-csrf-token") || c.req.header("X-CSRF-Token") || c.req.query("_csrf");

  // ۳. اعتبارسنجی و منقضی‌سازی توکن قبلی (انقضا و مصرف یک‌باره)
  const isValid = validateAndConsumeCsrfToken(incomingCsrfToken);

  if (!isValid) {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "127.0.0.1";
    const userAgent = c.req.header("user-agent") || "Unknown";
    const payload = (c.get as any)("jwtPayload");

    await logAuditEvent({
      userId: payload?.sub,
      username: payload?.username || "anonymous",
      userRole: payload?.role || "ناشناس",
      action: `عدم پذیرش درخواست فرم حساس به علت توکن Anti-CSRF نامعتبر یا منقضی‌شده (${method} ${path})`,
      eventType: AFTA_LOG_EVENT_TYPES.AUTH_FINAL_OUTCOME,
      resource: path,
      method,
      result: "FAILURE",
      ip,
      userAgent,
      errorCode: 403,
      details: {
        reason: "Anti-CSRF Token Validation Failed or Token Reused",
        method,
        path
      }
    });

    return c.json(
      {
        success: false,
        message: "توکن امنیتی Anti-CSRF نامعتبر، منقضی شده یا قبلاً استفاده شده است. توکن جدید در سرآیند X-CSRF-Token ارسال شد.",
        csrfToken: newlyRotatedCsrfToken
      },
      403
    );
  }

  // در صورت معتبر بودن توکن، ادامه پردازش انجام می‌شود
  await next();
});
