import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, Layers, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, ShieldCheck, Scale, Landmark, FileText, BarChart3
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";
import { COMMON_NOTIFIER_BUDGET_ROWS } from "./SanamaForm1ProgramExpense";

// فصول ۷‌گانه استاندارد بودجه هزینه‌ای
export const INITIAL_CHAPTER_ROWS = [
  { id: "chap_1", chapterTitle: "فصل اول: جبران خدمات کارمندان (حقوق و مزایا)", chapterCode: "1", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
  { id: "chap_2", chapterTitle: "فصل دوم: استفاده از کالاها و خدمات", chapterCode: "2", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
  { id: "chap_3", chapterTitle: "فصل سوم: هزینه‌های اموال و دارایی", chapterCode: "3", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
  { id: "chap_4", chapterTitle: "فصل چهارم: یارانه‌ها", chapterCode: "4", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
  { id: "chap_5", chapterTitle: "فصل پنجم: کمک‌های بلاعوض", chapterCode: "5", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
  { id: "chap_6", chapterTitle: "فصل ششم: رفاه اجتماعی", chapterCode: "6", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
  { id: "chap_7", chapterTitle: "فصل هفتم: سایر هزینه‌ها", chapterCode: "7", creditType: "مصوب", notifier: "-", initialBudget: 0, increase: 0, decrease: 0, legalDocs: "-", allocatedCredit: 0, receivedCredit: 0, consumedCredit: 0, transferredCash: 0, inventories: 0, materialsInventory: 0, prepayment: 0, deficit: 0, protestedDocs: 0 },
];

export default function SanamaForm2ChapterExpense({
  rows = INITIAL_CHAPTER_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [chapterRows, setChapterRows] = useState(rows && rows.length > 0 ? rows : INITIAL_CHAPTER_ROWS);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setChapterRows(newRows);
    if (onChange) onChange(newRows);
  };

  // تغییر نوع اعتبار و اعمال الزامات تفصیلی کد معین ۹۱۰۰۱ (فیلد ابلاغ‌دهنده)
  const handleCreditTypeChange = (id, newType) => {
    const updated = chapterRows.map((r) => {
      if (r.id === id) {
        if (newType === "مصوب") {
          return { ...r, creditType: "مصوب", notifier: "-" };
        } else {
          const currentNotif = (r.notifier && r.notifier !== "-") ? r.notifier : "109000 - سازمان برنامه و بودجه کشور";
          return { ...r, creditType: "ابلاغی", notifier: currentNotif };
        }
      }
      return r;
    });
    updateRows(updated);
  };

  // فراخوانی اتوماتیک اطلاعات کدهای معین تراز اسناد و قرار دادن در فرم
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    const m91001 = moeinBalancesMap["91001"] || 0;
    // کدهای تخصیص فرم ۲: ۹۳۰۰۱، ۹۲۵۰۱، ۹۳۵۰۱
    const mAllocated = (moeinBalancesMap["93001"] || 0) + (moeinBalancesMap["92501"] || 0) + (moeinBalancesMap["93501"] || 0);
    // کدهای دریافت فرم ۲: ۴۱۰۰۱، ۴۱۰۰۳، ۴۱۰۰۵، ۸۱۰۱۷، ۸۱۰۱۰
    const mReceived = (moeinBalancesMap["41001"] || 0) + (moeinBalancesMap["41003"] || 0) + (moeinBalancesMap["41005"] || 0) + (moeinBalancesMap["81017"] || 0) + (moeinBalancesMap["81010"] || 0);
    // کد مصرف فرم ۲: ۹۹۰۰۱
    const m99001 = moeinBalancesMap["99001"] || 0;
    // موجودی، موجودی مواد و پیش پرداخت: ۹۸۰۰۱
    const m98001 = moeinBalancesMap["98001"] || 0;
    // کسری ابواب جمعی فرم ۲: ۹۲۵۰۱
    const mDeficit92501 = moeinBalancesMap["92501"] || 0;
    // اسناد واخواهی شده فرم ۲: ۸۱۰۰۷، ۹۳۵۰۱
    const mProtested = (moeinBalancesMap["81007"] || 0) + (moeinBalancesMap["93501"] || 0);

    if (chapterRows.length > 0 && (m91001 > 0 || mAllocated > 0 || mReceived > 0 || m99001 > 0)) {
      const updated = chapterRows.map((r) => {
        const ratio = 1 / chapterRows.length;
        return {
          ...r,
          initialBudget: r.initialBudget > 0 ? r.initialBudget : Math.round(m91001 * ratio),
          allocatedCredit: mAllocated > 0 ? Math.round(mAllocated * ratio) : r.allocatedCredit,
          receivedCredit: mReceived > 0 ? Math.round(mReceived * ratio) : r.receivedCredit,
          consumedCredit: m99001 > 0 ? Math.round(m99001 * ratio) : r.consumedCredit,
          inventories: m98001 > 0 ? Math.round((m98001 / 3) * ratio) : r.inventories,
          materialsInventory: m98001 > 0 ? Math.round((m98001 / 3) * ratio) : r.materialsInventory,
          prepayment: m98001 > 0 ? Math.round((m98001 / 3) * ratio) : r.prepayment,
          deficit: mDeficit92501 > 0 ? Math.round(mDeficit92501 * ratio) : r.deficit,
          protestedDocs: mProtested > 0 ? Math.round(mProtested * ratio) : r.protestedDocs,
        };
      });

      const hasChanged = JSON.stringify(updated) !== JSON.stringify(chapterRows);
      if (hasChanged) {
        updateRows(updated);
      }
    }
  }, [moeinBalancesMap]);

  // تغییر فیلد یک ردیف مشخص
  const handleCellChange = (id, field, value) => {
    const updated = chapterRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر فصل جدید
  const handleAddRow = () => {
    const newId = `chap_${Date.now()}`;
    const newRow = {
      id: newId,
      chapterTitle: `فصل سفارشی ${toPersianDigits(chapterRows.length + 1)}`,
      chapterCode: String(chapterRows.length + 1),
      creditType: "مصوب",
      notifier: "-",
      initialBudget: 0,
      increase: 0,
      decrease: 0,
      legalDocs: "-",
      allocatedCredit: 0,
      receivedCredit: 0,
      consumedCredit: 0,
      transferredCash: 0,
      inventories: 0,
      materialsInventory: 0,
      prepayment: 0,
      deficit: 0,
      protestedDocs: 0,
    };
    updateRows([...chapterRows, newRow]);
  };

  // حذف سطر فصل
  const handleRemoveRow = (id) => {
    const filtered = chapterRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی خودکار دستی از دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع فصول
  const calculatedTotals = useMemo(() => {
    return chapterRows.reduce(
      (acc, r) => {
        const initial = Number(r.initialBudget) || 0;
        const inc = Number(r.increase) || 0;
        const dec = Number(r.decrease) || 0;
        const net = inc - dec;
        const final = initial + net;

        const alloc = Number(r.allocatedCredit) || 0;
        const rec = Number(r.receivedCredit) || 0;
        const cons = Number(r.consumedCredit) || 0;
        const transCash = Number(r.transferredCash) || 0;
        const transBonds = rec - cons; // اوراق انتقالی محاسباتی: دریافت - مصرف

        const inv = Number(r.inventories) || 0;
        const matInv = Number(r.materialsInventory) || 0;
        const prep = Number(r.prepayment) || 0;
        const def = Number(r.deficit) || 0;
        const prot = Number(r.protestedDocs) || 0;

        acc.initialBudget += initial;
        acc.increase += inc;
        acc.decrease += dec;
        acc.netChange += net;
        acc.finalBudget += final;
        acc.allocatedCredit += alloc;
        acc.receivedCredit += rec;
        acc.consumedCredit += cons;
        acc.transferredCash += transCash;
        acc.transferredBonds += transBonds;
        acc.inventories += inv;
        acc.materialsInventory += matInv;
        acc.prepayment += prep;
        acc.deficit += def;
        acc.protestedDocs += prot;

        return acc;
      },
      {
        initialBudget: 0,
        increase: 0,
        decrease: 0,
        netChange: 0,
        finalBudget: 0,
        allocatedCredit: 0,
        receivedCredit: 0,
        consumedCredit: 0,
        transferredCash: 0,
        transferredBonds: 0,
        inventories: 0,
        materialsInventory: 0,
        prepayment: 0,
        deficit: 0,
        protestedDocs: 0,
      }
    );
  }, [chapterRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>اعتبار مصوب نهایی فصول</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              کد ۹۱۰۰۱
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.finalBudget)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>اعتبار تخصیص یافته</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              ۹۳۰۰۱ | ۹۲۵۰۱ | ۹۳۵۰۱
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.allocatedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>اعتبار دریافت شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              ۴۱۰۰۱ | ۴۱۰۰۳ | ۴۱۰۰۵
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.receivedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>اعتبار مصرف شده فصول</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
              کد ۹۹۰۰۱
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-amber-800 dark:text-amber-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.consumedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-700 dark:text-cyan-400">
            <span>اوراق انتقالی (محاسباتی)</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">
              دریافتی - مصرف
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-cyan-800 dark:text-cyan-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.transferredBonds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>
      </div>

      {/* ─── نوار ابزار کنترلی و اکشن‌ها ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-bold px-2.5 py-1 gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>تعداد فصول: {toPersianDigits(chapterRows.length)} سطر</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            فرمت سطری تفکیک عملکرد اعتبارات بر حسب ۷ فصل هزینه سناما
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
            <span>افزودن فصل جدید</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی و سطری عملکرد بر حسب فصل ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1800px]">
            {/* هدر گروهی و تک‌ستونی */}
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={4} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات پایه فصل اعتبارات
                </th>
                <th colSpan={5} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  بودجه اعتبار و تغییرات قانونی
                </th>
                <th colSpan={2} className="p-2 border-r border-border/60 bg-blue-500/5 text-blue-700 dark:text-blue-400">
                  اعتبار نهایی و تخصیص
                </th>
                <th colSpan={2} className="p-2 border-r border-border/60 bg-purple-500/5 text-purple-700 dark:text-purple-400">
                  اعتبار دریافت و مصرف شده
                </th>
                <th colSpan={2} className="p-2 border-r border-border/60 bg-cyan-500/5 text-cyan-700 dark:text-cyan-400">
                  وجوه و اوراق انتقالی
                </th>
                <th colSpan={5} className="p-2 border-r border-border/60 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  موجودی‌ها، پیش پرداخت و سایر حساب‌ها
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: عنوان دقیق ۲۱ ستون درخواستی کاربر */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[200px]">فصل اعتبارات</th>
                <th className="p-2 min-w-[80px]">نوع اعتبار</th>
                <th className="p-2 min-w-[130px]">ابلاغ دهنده</th>

                <th className="p-2 min-w-[120px] bg-emerald-50/40 dark:bg-emerald-950/20">بودجه اعتبار اولیه (دستی)</th>
                <th className="p-2 min-w-[100px] text-emerald-700">افزایش (دستی)</th>
                <th className="p-2 min-w-[100px] text-rose-700">کاهش (دستی)</th>
                <th className="p-2 min-w-[120px]">مستندات قانونی (دستی)</th>
                <th className="p-2 min-w-[120px] bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-800">
                  خالص افزایش و کاهش <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>

                <th className="p-2 min-w-[130px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-800">
                  بودجه اعتبار نهایی <br/>
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">۹۱۰۰۱</span>
                </th>
                <th className="p-2 min-w-[130px] bg-blue-50/30 dark:bg-blue-950/10">
                  اعتبار تخصیص یافته <br/>
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">۹۳۰۰۱ | ۹۲۵۰۱ | ۹۳۵۰۱</span>
                </th>

                <th className="p-2 min-w-[140px] bg-purple-50/50 dark:bg-purple-950/20 text-purple-800">
                  اعتبار دریافت شده <br/>
                  <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۴۱۰۰۱ | ۴۱۰۰۳ | ۴۱۰۰۵ | ۸۱۰۱۷ | ۸۱۰۱۰</span>
                </th>
                <th className="p-2 min-w-[130px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-800">
                  اعتبار مصرف شده <br/>
                  <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1 rounded">۹۹۰۰۱</span>
                </th>

                <th className="p-2 min-w-[120px]">
                  وجوه انتقالی (وجه نقد) <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>
                <th className="p-2 min-w-[130px] bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-800">
                  اوراق انتقالی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی: دریافتی - مصرف)</span>
                </th>

                <th className="p-2 min-w-[100px]">
                  موجودی‌ها <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۹۸۰۰۱</span>
                </th>
                <th className="p-2 min-w-[100px]">
                  موجودی مواد <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۹۸۰۰۱</span>
                </th>
                <th className="p-2 min-w-[110px]">
                  پیش پرداخت <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۹۸۰۰۱</span>
                </th>
                <th className="p-2 min-w-[110px]">
                  کسری ابواب جمعی <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۹۲۵۰۱</span>
                </th>
                <th className="p-2 min-w-[110px]">
                  اسناد واخواهی شده <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۸۱۰۰۷ | ۹۳۵۰۱</span>
                </th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {chapterRows.map((row, index) => {
                const netChange = (Number(row.increase) || 0) - (Number(row.decrease) || 0);
                const finalBudget = (Number(row.initialBudget) || 0) + netChange;
                const transferredBonds = (Number(row.receivedCredit) || 0) - (Number(row.consumedCredit) || 0);

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

                    {/* فصل اعتبارات */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.chapterTitle}
                        onChange={(e) => handleCellChange(row.id, "chapterTitle", e.target.value)}
                        className="h-8 text-xs font-medium bg-background/80"
                        placeholder="عنوان فصل..."
                      />
                    </td>

                    {/* نوع اعتبار */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.creditType}
                        onChange={(e) => handleCreditTypeChange(row.id, e.target.value)}
                        className={cn(
                          "h-8 w-full px-2 text-xs font-bold rounded-md border bg-background cursor-pointer focus:ring-1 focus:ring-primary",
                          row.creditType === "ابلاغی" ? "border-amber-500 text-amber-700 bg-amber-50/20" : "border-input text-foreground"
                        )}
                      >
                        <option value="مصوب">مصوب</option>
                        <option value="ابلاغی">ابلاغی</option>
                      </select>
                    </td>

                    {/* ابلاغ دهنده (ردیف ابلاغی دستگاه - الزامات تفصیلی معین ۹۱۰۰۱) */}
                    <td className="p-1.5">
                      {row.creditType === "ابلاغی" ? (
                        <div className="space-y-1">
                          <Input
                            type="text"
                            list={`notifiers_chap_${row.id}`}
                            value={row.notifier && row.notifier !== "-" ? row.notifier : ""}
                            onChange={(e) => handleCellChange(row.id, "notifier", e.target.value)}
                            className={cn(
                              "h-8 text-xs font-medium bg-background border-amber-500/80 focus:ring-amber-500",
                              (!row.notifier || row.notifier === "-" || row.notifier.trim() === "") && "border-rose-500 bg-rose-50/20"
                            )}
                            placeholder="ردیف ابلاغی دستگاه (مثلاً 109000)..."
                          />
                          <datalist id={`notifiers_chap_${row.id}`}>
                            {COMMON_NOTIFIER_BUDGET_ROWS.map((n) => (
                              <option key={n.code} value={n.title} />
                            ))}
                          </datalist>
                          {(!row.notifier || row.notifier === "-" || row.notifier.trim() === "") && (
                            <div className="text-[9px] text-rose-600 font-bold leading-tight">
                              ⚠️ ورود ردیف ابلاغی الزامی است
                            </div>
                          )}
                        </div>
                      ) : (
                        <Input
                          type="text"
                          disabled
                          value="-"
                          className="h-8 text-xs text-center text-muted-foreground bg-muted/40 cursor-not-allowed"
                          title="در اعتبارات مصوب، فیلد ابلاغ‌دهنده فاقد موضوعیت می‌باشد."
                        />
                      )}
                    </td>

                    {/* بودجه اعتبار اولیه (دستی) */}
                    <td className="p-1.5 bg-emerald-50/20 dark:bg-emerald-950/10">
                      <PersianAmountInput
                        value={row.initialBudget}
                        onChange={(val) => handleCellChange(row.id, "initialBudget", val)}
                      />
                    </td>

                    {/* افزایش (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.increase}
                        onChange={(val) => handleCellChange(row.id, "increase", val)}
                        textColor="text-emerald-700"
                      />
                    </td>

                    {/* کاهش (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.decrease}
                        onChange={(val) => handleCellChange(row.id, "decrease", val)}
                        textColor="text-rose-700"
                      />
                    </td>

                    {/* مستندات قانونی (دستی) */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.legalDocs}
                        onChange={(e) => handleCellChange(row.id, "legalDocs", e.target.value)}
                        className="h-8 text-xs bg-background/80"
                        placeholder="مستند قانونی..."
                      />
                    </td>

                    {/* خالص افزایش و کاهش (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      {formatPersianAmount(netChange)}
                    </td>

                    {/* بودجه اعتبار نهایی (۹۱۰۰۱) */}
                    <td className="p-1.5 bg-blue-50/30 dark:bg-blue-950/10">
                      <PersianAmountInput
                        value={finalBudget}
                        onChange={(val) => handleCellChange(row.id, "initialBudget", val - netChange)}
                        textColor="text-blue-700"
                      />
                    </td>

                    {/* اعتبار تخصیص یافته (۹۳۰۰۱ ، ۹۲۵۰۱ ، ۹۳۵۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.allocatedCredit}
                        onChange={(val) => handleCellChange(row.id, "allocatedCredit", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* اعتبار دریافت شده (۴۱۰۰۱ ، ۴۱۰۰۳ ، ۴۱۰۰۵ ، ۸۱۰۱۷ ، ۸۱۰۱۰) */}
                    <td className="p-1.5 bg-purple-50/20 dark:bg-purple-950/10">
                      <PersianAmountInput
                        value={row.receivedCredit}
                        onChange={(val) => handleCellChange(row.id, "receivedCredit", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* اعتبار مصرف شده (۹۹۰۰۱) */}
                    <td className="p-1.5 bg-amber-50/20 dark:bg-amber-950/10">
                      <PersianAmountInput
                        value={row.consumedCredit}
                        onChange={(val) => handleCellChange(row.id, "consumedCredit", val)}
                        textColor="text-amber-800"
                      />
                    </td>

                    {/* وجوه انتقالی (وجه نقد - محاسباتی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredCash}
                        onChange={(val) => handleCellChange(row.id, "transferredCash", val)}
                      />
                    </td>

                    {/* اوراق انتقالی (محاسباتی: دریافت - مصرف) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300">
                      {formatPersianAmount(transferredBonds)}
                    </td>

                    {/* موجودی‌ها (۹۸۰۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.inventories}
                        onChange={(val) => handleCellChange(row.id, "inventories", val)}
                      />
                    </td>

                    {/* موجودی مواد (۹۸۰۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.materialsInventory}
                        onChange={(val) => handleCellChange(row.id, "materialsInventory", val)}
                      />
                    </td>

                    {/* پیش پرداخت (۹۸۰۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.prepayment}
                        onChange={(val) => handleCellChange(row.id, "prepayment", val)}
                      />
                    </td>

                    {/* کسری ابواب جمعی (۹۲۵۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.deficit}
                        onChange={(val) => handleCellChange(row.id, "deficit", val)}
                        textColor="text-rose-700"
                      />
                    </td>

                    {/* اسناد واخواهی شده (۸۱۰۰۷ ، ۹۳۵۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.protestedDocs}
                        onChange={(val) => handleCellChange(row.id, "protestedDocs", val)}
                        textColor="text-amber-700"
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
                        title="حذف این سطر فصل"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {chapterRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={4} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل عملکرد اعتبارات بر حسب فصل ({toPersianDigits(chapterRows.length)} فصل):</span>
                    </div>
                  </td>

                  {/* مجموع بودجه اعتبار اولیه */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/10">
                    {formatPersianAmount(calculatedTotals.initialBudget)}
                  </td>

                  {/* مجموع افزایش */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formatPersianAmount(calculatedTotals.increase)}
                  </td>

                  {/* مجموع کاهش */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                    {formatPersianAmount(calculatedTotals.decrease)}
                  </td>

                  {/* مستندات */}
                  <td className="p-2 text-center text-muted-foreground text-[10px]">-</td>

                  {/* مجموع خالص تغییرات */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/20">
                    {formatPersianAmount(calculatedTotals.netChange)}
                  </td>

                  {/* مجموع بودجه اعتبار نهایی (۹۱۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-500/20">
                    {formatPersianAmount(calculatedTotals.finalBudget)}
                  </td>

                  {/* مجموع اعتبار تخصیص یافته */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-800 dark:text-blue-300 bg-blue-500/10">
                    {formatPersianAmount(calculatedTotals.allocatedCredit)}
                  </td>

                  {/* مجموع اعتبار دریافت شده */}
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-500/20">
                    {formatPersianAmount(calculatedTotals.receivedCredit)}
                  </td>

                  {/* مجموع اعتبار مصرف شده (۹۹۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-500/20">
                    {formatPersianAmount(calculatedTotals.consumedCredit)}
                  </td>

                  {/* مجموع وجوه انتقالی */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.transferredCash)}
                  </td>

                  {/* مجموع اوراق انتقالی (محاسباتی) */}
                  <td className="p-2.5 text-center font-mono font-bold text-cyan-900 dark:text-cyan-200 bg-cyan-500/20">
                    {formatPersianAmount(calculatedTotals.transferredBonds)}
                  </td>

                  {/* مجموع موجودی‌ها (۹۸۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.inventories)}
                  </td>

                  {/* مجموع موجودی مواد (۹۸۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.materialsInventory)}
                  </td>

                  {/* مجموع پیش پرداخت (۹۸۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.prepayment)}
                  </td>

                  {/* مجموع کسری ابواب جمعی (۹۲۵۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                    {formatPersianAmount(calculatedTotals.deficit)}
                  </td>

                  {/* مجموع اسناد واخواهی (۸۱۰۰۷ ، ۹۳۵۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                    {formatPersianAmount(calculatedTotals.protestedDocs)}
                  </td>

                  <td className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۲ ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در فرم خلاصه عملکرد بر حسب فصل (فرم ۲):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li>فیلدهای بودجه اولیه، افزایش، کاهش، مستندات قانونی و وجوه انتقالی به‌صورت <b>دستی / محاسباتی</b> تکمیل می‌گردند.</li>
            <li>در اعتبارات ابلاغی برای کد معین <b>۹۱۰۰۱</b>، تعیین و انتخاب <b>ردیف ابلاغی دستگاه (ابلاغ‌دهنده)</b> الزامی می‌باشد.</li>
            <li>اعتبارات تخصیص یافته متصل به کدهای معین <b>۹۳۰۰۱، ۹۲۵۰۱ و ۹۳۵۰۱</b>، اعتبارات دریافت شده متصل به <b>۴۱۰۰۱، ۴۱۰۰۳، ۴۱۰۰۵، ۸۱۰۱۷ و ۸۱۰۱۰</b> و اعتبارات مصرف شده متصل به <b>۹۹۰۰۱</b> می‌باشند.</li>
            <li>حساب‌های <b>موجودی‌ها، موجودی مواد و پیش‌پرداخت</b> متصل به کد معین <b>۹۸۰۰۱</b>، حساب <b>کسری ابواب‌جمعی</b> متصل به کد <b>۹۲۵۰۱</b> و <b>اسناد واخواهی شده</b> متصل به کدهای <b>۸۱۰۰۷ و ۹۳۵۰۱</b> می‌باشند.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
