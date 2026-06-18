import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SystemManagement() {
  return (
    <PageShell>
      <PageHeader title="مدیریت سیستم" description="تنظیمات و پیکربندی سامانه" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <CardTitle>تنظیمات سیستم</CardTitle>
          <CardDescription>مدیریت کاربران، دسترسی‌ها و پیکربندی</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">این بخش در حال توسعه است.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
