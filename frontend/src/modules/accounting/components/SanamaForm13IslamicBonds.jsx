import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, CreditCard, Calculator, 
  Info
} from "lucide-react";
import api from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const INITIAL_FORM_13_ROWS = [
  {
    id: "bnd_1",
    creditType: "عمومی",
    bondTitle: "اسناد خزانه اسلامی (اخزا)",
    bondSymbol: "اخزا - سال جاری",
    issueDate: "1404/01/01",
    receivedBonds: 0, // کدهای ۴۱۰۰۳ ، ۸۱۰۱۰ ، ۸۱۰۱۷
    assignedBonds: 0, // کدهای ۹۹۰۰۲ ، ۹۸۰۰۲ ، ۹۲۵۰۲ ، ۹۳۵۰۲
    transferredBonds: 0, // کد ۸۱۰۱۰
    remarks: "",
  },
  {
    id: "bnd_2",
    creditType: "عمومی",
    bondTitle: "اوراق مرابحه و صکوک اسلامی",
    bondSymbol: "مرابحه - عمومی",
    issueDate: "1404/02/15",
    receivedBonds: 0, // کدهای ۴۱۰۰۳ ، ۸۱۰۱۰ ، ۸۱۰۱۷
    assignedBonds: 0, // کدهای ۹۹۰۰۲ ، ۹۸۰۰۲ ، ۹۲۵۰۲ ، ۹۳۵۰۲
    transferredBonds: 0, // کد ۸۱۰۱۰
    remarks: "",
  },
  {
    id: "bnd_3",
    creditType: "تملک سرمایه‌ای",
    bondTitle: "اوراق تسویه خزانه و منفعت طرح‌های عمرانی",
    bondSymbol: "تسویه - تملک",
    issueDate: "1404/03/01",
    receivedBonds: 0, // کدهای ۴۱۰۰۳ ، ۸۱۰۱۰ ، ۸۱۰۱۷
    assignedBonds: 0, // کدهای ۹۹۰۰۲ ، ۹۸۰۰۲ ، ۹۲۵۰۲ ، ۹۳۵۰۲
    transferredBonds: 0, // کد ۸۱۰۱۰
    remarks: "",
  },
];

