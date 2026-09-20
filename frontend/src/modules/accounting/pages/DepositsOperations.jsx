import { useState } from "react";
import CurrentOperations from "./CurrentOperations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ShieldCheck, Landmark, Receipt, FileCheck, Layers, Info } from "lucide-react";

export const DEPOSIT_TEMPLATES_GUIDE = [
  {
    num: 1,
    title: "ثبت شماره ۱: واریز وجوه سپرده به حساب مربوط",
    desc: "به هنگام واریز وجوه سپرده به حساب مربوط.",
    debit: "بانک دریافت وجوه سپرده (۱۱۰۰۵)",
    credit: "بانک اعتبارات سرمایه‌ای (۱۱۰۰۲)"
  },
  {
    num: 2,
    title: "ثبت شماره ۲: دریافت تضمین به صورت سپرده نقدی",
    desc: "دریافت تضمین به صورت سپرده نقدی.",
    debit: "بانک دریافت وجوه سپرده (۱۱۰۰۵)",
    credit: "سپرده پرداختنی (۲۱۰۰۷)"
  },
  {
    num: 3,
    title: "ثبت شماره ۳: انتقال وجوه تضامین به حساب خزانه",
    desc: "انتقال وجوه تضامین به حساب خزانه.",
    debit: "مطالبات از خزانه (۱۱۵۲۲)",
    credit: "بانک دریافت وجوه سپرده (۱۱۰۰۵)"
  },
  {
    num: 4,
    title: "ثبت شماره ۴: دریافت وجه از خزانه بابت تنخواه‌گردان رد وجوه سپرده",
    desc: "دریافت وجه از خزانه بابت تنخواه‌گردان رد وجوه سپرده.",
    debit: "بانک رد وجوه سپرده (۱۱۰۰۶)",
    credit: "دریافتی بابت تنخواه‌گردان رد وجوه سپرده (۱۱۵۱۳)"
  },
  {
    num: 5,
    title: "ثبت شماره ۵: دریافت از خزانه بابت رد وجوه سپرده",
    desc: "دریافت از خزانه بابت رد وجوه سپرده.",
    debit: "بانک رد وجوه سپرده (۱۱۰۰۶)",
    credit: "مطالبات از خزانه (۱۱۵۲۲)"
  },
  {
    num: 6,
    title: "ثبت شماره ۶: واگذاری تنخواه‌گردان رد وجوه سپرده به عاملین",
    desc: "واگذاری تنخواه‌گردان رد وجوه سپرده به عاملین.",
    debit: "تنخواه‌گردان رد وجوه سپرده عاملین (۱۱۰۲۳)",
    credit: "بانک رد وجوه سپرده (۱۱۰۰۶)"
  },
  {
    num: 7,
    title: "ثبت شماره ۷: استرداد وجوه سپرده",
    desc: "استرداد وجوه سپرده به پیمانکار/ذی‌نفع.",
    debit: "سپرده پرداختنی (۲۱۰۰۷)",
    credit: "بانک رد وجوه سپرده (۱۱۰۰۶)"
  },
  {
    num: 8,
    title: "ثبت شماره ۸: استرداد سپرده از محل تنخواه‌گردان رد وجوه سپرده",
    desc: "در صورتی که استرداد سپرده از محل تنخواه‌گردان رد وجوه سپرده انجام شود.",
    debit: "دریافتی بابت تنخواه‌گردان رد وجوه سپرده (۱۱۵۱۳)",
    credit: "مطالبات از خزانه (۱۱۵۲۲)"
  },
  {
    num: 9,
    title: "ثبت شماره ۹: ضبط وجوه سپرده (ماده ۴۲ شرایط عمومی پیمان)",
    desc: "ضبط به دلیل حوادث قهری، فسخ، تأخیر؛ شناسایی ۱۵٪ درآمد حاصل از جرایم و خسارات.",
    debit: "بانک رد وجوه سپرده (۱۱۰۰۶) | سپرده پرداختنی (۲۱۰۰۷)",
    credit: "مطالبات از خزانه (۱۱۵۲۲) | درآمد حاصل از جرایم و خسارات (۴۵۰۰۵)"
  },
  {
    num: 10,
    title: "ثبت شماره ۱۰: شناسایی عیب و نقص ناشی از کار پیمانکار",
    desc: "شناسایی عیب و نقص ناشی از کار پیمانکار و عدم ایفای تعهدات.",
    debit: "سپرده پرداختنی (۲۱۰۰۷)",
    credit: "دارایی در جریان تکمیل (۱۵۰۰۱) | درآمد حاصل از جرایم و خسارات (۴۵۰۰۵)"
  },
  {
    num: 11,
    title: "ثبت شماره ۱۱: تأمین و برداشت مبلغ مورد نیاز بابت رفع عیب و نقص",
    desc: "تأمین و برداشت مبلغ مورد نیاز بابت رفع عیب و نقص پیمانکار.",
    debit: "بانک رد وجوه سپرده (۱۱۰۰۶)",
    credit: "مطالبات از خزانه (۱۱۵۲۲)"
  },
  {
    num: 12,
    title: "ثبت شماره ۱۲: رفع عیب و نقص (عدم ایفای تعهد پیمانکار)",
    desc: "رفع عیب و نقص ناشی از عدم ایفای تعهد پیمانکار توسط دستگاه.",
    debit: "دارایی در جریان تکمیل (۱۵۰۰۱)",
    credit: "حساب اسناد پرداختنی (۲۱۰۰۱) | بانک رد وجوه سپرده (۱۱۰۰۶)"
  },
  {
    num: 13,
    title: "ثبت شماره ۱۳: واریز ۱۵٪ جرایم و خسارات به حساب درآمد عمومی",
    desc: "واریز ۱۵٪ مبلغ حاصل از جرایم و خسارات (ماده ۴۲) به حساب درآمد عمومی.",
    debit: "وجوه ارسالی بابت درآمد عمومی (۷۱۰۰۱)",
    credit: "بانک رد وجوه سپرده (۱۱۰۰۶)"
  },
  {
    num: 14,
    title: "ثبت شماره ۱۴: ثبت بستن حساب‌های وجوه سپرده (سند مرکب پایانی)",
    desc: "تصفیه و بستن حساب‌های مربوط به وجوه سپرده در پایان دوره مالی.",
    debit: "دریافتی تنخواه‌گردان رد سپرده (۱۱۵۱۳) | سپرده پرداختنی (۲۱۰۰۷)",
    credit: "بانک رد سپرده (۱۱۰۰۶) | تنخواه عاملین (۱۱۰۲۳) | مطالبات از خزانه (۱۱۵۲۲) | بانک دریافت سپرده (۱۱۰۰۵)"
  }
];

