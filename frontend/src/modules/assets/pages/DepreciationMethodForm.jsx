import { useState } from "react";
import { Plus, Trash2, Save, Search, Pencil, Info } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── نوع محاسبه ──────────────────────────────────────────────────────────────
const CALC_TYPES = [
  { value: "straight",   label: "خط مستقیم",         desc: "مبلغ ثابت سالانه = (ارزش اولیه - ارزش اسقاط) ÷ عمر مفید" },
  { value: "declining",  label: "نزولی مضاعف",        desc: "نرخ ثابت × ارزش دفتری مانده — استهلاک سال اول بیشتر است" },
  { value: "sum_years",  label: "مجموع سنوات",        desc: "نسبت سال‌های مانده به مجموع اعداد سنوات عمر مفید" },
  { value: "unit",       label: "بر اساس واحد تولید", desc: "استهلاک بر اساس تعداد واحد تولید یا ساعت کارکرد" },
  { value: "custom",     label: "نرخ دستی (سفارشی)",  desc: "نرخ درصد سالانه به‌صورت دستی توسط کاربر تعیین می‌شود" },
];

const CALC_COLORS = {
  straight:  "bg-blue-100 text-blue-700",
  declining: "bg-amber-100 text-amber-700",
  sum_years: "bg-violet-100 text-violet-700",
  unit:      "bg-emerald-100 text-emerald-700",
  custom:    "bg-slate-100 text-slate-600",
};

// ─── نمونه داده ──────────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, code: "D01", title: "خط مستقیم استاندارد",  calcType: "straight",  rate: 10,   salvageRate: 10, minYears: "", maxYears: "", applyMonthly: true,  inactive: false },
  { id: 2, code: "D02", title: "نزولی مضاعف ۲۰٪",      calcType: "declining", rate: 20,   salvageRate: 5,  minYears: "", maxYears: "", applyMonthly: true,  inactive: false },
  { id: 3, code: "D03", title: "مجموع سنوات ۵ ساله",   calcType: "sum_years", rate: "",   salvageRate: 10, minYears: 3,  maxYears: 7,  applyMonthly: false, inactive: false },
  { id: 4, code: "D04", title: "بر اساس ساعت کارکرد",  calcType: "unit",      rate: "",   salvageRate: 0,  minYears: "", maxYears: "", applyMonthly: false, inactive: false },
];

const INITIAL_FORM = {
  code: "", title: "",
  calcType: "straight",
  rate: "",          // نرخ درصد سالانه
  salvageRate: "",   // درصد ارزش اسقاط از قیمت اولیه
  minYears: "",      // حداقل عمر مفید
  maxYears: "",      // حداکثر عمر مفید
  applyMonthly: false, // محاسبه ماهانه (در غیر اینصورت سالانه)
  description: "", inactive: false,
};

