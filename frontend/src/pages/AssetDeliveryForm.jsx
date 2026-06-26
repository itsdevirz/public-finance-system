import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, ArrowLeftRight, CheckCircle2, Clock, RotateCcw } from "lucide-react";
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

// ─── نمونه داده تحویل‌ها ──────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, assetCode: "A001", assetTitle: "لپ‌تاپ Dell Latitude 5520", personnelCode: "P001", personnelName: "علی رضایی",    department: "فناوری اطلاعات", deliveryDate: "1403/01/15", returnDate: "",          status: "delivered", note: "" },
  { id: 2, assetCode: "A003", assetTitle: "میز کار اداری",             personnelCode: "P002", personnelName: "مریم احمدی",   department: "حسابداری",       deliveryDate: "1403/02/01", returnDate: "",          status: "delivered", note: "" },
  { id: 3, assetCode: "A006", assetTitle: "پروژکتور Epson EB-X51",     personnelCode: "P003", personnelName: "حسن محمدی",    department: "آموزش",          deliveryDate: "1402/10/01", returnDate: "1403/03/20", status: "returned",  note: "عودت پس از اتمام دوره آموزشی" },
];

const STATUS_OPTIONS = [
  { value: "delivered", label: "تحویل داده شده" },
  { value: "returned",  label: "عودت داده شده" },
  { value: "pending",   label: "در انتظار تحویل" },
];

const STATUS_STYLE = {
  delivered: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  returned:  { badge: "bg-blue-100 text-blue-700",       icon: RotateCcw    },
  pending:   { badge: "bg-amber-100 text-amber-700",     icon: Clock        },
};

