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

// ─── نمونه داده اولیه ────────────────────────────────────────────────────────
const SAMPLE_DATA = [
  { id: 1, code: "01", title: "منقول",              movable: true,  registerable: false, description: "اموالی که قابل جابجایی هستند",              inactive: false },
  { id: 2, code: "02", title: "غیرمنقول",           movable: false, registerable: true,  description: "اموالی که قابل جابجایی نیستند (زمین، ساختمان)", inactive: false },
  { id: 3, code: "03", title: "منقول ثبتی",         movable: true,  registerable: true,  description: "اموال منقول نیازمند ثبت رسمی (خودرو)",        inactive: false },
  { id: 4, code: "04", title: "غیرمنقول طبیعی",     movable: false, registerable: false, description: "زمین و منابع طبیعی",                          inactive: false },
];

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
  const [form, setForm]         = useState(INITIAL_FORM);
  const [list, setList]         = useState(SAMPLE_DATA);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [saved, setSaved]       = useState(false);

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
      code:           row.code           ?? "",
      title:          row.title          ?? "",
      movable:        row.movable        ?? true,
      registerable:   row.registerable   ?? false,
      regType:        row.regType        ?? "",
      plateNumber:    row.plateNumber    ?? "",
      plate:          row.plate          ?? { part1: "", letter: "", part2: "", province: "", part3: "" },
      documentNumber: row.documentNumber ?? "",
      trackingCode:   row.trackingCode   ?? "",
      hasDocument:    row.hasDocument    ?? true,
      description:    row.description    ?? "",
      inactive:       row.inactive       ?? false,
    });
    setSaved(false);
  }

  const filtered = list.filter(
    (r) => !search || r.code?.includes(search) || r.title?.includes(search)
  );

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
          <Button
            size="sm" onClick={handleSave}
            disabled={!form.code.trim() || !form.title.trim()}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />ثبت
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button
            variant="outline" size="sm" onClick={handleDelete}
            disabled={selected === null}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />حذف
          </Button>
          {saved && (
            <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">تعریف ماهیت مال (منقول/غیرمنقول)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">تعریف ماهیت اموال از نظر قابلیت جابجایی</p>
        </div>
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4" dir="rtl">

            {/* کد */}
            <Field label="کد ماهیت" required>
              <Input
                value={form.code}
                onChange={set("code")}
                className="h-9 text-sm font-mono"
                dir="ltr"
                maxLength={4}
                placeholder="مثال: 01"
              />
            </Field>

            {/* عنوان */}
            <Field label="عنوان ماهیت" required col={2}>
              <Input
                value={form.title}
                onChange={set("title")}
                className="h-9 text-sm"
                placeholder="عنوان ماهیت مال را وارد کنید"
              />
            </Field>

            {/* غیرفعال */}
            <Field label="وضعیت">
              <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                <input
                  type="checkbox"
                  checked={form.inactive}
                  onChange={set("inactive")}
                  className="rounded accent-destructive"
                />
                <span className={cn("font-medium", form.inactive && "text-destructive")}>
                  غیرفعال
                </span>
              </label>
            </Field>

            {/* ماهیت: منقول / غیرمنقول */}
            <div className="col-span-2 rounded-xl border bg-muted/20 px-5 py-4">
              <p className="text-xs font-bold text-primary mb-3">ماهیت مال</p>
              <div className="flex items-center gap-10">
                {[
                  { v: true,  l: "منقول",      desc: "قابل جابجایی است" },
                  { v: false, l: "غیرمنقول",   desc: "قابل جابجایی نیست" },
                ].map(({ v, l, desc }) => (
                  <label key={l} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="movable"
                      checked={form.movable === v}
                      onChange={() => { setForm((f) => ({ ...f, movable: v })); setSaved(false); }}
                      className="accent-blue-600 mt-0.5"
                    />
                    <div>
                      <span className={cn("text-sm font-medium", form.movable === v && "text-blue-600")}>{l}</span>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* نیاز به ثبت رسمی */}
            <div className="col-span-full rounded-xl border bg-muted/20 px-5 py-4 space-y-4">
              <p className="text-xs font-bold text-primary">ثبت رسمی</p>

              {/* تیک اصلی */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.registerable}
                  onChange={set("registerable")}
                  className="rounded accent-blue-600 h-4 w-4"
                />
                <div>
                  <span className={cn("font-medium", form.registerable && "text-blue-600")}>
                    نیاز به ثبت رسمی دارد
                  </span>
                  <p className="text-xs text-muted-foreground">
                    مانند خودرو، زمین و ساختمان که نیاز به سند رسمی دارند.
                  </p>
                </div>
              </label>

              {/* انتخاب نوع — فقط وقتی تیک فعاله */}
              {form.registerable && (
                <div className="space-y-4 border-t pt-4">
                  {/* نوع ثبت */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">نوع مال ثبتی</p>
                    <div className="flex flex-wrap gap-5">
                      {REG_TYPES.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="regType"
                            value={value}
                            checked={form.regType === value}
                            onChange={set("regType")}
                            className="accent-blue-600"
                          />
                          <span className={cn("font-medium", form.regType === value && "text-blue-600")}>
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* فیلدهای خودرو */}
                  {form.regType === "vehicle" && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/40 px-4 py-3 space-y-3">
                      <p className="text-xs font-bold text-blue-700">مشخصات خودرو — شماره پلاک</p>

                      {/* پلاک ایرانی */}
                      <div className="flex items-center gap-1 flex-wrap" dir="ltr">

                        {/* بخش ۱: ۲ رقم (10-99) */}
                        <input
                          type="number"
                          min={10} max={99}
                          value={form.plate.part1}
                          onChange={(e) => setForm((f) => ({ ...f, plate: { ...f.plate, part1: e.target.value } }))}
                          placeholder="۱۲"
                          className="w-14 h-11 rounded-lg border-2 border-input bg-background text-center text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        />

                        {/* جداکننده */}
                        <span className="text-muted-foreground text-lg font-bold px-0.5">-</span>

                        {/* بخش ۲: حرف فارسی */}
                        <select
                          value={form.plate.letter}
                          onChange={(e) => setForm((f) => ({ ...f, plate: { ...f.plate, letter: e.target.value } }))}
                          className="w-16 h-11 rounded-lg border-2 border-input bg-background text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 appearance-none cursor-pointer"
                          style={{ direction: "rtl" }}
                        >
                          <option value="">—</option>
                          {["الف","ب","پ","ت","ث","ج","چ","ح","خ","د","ذ","ر","ز","ژ","س","ش","ص","ط","ع","ف","ق","ک","گ","ل","م","ن","و","ه","ی"].map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>

                        {/* جداکننده */}
                        <span className="text-muted-foreground text-lg font-bold px-0.5">-</span>

                        {/* بخش ۳: ۳ رقم (100-999) */}
                        <input
                          type="number"
                          min={100} max={999}
                          value={form.plate.part2}
                          onChange={(e) => setForm((f) => ({ ...f, plate: { ...f.plate, part2: e.target.value } }))}
                          placeholder="۳۴۵"
                          className="w-20 h-11 rounded-lg border-2 border-input bg-background text-center text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        />

                        {/* ایران */}
                        <div className="flex flex-col items-center justify-center w-16 h-11 rounded-lg border-2 border-blue-400 bg-blue-600 text-white text-xs font-bold select-none">
                          <span className="text-[10px] leading-none">🇮🇷</span>
                          <span className="leading-none mt-0.5">ایران</span>
                        </div>

                        {/* جداکننده */}
                        <span className="text-muted-foreground text-lg font-bold px-0.5">-</span>

                        {/* بخش ۵: ۲ رقم (10-99) */}
                        <input
                          type="number"
                          min={10} max={99}
                          value={form.plate.part3}
                          onChange={(e) => setForm((f) => ({ ...f, plate: { ...f.plate, part3: e.target.value } }))}
                          placeholder="۷۸"
                          className="w-14 h-11 rounded-lg border-2 border-input bg-background text-center text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                        />
                      </div>

                      {/* نمایش پلاک کامل */}
                      {(form.plate.part1 || form.plate.letter || form.plate.part2) && (
                        <p className="text-xs text-blue-600 font-mono mt-1">
                          پلاک: {form.plate.part1 || "__"} {form.plate.letter || "_"} {form.plate.part2 || "___"} ایران {form.plate.province || "___"} - {form.plate.part3 || "__"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* فیلدهای زمین / ساختمان */}
                  {(form.regType === "land" || form.regType === "building") && (
                    <div className="rounded-lg border border-violet-200 bg-violet-50/40 px-4 py-3 space-y-3">
                      <p className="text-xs font-bold text-violet-700">
                        مشخصات {form.regType === "land" ? "زمین" : "ساختمان"}
                      </p>

                      {/* دارای سند رسمی؟ */}
                      <div className="flex items-center gap-6">
                        {[
                          { v: true,  l: "دارای سند رسمی" },
                          { v: false, l: "بدون سند رسمی (کد رهگیری)" },
                        ].map(({ v, l }) => (
                          <label key={l} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="hasDocument"
                              checked={form.hasDocument === v}
                              onChange={() => setForm((f) => ({ ...f, hasDocument: v, documentNumber: "", trackingCode: "" }))}
                              className="accent-violet-600"
                            />
                            <span className={cn("font-medium", form.hasDocument === v && "text-violet-700")}>{l}</span>
                          </label>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-3">
                        {form.hasDocument ? (
                          <Field label="شماره سند رسمی" required>
                            <Input
                              value={form.documentNumber}
                              onChange={set("documentNumber")}
                              className="h-9 text-sm font-mono"
                              dir="ltr"
                              placeholder="شماره سند ثبتی"
                            />
                          </Field>
                        ) : (
                          <Field label="کد رهگیری خرید" required>
                            <Input
                              value={form.trackingCode}
                              onChange={set("trackingCode")}
                              className="h-9 text-sm font-mono"
                              dir="ltr"
                              placeholder="کد رهگیری سامانه"
                            />
                          </Field>
                        )}
                      </div>
                    </div>
                  )}

                  {/* سایر */}
                  {form.regType === "other" && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-3">
                      <p className="text-xs font-bold text-amber-700 mb-2">سایر موارد ثبتی</p>
                      <Field label="شماره سند / مرجع ثبت">
                        <Input
                          value={form.documentNumber}
                          onChange={set("documentNumber")}
                          className="h-9 text-sm font-mono"
                          dir="ltr"
                          placeholder="شماره مرجع"
                        />
                      </Field>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* توضیحات */}
            <Field label="توضیحات" col={2}>
              <Input
                value={form.description}
                onChange={set("description")}
                className="h-9 text-sm"
                placeholder="توضیحات اضافی (اختیاری)"
              />
            </Field>

          </div>
        </CardContent>
      </Card>

      {/* جدول */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس کد یا عنوان..."
                className="pr-9 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right w-16">کد</TableHead>
                  <TableHead className="text-xs font-bold text-right">عنوان</TableHead>
                  <TableHead className="text-xs font-bold text-right">ماهیت</TableHead>
                  <TableHead className="text-xs font-bold text-right">ثبت رسمی</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت</TableHead>
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
                ) : (
                  filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selected === row.id
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-muted/40"
                      )}
                    >
                      <TableCell className="font-mono text-sm font-bold">{row.code}</TableCell>
                      <TableCell className="text-sm font-medium">{row.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            row.movable
                              ? "bg-sky-100 text-sky-700"
                              : "bg-orange-100 text-orange-700"
                          )}
                        >
                          {row.movable ? "منقول" : "غیرمنقول"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.registerable ? (
                          <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                            ثبت رسمی
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.inactive ? (
                          <Badge variant="destructive" className="text-xs">غیرفعال</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">فعال</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
