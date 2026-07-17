import { useState, useMemo } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  List, Printer, Search, FileText, CheckCircle2, AlertCircle, Edit3, Save, Trash2, X, Plus, Minus
} from "lucide-react";
import { toPersianDigits, toEnglishDigits } from "./InsuranceSettings";

const LOAN_TYPES = [
  { value: "emergency", label: "وام ضروری" },
  { value: "housing", label: "وام مسکن" },
  { value: "car", label: "وام خودرو" },
  { value: "marriage", label: "وام ازدواج" },
  { value: "other", label: "سایر وام‌ها" }
];

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function LoanList() {
  const { employees, employeeLoans, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // برای مودال/ویرایش اقساط پرداختی
  const [editingLoan, setEditingLoan] = useState(null);
  const [tempPaidCount, setTempPaidCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // فیلتر کردن وام‌ها
  const filteredLoans = useMemo(() => {
    return (employeeLoans || []).filter(loan => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        loan.employeeName?.toLowerCase().includes(q) || 
        loan.employeeCode?.toLowerCase().includes(q) || 
        loan.loanNumber?.toLowerCase().includes(q);
      const matchType = !selectedType || loan.loanType === selectedType;
      return matchSearch && matchType;
    });
  }, [employeeLoans, search, selectedType]);

  // محاسبه مجموع مبالغ برای گزارش و خلاصه
  const totals = useMemo(() => {
    let totalRepay = 0;
    let totalPaid = 0;
    let totalRem = 0;

    filteredLoans.forEach(loan => {
      const repay = Number(loan.totalRepayment) || 0;
      const count = Number(loan.paidInstallmentsCount) || 0;
      const paid = (Number(loan.monthlyInstallment) || 0) * count;
      const rem = repay - paid;

      totalRepay += repay;
      totalPaid += paid;
      totalRem += rem;
    });

    return { totalRepay, totalPaid, totalRem };
  }, [filteredLoans]);

  // باز کردن مدیریت اقساط
  function openInstallmentEditor(loan) {
    setEditingLoan(loan);
    setTempPaidCount(Number(loan.paidInstallmentsCount || 0));
    setSuccessMsg("");
    setErrorMsg("");
  }

  // ذخیره تعداد اقساط پرداختی
  async function handleSaveInstallmentCount() {
    if (!editingLoan) return;
    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const payload = {
        ...editingLoan,
        id: editingLoan._id || editingLoan.id,
        _id: editingLoan._id || editingLoan.id,
        paidInstallmentsCount: tempPaidCount
      };

      await updateConfig("employee_loans", payload);
      setSuccessMsg(`تعداد اقساط پرداخت شده وام ${editingLoan.loanNumber} به ${tempPaidCount} قسط تغییر یافت.`);
      setEditingLoan(null);
      await refreshAllConfigs();
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در به‌روزرسانی اطلاعات اقساط.");
    } finally {
      setIsSaving(false);
    }
  }

  // حذف وام
  async function handleDelete(id, num) {
    if (window.confirm(`آیا از حذف وام شماره ${num} مطمئن هستید؟`)) {
      try {
        await deleteConfig("employee_loans", id);
        setSuccessMsg(`وام شماره ${num} حذف شد.`);
        await refreshAllConfigs();
      } catch (err) {
        console.error(err);
        setErrorMsg("خطا در حذف رکورد.");
      }
    }
  }

  // تاریخچه اقساط برای چاپ تکی
  function getInstallmentsArray(loan) {
    const count = Number(loan.installmentsCount) || 0;
    const paidCount = Number(loan.paidInstallmentsCount) || 0;
    const schedule = [];
    let curYear = Number(loan.startYear) || 1405;
    let curMonth = Number(loan.startMonth) || 1;

    for (let i = 1; i <= count; i++) {
      const monthStr = String(curMonth).padStart(2, "0");
      const monthLabel = MONTHS.find(m => m.value === monthStr)?.label || "";
      schedule.push({
        index: i,
        period: `${monthLabel} ${curYear}`,
        amount: loan.monthlyInstallment,
        status: i <= paidCount ? "پرداخت شده" : "پرداخت نشده"
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }
    return schedule;
  }

  // چاپ تکی جدول اقساط وام کارمند
  function handlePrintSingle(loan) {
    const orgName = localStorage.getItem("org_name") || "سازمان امور دولتی";
    const win = window.open("", "_blank", "width=850,height=950");
    if (!win) return;

    const installments = getInstallmentsArray(loan);
    const totalRepay = Number(loan.totalRepayment) || 0;
    const paidAmount = (Number(loan.monthlyInstallment) || 0) * (Number(loan.paidInstallmentsCount) || 0);
    const remaining = totalRepay - paidAmount;

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>کارت اقساط وام - ${loan.employeeName}</title>
  <style>
    body { font-family: Tahoma, sans-serif; font-size: 11px; color: #111; direction: rtl; padding: 20px; }
    .card-border { border: 2px solid #222; border-radius: 8px; padding: 20px; background: #fff; }
    .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 15px; }
    .card-header h2 { margin: 0; font-size: 14px; font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background: #f9f9f9; padding: 12px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 15px; }
    .info-grid div { font-size: 10px; }
    .summary-box { border: 1px solid #222; border-radius: 4px; padding: 10px; background: #eef6ff; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; text-align: center; margin-bottom: 15px; font-weight: bold; }
    .summary-box div span { display: block; font-size: 9px; color: #555; margin-bottom: 4px; }
    .summary-box div strong { font-family: Courier; font-size: 12px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #444; padding: 5px 6px; text-align: center; font-size: 10px; }
    thead th { background: #eee!important; font-weight: bold; }
    .r { text-align: left; }
    .mono { font-family: Courier; }
    .status-paid { color: green; font-weight: bold; }
    .status-unpaid { color: #854d0e; }
  </style>
</head>
<body>
  <div class="card-border">
    <div class="card-header">
      <div>${orgName}</div>
      <h2>دفترچه اقساط و خلاصه وضعیت وام پرسنل</h2>
      <div>تاریخ چاپ: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
    </div>
    
    <div class="info-grid">
      <div><strong>شماره وام:</strong> ${toPersianDigits(loan.loanNumber)}</div>
      <div><strong>نام کارمند:</strong> ${loan.employeeName}</div>
      <div><strong>کد پرسنلی:</strong> ${toPersianDigits(loan.employeeCode)}</div>
      <div><strong>نوع وام:</strong> ${LOAN_TYPES.find(t => t.value === loan.loanType)?.label || "سایر"}</div>
      <div><strong>تاریخ پرداخت:</strong> ${toPersianDigits(loan.payoutDate || "—")}</div>
      <div><strong>تعداد اقساط:</strong> ${toPersianDigits(loan.installmentsCount)} ماهه</div>
    </div>

    <div class="summary-box">
      <div><span>مبلغ اصل وام</span><strong>${fmt(loan.amount)} ریال</strong></div>
      <div><span>کل مبلغ بازپرداخت</span><strong>${fmt(totalRepay)} ریال</strong></div>
      <div><span>مبلغ پرداخت شده</span><strong>${fmt(paidAmount)} ریال</strong></div>
      <div><span>مانده نهایی وام</span><strong style="color:#b91c1c">${fmt(remaining)} ریال</strong></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>شماره قسط</th>
          <th>دوره کسر از حقوق</th>
          <th>مبلغ قسط (ریال)</th>
          <th>وضعیت پرداخت قسط</th>
        </tr>
      </thead>
      <tbody>
        ${installments.map(ins => `
          <tr>
            <td class="mono">${toPersianDigits(ins.index)}</td>
            <td>${toPersianDigits(ins.period)}</td>
            <td class="r mono">${fmt(ins.amount)}</td>
            <td class="${ins.status === "پرداخت شده" ? "status-paid" : "status-unpaid"}">${ins.status}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body></html>`);
    win.document.close();
  }

  // چاپ گروهی خلاصه وام‌های فیلتر شده کارکنان
  function handlePrintBulk() {
    const orgName = localStorage.getItem("org_name") || "سازمان امور دولتی";
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;

    const rowsHtml = filteredLoans.map((loan, idx) => {
      const repay = Number(loan.totalRepayment) || 0;
      const count = Number(loan.paidInstallmentsCount) || 0;
      const paid = (Number(loan.monthlyInstallment) || 0) * count;
      const rem = repay - paid;

      return `
        <tr>
          <td class="c">${toPersianDigits(idx + 1)}</td>
          <td class="c mono">${toPersianDigits(loan.employeeCode)}</td>
          <td><b>${loan.employeeName}</b></td>
          <td class="c mono">${toPersianDigits(loan.loanNumber)}</td>
          <td class="c">${LOAN_TYPES.find(t => t.value === loan.loanType)?.label || "سایر"}</td>
          <td class="r mono">${fmt(loan.amount)}</td>
          <td class="r mono">${fmt(repay)}</td>
          <td class="r mono">${fmt(paid)}</td>
          <td class="r mono b">${fmt(rem)}</td>
          <td class="c">${toPersianDigits(count)} از ${toPersianDigits(loan.installmentsCount)}</td>
        </tr>
      `;
    }).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>گزارش مانده وام‌های پرسنل</title>
  <style>
    @page { size: A4 landscape; margin: 8mm 10mm; }
    body { font-family: Tahoma, sans-serif; font-size: 10px; color: #111; direction: rtl; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 8px; margin-bottom: 12px; }
    .hdr h1 { font-size: 13px; margin: 0; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #555; padding: 5px; }
    thead th { background: #eee!important; font-weight: bold; text-align: center; }
    .c { text-align: center; }
    .r { text-align: left; }
    .b { font-weight: bold; }
    .mono { font-family: Courier; }
    .total-row td { background: #eef6ff!important; font-weight: bold; }
  </style>
</head>
<body>
  <div class="hdr">
    <div>${orgName}</div>
    <h1>گزارش خلاصه و مانده وام‌های دریافتی کارکنان</h1>
    <div>تاریخ گزارش: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>ردیف</th>
        <th>کد پرسنلی</th>
        <th>نام و نام خانوادگی</th>
        <th>شماره وام</th>
        <th>نوع وام</th>
        <th>مبلغ اصل وام</th>
        <th>مبلغ کل بازپرداخت</th>
        <th>مبلغ پرداخت شده</th>
        <th>مانده نهایی وام</th>
        <th>وضعیت اقساط</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
      <tr class="total-row">
        <td colspan="5" class="c b">جمع کل (${toPersianDigits(filteredLoans.length)} فقره وام)</td>
        <td class="r mono b">—</td>
        <td class="r mono b">${fmt(totals.totalRepay)}</td>
        <td class="r mono b">${fmt(totals.totalPaid)}</td>
        <td class="r mono b" style="color:#b91c1c">${fmt(totals.totalRem)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body></html>`);
    win.document.close();
  }

  return (
    <div className="space-y-5 text-right pb-10" dir="rtl">
      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <List className="h-5 w-5 text-indigo-600" />
            لیست و گزارش مانده وام‌های پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            مشاهده مانده بدهی وام‌ها، کسر اقساط پرداختی، چاپ گروهی گزارش‌ها و کارت تکی اقساط هر کارمند
          </p>
        </div>
        <div className="flex gap-2">
          {filteredLoans.length > 0 && (
            <Button size="sm" onClick={handlePrintBulk}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Printer className="h-4 w-4" /> چاپ گروهی لیست وام‌ها
            </Button>
          )}
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
          <CheckCircle2 className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {/* بخش فیلترها */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">جستجوی کارمند یا شماره وام</Label>
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="نام، کد پرسنلی یا کد وام..."
                className="h-9 pr-8 text-xs font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">نوع وام</Label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="h-9 text-xs border rounded-lg px-2 bg-background w-full"
            >
              <option value="">همه انواع وام‌ها</option>
              {LOAN_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">کل مانده وام‌ها</span>
              <strong className="text-rose-600 font-mono text-sm">{fmt(totals.totalRem)} ریال</strong>
            </div>
            <div className="text-left">
              <span className="text-slate-500 block text-[10px]">کل بازپرداخت</span>
              <strong className="text-slate-700 dark:text-slate-300 font-mono">{fmt(totals.totalRepay)} ریال</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول وام‌ها */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right text-[11px] font-bold text-slate-700">شماره وام</TableHead>
                <TableHead className="text-right text-[11px] font-bold text-slate-700">نام و کد پرسنلی</TableHead>
                <TableHead className="text-right text-[11px] font-bold text-slate-700">نوع وام</TableHead>
                <TableHead className="text-left text-[11px] font-bold text-slate-700">مبلغ بازپرداخت</TableHead>
                <TableHead className="text-left text-[11px] font-bold text-slate-700">مبلغ پرداختی</TableHead>
                <TableHead className="text-left text-[11px] font-bold text-slate-700">مانده نهایی</TableHead>
                <TableHead className="text-center text-[11px] font-bold text-slate-700">اقساط</TableHead>
                <TableHead className="text-center text-[11px] font-bold text-slate-700 w-32">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map(loan => {
                const repay = Number(loan.totalRepayment) || 0;
                const count = Number(loan.paidInstallmentsCount) || 0;
                const paid = (Number(loan.monthlyInstallment) || 0) * count;
                const rem = repay - paid;

                return (
                  <TableRow key={loan._id || loan.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-xs text-slate-600">{toPersianDigits(loan.loanNumber)}</TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-800 text-xs">{loan.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{toPersianDigits(loan.employeeCode)}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {LOAN_TYPES.find(t => t.value === loan.loanType)?.label || "سایر"}
                    </TableCell>
                    <TableCell className="text-left font-mono text-xs">{fmt(repay)}</TableCell>
                    <TableCell className="text-left font-mono text-xs text-emerald-600">{fmt(paid)}</TableCell>
                    <TableCell className="text-left font-mono text-xs font-bold text-rose-600">{fmt(rem)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-slate-100 text-slate-700 font-mono">
                        {toPersianDigits(count)} از {toPersianDigits(loan.installmentsCount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openInstallmentEditor(loan)}
                          className="h-7 text-[10px] gap-1 text-slate-600 hover:bg-slate-100 border-slate-200"
                        >
                          <Edit3 className="h-3 w-3" /> ثبت اقساط
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handlePrintSingle(loan)}
                          className="h-7 text-[10px] gap-1 text-indigo-600 hover:bg-indigo-50 border-indigo-100"
                        >
                          <Printer className="h-3 w-3" /> چاپ
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDelete(loan._id || loan.id, loan.loanNumber)}
                          className="h-7 text-[10px] text-rose-600 hover:bg-rose-50 border-rose-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLoans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-slate-400">هیچ وامی یافت نشد.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* سایدبار/مودال پاپ آپ کوچک برای ویرایش اقساط پرداختی کارمند */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-800">به‌روزرسانی اقساط پرداختی</CardTitle>
              <Button variant="ghost" size="xs" onClick={() => setEditingLoan(null)} className="h-6 w-6 p-0 rounded-full">
                <X className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="text-xs space-y-1">
                <div>وام‌گیرنده: <strong>{editingLoan.employeeName}</strong></div>
                <div>شماره وام: <strong className="font-mono text-indigo-600">{toPersianDigits(editingLoan.loanNumber)}</strong></div>
                <div>تعداد کل اقساط: <strong className="font-mono">{toPersianDigits(editingLoan.installmentsCount)} قسط</strong></div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">اقساط پرداخت شده تاکنون</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTempPaidCount(prev => Math.max(0, prev - 1))}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  
                  <Input
                    type="text"
                    value={toPersianDigits(tempPaidCount)}
                    onChange={e => {
                      const num = Number(toEnglishDigits(e.target.value).replace(/[^0-9]/g, "")) || 0;
                      setTempPaidCount(Math.min(Number(editingLoan.installmentsCount), num));
                    }}
                    className="h-8 text-center text-xs font-bold font-mono w-24"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTempPaidCount(prev => Math.min(Number(editingLoan.installmentsCount), prev + 1))}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">
                  معادل: <strong className="text-emerald-600 font-bold">{fmt(tempPaidCount * Number(editingLoan.monthlyInstallment))} ریال</strong> پرداختی از کل بدهی.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="xs" onClick={() => setEditingLoan(null)} className="h-8 text-[11px]">
                  انصراف
                </Button>
                <Button size="xs" onClick={handleSaveInstallmentCount} disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-[11px] gap-1">
                  <Save className="h-3 w-3" /> ثبت تغییرات
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
