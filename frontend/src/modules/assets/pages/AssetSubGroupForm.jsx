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

const INITIAL_FORM = {
  groupCode: "", code: "", title: "",
  account: "", description: "", inactive: false,
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

function StyledSelect({ value, onChange, options, placeholder, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
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

export default function AssetSubGroupForm() {
  const { groups, subgroups, addConfig, updateConfig, deleteConfig } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [filterGroup, setFilterGroup] = useState(""); // فیلتر جدول بر اساس گروه
  const [saved, setSaved]       = useState(false);

  const list = subgroups || [];

  const groupOptions = useMemo(() => {
    return (groups || []).map((g) => ({ value: g.code, label: `${g.code} — ${g.title}` }));
  }, [groups]);

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

  async function handleSave() {
    if (!form.groupCode || !form.code.trim() || !form.title.trim()) return;
    const record = { ...form };
    if (selected !== null) {
      await updateConfig("subgroups", { ...record, _id: selected, id: selected });
    } else {
      await addConfig("subgroups", record);
    }
    setSaved(true);
    handleNew();
  }

  async function handleDelete() {
    if (selected === null) return;
    await deleteConfig("subgroups", selected);
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
    setForm({
      groupCode:   row.groupCode   ?? "",
      code:        row.code        ?? "",
      title:       row.title       ?? "",
      account:     row.account     ?? "",
      description: row.description ?? "",
      inactive:    row.inactive    ?? false,
    });
    setSaved(false);
  }

  const filtered = list.filter((r) => {
    const matchesSearch = !search ||
      r.code?.includes(search) ||
      r.title?.includes(search) ||
      r.account?.includes(search);
    const matchesGroup = !filterGroup || r.groupCode === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const canSave = form.groupCode && form.code.trim() && form.title.trim();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">اطلاعات پایه</span>
        <span>/</span>
        <span>تعریف زیرگروه اموال</span>
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
          <h1 className="text-xl font-bold">تعریف زیرگروه اموال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">تعیین دسته‌بندی‌های تفصیلی و حساب معین اموال</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="گروه اصلی" required>
              <StyledSelect
                value={form.groupCode}
                onChange={set("groupCode")}
                options={groupOptions}
                placeholder="انتخاب گروه..."
              />
            </Field>

            <Field label="کد زیرگروه" required>
              <Input value={form.code} onChange={set("code")} className="h-9 text-sm font-mono text-left" placeholder="مثال: ۰۱۰۳" />
            </Field>

            <Field label="عنوان زیرگروه" required col={2}>
              <Input value={form.title} onChange={set("title")} className="h-9 text-sm" placeholder="مثال: تجهیزات رایانه‌ای" />
            </Field>

            <Field label="شماره حساب معین">
              <Input value={form.account} onChange={set("account")} className="h-9 text-sm font-mono text-left" placeholder="مثال: ۱۴۱۱۰۰۳" />
            </Field>

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

            <div className="w-48">
              <StyledSelect
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                options={groupOptions}
                placeholder="فیلتر بر اساس گروه..."
              />
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterGroup(""); }}>پاک کردن</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right w-32">گروه اصلی</TableHead>
                  <TableHead className="text-xs font-bold text-right w-24">کد زیرگروه</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان زیرگروه</TableHead>
                  <TableHead className="text-xs font-bold text-right w-32">حساب معین</TableHead>
                  <TableHead className="text-xs font-bold text-right w-24">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">رکوردی یافت نشد</TableCell>
                  </TableRow>
                ) : filtered.map((row) => {
                  const grp = groups.find((g) => g.code === row.groupCode);
                  return (
                    <TableRow key={row._id || row.id} onClick={() => handleRowClick(row)}
                      className={cn("cursor-pointer transition-colors",
                        selected === (row._id || row.id) ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                      <TableCell className="text-xs">{grp ? grp.title : row.groupCode}</TableCell>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell className="text-sm font-medium">{row.title}</TableCell>
                      <TableCell className="font-mono text-xs text-left">{row.account || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={row.inactive ? "destructive" : "success"} className="text-xs">
                          {row.inactive ? "غیرفعال" : "فعال"}
                        </Badge>
                      </TableCell>
                      <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
