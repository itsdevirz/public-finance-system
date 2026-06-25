import { useState, useMemo } from "react";
import { Search, Plus, Printer, FileDown, Trash2, Save } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import personTypesData from "@/data/sanamaTypes.json";

// ─── ساختار سلسله‌مراتبی از sanamaTypes.json ───────────────────────────────
// personTypesData.personTypes => آرایه‌ای از بخش‌های اصلی (A,B,C,D,E)
// هر بخش children => طبقه اشخاص (۲ رقم: ۳۱، ۳۲، ۳۳، ۳۴، ۳۵)
// هر طبقه children => ریزطبقه (۳ رقم: ۳۱۱، ۳۱۲، ...)
// هر ریزطبقه children => جزءطبقه (۴ رقم: ۳۱۱۱، ۳۱۱۲، ...)

// نوع شخص (بخش اول NomineeCode) - طبق استاندارد سناما
const PERSON_KIND_OPTIONS = [
  { value: "A", label: "A - اشخاص حقوقی" },
  { value: "B", label: "B - اشخاص حقیقی (ایرانی با اهمیت)" },
  { value: "C", label: "C - اشخاص حقیقی ایرانی سایر" },
  { value: "D", label: "D - اشخاص حقیقی خارجی سایر" },
];

// نوع‌هایی که حقیقی هستند
const NATURAL_PERSON_KINDS = ["B", "C", "D"];
// نوع‌هایی که نیاز به کد ملی ندارند (از کد پیشنهادی استفاده می‌کنند)
const NO_NATIONAL_ID_KINDS = ["C", "D"];

// ساختار ثابت طبقه اشخاص (۲ رقم) - همه انواع A-D از این استفاده می‌کنند
const ALL_CLASSES = [
  { value: "31", label: "31 - بخش خصوصی" },
  { value: "32", label: "32 - بخش دولتی" },
  { value: "33", label: "33 - بخش عمومی غیردولتی" },
  { value: "34", label: "34 - بخش تعاونی" },
  { value: "35", label: "35 - بخش خارجی" },
];

// استخراج طبقات — همیشه همه ۵ طبقه، مستقل از نوع شخص
function getClasses() {
  return ALL_CLASSES;
}

// استخراج ریزطبقه‌ها بر اساس کد طبقه — فقط از بخش A (کامل‌ترین منبع)
function getSubClasses(classCode) {
  if (!classCode) return [];
  for (const sec of personTypesData.personTypes) {
    if (sec.type !== "A") continue;
    for (const cls of sec.children || []) {
      if (cls.code === classCode) {
        return (cls.children || []).map((s) => ({ value: s.code, label: `${s.code} - ${s.title}` }));
      }
    }
  }
  return [];
}

// استخراج جزءطبقه‌ها بر اساس کد ریزطبقه — فقط از بخش A
function getDetailClasses(classCode, subCode) {
  if (!classCode || !subCode) return [];
  for (const sec of personTypesData.personTypes) {
    if (sec.type !== "A") continue;
    for (const cls of sec.children || []) {
      if (cls.code !== classCode) continue;
      for (const sub of cls.children || []) {
        if (sub.code === subCode) {
          return (sub.children || []).map((d) => ({ value: d.code, label: `${d.code} - ${d.title}` }));
        }
      }
    }
  }
  return [];
}

// ─── مقادیر پیش‌فرض فرم ────────────────────────────────────────────────────
const INITIAL_FORM = {
  // بخش اول NomineeCode
  personKind: "A",         // A=حقوقی، B=حقیقی ایرانی باهمیت، C=حقیقی ایرانی سایر، D=حقیقی خارجی سایر
  // طبقه‌بندی (بخش دوم NomineeCode - ۴ رقم)
  personClass: "31",       // طبقه اشخاص (2 رقم): 31 تا 35
  subClass: "311",         // ریزطبقه (3 رقم)
  detailClass: "3111",     // جزءطبقه (4 رقم)
  // کدهای شناسایی
  exclusiveCode: "",       // کد شناسایی انحصاری (5 رقم) - برای A و B
  suggestedCode: "",     // کد پیشنهادی (2 رقم) - برای C و D
  inactive: false,
  // اطلاعات اصلی
  title: "",               // نام / عنوان (حقوقی)
  nationalId: "",          // کد / شناسه ملی (10 رقم) - برای A و B
  economicCode: "",        // کد اقتصادی
  // اطلاعات حقیقی (برای B, C, D)
  firstName: "",
  lastName: "",
  fatherName: "",
  birthDate: "",
  gender: "male",
  // آدرس و موقعیت
  province: "",
  city: "",
  address: "",
  postalCode: "",
  phone: "",
  // بانکی
  sheba: "",
  bankName: "",
  bankBranch: "",
  accountNumber: "",
  // مالیاتی
  taxRegStartDate: "",
  taxRegEndDate: "",
  vatRegistered: false,
  vatBase: "",
  // پرداخت
  paymentLimitationType: "none",
  maxPaymentAmount: "",
  // نام دوم / سمت
  altTitle: "",
  position: "",
};

