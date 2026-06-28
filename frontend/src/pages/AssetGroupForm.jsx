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

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, code: "01", title: "اموال منقول", depreciable: true,  usefulLife: 10, depRate: 10, inactive: false },
  { id: 2, code: "02", title: "اموال غیرمنقول", depreciable: true,  usefulLife: 40, depRate: 2.5, inactive: false },
  { id: 3, code: "03", title: "تجهیزات اداری", depreciable: true,  usefulLife: 5,  depRate: 20, inactive: false },
  { id: 4, code: "04", title: "وسایط نقلیه",   depreciable: true,  usefulLife: 8,  depRate: 12.5, inactive: false },
  { id: 5, code: "05", title: "اموال مصرفی",   depreciable: false, usefulLife: "", depRate: "",  inactive: false },
];

const DEPRECIATION_METHODS = [
  { value: "straight",  label: "خط مستقیم" },
  { value: "declining", label: "نزولی مضاعف" },
  { value: "sum",       label: "مجموع سنوات" },
];

const INITIAL_FORM = {
  code: "", title: "", depreciable: true,
  depreciationMethod: "straight", usefulLife: "", depRate: "",
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

export default function AssetGroupForm() {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [list, setList]       = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState("");
  const [saved, setSaved]     = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // اگر قابل استهلاک نیست، مقادیر مرتبط پاک می‌شن
        if (field === "depreciable" && !val) {
          next.usefulLife = "";
          next.depRate = "";
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
      code: row.code ?? "",
      title: row.title ?? "",
      depreciable: row.depreciable ?? true,
      depreciationMethod: row.depreciationMethod ?? "straight",
      usefulLife: row.usefulLife ?? "",
      depRate: row.depRate ?? "",
      description: row.description ?? "",
      inactive: row.inactive ?? false,
    });
    setSaved(false);
  }

  const filtered = list.filter(
    (r) =>
      !search ||
      r.code?.includes(search) ||
      r.title?.includes(search)
  );

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">اطلاعات پایه</span>
        <span>/</span>
        <span>تعریف گروه اموال</span>
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
            disabled={selected === null} className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />حذف
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">تعریف گروه اموال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">گروه‌بندی اصلی اموال و دارایی‌های سازمان</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            {/* کد گروه */}
            <Field label="کد گروه" required>
              <Input
                value={form.code}
                onChange={set("code")}
                className="h-9 text-sm font-mono"
                dir="ltr"
                maxLength={5}
                placeholder="مثال: 01"
              />
            </Field>

            {/* عنوان گروه */}
            <Field label="عنوان گروه" required col={2}>
              <Input
                value={form.title}
                onChange={set("title")}
                className="h-9 text-sm"
                placeholder="عنوان گروه اموال را وارد کنید"
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

            {/* قابل استهلاک */}
            <Field label="قابل استهلاک">
              <div className="flex items-center gap-4 pt-1.5">
                {[{ v: true, l: "بله" }, { v: false, l: "خیر" }].map(({ v, l }) => (
                  <label key={l} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="depreciable"
                      value={v}
                      checked={form.depreciable === v}
                      onChange={() => setForm((f) => ({
                        ...f, depreciable: v,
                        usefulLife: v ? f.usefulLife : "",
                        depRate: v ? f.depRate : "",
                      }))}
                      className="accent-blue-600"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </Field>

            {/* روش استهلاک */}
            <Field label="روش استهلاک">
              <select
                value={form.depreciationMethod}
                onChange={set("depreciationMethod")}
                disabled={!form.depreciable}
                className={cn(
                  "rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-full",
                  "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {DEPRECIATION_METHODS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* عمر مفید */}
            <Field label="عمر مفید (سال)">
              <Input
                value={form.usefulLife}
                onChange={set("usefulLife")}
                disabled={!form.depreciable}
                className="h-9 text-sm font-mono"
                dir="ltr"
                placeholder="مثال: 10"
                type="number"
                min="1"
              />
            </Field>

            {/* نرخ استهلاک */}
            <Field label="نرخ استهلاک (%)">
              <Input
                value={form.depRate}
                onChange={set("depRate")}
                disabled={!form.depreciable}
                className="h-9 text-sm font-mono"
                dir="ltr"
                placeholder="مثال: 10"
                type="number"
                min="0"
                max="100"
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
                placeholder="جستجو بر اساس کد یا عنوان..."
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
                  <TableHead className="text-xs font-bold text-right">عنوان گروه</TableHead>
                  <TableHead className="text-xs font-bold text-right">روش استهلاک</TableHead>
                  <TableHead className="text-xs font-bold text-right">عمر مفید</TableHead>
                  <TableHead className="text-xs font-bold text-right">نرخ استهلاک</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
                  <TableHead className="text-xs font-bold text-right w-12"></TableHead>
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
                      <TableCell className="text-sm">
                        {row.depreciable
                          ? (DEPRECIATION_METHODS.find(m => m.value === row.depreciationMethod)?.label ?? "خط مستقیم")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.usefulLife ? `${row.usefulLife} سال` : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {row.depRate ? `${row.depRate}%` : "—"}
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
