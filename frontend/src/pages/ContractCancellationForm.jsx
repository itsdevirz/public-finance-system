import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Edit, Search, Printer, LogOut, RefreshCw, FileText, AlertTriangle, CheckCircle2
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

const CANCELLATION_REASONS = [
  { value: "اعمال ماده ۴۶", label: "اعمال ماده ۴۶ شرایط عمومی پیمان (قصور و تأخیر)" },
  { value: "ورشکستگی پیمانکار", label: "ورشکستگی یا انحلال شرکت پیمانکار" },
  { value: "تخلفات مالی یا واگذاری", label: "تخلفات مالی یا واگذاری پیمان به غیر" },
  { value: "عدم توانایی فنی", label: "عدم توانایی فنی و اجرایی پیمانکار" },
  { value: "سایر", label: "سایر تخلفات و علل قضایی" },
];

const GUARANTEE_CONFISCATION_STATUSES = [
  { value: "ضبط شده", label: "ضمانت‌نامه‌ها ضبط شده است" },
  { value: "در جریان ضبط", label: "در جریان ضبط و وصول بانک" },
  { value: "آزاد شده", label: "مسترد/آزاد شده (تحت ضوابط)" },
  { value: "اقدام نشده", label: "اقدام نشده است" },
];

const LEGAL_CASE_STATUSES = [
  { value: "ثبت در دادگاه", label: "ثبت و طرح دعوی در دادگاه" },
  { value: "در حال داوری", label: "ارجاع به داوری و حل اختلاف" },
  { value: "بدون اقدام", label: "بدون اقدام قضایی" },
  { value: "حل و فصل شده", label: "مختومه و حل و فصل شده" },
];

const CANCELLATION_STATUSES = [
  { value: "پیش‌نویس", label: "پیش‌نویس ابلاغیه" },
  { value: "ابلاغ شده", label: "ابلاغ شده به پیمانکار" },
  { value: "تایید نهایی", label: "تایید نهایی (ابطال و تغییر وضعیت قرارداد)" },
];

const INITIAL_FORM = {
  contract_id: "",
  contract_number: "",
  contract_title: "",
  contractor_name: "",
  cancellation_number: "",
  cancellation_date: "",
  reason: "اعمال ماده ۴۶",
  damages_claimed_amount: 0,
  guarantee_confiscation_status: "اقدام نشده",
  legal_case_status: "بدون اقدام",
  status: "پیش‌نویس",
  description: "",
};

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Label className="text-xs font-semibold text-muted-foreground text-right flex items-center justify-end gap-0.5">
        {required && <span className="text-destructive font-bold">*</span>}
        <span>{label}</span>
      </Label>
      {children}
    </div>
  );
}