const TABS = [
  { key: "main",     label: "اطلاعات اصلی" },
  { key: "bank",     label: "اطلاعات بانکی و مالیاتی" },
  { key: "agent",    label: "تعریف عامل ذیحساب" },
  { key: "contract", label: "تعریف طرف قرارداد" },
];

const SAMPLE_LIST = [
  { id: 1, nomineeCode: "A3111**********", nationalId: "1010115089", title: "شرکت پیمانکاری الف", personKind: "A", detailClass: "3111", economicCode: "23017000000", sheba: "IR410000000000000001", province: "تهران", city: "تهران", address: "" },
  { id: 2, nomineeCode: "A3221**********", nationalId: "1010031337", title: "بانک مرکزی جمهوری اسلامی ایران", personKind: "A", detailClass: "3221", economicCode: "", sheba: "", province: "تهران", city: "تهران", address: "" },
];

// ─── کامپوننت‌های کمکی ──────────────────────────────────────────────────────
function StyledSelect({ id, value, onChange, options, placeholder, disabled, className }) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-full",
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Field({ label, children, required, col = 1 }) {
  return (
    <div className={cn("flex flex-col gap-1", col === 2 && "col-span-2")}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="col-span-full flex items-center gap-2 pb-1 border-b">
      <span className="text-xs font-bold text-primary uppercase tracking-wide">{children}</span>
    </div>
  );
}

// ─── تابع ساخت NomineeCode (16 کاراکتر) ──────────────────────────────────
// ساختار:
//   A/B: [نوع 1حرف] + [جزءطبقه 4رقم] + [کد انحصاری 5رقم] + [6رقم آخر کدملی/شناسه]
//   C/D: [نوع 1حرف] + [جزءطبقه 4رقم] + [9999] + [جزءطبقه مجدد 5رقم] + [کد پیشنهادی 2رقم]
//        مثال تصویر: C31139999311310۱ => C + 3113 + 9999 + 31131 + 01
function buildNomineeCode(personKind, detailClass, exclusiveCode, nationalId, suggestedCode) {
  const kind = personKind || "A";
  const cls4 = (detailClass || "").padEnd(4, "*").substring(0, 4);

  if (kind === "C" || kind === "D") {
    // فرمت C/D: نوع(1) + جزءطبقه(4) + 9999(4) + جزءطبقه‌مجدد(5) + کدپیشنهادی(2) = 16
    const cls5 = (detailClass || "").padEnd(5, "0").substring(0, 5);
    const sugg = (suggestedCode || "01").padStart(2, "0").substring(0, 2);
    return `${kind}${cls4}9999${cls5}${sugg}`;
  }
  // فرمت A/B: نوع(1) + جزءطبقه(4) + انحصاری(5) + 6رقم‌کدملی(6) = 16
  const excl = (exclusiveCode || "").padEnd(5, "*").substring(0, 5);
  const natId = (nationalId || "").slice(-6).padStart(6, "*");
  return `${kind}${cls4}${excl}${natId}`;
}

