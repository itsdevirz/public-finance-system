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
  Banknote, Save, Plus, Trash2, Edit, RefreshCw, Calendar, Users, Calculator, Info, CheckCircle, AlertCircle, FileText
} from "lucide-react";
import { toPersianDigits, toEnglishDigits } from "./InsuranceSettings";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

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

const DEFAULT_FORM = {
  loanNumber: "",
  employeeId: "",
  loanType: "emergency",
  amount: "",
  interestRate: "0",
  installmentsCount: "12",
  payoutDate: "1405/01/01",
  startYear: "1405",
  startMonth: "01",
  description: ""
};

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function LoanRegisterForm() {
  const { employees, employeeLoans, addConfig, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  // تولید خودکار شماره وام غیرتکراری بر اساس تاریخچه
  useEffect(() => {
    if (!editingId) {
      const nextNum = (employeeLoans?.length || 0) + 1001;
      setForm(prev => ({ ...prev, loanNumber: `LN-${nextNum}` }));
    }
  }, [employeeLoans, editingId]);

  function handleInputChange(field, value) {
    let sanitizedValue = toEnglishDigits(value);
    
    if (field === "amount" || field === "interestRate" || field === "installmentsCount" || field === "startYear") {
      if (field === "interestRate") {
        sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, "");
      } else {
        sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
      }
    }

    setForm(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    setSuccessMsg("");
    setErrorMsg("");
  }

  // محاسبات مقادیر وام بر اساس فرمول‌های بانکی و قرض‌الحسنه
  const loanSummary = useMemo(() => {
    const principal = Number(toEnglishDigits(form.amount)) || 0;
    const rate = Number(toEnglishDigits(form.interestRate)) || 0;
    const count = Number(toEnglishDigits(form.installmentsCount)) || 1;

    // محاسبه بهره کل = اصل مبلغ وام × (نرخ بهره / 100)
    const totalInterest = Math.round(principal * (rate / 100));
    const totalRepayment = principal + totalInterest;
    const monthlyInstallment = Math.round(totalRepayment / count);

    return { totalInterest, totalRepayment, monthlyInstallment };
  }, [form.amount, form.interestRate, form.installmentsCount]);

  // جدول زمان‌بندی اقساط شبیه‌سازی شده
  const amortizationSchedule = useMemo(() => {
    const count = Number(toEnglishDigits(form.installmentsCount)) || 0;
    if (count <= 0) return [];
    
    const schedule = [];
    let curYear = Number(toEnglishDigits(form.startYear)) || 1405;
    let curMonth = Number(toEnglishDigits(form.startMonth)) || 1;

    for (let i = 1; i <= count; i++) {
      const monthStr = String(curMonth).padStart(2, "0");
      const monthLabel = MONTHS.find(m => m.value === monthStr)?.label || "";
      schedule.push({
        index: i,
        period: `${monthLabel} ${curYear}`,
        amount: loanSummary.monthlyInstallment,
        status: "پرداخت نشده"
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }
    return schedule;
  }, [form.startYear, form.startMonth, form.installmentsCount, loanSummary.monthlyInstallment]);

  // لیست وام‌های پرسنل منتخب
  const selectedEmpLoans = useMemo(() => {
    if (!form.employeeId) return [];
    return (employeeLoans || []).filter(l => l.employeeId === form.employeeId);
  }, [employeeLoans, form.employeeId]);

  function loadRecord(record) {
    setForm({
      ...DEFAULT_FORM,
      ...record,
      amount: String(record.amount || ""),
      interestRate: String(record.interestRate || "0"),
      installmentsCount: String(record.installmentsCount || "12"),
      startYear: String(record.startYear || "1405"),
      startMonth: String(record.startMonth || "01"),
      loanNumber: String(record.loanNumber || "")
    });
    setEditingId(record._id || record.id);
    setSuccessMsg("");
    setErrorMsg("");
  }

  function handleReset() {
    if (window.confirm("آیا از خالی کردن فرم مطمئن هستید؟")) {
      setForm(DEFAULT_FORM);
      setEditingId(null);
      setSuccessMsg("");
      setErrorMsg("");
    }
  }

  async function handleSave() {
    if (!form.employeeId) {
      setErrorMsg("انتخاب کارمند الزامی است.");
      return;
    }
    if (!form.amount || Number(toEnglishDigits(form.amount)) <= 0) {
      setErrorMsg("مبلغ وام باید بزرگتر از صفر باشد.");
      return;
    }
    if (Number(toEnglishDigits(form.installmentsCount)) <= 0) {
      setErrorMsg("تعداد اقساط باید حداقل ۱ ماه باشد.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const selectedEmp = employees.find(e => (e._id || e.id) === form.employeeId);
      const employeeName = selectedEmp ? `${selectedEmp.firstName || ""} ${selectedEmp.lastName || ""}`.trim() : "—";
      const employeeCode = selectedEmp ? selectedEmp.code || "—" : "—";

      const payload = {
        ...form,
        amount: Number(toEnglishDigits(form.amount)),
        interestRate: Number(toEnglishDigits(form.interestRate)) || 0,
        installmentsCount: Number(toEnglishDigits(form.installmentsCount)),
        startYear: Number(toEnglishDigits(form.startYear)),
        totalInterest: loanSummary.totalInterest,
        totalRepayment: loanSummary.totalRepayment,
        monthlyInstallment: loanSummary.monthlyInstallment,
        employeeName,
        employeeCode,
        active: true
      };

      if (editingId) {
        payload.id = editingId;
        payload._id = editingId;
        await updateConfig("employee_loans", payload);
        setSuccessMsg(`وام شماره ${form.loanNumber} با موفقیت به‌روزرسانی شد.`);
      } else {
        const saved = await addConfig("employee_loans", payload);
        if (saved) {
          setEditingId(saved._id || saved.id);
        }
        setSuccessMsg(`وام شماره ${form.loanNumber} با موفقیت در سیستم ثبت گردید.`);
      }
      await refreshAllConfigs();
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ذخیره‌سازی اطلاعات وام.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id, num) {
    if (window.confirm(`آیا از حذف وام شماره ${num} مطمئن هستید؟`)) {
      try {
        await deleteConfig("employee_loans", id);
        setSuccessMsg(`وام شماره ${num} حذف شد.`);
        if (editingId === id) {
          setForm(DEFAULT_FORM);
          setEditingId(null);
        }
        await refreshAllConfigs();
      } catch (err) {
        console.error(err);
        setErrorMsg("خطا در حذف رکورد.");
      }
    }
  }

  return (
    <div className="space-y-5 text-right pb-10" dir="rtl">
      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Banknote className="h-5 w-5 text-indigo-600 animate-pulse" />
            ثبت و تعریف وام جدید پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            تعریف وام دریافتی، کارمزد قرض‌الحسنه، تعداد اقساط و شبیه‌سازی جدول استهلاک کسر اقساط از حقوق
          </p>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <Button variant="outline" size="sm" onClick={() => {
              setForm(DEFAULT_FORM);
              setEditingId(null);
              setSuccessMsg("فرم آماده تعریف وام جدید است.");
            }} className="h-9 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
              <Plus className="h-3.5 w-3.5" /> تعریف وام جدید
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="h-9 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> پاک کردن فرم
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Save className="h-4 w-4" /> {isSaving ? "در حال ذخیره..." : "ذخیره و ثبت وام"}
          </Button>
        </div>
      </div>

      {/* وضعیت ویرایش */}
      {editingId && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs p-3 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-indigo-500" />
            <span>شما در حال ویرایش اطلاعات وام شماره <strong className="text-indigo-900 font-extrabold">{form.loanNumber}</strong> هستید.</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => {
            setForm(DEFAULT_FORM);
            setEditingId(null);
            setSuccessMsg("فرم آماده تعریف وام جدید است.");
          }} className="h-6 text-[10px] text-indigo-600 hover:bg-indigo-100">انصراف و ثبت جدید</Button>
        </div>
      )}

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

      {/* بخش اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ستون راست: فرم ثبت وام */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                مشخصات و شرایط قرارداد وام پرسنل
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* کارمند */}
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId" className="text-xs font-bold text-slate-700">انتخاب کارمند / حقوق‌بگیر</Label>
                  <select
                    id="employeeId"
                    value={form.employeeId}
                    onChange={e => handleInputChange("employeeId", e.target.value)}
                    className="h-9 text-xs border rounded-lg px-2 bg-background w-full"
                  >
                    <option value="">-- پرسنل مورد نظر را انتخاب کنید --</option>
                    {employees.map(emp => (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.code} - {emp.firstName} {emp.lastName} ({emp.jobTitle || emp.role || "—"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* شماره وام */}
                <div className="space-y-1.5">
                  <Label htmlFor="loanNumber" className="text-xs font-bold text-slate-700">شماره وام (کد سیستم)</Label>
                  <Input
                    id="loanNumber"
                    type="text"
                    value={form.loanNumber}
                    onChange={e => handleInputChange("loanNumber", e.target.value)}
                    className="h-9 text-xs font-mono text-left"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* نوع وام */}
                <div className="space-y-1.5">
                  <Label htmlFor="loanType" className="text-xs font-bold text-slate-700">نوع وام مالی</Label>
                  <select
                    id="loanType"
                    value={form.loanType}
                    onChange={e => handleInputChange("loanType", e.target.value)}
                    className="h-9 text-xs border rounded-lg px-2 bg-background w-full"
                  >
                    {LOAN_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>

                {/* مبلغ وام */}
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs font-bold text-slate-700">مبلغ اصل وام (ریال)</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={toPersianDigits(form.amount)}
                    onChange={e => handleInputChange("amount", e.target.value)}
                    className="h-9 text-xs text-left font-mono"
                    placeholder="مثال: ۱۰۰۰۰۰۰۰۰"
                  />
                  <span className="block text-[10px] text-slate-400">
                    {form.amount ? `${fmt(form.amount)} ریال (${fmt(Number(form.amount) / 10)} تومان)` : "—"}
                  </span>
                </div>

                {/* درصد کارمزد */}
                <div className="space-y-1.5">
                  <Label htmlFor="interestRate" className="text-xs font-bold text-slate-700">نرخ کارمزد سالانه (٪)</Label>
                  <Input
                    id="interestRate"
                    type="text"
                    value={toPersianDigits(form.interestRate)}
                    onChange={e => handleInputChange("interestRate", e.target.value)}
                    className="h-9 text-xs text-left font-mono"
                    placeholder="۰ برای قرض‌الحسنه کارگاهی"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* تعداد اقساط */}
                <div className="space-y-1.5">
                  <Label htmlFor="installmentsCount" className="text-xs font-bold text-slate-700">تعداد اقساط (ماه)</Label>
                  <Input
                    id="installmentsCount"
                    type="text"
                    value={toPersianDigits(form.installmentsCount)}
                    onChange={e => handleInputChange("installmentsCount", e.target.value)}
                    className="h-9 text-xs text-left font-mono"
                    placeholder="مثال: ۱۲"
                  />
                </div>

                {/* تاریخ پرداخت */}
                <div className="space-y-1.5">
                  <Label htmlFor="payoutDate" className="text-xs font-bold text-slate-700">تاریخ پرداخت وام</Label>
                  <PersianDatePicker
                    value={form.payoutDate}
                    onChange={e => handleInputChange("payoutDate", e.target.value)}
                  />
                </div>

                {/* سال شروع کسر اقساط */}
                <div className="space-y-1.5">
                  <Label htmlFor="startYear" className="text-xs font-bold text-slate-700">سال شروع اقساط</Label>
                  <Input
                    id="startYear"
                    type="text"
                    maxLength={4}
                    value={toPersianDigits(form.startYear)}
                    onChange={e => handleInputChange("startYear", e.target.value)}
                    className="h-9 text-xs text-left font-mono"
                    placeholder="۱۴۰۵"
                  />
                </div>

                {/* ماه شروع کسر اقساط */}
                <div className="space-y-1.5">
                  <Label htmlFor="startMonth" className="text-xs font-bold text-slate-700">ماه شروع اقساط</Label>
                  <select
                    id="startMonth"
                    value={form.startMonth}
                    onChange={e => handleInputChange("startMonth", e.target.value)}
                    className="h-9 text-xs border rounded-lg px-2 bg-background w-full"
                  >
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* توضیحات */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-slate-700">توضیحات و ضمانت‌های وام</Label>
                <textarea
                  id="description"
                  rows={2}
                  value={form.description}
                  onChange={e => handleInputChange("description", e.target.value)}
                  className="w-full text-xs border rounded-lg p-2 bg-background focus:outline-indigo-500"
                  placeholder="مثال: تضمین شده با چک یا سفته شماره..."
                />
              </div>

              <Separator />

              {/* پنل خلاصه محاسبات */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30">
                <h4 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" />
                  خلاصه محاسبات مالی وام (استهلاک)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">جمع کارمزد/بهره کل:</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                      {fmt(loanSummary.totalInterest)} ریال
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">جمع کل بازپرداخت وام:</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                      {fmt(loanSummary.totalRepayment)} ریال
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">مبلغ هر قسط ماهانه:</span>
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 font-mono">
                      {fmt(loanSummary.monthlyInstallment)} ریال
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* پیش‌نمایش جدول اقساط زمان‌بندی شده */}
          {amortizationSchedule.length > 0 && (
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-xs font-bold text-slate-800">جدول سررسید اقساط ماهانه</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-right text-[11px] font-bold text-slate-700 w-16">قسط</TableHead>
                        <TableHead className="text-right text-[11px] font-bold text-slate-700">دوره کسر</TableHead>
                        <TableHead className="text-left text-[11px] font-bold text-slate-700">مبلغ قسط (ریال)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amortizationSchedule.map(row => (
                        <TableRow key={row.index} className="h-8">
                          <TableCell className="text-right text-xs font-mono text-slate-500">{toPersianDigits(row.index)}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-800">{toPersianDigits(row.period)}</TableCell>
                          <TableCell className="text-left text-xs font-mono font-bold text-indigo-600">{fmt(row.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ستون چپ: وام‌های فعال پرسنل منتخب یا کل لیست وام‌ها */}
        <div className="space-y-4">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-slate-800">
                {form.employeeId ? "لیست وام‌های کارمند منتخب" : "کل وام‌های ثبت‌شده اخیر"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[460px] overflow-y-auto">
                {((form.employeeId ? selectedEmpLoans : employeeLoans) || []).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    هیچ وامی برای این بخش ثبت نشده است.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {((form.employeeId ? selectedEmpLoans : employeeLoans) || []).map(loan => {
                      const isCurrent = editingId === (loan._id || loan.id);
                      return (
                        <div key={loan._id || loan.id} className={`p-3 text-xs space-y-1.5 transition-colors hover:bg-slate-50 ${isCurrent ? "bg-indigo-50/20" : ""}`}>
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-indigo-600 font-mono">{toPersianDigits(loan.loanNumber)}</span>
                            <span className="text-[10px] text-slate-500">
                              {LOAN_TYPES.find(t => t.value === loan.loanType)?.label || "وام"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium">
                            پرسنل: <strong className="text-slate-800">{loan.employeeName}</strong> ({toPersianDigits(loan.employeeCode)})
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>مبلغ وام: <strong className="text-slate-700 font-mono">{fmt(loan.amount)}</strong></span>
                            <span>اقساط: <strong className="text-slate-700 font-mono">{toPersianDigits(loan.installmentsCount)} ماهه</strong></span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-50">
                            <span>قسط: <strong className="text-indigo-700 font-mono">{fmt(loan.monthlyInstallment)}</strong></span>
                            <div className="flex gap-1">
                              <button onClick={() => loadRecord(loan)} className="p-1 hover:text-indigo-600 text-slate-400 transition-colors">
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(loan._id || loan.id, loan.loanNumber)} className="p-1 hover:text-rose-600 text-slate-400 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
