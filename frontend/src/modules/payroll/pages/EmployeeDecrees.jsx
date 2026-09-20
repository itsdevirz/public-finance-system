import { useState, useMemo, useEffect } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Modal } from "@/components/ui/modal";
import { FileText, Plus, Pencil, Trash2, Printer, Save, ShieldCheck, Info, X, Search, Settings } from "lucide-react";

// Initial Form state based on official administrative decree specs
const INITIAL_FORM = {
  decreeNo: "",
  employeeId: "",
  decreeTitle: "حکم کارگزینی کارمند رسمی", // عنوان حکم
  description: "تعیین حقوق، فوق‌العاده‌ها و مزایای مستمر حکم کارگزینی سالانه", // شرح حکم
  issueDate: "",
  effectiveDate: "",
  issuingAuthority: "مدیرکل امور اداری و پشتیبانی", // مقام مسئول صادرکننده

  // امتیازات و حقوق ثابت و مزایا (۲۲ ردیف حکم کارگزینی - بخش ۴)
  jobPayPoints: 8300,                 // امتیاز ۱. حق شغل
  jobPay: 120000000,                  // ۱. حق شغل
  managementAllowancePoints: 2250,     // امتیاز ۲. فوق العاده مدیریت
  managementAllowance: 15000000,      // ۲. فوق العاده مدیریت
  employeePayPoints: 5900,             // امتیاز ۳. حق شاغل
  employeePay: 45000000,              // ۳. حق شاغل
                                      // - جمع حقوق ثابت (الف) = ۱ + ۲ + ۳
  adaptationDiff: 0,                 // ۴. ب) تفاوت تطبیق
  underdevelopedAreaAllowance: 0,     // ۵. ث) فوق العاده مناطق کمتر توسعه یافته
  badWeatherAllowance: 0,             // ۶. ج) فوق العاده بدی آب و هوا
  sacrificeAllowance: 0,              // ۷. ح) فوق العاده ایثارگری
  warZoneAllowance: 0,                // ۸. خ) خدمت در مناطق جنگ زده
  hardshipAllowance: 0,               // ۹. د) فوق العاده سختی شرایط کار
  familyAllowance: 0,                 // ۱۰. ر) کمک هزینه عائله مندی
  childAllowance: 0,                  // ۱۱. ز) کمک هزینه اولاد
  locationAllowance: 0,               // ۱۲. س) فوق العاده محل خدمت
  specialAllowance: 0,                // ۱۳. ع) فوق العاده ویژه
  eliteSpecialAllowance: 0,           // ۱۴. ص) فوق العاده ویژه (نخبگان)
  band5JobAllowance: 0,               // ۱۵. ش) فوق العاده شغل بند 5
  article51Execution: 0,              // ۱۶. غ) اجرا ماده 51
  attractionAllowance: 0,             // ۱۷. حق جذب
  otherAllowances: 0,                 // ۱۸. سایر
  item97and8Diff: 0,                  // ۱۹. جمع تفاوت های جزء (1) بند (الف) 97 و تفاوت بند (ی) 8
  minContractDecreeDiff: 0,           // ۲۰. مابه التفاوت حداقل حکم قرارداد کارکنان
  salaryRestoration: 0,               // ۲۱. ترمیم حقوق
  particularSpecialAllowance: 0,      // ۲۲. فوق العاده خاص
  taxStatus: "taxable",
};

export function calcFixedSalaryA(f) {
  return (
    Number(f.jobPay || 0) +
    Number(f.managementAllowance || 0) +
    Number(f.employeePay || 0)
  );
}

export function calcTotalDecreeSalary(f) {
  return (
    calcFixedSalaryA(f) +
    Number(f.adaptationDiff || 0) +
    Number(f.underdevelopedAreaAllowance || 0) +
    Number(f.badWeatherAllowance || 0) +
    Number(f.sacrificeAllowance || 0) +
    Number(f.warZoneAllowance || 0) +
    Number(f.hardshipAllowance || 0) +
    Number(f.familyAllowance || 0) +
    Number(f.childAllowance || 0) +
    Number(f.locationAllowance || 0) +
    Number(f.specialAllowance || 0) +
    Number(f.eliteSpecialAllowance || 0) +
    Number(f.band5JobAllowance || 0) +
    Number(f.article51Execution || 0) +
    Number(f.attractionAllowance || 0) +
    Number(f.otherAllowances || 0) +
    Number(f.item97and8Diff || 0) +
    Number(f.minContractDecreeDiff || 0) +
    Number(f.salaryRestoration || 0) +
    Number(f.particularSpecialAllowance || 0)
  );
}

