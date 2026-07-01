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
import { SearchableSelect } from "@/components/ui/searchable-select";

const LOST_REASONS = [
  { value: "theft",    label: "سرقت" },
  { value: "missing",  label: "مفقود — محل نامعلوم" },
  { value: "disaster", label: "حوادث طبیعی (سیل، آتش‌سوزی)" },
  { value: "other",    label: "سایر دلایل" },
];

const FOLLOW_STATUSES = [
  { value: "reported",  label: "گزارش داده شده" },
  { value: "police",    label: "شکایت به مراجع قضایی" },
  { value: "recovered", label: "بازیابی شده" },
  { value: "closed",    label: "پرونده مختومه" },
];

const STATUS_STYLE = {
  reported:  { badge: "bg-amber-100 text-amber-700",    icon: Clock          },
  police:    { badge: "bg-red-100 text-red-700",         icon: AlertTriangle  },
  recovered: { badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2  },
  closed:    { badge: "bg-slate-100 text-slate-600",     icon: Pencil        },
};

const SAMPLE_DATA = [
  {
    id: 1, assetCode: "A001", assetTitle: "لپ‌تاپ Dell Latitude 5520",
    lostReason: "theft", lostDate: "1403/07/20",
    followStatus: "police", policeReportNumber: "PR-1403-045",
    responsiblePerson: "علی رضایی", note: "سرقت از دفتر طبقه اول",
  },
];

