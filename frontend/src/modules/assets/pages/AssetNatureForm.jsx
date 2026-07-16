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

const REG_TYPES = [
  { value: "vehicle",  label: "خودرو" },
  { value: "land",     label: "زمین" },
  { value: "building", label: "ساختمان" },
  { value: "other",    label: "سایر" },
];

const INITIAL_FORM = {
  code: "", title: "",
  movable: true,           // منقول = true | غیرمنقول = false
  registerable: false,     // نیاز به ثبت رسمی
  regType: "",             // نوع ثبت: vehicle | land | building | other
  plateNumber: "",         // شماره پلاک (خودرو) — legacy
  plate: { part1: "", letter: "", part2: "", province: "", part3: "" }, // پلاک ساختاریافته
  documentNumber: "",      // شماره سند (زمین/ساختمان)
  trackingCode: "",        // کد رهگیری خرید (زمین/ساختمان بدون سند)
  hasDocument: true,       // دارای سند رسمی هست یا نه (زمین/ساختمان)
  description: "", inactive: false,
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

export default function AssetNatureForm() {
  const { natures, addConfig, updateConfig, deleteConfig } = useAssets();
  const [form, setForm]         = useState(INITIAL_FORM);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [saved, setSaved]       = useState(false);

  const list = natures || [];

  function set(field) {
    return (e) => {
      const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => {
        const next = { ...f, [field]: val };
        // وقتی ثبت رسمی غیرفعال شد، فیلدهای وابسته پاک می‌شن
        if (field === "registerable" && !val) {
          next.regType = "";
          next.plateNumber = "";
          next.plate = { part1: "", letter: "", part2: "", province: "", part3: "" };
          next.documentNumber = "";
          next.trackingCode = "";
          next.hasDocument = true;
        }
        // وقتی نوع ثبت عوض شد، فیلدهای قبلی پاک می‌شن
        if (field === "regType") {
          next.plateNumber = "";
          next.plate = { part1: "", letter: "", part2: "", province: "", part3: "" };
          next.trackingCode = "";
          next.hasDocument = true;
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
    if (!form.code.trim() || !form.title.trim()) return;
    const record = { ...form };
    if (selected !== null) {
      await updateConfig("natures", { ...record, _id: selected, id: selected });
    } else {
      await addConfig("natures", record);
    }
    setSaved(true);
    handleNew();
  }

  async function handleDelete() {
    if (selected === null) return;
    await deleteConfig("natures", selected);
    handleNew();
  }

  function handleRowClick(row) {
    setSelected(row._id || row.id);
    setForm({
      code:        row.code        ?? "",
      title:       row.title       ?? "",
      movable:     row.movable     ?? true,
      registerable:row.registerable?? false,
      regType:     row.regType     ?? "",
      plateNumber: row.plateNumber ?? "",
      plate:       row.plate       ?? { part1: "", letter: "", part2: "", province: "", part3: "" },
      documentNumber: row.documentNumber ?? "",
      trackingCode:row.trackingCode?? "",
      hasDocument: row.hasDocument ?? true,
      description: row.description ?? "",
      inactive:    row.inactive    ?? false,
    });
    setSaved(false);
  }

  const filtered = list.filter(
    (r) =>
      !search ||
      r.code?.includes(search) ||
      r.title?.includes(search)
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
        <span>تعریف ماهیت مال</span>
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
          <h1 className="text-xl font-bold">تعریف ماهیت مال</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت ماهیت‌های منقول، غیرمنقول و شرایط ثبت اسناد رسمی</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="کد ماهیت" required>
              <Input value={form.code} onChange={set("code")} className="h-9 text-sm font-mono text-left" placeholder="مثال: ۰۱" />
            </Field>

            <Field label="عنوان ماهیت" required col={2}>
              <Input value={form.title} onChange={set("title")} className="h-9 text-sm" placeholder="مثال: منقول" />
            </Field>

            <div className="flex gap-6 items-center pt-2">
              <Field label="ماهیت">
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                  <input type="checkbox" checked={form.movable} onChange={set("movable")}
                    className="rounded accent-blue-600 h-4 w-4" />
                  <span className={cn("font-medium", form.movable && "text-blue-600")}>منقول</span>
                </label>
              </Field>

              <Field label="نیاز به ثبت رسمی سند">
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                  <input type="checkbox" checked={form.registerable} onChange={set("registerable")}
                    className="rounded accent-blue-600 h-4 w-4" />
                  <span className={cn("font-medium", form.registerable && "text-blue-600")}>بله</span>
                </label>
              </Field>
            </div>

            {form.registerable && (
              <>
                <Field label="نوع سند رسمی" required>
                  <select value={form.regType} onChange={set("regType")} className="h-9 rounded-md border bg-background px-3 py-1 text-sm">
                    <option value="">انتخاب نوع...</option>
                    {REG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>

                {form.regType === "vehicle" && (
                  <Field label="ساختار پلاک خودرو" col={2}>
                    <div className="flex items-center gap-1.5" dir="ltr">
                      <Input value={form.plate.part1} onChange={(e) => setForm(f => ({...f, plate: {...f.plate, part1: e.target.value}}))} className="w-14 text-center h-9 font-mono" placeholder="12" maxLength={2} />
                      <span className="text-muted-foreground">-</span>
                      <Input value={form.plate.letter} onChange={(e) => setForm(f => ({...f, plate: {...f.plate, letter: e.target.value}}))} className="w-12 text-center h-9" placeholder="الف" maxLength={1} />
                      <span className="text-muted-foreground">-</span>
                      <Input value={form.plate.part2} onChange={(e) => setForm(f => ({...f, plate: {...f.plate, part2: e.target.value}}))} className="w-16 text-center h-9 font-mono" placeholder="345" maxLength={3} />
                      <span className="text-muted-foreground">ایران</span>
                      <Input value={form.plate.province} onChange={(e) => setForm(f => ({...f, plate: {...f.plate, province: e.target.value}}))} className="w-12 text-center h-9 font-mono" placeholder="99" maxLength={2} />
                    </div>
                  </Field>
                )}

                {(form.regType === "land" || form.regType === "building") && (
                  <>
                    <Field label="دارای سند رسمی">
                      <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                        <input type="checkbox" checked={form.hasDocument} onChange={set("hasDocument")}
                          className="rounded accent-blue-600 h-4 w-4" />
                        <span className={cn("font-medium", form.hasDocument && "text-blue-600")}>بله</span>
                      </label>
                    </Field>

                    {form.hasDocument ? (
                      <Field label="شماره سند رسمی" required>
                        <Input value={form.documentNumber} onChange={set("documentNumber")} className="h-9 text-sm font-mono text-left" placeholder="مثال: سند تک برگی" />
                      </Field>
                    ) : (
                      <Field label="کد رهگیری خرید" required>
                        <Input value={form.trackingCode} onChange={set("trackingCode")} className="h-9 text-sm font-mono text-left" placeholder="کد رهگیری ۱۶ رقمی" />
                      </Field>
                    )}
                  </>
                )}
              </>
            )}

            <Field label="توضیحات" col={2}>
              <Input value={form.description} onChange={set("description")} className="h-9 text-sm" placeholder="توضیحات اختیاری..." />
            </Field>

            <Field label="وضعیت">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input type="checkbox" checked={form.inactive} onChange={set("inactive")}
                  className="rounded accent-red-600 h-4 w-4" />
                <span className={cn("font-medium", form.inactive && "text-red-600")}>غیرفعال</span>
              </label>
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
              <Input placeholder="جستجو..." className="pr-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک کردن</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right w-24">کد ماهیت</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان ماهیت</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">نوع ماهیت</TableHead>
                  <TableHead className="text-xs font-bold text-right w-32">نیاز به ثبت رسمی</TableHead>
                  <TableHead className="text-xs font-bold text-right w-32">نوع ثبت</TableHead>
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
                    <TableCell className="text-xs">{row.movable ? "منقول" : "غیرمنقول"}</TableCell>
                    <TableCell className="text-xs">{row.registerable ? "بله" : "خیر"}</TableCell>
                    <TableCell className="text-xs">
                      {REG_TYPES.find((t) => t.value === row.regType)?.label || "—"}
                    </TableCell>
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
