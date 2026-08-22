import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Landmark, ShieldCheck, TrendingUp, Wallet,
  ArrowLeftRight, Activity, Plus, FileText, CheckCircle2, Lock,
  Building2, Layers, AlertTriangle, Clock, Hourglass, ArrowUpRight
} from "lucide-react";
import api from "@/api";

function fmtNum(n) {
  if (n === 0 || n == null) return "۰";
  return Number(n).toLocaleString("fa-IR");
}

export default function CreditsDashboardModule() {
  const navigate = useNavigate();
  const [fiscalYear, setFiscalYear] = useState("1405");
  const [organization, setOrganization] = useState("وزارت امور اقتصادی و دارایی / دستگاه مرکزی");
  const [unit, setUnit] = useState("اداره کل امور مالی و ذیحسابی");

  const [loading, setLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/credits/dashboard-stats?fiscalYear=${fiscalYear}`);
      if (res.data?.success) {
        setStatsData(res.data);
      }
    } catch (e) {
      console.error("Error loading credit dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fiscalYear]);

  const stats = statsData?.stats || {
    totalApproved: 0,
    totalAmendments: 0,
    netBudget: 0,
    totalAllocated: 0,
    unallocatedBudget: 0,
    totalFundingRequested: 0,
    availableAllocation: 0,
    totalObligations: 0,
    totalReleasedObligations: 0,
    netObligations: 0,
    totalVerifiedRealized: 0,
    totalRemitted: 0,
    totalReturned: 0,
    netPayments: 0
  };

  const counts = statsData?.counts || {
    agreementsCount: 0,
    amendmentsCount: 0,
    allocationsCount: 0,
    fundingCount: 0,
    obligationsCount: 0,
    realizationsCount: 0,
    remittancesCount: 0,
    returnsCount: 0
  };

  const lists = statsData?.lists || {
    nearExhaustionList: [],
    openObligationsList: [],
    pendingRequestsList: [],
    pendingPaymentsList: []
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* هدر بخش داشبورد با اطلاعات سال مالی، دستگاه و واحد */}
      <div className="bg-card/70 backdrop-blur-md border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight">داشبورد اعتبارات</h1>
              <p className="text-xs text-muted-foreground mt-0.5">پایش لحظه‌ای و هوشمند ردیف‌های بودجه‌ای، تخصیص، تعهدات و پرداختی‌ها</p>
            </div>
          </div>

          <Button onClick={fetchStats} variant="outline" size="sm" className="gap-2 text-xs font-bold self-end md:self-auto" disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            بروزرسانی داده‌ها
          </Button>
        </div>

        {/* فیلترهای بالا: سال مالی، دستگاه، واحد */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* ۱. سال مالی */}
          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground block">سال مالی:</label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full bg-transparent text-xs font-black text-foreground focus:outline-none cursor-pointer"
              >
                <option value="1405">۱۴۰۵</option>
                <option value="1404">۱۴۰۴</option>
                <option value="1403">۱۴۰۳</option>
                <option value="1402">۱۴۰۲</option>
              </select>
            </div>
          </div>

          {/* ۲. دستگاه */}
          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground block">دستگاه اجرایی:</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
                placeholder="نام دستگاه اجرایی..."
              />
            </div>
          </div>

          {/* ۳. واحد */}
          <div className="flex items-center gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/40">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-muted-foreground block">واحد سازمانی / ذیحسابی:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none"
                placeholder="نام واحد..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ۶ کارت شاخص اصلی شفاف و پرکاربرد */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* کارت ۱: بودجه مصوب */}
        <Card className="border-t-4 border-t-primary shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              بودجه مصوب
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/5 text-primary border-primary/20">
                {counts.agreementsCount} برنامه
              </Badge>
            </span>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="text-lg font-black text-primary tracking-tight">
              {fmtNum(stats.netBudget)}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">ریال</p>
          </CardContent>
        </Card>

        {/* کارت ۲: تخصیص */}
        <Card className="border-t-4 border-t-blue-500 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              تخصیص
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                {counts.allocationsCount} مورد
              </Badge>
            </span>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="text-lg font-black text-blue-600 tracking-tight">
              {fmtNum(stats.totalAllocated)}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">ریال</p>
          </CardContent>
        </Card>

        {/* کارت ۳: تأمین اعتبار */}
        <Card className="border-t-4 border-t-amber-500 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              تأمین اعتبار
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200">
                {counts.fundingCount} گواهی
              </Badge>
            </span>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="text-lg font-black text-amber-600 tracking-tight">
              {fmtNum(stats.totalFundingRequested)}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">ریال</p>
          </CardContent>
        </Card>

        {/* کارت ۴: تعهد */}
        <Card className="border-t-4 border-t-purple-500 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              تعهد
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                {counts.obligationsCount} تعهد
              </Badge>
            </span>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="text-lg font-black text-purple-600 tracking-tight">
              {fmtNum(stats.netObligations)}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">ریال</p>
          </CardContent>
        </Card>

        {/* کارت ۵: تحقق */}
        <Card className="border-t-4 border-t-indigo-500 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              تحقق / تسجیل
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                {counts.realizationsCount} سند
              </Badge>
            </span>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="text-lg font-black text-indigo-600 tracking-tight">
              {fmtNum(stats.totalVerifiedRealized)}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">ریال</p>
          </CardContent>
        </Card>

        {/* کارت ۶: پرداخت */}
        <Card className="border-t-4 border-t-emerald-500 shadow-xs hover:shadow-md transition-all">
          <CardHeader className="p-3 pb-1">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              پرداخت
              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                {counts.remittancesCount} حواله
              </Badge>
            </span>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1">
            <div className="text-lg font-black text-emerald-600 tracking-tight">
              {fmtNum(stats.netPayments)}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">ریال</p>
          </CardContent>
        </Card>
      </div>

      {/* میانبرهای سریع اعتبارات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            میانبرهای سریع مدیریت اعتبارات
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Button
            onClick={() => navigate("/credits/budget/approved")}
            variant="outline"
            className="flex flex-col h-auto py-3 items-center justify-center text-center gap-2 hover:bg-primary/5 hover:border-primary"
          >
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold">ثبت بودجه مصوب</span>
          </Button>

          <Button
            onClick={() => navigate("/credits/allocations/new")}
            variant="outline"
            className="flex flex-col h-auto py-3 items-center justify-center text-center gap-2 hover:bg-blue-500/5 hover:border-blue-500"
          >
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-xs font-bold">تخصیص اعتبار</span>
          </Button>

          <Button
            onClick={() => navigate("/credits/commitments-funding/request")}
            variant="outline"
            className="flex flex-col h-auto py-3 items-center justify-center text-center gap-2 hover:bg-amber-500/5 hover:border-amber-500"
          >
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <span className="text-xs font-bold">تأمین اعتبار</span>
          </Button>

          <Button
            onClick={() => navigate("/credits/obligations/create")}
            variant="outline"
            className="flex flex-col h-auto py-3 items-center justify-center text-center gap-2 hover:bg-purple-500/5 hover:border-purple-500"
          >
            <Lock className="h-5 w-5 text-purple-600" />
            <span className="text-xs font-bold">ایجاد تعهد</span>
          </Button>

          <Button
            onClick={() => navigate("/credits/verification-realization")}
            variant="outline"
            className="flex flex-col h-auto py-3 items-center justify-center text-center gap-2 hover:bg-indigo-500/5 hover:border-indigo-500"
          >
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            <span className="text-xs font-bold">تحقق / تسجیل</span>
          </Button>

          <Button
            onClick={() => navigate("/credits/payments/remittance")}
            variant="outline"
            className="flex flex-col h-auto py-3 items-center justify-center text-center gap-2 hover:bg-emerald-500/5 hover:border-emerald-500"
          >
            <Wallet className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold">صدور حواله</span>
          </Button>
        </CardContent>
      </Card>

      {/* بخش‌های پایش ۴گانه پایین صفحه */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* ۱. اعتبارات نزدیک به اتمام */}
        <Card className="shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
              اعتبارات نزدیک به اتمام
            </CardTitle>
            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px]">
              {lists.nearExhaustionList.length} برنامه
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">عنوان / کد برنامه</th>
                    <th className="p-2.5">بودجه کل</th>
                    <th className="p-2.5">تخصیص‌یافته</th>
                    <th className="p-2.5 text-center">مصرف %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.nearExhaustionList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        اعتباری به حد آستانه اتمام (۷۰٪ به بالا) نرسیده است.
                      </td>
                    </tr>
                  ) : (
                    lists.nearExhaustionList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30">
                        <td className="p-2.5">
                          <span className="font-bold block">{item.title}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{item.program_code || "-"}</span>
                        </td>
                        <td className="p-2.5 font-mono">{fmtNum(item.totalBudget)}</td>
                        <td className="p-2.5 font-mono font-semibold text-blue-600">{fmtNum(item.allocatedAmount)}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-bold">
                            {item.usagePercent}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ۲. تعهدات باز */}
        <Card className="shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-600">
              <Lock className="h-4 w-4" />
              تعهدات باز
            </CardTitle>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
              {lists.openObligationsList.length} تعهد فعال
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">شماره تعهد</th>
                    <th className="p-2.5">ذینفع / پیمانکار</th>
                    <th className="p-2.5">مبلغ تعهد</th>
                    <th className="p-2.5 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.openObligationsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        هیچ تعهد باز یا تسویه‌نشده‌ای وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    lists.openObligationsList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30">
                        <td className="p-2.5 font-mono font-bold">{item.obligation_number}</td>
                        <td className="p-2.5 font-semibold text-foreground">{item.beneficiary_name}</td>
                        <td className="p-2.5 font-mono font-bold text-purple-600">{fmtNum(item.amount)}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            فعال
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ۳. درخواست‌های در انتظار تأیید */}
        <Card className="shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600">
              <Hourglass className="h-4 w-4" />
              درخواست‌های در انتظار تأیید
            </CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
              {lists.pendingRequestsList.length} درخواست
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">شماره درخواست</th>
                    <th className="p-2.5">واحد درخواست‌کننده</th>
                    <th className="p-2.5">مبلغ</th>
                    <th className="p-2.5 text-center">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.pendingRequestsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        درخواستی در انتظار تأیید وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    lists.pendingRequestsList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30">
                        <td className="p-2.5 font-mono font-bold">{item.request_number}</td>
                        <td className="p-2.5 font-semibold text-foreground">{item.requesting_unit || item.purpose}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-600">{fmtNum(item.amount)}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            در انتظار بررسی
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ۴. پرداخت‌های در انتظار */}
        <Card className="shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-600">
              <Clock className="h-4 w-4" />
              پرداخت‌های در انتظار
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
              {lists.pendingPaymentsList.length} حواله معلق
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">شماره حواله</th>
                    <th className="p-2.5">نام دریافت‌کننده</th>
                    <th className="p-2.5">مبلغ (ریال)</th>
                    <th className="p-2.5 text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lists.pendingPaymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        پرداخت در انتظاری وجود ندارد.
                      </td>
                    </tr>
                  ) : (
                    lists.pendingPaymentsList.map((item) => (
                      <tr key={item._id} className="hover:bg-muted/30">
                        <td className="p-2.5 font-mono font-bold">{item.remittance_number}</td>
                        <td className="p-2.5 font-semibold text-foreground">{item.recipient_name}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">{fmtNum(item.amount)}</td>
                        <td className="p-2.5 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] text-blue-600"
                            onClick={() => navigate("/credits/payments/remittance")}
                          >
                            مشاهده
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
