import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { Table2, Search, Printer, FileDown, Loader2, AlertCircle } from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";

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

// ─── خروجی Excel ─────────────────────────────────────────────────────────────
function exportToCSV(rows, totals, colDefs, title) {
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
    setLoading(false);
  }

  const levelLabel = LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? "";

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
            {/* هدر جدول */}
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
                      {LEVEL_OPTIONS.find((o) => o.value === queryMeta.level)?.label}
                    </span>
                    <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                      {queryMeta.dateFrom} — {queryMeta.dateTo}
                    </span>
                    <span className="text-xs text-muted-foreground border rounded px-2 py-0.5 bg-muted/50">
                      {rows.length} حساب
                    </span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-xs"
                  onClick={() => printTable("#balance-print-area", `${config.title} — ${queryMeta?.dateFrom ?? ""} تا ${queryMeta?.dateTo ?? ""}`)}
                >
                  <Printer className="h-3.5 w-3.5" /> چاپ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8 text-xs"
                  onClick={() => exportToCSV(rows, totals, config.colDefs, config.title)}
                >
                  <FileDown className="h-3.5 w-3.5" /> خروجی اکسل
                </Button>
              </div>
            </div>

            {/* جدول */}
            <div className="overflow-x-auto" id="balance-print-area">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2.5 text-right font-bold text-muted-foreground w-24 whitespace-nowrap">
                      کد حساب
                    </th>
                    <th className="px-3 py-2.5 text-right font-bold text-muted-foreground min-w-[160px]">
                      عنوان حساب
                    </th>
                    {config.colDefs.map((col) => (
                      <th
                        key={col.key}
                        className={`px-3 py-2.5 text-left font-bold whitespace-nowrap ${col.cls} w-32`}
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
                    rows.map((row, idx) => (
                      <tr
                        key={row.code}
                        className={`border-b hover:bg-muted/30 transition-colors ${
                          idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                        }`}
                      >
                        <td className="px-3 py-2 font-mono font-semibold text-foreground whitespace-nowrap">
                          {row.code}
                        </td>
                        <td className="px-3 py-2 text-foreground">
                          {row.name || <span className="text-muted-foreground/50 italic">—</span>}
                        </td>
                        {config.colDefs.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3 py-2 text-left font-mono tabular-nums ${col.cls}`}
                          >
                            {fmtNum(row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>

                {/* ردیف جمع کل */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 bg-muted/30 font-bold">
                      <td className="px-3 py-2.5" colSpan={2}>
                        <span className="text-xs font-bold text-foreground">جمع کل</span>
                      </td>
                      {config.colDefs.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-2.5 text-left font-mono font-bold tabular-nums ${col.cls}`}
                        >
                          {fmtNum(totals[col.key])}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
