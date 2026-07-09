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
const ALL_GENERAL_ACCTS = [];
const MOEIN_BY_GENERAL = {}; // code کل -> لیست معین‌ها
const ALL_MOEIN_ACCTS = [];

sanamaCodes.groups.forEach((group) => {
  (group.accounts ?? []).forEach((acc) => {
    const genCode = acc.code;
    ALL_GENERAL_ACCTS.push({ value: genCode, label: `${genCode} — ${acc.title}` });
    
    const children = (acc.children ?? []).map((child) => {
      const item = { value: child.code, label: `${child.code} — ${child.title}`, parentCode: genCode };
      ALL_MOEIN_ACCTS.push(item);
      return item;
    });
    
    MOEIN_BY_GENERAL[genCode] = children;
  });
});

// تابع کمکی برای پیدا کردن نام حساب کل و معین از روی کد
const getAccountNamesFromCode = (code) => {
  if (!code) return { generalName: "—", moeinName: "—" };
  const genCode = code.substring(0, 3);
  const moeCode = code.substring(0, 5);

  let generalName = "—";
  let moeinName = "—";

  for (const group of sanamaCodes.groups ?? []) {
    for (const acc of group.accounts ?? []) {
      if (acc.code === genCode) {
        generalName = acc.title;
      }
      for (const child of acc.children ?? []) {
        if (child.code === moeCode) {
          moeinName = child.title;
        }
      }
    }
  }

  return { generalName, moeinName };
};

// ─── ثوابت فیلترها ───────────────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { value: "moein", label: "معین" },
  { value: "general", label: "حساب کل" },
  { value: "group", label: "گروه حساب" },
];

const CURRENCY_OPTIONS = [
  { value: "ریال", label: "ریال" },
  { value: "دلار", label: "دلار" },
  { value: "یورو", label: "یورو" },
];

const REPORT_TYPE_OPTIONS = [
  { value: "کلی", label: "کلی" },
  { value: "تحلیلی", label: "تحلیلی" },
];