export default function ContractCancellationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [contracts, setContracts] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [saved, setSaved] = useState(false);

  const fetchContracts = async () => {
    try {
      const res = await api.get("/api/contracts");
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-cancellations");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching cancellations:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-cancellations/suggest-number");
      if (res.data?.success && res.data.cancellation_number) {
        setForm((prev) => ({ ...prev, cancellation_number: res.data.cancellation_number }));
      }
    } catch (err) {
      console.error("Error fetching suggest code:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchList();
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
        damages_claimed_amount: 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contract_title: selectedContract.title,
      contractor_name: selectedContract.contractor_name,
      description: `فسخ قرارداد موضوع ماده ۴۶ شرایط عمومی پیمان ابلاغی به شماره ${prev.cancellation_number || "..."} به علت قصور پیمانکار.`,
    }));
  };

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    setSaved(false);
    getSuggestedNumber();
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!form.contract_id || !form.cancellation_number || !form.cancellation_date) {
      alert("لطفاً تمامی فیلدهای الزامی (قرارداد، شماره و تاریخ ابلاغ فسخ) را پر کنید.");
      return;
    }

    try {
      const payload = {
        ...form,
        damages_claimed_amount: Number(form.damages_claimed_amount) || 0,
      };

      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-cancellations/${selectedId}`, payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          fetchContracts(); // refresh status of contract
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-cancellations", payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          fetchContracts(); // refresh status of contract
          handleNew();
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error saving contract cancellation:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert("لطفاً ابتدا رکوردی را جهت حذف انتخاب کنید.");
      return;
    }
    if (!confirm("آیا از حذف این ابلاغیه فسخ مطمئن هستید؟ این کار وضعیت قرارداد اصلی را مجدداً به فعال تغییر می‌دهد.")) return;

    try {
      const res = await api.delete(`/api/contract-cancellations/${selectedId}`);
      if (res.data?.success) {
        alert("فسخ قرارداد با موفقیت حذف شد و قرارداد مربوطه فعال شد.");
        fetchList();
        fetchContracts();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting contract cancellation:", err);
      alert(err.response?.data?.message || "خطا در حذف ابلاغیه فسخ.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setForm({
      contract_id: item.contract_id || "",
      contract_number: item.contract_number || "",
      contract_title: item.contract_title || "",
      contractor_name: item.contractor_name || "",
      cancellation_number: item.cancellation_number || "",
      cancellation_date: item.cancellation_date || "",
      reason: item.reason || "اعمال ماده ۴۶",
      damages_claimed_amount: item.damages_claimed_amount || 0,
      guarantee_confiscation_status: item.guarantee_confiscation_status || "اقدام نشده",
      legal_case_status: item.legal_case_status || "بدون اقدام",
      status: item.status || "پیش‌نویس",
      description: item.description || "",
    });
    setSaved(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = useMemo(() => {
    return list.filter((item) => {
      const matchSearch =
        !search ||
        item.contract_number.includes(search) ||
        item.contract_title.toLowerCase().includes(search.toLowerCase()) ||
        item.contractor_name.toLowerCase().includes(search.toLowerCase()) ||
        item.cancellation_number.includes(search) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchReason = filterReason === "all" || item.reason === filterReason;

      return matchSearch && matchReason;
    });
  }, [list, search, filterReason]);

  const formatNumber = (num) => {
    if (!num && num !== 0) return "۰";
    return num.toLocaleString("fa-IR");
  };

  return (
    <PageShell>
      {/* هدر بالای صفحه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">فسخ قرارداد (خلع ید پیمانکار)</h1>
            <p className="text-xs text-muted-foreground">ثبت و مدیریت پرونده‌های فسخ قرارداد، ضبط ضمانت‌نامه‌ها و پیگیری دعاوی حقوقی کارفرمایان</p>
          </div>
        </div>

        {/* دکمه‌های عملیاتی */}
        <div className="flex items-center flex-wrap gap-2">
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 animate-in fade-in ml-3">
              ✓ اطلاعات ذخیره شد
            </span>
          )}

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
            className="gap-1.5 h-9 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("تغییرات را در فیلدهای فرم اعمال کرده و سپس دکمه ذخیره را بزنید.")}
            disabled={!selectedId}
            className="gap-1.5 h-9 text-xs text-amber-500 border-amber-500/20 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit className="h-4 w-4" />
            ویرایش
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave()}
            className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Save className="h-4 w-4" />
            ذخیره اطلاعات
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" dir="rtl">
        {/* فرم ثبت/ویرایش فسخ قرارداد */}
        <div className="lg:col-span-4">
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/20 flex justify-between items-center">
              <span className="text-xs font-bold text-destructive">
                {selectedId ? "ویرایش پرونده فسخ" : "ثبت ابلاغیه فسخ قرارداد جدید"}
              </span>
              {selectedId && (
                <Button variant="ghost" size="xs" onClick={handleNew} className="text-primary hover:underline h-auto p-0 text-xs">
                  لغو ویرایش
                </Button>
              )}
            </div>

            <CardContent className="pt-5 pb-6">
              <form onSubmit={handleSave} className="space-y-4">
                
                <Field label="قرارداد مورد نظر" required>
                  <select
                    value={form.contract_id}
                    onChange={(e) => handleContractChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">انتخاب قرارداد...</option>
                    {contracts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.contract_number} ({c.title}) - پیمانکار: {c.contractor_name}
                      </option>
                    ))}
                  </select>
                </Field>

                {form.contract_id && (
                  <div className="p-3 bg-muted/10 border border-border/80 rounded-lg space-y-2 text-xs text-muted-foreground">
                    <div><span className="font-bold text-foreground">شماره قرارداد:</span> {form.contract_number}</div>
                    <div><span className="font-bold text-foreground">عنوان قرارداد:</span> {form.contract_title}</div>
                    <div><span className="font-bold text-foreground">پیمانکار / طرف قرارداد:</span> {form.contractor_name}</div>
                  </div>
                )}

                <Field label="شماره ابلاغیه فسخ قرارداد" required>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={form.cancellation_number}
                      onChange={(e) => setForm(prev => ({ ...prev, cancellation_number: e.target.value }))}
                      placeholder="مثال: CNCL-1403-001"
                      className="h-10 text-sm font-mono text-center"
                      dir="ltr"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getSuggestedNumber}
                      className="px-2"
                      title="پیشنهاد شماره جدید"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <Field label="تاریخ ابلاغیه فسخ" required>
                  <PersianDatePicker
                    value={form.cancellation_date}
                    onChange={(val) => setForm(prev => ({ ...prev, cancellation_date: val }))}
                  />
                </Field>

                <Field label="علت فسخ قرارداد" required>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {CANCELLATION_REASONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="مبلغ خسارت ادعا شده (ریال)">
                  <Input
                    type="number"
                    value={form.damages_claimed_amount}
                    onChange={(e) => setForm(prev => ({ ...prev, damages_claimed_amount: e.target.value }))}
                    placeholder="مبلغ برآورد خسارت وارده به کارفرما"
                    className="h-10 text-sm text-center font-mono"
                    dir="ltr"
                    min={0}
                  />
                </Field>

                <Field label="وضعیت ضبط ضمانت‌نامه‌ها" required>
                  <select
                    value={form.guarantee_confiscation_status}
                    onChange={(e) => setForm(prev => ({ ...prev, guarantee_confiscation_status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {GUARANTEE_CONFISCATION_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="وضعیت پرونده حقوقی/قضایی" required>
                  <select
                    value={form.legal_case_status}
                    onChange={(e) => setForm(prev => ({ ...prev, legal_case_status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {LEGAL_CASE_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="وضعیت تایید و سند فسخ" required>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CANCELLATION_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="توضیحات (جزئیات خلع ید و تامین دلیل)">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="توضیحات مربوط به تامین دلیل دادگاه و خلع ید موقت..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-right resize-none"
                  />
                </Field>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* لیست رکوردهای ثبت شده */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card className="border-border/80 shadow-sm flex-1">
            <CardContent className="pt-6">
              {/* کادر فیلتر و جستجو */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="جستجو در شماره، قرارداد، پیمانکار و توضیحات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pr-9 text-xs text-right"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={filterReason}
                    onChange={(e) => setFilterReason(e.target.value)}
                    className="h-10 px-3 text-xs rounded-md border border-input bg-background"
                  >
                    <option value="all">همه علت‌های فسخ</option>
                    {CANCELLATION_REASONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* جدول نمایش اطلاعات */}
              <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[6%] text-center text-xs font-bold text-foreground">ردیف</TableHead>
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">شماره ابلاغیه</TableHead>
                      <TableHead className="w-[26%] text-right text-xs font-bold text-foreground">مشخصات قرارداد</TableHead>
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">تاریخ فسخ</TableHead>
                      <TableHead className="w-[14%] text-center text-xs font-bold text-foreground">علت فسخ</TableHead>
                      <TableHead className="w-[18%] text-center text-xs font-bold text-foreground">ادعای خسارت / ضمانت‌نامه</TableHead>
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2 align-middle"></span>
                          در حال بارگذاری اطلاعات...
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                          هیچ موردی یافت نشد.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item, idx) => (
                        <TableRow
                          key={item._id}
                          onClick={() => handleRowClick(item)}
                          className={cn(
                            "cursor-pointer hover:bg-muted/40 transition-colors",
                            selectedId === item._id && "bg-destructive/5 hover:bg-destructive/10 font-medium"
                          )}
                        >
                          <TableCell className="text-center text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                          <TableCell className="text-center text-xs font-mono font-bold text-red-600">{item.cancellation_number}</TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="font-semibold text-foreground">{item.contract_title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">شماره: {item.contract_number} | پیمانکار: {item.contractor_name}</div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">{item.cancellation_date}</TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground text-[10px]">
                            {CANCELLATION_REASONS.find(r => r.value === item.reason)?.label || item.reason}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <div className="font-mono font-semibold text-red-600 text-xs">{formatNumber(item.damages_claimed_amount)} ریال</div>
                            <div className="text-[10px] text-muted-foreground mt-1">ضمانت‌نامه: {item.guarantee_confiscation_status}</div>
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {item.status === "تایید نهایی" ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">تایید نهایی</span>
                            ) : item.status === "ابلاغ شده" ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">ابلاغ شده</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">پیش‌نویس</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* خلاصه تعداد */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-4" dir="rtl">
                <span>تعداد کل رکوردها: {filtered.length} مورد</span>
                <span>برای ویرایش یا حذف روی هر ردیف کلیک کنید.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
