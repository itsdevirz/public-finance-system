import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/system-management": "مدیریت سیستم",
  "/system-management/automatic-doc-types": "تعریف انواع سند های اتوماتیک محاسباتی",
  "/system-management/non-calc-doc-types": "تعریف انواع سند های اتوماتیک غیر محاسباتی",
  "/system-management/credit-payroll-template": "قالب تامین اعتبار حقوق",
  "/system-management/payroll-doc-template": "قالب سند حقوق",
  "/system-management/assets-doc-template": "قالب سند اموال",
  "/system-management/calc-formulas": "تعریف فرمول محاسبه",
  "/system-management/balance-control": "کنترل موجودی حساب و برنامه/طرح",
  "/system-management/credit-control": "کنترل تامین اعتبار",
  "/system-management/program-details": "تکمیل اطلاعات برنامه ها/طرح ها",
  "/system-management/user-groups": "تعریف گروه کاربران",
  "/system-management/users": "تعریف کاربر",
  "/system-management/permissions": "تعریف دسترسی",
  "/system-management/change-password": "تغییر رمزعبور",
  "/system-management/user-performance": "مشاهده عملکرد کاربر",
  "/system-management/financial-details": "مشخصات ذیحسابی",
  "/system-management/approve-docs": "تصویب گروهی اسناد",
  "/system-management/close-account-chapters": "تنظیم سرفصل های بستن حساب",
  "/system-management/settings": "تنظیمات",
  "/system-management/document-templates": "الگوی سند",
  "/system-management/document-templates/current-operations": "حسابداری عملیات جاری",
  "/system-management/document-templates/payroll": "حسابداری حقوق و مزایای مستمر کارکنان",
  "/system-management/document-templates/capital-operations": "حسابداری عملیات سرمایه‌ای",
  "/system-management/document-templates/revenues": "حسابداری درآمدها",
  "/system-management/document-templates/deposits": "حسابداری وجوه سپرده",
  "/system-management/document-templates/special-cases": "حسابداری موارد خاص",
  "/system-management/update-manager": "مدیریت بروزرسانی",
  "/system-management/backup": "گرفتن نسخه پشتیبان",
  "/system-management/report-signature": "تنظیم امضای گزارشات",
  "/system-management/report-generator": "گزارش ساز",
  "/system-management/report-generator/define": "تعریف گزارش",
  "/system-management/report-generator/settings": "تنظیم گزارش",
  "/system-management/report-generator/generate": "گزارش گیری",
  "/system-management/report-generator/generate-2": "گزارش گیری-2",
  "/system-management/report-generator/generate-3": "گزارش گیری-3",
  "/system-management/person-chapters": "تنظیم سرفصل های اشخاص",
  "/system-management/revoke-reconciliation": "ابطال مغایرت گیری",
  "/system-management/user-circle": "تعریف دایره کاربران",
  "/system-management/revoke-sanama": "ابطال سناما",
  "/system-management/signature-group": "گروه امضا",
  "/system-management/convert-chapter95": "تبدیل به سرفصل 95",
  "/system-management/convert-chapter94": "تبدیل به سرفصل 94",
  "/system-management/common-settings": "تنظیمات عمومی",
  "/system-management/change-moein-doc": "تغییر معین در سند",
  "/system-management/cartable": "کارتابل",
  "/system-management/credit-settings": "تنظیمات موافقت نامه/تخصیص/دریافت وجه",
  "/system-management/revoke-e-transfer": "ابطال حواله الکترونیکی",
  "/system-management/sanama-file-check": "بررسی فایل سناما",
  "/system-management/doc-requirements": "بررسی الزامات اسناد",
};

export default function SystemManagement() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "مدیریت سیستم";

  return (
    <PageShell>
      <PageHeader title={title} description="تنظیمات و پیکربندی سامانه" />
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
