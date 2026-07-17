import { useState, useMemo, useEffect } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Search, Printer, CheckCircle2, AlertCircle, FileCheck, Eye, RefreshCw, Send, Landmark
} from "lucide-react";
import { toPersianDigits, toEnglishDigits } from "./InsuranceSettings";

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

// تبدیل عدد به حروف فارسی
function numToPersianWords(num) {
  if (num === 0) return "صفر";
  if (num < 0) return "منفی " + numToPersianWords(Math.abs(num));
  
  const yekan = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const dahgan = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const dahYek = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const sadgan = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const steps = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const getWord = (n) => {
    let s = "";
    const sad = Math.floor(n / 100);
    const dah = Math.floor((n % 100) / 10);
    const yek = n % 10;

    if (sad > 0) s += sadgan[sad] + " و ";
    if (dah === 1) {
      s += dahYek[yek] + " و ";
    } else {
      if (dah > 0) s += dahgan[dah] + " و ";
      if (yek > 0) s += yekan[yek] + " و ";
    }
    return s.slice(0, -3); // remove last " و "
  };

  let str = "";
  let stepIdx = 0;
  let remaining = num;

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkStr = getWord(chunk);
      str = chunkStr + (steps[stepIdx] ? " " + steps[stepIdx] : "") + (str ? " و " + str : "");
    }
    remaining = Math.floor(remaining / 1000);
    stepIdx++;
  }

  return str.trim();
}

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function PayslipForm() {
  const { employees, employeeDecrees, payrollCalculations, employeeLoans, employeeAdvances, refreshAllConfigs } = useAssets();

  const [selectedYear, setSelectedYear] = useState("1405");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [search, setSearch] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // شبیه‌سازی صدور فیش‌ها با localStorage
  const [issuedPeriods, setIssuedPeriods] = useState(() => {
    try {
      const saved = localStorage.getItem("issued_payslips");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";

  // فیلتر کردن محاسبات حقوق مربوط به این سال و ماه
  const monthCalcs = useMemo(() => {
    return (payrollCalculations || []).filter(
      c => String(c.year) === String(selectedYear) && String(c.month) === String(selectedMonth)
    );
  }, [payrollCalculations, selectedYear, selectedMonth]);

  // فیلتر کردن بر اساس جستجو
  const filteredCalcs = useMemo(() => {
    const q = search.toLowerCase();
    return monthCalcs.filter(
      r => !q || r.employeeName.toLowerCase().includes(q) || r.employeeCode.toLowerCase().includes(q)
    );
  }, [monthCalcs, search]);

  // فیش حقوقی کارمند انتخاب شده فعلی
  const selectedCalc = useMemo(() => {
    if (!selectedEmpId) return null;
    const calc = monthCalcs.find(c => c.employeeId === selectedEmpId) || null;
    if (!calc) return null;

    // محاسبات پویای مساعده کارمند برای کسر در فیش این ماه
    const empId = calc.employeeId;
    const empAdvances = (employeeAdvances || []).filter(
      a => String(a.employeeId) === String(empId) &&
           String(a.year) === String(selectedYear) &&
           String(a.month) === String(selectedMonth) &&
           a.active !== false
    );
    const advanceDeduct = calc.advanceDeduct ?? empAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

    // محاسبات پویای اقساط وام فعال برای کسر در فیش این ماه
    const empLoans = (employeeLoans || []).filter(
      l => String(l.employeeId) === String(empId) &&
           l.active !== false
    );
    let loanDeduct = calc.loanDeduct ?? 0;
    if (calc.loanDeduct === undefined) {
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
    }

    const totalDeductions = (calc.insEmployee || 0) + (calc.monthlyTax || 0) + (calc.tardinessDeduct || 0) + (calc.absenceDeduct || 0) + advanceDeduct + loanDeduct;
    const netSalary = Math.max(0, calc.grossSalary - totalDeductions);

    return {
      ...calc,
      advanceDeduct,
      loanDeduct,
      totalDeductions,
      netSalary
    };
  }, [monthCalcs, selectedEmpId, employeeAdvances, employeeLoans, selectedYear, selectedMonth]);

  // جزئیات پرسنل و حکم کارمند منتخب برای درج در هدر فیش
  const selectedDetails = useMemo(() => {
    if (!selectedCalc) return null;
    const emp = employees.find(e => (e._id || e.id) === selectedCalc.employeeId);
    const decree = [...(employeeDecrees || [])]
      .filter(d => d.employeeId === selectedCalc.employeeId)
      .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""))
      [0] || null;
    return { emp, decree };
  }, [selectedCalc, employees, employeeDecrees]);

  // بررسی وضعیت صدور این دوره
  const isPeriodIssued = useMemo(() => {
    const key = `${selectedYear}-${selectedMonth}`;
    return issuedPeriods.includes(key);
  }, [issuedPeriods, selectedYear, selectedMonth]);

  // انتخاب اولین کارمند به صورت خودکار در صورت تغییر ماه/سال
  useEffect(() => {
    if (monthCalcs.length > 0) {
      setSelectedEmpId(monthCalcs[0].employeeId);
    } else {
      setSelectedEmpId(null);
    }
    setSuccessMsg("");
    setErrorMsg("");
  }, [selectedYear, selectedMonth, monthCalcs]);

  // صدور فیش‌ها برای دوره جاری
  function handleIssuePayslips() {
    if (monthCalcs.length === 0) {
      setErrorMsg("هیچ محاسبه حقوقی برای این ماه ثبت نشده است و امکان صدور فیش وجود ندارد.");
      return;
    }
    const key = `${selectedYear}-${selectedMonth}`;
    if (issuedPeriods.includes(key)) {
      setSuccessMsg("فیش‌های حقوقی این ماه قبلاً صادر شده‌اند.");
      return;
    }
    const next = [...issuedPeriods, key];
    setIssuedPeriods(next);
    localStorage.setItem("issued_payslips", JSON.stringify(next));
    setSuccessMsg(`صدور فیش‌های حقوقی پرسنل برای ${monthLabel} ماه سال ${selectedYear} با موفقیت انجام شد.`);
  }

  // لغو صدور فیش‌ها
  function handleCancelIssue() {
    const key = `${selectedYear}-${selectedMonth}`;
    const next = issuedPeriods.filter(k => k !== key);
    setIssuedPeriods(next);
    localStorage.setItem("issued_payslips", JSON.stringify(next));
    setSuccessMsg(`وضعیت صدور فیش‌های حقوقی ${monthLabel} ماه سال ${selectedYear} لغو شد.`);
  }

  // تولید کدهای HTML فیش حقوقی برای چاپ تکی
  function getPayslipHtml(calc, details, orgName) {
    const emp = details?.emp;
    const dec = details?.decree;

    // اقلام پرداختنی
    const earnings = [
      { label: "حقوق پایه (دستمزد مبنا)", val: calc.earnedBaseSalary },
      { label: "حق مسکن", val: calc.housingAllow ?? 30000000 },
      { label: "بن کارگری (خواربار)", val: calc.groceryAllow ?? 22000000 },
      { label: "حق اولاد", val: calc.childAllow || 0 },
      { label: "پایه سنوات", val: calc.seniority || 0 },
      { label: "فوق‌العاده مسئولیت/جذب", val: calc.responsibility || 0 },
      { label: "فوق‌العاده تخصصی", val: calc.expertise || 0 },
      { label: "حقوق اضافه‌کاری", val: calc.overtimePay || 0 },
      { label: "سایر مزایا و کارکردها", val: calc.other || 0 },
    ].filter(x => x.val > 0);

    const totalEarnings = calc.grossSalary;

    // اقلام کسورات
    const deductions = [
      { label: "بیمه سهم کارمند (۷٪)", val: calc.insEmployee },
      { label: "مالیات حقوق ماهانه", val: calc.monthlyTax || 0 },
      { label: "کسر کارکرد تأخیر ورود", val: calc.tardinessDeduct || 0 },
      { label: "کسر غیبت ماهانه", val: calc.absenceDeduct || 0 },
      { label: "مساعده حقوق", val: calc.advanceDeduct || 0 },
      { label: "اقساط وام", val: calc.loanDeduct || 0 },
    ].filter(x => x.val > 0);

    const totalDeductions = calc.totalDeductions;
    const netPay = calc.netSalary;
    const netWords = numToPersianWords(netPay);

    return `
      <div class="payslip-container">
        <div class="payslip-border">
          <!-- هدر فیش -->
          <div class="payslip-header">
            <div class="logo-area">${orgName}</div>
            <div class="title-area">
              <h2>فیش حقوق و دستمزد ماهانه</h2>
              <div class="period">${monthLabel} ماه سال ${toPersianDigits(selectedYear)}</div>
            </div>
            <div class="date-area">تاریخ چاپ: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
          </div>
          
          <!-- اطلاعات پرسنل -->
          <div class="info-grid">
            <div><strong>کد پرسنلی:</strong> ${toPersianDigits(calc.employeeCode)}</div>
            <div><strong>نام و نام خانوادگی:</strong> ${calc.employeeName}</div>
            <div><strong>کد ملی:</strong> ${toPersianDigits(emp?.nationalId || "—")}</div>
            <div><strong>عنوان شغل:</strong> ${calc.jobTitle}</div>
            <div><strong>شماره بیمه:</strong> ${toPersianDigits(emp?.insuranceNo || "—")}</div>
            <div><strong>شماره حساب:</strong> ${toPersianDigits(emp?.bankAccount || emp?.accountNo || "—")}</div>
            <div><strong>روزهای کارکرد موظف:</strong> ${toPersianDigits(calc.workedDays)} روز</div>
            <div><strong>اضافه‌کاری:</strong> ${toPersianDigits(calc.overtimeHours)} ساعت</div>
          </div>

          <!-- جدول اقلام حقوقی -->
          <div class="tables-section">
            <!-- ستون پرداخت ها -->
            <div class="table-col">
              <table>
                <thead><tr><th>مزایا و ناخالص پرداختی</th><th>مبلغ (ریال)</th></tr></thead>
                <tbody>
                  ${earnings.map(e => `<tr><td>${e.label}</td><td class="r mono">${fmt(e.val)}</td></tr>`).join("")}
                  <!-- پرکننده فضا برای هم‌ارتفاع شدن ستون‌ها -->
                  ${Array(Math.max(0, deductions.length - earnings.length)).fill(0).map(() => `<tr><td>&nbsp;</td><td></td></tr>`).join("")}
                  <tr class="total-row"><td>جمع ناخالص حقوق</td><td class="r mono">${fmt(totalEarnings)}</td></tr>
                </tbody>
              </table>
            </div>

            <!-- ستون کسورات -->
            <div class="table-col">
              <table>
                <thead><tr><th>کسورات قانونی و کارگاهی</th><th>مبلغ (ریال)</th></tr></thead>
                <tbody>
                  ${deductions.map(d => `<tr><td>${d.label}</td><td class="r mono">${fmt(d.val)}</td></tr>`).join("")}
                  <!-- پرکننده فضا برای هم‌ارتفاع شدن ستون‌ها -->
                  ${Array(Math.max(0, earnings.length - deductions.length)).fill(0).map(() => `<tr><td>&nbsp;</td><td></td></tr>`).join("")}
                  <tr class="total-row"><td>جمع کسورات ماهانه</td><td class="r mono">${fmt(totalDeductions)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- بخش خالص دریافتی -->
          <div class="net-section">
            <div class="net-value">خالص قابل پرداخت: <span>${fmt(netPay)} ریال</span></div>
            <div class="net-words">مبلغ به حروف: <span>${netWords} ریال</span></div>
          </div>

          <!-- بخش امضاها -->
          <div class="signatures">
            <div>تهیه‌کننده (امور مالی)</div>
            <div>تأییدکننده (حسابداری)</div>
            <div>رئیس امور اداری و منابع انسانی</div>
            <div>امضای گیرنده فیش (کارمند)</div>
          </div>
        </div>
      </div>
    `;
  }

  // پیش‌نمایش و چاپ تکی فیش
  function handlePrintSingle() {
    if (!selectedCalc) return;
    const orgName = localStorage.getItem("org_name") || "سازمان امور دولتی";
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>فیش حقوقی - ${selectedCalc.employeeName}</title>
  <style>
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; padding: 15px; margin: 0; }
    .payslip-container { max-width: 800px; margin: 0 auto; page-break-after: always; }
    .payslip-border { border: 2px solid #333; border-radius: 8px; padding: 15px; background: #fff; }
    .payslip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .logo-area { font-weight: bold; font-size: 12px; }
    .title-area { text-align: center; }
    .title-area h2 { margin: 0; font-size: 14px; font-weight: bold; }
    .title-area .period { font-size: 11px; margin-top: 4px; color: #333; }
    .date-area { font-size: 9px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9f9f9; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px; }
    .info-grid div { font-size: 10px; }
    .tables-section { display: flex; gap: 15px; margin-bottom: 12px; }
    .table-col { flex: 1; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #555; padding: 5px 6px; text-align: right; font-size: 10px; }
    thead th { background: #eee!important; font-weight: bold; text-align: center; }
    .r { text-align: left; }
    .mono { font-family: Courier; font-size: 11px; }
    .total-row td { background: #f0f0f0!important; font-weight: bold; }
    .net-section { border: 1px solid #333; border-radius: 4px; padding: 8px 12px; background: #eef6ff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .net-value { font-weight: bold; font-size: 12px; }
    .net-value span { color: #1e3a8a; font-family: Courier; font-size: 13px; }
    .net-words { font-size: 10px; }
    .net-words span { font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; text-align: center; margin-top: 25px; font-weight: bold; font-size: 9px; gap: 10px; }
    .signatures div { border-top: 1px dashed #666; padding-top: 6px; }
  </style>
</head>
<body>
  ${getPayslipHtml(selectedCalc, selectedDetails, orgName)}
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body></html>`);
    win.document.close();
  }

  // چاپ گروهی تمامی فیش‌های دوره
  function handlePrintBulk() {
    if (monthCalcs.length === 0) return;
    const orgName = localStorage.getItem("org_name") || "سازمان امور دولتی";
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;

    const payslipsContent = monthCalcs.map(calc => {
      // پیدا کردن جزئیات برای هر رکورد
      const emp = employees.find(e => (e._id || e.id) === calc.employeeId);
      const decree = [...(employeeDecrees || [])]
        .filter(d => d.employeeId === calc.employeeId)
        .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""))
        [0] || null;

      // محاسبه پویای مقادیر کسر مساعده و قسط وام برای چاپ گروهی دقیق
      const empId = calc.employeeId;
      const empAdvances = (employeeAdvances || []).filter(
        a => String(a.employeeId) === String(empId) &&
             String(a.year) === String(selectedYear) &&
             String(a.month) === String(selectedMonth) &&
             a.active !== false
      );
      const advanceDeduct = calc.advanceDeduct ?? empAdvances.reduce((s, a) => s + (Number(a.amount) || 0), 0);

      const empLoans = (employeeLoans || []).filter(
        l => String(l.employeeId) === String(empId) &&
             l.active !== false
      );
      let loanDeduct = calc.loanDeduct ?? 0;
      if (calc.loanDeduct === undefined) {
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
      }

      const totalDeductions = (calc.insEmployee || 0) + (calc.monthlyTax || 0) + (calc.tardinessDeduct || 0) + (calc.absenceDeduct || 0) + advanceDeduct + loanDeduct;
      const netSalary = Math.max(0, calc.grossSalary - totalDeductions);

      const mergedCalc = {
        ...calc,
        advanceDeduct,
        loanDeduct,
        totalDeductions,
        netSalary
      };

      return getPayslipHtml(mergedCalc, { emp, decree }, orgName);
    }).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>چاپ گروهی فیش‌های حقوقی</title>
  <style>
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; padding: 15px; margin: 0; }
    .payslip-container { max-width: 800px; margin: 0 auto 30px auto; page-break-after: always; }
    .payslip-border { border: 2px solid #333; border-radius: 8px; padding: 15px; background: #fff; }
    .payslip-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .logo-area { font-weight: bold; font-size: 12px; }
    .title-area { text-align: center; }
    .title-area h2 { margin: 0; font-size: 14px; font-weight: bold; }
    .title-area .period { font-size: 11px; margin-top: 4px; color: #333; }
    .date-area { font-size: 9px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f9f9f9; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 12px; }
    .info-grid div { font-size: 10px; }
    .tables-section { display: flex; gap: 15px; margin-bottom: 12px; }
    .table-col { flex: 1; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #555; padding: 5px 6px; text-align: right; font-size: 10px; }
    thead th { background: #eee!important; font-weight: bold; text-align: center; }
    .r { text-align: left; }
    .mono { font-family: Courier; font-size: 11px; }
    .total-row td { background: #f0f0f0!important; font-weight: bold; }
    .net-section { border: 1px solid #333; border-radius: 4px; padding: 8px 12px; background: #eef6ff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .net-value { font-weight: bold; font-size: 12px; }
    .net-value span { color: #1e3a8a; font-family: Courier; font-size: 13px; }
    .net-words { font-size: 10px; }
    .net-words span { font-weight: bold; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; text-align: center; margin-top: 25px; font-weight: bold; font-size: 9px; gap: 10px; }
    .signatures div { border-top: 1px dashed #666; padding-top: 6px; }
  </style>
</head>
<body>
  ${payslipsContent}
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},350);}</script>
</body></html>`);
    win.document.close();
  }

  return (
    <div className="space-y-5 text-right pb-10" dir="rtl">
      {/* هدر بالایی */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            صدور و مدیریت فیش‌های حقوقی پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            مشاهده فیش‌های ماهانه، نهایی‌سازی و صدور فیش‌ها، و چاپ تکی یا چاپ گروهی برای تمامی پرسنل
          </p>
        </div>
        <div className="flex gap-2">
          {monthCalcs.length > 0 && (
            <>
              {isPeriodIssued ? (
                <Button variant="outline" size="sm" onClick={handleCancelIssue}
                  className="h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5 font-bold">
                  <RefreshCw className="h-3.5 w-3.5" /> لغو صدور فیش‌ها
                </Button>
              ) : (
                <Button size="sm" onClick={handleIssuePayslips}
                  className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-bold shadow">
                  <Send className="h-3.5 w-3.5" /> صادر کردن فیش‌های ماه
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrintBulk}
                className="h-9 text-xs gap-1.5 text-indigo-600 hover:bg-indigo-50 border-indigo-200 font-bold">
                <Printer className="h-3.5 w-3.5" /> چاپ گروهی فیش‌ها
              </Button>
            </>
          )}
        </div>
      </div>

      {/* نمایش نوتیفیکیشن‌ها */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /><span>{successMsg}</span>
        </div>
      )}

      {monthCalcs.length === 0 ? (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-12 text-center text-slate-400">
            <AlertCircle className="h-12 w-12 mx-auto text-slate-300 stroke-1 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">محاسبات حقوق ثبت نشده است</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              برای ماه {monthLabel} سال {selectedYear} هیچ محاسبه حقوقی ذخیره نشده است. لطفاً ابتدا از بخش «محاسبه حقوق»، محاسبات را نهایی و ذخیره نمایید.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={4}
                  value={toPersianDigits(selectedYear)}
                  onChange={e => setSelectedYear(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                  className="h-8 text-xs w-16 text-center font-mono"
                />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="h-8 text-xs border rounded-lg px-2 bg-background w-28"
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
          {/* ستون راست: انتخاب دوره و لیست کارکنان */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800">انتخاب دوره و جستجو</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px] text-slate-500 font-bold block mb-1">سال مالی</Label>
                    <Input
                      type="text"
                      maxLength={4}
                      value={toPersianDigits(selectedYear)}
                      onChange={e => setSelectedYear(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                      className="h-8 text-xs text-left font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-slate-500 font-bold block mb-1">ماه</Label>
                    <select
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="h-8 text-xs border rounded-lg px-2 bg-background w-full"
                    >
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute right-2.5 top-2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="جستجوی پرسنل (نام یا کد)..."
                    className="h-8 pr-8 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="max-h-[380px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-right text-[11px] font-bold text-slate-700">کد</TableHead>
                        <TableHead className="text-right text-[11px] font-bold text-slate-700">نام پرسنل</TableHead>
                        <TableHead className="text-left text-[11px] font-bold text-slate-700">خالص پرداختی</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCalcs.map(calc => {
                        const isSelected = selectedEmpId === calc.employeeId;
                        return (
                          <TableRow
                            key={calc.employeeId}
                            onClick={() => setSelectedEmpId(calc.employeeId)}
                            className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${
                              isSelected ? "bg-indigo-50/40 hover:bg-indigo-50/40" : ""
                            }`}
                          >
                            <TableCell className="text-right text-xs font-mono text-slate-500">{toPersianDigits(calc.employeeCode)}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-800">{calc.employeeName}</TableCell>
                            <TableCell className="text-left text-xs font-mono font-bold text-indigo-600">{fmt(calc.netSalary)}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredCalcs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-xs text-slate-400">موردی یافت نشد</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ستون چپ: نمایش فیش حقوقی کارمند منتخب */}
          <div className="lg:col-span-3">
            {selectedCalc ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-bold ${
                      isPeriodIssued 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {isPeriodIssued ? "صادر شده و نهایی" : "پیش‌نویس (غیررسمی)"}
                    </Badge>
                  </div>
                  <Button size="xs" onClick={handlePrintSingle} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-8 text-[11px]">
                    <Printer className="h-3.5 w-3.5" /> چاپ فیش حقوقی پرسنل
                  </Button>
                </div>

                {/* پیش نمایش طرح فیش کاغذی */}
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-xl p-5 shadow-md max-w-2xl mx-auto space-y-4 text-slate-800 dark:text-slate-100">
                  {/* سربرگ فیش */}
                  <div className="flex justify-between items-center border-b-2 border-slate-300 dark:border-slate-700 pb-3">
                    <span className="text-[10px] font-bold text-slate-500">سازمان امور دولتی</span>
                    <div className="text-center">
                      <h4 className="text-xs font-bold">فیش حقوق و دستمزد ماهانه پرسنل</h4>
                      <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{monthLabel} ماه سال {toPersianDigits(selectedYear)}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">تاریخ: {toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</span>
                  </div>

                  {/* اطلاعات شناسنامه‌ای */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800 text-[10px] leading-relaxed">
                    <div><span className="text-slate-500">کد پرسنلی:</span> <strong className="font-mono">{toPersianDigits(selectedCalc.employeeCode)}</strong></div>
                    <div><span className="text-slate-500">نام و نام خانوادگی:</span> <strong>{selectedCalc.employeeName}</strong></div>
                    <div><span className="text-slate-500">کد ملی:</span> <strong className="font-mono">{toPersianDigits(selectedDetails?.emp?.nationalId || "—")}</strong></div>
                    <div><span className="text-slate-500">سمت شغلی:</span> <strong>{selectedCalc.jobTitle}</strong></div>
                    <div><span className="text-slate-500">شماره بیمه:</span> <strong className="font-mono">{toPersianDigits(selectedDetails?.emp?.insuranceNo || "—")}</strong></div>
                    <div><span className="text-slate-500">شماره حساب:</span> <strong className="font-mono">{toPersianDigits(selectedDetails?.emp?.bankAccount || selectedDetails?.emp?.accountNo || "—")}</strong></div>
                    <div><span className="text-slate-500">روزهای کارکرد:</span> <strong>{toPersianDigits(selectedCalc.workedDays)} روز</strong></div>
                    <div><span className="text-slate-500">اضافه‌کاری:</span> <strong>{toPersianDigits(selectedCalc.overtimeHours)} ساعت</strong></div>
                  </div>

                  {/* جدول دو ستونه مزایا و کسورات */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ستون مزایا */}
                    <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-100 dark:bg-slate-800">
                          <TableRow>
                            <TableHead className="text-right text-[10px] font-bold text-slate-700 py-1.5">شرح پرداخت‌ها (مزایا)</TableHead>
                            <TableHead className="text-left text-[10px] font-bold text-slate-700 py-1.5">مبلغ (ریال)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[10px]">
                          <TableRow className="h-7"><TableCell className="py-1">حقوق پایه کارکرد</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.earnedBaseSalary)}</TableCell></TableRow>
                          {selectedCalc.housingAllow > 0 && <TableRow className="h-7"><TableCell className="py-1">حق مسکن</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.housingAllow)}</TableCell></TableRow>}
                          {selectedCalc.groceryAllow > 0 && <TableRow className="h-7"><TableCell className="py-1">بن خواربار (کارگری)</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.groceryAllow)}</TableCell></TableRow>}
                          {selectedCalc.childAllow > 0 && <TableRow className="h-7"><TableCell className="py-1">حق اولاد</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.childAllow)}</TableCell></TableRow>}
                          {selectedCalc.seniority > 0 && <TableRow className="h-7"><TableCell className="py-1">پایه سنوات</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.seniority)}</TableCell></TableRow>}
                          {selectedCalc.responsibility > 0 && <TableRow className="h-7"><TableCell className="py-1">فوق‌العاده مسئولیت</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.responsibility)}</TableCell></TableRow>}
                          {selectedCalc.expertise > 0 && <TableRow className="h-7"><TableCell className="py-1">فوق‌العاده تخصصی</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.expertise)}</TableCell></TableRow>}
                          {selectedCalc.overtimePay > 0 && <TableRow className="h-7"><TableCell className="py-1">اضافه‌کاری</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.overtimePay)}</TableCell></TableRow>}
                          {selectedCalc.other > 0 && <TableRow className="h-7"><TableCell className="py-1">سایر مزایا</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.other)}</TableCell></TableRow>}
                          <TableRow className="bg-slate-50 dark:bg-slate-800/20 font-bold border-t border-slate-300">
                            <TableCell className="py-1.5">جمع ناخالص پرداختنی</TableCell>
                            <TableCell className="text-left font-mono py-1.5">{fmt(selectedCalc.grossSalary)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* ستون کسورات */}
                    <div className="border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between">
                      <Table>
                        <TableHeader className="bg-slate-100 dark:bg-slate-800">
                          <TableRow>
                            <TableHead className="text-right text-[10px] font-bold text-slate-700 py-1.5">شرح کسورات</TableHead>
                            <TableHead className="text-left text-[10px] font-bold text-slate-700 py-1.5">مبلغ (ریال)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[10px]">
                          <TableRow className="h-7"><TableCell className="py-1">حقوق بیمه سهم پرسنل (۷٪)</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.insEmployee)}</TableCell></TableRow>
                          {selectedCalc.monthlyTax > 0 && <TableRow className="h-7"><TableCell className="py-1">مالیات حقوق</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.monthlyTax)}</TableCell></TableRow>}
                          {selectedCalc.tardinessDeduct > 0 && <TableRow className="h-7"><TableCell className="py-1">کسر کارکرد تأخیر ورود</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.tardinessDeduct)}</TableCell></TableRow>}
                          {selectedCalc.absenceDeduct > 0 && <TableRow className="h-7"><TableCell className="py-1">کسر غیبت</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.absenceDeduct)}</TableCell></TableRow>}
                          {selectedCalc.advanceDeduct > 0 && <TableRow className="h-7"><TableCell className="py-1">مساعده حقوق</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.advanceDeduct)}</TableCell></TableRow>}
                          {selectedCalc.loanDeduct > 0 && <TableRow className="h-7"><TableCell className="py-1">اقساط وام</TableCell><TableCell className="text-left font-mono py-1">{fmt(selectedCalc.loanDeduct)}</TableCell></TableRow>}
                          <TableRow className="bg-slate-50 dark:bg-slate-800/20 font-bold border-t border-slate-300">
                            <TableCell className="py-1.5">جمع کل کسورات</TableCell>
                            <TableCell className="text-left font-mono py-1.5">{fmt(selectedCalc.totalDeductions)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* بخش خالص قابل پرداخت */}
                  <div className="border border-slate-300 dark:border-slate-800 rounded-lg p-3 bg-indigo-50/50 dark:bg-indigo-950/20 flex flex-col md:flex-row justify-between items-start md:items-center text-[10px] gap-2">
                    <div>
                      <span className="text-slate-500 font-bold">مبلغ خالص قابل پرداخت:</span>{" "}
                      <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 font-mono pr-1">{fmt(selectedCalc.netSalary)} ریال</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">به حروف:</span>{" "}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{numToPersianWords(selectedCalc.netSalary)} ریال</span>
                    </div>
                  </div>

                  {/* امضاها */}
                  <div className="grid grid-cols-2 md:grid-cols-4 text-center text-[9px] pt-4 font-bold border-t border-dashed border-slate-300 dark:border-slate-700 gap-4 text-slate-500">
                    <div>امضای کارمند</div>
                    <div>تهیه کننده</div>
                    <div>رئیس حسابداری</div>
                    <div>مدیر امور مالی</div>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="py-24 text-center text-slate-400">
                  <Eye className="h-10 w-10 mx-auto text-slate-300 stroke-1 mb-2" />
                  <p className="text-xs">یک کارمند را از لیست انتخاب کنید تا فیش حقوقی او نمایش داده شود.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
