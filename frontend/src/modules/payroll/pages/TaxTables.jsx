import { useState, useMemo } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ReceiptText, Plus, Pencil, Trash2, Printer, Save, X, Calculator,
  Info, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Download, Upload
} from "lucide-react";

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

// جدول مالیات پیش‌فرض ۱۴۰۵
const DEFAULT_1405 = {
  year: "1405",
  annualExemption: 1_440_000_000,
  brackets: [
    { from: 0,             to: 500_000_000,   rate: 10, label: "پلکان اول" },
    { from: 500_000_000,   to: 1_000_000_000, rate: 15, label: "پلکان دوم" },
    { from: 1_000_000_000, to: 2_000_000_000, rate: 20, label: "پلکان سوم" },
    { from: 2_000_000_000, to: null,           rate: 25, label: "پلکان چهارم" }
  ],
  notes: "مصوب شورای عالی کار سال ۱۴۰۵ — ماده ۸۵ قانون مالیات‌های مستقیم"
};

// محاسبه مالیات سالانه بر اساس یک جدول
function computeAnnualTax(grossAnnual, table) {
  const exempt = Number(table.annualExemption);
  const taxable = Math.max(0, grossAnnual - exempt);
  let tax = 0;
  let remaining = taxable;
  for (const b of table.brackets) {
    const sliceSize = b.to === null ? remaining : Math.min(remaining, Number(b.to) - Number(b.from));
    if (sliceSize <= 0) break;
    tax += sliceSize * (Number(b.rate) / 100);
    remaining -= sliceSize;
    if (remaining <= 0) break;
  }
  return Math.round(tax);
}

const INITIAL_FORM = {
  year: "",
  annualExemption: 1_440_000_000,
  notes: "",
  brackets: [
    { from: 0,           to: 500_000_000,   rate: 10, label: "پلکان اول" },
    { from: 500_000_000, to: 1_000_000_000, rate: 15, label: "پلکان دوم" },
    { from: 1_000_000_000, to: null,        rate: 25, label: "پلکان آخر" }
  ]
};

const fmt = n => Number(n || 0).toLocaleString("fa-IR");

