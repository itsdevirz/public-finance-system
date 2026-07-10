import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Printer, LogOut, CheckCircle, CreditCard, Search, X, RefreshCw, Undo2
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

const UNITS = ["متر مکعب", "کیلوگرم", "متر مربع", "عدد", "تن", "لیتر", "دستگاه"];

const INITIAL_FORM = {
  contract_id: "",
  contract_number: "",
  contract_title: "",
  contractor_name: "",
  project: "",
  executive_unit: "",
  credit_source: "",
  statement_number: "",
  statement_date: "",
  from_date: "",
  to_date: "",
  progress_percent: 0,
  cumulative_progress: 0,
  status: "در انتظار پرداخت",
  description: "",

  // Financial inputs
  contract_amount: 0,
  prev_paid_amount: 0,
  contract_remaining: 0,
  payable_remaining: 0,

  // Items list
  items: [
    { row_num: 1, description: "عملیات خاکبرداری", unit: "متر مکعب", quantity: 1000, unit_price: 250000, total_amount: 250000000 },
    { row_num: 2, description: "اجرای بتن مگر", unit: "متر مکعب", quantity: 800, unit_price: 350000, total_amount: 280000000 },
    { row_num: 3, description: "اجرای اسکلت فلزی", unit: "کیلوگرم", quantity: 5000, unit_price: 120000, total_amount: 600000000 },
  ],

  // Summaries
  items_sum: 1130000000,
  adjustment_factor: 0,
  total_sum: 1130000000,
  deductions: 0,
  payable_amount: 1130000000,
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

export default function ProgressBillingForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [billsList, setBillsList] = useState([]);
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
    setLoading(true);
    try {
      const res = await api.get("/api/progress-bills");
      if (res.data?.success) {
        setBillsList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching progress bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchBills();
  }, []);

  // Update form fields when contract is selected
  const handleContractChange = (contractId) => {
    const selectedContract = contracts.find((c) => c._id === contractId);
    if (!selectedContract) {
      setForm((prev) => ({
        ...prev,
        contract_id: "",
        contract_number: "",
        contract_title: "",
        contractor_name: "",
        project: "",
        executive_unit: "",
        credit_source: "",
        contract_amount: 0,
        prev_paid_amount: 0,
        contract_remaining: 0,
        payable_remaining: 0,
      }));
      return;
    }

    // Compute payments and statements
    let prevPaid = 0;
    (selectedContract.payments || []).forEach((p) => {
      prevPaid += Number(p.net_amount || 0);
    });

    let cumulativeProgress = 0;
    (selectedContract.statements || []).forEach((s) => {
      cumulativeProgress += Number(s.progress_percent || 0);
    });

    const amt = Number(selectedContract.amount || 0);
    const inc = Number(selectedContract.increase_amount || 0);
    const dec = Number(selectedContract.decrease_amount || 0);
    const currentAmt = amt + inc - dec;
    const remaining = Math.max(0, currentAmt - prevPaid);

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contract_title: selectedContract.title,
      contractor_name: selectedContract.contractor_name,
      project: selectedContract.project || "ساختمان اداری مرکزی",
      executive_unit: selectedContract.executive_agency || "اداره کل راه و شهرسازی",
      credit_source: selectedContract.credit_source || "اعتبارات تملک دارایی های سرمایه ای",
      contract_amount: currentAmt,
      prev_paid_amount: prevPaid,
      contract_remaining: remaining,
      cumulative_progress: cumulativeProgress,
      // Description prefill
      description: `موضوع صورت وضعیت شماره ${prev.statement_number || ""} مورخ ${prev.statement_date || ""} براساس قرارداد شماره ${selectedContract.contract_number}`,
    }));
  };

  // Live recalculate table items and summaries
  const itemsSum = useMemo(() => {
    return form.items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
  }, [form.items]);

  const totalSum = useMemo(() => {
    const factor = Number(form.adjustment_factor || 0);
    return Math.round(itemsSum * (1 + factor / 100));
  }, [itemsSum, form.adjustment_factor]);

  const payableAmount = useMemo(() => {
    const ded = Number(form.deductions || 0);
    return Math.max(0, totalSum - ded);
  }, [totalSum, form.deductions]);

  // Sync computed values to form state on change (so they submit correctly)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      items_sum: itemsSum,
      total_sum: totalSum,
      payable_amount: payableAmount,
      payable_remaining: prev.contract_remaining,
    }));
  }, [itemsSum, totalSum, payableAmount]);

  // Manage table rows
  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      const nextItem = { ...nextItems[index], [field]: value };

      if (field === "quantity" || field === "unit_price") {
        nextItem.total_amount = Math.round(Number(nextItem.quantity || 0) * Number(nextItem.unit_price || 0));
      }
      nextItems[index] = nextItem;
      return { ...prev, items: nextItems };
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { row_num: prev.items.length + 1, description: "", unit: "متر مکعب", quantity: 0, unit_price: 0, total_amount: 0 },
      ],
    }));
  };

  const deleteItemRow = (index) => {
    setForm((prev) => {
      const nextItems = prev.items.filter((_, idx) => idx !== index).map((item, idx) => ({
        ...item,
        row_num: idx + 1,
      }));
      return { ...prev, items: nextItems };
    });
  };

  const handleNew = () => {
    setForm({
      ...INITIAL_FORM,
      items: [],
      items_sum: 0,
      total_sum: 0,
      payable_amount: 0,
    });
    setSelectedId(null);
    setActiveTab("main");
  };

  const handleSave = async () => {
    const { contract_id, statement_number, statement_date, progress_percent } = form;
    if (!contract_id || !statement_number || !statement_date || progress_percent === undefined) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره صورت وضعیت و تاریخ) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/progress-bills/${selectedId}`, form);
        if (res.data?.success) {
          alert("صورت وضعیت با موفقیت به‌روزرسانی شد.");
          fetchBills();
        }
      } else {
        // Create mode
        const res = await api.post("/api/progress-bills", form);
        if (res.data?.success) {
          alert("صورت وضعیت با موفقیت ثبت شد.");
          fetchBills();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving bill:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این صورت وضعیت مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/progress-bills/${selectedId}`);
      if (res.data?.success) {
        alert("صورت وضعیت حذف شد.");
        fetchBills();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting bill:", err);
      alert(err.response?.data?.message || "خطا در حذف صورت وضعیت.");
    }
  };

  const loadBillDetails = (bill) => {
    setSelectedId(bill._id);
    setForm({
      contract_id: bill.contract_id || "",
      contract_number: bill.contract_number || "",
      contract_title: bill.contract_title || "",
      contractor_name: bill.contractor_name || "",
      project: bill.project || "",
      executive_unit: bill.executive_unit || "",
      credit_source: bill.credit_source || "",
      statement_number: bill.statement_number || "",
      statement_date: bill.statement_date || "",
      from_date: bill.from_date || "",
      to_date: bill.to_date || "",
      progress_percent: bill.progress_percent || 0,
      cumulative_progress: bill.cumulative_progress || 0,
      status: bill.status || "در انتظار پرداخت",
      description: bill.description || "",
      contract_amount: bill.contract_amount || 0,
      prev_paid_amount: bill.prev_paid_amount || 0,
      contract_remaining: bill.contract_remaining || 0,
      payable_remaining: bill.payable_remaining || 0,
      items: bill.items || [],
      items_sum: bill.items_sum || 0,
      adjustment_factor: bill.adjustment_factor || 0,
      total_sum: bill.total_sum || 0,
      deductions: bill.deductions || 0,
      payable_amount: bill.payable_amount || 0,
    });
    setShowSearchModal(false);
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    try {
      const updated = { ...form, status: "تایید شده" };
      const res = await api.put(`/api/progress-bills/${selectedId}`, updated);
      if (res.data?.success) {
        setForm(updated);
        alert("وضعیت صورت وضعیت به 'تایید شده' تغییر یافت.");
        fetchBills();
      }
    } catch (err) {
      console.error("Error approving bill:", err);
    }
  };

  const handlePay = async () => {
    if (!selectedId) return;
    try {
      const updated = { ...form, status: "پرداخت شده" };
      const res = await api.put(`/api/progress-bills/${selectedId}`, updated);
      if (res.data?.success) {
        setForm(updated);
        alert("وضعیت صورت وضعیت به 'پرداخت شده' تغییر یافت.");
        fetchBills();
      }
    } catch (err) {
      console.error("Error paying bill:", err);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const itemsHtml = form.items.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${idx + 1}</td>
        <td style="text-align: right; border: 1px solid #ccc; padding: 6px;">${item.description}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.unit}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.quantity}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${Number(item.unit_price).toLocaleString()}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${Number(item.total_amount).toLocaleString()}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>خلاصه صورت وضعیت شماره ${form.statement_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 25px; line-height: 1.6; }
            h2 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ccc; padding: 6px; }
            th { background-color: #f7f7f7; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 25px; }
            .summary { margin-top: 25px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>خلاصه اطلاعات صورت وضعیت شماره ${form.statement_number}</h2>
          <div class="grid">
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>موضوع قرارداد:</strong> ${form.contract_title}</div>
            <div><strong>طرف قرارداد:</strong> ${form.contractor_name}</div>
            <div><strong>پروژه:</strong> ${form.project}</div>
            <div><strong>تاریخ صورت وضعیت:</strong> ${form.statement_date}</div>
            <div><strong>وضعیت:</strong> ${form.status}</div>
          </div>
          
          <h3>اقلام صورت وضعیت</h3>
          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>شرح</th>
                <th>واحد</th>
                <th>مقدار</th>
                <th>بهای واحد</th>
                <th>مبلغ کل</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml || '<tr><td colspan="6" style="text-align:center;">فاقد قلم کالا</td></tr>'}
            </tbody>
          </table>

          <div class="summary">
            <div>جمع اقلام (الف): ${Number(itemsSum).toLocaleString()} ریال</div>
            <div>جمع کل صورت وضعیت: ${Number(totalSum).toLocaleString()} ریال</div>
            <div>مبلغ قابل پرداخت نهایی: ${Number(payableAmount).toLocaleString()} ریال</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredBills = billsList.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.contract_number || "").toLowerCase().includes(q) ||
      (b.statement_number || "").toLowerCase().includes(q) ||
      (b.contract_title || "").toLowerCase().includes(q) ||
      (b.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر بالایی فرم دقیقا مطابق عکس */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت صورت وضعیت</h1>
            <p className="text-xs text-muted-foreground">ثبت و بررسی صورت وضعیت‌های مالی کارهای انجام شده قراردادها</p>
          </div>
        </div>

        {/* دکمه‌های ابزار بالا */}
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
            onClick={() => handleSave()}
            className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="h-4 w-4" />
            ذخیره
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleApprove}
            disabled={!selectedId || form.status === "تایید شده" || form.status === "پرداخت شده"}
            className="gap-1.5 h-9 text-xs text-blue-500 border-blue-500/20 hover:bg-blue-500/10 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            تایید
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePay}
            disabled={!selectedId || form.status === "پرداخت شده"}
            className="gap-1.5 h-9 text-xs text-purple-500 border-purple-500/20 hover:bg-purple-500/10 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            پرداخت
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearchModal(true)}
            className="gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
          >
            <Search className="h-4 w-4" />
            جستجوی صورت وضعیت
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
        {/* فرم و فیلدها */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex gap-4">
            <button
              onClick={() => setActiveTab("main")}
              className={cn(
                "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                activeTab === "main" ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              اطلاعات اصلی
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={cn(
                "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                activeTab === "files" ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              اسناد و پیوست‌ها
            </button>
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                
                {/* ستون اول - اطلاعات قرارداد و دوره */}
                <div className="space-y-4">
                  <Field label="شماره قرارداد" required>
                    <select
                      value={form.contract_id}
                      onChange={(e) => handleContractChange(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="">انتخاب شماره قرارداد</option>
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
                      className="h-9 text-sm text-right bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="طرف قرارداد">
                    <Input
                      type="text"
                      value={form.contractor_name}
                      readOnly
                      className="h-9 text-sm text-right bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="شماره صورت وضعیت" required>
                    <Input
                      type="text"
                      value={form.statement_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, statement_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono font-bold"
                      placeholder="مانند: ۳"
                    />
                  </Field>

                  <Field label="تاریخ صورت وضعیت" required>
                    <PersianDatePicker
                      value={form.statement_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, statement_date: e.target.value }))}
                    />
                  </Field>

                  <div className="border border-border/60 p-3 rounded-lg space-y-3 bg-muted/5">
                    <span className="text-[11px] font-bold text-muted-foreground">دوره صورت وضعیت</span>
                    <Field label="از تاریخ">
                      <PersianDatePicker
                        value={form.from_date}
                        onChange={(e) => setForm((prev) => ({ ...prev, from_date: e.target.value }))}
                      />
                    </Field>
                    <Field label="تا تاریخ">
                      <PersianDatePicker
                        value={form.to_date}
                        onChange={(e) => setForm((prev) => ({ ...prev, to_date: e.target.value }))}
                      />
                    </Field>
                  </div>

                  <Field label="درصد پیشرفت این دوره" required>
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.progress_percent}
                        onChange={(e) => setForm((prev) => ({ ...prev, progress_percent: Number(e.target.value) }))}
                        className="h-9 text-sm text-center font-mono pl-7"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
                    </div>
                  </Field>

                  <Field label="درصد پیشرفت تجمعی">
                    <div className="relative">
                      <Input
                        type="number"
                        value={Number(form.cumulative_progress) + Number(form.progress_percent)}
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
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right"
                    >
                      <option value="پیش‌نویس">پیش‌نویس</option>
                      <option value="تایید شده">تایید شده</option>
                      <option value="پرداخت شده">پرداخت شده</option>
                      <option value="در انتظار پرداخت">در انتظار پرداخت</option>
                    </select>
                  </Field>
                </div>

                {/* ستون دوم - اعتبارات و مبالغ کلیدی */}
                <div className="space-y-4">
                  <Field label="پروژه">
                    <Input
                      type="text"
                      value={form.project}
                      readOnly
                      className="h-9 text-sm text-right bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="واحد اجرایی">
                    <Input
                      type="text"
                      value={form.executive_unit}
                      readOnly
                      className="h-9 text-sm text-right bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="محل تامین اعتبار">
                    <Input
                      type="text"
                      value={form.credit_source}
                      readOnly
                      className="h-9 text-sm text-right bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="شرح صورت وضعیت">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                    />
                  </Field>

                  <div className="pt-2 space-y-4">
                    <Field label="مبلغ قرارداد (فعلی)">
                      <div className="relative">
                        <Input
                          type="text"
                          value={Number(form.contract_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-sm text-center font-mono pl-10 bg-muted/50 text-muted-foreground"
                          dir="ltr"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                      </div>
                    </Field>

                    <Field label="جمع پرداختی قبلی">
                      <div className="relative">
                        <Input
                          type="text"
                          value={Number(form.prev_paid_amount || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-sm text-center font-mono pl-10 bg-muted/50 text-muted-foreground"
                          dir="ltr"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                      </div>
                    </Field>

                    <Field label="مانده قرارداد">
                      <div className="relative">
                        <Input
                          type="text"
                          value={Number(form.contract_remaining || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-sm text-center font-mono pl-10 bg-muted/50 text-muted-foreground"
                          dir="ltr"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                      </div>
                    </Field>

                    <Field label="مانده قابل پرداخت">
                      <div className="relative">
                        <Input
                          type="text"
                          value={Number(form.payable_remaining || 0).toLocaleString()}
                          readOnly
                          className="h-9 text-sm text-center font-mono pl-10 bg-muted/50 text-muted-foreground"
                          dir="ltr"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ریال</span>
                      </div>
                    </Field>
                  </div>
                </div>

                {/* ستون سوم - بخش راهنما */}
                <div className="space-y-4 hidden lg:block text-right">
                  <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground leading-relaxed">
                    <h4 className="font-bold text-blue-500 mb-2">راهنمای ثبت صورت وضعیت</h4>
                    <p className="mb-2">۱. شماره قرارداد را انتخاب کنید. اطلاعات اعتباری و مبالغ آن به طور خودکار بارگذاری می‌شوند.</p>
                    <p className="mb-2">۲. درصد پیشرفت کار و دوره صورت وضعیت را به دقت وارد نمایید.</p>
                    <p className="mb-2">۳. اقلام ریز کارکردهای این دوره را در جدول پایین وارد کنید. سیستم مبالغ کل و کسور را فوراً محاسبه می‌کند.</p>
                    <p>۴. جهت ثبت نهایی و امکان صدور سند پرداخت، روی دکمه ذخیره کلیک کنید.</p>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "files" && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 border rounded-lg border-dashed">
                <span className="text-3xl block mb-2">📁</span>
                پیوست فایل‌ها و اسناد نقشه‌های کارگاهی صورت وضعیت
                <div className="mt-3 flex justify-center">
                  <Button variant="outline" size="sm" className="text-xs h-8">بارگذاری سند جدید</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* بخش اقلام صورت وضعیت */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
            <span>اقلام صورت وضعیت</span>
            <Button onClick={addItemRow} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px]">
              <Plus className="h-3 w-3" />
              افزودن ردیف جدید
            </Button>
          </div>
          <CardContent className="p-3">
            <div className="overflow-x-auto rounded border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right text-xs w-10">ردیف</TableHead>
                    <TableHead className="text-right text-xs">شرح</TableHead>
                    <TableHead className="text-center text-xs w-28">واحد</TableHead>
                    <TableHead className="text-center text-xs w-24">مقدار</TableHead>
                    <TableHead className="text-center text-xs w-36">بهای واحد (ریال)</TableHead>
                    <TableHead className="text-center text-xs w-44">مبلغ کل (ریال)</TableHead>
                    <TableHead className="text-center text-xs w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs text-center">{idx + 1}</TableCell>
                      <TableCell className="p-1">
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="h-8 text-xs text-right border-none shadow-none focus-visible:ring-1"
                          placeholder="مثال: عملیات خاکبرداری"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          className="h-8 rounded border px-2 text-xs text-right w-full"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="h-8 text-xs text-center font-mono border-none shadow-none"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-center">
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                          className="h-8 text-xs text-center font-mono border-none shadow-none"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-center font-semibold text-blue-500">
                        {Number(item.total_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItemRow(idx)}
                          className="h-7 w-7 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {form.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs py-6 text-muted-foreground">هیچ قلمی ثبت نشده است. دکمه افزودن ردیف را کلیک کنید.</TableCell>
                    </TableRow>
                  )}
                  {/* ردیف جمع کل */}
                  {form.items.length > 0 && (
                    <TableRow className="bg-muted/20 font-bold">
                      <TableCell colSpan={5} className="text-left text-xs pr-4 font-bold">جمع اقلام:</TableCell>
                      <TableCell className="font-mono text-xs text-center text-blue-600 font-extrabold">
                        {Number(itemsSum).toLocaleString()} ریال
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* خلاصه مبلغ صورت وضعیت */}
        <Card className="border-border/80 shadow-sm bg-card">
          <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10 text-right">
            خلاصه مبلغ صورت وضعیت
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
              
              <Field label="جمع اقلام (الف)">
                <div className="relative">
                  <Input
                    type="text"
                    value={Number(itemsSum).toLocaleString()}
                    readOnly
                    className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-muted-foreground"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="ضریب تعدیل (%)">
                <div className="relative">
                  <Input
                    type="number"
                    value={form.adjustment_factor}
                    onChange={(e) => setForm((prev) => ({ ...prev, adjustment_factor: Number(e.target.value) }))}
                    className="h-9 text-xs text-center font-mono pl-6"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                </div>
              </Field>

              <Field label="جمع کل (الف + ب)">
                <div className="relative">
                  <Input
                    type="text"
                    value={Number(totalSum).toLocaleString()}
                    readOnly
                    className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-muted-foreground"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="کسورات">
                <div className="relative">
                  <Input
                    type="number"
                    value={form.deductions}
                    onChange={(e) => setForm((prev) => ({ ...prev, deductions: Number(e.target.value) }))}
                    className="h-9 text-xs text-center font-mono pl-10"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

              <Field label="مبلغ قابل پرداخت">
                <div className="relative font-bold">
                  <Input
                    type="text"
                    value={Number(payableAmount).toLocaleString()}
                    readOnly
                    className="h-9 text-xs text-center font-mono pl-10 bg-muted/40 text-blue-600"
                    dir="ltr"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ریال</span>
                </div>
              </Field>

            </div>
          </CardContent>
        </Card>

      </div>

      {/* مودال جستجوی صورت وضعیت‌ها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست صورت وضعیت‌های ثبت شده</span>
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
                  placeholder="جستجو بر اساس شماره قرارداد، شماره صورت وضعیت، نام طرف قرارداد..."
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
                      <TableHead className="text-center text-xs">شماره صورت وضعیت</TableHead>
                      <TableHead className="text-right text-xs">طرف قرارداد</TableHead>
                      <TableHead className="text-center text-xs">تاریخ</TableHead>
                      <TableHead className="text-center text-xs">مبلغ قابل پرداخت</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((b, idx) => (
                      <TableRow
                        key={b._id}
                        onClick={() => loadBillDetails(b)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{b.contract_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{b.statement_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{b.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{b.statement_date}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(b.payable_amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            b.status === "پرداخت شده" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {b.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredBills.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">صورت وضعیتی یافت نشد.</TableCell>
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
