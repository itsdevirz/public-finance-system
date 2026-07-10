import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Landmark, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "../api";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // اگر کاربر قبلاً لاگین کرده، به صفحه اصلی هدایت شود
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // بررسی وجود ادمین در سیستم هنگام بالا آمدن صفحه
  useEffect(() => {
    api.get("/api/auth/setup-status")
      .then((res) => {
        if (res?.data && res.data.hasAdmin === false) {
          setIsSetupMode(true);
        }
      })
      .catch((err) => {
        console.error("Error checking system setup status:", err);
      })
      .finally(() => {
        setCheckingSetup(false);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSetupMode) {
        // ثبت نام اولین ادمین
        await api.post("/api/auth/register", { username, password, role: "admin" });
        // ورود خودکار
        await login(username, password);
      } else {
        await login(username, password);
      }
      // Navigation will be handled by useEffect when user state updates
    } catch (err) {
      setError(
        err?.response?.data?.message ??
        (isSetupMode
          ? "خطا در تعریف مدیر سیستم. لطفا مجدداً تلاش کنید."
          : "خطا در ورود به سامانه. لطفا نام کاربری و رمز عبور را بررسی کنید.")
      );
      setLoading(false);
    }
  }

  if (checkingSetup || authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-tr from-sidebar-background via-background to-background p-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner border border-primary/20 backdrop-blur-sm">
          <Landmark className="h-8 w-8 animate-pulse text-primary" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80 bg-background/80 px-4 py-2 rounded-full border shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span>در حال بررسی وضعیت سامانه...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-tr from-sidebar-background via-background to-background p-4 sm:p-6 selection:bg-accent/20 selection:text-primary">
      {/* Animated background blobs matching the new Ocean Teal & Imperial Gold palette */}
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 40, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-[100px]"
      />
      <motion.div
        animate={{ x: [0, -40, 30, 0], y: [0, 40, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-accent/15 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md z-10"
      >
        <Card className="relative w-full border-border/80 shadow-2xl backdrop-blur-xl bg-card/95 p-2 sm:p-4 rounded-3xl">
          <CardHeader className="space-y-4 text-center pb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.2 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-inner"
            >
              <Landmark className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-2"
            >
              <div className={`flex items-center justify-center gap-1.5 text-xs font-bold bg-accent/10 px-3 py-1 rounded-full w-fit mx-auto border border-accent/20 shadow-sm ${isSetupMode ? "animate-pulse text-amber-500" : "text-accent"}`}>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isSetupMode ? "راه‌اندازی اولیه: تعریف مدیر سیستم" : "سامانه امن نظام مالی بخش عمومی"}</span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {isSetupMode ? "تعریف مدیر ارشد سیستم" : "سامانه جامع نظام مالی"}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium text-muted-foreground">
                {isSetupMode
                  ? "هیچ کاربری در سیستم یافت نشد. لطفاً نام کاربری و رمز عبور مدیر سیستم را تعریف کنید."
                  : "جهت ورود به حساب کاربری، مشخصات خود را وارد نمایید"}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs sm:text-sm font-semibold text-destructive shadow-sm flex items-center gap-2"
                >
                  <span className="flex-1">{error}</span>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="username" className="text-xs sm:text-sm font-bold text-foreground/90">
                  {isSetupMode ? "نام کاربری مدیر (Admin)" : "نام کاربری"}
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder={isSetupMode ? "نام کاربری مدیر سیستم را وارد کنید" : "نام کاربری خود را وارد کنید"}
                  required
                  disabled={loading}
                  className="h-12 rounded-xl bg-background/60 px-4 text-sm focus:bg-background transition-all shadow-sm font-medium"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="text-xs sm:text-sm font-bold text-foreground/90">
                  {isSetupMode ? "رمز عبور مدیر" : "رمز عبور"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  dir="ltr"
                  className="h-12 rounded-xl bg-background/60 px-4 text-left text-sm focus:bg-background transition-all shadow-sm font-mono tracking-widest"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="pt-2"
              >
                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      <span>{isSetupMode ? "در حال ایجاد حساب مدیر..." : "در حال احراز هویت..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-5 w-5 text-accent ${isSetupMode ? "animate-pulse" : ""}`} />
                      <span>{isSetupMode ? "ایجاد حساب مدیر و ورود به سیستم" : "ورود به سامانه"}</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
