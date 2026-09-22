import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ShebaInput from "@/components/ui/sheba-input";
import { Badge } from "@/components/ui/badge";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { User, Briefcase, CreditCard, DollarSign, Save, Plus, ArrowRight, ShieldCheck, AlertCircle, Info, Pencil, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "personal",   label: "اطلاعات شناسنامه‌ای و فردی", icon: User },
  { key: "employment", label: "اطلاعات استخدامی و شغلی",  icon: Briefcase },
  { key: "salary",     label: "حقوق، دستمزد و مزایای پایه",icon: DollarSign },
  { key: "bank",       label: "حساب بانکی و مالی",      icon: CreditCard },
];

const INITIAL_FORM = {
  // 1. اطلاعات هویتی و پرسنلی (Section 1)
  executiveOrg: "وزارت امور اقتصادی و دارایی",
  executiveOrgCode: "140567", // کد دستگاه اجرایی ۶ رقمی (۴ رقم سال + ۶۷ کد استان ایلام)
  firstName: "",
  lastName: "",
  fatherName: "",
  nationalId: "",
  code: "", // شماره پرسنلی
  certificateNo: "", // شماره شناسنامه
  birthPlace: "",
  issuePlace: "",
  birthDate: "",
  gender: "male", // Dropdown: male / female (کد 2 و 4 خزانه)
  maritalStatus: "single", // Dropdown: single (1) / married (3) / other (2)
  childrenCount: 0,
  dependentsCount: 0,
  sacrificeStatus: "none", // Dropdown: none / sacrificer / disabled / freed / martyr_child / combatant
  employmentType: "official", // Dropdown: official (5) / probationary (6) / contractual (7)
  pensionFund: "civil", // Dropdown: civil (7) / social_security (8) / other (9)
  healthInsuranceStatus: "1", // Dropdown: 1=خدمات درمانی، 2=تامین اجتماعی، 3=سایر
  militaryStatus: "exempt",
  highestDegree: "bachelor", // Dropdown: phd(1) / master(2) / bachelor(3) / associate(4) / diploma(5) / under_diploma(6)
  fieldOfStudy: "",

  // Contact Info
  mobile: "",
  phone: "",
  postalCode: "",
  address: "",
  email: "",

  // 2. اطلاعات شغلی و پستی (Section 2)
  postTitle: "", // عنوان پست سازمانی
  postRow: "", // ردیف پست سازمانی
  uniquePostId: "", // شناسه یکتای پست سازمانی
  department: "اداری", // واحد سازمانی
  uniqueUnitId: "", // شناسه یکتای واحد سازمانی
  jobTitle: "", // عنوان شغل
  jobGrade: "8", // طبقه شغلی (Dropdown: 1 تا 20)
  jobRank: "base", // رتبه شغلی (Dropdown: preliminary / base / senior / expert / superior)
  acceptedServiceYears: 0,
  acceptedServiceMonths: 0,
  acceptedServiceDays: 0,
  acceptedExpYears: 0,
  acceptedExpMonths: 0,
  acceptedExpDays: 0,
  serviceLocation: "", // محل خدمت
  hireDate: "",
  status: "active",
  insuranceNo: "",
  retirementInsuranceNo: "",
  branchName: "شعبه مرکزی",
  bankBranchCode: "101", // کد شعبه بانک
  taxStatus: "taxable",

  // Salary & Allowances
  dailyBaseSalary: 5541850, // Standard daily minimum wage 1405
  housingAllowance: 30000000, // Standard housing allowance 1405
  groceryAllowance: 22000000, // Standard grocery allowance 1405
  childAllowance: 0, // Calculated dynamically
  transportAllowance: 0,
  responsibilityAllowance: 0,
  expertiseAllowance: 0,
  otherAllowances: 0,

  // Bank Info
  bankName: "بانک سپه",
  accountNo: "",
  cardNumber: "",
  shebaNo: "",
  bankName2: "",
  accountNo2: "",
  cardNumber2: "",
  shebaNo2: "",
};

// Iranian Labor Law Constants 1405
const DAILY_MIN_WAGE_1405 = 5541850;
const HOUSING_ALLOWANCE_1405 = 30000000;
const GROCERY_ALLOWANCE_1405 = 22000000;
const CHILD_ALLOWANCE_PER_CHILD_1405 = DAILY_MIN_WAGE_1405 * 3; // 16,625,550 Rials per child

