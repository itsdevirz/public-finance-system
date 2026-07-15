import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Edit, Search, Printer, LogOut, RefreshCw, FileText, AlertCircle, CheckCircle2
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

const TERMINATION_REASONS = [
  { value: "اعمال ماده ۴۸", label: "اعمال ماده ۴۸ شرایط عمومی پیمان" },
  { value: "فقدان بودجه و اعتبارات", label: "فقدان بودجه و اعتبارات طرح" },
  { value: "توافق طرفین", label: "توافق طرفین (اقاله قرارداد)" },
  { value: "قوه قهریه", label: "قوه قهریه (فورس ماژور)" },
  { value: "سایر", label: "سایر علل" },
];

const SETTLEMENT_STATUSES = [
  { value: "تسویه کامل", label: "تسویه کامل مالی" },
  { value: "در حال تسویه", label: "در حال تسویه حساب" },
  { value: "تسویه نشده", label: "تسویه نشده" },
];

const GUARANTEE_REFUND_STATUSES = [
  { value: "مسترد شده", label: "ضمانت‌نامه‌ها مسترد شده" },
  { value: "در جریان استرداد", label: "در جریان آزادسازی/استرداد" },
  { value: "آزاد نشده", label: "آزاد نشده" },
];

const TERMINATION_STATUSES = [
  { value: "پیش‌نویس", label: "پیش‌نویس ابلاغیه" },
  { value: "ابلاغ شده", label: "ابلاغ شده به پیمانکار" },
  { value: "تایید نهایی", label: "تایید نهایی نهایی (تغییر وضعیت قرارداد)" },
];

