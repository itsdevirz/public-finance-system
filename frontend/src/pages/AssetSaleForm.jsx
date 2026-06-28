import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
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

// ─── روش فروش ────────────────────────────────────────────────────────────────
const SALE_METHODS = [
  { value: "auction",   label: "مزایده عمومی" },
  { value: "negotiate", label: "مذاکره مستقیم" },
  { value: "tender",    label: "مناقصه" },
  { value: "exchange",  label: "معاوضه" },
  { value: "other",     label: "سایر" },
];

// ─── وضعیت فروش ──────────────────────────────────────────────────────────────
const SALE_STATUSES = [
  { value: "pending",   label: "در انتظار مزایده" },
  { value: "sold",      label: "فروخته شده" },
  { value: "cancelled", label: "لغو شده" },
];

const STATUS_STYLE = {
  pending:   { badge: "bg-amber-100 text-amber-700",    icon: Clock         },
  sold:      { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { badge: "bg-red-100 text-red-700",         icon: Pencil       },
};

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  {
    id: 1, assetCode: "A999", assetTitle: "خودرو پژو ۴۰۵ مدل ۱۳۸۵",
    saleMethod: "auction", saleDate: "1403/09/15",
    basePrice: "180000000", salePrice: "210000000",
    buyerName: "شرکت خودروسازی الف", buyerNationalId: "1010987654",
    docNumber: "FR-1403-001", saleStatus: "sold", note: "",
  },
];

const INITIAL_FORM = {
  assetCode: "", assetTitle: "", assetGroup: "", assetBrand: "", assetModel: "",
  purchaseAmount: "", bookValue: "",
  saleMethod: "auction",
  saleDate: "",
  basePrice: "",       // قیمت پایه (ارزش کارشناسی)
  salePrice: "",       // قیمت فروش نهایی
  buyerName: "",       // نام خریدار
  buyerNationalId: "", // کد / شناسه ملی خریدار
  buyerPhone: "",
  docNumber: "",       // شماره سند فروش
  receiptNumber: "",   // شماره فیش واریزی
  saleStatus: "pending",
  note: "",
};

