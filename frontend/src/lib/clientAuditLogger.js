import api from "@/api";

const STORAGE_KEY = "client_failure_logs";

/**
 * ذخیره‌سازی محلی لاگ‌های بروز شکست در صورت عدم دسترسی به سرور
 */
function saveToLocalStorage(logEntry) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing.push(logEntry);
    // حداکثر نگه داشتن ۵۰ لاگ اخیر در حافظه مرورگر
    if (existing.length > 50) {
      existing.shift();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("خطا در ذخیره‌سازی محلی لاگ شکست:", e);
  }
}

/**
 * پاکسازی لاگ‌های ذخیره‌شده محلی پس از ارسال موفق
 */
function clearLocalStorageLogs(syncedLogs) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const remaining = existing.filter(
      (item) => !syncedLogs.some((synced) => synced.id === item.id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.error("خطا در پاکسازی لاگ‌های محلی:", e);
  }
}

/**
 * ثبت کامل رویداد بروز شکست (از جمله خطای ارتباط با سرور و محدودیت CORS)
 */
export async function logFailureOccurrence({
  userMessage = "خطا در ارتباط با سرور یا محدودیت CORS. لطفاً از روشن بودن سرور و تطابق پورت مطمئن شوید.",
  action = "شکست در ارتباط با سرور یا محدودیت CORS (بروز خطای شبکه/پورت)",
  resource = "/api/auth/login",
  method = "POST",
  errorCode = 0,
  errorType = "NetworkOrCorsError",
  rawError = null,
  username = "anonymous",
  details = {}
}) {
  const now = new Date();
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const targetBaseUrl = api.defaults?.baseURL || "http://localhost:8000";

  const fullExplanation = "تلاش ناموفق جهت برقراری ارتباط با سرور یا مسدود شدن درخواست توسط قوانین محدودیت CORS / شبکه. این رویداد نشان‌دهنده شکست در قابلیت‌های کارکردی محصول و عدم دسترسی به سرویس پشتیبان (بک‌اند) بر روی پورت تعیین‌شده می‌باشد.";

  const troubleshootingSteps = [
    "۱. بررسی و اطمینان از روشن بودن سرویس بک‌اند بر روی پورت 8000.",
    "۲. بررسی تطابق پورت و پروتکل درخواست کلاینت (HTTP/HTTPS) با سرور.",
    "۳. بررسی هدر Origin و مجوزهای دامنه درخواست‌دهنده در پیکربندی CORS سرور.",
    "۴. بررسی اتصال شبکه یا دیواره آتش (Firewall) دستگاه."
  ].join("\n");

  const failureLogEntry = {
    id: `fail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: username || "anonymous",
    action: action,
    eventType: "SYSTEM_CAPABILITY_FAILURE",
    resource: resource,
    method: method,
    result: "FAILURE",
    errorCode: errorCode || 0,
    timestamp: now.toISOString(),
    shamsiDate: now.toLocaleDateString("fa-IR"),
    shamsiTime: now.toLocaleTimeString("fa-IR"),
    shamsiDateTime: `${now.toLocaleDateString("fa-IR")} ${now.toLocaleTimeString("fa-IR")}`,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Browser Client",
    clientOrigin: origin,
    targetBaseUrl: targetBaseUrl,
    details: {
      userMessage,
      fullExplanation,
      troubleshootingSteps,
      errorType,
      errorMessage: rawError?.message || userMessage,
      aftaClause: "بند ۱ جدول ۲-۷ (شکست در قابلیت‌های کارکردی) و بند ۱ جدول ۲-۶ (حفاظت از توابع امنیتی)",
      requestTarget: `${method} ${targetBaseUrl}${resource}`,
      failureCategory: "NETWORK_OR_CORS_FAILURE",
      failureCategoryDescription: "شکست در برقرار ارتباط با سرور یا محدودیت دامنه/پورت در CORS",
      ...details
    }
  };

  // ذخیره همیشه در localStorage جهت تضمین عدم از دست رفتن لاگ شکست
  saveToLocalStorage(failureLogEntry);

  // تلاش برای ارسال مستقیم به سرور
  try {
    await api.post("/api/security/audit-failure", failureLogEntry);
    clearLocalStorageLogs([failureLogEntry]);
  } catch (err) {
    // سرور آنلاین نیست؛ لاگ در localStorage حفظ شده تا در اولین ارتباط بعدی همگام‌سازی شود.
    console.warn("سرور جهت ثبت فوری لاگ شکست در دسترس نیست. لاگ در حافظه محلی ذخیره شد.");
  }

  return failureLogEntry;
}

/**
 * همگام‌سازی لاگ‌های آفلاین شکست پس از بازگشت ارتباط سرور
 */
export async function syncOfflineFailureLogs() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!cached || cached.length === 0) return;

    const response = await api.post("/api/security/audit-failure-batch", { logs: cached });
    if (response?.data?.success) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // سرور هنوز آماده نیست
  }
}
