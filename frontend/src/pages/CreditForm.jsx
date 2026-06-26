import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowRight, Info, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── ثوابت ────────────────────────────────────────────────────────────────
const EXPENSE_KIND_OPTIONS = [
  { value: "",         label: "انتخاب نوع هزینه" },
  { value: "general",  label: "عمومی" },
  { value: "specific", label: "اختصاصی" },
  { value: "misc",     label: "سایر" },
];

// فصول اعتبارات تملک دارایی‌های سرمایه‌ای (جدول ارائه‌شده)
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
const EXPENSE_KIND_LABEL = { general: "عمومی", specific: "اختصاصی", misc: "سایر" };
const EXPENSE_CHAPTER_LABEL = Object.fromEntries(
  EXPENSE_CHAPTER_OPTIONS.filter(o => o.value).map(o => [o.value, o.label])
);
const CREDIT_TYPE_LABEL  = { expense: "هزینه", capital: "تملک دارایی‌های سرمایه‌ای", other: "سایر منابع" };

// ریزفصل‌ها — وابسته به فصل انتخاب‌شده
// گروه‌بندی: سرفصل‌های بدون کد (header) به عنوان disabled option نمایش داده می‌شن
const SUB_CHAPTER_MAP = {
  // هر فصل می‌تواند ریزفصل داشته باشد؛ برای فصول عمومی هزینه همه آیتم‌ها نمایش داده می‌شن
  "": [], // قبل از انتخاب فصل
  // ── جبران خدمات کارکنان ──
  "211000": [{ value: "211000", label: "211000 — حقوق و دستمزد" }],
  "212000": [{ value: "212000", label: "212000 — حق بیمه اجتماعی کارفرما" }],
  // ── استفاده از کالاها و خدمات ──
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
  // ── مصرف سرمایه‌های ثابت ──
  "231000": [{ value: "231000", label: "231000 — دارایی‌های ثابت مشهود" }],
  "232000": [{ value: "232000", label: "232000 — دارایی‌های ثابت نامشهود" }],
  // ── سود ──
  "241000": [{ value: "241000", label: "241000 — پرداخت سود به اشخاص غیرمقیم" }],
  "242000": [{ value: "242000", label: "242000 — پرداخت به اشخاص مقیم به جز دولت عمومی" }],
  "243000": [{ value: "243000", label: "243000 — پرداختی به واحدهای دولت عمومی" }],
  // ── یارانه ──
  "251000": [{ value: "251000", label: "251000 — یارانه به شرکت‌های دولتی" }],
  "252000": [{ value: "252000", label: "252000 — یارانه به بنگاه‌های خصوصی" }],
  "253000": [{ value: "253000", label: "253000 — یارانه به سایر بخش‌ها" }],
  // ── کمک‌های بلاعوض ──
  "261000": [{ value: "261000", label: "261000 — کمک بلاعوض به دولت‌های خارجی" }],
  "262000": [{ value: "262000", label: "262000 — کمک بلاعوض به سازمان‌های بین‌المللی" }],
  "263000": [{ value: "263000", label: "263000 — کمک بلاعوض به سایر واحدهای دولت عمومی" }],
  // ── مزایای اجتماعی ──
  "271000": [{ value: "271000", label: "271000 — مزایای تامین اجتماعی" }],
  "272000": [{ value: "272000", label: "272000 — مزایای کمک اجتماعی" }],
  "273000": [{ value: "273000", label: "273000 — مزایای اجتماعی مرتبط با اشتغال" }],
  // ── سایر هزینه‌ها ──
  "281000": [{ value: "281000", label: "281000 — هزینه استفاده از دارایی به جز سود" }],
  "282000": [{ value: "282000", label: "282000 — انتقالات طبقه‌بندی نشده در جای دیگر" }],
  "283000": [{ value: "283000", label: "283000 — حق بیمه و خسارت‌های مربوط به بیمه عمر" }],
};

// تمام ریزفصل‌ها (وقتی فصل انتخاب نشده یا نامرتبط)
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

// ─── کامپوننت Field ────────────────────────────────────────────────────────
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

