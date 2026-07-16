import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, ArrowRightLeft } from "lucide-react";
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
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

const INITIAL_FORM = {
  assetCode: "", assetTitle: "", brand: "", model: "",
  transferFrom: "", transferTo: "", transferDate: "",
  transferLicense: "", newPersonnel: "", note: "",
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

export default function AssetTransferForm() {
  const { assets, updateAsset } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
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
          next.assetTitle = asset?.assetName ?? "";
          next.brand = asset?.brand ?? "";
          next.model = asset?.model ?? "";
          next.transferFrom = asset?.department || asset?.organization || "—";
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

  async function handleSave() {
    if (!form.assetCode || !form.transferTo.trim() || !form.transferDate.trim()) return;

    const asset = assets.find((a) => a.assetCode === form.assetCode);
    if (!asset) return;

    const updatedAsset = {
      ...asset,
      transferFrom: form.transferFrom,
      transferTo: form.transferTo,
      transferDate: form.transferDate,
      transferLicense: form.transferLicense,
      department: form.transferTo, // Update current department to the new one
      personnelName: form.newPersonnel.trim() || asset.personnelName,
      note: form.note,
    };

    await updateAsset(updatedAsset);
    setSaved(true);
    handleNew();
  }

  async function handleDelete() {
    if (selected === null) return;
    const asset = assets.find((a) => a.assetCode === form.assetCode || a._id === selected || a.id === selected);
    if (!asset) return;

    const revertedAsset = {
      ...asset,
      transferFrom: "",
      transferTo: "",
      transferDate: "",
      transferLicense: "",
      note: "",
    };

    await updateAsset(revertedAsset);
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
    setForm({
      assetCode:       row.assetCode       ?? "",
      assetTitle:      row.assetName       ?? "",
      brand:           row.brand           ?? "",
      model:           row.model           ?? "",
      transferFrom:    row.transferFrom    ?? "",
      transferTo:      row.transferTo      ?? "",
      transferDate:    row.transferDate    ?? "",
      transferLicense: row.transferLicense ?? "",
      newPersonnel:    row.personnelName   ?? "",
      note:            row.note            ?? "",
    });
    setSaved(false);
  }

  // Filter list to transferred assets (where transferTo is populated)
  const transferredList = useMemo(() => {
    return assets.filter((a) => a.transferTo);
  }, [assets]);

  const selectOptions = useMemo(() => {
    return assets
      .filter((a) => a.status === "active" || a.assetCode === form.assetCode)
      .map((a) => ({ value: a.assetCode, label: `${a.assetCode} — ${a.assetName}` }));
  }, [assets, form.assetCode]);

  const filtered = transferredList.filter(
    (r) => !search ||
      r.assetCode?.includes(search) ||
      r.assetName?.includes(search) ||
      r.transferTo?.includes(search) ||
      r.transferFrom?.includes(search)
  );

  const canSave = form.assetCode && form.transferTo.trim() && form.transferDate.trim();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">ثبت اموال</span>
        <span>/</span>
        <span>انتقال اموال</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ثبت انتقال
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}
            disabled={selected === null}
            className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />لغو انتقال
          </Button>
          {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">انتقال اموال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت جابجایی و انتقال اموال و تجهیزات اداری بین واحدهای مختلف</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="انتخاب مال برای انتقال" required col={2}>
              <SearchableSelect
                value={form.assetCode}
                onChange={v => {
                  const asset = assets.find((a) => a.assetCode === v);
                  setForm((f) => ({
                    ...f, assetCode: v,
                    assetTitle:     asset?.assetName      ?? "",
                    brand:          asset?.brand          ?? "",
                    model:          asset?.model          ?? "",
                    transferFrom:   asset?.department || asset?.organization || "—",
                  }));
                  setSaved(false);
                }}
                options={selectOptions}
                placeholder="کد یا نام مال را انتخاب کنید..."
              />
            </Field>

            <Field label="واحد سازمانی مبدا">
              <Input value={form.transferFrom} readOnly className="h-9 text-sm bg-muted/40 font-semibold" />
            </Field>

            <Field label="واحد سازمانی مقصد" required>
              <Input value={form.transferTo} onChange={set("transferTo")} className="h-9 text-sm" placeholder="مثال: کارگزینی" />
            </Field>

            {/* مشخصات مال */}
            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3" dir="rtl">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4 text-xs">
                  {[
                    { label: "نام مال",       value: form.assetTitle },
                    { label: "برند / مدل",    value: [form.brand, form.model].filter(Boolean).join(" / ") || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-1">
                      <span className="text-muted-foreground w-20 shrink-0">{label}:</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Field label="تاریخ جابجایی" required>
              <PersianDatePicker
                value={form.transferDate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, transferDate: e.target.value }));
                  setSaved(false);
                }}
                placeholder="۱۴۰۳/۰۸/۱۰"
              />
            </Field>

            <Field label="شماره مجوز انتقال">
              <Input value={form.transferLicense} onChange={set("transferLicense")} className="h-9 text-sm font-mono text-left" placeholder="L-1403-01" />
            </Field>

            <Field label="تحویل‌گیرنده جدید (پرسنل)">
              <Input value={form.newPersonnel} onChange={set("newPersonnel")} className="h-9 text-sm" placeholder="نام پرسنل تحویل‌گیرنده" />
            </Field>

            <Field label="توضیحات">
              <Input value={form.note} onChange={set("note")} className="h-9 text-sm" placeholder="توضیحات تکمیلی" />
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
              <Input placeholder="جستجو بر اساس کد، نام، مبدا، مقصد..."
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
                  <TableHead className="text-xs font-bold text-right">واحد مبدا</TableHead>
                  <TableHead className="text-xs font-bold text-right w-10"></TableHead>
                  <TableHead className="text-xs font-bold text-right">واحد مقصد</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ جابجایی</TableHead>
                  <TableHead className="text-xs font-bold text-right w-36">شماره مجوز</TableHead>
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
                ) : filtered.map((row) => (
                  <TableRow key={row._id || row.id} onClick={() => handleRowClick(row)}
                    className={cn("cursor-pointer transition-colors",
                      selected === (row._id || row.id) ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                    <TableCell>
                      <div className="text-sm font-medium">{row.assetName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.assetCode}</div>
                    </TableCell>
                    <TableCell className="text-xs">{row.transferFrom || "—"}</TableCell>
                    <TableCell className="text-center text-muted-foreground font-bold">
                      <ArrowRightLeft className="h-3.5 w-3.5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-xs text-blue-600 font-semibold">{row.transferTo}</TableCell>
                    <TableCell className="text-xs font-mono">{row.transferDate}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{row.transferLicense || "—"}</TableCell>
                    <TableCell>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </TableCell>
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
