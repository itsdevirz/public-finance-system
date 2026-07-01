import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/assets": "سیستم اموال",
  "/assets/basic-info": "اطلاعات پایه",
  "/assets/basic-info/asset-groups": "تعریف گروه اموال",
  "/assets/basic-info/asset-subgroups": "تعریف زیرگروه اموال",
  "/assets/basic-info/asset-types": "تعریف نوع مال (مصرفی/غیرمصرفی)",
  "/assets/basic-info/asset-nature": "تعریف ماهیت مال (منقول/غیرمنقول)",
  "/assets/basic-info/units": "تعریف واحد اندازه‌گیری",
  "/assets/basic-info/locations": "تعریف مکان‌ها (ساختمان/طبقه/اتاق)",
  "/assets/basic-info/suppliers": "تعریف تامین‌کنندگان",
  "/assets/basic-info/depreciation-methods": "روش‌های استهلاک",
  "/assets/register": "ثبت اموال",
  "/assets/register/new": "ثبت مال جدید",
  "/assets/register/label": "الصاق برچسب / QR Code",
  "/assets/register/delivery": "تحویل به پرسنل",
  "/assets/register/return": "عودت مال",
  "/assets/register/transfer": "انتقال بین واحدها",
  "/assets/register/repair": "ارسال به تعمیر",
  "/assets/register/scrap": "اسقاط مال",
  "/assets/register/sale": "فروش مال",
  "/assets/register/lost": "ثبت مفقودی",
  "/assets/depreciation": "استهلاک",
  "/assets/depreciation/setup": "تنظیم استهلاک",
  "/assets/depreciation/monthly": "محاسبه استهلاک ماهانه",
  "/assets/depreciation/annual": "محاسبه استهلاک سالانه",
  "/assets/depreciation/document": "صدور سند استهلاک",
  "/assets/warehouse": "انبار و موجودی",
  "/assets/warehouse/receipt": "رسید انبار (اموال مصرفی)",
  "/assets/warehouse/issue": "حواله انبار",
  "/assets/warehouse/balance": "موجودی انبار",
  "/assets/warehouse/min-stock": "هشدار حداقل موجودی",
  "/assets/reports": "گزارش‌ها",
  "/assets/reports/all": "لیست کلیه اموال",
  "/assets/reports/by-unit": "اموال هر واحد",
  "/assets/reports/by-employee": "اموال هر کارمند",
  "/assets/reports/labeled": "اموال برچسب‌دار",
  "/assets/reports/unlabeled": "اموال بدون برچسب",
  "/assets/reports/depreciation-monthly": "استهلاک ماهانه",
  "/assets/reports/depreciation-annual": "استهلاک سالانه",
  "/assets/reports/depreciation-cumulative": "استهلاک انباشته",
  "/assets/reports/book-value": "ارزش دفتری اموال",
  "/assets/reports/lost": "اموال مفقود",
  "/assets/reports/scrapped": "اموال اسقاطی",
  "/assets/reports/in-repair": "اموال در تعمیر",
  "/assets/reports/transferred": "اموال منتقل شده",
};

export default function Assets() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "سیستم اموال";

  return (
    <PageShell>
      <PageHeader title={title} description="سیستم مدیریت اموال سازمانی" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardContent>
          <EmptyState
            icon={FileX}
            title="این بخش در حال توسعه است"
            description={`صفحه «${title}» به زودی پیاده‌سازی می‌شود`}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
