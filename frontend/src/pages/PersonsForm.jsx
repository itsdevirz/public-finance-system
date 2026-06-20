import { useState } from "react";
import { Search, Plus, Printer, FileDown, Trash2, Save, RotateCcw } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ─── داده‌های پیش‌فرض ──────────────────────────────────────────────────────
const PERSON_TYPES = [
    { value: "1", label: "1 - حقوقی" },
    { value: "2", label: "2 - دولت جمهوری اسلامی ایران" },
    { value: "3", label: "3 - خزانه داری کل کشور" },
    { value: "4", label: "4 - نهاد های بین المللی" },
    { value: "5", label: "5 - حقیقی ایرانی بااهمیت" },
    { value: "6", label: "6 - حقیقی ایرانی سایر" },
    { value: "7", label: "7 - حقیقی خارجی بااهمیت" },
    { value: "8", label: "8 - حقیقی خارجی سایر" },
];

const PERSON_CLASSES = [
  { value: "31", label: "31 - بخش خصوصی" },
  { value: "11", label: "11 - دولتی" },
  { value: "21", label: "21 - عمومی" },
];

const SUB_CLASSES = [
  { value: "314", label: "314 - کارکنان" },
  { value: "311", label: "311 - پیمانکار" },
  { value: "312", label: "312 - تامین‌کننده" },
];

const DETAIL_CLASSES = [
  { value: "3142", label: "3142 - پیمانی" },
  { value: "3141", label: "3141 - رسمی" },
  { value: "3143", label: "3143 - قراردادی" },
];

const INITIAL_FORM = {
  type: "6", personClass: "31", subClass: "314", detailClass: "3142",
  title: "", code: "", inactive: false,
  name: "", lastName: "", nationalCode: "", economicCode: "",
  sheba: "", province: "", city: "", address: "",
  name2: "", position: "",
  paymentLimitationType: "none",
  bank: "", accountNumber: "",
  taxStartDate: "", taxEndDate: "", vatBase: "",
};

const SAMPLE_LIST = [
  { id: 1, nationalCode: "1010115089", name: "نامشخص نامشخص",   lastName: "",  type: "حقوقی", cls: "3111", sheba: "41111133...", economic: "23017000...", address: "", province: "", city: "" },
  { id: 2, nationalCode: "1010115089", name: "آزمایشگاه فنی و مکانیک خاک", lastName: "", type: "حقوقی", cls: "3111", sheba: "", economic: "", address: "", province: "", city: "" },
];

const TABS = [
  { key: "other",    label: "سایر" },
  { key: "agent",    label: "تعریف عامل ذیحساب" },
  { key: "contract", label: "تعریف طرف قرارداد" },
];

