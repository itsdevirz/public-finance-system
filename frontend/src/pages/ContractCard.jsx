import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Printer, LogOut, CheckCircle2, Search, X, Undo2, Edit3, DollarSign, Calendar, FileText
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersianDatePicker, addDaysToJalali, diffDaysJalali } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

const CONTRACT_TYPES = ["پیمانکاری", "خرید خدمات", "خرید کالا", "مشاوره", "سایر"];
const DEVICES = ["ساختمان اداری مرکزی", "اداره کل راه و شهرسازی", "پروژه احداث جاده", "پروژه بیمارستان", "سایر"];
const EXECUTIVE_UNITS = ["اداره کل راه و شهرسازی", "معاونت توسعه و مدیریت منابع", "اداره پشتیبانی", "سایر"];
const LOCATIONS = ["تهران - منطقه 22", "تهران - منطقه 5", "البرز", "اصفهان", "سایر"];
const CREDIT_SOURCES = ["اعتبارات عمرانی", "اعتبارات جاری", "سایر"];
const EXPERTS = ["علی محمدی", "رضا احمدی", "مریم حسینی", "سایر"];
const REGISTRARS = ["مدیر سیستم", "کارشناس امور مالی", "سایر"];

const INITIAL_FORM = {
  card_number: "",
  contract_id: "",
  contract_number: "",
  contract_title: "",
  contractor_name: "",
  contract_type: "پیمانکاری",
  contract_subject: "",
  contract_amount: 0,
  duration_days: 0,
  start_date: "",
  end_date: "",
  status: "فعال",

  project_name: "ساختمان اداری مرکزی",
  executive_unit: "اداره کل راه و شهرسازی",
  execution_location: "تهران - منطقه 22",
  project_code: "",
  credit_source: "اعتبارات عمرانی",
  budget_code: "",
  contract_expert: "علی محمدی",
  registration_date: "",
  registered_by: "مدیر سیستم",
  remarks: "",

  financial_progress_percent: 0,
  remaining_amount: 0,
  total_paid: 0,

  latest_statement_number: "",
  latest_statement_date: "",
  latest_statement_amount: 0,
  latest_statement_progress_percent: 0,
};

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1 w-full text-right">
      <Label className="text-xs font-semibold text-muted-foreground text-right flex items-center justify-end gap-0.5">
        {required && <span className="text-destructive font-bold">*</span>}
        <span>{label}</span>
      </Label>
      {children}
    </div>
  );
}

