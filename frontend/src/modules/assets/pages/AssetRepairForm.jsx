import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, CheckCircle2, Clock, Wrench } from "lucide-react";
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

const REPAIR_STATUSES = [
  { value: "repair",   label: "در حال تعمیر" },
  { value: "repaired", label: "تعمیر شده و عودت یافته" },
];

const STATUS_STYLE = {
  repair:   { badge: "bg-amber-100 text-amber-700",   icon: Clock          },
  repaired: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const INITIAL_FORM = {
  assetCode: "", assetTitle: "", assetGroup: "", brand: "", model: "",
  repairShop: "", repairDate: "", repairCost: "",
  repairReason: "", repairLicense: "", returnDate: "",
  repairStatus: "repair", note: "",
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

export default function AssetRepairForm() {
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
          next.assetTitle = asset?.assetName  ?? "";
          next.assetGroup = asset?.assetGroup ?? "";
          next.brand      = asset?.brand      ?? "";
          next.model      = asset?.model      ?? "";
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
    if (!form.assetCode || !form.repairShop.trim() || !form.repairDate.trim()) return;

    const asset = assets.find((a) => a.assetCode === form.assetCode);
    if (!asset) return;

    const updatedAsset = {
      ...asset,
      // If marked as repaired, status goes back to active, otherwise it becomes "repair"
      status: form.repairStatus === "repaired" ? "active" : "repair",
      repairShop: form.repairShop,
      repairDate: form.repairDate,
      repairCost: Number(form.repairCost) || 0,
      repairReason: form.repairReason,
      repairLicense: form.repairLicense,
      returnDate: form.repairStatus === "repaired" ? form.returnDate : "",
      repairStatus: form.repairStatus,
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
      status: "active",
      repairShop: "",
      repairDate: "",
      repairCost: 0,
      repairReason: "",
      repairLicense: "",
      returnDate: "",
      repairStatus: "",
      note: "",
    };

    await updateAsset(revertedAsset);
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
    setForm({
      assetCode:     row.assetCode     ?? "",
      assetTitle:    row.assetName     ?? "",
      assetGroup:    row.assetGroup    ?? "",
      brand:         row.brand         ?? "",
      model:         row.model         ?? "",
      repairShop:    row.repairShop    ?? "",
      repairDate:    row.repairDate    ?? "",
      repairCost:    row.repairCost    ?? "",
      repairReason:  row.repairReason  ?? "",
      repairLicense: row.repairLicense ?? "",
      returnDate:    row.returnDate    ?? "",
      repairStatus:  row.status === "repair" ? "repair" : "repaired",
      note:          row.note          ?? "",
    });
    setSaved(false);
  }

  // Filter list to assets currently in repair or returned from repair
  const inRepairList = useMemo(() => {
    return assets.filter((a) => a.status === "repair" || a.repairShop);
  }, [assets]);

  const selectOptions = useMemo(() => {
    return assets
      .filter((a) => a.status === "active" || a.assetCode === form.assetCode)
      .map((a) => ({ value: a.assetCode, label: `${a.assetCode} — ${a.assetName}` }));
  }, [assets, form.assetCode]);

  const filtered = inRepairList.filter(
    (r) => !search ||
      r.assetCode?.includes(search) ||
      r.assetName?.includes(search) ||
      r.repairShop?.includes(search)
  );

  const stats = useMemo(() => ({
    repair:   inRepairList.filter((r) => r.status === "repair").length,
    repaired: inRepairList.filter((r) => r.status !== "repair" && r.repairShop).length,
  }), [inRepairList]);

  const canSave = form.assetCode && form.repairShop.trim() && form.repairDate.trim();

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">ثبت اموال</span>
        <span>/</span>
        <span>تعمیر اموال</span>
      </div>

      {/* هدر */}
      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!canSave}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />ثبت اطلاعات تعمیر
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}
            disabled={selected === null}
            className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />حذف تعمیر
          </Button>
          {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">تعمیر اموال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت و ردیابی دارایی‌های ارسالی به تعمیرگاه‌ها و نمایندگی‌ها</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-2 gap-4 mb-4" dir="rtl">
        {[
          { key: "repair",   label: "در حال تعمیر",           icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"   },
          { key: "repaired", label: "تعمیر شده و عودت یافته", icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200"},
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={cn("rounded-xl border p-3 text-right animate-in slide-in-from-top-2", bg)}>
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
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="انتخاب مال" required col={2}>
              <SearchableSelect
                value={form.assetCode}
                onChange={v => {
                  const asset = assets.find((a) => a.assetCode === v);
                  setForm((f) => ({
                    ...f, assetCode: v,
                    assetTitle:     asset?.assetName      ?? "",
                    assetGroup:     asset?.assetGroup     ?? "",
                    brand:          asset?.brand          ?? "",
                    model:          asset?.model          ?? "",
                  }));
                  setSaved(false);
                }}
                options={selectOptions}
                placeholder="کد یا نام مال را انتخاب کنید..."
              />
            </Field>

            <Field label="تعمیرگاه طرف قرارداد" required col={2}>
              <Input value={form.repairShop} onChange={set("repairShop")} className="h-9 text-sm" placeholder="نام تعمیرگاه یا نمایندگی" />
            </Field>

            {/* کارت مشخصات مال انتخاب‌شده */}
            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-blue-200 bg-blue-50/40 px-4 py-3" dir="rtl">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4 text-xs">
                  {[
                    { label: "نام مال",       value: form.assetTitle },
                    { label: "گروه",          value: form.assetGroup     || "—" },
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

            <Field label="تاریخ ارسال به تعمیر" required>
              <PersianDatePicker
                value={form.repairDate}
                onChange={(e) => {
                  setForm((f) => ({ ...f, repairDate: e.target.value }));
                  setSaved(false);
                }}
                placeholder="۱۴۰۳/۰۸/۱۰"
              />
            </Field>

            <Field label="هزینه تعمیر (ریال)">
              <Input value={form.repairCost} onChange={set("repairCost")} className="h-9 text-sm font-mono text-left" placeholder="0" />
            </Field>

            <Field label="شماره مجوز تعمیر">
              <Input value={form.repairLicense} onChange={set("repairLicense")} className="h-9 text-sm font-mono text-left" placeholder="مثال: T-1403" />
            </Field>

            <Field label="علت تعمیر">
              <Input value={form.repairReason} onChange={set("repairReason")} className="h-9 text-sm" placeholder="علت نقص فنی" />
            </Field>

            <Field label="وضعیت تعمیر">
              <SearchableSelect
                value={form.repairStatus}
                onChange={(v) => {
                  setForm((f) => ({ ...f, repairStatus: v }));
                  setSaved(false);
                }}
                options={REPAIR_STATUSES}
              />
            </Field>

            {form.repairStatus === "repaired" && (
              <Field label="تاریخ عودت">
                <PersianDatePicker
                  value={form.returnDate}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, returnDate: e.target.value }));
                    setSaved(false);
                  }}
                  placeholder="۱۴۰۳/۰۸/۱۵"
                />
              </Field>
            )}

            <Field label="توضیحات" col={form.repairStatus === "repaired" ? 2 : 3}>
              <Input value={form.note} onChange={set("note")} className="h-9 text-sm" placeholder="توضیحات اختیاری..." />
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
              <Input placeholder="جستجو بر اساس کد، نام، تعمیرگاه..."
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
                  <TableHead className="text-xs font-bold text-right">تعمیرگاه</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ ارسال</TableHead>
                  <TableHead className="text-xs font-bold text-left w-36">هزینه تعمیر (ریال)</TableHead>
                  <TableHead className="text-xs font-bold text-right w-36">وضعیت</TableHead>
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
                ) : filtered.map((row) => {
                  const isInRepair = row.status === "repair";
                  const st = isInRepair ? STATUS_STYLE.repair : STATUS_STYLE.repaired;
                  const StatusIcon = st.icon;
                  return (
                    <TableRow key={row._id || row.id} onClick={() => handleRowClick(row)}
                      className={cn("cursor-pointer transition-colors",
                        selected === (row._id || row.id) ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                      <TableCell>
                        <div className="text-sm font-medium">{row.assetName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{row.assetCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">{row.repairShop}</TableCell>
                      <TableCell className="text-xs font-mono">{row.repairDate}</TableCell>
                      <TableCell className="text-xs font-mono text-left font-semibold text-amber-700">
                        {row.repairCost ? Number(row.repairCost).toLocaleString("fa-IR") : "۰"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs gap-1", st.badge)}>
                          <StatusIcon className="h-3 w-3" />
                          {isInRepair ? "در حال تعمیر" : "تعمیر شده و عودت یافته"}
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
