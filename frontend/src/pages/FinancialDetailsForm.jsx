import { useState, useEffect } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ShebaInput from "@/components/ui/sheba-input";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import {
  Landmark, UserCheck, CreditCard, Save, Printer,
  RefreshCw, ShieldCheck, AlertCircle, Info, CheckCircle2,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_DETAILS = {
  // ۱. مشخصات عمومی و شناسه سازمان
  orgName: "",
  budgetOrgCode: "",
  nationalId: "",
  treasurerFileNo: "",
  province: "",
  city: "",
  postalCode: "",
  address: "",
  phone: "",
  fax: "",
  email: "",

  // ۲. مشخصات ذیحساب و مدیران مالی
  treasurerName: "",
  treasurerNationalId: "",
  appointmentNo: "",
  appointmentDate: "",
  appointmentIssuer: "",
  deputyTreasurerName: "",
  deputyNationalId: "",
  treasurerMobile: "",

  // ۳. شماره حساب‌های بانکی ذیحسابی نزد بانک مرکزی
  bankName: "",
  branchCode: "",
  expenseAccountNo: "",
  expenseSheba: "",
  capitalAccountNo: "",
  capitalSheba: "",
  depositAccountNo: "",
  depositSheba: "",
  revenueAccountNo: "",
  revenueSheba: "",

  // ۴. شناسه و تنظیمات سامانه سناما
  sanamaZoneCode: "",
  sanamaTreasurerCode: "",
  sanamaVersion: "",
  sanamaStatus: "active",
  lastUpdated: null,
};

const TABS = [
  { id: "org", label: "اطلاعات شناسه دستگاه", icon: Building2 },
  { id: "treasurer", label: "مشخصات ذیحساب و معاون", icon: UserCheck },
  { id: "accounts", label: "حساب‌های بانکی ذیحسابی", icon: CreditCard },
  { id: "sanama", label: "الزامات و کدهای سناما", icon: ShieldCheck },
];

export default function FinancialDetailsForm() {
  const [activeTab, setActiveTab] = useState("org");
  const [form, setForm] = useState(INITIAL_DETAILS);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load saved details from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("financial_details");
      if (saved) {
        setForm(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  function handleChange(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleReset() {
    if (window.confirm("آیا از بازنشانی مشخصات ذیحسابی به مقادیر پیش‌فرض اطمینان دارید؟")) {
      setForm(INITIAL_DETAILS);
      localStorage.setItem("financial_details", JSON.stringify(INITIAL_DETAILS));
      localStorage.setItem("org_name", INITIAL_DETAILS.orgName);
      setSuccessMsg("اطلاعات به مقادیر پیش‌فرض با موفقیت بازنشانی شد.");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.orgName.trim()) {
      setErrorMsg("نام دستگاه اجرایی / سازمان الزامی است.");
      setActiveTab("org");
      return;
    }
    if (!form.nationalId.trim() || form.nationalId.length !== 11) {
      setErrorMsg("شناسه ملی دستگاه اجرایی باید دقیقاً ۱۱ رقم باشد.");
      setActiveTab("org");
      return;
    }
    if (!form.treasurerName.trim() || !form.treasurerNationalId.trim()) {
      setErrorMsg("نام و کد ملی ذیحساب الزامی است.");
      setActiveTab("treasurer");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      const updatedForm = {
        ...form,
        lastUpdated: new Date().toISOString()
      };

      // ذخیره‌سازی همگام در localStorage
      localStorage.setItem("financial_details", JSON.stringify(updatedForm));
      localStorage.setItem("org_name", form.orgName); // همگام‌سازی نام سازمان در سراسر سیستم

      setTimeout(() => {
        setIsSaving(false);
        setSuccessMsg("مشخصات ذیحسابی و حساب‌های بانکی با موفقیت ثبت و تایید گردید.");
      }, 300);
    } catch (err) {
      setIsSaving(false);
      setErrorMsg("خطا در ذخیره‌سازی اطلاعات: " + err.message);
    }
  }

  function handlePrint() {
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;

    const toPersianDigits = (str) => String(str || "").replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>برگه تایید مشخصات رسمی ذیحسابی</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; padding: 10px; margin: 0; line-height: 1.6; }
    .container { border: 2px solid #222; border-radius: 8px; padding: 20px; background: #fff; max-width: 750px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 15px; }
    .header h2 { margin: 0; font-size: 15px; font-weight: bold; }
    .header .sub { font-size: 11px; margin-top: 4px; color: #333; }
    .section-title { font-size: 12px; font-weight: bold; background: #f0f0f0; padding: 6px 10px; border-right: 4px solid #111; margin: 15px 0 10px 0; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
    .grid div { padding: 4px 0; }
    .grid strong { color: #000; }
    .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; text-align: center; }
    .sig-box { width: 45%; border-top: 1px dashed #666; pt-10; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h2>وزارت امور اقتصادی و دارایی — معاونت نظارت مالی</h2>
        <div class="sub">برگه رسمی مشخصات شناسنامه‌ای و حساب‌های ذیحسابی دستگاه اجرایی</div>
      </div>
      <div style="text-align: left; font-size: 10px;">
        <div>تاریخ صدور: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
        <div>شماره پرونده: ${toPersianDigits(form.treasurerFileNo)}</div>
      </div>
    </div>

    <div class="section-title">۱. مشخصات شناسنامه‌ای و پستی دستگاه اجرایی</div>
    <div class="grid">
      <div><strong>نام کامل سازمان/دستگاه:</strong> ${form.orgName}</div>
      <div><strong>کد دستگاه اجرایی (بودجه):</strong> ${toPersianDigits(form.budgetOrgCode)}</div>
      <div><strong>شناسه ملی دستگاه:</strong> ${toPersianDigits(form.nationalId)}</div>
      <div><strong>کد کلاسه ذیحسابی:</strong> ${toPersianDigits(form.treasurerFileNo)}</div>
      <div><strong>استان / شهرستان:</strong> ${form.province} / ${form.city}</div>
      <div><strong>کد پستی ۱۰ رقمی:</strong> ${toPersianDigits(form.postalCode)}</div>
      <div><strong>شماره تلفن:</strong> ${toPersianDigits(form.phone)}</div>
      <div><strong>دورنگار (فکس):</strong> ${toPersianDigits(form.fax)}</div>
      <div style="grid-column: span 2;"><strong>نشانی کامل پستی:</strong> ${form.address}</div>
    </div>

    <div class="section-title">۲. مشخصات ذیحساب و مدیر مالی قانونی</div>
    <div class="grid">
      <div><strong>نام و نام خانوادگی ذیحساب:</strong> ${form.treasurerName}</div>
      <div><strong>کد ملی ذیحساب:</strong> ${toPersianDigits(form.treasurerNationalId)}</div>
      <div><strong>شماره حکم انتصاب:</strong> ${toPersianDigits(form.appointmentNo)}</div>
      <div><strong>تاریخ حکم انتصاب:</strong> ${toPersianDigits(form.appointmentDate)}</div>
      <div><strong>مرجع صادرکننده حکم:</strong> ${form.appointmentIssuer}</div>
      <div><strong>نام معاون ذیحساب/مدیر مالی:</strong> ${form.deputyTreasurerName || "—"}</div>
      <div><strong>کد ملی معاون ذیحساب:</strong> ${toPersianDigits(form.deputyNationalId || "—")}</div>
      <div><strong>تلفن همراه مسئول (سناما):</strong> ${toPersianDigits(form.treasurerMobile)}</div>
    </div>

    <div class="section-title">۳. حساب‌های بانکی تمرکز وجوه ذیحسابی (بانک مرکزی)</div>
    <div class="grid">
      <div><strong>حساب اعتبارات هزینه‌ای:</strong> ${toPersianDigits(form.expenseAccountNo)}</div>
      <div><strong>شبا هزینه‌ای:</strong> <span style="font-family:monospace;">${form.expenseSheba}</span></div>
      <div><strong>حساب اعتبارات سرمایه‌ای:</strong> ${toPersianDigits(form.capitalAccountNo)}</div>
      <div><strong>شبا سرمایه‌ای:</strong> <span style="font-family:monospace;">${form.capitalSheba}</span></div>
      <div><strong>حساب رد وجوه سپرده:</strong> ${toPersianDigits(form.depositAccountNo)}</div>
      <div><strong>شبا سپرده:</strong> <span style="font-family:monospace;">${form.depositSheba}</span></div>
      <div><strong>حساب تمرکز درآمدها:</strong> ${toPersianDigits(form.revenueAccountNo)}</div>
      <div><strong>شبا درآمدها:</strong> <span style="font-family:monospace;">${form.revenueSheba}</span></div>
    </div>

    <div class="section-title">۴. کدهای شناسه در سامانه سناما و گزارشگری مالی</div>
    <div class="grid">
      <div><strong>کد حوزه ذیحسابی در سناما:</strong> ${toPersianDigits(form.sanamaZoneCode)}</div>
      <div><strong>کد اختصاصی ذیحساب در سناما:</strong> ${toPersianDigits(form.sanamaTreasurerCode)}</div>
      <div><strong>نسخه استاندارد سناما:</strong> ${toPersianDigits(form.sanamaVersion)}</div>
      <div><strong>وضعیت تایید الکترونیکی:</strong> تایید شده و فعال</div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <strong>امضاء و مهر ذیحساب دستگاه اجرایی</strong><br/><br/>
        <span>${form.treasurerName}</span>
      </div>
      <div class="sig-box">
        <strong>مهر و تایید اداره کل امور اقتصادی و دارایی</strong><br/><br/>
        <span>معاونت نظارت مالی و خزانه داری استان</span>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <PageShell>
      <PageHeader
        title="مشخصات ذیحسابی و حساب‌های بانکی"
        description="مدیریت اطلاعات شناسنامه‌ای، کد سازمان در بودجه، کدهای سناما و حساب‌های تمرکز وجوه نزد بانک مرکزی"
      />

      <div className="space-y-4 text-right" dir="rtl">
        {/* پیام‌های هشدار و موفقیت */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* هدر کنترل‌های عملیاتی */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {form.orgName || "نام دستگاه اجرایی (ثبت نشده)"}
                {form.budgetOrgCode && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                    کد بودجه: {form.budgetOrgCode}
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                ذیحساب مسئول: <span className="font-bold text-slate-700 dark:text-slate-300">{form.treasurerName || "—"}</span> — پرونده: {form.treasurerFileNo || "—"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 text-xs gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className="h-4 w-4" /> بازنشانی
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 text-xs gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 font-bold"
            >
              <Printer className="h-4 w-4" /> چاپ برگه رسمی مشخصات
            </Button>
          </div>
        </div>

        {/* کارت اصلی با تب‌بندی */}
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* ناوبری تب‌ها */}
            <div className="flex flex-wrap gap-2">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ─── TAB 1: اطلاعات عمومی و شناسه سازمان ─── */}
              {activeTab === "org" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs">
                    <Info className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>اطلاعات این بخش برای تولید سرفصل‌های اسناد، گواهی‌ها و نامه‌نگاری‌های رسمی حسابداری استفاده می‌شود.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">نام کامل دستگاه اجرایی / سازمان *</Label>
                      <Input
                        value={form.orgName}
                        onChange={e => handleChange("orgName", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-bold"
                        placeholder="مثال: اداره کل امور اقتصادی و دارایی"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد دستگاه اجرایی در نظام بودجه *</Label>
                      <Input
                        value={form.budgetOrgCode}
                        onChange={e => handleChange("budgetOrgCode", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        placeholder="مثال: ۱۰۱۰xx"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شناسه ملی دستگاه اجرایی (۱۱ رقم) *</Label>
                      <Input
                        value={form.nationalId}
                        onChange={e => handleChange("nationalId", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        maxLength={11}
                        placeholder="۱400xxxxxxx"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره کلاسه / پرونده ذیحسابی</Label>
                      <Input
                        value={form.treasurerFileNo}
                        onChange={e => handleChange("treasurerFileNo", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        placeholder="ZH-1405-xx"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">استان محل استقرار</Label>
                      <Input
                        value={form.province}
                        onChange={e => handleChange("province", e.target.value)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شهرستان / حوزه ذیحسابی</Label>
                      <Input
                        value={form.city}
                        onChange={e => handleChange("city", e.target.value)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد پستی ۱۰ رقمی</Label>
                      <Input
                        value={form.postalCode}
                        onChange={e => handleChange("postalCode", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره تلفن مستقیم ذیحسابی</Label>
                      <Input
                        value={form.phone}
                        onChange={e => handleChange("phone", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        placeholder="021xxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره دورنگار (فکس)</Label>
                      <Input
                        value={form.fax}
                        onChange={e => handleChange("fax", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs font-semibold">پست الکترونیک رسمی (ایمیل)</Label>
                      <Input
                        value={form.email}
                        onChange={e => handleChange("email", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        placeholder="zihasabi@domain.gov.ir"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs font-semibold">نشانی دقیق پستی دبیرخانه ذیحسابی</Label>
                      <Input
                        value={form.address}
                        onChange={e => handleChange("address", e.target.value)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: مشخصات ذیحساب و معاون ─── */}
              {activeTab === "treasurer" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs">
                    <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>مشخصات ذیحساب و معاون در چک‌ها، ترازنامه‌ها، صورت‌های مالی و فایل‌های سناما چاپ می‌گردد.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">نام و نام خانوادگی ذیحساب *</Label>
                      <Input
                        value={form.treasurerName}
                        onChange={e => handleChange("treasurerName", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-bold text-slate-900 dark:text-white"
                        placeholder="مثال: محمدعلی رضایی"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد ملی ۱۰ رقمی ذیحساب *</Label>
                      <Input
                        value={form.treasurerNationalId}
                        onChange={e => handleChange("treasurerNationalId", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تلفن همراه ذیحساب (دریافت پیامک سناما)</Label>
                      <Input
                        value={form.treasurerMobile}
                        onChange={e => handleChange("treasurerMobile", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        placeholder="0912xxxxxxx"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">شماره حکم انتصاب ذیحساب</Label>
                      <Input
                        value={form.appointmentNo}
                        onChange={e => handleChange("appointmentNo", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تاریخ انتصاب / صدور حکم</Label>
                      <PersianDatePicker
                        value={form.appointmentDate}
                        onChange={e => handleChange("appointmentDate", e.target.value)}
                        className="h-9 mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">مرجع انتصاب و صدور حکم</Label>
                      <Input
                        value={form.appointmentIssuer}
                        onChange={e => handleChange("appointmentIssuer", e.target.value)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Separator className="my-2" />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">نام و نام خانوادگی معاون ذیحساب / مدیر مالی</Label>
                      <Input
                        value={form.deputyTreasurerName}
                        onChange={e => handleChange("deputyTreasurerName", e.target.value)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد ملی معاون ذیحساب</Label>
                      <Input
                        value={form.deputyNationalId}
                        onChange={e => handleChange("deputyNationalId", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: حساب‌های بانکی ذیحسابی ─── */}
              {activeTab === "accounts" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
                    <CreditCard className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>حساب‌های تمرکز وجوه ذیحسابی نزد بانک مرکزی جهت صدور دستور پرداخت و مغایرت‌گیری بانکی.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">نام بانک عامل تمرکز وجوه</Label>
                      <Input
                        value={form.bankName}
                        onChange={e => handleChange("bankName", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد شعبه بانک عامل</Label>
                      <Input
                        value={form.branchCode}
                        onChange={e => handleChange("branchCode", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Separator className="my-1" />
                    </div>

                    {/* ۱. اعتبارات هزینه‌ای */}
                    <div>
                      <Label className="text-xs font-semibold text-blue-700 dark:text-blue-400">شماره حساب تمرکز وجوه اعتبارات هزینه‌ای</Label>
                      <Input
                        value={form.expenseAccountNo}
                        onChange={e => handleChange("expenseAccountNo", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-blue-700 dark:text-blue-400">شماره شبا اعتبارات هزینه‌ای</Label>
                      <ShebaInput
                        value={form.expenseSheba}
                        onChange={val => handleChange("expenseSheba", val)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>

                    {/* ۲. اعتبارات سرمایه‌ای */}
                    <div>
                      <Label className="text-xs font-semibold text-purple-700 dark:text-purple-400">شماره حساب اعتبارات تملک دارایی‌های سرمایه‌ای</Label>
                      <Input
                        value={form.capitalAccountNo}
                        onChange={e => handleChange("capitalAccountNo", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-purple-700 dark:text-purple-400">شماره شبا اعتبارات سرمایه‌ای</Label>
                      <ShebaInput
                        value={form.capitalSheba}
                        onChange={val => handleChange("capitalSheba", val)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>

                    {/* ۳. رد وجوه سپرده */}
                    <div>
                      <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">شماره حساب رد وجوه سپرده</Label>
                      <Input
                        value={form.depositAccountNo}
                        onChange={e => handleChange("depositAccountNo", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">شماره شبا رد وجوه سپرده</Label>
                      <ShebaInput
                        value={form.depositSheba}
                        onChange={val => handleChange("depositSheba", val)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>

                    {/* ۴. درآمدها */}
                    <div>
                      <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">شماره حساب تمرکز وجوه درآمدها</Label>
                      <Input
                        value={form.revenueAccountNo}
                        onChange={e => handleChange("revenueAccountNo", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">شماره شبا تمرکز درآمدها</Label>
                      <ShebaInput
                        value={form.revenueSheba}
                        onChange={val => handleChange("revenueSheba", val)}
                        className="h-9 text-xs mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 4: کدهای سناما ─── */}
              {activeTab === "sanama" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600" />
                    <span>تنظیمات و کدهای شناسه مربوط به ارسال الکترونیکی صورت‌های مالی در سامانه سناما (دیوان محاسبات).</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">کد حوزه ذیحسابی در سناما</Label>
                      <Input
                        value={form.sanamaZoneCode}
                        onChange={e => handleChange("sanamaZoneCode", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left font-bold"
                        placeholder="مثال: TH-01"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">کد اختصاصی ذیحساب در سناما</Label>
                      <Input
                        value={form.sanamaTreasurerCode}
                        onChange={e => handleChange("sanamaTreasurerCode", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left font-bold"
                        placeholder="مثال: ZH-8890"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نسخه استاندارد فایل‌های سناما</Label>
                      <Input
                        value={form.sanamaVersion}
                        onChange={e => handleChange("sanamaVersion", e.target.value)}
                        className="h-9 text-xs mt-1.5 font-mono text-left"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">وضعیت تایید الکترونیکی در سناما</Label>
                      <select
                        value={form.sanamaStatus}
                        onChange={e => handleChange("sanamaStatus", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5 font-semibold"
                      >
                        <option value="active">تایید شده و فعال</option>
                        <option value="pending">در انتظار تایید حوزه خزانه</option>
                        <option value="inactive">غیرفعال موقت</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* نوار ذخیره پایین صفحه */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  آخرین بروزرسانی: {form.lastUpdated ? new Date(form.lastUpdated).toLocaleDateString("fa-IR") : "—"}
                </span>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow-md shadow-blue-500/20"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "در حال ثبت اطلاعات..." : "ذخیره و ثبت نهایی مشخصات ذیحسابی"}
                  </Button>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
