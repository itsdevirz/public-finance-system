import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileStack } from "lucide-react";

export default function DocumentSetup() {
  return (
    <PageShell>
      <PageHeader title="تنظیم اسناد" description="صدور، جستجو و گزارش‌گیری اسناد مالی" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-110">
            <FileStack className="h-5 w-5" />
          </div>
          <CardTitle>مدیریت اسناد</CardTitle>
          <CardDescription>از منوی کناری یکی از عملیات اسناد را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            شامل صدور سند، فرم محاسبه، گزارشات و سایر عملیات مرتبط با اسناد مالی.
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
