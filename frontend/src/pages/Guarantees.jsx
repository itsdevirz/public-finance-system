import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Guarantees() {
  return (
    <PageShell>
      <PageHeader title="تضمینات" description="مدیریت ضمانت‌نامه‌ها و تضمینات" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <CardTitle>تضمینات</CardTitle>
          <CardDescription>ثبت و پیگیری ضمانت‌نامه‌ها</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">این بخش در حال توسعه است.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
