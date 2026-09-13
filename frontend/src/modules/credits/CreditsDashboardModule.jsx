import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Landmark, ShieldCheck, TrendingUp, Wallet,
  ArrowLeftRight, Activity, Plus, FileText, CheckCircle2, Lock,
  Building2, Layers, AlertTriangle, Clock, Hourglass, ArrowUpRight,
  Zap, BarChart3, Eye, FileSpreadsheet, CreditCard, Search,
  Sparkles, Filter, ChevronLeft, ArrowRightLeft, BookOpen,
  PieChart, FileCheck2, Coins, ArrowDownLeft, ShieldAlert,
  Edit2, Check, LockKeyhole, ArrowDown, Droplets, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function CreditsDashboardModule() {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState("1405");
  
  // سیستم قفل‌گذاری دستگاه اجرایی
  const [organization, setOrganization] = useState(() => {
    return localStorage.getItem("pfs_org_name") || "وزارت امور اقتصادی و دارایی / دستگاه مرکزی";
  });
  const [isOrgLocked, setIsOrgLocked] = useState(() => {
    return !!localStorage.getItem("pfs_org_name");
  });
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/credits/dashboard-stats?fiscalYear=${fiscalYear}`);
      if (res.data?.success) {
        setStatsData(res.data);
      }
    } catch (e) {
      console.error("Error loading credit dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fiscalYear]);

  const handleSaveOrg = () => {
    if (organization.trim()) {
      localStorage.setItem("pfs_org_name", organization.trim());
      setIsOrgLocked(true);
    }
  };

  const handleUnlockOrg = () => {
    setIsOrgLocked(false);
  };

  const stats = statsData?.stats || {
    totalApproved: 32371857374,
    totalAmendments: 0,
    netBudget: 32371857374,
    totalAllocated: 4332787000,
    unallocatedBudget: 28039070374,
    totalFundingRequested: 1850000000,
    availableAllocation: 2482787000,
    totalObligations: 1200000000,
    totalReleasedObligations: 0,
    netObligations: 1200000000,
    totalVerifiedRealized: 3950000000,
    totalRemitted: 950000000,
    totalReturned: 0,
    netPayments: 950000000
  };

  const counts = statsData?.counts || {
    agreementsCount: 5,
    amendmentsCount: 1,
    allocationsCount: 3,
    fundingCount: 4,
    obligationsCount: 2,
    realizationsCount: 3,
    remittancesCount: 2,
    returnsCount: 0
  };

  const lists = statsData?.lists || {
    nearExhaustionList: [],
    openObligationsList: [],
    pendingRequestsList: [],
    pendingPaymentsList: []
  };

  // محاسبه دقیق درصدهای کسر از موافقت‌نامه
  const netBudgetVal = stats.netBudget || 1;
  const allocationPercentAgr = ((stats.totalAllocated / netBudgetVal) * 100).toFixed(1);
  const realizationPercentAgr = ((stats.totalVerifiedRealized / netBudgetVal) * 100).toFixed(1);
  const fundingPercentAgr = ((stats.totalFundingRequested / netBudgetVal) * 100).toFixed(1);
  const paymentPercentAgr = ((stats.netPayments / netBudgetVal) * 100).toFixed(1);
  const remainingPercentAgr = (100 - parseFloat(allocationPercentAgr)).toFixed(1);

  // تعریف لیست زیربخش‌های اعتبارات
  const allCreditSubmodules = [
    // ۱. موافقتنامه‌ها و برنامه‌ریزی
    {
      id: "agreements",
      category: "agreements",
      categoryName: "موافقت‌نامه و برنامه‌ریزی",
      title: "ثبت موافقت‌نامه بودجه",
      desc: "ثبت، ویرایش و مدیریت برنامه‌ها و سرفصل‌های موافقت‌نامه سالانه",
      icon: FileText,
      badge: `${counts.agreementsCount} موافقتنامه`,
      route: "/credits/agreements",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accentColor: "#f59e0b",
      isOperational: true,
    },
    {
      id: "budget-amendments",
      category: "agreements",
      categoryName: "موافقت‌نامه و برنامه‌ریزی",
      title: "متمم و اصلاحیه بودجه",
      desc: "ثبت و جابه‌جایی‌های بودجه‌ای و اصلاحیه‌های مصوب موافقت‌نامه",
      icon: Plus,
      badge: `${counts.amendmentsCount} اصلاحیه`,
      route: "/credits/budget/amendments",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accentColor: "#d97706",
      isOperational: true,
    },
    {
      id: "budget-definitions",
      category: "agreements",
      categoryName: "موافقت‌نامه و برنامه‌ریزی",
      title: "تعریف سرفصل‌های اعتباری",
      desc: "تعریف ساختار برنامه‌ای، ردیف‌ها و منابع اعتباری بخش عمومی",
      icon: Layers,
      badge: "تعاریف پایه",
      route: "/credits/definitions",
      badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      accentColor: "#b45309",
      isOperational: false,
    },

    // ۲. تخصیص و ابلاغ اعتبارات
    {
      id: "allocations-new",
      category: "allocations",
      categoryName: "تخصیص و ابلاغ",
      title: "ابلاغ و صدور تخصیص",
      desc: "تخصیص اعتبارات ابلاغی به واحدها و پروژه‌های عمرانی/جاری",
      icon: TrendingUp,
      badge: `${counts.allocationsCount} تخصیص`,
      route: "/credits/allocations/new",
      badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      accentColor: "#3b82f6",
      isOperational: true,
    },
    {
      id: "allocations-no-doc",
      category: "allocations",
      categoryName: "تخصیص و ابلاغ",
      title: "تخصیص بدون سند بودجه",
      desc: "ثبت سریع تخصیص‌های ابلاغی به دستگاه‌های تابعه و استانی",
      icon: Zap,
      badge: "ثبت سریع",
      route: "/credits/allocation-no-doc",
      badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      accentColor: "#2563eb",
      isOperational: true,
    },
    {
      id: "delegations",
      category: "allocations",
      categoryName: "تخصیص و ابلاغ",
      title: "تفویض و ابلاغ اعتبار",
      desc: "جابه‌جایی و ابلاغ اعتبار بین اختیارات واحدهای سازمانی",
      icon: ArrowLeftRight,
      badge: "تفویض اختیارات",
      route: "/credits/notification/request",
      badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
      accentColor: "#1d4ed8",
      isOperational: true,
    },

    // ۳. دریافت اعتبارات و خزانه
    {
      id: "realization",
      category: "treasury",
      categoryName: "دریافت اعتبارات و خزانه",
      title: "دریافت اعتبارات از خزانه",
      desc: "ثبت، پایش، تایید و وصول وجوه اعتباری واریز شده از خزانه داری",
      icon: CheckCircle2,
      badge: `${counts.realizationsCount} سند وصول`,
      route: "/credits/verification-realization",
      badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/30",
      gradient: "from-teal-500/10 via-teal-500/5 to-transparent",
      accentColor: "#14b8a6",
      isOperational: true,
    },
    {
      id: "treasury-requests",
      category: "treasury",
      categoryName: "دریافت اعتبارات و خزانه",
      title: "درخواست وجه از خزانه",
      desc: "ارسال و پیگیری آنلاین درخواست‌های تخصیص و وصول وجه خزانه",
      icon: Wallet,
      badge: "ارسال خزانه",
      route: "/credits/requests",
      badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/30",
      gradient: "from-teal-500/10 via-teal-500/5 to-transparent",
      accentColor: "#0d9488",
      isOperational: true,
    },
    {
      id: "receipt-no-doc",
      category: "treasury",
      categoryName: "دریافت اعتبارات و خزانه",
      title: "دریافت بدون سند بودجه",
      desc: "ثبت مستقیم واریزی‌های اعتبارات متمرکز و ردیف‌های خاص",
      icon: Coins,
      badge: "واریز مستقیم",
      route: "/credits/receipt-no-doc",
      badgeColor: "bg-teal-500/10 text-teal-600 border-teal-500/30",
      gradient: "from-teal-500/10 via-teal-500/5 to-transparent",
      accentColor: "#0f766e",
      isOperational: false,
    },

    // ۴. تأمین اعتبار و گواهی‌ها
    {
      id: "funding-request",
      category: "funding",
      categoryName: "تأمین اعتبار و گواهی‌ها",
      title: "صدور گواهی تأمین اعتبار",
      desc: "صدور گواهی و رزرو اعتباری پیش از ایجاد تعهد مالی",
      icon: ShieldCheck,
      badge: `${counts.fundingCount} گواهی`,
      route: "/credits/commitments-funding/request",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accentColor: "#a855f7",
      isOperational: true,
    },
    {
      id: "funding-confirm",
      category: "funding",
      categoryName: "تأمین اعتبار و گواهی‌ها",
      title: "تأیید و رزرو اعتبار",
      desc: "تأیید ذیحسابی و رزرو قطعی سهم اعتباری قراردادها",
      icon: FileCheck2,
      badge: "تأیید نهایی",
      route: "/credits/commitments-funding/confirm",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accentColor: "#9333ea",
      isOperational: true,
    },
    {
      id: "payroll-funding",
      category: "funding",
      categoryName: "تأمین اعتبار و گواهی‌ها",
      title: "تأمین اعتبار حقوق و دستمزد",
      desc: "رزرو و تخصیص اعتبار سرفصل پرسنلی و حقوق کارکنان",
      icon: CreditCard,
      badge: "بخش حقوق",
      route: "/credits/payroll-funding",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accentColor: "#7e22ce",
      isOperational: true,
    },
    {
      id: "funded-merge-copy",
      category: "funding",
      categoryName: "تأمین اعتبار و گواهی‌ها",
      title: "ادغام و کپی گواهی‌ها",
      desc: "ترکیب یا کپی‌برداری سریع گواهی‌های تأمین اعتبار صادر شده",
      icon: ArrowRightLeft,
      badge: "ابزار کمکی",
      route: "/credits/funded-merge",
      badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
      accentColor: "#6b21a8",
      isOperational: false,
    },

    // ۵. تعهدات و ابلاغ‌های مالی
    {
      id: "obligations-create",
      category: "obligations",
      categoryName: "تعهدات و ابلاغ‌های مالی",
      title: "ثبت تعهد بودجه‌ای",
      desc: "ثبت صورت‌حساب قطعی، فاکتور و ایجاد تعهد قانونی بدهی",
      icon: Lock,
      badge: `${counts.obligationsCount} تعهد باز`,
      route: "/credits/obligations/create",
      badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/30",
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      accentColor: "#f43f5e",
      isOperational: true,
    },
    {
      id: "obligations-release",
      category: "obligations",
      categoryName: "تعهدات و ابلاغ‌های مالی",
      title: "آزادسازی و تسویه تعهد",
      desc: "آزادسازی مابه‌التفاوت تعهدات و تسویه مانده‌های رزرو شده",
      icon: ShieldAlert,
      badge: "تسویه تعهد",
      route: "/credits/obligations/release",
      badgeColor: "bg-rose-500/10 text-rose-600 border-rose-500/30",
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
      accentColor: "#e11d48",
      isOperational: true,
    },

    // ۶. پرداخت، دفترداری و کنترل
    {
      id: "payments-remittance",
      category: "payments",
      categoryName: "پرداخت و حواله‌ها",
      title: "صدور حواله پرداخت",
      desc: "صدور دستور پرداخت بانکی و تسویه اسناد اعتباری",
      icon: Wallet,
      badge: `${counts.remittancesCount} حواله`,
      route: "/credits/payments/remittance",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      accentColor: "#10b981",
      isOperational: true,
    },
    {
      id: "payments-return",
      category: "payments",
      categoryName: "پرداخت و حواله‌ها",
      title: "استرداد و برگشت اعتبار",
      desc: "ثبت برگشتی‌های بانکی و استرداد وجوه به خزانه دار کل",
      icon: ArrowDownLeft,
      badge: `${counts.returnsCount} برگشتی`,
      route: "/credits/payments/return",
      badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      accentColor: "#059669",
      isOperational: true,
    },
    {
      id: "credit-card",
      category: "ledger",
      categoryName: "دفترداری، کنترل و شناسنامه",
      title: "شناسنامه و کارت اعتبار",
      desc: "نمایش مانده، تخصیص و زنجیره کامل هر کد برنامه‌ای",
      icon: CreditCard,
      badge: "شناسنامه جامع",
      route: "/credits/card",
      badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      accentColor: "#6366f1",
      isOperational: false,
    },
    {
      id: "credit-ledger",
      category: "ledger",
      categoryName: "دفترداری، کنترل و شناسنامه",
      title: "دفتر گردش اعتبارات",
      desc: "دفتر معین اعتباری، ثبت بدهکار/بستانکار و موازنه ردیف‌ها",
      icon: BookOpen,
      badge: "دفتر کل و معین",
      route: "/credits/ledger",
      badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      accentColor: "#4f46e5",
      isOperational: false,
    },
    {
      id: "account-review",
      category: "ledger",
      categoryName: "دفترداری، کنترل و شناسنامه",
      title: "مرور حساب‌های اعتباری",
      desc: "پایش، مرور مانده و مطابقت حساب‌های معین و تفصیلی",
      icon: Eye,
      badge: "مرور چندسطحی",
      route: "/credits/accounts-review/account-review",
      badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      accentColor: "#4338ca",
      isOperational: false,
    },
    {
      id: "sanama-reports",
      category: "ledger",
      categoryName: "دفترداری، کنترل و شناسنامه",
      title: "گزارش عملکرد و سناما",
      desc: "گزارشات استاندارد انحراف بودجه، سناما و نظارت مالی افتا",
      icon: FileSpreadsheet,
      badge: "گزارشات سناما",
      route: "/reports/budget",
      badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
      accentColor: "#3730a3",
      isOperational: false,
    },
  ];

  const filteredSubmodules = useMemo(() => {
    return allCreditSubmodules.filter((item) => {
      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-7 pb-10 selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* 🌟 ۱. هدر اصلی مدیریت اعتبارات (تمیز و بدون کلمات اضافی) */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#063b36] via-[#094843] to-[#042d29] p-6 sm:p-8 text-white shadow-[0_20px_50px_-10px_rgba(4,45,41,0.3)] border border-emerald-500/20">
        
        {/* Glows and Light Accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

        <div className="relative z-10 space-y-6">
          
          {/* Top Bar: Title & Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-amber-300 shadow-xl group hover:scale-105 transition-transform duration-300">
                <Landmark className="h-7 w-7 text-amber-400" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    داشبورد جامع مدیریت اعتبارات
                  </h1>
                </div>
                <p className="text-xs font-semibold text-emerald-100/80 mt-1">
                  پایش لحظه‌ای و هدایت کامل تمام گزینه‌های چرخه بودجه، تخصیص، خزانه و پرداخت
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <Button
                onClick={fetchStats}
                disabled={loading}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 text-amber-300 ${loading ? "animate-spin" : ""}`} />
                <span>بروزرسانی داده‌ها</span>
              </Button>
            </div>
          </div>

          {/* Controls Bar: Filters, Search & Editable/Lockable Org Field */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2">
            
            {/* Search Input Bar */}
            <div className="md:col-span-5 relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/60 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی سریع در کل بخش‌های اعتبارات..."
                className="w-full h-11 pr-10 pl-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white placeholder:text-emerald-100/50 text-xs font-semibold focus:outline-none focus:bg-white/20 focus:border-amber-400/60 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-200 hover:text-white bg-white/10 rounded-md px-1.5 py-0.5"
                >
                  پاک‌سازی
                </button>
              )}
            </div>

            {/* Year Selector */}
            <div className="md:col-span-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 px-3 py-1.5 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-300 shrink-0" />
              <div className="flex-1">
                <span className="text-[9px] text-emerald-200/70 font-bold block">سال مالی:</span>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="w-full bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer"
                >
                  <option value="1405" className="text-slate-900 font-bold">۱۴۰۵ (سال جاری)</option>
                  <option value="1404" className="text-slate-900 font-bold">۱۴۰۴</option>
                  <option value="1403" className="text-slate-900 font-bold">۱۴۰۳</option>
                </select>
              </div>
            </div>

            {/* Editable & Lockable Org Input Field */}
            <div className="md:col-span-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 px-3.5 py-1.5 flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-emerald-300 shrink-0" />
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-emerald-200/70 font-bold block">دستگاه اجرایی / واحد:</span>
                  {isOrgLocked && (
                    <span className="text-[9px] text-amber-300 font-bold flex items-center gap-1 bg-amber-400/20 px-1.5 py-0.2 rounded">
                      <LockKeyhole className="h-2.5 w-2.5" />
                      قفل شده
                    </span>
                  )}
                </div>

                {isOrgLocked ? (
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs font-bold text-white truncate block">
                      {organization || "نامشخص"}
                    </span>
                    <button
                      type="button"
                      onClick={handleUnlockOrg}
                      title="ویرایش نام دستگاه"
                      className="text-emerald-200 hover:text-amber-300 transition-colors shrink-0 p-1 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveOrg(); }}
                      className="w-full bg-white/15 text-xs font-bold text-white focus:outline-none rounded px-2 py-0.5 border border-emerald-400/40"
                      placeholder="نام دستگاه اجرایی را وارد کنید..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveOrg}
                      title="ثبت و قفل دستگاه"
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded shadow-sm transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      <span>ثبت</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Quick Access Floating Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10 text-xs font-bold">
            <span className="text-[11px] text-emerald-200/80 font-medium">میانبرهای پرکاربرد:</span>
            <button
              onClick={() => navigate("/credits/agreements")}
              className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 px-3 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>ثبت موافقت‌نامه جدید</span>
            </button>
            <button
              onClick={() => navigate("/credits/allocations/new")}
              className="bg-blue-400/20 hover:bg-blue-400/30 text-blue-200 px-3 py-1 rounded-lg border border-blue-400/30 flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
            >
              <TrendingUp className="h-3 w-3" />
              <span>ابلاغ تخصیص</span>
            </button>
            <button
              onClick={() => navigate("/credits/verification-realization")}
              className="bg-teal-400/20 hover:bg-teal-400/30 text-teal-200 px-3 py-1 rounded-lg border border-teal-400/30 flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>دریافت اعتبارات</span>
            </button>
            <button
              onClick={() => navigate("/credits/commitments-funding/request")}
              className="bg-purple-400/20 hover:bg-purple-400/30 text-purple-200 px-3 py-1 rounded-lg border border-purple-400/30 flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>صدور تأمین اعتبار</span>
            </button>
            <button
              onClick={() => navigate("/credits/payments/remittance")}
              className="bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 px-3 py-1 rounded-lg border border-emerald-400/30 flex items-center gap-1.5 transition-all text-[11px] cursor-pointer"
            >
              <Wallet className="h-3 w-3" />
              <span>صدور حواله پرداخت</span>
            </button>
          </div>

        </div>
      </div>


      {/* 🌟 ۲. انیمیشن فوق‌العاده خاص و سبک: پایش زنده و کسر از حوضچه موافقت‌نامه (Agreement Pool Budget Drain Animation) */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-[#0c2a27] via-card to-card shadow-xl rounded-3xl overflow-hidden relative">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-4 border-b border-border/50 bg-card/60 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold shadow-lg animate-pulse">
                <Flame className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                  جریان انیمیشنی مصرف و کسر از حوضچه موافقت‌نامه
                  <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 animate-pulse">
                    کسر زنده بودجه ⚡
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  نمایش تصویری و انیمیشنی نحوه کسر سهم تخصیص، دریافت، تامین اعتبار و پرداخت از کل موافقت‌نامه مصوب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-xl border border-border/40 text-xs font-black text-amber-600 dark:text-amber-300 self-start sm:self-auto">
              <span>مانده آزاد موافقت‌نامه:</span>
              <span className="font-mono text-sm">{remainingPercentAgr}%</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-7 space-y-7">
          
          {/* Main Visual Reservoir Bar (نوار اصلی مخزن بودجه موافقت‌نامه) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-black">
              <div className="flex items-center gap-2 bg-amber-400 border-2 border-amber-500 px-3.5 py-1.5 rounded-xl shadow-md text-slate-950">
                <Landmark className="h-4 w-4 text-slate-950 shrink-0" />
                <span className="text-slate-950 font-black">حوضچه کل موافقت‌نامه:</span>
                <span className="font-mono text-sm sm:text-base font-black text-slate-950 px-2.5 py-0.5 rounded-lg bg-amber-300/90 border border-amber-600/40 shadow-sm">
                  {fmtNum(stats.netBudget)} ریال (۱۰۰٪)
                </span>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/20 border-2 border-emerald-400/70 px-3.5 py-1.5 rounded-xl shadow-md text-white backdrop-blur-md">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-300 shrink-0 animate-pulse" />
                <span className="text-white font-black text-xs sm:text-sm">مانده آزاد قابل تخصیص:</span>
                <span className="font-mono text-sm sm:text-base font-black text-white px-2.5 py-0.5 rounded-lg bg-emerald-400/30 border border-emerald-300/60 text-white shadow-inner">
                  {fmtNum(stats.unallocatedBudget)} ریال
                </span>
              </div>
            </div>

            {/* Dynamic Segmented Progress Bar */}
            <div className="h-7 w-full bg-slate-900/80 rounded-2xl p-1 border border-border/80 flex items-center gap-1 shadow-inner relative overflow-hidden">
              
              {/* Animated Segment 1: Allocations (تخصیص) */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, allocationPercentAgr)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl relative group cursor-pointer shadow-md overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] [background-size:16px_16px] animate-[stripes_2s_linear_infinite]" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white px-1 truncate">
                  تخصیص {allocationPercentAgr}%
                </span>
              </motion.div>

              {/* Animated Segment 2: Remaining Unallocated (مانده بودجه آزاد) */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(10, remainingPercentAgr)}%` }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 rounded-xl relative group cursor-pointer shadow-md"
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white px-1 truncate">
                  مانده آزاد {remainingPercentAgr}%
                </span>
              </motion.div>
            </div>
          </div>


          {/* 🌟 4 Flowing Animated Streams connecting Agreement to Downstream Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            
            {/* 流 Stream Node 1: Allocation (تخصیص) */}
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-card to-card border-2 border-blue-500/40 shadow-lg relative overflow-hidden group space-y-3"
            >
              {/* Animated Stream Tube Connector */}
              <div className="absolute top-0 right-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  تخصیص اعتبار
                </span>
                <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-400 text-[10px] font-black">
                  {allocationPercentAgr}% از موافقت‌نامه
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                  {fmtNum(stats.totalAllocated)}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold">ریال تخصیص کسرشده از بودجه</p>
              </div>

              {/* Animated Flowing Particles Bar */}
              <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between text-[11px] font-extrabold text-blue-600">
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  در حال کسر از موافقت‌نامه
                </span>
                <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* 流 Stream Node 2: Realization / Treasury (دریافت اعتبارات) */}
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-card to-card border-2 border-teal-500/40 shadow-lg relative overflow-hidden group space-y-3"
            >
              <div className="absolute top-0 right-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-teal-500 to-emerald-400 animate-pulse" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  دریافت اعتبارات
                </span>
                <Badge className="bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-400 text-[10px] font-black">
                  {realizationPercentAgr}% از موافقت‌نامه
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black text-teal-600 dark:text-teal-400 font-mono tracking-tight">
                  {fmtNum(stats.totalVerifiedRealized)}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold">ریال دریافت نقدینگی خزانه</p>
              </div>

              <div className="pt-2 border-t border-teal-500/20 flex items-center justify-between text-[11px] font-extrabold text-teal-600">
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  وصول‌شده از موافقت‌نامه
                </span>
                <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* 流 Stream Node 3: Funding / Reserve (تأمین اعتبار) */}
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-card to-card border-2 border-purple-500/40 shadow-lg relative overflow-hidden group space-y-3"
            >
              <div className="absolute top-0 right-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-purple-500 to-indigo-400 animate-pulse" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  تأمین اعتبار
                </span>
                <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-400 text-[10px] font-black">
                  {fundingPercentAgr}% از موافقت‌نامه
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                  {fmtNum(stats.totalFundingRequested)}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold">ریال رزرو شده پیش از تعهد</p>
              </div>

              <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-[11px] font-extrabold text-purple-600">
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                  رزرو سهم موافقت‌نامه
                </span>
                <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

            {/* 流 Stream Node 4: Payment (پرداخت نهایی) */}
            <motion.div
              whileHover={{ scale: 1.03, y: -4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border-2 border-emerald-500/40 shadow-lg relative overflow-hidden group space-y-3"
            >
              <div className="absolute top-0 right-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  پرداخت نهایی
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400 text-[10px] font-black">
                  {paymentPercentAgr}% از موافقت‌نامه
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                  {fmtNum(stats.netPayments)}
                </div>
                <p className="text-[10px] text-muted-foreground font-bold">ریال تسویه نهایی بانکی</p>
              </div>

              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-extrabold text-emerald-600">
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  تسویه‌شده از موافقت‌نامه
                </span>
                <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </motion.div>

          </div>

        </CardContent>
      </Card>


      {/* 🌟 ۳. کارت‌های ۵گانه خلاصه وضعیت اعتبارات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* ۱. موافقت‌نامه */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 via-card to-card p-4 border border-amber-500/30 shadow-md group cursor-pointer"
          onClick={() => navigate("/credits/agreements")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-amber-500" />
              ۱. موافقتنامه سالانه
            </span>
            <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px] font-extrabold">
              {counts.agreementsCount} برنامه
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              {fmtNum(stats.netBudget)}
            </div>
            <p className="text-[10px] text-muted-foreground font-extrabold">ریال بودجه مصوب</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-500/15 flex items-center justify-between text-[11px] font-bold text-amber-600">
            <span>مدیریت برنامه‌ها</span>
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* ۲. تخصیص اعتبارات */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 via-card to-card p-4 border border-blue-500/30 shadow-md group cursor-pointer"
          onClick={() => navigate("/credits/allocations/new")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              ۲. تخصیص ابلاغی
            </span>
            <Badge variant="outline" className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[10px] font-extrabold">
              {counts.allocationsCount} ابلاغیه
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {fmtNum(stats.totalAllocated)}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-extrabold">ریال تخصیص‌یافته</span>
              <span className="font-mono font-bold text-blue-600">{allocationPercentAgr}% کسر</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-blue-500/15 flex items-center justify-between text-[11px] font-bold text-blue-600">
            <span>صدور تخصیص</span>
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* ۳. دریافت اعتبارات */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative rounded-2xl bg-gradient-to-br from-teal-500/10 via-card to-card p-4 border border-teal-500/30 shadow-md group cursor-pointer"
          onClick={() => navigate("/credits/verification-realization")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
              ۳. دریافت اعتبارات
            </span>
            <Badge variant="outline" className="bg-teal-500/15 text-teal-700 border-teal-500/30 text-[10px] font-extrabold">
              {counts.realizationsCount} سند وصول
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400 tracking-tight">
              {fmtNum(stats.totalVerifiedRealized)}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-extrabold">ریال دریافت از خزانه</span>
              <span className="font-mono font-bold text-teal-600">{realizationPercentAgr}% کسر</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-teal-500/15 flex items-center justify-between text-[11px] font-bold text-teal-600">
            <span>وصول اعتبارات</span>
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* ۴. تأمین اعتبار */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative rounded-2xl bg-gradient-to-br from-purple-500/10 via-card to-card p-4 border border-purple-500/30 shadow-md group cursor-pointer"
          onClick={() => navigate("/credits/commitments-funding/request")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              ۴. تأمین اعتبار
            </span>
            <Badge variant="outline" className="bg-purple-500/15 text-purple-700 border-purple-500/30 text-[10px] font-extrabold">
              {counts.fundingCount} گواهی
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {fmtNum(stats.totalFundingRequested)}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-extrabold">ریال رزرو اعتباری</span>
              <span className="font-mono font-bold text-purple-600">{fundingPercentAgr}% کسر</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-500/15 flex items-center justify-between text-[11px] font-bold text-purple-600">
            <span>رزرو و گواهی</span>
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* ۵. پرداخت اعتبارات */}
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card p-4 border border-emerald-500/30 shadow-md group cursor-pointer"
          onClick={() => navigate("/credits/payments/remittance")}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-emerald-500" />
              ۵. پرداخت نهایی
            </span>
            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] font-extrabold">
              {counts.remittancesCount} حواله
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {fmtNum(stats.netPayments)}
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground font-extrabold">ریال پرداخت شده</span>
              <span className="font-mono font-bold text-emerald-600">{paymentPercentAgr}% کسر</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-500/15 flex items-center justify-between text-[11px] font-bold text-emerald-600">
            <span>دستور پرداخت</span>
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
        </motion.div>

      </div>


      {/* 🌟 ۴. هاب جامع گزینه‌های مدیریت اعتبارات */}
      <div className="space-y-4">
        
        {/* Category Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card/80 p-4 rounded-2xl border border-border/80 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#063b36] to-[#094843] text-amber-300 flex items-center justify-center font-bold shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                دسترسی به تمام گزینه‌های مدیریت اعتبارات
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-extrabold">
                  {filteredSubmodules.length} بخش فعال
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                مجموعه کامل ابزارها، صفحه‌ها و فرم‌های اجرایی و کنترلی اعتبارات
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border/50">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "all"
                  ? "bg-emerald-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              همه گزینه‌ها ({allCreditSubmodules.length})
            </button>
            <button
              onClick={() => setActiveCategory("agreements")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "agreements"
                  ? "bg-amber-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              موافقت‌نامه
            </button>
            <button
              onClick={() => setActiveCategory("allocations")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "allocations"
                  ? "bg-blue-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              تخصیص
            </button>
            <button
              onClick={() => setActiveCategory("treasury")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "treasury"
                  ? "bg-teal-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              دریافت از خزانه
            </button>
            <button
              onClick={() => setActiveCategory("funding")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "funding"
                  ? "bg-purple-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              تأمین اعتبار
            </button>
            <button
              onClick={() => setActiveCategory("obligations")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "obligations"
                  ? "bg-rose-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              تعهدات
            </button>
            <button
              onClick={() => setActiveCategory("payments")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "payments"
                  ? "bg-emerald-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              پرداخت
            </button>
            <button
              onClick={() => setActiveCategory("ledger")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                activeCategory === "ledger"
                  ? "bg-indigo-600 text-white shadow-md font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              دفترداری و کارت
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSubmodules.map((item) => {
              const IconComp = item.icon;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => navigate(item.route)}
                  className="group cursor-pointer rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/80 p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    borderColor: item.accentColor + "40",
                  }}
                >
                  <div
                    className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none", item.gradient)}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: item.accentColor + "15",
                          color: item.accentColor,
                          border: `1px solid ${item.accentColor}30`,
                        }}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", item.badgeColor)}>
                        {item.badge}
                      </Badge>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <span className="text-[10px] font-extrabold text-muted-foreground block">{item.categoryName}</span>
                      <h4 className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium mt-1 line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between relative z-10 text-xs font-extrabold">
                    <span className="flex items-center gap-1" style={{ color: item.accentColor }}>
                      {item.isOperational ? "ورود به بخش عملیاتی" : "مشاهده و کنترل"}
                    </span>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center group-hover:-translate-x-1 transition-transform"
                      style={{
                        backgroundColor: item.accentColor + "15",
                        color: item.accentColor,
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>


      {/* 🌟 ۵. جدول‌های پایش۴گانه اعتبارات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3">
        
        {/* ۱. اعتبارات نزدیک به اتمام (بالای ۷۰٪ مصرف) */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border border-rose-500/20 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-rose-500/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 text-rose-500 animate-bounce" />
              اعتبارات نزدیک به اتمام (بالای ۷۰٪ مصرف)
            </CardTitle>
            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-extrabold">
              {lists.nearExhaustionList.length} ردیف بحرانی
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">عنوان / کد برنامه</th>
                    <th className="p-3">بودجه کل</th>
                    <th className="p-3">تخصیص‌یافته</th>
                    <th className="p-3 text-center">درصد مصرف</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.nearExhaustionList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground font-medium">
                        اعتباری به حد آستانه اتمام (۷۰٪ به بالا) نرسیده است.
                      </td>
                    </tr>
                  ) : (
                    lists.nearExhaustionList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-foreground block">{item.title}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{item.program_code || "-"}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-foreground">{fmtNum(item.totalBudget)}</td>
                        <td className="p-3 font-mono font-semibold text-blue-600">{fmtNum(item.allocatedAmount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 font-extrabold px-2 py-0.5">
                            {item.usagePercent}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ۲. تعهدات باز و معوق */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border border-purple-500/20 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-purple-500/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Lock className="h-4 w-4 text-purple-500" />
              تعهدات باز و معوق بودجه‌ای
            </CardTitle>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-extrabold">
              {lists.openObligationsList.length} تعهد فعال
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره تعهد</th>
                    <th className="p-3">ذینفع / پیمانکار</th>
                    <th className="p-3">مبلغ تعهد (ریال)</th>
                    <th className="p-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.openObligationsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground font-medium">
                        هیچ تعهد باز یا تسویه‌نشده‌ای وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    lists.openObligationsList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{item.obligation_number}</td>
                        <td className="p-3 font-semibold text-foreground">{item.beneficiary_name}</td>
                        <td className="p-3 font-mono font-bold text-purple-600">{fmtNum(item.amount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 font-bold">
                            فعال
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ۳. درخواست‌های در انتظار تأیید */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border border-amber-500/20 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-amber-500/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Hourglass className="h-4 w-4 text-amber-500" />
              درخواست‌های وجه در انتظار بررسی
            </CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-extrabold">
              {lists.pendingRequestsList.length} درخواست
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره درخواست</th>
                    <th className="p-3">واحد درخواست‌کننده</th>
                    <th className="p-3">مبلغ (ریال)</th>
                    <th className="p-3 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.pendingRequestsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground font-medium">
                        درخواستی در انتظار تأیید وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    lists.pendingRequestsList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{item.request_number}</td>
                        <td className="p-3 font-semibold text-foreground">{item.requesting_unit || item.purpose}</td>
                        <td className="p-3 font-mono font-bold text-amber-600">{fmtNum(item.amount)}</td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 font-bold">
                            در انتظار بررسی
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ۴. حواله‌ها و پرداخت‌های در انتظار تسویه */}
        <Card className="shadow-sm hover:shadow-md transition-shadow border border-emerald-500/20 rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50 bg-emerald-500/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4 text-emerald-500" />
              حواله‌ها و پرداخت‌های در انتظار تسویه
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-extrabold">
              {lists.pendingPaymentsList.length} حواله معلق
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">شماره حواله</th>
                    <th className="p-3">نام دریافت‌کننده</th>
                    <th className="p-3">مبلغ (ریال)</th>
                    <th className="p-3 text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.pendingPaymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground font-medium">
                        پرداخت در انتظاری وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    lists.pendingPaymentsList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{item.remittance_number}</td>
                        <td className="p-3 font-semibold text-foreground">{item.recipient_name}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{fmtNum(item.amount)}</td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-blue-600 font-extrabold hover:bg-blue-50 cursor-pointer"
                            onClick={() => navigate("/credits/payments/remittance")}
                          >
                            مشاهده
                            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
