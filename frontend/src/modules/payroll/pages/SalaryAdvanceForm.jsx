import { useState, useMemo, useEffect } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Coins, Save, Plus, Trash2, Edit, RefreshCw, Calendar, Search, Info, CheckCircle, AlertCircle, FileText
} from "lucide-react";
import { toPersianDigits, toEnglishDigits } from "./InsuranceSettings";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

const MONTHS = [
  { value: "01", label: "فروردین" }, { value: "02", label: "اردیبهشت" }, { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },     { value: "05", label: "مرداد" },     { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },     { value: "08", label: "آبان" },      { value: "09", label: "آذر" },
  { value: "10", label: "دی" },      { value: "11", label: "بهمن" },      { value: "12", label: "اسفند" }
];

const DEFAULT_FORM = {
  docNumber: "",
  employeeId: "",
  amount: "",
  year: "1405",
  month: "01",
  payoutDate: "1405/01/01",
  description: ""
};

const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

export default function SalaryAdvanceForm() {
  const { employees, employeeAdvances, addConfig, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  // تولید خودکار شماره سند مساعده
  useEffect(() => {
    if (!editingId) {
      const nextNum = (employeeAdvances?.length || 0) + 1001;
      setForm(prev => ({ ...prev, docNumber: `ADV-${nextNum}` }));
    }
  }, [employeeAdvances, editingId]);

  function handleInputChange(field, value) {
    let sanitizedValue = toEnglishDigits(value);
    
    if (field === "amount" || field === "year") {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    }

    setForm(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    setSuccessMsg("");
    setErrorMsg("");
  }

  // فیلتر کردن مساعده‌ها بر اساس نام و کد کارمند
  const filteredAdvances = useMemo(() => {
    const q = search.toLowerCase();
    return (employeeAdvances || []).filter(adv => {
      return !q || 
        adv.employeeName?.toLowerCase().includes(q) || 
        adv.employeeCode?.toLowerCase().includes(q) || 
        adv.docNumber?.toLowerCase().includes(q);
    });
  }, [employeeAdvances, search]);

  function loadRecord(record) {
    setForm({
      ...DEFAULT_FORM,
      ...record,
      amount: String(record.amount || ""),
      year: String(record.year || "1405"),
      month: String(record.month || "01"),
      docNumber: String(record.docNumber || "")
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
      setErrorMsg("مبلغ مساعده باید بزرگتر از صفر باشد.");
      return;
    }
    if (!form.year || form.year.length !== 4) {
      setErrorMsg("سال مالی باید ۴ رقم باشد.");
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
        year: Number(toEnglishDigits(form.year)),
        employeeName,
        employeeCode,
        active: true
      };

      if (editingId) {
        payload.id = editingId;
        payload._id = editingId;
        await updateConfig("employee_advances", payload);
        setSuccessMsg(`سند مساعده شماره ${form.docNumber} با موفقیت به‌روزرسانی شد.`);
      } else {
        const saved = await addConfig("employee_advances", payload);
        if (saved) {
          setEditingId(saved._id || saved.id);
        }
        setSuccessMsg(`سند مساعده شماره ${form.docNumber} با موفقیت ثبت و آماده کسر در محاسبات شد.`);
      }
      await refreshAllConfigs();
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ذخیره‌سازی اطلاعات مساعده.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id, num) {
    if (window.confirm(`آیا از حذف سند مساعده شماره ${num} مطمئن هستید؟`)) {
      try {
        await deleteConfig("employee_advances", id);
        setSuccessMsg(`مساعده شماره ${num} حذف شد.`);
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
      {/* هدر بالایی */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coins className="h-5 w-5 text-indigo-600 animate-bounce" />
            ثبت و تعریف مساعده حقوق پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            ثبت مبالغ مساعده دریافتی میانه ماه جهت کسر خودکار در لیست محاسبه حقوق و دستمزد پایان ماه جاری پرسنل
          </p>
        </div>
        <div className="flex gap-2">
          {editingId && (
            <Button variant="outline" size="sm" onClick={() => {
              setForm(DEFAULT_FORM);
              setEditingId(null);
              setSuccessMsg("فرم آماده تعریف مساعده جدید است.");
            }} className="h-9 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200">
              <Plus className="h-3.5 w-3.5" /> تعریف مساعده جدید
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="h-9 text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> پاک کردن فرم
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Save className="h-4 w-4" /> {isSaving ? "در حال ذخیره..." : "ثبت مساعده"}
          </Button>
        </div>
      </div>

      {/* وضعیت ویرایش */}
      {editingId && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs p-3 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-indigo-500" />
            <span>شما در حال ویرایش اطلاعات مساعده شماره <strong className="text-indigo-900 font-extrabold">{form.docNumber}</strong> هستید.</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => {
            setForm(DEFAULT_FORM);
            setEditingId(null);
            setSuccessMsg("فرم آماده تعریف مساعده جدید است.");
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ستون راست: فرم ثبت */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                مشخصات مساعده پرداخت شده
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* کارمند */}
                <div className="space-y-1.5">
                  <Label htmlFor="employeeId" className="text-xs font-bold text-slate-700">انتخاب پرسنل</Label>
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

                {/* شماره سند */}
                <div className="space-y-1.5">
                  <Label htmlFor="docNumber" className="text-xs font-bold text-slate-700">شماره سند مساعده</Label>
                  <Input
                    id="docNumber"
                    type="text"
                    value={form.docNumber}
                    className="h-9 text-xs font-mono text-left"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* مبلغ مساعده */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="amount" className="text-xs font-bold text-slate-700">مبلغ مساعده (ریال)</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={toPersianDigits(form.amount)}
                    onChange={e => handleInputChange("amount", e.target.value)}
                    className="h-9 text-xs text-left font-mono"
                    placeholder="مثال: ۵۰۰۰۰۰۰"
                  />
                  <span className="block text-[10px] text-slate-400">
                    {form.amount ? `${fmt(form.amount)} ریال (${fmt(Number(form.amount) / 10)} تومان)` : "—"}
                  </span>
                </div>

                {/* تاریخ پرداخت */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="payoutDate" className="text-xs font-bold text-slate-700">تاریخ پرداخت</Label>
                  <PersianDatePicker
                    value={form.payoutDate}
                    onChange={e => handleInputChange("payoutDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* سال کسر از حقوق */}
                <div className="space-y-1.5">
                  <Label htmlFor="year" className="text-xs font-bold text-slate-700">سال کسر از حقوق</Label>
                  <Input
                    id="year"
                    type="text"
                    maxLength={4}
                    value={toPersianDigits(form.year)}
                    onChange={e => handleInputChange("year", e.target.value)}
                    className="h-9 text-xs text-left font-mono"
                    placeholder="۱۴۰۵"
                  />
                </div>

                {/* ماه کسر از حقوق */}
                <div className="space-y-1.5">
                  <Label htmlFor="month" className="text-xs font-bold text-slate-700">ماه کسر از حقوق</Label>
                  <select
                    id="month"
                    value={form.month}
                    onChange={e => handleInputChange("month", e.target.value)}
                    className="h-9 text-xs border rounded-lg px-2 bg-background w-full"
                  >
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* توضیحات */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-slate-700">توضیحات سند</Label>
                <textarea
                  id="description"
                  rows={2}
                  value={form.description}
                  onChange={e => handleInputChange("description", e.target.value)}
                  className="w-full text-xs border rounded-lg p-2 bg-background focus:outline-indigo-500"
                  placeholder="جزئیات اضافی درباره واریز..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ستون چپ: لیست سوابق ثبت‌شده */}
        <div className="space-y-4">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row justify-between items-center">
              <span className="text-xs font-bold text-slate-800">مساعده‌های اخیر پرسنل</span>
              <div className="relative w-36">
                <Search className="absolute right-2.5 top-1.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="جستجو..."
                  className="h-7 pr-8 text-[10px]"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {filteredAdvances.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    هیچ موردی ثبت نشده است.
                  </div>
                ) : (
                  filteredAdvances.map(adv => {
                    const isEditing = editingId === (adv._id || adv.id);
                    const monthLabel = MONTHS.find(m => m.value === adv.month)?.label || "";
                    return (
                      <div key={adv._id || adv.id} className={`p-3 text-xs space-y-1 transition-colors hover:bg-slate-50 ${isEditing ? "bg-indigo-50/20" : ""}`}>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-indigo-600 font-mono">{toPersianDigits(adv.docNumber)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {toPersianDigits(adv.year)}/{toPersianDigits(adv.month)} ({monthLabel})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-700">
                          پرسنل: <strong className="text-slate-900">{adv.employeeName}</strong>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>مبلغ: <strong className="text-emerald-600 font-mono">{fmt(adv.amount)} ریال</strong></span>
                          <div className="flex gap-1.5">
                            <button onClick={() => loadRecord(adv)} className="hover:text-indigo-600 text-slate-400">
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(adv._id || adv.id, adv.docNumber)} className="hover:text-rose-600 text-slate-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
