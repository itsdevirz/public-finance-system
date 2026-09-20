import { useState, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Table2,
  Search,
  Printer,
  FileDown,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronsUpDown,
  FileSignature
} from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { validateEgressPermission } from "@/lib/egressValidator";

// ─── تعریف صفحه بر اساس مسیر ────────────────────────────────────────────────
const PAGE_CONFIG = {
  "/bookkeeping/operations-balance/4-column": {
    title: "تراز ۴ ستونی",
    description: "گزارش تراز حساب‌ها در قالب ۴ ستون",
    columns: 4,
    colDefs: [
      { key: "debit_turn",   label: "گردش بدهکار",   cls: "text-blue-700"  },
      { key: "credit_turn",  label: "گردش بستانکار",  cls: "text-rose-700"  },
      { key: "debit_bal",    label: "مانده بدهکار",   cls: "text-blue-700"  },
      { key: "credit_bal",   label: "مانده بستانکار", cls: "text-rose-700"  },
    ],
  },
  "/bookkeeping/operations-balance/6-column": {
    title: "تراز ۶ ستونی",
    description: "گزارش تراز حساب‌ها در قالب ۶ ستون",
    columns: 6,
    colDefs: [
      { key: "debit_begin",  label: "افتتاحیه بدهکار",  cls: "text-blue-700"  },
      { key: "credit_begin", label: "افتتاحیه بستانکار", cls: "text-rose-700"  },
      { key: "debit_turn",   label: "گردش بدهکار",      cls: "text-blue-700"  },
      { key: "credit_turn",  label: "گردش بستانکار",    cls: "text-rose-700"  },
      { key: "debit_bal",    label: "مانده بدهکار",     cls: "text-blue-700"  },
      { key: "credit_bal",   label: "مانده بستانکار",   cls: "text-rose-700"  },
    ],
  },
  "/bookkeeping/operations-balance/8-column": {
    title: "تراز ۸ ستونی",
    description: "گزارش تراز حساب‌ها در قالب ۸ ستون",
    columns: 8,
    colDefs: [
      { key: "debit_begin",  label: "مانده اول دوره بدهکار",   cls: "text-blue-700"  },
      { key: "credit_begin", label: "مانده اول دوره بستانکار",  cls: "text-rose-700"  },
      { key: "debit_turn",   label: "گردش بدهکار",             cls: "text-blue-700"  },
      { key: "credit_turn",  label: "گردش بستانکار",           cls: "text-rose-700"  },
      { key: "debit_net",    label: "تجمعی بدهکار",            cls: "text-blue-700"  },
      { key: "credit_net",   label: "تجمعی بستانکار",          cls: "text-rose-700"  },
      { key: "debit_bal",    label: "مانده نهایی بدهکار",      cls: "text-blue-700"  },
      { key: "credit_bal",   label: "مانده نهایی بستانکار",    cls: "text-rose-700"  },
    ],
  },
  "/bookkeeping/operations-balance/10-column": {
    title: "تراز ۱۰ ستونی",
    description: "گزارش تراز حساب‌ها در قالب ۱۰ ستون (جهت ارائه به دیوان محاسبات، حسابرسان و مجامع)",
    columns: 10,
    colDefs: [
      { key: "debit_begin",  label: "افتتاحیه بدهکار",   cls: "text-blue-700"  },
      { key: "credit_begin", label: "افتتاحیه بستانکار",  cls: "text-rose-700"  },
      { key: "debit_before", label: "قبل از دوره بدهکار",cls: "text-blue-700"  },
      { key: "credit_before",label: "قبل از دوره بستانکار",cls: "text-rose-700"  },
      { key: "debit_turn",   label: "گردش طی دوره بدهکار",cls: "text-blue-700"  },
      { key: "credit_turn",  label: "گردش طی دوره بستانکار",cls: "text-rose-700" },
      { key: "debit_net",    label: "تجمعی بدهکار",      cls: "text-blue-700"  },
      { key: "credit_net",   label: "تجمعی بستانکار",    cls: "text-rose-700"  },
      { key: "debit_bal",    label: "مانده نهایی بدهکار",cls: "text-blue-700"  },
      { key: "credit_bal",   label: "مانده نهایی بستانکار",cls: "text-rose-700" },
    ],
  },
};

