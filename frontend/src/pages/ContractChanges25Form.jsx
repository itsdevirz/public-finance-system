import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Printer, LogOut, CheckCircle2, Search, X, Undo2, AlertCircle, RefreshCw
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

const CHANGE_TYPES = ["افزایش 25 درصد", "کاهش 25 درصد"];
const CALCULATION_BASES = ["مبلغ اولیه قرارداد", "مبلغ فعلی قرارداد"];
const APPROVAL_OPINIONS = ["تایید شده", "مخالفت شده", "نیاز به اصلاح"];
const STATUSES = ["در حال ثبت", "تایید نهایی", "ابطال شده"];
const UNITS = ["متر مربع", "متر مکعب", "کیلوگرم", "نقطه", "عدد", "تن", "دستگاه"];

const INITIAL_FORM = {
  request_number: "",
  request_date: "",
  contract_id: "",
  contract_number: "",
  contract_title: "",
  employer_name: "",
  contractor_name: "",
  execution_location: "",
  project_name: "",

  change_type: "افزایش 25 درصد",
  calculation_base: "مبلغ اولیه قرارداد",
  change_percent: 25,
  base_amount: 0,
  change_amount: 0,
  new_amount: 0,
  description: "",

  items: [],

  approval_opinion: "تایید شده",
  approval_date: "",
  license_number: "",
  license_date: "",
  status: "در حال ثبت",
  approval_remarks: "",
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

export default function ContractChanges25Form() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [changesList, setChangesList] = useState([]);
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

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-changes-25");
      if (res.data?.success) {
        setChangesList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching changes:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-changes-25/suggest-number");
      if (res.data?.success && res.data.request_number) {
        setForm((prev) => ({ ...prev, request_number: res.data.request_number }));
      }
    } catch (err) {
      console.error("Error getting suggested request number:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchChanges();
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
        execution_location: "",
        project_name: "",
        base_amount: 0,
      }));
      return;
    }

    const initAmt = Number(selectedContract.amount || 0);

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contract_title: selectedContract.title,
      employer_name: selectedContract.executive_agency || "اداره کل راه و شهرسازی استان تهران",
      contractor_name: selectedContract.contractor_name,
      execution_location: selectedContract.execution_location || "تهران - منطقه 22",
      project_name: selectedContract.title || "ساختمان اداری مرکزی",
      base_amount: initAmt,
      description: `افزایش حجم کار به میزان ۲۵ درصد مطابق ماده ۲۹ شرایط عمومی پیمان.`,
    }));
  };

  // Compute total changes from grid in real-time
  const gridTotalChangeAmount = useMemo(() => {
    return form.items.reduce((sum, item) => sum + (Number(item.change_amount) || 0), 0);
  }, [form.items]);

  // Compute calculated base & change values
  const computedValues = useMemo(() => {
    const baseAmt = Number(form.base_amount || 0);
    const pct = Number(form.change_percent || 0);
    
    // Default calculated change is from percent if grid is empty, otherwise grid sum
    const calcChange = form.items.length > 0 ? gridTotalChangeAmount : Math.round(baseAmt * pct / 100);
    
    let newAmt = baseAmt;
    if (form.change_type === "کاهش 25 درصد") {
      newAmt = baseAmt - calcChange;
    } else {
      newAmt = baseAmt + calcChange;
    }

    return {
      change_amount: calcChange,
      new_amount: newAmt,
    };
  }, [form.base_amount, form.change_percent, form.change_type, form.items, gridTotalChangeAmount]);

  // Sync computed stats into state
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      change_amount: computedValues.change_amount,
      new_amount: computedValues.new_amount,
    }));
  }, [computedValues]);

  // Grid items changes handlers
  const handleItemChange = (index, field, value) => {
    setForm((prev) => {
      const list = [...prev.items];
      const item = { ...list[index], [field]: value };
      
      // Calculate quantities and amount in real time
      if (field === "initial_quantity" || field === "change_percent") {
        const initQty = Number(item.initial_quantity || 0);
        const pct = Number(item.change_percent || 0);
        const qtyChange = Math.round(initQty * pct / 100);
        item.change_quantity = qtyChange;
        
        if (prev.change_type === "کاهش 25 درصد") {
          item.new_quantity = Math.max(0, initQty - qtyChange);
        } else {
          item.new_quantity = initQty + qtyChange;
        }
      }
      
      list[index] = item;
      return { ...prev, items: list };
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { row_num: prev.items.length + 1, description: "", unit: "متر مربع", initial_quantity: 0, change_percent: 25, change_quantity: 0, new_quantity: 0, change_amount: 0 },
      ],
    }));
  };

  const deleteItemRow = (index) => {
    setForm((prev) => {
      const list = prev.items.filter((_, idx) => idx !== index).map((item, idx) => ({
        ...item,
        row_num: idx + 1,
      }));
      return { ...prev, items: list };
    });
  };

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    getSuggestedNumber();
    setActiveTab("main");
  };

  const handleSave = async () => {
    const { contract_id, request_number, request_date, change_type } = form;
    if (!contract_id || !request_number || !request_date || !change_type) {
      alert("لطفاً فیلدهای الزامی (قرارداد، شماره درخواست، نوع تغییر و تاریخ) را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        const res = await api.put(`/api/contract-changes-25/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات تغییرات ۲۵ درصد با موفقیت بروزرسانی شد.");
          fetchChanges();
        }
      } else {
        const res = await api.post("/api/contract-changes-25", form);
        if (res.data?.success) {
          alert("درخواست تغییرات ۲۵ درصد با موفقیت ثبت گردید.");
          fetchChanges();
          setSelectedId(res.data.data._id);
        }
      }
    } catch (err) {
      console.error("Error saving change request:", err);
      alert(err.response?.data?.message || "خطا در ثبت اطلاعات تغییرات ۲۵ درصد.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("آیا از حذف این درخواست تغییرات مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-changes-25/${selectedId}`);
      if (res.data?.success) {
        alert("درخواست تغییرات حذف شد.");
        fetchChanges();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting change request:", err);
      alert(err.response?.data?.message || "خطا در حذف درخواست تغییرات.");
    }
  };

  const loadChangeDetails = (doc) => {
    setSelectedId(doc._id);
    setForm({
      request_number: doc.request_number || "",
      request_date: doc.request_date || "",
      contract_id: doc.contract_id || "",
      contract_number: doc.contract_number || "",
      contract_title: doc.contract_title || "",
      employer_name: doc.employer_name || "",
      contractor_name: doc.contractor_name || "",
      execution_location: doc.execution_location || "",
      project_name: doc.project_name || "",
      change_type: doc.change_type || "افزایش 25 درصد",
      calculation_base: doc.calculation_base || "مبلغ اولیه قرارداد",
      change_percent: doc.change_percent || 25,
      base_amount: doc.base_amount || 0,
      change_amount: doc.change_amount || 0,
      new_amount: doc.new_amount || 0,
      description: doc.description || "",
      items: doc.items || [],
      approval_opinion: doc.approval_opinion || "تایید شده",
      approval_date: doc.approval_date || "",
      license_number: doc.license_number || "",
      license_date: doc.license_date || "",
      status: doc.status || "در حال ثبت",
      approval_remarks: doc.approval_remarks || "",
    });
    setShowSearchModal(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>رسید تغییرات ۲۵ درصد - ${form.request_number}</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 11px; margin: 30px; line-height: 1.6; }
            h2 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <h2>رسید ثبت افزایش/کاهش ۲۵ درصد قرارداد</h2>
          <div class="grid">
            <div><strong>شماره درخواست:</strong> ${form.request_number}</div>
            <div><strong>تاریخ درخواست:</strong> ${form.request_date}</div>
            <div><strong>نوع تغییر:</strong> ${form.change_type}</div>
            <div><strong>شماره قرارداد:</strong> ${form.contract_number}</div>
            <div><strong>مبلغ تغییر:</strong> ${Number(form.change_amount).toLocaleString()} ریال</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredChanges = changesList.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.request_number || "").toLowerCase().includes(q) ||
      (c.contract_number || "").toLowerCase().includes(q) ||
      (c.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر ابزارهای فرم */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">ثبت افزایش و کاهش ۲۵ درصد تغییرات</h1>
            <p className="text-xs text-muted-foreground">ثبت ابلاغ متمم‌های افزایش یا کاهش مقادیر تا سقف ۲۵ درصد مبلغ اولیه پیمان</p>
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
            onClick={handleNew}
            className="gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            ذخیره و جدید
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
            onClick={() => {}}
            disabled={!selectedId}
            className="gap-1.5 h-9 text-xs text-blue-500 border-blue-500/20 hover:bg-blue-500/10 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            بررسی و تایید
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
            onClick={() => setShowSearchModal(true)}
            className="gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
          >
            <Search className="h-4 w-4" />
            جستجوی درخواست
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
        <div className="mb-5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 text-sm text-right flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-bold">هیچ قراردادی در سیستم یافت نشد!</p>
              <p className="text-xs opacity-90 mt-0.5">برای ثبت درخواست تغییرات ۲۵ درصد، ابتدا باید حداقل یک قرارداد ثبت شده باشد.</p>
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
        {/* بدنه اصلی فرم */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex flex-wrap gap-4">
            {["main", "attachments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                  activeTab === tab ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "main" && "اطلاعات اصلی"}
                {tab === "attachments" && "اسناد و پیوست‌ها"}
              </button>
            ))}
          </div>

          <CardContent className="pt-6 pb-6">
            {activeTab === "main" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
                
                {/* ستون راست - اطلاعات درخواست */}
                <div className="space-y-4 lg:col-span-1">
                  <Field label="شماره درخواست">
                    <Input
                      type="text"
                      value={form.request_number}
                      onChange={(e) => setForm((prev) => ({ ...prev, request_number: e.target.value }))}
                      className="h-9 text-sm text-center font-mono font-bold"
                      dir="ltr"
                    />
                  </Field>

                  <Field label="تاریخ درخواست">
                    <PersianDatePicker
                      value={form.request_date}
                      onChange={(e) => setForm((prev) => ({ ...prev, request_date: e.target.value }))}
                    />
                  </Field>

                  <Field label="قرارداد">
                    <select
                      value={form.contract_id}
                      onChange={(e) => handleContractChange(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right focus:ring-1 focus:ring-ring"
                    >
                      <option value="">انتخاب قرارداد...</option>
                      {contracts.map((c) => (
                        <option key={c._id} value={c._id}>{c.contract_number} ({c.title})</option>
                      ))}
                    </select>
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

                  <Field label="محل اجرا">
                    <Input
                      type="text"
                      value={form.execution_location}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>

                  <Field label="دستگاه/پروژه">
                    <Input
                      type="text"
                      value={form.project_name}
                      readOnly
                      className="h-9 text-sm bg-muted/50 text-muted-foreground"
                    />
                  </Field>
                </div>

                {/* ستون وسط - جزئیات درصد و محاسبات */}
                <div className="space-y-4 lg:col-span-1">
                  <Field label="نوع تغییر">
                    <select
                      value={form.change_type}
                      onChange={(e) => setForm((prev) => ({ ...prev, change_type: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right focus:ring-1 focus:ring-ring"
                    >
                      {CHANGE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="مبنای محاسبه">
                    <select
                      value={form.calculation_base}
                      onChange={(e) => setForm((prev) => ({ ...prev, calculation_base: e.target.value }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-right focus:ring-1 focus:ring-ring"
                    >
                      {CALCULATION_BASES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="درصد تغییر">
                    <div className="relative">
                      <Input
                        type="number"
                        value={form.change_percent}
                        onChange={(e) => setForm((prev) => ({ ...prev, change_percent: Number(e.target.value) }))}
                        className="h-9 text-sm text-center font-mono font-bold"
                        dir="ltr"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                    </div>
                  </Field>

                  <Field label="مبلغ مبنا (ریال)">
                    <Input
                      type="text"
                      value={Number(form.base_amount || 0).toLocaleString()}
                      readOnly
                      className="h-9 text-sm font-mono text-center bg-background/50"
                    />
                  </Field>

                  <Field label="مبلغ تغییر (ریال)">
                    <Input
                      type="text"
                      value={Number(form.change_amount || 0).toLocaleString()}
                      readOnly
                      className="h-9 text-sm font-mono text-center bg-emerald-50 text-emerald-600 border-emerald-200/50 font-bold"
                    />
                  </Field>

                  <Field label="مبلغ جدید (ریال)">
                    <Input
                      type="text"
                      value={Number(form.new_amount || 0).toLocaleString()}
                      readOnly
                      className="h-9 text-sm font-mono text-center bg-background/50 font-bold text-blue-600"
                    />
                  </Field>

                  <Field label="شرح تغییر">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </Field>
                </div>

                {/* ستون چپ - پنل راهنمای ۲۵ درصد */}
                <div className="lg:col-span-1" dir="rtl">
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-right space-y-3">
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-xs">
                      <AlertCircle className="h-4 w-4" />
                      <span>راهنما</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-6">
                      طبق ماده ۲۹ شرایط عمومی پیمان، جمع تغییرات مقادیر کار (افزایش یا کاهش) نباید از ۲۵ درصد مبلغ اولیه پیمان تجاوز کند. 
                      تغییرات بیشتر از ۲۵ درصد مستلزم انعقاد متمم قرارداد یا الحاقیه و در صورت لزوم، تایید کارفرما و تصویب مراجع ذی‌صلاح قانونی خواهد بود.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {activeTab !== "main" && (
              <div className="py-8 text-center text-xs text-muted-foreground bg-muted/5 border rounded-lg border-dashed">
                اسناد و پیوست‌های مربوط به ابلاغیه افزایش و کاهش ۲۵ درصد را در این قسمت آپلود و مدیریت نمایید.
              </div>
            )}
          </CardContent>
        </Card>

        {/* بخش پایین - جداول جزئیات و محاسبه تغییرات */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" dir="rtl">
          
          {/* جدول جزئیات تغییرات */}
          <Card className="border-border/80 shadow-sm xl:col-span-2 text-right">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/10 font-bold text-xs text-right flex justify-between items-center">
              <span>جزئیات تغییرات</span>
              <Button onClick={addItemRow} size="xs" variant="outline" className="text-blue-500 gap-1 border-blue-500/20 text-[10px] h-7">
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
                      <TableHead className="text-center text-xs py-2 w-16">واحد</TableHead>
                      <TableHead className="text-center text-xs py-2 w-16">مقدار اولیه</TableHead>
                      <TableHead className="text-center text-xs py-2 w-16">درصد تغییر</TableHead>
                      <TableHead className="text-center text-xs py-2 w-16">مقدار تغییر</TableHead>
                      <TableHead className="text-center text-xs py-2 w-16">مقدار جدید</TableHead>
                      <TableHead className="text-center text-xs py-2 w-28">مبلغ تغییر (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2 w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-[11px] py-1 text-center">{idx + 1}</TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            className="h-8 text-[11px] text-right border-none shadow-none focus-visible:ring-1"
                            placeholder="شرح آیتم"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
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
                            value={item.initial_quantity}
                            onChange={(e) => handleItemChange(idx, "initial_quantity", Number(e.target.value))}
                            className="h-8 text-center font-mono text-[11px] border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.change_percent}
                            onChange={(e) => handleItemChange(idx, "change_percent", Number(e.target.value))}
                            className="h-8 text-center font-mono text-[11px] border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-center">{item.change_quantity}</TableCell>
                        <TableCell className="font-mono text-[11px] text-center">{item.new_quantity}</TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            value={item.change_amount || ""}
                            onChange={(e) => handleItemChange(idx, "change_amount", Number(e.target.value))}
                            className="h-8 text-center font-mono text-[11px] border-none shadow-none"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItemRow(idx)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-xs py-4 text-muted-foreground">ردیفی ثبت نشده است.</TableCell>
                      </TableRow>
                    )}
                    {form.items.length > 0 && (
                      <TableRow className="bg-muted/20 font-bold">
                        <TableCell colSpan={7} className="text-left text-xs pr-4 font-bold">جمع کل:</TableCell>
                        <TableCell className="font-mono text-xs text-center text-blue-600 font-extrabold">
                          {Number(gridTotalChangeAmount).toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* خلاصه محاسبه تغییرات */}
          <Card className="border-border/80 shadow-sm text-right bg-card xl:col-span-1 flex flex-col justify-between">
            <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10">
              محاسبه تغییرات
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">مبلغ اولیه قرارداد:</span>
                  <span className="font-mono font-semibold">{Number(form.base_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center text-amber-600 font-bold">
                  <span>درصد تغییر:</span>
                  <span className="font-mono">%{form.change_percent}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-bold">
                  <span>مبلغ تغییر (۲۵٪ از مبلغ اولیه):</span>
                  <span className="font-mono">{Number(form.change_amount).toLocaleString()} ریال</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-blue-600 border-t border-dashed">
                  <span>مبلغ جدید قرارداد:</span>
                  <span className="font-mono">{Number(form.new_amount).toLocaleString()} ریال</span>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-3 text-right text-[11px] text-emerald-600 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="leading-5">
                  محاسبه با موفقیت انجام شد. مبلغ جدید قرارداد با اعمال ۲۵ درصد تغییر محاسبه گردید.
                </p>
              </div>
            </div>
          </Card>

        </div>

        {/* بخش پایین: تایید و تصویب */}
        <Card className="border-border/80 shadow-sm text-right">
          <div className="border-b border-border/80 p-3 font-bold text-xs bg-muted/10">
            تایید و تصویب
          </div>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <Field label="نظر تایید">
              <select
                value={form.approval_opinion}
                onChange={(e) => setForm((prev) => ({ ...prev, approval_opinion: e.target.value }))}
                className="h-9 rounded border w-full text-right focus:ring-1 focus:ring-ring"
              >
                {APPROVAL_OPINIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>

            <Field label="تاریخ تایید">
              <PersianDatePicker
                value={form.approval_date}
                onChange={(e) => setForm((prev) => ({ ...prev, approval_date: e.target.value }))}
              />
            </Field>

            <Field label="شماره نامه/مجوز">
              <Input
                type="text"
                value={form.license_number}
                onChange={(e) => setForm((prev) => ({ ...prev, license_number: e.target.value }))}
                className="h-9 text-sm text-center font-mono"
                dir="ltr"
              />
            </Field>

            <Field label="تاریخ تایید مجوز">
              <PersianDatePicker
                value={form.license_date}
                onChange={(e) => setForm((prev) => ({ ...prev, license_date: e.target.value }))}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="توضیحات">
                <textarea
                  value={form.approval_remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, approval_remarks: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="ملاحظات و توضیحات نهایی تایید ابلاغیه..."
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="وضعیت">
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="h-9 rounded border w-full text-right focus:ring-1 focus:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* مودال جستجوی درخواست‌ها */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl border-border/80 shadow-2xl max-h-[85vh] flex flex-col" dir="rtl">
            <div className="border-b border-border/80 p-4 bg-muted/10 flex justify-between items-center">
              <span className="font-bold text-sm">لیست درخواست‌های ۲۵ درصد تغییرات</span>
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
                  placeholder="جستجو بر اساس شماره درخواست، شماره قرارداد، نام پیمانکار..."
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
                      <TableHead className="text-center text-xs">شماره درخواست</TableHead>
                      <TableHead className="text-center text-xs">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs">نوع تغییر</TableHead>
                      <TableHead className="text-center text-xs">مبلغ تغییر</TableHead>
                      <TableHead className="text-center text-xs">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChanges.map((c, idx) => (
                      <TableRow
                        key={c._id}
                        onClick={() => loadChangeDetails(c)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-xs">{idx + 1}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{c.request_number}</TableCell>
                        <TableCell className="text-center text-xs font-semibold font-mono">{c.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{c.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs">{c.change_type}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{Number(c.change_amount || 0).toLocaleString()} ریال</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                            {c.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredChanges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">درخواستی یافت نشد.</TableCell>
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