function fmt(val) {
  const n = Number(String(val).replace(/,/g, ""));
  return isNaN(n) || !n ? "" : n.toLocaleString("fa-IR");
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

export default function AssetSaleForm() {
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
    if (!form.assetCode || !form.saleDate.trim()) return;
    const record = { id: selected ?? Date.now(), ...form,
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
    const asset = assets.find((a) => a.assetCode === row.assetCode);
    setForm({
      assetCode:        row.assetCode        ?? "",
      assetTitle:       row.assetTitle       ?? "",
      assetGroup:       asset?.assetGroup    ?? "",
      assetBrand:       asset?.brand         ?? "",
      assetModel:       asset?.model         ?? "",
      purchaseAmount:   asset?.purchaseAmount ?? "",
      bookValue:        row.bookValue        ?? "",
      saleMethod:       row.saleMethod       ?? "auction",
      saleDate:         row.saleDate         ?? "",
      basePrice:        row.basePrice        ?? "",
      salePrice:        row.salePrice        ?? "",
      buyerName:        row.buyerName        ?? "",
      buyerNationalId:  row.buyerNationalId  ?? "",
      buyerPhone:       row.buyerPhone       ?? "",
      docNumber:        row.docNumber        ?? "",
      receiptNumber:    row.receiptNumber    ?? "",
      saleStatus:       row.saleStatus       ?? "pending",
      note:             row.note             ?? "",
    });
    setSaved(false);
  }

  const filtered = list.filter((r) =>
    !search ||
    r.assetCode?.includes(search) ||
    r.assetTitle?.includes(search) ||
    r.buyerName?.includes(search) ||
    r.docNumber?.includes(search)
  );

  const stats = useMemo(() => ({
    pending:   list.filter((r) => r.saleStatus === "pending").length,
    sold:      list.filter((r) => r.saleStatus === "sold").length,
    cancelled: list.filter((r) => r.saleStatus === "cancelled").length,
    totalRevenue: list
      .filter((r) => r.saleStatus === "sold")
      .reduce((sum, r) => sum + (Number(r.salePrice) || 0), 0),
  }), [list]);

  // سود/زیان فروش
  const profit = useMemo(() => {
    const sale = Number(form.salePrice) || 0;
    const book = Number(form.bookValue) || Number(form.purchaseAmount) || 0;
    if (!sale || !book) return null;
    return sale - book;
  }, [form.salePrice, form.bookValue, form.purchaseAmount]);

  const canSave = form.assetCode && form.saleDate.trim();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">ثبت اموال</span>
        <span>/</span>
        <span>فروش مال</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ثبت فروش
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
          <h1 className="text-xl font-bold">فروش مال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت و پایش فرآیند فروش اموال دولتی</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-4 gap-3 mb-4" dir="rtl">
        {[
          { label: "در انتظار",     value: stats.pending,   color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",    icon: Clock          },
          { label: "فروخته شده",    value: stats.sold,      color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2  },
          { label: "لغو شده",       value: stats.cancelled, color: "text-red-600",     bg: "bg-red-50 border-red-200",         icon: Pencil        },
          { label: "درآمد حاصله",   value: stats.totalRevenue ? fmt(stats.totalRevenue) + " ﷼" : "—",
            color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: TrendingUp },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={cn("rounded-xl border p-3 text-right", bg)}>
            <div className="flex items-center justify-between">
              <span className={cn("text-xl font-bold truncate", color)}>{value}</span>
              <Icon className={cn("h-5 w-5 shrink-0", color)} />
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
              <SearchableSelect
                value={form.assetCode}
                onChange={v => {
                  const asset = assets.find((a) => a.assetCode === v);
                  setForm((f) => ({
                    ...f, assetCode: v,
                    assetTitle:     asset?.assetName      ?? "",
                    assetGroup:     asset?.assetGroup     ?? "",
                    assetBrand:     asset?.brand          ?? "",
                    assetModel:     asset?.model          ?? "",
                    purchaseAmount: asset?.purchaseAmount ?? "",
                  }));
                  setSaved(false);
                }}
                options={assets.map((a) => ({ value: a.assetCode, label: `${a.assetCode} — ${a.assetName}` }))}
                placeholder="انتخاب مال"
              />
            </Field>

            <Field label="وضعیت فروش" required col={2}>
              <SearchableSelect value={form.saleStatus} onChange={v => { setForm(f => ({...f, saleStatus: v})); setSaved(false); }} options={SALE_STATUSES} />
            </Field>

            {/* کارت مشخصات مال */}
            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3" dir="rtl">
                <p className="text-xs font-bold text-blue-700 mb-2">مشخصات مال انتخاب‌شده</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4 text-xs">
                  {[
                    { label: "نام مال",    value: form.assetTitle },
                    { label: "گروه",       value: form.assetGroup     || "—" },
                    { label: "برند / مدل", value: [form.assetBrand, form.assetModel].filter(Boolean).join(" / ") || "—" },
                    { label: "قیمت خرید",  value: form.purchaseAmount ? fmt(form.purchaseAmount) + " ریال" : "—" },
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

          {/* ─ اطلاعات فروش ─ */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-xs font-bold text-primary mb-3">اطلاعات فروش</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

              <Field label="روش فروش" required>
                <SearchableSelect value={form.saleMethod} onChange={v => { setForm(f => ({...f, saleMethod: v})); setSaved(false); }} options={SALE_METHODS} />
              </Field>

              <Field label="تاریخ فروش" required>
                <Input value={form.saleDate} onChange={set("saleDate")}
                  className="h-9 text-sm" placeholder="۱۴۰۳/۰۹/۱۵" />
              </Field>

              <Field label="قیمت پایه / کارشناسی (ریال)">
                <Input value={form.basePrice} onChange={set("basePrice")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="0" />
              </Field>

              <Field label="قیمت فروش نهایی (ریال)">
                <Input value={form.salePrice} onChange={set("salePrice")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="0" />
              </Field>

              <Field label="ارزش دفتری (ریال)">
                <Input value={form.bookValue} onChange={set("bookValue")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="0" />
              </Field>

              <Field label="شماره سند فروش">
                <Input value={form.docNumber} onChange={set("docNumber")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="FR-1403-001" />
              </Field>

              <Field label="شماره فیش واریزی">
                <Input value={form.receiptNumber} onChange={set("receiptNumber")}
                  className="h-9 text-sm font-mono" dir="ltr" />
              </Field>

              {/* نمایش سود/زیان */}
              {profit !== null && (
                <div className={cn(
                  "col-span-full rounded-lg border px-4 py-2.5 flex items-center gap-3",
                  profit >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                )} dir="rtl">
                  <TrendingUp className={cn("h-4 w-4 shrink-0", profit >= 0 ? "text-emerald-600" : "text-red-600")} />
                  <span className="text-xs font-medium">
                    {profit >= 0 ? "سود فروش:" : "زیان فروش:"}
                  </span>
                  <span className={cn("text-sm font-bold font-mono", profit >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {fmt(Math.abs(profit))} ریال
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* ─ اطلاعات خریدار ─ */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-xs font-bold text-primary mb-3">اطلاعات خریدار</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

              <Field label="نام خریدار" col={2}>
                <Input value={form.buyerName} onChange={set("buyerName")}
                  className="h-9 text-sm" placeholder="نام شخص حقیقی یا حقوقی" />
              </Field>

              <Field label="کد / شناسه ملی خریدار">
                <Input value={form.buyerNationalId} onChange={set("buyerNationalId")}
                  className="h-9 text-sm font-mono" dir="ltr" maxLength={11} placeholder="10 یا 11 رقم" />
              </Field>

              <Field label="تلفن خریدار">
                <Input value={form.buyerPhone} onChange={set("buyerPhone")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="09XXXXXXXXX" />
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
              <Input placeholder="جستجو بر اساس کد مال، عنوان، خریدار..."
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
                  <TableHead className="text-xs font-bold text-right">روش فروش</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ فروش</TableHead>
                  <TableHead className="text-xs font-bold text-right">قیمت فروش</TableHead>
                  <TableHead className="text-xs font-bold text-right">خریدار</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
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
                  const st = STATUS_STYLE[row.saleStatus] ?? STATUS_STYLE.pending;
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
                        {SALE_METHODS.find((m) => m.value === row.saleMethod)?.label ?? row.saleMethod}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{row.saleDate}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.salePrice ? fmt(row.salePrice) + " ﷼" : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{row.buyerName || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs gap-1", st.badge)}>
                          <StatusIcon className="h-3 w-3" />
                          {SALE_STATUSES.find((s) => s.value === row.saleStatus)?.label}
                        </Badge>
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
