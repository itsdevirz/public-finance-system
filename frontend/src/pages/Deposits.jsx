import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/deposits": "سپرده‌ها",
  "/deposits/auto-register": "ثبت اتوماتیک سپرده از سند",
  "/deposits/manual-form": "ثبت فرم سپرده دستی",
  "/deposits/treasury": "دریافت سپرده از خزانه/استرداد/ثبت شماره بستانکاری",
  "/deposits/search": "جستجوی سپرده",
};

export default function Deposits() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "سپرده‌ها";

  return (
    <PageShell>
      <PageHeader title={title} description="مدیریت سپرده‌های مالی" />
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
