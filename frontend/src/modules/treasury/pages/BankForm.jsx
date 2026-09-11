import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, ArrowRight, Info, AlignJustify, User, Building2, Landmark,
  ShieldCheck, AlertCircle, Plus, CheckCircle2, Trash2, Edit, Loader2
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ShebaInput from "@/components/ui/sheba-input";
import { cn } from "@/lib/utils";
import api from "@/api";

// ─── لیست بانک‌های کشور (شامل بانک مرکزی) ──────────────────────────────────
const BANKS_LIST = [
  { value: "", label: "انتخاب بانک" },
  { value: "central", label: "بانک مرکزی جمهوری اسلامی ایران (بانک مرکزی)" },
  { value: "melli", label: "بانک ملی ایران" },
  { value: "mellat", label: "بانک ملت" },
  { value: "saderat", label: "بانک صادرات ایران" },
  { value: "tejarat", label: "بانک تجارت" },
  { value: "sepah", label: "بانک سپه" },
  { value: "refah", label: "بانک رفاه کارگران" },
  { value: "maskan", label: "بانک مسکن" },
  { value: "parsian", label: "بانک پارسیان" },
  { value: "pasargad", label: "بانک پاسارگاد" },
];

const BRANCHES_MAP = {
  central: [
    { value: "", label: "انتخاب شعبه" },
    { value: "cb_treasury", label: "اداره اعتبارات و خزانه‌داری کل کشور" },
    { value: "cb_gov", label: "اداره امور حساب‌های دولتی" },
    { value: "cb_main", label: "شعبه مرکزی (تهران)" }
  ],
  melli: [{ value: "", label: "انتخاب شعبه" }, { value: "mk1", label: "شعبه مرکزی" }, { value: "mk2", label: "شعبه آزادی" }, { value: "mk3", label: "شعبه انقلاب" }],
  mellat: [{ value: "", label: "انتخاب شعبه" }, { value: "mt1", label: "شعبه مرکزی" }, { value: "mt2", label: "شعبه ولیعصر" }],
  saderat: [{ value: "", label: "انتخاب شعبه" }, { value: "sd1", label: "شعبه مرکزی" }, { value: "sd2", label: "شعبه فردوسی" }],
  tejarat: [{ value: "", label: "انتخاب شعبه" }, { value: "tj1", label: "شعبه مرکزی" }],
  sepah: [{ value: "", label: "انتخاب شعبه" }, { value: "sp1", label: "شعبه مرکزی" }],
  refah: [{ value: "", label: "انتخاب شعبه" }, { value: "rf1", label: "شعبه مرکزی" }],
  maskan: [{ value: "", label: "انتخاب شعبه" }, { value: "ms1", label: "شعبه مرکزی" }],
  parsian: [{ value: "", label: "انتخاب شعبه" }, { value: "ps1", label: "شعبه مرکزی" }],
  pasargad: [{ value: "", label: "انتخاب شعبه" }, { value: "pg1", label: "شعبه مرکزی" }],
};

// ─── کدهای معین حساب‌های بانکی مطابق با طبقه‌بندی سناما و خزانه‌داری ──────────
const MOEIN_ACCOUNTS = [
  { value: "", label: "انتخاب حساب معین متناظر" },
  { value: "11001", label: "۱۱۰۰۱ — بانک پرداخت هزینه (اعتبارات هزینه‌ای)" },
  { value: "11002", label: "۱۱۰۰۲ — بانک پرداخت سرمایه‌ای (تملک اعتبارات سرمایه‌ای)" },
  { value: "11003", label: "۱۱۰۰۳ — بانک پرداخت اختصاصی" },
  { value: "11004", label: "۱۱۰۰۴ — بانک وجوه سایر منابع" },
  { value: "11005", label: "۱۱۰۰۵ — بانک دریافت وجوه سپرده" },
  { value: "11006", label: "۱۱۰۰۶ — بانک رد وجوه سپرده" },
  { value: "11007", label: "۱۱۰۰۷ — بانک دریافت" },
  { value: "11009", label: "۱۱۰۰۹ — بانک رد وجوه اضافه دریافتی" },
  { value: "11010", label: "۱۱۰۱۰ — بانک مالیات و عوارض ارزش افزوده" },
  { value: "11011", label: "۱۱۰۱۱ — بانک وجوه کارشناسی ثبت" },
  { value: "11012", label: "۱۱۰۱۲ — بانک وجوه خدمات ثبت" },
  { value: "11013", label: "۱۱۰۱۳ — بانک وجوه اموال سرقتی و اختلاسی" },
  { value: "11014", label: "۱۱۰۱۴ — بانک دریافت فروش اراضی" },
  { value: "11015", label: "۱۱۰۱۵ — بانک پرداخت فروش اراضی" },
  { value: "11016", label: "۱۱۰۱۶ — بانک دریافت درآمد خانه‌های سازمانی" },
  { value: "11017", label: "۱۱۰۱۷ — بانک پرداخت خانه‌های سازمانی" },
  { value: "11018", label: "۱۱۰۱۸ — بانک پرداخت وجوه یارانه" },
  { value: "11019", label: "۱۱۰۱۹ — بانک ارزی" },
  { value: "1110", label: "۱۱۱۰ — صندوق" },
  { value: "1120", label: "۱۱۲۰ — سایر بانک‌های تجاری" },
];

