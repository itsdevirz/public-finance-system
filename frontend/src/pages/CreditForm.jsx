import { useState, useEffect, useRef } from "react";
import { Save, ArrowRight, Info, CheckCircle2, Eye, EyeOff, Pencil, Trash2, Plus, X } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import api from "@/api";

// ─── ثوابت ────────────────────────────────────────────────────────────────
const EXPENSE_KIND_OPTIONS = [
  { value: "",         label: "انتخاب نوع هزینه" },
  { value: "general",  label: "عمومی" },
  { value: "specific", label: "اختصاصی" },
  { value: "misc",     label: "سایر" },
];
const EXPENSE_CHAPTER_OPTIONS = [
  { value: "",       label: "انتخاب فصل" },
  { value: "110100", label: "110100 — ساختمان و مستحدثات" },
  { value: "110200", label: "110200 — ماشین آلات و تجهیزات" },
  { value: "110300", label: "110300 — سایر دارایی‌های ثابت" },
  { value: "120100", label: "120100 — تغییر در موجودی انبار" },
  { value: "130100", label: "130100 — اقلام گران‌بها" },
  { value: "210000", label: "210000 — زمین" },
  { value: "220000", label: "220000 — سایر دارایی‌های تولید نشده" },
];
const CREDIT_TYPE_OPTIONS = [
  { value: "",        label: "انتخاب نوع اعتبار" },
  { value: "expense", label: "هزینه" },
  { value: "capital", label: "تملک دارایی‌های سرمایه‌ای" },
  { value: "other",   label: "سایر منابع" },
];
const EXPENSE_KIND_LABEL  = { general: "عمومی", specific: "اختصاصی", misc: "سایر" };
const EXPENSE_CHAPTER_LABEL = Object.fromEntries(
  EXPENSE_CHAPTER_OPTIONS.filter(o => o.value).map(o => [o.value, o.label])
);
const CREDIT_TYPE_LABEL = { expense: "هزینه", capital: "تملک دارایی‌های سرمایه‌ای", other: "سایر منابع" };

const SUB_CHAPTER_MAP = {
  "211000": [{ value: "211000", label: "211000 — حقوق و دستمزد" }],
  "212000": [{ value: "212000", label: "212000 — حق بیمه اجتماعی کارفرما" }],
  "220100": [{ value: "220100", label: "220100 — ماموریت داخلی و خارجی" }],
  "220200": [{ value: "220200", label: "220200 — حق‌الزحمه انجام خدمات قراردادی" }],
  "220300": [{ value: "220300", label: "220300 — حمل و نقل و ارتباطات" }],
  "220400": [{ value: "220400", label: "220400 — نگهداری و تعمیر دارایی‌های ثابت" }],
  "220500": [{ value: "220500", label: "220500 — نگهداری و تعمیر وسایل اداری" }],
  "220600": [{ value: "220600", label: "220600 — چاپ و خرید نشریات و مطبوعات" }],
  "220700": [{ value: "220700", label: "220700 — تصویربرداری و تبلیغات" }],
  "220800": [{ value: "220800", label: "220800 — تشریفات" }],
  "220900": [{ value: "220900", label: "220900 — هزینه‌های قضایی، ثبتی و حقوقی" }],
  "221100": [{ value: "221100", label: "221100 — هزینه‌های بانکی - مالی" }],
  "221200": [{ value: "221200", label: "221200 — آب و برق و سوخت" }],
  "221300": [{ value: "221300", label: "221300 — مواد و لوازم مصرف شدنی" }],
  "221400": [{ value: "221400", label: "221400 — هزینه‌های مطالعاتی و تحقیقاتی" }],
  "221500": [{ value: "221500", label: "221500 — اجاره ساختمان و ماشین‌آلات" }],
  "221600": [{ value: "221600", label: "221600 — سایر استفاده از کالاها و خدمات" }],
  "231000": [{ value: "231000", label: "231000 — دارایی‌های ثابت مشهود" }],
  "232000": [{ value: "232000", label: "232000 — دارایی‌های ثابت نامشهود" }],
  "241000": [{ value: "241000", label: "241000 — پرداخت سود به اشخاص غیرمقیم" }],
  "242000": [{ value: "242000", label: "242000 — پرداخت به اشخاص مقیم به جز دولت عمومی" }],
  "243000": [{ value: "243000", label: "243000 — پرداختی به واحدهای دولت عمومی" }],
  "251000": [{ value: "251000", label: "251000 — یارانه به شرکت‌های دولتی" }],
  "252000": [{ value: "252000", label: "252000 — یارانه به بنگاه‌های خصوصی" }],
  "253000": [{ value: "253000", label: "253000 — یارانه به سایر بخش‌ها" }],
  "261000": [{ value: "261000", label: "261000 — کمک بلاعوض به دولت‌های خارجی" }],
  "262000": [{ value: "262000", label: "262000 — کمک بلاعوض به سازمان‌های بین‌المللی" }],
  "263000": [{ value: "263000", label: "263000 — کمک بلاعوض به سایر واحدهای دولت عمومی" }],
  "271000": [{ value: "271000", label: "271000 — مزایای تامین اجتماعی" }],
  "272000": [{ value: "272000", label: "272000 — مزایای کمک اجتماعی" }],
  "273000": [{ value: "273000", label: "273000 — مزایای اجتماعی مرتبط با اشتغال" }],
  "281000": [{ value: "281000", label: "281000 — هزینه استفاده از دارایی به جز سود" }],
  "282000": [{ value: "282000", label: "282000 — انتقالات طبقه‌بندی نشده در جای دیگر" }],
  "283000": [{ value: "283000", label: "283000 — حق بیمه و خسارت‌های مربوط به بیمه عمر" }],
};

