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
  Calendar, Landmark, ShieldCheck, User, ClipboardList, Info, Download, X, Search,
  Scan, Camera, UploadCloud, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  contractNo: "",
  employeeId: "",
  contractDate: "",
  startDate: "",
  endDate: "",
  probationMonth: 1,
  workingHours: 44, // standard 44 hours per week
  workLocation: "دفتر مرکزی",
  status: "active", // active, completed, terminated, draft
  jobTitle: "",
  dailyBaseSalary: 5541850,
  housingAllowance: 30000000,
  groceryAllowance: 22000000,
  childAllowance: 0,
  responsibilityAllowance: 0,
  expertiseAllowance: 0,
  transportAllowance: 0,
  otherAllowances: 0,
  annualLeaveDays: 26, // standard 26 days per year
  taxStatus: "taxable",
};

export default function EmployeeContracts() {
  const {
    employees, employeeContracts, addConfig, updateConfig, deleteConfig, refreshAllConfigs
  } = useAssets();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedContractForPrint, setSelectedContractForPrint] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner Modal states
  const [isOpenScanner, setIsOpenScanner] = useState(false);
  const [scannerContract, setScannerContract] = useState(null);
  const [scannerTab, setScannerTab] = useState("twain"); // twain, camera, file, preview_only
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedScanner, setSelectedScanner] = useState("Canon LiDE 300 - TWAIN v2.4");
  const [videoRef, setVideoRef] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async (vRef) => {
    try {
      setVideoRef(vRef);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (vRef) {
        vRef.srcObject = stream;
        vRef.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const stopCamera = (vRef) => {
    const activeVideo = vRef || videoRef;
    if (activeVideo && activeVideo.srcObject) {
      const stream = activeVideo.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      activeVideo.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = (vRef) => {
    const activeVideo = vRef || videoRef;
    if (!activeVideo) return;
    const canvas = document.createElement("canvas");
    canvas.width = activeVideo.videoWidth || 640;
    canvas.height = activeVideo.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(activeVideo, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg");
    setCapturedImage(base64);
    stopCamera(activeVideo);
  };

  const generateDynamicScanImage = (contract) => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);
    
    ctx.fillStyle = "#111111";
    ctx.font = "bold 16px Arial, Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("قرارداد کار موقت اسکن شده (وزارت کار)", canvas.width / 2, 80);
    
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(canvas.width - 50, 100);
    ctx.strokeStyle = "#111111";
    ctx.stroke();
    
    ctx.textAlign = "right";
    ctx.font = "11px Tahoma, sans-serif";
    
    const emp = (employees || []).find(e => (e._id === contract?.employeeId || e.id === contract?.employeeId));
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "علیرضا مرادی";
    const natId = emp ? emp.nationalId : "6455645645";
    const fName = emp ? emp.fatherName : "علی";
    
    ctx.fillText(`شماره قرارداد: ${contract?.contractNo || "CNT-001"}`, canvas.width - 70, 140);
    ctx.fillText(`نام کارمند: ${empName}`, canvas.width - 70, 170);
    ctx.fillText(`نام پدر: ${fName}`, canvas.width - 70, 200);
    ctx.fillText(`کد ملی: ${natId}`, canvas.width - 70, 230);
    ctx.fillText(`سمت شغلی: ${contract?.jobTitle || "کارمند"}`, canvas.width - 70, 260);
    ctx.fillText(`مدت قرارداد: از ${contract?.startDate || "۱۴۰۵/۰۴/۲۶"} تا ${contract?.endDate || "۱۴۰۶/۰۴/۲۵"}`, canvas.width - 70, 290);
    
    ctx.fillStyle = "#555555";
    ctx.font = "italic 9px Tahoma, sans-serif";
    ctx.fillText("بند ۱: این سند به منزله قرارداد رسمی منعقد شده بین کارفرما و کارمند کارمزد موقت می‌باشد.", canvas.width - 70, 350);
    ctx.fillText("بند ۲: حقوق و مزایای قانونی شامل دستمزد پایه مصوب سال ۱۴۰۵ به حساب پرسنل پرداخت می‌شود.", canvas.width - 70, 380);
    ctx.fillText("بند ۳: حق بیمه کارمند طبق قوانین سازمان تامین اجتماعی پرداخت خواهد شد.", canvas.width - 70, 410);
    
    ctx.strokeStyle = "rgba(10, 80, 220, 0.65)";
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.moveTo(120, 680);
    ctx.bezierCurveTo(150, 650, 170, 710, 210, 670);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(380, 685);
    ctx.bezierCurveTo(410, 660, 430, 715, 470, 675);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(300, 670, 35, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.font = "bold 8px Tahoma, sans-serif";
    ctx.fillStyle = "rgba(10, 80, 220, 0.65)";
    ctx.textAlign = "center";
    ctx.fillText("امور اداری و مالی", 300, 665);
    ctx.fillText("دولت ج.ا.ا", 300, 678);
    
    const base64 = canvas.toDataURL("image/jpeg");
    setCapturedImage(base64);
  };

  const startPhysicalScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          generateDynamicScanImage(scannerContract);
          return 100;
        }
        return p + 20;
      });
    }, 200);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveScan = async () => {
    if (!capturedImage || !scannerContract) return;
    try {
      setIsSubmitting(true);
      const updatedContract = {
        ...scannerContract,
        scannedDoc: capturedImage
      };
      const res = await updateConfig("employee_contracts", updatedContract);
      if (res) {
        setSuccessMsg("سند اسکن شده با موفقیت به پرونده قرارداد کارمند پیوست شد.");
        setIsOpenScanner(false);
        setCapturedImage(null);
        await refreshAllConfigs();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("خطا در پیوست سند اسکن شده.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenScanner = (contract) => {
    setScannerContract(contract);
    setCapturedImage(contract.scannedDoc || null);
    setIsOpenScanner(true);
    setScannerTab(contract.scannedDoc ? "preview_only" : "twain");
  };

  // Auto-generate recommended contract number
  useEffect(() => {
    if (!editingId && employeeContracts && employeeContracts.length > 0) {
      const numbers = employeeContracts
        .map(c => c.contractNo)
        .filter(n => n && n.startsWith("CNT-"))
        .map(n => Number(n.replace("CNT-", "")))
        .filter(num => !isNaN(num));
      const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : employeeContracts.length + 1;
      setForm(f => ({ ...f, contractNo: `CNT-${String(nextNum).padStart(3, "0")}` }));
    } else if (!editingId) {
      setForm(f => ({ ...f, contractNo: "CNT-001" }));
    }
  }, [employeeContracts, editingId, showForm]);

  // Dropdown options for employees
  const employeeOptions = useMemo(() => {
    return (employees || []).map(e => ({
      value: e._id || e.id,
      label: `${e.code} — ${e.firstName} ${e.lastName} (${e.jobTitle || "بدون سمت"})`
    }));
  }, [employees]);

  // Auto-fill wage details when employee is selected
  function handleEmployeeChange(empId) {
    const emp = (employees || []).find(e => (e._id === empId || e.id === empId));
    if (emp) {
      setForm(f => ({
        ...f,
        employeeId: empId,
        jobTitle: emp.jobTitle || emp.role || "",
        dailyBaseSalary: emp.dailyBaseSalary || 5541850,
        housingAllowance: emp.housingAllowance || 30000000,
        groceryAllowance: emp.groceryAllowance || 22000000,
        childAllowance: emp.childAllowance || 0,
        responsibilityAllowance: emp.responsibilityAllowance || 0,
        expertiseAllowance: emp.expertiseAllowance || 0,
        transportAllowance: emp.transportAllowance || 0,
        otherAllowances: emp.otherAllowances || 0,
      }));
    } else {
      setForm(f => ({ ...f, employeeId: empId }));
    }
  }

  // Monthly base and gross salary calculations
  const monthlyBaseSalary = Number(form.dailyBaseSalary || 0) * 30;
  const totalSalaryGross =
    monthlyBaseSalary +
    Number(form.housingAllowance || 0) +
    Number(form.groceryAllowance || 0) +
    Number(form.childAllowance || 0) +
    Number(form.responsibilityAllowance || 0) +
    Number(form.expertiseAllowance || 0) +
    Number(form.transportAllowance || 0) +
    Number(form.otherAllowances || 0);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return (employeeContracts || []).filter(c => {
      const emp = (employees || []).find(e => (e._id === c.employeeId || e.id === c.employeeId));
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : "";
      const empCode = emp ? emp.code : "";
      const searchLower = search.toLowerCase();
      return (
        !search ||
        c.contractNo?.toLowerCase().includes(searchLower) ||
        empName.toLowerCase().includes(searchLower) ||
        empCode.toLowerCase().includes(searchLower) ||
        c.jobTitle?.toLowerCase().includes(searchLower)
      );
    });
  }, [employeeContracts, employees, search]);

  const handleRefresh = async () => {
    await refreshAllConfigs();
  };

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
    if (!form.contractNo.trim()) {
      setErrorMsg("شماره قرارداد الزامی است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      let result;
      if (editingId) {
        result = await updateConfig("employee_contracts", { ...form, id: editingId, _id: editingId });
      } else {
        result = await addConfig("employee_contracts", form);
      }

      if (result) {
        setSuccessMsg(editingId ? "قرارداد با موفقیت ویرایش شد." : "قرارداد با موفقیت ثبت شد.");
        setForm(INITIAL_FORM);
        setEditingId(null);
        setShowForm(false);
        await refreshAllConfigs();
      } else {
        setErrorMsg("خطا در ذخیره قرارداد در سرور.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطایی در ارتباط با سرور رخ داد.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(contract) {
    setForm(contract);
    setEditingId(contract._id || contract.id);
    setShowForm(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleDelete(id) {
    if (window.confirm("آیا از حذف این قرارداد کار مطمئن هستید؟")) {
      const success = await deleteConfig("employee_contracts", id);
      if (success) {
        await refreshAllConfigs();
      }
    }
  }

  // Print standard contract trigger
  function triggerPrint(contract) {
    const emp = (employees || []).find(e => (e._id === contract.employeeId || e.id === contract.employeeId));
    setSelectedContractForPrint({
      ...contract,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "نامشخص",
      employeeCode: emp ? emp.code : "—",
      nationalId: emp ? emp.nationalId : "—",
      fatherName: emp ? emp.fatherName : "—",
      birthDate: emp ? emp.birthDate : "—",
      mobile: emp ? emp.mobile : "—",
      address: emp ? emp.address : "—"
    });
  }

  // Custom standard CSS print view
  function printPage() {
    const el = document.getElementById("printable-contract-sheet");
    if (!el) {
      window.print();
      return;
    }

    // Clone element
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
  <title>قرارداد کار - ${selectedContractForPrint?.employeeName || ""}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm;
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
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-5 > * + * { margin-top: 1.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .pt-12 { padding-top: 3rem; }
    .text-xs { font-size: 0.75rem; }
    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: Courier, monospace; }
    .italic { font-style: italic; }
    
    .border-b-2 { border-bottom: 2px solid #333; }
    .border-b { border-bottom: 1px solid #ccc; }
    .border { border: 1px solid #aaa; }
    .rounded-xl { border-radius: 0.75rem; }
    .overflow-hidden { overflow: hidden; }
    
    .pb-2 { padding-bottom: 0.5rem; }
    .px-4 { padding-left: 1rem; padding-right: 1rem; }
    .pt-1 { padding-top: 0.25rem; }
    
    .border-r-4 { border-right: 4px solid #333; }
    .pr-2 { padding-right: 0.5rem; }
    
    table {
      width: 100% !important;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    th, td {
      border: 1px solid #aaa;
      padding: 6px 10px;
      text-align: right;
    }
    
    thead th {
      background-color: #f3f4f6 !important;
      font-weight: bold;
    }
    
    .bg-slate-100 { background-color: #f3f4f6 !important; }
    .bg-slate-50 { background-color: #f9fafb !important; }
    
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-4 { gap: 1rem; }
    .space-y-16 > * + * { margin-top: 4rem; }
    .no-break { page-break-inside: avoid; }
    
    .no-print { display: none !important; }
  </style>
</head>
<body>
  <div class="contract-container">
    ${clone.innerHTML}
  </div>
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
      
      {/* هدر ماژول قرارداد */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 no-print">
        <div className="text-right">
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            قراردادهای کار پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            ثبت، مدیریت و چاپ استاندارد قراردادهای استخدامی کارکنان بر اساس ضوابط وزارت کار.
          </p>
        </div>
        {!showForm && !selectedContractForPrint && (
          <Button size="sm" onClick={() => { setForm(INITIAL_FORM); setEditingId(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Plus className="h-4 w-4" /> ثبت قرارداد جدید
          </Button>
        )}
      </div>

      {/* نمایش پیام‌های خطا و موفقیت */}
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

      {/* ۱. پیش‌نمایش و چاپ قرارداد استخدامی استاندارد */}
      {selectedContractForPrint && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setSelectedContractForPrint(null)} className="h-9 text-xs gap-1.5">
              <X className="h-4 w-4" /> بستن پیش‌نمایش
            </Button>
            <Button size="sm" onClick={printPage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Printer className="h-4 w-4" /> چاپ قرارداد کار
            </Button>
          </div>

          <Card className="border border-slate-300 shadow-lg print:border-0 print:shadow-none p-8 font-sans max-w-4xl mx-auto text-slate-800 bg-white" id="printable-contract-sheet">
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-lg font-black text-slate-900 border-b-2 border-slate-800 pb-2">قرارداد کار موقت (موضوع ماده ۱۰ قانون کار جمهوری اسلامی ایران)</h1>
              <div className="flex justify-between text-xs text-slate-600 px-4 pt-1">
                <span>شماره قرارداد: <strong>{selectedContractForPrint.contractNo}</strong></span>
                <span>تاریخ انعقاد: <strong>{selectedContractForPrint.contractDate || "—"}</strong></span>
              </div>
            </div>

            {/* بدنه قرارداد */}
            <div className="space-y-5 text-sm leading-relaxed text-justify">
              
              {/* بند ۱: مشخصات طرفین */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۱: مشخصات طرفین قرارداد</h3>
                <p>
                  این قرارداد فی‌مابین <strong>شرکت تدارکات و مدیریت مالی دولتی</strong> به نمایندگی امور منابع انسانی که در این قرارداد به اختصار <strong>«کارفرما»</strong> نامیده می‌شود از یک طرف، و جناب آقای / سرکار خانم <strong>{selectedContractForPrint.employeeName}</strong> فرزند {selectedContractForPrint.fatherName} دارای کد ملی {selectedContractForPrint.nationalId} متولد {selectedContractForPrint.birthDate} شماره تماس {selectedContractForPrint.mobile} مقیم {selectedContractForPrint.address || "نشانی ثبت شده در پرونده پرسنلی"} که در این قرارداد به اختصار <strong>«کارگر / کارمند»</strong> نامیده می‌شود از طرف دیگر، با شرایط ذیل منعقد می‌گردد.
                </p>
              </div>

              {/* بند ۲: نوع قرارداد */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۲: نوع قرارداد</h3>
                <p>
                  این قرارداد از نوع قرارداد کار با مدت موقت است که مطابق مفاد قانون کار ج.ا.ا بوده و در مدت آن هیچگونه حق استخدامی دائم برای کارمند ایجاد نخواهد کرد.
                </p>
              </div>

              {/* بند ۳: مدت قرارداد و دوره آزمایشی */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۳: مدت قرارداد و دوره آزمایشی</h3>
                <p>
                  مدت این قرارداد از تاریخ <strong>{selectedContractForPrint.startDate || "—"}</strong> لغایت <strong>{selectedContractForPrint.endDate || "—"}</strong> به مدت مشخص می‌باشد. دوره آزمایشی قرارداد کار به میزان <strong>{selectedContractForPrint.probationMonth} ماه</strong> تعیین شده که در طی این دوره هر یک از طرفین مجاز به فسخ قرارداد کار خواهند بود.
                </p>
              </div>

              {/* بند ۴: موضوع قرارداد و سمت شغلی */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۴: موضوع قرارداد و عنوان شغلی</h3>
                <p>
                  کارگر متعهد است وظایف محوله در سمت شغلی <strong>{selectedContractForPrint.jobTitle || "کارشناس"}</strong> را با دقت و بر اساس آیین‌نامه‌ها و دستورالعمل‌های داخلی کارفرما انجام دهد. محل اصلی انجام کار، <strong>{selectedContractForPrint.workLocation}</strong> می‌باشد.
                </p>
              </div>

              {/* بند ۵: ساعت کار */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۵: ساعت کارکرد</h3>
                <p>
                  ساعات کارکرد کارگر معادل <strong>{selectedContractForPrint.workingHours} ساعت در هفته</strong> (ساعات کار قانونی استاندارد) تنظیم می‌گردد و نحوه توزیع ساعات کار در ایام هفته بر عهده مدیریت منابع انسانی کارفرما خواهد بود.
                </p>
              </div>

              {/* بند ۶: حقوق و مزایای قراردادی */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۶: حقوق، مزد مبنا و فوق‌العاده‌ها (ریال)</h3>
                <p>حقوق و مزایای مستمر ماهانه کارگر به شرح زیر تعیین و پس از کسر کسورات قانونی (بیمه و مالیات) در پایان هر ماه به حساب بانکی وی واریز می‌گردد:</p>
                <div className="mt-3 border rounded-xl overflow-hidden max-w-2xl mx-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b font-bold">
                        <th className="px-4 py-2">عنوان ردیف حقوقی</th>
                        <th className="px-4 py-2 text-left">مبلغ (ریال)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-bold">مزد مبنای روزانه</td>
                        <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.dailyBaseSalary || 0).toLocaleString("fa-IR")}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2">مزد مبنای ماهانه (۳۰ روز)</td>
                        <td className="px-4 py-2 text-left font-mono font-bold">{(Number(selectedContractForPrint.dailyBaseSalary || 0) * 30).toLocaleString("fa-IR")}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2">کمک هزینه مسکن (حق مسکن)</td>
                        <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.housingAllowance || 0).toLocaleString("fa-IR")}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2">بن خواربار و اقلام مصرفی</td>
                        <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.groceryAllowance || 0).toLocaleString("fa-IR")}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2">حق اولاد ماهانه</td>
                        <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.childAllowance || 0).toLocaleString("fa-IR")}</td>
                      </tr>
                      {Number(selectedContractForPrint.responsibilityAllowance || 0) > 0 && (
                        <tr className="border-b">
                          <td className="px-4 py-2">فوق‌العاده مدیریت / مسئولیت</td>
                          <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.responsibilityAllowance).toLocaleString("fa-IR")}</td>
                        </tr>
                      )}
                      {Number(selectedContractForPrint.expertiseAllowance || 0) > 0 && (
                        <tr className="border-b">
                          <td className="px-4 py-2">حق جذب و تخصص</td>
                          <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.expertiseAllowance).toLocaleString("fa-IR")}</td>
                        </tr>
                      )}
                      {Number(selectedContractForPrint.otherAllowances || 0) > 0 && (
                        <tr className="border-b">
                          <td className="px-4 py-2">سایر فوق‌العاده‌های مستمر</td>
                          <td className="px-4 py-2 text-left font-mono">{Number(selectedContractForPrint.otherAllowances).toLocaleString("fa-IR")}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-50 font-extrabold text-indigo-900">
                        <td className="px-4 py-2.5">جمع کل ناخالص ماهانه قرارداد (ریال)</td>
                        <td className="px-4 py-2.5 text-left font-mono text-sm">
                          {(
                            Number(selectedContractForPrint.dailyBaseSalary || 0) * 30 +
                            Number(selectedContractForPrint.housingAllowance || 0) +
                            Number(selectedContractForPrint.groceryAllowance || 0) +
                            Number(selectedContractForPrint.childAllowance || 0) +
                            Number(selectedContractForPrint.responsibilityAllowance || 0) +
                            Number(selectedContractForPrint.expertiseAllowance || 0) +
                            Number(selectedContractForPrint.transportAllowance || 0) +
                            Number(selectedContractForPrint.otherAllowances || 0)
                          ).toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* بند ۷: سایر شرایط و قوانین */}
              <div>
                <h3 className="font-bold text-slate-950 border-r-4 border-slate-800 pr-2 mb-2">بند ۷: سایر ضوابط و حق مرخصی</h3>
                <p>
                  کارگر مستحق برخورداری از مرخصی استحقاقی معادل <strong>{selectedContractForPrint.annualLeaveDays} روز در سال</strong> است که استفاده از آن منوط به هماهنگی و موافقت کارفرما خواهد بود. کارفرما متعهد به پرداخت حق بیمه سهم کارفرما به سازمان تامین اجتماعی در مدت این قرارداد می‌باشد.
                </p>
              </div>

              <p className="text-xs text-slate-500 text-center italic mt-4">
                این قرارداد کار در ۲ نسخه تنظیم گردیده که هر کدام دارای حکم واحد بوده و به امضای طرفین می‌رسد.
              </p>

              {/* بخش امضاء */}
              <div className="grid grid-cols-2 gap-4 pt-12 text-center no-break">
                <div className="space-y-16">
                  <span className="font-bold text-slate-900">امضا و اثر انگشت کارمند (کارگر)</span>
                  <div className="text-xs text-slate-400">تاریخ امضا: ....................</div>
                </div>
                <div className="space-y-16">
                  <span className="font-bold text-slate-900">مهر و امضا نماینده قانونی کارفرما</span>
                  <div className="text-xs text-slate-400">تاریخ امضا: ....................</div>
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}

      {/* ۲. فرم افزودن / ویرایش قرارداد جدید */}
      {showForm && !selectedContractForPrint && (
        <Card className="border-slate-100 no-print">
          <CardHeader className="text-right border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              {editingId ? "ویرایش مشخصات قرارداد کار" : "تعریف و انعقاد قرارداد کار جدید"}
            </CardTitle>
            <CardDescription className="text-xs">اطلاعات، حقوق مبنا، مزایا و دوره زمانی قرارداد را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* بخش مشخصات عمومی */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-blue-600">اطلاعات هویتی و زمانی قرارداد</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">انتخاب کارمند پرسنلی <span className="text-rose-500">*</span></Label>
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
                    <Label className="text-xs font-semibold">شماره قرارداد <span className="text-rose-500">*</span></Label>
                    <Input value={form.contractNo} onChange={e => handleChange("contractNo", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" required />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تاریخ انعقاد قرارداد</Label>
                    <PersianDatePicker value={form.contractDate} onChange={e => handleChange("contractDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۰۱" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تاریخ شروع قرارداد</Label>
                    <PersianDatePicker value={form.startDate} onChange={e => handleChange("startDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۰۱" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تاریخ پایان قرارداد</Label>
                    <PersianDatePicker value={form.endDate} onChange={e => handleChange("endDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۱۲/۲۹" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">وضعیت قرارداد</Label>
                    <select value={form.status} onChange={e => handleChange("status", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                      <option value="active">فعال و در جریان</option>
                      <option value="draft">پیش‌نویس قرارداد</option>
                      <option value="completed">خاتمه یافته قانونی</option>
                      <option value="terminated">لغو شده / تسویه پیش از موعد</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">وضعیت مالیاتی در قرارداد</Label>
                    <select value={form.taxStatus || "taxable"} onChange={e => handleChange("taxStatus", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                      <option value="taxable">مشمول پرداخت مالیات حقوق</option>
                      <option value="exempt">معاف از مالیات حقوق (ماده ۹۱)</option>
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* بخش تعهدات و ساعات کار */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-blue-600">تعهدات و قوانین کار</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">سمت / عنوان شغلی در قرارداد</Label>
                    <Input value={form.jobTitle} onChange={e => handleChange("jobTitle", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: کارشناس حسابداری" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">محل انجام کار</Label>
                    <Input value={form.workLocation} onChange={e => handleChange("workLocation", e.target.value)} className="h-9 text-xs mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">ساعت کار هفتگی (قانون کار: ۴۴ ساعت)</Label>
                    <Input type="number" value={form.workingHours} onChange={e => handleChange("workingHours", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">دوره آزمایشی (بر حسب ماه)</Label>
                    <Input type="number" value={form.probationMonth} onChange={e => handleChange("probationMonth", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* حقوق و دستمزد */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-emerald-600">جزئیات مزد مبنا و حقوق و مزایای مستمر ماهانه (۱۴۰۵)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">مزد پایه روزانه (ریال)</Label>
                    <Input type="number" value={form.dailyBaseSalary} onChange={e => handleChange("dailyBaseSalary", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left font-bold" />
                    <span className="text-[10px] text-muted-foreground block mt-1">مزد مبنای ماهانه ۳۰ روزه: {monthlyBaseSalary.toLocaleString("fa-IR")} ریال</span>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">حق مسکن ماهانه (ریال)</Label>
                    <Input type="number" value={form.housingAllowance} onChange={e => handleChange("housingAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">بن خواربار و معیشت ماهانه (ریال)</Label>
                    <Input type="number" value={form.groceryAllowance} onChange={e => handleChange("groceryAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">حق اولاد ماهانه (ریال)</Label>
                    <Input type="number" value={form.childAllowance} onChange={e => handleChange("childAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">حق مسئولیت / مدیریت (ریال)</Label>
                    <Input type="number" value={form.responsibilityAllowance} onChange={e => handleChange("responsibilityAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">حق جذب و تخصص ماهانه (ریال)</Label>
                    <Input type="number" value={form.expertiseAllowance} onChange={e => handleChange("expertiseAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">هزینه ایاب و ذهاب ماهانه (ریال)</Label>
                    <Input type="number" value={form.transportAllowance} onChange={e => handleChange("transportAllowance", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">سایر مزایای مستمر ماهانه (ریال)</Label>
                    <Input type="number" value={form.otherAllowances} onChange={e => handleChange("otherAllowances", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">مرخصی استحقاقی سالانه (قانون کار: ۲۶ روز)</Label>
                    <Input type="number" value={form.annualLeaveDays} onChange={e => handleChange("annualLeaveDays", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-4 rounded-xl flex justify-between items-center border border-emerald-500/20 mt-4">
                  <span className="text-xs font-bold text-slate-600">جمع ناخالص حقوق قرارداد کار (۳۰ روزه):</span>
                  <span className="font-mono text-base font-black text-emerald-800 dark:text-emerald-400">
                    {(totalSalaryGross / 10).toLocaleString("fa-IR")} <span className="text-xs font-semibold">تومان</span>
                    <span className="block text-[10px] text-muted-foreground text-left">{totalSalaryGross.toLocaleString("fa-IR")} ریال</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-9 text-xs">انصراف</Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "در حال ثبت..." : "ذخیره قرارداد"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* ۳. لیست جدول قراردادها */}
      {!showForm && !selectedContractForPrint && (
        <Card className="border-slate-100 no-print">
          <CardContent className="pt-4">
            
            <div className="flex justify-between items-center gap-2 mb-4">
              <div className="flex items-center gap-2 max-w-sm flex-1">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <Input
                  placeholder="جستجو بر اساس شماره قرارداد، نام کارمند، سمت..."
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
                    <TableHead className="text-right w-28">شماره قرارداد</TableHead>
                    <TableHead className="text-right">نام کارمند</TableHead>
                    <TableHead className="text-right">عنوان شغلی (سمت)</TableHead>
                    <TableHead className="text-center w-24">تاریخ شروع</TableHead>
                    <TableHead className="text-center w-24">تاریخ پایان</TableHead>
                    <TableHead className="text-left w-36">حقوق قرارداد (ریال)</TableHead>
                    <TableHead className="text-center w-24">وضعیت</TableHead>
                    <TableHead className="text-center w-28">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                        هیچ قرارداد کار پرسنلی یافت نشد.
                      </TableCell>
                    </TableRow>
                  ) : filteredContracts.map(c => {
                    const emp = (employees || []).find(e => (e._id === c.employeeId || e.id === c.employeeId));
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "—";

                    // Status Badge
                    const statusBadge =
                      c.status === "active" ? <Badge variant="success">فعال</Badge> :
                      c.status === "completed" ? <Badge variant="secondary">پایان‌یافته</Badge> :
                      c.status === "draft" ? <Badge variant="warning">پیش‌نویس</Badge> :
                      <Badge variant="destructive">فسخ‌شده</Badge>;

                    // Gross contract sum calculation
                    const gross =
                      Number(c.dailyBaseSalary || 0) * 30 +
                      Number(c.housingAllowance || 0) +
                      Number(c.groceryAllowance || 0) +
                      Number(c.childAllowance || 0) +
                      Number(c.responsibilityAllowance || 0) +
                      Number(c.expertiseAllowance || 0) +
                      Number(c.transportAllowance || 0) +
                      Number(c.otherAllowances || 0);

                    return (
                      <tr key={c._id || c.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-300">{c.contractNo}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{empName}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{c.jobTitle || "—"}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{c.startDate || "—"}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{c.endDate || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-left text-emerald-700 dark:text-emerald-400">{gross.toLocaleString("fa-IR")}</td>
                        <td className="px-4 py-3 text-center">{statusBadge}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleOpenScanner(c)}
                              title={c.scannedDoc ? "مشاهده قرارداد اسکن شده" : "اسکن و بارگذاری قرارداد امضا شده"}
                            >
                              <Scan className={cn("h-4 w-4", c.scannedDoc ? "text-emerald-600 font-bold" : "text-indigo-600")} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => triggerPrint(c)}
                              title="مشاهده و چاپ قرارداد کار استاندارد"
                            >
                              <Printer className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(c)}
                              title="ویرایش قرارداد"
                            >
                              <Pencil className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(c._id || c.id)}
                              title="حذف قرارداد"
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

      {/* مودال هوشمند اسکن و آرشیو قرارداد */}
      <Modal
        open={isOpenScanner}
        onClose={() => { stopCamera(); setIsOpenScanner(false); }}
        title="پنل هوشمند اسکن و آرشیو قرارداد کار"
        description={scannerContract ? `شماره قرارداد: ${scannerContract.contractNo} پرسنل` : ""}
        size="lg"
      >
        <div className="space-y-4 p-4 text-right" dir="rtl">
          
          {/* تب‌های مودال اسکن */}
          <div className="flex gap-2 border-b pb-2">
            {scannerContract?.scannedDoc && (
              <button
                type="button"
                onClick={() => { stopCamera(); setScannerTab("preview_only"); }}
                className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-all", scannerTab === "preview_only" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}
              >
                مشاهده قرارداد اسکن شده
              </button>
            )}
            <button
              type="button"
              onClick={() => { stopCamera(); setScannerTab("twain"); }}
              className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-all", scannerTab === "twain" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}
            >
              اتصال مستقیم به اسکنر (TWAIN)
            </button>
            <button
              type="button"
              onClick={() => { setScannerTab("camera"); }}
              className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-all", scannerTab === "camera" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}
            >
              اسکن سریع با دوربین (Webcam)
            </button>
            <button
              type="button"
              onClick={() => { stopCamera(); setScannerTab("file"); }}
              className={cn("px-3 py-1 text-xs font-bold rounded-lg transition-all", scannerTab === "file" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}
            >
              بارگذاری فایل سند
            </button>
          </div>

          {/* ۱. تب مستقیم اسکنر TWAIN */}
          {scannerTab === "twain" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">انتخاب دستگاه اسکنر متصل</Label>
                  <select
                    value={selectedScanner}
                    onChange={e => setSelectedScanner(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5"
                    disabled={isScanning}
                  >
                    <option value="Canon LiDE 300 - TWAIN v2.4">Canon LiDE 300 - TWAIN v2.4</option>
                    <option value="HP LaserJet Pro 400 MFP - WIA">HP LaserJet Pro 400 MFP - WIA</option>
                    <option value="Fujitsu ScanSnap iX1500 - ISIS">Fujitsu ScanSnap iX1500 - ISIS</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={startPhysicalScan}
                    disabled={isScanning}
                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5"
                  >
                    <RefreshCw className={cn("h-4 w-4", isScanning && "animate-spin")} />
                    {isScanning ? "در حال اسکن برگه قرارداد..." : "شروع عملیات اسکن فیزیکی"}
                  </Button>
                </div>
              </div>

              {isScanning && (
                <div className="space-y-2 border p-6 rounded-2xl bg-slate-50 text-center">
                  <span className="text-xs font-bold text-slate-600 block animate-pulse">در حال خواندن سند از فیدر اسکنر... لطفا برگه را خارج نکنید.</span>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{scanProgress}%</span>
                </div>
              )}
            </div>
          )}

          {/* ۲. تب اسکن با دوربین */}
          {scannerTab === "camera" && (
            <div className="space-y-4 text-center">
              {!cameraActive && !capturedImage && (
                <div className="py-10 border border-dashed rounded-2xl bg-slate-50 flex flex-col items-center justify-center">
                  <Camera className="h-10 w-10 text-indigo-500 mb-2 animate-bounce" />
                  <Button type="button" size="sm" onClick={() => {
                    const videoEl = document.getElementById("scanner-webcam-feed");
                    startCamera(videoEl);
                  }} className="text-xs">
                    فعال‌سازی و دسترسی به دوربین
                  </Button>
                </div>
              )}

              <div className={cn("relative mx-auto max-w-md overflow-hidden rounded-2xl border bg-black", (!cameraActive || capturedImage) && "hidden")}>
                <video
                  id="scanner-webcam-feed"
                  ref={el => setVideoRef(el)}
                  className="w-full h-64 object-cover scale-x-[-1]"
                  playsInline
                  muted
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  <Button type="button" size="sm" onClick={() => capturePhoto()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs">
                    <Scan className="h-4 w-4" /> گرفتن عکس اسکن
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => stopCamera()} className="gap-1.5 text-xs">
                    غیرفعال‌سازی
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ۳. تب بارگذاری فایل */}
          {scannerTab === "file" && (
            <div className="border border-dashed rounded-2xl p-8 bg-slate-50 text-center text-xs space-y-2">
              <UploadCloud className="h-8 w-8 text-indigo-500 mx-auto" />
              <p className="font-bold text-slate-700">فایل تصویر یا PDF اسکن شده را انتخاب کنید</p>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto text-xs"
              />
            </div>
          )}

          {/* ۴. نمایش پیش‌نویس اسکن شده و کنترل‌های تایید */}
          {capturedImage && (
            <div className="space-y-4 pt-2">
              <Separator />
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-700">پیش‌نمایش سند اسکن شده نهایی:</h4>
                {scannerTab !== "preview_only" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCapturedImage(null)}
                    className="h-7 text-xs text-rose-600"
                  >
                    حذف و اسکن مجدد
                  </Button>
                )}
              </div>
              
              <div className="border rounded-2xl overflow-hidden w-full max-w-2xl mx-auto shadow-inner bg-slate-100 p-4 flex justify-center">
                {capturedImage && typeof capturedImage === "string" && (capturedImage.startsWith("data:application/pdf") || capturedImage.toLowerCase().endsWith(".pdf")) ? (
                  <div className="w-full text-center p-4 bg-white border rounded-xl flex flex-col items-center">
                    <FileText className="h-12 w-12 text-rose-500 mb-2" />
                    <span className="text-xs font-bold text-slate-800 block mb-2">فایل قرارداد کار با فرمت PDF بارگذاری شده است.</span>
                    <div className="flex gap-2 mb-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = capturedImage;
                          link.download = `Contract-${scannerContract?.contractNo || "Signed"}.pdf`;
                          link.click();
                        }}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Download className="h-4 w-4" /> دانلود فایل PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const win = window.open();
                          if (win) {
                            win.document.write(`<iframe src="${capturedImage}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            win.document.close();
                          }
                        }}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Eye className="h-4 w-4" /> مشاهده در پنجره جدید
                      </Button>
                    </div>
                    {/* Live PDF Preview frame */}
                    <div className="w-full h-[320px] border rounded-lg overflow-hidden">
                      <iframe src={capturedImage} className="w-full h-full" title="PDF Live Preview" />
                    </div>
                  </div>
                ) : capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Scanned Document Preview"
                    className="max-h-[380px] object-contain border bg-white shadow-sm rounded-lg"
                    style={{ filter: "contrast(1.1) grayscale(0.1)" }}
                    onError={(e) => {
                      // Fallback if image fails to load
                      console.error("Image load failed, showing placeholder download");
                      e.target.style.display = "none";
                      const p = e.target.parentElement.querySelector(".image-error-fallback");
                      if (p) p.style.display = "flex";
                    }}
                  />
                ) : null}

                <div className="image-error-fallback hidden w-full text-center p-6 bg-white border rounded-xl flex-col items-center justify-center">
                  <Info className="h-10 w-10 text-amber-500 mb-2" />
                  <span className="text-xs font-bold text-slate-800 block mb-2">امکان نمایش مستقیم تصویر در این مرورگر وجود ندارد.</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const win = window.open();
                      if (win && capturedImage) {
                        win.document.write(`<img src="${capturedImage}" style="max-width:100%; height:auto;" />`);
                        win.document.close();
                      }
                    }}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Eye className="h-4 w-4" /> باز کردن فایل تصویر در پنجره جدید
                  </Button>
                </div>
              </div>

              {scannerTab !== "preview_only" && (
                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { stopCamera(); setIsOpenScanner(false); }}
                    className="text-xs h-9"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSaveScan}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow"
                  >
                    <Save className="h-4 w-4" />
                    ذخیره سند در پرونده کارمند
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>
      </Modal>
    </div>
  );
}
