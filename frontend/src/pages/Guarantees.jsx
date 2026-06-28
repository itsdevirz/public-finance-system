import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/guarantees": "تضمینات",
  "/guarantees/types": "انواع تضمینات",
  "/guarantees/causes": "تعریف علت ضمانت",
  "/guarantees/guarantee-type": "نوع تضمین",
  "/guarantees/subject": "موضوع تضمین",
  "/guarantees/register": "ثبت ضمانت نامه",
  "/guarantees/register/contract": "ضمانت قرارداد",
  "/guarantees/register/person": "ضمانت اشخاص",
  "/guarantees/auto-doc": "سند اتوماتیک ضمانت",
  "/guarantees/extension-request": "درخواست تمدید ضمانت نامه گروهی",
  "/guarantees/report": "گزارش ضمانت نامه",
  "/guarantees/status-report": "گزارشات وضعیت تضمینات",
  "/guarantees/status-report/status": "وضعیت تضمینات",
  "/guarantees/date-report": "گزارش ضمانت نامه ها بر اساس تاریخ",
};

export default function Guarantees() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "تضمینات";

  return (
    <PageShell>
      <PageHeader title={title} description="مدیریت ضمانت‌نامه‌ها و تضمینات" />
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
