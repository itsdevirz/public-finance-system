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

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, code: "S001", title: "شرکت تجهیزات اداری ایران",  type: "company",    nationalId: "1010123456", economicCode: "41100000000", phone: "02112345678", contactName: "علی رضایی",  province: "تهران", inactive: false },
  { id: 2, code: "S002", title: "سازمان اموال دولتی",         type: "government", nationalId: "1410000001", economicCode: "",            phone: "02144001122", contactName: "",           province: "تهران", inactive: false },
  { id: 3, code: "S003", title: "احمد محمدی",                 type: "individual", nationalId: "0012345678", economicCode: "",            phone: "09121234567", contactName: "احمد محمدی", province: "اصفهان",inactive: false },
];

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

function StyledSelect({ value, onChange, options }) {
  return (
    <select
      value={value} onChange={onChange}
      className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function AssetSupplierForm() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [activeTab, setActiveTab] = useState("main");
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
    setActiveTab("main");
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
      type:         row.type         ?? "company",
      nationalId:   row.nationalId   ?? "",
      economicCode: row.economicCode ?? "",
      phone:        row.phone        ?? "",
      fax:          row.fax          ?? "",
      email:        row.email        ?? "",
      contactName:  row.contactName  ?? "",
      contactPhone: row.contactPhone ?? "",
      province:     row.province     ?? "",
      city:         row.city         ?? "",
      address:      row.address      ?? "",
      sheba:        row.sheba        ?? "",
      bankName:     row.bankName     ?? "",
      inactive:     row.inactive     ?? false,
    });
    setSaved(false);
    setActiveTab("main");
  }

  const filtered = list.filter(
    (r) =>
      !search ||
      r.code?.includes(search) ||
      r.title?.includes(search) ||
      r.nationalId?.includes(search) ||
      r.phone?.includes(search)
  );

  const isIndividual = form.type === "individual";

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
          <h1 className="text-xl font-bold">تعریف تامین‌کنندگان</h1>
          <p className="text-xs text-muted-foreground mt-0.5">تامین‌کنندگان و فروشندگان اموال را تعریف کنید</p>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b mb-0 gap-0" dir="rtl">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === t.key
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      <Card className="rounded-tr-none border-t-0 shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">

          {/* ══ تب اطلاعات اصلی ══ */}
          {activeTab === "main" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

              <Field label="کد تامین‌کننده" required>
                <Input value={form.code} onChange={set("code")}
                  className="h-9 text-sm font-mono" dir="ltr" maxLength={8} placeholder="S001" />
              </Field>

              <Field label="نوع تامین‌کننده" required>
                <StyledSelect value={form.type} onChange={set("type")} options={SUPPLIER_TYPES} />
              </Field>

              <Field label={isIndividual ? "نام و نام خانوادگی" : "نام شرکت / سازمان"} required col={2}>
                <Input value={form.title} onChange={set("title")} className="h-9 text-sm"
                  placeholder={isIndividual ? "نام کامل شخص" : "نام کامل شرکت یا سازمان"} />
              </Field>

              <Field label={isIndividual ? "کد ملی" : "شناسه ملی"} required>
                <Input value={form.nationalId} onChange={set("nationalId")}
                  className="h-9 text-sm font-mono" dir="ltr"
                  maxLength={11} placeholder={isIndividual ? "10 رقم" : "11 رقم"} />
              </Field>

              {!isIndividual && (
                <Field label="کد اقتصادی">
                  <Input value={form.economicCode} onChange={set("economicCode")}
                    className="h-9 text-sm font-mono" dir="ltr" maxLength={12} placeholder="12 رقم" />
                </Field>
              )}

              <Field label="وضعیت">
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                  <input type="checkbox" checked={form.inactive} onChange={set("inactive")}
                    className="rounded accent-destructive" />
                  <span className={cn("font-medium", form.inactive && "text-destructive")}>غیرفعال</span>
                </label>
              </Field>

            </div>
          )}

          {/* ══ تب تماس و آدرس ══ */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

              <Field label="تلفن">
                <Input value={form.phone} onChange={set("phone")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="021-XXXXXXXX" />
              </Field>

              <Field label="نمابر (فاکس)">
                <Input value={form.fax} onChange={set("fax")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="021-XXXXXXXX" />
              </Field>

              <Field label="ایمیل" col={2}>
                <Input value={form.email} onChange={set("email")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="example@email.com" />
              </Field>

              <Field label="نام شخص رابط">
                <Input value={form.contactName} onChange={set("contactName")}
                  className="h-9 text-sm" placeholder="نام و نام خانوادگی" />
              </Field>

              <Field label="تلفن شخص رابط">
                <Input value={form.contactPhone} onChange={set("contactPhone")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="09XXXXXXXXX" />
              </Field>

              <Field label="استان">
                <Input value={form.province} onChange={set("province")} className="h-9 text-sm" />
              </Field>

              <Field label="شهر">
                <Input value={form.city} onChange={set("city")} className="h-9 text-sm" />
              </Field>

              <Field label="آدرس کامل" col={2}>
                <Input value={form.address} onChange={set("address")}
                  className="h-9 text-sm" placeholder="آدرس کامل دفتر یا انبار" />
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
              <Input placeholder="جستجو بر اساس کد، نام، شناسه ملی..."
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
                  <TableHead className="text-xs font-bold text-right w-20">کد</TableHead>
                  <TableHead className="text-xs font-bold text-right">نام</TableHead>
                  <TableHead className="text-xs font-bold text-right">نوع</TableHead>
                  <TableHead className="text-xs font-bold text-right">شناسه ملی</TableHead>
                  <TableHead className="text-xs font-bold text-right">تلفن</TableHead>
                  <TableHead className="text-xs font-bold text-right">استان</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
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
                    <TableCell className="text-sm font-medium max-w-[180px] truncate">{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary"
                        className={cn("text-xs", TYPE_COLORS[row.type] ?? "bg-slate-100 text-slate-600")}>
                        {SUPPLIER_TYPES.find((t) => t.value === row.type)?.label ?? row.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.nationalId || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.phone || "—"}</TableCell>
                    <TableCell className="text-xs">{row.province || "—"}</TableCell>
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
