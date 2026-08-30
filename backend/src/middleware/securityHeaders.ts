import { createMiddleware } from "hono/factory";

export const securityHeaders = createMiddleware(async (c, next) => {
  await next();

  // ۱. کنترل کش و عدم نگهداری اطلاعات حساس در حافظه پنهان مرورگر/پروکسی (Cache Control)
  c.header("Cache-Control", "no-cache, no-store, must-revalidate");
  c.header("Pragma", "no-store");
  c.header("Expires", "0");

  // ۲. جلوگیری از سوءاستفاده از MIME Type و تزریق اسکریپت (X-Content-Type-Options)
  c.header("X-Content-Type-Options", "nosniff");

  // ۳. جلوگیری از حملات Clickjacking و نمایش در iframe (X-Frame-Options)
  c.header("X-Frame-Options", "DENY");

  // ۴. فعال‌سازی فیلتر مرورگر برای جلوگیری از حملات Cross-Site Scripting (X-XSS-Protection)
  c.header("X-XSS-Protection", "1; mode=block");

  // ۵. اجبار به استفاده از پروتکل امن HTTPS و HSTS Preload (Strict-Transport-Security)
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // ۶. سایر سرآیندهای امنیتی مکمل (Referrer Policy, Permissions Policy, CSP)
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=()");
  c.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http: https:;");
});