export default function EmployeeRegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addConfig, updateConfig, employees, refreshAllConfigs } = useAssets();
  const [activeTab, setActiveTab] = useState("personal");
  const [form, setForm] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTreasuryGuide, setShowTreasuryGuide] = useState(false);

  const editingId = location.state?.employee?._id || location.state?.employee?.id || null;

  // Load employee if editing
  useEffect(() => {
    if (location.state?.employee) {
      setForm(location.state.employee);
    }
  }, [location.state]);

  // Auto-generate recommended personnel code on mount (only when registering new)
  useEffect(() => {
    if (editingId) return;
    if (employees && employees.length > 0) {
      const codes = employees
        .map(e => e.code)
        .filter(c => c && c.startsWith("EMP-"))
        .map(c => Number(c.replace("EMP-", "")))
        .filter(n => !isNaN(n));
      const nextNum = codes.length > 0 ? Math.max(...codes) + 1 : employees.length + 1;
      const formattedNum = String(nextNum).padStart(3, "0");
      setForm(f => ({ ...f, code: `EMP-${formattedNum}` }));
    } else {
      setForm(f => ({ ...f, code: "EMP-001" }));
    }
  }, [employees, editingId]);

  // Recalculate child allowance automatically when children count changes
  useEffect(() => {
    const children = Number(form.childrenCount || 0);
    const calculatedChildAllowance = children * CHILD_ALLOWANCE_PER_CHILD_1405;
    setForm(f => ({ ...f, childAllowance: calculatedChildAllowance }));
  }, [form.childrenCount]);

  // Calculated Monthly base salary
  const monthlyBaseSalary = useMemo(() => {
    return Number(form.dailyBaseSalary || 0) * 30;
  }, [form.dailyBaseSalary]);

  // Total salary sum
  const totalSalarySum = useMemo(() => {
    return (
      monthlyBaseSalary +
      Number(form.housingAllowance || 0) +
      Number(form.groceryAllowance || 0) +
      Number(form.childAllowance || 0) +
      Number(form.transportAllowance || 0) +
      Number(form.responsibilityAllowance || 0) +
      Number(form.expertiseAllowance || 0) +
      Number(form.otherAllowances || 0)
    );
  }, [
    monthlyBaseSalary,
    form.housingAllowance,
    form.groceryAllowance,
    form.childAllowance,
    form.transportAllowance,
    form.responsibilityAllowance,
    form.expertiseAllowance,
    form.otherAllowances
  ]);

  function handleChange(field, val) {
    if (field === "maritalStatus" && val === "single") {
      setForm(f => ({ ...f, maritalStatus: val, childrenCount: 0, childAllowance: 0 }));
    } else {
      setForm(f => ({ ...f, [field]: val }));
    }
    setErrorMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMsg("نام و نام خانوادگی الزامی است.");
      setActiveTab("personal");
      return;
    }
    const cleanNationalId = String(form.nationalId || "").trim();
    if (!cleanNationalId || cleanNationalId.length !== 10 || !/^\d{10}$/.test(cleanNationalId)) {
      setErrorMsg("کد ملی کارمند باید دقیقاً ۱۰ رقم عددی بدون فاصله و خط تیره باشد (مطابق فیلد ۲ خزانه).");
      setActiveTab("personal");
      return;
    }
    if (!form.code.trim()) {
      setErrorMsg("کد پرسنلی الزامی است.");
      setActiveTab("employment");
      return;
    }

    // اعتبارسنجی حیاتی خزانه (بند ۱۰): اگر مجرد باشد، تعداد اولاد حتماً باید صفر باشد
    if (form.maritalStatus === "single" && Number(form.childrenCount || 0) > 0) {
      setErrorMsg("خطای اعتبارسنجی خزانه: وضعیت تأهل کارمند «مجرد» انتخاب شده است، بنابراین تعداد اولاد باید حتماً ۰ باشد.");
      setActiveTab("personal");
      return;
    }

    // پاکسازی نام بانک از کشیدگی حروف
    const cleanedBankName = String(form.bankName || "بانک سپه").replace(/[\u0640]/g, "").trim();

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      // Combine values for database registration
      const newEmployee = {
        ...form,
        name: `${form.firstName} ${form.lastName}`, // combined name for warehouse employee links
        role: form.jobTitle || "کارمند",
        salary: totalSalarySum,
        baseSalary: monthlyBaseSalary
      };

      let result;
      if (editingId) {
        result = await updateConfig("employees", newEmployee);
      } else {
        result = await addConfig("employees", newEmployee);
      }

      if (result) {
        setSuccessMsg(editingId ? "اطلاعات کارمند با موفقیت ویرایش شد." : "اطلاعات کارمند با موفقیت ثبت شد.");
        if (editingId) {
          setTimeout(() => {
            navigate("/payroll/employees/list");
          }, 1500);
        } else {
          setForm({
            ...INITIAL_FORM,
            // regenerate code
            code: `EMP-${String(employees.length + 2).padStart(3, "0")}`
          });
          setActiveTab("personal");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        await refreshAllConfigs();
      } else {
        setErrorMsg("خطا در ذخیره اطلاعات در سرور.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطایی در حین ارتباط با سرور پیش آمد.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Pre-fill standard labor law defaults
  function applyLaborLawDefaults() {
    setForm(f => ({
      ...f,
      dailyBaseSalary: DAILY_MIN_WAGE_1405,
      housingAllowance: HOUSING_ALLOWANCE_1405,
      groceryAllowance: GROCERY_ALLOWANCE_1405
    }));
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto" dir="rtl">
      
      {/* هدر صفحه و دکمه بازگشت */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="text-right">
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {editingId ? (
              <>
                <Pencil className="h-5 w-5 text-amber-600" />
                ویرایش اطلاعات کارمند ({form.firstName} {form.lastName})
                <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 border-none font-bold mr-2">در حال ویرایش</Badge>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-emerald-600" />
                ثبت و تعریف کارمند جدید
              </>
            )}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">اطلاعات پرونده استخدامی و مالی پرسنل را جهت انجام محاسبات حقوق و دستمزد وارد نمایید.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowTreasuryGuide(!showTreasuryGuide)}
            className="gap-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
          >
            <Info className="h-4 w-4" />
            {showTreasuryGuide ? "بستن راهنمای فایل ۶۰ ستونه خزانه" : "راهنمای فایل ۶۰ ستونه خزانه (سینا)"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/payroll/employees/list")} className="gap-1.5 text-xs">
            <ArrowRight className="h-4 w-4" /> لیست کارکنان
          </Button>
        </div>
      </div>

      {/* راهنمای تعاملی استاندارد ۶۰ ستونه خزانه کل کشور */}
      {showTreasuryGuide && (
        <Card className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-right shadow-sm">
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-800 pb-3">
              <h3 className="font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                مشخصات و استانداردهای فنی خروجی فایل ۶۰ ستونه حقوق و دستمزد خزانه (سامانه سینا)
              </h3>
              <Badge className="bg-indigo-600 text-white">استاندارد ۶۰ ستونه Comma-Delimited</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" /> ۱. فرمت و نام‌گذاری فایل
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                  <li>فرمت متنی بدون هدر با جداکننده کاما (CSV/TXT).</li>
                  <li>انتهای سطر با خط‌شکن استاندارد <code className="bg-slate-100 px-1 font-mono text-[10px] text-rose-600">{`\\r\\n`}</code>.</li>
                  <li>نام‌گذاری ویندوز: <code className="font-mono text-indigo-600">W[MONTH][SERIAL].TXT</code> (مثال: W9903001.TXT).</li>
                  <li>نام‌گذاری معوقات: <code className="font-mono text-indigo-600">WM[MONTH][SERIAL].TXT</code> (مثال: WM9903001.TXT).</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-500" /> ۲. قواعد حیاتی اعتبارسنجی
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                  <li><strong>قانون تاهل و اولاد:</strong> برای کارمند مجرد (کد ۱)، تعداد اولاد حتماً باید صفر (<code className="font-mono">0</code>) باشد.</li>
                  <li><strong>کد ملی:</strong> دقیقاً ۱۰ رقم عددی بدون فاصله و خط تیره.</li>
                  <li><strong>نام بانک:</strong> بدون کشیدگی حروف (تطویل) مانند <code className="font-mono text-rose-600 font-bold">بانـک</code>.</li>
                  <li><strong>فیلد ۵۶ (جمع کل):</strong> مجموع قدرمطلق مبالغ فیلدهای ۱۵ تا ۵۵ جهت کنترل صحت.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-indigo-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-emerald-500" /> ۳. نگاشت کدگذاری‌های عددی
                </h4>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                  <li><strong>جنسیت:</strong> ۲ = مرد | ۴ = زن</li>
                  <li><strong>تاهل:</strong> ۱ = مجرد | ۲ = سایر | ۳ = متاهل</li>
                  <li><strong>نوع استخدام:</strong> ۵ = رسمی | ۶ = پیمانی | ۷ = سایر</li>
                  <li><strong>صندوق بازنشستگی:</strong> ۷ = کشوری | ۸ = تامین اجتماعی | ۹ = سایر</li>
                  <li><strong>بیمه درمانی:</strong> ۱ = خدمات درمانی | ۲ = تامین اجتماعی | ۳ = سایر</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* تب‌های فرم ثبت نام */}
      <div className="tabs mb-0 border-b pb-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "tab-btn flex items-center gap-1.5 text-xs font-bold transition-all pb-3 px-4 border-b-2 border-transparent",
              activeTab === t.key
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-t-none mt-0 border-slate-100">
          <CardContent className="pt-6">
            
            {/* ─── TAB 1: PERSONAL INFO ─── */}
            {activeTab === "personal" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-blue-600 pr-2">اطلاعات هویتی و پرسنلی (شناسنامه‌ای و فردی)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">دستگاه اجرایی</Label>
                      <Input value={form.executiveOrg} onChange={e => handleChange("executiveOrg", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="وزارت امور اقتصادی و دارایی" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام <span className="text-rose-500">*</span></Label>
                      <Input value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: علی" required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام خانوادگی <span className="text-rose-500">*</span></Label>
                      <Input value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: احمدی" required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام پدر</Label>
                      <Input value={form.fatherName} onChange={e => handleChange("fatherName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره ملی کارمند (۱۰ رقم) <span className="text-rose-500">*</span></Label>
                      <Input value={form.nationalId} onChange={e => handleChange("nationalId", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="0012345678" maxLength={10} required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره پرسنلی <span className="text-rose-500">*</span></Label>
                      <Input value={form.code} onChange={e => handleChange("code", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="EMP-001" required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره شناسنامه</Label>
                      <Input value={form.certificateNo} onChange={e => handleChange("certificateNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">محل تولد</Label>
                      <Input value={form.birthPlace} onChange={e => handleChange("birthPlace", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: تهران" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تاریخ تولد</Label>
                      <PersianDatePicker value={form.birthDate} onChange={e => handleChange("birthDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۳۷۰/۰۱/۰۱" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">جنسیت</Label>
                      <select value={form.gender} onChange={e => handleChange("gender", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="male">مرد</option>
                        <option value="female">زن</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت تاهل</Label>
                      <select value={form.maritalStatus} onChange={e => handleChange("maritalStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="single">مجرد</option>
                        <option value="married">متأهل</option>
                        <option value="with_dependents">معیل (دارای همسر و فرزند)</option>
                        <option value="widowed">همسر متوفی</option>
                        <option value="divorced">مطلقه</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تعداد فرزندان (فیلد ۱۰ خزانه)</Label>
                      <Input type="number" min="0" value={form.childrenCount} onChange={e => handleChange("childrenCount", Number(e.target.value))} disabled={form.maritalStatus === "single"} className="h-9 text-xs mt-1.5 font-mono" />
                      {form.maritalStatus === "single" && (
                        <span className="text-[10px] text-amber-600 block mt-1 font-semibold">مطابق بند ۱۰ خزانه، برای مجرد تعداد اولاد ۰ است.</span>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت ایثارگری</Label>
                      <select value={form.sacrificeStatus} onChange={e => handleChange("sacrificeStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="none">ندارد</option>
                        <option value="sacrificer">ایثارگر</option>
                        <option value="disabled">جانباز</option>
                        <option value="freed">آزاده</option>
                        <option value="martyr_child">فرزند شهید</option>
                        <option value="combatant">رزمنده</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نوع استخدام</Label>
                      <select value={form.employmentType} onChange={e => handleChange("employmentType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="official">رسمی قطعی</option>
                        <option value="official_probation">رسمی آزمایشی</option>
                        <option value="probationary">پیمانی</option>
                        <option value="contractual">قراردادی کار معین</option>
                        <option value="company">شرکتی</option>
                        <option value="hourly">ساعتی</option>
                        <option value="daily">روزمزد</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">صندوق بازنشستگی (فیلد ۱۳ خزانه)</Label>
                      <select value={form.pensionFund} onChange={e => handleChange("pensionFund", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="civil">۷ - صندوق بازنشستگی کشوری</option>
                        <option value="social_security">۸ - تامین اجتماعی</option>
                        <option value="other">۹ - سایر صندوق‌ها</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت بیمه درمانی (فیلد ۱۴ خزانه)</Label>
                      <select value={form.healthInsuranceStatus || "1"} onChange={e => handleChange("healthInsuranceStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="1">۱ - خدمات درمانی (بیمه سلامت)</option>
                        <option value="2">۲ - تامین اجتماعی</option>
                        <option value="3">۳ - سایر بیمه‌ها</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">بالاترین مدرک تحصیلی</Label>
                      <select value={form.highestDegree} onChange={e => handleChange("highestDegree", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="under_diploma">زیر دیپلم</option>
                        <option value="diploma">دیپلم</option>
                        <option value="associate">فوق دیپلم</option>
                        <option value="bachelor">لیسانس (کارشناسی)</option>
                        <option value="master">فوق لیسانس (کارشناسی ارشد)</option>
                        <option value="phd">دکترا</option>
                        <option value="post_phd">فوق دکترا / تخصصی</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">رشته تحصیلی</Label>
                      <Input value={form.fieldOfStudy} onChange={e => handleChange("fieldOfStudy", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: حسابداری، مدیریت دولتی" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت نظام وظیفه (آقایان)</Label>
                      <select value={form.militaryStatus} onChange={e => handleChange("militaryStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5" disabled={form.gender === "female"}>
                        <option value="done">پایان خدمت</option>
                        <option value="exempt">معاف دائم</option>
                        <option value="medical-exempt">معاف پزشکی</option>
                        <option value="ongoing">مشمول / در حال خدمت</option>
                        <option value="not-applicable">غیرمشمول (بانوان)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-blue-600 pr-2">اطلاعات تماس و سکونت</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">شماره همراه</Label>
                      <Input value={form.mobile} onChange={e => handleChange("mobile", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="09123456789" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تلفن ثابت</Label>
                      <Input value={form.phone} onChange={e => handleChange("phone", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="02188888888" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد پستی (۱۰ رقم)</Label>
                      <Input value={form.postalCode} onChange={e => handleChange("postalCode", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="1234567890" maxLength={10} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">آدرس محل سکونت</Label>
                      <Input value={form.address} onChange={e => handleChange("address", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="آدرس دقیق..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">آدرس ایمیل (پست الکترونیک)</Label>
                      <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="example@mail.com" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: EMPLOYMENT INFO ─── */}
            {activeTab === "employment" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-teal-600 pr-2">اطلاعات شغلی و پستی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">عنوان پست سازمانی</Label>
                      <Input value={form.postTitle} onChange={e => handleChange("postTitle", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: کارشناس مسئول حقوق" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">ردیف پست سازمانی</Label>
                      <Input value={form.postRow} onChange={e => handleChange("postRow", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۱۰۴" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شناسه یکتای پست سازمانی</Label>
                      <Input value={form.uniquePostId} onChange={e => handleChange("uniquePostId", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: POS-9901" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">واحد سازمانی</Label>
                      <Input value={form.department} onChange={e => handleChange("department", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: مدیریت امور مالی" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شناسه یکتای واحد سازمانی</Label>
                      <Input value={form.uniqueUnitId} onChange={e => handleChange("uniqueUnitId", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: UNT-102" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">عنوان شغل</Label>
                      <Input value={form.jobTitle} onChange={e => handleChange("jobTitle", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: حسابدار ارشد" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">طبقه شغلی</Label>
                      <select value={form.jobGrade} onChange={e => handleChange("jobGrade", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5 font-mono">
                        {Array.from({ length: 20 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>طبقه {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">رتبه شغلی</Label>
                      <select value={form.jobRank} onChange={e => handleChange("jobRank", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="preliminary">مقدماتی</option>
                        <option value="base">پایه</option>
                        <option value="senior">ارشد</option>
                        <option value="expert">خبره</option>
                        <option value="superior">عالی</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">محل خدمت</Label>
                      <Input value={form.serviceLocation} onChange={e => handleChange("serviceLocation", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: اداره کل استان تهران" />
                    </div>

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">سابقه خدمت قابل قبول</Label>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">سال</Label>
                            <Input type="number" min="0" value={form.acceptedServiceYears} onChange={e => handleChange("acceptedServiceYears", Number(e.target.value))} className="h-8 text-xs font-mono text-center" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">ماه</Label>
                            <Input type="number" min="0" max="11" value={form.acceptedServiceMonths} onChange={e => handleChange("acceptedServiceMonths", Number(e.target.value))} className="h-8 text-xs font-mono text-center" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">روز</Label>
                            <Input type="number" min="0" max="30" value={form.acceptedServiceDays} onChange={e => handleChange("acceptedServiceDays", Number(e.target.value))} className="h-8 text-xs font-mono text-center" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">سابقه تجربی قابل قبول</Label>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">سال</Label>
                            <Input type="number" min="0" value={form.acceptedExpYears} onChange={e => handleChange("acceptedExpYears", Number(e.target.value))} className="h-8 text-xs font-mono text-center" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">ماه</Label>
                            <Input type="number" min="0" max="11" value={form.acceptedExpMonths} onChange={e => handleChange("acceptedExpMonths", Number(e.target.value))} className="h-8 text-xs font-mono text-center" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">روز</Label>
                            <Input type="number" min="0" max="30" value={form.acceptedExpDays} onChange={e => handleChange("acceptedExpDays", Number(e.target.value))} className="h-8 text-xs font-mono text-center" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">تاریخ استخدام</Label>
                      <PersianDatePicker value={form.hireDate} onChange={e => handleChange("hireDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۳/۰۱/۰۱" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره بیمه تامین اجتماعی</Label>
                      <Input value={form.insuranceNo || ""} onChange={e => handleChange("insuranceNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۱۰۲۳۴۵۶۷" maxLength={10} disabled={!!form.retirementInsuranceNo} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره بیمه صندوق بازنشستگی کشوری</Label>
                      <Input value={form.retirementInsuranceNo || ""} onChange={e => handleChange("retirementInsuranceNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۱۲۳۴۵۶۷۸" maxLength={10} disabled={!!form.insuranceNo} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت مالیاتی کارمند</Label>
                      <select value={form.taxStatus} onChange={e => handleChange("taxStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="taxable">مشمول پرداخت مالیات حقوق</option>
                        <option value="exempt">معاف از مالیات حقوق (ماده ۹۱)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شعبه / محل خدمت</Label>
                      <Input value={form.branchName} onChange={e => handleChange("branchName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: دفتر مرکزی تهران" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت اشتغال فعلی</Label>
                      <select value={form.status} onChange={e => handleChange("status", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="active">شاغل (فعال)</option>
                        <option value="leave">مرخصی بدون حقوق / استعلاجی</option>
                        <option value="suspended">تعلیق موقت کارکرد</option>
                        <option value="terminated">تسویه حساب / قطع همکاری</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 3: SALARY & ALLOWANCES ─── */}
            {activeTab === "salary" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">حقوق پایه و مزایای رفاهی سال ۱۴۰۵ قانون کار به صورت پیش‌فرض تکمیل شده است.</span>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={applyLaborLawDefaults} className="h-7 text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    نشاندن پیش‌فرض‌های قانون کار
                  </Button>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-emerald-600 pr-2">حقوق و دستمزد مبنا</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">حقوق پایه روزانه (ریال) <span className="text-rose-500">*</span></Label>
                      <Input type="number" value={form.dailyBaseSalary} onChange={e => handleChange("dailyBaseSalary", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left font-bold" required />
                      <span className="text-[10px] text-muted-foreground block mt-1 leading-normal">
                        معادل حقوق ماهانه ۳۰ روزه: <strong className="text-slate-700 dark:text-slate-300">{monthlyBaseSalary.toLocaleString("fa-IR")} ریال</strong>
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">حق مسکن ماهانه (ریال)</Label>
                      <Input type="number" value={form.housingAllowance} onChange={e => handleChange("housingAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">بن خواربار و کمک معیشتی ماهانه (ریال)</Label>
                      <Input type="number" value={form.groceryAllowance} onChange={e => handleChange("groceryAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-emerald-600 pr-2">فوق‌العاده‌ها و مزایای مستمر جانبی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">حق اولاد ماهانه (ریال)</Label>
                      <Input type="number" value={form.childAllowance} onChange={e => handleChange("childAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left bg-muted/40" readOnly />
                      <span className="text-[9.5px] text-muted-foreground block mt-1 leading-normal">
                        محاسبه خودکار: به ازای هر فرزند، ۳ برابر حداقل مزد روزانه ({CHILD_ALLOWANCE_PER_CHILD_1405.toLocaleString("fa-IR")} ریال)
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">حق مسئولیت / مدیریت (ریال)</Label>
                      <Input type="number" value={form.responsibilityAllowance} onChange={e => handleChange("responsibilityAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">حق جذب، تخصص و مهارت (ریال)</Label>
                      <Input type="number" value={form.expertiseAllowance} onChange={e => handleChange("expertiseAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">فوق‌العاده ایاب و ذهاب (ریال)</Label>
                      <Input type="number" value={form.transportAllowance} onChange={e => handleChange("transportAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">سایر مزایای مستمر ماهانه (ریال)</Label>
                      <Input type="number" value={form.otherAllowances} onChange={e => handleChange("otherAllowances", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="0" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center border border-emerald-500/20">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">مجموع حقوق ناخالص مستمر ماهانه (۳۰ روزه)</span>
                    <span className="text-xs text-slate-400 font-medium">مجموع تمام ردیف‌های حقوق و مزایای فوق</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-lg font-black text-emerald-800 dark:text-emerald-400">{(totalSalarySum / 10).toLocaleString("fa-IR")} <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تومان</span></span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{totalSalarySum.toLocaleString("fa-IR")} ریال</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 4: BANK & FINANCIAL ─── */}
            {activeTab === "bank" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-amber-600 pr-2">اطلاعات حساب بانکی اول (حساب اصلی)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">نام بانک اول (فیلد ۵۸ خزانه)</Label>
                      <Input value={form.bankName || ""} onChange={e => handleChange("bankName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: بانک سپه" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام شعبه بانک (فیلد ۵۹ خزانه)</Label>
                      <Input value={form.branchName || ""} onChange={e => handleChange("branchName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: مرکزی" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد شعبه بانک (فیلد ۶۰ خزانه)</Label>
                      <Input value={form.bankBranchCode || ""} onChange={e => handleChange("bankBranchCode", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="101" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره حساب بانکی اول (فیلد ۵۷ خزانه)</Label>
                      <Input value={form.accountNo || ""} onChange={e => handleChange("accountNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۰۱۰۲۳۴۵۶۷۸" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره کارت بانکی اول (۱۶ رقم)</Label>
                      <Input value={form.cardNumber || ""} onChange={e => handleChange("cardNumber", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="6037-9911-2222-3333" maxLength={19} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">شماره شبا اول (۲۴ رقم)</Label>
                      <div className="mt-1.5">
                        <ShebaInput value={form.shebaNo || ""} onChange={val => handleChange("shebaNo", val)} />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-blue-600 pr-2">اطلاعات حساب بانکی دوم (حساب فرعی / پشتیبان)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">نام بانک دوم</Label>
                      <Input value={form.bankName2 || ""} onChange={e => handleChange("bankName2", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: بانک تجارت، بانک سپه" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره حساب بانکی دوم</Label>
                      <Input value={form.accountNo2 || ""} onChange={e => handleChange("accountNo2", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۰۱۰۲۳۴۵۶۷۸" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره کارت بانکی دوم (۱۶ رقم)</Label>
                      <Input value={form.cardNumber2 || ""} onChange={e => handleChange("cardNumber2", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="6037-9911-2222-3333" maxLength={19} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">شماره شبا دوم (۲۴ رقم)</Label>
                      <div className="mt-1.5">
                        <ShebaInput value={form.shebaNo2 || ""} onChange={val => handleChange("shebaNo2", val)} />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">ارائه حساب دوم جهت تکمیل پرونده پرسنلی و پرداخت‌های حمایتی/رفاهی یا پشتیبان</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3 no-print">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/payroll/employees/list")} className="text-xs h-9">
                انصراف
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow">
                <Save className="h-4 w-4" />
                {isSubmitting ? "در حال ثبت اطلاعات..." : editingId ? "ویرایش و ذخیره کارمند" : "ذخیره و ثبت کارمند"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}