const INITIAL_FORM = {
  assetCode: "", assetTitle: "",
  assetGroup: "", assetBrand: "", assetModel: "", assetSerial: "", assetSupplier: "",
  personnelCode: "", personnelName: "",
  department: "", deliveryDate: "",
  returnDate: "", status: "delivered",
  note: "",
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
    <select value={value} onChange={onChange} disabled={disabled}
      className={cn(
        "rounded-lg border border-input bg-background px-3 py-1.5 text-sm w-full",
        "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function AssetDeliveryForm() {
  const { assets } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [saved, setSaved]       = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // وقتی مال انتخاب شد، اطلاعات آن را از context پر می‌کنیم
        if (field === "assetCode") {
          const asset = assets.find((a) => a.assetCode === val);
          next.assetTitle    = asset?.assetName    ?? "";
          next.assetGroup    = asset?.assetGroup   ?? "";
          next.assetBrand    = asset?.brand        ?? "";
          next.assetModel    = asset?.model        ?? "";
          next.assetSerial   = asset?.serialNumber ?? "";
          next.assetSupplier = asset?.supplier     ?? "";
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
    if (!form.assetCode || !form.personnelCode.trim() || !form.deliveryDate.trim()) return;
    const record = {
      id: selected ?? Date.now(),
      ...form,
      assetTitle: assets.find((a) => a.assetCode === form.assetCode)?.assetName ?? form.assetCode,
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
    setList((l) => l.filter((r) => r.id !== selected));
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row.id);
    setForm({
      assetCode:     row.assetCode     ?? "",
      assetTitle:    row.assetTitle    ?? "",
      personnelCode: row.personnelCode ?? "",
      personnelName: row.personnelName ?? "",
      department:    row.department    ?? "",
      deliveryDate:  row.deliveryDate  ?? "",
      returnDate:    row.returnDate    ?? "",
      status:        row.status        ?? "delivered",
      note:          row.note          ?? "",
    });
    setSaved(false);
  }

  // ثبت عودت سریع از روی جدول
  function handleQuickReturn(row) {
    const today = new Date().toLocaleDateString("fa-IR");
    setList((l) => l.map((r) =>
      r.id === row.id ? { ...r, status: "returned", returnDate: today } : r
    ));
  }

  const filtered = list.filter((r) => {
    const matchSearch = !search ||
      r.assetCode?.includes(search) || r.assetTitle?.includes(search) ||
      r.personnelCode?.includes(search) || r.personnelName?.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // آمار خلاصه
  const stats = useMemo(() => ({
    delivered: list.filter((r) => r.status === "delivered").length,
    returned:  list.filter((r) => r.status === "returned").length,
    pending:   list.filter((r) => r.status === "pending").length,
  }), [list]);

  const canSave = form.assetCode && form.personnelCode.trim() && form.deliveryDate.trim();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">ثبت اموال</span>
        <span>/</span>
        <span>تحویل به پرسنل</span>
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
          <h1 className="text-xl font-bold">تحویل مال به پرسنل</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت تحویل و عودت اموال به کارکنان</p>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-3 gap-3 mb-4" dir="rtl">
        {[
          { key: "delivered", label: "در اختیار پرسنل", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { key: "returned",  label: "عودت داده شده",   icon: RotateCcw,    color: "text-blue-600",    bg: "bg-blue-50 border-blue-200"       },
          { key: "pending",   label: "در انتظار تحویل", icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"      },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <button key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={cn("rounded-xl border p-3 text-right transition-all", bg,
              filterStatus === key && "ring-2 ring-offset-1 ring-blue-400")}>
            <div className="flex items-center justify-between">
              <span className={cn("text-2xl font-bold", color)}>{stats[key]}</span>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            {/* مال */}
            <Field label="مال" required col={2}>
              <StyledSelect
                value={form.assetCode}
                onChange={set("assetCode")}
                options={assets.map((a) => ({
                  value: a.assetCode,
                  label: `${a.assetCode} — ${a.assetName}`,
                }))}
                placeholder="انتخاب مال"
              />
            </Field>

            {/* وضعیت — همیشه آزاد */}
            <Field label="وضعیت" required col={2}>
              <StyledSelect value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />
            </Field>

            {/* کارت اطلاعات مال انتخاب‌شده */}
            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3" dir="rtl">
                <p className="text-xs font-bold text-blue-700 mb-2">مشخصات مال انتخاب‌شده</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4 text-xs">
                  {[
                    { label: "نام مال",        value: form.assetTitle },
                    { label: "گروه",           value: form.assetGroup },
                    { label: "برند / مدل",     value: [form.assetBrand, form.assetModel].filter(Boolean).join(" / ") || "—" },
                    { label: "شماره سریال",    value: form.assetSerial   || "—" },
                    { label: "تامین‌کننده",   value: form.assetSupplier || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-1">
                      <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* کد پرسنلی */}
            <Field label="کد پرسنلی" required>
              <Input value={form.personnelCode} onChange={set("personnelCode")}
                className="h-9 text-sm font-mono" dir="ltr" placeholder="P001" />
            </Field>

            {/* نام پرسنل */}
            <Field label="نام پرسنل" required col={2}>
              <Input value={form.personnelName} onChange={set("personnelName")}
                className="h-9 text-sm" placeholder="نام و نام خانوادگی" />
            </Field>

            {/* واحد سازمانی */}
            <Field label="واحد / اداره">
              <Input value={form.department} onChange={set("department")}
                className="h-9 text-sm" placeholder="نام واحد سازمانی" />
            </Field>

            {/* تاریخ تحویل */}
            <Field label="تاریخ تحویل" required>
              <Input value={form.deliveryDate} onChange={set("deliveryDate")}
                className="h-9 text-sm" placeholder="۱۴۰۳/۰۱/۰۱" />
            </Field>

            {/* تاریخ عودت */}
            <Field label="تاریخ عودت">
              <Input value={form.returnDate} onChange={set("returnDate")}
                disabled={form.status !== "returned"}
                className="h-9 text-sm" placeholder="۱۴۰۳/۰۶/۰۱" />
            </Field>

            {/* یادداشت */}
            <Field label="یادداشت" col={2}>
              <Input value={form.note} onChange={set("note")}
                className="h-9 text-sm" placeholder="توضیحات اضافی (اختیاری)" />
            </Field>

          </div>
        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2 flex-wrap" dir="rtl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو بر اساس کد مال، نام پرسنل..."
                className="pr-9 h-8 text-sm" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            {filterStatus && (
              <Button variant="outline" size="sm" onClick={() => setFilterStatus("")} className="gap-1 text-xs">
                <ArrowLeftRight className="h-3 w-3" />
                حذف فیلتر وضعیت
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus(""); }}>پاک</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right">مال</TableHead>
                  <TableHead className="text-xs font-bold text-right w-20">کد پرسنلی</TableHead>
                  <TableHead className="text-xs font-bold text-right">نام پرسنل</TableHead>
                  <TableHead className="text-xs font-bold text-right">واحد</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ تحویل</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ عودت</TableHead>
                  <TableHead className="text-xs font-bold text-right w-24">وضعیت</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                      رکوردی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : filtered.map((row) => {
                  const st = STATUS_STYLE[row.status] ?? STATUS_STYLE.pending;
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={row.id} onClick={() => handleRowClick(row)}
                      className={cn("cursor-pointer transition-colors",
                        selected === row.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                      <TableCell>
                        <div className="text-sm font-medium">{row.assetTitle}</div>
                        <div className="text-xs text-muted-foreground font-mono">{row.assetCode}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.personnelCode}</TableCell>
                      <TableCell className="text-sm font-medium">{row.personnelName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.department || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{row.deliveryDate}</TableCell>
                      <TableCell className="text-xs font-mono">{row.returnDate || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs gap-1", st.badge)}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_OPTIONS.find((s) => s.value === row.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {row.status === "delivered" && (
                            <button onClick={() => handleQuickReturn(row)}
                              className="rounded px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap">
                              عودت سریع
                            </button>
                          )}
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground mt-1" />
                        </div>
                      </TableCell>
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
