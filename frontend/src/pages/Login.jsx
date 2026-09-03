import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  Loader2,
  Sparkles,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Fingerprint,
  Headset,
  PieChart,
  Layers,
  Globe,
  HelpCircle,
  FileQuestion,
  Headphones,
  CheckCircle2,
  X,
  KeyRound,
  Shield,
  ChevronDown,
  Building2,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { logFailureOccurrence } from "@/lib/clientAuditLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "../api";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState(() => localStorage.getItem("rememberedUsername") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Setup mode states
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Interactive modals & UI states
  const [lang, setLang] = useState("fa");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'forgot' | 'cert' | 'help' | 'faq' | 'support' | null

  // Digital cert state simulation
  const [selectedCert, setSelectedCert] = useState("admin_cert");
  const [certPin, setCertPin] = useState("");
  const [certLoading, setCertLoading] = useState(false);

  // Forgot password form state
  const [forgotInput, setForgotInput] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Redirect if logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Check admin setup status on load
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
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSetupMode) {
        await api.post("/api/auth/register", { username, password, role: "admin" });
        await login(username, password, rememberMe);
      } else {
        await login(username, password, rememberMe);
      }
    } catch (err) {
      const isNetworkOrCorsError = err?.message === "Network Error" || !err?.response;
      const fallbackMessage = isNetworkOrCorsError
        ? "خطا در ارتباط با سرور یا محدودیت CORS. لطفاً از روشن بودن سرور و تطابق پورت مطمئن شوید."
        : (isSetupMode
          ? "خطا در تعریف مدیر سیستم. لطفاً مجدداً تلاش کنید."
          : "خطا در ورود به سامانه. لطفاً نام کاربری و رمز عبور را بررسی کنید.");

      const displayedError = err?.response?.data?.message ?? fallbackMessage;
      setError(displayedError);
      setLoading(false);

      // 🌟 ثبت کامل لاگ بروز شکست در سیستم ثبت‌نشان‌های افتا همراه با توضیحات جامع
      logFailureOccurrence({
        userMessage: displayedError,
        action: isNetworkOrCorsError
          ? "شکست در ارتباط با سرور یا محدودیت CORS (عدم تطابق پورت یا خاموش بودن سرور)"
          : `تلاش ناموفق جهت ورود به سامانه برای کاربر '${username || "نامشخص"}'`,
        resource: isSetupMode ? "/api/auth/register" : "/api/auth/login",
        method: "POST",
        errorCode: err?.response?.status || 0,
        errorType: isNetworkOrCorsError ? "CORS_OR_NETWORK_ERROR" : "LOGIN_FAILURE",
        rawError: err,
        username: username || "anonymous",
        details: {
          isSetupMode,
          isNetworkOrCorsError,
          statusText: err?.response?.statusText || "No Response (Server Offline/Blocked)",
          reasonDescription: isNetworkOrCorsError
            ? "ارتباط با سرور برقرار نشد یا درخواست توسط محدودیت‌های CORS بلاک گردید."
            : "اطلاعات ورود اشتباه است یا حساب کاربری مسدود گردیده است."
        }
      });
    }
  }

  // Handle simulated digital cert login
  async function handleCertLogin(e) {
    e.preventDefault();
    setCertLoading(true);
    setError("");
    try {
      // Automatic login with default admin credentials for certificate simulation
      await login("admin", "admin123");
      setActiveModal(null);
    } catch (err) {
      const certErrMsg = "خطا در احراز هویت با گواهی دیجیتال. لطفاً از اتصال توکن اطمینان حاصل کنید.";
      setError(certErrMsg);
      setActiveModal(null);

      logFailureOccurrence({
        userMessage: certErrMsg,
        action: "شکست در احراز هویت با گواهی دیجیتال",
        resource: "/api/auth/cert-login",
        method: "POST",
        errorCode: err?.response?.status || 401,
        errorType: "CERT_AUTH_FAILURE",
        rawError: err,
        username: "cert_user",
        details: {
          reasonDescription: "عدم شناسایی توکن سخت‌افزاری یا خطای امضای دیجیتال"
        }
      });
    } finally {
      setCertLoading(false);
    }
  }

  // Handle forgot password request
  function handleForgotSubmit(e) {
    e.preventDefault();
    if (!forgotInput) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotInput("");
      setActiveModal(null);
    }, 2500);
  }

  if (checkingSetup || authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white p-4">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 shadow-2xl border border-emerald-500/20 backdrop-blur-md">
          <Landmark className="h-10 w-10 animate-pulse text-emerald-400" />
        </div>
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 bg-slate-800/80 px-5 py-2.5 rounded-full border border-slate-700/60 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>در حال بررسی ایمن وضعیت سامانه...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#f2f5f7] text-slate-800 font-sans selection:bg-emerald-500/20 selection:text-emerald-800 overflow-x-hidden">
      
      {/* Background Decor - Subtle Ambient Light Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#094843_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.03]" />
      </div>

      {/* Top Navbar / Language Switcher */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>ارتباط امن 256 بیت SSL</span>
        </div>

        {/* Language selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all duration-200"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>{lang === "fa" ? "فارسی" : "English"}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {isLangDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute left-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden"
              >
                <button
                  onClick={() => { setLang("fa"); setIsLangDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold ${lang === "fa" ? "text-emerald-700 bg-emerald-50/80 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span>فارسی (FA)</span>
                  {lang === "fa" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => { setLang("en"); setIsLangDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold ${lang === "en" ? "text-emerald-700 bg-emerald-50/80 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span>English (EN)</span>
                  {lang === "en" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Login Split Box Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[1140px] bg-white rounded-[32px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.12)] border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]"
        >

          {/* LEFT SIDE PANEL - Deep Emerald Banner with 3D Illustration & Features */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#063b36] via-[#094843] to-[#042d29] text-white p-7 sm:p-9 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            
            {/* Background Glows & Linework */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Header */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group hover:scale-105 transition-transform duration-300">
                  <Landmark className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                    سامانه جامع حسابداری
                  </h1>
                  <p className="text-xs font-semibold text-emerald-200/90 tracking-wide">
                    بخش عمومی
                  </p>
                </div>
              </div>
            </div>

            {/* Center High-Res 3D Hero Illustration */}
            <div className="relative z-10 my-6 sm:my-8 flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-[340px] aspect-4/3 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-white/5 backdrop-blur-sm group"
              >
                <img
                  src="/login_hero.png"
                  alt="داشبورد مالی و حسابداری بخش عمومی"
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback visually if image loading encounters local issue
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#042d29]/80 via-transparent to-transparent opacity-60" />
                
                {/* Floating Glass Badges on Illustration */}
                <div className="absolute bottom-3 right-3 bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>سامانه هوشمند مالی و سناما</span>
                </div>
              </motion.div>
            </div>

            {/* Bottom 4 Feature Cards */}
            <div className="relative z-10 grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 hover:bg-white/15 transition-colors duration-200">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mb-2">
                  <Headset className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">پشتیبانی حرفه‌ای</h4>
                <p className="text-[10px] text-emerald-100/70 font-medium leading-relaxed">پاسخگویی سریع و مستمر</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 hover:bg-white/15 transition-colors duration-200">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-2">
                  <PieChart className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">گزارش‌دهی دقیق</h4>
                <p className="text-[10px] text-emerald-100/70 font-medium leading-relaxed">گزارش‌های تحلیلی و مدیریتی</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 hover:bg-white/15 transition-colors duration-200">
                <div className="w-8 h-8 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">یکپارچه و جامع</h4>
                <p className="text-[10px] text-emerald-100/70 font-medium leading-relaxed">تمام فرآیندها در یک سیستم</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 hover:bg-white/15 transition-colors duration-200">
                <div className="w-8 h-8 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">امن و قابل اعتماد</h4>
                <p className="text-[10px] text-emerald-100/70 font-medium leading-relaxed">استناد به استانداردهای روز</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE PANEL - White Elegant Form Column */}
          <div className="lg:col-span-7 bg-white p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div className="w-full max-w-md mx-auto space-y-6">
              
              {/* Form Emblem Logo & Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#063b36] to-[#0a5c54] text-amber-300 p-0.5 shadow-xl flex items-center justify-center ring-4 ring-emerald-500/10"
                >
                  <div className="w-full h-full bg-[#063b36] rounded-[22px] flex items-center justify-center">
                    <Landmark className="w-8 h-8 text-amber-400" />
                  </div>
                </motion.div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    سامانه جامع حسابداری بخش عمومی
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                    راهکار جامع مدیریت مالی و حسابداری در بخش عمومی
                  </p>
                </div>

                {/* Initial Setup Mode Alert Banner */}
                {isSetupMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2.5 text-right shadow-sm"
                  >
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-amber-900">راه‌اندازی اولیه سیستم (ثبت اولین مدیر)</p>
                      <p className="text-[11px] font-medium text-amber-700 mt-0.5">
                        هیچ کاربری ثبت نشده است. لطفاً مشخصات مدیر ارشد سیستم را وارد کنید.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 text-right shadow-sm"
                  >
                    <X className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username Input Field */}
                <div className="space-y-1.5 text-right">
                  <Label htmlFor="username" className="text-xs font-bold text-slate-700">
                    {isSetupMode ? "نام کاربری مدیر ارشد (Admin)" : "نام کاربری"}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="نام کاربری خود را وارد کنید"
                      required
                      disabled={loading}
                      className="h-12 pr-10 pl-4 rounded-xl border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:border-[#094843] focus:ring-2 focus:ring-[#094843]/15 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Input Field */}
                <div className="space-y-1.5 text-right">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                    {isSetupMode ? "رمز عبور مدیر" : "رمز عبور"}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
                      required
                      disabled={loading}
                      dir="ltr"
                      className="h-12 pr-10 pl-10 rounded-xl border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 text-sm font-medium focus:bg-white focus:border-[#094843] focus:ring-2 focus:ring-[#094843]/15 transition-all shadow-sm text-left font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#094843] focus:ring-[#094843] accent-[#094843] cursor-pointer"
                    />
                    <span>مرا به خاطر بسپار</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setActiveModal("forgot")}
                    className="font-bold text-[#094843] hover:text-[#063b36] hover:underline transition-all"
                  >
                    رمز عبور خود را فراموش کرده‌اید؟
                  </button>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#063b36] to-[#094843] hover:from-[#042d29] hover:to-[#063b36] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                        <span>{isSetupMode ? "در حال ایجاد حساب..." : "در حال احراز هویت..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{isSetupMode ? "ایجاد حساب مدیر و ورود" : "ورود به سامانه"}</span>
                        <LogIn className="w-5 h-5 text-amber-300 group-hover:-translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Divider Or */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs font-bold text-slate-400 absolute">یا</span>
              </div>

              {/* Digital Certificate Login Secondary Button */}
              <button
                type="button"
                onClick={() => setActiveModal("cert")}
                className="w-full h-12 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 group"
              >
                <Fingerprint className="w-5 h-5 text-[#094843] group-hover:scale-110 transition-transform duration-200" />
                <span>ورود با گواهی دیجیتال</span>
              </button>

            </div>

            {/* Bottom Footer Info inside panel */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-slate-400">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveModal("help")}
                  className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>راهنما</span>
                </button>
                <button
                  onClick={() => setActiveModal("faq")}
                  className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                  <span>سوالات متداول</span>
                </button>
                <button
                  onClick={() => setActiveModal("support")}
                  className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5 text-slate-400" />
                  <span>پشتیبانی</span>
                </button>
              </div>

              <div>
                <span>نسخه 1.0.0</span>
              </div>
            </div>

          </div>

        </motion.div>
      </main>

      {/* Global Page Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-3 text-center text-[11px] font-medium text-slate-400">
        <p>© تمامی حقوق برای سامانه جامع حسابداری بخش عمومی محفوظ است.</p>
      </footer>

      {/* INTERACTIVE MODALS */}
      <AnimatePresence>
        {/* Digital Certificate Modal */}
        {activeModal === "cert" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-right space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">ورود با گواهی دیجیتال (توکن)</h3>
                    <p className="text-xs text-slate-400">انتخاب گواهی دیجیتال احراز هویت</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCertLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">انتخاب توکن / گواهی شناسایی:</Label>
                  <div className="space-y-2">
                    <label
                      onClick={() => setSelectedCert("admin_cert")}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${selectedCert === "admin_cert" ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold" : "border-slate-200 text-slate-600"}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs">گواهی ریشه کشوری (مدیر مالی بخش عمومی)</span>
                      </div>
                      <input
                        type="radio"
                        name="cert"
                        checked={selectedCert === "admin_cert"}
                        onChange={() => setSelectedCert("admin_cert")}
                        className="accent-emerald-600"
                      />
                    </label>

                    <label
                      onClick={() => setSelectedCert("pars_token")}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${selectedCert === "pars_token" ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold" : "border-slate-200 text-slate-600"}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Fingerprint className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs">توکن سخت‌افزاری پارس (امضای امین)</span>
                      </div>
                      <input
                        type="radio"
                        name="cert"
                        checked={selectedCert === "pars_token"}
                        onChange={() => setSelectedCert("pars_token")}
                        className="accent-emerald-600"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">پین کد توکن (PIN):</Label>
                  <Input
                    type="password"
                    value={certPin}
                    onChange={(e) => setCertPin(e.target.value)}
                    placeholder="••••"
                    maxLength={8}
                    dir="ltr"
                    className="h-11 text-center font-mono rounded-xl border-slate-200"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="submit"
                    disabled={certLoading}
                    className="flex-1 h-11 rounded-xl bg-[#094843] hover:bg-[#063b36] text-white font-bold text-xs"
                  >
                    {certLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "تایید و ورود با گواهی"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveModal(null)}
                    className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                  >
                    انصراف
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Forgot Password Modal */}
        {activeModal === "forgot" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-right space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-800">بازیابی رمز عبور</h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p>درخواست بازیابی رمز عبور ثبت شد.</p>
                  <p className="text-[11px] text-emerald-700 font-normal">
                    لینک بازیابی رمز عبور به راهبر سیستم جهت تایید ارسال گردید.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    لطفاً نام کاربری یا شماره موبایل ثبت شده خود را وارد نمایید تا لینک بازیابی ارسال گردد.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">نام کاربری یا شماره موبایل:</Label>
                    <Input
                      type="text"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder="مثال: admin یا 09123456789"
                      required
                      className="h-11 rounded-xl border-slate-200 text-xs"
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 h-11 rounded-xl bg-[#094843] hover:bg-[#063b36] text-white font-bold text-xs"
                    >
                      ارسال لینک بازیابی
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveModal(null)}
                      className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                    >
                      انصراف
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Help & Info Modal */}
        {(activeModal === "help" || activeModal === "faq" || activeModal === "support") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 text-right space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    {activeModal === "help" && <HelpCircle className="w-5 h-5" />}
                    {activeModal === "faq" && <FileQuestion className="w-5 h-5" />}
                    {activeModal === "support" && <Headphones className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {activeModal === "help" && "راهنمای استفاده از سامانه"}
                      {activeModal === "faq" && "سوالات متداول ورود به سامانه"}
                      {activeModal === "support" && "پشتیبانی فنی و ارتباط با کارشناسان"}
                    </h3>
                    <p className="text-xs text-slate-400">سامانه جامع حسابداری بخش عمومی</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto pr-1">
                {activeModal === "help" && (
                  <>
                    <p className="font-semibold text-slate-800">راهنمای ورود به سیستم:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600">
                      <li>جهت ورود، نام کاربری و رمز عبور تخصیص داده شده توسط راهبر سیستم را وارد کنید.</li>
                      <li>در صورت استفاده از توکن امنیتی، آن را به پورت USB متصل کرده و دکمه "ورود با گواهی دیجیتال" را بفشارید.</li>
                      <li>جهت امنیت بیشتر، حتماً پس از اتمام کار از حساب کاربری خود خارج (Logout) شوید.</li>
                    </ul>
                  </>
                )}

                {activeModal === "faq" && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800 mb-1">رمز عبور خود را فراموش کرده‌ام، چه کنم؟</p>
                      <p className="text-slate-600">از گزینه «رمز عبور خود را فراموش کرده‌اید؟» در فرم ورود استفاده نمایید یا با مدیر سیستم تماس بگیرید.</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800 mb-1">خطای عدم تطابق نام کاربری نمایش داده می‌شود؟</p>
                      <p className="text-slate-600">لطفاً از خاموش بودن Caps Lock و درست بودن زبان کیبورد (انگلیسی) اطمینان حاصل فرمایید.</p>
                    </div>
                  </div>
                )}

                {activeModal === "support" && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                      <p className="font-bold text-emerald-900 mb-1">مرکز پشتیبانی فنی و پاسخگویی 24/7:</p>
                      <p className="text-xs">تلفن پشتیبانی: ۰۲۱-۸۸۸۸۰۰۰۰</p>
                      <p className="text-xs mt-1">پست الکترونیک: support@publicfinance.gov.ir</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-left">
                <Button
                  onClick={() => setActiveModal(null)}
                  className="h-10 px-6 rounded-xl bg-[#094843] hover:bg-[#063b36] text-white text-xs font-bold"
                >
                  بستن
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
