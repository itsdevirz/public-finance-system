import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // پایش مستمر تعامل واقعی کاربر (ماوس، کیبورد، اسکرول، لمس) جهت اعمال آستانه عدم فعالیت
  useEffect(() => {
    let isMounted = true;
    let lastUserActivityTime = Date.now();

    const handleUserActivity = () => {
      lastUserActivityTime = Date.now();
    };

    const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "wheel"];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const sessionToken = sessionStorage.getItem("token");
    const leftoverLocalToken = localStorage.getItem("token");

    // اگر توکن جلسه در sessionStorage نباشد یعنی مرورگر بسته و دوباره باز شده است
    if (!sessionToken) {
      if (leftoverLocalToken) {
        // نشست قبلی ذخیره‌شده در localStorage را در بک‌اند غیرفعال می‌کنیم
        api.post("/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${leftoverLocalToken}` }
        }).catch(() => {});
        localStorage.removeItem("token");
        localStorage.removeItem("sessionNotice");
      }
      setLoading(false);
      return () => {
        activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      };
    }

    // بررسی صحت توکن نشست فعال
    api.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${sessionToken}` }
    })
      .then((res) => {
        if (isMounted) setUser(res.data.user);
      })
      .catch(() => {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const intervalId = setInterval(() => {
      const currentToken = sessionStorage.getItem("token");
      if (!currentToken) return;

      const now = Date.now();
      const idleMs = now - lastUserActivityTime;
      const idleMinutes = idleMs / (60 * 1000);

      // دریافت آستانه عدم فعالیت اختصاصی کاربر (بر حسب دقیقه)
      const currentUserIdleTimeout = (user && typeof user.idleTimeoutMinutes === "number" && user.idleTimeoutMinutes > 0)
        ? user.idleTimeoutMinutes
        : 30;

      // اگر کاربر به میزان آستانه تعیین‌شده دچار عدم فعالیت شده باشد
      if (idleMinutes >= currentUserIdleTimeout) {
        const roundedIdleMin = Math.max(1, Math.round(idleMinutes));
        api.post("/api/auth/inactivity-logout", {
          idleMinutes: roundedIdleMin,
          configuredTimeoutMinutes: currentUserIdleTimeout
        }).catch(() => {});

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("sessionNotice");
        localStorage.removeItem("token");
        localStorage.removeItem("sessionNotice");
        if (isMounted) setUser(null);

        alert(`به دلیل ${roundedIdleMin} دقیقه عدم فعالیت به صورت سیستمی نشست شما خاتمه یافت.`);
        window.location.href = "/login";
        return;
      }

      // ارسال پایش سلامت نشست فقط با نشان‌دهنده فعالیت تعاملی کاربر
      const wasActiveRecently = (now - lastUserActivityTime) < 15000;
      api.get("/api/auth/me", {
        headers: { "X-User-Active": wasActiveRecently ? "true" : "false" }
      })
        .catch((err) => {
          if (err.response?.status === 401) {
            sessionStorage.removeItem("token");
            localStorage.removeItem("token");
            if (isMounted) setUser(null);
            const msg = err.response?.data?.message || "نشست شما توسط مدیر سیستم خاتمه یافت.";
            alert(msg);
            window.location.href = "/login";
          }
        });
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [user?.idleTimeoutMinutes]);

  async function login(username, password, rememberMe = true, evictOtherSessions = false) {
    const res = await api.post("/api/auth/login", { username, password, evictOtherSessions });
    
    // توکن نشست فعال صرفاً در sessionStorage قرار می‌گیرد تا با بستن مرورگر غیرفعال شود
    sessionStorage.setItem("token", res.data.token);
    localStorage.removeItem("token");

    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      localStorage.removeItem("rememberedUsername");
    }

    if (res.data.sessionNotice) {
      sessionStorage.setItem("sessionNotice", JSON.stringify(res.data.sessionNotice));
    } else {
      sessionStorage.removeItem("sessionNotice");
    }
    localStorage.removeItem("sessionNotice");

    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ادامه خروج حتی در صورت خطای شبکه
    } finally {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("sessionNotice");
      localStorage.removeItem("token");
      localStorage.removeItem("sessionNotice");
      setUser(null);
    }
  }

  function updateUser(updatedUserData) {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, loading: false, login: async () => {}, logout: async () => {}, updateUser: () => {} };
  }
  return context;
}
