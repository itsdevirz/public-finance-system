import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Scale, RefreshCw, Wallet, AlignLeft, XCircle,
  Search, Printer, FileDown, ChevronLeft,
  RotateCcw, BookOpen, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { cn } from "@/lib/utils";

function toPersianDigits(str) {
  if (str == null) return "";
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return toPersianDigits(Number(n).toLocaleString("fa-IR"));
}

function fmtBalance(val) {
  if (val === 0 || val == null) return { text: "—", cls: "text-muted-foreground" };
  const abs  = toPersianDigits(Math.abs(val).toLocaleString("fa-IR"));
  const side = val > 0 ? "بد" : "بس";
  const cls  = val > 0 ? "text-blue-700" : "text-rose-700";
  return { text: `${abs} ${side}`, cls };
}

function today() {
  return new Date().toLocaleDateString("fa-IR");
}

function exportCSV(rows, openBalance, totals, accountCode, accountName, title) {
  const headers = ["تاریخ", "شماره سند", "شرح", "بدهکار", "بستانکار", "مانده"];
  const openRow = ["—", "—", `مانده اول دوره ${accountName}`,
    openBalance.debit || "", openBalance.credit || "",
    `${Math.abs(openBalance.balance).toLocaleString()} ${openBalance.nature}`].join(",");
  const body = rows.map((r) => [
    r.date, r.doc_number, `"${r.description || ""}"`,
    r.debit || "", r.credit || "",
    `"${Math.abs(r.balance).toLocaleString()} ${r.nature}"`,
  ].join(","));
  const totalRow = ["", "", "جمع گردش دوره",
    totals.debit, totals.credit, ""].join(",");
  const csv = [headers.join(","), openRow, ...body, totalRow].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${title}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── badge ماهیت ─────────────────────────────────────────────────────────────
function NatureBadge({ nature }) {
  if (nature === "بدهکار") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
      <TrendingUp className="h-2.5 w-2.5" /> بدهکار
    </span>
  );
  if (nature === "بستانکار") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
      <TrendingDown className="h-2.5 w-2.5" /> بستانکار
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
      <Minus className="h-2.5 w-2.5" /> تراز
    </span>
  );
}

const SIDEBAR_ITEMS = [
  { id: "trial-balance",   label: "تراز آزمایشی",                icon: Scale },
  { id: "turnover",        label: "گردش حساب‌ها",                icon: RefreshCw },
  { id: "balance",         label: "مانده حساب‌ها",               icon: Wallet },
  { id: "detail-turnover", label: "ریز گردش حساب",               icon: AlignLeft },
  { id: "no-turnover",     label: "حساب‌های فاقد گردش",          icon: XCircle },
];

const ROUTE_MAP = {
  "trial-balance":   "/reports/accounts/trial-balance",
  "turnover":        "/reports/accounts/turnover",
  "balance":         "/reports/accounts/balance",
  "detail-turnover": "/reports/accounts/detail-turnover",
  "no-turnover":     "/reports/accounts/no-turnover",
};

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "trial-balance";
}