export default function TaxTables() {
  const { addConfig, updateConfig, deleteConfig, refreshAllConfigs, employees, payrollCalculations } = useAssets();

  // ذخیره جداول مالیاتی در localStorage
  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem("tax_tables");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [DEFAULT_1405];
  });

  const [activeTab, setActiveTab]     = useState("tables"); // tables | integration
  const [integYear, setIntegYear]     = useState("1405");
  const [integMonth, setIntegMonth]   = useState("01");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);

  const [showForm, setShowForm]       = useState(false);
  const [editingIdx, setEditingIdx]   = useState(null);
  const [form, setForm]               = useState(INITIAL_FORM);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [isSaving, setIsSaving]       = useState(false);
  const [successMsg, setSuccessMsg]   = useState("");
  const [errorMsg, setErrorMsg]       = useState("");

  // ماشین‌حساب مالیاتی
  const [calcIncome, setCalcIncome] = useState("");
  const [calcTableIdx, setCalcTableIdx] = useState(0);
  const calcResult = useMemo(() => {
    const income = Number(calcIncome.replace(/,/g, ""));
    if (!income || !tables[calcTableIdx]) return null;
    const annualTax = computeAnnualTax(income, tables[calcTableIdx]);
    const monthlyTax = Math.round(annualTax / 12);
    const exemptMonthly = Math.round(Number(tables[calcTableIdx].annualExemption) / 12);
    return { annualTax, monthlyTax, exemptMonthly, income };
  }, [calcIncome, calcTableIdx, tables]);

  function saveTables(newTables) {
    setTables(newTables);
    localStorage.setItem("tax_tables", JSON.stringify(newTables));
  }

  // مقداردهی فرم جدید
  function openNew() {
    setForm(INITIAL_FORM);
    setEditingIdx(null);
    setShowForm(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function openEdit(idx) {
    setForm(JSON.parse(JSON.stringify(tables[idx])));
    setEditingIdx(idx);
    setShowForm(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  function handleDelete(idx) {
    if (window.confirm("آیا از حذف این جدول مالیاتی مطمئن هستید؟")) {
      const next = tables.filter((_, i) => i !== idx);
      saveTables(next);
    }
  }

  // دانلود فایل متنی کمکی
  function downloadTextFile(filename, text) {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  // خروجی فایل پرسنلی (WP)
  function exportPersonnelFile() {
    setErrorMsg("");
    setSuccessMsg("");
    if (!employees || employees.length === 0) {
      setErrorMsg("هیچ کارمندی در سیستم ثبت نشده است.");
      return;
    }
    const lines = employees.map(emp => {
      return [
        emp.nationalId || "",
        emp.firstName || "",
        emp.lastName || "",
        emp.fatherName || "",
        emp.birthDate || "",
        emp.insuranceNo || emp.retirementInsuranceNo || "",
        emp.code || ""
      ].join("|");
    });
    const content = lines.join("\n");
    downloadTextFile(`WP_${integYear}_${integMonth}.txt`, content);
    setSuccessMsg("فایل اطلاعات پرسنلی پرسنل (WP) با موفقیت تولید و دانلود شد.");
  }

  // خروجی فایل مالیاتی حقوق (WH)
  function exportFinancialFile() {
    setErrorMsg("");
    setSuccessMsg("");
    const periodCalcs = (payrollCalculations || []).filter(
      c => String(c.year) === String(integYear) && String(c.month) === String(integMonth)
    );
    if (periodCalcs.length === 0) {
      setErrorMsg("هیچ محاسبه حقوقی برای این دوره یافت نشد. ابتدا حقوق این دوره را در صفحه محاسبه حقوق ثبت کنید.");
      return;
    }
    const lines = periodCalcs.map(c => {
      return [
        c.employeeCode || "",
        c.year || "",
        c.month || "",
        c.earnedBaseSalary || 0,
        c.housingAllow || 0,
        c.groceryAllow || 0,
        c.childAllow || 0,
        c.overtimePay || 0,
        c.grossSalary || 0,
        c.monthlyTax || 0
      ].join("|");
    });
    const content = lines.join("\n");
    downloadTextFile(`WH_${integYear}_${integMonth}.txt`, content);
    setSuccessMsg("فایل خلاصه فیش و مالیات (WH) با موفقیت تولید و دانلود شد.");
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  // پردازش و اعمال فایل مالیاتی برگشتی
  function processTaxReturnFile() {
    setErrorMsg("");
    setSuccessMsg("");
    setUploadSummary(null);
    if (!uploadedFile) {
      setErrorMsg("لطفاً ابتدا فایل برگشتی مالیات را انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n");
        let successCount = 0;
        let failCount = 0;
        const updatedList = [];

        for (const line of lines) {
          const cleaned = line.trim();
          if (!cleaned) continue;
          const parts = cleaned.split(/[|,]/);
          if (parts.length < 2) {
            failCount++;
            continue;
          }
          const idToken = parts[0].trim();
          const taxVal = parts[1].replace(/[^0-9.-]/g, "");
          const taxAmount = Math.round(Number(taxVal));

          if (isNaN(taxAmount)) {
            failCount++;
            continue;
          }

          // پیدا کردن کارمند بر اساس کد ملی یا کد پرسنلی
          const emp = (employees || []).find(e => e.code === idToken || e.nationalId === idToken);
          if (!emp) {
            failCount++;
            continue;
          }

          const empId = emp._id || emp.id;
          const calc = (payrollCalculations || []).find(
            c => String(c.year) === String(integYear) && 
                 String(c.month) === String(integMonth) && 
                 String(c.employeeId) === String(empId)
          );

          if (calc) {
            const monthlyTax = taxAmount;
            const totalDeductions = (calc.insEmployee || 0) + monthlyTax + (calc.tardinessDeduct || 0) + (calc.absenceDeduct || 0) + (calc.advanceDeduct || 0) + (calc.loanDeduct || 0);
            const netSalary = Math.max(0, (calc.grossSalary || 0) - totalDeductions);

            updatedList.push({
              ...calc,
              monthlyTax,
              totalDeductions,
              netSalary
            });
            successCount++;
          } else {
            failCount++;
          }
        }

        if (updatedList.length > 0) {
          setIsSaving(true);
          await Promise.all(updatedList.map(async item => {
            await updateConfig("payroll_calculations", item);
          }));
          await refreshAllConfigs();
          setIsSaving(false);
          setSuccessMsg(`فایل مالیاتی با موفقیت پردازش شد. اطلاعات مالیاتی ${successCount} پرسنل به‌روزرسانی گردید.`);
          setUploadSummary({ successCount, failCount });
        } else {
          setErrorMsg("هیچ کارمندی منطبق با کدهای موجود در فایل در محاسبات حقوق این دوره یافت نشد.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("خطا در پردازش و بارگذاری فایل. ساختار فایل را بررسی کنید.");
      }
    };
    reader.readAsText(uploadedFile);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.year.trim()) { setErrorMsg("سال مالی را وارد کنید."); return; }
    if (!form.brackets || form.brackets.length < 1) { setErrorMsg("حداقل یک پلکان مالیاتی وارد کنید."); return; }
    setIsSaving(true);
    const next = [...tables];
    if (editingIdx !== null) {
      next[editingIdx] = { ...form };
    } else {
      next.push({ ...form });
    }
    saveTables(next);
    setSuccessMsg(`جدول مالیاتی سال ${form.year} با موفقیت ذخیره شد.`);
    setShowForm(false);
    setIsSaving(false);
  }

  // مدیریت پلکان‌ها
  function setBracketField(idx, field, val) {
    setForm(f => {
      const b = [...f.brackets];
      b[idx] = { ...b[idx], [field]: field === "rate" || field === "from" || field === "to" ? (val === "" || val === null ? null : Number(val)) : val };
      return { ...f, brackets: b };
    });
  }

  function addBracket() {
    setForm(f => {
      const last = f.brackets[f.brackets.length - 1];
      const newFrom = last?.to ?? 0;
      const newBrackets = [
        ...f.brackets.slice(0, -1).map(b => ({ ...b })),
        { ...last, to: newFrom + 500_000_000 },
        { from: newFrom + 500_000_000, to: null, rate: last?.rate ?? 25, label: `پلکان ${f.brackets.length + 1}` }
      ];
      return { ...f, brackets: newBrackets };
    });
  }

  function removeBracket(idx) {
    setForm(f => ({ ...f, brackets: f.brackets.filter((_, i) => i !== idx) }));
  }

  // چاپ جدول مالیاتی
  function printTable(t) {
    const orgName = localStorage.getItem("org_name") || "سازمان";
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    const bracketRows = t.brackets.map((b, i) => `
      <tr class="${i % 2 === 1 ? "alt" : ""}">
        <td class="c">${b.label || `پلکان ${i + 1}`}</td>
        <td class="r mono">${fmt(b.from)}</td>
        <td class="r mono">${b.to !== null ? fmt(b.to) : "بدون سقف"}</td>
        <td class="r mono">${b.to !== null ? fmt(Number(b.to) - Number(b.from)) : "—"}</td>
        <td class="c bold rate">${b.rate}٪</td>
      </tr>
    `).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>جدول مالیات حقوق — سال ${t.year}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 14mm; }
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; }
    .hdr { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #222; padding-bottom:10px; margin-bottom:14px; }
    h1 { font-size:14px; font-weight:900; }
    .law-ref { font-size:9px; color:#666; margin-top:2px; }
    .exempt-box { background:#eef4ff; border:1px solid #c0d0f0; border-radius:4px; padding:10px 12px; margin-bottom:14px; font-size:11px; }
    table { width:100%; border-collapse:collapse; }
    th, td { border:1px solid #666; padding:6px 8px; }
    thead th { background:#e0e0e0!important; font-weight:bold; text-align:center; }
    .c { text-align:center; } .r { text-align:left; } .bold { font-weight:bold; } .mono { font-family:Courier; }
    .alt { background:#f8f8f8; }
    .rate { color:#c00; font-size:13px; font-weight:900; }
    .notes { margin-top:10px; font-size:9px; color:#555; }
    .example { margin-top:14px; border:1px dashed #888; padding:8px; background:#fffde7; }
    .sigs { display:grid; grid-template-columns:1fr 1fr; text-align:center; margin-top:40px; gap:20px; }
    .sig-box { border-top:1px solid #333; padding-top:8px; font-weight:bold; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <h1>جدول مالیات حقوق — سال مالی ${t.year}</h1>
      <div class="law-ref">موضوع ماده ۸۵ قانون مالیات‌های مستقیم — اصلاحیه ۱۴۰۱</div>
    </div>
    <div>${orgName}</div>
  </div>
  <div class="exempt-box">
    <strong>معافیت سالانه مالیاتی موضوع ماده ۸۴ ق.م.م:</strong>&nbsp;
    <span style="font-family:Courier;font-size:13px;font-weight:bold">${fmt(t.annualExemption)}</span> ریال در سال
    &nbsp;|&nbsp;
    معادل <strong>${fmt(Math.round(Number(t.annualExemption) / 12))}</strong> ریال در ماه
  </div>
  <table>
    <thead>
      <tr>
        <th>شرح پلکان</th>
        <th>از (ریال سالانه)</th>
        <th>تا (ریال سالانه)</th>
        <th>حجم پلکان (ریال)</th>
        <th>نرخ مالیاتی</th>
      </tr>
    </thead>
    <tbody>${bracketRows}</tbody>
  </table>
  ${t.notes ? `<div class="notes">📌 توضیحات: ${t.notes}</div>` : ""}
  <div class="example">
    <strong>نحوه محاسبه:</strong> درآمد سالانه مشمول مالیات = ناخالص حقوق سالانه − معافیت. سپس مالیات هر پلکان به‌صورت مجزا محاسبه و جمع می‌گردد.
  </div>
  <div class="sigs">
    <div class="sig-box">مدیر امور مالی</div>
    <div class="sig-box">مدیر منابع انسانی</div>
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
            <ReceiptText className="h-5 w-5 text-rose-600" />
            جدول مالیات حقوق و دستمزد
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            تعریف و مدیریت جداول مالیاتی پلکانی موضوع ماده ۸۵ قانون مالیات‌های مستقیم به تفکیک سال.
          </p>
        </div>
        {!showForm && activeTab === "tables" && (
          <Button size="sm" onClick={openNew}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Plus className="h-4 w-4" /> تعریف جدول جدید
          </Button>
        )}
      </div>

      {/* تب‌ها */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => { setActiveTab("tables"); setShowForm(false); setErrorMsg(""); setSuccessMsg(""); }}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
            activeTab === "tables"
              ? "text-rose-600 border-b-2 border-rose-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          جداول محاسباتی مالیات
        </button>
        <button
          onClick={() => { setActiveTab("integration"); setShowForm(false); setErrorMsg(""); setSuccessMsg(""); }}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
            activeTab === "integration"
              ? "text-rose-600 border-b-2 border-rose-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ارسال و دریافت فایل مالیات (سازمان امور مالیاتی)
        </button>
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

      {/* فرم تعریف / ویرایش */}
      {activeTab === "tables" && showForm && (
        <Card className="border-rose-100">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-rose-600" />
              {editingIdx !== null ? "ویرایش جدول مالیاتی" : "تعریف جدول مالیاتی جدید"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSave} className="space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">سال مالی <span className="text-rose-500">*</span></Label>
                  <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    placeholder="مثال: ۱۴۰۵" className="h-9 text-xs mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">معافیت سالانه مالیاتی (ریال)</Label>
                  <Input type="number" value={form.annualExemption}
                    onChange={e => setForm(f => ({ ...f, annualExemption: Number(e.target.value) }))}
                    className="h-9 text-xs mt-1.5 font-mono text-left" />
                  <p className="text-[10px] text-slate-400 mt-1">
                    معادل {fmt(Math.round(Number(form.annualExemption) / 12))} ریال در ماه
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold">توضیحات / مستند قانونی</Label>
                  <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="مثال: مصوب شورای عالی کار..." className="h-9 text-xs mt-1.5" />
                </div>
              </div>

              <Separator />

              {/* پلکان‌های مالیاتی */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 border-r-4 pr-2 border-rose-500">
                    پلکان‌های مالیاتی (ریال سالانه مازاد بر معافیت)
                  </h4>
                  <Button type="button" size="sm" variant="outline" onClick={addBracket}
                    className="h-7 text-[11px] gap-1 border-rose-200 text-rose-700 hover:bg-rose-50">
                    <Plus className="h-3.5 w-3.5" /> افزودن پلکان
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-rose-50 dark:bg-rose-950/30">
                        <th className="text-right px-3 py-2 font-bold border border-slate-200 dark:border-slate-700">شرح پلکان</th>
                        <th className="text-left px-3 py-2 font-bold border border-slate-200 dark:border-slate-700">از (ریال)</th>
                        <th className="text-left px-3 py-2 font-bold border border-slate-200 dark:border-slate-700">تا (ریال)</th>
                        <th className="text-center px-3 py-2 font-bold border border-slate-200 dark:border-slate-700 w-24">نرخ %</th>
                        <th className="w-10 border border-slate-200 dark:border-slate-700"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.brackets.map((b, i) => (
                        <tr key={i} className={i % 2 === 0 ? "" : "bg-slate-50 dark:bg-slate-900/50"}>
                          <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">
                            <Input value={b.label || ""} onChange={e => setBracketField(i, "label", e.target.value)}
                              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0" placeholder="شرح..." />
                          </td>
                          <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">
                            <Input type="number" value={b.from ?? ""} onChange={e => setBracketField(i, "from", e.target.value)}
                              className="h-7 text-xs font-mono text-left border-0 bg-transparent p-0 focus-visible:ring-0" />
                          </td>
                          <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">
                            {b.to === null
                              ? <span className="text-[10px] text-slate-400 italic px-2">بدون سقف</span>
                              : <Input type="number" value={b.to ?? ""} onChange={e => setBracketField(i, "to", e.target.value)}
                                  className="h-7 text-xs font-mono text-left border-0 bg-transparent p-0 focus-visible:ring-0" />}
                          </td>
                          <td className="border border-slate-200 dark:border-slate-700 px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Input type="number" min="0" max="100" step="0.5" value={b.rate ?? ""}
                                onChange={e => setBracketField(i, "rate", e.target.value)}
                                className="h-7 text-xs font-mono font-bold text-center text-rose-700 border-0 bg-transparent p-0 focus-visible:ring-0 w-14" />
                              <span className="text-slate-400">٪</span>
                            </div>
                          </td>
                          <td className="border border-slate-200 dark:border-slate-700 px-2 py-1 text-center">
                            {form.brackets.length > 1 && (
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeBracket(i)}
                                className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-slate-400 mt-2">
                  <Info className="h-3 w-3 inline ml-1" />
                  آخرین پلکان باید بدون سقف باشد. ستون «تا» آخرین ردیف را خالی بگذارید.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-9 text-xs">انصراف</Button>
                <Button type="submit" size="sm" disabled={isSaving}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow">
                  <Save className="h-4 w-4" />
                  {isSaving ? "در حال ذخیره..." : "ذخیره جدول مالیاتی"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* لیست جداول مالیاتی */}
      {activeTab === "tables" && !showForm && (
        <div className="space-y-3">
          {tables.length === 0 && (
            <div className="text-center py-10 text-xs text-muted-foreground">
              هیچ جدول مالیاتی تعریف نشده. روی «تعریف جدول جدید» کلیک کنید.
            </div>
          )}
          {tables.map((t, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <Card key={idx} className={`border transition-all ${isOpen ? "border-rose-200 dark:border-rose-800 shadow-md" : "border-slate-100"}`}>
                {/* سطر عنوان جدول */}
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpen ? "bg-rose-100 dark:bg-rose-900/50" : "bg-slate-100 dark:bg-slate-800"}`}>
                      <ReceiptText className={`h-4 w-4 ${isOpen ? "text-rose-600" : "text-slate-500"}`} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        جدول مالیات حقوق — سال {t.year}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        معافیت سالانه: <span className="font-mono font-semibold">{fmt(t.annualExemption)}</span> ریال
                        &nbsp;|&nbsp; {t.brackets?.length || 0} پلکان مالیاتی
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => printTable(t)} title="چاپ جدول">
                      <Printer className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(idx)} title="ویرایش">
                      <Pencil className="h-4 w-4 text-amber-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(idx)} title="حذف">
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                    <div className="w-6 flex justify-center">
                      {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* محتوای باز شده */}
                {isOpen && (
                  <CardContent className="pt-0 border-t border-slate-100 dark:border-slate-800">
                    {/* جعبه معافیت */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900 my-3 flex flex-wrap gap-4 text-xs">
                      <span className="font-bold text-blue-800 dark:text-blue-200">معافیت مالیاتی سالانه (ماده ۸۴):</span>
                      <span className="font-mono font-bold text-blue-700">{fmt(t.annualExemption)} ریال / سال</span>
                      <span className="text-blue-600">معادل {fmt(Math.round(Number(t.annualExemption) / 12))} ریال / ماه</span>
                    </div>

                    {/* جدول پلکان‌ها */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-rose-50 dark:bg-rose-950/20 text-xs">
                          <TableHead className="text-right text-white bg-rose-600">شرح پلکان</TableHead>
                          <TableHead className="text-left font-mono text-white bg-rose-600">از (ریال سالانه)</TableHead>
                          <TableHead className="text-left font-mono text-white bg-rose-600">تا (ریال سالانه)</TableHead>
                          <TableHead className="text-left font-mono text-white bg-rose-600">حجم پلکان</TableHead>
                          <TableHead className="text-center text-white bg-rose-600 w-24">نرخ مالیاتی</TableHead>
                          <TableHead className="text-left font-mono text-white bg-rose-600">حداکثر مالیات پلکان</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(t.brackets || []).map((b, bi) => {
                          const sliceSize = b.to !== null ? Number(b.to) - Number(b.from) : null;
                          const maxTax    = sliceSize !== null ? Math.round(sliceSize * Number(b.rate) / 100) : null;
                          return (
                            <TableRow key={bi} className="text-xs">
                              <TableCell className="font-bold">{b.label || `پلکان ${bi + 1}`}</TableCell>
                              <TableCell className="font-mono text-left">{fmt(b.from)}</TableCell>
                              <TableCell className="font-mono text-left">{b.to !== null ? fmt(b.to) : <span className="italic text-slate-400">بدون سقف</span>}</TableCell>
                              <TableCell className="font-mono text-left">{sliceSize !== null ? fmt(sliceSize) : "—"}</TableCell>
                              <TableCell className="text-center">
                                <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 font-black text-sm px-3">
                                  {b.rate}٪
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-left font-bold text-rose-700">
                                {maxTax !== null ? fmt(maxTax) : "نامحدود"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {t.notes && (
                      <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1">
                        <Info className="h-3 w-3" /> {t.notes}
                      </p>
                    )}

                    {/* ماشین‌حساب مالیاتی */}
                    <Separator className="my-4" />
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                        <Calculator className="h-4 w-4 text-indigo-600" />
                        ماشین‌حساب مالیاتی — سال {t.year}
                      </h4>
                      <div className="flex gap-3 items-end flex-wrap">
                        <div>
                          <Label className="text-[11px] font-semibold">درآمد سالانه ناخالص (ریال)</Label>
                          <Input
                            type="number"
                            value={calcTableIdx === idx ? calcIncome : ""}
                            onChange={e => { setCalcTableIdx(idx); setCalcIncome(e.target.value); }}
                            placeholder="مثال: 2000000000"
                            className="h-8 text-xs font-mono text-left w-48 mt-1"
                          />
                        </div>
                        {calcTableIdx === idx && calcResult && (
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400">مالیات سالانه</div>
                              <div className="font-black font-mono text-rose-700 text-sm">{fmt(calcResult.annualTax)} ریال</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400">مالیات ماهانه</div>
                              <div className="font-black font-mono text-rose-600">{fmt(calcResult.monthlyTax)} ریال</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400">نرخ مؤثر</div>
                              <div className="font-black text-amber-700">
                                {calcResult.income > 0 ? ((calcResult.annualTax / calcResult.income) * 100).toFixed(2) : 0}٪
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* بخش تب ارسال و دریافت فایل مالیاتی */}
      {activeTab === "integration" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* بخش خروجی اطلاعات */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Download className="h-4 w-4 text-rose-600" />
                تولید و دریافت فایل‌های مالیات حقوق (خروجی)
              </CardTitle>
              <CardDescription className="text-[10px]">
                تهیه فایل‌های متنی استاندارد جهت ارائه به سامانه سازمان امور مالیاتی کشور.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">سال مالیاتی</Label>
                  <select value={integYear} onChange={e => setIntegYear(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                    <option value="1403">۱۴۰۳</option>
                    <option value="1404">۱۴۰۴</option>
                    <option value="1405">۱۴۰۵</option>
                    <option value="1406">۱۴۰۶</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold">ماه مالیاتی</Label>
                  <select value={integMonth} onChange={e => setIntegMonth(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold">۱. فایل اطلاعات پرسنلی (WP)</div>
                    <div className="text-[9px] text-slate-400 mt-1">شامل اطلاعات هویتی، کدملی، شماره بیمه و پرسنلی کارکنان</div>
                  </div>
                  <Button size="sm" onClick={exportPersonnelFile} className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs h-8">
                    <Download className="h-3.5 w-3.5" /> دانلود فایل WP
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold">۲. فایل خلاصه فیش مالیاتی (WH)</div>
                    <div className="text-[9px] text-slate-400 mt-1">شامل بندهای درآمد مشمول مالیات، حقوق پایه و محاسبات مالیاتی</div>
                  </div>
                  <Button size="sm" onClick={exportFinancialFile} className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5 text-xs h-8">
                    <Download className="h-3.5 w-3.5" /> دانلود فایل WH
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بخش بارگذاری اطلاعات برگشتی */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-600" />
                بارگذاری فایل نهایی سازمان مالیاتی (ورودی)
              </CardTitle>
              <CardDescription className="text-[10px]">
                اعمال نتایج نهایی مالیات بر حقوق پس از ارائه فایل‌ها به سازمان مالیاتی و دریافت فایل برگشتی.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center gap-2 text-center">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">فایل برگشتی مالیات (txt یا csv) را انتخاب کنید</span>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 mt-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {uploadedFile && (
                  <Badge variant="secondary" className="mt-2 text-[10px] bg-slate-100 text-slate-800 border-none font-bold">
                    {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                  </Badge>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50 flex gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>قالب مجاز فایل:</strong> هر خط باید شامل <code>شناسه پرسنلی (یا کدملی) | مبلغ مالیات مصوب</code> باشد.
                  جداکننده می‌تواند کاراکتر ویرگول <code>,</code> یا خط عمودی <code>|</code> باشد. پس از بارگذاری، محاسبات فیش حقوقی برای این دوره مجدداً واریز و ثبت خواهد شد.
                </div>
              </div>

              <Button
                size="sm"
                onClick={processTaxReturnFile}
                disabled={!uploadedFile || isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 shadow"
              >
                <Upload className="h-4 w-4" />
                {isSaving ? "در حال اعمال مالیات..." : "اعمال مالیات فایل به فیش‌های حقوقی"}
              </Button>

              {uploadSummary && (
                <div className="grid grid-cols-2 gap-2 text-center text-xs mt-3 pt-3 border-t">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <div className="text-emerald-700 font-bold">موفق</div>
                    <div className="text-[14px] font-black mt-1 font-mono text-emerald-800">{uploadSummary.successCount} رکورد</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border">
                    <div className="text-slate-500 font-bold">ناموفق / نامنطبق</div>
                    <div className="text-[14px] font-black mt-1 font-mono text-slate-700">{uploadSummary.failCount} رکورد</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
