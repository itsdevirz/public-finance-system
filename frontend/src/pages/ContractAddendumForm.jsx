import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Printer, LogOut, CheckCircle2, Search, X, Undo2, Edit3
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PersianDatePicker, addDaysToJalali, diffDaysJalali } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

const ADDENDUM_TYPES = [
  "افزایش مبلغ و تمدید مدت",
  "کاهش مبلغ و کاهش مدت",
  "افزایش مبلغ بدون تغییر مدت",
  "تمدید مدت بدون تغییر مبلغ",
];

const ADDENDUM_SUBJECTS = [
  "افزایش حجم کار و مدت پیمان",
  "کاهش مقادیر کار و زمان",
  "تمدید زمانی پروژه",
  "تغییر در نقشه و جزییات فنی",
];

const ADDENDUM_BASES = [
  "تغییر در شرایط کار",
  "دستور کارفرما",
  "تاخیر در تحویل کارگاه",
  "مشکلات نقشه‌برداری و زمین‌شناسی",
  "فورس ماژور",
];

const UNITS = ["متر مربع", "متر مکعب", "کیلوگرم", "نقطه", "عدد", "تن", "دستگاه", "شاخه"];

const INITIAL_FORM = {
  addendum_number: "",
  contract_id: "",
  contract_number: "",
  contract_title: "",
  contractor_name: "",
  addendum_subject: "افزایش حجم کار و مدت پیمان",
  addendum_type: "افزایش مبلغ و تمدید مدت",
  addendum_date: "",
  approval_number: "",
  approval_date: "",
  status: "ثبت شده",

  description: "",
  addendum_base: "تغییر در شرایط کار",
  amount_change_percent: 0,
  duration_change_percent: 0,

  initial_amount: 0,
  prev_addenda_amount: 0,
  addendum_amount: 0,
  new_total_amount: 0,

  initial_duration: 0,
  prev_duration_extensions: 0,
  addendum_duration: 0,
  new_total_duration: 0,

  financial_items: [],
  time_adjustments: [],
};

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <Label className="text-xs font-semibold text-muted-foreground text-right flex items-center justify-end gap-0.5">
        {required && <span className="text-destructive font-bold">*</span>}
        <span>{label}</span>
      </Label>
      {children}
    </div>
  );
}

