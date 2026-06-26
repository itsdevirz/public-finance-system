import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowRight, CalendarDays, Info } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── داده‌های نمونه ────────────────────────────────────────────────────────
const BANKS = [
  { value: "", label: "انتخاب نمایید" },
  { value: "melli", label: "بانک ملی ایران" },
  { value: "mellat", label: "بانک ملت" },
  { value: "saderat", label: "بانک صادرات" },
  { value: "tejarat", label: "بانک تجارت" },
  { value: "sepah", label: "بانک سپه" },
  { value: "refah", label: "بانک رفاه" },
  { value: "maskan", label: "بانک مسکن" },
];

const BRANCHES = {
  melli:   [{ value: "", label: "انتخاب نمایید" }, { value: "b1", label: "شعبه مرکزی" }, { value: "b2", label: "شعبه آزادی" }],
  mellat:  [{ value: "", label: "انتخاب نمایید" }, { value: "b1", label: "شعبه مرکزی" }, { value: "b3", label: "شعبه ولیعصر" }],
  saderat: [{ value: "", label: "انتخاب نمایید" }, { value: "b1", label: "شعبه مرکزی" }, { value: "b4", label: "شعبه انقلاب" }],
};

const CHECKBOOKS = {
  melli_b1: [{ value: "", label: "انتخاب نمایید" }, { value: "cb001", label: "دسته‌چک ۱۰۰۱-۱۱۰۰" }, { value: "cb002", label: "دسته‌چک ۲۰۰۱-۲۱۰۰" }],
  melli_b2: [{ value: "", label: "انتخاب نمایید" }, { value: "cb003", label: "دسته‌چک ۳۰۰۱-۳۱۰۰" }],
};

const STATUS_OPTIONS = [
  { value: "new",      label: "جدید" },
  { value: "issued",   label: "صادر شده" },
  { value: "cashed",   label: "وصول شده" },
  { value: "voided",   label: "باطل شده" },
  { value: "returned", label: "برگشتی" },
];

const INITIAL_FORM = {
  checkNumber: "",
  bankBranch:  "",
  bank:        "",
  checkbook:   "",
  payee:       "",
  issueDate:   "",
  amount:      "",
  status:      "new",
  dueDate:     "",
  description: "",
  reference:   "",
  isGuarantee: false,
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
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        ‹
      </span>
    </div>
  );
}

function DateInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? "تاریخ را انتخاب کنید"}
        className="h-10 text-sm pl-10 text-right"
        dir="rtl"
      />
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────
export default function CheckIssuance() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saved, setSaved] = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // ریست شعبه و دسته‌چک وقتی بانک عوض شد
        if (field === "bank") {
          next.bankBranch = "";
          next.checkbook  = "";
        }
        // ریست دسته‌چک وقتی شعبه عوض شد
        if (field === "bankBranch") {
          next.checkbook = "";
        }
        return next;
      });
      setSaved(false);
    };
  }

  function handleSave() {
    setSaved(true);
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setSaved(false);
  }

  const branchOptions   = BRANCHES[form.bank]   ?? [{ value: "", label: "انتخاب نمایید" }];
  const checkbookKey    = `${form.bank}_${form.bankBranch}`;
  const checkbookOptions = CHECKBOOKS[checkbookKey] ?? [{ value: "", label: "انتخاب نمایید" }];

  const canSave = form.checkNumber && form.bank && form.bankBranch && form.checkbook &&
                  form.payee && form.issueDate && form.amount && form.dueDate;

  return (
    <PageShell>
      {/* ── هدر breadcrumb ── */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">صدر چک</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">تعریف چک</span>
        <span>/</span>
        <span>فرم تعریف چک</span>
      </div>

      {/* ── دکمه‌های بالا ── */}
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
          <h1 className="text-xl font-bold text-foreground">فرم تعریف چک</h1>
          <p className="text-xs text-muted-foreground mt-0.5">اطلاعات مربوط به چک را وارد نمایید.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 px-6 pb-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5" dir="rtl">

            {/* ردیف ۱: شماره چک + شعبه بانک */}
            <Field label="شماره چک" required>
              <Input
                value={form.checkNumber}
                onChange={set("checkNumber")}
                placeholder="شماره چک را وارد کنید"
                className="h-10 text-sm"
                dir="ltr"
              />
            </Field>

            <Field label="شعبه بانک" required>
              <StyledSelect
                value={form.bankBranch}
                onChange={set("bankBranch")}
                options={branchOptions}
                disabled={!form.bank}
              />
            </Field>

            {/* ردیف ۲: بانک + دسته چک */}
            <Field label="بانک" required>
              <StyledSelect
                value={form.bank}
                onChange={set("bank")}
                options={BANKS}
              />
            </Field>

            <Field label="دسته چک" required>
              <StyledSelect
                value={form.checkbook}
                onChange={set("checkbook")}
                options={checkbookOptions}
                disabled={!form.bankBranch}
              />
            </Field>

            {/* ردیف ۳: ذینفع + تاریخ صدور */}
            <Field label="ذینفع" required>
              <Input
                value={form.payee}
                onChange={set("payee")}
                placeholder="نام ذینفع را وارد کنید"
                className="h-10 text-sm"
              />
            </Field>

            <Field label="تاریخ صدور" required>
              <DateInput value={form.issueDate} onChange={set("issueDate")} />
            </Field>

            {/* ردیف ۴: مبلغ + وضعیت */}
            <Field label="مبلغ" required>
              <div className="relative">
                <Input
                  value={form.amount}
                  onChange={set("amount")}
                  placeholder="مبلغ را وارد کنید"
                  className="h-10 text-sm pl-14"
                  dir="ltr"
                />
                <span className="pointer-events-none absolute left-0 top-0 h-full flex items-center px-3 text-sm font-medium text-muted-foreground bg-muted border border-input rounded-r-none rounded-l-lg border-l-0">
                  ریال
                </span>
              </div>
            </Field>

            <Field label="وضعیت" required>
              <StyledSelect
                value={form.status}
                onChange={set("status")}
                options={STATUS_OPTIONS}
              />
            </Field>

            {/* ردیف ۵: تاریخ سررسید — تنها در ستون راست */}
            <div className="col-start-1">
              <Field label="تاریخ سررسید" required>
                <DateInput value={form.dueDate} onChange={set("dueDate")} />
              </Field>
            </div>

            {/* ردیف ۶: شرح / توضیحات — full width */}
            <Field label="شرح / توضیحات" fullWidth>
              <Input
                value={form.description}
                onChange={set("description")}
                placeholder="توضیحات را وارد کنید"
                className="h-10 text-sm"
              />
            </Field>

            {/* ردیف ۷: ارجاع — full width */}
            <Field label="ارجاع" fullWidth>
              <Input
                value={form.reference}
                onChange={set("reference")}
                placeholder="شماره ارجاع را وارد کنید (اختیاری)"
                className="h-10 text-sm"
                dir="ltr"
              />
            </Field>

            {/* چک‌باکس چک تضمینی */}
            <div className="col-span-2 flex items-center gap-2" dir="rtl">
              <input
                id="isGuarantee"
                type="checkbox"
                checked={form.isGuarantee}
                onChange={set("isGuarantee")}
                className="h-4 w-4 rounded border-input accent-blue-600 cursor-pointer"
              />
              <label htmlFor="isGuarantee" className="text-sm cursor-pointer select-none">
                چک تضمینی
              </label>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── راهنما ── */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 px-4 py-3" dir="rtl">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <span className="text-sm font-bold text-blue-700 dark:text-blue-400">راهنما</span>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
            اطلاعات چک را با دقت وارد نمایید. موارد دارای علامت <span className="font-bold">*</span> الزامی می‌باشند.
          </p>
        </div>
      </div>

      {saved && (
        <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400" dir="rtl">
          ✓ اطلاعات چک با موفقیت ذخیره شد.
        </div>
      )}
    </PageShell>
  );
}
