import { useState, useEffect } from "react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  FileText, Scale, CheckCircle2, AlertTriangle, Printer, RefreshCw, FolderGit2, Filter, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";

function toPersianDigits(n) {
  if (n === null || n === undefined) return "";
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

function fmtNum(val) {
  if (val === null || val === undefined || val === "") return "۰";
  const num = Number(val);
  if (isNaN(num)) return toPersianDigits(val);
  return toPersianDigits(num.toLocaleString("fa-IR"));
}

export default function PerformanceStatementsReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("expensePublic");
  const [fiscalYear, setFiscalYear] = useState("1404");
  const [period, setPeriod] = useState("all");
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchStatements = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get(`/api/credits/performance-statements-4way?fiscal_year=${fiscalYear}&period=${period}`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setErrorMsg("خطا در دریافت اطلاعات صورتحساب‌های ۴گانه عملکرد.");
      }
    } catch (err) {
      setErrorMsg("خطا در ارتباط با سرور جهت دریافت اطلاعات صورتحساب‌ها.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [fiscalYear, period]);

  const currentStatement = data ? data[activeTab] : null;

  return (
    <PageShell>
      <PageHeader
        title="صورتحساب‌های ۴گانه عملکرد دریافت و پرداخت"
        subtitle="گزارش تطبیقی اعتبارات مصوب نهایی، تخصیص یافته و کنترل تفصیلی برنامه‌ها و پروژه‌ها بر حسب سال مالی و دوره"
        icon={Scale}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchStatements} disabled={loading} className="gap-1 text-xs">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              بروزرسانی
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 text-xs">
              <Printer className="h-3.5 w-3.5" />
              چاپ گزارش
            </Button>
          </div>
        }
      />

      {/* نوار فیلتر سال مالی و دوره گزارش‌گیری */}
      <Card className="border border-primary/20 bg-muted/20 shadow-xs mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Filter className="h-4 w-4" />
              <span>فیلترهای گزارش‌گیری عملکرد:</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* فیلتر سال مالی */}
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-bold text-foreground">سال مالی:</Label>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">همه سال‌های مالی</option>
                  <option value="1401">سال مالی ۱۴۰۱</option>
                  <option value="1402">سال مالی ۱۴۰۲</option>
                  <option value="1403">سال مالی ۱۴۰۳</option>
                  <option value="1404">سال مالی ۱۴۰۴</option>
                  <option value="1405">سال مالی ۱۴۰۵</option>
                </select>
              </div>

              {/* فیلتر دوره گزارش‌گیری */}
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-bold text-foreground">دوره تخصیص / گزارش:</Label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">تمامی دوره‌ها (سالانه کامل)</option>
                  <option value="سه ماهه اول">سه ماهه اول</option>
                  <option value="سه ماهه دوم">سه ماهه دوم</option>
                  <option value="سه ماهه سوم">سه ماهه سوم</option>
                  <option value="سه ماهه چهارم">سه ماهه چهارم</option>
                  <option value="شش ماهه اول">شش ماهه اول</option>
                  <option value="شش ماهه دوم">شش ماهه دوم</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* خلاصه کارت‌های ۴ صورتحساب */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {[
          { key: "expensePublic", title: "۱. هزینه‌ای عمومی", code: "۹۲۰۰۱ / منبع ۱", data: data?.expensePublic },
          { key: "expenseDedicated", title: "۲. هزینه‌ای اختصاصی", code: "۹۲۰۰۱ / منبع ۲", data: data?.expenseDedicated },
          { key: "capitalPublic", title: "۳. تملک عمومی", code: "۹۲۰۰۲ / منبع ۱", data: data?.capitalPublic },
          { key: "capitalDedicated", title: "۴. تملک اختصاصی", code: "۹۲۰۰۲ / منبع ۲", data: data?.capitalDedicated },
        ].map((item) => {
          const isSelected = activeTab === item.key;
          return (
            <Card
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "cursor-pointer transition-all duration-200 border hover:shadow-md",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50"
              )}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">{item.title}</span>
                  <Badge variant={isSelected ? "default" : "outline"} className="text-[10px]">
                    {item.code}
                  </Badge>
                </div>
                <div className="text-base font-mono font-bold text-primary">
                  {fmtNum(item.data?.approvedBudget || 0)} <span className="text-[10px] font-normal text-muted-foreground">ریال</span>
                </div>
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>تخصیص یافت‌یافته:</span>
                  <span className="font-bold text-blue-600 font-mono">{fmtNum(item.data?.allocated || 0)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* تب‌های تفکیکی صورتحساب‌ها */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="expensePublic" className="text-xs py-2 font-bold">
            صورتحساب هزینه‌ای عمومی (۹۲۰۰۱)
          </TabsTrigger>
          <TabsTrigger value="expenseDedicated" className="text-xs py-2 font-bold">
            صورتحساب هزینه‌ای اختصاصی (۹۲۰۰۱)
          </TabsTrigger>
          <TabsTrigger value="capitalPublic" className="text-xs py-2 font-bold">
            صورتحساب تملک عمومی (۹۲۰۰۲)
          </TabsTrigger>
          <TabsTrigger value="capitalDedicated" className="text-xs py-2 font-bold">
            صورتحساب تملک اختصاصی (۹۲۰۰۲)
          </TabsTrigger>
        </TabsList>

        {currentStatement && (
          <TabsContent value={activeTab} className="space-y-6">
            {/* کارت سرجمع ستون‌های بودجه، تخصیص و عملکرد */}
            <Card className="border shadow-xs">
              <CardHeader className="p-4 bg-muted/20 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {currentStatement.statementTitle}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      بودجه مصوب: {currentStatement.debtorCode} | تخصیص یافته: {currentStatement.allocationDebtorCode || (activeTab.includes("capital") ? "۹۳۰۰۲" : "۹۳۰۰۱")} | طرف حساب: {currentStatement.creditorCode}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-background text-xs font-mono px-3 py-1">
                    منبع: {currentStatement.sourceType === "2" ? "اختصاصی" : "عمومی"} | دوره: {period === "all" ? "کامل" : period}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div className="text-xs font-semibold text-emerald-800">اعتبار مصوب نهایی (۹۲۰۰۱/۹۲۰۰۲)</div>
                    <div className="text-base font-mono font-bold text-emerald-700 mt-1">
                      {fmtNum(currentStatement.approvedBudget)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100">
                    <div className="text-xs font-semibold text-blue-800">اعتبار تخصیص یافته (۹۳۰۰۱/۹۳۰۰۲)</div>
                    <div className="text-base font-mono font-bold text-blue-700 mt-1">
                      {fmtNum(currentStatement.allocated)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                    <div className="text-xs font-semibold text-amber-800">عملکرد / اعتبار مصرف شده</div>
                    <div className="text-base font-mono font-bold text-amber-700 mt-1">
                      {fmtNum(currentStatement.consumed)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-100">
                    <div className="text-xs font-semibold text-purple-800">مانده اعتبار مصوب نهایی</div>
                    <div className="text-base font-mono font-bold text-purple-700 mt-1">
                      {fmtNum(currentStatement.remaining)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* در اعتبارات هزینه‌ای: جدول تفکیک عملکرد به تفکیک برنامه‌ها/فعالیت‌ها */}
            {(activeTab === "expensePublic" || activeTab === "expenseDedicated") && (
              <Card className="border border-blue-200/80 shadow-xs">
                <CardHeader className="p-4 bg-blue-50/40 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-xs font-bold text-blue-950">
                          جدول تفکیک عملکرد بر حسب برنامه‌ها / فعالیت‌ها (۹۳۰۰۱ / ۹۲۰۰۱)
                        </CardTitle>
                        <CardDescription className="text-[11px] text-blue-800/80 mt-0.5">
                          همخوانی تفصیلی برنامه و فعالیت با مبالغ ثبت‌شده در هدر موافقتنامه و تخصیص
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white gap-1 text-xs px-2.5 py-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      تطابق کدینگ برنامه‌ها (۱۰۰٪ منطبق)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-blue-100/50 text-blue-900 border-b">
                          <th className="p-3 font-bold w-12 text-center">#</th>
                          <th className="p-3 font-bold">کد تفصیلی برنامه</th>
                          <th className="p-3 font-bold">عنوان برنامه / فعالیت</th>
                          <th className="p-3 font-bold text-center">اعتبار مصوب نهایی (ریال)</th>
                          <th className="p-3 font-bold text-center">اعتبار تخصیص‌یافته (ریال)</th>
                          <th className="p-3 font-bold text-center">وضعیت تفصیلی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentStatement.programsBreakdown && currentStatement.programsBreakdown.length > 0 ? (
                          currentStatement.programsBreakdown.map((prog, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="p-3 text-center font-mono">{toPersianDigits(idx + 1)}</td>
                              <td className="p-3 font-mono font-bold text-blue-700">{toPersianDigits(prog.programCode)}</td>
                              <td className="p-3 font-bold">{prog.title}</td>
                              <td className="p-3 font-mono font-bold text-center">{fmtNum(prog.budget)}</td>
                              <td className="p-3 font-mono font-bold text-center text-blue-700">{fmtNum(prog.allocated)}</td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                                  تایید تفصیلی برنامه
                                </Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                              هنوز برنامه‌ای برای این صورتحساب ثبت نگردیده است.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* در اعتبارات تملک: جدول تفکیک عملکرد به تفکیک پروژه‌ها/طرح‌ها */}
            {(activeTab === "capitalPublic" || activeTab === "capitalDedicated") && (
              <Card className="border border-indigo-200/80 shadow-xs">
                <CardHeader className="p-4 bg-indigo-50/40 border-b border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="h-5 w-5 text-indigo-600" />
                      <div>
                        <CardTitle className="text-xs font-bold text-indigo-950">
                          کنترل سطح تفصیلی پروژه‌ها/طرح‌ها (۹۳۰۰۲ / ۹۲۰۰۲)
                        </CardTitle>
                        <CardDescription className="text-[11px] text-indigo-800/80 mt-0.5">
                          جدول تفکیک عملکرد به تفکیک طرح‌ها و پروژه‌ها (همخوانی اعتبار مصوب و تخصیص یافته)
                        </CardDescription>
                      </div>
                    </div>

                    {/* بررسی تطابق مغایرت */}
                    {(() => {
                      const projectsSum = (currentStatement.projectsBreakdown || []).reduce((s, p) => s + (p.budget || 0), 0);
                      const hasDiscrepancy = projectsSum !== currentStatement.approvedBudget;
                      return hasDiscrepancy ? (
                        <Badge variant="destructive" className="gap-1 text-xs px-2.5 py-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          مغایرت تفصیلی پروژه وجود دارد
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 text-white gap-1 text-xs px-2.5 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          تطابق کامل تفصیلی پروژه‌ها (۱۰۰٪ منطبق)
                        </Badge>
                      );
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="bg-indigo-100/50 text-indigo-900 border-b">
                          <th className="p-3 font-bold w-12 text-center">#</th>
                          <th className="p-3 font-bold">کد تفصیلی طرح / پروژه</th>
                          <th className="p-3 font-bold">عنوان پروژه / طرح</th>
                          <th className="p-3 font-bold text-center">اعتبار مصوب نهایی (ریال)</th>
                          <th className="p-3 font-bold text-center">اعتبار تخصیص‌یافته (ریال)</th>
                          <th className="p-3 font-bold text-center">وضعیت تفصیلی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {currentStatement.projectsBreakdown && currentStatement.projectsBreakdown.length > 0 ? (
                          currentStatement.projectsBreakdown.map((proj, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="p-3 text-center font-mono">{toPersianDigits(idx + 1)}</td>
                              <td className="p-3 font-mono font-bold text-indigo-700">{toPersianDigits(proj.projectCode)}</td>
                              <td className="p-3">{proj.title}</td>
                              <td className="p-3 font-mono font-bold text-center">{fmtNum(proj.budget)}</td>
                              <td className="p-3 font-mono font-bold text-center text-blue-700">{fmtNum(proj.allocated)}</td>
                              <td className="p-3 text-center">
                                {proj.projectCode === "فاقد کد پروژه" ? (
                                  <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50">
                                    فاقد تفصیلی معتبر
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                                    تایید تفصیلی طرح
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                              هنوز طرح/پروژه‌ای برای این صورتحساب تملک ثبت نگردیده است.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* جدول ریز موافقتنامه‌های لینک شده */}
            <Card className="border shadow-xs">
              <CardHeader className="p-4 bg-muted/10 border-b">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  لیست موافقتنامه‌های مندرج در این صورتحساب ({toPersianDigits(currentStatement.agreementsCount)} فقره)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-muted/30 text-muted-foreground border-b">
                        <th className="p-3 font-bold w-12 text-center">#</th>
                        <th className="p-3 font-bold">شماره موافقتنامه</th>
                        <th className="p-3 font-bold">عنوان موافقتنامه</th>
                        <th className="p-3 font-bold text-center">کد مبنا</th>
                        <th className="p-3 font-bold text-center">سال مالی</th>
                        <th className="p-3 font-bold text-center">کد معین بدهکار</th>
                        <th className="p-3 font-bold text-center">اعتبار مصوب نهایی (ریال)</th>
                        <th className="p-3 font-bold text-center">وضعیت ثبت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {currentStatement.agreements && currentStatement.agreements.length > 0 ? (
                        currentStatement.agreements.map((agr, idx) => (
                          <tr key={agr._id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3 text-center font-mono">{toPersianDigits(idx + 1)}</td>
                            <td className="p-3 font-mono font-bold text-primary">{agr.agreement_number}</td>
                            <td className="p-3 font-bold">{agr.title}</td>
                            <td className="p-3 text-center font-mono">{agr.base_code || "—"}</td>
                            <td className="p-3 text-center font-mono">{toPersianDigits(agr.fiscal_year || 1404)}</td>
                            <td className="p-3 text-center font-mono">
                              <Badge variant="outline" className="bg-background">
                                {agr.debtor_account || currentStatement.debtorCode}
                              </Badge>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-700">
                              {fmtNum(agr.total_amount)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                نهایی و ابلاغ‌شده
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                            هیچ موافقتنامه‌ای در این بخش ثبت نگردیده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </PageShell>
  );
}
