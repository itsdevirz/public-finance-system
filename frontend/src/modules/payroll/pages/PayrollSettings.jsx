import { useState, useEffect } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Save, RefreshCw, ShieldCheck, ReceiptText, Calculator,
  AlertCircle, CheckCircle, Info, Percent, Clock, Calendar, Banknote, Users, Plus, X
} from "lucide-react";

// ==========================
// مقادیر پیش‌فرض سال ۱۴۰۵
// ==========================
const DEFAULTS = {
  // کارکرد
  workingDaysPerMonth: 30,
  workingHoursPerMonth: 176,
  overtimeMultiplier: 1.4,
  nightShiftMultiplier: 1.35,
  holidayMultiplier: 1.75,

  // بیمه تأمین اجتماعی
  insEmployeeRate: 7,       // %
  insEmployerRate: 20,      // %
  insUnemployRate: 3,       // %
  insMaxBase: 0,            // 0 = نامحدود

  // مالیات حقوق ۱۴۰۵
  taxAnnualExemption: 1440000000,   // ریال
  taxBracket1Limit: 500000000,
  taxBracket1Rate: 10,
  taxBracket2Limit: 1000000000,
  taxBracket2Rate: 15,
  taxBracket3Limit: 2000000000,
  taxBracket3Rate: 20,
  taxBracket4Rate: 25,

  // مزایای اجباری قانون کار ۱۴۰۵
  minMonthlyWage: 71380000,          // ریال — دستمزد پایه ۱۴۰۵
  housingAllowance: 30000000,        // مسکن
  groceryAllowance: 22000000,        // خواربار
  childAllowancePerChild: 9000000,   // اولاد (هر فرزند)
  maxChildrenCount: 2,
  seniorityRatePerYear: 3,          // % به‌ازای هر سال سابقه
  customAllowances: [],

  // سایر
  yearFiscal: "1405"
};

