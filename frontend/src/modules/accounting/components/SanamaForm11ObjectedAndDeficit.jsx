import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, ShieldCheck, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, Scale, Landmark, FileSpreadsheet, AlertTriangle
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const INITIAL_FORM_11_ROWS = [
  {
    id: "obj_1",
    creditType: "عمومی",
    rowTitle: "اسناد واخواهی شده دیوان محاسبات کشور",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    sentToTreasury: 0,
    transferredFunds: 0,
    cashierDeficit: 0, // کد معین ۹۳۵۰۳
    objectedDocuments: 0, // کد معین ۹۲۵۰۳
    yearEndBalance: 0, // کد معین ۸۱۰۰۷
  },
  {
    id: "obj_2",
    creditType: "عمومی",
    rowTitle: "کسری ابواب جمعی جمعداران و کارپردازان (دارای مانده)",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    sentToTreasury: 0,
    transferredFunds: 0,
    cashierDeficit: 0, // کد معین ۹۳۵۰۳
    objectedDocuments: 0, // کد معین ۹۲۵۰۳
    yearEndBalance: 0, // کد معین ۸۱۰۰۷
  },
  {
    id: "obj_3",
    creditType: "اختصاصی / تملک",
    rowTitle: "کسری ابواب جمعی برداشتی و سنواتی",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    sentToTreasury: 0,
    transferredFunds: 0,
    cashierDeficit: 0, // کد معین ۹۳۵۰۳
    objectedDocuments: 0, // کد معین ۹۲۵۰۳
    yearEndBalance: 0, // کد معین ۸۱۰۰۷
  },
];

