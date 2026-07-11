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
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

const SUPPLEMENT_TYPES = [
  "افزایش مبلغ و تمدید مدت",
  "کاهش مبلغ و کاهش مدت",
  "افزایش مبلغ بدون تغییر مدت",
  "تمدید مدت بدون تغییر مبلغ",
];

const SUPPLEMENT_SUBJECTS = ["افزایش حجمی", "کاهش مقادیر", "تمدید زمانی", "تغییر شرایط"];

const SUPPLEMENT_REASONS = [
  "افزایش حجم کار به دستور کارفرما",
  "تاخیر در تحویل کارگاه",
  "تغییر در مشخصات فنی",
  "حوادث قهریه و فورس ماژور",
  "سایر موارد",
];

const UNITS = ["متر مربع", "متر مکعب", "کیلوگرم", "نقطه", "عدد", "تن", "دستگاه"];

const INITIAL_FORM = {
  supplement_number: "",
  contract_id: "",
  contract_number: "",
  contract_title: "",
  employer_name: "",
  contractor_name: "",
  supplement_type: "افزایش مبلغ و تمدید مدت",
  supplement_date: "",
  approval_number: "",
  approval_date: "",
  status: "ثبت شده",

  supplement_subject: "افزایش حجمی",
  supplement_reason: "افزایش حجم کار به دستور کارفرما",
  description: "",
  remarks: "",

  initial_amount: 0,
  prev_supplements_amount: 0,
  supplement_amount: 0,
  new_total_amount: 0,

  initial_duration: 0,
  prev_duration_extensions: 0,
  supplement_duration: 0,
  new_total_duration: 0,

  financial_items: [
    { row_num: 1, description: "دیوارچینی اضافی", unit: "متر مربع", quantity: 250, unit_price: 1200000, total_amount: 300000000 },
    { row_num: 2, description: "کف سازی اضافی", unit: "متر مربع", quantity: 180, unit_price: 800000, total_amount: 144000000 },
    { row_num: 3, description: "سقف کاذب اضافی", unit: "متر مربع", quantity: 200, unit_price: 950000, total_amount: 190000000 },
  ],

  time_adjustments: [
    { row_num: 1, description: "تمدید به دلیل افزایش حجم کار", from_date: "1403/04/21", to_date: "1403/05/05", duration_days: 15 }
  ],
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

export default function ContractSupplementForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [supplementsList, setSupplementsList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("main");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await api.get("/api/contracts/");
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchSupplements = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-supplements");
      if (res.data?.success) {
        setSupplementsList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching supplements:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-supplements/suggest-number");
      if (res.data?.success && res.data.supplement_number) {
        setForm((prev) => ({ ...prev, supplement_number: res.data.supplement_number }));
      }
    } catch (err) {
      console.error("Error getting suggested supplement number:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchSupplements();
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
        employer_name: "",
        contractor_name: "",
        initial_amount: 0,
        prev_supplements_amount: 0,
        initial_duration: 0,
        prev_duration_extensions: 0,
      }));
      return;
    }

    // Sum all previous addenda/supplements from contract array
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
      employer_name: selectedContract.executive_agency || "ادارات کل راه و شهرسازی",
      contractor_name: selectedContract.contractor_name,
      initial_amount: initAmt,
      prev_supplements_amount: prevAmt,
      initial_duration: initDur,
      // Prefill description
      description: `با توجه به دستور کارفرما مبنی بر افزایش حجم عملیات موضوع قرارداد، افزایش مبلغ و تمدید مدت مورد توافق طرفین قرار گرفت.`,
    }));
  };

  // Compute sums from grids in real time
  const financialSum = useMemo(() => {
    return form.financial_items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
  }, [form.financial_items]);

  const durationSum = useMemo(() => {
    return form.time_adjustments.reduce((sum, item) => sum + (Number(item.duration_days) || 0), 0);
  }, [form.time_adjustments]);

  // Calculations for summaries
  const computedStats = useMemo(() => {
    const initAmt = Number(form.initial_amount || 0);
    const prevAmt = Number(form.prev_supplements_amount || 0);
    const currAmt = Number(financialSum || 0);

    const initDur = Number(form.initial_duration || 0);
    const prevDur = Number(form.prev_duration_extensions || 0);
    const currDur = Number(durationSum || 0);

    let newAmt = initAmt + prevAmt;
    let newDur = initDur + prevDur;

    if (form.supplement_type?.includes("کاهش")) {
      newAmt -= currAmt;
      newDur -= currDur;
    } else {
      newAmt += currAmt;
      newDur += currDur;
    }

    return {
      supplement_amount: currAmt,
      new_total_amount: newAmt,
      supplement_duration: currDur,
      new_total_duration: newDur,
    };
  }, [form.initial_amount, form.prev_supplements_amount, financialSum, form.initial_duration, form.prev_duration_extensions, durationSum, form.supplement_type]);

  // Sync computed stats into form state for saving
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      supplement_amount: computedStats.supplement_amount,
      new_total_amount: computedStats.new_total_amount,
      supplement_duration: computedStats.supplement_duration,
      new_total_duration: computedStats.new_total_duration,
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
    const { contract_id, supplement_number, supplement_type, supplement_date } = form;
    if (!contract_id || !supplement_number || !supplement_type || !supplement_date) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره متمم، نوع متمم و تاریخ) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-supplements/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات متمم با موفقیت بروزرسانی شد.");
          fetchSupplements();
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-supplements", form);
        if (res.data?.success) {
          alert("متمم قرارداد با موفقیت ثبت گردید.");
          fetchSupplements();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving supplement:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات متمم.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این متمم مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-supplements/${selectedId}`);
      if (res.data?.success) {
        alert("متمم حذف شد.");
        fetchSupplements();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting supplement:", err);
      alert(err.response?.data?.message || "خطا در حذف متمم.");
    }
  };

  const loadSupplementDetails = (sup) => {
    setSelectedId(sup._id);
    setForm({
      supplement_number: sup.supplement_number || "",
      contract_id: sup.contract_id || "",
      contract_number: sup.contract_number || "",
      contract_title: sup.contract_title || "",
      employer_name: sup.employer_name || "",
      contractor_name: sup.contractor_name || "",
      supplement_type: sup.supplement_type || "افزایش مبلغ و تمدید مدت",
      supplement_date: sup.supplement_date || "",
      approval_number: sup.approval_number || "",
      approval_date: sup.approval_date || "",
      status: sup.status || "ثبت شده",
      supplement_subject: sup.supplement_subject || "افزایش حجمی",
      supplement_reason: sup.supplement_reason || "",
      description: sup.description || "",
      remarks: sup.remarks || "",
      initial_amount: sup.initial_amount || 0,
      prev_supplements_amount: sup.prev_supplements_amount || 0,
      supplement_amount: sup.supplement_amount || 0,
      new_total_amount: sup.new_total_amount || 0,
      initial_duration: sup.initial_duration || 0,
      prev_duration_extensions: sup.prev_duration_extensions || 0,
      supplement_duration: sup.supplement_duration || 0,
      new_total_duration: sup.new_total_duration || 0,
      financial_items: sup.financial_items || [],
      time_adjustments: sup.time_adjustments || [],
    });
    setShowSearchModal(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>رسید متمم قرارداد - ${form.supplement_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>رسید ثبت متمم قرارداد</h2>
          <div class="grid">
            <div><strong>شماره متمم:</strong> ${form.supplement_number}</div>
            <div><strong>تاریخ متمم:</strong> ${form.supplement_date}</div>
            <div><strong>نوع متمم:</strong> ${form.supplement_type}</div>
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>کارفرما:</strong> ${form.employer_name}</div>
            <div><strong>پیمانکار:</strong> ${form.contractor_name}</div>
            <div><strong>مبلغ متمم:</strong> ${Number(form.supplement_amount).toLocaleString()} ریال</div>
            <div><strong>مدت تمدید:</strong> ${form.supplement_duration} روز</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredSupplements = supplementsList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.supplement_number || "").toLowerCase().includes(q) ||
      (s.contract_number || "").toLowerCase().includes(q) ||
      (s.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر ابزارهای فرم ثبت متمم قرارداد */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">📝</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت متمم قرارداد</h1>
            <p className="text-xs text-muted-foreground">ثبت تغییرات، افزایش و کاهش مقادیر کار و تمدیدهای زمانی قراردادها</p>
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
            جستجوی متمم
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

      <div className="grid grid-cols-1 gap-6" dir="rtl">
        {/* کارت بدنه فرم */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex flex-wrap gap-4">
            {["main", "items", "time", "attachments", "terms"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "main" && "اطلاعات اصلی"}
                {tab === "items" && "اقلام متمم"}
                {tab === "time" && "تعدیل مدت"}
                {tab === "attachments" && "اسناد و پیوست‌ها"}
                {tab === "terms" && "ضوابط و شرایط"}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
                
                {/* ستون راست - مشخصات متمم */}
                <div className="space-y-4">
                  <Field label="شماره متمم">
                    <Input
                      type="text"
                      value={form.supplement_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplement_number: e.target.value }))}
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

                  <Field label="کارفرما">
                    <Input
                      type="text"
                      value={form.employer_name}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="پیمانکار">
                    <Input
                      type="text"
                      value={form.contractor_name}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="نوع متمم">
                    <select
                      value={form.supplement_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplement_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {SUPPLEMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تاریخ متمم" required>
                    <PersianDatePicker
                      value={form.supplement_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplement_date: e.target.value }))}
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

                {/* ستون چپ - مبالغ و زمان */}
                <div className="space-y-4">
                  <Field label="موضوع متمم">
                    <select
                      value={form.supplement_subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplement_subject: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {SUPPLEMENT_SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="علت متمم">
                    <select
                      value={form.supplement_reason}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplement_reason: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {SUPPLEMENT_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="شرح متمم">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="توضیحات علل فنی متمم..."
                    />
                  </Field>

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
                      <Field label="جمع مبلغ متمم‌های قبلی">
                        <Input
                          type="text"
                          value={Number(form.prev_supplements_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50"
                        />
                      </Field>
                      <Field label="مبلغ این متمم">
                        <Input
                          type="text"
                          value={Number(form.supplement_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50 text-blue-600 font-bold"
                        />
                      </Field>
                      <Field label="مبلغ پس از این متمم">
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
                      <Field label="تمدید مدت این متمم (روز)">
                        <Input
                          type="text"
                          value={form.supplement_duration || 0}
                          readOnly
                          className="h-9 text-xs text-center font-mono bg-background/50 text-blue-600 font-bold"
                        />
                      </Field>
                      <Field label="مدت پس از این متمم (روز)">
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
          
          {/* جدول ۱: تعدیل مدت (تعداد روز) */}
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
                      <TableHead className="text-center text-xs py-2 w-16">تعداد روز</TableHead>
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
                            onChange={(e) => handleTimeAdjustmentChange(idx, "duration_days", Number(e.target.value))}
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

          {/* جدول ۲: اقلام مالی متمم (افزایش/کاهش مقادیر کارکرد) */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
              <span>اقلام مالی متمم</span>
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
                            placeholder="شرح کار اضافی"
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

          {/* خلاصه وضعیت متمم‌ها */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10">
              خلاصه وضعیت متمم‌ها
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-2 border-b pb-3">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">مبلغ اولیه قرارداد:</span>
                  <span className="font-mono font-semibold">{Number(form.initial_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">جمع متمم‌های قبلی:</span>
                  <span className="font-mono font-semibold">{Number(form.prev_supplements_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">مبلغ این متمم:</span>
                  <span className="font-mono font-semibold text-emerald-500">{Number(form.supplement_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center py-0.5 font-bold text-blue-600">
                  <span>جمع کل متمم‌ها:</span>
                  <span className="font-mono">{Number(Number(form.prev_supplements_amount) + Number(form.supplement_amount)).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-foreground border-t border-dashed">
                  <span>مبلغ پس از این متمم:</span>
                  <span className="font-mono text-blue-600">{Number(form.new_total_amount).toLocaleString()} ریال</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">مدت اولیه قرارداد:</span>
                  <span className="font-mono font-semibold">{form.initial_duration} روز</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-muted-foreground">جمع تمدیدهای قبلی:</span>
                  <span className="font-mono font-semibold">{form.prev_duration_extensions} روز</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-emerald-500">
                  <span>تمدید مدت این متمم:</span>
                  <span className="font-mono font-semibold">{form.supplement_duration} روز</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-foreground border-t border-dashed">
                  <span>مدت پس از این متمم:</span>
                  <span className="font-mono text-blue-600">{form.new_total_duration} روز</span>
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* بخش توضیحات */}
        <Card className="border-border/80 shadow-sm bg-muted/5">
          <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10 text-right">
            توضیحات
          </div>
          <CardContent className="p-3">
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="توضیحات تکمیلی پیرامون متمم..."
            />
          </CardContent>
        </Card>

      </div>

      {/* مودال جستجوی متمم‌ها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست متمم‌های قرارداد ثبت شده</span>
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
                  placeholder="جستجو بر اساس شماره متمم، شماره قرارداد، نام پیمانکار..."
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
                      <TableHead className="text-center text-xs">شماره متمم</TableHead>
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs">تاریخ متمم</TableHead>
                      <TableHead className="text-center text-xs">مبلغ متمم</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSupplements.map((s, idx) => (
                      <TableRow
                        key={s._id}
                        onClick={() => loadSupplementDetails(s)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{s.supplement_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{s.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{s.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{s.supplement_date}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(s.supplement_amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                            {s.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSupplements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">متممی یافت نشد.</TableCell>
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
