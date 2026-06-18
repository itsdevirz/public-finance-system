import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";

export default function Review() {
  return (
    <PageShell>
      <PageHeader title="رسیدگی" description="بررسی و رسیدگی اسناد مالی" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <CardTitle>بخش رسیدگی</CardTitle>
          <CardDescription>این ماژول به‌زودی در دسترس خواهد بود</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">از منوی کناری زیرمنوهای مربوطه را انتخاب کنید.</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
