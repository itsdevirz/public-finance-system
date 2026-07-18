import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Edit, Search, Printer, LogOut, X, RefreshCw, CheckCircle2
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
import { cn } from "@/lib/utils";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case "پیش‌نویس":
      return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
    case "ثبت شده":
      return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    case "تایید شده":
      return "bg-purple-500/10 text-purple-500 border border-purple-500/20";
    case "در حال اجرا":
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    case "خاتمه یافته":
      return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    case "تسویه شده":
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    default:
      return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
  }
};

const PROJECT_LIST = [
  { value: "ساختمان اداری مرکزی", label: "ساختمان اداری مرکزی" },
  { value: "توسعه پارک فناوری", label: "توسعه پارک فناوری" },
  { value: "احداث خط لوله گاز", label: "احداث خط لوله گاز" },
];

const COST_CENTER_LIST = [
  { value: "مرکز هزینه عمرانی", label: "مرکز هزینه عمرانی" },
  { value: "مرکز هزینه پشتیبانی", label: "مرکز هزینه پشتیبانی" },
  { value: "مرکز هزینه کارگاه مرکزی", label: "مرکز هزینه کارگاه مرکزی" },
];

const CREDIT_SOURCE_LIST = [
  { value: "اعتبارات تملک دارایی های سرمایه ای", label: "اعتبارات تملک دارایی های سرمایه ای" },
  { value: "اعتبارات جاری استانی", label: "اعتبارات جاری استانی" },
  { value: "درآمدهای عمومی اختصاصی", label: "درآمدهای عمومی اختصاصی" },
];

const EXECUTIVE_AGENCY_LIST = [
  { value: "اداره کل راه و شهرسازی", label: "اداره کل راه و شهرسازی" },
  { value: "سازمان نوسازی مدارس", label: "سازمان نوسازی مدارس" },
  { value: "شرکت ملی گاز ایران", label: "شرکت ملی گاز ایران" },
];

const ASSIGNMENT_METHOD_LIST = [
  { value: "مناقصه عمومی", label: "مناقصه عمومی" },
  { value: "مناقصه محدود", label: "مناقصه محدود" },
  { value: "ترک تشریفات", label: "ترک تشریفات" },
  { value: "استعلام بها", label: "استعلام بها" },
];

const CURRENCY_LIST = [
  { value: "ریال", label: "ریال" },
  { value: "دلار آمریکا", label: "دلار آمریکا" },
  { value: "یورو", label: "یورو" },
];

const INITIAL_FORM = {
  contract_number: "",
  registration_number: "",
  contract_type: "پیمانکاری",
  title: "",
  contractor_name: "",
  executive_agency: "اداره کل راه و شهرسازی",
  requesting_unit: "واحد فنی و عمرانی",
  tender_number: "",
  assignment_method: "مناقصه عمومی",
  project: "ساختمان اداری مرکزی",
  cost_center: "مرکز هزینه عمرانی",
  credit_source: "اعتبارات تملک دارایی های سرمایه ای",
  signing_date: "",
  start_date: "",
  end_date: "",
  duration: 365,
  currency: "ریال",
  exchange_rate: 1,
  description: "",

  // Financial and Status fields
  amount: 0,
  increase_amount: 0,
  decrease_amount: 0,
  progress_percent: 0,
  status: "پیش‌نویس",

  // Guarantee fields
  guarantee_status: "معتبر",
  guarantee_expiry_date: "",
  last_statement: "",
  last_payment_date: "",

  // Sub-items
  payments: [],
  statements: [],
  addenda: [],
};

const TABS = [
  { value: "main", label: "اطلاعات اصلی" },
  { value: "financial", label: "اطلاعات مالی" },
  { value: "guarantees", label: "ضمانت‌نامه‌ها" },
  { value: "addenda", label: "متمم و الحاقیه" },
  { value: "statements", label: "صورت وضعیت" },
  { value: "payments", label: "پرداخت‌ها" },
];

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

