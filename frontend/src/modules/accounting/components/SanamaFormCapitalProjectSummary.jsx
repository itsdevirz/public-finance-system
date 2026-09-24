import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, Layers, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, ShieldCheck, Scale, Landmark, FileSpreadsheet, Building2
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const INITIAL_PROJECT_SUMMARY_ROWS = [
  {
    id: "proj_1",
    projectTitle: "طرح احداث و بهسازی مجتمع اداری مرکزی",
    creditOrigin: "استانی",
    projectCode: "13020150014001", // کد 14 رقمی استانی
    chapterTitle: "فصل ۱: ساختمان و مستحدثات",
    creditType: "مصوب",
    notifyingBody: "سازمان مدیریت و برنامه‌ریزی استان",
    initialBudget: 0,
    increase: 0,
    decrease: 0,
    legalDocs: "ماده ۵۸ قانون بودجه",
    finalBudget: 0, // کد معین ۹۱۰۰۲
    allocatedCredit: 0, // کدهای معین ۹۳۰۰۲ ، ۹۳۵۰۲ ، ۹۲۵۰۲
    receivedCredit: 0, // کدهای معین ۴۱۰۰۳ ، ۸۱۰۱۰ ، ۸۱۰۱۷ ، ۸۱۰۱۹
    consumedCredit: 0, // کد معین ۹۹۰۰۲
    inventories: 0, // کد معین ۹۸۰۰۲
    prepayments: 0, // کد معین ۹۸۰۰۲
    collectionDeficit: 0, // کدهای معین ۸۱۰۰۷ ، ۹۳۵۰۲
    objectedDocs: 0, // کد معین ۹۲۵۰۲
    remarks: "",
  },
  {
    id: "proj_2",
    projectTitle: "طرح تجهیز و توسعه سامانه و زیرساخت‌های فناوری اطلاعات",
    creditOrigin: "ملی",
    projectCode: "130201500120", // کد 12 رقمی ملی
    chapterTitle: "فصل ۲: ماشین آلات و تجهیزات",
    creditType: "ابلاغی",
    notifyingBody: "وزارت امور اقتصادی و دارایی",
    initialBudget: 0,
    increase: 0,
    decrease: 0,
    legalDocs: "ابلاغیه تخصیص ستاد مرکزی",
    finalBudget: 0,
    allocatedCredit: 0,
    receivedCredit: 0,
    consumedCredit: 0,
    inventories: 0,
    prepayments: 0,
    collectionDeficit: 0,
    objectedDocs: 0,
    remarks: "",
  }
];