const LEVEL_OPTIONS = [
  { value: "group",   label: "گروه حساب (۱ رقم)"  },
  { value: "main",    label: "حساب کل (۳ رقم)"     },
  { value: "moein",   label: "حساب معین (۵ رقم)"   },
  { value: "detail",  label: "حساب تفصیلی"          },
];

// ─── فرمت اعداد به فارسی ─────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return n.toLocaleString("fa-IR");
}

// ─── استخراج امضاهای گزارش از تنظیمات سیستم و امضاهای ذخیره‌شده ─────────────────
function getReportSignatures() {
  let settings = {};
  let userSigs = [];
  try {
    settings = JSON.parse(localStorage.getItem("system_settings") || "{}");
  } catch (_) {}
  try {
    userSigs = JSON.parse(localStorage.getItem("user_report_signatures") || "[]");
  } catch (_) {}

  const sig1User = userSigs.find((s) => String(s.slot) === "1");
  const title1 = settings.signatureTitle1 || sig1User?.userRole || "تنظیم‌کننده / حسابدار";
  const name1 = settings.signatureName1 || sig1User?.userName || "";
  const img1 = sig1User?.signatureImage || null;

  const sig2User = userSigs.find((s) => String(s.slot) === "2");
  const title2 = settings.signatureTitle2 || sig2User?.userRole || "رئیس امور مالی و حسابداری";
  const name2 = settings.signatureName2 || sig2User?.userName || "";
  const img2 = sig2User?.signatureImage || null;

  const sig3User = userSigs.find((s) => String(s.slot) === "3");
  const title3 = settings.signatureTitle3 || sig3User?.userRole || "ذیحساب و مدیرکل امور مالی";
  const name3 = settings.signatureName3 || sig3User?.userName || "";
  const img3 = sig3User?.signatureImage || null;

  return [
    { slot: 1, title: title1, name: name1, image: img1 },
    { slot: 2, title: title2, name: name2, image: img2 },
    { slot: 3, title: title3, name: name3, image: img3 },
  ];
}

