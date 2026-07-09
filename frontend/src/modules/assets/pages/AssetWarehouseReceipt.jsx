import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, PackagePlus, CheckCircle2, Clock, FileText } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAssets } from "@/context/AssetContext";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

// ─── انواع رسید ────────────────────────────────────────────────────────────────
const RECEIPT_TYPES = [
  { value: "purchase",   label: "خرید" },
  { value: "transfer",   label: "انتقال از انبار دیگر" },
  { value: "return",     label: "برگشت از مصرف" },
  { value: "donation",   label: "هدیه / اهدا" },
  { value: "other",      label: "سایر" },
];

const STATUS_OPTIONS = [
  { value: "draft",      label: "پیش‌نویس" },
  { value: "confirmed",  label: "تایید شده" },
  { value: "cancelled",  label: "لغو شده" },
];

const STATUS_STYLE = {
  draft:     { badge: "bg-amber-100 text-amber-700",   icon: Clock         },
  confirmed: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { badge: "bg-red-100 text-red-700",       icon: Trash2        },
};

const SAMPLE_DATA = [
  { id: 1, receiptNo: "WR-1403-001", assetCode: "A007", assetTitle: "کاغذ A4 (بسته‌ای)",
    receiptType: "purchase", quantity: "100", unit: "بسته", unitPrice: "250000",
    receiptDate: "1403/05/10", supplier: "شرکت لوازم اداری", storeLocation: "انبار مرکزی",
    documentNo: "INV-2024-001", status: "confirmed", note: "" },
  { id: 2, receiptNo: "WR-1403-002", assetCode: "A008", assetTitle: "خودکار (جعبه‌ای)",
    receiptType: "purchase", quantity: "20",  unit: "جعبه", unitPrice: "180000",
    receiptDate: "1403/06/01", supplier: "شرکت لوازم اداری", storeLocation: "انبار مرکزی",
    documentNo: "INV-2024-002", status: "confirmed", note: "" },
];

const INITIAL_FORM = {
  receiptNo: "", assetCode: "", assetTitle: "", assetGroup: "",
  receiptType: "purchase", quantity: "", unit: "عدد", unitPrice: "",
  receiptDate: "", supplier: "", storeLocation: "انبار مرکزی",
  documentNo: "", status: "draft", note: "",
};