export default function DepositsOperations() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-6" dir="rtl">
      {/* کارت راهنما و خلاصه کدهای معین سپرده */}
      <Card className="border border-blue-200/80 bg-gradient-to-r from-blue-50/50 via-card to-blue-50/20 shadow-xs">
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-black text-blue-950">
                  راهنمای راهبردی ثبت‌های ۱۴‌گانه حسابداری وجوه سپرده
                </CardTitle>
                <CardDescription className="text-xs text-blue-800/80 mt-0.5">
                  الگوهای استاندارد دوبل حسابداری دولتی برای دریافت، استرداد، تنخواه‌گردان رد سپرده، ضبط ماده ۴۲ و رفع عیب و نقص
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(!showGuide)}
              className="gap-1.5 text-xs font-bold border-blue-300 text-blue-800 bg-background hover:bg-blue-50"
            >
              <Info className="h-4 w-4 text-blue-600" />
              <span>{showGuide ? "مخفی‌سازی راهنمای ثبت‌ها" : "مشاهده راهنمای ۱۴ ثبت حسابداری سپرده"}</span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardHeader>

        {showGuide && (
          <CardContent className="p-4 pt-0 border-t border-blue-100 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {DEPOSIT_TEMPLATES_GUIDE.map((tpl) => (
                <div key={tpl.num} className="p-3 rounded-xl bg-background border border-blue-100 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950">{tpl.title}</span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-blue-50 text-blue-700">
                      ثبت DEP-{String(tpl.num).padStart(2, "0")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.desc}</p>
                  <div className="text-[10px] font-mono space-y-0.5 pt-1 border-t border-dashed">
                    <div className="text-emerald-700 font-semibold">بدهکار: {tpl.debit}</div>
                    <div className="text-rose-700 font-semibold">بستانکار: {tpl.credit}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ماژول اصلی ثبت و صدور اسناد حسابداری وجوه سپرده */}
      <CurrentOperations
        categoryFilter="deposits"
        pageTitle="حسابداری وجوه سپرده"
        pageDescription="لیست اسناد صادر شده و کارتابل صدور سند مالى با استفاده از الگوهای ثبت ۱۴‌گانه وجوه سپرده"
      />
    </div>
  );
}