export default function ContractAddendumForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [addendaList, setAddendaList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("main");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await api.get("/api/contracts");
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchAddenda = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-addenda");
      if (res.data?.success) {
        setAddendaList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching addenda:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-addenda/suggest-number");
      if (res.data?.success && res.data.addendum_number) {
        setForm((prev) => ({ ...prev, addendum_number: res.data.addendum_number }));
      }
    } catch (err) {
      console.error("Error getting suggested addendum number:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchAddenda();
    getSuggestedNumber();
  }, []);

  const handleContractChange = (contractId) => {
    const selectedContract = contracts.find((c) => c._id === contractId);
    if (!selectedContract) {
      setForm((prev) => ({
        ...prev,
        contract_id: "",
        contract_number: "",
        contract_title: "",
        contractor_name: "",
        initial_amount: 0,
        prev_addenda_amount: 0,
        initial_duration: 0,
        prev_duration_extensions: 0,
      }));
      return;
    }

    // Sum all previous addenda from contract document
    let prevAmt = 0;
    (selectedContract.addenda || []).forEach((a) => {
      if (a.type === "کاهش") {
        prevAmt -= Number(a.amount || 0);
      } else {
        prevAmt += Number(a.amount || 0);
      }
    });

    const initAmt = Number(selectedContract.amount || 0);
    const initDur = Number(selectedContract.duration || 365);

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contract_title: selectedContract.title,
      contractor_name: selectedContract.contractor_name,
      initial_amount: initAmt,
      prev_addenda_amount: prevAmt,
      initial_duration: initDur,
      description: `به موجب این الحاقیه، با توجه به افزایش حجم کار و ضرورت تکمیل عملیات، مبلغ قرارداد و مدت زمان اجرای آن به شرح ذیل اصلاح می‌گردد.`,
    }));
  };

  // Compute financial sum in real-time
  const financialSum = useMemo(() => {
    return form.financial_items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
  }, [form.financial_items]);

  // Compute duration sum in real-time
  const durationSum = useMemo(() => {
    return form.time_adjustments.reduce((sum, item) => sum + (Number(item.duration_days) || 0), 0);
  }, [form.time_adjustments]);

  // Compute percentages & sums for totals
  const computedStats = useMemo(() => {
    const initAmt = Number(form.initial_amount || 0);
    const prevAmt = Number(form.prev_addenda_amount || 0);
    const currAmt = Number(financialSum || 0);

    const initDur = Number(form.initial_duration || 0);
    const prevDur = Number(form.prev_duration_extensions || 0);
    const currDur = Number(durationSum || 0);

    let newAmt = initAmt + prevAmt;
    let newDur = initDur + prevDur;

    if (form.addendum_type?.includes("کاهش")) {
      newAmt -= currAmt;
      newDur -= currDur;
    } else {
      newAmt += currAmt;
      newDur += currDur;
    }

    const amtPercent = initAmt > 0 ? Math.round((currAmt / initAmt) * 100) : 0;
    const durPercent = initDur > 0 ? Math.round((currDur / initDur) * 100) : 0;

    return {
      addendum_amount: currAmt,
      new_total_amount: newAmt,
      addendum_duration: currDur,
      new_total_duration: newDur,
      amount_change_percent: amtPercent,
      duration_change_percent: durPercent,
    };
  }, [form.initial_amount, form.prev_addenda_amount, financialSum, form.initial_duration, form.prev_duration_extensions, durationSum, form.addendum_type]);

  // Sync computed stats into form state
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      addendum_amount: computedStats.addendum_amount,
      new_total_amount: computedStats.new_total_amount,
      addendum_duration: computedStats.addendum_duration,
      new_total_duration: computedStats.new_total_duration,
      amount_change_percent: computedStats.amount_change_percent,
      duration_change_percent: computedStats.duration_change_percent,
    }));
  }, [computedStats]);

  // Financial items handlers
  const handleFinancialItemChange = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.financial_items];
      const item = { ...list[index], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        item.total_amount = Math.round(Number(item.quantity || 0) * Number(item.unit_price || 0));
      }
      list[index] = item;
      return { ...prev, financial_items: list };
    });
  };

  const addFinancialRow = () => {
    setForm((prev) => ({
      ...prev,
      financial_items: [
        ...prev.financial_items,
        { row_num: prev.financial_items.length + 1, description: "", unit: "متر مربع", quantity: 0, unit_price: 0, total_amount: 0 },
      ],
    }));
  };

  const deleteFinancialRow = (index) => {
    setForm((prev) => {
      const list = prev.financial_items.filter((_, idx) => idx !== index).map((item, idx) => ({
        ...item,
        row_num: idx + 1,
      }));
      return { ...prev, financial_items: list };
    });
  };

  // Time adjustment handlers
  const handleTimeAdjustmentChange = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.time_adjustments];
      const item = { ...list[index], [field]: value };

      // Calculate duration_days if from_date or to_date changes
      if (field === "from_date" || field === "to_date") {
        if (item.from_date && item.to_date) {
          const diff = diffDaysJalali(item.from_date, item.to_date);
          item.duration_days = diff >= 0 ? diff : 0;
        }
      }

      // Calculate to_date if duration_days changes
      if (field === "duration_days") {
        const days = value === "" ? "" : (parseInt(value, 10) || 0);
        item.duration_days = days;
        if (item.from_date && days !== "") {
          item.to_date = addDaysToJalali(item.from_date, Number(days));
        }
      }

      list[index] = item;
      return { ...prev, time_adjustments: list };
    });
  };

  const addTimeRow = () => {
    setForm((prev) => ({
      ...prev,
      time_adjustments: [
        ...prev.time_adjustments,
        { row_num: prev.time_adjustments.length + 1, description: "", from_date: "", to_date: "", duration_days: 0 },
      ],
    }));
  };

  const deleteTimeRow = (index) => {
    setForm((prev) => {
      const list = prev.time_adjustments.filter((_, idx) => idx !== index).map((item, idx) => ({
        ...item,
        row_num: idx + 1,
      }));
      return { ...prev, time_adjustments: list };
    });
  };

  const handleNew = () => {
    setForm({
      ...INITIAL_FORM,
      financial_items: [],
      time_adjustments: [],
    });
    setSelectedId(null);
    getSuggestedNumber();
    setActiveTab("main");
  };

  const handleSave = async () => {
    const { contract_id, addendum_number, addendum_type, addendum_date } = form;
    if (!contract_id || !addendum_number || !addendum_type || !addendum_date) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره الحاقیه، نوع الحاقیه و تاریخ) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-addenda/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات الحاقیه با موفقیت بروزرسانی شد.");
          fetchAddenda();
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-addenda", form);
        if (res.data?.success) {
          alert("الحاقیه قرارداد با موفقیت ثبت گردید.");
          fetchAddenda();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving addendum:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات الحاقیه.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این الحاقیه مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-addenda/${selectedId}`);
      if (res.data?.success) {
        alert("الحاقیه حذف شد.");
        fetchAddenda();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting addendum:", err);
      alert(err.response?.data?.message || "خطا در حذف الحاقیه.");
    }
  };

  const loadAddendumDetails = (addendum) => {
    setSelectedId(addendum._id);
    setForm({
      addendum_number: addendum.addendum_number || "",
      contract_id: addendum.contract_id || "",
      contract_number: addendum.contract_number || "",
      contract_title: addendum.contract_title || "",
      contractor_name: addendum.contractor_name || "",
      addendum_subject: addendum.addendum_subject || "افزایش حجم کار و مدت پیمان",
      addendum_type: addendum.addendum_type || "افزایش مبلغ و تمدید مدت",
      addendum_date: addendum.addendum_date || "",
      approval_number: addendum.approval_number || "",
      approval_date: addendum.approval_date || "",
      status: addendum.status || "ثبت شده",
      description: addendum.description || "",
      addendum_base: addendum.addendum_base || "تغییر در شرایط کار",
      amount_change_percent: addendum.amount_change_percent || 0,
      duration_change_percent: addendum.duration_change_percent || 0,
      initial_amount: addendum.initial_amount || 0,
      prev_addenda_amount: addendum.prev_addenda_amount || 0,
      addendum_amount: addendum.addendum_amount || 0,
      new_total_amount: addendum.new_total_amount || 0,
      initial_duration: addendum.initial_duration || 0,
      prev_duration_extensions: addendum.prev_duration_extensions || 0,
      addendum_duration: addendum.addendum_duration || 0,
      new_total_duration: addendum.new_total_duration || 0,
      financial_items: addendum.financial_items || [],
      time_adjustments: addendum.time_adjustments || [],
    });
    setShowSearchModal(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>رسید الحاقیه قرارداد - ${form.addendum_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>رسید ثبت الحاقیه قرارداد</h2>
          <div class="grid">
            <div><strong>شماره الحاقیه:</strong> ${form.addendum_number}</div>
            <div><strong>تاریخ الحاقیه:</strong> ${form.addendum_date}</div>
            <div><strong>نوع الحاقیه:</strong> ${form.addendum_type}</div>
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>پیمانکار:</strong> ${form.contractor_name}</div>
            <div><strong>مبلغ الحاقیه:</strong> ${Number(form.addendum_amount).toLocaleString()} ریال</div>
            <div><strong>مدت تمدید:</strong> ${form.addendum_duration} روز</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredAddenda = addendaList.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.addendum_number || "").toLowerCase().includes(q) ||
      (a.contract_number || "").toLowerCase().includes(q) ||
      (a.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر ابزارهای فرم ثبت الحاقیه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">📄</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت الحاقیه قرارداد</h1>
            <p className="text-xs text-muted-foreground">ثبت الحاقیه‌ها، تغییرات شرایط عمومی و خصوصی و تمدید مدت قراردادها</p>
          </div>
        </div>

        {/* دکمه‌های بالا */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/basic-info")}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <LogOut className="h-4 w-4 rotate-180" />
            خروج
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            چاپ
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!selectedId}
            className="gap-1.5 h-9 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>

          {selectedId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="gap-1.5 h-9 text-xs border-border/80 text-foreground hover:bg-muted"
            >
              <Edit3 className="h-4 w-4 text-blue-500" />
              ویرایش
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
            disabled={!selectedId}
            className="gap-1.5 h-9 text-xs text-blue-500 border-blue-500/20 hover:bg-blue-500/10 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            تایید
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
          >
            <Save className="h-4 w-4" />
            ذخیره
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearchModal(true)}
            className="gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
          >
            <Search className="h-4 w-4" />
            جستجوی الحاقیه
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            جدید
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <Undo2 className="h-4 w-4 text-orange-500" />
            برگشت
          </Button>
        </div>
      </div>

      {contracts.length === 0 && !loading && (
        <div className="mb-5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 text-sm text-right flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold">هیچ قراردادی در سیستم یافت نشد!</p>
              <p className="text-xs opacity-90 mt-0.5">برای ثبت الحاقیه، ابتدا باید حداقل یک قرارداد در سیستم تعریف و ثبت شده باشد.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/basic-info/contracts/register")}
            className="border-amber-500/20 text-amber-600 hover:bg-amber-500/10 text-xs font-semibold h-8"
          >
            ثبت قرارداد جدید
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6" dir="rtl">
        {/* کارت بدنه فرم */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex flex-wrap gap-4">
            {["main", "items", "time", "attachments", "terms", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "main" && "اطلاعات اصلی"}
                {tab === "items" && "اقلام الحاقیه"}
                {tab === "time" && "اسناد و پیوست‌ها"}
                {tab === "attachments" && "ضوابط و شرایط"}
                {tab === "terms" && "تاریخچه تغییرات"}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
                
                {/* ستون راست - مشخصات الحاقیه */}
                <div className="space-y-4">
                  <Field label="شماره الحاقیه">
                    <Input
                      type="text"
                      value={form.addendum_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, addendum_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono font-bold"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="شماره قرارداد">
                    <select
                      value={form.contract_id}
                      onChange={(e) => handleContractChange(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="">انتخاب قرارداد</option>
                      {contracts.map((c) => (
                        <option key={c._id} value={c._id}>{c.contract_number} ({c.title})</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="عنوان قرارداد">
                    <Input
                      type="text"
                      value={form.contract_title}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="طرف قرارداد">
                    <Input
                      type="text"
                      value={form.contractor_name}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="موضوع الحاقیه">
                    <select
                      value={form.addendum_subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, addendum_subject: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {ADDENDUM_SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="نوع الحاقیه">
                    <select
                      value={form.addendum_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, addendum_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {ADDENDUM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تاریخ الحاقیه" required>
                    <PersianDatePicker
                      value={form.addendum_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, addendum_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="شماره نامه / مصوبه">
                    <Input
                      type="text"
                      value={form.approval_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, approval_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="تاریخ نامه / مصوبه">
                    <PersianDatePicker
                      value={form.approval_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, approval_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="وضعیت">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="ثبت شده">ثبت شده</option>
                      <option value="تایید شده">تایید شده</option>
                      <option value="پیش‌نویس">پیش‌نویس</option>
                    </select>
                  </Field>
                </div>

                {/* ستون چپ - توضیحات و مبالغ الحاقیه */}
                <div className="space-y-4">
                  <Field label="شرح الحاقیه">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="توضیحات پیرامون اهداف الحاقیه..."
                    />
                  </Field>

                  <Field label="مبنای الحاقیه">
                    <select
                      value={form.addendum_base}
                      onChange={(e) => setForm((prev) => ({ ...prev, addendum_base: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {ADDENDUM_BASES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="درصد تغییر مبلغ">
                      <Input
                        type="text"
                        value={`${form.amount_change_percent} %`}
                        readOnly
                        className="h-9 text-xs text-center font-mono bg-background/50 font-bold text-amber-600"
                        dir="ltr"
                      />
                    </Field>
                    <Field label="درصد تغییر مدت">
                      <Input
                        type="text"
                        value={`${form.duration_change_percent} %`}
                        readOnly
                        className="h-9 text-xs text-center font-mono bg-background/50 font-bold text-amber-600"
                        dir="ltr"
                      />
                    </Field>
                  </div>

                  <div className="border border-border/80 p-3 rounded-lg bg-muted/10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="مبلغ اولیه قرارداد">
                        <Input
                          type="text"
                          value={Number(form.initial_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50"
                        />
                      </Field>
                      <Field label="جمع الحاقیه‌های قبلی">
                        <Input
                          type="text"
                          value={Number(form.prev_addenda_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50"
                        />
                      </Field>
                      <Field label="مبلغ این الحاقیه">
                        <Input
                          type="text"
                          value={Number(form.addendum_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50 text-blue-600 font-bold"
                        />
                      </Field>
                      <Field label="جمع مبلغ قرارداد از الحاقیه">
                        <Input
                          type="text"
                          value={Number(form.new_total_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50 font-bold"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="border border-border/80 p-3 rounded-lg bg-muted/10 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="مدت اولیه قرارداد (روز)">
                        <Input
                          type="text"
                          value={form.initial_duration || 0}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50"
                        />
                      </Field>
                      <Field label="جمع تمدیدهای قبلی (روز)">
                        <Input
                          type="text"
                          value={form.prev_duration_extensions || 0}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50"
                        />
                      </Field>
                      <Field label="مدت این الحاقیه (روز)">
                        <Input
                          type="text"
                          value={form.addendum_duration || 0}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50 text-blue-600 font-bold"
                        />
                      </Field>
                      <Field label="مدت پس از الحاقیه (روز)">
                        <Input
                          type="text"
                          value={form.new_total_duration || 0}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50 font-bold"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab !== "main" && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 border rounded-lg border-dashed">
                اطلاعات این بخش در تب‌های پایین فرم و از طریق جداول تعاملی مدیریت می‌شوند.
              </div>
            )}
          </CardContent>
        </Card>

        {/* سه جدول پایین (تعدیل مدت، اقلام متمم، خلاصه وضعیت) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" dir="rtl">
          
          {/* جدول ۱: تعدیل مدت */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
              <span>تعدیل مدت</span>
              <Button onClick={addTimeRow} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px] h-7">
                <Plus className="h-3 w-3" />
                جدید
              </Button>
            </div>
            <CardContent className="p-3">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-right text-xs py-2">شرح</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">از تاریخ</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">تا تاریخ</TableHead>
                      <TableHead className="text-center text-xs py-2 w-16">مدت (روز)</TableHead>
                      <TableHead className="text-center text-xs py-2 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.time_adjustments.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-[11px] py-1 text-center">{idx + 1}</TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleTimeAdjustmentChange(idx, "description", e.target.value)}
                            className="h-8 text-[11px] text-right border-none shadow-none focus-visible:ring-1"
                            placeholder="علت تمدید"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <PersianDatePicker
                            value={item.from_date}
                            onChange={(e) => handleTimeAdjustmentChange(idx, "from_date", e.target.value)}
                            className="h-8 text-[10px] p-1 pl-4"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <PersianDatePicker
                            value={item.to_date}
                            onChange={(e) => handleTimeAdjustmentChange(idx, "to_date", e.target.value)}
                            className="h-8 text-[10px] p-1 pl-4"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.duration_days}
                            onChange={(e) => handleTimeAdjustmentChange(idx, "duration_days", e.target.value)}
                            className="h-8 text-center font-mono text-[11px] border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTimeRow(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.time_adjustments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">ردیفی ثبت نشده است.</TableCell>
                      </TableRow>
                    )}
                    {form.time_adjustments.length > 0 && (
                      <TableRow className="bg-muted/20 font-bold">
                        <TableCell colSpan={4} className="text-left text-xs pr-4 font-bold">جمع کل:</TableCell>
                        <TableCell className="font-mono text-xs text-center text-blue-600 font-extrabold">{durationSum} روز</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* جدول ۲: اقلام مالی الحاقیه */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
              <span>اقلام مالی الحاقیه</span>
              <Button onClick={addFinancialRow} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px] h-7">
                <Plus className="h-3 w-3" />
                جدید
              </Button>
            </div>
            <CardContent className="p-3">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-right text-xs py-2">شرح</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">واحد</TableHead>
                      <TableHead className="text-center text-xs py-2 w-14">مقدار</TableHead>
                      <TableHead className="text-center text-xs py-2 w-24">بهای واحد</TableHead>
                      <TableHead className="text-center text-xs py-2 w-28">مبلغ کل</TableHead>
                      <TableHead className="text-center text-xs py-2 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.financial_items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-[11px] py-1 text-center">{idx + 1}</TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleFinancialItemChange(idx, "description", e.target.value)}
                            className="h-8 text-[11px] text-right border-none shadow-none focus-visible:ring-1"
                            placeholder="شرح کار"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <select
                            value={item.unit}
                            onChange={(e) => handleFinancialItemChange(idx, "unit", e.target.value)}
                            className="h-8 rounded border text-[11px] w-full text-right bg-transparent"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleFinancialItemChange(idx, "quantity", Number(e.target.value))}
                            className="h-8 text-center font-mono text-[11px] border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleFinancialItemChange(idx, "unit_price", Number(e.target.value))}
                            className="h-8 text-center font-mono text-[11px] border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-center text-blue-500 font-semibold">
                          {Number(item.total_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFinancialRow(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.financial_items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-4 text-muted-foreground">ردیفی ثبت نشده است.</TableCell>
                      </TableRow>
                    )}
                    {form.financial_items.length > 0 && (
                      <TableRow className="bg-muted/20 font-bold">
                        <TableCell colSpan={5} className="text-left text-xs pr-4 font-bold">جمع کل:</TableCell>
                        <TableCell className="font-mono text-xs text-center text-blue-600 font-extrabold">
                          {Number(financialSum).toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* خلاصه مبالغ */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10">
              خلاصه مبالغ
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-2 border-b pb-3">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">مبلغ اولیه قرارداد:</span>
                  <span className="font-mono font-semibold">{Number(form.initial_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">جمع الحاقیه‌های قبلی:</span>
                  <span className="font-mono font-semibold">{Number(form.prev_addenda_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-bold text-emerald-500">
                  <span>مبلغ این الحاقیه:</span>
                  <span className="font-mono">{Number(form.addendum_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-foreground border-t border-dashed">
                  <span>جمع کل پس از الحاقیه:</span>
                  <span className="font-mono text-blue-600">{Number(form.new_total_amount).toLocaleString()} ریال</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center py-0.5 font-bold text-amber-600">
                  <span>درصد تغییر مبلغ:</span>
                  <span className="font-mono">{form.amount_change_percent} %</span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-bold text-amber-600">
                  <span>درصد تغییر مدت:</span>
                  <span className="font-mono">{form.duration_change_percent} %</span>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* مودال جستجوی الحاقیه‌ها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست الحاقیه‌های قرارداد ثبت شده</span>
              <button onClick={() => setShowSearchModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border/80">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس شماره الحاقیه، شماره قرارداد، نام پیمانکار..."
                  className="h-9 pr-9 text-xs text-right w-full"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-right text-xs">ردیف</TableHead>
                      <TableHead className="text-center text-xs">شماره الحاقیه</TableHead>
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs">تاریخ الحاقیه</TableHead>
                      <TableHead className="text-center text-xs">مبلغ الحاقیه</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAddenda.map((a, idx) => (
                      <TableRow
                        key={a._id}
                        onClick={() => loadAddendumDetails(a)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{a.addendum_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{a.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{a.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{a.addendum_date}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(a.addendum_amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                            {a.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredAddenda.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">الحاقیه‌ای یافت نشد.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="border-t border-border/80 p-3 bg-muted/10 flex justify-end">
              <Button onClick={() => setShowSearchModal(false)} variant="outline" size="sm" className="text-xs h-8">بستن</Button>
            </div>
          </Card>
        </div>
      )}

    </PageShell>
  );
}
