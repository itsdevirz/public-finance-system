import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
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

// ─── دلایل اسقاط ─────────────────────────────────────────────────────────────
const SCRAP_REASONS = [
  { value: "worn",      label: "فرسودگی و استهلاک کامل" },
  { value: "damaged",   label: "آسیب جبران‌ناپذیر" },
  { value: "obsolete",  label: "منسوخ شدن فناوری" },
  { value: "accident",  label: "حادثه یا سانحه" },
  { value: "other",     label: "سایر دلایل" },
];

// ─── وضعیت کمیسیون ───────────────────────────────────────────────────────────
const COMMISSION_STATUS = [
  { value: "pending",   label: "در انتظار تشکیل کمیسیون" },
  { value: "approved",  label: "تایید شده توسط کمیسیون" },
  { value: "rejected",  label: "رد شده توسط کمیسیون" },
];

const STATUS_STYLE = {
  pending:  { badge: "bg-amber-100 text-amber-700",   icon: Clock          },
  approved: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { badge: "bg-red-100 text-red-700",       icon: AlertTriangle  },
};

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  {
    id: 1, assetCode: "A999", assetTitle: "رایانه قدیمی Pentium 4",
    scrapReason: "obsolete", scrapDate: "1403/08/10",
    commissionStatus: "approved", commissionDate: "1403/08/05",
    commissionNumber: "K-1403-001", scrapValue: "500000",
    disposalMethod: "auction", note: "فروش در مزایده عمومی",
  },
];

const INITIAL_FORM = {
  assetCode: "", assetTitle: "", assetGroup: "", assetBrand: "", assetModel: "",
  purchaseAmount: "", bookValue: "",
  scrapReason: "worn", scrapDate: "",
  commissionStatus: "pending", commissionDate: "", commissionNumber: "",
  commissionMembers: "",
  scrapValue: "",           // ارزش اسقاط (قیمت کارشناسی)
  disposalMethod: "auction", // روش واگذاری
  note: "",
};

