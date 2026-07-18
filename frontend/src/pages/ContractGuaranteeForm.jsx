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

const GUARANTEE_TYPES = ["ضمانت انجام تعهدات", "ضمانت پیش‌پرداخت", "ضمانت حسن انجام کار", "سایر"];
const ISSUING_BANKS = ["بانک ملت", "بانک ملی", "بانک تجارت", "بانک صادرات", "بانک سپه"];
const CREDIT_TYPES = ["ریالی", "ارزی"];
const RENEWAL_STATUSES = ["نیاز به تمدید ندارد", "نیاز به تمدید دارد", "تمدید شده"];
const STATUSES = ["فعال", "منقضی شده", "ابطال شده", "ضبط شده"];

const INITIAL_FORM = {
  guarantee_number: "",
  guarantee_type: "ضمانت انجام تعهدات",
  contract_id: "",
  contract_number: "",
  contractor_name: "",
  contract_title: "",
  amount: 0,
  percent_of_contract: 0,
  status: "فعال",

  issuer_guarantee_number: "",
  issuing_bank: "بانک ملت",
  branch: "",
  issue_date: "",
  expiry_date: "",
  duration_days: 183,
  credit_type: "ریالی",
  renewal_status: "نیاز به تمدید ندارد",
  description: "",
  remarks: "این ضمانتنامه در وجه کارفرما و قابل تمدید می‌باشد.",

  renewals: [],
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

export default function ContractGuaranteeForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [guaranteesList, setGuaranteesList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("main");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // New renewal state for inline adding
  const [newRenewal, setNewRenewal] = useState({ num: "", date: "", newExpiry: "", duration: 30, status: "فعال" });
  const [showAddRenewalForm, setShowAddRenewalForm] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await api.get("/api/contracts");
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchGuarantees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-guarantees");
      if (res.data?.success) {
        setGuaranteesList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching guarantees:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-guarantees/suggest-number");
      if (res.data?.success && res.data.guarantee_number) {
        setForm((prev) => ({ ...prev, guarantee_number: res.data.guarantee_number }));
      }
    } catch (err) {
      console.error("Error getting suggested guarantee number:", err);
    }
  };

  const [guaranteeTypes, setGuaranteeTypes] = useState([]);

  const fetchGuaranteeTypes = async () => {
    try {
      const res = await api.get("/api/guarantee-types");
      if (res.data?.success) {
        setGuaranteeTypes(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching guarantee types:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchGuarantees();
    getSuggestedNumber();
    fetchGuaranteeTypes();
  }, []);

  const handleContractChange = (contractId) => {
    const selectedContract = contracts.find((c) => c._id === contractId);
    if (!selectedContract) {
      setForm((prev) => ({
        ...prev,
        contract_id: "",
        contract_number: "",
        contractor_name: "",
        contract_title: "",
        percent_of_contract: 0,
      }));
      return;
    }

    const pct = Number(selectedContract.amount) > 0 ? ((Number(form.amount || 0) / Number(selectedContract.amount)) * 100).toFixed(2) : 0;

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contractor_name: selectedContract.contractor_name,
      contract_title: selectedContract.title,
      percent_of_contract: Number(pct),
    }));
  };

  // Recalculate percent of contract when amount changes
  const computedPercent = useMemo(() => {
    if (!form.contract_id || !form.amount) return 0;
    const selectedContract = contracts.find((c) => c._id === form.contract_id);
    if (!selectedContract || !selectedContract.amount) return 0;
    return ((Number(form.amount) / Number(selectedContract.amount)) * 100).toFixed(1);
  }, [form.amount, form.contract_id, contracts]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      percent_of_contract: Number(computedPercent),
    }));
  }, [computedPercent]);

  // Filter guarantees related to selected contract
  const relatedGuarantees = useMemo(() => {
    if (!form.contract_id) return [];
    return guaranteesList.filter((g) => g.contract_id === form.contract_id);
  }, [form.contract_id, guaranteesList]);

  const relatedSum = useMemo(() => {
    return relatedGuarantees.reduce((sum, g) => sum + Number(g.amount || 0), 0);
  }, [relatedGuarantees]);

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    getSuggestedNumber();
    setActiveTab("main");
  };

  const handleSave = async () => {
    const { contract_id, guarantee_number, guarantee_type, amount, issue_date, expiry_date } = form;
    if (!contract_id || !guarantee_number || !guarantee_type || !amount || !issue_date || !expiry_date) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره ضمانت‌نامه، مبلغ، تاریخ صدور و انقضا) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-guarantees/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات ضمانت‌نامه با موفقیت بروزرسانی شد.");
          fetchGuarantees();
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-guarantees", form);
        if (res.data?.success) {
          alert("ضمانت‌نامه با موفقیت ثبت شد.");
          fetchGuarantees();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving guarantee:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات ضمانت‌نامه.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این ضمانت‌نامه مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-guarantees/${selectedId}`);
      if (res.data?.success) {
        alert("ضمانت‌نامه حذف شد.");
        fetchGuarantees();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting guarantee:", err);
      alert(err.response?.data?.message || "خطا در حذف ضمانت‌نامه.");
    }
  };

  const loadGuaranteeDetails = (guar) => {
    setSelectedId(guar._id);
    setForm({
      guarantee_number: guar.guarantee_number || "",
      guarantee_type: guar.guarantee_type || "ضمانت انجام تعهدات",
      contract_id: guar.contract_id || "",
      contract_number: guar.contract_number || "",
      contractor_name: guar.contractor_name || "",
      contract_title: guar.contract_title || "",
      amount: guar.amount || 0,
      percent_of_contract: guar.percent_of_contract || 0,
      status: guar.status || "فعال",
      issuer_guarantee_number: guar.issuer_guarantee_number || "",
      issuing_bank: guar.issuing_bank || "بانک ملت",
      branch: guar.branch || "",
      issue_date: guar.issue_date || "",
      expiry_date: guar.expiry_date || "",
      duration_days: guar.duration_days || 183,
      credit_type: guar.credit_type || "ریالی",
      renewal_status: guar.renewal_status || "نیاز به تمدید ندارد",
      description: guar.description || "",
      remarks: guar.remarks || "",
      renewals: guar.renewals || [],
    });
    setShowSearchModal(false);
  };

  const addRenewal = () => {
    if (!newRenewal.num || !newRenewal.date || !newRenewal.newExpiry) return;
    const item = {
      row_num: form.renewals.length + 1,
      renewal_number: newRenewal.num,
      renewal_date: newRenewal.date,
      new_expiry_date: newRenewal.newExpiry,
      duration_days: Number(newRenewal.duration),
      status: newRenewal.status,
    };
    setForm((prev) => ({
      ...prev,
      renewals: [...(prev.renewals || []), item],
      expiry_date: newRenewal.newExpiry, // update expiry date to new expiry
    }));
    setNewRenewal({ num: "", date: "", newExpiry: "", duration: 30, status: "فعال" });
    setShowAddRenewalForm(false);
  };

  const deleteRenewal = (idx) => {
    setForm((prev) => {
      const list = prev.renewals.filter((_, i) => i !== idx).map((item, i) => ({
        ...item,
        row_num: i + 1,
      }));
      return { ...prev, renewals: list };
    });
  };

  const handleIssueDateChange = (newDate) => {
    setForm((prev) => {
      const updated = { ...prev, issue_date: newDate };
      if (newDate && prev.duration_days) {
        updated.expiry_date = addDaysToJalali(newDate, Number(prev.duration_days));
      }
      return updated;
    });
  };

  const handleDurationChange = (newDurationVal) => {
    const duration = newDurationVal === "" ? "" : (parseInt(newDurationVal, 10) || 0);
    setForm((prev) => {
      const updated = { ...prev, duration_days: duration };
      if (prev.issue_date && duration !== "") {
        updated.expiry_date = addDaysToJalali(prev.issue_date, Number(duration));
      }
      return updated;
    });
  };

  const handleExpiryDateChange = (newExpiryDate) => {
    setForm((prev) => {
      const updated = { ...prev, expiry_date: newExpiryDate };
      if (prev.issue_date && newExpiryDate) {
        const diff = diffDaysJalali(prev.issue_date, newExpiryDate);
        updated.duration_days = diff >= 0 ? diff : 0;
      }
      return updated;
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>رسید ضمانت‌نامه - ${form.guarantee_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>اطلاعات ضمانت‌نامه ثبت شده</h2>
          <div class="grid">
            <div><strong>شماره ضمانت‌نامه:</strong> ${form.guarantee_number}</div>
            <div><strong>نوع ضمانت:</strong> ${form.guarantee_type}</div>
            <div><strong>بانک صادرکننده:</strong> ${form.issuing_bank} - شعبه ${form.branch || "-"}</div>
            <div><strong>مبلغ ضمانت‌نامه:</strong> ${Number(form.amount).toLocaleString()} ریال</div>
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>طرف قرارداد:</strong> ${form.contractor_name}</div>
            <div><strong>تاریخ صدور:</strong> ${form.issue_date}</div>
            <div><strong>تاریخ انقضاء:</strong> ${form.expiry_date}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredGuarantees = guaranteesList.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      (g.guarantee_number || "").toLowerCase().includes(q) ||
      (g.contract_number || "").toLowerCase().includes(q) ||
      (g.contractor_name || "").toLowerCase().includes(q) ||
      (g.guarantee_type || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر ابزارهای فرم ثبت ضمانت‌نامه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت ضمانت‌نامه</h1>
            <p className="text-xs text-muted-foreground">ثبت، پیگیری و مدیریت ضمانت‌نامه‌های حسن انجام تعهدات و پیش‌پرداخت</p>
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
            جستجوی ضمانت‌نامه
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
              <p className="text-xs opacity-90 mt-0.5">برای ثبت ضمانت‌نامه، ابتدا باید حداقل یک قرارداد در سیستم تعریف و ثبت شده باشد.</p>
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
        {/* بدنه فرم ضمانت نامه */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex flex-wrap gap-4">
            {["main", "guarantor", "attachments", "renewals", "notes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "main" && "اطلاعات اصلی"}
                {tab === "guarantor" && "اطلاعات ضامن"}
                {tab === "attachments" && "پیوست‌ها"}
                {tab === "renewals" && "سابقه تمدید"}
                {tab === "notes" && "یادداشت‌ها"}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
                
                {/* ستون راست - اطلاعات ضمانت‌نامه */}
                <div className="space-y-4">
                  <Field label="شماره ضمانت‌نامه">
                    <Input
                      type="text"
                      value={form.guarantee_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, guarantee_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono font-bold"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="نوع ضمانت">
                    <select
                      value={form.guarantee_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, guarantee_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right font-medium"
                    >
                      <option value="">انتخاب نوع ضمانت...</option>
                      {guaranteeTypes.map((t) => (
                        <option key={t._id} value={t.title}>{t.title}</option>
                      ))}
                      {guaranteeTypes.length === 0 && GUARANTEE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="شماره قرارداد">
                    <select
                      value={form.contract_id}
                      onChange={(e) => handleContractChange(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">انتخاب قرارداد</option>
                      {contracts.map((c) => (
                        <option key={c._id} value={c._id}>{c.contract_number} ({c.title})</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="طرف قرارداد">
                    <Input
                      type="text"
                      value={form.contractor_name}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="موضوع قرارداد">
                    <Input
                      type="text"
                      value={form.contract_title}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="مبلغ ضمانت‌نامه" required>
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.amount || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                        className="h-9 text-sm text-center font-mono pl-10"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="درصد از مبلغ قرارداد">
                    <div className="relative">
                      <Input
                        type="text"
                        value={form.percent_of_contract}
                        readOnly
                        className="h-9 text-sm text-center font-mono pl-7 bg-muted/50 text-muted-foreground"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
                    </div>
                  </Field>

                  <Field label="وضعیت">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* ستون چپ - بانک و تاریخ‌ها */}
                <div className="space-y-4">
                  <Field label="شماره ضمانت‌نامه نزد ضامن">
                    <Input
                      type="text"
                      value={form.issuer_guarantee_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, issuer_guarantee_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="بانک صادرکننده">
                    <select
                      value={form.issuing_bank}
                      onChange={(e) => setForm((prev) => ({ ...prev, issuing_bank: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {ISSUING_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="شعبه">
                    <Input
                      type="text"
                      value={form.branch}
                      onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </Field>

                  <Field label="تاریخ صدور" required>
                    <PersianDatePicker
                      value={form.issue_date}
                      onChange={(e) => handleIssueDateChange(e.target.value)}
                    />
                  </Field>

                  <Field label="تاریخ انقضاء" required>
                    <PersianDatePicker
                      value={form.expiry_date}
                      onChange={(e) => handleExpiryDateChange(e.target.value)}
                    />
                  </Field>

                  <Field label="مدت (روز)">
                    <Input
                      type="number"
                      value={form.duration_days}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="نوع اعتبار">
                    <select
                      value={form.credit_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, credit_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {CREDIT_TYPES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="وضعیت تمدید">
                    <select
                      value={form.renewal_status}
                      onChange={(e) => setForm((prev) => ({ ...prev, renewal_status: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {RENEWAL_STATUSES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="شرح">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="جزئیات تعهدات ضمانت‌نامه..."
                    />
                  </Field>
                </div>

              </div>
            )}

            {activeTab !== "main" && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 border rounded-lg border-dashed">
                اطلاعات تب پس از تکمیل فاز اصلی پیاده‌سازی فعال خواهد شد.
              </div>
            )}
          </CardContent>
        </Card>

        {/* بخش پایین: جدول ضمانت‌نامه‌ها + جدول سابقه تمدید */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
          
          {/* جدول ضمانت‌نامه‌های مرتبط با قرارداد */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right">
              اطلاعات ضمانت‌نامه‌های مرتبط با قرارداد
            </div>
            <CardContent className="p-3">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-right text-xs py-2">نوع ضمانت</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره ضمانت‌نامه</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ ضمانت‌نامه</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ انقضاء</TableHead>
                      <TableHead className="text-center text-xs py-2">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedGuarantees.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-[11px] py-2">{idx + 1}</TableCell>
                        <TableCell className="text-right text-[11px] py-2">{item.guarantee_type}</TableCell>
                        <TableCell className="text-center text-[11px] font-semibold font-mono py-2">{item.guarantee_number}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{Number(item.amount).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.expiry_date}</TableCell>
                        <TableCell className="text-center py-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold",
                            item.status === "فعال" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {relatedGuarantees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">ضمانت‌نامه‌ای یافت نشد.</TableCell>
                      </TableRow>
                    )}
                    {relatedGuarantees.length > 0 && (
                      <TableRow className="bg-muted/20 font-bold">
                        <TableCell colSpan={3} className="text-left text-xs pr-4 font-bold">جمع:</TableCell>
                        <TableCell className="font-mono text-xs text-center text-blue-600 font-extrabold">
                          {Number(relatedSum).toLocaleString()} ریال
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* جدول سابقه تمدید ضمانت‌نامه */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
              <span>اطلاعات تمدید ضمانت‌نامه</span>
              <Button onClick={() => setShowAddRenewalForm(!showAddRenewalForm)} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px] h-7">
                <Plus className="h-3 w-3" />
                جدید
              </Button>
            </div>
            <CardContent className="p-3 space-y-4">
              
              {/* فرم افزودن تمدید */}
              {showAddRenewalForm && (
                <div className="border p-3 rounded-lg bg-muted/10 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="شماره تمدید">
                      <Input
                        value={newRenewal.num}
                        onChange={(e) => setNewRenewal(prev => ({ ...prev, num: e.target.value }))}
                        className="h-8 text-xs text-center"
                        placeholder="مثلا: 9801234567-1"
                      />
                    </Field>
                    <Field label="مدت (روز)">
                      <Input
                        type="number"
                        value={newRenewal.duration}
                        onChange={(e) => setNewRenewal(prev => ({ ...prev, duration: e.target.value }))}
                        className="h-8 text-xs text-center"
                      />
                    </Field>
                    <Field label="تاریخ تمدید">
                      <PersianDatePicker
                        value={newRenewal.date}
                        onChange={(e) => setNewRenewal(prev => ({ ...prev, date: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </Field>
                    <Field label="تاریخ انقضاء جدید">
                      <PersianDatePicker
                        value={newRenewal.newExpiry}
                        onChange={(e) => setNewRenewal(prev => ({ ...prev, newExpiry: e.target.value }))}
                        className="h-8 text-xs"
                      />
                    </Field>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setShowAddRenewalForm(false)} variant="ghost" size="xs" className="text-xs">انصراف</Button>
                    <Button onClick={addRenewal} size="xs" className="text-xs bg-blue-600 text-white hover:bg-blue-700">ثبت تمدید</Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره تمدید</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ تمدید</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ انقضاء جدید</TableHead>
                      <TableHead className="text-center text-xs py-2">مدت (روز)</TableHead>
                      <TableHead className="text-center text-xs py-2 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.renewals || []).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-[11px] py-2">{idx + 1}</TableCell>
                        <TableCell className="text-center text-[11px] font-semibold py-2">{item.renewal_number}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.renewal_date}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.new_expiry_date}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.duration_days}</TableCell>
                        <TableCell className="text-center py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRenewal(idx)}
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(form.renewals || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">سابقه تمدیدی ثبت نشده است.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="text-[11px] text-muted-foreground text-left">
                جمع تمدیدها: {(form.renewals || []).length}
              </div>
            </CardContent>
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
            />
          </CardContent>
        </Card>

      </div>

      {/* مودال جستجوی ضمانت‌نامه‌ها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست ضمانت‌نامه‌های ثبت شده</span>
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
                  placeholder="جستجو بر اساس شماره ضمانت‌نامه، قرارداد، طرف قرارداد..."
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
                      <TableHead className="text-center text-xs">شماره ضمانت‌نامه</TableHead>
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">طرف قرارداد</TableHead>
                      <TableHead className="text-center text-xs">بانک صادرکننده</TableHead>
                      <TableHead className="text-center text-xs">مبلغ</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuarantees.map((g, idx) => (
                      <TableRow
                        key={g._id}
                        onClick={() => loadGuaranteeDetails(g)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{g.guarantee_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{g.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{g.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs">{g.issuing_bank}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(g.amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            g.status === "فعال" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {g.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredGuarantees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">ضمانت‌نامه‌ای یافت نشد.</TableCell>
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
