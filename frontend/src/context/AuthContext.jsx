import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // هنگام بارگذاری اپ و پایش مستمر صحت نشست (Heartbeat هر ۳ ثانیه برای خروج لحظه‌ای در صورت ابطال توسط ادمین)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    let isMounted = true;

    api.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (isMounted) setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const intervalId = setInterval(() => {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) return;

      api.get("/api/auth/me")
        .catch((err) => {
          if (err.response?.status === 401) {
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

  async function login(username, password) {
    const res = await api.post("/api/auth/login", { username, password });
    localStorage.setItem("token", res.data.token);
    if (res.data.sessionNotice) {
      localStorage.setItem("sessionNotice", JSON.stringify(res.data.sessionNotice));
    } else {
      localStorage.removeItem("sessionNotice");
    }
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // ادامه خروج حتی در صورت خطای شبکه
    } finally {
      localStorage.removeItem("token");
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
