import { useState, useEffect, useCallback, useMemo } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Search, RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft,
  Settings, Eye, FileSpreadsheet, Printer, Download, ChevronDown
} from "lucide-react";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { cn } from "@/lib/utils";

// وارد کردن اطلاعات سرفصل‌ها مستقیماً از فایل JSON فرانت‌اند
import sanamaCodes from "@/data/sanamaCodes.json";

// ─── استخراج سرفصل‌های معین از فایل sanamaCodes ──────────────────────────────
const ALL_MOEIN_ACCTS = [];
const MOEIN_MAP = {}; // code -> title

sanamaCodes.groups.forEach((group) => {
  (group.accounts ?? []).forEach((acc) => {
    (acc.children ?? []).forEach((child) => {
      const item = { value: child.code, label: `${child.code} — ${child.title}`, title: child.title };
      ALL_MOEIN_ACCTS.push(item);
      MOEIN_MAP[child.code] = child.title;
    });
  });
});

// ─── ثوابت فیلترها ───────────────────────────────────────────────────────────
const TEMPORARY_DOC_OPTIONS = [
  { value: "خیر", label: "خیر" },
  { value: "بله", label: "بله" },
];

const ZERO_DOC_OPTIONS = [
  { value: "خیر", label: "خیر" },
  { value: "با جزئیات", label: "با جزئیات" },
  { value: "بله", label: "بله" },
];

const COST_CENTER_OPTIONS = [
  { value: "ALL", label: "همه" },
  { value: "اداری", label: "اداری" },
  { value: "بازرگانی", label: "بازرگانی" },
  { value: "فروش", label: "فروش" },
  { value: "تولید", label: "تولید" },
];

const PROJECT_OPTIONS = [
  { value: "ALL", label: "همه" },
];

// MOCK_ROWS removed for clean database-only data loading

function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function dateToNum(d) {
  if (!d) return 0;
  return parseInt(d.replace(/\D/g, ""), 10) || 0;
}

