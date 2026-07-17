import { useNavigate } from "react-router-dom";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Calculator, FileText, CreditCard,
  TrendingUp, AlertTriangle, Clock, ChevronLeft,
  Printer, BarChart3, Coins, Award
} from "lucide-react";
import { useMemo } from "react";
import { toPersianDigits } from "./InsuranceSettings";

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

const QUICK_ACTIONS = [
  { label: "محاسبه حقوق ماهانه",  to: "/payroll/calculate/monthly", icon: Calculator, color: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" },
  { label: "ثبت کارمند جدید",    to: "/payroll/employees/new",      icon: Users,      color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
  { label: "ثبت کارکرد پرسنل",   to: "/payroll/attendance/register",icon: Clock,      color: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" },
  { label: "صدور فیش حقوقی",    to: "/payroll/payslip",            icon: Printer,    color: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
  { label: "ثبت مساعده جدید",    to: "/payroll/loans/advance",      icon: Coins,      color: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
  { label: "مرکز گزارش‌ها",      to: "/payroll/reports",            icon: BarChart3,  color: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" }
];

const fmtToman = (n) => {
  const toman = Math.round((Number(n) || 0) / 10);
  if (toman >= 1_000_000_000) {
    return `${(toman / 1_000_000_000).toFixed(1).toLocaleString("fa-IR")} میلیارد تومان`;
  }
  if (toman >= 1_000_000) {
    return `${(toman / 1_000_000).toFixed(1).toLocaleString("fa-IR")} میلیون تومان`;
  }
  return `${toman.toLocaleString("fa-IR")} تومان`;
};

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const { 
    employees = [], 
    payrollCalculations = [], 
    employeeLoans = [], 
    employeeAdvances = [] 
  } = useAssets() || {};

  // ۱. محاسبه آمار و استخراج آخرین دوره مالی
  const stats = useMemo(() => {
    // فیلتر کردن رکوردهای نامعتبر یا خالی
    const validCalcs = (payrollCalculations || []).filter(c => c && c.year && c.month);

    const sortedCalcs = [...validCalcs].sort((a, b) => {
      const aVal = Number(a.year) * 12 + Number(a.month);
      const bVal = Number(b.year) * 12 + Number(b.month);
      return bVal - aVal;
    });

    const latestCalc = sortedCalcs[0];
    const latestYear = latestCalc ? String(latestCalc.year) : "1405";
    const latestMonth = latestCalc ? String(latestCalc.month) : "01";

    const currentMonthCalcs = validCalcs.filter(
      c => String(c.year) === latestYear && String(c.month) === latestMonth
    );

    // محاسبه مقادیر کلی ماه اخیر
    const totalGross = currentMonthCalcs.reduce((s, c) => s + (Number(c.grossSalary) || 0), 0);
    const totalNet = currentMonthCalcs.reduce((s, c) => s + (Number(c.netSalary) || 0), 0);
    const totalInsurance = currentMonthCalcs.reduce((s, c) => s + (Number(c.insEmployee) || 0), 0);
    const totalTax = currentMonthCalcs.reduce((s, c) => s + (Number(c.monthlyTax) || 0), 0);

    // تعداد کل پرسنل
    const totalEmp = employees?.length || 0;

    // تعداد فیش‌های صادر نشده (فاقد محاسبه در این دوره)
    const pendingPayslips = Math.max(0, totalEmp - currentMonthCalcs.length);

    // تعداد وام‌های فعال
    const activeLoans = (employeeLoans || []).filter(
      l => l && (Number(l.paidInstallmentsCount) || 0) < (Number(l.installmentsCount) || 12) && l.active !== false
    ).length;

    const latestMonthLabel = MONTHS.find(m => m.value === latestMonth)?.label || "فروردین";

    return {
      totalEmp,
      totalGross,
      totalNet,
      totalInsurance,
      totalTax,
      activeLoans,
      pendingPayslips,
      latestYear,
      latestMonth,
      latestMonthLabel,
      currentMonthCalcs
    };
  }, [employees, payrollCalculations, employeeLoans]);

  // ۲. آماده‌سازی داده‌های نمودار میله‌ای مقایسه‌ای ناخالص و خالص برای ۶ ماه گذشته
  const barChartData = useMemo(() => {
    const periods = {};
    (payrollCalculations || []).forEach(c => {
      if (!c || !c.year || !c.month) return;
      const key = `${c.year}/${c.month}`;
      if (!periods[key]) {
        periods[key] = { key, year: c.year, month: c.month, gross: 0, net: 0 };
      }
      periods[key].gross += Number(c.grossSalary || 0);
      periods[key].net += Number(c.netSalary || 0);
    });

    const sortedPeriods = Object.values(periods).sort((a, b) => {
      const aVal = Number(a.year) * 12 + Number(a.month);
      const bVal = Number(b.year) * 12 + Number(b.month);
      return aVal - bVal;
    }).slice(-6);

    const maxVal = Math.max(...sortedPeriods.map(p => Math.max(p.gross, p.net)), 10_000_000);

    return {
      list: sortedPeriods,
      maxVal
    };
  }, [payrollCalculations]);

  // ۳. داده‌های نمودار دوناتی توزیع مخارج در دوره محاسباتی اخیر
  const donutChartData = useMemo(() => {
    const { totalNet, totalInsurance, totalTax, totalGross } = stats;

    if (totalGross === 0) {
      return { slices: [], segments: [], hasData: false };
    }

    const otherDeductions = Math.max(0, totalGross - totalNet - totalInsurance - totalTax);

    const rawSegments = [
      { label: "حقوق خالص پرداختی", val: totalNet,        color: "#10b981", bg: "bg-emerald-500" },
      { label: "بیمه تامین اجتماعی", val: totalInsurance,  color: "#3b82f6", bg: "bg-blue-500" },
      { label: "مالیات حقوق",        val: totalTax,        color: "#f43f5e", bg: "bg-rose-500" },
      { label: "سایر کسورات (وام/مساعده)", val: otherDeductions, color: "#f59e0b", bg: "bg-amber-500" }
    ];

    const segments = rawSegments.map(seg => ({
      ...seg,
      percent: Math.round((seg.val / totalGross) * 100)
    })).filter(seg => seg.percent > 0);

    let accumulatedPercent = 0;
    const slices = segments.map(seg => {
      const strokeDasharray = `${(seg.percent * 314.159) / 100} 314.159`;
      const strokeDashoffset = `-${(accumulatedPercent * 314.159) / 100}`;
      accumulatedPercent += seg.percent;
      return {
        ...seg,
        strokeDasharray,
        strokeDashoffset
      };
    });

    return {
      slices,
      hasData: true
    };
  }, [stats]);

  // ۴. آخرین فیش‌های حقوقی صادر شده واقعی
  const recentCalcs = useMemo(() => {
    return [...(payrollCalculations || [])]
      .filter(c => c && c.employeeName && c.employeeCode)
      .sort((a, b) => (b._id || b.id || "").localeCompare(a._id || a.id || ""))
      .slice(0, 5);
  }, [payrollCalculations]);

  return (
    <div className="space-y-6 text-right pb-10" dir="rtl">
      {/* هدر بالایی */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600 animate-spin" />
            داشبورد مدیریت حقوق و دستمزد سازمان
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            گزارش تحلیلی زنده از پرداختی‌ها، کسورات بیمه و مالیات، وضعیت وام‌های فعال و پیش‌بینی هزینه‌ها بر اساس داده‌های واقعی دیتابیس
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/payroll/calculate/monthly")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
          <Calculator className="h-4 w-4" /> محاسبه حقوق ماه جاری
        </Button>
      </div>

      {/* کارت‌های خلاصه وضعیت */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "کل کارکنان سازمان", value: `${stats.totalEmp.toLocaleString("fa-IR")} نفر`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          { label: `خالص حقوق (${stats.latestMonthLabel})`, value: fmtToman(stats.totalNet), icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: `بیمه تامین اجتماعی`, value: fmtToman(stats.totalInsurance), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: `مالیات کسر شده`, value: fmtToman(stats.totalTax), icon: BarChart3, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40" },
          { label: "وام‌های فعال پرسنل", value: `${stats.activeLoans.toLocaleString("fa-IR")} مورد`, icon: Coins, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/40" },
          { label: "محاسبه نشده این ماه", value: `${stats.pendingPayslips.toLocaleString("fa-IR")} نفر`, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" }
        ].map((item, idx) => (
          <Card key={idx} className="border-0 shadow-sm overflow-hidden hover:scale-102 transition-transform duration-200">
            <CardContent className="p-4 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium block leading-tight">{item.label}</span>
                <span className={`text-sm font-black block ${item.color}`}>{item.value}</span>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* بخش نمودارهای گرافیکی */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* نمودار میله‌ای مقایسه‌ای ناخالص و خالص در طول ۶ ماه اخیر */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              نمودار مقایسه‌ای روند پرداخت ناخالص و خالص حقوق
            </CardTitle>
            <CardDescription className="text-[10px]">تغییرات هزینه کل حقوق پرداخت شده به پرسنل در بازه ۶ ماه اخیر (مبالغ به میلیون تومان)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col justify-end min-h-[220px]">
            {barChartData.list.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400">
                داده محاسباتی کافی برای نمایش روند ماهانه وجود ندارد.
              </div>
            ) : (
              <div className="space-y-4">
                {/* بدنه نمودار SVG */}
                <div className="relative w-full h-[180px] flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-2 px-4">
                  {barChartData.list.map((period, index) => {
                    const mName = MONTHS.find(m => m.value === period.month)?.label || "";
                    const grossHeight = `${(period.gross / barChartData.maxVal) * 140}px`;
                    const netHeight = `${(period.net / barChartData.maxVal) * 140}px`;
                    const yStr = String(period.year || "1405");

                    return (
                      <div key={period.key} className="flex flex-col items-center w-1/6 group relative">
                        {/* تولتیپ بالون در حالت هاور */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] p-2 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 w-28 text-center pointer-events-none">
                          <div>ناخالص: {fmtToman(period.gross)}</div>
                          <div className="border-t border-slate-700 mt-1 pt-1 text-emerald-400">خالص: {fmtToman(period.net)}</div>
                        </div>

                        {/* میله‌ها */}
                        <div className="flex gap-1.5 items-end h-[140px] justify-center">
                          {/* میله ناخالص */}
                          <div
                            style={{ height: grossHeight }}
                            className="w-3.5 bg-indigo-500 dark:bg-indigo-600 rounded-t-sm transition-all duration-500 hover:opacity-80"
                          />
                          {/* میله خالص */}
                          <div
                            style={{ height: netHeight }}
                            className="w-3.5 bg-emerald-500 dark:bg-emerald-600 rounded-t-sm transition-all duration-500 hover:opacity-80"
                          />
                        </div>

                        {/* برچسب ماه */}
                        <span className="text-[10px] text-slate-500 font-bold mt-2 block">{mName} {toPersianDigits(yStr.slice(-2))}</span>
                      </div>
                    );
                  })}
                </div>

                {/* راهنمای نمودار */}
                <div className="flex gap-4 justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-indigo-500 inline-block" />
                    <span>جمع ناخالص پرداختی</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500 inline-block" />
                    <span>جمع خالص دریافتی پرسنل</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نمودار دوناتی سهم مخارج سازمان در دوره محاسباتی اخیر */}
        <Card className="border-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              توزیع بار مالی هزینه‌ها
            </CardTitle>
            <CardDescription className="text-[10px]">درصد سهم خالص دریافتی پرسنل، مالیات، بیمه و جریمه‌ها از ناخالص کل</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col items-center justify-center">
            {!donutChartData.hasData ? (
              <div className="text-xs text-slate-400 text-center">
                داده محاسباتی برای ماه اخیر موجود نیست.
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-5">
                {/* دایره توخالی دوناتی SVG */}
                <div className="relative h-32 w-32">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    {(donutChartData.slices || []).map((slice, i) => (
                      <circle
                        key={i}
                        cx="60"
                        cy="60"
                        r="50"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="12"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-500 hover:stroke-[15px] cursor-pointer"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] text-slate-400 font-bold block leading-none">مجموع بار مالی</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 mt-1 block font-mono">
                      {fmtToman(stats.totalGross).split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold block leading-none">
                      {stats.totalGross >= 100_000_000 ? "م.ت" : "ریال"}
                    </span>
                  </div>
                </div>

                {/* لند یا راهنمای رنگ‌های دونات */}
                <div className="w-full grid grid-cols-2 gap-2 text-[9px] text-slate-600 dark:text-slate-400 leading-normal">
                  {(donutChartData.slices || []).map((slice, i) => (
                    <div key={i} className="flex items-center gap-1.5 font-bold">
                      <span className={`h-2.5 w-2.5 rounded-full ${slice.bg}`} />
                      <span className="truncate">{slice.label}: <strong className="text-slate-900 dark:text-white font-mono">{toPersianDigits(slice.percent)}٪</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* دسترسی سریع به بخش‌های حقوق */}
        <Card className="border-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-600" />
              عملیات سریع سیستم
            </CardTitle>
            <CardDescription className="text-[10px]">دسترسی فوری به پنل‌ها و بخش‌های مختلف حقوق و دستمزد</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.to)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 p-3.5 text-center transition-all duration-200 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color} transition-transform duration-200 group-hover:scale-110`}>
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[10px] font-bold leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* لیست آخرین محاسبات حقوق ثبت‌شده واقعی */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                آخرین فیش‌های حقوقی ثبت شده
              </CardTitle>
              <CardDescription className="text-[10px]">آخرین محاسبات حقوق پرسنل ذخیره شده در سیستم</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => navigate("/payroll/payslip")}>
              همه فیش‌ها <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {recentCalcs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                هیچ فیش حقوقی یا محاسبه حقوق ثبت‌شده‌ای یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[10px]">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-900/40">
                      <th className="px-4 py-2 font-bold text-slate-500">کد پرسنلی</th>
                      <th className="px-4 py-2 font-bold text-slate-500">نام و نام خانوادگی</th>
                      <th className="px-4 py-2 font-bold text-slate-500">حقوق ناخالص</th>
                      <th className="px-4 py-2 font-bold text-slate-500">خالص پرداختی</th>
                      <th className="px-4 py-2 font-bold text-slate-500 text-center">دوره محاسباتی</th>
                      <th className="px-4 py-2 font-bold text-slate-500 text-center">وضعیت فیش</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalcs.map((r, i) => {
                      const mName = MONTHS.find(m => m.value === r.month)?.label || "";
                      return (
                        <tr
                          key={i}
                          className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors cursor-pointer"
                          onClick={() => navigate("/payroll/payslip")}
                        >
                          <td className="px-4 py-2.5 font-mono font-bold">{r.employeeCode}</td>
                          <td className="px-4 py-2.5 font-bold">{r.employeeName}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-600">{Number(r.grossSalary).toLocaleString("fa-IR")} ریال</td>
                          <td className="px-4 py-2.5 font-mono font-extrabold text-emerald-600">{Number(r.netSalary).toLocaleString("fa-IR")} ریال</td>
                          <td className="px-4 py-2.5 text-center font-bold">{mName} {toPersianDigits(r.year)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 border-0">
                              تکمیل و صدور
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
