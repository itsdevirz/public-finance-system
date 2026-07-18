import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Scale, TrendingUp, Receipt, Droplets,
  Search, Printer, FileDown, ChevronLeft, Loader2, RotateCcw, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { getDefaultDateRange } from "@/lib/fiscalUtils";

const SIDEBAR_ITEMS = [
  { id: "balance-sheet",    label: "ترازنامه",                   icon: Scale },
  { id: "income-statement", label: "صورت عملکرد مالی",          icon: TrendingUp },
  { id: "revenue-expense",  label: "صورت درآمد و هزینه",        icon: Receipt },
  { id: "cash-flow",        label: "صورت جریان وجوه نقد",        icon: Droplets },
];

const ROUTE_MAP = {
  "balance-sheet":    "/reports/financial/balance-sheet",
  "income-statement": "/reports/financial/income-statement",
  "revenue-expense":  "/reports/financial/revenue-expense",
  "cash-flow":        "/reports/financial/cash-flow",
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

function today() {
  return toPersianDigits(new Date().toLocaleDateString("fa-IR"));
}

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "balance-sheet";
}

export default function FinancialReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  // ── داده‌ها ──
  const [fiscalYears, setFiscalYears] = useState([]);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── فیلترها ──
  const defaultRange = getDefaultDateRange();
  const [fiscalYear, setFiscalYear] = useState("");
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [queryMeta, setQueryMeta] = useState(null);

  // بارگذاری سال‌های مالی
  useEffect(() => {
    api.get("/api/fiscal-years").then((r) => {
      const list = (r.data?.data ?? []).map((y) => ({
        value: String(y.year),
        label: `${y.year} — ${y.title}`,
      }));
      setFiscalYears(list);
      if (list.length > 0) setFiscalYear(list[0].value);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setActive(getDefaultId(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    setError("");
  }, [active]);

  useEffect(() => {
    if (fiscalYear) {
      handleSearch();
    }
  }, [fiscalYear]);

  const handleSelect = (id) => {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  };

  const handleReset = () => {
    const r = getDefaultDateRange();
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
    if (fiscalYears.length > 0) setFiscalYear(fiscalYears[0].value);
    setRows(null);
    setQueryMeta(null);
    setError("");
  };

  // انجام جستجو و دریافت داده‌ها از تراز آزمایشی کل
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ level: "main", dateFrom, dateTo });
      if (fiscalYear) params.append("fiscalYear", fiscalYear);

      const res = await api.get(`/api/ledger/trial-balance?${params.toString()}`);
      setRows(res.data?.data ?? []);
      setQueryMeta({ dateFrom, dateTo, fiscalYear });
    } catch (err) {
      console.error(err);
      setError("خطا در دریافت اطلاعات مالی از سرور");
    } finally {
      setLoading(false);
    }
  }, [fiscalYear, dateFrom, dateTo]);

  // دسته‌بندی و محاسبات حساب‌ها بر اساس اطلاعات تراز
  const financialData = useMemo(() => {
    if (!rows) return null;

    const assets = [];
    const liabilities = [];
    const equity = [];
    const revenues = [];
    const expenses = [];

    rows.forEach((r) => {
      const code = r.code ?? "";
      const dBal = r.debit_bal ?? 0;
      const cBal = r.credit_bal ?? 0;

      if (code.startsWith("1")) {
        const net = dBal - cBal;
        if (net !== 0) assets.push({ code, name: r.name, balance: net });
      } else if (code.startsWith("2")) {
        const net = cBal - dBal;
        if (net !== 0) liabilities.push({ code, name: r.name, balance: net });
      } else if (code.startsWith("3")) {
        const net = cBal - dBal;
        if (net !== 0) equity.push({ code, name: r.name, balance: net });
      } else if (code.startsWith("4")) {
        const net = cBal - dBal;
        if (net !== 0) revenues.push({ code, name: r.name, balance: net });
      } else if (code.startsWith("5")) {
        const net = dBal - cBal;
        if (net !== 0) expenses.push({ code, name: r.name, balance: net });
      }
    });

    const totalAssets = assets.reduce((s, x) => s + x.balance, 0);
    const totalLiabilities = liabilities.reduce((s, x) => s + x.balance, 0);
    const totalEquity = equity.reduce((s, x) => s + x.balance, 0);
    const totalRevenues = revenues.reduce((s, x) => s + x.balance, 0);
    const totalExpenses = expenses.reduce((s, x) => s + x.balance, 0);

    return {
      assets,
      liabilities,
      equity,
      revenues,
      expenses,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenues,
      totalExpenses,
    };
  }, [rows]);

  const reportTitle = useMemo(() => {
    if (active === "balance-sheet") return `ترازنامه مالی — تا تاریخ ${dateTo}`;
    if (active === "income-statement") return `صورت عملکرد مالی — از ${dateFrom} تا ${dateTo}`;
    if (active === "revenue-expense") return `صورت درآمد و هزینه — از ${dateFrom} تا ${dateTo}`;
    if (active === "cash-flow") return `صورت جریان وجوه نقد — از ${dateFrom} تا ${dateTo}`;
    return "گزارش مالی";
  }, [active, dateFrom, dateTo]);

  const handlePrint = () => {
    printTable("#financial-report-table", reportTitle);
  };

  const handleExcelExport = () => {
    if (!financialData) return;

    let headers = [];
    let csvRows = [];

    if (active === "balance-sheet") {
      headers = ["کد حساب", "عنوان حساب", "دارایی (ریال)", "بدهی و ارزش خالص (ریال)"];
      financialData.assets.forEach(a => {
        csvRows.push([a.code, a.name, a.balance, ""]);
      });
      [...financialData.liabilities, ...financialData.equity].forEach(l => {
        csvRows.push([l.code, l.name, "", l.balance]);
      });
    } else if (active === "income-statement" || active === "revenue-expense") {
      headers = ["کد حساب", "عنوان حساب", "درآمدها (ریال)", "هزینه‌ها (ریال)"];
      financialData.revenues.forEach(r => {
        csvRows.push([r.code, r.name, r.balance, ""]);
      });
      financialData.expenses.forEach(e => {
        csvRows.push([e.code, e.name, "", e.balance]);
      });
    } else if (active === "cash-flow") {
      headers = ["عنوان جریان وجوه", "ورودی (ریال)", "خروجی (ریال)"];
      csvRows = [
        ["جریان نقد فعالیت‌های عملیاتی و درآمدی", financialData.totalRevenues, ""],
        ["جریان نقد پرداختی‌ها و هزینه‌ها", "", financialData.totalExpenses],
        ["خالص افزایش/کاهش در وجوه نقد", Math.max(0, financialData.totalRevenues - financialData.totalExpenses), Math.max(0, financialData.totalExpenses - financialData.totalRevenues)]
      ];
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
        title="گزارش‌های مالی"
        description="ترازنامه، صورت عملکرد مالی، صورت درآمد و هزینه، جریان وجوه نقد"
      >
        {rows && !loading && (
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
              {/* فرم فیلترهای گزارش */}
              <form onSubmit={handleSearch} className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4 items-end rounded-xl border bg-muted/20 p-4" dir="rtl">
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
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" disabled={loading}>
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    نمایش
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* لودینگ */}
              {loading && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm">در حال دریافت و تحلیل تراکنش‌ها...</p>
                </div>
              )}

              {/* قبل از جستجو */}
              {!loading && !rows && !error && (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    {current && <current.icon className="h-8 w-8 text-primary" />}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{current?.label}</p>
                    <p className="text-sm mt-1">سال مالی و بازه زمانی را مشخص کرده و روی دکمه نمایش کلیک کنید</p>
                  </div>
                </div>
              )}

              {/* جداول گزارشات */}
              {!loading && rows && financialData && (
                <div id="financial-report-table" dir="rtl" className="space-y-4">
                  {/* ترازنامه */}
                  {active === "balance-sheet" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* راست: دارایی‌ها */}
                      <div className="border rounded-xl overflow-hidden bg-background">
                        <table className="w-full text-xs text-right">
                          <thead>
                            <tr className="bg-[#0e305d] text-white">
                              <th className="px-3 py-2.5 font-bold">کد</th>
                              <th className="px-3 py-2.5 font-bold">عنوان دارایی</th>
                              <th className="px-3 py-2.5 text-center font-bold">مانده (ریال)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialData.assets.length === 0 ? (
                              <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">هیچ دارایی ثبت نشده است.</td></tr>
                            ) : (
                              financialData.assets.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/10">
                                  <td className="px-3 py-2 font-mono text-muted-foreground">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2 font-medium">{item.name}</td>
                                  <td className="px-3 py-2 text-center font-mono text-blue-700">{fmtNum(item.balance)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/40 font-bold border-t">
                              <td className="px-3 py-2.5" colSpan={2}>جمع کل دارایی‌ها</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-800">{fmtNum(financialData.totalAssets)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* چپ: بدهی‌ها و ارزش خالص */}
                      <div className="border rounded-xl overflow-hidden bg-background">
                        <table className="w-full text-xs text-right">
                          <thead>
                            <tr className="bg-[#0e305d] text-white">
                              <th className="px-3 py-2.5 font-bold">کد</th>
                              <th className="px-3 py-2.5 font-bold">عنوان بدهی و ارزش خالص</th>
                              <th className="px-3 py-2.5 text-center font-bold">مانده (ریال)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...financialData.liabilities, ...financialData.equity].length === 0 ? (
                              <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">بدهی یا سرمایه‌ای ثبت نشده است.</td></tr>
                            ) : (
                              [...financialData.liabilities, ...financialData.equity].map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/10">
                                  <td className="px-3 py-2 font-mono text-muted-foreground">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2 font-medium">{item.name}</td>
                                  <td className="px-3 py-2 text-center font-mono text-rose-700">{fmtNum(item.balance)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/40 font-bold border-t">
                              <td className="px-3 py-2.5" colSpan={2}>جمع کل بدهی‌ها و ارزش خالص</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-800">{fmtNum(financialData.totalLiabilities + financialData.totalEquity)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* صورت عملکرد مالی */}
                  {active === "income-statement" && (
                    <div className="space-y-4">
                      {/* درآمدها */}
                      <div className="border rounded-xl overflow-hidden bg-background">
                        <table className="w-full text-xs text-right">
                          <thead>
                            <tr className="bg-[#0e305d] text-white">
                              <th className="px-3 py-2.5 font-bold">کد</th>
                              <th className="px-3 py-2.5 font-bold">عنوان حساب درآمدی</th>
                              <th className="px-3 py-2.5 text-center font-bold">مبلغ درآمد (ریال)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialData.revenues.length === 0 ? (
                              <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">درآمدی در این بازه ثبت نشده است.</td></tr>
                            ) : (
                              financialData.revenues.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/10">
                                  <td className="px-3 py-2 font-mono text-muted-foreground">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2 font-medium">{item.name}</td>
                                  <td className="px-3 py-2 text-center font-mono text-emerald-700">{fmtNum(item.balance)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/40 font-bold border-t">
                              <td className="px-3 py-2.5" colSpan={2}>جمع کل درآمدها</td>
                              <td className="px-3 py-2.5 text-center font-mono text-emerald-800">{fmtNum(financialData.totalRevenues)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* هزینه‌ها */}
                      <div className="border rounded-xl overflow-hidden bg-background">
                        <table className="w-full text-xs text-right">
                          <thead>
                            <tr className="bg-[#0e305d] text-white">
                              <th className="px-3 py-2.5 font-bold">کد</th>
                              <th className="px-3 py-2.5 font-bold">عنوان حساب هزینه‌ای</th>
                              <th className="px-3 py-2.5 text-center font-bold">مبلغ هزینه (ریال)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialData.expenses.length === 0 ? (
                              <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">هزینه‌ای در این بازه ثبت نشده است.</td></tr>
                            ) : (
                              financialData.expenses.map((item, idx) => (
                                <tr key={idx} className="border-b hover:bg-muted/10">
                                  <td className="px-3 py-2 font-mono text-muted-foreground">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2 font-medium">{item.name}</td>
                                  <td className="px-3 py-2 text-center font-mono text-rose-700">{fmtNum(item.balance)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-muted/40 font-bold border-t">
                              <td className="px-3 py-2.5" colSpan={2}>جمع کل هزینه‌ها</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-800">{fmtNum(financialData.totalExpenses)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* خلاصه نهایی سود و زیان */}
                      <div className="rounded-xl border p-4 bg-muted/20 flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground">مازاد (کسری) خالص عملکرد مالی دوره:</span>
                        <span className={cn("font-mono font-bold text-sm",
                          financialData.totalRevenues - financialData.totalExpenses >= 0 ? "text-emerald-800" : "text-rose-800"
                        )}>
                          {fmtNum(Math.abs(financialData.totalRevenues - financialData.totalExpenses))} ریال
                          {" "}
                          ({financialData.totalRevenues - financialData.totalExpenses >= 0 ? "مازاد / سود" : "کسری / زیان"})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* صورت درآمد و هزینه */}
                  {active === "revenue-expense" && (
                    <div className="border rounded-xl overflow-hidden bg-background">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="bg-[#0e305d] text-white border-b">
                            <th className="px-3 py-2.5 font-bold w-12 text-center">ردیف</th>
                            <th className="px-3 py-2.5 font-bold w-32">کد حساب</th>
                            <th className="px-3 py-2.5 font-bold">عنوان حساب عمومی</th>
                            <th className="px-3 py-2.5 font-bold w-32 text-center">نوع</th>
                            <th className="px-3 py-2.5 font-bold w-40 text-center">مبلغ (ریال)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...financialData.revenues, ...financialData.expenses].length === 0 ? (
                            <tr><td colSpan={5} className="py-16 text-center text-muted-foreground">درآمد و هزینه‌ای در این بازه وجود ندارد.</td></tr>
                          ) : (
                            [...financialData.revenues.map(r => ({ ...r, type: "درآمد" })), ...financialData.expenses.map(e => ({ ...e, type: "هزینه" }))]
                              .map((item, idx) => (
                                <tr key={idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                                  <td className="px-3 py-2 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                                  <td className="px-3 py-2 font-mono font-bold text-foreground/80">{toPersianDigits(item.code)}</td>
                                  <td className="px-3 py-2 font-medium">{item.name}</td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge variant="outline" className={cn(item.type === "درآمد" ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-rose-700 border-rose-200 bg-rose-50")}>
                                      {item.type}
                                    </Badge>
                                  </td>
                                  <td className={cn("px-3 py-2 text-center font-mono font-bold", item.type === "درآمد" ? "text-emerald-700" : "text-rose-700")}>{fmtNum(item.balance)}</td>
                                </tr>
                              ))
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted/40 font-bold border-t">
                            <td className="px-3 py-2.5 text-center" colSpan={4}>خالص مازاد (کسری) درآمدها بر هزینه‌ها</td>
                            <td className={cn("px-3 py-2.5 text-center font-mono text-sm",
                              financialData.totalRevenues - financialData.totalExpenses >= 0 ? "text-emerald-800" : "text-rose-800"
                            )}>{fmtNum(Math.abs(financialData.totalRevenues - financialData.totalExpenses))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* صورت جریان وجوه نقد */}
                  {active === "cash-flow" && (
                    <div className="border rounded-xl overflow-hidden bg-background">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="bg-[#0e305d] text-white border-b">
                            <th className="px-3 py-2.5 font-bold">شرح جریان نقدینگی (فعالیت‌ها)</th>
                            <th className="px-3 py-2.5 text-center font-bold w-48">ورود وجه نقد (دریافت)</th>
                            <th className="px-3 py-2.5 text-center font-bold w-48">خروج وجه نقد (پرداخت)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-muted/10">
                            <td className="px-3 py-3 font-medium">جریان خالص ناشی از فعالیت‌های عملیاتی و درآمدهای عمومی</td>
                            <td className="px-3 py-3 text-center font-mono text-emerald-700">{fmtNum(financialData.totalRevenues)}</td>
                            <td className="px-3 py-3 text-center font-mono text-muted-foreground">—</td>
                          </tr>
                          <tr className="border-b hover:bg-muted/10">
                            <td className="px-3 py-3 font-medium">جریان نقد خروجی بابت هزینه‌های پرسنلی، خدماتی و اعتبارات مصرفی</td>
                            <td className="px-3 py-3 text-center font-mono text-muted-foreground">—</td>
                            <td className="px-3 py-3 text-center font-mono text-rose-700">{fmtNum(financialData.totalExpenses)}</td>
                          </tr>
                          <tr className="border-b hover:bg-muted/10 bg-amber-50/40">
                            <td className="px-3 py-3 font-bold text-amber-900">خالص جریان وجوه نقد در دوره مالی</td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-emerald-800">
                              {financialData.totalRevenues >= financialData.totalExpenses ? fmtNum(financialData.totalRevenues - financialData.totalExpenses) : "—"}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-bold text-rose-800">
                              {financialData.totalExpenses > financialData.totalRevenues ? fmtNum(financialData.totalExpenses - financialData.totalRevenues) : "—"}
                            </td>
                          </tr>
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
