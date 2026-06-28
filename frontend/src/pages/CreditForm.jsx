import { useState, useEffect, useCallback } from "react";
import {
  Save, Info, CheckCircle2, Pencil, Trash2, Plus, X,
  ChevronLeft, Eye, FileText, AlertTriangle, RefreshCw,
  BadgeCheck, Bell, Layers,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import api from "@/api";

// ══════════════════════════════════════════════════════════════════════════════
// ثوابت
// ══════════════════════════════════════════════════════════════════════════════
const EXPENSE_KIND_OPTIONS = [
  { value: "general",  label: "عمومی" },
  { value: "specific", label: "اختصاصی" },
  { value: "misc",     label: "سایر" },
];
const EXPENSE_CHAPTER_OPTIONS = [
  { value: "110100", label: "110100 — ساختمان و مستحدثات" },
  { value: "110200", label: "110200 — ماشین آلات و تجهیزات" },
  { value: "110300", label: "110300 — سایر دارایی‌های ثابت" },
  { value: "120100", label: "120100 — تغییر در موجودی انبار" },
  { value: "130100", label: "130100 — اقلام گران‌بها" },
  { value: "210000", label: "210000 — زمین" },
  { value: "220000", label: "220000 — سایر دارایی‌های تولید نشده" },
];
const CREDIT_TYPE_OPTIONS = [
  { value: "expense", label: "هزینه" },
  { value: "capital", label: "تملک دارایی‌های سرمایه‌ای" },
  { value: "other",   label: "سایر منابع" },
];

const EXPENSE_KIND_LABEL = { general: "عمومی", specific: "اختصاصی", misc: "سایر" };
const EXPENSE_CHAPTER_LABEL = Object.fromEntries(
  EXPENSE_CHAPTER_OPTIONS.map(o => [o.value, o.label])
);
const CREDIT_TYPE_LABEL = {
  expense: "هزینه",
  capital: "تملک دارایی‌های سرمایه‌ای",
  other: "سایر منابع",
};
const CREDIT_TYPE_COLOR = {
  expense: "bg-blue-100 text-blue-700 border-blue-200",
  capital: "bg-violet-100 text-violet-700 border-violet-200",
  other:   "bg-amber-100 text-amber-700 border-amber-200",
};
const CREDIT_KIND_COLOR = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  notified: "bg-orange-100 text-orange-700 border-orange-200",
};

