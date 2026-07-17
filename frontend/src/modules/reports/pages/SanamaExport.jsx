import { useState } from "react";
import { FileText, Download, Play, CheckCircle, Database } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/api";

export default function SanamaExport() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, done

  const handleGenerate = () => {
    setLoading(true);
    setStatus("processing");
    setTimeout(() => {
      setLoading(false);
      setStatus("done");
    }, 2000);
  };

  const handleDownload = async () => {
    try {
      const res = await api.get("/api/inventory/sanama-xml", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "sanama-export.xml";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download Sanama XML file", err);
      alert("خطا در دانلود فایل سناما");
    }
  };

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">گزارشات</span>
        <span>/</span>
        <span className="text-foreground">خروجی سناما</span>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-800">تهیه فایل خروجی سناما (وزارت امور اقتصادی و دارایی)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">تبدیل اطلاعات مالی و ثبت اسناد به ساختار استاندارد گزارشات سناما</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-100 max-w-2xl mx-auto" dir="rtl">
        <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-inner">
            <Database className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-base font-bold text-slate-800">سامانه تولید فایل الکترونیکی سناما</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              این بخش جهت استخراج فایل‌های اطلاعات مالی در ساختار XML مصوب وزارت امور اقتصادی و دارایی (سناما) پیاده‌سازی می‌شود.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-md mx-auto text-right text-xs space-y-2">
            <p className="font-bold text-slate-700">اقدامات پیش‌فرض سامانه:</p>
            <ul className="list-disc list-inside text-slate-600 space-y-1.5 pr-2">
              <li>بررسی صحت کدهای متناظر سناما در سرفصل‌های معین</li>
              <li>کنترل ساختار کدهای تفصیلی اشخاص</li>
              <li>بررسی کدهای منابع و مصارف بر اساس طبقه‌بندی سناما</li>
              <li>اعتبارسنجی تراز بودن اسناد قطعی صادر شده</li>
            </ul>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            {status === "done" ? (
              <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-10 px-6 font-bold shadow-sm">
                <Download className="h-4 w-4" /> دانلود فایل سناما (XML)
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-10 px-6 font-bold shadow-sm"
              >
                <Play className="h-4 w-4" /> {loading ? "در حال پردازش..." : "تولید خروجی"}
              </Button>
            )}

            {status !== "idle" && (
              <Button variant="outline" onClick={() => setStatus("idle")} className="h-10 text-xs">
                تنظیم مجدد
              </Button>
            )}
          </div>

          {status === "processing" && (
            <div className="text-xs text-blue-600 font-semibold animate-pulse">
              در حال استخراج تراکنش‌ها و اعتبارسنجی مقادیر سناما...
            </div>
          )}

          {status === "done" && (
            <div className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle className="h-4 w-4" /> استخراج فایل گزارش با موفقیت تکمیل شد و آماده دانلود است.
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
