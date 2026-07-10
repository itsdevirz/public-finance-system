import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save, Plus, Trash2, Edit, Search, Printer, LogOut, RefreshCw, SlidersHorizontal
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

const BANKS_LIST = [
  { value: "", label: "انتخاب بانک" },
  { value: "بانک ملی ایران", label: "بانک ملی ایران" },
  { value: "بانک ملت", label: "بانک ملت" },
  { value: "بانک صادرات", label: "بانک صادرات" },
  { value: "بانک تجارت", label: "بانک تجارت" },
  { value: "بانک سپه", label: "بانک سپه" },
  { value: "بانک رفاه", label: "بانک رفاه" },
  { value: "بانک مسکن", label: "بانک مسکن" },
  { value: "بانک پارسیان", label: "بانک پارسیان" },
  { value: "بانک پاسارگاد", label: "بانک پاسارگاد" },
];

const INITIAL_FORM = {
  code: "",
  personType: "حقوقی",
  name: "",
  nationalId: "",
  registrationNumber: "",
  ceoName: "",
  status: "فعال",
  phone: "",
  mobile: "",
  email: "",
  address: "",
  postalCode: "",
  bankName: "",
  accountNumber: "",
  sheba: "",
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

export default function ContractPartiesForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState("list"); // "list" | "details"
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-parties");
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching contract parties:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedCode = async () => {
    try {
      const res = await api.get("/api/contract-parties/suggest-code");
      if (res.data?.success && res.data.code) {
        setForm((prev) => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error("Error fetching suggest code:", err);
    }
  };

  useEffect(() => {
    fetchList();
    getSuggestedCode();
  }, []);

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    getSuggestedCode();
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const { code, personType, name, nationalId, status } = form;
    if (!code || !name.trim() || !nationalId.trim()) {
      alert("لطفاً فیلدهای ستاره‌دار الزامی را پر کنید.");
      return;
    }

    try {
      if (selectedId) {
        // Edit mode
        const res = await api.put(`/api/contract-parties/${selectedId}`, form);
        if (res.data?.success) {
          alert("اطلاعات طرف قرارداد با موفقیت به‌روزرسانی شد.");
          fetchList();
        }
      } else {
        // Create mode
        const res = await api.post("/api/contract-parties", form);
        if (res.data?.success) {
          alert("طرف قرارداد جدید با موفقیت ثبت شد.");
          fetchList();
          handleNew();
        }
      }
    } catch (err) {
      console.error("Error saving contract party:", err);
      alert(err.response?.data?.message || "خطا در ذخیره‌سازی اطلاعات.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      alert("لطفاً ابتدا رکوردی را جهت حذف انتخاب کنید.");
      return;
    }
    if (!confirm("آیا از حذف این طرف قرارداد مطمئن هستید؟")) return;

    try {
      const res = await api.delete(`/api/contract-parties/${selectedId}`);
      if (res.data?.success) {
        alert("طرف قرارداد با موفقیت حذف شد.");
        fetchList();
        handleNew();
      }
    } catch (err) {
      console.error("Error deleting contract party:", err);
      alert(err.response?.data?.message || "خطا در حذف طرف قرارداد.");
    }
  };

  const handleRowClick = (item) => {
    setSelectedId(item._id);
    setForm({
      code: item.code || "",
      personType: item.personType || "حقوقی",
      name: item.name || "",
      nationalId: item.nationalId || "",
      registrationNumber: item.registrationNumber || "",
      ceoName: item.ceoName || "",
      status: item.status || "فعال",
      phone: item.phone || "",
      mobile: item.mobile || "",
      email: item.email || "",
      address: item.address || "",
      postalCode: item.postalCode || "",
      bankName: item.bankName || "",
      accountNumber: item.accountNumber || "",
      sheba: item.sheba || "",
    });
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const listHtml = filtered.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${idx + 1}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.code}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.personType}</td>
        <td style="text-align: right; border: 1px solid #ccc; padding: 6px;">${item.name}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.nationalId}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.registrationNumber || "-"}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.phone || "-"}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${item.status}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>گزارش طرفین قرارداد</title>
          <style>
            body { font-family: Tahoma, sans-serif; font-size: 12px; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f5f5f5; border: 1px solid #ccc; padding: 8px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print()">
          <h2 style="text-align: center;">لیست طرفین قرارداد</h2>
          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>کد طرف قرارداد</th>
                <th>نوع شخص</th>
                <th>نام شرکت / شخص</th>
                <th>شناسه ملی</th>
                <th>شماره ثبت</th>
                <th>تلفن</th>
                <th>وضعیت</th>
              </tr>
            </thead>
            <tbody>
              ${listHtml || '<tr><td colspan="8" style="text-align: center; padding: 15px;">داده‌ای یافت نشد</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtering
  const filtered = useMemo(() => {
    return list.filter((item) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const codeMatch = (item.code || "").toLowerCase().includes(term);
      const nameMatch = (item.name || "").toLowerCase().includes(term);
      const nationalIdMatch = (item.nationalId || "").toLowerCase().includes(term);
      const regMatch = (item.registrationNumber || "").toLowerCase().includes(term);

      if (searchField === "code") return codeMatch;
      if (searchField === "name") return nameMatch;
      if (searchField === "nationalId") return nationalIdMatch;
      if (searchField === "registrationNumber") return regMatch;

      return codeMatch || nameMatch || nationalIdMatch || regMatch;
    });
  }, [list, search, searchField]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <PageShell>
      {/* هدر بالای فرم دقیقا مطابق عکس */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">تعریف طرف قرارداد</h1>
            <p className="text-xs text-muted-foreground">مدیریت اطلاعات اشخاص حقیقی و حقوقی طرف قراردادها</p>
          </div>
        </div>

        {/* دکمه‌های عملیاتی بالا */}
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
            className="gap-1.5 h-9 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("تغییرات را در فیلدهای زیر اعمال کرده و سپس دکمه ذخیره را بزنید.")}
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
            ذخیره
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

      <div className="grid grid-cols-1 gap-6" dir="rtl">
        {/* بخش اطلاعات اصلی فرم */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-2 bg-muted/20 flex">
            <span className="text-xs font-bold text-blue-500 border-b-2 border-blue-500 pb-2 pt-1 px-1">
              اطلاعات اصلی
            </span>
          </div>

          <CardContent className="pt-5 pb-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              
              {/* ستون راست */}
              <div className="space-y-4">
                <Field label="کد طرف قرارداد" required>
                  <Input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    placeholder="مثال: ۱۴۰۳-۰۰۰۱۵"
                  />
                </Field>

                <Field label="نوع شخص" required>
                  <select
                    value={form.personType}
                    onChange={(e) => setForm((prev) => ({ ...prev, personType: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                  >
                    <option value="حقوقی">حقوقی</option>
                    <option value="حقیقی">حقیقی</option>
                  </select>
                </Field>

                <Field label="نام شرکت / شخص" required>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-9 text-sm text-right"
                    placeholder="نام کامل یا نام شرکت"
                  />
                </Field>

                <Field label="شناسه ملی" required>
                  <Input
                    type="text"
                    value={form.nationalId}
                    onChange={(e) => setForm((prev) => ({ ...prev, nationalId: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    maxLength={11}
                    placeholder="۱۰ یا ۱۱ رقم"
                  />
                </Field>

                <Field label="شماره ثبت">
                  <Input
                    type="text"
                    value={form.registrationNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, registrationNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    placeholder="شماره ثبت شرکت"
                  />
                </Field>

                <Field label="نام مدیرعامل">
                  <Input
                    type="text"
                    value={form.ceoName}
                    onChange={(e) => setForm((prev) => ({ ...prev, ceoName: e.target.value }))}
                    className="h-9 text-sm text-right"
                    placeholder="نام و نام خانوادگی مدیرعامل"
                  />
                </Field>

                <Field label="وضعیت" required>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
                  >
                    <option value="فعال">فعال</option>
                    <option value="غیرفعال">غیرفعال</option>
                  </select>
                </Field>
              </div>

              {/* ستون چپ */}
              <div className="space-y-4">
                <Field label="شماره تماس">
                  <Input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    placeholder="مثال: ۰۲۱-۸۸۵۵۶۶۷۷"
                  />
                </Field>

                <Field label="تلفن همراه">
                  <Input
                    type="text"
                    value={form.mobile}
                    onChange={(e) => setForm((prev) => ({ ...prev, mobile: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    maxLength={11}
                    placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
                  />
                </Field>

                <Field label="ایمیل">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    placeholder="info@domain.com"
                  />
                </Field>

                <Field label="آدرس">
                  <Input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="h-9 text-sm text-right"
                    placeholder="نشانی پستی محل سکونت یا شرکت"
                  />
                </Field>

                <Field label="کدپستی">
                  <Input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value.replace(/[^0-9]/g, "") }))}
                    className="h-9 text-sm text-center font-mono"
                    dir="ltr"
                    maxLength={10}
                    placeholder="۱۰ رقم بدون خط تیره"
                  />
                </Field>

                {/* جداکننده */}
                <hr className="border-t border-border/80 my-4" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <Field label="نام بانک">
                      <select
                        value={form.bankName}
                        onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm text-right"
                      >
                        {BANKS_LIST.map((b) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="sm:col-span-1">
                    <Field label="شماره حساب">
                      <Input
                        type="text"
                        value={form.accountNumber}
                        onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                        className="h-9 text-sm text-center font-mono"
                        dir="ltr"
                        placeholder="شماره حساب"
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-1">
                    <Field label="شماره شبا">
                      <Input
                        type="text"
                        value={form.sheba}
                        onChange={(e) => setForm((prev) => ({ ...prev, sheba: e.target.value }))}
                        className="h-9 text-sm text-center font-mono"
                        dir="ltr"
                        placeholder="IR000000..."
                      />
                    </Field>
                  </div>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* بخش لیست و جدول در پایین */}
        <Card className="border-border/80 shadow-sm">
          <div className="border-b border-border/80 px-4 py-1.5 bg-muted/20 flex gap-4">
            <button
              onClick={() => setActiveSubTab("list")}
              className={cn(
                "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                activeSubTab === "list" ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              لیست طرف قراردادها
            </button>
            <button
              onClick={() => setActiveSubTab("details")}
              className={cn(
                "text-xs font-bold pb-2 pt-1.5 px-1 transition-all",
                activeSubTab === "details" ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground hover:text-foreground"
              )}
            >
              جزئیات
            </button>
          </div>

          <CardContent className="pt-4">
            {activeSubTab === "list" ? (
              <div className="space-y-4">
                {/* ابزارهای جستجو و فیلتر */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 w-full relative">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="جستجو در کد، نام، شناسه ملی، شماره ثبت ..."
                      className="h-9 pr-9 text-xs text-right w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={searchField}
                      onChange={(e) => setSearchField(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-right"
                    >
                      <option value="all">همه فیلدها</option>
                      <option value="code">کد طرف قرارداد</option>
                      <option value="name">نام شرکت / شخص</option>
                      <option value="nationalId">شناسه ملی</option>
                      <option value="registrationNumber">شماره ثبت</option>
                    </select>

                    <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      تنظیم فیلتر
                    </Button>

                    <Button variant="outline" size="icon" onClick={fetchList} className="h-9 w-9">
                      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    </Button>
                  </div>
                </div>

                {/* جدول طرفین قرارداد */}
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-bold text-right w-12">ردیف</TableHead>
                        <TableHead className="text-xs font-bold text-center w-36">کد طرف قرارداد*</TableHead>
                        <TableHead className="text-xs font-bold text-center w-24">نوع شخص</TableHead>
                        <TableHead className="text-xs font-bold text-right">نام شرکت / شخص</TableHead>
                        <TableHead className="text-xs font-bold text-center w-32">شناسه ملی</TableHead>
                        <TableHead className="text-xs font-bold text-center w-28">شماره ثبت</TableHead>
                        <TableHead className="text-xs font-bold text-center w-32">تلفن</TableHead>
                        <TableHead className="text-xs font-bold text-center w-24">وضعیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                            در حال بارگذاری اطلاعات...
                          </TableCell>
                        </TableRow>
                      ) : paginatedList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                            هیچ اطلاعاتی یافت نشد.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedList.map((item, idx) => {
                          const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                          return (
                            <TableRow
                              key={item._id}
                              onClick={() => handleRowClick(item)}
                              className={cn(
                                "cursor-pointer transition-all hover:bg-muted/50",
                                selectedId === item._id && "bg-blue-500/10 hover:bg-blue-500/15"
                              )}
                            >
                              <TableCell className="font-mono text-xs text-center">{globalIndex}</TableCell>
                              <TableCell className="font-mono text-center text-sm font-semibold">{item.code}</TableCell>
                              <TableCell className="text-center text-xs">{item.personType}</TableCell>
                              <TableCell className="text-right text-xs font-medium">{item.name}</TableCell>
                              <TableCell className="font-mono text-center text-xs">{item.nationalId}</TableCell>
                              <TableCell className="font-mono text-center text-xs">{item.registrationNumber || "-"}</TableCell>
                              <TableCell className="font-mono text-center text-xs" dir="ltr">{item.phone || "-"}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[11px] font-bold",
                                  item.status === "فعال" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                                )}>
                                  {item.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* صفحه بندی و تنظیم تعداد رکوردها */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>تعداد رکوردها:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        setCurrentPage(1);
                      }}
                      className="h-7 rounded border border-input bg-background px-1 text-[11px]"
                    >
                      <option value={10}>۱۰</option>
                      <option value={25}>۲۵</option>
                      <option value={50}>۵۰</option>
                      <option value={100}>۱۰۰</option>
                    </select>
                    <span>از کل {filtered.length} رکورد</span>
                  </div>

                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      {"|<<"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                      disabled={currentPage === 1}
                    >
                      {"<"}
                    </Button>
                    <span className="text-xs font-mono px-3 py-1 rounded bg-muted/50 border">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {">"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      {">>|"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-right p-4 space-y-4">
                <h3 className="text-sm font-bold border-b pb-2">جزئیات کامل طرف قرارداد منتخب</h3>
                {selectedId ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div><strong>کد طرف قرارداد:</strong> <span className="font-mono">{form.code}</span></div>
                    <div><strong>نوع شخص:</strong> {form.personType}</div>
                    <div><strong>نام شرکت / شخص:</strong> {form.name}</div>
                    <div><strong>شناسه ملی:</strong> <span className="font-mono">{form.nationalId}</span></div>
                    <div><strong>شماره ثبت:</strong> <span className="font-mono">{form.registrationNumber || "-"}</span></div>
                    <div><strong>نام مدیرعامل:</strong> {form.ceoName || "-"}</div>
                    <div><strong>وضعیت:</strong> {form.status}</div>
                    <div><strong>شماره تماس:</strong> <span className="font-mono">{form.phone || "-"}</span></div>
                    <div><strong>تلفن همراه:</strong> <span className="font-mono">{form.mobile || "-"}</span></div>
                    <div><strong>ایمیل:</strong> <span className="font-mono">{form.email || "-"}</span></div>
                    <div><strong>آدرس:</strong> {form.address || "-"}</div>
                    <div><strong>کدپستی:</strong> <span className="font-mono">{form.postalCode || "-"}</span></div>
                    <div><strong>نام بانک:</strong> {form.bankName || "-"}</div>
                    <div><strong>شماره حساب:</strong> <span className="font-mono">{form.accountNumber || "-"}</span></div>
                    <div><strong>شماره شبا:</strong> <span className="font-mono">{form.sheba || "-"}</span></div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">هیچ رکوردی جهت نمایش جزئیات انتخاب نشده است. لطفاً از تب لیست یک رکورد انتخاب کنید.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
