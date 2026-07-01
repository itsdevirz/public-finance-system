import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowRight, Info, AlignJustify, User } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── داده‌های نمونه ────────────────────────────────────────────────────────
const BANKS_LIST = [
  { value: "",         label: "انتخاب بانک" },
  { value: "melli",   label: "بانک ملی ایران" },
  { value: "mellat",  label: "بانک ملت" },
  { value: "saderat", label: "بانک صادرات" },
  { value: "tejarat", label: "بانک تجارت" },
  { value: "sepah",   label: "بانک سپه" },
  { value: "refah",   label: "بانک رفاه" },
  { value: "maskan",  label: "بانک مسکن" },
  { value: "parsian", label: "بانک پارسیان" },
  { value: "pasargad",label: "بانک پاسارگاد" },
];

const BRANCHES_MAP = {
  melli:    [{ value: "", label: "انتخاب شعبه" }, { value: "mk1", label: "شعبه مرکزی" }, { value: "mk2", label: "شعبه آزادی" }, { value: "mk3", label: "شعبه انقلاب" }],
  mellat:   [{ value: "", label: "انتخاب شعبه" }, { value: "mt1", label: "شعبه مرکزی" }, { value: "mt2", label: "شعبه ولیعصر" }],
  saderat:  [{ value: "", label: "انتخاب شعبه" }, { value: "sd1", label: "شعبه مرکزی" }, { value: "sd2", label: "شعبه فردوسی" }],
  tejarat:  [{ value: "", label: "انتخاب شعبه" }, { value: "tj1", label: "شعبه مرکزی" }],
  sepah:    [{ value: "", label: "انتخاب شعبه" }, { value: "sp1", label: "شعبه مرکزی" }],
  refah:    [{ value: "", label: "انتخاب شعبه" }, { value: "rf1", label: "شعبه مرکزی" }],
  maskan:   [{ value: "", label: "انتخاب شعبه" }, { value: "ms1", label: "شعبه مرکزی" }],
  parsian:  [{ value: "", label: "انتخاب شعبه" }, { value: "ps1", label: "شعبه مرکزی" }],
  pasargad: [{ value: "", label: "انتخاب شعبه" }, { value: "pg1", label: "شعبه مرکزی" }],
};

const MOEIN_ACCOUNTS = [
  { value: "",    label: "انتخاب حساب معین" },
  { value: "m01", label: "۱۱۱۰ - صندوق" },
  { value: "m02", label: "۱۱۲۰ - بانک ملی" },
  { value: "m03", label: "۱۱۳۰ - بانک ملت" },
  { value: "m04", label: "۱۱۴۰ - بانک صادرات" },
  { value: "m05", label: "۱۱۵۰ - سایر بانک‌ها" },
];

const CURRENCIES = [
  { value: "rial",   label: "ریال" },
  { value: "toman",  label: "تومان" },
  { value: "dollar", label: "دلار آمریکا" },
  { value: "euro",   label: "یورو" },
  { value: "pound",  label: "پوند انگلیس" },
];

const STATUS_OPTIONS = [
  { value: "active",   label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

const INITIAL_FORM = {
  bank:          "",
  branch:        "",
  accountNumber: "",
  moeinAccount:  "",
  sheba:         "",
  bankCode:      "",
  branchCode:    "",
  currency:      "rial",
  accountHolder: "",
  description:   "",
  status:        "active",
  displayOrder:  "",
};

// ─── کامپوننت‌های کمکی ────────────────────────────────────────────────────
function Field({ label, required, children, fullWidth }) {
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "col-span-2")}>
      <Label className="text-sm font-medium text-foreground text-right">
        {label}
        {required && <span className="text-blue-600 mr-1">*</span>}
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

// ─── صفحه اصلی ────────────────────────────────────────────────────────────
export default function BankForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saved, setSaved] = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        if (field === "bank") next.branch = "";
        return next;
      });
      setSaved(false);
    };
  }

  function handleSave() {
    setSaved(true);
  }

  const branchOptions = BRANCHES_MAP[form.bank] ?? [{ value: "", label: "انتخاب شعبه" }];
  const canSave = form.bank && form.branch && form.accountNumber && form.status;

  return (
    <PageShell>
      {/* ── Breadcrumb ── */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">صدور بانک</span>
        <span>/</span>
        <span>تعریف بانک</span>
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
            disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            ذخیره
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-foreground">فرم تعریف بانک</h1>
          <p className="text-xs text-muted-foreground mt-0.5">اطلاعات مربوط به بانک را وارد نمایید.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 px-6 pb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5" dir="rtl">

            {/* ردیف ۱: بانک + شعبه */}
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
              <Input
                value={form.accountNumber}
                onChange={set("accountNumber")}
                placeholder="شماره حساب را وارد کنید"
                className="h-10 text-sm"
                dir="ltr"
              />
            </Field>

            <Field label="شماره حساب معین متناظر">
              <StyledSelect
                value={form.moeinAccount}
                onChange={set("moeinAccount")}
                options={MOEIN_ACCOUNTS}
              />
            </Field>

            {/* ردیف ۳: شبا + کد بانک */}
            <Field label="شبا">
              <div className="relative">
                <Input
                  value={form.sheba}
                  onChange={set("sheba")}
                  placeholder="شماره شبا را وارد کنید"
                  className="h-10 text-sm pl-9"
                  dir="ltr"
                />
                <Info className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </Field>

            <Field label="کد بانک">
              <Input
                value={form.bankCode}
                onChange={set("bankCode")}
                placeholder="کد بانک را وارد کنید"
                className="h-10 text-sm"
                dir="ltr"
              />
            </Field>

            {/* ردیف ۴: کد شعبه + ارز */}
            <Field label="کد شعبه">
              <Input
                value={form.branchCode}
                onChange={set("branchCode")}
                placeholder="کد شعبه را وارد کنید"
                className="h-10 text-sm"
                dir="ltr"
              />
            </Field>

            <Field label="ارز">
              <StyledSelect
                value={form.currency}
                onChange={set("currency")}
                options={CURRENCIES}
              />
            </Field>

            {/* ردیف ۵: نام صاحب حساب — full width */}
            <Field label="نام صاحب حساب" fullWidth>
              <div className="relative">
                <Input
                  value={form.accountHolder}
                  onChange={set("accountHolder")}
                  placeholder="نام صاحب حساب را وارد کنید"
                  className="h-10 text-sm pl-9"
                />
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </Field>

            {/* ردیف ۶: توضیحات — full width */}
            <Field label="توضیحات" fullWidth>
              <Input
                value={form.description}
                onChange={set("description")}
                placeholder="توضیحات را وارد کنید"
                className="h-10 text-sm"
              />
            </Field>

            {/* ردیف ۷: وضعیت + ترتیب نمایش */}
            <Field label="وضعیت" required>
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
                  placeholder="ترتیب نمایش را وارد کنید"
                  className="h-10 text-sm pl-9"
                  dir="ltr"
                />
                <AlignJustify className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </Field>

          </div>
        </CardContent>
      </Card>

      {/* ── راهنما ── */}
      <div
        className="mt-4 flex items-start gap-2.5 rounded-xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 px-4 py-3"
        dir="rtl"
      >
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">راهنما</span>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
            بانک فعال در عملیات دریافت و پرداخت قابل انتخاب خواهد بود.
          </p>
        </div>
      </div>

      {/* ── پیام موفقیت ── */}
      {saved && (
        <div
          className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          dir="rtl"
        >
          ✓ اطلاعات بانک با موفقیت ذخیره شد.
        </div>
      )}
    </PageShell>
  );
}
