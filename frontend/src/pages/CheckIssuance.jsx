import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/check-issuance": "صدور چک",
  "/check-issuance/receipts": "دریافت ها",
  "/check-issuance/receipts/check-issuance": "دریافت وجه - صدور چک",
  "/check-issuance/payments": "پرداخت ها",
  "/check-issuance/payments/with-check": "پرداخت با چک",
  "/check-issuance/payments/without-check": "پرداخت بدون چک",
  "/check-issuance/payments/cancel-check": "ابطال پرداخت با چک",
  "/check-issuance/payments/return-voided": "بازگشت چک باطله",
  "/check-issuance/payments/cancel-without-check": "ابطال پرداخت بدون چک",
  "/check-issuance/payments/check-delivery": "تحویل چک",
  "/check-issuance/payments/check-toggle": "فعال/غیرفعال کردن چک",
  "/check-issuance/payments/void-no-doc": "ابطال چک های بدون سند",
  "/check-issuance/payments/return-issued": "بازگرداندن چک صادر شده",
  "/check-issuance/payments/confirm-no-check-payment": "ثبت تایید پرداخت بی چک برای سند در حالت ذیحسابی",
  "/check-issuance/payments/aggregate-check": "پرداخت چک تجمیعی",
  "/check-issuance/payments/assign-no-doc": "اختصاص چک های بدون سند",
  "/check-issuance/payments/print-receipt": "چاپ فیش",
  "/check-issuance/payments/register-bank-receipt": "ثبت فیش های بانکی",
  "/check-issuance/payments/print-aggregate-confirmation": "چاپ تجمیعی تاییدیه چک",
  "/check-issuance/reports": "گزارش ها",
  "/check-issuance/reports/bank-ledgers": "دفاتر بانک",
  "/check-issuance/reports/bank-ledgers/regular": "گزارش عادی",
  "/check-issuance/reports/bank-ledgers/detailed": "گزارش تفکیکی",
  "/check-issuance/reports/balances": "موجودی ها",
  "/check-issuance/reports/bank-accounts": "لیست شماره حساب های هر بانک",
  "/check-issuance/reports/used-checks": "لیست چک های استفاده شده از دسته چک/شماره حساب",
  "/check-issuance/reports/remaining-checks": "لیست چک های باقیمانده از دسته چک/شماره حساب",
  "/check-issuance/reports/voided-checks": "لیست چک های باطل یا رزرو شده دسته چک/شماره حساب",
  "/check-issuance/reports/checkbooks": "لیست دسته چک های تعریف شده",
  "/check-issuance/reports/misc-search": "جستجوی متفرقه روی چک/بی چک",
  "/check-issuance/reports/aggregate-checks": "گزارش چک های تجمیعی",
  "/check-issuance/reports/aggregate-with-doc": "گزارش چک های تجمیعی با سند و بدون سند",
  "/check-issuance/e-transfer": "حواله الکترونیکی",
  "/check-issuance/e-transfer-batch": "حواله الکترونیکی-گروهی",
};

export default function CheckIssuance() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "صدور چک";

  return (
    <PageShell>
      <PageHeader title={title} description="بخش صدور چک - در حال توسعه" />
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
