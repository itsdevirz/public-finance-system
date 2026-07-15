import { useState, useEffect } from "react";
import {
  Play, Save, Trash2, Printer, FileSpreadsheet, Eye,
  Info, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp,
  X, HelpCircle, Activity, FileText, Settings, Award
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

// ─── CONSTANTS & DATA PRESETS ──────────────────────────────────────────────────
const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const ASSET_GROUPS = [
  "تجهیزات اداری",
  "وسایل نقلیه",
  "ساختمان و ابنیه",
  "رایانه و ملزومات فناوری",
  "ماشین‌آلات و تجهیزات کارگاهی",
  "ابزارآلات"
];

const ASSET_SUBGROUPS = {
  "تجهیزات اداری": ["میز و صندلی اداری", "کولر و تهویه مطبوع", "فایل اداری"],
  "وسایل نقلیه": ["سواری", "کامیون", "وانت"],
  "ساختمان و ابنیه": ["ملکی اداری", "ملکی مسکونی", "محوطه‌سازی"],
  "رایانه و ملزومات فناوری": ["سرور", "لپ‌تاپ", "تجهیزات شبکه"],
  "ماشین‌آلات و تجهیزات کارگاهی": ["جرثقیل", "ژنراتور برق", "کمپرسور"],
  "ابزارآلات": ["ابزارهای تراشکاری", "ابزارهای اندازه‌گیری"]
};

const COST_CENTERS = [
  "۱۰۱ - واحد مالی و حسابداری",
  "۱۰۲ - واحد پشتیبانی و تدارکات",
  "۱۰۳ - واحد مدیریت و اجرایی",
  "۱۰۴ - کارگاه شماره ۱"
];

const PROJECTS = [
  "طرح احداث ساختمان مرکزی",
  "پروژه بهسازی شبکه داخلی",
  "طرح تجهیز سالن همایش"
];

const LOCATIONS = [
  "ساختمان مرکزی - طبقه اول",
  "ساختمان مرکزی - طبقه دوم",
  "انبار شماره ۱ - پشتیبانی"
];

const ORGANIZATIONS = [
  "معاونت اداری و مالی",
  "مدیریت سرمایه انسانی",
  "اداره پشتیبانی"
];

const ASSET_STATUSES = [
  "فعال",
  "غیرفعال",
  "اسقاط شده",
  "فروخته شده",
  "در حال تعمیر"
];

// ─── FIELD COMPONENT ────────────────────────────────────────────────────────────
function Field({ label, children, col }) {
  return (
    <div className={cn("flex flex-col gap-1", col === 2 && "col-span-1 md:col-span-2", col === 3 && "col-span-1 md:col-span-3")}>
      <Label className="text-[11px] font-semibold text-right text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function MonthlyDepreciationForm() {
  // پارامترهای اصلی محاسبات
  const [fiscalYear, setFiscalYear] = useState(1405);
  const [selectedMonth, setSelectedMonth] = useState("مرداد");
  const [calcDate, setCalcDate] = useState("1405/05/31");
  const [voucherDate, setVoucherDate] = useState("1405/05/31");
  
  // تنظیمات فرآیند محاسبه
  const [calcMode, setCalcMode] = useState("همه دارایی‌ها"); // همه دارایی‌ها | فقط جدید | فقط اصلاح شده | محاسبه مجدد
  const [deletePrevCalc, setDeletePrevCalc] = useState(true);
  const [autoIssueVoucher, setAutoIssueVoucher] = useState(true);
  const [updateAccumulated, setUpdateAccumulated] = useState(true);

  // فیلترهای دارایی
  const [filters, setFilters] = useState({
    asset_group: "",
    asset_subgroup: "",
    cost_center: "",
    project: "",
    location: "",
    org_unit: "",
    asset_status: "فعال",
  });

  const [showFilters, setShowFilters] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // داده‌های نتایج محاسبات
  const [calcResult, setCalcResult] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // شبیه‌ساز اسناد صادر شده
  const [runHistory, setRunHistory] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  
  // سال‌های مالی ثبت شده در سیستم
  const [fiscalYears, setFiscalYears] = useState([]);

  // دریافت تاریخچه‌های قبلی و سال‌های مالی
  useEffect(() => {
    fetchHistory();
    fetchFiscalYears();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/monthly-depreciations");
      if (res.data?.success) {
        setRunHistory(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFiscalYears = async () => {
    try {
      const res = await api.get("/api/fiscal-years");
      if (res.data?.success) {
        setFiscalYears(res.data.data);
        if (res.data.data.length > 0) {
          // قرار دادن اولین سال مالی ثبت شده به صورت پیش‌فرض
          setFiscalYear(res.data.data[0].year);
        }
      }
    } catch (e) {
      console.error("خطا در دریافت سال‌های مالی:", e);
    }
  };

  const updateFilter = (field, val) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: val };
      if (field === "asset_group") updated.asset_subgroup = ""; // ریست زیرگروه
      return updated;
    });
  };

  // شبیه‌ساز محاسبه استهلاک ماهانه
  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await api.post("/api/monthly-depreciations/calculate", {
        fiscal_year: fiscalYear,
        month: selectedMonth,
        filters
      });

      if (res.data?.success) {
        setCalcResult(res.data.data);
        // انتخاب همه دارایی‌های فاقد خطا به طور پیش‌فرض
        const validIds = res.data.data.items
          .filter(item => !item.error_msg)
          .map(item => item.asset_code);
        setSelectedRows(validIds);
      }
    } catch (e) {
      console.error(e);
      alert("خطا در محاسبه استهلاک ماهانه.");
    } finally {
      setIsCalculating(false);
    }
  };

  // شبیه‌سازی ذخیره‌سازی محاسبات استهلاک و بستن ماه
  const handleSaveCalculation = async () => {
    if (!calcResult) return;
    
    try {
      const payload = {
        ...calcResult,
        status: "تأیید نهایی",
        createdAt: new Date().toISOString()
      };

      const res = await api.post("/api/monthly-depreciations/save", payload);
      if (res.data?.success) {
        alert("محاسبات استهلاک با موفقیت ذخیره و ثبت نهایی شد.");
        fetchHistory();
        
        // صدور خودکار سند حسابداری
        if (autoIssueVoucher) {
          handleIssueVoucher(res.data.data._id);
        } else {
          setCalcResult(res.data.data);
        }
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ذخیره محاسبات.");
    }
  };

  // شبیه‌سازی صدور سند حسابداری
  const handleIssueVoucher = async (runId) => {
    try {
      const res = await api.post(`/api/monthly-depreciations/issue-voucher/${runId}`);
      if (res.data?.success) {
        alert(`سند حسابداری با موفقیت صادر شد. شماره سند: ${res.data.data.voucher.voucher_number}`);
        setCalcResult(res.data.data);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
      alert("خطا در صدور سند حسابداری.");
    }
  };

  // لغو محاسبات
  const handleDeleteCalculation = async (runId) => {
    if (!confirm("آیا از حذف محاسبات این دوره و لغو کل اسناد مربوطه اطمینان دارید؟")) return;
    try {
      const res = await api.delete(`/api/monthly-depreciations/${runId}`);
      if (res.data?.success) {
        alert("محاسبات با موفقیت حذف گردید.");
        if (calcResult && calcResult._id === runId) {
          setCalcResult(null);
        }
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
      alert("خطا در حذف محاسبات.");
    }
  };

  // کنترل انتخاب‌های جدول
  const handleToggleRow = (code) => {
    setSelectedRows(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleAll = () => {
    if (!calcResult) return;
    const validCodes = calcResult.items
      .filter(item => !item.error_msg)
      .map(item => item.asset_code);

    if (selectedRows.length === validCodes.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(validCodes);
    }
  };

  // اکسپورت شبیه‌سازی شده به اکسل
  const handleExportExcel = () => {
    alert("خروجی اکسل از جدول محاسبات استهلاک با موفقیت تولید شد. در حال دانلود...");
  };

  const handlePrint = () => {
    window.print();
  };

  // مشاهده سند حسابداری صادر شده
  const handleViewVoucher = (run) => {
    if (run.voucher) {
      setSelectedVoucher(run);
      setShowVoucherModal(true);
    } else {
      alert("برای این محاسبات سندی صادر نشده است.");
    }
  };

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground print:hidden" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">استهلاک</span>
        <span>/</span>
        <span>محاسبه استهلاک ماهانه</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4" dir="rtl">
        <div className="text-right">
          <h1 className="text-lg md:text-xl font-bold text-foreground">محاسبه استهلاک ماهانه دارایی‌ها</h1>
          <p className="text-xs text-muted-foreground mt-0.5">محاسبه استهلاک دوره‌ای دارایی‌های ثابت بر اساس آخرین پارامترها و صدور اسناد حسابداری</p>
        </div>

        {/* دکمه‌های فرم */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button
            size="sm"
            onClick={handleCalculate}
            disabled={isCalculating}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs font-bold"
          >
            <Play className="h-4 w-4" /> محاسبه استهلاک
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCalculation}
            disabled={!calcResult || calcResult.status === "سند صادر شده"}
            className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 gap-1 text-xs font-bold"
          >
            <CheckCircle2 className="h-4 w-4" /> ثبت نهایی و صدور سند
          </Button>

          {calcResult && calcResult._id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteCalculation(calcResult._id)}
              className="text-destructive border-red-200 bg-red-50 hover:bg-red-100 gap-1 text-xs"
            >
              <Trash2 className="h-4 w-4" /> حذف محاسبه
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1 text-xs">
            <Printer className="h-4 w-4" /> چاپ گزارش
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            <FileSpreadsheet className="h-4 w-4" /> خروجی Excel
          </Button>

          {calcResult?.voucher && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewVoucher(calcResult)}
              className="text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100 gap-1 text-xs"
            >
              <FileText className="h-4 w-4" /> مشاهده سند حسابداری
            </Button>
          )}
        </div>
      </div>

      {/* گرید اطلاعات دوره، فیلترها و خلاصه‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
        {/* ۱. اطلاعات دوره و تنظیمات */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm border-border/80">
            <div className="border-b bg-muted/10 p-3 font-bold text-xs">۱. اطلاعات دوره محاسباتی</div>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="سال مالی">
                  <select
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(Number(e.target.value))}
                    className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-center font-mono font-semibold text-blue-600"
                  >
                    {fiscalYears.length > 0 ? (
                      fiscalYears.map((fy) => (
                        <option key={fy._id} value={fy.year}>{fy.year}</option>
                      ))
                    ) : (
                      <>
                        <option value="1403">1403</option>
                        <option value="1404">1404</option>
                        <option value="1405">1405</option>
                      </>
                    )}
                  </select>
                </Field>

                <Field label="ماه محاسبه">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                  >
                    {PERSIAN_MONTHS.map((m, i) => <option key={i} value={m}>{m}</option>)}
                  </select>
                </Field>

                <Field label="تاریخ محاسبه">
                  <PersianDatePicker
                    value={calcDate}
                    onChange={(e) => setCalcDate(e.target.value)}
                  />
                </Field>

                <Field label="تاریخ سند حسابداری">
                  <PersianDatePicker
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                  />
                </Field>
              </div>

              {/* چک‌باکس‌های تنظیمی */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 border-t pt-4">
                <Field label="نحوه محاسبه استهلاک">
                  <select
                    value={calcMode}
                    onChange={(e) => setCalcMode(e.target.value)}
                    className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                  >
                    <option value="همه دارایی‌ها">همه دارایی‌ها</option>
                    <option value="فقط دارایی‌های جدید">فقط دارایی‌های جدید</option>
                    <option value="فقط دارایی‌های اصلاح شده">فقط دارایی‌های اصلاح شده</option>
                    <option value="محاسبه مجدد">محاسبه مجدد کل ماه</option>
                  </select>
                </Field>

                <div className="flex flex-col gap-2.5 justify-center pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={deletePrevCalc}
                      onChange={(e) => setDeletePrevCalc(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>حذف محاسبات قبلی همین ماه</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={autoIssueVoucher}
                      onChange={(e) => setAutoIssueVoucher(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>صدور خودکار سند حسابداری همزمان</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={updateAccumulated}
                      onChange={(e) => setUpdateAccumulated(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>بروزرسانی مبالغ استهلاک انباشته دارایی‌ها</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ۲. کارت فیلترها (کلاسیک و بازشونده) */}
          <Card className="shadow-sm border-border/80">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full border-b bg-muted/10 p-3 font-bold text-xs flex justify-between items-center text-right"
            >
              <span>۲. اعمال فیلتر روی دارایی‌ها (محاسبه گزینشی)</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showFilters && (
              <CardContent className="p-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="گروه دارایی">
                    <select
                      value={filters.asset_group}
                      onChange={(e) => updateFilter("asset_group", e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                    >
                      <option value="">همه گروه‌ها</option>
                      {ASSET_GROUPS.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </Field>

                  <Field label="زیرگروه دارایی">
                    <select
                      value={filters.asset_subgroup}
                      onChange={(e) => updateFilter("asset_subgroup", e.target.value)}
                      disabled={!filters.asset_group}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right disabled:bg-muted/40"
                    >
                      <option value="">همه زیرگروه‌ها</option>
                      {filters.asset_group &&
                        ASSET_SUBGROUPS[filters.asset_group]?.map((s, i) => (
                          <option key={i} value={s}>{s}</option>
                        ))
                      }
                    </select>
                  </Field>

                  <Field label="واحد سازمانی">
                    <select
                      value={filters.org_unit}
                      onChange={(e) => updateFilter("org_unit", e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                    >
                      <option value="">همه واحدها</option>
                      {ORGANIZATIONS.map((o, i) => <option key={i} value={o}>{o}</option>)}
                    </select>
                  </Field>

                  <Field label="مرکز هزینه">
                    <select
                      value={filters.cost_center}
                      onChange={(e) => updateFilter("cost_center", e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                    >
                      <option value="">همه مراکز</option>
                      {COST_CENTERS.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field label="پروژه هدف">
                    <select
                      value={filters.project}
                      onChange={(e) => updateFilter("project", e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                    >
                      <option value="">همه پروژه‌ها</option>
                      {PROJECTS.map((p, i) => <option key={i} value={p}>{p}</option>)}
                    </select>
                  </Field>

                  <Field label="محل استقرار">
                    <select
                      value={filters.location}
                      onChange={(e) => updateFilter("location", e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                    >
                      <option value="">همه محل‌ها</option>
                      {LOCATIONS.map((l, i) => <option key={i} value={l}>{l}</option>)}
                    </select>
                  </Field>

                  <Field label="وضعیت دارایی">
                    <select
                      value={filters.asset_status}
                      onChange={(e) => updateFilter("asset_status", e.target.value)}
                      className="h-8 w-full rounded border border-input bg-background text-xs px-2 text-right"
                    >
                      {ASSET_STATUSES.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* خلاصه‌ها و نتایج آماری محاسبات (سمت چپ) */}
        <div className="space-y-4">
          <Card className="shadow-sm border-border/80 h-full flex flex-col justify-between">
            <div>
              <div className="border-b bg-muted/10 p-3 font-bold text-xs">۳. خلاصه آمار محاسبات دوره</div>
              <CardContent className="p-4 space-y-3.5">
                <div className="flex justify-between items-center text-xs border-b pb-2">
                  <span className="text-muted-foreground font-semibold">کل اموال مشمول دوره:</span>
                  <span className="font-mono font-bold text-sm">{calcResult?.summary?.total_assets ?? 0} دارایی</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b pb-2">
                  <span className="text-muted-foreground font-semibold">محاسبه موفقیت‌آمیز:</span>
                  <span className="font-mono font-bold text-sm text-emerald-600">{calcResult?.summary?.calculated_assets ?? 0} دارایی</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b pb-2">
                  <span className="text-muted-foreground font-semibold">رد شده (خطاها):</span>
                  <span className="font-mono font-bold text-sm text-red-600">{calcResult?.summary?.rejected_assets ?? 0} دارایی</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b pb-2">
                  <span className="text-muted-foreground font-semibold">جمع کل استهلاک این ماه:</span>
                  <span className="font-mono font-extrabold text-sm text-blue-600">
                    {Number(calcResult?.summary?.total_depreciation_amount || 0).toLocaleString()} ریال
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1">
                  <span className="text-muted-foreground font-semibold">جمع ارزش دفتری باقیمانده:</span>
                  <span className="font-mono font-extrabold text-sm text-foreground">
                    {Number(calcResult?.summary?.total_book_value || 0).toLocaleString()} ریال
                  </span>
                </div>
              </CardContent>
            </div>

            {/* پانل سند حسابداری صادر شده */}
            {calcResult?.voucher && (
              <div className="p-4 border-t bg-purple-50/50 m-2 rounded-lg border border-purple-100 space-y-2">
                <div className="text-xs font-bold text-purple-800 flex items-center justify-between">
                  <span>سند حسابداری صادر شده</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[9px]">{calcResult.voucher.voucher_status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-purple-900">
                  <div>شماره سند: <strong className="font-mono text-xs">{calcResult.voucher.voucher_number}</strong></div>
                  <div>تاریخ سند: <strong className="font-mono text-xs">{calcResult.voucher_date}</strong></div>
                </div>
                <Button
                  size="xs"
                  onClick={() => handleViewVoucher(calcResult)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 mt-1.5"
                >
                  <Eye className="h-3.5 w-3.5 ml-1" /> نمایش آرتیکل‌های سند
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* جدول جزئیات محاسبات و خطاها */}
      <Card className="mt-6 border-border/80 shadow-sm">
        <div className="border-b bg-muted/10 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2" dir="rtl">
          <span className="font-bold text-xs">ریز نتایج محاسبه استهلاک اموال</span>
          {calcResult && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground font-semibold">کل ردیف‌ها: {calcResult.items.length}</span>
              <span className="text-[10px] text-emerald-600 font-bold">آماده تایید: {selectedRows.length}</span>
              <span className="text-[10px] text-red-500 font-bold">رد شده: {calcResult.summary.rejected_assets}</span>
            </div>
          )}
        </div>
        <CardContent className="p-0" dir="rtl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-center w-12 p-2">
                    <input
                      type="checkbox"
                      checked={calcResult && selectedRows.length === calcResult.items.filter(item => !item.error_msg).length}
                      onChange={handleToggleAll}
                      disabled={!calcResult || calcResult.items.filter(item => !item.error_msg).length === 0}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </TableHead>
                  <TableHead className="text-center text-xs w-12">ردیف</TableHead>
                  <TableHead className="text-center text-xs w-24">کد دارایی</TableHead>
                  <TableHead className="text-right text-xs">نام دارایی</TableHead>
                  <TableHead className="text-right text-xs">گروه دارایی</TableHead>
                  <TableHead className="text-center text-xs">بهره‌برداری</TableHead>
                  <TableHead className="text-center text-xs">ارزش اولیه</TableHead>
                  <TableHead className="text-center text-xs w-16">عمر مفید</TableHead>
                  <TableHead className="text-center text-xs">استهلاک انباشته قبلی</TableHead>
                  <TableHead className="text-center text-xs">استهلاک این ماه</TableHead>
                  <TableHead className="text-center text-xs">استهلاک انباشته جدید</TableHead>
                  <TableHead className="text-center text-xs">ارزش دفتری</TableHead>
                  <TableHead className="text-center text-xs">وضعیت / خطای محاسباتی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calcResult?.items.map((item) => (
                  <TableRow
                    key={item.asset_code}
                    className={cn(
                      "hover:bg-muted/15 transition-colors",
                      item.error_msg ? "bg-red-500/5 hover:bg-red-500/10" : ""
                    )}
                  >
                    <TableCell className="text-center p-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.asset_code)}
                        onChange={() => handleToggleRow(item.asset_code)}
                        disabled={!!item.error_msg}
                        className="rounded border-gray-300 text-blue-600 disabled:opacity-50"
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono text-center">{item.row_num}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-center">{item.asset_code}</TableCell>
                    <TableCell className="text-xs font-semibold text-right">{item.asset_name}</TableCell>
                    <TableCell className="text-xs text-right text-muted-foreground">{item.asset_group}</TableCell>
                    <TableCell className="text-xs font-mono text-center">{item.utilization_date}</TableCell>
                    <TableCell className="text-xs font-mono text-center">{Number(item.original_value).toLocaleString()} ریال</TableCell>
                    <TableCell className="text-xs font-mono text-center">{item.useful_life} سال</TableCell>
                    <TableCell className="text-xs font-mono text-center text-muted-foreground">{Number(item.accumulated_before).toLocaleString()} ریال</TableCell>
                    <TableCell className="text-xs font-mono text-center font-bold text-blue-600">{Number(item.amount).toLocaleString()} ریال</TableCell>
                    <TableCell className="text-xs font-mono text-center text-muted-foreground">{Number(item.accumulated_after).toLocaleString()} ریال</TableCell>
                    <TableCell className="text-xs font-mono text-center font-bold text-emerald-600">{Number(item.book_value).toLocaleString()} ریال</TableCell>
                    <TableCell className="text-center">
                      {item.error_msg ? (
                        <div className="flex items-center justify-center gap-1 text-red-600 font-bold text-[10px]">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>{item.error_msg}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border-emerald-100 text-[9px] font-bold">
                          {item.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!calcResult && (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-xs py-10 text-muted-foreground">
                      جهت نمایش نتایج محاسبات استهلاک، سال و ماه را انتخاب کرده و دکمه <strong>«محاسبه استهلاک»</strong> را بزنید.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* پیشینه محاسبات در پایین صفحه */}
      <Card className="mt-8 border-border/80 shadow-sm print:hidden">
        <div className="border-b bg-muted/10 p-3 flex justify-between items-center" dir="rtl">
          <span className="font-bold text-xs">لیست محاسبات و اسناد حسابداری دوره‌های قبلی</span>
          <span className="text-[10px] text-muted-foreground font-semibold">تعداد ثبت شده: {runHistory.length} دوره</span>
        </div>
        <CardContent className="p-4" dir="rtl">
          <div className="overflow-x-auto rounded border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-center text-xs">ردیف</TableHead>
                  <TableHead className="text-center text-xs">سال مالی</TableHead>
                  <TableHead className="text-center text-xs">دوره / ماه</TableHead>
                  <TableHead className="text-center text-xs">تاریخ محاسبه</TableHead>
                  <TableHead className="text-center text-xs">تعداد کل اموال</TableHead>
                  <TableHead className="text-center text-xs">کل استهلاک ماه</TableHead>
                  <TableHead className="text-center text-xs">سند حسابداری</TableHead>
                  <TableHead className="text-center text-xs">وضعیت محاسبات</TableHead>
                  <TableHead className="text-center text-xs w-28">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runHistory.map((run, idx) => (
                  <TableRow key={run._id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs font-mono text-center">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-mono text-center font-semibold">{run.fiscal_year}</TableCell>
                    <TableCell className="text-xs text-center font-bold text-blue-600">{run.month}</TableCell>
                    <TableCell className="text-xs font-mono text-center">{run.calc_date}</TableCell>
                    <TableCell className="text-xs font-mono text-center">{run.summary?.total_assets} دارایی</TableCell>
                    <TableCell className="text-xs font-mono text-center font-bold">
                      {Number(run.summary?.total_depreciation_amount).toLocaleString()} ریال
                    </TableCell>
                    <TableCell className="text-center">
                      {run.voucher ? (
                        <button
                          onClick={() => handleViewVoucher(run)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 hover:underline"
                        >
                          سند {run.voucher.voucher_number}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn(
                        "text-[9px] font-bold",
                        run.status === "سند صادر شده" ? "bg-emerald-50 text-emerald-800" : "bg-yellow-50 text-yellow-800"
                      )}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center p-1 space-x-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => loadSetupDetails(run)}
                        className="text-blue-600 hover:bg-blue-50 text-[10px]"
                      >
                        لود محاسبات
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleDeleteCalculation(run._id)}
                        className="text-destructive hover:bg-red-50 text-[10px]"
                      >
                        لغو و حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {runHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-xs py-8 text-muted-foreground">هیچ دوره‌ی محاسباتی در سیستم یافت نشد.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مودال نمایش آرتیکل‌های سند حسابداری */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl" dir="rtl">
            <div className="border-b p-4 bg-muted/15 flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-1.5"><FileText className="h-4 w-4 text-purple-700" /> سند حسابداری صادر شده استهلاک ماهانه</span>
              <button onClick={() => setShowVoucherModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 border rounded bg-muted/5 text-xs">
                <div>شماره سند: <strong className="font-mono text-sm">{selectedVoucher.voucher?.voucher_number}</strong></div>
                <div>تاریخ سند: <strong className="font-mono text-sm">{selectedVoucher.voucher_date}</strong></div>
                <div>نوع سند: <strong className="text-semibold text-foreground">سند استهلاک اموال</strong></div>
                <div>وضعیت: <strong className="text-emerald-700">{selectedVoucher.voucher?.voucher_status}</strong></div>
              </div>

              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-center text-xs w-12">ردیف</TableHead>
                      <TableHead className="text-right text-xs">کد معین حساب</TableHead>
                      <TableHead className="text-right text-xs">عنوان حساب دفتر کل / معین</TableHead>
                      <TableHead className="text-center text-xs">بدهکار (ریال)</TableHead>
                      <TableHead className="text-center text-xs">بستانکار (ریال)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-muted/10">
                      <TableCell className="text-xs text-center font-mono">۱</TableCell>
                      <TableCell className="text-xs font-mono text-right">{selectedVoucher.voucher?.expense_account_code}</TableCell>
                      <TableCell className="text-xs font-semibold text-right">هزینه استهلاک اموال - معین مربوطه</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-center text-blue-700">
                        {Number(selectedVoucher.summary?.total_depreciation_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-center text-muted-foreground">۰</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted/10">
                      <TableCell className="text-xs text-center font-mono">۲</TableCell>
                      <TableCell className="text-xs font-mono text-right">{selectedVoucher.voucher?.accumulated_depr_account_code}</TableCell>
                      <TableCell className="text-xs font-semibold text-right">استهلاک انباشته دارایی‌ها - معین مربوطه</TableCell>
                      <TableCell className="text-xs font-mono text-center text-muted-foreground">۰</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-center text-red-600">
                        {Number(selectedVoucher.summary?.total_depreciation_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell colSpan={3} className="text-left text-xs pr-4">جمع سند:</TableCell>
                      <TableCell className="text-center text-xs font-mono font-extrabold">
                        {Number(selectedVoucher.summary?.total_depreciation_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono font-extrabold">
                        {Number(selectedVoucher.summary?.total_depreciation_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="border-t p-3 bg-muted/10 flex justify-end gap-2">
              <Button onClick={() => setShowVoucherModal(false)} variant="outline" size="sm" className="text-xs h-8">بستن</Button>
            </div>
          </Card>
        </div>
      )}

    </PageShell>
  );

  // لود تنظیم تاریخی انتخاب‌شده
  function loadSetupDetails(run) {
    setCalcResult(run);
    setFiscalYear(run.fiscal_year);
    setSelectedMonth(run.month);
    setCalcDate(run.calc_date);
    setVoucherDate(run.voucher_date);
    setFilters(run.filters || {
      asset_group: "",
      asset_subgroup: "",
      cost_center: "",
      project: "",
      location: "",
      org_unit: "",
      asset_status: "فعال",
    });
    setSelectedRows(run.items.filter(item => !item.error_msg).map(item => item.asset_code));
  }
}
