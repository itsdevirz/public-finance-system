import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Calendar, CreditCard, Shield, Layers, LogOut, Printer, RefreshCw, AlertCircle, FileSpreadsheet, Filter, Search, ArrowLeft, BarChart2, PieChart, TrendingUp, DollarSign
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { getDefaultDateRange } from "@/lib/fiscalUtils";

export default function ContractDashboardReport() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const defaultRange = getDefaultDateRange();
  const [timeRange, setTimeRange] = useState("سال جاری");
  const [fromDate, setFromDate] = useState(defaultRange.dateFrom);
  const [toDate, setToDate] = useState(defaultRange.dateTo);
  const [reportType, setReportType] = useState("همه گزارش‌ها");
  const [showFilters, setShowFilters] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const contractRes = await api.get("/api/contracts");
      const paymentRes = await api.get("/api/contract-payments");
      setContracts(contractRes.data?.data || []);
      setPayments(paymentRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData();
  };

  const handleClear = () => {
    setTimeRange("سال جاری");
    const r = getDefaultDateRange();
    setFromDate(r.dateFrom);
    setToDate(r.dateTo);
    setReportType("همه گزارش‌ها");
  };

  // KPIs Calculations
  const stats = useMemo(() => {
    const totalCount = contracts.length;
    
    const totalAmount = contracts.reduce((sum, c) => {
      const initial = Number(String(c.amount || "0").replace(/,/g, "")) || 0;
      const inc = Number(String(c.increase_amount || "0").replace(/,/g, "")) || 0;
      const dec = Number(String(c.decrease_amount || "0").replace(/,/g, "")) || 0;
      return sum + (initial + inc - dec);
    }, 0);

    const totalPaid = payments.reduce((sum, p) => {
      const cleanAmt = Number(String(p.gross_amount || "0").replace(/,/g, "")) || 0;
      return sum + cleanAmt;
    }, 0);
    const remainingPayable = Math.max(0, totalAmount - totalPaid);
    
    const avgProgress = totalCount > 0
      ? (contracts.reduce((sum, c) => {
          const prog = Number(c.progress_percent || c.financial_progress_percent || 0) || 0;
          return sum + prog;
        }, 0) / totalCount)
      : 0;

    return {
      totalCount,
      totalAmount,
      totalPaid,
      remainingPayable,
      avgProgress: Number(avgProgress.toFixed(2)) || 0,
    };
  }, [contracts, payments]);

  // Contracts count by Type (Bar chart data)
  const typesData = useMemo(() => {
    const counts = {};
    contracts.forEach((c) => {
      const t = c.contract_type || "سایر";
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [contracts]);

  // Payment trend by months (Line chart data)
  const monthlyData = useMemo(() => {
    const months = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    
    // Initialize monthly values in Billion Rials (milliard rial)
    const values = Array(12).fill(0);
    payments.forEach((p) => {
      const dateStr = String(p.payment_date || "");
      if (dateStr.includes("/")) {
        const monthPart = dateStr.split("/")[1];
        const monthNum = parseInt(monthPart, 10);
        if (monthNum >= 1 && monthNum <= 12) {
          const cleanAmt = Number(String(p.gross_amount || "0").replace(/,/g, "")) || 0;
          values[monthNum - 1] += cleanAmt;
        }
      }
    });
    
    return months.map((name, idx) => ({
      name,
      value: Number((values[idx] / 1e9).toFixed(2)) || 0, // in Billions (milliard)
    }));
  }, [payments]);

  // Contract value by status (Donut Chart data)
  const statusData = useMemo(() => {
    const statuses = {
      "پیش‌نویس": 0,
      "ثبت شده": 0,
      "تایید شده": 0,
      "در حال اجرا": 0,
      "خاتمه یافته": 0,
      "تسویه شده": 0
    };
    
    contracts.forEach((c) => {
      const st = c.status || "پیش‌نویس";
      const initial = Number(String(c.amount || "0").replace(/,/g, "")) || 0;
      const inc = Number(String(c.increase_amount || "0").replace(/,/g, "")) || 0;
      const dec = Number(String(c.decrease_amount || "0").replace(/,/g, "")) || 0;
      const amt = initial + inc - dec;
      if (statuses[st] !== undefined) {
        statuses[st] += amt;
      } else {
        statuses["پیش‌نویس"] += amt;
      }
    });

    const total = Object.values(statuses).reduce((sum, v) => sum + v, 0);
    
    const colors = {
      "پیش‌نویس": "#6b7280", // gray
      "ثبت شده": "#3b82f6", // blue
      "تایید شده": "#8b5cf6", // purple
      "در حال اجرا": "#10b981", // green
      "خاتمه یافته": "#ef4444", // red
      "تسویه شده": "#f59e0b" // amber
    };

    return Object.entries(statuses).map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
      color: colors[name] || "#3b82f6",
    }));
  }, [contracts]);

  // Table 1: Contracts in Progress
  const inProgressContracts = useMemo(() => {
    return contracts
      .filter((c) => c.status === "در حال اجرا")
      .slice(0, 5)
      .map((c) => {
        const initial = Number(String(c.amount || "0").replace(/,/g, "")) || 0;
        const inc = Number(String(c.increase_amount || "0").replace(/,/g, "")) || 0;
        const dec = Number(String(c.decrease_amount || "0").replace(/,/g, "")) || 0;
        const total = initial + inc - dec;

        const paidForContract = payments
          .filter((p) => p.contract_id === c._id || p.contract_number === c.contract_number)
          .reduce((sum, p) => sum + (Number(String(p.gross_amount || "0").replace(/,/g, "")) || 0), 0);

        const remaining = Math.max(0, total - paidForContract);

        return {
          _id: c._id,
          title: c.title,
          progress: Number(c.progress_percent || c.financial_progress_percent || 0) || 0,
          remaining,
          end_date: c.end_date || "-",
        };
      });
  }, [contracts, payments]);

  // Table 2: Largest Contracts
  const largestContracts = useMemo(() => {
    return [...contracts]
      .sort((a, b) => {
        const amtA = Number(String(a.amount || "0").replace(/,/g, "")) || 0;
        const amtB = Number(String(b.amount || "0").replace(/,/g, "")) || 0;
        return amtB - amtA;
      })
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        contractor: c.contractor_name,
        amount: Number(String(c.amount || "0").replace(/,/g, "")) || 0,
        progress: Number(c.progress_percent || c.financial_progress_percent || 0) || 0,
      }));
  }, [contracts]);

  // Print Dashboard handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <PageShell>
      {/* هدر ابزارهای گزارش */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5 print:hidden animate-in fade-in duration-300" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">داشبورد مدیریت گزارشات قراردادها</h1>
            <p className="text-xs text-muted-foreground">خلاصه وضعیت فیزیکی و مالی، روند پرداخت‌ها و نمودارهای تحلیل پیمان‌های سازمان</p>
          </div>
        </div>

        {/* دکمه‌های بالا */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/reports")}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <LogOut className="h-4 w-4 rotate-180" />
            خروج
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            چاپ
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
            className="gap-1.5 h-9 text-xs border-border/80 hover:bg-muted"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            اکسل
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "gap-1.5 h-9 text-xs border-blue-500/20 text-blue-500",
              showFilters ? "bg-blue-500/10" : "hover:bg-blue-500/5"
            )}
          >
            <Filter className="h-4 w-4" />
            فیلتر
          </Button>
        </div>
      </div>

      {/* فیلتر پانل */}
      {showFilters && (
        <Card className="border-border/80 shadow-sm mb-6 print:hidden animate-in slide-in-from-top-2 duration-200" dir="rtl">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-4 items-end text-xs">
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-right">بازه زمانی</Label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-right focus:ring-1 focus:ring-ring"
              >
                <option value="سال جاری">سال جاری</option>
                <option value="سال گذشته">سال گذشته</option>
                <option value="کل دوره">کل دوره</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-right">از تاریخ</Label>
              <PersianDatePicker value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-right">تا تاریخ</Label>
              <PersianDatePicker value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-right">نوع گزارش</Label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-right focus:ring-1 focus:ring-ring"
              >
                <option value="همه گزارش‌ها">همه گزارش‌ها</option>
                <option value="پیمانکاری">پیمانکاری</option>
                <option value="مشاوره">مشاوره</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleSearch} className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1 gap-1">
                <Search className="h-3.5 w-3.5" />
                جستجو
              </Button>
              <Button onClick={handleClear} variant="outline" className="h-9 text-xs border-border/80 hover:bg-muted">
                پاک کردن
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* بخش اول: کارت‌های KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6" dir="rtl">
        
        <Card className="border-border/80 shadow-sm p-4 flex items-center justify-between text-right">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">درصد پیشرفت متوسط</span>
            <span className="font-mono text-base font-bold text-cyan-600">{stats.avgProgress} %</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex items-center justify-between text-right">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">باقیمانده پرداخت</span>
            <span className="font-mono text-base font-bold text-amber-500">{stats.remainingPayable.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ریال</span></span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <RefreshCw className="h-4 w-4" />
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex items-center justify-between text-right">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">مبلغ پرداخت شده</span>
            <span className="font-mono text-base font-bold text-emerald-600">{stats.totalPaid.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ریال</span></span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CreditCard className="h-4 w-4" />
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex items-center justify-between text-right">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">مبلغ کل قراردادها</span>
            <span className="font-mono text-base font-bold text-blue-600">{stats.totalAmount.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">ریال</span></span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <DollarSign className="h-4 w-4" />
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex items-center justify-between text-right">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">تعداد قراردادها</span>
            <span className="font-mono text-base font-bold text-foreground">{stats.totalCount} <span className="text-[9px] font-normal text-muted-foreground">قرارداد</span></span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
        </Card>

      </div>

      {/* بخش دوم: نمودارها */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" dir="rtl">
        
        {/* ۱. نمودار میله‌ای تعداد قراردادها */}
        <Card className="border-border/80 shadow-sm text-right">
          <CardHeader className="p-3 bg-muted/10 font-bold text-xs text-right">تعداد قراردادها بر اساس نوع</CardHeader>
          <CardContent className="p-4 flex flex-col justify-center items-center h-64">
            <div className="w-full h-full flex items-end justify-around gap-2 px-2 pb-6 border-b border-l relative">
              {typesData.map((bar, idx) => {
                const maxVal = Math.max(...typesData.map(d => d.value), 1);
                const pct = (bar.value / maxVal) * 80; // max height 80%
                return (
                  <div key={idx} className="flex flex-col items-center w-full group relative">
                    {/* Tooltip value */}
                    <span className="absolute -top-6 text-[10px] font-bold font-mono text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bar.value}
                    </span>
                    {/* Bar */}
                    <div
                      className="w-10 rounded-t bg-blue-500 hover:bg-blue-600 transition-all duration-300"
                      style={{ height: `${pct || 5}%` }}
                    />
                    {/* Label */}
                    <span className="text-[10px] text-muted-foreground mt-2 truncate w-14 text-center">{bar.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ۲. نمودار خطی روند مبالغ پرداختی */}
        <Card className="border-border/80 shadow-sm text-right">
          <CardHeader className="p-3 bg-muted/10 font-bold text-xs text-right">روند مبلغ پرداختی در ماه‌های سال جاری (میلیارد ریال)</CardHeader>
          <CardContent className="p-4 flex flex-col justify-center items-center h-64">
            <div className="w-full h-full border-b border-l relative flex flex-col justify-end">
              {/* SVG Line chart */}
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />

                {/* Draw points & generate coordinates */}
                {(() => {
                  const maxVal = Math.max(...monthlyData.map(d => d.value), 1);
                  const points = monthlyData.map((d, i) => {
                    const x = 20 + i * 42;
                    const y = 180 - (d.value / maxVal) * 140;
                    return { x, y, val: d.value };
                  });

                  const pathD = points.reduce((acc, p, i) => {
                    return acc + `${i === 0 ? "M" : "L"} ${p.x} ${p.y} `;
                  }, "");

                  const areaD = pathD + `L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                  return (
                    <>
                      {/* Area fill */}
                      <path d={areaD} fill="url(#chartGrad)" />
                      {/* Line */}
                      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Circles */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group cursor-pointer">
                          <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                          <circle cx={p.x} cy={p.y} r="8" fill="#3b82f6" opacity="0" className="hover:opacity-20 transition-opacity" />
                          {/* Tooltip */}
                          <title>{monthlyData[idx].name}: {p.val} میلیارد</title>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
              {/* Monthly text list */}
              <div className="flex justify-between w-full text-[9px] text-muted-foreground mt-2 px-1">
                {monthlyData.map((d, idx) => (
                  <span key={idx} className="w-8 text-center rotate-45 sm:rotate-0 mt-1">{d.name}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ۳. نمودار دونات وضعیت‌ها */}
        <Card className="border-border/80 shadow-sm text-right">
          <CardHeader className="p-3 bg-muted/10 font-bold text-xs text-right">مبلغ قراردادها بر اساس وضعیت</CardHeader>
          <CardContent className="p-4 flex flex-col sm:flex-row justify-center items-center h-64 gap-6 text-xs">
            {/* SVG Donut */}
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                {(() => {
                  let accumulatedPercent = 0;
                  return statusData.map((slice, idx) => {
                    const percent = slice.percent;
                    if (percent <= 0) return null;
                    const strokeDash = `${percent} ${100 - percent}`;
                    const strokeOffset = 100 - accumulatedPercent;
                    accumulatedPercent += percent;
                    return (
                      <circle
                        key={idx}
                        cx="18"
                        cy="18"
                        r="15.91"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="3.2"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground">مجموع کل</span>
                <span className="text-xs font-bold text-foreground">۱۰۰٪</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="w-full space-y-1.5">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] border-b pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-mono font-semibold">%{item.percent} ({Math.round(item.value / 1e9)}M)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* بخش سوم: جزئیات مالی و جداول آماری */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" dir="rtl">
        
        {/* ۱. خلاصه عملکرد مالی */}
        <Card className="border-border/80 shadow-sm text-right bg-card">
          <CardHeader className="p-3 bg-muted/10 font-bold text-xs">خلاصه عملکرد مالی</CardHeader>
          <CardContent className="p-4 text-xs space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">مبلغ کل قراردادها:</span>
              <span className="font-mono font-bold text-blue-600">{stats.totalAmount.toLocaleString()} ریال</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">مبلغ پرداخت شده:</span>
              <span className="font-mono font-bold text-emerald-600">{stats.totalPaid.toLocaleString()} ریال</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">باقیمانده پرداخت:</span>
              <span className="font-mono font-bold text-amber-500">{stats.remainingPayable.toLocaleString()} ریال</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">جمع صورت وضعیت‌ها:</span>
              <span className="font-mono font-bold text-indigo-600">{stats.totalPaid.toLocaleString()} ریال</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">جمع پرداختی‌ها:</span>
              <span className="font-mono font-bold text-emerald-600">{stats.totalPaid.toLocaleString()} ریال</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">درصد پیشرفت متوسط:</span>
              <span className="font-mono font-bold text-cyan-600">{stats.avgProgress} %</span>
            </div>
          </CardContent>
        </Card>

        {/* ۲. قراردادهای در حال اجرا */}
        <Card className="border-border/80 shadow-sm text-right bg-card">
          <CardHeader className="p-3 bg-muted/10 font-bold text-xs">قراردادهای در حال اجرا</CardHeader>
          <CardContent className="p-3">
            <div className="overflow-x-auto rounded border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                    <TableHead className="text-right text-xs py-2">عنوان قرارداد</TableHead>
                    <TableHead className="text-center text-xs py-2 w-16">پیشرفت</TableHead>
                    <TableHead className="text-center text-xs py-2 w-28">مبلغ باقیمانده (ریال)</TableHead>
                    <TableHead className="text-center text-xs py-2 w-20">تاریخ پایان</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inProgressContracts.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-[10px] text-center">{idx + 1}</TableCell>
                      <TableCell className="text-right text-xs font-semibold max-w-xs truncate">{c.title}</TableCell>
                      <TableCell className="font-mono text-xs text-center text-cyan-600 font-bold">{c.progress}%</TableCell>
                      <TableCell className="font-mono text-xs text-center">{Math.round(c.remaining).toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs text-center">{c.end_date}</TableCell>
                    </TableRow>
                  ))}
                  {inProgressContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">قرارداد در حال اجرایی یافت نشد.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ۳. بزرگترین قراردادها */}
        <Card className="border-border/80 shadow-sm text-right bg-card">
          <CardHeader className="p-3 bg-muted/10 font-bold text-xs">بزرگترین قراردادها</CardHeader>
          <CardContent className="p-3">
            <div className="overflow-x-auto rounded border">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                    <TableHead className="text-right text-xs py-2">عنوان قرارداد</TableHead>
                    <TableHead className="text-right text-xs py-2">طرف قرارداد</TableHead>
                    <TableHead className="text-center text-xs py-2 w-28">مبلغ قرارداد (ریال)</TableHead>
                    <TableHead className="text-center text-xs py-2 w-16">پیشرفت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {largestContracts.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-[10px] text-center">{idx + 1}</TableCell>
                      <TableCell className="text-right text-xs font-semibold max-w-xs truncate">{c.title}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{c.contractor}</TableCell>
                      <TableCell className="font-mono text-xs text-center font-bold text-blue-600">{c.amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs text-center text-cyan-600">{c.progress}%</TableCell>
                    </TableRow>
                  ))}
                  {largestContracts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">قراردادی یافت نشد.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>

    </PageShell>
  );
}
