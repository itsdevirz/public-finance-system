import crypto from "crypto";

// مخزن نگهداشت توکن‌های یکبارمصرف CSRF همراه با زمان انقضا
// key: token, value: expiryTimestamp
const activeCsrfTokens = new Map<string, number>();

// مدت زمان اعتبار هر توکن CSRF (مثلاً ۱۵ دقیقه)
const CSRF_TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * پاکسازی خودکار توکن‌های منقضی‌شده از حافظه
 */
function cleanupExpiredCsrfTokens() {
  const now = Date.now();
  for (const [token, expiry] of activeCsrfTokens.entries()) {
    if (now > expiry) {
      activeCsrfTokens.delete(token);
    }
  }
}

// اجرای دوره‌ای پاکسازی حافظه هر ۵ دقیقه
setInterval(cleanupExpiredCsrfTokens, 5 * 60 * 1000).unref();

/**
 * ایجاد یک توکن جدید Anti-CSRF امن و ذخیره آن در مخزن توکن‌های فعال
 */
export function generateCsrfToken(): string {
  cleanupExpiredCsrfTokens();
  const rawBytes = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const token = `${rawBytes}.${timestamp}`;

  // ثبت توکن با زمان انقضا
  activeCsrfTokens.set(token, timestamp + CSRF_TOKEN_TTL_MS);
  return token;
}

/**
 * اعتبارسنجی و منقضی‌سازی یکباره توکن CSRF (Per-Request Rotation)
 * در صورت معتبر بودن، توکن بلافاصله از مخزن حذف می‌شود تا امکان استفاده مجدد (Replay) وجود نداشته باشد.
 */
export function validateAndConsumeCsrfToken(incomingToken: string | undefined | null): boolean {
  if (!incomingToken || typeof incomingToken !== "string") {
    return false;
  }

  const expiry = activeCsrfTokens.get(incomingToken);
  if (!expiry) {
    return false; // توکن نامعتبر است یا قبلاً منقضی/مصرف شده است
  }

  if (Date.now() > expiry) {
    activeCsrfTokens.delete(incomingToken);
    return false; // توکن منقضی شده است
  }

  // 🌟 منقضی‌سازی آنی توکن استفاده‌شده (یکبارمصرف بودن توکن در هر درخواست)
  activeCsrfTokens.delete(incomingToken);
  return true;
}
