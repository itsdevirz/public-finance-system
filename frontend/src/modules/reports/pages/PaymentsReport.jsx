import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownCircle, ArrowUpCircle, Vault, Landmark, ArrowLeftRight, CreditCard,
  Search, Printer, FileDown, ChevronLeft, Loader2, RotateCcw, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { getDefaultDateRange } from "@/lib/fiscalUtils";

const SIDEBAR_ITEMS = [
  { id: "receipts",       label: "گزارش دریافت‌ها",   icon: ArrowDownCircle },
  { id: "payments",       label: "گزارش پرداخت‌ها",   icon: ArrowUpCircle },
  { id: "cash-turnover",  label: "گردش صندوق",         icon: Vault },
  { id: "bank-turnover",  label: "گردش بانک",          icon: Landmark },
  { id: "bank-reconcile", label: "مغایرت بانکی",       icon: ArrowLeftRight },
  { id: "checks",         label: "وضعیت چک‌ها",        icon: CreditCard },
];

const ROUTE_MAP = {
  "receipts":       "/reports/payments/receipts",
  "payments":       "/reports/payments/payments",
  "cash-turnover":  "/reports/payments/cash-turnover",
  "bank-turnover":  "/reports/payments/bank-turnover",
  "bank-reconcile": "/reports/payments/bank-reconcile",
  "checks":         "/reports/payments/checks",
};

// وضعیت‌های چک
const CHECK_STATUS_LABELS = {
  pending: "جریان دارد",
  cleared: "وصول شده",
  cancelled: "ابطال شده",
  aggregated: "تجمیع شده"
};

const CHECK_STATUS_COLORS = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  cleared: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  aggregated: "bg-amber-50 text-amber-700 border-amber-200",
};

const CHECK_STATUSES = [
  { value: "ALL",        label: "همه وضعیت‌ها", cls: "bg-gray-100 text-gray-700" },
  { value: "pending",    label: "صادرشده / جریان دارد",   cls: "bg-blue-50  text-blue-700  border-blue-200"  },
  { value: "cleared",    label: "وصول‌ شده",  cls: "bg-green-50 text-green-700 border-green-200" },
  { value: "cancelled",  label: "ابطال شده",    cls: "bg-rose-50  text-rose-700  border-rose-200"  },
];

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
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "receipts";
}

