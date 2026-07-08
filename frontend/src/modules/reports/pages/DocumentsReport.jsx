import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  List, AlignLeft, BookOpen, BookMarked, RefreshCw, Activity,
  Search, Printer, FileDown, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_ITEMS = [
  { id: "list",            label: "فهرست اسناد حسابداری",               icon: List },
  { id: "journal",         label: "دفتر روزنامه",                        icon: AlignLeft },
  { id: "general-ledger",  label: "دفتر کل",                             icon: BookOpen },
  { id: "moein-ledger",    label: "دفتر معین",                           icon: BookMarked },
  { id: "turnover",        label: "گردش اسناد",                          icon: RefreshCw },
  { id: "status",          label: "وضعیت اسناد",                         icon: Activity },
];

const ROUTE_MAP = {
  "list":           "/reports/documents/list",
  "journal":        "/reports/documents/journal",
  "general-ledger": "/reports/documents/general-ledger",
  "moein-ledger":   "/reports/documents/moein-ledger",
  "turnover":       "/reports/documents/turnover",
  "status":         "/reports/documents/status",
};

// برچسب‌های وضعیت سند
const STATUS_BADGES = [
  { label: "موقت",       className: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "تأییدشده",  className: "bg-blue-100  text-blue-700  border-blue-200"  },
  { label: "قطعی",      className: "bg-green-100 text-green-700 border-green-200" },
];

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "list";
}

export default function DocumentsReport() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));

  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  function handleSelect(id) {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  }

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های اسناد حسابداری"
        description="فهرست اسناد، دفاتر روزنامه، کل، معین، گردش و وضعیت اسناد"
      >
        <Button variant="outline" size="sm"><Printer className="h-4 w-4 ml-1" /> چاپ</Button>
        <Button variant="outline" size="sm"><FileDown className="h-4 w-4 ml-1" /> اکسل</Button>
      </PageHeader>

      <div className="flex gap-4">
        {/* سایدبار */}
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

        {/* محتوا */}
        <main className="flex-1 space-y-4">
          <Card>
            <CardContent className="pt-5">
              {/* فیلتر */}
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                  <Input placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-sm" dir="ltr" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                  <Input placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-sm" dir="ltr" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">شماره سند</label>
                  <Input placeholder="جستجو..." className="h-8 text-sm" />
                </div>
                <div className="flex items-end">
                  <Button size="sm" className="w-full">
                    <Search className="h-4 w-4 ml-1" /> نمایش
                  </Button>
                </div>
              </div>

              {/* نشانگرهای وضعیت — فقط برای تب status */}
              {active === "status" && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">فیلتر وضعیت:</span>
                  {STATUS_BADGES.map((b) => (
                    <Badge key={b.label} variant="outline" className={cn("cursor-pointer text-xs", b.className)}>
                      {b.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* placeholder */}
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
