import { useState, useMemo, useEffect } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Modal } from "@/components/ui/modal";
import {
  FileText, Plus, Pencil, Trash2, Printer, Save, RefreshCw, Briefcase,
  Calendar, Landmark, ShieldCheck, User, ClipboardList, Info, Download, X, Search, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  decreeNo: "",
  employeeId: "",
  issueDate: "",
  effectiveDate: "",
  employmentType: "contractual", // official_permanent, official_probation, contractual, labor
  jobTitle: "",
  jobGroup: "8",
  jobBase: "3",
  baseSalary: 166255500, // Monthly base salary (based on daily 5,541,850 * 30)
  seniorityAllowance: 0,
  housingAllowance: 30000000,
  groceryAllowance: 22000000,
  childAllowance: 0,
  responsibilityAllowance: 0,
  expertiseAllowance: 0,
  otherAllowances: 0,
  description: "اعمال افزایش ضریب حقوقی سالانه قانون کار"
};

export default function EmployeeDecrees() {
  const {
    employees, employeeDecrees, addConfig, updateConfig, deleteConfig, refreshAllConfigs
  } = useAssets();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedDecreeForPrint, setSelectedDecreeForPrint] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Organization setting states
  const [orgName, setOrgName] = useState(localStorage.getItem("org_name") || "");
  const [isOpenOrgModal, setIsOpenOrgModal] = useState(!localStorage.getItem("org_name"));
  const [tempOrgName, setTempOrgName] = useState(localStorage.getItem("org_name") || "");

  function handleSaveOrgName(e) {
    e.preventDefault();
    if (!tempOrgName.trim()) {
      alert("نام سازمان/اداره نمی‌تواند خالی باشد.");
      return;
    }
    localStorage.setItem("org_name", tempOrgName);
    setOrgName(tempOrgName);
    setIsOpenOrgModal(false);
  }

  // Auto-generate decree number
  useEffect(() => {
    if (!editingId && employeeDecrees && employeeDecrees.length > 0) {
      const numbers = employeeDecrees
        .map(d => d.decreeNo)
        .filter(n => n && n.startsWith("DEC-1405-"))
        .map(n => Number(n.replace("DEC-1405-", "")))
        .filter(num => !isNaN(num));
      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : employeeDecrees.length + 1;
      setForm(f => ({ ...f, decreeNo: `DEC-1405-${String(nextNum).padStart(3, "0")}` }));
    } else if (!editingId) {
      setForm(f => ({ ...f, decreeNo: "DEC-1405-001" }));
    }
  }, [employeeDecrees, editingId, showForm]);

  // Dropdown options for employees
  const employeeOptions = useMemo(() => {
    return (employees || []).map(e => ({
      value: e._id || e.id,
      label: `${e.code} — ${e.firstName} ${e.lastName} (${e.jobTitle || "بدون سمت"})`
    }));
  }, [employees]);

  // Auto-fill values when employee selected
  function handleEmployeeChange(empId) {
    const emp = (employees || []).find(e => (e._id === empId || e.id === empId));
    if (emp) {
      setForm(f => ({
        ...f,
        employeeId: empId,
        jobTitle: emp.jobTitle || emp.role || "",
        baseSalary: emp.dailyBaseSalary ? emp.dailyBaseSalary * 30 : 166255500,
        housingAllowance: emp.housingAllowance || 30000000,
        groceryAllowance: emp.groceryAllowance || 22000000,
        childAllowance: emp.childAllowance || 0,
        responsibilityAllowance: emp.responsibilityAllowance || 0,
        expertiseAllowance: emp.expertiseAllowance || 0,
        otherAllowances: emp.otherAllowances || 0,
      }));
    } else {
      setForm(f => ({ ...f, employeeId: empId }));
    }
  }

  // Monthly total calculation
  const totalSalary =
    Number(form.baseSalary || 0) +
    Number(form.seniorityAllowance || 0) +
    Number(form.housingAllowance || 0) +
    Number(form.groceryAllowance || 0) +
    Number(form.childAllowance || 0) +
    Number(form.responsibilityAllowance || 0) +
    Number(form.expertiseAllowance || 0) +
    Number(form.otherAllowances || 0);

  // Filtered decrees
  const filteredDecrees = useMemo(() => {
    return (employeeDecrees || []).filter(d => {
      const emp = (employees || []).find(e => (e._id === d.employeeId || e.id === d.employeeId));
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : "";
      const empCode = emp ? emp.code : "";
      const searchLower = search.toLowerCase();
      return (
        !search ||
        d.decreeNo?.toLowerCase().includes(searchLower) ||
        empName.toLowerCase().includes(searchLower) ||
        empCode.toLowerCase().includes(searchLower) ||
        d.jobTitle?.toLowerCase().includes(searchLower)
      );
    });
  }, [employeeDecrees, employees, search]);

  function handleChange(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setErrorMsg("");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.employeeId) {
      setErrorMsg("انتخاب کارمند الزامی است.");
      return;
    }
    if (!form.decreeNo.trim()) {
      setErrorMsg("شماره حکم کارگزینی الزامی است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      let result;
      if (editingId) {
        result = await updateConfig("employee_decrees", { ...form, id: editingId, _id: editingId });
      } else {
        result = await addConfig("employee_decrees", form);
      }

      if (result) {
        setSuccessMsg(editingId ? "حکم کارگزینی با موفقیت ویرایش شد." : "حکم کارگزینی با موفقیت صادر و ثبت شد.");
        setForm(INITIAL_FORM);
        setEditingId(null);
        setShowForm(false);
        await refreshAllConfigs();
      } else {
        setErrorMsg("خطا در ذخیره حکم در سرور.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطایی در ارتباط با سرور رخ داد.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(decree) {
    setForm(decree);
    setEditingId(decree._id || decree.id);
    setShowForm(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleDelete(id) {
    if (window.confirm("آیا از حذف این حکم کارگزینی مطمئن هستید؟")) {
      const success = await deleteConfig("employee_decrees", id);
      if (success) {
        await refreshAllConfigs();
      }
    }
  }

  // Open official print preview
  function triggerPrint(decree) {
    const emp = (employees || []).find(e => (e._id === decree.employeeId || e.id === decree.employeeId));
    setSelectedDecreeForPrint({
      ...decree,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "نامشخص",
      employeeCode: emp ? emp.code : "—",
      nationalId: emp ? emp.nationalId : "—",
      fatherName: emp ? emp.fatherName : "—",
      birthDate: emp ? emp.birthDate : "—",
      insuranceNo: emp ? emp.insuranceNo || emp.insuranceCode || "—" : "—",
      education: emp ? emp.education || "—" : "—"
    });
  }

  // Print Isolated A4 portrait
  function printPage() {
    const el = document.getElementById("printable-decree-sheet");
    if (!el) return;

    const clone = el.cloneNode(true);
    const win = window.open("", "_blank", "width=850,height=1100");
    if (!win) {
      window.print();
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>حکم کارگزینی - ${selectedDecreeForPrint?.employeeName || ""}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 100%;
      font-family: "Tahoma", "Arial", sans-serif;
      font-size: 11px;
      line-height: 1.6;
      color: #111;
      direction: rtl;
      padding: 5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    
    .border { border: 1px solid #222; }
    .border-b-2 { border-bottom: 2px solid #111; }
    .border-b { border-bottom: 1px solid #555; }
    .border-r { border-right: 1px solid #222; }
    
    .p-2 { padding: 0.5rem; }
    .p-4 { padding: 1rem; }
    .pt-12 { padding-top: 3rem; }
    
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: Courier, monospace; }
    
    .w-full { width: 100%; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .gap-4 { gap: 1rem; }
    
    .table-layout {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .table-layout th, .table-layout td {
      border: 1px solid #222;
      padding: 6px 10px;
      text-align: right;
    }
    
    .table-layout thead th {
      background-color: #eaeaea !important;
      font-weight: bold;
    }

    .header-box {
      border: 2px solid #222;
      border-bottom: 0;
      padding: 10px;
    }
    
    .info-box {
      border: 2px solid #222;
      padding: 10px;
      margin-bottom: 10px;
    }

    .signature-area {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
      margin-top: 50px;
      page-break-inside: avoid;
    }

    .signature-box {
      height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .no-print { display: none !important; }
  </style>
</head>
<body>
  ${clone.innerHTML}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 300);
    };
  </script>
</body>
</html>`);

    win.document.close();
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">
      
      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 no-print">
        <div className="text-right">
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            احکام کارگزینی و حقوقی پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            صدور و چاپ احکام تعیین حقوق، مزایا، سمت استخدامی و ردیف‌های قانون کار مستخدمین.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setTempOrgName(orgName); setIsOpenOrgModal(true); }}
            className="h-9 text-xs gap-1.5 font-bold text-slate-700"
          >
            <Settings className="h-4 w-4" />
            تنظیم نام اداره ({orgName || "ثبت نشده"})
          </Button>
          {!showForm && !selectedDecreeForPrint && (
            <Button size="sm" onClick={() => { setForm(INITIAL_FORM); setEditingId(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Plus className="h-4 w-4" /> صدور حکم جدید
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 no-print">
          <Info className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2 no-print">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ۱. پیش‌نمایش و چاپ حکم کارگزینی رسمی */}
      {selectedDecreeForPrint && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setSelectedDecreeForPrint(null)} className="h-9 text-xs gap-1.5">
              <X className="h-4 w-4" /> بستن پیش‌نمایش
            </Button>
            <Button size="sm" onClick={printPage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Printer className="h-4 w-4" /> چاپ حکم رسمی (A4)
            </Button>
          </div>

          <Card className="border-slate-300 shadow-lg p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans" id="printable-decree-sheet">
            {/* سربرگ حکم کارگزینی */}
            <div className="border-2 border-slate-950 p-4">
              <div className="grid grid-cols-3 items-center text-center pb-2 border-b-2 border-slate-950">
                <div className="text-right text-xs space-y-1">
                  <div className="font-bold">{orgName || "وزارت امور اقتصادی و دارایی"}</div>
                  <div className="text-[10px] text-slate-500">امور منابع انسانی و اداری</div>
                </div>
                <div className="space-y-1">
                  <h1 className="text-sm font-black">حکم کارگزینی تعیین حقوق و مزایا</h1>
                  <span className="text-[10px] text-slate-500">(موضوع ماده قانون کار جمهوری اسلامی ایران)</span>
                </div>
                <div className="text-left text-xs space-y-1 font-mono">
                  <div>شماره حکم: <strong>{selectedDecreeForPrint.decreeNo}</strong></div>
                  <div>تاریخ صدور: <strong>{selectedDecreeForPrint.issueDate || "—"}</strong></div>
                  <div>تاریخ اجرا: <strong>{selectedDecreeForPrint.effectiveDate || "—"}</strong></div>
                </div>
              </div>

              {/* جدول اطلاعات پرسنلی مستخدم */}
              <div className="mt-4">
                <h3 className="font-bold text-xs bg-slate-100 p-1.5 border border-slate-950 text-right">الف) مشخصات شناسنامه‌ای و استخدامی مستخدم</h3>
                <div className="grid grid-cols-4 border-x border-b border-slate-950 text-xs">
                  <div className="p-2 border-r border-slate-950">نام و نام خانوادگی: <strong className="font-bold">{selectedDecreeForPrint.employeeName}</strong></div>
                  <div className="p-2 border-r border-slate-950">کد پرسنلی: <strong>{selectedDecreeForPrint.employeeCode}</strong></div>
                  <div className="p-2 border-r border-slate-950">کد ملی: <strong>{selectedDecreeForPrint.nationalId}</strong></div>
                  <div className="p-2">نام پدر: <strong>{selectedDecreeForPrint.fatherName}</strong></div>
                  
                  <div className="p-2 border-t border-r border-slate-950">تاریخ تولد: <strong>{selectedDecreeForPrint.birthDate}</strong></div>
                  <div className="p-2 border-t border-r border-slate-950">شماره بیمه: <strong>{selectedDecreeForPrint.insuranceNo}</strong></div>
                  <div className="p-2 border-t border-r border-slate-950">مدرک تحصیلی: <strong>{selectedDecreeForPrint.education}</strong></div>
                  <div className="p-2 border-t">سمت شغلی: <strong className="font-bold">{selectedDecreeForPrint.jobTitle || "—"}</strong></div>

                  <div className="p-2 border-t border-r border-slate-950">نوع استخدام: <strong>
                    {selectedDecreeForPrint.employmentType === "official_permanent" ? "رسمی قطعی" :
                     selectedDecreeForPrint.employmentType === "official_probation" ? "رسمی آزمایشی" :
                     selectedDecreeForPrint.employmentType === "contractual" ? "قرارداد کار معین" : "قانون کار"}
                  </strong></div>
                  <div className="p-2 border-t border-r border-slate-950">گروه شغلی: <strong>{selectedDecreeForPrint.jobGroup}</strong></div>
                  <div className="p-2 border-t border-r border-slate-950">پایه: <strong>{selectedDecreeForPrint.jobBase}</strong></div>
                  <div className="p-2 border-t">شرح حکم: <strong>{selectedDecreeForPrint.description || "—"}</strong></div>
                </div>
              </div>

              {/* جدول فوق‌العاده‌ها و اقلام حقوقی ماهانه */}
              <div className="mt-4">
                <h3 className="font-bold text-xs bg-slate-100 p-1.5 border border-slate-950 text-right">ب) جزئیات فوق‌العاده‌ها، حقوق و مزایای مستمر ماهانه مندرج در حکم (ریال)</h3>
                <table className="w-full text-right text-xs table-layout border-slate-950">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-950">
                      <th className="px-4 py-2 border-r border-slate-950">ردیف</th>
                      <th className="px-4 py-2 border-r border-slate-950">شرح فوق‌العاده و مزایای مستمر حکم</th>
                      <th className="px-4 py-2 text-left">مبلغ مقرر در حکم (ریال)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۱</td>
                      <td className="px-4 py-2 border-r border-slate-950 font-bold">حقوق پایه ماهانه (مبنای حکم)</td>
                      <td className="px-4 py-2 text-left font-mono font-bold">{Number(selectedDecreeForPrint.baseSalary || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۲</td>
                      <td className="px-4 py-2 border-r border-slate-950">فوق‌العاده پایه سنوات (سابقه کار)</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.seniorityAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۳</td>
                      <td className="px-4 py-2 border-r border-slate-950">کمک هزینه مسکن (حق مسکن)</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.housingAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۴</td>
                      <td className="px-4 py-2 border-r border-slate-950">کمک هزینه اقلام مصرفی (بن خواربار)</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.groceryAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۵</td>
                      <td className="px-4 py-2 border-r border-slate-950">حق عائله‌مندی و اولاد ماهانه</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.childAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۶</td>
                      <td className="px-4 py-2 border-r border-slate-950">فوق‌العاده مسئولیت و مدیریت</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.responsibilityAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۷</td>
                      <td className="px-4 py-2 border-r border-slate-950">فوق‌العاده جذب و تخصصی حقوق</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.expertiseAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="border-b border-slate-950">
                      <td className="px-4 py-2 border-r border-slate-950 text-center">۸</td>
                      <td className="px-4 py-2 border-r border-slate-950">سایر فوق‌العاده‌ها و کمک‌هزینه‌های قانونی</td>
                      <td className="px-4 py-2 text-left font-mono">{Number(selectedDecreeForPrint.otherAllowances || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="bg-slate-50 font-black border-slate-950 text-indigo-950 text-xs">
                      <td colSpan={2} className="px-4 py-2.5 border-r border-slate-950">جمع کل ناخالص ماهانه حکم کارگزینی (ریال)</td>
                      <td className="px-4 py-2.5 text-left font-mono text-sm">
                        {(
                          Number(selectedDecreeForPrint.baseSalary || 0) +
                          Number(selectedDecreeForPrint.seniorityAllowance || 0) +
                          Number(selectedDecreeForPrint.housingAllowance || 0) +
                          Number(selectedDecreeForPrint.groceryAllowance || 0) +
                          Number(selectedDecreeForPrint.childAllowance || 0) +
                          Number(selectedDecreeForPrint.responsibilityAllowance || 0) +
                          Number(selectedDecreeForPrint.expertiseAllowance || 0) +
                          Number(selectedDecreeForPrint.otherAllowances || 0)
                        ).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* کادر تایید و امضا */}
              <div className="signature-area text-xs font-bold pt-8">
                <div className="signature-box flex flex-col justify-between h-20">
                  <span>تنظیم کننده (رئیس کارگزینی)</span>
                  <span className="text-[10px] text-slate-400">امضا و تاریخ</span>
                </div>
                <div className="signature-box flex flex-col justify-between h-20">
                  <span>تایید کننده (مدیر امور مالی)</span>
                  <span className="text-[10px] text-slate-400">مهر و امضا</span>
                </div>
                <div className="signature-box flex flex-col justify-between h-20">
                  <span>مستند ابلاغ حکم (مستخدم)</span>
                  <span className="text-[10px] text-slate-400">امضا و اثر انگشت</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ۲. فرم ثبت / ویرایش حکم جدید */}
      {showForm && !selectedDecreeForPrint && (
        <Card className="border-slate-100 no-print">
          <CardHeader className="text-right border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              {editingId ? "ویرایش مشخصات حکم کارگزینی" : "صدور و تعریف حکم کارگزینی جدید پرسنل"}
            </CardTitle>
            <CardDescription className="text-xs">اطلاعات هویتی استخدامی و ردیف‌های ریالی حکم مستخدم را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* تب هویتی */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-blue-600">اطلاعات صدور و رده استخدامی</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">انتخاب پرسنل / مستخدم <span className="text-rose-500">*</span></Label>
                    <div className="mt-1.5">
                      <SearchableSelect
                        value={form.employeeId}
                        onChange={handleEmployeeChange}
                        options={employeeOptions}
                        placeholder="انتخاب کارمند..."
                        disabled={!!editingId}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">شماره حکم کارگزینی <span className="text-rose-500">*</span></Label>
                    <Input value={form.decreeNo} onChange={e => handleChange("decreeNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" required />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">نوع رابطه استخدامی</Label>
                    <select value={form.employmentType} onChange={e => handleChange("employmentType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                      <option value="contractual">قرارداد کار معین</option>
                      <option value="official_permanent">رسمی قطعی</option>
                      <option value="official_probation">رسمی آزمایشی</option>
                      <option value="labor">مشمول قانون کار (کارگری)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تاریخ صدور حکم</Label>
                    <PersianDatePicker value={form.issueDate} onChange={e => handleChange("issueDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۰۱" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تاریخ اجرای حکم</Label>
                    <PersianDatePicker value={form.effectiveDate} onChange={e => handleChange("effectiveDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۰۱" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">سمت / عنوان شغلی در حکم</Label>
                    <Input value={form.jobTitle} onChange={e => handleChange("jobTitle", e.target.value)} className="h-9 text-xs mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">رسته / گروه شغلی</Label>
                    <Input value={form.jobGroup} onChange={e => handleChange("jobGroup", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">پایه شغلی</Label>
                    <Input value={form.jobBase} onChange={e => handleChange("jobBase", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">شرح / دلیل صدور حکم</Label>
                    <Input value={form.description} onChange={e => handleChange("description", e.target.value)} className="h-9 text-xs mt-1.5" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* تب حقوق و فوق‌العاده‌ها */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-emerald-600">جدول ردیف‌های ریالی مستمر حکم ماهانه (۱۴۰۵)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">حقوق پایه ماهانه (ریال)</Label>
                    <Input type="number" value={form.baseSalary} onChange={e => handleChange("baseSalary", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left font-bold" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">فوق‌العاده پایه سنوات (ریال)</Label>
                    <Input type="number" value={form.seniorityAllowance} onChange={e => handleChange("seniorityAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">کمک هزینه مسکن (ریال)</Label>
                    <Input type="number" value={form.housingAllowance} onChange={e => handleChange("housingAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">کمک هزینه بن خواربار (ریال)</Label>
                    <Input type="number" value={form.groceryAllowance} onChange={e => handleChange("groceryAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">حق اولاد و عائله‌مندی (ریال)</Label>
                    <Input type="number" value={form.childAllowance} onChange={e => handleChange("childAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">فوق‌العاده مسئولیت / مدیریت (ریال)</Label>
                    <Input type="number" value={form.responsibilityAllowance} onChange={e => handleChange("responsibilityAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">فوق‌العاده جذب و تخصص (ریال)</Label>
                    <Input type="number" value={form.expertiseAllowance} onChange={e => handleChange("expertiseAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">سایر فوق‌العاده‌های قانونی (ریال)</Label>
                    <Input type="number" value={form.otherAllowances} onChange={e => handleChange("otherAllowances", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded-xl flex justify-between items-center border border-emerald-500/20 mt-4">
                  <span className="text-xs font-bold text-slate-600">جمع کل ناخالص ماهانه حکم کارگزینی:</span>
                  <span className="font-mono text-base font-black text-emerald-800 dark:text-emerald-400">
                    {(totalSalary / 10).toLocaleString("fa-IR")} <span className="text-xs font-semibold">تومان</span>
                    <span className="block text-[10px] text-muted-foreground text-left">{totalSalary.toLocaleString("fa-IR")} ریال</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-9 text-xs">انصراف</Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "در حال صدور..." : "ثبت و صدور حکم"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* ۳. جدول لیست احکام صادر شده */}
      {!showForm && !selectedDecreeForPrint && (
        <Card className="border-slate-100 no-print">
          <CardContent className="pt-4">
            
            <div className="flex justify-between items-center gap-2 mb-4">
              <div className="flex items-center gap-2 max-w-sm flex-1">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <Input
                  placeholder="جستجو بر اساس شماره حکم، نام کارمند، سمت..."
                  className="h-8 text-xs"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right w-32">شماره حکم</TableHead>
                    <TableHead className="text-right">نام پرسنل</TableHead>
                    <TableHead className="text-right">عنوان شغلی</TableHead>
                    <TableHead className="text-center w-24">تاریخ صدور</TableHead>
                    <TableHead className="text-center w-24">تاریخ اجرا</TableHead>
                    <TableHead className="text-right w-36">حقوق ناخالص ماهانه (ریال)</TableHead>
                    <TableHead className="text-center w-28">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDecrees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                        هیچ حکم کارگزینی صادر شده‌ای یافت نشد.
                      </TableCell>
                    </TableRow>
                  ) : filteredDecrees.map(d => {
                    const emp = (employees || []).find(e => (e._id === d.employeeId || e.id === d.employeeId));
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "—";

                    const gross =
                      Number(d.baseSalary || 0) +
                      Number(d.seniorityAllowance || 0) +
                      Number(d.housingAllowance || 0) +
                      Number(d.groceryAllowance || 0) +
                      Number(d.childAllowance || 0) +
                      Number(d.responsibilityAllowance || 0) +
                      Number(d.expertiseAllowance || 0) +
                      Number(d.otherAllowances || 0);

                    return (
                      <tr key={d._id || d.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-300">{d.decreeNo}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{empName}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{d.jobTitle || "—"}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{d.issueDate || "—"}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{d.effectiveDate || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-left text-emerald-700 dark:text-emerald-400">{gross.toLocaleString("fa-IR")}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => triggerPrint(d)}
                              title="چاپ حکم کارگزینی رسمی"
                            >
                              <Printer className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(d)}
                              title="ویرایش حکم"
                            >
                              <Pencil className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(d._id || d.id)}
                              title="حذف حکم"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* مودال هوشمند تنظیم نام اداره/سازمان */}
      <Modal
        open={isOpenOrgModal}
        onClose={() => { if (orgName) setIsOpenOrgModal(false); }}
        title="تنظیم نام اداره / سازمان"
        description="لطفاً نام اداره یا سازمان خود را جهت درج در سربرگ رسمی احکام کارگزینی وارد کنید."
        size="md"
      >
        <form onSubmit={handleSaveOrgName} className="space-y-4 p-4 text-right" dir="rtl">
          <div>
            <Label className="text-xs font-semibold">نام سازمان یا اداره دولتی / شرکت <span className="text-rose-500">*</span></Label>
            <Input
              value={tempOrgName}
              onChange={e => setTempOrgName(e.target.value)}
              placeholder="مثال: اداره کل منابع طبیعی و آبخیزداری استان"
              className="mt-1.5 text-xs h-9"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            {orgName && (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenOrgModal(false)} className="h-9 text-xs">
                انصراف
              </Button>
            )}
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-6 shadow">
              ذخیره و تایید
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
