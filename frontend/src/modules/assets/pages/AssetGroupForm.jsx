import { useState, useMemo } from "react";
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
import { useAssets } from "@/context/AssetContext";

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
  const { groups, addConfig, updateConfig, deleteConfig } = useAssets();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState("");
  const [saved, setSaved]     = useState(false);

  const list = groups || [];

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

  async function handleSave() {
    if (!form.code.trim() || !form.title.trim()) return;
    const record = { ...form };
    if (selected !== null) {
      await updateConfig("groups", { ...record, _id: selected, id: selected });
    } else {
      await addConfig("groups", record);
    }
    setSaved(true);
    handleNew();
  }

  async function handleDelete() {
    if (selected === null) return;
    await deleteConfig("groups", selected);
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
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
    (r) => !search ||
      r.code?.includes(search) ||
      r.title?.includes(search)
  );

  const canSave = form.code.trim() && form.title.trim();

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
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ذخیره
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
          <h1 className="text-xl font-bold">تعریف گروه اموال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">دسته‌بندی کلی دارایی‌ها و نرخ‌های استهلاک قانونی</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="کد گروه" required>
              <Input value={form.code} onChange={set("code")} className="h-9 text-sm font-mono text-left" placeholder="مثال: ۰۳" />
            </Field>

            <Field label="عنوان گروه" required col={2}>
              <Input value={form.title} onChange={set("title")} className="h-9 text-sm" placeholder="مثال: تجهیزات اداری" />
            </Field>

            <Field label="قابل استهلاک">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input type="checkbox" checked={form.depreciable} onChange={set("depreciable")}
                  className="rounded accent-blue-600 h-4 w-4" />
                <span className={cn("font-medium", form.depreciable && "text-blue-600")}>دارد</span>
              </label>
            </Field>

            {form.depreciable && (
              <>
                <Field label="روش استهلاک" required>
                  <select value={form.depreciationMethod} onChange={set("depreciationMethod")} className="h-9 rounded-md border bg-background px-3 py-1 text-sm">
                    {DEPRECIATION_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="عمر مفید (سال)" required>
                  <Input type="number" value={form.usefulLife} onChange={set("usefulLife")} className="h-9 text-sm font-mono" placeholder="۱۰" />
                </Field>

                <Field label="نرخ استهلاک (%)" required>
                  <Input type="number" step="0.01" value={form.depRate} onChange={set("depRate")} className="h-9 text-sm font-mono" placeholder="۱۰" />
                </Field>
              </>
            )}

            <Field label="توضیحات" col={2}>
              <Input value={form.description} onChange={set("description")} className="h-9 text-sm" placeholder="توضیحات اختیاری..." />
            </Field>

            <Field label="وضعیت">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input type="checkbox" checked={form.inactive} onChange={set("inactive")}
                  className="rounded accent-red-600 h-4 w-4" />
                <span className={cn("font-medium", form.inactive && "text-red-600")}>غیرفعال</span>
              </label>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو..." className="pr-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک کردن</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right w-24">کد گروه</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان گروه</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">استهلاک‌پذیر</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">عمر مفید (سال)</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">نرخ (%)</TableHead>
                  <TableHead className="text-xs font-bold text-right w-24">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-sm">رکوردی یافت نشد</TableCell>
                  </TableRow>
                ) : filtered.map((row) => (
                  <TableRow key={row._id || row.id} onClick={() => handleRowClick(row)}
                    className={cn("cursor-pointer transition-colors",
                      selected === (row._id || row.id) ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="text-sm font-medium">{row.title}</TableCell>
                    <TableCell className="text-xs">{row.depreciable ? "بله" : "خیر"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.usefulLife || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{row.depRate || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={row.inactive ? "destructive" : "success"} className="text-xs">
                        {row.inactive ? "غیرفعال" : "فعال"}
                      </Badge>
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