const DOC_SHOW_OPTIONS = [
  { value: "همه", label: "همه" },
  { value: "روزانه", label: "روزانه" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "همه" },
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

const YES_NO_OPTIONS = [
  { value: "خیر", label: "خیر" },
  { value: "بله", label: "بله" },
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

export default function AccountTurnover() {
  // ── فیلترها ──
  const [generalAcc, setGeneralAcc] = useState("ALL");
  const [moeinAcc, setMoeinAcc] = useState("ALL");
  const [costCenter, setCostCenter] = useState("ALL");
  const [project, setProject] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("۱۴۰۳/۰۱/۰۱");
  const [dateTo, setDateTo] = useState("۱۴۰۳/۱۲/۲۹");
  const [displayLevel, setDisplayLevel] = useState("moein");
  const [showDetailTurnover, setShowDetailTurnover] = useState("خیر");
  const [docShowType, setDocShowType] = useState("همه");
  const [docShowLevel, setDocShowLevel] = useState("کلی");
  const [showZeroBalance, setShowZeroBalance] = useState("خیر");
  const [showSummary, setShowSummary] = useState("خیر");
  const [currencyUnit, setCurrencyUnit] = useState("ریال");
  const [reportType, setReportType] = useState("کلی");

  // ── گزینه‌ها ──
  const generalAccOpts = useMemo(() => {
    return [{ value: "ALL", label: "همه" }, ...ALL_GENERAL_ACCTS];
  }, []);

  const moeinAccOpts = useMemo(() => {
    if (!generalAcc || generalAcc === "ALL") {
      return [{ value: "ALL", label: "همه" }, ...ALL_MOEIN_ACCTS];
    }
    return [{ value: "ALL", label: "همه" }, ...(MOEIN_BY_GENERAL[generalAcc] ?? [])];
  }, [generalAcc]);

  // ── داده‌ها ──
  const [documents, setDocuments] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // ── مدیریت فیلترها جهت ارتباط ──
  const handleGeneralChange = (val) => {
    setGeneralAcc(val);
    if (val !== "ALL") {
      const children = MOEIN_BY_GENERAL[val] ?? [];
      const isChild = children.some((c) => c.value === moeinAcc);
      if (!isChild) {
        setMoeinAcc("ALL");
      }
    }
  };

  const handleMoeinChange = (val) => {
    setMoeinAcc(val);
    if (val !== "ALL") {
      const selected = ALL_MOEIN_ACCTS.find((m) => m.value === val);
      if (selected && selected.parentCode) {
        setGeneralAcc(selected.parentCode);
      }
    }
  };

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

  // فیلتر و محاسبه گردش
  const handleSearch = useCallback(() => {
    if (documents.length === 0) {
      setFilteredRows([]);
      setCurrentPage(1);
      return;
    }

    const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
    const toNum = dateTo ? dateToNum(dateTo) : 99999999;

    const accum = {}; // code -> { code, title, debitBefore, creditBefore, debitTurn, creditTurn }

    documents.forEach((doc) => {
      if (doc.status === "CANCELLED") return;
      const docDateNum = dateToNum(doc.document_date);

      (doc.lines ?? []).forEach((line) => {
        const rawCode = line.account_code ?? "";
        const digits = rawCode.replace(/\D/g, "");
        if (!digits) return;

        let code = "";
        if (displayLevel === "group") {
          code = digits.substring(0, 1);
        } else if (displayLevel === "general") {
          code = digits.substring(0, 3);
        } else if (displayLevel === "moein") {
          code = digits.substring(0, 5);
        } else {
          code = digits;
        }

        if (!code) return;

        const { generalName, moeinName } = getAccountNamesFromCode(rawCode);
        let title = line.account_name ?? "";
        if (displayLevel === "group") {
          const groupOpt = sanamaCodes.groups.find(g => g.code === code);
          title = groupOpt ? groupOpt.title : "دارایی‌ها";
        } else if (displayLevel === "general") {
          title = generalName;
        } else if (displayLevel === "moein") {
          title = moeinName;
        }

        if (!accum[code]) {
          accum[code] = {
            code,
            title: title || `حساب ${code}`,
            debitBefore: 0,
            creditBefore: 0,
            debitTurn: 0,
            creditTurn: 0,
          };
        }

        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;

        if (docDateNum < fromNum) {
          accum[code].debitBefore += debit;
          accum[code].creditBefore += credit;
        } else if (docDateNum <= toNum) {
          accum[code].debitTurn += debit;
          accum[code].creditTurn += credit;
        }
      });
    });

    const rows = [];
    Object.values(accum).forEach((acc) => {
      const openNet = acc.debitBefore - acc.creditBefore;
      const openDebit = openNet > 0 ? openNet : 0;
      const openCredit = openNet < 0 ? -openNet : 0;

      const finalNet = openNet + acc.debitTurn - acc.creditTurn;
      const endingDebit = finalNet > 0 ? finalNet : 0;
      const endingCredit = finalNet < 0 ? -finalNet : 0;

      if (showZeroBalance === "بله" && acc.debitTurn === 0 && acc.creditTurn === 0 && openNet === 0) {
        return;
      }

      if (generalAcc !== "ALL" && !acc.code.startsWith(generalAcc)) return;
      if (moeinAcc !== "ALL" && !acc.code.startsWith(moeinAcc)) return;

      rows.push({
        id: acc.code,
        accountCode: acc.code,
        accountTitle: acc.title,
        openDebit,
        openCredit,
        debitTurn: acc.debitTurn,
        creditTurn: acc.creditTurn,
        debitBalance: endingDebit,
        creditBalance: endingCredit,
      });
    });

    rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode, "en", { numeric: true }));
    setFilteredRows(rows);
    setCurrentPage(1);
  }, [documents, dateFrom, dateTo, displayLevel, showZeroBalance, generalAcc, moeinAcc]);

  const handleReset = () => {
    setGeneralAcc("ALL");
    setMoeinAcc("ALL");
    setCostCenter("ALL");
    setProject("ALL");
    setDateFrom("۱۴۰۳/۰۱/۰۱");
    setDateTo("۱۴۰۳/۱۲/۲۹");
    setDisplayLevel("moein");
    setShowDetailTurnover("خیر");
    setDocShowType("همه");
    setDocShowLevel("کلی");
    setShowZeroBalance("خیر");
    setShowSummary("خیر");
    setCurrencyUnit("ریال");
    setReportType("کلی");
    setFilteredRows([]);
    setCurrentPage(1);
  };

  // محاسبات جمع
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        openDebit: acc.openDebit + (r.openDebit ?? 0),
        openCredit: acc.openCredit + (r.openCredit ?? 0),
        debitTurn: acc.debitTurn + (r.debitTurn ?? 0),
        creditTurn: acc.creditTurn + (r.creditTurn ?? 0),
        debitBalance: acc.debitBalance + (r.debitBalance ?? 0),
        creditBalance: acc.creditBalance + (r.creditBalance ?? 0),
      }),
      { openDebit: 0, openCredit: 0, debitTurn: 0, creditTurn: 0, debitBalance: 0, creditBalance: 0 }
    );
  }, [filteredRows]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [
        ["کد حساب", "عنوان حساب", "مانده ابتدا بدهکار", "مانده ابتدا بستانکار", "گردش بدهکار", "گردش بستانکار", "مانده پایان بدهکار", "مانده پایان بستانکار"].join(","),
        ...filteredRows.map(r => [
          r.accountCode, r.accountTitle, r.openDebit, r.openCredit, r.debitTurn, r.creditTurn, r.debitBalance, r.creditBalance
        ].join(","))
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "گردش_حساب‌ها.csv");
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
        <span>گزارش‌های حساب‌ها</span>
        <ChevronLeft className="h-3 w-3 shrink-0" />
        <span className="text-primary font-semibold">گردش حساب‌ها</span>
      </div>

      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground">گردش حساب‌ها</h1>
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

            {/* بخش گرید ورودی‌ها */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
              
              {/* ستون اول: حساب کل، معین، مرکز هزینه، پروژه */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">حساب کل :</Label>
                  <div className="flex-1">
                    <SearchableSelect value={generalAcc} onChange={handleGeneralChange} options={generalAccOpts} placeholder="همه" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-24 text-right text-xs font-semibold text-foreground/80 shrink-0">حساب معین :</Label>
                  <div className="flex-1">
                    <SearchableSelect value={moeinAcc} onChange={handleMoeinChange} options={moeinAccOpts} placeholder="همه" className="h-9" />
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

              {/* ستون دوم: تاریخ شروع، سطح نمایش، نمایش تفصیلی، نوع سند، نمایش سند */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">از تاریخ :</Label>
                  <div className="flex-1">
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">سطح نمایش :</Label>
                  <div className="flex-1">
                    <select value={displayLevel} onChange={(e) => setDisplayLevel(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">نمایش گردش تفصیلی :</Label>
                  <div className="flex-1">
                    <select value={showDetailTurnover} onChange={(e) => setShowDetailTurnover(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">نوع سند :</Label>
                  <div className="flex-1">
                    <select value={docShowType} onChange={(e) => setDocShowType(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {DOC_SHOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-36 text-right text-xs font-semibold text-foreground/80 shrink-0">سطح نمایش سند :</Label>
                  <div className="flex-1">
                    <select value={docShowLevel} onChange={(e) => setDocShowLevel(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      <option value="کلی">کلی</option>
                      <option value="جزئی">جزئی</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ستون سوم: تاریخ پایان، مانده صفر، نمایش خلاصه، واحد پول، نوع گزارش */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">تا تاریخ :</Label>
                  <div className="flex-1">
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-9" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">نمایش مانده صفر :</Label>
                  <div className="flex-1">
                    <select value={showZeroBalance} onChange={(e) => setShowZeroBalance(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">نمایش خلاصه :</Label>
                  <div className="flex-1">
                    <select value={showSummary} onChange={(e) => setShowSummary(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">واحد پول :</Label>
                  <div className="flex-1">
                    <select value={currencyUnit} onChange={(e) => setCurrencyUnit(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {CURRENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-32 text-right text-xs font-semibold text-foreground/80 shrink-0">نوع گزارش :</Label>
                  <div className="flex-1">
                    <select value={reportType} onChange={(e) => setReportType(e.target.value)}
                      className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring">
                      {REPORT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
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
          <Button onClick={() => printTable("#turnover-table", "گردش حساب‌ها")} variant="outline" size="sm" className="gap-1.5 text-[11px] font-semibold h-8 rounded-lg bg-white border border-border shadow-sm text-foreground/80">
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
                  <th rowSpan={2} className="px-3 py-4 font-bold text-center w-20 border-l border-white/10 whitespace-nowrap">کد حساب</th>
                  <th rowSpan={2} className="px-3 py-4 font-bold text-right border-l border-white/10 min-w-[200px]">عنوان حساب</th>
                  <th colSpan={2} className="px-3 py-2 font-bold text-center border-l border-white/10">مانده ابتدای دوره</th>
                  <th colSpan={2} className="px-3 py-2 font-bold text-center border-l border-white/10">گردش دوره</th>
                  <th colSpan={2} className="px-3 py-2 font-bold text-center">مانده پایان دوره</th>
                </tr>
                {/* هدر لایه دوم */}
                <tr className="bg-[#0b284e] text-white/95 border-b border-border">
                  <th className="px-3 py-2 font-semibold text-center w-32 border-l border-white/10">بدهکار</th>
                  <th className="px-3 py-2 font-semibold text-center w-32 border-l border-white/10">بستانکار</th>
                  <th className="px-3 py-2 font-semibold text-center w-32 border-l border-white/10">بدهکار</th>
                  <th className="px-3 py-2 font-semibold text-center w-32 border-l border-white/10">بستانکار</th>
                  <th className="px-3 py-2 font-semibold text-center w-32 border-l border-white/10">بدهکار</th>
                  <th className="px-3 py-2 font-semibold text-center w-32">بستانکار</th>
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
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-foreground/80 border-l">
                        {row.accountCode}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-foreground border-l">
                        {row.accountTitle}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 tabular-nums border-l">
                        {fmtNum(row.openDebit)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-rose-700 tabular-nums border-l">
                        {fmtNum(row.openCredit)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-foreground/90 tabular-nums border-l">
                        {fmtNum(row.debitTurn)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-foreground/90 tabular-nums border-l">
                        {fmtNum(row.creditTurn)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-blue-700 tabular-nums border-l">
                        {fmtNum(row.debitBalance)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-rose-700 tabular-nums">
                        {fmtNum(row.creditBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* ─── ردیف‌های جمع کل ─── */}
              {filteredRows.length > 0 && (
                <tfoot>
                  {/* جمع کل */}
                  <tr className="bg-[#e9f2fb] border-t border-border font-bold text-foreground">
                    <td className="px-3 py-2.5 text-center font-bold" colSpan={2}>
                      جمع کل
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700 tabular-nums border-l">
                      {fmtNum(totals.openDebit)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-700 tabular-nums border-l">
                      {fmtNum(totals.openCredit)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700 tabular-nums border-l">
                      {fmtNum(totals.debitTurn)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-700 tabular-nums border-l">
                      {fmtNum(totals.creditTurn)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700 tabular-nums border-l">
                      {fmtNum(totals.debitBalance)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-700 tabular-nums">
                      {fmtNum(totals.creditBalance)}
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
