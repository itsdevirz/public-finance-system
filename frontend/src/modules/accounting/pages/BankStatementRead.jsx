import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileSpreadsheet, Upload, Save, Trash2, Eye, RefreshCw, FileText, Building2,
  CheckCircle2, AlertCircle, Layers, ArrowLeft, ArrowUpRight, ArrowDownLeft,
  FileCode2, ShieldCheck, Scale, LogOut, Search
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
import { getCurrentPersianYear } from "@/lib/fiscalUtils";

// توابع تبدیل اعداد به فارسی
function toPersianDigits(n) {
  if (n === null || n === undefined || n === "") return "";
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function fmtNum(n) {
  if (n === null || n === undefined || n === 0) return "۰";
  return toPersianDigits(Number(n).toLocaleString("fa-IR"));
}

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

export default function BankStatementRead() {
  const navigate = useNavigate();
  const currentYear = getCurrentPersianYear();

  // داده‌های عمومی در سرور
  const [formats, setFormats] = useState([]);
  const [importedBatches, setImportedBatches] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // فرم تنظیمات استخراج صورت‌حساب
  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [bankName, setBankName] = useState("بانک ملی ایران");
  const [accountNumber, setAccountNumber] = useState("");
  const [fiscalYear, setFiscalYear] = useState(String(currentYear));
  const [remarks, setRemarks] = useState("");

  // فایل و تراکنش‌های پارس‌شده در کلاینت
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [parseLoading, setParseLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // مدال مشاهده ریز تراکنش‌های بسته واردشده
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // بارگذاری فرمت‌ها، سال‌های مالی و بسته‌های صورت‌حساب واردشده
  const fetchData = async () => {
    setLoading(true);
    try {
      const [formatRes, batchRes, yearRes] = await Promise.all([
        api.get("/api/bank-statement-formats").catch(() => ({ data: { data: [] } })),
        api.get("/api/bank-statements").catch(() => ({ data: { data: [] } })),
        api.get("/api/fiscal-years").catch(() => ({ data: { data: [] } })),
      ]);

      const formatList = formatRes.data?.data || [];
      setFormats(formatList);
      if (formatList.length > 0) {
        setSelectedFormatId(formatList[0]._id);
        setBankName(formatList[0].bank_name || "بانک ملی ایران");
        if (formatList[0].account_number) setAccountNumber(formatList[0].account_number);
      }

      setImportedBatches(batchRes.data?.data || []);

      const years = yearRes.data?.data || [];
      setFiscalYears(years);
      if (years.length > 0) {
        setFiscalYear(String(years[0].year));
      }
    } catch (err) {
      console.error("Error fetching bank statement data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // تغییر فرمت انتخابی
  const handleFormatChange = (fmtId) => {
    setSelectedFormatId(fmtId);
    const found = formats.find((f) => f._id === fmtId);
    if (found) {
      setBankName(found.bank_name || "بانک ملی ایران");
      if (found.account_number) setAccountNumber(found.account_number);
    }
  };

  // خواندن فایل نمونه از کلاینت
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseLoading(true);
    setErrorMsg("");
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setFileContent(String(content || ""));
      parseContent(String(content || ""));
    };
    reader.onerror = () => {
      setErrorMsg("خطا در خواندن محتوای فایل انتخاب شده");
      setParseLoading(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  // پارس کردن متن بر اساس فرمت انتخابی
  const parseContent = (content) => {
    try {
      const currentFormat = formats.find((f) => f._id === selectedFormatId) || {
        delimiter: ",",
        header_row_index: 1,
        mapping: { date_col: "A", ref_number_col: "B", debit_col: "C", credit_col: "D", balance_col: "E", description_col: "F" },
      };

      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const headerOffset = Math.max(1, currentFormat.header_row_index || 1);
      const dataRows = lines.slice(headerOffset - 1);

      const colToIndex = (col) => {
        if (!col) return -1;
        const clean = String(col).toUpperCase().trim();
        if (/^[A-Z]+$/.test(clean)) {
          let num = 0;
          for (let i = 0; i < clean.length; i++) {
            num = num * 26 + (clean.charCodeAt(i) - 64);
          }
          return num - 1;
        }
        const parsedNum = parseInt(clean, 10);
        return !isNaN(parsedNum) ? Math.max(0, parsedNum - 1) : -1;
      };

      const dateIdx = colToIndex(currentFormat.mapping?.date_col);
      const refIdx = colToIndex(currentFormat.mapping?.ref_number_col);
      const debitIdx = colToIndex(currentFormat.mapping?.debit_col);
      const creditIdx = colToIndex(currentFormat.mapping?.credit_col);
      const balanceIdx = colToIndex(currentFormat.mapping?.balance_col);
      const descIdx = colToIndex(currentFormat.mapping?.description_col);

      const delimiter = currentFormat.delimiter || ",";

      const rows = dataRows.map((row, idx) => {
        const parts = row.split(delimiter).map((p) => p.replace(/^["']|["']$/g, "").trim());
        const debitVal = Number(String(parts[debitIdx] || "0").replace(/,/g, "")) || 0;
        const creditVal = Number(String(parts[creditIdx] || "0").replace(/,/g, "")) || 0;
        const balanceVal = Number(String(parts[balanceIdx] || "0").replace(/,/g, "")) || 0;

        return {
          row_num: idx + 1,
          date: parts[dateIdx] || "-",
          ref_number: parts[refIdx] || "-",
          debit: debitVal,
          credit: creditVal,
          balance: balanceVal,
          description: parts[descIdx] || row,
        };
      });

      setParsedTransactions(rows);
    } catch (err) {
      console.error("Error parsing bank statement content:", err);
      setErrorMsg("خطا در پردازش سطرها و نگاشت ستون‌های صورت‌حساب");
    } finally {
      setParseLoading(false);
    }
  };

  // محاسبات آمار خلاصه فایل پارس شده
  const summaryStats = useMemo(() => {
    const totalCount = parsedTransactions.length;
    const totalDebit = parsedTransactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = parsedTransactions.reduce((sum, t) => sum + (t.credit || 0), 0);
    const endingBalance = totalCount > 0 ? (parsedTransactions[totalCount - 1].balance || 0) : 0;
    const initialBalance = totalCount > 0 ? (parsedTransactions[0].balance || 0) - (parsedTransactions[0].credit || 0) + (parsedTransactions[0].debit || 0) : 0;

    return {
      totalCount,
      totalDebit,
      totalCredit,
      initialBalance,
      endingBalance,
    };
  }, [parsedTransactions]);

  // ثبت و ذخیره‌سازی بسته صورت‌حساب در سیستم
  const handleSaveImport = async () => {
    if (!accountNumber) {
      setErrorMsg("لطفا شماره حساب بانکی را وارد کنید.");
      return;
    }
    if (parsedTransactions.length === 0) {
      setErrorMsg("هیچ تراکنشی برای ذخیره‌سازی یافت نشد.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const selectedFmt = formats.find((f) => f._id === selectedFormatId);
      const payload = {
        bank_name: bankName,
        account_number: accountNumber,
        format_id: selectedFormatId,
        format_title: selectedFmt?.title || "",
        fiscal_year: fiscalYear,
        remarks,
        transactions: parsedTransactions,
      };

      const res = await api.post("/api/bank-statements/import", payload);
      if (res.data?.success) {
        setImportSuccess(true);
        setParsedTransactions([]);
        setFileName("");
        setFileContent("");
        fetchData();
      }
    } catch (err) {
      console.error("Error importing bank statement:", err);
      setErrorMsg("خطا در ذخیره‌سازی بسته صورت‌حساب بانک");
    } finally {
      setLoading(false);
    }
  };

  // مشاهده جزئیات بسته
  const handleViewBatch = async (id) => {
    setBatchLoading(true);
    try {
      const res = await api.get(`/api/bank-statements/${id}`);
      if (res.data?.success) {
        setSelectedBatch(res.data.data);
      }
    } catch (err) {
      console.error("Error viewing batch details:", err);
    } finally {
      setBatchLoading(false);
    }
  };

  // حذف بسته صورت‌حساب
  const handleDeleteBatch = async (id) => {
    if (!window.confirm("آیا از حذف این بسته صورت‌حساب الکترونیکی اطمینان دارید؟")) return;
    try {
      const res = await api.delete(`/api/bank-statements/${id}`);
      if (res.data?.success) {
        fetchData();
        if (selectedBatch?._id === id) setSelectedBatch(null);
      }
    } catch (err) {
      console.error("Error deleting batch:", err);
    }
  };

  const filteredBatches = importedBatches.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      (b.batch_number || "").toLowerCase().includes(q) ||
      (b.bank_name || "").toLowerCase().includes(q) ||
      (b.account_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      {/* هدر صفحه */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-inner">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">خواندن اطلاعات حساب‌ها (صورت‌حساب بانک)</h1>
            <p className="text-xs text-muted-foreground">استخراج، اعتبارسنجی و خواندن فایل‌های الکترونیکی صورت‌حساب بانک‌ها جهت مغایرت‌گیری</p>
          </div>
        </div>

        {/* دکمه‌های هدر */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/bookkeeping/bank-reconciliation/account-format-setup")}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <FileCode2 className="h-4 w-4 text-blue-500" /> تنظیم فرمت صورت‌حساب
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/bookkeeping/bank-reconciliation/account-reconciliation")}
            className="gap-1.5 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Scale className="h-4 w-4" /> مغایرت حساب‌ها
          </Button>
        </div>
      </div>

      <div className="space-y-6" dir="rtl">
        {/* پیام‌های اطلاع‌رسانی خطا یا موفقیت */}
        {importSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>بسته صورت‌حساب الکترونیکی بانک با موفقیت در پایگاه‌داده ثبت شد و آماده مغایرت‌گیری می‌باشد.</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setImportSuccess(false)} className="h-7 text-xs text-emerald-700">
              بستن
            </Button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* بخش ۱: فرم تنظیمات استخراج صورت‌حساب */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-4 bg-muted/20 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base font-bold text-foreground">تنظیمات استخراج صورت‌حساب بانک</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                سال مالی: {fiscalYear}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="فرمت صورت‌حساب بانک" required hint="الگوی نگاشت ستون‌ها">
                <select
                  value={selectedFormatId}
                  onChange={(e) => handleFormatChange(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right"
                >
                  {formats.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.title} ({f.bank_name})
                    </option>
                  ))}
                  {formats.length === 0 && (
                    <option value="">هیچ فرمتی ثبت نشده است</option>
                  )}
                </select>
              </Field>

              <Field label="نام بانک" required>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثال: بانک ملی ایران"
                  className="h-9 text-xs text-right"
                />
              </Field>

              <Field label="شماره حساب بانکی" required hint="حساب متناظر در دفاتر">
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="مثال: 0102030405001"
                  className="h-9 text-xs font-mono text-center"
                  dir="ltr"
                />
              </Field>

              <Field label="سال مالی">
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-right font-mono"
                >
                  {fiscalYears.map((y) => (
                    <option key={y._id} value={String(y.year)}>{y.year} — {y.title}</option>
                  ))}
                  {fiscalYears.length === 0 && (
                    <option value={String(currentYear)}>{currentYear}</option>
                  )}
                </select>
              </Field>
            </div>

            {/* ناحیه درگ اند دراپ و بارگذاری فایل صورت حساب */}
            <div className="border-2 border-dashed border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10 rounded-2xl p-6 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
                <Upload className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">انتخاب یا رهاسازی فایل صورت‌حساب بانک (Excel, CSV, TXT)</h3>
                <p className="text-xs text-muted-foreground">فایل دریافت شده از اینترنت‌بانک را جهت پارس و استخراج خودکار انتخاب کنید</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <label className="cursor-pointer">
                  <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-all">
                    <FileSpreadsheet className="h-4 w-4" /> انتخاب فایل صورت‌حساب
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {fileName && (
                  <Badge variant="secondary" className="text-xs py-1 px-3 gap-1">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    <span>{fileName}</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* کارت خلاصه آمار تراکنش‌های فایل پارس شده */}
            {parsedTransactions.length > 0 && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-muted/30 p-3 rounded-xl border text-center">
                    <span className="text-[11px] text-muted-foreground block">تعداد کل تراکنش‌ها</span>
                    <span className="text-base font-bold font-mono text-foreground">{fmtNum(summaryStats.totalCount)}</span>
                  </div>

                  <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200/50 text-center">
                    <span className="text-[11px] text-rose-700 font-semibold block">جمع بدهکار (برداشت)</span>
                    <span className="text-base font-bold font-mono text-rose-600">{fmtNum(summaryStats.totalDebit)}</span>
                  </div>

                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/50 text-center">
                    <span className="text-[11px] text-emerald-700 font-semibold block">جمع بستانکار (واریز)</span>
                    <span className="text-base font-bold font-mono text-emerald-600">{fmtNum(summaryStats.totalCredit)}</span>
                  </div>

                  <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-200/50 text-center">
                    <span className="text-[11px] text-blue-700 font-semibold block">مانده ابتدا</span>
                    <span className="text-base font-bold font-mono text-blue-600">{fmtNum(summaryStats.initialBalance)}</span>
                  </div>

                  <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-200/50 text-center">
                    <span className="text-[11px] text-purple-700 font-semibold block">مانده انتها</span>
                    <span className="text-base font-bold font-mono text-purple-600">{fmtNum(summaryStats.endingBalance)}</span>
                  </div>
                </div>

                {/* جدول پیش‌نمایش تراکنش‌های استخراج‌شده */}
                <div className="border rounded-xl overflow-hidden shadow-inner">
                  <div className="bg-muted/40 p-3 flex items-center justify-between border-b">
                    <span className="text-xs font-bold text-foreground">جدول پیش‌نمایش تراکنش‌های استخراج‌شده (آماده ذخیره)</span>
                    <span className="text-[11px] text-muted-foreground">نمایش ۵۰ سطر اول</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/20 sticky top-0">
                        <TableRow>
                          <TableHead className="text-center text-xs py-2 w-10">ردیف</TableHead>
                          <TableHead className="text-center text-xs py-2">تاریخ</TableHead>
                          <TableHead className="text-center text-xs py-2">شماره سند / پیگیری</TableHead>
                          <TableHead className="text-center text-xs py-2 text-rose-600">بدهکار (ریال)</TableHead>
                          <TableHead className="text-center text-xs py-2 text-emerald-600">بستانکار (ریال)</TableHead>
                          <TableHead className="text-center text-xs py-2 text-blue-600">مانده (ریال)</TableHead>
                          <TableHead className="text-right text-xs py-2">شرح تراکنش</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedTransactions.slice(0, 50).map((t, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-[11px] text-center">{idx + 1}</TableCell>
                            <TableCell className="font-mono text-xs text-center">{t.date}</TableCell>
                            <TableCell className="font-mono text-xs text-center font-bold text-blue-600">{t.ref_number}</TableCell>
                            <TableCell className="font-mono text-xs text-center text-rose-600 font-semibold">{fmtNum(t.debit)}</TableCell>
                            <TableCell className="font-mono text-xs text-center text-emerald-600 font-semibold">{fmtNum(t.credit)}</TableCell>
                            <TableCell className="font-mono text-xs text-center font-bold text-blue-700">{fmtNum(t.balance)}</TableCell>
                            <TableCell className="text-right text-xs max-w-xs truncate">{t.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* دکمه ذخیره صورت حساب */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveImport}
                    disabled={loading}
                    className="h-10 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 px-6 shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? "در حال ثبت و ذخیره‌سازی..." : "تأیید و ذخیره صورت‌حساب در سیستم"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* لیست بسته‌های صورت‌حساب‌های الکترونیکی واردشده قبلی */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-4 bg-muted/10 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">لیست صورت‌حساب‌های الکترونیکی بانک ثبت‌شده</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">تاریخچه بسته‌های وارد شده و آماده مغایرت‌گیری</CardDescription>
              </div>

              <div className="relative max-w-sm w-full">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس شماره بسته، بانک، شماره حساب..."
                  className="h-9 pr-9 text-xs text-right w-full"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">در حال بارگذاری بسته‌های صورت‌حساب...</div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-center text-xs py-2.5 w-10">ردیف</TableHead>
                      <TableHead className="text-center text-xs py-2.5">شماره بسته</TableHead>
                      <TableHead className="text-right text-xs py-2.5">نام بانک</TableHead>
                      <TableHead className="text-center text-xs py-2.5">شماره حساب</TableHead>
                      <TableHead className="text-center text-xs py-2.5">تاریخ ورود</TableHead>
                      <TableHead className="text-center text-xs py-2.5">تعداد تراکنش</TableHead>
                      <TableHead className="text-center text-xs py-2.5 text-rose-600">جمع بدهکار (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2.5 text-emerald-600">جمع بستانکار (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2.5 text-blue-600">مانده انتهای دوره (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2.5 w-20">وضعیت</TableHead>
                      <TableHead className="text-center text-xs py-2.5 w-24">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((b, idx) => (
                      <TableRow key={b._id}>
                        <TableCell className="font-mono text-[11px] text-center">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold text-blue-600">{b.batch_number}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{b.bank_name}</TableCell>
                        <TableCell className="font-mono text-xs text-center">{b.account_number}</TableCell>
                        <TableCell className="font-mono text-xs text-center">{b.import_date}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold">{fmtNum(b.total_count)}</TableCell>
                        <TableCell className="font-mono text-xs text-center text-rose-600 font-semibold">{fmtNum(b.total_debit)}</TableCell>
                        <TableCell className="font-mono text-xs text-center text-emerald-600 font-semibold">{fmtNum(b.total_credit)}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold text-blue-700">{fmtNum(b.ending_balance)}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                            {b.status === "imported" ? "وارد شده" : b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewBatch(b._id)}
                              title="مشاهده ریز تراکنش‌ها"
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteBatch(b._id)}
                              title="حذف بسته صورت‌حساب"
                              className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredBatches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-xs py-8 text-muted-foreground">
                          هیچ صورت‌حساب الکترونیکی وارد نشده است.
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
