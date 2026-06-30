import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Search, Calendar, Edit } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import api from "@/api";

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground text-right">
        {label}
        {required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function FiscalYearForm() {
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [saved, setSaved] = useState(false);

  const fetchFiscalYears = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/fiscal-years");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading fiscal years:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const handleNew = () => {
    setYear("");
    setTitle("");
    setSelectedId(null);
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!year || !title.trim()) {
      alert("لطفاً تمامی فیلدهای الزامی را پر کنید.");
      return;
    }

    const yrNum = parseInt(year);
    if (isNaN(yrNum) || yrNum < 1000 || yrNum > 9999) {
      alert("سال باید یک عدد ۴ رقمی معتبر باشد (مثلاً ۱۴۰۳)");
      return;
    }

    const payload = {
      year: yrNum,
      title: title.trim(),
    };

    try {
      if (selectedId) {
        const res = await api.put(`/api/fiscal-years/${selectedId}`, payload);
        if (res.data?.success) {
          setList((prev) =>
            prev.map((item) => (item._id === selectedId ? res.data.data : item))
          );
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        const res = await api.post("/api/fiscal-years", payload);
        if (res.data?.success) {
          setList((prev) => [res.data.data, ...prev]);
          setSaved(true);
          handleNew();
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error("Error saving fiscal year:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی دوره مالی");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("آیا از حذف این دوره مالی مطمئن هستید؟")) return;
    try {
      const res = await api.delete(`/api/fiscal-years/${id}`);
      if (res.data?.success) {
        setList((prev) => prev.filter((item) => item._id !== id));
        if (selectedId === id) handleNew();
      }
    } catch (err) {
      console.error("Error deleting fiscal year:", err);
      alert(err.response?.data?.message || "خطا در حذف دوره مالی");
    }
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setYear(item.year.toString());
    setTitle(item.title);
    setSaved(false);
  };

  const filtered = list.filter(
    (item) =>
      !search ||
      item.year.toString().includes(search) ||
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        title="تعریف دوره مالی"
        description="مدیریت و تعریف سال‌های مالی و دوره‌های حسابداری سیستم"
      >
        {saved && (
          <span className="text-sm font-medium text-emerald-600 animate-in fade-in">
            ✓ ثبت شد
          </span>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" dir="rtl">
        {/* فرم ثبت/ویرایش */}
        <div className="lg:col-span-4">
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm font-bold text-foreground">
                  {selectedId ? "ویرایش دوره مالی" : "تعریف دوره مالی جدید"}
                </span>
                {selectedId && (
                  <Button variant="ghost" size="xs" onClick={handleNew} className="text-primary hover:underline">
                    جدید
                  </Button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <Field label="سال مالی" required>
                  <Input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="مثال: ۱۴۰۳"
                    className="h-10 text-sm font-mono text-center"
                    dir="ltr"
                    maxLength={4}
                  />
                </Field>

                <Field label="عنوان دوره" required>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: دوره مالی سال ۱۴۰۳"
                    className="h-10 text-sm"
                  />
                </Field>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    ذخیره اطلاعات
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* لیست رکوردهای ثبت شده */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Card className="border-border shadow-sm flex-1">
            <CardContent className="pt-6">
              {/* بخش جستجو */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو در سال یا عنوان دوره..."
                    className="h-9 pr-9 text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setSearch("")} className="shrink-0">
                  پاک کردن
                </Button>
                <span className="text-xs text-muted-foreground mr-auto shrink-0">
                  {filtered.length} رکورد
                </span>
              </div>

              {/* جدول داده‌ها */}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-bold text-right w-16">ردیف</TableHead>
                      <TableHead className="text-xs font-bold text-center w-28">سال مالی</TableHead>
                      <TableHead className="text-xs font-bold text-right">عنوان دوره</TableHead>
                      <TableHead className="text-xs font-bold text-center w-24">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                          در حال بارگذاری اطلاعات...
                        </TableCell>
                      </TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                          هیچ دوره‌ای ثبت نشده است
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item, idx) => (
                        <TableRow
                          key={item._id}
                          onClick={() => handleRowClick(item)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/40",
                            selectedId === item._id && "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-50"
                          )}
                        >
                          <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-center font-bold text-sm text-blue-600">
                            {item.year}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground text-right">
                            {item.title}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive/80"
                              onClick={(e) => handleDelete(item._id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