export default function SanamaFormCapitalProjectSummary({
  rows = INITIAL_PROJECT_SUMMARY_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [projectRows, setProjectRows] = useState(rows && rows.length > 0 ? rows : INITIAL_PROJECT_SUMMARY_ROWS);

  // به‌روزرسانی ردیف‌ها و ارسال به کامپوننت والد
  const updateRows = (newRows) => {
    setProjectRows(newRows);
    if (onChange) onChange(newRows);
  };

  // فراخوانی اتوماتیک کدهای معین از تراز ۸ ستونی اسناد مالی
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    // بودجه اعتبار نهایی: ۹۱۰۰۲
    const mFinalBudget = moeinBalancesMap["91002"] || 0;
    // اعتبار تخصیص یافته: ۹۳۰۰۲ + ۹۳۵۰۲ + ۹۲۵۰۲
    const mAllocated = (moeinBalancesMap["93002"] || 0) + (moeinBalancesMap["93502"] || 0) + (moeinBalancesMap["92502"] || 0);
    // اعتبار دریافت شده: ۴۱۰۰۳ (اعتبار عمومی سرمایه‌ای) + ۴۱۰۰۶ (اعتبار اختصاصی سرمایه‌ای) + کدهای انتظامی سرمایه‌ای (۸۱۰۱۰ و ۸۱۰۱۷) + ۸۱۰۱۹
    const mReceived = (moeinBalancesMap["41003"] || 0) + (moeinBalancesMap["41006"] || 0) + (moeinBalancesMap["81010_capital"] || moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81017_capital"] || moeinBalancesMap["81017"] || 0) + (moeinBalancesMap["81019"] || 0);
    // اعتبار مصرف شده: ۹۹۰۰۲
    const mConsumed = moeinBalancesMap["99002"] || 0;
    // موجودی‌ها و پیش پرداخت‌ها: ۹۸۰۰۲
    const mInventories = moeinBalancesMap["98002"] || 0;
    const mPrepayments = moeinBalancesMap["98002"] || 0;
    // کسری ابواب جمعی: ۸۱۰۰۷ + ۹۳۵۰۲
    const mDeficit = (moeinBalancesMap["81007"] || 0) + (moeinBalancesMap["93502"] || 0);
    // اسناد واخواهی شده: ۹۲۵۰۲
    const mObjected = moeinBalancesMap["92502"] || 0;

    if (projectRows.length > 0 && (mFinalBudget > 0 || mAllocated > 0 || mReceived > 0 || mConsumed > 0)) {
      setProjectRows((prevRows) => {
        const currentRows = (prevRows && prevRows.length > 0) ? prevRows : INITIAL_PROJECT_SUMMARY_ROWS;
        const count = currentRows.length || 1;

        const updated = currentRows.map((r) => {
          const netAdj = (Number(r.increase) || 0) - (Number(r.decrease) || 0);
          const computedFinal = mFinalBudget > 0 ? Math.round(mFinalBudget / count) : ((Number(r.initialBudget) || 0) + netAdj);

          return {
            ...r,
            finalBudget: computedFinal,
            allocatedCredit: mAllocated > 0 ? Math.round(mAllocated / count) : r.allocatedCredit,
            receivedCredit: mReceived > 0 ? Math.round(mReceived / count) : r.receivedCredit,
            consumedCredit: mConsumed > 0 ? Math.round(mConsumed / count) : r.consumedCredit,
            inventories: mInventories > 0 ? Math.round(mInventories / count) : r.inventories,
            prepayments: mPrepayments > 0 ? Math.round(mPrepayments / count) : r.prepayments,
            collectionDeficit: mDeficit > 0 ? Math.round(mDeficit / count) : r.collectionDeficit,
            objectedDocs: mObjected > 0 ? Math.round(mObjected / count) : r.objectedDocs,
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

  // تغییر مقادیر سلول‌های جدول
  const handleCellChange = (id, field, value) => {
    const updated = projectRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر طرح جدید
  const handleAddRow = () => {
    const newId = `proj_${Date.now()}`;
    const newRow = {
      id: newId,
      projectTitle: "طرح تملک دارایی سرمایه‌ای جدید",
      creditOrigin: "استانی",
      projectCode: "130201500" + Math.floor(10000 + Math.random() * 90000),
      chapterTitle: "فصل ۱: ساختمان و مستحدثات",
      creditType: "مصوب",
      notifyingBody: "",
      initialBudget: 0,
      increase: 0,
      decrease: 0,
      legalDocs: "",
      finalBudget: 0,
      allocatedCredit: 0,
      receivedCredit: 0,
      consumedCredit: 0,
      inventories: 0,
      prepayments: 0,
      collectionDeficit: 0,
      objectedDocs: 0,
      remarks: "",
    };
    updateRows([...projectRows, newRow]);
  };

  // حذف سطر
  const handleRemoveRow = (id) => {
    const filtered = projectRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع کل طرح‌ها
  const calculatedTotals = useMemo(() => {
    return projectRows.reduce(
      (acc, r) => {
        const initB = Number(r.initialBudget) || 0;
        const inc = Number(r.increase) || 0;
        const dec = Number(r.decrease) || 0;
        const netAdj = inc - dec;
        
        const finalB = Number(r.finalBudget) > 0 ? Number(r.finalBudget) : (initB + netAdj);
        const alloc = Number(r.allocatedCredit) || 0;
        const rec = Number(r.receivedCredit) || 0;
        const cons = Number(r.consumedCredit) || 0;
        const inv = Number(r.inventories) || 0;
        const prep = Number(r.prepayments) || 0;
        const def = Number(r.collectionDeficit) || 0;
        const obj = Number(r.objectedDocs) || 0;

        // وجوه انتقالی (وجه نقد) = دریافت - مصرف - پیش‌پرداخت - موجودی
        const cashTrans = Math.max(0, rec - cons - prep - inv);
        // اوراق انتقالی (محاسباتی: تفاوت بین اعتبار دریافت شده با اعتبار مصرف شده)
        const bondsTrans = Math.max(0, rec - cons);

        acc.initialBudget += initB;
        acc.increase += inc;
        acc.decrease += dec;
        acc.netAdjustment += netAdj;
        acc.finalBudget += finalB;
        acc.allocatedCredit += alloc;
        acc.receivedCredit += rec;
        acc.consumedCredit += cons;
        acc.cashTransferred += cashTrans;
        acc.transferredBonds += bondsTrans;
        acc.inventories += inv;
        acc.prepayments += prep;
        acc.collectionDeficit += def;
        acc.objectedDocs += obj;

        return acc;
      },
      {
        initialBudget: 0,
        increase: 0,
        decrease: 0,
        netAdjustment: 0,
        finalBudget: 0,
        allocatedCredit: 0,
        receivedCredit: 0,
        consumedCredit: 0,
        cashTransferred: 0,
        transferredBonds: 0,
        inventories: 0,
        prepayments: 0,
        collectionDeficit: 0,
        objectedDocs: 0,
      }
    );
  }, [projectRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>اعتبار مصوب نهایی</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              کد ۹۱۰۰۲
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.finalBudget)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>اعتبار تخصیص یافته</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              ۹۳۰۰۲ | ۹۳۵۰۲ | ۹۲۵۰۲
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.allocatedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-700 dark:text-cyan-400">
            <span>اعتبار دریافت شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">
              ۴۱۰۰۳ | ۸۱۰۱۰ | ۸۱۰۱۷ | ۸۱۰۱۹
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-cyan-800 dark:text-cyan-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.receivedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>اعتبار مصرف شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
              کد ۹۹۰۰۲
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-amber-800 dark:text-amber-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.consumedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>اوراق انتقالی (محاسباتی)</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              دریافت - مصرف
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.transferredBonds)} <span className="text-[10px]">ریال</span>
          </div>
        </div>
      </div>

      {/* ─── نوار ابزار کنترلی ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs font-bold px-2.5 py-1 gap-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>تعداد طرح‌ها: {toPersianDigits(projectRows.length)} مورد</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            خلاصه عملکرد اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای (سناما)
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
            <span>افزودن سطر طرح</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی خلاصه عملکرد اعتبارات طرح ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[2100px]">
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={7} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات طرح، کد طبقه بندی و نوع اعتبار
                </th>
                <th colSpan={6} className="p-2 border-r border-border/60 bg-blue-500/5 text-blue-700 dark:text-blue-400">
                  تغییرات بودجه‌ای و بودجه اعتبار نهایی (۹۱۰۰۲)
                </th>
                <th colSpan={4} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  عملکرد تخصیص، دریافت و مصرف اعتبار
                </th>
                <th colSpan={6} className="p-2 border-r border-border/60 bg-purple-500/5 text-purple-700 dark:text-purple-400">
                  مانده‌های انتقالی، موجودی‌ها، کسری و اسناد واخواهی
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: عناوین دقیق ستون‌های خلاصه عملکرد طرح */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[180px]">عنوان طرح</th>
                <th className="p-2 min-w-[110px]">محل اعتبار</th>
                <th className="p-2 min-w-[150px]">
                  کد طرح <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(استانی ۱۴ رقم / ملی ۱۲ رقم)</span>
                </th>
                <th className="p-2 min-w-[140px]">فصل اعتبار</th>
                <th className="p-2 min-w-[100px]">نوع اعتبار</th>
                <th className="p-2 min-w-[160px]">ابلاغ دهنده (در صورت ابلاغی)</th>

                {/* تغییرات بودجه */}
                <th className="p-2 min-w-[140px]">بودجه اولیه (دستی)</th>
                <th className="p-2 min-w-[130px]">افزایش (دستی)</th>
                <th className="p-2 min-w-[130px]">کاهش (دستی)</th>
                <th className="p-2 min-w-[130px]">مستندات قانونی (دستی)</th>
                <th className="p-2 min-w-[140px] bg-blue-50/40 dark:bg-blue-950/20 text-blue-800">
                  خالص افزایش / کاهش <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>
                <th className="p-2 min-w-[160px] bg-blue-100/50 dark:bg-blue-950/40 text-blue-900 font-black">
                  بودجه اعتبار نهایی <br/>
                  <span className="text-[9px] font-mono bg-blue-200 text-blue-900 px-1 rounded">۹۱۰۰۲</span>
                </th>

                {/* عملکرد اعتبار */}
                <th className="p-2 min-w-[160px] bg-purple-50/40 dark:bg-purple-950/20 text-purple-800">
                  اعتبار تخصیص یافته <br/>
                  <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۹۳۰۰۲ | ۹۳۵۰۲ | ۹۲۵۰۲</span>
                </th>
                <th className="p-2 min-w-[160px] bg-cyan-50/40 dark:bg-cyan-950/20 text-cyan-800">
                  اعتبار دریافت شده <br/>
                  <span className="text-[9px] font-mono bg-cyan-100 text-cyan-800 px-1 rounded">۴۱۰۰۳ | ۸۱۰۱۰ | ۸۱۰۱۷ | ۸۱۰۱۹</span>
                </th>
                <th className="p-2 min-w-[160px] bg-amber-50/40 dark:bg-amber-950/20 text-amber-800">
                  اعتبار مصرف شده <br/>
                  <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1 rounded">۹۹۰۰۲</span>
                </th>

                {/* مانده‌ها و اوراق */}
                <th className="p-2 min-w-[150px] bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800">
                  وجوه انتقالی (وجه نقد) <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span>
                </th>
                <th className="p-2 min-w-[160px] bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-900 font-black">
                  اوراق انتقالی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(دریافت - مصرف)</span>
                </th>
                <th className="p-2 min-w-[140px]">
                  موجودی‌ها <br/>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-800 px-1 rounded">۹۸۰۰۲</span>
                </th>
                <th className="p-2 min-w-[140px]">
                  پیش پرداخت <br/>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-800 px-1 rounded">۹۸۰۰۲</span>
                </th>
                <th className="p-2 min-w-[150px]">
                  کسری ابواب جمعی <br/>
                  <span className="text-[9px] font-mono bg-rose-100 text-rose-800 px-1 rounded">۸۱۰۰۷ | ۹۳۵۰۲</span>
                </th>
                <th className="p-2 min-w-[150px]">
                  اسناد واخواهی شده <br/>
                  <span className="text-[9px] font-mono bg-rose-100 text-rose-800 px-1 rounded">۹۲۵۰۲</span>
                </th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {projectRows.map((row, index) => {
                const initB = Number(row.initialBudget) || 0;
                const inc = Number(row.increase) || 0;
                const dec = Number(row.decrease) || 0;
                const netAdj = inc - dec;

                const finalB = Number(row.finalBudget) > 0 ? Number(row.finalBudget) : (initB + netAdj);
                const alloc = Number(row.allocatedCredit) || 0;
                const rec = Number(row.receivedCredit) || 0;
                const cons = Number(row.consumedCredit) || 0;
                const inv = Number(row.inventories) || 0;
                const prep = Number(row.prepayments) || 0;

                // وجوه انتقالی (وجه نقد) = دریافت - مصرف - پیش پرداخت - موجودی
                const cashTrans = Math.max(0, rec - cons - prep - inv);
                // اوراق انتقالی (محاسباتی: تفاوت بین اعتبار دریافت شده با اعتبار مصرف شده)
                const bondsTrans = Math.max(0, rec - cons);

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

                    {/* عنوان طرح */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.projectTitle}
                        onChange={(e) => handleCellChange(row.id, "projectTitle", e.target.value)}
                        className="h-8 text-xs font-bold bg-background/80"
                        placeholder="عنوان طرح..."
                      />
                    </td>

                    {/* محل اعتبار (مصوب / ابلاغی) */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.creditOrigin}
                        onChange={(e) => handleCellChange(row.id, "creditOrigin", e.target.value)}
                        className="h-8 w-full px-1.5 text-xs font-bold rounded-md border border-input bg-background cursor-pointer focus:ring-1 focus:ring-primary"
                      >
                        <option value="استانی">استانی</option>
                        <option value="ملی">ملی</option>
                      </select>
                    </td>

                    {/* کد طرح (۱۴ رقم استانی / ۱۲ رقم ملی) */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        dir="ltr"
                        value={row.projectCode}
                        onChange={(e) => handleCellChange(row.id, "projectCode", e.target.value)}
                        className="h-8 text-xs text-center font-mono font-bold bg-background/80"
                        placeholder={row.creditOrigin === "استانی" ? "۱۴ رقمی استانی" : "۱۲ رقمی ملی"}
                        maxLength={row.creditOrigin === "استانی" ? 14 : 12}
                      />
                    </td>

                    {/* فصل اعتبار */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.chapterTitle}
                        onChange={(e) => handleCellChange(row.id, "chapterTitle", e.target.value)}
                        className="h-8 text-xs bg-background/80"
                        placeholder="فصل اعتبار..."
                      />
                    </td>

                    {/* نوع اعتبار */}
                    <td className="p-1.5 text-center">
                      <select
                        value={row.creditType}
                        onChange={(e) => handleCellChange(row.id, "creditType", e.target.value)}
                        className="h-8 w-full px-1.5 text-xs font-bold rounded-md border border-input bg-background cursor-pointer focus:ring-1 focus:ring-primary"
                      >
                        <option value="مصوب">مصوب</option>
                        <option value="ابلاغی">ابلاغی</option>
                      </select>
                    </td>

                    {/* ابلاغ دهنده */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.notifyingBody || ""}
                        onChange={(e) => handleCellChange(row.id, "notifyingBody", e.target.value)}
                        disabled={row.creditType === "مصوب"}
                        className={cn(
                          "h-8 text-xs bg-background/80",
                          row.creditType === "مصوب" && "opacity-50 bg-muted/40 cursor-not-allowed"
                        )}
                        placeholder={row.creditType === "ابلاغی" ? "نام دستگاه ابلاغ‌دهنده..." : "غیرقابل تکمیل در مصوب"}
                      />
                    </td>

                    {/* بودجه اولیه (دستی) */}
                    <td className="p-1.5">
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

                    {/* مستندات قانونی */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.legalDocs || ""}
                        onChange={(e) => handleCellChange(row.id, "legalDocs", e.target.value)}
                        className="h-8 text-xs bg-background/80"
                        placeholder="شماره موافقت‌نامه / بخشنامه..."
                      />
                    </td>

                    {/* خالص افزایش / کاهش (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-blue-50/30 dark:bg-blue-950/20 text-blue-800">
                      {formatPersianAmount(netAdj)}
                    </td>

                    {/* بودجه اعتبار نهایی (۹۱۰۰۲) */}
                    <td className="p-1.5 bg-blue-100/30 dark:bg-blue-950/30">
                      <PersianAmountInput
                        value={finalB}
                        onChange={(val) => handleCellChange(row.id, "finalBudget", val)}
                        textColor="text-blue-900 dark:text-blue-200"
                      />
                    </td>

                    {/* اعتبار تخصیص یافته (۹۳۰۰۲/۹۳۵۰۲/۹۲۵۰۲) */}
                    <td className="p-1.5 bg-purple-50/20 dark:bg-purple-950/10">
                      <PersianAmountInput
                        value={row.allocatedCredit}
                        onChange={(val) => handleCellChange(row.id, "allocatedCredit", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* اعتبار دریافت شده (۴۱۰۰۳/۸۱۰۱۰/۸۱۰۱۷/۸۱۰۱۹) */}
                    <td className="p-1.5 bg-cyan-50/20 dark:bg-cyan-950/10">
                      <PersianAmountInput
                        value={row.receivedCredit}
                        onChange={(val) => handleCellChange(row.id, "receivedCredit", val)}
                        textColor="text-cyan-800"
                      />
                    </td>

                    {/* اعتبار مصرف شده (۹۹۰۰۲) */}
                    <td className="p-1.5 bg-amber-50/20 dark:bg-amber-950/10">
                      <PersianAmountInput
                        value={row.consumedCredit}
                        onChange={(val) => handleCellChange(row.id, "consumedCredit", val)}
                        textColor="text-amber-800"
                      />
                    </td>

                    {/* وجوه انتقالی (وجه نقد) (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800">
                      {formatPersianAmount(cashTrans)}
                    </td>

                    {/* اوراق انتقالی (محاسباتی: دریافت - مصرف) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-emerald-100/40 dark:bg-emerald-950/30 text-emerald-900">
                      {formatPersianAmount(bondsTrans)}
                    </td>

                    {/* موجودی‌ها (۹۸۰۰۲) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.inventories}
                        onChange={(val) => handleCellChange(row.id, "inventories", val)}
                      />
                    </td>

                    {/* پیش پرداخت (۹۸۰۰۲) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.prepayments}
                        onChange={(val) => handleCellChange(row.id, "prepayments", val)}
                      />
                    </td>

                    {/* کسری ابواب جمعی (۸۱۰۰۷/۹۳۵۰۲) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.collectionDeficit}
                        onChange={(val) => handleCellChange(row.id, "collectionDeficit", val)}
                        textColor="text-rose-700"
                      />
                    </td>

                    {/* اسناد واخواهی شده (۹۲۵۰۲) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.objectedDocs}
                        onChange={(val) => handleCellChange(row.id, "objectedDocs", val)}
                        textColor="text-rose-700"
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
                        title="حذف این سطر طرح"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {projectRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={7} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل عملکرد اعتبارات طرح ({toPersianDigits(projectRows.length)} طرح):</span>
                    </div>
                  </td>

                  {/* مجموع بودجه اولیه */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.initialBudget)}
                  </td>

                  {/* مجموع افزایش */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-800 dark:text-emerald-300">
                    {formatPersianAmount(calculatedTotals.increase)}
                  </td>

                  {/* مجموع کاهش */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-800 dark:text-rose-300">
                    {formatPersianAmount(calculatedTotals.decrease)}
                  </td>

                  <td className="p-2"></td>

                  {/* مجموع خالص تغییرات */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-500/20">
                    {formatPersianAmount(calculatedTotals.netAdjustment)}
                  </td>

                  {/* مجموع بودجه اعتبار نهایی (۹۱۰۰۲) */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-950 dark:text-blue-100 bg-blue-600/30">
                    {formatPersianAmount(calculatedTotals.finalBudget)}
                  </td>

                  {/* مجموع اعتبار تخصیص یافته */}
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 dark:text-purple-200 bg-purple-500/20">
                    {formatPersianAmount(calculatedTotals.allocatedCredit)}
                  </td>

                  {/* مجموع اعتبار دریافت شده */}
                  <td className="p-2.5 text-center font-mono font-bold text-cyan-900 dark:text-cyan-200 bg-cyan-500/20">
                    {formatPersianAmount(calculatedTotals.receivedCredit)}
                  </td>

                  {/* مجموع اعتبار مصرف شده */}
                  <td className="p-2.5 text-center font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-500/20">
                    {formatPersianAmount(calculatedTotals.consumedCredit)}
                  </td>

                  {/* مجموع وجوه انتقالی (وجه نقد) */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-500/10">
                    {formatPersianAmount(calculatedTotals.cashTransferred)}
                  </td>

                  {/* مجموع اوراق انتقالی */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-950 dark:text-emerald-100 bg-emerald-500/30">
                    {formatPersianAmount(calculatedTotals.transferredBonds)}
                  </td>

                  {/* مجموع موجودی‌ها */}
                  <td className="p-2.5 text-center font-mono font-bold">
                    {formatPersianAmount(calculatedTotals.inventories)}
                  </td>

                  {/* مجموع پیش پرداخت */}
                  <td className="p-2.5 text-center font-mono font-bold">
                    {formatPersianAmount(calculatedTotals.prepayments)}
                  </td>

                  {/* مجموع کسری ابواب جمعی */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-800 dark:text-rose-300">
                    {formatPersianAmount(calculatedTotals.collectionDeficit)}
                  </td>

                  {/* مجموع اسناد واخواهی شده */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-800 dark:text-rose-300">
                    {formatPersianAmount(calculatedTotals.objectedDocs)}
                  </td>

                  <td className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای خزانه‌داری (سناما) در خلاصه عملکرد اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>کد طبقه بندی طرح:</b> طرح‌های استانی دارای <b>۱۴ رقم</b> و طرح‌های ملی دارای <b>۱۲ رقم</b> می‌باشد.</li>
            <li><b>ابلاغ دهنده:</b> در صورتیکه نوع اعتبار «ابلاغی» باشد، نام دستگاه ابلاغ‌کننده از ردیف‌های تفصیلی کد معین <b>۹۱۰۰۲</b> استخراج می‌گردد.</li>
            <li><b>بودجه اعتبار نهایی:</b> متصل به کد معین <b>۹۱۰۰۲</b> می‌باشد.</li>
            <li><b>اعتبار تخصیص یافته:</b> مجموع کدهای معین <b>۹۳۰۰۲، ۹۳۵۰۲ و ۹۲۵۰۲</b> است.</li>
            <li><b>اعتبار دریافت شده:</b> مجموع کدهای معین <b>۴۱۰۰۳، ۸۱۰۱۰، ۸۱۰۱۷ و ۸۱۰۱۹</b> است.</li>
            <li><b>اعتبار مصرف شده:</b> متصل به کد معین <b>۹۹۰۰۲</b> است.</li>
            <li><b>اوراق انتقالی (محاسباتی):</b> حاصل تفاوت بین اعتبار دریافت شده با اعتبار مصرف شده می‌باشد: `اعتبار دریافت شده - اعتبار مصرف شده`.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
