import { useState } from "react";
import {
  FileText, Download, Play, CheckCircle, Database, Calendar,
  Filter, Layers, Hash, Sparkles, RefreshCw, HelpCircle, ShieldCheck
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";
import api from "@/api";

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
];

const FISCAL_YEAR_OPTIONS = [
  { value: "1401", label: "سال مالی ۱۴۰۱" },
  { value: "1402", label: "سال مالی ۱۴۰۲" },
  { value: "1403", label: "سال مالی ۱۴۰۳" },
  { value: "1404", label: "سال مالی ۱۴۰۴" },
  { value: "1405", label: "سال مالی ۱۴۰۵" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "all", label: "تمامی منابع (عمومی، اختصاصی و سایر)" },
  { value: "1", label: "منابع عمومی (۱)" },
  { value: "2", label: "منابع اختصاصی (۲)" },
  { value: "3", label: "سایر منابع و تسهیلات (۳)" },
];

export default function SanamaExport() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, done

  // ── ۱. فیلتر نوع خروجی (ماهانه و نهایی) ──
  const [exportType, setExportType] = useState("monthly"); // "monthly" | "final"
  const [month, setMonth] = useState("12");
  const [fiscalYear, setFiscalYear] = useState("1403");

  // ── ۲. فیلتر تعیین دامنه (Range Definition) ──
  const [rangeMode, setRangeMode] = useState("all"); // "all" | "custom"
  const [fromAccountCode, setFromAccountCode] = useState("");
  const [toAccountCode, setToAccountCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromDocNo, setFromDocNo] = useState("");
  const [toDocNo, setToDocNo] = useState("");
  const [sourceType, setSourceType] = useState("all");

  const handleDownload = async () => {
    setLoading(true);
    setStatus("processing");
    try {
      const queryParams = new URLSearchParams({
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
      });

      const res = await api.get(`/api/inventory/sanama-xml?${queryParams.toString()}`, {
        responseType: "blob"
      });

      const blob = new Blob([res.data], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const fileName = exportType === "final" 
        ? `sanama-final-${fiscalYear}.xml` 
        : `sanama-monthly-m${month.padStart(2, "0")}-${fiscalYear}.xml`;
        
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatus("done");
    } catch (err) {
      console.error("Failed to generate Sanama XML", err);
      alert("خطا در تولید و دانلود فایل سناما");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="تهیه فایل خروجی سناما (وزارت امور اقتصادی و دارایی)"
        description="تولید خروجی استاندارد XML مصوب پروتکل ۳.۱ خزانه‌داری کل کشور در دو حالت «ماهانه/نهایی» و «تعریف دامنه»"
      />

      <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
        {/* کارت توضیحات و استاندارد سناما */}
        <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md border-0">
          <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 text-right">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-cyan-400" />
                <h2 className="text-base font-bold text-white">سامانه تولید فایل الکترونیکی سناما (پروتکل ۳.۱)</h2>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                اطلاعات دفتر کل و اسناد مالی پس از اعتبارسنجی تراز بودن و کنترل کدهای ساختار سناما استخراج می‌شوند.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs text-xs font-mono text-cyan-200 shrink-0">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>پروتکل: SANAMA v3.1</span>
            </div>
          </CardContent>
        </Card>

        {/* ── ۱. بخش انتخاب نوع خروجی (ماهانه و نهایی) ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Calendar className="h-4 w-4 text-blue-600" />
              ۱. نوع خروجی (ماهانه و نهایی)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              انتخاب دوره زمانی و نوع گزارش عملکرد مالی (دوره ماهانه یا بستن حساب‌های نهایی پایان سال)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* انتخاب دکمه‌های زبانه ای ماهانه / نهایی */}
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
                  <h3 className="text-sm font-bold text-slate-800">خروجی ماهانه (Monthly)</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    گزارش عملکرد یک ماه مشخص از سال مالی (پروتکل ماهانه خزانه‌داری کل)
                  </p>
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
                  <h3 className="text-sm font-bold text-slate-800">خروجی نهایی (Final / پایان سال)</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    گزارش موازنه کل و بستن حساب‌های نهایی سال مالی (پروتکل نهایی کد ۱۵)
                  </p>
                </div>
              </div>
            </div>

            {/* کنترل‌های سال و ماه */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">سال مالی</Label>
                <SearchableSelect
                  options={FISCAL_YEAR_OPTIONS}
                  value={fiscalYear}
                  onChange={(val) => setFiscalYear(val)}
                  placeholder="انتخاب سال مالی"
                />
              </div>

              {exportType === "monthly" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">انتخاب ماه عملکرد</Label>
                  <SearchableSelect
                    options={PERSIAN_MONTHS}
                    value={month}
                    onChange={(val) => setMonth(val)}
                    placeholder="انتخاب ماه"
                  />
                </div>
              )}

              {exportType === "final" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">کد عملکرد پروتکل</Label>
                  <Input value="پروتکل نهایی پایان سال (کد ۱۵)" disabled className="bg-slate-200/60 text-xs font-semibold" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── ۲. بخش تعریف دامنه (Scope & Range Definition) ── */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <Filter className="h-4 w-4 text-emerald-600" />
              ۲. تعریف دامنه خروجی (محدودسازی کدهای حساب و اسناد)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              تعیین دامنه کدهای معین، بازه تاریخ، شماره اسناد و نوع منابع اعتبارات جهت فیلتر فایل خروجی
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* انتخاب حالت دامنه (کل / سفارشی) */}
            <div className="flex flex-wrap items-center gap-4">
              <label
                onClick={() => setRangeMode("all")}
                className={cn(
                  "px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-2",
                  rangeMode === "all" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
              >
                <Layers className="h-4 w-4" />
                کل اطلاعات (بدون محدودیت دامنه)
              </label>

              <label
                onClick={() => setRangeMode("custom")}
                className={cn(
                  "px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-2",
                  rangeMode === "custom" ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                )}
              >
                <Filter className="h-4 w-4" />
                تعریف دامنه سفارشی (فیلتر بر اساس کد حساب، تاریخ و سند)
              </label>
            </div>

            {/* فرم پارامترهای دامنه سفارشی */}
            {rangeMode === "custom" && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* دامنه کدهای حساب معین */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">از کد معین</Label>
                    <Input
                      placeholder="مثلاً ۱۱۰۰۱"
                      value={fromAccountCode}
                      onChange={(e) => setFromAccountCode(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">تا کد معین</Label>
                    <Input
                      placeholder="مثلاً ۶۹۰۰۱"
                      value={toAccountCode}
                      onChange={(e) => setToAccountCode(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* دامنه تاریخ اسناد */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">از تاریخ سند</Label>
                    <PersianDatePicker
                      value={fromDate}
                      onChange={(val) => setFromDate(val)}
                      placeholder="۱۴۰۳/۰۱/۰۱"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">تا تاریخ سند</Label>
                    <PersianDatePicker
                      value={toDate}
                      onChange={(val) => setToDate(val)}
                      placeholder="۱۴۰۳/۱۲/۲۹"
                    />
                  </div>

                  {/* دامنه شماره اسناد */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">از شماره سند</Label>
                    <Input
                      type="number"
                      placeholder="۱"
                      value={fromDocNo}
                      onChange={(e) => setFromDocNo(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">تا شماره سند</Label>
                    <Input
                      type="number"
                      placeholder="۵۰۰"
                      value={toDocNo}
                      onChange={(e) => setToDocNo(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* دامنه منبع اعتبارات */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs font-bold text-slate-700">منبع اعتبارات</Label>
                    <SearchableSelect
                      options={SOURCE_TYPE_OPTIONS}
                      value={sourceType}
                      onChange={(val) => setSourceType(val)}
                      placeholder="انتخاب منبع اعتبارات"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ۳. بخش تولید و دانلود ── */}
        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardContent className="pt-6 pb-6 text-center space-y-4">
            <div className="max-w-xl mx-auto space-y-1.5">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-3 py-1 font-semibold">
                تنظیمات آماده: {exportType === "final" ? `خروجی نهایی سال ${fiscalYear}` : `خروجی ماهانه ${PERSIAN_MONTHS.find(m => m.value === month)?.label} - ${fiscalYear}`}
                {rangeMode === "custom" && " (با دامنه سفارشی)"}
              </Badge>
              <p className="text-xs text-slate-500">
                فایل استاندارد XML تولید شده و به طور مستقیم در مرورگر ذخیره می‌گردد.
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
                    در حال تولید فایل سناما (XML)...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    تولید و دانلود فایل سناما (XML)
                  </>
                )}
              </Button>

              {status === "done" && (
                <Button variant="outline" onClick={() => setStatus("idle")} className="h-11 text-xs rounded-xl">
                  بازنشانی
                </Button>
              )}
            </div>

            {status === "done" && (
              <div className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1.5 animate-fadeIn">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                فایل خروجی سناما با موفقیت تولید و دانلود شد.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