const INITIAL_FORM = {
  contract_id: "",
  contract_number: "",
  contract_title: "",
  contractor_name: "",
  termination_number: "",
  termination_date: "",
  reason: "اعمال ماده ۴۸",
  work_done_amount: 0,
  settlement_status: "تسویه نشده",
  guarantee_refund_status: "آزاد نشده",
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

export default function ContractTerminationForm() {
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
      const res = await api.get("/api/contract-terminations");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching terminations:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedNumber = async () => {
    try {
      const res = await api.get("/api/contract-terminations/suggest-number");
      if (res.data?.success && res.data.termination_number) {
        setForm((prev) => ({ ...prev, termination_number: res.data.termination_number }));
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
        work_done_amount: 0,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      contract_id: selectedContract._id,
      contract_number: selectedContract.contract_number,
      contract_title: selectedContract.title,
      contractor_name: selectedContract.contractor_name,
      work_done_amount: selectedContract.amount || 0,
      description: `خاتمه قرارداد موضوع ماده ۴۸ شرایط عمومی پیمان ابلاغی به شماره ${prev.termination_number || "..."}`,
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

    if (!form.contract_id || !form.termination_number || !form.termination_date) {
      alert("لطفاً تمامی فیلدهای الزامی (قرارداد، شماره و تاریخ ابلاغ) را پر کنید.");
      return;
    }

    try {
      const payload = {
        ...form,
        work_done_amount: Number(form.work_done_amount) || 0,
      };

      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-terminations/${selectedId}`, payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          fetchContracts(); // refresh status of contract
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-terminations", payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          fetchContracts(); // refresh status of contract
          handleNew();
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error saving contract termination:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert("لطفاً ابتدا رکوردی را جهت حذف انتخاب کنید.");
      return;
    }
    if (!confirm("آیا از حذف این ابلاغیه خاتمه مطمئن هستید؟ این کار وضعیت قرارداد اصلی را مجدداً به فعال تغییر می‌دهد.")) return;

    try {
      const res = await api.delete(`/api/contract-terminations/${selectedId}`);
      if (res.data?.success) {
        alert("خاتمه قرارداد با موفقیت حذف شد و قرارداد مربوطه فعال شد.");
        fetchList();
        fetchContracts();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting contract termination:", err);
      alert(err.response?.data?.message || "خطا در حذف ابلاغیه خاتمه.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setForm({
      contract_id: item.contract_id || "",
      contract_number: item.contract_number || "",
      contract_title: item.contract_title || "",
      contractor_name: item.contractor_name || "",
      termination_number: item.termination_number || "",
      termination_date: item.termination_date || "",
      reason: item.reason || "اعمال ماده ۴۸",
      work_done_amount: item.work_done_amount || 0,
      settlement_status: item.settlement_status || "تسویه نشده",
      guarantee_refund_status: item.guarantee_refund_status || "آزاد نشده",
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
        item.termination_number.includes(search) ||
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">خاتمه قرارداد</h1>
            <p className="text-xs text-muted-foreground">ثبت و مدیریت ابلاغیه‌های خاتمه پیمان‌ها و قراردادهای سازمان (اعمال ماده ۴۸ و اقاله)</p>
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
        {/* فرم ثبت/ویرایش خاتمه قرارداد */}
        <div className="lg:col-span-4">
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/20 flex justify-between items-center">
              <span className="text-xs font-bold text-rose-500">
                {selectedId ? "ویرایش صورت‌جلسه خاتمه" : "ثبت ابلاغیه خاتمه قرارداد جدید"}
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

                <Field label="شماره ابلاغیه / صورت‌جلسه خاتمه" required>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={form.termination_number}
                      onChange={(e) => setForm(prev => ({ ...prev, termination_number: e.target.value }))}
                      placeholder="مثال: TERM-1403-001"
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

                <Field label="تاریخ ابلاغیه خاتمه" required>
                  <PersianDatePicker
                    value={form.termination_date}
                    onChange={(val) => setForm(prev => ({ ...prev, termination_date: val }))}
                  />
                </Field>

                <Field label="علت خاتمه پیمان/قرارداد" required>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TERMINATION_REASONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="مبلغ کارکرد تا تاریخ خاتمه (ریال)">
                  <Input
                    type="number"
                    value={form.work_done_amount}
                    onChange={(e) => setForm(prev => ({ ...prev, work_done_amount: e.target.value }))}
                    placeholder="مبلغ کل کارکرد تجمعی"
                    className="h-10 text-sm text-center font-mono"
                    dir="ltr"
                    min={0}
                  />
                </Field>

                <Field label="وضعیت تسویه‌حساب نهایی" required>
                  <select
                    value={form.settlement_status}
                    onChange={(e) => setForm(prev => ({ ...prev, settlement_status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {SETTLEMENT_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="وضعیت استرداد ضمانت‌نامه‌ها" required>
                  <select
                    value={form.guarantee_refund_status}
                    onChange={(e) => setForm(prev => ({ ...prev, guarantee_refund_status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {GUARANTEE_REFUND_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="وضعیت تایید و سند خاتمه" required>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {TERMINATION_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="توضیحات (تحویل تجهیزات و کارگاه)">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="توضیحات صورت‌جلسه تحویل زمین و کارگاه..."
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
                    <option value="all">همه علت‌های خاتمه</option>
                    {TERMINATION_REASONS.map((opt) => (
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
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">تاریخ خاتمه</TableHead>
                      <TableHead className="w-[14%] text-center text-xs font-bold text-foreground">علت خاتمه</TableHead>
                      <TableHead className="w-[18%] text-center text-xs font-bold text-foreground">مبلغ کارکرد / تسویه</TableHead>
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
                            selectedId === item._id && "bg-rose-500/5 hover:bg-rose-500/10 font-medium"
                          )}
                        >
                          <TableCell className="text-center text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                          <TableCell className="text-center text-xs font-mono font-bold text-blue-600">{item.termination_number}</TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="font-semibold text-foreground">{item.contract_title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">شماره: {item.contract_number} | پیمانکار: {item.contractor_name}</div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">{item.termination_date}</TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground text-[10px]">
                            {TERMINATION_REASONS.find(r => r.value === item.reason)?.label || item.reason}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            <div className="font-mono font-semibold text-rose-600 text-xs">{formatNumber(item.work_done_amount)} ریال</div>
                            <div className="text-[10px] text-muted-foreground mt-1">تسویه: {item.settlement_status}</div>
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {item.status === "تایید نهایی" ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">تایید نهایی</span>
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
