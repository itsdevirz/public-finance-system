import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  LayoutDashboard, BarChart2, ArrowLeftRight, TrendingUp,
  Search, Printer, FileDown, ChevronLeft, Loader2, RotateCcw,
  ClipboardList, Activity, Landmark, ArrowUpRight, ArrowDownLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { getDefaultDateRange, getCurrentPersianYear } from "@/lib/fiscalUtils";

const SIDEBAR_ITEMS = [
  { id: "dashboard",      label: "داشبورد مدیریتی",               icon: LayoutDashboard },
  { id: "analytical",     label: "گزارش‌های تحلیلی",              icon: BarChart2 },
  { id: "period-compare", label: "مقایسه دوره‌های مالی",           icon: ArrowLeftRight },
  { id: "cost-analysis",  label: "تحلیل درآمد، هزینه و اعتبارات", icon: TrendingUp },
];

const ROUTE_MAP = {
  "dashboard":      "/reports/management/dashboard",
  "analytical":     "/reports/management/analytical",
  "period-compare": "/reports/management/period-compare",
  "cost-analysis":  "/reports/management/cost-analysis",
};

function toPersianDigits(str) {
  if (str == null) return "";
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

function dateToNum(d) {
  if (!d) return 0;
  return parseInt(d.replace(/\D/g, ""), 10) || 0;
}

function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return toPersianDigits(Number(n).toLocaleString("fa-IR"));
}

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "dashboard";
}

