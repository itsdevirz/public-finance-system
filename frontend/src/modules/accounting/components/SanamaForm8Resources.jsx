import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, Layers, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, ShieldCheck, Scale, Landmark, FileSpreadsheet
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const INITIAL_FORM_8_ROWS = [
  {
    id: "res_1",
    classificationCode: "110101",
    resourceTitle: "درآمد عمومی - منابع حاصل از عمومی و مالیات",
    sourceLocation: "ملی",
    expectedAmount: 0,
    receivedAmount: 0,
    sentToTreasury: 0,
  },
  {
    id: "res_2",
    classificationCode: "140101",
    resourceTitle: "درآمد اختصاصی - فروش کالاها و خدمات دستگاه",
    sourceLocation: "استانی",
    expectedAmount: 0,
    receivedAmount: 0,
    sentToTreasury: 0,
  },
  {
    id: "res_3",
    classificationCode: "310601",
    resourceTitle: "واگذاری دارایی‌های مالی و سرمایه‌ای",
    sourceLocation: "ملی",
    expectedAmount: 0,
    receivedAmount: 0,
    sentToTreasury: 0,
  }
];

export default function SanamaForm8Resources({
  rows = INITIAL_FORM_8_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [resourceRows, setResourceRows] = useState(rows && rows.length > 0 ? rows : INITIAL_FORM_8_ROWS);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setResourceRows(newRows);
    if (onChange) onChange(newRows);
  };

  // فراخوانی اتوماتیک اطلاعات کدهای معین تراز اسناد در صورت تغییر دفتر معین
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    // کدهای معین صورت‌حساب منابع - فرم ۸
    const m81008 = moeinBalancesMap["81008"] || 0; // منابع پیش‌بینی شده
    const m71001 = moeinBalancesMap["71001"] || 0; // درآمد عمومی
    const m81013 = moeinBalancesMap["81013"] || 0; // درآمد اختصاصی
    const m63001 = moeinBalancesMap["63001"] || 0; // واگذاری دارایی‌ها

    const mReceivedTotal = m71001 + m81013 + m63001;
    const mSentTotal = m63001 + m81013;

    if (m81008 > 0 || mReceivedTotal > 0 || mSentTotal > 0) {
      setResourceRows((prevRows) => {
        const rows = (prevRows && prevRows.length > 0) ? prevRows : INITIAL_FORM_8_ROWS;
        const count = rows.length || 1;

        const updated = rows.map((r) => {
          let exp = Number(r.expectedAmount) || 0;
          let rec = Number(r.receivedAmount) || 0;
          let sent = Number(r.sentToTreasury) || 0;

          // بررسی کد ۶ رقمی طبقه‌بندی در تراز اسناد
          if (r.classificationCode && moeinBalancesMap[r.classificationCode] > 0) {
            exp = moeinBalancesMap[r.classificationCode];
          }

          if (r.classificationCode?.startsWith("11") || r.resourceTitle?.includes("عمومی")) {
            rec = m71001 > 0 ? m71001 : (rec > 0 ? rec : Math.round(mReceivedTotal / count));
            sent = m63001 > 0 ? m63001 : (sent > 0 ? sent : Math.round(mSentTotal / count));
            exp = exp > 0 ? exp : Math.round(m81008 / count);
          } else if (r.classificationCode?.startsWith("14") || r.resourceTitle?.includes("اختصاصی")) {
            rec = m81013 > 0 ? m81013 : (rec > 0 ? rec : Math.round(mReceivedTotal / count));
            sent = m81013 > 0 ? m81013 : (sent > 0 ? sent : Math.round(mSentTotal / count));
            exp = exp > 0 ? exp : Math.round(m81008 / count);
          } else if (r.classificationCode?.startsWith("31") || r.resourceTitle?.includes("سرمایه‌ای")) {
            rec = m63001 > 0 ? m63001 : (rec > 0 ? rec : Math.round(mReceivedTotal / count));
            sent = m63001 > 0 ? m63001 : (sent > 0 ? sent : Math.round(mSentTotal / count));
            exp = exp > 0 ? exp : Math.round(m81008 / count);
          } else {
            exp = exp > 0 ? exp : Math.round(m81008 / count);
            rec = rec > 0 ? rec : Math.round(mReceivedTotal / count);
            sent = sent > 0 ? sent : Math.round(mSentTotal / count);
          }

          return {
            ...r,
            expectedAmount: exp,
            receivedAmount: rec,
            sentToTreasury: sent,
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
    const updated = resourceRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر منبع جدید
  const handleAddRow = () => {
    const newId = `res_${Date.now()}`;
    const newRow = {
      id: newId,
      classificationCode: `16010${toPersianDigits(resourceRows.length + 1)}`,
      resourceTitle: "منبع جدید درآمدی / عمومی",
      sourceLocation: "ملی",
      expectedAmount: 0,
      receivedAmount: 0,
      sentToTreasury: 0,
    };
    updateRows([...resourceRows, newRow]);
  };

  // حذف سطر منبع
  const handleRemoveRow = (id) => {
    const filtered = resourceRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع منابع
  const calculatedTotals = useMemo(() => {
    return resourceRows.reduce(
      (acc, r) => {
        const expected = Number(r.expectedAmount) || 0;
        const received = Number(r.receivedAmount) || 0;
        const sent = Number(r.sentToTreasury) || 0;

        // محاسباتی: افزایش وجوه ارسالی نسبت به پیش‌بینی
        const incOverExp = sent > expected ? (sent - expected) : 0;
        // محاسباتی: کاهش وجوه ارسالی نسبت به پیش‌بینی
        const decUnderExp = expected > sent ? (expected - sent) : 0;

        acc.expectedAmount += expected;
        acc.receivedAmount += received;
        acc.sentToTreasury += sent;
        acc.increaseOverExpected += incOverExp;
        acc.decreaseUnderExpected += decUnderExp;

        return acc;
      },
      {
        expectedAmount: 0,
        receivedAmount: 0,
        sentToTreasury: 0,
        increaseOverExpected: 0,
        decreaseUnderExpected: 0,
      }
    );
  }, [resourceRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>منابع پیش‌بینی شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              کد ۸۱۰۰۸
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.expectedAmount)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>وصولی منابع</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              ۷۱۰۰۱ | ۸۱۰۱۳ | ۶۳۰۰۱
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.receivedAmount)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>وجوه ارسالی به خزانه</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              ۶۳۰۰۱ | ۸۱۰۱۳
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.sentToTreasury)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
            <span>افزایش ارسالی به خزانه</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">
              محاسباتی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-teal-800 dark:text-teal-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.increaseOverExpected)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-400">
            <span>کاهش ارسالی به خزانه</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">
              محاسباتی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-rose-800 dark:text-rose-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.decreaseUnderExpected)} <span className="text-[10px]">ریال</span>
          </div>
        </div>
      </div>

      {/* ─── نوار ابزار کنترلی و اکشن‌ها ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-bold px-2.5 py-1 gap-1">
            <Landmark className="h-3.5 w-3.5" />
            <span>تعداد منابع: {toPersianDigits(resourceRows.length)} سطر</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            صورت حساب دریافت‌ها و واریزی‌های منابع عمومی و اختصاصی خزانه (فرم ۸)
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
            <span>افزودن منبع جدید</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی و سطری صورت حساب منابع - فرم ۸ ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1300px]">
            {/* هدر گروهی و تک‌ستونی */}
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={4} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات طبقه‌بندی و عنوان منبع
                </th>
                <th colSpan={3} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  پیش‌بینی، وصولی و وجوه ارسالی به خزانه
                </th>
                <th colSpan={2} className="p-2 border-r border-border/60 bg-blue-500/5 text-blue-700 dark:text-blue-400">
                  تغییرات محاسباتی نسبت به پیش‌بینی
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: عناوین دقیق ۱۰ ستون درخواستی کاربر */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[140px]">
                  شماره طبقه‌بندی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(معمولاً ۶ رقمی)</span>
                </th>
                <th className="p-2 min-w-[220px]">عنوان منبع</th>
                <th className="p-2 min-w-[110px]">محل منبع (ملی / استانی)</th>

                <th className="p-2 min-w-[150px] bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800">
                  منابع پیش‌بینی شده <br/>
                  <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 rounded">۸۱۰۰۸</span>
                </th>
                <th className="p-2 min-w-[160px] bg-blue-50/40 dark:bg-blue-950/20 text-blue-800">
                  وصولی <br/>
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">۷۱۰۰۱ | ۸۱۰۱۳ | ۶۳۰۰۱</span>
                </th>
                <th className="p-2 min-w-[160px] bg-purple-50/40 dark:bg-purple-950/20 text-purple-800">
                  وجوه ارسالی به خزانه <br/>
                  <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۶۳۰۰۱ | ۸۱۰۱۳</span>
                </th>

                <th className="p-2 min-w-[160px] bg-teal-50/50 dark:bg-teal-950/20 text-teal-800">
                  افزایش وجوه ارسالی نسبت به پیش‌بینی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>
                <th className="p-2 min-w-[160px] bg-rose-50/50 dark:bg-rose-950/20 text-rose-800">
                  کاهش وجوه ارسالی نسبت به پیش‌بینی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {resourceRows.map((row, index) => {
                const expected = Number(row.expectedAmount) || 0;
                const sent = Number(row.sentToTreasury) || 0;
                
                // افزایش یا کاهش وجوه ارسالی نسبت به پیش‌بینی
                const incOverExp = sent > expected ? (sent - expected) : 0;
                const decUnderExp = expected > sent ? (expected - sent) : 0;

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

                    {/* شماره طبقه‌بندی (معمولاً ۶ رقمی) */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        dir="ltr"
                        maxLength={6}
                        value={row.classificationCode}
                        onChange={(e) => handleCellChange(row.id, "classificationCode", e.target.value)}
                        className="h-8 text-xs font-mono text-center bg-background/80"
                        placeholder="110101"
                      />
                    </td>

                    {/* عنوان منبع */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.resourceTitle}
                        onChange={(e) => handleCellChange(row.id, "resourceTitle", e.target.value)}
                        className="h-8 text-xs font-medium bg-background/80"
                        placeholder="عنوان منبع درآمدی..."
                      />
                    </td>

                    {/* محل منبع (ملی / استانی) */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.sourceLocation}
                        onChange={(e) => handleCellChange(row.id, "sourceLocation", e.target.value)}
                        className="h-8 w-full px-2 text-xs font-bold rounded-md border border-input bg-background cursor-pointer focus:ring-1 focus:ring-primary"
                      >
                        <option value="ملی">ملی</option>
                        <option value="استانی">استانی</option>
                      </select>
                    </td>

                    {/* منابع پیش‌بینی شده (کد معین ۸۱۰۰۸) */}
                    <td className="p-1.5 bg-emerald-50/20 dark:bg-emerald-950/10">
                      <PersianAmountInput
                        value={row.expectedAmount}
                        onChange={(val) => handleCellChange(row.id, "expectedAmount", val)}
                        textColor="text-emerald-800"
                      />
                    </td>

                    {/* وصولی (کدهای ۷۱۰۰۱ ، ۸۱۰۱۳ ، ۶۳۰۰۱) */}
                    <td className="p-1.5 bg-blue-50/20 dark:bg-blue-950/10">
                      <PersianAmountInput
                        value={row.receivedAmount}
                        onChange={(val) => handleCellChange(row.id, "receivedAmount", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* وجوه ارسالی به خزانه (کدهای ۶۳۰۰۱ ، ۸۱۰۱۳) */}
                    <td className="p-1.5 bg-purple-50/20 dark:bg-purple-950/10">
                      <PersianAmountInput
                        value={row.sentToTreasury}
                        onChange={(val) => handleCellChange(row.id, "sentToTreasury", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* افزایش وجوه ارسالی نسبت به پیش‌بینی (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300">
                      {formatPersianAmount(incOverExp)}
                    </td>

                    {/* کاهش وجوه ارسالی نسبت به پیش‌بینی (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                      {formatPersianAmount(decUnderExp)}
                    </td>

                    {/* دکمه حذف */}
                    <td className="p-1.5 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRow(row.id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="حذف این سطر منبع"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {resourceRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={4} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل صورت حساب منابع ({toPersianDigits(resourceRows.length)} منبع):</span>
                    </div>
                  </td>

                  {/* مجموع منابع پیش‌بینی شده (۸۱۰۰۸) */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/10">
                    {formatPersianAmount(calculatedTotals.expectedAmount)}
                  </td>

                  {/* مجموع وصولی (۷۱۰۰۱ ، ۸۱۰۱۳ ، ۶۳۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-500/10">
                    {formatPersianAmount(calculatedTotals.receivedAmount)}
                  </td>

                  {/* مجموع وجوه ارسالی به خزانه (۶۳۰۰۱ ، ۸۱۰۱۳) */}
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-500/10">
                    {formatPersianAmount(calculatedTotals.sentToTreasury)}
                  </td>

                  {/* مجموع افزایش وجوه ارسالی (محاسباتی) */}
                  <td className="p-2.5 text-center font-mono font-bold text-teal-900 dark:text-teal-200 bg-teal-500/20">
                    {formatPersianAmount(calculatedTotals.increaseOverExpected)}
                  </td>

                  {/* مجموع کاهش وجوه ارسالی (محاسباتی) */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-900 dark:text-rose-200 bg-rose-500/20">
                    {formatPersianAmount(calculatedTotals.decreaseUnderExpected)}
                  </td>

                  <td className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۸ ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در صورت حساب منابع (فرم ۸):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>شماره طبقه‌بندی</b> منبع درآمدی بر اساس کدگذاری استاندارد ۶ رقمی قانون بودجه تعریف می‌گردد.</li>
            <li><b>منابع پیش‌بینی شده</b> متصل به کد معین <b>۸۱۰۰۸</b> (پیش‌بینی درآمدها) می‌باشد.</li>
            <li><b>وصولی منابع</b> متصل به کدهای معین <b>۷۱۰۰۱، ۸۱۰۱۳ و ۶۳۰۰۱</b> می‌باشد.</li>
            <li><b>وجوه ارسالی به خزانه</b> متصل به کدهای معین <b>۶۳۰۰۱ و ۸۱۰۱۳</b> (واریزی‌های مستقیم و غیرمستقیم به خزانه) می‌باشد.</li>
            <li>ستون‌های <b>افزایش و کاهش وجوه ارسالی نسبت به پیش‌بینی</b> به‌صورت خودکار و محاسباتی حاصل تفاضل ارسالی به خزانه و پیش‌بینی برآورد می‌گردند.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