const ALL_SUB_CHAPTERS_GROUPED = [
  { group: "جبران خدمات کارکنان", value: "211000", label: "211000 — حقوق و دستمزد" },
  { group: "جبران خدمات کارکنان", value: "212000", label: "212000 — حق بیمه اجتماعی کارفرما" },
  { group: "استفاده از کالاها و خدمات", value: "220100", label: "220100 — ماموریت داخلی و خارجی" },
  { group: "استفاده از کالاها و خدمات", value: "220200", label: "220200 — حق‌الزحمه انجام خدمات قراردادی" },
  { group: "استفاده از کالاها و خدمات", value: "220300", label: "220300 — حمل و نقل و ارتباطات" },
  { group: "استفاده از کالاها و خدمات", value: "220400", label: "220400 — نگهداری و تعمیر دارایی‌های ثابت" },
  { group: "استفاده از کالاها و خدمات", value: "220500", label: "220500 — نگهداری و تعمیر وسایل اداری" },
  { group: "استفاده از کالاها و خدمات", value: "220600", label: "220600 — چاپ و خرید نشریات و مطبوعات" },
  { group: "استفاده از کالاها و خدمات", value: "220700", label: "220700 — تصویربرداری و تبلیغات" },
  { group: "استفاده از کالاها و خدمات", value: "220800", label: "220800 — تشریفات" },
  { group: "استفاده از کالاها و خدمات", value: "220900", label: "220900 — هزینه‌های قضایی، ثبتی و حقوقی" },
  { group: "استفاده از کالاها و خدمات", value: "221100", label: "221100 — هزینه‌های بانکی - مالی" },
  { group: "استفاده از کالاها و خدمات", value: "221200", label: "221200 — آب و برق و سوخت" },
  { group: "استفاده از کالاها و خدمات", value: "221300", label: "221300 — مواد و لوازم مصرف شدنی" },
  { group: "استفاده از کالاها و خدمات", value: "221400", label: "221400 — هزینه‌های مطالعاتی و تحقیقاتی" },
  { group: "استفاده از کالاها و خدمات", value: "221500", label: "221500 — اجاره ساختمان و ماشین‌آلات" },
  { group: "استفاده از کالاها و خدمات", value: "221600", label: "221600 — سایر استفاده از کالاها و خدمات" },
  { group: "مصرف سرمایه‌های ثابت", value: "231000", label: "231000 — دارایی‌های ثابت مشهود" },
  { group: "مصرف سرمایه‌های ثابت", value: "232000", label: "232000 — دارایی‌های ثابت نامشهود" },
  { group: "سود", value: "241000", label: "241000 — پرداخت سود به اشخاص غیرمقیم" },
  { group: "سود", value: "242000", label: "242000 — پرداخت به اشخاص مقیم به جز دولت عمومی" },
  { group: "سود", value: "243000", label: "243000 — پرداختی به واحدهای دولت عمومی" },
  { group: "یارانه", value: "251000", label: "251000 — یارانه به شرکت‌های دولتی" },
  { group: "یارانه", value: "252000", label: "252000 — یارانه به بنگاه‌های خصوصی" },
  { group: "یارانه", value: "253000", label: "253000 — یارانه به سایر بخش‌ها" },
  { group: "کمک‌های بلاعوض", value: "261000", label: "261000 — کمک بلاعوض به دولت‌های خارجی" },
  { group: "کمک‌های بلاعوض", value: "262000", label: "262000 — کمک بلاعوض به سازمان‌های بین‌المللی" },
  { group: "کمک‌های بلاعوض", value: "263000", label: "263000 — کمک بلاعوض به سایر واحدهای دولت عمومی" },
  { group: "مزایای اجتماعی", value: "271000", label: "271000 — مزایای تامین اجتماعی" },
  { group: "مزایای اجتماعی", value: "272000", label: "272000 — مزایای کمک اجتماعی" },
  { group: "مزایای اجتماعی", value: "273000", label: "273000 — مزایای اجتماعی مرتبط با اشتغال" },
  { group: "سایر هزینه‌ها", value: "281000", label: "281000 — هزینه استفاده از دارایی به جز سود" },
  { group: "سایر هزینه‌ها", value: "282000", label: "282000 — انتقالات طبقه‌بندی نشده در جای دیگر" },
  { group: "سایر هزینه‌ها", value: "283000", label: "283000 — حق بیمه و خسارت‌های مربوط به بیمه عمر" },
];
const SUB_CHAPTER_LABEL = Object.fromEntries(ALL_SUB_CHAPTERS_GROUPED.map(o => [o.value, o.label]));

const INITIAL_EXPENSE = { expenseKind: "", programNumber: "", expenseChapter: "", expenseSubChapter: "" };
const INITIAL_CAPITAL = { projectNumber: "", capitalChapter: "" };
const INITIAL_FORM = {
  creditKind: "approved", creditType: "", notifierRow: "",
  expense: { ...INITIAL_EXPENSE },
  capital: { ...INITIAL_CAPITAL },
  otherHasExpense: false, otherHasCapital: false,
};