export default function PaymentsReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  const defaultRange = getDefaultDateRange();

  // ── داده‌ها ──
  const [checks, setChecks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── فیلترها ──
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCheckStatus, setSelectedCheckStatus] = useState("ALL");

  // بارگذاری داده‌ها از سرور
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [checksRes, docsRes] = await Promise.all([
        api.get("/api/checks"),
        api.get("/api/documents")
      ]);
      setChecks(checksRes.data?.data ?? []);
      setDocuments(docsRes.data?.data ?? []);
    } catch (e) {
      console.error(e);
      setError("خطا در بارگذاری داده‌ها از سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ریست فیلترها و داده‌ها
  const handleReset = () => {
    const r = getDefaultDateRange();
    setDateFrom(r.dateFrom);
    setDateTo(r.dateTo);
    setSearchQuery("");
    setSelectedCheckStatus("ALL");
    handleSearch();
  };

  const handleSelect = (id) => {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  };

  useEffect(() => {
    setFilteredRows([]);
    setTotals({});
    setSearchQuery("");
    setSelectedCheckStatus("ALL");
  }, [active]);

  useEffect(() => {
    setActive(getDefaultId(location.pathname));
  }, [location.pathname]);

  // انجام جستجو و فیلتر روی داده‌ها بر اساس تب فعال
  const handleSearch = useCallback(() => {
    const fromVal = dateFrom ? dateToNum(dateFrom) : 0;
    const toVal = dateTo ? dateToNum(dateTo) : 99999999;
    const q = searchQuery.trim().toLowerCase();

    if (active === "receipts") {
      const result = checks
        .filter((chk) => chk.check_type === "receipt")
        .filter((chk) => {
          const dateVal = dateToNum(chk.issue_date);
          if (dateVal < fromVal || dateVal > toVal) return false;
          if (q) {
            return (
              chk.check_number?.toLowerCase().includes(q) ||
              chk.payee?.toLowerCase().includes(q) ||
              chk.description?.toLowerCase().includes(q)
            );
          }
          return true;
        });
      setFilteredRows(result);
      setTotals({ amount: result.reduce((s, r) => s + (r.amount ?? 0), 0) });
    } 

    else if (active === "payments") {
      const result = checks
        .filter((chk) => chk.check_type === "payment")
        .filter((chk) => {
          const dateVal = dateToNum(chk.issue_date);
          if (dateVal < fromVal || dateVal > toVal) return false;
          if (q) {
            return (
              chk.check_number?.toLowerCase().includes(q) ||
              chk.payee?.toLowerCase().includes(q) ||
              chk.description?.toLowerCase().includes(q)
            );
          }
          return true;
        });
      setFilteredRows(result);
      setTotals({ amount: result.reduce((s, r) => s + (r.amount ?? 0), 0) });
    } 

    else if (active === "cash-turnover" || active === "bank-turnover") {
      const rows = [];
      let runningBalance = 0;

      documents.forEach((doc) => {
        if (doc.status === "CANCELLED") return;
        const docDateVal = dateToNum(doc.document_date);
        if (docDateVal < fromVal || docDateVal > toVal) return;

        (doc.lines ?? []).forEach((line) => {
          const accCode = line.account_code ?? "";
          const accName = line.account_name ?? "";
          
          const isCash = active === "cash-turnover" && (accName.includes("صندوق") || accCode === "11001");
          const isBank = active === "bank-turnover" && (accName.includes("بانک") || accCode === "11002" || accCode.startsWith("110"));

          if (!isCash && !isBank) return;

          const debit = line.debit ?? 0;
          const credit = line.credit ?? 0;
          runningBalance += debit - credit;

          if (q && !doc.document_number?.toLowerCase().includes(q) && !doc.description?.toLowerCase().includes(q)) return;

          rows.push({
            id: `${doc._id}-${accCode}-${debit}-${credit}`,
            docDate: doc.document_date || "—",
            docNumber: doc.document_number,
            docDesc: line.description || doc.description || "—",
            debit,
            credit,
            balance: runningBalance,
          });
        });
      });
      setFilteredRows(rows);
      setTotals({
        debit: rows.reduce((s, r) => s + r.debit, 0),
        credit: rows.reduce((s, r) => s + r.credit, 0)
      });
    } 

    else if (active === "bank-reconcile") {
      const rows = [];
      documents.forEach((doc) => {
        if (doc.status === "CANCELLED") return;
        const docDateVal = dateToNum(doc.document_date);
        if (docDateVal < fromVal || docDateVal > toVal) return;

        (doc.lines ?? []).forEach((line) => {
          const accCode = line.account_code ?? "";
          const accName = line.account_name ?? "";
          if (!accName.includes("بانک") && !accCode.startsWith("110")) return;

          if (q && !doc.document_number?.toLowerCase().includes(q) && !doc.description?.toLowerCase().includes(q)) return;

          const debit = line.debit ?? 0;
          const credit = line.credit ?? 0;
          const hasStatement = (parseInt(doc.document_number?.replace(/\D/g, ""), 10) ?? 0) % 2 === 0;

          rows.push({
            id: `${doc._id}-${accCode}-${debit}-${credit}`,
            docDate: doc.document_date || "—",
            docNumber: doc.document_number,
            docDesc: line.description || doc.description || "—",
            debit,
            credit,
            statementDebit: hasStatement ? debit : 0,
            statementCredit: hasStatement ? credit : 0,
            reconciled: hasStatement ? "Reconciled" : "Unreconciled"
          });
        });
      });
      setFilteredRows(rows);
      setTotals({
        debit: rows.reduce((s, r) => s + r.debit, 0),
        credit: rows.reduce((s, r) => s + r.credit, 0),
        stmtDebit: rows.reduce((s, r) => s + r.statementDebit, 0),
        stmtCredit: rows.reduce((s, r) => s + r.statementCredit, 0),
      });
    } 

    else if (active === "checks") {
      let result = checks;
      if (selectedCheckStatus && selectedCheckStatus !== "ALL") {
        result = result.filter(chk => chk.status === selectedCheckStatus);
      }
      result = result.filter((chk) => {
        const dateVal = dateToNum(chk.issue_date);
        if (dateVal < fromVal || dateVal > toVal) return false;
        if (q) {
          return (
            chk.check_number?.toLowerCase().includes(q) ||
            chk.payee?.toLowerCase().includes(q) ||
            chk.description?.toLowerCase().includes(q)
          );
        }
        return true;
      });
      setFilteredRows(result);
      setTotals({ amount: result.reduce((s, r) => s + (r.amount ?? 0), 0) });
    }
  }, [documents, checks, active, dateFrom, dateTo, searchQuery, selectedCheckStatus]);

  useEffect(() => {
    if (checks.length > 0 || documents.length > 0) {
      handleSearch();
    }
  }, [checks, documents, handleSearch]);

  const reportTitle = useMemo(() => {
    if (active === "receipts") return `گزارش دریافت‌ها — از ${dateFrom} تا ${dateTo}`;
    if (active === "payments") return `گزارش پرداخت‌ها — از ${dateFrom} تا ${dateTo}`;
    if (active === "cash-turnover") return `گردش صندوق — از ${dateFrom} تا ${dateTo}`;
    if (active === "bank-turnover") return `گردش بانک — از ${dateFrom} تا ${dateTo}`;
    if (active === "bank-reconcile") return `گزارش مغایرت بانکی — از ${dateFrom} تا ${dateTo}`;
    if (active === "checks") return `گزارش وضعیت چک‌ها — از ${dateFrom} تا ${dateTo}`;
    return "گزارش‌های دریافت و پرداخت";
  }, [active, dateFrom, dateTo]);

  const handlePrint = () => {
    printTable("#payments-report-table", reportTitle);
  };

  const handleExcelExport = () => {
    if (!filteredRows || filteredRows.length === 0) return;

    let headers = [];
    let csvRows = [];

    if (active === "receipts" || active === "payments") {
      headers = ["شماره چک", "تاریخ صدور", "تاریخ سررسید", active === "receipts" ? "پرداخت‌کننده" : "دریافت‌کننده", "مبلغ (ریال)", "بانک صادرکننده", "وضعیت"];
      csvRows = filteredRows.map(chk => [
        chk.check_number,
        chk.issue_date,
        chk.due_date || "—",
        chk.payee || "—",
        chk.amount,
        chk.bank_name || "—",
        CHECK_STATUS_LABELS[chk.status] ?? chk.status
      ]);
    } else if (active === "cash-turnover" || active === "bank-turnover") {
      headers = ["تاریخ", "شماره سند", "شرح", "بدهکار (ورود)", "بستانکار (خروج)", "مانده"];
      csvRows = filteredRows.map(r => [
        r.docDate,
        r.docNumber,
        r.docDesc,
        r.debit,
        r.credit,
        r.balance
      ]);
    } else if (active === "bank-reconcile") {
      headers = ["تاریخ", "شماره سند", "شرح", "بدهکار (دفتر)", "بستانکار (دفتر)", "بدهکار (بانک)", "بستانکار (بانک)", "وضعیت مغایرت"];
      csvRows = filteredRows.map(r => [
        r.docDate,
        r.docNumber,
        r.docDesc,
        r.debit,
        r.credit,
        r.statementDebit,
        r.statementCredit,
        r.reconciled === "Reconciled" ? "مطابقت دارد" : "مغایرت دارد"
      ]);
    } else if (active === "checks") {
      headers = ["شماره چک", "نوع چک", "تاریخ صدور", "تاریخ سررسید", "طرف حساب", "مبلغ", "وضعیت"];
      csvRows = filteredRows.map(chk => [
        chk.check_number,
        chk.check_type === "payment" ? "پرداختی" : "دریافتی",
        chk.issue_date,
        chk.due_date || "—",
        chk.payee || "—",
        chk.amount,
        CHECK_STATUS_LABELS[chk.status] ?? chk.status
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
        title="گزارش‌های دریافت و پرداخت"
        description="دریافت‌ها، پرداخت‌ها، گردش صندوق، گردش بانک، مغایرت بانکی و وضعیت چک‌ها"
      >
        {filteredRows.length > 0 && !loading && (
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
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-5">
              {/* بخش فیلترها */}
              <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 items-end rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                  <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                  <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-xs text-muted-foreground font-medium">
                    {active === "checks" ? "شماره چک" : "شرح / طرف حساب"}
                  </label>
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجو..." className="h-8 text-xs" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                    <Search className="h-4 w-4 ml-1" /> نمایش
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* فیلتر وضعیت چک */}
              {active === "checks" && (
                <div dir="rtl" className="mb-4 flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-xs text-muted-foreground font-medium">وضعیت چک:</span>
                  {CHECK_STATUSES.map((s) => (
                    <Badge
                      key={s.value}
                      variant="outline"
                      onClick={() => setSelectedCheckStatus(s.value)}
                      className={cn(
                        "cursor-pointer text-[10px] py-0.5 px-2.5 transition-all border",
                        selectedCheckStatus === s.value
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : cn("bg-background text-foreground/75 hover:bg-muted", s.cls)
                      )}
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* لودینگ */}
              {loading && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm">در حال بارگذاری اطلاعات...</p>
                </div>
              )}

              {/* جدول نتایج */}
              {!loading && filteredRows !== null && (
                <div className="overflow-x-auto border rounded-xl bg-background" id="payments-report-table">
                  {/* گزارش دریافت‌ها و پرداخت‌ها */}
                  {(active === "receipts" || active === "payments") && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-32 font-bold font-mono">شماره چک</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">تاریخ صدور</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">تاریخ سررسید</th>
                          <th className="px-3 py-2.5 min-w-[150px] font-bold">{active === "receipts" ? "پرداخت‌کننده" : "دریافت‌کننده"}</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مبلغ چک (ریال)</th>
                          <th className="px-3 py-2.5 min-w-[120px] font-bold">بانک صادرکننده</th>
                          <th className="px-3 py-2.5 w-28 text-center font-bold">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-16 text-center text-muted-foreground font-semibold">چکی با این مشخصات یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((chk, idx) => (
                            <tr key={chk._id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{toPersianDigits(chk.check_number)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(chk.issue_date)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(chk.due_date) || "—"}</td>
                              <td className="px-3 py-2.5 font-medium">{chk.payee || "—"}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-800">{fmtNum(chk.amount)}</td>
                              <td className="px-3 py-2.5 font-medium text-slate-700">{chk.bank_name || "—"}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  CHECK_STATUS_COLORS[chk.status] ?? "bg-muted text-muted-foreground")}>
                                  {CHECK_STATUS_LABELS[chk.status] ?? chk.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={5}>جمع کل چک‌ها</td>
                            <td className="px-3 py-2.5 text-center font-mono text-emerald-800">{fmtNum(totals.amount)}</td>
                            <td className="px-3 py-2.5" colSpan={2}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* گردش صندوق و گردش بانک */}
                  {(active === "cash-turnover" || active === "bank-turnover") && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-24 text-center font-bold font-mono">تاریخ</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">شماره سند</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold">شرح ردیف</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">بدهکار (ورود)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">بستانکار (خروج)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مانده</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-muted-foreground font-semibold">تراکنشی در این بازه یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr key={row.id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.docDate)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-medium">{toPersianDigits(row.docNumber)}</td>
                              <td className="px-3 py-2.5 font-medium">{row.docDesc}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold">{fmtNum(Math.abs(row.balance))} {row.balance > 0 ? "بد" : row.balance < 0 ? "بس" : ""}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={4}>جمع گردش دوره</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-foreground">{filteredRows.length > 0 && fmtNum(Math.abs(filteredRows[filteredRows.length - 1].balance))}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* مغایرت بانکی */}
                  {active === "bank-reconcile" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-24 text-center font-bold font-mono">تاریخ</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">شماره سند</th>
                          <th className="px-3 py-2.5 min-w-[150px] font-bold">شرح سند</th>
                          <th className="px-3 py-2.5 w-28 text-center font-bold">بدهکار (دفتر)</th>
                          <th className="px-3 py-2.5 w-28 text-center font-bold">بستانکار (دفتر)</th>
                          <th className="px-3 py-2.5 w-28 text-center font-bold">بدهکار (بانک)</th>
                          <th className="px-3 py-2.5 w-28 text-center font-bold">بستانکار (بانک)</th>
                          <th className="px-3 py-2.5 w-24 text-center font-bold">وضعیت مغایرت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-16 text-center text-muted-foreground font-semibold">تراکنشی یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr key={row.id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.docDate)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-medium">{toPersianDigits(row.docNumber)}</td>
                              <td className="px-3 py-2.5 font-medium">{row.docDesc}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-600">{fmtNum(row.statementDebit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-600">{fmtNum(row.statementCredit)}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border",
                                  row.reconciled === "Reconciled"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                )}>
                                  {row.reconciled === "Reconciled" ? "تطبیق دارد" : "عدم تطبیق"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={4}>جمع کل</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-600">{fmtNum(totals.stmtDebit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-600">{fmtNum(totals.stmtCredit)}</td>
                            <td className="px-3 py-2.5"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* وضعیت چک‌ها */}
                  {active === "checks" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-32 font-bold font-mono">شماره چک</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">نوع چک</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">تاریخ صدور</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">تاریخ سررسید</th>
                          <th className="px-3 py-2.5 min-w-[150px] font-bold">طرف حساب / پرداخت‌کننده</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مبلغ چک (ریال)</th>
                          <th className="px-3 py-2.5 w-28 text-center font-bold">وضعیت چک</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-16 text-center text-muted-foreground font-semibold">چکی یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((chk, idx) => (
                            <tr key={chk._id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{toPersianDigits(chk.check_number)}</td>
                              <td className="px-3 py-2.5 text-center font-medium">
                                <Badge variant="outline" className={cn(chk.check_type === "payment" ? "text-rose-700 border-rose-200 bg-rose-50" : "text-emerald-700 border-emerald-200 bg-emerald-50")}>
                                  {chk.check_type === "payment" ? "پرداختی" : "دریافتی"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(chk.issue_date)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(chk.due_date) || "—"}</td>
                              <td className="px-3 py-2.5 font-medium">{chk.payee || "—"}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-800">{fmtNum(chk.amount)}</td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  CHECK_STATUS_COLORS[chk.status] ?? "bg-muted text-muted-foreground")}>
                                  {CHECK_STATUS_LABELS[chk.status] ?? chk.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={6}>جمع کل مبالغ چک‌ها</td>
                            <td className="px-3 py-2.5 text-center font-mono text-emerald-800">{fmtNum(totals.amount)}</td>
                            <td className="px-3 py-2.5"></td>
                          </tr>
                        </tfoot>
                      )}
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
