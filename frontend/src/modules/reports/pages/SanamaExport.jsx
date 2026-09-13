import { useState, useEffect } from "react";
import { Download, CheckCircle, Calendar, Filter, Layers, Sparkles, RefreshCw, ShieldCheck, AlertTriangle, AlertCircle, Building, Eye, Table } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";
import api, { logFileDownloadAudit } from "@/api";
import { validateEgressPermission } from "@/lib/egressValidator";

const PERSIAN_MONTHS = [
  { value: "1", label: "فروردین (ماه ۰۱)" },
  { value: "2", label: "اردیبهشت (ماه ۰۲)" },
  { value: "3", label: "خرداد (ماه ۰۳)" },
  { value: "4", label: "تیر (ماه ۰۴)" },
  { value: "5", label: "مرداد (ماه ۰۵)" },
  { value: "6", label: "شهریور (ماه ۰۶)" },
  { value: "7", label: "مهر (ماه ۰۷)" },
  { value: "8", label: "آبان (ماه ۰۸)" },
  { value: "9", label: "آذر (ماه ۰۹)" },
  { value: "10", label: "دی (ماه ۱۰)" },
  { value: "11", label: "بهمن (ماه ۱۱)" },
  { value: "12", label: "اسفند (ماه ۱۲)" },
  { value: "15", label: "تراز نهایی سال مالی (ماه ۱۵)" }
];

const FISCAL_YEAR_OPTIONS = [
  { value: "1401", label: "سال مالی ۱۴۰۱" },
  { value: "1402", label: "سال مالی ۱۴۰۲" },
  { value: "1403", label: "سال مالی ۱۴۰۳" },
  { value: "1404", label: "سال مالی ۱۴۰۴" },
  { value: "1405", label: "سال مالی ۱۴۰۵" }
];

const SOURCE_TYPE_OPTIONS = [
  { value: "all", label: "تمامی منابع (عمومی، اختصاصی و سایر)" },
  { value: "1", label: "۱. عمومی" },
  { value: "2", label: "۲. اختصاصی" },
  { value: "3", label: "۳. سایر منابع / سایر" }
];