export default function AccountsReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  // ── فیلترهای ریز گردش حساب ──
  const [fiscalYear,   setFiscalYear]   = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState(() => today());
  const [accountCode,  setAccountCode]  = useState("");

  // ── فیلترهای عمومی بقیه تب‌ها ──
  const [accountCodeFrom, setAccountCodeFrom] = useState("");
  const [accountCodeTo, setAccountCodeTo] = useState("");
  const [balanceLevel, setBalanceLevel] = useState("moein");

  // ── داده‌ها ──
  const [fiscalYears,  setFiscalYears]  = useState([]);
  const [accountOpts,  setAccountOpts]  = useState([]);
  const [rows,         setRows]         = useState(null);
  const [openBalance,  setOpenBalance]  = useState(null);
  const [totals,       setTotals]       = useState({});
  const [resAccountName, setResAccountName] = useState("");
  const [queryMeta,    setQueryMeta]    = useState(null);

  // ── وضعیت ──
  const [loading,      setLoading]      = useState(false);
  const [fetchError,   setFetchError]   = useState("");
  const [errors,       setErrors]       = useState({});

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

  // بارگذاری کل حساب‌ها (بدون فیلتر ۳ رقم، همه حساب‌ها)
  useEffect(() => {
    api.get("/api/account-heads?flat=1").then((r) => {
      const all = r.data?.data ?? r.data ?? [];
      const opts = all
        .filter((a) => a.code)
        .map((a) => ({ value: a.code, label: `${a.code} — ${a.title}` }));
      setAccountOpts(opts);
    }).catch(() => {});
  }, []);

  // پاک کردن نتایج هنگام جابجایی تب
  useEffect(() => {
    setRows(null);
    setOpenBalance(null);
    setTotals({});
    setResAccountName("");
    setQueryMeta(null);
    setFetchError("");
    setErrors({});
  }, [active]);

  useEffect(() => {
    setActive(getDefaultId(location.pathname));
  }, [location.pathname]);

  function validate() {
    const e = {};
    if (active === "detail-turnover") {
      if (!accountCode) e.accountCode = "انتخاب حساب الزامی است";
      if (!dateFrom)    e.dateFrom    = "تاریخ ابتدا الزامی است";
      if (!dateTo)      e.dateTo      = "تاریخ انتها الزامی است";
    } else {
      if (!dateFrom)    e.dateFrom    = "تاریخ ابتدا الزامی است";
      if (!dateTo)      e.dateTo      = "تاریخ انتها الزامی است";
    }
    return e;
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setFetchError("");
    setLoading(true);
    setRows(null);

    try {
      if (active === "detail-turnover") {
        const params = new URLSearchParams({ accountCode, dateFrom, dateTo });
        if (fiscalYear) params.append("fiscalYear", fiscalYear);
        const res = await api.get(`/api/ledger/account-turnover?${params.toString()}`);
        setRows(res.data.data ?? []);
        setOpenBalance(res.data.openBalance ?? { debit: 0, credit: 0, balance: 0, nature: "تراز" });
        setTotals(res.data.totals ?? {});
        setResAccountName(res.data.accountName ?? "");
        setQueryMeta({ accountCode, dateFrom, dateTo, fiscalYear });
      } 
      else if (active === "trial-balance" || active === "turnover" || active === "balance" || active === "no-turnover") {
        const params = new URLSearchParams({ level: balanceLevel, dateFrom, dateTo });
        if (fiscalYear) params.append("fiscalYear", fiscalYear);
        const res = await api.get(`/api/ledger/trial-balance?${params.toString()}`);
        let data = res.data?.data ?? [];

        // اعمال فیلترهای محدوده‌ کدها
        if (accountCodeFrom) {
          data = data.filter(r => r.code >= accountCodeFrom);
        }
        if (accountCodeTo) {
          data = data.filter(r => r.code <= accountCodeTo);
        }

        if (active === "no-turnover") {
          const len = balanceLevel === "group" ? 1 : balanceLevel === "main" ? 3 : 5;
          const activeCodes = new Set(data.map(r => r.code));
          
          const noTurnoverData = accountOpts
            .filter(opt => opt.value && opt.value.length === len && !activeCodes.has(opt.value))
            .map(opt => ({
              code: opt.value,
              name: opt.label.split(" — ")[1] ?? opt.label
            }));
          
          setRows(noTurnoverData);
          setTotals({});
        } else {
          setRows(data);
          const sum = data.reduce((acc, r) => ({
            debit: acc.debit + (r.debit_turn ?? 0),
            credit: acc.credit + (r.credit_turn ?? 0),
            debit_bal: acc.debit_bal + (r.debit_bal ?? 0),
            credit_bal: acc.credit_bal + (r.credit_bal ?? 0),
          }), { debit: 0, credit: 0, debit_bal: 0, credit_bal: 0 });
          setTotals(sum);
        }
        setQueryMeta({ accountCodeFrom, accountCodeTo, dateFrom, dateTo, fiscalYear, balanceLevel });
      }
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در دریافت اطلاعات از سرور");
    } finally {
      setLoading(false);
    }
  }, [active, accountCode, dateFrom, dateTo, fiscalYear, balanceLevel, accountCodeFrom, accountCodeTo, accountOpts]);

  function handleReset() {
    setAccountCode(""); setDateFrom(""); setDateTo(today());
    setAccountCodeFrom(""); setAccountCodeTo(""); setBalanceLevel("moein");
    setFiscalYear(fiscalYears[0]?.value ?? "");
    setErrors({}); setFetchError(""); setRows(null);
    setOpenBalance(null); setTotals({}); setQueryMeta(null);
  }

  function handleSelect(id) {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  }

  const reportTitle = useMemo(() => {
    if (!queryMeta) return "گزارش حساب‌ها";
    const levelStr = queryMeta.balanceLevel === "moein" ? "حساب معین" : queryMeta.balanceLevel === "main" ? "حساب کل" : "گروه حساب";
    if (active === "detail-turnover") {
      return `ریز گردش حساب — حساب ${queryMeta.accountCode}${resAccountName ? ` (${resAccountName})` : ""} — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`;
    }
    if (active === "trial-balance") {
      return `تراز آزمایشی (${levelStr}) — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`;
    }
    if (active === "turnover") {
      return `گردش حساب‌ها (${levelStr}) — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`;
    }
    if (active === "balance") {
      return `مانده حساب‌ها (${levelStr}) — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`;
    }
    if (active === "no-turnover") {
      return `حساب‌های فاقد گردش (${levelStr}) — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`;
    }
    return "گزارش حساب‌ها";
  }, [queryMeta, active, resAccountName]);

  const handleExportExcel = () => {
    if (!rows || rows.length === 0) return;

    if (active === "detail-turnover") {
      exportCSV(rows, openBalance, totals, queryMeta?.accountCode, resAccountName, reportTitle);
      return;
    }

    let headers = [];
    let csvRows = [];

    if (active === "trial-balance") {
      headers = ["کد حساب", "نام حساب", "گردش بدهکار", "گردش بستانکار", "مانده بدهکار", "مانده بستانکار"];
      csvRows = rows.map(r => [
        r.code,
        r.name,
        r.debit_turn ?? 0,
        r.credit_turn ?? 0,
        r.debit_bal ?? 0,
        r.credit_bal ?? 0
      ]);
    } else if (active === "turnover") {
      headers = ["کد حساب", "نام حساب", "گردش بدهکار", "گردش بستانکار"];
      csvRows = rows.map(r => [
        r.code,
        r.name,
        r.debit_turn ?? 0,
        r.credit_turn ?? 0
      ]);
    } else if (active === "balance") {
      headers = ["کد حساب", "نام حساب", "مانده بدهکار", "مانده بستانکار", "مانده خالص", "تشخیص"];
      csvRows = rows.map(r => {
        const net = (r.debit_bal ?? 0) - (r.credit_bal ?? 0);
        const nature = net > 0 ? "بدهکار" : net < 0 ? "بستانکار" : "تراز";
        return [
          r.code,
          r.name,
          r.debit_bal ?? 0,
          r.credit_bal ?? 0,
          Math.abs(net),
          nature
        ];
      });
    } else if (active === "no-turnover") {
      headers = ["کد حساب", "نام حساب"];
      csvRows = rows.map(r => [r.code, r.name]);
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
        title="گزارش‌های حساب‌ها"
        description="تراز آزمایشی، گردش، مانده و ریز گردش حساب‌ها"
      >
        {rows !== null && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => printTable("#accounts-report-table", reportTitle)}>
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileDown className="h-4 w-4 ml-1" /> Excel
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex gap-4">
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

        <main className="flex-1 min-w-0">
          <Card>
            <CardContent className="pt-5">
              {/* ─── بخش فیلترهای فرم مشترک برای تراز، گردش، مانده و فاقد گردش ─── */}
              {active !== "detail-turnover" && (
                <div dir="rtl" className="space-y-4">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 items-end rounded-xl border bg-muted/20 p-4">
                      {/* سال مالی */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground">سال مالی</label>
                        <SearchableSelect value={fiscalYear} onChange={setFiscalYear}
                          options={fiscalYears} placeholder="انتخاب سال..." searchable={false} />
                      </div>

                      {/* از تاریخ */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground flex gap-1 justify-end">از تاریخ <span className="text-rose-500">*</span></label>
                        <PersianDatePicker value={dateFrom}
                          onChange={(e) => { setDateFrom(e.target.value); setErrors((p) => ({ ...p, dateFrom: "" })); }}
                          placeholder="۱۴۰۳/۰۱/۰۱" />
                        {errors.dateFrom && <p className="text-[11px] text-rose-600 text-right">⚠ {errors.dateFrom}</p>}
                      </div>

                      {/* تا تاریخ */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground flex gap-1 justify-end">تا تاریخ <span className="text-rose-500">*</span></label>
                        <PersianDatePicker value={dateTo}
                          onChange={(e) => { setDateTo(e.target.value); setErrors((p) => ({ ...p, dateTo: "" })); }}
                          placeholder="۱۴۰۳/۱۲/۲۹" />
                        {errors.dateTo && <p className="text-[11px] text-rose-600 text-right">⚠ {errors.dateTo}</p>}
                      </div>

                      {/* سطح حساب */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground">سطح حساب</label>
                        <select value={balanceLevel} onChange={(e) => setBalanceLevel(e.target.value)}
                          className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="group">گروه حساب (۱ رقم)</option>
                          <option value="main">حساب کل (۳ رقم)</option>
                          <option value="moein">حساب معین (۵ رقم)</option>
                        </select>
                      </div>

                      {/* کد حساب از */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground">کد حساب (از)</label>
                        <Input value={accountCodeFrom} onChange={(e) => setAccountCodeFrom(e.target.value)}
                          placeholder="مثلاً ۱۱۰۰۰" className="h-8 text-xs font-mono" dir="ltr" />
                      </div>

                      {/* کد حساب تا */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground">کد حساب (تا)</label>
                        <Input value={accountCodeTo} onChange={(e) => setAccountCodeTo(e.target.value)}
                          placeholder="مثلاً ۹۹۹۹۹" className="h-8 text-xs font-mono" dir="ltr" />
                      </div>

                      {/* دکمه‌ها */}
                      <div className="flex gap-2 items-end col-span-2 lg:col-span-full justify-end">
                        <Button type="submit" className="w-32 gap-1.5 h-8 text-xs font-medium bg-[#004b93] hover:bg-[#003d79] text-white" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          نمایش
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} disabled={loading} title="پاک کردن">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* ─── بخش فیلترهای فرم ریز گردش حساب ─── */}
              {active === "detail-turnover" && (
                <div dir="rtl" className="space-y-4">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 items-end rounded-xl border bg-muted/20 p-4">
                      {/* سال مالی */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground">سال مالی</label>
                        <SearchableSelect value={fiscalYear} onChange={setFiscalYear}
                          options={fiscalYears} placeholder="انتخاب سال..." searchable={false} />
                      </div>

                      {/* از تاریخ */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground flex gap-1 justify-end">از تاریخ <span className="text-rose-500">*</span></label>
                        <PersianDatePicker value={dateFrom}
                          onChange={(e) => { setDateFrom(e.target.value); setErrors((p) => ({ ...p, dateFrom: "" })); }}
                          placeholder="۱۴۰۳/۰۱/۰۱" />
                        {errors.dateFrom && <p className="text-[11px] text-rose-600 text-right">⚠ {errors.dateFrom}</p>}
                      </div>

                      {/* تا تاریخ */}
                      <div className="space-y-1.5 text-right">
                        <label className="text-xs font-semibold text-muted-foreground flex gap-1 justify-end">تا تاریخ <span className="text-rose-500">*</span></label>
                        <PersianDatePicker value={dateTo}
                          onChange={(e) => { setDateTo(e.target.value); setErrors((p) => ({ ...p, dateTo: "" })); }}
                          placeholder="۱۴۰۳/۱۲/۲۹" />
                        {errors.dateTo && <p className="text-[11px] text-rose-600 text-right">⚠ {errors.dateTo}</p>}
                      </div>

                      {/* حساب */}
                      <div className="space-y-1.5 text-right col-span-2 md:col-span-1 lg:col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground flex gap-1 justify-end">حساب <span className="text-rose-500">*</span></label>
                        <SearchableSelect value={accountCode}
                          onChange={(v) => { setAccountCode(v); setErrors((p) => ({ ...p, accountCode: "" })); }}
                          options={accountOpts} placeholder="جستجوی حساب..." />
                        {errors.accountCode && <p className="text-[11px] text-rose-600 text-right">⚠ {errors.accountCode}</p>}
                      </div>

                      {/* دکمه‌ها */}
                      <div className="flex gap-2 items-end">
                        <Button type="submit" className="flex-1 gap-1.5 h-8 text-xs font-medium bg-[#004b93] hover:bg-[#003d79] text-white" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          نمایش
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} disabled={loading} title="پاک کردن">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* ─── خطا ─── */}
              {fetchError && (
                <div dir="rtl" className="mb-4 border border-rose-200 bg-rose-50 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <p className="text-sm text-rose-700">{fetchError}</p>
                </div>
              )}

              {/* ─── لودینگ ─── */}
              {loading && (
                <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm">در حال بارگذاری اطلاعات گزارش...</p>
                </div>
              )}

              {/* ─── قبل از جستجو ─── */}
              {!loading && rows === null && !fetchError && (
                <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    {current && <current.icon className="h-8 w-8 text-primary" />}
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">{current?.label}</p>
                    <p className="text-sm mt-1">سال مالی و فیلترهای گزارش را تنظیم کرده و روی دکمه نمایش کلیک کنید</p>
                  </div>
                </div>
              )}

              {/* ─── جدول نتایج گزارش‌ها ─── */}
              {!loading && rows !== null && (
                <div className="border rounded-xl overflow-hidden mt-4" id="accounts-report-table">
                  {/* تراز آزمایشی */}
                  {active === "trial-balance" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-32 font-bold">کد حساب</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold">نام حساب</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">گردش بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">گردش بستانکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مانده بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مانده بستانکار (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-muted-foreground font-semibold">تراکنشی در این بازه یافت نشد.</td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => (
                            <tr key={row.code ?? idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-foreground/80">{toPersianDigits(row.code)}</td>
                              <td className="px-3 py-2.5 font-medium text-foreground">{row.name}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit_turn)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit_turn)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit_bal)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit_bal)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {rows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/30 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={3}>جمع کل</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit_bal)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit_bal)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* گردش حساب‌ها */}
                  {active === "turnover" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-32 font-bold">کد حساب</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold">نام حساب</th>
                          <th className="px-3 py-2.5 w-40 text-center font-bold">جمع گردش بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-40 text-center font-bold">جمع گردش بستانکار (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-muted-foreground font-semibold">گردشی در این بازه ثبت نشده است.</td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => (
                            <tr key={row.code ?? idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-foreground/80">{toPersianDigits(row.code)}</td>
                              <td className="px-3 py-2.5 font-medium text-foreground">{row.name}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit_turn)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit_turn)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {rows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/30 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={3}>جمع کل گردش</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* مانده حساب‌ها */}
                  {active === "balance" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 whitespace-nowrap font-bold text-center">ردیف</th>
                          <th className="px-3 py-2.5 w-32 whitespace-nowrap font-bold text-right">کد حساب</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold text-right">نام حساب</th>
                          <th className="px-3 py-2.5 w-36 whitespace-nowrap font-bold text-center">مانده بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 whitespace-nowrap font-bold text-center">مانده بستانکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 whitespace-nowrap font-bold text-center">مانده خالص (ریال)</th>
                          <th className="px-3 py-2.5 w-24 whitespace-nowrap font-bold text-center">تشخیص</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-muted-foreground font-semibold">اطلاعاتی یافت نشد.</td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => {
                            const net = (row.debit_bal ?? 0) - (row.credit_bal ?? 0);
                            const nature = net > 0 ? "بدهکار" : net < 0 ? "بستانکار" : "تراز";
                            return (
                              <tr key={row.code ?? idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                                <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                                <td className="px-3 py-2.5 font-mono font-bold text-foreground/80">{toPersianDigits(row.code)}</td>
                                <td className="px-3 py-2.5 font-medium text-foreground">{row.name}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit_bal)}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit_bal)}</td>
                                <td className="px-3 py-2.5 text-center font-mono font-bold text-foreground">{fmtNum(Math.abs(net))}</td>
                                <td className="px-3 py-2.5 text-center">
                                  <NatureBadge nature={nature} />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {rows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/30 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={3}>جمع کل</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit_bal)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit_bal)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-foreground">{fmtNum(Math.abs(totals.debit_bal - totals.credit_bal))}</td>
                            <td className="px-3 py-2.5 text-center">
                              <NatureBadge nature={totals.debit_bal - totals.credit_bal > 0 ? "بدهکار" : totals.debit_bal - totals.credit_bal < 0 ? "بستانکار" : "تراز"} />
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* ریز گردش حساب */}
                  {active === "detail-turnover" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 text-right font-bold w-24 whitespace-nowrap">تاریخ</th>
                          <th className="px-3 py-2.5 text-right font-bold w-28 whitespace-nowrap">شماره سند</th>
                          <th className="px-3 py-2.5 text-right font-bold min-w-[200px]">شرح</th>
                          <th className="px-3 py-2.5 text-center font-bold w-32 whitespace-nowrap">بدهکار</th>
                          <th className="px-3 py-2.5 text-center font-bold w-32 whitespace-nowrap">بستانکار</th>
                          <th className="px-3 py-2.5 text-center font-bold w-36 whitespace-nowrap">مانده</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* ردیف مانده اول دوره */}
                        {openBalance && (
                          <tr className="border-b bg-amber-50/60">
                            <td className="px-3 py-2 text-muted-foreground italic text-center" colSpan={2}>—</td>
                            <td className="px-3 py-2 font-semibold text-amber-800">مانده اول دوره</td>
                            <td className="px-3 py-2 text-center font-mono text-blue-700">{fmtNum(openBalance.debit)}</td>
                            <td className="px-3 py-2 text-center font-mono text-rose-700">{fmtNum(openBalance.credit)}</td>
                            <td className="px-3 py-2 text-center font-mono font-semibold">
                              {openBalance.balance !== 0 ? (
                                <span className={openBalance.balance > 0 ? "text-blue-700" : "text-rose-700"}>
                                  {Math.abs(openBalance.balance).toLocaleString("fa-IR")} {openBalance.nature === "بدهکار" ? "بد" : "بس"}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        )}

                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-muted-foreground">تراکنشی در این بازه یافت نشد.</td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => {
                            const bal = fmtBalance(row.balance);
                            return (
                              <tr key={idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                                <td className="px-3 py-2.5 font-mono text-foreground">{toPersianDigits(row.date)}</td>
                                <td className="px-3 py-2.5 font-mono text-foreground">{toPersianDigits(row.doc_number)}</td>
                                <td className="px-3 py-2.5 font-medium text-foreground max-w-[300px] truncate" title={row.description}>{row.description || "—"}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit)}</td>
                                <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit)}</td>
                                <td className="px-3 py-2.5 text-center font-mono font-semibold">
                                  <span className={bal.cls}>{bal.text}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>

                      {rows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold text-foreground">
                            <td className="px-3 py-2.5 text-center" colSpan={3}>جمع گردش دوره</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                            <td className="px-3 py-2.5 text-center">
                              {rows.length > 0 && (() => {
                                const last = rows[rows.length - 1];
                                const bal = fmtBalance(last.balance);
                                return <span className={cn("font-mono text-xs", bal.cls)}>{bal.text}</span>;
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* حساب‌های فاقد گردش */}
                  {active === "no-turnover" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-48 font-bold">کد حساب</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold">نام حساب</th>
                          <th className="px-3 py-2.5 w-48 text-center font-bold">وضعیت گردش در بازه</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-muted-foreground font-semibold">تمام حساب‌های این سطح دارای گردش در این بازه بوده‌اند.</td>
                          </tr>
                        ) : (
                          rows.map((row, idx) => (
                            <tr key={row.code ?? idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-foreground/80">{toPersianDigits(row.code)}</td>
                              <td className="px-3 py-2.5 font-medium text-foreground">{row.name}</td>
                              <td className="px-3 py-2.5 text-center">
                                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">فاقد هرگونه گردش</Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
