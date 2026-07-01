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

// ─── سطوح مکان ───────────────────────────────────────────────────────────────
const LEVELS = [
  { value: "building", label: "ساختمان", icon: Building2, color: "text-blue-600",   bg: "bg-blue-50   border-blue-200" },
  { value: "floor",    label: "طبقه",    icon: Layers,    color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
  { value: "room",     label: "اتاق",    icon: DoorOpen,  color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200" },
];

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, level: "building", parentId: null, code: "B01", title: "ساختمان مرکزی",    address: "تهران، خیابان ولیعصر", inactive: false },
  { id: 2, level: "building", parentId: null, code: "B02", title: "ساختمان اداری شماره ۲", address: "", inactive: false },
  { id: 3, level: "floor",    parentId: 1,    code: "B01-F0", title: "همکف",           address: "", inactive: false },
  { id: 4, level: "floor",    parentId: 1,    code: "B01-F1", title: "طبقه اول",       address: "", inactive: false },
  { id: 5, level: "floor",    parentId: 1,    code: "B01-F2", title: "طبقه دوم",       address: "", inactive: false },
  { id: 6, level: "floor",    parentId: 2,    code: "B02-F1", title: "طبقه اول",       address: "", inactive: false },
  { id: 7, level: "room",     parentId: 3,    code: "B01-F0-R01", title: "اتاق مدیریت",     address: "", inactive: false },
  { id: 8, level: "room",     parentId: 3,    code: "B01-F0-R02", title: "دفتر حسابداری",   address: "", inactive: false },
  { id: 9, level: "room",     parentId: 4,    code: "B01-F1-R01", title: "اتاق کنفرانس",    address: "", inactive: false },
  { id:10, level: "room",     parentId: 4,    code: "B01-F1-R02", title: "بایگانی",          address: "", inactive: false },
];

const INITIAL_FORM = {
  level: "building", parentId: "", code: "", title: "", address: "", inactive: false,
};

