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
import { useAssets } from "@/context/AssetContext";
import { SearchableSelect } from "@/components/ui/searchable-select";

// ─── نوع تامین‌کننده ─────────────────────────────────────────────────────────
const SUPPLIER_TYPES = [
  { value: "company",    label: "شرکت / سازمان" },
  { value: "individual", label: "شخص حقیقی" },
  { value: "government", label: "دستگاه دولتی" },
];

const TYPE_COLORS = {
  company:    "bg-blue-100 text-blue-700",
  individual: "bg-amber-100 text-amber-700",
  government: "bg-violet-100 text-violet-700",
};

const INITIAL_FORM = {
  code: "", title: "", type: "company",
  nationalId: "", economicCode: "",
  phone: "", fax: "", email: "",
  contactName: "", contactPhone: "",
  province: "", city: "", address: "",
  sheba: "", bankName: "",
  inactive: false,
};

// ─── تب‌های فرم ──────────────────────────────────────────────────────────────
const TABS = [
  { key: "main",    label: "اطلاعات اصلی" },
  { key: "contact", label: "تماس و آدرس" },
];

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

export default function AssetSupplierForm() {
  const { suppliers, addConfig, updateConfig, deleteConfig } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [activeTab, setActiveTab] = useState("main");
  const [saved, setSaved]       = useState(false);

  const list = suppliers || [];

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
    setActiveTab("main");
  }

  async function handleSave() {
    if (!form.code.trim() || !form.title.trim()) return;
    const record = { ...form };
    if (selected !== null) {
      await updateConfig("suppliers", { ...record, _id: selected, id: selected });
    } else {
      await addConfig("suppliers", record);
    }
    setSaved(true);
    handleNew();
  }

  async function handleDelete() {
    if (selected === null) return;
    await deleteConfig("suppliers", selected);
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
    setForm({
      code:          row.code          ?? "",
      title:         row.title         ?? "",
      type:          row.type          ?? "company",
      nationalId:    row.nationalId    ?? "",
      economicCode:  row.economicCode  ?? "",
      phone:         row.phone         ?? "",
      fax:           row.fax           ?? "",
      email:         row.email         ?? "",
      contactName:   row.contactName   ?? "",
      contactPhone:  row.contactPhone  ?? "",
      province:      row.province      ?? "",
      city:          row.city          ?? "",
      address:       row.address       ?? "",
      sheba:         row.sheba         ?? "",
      bankName:      row.bankName      ?? "",
      inactive:      row.inactive      ?? false,
    });
    setSaved(false);
    setActiveTab("main");
  }

  const filtered = list.filter(
    (r) =>
      !search ||
      r.code?.includes(search) ||
      r.title?.includes(search) ||
      r.contactName?.includes(search)
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
        <span>تعریف تامین‌کنندگان</span>
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
          <h1 className="text-xl font-bold">تعریف تامین‌کنندگان</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت و مدیریت مشخصات پیمانکاران، فروشندگان و واگذارندگان دارایی‌ها</p>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="tabs mb-0" dir="rtl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("tab-btn", activeTab === t.key && "active")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* فرم */}
      <Card className="rounded-tr-none shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">
          {activeTab === "main" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
              <Field label="کد تامین‌کننده" required>
                <Input value={form.code} onChange={set("code")} className="h-9 text-sm font-mono text-left" placeholder="مثال: S001" />
              </Field>

              <Field label="نام / عنوان تامین‌کننده" required col={2}>
                <Input value={form.title} onChange={set("title")} className="h-9 text-sm" placeholder="مثال: شرکت تجهیزات اداری ایران" />
              </Field>

              <Field label="نوع تامین‌کننده" required>
                <SearchableSelect value={form.type} onChange={(v) => setForm(f => ({...f, type: v}))} options={SUPPLIER_TYPES} />
              </Field>

              <Field label="شناسه ملی / کد ملی">
                <Input value={form.nationalId} onChange={set("nationalId")} className="h-9 text-sm font-mono text-left" placeholder="۱۰ یا ۱۱ رقم" />
              </Field>

              <Field label="کد اقتصادی">
                <Input value={form.economicCode} onChange={set("economicCode")} className="h-9 text-sm font-mono text-left" placeholder="۱۲ رقم" />
              </Field>

              <Field label="نام بانک">
                <Input value={form.bankName} onChange={set("bankName")} className="h-9 text-sm" placeholder="مثال: بانک ملی ایران" />
              </Field>

              <Field label="شماره شبا (IR)">
                <Input value={form.sheba} onChange={set("sheba")} className="h-9 text-sm font-mono text-left animate-in fade-in" dir="ltr" placeholder="IR000000000000000000000000" />
              </Field>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
              <Field label="تلفن ثابت">
                <Input value={form.phone} onChange={set("phone")} className="h-9 text-sm font-mono text-left" placeholder="۰۲۱۸۸۸۸۸۸۸۸" />
              </Field>

              <Field label="فکس">
                <Input value={form.fax} onChange={set("fax")} className="h-9 text-sm font-mono text-left" placeholder="۰۲۱۸۸۸۸۸۸۸۹" />
              </Field>

              <Field label="پست الکترونیکی" col={2}>
                <Input value={form.email} onChange={set("email")} className="h-9 text-sm font-mono text-left" dir="ltr" placeholder="info@supplier.com" />
              </Field>

              <Field label="نام شخص رابط">
                <Input value={form.contactName} onChange={set("contactName")} className="h-9 text-sm" placeholder="مثال: علی رضایی" />
              </Field>

              <Field label="تلفن همراه رابط">
                <Input value={form.contactPhone} onChange={set("contactPhone")} className="h-9 text-sm font-mono text-left" placeholder="۰۹۱۲۱۲۳۴۵۶۷" />
              </Field>

              <Field label="استان">
                <Input value={form.province} onChange={set("province")} className="h-9 text-sm" placeholder="مثال: تهران" />
              </Field>

              <Field label="شهر">
                <Input value={form.city} onChange={set("city")} className="h-9 text-sm" placeholder="مثال: تهران" />
              </Field>

              <Field label="نشانی کامل" col={3}>
                <Input value={form.address} onChange={set("address")} className="h-9 text-sm" placeholder="نشانی دقیق شرکت..." />
              </Field>

              <Field label="وضعیت">
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                  <input type="checkbox" checked={form.inactive} onChange={set("inactive")}
                    className="rounded accent-red-600 h-4 w-4" />
                  <span className={cn("font-medium", form.inactive && "text-red-600")}>غیرفعال</span>
                </label>
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو در کد، عنوان، شخص رابط..." className="pr-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک کردن</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right w-28">کد</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان تامین‌کننده</TableHead>
                  <TableHead className="text-xs font-bold text-right w-36">نوع</TableHead>
                  <TableHead className="text-xs font-bold text-right w-32">تلفن</TableHead>
                  <TableHead className="text-xs font-bold text-right w-36">شخص رابط</TableHead>
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
                    <TableCell>
                      <Badge className={cn("text-xs font-normal border shadow-none", TYPE_COLORS[row.type] || TYPE_COLORS.company)}>
                        {SUPPLIER_TYPES.find((t) => t.value === row.type)?.label || row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-left">{row.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{row.contactName || "—"}</TableCell>
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
