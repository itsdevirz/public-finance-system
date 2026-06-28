import { useState } from "react";
import { Save, RotateCcw, Search, AlertCircle } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const GUARANTEE_TYPES = [
  { value: "bank",      label: "ضمانت‌نامه بانکی" },
  { value: "insurance", label: "بیمه‌نامه" },
  { value: "check",     label: "چک" },
  { value: "cash",      label: "نقدی" },
  { value: "property",  label: "سند ملکی" },
];

const INITIAL = {
  contractNumber: "", contractDate: "", partyName: "", partyCode: "",
  guaranteeType: "", guaranteeNumber: "", issueDate: "", expiryDate: "",
  amount: "", issuingBank: "", branchName: "", subject: "", description: "",
};

export default function GuaranteeContractForm() {
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
    if (!form.contractNumber) e.contractNumber = "الزامی";
    if (!form.partyName)      e.partyName      = "الزامی";
    if (!form.guaranteeType)  e.guaranteeType  = "الزامی";
    if (!form.guaranteeNumber)e.guaranteeNumber= "الزامی";
    if (!form.issueDate)      e.issueDate      = "الزامی";
    if (!form.expiryDate)     e.expiryDate     = "الزامی";
    if (!form.amount)         e.amount         = "الزامی";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setSaved(true); }, 800);
  }

  function handleReset() {
    setForm(INITIAL);
    setErrors({});
    setSaved(false);
  }

  const Field = ({ label, name, required, type = "text", children }) => (
    <div className="form-group">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="required">*</span>}
      </Label>
      {children ?? (
        <Input
          id={name} type={type}
          value={form[name]}
          onChange={set(name)}
          className={errors[name] ? "border-destructive focus:ring-destructive/30" : ""}
        />
      )}
      {errors[name] && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <PageShell>
      <PageHeader title="ثبت ضمانت‌نامه قرارداد" description="اطلاعات ضمانت‌نامه مربوط به قرارداد را وارد کنید">
        {saved && (
          <span className="text-sm font-medium text-emerald-600 animate-in fade-in duration-300">
            ✓ ذخیره شد
          </span>
        )}
      </PageHeader>

      <form onSubmit={handleSubmit}>
        {/* اطلاعات قرارداد */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              اطلاعات قرارداد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="form-grid">
              <Field label="شماره قرارداد" name="contractNumber" required>
                <div className="relative">
                  <Input
                    id="contractNumber"
                    value={form.contractNumber}
                    onChange={set("contractNumber")}
                    placeholder="جستجو یا وارد کنید..."
                    className={`pr-9 ${errors.contractNumber ? "border-destructive" : ""}`}
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.contractNumber && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {errors.contractNumber}
                  </p>
                )}
              </Field>
              <Field label="تاریخ قرارداد" name="contractDate" type="text" />
              <Field label="طرف قرارداد" name="partyName" required />
              <Field label="کد طرف قرارداد" name="partyCode" />
            </div>
          </CardContent>
        </Card>

        {/* اطلاعات ضمانت‌نامه */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              اطلاعات ضمانت‌نامه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="form-grid">
              <Field label="نوع ضمانت" name="guaranteeType" required>
                <select
                  id="guaranteeType"
                  value={form.guaranteeType}
                  onChange={set("guaranteeType")}
                  className={`form-group input rounded-lg border border-input bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary ${errors.guaranteeType ? "border-destructive" : ""}`}
                >
                  <option value="">انتخاب کنید...</option>
                  {GUARANTEE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.guaranteeType && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {errors.guaranteeType}
                  </p>
                )}
              </Field>
              <Field label="شماره ضمانت‌نامه" name="guaranteeNumber" required />
              <Field label="تاریخ صدور" name="issueDate" required type="text" />
              <Field label="تاریخ انقضا" name="expiryDate" required type="text" />
              <Field label="مبلغ (ریال)" name="amount" required type="text" />
              <Field label="بانک/موسسه صادرکننده" name="issuingBank" />
              <Field label="نام شعبه" name="branchName" />
              <Field label="موضوع ضمانت" name="subject" />
            </div>

            <Separator className="my-4" />

            <div className="form-group">
              <Label htmlFor="description">توضیحات</Label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={set("description")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary resize-none"
                placeholder="توضیحات تکمیلی..."
              />
            </div>
          </CardContent>
        </Card>

        {/* دکمه‌ها */}
        <div className="form-actions justify-end">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            پاک کردن
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4" />
            {loading ? "در حال ذخیره..." : "ثبت ضمانت‌نامه"}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
