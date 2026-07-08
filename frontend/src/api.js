import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  // timeout برای جلوگیری از hanging requests
  timeout: 30000,
});

// ── Request Deduplication ─────────────────────────────────────────────────────
// اگر همزمان دو request GET یکسان ارسال شود، فقط یکی اجرا می‌شود
const pendingRequests = new Map(); // url → Promise

api.interceptors.request.use((config) => {
  // اضافه کردن توکن
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Wrapper برای GET با deduplication
const originalGet = api.get.bind(api);
api.get = function dedupedGet(url, config) {
  // فقط GET بدون body dedup می‌شود
  const key = url + (config?.params ? JSON.stringify(config.params) : "");

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
    if (err.response?.status === 401 && !err.config.url.includes("/auth/")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