function Field({ label, required, children, col }) {
  return (
    <div className={cn("flex flex-col gap-1.5", col === 2 && "col-span-2", col === 4 && "col-span-4")}>
      <Label className="text-sm font-medium text-right">
        {label}{required && <span className="text-blue-600 mr-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function fmt(val) {
  const n = Number(String(val).replace(/,/g, ""));
  return isNaN(n) || n === 0 ? "" : n.toLocaleString("fa-IR");
}

export default function AssetWarehouseReceipt() {
  const { assets } = useAssets();
  const consumableAssets = assets.filter((a) => a.assetType === "consumable" || a.assetType === "consumable-2");

  const [form, setForm]           = useState(INITIAL_FORM);
  const [list, setList]           = useState(SAMPLE_DATA);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");
  const [saved, setSaved]         = useState(false);

  function set(field) {
    return (e) => {
      const val = e.target.value;
      setForm((f) => ({ ...f, [field]: val }));
      setSaved(false);
    };
  }

  function handleNew() { setForm({ ...INITIAL_FORM, receiptNo: `WR-${Date.now()}` }); setSelected(null); setSaved(false); }

  function handleSave() {
    if (!form.assetCode || !form.quantity || !form.receiptDate) return;
    const rec = { id: selected ?? Date.now(), ...form };
    if (selected !== null) setList((l) => l.map((r) => r.id === selected ? rec : r));
    else setList((l) => [...l, rec]);
    setSaved(true);
  }

  function handleDelete() {
    if (selected === null) return;
    setList((l) => l.filter((r) => r.id !== selected));
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row.id);
    setForm({ ...INITIAL_FORM, ...row });
    setSaved(false);
  }

  const filtered = list.filter((r) =>
    !search || r.receiptNo?.includes(search) || r.assetTitle?.includes(search) || r.assetCode?.includes(search)
  );

  const totalValue = useMemo(() =>
    list.filter(r => r.status === "confirmed")
        .reduce((s, r) => s + (Number(r.quantity) * Number(r.unitPrice || 0)), 0), [list]);

  const stats = useMemo(() => ({
    confirmed: list.filter(r => r.status === "confirmed").length,
    draft:     list.filter(r => r.status === "draft").length,
    total:     list.length,
  }), [list]);

  const canSave = form.assetCode && form.quantity && form.receiptDate;

  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">انبار و موجودی</span>
        <span>/</span>
        <span>رسید انبار (اموال مصرفی)</span>
      </div>

      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ثبت رسید
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={selected === null}
            className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />حذف
          </Button>
          {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold flex items-center gap-2"><PackagePlus className="h-5 w-5 text-blue-600" />رسید انبار</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ورود اموال مصرفی به انبار</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-3 gap-3 mb-4" dir="rtl">
        {[
          { label: "تایید شده",    value: stats.confirmed, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { label: "پیش‌نویس",     value: stats.draft,     color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"    },
          { label: "ارزش کل ورودی (ریال)", value: fmt(totalValue), color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3 text-right", bg)}>
            <p className={cn("text-xl font-bold font-mono", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">

            <Field label="شماره رسید">
              <Input value={form.receiptNo} onChange={set("receiptNo")}
                className="h-9 text-sm font-mono" dir="ltr" placeholder="WR-1403-001" />
            </Field>

            <Field label="نوع رسید" required>
              <SearchableSelect value={form.receiptType}
                onChange={v => { setForm(f => ({...f, receiptType: v})); setSaved(false); }}
                options={RECEIPT_TYPES} />
            </Field>

            <Field label="وضعیت">
              <SearchableSelect value={form.status}
                onChange={v => { setForm(f => ({...f, status: v})); setSaved(false); }}
                options={STATUS_OPTIONS} />
            </Field>

            <Field label="تاریخ رسید" required>
              <PersianDatePicker value={form.receiptDate} onChange={set("receiptDate")}
                className="h-9" placeholder="۱۴۰۳/۰۱/۰۱" />
            </Field>

            {/* انتخاب مال مصرفی */}
            <Field label="مال مصرفی" required col={2}>
              <SearchableSelect
                value={form.assetCode}
                onChange={v => {
                  const asset = assets.find(a => a.assetCode === v);
                  setForm(f => ({ ...f, assetCode: v,
                    assetTitle: asset?.assetName ?? v,
                    assetGroup: asset?.assetGroup ?? "",
                    unit: asset?.unit ?? "عدد",
                  }));
                  setSaved(false);
                }}
                options={[
                  ...consumableAssets.map(a => ({ value: a.assetCode, label: `${a.assetCode} — ${a.assetName}` })),
                  { value: "A007", label: "A007 — کاغذ A4 (بسته‌ای)" },
                  { value: "A008", label: "A008 — خودکار (جعبه‌ای)" },
                  { value: "A009", label: "A009 — پاکت نامه" },
                ]}
                placeholder="انتخاب مال مصرفی"
              />
            </Field>

            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-2.5" dir="rtl">
                <p className="text-xs font-bold text-blue-700 mb-1">مشخصات مال انتخاب‌شده</p>
                <div className="flex gap-6 text-xs">
                  <span><span className="text-muted-foreground">گروه: </span>{form.assetGroup || "—"}</span>
                  <span><span className="text-muted-foreground">واحد: </span>{form.unit}</span>
                </div>
              </div>
            )}

            <Field label="تعداد / مقدار" required>
              <Input value={form.quantity} onChange={set("quantity")}
                className="h-9 text-sm font-mono" dir="ltr" placeholder="0" type="number" min="1" />
            </Field>

            <Field label="واحد">
              <Input value={form.unit} onChange={set("unit")} className="h-9 text-sm" placeholder="عدد / بسته / کیلو" />
            </Field>

            <Field label="قیمت واحد (ریال)">
              <Input value={form.unitPrice} onChange={set("unitPrice")}
                className="h-9 text-sm font-mono" dir="ltr" placeholder="0" />
            </Field>

            <Field label="مبلغ کل (ریال)">
              <Input value={fmt(Number(form.quantity) * Number(form.unitPrice || 0))}
                readOnly className="h-9 text-sm font-mono bg-muted/40" />
            </Field>

            <Field label="تامین‌کننده / فروشنده" col={2}>
              <Input value={form.supplier} onChange={set("supplier")}
                className="h-9 text-sm" placeholder="نام شرکت یا فرد" />
            </Field>

            <Field label="شماره سند / فاکتور">
              <Input value={form.documentNo} onChange={set("documentNo")}
                className="h-9 text-sm font-mono" dir="ltr" placeholder="INV-2024-001" />
            </Field>

            <Field label="محل نگهداری در انبار">
              <Input value={form.storeLocation} onChange={set("storeLocation")}
                className="h-9 text-sm" placeholder="انبار مرکزی" />
            </Field>

            <Field label="توضیحات" col={2}>
              <Input value={form.note} onChange={set("note")} className="h-9 text-sm" />
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
              <Input placeholder="جستجو در شماره رسید، نام یا کد مال..."
                className="pr-9 h-8 text-sm" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right">شماره رسید</TableHead>
                  <TableHead className="text-xs font-bold text-right">مال مصرفی</TableHead>
                  <TableHead className="text-xs font-bold text-right">نوع رسید</TableHead>
                  <TableHead className="text-xs font-bold text-right">تعداد</TableHead>
                  <TableHead className="text-xs font-bold text-right">مبلغ کل (ریال)</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">رکوردی یافت نشد</TableCell></TableRow>
                ) : filtered.map((row) => {
                  const st = STATUS_STYLE[row.status] ?? STATUS_STYLE.draft;
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={row.id} onClick={() => handleRowClick(row)}
                      className={cn("cursor-pointer transition-colors",
                        selected === row.id ? "bg-primary/10" : "hover:bg-muted/40")}>
                      <TableCell className="font-mono text-xs">{row.receiptNo}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{row.assetTitle}</div>
                        <div className="text-xs text-muted-foreground font-mono">{row.assetCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">{RECEIPT_TYPES.find(t => t.value === row.receiptType)?.label}</TableCell>
                      <TableCell className="font-mono text-sm">{row.quantity} {row.unit}</TableCell>
                      <TableCell className="font-mono text-xs">{fmt(Number(row.quantity) * Number(row.unitPrice || 0))}</TableCell>
                      <TableCell className="text-xs font-mono">{row.receiptDate}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs gap-1", st.badge)}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_OPTIONS.find(s => s.value === row.status)?.label}
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
