import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCode2, Building2, Save, Plus, Trash2, Edit3, Search, RefreshCw, FileSpreadsheet,
  FileText, CheckCircle2, AlertCircle, Upload, Eye, Layers, Copy, HelpCircle, ArrowLeft, LogOut
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

// لیست بانک‌های اصلی ایران جهت انتخاب سریع
const IRANIAN_BANKS = [
  "بانک ملی ایران",
  "بانک ملت",
  "بانک تجارت",
  "بانک سپه",
  "بانک صادرات ایران",
  "بانک کشاورزی",
  "بانک مسکن",
  "بانک رفاه کارگران",
  "بانک سامان",
  "بانک پاسارگاد",
  "بانک پارسیان",
  "بانک اقتصاد نوین",
  "بانک سینا",
  "بانک شهر",
  "بانک دی",
  "بانک انصار (سپه)",
  "بانک مرکزی جمهوری اسلامی ایران",
  "سایر",
];

// الگوهای آماده بانک‌های کشور
const PRESET_TEMPLATES = [
  {
    code: "FMT-MELLI-01",
    title: "فرمت صورت‌حساب بانک ملی ایران (اکسل BAM)",
    bank_name: "بانک ملی ایران",
    file_type: "excel",
    delimiter: ",",
    header_row_index: 2,
    encoding: "utf-8",
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      time_col: "B",
      ref_number_col: "C",
      debit_col: "D",
      credit_col: "E",
      balance_col: "F",
      description_col: "G",
      payer_id_col: "H",
    },
    remarks: "فرمت استاندارد سامانه بام بانک ملی",
  },
  {
    code: "FMT-MELLAT-01",
    title: "فرمت صورت‌حساب بانک ملت (CSV فرافراتکس)",
    bank_name: "بانک ملت",
    file_type: "csv",
    delimiter: ",",
    header_row_index: 1,
    encoding: "utf-8",
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      time_col: "",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
      payer_id_col: "G",
    },
    remarks: "فرمت استاندارد دریافت CSV بانک ملت",
  },
  {
    code: "FMT-TEJARAT-01",
    title: "فرمت صورت‌حساب بانک تجارت (اکسل)",
    bank_name: "بانک تجارت",
    file_type: "excel",
    delimiter: ",",
    header_row_index: 1,
    encoding: "utf-8",
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      time_col: "",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
      payer_id_col: "",
    },
    remarks: "فرمت استاندارد بانک اینترنتی تجارت",
  },
  {
    code: "FMT-SEPAH-01",
    title: "فرمت صورت‌حساب بانک سپه (CSV)",
    bank_name: "بانک سپه",
    file_type: "csv",
    delimiter: ";",
    header_row_index: 1,
    encoding: "utf-8",
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYYMMDD",
      time_col: "",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
      payer_id_col: "",
    },
    remarks: "فرمت استاندارد امید بانک سپه",
  },
  {
    code: "FMT-KESHAVARZI-01",
    title: "فرمت صورت‌حساب بانک کشاورزی (اکسل)",
    bank_name: "بانک کشاورزی",
    file_type: "excel",
    delimiter: ",",
    header_row_index: 1,
    encoding: "utf-8",
    status: "active",
    mapping: {
      date_col: "A",
      date_format: "YYYY/MM/DD",
      time_col: "",
      ref_number_col: "B",
      debit_col: "C",
      credit_col: "D",
      balance_col: "E",
      description_col: "F",
      payer_id_col: "G",
    },
    remarks: "فرمت الکترونیک بانک کشاورزی",
  },
];

const INITIAL_FORM = {
  code: "",
  title: "",
  bank_name: "بانک ملی ایران",
  account_number: "",
  file_type: "excel",
  delimiter: ",",
  header_row_index: 1,
  encoding: "utf-8",
  is_default: false,
  status: "active",
  mapping: {
    date_col: "A",
    date_format: "YYYY/MM/DD",
    time_col: "",
    ref_number_col: "B",
    debit_col: "C",
    credit_col: "D",
    balance_col: "E",
    description_col: "F",
    payer_id_col: "",
  },
  remarks: "",
};