// ─── صفحه اصلی ─────────────────────────────────────────────────────────────
export default function PersonsForm() {
  const [form, setForm]           = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState("main");
  const [list, setList]           = useState(SAMPLE_LIST);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [saved, setSaved]         = useState(false);

  // گزینه‌های وابسته — کاملاً مستقل از نوع شخص
  const classOptions    = useMemo(() => getClasses(), []);
  const subClassOptions = useMemo(() => getSubClasses(form.personClass), [form.personClass]);
  const detailOptions   = useMemo(() => getDetailClasses(form.personClass, form.subClass), [form.personClass, form.subClass]);

  // NomineeCode پیش‌نمایش
  const nomineeCode = buildNomineeCode(form.personKind, form.detailClass, form.exclusiveCode, form.nationalId, form.suggestedCode);

  const isLegal   = form.personKind === "A";
  const isNatural = NATURAL_PERSON_KINDS.includes(form.personKind);
  const needsNationalId = !NO_NATIONAL_ID_KINDS.includes(form.personKind);

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // ریست ریزطبقه و جزءطبقه وقتی طبقه عوض شد
        if (field === "personClass") {
          const subs = getSubClasses(val);
          next.subClass    = subs[0]?.value ?? "";
          const details    = getDetailClasses(val, subs[0]?.value ?? "");
          next.detailClass = details[0]?.value ?? "";
        }
        // ریست جزءطبقه وقتی ریزطبقه عوض شد
        if (field === "subClass") {
          const details    = getDetailClasses(f.personClass, val);
          next.detailClass = details[0]?.value ?? "";
        }
        return next;
      });
      setSaved(false);
    };
  }

  function handleNew() {
    setForm(INITIAL_FORM);
    setSelected(null);
    setSaved(false);
    setActiveTab("main");
  }

  function handleSave() {
    if (!form.title.trim() && !form.firstName.trim()) return;
    const displayTitle = isLegal
      ? form.title
      : `${form.firstName} ${form.lastName}`.trim();
    const record = {
      id: selected ?? Date.now(),
      nomineeCode,
      nationalId: form.nationalId,
      title: displayTitle,
      personKind: form.personKind,
      detailClass: form.detailClass,
      economicCode: form.economicCode,
      sheba: form.sheba,
      province: form.province,
      city: form.city,
      address: form.address,
    };
    if (selected !== null) {
      setList((l) => l.map((r) => r.id === selected ? record : r));
    } else {
      setList((l) => [...l, record]);
    }
    setSaved(true);
  }

  function handleDelete() {
    if (selected === null) return;
    setList((l) => l.filter((r) => r.id !== selected));
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row.id);
    setForm((f) => ({
      ...INITIAL_FORM,
      personKind: row.personKind ?? "A",
      detailClass: row.detailClass ?? "",
      title: row.personKind === "A" ? row.title : "",
      firstName: row.personKind !== "A" ? row.title?.split(" ")[0] ?? "" : "",
      lastName: row.personKind !== "A" ? row.title?.split(" ")[1] ?? "" : "",
      nationalId: row.nationalId ?? "",
      economicCode: row.economicCode ?? "",
      sheba: row.sheba ?? "",
      province: row.province ?? "",
      city: row.city ?? "",
      address: row.address ?? "",
    }));
    setSaved(false);
    setActiveTab("main");
  }

  const filtered = list.filter((r) =>
    !search ||
    r.title?.includes(search) ||
    r.nationalId?.includes(search) ||
    r.nomineeCode?.includes(search) ||
    r.economicCode?.includes(search)
  );


  return (
    <PageShell>
      <PageHeader title="تعریف اشخاص" description="تعریف اشخاص حقیقی و حقوقی - کد NomineeCode (16 کاراکتر)">
        {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ثبت شد</span>}
      </PageHeader>

      {/* نوار NomineeCode */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-2 flex-wrap">
        <span className="text-xs text-muted-foreground">نمونه کد کامل اشخاص (NomineeCode - 16 کاراکتر):</span>
        <span className="font-mono text-sm font-bold tracking-widest text-primary bg-primary/10 rounded px-3 py-1">
          {nomineeCode}
        </span>
        {(form.personKind === "C" || form.personKind === "D") ? (
          <span className="text-xs text-muted-foreground">
            [{form.personKind}] نوع &nbsp;|&nbsp;
            [{form.detailClass || "----"}] جزءطبقه &nbsp;|&nbsp;
            [9999] ثابت &nbsp;|&nbsp;
            [{(form.detailClass || "").padEnd(5,"0").substring(0,5)}] جزءطبقه تکرار &nbsp;|&nbsp;
            [{(form.suggestedCode || "01").padStart(2,"0")}] کد پیشنهادی
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            [{form.personKind}] نوع &nbsp;|&nbsp;
            [{form.detailClass || "----"}] جزءطبقه &nbsp;|&nbsp;
            [{(form.exclusiveCode || "").padEnd(5, "*").substring(0, 5)}] کد انحصاری &nbsp;|&nbsp;
            [{(form.nationalId || "").slice(-6).padStart(6, "*")}] 6 رقم آخر کدملی
          </span>
        )}
        <label className="mr-auto flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={form.inactive} onChange={set("inactive")} className="rounded" />
          <span className={cn("font-medium", form.inactive && "text-destructive")}>غیرفعال</span>
        </label>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b mb-0 gap-0">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <Card className="rounded-tl-none rounded-tr-none border-t-0">
        <CardContent className="pt-5">

          {/* ══════════ تب اطلاعات اصلی ══════════ */}
          {activeTab === "main" && (
            <div className="space-y-5">

              {/* ── بخش طبقه‌بندی NomineeCode ── */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">طبقه‌بندی اشخاص (NomineeCode)</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">

                  <Field label="نوع شخص" required>
                    <StyledSelect
                      value={form.personKind}
                      onChange={set("personKind")}
                      options={PERSON_KIND_OPTIONS}
                    />
                  </Field>

                  <Field label="طبقه اشخاص" required>
                    <StyledSelect
                      value={form.personClass}
                      onChange={set("personClass")}
                      options={classOptions}
                    />
                  </Field>

                  <Field label="ریزطبقه" required>
                    <StyledSelect
                      value={form.subClass}
                      onChange={set("subClass")}
                      options={subClassOptions}
                      disabled={!subClassOptions.length}
                    />
                  </Field>

                  <Field label="جزءطبقه" required>
                    <StyledSelect
                      value={form.detailClass}
                      onChange={set("detailClass")}
                      options={detailOptions}
                      disabled={!detailOptions.length}
                    />
                  </Field>

                  {needsNationalId ? (
                    <>
                      <Field label="کد شناسایی انحصاری">
                        <Input
                          value={form.exclusiveCode}
                          onChange={set("exclusiveCode")}
                          className="h-8 text-sm font-mono"
                          dir="ltr"
                          maxLength={5}
                          placeholder="*****"
                        />
                      </Field>
                      <Field label="کد / شناسه ملی" required>
                        <Input
                          value={form.nationalId}
                          onChange={set("nationalId")}
                      رقم    className="h-8 text-sm font-mono"
                          dir="ltr"
                          maxLength={11}
                          placeholder="10 رقم"
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="کد پیشنهادی (۲ رقم - آخر NomineeCode)">
                        <Input
                          value={form.suggestedCode}
                          onChange={set("suggestedCode")}
                          className="h-8 text-sm font-mono"
                          dir="ltr"
                          maxLength={2}
                          placeholder="01"
                        />
                      </Field>
                      <Field label="کد ملی (اختیاری)">
                        <Input
                          value={form.nationalId}
                          onChange={set("nationalId")}
                          className="h-8 text-sm font-mono"
                          dir="ltr"
                          maxLength={11}
                          placeholder="اختیاری"
                        />
                      </Field>
                    </>
                  )}

                  <Field label="کد اقتصادی">
                    <Input
                      value={form.economicCode}
                      onChange={set("economicCode")}
                      className="h-8 text-sm font-mono"
                      dir="ltr"
                      placeholder="12 رقم"
                    />
                  </Field>

                  <Field label="عنوان سرفصل / کد">
                    <Input
                      value={form.altTitle}
                      onChange={set("altTitle")}
                      className="h-8 text-sm"
                    />
                  </Field>
                </div>
              </div>

              {/* ── اطلاعات هویتی ── */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">
                  {isLegal ? "اطلاعات هویتی - شخص حقوقی" : `اطلاعات هویتی - شخص حقیقی (نوع ${form.personKind})`}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                  {isLegal ? (
                    <>
                      <Field label="نام / عنوان شرکت یا سازمان" required col={2}>
                        <Input value={form.title} onChange={set("title")} className="h-8 text-sm" placeholder="نام کامل شخص حقوقی" />
                      </Field>
                      <Field label="نام مخفف / برند">
                        <Input value={form.altTitle} onChange={set("altTitle")} className="h-8 text-sm" />
                      </Field>
                      <Field label="سمت نماینده">
                        <Input value={form.position} onChange={set("position")} className="h-8 text-sm" />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="نام" required>
                        <Input value={form.firstName} onChange={set("firstName")} className="h-8 text-sm" />
                      </Field>
                      <Field label="نام خانوادگی" required>
                        <Input value={form.lastName} onChange={set("lastName")} className="h-8 text-sm" />
                      </Field>
                      <Field label="نام پدر">
                        <Input value={form.fatherName} onChange={set("fatherName")} className="h-8 text-sm" />
                      </Field>
                      <Field label="تاریخ تولد">
                        <Input value={form.birthDate} onChange={set("birthDate")} className="h-8 text-sm" placeholder="۱۳۶۰/۰۱/۰۱" dir="ltr" />
                      </Field>
                      <Field label="جنسیت">
                        <StyledSelect
                          value={form.gender}
                          onChange={set("gender")}
                          options={[{ value: "male", label: "مرد" }, { value: "female", label: "زن" }]}
                        />
                      </Field>
                      <Field label="سمت / شغل">
                        <Input value={form.position} onChange={set("position")} className="h-8 text-sm" />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              {/* ── آدرس و تماس ── */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">آدرس و اطلاعات تماس</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                  <Field label="استان">
                    <Input value={form.province} onChange={set("province")} className="h-8 text-sm" />
                  </Field>
                  <Field label="شهر">
                    <Input value={form.city} onChange={set("city")} className="h-8 text-sm" />
                  </Field>
                  <Field label="کد پستی">
                    <Input value={form.postalCode} onChange={set("postalCode")} className="h-8 text-sm font-mono" dir="ltr" maxLength={10} />
                  </Field>
                  <Field label="تلفن">
                    <Input value={form.phone} onChange={set("phone")} className="h-8 text-sm font-mono" dir="ltr" />
                  </Field>
                  <Field label="آدرس کامل" col={2}>
                    <Input value={form.address} onChange={set("address")} className="h-8 text-sm" />
                  </Field>
                </div>
              </div>

              {/* ── محدودیت پرداخت ── */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">محدودیت پرداخت</p>
                <div className="flex flex-wrap items-center gap-6">
                  {[
                    { v: "none", label: "ندارد" },
                    { v: "has",  label: "دارد" },
                    { v: "exempt", label: "معاف" },
                  ].map(({ v, label }) => (
                    <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio" name="payLimit" value={v}
                        checked={form.paymentLimitationType === v}
                        onChange={set("paymentLimitationType")}
                        className="accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                  {form.paymentLimitationType === "has" && (
                    <Field label="حداکثر مبلغ پرداخت (ریال)">
                      <Input
                        value={form.maxPaymentAmount}
                        onChange={set("maxPaymentAmount")}
                        className="h-8 text-sm font-mono w-40"
                        dir="ltr"
                      />
                    </Field>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ تب اطلاعات بانکی و مالیاتی ══════════ */}
          {activeTab === "bank" && (
            <div className="space-y-5">
              {/* بانکی */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">اطلاعات بانکی</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                  <Field label="شماره شبا (IBAN)">
                    <div className="flex gap-1 items-center">
                      <span className="flex items-center rounded-lg border bg-muted px-2 py-1.5 text-xs font-mono font-bold">IR</span>
                      <Input
                        value={form.sheba}
                        onChange={set("sheba")}
                        className="h-8 text-sm font-mono"
                        dir="ltr"
                        maxLength={24}
                        placeholder="XXXXXXXXXXXXXXXXXXXXXXXXX"
                      />
                    </div>
                  </Field>
                  <Field label="نام بانک">
                    <Input value={form.bankName} onChange={set("bankName")} className="h-8 text-sm" />
                  </Field>
                  <Field label="نام شعبه">
                    <Input value={form.bankBranch} onChange={set("bankBranch")} className="h-8 text-sm" />
                  </Field>
                  <Field label="شماره حساب">
                    <Input value={form.accountNumber} onChange={set("accountNumber")} className="h-8 text-sm font-mono" dir="ltr" />
                  </Field>
                </div>
              </div>

              {/* مالیاتی */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">اطلاعات مالیاتی</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                  <Field label="تاریخ شروع ثبت‌نام مالیاتی">
                    <Input
                      value={form.taxRegStartDate}
                      onChange={set("taxRegStartDate")}
                      className="h-8 text-sm"
                      placeholder="۱۴۰۳/۰۱/۰۱"
                      dir="ltr"
                    />
                  </Field>
                  <Field label="تاریخ پایان ثبت‌نام مالیاتی">
                    <Input
                      value={form.taxRegEndDate}
                      onChange={set("taxRegEndDate")}
                      className="h-8 text-sm"
                      placeholder="۱۴۰۳/۱۲/۲۹"
                      dir="ltr"
                    />
                  </Field>
                  <Field label="مشمول ارزش افزوده">
                    <label className="flex items-center gap-2 text-sm cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={form.vatRegistered}
                        onChange={set("vatRegistered")}
                        className="rounded accent-primary"
                      />
                      بله
                    </label>
                  </Field>
                  {form.vatRegistered && (
                    <Field label="مبنای ارزش افزوده (%)">
                      <Input
                        value={form.vatBase}
                        onChange={set("vatBase")}
                        className="h-8 text-sm"
                        placeholder="۹"
                        dir="ltr"
                      />
                    </Field>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ تب عامل ذیحساب ══════════ */}
          {activeTab === "agent" && (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Save className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>ابتدا شخص را ثبت کنید، سپس اطلاعات عامل ذیحساب را تکمیل نمایید.</p>
            </div>
          )}

          {/* ══════════ تب طرف قرارداد ══════════ */}
          {activeTab === "contract" && (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Save className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>ابتدا شخص را ثبت کنید، سپس اطلاعات طرف قرارداد را تکمیل نمایید.</p>
            </div>
          )}

          {/* ── دکمه‌های عملیاتی ── */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" disabled={selected === null}>انتخاب عامل پرداخت</Button>
              <Button variant="outline" size="sm" disabled={selected === null}>انتخاب عامل روی فرم و جزء فصل</Button>
              <Button variant="outline" size="sm" disabled={selected === null}>جایگزینی اشخاص</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 ml-1" /> چاپ
              </Button>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 ml-1" /> اکسل
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={selected === null}>
                <Trash2 className="h-4 w-4 ml-1" /> حذف
              </Button>
              <Button variant="outline" size="sm" onClick={handleNew}>
                <Plus className="h-4 w-4 ml-1" /> جدید
              </Button>
              <Button size="sm" onClick={handleSave}
                disabled={isLegal ? !form.title.trim() : !form.firstName.trim()}>
                <Save className="h-4 w-4 ml-1" /> ثبت
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── جدول جستجو و لیست ─────────────────────────────────────────── */}
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس نام، کد ملی، کد اقتصادی، NomineeCode..."
                className="pr-9 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearch("")}>پاک کردن</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold whitespace-nowrap">NomineeCode (16 کاراکتر)</TableHead>
                  <TableHead className="text-xs font-bold">نوع</TableHead>
                  <TableHead className="text-xs font-bold">جزءطبقه</TableHead>
                  <TableHead className="text-xs font-bold">نام / عنوان</TableHead>
                  <TableHead className="text-xs font-bold">کد / شناسه ملی</TableHead>
                  <TableHead className="text-xs font-bold">کد اقتصادی</TableHead>
                  <TableHead className="text-xs font-bold">شماره شبا</TableHead>
                  <TableHead className="text-xs font-bold">استان</TableHead>
                  <TableHead className="text-xs font-bold">شهر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground text-sm">
                      رکوردی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleRowClick(row)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selected === row.id
                        ? "bg-primary/10 hover:bg-primary/15"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <TableCell className="font-mono text-xs tracking-wider">{row.nomineeCode}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.personKind === "A" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {row.personKind === "A" ? "حقوقی"
                          : row.personKind === "B" ? "حقیقی"
                          : row.personKind === "C" ? "حقیقی ایرانی"
                          : row.personKind === "D" ? "حقیقی خارجی"
                          : row.personKind}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.detailClass}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[200px] truncate">{row.title}</TableCell>
                    <TableCell className="font-mono text-xs">{row.nationalId || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.economicCode || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.sheba ? `IR${row.sheba}` : "—"}</TableCell>
                    <TableCell className="text-xs">{row.province || "—"}</TableCell>
                    <TableCell className="text-xs">{row.city || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