// Section title component
function SectionTitle({ icon: Icon, title, description, color = "text-indigo-600" }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// Single field row
function SettingField({ label, hint, value, onChange, unit, type = "number", min, max, step, readOnly }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</div>
        {hint && <div className="text-[10px] text-slate-400 mt-0.5">{hint}</div>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Input
          type={type}
          value={value}
          onChange={e => !readOnly && onChange(e.target.value)}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          className={`h-8 text-xs w-36 text-left font-mono ${readOnly ? "bg-slate-50 dark:bg-slate-800 text-slate-400" : ""}`}
        />
        {unit && <span className="text-[11px] text-slate-500 w-12 text-right shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

export default function PayrollSettings() {
  const { payrollCalculations, addConfig, updateConfig, refreshAllConfigs } = useAssets();

  const [settings, setSettings] = useState(DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // بارگذاری تنظیمات از localStorage یا سرور
  useEffect(() => {
    const saved = localStorage.getItem("payroll_settings");
    if (saved) {
      try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (_) {}
    }
    setIsLoading(false);
  }, []);

  function set(field, val) {
    setSettings(prev => ({ ...prev, [field]: val }));
    setSuccessMsg("");
    setErrorMsg("");
  }

  function addCustomAllowance() {
    setSettings(prev => {
      const list = prev.customAllowances ? [...prev.customAllowances] : [];
      const newKey = `custom_${Date.now()}`;
      list.push({ key: newKey, label: "مزایای سفارشی جدید", defaultValue: 0 });
      return { ...prev, customAllowances: list };
    });
    setSuccessMsg("");
    setErrorMsg("");
  }

  function handleUpdateCustomAllowance(idx, field, value) {
    setSettings(prev => {
      const list = [...(prev.customAllowances || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, customAllowances: list };
    });
    setSuccessMsg("");
    setErrorMsg("");
  }

  function handleRemoveCustomAllowance(idx) {
    setSettings(prev => {
      const list = (prev.customAllowances || []).filter((_, i) => i !== idx);
      return { ...prev, customAllowances: list };
    });
    setSuccessMsg("");
    setErrorMsg("");
  }

  function resetToDefaults() {
    if (window.confirm("آیا از بازنشانی همه تنظیمات به مقادیر پیش‌فرض ۱۴۰۵ مطمئن هستید؟")) {
      setSettings(DEFAULTS);
      setSuccessMsg("تنظیمات به مقادیر پیش‌فرض ۱۴۰۵ بازنشانی شد. برای ذخیره دائمی دکمه ذخیره را بزنید.");
    }
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      // ذخیره در localStorage (همیشه سریع و بدون وقفه)
      localStorage.setItem("payroll_settings", JSON.stringify(settings));
      setSuccessMsg("تنظیمات محاسبه حقوق با موفقیت ذخیره شد. تغییرات در محاسبات بعدی اعمال خواهند شد.");
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ذخیره‌سازی تنظیمات.");
    } finally {
      setIsSaving(false);
    }
  }

  // محاسبه خودکار: حداکثر پایه بیمه
  const totalInsRate = Number(settings.insEmployeeRate) + Number(settings.insEmployerRate) + Number(settings.insUnemployRate);
  const taxBracket1Toman = (Number(settings.taxBracket1Limit) / 10).toLocaleString("fa-IR");
  const exemptionToman   = (Number(settings.taxAnnualExemption) / 10).toLocaleString("fa-IR");

  if (isLoading) return null;

  return (
    <div className="space-y-5 text-right" dir="rtl">

      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            تنظیمات محاسبه حقوق و دستمزد
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            نرخ‌های بیمه، مالیات، اضافه‌کار، مزایای قانونی و سایر پارامترهای محاسبه حقوق را اینجا تنظیم کنید.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="h-9 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> بازنشانی به پیش‌فرض ۱۴۰۵
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Save className="h-4 w-4" /> {isSaving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </Button>
        </div>
      </div>

      {/* پیام‌ها */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ۱. کارکرد و اضافه‌کار */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b pb-3">
            <SectionTitle icon={Clock} title="پارامترهای کارکرد و اضافه‌کار"
              description="مبنای محاسبه روز و ساعت کاری و ضرایب اضافه‌کاری" color="text-blue-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <SettingField label="روزهای کاری ماه" hint="تعداد روزهایی که ملاک محاسبه است" value={settings.workingDaysPerMonth} onChange={v => set("workingDaysPerMonth", v)} unit="روز" min={25} max={31} />
            <SettingField label="ساعات کاری ماه" hint="برای محاسبه نرخ ساعتی (معمولاً ۱۷۶ ساعت)" value={settings.workingHoursPerMonth} onChange={v => set("workingHoursPerMonth", v)} unit="ساعت" min={140} max={200} />
            <SettingField label="ضریب اضافه‌کار معمولی" hint="× نرخ ساعتی — قانون کار: حداقل ۱.۴" value={settings.overtimeMultiplier} onChange={v => set("overtimeMultiplier", v)} unit="× نرخ" step="0.05" min={1} max={2} />
            <SettingField label="ضریب کار شب" hint="× نرخ ساعتی — حداقل ۱.۳۵" value={settings.nightShiftMultiplier} onChange={v => set("nightShiftMultiplier", v)} unit="× نرخ" step="0.05" min={1} max={2} />
            <SettingField label="ضریب کار تعطیل" hint="× نرخ ساعتی — حداقل ۱.۷۵ برای روز تعطیل" value={settings.holidayMultiplier} onChange={v => set("holidayMultiplier", v)} unit="× نرخ" step="0.05" min={1} max={3} />
          </CardContent>
        </Card>

        {/* ۲. بیمه تأمین اجتماعی */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b pb-3">
            <SectionTitle icon={ShieldCheck} title="بیمه تأمین اجتماعی"
              description="نرخ‌های بیمه بر اساس مصوبه سازمان تأمین اجتماعی" color="text-teal-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <SettingField label="سهم کارمند" hint="بر اساس پایه بیمه‌پذیر — مصوب: ۷٪" value={settings.insEmployeeRate} onChange={v => set("insEmployeeRate", v)} unit="%" min={0} max={15} step="0.5" />
            <SettingField label="سهم کارفرما" hint="بار مالی کارفرما — مصوب: ۲۰٪" value={settings.insEmployerRate} onChange={v => set("insEmployerRate", v)} unit="%" min={0} max={30} step="0.5" />
            <SettingField label="بیمه بیکاری" hint="سهم کارفرما — مصوب: ۳٪" value={settings.insUnemployRate} onChange={v => set("insUnemployRate", v)} unit="%" min={0} max={10} step="0.5" />

            <div className="mt-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg p-3 border border-teal-100 dark:border-teal-900">
              <div className="text-[10px] text-teal-700 dark:text-teal-300 space-y-1">
                <div>📊 جمع کل نرخ بیمه: <strong>{totalInsRate.toLocaleString("fa-IR")}٪</strong></div>
                <div>👤 کسر از حقوق کارمند: <strong>{Number(settings.insEmployeeRate)}٪</strong></div>
                <div>🏢 بار کارفرمایی: <strong>{(Number(settings.insEmployerRate) + Number(settings.insUnemployRate))}٪</strong></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ۳. مالیات حقوق */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b pb-3">
            <SectionTitle icon={ReceiptText} title="جدول مالیات حقوق (پلکانی)"
              description="معافیت سالانه و نرخ‌های پلکانی مالیات بر درآمد — سال ۱۴۰۵" color="text-rose-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <SettingField label="معافیت سالانه مالیاتی" hint={`معادل ${exemptionToman} تومان در سال`} value={settings.taxAnnualExemption} onChange={v => set("taxAnnualExemption", v)} unit="ریال" min={0} />

            <div className="mt-3 mb-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 border-t pt-3">پلکان‌های مشمول مالیات (ریال سالانه مازاد بر معافیت):</div>

            <div className="space-y-2">
              {[
                { label: "پلکان اول — تا سقف", limitKey: "taxBracket1Limit", rateKey: "taxBracket1Rate" },
                { label: "پلکان دوم — تا سقف", limitKey: "taxBracket2Limit", rateKey: "taxBracket2Rate" },
                { label: "پلکان سوم — تا سقف", limitKey: "taxBracket3Limit", rateKey: "taxBracket3Rate" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                  <span className="text-[10px] text-slate-500 w-36">{b.label}</span>
                  <Input type="number" value={settings[b.limitKey]} onChange={e => set(b.limitKey, e.target.value)} className="h-7 text-[11px] font-mono w-36 text-left" />
                  <span className="text-[10px] text-slate-400 mx-1">ریال — نرخ:</span>
                  <Input type="number" value={settings[b.rateKey]} onChange={e => set(b.rateKey, e.target.value)} className="h-7 text-[11px] font-mono w-14 text-left" />
                  <span className="text-[11px] text-slate-500">٪</span>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg px-3 py-2">
                <span className="text-[10px] text-slate-500 w-36">پلکان چهارم — مازاد</span>
                <span className="text-[10px] text-slate-400 w-36 font-mono">بدون سقف</span>
                <span className="text-[10px] text-slate-400 mx-1">نرخ:</span>
                <Input type="number" value={settings.taxBracket4Rate} onChange={e => set("taxBracket4Rate", e.target.value)} className="h-7 text-[11px] font-mono w-14 text-left" />
                <span className="text-[11px] text-slate-500">٪</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ۴. مزایا و حداقل دستمزد */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b pb-3">
            <SectionTitle icon={Banknote} title="مزایای قانونی و حداقل دستمزد"
              description="مزایای اجباری موضوع قانون کار و شورای عالی کار ۱۴۰۵" color="text-amber-600" />
          </CardHeader>
          <CardContent className="pt-4">
            <SettingField label="حداقل دستمزد روزانه ۱۴۰۵" hint="مصوب شورای عالی کار" value={settings.minMonthlyWage} onChange={v => set("minMonthlyWage", v)} unit="ریال/ماه" />
            <SettingField label="مزایای مسکن" hint="ماده ۸۶ قانون تأمین اجتماعی" value={settings.housingAllowance} onChange={v => set("housingAllowance", v)} unit="ریال" />
            <SettingField label="حق خواربار" hint="مزایای خوار و بار ماهانه" value={settings.groceryAllowance} onChange={v => set("groceryAllowance", v)} unit="ریال" />
            <SettingField label="حق اولاد (هر فرزند)" hint="حداکثر تعداد فرزندان تعیین می‌شود" value={settings.childAllowancePerChild} onChange={v => set("childAllowancePerChild", v)} unit="ریال" />
            <SettingField label="حداکثر فرزندان مشمول" hint="معمولاً ۲ فرزند" value={settings.maxChildrenCount} onChange={v => set("maxChildrenCount", v)} unit="نفر" min={0} max={5} />

            <Separator className="my-3" />

            <SettingField label="نرخ فوق‌العاده سنوات (هر سال)" hint="درصد حقوق پایه به ازای هر سال سابقه" value={settings.seniorityRatePerYear} onChange={v => set("seniorityRatePerYear", v)} unit="٪ / سال" step="0.5" min={0} max={10} />

            <Separator className="my-3" />
            
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">مزایای سفارشی و رفاهیات اضافی</h4>
              <Button type="button" size="sm" variant="outline" onClick={addCustomAllowance}
                className="h-7 text-[11px] gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Plus className="h-3.5 w-3.5" /> افزودن مزایای سفارشی
              </Button>
            </div>

            <div className="space-y-3">
              {(settings.customAllowances || []).map((allow, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-400">نام مزایا (مثال: رفاهیات، مناسبتی)</Label>
                    <Input
                      value={allow.label}
                      onChange={e => handleUpdateCustomAllowance(idx, "label", e.target.value)}
                      className="h-7 text-xs"
                      placeholder="عنوان..."
                    />
                  </div>
                  <div className="w-36 space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-400">مبلغ پیش‌فرض (ریال)</Label>
                    <Input
                      type="number"
                      value={allow.defaultValue}
                      onChange={e => handleUpdateCustomAllowance(idx, "defaultValue", Number(e.target.value))}
                      className="h-7 text-xs font-mono text-left"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveCustomAllowance(idx)}
                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 self-end"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* نمایش خلاصه تنظیمات جاری */}
      <Card className="border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">خلاصه تنظیمات جاری</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <div className="text-slate-500 mb-1">بیمه کارمند / کارفرما</div>
              <div className="font-bold text-indigo-700">{settings.insEmployeeRate}٪ / {Number(settings.insEmployerRate) + Number(settings.insUnemployRate)}٪</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <div className="text-slate-500 mb-1">معافیت مالیات سالانه</div>
              <div className="font-bold text-rose-700 font-mono">{(Number(settings.taxAnnualExemption) / 1000000).toLocaleString("fa-IR")}م ریال</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <div className="text-slate-500 mb-1">ضریب اضافه‌کار / تعطیل</div>
              <div className="font-bold text-amber-700">{settings.overtimeMultiplier}× / {settings.holidayMultiplier}×</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <div className="text-slate-500 mb-1">حداقل دستمزد ماهانه</div>
              <div className="font-bold text-emerald-700 font-mono">{(Number(settings.minMonthlyWage) / 1000000).toLocaleString("fa-IR")}م ریال</div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