export default function SanamaForm11ObjectedAndDeficit({
  rows = INITIAL_FORM_11_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [objectedRows, setObjectedRows] = useState(rows && rows.length > 0 ? rows : INITIAL_FORM_11_ROWS);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setObjectedRows(newRows);
    if (onChange) onChange(newRows);
  };

  // فراخوانی اتوماتیک کدهای معین تراز اسناد (کدهای ۹۳۵۰۳، ۹۲۵۰۳، ۸۱۰۰۷)
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    const m93503 = moeinBalancesMap["93503"] || moeinBalancesMap["93501"] || moeinBalancesMap["93502"] || 0; // کسری ابواب جمعی
    const m92503 = moeinBalancesMap["92503"] || moeinBalancesMap["92501"] || moeinBalancesMap["92502"] || 0; // اسناد واخواهی
    const m81007 = moeinBalancesMap["81007"] || 0; // مانده پایان سال کسری برداشتی

    if (objectedRows.length > 0 && (m93503 > 0 || m92503 > 0 || m81007 > 0)) {
      setObjectedRows((prevRows) => {
        const rows = (prevRows && prevRows.length > 0) ? prevRows : INITIAL_FORM_11_ROWS;
        const updated = rows.map((r) => {
          let cDef = Number(r.cashierDeficit) || 0;
          let objDoc = Number(r.objectedDocuments) || 0;
          let yearEnd = Number(r.yearEndBalance) || 0;

          if (r.rowTitle?.includes("واخواهی")) {
            objDoc = m92503 > 0 ? m92503 : objDoc;
          } else if (r.rowTitle?.includes("برداشتی")) {
            yearEnd = m81007 > 0 ? m81007 : yearEnd;
            cDef = m93503 > 0 ? Math.round(m93503 / 2) : cDef;
          } else {
            cDef = m93503 > 0 ? Math.round(m93503 / 2) : cDef;
          }

          return {
            ...r,
            cashierDeficit: cDef,
            objectedDocuments: objDoc,
            yearEndBalance: yearEnd,
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
  }, [moeinBalancesMap]);

  // تغییر فیلد یک ردیف مشخص
  const handleCellChange = (id, field, value) => {
    const updated = objectedRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر اسناد واخواهی/کسری جدید
  const handleAddRow = () => {
    const newId = `obj_${Date.now()}`;
    const newRow = {
      id: newId,
      creditType: "عمومی",
      rowTitle: "سطر جدید اسناد واخواهی / کسری ابواب جمعی",
      initialBalance: 0,
      transferredCreditConsumed: 0,
      sentToTreasury: 0,
      transferredFunds: 0,
      cashierDeficit: 0,
      objectedDocuments: 0,
      yearEndBalance: 0,
    };
    updateRows([...objectedRows, newRow]);
  };

  // حذف سطر
  const handleRemoveRow = (id) => {
    const filtered = objectedRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع اسناد واخواهی و کسری ابواب جمعی
  const calculatedTotals = useMemo(() => {
    return objectedRows.reduce(
      (acc, r) => {
        const init = Number(r.initialBalance) || 0;
        const consumed = Number(r.transferredCreditConsumed) || 0;
        const sent = Number(r.sentToTreasury) || 0;
        const transferred = Number(r.transferredFunds) || 0;
        const cDeficit = Number(r.cashierDeficit) || 0;
        const objDocs = Number(r.objectedDocuments) || 0;
        const yearEnd = Number(r.yearEndBalance) || 0;

        acc.initialBalance += init;
        acc.transferredCreditConsumed += consumed;
        acc.sentToTreasury += sent;
        acc.transferredFunds += transferred;
        acc.cashierDeficit += cDeficit;
        acc.objectedDocuments += objDocs;
        acc.yearEndBalance += yearEnd;

        return acc;
      },
      {
        initialBalance: 0,
        transferredCreditConsumed: 0,
        sentToTreasury: 0,
        transferredFunds: 0,
        cashierDeficit: 0,
        objectedDocuments: 0,
        yearEndBalance: 0,
      }
    );
  }, [objectedRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-400">
            <span>اسناد واخواهی شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
              کد ۹۲۵۰۳
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-rose-800 dark:text-rose-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.objectedDocuments)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-orange-700 dark:text-orange-400">
            <span>کسری ابواب جمعی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30">
              کد ۹۳۵۰۳
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-orange-800 dark:text-orange-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.cashierDeficit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>وجوه ارسالی به خزانه</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              واریزی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.sentToTreasury)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>مانده پایان سال</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              کد ۸۱۰۰۷
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.yearEndBalance)} <span className="text-[10px]">ریال</span>
          </div>
        </div>
      </div>

      {/* ─── نوار ابزار کنترلی ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-bold px-2.5 py-1 gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>تعداد ردیف‌ها: {toPersianDigits(objectedRows.length)} سطر</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            فرم اسناد واخواهی شده و کسری ابواب جمعی (فرم ۱۱ سناما)
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
            <span>فراخوانی کدهای معین</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleAddRow}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>افزودن سطر جدید</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی اسناد واخواهی شده و کسری ابواب جمعی - فرم ۱۱ ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1350px]">
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={3} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات نوع اعتبار و شرح سطر
                </th>
                <th colSpan={4} className="p-2 border-r border-border/60 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  مانده‌های دستی، مصرف‌شده و ارسالی به خزانه
                </th>
                <th colSpan={3} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  کسری ابواب جمعی، واخواهی و مانده نهایی
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: عناوین ۸ ستون درخواستی دقیق کاربر */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[110px]">نوع اعتبار</th>
                <th className="p-2 min-w-[240px]">شرح سطر / عنوان</th>

                <th className="p-2 min-w-[150px] bg-amber-50/40 dark:bg-amber-950/20 text-amber-800">
                  مانده ابتدای سال <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>
                <th className="p-2 min-w-[150px]">
                  اعتبار انتقالی مصرف شده <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>
                <th className="p-2 min-w-[150px]">
                  وجوه ارسالی به خزانه <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>
                <th className="p-2 min-w-[150px]">
                  وجوه انتقالی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دستی)</span>
                </th>

                <th className="p-2 min-w-[160px] bg-orange-50/40 dark:bg-orange-950/20 text-orange-800">
                  کسری ابواب جمعی <br/>
                  <span className="text-[9px] font-mono bg-orange-100 text-orange-800 px-1 rounded">۹۳۵۰۳</span>
                </th>
                <th className="p-2 min-w-[160px] bg-rose-50/40 dark:bg-rose-950/20 text-rose-800">
                  اسناد واخواهی شده <br/>
                  <span className="text-[9px] font-mono bg-rose-100 text-rose-800 px-1 rounded">۹۲۵۰۳</span>
                </th>
                <th className="p-2 min-w-[160px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800">
                  مانده پایان سال <br/>
                  <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 rounded">۸۱۰۰۷</span>
                </th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {objectedRows.map((row, index) => {
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
                        <option value="تملک">تملک</option>
                      </select>
                    </td>

                    {/* شرح سطر / عنوان */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.rowTitle}
                        onChange={(e) => handleCellChange(row.id, "rowTitle", e.target.value)}
                        className="h-8 text-xs font-bold bg-background/80"
                        placeholder="شرح سطر یا عنوان واخواهی..."
                      />
                    </td>

                    {/* مانده ابتدای سال (دستی) */}
                    <td className="p-1.5 bg-amber-50/20 dark:bg-amber-950/10">
                      <PersianAmountInput
                        value={row.initialBalance}
                        onChange={(val) => handleCellChange(row.id, "initialBalance", val)}
                        textColor="text-amber-800"
                      />
                    </td>

                    {/* اعتبار انتقالی مصرف شده (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredCreditConsumed}
                        onChange={(val) => handleCellChange(row.id, "transferredCreditConsumed", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* وجوه ارسالی به خزانه (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.sentToTreasury}
                        onChange={(val) => handleCellChange(row.id, "sentToTreasury", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* وجوه انتقالی (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredFunds}
                        onChange={(val) => handleCellChange(row.id, "transferredFunds", val)}
                        textColor="text-indigo-800"
                      />
                    </td>

                    {/* کسری ابواب جمعی (۹۳۵۰۳) */}
                    <td className="p-1.5 bg-orange-50/20 dark:bg-orange-950/10">
                      <PersianAmountInput
                        value={row.cashierDeficit}
                        onChange={(val) => handleCellChange(row.id, "cashierDeficit", val)}
                        textColor="text-orange-800"
                      />
                    </td>

                    {/* اسناد واخواهی شده (۹۲۵۰۳) */}
                    <td className="p-1.5 bg-rose-50/20 dark:bg-rose-950/10">
                      <PersianAmountInput
                        value={row.objectedDocuments}
                        onChange={(val) => handleCellChange(row.id, "objectedDocuments", val)}
                        textColor="text-rose-800"
                      />
                    </td>

                    {/* مانده پایان سال (۸۱۰۰۷) */}
                    <td className="p-1.5 bg-emerald-50/30 dark:bg-emerald-950/10">
                      <PersianAmountInput
                        value={row.yearEndBalance}
                        onChange={(val) => handleCellChange(row.id, "yearEndBalance", val)}
                        textColor="text-emerald-800"
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
                        title="حذف این سطر"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {objectedRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={3} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل اسناد واخواهی و کسری ابواب جمعی ({toPersianDigits(objectedRows.length)} سطر):</span>
                    </div>
                  </td>

                  {/* مجموع مانده ابتدای سال */}
                  <td className="p-2.5 text-center font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-500/10">
                    {formatPersianAmount(calculatedTotals.initialBalance)}
                  </td>

                  {/* مجموع اعتبار انتقالی مصرف شده */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-500/10">
                    {formatPersianAmount(calculatedTotals.transferredCreditConsumed)}
                  </td>

                  {/* مجموع وجوه ارسالی به خزانه */}
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-500/10">
                    {formatPersianAmount(calculatedTotals.sentToTreasury)}
                  </td>

                  {/* مجموع وجوه انتقالی */}
                  <td className="p-2.5 text-center font-mono font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-500/10">
                    {formatPersianAmount(calculatedTotals.transferredFunds)}
                  </td>

                  {/* مجموع کسری ابواب جمعی (۹۳۵۰۳) */}
                  <td className="p-2.5 text-center font-mono font-bold text-orange-900 dark:text-orange-200 bg-orange-500/20">
                    {formatPersianAmount(calculatedTotals.cashierDeficit)}
                  </td>

                  {/* مجموع اسناد واخواهی شده (۹۲۵۰۳) */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-900 dark:text-rose-200 bg-rose-500/20">
                    {formatPersianAmount(calculatedTotals.objectedDocuments)}
                  </td>

                  {/* مجموع مانده پایان سال (۸۱۰۰۷) */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20">
                    {formatPersianAmount(calculatedTotals.yearEndBalance)}
                  </td>

                  <td className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۱۱ ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در اسناد واخواهی و کسری ابواب جمعی (فرم ۱۱):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>کسری ابواب جمعی</b> متصل به کد معین <b>۹۳۵۰۳</b> (کسری ابواب جمعی عمومی/هزینه‌ای) می‌باشد.</li>
            <li><b>اسناد واخواهی شده</b> متصل به کد معین <b>۹۲۵۰۳</b> (اسناد واخواهی شده دیوان محاسبات کشور) می‌باشد.</li>
            <li><b>مانده پایان سال</b> متصل به کد معین <b>۸۱۰۰۷</b> (کسری ابواب جمعی برداشتی و سنواتی) می‌باشد.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
