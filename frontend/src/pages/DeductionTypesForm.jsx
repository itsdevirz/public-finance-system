import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Edit, Search, Printer, LogOut, RefreshCw, FileText
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

const DEDUCTION_NATURES = [
  { value: "قانونی", label: "قانونی" },
  { value: "قراردادی", label: "قراردادی" },
  { value: "سپرده", label: "سپرده (حسن انجام کار)" },
  { value: "پیش‌پرداخت", label: "پیش‌پرداخت" },
  { value: "سایر", label: "سایر" },
];

const CALC_METHODS = [
  { value: "درصدی", label: "درصدی" },
  { value: "مبلغ ثابت", label: "مبلغ ثابت" },
];

const INITIAL_FORM = {
  code: "",
  title: "",
  nature: "قانونی",
  calcMethod: "درصدی",
  rate: 0,
  amount: 0,
  moeinAccount: "",
  status: "فعال",
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

export default function DeductionTypesForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterNature, setFilterNature] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [saved, setSaved] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/deduction-types");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching deduction types:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedCode = async () => {
    try {
      const res = await api.get("/api/deduction-types/suggest-code");
      if (res.data?.success && res.data.code) {
        setForm((prev) => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error("Error fetching suggest code:", err);
    }
  };

  const [moeinAccounts, setMoeinAccounts] = useState([]);

  const fetchMoeinAccounts = async () => {
    try {
      const res = await api.get("/api/account-heads?flat=true");
      if (res.data?.success) {
        const filtered = (res.data.data || []).filter(acc => acc.level === "معین");
        setMoeinAccounts(filtered);
      }
    } catch (err) {
      console.error("Error fetching moein accounts:", err);
    }
  };

  useEffect(() => {
    fetchList();
    getSuggestedCode();
    fetchMoeinAccounts();
  }, []);

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    setSaved(false);
    getSuggestedCode();
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!form.code || !form.title.trim()) {
      alert("لطفاً تمامی فیلدهای الزامی (کد و عنوان) را پر کنید.");
      return;
    }

    try {
      const payload = {
        ...form,
        rate: form.calcMethod === "درصدی" ? (Number(form.rate) || 0) : 0,
        amount: form.calcMethod === "مبلغ ثابت" ? (Number(form.amount) || 0) : 0,
      };

      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/deduction-types/${selectedId}`, payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        // Create mode
        const res = await api.post("/api/deduction-types", payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          handleNew();
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error saving deduction type:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert("لطفاً ابتدا رکوردی را جهت حذف انتخاب کنید.");
      return;
    }
    if (!confirm("آیا از حذف این نوع کسورات مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/deduction-types/${selectedId}`);
      if (res.data?.success) {
        alert("نوع کسورات با موفقیت حذف شد.");
        fetchList();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting deduction type:", err);
      alert(err.response?.data?.message || "خطا در حذف نوع کسورات.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setForm({
      code: item.code || "",
      title: item.title || "",
      nature: item.nature || "قانونی",
      calcMethod: item.calcMethod || "درصدی",
      rate: item.rate || 0,
      amount: item.amount || 0,
      moeinAccount: item.moeinAccount || "",
      status: item.status || "فعال",
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
        item.code.includes(search) ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.moeinAccount && item.moeinAccount.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchNature = filterNature === "all" || item.nature === filterNature;
      const matchMethod = filterMethod === "all" || item.calcMethod === filterMethod;

      return matchSearch && matchNature && matchMethod;
    });
  }, [list, search, filterNature, filterMethod]);

  const formatNumber = (num) => {
    if (!num) return "۰";
    return num.toLocaleString("fa-IR");
  };

  return (
    <PageShell>
      {/* هدر بالای صفحه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">تعریف انواع کسورات</h1>
            <p className="text-xs text-muted-foreground">مدیریت و تعریف انواع کسورات قانونی، قراردادی، سپرده‌ها و پیش‌پرداخت‌های قراردادها</p>
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
        {/* فرم ثبت/ویرایش نوع کسور */}
        <div className="lg:col-span-4">
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/20 flex justify-between items-center">
              <span className="text-xs font-bold text-blue-500">
                {selectedId ? "ویرایش اطلاعات نوع کسور" : "تعریف نوع کسور جدید"}
              </span>
              {selectedId && (
                <Button variant="ghost" size="xs" onClick={handleNew} className="text-primary hover:underline h-auto p-0 text-xs">
                  لغو ویرایش
                </Button>
              )}
            </div>

            <CardContent className="pt-5 pb-6">
              <form onSubmit={handleSave} className="space-y-4">
                
                <Field label="کد نوع کسور" required>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.replace(/[^0-9a-zA-Z-]/g, "") }))}
                      placeholder="مثال: 01"
                      className="h-10 text-sm font-mono text-center"
                      dir="ltr"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getSuggestedCode}
                      className="px-2"
                      title="پیشنهاد کد جدید"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </Field>

                <Field label="عنوان کسور" required>
                  <Input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: مالیات تکلیفی پیمانکاران"
                    className="h-10 text-sm text-right"
                    required
                  />
                </Field>

                <Field label="ماهیت کسور" required>
                  <select
                    value={form.nature}
                    onChange={(e) => setForm(prev => ({ ...prev, nature: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {DEDUCTION_NATURES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="روش محاسبه کسور" required>
                  <select
                    value={form.calcMethod}
                    onChange={(e) => setForm(prev => ({ ...prev, calcMethod: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {CALC_METHODS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {form.calcMethod === "درصدی" ? (
                  <Field label="درصد پیش‌فرض (%)" required>
                    <Input
                      type="number"
                      value={form.rate}
                      onChange={(e) => setForm(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      className="h-10 text-sm text-center font-mono"
                      dir="ltr"
                      min={0}
                      max={100}
                    />
                  </Field>
                ) : (
                  <Field label="مبلغ پیش‌فرض (ریال)" required>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className="h-10 text-sm text-center font-mono"
                      dir="ltr"
                      min={0}
                    />
                  </Field>
                )}

                <Field label="حساب معین مرتبط">
                  <select
                    value={form.moeinAccount}
                    onChange={(e) => setForm(prev => ({ ...prev, moeinAccount: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">انتخاب حساب معین مرتبط...</option>
                    {moeinAccounts.map((acc) => (
                      <option key={acc._id} value={`${acc.code} - ${acc.title}`}>
                        {acc.code} - {acc.title}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="وضعیت کسور" required>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="فعال">فعال</option>
                    <option value="غیرفعال">غیرفعال</option>
                  </select>
                </Field>

                <Field label="توضیحات">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="توضیحات اختیاری..."
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
                    placeholder="جستجو در کد، عنوان، معین و توضیحات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pr-9 text-xs text-right"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={filterNature}
                    onChange={(e) => setFilterNature(e.target.value)}
                    className="h-10 px-3 text-xs rounded-md border border-input bg-background"
                  >
                    <option value="all">همه ماهیت‌ها</option>
                    {DEDUCTION_NATURES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="h-10 px-3 text-xs rounded-md border border-input bg-background"
                  >
                    <option value="all">همه روش‌ها</option>
                    {CALC_METHODS.map((opt) => (
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
                      <TableHead className="w-[10%] text-center text-xs font-bold text-foreground">ردیف</TableHead>
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">کد</TableHead>
                      <TableHead className="w-[28%] text-right text-xs font-bold text-foreground">عنوان نوع کسور</TableHead>
                      <TableHead className="w-[15%] text-center text-xs font-bold text-foreground">ماهیت کسور</TableHead>
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">روش محاسبه</TableHead>
                      <TableHead className="w-[13%] text-center text-xs font-bold text-foreground">مقدار پیش‌فرض</TableHead>
                      <TableHead className="w-[10%] text-center text-xs font-bold text-foreground">وضعیت</TableHead>
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
                            selectedId === item._id && "bg-blue-500/5 hover:bg-blue-500/10 font-medium"
                          )}
                        >
                          <TableCell className="text-center text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                          <TableCell className="text-center text-xs font-mono font-bold text-blue-600">{item.code}</TableCell>
                          <TableCell className="text-right text-xs font-medium text-foreground">
                            <div>{item.title}</div>
                            {item.moeinAccount && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">معین: {item.moeinAccount}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">{item.nature}</TableCell>
                          <TableCell className="text-center text-xs">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              item.calcMethod === "درصدی" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {item.calcMethod}
                            </span>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">
                            {item.calcMethod === "درصدی" ? (
                              <span>{item.rate || 0}%</span>
                            ) : (
                              <span>{formatNumber(item.amount)} ریال</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {item.status === "فعال" ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">فعال</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">غیرفعال</span>
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
