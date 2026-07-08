import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Scale, RefreshCw, Wallet, AlignLeft, XCircle,
  Search, Printer, FileDown, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  { id: "trial-balance",   label: "تراز آزمایشی",                icon: Scale },
  { id: "turnover",        label: "گردش حساب‌ها",                icon: RefreshCw },
  { id: "balance",         label: "مانده حساب‌ها",               icon: Wallet },
  { id: "detail-turnover", label: "ریز گردش حساب",               icon: AlignLeft },
  { id: "no-turnover",     label: "حساب‌های فاقد گردش",          icon: XCircle },
];

const ROUTE_MAP = {
  "trial-balance":   "/reports/accounts/trial-balance",
  "turnover":        "/reports/accounts/turnover",
  "balance":         "/reports/accounts/balance",
  "detail-turnover": "/reports/accounts/detail-turnover",
  "no-turnover":     "/reports/accounts/no-turnover",
};

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "trial-balance";
}

export default function AccountsReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));
  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  function handleSelect(id) {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  }

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های حساب‌ها"
        description="تراز آزمایشی، گردش، مانده و ریز گردش حساب‌ها"
      >
        <Button variant="outline" size="sm"><Printer className="h-4 w-4 ml-1" /> چاپ</Button>
        <Button variant="outline" size="sm"><FileDown className="h-4 w-4 ml-1" /> اکسل</Button>
      </PageHeader>

      <div className="flex gap-4">
        <aside className="w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">نوع گزارش</p>
              <nav className="space-y-0.5">
                {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active === id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-right">{label}</span>
                    {active === id && <ChevronLeft className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1">
          <Card>
            <CardContent className="pt-5">
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">کد حساب (از)</label>
                  <Input placeholder="مثلاً ۱۱۰۰۰" className="h-8 text-sm font-mono" dir="ltr" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">کد حساب (تا)</label>
                  <Input placeholder="مثلاً ۹۹۹۹۹" className="h-8 text-sm font-mono" dir="ltr" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                  <Input placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-sm" dir="ltr" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                  <Input placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-sm" dir="ltr" />
                </div>
                <div className="col-span-full flex justify-end">
                  <Button size="sm" className="w-32">
                    <Search className="h-4 w-4 ml-1" /> نمایش
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  {current && <current.icon className="h-8 w-8" />}
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">{current?.label}</p>
                  <p className="text-sm mt-1">فیلترها را تنظیم کرده و دکمه نمایش را بزنید</p>
                </div>
                <Badge variant="secondary" className="text-xs">در حال توسعه</Badge>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </PageShell>
  );
}
