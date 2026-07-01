import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/warehouse": "سیستم انبار",
  "/warehouse/dashboard": "داشبورد انبار",
  "/warehouse/items": "مدیریت کالاها",
  "/warehouse/items/list": "لیست کالاها",
  "/warehouse/items/new": "ثبت کالای جدید",
  "/warehouse/items/categories": "دسته‌بندی کالاها",
  "/warehouse/items/barcodes": "بارکد و QR Code",
  "/warehouse/stores": "مدیریت انبارها",
  "/warehouse/stores/list": "لیست انبارها",
  "/warehouse/stores/new": "ثبت انبار جدید",
  "/warehouse/stores/stock": "موجودی کالا در انبار",
  "/warehouse/receipts": "ورود کالا (رسید)",
  "/warehouse/receipts/new": "رسید جدید",
  "/warehouse/receipts/list": "لیست رسیدها",
  "/warehouse/receipts/purchase": "رسید خرید",
  "/warehouse/receipts/return": "برگشت از مصرف",
  "/warehouse/receipts/transfer-in": "رسید انتقال از انبار دیگر",
  "/warehouse/issues": "خروج کالا (حواله)",
  "/warehouse/issues/new": "حواله جدید",
  "/warehouse/issues/list": "لیست حواله‌ها",
  "/warehouse/issues/consumption": "مصرف داخلی",
  "/warehouse/issues/delivery": "تحویل به پرسنل",
  "/warehouse/issues/scrap": "اسقاط",
  "/warehouse/requests": "درخواست کالا",
  "/warehouse/requests/new": "درخواست جدید",
  "/warehouse/requests/list": "لیست درخواست‌ها",
  "/warehouse/requests/pending": "در انتظار تایید",
  "/warehouse/requests/approve": "تایید درخواست‌ها",
  "/warehouse/transfers": "انتقال بین انبارها",
  "/warehouse/transfers/new": "انتقال جدید",
  "/warehouse/transfers/list": "لیست انتقالات",
  "/warehouse/transfers/confirm": "تایید دریافت",
  "/warehouse/inventory": "انبارگردانی",
  "/warehouse/inventory/new": "شروع انبارگردانی",
  "/warehouse/inventory/count": "ثبت شمارش",
  "/warehouse/inventory/discrepancy": "گزارش مغایرت",
  "/warehouse/inventory/history": "تاریخچه انبارگردانی",
  "/warehouse/suppliers": "تامین‌کنندگان",
  "/warehouse/suppliers/list": "لیست تامین‌کنندگان",
  "/warehouse/suppliers/new": "ثبت تامین‌کننده",
  "/warehouse/reports": "گزارش‌ها",
  "/warehouse/reports/stock": "موجودی لحظه‌ای",
  "/warehouse/reports/stock-by-store": "موجودی هر انبار",
  "/warehouse/reports/stock-by-group": "موجودی هر گروه",
  "/warehouse/reports/turnover": "گردش ورود و خروج",
  "/warehouse/reports/transfers": "گزارش انتقالات",
  "/warehouse/reports/shortage": "کالاهای کمتر از نقطه سفارش",
  "/warehouse/reports/discrepancy": "مغایرت‌های انبار",
  "/warehouse/reports/audit": "تاریخچه عملیات (Audit)",
};

export default function Warehouse() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "سیستم انبار";
  return (
    <PageShell>
      <PageHeader title={title} description="سیستم مدیریت انبار سازمانی" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardContent>
          <EmptyState icon={FileX} title="این بخش در حال توسعه است"
            description={`صفحه «${title}» به زودی پیاده‌سازی می‌شود`} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