export default function ManagementReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  // ── داده‌ها ──
  const [documents, setDocuments] = useState([]);
  const [checks, setChecks] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [trialRows, setTrialRows] = useState([]);
  const [prevTrialRows, setPrevTrialRows] = useState([]); // برای تب مقایسه دوره‌ها

  const [loading, setLoading] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [error, setError] = useState("");

  const defaultRange = getDefaultDateRange();
  const currentYear = getCurrentPersianYear();

  // ── فیلترها ──
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [fiscalYear, setFiscalYear] = useState(String(currentYear));
  const [compareYear, setCompareYear] = useState(String(currentYear - 1));

  const [fiscalYears, setFiscalYears] = useState([]);

  // بارگذاری لیست سال‌های مالی
  useEffect(() => {
    api.get("/api/fiscal-years").then((r) => {
      const list = (r.data?.data ?? []).map((y) => ({
        value: String(y.year),
        label: `${y.year} — ${y.title}`,
      }));
      setFiscalYears(list);
      // اگر سال‌های مالی در سرور ثبت شده‌اند، سال اول را به عنوان پیش‌فرض بگذار
      if (list.length > 0) {
        setFiscalYear(list[0].value);
        setCompareYear(list.length > 1 ? list[1].value : String(parseInt(list[0].value) - 1));
      }
    }).catch(() => {});
  }, []);

  // دریافت اطلاعات از سرور
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [docsRes, checksRes, agreementsRes, trialRes] = await Promise.all([
        api.get("/api/documents"),
        api.get("/api/checks"),
        api.get("/api/credits/agreements"),
        api.get(`/api/ledger/trial-balance?level=main&dateFrom=${dateFrom}&dateTo=${dateTo}&fiscalYear=${fiscalYear}`)
      ]);
      setDocuments(docsRes.data?.data ?? []);
      setChecks(checksRes.data?.data ?? []);
      setAgreements(agreementsRes.data?.data ?? []);
      setTrialRows(trialRes.data?.data ?? []);
    } catch (e) {
      console.error(e);
      setError("خطا در بارگذاری اطلاعات مدیریتی از سرور");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, fiscalYear]);

  // دریافت اطلاعات سال مقایسه به صورت جداگانه
  const loadComparisonData = useCallback(async () => {
    if (active !== "period-compare") return;
    setLoadingComp(true);
    try {
      const res = await api.get(`/api/ledger/trial-balance?level=main&fiscalYear=${compareYear}`);
      setPrevTrialRows(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComp(false);
    }
  }, [active, compareYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  useEffect(() => {
    setActive(getDefaultId(location.pathname));
  }, [location.pathname]);

  const handleSelect = (id) => {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  };

  const handleReset = () => {
    const r = getDefaultDateRange();
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
    const yr = getCurrentPersianYear();
    setFiscalYear(String(yr));
    setCompareYear(String(yr - 1));
    loadData();
  };

  // محاسبات داشبورد
  const dashboardStats = useMemo(() => {
    const totalDocs = documents.length;
    const totalReceipts = checks.filter(c => c.check_type === "receipt").reduce((sum, c) => sum + (c.amount ?? 0), 0);
    const totalPayments = checks.filter(c => c.check_type === "payment").reduce((sum, c) => sum + (c.amount ?? 0), 0);
    
    // مانده بانک و صندوق
    const cashBankBalance = trialRows
      .filter(r => r.code?.startsWith("11"))
      .reduce((sum, r) => sum + ((r.debit_bal ?? 0) - (r.credit_bal ?? 0)), 0);

    const recentDocs = [...documents]
      .sort((a, b) => b.document_number?.localeCompare(a.document_number))
      .slice(0, 5);

    const upcomingChecks = checks
      .filter(c => c.status === "pending")
      .slice(0, 5);

    return {
      totalDocs,
      totalReceipts,
      totalPayments,
      cashBankBalance,
      recentDocs,
      upcomingChecks
    };
  }, [documents, checks, trialRows]);

  // محاسبات تحلیل درآمد و هزینه‌ها (تب گزارش‌های تحلیلی)
  const analyticalData = useMemo(() => {
    const revenues = [];
    const expenses = [];

    trialRows.forEach((r) => {
      const code = r.code ?? "";
      const dBal = r.debit_bal ?? 0;
      const cBal = r.credit_bal ?? 0;

      if (code.startsWith("4")) {
        const net = cBal - dBal;
        if (net > 0) revenues.push({ code, name: r.name, balance: net });
      } else if (code.startsWith("5")) {
        const net = dBal - cBal;
        if (net > 0) expenses.push({ code, name: r.name, balance: net });
      }
    });

    const totalRevenues = revenues.reduce((s, x) => s + x.balance, 0) || 1;
    const totalExpenses = expenses.reduce((s, x) => s + x.balance, 0) || 1;

    const revenuesAnalyzed = revenues.map(r => ({
      ...r,
      percent: ((r.balance / totalRevenues) * 100).toFixed(1)
    })).sort((a, b) => b.balance - a.balance);

    const expensesAnalyzed = expenses.map(e => ({
      ...e,
      percent: ((e.balance / totalExpenses) * 100).toFixed(1)
    })).sort((a, b) => b.balance - a.balance);

    return {
      revenues: revenuesAnalyzed,
      expenses: expensesAnalyzed,
      totalRevenues,
      totalExpenses
    };
  }, [trialRows]);

  // محاسبات مقایسه دوره‌های مالی
  const comparisonData = useMemo(() => {
    const map = {};

    trialRows.forEach((r) => {
      const code = r.code ?? "";
      const net = (r.debit_bal ?? 0) - (r.credit_bal ?? 0);
      map[code] = { code, name: r.name, currVal: net, prevVal: 0 };
    });

    prevTrialRows.forEach((r) => {
      const code = r.code ?? "";
      const net = (r.debit_bal ?? 0) - (r.credit_bal ?? 0);
      if (map[code]) {
        map[code].prevVal = net;
      } else {
        map[code] = { code, name: r.name, currVal: 0, prevVal: net };
      }
    });

    return Object.values(map).map(item => {
      const diff = item.currVal - item.prevVal;
      const pct = item.prevVal !== 0 ? ((diff / Math.abs(item.prevVal)) * 100).toFixed(1) : "—";
      return { ...item, diff, percentChange: pct };
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [trialRows, prevTrialRows]);

  // محاسبات اعتبارات و عملکرد واقعی (تب تحلیل درآمد، هزینه و اعتبارات)
  // از داده‌های واقعی اسناد حسابداری و موافقتنامه‌ها استفاده می‌شود
  const creditAnalysisData = useMemo(() => {
    return agreements.map((agr) => {
      const approved = agr.amount ?? agr.total_amount ?? 0;
      // محاسبه عملکرد واقعی از اسناد حسابداری
      const matchPrefix = agr.chapter_code || agr.program_code || "";
      let actual = 0;
      if (matchPrefix) {
        documents.forEach((doc) => {
          if (doc.status === "CANCELLED") return;
          (doc.lines ?? []).forEach((line) => {
            const code = (line.account_code ?? "");
            if (code.startsWith(matchPrefix)) {
              actual += Math.max(0, (line.debit ?? 0) - (line.credit ?? 0));
            }
          });
        });
      }
      // اگر دیتای واقعی از اسناد نبود، از allocation به عنوان پروکسی استفاده کن
      if (actual === 0) {
        actual = agr.expense ?? agr.allocation ?? 0;
      }
      const remaining = Math.max(0, approved - actual);
      const percent = approved !== 0 ? ((actual / approved) * 100).toFixed(1) : "0.0";

      return {
        id: agr._id,
        title: agr.title || "موافقتنامه عمومی",
        number: agr.agreement_number,
        approved,
        actual,
        remaining,
        percent
      };
    });
  }, [agreements, documents]);
  const reportTitle = useMemo(() => {
    if (active === "dashboard") return `داشبورد شاخص‌های کلیدی مدیریت مالی`;
    if (active === "analytical") return `تحلیل ساختار درآمدها و هزینه‌ها`;
    if (active === "period-compare") return `مقایسه دوره‌های مالی سال ${compareYear} و ${fiscalYear}`;
    if (active === "cost-analysis") return `تحلیل اعتبارات مصوب و عملکرد واقعی دستگاه`;
    return "گزارش مدیریتی";
  }, [active, fiscalYear, compareYear]);

  const handlePrint = () => {
    printTable("#management-report-table", reportTitle);
  };

  const handleExcelExport = () => {
    let headers = [];
    let csvRows = [];

    if (active === "dashboard") {
      headers = ["شاخص کلیدی", "مقدار شاخص"];
      csvRows = [
        ["تعداد کل اسناد ثبت‌شده", dashboardStats.totalDocs],
        ["جمع کل دریافت‌های چک (ریال)", dashboardStats.totalReceipts],
        ["جمع کل پرداخت‌های چک (ریال)", dashboardStats.totalPayments],
        ["مانده نقدی بانک و صندوق (ریال)", dashboardStats.cashBankBalance]
      ];
    } else if (active === "analytical") {
      headers = ["کد حساب", "نام حساب سرفصل", "مبلغ (ریال)", "سهم درصد"];
      csvRows = [
        ["--- درآمدها ---"],
        ...analyticalData.revenues.map(r => [r.code, r.name, r.balance, `${r.percent}%`]),
        ["--- هزینه‌ها ---"],
        ...analyticalData.expenses.map(e => [e.code, e.name, e.balance, `${e.percent}%`])
      ];
    } else if (active === "period-compare") {
      headers = ["کد حساب", "نام حساب", `مانده سال ${compareYear}`, `مانده سال ${fiscalYear}`, "تغییر ریالی", "درصد تغییر"];
      csvRows = comparisonData.map(c => [
        c.code, c.name, c.prevVal, c.currVal, c.diff, `${c.percentChange}%`
      ]);
    } else if (active === "cost-analysis") {
      headers = ["عنوان موافقتنامه", "شماره موافقتنامه", "بودجه مصوب", "عملکرد واقعی", "باقی‌مانده", "درصد جذب"];
      csvRows = creditAnalysisData.map(c => [
        c.title, c.number, c.approved, c.actual, c.remaining, `${c.percent}%`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [
        headers.join(","),
        ...csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های مدیریتی"
        description="داشبورد آماری، گزارش‌های تحلیلی ساختار هزینه و مقایسه دوره‌های مالی"
      >
        {active !== "dashboard" && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 ml-1" /> چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExcelExport}><FileDown className="h-4 w-4 ml-1" /> اکسل</Button>
          </div>
        )}
      </PageHeader>

      <div className="flex gap-4">
        {/* سایدبار */}
        <aside className="w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">نوع گزارش</p>
              <nav className="space-y-0.5">
                {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active === id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-right">{label}</span>
                    {active === id && <ChevronLeft className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* محتوا */}
        <main className="flex-1 min-w-0 space-y-4">
          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-4 flex items-center gap-3" dir="rtl">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-5">
              {/* فیلترها */}
              <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 items-end rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-1.5 text-right">
                  <label className="text-xs text-muted-foreground font-medium">سال مالی</label>
                  <SearchableSelect value={fiscalYear} onChange={setFiscalYear} options={fiscalYears} placeholder="انتخاب سال..." searchable={false} />
                </div>
                <div className="flex flex-col gap-1.5 text-right">
                  <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                  <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1.5 text-right">
                  <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                  <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                </div>
                
                {active === "period-compare" ? (
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">سال مورد مقایسه</label>
                    <SearchableSelect value={compareYear} onChange={setCompareYear} options={fiscalYears.filter(y => y.value !== fiscalYear)} placeholder="۱۴۰۲" searchable={false} />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={loadData} size="sm" className="flex-1 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white">
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* لودینگ */}
              {(loading || (active === "period-compare" && loadingComp)) && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm">در حال بارگذاری شاخص‌های مدیریتی...</p>
                </div>
              )}

              {/* نمایش جداول و داشبورد */}
              {!(loading || (active === "period-compare" && loadingComp)) && (
                <div id="management-report-table" dir="rtl" className="space-y-5">
                  {/* ۱. داشبورد مدیریتی */}
                  {active === "dashboard" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-xl border p-4 bg-blue-50/50 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-700 shrink-0">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold">تعداد کل اسناد</p>
                            <p className="text-lg font-black text-blue-900 font-mono mt-0.5">{fmtNum(dashboardStats.totalDocs)}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border p-4 bg-emerald-50/50 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-700 shrink-0">
                            <ArrowDownLeft className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold">جمع کل دریافت‌ها</p>
                            <p className="text-lg font-black text-emerald-900 font-mono mt-0.5">{fmtNum(dashboardStats.totalReceipts)}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border p-4 bg-rose-50/50 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-rose-600/10 flex items-center justify-center text-rose-700 shrink-0">
                            <ArrowUpRight className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold">جمع کل پرداخت‌ها</p>
                            <p className="text-lg font-black text-rose-900 font-mono mt-0.5">{fmtNum(dashboardStats.totalPayments)}</p>
                          </div>
                        </div>

                        <div className="rounded-xl border p-4 bg-violet-50/50 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-700 shrink-0">
                            <Landmark className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-bold">مانده بانک و صندوق</p>
                            <p className="text-lg font-black text-violet-900 font-mono mt-0.5">{fmtNum(dashboardStats.cashBankBalance)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* اسناد مالی اخیر */}
                        <div className="border rounded-xl p-4 bg-background">
                          <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                            <ClipboardList className="h-4 w-4 text-blue-600" /> اسناد مالی اخیر سیستم
                          </h4>
                          <div className="overflow-x-auto text-[11px]">
                            <table className="w-full text-right">
                              <thead>
                                <tr className="border-b text-muted-foreground">
                                  <th className="pb-2 font-bold">شماره سند</th>
                                  <th className="pb-2 font-bold">تاریخ</th>
                                  <th className="pb-2 font-bold">وضعیت</th>
                                  <th className="pb-2 font-bold">شرح</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dashboardStats.recentDocs.map((doc, idx) => (
                                  <tr key={doc._id ?? idx} className="border-b last:border-0 hover:bg-muted/10">
                                    <td className="py-2.5 font-mono font-bold text-slate-800">{toPersianDigits(doc.document_number)}</td>
                                    <td className="py-2.5 font-mono">{toPersianDigits(doc.document_date)}</td>
                                    <td className="py-2.5 font-bold">{doc.status === "CONFIRMED" ? "قطعی" : "موقت"}</td>
                                    <td className="py-2.5 truncate max-w-[150px]" title={doc.description}>{doc.description || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* چک‌های سررسید نزدیک */}
                        <div className="border rounded-xl p-4 bg-background">
                          <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-emerald-600" /> چک‌های سررسید نزدیک (جریان‌دار)
                          </h4>
                          <div className="overflow-x-auto text-[11px]">
                            <table className="w-full text-right">
                              <thead>
                                <tr className="border-b text-muted-foreground">
                                  <th className="pb-2 font-bold">شماره چک</th>
                                  <th className="pb-2 font-bold">طرف حساب</th>
                                  <th className="pb-2 font-bold">مبلغ (ریال)</th>
                                  <th className="pb-2 font-bold">تاریخ سررسید</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dashboardStats.upcomingChecks.map((chk, idx) => (
                                  <tr key={chk._id ?? idx} className="border-b last:border-0 hover:bg-muted/10">
                                    <td className="py-2.5 font-mono font-bold text-slate-800">{toPersianDigits(chk.check_number)}</td>
                                    <td className="py-2.5 font-medium">{chk.payee || "—"}</td>
                                    <td className="py-2.5 font-mono text-emerald-700 font-bold">{fmtNum(chk.amount)}</td>
                                    <td className="py-2.5 font-mono">{toPersianDigits(chk.due_date) || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ۲. گزارش‌های تحلیلی */}
                  {active === "analytical" && (
                    <div className="space-y-4">
                      {/* تحلیل درآمدها */}
                      <div className="border rounded-xl p-4 bg-background">
                        <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">سهم سرفصل‌های درآمدی از کل درآمدها</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-right">
                            <thead>
                              <tr className="border-b bg-[#0e305d] text-white">
                                <th className="px-3 py-2">کد</th>
                                <th className="px-3 py-2">نام سرفصل</th>
                                <th className="px-3 py-2 text-center">مبلغ درآمد (ریال)</th>
                                <th className="px-3 py-2 w-48 text-center">سهم درصد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticalData.revenues.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/10">
                                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2.5 font-medium">{item.name}</td>
                                  <td className="px-3 py-2.5 text-center font-mono text-emerald-800 font-bold">{fmtNum(item.balance)}</td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="w-10 text-left font-mono font-bold">{toPersianDigits(item.percent)}٪</span>
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${item.percent}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* تحلیل هزینه‌ها */}
                      <div className="border rounded-xl p-4 bg-background">
                        <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1">سهم سرفصل‌های هزینه‌ای از کل هزینه‌ها</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-right">
                            <thead>
                              <tr className="border-b bg-[#0e305d] text-white">
                                <th className="px-3 py-2">کد</th>
                                <th className="px-3 py-2">نام سرفصل</th>
                                <th className="px-3 py-2 text-center">مبلغ هزینه (ریال)</th>
                                <th className="px-3 py-2 w-48 text-center">سهم درصد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analyticalData.expenses.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/10">
                                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2.5 font-medium">{item.name}</td>
                                  <td className="px-3 py-2.5 text-center font-mono text-rose-800 font-bold">{fmtNum(item.balance)}</td>
                                  <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="w-10 text-left font-mono font-bold">{toPersianDigits(item.percent)}٪</span>
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-600 rounded-full" style={{ width: `${item.percent}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ۳. مقایسه دوره‌های مالی */}
                  {active === "period-compare" && (
                    <div className="border rounded-xl overflow-hidden bg-background">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="bg-[#0e305d] text-white">
                            <th className="px-3 py-2.5 font-bold">کد حساب</th>
                            <th className="px-3 py-2.5 font-bold">نام حساب</th>
                            <th className="px-3 py-2.5 text-center font-bold">{`مانده سال ${compareYear} (ریال)`}</th>
                            <th className="px-3 py-2.5 text-center font-bold">{`مانده سال ${fiscalYear} (ریال)`}</th>
                            <th className="px-3 py-2.5 text-center font-bold">تغییر ریالی</th>
                            <th className="px-3 py-2.5 text-center font-bold">درصد تغییرات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-muted-foreground font-semibold">حسابی برای مقایسه یافت نشد.</td></tr>
                          ) : (
                            comparisonData.map((row, idx) => (
                              <tr key={idx} className="border-b hover:bg-muted/10">
                                <td className="px-3 py-2.5 font-mono text-muted-foreground">{toPersianDigits(row.code)}</td>
                                <td className="px-3 py-2.5 font-medium">{row.name}</td>
                                <td className="px-3 py-2.5 text-center font-mono">{fmtNum(row.prevVal)}</td>
                                <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">{fmtNum(row.currVal)}</td>
                                <td className={cn("px-3 py-2.5 text-center font-mono font-bold", row.diff >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                  {row.diff > 0 ? "+" : ""}{fmtNum(row.diff)}
                                </td>
                                <td className={cn("px-3 py-2.5 text-center font-mono font-bold", row.diff >= 0 ? "text-emerald-700" : "text-rose-700")}>
                                  {row.percentChange !== "—" ? `${row.diff > 0 ? "+" : ""}${toPersianDigits(row.percentChange)}٪` : "—"}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ۴. تحلیل درآمد، هزینه و اعتبارات */}
                  {active === "cost-analysis" && (
                    <div className="border rounded-xl overflow-hidden bg-background">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="bg-[#0e305d] text-white">
                            <th className="px-3 py-2.5 font-bold">عنوان موافقتنامه</th>
                            <th className="px-3 py-2.5 font-bold font-mono">شماره موافقتنامه</th>
                            <th className="px-3 py-2.5 text-center font-bold">اعتبار مصوب (ریال)</th>
                            <th className="px-3 py-2.5 text-center font-bold">عملکرد واقعی (ریال)</th>
                            <th className="px-3 py-2.5 text-center font-bold">باقی‌مانده (ریال)</th>
                            <th className="px-3 py-2.5 w-44 text-center font-bold">درصد جذب</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditAnalysisData.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-muted-foreground font-semibold">موافقتنامه‌ای جهت تحلیل اعتبارات یافت نشد.</td></tr>
                          ) : (
                            creditAnalysisData.map((row) => (
                              <tr key={row.id} className="border-b hover:bg-muted/10">
                                <td className="px-3 py-2.5 font-medium">{row.title}</td>
                                <td className="px-3 py-2.5 font-mono text-muted-foreground">{toPersianDigits(row.number)}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-slate-800 font-bold">{fmtNum(row.approved)}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-blue-700 font-bold">{fmtNum(row.actual)}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-amber-700 font-bold">{fmtNum(row.remaining)}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-10 text-left font-mono font-bold">{toPersianDigits(row.percent)}٪</span>
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${row.percent}%` }} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </PageShell>
  );
}