const CURRENCIES = [
  { value: "rial", label: "ریال" },
  { value: "toman", label: "تومان" },
  { value: "dollar", label: "دلار آمریکا" },
  { value: "euro", label: "یورو" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

const INITIAL_FORM = {
  bank: "",
  branch: "",
  accountNumber: "",
  moeinAccount: "",
  sheba: "",
  bankCode: "",
  branchCode: "",
  currency: "rial",
  accountHolder: "",
  description: "",
  status: "active",
  displayOrder: "1",
};

function Field({ label, required, children, fullWidth }) {
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "col-span-2")}>
      <Label className="text-sm font-medium text-foreground text-right flex items-center justify-between">
        <span>
          {label}
          {required && <span className="text-blue-600 mr-1">*</span>}
        </span>
      </Label>
      {children}
    </div>
  );
}

function StyledSelect({ value, onChange, options, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed text-right pr-3 pl-8"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
        ‹
      </span>
    </div>
  );
}

export default function BankForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const isCentralSelected = form.bank === "central";

  // ── بارگذاری داده‌های واقعی از دیتابیس ──
  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/bank-accounts");
      setBankAccounts(res.data?.data ?? []);
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      setAlertMsg({ type: "error", text: "خطا در دریافت لیست حساب‌های بانکی از سرور" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  function set(field) {
    return (e) => {
      const val = e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        if (field === "bank") {
          next.branch = "";
          if (val === "central") {
            next.bankCode = "010";
            if (!next.accountNumber) next.accountNumber = "400";
            if (!next.sheba) next.sheba = "IR0100000000400";
          }
        }
        return next;
      });
      setAlertMsg(null);
    };
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!form.bank || !form.branch || !form.accountNumber) {
      setAlertMsg({ type: "error", text: "لطفاً فیلدهای ستاره‌دار (بانک، شعبه و شماره حساب) را وارد نمایید." });
      return;
    }

    setSaving(true);
    try {
      const selectedBankObj = BANKS_LIST.find(b => b.value === form.bank);
      const selectedBranchObj = (BRANCHES_MAP[form.bank] || []).find(br => br.value === form.branch);
      const selectedMoeinObj = MOEIN_ACCOUNTS.find(m => m.value === form.moeinAccount);

      const payload = {
        ...form,
        bankName: selectedBankObj?.label || form.bank,
        branchName: selectedBranchObj?.label || form.branch,
        moeinTitle: selectedMoeinObj?.label || form.moeinAccount || "—",
        isCentralBank: form.bank === "central" || (form.accountNumber && String(form.accountNumber).startsWith("4"))
      };

      if (editingId) {
        await api.put(`/api/bank-accounts/${editingId}`, payload);
        setAlertMsg({ type: "success", text: "حساب بانکی با موفقیت ویرایش شد." });
        setEditingId(null);
      } else {
        await api.post("/api/bank-accounts", payload);
        setAlertMsg({ type: "success", text: "حساب بانکی جدید با موفقیت در پایگاه داده ثبت شد." });
      }

      setForm(INITIAL_FORM);
      fetchBankAccounts();
    } catch (err) {
      console.error("Error saving bank account:", err);
      setAlertMsg({ type: "error", text: err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات حساب بانکی" });
    } finally {
      setSaving(false);
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این حساب بانکی اطمینان دارید؟")) return;
    try {
      await api.delete(`/api/bank-accounts/${id}`);
      setAlertMsg({ type: "success", text: "حساب بانکی با موفقیت حذف شد." });
      fetchBankAccounts();
    } catch (err) {
      console.error("Error deleting bank account:", err);
      setAlertMsg({ type: "error", text: "خطا در حذف حساب بانکی" });
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setForm({
      bank: item.bank || "",
      branch: item.branch || "",
      accountNumber: item.accountNumber || "",
      moeinAccount: item.moeinAccount || "",
      sheba: item.sheba || "",
      bankCode: item.bankCode || "",
      branchCode: item.branchCode || "",
      currency: item.currency || "rial",
      accountHolder: item.accountHolder || "",
      description: item.description || "",
      status: item.status || "active",
      displayOrder: item.displayOrder || "1"
    });
  };

  const branchOptions = BRANCHES_MAP[form.bank] ?? [{ value: "", label: "انتخاب شعبه" }];
  const canSave = form.bank && form.branch && form.accountNumber && form.status;

  return (
    <PageShell>
      {/* ── Breadcrumb ── */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/basic-info/definitions")}>اطلاعات پایه</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/basic-info/definitions")}>تعاریف</span>
        <span>/</span>
        <span className="text-foreground">تعریف بانک</span>
      </div>

      {/* ── هدر + دکمه‌ها ── */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? "ویرایش بانک" : "ذخیره بانک جدید"}
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-600" />
            تعریف بانک و حساب‌های بانکی
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            تعریف بانک مرکزی (حساب‌های ۱۶ رقمی بودجه عمومی) و بانک‌های عامل دستگاه
          </p>
        </div>
      </div>

      <div className="space-y-6" dir="rtl">
        {/* پیام هشدار یا موفقیت */}
        {alertMsg && (
          <div className={cn(
            "p-4 rounded-xl border text-sm font-bold flex items-center gap-2 animate-fadeIn justify-between",
            alertMsg.type === "success" ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"
          )}>
            <div className="flex items-center gap-2">
              {alertMsg.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
              <span>{alertMsg.text}</span>
            </div>
            <button onClick={() => setAlertMsg(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── کارت فرم ثبت بانک ── */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="pt-6 px-6 pb-6">
            {/* پیام راهنمای خاص بانک مرکزی در صورت انتخاب */}
            {isCentralSelected && (
              <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/80 dark:bg-blue-950/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                    ضوابط افتتاح حساب نزد بانک مرکزی جمهوری اسلامی ایران (بودجه عمومی)
                  </h4>
                  <p className="leading-relaxed">
                    دستگاه‌های اجرایی که از محل <strong>بودجه عمومی</strong> پول دریافت می‌کنند و مکلف به تهیه صورتحساب هستند، الزماً حساب‌های خود را نزد بانک مرکزی افتتاح می‌نمایند.
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-blue-800 dark:text-blue-300 font-mono pt-1 space-y-0.5">
                    <li>شماره حساب‌های بانک مرکزی <strong>۱۶ رقمی</strong> بوده و با <strong>عدد ۴</strong> شروع می‌شوند (مانند: <span className="font-bold">4001000041670114</span>).</li>
                    <li>پیش‌کد شبا بانک مرکزی: <span className="font-bold">IR010...</span></li>
                  </ul>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* ردیف ۱: انتخاب بانک + شعبه */}
              <Field label="بانک" required>
                <StyledSelect
                  value={form.bank}
                  onChange={set("bank")}
                  options={BANKS_LIST}
                />
              </Field>

              <Field label="شعبه" required>
                <StyledSelect
                  value={form.branch}
                  onChange={set("branch")}
                  options={branchOptions}
                  disabled={!form.bank}
                />
              </Field>

              {/* ردیف ۲: شماره حساب + شماره حساب معین متناظر */}
              <Field label="شماره حساب" required>
                <div className="relative">
                  <Input
                    value={form.accountNumber}
                    onChange={set("accountNumber")}
                    placeholder={isCentralSelected ? "مثال: 4001000041670114 (۱۶ رقمی با ۴)" : "شماره حساب را وارد کنید"}
                    className={cn("h-10 text-sm font-mono tracking-wide", isCentralSelected && "border-blue-400 focus:ring-blue-500")}
                    dir="ltr"
                  />
                </div>
              </Field>

              <Field label="شماره حساب معین متناظر (جدول موجودی نقد)">
                <StyledSelect
                  value={form.moeinAccount}
                  onChange={set("moeinAccount")}
                  options={MOEIN_ACCOUNTS}
                />
              </Field>

              {/* ردیف ۳: شبا + کد بانک */}
              <Field label="شماره شبا (IBAN)">
                <ShebaInput
                  value={form.sheba}
                  onChange={set("sheba")}
                />
              </Field>

              <Field label="کد بانک">
                <Input
                  value={form.bankCode}
                  onChange={set("bankCode")}
                  placeholder="کد بانک (مثلاً 010 برای بانک مرکزی)"
                  className="h-10 text-sm font-mono"
                  dir="ltr"
                />
              </Field>

              {/* ردیف ۴: کد شعبه + ارز */}
              <Field label="کد شعبه">
                <Input
                  value={form.branchCode}
                  onChange={set("branchCode")}
                  placeholder="کد شعبه را وارد کنید"
                  className="h-10 text-sm font-mono"
                  dir="ltr"
                />
              </Field>

              <Field label="نوع ارز">
                <StyledSelect
                  value={form.currency}
                  onChange={set("currency")}
                  options={CURRENCIES}
                />
              </Field>

              {/* ردیف ۵: نام صاحب حساب — full width */}
              <Field label="نام صاحب حساب (دستگاه اجرایی)" fullWidth>
                <div className="relative">
                  <Input
                    value={form.accountHolder}
                    onChange={set("accountHolder")}
                    placeholder="مثال: دانشگاه علوم پزشکی / اداره کل امور مالی"
                    className="h-10 text-sm pl-9"
                  />
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </Field>

              {/* ردیف ۶: توضیحات — full width */}
              <Field label="توضیحات تکمیلی حساب" fullWidth>
                <Input
                  value={form.description}
                  onChange={set("description")}
                  placeholder="مثال: حساب اعتبارات هزینه‌ای دستگاه بانک مرکزی"
                  className="h-10 text-sm"
                />
              </Field>

              {/* ردیف ۷: وضعیت + ترتیب نمایش */}
              <Field label="وضعیت حساب" required>
                <StyledSelect
                  value={form.status}
                  onChange={set("status")}
                  options={STATUS_OPTIONS}
                />
              </Field>

              <Field label="ترتیب نمایش">
                <div className="relative">
                  <Input
                    value={form.displayOrder}
                    onChange={set("displayOrder")}
                    placeholder="۱"
                    className="h-10 text-sm font-mono pl-9"
                    dir="ltr"
                  />
                  <AlignJustify className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* ── جدول لیست بانک‌های تعریف‌شده ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Building2 className="h-4 w-4 text-blue-600" />
                لیست بانک‌ها و حساب‌های بانکی واقعی دیتابیس
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                حساب‌های افتتاح‌شده نزد بانک مرکزی و بانک‌های عامل ثبت‌شده در پایگاه داده
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {bankAccounts.length} حساب ثبت‌شده
            </Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                در حال دریافت اطلاعات حساب‌های بانکی از دیتابیس...
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                هیچ حساب بانکی در دیتابیس ثبت نشده است. از فرم بالا اولین حساب بانکی را ثبت نمایید.
              </div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center">#</th>
                    <th className="p-3">نام بانک & شعبه</th>
                    <th className="p-3">شماره حساب</th>
                    <th className="p-3">حساب معین متناظر</th>
                    <th className="p-3">شماره شبا (IBAN)</th>
                    <th className="p-3 text-center">نوع بانک</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankAccounts.map((item, idx) => (
                    <tr key={item._id || item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">
                        <div>{item.bankName || item.bank}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{item.branchName || item.branch}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700 dir-ltr text-right">
                        {item.accountNumber}
                      </td>
                      <td className="p-3 text-slate-700 font-mono">
                        {item.moeinTitle || item.moeinAccount || "—"}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dir-ltr text-right text-[11px]">
                        {item.sheba || "—"}
                      </td>
                      <td className="p-3 text-center">
                        {item.isCentralBank || item.bank === "central" || (item.accountNumber && String(item.accountNumber).startsWith("4")) ? (
                          <Badge className="bg-blue-700 text-white text-[10px] border-0 px-2 py-0.5">
                            بانک مرکزی (۱۶ رقمی)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-slate-600">
                            بانک عامل
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold",
                          item.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                          {item.status === "active" ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(item._id || item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
