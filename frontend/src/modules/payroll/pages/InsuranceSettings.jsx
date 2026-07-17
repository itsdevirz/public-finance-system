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
  Info, Percent, Building, Calendar, History, Settings, ToggleLeft, ToggleRight
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
  year: "",
  insEmployeeRate: "",
  insEmployerRate: "",
  insUnemployRate: "",
  insHardJobsRate: "",
  insMaxBase: "",
  insMaxBaseDays: "",
  workshopName: "",
  workshopCode: "",
  insuranceBranch: "",
  contractRow: "",
  inclusiveItems: {
    baseSalary: false,
    housingAllowance: false,
    groceryAllowance: false,
    childAllowance: false,
    overtimePay: false,
    missionPay: false,
    shiftWorkPay: false,
    seniorityPay: false,
    responsibilityPay: false,
    expertisePay: false,
    eidBonus: false,
    severancePay: false
  },
  active: true
};

export default function InsuranceSettings() {
  const { insuranceSettings, addConfig, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();

  const [activeTab, setActiveTab] = useState("rates"); // rates | items | workshop | history
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
      insMaxBase: String(record.insMaxBase ?? "700000000"),
      insMaxBaseDays: String(record.insMaxBaseDays ?? "30"),
      year: String(record.year ?? "1405"),
      workshopCode: String(record.workshopCode ?? ""),
      contractRow: String(record.contractRow ?? ""),
      inclusiveItems: {
        ...DEFAULT_FORM.inclusiveItems,
        ...(record.inclusiveItems || {})
      }
    });
    setEditingId(record._id || record.id);
    setSuccessMsg("");
    setErrorMsg("");
    setActiveTab("rates"); // هدایت خودکار کاربر به تب نرخ‌ها و سقف‌ها جهت ویرایش راحت‌تر
  }

  function handleInputChange(field, value) {
    let sanitizedValue = toEnglishDigits(value);
    
    if (field.includes("Rate") || field === "insMaxBase" || field === "insMaxBaseDays" || field === "year" || field === "workshopCode" || field === "contractRow") {
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
    if (window.confirm("آیا از بازنشانی فرم به تنظیمات استاندارد تامین اجتماعی مطمئن هستید؟")) {
      setForm(DEFAULT_FORM);
      setEditingId(null);
      setSuccessMsg("فرم به حالت پیش‌فرض تامین اجتماعی بازنشانی شد.");
    }
  }

  async function handleSave() {
    if (!form.year.trim()) {
      setErrorMsg("وارد کردن سال مالی الزامی است.");
      return;
    }
    if (!form.workshopCode.trim() || form.workshopCode.length !== 10) {
      setErrorMsg("کد کارگاه باید دقیقاً ۱۰ رقم باشد.");
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
        insMaxBase: Number(toEnglishDigits(form.insMaxBase)) || 0,
        insMaxBaseDays: Number(toEnglishDigits(form.insMaxBaseDays)) || 30,
        workshopCode: toEnglishDigits(form.workshopCode),
        contractRow: toEnglishDigits(form.contractRow)
      };

      if (editingId) {
        payload.id = editingId;
        payload._id = editingId;
        await updateConfig("insurance_settings", payload);
        setSuccessMsg(`تنظیمات بیمه سال ${form.year} با موفقیت به‌روزرسانی شد.`);
      } else {
        const saved = await addConfig("insurance_settings", payload);
        if (saved) {
          setEditingId(saved._id || saved.id);
        }
        setSuccessMsg(`تنظیمات بیمه سال ${form.year} با موفقیت ثبت شد.`);
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
                            {((form.insEmployerRate || 0) + (form.insUnemployRate || 0))} ٪
                          </span>
                        </div>
                      </div>
                    </div>
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