const ALL_SUB_CHAPTERS = [
  { value: "", label: "انتخاب ریزفصل", disabled: false },
  { value: "_h1", label: "── جبران خدمات کارکنان ──", disabled: true },
  { value: "211000", label: "211000 — حقوق و دستمزد" },
  { value: "212000", label: "212000 — حق بیمه اجتماعی کارفرما" },
  { value: "_h2", label: "── استفاده از کالاها و خدمات ──", disabled: true },
  { value: "220100", label: "220100 — ماموریت داخلی و خارجی" },
  { value: "220200", label: "220200 — حق‌الزحمه انجام خدمات قراردادی" },
  { value: "220300", label: "220300 — حمل و نقل و ارتباطات" },
  { value: "220400", label: "220400 — نگهداری و تعمیر دارایی‌های ثابت" },
  { value: "220500", label: "220500 — نگهداری و تعمیر وسایل اداری" },
  { value: "220600", label: "220600 — چاپ و خرید نشریات و مطبوعات" },
  { value: "220700", label: "220700 — تصویربرداری و تبلیغات" },
  { value: "220800", label: "220800 — تشریفات" },
  { value: "220900", label: "220900 — هزینه‌های قضایی، ثبتی و حقوقی" },
  { value: "221100", label: "221100 — هزینه‌های بانکی - مالی" },
  { value: "221200", label: "221200 — آب و برق و سوخت" },
  { value: "221300", label: "221300 — مواد و لوازم مصرف شدنی" },
  { value: "221400", label: "221400 — هزینه‌های مطالعاتی و تحقیقاتی" },
  { value: "221500", label: "221500 — اجاره ساختمان و ماشین‌آلات" },
  { value: "221600", label: "221600 — سایر استفاده از کالاها و خدمات" },
  { value: "_h3", label: "── مصرف سرمایه‌های ثابت ──", disabled: true },
  { value: "231000", label: "231000 — دارایی‌های ثابت مشهود" },
  { value: "232000", label: "232000 — دارایی‌های ثابت نامشهود" },
  { value: "_h4", label: "── سود ──", disabled: true },
  { value: "241000", label: "241000 — پرداخت سود به اشخاص غیرمقیم" },
  { value: "242000", label: "242000 — پرداخت به اشخاص مقیم به جز دولت عمومی" },
  { value: "243000", label: "243000 — پرداختی به واحدهای دولت عمومی" },
  { value: "_h5", label: "── یارانه ──", disabled: true },
  { value: "251000", label: "251000 — یارانه به شرکت‌های دولتی" },
  { value: "252000", label: "252000 — یارانه به بنگاه‌های خصوصی" },
  { value: "253000", label: "253000 — یارانه به سایر بخش‌ها" },
  { value: "_h6", label: "── کمک‌های بلاعوض ──", disabled: true },
  { value: "261000", label: "261000 — کمک بلاعوض به دولت‌های خارجی" },
  { value: "262000", label: "262000 — کمک بلاعوض به سازمان‌های بین‌المللی" },
  { value: "263000", label: "263000 — کمک بلاعوض به سایر واحدهای دولت عمومی" },
  { value: "_h7", label: "── مزایای اجتماعی ──", disabled: true },
  { value: "271000", label: "271000 — مزایای تامین اجتماعی" },
  { value: "272000", label: "272000 — مزایای کمک اجتماعی" },
  { value: "273000", label: "273000 — مزایای اجتماعی مرتبط با اشتغال" },
  { value: "_h8", label: "── سایر هزینه‌ها ──", disabled: true },
  { value: "281000", label: "281000 — هزینه استفاده از دارایی به جز سود" },
  { value: "282000", label: "282000 — انتقالات طبقه‌بندی نشده در جای دیگر" },
  { value: "283000", label: "283000 — حق بیمه و خسارت‌های مربوط به بیمه عمر" },
];

