import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/credits": "اعتبارات",
  "/credits/agreements": "موافقت نامه",
  "/credits/allocation-no-doc": "تخصیص بدون سند",
  "/credits/search": "جستجو در موافقت نامه، تخصیص و دریافت وجه",
  "/credits/receipt-no-doc": "دریافت وجه بدون سند",
  "/credits/funded": "اعتبار تامین شده",
  "/credits/funded-search": "جستجو در اعتبار تامین شده",
  "/credits/funded-copy": "کپی تامین اعتبار",
  "/credits/funded-merge": "ادغام تامین اعتبار",
  "/credits/payroll-from-excel": "تامین حقوق از اکسل",
  "/credits/payroll-funding": "تامین اعتبار حقوق",
  "/credits/payment-request-no-doc": "درخواست وجه بدون سند",
  "/credits/notification": "ابلاغ",
  "/credits/notification/request": "درخواست ابلاغ",
  "/credits/notification/bank-report": "گزارش اعلام به بانک",
  "/credits/notification/court-form": "فرم دیوان محاسبات",
  "/credits/notification/recipients-report": "گزارش ابلاغ گیرندگان",
  "/credits/notification/request-report": "گزارش درخواست ابلاغ",
  "/credits/notification/recipients-detail-report": "گزارش ابلاغ گیرندگان تفکیکی",
  "/credits/notification/fund-confirmation": "تاییدیه وجوه ابلاغی",
  "/credits/notification/request-report-2": "گزارش درخواست ابلاغ ۲",
  "/credits/notification/supplementary-report": "گزارش تکمیلی ابلاغ",
  "/credits/notification/copy-request": "کپی درخواست ابلاغ",
  "/credits/reports": "گزارش ها",
  "/credits/reports/budget": "گزارش های بودجه ای",
  "/credits/reports/budget/all-programs": "لیست کلیه برنامه ها",
  "/credits/reports/budget/program-activities": "لیست فعالیت های یک برنامه",
  "/credits/reports/budget/funded-programs": "لیست برنامه های دارای اعتبار",
  "/credits/reports/budget/dept-by-deputy": "لیست ادارات کل هر معاونت",
  "/credits/reports/budget/deputy-activities": "لیست فعالیت های یک معاونت",
  "/credits/reports/budget/program-agents": "لیست عامل های ذیحساب یک برنامه",
  "/credits/reports/budget/program-notif-receivers": "لیست ابلاغ گیرندگان از یک برنامه",
  "/credits/reports/budget/activity-notif-receivers": "لیست ابلاغ گیرندگان از یک فعالیت",
  "/credits/reports/budget/misc-payments": "لیست پرداخت های متفرقه",
  "/credits/reports/budget/contracts-by-program": "لیست قراردادهای یک برنامه/فعالیت/زیرفعالیت",
  "/credits/reports/budget/contract-programs": "لیست برنامه های یک قرارداد",
  "/credits/reports/budget/contract-activities": "لیست فعالیت های یک قرارداد",
  "/credits/reports/budget/contract-sub-activities": "لیست زیرفعالیت های یک قرارداد",
  "/credits/reports/performance": "گزارش های عملکردی",
  "/credits/reports/performance/program-stats": "آمار عملکرد برنامه ها به تفکیک هر برنامه",
  "/credits/reports/performance/by-program": "گزارش اعتبارات به تفکیک برنامه",
  "/credits/reports/performance/by-chapter-program": "گزارش اعتبارات به تفکیک فصل های یک برنامه-2",
  "/credits/reports/performance/by-deputy": "گزارش اعتبارات برحسب معاونت برنامه",
  "/credits/reports/performance/summary": "گزارش خلاصه اعتبارات",
  "/credits/reports/performance/funding": "گزارش تامین اعتبار",
  "/credits/reports/performance/by-agent": "گزارش اعتبارات به تفکیک عامل ذیحساب",
  "/credits/reports/performance/by-notif-receiver": "گزارش اعتبارات به تفکیک ابلاغ گیرنده",
  "/credits/reports/ledgers": "دفاتر اعتبارات",
  "/credits/reports/ledgers/program-level": "درسطح برنامه/طرح-فعالیت/پروژه-زیرفعالیت/زیرپروژه",
  "/credits/reports/ledgers/contract-level": "درسطح قرارداد",
  "/credits/reports/ledgers/agent-level": "درسطح عامل ذیحساب",
  "/credits/reports/ledgers/notif-receiver-level": "درسطح ابلاغ گیرندگان",
  "/credits/reports/ledgers/misc-level": "درسطح متفرقه",
  "/credits/reports/ledgers/interim-docs": "دفتر اعتبارات اسناد بین راهی",
  "/credits/reports/ledgers/documentary": "دفتر اعتبارات اسنادی",
  "/credits/reports/ledgers/petty-cash": "گزارش تنخواه",
  "/credits/reports/ledgers/overall": "گزارش اعتباری کلی",
  "/credits/reports/agreements": "گزارش های موافقت نامه ای",
  "/credits/reports/agreements/by-detail": "اعتبارات به تفکیک",
  "/credits/reports/agreements/by-detail/program": "برنامه",
  "/credits/reports/agreements/by-detail/activity": "فعالیت",
  "/credits/reports/agreements/by-detail/clause": "بند و اجرا",
  "/credits/reports/agreements/by-detail/investment-chapters": "فصول سرمایه گذاری",
  "/credits/reports/agreements/by-detail/expense-resources": "اعتبارات هزینه و منابع",
  "/credits/reports/agreements/expense-resources": "موافقت نامه اعتبارات هزینه ای و منابع",
  "/credits/reports/agreements/expense-resources/form-2a": "فرم دو الف-اعتبارات هزینه ای بر حسب برنامه/فصل",
  "/credits/reports/agreements/expense-resources/form-4-chapters": "فرم شماره چهار-شروع شرح فصول هزینه",
  "/credits/reports/agreements/expense-resources/form-4-personnel": "فرم شماره چهار-انتساب هزینه های پرسنلی",
  "/credits/reports/agreements/expense-resources/form-5-income": "فرم شماره پنج-درآمدها-واگذاری دارایی های سرمایه ای و مالی",
  "/credits/reports/agreements/expense-resources/form-1-summary": "فرم شماره یک-خلاصه بودجه دستگاه",
  "/credits/reports/agreements/expense-resources/form-6-manpower": "فرم شماره شش-نیروی انسانی",
  "/credits/reports/agreements/expense-resources/form-4b-non-personnel": "فرم شماره چهار ب-انتساب هزینه های غیر پرسنلی",
  "/credits/reports/agreements/expense-resources/form-3-program-activity": "فرم شماره سه-اعتبارات هزینه ای بر حسب برنامه/فعالیت و اهداف کمی",
  "/credits/reports/agreements/expense-resources/form-2b-annual-plan": "فرم شماره دو ب-ارتباط برنامه سالانه با مراکز فعالیت اصلی",
  "/credits/reports/agreements/expense-resources/form-7-provincial": "فرم شماره هفت-توزیع استانی اعتبارات",
  "/credits/reports/agreements/expense-resources/form-2-expense-program": "فرم شماره دو-اعتبارات هزینه بر حسب برنامه",
  "/credits/reports/agreements/form-four": "فرم چهار موافقت نامه",
  "/credits/reports/agreements/detailed-budget": "گزارش بودجه تفصیلی",
  "/credits/reports/agreements/payment-control": "گزارش کنترل پرداخت های بودجه، فرم شماره پنج",
  "/credits/reports/allocation": "گزارش های تخصیص اعتبار",
  "/credits/reports/allocation/by-program": "لیست تخصیص اعتبار بر حسب برنامه",
  "/credits/reports/allocation/all": "لیست کلیه تخصیص اعتبارات",
  "/credits/reports/allocation/program-chapter": "لیست تخصیص اعتبار برنامه فصل",
  "/credits/reports/receipts": "گزارش های دریافت وجه",
  "/credits/reports/receipts/all": "لیست کلیه دریافتی ها",
  "/credits/reports/receipts/no-program": "لیست دریافتی های بدون برنامه",
  "/credits/reports/credits-1": "گزارش اعتبارات-1",
  "/credits/reports/payment-request-no-doc": "گزارش درخواست وجه بدون سند",
  "/credits/reports/comprehensive": "گزارش جامع اعتبارات",
  "/credits/reports/commercial": "گزارش بازرگانی",
  "/credits/reports/by-detail": "گزارش اعتبارات بر حسب تفصیل",
  "/credits/sub-accountant-agent": "عامل ذیحساب",
  "/credits/sub-accountant-agent/version-1": "نسخه اول",
  "/credits/sub-accountant-agent/version-1/total-credit-form": "فرم تعیین اعتبار کلی",
  "/credits/sub-accountant-agent/version-1/agent-requests": "درخواست وجه های عاملین",
  "/credits/sub-accountant-agent/version-1/agent-expenses": "هزینه های عاملین",
  "/credits/sub-accountant-agent/version-1/fund-from-expense": "ثبت تامین اعتبار از هزینه",
  "/credits/sub-accountant-agent/version-2": "نسخه دوم",
  "/credits/sub-accountant-agent/version-2/send-credit": "ارسال اعتبار به عامل",
  "/credits/sub-accountant-agent/version-2/confirm-issue": "تایید و صدور تامین برای عامل",
  "/credits/sub-accountant-agent/view-confirm-credit": "مشاهده و تایید اعتبار",
  "/credits/sub-accountant-agent/view-confirm-request": "مشاهده و تایید درخواست",
  "/credits/sub-accountant-agent/view-confirm-expense": "مشاهده و تایید هزینه",
  "/credits/sub-accountant-agent/plan-program-percent": "درصد طرح/برنامه",
  "/credits/sub-accountant-agent/cost-center-relation": "ارتباط مراکز هزینه",
  "/credits/sub-accountant-agent/agents-relation": "ارتباط عاملین ذیحساب",
  "/credits/read-from-file": "خواندن اطلاعات از فایل",
  "/credits/warehouse-receipt-reg": "ثبت اعتبارات رسید و حواله انبار",
  "/credits/fund-from-doc": "ثبت تامین اعتبار از سند",
  "/credits/warehouse-fund-template": "قالب تامین اعتبار انبار",
};

export default function Credits() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "اعتبارات";

  return (
    <PageShell>
      <PageHeader title={title} description="بخش اعتبارات - در حال توسعه" />
      <Card>
        <CardContent className="p-0 pt-6 px-6 pb-6">
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