export default function SanamaExport() {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, validated, done

  // ── ۰. تنظیمات دستگاه اجرایی ──
  const [mainOrgID, setMainOrgID] = useState("10100000000");
  const [mainOrgCode, setMainOrgCode] = useState("400367");

  // ── ۱. پارامترهای اصلی خروجی ──
  const [exportType, setExportType] = useState("monthly"); // "monthly" | "final"
  const [month, setMonth] = useState("3");
  const [fiscalYear, setFiscalYear] = useState("1403");

  // ── ۲. فیلترهای دامنه ──
  const [rangeMode, setRangeMode] = useState("all");
  const [fromAccountCode, setFromAccountCode] = useState("");
  const [toAccountCode, setToAccountCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromDocNo, setFromDocNo] = useState("");
  const [toDocNo, setToDocNo] = useState("");
  const [sourceType, setSourceType] = useState("all");

  // ── ۳. نتایج اعتبارسنجی و پیش‌نمایش ──
  const [validationResult, setValidationResult] = useState(null);
  const [previewSummary, setPreviewSummary] = useState(null);

  // بارگذاری اولیه تنظیمات دستگاه
  useEffect(() => {
    fetchOrgSettings();
  }, []);

  const fetchOrgSettings = async () => {
    try {
      const res = await api.get("/api/sanama/settings");
      if (res.data?.success && res.data?.data) {
        setMainOrgID(res.data.data.mainOrgID || "10100000000");
        setMainOrgCode(res.data.data.mainOrgCode || "400367");
      }
    } catch (_) {}
  };

  const handleSaveOrgSettings = async () => {
    if (!/^\d{11}$/.test(mainOrgID)) {
      alert("شناسه ملی دستگاه اجرایی باید دقیقاً ۱۱ رقم باشد.");
      return;
    }
    if (!mainOrgCode.trim()) {
      alert("ردیف بودجه‌ای دستگاه اجرایی الزامی است.");
      return;
    }

    setSavingSettings(true);
    try {
      await api.post("/api/sanama/settings", { mainOrgID, mainOrgCode });
      alert("تنظیمات دستگاه اجرایی با موفقیت ذخیره شد.");
    } catch (err) {
      alert("خطا در ذخیره تنظیمات: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingSettings(false);
    }
  };

  const buildQueryParams = () => {
    return new URLSearchParams({
      exportType,
      month: String(month || "3"),
      fiscalYear: String(fiscalYear || "1403"),
      rangeMode,
      fromAccountCode,
      toAccountCode,
      fromDate,
      toDate,
      fromDocNo,
      toDocNo,
      sourceType
    });
  };

  // اعتبارسنجی و دریافت پیش‌نمایش
  const handleValidateAndPreview = async () => {
    setValidating(true);
    try {
      const filterBody = {
        exportType,
        month,
        fiscalYear,
        rangeMode,
        fromAccountCode,
        toAccountCode,
        fromDate,
        toDate,
        fromDocNo,
        toDocNo,
        sourceType
      };

      const prevRes = await api.post("/api/sanama/preview", filterBody);

      if (prevRes.data?.success) {
        const previewData = prevRes.data.data;
        setPreviewSummary(previewData);
        if (previewData.validation) {
          setValidationResult(previewData.validation);
        }
        setStatus("validated");
      }
    } catch (err) {
      alert("خطا در اعتبارسنجی داده‌ها: " + (err.response?.data?.message || err.message));
    } finally {
      setValidating(false);
    }
  };

  // تولید و دانلود فایل XML رسمی
  const handleDownload = async () => {
    setLoading(true);
    try {
      // 1. Validation for Egress / Export permission
      const egressCheck = await validateEgressPermission({
        exportType: "XML",
        recordCount: validationResult?.stats?.totalReportRows || 1000,
        fileSizeMB: 5
      });

      if (!egressCheck.allowed) {
        alert(`ممانعت از خروجی داده (الزام افتا):\n${egressCheck.reason}`);
        setLoading(false);
        return;
      }

      const queryParams = buildQueryParams();
      const res = await api.get(`/api/sanama/export-xml?${queryParams.toString()}`, {
        responseType: "blob"
      });

      if (res.data && res.data.type === "application/json") {
        const text = await res.data.text();
        const json = JSON.parse(text);
        alert(json.message || "خطا در تولید فایل سناما");
        setLoading(false);
        return;
      }

      const blob = new Blob([res.data], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const fileName = exportType === "final"
        ? `SANAMA_${mainOrgCode}_${fiscalYear}_15.xml`
        : `SANAMA_${mainOrgCode}_${fiscalYear}_${String(month).padStart(2, "0")}.xml`;

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await logFileDownloadAudit({
        fileName,
        section: "خروجی رسمی سناما (وزارت امور اقتصادی و دارایی)",
        dataType: "فایل XML سناما (پروتکل ۳.۲ - ویرایش ۱۹)",
        fileFormat: "XML",
        otherDetails: `دانلود خروجی ${exportType === "final" ? "نهایی سال" : `ماهانه (ماه ${String(month).padStart(2, "0")}) سال`} ${fiscalYear}`
      });

      setStatus("done");
    } catch (err) {
      console.error("Failed to generate Sanama XML", err);
      let errorMsg = "خطا در تولید و دانلود فایل سناما";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg += `: ${err.message}`;
      }
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="تولید خروجی رسمی سناما (وزارت امور اقتصادی و دارایی)"
        description="سامانه صدور، اعتبارسنجی و خروجی فایل الکترونیکی XML بر اساس پروتکل نسخه ۳.۲ - ویرایش ۱۹"
      />

      <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
        {/* کارت توضیحات و استاندارد سناما Edition 19 */}
        <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shadow-lg border-0">
          <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-cyan-400" />
                <h2 className="text-base font-bold text-white">سامانه تولید فایل XML سناما (Version 3.2 - Edition 19)</h2>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                استخراج، انباشت گردش بدهکار و بستانکار تا پایان ماه جاری، اعتبارسنجی ساختاری و کنترل کدهای معین مطابق سند رسمی خزانه‌داری کل کشور.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs text-xs font-mono text-cyan-200 shrink-0 border border-white/10">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>Protocol: SANAMA v3.2 (Ed. 19)</span>
            </div>
          </CardContent>
        </Card>

        {/* ── ۰. بخش اطلاعات دستگاه اجرایی ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Building className="h-4 w-4 text-indigo-600" />
              اطلاعات شناسایی دستگاه اجرایی (MainOrg)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              شناسه ملی ۱۱ رقمی و ردیف بودجه‌ای دستگاه اجرایی بر اساس سند پروتکل
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">شناسه ملی دستگاه (۱۱ رقم)</Label>
                <Input
                  value={mainOrgID}
                  onChange={(e) => setMainOrgID(e.target.value)}
                  placeholder="۱۰۱۰... (۱۱ رقم)"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">ردیف بودجه‌ای (MainOrgCode)</Label>
                <Input
                  value={mainOrgCode}
                  onChange={(e) => setMainOrgCode(e.target.value)}
                  placeholder="۴۰۰۳۶۷"
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleSaveOrgSettings}
                disabled={savingSettings}
                variant="outline"
                className="h-10 text-xs font-bold border-indigo-200 hover:bg-indigo-50 text-indigo-700"
              >
                {savingSettings ? "در حال ذخیره..." : "ذخیره تنظیمات دستگاه"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── ۱. بخش انتخاب نوع خروجی (ماهانه و نهایی) ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Calendar className="h-4 w-4 text-blue-600" />
              ۱. نوع خروجی و دوره مالی (ماهانه / نهایی)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setExportType("monthly")}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5",
                  exportType === "monthly"
                    ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
                )}
              >
                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
                  exportType === "monthly" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400")}>
                  {exportType === "monthly" && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">خروجی ماهانه (MonthlyProtocol)</h3>
                  <p className="text-xs text-slate-500 mt-1">گزارش انباشت گردش ماهانه (ماه ۱ تا ۱۲)</p>
                </div>
              </div>

              <div
                onClick={() => setExportType("final")}
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5",
                  exportType === "final"
                    ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
                )}
              >
                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0",
                  exportType === "final" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-400")}>
                  {exportType === "final" && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">خروجی نهایی (FinalProtocol - ماه ۱۵)</h3>
                  <p className="text-xs text-slate-500 mt-1">گزارش تراز نهایی و بستن حساب‌های پایان سال</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">سال مالی</Label>
                <SearchableSelect
                  options={FISCAL_YEAR_OPTIONS}
                  value={fiscalYear}
                  onChange={(val) => setFiscalYear(val)}
                  placeholder="انتخاب سال مالی"
                />
              </div>

              {exportType === "monthly" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">ماه عملکرد</Label>
                  <SearchableSelect
                    options={PERSIAN_MONTHS.filter((m) => m.value !== "15")}
                    value={month}
                    onChange={(val) => setMonth(val)}
                    placeholder="انتخاب ماه"
                  />
                </div>
              )}

              {exportType === "final" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">کد ماه در پروتکل</Label>
                  <Input value="۱۵ (تراز نهایی سال مالی)" disabled className="bg-slate-200/60 text-xs font-bold" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── ۲. بخش فیلتر دامنه سفارشی ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Filter className="h-4 w-4 text-emerald-600" />
              ۲. تعریف دامنه خروجی (محدودسازی کدهای حساب و اسناد)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <label
                onClick={() => setRangeMode("all")}
                className={cn(
                  "px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-2",
                  rangeMode === "all" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
              >
                <Layers className="h-4 w-4" />
                کل اسناد مالی
              </label>

              <label
                onClick={() => setRangeMode("custom")}
                className={cn(
                  "px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-2",
                  rangeMode === "custom" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
              >
                <Filter className="h-4 w-4" />
                دامنه سفارشی (فیلتر کد معین / تاریخ / سند)
              </label>
            </div>

            {rangeMode === "custom" && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">از کد معین</Label>
                  <Input placeholder="۱۱۰۰۱" value={fromAccountCode} onChange={(e) => setFromAccountCode(e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">تا کد معین</Label>
                  <Input placeholder="۶۹۰۰۱" value={toAccountCode} onChange={(e) => setToAccountCode(e.target.value)} className="font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">از تاریخ سند</Label>
                  <PersianDatePicker value={fromDate} onChange={(val) => setFromDate(val)} placeholder="۱۴۰۳/۰۱/۰۱" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">تا تاریخ سند</Label>
                  <PersianDatePicker value={toDate} onChange={(val) => setToDate(val)} placeholder="۱۴۰۳/۱۲/۲۹" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">منبع اعتبارات</Label>
                  <SearchableSelect options={SOURCE_TYPE_OPTIONS} value={sourceType} onChange={(val) => setSourceType(val)} placeholder="منبع اعتبارات" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ۳. بخش اعتبارسنجی و پیش‌نمایش ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                <Eye className="h-4 w-4 text-amber-600" />
                ۳. اعتبارسنجی و پیش‌نمایش داده‌های سناما
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                بررسی انطباق کدهای معین، بدهکار/بستانکار، شناسه ملی اشخاص و مغایرت بانکی
              </CardDescription>
            </div>
            <Button
              onClick={handleValidateAndPreview}
              disabled={validating}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2 h-9 px-4 text-xs font-bold rounded-lg cursor-pointer"
            >
              {validating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              اجرای اعتبارسنجی و پیش‌نمایش
            </Button>
          </CardHeader>

          {validationResult && (
            <CardContent className="pt-5 space-y-4">
              {/* آمار خلاصه */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-xs text-blue-600 font-medium">تعداد ردیف‌های گزارش</div>
                  <div className="text-base font-bold text-blue-900 mt-1">{validationResult.stats.totalReportRows}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="text-xs text-emerald-600 font-medium">مجموع گردش بدهکار</div>
                  <div className="text-xs font-bold text-emerald-900 mt-1 font-mono">
                    {validationResult.stats.totalDebitProgress.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-xs text-purple-600 font-medium">مجموع گردش بستانکار</div>
                  <div className="text-xs font-bold text-purple-900 mt-1 font-mono">
                    {validationResult.stats.totalCreditProgress.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="text-xs text-amber-600 font-medium">حساب‌های بانکی (مغایرت)</div>
                  <div className="text-base font-bold text-amber-900 mt-1">{validationResult.stats.totalContrastAccounts}</div>
                </div>
              </div>

              {/* نمایش وضعیت کلی اعتبارسنجی */}
              <div className="flex items-center justify-between p-3 rounded-xl border text-xs font-bold">
                <span>وضعیت صحت داده‌ها:</span>
                {validationResult.isValid ? (
                  <Badge className="bg-emerald-600 text-white gap-1 px-3 py-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    کاملاً معتبر و آماده خروجی
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 px-3 py-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {validationResult.errors.length} خطای اعتبارسنجی نیازمند اصلاح
                  </Badge>
                )}
              </div>

              {/* نمایش خطاهای اعتبارسنجی */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    خطاهای اعتبارسنجی (Errors):
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-red-50 rounded-xl border border-red-200">
                    {validationResult.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-red-800 flex items-start gap-2">
                        <span className="font-mono bg-red-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-red-900 shrink-0">
                          {err.code}
                        </span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* نمایش هشدارها و Mapping Gap ها */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    هشدارها و کمبود نگاشت داده (Mapping Gaps):
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    {validationResult.warnings.map((warn, idx) => (
                      <div key={idx} className="text-xs text-amber-900 flex items-start gap-2">
                        <span className="font-mono bg-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-950 shrink-0">
                          {warn.code}
                        </span>
                        <span>{warn.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* جدول نمونه پیش‌نمایش ردیف‌های خروجی */}
              {previewSummary && previewSummary.sampleItems?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Table className="h-4 w-4 text-blue-600" />
                    نمونه ردیف‌های خروجی XML (Report_List):
                  </h4>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-xs text-right text-slate-700">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b">
                        <tr>
                          <th className="p-2">کد معین (AccCode)</th>
                          <th className="p-2">گردش بدهکار</th>
                          <th className="p-2">گردش بستانکار</th>
                          <th className="p-2">کد شخص (NomineeCode)</th>
                          <th className="p-2">کد ردیف بودجه (SubBudgetCode)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewSummary.sampleItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 font-mono">
                            <td className="p-2 font-bold text-blue-700">{item.AccCode}</td>
                            <td className="p-2 text-emerald-700 font-bold">{Number(item.SummaryProgressDeptor).toLocaleString()}</td>
                            <td className="p-2 text-purple-700 font-bold">{Number(item.SummaryProgressCreditor).toLocaleString()}</td>
                            <td className="p-2">{item.NomineeCode || "0"}</td>
                            <td className="p-2">{item.SubBudgetCode || mainOrgCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* ── ۴. بخش دانلود نهایی ── */}
        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <div className="max-w-xl mx-auto space-y-1.5">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-3 py-1 font-semibold">
                دستگاه: {mainOrgCode} | سال {fiscalYear} | {exportType === "final" ? "تراز نهایی" : `ماه ${PERSIAN_MONTHS.find(m => m.value === month)?.label}`}
              </Badge>
              <p className="text-xs text-slate-500">
                فایل استاندارد XML تولید شده و مطابق الزامات امنیتی افتا در مرورگر بارگیری می‌گردد.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                onClick={handleDownload}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-8 text-sm font-bold shadow-md rounded-xl cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    در حال تولید و صدور فایل XML...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    تولید و دانلود فایل XML سناما (Edition 19)
                  </>
                )}
              </Button>
            </div>

            {status === "done" && (
              <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                فایل XML سناما با موفقیت صادر و دانلود شد.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
