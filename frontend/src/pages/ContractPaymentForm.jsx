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

const PAYMENT_METHODS = ["حواله بانکی", "چک", "نقدی"];

const PAYMENT_ACCOUNTS = [
  "بانک ملی - حساب جاری 1234567890",
  "بانک ملت - حساب جاری 9876543210",
  "بانک تجارت - حساب پشتیبان 55554444",
];

const DEDUCTION_TYPES = [
  "مالیات بر ارزش افزوده",
  "بیمه تأمین اجتماعی",
  "حسن انجام کار",
  "سپرده ضمانت",
  "سایر کسورات",
];

const INITIAL_FORM = {
  payment_number: "",
  payment_date: "",
  payment_method: "حواله بانکی",
  payment_account: "بانک ملی - حساب جاری 1234567890",
  doc_number: "",
  remittance_number: "",
  status: "در انتظار تأیید",

  contract_id: "",
  contract_number: "",
  contractor_name: "",
  statement_id: "",
  statement_number: "",
  statement_date: "",
  gross_amount: 0,
  progress_percent: 0,
  description: "",

  deductions_list: [
    { row_num: 1, deduction_type: "مالیات بر ارزش افزوده", calc_method: "درصدی", percent: 9, amount: 0, ceiling: "-", calculated_amount: 0 },
    { row_num: 2, deduction_type: "بیمه تأمین اجتماعی", calc_method: "درصدی", percent: 5, amount: 0, ceiling: "-", calculated_amount: 0 },
    { row_num: 3, deduction_type: "حسن انجام کار", calc_method: "درصدی", percent: 5, amount: 0, ceiling: "5000000000", calculated_amount: 0 },
  ],
  total_deductions: 0,
  payable_amount: 0,
  due_date: "",

  voucher_number: "",
  voucher_date: "",
  voucher_type: "اتوماتیک",
  voucher_status: "ثبت نشده",
  voucher_ref: "",
  create_voucher: true,
  send_to_accounting: false,
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

export default function ContractPaymentForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [bills, setBills] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
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

  const fetchBills = async () => {
    try {
      const res = await api.get("/api/progress-bills");
      if (res.data?.success) {
        setBills(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching progress bills:", err);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-payments");
      if (res.data?.success) {
        setPaymentsList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-payments/suggest-number");
      if (res.data?.success && res.data.payment_number) {
        setForm((prev) => ({ ...prev, payment_number: res.data.payment_number }));
      }
    } catch (err) {
      console.error("Error getting suggested payment number:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchBills();
    fetchPayments();
    getSuggestedNumber();
  }, []);

  // Filter bills list for selected contract
  const contractBills = useMemo(() => {
    if (!form.contract_id) return [];
    return bills.filter((b) => b.contract_id === form.contract_id);
  }, [form.contract_id, bills]);

  const handleContractChange = (contractId) => {
    const selectedContract = contracts.find((c) => c._id === contractId);
    if (!selectedContract) {
      setForm((prev) => ({
        ...prev,
        contract_id: "",
        contract_number: "",
        contractor_name: "",
        statement_id: "",
        statement_number: "",
        statement_date: "",
        gross_amount: 0,
        progress_percent: 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contractor_name: selectedContract.contractor_name,
      statement_id: "",
      statement_number: "",
      statement_date: "",
      gross_amount: 0,
      progress_percent: 0,
    }));
  };

  const handleBillChange = (billId) => {
    const selectedBill = bills.find((b) => b._id === billId);
    if (!selectedBill) {
      setForm((prev) => ({
        ...prev,
        statement_id: "",
        statement_number: "",
        statement_date: "",
        gross_amount: 0,
        progress_percent: 0,
      }));
      return;
    }

    // Prefill details and recompute calculations
    const gross = Number(selectedBill.payable_amount || selectedBill.items_sum || 0);

    setForm((prev) => {
      const nextDeductions = prev.deductions_list.map((item) => {
        if (item.calc_method === "درصدی") {
          const amt = Math.round(gross * (Number(item.percent || 0) / 100));
          return { ...item, amount: amt, calculated_amount: amt };
        }
        return item;
      });

      return {
        ...prev,
        statement_id: selectedBill._id,
        statement_number: selectedBill.statement_number,
        statement_date: selectedBill.statement_date,
        gross_amount: gross,
        progress_percent: selectedBill.progress_percent || 0,
        deductions_list: nextDeductions,
        description: `پرداخت مرحله ${selectedBill.statement_number} طبق صورت وضعیت شماره ${selectedBill.statement_number}`,
      };
    });
  };

  // Recalculate deductions in real time
  const computedDeductionsSum = useMemo(() => {
    return form.deductions_list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [form.deductions_list]);

  const computedPayableAmount = useMemo(() => {
    return Math.max(0, Number(form.gross_amount || 0) - computedDeductionsSum);
  }, [form.gross_amount, computedDeductionsSum]);

  // Sync to form state
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      total_deductions: computedDeductionsSum,
      payable_amount: computedPayableAmount,
    }));
  }, [computedDeductionsSum, computedPayableAmount]);

  const handleDeductionChange = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.deductions_list];
      const item = { ...list[index], [field]: value };

      if (field === "percent" || field === "calc_method") {
        if (item.calc_method === "درصدی") {
          const amt = Math.round(Number(prev.gross_amount || 0) * (Number(item.percent || 0) / 100));
          item.amount = amt;
          item.calculated_amount = amt;
        }
      } else if (field === "amount") {
        item.calculated_amount = Number(value || 0);
      }

      list[index] = item;
      return { ...prev, deductions_list: list };
    });
  };

  const addDeductionRow = () => {
    setForm((prev) => ({
      ...prev,
      deductions_list: [
        ...prev.deductions_list,
        {
          row_num: prev.deductions_list.length + 1,
          deduction_type: "سایر کسورات",
          calc_method: "مبلغ ثابت",
          percent: 0,
          amount: 0,
          ceiling: "-",
          calculated_amount: 0,
        },
      ],
    }));
  };

  const deleteDeductionRow = (index) => {
    setForm((prev) => {
      const list = prev.deductions_list.filter((_, idx) => idx !== index).map((item, idx) => ({
        ...item,
        row_num: idx + 1,
      }));
      return { ...prev, deductions_list: list };
    });
  };

  const handleNew = () => {
    setForm({
      ...INITIAL_FORM,
      deductions_list: [
        { row_num: 1, deduction_type: "مالیات بر ارزش افزوده", calc_method: "درصدی", percent: 9, amount: 0, ceiling: "-", calculated_amount: 0 },
        { row_num: 2, deduction_type: "بیمه تأمین اجتماعی", calc_method: "درصدی", percent: 5, amount: 0, ceiling: "-", calculated_amount: 0 },
        { row_num: 3, deduction_type: "حسن انجام کار", calc_method: "درصدی", percent: 5, amount: 0, ceiling: "5000000000", calculated_amount: 0 },
      ],
      total_deductions: 0,
      payable_amount: 0,
    });
    setSelectedId(null);
    getSuggestedNumber();
    setActiveTab("main");
  };

  const handleSave = async () => {
    const { contract_id, payment_number, payment_date, payment_method, payment_account } = form;
    if (!contract_id || !payment_number || !payment_date || !payment_method || !payment_account) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره پرداخت، تاریخ، نحوه و حساب پرداخت) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-payments/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات پرداخت با موفقیت بروزرسانی شد.");
          fetchPayments();
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-payments", form);
        if (res.data?.success) {
          alert("پرداخت قرارداد با موفقیت ثبت شد.");
          fetchPayments();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving payment:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات پرداخت.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این پرداخت مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-payments/${selectedId}`);
      if (res.data?.success) {
        alert("پرداخت حذف شد.");
        fetchPayments();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting payment:", err);
      alert(err.response?.data?.message || "خطا در حذف پرداخت.");
    }
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    try {
      const updated = { ...form, status: "تأیید شده" };
      const res = await api.put(`/api/contract-payments/${selectedId}`, updated);
      if (res.data?.success) {
        setForm(updated);
        alert("وضعیت پرداخت به 'تأیید شده' تغییر یافت.");
        fetchPayments();
      }
    } catch (err) {
      console.error("Error approving payment:", err);
    }
  };

  const loadPaymentDetails = (pay) => {
    setSelectedId(pay._id);
    setForm({
      payment_number: pay.payment_number || "",
      payment_date: pay.payment_date || "",
      payment_method: pay.payment_method || "حواله بانکی",
      payment_account: pay.payment_account || "",
      doc_number: pay.doc_number || "",
      remittance_number: pay.remittance_number || "",
      status: pay.status || "در انتظار تأیید",
      contract_id: pay.contract_id || "",
      contract_number: pay.contract_number || "",
      contractor_name: pay.contractor_name || "",
      statement_id: pay.statement_id || "",
      statement_number: pay.statement_number || "",
      statement_date: pay.statement_date || "",
      gross_amount: pay.gross_amount || 0,
      progress_percent: pay.progress_percent || 0,
      description: pay.description || "",
      deductions_list: pay.deductions_list || [],
      total_deductions: pay.total_deductions || 0,
      payable_amount: pay.payable_amount || 0,
      due_date: pay.due_date || "",
      voucher_number: pay.voucher_number || "",
      voucher_date: pay.voucher_date || "",
      voucher_type: pay.voucher_type || "اتوماتیک",
      voucher_status: pay.voucher_status || "ثبت نشده",
      voucher_ref: pay.voucher_ref || "",
      create_voucher: pay.create_voucher ?? true,
      send_to_accounting: pay.send_to_accounting ?? false,
    });
    setShowSearchModal(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>رسید پرداخت قرارداد - ${form.payment_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .summary { margin-top: 30px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>رسید پرداخت قرارداد مالی</h2>
          <div class="grid">
            <div><strong>شماره پرداخت:</strong> ${form.payment_number}</div>
            <div><strong>تاریخ پرداخت:</strong> ${form.payment_date}</div>
            <div><strong>حساب پرداخت:</strong> ${form.payment_account}</div>
            <div><strong>شماره سند:</strong> ${form.doc_number || "-"}</div>
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>طرف قرارداد:</strong> ${form.contractor_name}</div>
            <div><strong>موضوع کارکرد:</strong> صورت وضعیت شماره ${form.statement_number || "-"}</div>
          </div>
          <div class="summary">
            <div>مبلغ ناخالص صورت وضعیت: ${Number(form.gross_amount).toLocaleString()} ریال</div>
            <div>جمع کسورات: ${Number(form.total_deductions).toLocaleString()} ریال</div>
            <div>مبلغ خالص پرداختی: ${Number(form.payable_amount).toLocaleString()} ریال</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredPayments = paymentsList.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.payment_number || "").toLowerCase().includes(q) ||
      (p.contract_number || "").toLowerCase().includes(q) ||
      (p.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر ابزارهای فرم پرداخت قرارداد */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">💳</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">پرداخت قرارداد</h1>
            <p className="text-xs text-muted-foreground">ثبت حواله‌ها، پرداخت‌ها و محاسبات کسورات قانونی صورت وضعیت</p>
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
            onClick={handleApprove}
            disabled={!selectedId || form.status === "تأیید شده" || form.status === "پرداخت شده"}
            className="gap-1.5 h-9 text-xs text-blue-500 border-blue-500/20 hover:bg-blue-500/10 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            تأیید
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
            جستجوی پرداخت
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
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex gap-4">
            {["main", "financial", "deductions", "docs", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "main" && "اطلاعات اصلی"}
                {tab === "financial" && "اطلاعات مالی"}
                {tab === "deductions" && "کسورات"}
                {tab === "docs" && "اسناد"}
                {tab === "history" && "تاریخچه"}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
                
                {/* ستون راست - جزئیات پرداخت */}
                <div className="space-y-4">
                  <Field label="شماره پرداخت">
                    <Input
                      type="text"
                      value={form.payment_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, payment_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono font-bold"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="تاریخ پرداخت" required>
                    <PersianDatePicker
                      value={form.payment_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="نحوه پرداخت">
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="حساب پرداخت">
                    <select
                      value={form.payment_account}
                      onChange={(e) => setForm((prev) => ({ ...prev, payment_account: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      {PAYMENT_ACCOUNTS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="شماره سند پرداخت">
                    <Input
                      type="text"
                      value={form.doc_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, doc_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="شماره حواله">
                    <Input
                      type="text"
                      value={form.remittance_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, remittance_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="وضعیت">
                    <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 font-bold text-xs text-center">
                      {form.status}
                    </div>
                  </Field>
                </div>

                {/* ستون چپ - اتصال به قرارداد و کارکرد */}
                <div className="space-y-4">
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

                  <Field label="شماره صورت وضعیت">
                    <select
                      value={form.statement_id}
                      onChange={(e) => handleBillChange(e.target.value)}
                      disabled={!form.contract_id}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="">انتخاب صورت وضعیت</option>
                      {contractBills.map((b) => (
                        <option key={b._id} value={b._id}>صورت وضعیت شماره {b.statement_number} ({b.statement_date})</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تاریخ صورت وضعیت">
                    <Input
                      type="text"
                      value={form.statement_date}
                      readOnly
                      className="h-9 text-sm text-center font-mono bg-muted/50 text-muted-foreground"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="مبلغ ناخالص صورت وضعیت">
                    <div className="relative">
                      <Input
                        type="text"
                        value={Number(form.gross_amount || 0).toLocaleString()}
                        readOnly
                        className="h-9 text-sm text-center font-mono pl-10 bg-muted/50 text-muted-foreground"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="درصد پیشرفت">
                    <div className="relative">
                      <Input
                        type="text"
                        value={form.progress_percent}
                        readOnly
                        className="h-9 text-sm text-center font-mono pl-7 bg-muted/50 text-muted-foreground"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
                    </div>
                  </Field>

                  <Field label="شرح">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="توضیحات تکمیلی پیرامون واریز..."
                    />
                  </Field>
                </div>

              </div>
            )}

            {activeTab !== "main" && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 border rounded-lg border-dashed">
                اطلاعات این تب پس از فعال‌سازی چرخه مالی در دیتابیس در دسترس قرار خواهد گرفت.
              </div>
            )}
          </CardContent>
        </Card>

        {/* بخش پایینی: جدول کسورات + پنل محاسبات نهایی */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
          
          {/* جدول کسورات پرداخت (۲ ستون در صفحه بزرگ) */}
          <Card className="border-border/80 shadow-sm lg:col-span-2">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
              <span>کسورات پرداخت</span>
              <div className="flex gap-2">
                <Button onClick={addDeductionRow} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px] h-7">
                  <Plus className="h-3 w-3" />
                  افزودن کسر جدید
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs w-10">ردیف</TableHead>
                      <TableHead className="text-right text-xs">نوع کسر</TableHead>
                      <TableHead className="text-center text-xs w-28">نحوه محاسبه</TableHead>
                      <TableHead className="text-center text-xs w-20">درصد</TableHead>
                      <TableHead className="text-center text-xs w-36">مبلغ کسر (ریال)</TableHead>
                      <TableHead className="text-center text-xs w-32">سقف کسر</TableHead>
                      <TableHead className="text-center text-xs w-36">مبلغ محاسباتی</TableHead>
                      <TableHead className="text-center text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.deductions_list.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs text-center">{idx + 1}</TableCell>
                        <TableCell className="p-1">
                          <select
                            value={item.deduction_type}
                            onChange={(e) => handleDeductionChange(idx, "deduction_type", e.target.value)}
                            className="h-8 rounded border px-2 text-xs text-right w-full bg-transparent"
                          >
                            {DEDUCTION_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <select
                            value={item.calc_method}
                            onChange={(e) => handleDeductionChange(idx, "calc_method", e.target.value)}
                            className="h-8 rounded border px-2 text-xs text-right w-full bg-transparent"
                          >
                            <option value="درصدی">درصدی</option>
                            <option value="مبلغ ثابت">مبلغ ثابت</option>
                          </select>
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Input
                            type="number"
                            value={item.percent || ""}
                            onChange={(e) => handleDeductionChange(idx, "percent", Number(e.target.value))}
                            disabled={item.calc_method === "مبلغ ثابت"}
                            className="h-8 text-xs text-center font-mono border-none shadow-none disabled:opacity-30"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Input
                            type="number"
                            value={item.amount || ""}
                            onChange={(e) => handleDeductionChange(idx, "amount", Number(e.target.value))}
                            disabled={item.calc_method === "درصدی"}
                            className="h-8 text-xs text-center font-mono border-none shadow-none disabled:opacity-80"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Input
                            type="text"
                            value={item.ceiling || ""}
                            onChange={(e) => handleDeductionChange(idx, "ceiling", e.target.value)}
                            className="h-8 text-xs text-center font-mono border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center font-semibold text-blue-500">
                          {Number(item.calculated_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDeductionRow(idx)}
                            className="h-7 w-7 text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.deductions_list.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs py-6 text-muted-foreground">هیچ کسری ثبت نشده است.</TableCell>
                      </TableRow>
                    )}
                    {form.deductions_list.length > 0 && (
                      <TableRow className="bg-muted/20 font-bold">
                        <TableCell colSpan={6} className="text-left text-xs pr-4 font-bold">جمع کسورات:</TableCell>
                        <TableCell className="font-mono text-xs text-center text-red-500 font-extrabold">
                          {Number(form.total_deductions).toLocaleString()} ریال
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* خلاصه محاسبات پرداخت (۱ ستون) */}
          <Card className="border-border/80 shadow-sm text-right bg-card">
            <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10">
              خلاصه محاسبات پرداخت
            </div>
            <div className="p-4 space-y-4">
              <Field label="مبلغ ناخالص صورت وضعیت">
                <div className="relative">
                  <Input
                    type="text"
                    value={Number(form.gross_amount || 0).toLocaleString()}
                    readOnly
                    className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-muted-foreground"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="جمع کسورات">
                <div className="relative">
                  <Input
                    type="text"
                    value={`(${Number(form.total_deductions || 0).toLocaleString()})`}
                    readOnly
                    className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-destructive font-bold"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="مبلغ قابل پرداخت">
                <div className="relative">
                  <Input
                    type="text"
                    value={Number(form.payable_amount || 0).toLocaleString()}
                    readOnly
                    className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-blue-600 font-extrabold"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="تاریخ سررسید پرداخت">
                <PersianDatePicker
                  value={form.due_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                />
              </Field>

              <Field label="وضعیت پرداخت">
                <div className="px-3 py-2 rounded border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 text-xs font-bold text-center">
                  {form.status}
                </div>
              </Field>
            </div>
          </Card>

        </div>

        {/* بخش اطلاعات سند حسابداری */}
        <Card className="border-border/80 shadow-sm text-right bg-muted/5">
          <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10">
            اطلاعات سند حسابداری
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
              
              <Field label="شماره سند">
                <Input
                  type="text"
                  value={form.voucher_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, voucher_number: e.target.value }))}
                  className="h-9 text-xs text-center font-mono"
                  placeholder="خودکار صادر می‌شود"
                />
              </Field>

              <Field label="تاریخ سند">
                <PersianDatePicker
                  value={form.voucher_date}
                  onChange={(e) => setForm((prev) => ({ ...prev, voucher_date: e.target.value }))}
                />
              </Field>

              <Field label="نوع سند">
                <Input
                  type="text"
                  value={form.voucher_type}
                  readOnly
                  className="h-9 text-xs text-center bg-muted/40 text-muted-foreground"
                />
              </Field>

              <Field label="وضعیت سند">
                <Input
                  type="text"
                  value={form.voucher_status}
                  readOnly
                  className="h-9 text-xs text-center bg-muted/40 text-muted-foreground"
                />
              </Field>

              <Field label="شماره عطف سند">
                <Input
                  type="text"
                  value={form.voucher_ref}
                  onChange={(e) => setForm((prev) => ({ ...prev, voucher_ref: e.target.value }))}
                  className="h-9 text-xs text-center font-mono"
                />
              </Field>

              {/* چک باکس ها */}
              <div className="lg:col-span-5 flex flex-wrap gap-6 mt-2 justify-end border-t pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.send_to_accounting}
                    onChange={(e) => setForm((prev) => ({ ...prev, send_to_accounting: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>ارسال به حسابداری</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.create_voucher}
                    onChange={(e) => setForm((prev) => ({ ...prev, create_voucher: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>ایجاد سند حسابداری</span>
                </label>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* مودال جستجوی پرداخت‌ها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست اسناد پرداخت قرارداد</span>
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
                  placeholder="جستجو بر اساس شماره پرداخت، شماره قرارداد، نام طرف قرارداد..."
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
                      <TableHead className="text-center text-xs">شماره پرداخت</TableHead>
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">طرف قرارداد</TableHead>
                      <TableHead className="text-center text-xs">تاریخ پرداخت</TableHead>
                      <TableHead className="text-center text-xs">مبلغ خالص</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((p, idx) => (
                      <TableRow
                        key={p._id}
                        onClick={() => loadPaymentDetails(p)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{p.payment_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{p.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{p.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{p.payment_date}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(p.payable_amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-600">
                            {p.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">سند پرداختی یافت نشد.</TableCell>
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