function Field({ label, required, children, col }) {
  return (
    <div className={cn("flex flex-col gap-1.5", col === 2 && "col-span-2")}>
      <Label className="text-sm font-medium text-right">
        {label}{required && <span className="text-blue-600 mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function DepreciationMethodForm() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [saved, setSaved]       = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: val }));
      setSaved(false);
    };
  }

  function handleNew() {
    setForm(INITIAL_FORM);
    setSelected(null);
    setSaved(false);
  }

  function handleSave() {
    if (!form.code.trim() || !form.title.trim()) return;
    const record = { id: selected ?? Date.now(), ...form };
    if (selected !== null) {
      setList((l) => l.map((r) => (r.id === selected ? record : r)));
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
    setForm({
      code:         row.code         ?? "",
      title:        row.title        ?? "",
      calcType:     row.calcType     ?? "straight",
      rate:         row.rate         ?? "",
      salvageRate:  row.salvageRate  ?? "",
      minYears:     row.minYears     ?? "",
      maxYears:     row.maxYears     ?? "",
      applyMonthly: row.applyMonthly ?? false,
      description:  row.description  ?? "",
      inactive:     row.inactive     ?? false,
    });
    setSaved(false);
  }

  const filtered = list.filter(
    (r) => !search || r.code?.includes(search) || r.title?.includes(search)
  );

  const currentCalc = CALC_TYPES.find((c) => c.value === form.calcType);
  const showRate = ["straight", "declining", "custom"].includes(form.calcType);

  // محاسبه نمونه استهلاک سال اول (برای نمایش راهنما)
  function calcExample() {
    const base = 100_000_000; // ۱۰۰ میلیون ریال
    const rate = parseFloat(form.rate) || 0;
    const salvage = parseFloat(form.salvageRate) || 0;
    if (form.calcType === "straight" && rate > 0) {
      const annual = ((base - base * salvage / 100) * rate / 100);
      return `استهلاک سال اول: ${annual.toLocaleString("fa-IR")} ریال (از ۱۰۰,۰۰۰,۰۰۰ ریال)`;
    }
    if (form.calcType === "declining" && rate > 0) {
      const annual = base * rate / 100;
      return `استهلاک سال اول: ${annual.toLocaleString("fa-IR")} ریال (از ۱۰۰,۰۰۰,۰۰۰ ریال)`;
    }
    return null;
  }
  const example = calcExample();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">اطلاعات پایه</span>
        <span>/</span>
        <span>روش‌های استهلاک</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave}
            disabled={!form.code.trim() || !form.title.trim()}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ثبت
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}
            disabled={selected === null}
            className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />حذف
          </Button>
          {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">روش‌های استهلاک</h1>
          <p className="text-xs text-muted-foreground mt-0.5">روش‌های محاسبه استهلاک اموال را تعریف کنید</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">

          {/* ─ ردیف اول: کد، عنوان، وضعیت ─ */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            <Field label="کد روش" required>
              <Input value={form.code} onChange={set("code")}
                className="h-9 text-sm font-mono" dir="ltr" maxLength={6} placeholder="D01" />
            </Field>

            <Field label="عنوان روش" required col={2}>
              <Input value={form.title} onChange={set("title")}
                className="h-9 text-sm" placeholder="نام روش استهلاک را وارد کنید" />
            </Field>

            <Field label="وضعیت">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input type="checkbox" checked={form.inactive} onChange={set("inactive")}
                  className="rounded accent-destructive" />
                <span className={cn("font-medium", form.inactive && "text-destructive")}>غیرفعال</span>
              </label>
            </Field>

          </div>

          {/* ─ نوع محاسبه ─ */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4" dir="rtl">
            <p className="text-xs font-bold text-primary mb-3">نوع محاسبه استهلاک</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {CALC_TYPES.map(({ value, label, desc }) => (
                <label key={value}
                  className={cn(
                    "flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    form.calcType === value
                      ? "border-blue-400 bg-blue-50/60"
                      : "border-input hover:border-muted-foreground"
                  )}>
                  <input type="radio" name="calcType" value={value}
                    checked={form.calcType === value} onChange={set("calcType")} className="sr-only" />
                  <span className={cn("text-sm font-semibold",
                    form.calcType === value ? "text-blue-700" : "text-foreground")}>
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ─ پارامترها ─ */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            {/* نرخ استهلاک */}
            {showRate && (
              <Field label="نرخ استهلاک سالانه (%)" required={form.calcType === "custom"}>
                <Input value={form.rate} onChange={set("rate")}
                  className="h-9 text-sm font-mono" dir="ltr" type="number" min={0} max={100}
                  placeholder="مثال: 10" />
              </Field>
            )}

            {/* ارزش اسقاط */}
            {form.calcType !== "unit" && (
              <Field label="ارزش اسقاط (% از قیمت اولیه)">
                <Input value={form.salvageRate} onChange={set("salvageRate")}
                  className="h-9 text-sm font-mono" dir="ltr" type="number" min={0} max={50}
                  placeholder="مثال: 10" />
              </Field>
            )}

            {/* حداقل عمر مفید */}
            <Field label="حداقل عمر مفید (سال)">
              <Input value={form.minYears} onChange={set("minYears")}
                className="h-9 text-sm font-mono" dir="ltr" type="number" min={1}
                placeholder="مثال: 3" />
            </Field>

            {/* حداکثر عمر مفید */}
            <Field label="حداکثر عمر مفید (سال)">
              <Input value={form.maxYears} onChange={set("maxYears")}
                className="h-9 text-sm font-mono" dir="ltr" type="number" min={1}
                placeholder="مثال: 20" />
            </Field>

            {/* محاسبه ماهانه */}
            <Field label="دوره محاسبه">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input type="checkbox" checked={form.applyMonthly} onChange={set("applyMonthly")}
                  className="rounded accent-blue-600" />
                <span className={cn("font-medium", form.applyMonthly && "text-blue-600")}>
                  محاسبه ماهانه (در غیراینصورت سالانه)
                </span>
              </label>
            </Field>

            {/* توضیحات */}
            <Field label="توضیحات" col={2}>
              <Input value={form.description} onChange={set("description")}
                className="h-9 text-sm" placeholder="توضیحات تکمیلی (اختیاری)" />
            </Field>

          </div>

          {/* ─ نمونه محاسبه ─ */}
          {example && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3" dir="rtl">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">{example}</p>
            </div>
          )}

        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو بر اساس کد یا عنوان..."
                className="pr-9 h-8 text-sm" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right w-16">کد</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان</TableHead>
                  <TableHead className="text-xs font-bold text-right">نوع محاسبه</TableHead>
                  <TableHead className="text-xs font-bold text-right w-20">نرخ (%)</TableHead>
                  <TableHead className="text-xs font-bold text-right w-20">اسقاط (%)</TableHead>
                  <TableHead className="text-xs font-bold text-right">دوره</TableHead>
                  <TableHead className="text-xs font-bold text-right w-20">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                      رکوردی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : filtered.map((row) => (
                  <TableRow key={row.id} onClick={() => handleRowClick(row)}
                    className={cn("cursor-pointer transition-colors",
                      selected === row.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                    <TableCell className="font-mono text-sm font-bold">{row.code}</TableCell>
                    <TableCell className="text-sm font-medium">{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary"
                        className={cn("text-xs", CALC_COLORS[row.calcType] ?? "bg-slate-100 text-slate-600")}>
                        {CALC_TYPES.find((c) => c.value === row.calcType)?.label ?? row.calcType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.rate !== "" && row.rate != null ? `${row.rate}%` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {row.salvageRate !== "" && row.salvageRate != null ? `${row.salvageRate}%` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.applyMonthly
                        ? <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700">ماهانه</Badge>
                        : <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">سالانه</Badge>}
                    </TableCell>
                    <TableCell>
                      {row.inactive
                        ? <Badge variant="destructive" className="text-xs">غیرفعال</Badge>
                        : <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">فعال</Badge>}
                    </TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
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