const DISPOSAL_METHODS = [
  { value: "auction",  label: "مزایده عمومی" },
  { value: "recycle",  label: "بازیافت / معدوم‌سازی" },
  { value: "donate",   label: "اهدا به سازمان‌های خیریه" },
  { value: "internal", label: "واگذاری داخلی" },
  { value: "other",    label: "سایر" },
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

export default function AssetScrapForm() {
  const { assets } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [saved, setSaved]       = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // وقتی مال انتخاب شد اطلاعاتش را پر می‌کنیم
        if (field === "assetCode") {
          const asset = assets.find((a) => a.assetCode === val);
          next.assetTitle     = asset?.assetName      ?? "";
          next.assetGroup     = asset?.assetGroup     ?? "";
          next.assetBrand     = asset?.brand          ?? "";
          next.assetModel     = asset?.model          ?? "";
          next.purchaseAmount = asset?.purchaseAmount ?? "";
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
    if (!form.assetCode || !form.scrapDate.trim()) return;
    const record = {
      id: selected ?? Date.now(),
      assetCode:        form.assetCode,
      assetTitle:       form.assetTitle,
      scrapReason:      form.scrapReason,
      scrapDate:        form.scrapDate,
      commissionStatus: form.commissionStatus,
      commissionDate:   form.commissionDate,
      commissionNumber: form.commissionNumber,
      scrapValue:       form.scrapValue,
      disposalMethod:   form.disposalMethod,
      note:             form.note,
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
    const asset = assets.find((a) => a.assetCode === row.assetCode);
    setForm({
      assetCode:        row.assetCode        ?? "",
      assetTitle:       row.assetTitle       ?? "",
      assetGroup:       asset?.assetGroup    ?? "",
      assetBrand:       asset?.brand         ?? "",
      assetModel:       asset?.model         ?? "",
      purchaseAmount:   asset?.purchaseAmount ?? "",
      bookValue:        row.bookValue        ?? "",
      scrapReason:      row.scrapReason      ?? "worn",
      scrapDate:        row.scrapDate        ?? "",
      commissionStatus: row.commissionStatus ?? "pending",
      commissionDate:   row.commissionDate   ?? "",
      commissionNumber: row.commissionNumber ?? "",
      commissionMembers:row.commissionMembers?? "",
      scrapValue:       row.scrapValue       ?? "",
      disposalMethod:   row.disposalMethod   ?? "auction",
      note:             row.note             ?? "",
    });
    setSaved(false);
  }

  const filtered = list.filter(
    (r) => !search ||
      r.assetCode?.includes(search) ||
      r.assetTitle?.includes(search) ||
      r.commissionNumber?.includes(search)
  );

  // آمار
  const stats = useMemo(() => ({
    pending:  list.filter((r) => r.commissionStatus === "pending").length,
    approved: list.filter((r) => r.commissionStatus === "approved").length,
    rejected: list.filter((r) => r.commissionStatus === "rejected").length,
  }), [list]);

  const canSave = form.assetCode && form.scrapDate.trim();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">ثبت اموال</span>
        <span>/</span>
        <span>اسقاط مال</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-red-600 hover:bg-red-700 text-white">
            <Save className="h-4 w-4" />ثبت اسقاط
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
          <h1 className="text-xl font-bold">اسقاط مال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت و پایش فرآیند اسقاط اموال دولتی</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-3 mb-4" dir="rtl">
        {[
          { key: "pending",  label: "در انتظار کمیسیون", icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"   },
          { key: "approved", label: "تایید شده",          icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200"},
          { key: "rejected", label: "رد شده",             icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50 border-red-200"        },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={cn("rounded-xl border p-3 text-right", bg)}>
            <div className="flex items-center justify-between">
              <span className={cn("text-2xl font-bold", color)}>{stats[key]}</span>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">

          {/* ─ انتخاب مال ─ */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            <Field label="مال" required col={2}>
              <StyledSelect
                value={form.assetCode}
                onChange={set("assetCode")}
                options={assets.map((a) => ({ value: a.assetCode, label: `${a.assetCode} — ${a.assetName}` }))}
                placeholder="انتخاب مال"
              />
            </Field>

            <Field label="دلیل اسقاط" required col={2}>
              <StyledSelect value={form.scrapReason} onChange={set("scrapReason")} options={SCRAP_REASONS} />
            </Field>

            {/* کارت اطلاعات مال */}
            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-red-200 bg-red-50/40 px-4 py-3" dir="rtl">
                <p className="text-xs font-bold text-red-700 mb-2">مشخصات مال انتخاب‌شده</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4 text-xs">
                  {[
                    { label: "نام مال",       value: form.assetTitle },
                    { label: "گروه",          value: form.assetGroup     || "—" },
                    { label: "برند / مدل",    value: [form.assetBrand, form.assetModel].filter(Boolean).join(" / ") || "—" },
                    { label: "قیمت خرید",     value: form.purchaseAmount ? Number(form.purchaseAmount).toLocaleString("fa-IR") + " ریال" : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-1">
                      <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ─ اطلاعات اسقاط ─ */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-xs font-bold text-primary mb-3">اطلاعات اسقاط</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

              <Field label="تاریخ اسقاط" required>
                <Input value={form.scrapDate} onChange={set("scrapDate")}
                  className="h-9 text-sm" placeholder="۱۴۰۳/۰۸/۱۰" />
              </Field>

              <Field label="ارزش کارشناسی اسقاط (ریال)">
                <Input value={form.scrapValue} onChange={set("scrapValue")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="0" />
              </Field>

              <Field label="روش واگذاری" required col={2}>
                <StyledSelect value={form.disposalMethod} onChange={set("disposalMethod")} options={DISPOSAL_METHODS} />
              </Field>

            </div>
          </div>

          {/* ─ اطلاعات کمیسیون ─ */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-xs font-bold text-primary mb-3">کمیسیون اسقاط</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

              <Field label="وضعیت کمیسیون" required>
                <StyledSelect value={form.commissionStatus} onChange={set("commissionStatus")} options={COMMISSION_STATUS} />
              </Field>

              <Field label="تاریخ تشکیل کمیسیون">
                <Input value={form.commissionDate} onChange={set("commissionDate")}
                  className="h-9 text-sm" placeholder="۱۴۰۳/۰۸/۰۵" />
              </Field>

              <Field label="شماره صورت‌جلسه">
                <Input value={form.commissionNumber} onChange={set("commissionNumber")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="K-1403-001" />
              </Field>

              <Field label="اعضای کمیسیون" col={2}>
                <Input value={form.commissionMembers} onChange={set("commissionMembers")}
                  className="h-9 text-sm" placeholder="نام اعضای کمیسیون (با ویرگول جدا کنید)" />
              </Field>

              <Field label="توضیحات" col={2}>
                <Input value={form.note} onChange={set("note")}
                  className="h-9 text-sm" placeholder="توضیحات تکمیلی" />
              </Field>

            </div>
          </div>

        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="جستجو بر اساس کد مال، عنوان، شماره صورت‌جلسه..."
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
                  <TableHead className="text-xs font-bold text-right">مال</TableHead>
                  <TableHead className="text-xs font-bold text-right">دلیل اسقاط</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ اسقاط</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت کمیسیون</TableHead>
                  <TableHead className="text-xs font-bold text-right">شماره صورت‌جلسه</TableHead>
                  <TableHead className="text-xs font-bold text-right">روش واگذاری</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                      رکوردی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : filtered.map((row) => {
                  const st = STATUS_STYLE[row.commissionStatus] ?? STATUS_STYLE.pending;
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={row.id} onClick={() => handleRowClick(row)}
                      className={cn("cursor-pointer transition-colors",
                        selected === row.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                      <TableCell>
                        <div className="text-sm font-medium">{row.assetTitle}</div>
                        <div className="text-xs text-muted-foreground font-mono">{row.assetCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {SCRAP_REASONS.find((r) => r.value === row.scrapReason)?.label ?? row.scrapReason}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{row.scrapDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs gap-1", st.badge)}>
                          <StatusIcon className="h-3 w-3" />
                          {COMMISSION_STATUS.find((s) => s.value === row.commissionStatus)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.commissionNumber || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {DISPOSAL_METHODS.find((d) => d.value === row.disposalMethod)?.label ?? row.disposalMethod}
                      </TableCell>
                      <TableCell>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
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