const DEGREE_LABELS = {
  under_diploma: "زیر دیپلم",
  diploma: "دیپلم",
  associate: "فوق دیپلم",
  bachelor: "لیسانس (کارشناسی)",
  master: "فوق لیسانس (کارشناسی ارشد)",
  phd: "دکترا",
  post_phd: "فوق دکترا"
};

const MARITAL_LABELS = {
  single: "مجرد",
  married: "متأهل",
  with_dependents: "معیل (دارای همسر و فرزند)",
  widowed: "همسر متوفی",
  divorced: "مطلقه"
};

const SACRIFICE_LABELS = {
  none: "ندارد",
  sacrificer: "ایثارگر",
  disabled: "جانباز",
  freed: "آزاده",
  martyr_child: "فرزند شهید",
  combatant: "رزمنده"
};

const EMPLOYMENT_LABELS = {
  official: "رسمی قطعی",
  official_probation: "رسمی آزمایشی",
  probationary: "پیمانی",
  contractual: "قراردادی کار معین",
  company: "شرکتی",
  hourly: "ساعتی",
  daily: "روزمزد"
};

const PENSION_LABELS = {
  civil: "صندوق بازنشستگی کشوری",
  social_security: "تامین اجتماعی",
  armed_forces: "نیروهای مسلح",
  other: "سایر صندوق‌ها",
  none: "فاقد صندوق"
};

