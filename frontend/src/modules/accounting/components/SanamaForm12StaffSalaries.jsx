import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, Users, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, ShieldCheck, Scale, Landmark, FileSpreadsheet, UserCheck
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const INITIAL_FORM_12_ROWS = [
  {
    id: "sal_1",
    creditType: "عمومی",
    employmentType: "رسمی",
    title: "عملکرد حقوق و مزایای مستمر کارکنان رسمی",
    headcount: 0,
    baseSalary: 0,
    continuousAllowances: 0,
    totalPerformance: 0, // عملکرد حقوق و مزایای مستمر (دستی)
    remarks: "",
  },
  {
    id: "sal_2",
    creditType: "عمومی",
    employmentType: "پیمانی",
    title: "عملکرد حقوق و مزایای مستمر کارکنان پیمانی",
    headcount: 0,
    baseSalary: 0,
    continuousAllowances: 0,
    totalPerformance: 0, // عملکرد حقوق و مزایای مستمر (دستی)
    remarks: "",
  },
  {
    id: "sal_3",
    creditType: "عمومی",
    employmentType: "قراردادی",
    title: "عملکرد حقوق و مزایای مستمر کارکنان قراردادی",
    headcount: 0,
    baseSalary: 0,
    continuousAllowances: 0,
    totalPerformance: 0, // عملکرد حقوق و مزایای مستمر (دستی)
    remarks: "",
  },
];

