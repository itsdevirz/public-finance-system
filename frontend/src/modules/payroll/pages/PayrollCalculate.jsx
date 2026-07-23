import { useState, useMemo, useCallback } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calculator, Printer, Save, RefreshCw, Search, TrendingUp, DollarSign,
  Users, ShieldCheck, Info, CheckCircle, AlertCircle, FileText
} from "lucide-react";

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

// ========================
// محاسبه مالیات حقوق 1405
// ========================
function calcTax(annualGross) {
  // معافیت سالانه مالیاتی سال 1405
  const EXEMPTION = 1_440_000_000; // 1 میلیارد و 440 میلیون ریال
  const taxableAnnual = Math.max(0, annualGross - EXEMPTION);

  let tax = 0;
  const brackets = [
    { limit: 500_000_000,  rate: 0.10 },
    { limit: 1_000_000_000, rate: 0.15 },
    { limit: 2_000_000_000, rate: 0.20 },
    { limit: Infinity,      rate: 0.25 }
  ];

  let remaining = taxableAnnual;
  let prev = 0;
  for (const b of brackets) {
    const slice = Math.min(remaining, b.limit - prev);
    if (slice <= 0) break;
    tax += slice * b.rate;
    remaining -= slice;
    prev = b.limit;
    if (remaining <= 0) break;
  }

  return Math.round(tax / 12); // مالیات ماهانه
}

// ========================
// محاسبه حق بیمه تامین اجتماعی
// ========================
const INS_EMPLOYEE_RATE = 0.07;   // سهم کارمند بیمه تامین اجتماعی 7%
const INS_EMPLOYER_RATE = 0.20;   // سهم کارفرما بیمه تامین اجتماعی 20%
const INS_UNEMPLOY_RATE = 0.03;   // بیمه بیکاری 3%

// نرخ‌های بیمه درمان
const HEALTH_INS_EMPLOYEE_RATE = 0.02;  // سهم کارمند بیمه درمان 2%
const HEALTH_INS_EMPLOYER_RATE = 0.02;  // سهم کارفرما/دستگاه بیمه درمان 2%
const HEALTH_INS_GOVT_RATE     = 0.03;  // سهم دولت بیمه درمان 3%

