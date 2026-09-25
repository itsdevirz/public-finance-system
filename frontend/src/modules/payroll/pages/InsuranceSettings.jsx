import { useState, useEffect, useMemo } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ShieldCheck, Save, Plus, Trash2, Edit, RefreshCw, AlertCircle, CheckCircle,
  Info, Percent, Building, Calendar, History, Settings, ToggleLeft, ToggleRight,
  MinusCircle, ReceiptText, PiggyBank, HeartPulse, Landmark, Wallet, ShieldAlert
} from "lucide-react";

// لیست ثابت اقلام حقوقی و برچسب‌های فارسی آن‌ها
const WAGE_ITEMS = [
  { key: "baseSalary", label: "حقوق پایه (دستمزد مبنا)", desc: "پایه سنوات و حقوق ماهانه مصوب" },
  { key: "housingAllowance", label: "حق مسکن", desc: "کمک هزینه مسکن کارگری مصوب" },
  { key: "groceryAllowance", label: "بن کارگری (خواربار)", desc: "کمک هزینه اقلام مصرفی" },
  { key: "childAllowance", label: "حق اولاد", desc: "کمک هزینه عائله‌مندی فرزندان" },
  { key: "overtimePay", label: "فوق‌العاده اضافه‌کاری", desc: "کارکرد بیش از ساعات موظفی" },
  { key: "missionPay", label: "فوق‌العاده مأموریت", desc: "کمک هزینه سفر کاری و مأموریت" },
  { key: "shiftWorkPay", label: "فوق‌العاده نوبت کاری", desc: "نوبت‌کاری‌های موظف غیر نوبتی" },
  { key: "seniorityPay", label: "پایه سنوات", desc: "سابقه خدمت سالانه کارگاه" },
  { key: "responsibilityPay", label: "حق جذب / مسئولیت", desc: "فوق‌العاده جذب و سرپرستی" },
  { key: "expertisePay", label: "فوق‌العاده تخصصی / فنی", desc: "فوق‌العاده مهارت کار با تجهیزات" },
  { key: "eidBonus", label: "عیدی و پاداش سالانه", desc: "عیدی پایان سال مصوب قانون کار" },
  { key: "severancePay", label: "سنوات پایان خدمت", desc: "پاداش پایان خدمت بازنشستگی/تسویه" }
];