export default function MoeinLedger() {
  // ── فیلترها ──
  const [moeinAcc, setMoeinAcc] = useState("112"); // به طور پیش‌فرض حساب معین روی 112 تصویر ست شده
  const [detailAcc, setDetailAcc] = useState("ALL");
  const [costCenter, setCostCenter] = useState("ALL");
  const [project, setProject] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("۱۴۰۳/۰۱/۰۱");
  const [dateTo, setDateTo] = useState("۱۴۰۳/۱۲/۲۹");
  const [docNumTo, setDocNumTo] = useState("");
  const [showTemporary, setShowTemporary] = useState("خیر");
  const [showZeroDocs, setShowZeroDocs] = useState("خیر");

  // ── گزینه‌ها ──
  const moeinAccOpts = useMemo(() => {
    return [{ value: "ALL", label: "همه" }, ...ALL_MOEIN_ACCTS];
  }, []);

  const [detailAccOpts, setDetailAccOpts] = useState([{ value: "ALL", label: "همه" }]);

  // ── داده‌ها ──
  const [documents, setDocuments] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // بارگذاری حساب‌های تفصیلی (اشخاص)
  useEffect(() => {
    api.get("/api/persons").then((res) => {
      const list = (res.data?.data ?? res.data ?? []).map((p) => ({
        value: p.nomineeCode,
        label: `${p.nomineeCode} — ${p.title || [p.firstName, p.lastName].filter(Boolean).join(" ")}`,
      }));
      setDetailAccOpts([{ value: "ALL", label: "همه" }, ...list]);
    }).catch(() => {});
  }, []);

  // بارگذاری اسناد
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/documents");
      setDocuments(res.data?.data ?? []);
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // انجام جستجو و فیلتر
  const handleSearch = useCallback(() => {
    if (documents.length === 0) {
      setFilteredRows([]);
      setCurrentPage(1);
      return;
    }

    const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
    const toNum = dateTo ? dateToNum(dateTo) : 99999999;

    const rows = [];
    let runningBalance = 0;

    documents.forEach((doc) => {
      if (doc.status === "CANCELLED") return;
      if (showTemporary === "خیر" && doc.status === "DRAFT") return;

      const docDateVal = dateToNum(doc.document_date);
      if (docDateVal < fromNum || docDateVal > toVal) return;

      const docNumVal = parseInt(doc.document_number?.replace(/\D/g, ""), 10) || 0;
      if (docNumTo && docNumVal > parseInt(docNumTo, 10)) return;

      (doc.lines ?? []).forEach((line) => {
        const accCode = line.account_code ?? "";
        if (moeinAcc !== "ALL" && !accCode.startsWith(moeinAcc)) return;

        // فیلتر تفصیلی
        if (detailAcc !== "ALL" && !accCode.includes(detailAcc)) return;

        const debit = line.debit ?? 0;
        const credit = line.credit ?? 0;
        runningBalance += debit - credit;

        rows.push({
          id: `${doc._id}-${accCode}-${debit}-${credit}`,
          docDate: doc.document_date || "—",
          docNumber: doc.document_number,
          docDesc: line.description || doc.description || "—",
          detailCode: accCode,
          detailDesc: line.account_name ?? "—",
          debit,
          credit,
          balance: Math.abs(runningBalance),
        });
      });
    });

    setFilteredRows(rows);
    setCurrentPage(1);
  }, [documents, dateFrom, dateTo, moeinAcc, detailAcc, docNumTo, showTemporary]);

  const handleReset = () => {
    setMoeinAcc("112");
    setDetailAcc("ALL");
    setCostCenter("ALL");
    setProject("ALL");
    setDateFrom("۱۴۰۳/۰۱/۰۱");
    setDateTo("۱۴۰۳/۱۲/۲۹");
    setDocNumTo("");
    setShowTemporary("خیر");
    setShowZeroDocs("خیر");
    setFilteredRows([]);
    setCurrentPage(1);
  };

  // محاسبات جمع
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        debit: acc.debit + (r.debit ?? 0),
        credit: acc.credit + (r.credit ?? 0),
      }),
      { debit: 0, credit: 0 }
    );
  }, [filteredRows]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const selectedMoeinTitle = MOEIN_MAP[moeinAcc] || "حسابهای دریافتنی تجاری";

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [
        ["تاریخ سند", "شماره سند", "شرح سند", "کد حساب تفصیلی", "شرح تفصیلی", "بدهکار", "بستانکار", "مانده"].join(","),
        ...filteredRows.map(r => [
          r.docDate, r.docNumber, r.docDesc, r.detailCode, r.detailDesc, r.debit, r.credit, r.balance
        ].join(","))
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "دفتر_معین.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span>گزارش‌ها</span>
        <ChevronLeft className="h-3 w-3 shrink-0" />
        <span>گزارش‌های اسناد حسابداری</span>
        <ChevronLeft className="h-3 w-3 shrink-0" />
        <span className="text-primary font-semibold">دفتر معین</span>
      </div>

      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground">دفتر معین</h1>
        </div>
      </div>

      {/* ─── فیلترها ─── */}
      <Card className="mb-5 shadow-sm border border-border/80">
        <CardContent className="p-4" dir="rtl">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            
            {/* دکمه‌های سمت چپ فیلتر */}
            <div className="flex flex-col gap-2 w-full lg:w-44 shrink-0 justify-start">
              <Button onClick={handleSearch} className="w-full bg-[#004b93] hover:bg-[#003d79] text-white flex items-center justify-center gap-2 h-9 text-xs font-semibold rounded-lg shadow-sm">
                <Search className="h-4 w-4" />
                جستجو
              </Button>
              <Button onClick={handleReset} variant="outline" className="w-full bg-white hover:bg-muted text-foreground flex items-center justify-center gap-2 h-9 text-xs font-semibold rounded-lg border shadow-sm">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                پاک کردن
              </Button>
              <Button variant="outline" className="w-full bg-white hover:bg-muted text-foreground flex items-center justify-between gap-2 h-9 text-xs font-semibold rounded-lg border shadow-sm px-3">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  جستجوی پیشرفته
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </div>

            {/* بخش گرید ورودی‌ها */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
              
              {/* ستون اول: حساب معین، تفصیلی، مرکز هزینه، پروژه */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">حساب معین :</Label>
                  <div className="flex-1">
                    <SearchableSelect value={moeinAcc} onChange={setMoeinAcc} options={moeinAccOpts} placeholder="همه" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">حساب تفصیلی :</Label>
                  <div className="flex-1">
                    <SearchableSelect value={detailAcc} onChange={setDetailAcc} options={detailAccOpts} placeholder="همه" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">مرکز هزینه :</Label>
                  <div className="flex-1">
                    <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {COST_CENTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">پروژه :</Label>
                  <div className="flex-1">
                    <select value={project} onChange={(e) => setProject(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {PROJECT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ستون دوم: تاریخ شروع، تا سند، نمایش موقت، نمایش صفر */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">از تاریخ :</Label>
                  <div className="flex-1">
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">تا سند :</Label>
                  <div className="flex-1">
                    <Input value={docNumTo} onChange={(e) => setDocNumTo(e.target.value)} placeholder="شماره سند..." className="h-9 text-xs" dir="ltr" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">نمایش اسناد موقت :</Label>
                  <div className="flex-1">
                    <select value={showTemporary} onChange={(e) => setShowTemporary(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {TEMPORARY_DOC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">نمایش اسناد صفر :</Label>
                  <div className="flex-1">
                    <select value={showZeroDocs} onChange={(e) => setShowZeroDocs(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {ZERO_DOC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ستون سوم: تا تاریخ در بالا */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">تا تاریخ :</Label>
                  <div className="flex-1">
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-9" />
                  </div>
                </div>
              </div>

            </div>

          </div>
        </CardContent>
      </Card>

      {/* ─── دکمه‌های بالای جدول ─── */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2" dir="rtl">
        <div>
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
            <Eye className="h-3.5 w-3.5" />
            مشاهده سند
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
            <Settings className="h-3.5 w-3.5" />
            تنظیم ستون‌ها
          </Button>
          <Button onClick={exportExcel} variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            اکسل
          </Button>
          <Button onClick={() => printTable("#moein-table", "دفتر معین")} variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
            <Printer className="h-3.5 w-3.5" />
            چاپ
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
            <Download className="h-3.5 w-3.5" />
            خروجی
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* ─── هدر کد و عنوان معین بالای جدول ─── */}
      <div className="bg-[#eef5fc] border border-blue-200/50 p-2.5 rounded-xl flex items-center justify-start gap-4 text-xs font-semibold mb-3 text-[#0e305d]" dir="rtl">
        <span className="text-muted-foreground">کد حساب عنوان معین :</span>
        <span className="font-mono font-bold text-foreground bg-white border px-2 py-0.5 rounded shadow-sm">{moeinAcc}</span>
        <span className="font-bold text-foreground bg-white border px-3 py-0.5 rounded shadow-sm">{selectedMoeinTitle}</span>
      </div>

      {/* ─── جدول داده‌ها ─── */}
      <Card className="border border-border/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto" id="moein-table">
            <table className="w-full text-xs text-right" dir="rtl">
              <thead>
                <tr className="bg-[#0e305d] text-white border-b border-border">
                  <th className="px-3 py-2.5 font-bold text-center w-24 border-l border-white/10 whitespace-nowrap">تاریخ سند</th>
                  <th className="px-3 py-2.5 font-bold text-center w-32 border-l border-white/10 whitespace-nowrap">شماره سند</th>
                  <th className="px-3 py-2.5 font-bold text-right border-l border-white/10 min-w-[200px]">شرح سند</th>
                  <th className="px-3 py-2.5 font-bold text-center w-28 border-l border-white/10 whitespace-nowrap">کد حساب تفصیلی</th>
                  <th className="px-3 py-2.5 font-bold text-center w-36 border-l border-white/10 whitespace-nowrap">شرح تفصیلی</th>
                  <th className="px-3 py-2.5 font-bold text-center w-28 border-l border-white/10 whitespace-nowrap">بدهکار</th>
                  <th className="px-3 py-2.5 font-bold text-center w-28 border-l border-white/10 whitespace-nowrap">بستانکار</th>
                  <th className="px-3 py-2.5 font-bold text-center w-28 whitespace-nowrap">مانده</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-muted-foreground text-sm font-semibold">
                      در حال بارگذاری اطلاعات...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-muted-foreground text-sm font-semibold">
                      ردیفی یافت نشد. فیلترها را تغییر داده و مجدداً تلاش کنید.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id ?? idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-muted-foreground/80 border-l">
                        {row.docDate}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-600 hover:underline cursor-pointer border-l">
                        {row.docNumber}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-foreground border-l">
                        {row.docDesc}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-foreground/80 border-l">
                        {row.detailCode}
                      </td>
                      <td className="px-3 py-2.5 text-center text-foreground/90 font-medium border-l">
                        {row.detailDesc}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 tabular-nums border-l">
                        {fmtNum(row.debit)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-rose-700 tabular-nums border-l">
                        {fmtNum(row.credit)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-foreground/90 tabular-nums">
                        {fmtNum(row.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* ─── ردیف جمع کل ─── */}
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="bg-[#e9f2fb] border-t border-border font-bold text-foreground">
                    <td className="px-3 py-2.5 text-center font-bold" colSpan={5}>
                      جمع کل
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700 tabular-nums border-l">
                      {fmtNum(totals.debit)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-700 tabular-nums border-l">
                      {fmtNum(totals.credit)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-foreground tabular-nums">
                      {fmtNum(filteredRows[filteredRows.length - 1]?.balance ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ─── کنترل‌های صفحه‌بندی ─── */}
          <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-border bg-muted/20 gap-3" dir="rtl">
            
            {/* راست: تعداد در صفحه و آمار رکوردهای در حال نمایش */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
              <div className="flex items-center gap-1.5">
                <span>تعداد در صفحه :</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-7 text-xs rounded border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value={5}>۵</option>
                  <option value={10}>۱۰</option>
                  <option value={20}>۲۰</option>
                  <option value={50}>۵۰</option>
                </select>
              </div>
              <div>
                نمایش {filteredRows.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} تا {Math.min(currentPage * pageSize, filteredRows.length)} از {filteredRows.length} رکورد
              </div>
            </div>

            {/* چپ: دکمه‌های ناوبری صفحه‌بندی */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7 rounded" onClick={() => setCurrentPage(1)} disabled={currentPage === 1 || loading}>
                <ChevronsLeft className="h-3.5 w-3.5 rotate-180" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 rounded" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
                  return (
                    <Button key={pageNum} onClick={() => setCurrentPage(pageNum)} variant={currentPage === pageNum ? "default" : "outline"}
                      className={cn("h-7 w-7 text-xs font-mono rounded font-semibold", currentPage === pageNum ? "bg-[#004b93] text-white hover:bg-[#003d79]" : "bg-white hover:bg-muted text-foreground")}>
                      {pageNum}
                    </Button>
                  );
                }
                if (pageNum === 2 || pageNum === totalPages - 1) {
                  return <span key={pageNum} className="px-1 text-muted-foreground text-xs font-semibold select-none">...</span>;
                }
                return null;
              })}

              <Button variant="outline" size="icon" className="h-7 w-7 rounded" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 rounded" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || loading}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
            </div>

          </div>

        </CardContent>
      </Card>
    </PageShell>
  );
}