const SUB_CHAPTER_LABEL = Object.fromEntries(
  ALL_SUB_CHAPTERS.filter(o => o.value && !o.value.startsWith("_")).map(o => [o.value, o.label])
);

const INITIAL_EXPENSE = { expenseKind: "", programNumber: "", expenseChapter: "", expenseSubChapter: "" };
const INITIAL_CAPITAL = { projectNumber: "", capitalChapter: "" };
const INITIAL_FORM = {
  creditKind: "approved", creditType: "", notifierRow: "",
  expense: { ...INITIAL_EXPENSE },
  capital: { ...INITIAL_CAPITAL },
  otherHasExpense: false, otherHasCapital: false,
};

// ─── کامپوننت‌های کمکی ───────────────────────────────────────────────────────
function Field({ label, required, children, fullWidth, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "col-span-2", className)}>
      <Label className="text-sm font-medium text-foreground text-right">
        {label}{required && <span className="text-blue-600 mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function StyledSelect({ value, onChange, options, disabled }) {
  return (
    <div className="relative">
      <select
        value={value} onChange={onChange} disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed text-right pr-3 pl-8"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}
            style={o.disabled ? { fontWeight: "bold", backgroundColor: "#e5e7eb", color: "#374151" } : {}}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">‹</span>
    </div>
  );
}

function ExpenseFields({ data, onChange }) {
  function set(field) { return (e) => onChange({ ...data, [field]: e.target.value }); }
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4" dir="rtl">
      <Field label="نوع هزینه" required>
        <StyledSelect value={data.expenseKind} onChange={set("expenseKind")} options={EXPENSE_KIND_OPTIONS} />
      </Field>
      <div />
      <Field label="شماره برنامه" required>
        <Input value={data.programNumber} onChange={set("programNumber")}
          placeholder="شماره برنامه" className="h-10 text-sm" dir="ltr" />
      </Field>
      <Field label="فصول" required>
        <StyledSelect value={data.expenseChapter} onChange={set("expenseChapter")} options={EXPENSE_CHAPTER_OPTIONS} />
      </Field>
      <Field label="ریزفصل هزینه" required fullWidth>
        <StyledSelect
          value={data.expenseSubChapter}
          onChange={set("expenseSubChapter")}
          options={
            data.expenseChapter && SUB_CHAPTER_MAP[data.expenseChapter]?.length
              ? [{ value: "", label: "انتخاب ریزفصل" }, ...SUB_CHAPTER_MAP[data.expenseChapter]]
              : ALL_SUB_CHAPTERS
          }
        />
      </Field>
    </div>
  );
}

function CapitalFields({ data, onChange }) {
  function set(field) { return (e) => onChange({ ...data, [field]: e.target.value }); }
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4" dir="rtl">
      <Field label="شماره طرح" required>
        <Input value={data.projectNumber} onChange={set("projectNumber")}
          placeholder="شماره طرح" className="h-10 text-sm" dir="ltr" />
      </Field>
      <Field label="فصول" required>
        <StyledSelect value={data.capitalChapter} onChange={set("capitalChapter")} options={EXPENSE_CHAPTER_OPTIONS} />
      </Field>
    </div>
  );
}

