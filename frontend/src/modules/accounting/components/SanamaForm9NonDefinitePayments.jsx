import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, FileText, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, ShieldCheck, Scale, Landmark, FileSpreadsheet, Wallet
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const INITIAL_FORM_9_ROWS = [
  {
    id: "nd_1",
    creditLocation: "عمومی - ملی",
    receiptLocation: "مستقیم خزانه",
    title: "پیش‌پرداخت‌های هزینه‌ای و سنواتی",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    inventories: 0,
    transferredObjections: 0,
    transferredDeficit: 0,
    sentToTreasury: 0,
    yearEndBalance: 0, // کد معین ۹۸۰۰۳
  },
  {
    id: "nd_2",
    creditLocation: "عمومی - استانی",
    receiptLocation: "حساب اختصاصی خزانه",
    title: "علی‌الحساب‌های پرداختی سال جاری",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    inventories: 0,
    transferredObjections: 0,
    transferredDeficit: 0,
    sentToTreasury: 0,
    yearEndBalance: 0, // کد معین ۹۸۰۰۳
  },
  {
    id: "nd_3",
    creditLocation: "اختصاصی",
    receiptLocation: "حساب تمرکز وجوه",
    title: "موجودی انبار، جنس و ملزومات مصرفی",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    inventories: 0,
    transferredObjections: 0,
    transferredDeficit: 0,
    sentToTreasury: 0,
    yearEndBalance: 0, // کد معین ۹۸۰۰۴
  },
  {
    id: "nd_4",
    creditLocation: "تملک دارایی سرمایه‌ای",
    receiptLocation: "بانک مرکزی - خزانه",
    title: "پیش‌پرداخت و علی‌الحساب پیمانکاران طرح‌ها",
    initialBalance: 0,
    transferredCreditConsumed: 0,
    inventories: 0,
    transferredObjections: 0,
    transferredDeficit: 0,
    sentToTreasury: 0,
    yearEndBalance: 0, // کد معین ۹۸۰۰۴
  },
];

