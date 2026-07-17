import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, PackagePlus, PackageMinus, ArrowLeftRight, ClipboardList,
  AlertTriangle, Warehouse, ChevronLeft, ShoppingCart, BarChart3, RefreshCw, Link2,
  DollarSign, Activity, FileText, TrendingUp
} from "lucide-react";
import { useAssets } from "@/context/AssetContext";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  { label: "رسید جدید",        to: "/warehouse/receipts",    icon: PackagePlus,    color: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50" },
  { label: "حواله جدید",       to: "/warehouse/issues",      icon: PackageMinus,   color: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50"      },
  { label: "درخواست کالا",     to: "/warehouse/requests",    icon: ClipboardList,  color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/50"      },
  { label: "انتقال انبار",     to: "/warehouse/transfers",   icon: ArrowLeftRight, color: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50"    },
  { label: "انبارگردانی",      to: "/warehouse/inventory",   icon: Warehouse,      color: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/50"  },
  { label: "کالای جدید",       to: "/warehouse/items",       icon: ShoppingCart,   color: "bg-teal-50 text-teal-600 border-teal-100 hover:bg-teal-100/50"      },
];

export default function WarehouseDashboard() {
  const navigate = useNavigate();
  const {
    items, receipts, issues, transfers, assets, warehouses, refreshAllConfigs
  } = useAssets();

  // 1. Normalize itemsList to merge Warehouse items with consumable Assets
  const itemsList = useMemo(() => {
    const list = [...(items || [])];
    (assets || []).forEach(a => {
      if (a.assetType === "consumable") {
        const exists = list.some(i => i.code === a.assetCode);
        if (!exists) {
          list.push({
            code: a.assetCode,
            name: a.assetName,
            category: a.assetGroup || "سایر",
            unit: a.unit || "عدد",
            minStock: 0,
            currentStock: 0,
            price: a.buyPrice || a.price || 0,
            description: a.description || ""
          });
        }
      }
    });
    return list;
  }, [items, assets]);

  const storesList = useMemo(() => warehouses || [], [warehouses]);

  // 2. Normalize Receipts from both schemas
  const normalizedReceipts = useMemo(() => {
    const list = [];
    (receipts || []).forEach(rec => {
      if (Array.isArray(rec.items)) {
        rec.items.forEach(it => {
          list.push({
            doc: rec.receiptNo || rec.id || "—",
            itemCode: it.assetCode || "—",
            itemName: it.assetName || "—",
            qty: Number(it.quantity || 0),
            storeCode: rec.warehouseId || "—",
            price: it.unitPrice || 0,
            date: rec.receiptDate || rec.date || "—",
            supplier: rec.supplierName || "تامین‌کننده",
            type: "receipt"
          });
        });
      } else {
        const itm = itemsList.find(i => i.code === rec.itemCode);
        list.push({
          doc: rec.receiptCode || rec.id || "—",
          itemCode: rec.itemCode || "—",
          itemName: itm ? itm.name : rec.itemCode || "—",
          qty: Number(rec.quantity || 0),
          storeCode: rec.storeCode || "—",
          price: rec.price || 0,
          date: rec.date || "—",
          supplier: rec.supplier || "تامین‌کننده",
          type: "receipt"
        });
      }
    });
    return list;
  }, [receipts, itemsList]);

  // 3. Normalize Issues from both schemas
  const normalizedIssues = useMemo(() => {
    const list = [];
    (issues || []).forEach(iss => {
      if (Array.isArray(iss.items)) {
        iss.items.forEach(it => {
          list.push({
            doc: iss.issueNo || iss.id || "—",
            itemCode: it.assetCode || "—",
            itemName: it.assetName || "—",
            qty: Number(it.quantity || 0),
            storeCode: iss.warehouseId || "—",
            date: iss.issueDate || iss.date || "—",
            recipient: iss.recipient || "واحد مصرف",
            type: "issue"
          });
        });
      } else {
        const itm = itemsList.find(i => i.code === iss.itemCode);
        list.push({
          doc: iss.issueCode || iss.id || "—",
          itemCode: iss.itemCode || "—",
          itemName: itm ? itm.name : iss.itemCode || "—",
          qty: Number(iss.quantity || 0),
          storeCode: iss.storeCode || "—",
          date: iss.date || "—",
          recipient: iss.recipient || "واحد مصرف",
          type: "issue"
        });
      }
    });
    return list;
  }, [issues, itemsList]);

  // 4. Calculate dynamic stocks for all items across warehouses
  const calculatedStocks = useMemo(() => {
    const stocks = {};
    itemsList.forEach(item => {
      stocks[item.code] = {
        total: 0,
        warehouses: {}
      };
      storesList.forEach(store => {
        const wCode = store.code || store.id;
        stocks[item.code].warehouses[wCode] = 0;
      });
    });

    normalizedReceipts.forEach(rec => {
      const itCode = rec.itemCode;
      const wCode = rec.storeCode;
      const qty = rec.qty;
      if (stocks[itCode]) {
        stocks[itCode].total += qty;
        if (stocks[itCode].warehouses[wCode] !== undefined) {
          stocks[itCode].warehouses[wCode] += qty;
        }
      }
    });

    normalizedIssues.forEach(iss => {
      const itCode = iss.itemCode;
      const wCode = iss.storeCode;
      const qty = iss.qty;
      if (stocks[itCode]) {
        stocks[itCode].total -= qty;
        if (stocks[itCode].warehouses[wCode] !== undefined) {
          stocks[itCode].warehouses[wCode] -= qty;
        }
      }
    });

    (transfers || []).forEach(tr => {
      const itCode = tr.itemCode;
      const fromW = tr.fromStoreCode;
      const toW = tr.toStoreCode;
      const qty = Number(tr.quantity || 0);
      if (stocks[itCode]) {
        if (stocks[itCode].warehouses[fromW] !== undefined) {
          stocks[itCode].warehouses[fromW] -= qty;
        }
        if (tr.status === "confirmed") {
          if (stocks[itCode].warehouses[toW] !== undefined) {
            stocks[itCode].warehouses[toW] += qty;
          }
        } else {
          stocks[itCode].total -= qty;
        }
      }
    });

    itemsList.forEach(item => {
      const staticStock = Number(item.currentStock || 0);
      const computedStock = stocks[item.code]?.total || 0;
      if (computedStock === 0 && staticStock > 0) {
        stocks[item.code].total = staticStock;
        if (storesList.length > 0) {
          const firstW = storesList[0].code || storesList[0].id;
          stocks[item.code].warehouses[firstW] = staticStock;
        }
      }
    });

    return stocks;
  }, [itemsList, storesList, normalizedReceipts, normalizedIssues, transfers]);

  // 5. Aggregate calculations for dashboard metrics
  const summaryStats = useMemo(() => {
    let totalValue = 0;
    let criticalCount = 0;
    let totalQty = 0;

    itemsList.forEach(item => {
      const qty = calculatedStocks[item.code]?.total || 0;
      totalQty += qty;
      totalValue += qty * (item.price || 0);
      if (qty <= (item.minStock || 0)) {
        criticalCount++;
      }
    });

    return {
      totalItems: itemsList.length,
      totalWarehouses: storesList.length,
      totalQty,
      totalValue,
      criticalCount,
      receiptsCount: normalizedReceipts.length,
      issuesCount: normalizedIssues.length,
      transfersCount: (transfers || []).length
    };
  }, [itemsList, storesList, calculatedStocks, normalizedReceipts, normalizedIssues, transfers]);

  // 6. Category Distribution conic gradient data
  const categoryChartData = useMemo(() => {
    const map = {};
    itemsList.forEach(item => {
      const qty = calculatedStocks[item.code]?.total || 0;
      const cat = item.category || "سایر";
      if (qty > 0) {
        map[cat] = (map[cat] || 0) + qty;
      }
    });

    const entries = Object.entries(map).map(([name, val]) => ({ name, val }));
    const total = entries.reduce((sum, e) => sum + e.val, 0);
    
    if (total === 0) return [];
    
    entries.sort((a, b) => b.val - a.val);
    const top = entries.slice(0, 4);
    if (entries.length > 4) {
      const otherVal = entries.slice(4).reduce((sum, e) => sum + e.val, 0);
      top.push({ name: "سایر دسته‌ها", val: otherVal });
    }

    let accumulatedPercent = 0;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    return top.map((entry, idx) => {
      const percent = (entry.val / total) * 100;
      const start = accumulatedPercent;
      accumulatedPercent += percent;
      return {
        ...entry,
        percent,
        color: colors[idx % colors.length],
        start,
        end: accumulatedPercent
      };
    });
  }, [itemsList, calculatedStocks]);

  const conicGradientStyle = useMemo(() => {
    if (categoryChartData.length === 0) return { background: "#e2e8f0" };
    const segments = categoryChartData.map(d => `${d.color} ${d.start}% ${d.end}%`);
    return {
      background: `conic-gradient(from 0deg, ${segments.join(", ")})`
    };
  }, [categoryChartData]);

  // 7. Warehouse Capacity / Quantities Progress Bars
  const warehouseStockData = useMemo(() => {
    const list = storesList.map(store => {
      const storeCode = store.code || store.id;
      let totalQty = 0;
      let totalVal = 0;
      itemsList.forEach(item => {
        const qty = calculatedStocks[item.code]?.warehouses[storeCode] || 0;
        totalQty += qty;
        totalVal += qty * (item.price || 0);
      });
      return {
        code: storeCode,
        name: store.name,
        qty: totalQty,
        val: totalVal
      };
    });

    const maxQty = Math.max(...list.map(w => w.qty), 1);
    return list.map(w => ({
      ...w,
      percent: (w.qty / maxQty) * 100
    })).sort((a, b) => b.qty - a.qty);
  }, [storesList, itemsList, calculatedStocks]);

  // 8. Transactions Activity Bar Chart (Last 7 Days)
  const transactionsActivityData = useMemo(() => {
    const allTx = [...normalizedReceipts, ...normalizedIssues];
    allTx.sort((a, b) => b.date.localeCompare(a.date));
    
    const uniqueDates = Array.from(new Set(allTx.map(t => t.date).filter(d => d !== "—"))).slice(0, 6).reverse();
    
    if (uniqueDates.length === 0) {
      uniqueDates.push("شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه");
    }

    const dateMap = {};
    uniqueDates.forEach(date => {
      dateMap[date] = { date, receipts: 0, issues: 0 };
    });

    normalizedReceipts.forEach(r => {
      if (dateMap[r.date]) {
        dateMap[r.date].receipts += r.qty;
      }
    });

    normalizedIssues.forEach(i => {
      if (dateMap[i.date]) {
        dateMap[i.date].issues += i.qty;
      }
    });

    const list = Object.values(dateMap);
    const maxVal = Math.max(...list.map(d => Math.max(d.receipts, d.issues)), 10);

    return list.map(d => ({
      ...d,
      receiptPercent: (d.receipts / maxVal) * 100,
      issuePercent: (d.issues / maxVal) * 100
    }));
  }, [normalizedReceipts, normalizedIssues]);

  // 9. Top Critical stock items
  const criticalItems = useMemo(() => {
    return itemsList.map(item => {
      const qty = calculatedStocks[item.code]?.total || 0;
      return {
        ...item,
        qty
      };
    }).filter(item => item.qty <= (item.minStock || 0)).slice(0, 5);
  }, [itemsList, calculatedStocks]);

  // 10. Recent combined activities list
  const recentActivities = useMemo(() => {
    const list = [];
    normalizedReceipts.forEach(r => list.push({
      ...r,
      typeLabel: "رسید انبار",
      colorClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200",
      description: `ورود از ${r.supplier}`
    }));
    normalizedIssues.forEach(i => list.push({
      ...i,
      typeLabel: "حواله انبار",
      colorClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200",
      description: `خروج به ${i.recipient}`
    }));

    list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return list.slice(0, 5);
  }, [normalizedReceipts, normalizedIssues]);

  // Helper unit translator
  const translateUnit = (u) => {
    if (!u) return "عدد";
    const val = u.toString().toLowerCase().trim();
    if (val === "unit" || val === "pcs" || val === "piece" || val === "each" || val === "عدد") return "عدد";
    if (val === "box" || val === "جعبه") return "جعبه";
    if (val === "pack" || val === "package" || val === "بسته") return "بسته";
    if (val === "kg" || val === "kilogram" || val === "کیلوگرم") return "کیلوگرم";
    if (val === "m" || val === "meter" || val === "متر") return "متر";
    if (val === "set" || val === "دستگاه") return "دستگاه";
    if (val === "vol" || val === "volume" || val === "جلد") return "جلد";
    return u;
  };

  const statItems = [
    { label: "تنوع کالاهای انبار", value: summaryStats.totalItems, sub: "کد کالا", icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "مجموع موجودی فیزیکی", value: summaryStats.totalQty, sub: "واحد کالا", icon: Activity, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/30" },
    { label: "ارزش ریالی انبار", value: `${(summaryStats.totalValue / 10).toLocaleString("fa-IR")} تومان`, sub: `${summaryStats.totalValue.toLocaleString("fa-IR")} ریال`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "کالاهای بحرانی (کمبود)", value: summaryStats.criticalCount, sub: "نیاز به سفارش مجدد", icon: AlertTriangle, color: cn(summaryStats.criticalCount > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-500"), bg: cn(summaryStats.criticalCount > 0 ? "bg-rose-50 dark:bg-rose-950/30 animate-pulse" : "bg-slate-50 dark:bg-slate-900") },
    { label: "تعداد انبارها", value: summaryStats.totalWarehouses, sub: "مراکز نگهداری کالا", icon: Warehouse, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "تراکنش‌های ثبت شده", value: summaryStats.receiptsCount + summaryStats.issuesCount, sub: `${summaryStats.receiptsCount} رسید / ${summaryStats.issuesCount} حواله`, icon: FileText, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline">سیستم انبار</span>
        <span>/</span>
        <span>داشبورد تحلیلی انبار</span>
      </div>

      <PageHeader title="داشبورد تحلیلی انبار" description="گزارش‌های زنده و تحلیل انبارداری مبتنی بر داده‌های واقعی سیستم">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAllConfigs} className="gap-1">
            <RefreshCw className="h-4 w-4" /> بروزرسانی داده‌ها
          </Button>
          <Button size="sm" onClick={() => navigate("/warehouse/reports")} className="bg-primary hover:bg-primary/95 text-primary-foreground gap-1">
            <BarChart3 className="h-4 w-4" /> گزارش‌های انبار
          </Button>
        </div>
      </PageHeader>

      {/* ۱. کارت‌های آمار کلیدی */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" dir="rtl">
        {statItems.map((s, idx) => (
          <Card key={idx} className="overflow-hidden hover:shadow-md transition-all duration-300 border-slate-100">
            <CardContent className="p-4 flex items-center justify-between text-right">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-500 leading-tight">{s.label}</p>
                <p className={cn("text-lg font-extrabold tracking-tight", s.color)}>{s.value.toLocaleString("fa-IR")}</p>
                <p className="text-[9.5px] text-muted-foreground leading-none">{s.sub}</p>
              </div>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ۲. بخش نمودارها و تحلیل‌ها */}
      <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3" dir="rtl">
        
        {/* نمودار دایره‌ای دسته‌بندی کالاها */}
        <Card className="flex flex-col">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">توزیع گروهی کالاها</CardTitle>
            <CardDescription className="text-xs">سهم دسته‌بندی‌های مختلف از کل موجودی</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center pb-4">
            {categoryChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">داده‌ای برای نمایش وجود ندارد</div>
            ) : (
              <div className="w-full flex flex-col sm:flex-row items-center gap-6 justify-center">
                {/* دایره دونات conic-gradient */}
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-inner" style={conicGradientStyle}>
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {summaryStats.totalQty.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-[9px] text-muted-foreground">کل موجودی انبار</span>
                  </div>
                </div>

                {/* راهنمای رنگ‌ها */}
                <div className="flex flex-col gap-2 text-right">
                  {categoryChartData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{d.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground mr-auto">{d.percent.toFixed(0)}٪</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نمودار میله‌ای فعالیت‌ها در روزهای اخیر */}
        <Card className="flex flex-col">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">تراکنش‌های اخیر انبار</CardTitle>
            <CardDescription className="text-xs">حجم مقایسه‌ای ورود (سبز) و خروج (قرمز) در روزهای اخیر</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end pb-4">
            <div className="h-40 w-full flex items-end gap-3 px-2 border-b pb-2">
              {transactionsActivityData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* تگ راهنما هنگام هاور */}
                  <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[9px] rounded py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-none">
                    ورود: {day.receipts}
                    <br />
                    خروج: {day.issues}
                  </div>
                  
                  {/* میله‌ها */}
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div 
                      className="w-2.5 bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600" 
                      style={{ height: `${day.receiptPercent}%` }}
                    />
                    <div 
                      className="w-2.5 bg-rose-500 rounded-t transition-all duration-500 hover:bg-rose-600" 
                      style={{ height: `${day.issuePercent}%` }}
                    />
                  </div>

                  <span className="text-[9.5px] font-medium text-slate-500 mt-2 rotate-12 origin-top">{day.date}</span>
                </div>
              ))}
            </div>
            {/* راهنمای نمودار */}
            <div className="mt-4 flex justify-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-emerald-500 rounded" />
                <span className="text-muted-foreground">ورود کالا (رسید)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-rose-500 rounded" />
                <span className="text-muted-foreground">خروج کالا (حواله)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ظرفیت و موجودی انبارها */}
        <Card className="flex flex-col">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">وضعیت موجودی انبارها</CardTitle>
            <CardDescription className="text-xs">تعداد موجود در هر انبار به تفکیک</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center space-y-4">
            {warehouseStockData.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground">انباری ثبت نشده است</div>
            ) : (
              warehouseStockData.slice(0, 4).map((w, idx) => (
                <div key={idx} className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Warehouse className="h-3.5 w-3.5 text-purple-600" />
                      {w.name}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {w.qty.toLocaleString("fa-IR")} <span className="text-[10px] text-muted-foreground font-normal">عدد</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-l from-purple-500 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${w.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground leading-none">
                    <span>کد انبار: {w.code}</span>
                    <span>ارزش: {(w.val / 10).toLocaleString("fa-IR")} تومان</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* ۳. عملیات سریع و کالاهای زیر نقطه سفارش */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3" dir="rtl">
        
        {/* دسترسی‌های سریع و عملیات */}
        <Card className="lg:col-span-1 border-slate-100">
          <CardHeader className="text-right pb-2">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">دسترسی سریع عملیات</CardTitle>
            <CardDescription className="text-xs">ایجاد اسناد و تعاریف انبارداری</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-3">
              {QUICK_LINKS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-2xl border bg-muted/20 p-3 text-center transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5",
                    item.color
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-950 shadow-sm border border-slate-100 transition-transform duration-300 group-hover:scale-110">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* کالاهای بحرانی (زیر نقطه سفارش) */}
        <Card className="lg:col-span-2 border-slate-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between" dir="rtl">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 text-right">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-bounce" />
                  هشدار کالاهای زیر نقطه سفارش (بحرانی)
                </CardTitle>
                <CardDescription className="text-xs text-right">کالاهایی که موجودی فعلی آنها کمتر از حداقل تعریف شده است</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600 hover:text-blue-700" onClick={() => navigate("/warehouse/reports")}>
                مشاهده گزارش کسری <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40 text-slate-500">
                    <th className="px-4 py-2.5 font-bold">کد کالا</th>
                    <th className="px-4 py-2.5 font-bold">نام کالا</th>
                    <th className="px-4 py-2.5 font-bold">دسته‌بندی</th>
                    <th className="px-4 py-2.5 font-bold">موجودی فعلی</th>
                    <th className="px-4 py-2.5 font-bold">نقطه بحران (حداقل)</th>
                    <th className="px-4 py-2.5 w-24">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground font-semibold">خوشبختانه هیچ کالایی در وضعیت بحرانی قرار ندارد.</td>
                    </tr>
                  ) : criticalItems.map((item, idx) => {
                    const currentPercent = Math.min(100, ((item.qty) / (item.minStock || 5)) * 100);
                    return (
                      <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-300">{item.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500">{item.category || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-rose-600">{item.qty.toLocaleString("fa-IR")}</span>
                            <span className="text-[10px] text-muted-foreground">{translateUnit(item.unit)}</span>
                          </div>
                          {/* نوار گرافیکی پرشدگی نسبت به حداقل */}
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-rose-600 rounded-full" style={{ width: `${currentPercent}%` }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">{item.minStock?.toLocaleString("fa-IR")}</td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold text-blue-600 border-blue-200 bg-blue-50/30 hover:bg-blue-50"
                            onClick={() => navigate("/warehouse/receipts")}>
                            ثبت خرید / ورود
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ۴. فعالیت‌های اخیر و تجهیزات سرمایه‌ای مرتبط */}
      <div className="grid gap-6 lg:grid-cols-2" dir="rtl">
        
        {/* گردش عملیات انبارداری اخیر */}
        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between" dir="rtl">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">گردش عملیات انبارداری اخیر</CardTitle>
                <CardDescription className="text-xs">آخرین فاکتورها، رسیدها و حواله‌های صادر شده سیستم</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600" onClick={() => navigate("/warehouse/reports")}>
                دفتر روزنامه انبار <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40 text-slate-500">
                    <th className="px-4 py-2.5 font-bold">نوع سند</th>
                    <th className="px-4 py-2.5 font-bold">شماره سند</th>
                    <th className="px-4 py-2.5 font-bold">شرح عملیات / طرف حساب</th>
                    <th className="px-4 py-2.5 font-bold">مقدار</th>
                    <th className="px-4 py-2.5 font-bold">تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground font-semibold">هیچ تراکنش مالی/انبارداری یافت نشد.</td>
                    </tr>
                  ) : recentActivities.map((op, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <Badge className={cn("text-[9px] font-bold py-0.5 border shadow-none", op.colorClass)}>
                          {op.typeLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{op.doc}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 dark:text-white">{op.itemName}</p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 font-medium">{op.description}</p>
                      </td>
                      <td className={cn("px-4 py-3 font-mono font-bold text-sm", op.type === "receipt" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {op.type === "receipt" ? `+${op.qty}` : `-${op.qty}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{op.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* دارایی‌های ثابت مرتبط با موجودی انبار */}
        <Card className="border-slate-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between" dir="rtl">
              <div>
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                  <Link2 className="h-4.5 w-4.5 text-purple-600" />
                  اتصال به سیستم اموال و تجهیزات ثابت
                </CardTitle>
                <CardDescription className="text-xs">اموال سرمایه‌ای و غیرمصرفی تعریف شده در بخش دارایی</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-blue-600" onClick={() => navigate("/assets/reports/all")}>
                گزارش دارایی‌ها <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40 text-slate-500">
                    <th className="px-4 py-2.5 font-bold">کد دارایی</th>
                    <th className="px-4 py-2.5 font-bold">نام دارایی</th>
                    <th className="px-4 py-2.5 font-bold">انبار نگهدارنده</th>
                    <th className="px-4 py-2.5 font-bold">تعداد</th>
                    <th className="px-4 py-2.5 font-bold">فی ارزش (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  {(assets || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground font-semibold">دارایی مرتبطی یافت نشد.</td>
                    </tr>
                  ) : (assets || []).slice(0, 5).map((asset, idx) => {
                    const str = storesList.find(s => s.code === asset.warehouseId || s.id === asset.warehouseId);
                    return (
                      <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-purple-700 dark:text-purple-400">{asset.assetCode}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{asset.assetName}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{str ? str.name : asset.warehouseId || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{asset.quantity || 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          {(asset.buyPrice || asset.price || 0).toLocaleString("fa-IR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
