import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, PackagePlus, PackageMinus, ArrowLeftRight, ClipboardList,
  AlertTriangle, TrendingDown, Warehouse, Users, ChevronLeft,
  ShoppingCart, BarChart3, RefreshCw, Link2,
} from "lucide-react";

// ── اتصال به سیستم اموال: کالاهای غیرمصرفی که انبار به اموال گزارش می‌دهد ──
const ASSET_LINKED_ITEMS = [
  { code: "IT-001", name: "لپ‌تاپ Dell", qty: 5,  store: "انبار IT",      assetLinked: true },
  { code: "IT-002", name: "مانیتور LG",  qty: 12, store: "انبار IT",      assetLinked: true },
  { code: "OFF-01", name: "کاغذ A4",     qty: 200, store: "انبار مرکزی",  assetLinked: false },
  { code: "VH-001", name: "خودرو پراید", qty: 2,  store: "انبار خودرو",   assetLinked: true },
];

const CRITICAL_ITEMS = [
  { code: "OFF-02", name: "جوهر پرینتر", current: 3,  min: 10,  store: "انبار مرکزی" },
  { code: "IT-005", name: "کابل شبکه",   current: 8,  min: 20,  store: "انبار IT"    },
  { code: "CLN-01", name: "مواد نظافتی", current: 5,  min: 15,  store: "انبار مرکزی" },
];

const TODAY_OPS = [
  { type: "receipt", doc: "ر-۱۴۰۳-۰۵۱", item: "کاغذ A4",       qty: 50,  user: "یوسف",  time: "۰۹:۱۵" },
  { type: "issue",   doc: "ح-۱۴۰۳-۱۲۸", item: "جوهر پرینتر",  qty: 2,   user: "سارا",  time: "۱۰:۳۰" },
  { type: "transfer",doc: "ن-۱۴۰۳-۰۱۴", item: "لپ‌تاپ Dell",   qty: 1,   user: "احمد",  time: "۱۱:۰۰" },
];

const QUICK_LINKS = [
  { label: "رسید جدید",        to: "/warehouse/receipts/new",    icon: PackagePlus,    color: "bg-emerald-50 text-emerald-600" },
  { label: "حواله جدید",       to: "/warehouse/issues/new",      icon: PackageMinus,   color: "bg-rose-50 text-rose-600"      },
  { label: "درخواست کالا",     to: "/warehouse/requests/new",    icon: ClipboardList,  color: "bg-blue-50 text-blue-600"      },
  { label: "انتقال انبار",     to: "/warehouse/transfers/new",   icon: ArrowLeftRight, color: "bg-amber-50 text-amber-600"    },
  { label: "انبارگردانی",      to: "/warehouse/inventory/new",   icon: Warehouse,      color: "bg-purple-50 text-purple-600"  },
  { label: "کالای جدید",       to: "/warehouse/items/new",       icon: ShoppingCart,   color: "bg-teal-50 text-teal-600"      },
];

export default function WarehouseDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "کل کالاها",        value: "۱۲۴",  icon: Package,       color: "text-primary",     bg: "bg-primary/10"     },
    { label: "رسید امروز",       value: "۳",    icon: PackagePlus,   color: "text-emerald-600", bg: "bg-emerald-50"     },
    { label: "حواله امروز",      value: "۵",    icon: PackageMinus,  color: "text-rose-600",    bg: "bg-rose-50"        },
    { label: "کالای بحرانی",     value: `${CRITICAL_ITEMS.length}`,  icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "انتقال امروز",     value: "۲",    icon: ArrowLeftRight, color: "text-blue-600",   bg: "bg-blue-50"        },
    { label: "اموال مرتبط",      value: `${ASSET_LINKED_ITEMS.filter(i=>i.assetLinked).length}`, icon: Link2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <PageShell>
      <PageHeader title="داشبورد انبار" description="نمای کلی سیستم مدیریت انبار">
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" /> بروزرسانی
        </Button>
        <Button size="sm" onClick={() => navigate("/warehouse/reports/stock")}>
          <BarChart3 className="h-4 w-4" /> گزارش موجودی
        </Button>
      </PageHeader>

      {/* کارت‌های آمار */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <Card key={i} className="p-4 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* دسترسی سریع */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">عملیات سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((item) => (
                <button key={item.to} onClick={() => navigate(item.to)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 p-3 text-center transition-all duration-200 hover:bg-accent hover:-translate-y-0.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color} transition-transform duration-200 group-hover:scale-110`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* کالاهای بحرانی */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                کالاهای زیر نقطه سفارش
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/warehouse/reports/shortage")}>
                مشاهده همه <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">کالا</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">انبار</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">موجودی</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">حداقل</th>
                  <th className="px-4 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {CRITICAL_ITEMS.map((item, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-xs">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{item.code}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.store}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-bold text-destructive">{item.current}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.min}</td>
                    <td className="px-4 py-2.5">
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                        onClick={() => navigate("/warehouse/receipts/new")}>
                        سفارش
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* عملیات امروز */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">عملیات امروز</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/warehouse/reports/audit")}>
                تاریخچه کامل <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">نوع</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">سند</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">کالا</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">تعداد</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">کاربر</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">ساعت</th>
                </tr>
              </thead>
              <tbody>
                {TODAY_OPS.map((op, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <Badge variant={op.type === "receipt" ? "outline" : op.type === "issue" ? "destructive" : "secondary"} className="text-[10px]">
                        {op.type === "receipt" ? "رسید" : op.type === "issue" ? "حواله" : "انتقال"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{op.doc}</td>
                    <td className="px-4 py-2.5 text-xs">{op.item}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{op.qty}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{op.user}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{op.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* اتصال به سیستم اموال */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Link2 className="h-4 w-4 text-purple-500" />
                اموال مرتبط با انبار
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/assets/reports/all")}>
                سیستم اموال <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
            <CardDescription className="text-xs">کالاهای غیرمصرفی که در سیستم اموال ثبت می‌شوند</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">کد</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">کالا</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">موجودی</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">انبار</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">اموال</th>
                </tr>
              </thead>
              <tbody>
                {ASSET_LINKED_ITEMS.map((item, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs">{item.code}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">{item.name}</td>
                    <td className="px-4 py-2.5 text-xs font-bold">{item.qty}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{item.store}</td>
                    <td className="px-4 py-2.5">
                      {item.assetLinked ? (
                        <button onClick={() => navigate("/assets/reports/all")}
                          className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline">
                          <Link2 className="h-3 w-3" /> مرتبط
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">مصرفی</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
