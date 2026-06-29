import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, RefreshCw, FileText, Eye, ChevronLeft,
  ChevronDown, ChevronUp, X, Filter, AlertTriangle,
  CheckCircle2, Clock, Ban, Hash, CalendarDays,
  Layers, ChevronsUpDown, Edit3, Trash2,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/api";
import { toPersianDigits } from "@/components/ui/persian-date-picker";

// ─── ثوابت ────────────────────────────────────────────────────────────────────
const DOC_TYPE_LABEL = {
  PETTY_CASH_PAYMENT: "پرداخت تنخواه",
  GENERAL_PAYMENT:    "پرداخت عمومی",
  REVENUE:            "درآمد",
  TRANSFER:           "انتقال",
  CLOSING:            "اختتامیه",
};
const DOC_TYPE_COLOR = {
  PETTY_CASH_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  GENERAL_PAYMENT:    "bg-blue-100 text-blue-700 border-blue-200",
  REVENUE:            "bg-emerald-100 text-emerald-700 border-emerald-200",
  TRANSFER:           "bg-violet-100 text-violet-700 border-violet-200",
  CLOSING:            "bg-slate-100 text-slate-600 border-slate-200",
};
const STATUS_LABEL = { DRAFT: "پیش‌نویس", CONFIRMED: "تایید شده", CANCELLED: "ابطال شده" };
const STATUS_COLOR = {
  DRAFT:     "bg-orange-100 text-orange-600 border-orange-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-600 border-rose-200",
};
const STATUS_ICON = {
  DRAFT:     Clock,
  CONFIRMED: CheckCircle2,
  CANCELLED: Ban,
};

function fmt(n) {
  if (n === null || n === undefined || n === 0) return "—";
  return Number(n).toLocaleString("fa-IR");
}

