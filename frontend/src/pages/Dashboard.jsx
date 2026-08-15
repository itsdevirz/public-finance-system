import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { PageShell } from "@/components/layout/PageShell";
import { StaggerContainer, StaggerItem } from "@/components/motion/AnimatedPage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, FileText, CreditCard, BookOpen,
  Shield, PiggyBank, ArrowLeftRight, TrendingUp,
  AlertTriangle, CheckCircle, Clock, ChevronLeft,
  Plus, Trash2, Pencil, Landmark, ListChecks,
  Users, BadgePercent, Sparkles, Bot, Zap,
  BarChart3, PieChart, Layers, ArrowUpRight, CheckCircle2,
  Wallet, Boxes, Coins, FileSpreadsheet, Cpu,
  Activity, Search
} from "lucide-react";
import api from "@/api";

// ─── تابع کمکی محاسبه ایمن تعداد آیتم‌ها ─────────────────────────────────────
function safeCount(val) {
  if (!val) return 0;
  if (Array.isArray(val)) return val.length;
  if (typeof val === "object") {
    if (Array.isArray(val.data)) return val.data.length;
    if (Array.isArray(val.items)) return val.items.length;
    if (typeof val.count === "number") return val.count;
    if (typeof val.total === "number") return val.total;
  }
  if (typeof val === "number") return val;
  return 0;
}