const RANK_LABELS = {
  preliminary: "مقدماتی",
  base: "پایه",
  senior: "ارشد",
  expert: "خبره",
  superior: "عالی"
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
      label: `${e.code || "—"} — ${e.firstName || ""} ${e.lastName || ""} (${e.jobTitle || e.role || "بدون سمت"})`
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
        childAllowance: emp.childAllowance || 0,
        taxStatus: emp.taxStatus || "taxable",
      }));
    } else {
      setForm(f => ({ ...f, employeeId: empId }));
    }
  }

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
        d.decreeTitle?.toLowerCase().includes(searchLower) ||
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
      // Section 1: Identity & Personnel
      executiveOrg: emp?.executiveOrg || orgName || "وزارت امور اقتصادی و دارایی",
      employeeName: emp ? `${emp.firstName || ""} ${emp.lastName || ""}` : "نامشخص",
      firstName: emp?.firstName || "—",
      lastName: emp?.lastName || "—",
      fatherName: emp?.fatherName || "—",
      nationalId: emp?.nationalId || "—",
      certificateNo: emp?.certificateNo || "—",
      birthPlace: emp?.birthPlace || "—",
      birthDate: emp?.birthDate || "—",
      genderLabel: emp?.gender === "female" ? "زن" : "مرد",
      maritalStatusLabel: MARITAL_LABELS[emp?.maritalStatus] || "مجرد",
      childrenCount: emp?.childrenCount || 0,
      sacrificeStatusLabel: SACRIFICE_LABELS[emp?.sacrificeStatus] || "ندارد",
      employmentTypeLabel: EMPLOYMENT_LABELS[emp?.employmentType] || "رسمی قطعی",
      pensionFundLabel: PENSION_LABELS[emp?.pensionFund] || "صندوق بازنشستگی کشوری",

      // Section 2: Job & Post
      postTitle: emp?.postTitle || "—",
      postRow: emp?.postRow || "—",
      uniquePostId: emp?.uniquePostId || "—",
      department: emp?.department || "—",
      uniqueUnitId: emp?.uniqueUnitId || "—",
      jobTitle: decree.jobTitle || emp?.jobTitle || "—",
      jobGrade: emp?.jobGrade || "۸",
      jobRankLabel: RANK_LABELS[emp?.jobRank] || "پایه",
      serviceHistory: `${emp?.acceptedServiceYears || 0} سال و ${emp?.acceptedServiceMonths || 0} ماه`,
      expHistory: `${emp?.acceptedExpYears || 0} سال و ${emp?.acceptedExpMonths || 0} ماه`,
      serviceLocation: emp?.serviceLocation || emp?.branchName || "—",
      highestDegreeLabel: DEGREE_LABELS[emp?.highestDegree] || "لیسانس",
      fieldOfStudy: emp?.fieldOfStudy || "—",

      // Points (امتیازات)
      jobPayPoints: decree.jobPayPoints ?? emp?.jobPayPoints ?? 8300,
      managementAllowancePoints: decree.managementAllowancePoints ?? emp?.managementAllowancePoints ?? 2250,
      employeePayPoints: decree.employeePayPoints ?? emp?.employeePayPoints ?? 5900,
      adaptationDiffPoints: decree.adaptationDiffPoints ?? emp?.adaptationDiffPoints ?? 0,
      underdevelopedAreaAllowancePoints: decree.underdevelopedAreaAllowancePoints ?? emp?.underdevelopedAreaAllowancePoints ?? 0,
      badWeatherAllowancePoints: decree.badWeatherAllowancePoints ?? emp?.badWeatherAllowancePoints ?? 0,
      sacrificeAllowancePoints: decree.sacrificeAllowancePoints ?? emp?.sacrificeAllowancePoints ?? 0,
      warZoneAllowancePoints: decree.warZoneAllowancePoints ?? emp?.warZoneAllowancePoints ?? 0,
      hardshipAllowancePoints: decree.hardshipAllowancePoints ?? emp?.hardshipAllowancePoints ?? 0,
      familyAllowancePoints: decree.familyAllowancePoints ?? emp?.familyAllowancePoints ?? 0,
      childAllowancePoints: decree.childAllowancePoints ?? emp?.childAllowancePoints ?? 0,
      locationAllowancePoints: decree.locationAllowancePoints ?? emp?.locationAllowancePoints ?? 0,
      specialAllowancePoints: decree.specialAllowancePoints ?? emp?.specialAllowancePoints ?? 0,
      eliteSpecialAllowancePoints: decree.eliteSpecialAllowancePoints ?? emp?.eliteSpecialAllowancePoints ?? 0,
      band5JobAllowancePoints: decree.band5JobAllowancePoints ?? emp?.band5JobAllowancePoints ?? 0,
      article51ExecutionPoints: decree.article51ExecutionPoints ?? emp?.article51ExecutionPoints ?? 0,
      attractionAllowancePoints: decree.attractionAllowancePoints ?? emp?.attractionAllowancePoints ?? 0,
      otherAllowancesPoints: decree.otherAllowancesPoints ?? emp?.otherAllowancesPoints ?? 0,
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
      margin: 8mm 8mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 100%;
      font-family: "Tahoma", "Arial", sans-serif;
      font-size: 10px;
      line-height: 1.5;
      color: #111;
      direction: rtl;
      padding: 5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: Courier, monospace; }
    .w-full { width: 100%; }
    
    .table-layout {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    .table-layout th, .table-layout td {
      border: 1px solid #111;
      padding: 4px 6px;
      text-align: right;
    }
    .table-layout thead th {
      background-color: #f0f0f0 !important;
      font-weight: bold;
    }
    .section-header {
      background-color: #e5e7eb !important;
      font-weight: bold;
      font-size: 10px;
      padding: 4px 8px;
      border: 1px solid #111;
      margin-top: 6px;
    }
    .signature-area {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signature-box {
      height: 70px;
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
            احکام حقوقی و کارگزینی پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            ثبت، صدور و چاپ حکم کارگزینی کارمند (شامل مشخصات حکم، حقوق ثابت و ۲۲ ردیف فوق‌العاده‌های قانونی).
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
              <Plus className="h-4 w-4" /> صدور حکم کارگزینی جدید
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

      {/* ۱. پیش‌نمایش و چاپ حکم کارگزینی رسمی (A4) */}
      {selectedDecreeForPrint && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setSelectedDecreeForPrint(null)} className="h-9 text-xs gap-1.5">
              <X className="h-4 w-4" /> بستن پیش‌نمایش
            </Button>
            <Button size="sm" onClick={printPage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Printer className="h-4 w-4" /> چاپ حکم کارگزینی رسمی (A4)
            </Button>
          </div>

          <Card className="border-slate-900 shadow-xl p-6 max-w-4xl mx-auto bg-white text-slate-900 font-sans" id="printable-decree-sheet">
            <div className="border-2 border-slate-950 p-4 space-y-3">
              
              {/* سربرگ رسمی حکم */}
              <div className="grid grid-cols-3 items-center text-center pb-2 border-b-2 border-slate-950">
                <div className="text-right text-[11px] space-y-1">
                  <div className="font-bold">{selectedDecreeForPrint.executiveOrg}</div>
                  <div className="text-[10px] text-slate-600">امور اداری و کارگزینی</div>
                </div>
                <div className="space-y-1">
                  <h1 className="text-sm font-black text-slate-950">حکم کارگزینی کارمند رسمی</h1>
                  <span className="text-[10px] text-slate-600">({selectedDecreeForPrint.decreeTitle || "تعیین حقوق و مزایا"})</span>
                </div>
                <div className="text-left text-[11px] space-y-0.5 font-mono">
                  <div>شماره حکم: <strong>{selectedDecreeForPrint.decreeNo}</strong></div>
                  <div>تاریخ صدور: <strong>{selectedDecreeForPrint.issueDate || "—"}</strong></div>
                  <div>تاریخ اجرا: <strong>{selectedDecreeForPrint.effectiveDate || "—"}</strong></div>
                </div>
              </div>

              {/* بخش ۱: اطلاعات هویتی و پرسنلی (۱) */}
              <div>
                <div className="section-header">اطلاعات هویتی و پرسنلی (۱)</div>
                <div className="grid grid-cols-4 border border-t-0 border-slate-950 text-[10.5px]">
                  <div className="p-1.5 border-r border-slate-950">دستگاه اجرایی: <strong>{selectedDecreeForPrint.executiveOrg}</strong></div>
                  <div className="p-1.5 border-r border-slate-950">نام: <strong>{selectedDecreeForPrint.firstName}</strong></div>
                  <div className="p-1.5 border-r border-slate-950">نام خانوادگی: <strong>{selectedDecreeForPrint.lastName}</strong></div>
                  <div className="p-1.5">نام پدر: <strong>{selectedDecreeForPrint.fatherName}</strong></div>

                  <div className="p-1.5 border-t border-r border-slate-950">شماره ملی: <strong>{selectedDecreeForPrint.nationalId}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">شماره پرسنلی: <strong>{selectedDecreeForPrint.employeeCode}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">شماره شناسنامه: <strong>{selectedDecreeForPrint.certificateNo}</strong></div>
                  <div className="p-1.5 border-t">محل تولد: <strong>{selectedDecreeForPrint.birthPlace}</strong></div>

                  <div className="p-1.5 border-t border-r border-slate-950">تاریخ تولد: <strong>{selectedDecreeForPrint.birthDate}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">جنسیت: <strong>{selectedDecreeForPrint.genderLabel}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">وضعیت تاهل: <strong>{selectedDecreeForPrint.maritalStatusLabel}</strong></div>
                  <div className="p-1.5 border-t">تعداد فرزندان: <strong>{selectedDecreeForPrint.childrenCount}</strong></div>

                  <div className="p-1.5 border-t border-r border-slate-950">وضعیت ایثارگری: <strong>{selectedDecreeForPrint.sacrificeStatusLabel}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">نوع استخدام: <strong>{selectedDecreeForPrint.employmentTypeLabel}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">صندوق بازنشستگی: <strong>{selectedDecreeForPrint.pensionFundLabel}</strong></div>
                  <div className="p-1.5 border-t">دستگاه اجرایی: <strong>{selectedDecreeForPrint.executiveOrg}</strong></div>
                </div>
              </div>

              {/* بخش ۲: اطلاعات شغلی و پستی (۲) */}
              <div>
                <div className="section-header">اطلاعات شغلی و پستی (۲)</div>
                <div className="grid grid-cols-4 border border-t-0 border-slate-950 text-[10.5px]">
                  <div className="p-1.5 border-r border-slate-950">عنوان پست سازمانی: <strong>{selectedDecreeForPrint.postTitle}</strong></div>
                  <div className="p-1.5 border-r border-slate-950">ردیف پست سازمانی: <strong>{selectedDecreeForPrint.postRow}</strong></div>
                  <div className="p-1.5 border-r border-slate-950">شناسه یکتای پست: <strong>{selectedDecreeForPrint.uniquePostId}</strong></div>
                  <div className="p-1.5">واحد سازمانی: <strong>{selectedDecreeForPrint.department}</strong></div>

                  <div className="p-1.5 border-t border-r border-slate-950">شناسه یکتای واحد: <strong>{selectedDecreeForPrint.uniqueUnitId}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">عنوان شغل: <strong>{selectedDecreeForPrint.jobTitle}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">طبقه: <strong>{selectedDecreeForPrint.jobGrade}</strong></div>
                  <div className="p-1.5 border-t">رتبه: <strong>{selectedDecreeForPrint.jobRankLabel}</strong></div>

                  <div className="p-1.5 border-t border-r border-slate-950">سابقه خدمت قابل قبول: <strong>{selectedDecreeForPrint.serviceHistory}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">سابقه تجربی قابل قبول: <strong>{selectedDecreeForPrint.expHistory}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">محل خدمت: <strong>{selectedDecreeForPrint.serviceLocation}</strong></div>
                  <div className="p-1.5 border-t">بالاترین مدرک و رشته: <strong>{selectedDecreeForPrint.highestDegreeLabel} ({selectedDecreeForPrint.fieldOfStudy})</strong></div>
                </div>
              </div>

              {/* بخش ۳: مشخصات حکم (۳) */}
              <div>
                <div className="section-header">مشخصات حکم (۳)</div>
                <div className="grid grid-cols-3 border border-t-0 border-slate-950 text-[10.5px]">
                  <div className="p-1.5 border-r border-slate-950">عنوان حکم: <strong>{selectedDecreeForPrint.decreeTitle}</strong></div>
                  <div className="p-1.5 border-r border-slate-950">تاریخ صدور: <strong>{selectedDecreeForPrint.issueDate || "—"}</strong></div>
                  <div className="p-1.5">تاریخ اجرا: <strong>{selectedDecreeForPrint.effectiveDate || "—"}</strong></div>

                  <div className="p-1.5 border-t border-r border-slate-950">شماره حکم: <strong>{selectedDecreeForPrint.decreeNo}</strong></div>
                  <div className="p-1.5 border-t border-r border-slate-950">مقام مسئول صادرکننده: <strong>{selectedDecreeForPrint.issuingAuthority || "مدیرکل امور اداری"}</strong></div>
                  <div className="p-1.5 border-t">شرح حکم: <strong>{selectedDecreeForPrint.description || "—"}</strong></div>
                </div>
              </div>

              {/* بخش ۴: حقوق ثابت و مزایا (۴ - ۲۲ ردیف حکم) */}
              <div>
                <div className="section-header">حقوق ثابت و مزایا (۴)</div>
                <table className="table-layout border-slate-950 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-950">
                      <th className="px-2 py-1 text-center w-10 border-r border-slate-950">ردیف</th>
                      <th className="px-3 py-1 border-r border-slate-950">عنوان ردیف حکم کارگزینی</th>
                      <th className="px-3 py-1 text-center border-r border-slate-950 w-24">امتیاز</th>
                      <th className="px-3 py-1 text-left">مبلغ مقرر در حکم (ریال)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center font-bold">۱</td>
                      <td className="font-bold">حق شغل</td>
                      <td className="text-center font-mono font-bold border-r border-slate-950">{Number(selectedDecreeForPrint.jobPayPoints ?? 8300).toLocaleString("fa-IR")}</td>
                      <td className="text-left font-mono font-bold">{Number(selectedDecreeForPrint.jobPay || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center font-bold">۲</td>
                      <td className="font-bold">فوق العاده مدیریت</td>
                      <td className="text-center font-mono font-bold border-r border-slate-950">{Number(selectedDecreeForPrint.managementAllowancePoints ?? 2250).toLocaleString("fa-IR")}</td>
                      <td className="text-left font-mono font-bold">{Number(selectedDecreeForPrint.managementAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center font-bold">۳</td>
                      <td className="font-bold">حق شاغل</td>
                      <td className="text-center font-mono font-bold border-r border-slate-950">{Number(selectedDecreeForPrint.employeePayPoints ?? 5900).toLocaleString("fa-IR")}</td>
                      <td className="text-left font-mono font-bold">{Number(selectedDecreeForPrint.employeePay || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="text-center">—</td>
                      <td className="font-extrabold text-blue-900">- جمع حقوق ثابت (الف)</td>
                      <td className="text-center font-mono font-extrabold text-blue-900 border-r border-slate-950">
                        {((Number(selectedDecreeForPrint.jobPayPoints ?? 8300)) + (Number(selectedDecreeForPrint.managementAllowancePoints ?? 2250)) + (Number(selectedDecreeForPrint.employeePayPoints ?? 5900))).toLocaleString("fa-IR")}
                      </td>
                      <td className="text-left font-mono font-extrabold text-blue-900">{calcFixedSalaryA(selectedDecreeForPrint).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۴</td>
                      <td>ب) تفاوت تطبیق</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.adaptationDiff || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۵</td>
                      <td>ث) فوق العاده مناطق کمتر توسعه یافته</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.underdevelopedAreaAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۶</td>
                      <td>ج) فوق العاده بدی آب و هوا</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.badWeatherAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۷</td>
                      <td>ح) فوق العاده ایثارگری</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.sacrificeAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۸</td>
                      <td>خ) خدمت در مناطق جنگ زده</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.warZoneAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۹</td>
                      <td>د) فوق العاده سختی شرایط کار</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.hardshipAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۰</td>
                      <td>ر) کمک هزینه عائله مندی</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.familyAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۱</td>
                      <td>ز) کمک هزینه اولاد</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.childAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۲</td>
                      <td>س) فوق العاده محل خدمت</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.locationAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۳</td>
                      <td>ع) فوق العاده ویژه</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.specialAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۴</td>
                      <td>ص) فوق العاده ویژه (نخبگان)</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.eliteSpecialAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۵</td>
                      <td>ش) فوق العاده شغل بند 5</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.band5JobAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۶</td>
                      <td>غ) اجرا ماده 51</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.article51Execution || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۷</td>
                      <td>حق جذب</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.attractionAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۸</td>
                      <td>سایر</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.otherAllowances || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۱۹</td>
                      <td>جمع تفاوت های جزء (1) بند (الف) 97 و تفاوت بند (ی) 8</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.item97and8Diff || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۲۰</td>
                      <td>مابه التفاوت حداقل حکم قرارداد کارکنان</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.minContractDecreeDiff || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۲۱</td>
                      <td>ترمیم حقوق</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.salaryRestoration || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr>
                      <td className="text-center">۲۲</td>
                      <td>فوق العاده خاص</td>
                      <td className="text-left font-mono">{Number(selectedDecreeForPrint.particularSpecialAllowance || 0).toLocaleString("fa-IR")}</td>
                    </tr>
                    <tr className="bg-emerald-100 font-extrabold border-t-2 border-slate-950 text-slate-950">
                      <td colSpan={2} className="px-3 py-1.5 border-r border-slate-950">جمع کل ناخالص ماهانه حکم کارگزینی (ریال)</td>
                      <td className="px-3 py-1.5 text-left font-mono text-xs">
                        {calcTotalDecreeSalary(selectedDecreeForPrint).toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* کادر امضاها */}
              <div className="signature-area text-[10.5px] font-bold pt-4">
                <div className="signature-box">
                  <span>تنظیم کننده (کارشناسی کارگزینی)</span>
                  <span className="text-[9px] text-slate-400">امضا و تاریخ</span>
                </div>
                <div className="signature-box">
                  <span>تایید کننده (مدیرکل امور اداری)</span>
                  <span className="text-[9px] text-slate-400">مهر و امضا</span>
                </div>
                <div className="signature-box">
                  <span>مستند ابلاغ حکم (مستخدم)</span>
                  <span className="text-[9px] text-slate-400">امضا و اثر انگشت</span>
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
            <CardDescription className="text-xs">اطلاعات مشخصات حکم و ۲۲ ردیف حقوق ثابت و مزایای قانونی را تکمیل نمایید.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* بخش ۳: مشخصات حکم */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-blue-600">مشخصات حکم (۳)</h4>
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
                    <Label className="text-xs font-semibold">عنوان حکم</Label>
                    <select value={form.decreeTitle} onChange={e => handleChange("decreeTitle", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm mt-1.5">
                      <option value="حکم کارگزینی کارمند رسمی">حکم کارگزینی کارمند رسمی</option>
                      <option value="انتصاب شغلی">انتصاب شغلی</option>
                      <option value="تعیین حقوق و مزایای سالانه">تعیین حقوق و مزایای سالانه</option>
                      <option value="افزایش ضریب سالانه">افزایش ضریب سالانه</option>
                      <option value="ارتقاء طبقه و رتبه">ارتقاء طبقه و رتبه</option>
                      <option value="ترفیع پایه">ترفیع پایه</option>
                      <option value="تبدیل وضعیت استخدامی">تبدیل وضعیت استخدامی</option>
                      <option value="تغییر محل خدمت">تغییر محل خدمت</option>
                      <option value="سایر">سایر</option>
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
                    <Label className="text-xs font-semibold">مقام مسئول صادرکننده</Label>
                    <Input value={form.issuingAuthority} onChange={e => handleChange("issuingAuthority", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: مدیرکل امور اداری" />
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs font-semibold">شرح / دلیل صدور حکم</Label>
                    <Input value={form.description} onChange={e => handleChange("description", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="توضیحات و دلایل قانونی صدور حکم..." />
                  </div>
                </div>
              </div>

              <Separator />

              {/* بخش ۴: حقوق ثابت و مزایا (۲۲ ردیف حکم) */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-emerald-600">حقوق ثابت و مزایا (۴) — ۲۲ ردیف قانونی حکم کارگزینی</h4>
                
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-blue-900">۱. حق شغل (ریال)</Label>
                    <Input type="number" value={form.jobPay} onChange={e => handleChange("jobPay", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left font-bold" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-blue-900">۲. فوق العاده مدیریت (ریال)</Label>
                    <Input type="number" value={form.managementAllowance} onChange={e => handleChange("managementAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left font-bold" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-blue-900">۳. حق شاغل (ریال)</Label>
                    <Input type="number" value={form.employeePay} onChange={e => handleChange("employeePay", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left font-bold" />
                  </div>
                  <div className="bg-blue-600 text-white p-2 rounded-lg flex flex-col justify-center items-center">
                    <span className="text-[10px]">جمع حقوق ثابت (الف)</span>
                    <span className="font-mono font-black text-sm">{calcFixedSalaryA(form).toLocaleString("fa-IR")} <span className="text-[9px]">ریال</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-right">
                  <div>
                    <Label className="text-xs font-semibold">۴. ب) تفاوت تطبیق (ریال)</Label>
                    <Input type="number" value={form.adaptationDiff} onChange={e => handleChange("adaptationDiff", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۵. ث) فوق العاده مناطق کمتر توسعه یافته (ریال)</Label>
                    <Input type="number" value={form.underdevelopedAreaAllowance} onChange={e => handleChange("underdevelopedAreaAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۶. ج) فوق العاده بدی آب و هوا (ریال)</Label>
                    <Input type="number" value={form.badWeatherAllowance} onChange={e => handleChange("badWeatherAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۷. ح) فوق العاده ایثارگری (ریال)</Label>
                    <Input type="number" value={form.sacrificeAllowance} onChange={e => handleChange("sacrificeAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۸. خ) خدمت در مناطق جنگ زده (ریال)</Label>
                    <Input type="number" value={form.warZoneAllowance} onChange={e => handleChange("warZoneAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۹. د) فوق العاده سختی شرایط کار (ریال)</Label>
                    <Input type="number" value={form.hardshipAllowance} onChange={e => handleChange("hardshipAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۰. ر) کمک هزینه عائله مندی (ریال)</Label>
                    <Input type="number" value={form.familyAllowance} onChange={e => handleChange("familyAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۱. ز) کمک هزینه اولاد (ریال)</Label>
                    <Input type="number" value={form.childAllowance} onChange={e => handleChange("childAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۲. س) فوق العاده محل خدمت (ریال)</Label>
                    <Input type="number" value={form.locationAllowance} onChange={e => handleChange("locationAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۳. ع) فوق العاده ویژه (ریال)</Label>
                    <Input type="number" value={form.specialAllowance} onChange={e => handleChange("specialAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۴. ص) فوق العاده ویژه (نخبگان) (ریال)</Label>
                    <Input type="number" value={form.eliteSpecialAllowance} onChange={e => handleChange("eliteSpecialAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۵. ش) فوق العاده شغل بند 5 (ریال)</Label>
                    <Input type="number" value={form.band5JobAllowance} onChange={e => handleChange("band5JobAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۶. غ) اجرا ماده 51 (ریال)</Label>
                    <Input type="number" value={form.article51Execution} onChange={e => handleChange("article51Execution", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۷. حق جذب (ریال)</Label>
                    <Input type="number" value={form.attractionAllowance} onChange={e => handleChange("attractionAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۸. سایر (ریال)</Label>
                    <Input type="number" value={form.otherAllowances} onChange={e => handleChange("otherAllowances", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۱۹. جمع تفاوت های جزء (1) بند (الف) 97 و تفاوت بند (ی) 8</Label>
                    <Input type="number" value={form.item97and8Diff} onChange={e => handleChange("item97and8Diff", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۲۰. مابه التفاوت حداقل حکم قرارداد کارکنان (ریال)</Label>
                    <Input type="number" value={form.minContractDecreeDiff} onChange={e => handleChange("minContractDecreeDiff", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۲۱. ترمیم حقوق (ریال)</Label>
                    <Input type="number" value={form.salaryRestoration} onChange={e => handleChange("salaryRestoration", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">۲۲. فوق العاده خاص (ریال)</Label>
                    <Input type="number" value={form.particularSpecialAllowance} onChange={e => handleChange("particularSpecialAllowance", Number(e.target.value))} className="h-9 text-xs mt-1 font-mono text-left" />
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded-xl flex justify-between items-center border border-emerald-500/20 mt-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">جمع کل ناخالص ماهانه حکم کارگزینی (مجموع ۲۲ ردیف فوق):</span>
                  <span className="font-mono text-base font-black text-emerald-800 dark:text-emerald-400">
                    {(calcTotalDecreeSalary(form) / 10).toLocaleString("fa-IR")} <span className="text-xs font-semibold">تومان</span>
                    <span className="block text-[10px] text-muted-foreground text-left">{calcTotalDecreeSalary(form).toLocaleString("fa-IR")} ریال</span>
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
                    <TableHead className="text-right">عنوان حکم</TableHead>
                    <TableHead className="text-right">عنوان شغلی</TableHead>
                    <TableHead className="text-center w-24">تاریخ صدور</TableHead>
                    <TableHead className="text-center w-24">تاریخ اجرا</TableHead>
                    <TableHead className="text-right w-36">حقوق ناخالص (ریال)</TableHead>
                    <TableHead className="text-center w-28">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDecrees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                        هیچ حکم کارگزینی صادر شده‌ای یافت نشد.
                      </TableCell>
                    </TableRow>
                  ) : filteredDecrees.map(d => {
                    const emp = (employees || []).find(e => (e._id === d.employeeId || e.id === d.employeeId));
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "—";
                    const gross = calcTotalDecreeSalary(d);

                    return (
                      <tr key={d._id || d.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-300">{d.decreeNo}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{empName}</td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">{d.decreeTitle || "حکم کارگزینی"}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{d.jobTitle || emp?.jobTitle || "—"}</td>
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
              placeholder="مثال: اداره کل امور اقتصادی و دارایی"
              className="mt-1.5 h-9 text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {orgName && (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsOpenOrgModal(false)} className="h-8 text-xs">
                انصراف
              </Button>
            )}
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs">
              ذخیره نام سازمان
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
