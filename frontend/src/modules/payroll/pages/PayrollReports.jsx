import { useState, useMemo } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Printer, Search, Calculator, ShieldCheck, DollarSign, Calendar, Clock, HelpCircle,
  Percent, ChevronLeft, Award, HelpCircle as HelpIcon
} from "lucide-react";
import { toPersianDigits } from "./InsuranceSettings";

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

const REPORT_TYPES = [
  { id: "list",      label: "لیست حقوق ماهانه",  desc: "مشاهده جامع دریافتی، کسورات و خالص پرسنل", icon: FileText,      color: "text-indigo-600 border-indigo-200" },
  { id: "insurance", label: "لیست بیمه",         desc: "سهم ۷٪ کارمند، ۲۰٪ کارفرما و ۳٪ بیکاری",   icon: ShieldCheck,   color: "text-blue-600 border-blue-200" },
  { id: "tax",       label: "لیست مالیات",        desc: "درآمد مشمول مالیات و مالیات کسر شده پرسنل", icon: Percent,       color: "text-rose-600 border-rose-200" },
  { id: "overtime",  label: "گزارش اضافه‌کاری",    desc: "ساعات و مبالغ پرداختی اضافه‌کاری کارکنان", icon: Clock,         color: "text-amber-600 border-amber-200" },
  { id: "absence",   label: "گزارش غیبت و تأخیر",   desc: "کسورات ناشی از تأخیر ورود و غیبت ماهانه",  icon: HelpIcon,      color: "text-slate-600 border-slate-200" },
  { id: "leave",     label: "گزارش مرخصی پرسنل",   desc: "مرخصی استحقاقی استفاده شده و مانده سالانه", icon: Calendar,      color: "text-emerald-600 border-emerald-200" },
  { id: "annual",    label: "گزارش سالانه حقوق",   desc: "جمع کارکرد و دریافتی کل ماه‌های سال مالی",  icon: DollarSign,    color: "text-cyan-600 border-cyan-200" },
  { id: "eid",       label: "گزارش عیدی و سنوات",  desc: "محاسبه عیدی و ذخیره سنوات پایان خدمت پرسنل",icon: Award,         color: "text-violet-600 border-violet-200" }
];

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function PayrollReports() {
  const {
    employees, employeeDecrees, payrollCalculations, attendanceRecords, employeeLeaves, refreshAllConfigs
  } = useAssets();

  const [activeReport, setActiveReport] = useState("list");
  const [selectedYear, setSelectedYear] = useState("1405");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [search, setSearch] = useState("");

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";

  // ۱. فیلتر کل محاسبات بر اساس سال و ماه برای گزارش‌های ماهانه
  const currentMonthCalcs = useMemo(() => {
    return (payrollCalculations || []).filter(
      c => String(c.year) === String(selectedYear) && String(c.month) === String(selectedMonth)
    );
  }, [payrollCalculations, selectedYear, selectedMonth]);

  // ۲. فیلتر کل محاسبات بر اساس سال برای گزارش‌های سالانه
  const currentYearCalcs = useMemo(() => {
    return (payrollCalculations || []).filter(
      c => String(c.year) === String(selectedYear)
    );
  }, [payrollCalculations, selectedYear]);

  // ۳. استخراج داده‌های آماده گزارش بر اساس نوع گزارش انتخاب شده
  const reportData = useMemo(() => {
    const q = search.toLowerCase();

    // فیلتر کارکنان جستجو شده
    const targets = (employees || []).filter(
      emp => !q ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        emp.code?.toLowerCase().includes(q)
    );

    return targets.map(emp => {
      const empId = emp._id || emp.id;
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
      const code = emp.code || "—";
      const nationalId = emp.nationalId || "—";
      const insuranceNo = emp.insuranceNo || "—";
      const jobTitle = emp.jobTitle || emp.role || "—";

      // آخرین حکم کارگزینی فعال
      const decree = [...(employeeDecrees || [])]
        .filter(d => d.employeeId === empId)
        .sort((a, b) => (b.issueDate || "").localeCompare(a.issueDate || ""))
        [0] || null;

      // محاسبه ماه جاری
      const calc = currentMonthCalcs.find(c => c.employeeId === empId) || null;

      // کارکرد ماه جاری
      const attRec = (attendanceRecords || []).find(
        r => String(r.year) === String(selectedYear) &&
             String(r.month) === String(selectedMonth) &&
             r.employeeId === empId
      ) || null;

      // مرخصی‌های ماه جاری
      const leaves = (employeeLeaves || []).filter(
        l => l.employeeId === empId &&
             String(l.startDate || "").startsWith(selectedYear)
      );

      // محاسبات کل سال
      const yearCalcs = currentYearCalcs.filter(c => c.employeeId === empId);

      return {
        empId,
        name,
        code,
        nationalId,
        insuranceNo,
        jobTitle,
        decree,
        calc,
        attRec,
        leaves,
        yearCalcs
      };
    });
  }, [employees, employeeDecrees, currentMonthCalcs, currentYearCalcs, attendanceRecords, employeeLeaves, selectedYear, selectedMonth, search]);

  // محاسبه ردیف جمع کل برای گزارش‌های مختلف
  const reportTotals = useMemo(() => {
    const res = {
      baseSalary: 0,
      overtimePay: 0,
      allowances: 0,
      gross: 0,
      insEmp: 0,
      insEmployer: 0,
      insUnemploy: 0,
      tax: 0,
      deductions: 0,
      net: 0,
      workedDays: 0,
      overtimeHours: 0,
      absenceDays: 0,
      tardinessHours: 0,
      leaveDays: 0,
      annualGross: 0,
      annualTax: 0,
      annualNet: 0,
      eid: 0,
      severance: 0
    };

    reportData.forEach(r => {
      // مقادیر ماهانه
      if (r.calc) {
        res.baseSalary += Number(r.calc.earnedBaseSalary || 0);
        res.overtimePay += Number(r.calc.overtimePay || 0);
        res.allowances += Number((r.calc.housingAllow || 0) + (r.calc.groceryAllow || 0) + (r.calc.childAllow || 0));
        res.gross += Number(r.calc.grossSalary || 0);
        res.insEmp += Number(r.calc.insEmployee || 0);
        res.insEmployer += Number(r.calc.insEmployer || 0);
        res.insUnemploy += Number(r.calc.insUnemploy || 0);
        res.tax += Number(r.calc.monthlyTax || 0);
        res.deductions += Number(r.calc.totalDeductions || 0);
        res.net += Number(r.calc.netSalary || 0);
      }
      if (r.attRec) {
        res.workedDays += Number(r.attRec.workedDays || 30);
        res.overtimeHours += Number(r.attRec.overtimeHours || 0);
        res.absenceDays += Number(r.attRec.absenceDays || 0);
        res.tardinessHours += Number(r.attRec.tardinessHours || 0);
      }
      res.leaveDays += r.leaves.reduce((s, l) => s + (Number(l.daysCount) || 0), 0);

      // سالانه
      r.yearCalcs.forEach(yc => {
        res.annualGross += Number(yc.grossSalary || 0);
        res.annualTax += Number(yc.monthlyTax || 0);
        res.annualNet += Number(yc.netSalary || 0);
      });

      // عیدی و سنوات
      const base = Number(r.decree?.baseSalary || 0);
      if (base > 0) {
        res.eid += base * 2; // عیدی معادل ۲ پایه حقوق
        res.severance += Math.round(base * (12 / 12)); // سنوات ۱ پایه حقوق به ازای هر سال کارکرد
      }
    });

    return res;
  }, [reportData]);

  // پرینت گزارش بر اساس استایل رسمی مرورگر
  function handlePrint() {
    const orgName = localStorage.getItem("org_name") || "سازمان امور دولتی";
    const reportName = REPORT_TYPES.find(r => r.id === activeReport)?.label || "گزارش حقوق";
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;

    let headersHtml = "";
    let bodyHtml = "";
    let footerHtml = "";
    let orientation = "A4 landscape";

    if (activeReport === "list") {
      orientation = "A4 landscape";
      headersHtml = `
        <th>ردیف</th><th>کد پرسنلی</th><th>نام و نام خانوادگی</th><th>کارکرد</th>
        <th>حقوق پایه کارکرد</th><th>حق مسکن و خواربار</th><th>حقوق اضافه‌کاری</th>
        <th>جمع ناخالص حقوق</th><th>بیمه سهم کارمند</th><th>مالیات کسر شده</th>
        <th>سایر کسورات (مساعده/وام)</th><th>خالص قابل پرداخت</th>
      `;
      bodyHtml = reportData.map((r, i) => `
        <tr>
          <td class="c">${i + 1}</td><td class="c mono">${r.code}</td><td><b>${r.name}</b></td>
          <td class="c">${toPersianDigits(r.attRec?.workedDays || 30)} روز</td>
          <td class="r mono">${fmt(r.calc?.earnedBaseSalary)}</td>
          <td class="r mono">${fmt((r.calc?.housingAllow || 0) + (r.calc?.groceryAllow || 0))}</td>
          <td class="r mono">${fmt(r.calc?.overtimePay)}</td>
          <td class="r mono b">${fmt(r.calc?.grossSalary)}</td>
          <td class="r mono">${fmt(r.calc?.insEmployee)}</td>
          <td class="r mono">${fmt(r.calc?.monthlyTax)}</td>
          <td class="r mono">${fmt((r.calc?.advanceDeduct || 0) + (r.calc?.loanDeduct || 0))}</td>
          <td class="r mono b text-emerald">${fmt(r.calc?.netSalary || 0)}</td>
        </tr>
      `).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="4">جمع کل (${toPersianDigits(reportData.length)} نفر)</td>
          <td class="r mono">${fmt(reportTotals.baseSalary)}</td>
          <td class="r mono">${fmt(reportTotals.allowances)}</td>
          <td class="r mono">${fmt(reportTotals.overtimePay)}</td>
          <td class="r mono b">${fmt(reportTotals.gross)}</td>
          <td class="r mono">${fmt(reportTotals.insEmp)}</td>
          <td class="r mono">${fmt(reportTotals.tax)}</td>
          <td class="r mono">${fmt(reportTotals.deductions - reportTotals.insEmp - reportTotals.tax)}</td>
          <td class="r mono b text-emerald">${fmt(reportTotals.net)}</td>
        </tr>
      `;
    } else if (activeReport === "insurance") {
      orientation = "A4 landscape";
      headersHtml = `
        <th>ردیف</th><th>کد ملی</th><th>شماره بیمه</th><th>نام و نام خانوادگی</th><th>کارکرد</th>
        <th>دستمزد روزانه</th><th>دستمزد مشمول</th><th>سهم کارمند (۷٪)</th>
        <th>سهم کارفرما (۲۰٪)</th><th>بیمه بیکاری (۳٪)</th><th>جمع کل حق بیمه (۳۰٪)</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const base = r.calc?.earnedBaseSalary || 0;
        const daily = Math.round(base / 30);
        const insBase = base; // در مدل ما دستمزد مبنا مشمول است
        return `
          <tr>
            <td class="c">${i + 1}</td><td class="c mono">${toPersianDigits(r.nationalId)}</td>
            <td class="c mono">${toPersianDigits(r.insuranceNo)}</td><td><b>${r.name}</b></td>
            <td class="c">${toPersianDigits(r.attRec?.workedDays || 30)} روز</td>
            <td class="r mono">${fmt(daily)}</td>
            <td class="r mono">${fmt(insBase)}</td>
            <td class="r mono">${fmt(r.calc?.insEmployee)}</td>
            <td class="r mono">${fmt(r.calc?.insEmployer)}</td>
            <td class="r mono">${fmt(r.calc?.insUnemploy)}</td>
            <td class="r mono b">${fmt((r.calc?.insEmployee || 0) + (r.calc?.insEmployer || 0) + (r.calc?.insUnemploy || 0))}</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="5">جمع کل</td>
          <td class="r mono">—</td>
          <td class="r mono">${fmt(reportTotals.baseSalary)}</td>
          <td class="r mono">${fmt(reportTotals.insEmp)}</td>
          <td class="r mono">${fmt(reportTotals.insEmployer)}</td>
          <td class="r mono">${fmt(reportTotals.insUnemploy)}</td>
          <td class="r mono b">${fmt(reportTotals.insEmp + reportTotals.insEmployer + reportTotals.insUnemploy)}</td>
        </tr>
      `;
    } else if (activeReport === "tax") {
      orientation = "A4 portrait";
      headersHtml = `
        <th>ردیف</th><th>کد ملی</th><th>نام و نام خانوادگی</th>
        <th>درآمد ناخالص مستمر</th><th>معافیت پایه مالیاتی</th><th>درآمد مشمول مالیات</th><th>مالیات کسر شده</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const gross = r.calc?.grossSalary || 0;
        const tax = r.calc?.monthlyTax || 0;
        const taxable = tax > 0 ? Math.max(0, gross - 120_000_000) : 0; // فرضی بر اساس سقف جدول مالیاتی
        const exempt = tax > 0 ? 120_000_000 : gross;
        return `
          <tr>
            <td class="c">${i + 1}</td><td class="c mono">${toPersianDigits(r.nationalId)}</td><td><b>${r.name}</b></td>
            <td class="r mono">${fmt(gross)}</td>
            <td class="r mono">${fmt(exempt)}</td>
            <td class="r mono">${fmt(taxable)}</td>
            <td class="r mono b text-rose">${fmt(tax)}</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="3">جمع کل</td>
          <td class="r mono">${fmt(reportTotals.gross)}</td>
          <td class="r mono">—</td>
          <td class="r mono">—</td>
          <td class="r mono b text-rose">${fmt(reportTotals.tax)}</td>
        </tr>
      `;
    } else if (activeReport === "overtime") {
      orientation = "A4 portrait";
      headersHtml = `
        <th>ردیف</th><th>نام و نام خانوادگی</th><th>عنوان شغل</th>
        <th>ساعات کارکرد موظف</th><th>ساعات اضافه‌کاری</th><th>نرخ هر ساعت (ریال)</th><th>مبلغ ناخالص اضافه‌کاری</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const hours = r.attRec?.overtimeHours || 0;
        const base = r.decree?.baseSalary || 0;
        const rate = Math.round(base / 176);
        return `
          <tr>
            <td class="c">${i + 1}</td><td><b>${r.name}</b></td><td>${r.jobTitle}</td>
            <td class="c">${toPersianDigits(r.attRec?.workedDays || 30)} روز</td>
            <td class="c mono text-amber"><b>${toPersianDigits(hours)} ساعت</b></td>
            <td class="r mono">${fmt(rate)}</td>
            <td class="r mono b">${fmt(r.calc?.overtimePay)}</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="4">جمع کل</td>
          <td class="c mono font-bold">${toPersianDigits(reportTotals.overtimeHours)} ساعت</td>
          <td class="r mono">—</td>
          <td class="r mono b">${fmt(reportTotals.overtimePay)}</td>
        </tr>
      `;
    } else if (activeReport === "absence") {
      orientation = "A4 portrait";
      headersHtml = `
        <th>ردیف</th><th>نام و نام خانوادگی</th><th>روزهای غیبت</th><th>ساعات تأخیر</th>
        <th>جریمه کسر غیبت</th><th>جریمه تأخیر ورود</th><th>جمع کسورات انضباطی</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const abs = r.attRec?.absenceDays || 0;
        const tard = r.attRec?.tardinessHours || 0;
        const base = r.decree?.baseSalary || 0;
        const dailyRate = Math.round(base / 30);
        const hourlyRate = Math.round(base / 176);
        const absDeduct = Math.round(dailyRate * abs);
        const tardDeduct = Math.round(hourlyRate * tard);
        return `
          <tr>
            <td class="c">${i + 1}</td><td><b>${r.name}</b></td>
            <td class="c mono text-rose font-bold">${toPersianDigits(abs)} روز</td>
            <td class="c mono text-rose">${toPersianDigits(tard)} ساعت</td>
            <td class="r mono">${fmt(absDeduct)}</td>
            <td class="r mono">${fmt(tardDeduct)}</td>
            <td class="r mono b text-rose">${fmt(absDeduct + tardDeduct)}</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="2">جمع کل کسورات انضباطی</td>
          <td class="c mono font-bold text-rose">${toPersianDigits(reportTotals.absenceDays)} روز</td>
          <td class="c mono text-rose">${toPersianDigits(reportTotals.tardinessHours)} ساعت</td>
          <td class="r mono">—</td>
          <td class="r mono">—</td>
          <td class="r mono b text-rose">${fmt(reportData.reduce((s, r) => {
            const base = r.decree?.baseSalary || 0;
            const daily = Math.round(base / 30);
            const hourly = Math.round(base / 176);
            return s + (daily * (r.attRec?.absenceDays || 0)) + (hourly * (r.attRec?.tardinessHours || 0));
          }, 0))}</td>
        </tr>
      `;
    } else if (activeReport === "leave") {
      orientation = "A4 portrait";
      headersHtml = `
        <th>ردیف</th><th>نام و نام خانوادگی</th><th>عنوان شغل</th>
        <th>مرخصی استحقاقی استفاده شده</th><th>سقف مجاز سالانه</th><th>مانده مرخصی سال جاری</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const used = r.leaves.reduce((s, l) => s + (Number(l.daysCount) || 0), 0);
        const remaining = Math.max(0, 30 - used); // سقف فرضی ۳۰ روز در سال
        return `
          <tr>
            <td class="c">${i + 1}</td><td><b>${r.name}</b></td><td>${r.jobTitle}</td>
            <td class="c mono text-rose font-bold">${toPersianDigits(used)} روز</td>
            <td class="c mono">${toPersianDigits(30)} روز</td>
            <td class="c mono text-emerald font-bold">${toPersianDigits(remaining)} روز</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="3">میانگین/جمع کل استفاده شده</td>
          <td class="c mono font-bold text-rose">${toPersianDigits(reportTotals.leaveDays)} روز کل</td>
          <td class="c">—</td>
          <td class="c mono font-bold text-emerald">${toPersianDigits(reportData.length * 30 - reportTotals.leaveDays)} روز کل</td>
        </tr>
      `;
    } else if (activeReport === "annual") {
      orientation = "A4 landscape";
      headersHtml = `
        <th>ردیف</th><th>کد پرسنلی</th><th>نام و نام خانوادگی</th><th>تعداد ماه‌های کارکرد</th>
        <th>جمع ناخالص حقوق سالانه</th><th>جمع مالیات پرداختی سالانه</th><th>خالص دریافتی کل سال مالی</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const months = r.yearCalcs.length;
        const annualGross = r.yearCalcs.reduce((s, c) => s + (c.grossSalary || 0), 0);
        const annualTax = r.yearCalcs.reduce((s, c) => s + (c.monthlyTax || 0), 0);
        const annualNet = r.yearCalcs.reduce((s, c) => s + (c.netSalary || 0), 0);
        return `
          <tr>
            <td class="c">${i + 1}</td><td class="c mono">${r.code}</td><td><b>${r.name}</b></td>
            <td class="c font-bold">${toPersianDigits(months)} ماه</td>
            <td class="r mono">${fmt(annualGross)}</td>
            <td class="r mono text-rose">${fmt(annualTax)}</td>
            <td class="r mono b text-emerald">${fmt(annualNet)}</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="4">جمع کل سال مالی ${toPersianDigits(selectedYear)}</td>
          <td class="r mono">${fmt(reportTotals.annualGross)}</td>
          <td class="r mono text-rose">${fmt(reportTotals.annualTax)}</td>
          <td class="r mono b text-emerald">${fmt(reportTotals.annualNet)}</td>
        </tr>
      `;
    } else if (activeReport === "eid") {
      orientation = "A4 portrait";
      headersHtml = `
        <th>ردیف</th><th>نام و نام خانوادگی</th><th>پایه حقوق مبنا</th>
        <th>ضریب عیدی پایان سال (۲ ماه)</th><th>مبلغ عیدی ناخالص</th><th>ذخیره سنوات پایان خدمت</th>
      `;
      bodyHtml = reportData.map((r, i) => {
        const base = Number(r.decree?.baseSalary || 0);
        const statusText = base > 0 ? "فعال" : "فاقد حکم";
        return `
          <tr>
            <td class="c">${i + 1}</td><td><b>${r.name}</b></td>
            <td class="r mono">${fmt(base)}</td>
            <td class="c">۲ ماه پایه حقوق</td>
            <td class="r mono b text-indigo">${fmt(base * 2)}</td>
            <td class="r mono b text-emerald">${fmt(base)}</td>
          </tr>
        `;
      }).join("");
      footerHtml = `
        <tr class="total-row">
          <td colspan="2">جمع کل محاسبات پایان سال</td>
          <td class="r mono">—</td>
          <td class="c">—</td>
          <td class="r mono b text-indigo">${fmt(reportTotals.eid)}</td>
          <td class="r mono b text-emerald">${fmt(reportTotals.severance)}</td>
        </tr>
      `;
    }

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>${reportName} - سال ${selectedYear}</title>
  <style>
    @page { size: ${orientation}; margin: 8mm 10mm; }
    body { font-family: Tahoma, sans-serif; font-size: 10px; color: #111; direction: rtl; padding: 10px; margin: 0; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 15px; }
    .hdr h1 { font-size: 14px; font-weight: 900; margin: 0; }
    .hdr .info { font-size: 9px; text-align: left; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #444; padding: 5px 6px; font-size: 9.5px; }
    thead th { background: #e6e6e6!important; font-weight: bold; text-align: center; }
    .c { text-align: center; }
    .r { text-align: left; }
    .mono { font-family: Courier, monospace; font-size: 10.5px; }
    .b { font-weight: bold; }
    .text-emerald { color: #047857; }
    .text-rose { color: #be123c; }
    .text-amber { color: #b45309; }
    .total-row td { background: #f3f4f6!important; font-weight: bold; border-top: 2px solid #222; }
    .footer { display: flex; justify-content: space-between; font-weight: bold; margin-top: 40px; font-size: 9px; }
    .footer-col { width: 25%; text-align: center; border-top: 1px dashed #666; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <h1>${reportName}</h1>
      <div style="font-size: 10px; margin-top: 4px; color: #444;">
        سازمان: <strong>${orgName}</strong> | 
        دوره: <strong>${activeReport === "annual" || activeReport === "eid" ? `سال مالی ${toPersianDigits(selectedYear)}` : `${monthLabel} ماه ${toPersianDigits(selectedYear)}`}</strong>
      </div>
    </div>
    <div class="info">
      تاریخ گزارش: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}<br/>
      تعداد پرسنل: ${toPersianDigits(reportData.length)} نفر
    </div>
  </div>
  <table>
    <thead>
      <tr>${headersHtml}</tr>
    </thead>
    <tbody>
      ${bodyHtml}
      ${footerHtml}
    </tbody>
  </table>
  <div class="footer">
    <div class="footer-col">تهیه‌کننده: امور مالی</div>
    <div class="footer-col">رئیس حسابداری</div>
    <div class="footer-col">مدیر مالی</div>
    <div class="footer-col">مدیریت عامل / تأیید نهایی</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div className="space-y-5 text-right pb-10" dir="rtl">
      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            مرکز گزارش‌های جامع حقوق و دستمزد
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            تهیه، بررسی، پیش‌نمایش و چاپ لیست‌های بیمه، مالیات، اضافه‌کاری، مرخصی و سایر محاسبات حقوق به صورت یکپارچه.
          </p>
        </div>
      </div>

      {/* بخش انتخابگر رادیویی (Radio Buttons) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REPORT_TYPES.map(report => {
          const isActive = activeReport === report.id;
          const Icon = report.icon;
          return (
            <label
              key={report.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                isActive
                  ? "bg-indigo-50/40 border-indigo-600 dark:bg-indigo-950/20"
                  : "bg-background border-slate-100 dark:border-slate-800"
              }`}
            >
              <input
                type="radio"
                name="payroll_report_type"
                value={report.id}
                checked={isActive}
                onChange={() => setActiveReport(report.id)}
                className="mt-1 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div>
                <span className={`text-xs font-black flex items-center gap-1.5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200"}`}>
                  <Icon className={`h-4 w-4 ${report.color}`} />
                  {report.label}
                </span>
                <span className="block text-[10px] text-muted-foreground mt-0.5 leading-tight">{report.desc}</span>
              </div>
            </label>
          );
        })}
      </div>

      {/* فیلترها */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-semibold">سال مالی</Label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5"
              >
                <option value="1405">۱۴۰۵</option>
                <option value="1404">۱۴۰۴</option>
                <option value="1403">۱۴۰۳</option>
              </select>
            </div>
            
            {/* ماه فقط برای گزارش‌های غیر سالانه نمایش داده می‌شود */}
            {activeReport !== "annual" && activeReport !== "eid" && (
              <div>
                <Label className="text-xs font-semibold">ماه گزارش</Label>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5"
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}

            <div className={`${activeReport === "annual" || activeReport === "eid" ? "md:col-span-2" : "md:col-span-1"}`}>
              <Label className="text-xs font-semibold">جستجو در پرسنل</Label>
              <div className="relative mt-1.5">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="کد پرسنلی یا نام کارمند..."
                  className="h-9 pr-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Button onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow w-full">
                <Printer className="h-4 w-4" /> چاپ گزارش رسمی
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول نمایش گزارش */}
      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b pb-3.5 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            پیش‌نمایش داده‌های گزارش: {REPORT_TYPES.find(r => r.id === activeReport)?.label}
          </CardTitle>
          <CardDescription className="text-[10px]">
            {activeReport === "annual" || activeReport === "eid"
              ? `دوره مالی منتهی به اسفند ${selectedYear}`
              : `دوره محاسباتی ${monthLabel} ماه ${selectedYear}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3 overflow-x-auto">
          {/* لیست حقوق ماهانه */}
          {activeReport === "list" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">کد پرسنلی / نام</TableHead>
                  <TableHead className="text-center">کارکرد</TableHead>
                  <TableHead className="text-left font-mono">پایه کارکرد</TableHead>
                  <TableHead className="text-left font-mono">مزایا</TableHead>
                  <TableHead className="text-left font-mono">اضافه‌کار</TableHead>
                  <TableHead className="text-left font-mono font-bold text-indigo-700">ناخالص</TableHead>
                  <TableHead className="text-left font-mono text-blue-600">بیمه ۷٪</TableHead>
                  <TableHead className="text-left font-mono text-rose-600">مالیات</TableHead>
                  <TableHead className="text-left font-mono">سایر کسورات</TableHead>
                  <TableHead className="text-left font-mono font-bold text-emerald-700">خالص پرداختی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => (
                  <TableRow key={r.empId} className="h-8">
                    <TableCell className="text-right font-sans">
                      <div className="font-bold">{r.name}</div>
                      <div className="text-[9px] text-slate-400">{r.code}</div>
                    </TableCell>
                    <TableCell className="text-center font-sans">{toPersianDigits(r.attRec?.workedDays || 30)} روز</TableCell>
                    <TableCell className="text-left">{fmt(r.calc?.earnedBaseSalary)}</TableCell>
                    <TableCell className="text-left">{fmt((r.calc?.housingAllow || 0) + (r.calc?.groceryAllow || 0) + (r.calc?.childAllow || 0))}</TableCell>
                    <TableCell className="text-left text-amber-600">{fmt(r.calc?.overtimePay)}</TableCell>
                    <TableCell className="text-left font-bold text-indigo-700">{fmt(r.calc?.grossSalary)}</TableCell>
                    <TableCell className="text-left text-blue-600">{fmt(r.calc?.insEmployee)}</TableCell>
                    <TableCell className="text-left text-rose-600">{fmt(r.calc?.monthlyTax)}</TableCell>
                    <TableCell className="text-left">{fmt((r.calc?.advanceDeduct || 0) + (r.calc?.loanDeduct || 0))}</TableCell>
                    <TableCell className="text-left font-bold text-emerald-700 text-xs font-sans">{fmt(r.calc?.netSalary)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell colSpan={2} className="text-right font-sans">جمع کل</TableCell>
                  <TableCell className="text-left">{fmt(reportTotals.baseSalary)}</TableCell>
                  <TableCell className="text-left">{fmt(reportTotals.allowances)}</TableCell>
                  <TableCell className="text-left text-amber-600">{fmt(reportTotals.overtimePay)}</TableCell>
                  <TableCell className="text-left text-indigo-700 font-black">{fmt(reportTotals.gross)}</TableCell>
                  <TableCell className="text-left text-blue-600">{fmt(reportTotals.insEmp)}</TableCell>
                  <TableCell className="text-left text-rose-600">{fmt(reportTotals.tax)}</TableCell>
                  <TableCell className="text-left">{fmt(reportTotals.deductions - reportTotals.insEmp - reportTotals.tax)}</TableCell>
                  <TableCell className="text-left text-emerald-800 text-xs font-sans font-black">{fmt(reportTotals.net)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* لیست بیمه */}
          {activeReport === "insurance" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">کارمند</TableHead>
                  <TableHead className="text-center font-mono">شماره بیمه / کدملی</TableHead>
                  <TableHead className="text-center">کارکرد</TableHead>
                  <TableHead className="text-left font-mono">دستمزد روزانه</TableHead>
                  <TableHead className="text-left font-mono">مشمول بیمه</TableHead>
                  <TableHead className="text-left font-mono text-blue-600">بیمه کارمند (۷٪)</TableHead>
                  <TableHead className="text-left font-mono text-orange-600">بیمه کارفرما (۲۰٪)</TableHead>
                  <TableHead className="text-left font-mono text-slate-500">بیمه بیکاری (۳٪)</TableHead>
                  <TableHead className="text-left font-mono font-bold text-slate-800 dark:text-slate-100">مجموع ۳۰٪</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => {
                  const base = r.calc?.earnedBaseSalary || 0;
                  const daily = Math.round(base / 30);
                  const totalIns = (r.calc?.insEmployee || 0) + (r.calc?.insEmployer || 0) + (r.calc?.insUnemploy || 0);
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400">{r.code}</div>
                      </TableCell>
                      <TableCell className="text-center">{toPersianDigits(r.insuranceNo)}<br/>{toPersianDigits(r.nationalId)}</TableCell>
                      <TableCell className="text-center font-sans">{toPersianDigits(r.attRec?.workedDays || 30)} روز</TableCell>
                      <TableCell className="text-left">{fmt(daily)}</TableCell>
                      <TableCell className="text-left">{fmt(base)}</TableCell>
                      <TableCell className="text-left text-blue-600">{fmt(r.calc?.insEmployee)}</TableCell>
                      <TableCell className="text-left text-orange-600">{fmt(r.calc?.insEmployer)}</TableCell>
                      <TableCell className="text-left text-slate-500">{fmt(r.calc?.insUnemploy)}</TableCell>
                      <TableCell className="text-left font-bold text-slate-800 dark:text-slate-100">{fmt(totalIns)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell colSpan={3} className="text-right font-sans">جمع کل</TableCell>
                  <TableCell className="text-left">—</TableCell>
                  <TableCell className="text-left">{fmt(reportTotals.baseSalary)}</TableCell>
                  <TableCell className="text-left text-blue-600">{fmt(reportTotals.insEmp)}</TableCell>
                  <TableCell className="text-left text-orange-600">{fmt(reportTotals.insEmployer)}</TableCell>
                  <TableCell className="text-left text-slate-500">{fmt(reportTotals.insUnemploy)}</TableCell>
                  <TableCell className="text-left font-black">{fmt(reportTotals.insEmp + reportTotals.insEmployer + reportTotals.insUnemploy)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* لیست مالیات */}
          {activeReport === "tax" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">نام پرسنل</TableHead>
                  <TableHead className="text-center font-mono">کد ملی</TableHead>
                  <TableHead className="text-left font-mono">ناخالص دریافتی مستمر</TableHead>
                  <TableHead className="text-left font-mono">معافیت پایه</TableHead>
                  <TableHead className="text-left font-mono">درآمد مشمول مالیات</TableHead>
                  <TableHead className="text-left font-mono font-bold text-rose-600">مالیات کسر شده</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => {
                  const gross = r.calc?.grossSalary || 0;
                  const tax = r.calc?.monthlyTax || 0;
                  const taxable = tax > 0 ? Math.max(0, gross - 120_000_000) : 0;
                  const exempt = tax > 0 ? 120_000_000 : gross;
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{r.code}</div>
                      </TableCell>
                      <TableCell className="text-center">{toPersianDigits(r.nationalId)}</TableCell>
                      <TableCell className="text-left">{fmt(gross)}</TableCell>
                      <TableCell className="text-left">{fmt(exempt)}</TableCell>
                      <TableCell className="text-left">{fmt(taxable)}</TableCell>
                      <TableCell className="text-left font-bold text-rose-600">{fmt(tax)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell colSpan={2} className="text-right font-sans">جمع کل</TableCell>
                  <TableCell className="text-left">{fmt(reportTotals.gross)}</TableCell>
                  <TableCell className="text-left">—</TableCell>
                  <TableCell className="text-left">—</TableCell>
                  <TableCell className="text-left text-rose-600 font-black">{fmt(reportTotals.tax)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* گزارش اضافه‌کاری */}
          {activeReport === "overtime" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">پرسنل</TableHead>
                  <TableHead className="text-center">ساعات حضور موظف</TableHead>
                  <TableHead className="text-center font-bold text-amber-600">ساعات اضافه‌کاری</TableHead>
                  <TableHead className="text-left font-mono">نرخ پایه ساعتی</TableHead>
                  <TableHead className="text-left font-mono font-bold text-slate-800 dark:text-slate-100">ناخالص اضافه‌کاری</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => {
                  const hours = r.attRec?.overtimeHours || 0;
                  const base = r.decree?.baseSalary || 0;
                  const rate = Math.round(base / 176);
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400">{r.code} · {r.jobTitle}</div>
                      </TableCell>
                      <TableCell className="text-center font-sans">{toPersianDigits(r.attRec?.workedDays || 30)} روز</TableCell>
                      <TableCell className="text-center text-amber-600 font-bold">{toPersianDigits(hours)} ساعت</TableCell>
                      <TableCell className="text-left">{fmt(rate)}</TableCell>
                      <TableCell className="text-left font-bold text-slate-800 dark:text-slate-100">{fmt(r.calc?.overtimePay)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell colSpan={2} className="text-right font-sans">جمع کل</TableCell>
                  <TableCell className="text-center text-amber-600 font-black">{toPersianDigits(reportTotals.overtimeHours)} ساعت</TableCell>
                  <TableCell className="text-left">—</TableCell>
                  <TableCell className="text-left font-black">{fmt(reportTotals.overtimePay)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* گزارش غیبت */}
          {activeReport === "absence" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">نام پرسنل</TableHead>
                  <TableHead className="text-center text-rose-600 font-bold">تعداد روزهای غیبت</TableHead>
                  <TableHead className="text-center text-rose-500">ساعات تأخیر ورود</TableHead>
                  <TableHead className="text-left font-mono">کسر بابت غیبت</TableHead>
                  <TableHead className="text-left font-mono">کسر بابت تأخیر</TableHead>
                  <TableHead className="text-left font-mono font-bold text-rose-700">جمع کسورات انضباطی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => {
                  const abs = r.attRec?.absenceDays || 0;
                  const tard = r.attRec?.tardinessHours || 0;
                  const base = r.decree?.baseSalary || 0;
                  const daily = Math.round(base / 30);
                  const hourly = Math.round(base / 176);
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400">{r.code}</div>
                      </TableCell>
                      <TableCell className="text-center text-rose-600 font-bold">{toPersianDigits(abs)} روز</TableCell>
                      <TableCell className="text-center text-rose-500">{toPersianDigits(tard)} ساعت</TableCell>
                      <TableCell className="text-left">{fmt(daily * abs)}</TableCell>
                      <TableCell className="text-left">{fmt(hourly * tard)}</TableCell>
                      <TableCell className="text-left font-bold text-rose-700">{fmt(daily * abs + hourly * tard)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell className="text-right font-sans">جمع کل</TableCell>
                  <TableCell className="text-center text-rose-600 font-black">{toPersianDigits(reportTotals.absenceDays)} روز</TableCell>
                  <TableCell className="text-center text-rose-500 font-black">{toPersianDigits(reportTotals.tardinessHours)} ساعت</TableCell>
                  <TableCell className="text-left">—</TableCell>
                  <TableCell className="text-left">—</TableCell>
                  <TableCell className="text-left text-rose-700 font-black">{fmt(reportData.reduce((s, r) => {
                    const base = r.decree?.baseSalary || 0;
                    const daily = Math.round(base / 30);
                    const hourly = Math.round(base / 176);
                    return s + (daily * (r.attRec?.absenceDays || 0)) + (hourly * (r.attRec?.tardinessHours || 0));
                  }, 0))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* گزارش مرخصی */}
          {activeReport === "leave" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">نام پرسنل</TableHead>
                  <TableHead className="text-right">سمت شغلی</TableHead>
                  <TableHead className="text-center text-rose-600 font-bold">مرخصی استفاده شده (امسال)</TableHead>
                  <TableHead className="text-center">سقف مجاز سالانه</TableHead>
                  <TableHead className="text-center text-emerald-600 font-bold">مانده مرخصی استحقاقی</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-sans">
                {reportData.map(r => {
                  const used = r.leaves.reduce((s, l) => s + (Number(l.daysCount) || 0), 0);
                  const remaining = Math.max(0, 30 - used);
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{r.code}</div>
                      </TableCell>
                      <TableCell className="text-right">{r.jobTitle}</TableCell>
                      <TableCell className="text-center text-rose-600 font-bold font-mono">{toPersianDigits(used)} روز</TableCell>
                      <TableCell className="text-center font-mono">{toPersianDigits(30)} روز</TableCell>
                      <TableCell className="text-center text-emerald-600 font-bold font-mono">{toPersianDigits(remaining)} روز</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* گزارش سالانه حقوق */}
          {activeReport === "annual" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">کد پرسنلی / نام</TableHead>
                  <TableHead className="text-center">ماه‌های کارکرد محاسبه شده</TableHead>
                  <TableHead className="text-left font-mono">جمع ناخالص سالانه</TableHead>
                  <TableHead className="text-left font-mono text-rose-600">جمع مالیات سالانه</TableHead>
                  <TableHead className="text-left font-mono font-bold text-emerald-700">جمع خالص دریافتی سالانه</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => {
                  const months = r.yearCalcs.length;
                  const annualGross = r.yearCalcs.reduce((s, c) => s + (c.grossSalary || 0), 0);
                  const annualTax = r.yearCalcs.reduce((s, c) => s + (c.monthlyTax || 0), 0);
                  const annualNet = r.yearCalcs.reduce((s, c) => s + (c.netSalary || 0), 0);
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400">{r.code}</div>
                      </TableCell>
                      <TableCell className="text-center font-sans font-bold">{toPersianDigits(months)} ماه</TableCell>
                      <TableCell className="text-left">{fmt(annualGross)}</TableCell>
                      <TableCell className="text-left text-rose-600">{fmt(annualTax)}</TableCell>
                      <TableCell className="text-left font-bold text-emerald-700 text-xs font-sans">{fmt(annualNet)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell colSpan={2} className="text-right font-sans">جمع کل سال مالی {toPersianDigits(selectedYear)}</TableCell>
                  <TableCell className="text-left">{fmt(reportTotals.annualGross)}</TableCell>
                  <TableCell className="text-left text-rose-600">{fmt(reportTotals.annualTax)}</TableCell>
                  <TableCell className="text-left text-emerald-800 text-xs font-sans font-black">{fmt(reportTotals.annualNet)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          {/* گزارش عیدی و سنوات */}
          {activeReport === "eid" && (
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="text-[10px]">
                  <TableHead className="text-right">نام پرسنل</TableHead>
                  <TableHead className="text-left font-mono">آخرین حقوق مبنا</TableHead>
                  <TableHead className="text-center">مدت زمان کارکرد سالانه</TableHead>
                  <TableHead className="text-left font-mono font-bold text-indigo-700">عیدی ناخالص پایان سال</TableHead>
                  <TableHead className="text-left font-mono font-bold text-emerald-700">ذخیره سنوات خدمت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-[10px] font-mono">
                {reportData.map(r => {
                  const base = Number(r.decree?.baseSalary || 0);
                  return (
                    <TableRow key={r.empId} className="h-8">
                      <TableCell className="text-right font-sans">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[9px] text-slate-400">{r.code} · {r.jobTitle}</div>
                      </TableCell>
                      <TableCell className="text-left">{fmt(base)}</TableCell>
                      <TableCell className="text-center font-sans">۱۲ ماه کامل</TableCell>
                      <TableCell className="text-left font-bold text-indigo-700">{fmt(base * 2)}</TableCell>
                      <TableCell className="text-left font-bold text-emerald-700">{fmt(base)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-slate-100/50 dark:bg-slate-800/40 font-bold border-t-2">
                  <TableCell colSpan={3} className="text-right font-sans">جمع کل پایان سال</TableCell>
                  <TableCell className="text-left text-indigo-800 font-black">{fmt(reportTotals.eid)}</TableCell>
                  <TableCell className="text-left text-emerald-800 font-black">{fmt(reportTotals.severance)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
