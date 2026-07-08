import { useState, useCallback, useEffect } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Search, Printer, FileDown, Loader2, AlertCircle,
  Scale, RotateCcw, FileText,
} from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { cn } from "@/lib/utils";

// ─── ثوابت ────────────────────────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { value: "group",  label: "گروه حساب (۱ رقم)"  },
  { value: "main",   label: "حساب کل (۳ رقم)"     },
  { value: "moein",  label: "حساب معین (۵ رقم)"   },
  { value: "detail", label: "حساب تفصیلی"          },
];

const COL_DEFS = [
  { key: "debit_begin",  label: "مانده اول دوره",    sub: "بدهکار",    cls: "text-blue-700" },
  { key: "credit_begin", label: "مانده اول دوره",    sub: "بستانکار",  cls: "text-rose-700" },
  { key: "debit_turn",   label: "گردش دوره",         sub: "بدهکار",    cls: "text-blue-700" },
  { key: "credit_turn",  label: "گردش دوره",         sub: "بستانکار",  cls: "text-rose-700" },
  { key: "debit_bal",    label: "مانده پایان دوره",  sub: "بدهکار",    cls: "text-blue-700" },
  { key: "credit_bal",   label: "مانده پایان دوره",  sub: "بستانکار",  cls: "text-rose-700" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function exportCSV(rows, totals, title) {
  const headers = ["کد حساب", "عنوان حساب",
    "مانده اول دوره بدهکار", "مانده اول دوره بستانکار",
    "گردش بدهکار", "گردش بستانکار",
    "مانده پایان دوره بدهکار", "مانده پایان دوره بستانکار",
  ];
  const toRow = (r) => [
    r.code, `"${r.name ?? ""}"`,
    r.debit_begin ?? 0, r.credit_begin ?? 0,
    r.debit_turn  ?? 0, r.credit_turn  ?? 0,
    r.debit_bal   ?? 0, r.credit_bal   ?? 0,
  ].join(",");
  const totalRow = [
    "", "جمع کل",
    totals.debit_begin ?? 0, totals.credit_begin ?? 0,
    totals.debit_turn  ?? 0, totals.credit_turn  ?? 0,
    totals.debit_bal   ?? 0, totals.credit_bal   ?? 0,
  ].join(",");
  const csv = [headers.join(","), ...rows.map(toRow), totalRow].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${title}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toLocaleDateString("fa-IR");
}

// ─── کامپوننت اصلی ────────────────────────────────────────────────────────────
export default function TrialBalance() {
  // ── فیلترها ──
  const [fiscalYear,   setFiscalYear]   = useState("");
  const [level,        setLevel]        = useState("main");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState(() => today());
  const [codeFrom,     setCodeFrom]     = useState("");
  const [codeTo,       setCodeTo]       = useState("");
  const [orgUnit,      setOrgUnit]      = useState("");

  // ── داده‌ها ──
  const [fiscalYears,  setFiscalYears]  = useState([]);
  const [rows,         setRows]         = useState(null);
  const [totals,       setTotals]       = useState({});
  const [queryMeta,    setQueryMeta]    = useState(null);

  // ── وضعیت ──
  const [loading,      setLoading]      = useState(false);
  const [fetchError,   setFetchError]   = useState("");
  const [errors,       setErrors]       = useState({});

  // بارگذاری سال‌های مالی
  useEffect(() => {
    api.get("/api/fiscal-years")
      .then((r) => {
        const list = (r.data?.data ?? []).map((y) => ({
          value: String(y.year),
          label: `${y.year} — ${y.title}`,
        }));
        setFiscalYears(list);
        if (list.length > 0) setFiscalYear(list[0].value);
      })
      .catch(() => {});
  }, []);

  function validate() {
    const e = {};
    if (!level)    e.level    = "سطح حساب الزامی است";
    if (!dateFrom) e.dateFrom = "تاریخ ابتدا الزامی است";
    if (!dateTo)   e.dateTo   = "تاریخ انتها الزامی است";
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
      const params = new URLSearchParams({ level, dateFrom, dateTo });
      if (fiscalYear) params.append("fiscalYear", fiscalYear);
      const res = await api.get(`/api/ledger/trial-balance?${params.toString()}`);
      let data = res.data.data ?? [];

      // فیلتر از حساب / تا حساب (سمت کلاینت)
      if (codeFrom.trim()) data = data.filter((r) => r.code >= codeFrom.trim());
      if (codeTo.trim())   data = data.filter((r) => r.code <= codeTo.trim());

      setRows(data);
      setTotals(res.data.totals ?? {});
      setQueryMeta({ level, dateFrom, dateTo, fiscalYear, codeFrom, codeTo, orgUnit });
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در دریافت اطلاعات از سرور");
    } finally {
      setLoading(false);
    }
  }, [level, dateFrom, dateTo, fiscalYear, codeFrom, codeTo, orgUnit]);

  function handleReset() {
    setLevel("main"); setDateFrom(""); setDateTo(today());
    setCodeFrom(""); setCodeTo(""); setOrgUnit("");
    setFiscalYear(fiscalYears[0]?.value ?? "");
    setErrors({}); setFetchError(""); setRows(null); setTotals({}); setQueryMeta(null);
  }

  const levelLabel = LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? "";
  const reportTitle = `تراز آزمایشی — ${levelLabel}${queryMeta?.dateFrom ? ` (${queryMeta.dateFrom} تا ${queryMeta.dateTo})` : ""}`;

  return (
    <PageShell>
      <PageHeader title="تراز آزمایشی" description="نمایش مانده و گردش حساب‌ها در یک دوره مالی جهت کنترل صحت ثبت‌های حسابداری">
        {rows !== null && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => printTable("#trial-balance-table", reportTitle)}>
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportCSV(rows, totals, reportTitle)}>
              <FileDown className="h-4 w-4 ml-1" /> Excel
            </Button>
          </div>
        )}
      </PageHeader>

      {/* ─── فرم فیلتر ─── */}
      <Card className="mb-5">
        <CardContent className="pt-5" dir="rtl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

              {/* سال مالی */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">سال مالی / دوره مالی</Label>
                <SearchableSelect
                  value={fiscalYear}
                  onChange={setFiscalYear}
                  options={fiscalYears}
                  placeholder="انتخاب سال مالی..."
                  searchable={false}
                />
              </div>

              {/* سطح حساب */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex gap-1">سطح حساب <span className="text-rose-500">*</span></Label>
                <SearchableSelect
                  value={level}
                  onChange={(v) => { setLevel(v); setErrors((p) => ({ ...p, level: "" })); }}
                  options={LEVEL_OPTIONS}
                  placeholder="انتخاب سطح..."
                  searchable={false}
                />
                {errors.level && <p className="text-[11px] text-rose-600">⚠ {errors.level}</p>}
              </div>

              {/* از تاریخ */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex gap-1">از تاریخ <span className="text-rose-500">*</span></Label>
                <PersianDatePicker
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setErrors((p) => ({ ...p, dateFrom: "" })); }}
                  placeholder="۱۴۰۳/۰۱/۰۱"
                />
                {errors.dateFrom && <p className="text-[11px] text-rose-600">⚠ {errors.dateFrom}</p>}
              </div>

              {/* تا تاریخ */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex gap-1">تا تاریخ <span className="text-rose-500">*</span></Label>
                <PersianDatePicker
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setErrors((p) => ({ ...p, dateTo: "" })); }}
                  placeholder="۱۴۰۳/۱۲/۲۹"
                />
                {errors.dateTo && <p className="text-[11px] text-rose-600">⚠ {errors.dateTo}</p>}
              </div>

              {/* از حساب */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">از حساب</Label>
                <Input value={codeFrom} onChange={(e) => setCodeFrom(e.target.value)}
                  placeholder="کد شروع (اختیاری)" className="h-8 text-sm font-mono" dir="ltr" />
              </div>

              {/* تا حساب */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">تا حساب</Label>
                <Input value={codeTo} onChange={(e) => setCodeTo(e.target.value)}
                  placeholder="کد پایان (اختیاری)" className="h-8 text-sm font-mono" dir="ltr" />
              </div>

              {/* واحد سازمانی */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">واحد سازمانی <span className="text-muted-foreground text-[10px]">(اختیاری)</span></Label>
                <Input value={orgUnit} onChange={(e) => setOrgUnit(e.target.value)}
                  placeholder="نام یا کد واحد..." className="h-8 text-sm" />
              </div>

              {/* دکمه‌ها */}
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1 gap-1.5" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  نمایش
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={handleReset} disabled={loading} title="پاک کردن">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ─── خطا ─── */}
      {fetchError && (
        <Card className="mb-4 border-rose-200 bg-rose-50">
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
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm">در حال محاسبه تراز آزمایشی...</p>
          </CardContent>
        </Card>
      )}

      {/* ─── قبل از جستجو ─── */}
      {!loading && rows === null && !fetchError && (
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Scale className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">تراز آزمایشی</p>
              <p className="text-sm mt-1">فیلترهای مورد نظر را تنظیم کرده و دکمه نمایش را بزنید</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── جدول نتیجه ─── */}
      {!loading && rows !== null && (
        <Card>
          <CardContent className="p-0">
            {/* هدر جدول */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2" dir="rtl">
              <div className="flex items-center gap-2 flex-wrap">
                <Scale className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">تراز آزمایشی</span>
                {queryMeta && (
                  <>
                    <Badge variant="secondary" className="text-xs">{levelLabel}</Badge>
                    <Badge variant="outline" className="text-xs font-mono">
                      {queryMeta.dateFrom} — {queryMeta.dateTo}
                    </Badge>
                    {queryMeta.fiscalYear && (
                      <Badge variant="outline" className="text-xs">
                        سال {queryMeta.fiscalYear}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{rows.length} حساب</span>
                  </>
                )}
              </div>
            </div>

            {/* جدول */}
            <div className="overflow-x-auto" id="trial-balance-table">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  {/* ردیف اول: گروه‌بندی ستون‌ها */}
                  <tr className="border-b bg-muted/50">
                    <th rowSpan={2} className="px-3 py-2 text-right font-bold text-muted-foreground border-l w-24 whitespace-nowrap">کد حساب</th>
                    <th rowSpan={2} className="px-3 py-2 text-right font-bold text-muted-foreground border-l min-w-[180px]">عنوان حساب</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-bold text-muted-foreground border-l border-b">مانده اول دوره</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-bold text-muted-foreground border-l border-b">گردش دوره</th>
                    <th colSpan={2} className="px-3 py-2 text-center font-bold text-muted-foreground border-b">مانده پایان دوره</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="px-3 py-1.5 text-center font-semibold text-blue-700 w-28 whitespace-nowrap">بدهکار</th>
                    <th className="px-3 py-1.5 text-center font-semibold text-rose-700 border-l w-28 whitespace-nowrap">بستانکار</th>
                    <th className="px-3 py-1.5 text-center font-semibold text-blue-700 w-28 whitespace-nowrap">بدهکار</th>
                    <th className="px-3 py-1.5 text-center font-semibold text-rose-700 border-l w-28 whitespace-nowrap">بستانکار</th>
                    <th className="px-3 py-1.5 text-center font-semibold text-blue-700 w-28 whitespace-nowrap">بدهکار</th>
                    <th className="px-3 py-1.5 text-center font-semibold text-rose-700 w-28 whitespace-nowrap">بستانکار</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Scale className="h-8 w-8 opacity-30" />
                          <p>داده‌ای برای نمایش وجود ندارد</p>
                          <p className="text-xs opacity-60">در بازه انتخابی هیچ سندی ثبت نشده است</p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.map((row, i) => (
                    <tr key={row.code} className={cn("border-b hover:bg-primary/5 transition-colors", i % 2 === 1 && "bg-muted/10")}>
                      <td className="px-3 py-2 font-mono font-semibold whitespace-nowrap border-l">{row.code}</td>
                      <td className="px-3 py-2 max-w-[260px] truncate border-l" title={row.name}>{row.name || "—"}</td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700 whitespace-nowrap">{fmtNum(row.debit_begin)}</td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700 whitespace-nowrap border-l">{fmtNum(row.credit_begin)}</td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700 whitespace-nowrap">{fmtNum(row.debit_turn)}</td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700 whitespace-nowrap border-l">{fmtNum(row.credit_turn)}</td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700 font-semibold whitespace-nowrap">{fmtNum(row.debit_bal)}</td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700 font-semibold whitespace-nowrap">{fmtNum(row.credit_bal)}</td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 bg-muted/40 font-bold">
                      <td className="px-3 py-2.5 border-l" colSpan={2}>
                        <span className="text-xs font-bold">جمع کل</span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit_begin)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-rose-700 border-l">{fmtNum(totals.credit_begin)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit_turn)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-rose-700 border-l">{fmtNum(totals.credit_turn)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit_bal)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit_bal)}</td>
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