// ─── Modal جزئیات سند ─────────────────────────────────────────────────────────
function DocDetailModal({ doc, onClose }) {
  const totalDebit  = doc.lines?.reduce((s, l) => s + (l.debit  ?? 0), 0) ?? 0;
  const totalCredit = doc.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
  const balanced    = totalDebit === totalCredit;
  const StatusIcon  = STATUS_ICON[doc.status] ?? Clock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl flex flex-col">

        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">جزئیات سند</h2>
              <p className="text-xs text-muted-foreground font-mono">{doc.document_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* meta */}
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b bg-muted/10 shrink-0">
          {[
            { label: "شماره سند",  value: doc.document_number, mono: true },
            { label: "دوره مالی",  value: doc.fiscal_year, mono: true },
            { label: "تاریخ سند",  value: doc.document_date ? toPersianDigits(doc.document_date) : "—" },
            { label: "مرجع",       value: doc.reference_number ?? "—", mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
              <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">نوع سند</span>
            <span className={cn("inline-flex items-center w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold", DOC_TYPE_COLOR[doc.document_type] ?? "bg-muted")}>
              {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">وضعیت</span>
            <span className={cn("inline-flex items-center gap-1 w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold", STATUS_COLOR[doc.status])}>
              <StatusIcon className="h-2.5 w-2.5" />
              {STATUS_LABEL[doc.status] ?? doc.status}
            </span>
          </div>
          {doc.description && (
            <div className="col-span-2 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">شرح</span>
              <span className="text-sm text-foreground">{doc.description}</span>
            </div>
          )}
        </div>

        {/* lines table */}
        <div className="px-6 py-4 flex-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />ردیف‌های سند ({doc.lines?.length ?? 0} ردیف)
          </p>
          {!doc.lines?.length ? (
            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground/60">
              ردیفی ثبت نشده
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground w-10">#</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">کد کل</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">کد معین</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">نام حساب</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground text-blue-600">بدهکار (ریال)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground text-rose-600">بستانکار (ریال)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">شرح</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.lines.map((line, i) => {
                    const generalCode = line.account_code ? line.account_code.substring(0, 4) : "—";
                    const detailCode = line.account_code || "—";
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-center text-muted-foreground/60">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-foreground/70">{generalCode}</td>
                        <td className="px-3 py-2 font-mono text-foreground/85">{detailCode}</td>
                        <td className="px-3 py-2 text-foreground/80">{line.account_name ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-blue-700 font-medium">{line.debit ? line.debit.toLocaleString("fa-IR") : "—"}</td>
                        <td className="px-3 py-2 font-mono text-rose-700 font-medium">{line.credit ? line.credit.toLocaleString("fa-IR") : "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{line.description ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30">
                    <td colSpan={4} className="px-3 py-2 text-xs font-bold text-right text-muted-foreground">جمع</td>
                    <td className="px-3 py-2 font-mono font-bold text-blue-700">{totalDebit.toLocaleString("fa-IR")}</td>
                    <td className="px-3 py-2 font-mono font-bold text-rose-700">{totalCredit.toLocaleString("fa-IR")}</td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        balanced ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200")}>
                        {balanced ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                        {balanced ? "متوازن" : "ناموزون"}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t px-6 py-3 bg-muted/20 rounded-b-2xl shrink-0 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5 text-xs">
            <X className="h-3.5 w-3.5" />بستن
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── هدر ستون با قابلیت مرتب‌سازی ────────────────────────────────────────────
function SortHeader({ label, field, sortBy, sortDir, onSort }) {
  const active = sortBy === field;
  return (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
          : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default function DocumentsList() {
  const navigate = useNavigate();

  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(null);   // modal

  // فیلترها
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType,   setFilterType]   = useState("ALL");
  const [filterYear,   setFilterYear]   = useState("");
  const [showFilters,  setShowFilters]  = useState(false);

  // مرتب‌سازی
  const [sortBy,  setSortBy]  = useState("document_number");
  const [sortDir, setSortDir] = useState("desc");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/documents");
      setDocs(res.data.data ?? []);
    } catch {
      setError("خطا در دریافت لیست اسناد. اتصال به سرور را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id, docNumber) => {
    if (!window.confirm(`آیا از حذف سند شماره ${docNumber} مطمئن هستید؟`)) return;
    try {
      await api.delete(`/api/documents/${id}`);
      setDocs(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      setError("خطا در حذف سند. مجددا تلاش کنید.");
    }
  };

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function handleSort(field) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("asc"); }
  }

  // فیلتر + جستجو + مرتب‌سازی
  const filtered = useMemo(() => {
    let list = [...docs];

    if (filterStatus !== "ALL") list = list.filter(d => d.status === filterStatus);
    if (filterType   !== "ALL") list = list.filter(d => d.document_type === filterType);
    if (filterYear)             list = list.filter(d => String(d.fiscal_year).includes(filterYear));

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        d.document_number?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.reference_number?.toLowerCase().includes(q) ||
        String(d.fiscal_year).includes(q) ||
        d.lines?.some(l =>
          l.account_code?.toLowerCase().includes(q) ||
          l.account_name?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q)
        )
      );
    }

    list.sort((a, b) => {
      let av = a[sortBy] ?? "";
      let bv = b[sortBy] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "fa")
        : String(bv).localeCompare(String(av), "fa");
    });

    return list;
  }, [docs, search, filterStatus, filterType, filterYear, sortBy, sortDir]);

  const hasFilters = filterStatus !== "ALL" || filterType !== "ALL" || filterYear !== "";

  function clearFilters() {
    setFilterStatus("ALL"); setFilterType("ALL"); setFilterYear(""); setSearch("");
  }

  // خلاصه آماری
  const stats = useMemo(() => ({
    total:     docs.length,
    draft:     docs.filter(d => d.status === "DRAFT").length,
    confirmed: docs.filter(d => d.status === "CONFIRMED").length,
    cancelled: docs.filter(d => d.status === "CANCELLED").length,
  }), [docs]);

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/document-setup")}>تنظیم اسناد</span>
        <ChevronLeft className="h-3 w-3" />
        <span>لیست اسناد</span>
      </div>

      {/* هدر */}
      <div className="mb-5 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground">لیست اسناد حسابداری</h1>
          <p className="text-xs text-muted-foreground mt-0.5">مشاهده و جستجوی تمام اسناد ثبت‌شده در سیستم</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDocs} className="gap-1.5 h-9 text-xs" disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            بروزرسانی
          </Button>
          <Button size="sm" onClick={() => navigate("/document-setup/manual-doc")} className="gap-1.5 h-9 text-xs">
            <FileText className="h-3.5 w-3.5" />صدور سند دستی
          </Button>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" dir="rtl">
        {[
          { label: "کل اسناد",    value: stats.total,     color: "text-foreground",        bg: "bg-muted/40" },
          { label: "پیش‌نویس",   value: stats.draft,     color: "text-orange-600",         bg: "bg-orange-50" },
          { label: "تایید شده",  value: stats.confirmed, color: "text-emerald-700",        bg: "bg-emerald-50" },
          { label: "ابطال شده",  value: stats.cancelled, color: "text-rose-600",           bg: "bg-rose-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", bg)}>
            <span className={cn("text-2xl font-extrabold font-mono", color)}>{value}</span>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* نوار جستجو و فیلتر */}
      <Card className="mb-4">
        <CardContent className="p-3" dir="rtl">
          <div className="flex items-center gap-2 flex-wrap">
            {/* جستجو */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="جستجو در شماره سند، شرح، کد حساب، ردیف‌ها..."
                className="h-9 text-xs pr-9"
                dir="rtl"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* دکمه فیلترها */}
            <Button variant={showFilters || hasFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(s => !s)}
              className={cn("gap-1.5 h-9 text-xs", hasFilters && "bg-primary text-primary-foreground")}>
              <Filter className="h-3.5 w-3.5" />
              فیلترها {hasFilters && `(فعال)`}
            </Button>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />پاک کردن
              </Button>
            )}

            {/* تعداد نتایج */}
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
              {filtered.length} نتیجه از {docs.length}
            </span>
          </div>

          {/* پنل فیلترها */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">وضعیت</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="ALL">همه</option>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">نوع سند</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="ALL">همه</option>
                  {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">دوره مالی</label>
                <Input value={filterYear} onChange={e => setFilterYear(e.target.value)}
                  placeholder="مثال: 1403" className="h-8 text-xs" dir="ltr" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* خطا */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" dir="rtl">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="mr-auto text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* جدول */}
      <Card>
        <CardHeader className="pb-3 border-b" dir="rtl">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            اسناد حسابداری
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm" dir="rtl">
              <RefreshCw className="h-4 w-4 animate-spin" />در حال بارگذاری...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/40">
                <FileText className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">
                  {docs.length === 0 ? "هیچ سندی ثبت نشده" : "نتیجه‌ای یافت نشد"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {docs.length === 0
                    ? "با کلیک روی «صدور سند دستی» اولین سند را ثبت کنید."
                    : "فیلترها یا عبارت جستجو را تغییر دهید."}
                </p>
              </div>
              {docs.length === 0 && (
                <Button size="sm" onClick={() => navigate("/document-setup/manual-doc")} className="gap-1.5 mt-1 text-xs">
                  <FileText className="h-3.5 w-3.5" />صدور سند دستی
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-12">#</th>
                    <SortHeader label="شماره سند"   field="document_number" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="دوره مالی"   field="fiscal_year"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="تاریخ سند"   field="document_date"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">نوع سند</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">وضعیت</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">کدهای حساب</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600">جمع بدهکار</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-rose-600">جمع بستانکار</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">شرح</th>
                    <th className="px-4 py-3 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc, idx) => {
                    const totalD = doc.lines?.reduce((s, l) => s + (l.debit  ?? 0), 0) ?? 0;
                    const totalC = doc.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
                    const balanced = totalD === totalC;
                    const StatusIcon = STATUS_ICON[doc.status] ?? Clock;
                    const accountCodes = [...new Set(doc.lines?.map(l => l.account_code).filter(Boolean) ?? [])];

                    return (
                      <tr key={doc._id ?? idx}
                        onClick={() => setSelected(doc)}
                        className="border-b last:border-0 hover:bg-primary/[0.03] cursor-pointer transition-colors group"
                      >
                        {/* ردیف */}
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground/60">{idx + 1}</td>

                        {/* شماره سند */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            <span className="font-mono text-xs font-medium text-foreground">{doc.document_number}</span>
                          </div>
                        </td>

                        {/* دوره مالی */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs text-foreground/80">{doc.fiscal_year}</span>
                        </td>

                        {/* تاریخ */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            {doc.document_date ? toPersianDigits(doc.document_date) : "—"}
                          </span>
                        </td>

                        {/* نوع سند */}
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                            DOC_TYPE_COLOR[doc.document_type] ?? "bg-muted text-muted-foreground border-border")}>
                            {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type ?? "—"}
                          </span>
                        </td>

                        {/* وضعیت */}
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                            STATUS_COLOR[doc.status] ?? "bg-muted text-muted-foreground border-border")}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {STATUS_LABEL[doc.status] ?? doc.status ?? "—"}
                          </span>
                        </td>

                        {/* کدهای حساب */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {accountCodes.slice(0, 3).map(code => (
                              <span key={code} className="font-mono text-[10px] bg-muted rounded px-1.5 py-0.5 text-foreground/70">{code}</span>
                            ))}
                            {accountCodes.length > 3 && (
                              <span className="text-[10px] text-muted-foreground/60">+{accountCodes.length - 3}</span>
                            )}
                            {accountCodes.length === 0 && <span className="text-muted-foreground/40 text-xs">—</span>}
                          </div>
                        </td>

                        {/* جمع بدهکار */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-blue-700 font-medium">{fmt(totalD)}</span>
                        </td>

                        {/* جمع بستانکار */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-rose-700 font-medium">{fmt(totalC)}</span>
                        </td>

                        {/* شرح */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <span className="text-xs text-muted-foreground truncate block" title={doc.description}>
                            {doc.description ?? "—"}
                          </span>
                        </td>

                        {/* عملیات */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelected(doc)}
                              className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                              title="مشاهده جزئیات">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => navigate("/document-setup/manual-doc", { state: { docId: doc._id } })}
                              className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-amber-100 hover:text-amber-700 transition-all"
                              title="ویرایش">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(doc._id, doc.document_number)}
                              className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-all"
                              title="حذف">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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

      {/* Modal جزئیات */}
      {selected && <DocDetailModal doc={selected} onClose={() => setSelected(null)} />}
    </PageShell>
  );
}