export default function ContractCard() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [cardsList, setCardsList] = useState([]);
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

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-cards");
      if (res.data?.success) {
        setCardsList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching contract cards:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-cards/suggest-number");
      if (res.data?.success && res.data.card_number) {
        setForm((prev) => ({ ...prev, card_number: res.data.card_number }));
      }
    } catch (err) {
      console.error("Error getting suggested card number:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchCards();
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
        contract_amount: 0,
        duration_days: 0,
        start_date: "",
        end_date: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contract_title: selectedContract.title,
      contractor_name: selectedContract.contractor_name,
      contract_amount: Number(selectedContract.amount || 0),
      duration_days: Number(selectedContract.duration || 365),
      start_date: selectedContract.start_date || "",
      end_date: selectedContract.end_date || "",
      contract_subject: selectedContract.title || "",
    }));

    // Auto load total paid calculations for the summary card
    fetchPaidStats(selectedContract._id, Number(selectedContract.amount || 0));
  };

  const fetchPaidStats = async (contractId, amount) => {
    try {
      const res = await api.get("/api/contract-payments");
      if (res.data?.success) {
        const list = res.data.data || [];
        const filtered = list.filter((p) => p.contract_id === contractId);
        const total = filtered.reduce((sum, p) => sum + (Number(p.gross_amount) || 0), 0);
        const remaining = Math.max(0, amount - total);
        const percent = amount > 0 ? Math.min(100, Math.round((total / amount) * 100)) : 0;
        
        setForm((prev) => ({
          ...prev,
          total_paid: total,
          remaining_amount: remaining,
          financial_progress_percent: percent,
        }));
      }
    } catch (err) {
      console.error("Error fetching payment stats:", err);
    }
  };

  // Sync date duration
  const handleStartDateChange = (val) => {
    setForm((prev) => {
      const updated = { ...prev, start_date: val };
      if (val && prev.duration_days) {
        updated.end_date = addDaysToJalali(val, Number(prev.duration_days));
      }
      return updated;
    });
  };

  const handleEndDateChange = (val) => {
    setForm((prev) => {
      const updated = { ...prev, end_date: val };
      if (prev.start_date && val) {
        const diff = diffDaysJalali(prev.start_date, val);
        updated.duration_days = diff >= 0 ? diff : 0;
      }
      return updated;
    });
  };

  const handleDurationChange = (val) => {
    const duration = val === "" ? "" : (parseInt(val, 10) || 0);
    setForm((prev) => {
      const updated = { ...prev, duration_days: duration };
      if (prev.start_date && duration !== "") {
        updated.end_date = addDaysToJalali(prev.start_date, Number(duration));
      }
      return updated;
    });
  };

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    getSuggestedNumber();
    setActiveTab("main");
  };

  const handleSave = async () => {
    const { contract_id, card_number, registration_date } = form;
    if (!contract_id || !card_number || !registration_date) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره کارت و تاریخ ثبت) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        const res = await api.put(`/api/contract-cards/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات کارت قرارداد با موفقیت بروزرسانی شد.");
          fetchCards();
        }
      } else {
        const res = await api.post("/api/contract-cards", form);
        if (res.data?.success) {
          alert("کارت قرارداد با موفقیت ثبت گردید.");
          fetchCards();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving card:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات کارت قرارداد.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این کارت قرارداد مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-cards/${selectedId}`);
      if (res.data?.success) {
        alert("کارت قرارداد حذف شد.");
        fetchCards();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting card:", err);
      alert(err.response?.data?.message || "خطا در حذف کارت قرارداد.");
    }
  };

  const loadCardDetails = (card) => {
    setSelectedId(card._id);
    setForm({
      card_number: card.card_number || "",
      contract_id: card.contract_id || "",
      contract_number: card.contract_number || "",
      contract_title: card.contract_title || "",
      contractor_name: card.contractor_name || "",
      contract_type: card.contract_type || "پیمانکاری",
      contract_subject: card.contract_subject || "",
      contract_amount: card.contract_amount || 0,
      duration_days: card.duration_days || 0,
      start_date: card.start_date || "",
      end_date: card.end_date || "",
      status: card.status || "فعال",
      project_name: card.project_name || "ساختمان اداری مرکزی",
      executive_unit: card.executive_unit || "اداره کل راه و شهرسازی",
      execution_location: card.execution_location || "تهران - منطقه 22",
      project_code: card.project_code || "",
      credit_source: card.credit_source || "اعتبارات عمرانی",
      budget_code: card.budget_code || "",
      contract_expert: card.contract_expert || "علی محمدی",
      registration_date: card.registration_date || "",
      registered_by: card.registered_by || "مدیر سیستم",
      remarks: card.remarks || "",
      financial_progress_percent: card.financial_progress_percent || 0,
      remaining_amount: card.remaining_amount || 0,
      total_paid: card.total_paid || 0,
      latest_statement_number: card.latest_statement_number || "",
      latest_statement_date: card.latest_statement_date || "",
      latest_statement_amount: card.latest_statement_amount || 0,
      latest_statement_progress_percent: card.latest_statement_progress_percent || 0,
    });
    setShowSearchModal(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>شناسنامه کارت قرارداد - ${form.card_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>کارت شناسنامه ثبت شده قرارداد</h2>
          <div class="grid">
            <div><strong>شماره کارت:</strong> ${form.card_number}</div>
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>پیمانکار:</strong> ${form.contractor_name}</div>
            <div><strong>مبلغ قرارداد:</strong> ${Number(form.contract_amount).toLocaleString()} ریال</div>
            <div><strong>پروژه:</strong> ${form.project_name}</div>
            <div><strong>تاریخ ثبت:</strong> ${form.registration_date}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredCards = cardsList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.card_number || "").toLowerCase().includes(q) ||
      (c.contract_number || "").toLowerCase().includes(q) ||
      (c.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر ابزارهای فرم ثبت کارت قرارداد */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">🪪</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت کارت قرارداد</h1>
            <p className="text-xs text-muted-foreground">ثبت شناسنامه، تخصیص بودجه و اطلاعات فیزیکی و مالی قراردادها</p>
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
            جستجوی کارت
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
              <p className="text-xs opacity-90 mt-0.5">برای ثبت کارت قرارداد، ابتدا باید حداقل یک قرارداد در سیستم تعریف و ثبت شده باشد.</p>
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
            {["main", "extra", "terms", "attachments", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "main" && "اطلاعات اصلی"}
                {tab === "extra" && "اطلاعات تکمیلی"}
                {tab === "terms" && "شرایط و تعهدات"}
                {tab === "attachments" && "اسناد و پیوست‌ها"}
                {tab === "history" && "تاریخچه"}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
                
                {/* ستون راست - مشخصات قرارداد */}
                <div className="space-y-4">
                  <Field label="شماره کارت قرارداد">
                    <Input
                      type="text"
                      value={form.card_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, card_number: e.target.value }))}
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
                      <option value="">انتخاب قرارداد...</option>
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

                  <Field label="نوع قرارداد">
                    <select
                      value={form.contract_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, contract_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {CONTRACT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="موضوع قرارداد">
                    <Input
                      type="text"
                      value={form.contract_subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, contract_subject: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </Field>

                  <Field label="مبلغ قرارداد">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.contract_amount || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, contract_amount: Number(e.target.value) }))}
                        className="h-9 text-sm pl-8 font-mono text-center font-bold"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="مدت قرارداد (روز)">
                    <Input
                      type="number"
                      value={form.duration_days || ""}
                      onChange={(e) => handleDurationChange(e.target.value)}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="تاریخ شروع قرارداد">
                    <PersianDatePicker
                      value={form.start_date}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                  </Field>

                  <Field label="تاریخ پایان قرارداد">
                    <PersianDatePicker
                      value={form.end_date}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                    />
                  </Field>

                  <Field label="وضعیت کارت قرارداد">
                    <select
                      value={form.status}
                      onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="فعال">فعال</option>
                      <option value="غیرفعال">غیرفعال</option>
                      <option value="خاتمه یافته">خاتمه یافته</option>
                    </select>
                  </Field>
                </div>

                {/* ستون چپ - اطلاعات فیزیکی و بودجه */}
                <div className="space-y-4">
                  <Field label="دستگاه/پروژه">
                    <select
                      value={form.project_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, project_name: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {DEVICES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="واحد اجرایی">
                    <select
                      value={form.executive_unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, executive_unit: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {EXECUTIVE_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="محل اجرا">
                    <select
                      value={form.execution_location}
                      onChange={(e) => setForm((prev) => ({ ...prev, execution_location: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {LOCATIONS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="کد پروژه">
                    <Input
                      type="text"
                      value={form.project_code}
                      onChange={(e) => setForm((prev) => ({ ...prev, project_code: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="منبع تامین اعتبار">
                    <select
                      value={form.credit_source}
                      onChange={(e) => setForm((prev) => ({ ...prev, credit_source: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {CREDIT_SOURCES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="کد بودجه">
                    <Input
                      type="text"
                      value={form.budget_code}
                      onChange={(e) => setForm((prev) => ({ ...prev, budget_code: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="کارشناس قرارداد">
                    <select
                      value={form.contract_expert}
                      onChange={(e) => setForm((prev) => ({ ...prev, contract_expert: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {EXPERTS.map((ex) => (
                        <option key={ex} value={ex}>{ex}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تاریخ ثبت کارت">
                    <PersianDatePicker
                      value={form.registration_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, registration_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="ثبت کننده">
                    <select
                      value={form.registered_by}
                      onChange={(e) => setForm((prev) => ({ ...prev, registered_by: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {REGISTRARS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="توضیحات">
                    <textarea
                      value={form.remarks}
                      onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="توضیحات تکمیلی پیرامون کارت قرارداد..."
                    />
                  </Field>
                </div>

              </div>
            )}

            {activeTab !== "main" && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 border rounded-lg border-dashed">
                اطلاعات این بخش در صفحات تکمیلی و از طریق پرونده فیزیکی و مالی قرارداد مدیریت می‌شود.
              </div>
            )}
          </CardContent>
        </Card>

        {/* بخش پایین: خلاصه مالی قرارداد */}
        <div className="space-y-2 text-right shrink-0" dir="rtl">
          <span className="text-xs font-bold text-foreground pr-1">خلاصه مالی قرارداد</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <Card className="border-border/80 shadow-sm text-right bg-card p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">درصد پیشرفت مالی</span>
                <span className="font-mono text-sm font-bold text-amber-500">{form.financial_progress_percent} %</span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <span className="text-sm font-bold">%</span>
              </div>
            </Card>

            <Card className="border-border/80 shadow-sm text-right bg-card p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">باقیمانده قرارداد</span>
                <span className="font-mono text-sm font-bold text-blue-500">{Number(form.remaining_amount || 0).toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ریال</span></span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-bold">
                ریال
              </div>
            </Card>

            <Card className="border-border/80 shadow-sm text-right bg-card p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">جمع پرداختی‌ها</span>
                <span className="font-mono text-sm font-bold text-emerald-500">{Number(form.total_paid || 0).toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ریال</span></span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">
                ریال
              </div>
            </Card>

            <Card className="border-border/80 shadow-sm text-right bg-card p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">مبلغ قرارداد</span>
                <span className="font-mono text-sm font-bold text-foreground">{Number(form.contract_amount || 0).toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ریال</span></span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </Card>

          </div>
        </div>

        {/* بخش پایین: آخرین صورت وضعیت */}
        <div className="space-y-2 text-right shrink-0" dir="rtl">
          <span className="text-xs font-bold text-foreground pr-1">آخرین صورت وضعیت</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            
            <div className="flex flex-col gap-1 w-full text-right bg-card border rounded-lg p-2 h-14 justify-center">
              <span className="text-[10px] text-muted-foreground block mb-0.5">درصد پیشرفت</span>
              <div className="flex items-center gap-1.5" dir="ltr">
                <span className="text-[10px] text-muted-foreground">%</span>
                <input
                  type="number"
                  value={form.latest_statement_progress_percent || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, latest_statement_progress_percent: Number(e.target.value) }))}
                  className="w-full bg-transparent border-none text-center font-mono font-semibold text-sm focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full text-right bg-card border rounded-lg p-2 h-14 justify-center">
              <span className="text-[10px] text-muted-foreground block mb-0.5">مبلغ صورت وضعیت</span>
              <div className="flex items-center gap-1.5" dir="ltr">
                <span className="text-[10px] text-muted-foreground">ریال</span>
                <input
                  type="number"
                  value={form.latest_statement_amount || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, latest_statement_amount: Number(e.target.value) }))}
                  className="w-full bg-transparent border-none text-center font-mono font-semibold text-sm focus-visible:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full text-right bg-card border rounded-lg p-2 h-14 justify-center">
              <span className="text-[10px] text-muted-foreground block mb-0.5">تاریخ صورت وضعیت</span>
              <PersianDatePicker
                value={form.latest_statement_date}
                onChange={(e) => setForm((prev) => ({ ...prev, latest_statement_date: e.target.value }))}
                className="h-8 text-[11px] p-1 text-center font-mono border-none bg-transparent shadow-none"
              />
            </div>

            <div className="flex flex-col gap-1 w-full text-right bg-card border rounded-lg p-2 h-14 justify-center">
              <span className="text-[10px] text-muted-foreground block mb-0.5">شماره صورت وضعیت</span>
              <input
                type="text"
                value={form.latest_statement_number || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, latest_statement_number: e.target.value }))}
                className="w-full bg-transparent border-none text-center font-mono font-semibold text-sm focus-visible:outline-none"
                dir="ltr"
              />
            </div>

          </div>
        </div>

      </div>

      {/* مودال جستجوی کارت‌های قرارداد */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست کارت‌های قرارداد ثبت شده</span>
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
                  placeholder="جستجو بر اساس شماره کارت، شماره قرارداد، نام پیمانکار..."
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
                      <TableHead className="text-center text-xs">شماره کارت</TableHead>
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs">پروژه</TableHead>
                      <TableHead className="text-center text-xs">مبلغ قرارداد</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCards.map((c, idx) => (
                      <TableRow
                        key={c._id}
                        onClick={() => loadCardDetails(c)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{c.card_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{c.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{c.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs">{c.project_name}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(c.contract_amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                            {c.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">کارتی یافت نشد.</TableCell>
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
