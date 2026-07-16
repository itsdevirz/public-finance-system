import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, PackagePlus, PackageMinus, ArrowLeftRight, ClipboardList,
  AlertTriangle, Warehouse, ChevronLeft, ShoppingCart, BarChart3, RefreshCw, Link2,
} from "lucide-react";
import { useAssets } from "@/context/AssetContext";
import { useMemo } from "react";

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
  const {
    items, receipts, issues, transfers, assets, refreshAllConfigs
  } = useAssets();

  const stats = useMemo(() => {
    const totalItems = items?.length || 0;
    const todayRecs = receipts?.length || 0;
    const todayIss = issues?.length || 0;
    const criticals = (items || []).filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length;
    const todayTrans = transfers?.length || 0;
    const linked = (assets || []).filter(a => a.status === "active").length;

    return [
      { label: "کل کالاها",        value: String(totalItems), icon: Package,        color: "text-primary",     bg: "bg-primary/10"     },
      { label: "رسید انبار",       value: String(todayRecs),  icon: PackagePlus,    color: "text-emerald-600", bg: "bg-emerald-50"     },
      { label: "حواله انبار",      value: String(todayIss),   icon: PackageMinus,   color: "text-rose-600",    bg: "bg-rose-50"        },
      { label: "کالای بحرانی",     value: String(criticals),  icon: AlertTriangle,  color: "text-amber-600",   bg: "bg-amber-50"       },
      { label: "انتقالات انبار",   value: String(todayTrans), icon: ArrowLeftRight, color: "text-blue-600",    bg: "bg-blue-50"        },
      { label: "اموال فعال مرتبط", value: String(linked),     icon: Link2,          color: "text-purple-600",  bg: "bg-purple-50"      },
    ];
  }, [items, receipts, issues, transfers, assets]);

  // critical items below order point
  const criticalItems = useMemo(() => {
    return (items || []).filter(i => (i.currentStock || 0) <= (i.minStock || 0)).slice(0, 5);
  }, [items]);

  // combined list of latest transactions for display
  const combinedOperations = useMemo(() => {
    const ops = [];
    (receipts || []).forEach(r => ops.push({ type: "receipt", doc: r.receiptCode, item: r.itemCode, qty: r.quantity, user: r.supplier || "فروشنده", date: r.date }));
    (issues || []).forEach(i => ops.push({ type: "issue", doc: i.issueCode, item: i.itemCode, qty: i.quantity, user: i.recipient || "واحد گیرنده", date: i.date }));
    return ops.slice(-5).reverse();
  }, [receipts, issues]);

  // assets linked items logic: show high value items or non-consumable items
  const linkedItemsList = useMemo(() => {
    return (items || [])
      .filter(i => i.price >= 500000 || i.category?.includes("اموال") || i.category?.includes("تجهیزات"))
      .slice(0, 5);
  }, [items]);

  return (
    <PageShell>
      <PageHeader title="داشبورد انبار" description="نمای کلی سیستم مدیریت انبار">
        <Button variant="outline" size="sm" onClick={refreshAllConfigs}>
          <RefreshCw className="h-4 w-4" /> بروزرسانی
        </Button>
        <Button size="sm" onClick={() => navigate("/warehouse/reports")}>
          <BarChart3 className="h-4 w-4" /> گزارش موجودی
        </Button>
      </PageHeader>

      {/* کارت‌های آمار */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <Card key={i} className="p-4 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div className="text-right">
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
          <CardHeader className="pb-2 text-right">
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
            <div className="flex items-center justify-between" dir="rtl">
              <CardTitle className="flex items-center gap-2 text-sm text-right">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                کالاهای زیر نقطه سفارش
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/warehouse/reports")}>
                مشاهده همه <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-muted/40 text-right">
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">کالا</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">موجودی فعلی</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">حداقل بحرانی</th>
                  <th className="px-4 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {criticalItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground">کالای زیر نقطه سفارش یافت نشد</td>
                  </tr>
                ) : criticalItems.map((item, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-right">
                      <p className="font-semibold text-xs">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{item.code}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="font-bold text-rose-600">{item.currentStock}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{item.minStock}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                        onClick={() => navigate("/warehouse/receipts/new")}>
                        سفارش ورود
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
            <div className="flex items-center justify-between" dir="rtl">
              <CardTitle className="text-sm">گردش عملیات انبار</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/warehouse/reports")}>
                گزارش گردش کالا <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-muted/40 text-right">
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">نوع</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">سند</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">کالا</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">تعداد</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {combinedOperations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">گردش عملیاتی یافت نشد</td>
                  </tr>
                ) : combinedOperations.map((op, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant={op.type === "receipt" ? "outline" : "destructive"} className="text-[10px]">
                        {op.type === "receipt" ? "رسید" : "حواله"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-right">{op.doc}</td>
                    <td className="px-4 py-2.5 text-xs text-right">{op.item}</td>
                    <td className={cn("px-4 py-2.5 text-xs font-bold text-right", op.type === "receipt" ? "text-emerald-700" : "text-rose-600")}>
                      {op.type === "receipt" ? `+${op.qty}` : `-${op.qty}`}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground text-right">{op.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* اتصال به سیستم اموال */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between" dir="rtl">
              <CardTitle className="flex items-center gap-2 text-sm text-right">
                <Link2 className="h-4 w-4 text-purple-500" />
                تجهیزات و اموال سرمایه‌ای
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/assets/reports/all")}>
                سیستم اموال <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
            <CardDescription className="text-xs text-right" dir="rtl">کالاهای سرمایه‌ای با ارزش بیش از ۵۰۰,۰۰۰ ریال انبار</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-muted/40 text-right">
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">کد کالا</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">نام کالا</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">موجودی</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">ارزش ریالی</th>
                  <th className="px-4 py-2 text-xs font-medium text-muted-foreground">اموال</th>
                </tr>
              </thead>
              <tbody>
                {linkedItemsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">کالای سرمایه‌ای یافت نشد</td>
                  </tr>
                ) : linkedItemsList.map((item, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-right">{item.code}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-right">{item.name}</td>
                    <td className="px-4 py-2.5 text-xs font-bold text-right">{item.currentStock}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-right">{item.price?.toLocaleString("fa-IR")}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => navigate("/assets/reports/all")}
                        className="flex items-center gap-1 text-[10px] text-purple-600 hover:underline">
                        <Link2 className="h-3 w-3" /> دارایی ثابت
                      </button>
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