// ─── نمایش خلاصه یک اعتبار در کارت لیست ─────────────────────────────────────
function creditSummary(item) {
  const kind = item.creditKind === "notified" ? "ابلاغی" : "مصوب";
  const type = CREDIT_TYPE_LABEL[item.creditType] ?? item.creditType;
  return `${kind} — ${type}`;
}

// ─── کارت هر اعتبار در لیست ───────────────────────────────────────────────
function CreditCard({ item, onEdit, onDelete, deleting }) {
  const ct = item.creditType;
  const isExpense = ct === "expense" || (ct === "other" && item.otherHasExpense);
  const isCapital = ct === "capital" || (ct === "other" && item.otherHasCapital);
  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm text-foreground">{creditSummary(item)}</span>
          {item.creditKind === "notified" && item.notifierRow && (
            <span className="text-xs text-amber-700">ردیف ابلاغ‌دهنده: <span className="font-mono">{item.notifierRow}</span></span>
          )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" variant="outline" onClick={() => onEdit(item)} className="h-8 px-2.5 gap-1">
            <Pencil className="h-3.5 w-3.5" />ویرایش
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(item._id)}
            disabled={deleting === item._id}
            className="h-8 px-2.5 gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/40">
            <Trash2 className="h-3.5 w-3.5" />حذف
          </Button>
        </div>
      </div>
      {isExpense && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 px-3 py-2 text-xs space-y-0.5">
          <span className="font-bold text-blue-700">هزینه:</span>
          {item.expense?.expenseKind && <div>نوع: {EXPENSE_KIND_LABEL[item.expense.expenseKind]}</div>}
          {item.expense?.programNumber && <div>شماره برنامه: <span className="font-mono">{item.expense.programNumber}</span></div>}
          {item.expense?.expenseChapter && <div>فصل: {EXPENSE_CHAPTER_LABEL[item.expense.expenseChapter]}</div>}
          {item.expense?.expenseSubChapter && <div>ریزفصل: {SUB_CHAPTER_LABEL[item.expense.expenseSubChapter]}</div>}
        </div>
      )}
      {isCapital && (
        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 px-3 py-2 text-xs space-y-0.5">
          <span className="font-bold text-violet-700">تملک دارایی:</span>
          {item.capital?.projectNumber && <div>شماره طرح: <span className="font-mono">{item.capital.projectNumber}</span></div>}
          {item.capital?.capitalChapter && <div>فصل: <span className="font-mono">{item.capital.capitalChapter}</span></div>}
        </div>
      )}
      {item.createdAt && (
        <span className="text-[11px] text-muted-foreground">
          ثبت‌شده: {new Date(item.createdAt).toLocaleDateString("fa-IR")}
          {item.updatedAt && item.updatedAt !== item.createdAt &&
            ` — آخرین ویرایش: ${new Date(item.updatedAt).toLocaleDateString("fa-IR")}`}
        </span>
      )}
    </div>
  );
}