// ─── کامپوننت کوچک: select استایل‌دار ──────────────────────────────────────
function Select({ id, value, onChange, options, className }) {
  return (
    <select
      id={id} value={value} onChange={onChange}
      className={cn(
        "rounded-lg border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all duration-200",
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── فیلد فرم ──────────────────────────────────────────────────────────────
function Field({ label, children, required, horizontal }) {
  if (horizontal) {
    return (
      <div className="flex items-center gap-2">
        <Label className="whitespace-nowrap text-xs text-muted-foreground min-w-[90px] text-left">
          {label}{required && <span className="text-destructive mr-0.5">*</span>}
        </Label>
        <div className="flex-1">{children}</div>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}{required && <span className="text-destructive mr-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

// ─── صفحه اصلی ─────────────────────────────────────────────────────────────
export default function PersonsForm() {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState("other");
  const [list, setList]         = useState(SAMPLE_LIST);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
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
    if (!form.name.trim()) return;
    if (selected !== null) {
      setList((l) => l.map((r) => r.id === selected ? { ...r, name: form.name, lastName: form.lastName, nationalCode: form.nationalCode, type: PERSON_TYPES.find(t => t.value === form.type)?.label.split(" - ")[1] ?? "", cls: form.detailClass } : r));
    } else {
      setList((l) => [...l, { id: Date.now(), nationalCode: form.nationalCode, name: form.name, lastName: form.lastName, type: PERSON_TYPES.find(t => t.value === form.type)?.label.split(" - ")[1] ?? "", cls: form.detailClass, sheba: form.sheba, economic: form.economicCode, address: form.address, province: form.province, city: form.city }]);
    }
    setSaved(true);
  }

  function handleDelete() {
    if (selected === null) return;
    setList((l) => l.filter((r) => r.id !== selected));
    setForm(INITIAL_FORM);
    setSelected(null);
  }

  function handleRowClick(row) {
    setSelected(row.id);
    setForm((f) => ({ ...f, name: row.name, lastName: row.lastName, nationalCode: row.nationalCode }));
    setSaved(false);
  }

  const filtered = list.filter((r) =>
    r.name?.includes(search) || r.nationalCode?.includes(search) || r.economic?.includes(search)
  );

  return (
    <PageShell>
      <PageHeader title="تعریف اشخاص" description="تعریف اشخاص حقیقی و حقوقی">
        {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in duration-300">✓ ثبت شد</span>}
      </PageHeader>

      {/* تب‌ها */}
      <div className="tabs mb-0">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("tab-btn", activeTab === t.key && "active")}>
            {t.label}
          </button>
        ))}
      </div>

      <Card className="rounded-tl-none mt-0">
        <CardContent className="pt-5">
          {/* ─── تب سایر ─── */}
          {activeTab === "other" && (
            <div className="space-y-4">
              {/* ردیف بالا: طبقه‌بندی + اطلاعات اصلی */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {/* ستون چپ: طبقه‌بندی */}
                <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">طبقه‌بندی</p>
                  <Field label="عنوان" horizontal>
                    <Input value={form.title} onChange={set("title")} className="h-8 text-sm" />
                  </Field>
                  <Field label="طبقه اشخاص" horizontal>
                    <Select value={form.personClass} onChange={set("personClass")} options={PERSON_CLASSES} />
                  </Field>
                  <Field label="ریزطبقه" horizontal>
                    <Select value={form.subClass} onChange={set("subClass")} options={SUB_CLASSES} />
                  </Field>
                  <Field label="جزءطبقه" horizontal>
                    <Select value={form.detailClass} onChange={set("detailClass")} options={DETAIL_CLASSES} />
                  </Field>

                  {/* جدول طبقات اضافه */}
                  <div className="rounded-lg border bg-card overflow-hidden mt-2">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-1.5 text-right text-muted-foreground font-medium">طبقه</th>
                          <th className="px-3 py-1.5 text-right text-muted-foreground font-medium w-16">حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">ردیفی وجود ندارد</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ستون راست: اطلاعات اصلی */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="نوع" horizontal>
                      <Select value={form.type} onChange={set("type")} options={PERSON_TYPES} />
                    </Field>
                    <div className="flex items-center gap-3 pt-5">
                      <Field label="کد" horizontal>
                        <Input value={form.code} onChange={set("code")} className="h-8 text-sm w-24" />
                      </Field>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
                        <input type="checkbox" checked={form.inactive} onChange={set("inactive")} className="rounded" />
                        غیرفعال
                      </label>
                    </div>
                  </div>

                  <Field label="نام" required horizontal>
                    <Input value={form.name} onChange={set("name")} className="h-8 text-sm" />
                  </Field>
                  <Field label="نام خانوادگی" horizontal>
                    <Input value={form.lastName} onChange={set("lastName")} className="h-8 text-sm" />
                  </Field>
                  <Field label="کد/شناسه ملی" horizontal>
                    <Input value={form.nationalCode} onChange={set("nationalCode")} className="h-8 text-sm font-mono" dir="ltr" />
                  </Field>
                  <Field label="کد اقتصادی" horizontal>
                    <Input value={form.economicCode} onChange={set("economicCode")} className="h-8 text-sm font-mono" dir="ltr" />
                  </Field>
                  <Field label="شماره شبا" horizontal>
                    <div className="flex gap-1">
                      <span className="flex items-center rounded-lg border border-input bg-muted px-2 text-xs font-mono">IR</span>
                      <Input value={form.sheba} onChange={set("sheba")} className="h-8 text-sm font-mono" dir="ltr" placeholder="XXXXXXXXXXXXXXXXXXXX" />
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="استان" horizontal>
                      <Input value={form.province} onChange={set("province")} className="h-8 text-sm" />
                    </Field>
                    <Field label="شهر" horizontal>
                      <Input value={form.city} onChange={set("city")} className="h-8 text-sm" />
                    </Field>
                  </div>
                  <Field label="آدرس" horizontal>
                    <Input value={form.address} onChange={set("address")} className="h-8 text-sm" />
                  </Field>
                </div>
              </div>

              {/* ردیف میانی: نام دوم + سمت + محدودیت */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-4 lg:grid-cols-3">
                <Field label="نام دوم" horizontal>
                  <Input value={form.name2} onChange={set("name2")} className="h-8 text-sm" />
                </Field>
                <Field label="سمت" horizontal>
                  <Input value={form.position} onChange={set("position")} className="h-8 text-sm" />
                </Field>
                <div className="flex items-center gap-4 pt-5">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">محدودیت پرداخت:</span>
                  {["none", "has", "no"].map((v, i) => (
                    <label key={v} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" name="payLimit" value={v} checked={form.paymentLimitationType === v} onChange={set("paymentLimitationType")} />
                      {["ندارد", "دارد", "—"][i]}
                    </label>
                  ))}
                </div>
              </div>

              {/* ردیف پایین: اطلاعات بانکی + مالیاتی */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">اطلاعات بانکی</p>
                  <Field label="بانک / شعبه" horizontal>
                    <Input value={form.bank} onChange={set("bank")} className="h-8 text-sm" />
                  </Field>
                  <Field label="شماره حساب" horizontal>
                    <Input value={form.accountNumber} onChange={set("accountNumber")} className="h-8 text-sm font-mono" dir="ltr" />
                  </Field>
                </div>
                <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">اطلاعات مالیاتی</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">دوره ثبت نام در نظام مالیاتی:</span>
                    <span className="text-xs">از</span>
                    <Input value={form.taxStartDate} onChange={set("taxStartDate")} className="h-8 text-sm w-28" placeholder="۱۴۰۳/۰۱/۰۱" />
                    <span className="text-xs">تا</span>
                    <Input value={form.taxEndDate} onChange={set("taxEndDate")} className="h-8 text-sm w-28" placeholder="۱۴۰۳/۱۲/۲۹" />
                  </div>
                  <Field label="بر ارزش افزوده" horizontal>
                    <Input value={form.vatBase} onChange={set("vatBase")} className="h-8 text-sm" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ─── تب عامل ذیحساب ─── */}
          {activeTab === "agent" && (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Save className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>ابتدا شخص را ثبت کنید، سپس اطلاعات عامل ذیحساب را تکمیل نمایید.</p>
            </div>
          )}

          {/* ─── تب طرف قرارداد ─── */}
          {activeTab === "contract" && (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Save className="h-5 w-5 text-muted-foreground" />
              </div>
              <p>ابتدا شخص را ثبت کنید، سپس اطلاعات طرف قرارداد را تکمیل نمایید.</p>
            </div>
          )}

          {/* دکمه‌های عملیاتی */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={selected === null}>
                انتخاب عامل پرداخت
              </Button>
              <Button variant="outline" size="sm" disabled={selected === null}>
                انتخاب عامل روی فرم و جزء فصل
              </Button>
              <Button variant="outline" size="sm" disabled={selected === null}>
                انتقال مغایرت / ارائه گزارش، شناسه‌گی
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { window.print(); }}>
                <Printer className="h-4 w-4" /> چاپ
              </Button>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4" /> اکسل
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={selected === null}>
                <Trash2 className="h-4 w-4" /> حذف
              </Button>
              <Button variant="outline" size="sm" onClick={handleNew}>
                <Plus className="h-4 w-4" /> جدید
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!form.name.trim()}>
                <Save className="h-4 w-4" /> ثبت
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── جدول جستجو ─────────────────────────────────────────────────── */}
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Enter text to search..." className="pr-9 h-8 text-sm" dir="ltr"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setSearch("")}>Clear</Button>
            <Button variant="outline" size="sm">Find</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>کد ملی</TableHead>
                <TableHead>نام</TableHead>
                <TableHead>نام خانوادگی</TableHead>
                <TableHead>نوع شخص</TableHead>
                <TableHead>طبقه</TableHead>
                <TableHead>کد اقتصادی</TableHead>
                <TableHead>شماره شبا</TableHead>
                <TableHead>آدرس</TableHead>
                <TableHead>استان</TableHead>
                <TableHead>شهر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">رکوردی یافت نشد</TableCell>
                </TableRow>
              ) : filtered.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className={cn("cursor-pointer", selected === row.id && "bg-primary/10 hover:bg-primary/15")}
                >
                  <TableCell className="font-mono text-xs">{row.nationalCode}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.lastName || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{row.type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.cls}</TableCell>
                  <TableCell className="font-mono text-xs">{row.economic || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{row.sheba || "—"}</TableCell>
                  <TableCell className="text-xs">{row.address || "—"}</TableCell>
                  <TableCell className="text-xs">{row.province || "—"}</TableCell>
                  <TableCell className="text-xs">{row.city || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