const INITIAL_FORM = {
  assetCode: "", assetTitle: "", assetGroup: "", assetBrand: "", assetModel: "",
  purchaseAmount: "",
  lostReason: "missing", lostDate: "",
  followStatus: "reported",
  policeReportNumber: "",
  responsiblePerson: "", responsibleCode: "",
  insuranceClaim: false, insuranceNumber: "",
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

export default function AssetLostForm() {
  const { assets } = useAssets();
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

  function handleNew() { setForm(INITIAL_FORM); setSelected(null); setSaved(false); }

  function handleSave() {
    if (!form.assetCode || !form.lostDate.trim()) return;
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
      assetCode:          row.assetCode          ?? "",
      assetTitle:         row.assetTitle         ?? "",
      assetGroup:         asset?.assetGroup      ?? "",
      assetBrand:         asset?.brand           ?? "",
      assetModel:         asset?.model           ?? "",
      purchaseAmount:     asset?.purchaseAmount  ?? "",
      lostReason:         row.lostReason         ?? "missing",
      lostDate:           row.lostDate           ?? "",
      followStatus:       row.followStatus       ?? "reported",
      policeReportNumber: row.policeReportNumber ?? "",
      responsiblePerson:  row.responsiblePerson  ?? "",
      responsibleCode:    row.responsibleCode    ?? "",
      insuranceClaim:     row.insuranceClaim     ?? false,
      insuranceNumber:    row.insuranceNumber    ?? "",
      note:               row.note              ?? "",
    });
    setSaved(false);
  }

  const filtered = list.filter((r) =>
    !search || r.assetCode?.includes(search) || r.assetTitle?.includes(search) ||
    r.responsiblePerson?.includes(search) || r.policeReportNumber?.includes(search)
  );

  const stats = useMemo(() => ({
    reported:  list.filter((r) => r.followStatus === "reported").length,
    police:    list.filter((r) => r.followStatus === "police").length,
    recovered: list.filter((r) => r.followStatus === "recovered").length,
    closed:    list.filter((r) => r.followStatus === "closed").length,
  }), [list]);

  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 cursor-pointer hover:underline">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 cursor-pointer hover:underline">ثبت اموال</span>
        <span>/</span>
        <span>ثبت مفقودی</span>
      </div>

      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={!form.assetCode || !form.lostDate.trim()}
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
            <Save className="h-4 w-4" />ثبت مفقودی
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-4 w-4" />جدید
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}
            disabled={selected === null} className="gap-1.5 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />حذف
          </Button>
          {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in">✓ ذخیره شد</span>}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold">ثبت مفقودی</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت و پیگیری اموال مفقود یا مسروقه</p>
        </div>
      </div>

      {/* آمار */}
      <div className="grid grid-cols-4 gap-3 mb-4" dir="rtl">
        {[
          { key: "reported",  label: "گزارش شده",         color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"    },
          { key: "police",    label: "شکایت قضایی",        color: "text-red-600",     bg: "bg-red-50 border-red-200"         },
          { key: "recovered", label: "بازیابی شده",        color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          { key: "closed",    label: "مختومه",             color: "text-slate-600",   bg: "bg-slate-50 border-slate-200"    },
        ].map(({ key, label, color, bg }) => (
          <div key={key} className={cn("rounded-xl border p-3 text-right", bg)}>
            <span className={cn("text-2xl font-bold", color)}>{stats[key]}</span>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* فرم */}
      <Card className="shadow-sm mb-4">
        <CardContent className="pt-5 px-6 pb-5 space-y-5">

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
            <Field label="مال" required col={2}>
              <SearchableSelect
                value={form.assetCode} onChange={v => {
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

            <Field label="وضعیت پیگیری" required col={2}>
              <SearchableSelect value={form.followStatus} onChange={v => { setForm(f => ({...f, followStatus: v})); setSaved(false); }} options={FOLLOW_STATUSES} />
            </Field>

            {form.assetTitle && (
              <div className="col-span-full rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3" dir="rtl">
                <p className="text-xs font-bold text-amber-700 mb-2">مشخصات مال انتخاب‌شده</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 md:grid-cols-4 text-xs">
                  {[
                    { label: "نام مال",   value: form.assetTitle },
                    { label: "گروه",      value: form.assetGroup || "—" },
                    { label: "برند/مدل",  value: [form.assetBrand, form.assetModel].filter(Boolean).join(" / ") || "—" },
                    { label: "قیمت خرید", value: form.purchaseAmount ? Number(form.purchaseAmount).toLocaleString("fa-IR") + " ریال" : "—" },
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

          {/* اطلاعات مفقودی */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-xs font-bold text-primary mb-3">اطلاعات مفقودی</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
              <Field label="دلیل مفقودی" required>
                <SearchableSelect value={form.lostReason} onChange={v => { setForm(f => ({...f, lostReason: v})); setSaved(false); }} options={LOST_REASONS} />
              </Field>
              <Field label="تاریخ مفقودی" required>
                <Input value={form.lostDate} onChange={set("lostDate")}
                  className="h-9 text-sm" placeholder="۱۴۰۳/۰۷/۲۰" />
              </Field>
              <Field label="شماره گزارش به مراجع قضایی">
                <Input value={form.policeReportNumber} onChange={set("policeReportNumber")}
                  className="h-9 text-sm font-mono" dir="ltr" placeholder="PR-1403-045" />
              </Field>
              <Field label="بیمه">
                <label className="flex items-center gap-2 text-sm cursor-pointer pt-1.5">
                  <input type="checkbox" checked={form.insuranceClaim} onChange={set("insuranceClaim")}
                    className="rounded accent-blue-600" />
                  <span className={cn("font-medium", form.insuranceClaim && "text-blue-600")}>
                    ادعای خسارت بیمه
                  </span>
                </label>
              </Field>
              {form.insuranceClaim && (
                <Field label="شماره پرونده بیمه">
                  <Input value={form.insuranceNumber} onChange={set("insuranceNumber")}
                    className="h-9 text-sm font-mono" dir="ltr" />
                </Field>
              )}
            </div>
          </div>

          {/* مسئول */}
          <div className="rounded-xl border bg-muted/20 px-5 py-4">
            <p className="text-xs font-bold text-primary mb-3">مسئول مال</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" dir="rtl">
              <Field label="نام مسئول" col={2}>
                <Input value={form.responsiblePerson} onChange={set("responsiblePerson")}
                  className="h-9 text-sm" placeholder="نام و نام خانوادگی" />
              </Field>
              <Field label="کد پرسنلی مسئول">
                <Input value={form.responsibleCode} onChange={set("responsibleCode")}
                  className="h-9 text-sm font-mono" dir="ltr" />
              </Field>
              <Field label="توضیحات" col={2}>
                <Input value={form.note} onChange={set("note")}
                  className="h-9 text-sm" placeholder="شرح حادثه یا توضیحات تکمیلی" />
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
              <Input placeholder="جستجو..." className="pr-9 h-8 text-sm"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>پاک</Button>
            <span className="text-xs text-muted-foreground mr-auto">{filtered.length} رکورد</span>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-bold text-right">مال</TableHead>
                  <TableHead className="text-xs font-bold text-right">دلیل</TableHead>
                  <TableHead className="text-xs font-bold text-right w-28">تاریخ</TableHead>
                  <TableHead className="text-xs font-bold text-right">مسئول</TableHead>
                  <TableHead className="text-xs font-bold text-right">وضعیت پیگیری</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground text-sm">رکوردی یافت نشد</TableCell></TableRow>
                ) : filtered.map((row) => {
                  const st = STATUS_STYLE[row.followStatus] ?? STATUS_STYLE.reported;
                  const Icon = st.icon;
                  return (
                    <TableRow key={row.id} onClick={() => handleRowClick(row)}
                      className={cn("cursor-pointer transition-colors",
                        selected === row.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/40")}>
                      <TableCell>
                        <div className="text-sm font-medium">{row.assetTitle}</div>
                        <div className="text-xs text-muted-foreground font-mono">{row.assetCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">{LOST_REASONS.find((r) => r.value === row.lostReason)?.label}</TableCell>
                      <TableCell className="text-xs font-mono">{row.lostDate}</TableCell>
                      <TableCell className="text-sm">{row.responsiblePerson || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("text-xs gap-1", st.badge)}>
                          <Icon className="h-3 w-3" />
                          {FOLLOW_STATUSES.find((s) => s.value === row.followStatus)?.label}
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