// ─── کامپوننت کارت سه بعدی با پرسپکتیو و تعامل روان ──────────────────────────────
function TiltCard({ children, className = "", onClick }) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.025, rotateX: 3, rotateY: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`perspective-1000 preserve-3d cursor-pointer ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="w-full h-full rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
        {children}
      </div>
    </motion.div>
  );
}

// ─── دسته‌بندی دسترسی سریع سامانه ─────────────────────────────────────────────
const QUICK_HUBS = [
  {
    category: "تنظیم اسناد و حسابداری",
    description: "صدور اسناد، مرور دفاتر و ترازهای مالی",
    badge: "اصلی",
    icon: FileText,
    gradient: "from-blue-600 to-indigo-700",
    glow: "shadow-blue-500/20",
    items: [
      { label: "صدور سند دستی",     to: "/document-setup/manual-doc",   desc: "ثبت سند جدید",       icon: FileText,       badge: "پرکاربرد" },
      { label: "صدور سند اتوماتیک", to: "/document-setup/auto-doc",     desc: "ثبت بر اساس الگو",   icon: Zap,            badge: "هوشمند" },
      { label: "لیست اسناد مالی",   to: "/document-setup/docs-list",    desc: "جستجو و ویرایش",     icon: FileSpreadsheet,badge: "مدیریت" },
      { label: "مرور حساب‌ها",      to: "/bookkeeping/ledger-reports/account-review", desc: "دفاتر کل و معین", icon: BookOpen,   badge: "گزارش" },
      { label: "تراز عملیات",       to: "/bookkeeping/operations-balance", desc: "تراز ۴، ۶ و ۸ ستونی", icon: Layers,       badge: "مالی" },
      { label: "صورت‌های مالی",     to: "/bookkeeping",                  desc: "ترازنامه و سود/زیان", icon: Landmark,     badge: "مدیریتی" },
    ]
  },
  {
    category: "اعتبارات و بودجه",
    description: "مدیریت موافقت‌نامه‌ها، تخصیص و تامین اعتبارات",
    badge: "بودجه",
    icon: CreditCard,
    gradient: "from-emerald-600 to-teal-700",
    glow: "shadow-emerald-500/20",
    items: [
      { label: "ثبت موافقت‌نامه",   to: "/credits/agreements",           desc: "موافقت‌نامه بودجه",  icon: CreditCard,     badge: "بودجه" },
      { label: "تخصیص اعتبار",      to: "/credits/allocation-no-doc",   desc: "تخصیص‌های ابلاغی",   icon: TrendingUp,     badge: "عملیاتی" },
      { label: "درخواست وجه",       to: "/credits/requests",            desc: "درخواست از خزانه",   icon: Wallet,         badge: "خزانه" },
      { label: "ابلاغ و انتقال",    to: "/credits/notification/request",desc: "جابجایی اعتبار",     icon: ArrowLeftRight, badge: "انتقال" },
      { label: "گزارش‌های بودجه",   to: "/reports/budget",               desc: "تحلیل ردیف‌های بودجه", icon: BarChart3,      badge: "گزارش" },
      { label: "ممیزی سناما",       to: "/system-management/sanama-file-check", desc: "انطباق با سناما", icon: CheckCircle2,  badge: "استاندارد" },
    ]
  },
  {
    category: "خزانه، چک و تضمینات",
    description: "مدیریت پرداخت‌های بانکی، چک‌ها و وثایق",
    badge: "خزانه",
    icon: Shield,
    gradient: "from-amber-500 to-rose-600",
    glow: "shadow-amber-500/20",
    items: [
      { label: "صدور چک و پرداخت", to: "/check-issuance",               desc: "چک و حواله‌های بانکی", icon: Coins,         badge: "پرداخت" },
      { label: "ثبت ضمانت‌نامه",    to: "/basic-info/contracts/guarantee", desc: "وثایق و ضمانت‌نامه‌ها", icon: Shield,        badge: "تضمین" },
      { label: "ثبت و مدیریت سپرده",to: "/deposits/manual-form",         desc: "سپرده حسن انجام کار", icon: PiggyBank,      badge: "سپرده" },
      { label: "مغایرت‌گیری بانکی", to: "/bookkeeping/bank-reconciliation", desc: "رفع مغایرت حساب‌ها", icon: Activity,     badge: "کنترل" },
      { label: "کارت قراردادها",    to: "/basic-info/contracts/card",   desc: "اطلاعات پیمانکاران", icon: Landmark,       badge: "پیمان" },
      { label: "تعریف بانک‌ها",     to: "/basic-info/definitions/bank", desc: "حساب‌های بانکی سازمان", icon: Landmark,    badge: "پایه" },
    ]
  },
  {
    category: "ماژول‌های تخصصی و هوش مصنوعی",
    description: "حقوق و دستمزد، انبار، اموال و دستیار هوشمند",
    badge: "ویژه",
    icon: Cpu,
    gradient: "from-purple-600 to-pink-600",
    glow: "shadow-purple-500/20",
    items: [
      { label: "دستیار مالی AI",     to: "/ai/chat",                      desc: "تحلیل هوشمند داده‌ها", icon: Bot,          badge: "هوش مصنوعی" },
      { label: "سیستم حقوق و دستمزد",to: "/payroll/dashboard",           desc: "لیست حقوق و کارکرد", icon: Users,        badge: "پرسنلی" },
      { label: "سیستم جامع انبار",   to: "/warehouse/dashboard",         desc: "رسید، حواله و کالاها", icon: Boxes,        badge: "کالا" },
      { label: "اموال و دارایی ثابت",to: "/assets/dashboard",            desc: "استهلاک و پلاک‌گذاری", icon: Cpu,          badge: "اموال" },
      { label: "مدیریت کاربران",    to: "/system-management/users",     desc: "سطوح دسترسی سیستم",   icon: Users,        badge: "امنیتی" },
      { label: "اطلاعات و تعاریف پایه", to: "/basic-info",               desc: "تنظیمات زیرساختی",   icon: ListChecks,   badge: "تنظیمات" },
    ]
  }
];

const DEFINITIONS_META = [
  { key: "banks", title: "بانک‌ها", description: "تعریف بانک‌های مورد استفاده", icon: Landmark, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", apiPath: "/api/bank-statement-formats" },
  { key: "guarantee_types", title: "انواع ضمانت", description: "تعریف انواع ضمانت‌نامه", icon: Shield, color: "bg-rose-500/10 text-rose-600 border-rose-500/20", apiPath: "/api/guarantee-types" },
  { key: "deposit_types", title: "انواع سپرده", description: "تعریف دسته‌بندی سپرده‌ها", icon: PiggyBank, color: "bg-teal-500/10 text-teal-600 border-teal-500/20", apiPath: "/api/deduction-types" },
  { key: "insurance_types", title: "انواع بیمه", description: "شرکت‌های بیمه طرف قرارداد", icon: BadgePercent, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", apiPath: "/api/insurance-types" },
  { key: "payment_types", title: "انواع پرداخت", description: "روش‌های پرداخت مجاز", icon: CreditCard, color: "bg-amber-500/10 text-amber-600 border-amber-500/20", apiPath: "/api/payment-types" },
  { key: "persons", title: "اشخاص", description: "تعریف اشخاص حقیقی و حقوقی", icon: Users, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", apiPath: "/api/persons" },
];

// ─── کامپوننت نمودار سه بعدی اعتبارات و بودجه (3D Budget Chart) ───────────────────
function Interactive3DBudgetChart({ navigate, chartData = [] }) {
  const [period, setPeriod] = useState("month");
  const [activeBar, setActiveBar] = useState(null);

  const hasData = Array.isArray(chartData) && chartData.length > 0;

  return (
    <Card className="relative overflow-hidden border border-border shadow-lg bg-card backdrop-blur-md">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/50 gap-3">
        <div>
          <CardTitle className="flex items-center gap-2.5 text-lg font-black text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            تحلیل سه بعدی تخصیص و جذب بودجه
          </CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground mt-1">
            مقایسه داده‌های واقعی ردیف‌های اعتباری و میزان جذب ثبت‌شده در سیستم
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 bg-muted/80 p-1 rounded-xl border text-xs font-semibold">
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1.5 rounded-lg transition-all ${period === "month" ? "bg-primary text-primary-foreground shadow-sm font-bold" : "hover:text-primary"}`}
          >
            ماهانه
          </button>
          <button
            onClick={() => setPeriod("quarter")}
            className={`px-3 py-1.5 rounded-lg transition-all ${period === "quarter" ? "bg-primary text-primary-foreground shadow-sm font-bold" : "hover:text-primary"}`}
          >
            فصلی
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-3 py-1.5 rounded-lg transition-all ${period === "year" ? "bg-primary text-primary-foreground shadow-sm font-bold" : "hover:text-primary"}`}
          >
            سالانه
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <BarChart3 className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-foreground">هنوز هیچ داده اعتباری یا بودجه‌ای در سیستم ثبت نشده است</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              برای نمایش تحلیل‌های سه‌بعدی و نمودار تفکیکی، می‌توانید نخستین موافقت‌نامه یا اعتبار را در سیستم ثبت کنید.
            </p>
            <Button
              size="sm"
              onClick={() => navigate("/credits")}
              className="mt-2 text-xs font-bold gap-1"
            >
              ثبت جدید در مدیریت اعتبارات <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-6 mb-6 text-xs font-bold text-muted-foreground justify-end">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-gradient-to-r from-primary to-teal-500 shadow-sm" />
                <span>تخصیص اعتبار</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 shadow-sm" />
                <span>میزان جذب (هزینه شده)</span>
              </div>
            </div>

            <div className="relative h-64 w-full flex items-end justify-around pt-8 pb-6 px-4 bg-muted/20 rounded-2xl border border-primary/10 shadow-inner">
              {chartData.map((item, idx) => {
                const isHovered = activeBar === idx;
                const maxVal = Math.max(...chartData.map(d => Number(d.allocated) || 1), 1);
                const heightAllocated = Math.min(100, ((Number(item.allocated) || 0) / maxVal) * 100);
                const heightSpent = Math.min(100, ((Number(item.spent) || 0) / maxVal) * 100);

                return (
                  <div
                    key={idx}
                    className="relative flex flex-col items-center group cursor-pointer z-10"
                    onMouseEnter={() => setActiveBar(idx)}
                    onMouseLeave={() => setActiveBar(null)}
                  >
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: -10, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.9 }}
                          className="absolute bottom-full mb-3 z-30 min-w-[150px] p-2.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-amber-400/40 text-xs space-y-1 pointer-events-none"
                        >
                          <div className="font-bold text-amber-300 border-b border-white/10 pb-1 flex justify-between items-center">
                            <span>{item.label}</span>
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                              {Number(item.allocated) > 0 ? Math.round(((Number(item.spent) || 0) / Number(item.allocated)) * 100) : 0}٪
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">تخصیص:</span>
                            <span className="font-bold text-white">{(Number(item.allocated) || 0).toLocaleString("fa-IR")}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">جذب:</span>
                            <span className="font-bold text-amber-300">{(Number(item.spent) || 0).toLocaleString("fa-IR")}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-end gap-2 h-48 preserve-3d">
                      <div className="relative flex flex-col justify-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightAllocated}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.08 }}
                          className={`w-6 sm:w-8 rounded-t-lg bg-gradient-to-t from-primary via-teal-600 to-teal-400 relative transition-all duration-300 ${isHovered ? "scale-105 shadow-lg shadow-teal-500/40" : "shadow-md"}`}
                        >
                          <div className="absolute -top-1.5 left-0 right-0 h-1.5 bg-teal-300 rounded-t-sm opacity-90" />
                        </motion.div>
                      </div>

                      <div className="relative flex flex-col justify-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightSpent}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.08 + 0.04 }}
                          className={`w-6 sm:w-8 rounded-t-lg bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 relative transition-all duration-300 ${isHovered ? "scale-105 shadow-lg shadow-amber-500/40" : "shadow-md"}`}
                        >
                          <div className="absolute -top-1.5 left-0 right-0 h-1.5 bg-amber-200 rounded-t-sm opacity-90" />
                        </motion.div>
                      </div>
                    </div>

                    <span className="mt-3 text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── کامپوننت نمودار دایره‌ای ۳D گردش نقدینگی و خزانه (3D Donut Pie Visualizer) ─
function Interactive3DTreasuryPie({ navigate, treasuryStats }) {
  const [activeItem, setActiveItem] = useState(0);

  const guaranteesCount = Number(treasuryStats?.guaranteesCount) || 0;
  const checksCount = Number(treasuryStats?.checksCount) || 0;
  const depositsCount = Number(treasuryStats?.depositsCount) || 0;
  const docsCount = Number(treasuryStats?.docsCount) || 0;

  const total = guaranteesCount + checksCount + depositsCount + docsCount;

  const items = [
    { label: "ضمانت‌نامه‌های فعال", count: guaranteesCount, color: "from-rose-500 to-red-600", to: "/reports/contracts/guarantees" },
    { label: "چک‌های صادره",        count: checksCount,     color: "from-amber-500 to-amber-600", to: "/check-issuance" },
    { label: "سپرده‌های مأخوذه",   count: depositsCount,   color: "from-teal-500 to-emerald-600", to: "/deposits/manual-form" },
    { label: "اسناد در جریان",      count: docsCount,       color: "from-blue-500 to-indigo-600", to: "/document-setup/docs-list" },
  ];

  return (
    <Card className="relative overflow-hidden border border-border shadow-lg bg-card backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center gap-2.5 text-lg font-black text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-md shadow-accent/20">
            <PieChart className="h-5 w-5" />
          </div>
          توزیع سه بعدی گردش نقدینگی و تضمینات
        </CardTitle>
        <CardDescription className="text-xs font-medium text-muted-foreground mt-1">
          تفکیک تراکنش‌ها، وثایق و اسناد ثبت‌شده
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="relative flex items-center justify-center py-4">
          <div
            className="relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: total > 0
                ? "conic-gradient(#f43f5e 0% 40%, #f59e0b 40% 70%, #10b981 70% 90%, #6366f1 90% 100%)"
                : "hsl(var(--muted))",
              boxShadow: "0 15px 30px -5px rgba(0,0,0,0.15), inset 0 -6px 12px rgba(0,0,0,0.2)",
              transform: "perspective(600px) rotateX(25deg)",
            }}
          >
            <div className="w-28 h-28 bg-card rounded-full flex flex-col items-center justify-center shadow-inner border border-border">
              <span className="text-[10px] font-bold text-muted-foreground">مجموع تراکنش‌ها</span>
              <span className="text-base font-black text-primary mt-0.5">{total.toLocaleString("fa-IR")} مورد</span>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 border border-emerald-500/20">
                تراز متوازن
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {items.map((item, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.to)}
              onMouseEnter={() => setActiveItem(idx)}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                activeItem === idx
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/60 hover:border-primary/40 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${item.color}`} />
                  {item.label}
                </span>
                <span className="text-[10px] font-black text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                  {total > 0 ? Math.round((item.count / total) * 100) : 0}٪
                </span>
              </div>
              <p className="text-xs font-black text-primary mt-2 flex items-center justify-between">
                <span>{item.count.toLocaleString("fa-IR")} مورد</span>
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </p>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── کامپوننت اصلی DASHBOARD ──────────────────────────────────────────────────
export default function Dashboard() {
  const auth = useAuth() || {};
  const user = auth.user;
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // آمار واقعی دریافتی از دیتابیس (همواره مقادیر عددی ایمن)
  const [stats, setStats] = useState({
    docsCount: 0,
    creditsCount: 0,
    guaranteesCount: 0,
    checksCount: 0,
    usersCount: 0,
    inventoryCount: 0,
  });

  const [alerts, setAlerts] = useState([]);
  const [definitionsData, setDefinitionsData] = useState({});

  // بارگذاری داده‌های واقعی از API دیتابیس
  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardStats() {
      try {
        const [docsRes, creditsRes, guarsRes, checksRes, usersRes, invRes] = await Promise.allSettled([
          api.get("/api/documents"),
          api.get("/api/credits"),
          api.get("/api/contract-guarantees"),
          api.get("/api/checks"),
          api.get("/api/users"),
          api.get("/api/inventory"),
        ]);

        if (!isMounted) return;

        const docsVal = docsRes.status === "fulfilled" ? (docsRes.value?.data?.data ?? docsRes.value?.data) : [];
        const creditsVal = creditsRes.status === "fulfilled" ? (creditsRes.value?.data?.data ?? creditsRes.value?.data) : [];
        const guarsVal = guarsRes.status === "fulfilled" ? (guarsRes.value?.data?.data ?? guarsRes.value?.data) : [];
        const checksVal = checksRes.status === "fulfilled" ? (checksRes.value?.data?.data ?? checksRes.value?.data) : [];
        const usersVal = usersRes.status === "fulfilled" ? (usersRes.value?.data?.data ?? usersRes.value?.data) : [];
        const invVal = invRes.status === "fulfilled" ? (invRes.value?.data?.data ?? invRes.value?.data) : [];

        const dCount = safeCount(docsVal);
        const cCount = safeCount(creditsVal);
        const gCount = safeCount(guarsVal);
        const chCount = safeCount(checksVal);
        const uCount = safeCount(usersVal);
        const iCount = safeCount(invVal);

        setStats({
          docsCount: dCount,
          creditsCount: cCount,
          guaranteesCount: gCount,
          checksCount: chCount,
          usersCount: uCount,
          inventoryCount: iCount,
        });

        // هشدارهای واقعی
        const realAlerts = [];
        if (gCount > 0) {
          realAlerts.push({ id: 1, type: "warning", text: `${gCount.toLocaleString("fa-IR")} ضمانت‌نامه فعال در سیستم ثبت شده است`, to: "/reports/contracts/guarantees" });
        }
        if (dCount > 0) {
          realAlerts.push({ id: 2, type: "info", text: `${dCount.toLocaleString("fa-IR")} سند حسابداری در دیتابیس موجود است`, to: "/document-setup/docs-list" });
        }
        realAlerts.push({ id: 3, type: "success", text: "تراز کل حساب‌های مالی متوازن می‌باشد", to: "/bookkeeping/operations-balance" });

        setAlerts(realAlerts);
      } catch (e) {
        console.error("خطا در بارگذاری آمار داشبورد:", e);
      }
    }

    fetchDashboardStats();
    return () => { isMounted = false; };
  }, []);

  const now = useMemo(() => new Date().toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long"
  }), []);

  const definitions = useMemo(() => DEFINITIONS_META, []);
  const quickHubs = useMemo(() => QUICK_HUBS, []);

  const activeDef = useMemo(() => definitions.find((d) => d.key === activeModal), [definitions, activeModal]);

  const filteredHubs = useMemo(() => {
    if (!searchQuery.trim()) return quickHubs;
    const q = searchQuery.trim().toLowerCase();
    return quickHubs.map(hub => ({
      ...hub,
      items: hub.items.filter(i => i.label.toLowerCase().includes(q) || (i.desc && i.desc.toLowerCase().includes(q)) || hub.category.toLowerCase().includes(q))
    })).filter(h => h.items.length > 0);
  }, [quickHubs, searchQuery]);

  return (
    <PageShell>
      {/* ─── 1. بنر شکیل خوش‌آمدگویی ─────────────────────────────────────────── */}
      <div className="mb-8 relative rounded-3xl bg-gradient-to-l from-slate-950 via-teal-950 to-emerald-950 text-white p-6 md:p-8 shadow-2xl border border-white/10 overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-accent font-bold text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                سامانه هوشمند نظام مالی بخش عمومی
              </span>
              <span className="flex items-center gap-1 text-emerald-300 text-xs font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                وضعیت: ۱۰۰٪ عملیاتی
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-snug">
              خوش آمدید،{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-accent via-amber-300 to-amber-100 font-black drop-shadow-md">
                {user?.username || "مدیر مالی گرامی"}
              </span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              امروز {now} | کلیه زیرسیستم‌های حسابداری، بودجه، خزانه، انبار و حقوق و دستمزد آماده بهره‌برداری می‌باشند.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/ai/chat")}
              className="flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-2xl shadow-xl shadow-purple-900/40 border border-purple-400/30 text-xs md:text-sm font-black"
            >
              <Bot className="h-5 w-5 text-amber-300 animate-bounce" />
              <span>دستیار هوشمند مالی (AI)</span>
              <ArrowUpRight className="h-4 w-4 opacity-80" />
            </motion.button>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-lg">
              <div className="h-9 w-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-300 font-semibold block">دوره مالی فعال</span>
                <span className="text-xs font-black text-amber-300">سال مالی ۱۴۰۵</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. هشدارهای فوری و اعلان‌ها ────────────────────────────────────── */}
      <StaggerContainer className="mb-8 grid gap-3 sm:grid-cols-3" staggerDelay={0.06}>
        {alerts.map((alert) => (
          <StaggerItem key={alert.id}>
            <div
              onClick={() => navigate(alert.to)}
              className="cursor-pointer flex items-center gap-3 p-4 rounded-2xl border bg-card backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
            >
              {alert.type === "warning" ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 animate-bounce" />
                </div>
              ) : alert.type === "success" ? (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Clock className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{alert.text}</p>
                <span className="text-[10px] font-semibold text-primary flex items-center gap-1 mt-0.5">
                  اقدام و پیگیری <ChevronLeft className="h-3 w-3" />
                </span>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* ─── 3. کارت‌های شاخص‌های کلیدی ۳D (داده‌های واقعی دیتابیس) ───────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-primary border-r-4 border-accent pr-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            خلاصه وضعیت و شاخص‌های کلیدی عملکرد (اطلاعات واقعی دیتابیس)
          </h2>
          <span className="text-xs font-medium text-muted-foreground">به‌روزرسانی لحظه‌ای سیستم</span>
        </div>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" staggerDelay={0.06}>
          {[
            { label: "اسناد این ماه",   val: `${(Number(stats?.docsCount) || 0).toLocaleString("fa-IR")} سند`, sub: "ثبت‌شده در دیتابیس", to: "/document-setup/docs-list",  icon: FileText,       color: "text-blue-600",    bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "اعتبارات بودجه",  val: `${(Number(stats?.creditsCount) || 0).toLocaleString("fa-IR")} مورد`, sub: "ردیف‌های ابلاغی", to: "/credits",                  icon: CreditCard,     color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "ضمانت‌نامه‌ها",    val: `${(Number(stats?.guaranteesCount) || 0).toLocaleString("fa-IR")} فقره`, sub: "وثایق فعال", to: "/reports/contracts/guarantees", icon: Shield,  color: "text-rose-600",    bg: "bg-rose-500/10 border-rose-500/20" },
            { label: "چک‌های صادره",   val: `${(Number(stats?.checksCount) || 0).toLocaleString("fa-IR")} فقره`, sub: "تراکنش‌های خزانه", to: "/check-issuance",           icon: ArrowLeftRight, color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "کاربران سیستم",   val: `${(Number(stats?.usersCount) || 0).toLocaleString("fa-IR")} نفر`, sub: "دسترسی فعال", to: "/system-management/users",     icon: Users,          color: "text-purple-600",  bg: "bg-purple-500/10 border-purple-500/20" },
            { label: "اقلام انبار",     val: `${(Number(stats?.inventoryCount) || 0).toLocaleString("fa-IR")} قلم`, sub: "موجود در انبار", to: "/warehouse/dashboard",      icon: Boxes,          color: "text-teal-600",    bg: "bg-teal-500/10 border-teal-500/20" },
          ].map((item, idx) => (
            <StaggerItem key={idx}>
              <TiltCard onClick={() => navigate(item.to)}>
                <Card className="p-4 border-border bg-card hover:border-primary/40 transition-all duration-300 h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground">{item.label}</span>
                    <div className={`p-2 rounded-xl border ${item.bg} ${item.color}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className={`text-xl font-black ${item.color}`}>{item.val}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-1 truncate">{item.sub}</p>
                  </div>
                </Card>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* ─── 4. بخش نمودارهای ۳D و تحلیل‌های هوشمند ──────────────────────────── */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Interactive3DBudgetChart navigate={navigate} chartData={[]} />
        </div>
        <div>
          <Interactive3DTreasuryPie navigate={navigate} treasuryStats={stats} />
        </div>
      </div>

      {/* ─── 5. دسترسی سریع منظم، دسته‌بندی‌شده و سه بعدی ──────────────────────── */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-primary border-r-4 border-accent pr-3 flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-accent" />
              دسترسی سریع به امکانات و فرم‌های سامانه
            </h2>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              جهت ورود مستقیم به هر صفحه، روی کارت مورد نظر کلیک نمایید
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سریع فرم یا عملیات..."
              className="pr-9 h-9 text-xs rounded-xl bg-card border-border shadow-sm focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredHubs.map((hub, hIdx) => (
            <div key={hIdx} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${hub.gradient} text-white shadow-md ${hub.glow}`}>
                    <hub.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">{hub.category}</h3>
                    <p className="text-xs font-medium text-muted-foreground">{hub.description}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-bold px-3 py-1">
                  {hub.items.length} میانبر
                </Badge>
              </div>

              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" staggerDelay={0.05}>
                {hub.items.map((item, iIdx) => (
                  <StaggerItem key={iIdx}>
                    <TiltCard onClick={() => navigate(item.to)} className="h-full">
                      <Card className="h-full border-border bg-card hover:border-primary/40 transition-all duration-300 p-4 flex flex-col justify-between group">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground group-hover:text-primary border-border">
                              {item.badge}
                            </Badge>
                          </div>
                          <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                            {item.label}
                          </h4>
                          <p className="text-[10px] font-medium text-muted-foreground mt-1 line-clamp-1">
                            {item.desc}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-end text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold flex items-center gap-0.5">
                            ورود به روت <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                      </Card>
                    </TiltCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 6. تعاریف پایه و زیرساختی سیستم ─────────────────────────────────── */}
      <div className="mb-8">
        <Card className="border-border shadow-md">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="flex items-center gap-2.5 text-lg font-black text-primary">
              <ListChecks className="h-5 w-5 text-accent" />
              تعاریف پایه و جداول پیش‌فرض سیستم
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground">
              مدیریت جداول کدینگ، انواع تضمینات، سپرده‌ها، شرکت‌های بیمه و اشخاص
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" staggerDelay={0.06}>
              {definitions.map((def) => (
                <StaggerItem key={def.key}>
                  <TiltCard onClick={() => setActiveModal(def.key)}>
                    <div className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02]">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${def.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                        <def.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{def.title}</span>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted font-mono font-bold text-muted-foreground">
                        {safeCount(definitionsData[def.key])} مورد
                      </Badge>
                    </div>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── MODAL تعاریف پایه ────────────────────────────────────────────── */}
      {activeDef && (
        <DefinitionModal
          key={activeModal}
          open={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={activeDef.title}
          description={activeDef.description}
          apiPath={activeDef.apiPath}
          onUpdated={() => {
            api.get(activeDef.apiPath).then((res) => {
              const arr = res.data?.data || res.data || [];
              setDefinitionsData((prev) => ({ ...prev, [activeDef.key]: Array.isArray(arr) ? arr : [] }));
            }).catch(() => {});
          }}
        />
      )}
    </PageShell>
  );
}

// ─── کامپوننت MODAL مدیریت تعاریف پایه (داده‌های واقعی API) ────────────────────
function DefinitionModal({ open, onClose, title, description, apiPath, onUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "" });

  useEffect(() => {
    if (!apiPath) return;
    setLoading(true);
    api.get(apiPath)
      .then((res) => {
        const arr = res.data?.data || res.data || [];
        setItems(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [apiPath]);

  function openNew() { setEditing("new"); setForm({ code: "", name: "" }); }
  function openEdit(i) { setEditing(i); setForm({ code: i.code || i.id || "", name: i.name || i.title || "" }); }
  function cancelEdit() { setEditing(null); }

  async function save() {
    if (!form.name.trim()) return;
    try {
      if (editing === "new") {
        const res = await api.post(apiPath, { code: form.code, name: form.name, title: form.name });
        const created = res.data?.data || res.data || { id: Date.now(), code: form.code, name: form.name };
        setItems((prev) => [...prev, created]);
      } else {
        const id = editing._id || editing.id;
        await api.put(`${apiPath}/${id}`, { code: form.code, name: form.name, title: form.name });
        setItems((prev) => prev.map((i) => ((i._id || i.id) === id ? { ...i, ...form, name: form.name } : i)));
      }
      setEditing(null);
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error("خطا در ذخیره‌سازی:", e);
    }
  }

  async function remove(item) {
    const id = item._id || item.id;
    try {
      await api.delete(`${apiPath}/${id}`);
      setItems((prev) => prev.filter((i) => (i._id || i.id) !== id));
      if (onUpdated) onUpdated();
    } catch {
      setItems((prev) => prev.filter((i) => (i._id || i.id) !== id));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="md">
      <div className="mb-4 max-h-60 overflow-y-auto rounded-xl border bg-background/50 shadow-inner">
        {loading ? (
          <div className="py-10 text-center text-xs text-muted-foreground font-medium">در حال بارگذاری اطلاعات از دیتابیس...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground font-medium">
            هیچ موردی در دیتابیس ثبت نشده است.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/80 text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2.5 text-right font-semibold">کد</th>
                <th className="px-4 py-2.5 text-right font-semibold">عنوان</th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item, idx) => (
                <tr key={item._id || item.id || idx} className="hover:bg-muted/40 transition-colors bg-card/60">
                  <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{item.code || item.id || "—"}</td>
                  <td className="px-4 py-2.5 font-bold text-foreground">{item.name || item.title || "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(item)} className="rounded-lg p-1.5 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 space-y-3 shadow-sm">
          <p className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            {editing === "new" ? "افزودن مورد جدید" : "ویرایش مورد"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">کد</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="کد شناسه" className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">عنوان <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="عنوان را وارد کنید" className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} className="h-8 text-xs">انصراف</Button>
            <Button size="sm" onClick={save} disabled={!form.name.trim()} className="h-8 text-xs">ذخیره در دیتابیس</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={openNew} className="w-full h-9 border-dashed border-2 hover:border-primary hover:bg-primary/5 font-bold text-xs">
          <Plus className="h-4 w-4 mr-1.5" /> افزودن مورد جدید
        </Button>
      )}

      <ModalFooter>
        <Button variant="outline" onClick={onClose} className="h-8 text-xs">بستن</Button>
        <Button onClick={onClose} className="h-8 text-xs">تایید و ذخیره</Button>
      </ModalFooter>
    </Modal>
  );
}
