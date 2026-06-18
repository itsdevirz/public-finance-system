import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileText, CreditCard, BookOpen } from "lucide-react";

const sections = [
  { icon: Database, title: "اعتبارات", description: "تعریف فصول، منابع، بندها و سایر اطلاعات اعتباری" },
  { icon: FileText, title: "تنظیم اسناد", description: "انواع سند و پرداخت" },
  { icon: CreditCard, title: "صدور چک", description: "شعب بانکی، حساب‌ها و گیرندگان" },
  { icon: BookOpen, title: "دفترداری", description: "سرفصل‌ها، دوره مالی و تفصیلی" },
];

export default function BasicInfo() {
  return (
    <PageShell>
      <PageHeader title="اطلاعات پایه" description="مدیریت اطلاعات پایه سیستم مالی" />
      <div className="grid gap-4 sm:grid-cols-2 animate-stagger">
        {sections.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="group cursor-default">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">از منوی کناری زیرمنوها را انتخاب کنید</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
