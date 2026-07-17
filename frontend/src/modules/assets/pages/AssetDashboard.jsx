import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, DollarSign, Activity, AlertTriangle, ShieldCheck, MapPin,
  TrendingUp, RefreshCw, BarChart3, ChevronLeft, QrCode, User, Link2, Box
} from "lucide-react";
import { useAssets } from "@/context/AssetContext";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "ثبت مال جدید",     to: "/assets/register/new",      icon: Package,        color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50" },
  { label: "تحویل به پرسنل",   to: "/assets/register/delivery", icon: User,           color: "bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100/50" },
  { label: "انتقال اموال",     to: "/assets/register/transfer", icon: ArrowLeftRightIcon, color: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50" },
  { label: "ارسال به تعمیر",   to: "/assets/register/repair",   icon: Activity,       color: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100/50" },
  { label: "محاسبه استهلاک",  to: "/assets/depreciation/monthly", icon: DollarSign,     color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50" },
  { label: "لیست کل اموال",    to: "/assets/reports/all",       icon: BarChart3,      color: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/50" },
];

function ArrowLeftRightIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  );
}

export default function AssetDashboard() {
  const navigate = useNavigate();
  const {
    assets, refreshAssets, groups, locations, loading
  } = useAssets();

  const assetsList = useMemo(() => assets || [], [assets]);

  // Calculations for KPI Cards
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    let totalDep = 0;
    let totalBookValue = 0;
    let scrapCount = 0;
    let activeCount = 0;

    assetsList.forEach(a => {
      const q = Number(a.quantity || 1);
      totalQty += q;
      totalCost += q * Number(a.purchaseAmount || 0);
      totalDep += Number(a.accumulatedDepreciation || 0);
      totalBookValue += Number(a.bookValue || a.purchaseAmount || 0);
      
      if (a.status === "scrapped" || a.status === "اسقاطی") {
        scrapCount += q;
      } else {
        activeCount += q;
      }
    });

    return {
      totalQty,
      totalCost,
      totalDep,
      totalBookValue,
      scrapCount,
      activeCount
    };
  }, [assetsList]);

  // Group asset distribution conic donut chart data
  const groupChartData = useMemo(() => {
    const map = {};
    assetsList.forEach(a => {
      const q = Number(a.quantity || 1);
      const grp = a.assetGroup || "سایر";
      map[grp] = (map[grp] || 0) + q;
    });

    const entries = Object.entries(map).map(([name, val]) => ({ name, val }));
    const total = entries.reduce((sum, e) => sum + e.val, 0);

    if (total === 0) return [];

    entries.sort((a, b) => b.val - a.val);
    const top = entries.slice(0, 4);
    if (entries.length > 4) {
      const otherVal = entries.slice(4).reduce((sum, e) => sum + e.val, 0);
      top.push({ name: "سایر گروه‌ها", val: otherVal });
    }

    let accumulatedPercent = 0;
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
    return top.map((entry, idx) => {
      const percent = (entry.val / total) * 100;
      const start = accumulatedPercent;
      accumulatedPercent += percent;
      return {
        ...entry,
        percent,
        color: colors[idx % colors.length],
        start,
        end: accumulatedPercent
      };
    });
  }, [assetsList]);

  const donutStyle = useMemo(() => {
    if (groupChartData.length === 0) return { background: "#e2e8f0" };
    const segments = groupChartData.map(d => `${d.color} ${d.start}% ${d.end}%`);
    return {
      background: `conic-gradient(from 0deg, ${segments.join(", ")})`
    };
  }, [groupChartData]);

  // Asset location statistics (horizontal bars)
  const locationStats = useMemo(() => {
    const map = {};
    assetsList.forEach(a => {
      const q = Number(a.quantity || 1);
      const loc = a.location || "تعریف نشده";
      map[loc] = (map[loc] || 0) + q;
    });

    const list = Object.entries(map).map(([name, qty]) => ({ name, qty }));
    const maxQty = Math.max(...list.map(l => l.qty), 1);
    return list.map(l => ({
      ...l,
      percent: (l.qty / maxQty) * 100
    })).sort((a, b) => b.qty - a.qty);
  }, [assetsList]);

  // Purchase activity history by Persian Year (last 5 years)
  const annualPurchaseData = useMemo(() => {
    const map = {};
    assetsList.forEach(a => {
      const q = Number(a.quantity || 1);
      const amount = q * Number(a.purchaseAmount || 0);
      
      // Extract year from purchaseDate e.g. "1402/05/12" -> "1402"
      let year = "سایر";
      if (a.purchaseDate && a.purchaseDate.length >= 4) {
        const yr = a.purchaseDate.slice(0, 4);
        if (/^\d{4}$/.test(yr)) year = yr;
      }
      map[year] = (map[year] || 0) + amount;
    });

    const entries = Object.entries(map)
      .filter(([yr]) => yr !== "سایر")
      .map(([year, val]) => ({ year, val }));
      
    // Sort chronologically
    entries.sort((a, b) => a.year.localeCompare(b.year));
    
    // Take last 5 years or pad if empty
    let list = entries.slice(-5);
    if (list.length === 0) {
      list = [
        { year: "۱۴۰۰", val: 0 },
        { year: "۱۴۰۱", val: 0 },
        { year: "۱۴۰۲", val: 0 },
        { year: "۱۴۰۳", val: 0 },
        { year: "۱۴۰۴", val: 0 }
      ];
    }

    const maxVal = Math.max(...list.map(y => y.val), 10);
    return list.map(y => ({
      ...y,
      percent: (y.val / maxVal) * 100
    }));
  }, [assetsList]);

  // Latest 5 registered assets
  const recentAssets = useMemo(() => {
    return [...assetsList]
      .sort((a, b) => (b.purchaseDate || "").localeCompare(a.purchaseDate || ""))
      .slice(0, 5);
  }, [assetsList]);

  const handleRefresh = async () => {
    await refreshAssets();
  };

  const dashboardKPIs = [
    { label: "تعداد کل دارایی‌ها", value: stats.totalQty, sub: "تعداد فیزیکی پلاک‌کوبی شده", icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "ارزش تاریخی خرید", value: `${(stats.totalCost / 10).toLocaleString("fa-IR")} تومان`, sub: `${stats.totalCost.toLocaleString("fa-IR")} ریال`, icon: DollarSign, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "استهلاک انباشته", value: `${(stats.totalDep / 10).toLocaleString("fa-IR")} تومان`, sub: `${stats.totalDep.toLocaleString("fa-IR")} ریال`, icon: TrendingUp, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { label: "ارزش دفتری خالص", value: `${(stats.totalBookValue / 10).toLocaleString("fa-IR")} تومان`, sub: `${stats.totalBookValue.toLocaleString("fa-IR")} ریال`, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "اموال مستهلک و اسقاطی", value: stats.scrapCount, sub: "خارج از چرخه بهره‌برداری", icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "اموال فعال مستقر", value: stats.activeCount, sub: "در حال بهره‌برداری سازمانی", icon: Activity, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/30" },
  ];

  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline">سیستم اموال</span>
        <span>/</span>
        <span>داشبورد اموال</span>
      </div>

      <PageHeader title="داشبورد تحلیلی اموال و دارایی‌های ثابت" description="گزارش‌های جامع سرمایه‌ای، ارزش دفتری، محاسبات استهلاک و توزیع مکانی دارایی‌ها">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> بروزرسانی
          </Button>
          <Button size="sm" onClick={() => navigate("/assets/reports/all")} className="bg-primary hover:bg-primary/95 text-primary-foreground gap-1">
            <BarChart3 className="h-4 w-4" /> لیست گزارشات
          </Button>
        </div>
      </PageHeader>

      {/* ۱. کارت‌های شاخص‌های کلیدی عملکرد (KPIs) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" dir="rtl">
        {dashboardKPIs.map((k, idx) => (
          <Card key={idx} className="overflow-hidden hover:shadow-md transition-all duration-300 border-slate-100">
            <CardContent className="p-4 flex items-center justify-between text-right">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500 leading-tight">{k.label}</p>
                <p className={cn("text-lg font-extrabold tracking-tight", k.color)}>{k.value.toLocaleString("fa-IR")}</p>
                <p className="text-[9.5px] text-muted-foreground leading-none">{k.sub}</p>
              </div>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", k.bg)}>
                <k.icon className={cn("h-5 w-5", k.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ۲. نمودارها و چارت‌های تحلیل گرافیکی */}
      <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3" dir="rtl">
        
        {/* نمودار توزیع گروهی اموال */}
        <Card className="flex flex-col">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">توزیع گروهی اموال</CardTitle>
            <CardDescription className="text-xs">سهم هر گروه از کل دارایی‌های ثابت سازمان</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center pb-4">
            {groupChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">اموالی ثبت نشده است</div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center gap-6 justify-center">
                {/* Conic Donut Chart */}
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-inner" style={donutStyle}>
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {stats.totalQty.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[9px] text-muted-foreground">پلاک فعال</span>
                  </div>
                </div>

                {/* Color Legend */}
                <div className="flex flex-col gap-2 text-right">
                  {groupChartData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{d.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mr-auto">{d.percent.toFixed(0)}٪</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نمودار خرید سالانه اموال */}
        <Card className="flex flex-col">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">روند خرید سالانه اموال</CardTitle>
            <CardDescription className="text-xs">بهای تمام‌شده کل خریدهای سرمایه‌ای به تفکیک سال مالی</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end pb-4">
            <div className="h-40 w-full flex items-end gap-3 px-2 border-b pb-2">
              {annualPurchaseData.map((year, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[9px] rounded py-1 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-none">
                    خرید: {(year.val / 10).toLocaleString("fa-IR")} تومان
                  </div>
                  
                  {/* Single bar */}
                  <div 
                    className="w-5 bg-gradient-to-t from-indigo-500 to-blue-600 rounded-t transition-all duration-500 hover:from-indigo-600 hover:to-blue-700" 
                    style={{ height: `${year.percent}%` }}
                  />

                  <span className="text-[10px] font-bold text-slate-500 mt-2">{year.year}</span>
                </div>
              ))}
            </div>
            {/* Legend info */}
            <div className="mt-4 text-center text-[10px] text-muted-foreground">نمایش بهای خرید تاریخی ثبت شده اموال پلاک شده</div>
          </CardContent>
        </Card>

        {/* پراکندگی مکانی اموال */}
        <Card className="flex flex-col">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">پراکندگی مکانی اموال</CardTitle>
            <CardDescription className="text-xs">تعداد تجهیزات مستقر در ساختمان‌ها و دفاتر مختلف</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center space-y-4">
            {locationStats.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground font-semibold">مکان استقراری تعریف نشده است</div>
            ) : (
              locationStats.slice(0, 4).map((l, idx) => (
                <div key={idx} className="space-y-1 text-right">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                      {l.name}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {l.qty.toLocaleString("fa-IR")} <span className="text-[10px] text-muted-foreground font-normal">پلاک</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-l from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${l.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* ۳. عملیات سریع و آخرین دارایی‌های ثبت شده */}
      <div className="grid gap-6 lg:grid-cols-3" dir="rtl">
        
        {/* دسترسی‌های سریع اموال */}
        <Card className="lg:col-span-1 border-slate-100">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">عملیات سریع سیستم اموال</CardTitle>
            <CardDescription className="text-xs">ثبت، تغییرات، واگذاری و محاسبات اموال</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-3">
              {QUICK_LINKS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-2xl border bg-muted/20 p-3 text-center transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5",
                    item.color
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-950 shadow-sm border border-slate-100 transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* آخرین دارایی‌های ثبت شده در سیستم */}
        <Card className="lg:col-span-2 border-slate-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between" dir="rtl">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 text-right">
                  آخرین تجهیزات و اموال پلاک شده
                </CardTitle>
                <CardDescription className="text-xs text-right">دارایی‌های اخیری که به سیستم اضافه شده‌اند</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600" onClick={() => navigate("/assets/reports/all")}>
                لیست کل اموال <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40 text-slate-500">
                    <th className="px-4 py-2.5 font-bold">پلاک / کد مال</th>
                    <th className="px-4 py-2.5 font-bold">نام دارایی</th>
                    <th className="px-4 py-2.5 font-bold">گروه دارایی</th>
                    <th className="px-4 py-2.5 font-bold">مسئول مال</th>
                    <th className="px-4 py-2.5 font-bold">بهای تمام‌شده</th>
                    <th className="px-4 py-2.5 font-bold">تاریخ خرید</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground font-semibold">هیچ دارایی پلاک شده‌ای یافت نشد.</td>
                    </tr>
                  ) : recentAssets.map((asset, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {asset.assetCode || `PL-${asset.id || idx}`}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{asset.assetName}</p>
                        <span className="text-[9px] text-slate-400 font-mono block">سریال: {asset.serialNumber || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">{asset.assetGroup || "—"}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {asset.personnelName || "تعریف نشده"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {Number(asset.purchaseAmount || 0).toLocaleString("fa-IR")}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{asset.purchaseDate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
