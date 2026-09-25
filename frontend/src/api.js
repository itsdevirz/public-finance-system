import axios from "axios";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (window.__API_URL__) return window.__API_URL__;
    if (import.meta.env?.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (window.location && window.location.hostname) {
      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      return `${protocol}//${window.location.hostname}:8000`;
    }
  }
  return "http://localhost:8000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 30000,
});

/**
 * 🌟 پایش و عیب‌یابی خودکار هوشمند سلامت سرور و برطرف‌سازی خطای CORS و پورت
 * این تابع تمام آدرس‌ها و پورت‌های ممکن را تست کرده و پایه پورت فعال را جایگزین می‌کند.
 */
export async function checkBackendHealth() {
  const host = typeof window !== "undefined" && window.location ? window.location.hostname : "localhost";
  const candidates = [
    api.defaults.baseURL,
    `http://${host}:8000`,
    `http://localhost:8000`,
    `http://127.0.0.1:8000`,
    `http://${host}:3000`,
    `http://${host}:8080`,
    ""
  ].filter((url, idx, self) => url != null && self.indexOf(url) === idx);

  for (const baseUrl of candidates) {
    try {
      const testUrl = baseUrl ? `${baseUrl}/api/health` : "/api/health";
      const res = await axios.get(testUrl, { timeout: 3000, withCredentials: true });
      if (res.data && (res.data.status === "online" || res.data.cors === "ok")) {
        if (baseUrl !== api.defaults.baseURL) {
          api.defaults.baseURL = baseUrl;
        }
        return { isOnline: true, baseURL: baseUrl, data: res.data };
      }
    } catch (_) {}
  }
  return { isOnline: false, baseURL: api.defaults.baseURL, error: "Network Error" };
}

// ── Request Deduplication ─────────────────────────────────────────────────────
const pendingRequests = new Map(); // url → Promise

api.interceptors.request.use((config) => {
  // 🌟 اضافه کردن توکن چرخشی Anti-CSRF
  const csrfToken = sessionStorage.getItem("csrfToken") || localStorage.getItem("csrfToken");
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  // اضافه کردن correlation ID جهت پیگیری لوگ‌های امنیتی
  if (config.headers && !config.headers["X-Correlation-ID"]) {
    config.headers["X-Correlation-ID"] = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  return config;
});

// Wrapper برای GET با deduplication
const originalGet = api.get.bind(api);
api.get = function dedupedGet(url, config) {
  const paramsKey = config && config.params ? JSON.stringify(config.params) : "";
  const headersKey = config && config.headers ? JSON.stringify(config.headers) : "";
  const key = url + paramsKey + headersKey;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = originalGet(url, config).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// دریافت و ذخیره‌سازی خودکار توکن چرخشی Anti-CSRF پس از هر پاسخ سرور (Per-Request Rotation)
api.interceptors.response.use(
  (res) => {
    const rotatedCsrfToken = res.headers ? (res.headers["x-csrf-token"] || res.headers["X-CSRF-Token"]) : null;
    if (rotatedCsrfToken) {
      sessionStorage.setItem("csrfToken", rotatedCsrfToken);
    }
    // همگام‌سازی خودکار لاگ‌های شکست ذخیره‌شده در localStorage در صورت آنلاین بودن سرور
    if (!res.config?.url?.includes("/audit-failure")) {
      import("@/lib/clientAuditLogger").then((m) => m.syncOfflineFailureLogs()).catch(() => {});
    }
    return res;
  },
  (err) => {
    if (err.response && err.response.headers) {
      const rotatedCsrfToken = err.response.headers["x-csrf-token"] || err.response.headers["X-CSRF-Token"] || (err.response.data && err.response.data.csrfToken);
      if (rotatedCsrfToken) {
        sessionStorage.setItem("csrfToken", rotatedCsrfToken);
      }
    }
    const status = err.response ? err.response.status : null;
    const url = err.config ? err.config.url : "";
    const isAuthUrl = url ? url.includes("/auth/") : false;
    if (status === 401 && !isAuthUrl) {
      sessionStorage.removeItem("csrfToken");
      sessionStorage.removeItem("isOfflineMode");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ثبت خودکار لاگ دانلود فایل و خروج داده مطابق بند ۸ جدول ۲-۴ افتا
export async function logFileDownloadAudit({
  fileName = "add new source",
  section = "کتابخانه",
  dataType = "فایل ضمیمه / داده کاربری",
  fileSize = "نامشخص",
  fileFormat,
  otherDetails = "دانلود فایل از محصول"
}) {
  try {
    const ext = fileFormat || (fileName && fileName.includes(".") ? fileName.split(".").pop().toUpperCase() : "PNG");
    await api.post("/api/security/audit-file-download", {
      fileName,
      section,
      dataType,
      fileSize,
      fileFormat: ext,
      otherDetails
    });
  } catch (err) {
    console.error("خطا در ثبت لاگ دانلود فایل افتا:", err);
  }
}

export default api;
