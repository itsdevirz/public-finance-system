import { useState, useMemo } from "react";
import { Calculator, Save, Printer, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── جدول مالیات سال ۱۴۰۳ ─────────────────────────────────────────────────
const TAX_BRACKETS = [
  { from: 0,           to: 5_000_000,   rate: 0   },
  { from: 5_000_000,   to: 10_000_000,  rate: 0.10 },
  { from: 10_000_000,  to: 20_000_000,  rate: 0.15 },
  { from: 20_000_000,  to: 40_000_000,  rate: 0.20 },
  { from: 40_000_000,  to: Infinity,    rate: 0.25 },
];

const INSURANCE_RATE = 0.07; // سهم کارگر

function calcTax(gross) {
  let tax = 0;
  for (const b of TAX_BRACKETS) {
    if (gross <= b.from) break;
    const taxable = Math.min(gross, b.to) - b.from;
    tax += taxable * b.rate;
  }
  return Math.round(tax);
}

function parseNum(v) {
  if (!v && v !== 0) return 0;
  const n = Number(String(v).replace(/[۰-۹]/g, c => c.charCodeAt(0) - 0x06F0).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function fmt(n) { return parseNum(n).toLocaleString("fa-IR"); }

const SAMPLE_EMPLOYEES = [
  { id: 1, code: "P001", name: "علی احمدی",   position: "کارشناس IT",    dept: "فناوری اطلاعات", base: 15_000_000, children: 2, married: true,  insured: true },
  { id: 2, code: "P002", name: "مریم حسینی",  position: "حسابدار",       dept: "مالی",            base: 12_000_000, children: 1, married: true,  insured: true },
  { id: 3, code: "P003", name: "رضا کریمی",   position: "مدیر اداری",    dept: "اداری",           base: 22_000_000, children: 0, married: false, insured: true },
];

const INIT_ATTENDANCE = { workDays: "26", overtimeH: "0", nightH: "0", holidayH: "0", missionDays: "0", absenceDays: "0", unpaidLeave: "0" };
const INIT_BENEFITS   = { housing: "900000", food: "2200000", childAllowance: "1500000", marriage: "400000", hardship: "0", special: "0" };
const INIT_DEDUCTIONS = { loan: "0", advance: "0", other: "0" };

function Section({ title, open, onToggle, children }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors">
        <span className="text-sm font-semibold">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function FRow({ label, value, highlight, sub }) {
  return (
    <div className={cn("flex items-center justify-between py-1.5 text-sm border-b last:border-0", highlight && "font-bold text-primary", sub && "text-muted-foreground text-xs pr-4")}>
      <span>{label}</span>
      <span className="font-mono">{fmt(value)} ریال</span>
    </div>
  );
}

export default function PayrollCalculate() {
  const [selectedEmp,  setSelectedEmp]  = useState(SAMPLE_EMPLOYEES[0]);
  const [attendance,   setAttendance]   = useState(INIT_ATTENDANCE);
  const [benefits,     setBenefits]     = useState(INIT_BENEFITS);
  const [deductions,   setDeductions]   = useState(INIT_DEDUCTIONS);
  const [sections,     setSections]     = useState({ attendance: true, benefits: true, deductions: true, result: true });
  const [saved,        setSaved]        = useState(false);

  function setA(f) { return e => setAttendance(p => ({ ...p, [f]: e.target.value })); }
  function setB(f) { return e => setBenefits(p => ({ ...p, [f]: e.target.value })); }
  function setD(f) { return e => setDeductions(p => ({ ...p, [f]: e.target.value })); }
  function toggle(k) { setSections(s => ({ ...s, [k]: !s[k] })); }

  const calc = useMemo(() => {
    const base        = selectedEmp.base;
    const dailyWage   = Math.round(base / 30);
    const hourlyWage  = Math.round(base / 220);

    const workDays    = parseNum(attendance.workDays);
    const overtimeH   = parseNum(attendance.overtimeH);
    const nightH      = parseNum(attendance.nightH);
    const holidayH    = parseNum(attendance.holidayH);
    const missionDays = parseNum(attendance.missionDays);
    const absenceDays = parseNum(attendance.absenceDays);

    // کارکرد
    const earnedBase  = dailyWage * workDays;
    // اضافه کاری: نرخ ساعت × 1.4 × ساعات
    const overtime    = Math.round(hourlyWage * 1.4 * overtimeH);
    // شب کاری: نرخ ساعت × 1.35
    const nightWork   = Math.round(hourlyWage * 1.35 * nightH);
    // تعطیل کاری: نرخ ساعت × 1.4
    const holidayWork = Math.round(hourlyWage * 1.4 * holidayH);
    // مأموریت: روزانه × تعداد روز
    const mission     = dailyWage * missionDays;
    // جریمه غیبت
    const absencePenalty = dailyWage * absenceDays;

    // مزایا
    const housing     = parseNum(benefits.housing);
    const food        = parseNum(benefits.food);
    const childAllow  = parseNum(benefits.childAllowance) * selectedEmp.children;
    const marriage    = selectedEmp.married ? parseNum(benefits.marriage) : 0;
    const hardship    = parseNum(benefits.hardship);
    const special     = parseNum(benefits.special);
    const totalBenefits = housing + food + childAllow + marriage + hardship + special;

    // ناخالص
    const gross = earnedBase + overtime + nightWork + holidayWork + mission + totalBenefits;

    // کسورات
    const insurance   = selectedEmp.insured ? Math.round(gross * INSURANCE_RATE) : 0;
    const tax         = calcTax(gross);
    const loan        = parseNum(deductions.loan);
    const advance     = parseNum(deductions.advance);
    const otherDed    = parseNum(deductions.other);
    const totalDeductions = insurance + tax + loan + advance + otherDed + absencePenalty;

    const net = gross - totalDeductions;

    return {
      dailyWage, hourlyWage,
      earnedBase, overtime, nightWork, holidayWork, mission,
      housing, food, childAllow, marriage, hardship, special, totalBenefits,
      gross, insurance, tax, loan, advance, otherDed, absencePenalty,
      totalDeductions, net,
    };
  }, [selectedEmp, attendance, benefits, deductions]);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const F = ({ label, field, setter }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={field} onChange={setter} className="h-8 text-sm" />
    </div>
  );

  return (
    <PageShell>
      <PageHeader title="محاسبه حقوق ماهانه" description="محاسبه خودکار حقوق بر اساس کارکرد و مزایا">
        {saved && <span className="text-sm font-medium text-emerald-600 animate-in fade-in duration-200">✓ ذخیره شد</span>}
      </PageHeader>

      {/* انتخاب کارمند */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_EMPLOYEES.map((emp) => (
              <button key={emp.id} onClick={() => setSelectedEmp(emp)}
                className={cn("rounded-xl border px-4 py-2 text-sm transition-all duration-200",
                  selectedEmp.id === emp.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>
                <span className="font-medium">{emp.name}</span>
                <span className="mr-2 text-xs opacity-70">{emp.position}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            {[
              { label: "کد پرسنلی",    value: selectedEmp.code },
              { label: "واحد",          value: selectedEmp.dept },
              { label: "حقوق پایه",    value: fmt(selectedEmp.base) + " ریال" },
              { label: "تعداد فرزند",  value: selectedEmp.children },
            ].map((i) => (
              <div key={i.label} className="rounded-lg bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">{i.label}</p>
                <p className="font-medium font-mono">{i.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {/* کارکرد */}
          <Section title="کارکرد ماه" open={sections.attendance} onToggle={() => toggle("attendance")}>
            <div className="form-grid">
              <F label="روز کارکرد"         field={attendance.workDays}    setter={setA("workDays")} />
              <F label="اضافه‌کاری (ساعت)"  field={attendance.overtimeH}   setter={setA("overtimeH")} />
              <F label="شب‌کاری (ساعت)"     field={attendance.nightH}      setter={setA("nightH")} />
              <F label="تعطیل‌کاری (ساعت)"  field={attendance.holidayH}    setter={setA("holidayH")} />
              <F label="مأموریت (روز)"      field={attendance.missionDays} setter={setA("missionDays")} />
              <F label="غیبت (روز)"         field={attendance.absenceDays} setter={setA("absenceDays")} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-muted-foreground">مزد روزانه</p>
                <p className="font-mono font-semibold">{fmt(calc.dailyWage)} ریال</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <p className="text-muted-foreground">نرخ ساعتی</p>
                <p className="font-mono font-semibold">{fmt(calc.hourlyWage)} ریال</p>
              </div>
            </div>
          </Section>

          {/* مزایا */}
          <Section title="مزایا" open={sections.benefits} onToggle={() => toggle("benefits")}>
            <div className="form-grid">
              <F label="حق مسکن"         field={benefits.housing}        setter={setB("housing")} />
              <F label="بن کارگری"       field={benefits.food}           setter={setB("food")} />
              <F label="حق اولاد (هر فرزند)" field={benefits.childAllowance} setter={setB("childAllowance")} />
              <F label="حق تأهل"         field={benefits.marriage}       setter={setB("marriage")} />
              <F label="سختی کار"        field={benefits.hardship}       setter={setB("hardship")} />
              <F label="فوق‌العاده ویژه" field={benefits.special}        setter={setB("special")} />
            </div>
            {selectedEmp.children > 0 && (
              <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">
                حق اولاد × {selectedEmp.children} فرزند = {fmt(calc.childAllow)} ریال
              </p>
            )}
          </Section>

          {/* کسورات */}
          <Section title="کسورات اضافی" open={sections.deductions} onToggle={() => toggle("deductions")}>
            <div className="form-grid">
              <F label="اقساط وام"  field={deductions.loan}    setter={setD("loan")} />
              <F label="مساعده"     field={deductions.advance} setter={setD("advance")} />
              <F label="سایر"       field={deductions.other}   setter={setD("other")} />
            </div>
          </Section>
        </div>

        {/* فیش حقوقی */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  فیش حقوقی — {selectedEmp.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long" })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* مزایا */}
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">مزایا</p>
              <div className="mb-3 rounded-xl bg-muted/20 p-3">
                <FRow label="حقوق پایه (کارکرد)"      value={calc.earnedBase}    />
                <FRow label="حق مسکن"                  value={calc.housing}       sub />
                <FRow label="بن کارگری"                value={calc.food}          sub />
                {calc.childAllow > 0 && <FRow label={`حق اولاد (${selectedEmp.children} فرزند)`} value={calc.childAllow} sub />}
                {calc.marriage   > 0 && <FRow label="حق تأهل"        value={calc.marriage}    sub />}
                {calc.hardship   > 0 && <FRow label="سختی کار"       value={calc.hardship}    sub />}
                {calc.special    > 0 && <FRow label="فوق‌العاده ویژه" value={calc.special}    sub />}
                {calc.overtime   > 0 && <FRow label="اضافه‌کاری"     value={calc.overtime}    sub />}
                {calc.nightWork  > 0 && <FRow label="شب‌کاری"        value={calc.nightWork}   sub />}
                {calc.holidayWork> 0 && <FRow label="تعطیل‌کاری"     value={calc.holidayWork} sub />}
                {calc.mission    > 0 && <FRow label="مأموریت"        value={calc.mission}     sub />}
              </div>

              <div className="mb-3 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5">
                <span className="font-semibold text-sm">جمع ناخالص</span>
                <span className="font-mono font-bold text-primary">{fmt(calc.gross)} ریال</span>
              </div>

              {/* کسورات */}
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">کسورات</p>
              <div className="mb-3 rounded-xl bg-muted/20 p-3">
                {selectedEmp.insured && <FRow label={`بیمه (${(INSURANCE_RATE * 100).toFixed(0)}٪)`} value={calc.insurance} />}
                <FRow label="مالیات"           value={calc.tax}           />
                {calc.loan         > 0 && <FRow label="اقساط وام"   value={calc.loan}        sub />}
                {calc.advance      > 0 && <FRow label="مساعده"       value={calc.advance}     sub />}
                {calc.absencePenalty>0 && <FRow label="جریمه غیبت"  value={calc.absencePenalty} sub />}
                {calc.otherDed     > 0 && <FRow label="سایر"         value={calc.otherDed}    sub />}
              </div>

              <div className="mb-4 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-2.5">
                <span className="font-semibold text-sm">جمع کسورات</span>
                <span className="font-mono font-bold text-destructive">{fmt(calc.totalDeductions)} ریال</span>
              </div>

              <Separator className="mb-4" />

              <div className="flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5">
                <span className="font-bold text-white">خالص پرداختی</span>
                <span className="font-mono text-xl font-bold text-white">{fmt(calc.net)} ریال</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> چاپ فیش
                </Button>
                <Button size="sm" className="flex-1" onClick={handleSave}>
                  <Save className="h-4 w-4" /> ذخیره
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
