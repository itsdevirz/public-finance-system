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
import {
  FileText, Plus, Pencil, Trash2, Printer, Save, RefreshCw, Briefcase,
  Calendar, Landmark, ShieldCheck, User, ClipboardList, Info, Download, X, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  employeeId: "",
  leaveType: "annual", // annual, sick, unpaid, hourly, hourly_annual
  startDate: "",
  endDate: "",
  durationDays: 1,
  durationHours: 0,
  startTime: "",
  endTime: "",
  substituteName: "",
  reason: "",
  status: "pending", // pending, approved, rejected
  approvedBy: "مدیریت منابع انسانی"
};

const LEAVE_TYPES = [
  { value: "annual", label: "مرخصی استحقاقی روزانه" },
  { value: "sick", label: "مرخصی استعلاجی" },
  { value: "unpaid", label: "مرخصی بدون حقوق" },
  { value: "hourly", label: "مرخصی ساعتی شخصی" },
  { value: "hourly_annual", label: "مرخصی استحقاقی ساعتی" }
];

export default function EmployeeLeaves() {
  const {
    employees, employeeLeaves, addConfig, updateConfig, deleteConfig, refreshAllConfigs
  } = useAssets();

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedLeaveForPrint, setSelectedLeaveForPrint] = useState(null);
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

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return (employeeLeaves || []).filter(l => {
      const emp = (employees || []).find(e => (e._id === l.employeeId || e.id === l.employeeId));
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : "";
      const empCode = emp ? emp.code : "";
      const searchLower = search.toLowerCase();
      const typeLabel = LEAVE_TYPES.find(t => t.value === l.leaveType)?.label || "";
      return (
        !search ||
        empName.toLowerCase().includes(searchLower) ||
        empCode.toLowerCase().includes(searchLower) ||
        typeLabel.toLowerCase().includes(searchLower)
      );
    });
  }, [employeeLeaves, employees, search]);

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
    if (!form.startDate) {
      setErrorMsg("تاریخ شروع مرخصی الزامی است.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      let result;
      if (editingId) {
        result = await updateConfig("employee_leaves", { ...form, id: editingId, _id: editingId });
      } else {
        result = await addConfig("employee_leaves", form);
      }

      if (result) {
        setSuccessMsg(editingId ? "درخواست مرخصی با موفقیت ویرایش شد." : "درخواست مرخصی با موفقیت ثبت شد.");
        setForm(INITIAL_FORM);
        setEditingId(null);
        setShowForm(false);
        await refreshAllConfigs();
      } else {
        setErrorMsg("خطا در ثبت مرخصی در سرور.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("خطا در ارتباط با سرور.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(leave) {
    setForm(leave);
    setEditingId(leave._id || leave.id);
    setShowForm(true);
    setErrorMsg("");
    setSuccessMsg("");
  }

  async function handleDelete(id) {
    if (window.confirm("آیا از حذف این درخواست مرخصی مطمئن هستید؟")) {
      const success = await deleteConfig("employee_leaves", id);
      if (success) {
        await refreshAllConfigs();
      }
    }
  }

  // Open official print preview
  function triggerPrint(leave) {
    const emp = (employees || []).find(e => (e._id === leave.employeeId || e.id === leave.employeeId));
    setSelectedLeaveForPrint({
      ...leave,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "نامشخص",
      employeeCode: emp ? emp.code : "—",
      nationalId: emp ? emp.nationalId : "—",
      fatherName: emp ? emp.fatherName : "—",
      jobTitle: emp ? emp.jobTitle || emp.role || "—" : "—",
      leaveTypeLabel: LEAVE_TYPES.find(t => t.value === leave.leaveType)?.label || "نامشخص"
    });
  }

  // Print Isolated A4 portrait
  function printPage() {
    const el = document.getElementById("printable-leave-sheet");
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
  <title>درخواست مرخصی - ${selectedLeaveForPrint?.employeeName || ""}</title>
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
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    
    .border { border: 1px solid #333; }
    .border-b-2 { border-bottom: 2px solid #111; }
    .border-b { border-bottom: 1px solid #555; }
    
    .p-2 { padding: 0.5rem; }
    .p-4 { padding: 1rem; }
    .pt-8 { padding-top: 2rem; }
    
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    
    .w-full { width: 100%; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .gap-4 { gap: 1rem; }
    
    .header-box {
      border: 2px solid #222;
      padding: 12px;
      text-align: center;
      margin-bottom: 15px;
    }
    
    .section-box {
      border: 1px solid #333;
      padding: 10px;
      margin-bottom: 15px;
    }
    
    .section-title {
      font-weight: bold;
      background-color: #f5f5f5 !important;
      padding: 4px 8px;
      border-bottom: 1px solid #333;
      margin: -10px -10px 10px -10px;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-top: 30px;
      page-break-inside: avoid;
    }

    .signature-box {
      border: 1px solid #555;
      padding: 10px;
      height: 100px;
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
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            مدیریت درخواست‌های مرخصی پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            ثبت، تأیید و چاپ برگه‌های درخواست مرخصی استحقاقی، استعلاجی، ساعتی و بدون حقوق مستخدمین.
          </p>
        </div>
        {!showForm && !selectedLeaveForPrint && (
          <Button size="sm" onClick={() => { setForm(INITIAL_FORM); setEditingId(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <Plus className="h-4 w-4" /> ثبت مرخصی جدید
          </Button>
        )}
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

      {/* ۱. پیش‌نمایش و چاپ برگه درخواست مرخصی */}
      {selectedLeaveForPrint && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <Button variant="outline" size="sm" onClick={() => setSelectedLeaveForPrint(null)} className="h-9 text-xs gap-1.5">
              <X className="h-4 w-4" /> بستن پیش‌نمایش
            </Button>
            <Button size="sm" onClick={printPage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
              <Printer className="h-4 w-4" /> چاپ فرم مرخصی (A4)
            </Button>
          </div>

          <Card className="border-slate-300 shadow-lg p-8 max-w-3xl mx-auto bg-white text-slate-900 font-sans" id="printable-leave-sheet">
            <div className="header-box">
              <div className="grid grid-cols-3 items-center">
                <div className="text-right text-xs">
                  <strong>{localStorage.getItem("org_name") || "وزارت امور اقتصادی و دارایی"}</strong>
                  <div className="text-[10px] text-slate-500">امور منابع انسانی</div>
                </div>
                <div className="text-center">
                  <h1 className="text-sm font-black">فرم درخواست مرخصی پرسنلی</h1>
                  <span className="text-[9px] text-slate-500">(موضوع مواد ۶۴ الی ۶۹ قانون کار)</span>
                </div>
                <div className="text-left text-xs font-mono">
                  <div>تاریخ گزارش: {new Date().toLocaleDateString("fa-IR")}</div>
                </div>
              </div>
            </div>

            {/* بخش اول: مشخصات متقاضی */}
            <div className="section-box text-xs">
              <div className="section-title">۱. مشخصات مستخدم (متقاضی مرخصی)</div>
              <div className="grid grid-cols-4 gap-2">
                <div>نام و نام خانوادگی: <strong>{selectedLeaveForPrint.employeeName}</strong></div>
                <div>کد پرسنلی: <strong>{selectedLeaveForPrint.employeeCode}</strong></div>
                <div>کد ملی: <strong>{selectedLeaveForPrint.nationalId}</strong></div>
                <div>سمت شغلی: <strong>{selectedLeaveForPrint.jobTitle}</strong></div>
              </div>
            </div>

            {/* بخش دوم: جزئیات مرخصی */}
            <div className="section-box text-xs">
              <div className="section-title">۲. مشخصات مرخصی مورد تقاضا</div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>نوع مرخصی: <strong className="text-indigo-900">{selectedLeaveForPrint.leaveTypeLabel}</strong></div>
                <div>تاریخ شروع: <strong>{selectedLeaveForPrint.startDate || "—"}</strong></div>
                <div>تاریخ پایان: <strong>{selectedLeaveForPrint.endDate || "—"}</strong></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedLeaveForPrint.leaveType.startsWith("hourly") ? (
                  <>
                    <div>ساعت شروع: <strong>{selectedLeaveForPrint.startTime || "—"}</strong></div>
                    <div>ساعت پایان: <strong>{selectedLeaveForPrint.endTime || "—"}</strong></div>
                    <div>مدت (ساعت): <strong>{selectedLeaveForPrint.durationHours} ساعت</strong></div>
                  </>
                ) : (
                  <div>مدت کل (روز): <strong>{selectedLeaveForPrint.durationDays} روز</strong></div>
                )}
                <div className="col-span-2">علت مرخصی / توضیحات: <strong>{selectedLeaveForPrint.reason || "شخصی / اضطراری"}</strong></div>
              </div>
            </div>

            {/* بخش سوم: تعهد جانشین */}
            {selectedLeaveForPrint.substituteName && (
              <div className="section-box text-xs">
                <div className="section-title">۳. تعهد جانشین در زمان مرخصی</div>
                <p>
                  اینجانب <strong>{selectedLeaveForPrint.substituteName}</strong> متعهد می‌گردم در غیاب همکار فوق، مسئولیت امور محوله ایشان را در چارچوب ضوابط اداری عهده‌دار شوم.
                </p>
                <div className="text-left mt-4 text-[10px] text-slate-500">امضا و اثر انگشت جانشین: ........................</div>
              </div>
            )}

            {/* بخش چهارم: تاییدها */}
            <div className="signature-grid text-xs">
              <div className="signature-box">
                <span className="font-bold">امضای مستخدم (متقاضی):</span>
                <div className="text-left text-[9px] text-slate-400">تاریخ و امضا</div>
              </div>
              <div className="signature-box">
                <span className="font-bold">نظر سرپرست مستقیم واحد:</span>
                <div className="flex justify-between items-end">
                  <div className="space-x-4">
                    <input type="checkbox" checked={selectedLeaveForPrint.status === "approved"} disabled /> موافق
                    <input type="checkbox" checked={selectedLeaveForPrint.status === "rejected"} disabled /> مخالف
                  </div>
                  <span className="text-[9px] text-slate-400">امضا و تاریخ</span>
                </div>
              </div>
              <div className="signature-box col-span-2">
                <span className="font-bold">تایید نهایی امور اداری و منابع انسانی:</span>
                <p>وضعیت نهایی در سیستم پرسنلی: <strong>{selectedLeaveForPrint.status === "approved" ? "تأیید نهایی شده" : selectedLeaveForPrint.status === "rejected" ? "رد شده" : "در انتظار بررسی اداری"}</strong></p>
                <div className="text-left text-[9px] text-slate-400">مهر و امضای مسئول منابع انسانی ({selectedLeaveForPrint.approvedBy})</div>
              </div>
            </div>

          </Card>
        </div>
      )}

      {/* ۲. فرم ثبت مرخصی جدید / ویرایش */}
      {showForm && !selectedLeaveForPrint && (
        <Card className="border-slate-100 no-print">
          <CardHeader className="text-right border-b pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              {editingId ? "ویرایش درخواست مرخصی پرسنل" : "ثبت برگه درخواست مرخصی جدید"}
            </CardTitle>
            <CardDescription className="text-xs">اطلاعات هویتی کارمند، نوع مرخصی، بازه زمانی و جانشین را وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold">انتخاب کارمند متقاضی <span className="text-rose-500">*</span></Label>
                  <div className="mt-1.5">
                    <SearchableSelect
                      value={form.employeeId}
                      onChange={val => handleChange("employeeId", val)}
                      options={employeeOptions}
                      placeholder="انتخاب کارمند..."
                      disabled={!!editingId}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">نوع مرخصی <span className="text-rose-500">*</span></Label>
                  <select value={form.leaveType} onChange={e => handleChange("leaveType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                    {LEAVE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">نام و سمت همکار جانشین</Label>
                  <Input value={form.substituteName} onChange={e => handleChange("substituteName", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: زهرا اکبری (حسابدار)" />
                </div>
              </div>

              <Separator />

              {/* تاریخ و زمان */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-blue-600">بازه زمانی مرخصی</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">تاریخ شروع مرخصی <span className="text-rose-500">*</span></Label>
                    <PersianDatePicker value={form.startDate} onChange={e => handleChange("startDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۰۱" />
                  </div>
                  
                  {!form.leaveType.startsWith("hourly") ? (
                    <>
                      <div>
                        <Label className="text-xs font-semibold">تاریخ پایان مرخصی</Label>
                        <PersianDatePicker value={form.endDate} onChange={e => handleChange("endDate", e.target.value)} className="h-9 mt-1.5" placeholder="۱۴۰۵/۰۱/۰۵" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">مدت کل (بر حسب روز)</Label>
                        <Input type="number" min="1" value={form.durationDays} onChange={e => handleChange("durationDays", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-xs font-semibold">ساعت شروع مرخصی</Label>
                        <Input value={form.startTime} onChange={e => handleChange("startTime", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="08:00" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">ساعت پایان مرخصی</Label>
                        <Input value={form.endTime} onChange={e => handleChange("endTime", e.target.value)} className="h-9 text-xs mt-1.5 font-mono text-left" placeholder="10:30" />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">مدت کل (ساعت)</Label>
                        <Input type="number" step="0.5" value={form.durationHours} onChange={e => handleChange("durationHours", Number(e.target.value))} className="h-9 text-xs mt-1.5 font-mono text-left" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* وضعیت و تاییدات */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 border-r-4 pr-2 border-emerald-600">وضعیت و تاییدهای اداری</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">وضعیت درخواست مرخصی</Label>
                    <select value={form.status} onChange={e => handleChange("status", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                      <option value="pending">در انتظار تایید اداری</option>
                      <option value="approved">موافق شده / ثبت نهایی</option>
                      <option value="rejected">مخالفت شده / لغو</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تأییدکننده نهایی</Label>
                    <Input value={form.approvedBy} onChange={e => handleChange("approvedBy", e.target.value)} className="h-9 text-xs mt-1.5" />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <Label className="text-xs font-semibold">توضیحات و دلیل درخواست</Label>
                    <Input value={form.reason} onChange={e => handleChange("reason", e.target.value)} className="h-9 text-xs mt-1.5" placeholder="مثال: امور درمانی / مسافرت سالانه..." />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} className="h-9 text-xs">انصراف</Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 px-6 shadow">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "در حال ثبت..." : "ذخیره درخواست"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* ۳. جدول لیست درخواست‌های مرخصی */}
      {!showForm && !selectedLeaveForPrint && (
        <Card className="border-slate-100 no-print">
          <CardContent className="pt-4">
            
            <div className="flex justify-between items-center gap-2 mb-4">
              <div className="flex items-center gap-2 max-w-sm flex-1">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <Input
                  placeholder="جستجو بر اساس نام کارمند، نوع مرخصی، سابقه..."
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
                    <TableHead className="text-right">نام پرسنل</TableHead>
                    <TableHead className="text-right">نوع مرخصی</TableHead>
                    <TableHead className="text-center w-24">تاریخ شروع</TableHead>
                    <TableHead className="text-center w-24">تاریخ پایان</TableHead>
                    <TableHead className="text-center w-24">مدت مرخصی</TableHead>
                    <TableHead className="text-center w-28">وضعیت تایید</TableHead>
                    <TableHead className="text-center w-28">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                        هیچ درخواست مرخصی پرسنلی در سیستم ثبت نشده است.
                      </TableCell>
                    </TableRow>
                  ) : filteredLeaves.map(l => {
                    const emp = (employees || []).find(e => (e._id === l.employeeId || e.id === l.employeeId));
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "—";
                    const typeLabel = LEAVE_TYPES.find(t => t.value === l.leaveType)?.label || "—";

                    // Status Badge
                    const statusBadge =
                      l.status === "approved" ? <Badge variant="success">تأیید شده</Badge> :
                      l.status === "rejected" ? <Badge variant="destructive">رد شده</Badge> :
                      <Badge variant="warning">در انتظار بررسی</Badge>;

                    // Duration display
                    const durationText = l.leaveType.startsWith("hourly")
                      ? `${l.durationHours || 0} ساعت`
                      : `${l.durationDays || 0} روز`;

                    return (
                      <tr key={l._id || l.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{empName}</td>
                        <td className="px-4 py-3 text-slate-600 font-semibold">{typeLabel}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{l.startDate || "—"}</td>
                        <td className="px-4 py-3 font-mono text-center text-slate-500">{l.endDate || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-center text-indigo-900">{durationText}</td>
                        <td className="px-4 py-3 text-center">{statusBadge}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => triggerPrint(l)}
                              title="چاپ فرم درخواست مرخصی رسمی"
                            >
                              <Printer className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleEdit(l)}
                              title="ویرایش درخواست"
                            >
                              <Pencil className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleDelete(l._id || l.id)}
                              title="حذف مرخصی"
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

    </div>
  );
}