export default function ContractRegistrationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [parties, setParties] = useState([]);
  const [contractsList, setContractsList] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("main");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Sub-items forms
  const [newPayment, setNewPayment] = useState({ date: "", gross: 0, deductions: 0, docNum: "" });
  const [newStatement, setNewStatement] = useState({ num: "", date: "", gross: 0, progress: 0, status: "در انتظار پرداخت" });
  const [newAddendum, setNewAddendum] = useState({ num: "", type: "افزایش", amount: 0, desc: "", date: "" });

  const fetchParties = async () => {
    try {
      const res = await api.get("/api/contract-parties");
      if (res.data?.success) {
        setParties(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching parties:", err);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contracts");
      setContractsList(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractTypes = async () => {
    try {
      const res = await api.get("/api/contract-types");
      if (res.data?.success) {
        setContractTypes(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching contract types:", err);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contracts/suggest-number");
      if (res.data?.success && res.data.contract_number) {
        setForm((prev) => ({ ...prev, contract_number: res.data.contract_number }));
      }
    } catch (err) {
      console.error("Error getting suggested contract number:", err);
    }
  };

  useEffect(() => {
    fetchParties();
    fetchContracts();
    getSuggestedNumber();
    fetchContractTypes();
  }, []);

  // Recalculate computed financial fields whenever sub-items change
  const computedStats = useMemo(() => {
    const amount = Number(form.amount || 0);

    // Addenda sums
    let increase_amount = 0;
    let decrease_amount = 0;
    (form.addenda || []).forEach((item) => {
      const val = Number(item.amount || 0);
      if (item.type === "افزایش") {
        increase_amount += val;
      } else if (item.type === "کاهش") {
        decrease_amount += val;
      }
    });

    const current_amount = amount + increase_amount - decrease_amount;

    // Payments sum
    let paid_amount = 0;
    (form.payments || []).forEach((p) => {
      paid_amount += Number(p.net_amount || 0);
    });

    const remaining_amount = Math.max(0, current_amount - paid_amount);
    const payment_percent = current_amount > 0 ? ((paid_amount / current_amount) * 100).toFixed(2) : "0.00";

    // Latest statement progress
    let progress_percent = Number(form.progress_percent || 0);
    let last_statement = form.last_statement || "";
    if ((form.statements || []).length > 0) {
      const sortedSt = [...form.statements].sort((a, b) => b.date.localeCompare(a.date));
      progress_percent = Number(sortedSt[0].progress_percent || 0);
      last_statement = sortedSt[0].statement_number || "";
    }

    // Last payment date
    let last_payment_date = form.last_payment_date || "";
    if ((form.payments || []).length > 0) {
      const sortedPay = [...form.payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date));
      last_payment_date = sortedPay[0].payment_date || "";
    }

    return {
      increase_amount,
      decrease_amount,
      current_amount,
      paid_amount,
      remaining_amount,
      payment_percent,
      progress_percent,
      last_statement,
      last_payment_date,
    };
  }, [form.amount, form.payments, form.statements, form.addenda]);

  const handleNew = () => {
    setForm({ ...INITIAL_FORM, amount: 0 });
    setSelectedId(null);
    getSuggestedNumber();
    setActiveTab("main");
  };

  const handleSave = async (andNew = false) => {
    const { contract_number, title, contractor_name, amount } = form;
    
    const errors = [];
    if (!contract_number) errors.push("شماره قرارداد (در تب اطلاعات اصلی)");
    if (!title || !title.trim()) errors.push("موضوع قرارداد (در تب اطلاعات اصلی)");
    if (!contractor_name) errors.push("طرف قرارداد (در تب اطلاعات اصلی - باید یک طرف قرارداد انتخاب کنید)");
    if (!amount || amount <= 0) errors.push("مبلغ اولیه قرارداد (در تب اطلاعات مالی)");

    if (errors.length > 0) {
      alert(`لطفاً فیلدهای الزامی زیر را پر یا اصلاح کنید:\n\n• ${errors.join("\n• ")}`);
      return;
    }

    // Extract year from contract number (e.g. 1403 from 1403-00025) or signing date
    let fiscal_year = 1403;
    const yearPart = parseInt(contract_number.split("-")[0]);
    if (!isNaN(yearPart) && yearPart > 1000 && yearPart < 2000) {
      fiscal_year = yearPart;
    }

    const payload = {
      ...form,
      fiscal_year,
      increase_amount: computedStats.increase_amount,
      decrease_amount: computedStats.decrease_amount,
      progress_percent: computedStats.progress_percent,
      last_statement: computedStats.last_statement,
      last_payment_date: computedStats.last_payment_date,
    };

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.patch(`/api/contracts/${selectedId}`, payload);
        if (res.status === 200) {
          alert("قرارداد با موفقیت بروزرسانی شد.");
          fetchContracts();
          if (andNew) handleNew();
        }
      } else {
        // Create mode
        const res = await api.post("/api/contracts", payload);
        if (res.status === 201) {
          alert("قرارداد با موفقیت ثبت شد.");
          fetchContracts();
          if (andNew) {
            handleNew();
          } else {
            setSelectedId(res.data.data._id);
          }
        }
      }
    } catch (err) {
      console.error("Error saving contract:", err);
      alert(err.response?.data?.message || "خطا در ثبت قرارداد.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این قرارداد مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contracts/${selectedId}`);
      if (res.status === 200) {
        alert("قرارداد حذف شد.");
        fetchContracts();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting contract:", err);
      alert(err.response?.data?.message || "خطا در حذف قرارداد.");
    }
  };

  const loadContractDetails = (contract) => {
    setSelectedId(contract._id);
    setForm({
      contract_number: contract.contract_number || "",
      registration_number: contract.registration_number || "",
      contract_type: contract.contract_type || "پیمانکاری",
      title: contract.title || "",
      contractor_name: contract.contractor_name || "",
      executive_agency: contract.executive_agency || "اداره کل راه و شهرسازی",
      requesting_unit: contract.requesting_unit || "واحد فنی و عمرانی",
      tender_number: contract.tender_number || "",
      assignment_method: contract.assignment_method || "مناقصه عمومی",
      project: contract.project || "ساختمان اداری مرکزی",
      cost_center: contract.cost_center || "مرکز هزینه عمرانی",
      credit_source: contract.credit_source || "اعتبارات تملک دارایی های سرمایه ای",
      signing_date: contract.signing_date || "",
      start_date: contract.start_date || "",
      end_date: contract.end_date || "",
      duration: contract.duration || 365,
      currency: contract.currency || "ریال",
      exchange_rate: contract.exchange_rate || 1,
      description: contract.description || "",
      amount: contract.amount || 0,
      increase_amount: contract.increase_amount || 0,
      decrease_amount: contract.decrease_amount || 0,
      progress_percent: contract.progress_percent || 0,
      status: contract.status || "پیش‌نویس",
      guarantee_status: contract.guarantee_status || "معتبر",
      guarantee_expiry_date: contract.guarantee_expiry_date || "",
      last_statement: contract.last_statement || "",
      last_payment_date: contract.last_payment_date || "",
      payments: contract.payments || [],
      statements: contract.statements || [],
      addenda: contract.addenda || [],
    });
    setShowSearchModal(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>خلاصه قرارداد - ${form.contract_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 12px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .item { border-bottom: 1px dashed #ccc; padding: 5px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>خلاصه اطلاعات قرارداد</h2>
          <div class="grid">
            <div class="item"><span class="label">شماره قرارداد:</span> ${form.contract_number}</div>
            <div class="item"><span class="label">موضوع قرارداد:</span> ${form.title}</div>
            <div class="item"><span class="label">طرف قرارداد:</span> ${form.contractor_name}</div>
            <div class="item"><span class="label">مبلغ اولیه:</span> ${Number(form.amount).toLocaleString()} ریال</div>
            <div class="item"><span class="label">مبلغ فعلی:</span> ${Number(computedStats.current_amount).toLocaleString()} ریال</div>
            <div class="item"><span class="label">مدت قرارداد:</span> ${form.duration} روز</div>
            <div class="item"><span class="label">تاریخ انعقاد:</span> ${form.signing_date || "-"}</div>
            <div class="item"><span class="label">وضعیت:</span> ${form.status}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add Payment
  const addPayment = () => {
    if (!newPayment.date || newPayment.gross <= 0) return;
    const net = Number(newPayment.gross) - Number(newPayment.deductions);
    const item = {
      payment_date: newPayment.date,
      gross_amount: Number(newPayment.gross),
      deductions: Number(newPayment.deductions),
      net_amount: net,
      document_number: newPayment.docNum,
    };
    setForm((prev) => ({
      ...prev,
      payments: [...(prev.payments || []), item],
    }));
    setNewPayment({ date: "", gross: 0, deductions: 0, docNum: "" });
  };

  // Add Progress Bill
  const addStatement = () => {
    if (!newStatement.num || !newStatement.date || newStatement.gross <= 0) return;
    const item = {
      statement_number: newStatement.num,
      date: newStatement.date,
      gross_amount: Number(newStatement.gross),
      progress_percent: Number(newStatement.progress),
      status: newStatement.status,
    };
    setForm((prev) => ({
      ...prev,
      statements: [...(prev.statements || []), item],
    }));
    setNewStatement({ num: "", date: "", gross: 0, progress: 0, status: "در انتظار پرداخت" });
  };

  // Add Addendum
  const addAddendum = () => {
    if (!newAddendum.num || newAddendum.amount <= 0) return;
    const item = {
      addendum_number: newAddendum.num,
      type: newAddendum.type,
      amount: Number(newAddendum.amount),
      description: newAddendum.desc,
      date: newAddendum.date,
    };
    setForm((prev) => ({
      ...prev,
      addenda: [...(prev.addenda || []), item],
    }));
    setNewAddendum({ num: "", type: "افزایش", amount: 0, desc: "", date: "" });
  };

  // Filtered list for search
  const filteredContracts = contractsList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.contract_number || "").toLowerCase().includes(q) ||
      (c.title || "").toLowerCase().includes(q) ||
      (c.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* دکمه‌های ابزار بالا دقیقا مشابه عکس */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">📄</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت قرارداد</h1>
            <p className="text-xs text-muted-foreground">مدیریت، پیگیری و ثبت اسناد پیمانکاری بخش عمومی</p>
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <X className="h-4 w-4 text-red-500" />
            انصراف
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(true)}
            className="gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            ذخیره و جدید
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave(false)}
            className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
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
            جستجوی قرارداد
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            جدید
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6" dir="rtl">
        {/* کارت فرم و تب‌ها */}
        <Card className="border-border/80 shadow-sm">
          {/* تب‌ها */}
          <div className="border-b border-border/80 px-4 py-1 bg-muted/20 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "text-xs font-bold pb-2 pt-2 px-3 transition-all",
                  activeTab === tab.value ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                
                {/* ستون راست (Right Column) */}
                <div className="space-y-4">
                  <Field label="شماره قرارداد">
                    <Input
                      type="text"
                      value={form.contract_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, contract_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="شماره ثبت">
                    <Input
                      type="text"
                      value={form.registration_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, registration_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                      placeholder="مثال: ۲۵/۱۴۰۳/۱۲"
                    />
                  </Field>

                  <Field label="نوع قرارداد" required>
                    <select
                      value={form.contract_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, contract_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="">انتخاب نوع قرارداد</option>
                      {contractTypes.map((t) => (
                        <option key={t._id} value={t.title}>{t.title}</option>
                      ))}
                      {contractTypes.length === 0 && (
                        <>
                          <option value="پیمانکاری">پیمانکاری</option>
                          <option value="خرید خدمات">خرید خدمات</option>
                          <option value="مشاوره">مشاوره</option>
                          <option value="خرید کالا">خرید کالا</option>
                        </>
                      )}
                    </select>
                  </Field>

                  <Field label="موضوع قرارداد" required>
                    <Input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="h-9 text-sm text-right"
                      placeholder="احداث ساختمان اداری و ..."
                    />
                  </Field>

                  <Field label="طرف قرارداد" required>
                    <select
                      value={form.contractor_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, contractor_name: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="">انتخاب طرف قرارداد</option>
                      {parties.map((p) => (
                        <option key={p._id} value={p.name}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="دستگاه اجرایی" required>
                    <select
                      value={form.executive_agency}
                      onChange={(e) => setForm((prev) => ({ ...prev, executive_agency: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {EXECUTIVE_AGENCY_LIST.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="واحد درخواست کننده">
                    <Input
                      type="text"
                      value={form.requesting_unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, requesting_unit: e.target.value }))}
                      className="h-9 text-sm text-right"
                    />
                  </Field>

                  <Field label="شماره مناقصه">
                    <Input
                      type="text"
                      value={form.tender_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, tender_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="روش واگذاری">
                    <select
                      value={form.assignment_method}
                      onChange={(e) => setForm((prev) => ({ ...prev, assignment_method: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {ASSIGNMENT_METHOD_LIST.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* ستون چپ (Middle Column) */}
                <div className="space-y-4">
                  <Field label="پروژه">
                    <select
                      value={form.project}
                      onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {PROJECT_LIST.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="مرکز هزینه">
                    <select
                      value={form.cost_center}
                      onChange={(e) => setForm((prev) => ({ ...prev, cost_center: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {COST_CENTER_LIST.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="منبع اعتبار">
                    <select
                      value={form.credit_source}
                      onChange={(e) => setForm((prev) => ({ ...prev, credit_source: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {CREDIT_SOURCE_LIST.map((cr) => (
                        <option key={cr.value} value={cr.value}>{cr.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تاریخ انعقاد" required>
                    <PersianDatePicker
                      value={form.signing_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, signing_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="تاریخ شروع" required>
                    <PersianDatePicker
                      value={form.start_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="تاریخ پایان" required>
                    <PersianDatePicker
                      value={form.end_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="مدت قرارداد (روز)">
                    <Input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm((prev) => ({ ...prev, duration: parseInt(e.target.value, 10) }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="نوع ارز" required>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {CURRENCY_LIST.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="نرخ ارز">
                    <Input
                      type="number"
                      value={form.exchange_rate}
                      onChange={(e) => setForm((prev) => ({ ...prev, exchange_rate: Number(e.target.value) }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>
                </div>

                {/* شرح قرارداد کامل عرض */}
                <div className="col-span-full mt-3">
                  <Field label="شرح قرارداد">
                    <Input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="h-9 text-sm text-right w-full"
                      placeholder="توضیحات تکمیلی پیرامون عملیات موضوع قرارداد..."
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeTab === "financial" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                <Field label="مبلغ اولیه قرارداد (ریال)" required>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    className="h-10 text-sm font-semibold font-mono text-center"
                    placeholder="مثال: ۵۰۰۰۰۰۰۰۰۰۰"
                  />
                </Field>
                <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg flex flex-col justify-center">
                  <p>• مبلغ قرارداد باید عددی بزرگتر از صفر باشد.</p>
                  <p className="mt-1">• پس از ذخیره‌سازی، این مبلغ به عنوان مبنای محاسبات مالی قرارداد در نظر گرفته خواهد شد.</p>
                </div>
              </div>
            )}

            {activeTab === "guarantees" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="وضعیت ضمانت">
                  <select
                    value={form.guarantee_status}
                    onChange={(e) => setForm((prev) => ({ ...prev, guarantee_status: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                  >
                    <option value="معتبر">معتبر</option>
                    <option value="منقضی شده">منقضی شده</option>
                    <option value="فاقد ضمانت">فاقد ضمانت</option>
                  </select>
                </Field>

                <Field label="تاریخ انقضای ضمانت">
                  <PersianDatePicker
                    value={form.guarantee_expiry_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, guarantee_expiry_date: e.target.value }))}
                  />
                </Field>
              </div>
            )}

            {activeTab === "addenda" && (
              <div className="space-y-6 text-right">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 border p-4 rounded-lg bg-muted/10">
                  <div className="sm:col-span-1">
                    <Field label="شماره الحاقیه">
                      <Input
                        type="text"
                        value={newAddendum.num}
                        onChange={(e) => setNewAddendum((prev) => ({ ...prev, num: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-1">
                    <Field label="نوع تغییر">
                      <select
                        value={newAddendum.type}
                        onChange={(e) => setNewAddendum((prev) => ({ ...prev, type: e.target.value }))}
                        className="h-9 w-full rounded border px-2 py-1 text-xs"
                      >
                        <option value="افزایش">افزایش</option>
                        <option value="کاهش">کاهش</option>
                      </select>
                    </Field>
                  </div>
                  <div className="sm:col-span-1">
                    <Field label="مبلغ تغییر">
                      <Input
                        type="number"
                        value={newAddendum.amount}
                        onChange={(e) => setNewAddendum((prev) => ({ ...prev, amount: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-1">
                    <Field label="تاریخ ثبت">
                      <PersianDatePicker
                        value={newAddendum.date}
                        onChange={(e) => setNewAddendum((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button onClick={addAddendum} className="h-9 w-full text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-3.5 w-3.5" />
                      افزودن الحاقیه
                    </Button>
                  </div>
                  <div className="sm:col-span-5">
                    <Field label="توضیحات">
                      <Input
                        type="text"
                        value={newAddendum.desc}
                        onChange={(e) => setNewAddendum((prev) => ({ ...prev, desc: e.target.value }))}
                        placeholder="شرح علت متمم یا الحاقیه"
                        className="h-9 text-xs w-full"
                      />
                    </Field>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-right text-xs">ردیف</TableHead>
                        <TableHead className="text-center text-xs">شماره الحاقیه</TableHead>
                        <TableHead className="text-center text-xs">نوع تغییر</TableHead>
                        <TableHead className="text-center text-xs">مبلغ</TableHead>
                        <TableHead className="text-center text-xs">تاریخ</TableHead>
                        <TableHead className="text-right text-xs">شرح</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(form.addenda || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">هیچ متمم یا الحاقیه‌ای ثبت نشده است.</TableCell>
                        </TableRow>
                      ) : (
                        (form.addenda || []).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{idx + 1}</TableCell>
                            <TableCell className="text-center text-xs font-semibold">{item.addendum_number}</TableCell>
                            <TableCell className="text-center text-xs">
                              <span className={cn("px-2 py-0.5 rounded text-[10px]", item.type === "افزایش" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                                {item.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono">{Number(item.amount).toLocaleString()} ریال</TableCell>
                            <TableCell className="text-center text-xs font-mono">{item.date}</TableCell>
                            <TableCell className="text-right text-xs">{item.description || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === "statements" && (
              <div className="space-y-6 text-right">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 border p-4 rounded-lg bg-muted/10">
                  <div>
                    <Field label="شماره صورت وضعیت">
                      <Input
                        type="text"
                        value={newStatement.num}
                        onChange={(e) => setNewStatement((prev) => ({ ...prev, num: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="تاریخ ثبت">
                      <PersianDatePicker
                        value={newStatement.date}
                        onChange={(e) => setNewStatement((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="مبلغ ناخالص (ریال)">
                      <Input
                        type="number"
                        value={newStatement.gross}
                        onChange={(e) => setNewStatement((prev) => ({ ...prev, gross: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="درصد پیشرفت">
                      <Input
                        type="number"
                        value={newStatement.progress}
                        onChange={(e) => setNewStatement((prev) => ({ ...prev, progress: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="وضعیت">
                      <select
                        value={newStatement.status}
                        onChange={(e) => setNewStatement((prev) => ({ ...prev, status: e.target.value }))}
                        className="h-9 w-full rounded border px-2 py-1 text-xs"
                      >
                        <option value="پرداخت شده">پرداخت شده</option>
                        <option value="در انتظار پرداخت">در انتظار پرداخت</option>
                      </select>
                    </Field>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addStatement} className="h-9 w-full text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-3.5 w-3.5" />
                      افزودن
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-right text-xs">ردیف</TableHead>
                        <TableHead className="text-center text-xs">شماره صورت وضعیت</TableHead>
                        <TableHead className="text-center text-xs">تاریخ</TableHead>
                        <TableHead className="text-center text-xs">مبلغ ناخالص</TableHead>
                        <TableHead className="text-center text-xs">درصد پیشرفت</TableHead>
                        <TableHead className="text-center text-xs">وضعیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(form.statements || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">هیچ صورت وضعیتی ثبت نشده است.</TableCell>
                        </TableRow>
                      ) : (
                        (form.statements || []).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{idx + 1}</TableCell>
                            <TableCell className="text-center text-xs font-semibold">{item.statement_number}</TableCell>
                            <TableCell className="text-center text-xs font-mono">{item.date}</TableCell>
                            <TableCell className="text-center text-xs font-mono">{Number(item.gross_amount).toLocaleString()} ریال</TableCell>
                            <TableCell className="text-center text-xs font-mono">{item.progress_percent}%</TableCell>
                            <TableCell className="text-center text-xs">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold",
                                item.status === "پرداخت شده" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                              )}>
                                {item.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-6 text-right">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 border p-4 rounded-lg bg-muted/10">
                  <div>
                    <Field label="تاریخ پرداخت">
                      <PersianDatePicker
                        value={newPayment.date}
                        onChange={(e) => setNewPayment((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="مبلغ ناخالص (ریال)">
                      <Input
                        type="number"
                        value={newPayment.gross}
                        onChange={(e) => setNewPayment((prev) => ({ ...prev, gross: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="مبلغ کسورات (ریال)">
                      <Input
                        type="number"
                        value={newPayment.deductions}
                        onChange={(e) => setNewPayment((prev) => ({ ...prev, deductions: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div>
                    <Field label="شماره سند / حواله">
                      <Input
                        type="text"
                        value={newPayment.docNum}
                        onChange={(e) => setNewPayment((prev) => ({ ...prev, docNum: e.target.value }))}
                        className="h-9 text-xs text-center"
                      />
                    </Field>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addPayment} className="h-9 w-full text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-3.5 w-3.5" />
                      افزودن
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-right text-xs">ردیف</TableHead>
                        <TableHead className="text-center text-xs">تاریخ پرداخت</TableHead>
                        <TableHead className="text-center text-xs">مبلغ ناخالص</TableHead>
                        <TableHead className="text-center text-xs">مبلغ کسورات</TableHead>
                        <TableHead className="text-center text-xs">مبلغ خالص</TableHead>
                        <TableHead className="text-center text-xs">شماره سند</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(form.payments || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">هیچ پرداختی ثبت نشده است.</TableCell>
                        </TableRow>
                      ) : (
                        (form.payments || []).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{idx + 1}</TableCell>
                            <TableCell className="text-center text-xs font-mono">{item.payment_date}</TableCell>
                            <TableCell className="text-center text-xs font-mono">{Number(item.gross_amount).toLocaleString()} ریال</TableCell>
                            <TableCell className="text-center text-xs font-mono">{Number(item.deductions).toLocaleString()} ریال</TableCell>
                            <TableCell className="text-center text-xs font-mono">{Number(item.net_amount).toLocaleString()} ریال</TableCell>
                            <TableCell className="text-center text-xs font-semibold">{item.document_number}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* بخش مانیتورینگ مالی و خلاصه‌ها دقیقا مطابق عکس */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
          
          {/* پنل اطلاعات تکمیلی */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-2.5 font-bold text-xs bg-muted/10 text-muted-foreground text-center">
              اطلاعات تکمیلی
            </div>
            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">وضعیت ضمانت:</span>
                <span className="font-semibold text-emerald-500">{form.guarantee_status}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">تاریخ انقضای ضمانت:</span>
                <span className="font-mono font-semibold">{form.guarantee_expiry_date || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">آخرین صورت وضعیت:</span>
                <span className="font-semibold text-blue-500">{computedStats.last_statement || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">تاریخ آخرین پرداخت:</span>
                <span className="font-mono font-semibold">{computedStats.last_payment_date || "-"}</span>
              </div>
            </div>
          </Card>

          {/* پنل پرداختی‌ها */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-2.5 font-bold text-xs bg-muted/10 text-muted-foreground text-center">
              پرداختی‌ها
            </div>
            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">مبلغ پرداخت شده:</span>
                <span className="font-mono font-semibold text-emerald-500">{Number(computedStats.paid_amount).toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">مانده پرداخت:</span>
                <span className="font-mono font-semibold text-amber-500">{Number(computedStats.remaining_amount).toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">درصد پرداخت:</span>
                <span className="font-mono font-semibold text-blue-500">{computedStats.payment_percent}%</span>
              </div>
            </div>
          </Card>

          {/* پنل مبالغ قرارداد */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-2.5 font-bold text-xs bg-muted/10 text-muted-foreground text-center">
              مبالغ قرارداد
            </div>
            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">مبلغ اولیه:</span>
                <span className="font-mono font-semibold">{Number(form.amount).toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">مبلغ فعلی:</span>
                <span className="font-mono font-semibold text-blue-500">{Number(computedStats.current_amount).toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">مبلغ افزایش:</span>
                <span className="font-mono font-semibold text-emerald-500">{Number(computedStats.increase_amount).toLocaleString()} ریال</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">مبلغ کاهش:</span>
                <span className="font-mono font-semibold text-destructive">{Number(computedStats.decrease_amount).toLocaleString()} ریال</span>
              </div>
            </div>
          </Card>

          {/* پنل وضعیت قرارداد */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-2.5 font-bold text-xs bg-muted/10 text-muted-foreground text-center">
              گردش کار و وضعیت قرارداد
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-3 py-1">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">مرحله گردش کار:</span>
                  <span className={cn("px-2.5 py-0.5 rounded text-[10px] font-bold", getStatusBadgeClass(form.status || "پیش‌نویس"))}>
                    {form.status || "پیش‌نویس"}
                  </span>
                </div>
                
                {/* Stepper progress indicator */}
                <div className="flex justify-between items-center gap-1 text-[10px] pt-1">
                  {["پیش‌نویس", "ثبت شده", "تایید شده", "در حال اجرا", "خاتمه یافته", "تسویه شده"].map((st, idx) => {
                    const isActive = (form.status || "پیش‌نویس") === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, status: st }))}
                        className={cn(
                          "flex-1 py-1 rounded transition-all font-mono font-bold border",
                          isActive
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-105"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/80"
                        )}
                        title={st}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                
                {/* Status Names List under buttons */}
                <div className="grid grid-cols-6 gap-0.5 text-[8px] text-center text-muted-foreground font-medium">
                  <span>پیش‌نویس</span>
                  <span>ثبت</span>
                  <span>تایید</span>
                  <span>اجرا</span>
                  <span>خاتمه</span>
                  <span>تسویه</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>درصد پیشرفت</span>
                  <span className="font-mono font-bold text-foreground">{computedStats.progress_percent}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${computedStats.progress_percent}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* بخش دو جدول پایین در تب اصلی ثبت قرارداد */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" dir="rtl">
          
          {/* جدول صورت وضعیت‌های ثبت شده */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10 text-right flex justify-between items-center">
              <span>صورت وضعیت‌های ثبت شده</span>
              <button onClick={() => setActiveTab("statements")} className="text-blue-500 text-[10px] hover:underline">مشاهده همه</button>
            </div>
            <CardContent className="p-3">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره صورت وضعیت</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ ناخالص</TableHead>
                      <TableHead className="text-center text-xs py-2">درصد پیشرفت</TableHead>
                      <TableHead className="text-center text-xs py-2">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.statements || []).slice(0, 3).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-[11px] py-2">{idx + 1}</TableCell>
                        <TableCell className="text-center text-[11px] font-semibold py-2">{item.statement_number}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.date}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{Number(item.gross_amount).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.progress_percent}%</TableCell>
                        <TableCell className="text-center py-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-semibold",
                            item.status === "پرداخت شده" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(form.statements || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">داده‌ای یافت نشد</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* جدول آخرین پرداخت‌ها */}
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10 text-right flex justify-between items-center">
              <span>آخرین پرداخت‌ها</span>
              <button onClick={() => setActiveTab("payments")} className="text-blue-500 text-[10px] hover:underline">مشاهده همه</button>
            </div>
            <CardContent className="p-3">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ پرداخت</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ ناخالص</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ کسورات</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ خالص</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره سند</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.payments || []).slice(0, 3).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-[11px] py-2">{idx + 1}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{item.payment_date}</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{Number(item.gross_amount).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{Number(item.deductions).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-[11px] font-mono py-2">{Number(item.net_amount).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center text-[11px] font-semibold py-2">{item.document_number}</TableCell>
                      </TableRow>
                    ))}
                    {(form.payments || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-4 text-muted-foreground">داده‌ای یافت نشد</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* مودال جستجوی قراردادها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست قراردادهای ثبت شده</span>
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
                  placeholder="جستجو بر اساس شماره قرارداد، موضوع، طرف قرارداد..."
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
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">موضوع قرارداد</TableHead>
                      <TableHead className="text-right text-xs">طرف قرارداد</TableHead>
                      <TableHead className="text-center text-xs">مبلغ اولیه</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((c, idx) => (
                      <TableRow
                        key={c._id}
                        onClick={() => loadContractDetails(c)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{c.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{c.title}</TableCell>
                        <TableCell className="text-right text-xs">{c.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(c.amount).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", getStatusBadgeClass(c.status || "پیش‌نویس"))}>
                            {c.status || "پیش‌نویس"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredContracts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-xs py-8 text-muted-foreground">قراردادی یافت نشد.</TableCell>
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