export default function SanamaForm13IslamicBonds({
  rows = INITIAL_FORM_13_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [bondRows, setBondRows] = useState(rows && rows.length > 0 ? rows : INITIAL_FORM_13_ROWS);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setBondRows(newRows);
    if (onChange) onChange(newRows);
  };

  // فراخوانی اتوماتیک کدهای معین از تراز ۸ ستونی اسناد مالی (پشتیبانی از کدهای ۴۱۰۰۳، ۹۹۰۰۲، ۹۸۰۰۲، ۹۲۵۰۲، ۹۳۵۰۲، ۸۱۰۱۰، ۸۱۰۱۷)
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    // اوراق دریافتی: ۴۱۰۰۳ + ۸۱۰۱۰ + ۸۱۰۱۷ (و پشتیبانی از کدهای هزینه‌ای)
    const mRecBonds = (moeinBalancesMap["41003"] || moeinBalancesMap["41001"] || moeinBalancesMap["41006"] || 0) + (moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81017"] || 0);
    // اوراق واگذار شده: ۹۹۰۰۲ + ۹۸۰۰۲ + ۹۲۵۰۲ + ۹۳۵۰۲ (و پشتیبانی از کدهای هزینه‌ای)
    const mAssignedBonds = (moeinBalancesMap["99002"] || moeinBalancesMap["99001"] || 0) + (moeinBalancesMap["98002"] || moeinBalancesMap["98001"] || 0) + (moeinBalancesMap["92502"] || moeinBalancesMap["92501"] || 0) + (moeinBalancesMap["93502"] || moeinBalancesMap["93501"] || 0);
    // اوراق انتقالی: ۸۱۰۱۰
    const mTransferredBonds = (moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81019"] || 0);

    if (bondRows.length > 0 && (mRecBonds > 0 || mAssignedBonds > 0 || mTransferredBonds > 0)) {
      setBondRows((prevRows) => {
        const rows = (prevRows && prevRows.length > 0) ? prevRows : INITIAL_FORM_13_ROWS;
        const count = rows.length || 1;

        const updated = rows.map((r) => {
          return {
            ...r,
            receivedBonds: mRecBonds > 0 ? Math.round(mRecBonds / count) : r.receivedBonds,
            assignedBonds: mAssignedBonds > 0 ? Math.round(mAssignedBonds / count) : r.assignedBonds,
            transferredBonds: mTransferredBonds > 0 ? Math.round(mTransferredBonds / count) : r.transferredBonds,
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
    const updated = bondRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر اوراق اسلامی جدید
  const handleAddRow = () => {
    const newId = `bnd_${Date.now()}`;
    const newRow = {
      id: newId,
      creditType: "عمومی",
      bondTitle: "اوراق مالی اسلامی جدید",
      bondSymbol: "اوراق - جدید",
      issueDate: `${fiscalYear}/01/01`,
      receivedBonds: 0,
      assignedBonds: 0,
      transferredBonds: 0,
      remarks: "",
    };
    updateRows([...bondRows, newRow]);
  };

  // حذف سطر
  const handleRemoveRow = (id) => {
    const filtered = bondRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع اوراق اسلامی و محاسباتی‌ها
  const calculatedTotals = useMemo(() => {
    return bondRows.reduce(
      (acc, r) => {
        const rec = Number(r.receivedBonds) || 0;
        const ass = Number(r.assignedBonds) || 0;
        const trans = Number(r.transferredBonds) || 0;

        // اوراق مصرف نشده (محاسباتی) = دریافتی + انتقالی - واگذار شده
        const unconsumed = Math.max(0, (rec + trans) - ass);

        acc.receivedBonds += rec;
        acc.assignedBonds += ass;
        acc.transferredBonds += trans;
        acc.unconsumedBonds += unconsumed;

        return acc;
      },
      {
        receivedBonds: 0,
        assignedBonds: 0,
        transferredBonds: 0,
        unconsumedBonds: 0,
      }
    );
  }, [bondRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>اوراق دریافتی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              ۴۱۰۰۳ | ۸۱۰۱۰ | ۸۱۰۱۷
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.receivedBonds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>اوراق واگذار شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
              ۹۹۰۰۲ | ۹۸۰۰۲ | ۹۲۵۰۲ | ۹۳۵۰۲
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-amber-800 dark:text-amber-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.assignedBonds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>اوراق انتقالی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              کد ۸۱۰۱۰
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.transferredBonds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>اوراق مصرف نشده (محاسباتی)</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              محاسباتی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.unconsumedBonds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>
      </div>

      {/* ─── نوار ابزار کنترلی ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-bold px-2.5 py-1 gap-1">
            <CreditCard className="h-3.5 w-3.5" />
            <span>تعداد سطرها: {toPersianDigits(bondRows.length)} مورد</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            صورت عملکرد اوراق مالی اسلامی و اسناد خزانه (فرم ۱۳ سناما)
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
            <span>افزودن سطر اوراق</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی عملکرد اوراق اسلامی - فرم ۱۳ ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1350px]">
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={5} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات نوع اعتبار، عنوان و نماد اوراق اسلامی
                </th>
                <th colSpan={4} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  گردش مبالغ دریافتی، واگذار شده، مانده انتقالی و مصرف نشده
                </th>
                <th colSpan={2} className="p-2 bg-muted/90 text-center">
                  توضیحات و عملیات
                </th>
              </tr>

              {/* سطر ۲: عناوین دقیق ستون‌های فرم ۱۳ */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[100px]">نوع اعتبار</th>
                <th className="p-2 min-w-[200px]">نوع / عنوان اوراق اسلامی</th>
                <th className="p-2 min-w-[130px]">نماد / شناسه</th>
                <th className="p-2 min-w-[110px]">تاریخ واگذاری</th>

                <th className="p-2 min-w-[160px] bg-blue-50/40 dark:bg-blue-950/20 text-blue-800">
                  اوراق دریافتی <br/>
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">۴۱۰۰۳ | ۸۱۰۱۰ | ۸۱۰۱۷</span>
                </th>
                <th className="p-2 min-w-[160px] bg-amber-50/40 dark:bg-amber-950/20 text-amber-800">
                  اوراق واگذار شده <br/>
                  <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1 rounded">۹۹۰۰۲ | ۹۸۰۰۲ | ۹۲۵۰۲ | ۹۳۵۰۲</span>
                </th>
                <th className="p-2 min-w-[160px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800">
                  اوراق مصرف نشده <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>
                <th className="p-2 min-w-[150px] bg-purple-50/40 dark:bg-purple-950/20 text-purple-800">
                  اوراق انتقالی <br/>
                  <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۸۱۰۱۰</span>
                </th>

                <th className="p-2 min-w-[140px]">توضیحات</th>
                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {bondRows.map((row, index) => {
                const rec = Number(row.receivedBonds) || 0;
                const ass = Number(row.assignedBonds) || 0;
                const trans = Number(row.transferredBonds) || 0;

                // اوراق مصرف نشده (محاسباتی) = دریافتی + انتقالی - واگذار شده
                const unconsumed = Math.max(0, (rec + trans) - ass);

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

                    {/* نوع / عنوان اوراق اسلامی */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.bondTitle}
                        onChange={(e) => handleCellChange(row.id, "bondTitle", e.target.value)}
                        className="h-8 text-xs font-bold bg-background/80"
                        placeholder="اسناد خزانه / اوراق مرابحه..."
                      />
                    </td>

                    {/* نماد / شناسه */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.bondSymbol}
                        onChange={(e) => handleCellChange(row.id, "bondSymbol", e.target.value)}
                        className="h-8 text-xs text-center font-mono bg-background/80"
                        placeholder="اخزا - 1404"
                      />
                    </td>

                    {/* تاریخ واگذاری */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        dir="ltr"
                        value={row.issueDate}
                        onChange={(e) => handleCellChange(row.id, "issueDate", e.target.value)}
                        className="h-8 text-xs text-center font-mono bg-background/80"
                        placeholder="1404/01/01"
                      />
                    </td>

                    {/* اوراق دریافتی (۴۱۰۰۳ ، ۸۱۰۱۰ ، ۸۱۰۱۷) */}
                    <td className="p-1.5 bg-blue-50/20 dark:bg-blue-950/10">
                      <PersianAmountInput
                        value={row.receivedBonds}
                        onChange={(val) => handleCellChange(row.id, "receivedBonds", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* اوراق واگذار شده (۹۹۰۰۲ ، ۹۸۰۰۲ ، ۹۲۵۰۲ ، ۹۳۵۰۲) */}
                    <td className="p-1.5 bg-amber-50/20 dark:bg-amber-950/10">
                      <PersianAmountInput
                        value={row.assignedBonds}
                        onChange={(val) => handleCellChange(row.id, "assignedBonds", val)}
                        textColor="text-amber-800"
                      />
                    </td>

                    {/* اوراق مصرف نشده (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      {formatPersianAmount(unconsumed)}
                    </td>

                    {/* اوراق انتقالی (۸۱۰۱۰) */}
                    <td className="p-1.5 bg-purple-50/20 dark:bg-purple-950/10">
                      <PersianAmountInput
                        value={row.transferredBonds}
                        onChange={(val) => handleCellChange(row.id, "transferredBonds", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* توضیحات */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.remarks || ""}
                        onChange={(e) => handleCellChange(row.id, "remarks", e.target.value)}
                        className="h-8 text-xs bg-background/80"
                        placeholder="توضیحات سررسید..."
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
                        title="حذف این سطر اوراق"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {bondRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={5} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل عملکرد اوراق اسلامی ({toPersianDigits(bondRows.length)} سطر):</span>
                    </div>
                  </td>

                  {/* مجموع اوراق دریافتی */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-500/20">
                    {formatPersianAmount(calculatedTotals.receivedBonds)}
                  </td>

                  {/* مجموع اوراق واگذار شده */}
                  <td className="p-2.5 text-center font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-500/20">
                    {formatPersianAmount(calculatedTotals.assignedBonds)}
                  </td>

                  {/* مجموع اوراق مصرف نشده (محاسباتی) */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20">
                    {formatPersianAmount(calculatedTotals.unconsumedBonds)}
                  </td>

                  {/* مجموع اوراق انتقالی (۸۱۰۱۰) */}
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-500/20">
                    {formatPersianAmount(calculatedTotals.transferredBonds)}
                  </td>

                  <td colSpan={2} className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۱۳ ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در عملکرد اوراق اسلامی (فرم ۱۳):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>اوراق دریافتی</b> متصل به کدهای معین <b>۴۱۰۰۳، ۸۱۰۱۰ و ۸۱۰۱۷</b> می‌باشد.</li>
            <li><b>اوراق واگذار شده</b> متصل به کدهای معین <b>۹۹۰۰۲، ۹۸۰۰۲، ۹۲۵۰۲ و ۹۳۵۰۲</b> می‌باشد.</li>
            <li><b>اوراق انتقالی</b> متصل به کد معین <b>۸۱۰۱۰</b> می‌باشد.</li>
            <li>ستون <b>اوراق مصرف نشده</b> حاصل فرمول محاسباتی `(دریافتی + انتقالی) - واگذار شده` می‌باشد.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