export default function SanamaForm9NonDefinitePayments({
  rows = INITIAL_FORM_9_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل",
  categoryId = "capital_dedicated",
  categoryTitle = "",
  formId = ""
}) {
  const [paymentRows, setPaymentRows] = useState(rows && rows.length > 0 ? rows : INITIAL_FORM_9_ROWS);

  // تعیین کدهای معین مانده پایان دوره بر اساس دسته فرم (عمومی تملک: ۹۸۰۰۳ | ۹۸۰۰۴، اختصاصی تملک: ۹۸۰۰۴، هزینه‌ای: ۹۸۰۰۳)
  const yearEndMoeinCode = useMemo(() => {
    if (categoryId === "capital_public" || formId === "form_9_cap_pub") {
      return "۹۸۰۰۳ | ۹۸۰۰۴";
    }
    if (categoryId === "capital_dedicated" || formId === "form_9_cap_ded") {
      return "۹۸۰۰۴";
    }
    if (categoryId?.includes("expense") || formId?.includes("exp")) {
      return "۹۸۰۰۳";
    }
    if (categoryTitle?.includes("عمومی") && categoryTitle?.includes("تملک")) {
      return "۹۸۰۰۳ | ۹۸۰۰۴";
    }
    if (categoryTitle?.includes("اختصاصی") && categoryTitle?.includes("تملک")) {
      return "۹۸۰۰۴";
    }
    if (categoryTitle?.includes("تملک")) {
      return "۹۸۰۰۴";
    }
    return "۹۸۰۰۳ | ۹۸۰۰۴";
  }, [categoryId, formId, categoryTitle]);

  const isCapitalForm = categoryId?.includes("capital") || formId?.includes("cap") || categoryTitle?.includes("تملک");

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setPaymentRows(newRows);
    if (onChange) onChange(newRows);
  };

  // فراخوانی اتوماتیک اطلاعات کدهای معین تراز اسناد
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    let mYearEnd = 0;
    if (yearEndMoeinCode.includes("۹۸۰۰۳") && yearEndMoeinCode.includes("۹۸۰۰۴")) {
      const m98003 = moeinBalancesMap["98003"] || moeinBalancesMap["98001"] || 0;
      const m98004 = moeinBalancesMap["98004"] || moeinBalancesMap["98002"] || 0;
      mYearEnd = m98003 + m98004;
    } else if (yearEndMoeinCode.includes("۹۸۰۰۴")) {
      mYearEnd = moeinBalancesMap["98004"] || moeinBalancesMap["98002"] || 0;
    } else {
      mYearEnd = moeinBalancesMap["98003"] || moeinBalancesMap["98001"] || 0;
    }

    if (paymentRows.length > 0 && mYearEnd > 0) {
      setPaymentRows((prevRows) => {
        const rows = (prevRows && prevRows.length > 0) ? prevRows : INITIAL_FORM_9_ROWS;
        const count = rows.length || 1;

        const updated = rows.map((r) => {
          let yearEnd = Math.round(mYearEnd / count);
          let initBal = Number(r.initialBalance) || 0;

          return {
            ...r,
            yearEndBalance: yearEnd,
            initialBalance: initBal > 0 ? initBal : Math.round(yearEnd * 0.8),
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
  }, [moeinBalancesMap, yearEndMoeinCode]);

  // تغییر فیلد یک ردیف مشخص
  const handleCellChange = (id, field, value) => {
    const updated = paymentRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر پرداخت غیرقطعی جدید
  const handleAddRow = () => {
    const newId = `nd_${Date.now()}`;
    const newRow = {
      id: newId,
      creditLocation: "عمومی - ملی",
      receiptLocation: "مستقیم خزانه",
      title: "پرداخت غیرقطعی جدید (پیش‌پرداخت / علی‌الحساب)",
      initialBalance: 0,
      transferredCreditConsumed: 0,
      inventories: 0,
      transferredObjections: 0,
      transferredDeficit: 0,
      sentToTreasury: 0,
      yearEndBalance: 0,
    };
    updateRows([...paymentRows, newRow]);
  };

  // حذف سطر
  const handleRemoveRow = (id) => {
    const filtered = paymentRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع پرداخت‌های غیرقطعی
  const calculatedTotals = useMemo(() => {
    return paymentRows.reduce(
      (acc, r) => {
        const init = Number(r.initialBalance) || 0;
        const consumed = Number(r.transferredCreditConsumed) || 0;
        const inv = Number(r.inventories) || 0;
        const obj = Number(r.transferredObjections) || 0;
        const def = Number(r.transferredDeficit) || 0;
        const sent = Number(r.sentToTreasury) || 0;
        const yearEnd = Number(r.yearEndBalance) || 0;

        // وجوه انتقالی (محاسباتی): مانده ابتدای سال - اعتبار مصرف شده - واریزی خزانه
        const transferred = Math.max(0, init - consumed - sent);

        acc.initialBalance += init;
        acc.transferredCreditConsumed += consumed;
        acc.inventories += inv;
        acc.transferredObjections += obj;
        acc.transferredDeficit += def;
        acc.sentToTreasury += sent;
        acc.transferredFunds += transferred;
        acc.yearEndBalance += yearEnd;

        return acc;
      },
      {
        initialBalance: 0,
        transferredCreditConsumed: 0,
        inventories: 0,
        transferredObjections: 0,
        transferredDeficit: 0,
        sentToTreasury: 0,
        transferredFunds: 0,
        yearEndBalance: 0,
      }
    );
  }, [paymentRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>مانده ابتدای سال پرداخت‌های غیرقطعی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
              افتتاحیه
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-amber-800 dark:text-amber-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.initialBalance)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>اعتبار انتقالی مصرف شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              تسویه شده
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.transferredCreditConsumed)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
            <span>وجوه انتقالی (محاسباتی)</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">
              محاسباتی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-indigo-800 dark:text-indigo-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.transferredFunds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>مانده پایان دوره</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              کد {yearEndMoeinCode}
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
            <Wallet className="h-3.5 w-3.5" />
            <span>تعداد سطرها: {toPersianDigits(paymentRows.length)} مورد</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            صورت پرداخت‌های غیرقطعی، پیش‌پرداخت‌ها و علی‌الحساب‌ها (فرم ۹ سناما)
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
            <span>افزودن پرداخت غیرقطعی</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی پرداختهای غیر قطعی - فرم ۹ ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1550px]">
            {/* هدر گروهی و تک‌ستونی */}
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={4} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات محل اعتبار و عنوان پرداخت غیرقطعی
                </th>
                <th colSpan={3} className="p-2 border-r border-border/60 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  مانده افتتاحیه و گردش تسویه‌شده
                </th>
                <th colSpan={3} className="p-2 border-r border-border/60 bg-blue-500/5 text-blue-700 dark:text-blue-400">
                  اقلام انتقالی و کسرها
                </th>
                <th colSpan={2} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  مانده‌های انتقالی و پایان دوره
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: عناوین ۱۲ ستون درخواستی کاربر */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[130px]">محل اعتبار</th>
                <th className="p-2 min-w-[130px]">محل وصول</th>
                <th className="p-2 min-w-[220px]">عنوان</th>

                <th className="p-2 min-w-[150px] bg-amber-50/40 dark:bg-amber-950/20 text-amber-800">
                  مانده ابتدای سال
                </th>
                <th className="p-2 min-w-[150px]">
                  اعتبار انتقالی مصرف شده
                </th>
                <th className="p-2 min-w-[140px]">
                  موجودی‌ها
                </th>

                <th className="p-2 min-w-[150px]">
                  اسناد واخواهی شده انتقالی
                </th>
                <th className="p-2 min-w-[150px]">
                  کسری ابواب جمعی انتقالی
                </th>
                <th className="p-2 min-w-[150px]">
                  وجوه ارسالی به خزانه
                </th>

                <th className="p-2 min-w-[150px] bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800">
                  وجوه انتقالی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>
                <th className="p-2 min-w-[160px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800">
                  مانده پایان دوره <br/>
                  <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 rounded">کد {yearEndMoeinCode}</span>
                </th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {paymentRows.map((row, index) => {
                const init = Number(row.initialBalance) || 0;
                const consumed = Number(row.transferredCreditConsumed) || 0;
                const sent = Number(row.sentToTreasury) || 0;

                // وجوه انتقالی (محاسباتی)
                const transferredFunds = Math.max(0, init - consumed - sent);

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

                    {/* محل اعتبار */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.creditLocation}
                        onChange={(e) => handleCellChange(row.id, "creditLocation", e.target.value)}
                        className="h-8 text-xs font-medium bg-background/80"
                        placeholder="عمومی / اختصاصی / تملک..."
                      />
                    </td>

                    {/* محل وصول */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.receiptLocation}
                        onChange={(e) => handleCellChange(row.id, "receiptLocation", e.target.value)}
                        className="h-8 text-xs font-medium bg-background/80"
                        placeholder="مستقیم خزانه / بانک..."
                      />
                    </td>

                    {/* عنوان */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.title}
                        onChange={(e) => handleCellChange(row.id, "title", e.target.value)}
                        className="h-8 text-xs font-bold bg-background/80"
                        placeholder="عنوان پیش‌پرداخت / علی‌الحساب..."
                      />
                    </td>

                    {/* مانده ابتدای سال */}
                    <td className="p-1.5 bg-amber-50/20 dark:bg-amber-950/10">
                      <PersianAmountInput
                        value={row.initialBalance}
                        onChange={(val) => handleCellChange(row.id, "initialBalance", val)}
                        textColor="text-amber-800"
                      />
                    </td>

                    {/* اعتبار انتقالی مصرف شده */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredCreditConsumed}
                        onChange={(val) => handleCellChange(row.id, "transferredCreditConsumed", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* موجودی‌ها */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.inventories}
                        onChange={(val) => handleCellChange(row.id, "inventories", val)}
                      />
                    </td>

                    {/* اسناد واخواهی شده انتقالی */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredObjections}
                        onChange={(val) => handleCellChange(row.id, "transferredObjections", val)}
                        textColor="text-rose-800"
                      />
                    </td>

                    {/* کسری ابواب جمعی انتقالی */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredDeficit}
                        onChange={(val) => handleCellChange(row.id, "transferredDeficit", val)}
                        textColor="text-orange-800"
                      />
                    </td>

                    {/* وجوه ارسالی به خزانه */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.sentToTreasury}
                        onChange={(val) => handleCellChange(row.id, "sentToTreasury", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* وجوه انتقالی (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300">
                      {formatPersianAmount(transferredFunds)}
                    </td>

                    {/* مانده پایان دوره (کد معین {yearEndMoeinCode}) */}
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
            {paymentRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={4} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل پرداختهای غیر قطعی ({toPersianDigits(paymentRows.length)} سطر):</span>
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

                  {/* مجموع موجودی‌ها */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.inventories)}
                  </td>

                  {/* مجموع اسناد واخواهی */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-900 dark:text-rose-200 bg-rose-500/10">
                    {formatPersianAmount(calculatedTotals.transferredObjections)}
                  </td>

                  {/* مجموع کسری ابواب جمعی */}
                  <td className="p-2.5 text-center font-mono font-bold text-orange-900 dark:text-orange-200 bg-orange-500/10">
                    {formatPersianAmount(calculatedTotals.transferredDeficit)}
                  </td>

                  {/* مجموع وجوه ارسالی به خزانه */}
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-500/10">
                    {formatPersianAmount(calculatedTotals.sentToTreasury)}
                  </td>

                  {/* مجموع وجوه انتقالی (محاسباتی) */}
                  <td className="p-2.5 text-center font-mono font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-500/20">
                    {formatPersianAmount(calculatedTotals.transferredFunds)}
                  </td>

                  {/* مجموع مانده پایان دوره (کد معین {yearEndMoeinCode}) */}
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

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۹ ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در پرداخت‌های غیرقطعی (فرم ۹):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>محل اعتبار و محل وصول</b> بر اساس منبع عمومی، اختصاصی یا تملک سرمایه‌ای و محل دریافت از خزانه تعیین می‌گردد.</li>
            <li><b>مانده پایان دوره</b> متصل به کد معین <b>{yearEndMoeinCode}</b> ({isCapitalForm ? "پیش‌پرداخت، علی‌الحساب و موجودی تملک دارایی‌های سرمایه‌ای" : "پیش‌پرداخت و علی‌الحساب اعتبارات هزینه‌ای"}) می‌باشد.</li>
            <li><b>وجوه انتقالی</b> حاصل تفاضل مانده ابتدای سال و مبالغ تسویه یا واریز شده به خزانه به‌صورت محاسباتی می‌باشد.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
