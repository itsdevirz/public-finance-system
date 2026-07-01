import { useState } from "react";
import { Plus, Trash2, Save, Search, Pencil } from "lucide-react";
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

// ─── دسته‌بندی واحدها ────────────────────────────────────────────────────────
const UNIT_CATEGORIES = [
  { value: "count",   label: "تعداد / شمارشی" },
  { value: "weight",  label: "وزن" },
  { value: "length",  label: "طول / مساحت / حجم" },
  { value: "time",    label: "زمان" },
  { value: "other",   label: "سایر" },
];

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, code: "01", title: "عدد",      symbol: "عدد", category: "count",  description: "",                inactive: false },
  { id: 2, code: "02", title: "دستگاه",   symbol: "دستگاه", category: "count",  description: "",             inactive: false },
  { id: 3, code: "03", title: "کیلوگرم",  symbol: "kg",  category: "weight", description: "",                inactive: false },
  { id: 4, code: "04", title: "تن",       symbol: "ton", category: "weight", description: "معادل ۱۰۰۰ کیلوگرم", inactive: false },
  { id: 5, code: "05", title: "متر",      symbol: "m",   category: "length", description: "",                inactive: false },
  { id: 6, code: "06", title: "متر مربع", symbol: "m²",  category: "length", description: "",                inactive: false },
  { id: 7, code: "07", title: "متر مکعب", symbol: "m³",  category: "length", description: "",                inactive: false },
  { id: 8, code: "08", title: "لیتر",     symbol: "L",   category: "length", description: "",                inactive: false },
  { id: 9, code: "09", title: "جفت",      symbol: "جفت", category: "count",  description: "",                inactive: false },
  { id:10, code: "10", title: "بسته",     symbol: "بسته",category: "count",  description: "",                inactive: false },
];

const INITIAL_FORM = {
  code: "", title: "", symbol: "",
  category: "count",
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

function StyledSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

const CATEGORY_COLORS = {
  count:  "bg-blue-100 text-blue-700",
  weight: "bg-amber-100 text-amber-700",
  length: "bg-emerald-100 text-emerald-700",
  time:   "bg-violet-100 text-violet-700",
  other:  "bg-slate-100 text-slate-600",
};

export default function AssetUnitForm() {
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
      code:        row.code        ?? "",
      title:       row.title       ?? "",
      symbol:      row.symbol      ?? "",
      category:    row.category    ?? "count",
      description: row.description ?? "",
      inactive:    row.inactive    ?? false,
    });
    setSaved(false);
  }

  const filtered = list.filter(
    (r) =>
      !search ||
      r.code?.includes(search) ||
      r.title?.includes(search) ||
      r.symbol?.includes(search)
  );

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">اطلاعات پایه</span>
        <span>/</span>
        <span>تعریف واحد اندازه‌گیری</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button
            size="sm" onClick={handleSave}
            disabled={!form.code.trim() || !form.title.trim()}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />ثبت
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button
            variant="outline" size="sm" onClick={handleDelete}
            disabled={selected === null}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />حذف
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">تعریف واحد اندازه‌گیری</h1>
          <p className="text-xs text-muted-foreground mt-0.5">واحدهای اندازه‌گیری اموال و کالاها را تعریف کنید</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            {/* کد */}
            <Field label="کد واحد" required>
              <Input
                value={form.code}
                onChange={set("code")}
                className="h-9 text-sm font-mono"
                dir="ltr"
                maxLength={4}
                placeholder="مثال: 01"
              />
            </Field>

            {/* عنوان */}
            <Field label="عنوان واحد" required>
              <Input
                value={form.title}
                onChange={set("title")}
                className="h-9 text-sm"
                placeholder="مثال: کیلوگرم"
              />
            </Field>

            {/* نماد / اختصار */}
            <Field label="نماد / اختصار">
              <Input
                value={form.symbol}
                onChange={set("symbol")}
                className="h-9 text-sm font-mono"
                dir="ltr"
                maxLength={6}
                placeholder="مثال: kg"
              />
            </Field>

            {/* دسته‌بندی */}
            <Field label="دسته‌بندی">
              <StyledSelect
                value={form.category}
                onChange={set("category")}
                options={UNIT_CATEGORIES}
              />
            </Field>

            {/* توضیحات */}
            <Field label="توضیحات" col={2}>
              <Input
                value={form.description}
                onChange={set("description")}
                className="h-9 text-sm"
                placeholder="توضیحات اضافی (اختیاری)"
              />
            </Field>

            {/* غیرفعال */}
            <Field label="وضعیت">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input
                  type="checkbox"
                  checked={form.inactive}
                  onChange={set("inactive")}
                  className="rounded accent-destructive"
                />
                <span className={cn("font-medium", form.inactive && "text-destructive")}>
                  غیرفعال
                </span>
              </label>
            </Field>

          </div>
        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس کد، عنوان یا نماد..."
                className="pr-9 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                  <TableHead className="text-xs font-bold text-right w-20">نماد</TableHead>
                  <TableHead className="text-xs font-bold text-right">دسته‌بندی</TableHead>
                  <TableHead className="text-xs font-bold text-right">توضیحات</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                      رکوردی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
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
                      <TableCell className="font-mono text-sm font-bold">{row.code}</TableCell>
                      <TableCell className="text-sm font-medium">{row.title}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.symbol || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", CATEGORY_COLORS[row.category] ?? CATEGORY_COLORS.other)}
                        >
                          {UNIT_CATEGORIES.find((c) => c.value === row.category)?.label ?? row.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {row.description || "—"}
                      </TableCell>
                      <TableCell>
                        {row.inactive ? (
                          <Badge variant="destructive" className="text-xs">غیرفعال</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">فعال</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
