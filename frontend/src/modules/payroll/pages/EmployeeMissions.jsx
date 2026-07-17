import { useState, useMemo } from "react";
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
import {
  Briefcase, Plus, Pencil, Trash2, Printer, Save, Info, ShieldCheck, X, Search, MapPin, Clock, Car
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  employeeId: "",
  missionType: "domestic_city",    // domestic_city | domestic_road | abroad
  destination: "",
  purpose: "",
  startDate: "",
  endDate: "",
  durationDays: 1,
  transportation: "personal_car",  // personal_car | org_car | train | bus | flight
  dailyAllowance: 2850000,         // مبلغ روزانه فوق‌العاده ماموریت (ریال) - نرخ 1405
  totalAllowance: 0,
  accommodationCost: 0,
  otherCosts: 0,
  supervisor: "",
  status: "pending",               // pending | approved | completed | rejected
  notes: ""
};

const MISSION_TYPES = [
  { value: "domestic_city", label: "مأموریت داخلی درون شهری" },
  { value: "domestic_road", label: "مأموریت داخلی برون شهری" },
  { value: "abroad", label: "مأموریت خارج از کشور" }
];

const TRANSPORT_TYPES = [
  { value: "personal_car", label: "خودروی شخصی" },
  { value: "org_car", label: "خودروی سازمانی" },
  { value: "train", label: "قطار" },
  { value: "bus", label: "اتوبوس" },
  { value: "flight", label: "هواپیما" },
  { value: "other", label: "سایر وسایل حمل و نقل" }
];

// Allowance rates per 1405 labor law
const ALLOWANCE_RATES = {
  domestic_city: 2850000,    // ریال در روز
  domestic_road: 3520000,
  abroad: 8500000
};