// تبدیل تمام ارقام انگلیسی به فارسی
export function toPersianDigits(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// تبدیل تمام ارقام فارسی به انگلیسی (برای مقادیر عددی بک‌اند)
export function toEnglishDigits(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  return str.replace(/[۰-۹]/g, (w) => String(w.charCodeAt(0) - 1776));
}

const DEFAULT_FORM = {
  year: "1405",
  insEmployeeRate: "7",
  insEmployerRate: "20",
  insUnemployRate: "3",
  insHardJobsRate: "4",
  insMaxBase: "700000000",
  insMaxBaseDays: "30",
  // ۴ آیتم کسورات + پس‌انداز
  healthEmployeeRate: "2",    // خدمات درمانی سهم کارمند (کاهنده حقوق)
  healthEmployerRate: "2",    // خدمات درمانی سهم دستگاه
  healthGovtRate: "3",        // خدمات درمانی سهم دولت
  retireEmployeeRate: "9",    // بازنشستگی سهم کارمند (کاهنده حقوق)
  retireEmployerRate: "16.5", // بازنشستگی سهم دستگاه/دولت
  taxEmployeeRate: "10",      // مالیات حقوق (پایه کسر)
  savingsAccountRate: "3",    // حساب پس‌انداز کارمند (درصد کاهنده حقوق)
  savingsAccountFixed: "0",   // حساب پس‌انداز کارمند (مبلغ ثابت کاهنده حقوق - ریال)
  savingsAccountEnabled: true,
  workshopName: "",
  workshopCode: "1023456789",
  insuranceBranch: "شعبه مرکزی تامین اجتماعی",
  contractRow: "01",
  inclusiveItems: {
    baseSalary: true,
    housingAllowance: true,
    groceryAllowance: true,
    childAllowance: false,
    overtimePay: true,
    missionPay: false,
    shiftWorkPay: true,
    seniorityPay: true,
    responsibilityPay: true,
    expertisePay: true,
    eidBonus: false,
    severancePay: false
  },
  active: true
};

export default function InsuranceSettings() {
  const { insuranceSettings, addConfig, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();

  const [activeTab, setActiveTab] = useState("rates"); // rates | deductions | items | workshop | history
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  // در ابتدا اگر رکوردی برای سال جاری بود آن را لود کن
  useEffect(() => {
    if (insuranceSettings && insuranceSettings.length > 0) {
      // پیدا کردن سال 1405 یا آخرین سال ذخیره شده
      const currentYear = insuranceSettings.find(s => s.year === "1405" && s.active !== false) || insuranceSettings[0];
      if (currentYear) {
        loadRecord(currentYear);
      }
    }
  }, [insuranceSettings]);

  function loadRecord(record) {
    setForm({
      ...DEFAULT_FORM,
      ...record,
      insEmployeeRate: String(record.insEmployeeRate ?? "7"),
      insEmployerRate: String(record.insEmployerRate ?? "20"),
      insUnemployRate: String(record.insUnemployRate ?? "3"),
      insHardJobsRate: String(record.insHardJobsRate ?? "4"),
      healthEmployeeRate: String(record.healthEmployeeRate ?? "2"),
      healthEmployerRate: String(record.healthEmployerRate ?? "2"),
      healthGovtRate: String(record.healthGovtRate ?? "3"),
      retireEmployeeRate: String(record.retireEmployeeRate ?? "9"),
      retireEmployerRate: String(record.retireEmployerRate ?? "16.5"),
      taxEmployeeRate: String(record.taxEmployeeRate ?? "10"),
      savingsAccountRate: String(record.savingsAccountRate ?? "3"),
      savingsAccountFixed: String(record.savingsAccountFixed ?? "0"),
      savingsAccountEnabled: record.savingsAccountEnabled ?? true,
      insMaxBase: String(record.insMaxBase ?? "700000000"),
      insMaxBaseDays: String(record.insMaxBaseDays ?? "30"),
      year: String(record.year ?? "1405"),
      workshopCode: String(record.workshopCode ?? "1023456789"),
      contractRow: String(record.contractRow ?? "01"),
      inclusiveItems: {
        ...DEFAULT_FORM.inclusiveItems,
        ...(record.inclusiveItems || {})
      }
    });
    setEditingId(record._id || record.id);
    setSuccessMsg("");
    setErrorMsg("");
  }

  function handleInputChange(field, value) {
    let sanitizedValue = typeof value === "string" ? toEnglishDigits(value) : value;
    
    if (typeof sanitizedValue === "string" && (field.includes("Rate") || field.includes("Fixed") || field === "insMaxBase" || field === "insMaxBaseDays" || field === "year" || field === "workshopCode" || field === "contractRow")) {
      if (field.includes("Rate")) {
        sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, "");
      } else {
        sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
      }
    }

    setForm(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    setSuccessMsg("");
    setErrorMsg("");
  }

  function handleToggleItem(key) {
    setForm(prev => ({
      ...prev,
      inclusiveItems: {
        ...prev.inclusiveItems,
        [key]: !prev.inclusiveItems[key]
      }
    }));
    setSuccessMsg("");
    setErrorMsg("");
  }

  function handleSelectAllItems(val) {
    setForm(prev => {
      const nextItems = {};
      WAGE_ITEMS.forEach(item => {
        nextItems[item.key] = val;
      });
      return { ...prev, inclusiveItems: nextItems };
    });
  }

  function handleReset() {
    if (window.confirm("آیا از بازنشانی فرم به تنظیمات استاندارد بیمه و کسورات قانونی مطمئن هستید؟")) {
      setForm(DEFAULT_FORM);
      setEditingId(null);
      setSuccessMsg("فرم به حالت پیش‌فرض بیمه و کسورات بازنشانی شد.");
    }
  }

  async function handleSave() {
    if (!form.year.trim()) {
      setErrorMsg("وارد کردن سال مالی الزامی است.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      // تبدیل داده‌های فرم به فرمت نهایی مناسب برای دیتابیس
      const payload = {
        ...form,
        year: toEnglishDigits(form.year),
        insEmployeeRate: Number(toEnglishDigits(form.insEmployeeRate)) || 0,
        insEmployerRate: Number(toEnglishDigits(form.insEmployerRate)) || 0,
        insUnemployRate: Number(toEnglishDigits(form.insUnemployRate)) || 0,
        insHardJobsRate: Number(toEnglishDigits(form.insHardJobsRate)) || 0,
        healthEmployeeRate: Number(toEnglishDigits(form.healthEmployeeRate)) || 0,
        healthEmployerRate: Number(toEnglishDigits(form.healthEmployerRate)) || 0,
        healthGovtRate: Number(toEnglishDigits(form.healthGovtRate)) || 0,
        retireEmployeeRate: Number(toEnglishDigits(form.retireEmployeeRate)) || 0,
        retireEmployerRate: Number(toEnglishDigits(form.retireEmployerRate)) || 0,
        taxEmployeeRate: Number(toEnglishDigits(form.taxEmployeeRate)) || 0,
        savingsAccountRate: Number(toEnglishDigits(form.savingsAccountRate)) || 0,
        savingsAccountFixed: Number(toEnglishDigits(form.savingsAccountFixed)) || 0,
        savingsAccountEnabled: form.savingsAccountEnabled !== false,
        insMaxBase: Number(toEnglishDigits(form.insMaxBase)) || 0,
        insMaxBaseDays: Number(toEnglishDigits(form.insMaxBaseDays)) || 30,
        workshopCode: toEnglishDigits(form.workshopCode),
        contractRow: toEnglishDigits(form.contractRow)
      };

      // ذخیره همزمان در localStorage جهت همگام‌سازی فوری در تمام تب‌ها
      localStorage.setItem("insurance_settings", JSON.stringify(payload));

      if (editingId) {
        payload.id = editingId;
        payload._id = editingId;
        await updateConfig("insurance_settings", payload);
        setSuccessMsg(`تنظیمات بیمه و کسورات سال ${form.year} با موفقیت به‌روزرسانی شد.`);
      } else {
        const saved = await addConfig("insurance_settings", payload);
        if (saved) {
          setEditingId(saved._id || saved.id);
        }
        setSuccessMsg(`تنظیمات بیمه و کسورات سال ${form.year} با موفقیت ثبت شد.`);
      }
      await refreshAllConfigs();
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ذخیره‌سازی اطلاعات در سرور.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id, year) {
    if (window.confirm(`آیا از حذف تنظیمات بیمه سال ${year} مطمئن هستید؟`)) {
      try {
        await deleteConfig("insurance_settings", id);
        setSuccessMsg(`تنظیمات بیمه سال ${year} حذف شد.`);
        if (editingId === id) {
          setForm(DEFAULT_FORM);
          setEditingId(null);
        }
        await refreshAllConfigs();
      } catch (err) {
        console.error(err);
        setErrorMsg("خطا در حذف رکورد.");
      }
    }
  }

  // محاسبه مجموع درصد پرداختی بیمه
  const totalInsRate = useMemo(() => {
    return (Number(form.insEmployeeRate || 0) + Number(form.insEmployerRate || 0) + Number(form.insUnemployRate || 0)).toFixed(1);
  }, [form.insEmployeeRate, form.insEmployerRate, form.insUnemployRate]);

  // مبدل پول به ریال/تومان شکیل
  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString("fa-IR");
  };

  return (
    <div className="space-y-5 text-right pb-10" dir="rtl">
      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600 animate-pulse" />
            تنظیمات بیمه تامین اجتماعی
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            تنظیم ضرایب حق بیمه، سقف‌های پرداخت، اقلام حقوقی مشمول بیمه و مشخصات شعب تامین اجتماعی کارگاه.
          </p>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <Button variant="outline" size="sm" onClick={() => {
              setForm(DEFAULT_FORM);
              setEditingId(null);
              setSuccessMsg("فرم آماده تعریف تنظیمات برای سال جدید است.");
            }} className="h-9 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
              <Plus className="h-3.5 w-3.5" /> تعریف سال جدید
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="h-9 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> بازنشانی مقادیر
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Save className="h-4 w-4" /> {isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </Button>
        </div>
      </div>

      {/* راهنمای کاربر در مورد وضعیت ویرایش/تعریف */}
      {editingId ? (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-indigo-500" />
            <span>شما در حال ویرایش تنظیمات سال مالی <strong className="text-indigo-900 font-extrabold">{form.year}</strong> هستید. تغییرات روی این سال ثبت می‌شود.</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => {
            setForm(DEFAULT_FORM);
            setEditingId(null);
            setSuccessMsg("فرم آماده تعریف تنظیمات برای سال جدید است.");
          }} className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-100 border border-indigo-100">انصراف و ثبت سال جدید</Button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
          <Info className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>شما در حال ایجاد پیکربندی بیمه برای یک سال جدید هستید. لطفاً سال مالی و مقادیر را مشخص کنید.</span>
        </div>
      )}

      {/* نمایش نوتیفیکیشن‌ها */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {/* سیستم تب‌بندی پیشرفته و زیبا */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* سایدبار ناوبری تب‌ها */}
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardContent className="p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("rates")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-bold transition-all ${activeTab === "rates"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
            >
              <Percent className="h-4.5 w-4.5" />
              <span>نرخ‌ها و سقف‌های بیمه</span>
            </button>
            <button
              onClick={() => setActiveTab("deductions")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-bold transition-all ${activeTab === "deductions"
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
            >
              <MinusCircle className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
              <span className="flex-1 font-extrabold text-rose-800 dark:text-rose-300">سربرگ کسورات حقوق</span>
              <Badge className="bg-rose-500 text-white text-[9px] px-1.5 py-0 font-mono">۵ آیتم</Badge>
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-bold transition-all ${activeTab === "items"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>اقلام حقوقی مشمول بیمه</span>
            </button>
            <button
              onClick={() => setActiveTab("workshop")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-bold transition-all ${activeTab === "workshop"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
            >
              <Building className="h-4.5 w-4.5" />
              <span>اطلاعات کارگاه و شعبه</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-right text-xs font-bold transition-all ${activeTab === "history"
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
            >
              <History className="h-4.5 w-4.5" />
              <span className="flex-1">سوابق تنظیمات سالانه</span>
              {insuranceSettings && insuranceSettings.length > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {insuranceSettings.length}
                </Badge>
              )}
            </button>
          </CardContent>
        </Card>

        {/* محتوای تب فعال */}
        <div className="lg:col-span-3 space-y-6">
          {/* تب اول: نرخ‌ها و سقف‌ها */}
          {activeTab === "rates" && (
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Percent className="h-4 w-4 text-indigo-600" />
                  نرخ‌های حق بیمه و سقف دستمزد مبنا
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-1">
                  ضرایب قانونی کسر بیمه تامین اجتماعی به تفکیک سهم کارمند، کارفرما و بیمه بیکاری
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* بخش سال مالی */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="year" className="text-xs font-bold text-slate-700">سال اجرایی تنظیمات</Label>
                    <Input
                      id="year"
                      type="text"
                      maxLength={4}
                      value={toPersianDigits(form.year)}
                      onChange={e => handleInputChange("year", e.target.value)}
                      className="h-9 text-xs text-left font-mono"
                      placeholder="مثال: ۱۴۰۵"
                    />
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>این تنظیمات ملاک محاسبه لیست حقوق و بیمه سال اجرایی انتخاب شده خواهد بود.</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ضرایب بیمه */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-indigo-600 border-r-2 border-indigo-600 pr-2">درصد سهم بیمه</h4>

                    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                      <div>
                        <Label htmlFor="insEmployeeRate" className="text-xs font-semibold text-slate-700">سهم کارمند (بیمه‌شده)</Label>
                        <span className="block text-[10px] text-slate-400 mt-0.5">کسر مستقیم از فیش حقوقی کارمند</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          id="insEmployeeRate"
                          type="text"
                          value={toPersianDigits(form.insEmployeeRate)}
                          onChange={e => handleInputChange("insEmployeeRate", e.target.value)}
                          className="h-8 text-xs w-24 text-left font-mono"
                        />
                        <span className="text-[11px] text-slate-500 w-6">٪</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                      <div>
                        <Label htmlFor="insEmployerRate" className="text-xs font-semibold text-slate-700">سهم کارفرما</Label>
                        <span className="block text-[10px] text-slate-400 mt-0.5">سهم هزینه‌ای کارفرما بابت بیمه عمومی</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          id="insEmployerRate"
                          type="text"
                          value={toPersianDigits(form.insEmployerRate)}
                          onChange={e => handleInputChange("insEmployerRate", e.target.value)}
                          className="h-8 text-xs w-24 text-left font-mono"
                        />
                        <span className="text-[11px] text-slate-500 w-6">٪</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                      <div>
                        <Label htmlFor="insUnemployRate" className="text-xs font-semibold text-slate-700">بیمه بیکاری (سهم کارفرما)</Label>
                        <span className="block text-[10px] text-slate-400 mt-0.5">سهم اجباری بیکاری قانون کار</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          id="insUnemployRate"
                          type="text"
                          value={toPersianDigits(form.insUnemployRate)}
                          onChange={e => handleInputChange("insUnemployRate", e.target.value)}
                          className="h-8 text-xs w-24 text-left font-mono"
                        />
                        <span className="text-[11px] text-slate-500 w-6">٪</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                      <div>
                        <Label htmlFor="insHardJobsRate" className="text-xs font-semibold text-slate-700">اضافه حق بیمه مشاغل سخت</Label>
                        <span className="block text-[10px] text-slate-400 mt-0.5">حق بیمه کارهای سخت و زیان‌آور (سهم کارفرما)</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Input
                          id="insHardJobsRate"
                          type="text"
                          value={toPersianDigits(form.insHardJobsRate)}
                          onChange={e => handleInputChange("insHardJobsRate", e.target.value)}
                          className="h-8 text-xs w-24 text-left font-mono"
                        />
                        <span className="text-[11px] text-slate-500 w-6">٪</span>
                      </div>
                    </div>
                  </div>

                  {/* سقف بیمه */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-indigo-600 border-r-2 border-indigo-600 pr-2">سقف مبنای بیمه</h4>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="insMaxBase" className="text-xs font-semibold text-slate-700">سقف حقوق ماهانه مشمول بیمه</Label>
                        <Input
                          id="insMaxBase"
                          type="text"
                          value={toPersianDigits(form.insMaxBase)}
                          onChange={e => handleInputChange("insMaxBase", e.target.value)}
                          className="h-9 text-xs text-left font-mono"
                          placeholder="مثال: ۷۰۰۰۰۰۰۰۰"
                        />
                        <span className="block text-[10px] text-slate-400">
                          معادل: <strong className="text-indigo-600 font-bold">{formatCurrency(form.insMaxBase)} ریال</strong> ({formatCurrency(Number(toEnglishDigits(form.insMaxBase)) / 10)} تومان)
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="insMaxBaseDays" className="text-xs font-semibold text-slate-700">مبنای روزهای کارکرد سقف</Label>
                        <Input
                          id="insMaxBaseDays"
                          type="text"
                          value={toPersianDigits(form.insMaxBaseDays)}
                          onChange={e => handleInputChange("insMaxBaseDays", e.target.value)}
                          className="h-9 text-xs text-left font-mono"
                        />
                      </div>
                    </div>

                    {/* ویجت خلاصه محاسبات */}
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30 mt-6">
                      <h5 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">خلاصه ضرایب و مبالغ</h5>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <span className="text-[10px] text-slate-500 block">جمع کل نرخ بیمه:</span>
                          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">{totalInsRate} ٪</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">حداکثر سهم کارمند:</span>
                          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">
                            {formatCurrency(Math.round(form.insMaxBase * (form.insEmployeeRate / 100)))} ریال
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-indigo-100/50">
                          <span className="text-[10px] text-slate-500 block">سهم هزینه‌ای کارفرما (بدون کارهای سخت):</span>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                            {(Number(form.insEmployerRate || 0) + Number(form.insUnemployRate || 0))} ٪
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تب اختصاصی کسورات حقوق (مالیات، تامین اجتماعی، خدمات درمانی، بازنشستگی، پس‌انداز) */}
          {activeTab === "deductions" && (
            <Card className="border-rose-100 dark:border-rose-950/50 shadow-md">
              <CardHeader className="border-b bg-rose-50/40 dark:bg-rose-950/20 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <MinusCircle className="h-5 w-5 text-rose-600 animate-bounce" />
                      سربرگ اختصاصی کسورات حقوق کارمندان (کاهنده حقوق)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                      تنظیمات یکپارچه ۵ بند اصلی کسورات ماهانه: مالیات، بیمه تامین اجتماعی، بیمه خدمات درمانی، صندوق بازنشستگی و حساب پس‌انداز کارمند
                    </CardDescription>
                  </div>
                  <Badge className="bg-rose-600 text-white font-bold text-xs px-3 py-1 shadow">
                    همگی کاهنده ناخالص حقوق
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">

                {/* اطلاعیه محیط یکپارچه کسورات */}
                <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-200">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                    <span>محیط یکپارچه پیکربندی کسورات حقوق ماهانه:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed pr-6 text-slate-700 dark:text-slate-300">
                    مطابق دستورالعمل‌های امور مالی و قانون کار، هر ۵ آیتم زیر به صورت مستقیم <strong>کاهنده حقوق ناخالص کارمند</strong> هستند. مبلغ محاسبه شده برای این اقلام در فیش حقوقی، گزارشات و سیستم محاسبه کسر شده و مبلغ خالص پرداختی کارمند را تشکیل می‌دهند.
                  </p>
                </div>

                {/* گرید ۵ کسر اصلی */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* ۱. مالیات حقوق */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                          <ReceiptText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">۱. مالیات حقوق و درآمد</h4>
                          <span className="text-[10px] text-rose-600 font-bold block">کاهنده حقوق کارمند (ماده ۸۴ و ۸۵ قانون مالیات‌های مستقیم)</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-rose-200 text-rose-700 bg-rose-50">پلکانی قانون مالیات</Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-xs">
                      <div className="flex justify-between items-center py-1">
                        <Label htmlFor="taxEmployeeRate" className="text-[11px] font-semibold text-slate-700">نرخ پایه مالیات حقوق (پلکان اول)</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id="taxEmployeeRate"
                            type="text"
                            value={toPersianDigits(form.taxEmployeeRate || "10")}
                            onChange={e => handleInputChange("taxEmployeeRate", e.target.value)}
                            className="h-8 text-xs w-20 text-left font-mono"
                          />
                          <span className="text-[11px] text-slate-500">٪</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                        معافیت مالیاتی سالانه ۱۴۰۵ معادل ۱,۴۴۰,۰،۰۰۰ ریال است و مبالغ مازاد بر معافیت به صورت پلکانی از فیش حقوقی کارمند کسر می‌گردد.
                      </p>
                    </div>
                  </div>

                  {/* ۲. بیمه تامین اجتماعی */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">۲. بیمه تامین اجتماعی</h4>
                          <span className="text-[10px] text-blue-600 font-bold block">کاهنده حقوق کارمند (۷٪ سهم بیمه‌شده)</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">قانون تامین اجتماعی</Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-xs">
                      <div className="flex justify-between items-center py-1">
                        <Label htmlFor="insEmployeeRate_ded" className="text-[11px] font-semibold text-slate-700">سهم کسر مستقیم از حقوق کارمند</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id="insEmployeeRate_ded"
                            type="text"
                            value={toPersianDigits(form.insEmployeeRate || "7")}
                            onChange={e => handleInputChange("insEmployeeRate", e.target.value)}
                            className="h-8 text-xs w-20 text-left font-mono"
                          />
                          <span className="text-[11px] text-slate-500">٪</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>سهم کارفرما: <strong className="text-slate-700">{form.insEmployerRate}٪</strong></span>
                        <span>بیمه بیکاری: <strong className="text-slate-700">{form.insUnemployRate}٪</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* ۳. بیمه خدمات درمانی */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-teal-500" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                          <HeartPulse className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">۳. بیمه خدمات درمانی (سلامت)</h4>
                          <span className="text-[10px] text-teal-600 font-bold block">کاهنده حقوق کارمند (سهم بیمه درمان)</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-700 bg-teal-50">بیمه سلامت/درمان</Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-xs">
                      <div className="flex justify-between items-center py-1">
                        <Label htmlFor="healthEmployeeRate" className="text-[11px] font-semibold text-slate-700">سهم کسر درمان از حقوق کارمند</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id="healthEmployeeRate"
                            type="text"
                            value={toPersianDigits(form.healthEmployeeRate || "2")}
                            onChange={e => handleInputChange("healthEmployeeRate", e.target.value)}
                            className="h-8 text-xs w-20 text-left font-mono"
                          />
                          <span className="text-[11px] text-slate-500">٪</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                        <div className="flex justify-between">
                          <span>سهم دستگاه/کارفرما:</span>
                          <span className="font-bold font-mono">{form.healthEmployerRate || "2"}٪</span>
                        </div>
                        <div className="flex justify-between">
                          <span>سهم دولت:</span>
                          <span className="font-bold font-mono">{form.healthGovtRate || "3"}٪</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ۴. صندوق بازنشستگی */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-purple-500" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">۴. صندوق بازنشستگی (کشوری/عمومی)</h4>
                          <span className="text-[10px] text-purple-600 font-bold block">کاهنده حقوق کارمند (کسر حق بازنشستگی)</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-purple-200 text-purple-700 bg-purple-50">صندوق بازنشستگی</Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-xs">
                      <div className="flex justify-between items-center py-1">
                        <Label htmlFor="retireEmployeeRate" className="text-[11px] font-semibold text-slate-700">سهم کسر بازنشستگی کارمند</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id="retireEmployeeRate"
                            type="text"
                            value={toPersianDigits(form.retireEmployeeRate || "9")}
                            onChange={e => handleInputChange("retireEmployeeRate", e.target.value)}
                            className="h-8 text-xs w-20 text-left font-mono"
                          />
                          <span className="text-[11px] text-slate-500">٪</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                        <span>سهم دستگاه / دولت: <strong className="text-slate-700 font-mono">{form.retireEmployerRate || "16.5"}٪</strong></span>
                        <span>مبنا: <strong className="text-slate-700">حقوق پایه + فوق‌العاده‌ها</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* ۵. حساب پس‌انداز کارمند */}
                  <div className="md:col-span-2 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-emerald-500" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          <PiggyBank className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">۵. حساب پس‌انداز کارمند (پس‌انداز اختیاری / کارگاهی)</h4>
                          <span className="text-[10px] text-emerald-700 font-bold block">کاهنده حقوق کارمند (واریز مستقیم به حساب پس‌انداز پرسنل)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-white text-[10px]">کسر ماهانه پس‌انداز</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/60 text-xs">
                      <div className="space-y-1.5">
                        <Label htmlFor="savingsAccountRate" className="text-[11px] font-bold text-slate-700">درصد کسر پس‌انداز از ناخالص حقوق</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            id="savingsAccountRate"
                            type="text"
                            value={toPersianDigits(form.savingsAccountRate || "3")}
                            onChange={e => handleInputChange("savingsAccountRate", e.target.value)}
                            className="h-8 text-xs w-28 text-left font-mono"
                          />
                          <span className="text-[11px] text-slate-500">٪ از حقوق</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="savingsAccountFixed" className="text-[11px] font-bold text-slate-700">یا مبلغ ثابت کسر پس‌انداز (در صورت عدم استفاده از درصد)</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            id="savingsAccountFixed"
                            type="text"
                            value={toPersianDigits(form.savingsAccountFixed || "0")}
                            onChange={e => handleInputChange("savingsAccountFixed", e.target.value)}
                            className="h-8 text-xs font-mono text-left"
                            placeholder="مثال: ۵۰۰۰۰۰۰"
                          />
                          <span className="text-[11px] text-slate-500 shrink-0">ریال/ماه</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ویجت مجموع درصد کسورات پایه کارمند */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                      <h4 className="text-xs font-extrabold text-white">خلاصه کل کسورات حقوق کارمند در یک نگاه</h4>
                    </div>
                    <Badge className="bg-emerald-500 text-slate-950 font-black text-xs">جمع کل کسورات پایه</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-1">مالیات حقوق</span>
                      <span className="text-xs font-bold text-rose-400 font-mono">بر اساس جدول</span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-1">تامین اجتماعی</span>
                      <span className="text-xs font-extrabold text-blue-400 font-mono">{form.insEmployeeRate || 7} ٪</span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-1">خدمات درمانی</span>
                      <span className="text-xs font-extrabold text-teal-400 font-mono">{form.healthEmployeeRate || 2} ٪</span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-1">بازنشستگی</span>
                      <span className="text-xs font-extrabold text-purple-400 font-mono">{form.retireEmployeeRate || 9} ٪</span>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 col-span-2 md:col-span-1">
                      <span className="text-[10px] text-slate-400 block mb-1">حساب پس انداز</span>
                      <span className="text-xs font-extrabold text-emerald-400 font-mono">
                        {Number(form.savingsAccountFixed || 0) > 0 ? `${formatCurrency(form.savingsAccountFixed)} ریال` : `${form.savingsAccountRate || 3} ٪`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 pt-2 text-center border-t border-slate-800 font-bold">
                    💡 تمام اقلام فوق در محاسبه لیست حقوق و فیش حقوقی به عنوان <span className="text-rose-400 underline font-black">کسورات حقوق (کاهنده حقوق کارمند)</span> محاسبه می‌گردند.
                  </div>
                </div>

              </CardContent>
            </Card>
          )}

          {/* تب دوم: اقلام مشمول بیمه */}
          {activeTab === "items" && (
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-indigo-600" />
                      اقلام حقوقی مشمول کسر حق بیمه
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground mt-1">
                      مشخص کنید کدام یک از فیلدهای فیش حقوقی کارمندان مشمول بیمه هستند و در محاسبات لحاظ می‌شوند.
                    </CardDescription>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="outline" size="xs" onClick={() => handleSelectAllItems(true)} className="h-7 text-[10px] px-2">انتخاب همه</Button>
                    <Button variant="outline" size="xs" onClick={() => handleSelectAllItems(false)} className="h-7 text-[10px] px-2 text-rose-600 hover:bg-rose-50 border-rose-200">عدم انتخاب همه</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="text-right text-xs font-bold text-slate-700 w-12">ردیف</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-700">قلم حقوقی</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-700 hidden md:table-cell">توضیحات مبنا</TableHead>
                      <TableHead className="text-center text-xs font-bold text-slate-700 w-32">وضعیت شمول بیمه</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {WAGE_ITEMS.map((item, idx) => {
                      const isInclusive = form.inclusiveItems?.[item.key] ?? false;
                      return (
                        <TableRow key={item.key} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="text-right text-xs font-mono text-slate-500">{idx + 1}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-800">{item.label}</TableCell>
                          <TableCell className="text-right text-[11px] text-slate-500 hidden md:table-cell">{item.desc}</TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleItem(item.key)}
                              className="focus:outline-none transition-transform active:scale-95 inline-flex items-center justify-center"
                            >
                              {isInclusive ? (
                                <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200/50">
                                  <ToggleRight className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                                  مشمول بیمه
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                  <ToggleLeft className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                                  معاف از بیمه
                                </span>
                              )}
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* تب سوم: اطلاعات کارگاه و شعبه */}
          {activeTab === "workshop" && (
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  اطلاعات کارگاه و شعب تامین اجتماعی
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-1">
                  مشخصات کد کارگاهی ده رقمی و ردیف پیمان برای درج در دیسکت خروجی بیمه ماهانه
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="workshopName" className="text-xs font-semibold text-slate-700">نام کارگاه / سازمان</Label>
                    <Input
                      id="workshopName"
                      type="text"
                      value={form.workshopName}
                      onChange={e => handleInputChange("workshopName", e.target.value)}
                      className="h-9 text-xs"
                      placeholder="مثال: دفتر مرکزی شرکت تهران"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="workshopCode" className="text-xs font-semibold text-slate-700">کد کارگاه (۱۰ رقم)</Label>
                    <Input
                      id="workshopCode"
                      type="text"
                      maxLength={10}
                      value={toPersianDigits(form.workshopCode)}
                      onChange={e => handleInputChange("workshopCode", e.target.value)}
                      className="h-9 text-xs text-left font-mono"
                      placeholder="مثال: ۱۰۲۳۴۵۶۷۸۹"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="insuranceBranch" className="text-xs font-semibold text-slate-700">شعبه تامین اجتماعی مربوطه</Label>
                    <Input
                      id="insuranceBranch"
                      type="text"
                      value={form.insuranceBranch}
                      onChange={e => handleInputChange("insuranceBranch", e.target.value)}
                      className="h-9 text-xs"
                      placeholder="مثال: شعبه ۴ تامین اجتماعی تهران"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contractRow" className="text-xs font-semibold text-slate-700">ردیف پیمان (در صورت وجود)</Label>
                    <Input
                      id="contractRow"
                      type="text"
                      value={toPersianDigits(form.contractRow)}
                      onChange={e => handleInputChange("contractRow", e.target.value)}
                      className="h-9 text-xs font-mono text-left"
                      placeholder="مثال: ۰۱"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mt-4 text-[11px] text-slate-600 flex items-start gap-2.5">
                  <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-slate-800 dark:text-slate-200 block font-bold mb-1">در ساخت دیسکت‌های بیمه (DBF)دقت فرمایید:</strong>
                    کد کارگاه و نام شعبه تامین اجتماعی باید کاملا مطابق اطلاعات ثبت شده در سامانه ارسال لیست حق بیمه کارفرمایان تامین اجتماعی باشد تا در زمان بارگذاری فایل با خطای ناهمخوانی روبرو نشوید.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* تب چهارم: سوابق سالانه */}
          {activeTab === "history" && (
            <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  سوابق و تاریخچه تنظیمات بیمه
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-1">
                  لیست پیکربندی‌های ذخیره شده برای سال‌های مالی گذشته یا تعریف شده برای آینده
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!insuranceSettings || insuranceSettings.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <History className="h-10 w-10 mx-auto text-slate-300 stroke-1 mb-2" />
                    <p className="text-xs">هیچ سابقه‌ای در دیتابیس ثبت نشده است.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="text-right text-xs font-bold text-slate-700">سال مالی</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">نام کارگاه</TableHead>
                        <TableHead className="text-center text-xs font-bold text-slate-700">جمع درصد بیمه</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">سقف مشمول بیمه (ریال)</TableHead>
                        <TableHead className="text-center text-xs font-bold text-slate-700">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insuranceSettings.map((record) => {
                        const totalRate = (Number(record.insEmployeeRate || 0) + Number(record.insEmployerRate || 0) + Number(record.insUnemployRate || 0)).toFixed(1);
                        const isCurrent = editingId === (record._id || record.id);
                        return (
                          <TableRow key={record._id || record.id} className={`hover:bg-slate-50/50 transition-colors ${isCurrent ? "bg-indigo-50/20" : ""}`}>
                            <TableCell className="text-right text-xs font-bold text-indigo-600 font-mono">
                              {record.year}
                              {isCurrent && (
                                <Badge variant="secondary" className="mr-2 text-[9px] px-1 py-0 bg-indigo-100 text-indigo-800 font-normal">
                                  در حال ویرایش
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-700">{record.workshopName || "—"}</TableCell>
                            <TableCell className="text-center text-xs font-bold font-mono text-slate-800">{totalRate}٪</TableCell>
                            <TableCell className="text-right text-xs font-mono text-slate-600">{formatCurrency(record.insMaxBase)}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => loadRecord(record)}
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleDelete(record._id || record.id, record.year)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