// ─── کمکی: عنوان رکورد بر اساس id ───────────────────────────────────────────
function getTitle(list, id) {
  return list.find((r) => r.id === id)?.title ?? "";
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
  const children = list.filter((r) => r.parentId === row.id);
  const levelInfo = LEVELS.find((l) => l.value === row.level);
  const Icon = levelInfo?.icon ?? Building2;

  return (
    <>
      <TableRow
        onClick={() => onSelect(row)}
        className={cn(
          "cursor-pointer transition-colors",
          selected === row.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40"
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
        <TreeRow key={child.id} row={child} list={list} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default function AssetLocationForm() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [saved, setSaved]       = useState(false);

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

  function handleSave() {
    if (!form.code.trim() || !form.title.trim()) return;
    // ساختمان نیاز به والد ندارد؛ بقیه باید والد داشته باشند
    if (form.level !== "building" && !form.parentId) return;
    const record = {
      id: selected ?? Date.now(),
      ...form,
      parentId: form.parentId ? Number(form.parentId) : null,
    };
    if (selected !== null) {
      setList((l) => l.map((r) => (r.id === selected ? record : r)));
    } else {
      setList((l) => [...l, record]);
    }
    setSaved(true);
  }

  function handleDelete() {
    if (selected === null) return;
    // حذف خود رکورد + همه فرزندان بازگشتی
    function collectIds(id) {
      const ids = [id];
      list.filter((r) => r.parentId === id).forEach((c) => ids.push(...collectIds(c.id)));
      return ids;
    }
    const toDelete = collectIds(selected);
    setList((l) => l.filter((r) => !toDelete.includes(r.id)));
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row.id);
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
      .map((r) => ({ value: String(r.id), label: `${r.code} — ${r.title}` }));
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
          <p className="text-xs text-muted-foreground mt-0.5">ساختار سلسله‌مراتبی محل استقرار اموال</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            {/* سطح */}
            <Field label="سطح مکان" required>
              <div className="flex gap-2">
                {LEVELS.map(({ value, label, icon: Icon, color }) => (
                  <label key={value}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border-2 cursor-pointer transition-all text-xs font-medium",
                      form.level === value
                        ? `border-current ${color} bg-muted/40`
                        : "border-input text-muted-foreground hover:border-muted-foreground"
                    )}
                  >
                    <input type="radio" name="level" value={value}
                      checked={form.level === value} onChange={set("level")} className="sr-only" />
                    <Icon className={cn("h-4 w-4", form.level === value ? color : "text-muted-foreground")} />
                    {label}
                  </label>
                ))}
              </div>
            </Field>

            {/* والد (طبقه نیاز به ساختمان دارد؛ اتاق نیاز به طبقه) */}
            {form.level !== "building" && (
              <Field label={form.level === "floor" ? "ساختمان والد" : "طبقه والد"} required>
                <StyledSelect
                  value={form.parentId}
                  onChange={set("parentId")}
                  options={parentOptions}
                  placeholder={form.level === "floor" ? "انتخاب ساختمان" : "انتخاب طبقه"}
                />
              </Field>
            )}

            {/* کد */}
            <Field label="کد مکان" required>
              <Input value={form.code} onChange={set("code")}
                className="h-9 text-sm font-mono" dir="ltr"
                maxLength={12} placeholder="مثال: B01-F1-R02" />
            </Field>

            {/* عنوان */}
            <Field label={`عنوان ${currentLevel?.label ?? "مکان"}`} required col={2}>
              <Input value={form.title} onChange={set("title")}
                className="h-9 text-sm"
                placeholder={`عنوان ${currentLevel?.label ?? "مکان"} را وارد کنید`} />
            </Field>

            {/* آدرس (فقط برای ساختمان) */}
            {form.level === "building" && (
              <Field label="آدرس" col={2}>
                <Input value={form.address} onChange={set("address")}
                  className="h-9 text-sm" placeholder="آدرس کامل ساختمان" />
              </Field>
            )}

            {/* غیرفعال */}
            <Field label="وضعیت">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input type="checkbox" checked={form.inactive} onChange={set("inactive")}
                  className="rounded accent-destructive" />
                <span className={cn("font-medium", form.inactive && "text-destructive")}>غیرفعال</span>
              </label>
            </Field>

          </div>
        </CardContent>
      </Card>

      {/* جدول درختی */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو..." className="pr-9 h-8 text-sm"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک</Button>
            <span className="text-xs text-muted-foreground mr-auto">{list.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right">عنوان</TableHead>
                  <TableHead className="text-xs font-bold text-right w-32">کد</TableHead>
                  <TableHead className="text-xs font-bold text-right w-24">سطح</TableHead>
                  <TableHead className="text-xs font-bold text-right">آدرس</TableHead>
                  <TableHead className="text-xs font-bold text-right w-20">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {search ? (
                  // حالت جستجو: نمایش مسطح
                  flatFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                        رکوردی یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : flatFiltered.map((row) => {
                    const lv = LEVELS.find((l) => l.value === row.level);
                    const Icon = lv?.icon ?? Building2;
                    return (
                      <TableRow key={row.id} onClick={() => handleRowClick(row)}
                        className={cn("cursor-pointer transition-colors",
                          selected === row.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-4 w-4 shrink-0", lv?.color)} />
                            <span className="text-sm font-medium">{row.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("text-xs border", lv?.bg, lv?.color)}>
                            {lv?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.address || "—"}</TableCell>
                        <TableCell>
                          {row.inactive
                            ? <Badge variant="destructive" className="text-xs">غیرفعال</Badge>
                            : <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">فعال</Badge>}
                        </TableCell>
                        <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  // حالت عادی: نمایش درختی
                  roots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                        رکوردی یافت نشد
                      </TableCell>
                    </TableRow>
                  ) : roots.map((row) => (
                    <TreeRow key={row.id} row={row} list={list} depth={0}
                      selected={selected} onSelect={handleRowClick} />
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
