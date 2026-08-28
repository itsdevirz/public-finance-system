import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  // timeout برای جلوگیری از hanging requests
  timeout: 30000,
});

// ── Request Deduplication ─────────────────────────────────────────────────────
const pendingRequests = new Map(); // url → Promise

api.interceptors.request.use((config) => {
  // اضافه کردن توکن
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  const key = url + (config && config.params ? JSON.stringify(config.params) : "");

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = originalGet(url, config).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
};

// اگه توکن منقضی شد (401)، کاربر رو به login هدایت کن
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response ? err.response.status : null;
    const url = err.config ? err.config.url : "";
    const isAuthUrl = url ? url.includes("/auth/") : false;

    if (status === 401 && !isAuthUrl) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
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
