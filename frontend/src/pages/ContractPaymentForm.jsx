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

const MOEIN_ACCOUNTS = [
  "61001 - هزینه عملیاتی پیمانکاران",
  "12002 - دارایی در جریان ساخت",
  "61005 - پیش‌پرداخت سرمایه‌ای",
  "11003 - علی‌الحساب جاری",
];

const DETAIL_ACCOUNTS = [
  "400012 - تفصیلی طرف قرارداد (پیمانکار)",
  "400015 - تفصیلی کارکنان طرح",
  "400020 - تفصیلی ناظرین پروژه",
];

const BUDGET_LINES = [
  "30201 - طرح احداث ساختمان اداری و محوطه‌سازی",
  "30202 - طرح توسعه تأسیسات و ماشین‌آلات",
  "30203 - طرح نگهداری و بهسازی ابنیه",
];

const FUNDING_SOURCES = [
  "تملک دارایی‌های سرمایه‌ای (بودجه دولتی)",
  "منابع داخلی موسسه",
  "تسهیلات بانکی و مالی",
  "سایر منابع اعتباری",
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

  // Financial Tab fields
  accounting_moein_code: "61001 - هزینه عملیاتی پیمانکاران",
  contractor_detail_code: "400012 - تفصیلی طرف قرارداد (پیمانکار)",
  budget_line_code: "30201 - طرح احداث ساختمان اداری و محوطه‌سازی",
  funding_source: "تملک دارایی‌های سرمایه‌ای (بودجه دولتی)",
  prepayment_amortization: 0,
  imprest_amortization: 0,
  other_additions: 0,
  vat_acceptable: 0,
  supplement_id: "",

  // Documents Tab fields
  attachments: [
    { row_num: 1, name: "صورت_وضعیت_تایید_شده.pdf", type: "صورت وضعیت", size: "2.4 MB", date: "1403/05/01" },
    { row_num: 2, name: "فیش_واریز_بانکی.jpg", type: "فیش واریز", size: "850 KB", date: "1403/05/10" }
  ],
  related_vouchers: [],

  // History Tab fields
  history_logs: []
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
  const [newAttachment, setNewAttachment] = useState({ name: "", type: "صورت وضعیت" });

  const handleAddAttachment = () => {
    if (!newAttachment.name) return;
    const item = {
      row_num: (form.attachments || []).length + 1,
      name: newAttachment.name,
      type: newAttachment.type,
      size: "1.2 MB",
      date: form.payment_date || "1403/05/15"
    };
    setForm(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), item]
    }));
    setNewAttachment({ name: "", type: "صورت وضعیت" });
  };

  const handleDeleteAttachment = (idx) => {
    setForm(prev => {
      const list = prev.attachments.filter((_, i) => i !== idx).map((item, i) => ({
        ...item,
        row_num: i + 1
      }));
      return { ...prev, attachments: list };
    });
  };

  const fetchContracts = async () => {
    try {
      const res = await api.get("/api/contracts");
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

  const handleGrossAmountChange = (val) => {
    const gross = Number(val) || 0;
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
        gross_amount: gross,
        deductions_list: nextDeductions,
      };
    });
  };

  const handleProgressPercentChange = (val) => {
    setForm((prev) => ({
      ...prev,
      progress_percent: Number(val) || 0,
    }));
  };


  // Recalculate deductions in real time
  const computedDeductionsSum = useMemo(() => {
    return form.deductions_list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [form.deductions_list]);

  const computedPayableAmount = useMemo(() => {
    return Math.max(
      0,
      Number(form.gross_amount || 0) +
        Number(form.other_additions || 0) -
        Number(form.prepayment_amortization || 0) -
        Number(form.imprest_amortization || 0) -
        computedDeductionsSum
    );
  }, [
    form.gross_amount,
    form.other_additions,
    form.prepayment_amortization,
    form.imprest_amortization,
    computedDeductionsSum,
  ]);

  const computedApprovedGross = useMemo(() => {
    return Number(form.gross_amount || 0) + Number(form.other_additions || 0);
  }, [form.gross_amount, form.other_additions]);

  // Sync to form state
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      total_deductions: computedDeductionsSum,
      payable_amount: computedPayableAmount,
      approved_gross_amount: computedApprovedGross,
    }));
  }, [computedDeductionsSum, computedPayableAmount, computedApprovedGross]);

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

      // new fields with dynamic fallback
      accounting_moein_code: pay.accounting_moein_code || "61001 - هزینه عملیاتی پیمانکاران",
      contractor_detail_code: pay.contractor_detail_code || "400012 - تفصیلی طرف قرارداد (پیمانکار)",
      budget_line_code: pay.budget_line_code || "30201 - طرح احداث ساختمان اداری و محوطه‌سازی",
      funding_source: pay.funding_source || "تملک دارایی‌های سرمایه‌ای (بودجه دولتی)",
      prepayment_amortization: pay.prepayment_amortization || 0,
      imprest_amortization: pay.imprest_amortization || 0,
      other_additions: pay.other_additions || 0,
      vat_acceptable: pay.vat_acceptable || 0,
      supplement_id: pay.supplement_id || "",
      attachments: pay.attachments || [
        { row_num: 1, name: "صورت_وضعیت_تایید_شده.pdf", type: "صورت وضعیت", size: "2.4 MB", date: pay.payment_date || "1403/05/01" },
        { row_num: 2, name: "فیش_واریز_بانکی.jpg", type: "فیش واریز", size: "850 KB", date: pay.payment_date || "1403/05/10" }
      ],
      related_vouchers: pay.related_vouchers || (pay.voucher_number ? [
        { voucher_number: pay.voucher_number, voucher_date: pay.voucher_date || pay.payment_date, voucher_type: pay.voucher_type || "سند پرداخت", voucher_status: pay.voucher_status || "ثبت موقت", amount: pay.payable_amount || 0, description: pay.description || "بابت پرداخت صورت وضعیت" }
      ] : []),
      history_logs: pay.history_logs || [
        { row_num: 1, user: "امیر حسینی (کارشناس قرارداد)", date: pay.createdAt ? pay.createdAt.replace('T', ' ').substring(0, 16) : "1403/05/01 11:20", action: "ثبت اولیه و ارسال به مالی", comment: "صورت وضعیت بررسی شد." },
        { row_num: 2, user: "زهرا موسوی (رئیس حسابداری)", date: pay.updatedAt ? pay.updatedAt.replace('T', ' ').substring(0, 16) : "1403/05/05 09:45", action: "تامین اعتبار و بررسی سرفصل‌ها", comment: "اعتبار طرح تامین گردید." }
      ],
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
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
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
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
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
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
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
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right disabled:opacity-50"
                    >
                      <option value="">انتخاب صورت وضعیت</option>
                      {contractBills.map((b) => (
                        <option key={b._id} value={b._id}>صورت وضعیت شماره {b.statement_number} ({b.statement_date})</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تاریخ صورت وضعیت">
                    <PersianDatePicker
                      value={form.statement_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, statement_date: e.target.value }))}
                      disabled={!!form.statement_id}
                    />
                  </Field>

                  <Field label="مبلغ ناخالص صورت وضعیت">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.gross_amount}
                        onChange={(e) => handleGrossAmountChange(e.target.value)}
                        className="h-9 text-sm text-center font-mono pl-10"
                        dir="ltr"
                        min={0}
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="درصد پیشرفت">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.progress_percent}
                        onChange={(e) => handleProgressPercentChange(e.target.value)}
                        className="h-9 text-sm text-center font-mono pl-7"
                        dir="ltr"
                        min={0}
                        max={100}
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

            {activeTab === "financial" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right animate-in fade-in duration-300">
                {/* ستون راست - حسابداری و بودجه */}
                <div className="space-y-4">
                  <Field label="سرفصل حسابداری معین">
                    <select
                      value={form.accounting_moein_code}
                      onChange={(e) => setForm((prev) => ({ ...prev, accounting_moein_code: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {MOEIN_ACCOUNTS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="تفصیلی طرف قرارداد">
                    <select
                      value={form.contractor_detail_code}
                      onChange={(e) => setForm((prev) => ({ ...prev, contractor_detail_code: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {DETAIL_ACCOUNTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="ردیف بودجه / طرح">
                    <select
                      value={form.budget_line_code}
                      onChange={(e) => setForm((prev) => ({ ...prev, budget_line_code: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {BUDGET_LINES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="منبع تأمین اعتبار">
                    <select
                      value={form.funding_source}
                      onChange={(e) => setForm((prev) => ({ ...prev, funding_source: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      {FUNDING_SOURCES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="اتصال به متمم/الحاقیه">
                    <select
                      value={form.supplement_id}
                      onChange={(e) => setForm((prev) => ({ ...prev, supplement_id: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="">عدم اتصال (قرارداد اصلی)</option>
                      <option value="supp-1">متمم شماره ۱ (افزایش مقادیر کارکرد)</option>
                      <option value="supp-2">الحاقیه شماره ۱ (تمدید زمان و افزایش مبلغ)</option>
                    </select>
                  </Field>
                </div>

                {/* ستون چپ - استهلاک پیش‌پرداخت و تایید نهایی */}
                <div className="space-y-4">
                  <Field label="مبلغ استهلاک پیش‌پرداخت">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.prepayment_amortization}
                        onChange={(e) => setForm((prev) => ({ ...prev, prepayment_amortization: Number(e.target.value) || 0 }))}
                        className="h-9 text-sm text-center font-mono pl-10"
                        dir="ltr"
                        min={0}
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="مبلغ استهلاک علی‌الحساب">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.imprest_amortization}
                        onChange={(e) => setForm((prev) => ({ ...prev, imprest_amortization: Number(e.target.value) || 0 }))}
                        className="h-9 text-sm text-center font-mono pl-10"
                        dir="ltr"
                        min={0}
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="سایر اضافات / تعدیلات مثبت">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.other_additions}
                        onChange={(e) => setForm((prev) => ({ ...prev, other_additions: Number(e.target.value) || 0 }))}
                        className="h-9 text-sm text-center font-mono pl-10"
                        dir="ltr"
                        min={0}
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="مبلغ ناخالص تایید شده (کارکرد + اضافات)">
                    <div className="relative">
                      <Input
                        type="text"
                        value={Number(form.approved_gross_amount || 0).toLocaleString()}
                        readOnly
                        className="h-9 text-sm text-center font-mono pl-10 bg-muted/40 text-muted-foreground"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>

                  <Field label="مالیات بر ارزش افزوده قابل قبول">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.vat_acceptable}
                        onChange={(e) => setForm((prev) => ({ ...prev, vat_acceptable: Number(e.target.value) || 0 }))}
                        className="h-9 text-sm text-center font-mono pl-10"
                        dir="ltr"
                        min={0}
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {activeTab === "deductions" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right animate-in fade-in duration-300">
                {/* جدول کسورات پرداخت (۲ ستون در صفحه بزرگ) */}
                <div className="lg:col-span-2 border rounded-lg bg-card overflow-hidden">
                  <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
                    <span>کسورات کارکرد</span>
                    <Button onClick={addDeductionRow} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px] h-7 bg-background">
                      <Plus className="h-3 w-3" />
                      افزودن کسر جدید
                    </Button>
                  </div>
                  <div className="p-3">
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
                  </div>
                </div>

                {/* خلاصه محاسبات پرداخت (۱ ستون) */}
                <div className="border rounded-lg bg-card overflow-hidden">
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

                    {form.other_additions > 0 && (
                      <Field label="سایر اضافات">
                        <div className="relative">
                          <Input
                            type="text"
                            value={Number(form.other_additions || 0).toLocaleString()}
                            readOnly
                            className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-emerald-600 font-semibold"
                            dir="ltr"
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                        </div>
                      </Field>
                    )}

                    {(form.prepayment_amortization > 0 || form.imprest_amortization > 0) && (
                      <Field label="جمع استهلاک پیش‌پرداخت/علی‌الحساب">
                        <div className="relative">
                          <Input
                            type="text"
                            value={`(${Number((form.prepayment_amortization || 0) + (form.imprest_amortization || 0)).toLocaleString()})`}
                            readOnly
                            className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-orange-600 font-semibold"
                            dir="ltr"
                          />
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                        </div>
                      </Field>
                    )}

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
                      <div className="px-3 py-2 rounded border border-yellow-500/20 bg-yellow-500/5 text-yellow-600 text-xs font-bold text-center bg-background">
                        {form.status}
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "docs" && (
              <div className="space-y-6 text-right animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* جدول ضمایم پیوست */}
                  <div className="lg:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold text-foreground pr-1">اسناد و فایل‌های ضمیمه</h3>
                    <div className="overflow-x-auto rounded border bg-card">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="text-right text-xs w-10">ردیف</TableHead>
                            <TableHead className="text-right text-xs">نام فایل</TableHead>
                            <TableHead className="text-center text-xs">نوع فایل</TableHead>
                            <TableHead className="text-center text-xs">حجم</TableHead>
                            <TableHead className="text-center text-xs">تاریخ بارگذاری</TableHead>
                            <TableHead className="text-center text-xs w-20">عملیات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(form.attachments || []).map((att, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs text-center">{idx + 1}</TableCell>
                              <TableCell className="text-right text-xs font-mono" dir="ltr">{att.name}</TableCell>
                              <TableCell className="text-center text-xs">{att.type}</TableCell>
                              <TableCell className="text-center text-xs font-mono">{att.size}</TableCell>
                              <TableCell className="text-center text-xs font-mono">{att.date}</TableCell>
                              <TableCell className="text-center p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteAttachment(idx)}
                                  className="h-7 w-7 text-destructive hover:text-destructive/80"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(form.attachments || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-xs py-6 text-muted-foreground">هیچ فایلی ضمیمه نشده است.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* فرم شبیه‌ساز بارگذاری ضمیمه */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/10 h-fit">
                    <h3 className="text-xs font-bold text-foreground">بارگذاری ضمیمه جدید (شبیه‌ساز)</h3>
                    <div className="space-y-3">
                      <Field label="نام فایل">
                        <Input
                          type="text"
                          placeholder="مثال: check_receipt.jpg"
                          value={newAttachment.name}
                          onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                          className="h-8 text-xs text-right"
                        />
                      </Field>
                      <Field label="نوع سند">
                        <select
                          value={newAttachment.type}
                          onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value }))}
                          className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
                        >
                          <option value="صورت وضعیت">صورت وضعیت</option>
                          <option value="فیش واریز">فیش واریز</option>
                          <option value="تاییدیه ناظر">تاییدیه ناظر</option>
                          <option value="ضمانت‌نامه">ضمانت‌نامه</option>
                          <option value="سایر">سایر</option>
                        </select>
                      </Field>
                      <Button
                        type="button"
                        onClick={handleAddAttachment}
                        size="xs"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                      >
                        <Plus className="h-3.5 w-3.5 ml-1 inline" />
                        افزودن به لیست ضمایم
                      </Button>
                    </div>
                  </div>
                </div>

                {/* آرتیکل و تنظیمات سند حسابداری صادر شده */}
                <div className="border-t pt-5">
                  <div className="border rounded-lg shadow-sm bg-muted/5 overflow-hidden">
                    <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10 flex justify-between items-center">
                      <span>ایجاد و تنظیمات سند حسابداری همزمان</span>
                      {form.voucher_number && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 font-mono">
                          سند صادر شده است ({form.voucher_status})
                        </span>
                      )}
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
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4 text-right animate-in fade-in duration-300">
                <div className="border-b pb-2 mb-3">
                  <h3 className="text-xs font-bold text-foreground">تاریخچه گردش کار و اقدامات مالی</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">سوابق تغییر وضعیت، ثبت و تاییدات این سند پرداخت</p>
                </div>
                <div className="overflow-x-auto rounded border bg-card">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-right text-xs w-10">ردیف</TableHead>
                        <TableHead className="text-right text-xs">اقدام‌کننده</TableHead>
                        <TableHead className="text-center text-xs">تاریخ و ساعت</TableHead>
                        <TableHead className="text-center text-xs">عنوان اقدام</TableHead>
                        <TableHead className="text-right text-xs">توضیحات / پی‌نوشت کارتابل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(form.history_logs || []).map((log, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs text-center">{idx + 1}</TableCell>
                          <TableCell className="text-right text-xs font-semibold">{log.user}</TableCell>
                          <TableCell className="text-center text-xs font-mono">{log.date}</TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              log.action.includes("تایید") ? "bg-emerald-500/10 text-emerald-600" :
                              log.action.includes("ارسال") ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground"
                            )}>
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{log.comment || "-"}</TableCell>
                        </TableRow>
                      ))}
                      {(form.history_logs || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">هیچ گردش کار یا سابقه تاییداتی ثبت نشده است.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
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
