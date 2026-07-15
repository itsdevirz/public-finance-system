import { useState, useEffect } from "react";
import {
  Play, Save, Trash2, Printer, FileSpreadsheet, Eye,
  Info, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, Lock, Unlock,
  ChevronDown, ChevronUp, X, HelpCircle, Activity, FileText, Settings, Award,
  Send, RotateCcw, Share2, FileDown
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

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export default function DepreciationVoucherForm() {
  // Main settings
  const [fiscalYear, setFiscalYear] = useState(1405);
  const [selectedMonth, setSelectedMonth] = useState("مرداد");
  const [voucherDate, setVoucherDate] = useState("1405/05/31");
  const [voucherNumber, setVoucherNumber] = useState("خودکار صادر می‌شود");
  const [voucherType, setVoucherType] = useState("عادی"); // عادی | اختتامیه | تعدیلی
  const [status, setStatus] = useState("پیش‌نویس"); // پیش‌نویس | ثبت شده | تأیید شده | برگشت خورده

  // Issuing settings & checkboxes
  const [groupBy, setGroupBy] = useState("all"); // all | group | cost_center | project | org_unit
  const [options, setOptions] = useState({
    aggregate_similar: true,
    auto_numbering: true,
    auto_ledger_post: false,
    send_for_approval: true,
    only_approved_assets: false,
    replace_existing: true,
    delete_before_issue: true,
  });

  // Filters
  const [filters, setFilters] = useState({
    asset_group: "",
    asset_subgroup: "",
    cost_center: "",
    project: "",
    location: "",
    org_unit: "",
    asset_specific: "",
  });

  // UI state
  const [showFilters, setShowFilters] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("lines_table"); // lines_table | controls_errors | history_workflow
  const [voucherResult, setVoucherResult] = useState(null);
  const [fiscalYearsList, setFiscalYearsList] = useState([]);
  const [historicalVouchers, setHistoricalVouchers] = useState([]);
  const [description, setDescription] = useState("");

  // Lists for selects
  const assetGroups = ["وسایل نقلیه", "رایانه و ملزومات فناوری", "تجهیزات اداری", "ساختمان و ابنیه", "ماشین‌آلات و تجهیزات کارگاهی"];
  const assetSubGroups = ["سواری", "سرور", "لپ‌تاپ", "میز و صندلی اداری", "ملکی اداری", "کمپرسور"];
  const costCenters = ["۱۰۱ - واحد مالی و حسابداری", "۱۰۲ - واحد پشتیبانی و تدارکات", "۱۰۳ - واحد مدیریت و اجرایی", "۱۰۴ - کارگاه شماره ۱"];
  const projects = ["پروژه بهسازی شبکه داخلی", "طرح تجهیز سالن همایش", "طرح احداث ساختمان مرکزی"];
  const locations = ["ساختمان مرکزی - طبقه اول", "ساختمان مرکزی - طبقه دوم", "انبار شماره ۱ - پشتیبانی"];
  const orgUnits = ["اداره پشتیبانی", "معاونت اداری و مالی", "مدیریت سرمایه انسانی"];

  useEffect(() => {
    fetchFiscalYears();
    fetchHistory();
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
      setFiscalYearsList([{ year: 1405, title: "سال مالی ۱۴۰۵" }, { year: 1404, title: "سال مالی ۱۴۰۴" }]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/depreciation-vouchers");
      if (res.data?.success) {
        setHistoricalVouchers(res.data.data);
        if (res.data.data.length > 0) {
          const latest = res.data.data[0];
          setVoucherResult(latest);
          setStatus(latest.status);
          setVoucherNumber(latest.voucher_number);
          setVoucherType(latest.voucher_type);
          setVoucherDate(latest.voucher_date);
          setGroupBy(latest.group_by || "all");
          setDescription(latest.description || "");
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

  // Run Preview / Simulation
  const handlePreview = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post("/api/depreciation-vouchers/issue", {
        fiscal_year: fiscalYear,
        month: selectedMonth,
        filters,
        group_by: groupBy,
        voucher_date: voucherDate,
        voucher_type: voucherType,
        options,
        description: description || `ثبت استهلاک دارایی‌های ثابت - ${selectedMonth} ${fiscalYear}`
      });

      if (res.data?.success) {
        setVoucherResult(res.data.data);
        setStatus(res.data.data.status);
        alert("پیش‌نمایش آرتیکل‌های سند حسابداری با موفقیت تولید شد. در جدول زیر اقلام سند را بررسی کنید.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در شبیه‌سازی صدور سند استهلاک.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Issue & Save as Draft
  const handleIssue = async () => {
    if (!voucherResult) {
      alert("ابتدا باید دکمه پیش‌نمایش یا شبیه‌سازی را بزنید.");
      return;
    }

    try {
      const res = await api.post("/api/depreciation-vouchers/save", voucherResult);
      if (res.data?.success) {
        setVoucherResult(res.data.data);
        setStatus(res.data.data.status);
        setVoucherNumber(res.data.data.voucher_number);
        fetchHistory();
        alert(`سند استهلاک با موفقیت به صورت پیش‌نویس صادر شد. شماره سند: ${res.data.data.voucher_number}`);
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ذخیره‌سازی سند پیش‌نویس.");
    }
  };

  // Finalize (Post to Ledger)
  const handleFinalize = async () => {
    if (!voucherResult?._id) {
      alert("سند ذخیره‌شده پیش‌نویسی وجود ندارد. ابتدا روی دکمه صدور سند کلیک کنید.");
      return;
    }

    try {
      const res = await api.post(`/api/depreciation-vouchers/finalize/${voucherResult._id}`);
      if (res.data?.success) {
        setVoucherResult(res.data.data);
        setStatus(res.data.data.status);
        fetchHistory();
        alert("سند حسابداری استهلاک با موفقیت در دفتر کل ثبت قطعی شد.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ثبت نهایی سند در دفتر کل.");
    }
  };

  // Send for approval
  const handleSendForApproval = async () => {
    if (!voucherResult?._id) {
      alert("سند پیش‌نویسی جهت ارسال پیدا نشد.");
      return;
    }

    try {
      const res = await api.post(`/api/depreciation-vouchers/approve/${voucherResult._id}`);
      if (res.data?.success) {
        setVoucherResult(res.data.data);
        setStatus(res.data.data.status);
        fetchHistory();
        alert("سند با موفقیت تأیید شد و به کارتابل ذیحسابی جهت بازبینی نهایی ارسال گردید.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در ارسال برای تأیید ذیحساب.");
    }
  };

  // Re-issue
  const handleReissue = () => {
    handlePreview();
  };

  // Cancel / Delete Voucher
  const handleDelete = async () => {
    if (!voucherResult?._id) {
      setVoucherResult(null);
      setVoucherNumber("خودکار صادر می‌شود");
      setStatus("پیش‌نویس");
      return;
    }

    if (!confirm("آیا از حذف کامل سند استهلاک انتخابی و برگشت از دفتر کل اطمینان دارید؟")) {
      return;
    }

    try {
      const res = await api.delete(`/api/depreciation-vouchers/${voucherResult._id}`);
      if (res.data?.success) {
        setVoucherResult(null);
        setVoucherNumber("خودکار صادر می‌شود");
        setStatus("پیش‌نویس");
        fetchHistory();
        alert("سند استهلاک با موفقیت ابطال و حذف گردید.");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در حذف سند.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert("فایل PDF آرتیکل‌های سند حسابداری تولید شد. در حال دانلود...");
  };

  const handleExportExcel = () => {
    alert("خروجی اکسل با فرمت استاندارد اسناد دفتر کل با موفقیت دانلود شد.");
  };

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground print:hidden" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 hover:underline cursor-pointer">استهلاک</span>
        <span>/</span>
        <span className="font-semibold text-foreground">صدور سند استهلاک</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-muted print:text-right" dir="rtl">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">صدور سند حسابداری استهلاک</h1>
          <p className="text-sm text-muted-foreground mt-1">تجمیع، موازنه آرتیکل‌ها، اعمال فیلترها و صدور نهایی اسناد حسابداری استهلاک در دفاتر کل</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Badge className={cn(
            "text-xs px-3 py-1 font-bold rounded-full",
            status === "پیش‌نویس" && "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
            status === "ثبت شده" && "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
            status === "تأیید شده" && "bg-green-100 text-green-800 border border-green-300 dark:bg-green-950/40 dark:text-green-300"
          )}>
            {status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" dir="rtl">
        {/* RIGHT COLUMN: Settings Panel */}
        <div className="xl:col-span-1 space-y-6 print:hidden">
          {/* Card 1: Voucher Details */}
          <Card className="shadow-lg border-muted/65">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-muted">
                <Settings className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-foreground">اطلاعات سند</h3>
              </div>

              <Field label="شماره سند حسابداری">
                <Input
                  value={toPersianDigits(voucherNumber)}
                  readOnly
                  disabled
                  className="text-xs text-center font-bold bg-muted"
                />
              </Field>

              <Field label="سال مالی">
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  disabled={status === "ثبت شده" || status === "تأیید شده"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {fiscalYearsList.map(y => (
                    <option key={y.year} value={y.year}>{toPersianDigits(y.year)}</option>
                  ))}
                </select>
              </Field>

              <Field label="ماه عملکرد">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  disabled={status === "ثبت شده" || status === "تأیید شده"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right"
                >
                  {PERSIAN_MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>

              <Field label="تاریخ ثبت سند">
                <PersianDatePicker
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  disabled={status === "ثبت شده" || status === "تأیید شده"}
                  className="text-xs"
                />
              </Field>

              <Field label="نوع سند">
                <select
                  value={voucherType}
                  onChange={(e) => setVoucherType(e.target.value)}
                  disabled={status === "ثبت شده" || status === "تأیید شده"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right"
                >
                  <option value="عادی">عادی (ماهانه)</option>
                  <option value="اختتامیه">اختتامیه سال مالی</option>
                  <option value="تعدیلی">تعدیلی تعدیلات استهلاک</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          {/* Card 2: Issuing Logic Split */}
          <Card className="shadow-lg border-muted/65">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-muted">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-foreground">نحوه تفکیک و صدور سند</h3>
              </div>

              {/* Group By options */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] text-muted-foreground block font-bold">مبنای تفکیک اسناد حسابداری</span>
                
                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="radio"
                    name="groupBy"
                    value="all"
                    checked={groupBy === "all"}
                    onChange={() => setGroupBy("all")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>یک سند کلی برای تمام دارایی‌ها</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="radio"
                    name="groupBy"
                    value="group"
                    checked={groupBy === "group"}
                    onChange={() => setGroupBy("group")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>تفکیک سند به ازای هر گروه دارایی</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="radio"
                    name="groupBy"
                    value="cost_center"
                    checked={groupBy === "cost_center"}
                    onChange={() => setGroupBy("cost_center")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>تفکیک سند به ازای هر مرکز هزینه</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="radio"
                    name="groupBy"
                    value="project"
                    checked={groupBy === "project"}
                    onChange={() => setGroupBy("project")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>تفکیک سند به ازای هر پروژه</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="radio"
                    name="groupBy"
                    value="org_unit"
                    checked={groupBy === "org_unit"}
                    onChange={() => setGroupBy("org_unit")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>تفکیک سند به ازای هر واحد سازمانی</span>
                </label>
              </div>

              {/* Checkboxes Settings */}
              <div className="space-y-3 pt-3 border-t border-muted">
                <span className="text-[10px] text-muted-foreground block font-bold">گزینه‌های صدور سند</span>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.aggregate_similar}
                    onChange={() => handleCheckboxChange("aggregate_similar")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>تجمیع اسناد و سرفصل‌های مشابه</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.auto_numbering}
                    onChange={() => handleCheckboxChange("auto_numbering")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>شماره‌گذاری خودکار بر اساس دفتر حسابداری</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.auto_ledger_post}
                    onChange={() => handleCheckboxChange("auto_ledger_post")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>ثبت خودکار همزمان در دفتر کل</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.send_for_approval}
                    onChange={() => handleCheckboxChange("send_for_approval")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>ارسال مستقیم سند برای کارتابل تأیید ذیحسابی</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.only_approved_assets}
                    onChange={() => handleCheckboxChange("only_approved_assets")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>صدور فقط برای دارایی‌های تأییدشده</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.replace_existing}
                    onChange={() => handleCheckboxChange("replace_existing")}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="rounded border-input text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>جایگزینی سند قبلی همین دوره</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LEFT COLUMN: Main Form Filters, Checkpoints, Summary, Table and History */}
        <div className="xl:col-span-3 space-y-6">
          {/* Card 3: Scope Filters */}
          <Card className="shadow-lg border-muted/65 print:hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-muted">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-foreground">محدوده صدور سند (فیلترهای انتخابی)</h3>
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
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
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
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه زیرگروه‌ها</option>
                      {assetSubGroups.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>

                  <Field label="مرکز هزینه">
                    <select
                      value={filters.cost_center}
                      onChange={(e) => handleFilterChange("cost_center", e.target.value)}
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه مراکز</option>
                      {costCenters.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field label="پروژه">
                    <select
                      value={filters.project}
                      onChange={(e) => handleFilterChange("project", e.target.value)}
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
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
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
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
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه واحدها</option>
                      {orgUnits.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>

                  <Field label="دارایی خاص" col={2}>
                    <select
                      value={filters.asset_specific}
                      onChange={(e) => handleFilterChange("asset_specific", e.target.value)}
                      disabled={status === "ثبت شده" || status === "تأیید شده"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">همه دارایی‌ها</option>
                      <option value="FA-1001">FA-1001 - سواری پژو پارس</option>
                      <option value="FA-1002">FA-1002 - سرور HP ProLiant</option>
                      <option value="FA-1003">FA-1003 - میز کنفرانس چوبی</option>
                      <option value="FA-1004">FA-1004 - سوله انبار مرکزی</option>
                    </select>
                  </Field>
                </div>
              )}

              <div className="pt-2">
                <Field label="شرح پیش‌فرض سند حسابداری">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`ثبت استهلاک دارایی‌های ثابت - ${selectedMonth} ${fiscalYear}`}
                    disabled={status === "ثبت شده" || status === "تأیید شده"}
                    className="text-xs"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Pre-Issuance Verification (7 checkpoints) */}
          <Card className="shadow-lg border-muted/65 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 px-5 py-4 border-b border-muted">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-foreground">کنترل‌های حسابداری قبل از صدور سند</h3>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. Depr calculated */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.calculation_done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">محاسبه استهلاک</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.calculation_done ? "انجام شده" : "انجام نشده است") : "نامشخص"}
                    </p>
                  </div>
                </div>

                {/* 2. No duplicate voucher */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.not_already_issued ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">عدم تکرار سند</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.not_already_issued ? "سند صادر نشده" : "سند صادر شده است") : "نامشخص"}
                    </p>
                  </div>
                </div>

                {/* 3. Expense account defined */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.expense_acct_defined ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">حساب هزینه استهلاک</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.expense_acct_defined ? "تعریف شده (611010)" : "تعریف نشده") : "نامشخص"}
                    </p>
                  </div>
                </div>

                {/* 4. Accumulated account defined */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.accum_acct_defined ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">حساب استهلاک انباشته</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.accum_acct_defined ? "تعریف شده (151010)" : "تعریف نشده") : "نامشخص"}
                    </p>
                  </div>
                </div>

                {/* 5. balanced document */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.is_balanced ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">توازن سند (تراز بدهکار/بستانکار)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.is_balanced ? "سند تراز است" : "نامتوازن") : "نامشخص"}
                    </p>
                  </div>
                </div>

                {/* 6. open fiscal period */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.fiscal_year_open ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">دوره مالی باز</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.fiscal_year_open ? "دوره مالی باز است" : "بسته شده") : "نامشخص"}
                    </p>
                  </div>
                </div>

                {/* 7. open accounting month */}
                <div className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  {voucherResult ? (
                    voucherResult.controls.month_open ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )
                  ) : (
                    <HelpCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">ماه مالی باز</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {voucherResult ? (voucherResult.controls.month_open ? "ماه حسابداری باز است" : "بسته شده") : "نامشخص"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Calculations Statistics Summary */}
          {voucherResult && (
            <Card className="shadow-lg border-muted/65 bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900 dark:to-slate-900/20 p-5">
              <div className="mb-4 flex items-center gap-2 pb-2 border-b border-muted">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-foreground">خلاصه تراز و اسناد تولیدی</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">تعداد کل دارایی‌ها</span>
                  <span className="text-base font-extrabold text-foreground">{toPersianDigits(voucherResult.summary.total_assets)}</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">تعداد اسناد صادره</span>
                  <span className="text-base font-extrabold text-blue-600">{toPersianDigits(voucherResult.summary.total_vouchers)}</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">جمع آرتیکل‌های بدهکار</span>
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400">{formatRial(voucherResult.summary.total_debit)} ریال</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">جمع آرتیکل‌های بستانکار</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{formatRial(voucherResult.summary.total_credit)} ریال</span>
                </div>
                <div className="p-3 bg-card rounded-xl border text-center">
                  <span className="text-[10px] text-muted-foreground block mb-1">تراز/اختلاف سند</span>
                  <Badge variant={voucherResult.summary.difference === 0 ? "outline" : "destructive"} className="text-xs px-2.5 py-0.5 rounded font-bold mt-1">
                    {formatRial(voucherResult.summary.difference)}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Results Tables Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-muted gap-2 print:hidden">
              <button
                onClick={() => setActiveTab("lines_table")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all relative border-b-2",
                  activeTab === "lines_table" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                آرتیکل‌های سند حسابداری (جدول اقلام)
              </button>
              <button
                onClick={() => setActiveTab("controls_errors")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all relative border-b-2",
                  activeTab === "controls_errors" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                  voucherResult?.errors?.length > 0 && "text-rose-600 font-black"
                )}
              >
                گزارش خطاهای دوره
                {voucherResult?.errors?.length > 0 && (
                  <Badge variant="destructive" className="mr-1.5 px-1 py-0.2 text-[9px] font-bold">
                    {toPersianDigits(voucherResult.errors.length)}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab("history_workflow")}
                className={cn(
                  "px-4 py-2 text-xs font-bold transition-all relative border-b-2",
                  activeTab === "history_workflow" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                تاریخچه و گردش سند
              </button>
            </div>

            {/* TAB CONTENT: Generated Voucher Entries */}
            {activeTab === "lines_table" && (
              <Card className="shadow-lg border-muted/65 overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-h-[450px]">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-12 text-center">ردیف</TableHead>
                          <TableHead className="w-24 text-center">کد حساب</TableHead>
                          <TableHead className="text-right">عنوان معین حساب</TableHead>
                          <TableHead className="text-right">شرح آرتیکل سند</TableHead>
                          <TableHead className="w-36 text-left">بدهکار (ریال)</TableHead>
                          <TableHead className="w-36 text-left">بستانکار (ریال)</TableHead>
                          <TableHead className="w-40 text-right">مرکز هزینه</TableHead>
                          <TableHead className="w-40 text-right">پروژه</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!voucherResult ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                              آرتیکلی جهت نمایش وجود ندارد. ابتدا بر روی دکمه «پیش‌نمایش سند» کلیک کنید.
                            </TableCell>
                          </TableRow>
                        ) : (
                          voucherResult.lines.map((line) => {
                            const isDebit = line.debit > 0;
                            return (
                              <TableRow key={line.row_num} className="hover:bg-muted/40 transition-colors text-xs">
                                <TableCell className="text-center text-[10px] font-bold">{toPersianDigits(line.row_num)}</TableCell>
                                <TableCell className="font-mono text-center">{line.account_code}</TableCell>
                                <TableCell className={cn("font-bold", isDebit ? "text-blue-600" : "text-emerald-600")}>
                                  {line.account_name}
                                </TableCell>
                                <TableCell className="text-muted-foreground max-w-[200px] truncate" title={line.description}>
                                  {line.description}
                                </TableCell>
                                <TableCell className={cn("text-left font-black", isDebit ? "text-blue-600" : "text-muted-foreground")}>
                                  {isDebit ? formatRial(line.debit) : "—"}
                                </TableCell>
                                <TableCell className={cn("text-left font-black", !isDebit ? "text-emerald-600" : "text-muted-foreground")}>
                                  {!isDebit ? formatRial(line.credit) : "—"}
                                </TableCell>
                                <TableCell className="text-right text-xs truncate max-w-[120px]" title={line.cost_center}>
                                  {line.cost_center || "—"}
                                </TableCell>
                                <TableCell className="text-right text-xs truncate max-w-[120px]" title={line.project}>
                                  {line.project || "—"}
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

            {/* TAB CONTENT: Errors Report */}
            {activeTab === "controls_errors" && (
              <Card className="shadow-lg border-muted/65 overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="w-16 text-center">ردیف</TableHead>
                        <TableHead className="w-32 text-right">شناسه دارایی</TableHead>
                        <TableHead className="text-right">شرح علت بروز خطای کنترل</TableHead>
                        <TableHead className="w-28 text-center">شدت خطا</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!voucherResult || voucherResult.errors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs">
                            هیچ خطای کنترل یا مغایریتی برای این دوره یافت نشد. سند آماده صدور است.
                          </TableCell>
                        </TableRow>
                      ) : (
                        voucherResult.errors.map((err, idx) => (
                          <TableRow key={idx} className="hover:bg-rose-50/10 transition-colors text-xs text-rose-900 dark:text-rose-300 bg-rose-50/5">
                            <TableCell className="text-center font-bold">{toPersianDigits(idx + 1)}</TableCell>
                            <TableCell className="font-semibold">{toPersianDigits(err.asset_code)}</TableCell>
                            <TableCell className="font-bold">{err.cause}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive" className="text-[9px] px-2 py-0.5 rounded font-bold">
                                بحرانی / مانع ثبت
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: History & Workflow */}
            {activeTab === "history_workflow" && (
              <Card className="shadow-lg border-muted/65 p-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-foreground">رهگیری گردش کار سند در دفاتر</h4>
                  <div className="relative border-r border-muted pr-6 space-y-6">
                    {/* Circle 1 */}
                    <div className="relative">
                      <span className="absolute right-[-29px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white">۱</span>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">ایجاد پیش‌نویس سند استهلاک</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          توسط: {voucherResult?.history?.created_by || "کاربر جاری سیستم"} | تاریخ: {voucherResult?.history?.created_at ? new Date(voucherResult.history.created_at).toLocaleDateString("fa-IR") : "ثبت نشده"}
                        </p>
                      </div>
                    </div>

                    {/* Circle 2 */}
                    <div className="relative">
                      <span className={cn(
                        "absolute right-[-29px] top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white",
                        status === "ثبت شده" || status === "تأیید شده" ? "bg-green-600" : "bg-slate-300 dark:bg-slate-700"
                      )}>۲</span>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">ثبت نهایی و ارسال به دفتر کل</p>
                        {voucherResult?.history?.posted_at ? (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            توسط: {voucherResult?.history?.posted_by} | تاریخ: {new Date(voucherResult.history.posted_at).toLocaleDateString("fa-IR")}
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-0.5">در انتظار تایید نهایی</p>
                        )}
                      </div>
                    </div>

                    {/* Circle 3 */}
                    <div className="relative">
                      <span className={cn(
                        "absolute right-[-29px] top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white",
                        status === "تأیید شده" ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                      )}>۳</span>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">تأیید نهایی ذیحسابی و امضا</p>
                        {voucherResult?.history?.approved_at ? (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            توسط: {voucherResult?.history?.approved_by} | تاریخ: {new Date(voucherResult.history.approved_at).toLocaleDateString("fa-IR")}
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-0.5">در انتظار تایید ذیحساب</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-bold text-xs text-foreground">اسناد ثبت‌شده قبلی همین دوره</h4>
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                          <TableHead className="text-right">شماره سند</TableHead>
                          <TableHead className="text-right">تاریخ سند</TableHead>
                          <TableHead className="text-right">ماه</TableHead>
                          <TableHead className="text-left">جمع کل مبلغ (ریال)</TableHead>
                          <TableHead className="text-center">وضعیت سند</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs">
                        {historicalVouchers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                              تاریخچه‌ای یافت نشد.
                            </TableCell>
                          </TableRow>
                        ) : (
                          historicalVouchers.map((v) => (
                            <TableRow key={v._id}>
                              <TableCell className="font-semibold text-blue-600">{toPersianDigits(v.voucher_number)}</TableCell>
                              <TableCell>{toPersianDigits(v.voucher_date)}</TableCell>
                              <TableCell>{v.month}</TableCell>
                              <TableCell className="text-left font-bold">{formatRial(v.summary.total_debit)}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={cn(
                                  "text-[9px] px-2 py-0.5 rounded font-bold border",
                                  v.status === "پیش‌نویس" && "bg-amber-50 text-amber-700 border-amber-200",
                                  v.status === "ثبت شده" && "bg-blue-50 text-blue-700 border-blue-200",
                                  v.status === "تأیید شده" && "bg-green-50 text-green-700 border-green-200"
                                )}>
                                  {v.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap gap-2.5 p-4 border rounded-xl bg-card shadow-lg print:hidden">
            <Button
              onClick={handlePreview}
              disabled={isSimulating || status === "ثبت شده" || status === "تأیید شده"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              <Play className="w-3.5 h-3.5 ml-1.5" />
              {isSimulating ? "درحال بررسی..." : "پیش‌نمایش سند"}
            </Button>

            <Button
              onClick={handleIssue}
              disabled={!voucherResult || status === "ثبت شده" || status === "تأیید شده"}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <Save className="w-3.5 h-3.5 ml-1.5" />
              صدور سند استهلاک
            </Button>

            <Button
              onClick={handleFinalize}
              disabled={!voucherResult?._id || status !== "پیش‌نویس"}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              <Send className="w-3.5 h-3.5 ml-1.5" />
              ثبت نهایی در دفتر کل
            </Button>

            <Button
              onClick={handleSendForApproval}
              disabled={!voucherResult?._id || status === "تأیید شده"}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
              ارسال برای تأیید
            </Button>

            <Button
              variant="outline"
              onClick={handleReissue}
              disabled={!voucherResult || status === "تأیید شده"}
              className="text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5 ml-1.5 text-blue-500" />
              صدور مجدد
            </Button>

            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={!voucherResult || status === "تأیید شده"}
              className="text-xs font-bold hover:bg-rose-50 text-rose-600 hover:text-rose-700 border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5 ml-1.5" />
              حذف سند
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!voucherResult}
              className="text-xs font-bold mr-auto"
            >
              <Printer className="w-3.5 h-3.5 ml-1.5 text-slate-500" />
              چاپ سند
            </Button>

            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={!voucherResult}
              className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <FileDown className="w-3.5 h-3.5 ml-1.5" />
              خروجی PDF
            </Button>

            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={!voucherResult}
              className="text-xs font-bold text-green-700 hover:text-green-800 border-green-200 hover:bg-green-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 ml-1.5" />
              خروجی Excel
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
