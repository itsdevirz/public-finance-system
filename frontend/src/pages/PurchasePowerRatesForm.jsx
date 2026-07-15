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

const INITIAL_FORM = {
  code: "",
  fiscalYear: "",
  annualRate: "",
  startDate: "",
  endDate: "",
  billTitle: "",
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

export default function PurchasePowerRatesForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [list, setList] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [saved, setSaved] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/purchase-power-rates");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching purchase power rates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiscalYears = async () => {
    try {
      const res = await api.get("/api/fiscal-years");
      if (res.data?.success) {
        setFiscalYears(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          // Set default fiscal year in form if it's empty
          setForm((prev) => ({
            ...prev,
            fiscalYear: prev.fiscalYear || String(res.data.data[0].year),
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching fiscal years:", err);
    }
  };

  const getSuggestedCode = async () => {
    try {
      const res = await api.get("/api/purchase-power-rates/suggest-code");
      if (res.data?.success && res.data.code) {
        setForm((prev) => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error("Error fetching suggest code:", err);
    }
  };

  useEffect(() => {
    fetchList();
    fetchFiscalYears();
    getSuggestedCode();
  }, []);

  const handleNew = () => {
    const defaultYear = fiscalYears.length > 0 ? String(fiscalYears[0].year) : "";
    setForm({
      ...INITIAL_FORM,
      fiscalYear: defaultYear,
    });
    setSelectedId(null);
    setSaved(false);
    getSuggestedCode();
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!form.code || !form.fiscalYear || form.annualRate === "" || !form.startDate || !form.endDate) {
      alert("لطفاً تمامی فیلدهای الزامی (ستاره‌دار) را پر کنید.");
      return;
    }

    // Basic shamsi date format validation (YYYY/MM/DD)
    const dateRegex = /^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/;
    if (!dateRegex.test(form.startDate) || !dateRegex.test(form.endDate)) {
      alert("فرمت تاریخ شروع و پایان باید به صورت YYYY/MM/DD باشد (مثال: ۱۴۰۳/۰۱/۰۱).");
      return;
    }

    try {
      const payload = {
        ...form,
        fiscalYear: Number(form.fiscalYear),
        annualRate: Number(form.annualRate),
      };

      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/purchase-power-rates/${selectedId}`, payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        // Create mode
        const res = await api.post("/api/purchase-power-rates", payload);
        if (res.data?.success) {
          setSaved(true);
          fetchList();
          handleNew();
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error saving purchase power rate:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert("لطفاً ابتدا رکوردی را جهت حذف انتخاب کنید.");
      return;
    }
    if (!confirm("آیا از حذف این نرخ حفظ قدرت خرید مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/purchase-power-rates/${selectedId}`);
      if (res.data?.success) {
        alert("نرخ با موفقیت حذف شد.");
        fetchList();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting purchase power rate:", err);
      alert(err.response?.data?.message || "خطا در حذف نرخ.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setForm({
      code: item.code || "",
      fiscalYear: item.fiscalYear !== undefined ? String(item.fiscalYear) : "",
      annualRate: item.annualRate !== undefined ? String(item.annualRate) : "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      billTitle: item.billTitle || "",
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
        item.billTitle.toLowerCase().includes(search.toLowerCase()) ||
        item.startDate.includes(search) ||
        item.endDate.includes(search) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchYear = filterYear === "all" || String(item.fiscalYear) === filterYear;

      return matchSearch && matchYear;
    });
  }, [list, search, filterYear]);

  return (
    <PageShell>
      {/* هدر بالای صفحه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">تعریف نرخ حفظ قدرت خرید</h1>
            <p className="text-xs text-muted-foreground">تعریف و مدیریت نرخ‌های سالانه حفظ قدرت خرید اسناد خزانه و بدهی‌های معوق دولت</p>
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
        {/* فرم ثبت/ویرایش نرخ */}
        <div className="lg:col-span-4">
          <Card className="border-border/80 shadow-sm">
            <div className="border-b border-border/80 px-4 py-3 bg-muted/20 flex justify-between items-center">
              <span className="text-xs font-bold text-blue-500">
                {selectedId ? "ویرایش اطلاعات نرخ" : "تعریف نرخ جدید"}
              </span>
              {selectedId && (
                <Button variant="ghost" size="xs" onClick={handleNew} className="text-primary hover:underline h-auto p-0 text-xs">
                  لغو ویرایش
                </Button>
              )}
            </div>

            <CardContent className="pt-5 pb-6">
              <form onSubmit={handleSave} className="space-y-4">
                
                <Field label="کد نرخ" required>
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

                <Field label="سال مالی" required>
                  <select
                    value={form.fiscalYear}
                    onChange={(e) => setForm(prev => ({ ...prev, fiscalYear: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">انتخاب سال مالی</option>
                    {fiscalYears.map((yr) => (
                      <option key={yr._id} value={yr.year}>
                        سال {yr.year}
                      </option>
                    ))}
                    {fiscalYears.length === 0 && (
                      <>
                        <option value="1403">سال ۱۴۰۳</option>
                        <option value="1402">سال ۱۴۰۲</option>
                      </>
                    )}
                  </select>
                </Field>

                <Field label="نرخ سالانه حفظ قدرت خرید (%)" required>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.annualRate}
                    onChange={(e) => setForm(prev => ({ ...prev, annualRate: e.target.value }))}
                    placeholder="مثال: ۲۰.۵"
                    className="h-10 text-sm text-center font-mono"
                    dir="ltr"
                    min={0}
                    max={100}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="تاریخ شروع اعتبار" required>
                    <Input
                      type="text"
                      value={form.startDate}
                      onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      placeholder="۱۴۰۳/۰۱/۰۱"
                      className="h-10 text-sm text-center font-mono"
                      dir="ltr"
                      required
                    />
                  </Field>

                  <Field label="تاریخ پایان اعتبار" required>
                    <Input
                      type="text"
                      value={form.endDate}
                      onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      placeholder="۱۴۰۳/۱۲/۲۹"
                      className="h-10 text-sm text-center font-mono"
                      dir="ltr"
                      required
                    />
                  </Field>
                </div>

                <Field label="عنوان مصوبه / اسناد خزانه مرتبط">
                  <Input
                    type="text"
                    value={form.billTitle}
                    onChange={(e) => setForm(prev => ({ ...prev, billTitle: e.target.value }))}
                    placeholder="مثال: اسناد خزانه اسلامی ۱۴۰۳"
                    className="h-10 text-sm text-right"
                  />
                </Field>

                <Field label="وضعیت" required>
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
                    placeholder="جستجو در کد، تاریخ‌ها، مصوبه و توضیحات..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 pr-9 text-xs text-right"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="h-10 px-3 text-xs rounded-md border border-input bg-background"
                  >
                    <option value="all">همه سال‌های مالی</option>
                    {fiscalYears.map((yr) => (
                      <option key={yr._id} value={String(yr.year)}>
                        سال {yr.year}
                      </option>
                    ))}
                    {fiscalYears.length === 0 && (
                      <>
                        <option value="1403">سال ۱۴۰۳</option>
                        <option value="1402">سال ۱۴۰۲</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* جدول نمایش اطلاعات */}
              <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[8%] text-center text-xs font-bold text-foreground">ردیف</TableHead>
                      <TableHead className="w-[12%] text-center text-xs font-bold text-foreground">کد</TableHead>
                      <TableHead className="w-[15%] text-center text-xs font-bold text-foreground">سال مالی</TableHead>
                      <TableHead className="w-[18%] text-center text-xs font-bold text-foreground">نرخ سالانه (%)</TableHead>
                      <TableHead className="w-[37%] text-right text-xs font-bold text-foreground">بازه اعتبار و مصوبه</TableHead>
                      <TableHead className="w-[10%] text-center text-xs font-bold text-foreground">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2 align-middle"></span>
                          در حال بارگذاری اطلاعات...
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
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
                          <TableCell className="text-center text-xs font-medium text-foreground">سال {item.fiscalYear}</TableCell>
                          <TableCell className="text-center text-xs font-mono font-bold text-blue-600 text-sm">{item.annualRate}%</TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="text-muted-foreground">بازه: {item.startDate} تا {item.endDate}</div>
                            {item.billTitle && (
                              <div className="text-[10px] text-foreground font-medium mt-1">{item.billTitle}</div>
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
