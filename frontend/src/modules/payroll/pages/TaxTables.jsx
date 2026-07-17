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
  Info, CheckCircle, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";

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
  const { addConfig, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();

  // ذخیره جداول مالیاتی در localStorage
  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem("tax_tables");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [DEFAULT_1405];
  });

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
        {!showForm && (
          <Button size="sm" onClick={openNew}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Plus className="h-4 w-4" /> تعریف جدول جدید
          </Button>
        )}
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
      {showForm && (
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
      {!showForm && (
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
    </div>
  );
}