// ─── StyledSelect با پشتیبانی از disabled options (سرفصل‌های گروه) ────────
function StyledSelect({ value, onChange, onFocus, options, disabled }) {
  return (
    <div className="relative">
      <select
        value={value} onChange={onChange} onFocus={onFocus} disabled={disabled}
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

// ─── فیلدهای هزینه ────────────────────────────────────────────────────────
function ExpenseFields({ data, onChange, onAnyFocus }) {
  function set(field) { return (e) => onChange({ ...data, [field]: e.target.value }); }
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4" dir="rtl">
      <Field label="نوع هزینه" required>
        <StyledSelect value={data.expenseKind} onChange={set("expenseKind")}
          onFocus={onAnyFocus} options={EXPENSE_KIND_OPTIONS} />
      </Field>
      <div />
      <Field label="شماره برنامه" required>
        <Input value={data.programNumber} onChange={set("programNumber")} onFocus={onAnyFocus}
          placeholder="شماره برنامه" className="h-10 text-sm" dir="ltr" />
      </Field>
      <Field label="فصول" required>
        <StyledSelect value={data.expenseChapter} onChange={set("expenseChapter")}
          onFocus={onAnyFocus} options={EXPENSE_CHAPTER_OPTIONS} />
      </Field>
      <Field label="ریزفصل هزینه" required fullWidth>
        <StyledSelect
          value={data.expenseSubChapter}
          onChange={set("expenseSubChapter")}
          onFocus={onAnyFocus}
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

// ─── فیلدهای تملک دارایی ──────────────────────────────────────────────────
function CapitalFields({ data, onChange, onAnyFocus }) {
  function set(field) { return (e) => onChange({ ...data, [field]: e.target.value }); }
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4" dir="rtl">
      <Field label="شماره طرح" required>
        <Input value={data.projectNumber} onChange={set("projectNumber")} onFocus={onAnyFocus}
          placeholder="شماره طرح" className="h-10 text-sm" dir="ltr" />
      </Field>
      <Field label="فصول" required>
        <Input value={data.capitalChapter} onChange={set("capitalChapter")} onFocus={onAnyFocus}
          placeholder="فصول" className="h-10 text-sm" dir="ltr" />
      </Field>
    </div>
  );
}

// ─── ردیف خلاصه ───────────────────────────────────────────────────────────
function SRow({ label, value, mono, accent }) {
  if (!value) return null;
  const accentMap = { blue: "text-blue-700", violet: "text-violet-700", orange: "text-orange-700", default: "text-foreground" };
  return (
    <div className="flex items-start gap-3 py-1.5 border-b last:border-0" dir="rtl">
      <span className="text-xs text-muted-foreground w-48 shrink-0 text-right">{label}</span>
      <span className={cn("text-sm font-semibold", accentMap[accent ?? "default"], mono && "font-mono")} dir={mono ? "ltr" : "rtl"}>
        {value}
      </span>
    </div>
  );
}

// ─── کادر پیش‌نمایش زنده ─────────────────────────────────────────────────
function LivePreview({ form, visible }) {
  if (!visible) return null;
  const ct = form.creditType;
  const hasE = form.expense.expenseKind || form.expense.programNumber || form.expense.expenseChapter || form.expense.expenseSubChapter;
  const hasC = form.capital.projectNumber || form.capital.capitalChapter;
  const showE = (ct === "expense") || (ct === "other" && form.otherHasExpense);
  const showC = (ct === "capital") || (ct === "other" && form.otherHasCapital);

  return (
    <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-700 p-4 space-y-1" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-bold text-blue-700 dark:text-blue-400">پیش‌نمایش داده‌های وارد شده</span>
        <span className="text-xs text-blue-500 mr-1">(تا زمان خروجی نمایش داده می‌شود)</span>
      </div>

      <SRow label="نوع اعتبار (مصوب/ابلاغی)" value={form.creditKind === "notified" ? "ابلاغی" : "مصوب"} accent="blue" />
      <SRow label="نوع اعتبار" value={CREDIT_TYPE_LABEL[ct]} accent="blue" />
      {form.creditKind === "notified" && <SRow label="ردیف دستگاه ابلاغ‌دهنده" value={form.notifierRow} mono accent="orange" />}

      {showE && hasE && (
        <>
          <div className="pt-2 pb-0.5 text-xs font-bold text-blue-600">— هزینه</div>
          <SRow label="نوع هزینه" value={EXPENSE_KIND_LABEL[form.expense.expenseKind]} accent="blue" />
          <SRow label="شماره برنامه" value={form.expense.programNumber} mono accent="blue" />
          <SRow label="فصول هزینه" value={form.expense.expenseChapter ? EXPENSE_CHAPTER_LABEL[form.expense.expenseChapter] : ""} mono accent="blue" />
          <SRow label="ریزفصل هزینه" value={form.expense.expenseSubChapter ? SUB_CHAPTER_LABEL[form.expense.expenseSubChapter] : ""} mono accent="blue" />
        </>
      )}

      {showC && hasC && (
        <>
          <div className="pt-2 pb-0.5 text-xs font-bold text-violet-600">— تملک دارایی‌های سرمایه‌ای</div>
          <SRow label="شماره طرح" value={form.capital.projectNumber} mono accent="violet" />
          <SRow label="فصول تملک" value={form.capital.capitalChapter} mono accent="violet" />
        </>
      )}

      {!ct && (
        <p className="text-xs text-muted-foreground py-1">نوع اعتبار را انتخاب کنید...</p>
      )}
    </div>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────
export default function CreditForm() {
  const navigate = useNavigate();
  const [form, setForm]           = useState(INITIAL_FORM);
  const [previewOpen, setPreviewOpen] = useState(false); // کادر پیش‌نمایش
  const [submitted, setSubmitted] = useState(false);
  const [snapshot, setSnapshot]   = useState(null);

  // هر بار که روی یک input/select فوکوس می‌شه، پیش‌نمایش باز می‌شه
  function handleAnyFocus() { setPreviewOpen(true); }

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        if (field === "creditKind" && val === "approved") next.notifierRow = "";
        return next;
      });
      setSubmitted(false);
      setSnapshot(null);
      setPreviewOpen(true); // باز کردن پیش‌نمایش با هر تغییر
    };
  }

  function setExpense(data) {
    setForm((f) => ({ ...f, expense: data }));
    setSubmitted(false); setSnapshot(null); setPreviewOpen(true);
  }

  function setCapital(data) {
    setForm((f) => ({ ...f, capital: data }));
    setSubmitted(false); setSnapshot(null); setPreviewOpen(true);
  }

  function handleSave() {
    setSnapshot({ ...form, expense: { ...form.expense }, capital: { ...form.capital } });
    setSubmitted(true);
    setPreviewOpen(false); // پیش‌نمایش بسته می‌شه بعد از خروجی
    setForm(INITIAL_FORM); // فرم پاک می‌شه برای ورود داده جدید
  }

  const isNotified = form.creditKind === "notified";
  const canSave    = form.creditKind && form.creditType;

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

      {/* هدر + دکمه‌ها */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowRight className="h-4 w-4" />بازگشت
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ذخیره و خروجی
          </Button>
          {/* دکمه toggle پیش‌نمایش */}
          <Button variant="outline" size="sm"
            onClick={() => setPreviewOpen((v) => !v)}
            className={cn("gap-1.5", previewOpen && "border-blue-400 text-blue-600 bg-blue-50")}>
            {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewOpen ? "بستن پیش‌نمایش" : "نمایش پیش‌نمایش"}
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-foreground">فرم تعریف اعتبار</h1>
          <p className="text-xs text-muted-foreground mt-0.5">مشخصات اعتبار مصوب یا ابلاغی را وارد نمایید.</p>
        </div>
      </div>

      {/* layout: فرم + پیش‌نمایش کنار هم */}
      <div className={cn("flex gap-5 items-start", previewOpen ? "flex-row" : "flex-col")}>

        {/* ── ستون فرم ── */}
        <div className={cn("flex-1 min-w-0", previewOpen && "max-w-[60%]")}>
          <Card className="shadow-sm">
            <CardContent className="pt-6 px-6 pb-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6" dir="rtl">

                {/* اعتبار: مصوب / ابلاغی */}
                <div className="col-span-2 flex flex-col gap-2">
                  <Label className="text-sm font-medium">اعتبار <span className="text-blue-600 mr-1">*</span></Label>
                  <div className="flex items-center gap-6 mt-0.5">
                    {[{ value: "approved", label: "مصوب" }, { value: "notified", label: "ابلاغی" }].map(({ value, label }) => {
                      const dis = value === "approved" && isNotified;
                      return (
                        <label key={value} className={cn("flex items-center gap-2 text-sm cursor-pointer select-none", dis && "opacity-40 cursor-not-allowed")}>
                          <input type="radio" name="creditKind" value={value}
                            checked={form.creditKind === value} onChange={set("creditKind")}
                            onFocus={handleAnyFocus} disabled={dis} className="accent-blue-600 h-4 w-4" />
                          <span className={cn("font-medium", form.creditKind === value && "text-blue-600")}>{label}</span>
                        </label>
                      );
                    })}
                    {isNotified && (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
                        در حالت ابلاغی، گزینه مصوب غیرفعال می‌باشد
                      </span>
                    )}
                  </div>
                </div>

                {/* نوع اعتبار */}
                <div className="col-span-2">
                  <Field label="نوع اعتبار" required>
                    <div className="max-w-xs">
                      <StyledSelect value={form.creditType} onChange={set("creditType")}
                        onFocus={handleAnyFocus} options={CREDIT_TYPE_OPTIONS} />
                    </div>
                  </Field>
                </div>

                {/* بخش هزینه */}
                {form.creditType === "expense" && (
                  <div className="col-span-2 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-5">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-4">اطلاعات هزینه</p>
                    <ExpenseFields data={form.expense} onChange={setExpense} onAnyFocus={handleAnyFocus} />
                  </div>
                )}

                {/* بخش تملک */}
                {form.creditType === "capital" && (
                  <div className="col-span-2 rounded-xl border border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 p-5">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-4">اطلاعات تملک دارایی‌های سرمایه‌ای</p>
                    <CapitalFields data={form.capital} onChange={setCapital} onAnyFocus={handleAnyFocus} />
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
                    {!form.otherHasExpense && !form.otherHasCapital && (
                      <p className="text-xs text-muted-foreground">حداقل یکی از بخش‌ها را انتخاب کنید.</p>
                    )}
                    {form.otherHasExpense && (
                      <div className="rounded-lg border border-blue-200 bg-white dark:bg-background p-4">
                        <p className="text-xs font-bold text-blue-600 mb-3">فیلدهای هزینه</p>
                        <ExpenseFields data={form.expense} onChange={setExpense} onAnyFocus={handleAnyFocus} />
                      </div>
                    )}
                    {form.otherHasCapital && (
                      <div className="rounded-lg border border-violet-200 bg-white dark:bg-background p-4">
                        <p className="text-xs font-bold text-violet-600 mb-3">فیلدهای تملک دارایی‌های سرمایه‌ای</p>
                        <CapitalFields data={form.capital} onChange={setCapital} onAnyFocus={handleAnyFocus} />
                      </div>
                    )}
                  </div>
                )}

                {/* ردیف ابلاغ‌دهنده */}
                {isNotified && (
                  <div className="col-span-2 rounded-xl border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 p-5">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-4">اطلاعات ابلاغ‌دهنده</p>
                    <Field label="ردیف دستگاه ابلاغ‌دهنده" required>
                      <Input value={form.notifierRow} onChange={set("notifierRow")} onFocus={handleAnyFocus}
                        placeholder="ردیف دستگاه ابلاغ‌دهنده را وارد کنید"
                        className="h-10 text-sm max-w-sm" dir="ltr" />
                    </Field>
                  </div>
                )}

              </div>
            </CardContent>
          </Card>

          {/* راهنما */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 px-4 py-3" dir="rtl">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-600 dark:text-blue-300">
              هنگام ورود داده، کادر پیش‌نمایش به‌صورت خودکار باز می‌شود. پس از کلیک «ذخیره و خروجی»، پیش‌نمایش بسته شده و فرم پاک می‌شود.
            </p>
          </div>
        </div>

        {/* ── ستون پیش‌نمایش زنده ── */}
        {previewOpen && (
          <div className="w-80 shrink-0 sticky top-4">
            <LivePreview form={form} visible={previewOpen} />
          </div>
        )}
      </div>

      {/* ── خلاصه نهایی بعد از ذخیره ── */}
      {submitted && snapshot && (
        <Card className="mt-5 shadow-sm border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-5 px-6 pb-5">
            <div className="flex items-center gap-2 mb-4" dir="rtl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <h2 className="text-base font-bold text-emerald-700">خلاصه اطلاعات ثبت‌شده</h2>
              <span className="text-xs text-muted-foreground mr-2">— فرم برای ورود داده جدید پاک شد</span>
            </div>
            <div className="rounded-xl border bg-muted/20 px-4 py-2" dir="rtl">
              <SRow label="نوع اعتبار (مصوب/ابلاغی)" value={snapshot.creditKind === "notified" ? "ابلاغی" : "مصوب"} accent="blue" />
              <SRow label="نوع اعتبار" value={CREDIT_TYPE_LABEL[snapshot.creditType]} accent="blue" />
              {snapshot.creditKind === "notified" && <SRow label="ردیف دستگاه ابلاغ‌دهنده" value={snapshot.notifierRow} mono accent="orange" />}
              {(snapshot.creditType === "expense" || (snapshot.creditType === "other" && snapshot.otherHasExpense)) && (
                <>
                  <div className="pt-2 pb-0.5 text-xs font-bold text-blue-600">— هزینه</div>
                  <SRow label="نوع هزینه" value={EXPENSE_KIND_LABEL[snapshot.expense.expenseKind]} accent="blue" />
                  <SRow label="شماره برنامه" value={snapshot.expense.programNumber} mono accent="blue" />
                  <SRow label="فصول هزینه" value={snapshot.expense.expenseChapter ? EXPENSE_CHAPTER_LABEL[snapshot.expense.expenseChapter] : ""} mono accent="blue" />
                  <SRow label="ریزفصل هزینه" value={snapshot.expense.expenseSubChapter ? SUB_CHAPTER_LABEL[snapshot.expense.expenseSubChapter] : ""} mono accent="blue" />
                </>
              )}
              {(snapshot.creditType === "capital" || (snapshot.creditType === "other" && snapshot.otherHasCapital)) && (
                <>
                  <div className="pt-2 pb-0.5 text-xs font-bold text-violet-600">— تملک دارایی‌های سرمایه‌ای</div>
                  <SRow label="شماره طرح" value={snapshot.capital.projectNumber} mono accent="violet" />
                  <SRow label="فصول تملک" value={snapshot.capital.capitalChapter} mono accent="violet" />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
