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
  BookOpen, RotateCcw, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function fmtBalance(val) {
  if (val === 0 || val == null) return { text: "—", cls: "text-muted-foreground" };
  const abs  = Math.abs(val).toLocaleString("fa-IR");
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

// ─── کامپوننت اصلی ────────────────────────────────────────────────────────────
export default function GeneralLedger() {
  // ── فیلترها ──
  const [fiscalYear,   setFiscalYear]   = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState(() => today());
  const [accountCode,  setAccountCode]  = useState("");
  const [accountSearch, setAccountSearch] = useState("");

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

  // بارگذاری حساب‌های کل (۳ رقم)
  useEffect(() => {
    api.get("/api/account-heads?flat=1").then((r) => {
      const all = r.data?.data ?? r.data ?? [];
      const mainAccounts = all
        .filter((a) => {
          const digits = (a.code ?? "").replace(/\D/g, "");
          return digits.length === 3;
        })
        .map((a) => ({ value: a.code, label: `${a.code} — ${a.title}` }));
      setAccountOpts(mainAccounts);
    }).catch(() => {});
  }, []);

  function validate() {
    const e = {};
    if (!accountCode) e.accountCode = "کد حساب کل الزامی است";
    if (!dateFrom)    e.dateFrom    = "تاریخ ابتدا الزامی است";
    if (!dateTo)      e.dateTo      = "تاریخ انتها الزامی است";
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
      const params = new URLSearchParams({ accountCode, dateFrom, dateTo });
      if (fiscalYear) params.append("fiscalYear", fiscalYear);
      const res = await api.get(`/api/ledger/general-ledger?${params.toString()}`);
      setRows(res.data.data ?? []);
      setOpenBalance(res.data.openBalance ?? { debit: 0, credit: 0, balance: 0, nature: "تراز" });
      setTotals(res.data.totals ?? {});
      setResAccountName(res.data.accountName ?? "");
      setQueryMeta({ accountCode, dateFrom, dateTo, fiscalYear });
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در دریافت اطلاعات از سرور");
    } finally {
      setLoading(false);
    }
  }, [accountCode, dateFrom, dateTo, fiscalYear]);

  function handleReset() {
    setAccountCode(""); setDateFrom(""); setDateTo(today());
    setFiscalYear(fiscalYears[0]?.value ?? ""); setAccountSearch("");
    setErrors({}); setFetchError(""); setRows(null);
    setOpenBalance(null); setTotals({}); setQueryMeta(null);
  }

  const reportTitle = queryMeta
    ? `دفتر کل — حساب ${queryMeta.accountCode}${resAccountName ? ` (${resAccountName})` : ""} — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`
    : "دفتر کل";

  return (
    <PageShell>
      <PageHeader title="دفتر کل" description="نمایش کلیه گردش‌های هر حساب کل در بازه زمانی مشخص">
        {rows !== null && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => printTable("#general-ledger-table", reportTitle)}>
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => exportCSV(rows, openBalance, totals, queryMeta?.accountCode, resAccountName, reportTitle)}>
              <FileDown className="h-4 w-4 ml-1" /> Excel
            </Button>
          </div>
        )}
      </PageHeader>

      {/* ─── فرم فیلتر ─── */}
      <Card className="mb-5">
        <CardContent className="pt-5" dir="rtl">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 items-end">

              {/* سال مالی */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">سال مالی</Label>
                <SearchableSelect value={fiscalYear} onChange={setFiscalYear}
                  options={fiscalYears} placeholder="انتخاب سال..." searchable={false} />
              </div>

              {/* از تاریخ */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex gap-1">از تاریخ <span className="text-rose-500">*</span></Label>
                <PersianDatePicker value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setErrors((p) => ({ ...p, dateFrom: "" })); }}
                  placeholder="۱۴۰۳/۰۱/۰۱" />
                {errors.dateFrom && <p className="text-[11px] text-rose-600">⚠ {errors.dateFrom}</p>}
              </div>

              {/* تا تاریخ */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex gap-1">تا تاریخ <span className="text-rose-500">*</span></Label>
                <PersianDatePicker value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setErrors((p) => ({ ...p, dateTo: "" })); }}
                  placeholder="۱۴۰۳/۱۲/۲۹" />
                {errors.dateTo && <p className="text-[11px] text-rose-600">⚠ {errors.dateTo}</p>}
              </div>

              {/* کد حساب کل */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex gap-1">کد حساب کل <span className="text-rose-500">*</span></Label>
                {accountOpts.length > 0 ? (
                  <SearchableSelect value={accountCode}
                    onChange={(v) => { setAccountCode(v); setErrors((p) => ({ ...p, accountCode: "" })); }}
                    options={accountOpts} placeholder="جستجوی حساب..." />
                ) : (
                  <div className="flex gap-1">
                    <Input value={accountCode}
                      onChange={(e) => { setAccountCode(e.target.value); setErrors((p) => ({ ...p, accountCode: "" })); }}
                      placeholder="مثلاً ۱۱۰" className="h-8 text-sm font-mono" dir="ltr" maxLength={3} />
                  </div>
                )}
                {errors.accountCode && <p className="text-[11px] text-rose-600">⚠ {errors.accountCode}</p>}
              </div>

              {/* دکمه‌ها */}
              <div className="flex gap-2 items-end">
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
            <p className="text-sm">در حال بارگذاری دفتر کل...</p>
          </CardContent>
        </Card>
      )}

      {/* ─── قبل از جستجو ─── */}
      {!loading && rows === null && !fetchError && (
        <Card>
          <CardContent className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <BookOpen className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">دفتر کل</p>
              <p className="text-sm mt-1">سال مالی، بازه تاریخی و کد حساب را تنظیم کرده و نمایش را بزنید</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── جدول نتیجه ─── */}
      {!loading && rows !== null && (
        <Card>
          <CardContent className="p-0">
            {/* هدر */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2" dir="rtl">
              <div className="flex items-center gap-2 flex-wrap">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">دفتر کل</span>
                {queryMeta && (
                  <>
                    <Badge variant="default" className="text-xs font-mono">
                      {queryMeta.accountCode}{resAccountName ? ` — ${resAccountName}` : ""}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono">
                      {queryMeta.dateFrom} تا {queryMeta.dateTo}
                    </Badge>
                    {queryMeta.fiscalYear && (
                      <Badge variant="outline" className="text-xs">سال {queryMeta.fiscalYear}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{rows.length} ردیف</span>
                  </>
                )}
              </div>
          
            </div>

            {/* جدول */}
            <div className="overflow-x-auto" id="general-ledger-table">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2.5 text-right font-bold text-muted-foreground w-24 whitespace-nowrap">تاریخ</th>
                    <th className="px-3 py-2.5 text-right font-bold text-muted-foreground w-24 whitespace-nowrap">شماره سند</th>
                    <th className="px-3 py-2.5 text-right font-bold text-muted-foreground min-w-[200px]">شرح</th>
                    <th className="px-3 py-2.5 text-center font-bold text-blue-700 w-32 whitespace-nowrap">بدهکار</th>
                    <th className="px-3 py-2.5 text-center font-bold text-rose-700 w-32 whitespace-nowrap">بستانکار</th>
                    <th className="px-3 py-2.5 text-center font-bold text-muted-foreground w-36 whitespace-nowrap">مانده</th>
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
                            {Math.abs(openBalance.balance).toLocaleString("fa-IR")}
                            <span className="text-[10px] mr-1">{openBalance.nature}</span>
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  )}

                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <BookOpen className="h-8 w-8 opacity-30" />
                          <p>در این بازه زمانی گردشی برای این حساب ثبت نشده است</p>
                        </div>
                      </td>
                    </tr>
                  ) : rows.map((row, i) => {
                    const bal = fmtBalance(row.balance);
                    return (
                      <tr key={i} className={cn("border-b hover:bg-primary/5 transition-colors", i % 2 === 1 && "bg-muted/10")}>
                        <td className="px-3 py-2 font-mono whitespace-nowrap text-muted-foreground">{row.date || "—"}</td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap font-semibold">{row.doc_number || "—"}</td>
                        <td className="px-3 py-2 max-w-xs truncate" title={row.description}>{row.description || "—"}</td>
                        <td className="px-3 py-2 text-center font-mono tabular-nums text-blue-700">{fmtNum(row.debit)}</td>
                        <td className="px-3 py-2 text-center font-mono tabular-nums text-rose-700">{fmtNum(row.credit)}</td>
                        <td className={cn("px-3 py-2 text-center font-mono tabular-nums font-semibold whitespace-nowrap", bal.cls)}>
                          {bal.text}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* footer جمع گردش دوره */}
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 bg-muted/40 font-bold">
                      <td className="px-3 py-2.5" colSpan={3}>
                        <span className="text-xs font-bold">جمع گردش دوره</span>
                      </td>
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
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
