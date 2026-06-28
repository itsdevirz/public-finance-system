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

// ─── گروه‌های موجود (در واقعیت از API یا context می‌آید) ────────────────────
const ASSET_GROUPS = [
  { code: "01", title: "اموال منقول" },
  { code: "02", title: "اموال غیرمنقول" },
  { code: "03", title: "تجهیزات اداری" },
  { code: "04", title: "وسایط نقلیه" },
  { code: "05", title: "اموال مصرفی" },
];

// ─── نمونه داده اولیه زیرگروه‌ها ─────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, groupCode: "01", code: "0101", title: "اثاثیه و مبلمان",        account: "1411001", inactive: false },
  { id: 2, groupCode: "01", code: "0102", title: "ماشین‌آلات و دستگاه‌ها",  account: "1411002", inactive: false },
  { id: 3, groupCode: "01", code: "0103", title: "تجهیزات رایانه‌ای",       account: "1411003", inactive: false },
  { id: 4, groupCode: "02", code: "0201", title: "زمین",                    account: "1412001", inactive: false },
  { id: 5, groupCode: "02", code: "0202", title: "ساختمان و مستحدثات",      account: "1412002", inactive: false },
  { id: 6, groupCode: "03", code: "0301", title: "تجهیزات اداری سبک",       account: "1413001", inactive: false },
  { id: 7, groupCode: "04", code: "0401", title: "خودرو سواری",              account: "1414001", inactive: false },
  { id: 8, groupCode: "04", code: "0402", title: "خودرو سنگین",              account: "1414002", inactive: false },
];

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
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [filterGroup, setFilterGroup] = useState(""); // فیلتر جدول بر اساس گروه
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
    if (!form.groupCode || !form.code.trim() || !form.title.trim()) return;
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
      groupCode:   row.groupCode   ?? "",
      code:        row.code        ?? "",
      title:       row.title       ?? "",
      account:     row.account     ?? "",
      description: row.description ?? "",
      inactive:    row.inactive    ?? false,
    });
    setSaved(false);
  }

  // نام گروه بر اساس کد
  function groupTitle(code) {
    return ASSET_GROUPS.find((g) => g.code === code)?.title ?? code;
  }

  const filtered = list.filter((r) => {
    const matchSearch =
      !search ||
      r.code?.includes(search) ||
      r.title?.includes(search) ||
      r.account?.includes(search);
    const matchGroup = !filterGroup || r.groupCode === filterGroup;
    return matchSearch && matchGroup;
  });

  const groupOptions = ASSET_GROUPS.map((g) => ({
    value: g.code,
    label: `${g.code} — ${g.title}`,
  }));

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
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!form.groupCode || !form.code.trim() || !form.title.trim()}
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
          <h1 className="text-xl font-bold">تعریف زیرگروه اموال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">زیرگروه‌های هر گروه اموال را تعریف کنید</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            {/* گروه اموال */}
            <Field label="گروه اموال" required col={2}>
              <StyledSelect
                value={form.groupCode}
                onChange={set("groupCode")}
                options={groupOptions}
                placeholder="انتخاب گروه اموال"
              />
            </Field>

            {/* کد زیرگروه */}
            <Field label="کد زیرگروه" required>
              <Input
                value={form.code}
                onChange={set("code")}
                className="h-9 text-sm font-mono"
                dir="ltr"
                maxLength={6}
                placeholder="مثال: 0101"
              />
            </Field>

            {/* عنوان زیرگروه */}
            <Field label="عنوان زیرگروه" required col={2}>
              <Input
                value={form.title}
                onChange={set("title")}
                className="h-9 text-sm"
                placeholder="عنوان زیرگروه را وارد کنید"
              />
            </Field>

            {/* سرفصل حساب */}
            <Field label="سرفصل حساب معین">
              <Input
                value={form.account}
                onChange={set("account")}
                className="h-9 text-sm font-mono"
                dir="ltr"
                maxLength={10}
                placeholder="کد حساب"
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
          <div className="mb-3 flex items-center gap-2 flex-wrap" dir="rtl">
            {/* فیلتر گروه */}
            <StyledSelect
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              options={groupOptions}
              placeholder="همه گروه‌ها"
            />
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس کد یا عنوان..."
                className="pr-9 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterGroup(""); }}>
              پاک
            </Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right">گروه</TableHead>
                  <TableHead className="text-xs font-bold text-right w-20">کد زیرگروه</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان زیرگروه</TableHead>
                  <TableHead className="text-xs font-bold text-right">سرفصل حساب</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
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
                      <TableCell className="text-sm">
                        <span className="font-mono text-xs text-muted-foreground ml-1">{row.groupCode}</span>
                        {groupTitle(row.groupCode)}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold">{row.code}</TableCell>
                      <TableCell className="text-sm font-medium">{row.title}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.account || "—"}
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