export default function SanamaForm12StaffSalaries({
  rows = INITIAL_FORM_12_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [salaryRows, setSalaryRows] = useState(rows && rows.length > 0 ? rows : INITIAL_FORM_12_ROWS);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setSalaryRows(newRows);
    if (onChange) onChange(newRows);
  };

  // فراخوانی داده‌های واقعی از سیستم حقوق و دستمزد در صورت وجود
  useEffect(() => {
    const fetchPayrollSummary = async () => {
      try {
        const res = await api.get("/api/payroll/dashboard-stats");
        if (res.data?.success && res.data?.data) {
          const stats = res.data.data;
          if (stats.officialTotal > 0 || stats.contractTotal > 0 || stats.corporateTotal > 0) {
            setSalaryRows((prevRows) => {
              const rows = (prevRows && prevRows.length > 0) ? prevRows : INITIAL_FORM_12_ROWS;
              const updated = rows.map((r) => {
                let perf = Number(r.totalPerformance) || 0;
                let count = Number(r.headcount) || 0;

                if (r.employmentType === "رسمی" && stats.officialTotal > 0) {
                  perf = perf > 0 ? perf : stats.officialTotal;
                  count = count > 0 ? count : (stats.officialCount || 0);
                } else if (r.employmentType === "پیمانی" && stats.contractTotal > 0) {
                  perf = perf > 0 ? perf : stats.contractTotal;
                  count = count > 0 ? count : (stats.contractCount || 0);
                } else if (r.employmentType === "قراردادی" && stats.corporateTotal > 0) {
                  perf = perf > 0 ? perf : stats.corporateTotal;
                  count = count > 0 ? count : (stats.corporateCount || 0);
                }

                return {
                  ...r,
                  totalPerformance: perf,
                  headcount: count,
                };
              });

              const hasChanged = JSON.stringify(updated) !== JSON.stringify(prevRows);
              if (hasChanged) {
                if (onChange) onChange(updated);
                return updated;
              }
              return prevRows;
            });
          }
        }
      } catch (e) {
        // اگر کامپوننت حقوق در دسترس نبود، خطا نادیده گرفته می‌شود
      }
    };

    fetchPayrollSummary();
  }, []);

  // تغییر فیلد یک ردیف مشخص
  const handleCellChange = (id, field, value) => {
    const updated = salaryRows.map((r) => {
      if (r.id === id) {
        const updatedRow = { ...r, [field]: value };

        // اگر پایه یا فوق‌العاده تغییر کرد و عملکرد صفر بود، جمع آن‌ها در عملکرد قرار می‌گیرد
        if (field === "baseSalary" || field === "continuousAllowances") {
          const base = Number(field === "baseSalary" ? value : r.baseSalary) || 0;
          const allow = Number(field === "continuousAllowances" ? value : r.continuousAllowances) || 0;
          if (base + allow > 0) {
            updatedRow.totalPerformance = base + allow;
          }
        }

        return updatedRow;
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر ردیف استخدامی جدید
  const handleAddRow = () => {
    const newId = `sal_${Date.now()}`;
    const newRow = {
      id: newId,
      creditType: "عمومی",
      employmentType: "سایر",
      title: "عملکرد سایر دسته‌ها / شرکتی",
      headcount: 0,
      baseSalary: 0,
      continuousAllowances: 0,
      totalPerformance: 0,
      remarks: "",
    };
    updateRows([...salaryRows, newRow]);
  };

  // حذف سطر
  const handleRemoveRow = (id) => {
    const filtered = salaryRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین و سیستم حقوق
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع حقوق و مزایای مستمر
  const calculatedTotals = useMemo(() => {
    return salaryRows.reduce(
      (acc, r) => {
        const official = r.employmentType === "رسمی" ? (Number(r.totalPerformance) || 0) : 0;
        const contract = r.employmentType === "پیمانی" ? (Number(r.totalPerformance) || 0) : 0;
        const corporate = r.employmentType === "قراردادی" ? (Number(r.totalPerformance) || 0) : 0;
        const totalPerf = Number(r.totalPerformance) || 0;
        const count = Number(r.headcount) || 0;
        const base = Number(r.baseSalary) || 0;
        const allow = Number(r.continuousAllowances) || 0;

        acc.officialTotal += official;
        acc.contractTotal += contract;
        acc.corporateTotal += corporate;
        acc.grandTotalPerformance += totalPerf;
        acc.totalHeadcount += count;
        acc.totalBaseSalary += base;
        acc.totalAllowances += allow;

        return acc;
      },
      {
        officialTotal: 0,
        contractTotal: 0,
        corporateTotal: 0,
        grandTotalPerformance: 0,
        totalHeadcount: 0,
        totalBaseSalary: 0,
        totalAllowances: 0,
      }
    );
  }, [salaryRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>عملکرد کارکنان رسمی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              رسمی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.officialTotal)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>عملکرد کارکنان پیمانی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
              پیمانی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-amber-800 dark:text-amber-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.contractTotal)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>عملکرد کارکنان قراردادی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              قراردادی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.corporateTotal)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>جمع کل عملکرد حقوق و مزایا</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              سرجمع محاسباتی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.grandTotalPerformance)} <span className="text-[10px]">ریال</span>
          </div>
        </div>
      </div>

      {/* ─── نوار ابزار کنترلی ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-bold px-2.5 py-1 gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>مجموع شاغلین: {toPersianDigits(calculatedTotals.totalHeadcount)} نفر</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            فرم عملکرد حقوق و مزایای مستمر کارکنان (فرم ۱۲ سناما)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAutoFillFromMoein}
            className="h-8 text-xs font-bold gap-1.5 border-primary/40 hover:bg-primary/10 text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>فراخوانی کدهای معین / حقوق</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleAddRow}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>افزودن دسته استخدامی</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی عملکرد حقوق و مزایای مستمر - فرم ۱۲ ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1200px]">
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={4} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات نوع استخدام و عنوان سطر
                </th>
                <th colSpan={4} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  تعداد نفرات و عملکرد حقوق و مزایای مستمر
                </th>
                <th colSpan={2} className="p-2 bg-muted/90 text-center">
                  توضیحات و عملیات
                </th>
              </tr>

              {/* سطر ۲: عناوین دقیق ستون‌ها */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[100px]">نوع اعتبار</th>
                <th className="p-2 min-w-[120px]">وضعیت استخدام</th>
                <th className="p-2 min-w-[240px]">عنوان سطر عملکرد</th>

                <th className="p-2 min-w-[90px]">تعداد نفرات</th>
                <th className="p-2 min-w-[150px]">
                  حقوق و مزایای حکم / پایه <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>
                <th className="p-2 min-w-[150px]">
                  فوق‌العاده‌های مستمر <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>
                <th className="p-2 min-w-[170px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800">
                  عملکرد حقوق و مزایای مستمر <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>

                <th className="p-2 min-w-[150px]">توضیحات</th>
                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {salaryRows.map((row, index) => {
                return (
                  <tr 
                    key={row.id} 
                    className={cn(
                      "hover:bg-muted/30 transition-colors duration-150 divide-x divide-x-reverse divide-border/40",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    {/* # */}
                    <td className="p-2 text-center font-bold text-muted-foreground font-mono">
                      {toPersianDigits(index + 1)}
                    </td>

                    {/* نوع اعتبار */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.creditType}
                        onChange={(e) => handleCellChange(row.id, "creditType", e.target.value)}
                        className="h-8 w-full px-1.5 text-xs font-bold rounded-md border border-input bg-background cursor-pointer focus:ring-1 focus:ring-primary"
                      >
                        <option value="عمومی">عمومی</option>
                        <option value="اختصاصی">اختصاصی</option>
                      </select>
                    </td>

                    {/* وضعیت استخدام */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.employmentType}
                        onChange={(e) => handleCellChange(row.id, "employmentType", e.target.value)}
                        className="h-8 w-full px-1.5 text-xs font-bold rounded-md border border-input bg-background cursor-pointer focus:ring-1 focus:ring-primary"
                      >
                        <option value="رسمی">رسمی</option>
                        <option value="پیمانی">پیمانی</option>
                        <option value="قراردادی">قراردادی</option>
                        <option value="سایر">سایر / شرکتی</option>
                      </select>
                    </td>

                    {/* عنوان سطر عملکرد */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.title}
                        onChange={(e) => handleCellChange(row.id, "title", e.target.value)}
                        className="h-8 text-xs font-bold bg-background/80"
                        placeholder="عنوان سطر حقوق و مزایا..."
                      />
                    </td>

                    {/* تعداد نفرات */}
                    <td className="p-1.5">
                      <Input
                        type="number"
                        dir="ltr"
                        value={row.headcount}
                        onChange={(e) => handleCellChange(row.id, "headcount", Number(e.target.value) || 0)}
                        className="h-8 text-xs font-mono text-center bg-background/80 font-bold"
                      />
                    </td>

                    {/* حقوق و مزایای حکم / پایه (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.baseSalary}
                        onChange={(val) => handleCellChange(row.id, "baseSalary", val)}
                      />
                    </td>

                    {/* فوق‌العاده‌های مستمر (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.continuousAllowances}
                        onChange={(val) => handleCellChange(row.id, "continuousAllowances", val)}
                      />
                    </td>

                    {/* عملکرد حقوق و مزایای مستمر (دستی) */}
                    <td className="p-1.5 bg-emerald-50/30 dark:bg-emerald-950/10">
                      <PersianAmountInput
                        value={row.totalPerformance}
                        onChange={(val) => handleCellChange(row.id, "totalPerformance", val)}
                        textColor="text-emerald-800"
                      />
                    </td>

                    {/* توضیحات */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.remarks || ""}
                        onChange={(e) => handleCellChange(row.id, "remarks", e.target.value)}
                        className="h-8 text-xs bg-background/80"
                        placeholder="توضیحات تکمیلی..."
                      />
                    </td>

                    {/* دکمه حذف */}
                    <td className="p-1.5 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRow(row.id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="حذف این سطر حقوق"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {salaryRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={4} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>جمع عملکرد حقوق و مزایای مستمر کارکنان ({toPersianDigits(salaryRows.length)} دسته استخدامی):</span>
                    </div>
                  </td>

                  {/* مجموع تعداد نفرات */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {toPersianDigits(calculatedTotals.totalHeadcount)}
                  </td>

                  {/* مجموع حقوق پایه */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.totalBaseSalary)}
                  </td>

                  {/* مجموع فوق‌العاده‌ها */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.totalAllowances)}
                  </td>

                  {/* جمع کل عملکرد حقوق و مزایای مستمر (محاسباتی / دستی) */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20">
                    {formatPersianAmount(calculatedTotals.grandTotalPerformance)}
                  </td>

                  <td colSpan={2} className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۱۲ ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در عملکرد حقوق و مزایا (فرم ۱۲):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>عملکرد حقوق و مزایای مستمر</b> شامل اقلام حکمی، حقوق پایه و فوق‌العاده‌های مستمر کارکنان به تفکیک وضعیت استخدامی (رسمی، پیمانی و قراردادی) می‌باشد.</li>
            <li>مبالغ این فرم به‌صورت <b>دستی</b> قابل ثبت بوده و هم‌زمان قابلیت فراخوانی اتوماتیک از سامانه حقوق و دستمزد را دارا می‌باشد.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