export default function EmployeeMissions() {
  const {
    employees, employeeMissions, addConfig, updateConfig, deleteConfig, refreshAllConfigs
  } = useAssets();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown options for employees
  const employeeOptions = useMemo(() => {
    return (employees || []).map(e => ({
      value: e._id || e.id,
      label: `${e.code} — ${e.firstName} ${e.lastName} (${e.jobTitle || "بدون سمت"})`
    }));
  }, [employees]);

  // Filtered list
  const filteredMissions = useMemo(() => {
    const q = search.toLowerCase();
    return (employeeMissions || []).filter(m => {
      const emp = (employees || []).find(e => (e._id === m.employeeId || e.id === m.employeeId));
      const name = emp ? `${emp.firstName} ${emp.lastName}` : "";
      const typeLabel = MISSION_TYPES.find(t => t.value === m.missionType)?.label || "";
      return !q || name.toLowerCase().includes(q) || (m.destination || "").toLowerCase().includes(q) || typeLabel.toLowerCase().includes(q);
    });
  }, [employeeMissions, employees, search]);

  function handleChange(field, val) {
    setForm(f => {
      const updated = { ...f, [field]: val };
      // Auto-update daily allowance rate on type change
      if (field === "missionType") {
        updated.dailyAllowance = ALLOWANCE_RATES[val] ?? ALLOWANCE_RATES.domestic_city;
      }
      // Auto-calculate total allowance
      const days = field === "durationDays" ? Number(val) : Number(updated.durationDays);
      const rate = field === "dailyAllowance" ? Number(val) : Number(updated.dailyAllowance);
      updated.totalAllowance = days * rate;
      return updated;
    });
    setErrorMsg("");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.employeeId) { setErrorMsg("انتخاب کارمند الزامی است."); return; }
    if (!form.destination.trim()) { setErrorMsg("مقصد مأموریت الزامی است."); return; }
    if (!form.startDate) { setErrorMsg("تاریخ شروع مأموریت الزامی است."); return; }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      const payload = { ...form, totalAllowance: Number(form.durationDays) * Number(form.dailyAllowance) };
      let result;
      if (editingId) {
        result = await updateConfig("employee_missions", { ...payload, id: editingId, _id: editingId });
      } else {
        result = await addConfig("employee_missions", payload);
      }
      if (result) {
        setSuccessMsg(editingId ? "مأموریت با موفقیت ویرایش شد." : "مأموریت با موفقیت ثبت شد.");
        setForm(INITIAL_FORM);
        setEditingId(null);
        setShowForm(false);
        await refreshAllConfigs();
      } else {
        setErrorMsg("خطا در ثبت مأموریت در سرور.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ارتباط با سرور.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(m) {
    setForm(m);
    setEditingId(m._id || m.id);
    setShowForm(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleDelete(id) {
    if (window.confirm("آیا از حذف این ماموریت مطمئن هستید؟")) {
      const ok = await deleteConfig("employee_missions", id);
      if (ok) await refreshAllConfigs();
    }
  }

  function triggerPrint(m) {
    const emp = (employees || []).find(e => (e._id === m.employeeId || e.id === m.employeeId));
    setSelectedForPrint({
      ...m,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "نامشخص",
      employeeCode: emp ? emp.code : "—",
      nationalId: emp ? emp.nationalId : "—",
      jobTitle: emp ? (emp.jobTitle || emp.role || "—") : "—",
      department: emp ? (emp.department || "—") : "—",
      missionTypeLabel: MISSION_TYPES.find(t => t.value === m.missionType)?.label || "—",
      transportLabel: TRANSPORT_TYPES.find(t => t.value === m.transportation)?.label || "—",
    });
  }

  function printPage() {
    const el = document.getElementById("printable-mission-sheet");
    if (!el) return;
    const clone = el.cloneNode(true);
    const win = window.open("", "_blank", "width=850,height=1100");
    if (!win) { window.print(); return; }

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>حکم مأموریت - ${selectedForPrint?.employeeName || ""}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Tahoma", "Arial", sans-serif;
      font-size: 11px; line-height: 1.7; color: #111;
      direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .outer-border { border: 2.5px double #111; padding: 14px; }
    .header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 12px; }
    .header-title { text-align: center; }
    .header-title h1 { font-size: 14px; font-weight: 900; }
    .section { border: 1px solid #444; margin-bottom: 10px; }
    .section-head { background: #f0f0f0 !important; font-weight: bold; padding: 4px 8px; font-size: 11px; border-bottom: 1px solid #444; }
    .section-body { padding: 8px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 14px; }
    .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px 10px; }
    .field { font-size: 11px; }
    .field strong { font-weight: 700; }
    .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 30px; }
    .sig-box { border: 1px solid #555; height: 90px; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
    .sig-box span { font-weight: bold; font-size: 11px; }
    .sig-box small { font-size: 9px; color: #777; }
    .no-print { display: none !important; }
    .note-box { border: 1px dashed #888; padding: 6px; background: #fafafa; margin-top: 6px; min-height: 40px; }
    .amount { font-family: monospace; font-weight: bold; }
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

  const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");

  return (
    <div className="space-y-4 text-right" dir="rtl">

      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="text-right">
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-600" />
            مدیریت احکام مأموریت پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            ثبت، پیگیری و صدور حکم رسمی مأموریت‌های داخلی و خارجی همراه با محاسبه فوق‌العاده مأموریت.
          </p>
        </div>
        {!showForm && !selectedForPrint && (
          <Button size="sm" onClick={() => { setForm(INITIAL_FORM); setEditingId(null); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Plus className="h-4 w-4" /> صدور حکم مأموریت جدید
          </Button>
        )}
      </div>

      {/* پیام‌ها */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {/* ۱. پیش‌نمایش و چاپ حکم مأموریت */}
      {selectedForPrint && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setSelectedForPrint(null)} className="h-9 text-xs gap-1.5">
              <X className="h-4 w-4" /> بستن
            </Button>
            <Button size="sm" onClick={printPage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Printer className="h-4 w-4" /> چاپ حکم مأموریت (A4)
            </Button>
          </div>

          <Card className="border-slate-300 shadow-lg p-8 max-w-3xl mx-auto bg-white text-slate-900 font-sans" id="printable-mission-sheet">
            <div className="outer-border">
              {/* سربرگ */}
              <div className="header">
                <div className="text-right text-xs">
                  <strong>{localStorage.getItem("org_name") || "وزارت امور اقتصادی و دارایی"}</strong>
                  <div className="text-[10px] text-slate-500">امور منابع انسانی</div>
                </div>
                <div className="header-title">
                  <h1>حکم مأموریت اداری</h1>
                  <div style={{fontSize:"9px",color:"#666"}}>(موضوع مواد ۳۸-۴۶ آیین‌نامه استخدامی)</div>
                </div>
                <div className="text-left text-xs font-mono">
                  <div>تاریخ صدور: {new Date().toLocaleDateString("fa-IR")}</div>
                </div>
              </div>

              {/* مشخصات مستخدم */}
              <div className="section">
                <div className="section-head">۱. مشخصات مستخدم مأمور</div>
                <div className="section-body">
                  <div className="grid4">
                    <div className="field">نام و نام خانوادگی: <strong>{selectedForPrint.employeeName}</strong></div>
                    <div className="field">کد پرسنلی: <strong>{selectedForPrint.employeeCode}</strong></div>
                    <div className="field">کد ملی: <strong>{selectedForPrint.nationalId}</strong></div>
                    <div className="field">سمت شغلی: <strong>{selectedForPrint.jobTitle}</strong></div>
                  </div>
                </div>
              </div>

              {/* مشخصات مأموریت */}
              <div className="section">
                <div className="section-head">۲. مشخصات مأموریت</div>
                <div className="section-body">
                  <div className="grid3" style={{marginBottom:"8px"}}>
                    <div className="field">نوع مأموریت: <strong>{selectedForPrint.missionTypeLabel}</strong></div>
                    <div className="field">مقصد مأموریت: <strong>{selectedForPrint.destination}</strong></div>
                    <div className="field">وسیله نقلیه: <strong>{selectedForPrint.transportLabel}</strong></div>
                  </div>
                  <div className="grid3">
                    <div className="field">تاریخ شروع: <strong>{selectedForPrint.startDate}</strong></div>
                    <div className="field">تاریخ پایان: <strong>{selectedForPrint.endDate || "—"}</strong></div>
                    <div className="field">مدت مأموریت: <strong>{selectedForPrint.durationDays} روز</strong></div>
                  </div>
                  <div style={{marginTop:"8px"}}>
                    <div className="field">هدف و موضوع مأموریت:</div>
                    <div className="note-box">{selectedForPrint.purpose || "—"}</div>
                  </div>
                </div>
              </div>

              {/* فوق‌العاده مأموریت */}
              <div className="section">
                <div className="section-head">۳. فوق‌العاده و هزینه‌های مأموریت</div>
                <div className="section-body">
                  <div className="grid4">
                    <div className="field">نرخ روزانه فوق‌العاده: <span className="amount">{fmt(selectedForPrint.dailyAllowance)}</span> ریال</div>
                    <div className="field">مدت (روز): <strong>{selectedForPrint.durationDays}</strong></div>
                    <div className="field">جمع فوق‌العاده: <strong className="amount">{fmt(Number(selectedForPrint.dailyAllowance) * Number(selectedForPrint.durationDays))}</strong> ریال</div>
                    <div className="field">هزینه اسکان: <span className="amount">{fmt(selectedForPrint.accommodationCost)}</span> ریال</div>
                  </div>
                  <div className="grid2" style={{marginTop:"6px"}}>
                    <div className="field">سایر هزینه‌ها: <span className="amount">{fmt(selectedForPrint.otherCosts)}</span> ریال</div>
                    <div className="field" style={{fontWeight:"bold",fontSize:"12px"}}>جمع کل هزینه‌های مأموریت: <span className="amount" style={{color:"#1a3a7a"}}>
                      {fmt(Number(selectedForPrint.dailyAllowance) * Number(selectedForPrint.durationDays) + Number(selectedForPrint.accommodationCost) + Number(selectedForPrint.otherCosts))}
                    </span> ریال</div>
                  </div>
                </div>
              </div>

              {/* امضاها */}
              <div className="sig-grid">
                <div className="sig-box">
                  <span>امضای مستخدم مأمور</span>
                  <small>تاریخ و امضاء</small>
                </div>
                <div className="sig-box">
                  <span>تأیید سرپرست مستقیم</span>
                  <div style={{fontSize:"10px"}}>{selectedForPrint.supervisor || "—"}</div>
                  <small>مهر و امضاء</small>
                </div>
                <div className="sig-box">
                  <span>تأیید نهایی منابع انسانی</span>
                  <div style={{fontSize:"10px"}}>وضعیت: {selectedForPrint.status === "approved" ? "تأیید شده" : selectedForPrint.status === "completed" ? "اتمام مأموریت" : selectedForPrint.status === "rejected" ? "رد شده" : "در انتظار"}</div>
                  <small>مهر و امضاء</small>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ۲. فرم ثبت / ویرایش */}
      {showForm && !selectedForPrint && (
        <Card className="border-slate-100">
          <CardHeader className="text-right border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              {editingId ? "ویرایش حکم مأموریت" : "صدور حکم مأموریت جدید"}
            </CardTitle>
            <CardDescription className="text-xs">اطلاعات مأموریت، وسیله نقلیه، بازه زمانی و فوق‌العاده را تکمیل کنید.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSave} className="space-y-6">

              {/* اطلاعات اصلی */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">کارمند مأمور <span className="text-rose-500">*</span></Label>
                  <div className="mt-1.5">
                    <SearchableSelect value={form.employeeId} onChange={v => handleChange("employeeId", v)} options={employeeOptions} placeholder="انتخاب کارمند..." disabled={!!editingId} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">نوع مأموریت <span className="text-rose-500">*</span></Label>
                  <select value={form.missionType} onChange={e => handleChange("missionType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                    {MISSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">مقصد مأموریت <span className="text-rose-500">*</span></Label>
                  <Input value={form.destination} onChange={e => handleChange("destination", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: تهران - وزارت اقتصاد" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">هدف و موضوع مأموریت</Label>
                <Input value={form.purpose} onChange={e => handleChange("purpose", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: شرکت در جلسه بررسی بودجه / دوره آموزشی / بازرسی..." />
              </div>

              <Separator />

              {/* بازه زمانی */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-blue-600">بازه زمانی مأموریت</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">تاریخ شروع <span className="text-rose-500">*</span></Label>
                    <PersianDatePicker value={form.startDate} onChange={e => handleChange("startDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۱۰" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تاریخ پایان</Label>
                    <PersianDatePicker value={form.endDate} onChange={e => handleChange("endDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۱۵" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">مدت (روز)</Label>
                    <Input type="number" min="1" value={form.durationDays} onChange={e => handleChange("durationDays", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">وسیله نقلیه</Label>
                    <select value={form.transportation} onChange={e => handleChange("transportation", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                      {TRANSPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* هزینه‌ها */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-amber-500">فوق‌العاده و هزینه‌های مأموریت (ریال)</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label className="text-xs font-semibold">نرخ روزانه فوق‌العاده</Label>
                    <Input type="number" value={form.dailyAllowance} onChange={e => handleChange("dailyAllowance", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" />
                    <p className="text-[10px] text-slate-400 mt-1">نرخ مصوب ۱۴۰۵ خودکار تکمیل شد</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">جمع فوق‌العاده (محاسبه خودکار)</Label>
                    <div className="h-9 rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs mt-1.5 flex items-center font-bold font-mono text-indigo-700">
                      {Number(form.dailyAllowance * form.durationDays).toLocaleString("fa-IR")} ریال
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">هزینه اسکان</Label>
                    <Input type="number" value={form.accommodationCost} onChange={e => handleChange("accommodationCost", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">سایر هزینه‌ها</Label>
                    <Input type="number" value={form.otherCosts} onChange={e => handleChange("otherCosts", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" />
                  </div>
                </div>

                {/* نمایش جمع کل */}
                <div className="mt-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">جمع کل هزینه‌های قابل پرداخت مأموریت:</span>
                  <span className="text-sm font-black font-mono text-indigo-900 dark:text-indigo-100">
                    {(Number(form.dailyAllowance) * Number(form.durationDays) + Number(form.accommodationCost) + Number(form.otherCosts)).toLocaleString("fa-IR")} ریال
                  </span>
                </div>
              </div>

              <Separator />

              {/* وضعیت */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">وضعیت مأموریت</Label>
                  <select value={form.status} onChange={e => handleChange("status", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                    <option value="pending">در انتظار تأیید</option>
                    <option value="approved">تأیید شده</option>
                    <option value="completed">اتمام مأموریت</option>
                    <option value="rejected">رد شده / لغو</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">سرپرست تأییدکننده</Label>
                  <Input value={form.supervisor} onChange={e => handleChange("supervisor", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="نام و سمت سرپرست..." />
                </div>
                <div>
                  <Label className="text-xs font-semibold">توضیحات تکمیلی</Label>
                  <Input value={form.notes} onChange={e => handleChange("notes", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="نکات یا ملاحظات اضافی..." />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-9 text-xs">انصراف</Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "در حال ثبت..." : "ذخیره مأموریت"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ۳. لیست مأموریت‌ها */}
      {!showForm && !selectedForPrint && (
        <Card className="border-slate-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4 max-w-sm">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <Input placeholder="جستجو بر اساس نام، مقصد یا نوع مأموریت..." className="h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">نام پرسنل</TableHead>
                    <TableHead className="text-right">نوع مأموریت</TableHead>
                    <TableHead className="text-right">مقصد</TableHead>
                    <TableHead className="text-center w-24">تاریخ شروع</TableHead>
                    <TableHead className="text-center w-20">مدت (روز)</TableHead>
                    <TableHead className="text-center w-36">جمع فوق‌العاده</TableHead>
                    <TableHead className="text-center w-28">وضعیت</TableHead>
                    <TableHead className="text-center w-28">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                        هیچ مأموریتی در سیستم ثبت نشده است.
                      </TableCell>
                    </TableRow>
                  ) : filteredMissions.map(m => {
                    const emp = (employees || []).find(e => (e._id === m.employeeId || e.id === m.employeeId));
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "—";
                    const typeLabel = MISSION_TYPES.find(t => t.value === m.missionType)?.label || "—";
                    const total = Number(m.dailyAllowance) * Number(m.durationDays);

                    const statusBadge =
                      m.status === "approved"   ? <Badge variant="success">تأیید شده</Badge> :
                      m.status === "completed"  ? <Badge className="bg-blue-600 text-white">اتمام یافته</Badge> :
                      m.status === "rejected"   ? <Badge variant="destructive">رد شده</Badge> :
                                                  <Badge variant="warning">در انتظار</Badge>;

                    return (
                      <tr key={m._id || m.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{empName}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold text-xs">{typeLabel}</td>
                        <td className="px-4 py-3 flex items-center gap-1 text-xs"><MapPin className="h-3 w-3 text-slate-400"/>{m.destination || "—"}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500 text-xs">{m.startDate || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-center text-indigo-700">{m.durationDays}</td>
                        <td className="px-4 py-3 font-mono text-center text-xs font-bold">{total.toLocaleString("fa-IR")} ریال</td>
                        <td className="px-4 py-3 text-center">{statusBadge}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => triggerPrint(m)} title="چاپ حکم مأموریت">
                              <Printer className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(m)} title="ویرایش">
                              <Pencil className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(m._id || m.id)} title="حذف">
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
    </div>
  );
}
