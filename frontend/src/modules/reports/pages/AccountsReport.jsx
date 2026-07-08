import { useState, useCallback, useEffect } from "react";
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
  RotateCcw, BookOpen, Loader2, AlertCircle,
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

  // ── فیلترهای گردش حساب ──
  const [fiscalYear,   setFiscalYear]   = useState("");
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState(() => today());
  const [accountCode,  setAccountCode]  = useState("");

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

  function validate() {
    const e = {};
    if (!accountCode) e.accountCode = "انتخاب حساب الزامی است";
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
      const res = await api.get(`/api/ledger/account-turnover?${params.toString()}`);
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
    setFiscalYear(fiscalYears[0]?.value ?? "");
    setErrors({}); setFetchError(""); setRows(null);
    setOpenBalance(null); setTotals({}); setQueryMeta(null);
  }

  function handleSelect(id) {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  }

  const reportTitle = queryMeta
    ? `گردش حساب — حساب ${queryMeta.accountCode}${resAccountName ? ` (${resAccountName})` : ""} — ${queryMeta.dateFrom} تا ${queryMeta.dateTo}`
    : "گردش حساب‌ها";

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های حساب‌ها"
        description="تراز آزمایشی، گردش، مانده و ریز گردش حساب‌ها"
      >
        {active === "turnover" && rows !== null && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => printTable("#turnover-table", reportTitle)}>
              <Printer className="h-4 w-4 ml-1" /> چاپ
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => exportCSV(rows, openBalance, totals, queryMeta?.accountCode, resAccountName, reportTitle)}>
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

        <main className="flex-1">
          <Card>
            <CardContent className="pt-5">
              {active === "turnover" ? (
                // ─── فرم و جدول گردش حساب‌ها ───
                <div dir="rtl">
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
                        <Button type="submit" className="flex-1 gap-1.5 h-8 text-xs font-medium" disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          نمایش
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} disabled={loading} title="پاک کردن">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </form>

                  {/* ─── خطا ─── */}
                  {fetchError && (
                    <div className="mb-4 border border-rose-200 bg-rose-50 rounded-xl p-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                      <p className="text-sm text-rose-700">{fetchError}</p>
                    </div>
                  )}

                  {/* ─── لودینگ ─── */}
                  {loading && (
                    <div className="py-20 flex flex-col items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm">در حال بارگذاری گردش حساب...</p>
                    </div>
                  )}

                  {/* ─── قبل از جستجو ─── */}
                  {!loading && rows === null && !fetchError && (
                    <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <RefreshCw className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">گردش حساب‌ها</p>
                        <p className="text-sm mt-1">سال مالی، بازه تاریخی و حساب مورد نظر را تنظیم کرده و نمایش را بزنید</p>
                      </div>
                    </div>
                  )}

                  {/* ─── جدول نتیجه ─── */}
                  {!loading && rows !== null && (
                    <div className="border rounded-xl overflow-hidden mt-4">
                      {/* هدر جدول */}
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/10 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">گردش حساب</span>
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
                      <div className="overflow-x-auto" id="turnover-table">
                        <table className="w-full text-xs" dir="rtl">
                          <thead>
                            <tr className="border-b bg-muted/40">
                              <th className="px-3 py-2.5 text-right font-bold text-muted-foreground w-24 whitespace-nowrap">تاریخ</th>
                              <th className="px-3 py-2.5 text-right font-bold text-muted-foreground w-28 whitespace-nowrap">شماره سند</th>
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
                    </div>
                  )}
                </div>
              ) : (
                // ─── فرم و محتوای سایر گزارشات (در حال توسعه) ───
                <>
                  <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border bg-muted/20 p-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">کد حساب (از)</label>
                      <Input placeholder="مثلاً ۱۱۰۰۰" className="h-8 text-sm font-mono" dir="ltr" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">کد حساب (تا)</label>
                      <Input placeholder="مثلاً ۹۹۹۹۹" className="h-8 text-sm font-mono" dir="ltr" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                      <Input placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-sm" dir="ltr" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                      <Input placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-sm" dir="ltr" />
                    </div>
                    <div className="col-span-full flex justify-end">
                      <Button size="sm" className="w-32">
                        <Search className="h-4 w-4 ml-1" /> نمایش
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      {current && <current.icon className="h-8 w-8" />}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{current?.label}</p>
                      <p className="text-sm mt-1">فیلترها را تنظیم کرده و دکمه نمایش را بزنید</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">در حال توسعه</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </PageShell>
  );
}

