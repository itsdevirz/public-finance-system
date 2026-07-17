import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  User, Briefcase, CreditCard, DollarSign, Save, Plus, ArrowRight,
  ShieldCheck, AlertCircle, Info, Landmark, HelpCircle, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "personal",   label: "اطلاعات شناسنامه‌ای و فردی", icon: User },
  { key: "employment", label: "اطلاعات استخدامی و شغلی",  icon: Briefcase },
  { key: "salary",     label: "حقوق، دستمزد و مزایای پایه",icon: DollarSign },
  { key: "bank",       label: "حساب بانکی و مالی",      icon: CreditCard },
];

const INITIAL_FORM = {
  // Personal Info
  firstName: "",
  lastName: "",
  fatherName: "",
  nationalId: "",
  certificateNo: "",
  gender: "male",
  birthDate: "",
  birthPlace: "",
  issuePlace: "",
  maritalStatus: "single",
  childrenCount: 0,
  dependentsCount: 0,
  militaryStatus: "exempt",

  // Contact Info
  mobile: "",
  phone: "",
  postalCode: "",
  address: "",
  email: "",

  // Employment Info
  code: "",
  hireDate: "",
  status: "active",
  employmentType: "contractual",
  department: "اداری",
  jobTitle: "",
  insuranceNo: "",
  branchName: "شعبه مرکزی",
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
  bankName: "",
  accountNo: "",
  cardNumber: "",
  shebaNo: "",
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
    setForm(f => ({ ...f, [field]: val }));
    setErrorMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMsg("نام و نام خانوادگی الزامی است.");
      setActiveTab("personal");
      return;
    }
    if (!form.nationalId.trim() || form.nationalId.length !== 10) {
      setErrorMsg("کد ملی باید دقیقاً ۱۰ رقم باشد.");
      setActiveTab("personal");
      return;
    }
    if (!form.code.trim()) {
      setErrorMsg("کد پرسنلی الزامی است.");
      setActiveTab("employment");
      return;
    }

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
        <Button variant="outline" size="sm" onClick={() => navigate("/payroll/employees/list")} className="gap-1.5 text-xs">
          <ArrowRight className="h-4 w-4" /> لیست کارکنان
        </Button>
      </div>

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
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-blue-600 pr-2">اطلاعات شناسنامه‌ای و هویتی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">نام <span className="text-rose-500">*</span></Label>
                      <Input value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: علی" required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام خانوادگی <span className="text-rose-500">*</span></Label>
                      <Input value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: احمدی" required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد ملی (۱۰ رقم) <span className="text-rose-500">*</span></Label>
                      <Input value={form.nationalId} onChange={e => handleChange("nationalId", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="0012345678" maxLength={10} required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام پدر</Label>
                      <Input value={form.fatherName} onChange={e => handleChange("fatherName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره شناسنامه</Label>
                      <Input value={form.certificateNo} onChange={e => handleChange("certificateNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="..." />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">جنسیت</Label>
                      <select value={form.gender} onChange={e => handleChange("gender", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="male">مرد</option>
                        <option value="female">زن</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تاریخ تولد</Label>
                      <PersianDatePicker value={form.birthDate} onChange={e => handleChange("birthDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۳۷۰/۰۱/۰۱" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">محل تولد</Label>
                      <Input value={form.birthPlace} onChange={e => handleChange("birthPlace", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: تهران" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">محل صدور شناسنامه</Label>
                      <Input value={form.issuePlace} onChange={e => handleChange("issuePlace", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: شیراز" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت تاهل</Label>
                      <select value={form.maritalStatus} onChange={e => handleChange("maritalStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="single">مجرد</option>
                        <option value="married">متاهل</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تعداد فرزندان (جهت حق اولاد)</Label>
                      <Input type="number" min="0" value={form.childrenCount} onChange={e => handleChange("childrenCount", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت نظام وظیفه (آقایان)</Label>
                      <select value={form.militaryStatus} onChange={e => handleChange("militaryStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5" disabled={form.gender === "female"}>
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
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-teal-600 pr-2">اطلاعات سازمانی و قراردادی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">کد پرسنلی <span className="text-rose-500">*</span></Label>
                      <Input value={form.code} onChange={e => handleChange("code", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="EMP-001" required />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تاریخ استخدام</Label>
                      <PersianDatePicker value={form.hireDate} onChange={e => handleChange("hireDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۳/۰۱/۰۱" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نوع استخدام</Label>
                      <select value={form.employmentType} onChange={e => handleChange("employmentType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="official">رسمی قطعی</option>
                        <option value="probationary">پیمانی</option>
                        <option value="contractual">قراردادی کار معین</option>
                        <option value="hourly">ساعتی</option>
                        <option value="daily">روزمزد</option>
                        <option value="consultant">مشاوره‌ای / پیمانکاری</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">واحد سازمانی / دپارتمان</Label>
                      <select value={form.department} onChange={e => handleChange("department", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="مدیریت">مدیریت عاملی</option>
                        <option value="مالی">امور مالی و حسابداری</option>
                        <option value="اداری">اداری و منابع انسانی</option>
                        <option value="فناوری اطلاعات">فناوری اطلاعات (IT)</option>
                        <option value="فروش">فروش و بازاریابی</option>
                        <option value="پشتیبانی">پشتیبانی و تدارکات</option>
                        <option value="تولید">تولید و انبارداری</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">ردیف / عنوان شغلی</Label>
                      <Input value={form.jobTitle} onChange={e => handleChange("jobTitle", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: حسابدار ارشد" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره بیمه تامین اجتماعی</Label>
                      <Input value={form.insuranceNo} onChange={e => handleChange("insuranceNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۱۰۲۳۴۵۶۷" maxLength={10} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت مالیاتی کارمند</Label>
                      <select value={form.taxStatus} onChange={e => handleChange("taxStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                        <option value="taxable">مشمول پرداخت مالیات حقوق</option>
                        <option value="exempt">معاف از مالیات حقوق (ماده ۹۱)</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">محل خدمت / شعبه کاربری</Label>
                      <Input value={form.branchName} onChange={e => handleChange("branchName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: دفتر مرکزی تهران" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت اشتغال فعلی</Label>
                      <select value={form.status} onChange={e => handleChange("status", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
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
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-2 mb-4 border-r-4 border-amber-600 pr-2">اطلاعات حساب واریز حقوق و دستمزد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <Label className="text-xs font-semibold">نام بانک</Label>
                      <Input value={form.bankName} onChange={e => handleChange("bankName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: بانک ملی، بانک ملت" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره حساب بانکی</Label>
                      <Input value={form.accountNo} onChange={e => handleChange("accountNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="مثال: ۰۱۰۲۳۴۵۶۷۸" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره کارت بانکی (۱۶ رقم)</Label>
                      <Input value={form.cardNumber} onChange={e => handleChange("cardNumber", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="6037-9911-2222-3333" maxLength={19} />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">شماره شبا (۲۴ رقم بدون حروف IR)</Label>
                      <div className="relative mt-1.5">
                        <Input value={form.shebaNo} onChange={e => handleChange("shebaNo", e.target.value)} className="h-9 text-xs font-mono text-left pl-8" placeholder="120170000000102345678901" maxLength={24} />
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono font-bold select-none">IR</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 block">جهت تهیه فایل الکترونیکی حواله بین‌بانکی پایا/ساتنا برای پرداخت حقوق گروهی بانک‌ها</span>
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
