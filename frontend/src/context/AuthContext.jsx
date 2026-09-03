import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // هنگام بارگذاری اپ و پایش مستمر صحت نشست (Heartbeat هر ۳ ثانیه برای خروج لحظه‌ای در صورت ابطال توسط ادمین)
  useEffect(() => {
    let isMounted = true;

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
      return;
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

      api.get("/api/auth/me")
        .catch((err) => {
          if (err.response?.status === 401) {
            sessionStorage.removeItem("token");
            localStorage.removeItem("token");
            if (isMounted) setUser(null);
            alert("نشست شما توسط مدیر سیستم خاتمه یافت.");
            window.location.href = "/login";
          }
        });
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

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
