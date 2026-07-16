import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, ChevronDown, ChevronLeft, Building2, Layers, DoorOpen } from "lucide-react";
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

// ─── سطوح مکان ───────────────────────────────────────────────────────────────
const LEVELS = [
  { value: "building", label: "ساختمان", icon: Building2, color: "text-blue-600",   bg: "bg-blue-50   border-blue-200" },
  { value: "floor",    label: "طبقه",    icon: Layers,    color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  { value: "room",     label: "اتاق",    icon: DoorOpen,  color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200" },
];

const INITIAL_FORM = {
  level: "building", parentId: "", code: "", title: "", address: "", inactive: false,
};

// ─── کمکی: عنوان رکورد بر اساس id ───────────────────────────────────────────
function getTitle(list, id) {
  return list.find((r) => (r._id === id || r.id === id))?.title ?? "";
}

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

function StyledSelect({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      value={value} onChange={onChange} disabled={disabled}
      className={cn(
        "rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-full",
        "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── نمایش درختی ─────────────────────────────────────────────────────────────
function TreeRow({ row, list, depth, selected, onSelect }) {
  const [open, setOpen] = useState(true);
  const children = list.filter((r) => r.parentId === (row._id || row.id));
  const levelInfo = LEVELS.find((l) => l.value === row.level);
  const Icon = levelInfo?.icon ?? Building2;

  return (
    <>
      <TableRow
        onClick={() => onSelect(row)}
        className={cn(
          "cursor-pointer transition-colors",
          selected === (row._id || row.id) ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40"
        )}
      >
        {/* عنوان با تورفتگی */}
        <TableCell>
          <div className="flex items-center gap-1" style={{ paddingRight: `${depth * 20}px` }}>
            {children.length > 0 ? (
              <button
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className="p-0.5 rounded hover:bg-muted shrink-0"
              >
                {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <Icon className={cn("h-4 w-4 shrink-0", levelInfo?.color)} />
            <span className="text-sm font-medium mr-1">{row.title}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
        <TableCell>
          <Badge variant="secondary" className={cn("text-xs border", levelInfo?.bg, levelInfo?.color)}>
            {levelInfo?.label}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
          {row.address || "—"}
        </TableCell>
        <TableCell>
          {row.inactive
            ? <Badge variant="destructive" className="text-xs">غیرفعال</Badge>
            : <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">فعال</Badge>
          }
        </TableCell>
        <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
      </TableRow>

      {open && children.map((child) => (
        <TreeRow key={child._id || child.id} row={child} list={list} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default function AssetLocationForm() {
  const { locations, addConfig, updateConfig, deleteConfig } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [saved, setSaved]       = useState(false);

  const list = locations || [];

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // وقتی سطح عوض شد، والد پاک می‌شه
        if (field === "level") next.parentId = "";
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
    // ساختمان نیاز به والد ندارد؛ بقیه باید والد داشته باشند
    if (form.level !== "building" && !form.parentId) return;
    const record = {
      ...form,
      parentId: form.parentId ? form.parentId : null,
    };
    if (selected !== null) {
      await updateConfig("locations", { ...record, _id: selected, id: selected });
    } else {
      await addConfig("locations", record);
    }
    setSaved(true);
    handleNew();
  }

  async function handleDelete() {
    if (selected === null) return;
    // حذف خود رکورد + همه فرزندان بازگشتی
    function collectIds(id) {
      const ids = [id];
      list.filter((r) => r.parentId === id).forEach((c) => ids.push(...collectIds(c._id || c.id)));
      return ids;
    }
    const toDelete = collectIds(selected);
    await Promise.all(toDelete.map((id) => deleteConfig("locations", id)));
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
    setForm({
      level:    row.level    ?? "building",
      parentId: row.parentId != null ? String(row.parentId) : "",
      code:     row.code     ?? "",
      title:    row.title    ?? "",
      address:  row.address  ?? "",
      inactive: row.inactive ?? false,
    });
    setSaved(false);
  }

  // گزینه‌های والد بر اساس سطح انتخابی
  const parentOptions = useMemo(() => {
    if (form.level === "building") return [];
    const parentLevel = form.level === "floor" ? "building" : "floor";
    return list
      .filter((r) => r.level === parentLevel && !r.inactive)
      .map((r) => ({ value: String(r._id || r.id), label: `${r.code} — ${r.title}` }));
  }, [form.level, list]);

  // رکوردهای ریشه برای نمایش درختی (فیلتر جستجو روی مسطح اعمال می‌شه)
  const roots = list.filter((r) => r.parentId === null);
  const flatFiltered = list.filter(
    (r) => search && (r.title?.includes(search) || r.code?.includes(search))
  );

  const canSave = form.code.trim() && form.title.trim() &&
    (form.level === "building" || form.parentId);

  const currentLevel = LEVELS.find((l) => l.value === form.level);

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">اطلاعات پایه</span>
        <span>/</span>
        <span>تعریف مکان‌ها</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave}
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
          <h1 className="text-xl font-bold">تعریف مکان‌ها (ساختمان / طبقه / اتاق)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">دسته‌بندی درختی مکان‌های استقرار اموال و تجهیزات</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="سطح مکان" required>
              <StyledSelect
                value={form.level}
                onChange={set("level")}
                options={LEVELS}
              />
            </Field>

            {form.level !== "building" && (
              <Field label={`انتخاب ${form.level === "floor" ? "ساختمان" : "طبقه"} والد`} required>
                <StyledSelect
                  value={form.parentId}
                  onChange={set("parentId")}
                  options={parentOptions}
                  placeholder="انتخاب والد..."
                />
              </Field>
            )}

            <Field label={`کد ${currentLevel?.label || ""}`} required>
              <Input value={form.code} onChange={set("code")} className="h-9 text-sm font-mono text-left" placeholder="مثال: B01-F1-R02" />
            </Field>

            <Field label={`عنوان ${currentLevel?.label || ""}`} required col={form.level === "building" ? 2 : 1}>
              <Input value={form.title} onChange={set("title")} className="h-9 text-sm" placeholder="مثال: اتاق حسابداری" />
            </Field>

            {form.level === "building" && (
              <Field label="آدرس ساختمان" col={2}>
                <Input value={form.address} onChange={set("address")} className="h-9 text-sm" placeholder="مثال: بلوار دانشگاه، ساختمان اداری" />
              </Field>
            )}

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

      {/* نمایش درختی یا لیست جستجو */}
      <Card dir="rtl">
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو در کل مکان‌ها..." className="pr-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {search && <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک کردن</Button>}
            <span className="text-xs text-muted-foreground mr-auto">{list.length} مکان تعریف‌شده</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right">عنوان مکان</TableHead>
                  <TableHead className="text-xs font-bold text-right w-36">کد مکان</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">سطح</TableHead>
                  <TableHead className="text-xs font-bold text-right">آدرس / والد</TableHead>
                  <TableHead className="text-xs font-bold text-right w-24">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {search ? (
                  // اگر جستجو فعال باشد لیست مسطح فیلتر شده را نشان می‌دهیم
                  flatFiltered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">موردی یافت نشد</TableCell></TableRow>
                  ) : flatFiltered.map((row) => {
                    const parentTitle = row.parentId ? getTitle(list, row.parentId) : "—";
                    const levelInfo = LEVELS.find((l) => l.value === row.level);
                    return (
                      <TableRow key={row._id || row.id} onClick={() => handleRowClick(row)}
                        className={cn("cursor-pointer transition-colors",
                          selected === (row._id || row.id) ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                        <TableCell className="text-sm font-semibold">{row.title}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("text-xs border", levelInfo?.bg, levelInfo?.color)}>
                            {levelInfo?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.level === "building" ? (row.address || "—") : `والد: ${parentTitle}`}
                        </TableCell>
                        <TableCell>
                          {row.inactive ? <Badge variant="destructive" className="text-xs">غیرفعال</Badge> : <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">فعال</Badge>}
                        </TableCell>
                        <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  // در حالت عادی ساختار درختی را از ریشه رندر می‌کنیم
                  roots.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">مکانی تعریف نشده است</TableCell></TableRow>
                  ) : roots.map((root) => (
                    <TreeRow key={root._id || root.id} row={root} list={list} depth={0} selected={selected} onSelect={handleRowClick} />
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