// ══════════════════════════════════════════════════════════════════════════════
// کامپوننت‌های فرم
// ══════════════════════════════════════════════════════════════════════════════
function Field({ label, required, children, fullWidth, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "col-span-2", className)}>
      <Label className="text-sm font-medium text-foreground/90 text-right">
        {label}{required && <span className="text-primary mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ExpenseFields({ data, onChange }) {
  function set(field, val) { onChange({ ...data, [field]: val }); }
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4" dir="rtl">
      <Field label="نوع هزینه" required>
        <SearchableSelect value={data.expenseKind} onChange={v => set("expenseKind", v)}
          options={EXPENSE_KIND_OPTIONS} placeholder="انتخاب نوع هزینه" searchable={false} />
      </Field>
      <div />
      <Field label="شماره برنامه" required>
        <Input value={data.programNumber} onChange={e => set("programNumber", e.target.value)}
          placeholder="شماره برنامه" className="h-9 text-sm" dir="ltr" />
      </Field>
      <Field label="فصول" required>
        <SearchableSelect value={data.expenseChapter} onChange={v => set("expenseChapter", v)}
          options={EXPENSE_CHAPTER_OPTIONS} placeholder="انتخاب فصل" />
      </Field>
      <Field label="ریزفصل هزینه" required fullWidth>
        <SearchableSelect value={data.expenseSubChapter} onChange={v => set("expenseSubChapter", v)}
          options={ALL_SUB_CHAPTERS_GROUPED} placeholder="انتخاب ریزفصل" />
      </Field>
    </div>
  );
}

