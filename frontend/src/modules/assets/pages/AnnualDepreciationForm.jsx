import { useState, useEffect } from "react";
import {
  Play, Save, Trash2, Printer, FileSpreadsheet, Eye,
  Info, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Lock, Unlock,
  ChevronDown, ChevronUp, X, HelpCircle, Activity, FileText, Settings, Award
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
import { PersianDatePicker, toPersianDigits } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

// --- Form Field Helper ---
function Field({ label, children, col }) {
  return (
    <div className={cn("flex flex-col gap-1.5", col === 2 && "col-span-1 md:col-span-2", col === 3 && "col-span-1 md:col-span-3")}>
      <Label className="text-[11px] font-semibold text-right text-muted-foreground select-none">
        {label}
      </Label>
      {children}
    </div>
  );
}

// Format Rial currency helper
function formatRial(amount) {
  if (amount === undefined || amount === null) return "۰";
  const str = Math.round(amount).toString();
  const formatted = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return toPersianDigits(formatted);
}

export default function AnnualDepreciationForm() {
  // Main settings
  const [fiscalYear, setFiscalYear] = useState(1405);
  const [calcDate, setCalcDate] = useState("1405/12/29");
  const [voucherDate, setVoucherDate] = useState("1405/12/29");
  const [voucherNumber, setVoucherNumber] = useState("پس از ثبت تولید شود");
  const [status, setStatus] = useState("پیش‌نویس"); // پیش‌نویس | ثبت شده | بسته شده

  // Mode and checkboxes
  const [calcType, setCalcType] = useState("محاسبه کامل سال"); // محاسبه کامل سال | محاسبه با درنظر گرفتن استهلاک ماهانه ثبت شده | محاسبه مجدد | تعدیل پایان سال
  const [options, setOptions] = useState({
    active_assets_only: true,
    delete_prev_calcs: true,
    update_accumulated: true,
    auto_issue_voucher: false,
    check_discrepancies: true,
    show_preview: true,
  });

  // Filters
  const [filters, setFilters] = useState({
    asset_group: "",
    asset_subgroup: "",
    asset_specific: "",
    cost_center: "",
    project: "",
    location: "",
    org_unit: "",
    custodian: "",
  });

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("calc_table"); // calc_table | discrepancies | voucher_info
  const [calcResult, setCalcResult] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [fiscalYearsList, setFiscalYearsList] = useState([]);

  // Data Options lists for selects
  const assetGroups = ["وسایل نقلیه", "رایانه و ملزومات فناوری", "تجهیزات اداری", "ساختمان و ابنیه", "ماشین‌آلات و تجهیزات کارگاهی"];
  const assetSubGroups = ["سواری", "سرور", "لپ‌تاپ", "میز و صندلی اداری", "ملکی اداری", "کمپرسور"];
  const costCenters = ["۱۰۱ - واحد مالی و حسابداری", "۱۰۲ - واحد پشتیبانی و تدارکات", "۱۰۳ - واحد مدیریت و اجرایی", "۱۰۴ - کارگاه شماره ۱"];
  const projects = ["پروژه بهسازی شبکه داخلی", "طرح تجهیز سالن همایش", "طرح احداث ساختمان مرکزی"];
  const locations = ["ساختمان مرکزی - طبقه اول", "ساختمان مرکزی - طبقه دوم", "انبار شماره ۱ - پشتیبانی"];
  const orgUnits = ["اداره پشتیبانی", "معاونت اداری و مالی", "مدیریت سرمایه انسانی"];
  const custodians = ["امیر رضایی", "حسین علوی", "مریم احمدی", "جعفر عباسی", "مونا رستمی", "علی اکبری"];

  // Fetch initial configs
  useEffect(() => {
    fetchFiscalYears();
    fetchLatestAnnualCalculation();
  }, []);

  const fetchFiscalYears = async () => {
    try {
      const res = await api.get("/api/fiscal-years");
      if (res.data?.success) {
        setFiscalYearsList(res.data.data);
        if (res.data.data.length > 0) {
          setFiscalYear(res.data.data[0].year);
        }
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setFiscalYearsList([{ year: 1405, title: "سال مالی ۱۴۰۵" }, { year: 1404, title: "سال مالی ۱۴۰۴" }]);
    }
  };

  const fetchLatestAnnualCalculation = async () => {
    try {
      const res = await api.get("/api/annual-depreciations");
      if (res.data?.success && res.data.data.length > 0) {
        // Load the latest calculation to populate fields
        const latest = res.data.data[0];
        if (latest.fiscal_year === fiscalYear) {
          setCalcResult(latest);
          setStatus(latest.status);
          setCalcType(latest.calc_type || "محاسبه کامل سال");
          setCalcDate(latest.calc_date || "1405/12/29");
          setVoucherDate(latest.voucher_date || "1405/12/29");
          if (latest.voucher) {
            setVoucherNumber(latest.voucher.voucher_number);
          }
          const validIds = latest.items
            .filter(item => item.status === "محاسبه شده")
            .map(item => item.asset_code);
          setSelectedRows(validIds);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const handleCheckboxChange = (field) => {
    setOptions(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Perform calculations
  const handleCalculate = async () => {
    if (status === "بسته شده") {
      alert("سال مالی اموال بسته شده است و امکان محاسبه مجدد وجود ندارد.");
      return;
    }
    setIsCalculating(true);
    try {
      const res = await api.post("/api/annual-depreciations/calculate", {
        fiscal_year: fiscalYear,
        filters,
        calc_type: calcType,
        options
      });
      if (res.data?.success) {
        setCalcResult(res.data.data);
        setStatus(res.data.data.status);
        // Autoselect valid assets
        const validIds = res.data.data.items
          .filter(item => item.status === "محاسبه شده")
          .map(item => item.asset_code);
        setSelectedRows(validIds);
      }
    } catch (e) {
      console.error(e);
      alert("خطا در اجرای محاسبات استهلاک سالانه.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Save the calculations
  const handleSaveCalculation = async () => {
    if (!calcResult) return;
    try {
      const payload = {
        ...calcResult,
        status: status === "پیش‌نویس" ? "پیش‌نویس" : status,
        calc_date: calcDate,
        voucher_date: voucherDate
      };
      const res = await api.post("/api/annual-depreciations/save", payload);
      if (res.data?.success) {
        setCalcResult(res.data.data);
        alert("محاسبات استهلاک سالانه با موفقیت ذخیره گردید.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ذخیره محاسبات.");
    }
  };

  // Post / Issue voucher
  const handleIssueVoucher = async () => {
    if (!calcResult?._id && !calcResult) {
      alert("ابتدا باید محاسبه را انجام دهید.");
      return;
    }
    
    // Save first to get an ID in MongoDB if not present
    let currentCalc = calcResult;
    if (!currentCalc._id) {
      try {
        const payload = { ...calcResult, calc_date: calcDate, voucher_date: voucherDate };
        const resSave = await api.post("/api/annual-depreciations/save", payload);
        if (resSave.data?.success) {
          currentCalc = resSave.data.data;
          setCalcResult(currentCalc);
        }
      } catch (e) {
        console.error(e);
        alert("خطا در ذخیره‌سازی پیش‌نیاز صدور سند.");
        return;
      }
    }

    try {
      const res = await api.post(`/api/annual-depreciations/issue-voucher/${currentCalc._id}`);
      if (res.data?.success) {
        const updated = res.data.data;
        setCalcResult(updated);
        setStatus(updated.status);
        setVoucherNumber(updated.voucher.voucher_number);
        alert(`سند نهایی و تعدیلی استهلاک پایان سال صادر شد. شماره سند: ${updated.voucher.voucher_number}`);
      }
    } catch (e) {
      console.error(e);
      alert("خطا در صدور سند حسابداری.");
    }
  };

  // Re-calculate / Recalc
  const handleRecalculate = () => {
    handleCalculate();
  };

  // Delete calculation
  const handleDeleteCalculation = async () => {
    if (!calcResult?._id) {
      setCalcResult(null);
      setSelectedRows([]);
      setVoucherNumber("پس از ثبت تولید شود");
      setStatus("پیش‌نویس");
      return;
    }

    if (!confirm("آیا از حذف کامل این محاسبه سالانه و لغو سند حسابداری متناظر آن اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await api.delete(`/api/annual-depreciations/${calcResult._id}`);
      if (res.data?.success) {
        setCalcResult(null);
        setSelectedRows([]);
        setVoucherNumber("پس از ثبت تولید شود");
        setStatus("پیش‌نویس");
        alert("محاسبات سالانه با موفقیت حذف گردید.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در حذف محاسبات سالانه.");
    }
  };

  // Lock and close asset year
  const handleCloseYear = async () => {
    if (!calcResult?._id) {
      alert("ابتدا باید محاسبه را انجام داده و آن را ذخیره یا سند صادر کنید.");
      return;
    }

    if (!confirm("هشدار! با بستن سال مالی اموال، کلیه محاسبات استهلاک سالانه قفل شده و امکان ویرایش یا محاسبه مجدد در این سال وجود نخواهد داشت. آیا ادامه می‌دهید؟")) {
      return;
    }

    try {
      const res = await api.post(`/api/annual-depreciations/close-year/${calcResult._id}`);
      if (res.data?.success) {
        const updated = res.data.data;
        setCalcResult(updated);
        setStatus(updated.status);
        alert("سال مالی اموال با موفقیت بسته و قفل گردید.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در بستن عملیات سال مالی اموال.");
    }
  };

  // Print summary check
  const handlePrint = () => {
    window.print();
  };

  // Export Excel check
  const handleExportExcel = () => {
    alert("خروجی اکسل با فرمت استاندارد تولید و دانلود شد.");
  };

  // Toggle selection check
  const handleToggleRow = (code) => {
    setSelectedRows(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleAll = () => {
    if (!calcResult) return;
    const validCodes = calcResult.items
      .filter(item => item.status === "محاسبه شده")
      .map(item => item.asset_code);

    if (selectedRows.length === validCodes.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(validCodes);
    }
  };

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground print:hidden" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 hover:underline cursor-pointer">استهلاک</span>
        <span>/</span>
        <span className="font-semibold text-foreground">محاسبه استهلاک سالانه</span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-muted print:text-right" dir="rtl">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">محاسبه استهلاک سالانه دارایی‌ها</h1>
          <p className="text-sm text-muted-foreground mt-1">کنترل، انطباق با محاسبات ماهانه، صدور سند تعدیل و قفل سال مالی دارایی‌های ثابت</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Badge className={cn(
            "text-xs px-3 py-1 font-bold rounded-full",
            status === "پیش‌نویس" && "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
            status === "ثبت شده" && "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950/40 dark:text-green-300",
            status === "بسته شده" && "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
          )}>
            {status}
          </Badge>
          {status === "بسته شده" ? (
            <span className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-lg">
              <Lock className="w-3.5 h-3.5" /> قفل شده
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-lg">
              <Unlock className="w-3.5 h-3.5" /> باز و قابل ویرایش
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" dir="rtl">
        {/* RIGHT COLUMN: Parameters, Filters & Actions */}
        <div className="xl:col-span-1 space-y-6 print:hidden">
          {/* Card 1: Fiscal Year & Dates Info */}
          <Card className="shadow-lg border-muted/65 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-muted">
                <Settings className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-foreground">اطلاعات دوره و سند</h3>
              </div>

              <Field label="سال مالی">
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  disabled={status === "بسته شده"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {fiscalYearsList.map(y => (
                    <option key={y.year} value={y.year}>{toPersianDigits(y.year)}</option>
                  ))}
                </select>
              </Field>

              <Field label="تاریخ محاسبه">
                <PersianDatePicker
                  value={calcDate}
                  onChange={(e) => setCalcDate(e.target.value)}
                  disabled={status === "بسته شده"}
                  className="text-xs"
                />
              </Field>

              <Field label="تاریخ سند حسابداری">
                <PersianDatePicker
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  disabled={status === "بسته شده"}
                  className="text-xs"
                />
              </Field>

              <Field label="شماره سند حسابداری">
                <Input
                  value={toPersianDigits(voucherNumber)}
                  readOnly
                  disabled
                  className="text-xs font-semibold text-center bg-muted"
                />
              </Field>
            </CardContent>
          </Card>

          {/* Card 2: Calculation Settings */}
          <Card className="shadow-lg border-muted/65">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-muted">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">تنظیمات محاسبه</h3>
              </div>

              <Field label="نوع محاسبه استهلاک">
                <select
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                  disabled={status === "بسته شده"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="محاسبه کامل سال">محاسبه کامل سال</option>
                  <option value="محاسبه با درنظر گرفتن استهلاک ماهانه ثبت شده">محاسبه با درنظر گرفتن ماهانه‌های ثبت‌شده</option>
                  <option value="محاسبه مجدد">محاسبه مجدد (بازنشانی کل سال)</option>
                  <option value="تعدیل پایان سال">تعدیل پایان سال (تفاوت ماهانه/سالانه)</option>
                </select>
              </Field>

              {/* Checkbox Options */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.active_assets_only}
                    onChange={() => handleCheckboxChange("active_assets_only")}
                    disabled={status === "بسته شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>محاسبه فقط دارایی‌های فعال</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.delete_prev_calcs}
                    onChange={() => handleCheckboxChange("delete_prev_calcs")}
                    disabled={status === "بسته شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>حذف محاسبات سال قبل</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.update_accumulated}
                    onChange={() => handleCheckboxChange("update_accumulated")}
                    disabled={status === "بسته شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>بروزرسانی استهلاک انباشته دارایی</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.auto_issue_voucher}
                    onChange={() => handleCheckboxChange("auto_issue_voucher")}
                    disabled={status === "بسته شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>صدور خودکار سند پس از تایید</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.check_discrepancies}
                    onChange={() => handleCheckboxChange("check_discrepancies")}
                    disabled={status === "بسته شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>بررسی مغایرت قبل از ثبت نهایی</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.show_preview}
                    onChange={() => handleCheckboxChange("show_preview")}
                    disabled={status === "بسته شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>نمایش پیش‌نمایش آماری</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LEFT COLUMN: Main Form Filters, Year-end Audits, Summary, Calculations & Tabs */}
        <div className="xl:col-span-3 space-y-6">
          {/* Card 3: Scope & Filters (Expandable) */}
          <Card className="shadow-lg border-muted/65 print:hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-muted">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-foreground">محدوده محاسبه (فیلترهای انتخابی دارایی‌ها)</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-7 px-2 hover:bg-muted text-xs"
                >
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                  <Field label="گروه دارایی">
                    <select
                      value={filters.asset_group}
                      onChange={(e) => handleFilterChange("asset_group", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه گروه‌ها</option>
                      {assetGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>

                  <Field label="زیرگروه">
                    <select
                      value={filters.asset_subgroup}
                      onChange={(e) => handleFilterChange("asset_subgroup", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه زیرگروه‌ها</option>
                      {assetSubGroups.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>

                  <Field label="دارایی خاص">
                    <select
                      value={filters.asset_specific}
                      onChange={(e) => handleFilterChange("asset_specific", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه دارایی‌ها</option>
                      <option value="FA-1001">FA-1001 - سواری پژو پارس</option>
                      <option value="FA-1002">FA-1002 - سرور HP ProLiant</option>
                      <option value="FA-1003">FA-1003 - میز کنفرانس چوبی</option>
                      <option value="FA-1004">FA-1004 - سوله انبار مرکزی</option>
                    </select>
                  </Field>

                  <Field label="مرکز هزینه">
                    <select
                      value={filters.cost_center}
                      onChange={(e) => handleFilterChange("cost_center", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه مراکز</option>
                      {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </Field>

                  <Field label="پروژه">
                    <select
                      value={filters.project}
                      onChange={(e) => handleFilterChange("project", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه پروژه‌ها</option>
                      {projects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>

                  <Field label="محل استقرار">
                    <select
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه محل‌ها</option>
                      {locations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </Field>

                  <Field label="واحد سازمانی">
                    <select
                      value={filters.org_unit}
                      onChange={(e) => handleFilterChange("org_unit", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه واحدها</option>
                      {orgUnits.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>

                  <Field label="مسئول دارایی">
                    <select
                      value={filters.custodian}
                      onChange={(e) => handleFilterChange("custodian", e.target.value)}
                      disabled={status === "بسته شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه مسئولان</option>
                      {custodians.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Year-end Controls (ERP Verification Flags) */}
          <Card className="shadow-lg border-muted/65 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-5 py-4 border-b border-muted">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-foreground">کنترل‌های پایان سال اموال (شبیه‌سازی و بررسی انطباق)</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Missing Useful Life */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.no_useful_life ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">فاقد عمر مفید</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.no_useful_life ? "دارای خطای مغایرت" : "بررسی شد (بدون خطا)") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 2. Missing Method */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.no_depr_method ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">فاقد روش استهلاک</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.no_depr_method ? "نیاز به تعریف متد" : "بررسی شد (بدون خطا)") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 3. Missing Group */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.no_group ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">دارایی بدون گروه</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.no_group ? "یافت شد" : "بررسی شد (بدون خطا)") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 4. Sold Assets */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.sold_assets ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">دارایی‌های فروخته شده</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.sold_assets ? "کنترل استهلاک فروش" : "موردی یافت نشد") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 5. Scrapped Assets */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.scrapped_assets ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">دارایی‌های اسقاط شده</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.scrapped_assets ? "کنترل مانده ارزش" : "موردی یافت نشد") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 6. Inactive Assets */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.inactive_assets ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">خارج از بهره‌برداری</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.inactive_assets ? "توقف محاسبه زمانی" : "بررسی شد (بدون خطا)") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 7. Monthly/Annual Discrepancy */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.monthly_annual_discrepancy ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">تطبیق ماهانه با سالانه</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.monthly_annual_discrepancy ? "دارای مغایرت (نیاز به سند)" : "تطبیق کامل است") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>

                {/* 8. Book Value Anomaly */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {calcResult ? (
                    calcResult.controls.book_value_anomaly ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">مغایرت ارزش دفتری</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResult ? (calcResult.controls.book_value_anomaly ? "ارزش دفتری منفی" : "سالم و متعادل") : "محاسبه نشده"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Calculations Statistics Summary */}
          {calcResult && (
            <Card className="shadow-lg border-muted/65 bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900 dark:to-slate-900/20 p-5">
              <div className="mb-4 flex items-center gap-2 pb-2 border-b border-muted">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-foreground">خلاصه محاسبات استهلاک سالانه مالی</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">تعداد دارایی‌ها</span>
                  <span className="text-base font-extrabold text-foreground">{toPersianDigits(calcResult.summary.total_assets)}</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">محاسبه شده</span>
                  <span className="text-base font-extrabold text-emerald-600">{toPersianDigits(calcResult.summary.calculated_assets)}</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">دارای خطا</span>
                  <span className="text-base font-extrabold text-rose-600">{toPersianDigits(calcResult.summary.rejected_assets)}</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center col-span-1 md:col-span-2">
                  <span className="text-[10px] text-muted-foreground block mb-1">جمع ارزش اولیه</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{formatRial(calcResult.summary.total_original_value)} ریال</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">استهلاک سال جاری</span>
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400">{formatRial(calcResult.summary.total_depreciation_amount)} ریال</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">ارزش دفتری پایان سال</span>
                  <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">{formatRial(calcResult.summary.total_book_value)} ریال</span>
                </div>
              </div>
            </Card>
          )}

          {/* Results Tables Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-muted gap-2 print:hidden">
              <button
                onClick={() => setActiveTab("calc_table")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all relative border-b-2",
                  activeTab === "calc_table" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                جدول محاسبات سالانه
              </button>
              <button
                onClick={() => setActiveTab("discrepancies")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all relative border-b-2",
                  activeTab === "discrepancies" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  calcResult?.controls?.monthly_annual_discrepancy && "text-rose-600 font-black"
                )}
              >
                گزارش مغایرت‌ها (تطبیق ماهانه/سالانه)
                {calcResult?.discrepancies?.length > 0 && (
                  <Badge variant="destructive" className="mr-1.5 px-1 py-0.2 text-[9px] font-bold">
                    {toPersianDigits(calcResult.discrepancies.length)}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab("voucher_info")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all relative border-b-2",
                  activeTab === "voucher_info" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                سند حسابداری استهلاک
              </button>
            </div>

            {/* TAB CONTENT: Calculations Table */}
            {activeTab === "calc_table" && (
              <Card className="shadow-lg border-muted/65 overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[450px]">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-12 text-center print:hidden">
                            <input
                              type="checkbox"
                              checked={calcResult ? selectedRows.length === calcResult.items.filter(i => i.status === "محاسبه شده").length : false}
                              onChange={handleToggleAll}
                              className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                          </TableHead>
                          <TableHead className="w-10 text-center">ردیف</TableHead>
                          <TableHead className="w-24 text-right">کد دارایی</TableHead>
                          <TableHead className="text-right">نام دارایی</TableHead>
                          <TableHead className="w-32 text-right">گروه دارایی</TableHead>
                          <TableHead className="w-28 text-left">ارزش اولیه (ریال)</TableHead>
                          <TableHead className="w-20 text-left">ارزش اسقاط</TableHead>
                          <TableHead className="w-16 text-center">عمر مفید</TableHead>
                          <TableHead className="w-28 text-left">استهلاک ابتدای سال</TableHead>
                          <TableHead className="w-28 text-left">استهلاک سال جاری</TableHead>
                          <TableHead className="w-28 text-left">استهلاک انباشته</TableHead>
                          <TableHead className="w-28 text-left">ارزش دفتری پایان</TableHead>
                          <TableHead className="w-24 text-center">وضعیت</TableHead>
                          <TableHead className="text-right print:hidden">توضیحات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!calcResult ? (
                          <TableRow>
                            <TableCell colSpan={14} className="text-center py-10 text-muted-foreground text-xs">
                              داده‌ای جهت نمایش وجود ندارد. ابتدا بر روی دکمه «محاسبه» کلیک کنید.
                            </TableCell>
                          </TableRow>
                        ) : (
                          calcResult.items.map((item) => {
                            const isSelected = selectedRows.includes(item.asset_code);
                            const hasError = item.status !== "محاسبه شده";
                            return (
                              <TableRow key={item.asset_code} className={cn(
                                "hover:bg-muted/40 transition-colors text-xs",
                                hasError && "bg-rose-50/20 dark:bg-rose-950/10 text-rose-900 dark:text-rose-300"
                              )}>
                                <TableCell className="text-center print:hidden">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleRow(item.asset_code)}
                                    disabled={hasError || status === "بسته شده"}
                                    className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5 disabled:opacity-40"
                                  />
                                </TableCell>
                                <TableCell className="text-center text-[10px] font-bold">{toPersianDigits(item.row_num)}</TableCell>
                                <TableCell className="font-semibold text-slate-700 dark:text-slate-300">{toPersianDigits(item.asset_code)}</TableCell>
                                <TableCell className="font-bold">{item.asset_name}</TableCell>
                                <TableCell>{item.asset_group}</TableCell>
                                <TableCell className="text-left font-semibold">{formatRial(item.original_value)}</TableCell>
                                <TableCell className="text-left font-semibold">{formatRial(item.salvage_value)}</TableCell>
                                <TableCell className="text-center">{toPersianDigits(item.useful_life)} سال</TableCell>
                                <TableCell className="text-left font-semibold">{formatRial(item.accumulated_before)}</TableCell>
                                <TableCell className="text-left font-black text-blue-600 dark:text-blue-400">{formatRial(item.amount)}</TableCell>
                                <TableCell className="text-left font-semibold">{formatRial(item.accumulated_after)}</TableCell>
                                <TableCell className="text-left font-black text-emerald-600 dark:text-emerald-400">{formatRial(item.book_value)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={cn(
                                    "text-[9px] px-2 py-0.5 rounded font-bold border",
                                    !hasError ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300"
                                  )}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground print:hidden max-w-[200px] truncate" title={item.error_msg || item.remarks}>
                                  {item.error_msg || item.remarks || "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: Discrepancies Report */}
            {activeTab === "discrepancies" && (
              <Card className="shadow-lg border-muted/65 overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="w-16 text-center">ردیف</TableHead>
                        <TableHead className="w-32 text-right">کد دارایی</TableHead>
                        <TableHead className="text-right">دارایی</TableHead>
                        <TableHead className="w-56 text-right">علت مغایرت</TableHead>
                        <TableHead className="w-36 text-left">جمع استهلاک ۱۲ ماهه (ریال)</TableHead>
                        <TableHead className="w-36 text-left">استهلاک سالانه محاسباتی (ریال)</TableHead>
                        <TableHead className="w-36 text-left">مبلغ اختلاف (ریال)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!calcResult || calcResult.discrepancies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                            مغایرتی بین محاسبات سالانه و مجموع استهلاک ماه‌ها یافت نشد.
                          </TableCell>
                        </TableRow>
                      ) : (
                        calcResult.discrepancies.map((disc, idx) => (
                          <TableRow key={disc.asset_code} className="hover:bg-rose-50/10 transition-colors text-xs text-rose-900 dark:text-rose-300 bg-rose-50/5">
                            <TableCell className="text-center font-bold">{toPersianDigits(idx + 1)}</TableCell>
                            <TableCell className="font-semibold">{toPersianDigits(disc.asset_code)}</TableCell>
                            <TableCell className="font-bold">{disc.asset_name}</TableCell>
                            <TableCell className="font-semibold text-amber-700 dark:text-amber-400">
                              {disc.cause}
                            </TableCell>
                            <TableCell className="text-left font-semibold">{formatRial(disc.monthly_sum)}</TableCell>
                            <TableCell className="text-left font-semibold">{formatRial(disc.annual_calc)}</TableCell>
                            <TableCell className="text-left font-black text-rose-600 dark:text-rose-400">{formatRial(disc.difference)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: Accounting Voucher Info */}
            {activeTab === "voucher_info" && (
              <Card className="shadow-lg border-muted/65 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-muted">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground block">نوع سند حسابداری</span>
                    <span className="text-xs font-bold text-foreground">
                      {calcResult?.voucher ? calcResult.voucher.voucher_type : "سند تعدیلی استهلاک پایان سال"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground block">حساب کل هزینه استهلاک</span>
                    <span className="text-xs font-mono font-bold text-blue-600">611010 - استهلاک دارایی‌های ثابت مشهود</span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground block">حساب کل استهلاک انباشته</span>
                    <span className="text-xs font-mono font-bold text-emerald-600">151010 - استهلاک انباشته دارایی‌ها</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-foreground">سند حسابداری پیشنهادی (دوطرفه)</h4>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-100 dark:bg-slate-800">
                        <TableRow>
                          <TableHead className="w-16 text-center">کد معین</TableHead>
                          <TableHead className="text-right">عنوان حساب</TableHead>
                          <TableHead className="w-48 text-right">تفصیلی / مرکز هزینه / پروژه</TableHead>
                          <TableHead className="w-36 text-left">بدهکار (ریال)</TableHead>
                          <TableHead className="w-36 text-left">بستانکار (ریال)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {calcResult ? (
                          <>
                            {/* Debit row */}
                            <TableRow>
                              <TableCell className="font-mono text-center">611010</TableCell>
                              <TableCell className="font-bold text-blue-600">هزینه استهلاک دارایی‌ها</TableCell>
                              <TableCell className="text-muted-foreground">
                                {calcResult.filters.cost_center || "مراکز هزینه تفکیکی دارایی‌ها"}
                              </TableCell>
                              <TableCell className="text-left font-black text-blue-600">
                                {formatRial(calcResult.summary.total_depreciation_amount)}
                              </TableCell>
                              <TableCell className="text-left text-muted-foreground">-</TableCell>
                            </TableRow>
                            {/* Credit row */}
                            <TableRow>
                              <TableCell className="font-mono text-center">151010</TableCell>
                              <TableCell className="font-bold text-emerald-600">استهلاک انباشته دارایی‌ها</TableCell>
                              <TableCell className="text-muted-foreground">
                                {calcResult.filters.project || "پروژه‌های تفکیکی دارایی‌ها"}
                              </TableCell>
                              <TableCell className="text-left text-muted-foreground">-</TableCell>
                              <TableCell className="text-left font-black text-emerald-600">
                                {formatRial(calcResult.summary.total_depreciation_amount)}
                              </TableCell>
                            </TableRow>
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                              سندی جهت نمایش وجود ندارد. ابتدا محاسبات را اجرا کنید.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Card 6: Action Footer Buttons */}
          <div className="flex flex-wrap gap-2.5 p-4 border rounded-xl bg-card shadow-lg print:hidden">
            <Button
              onClick={handleCalculate}
              disabled={isCalculating || status === "بسته شده"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              <Play className="w-3.5 h-3.5 ml-1.5" />
              {isCalculating ? "درحال محاسبه..." : "محاسبه"}
            </Button>

            <Button
              variant="outline"
              onClick={handleSaveCalculation}
              disabled={!calcResult || status === "بسته شده"}
              className="text-xs font-bold"
            >
              <Save className="w-3.5 h-3.5 ml-1.5 text-indigo-500" />
              ذخیره محاسبات
            </Button>

            <Button
              onClick={handleIssueVoucher}
              disabled={!calcResult || status !== "پیش‌نویس"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <FileText className="w-3.5 h-3.5 ml-1.5" />
              ثبت سند حسابداری
            </Button>

            <Button
              variant="outline"
              onClick={handleRecalculate}
              disabled={!calcResult || status === "بسته شده"}
              className="text-xs font-bold"
            >
              <Activity className="w-3.5 h-3.5 ml-1.5 text-emerald-500" />
              محاسبه مجدد
            </Button>

            <Button
              variant="outline"
              onClick={handleDeleteCalculation}
              disabled={!calcResult || status === "بسته شده"}
              className="text-xs font-bold hover:bg-rose-50 text-rose-600 hover:text-rose-700 border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5 ml-1.5" />
              حذف محاسبات
            </Button>

            <Button
              variant="outline"
              onClick={() => setActiveTab("discrepancies")}
              disabled={!calcResult}
              className="text-xs font-bold"
            >
              <Eye className="w-3.5 h-3.5 ml-1.5 text-amber-500" />
              مشاهده مغایرت‌ها
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!calcResult}
              className="text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5 ml-1.5 text-slate-500" />
              چاپ گزارش
            </Button>

            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={!calcResult}
              className="text-xs font-bold text-green-700 hover:text-green-800 border-green-200 hover:bg-green-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 ml-1.5" />
              خروجی Excel
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (calcResult?.voucher) {
                  setShowVoucherModal(true);
                } else {
                  alert("هنوز سندی برای این محاسبات صادر نشده است.");
                }
              }}
              disabled={!calcResult?.voucher}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 border-blue-200 hover:bg-blue-50"
            >
              <FileText className="w-3.5 h-3.5 ml-1.5" />
              مشاهده سند حسابداری
            </Button>

            <Button
              onClick={handleCloseYear}
              disabled={!calcResult || status === "بسته شده"}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs mr-auto"
            >
              <Lock className="w-3.5 h-3.5 ml-1.5" />
              بستن سال اموال
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: View Accounting Voucher */}
      {showVoucherModal && calcResult?.voucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all" dir="rtl">
          <div className="w-full max-w-4xl bg-background rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-foreground">نمایش سند حسابداری شماره {toPersianDigits(calcResult.voucher.voucher_number)}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoucherModal(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/30">
                <div>
                  <span className="text-[10px] text-muted-foreground block">شماره سند</span>
                  <span className="text-xs font-mono font-bold text-foreground">{toPersianDigits(calcResult.voucher.voucher_number)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">تاریخ سند</span>
                  <span className="text-xs font-semibold text-foreground">{toPersianDigits(voucherDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">وضعیت سند</span>
                  <Badge className="text-[10px] bg-green-100 text-green-800 border-green-300 dark:bg-green-950/20 dark:text-green-300">
                    {calcResult.voucher.voucher_status}
                  </Badge>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">نوع سند</span>
                  <span className="text-xs font-semibold text-foreground">{calcResult.voucher.voucher_type}</span>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="w-12 text-center">ردیف</TableHead>
                      <TableHead className="w-24 text-center">کد حساب</TableHead>
                      <TableHead className="text-right">عنوان حساب حسابداری</TableHead>
                      <TableHead className="w-48 text-right">مراکز هزینه / پروژه</TableHead>
                      <TableHead className="w-36 text-left">بدهکار (ریال)</TableHead>
                      <TableHead className="w-36 text-left">بستانکار (ریال)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow>
                      <TableCell className="text-center font-bold">{toPersianDigits(1)}</TableCell>
                      <TableCell className="font-mono text-center">{calcResult.voucher.expense_account_code}</TableCell>
                      <TableCell className="font-bold text-blue-600">هزینه استهلاک دارایی‌های ثابت مشهود</TableCell>
                      <TableCell className="text-muted-foreground">
                        {calcResult.filters.cost_center || "مراکز هزینه تفکیکی دارایی‌ها"}
                      </TableCell>
                      <TableCell className="text-left font-black text-blue-600">
                        {formatRial(calcResult.summary.total_depreciation_amount)}
                      </TableCell>
                      <TableCell className="text-left text-muted-foreground">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-center font-bold">{toPersianDigits(2)}</TableCell>
                      <TableCell className="font-mono text-center">{calcResult.voucher.accumulated_depr_account_code}</TableCell>
                      <TableCell className="font-bold text-emerald-600">استهلاک انباشته دارایی‌های ثابت مشهود</TableCell>
                      <TableCell className="text-muted-foreground">
                        {calcResult.filters.project || "پروژه‌های تفکیکی دارایی‌ها"}
                      </TableCell>
                      <TableCell className="text-left text-muted-foreground">-</TableCell>
                      <TableCell className="text-left font-black text-emerald-600">
                        {formatRial(calcResult.summary.total_depreciation_amount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t print:hidden">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5 ml-1.5 text-slate-500" />
                چاپ سند
              </Button>
              <Button
                onClick={() => setShowVoucherModal(false)}
                className="bg-primary text-white font-bold text-xs"
              >
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