function Field({ label, required, children, hint }) {
  return (
    <div className="flex flex-col gap-1 w-full text-right">
      <Label className="text-xs font-semibold text-muted-foreground text-right flex items-center justify-end gap-0.5">
        {required && <span className="text-destructive font-bold">*</span>}
        <span>{label}</span>
      </Label>
      {children}
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default function BankStatementFormatSetup() {
  const navigate = useNavigate();
  const [formats, setFormats] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // فیلدهای تست پارس فایل نمونه
  const [sampleContent, setSampleContent] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [testLoading, setTestLoading] = useState(false);

  const fetchFormats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/bank-statement-formats");
      if (res.data?.success) {
        setFormats(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching bank formats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedCode = async () => {
    try {
      const res = await api.get("/api/bank-statement-formats/suggest-code");
      if (res.data?.success && res.data.code) {
        setForm((prev) => ({ ...prev, code: res.data.code }));
      }
    } catch (err) {
      console.error("Error getting suggest code:", err);
    }
  };

  useEffect(() => {
    fetchFormats();
    getSuggestedCode();
  }, []);

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedId(null);
    setSavedSuccess(false);
    setErrorMsg("");
    setPreviewRows([]);
    getSuggestedCode();
  };

  const handleSelectFormat = (fmt) => {
    setForm({
      code: fmt.code || "",
      title: fmt.title || "",
      bank_name: fmt.bank_name || "بانک ملی ایران",
      account_number: fmt.account_number || "",
      file_type: fmt.file_type || "excel",
      delimiter: fmt.delimiter || ",",
      header_row_index: fmt.header_row_index || 1,
      encoding: fmt.encoding || "utf-8",
      is_default: Boolean(fmt.is_default),
      status: fmt.status || "active",
      mapping: {
        date_col: fmt.mapping?.date_col || "A",
        date_format: fmt.mapping?.date_format || "YYYY/MM/DD",
        time_col: fmt.mapping?.time_col || "",
        ref_number_col: fmt.mapping?.ref_number_col || "B",
        debit_col: fmt.mapping?.debit_col || "C",
        credit_col: fmt.mapping?.credit_col || "D",
        balance_col: fmt.mapping?.balance_col || "E",
        description_col: fmt.mapping?.description_col || "F",
        payer_id_col: fmt.mapping?.payer_id_col || "",
      },
      remarks: fmt.remarks || "",
    });
    setSelectedId(fmt._id);
    setSavedSuccess(false);
    setErrorMsg("");
    setPreviewRows([]);
  };

  const handleApplyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      title: preset.title,
      bank_name: preset.bank_name,
      file_type: preset.file_type,
      delimiter: preset.delimiter,
      header_row_index: preset.header_row_index,
      encoding: preset.encoding,
      mapping: { ...preset.mapping },
      remarks: preset.remarks,
    }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.title || !form.bank_name) {
      setErrorMsg("لطفا فیلدهای عنوان فرمت و نام بانک را تکمیل کنید.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      if (selectedId) {
        const res = await api.patch(`/api/bank-statement-formats/${selectedId}`, form);
        if (res.data?.success) {
          setSavedSuccess(true);
          fetchFormats();
        }
      } else {
        const res = await api.post("/api/bank-statement-formats", form);
        if (res.data?.success) {
          setSavedSuccess(true);
          setSelectedId(res.data.data._id);
          fetchFormats();
        }
      }
    } catch (err) {
      console.error("Error saving format:", err);
      setErrorMsg("خطا در ذخیره‌سازی فرمت صورت‌حساب بانک");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این فرمت صورت‌حساب اطمینان دارید؟")) return;
    try {
      const res = await api.delete(`/api/bank-statement-formats/${id}`);
      if (res.data?.success) {
        fetchFormats();
        if (selectedId === id) handleNew();
      }
    } catch (err) {
      console.error("Error deleting format:", err);
    }
  };

  // تست پارس فایل نمونه
  const handleTestParse = async () => {
    if (!sampleContent) {
      // اگر محتوایی چسبانده نشده، یک نمونه متنی برای تست تولید کن
      const demoSample = `تاریخ,شماره پیگیری,بدهکار,بستانکار,مانده,شرح
1403/04/15,987654321,0,50000000,150000000,واریز حقوق کارمندان
1403/04/16,987654322,12000000,0,138000000,پرداخت چک شماره 102
1403/04/18,987654323,0,25000000,163000000,دریافت وجه تخصیص اعتبار
1403/04/20,987654324,5000000,0,158000000,کارمزد خدمات بانکی`;
      setSampleContent(demoSample);
      runParseApi(demoSample);
    } else {
      runParseApi(sampleContent);
    }
  };

  const runParseApi = async (content) => {
    setTestLoading(true);
    try {
      const res = await api.post("/api/bank-statement-formats/parse-test", {
        file_content: content,
        delimiter: form.delimiter,
        header_row: form.header_row_index,
        mapping: form.mapping,
      });
      if (res.data?.success) {
        setPreviewRows(res.data.preview_rows || []);
      }
    } catch (err) {
      console.error("Error parsing test file:", err);
    } finally {
      setTestLoading(false);
    }
  };

  const filteredFormats = formats.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.title || "").toLowerCase().includes(q) ||
      (f.bank_name || "").toLowerCase().includes(q) ||
      (f.code || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-inner">
            <FileCode2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">تنظیم فرمت صورت حساب بانک</h1>
            <p className="text-xs text-muted-foreground">تعریف چیدمان، جداکننده‌ها و نگاشت ستون‌های فایل‌های الکترونیکی صورت‌حساب بانک‌ها</p>
          </div>
        </div>

        {/* دکمه‌های هدر */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/system-management")}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <LogOut className="h-4 w-4 rotate-180" /> خروج
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <Plus className="h-4 w-4" /> تعریف فرمت جدید
          </Button>
        </div>
      </div>

      <div className="space-y-6" dir="rtl">
        {/* انتخاب سریع الگوهای آماده بانک‌ها */}
        <Card className="border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm font-bold text-foreground">الگوهای پیش‌فرض بانک‌های کشور (مقداردهی سریع)</CardTitle>
              </div>
              <span className="text-[11px] text-muted-foreground">جهت تنظیم سریع ستون‌ها، یک الگوی استاندار را انتخاب کنید</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((preset) => (
                <Button
                  key={preset.code}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyPreset(preset)}
                  className="h-8 text-xs gap-1.5 border-blue-200 bg-background hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/40"
                >
                  <Copy className="h-3.5 w-3.5 text-blue-500" />
                  <span>{preset.bank_name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                    {preset.file_type.toUpperCase()}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* کارت اصلی ثبت/ویرایش فرمت */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-4 bg-muted/20 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base font-bold text-foreground">
                  {selectedId ? "ویرایش فرمت صورت‌حساب" : "مشخصات و نگاشت ستون‌های فرمت جدید"}
                </CardTitle>
              </div>
              {selectedId && (
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                  در حال ویرایش: {form.code}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-6">
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> فرمت صورت‌حساب بانک با موفقیت در سیستم ذخیره شد.
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {errorMsg}
              </div>
            )}

            {/* بخش ۱: اطلاعات پایه فرمت */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="کد فرمت" required hint="شناسه سیستمی فرمت">
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="FMT-001"
                  className="h-9 text-xs font-mono text-center"
                />
              </Field>

              <Field label="عنوان فرمت" required hint="نام توصیفی مانند: اکسل بانک ملی">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: صورت‌حساب اکسل بانک ملی - جاری"
                  className="h-9 text-xs text-right"
                />
              </Field>

              <Field label="نام بانک متناظر" required>
                <select
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right"
                >
                  {IRANIAN_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>

              <Field label="شماره حساب اختصاصی" hint="در صورت اختصاصی بودن">
                <Input
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="مثال: 0102030405001"
                  className="h-9 text-xs font-mono text-center"
                  dir="ltr"
                />
              </Field>
            </div>

            {/* بخش ۲: تنظمیات فایل و جداکننده */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/10 p-4 rounded-xl border border-border/60">
              <Field label="نوع فایل ورودی">
                <select
                  value={form.file_type}
                  onChange={(e) => setForm({ ...form, file_type: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right"
                >
                  <option value="excel">فایل اکسل (XLSX / XLS)</option>
                  <option value="csv">فایل متنی جداشده (CSV)</option>
                  <option value="text">فایل متنی ساده (TXT)</option>
                </select>
              </Field>

              <Field label="کاراکتر جداکننده (Delimiter)" hint="برای فایل‌های CSV/TXT">
                <select
                  value={form.delimiter}
                  onChange={(e) => setForm({ ...form, delimiter: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right font-mono"
                >
                  <option value=",">کاما ( , )</option>
                  <option value=";">نقطه کاما ( ; )</option>
                  <option value="\t">کلید Tab ( \t )</option>
                  <option value="|">خط عمودی ( | )</option>
                </select>
              </Field>

              <Field label="شماره سطر شروع داده‌ها" hint="سطر ۱ یا سطور سربرگ">
                <Input
                  type="number"
                  min="1"
                  value={form.header_row_index}
                  onChange={(e) => setForm({ ...form, header_row_index: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="h-9 text-xs font-mono text-center"
                />
              </Field>

              <Field label="کدگذاری محتوا (Encoding)">
                <select
                  value={form.encoding}
                  onChange={(e) => setForm({ ...form, encoding: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right"
                >
                  <option value="utf-8">UTF-8 (استاندارد جهانی)</option>
                  <option value="windows-1256">Windows-1256 (فارسی مانیتورینگ)</option>
                  <option value="ansi">ANSI / ASCII</option>
                </select>
              </Field>
            </div>

            {/* بخش ۳: نگاشت ستون‌ها (Column Mapping) */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">تعیین حروف یا شماره ستون‌های فایل (Column Mapping)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-background p-4 rounded-xl border shadow-inner">
                <Field label="ستون تاریخ تراکنش" required hint="حرف ستون مانند A یا 1">
                  <Input
                    value={form.mapping.date_col}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, date_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase"
                  />
                </Field>

                <Field label="فرمت تاریخ">
                  <select
                    value={form.mapping.date_format}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, date_format: e.target.value } })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right font-mono"
                  >
                    <option value="YYYY/MM/DD">1403/04/15 (با اسلش)</option>
                    <option value="YYYYMMDD">14030415 (پیوسته)</option>
                    <option value="YY/MM/DD">03/04/15 (سال دو رقمی)</option>
                  </select>
                </Field>

                <Field label="ستون زمان/ساعت" hint="اختیاری - مانند B">
                  <Input
                    value={form.mapping.time_col || ""}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, time_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase"
                  />
                </Field>

                <Field label="ستون شماره پیگیری / سند" required hint="کد مرجع بانک">
                  <Input
                    value={form.mapping.ref_number_col}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, ref_number_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase"
                  />
                </Field>

                <Field label="ستون بدهکار (برداشت)" required>
                  <Input
                    value={form.mapping.debit_col}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, debit_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase text-rose-600 font-bold"
                  />
                </Field>

                <Field label="ستون بستانکار (واریز)" required>
                  <Input
                    value={form.mapping.credit_col}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, credit_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase text-emerald-600 font-bold"
                  />
                </Field>

                <Field label="ستون مانده حساب" required>
                  <Input
                    value={form.mapping.balance_col}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, balance_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase text-blue-600 font-bold"
                  />
                </Field>

                <Field label="ستون شرح / بابت" required>
                  <Input
                    value={form.mapping.description_col}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, description_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase"
                  />
                </Field>

                <Field label="ستون شناسه واریز" hint="اختیاری">
                  <Input
                    value={form.mapping.payer_id_col || ""}
                    onChange={(e) => setForm({ ...form, mapping: { ...form.mapping, payer_id_col: e.target.value.toUpperCase() } })}
                    className="h-9 text-xs font-mono text-center uppercase"
                  />
                </Field>
              </div>
            </div>

            {/* بخش ۴: تست زنده و پارس محتوای فایل نمونه */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">آزمایش زنده و پیش‌نمایش پارس فایل نمونه</h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleTestParse}
                  disabled={testLoading}
                  className="h-8 text-xs gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", testLoading && "animate-spin")} />
                  تست پارس ستون‌ها
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="چسباندن متن نمونه فایل صورت‌حساب" hint="چند سطر از فایل CSV یا متن بانک را وارد کنید">
                  <textarea
                    rows={4}
                    value={sampleContent}
                    onChange={(e) => setSampleContent(e.target.value)}
                    placeholder="مثال:
1403/04/15,987654321,0,50000000,150000000,واریز حقوق
1403/04/16,987654322,12000000,0,138000000,پرداخت چک"
                    className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-mono text-left dir-ltr shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </Field>

                {/* خروجی رندر شده پیش‌نمایش */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-semibold text-muted-foreground text-right">نتیجه استخراج ستون‌ها (پیش‌نمایش)</Label>
                  <div className="border rounded-md p-2 bg-muted/20 min-h-[100px] max-h-[140px] overflow-y-auto text-xs">
                    {previewRows.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        برای مشاهده پیش‌نمایش، متن نمونه را وارد کرده و دکمه «تست پارس ستون‌ها» را بزنید.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-muted/40 text-[10px]">
                          <TableRow>
                            <TableHead className="py-1 text-center">تاریخ</TableHead>
                            <TableHead className="py-1 text-center">شماره سند</TableHead>
                            <TableHead className="py-1 text-center">بدهکار</TableHead>
                            <TableHead className="py-1 text-center">بستانکار</TableHead>
                            <TableHead className="py-1 text-center">مانده</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-[11px] font-mono">
                          {previewRows.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-1 text-center">{r.date}</TableCell>
                              <TableCell className="py-1 text-center font-bold text-blue-600">{r.ref_number}</TableCell>
                              <TableCell className="py-1 text-center text-rose-600">{Number(r.debit || 0).toLocaleString()}</TableCell>
                              <TableCell className="py-1 text-center text-emerald-600">{Number(r.credit || 0).toLocaleString()}</TableCell>
                              <TableCell className="py-1 text-center">{Number(r.balance || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* دکمه‌های عملیاتی ذخیره و انصراف */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleNew}
                className="h-9 text-xs"
              >
                انصراف / فرم جدید
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 px-6"
              >
                <Save className="h-4 w-4" />
                {loading ? "در حال ذخیره‌سازی..." : selectedId ? "به‌روزرسانی فرمت" : "ذخیره فرمت صورت‌حساب"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* لیست فرمت‌های تنظیم‌شده در سیستم */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-4 bg-muted/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">لیست فرمت‌های صورت‌حساب بانک ثبت‌شده</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">مدیریت و ویرایش الگوهای نگاشت شده بانک‌ها</CardDescription>
              </div>

              <div className="relative max-w-sm w-full">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس کد، عنوان فرمت، نام بانک..."
                  className="h-9 pr-9 text-xs text-right w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">در حال بارگذاری لیست فرمت‌ها...</div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-center text-xs py-2.5 w-10">ردیف</TableHead>
                      <TableHead className="text-center text-xs py-2.5">کد فرمت</TableHead>
                      <TableHead className="text-right text-xs py-2.5">عنوان فرمت</TableHead>
                      <TableHead className="text-right text-xs py-2.5">نام بانک</TableHead>
                      <TableHead className="text-center text-xs py-2.5">نوع فایل</TableHead>
                      <TableHead className="text-center text-xs py-2.5">نگاشت ستون‌ها (ت/س/ب/ب/م)</TableHead>
                      <TableHead className="text-center text-xs py-2.5 w-20">وضعیت</TableHead>
                      <TableHead className="text-center text-xs py-2.5 w-24">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormats.map((f, idx) => (
                      <TableRow key={f._id} className={cn(selectedId === f._id && "bg-blue-50/50 dark:bg-blue-950/30")}>
                        <TableCell className="font-mono text-[11px] text-center">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold text-blue-600">{f.code}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{f.title}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{f.bank_name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            {f.file_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center">
                          <span className="text-gray-600">{f.mapping?.date_col || "-"}</span> /{" "}
                          <span className="text-blue-600">{f.mapping?.ref_number_col || "-"}</span> /{" "}
                          <span className="text-rose-600">{f.mapping?.debit_col || "-"}</span> /{" "}
                          <span className="text-emerald-600">{f.mapping?.credit_col || "-"}</span> /{" "}
                          <span className="text-blue-700">{f.mapping?.balance_col || "-"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            f.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                          )}>
                            {f.status === "active" ? "فعال" : "غیرفعال"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSelectFormat(f)}
                              title="ویرایش فرمت"
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(f._id)}
                              title="حذف فرمت"
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredFormats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs py-8 text-muted-foreground">
                          فرمت صورت‌حسابی یافت نشد.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
