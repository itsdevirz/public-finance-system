import { useState } from "react";
import { Save, RotateCcw, AlertCircle, Search } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

const DEPOSIT_TYPES = [
  { value: "performance",  label: "حسن انجام کار" },
  { value: "guarantee",    label: "ضمانت" },
  { value: "advance",      label: "پیش‌پرداخت" },
  { value: "cash_bail",    label: "وثیقه نقدی" },
  { value: "other",        label: "سایر" },
];

const INITIAL = {
  docNumber: "", docDate: "", depositType: "", depositorName: "", depositorCode: "",
  amount: "", bankName: "", accountNumber: "", receiptNumber: "", receiptDate: "",
  contractNumber: "", dueDate: "", description: "",
};

export default function DepositManualForm() {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
      setSaved(false);
    };
  }

  function validate() {
    const e = {};
    if (!form.docDate)       e.docDate       = "الزامی";
    if (!form.depositType)   e.depositType   = "الزامی";
    if (!form.depositorName) e.depositorName = "الزامی";
    if (!form.amount)        e.amount        = "الزامی";
    if (!form.bankName)      e.bankName      = "الزامی";
    if (!form.receiptNumber) e.receiptNumber = "الزامی";
    if (!form.receiptDate)   e.receiptDate   = "الزامی";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSaved(true); }, 800);
  }

  function handleReset() { setForm(INITIAL); setErrors({}); setSaved(false); }

  const SelectField = ({ label, name, required, options }) => (
    <div className="form-group">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}{required && <span className="required">*</span>}
      </Label>
      <select
        id={name}
        value={form[name]}
        onChange={set(name)}
        className={`rounded-lg border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all duration-300 ${errors[name] ? "border-destructive" : "border-input"}`}
      >
        <option value="">انتخاب کنید...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {errors[name] && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors[name]}</p>}
    </div>
  );

  const TextField = ({ label, name, required, placeholder, type }) => (
    <div className="form-group">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}{required && <span className="required">*</span>}
      </Label>
      {type === "date" ? (
        <PersianDatePicker
          id={name}
          value={form[name]}
          onChange={set(name)}
          placeholder={placeholder}
          className={errors[name] ? "border-destructive focus:ring-destructive/30" : ""}
        />
      ) : (
        <Input
          id={name}
          value={form[name]}
          onChange={set(name)}
          placeholder={placeholder}
          className={errors[name] ? "border-destructive focus:ring-destructive/30" : ""}
        />
      )}
      {errors[name] && <p className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors[name]}</p>}
    </div>
  );

  return (
    <PageShell>
      <PageHeader title="ثبت فرم سپرده دستی" description="اطلاعات سپرده را به صورت دستی وارد کنید">
        {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in duration-300">✓ ثبت شد</span>}
      </PageHeader>

      <form onSubmit={handleSubmit}>
        {/* اطلاعات سند */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">اطلاعات سند</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="form-grid">
              <TextField label="شماره سند" name="docNumber" placeholder="خودکار تولید می‌شود" />
              <TextField label="تاریخ سند" name="docDate" required placeholder="۱۴۰۳/۰۱/۰۱" type="date" />
              <SelectField label="نوع سپرده" name="depositType" required options={DEPOSIT_TYPES} />
              <div className="form-group">
                <Label htmlFor="contractNumber">شماره قرارداد مرتبط</Label>
                <div className="relative">
                  <Input id="contractNumber" value={form.contractNumber} onChange={set("contractNumber")} placeholder="جستجو..." className="pr-9" />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* اطلاعات واریزکننده */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">اطلاعات واریزکننده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="form-grid">
              <TextField label="نام واریزکننده" name="depositorName" required />
              <TextField label="کد ملی / شناسه" name="depositorCode" />
              <TextField label="مبلغ (ریال)" name="amount" required placeholder="۰" />
              <TextField label="تاریخ سررسید" name="dueDate" placeholder="۱۴۰۴/۰۱/۰۱" type="date" />
            </div>
          </CardContent>
        </Card>

        {/* اطلاعات بانکی */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">اطلاعات بانکی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="form-grid">
              <TextField label="نام بانک" name="bankName" required />
              <TextField label="شماره حساب" name="accountNumber" />
              <TextField label="شماره فیش/رسید" name="receiptNumber" required />
              <TextField label="تاریخ فیش" name="receiptDate" required placeholder="۱۴۰۳/۰۱/۰۱" type="date" />
            </div>
            <Separator className="my-4" />
            <div className="form-group">
              <Label htmlFor="description">توضیحات</Label>
              <textarea
                id="description" rows={3} value={form.description} onChange={set("description")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary resize-none"
                placeholder="توضیحات تکمیلی..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="form-actions justify-end">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />پاک کردن
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? "در حال ثبت..." : "ثبت سپرده"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