// ─── فرم افزودن / ویرایش (Modal-like inline panel) ─────────────────────────
function CreditFormPanel({ editItem, onCancel, onSaved }) {
  const [form, setForm] = useState(() =>
    editItem
      ? {
          creditKind: editItem.creditKind ?? "approved",
          creditType: editItem.creditType ?? "",
          notifierRow: editItem.notifierRow ?? "",
          expense: { ...INITIAL_EXPENSE, ...(editItem.expense ?? {}) },
          capital: { ...INITIAL_CAPITAL, ...(editItem.capital ?? {}) },
          otherHasExpense: editItem.otherHasExpense ?? false,
          otherHasCapital: editItem.otherHasCapital ?? false,
        }
      : { ...INITIAL_FORM, expense: { ...INITIAL_EXPENSE }, capital: { ...INITIAL_CAPITAL } }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        if (field === "creditKind" && val === "approved") next.notifierRow = "";
        return next;
      });
      setError(null);
    };
  }

  async function handleSave() {
    if (!form.creditKind || !form.creditType) {
      setError("لطفاً نوع اعتبار و نوع را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editItem) {
        await api.put(`/api/credits/definitions/${editItem._id}`, form);
      } else {
        await api.post("/api/credits/definitions", form);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message ?? "خطا در ذخیره‌سازی. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }

  const isNotified = form.creditKind === "notified";
  const canSave = form.creditKind && form.creditType;

  return (
    <Card className="shadow-md border-blue-200 dark:border-blue-800">
      <CardContent className="pt-5 px-6 pb-6">
        {/* هدر پنل */}
        <div className="flex items-center justify-between mb-5" dir="rtl">
          <h2 className="text-base font-bold text-foreground">
            {editItem ? "ویرایش اعتبار" : "افزودن اعتبار جدید"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6" dir="rtl">
          {/* مصوب / ابلاغی */}
          <div className="col-span-2 flex flex-col gap-2">
            <Label className="text-sm font-medium">اعتبار <span className="text-blue-600 mr-1">*</span></Label>
            <div className="flex items-center gap-6 mt-0.5">
              {[{ value: "approved", label: "مصوب" }, { value: "notified", label: "ابلاغی" }].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input type="radio" name="creditKind" value={value}
                    checked={form.creditKind === value} onChange={set("creditKind")}
                    className="accent-blue-600 h-4 w-4" />
                  <span className={cn("font-medium", form.creditKind === value && "text-blue-600")}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* نوع اعتبار */}
          <div className="col-span-2">
            <Field label="نوع اعتبار" required>
              <div className="max-w-xs">
                <StyledSelect value={form.creditType} onChange={set("creditType")} options={CREDIT_TYPE_OPTIONS} />
              </div>
            </Field>
          </div>

          {/* بخش هزینه */}
          {form.creditType === "expense" && (
            <div className="col-span-2 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-5">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-4">اطلاعات هزینه</p>
              <ExpenseFields
                data={form.expense}
                onChange={(data) => setForm((f) => ({ ...f, expense: data }))}
              />
            </div>
          )}

          {/* بخش تملک */}
          {form.creditType === "capital" && (
            <div className="col-span-2 rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 p-5">
              <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-4">اطلاعات تملک دارایی‌های سرمایه‌ای</p>
              <CapitalFields
                data={form.capital}
                onChange={(data) => setForm((f) => ({ ...f, capital: data }))}
              />
            </div>
          )}

          {/* بخش سایر منابع */}
          {form.creditType === "other" && (
            <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">سایر منابع</p>
              <div className="flex flex-wrap gap-6">
                {[
                  { field: "otherHasExpense", label: "هزینه", color: "blue" },
                  { field: "otherHasCapital", label: "تملک دارایی‌های سرمایه‌ای", color: "violet" },
                ].map(({ field, label, color }) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={form[field]} onChange={set(field)}
                      className={cn("h-4 w-4 rounded", color === "blue" ? "accent-blue-600" : "accent-violet-600")} />
                    <span className={cn("font-medium", form[field] && (color === "blue" ? "text-blue-600" : "text-violet-600"))}>{label}</span>
                  </label>
                ))}
              </div>
              {form.otherHasExpense && (
                <div className="rounded-lg border border-blue-200 bg-white dark:bg-background p-4">
                  <p className="text-xs font-bold text-blue-600 mb-3">فیلدهای هزینه</p>
                  <ExpenseFields
                    data={form.expense}
                    onChange={(data) => setForm((f) => ({ ...f, expense: data }))}
                  />
                </div>
              )}
              {form.otherHasCapital && (
                <div className="rounded-lg border border-violet-200 bg-white dark:bg-background p-4">
                  <p className="text-xs font-bold text-violet-600 mb-3">فیلدهای تملک دارایی‌های سرمایه‌ای</p>
                  <CapitalFields
                    data={form.capital}
                    onChange={(data) => setForm((f) => ({ ...f, capital: data }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* ردیف ابلاغ‌دهنده */}
          {isNotified && (
            <div className="col-span-2 rounded-xl border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 p-5">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-4">اطلاعات ابلاغ‌دهنده</p>
              <Field label="ردیف دستگاه ابلاغ‌دهنده" required>
                <Input value={form.notifierRow} onChange={set("notifierRow")}
                  placeholder="ردیف دستگاه ابلاغ‌دهنده را وارد کنید"
                  className="h-10 text-sm max-w-sm" dir="ltr" />
              </Field>
            </div>
          )}
        </div>

        {/* پیام خطا */}
        {error && (
          <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive" dir="rtl">
            {error}
          </div>
        )}

        {/* دکمه‌های عمل */}
        <div className="mt-5 flex items-center gap-2" dir="rtl">
          <Button onClick={handleSave} disabled={!canSave || saving}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />
            {saving ? "در حال ذخیره..." : (editItem ? "ذخیره تغییرات" : "ثبت اعتبار")}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={saving} className="gap-1.5">
            <X className="h-4 w-4" />انصراف
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────
export default function CreditForm() {
  const [credits, setCredits]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [editItem, setEditItem]       = useState(null);   // null = افزودن، object = ویرایش
  const [deleting, setDeleting]       = useState(null);   // id در حال حذف
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id منتظر تایید حذف
  const [successMsg, setSuccessMsg]   = useState(null);

  // بارگذاری لیست از بکند
  async function fetchCredits() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get("/api/credits/definitions");
      setCredits(res.data.data ?? []);
    } catch (err) {
      setFetchError("خطا در بارگذاری اطلاعات. اتصال به سرور را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCredits(); }, []);

  function handleEdit(item) {
    setEditItem(item);
    setShowForm(true);
    setSuccessMsg(null);
  }

  function handleAddNew() {
    setEditItem(null);
    setShowForm(true);
    setSuccessMsg(null);
  }

  function handleCancel() {
    setShowForm(false);
    setEditItem(null);
  }

  async function handleSaved() {
    setShowForm(false);
    setEditItem(null);
    setSuccessMsg(editItem ? "اعتبار با موفقیت ویرایش شد." : "اعتبار جدید با موفقیت ثبت شد.");
    await fetchCredits();
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleDelete(id) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    setDeleting(id);
    setDeleteConfirm(null);
    try {
      await api.delete(`/api/credits/definitions/${id}`);
      setSuccessMsg("اعتبار با موفقیت حذف شد.");
      setCredits((prev) => prev.filter((c) => c._id !== id));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در حذف. دوباره تلاش کنید.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">اطلاعات پایه</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">تعاریف</span>
        <span>/</span>
        <span>تعریف اعتبار</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="text-right">
          <h1 className="text-xl font-bold text-foreground">تعریف اعتبار</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            اعتبارات مصوب و ابلاغی را تعریف، مشاهده و مدیریت کنید.
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleAddNew}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" />افزودن اعتبار جدید
          </Button>
        )}
      </div>

      {/* پیام موفقیت */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" dir="rtl">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* پیام خطا */}
      {fetchError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" dir="rtl">
          {fetchError}
        </div>
      )}

      {/* فرم افزودن / ویرایش */}
      {showForm && (
        <div className="mb-6">
          <CreditFormPanel
            editItem={editItem}
            onCancel={handleCancel}
            onSaved={handleSaved}
          />
        </div>
      )}

      {/* لیست اعتبارها */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm" dir="rtl">
          در حال بارگذاری...
        </div>
      ) : credits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Info className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground" dir="rtl">
              هنوز هیچ اعتباری تعریف نشده است. با کلیک روی «افزودن اعتبار جدید» شروع کنید.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* نوار تایید حذف */}
          {deleteConfirm && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" dir="rtl">
              <span className="text-destructive font-medium flex-1">آیا از حذف این اعتبار مطمئن هستید؟ این عملیات قابل بازگشت نیست.</span>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(deleteConfirm)} className="gap-1">
                <Trash2 className="h-3.5 w-3.5" />بله، حذف کن
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)} className="gap-1">
                <X className="h-3.5 w-3.5" />انصراف
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground" dir="rtl">
            {credits.length} اعتبار تعریف‌شده
          </p>

          {credits.map((item) => (
            <CreditCard
              key={item._id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {/* راهنما */}
      <div className="mt-6 flex items-start gap-2.5 rounded-xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 px-4 py-3" dir="rtl">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600 dark:text-blue-300">
          اعتبارات تعریف‌شده در پایگاه داده ذخیره می‌شوند. می‌توانید هر اعتبار را ویرایش یا حذف کنید.
        </p>
      </div>
    </PageShell>
  );
}