// ─── خروجی Excel ─────────────────────────────────────────────────────────────
async function exportToCSV(rows, totals, colDefs, title) {
  const check = await validateEgressPermission({ exportType: "CSV", recordCount: rows.length || 1 });
  if (!check.allowed) {
    alert(`ممانعت از خروجی داده (الزام بند ۹ افتا):\n${check.reason}`);
    return;
  }
  const headers = ["کد حساب", "عنوان حساب", ...colDefs.map((c) => c.label)];
  const toRow = (r) =>
    [r.code, r.name, ...colDefs.map((c) => r[c.key] ?? 0)].join(",");
  const totalRow = ["", "جمع کل", ...colDefs.map((c) => totals[c.key] ?? 0)].join(",");
  const csv = [headers.join(","), ...rows.map(toRow), totalRow].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BalanceSheet() {
  const { pathname } = useLocation();
  const config = PAGE_CONFIG[pathname] ?? PAGE_CONFIG["/bookkeeping/operations-balance/4-column"];

  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  const [level,     setLevel]     = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState(today);
  const [errors,    setErrors]    = useState({});

  // وضعیت درخواست
  const [loading,   setLoading]   = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [rows,      setRows]      = useState(null);  // null = هنوز جستجو نشده
  const [totals,    setTotals]    = useState({});
  const [queryMeta, setQueryMeta] = useState(null);  // { level, dateFrom, dateTo }

  // مدیریت سطر‌های بازشده (زیرمنوی کشویی معین‌ها)
  const [expandedRows, setExpandedRows] = useState({});

  const signatures = useMemo(() => getReportSignatures(), []);

  function toggleRow(code) {
    setExpandedRows((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  }

  function expandAll() {
    if (!rows) return;
    const all = {};
    rows.forEach((r) => {
      if (r.children && r.children.length > 0) {
        all[r.code] = true;
      }
    });
    setExpandedRows(all);
  }

  function collapseAll() {
    setExpandedRows({});
  }

  function validate() {
    const e = {};
    if (!level)                             e.level    = "انتخاب نوع سطح الزامی است";
    if (!dateFrom || !dateFrom.trim())      e.dateFrom = "تاریخ ابتدا الزامی است";
    if (!dateTo   || !dateTo.trim())        e.dateTo   = "تاریخ انتها الزامی است";
    return e;
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setFetchError("");
    setLoading(true);
    setRows(null);
    setExpandedRows({});

    try {
      const params = new URLSearchParams({ level, dateFrom, dateTo });
      const res = await api.get(`/api/ledger/trial-balance?${params.toString()}`);
      setRows(res.data.data ?? []);
      setTotals(res.data.totals ?? {});
      setQueryMeta({ level, dateFrom, dateTo });
    } catch (err) {
      setFetchError(
        err?.response?.data?.message ?? "خطا در دریافت اطلاعات از سرور"
      );
    } finally {
      setLoading(false);
    }
  }, [level, dateFrom, dateTo]);

  function handleReset() {
    setLevel("");
    setDateFrom("");
    setDateTo(today);
    setErrors({});
    setFetchError("");
    setRows(null);
    setTotals({});
    setQueryMeta(null);
    setExpandedRows({});
    setLoading(false);
  }

  const levelLabel = LEVEL_OPTIONS.find((o) => o.value === queryMeta?.level || o.value === level)?.label ?? "";

  return (
    <PageShell>
      <PageHeader title={config.title} description={config.description} />

      {/* ─── فرم فیلترها ─── */}
      <Card className="mb-5">
        <CardContent className="p-5" dir="rtl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-end">

              {/* نوع سطح */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  نوع سطح
                  <span className="text-rose-500">*</span>
                </Label>
                <SearchableSelect
                  value={level}
                  onChange={(v) => { setLevel(v); setErrors((p) => ({ ...p, level: "" })); }}
                  options={LEVEL_OPTIONS}
                  placeholder="انتخاب سطح حساب..."
                  searchable={false}
                />
                {errors.level && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <span>⚠</span> {errors.level}
                  </p>
                )}
              </div>

              {/* تاریخ ابتدا */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  تاریخ ابتدا
                  <span className="text-rose-500">*</span>
                </Label>
                <PersianDatePicker
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setErrors((p) => ({ ...p, dateFrom: "" }));
                  }}
                  placeholder="۱۴۰۴/۰۱/۰۱"
                />
                {errors.dateFrom && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <span>⚠</span> {errors.dateFrom}
                  </p>
                )}
              </div>

              {/* تاریخ انتها */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  تاریخ انتها
                  <span className="text-rose-500">*</span>
                </Label>
                <PersianDatePicker
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setErrors((p) => ({ ...p, dateTo: "" }));
                  }}
                  placeholder="۱۴۰۴/۱۲/۲۹"
                />
                {errors.dateTo && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <span>⚠</span> {errors.dateTo}
                  </p>
                )}
              </div>

              {/* دکمه‌ها */}
              <div className="flex gap-2 pt-1 sm:pt-6">
                <Button type="submit" className="gap-1.5 flex-1" disabled={loading}>
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Search className="h-4 w-4" />
                  }
                  نمایش تراز
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} className="gap-1.5" disabled={loading}>
                  پاک کردن
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── خطای درخواست ─── */}
      {fetchError && (
        <Card className="mb-5 border-rose-200 bg-rose-50 dark:bg-rose-950/30">
          <CardContent className="p-4 flex items-center gap-3" dir="rtl">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-sm text-rose-700">{fetchError}</p>
          </CardContent>
        </Card>
      )}

      {/* ─── لودینگ ─── */}
      {loading && (
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">در حال محاسبه تراز...</p>
          </CardContent>
        </Card>
      )}

      {/* ─── جدول نتیجه ─── */}
      {!loading && rows !== null && (
        <Card>
          <CardContent className="p-0">
            {/* هدر اکشن‌های جدول */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2"
              dir="rtl"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Table2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{config.title}</span>
                {queryMeta && (
                  <>
                    <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                      {levelLabel}
                    </span>
                    <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                      {queryMeta.dateFrom} — {queryMeta.dateTo}
                    </span>
                    <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                      {rows.length} سطر اصلی
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={expandAll}
                  title="نمایش جزئیات تمامی حساب‌های معین"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5 text-primary" /> باز کردن همه معین‌ها
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={collapseAll}
                >
                  بستن همه
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-xs"
                  onClick={() =>
                    printTable(
                      "#balance-print-area",
                      `${config.title} — ${queryMeta?.dateFrom ?? ""} تا ${queryMeta?.dateTo ?? ""}`,
                      "landscape"
                    )
                  }
                >
                  <Printer className="h-3.5 w-3.5 text-indigo-600" /> چاپ رسمی A4
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-xs"
                  onClick={() => exportToCSV(rows, totals, config.colDefs, config.title)}
                >
                  <FileDown className="h-3.5 w-3.5 text-emerald-600" /> خروجی اکسل
                </Button>
              </div>
            </div>

            {/* ─── ناحیه قابل چاپ شامل سربرگ رسمی، جدول و اسامی امضا کنندگان ─── */}
            <div className="overflow-x-auto p-4" id="balance-print-area">
              
              {/* سربرگ رسمی مخصوص چاپ */}
              <div className="hidden print:block mb-6 border-b pb-4 text-center" dir="rtl">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-right text-xs text-slate-600">
                    <p className="font-bold text-slate-900">جمهوری اسلامی ایران</p>
                    <p>نظام حسابداری بخش عمومی (سناما)</p>
                  </div>
                  <div className="text-center">
                    <h2 className="text-base font-bold text-slate-900">{config.title}</h2>
                    <p className="text-xs text-slate-600 mt-1">{config.description}</p>
                  </div>
                  <div className="text-left text-xs text-slate-600">
                    <p>تاریخ چاپ: {today}</p>
                    <p>سطح گزارش: {levelLabel}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-700 bg-slate-100 p-1.5 rounded flex justify-center gap-6">
                  <span>از تاریخ: <strong>{queryMeta?.dateFrom || "—"}</strong></span>
                  <span>تا تاریخ: <strong>{queryMeta?.dateTo || "—"}</strong></span>
                </div>
              </div>

              <table className="w-full text-xs border-collapse" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/50 print:bg-slate-200">
                    <th className="px-3 py-2.5 text-right font-bold text-foreground w-28 whitespace-nowrap border-b print:border-slate-400">
                      کد حساب
                    </th>
                    <th className="px-3 py-2.5 text-right font-bold text-foreground min-w-[180px] border-b print:border-slate-400">
                      عنوان حساب
                    </th>
                    {config.colDefs.map((col) => (
                      <th
                        key={col.key}
                        className={`px-3 py-2.5 text-left font-bold whitespace-nowrap ${col.cls} w-32 border-b print:border-slate-400`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2 + config.colDefs.length}
                        className="py-16 text-center text-muted-foreground text-sm"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Table2 className="h-8 w-8 text-muted-foreground/30" />
                          <p>اطلاعاتی برای نمایش وجود ندارد</p>
                          <p className="text-xs text-muted-foreground/60">
                            در بازه انتخابی هیچ سندی ثبت نشده است
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => {
                      const hasChildren = row.children && row.children.length > 0;
                      const isExpanded = !!expandedRows[row.code];

                      return (
                        <tr key={row.code} className="contents">
                          {/* سطر اصلی حساب */}
                          <tr
                            className={`border-b transition-colors cursor-pointer select-none ${
                              isExpanded
                                ? "bg-primary/5 dark:bg-primary/10 font-semibold"
                                : idx % 2 === 0
                                ? "bg-background hover:bg-muted/30"
                                : "bg-muted/10 hover:bg-muted/30"
                            }`}
                            onClick={() => hasChildren && toggleRow(row.code)}
                          >
                            <td className="px-3 py-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {hasChildren ? (
                                  isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0 transition-transform" />
                                  ) : (
                                    <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform" />
                                  )
                                ) : (
                                  <span className="w-3.5 inline-block" />
                                )}
                                <span>{row.code}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-foreground max-w-[280px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">{row.name || <span className="text-muted-foreground/50 italic">—</span>}</span>
                                {hasChildren && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 print:hidden">
                                    {row.children.length} کد زیرمجموعه
                                  </span>
                                )}
                              </div>
                            </td>
                            {config.colDefs.map((col) => (
                              <td
                                key={col.key}
                                className={`px-3 py-2.5 text-left font-mono tabular-nums whitespace-nowrap ${col.cls} font-medium`}
                              >
                                {fmtNum(row[col.key])}
                              </td>
                            ))}
                          </tr>

                          {/* زیرمنوی کشویی: نمایش جزئیات حساب‌های معین / تفصیلی */}
                          {hasChildren && isExpanded && (
                            <tr className="bg-slate-50/90 dark:bg-slate-900/60 border-b border-primary/20">
                              <td colSpan={2 + config.colDefs.length} className="p-0">
                                <div className="mr-6 my-2 ml-2 p-3 bg-white dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
                                  <div className="flex items-center justify-between mb-2 text-xs font-bold text-primary border-b pb-1.5">
                                    <span className="flex items-center gap-1">
                                      <FileSignature className="h-3.5 w-3.5" />
                                      {queryMeta?.level === "group" && `جزئیات کدهای معین و حساب‌های کل زیرمجموعه (${row.code} - ${row.name})`}
                                      {queryMeta?.level === "main" && `جزئیات کدهای معین زیرمجموعه (${row.code} - ${row.name})`}
                                      {queryMeta?.level === "moein" && `جزئیات کدهای تفصیلی و شرح ثبت‌ها (${row.code} - ${row.name})`}
                                      {queryMeta?.level === "detail" && `جزئیات تراکنش‌ها و اسناد زیرمجموعه (${row.code} - ${row.name})`}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground font-normal">
                                      تعداد: {row.children.length} ردیف
                                    </span>
                                  </div>

                                  <table className="w-full text-[11px] border-collapse" dir="rtl">
                                    <thead>
                                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b">
                                        <th className="px-2.5 py-1.5 text-right w-28">
                                          {queryMeta?.level === "group" && "کد معین / کل"}
                                          {queryMeta?.level === "main" && "کد معین"}
                                          {queryMeta?.level === "moein" && "کد تفصیلی / کد ثبت"}
                                          {queryMeta?.level === "detail" && "کد / شرح ثبت"}
                                        </th>
                                        <th className="px-2.5 py-1.5 text-right">
                                          {queryMeta?.level === "group" && "عنوان حساب معین / کل"}
                                          {queryMeta?.level === "main" && "عنوان حساب معین"}
                                          {queryMeta?.level === "moein" && "عنوان تفصیلی / شرح ثبت"}
                                          {queryMeta?.level === "detail" && "جزییات و شرح اسناد"}
                                        </th>
                                        {config.colDefs.map((col) => (
                                          <th key={col.key} className={`px-2.5 py-1.5 text-left ${col.cls} w-28`}>
                                            {col.label}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.children.map((child, cIdx) => (
                                        <tr
                                          key={child.code}
                                          className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                                            cIdx % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50/40 dark:bg-slate-900/20"
                                          }`}
                                        >
                                          <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                                            {child.code}
                                          </td>
                                          <td className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
                                            {child.name || "—"}
                                          </td>
                                          {config.colDefs.map((col) => (
                                            <td
                                              key={col.key}
                                              className={`px-2.5 py-1.5 text-left font-mono tabular-nums ${col.cls}`}
                                            >
                                              {fmtNum(child[col.key])}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* ردیف جمع کل */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-400 bg-muted/40 font-bold print:bg-slate-100">
                      <td className="px-3 py-3" colSpan={2}>
                        <span className="text-xs font-bold text-foreground">جمع کل</span>
                      </td>
                      {config.colDefs.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-3 text-left font-mono font-bold tabular-nums text-xs ${col.cls}`}
                        >
                          {fmtNum(totals[col.key])}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>

              {/* ─── اسامی امضاء‌کنندگان گزارش زیر برگ چاپی ─── */}
              {rows.length > 0 && (
                <div className="mt-12 pt-6 border-t border-slate-300 print:mt-16 print:pt-6 print:border-slate-400 break-inside-avoid">
                  <div className="grid grid-cols-3 gap-6 text-center text-xs" dir="rtl">
                    {signatures.map((sig) => (
                      <div
                        key={sig.slot}
                        className="flex flex-col items-center justify-between min-h-[110px] p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 print:bg-transparent print:border-none"
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {sig.title}
                        </div>
                        
                        <div className="my-2 h-14 flex items-center justify-center">
                          {sig.image ? (
                            <img
                              src={sig.image}
                              alt={sig.title}
                              className="max-h-12 object-contain"
                            />
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              محل امضاء و مهر
                            </div>
                          )}
                        </div>

                        <div className="font-semibold text-slate-900 dark:text-slate-100 border-t border-dashed border-slate-300 pt-1 w-3/4">
                          {sig.name || "………………………"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