function CapitalFields({ data, onChange }) {
  function set(field, val) { onChange({ ...data, [field]: val }); }
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4" dir="rtl">
      <Field label="شماره طرح" required>
        <Input value={data.projectNumber} onChange={e => set("projectNumber", e.target.value)}
          placeholder="شماره طرح" className="h-9 text-sm" dir="ltr" />
      </Field>
      <Field label="فصول" required>
        <SearchableSelect value={data.capitalChapter} onChange={v => set("capitalChapter", v)}
          options={EXPENSE_CHAPTER_OPTIONS} placeholder="انتخاب فصل" />
      </Field>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Badge کوچک برای نمایش نوع
// ══════════════════════════════════════════════════════════════════════════════
function Badge({ children, className }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal جزئیات / ویرایش / افزودن
// ══════════════════════════════════════════════════════════════════════════════
function CreditModal({ mode, item, onClose, onSaved }) {
  // mode: "view" | "edit" | "add"
  const isView = mode === "view";
  const isAdd  = mode === "add";

  const [form, setForm] = useState(() => {
    if (isAdd) return { ...INITIAL_FORM, expense: { ...INITIAL_EXPENSE }, capital: { ...INITIAL_CAPITAL } };
    return {
      creditKind:      item?.creditKind      ?? "approved",
      creditType:      item?.creditType      ?? "",
      notifierRow:     item?.notifierRow     ?? "",
      expense:         { ...INITIAL_EXPENSE, ...(item?.expense  ?? {}) },
      capital:         { ...INITIAL_CAPITAL, ...(item?.capital  ?? {}) },
      otherHasExpense: item?.otherHasExpense ?? false,
      otherHasCapital: item?.otherHasCapital ?? false,
    };
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [localMode, setLocalMode] = useState(mode);

  const isEditing = localMode === "edit" || localMode === "add";

  function setF(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm(f => {
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
      if (!isAdd) {
        await api.put(`/api/credits/definitions/${item._id}`, form);
      } else {
        await api.post("/api/credits/definitions", form);
      }
      onSaved(isAdd ? "افزوده" : "ویرایش");
    } catch (err) {
      setError(err?.response?.data?.message ?? "خطا در ذخیره‌سازی. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  }

  const ct = form.creditType;
  const isNotified = form.creditKind === "notified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {isAdd ? "افزودن اعتبار جدید" : isEditing ? "ویرایش اعتبار" : "جزئیات اعتبار"}
              </h2>
              {!isAdd && item && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CREDIT_TYPE_LABEL[item.creditType] ?? "—"} ·{" "}
                  {item.creditKind === "notified" ? "ابلاغی" : "مصوب"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdd && !isEditing && (
              <Button size="sm" variant="outline" onClick={() => setLocalMode("edit")} className="gap-1.5 h-8 text-xs">
                <Pencil className="h-3.5 w-3.5" />ویرایش
              </Button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 px-6 py-5 space-y-5">

          {/* نوع اعتبار (مصوب/ابلاغی) */}
          <div className="rounded-xl border bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">نوع اعتبار</p>
            {isEditing ? (
              <div className="flex items-center gap-6">
                {[{ value: "approved", label: "مصوب" }, { value: "notified", label: "ابلاغی" }].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="radio" name="creditKind" value={value}
                      checked={form.creditKind === value} onChange={setF("creditKind")}
                      className="accent-primary h-4 w-4" />
                    <span className={cn("font-medium transition-colors", form.creditKind === value && "text-primary")}>{label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <Badge className={CREDIT_KIND_COLOR[item?.creditKind ?? "approved"]}>
                {item?.creditKind === "notified" ? "ابلاغی" : "مصوب"}
              </Badge>
            )}
          </div>

          {/* نوع (هزینه/تملک/سایر) */}
          <div>
            <Field label="نوع" required={isEditing}>
              {isEditing ? (
                <div className="max-w-xs">
                  <SearchableSelect value={form.creditType}
                    onChange={v => { setForm(f => ({ ...f, creditType: v })); setError(null); }}
                    options={CREDIT_TYPE_OPTIONS} placeholder="انتخاب نوع اعتبار" searchable={false} />
                </div>
              ) : (
                <Badge className={CREDIT_TYPE_COLOR[item?.creditType] ?? "bg-muted text-muted-foreground border-border"}>
                  {CREDIT_TYPE_LABEL[item?.creditType] ?? "—"}
                </Badge>
              )}
            </Field>
          </div>

          {/* فیلدهای هزینه */}
          {ct === "expense" && (
            <div className={cn("rounded-xl border p-4", isEditing ? "border-blue-200 bg-blue-50/40" : "border-blue-100 bg-blue-50/30")}>
              <p className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />اطلاعات هزینه
              </p>
              {isEditing
                ? <ExpenseFields data={form.expense} onChange={d => setForm(f => ({ ...f, expense: d }))} />
                : <DetailGrid rows={[
                    { label: "نوع هزینه",    value: EXPENSE_KIND_LABEL[item?.expense?.expenseKind]           },
                    { label: "شماره برنامه", value: item?.expense?.programNumber, mono: true                 },
                    { label: "فصل",          value: EXPENSE_CHAPTER_LABEL[item?.expense?.expenseChapter]     },
                    { label: "ریزفصل",       value: SUB_CHAPTER_LABEL[item?.expense?.expenseSubChapter]      },
                  ]} />
              }
            </div>
          )}

          {/* فیلدهای تملک */}
          {ct === "capital" && (
            <div className={cn("rounded-xl border p-4", isEditing ? "border-violet-200 bg-violet-50/40" : "border-violet-100 bg-violet-50/30")}>
              <p className="text-xs font-bold text-violet-700 mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />اطلاعات تملک دارایی‌های سرمایه‌ای
              </p>
              {isEditing
                ? <CapitalFields data={form.capital} onChange={d => setForm(f => ({ ...f, capital: d }))} />
                : <DetailGrid rows={[
                    { label: "شماره طرح", value: item?.capital?.projectNumber, mono: true           },
                    { label: "فصل",       value: EXPENSE_CHAPTER_LABEL[item?.capital?.capitalChapter]},
                  ]} />
              }
            </div>
          )}

          {/* فیلدهای سایر */}
          {ct === "other" && (
            <div className={cn("rounded-xl border p-4 space-y-4", isEditing ? "border-amber-200 bg-amber-50/40" : "border-amber-100 bg-amber-50/30")}>
              <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />سایر منابع
              </p>
              {isEditing ? (
                <div className="flex flex-wrap gap-6">
                  {[{ field: "otherHasExpense", label: "هزینه" }, { field: "otherHasCapital", label: "تملک دارایی" }].map(({ field, label }) => (
                    <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input type="checkbox" checked={form[field]} onChange={setF(field)} className="accent-primary h-4 w-4 rounded" />
                      <span className={cn("font-medium", form[field] && "text-primary")}>{label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {item?.otherHasExpense && <Badge className="bg-blue-100 text-blue-700 border-blue-200">هزینه</Badge>}
                  {item?.otherHasCapital && <Badge className="bg-violet-100 text-violet-700 border-violet-200">تملک دارایی</Badge>}
                </div>
              )}
              {form.otherHasExpense && isEditing && (
                <div className="rounded-lg border border-blue-200 bg-white p-4">
                  <p className="text-xs font-bold text-blue-600 mb-3">فیلدهای هزینه</p>
                  <ExpenseFields data={form.expense} onChange={d => setForm(f => ({ ...f, expense: d }))} />
                </div>
              )}
              {form.otherHasCapital && isEditing && (
                <div className="rounded-lg border border-violet-200 bg-white p-4">
                  <p className="text-xs font-bold text-violet-600 mb-3">فیلدهای تملک دارایی</p>
                  <CapitalFields data={form.capital} onChange={d => setForm(f => ({ ...f, capital: d }))} />
                </div>
              )}
              {!isEditing && item?.otherHasExpense && (
                <DetailGrid rows={[
                  { label: "نوع هزینه",    value: EXPENSE_KIND_LABEL[item?.expense?.expenseKind]       },
                  { label: "شماره برنامه", value: item?.expense?.programNumber, mono: true             },
                  { label: "فصل",          value: EXPENSE_CHAPTER_LABEL[item?.expense?.expenseChapter] },
                  { label: "ریزفصل",       value: SUB_CHAPTER_LABEL[item?.expense?.expenseSubChapter]  },
                ]} />
              )}
              {!isEditing && item?.otherHasCapital && (
                <DetailGrid rows={[
                  { label: "شماره طرح", value: item?.capital?.projectNumber, mono: true            },
                  { label: "فصل",       value: EXPENSE_CHAPTER_LABEL[item?.capital?.capitalChapter] },
                ]} />
              )}
            </div>
          )}

          {/* ردیف ابلاغ‌دهنده */}
          {isNotified && (
            <div className={cn("rounded-xl border p-4", isEditing ? "border-orange-200 bg-orange-50/40" : "border-orange-100 bg-orange-50/30")}>
              <p className="text-xs font-bold text-orange-700 mb-3 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" />اطلاعات ابلاغ‌دهنده
              </p>
              {isEditing
                ? <Field label="ردیف دستگاه ابلاغ‌دهنده" required>
                    <Input value={form.notifierRow} onChange={setF("notifierRow")}
                      placeholder="ردیف دستگاه ابلاغ‌دهنده را وارد کنید"
                      className="h-9 text-sm max-w-sm" dir="ltr" />
                  </Field>
                : <DetailGrid rows={[{ label: "ردیف ابلاغ‌دهنده", value: item?.notifierRow, mono: true }]} />
              }
            </div>
          )}

          {/* تاریخ */}
          {!isAdd && item?.createdAt && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
              <span>ثبت: {new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <span>آخرین ویرایش: {new Date(item.updatedAt).toLocaleDateString("fa-IR")}</span>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2.5 text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {isEditing && (
          <div className="flex items-center gap-2 border-t px-6 py-4 bg-muted/20 rounded-b-2xl shrink-0">
            <Button onClick={handleSave} disabled={!form.creditKind || !form.creditType || saving}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="h-4 w-4" />
              {saving ? "در حال ذخیره..." : (isAdd ? "ثبت اعتبار" : "ذخیره تغییرات")}
            </Button>
            <Button variant="outline" onClick={isAdd ? onClose : () => setLocalMode("view")} disabled={saving} className="gap-1.5">
              <X className="h-4 w-4" />انصراف
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// grid ساده برای نمایش جزئیات read-only
function DetailGrid({ rows }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
      {rows.filter(r => r.value).map(({ label, value, mono }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
          <span className={cn("text-sm text-foreground leading-snug", mono && "font-mono")}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dialog تأیید حذف
// ══════════════════════════════════════════════════════════════════════════════
function DeleteDialog({ item, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background shadow-2xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground mb-1">حذف اعتبار</h3>
            <p className="text-sm text-muted-foreground">
              اعتبار <span className="font-semibold text-foreground">«{CREDIT_TYPE_LABEL[item?.creditType] ?? "—"} — {item?.creditKind === "notified" ? "ابلاغی" : "مصوب"}»</span> حذف خواهد شد. این عملیات قابل بازگشت نیست.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-start">
          <Button variant="destructive" onClick={onConfirm} disabled={deleting} className="gap-1.5">
            <Trash2 className="h-4 w-4" />{deleting ? "در حال حذف..." : "بله، حذف کن"}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={deleting} className="gap-1.5">
            <X className="h-4 w-4" />انصراف
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ردیف جدول
// ══════════════════════════════════════════════════════════════════════════════
function CreditRow({ item, index, onView, onEdit, onDelete }) {
  const ct = item.creditType;
  const hasExpense = ct === "expense" || (ct === "other" && item.otherHasExpense);
  const hasCapital = ct === "capital" || (ct === "other" && item.otherHasCapital);

  return (
    <tr
      onClick={() => onView(item)}
      className="border-b last:border-0 hover:bg-primary/[0.03] cursor-pointer transition-colors group"
    >
      {/* ردیف */}
      <td className="px-4 py-3 text-center text-xs text-muted-foreground/70 w-12">{index + 1}</td>

      {/* نوع اعتبار */}
      <td className="px-4 py-3 w-28">
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", CREDIT_KIND_COLOR[item.creditKind ?? "approved"])}>
          {item.creditKind === "notified"
            ? <><Bell className="h-2.5 w-2.5" />ابلاغی</>
            : <><BadgeCheck className="h-2.5 w-2.5" />مصوب</>}
        </span>
      </td>

      {/* نوع */}
      <td className="px-4 py-3 w-44">
        <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold", CREDIT_TYPE_COLOR[ct] ?? "bg-muted text-muted-foreground border-border")}>
          {CREDIT_TYPE_LABEL[ct] ?? "—"}
        </span>
      </td>

      {/* خلاصه اطلاعات */}
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-1">
          {hasExpense && item.expense?.programNumber && (
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-foreground/70">
              برنامه: {item.expense.programNumber}
            </span>
          )}
          {hasExpense && item.expense?.expenseKind && (
            <span className="bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 border border-blue-100">
              {EXPENSE_KIND_LABEL[item.expense.expenseKind]}
            </span>
          )}
          {hasCapital && item.capital?.projectNumber && (
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-foreground/70">
              طرح: {item.capital.projectNumber}
            </span>
          )}
          {item.creditKind === "notified" && item.notifierRow && (
            <span className="bg-orange-50 text-orange-600 rounded px-1.5 py-0.5 border border-orange-100 font-mono">
              ردیف: {item.notifierRow}
            </span>
          )}
          {!hasExpense && !hasCapital && !item.notifierRow && (
            <span className="text-muted-foreground/50">—</span>
          )}
        </div>
      </td>

      {/* تاریخ ثبت */}
      <td className="px-4 py-3 w-28 text-xs text-muted-foreground/70 text-center">
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
      </td>

      {/* عملیات */}
      <td className="px-4 py-3 w-28" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onView(item)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title="مشاهده جزئیات">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onEdit(item)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title="ویرایش">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(item)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="حذف">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// صفحه اصلی
// ══════════════════════════════════════════════════════════════════════════════
export default function CreditForm() {
  const [credits, setCredits]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // modal state
  const [modal, setModal] = useState(null); // { mode: "view"|"edit"|"add", item?: object }
  // delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get("/api/credits/definitions");
      setCredits(res.data.data ?? []);
    } catch {
      setFetchError("خطا در بارگذاری اطلاعات. اتصال به سرور را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleModalSaved(action) {
    setModal(null);
    showSuccess(`اعتبار با موفقیت ${action} شد.`);
    await fetchCredits();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/credits/definitions/${deleteTarget._id}`);
      setCredits(prev => prev.filter(c => c._id !== deleteTarget._id));
      setDeleteTarget(null);
      showSuccess("اعتبار با موفقیت حذف شد.");
    } catch (err) {
      setFetchError(err?.response?.data?.message ?? "خطا در حذف. دوباره تلاش کنید.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors">اطلاعات پایه</span>
        <ChevronLeft className="h-3 w-3" />
        <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors">تعاریف</span>
        <ChevronLeft className="h-3 w-3" />
        <span>تعریف اعتبار</span>
      </div>

      {/* هدر صفحه */}
      <div className="mb-5 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground">تعریف اعتبار</h1>
          <p className="text-xs text-muted-foreground mt-0.5">اعتبارات مصوب و ابلاغی را تعریف، مشاهده و مدیریت کنید.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCredits} className="gap-1.5 h-9 text-xs" disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            بروزرسانی
          </Button>
          <Button size="sm" onClick={() => setModal({ mode: "add" })} className="gap-1.5 h-9 text-xs">
            <Plus className="h-4 w-4" />افزودن اعتبار جدید
          </Button>
        </div>
      </div>

      {/* پیام موفقیت */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" dir="rtl">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{successMsg}
        </div>
      )}

      {/* پیام خطا */}
      {fetchError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" dir="rtl">
          <AlertTriangle className="h-4 w-4 shrink-0" />{fetchError}
          <button onClick={() => setFetchError(null)} className="mr-auto text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* کارت جدول */}
      <Card>
        <CardHeader className="pb-3 border-b" dir="rtl">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              لیست اعتبارات تعریف‌شده
            </CardTitle>
            {!loading && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                {credits.length} مورد
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm" dir="rtl">
              <RefreshCw className="h-4 w-4 animate-spin" />در حال بارگذاری...
            </div>
          ) : credits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/50">
                <FileText className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">هنوز اعتباری ثبت نشده</p>
                <p className="text-xs text-muted-foreground mt-1">با کلیک روی «افزودن اعتبار جدید» شروع کنید.</p>
              </div>
              <Button size="sm" onClick={() => setModal({ mode: "add" })} className="gap-1.5 mt-1 text-xs">
                <Plus className="h-3.5 w-3.5" />افزودن اولین اعتبار
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-12">#</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground w-28">اعتبار</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground w-44">نوع</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">خلاصه اطلاعات</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-28">تاریخ ثبت</th>
                    <th className="px-4 py-3 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {credits.map((item, idx) => (
                    <CreditRow
                      key={item._id}
                      item={item}
                      index={idx}
                      onView={it => setModal({ mode: "view", item: it })}
                      onEdit={it => setModal({ mode: "edit", item: it })}
                      onDelete={it => setDeleteTarget(it)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* راهنما */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border bg-primary/5 border-primary/20 px-4 py-3" dir="rtl">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-primary/80">
          روی هر ردیف کلیک کنید تا جزئیات کامل مشاهده شود. برای ویرایش یا حذف از آیکون‌های هر ردیف استفاده کنید.
        </p>
      </div>

      {/* Modal جزئیات / ویرایش / افزودن */}
      {modal && (
        <CreditModal
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
        />
      )}

      {/* Dialog حذف */}
      {deleteTarget && (
        <DeleteDialog
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}
    </PageShell>
  );
}