function calcPayrollRow(emp, decree, attRec, advances, loans, selectedYear, selectedMonth) {
  const DAYS_IN_MONTH = 30;

  // حقوق پایه ماهانه از آخرین حکم یا اطلاعات کارمند ثبت شده
  const baseSalary     = Number(decree?.baseSalary     ?? emp.baseSalary ?? (emp.dailyBaseSalary ? emp.dailyBaseSalary * 30 : 0) ?? 0);
  const housingAllow   = Number(decree?.housingAllowance   ?? emp.housingAllowance   ?? 30_000_000);
  const groceryAllow   = Number(decree?.groceryAllowance   ?? emp.groceryAllowance   ?? 22_000_000);
  const childAllow     = Number(decree?.childAllowance     ?? emp.childAllowance     ?? 0);
  const seniority      = Number(decree?.seniorityPay       ?? emp.seniorityPay       ?? 0);
  const responsibility = Number(decree?.responsibilityAllowance ?? emp.responsibilityAllowance ?? 0);
  const expertise      = Number(decree?.expertiseAllowance ?? emp.expertiseAllowance ?? 0);
  const transportAllow = Number(decree?.transportAllowance ?? emp.transportAllowance ?? 0);
  const other          = Number(decree?.otherAllowances    ?? emp.otherAllowances    ?? 0);

  // کارکرد از رکورد حضور/غیاب
  const workedDays     = attRec ? Number(attRec.workedDays     ?? DAYS_IN_MONTH) : DAYS_IN_MONTH;
  const overtimeHours  = attRec ? Number(attRec.overtimeHours  ?? 0) : 0;
  const absenceDays    = attRec ? Number(attRec.absenceDays    ?? 0) : 0;
  const tardinessHours = attRec ? Number(attRec.tardinessHours ?? 0) : 0;

  // حقوق پایه بر اساس کارکرد واقعی
  const dailyRate       = baseSalary / DAYS_IN_MONTH;
  const earnedBaseSalary = Math.round(dailyRate * workedDays);

  // اضافه‌کار: 1.4 × نرخ ساعتی × ساعات (نرخ ساعتی = حقوق پایه / 176)
  const hourlyRate      = baseSalary / 176;
  const overtimePay     = Math.round(hourlyRate * 1.4 * overtimeHours);

  // کسر تأخیر: 1 × نرخ ساعتی
  const tardinessDeduct = Math.round(hourlyRate * tardinessHours);

  // کسر غیبت
  const absenceDeduct   = Math.round(dailyRate * absenceDays);

  // بارگذاری مزایای سفارشی از تنظیمات حقوق
  let customAllowances = [];
  try {
    const savedSettings = localStorage.getItem("payroll_settings");
    if (savedSettings) {
      customAllowances = JSON.parse(savedSettings).customAllowances || [];
    }
  } catch (_) {}

  const customAllowancesSum = customAllowances.reduce((sum, allow) => sum + Number(allow.defaultValue || 0), 0);
  const customFieldsData = {};
  customAllowances.forEach(allow => {
    customFieldsData[allow.key] = Number(allow.defaultValue || 0);
  });

  // جمع ناخالص حقوق
  const grossSalary = earnedBaseSalary + housingAllow + groceryAllow + childAllow
                    + seniority + responsibility + expertise + transportAllow + other + overtimePay + customAllowancesSum;

  // مبنای بیمه (حقوق پایه + مزایای مشمول بیمه)
  const insBase        = earnedBaseSalary + seniority + responsibility + expertise + transportAllow + other;
  const insEmployee    = Math.round(insBase * INS_EMPLOYEE_RATE);
  const insEmployer    = Math.round(insBase * INS_EMPLOYER_RATE);
  const insUnemploy    = Math.round(insBase * INS_UNEMPLOY_RATE);
  const totalInsurance = insEmployee + insEmployer + insUnemploy;

  // بیمه درمان (مبنا = حقوق ناخالص)
  const healthInsEmployee = Math.round(grossSalary * HEALTH_INS_EMPLOYEE_RATE);
  const healthInsEmployer = Math.round(grossSalary * HEALTH_INS_EMPLOYER_RATE);
  const healthInsGovt     = Math.round(grossSalary * HEALTH_INS_GOVT_RATE);

  // مالیات ماهانه (بر اساس ناخالص سالانه و وضعیت معافیت مالیاتی کارمند)
  const taxStatus      = decree?.taxStatus || emp?.taxStatus || "taxable";
  const isExempt       = taxStatus === "exempt";
  const annualGross    = grossSalary * 12;
  const monthlyTax     = isExempt ? 0 : calcTax(annualGross);

  // محاسبه کسر مساعده
  const empId = emp._id || emp.id;
  const empAdvances = (advances || []).filter(
    a => String(a.employeeId) === String(empId) &&
         String(a.year) === String(selectedYear) &&
         String(a.month) === String(selectedMonth) &&
         a.active !== false
  );
  const advanceDeduct = empAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

  // محاسبه کسر قسط وام فعال
  const empLoans = (loans || []).filter(
    l => String(l.employeeId) === String(empId) &&
         l.active !== false
  );
  let loanDeduct = 0;
  empLoans.forEach(loan => {
    const startY = Number(loan.startYear) || 1405;
    const startM = Number(loan.startMonth) || 1;
    const count = Number(loan.installmentsCount) || 12;
    const paidCount = Number(loan.paidInstallmentsCount) || 0;
    
    const currentY = Number(selectedYear);
    const currentM = Number(selectedMonth);
    
    const startTotalMonths = startY * 12 + startM;
    const currentTotalMonths = currentY * 12 + currentM;
    
    if (currentTotalMonths >= startTotalMonths && paidCount < count) {
      loanDeduct += Number(loan.monthlyInstallment) || 0;
    }
  });

  // جمع کسورات
  const totalDeductions = insEmployee + healthInsEmployee + monthlyTax + tardinessDeduct + absenceDeduct + advanceDeduct + loanDeduct;

  // خالص قابل پرداخت
  const netSalary      = Math.max(0, grossSalary - totalDeductions);

  return {
    empId: emp._id || emp.id,
    employeeCode: emp.code || "—",
    employeeName: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
    jobTitle: emp.jobTitle || emp.role || "—",
    // کارکرد
    workedDays,
    overtimeHours,
    absenceDays,
    tardinessHours,
    // اقلام حقوقی
    earnedBaseSalary,
    housingAllow,
    groceryAllow,
    childAllow,
    seniority,
    responsibility,
    expertise,
    transportAllow,
    other,
    overtimePay,
    grossSalary,
    // کسورات
    insEmployee,
    insEmployer,
    insUnemploy,
    healthInsEmployee,
    healthInsEmployer,
    healthInsGovt,
    monthlyTax,
    taxStatus,
    isExempt,
    tardinessDeduct,
    absenceDeduct,
    advanceDeduct,
    loanDeduct,
    totalDeductions,
    // خالص
    netSalary,
    // فیلدهای سفارشی
    ...customFieldsData,
    // پشتیبانی
    hasDecree:  !!decree,
    hasAttRec:  !!attRec
  };
}

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function PayrollCalculate() {
  const {
    employees, employeeDecrees, attendanceRecords,
    payrollCalculations, employeeLoans, employeeAdvances, addConfig, updateConfig, refreshAllConfigs
  } = useAssets();

  const [selectedYear,  setSelectedYear]  = useState("1405");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [search,        setSearch]        = useState("");
  const [isSaving,      setIsSaving]      = useState(false);
  const [isCalculated,  setIsCalculated]  = useState(false);
  const [rows,          setRows]          = useState([]);
  const [successMsg,    setSuccessMsg]    = useState("");
  const [errorMsg,      setErrorMsg]      = useState("");

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";

  // بررسی آیا این دوره قبلاً محاسبه و ذخیره شده
  const savedCalcKey = `${selectedYear}-${selectedMonth}`;
  const savedCalcs = useMemo(() => {
    return (payrollCalculations || []).filter(
      c => String(c.year) === String(selectedYear) && String(c.month) === String(selectedMonth)
    );
  }, [payrollCalculations, selectedYear, selectedMonth]);

  // اجرای محاسبه حقوق
  const runCalculation = useCallback(() => {
    if (!employees || employees.length === 0) {
      setErrorMsg("هیچ کارمندی در سیستم ثبت نشده است.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");

    const result = employees.map(emp => {
      const empId = emp._id || emp.id;

      // آخرین حکم کارگزینی معتبر
      const decree = [...(employeeDecrees || [])]
        .filter(d => d.employeeId === empId)
        .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""))
        [0] || null;

      // رکورد کارکرد این ماه
      const attRec = (attendanceRecords || []).find(
        r => String(r.year) === String(selectedYear) &&
             String(r.month) === String(selectedMonth) &&
             r.employeeId === empId
      ) || null;

      return calcPayrollRow(emp, decree, attRec, employeeAdvances, employeeLoans, selectedYear, selectedMonth);
    });

    setRows(result);
    setIsCalculated(true);
  }, [employees, employeeDecrees, attendanceRecords, employeeAdvances, employeeLoans, selectedYear, selectedMonth]);

  // ذخیره نتایج محاسبه در پایگاه‌داده
  async function handleSaveAll() {
    if (rows.length === 0) return;
    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await Promise.all(rows.map(async row => {
        const existing = savedCalcs.find(c => c.employeeId === row.empId);
        const payload = {
          year: Number(selectedYear),
          month: selectedMonth,
          employeeId: row.empId,
          employeeCode: row.employeeCode,
          employeeName: row.employeeName,
          ...row
        };
        if (existing) {
          await updateConfig("payroll_calculations", { ...payload, id: existing._id || existing.id, _id: existing._id || existing.id });
        } else {
          await addConfig("payroll_calculations", payload);
        }
      }));

      await refreshAllConfigs();
      setSuccessMsg(`محاسبه حقوق ${monthLabel} ${selectedYear} با موفقیت ذخیره شد و آماده صدور فیش حقوقی است.`);
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ذخیره‌سازی محاسبات حقوق.");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(r => !q || r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q));
  }, [rows, search]);

  // آمار خلاصه
  const totals = useMemo(() => ({
    gross:      rows.reduce((s, r) => s + r.grossSalary, 0),
    insEmp:     rows.reduce((s, r) => s + r.insEmployee, 0),
    insEmpr:    rows.reduce((s, r) => s + r.insEmployer, 0),
    insUnemp:   rows.reduce((s, r) => s + r.insUnemploy, 0),
    tax:        rows.reduce((s, r) => s + r.monthlyTax, 0),
    deductions: rows.reduce((s, r) => s + r.totalDeductions, 0),
    net:        rows.reduce((s, r) => s + r.netSalary, 0),
    noDecree:   rows.filter(r => !r.hasDecree).length,
    noAttRec:   rows.filter(r => !r.hasAttRec).length
  }), [rows]);

  // چاپ خلاصه لیست حقوق (A4 Landscape)
  function printSummary() {
    const orgName = localStorage.getItem("org_name") || "سازمان";
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;

    const tableRows = filteredRows.map((r, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td class="c">${i + 1}</td>
        <td class="c mono">${r.employeeCode}</td>
        <td class="b">${r.employeeName}</td>
        <td class="c">${r.workedDays}/${r.overtimeHours}ساعت</td>
        <td class="r mono">${fmt(r.grossSalary)}</td>
        <td class="r mono">${fmt(r.insEmployee)}</td>
        <td class="r mono">${r.isExempt || r.taxStatus === "exempt" ? "معاف (ماده ۹۱)" : fmt(r.monthlyTax)}</td>
        <td class="r mono">${fmt(r.totalDeductions)}</td>
        <td class="r mono b">${fmt(r.netSalary)}</td>
        <td class="c">${!r.hasDecree ? "⚠ فاقد حکم" : !r.hasAttRec ? "پیش‌فرض" : "✓"}</td>
      </tr>
    `).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>لیست حقوق ${monthLabel} ${selectedYear}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm 10mm; }
    body { font-family: Tahoma, sans-serif; font-size: 10px; color: #111; direction: rtl; }
    .hdr { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #222; padding-bottom:8px; margin-bottom:10px; }
    .hdr h1 { font-size:13px; font-weight:900; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #555; padding:4px 5px; }
    thead th { background:#e0e0e0!important; font-weight:bold; text-align:center; }
    .c { text-align:center; } .r { text-align:left; } .b { font-weight:bold; } .mono { font-family:Courier; }
    .alt { background:#f8f8f8; }
    .total-row td { background:#ddeeff!important; font-weight:bold; }
    .footer { display:grid; grid-template-columns:1fr 1fr 1fr; text-align:center; margin-top:30px; }
    .footer-col { border-top:1px solid #333; padding-top:5px; font-weight:bold; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>${orgName}</div>
    <h1>لیست حقوق و دستمزد — ${monthLabel} ماه ${selectedYear}</h1>
    <div>تاریخ چاپ: ${new Date().toLocaleDateString("fa-IR")}</div>
  </div>
  <table>
    <thead><tr>
      <th>ردیف</th><th>کد</th><th>نام پرسنل</th>
      <th>کارکرد/اضافه‌کار</th>
      <th>ناخالص حقوق</th><th>بیمه(سهم کارمند)</th><th>مالیات</th>
      <th>جمع کسورات</th><th>خالص قابل پرداخت</th><th>توضیح</th>
    </tr></thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td colspan="4" class="c b">جمع کل (${filteredRows.length} نفر)</td>
        <td class="r mono b">${fmt(totals.gross)}</td>
        <td class="r mono b">${fmt(totals.insEmp)}</td>
        <td class="r mono b">${fmt(totals.tax)}</td>
        <td class="r mono b">${fmt(totals.deductions)}</td>
        <td class="r mono b">${fmt(totals.net)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    <div class="footer-col">محاسبه‌کننده: امور مالی</div>
    <div class="footer-col">تأییدکننده: رئیس حسابداری</div>
    <div class="footer-col">تأیید نهایی: مدیر منابع انسانی</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body></html>`);
    win.document.close();
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">

      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-600" />
            محاسبه حقوق و دستمزد ماهانه پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            محاسبه خودکار ناخالص، بیمه تأمین اجتماعی، مالیات حقوق و خالص قابل پرداخت بر اساس احکام و کارکرد ثبت‌شده.
          </p>
        </div>
      </div>

      {/* پیام‌ها */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {/* انتخاب دوره */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-semibold">سال مالی</Label>
              <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setIsCalculated(false); setRows([]); }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                <option value="1405">۱۴۰۵</option>
                <option value="1404">۱۴۰۴</option>
                <option value="1403">۱۴۰۳</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">ماه</Label>
              <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setIsCalculated(false); setRows([]); }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={runCalculation}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow flex-1">
                <Calculator className="h-4 w-4" /> اجرای محاسبه حقوق
              </Button>
            </div>
            {isCalculated && (
              <div className="flex gap-2">
                <Button onClick={handleSaveAll} disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 shadow flex-1">
                  <Save className="h-4 w-4" /> {isSaving ? "در حال ذخیره..." : "ذخیره محاسبات"}
                </Button>
                <Button variant="outline" size="sm" onClick={printSummary} className="h-9 text-xs gap-1.5">
                  <Printer className="h-4 w-4" /> چاپ لیست
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* هشدار دوره قبلاً ذخیره شده */}
      {savedCalcs.length > 0 && !isCalculated && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>محاسبه حقوق <strong>{monthLabel} {selectedYear}</strong> قبلاً برای <strong>{savedCalcs.length}</strong> نفر ذخیره شده است. برای مشاهده مجدد دکمه «اجرای محاسبه» را بزنید.</span>
        </div>
      )}

      {/* کارت‌های آمار */}
      {isCalculated && rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "ناخالص کل حقوق",           value: fmt(totals.gross) + " ر",     icon: DollarSign,  color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
            { label: "جمع بیمه (کارمند)",         value: fmt(totals.insEmp) + " ر",    icon: ShieldCheck, color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "جمع مالیات",                value: fmt(totals.tax) + " ر",       icon: FileText,    color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-950/40" },
            { label: "خالص قابل پرداخت",          value: fmt(totals.net) + " ر",       icon: TrendingUp,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          ].map((s, i) => (
            <Card key={i} className={`border-0 shadow-sm ${s.bg}`}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <div className={`text-sm font-black ${s.color} font-mono`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* هشدارهای کیفیت داده */}
      {isCalculated && (totals.noDecree > 0 || totals.noAttRec > 0) && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs p-3 rounded-xl flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {totals.noDecree > 0 && <p>⚠ <strong>{totals.noDecree}</strong> نفر فاقد حکم کارگزینی معتبر هستند. حقوق آنها بر اساس صفر محاسبه شده.</p>}
            {totals.noAttRec > 0 && <p>⚠ <strong>{totals.noAttRec}</strong> نفر رکورد کارکرد این ماه ندارند. کارکرد کامل (۳۰ روز) پیش‌فرض گرفته شده.</p>}
          </div>
        </div>
      )}

      {/* جدول محاسبه */}
      {isCalculated && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="text-right border-b pb-3 flex flex-row justify-between items-center space-y-0">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-indigo-600" />
                جزئیات محاسبه حقوق — {monthLabel} {selectedYear} ({rows.length} نفر)
              </CardTitle>
              <CardDescription className="text-xs mt-1">واحد: ریال. بیمه کارفرما برای اطلاع نمایش داده می‌شود و از حقوق کسر نمی‌گردد.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو پرسنل..." className="h-8 text-xs w-44" />
            </div>
          </CardHeader>
          <CardContent className="pt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-[10px]">
                  <TableHead className="text-right text-white">کد / نام</TableHead>
                  <TableHead className="text-center text-white">کارکرد<br/><span className="font-normal text-[9px]">(روز / اضافه‌کار)</span></TableHead>
                  <TableHead className="text-left font-mono text-white">حقوق پایه<br/><span className="font-normal text-[9px]">بر اساس کارکرد</span></TableHead>
                  <TableHead className="text-left font-mono text-white">مسکن + خوار</TableHead>
                  <TableHead className="text-left font-mono text-white">اضافه‌کار</TableHead>
                  <TableHead className="text-left font-mono font-bold text-white">ناخالص</TableHead>
                  <TableHead className="text-left font-mono text-white border-r border-slate-200/50 pr-3">بیمه کارمند</TableHead>
                  <TableHead className="text-left font-mono text-white">بیمه کارفرما<br/><span className="font-normal text-[9px]">(برای اطلاع)</span></TableHead>
                  <TableHead className="text-left font-mono text-white">مالیات</TableHead>
                  <TableHead className="text-left font-mono text-white">کسر کارکرد</TableHead>
                  <TableHead className="text-left font-mono font-bold text-white border-r border-slate-200/50 pr-3">خالص پرداخت</TableHead>
                  <TableHead className="text-center text-white">وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center text-xs text-muted-foreground">
                      نتیجه‌ای یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map(r => (
                  <TableRow key={r.empId} className={`text-[11px] ${!r.hasDecree ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                    <TableCell>
                      <div className="font-bold text-slate-900 dark:text-white">{r.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.employeeCode} · {r.jobTitle}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <div className="font-bold">{r.workedDays} روز</div>
                      {r.overtimeHours > 0 && <div className="text-[10px] text-amber-600">+{r.overtimeHours}ساعت</div>}
                    </TableCell>
                    <TableCell className="text-left font-mono text-slate-700">{fmt(r.earnedBaseSalary)}</TableCell>
                    <TableCell className="text-left font-mono text-slate-500">{fmt(r.housingAllow + r.groceryAllow)}</TableCell>
                    <TableCell className="text-left font-mono text-amber-600">{r.overtimePay > 0 ? fmt(r.overtimePay) : "—"}</TableCell>
                    <TableCell className="text-left font-mono font-bold text-indigo-700">{fmt(r.grossSalary)}</TableCell>
                    <TableCell className="text-left font-mono text-blue-600 border-r border-slate-100 dark:border-slate-800 pr-3">{fmt(r.insEmployee)}</TableCell>
                    <TableCell className="text-left font-mono text-orange-500 text-[10px]">{fmt(r.insEmployer)}</TableCell>
                    <TableCell className="text-left font-mono text-rose-600">
                      {r.isExempt || r.taxStatus === "exempt" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[9px] py-0 px-1 font-sans">
                          معاف (ماده ۹۱)
                        </Badge>
                      ) : (
                        fmt(r.monthlyTax)
                      )}
                    </TableCell>
                    <TableCell className="text-left font-mono text-slate-500">
                      {(r.tardinessDeduct + r.absenceDeduct + (r.advanceDeduct || 0) + (r.loanDeduct || 0)) > 0 
                        ? fmt(r.tardinessDeduct + r.absenceDeduct + (r.advanceDeduct || 0) + (r.loanDeduct || 0)) 
                        : "—"}
                    </TableCell>
                    <TableCell className="text-left font-mono font-bold text-emerald-700 text-sm border-r border-slate-100 dark:border-slate-800 pr-3">{fmt(r.netSalary)}</TableCell>
                    <TableCell className="text-center">
                      {!r.hasDecree
                        ? <Badge className="bg-amber-100 text-amber-700 text-[9px]">فاقد حکم</Badge>
                        : !r.hasAttRec
                        ? <Badge className="bg-slate-100 text-slate-500 text-[9px]">کارکرد پیش‌فرض</Badge>
                        : <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">تکمیل</Badge>}
                    </TableCell>
                  </TableRow>
                ))}

                {/* ردیف جمع کل */}
                <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold text-xs border-t-2">
                  <TableCell colSpan={5} className="text-right">جمع کل ({filteredRows.length} نفر)</TableCell>
                  <TableCell className="text-left font-mono text-indigo-800">{fmt(totals.gross)}</TableCell>
                  <TableCell className="text-left font-mono text-blue-700 border-r border-slate-200 dark:border-slate-700 pr-3">{fmt(totals.insEmp)}</TableCell>
                  <TableCell className="text-left font-mono text-orange-600">{fmt(totals.insEmpr)}</TableCell>
                  <TableCell className="text-left font-mono text-rose-700">{fmt(totals.tax)}</TableCell>
                  <TableCell className="text-left font-mono text-slate-600">{fmt(totals.deductions - totals.insEmp - totals.tax)}</TableCell>
                  <TableCell className="text-left font-mono text-emerald-800 text-sm border-r border-slate-200 dark:border-slate-700 pr-3">{fmt(totals.net)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* خلاصه بیمه کارفرما برای اطلاع */}
            <div className="mt-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 rounded-lg p-3 text-xs text-orange-800 dark:text-orange-200 flex flex-wrap gap-4">
              <span className="font-bold">🏦 بار مالی کارفرما (برای اطلاع):</span>
              <span>بیمه سهم کارفرما: <strong>{fmt(totals.insEmpr)}</strong> ریال</span>
              <span>بیمه بیکاری: <strong>{fmt(totals.insUnemp)}</strong> ریال</span>
              <span>جمع بار کارفرما: <strong>{fmt(totals.insEmpr + totals.insUnemp)}</strong> ریال</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
