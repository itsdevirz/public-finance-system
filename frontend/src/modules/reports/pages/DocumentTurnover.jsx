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

// ─── ثوابت فیلترها ───────────────────────────────────────────────────────────
const TURNOVER_TYPE_OPTIONS = [
  { value: "ALL", label: "همه" },
  { value: "تایید سند", label: "تایید سند" },
  { value: "قطعی کردن", label: "قطعی کردن" },
  { value: "حذف سند", label: "حذف سند" },
];

const DETAIL_OPTIONS = [
  { value: "ALL", label: "همه" },
];

// MOCK_ROWS removed for clean database-only rendering

function dateToNum(d) {
  if (!d) return 0;
  return parseInt(d.replace(/\D/g, ""), 10) || 0;
}

export default function DocumentTurnover() {
  // ── فیلترها ──
  const [dateFrom, setDateFrom] = useState("۱۴۰۳/۰۱/۰۱");
  const [dateTo, setDateTo] = useState("۱۴۰۳/۱۲/۲۹");
  const [docNumFrom, setDocNumFrom] = useState("");
  const [docNumTo, setDocNumTo] = useState("");
  const [docType, setDocType] = useState("ALL");
  const [turnoverType, setTurnoverType] = useState("ALL");
  const [creatorUser, setCreatorUser] = useState("ALL");
  const [detailUser, setDetailUser] = useState("ALL");

  // ── داده‌ها ──
  const [documents, setDocuments] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ── گزینه‌ها ──
  const [creatorOpts, setCreatorOpts] = useState([{ value: "ALL", label: "همه" }]);
  const [docTypeOpts, setDocTypeOpts] = useState([{ value: "ALL", label: "همه" }]);

  // بارگذاری اسناد و مشخصات فیلترها
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/documents");
      const list = res.data?.data ?? [];
      setDocuments(list);

      // استخراج گزینه‌های یکتا برای کاربران ثبت‌کننده و نوع سند
      const creators = new Set();
      const types = new Set();

      list.forEach((doc) => {
        if (doc.creator) creators.add(doc.creator);
        if (doc.document_type) types.add(doc.document_type);
      });

      setCreatorOpts([
        { value: "ALL", label: "همه" },
        ...Array.from(creators).map((c) => ({ value: c, label: c })),
      ]);

      setDocTypeOpts([
        { value: "ALL", label: "همه" },
        ...Array.from(types).map((t) => ({ value: t, label: t })),
      ]);
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // جستجو و فیلتر
  const handleSearch = useCallback(() => {
    if (documents.length === 0) {
      setFilteredRows([]);
      setCurrentPage(1);
      return;
    }

    const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
    const toNum = dateTo ? dateToNum(dateTo) : 99999999;

    const rows = [];
    let idx = 1;

    documents.forEach((doc) => {
      const docDateVal = dateToNum(doc.document_date);
      if (docDateVal < fromNum || docDateVal > toNum) return;

      const docNumVal = parseInt(doc.document_number?.replace(/\D/g, ""), 10) || 0;
      if (docNumFrom && docNumVal < parseInt(docNumFrom, 10)) return;
      if (docNumTo && docNumVal > parseInt(docNumTo, 10)) return;

      if (docType !== "ALL" && doc.document_type !== docType) return;
      if (creatorUser !== "ALL" && doc.creator !== creatorUser) return;

      // شبیه‌سازی مراحل گردش سند واقعی بر اساس وضعیت فعلی آن
      const baseRow = {
        docNumber: doc.document_number || "—",
        docDate: doc.document_date || "—",
        docDesc: doc.description || "—",
        creator: doc.creator || "سیستم",
        changeUser: doc.creator || "سیستم",
      };

      // مرحله اول: ثبت موقت
      rows.push({
        id: `${doc._id}-step1`,
        ...baseRow,
        oldStatus: "ثبت نشده",
        newStatus: "موقت",
        changeDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("fa-IR") : doc.document_date,
        turnoverType: "ثبت اولیه",
        turnoverDesc: "ثبت سند به صورت پیش‌نویس",
      });

      // مرحله دوم: تایید شده
      if (doc.status === "APPROVED" || doc.status === "POSTED") {
        rows.push({
          id: `${doc._id}-step2`,
          ...baseRow,
          oldStatus: "موقت",
          newStatus: "تایید شده",
          changeDate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("fa-IR") : doc.document_date,
          turnoverType: "تایید سند",
          turnoverDesc: "تایید و ارسال به مدیر مالی",
        });
      }

      // مرحله سوم: قطعی
      if (doc.status === "POSTED") {
        rows.push({
          id: `${doc._id}-step3`,
          ...baseRow,
          oldStatus: "تایید شده",
          newStatus: "قطعی",
          changeDate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("fa-IR") : doc.document_date,
          turnoverType: "قطعی کردن",
          turnoverDesc: "ثبت قطعی در دفاتر مالی",
        });
      }

      // مرحله چهارم: حذف/لغو
      if (doc.status === "CANCELLED") {
        rows.push({
          id: `${doc._id}-step4`,
          ...baseRow,
          oldStatus: "موقت",
          newStatus: "حذف شده",
          changeDate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("fa-IR") : doc.document_date,
          turnoverType: "حذف سند",
          turnoverDesc: "لغو سند به دلیل اصلاحات",
        });
      }
    });

    // اعمال فیلتر نوع گردش روی داده‌های شبیه‌سازی شده
    let finalRows = rows;
    if (turnoverType !== "ALL") {
      finalRows = finalRows.filter((r) => r.turnoverType === turnoverType);
    }

    // بازنویسی ردیف‌ها
    finalRows = finalRows.map((r, i) => ({ ...r, idIndex: i + 1 }));

    setFilteredRows(finalRows);
    setCurrentPage(1);
  }, [documents, dateFrom, dateTo, docNumFrom, docNumTo, docType, turnoverType, creatorUser]);

  const handleReset = () => {
    setDateFrom("۱۴۰۳/۰۱/۰۱");
    setDateTo("۱۴۰۳/۱۲/۲۹");
    setDocNumFrom("");
    setDocNumTo("");
    setDocType("ALL");
    setTurnoverType("ALL");
    setCreatorUser("ALL");
    setDetailUser("ALL");
    setFilteredRows([]);
    setCurrentPage(1);
  };

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [
        ["ردیف", "شماره سند", "تاریخ سند", "شرح سند", "ثبت کننده", "وضعیت قبلی", "وضعیت جدید", "تاریخ تغییر وضعیت", "کاربر تغییر دهنده", "نوع گردش", "شرح گردش"].join(","),
        ...filteredRows.map((r, idx) => [
          r.idIndex ?? (idx + 1), r.docNumber, r.docDate, r.docDesc, r.creator, r.oldStatus, r.newStatus, r.changeDate, r.changeUser, r.turnoverType, r.turnoverDesc
        ].join(","))
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "گردش_اسناد.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تابع کمکی برای استایل پِل وضعیت‌ها
  const getStatusBadge = (status) => {
    switch (status) {
      case "موقت":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">موقت</span>;
      case "تایید شده":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">تایید شده</span>;
      case "قطعی":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-100 text-green-800 border border-green-200">قطعی</span>;
      case "حذف شده":
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">حذف شده</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span>گزارش‌ها</span>
        <ChevronLeft className="h-3 w-3 shrink-0" />
        <span>گزارش‌های اسناد حسابداری</span>
        <ChevronLeft className="h-3 w-3 shrink-0" />
        <span className="text-primary font-semibold">گردش اسناد</span>
      </div>

      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground">گردش اسناد</h1>
        </div>
      </div>

      {/* ─── فیلترها ─── */}
      <Card className="mb-5 shadow-sm border border-border/80">
        <CardContent className="p-4" dir="rtl">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            
            {/* دکمه‌های فیلتر در سمت چپ */}
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

            {/* گرید ۳ ستونه فیلترها */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
              
              {/* ستون اول: از تاریخ، شماره سند از، نوع سند، ثبت کننده */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-28 text-right text-xs font-semibold text-foreground/80 shrink-0">از تاریخ :</Label>
                  <div className="flex-1">
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-28 text-right text-xs font-semibold text-foreground/80 shrink-0">شماره سند از :</Label>
                  <div className="flex-1">
                    <Input value={docNumFrom} onChange={(e) => setDocNumFrom(e.target.value)} placeholder="شماره سند..." className="h-9 text-xs" dir="ltr" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-28 text-right text-xs font-semibold text-foreground/80 shrink-0">نوع سند :</Label>
                  <div className="flex-1">
                    <select value={docType} onChange={(e) => setDocType(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {docTypeOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-28 text-right text-xs font-semibold text-foreground/80 shrink-0">ثبت کننده :</Label>
                  <div className="flex-1">
                    <select value={creatorUser} onChange={(e) => setCreatorUser(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {creatorOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ستون دوم: تا تاریخ، شماره سند تا، نوع گردش سند، تفصیلی */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">تا تاریخ :</Label>
                  <div className="flex-1">
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">شماره سند تا :</Label>
                  <div className="flex-1">
                    <Input value={docNumTo} onChange={(e) => setDocNumTo(e.target.value)} placeholder="شماره سند..." className="h-9 text-xs" dir="ltr" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">نوع گردش سند :</Label>
                  <div className="flex-1">
                    <select value={turnoverType} onChange={(e) => setTurnoverType(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {TURNOVER_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">تفصیلی :</Label>
                  <div className="flex-1">
                    <select value={detailUser} onChange={(e) => setDetailUser(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {DETAIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ستون سوم: تا تاریخ در بالا (برای توازن فاصله چپ گرید) */}
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
            خروجی اکسل
          </Button>
          <Button onClick={() => printTable("#turnover-table", "گردش اسناد")} variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
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

      {/* ─── جدول داده‌ها ─── */}
      <Card className="border border-border/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto" id="turnover-table">
            <table className="w-full text-xs text-right" dir="rtl">
              <thead>
                {/* هدر لایه اول */}
                <tr className="bg-[#0e305d] text-white border-b border-border">
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-16 border-l border-white/10 whitespace-nowrap">ردیف</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-32 border-l border-white/10 whitespace-nowrap">شماره سند</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-28 border-l border-white/10 whitespace-nowrap">تاریخ سند</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-right border-l border-white/10 min-w-[180px]">شرح سند</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-28 border-l border-white/10 whitespace-nowrap">ثبت کننده</th>
                  <th colSpan={2} className="px-3 py-2 font-bold text-center border-l border-white/10">وضعیت سند</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-36 border-l border-white/10 whitespace-nowrap">تاریخ تغییر وضعیت</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-32 border-l border-white/10 whitespace-nowrap">کاربر تغییر دهنده</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-32 border-l border-white/10 whitespace-nowrap">نوع گردش</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-44 whitespace-nowrap">شرح گردش</th>
                </tr>
                {/* هدر لایه دوم */}
                <tr className="bg-[#0b284e] text-white/95 border-b border-border">
                  <th className="px-3 py-2 font-semibold text-center w-24 border-l border-white/10">قبلی</th>
                  <th className="px-3 py-2 font-semibold text-center w-24 border-l border-white/10">جدید</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-20 text-center text-muted-foreground text-sm font-semibold">
                      در حال بارگذاری اطلاعات...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-20 text-center text-muted-foreground text-sm font-semibold">
                      ردیفی یافت نشد. فیلترها را تغییر داده و مجدداً تلاش کنید.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={row.id ?? idx} className={cn("border-b hover:bg-primary/[0.04] transition-colors", idx % 2 === 1 && "bg-muted/10")}>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-muted-foreground border-l">
                        {row.idIndex ?? row.id}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-600 hover:underline cursor-pointer border-l">
                        {row.docNumber}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-muted-foreground/80 border-l">
                        {row.docDate}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-foreground border-l">
                        {row.docDesc}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-foreground/80 border-l">
                        {row.creator}
                      </td>
                      <td className="px-3 py-2.5 text-center border-l whitespace-nowrap">
                        {getStatusBadge(row.oldStatus)}
                      </td>
                      <td className="px-3 py-2.5 text-center border-l whitespace-nowrap">
                        {getStatusBadge(row.newStatus)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-muted-foreground border-l">
                        {row.changeDate}
                      </td>
                      <td className="px-3 py-2.5 text-center font-medium text-foreground/80 border-l">
                        {row.changeUser}
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-[#004b93] border-l">
                        {row.turnoverType}
                      </td>
                      <td className="px-3 py-2.5 text-center text-foreground/80 font-medium">
                        {row.turnoverDesc}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
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
