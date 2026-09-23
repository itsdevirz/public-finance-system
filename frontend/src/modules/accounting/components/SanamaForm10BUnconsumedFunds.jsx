import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, Coins, Calculator, CheckCircle2, 
  Info, TrendingUp, ShieldCheck, Scale, Landmark, FileSpreadsheet
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";
import { COMMON_NOTIFIER_BUDGET_ROWS } from "./SanamaForm1ProgramExpense";

export const INITIAL_FORM_10B_ROWS = [
  {
    id: "10b_init_1",
    creditType: "مصوب",
    programCode: "1304001001",
    programTitle: "برنامه راهبری و مدیریت منابع عمومی دستگاه",
    notifier: "-",
    initialBalance: 0,
    transferredNonFinal: 0,
    transferredObjectionDeficit: 0,
    transferredInvestments: 0,
    transferredDrafts: 0,
    receivedNotifiedBonds: 0,
    transferredCreditConsumed: 0,
    inventories: 0,
    prepayments: 0,
    materialsPrepayment: 0,
    lcPrepayment: 0,
    onAccounts: 0,
    investments: 0,
    sentToTreasury: 0,
    transferredFunds: 0,
  },
  {
    id: "10b_init_2",
    creditType: "ابلاغی",
    programCode: "1304001002",
    programTitle: "برنامه ارتقاء و توسعه خدمات عملیاتی ابلاغی",
    notifier: "109000 - سازمان برنامه و بودجه کشور",
    initialBalance: 0,
    transferredNonFinal: 0,
    transferredObjectionDeficit: 0,
    transferredInvestments: 0,
    transferredDrafts: 0,
    receivedNotifiedBonds: 0,
    transferredCreditConsumed: 0,
    inventories: 0,
    prepayments: 0,
    materialsPrepayment: 0,
    lcPrepayment: 0,
    onAccounts: 0,
    investments: 0,
    sentToTreasury: 0,
    transferredFunds: 0,
  },
];

export default function SanamaForm10BUnconsumedFunds({
  rows = INITIAL_FORM_10B_ROWS,
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [formRows, setFormRows] = useState(rows && rows.length > 0 ? rows : INITIAL_FORM_10B_ROWS);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setFormRows(newRows);
    if (onChange) onChange(newRows);
  };

  // دریافت برنامه‌ها واقعی از دیتابیس در صورت نبودن داده
  useEffect(() => {
    if (rows && rows.length > 0) return;

    const fetchRealAgreements = async () => {
      setIsLoadingAgreements(true);
      try {
        const res = await api.get("/api/credits/agreements");
        const agrs = res.data?.data || res.data || [];
        if (Array.isArray(agrs) && agrs.length > 0) {
          const generatedRows = [];
          agrs.forEach((agr) => {
            const cType = agr.credit_type === " ابلاغی" || agr.credit_category === "notified" ? "ابلاغی" : "مصوب";
            const items = agr.items || [];
            if (items.length > 0) {
              items.forEach((item, idx) => {
                generatedRows.push({
                  id: `10b_${agr._id || Date.now()}_${idx}`,
                  creditType: cType,
                  programCode: item.programOrProjectNumber || item.code || `10${idx + 1}`,
                  programTitle: item.title || item.programTitle || agr.title || "برنامه عملیاتی",
                  notifier: cType === "ابلاغی" ? (agr.notifier || "109000 - سازمان برنامه و بودجه کشور") : "-",
                  initialYearBalance: 0,
                  transferredFromNonDefinite: 0,
                  transferredFromObjectionsAndDeficit: 0,
                  transferredFromInvestments: 0,
                  transferredDrafts: 0,
                  receivedNotifiedTransferred: 0,
                  usableTransferredResources: 0,
                  consumedTransferredCredit: 0,
                  inventories: 0,
                  prepayments: 0,
                  materialPrepayments: 0,
                  lcPrepayments: 0,
                  onAccounts: 0,
                  investments: 0,
                  objectedDocuments: 0,
                  transferredCashierDeficit: 0,
                  unconsumedBonds: 0,
                });
              });
            } else {
              generatedRows.push({
                id: `10b_${agr._id || Date.now()}`,
                creditType: cType,
                programCode: agr.base_code || "10100",
                programTitle: agr.title || "برنامه هزینه‌ای عمومی",
                notifier: cType === "ابلاغی" ? (agr.notifier || "109000 - سازمان برنامه و بودجه کشور") : "-",
                initialYearBalance: 0,
                transferredFromNonDefinite: 0,
                transferredFromObjectionsAndDeficit: 0,
                transferredFromInvestments: 0,
                transferredDrafts: 0,
                receivedNotifiedTransferred: 0,
                usableTransferredResources: 0,
                consumedTransferredCredit: 0,
                inventories: 0,
                prepayments: 0,
                materialPrepayments: 0,
                lcPrepayments: 0,
                onAccounts: 0,
                investments: 0,
                objectedDocuments: 0,
                transferredCashierDeficit: 0,
                unconsumedBonds: 0,
              });
            }
          });
          if (generatedRows.length > 0) {
            updateRows(generatedRows);
          }
        }
      } catch (err) {
        console.warn("خطا در فراخوانی برنامه‌های واقعی موافقتنامه:", err);
      } finally {
        setIsLoadingAgreements(false);
      }
    };

    fetchRealAgreements();
  }, []);

  // فراخوانی اتوماتیک کدهای معین از تراز ۸ ستونی اسناد مالی
  useEffect(() => {
    if (!moeinBalancesMap || Object.keys(moeinBalancesMap).length === 0) return;

    const m94003 = moeinBalancesMap["94003"] || moeinBalancesMap["94001"] || 0; // حواله انتقالی
    const mNotifiedRec = (moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81017"] || 0) + (moeinBalancesMap["81019"] || 0); // دریافتی از اعتبارات ابلاغی
    const m91003 = moeinBalancesMap["91003"] || 0; // منابع انتقالی قابل مصرف
    const m99003 = moeinBalancesMap["99003"] || 0; // اعتبار انتقالی مصرف شده
    const m98003 = moeinBalancesMap["98003"] || moeinBalancesMap["98001"] || 0; // موجودی‌ها، پیش پرداخت و علی‌الحساب
    const m92503 = moeinBalancesMap["92503"] || moeinBalancesMap["92501"] || 0; // اسناد واخواهی
    const m93503 = (moeinBalancesMap["93503"] || 0) + (moeinBalancesMap["81007"] || 0); // کسری ابواب جمعی
    const mBonds = (moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81019"] || 0); // اوراق مصرف نشده

    if (formRows.length > 0 && (m94003 > 0 || mNotifiedRec > 0 || m91003 > 0 || m99003 > 0 || m98003 > 0)) {
      setFormRows((prevRows) => {
        const count = prevRows.length || 1;
        const updated = prevRows.map((r) => {
          return {
            ...r,
            transferredDrafts: m94003 > 0 ? Math.round(m94003 / count) : r.transferredDrafts,
            receivedNotifiedTransferred: mNotifiedRec > 0 ? Math.round(mNotifiedRec / count) : r.receivedNotifiedTransferred,
            usableTransferredResources: m91003 > 0 ? Math.round(m91003 / count) : r.usableTransferredResources,
            consumedTransferredCredit: m99003 > 0 ? Math.round(m99003 / count) : r.consumedTransferredCredit,
            inventories: m98003 > 0 ? Math.round(m98003 / (count * 5)) : r.inventories,
            prepayments: m98003 > 0 ? Math.round(m98003 / (count * 5)) : r.prepayments,
            materialPrepayments: m98003 > 0 ? Math.round(m98003 / (count * 5)) : r.materialPrepayments,
            lcPrepayments: m98003 > 0 ? Math.round(m98003 / (count * 5)) : r.lcPrepayments,
            onAccounts: m98003 > 0 ? Math.round(m98003 / (count * 5)) : r.onAccounts,
            objectedDocuments: m92503 > 0 ? Math.round(m92503 / count) : r.objectedDocuments,
            transferredCashierDeficit: m93503 > 0 ? Math.round(m93503 / count) : r.transferredCashierDeficit,
            unconsumedBonds: mBonds > 0 ? Math.round(mBonds / count) : r.unconsumedBonds,
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
    const updated = formRows.map((r) => {
      if (r.id === id) {
        const updatedRow = { ...r, [field]: value };
        // قانون سناما: اگر نوع اعتبار مصوب گردد، ابلاغ‌دهنده غیرفعال (-) می‌شود
        if (field === "creditType" && value === "مصوب") {
          updatedRow.notifier = "-";
        } else if (field === "creditType" && value === "ابلاغی" && updatedRow.notifier === "-") {
          updatedRow.notifier = "109000 - سازمان برنامه و بودجه کشور";
        }
        return updatedRow;
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر برنامه جدید
  const handleAddRow = () => {
    const newId = `10b_${Date.now()}`;
    const newRow = {
      id: newId,
      creditType: "مصوب",
      programCode: `${100 + formRows.length + 1}00`,
      programTitle: "برنامه جدید عملیاتی و بودجه‌ای",
      notifier: "-",
      initialYearBalance: 0,
      transferredFromNonDefinite: 0,
      transferredFromObjectionsAndDeficit: 0,
      transferredFromInvestments: 0,
      transferredDrafts: 0,
      receivedNotifiedTransferred: 0,
      usableTransferredResources: 0,
      consumedTransferredCredit: 0,
      inventories: 0,
      prepayments: 0,
      materialPrepayments: 0,
      lcPrepayments: 0,
      onAccounts: 0,
      investments: 0,
      objectedDocuments: 0,
      transferredCashierDeficit: 0,
      unconsumedBonds: 0,
    };
    updateRows([...formRows, newRow]);
  };

  // حذف سطر
  const handleRemoveRow = (id) => {
    const filtered = formRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // همگام‌سازی دستی با دفتر معین
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
  };

  // محاسبات مجموع سرجمع سطرها و محاسباتی‌ها بر اساس قوانین فرم ۱۰-ب سناما
  const calculatedTotals = useMemo(() => {
    return formRows.reduce(
      (acc, r) => {
        const init = Number(r.initialYearBalance) || 0;
        const tNonDef = Number(r.transferredFromNonDefinite) || 0;
        const tObjDef = Number(r.transferredFromObjectionsAndDeficit) || 0;
        const tInv = Number(r.transferredFromInvestments) || 0;
        const drafts = Number(r.transferredDrafts) || 0; // ۹۴۰۰۳
        const recNotified = Number(r.receivedNotifiedTransferred) || 0; // ۸۱۰۱۰ / ۸۱۰۱۷ / ۸۱۰۱۹

        // منابع انتقالی قابل مصرف (۹۱۰۰۳) = مجموع منابع ورودی و انتقالی
        const calcUsable = (r.usableTransferredResources > 0)
          ? Number(r.usableTransferredResources)
          : (init + tNonDef + tObjDef + tInv + drafts + recNotified);

        const consumed = Number(r.consumedTransferredCredit) || 0; // ۹۹۰۰۳
        const inv = Number(r.inventories) || 0; // ۹۸۰۰۳
        const prepay = Number(r.prepayments) || 0; // ۹۸۰۰۳
        const matPrepay = Number(r.materialPrepayments) || 0; // ۹۸۰۰۳
        const lcPrepay = Number(r.lcPrepayments) || 0; // ۹۸۰۰۳
        const onAcc = Number(r.onAccounts) || 0; // ۹۸۰۰۳
        const invest = Number(r.investments) || 0;
        const objDocs = Number(r.objectedDocuments) || 0; // ۹۲۵۰۳
        const cashierDef = Number(r.transferredCashierDeficit) || 0; // ۹۳۵۰۳ / ۸۱۰۰۷
        const bonds = Number(r.unconsumedBonds) || 0; // ۸۱۰۱۰ / ۸۱۰۱۹

        // وجوه ارسالی به خزانه (محاسباتی)
        const calcSentTreasury = Math.max(0, calcUsable - (consumed + inv + prepay + matPrepay + lcPrepay + onAcc + objDocs + cashierDef + bonds));

        // وجوه انتقالی (محاسباتی)
        const calcTransferred = Math.max(0, calcUsable - consumed - calcSentTreasury);

        // مانده پایان سال (محاسباتی)
        const calcYearEnd = Math.max(0, calcUsable - (consumed + calcSentTreasury));

        acc.initialYearBalance += init;
        acc.transferredFromNonDefinite += tNonDef;
        acc.transferredFromObjectionsAndDeficit += tObjDef;
        acc.transferredFromInvestments += tInv;
        acc.transferredDrafts += drafts;
        acc.receivedNotifiedTransferred += recNotified;
        acc.usableTransferredResources += calcUsable;
        acc.consumedTransferredCredit += consumed;
        acc.inventories += inv;
        acc.prepayments += prepay;
        acc.materialPrepayments += matPrepay;
        acc.lcPrepayments += lcPrepay;
        acc.onAccounts += onAcc;
        acc.investments += invest;
        acc.sentToTreasury += calcSentTreasury;
        acc.transferredFunds += calcTransferred;
        acc.objectedDocuments += objDocs;
        acc.transferredCashierDeficit += cashierDef;
        acc.unconsumedBonds += bonds;
        acc.yearEndBalance += calcYearEnd;

        return acc;
      },
      {
        initialYearBalance: 0,
        transferredFromNonDefinite: 0,
        transferredFromObjectionsAndDeficit: 0,
        transferredFromInvestments: 0,
        transferredDrafts: 0,
        receivedNotifiedTransferred: 0,
        usableTransferredResources: 0,
        consumedTransferredCredit: 0,
        inventories: 0,
        prepayments: 0,
        materialPrepayments: 0,
        lcPrepayments: 0,
        onAccounts: 0,
        investments: 0,
        sentToTreasury: 0,
        transferredFunds: 0,
        objectedDocuments: 0,
        transferredCashierDeficit: 0,
        unconsumedBonds: 0,
        yearEndBalance: 0,
      }
    );
  }, [formRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <span>منابع انتقالی قابل مصرف</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
              کد ۹۱۰۰۳
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.usableTransferredResources)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span>اعتبار انتقالی مصرف شده</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
              کد ۹۹۰۰۳
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.consumedTransferredCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
            <span>وجوه ارسالی به خزانه</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">
              محاسباتی
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-teal-800 dark:text-teal-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.sentToTreasury)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>مانده پایان سال</span>
            <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
              محاسباتی
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
            <Coins className="h-3.5 w-3.5" />
            <span>تعداد برنامه‌ها: {toPersianDigits(formRows.length)} سطر</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            صورت خلاصه وجوه مصرف نشده و انتقالی اعتبارات (فرم ۱۰ - ب)
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
            <span>افزودن سطر برنامه</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی و ۲۴ ستونی وجوه مصرف نشده - فرم ۱۰-ب ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[2800px]">
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={5} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات برنامه‌ها و دستگاه ابلاغ‌دهنده
                </th>
                <th colSpan={7} className="p-2 border-r border-border/60 bg-purple-500/5 text-purple-700 dark:text-purple-400">
                  منابع انتقالی، حواله‌ها و اعتبارات قابل مصرف
                </th>
                <th colSpan={6} className="p-2 border-r border-border/60 bg-blue-500/5 text-blue-700 dark:text-blue-400">
                  اعتبارات مصرف‌شده، پیش‌پرداخت‌ها و موجودی‌ها
                </th>
                <th colSpan={6} className="p-2 border-r border-border/60 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                  وجوه ارسالی، اسناد واخواهی و مانده نهایی
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: ۲۴ ستون کامل طبق درخواست دقیق کاربر */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[90px]">نوع اعتبار</th>
                <th className="p-2 min-w-[100px]">شماره برنامه</th>
                <th className="p-2 min-w-[180px]">عنوان برنامه</th>
                <th className="p-2 min-w-[170px]">ابلاغ دهنده</th>

                <th className="p-2 min-w-[130px]">مانده ابتدای سال <br/><span className="text-[9px] font-normal text-muted-foreground">(دستی)</span></th>
                <th className="p-2 min-w-[140px]">وجوه انتقالی غیرقطعی سال قبل</th>
                <th className="p-2 min-w-[140px]">وجوه انتقالی واخواهی/کسری</th>
                <th className="p-2 min-w-[130px]">وجوه انتقالی سرمایه‌گذاری</th>
                <th className="p-2 min-w-[130px]">حواله انتقالی <br/><span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۹۴۰۰۳</span></th>
                <th className="p-2 min-w-[140px]">دریافتی اعتبار ابلاغی <br/><span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۸۱۰۱۰/۸۱۰۱۷/۸۱۰۱۹</span></th>
                <th className="p-2 min-w-[150px] bg-purple-50/50 dark:bg-purple-950/20 text-purple-800">منابع انتقالی قابل مصرف <br/><span className="text-[9px] font-mono bg-purple-200 text-purple-900 px-1 rounded">۹۱۰۰۳</span></th>

                <th className="p-2 min-w-[150px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-800">اعتبار انتقالی مصرف شده <br/><span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">۹۹۰۰۳</span></th>
                <th className="p-2 min-w-[130px]">موجودی‌ها <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۸۰۰۳</span></th>
                <th className="p-2 min-w-[130px]">پیش پرداخت <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۸۰۰۳</span></th>
                <th className="p-2 min-w-[130px]">پیش پرداخت مواد و کالا <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۸۰۰۳</span></th>
                <th className="p-2 min-w-[130px]">پیش پرداخت اعتبار اسنادی <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۸۰۰۳</span></th>
                <th className="p-2 min-w-[130px]">علی الحساب <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۸۰۰۳</span></th>

                <th className="p-2 min-w-[120px]">سرمایه‌گذاری‌ها <br/><span className="text-[9px] font-normal text-muted-foreground">(دستی)</span></th>
                <th className="p-2 min-w-[140px] bg-teal-50/50 dark:bg-teal-950/20 text-teal-800">وجوه ارسالی به خزانه <br/><span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span></th>
                <th className="p-2 min-w-[140px] bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800">وجوه انتقالی <br/><span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span></th>
                <th className="p-2 min-w-[130px]">اسناد واخواهی شده <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۲۵۰۳</span></th>
                <th className="p-2 min-w-[140px]">کسری ابواب جمعی انتقالی <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۹۳۵۰۳ / ۸۱۰۰۷</span></th>
                <th className="p-2 min-w-[140px]">اوراق مصرف نشده <br/><span className="text-[9px] font-mono bg-muted text-muted-foreground px-1 rounded">۸۱۰۱۰ / ۸۱۰۱۹</span></th>
                <th className="p-2 min-w-[150px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800">مانده پایان سال <br/><span className="text-[9px] font-normal text-muted-foreground">(محاسباتی)</span></th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {formRows.map((row, index) => {
                const init = Number(row.initialYearBalance) || 0;
                const tNonDef = Number(row.transferredFromNonDefinite) || 0;
                const tObjDef = Number(row.transferredFromObjectionsAndDeficit) || 0;
                const tInv = Number(row.transferredFromInvestments) || 0;
                const drafts = Number(row.transferredDrafts) || 0;
                const recNotified = Number(row.receivedNotifiedTransferred) || 0;

                const usable = (row.usableTransferredResources > 0)
                  ? Number(row.usableTransferredResources)
                  : (init + tNonDef + tObjDef + tInv + drafts + recNotified);

                const consumed = Number(row.consumedTransferredCredit) || 0;
                const inv = Number(row.inventories) || 0;
                const prepay = Number(row.prepayments) || 0;
                const matPrepay = Number(row.materialPrepayments) || 0;
                const lcPrepay = Number(row.lcPrepayments) || 0;
                const onAcc = Number(row.onAccounts) || 0;
                const objDocs = Number(row.objectedDocuments) || 0;
                const cashierDef = Number(row.transferredCashierDeficit) || 0;
                const bonds = Number(row.unconsumedBonds) || 0;

                const calcSentTreasury = Math.max(0, usable - (consumed + inv + prepay + matPrepay + lcPrepay + onAcc + objDocs + cashierDef + bonds));
                const calcTransferred = Math.max(0, usable - consumed - calcSentTreasury);
                const calcYearEnd = Math.max(0, usable - (consumed + calcSentTreasury));

                const isNotified = row.creditType === "ابلاغی";

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

                    {/* نوع اعتبار (مصوب / ابلاغی) */}
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

                    {/* شماره برنامه */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        dir="ltr"
                        value={row.programCode}
                        onChange={(e) => handleCellChange(row.id, "programCode", e.target.value)}
                        className="h-8 text-xs font-mono text-center bg-background/80"
                        placeholder="10100"
                      />
                    </td>

                    {/* عنوان برنامه */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.programTitle}
                        onChange={(e) => handleCellChange(row.id, "programTitle", e.target.value)}
                        className="h-8 text-xs font-bold bg-background/80"
                        placeholder="عنوان برنامه بودجه‌ای..."
                      />
                    </td>

                    {/* ابلاغ دهنده */}
                    <td className="p-1.5">
                      {isNotified ? (
                        <select
                          value={row.notifier || ""}
                          onChange={(e) => handleCellChange(row.id, "notifier", e.target.value)}
                          className="h-8 w-full px-1.5 text-xs font-medium rounded-md border border-primary/40 bg-background focus:ring-1 focus:ring-primary"
                        >
                          <option value="">-- انتخاب دستگاه ابلاغ‌دهنده --</option>
                          {COMMON_NOTIFIER_BUDGET_ROWS.map((n) => (
                            <option key={n.code} value={n.title}>
                              {n.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type="text"
                          disabled
                          value="-"
                          className="h-8 text-xs text-center bg-muted/40 font-mono text-muted-foreground"
                        />
                      )}
                    </td>

                    {/* مانده ابتدای سال (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.initialYearBalance}
                        onChange={(val) => handleCellChange(row.id, "initialYearBalance", val)}
                      />
                    </td>

                    {/* وجوه انتقالی غیرقطعی سال قبل */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredFromNonDefinite}
                        onChange={(val) => handleCellChange(row.id, "transferredFromNonDefinite", val)}
                      />
                    </td>

                    {/* وجوه انتقالی واخواهی/کسری */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredFromObjectionsAndDeficit}
                        onChange={(val) => handleCellChange(row.id, "transferredFromObjectionsAndDeficit", val)}
                      />
                    </td>

                    {/* وجوه انتقالی سرمایه‌گذاری */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredFromInvestments}
                        onChange={(val) => handleCellChange(row.id, "transferredFromInvestments", val)}
                      />
                    </td>

                    {/* حواله انتقالی (۹۴۰۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredDrafts}
                        onChange={(val) => handleCellChange(row.id, "transferredDrafts", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* دریافتی اعتبار ابلاغی (۸۱۰۱۰/۸۱۰۱۷/۸۱۰۱۹) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.receivedNotifiedTransferred}
                        onChange={(val) => handleCellChange(row.id, "receivedNotifiedTransferred", val)}
                        textColor="text-purple-800"
                      />
                    </td>

                    {/* منابع انتقالی قابل مصرف (۹۱۰۰۳) */}
                    <td className="p-1.5 bg-purple-50/20 dark:bg-purple-950/10">
                      <PersianAmountInput
                        value={usable}
                        onChange={(val) => handleCellChange(row.id, "usableTransferredResources", val)}
                        textColor="text-purple-900"
                      />
                    </td>

                    {/* اعتبار انتقالی مصرف شده (۹۹۰۰۳) */}
                    <td className="p-1.5 bg-blue-50/20 dark:bg-blue-950/10">
                      <PersianAmountInput
                        value={row.consumedTransferredCredit}
                        onChange={(val) => handleCellChange(row.id, "consumedTransferredCredit", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* موجودی‌ها (۹۸۰۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.inventories}
                        onChange={(val) => handleCellChange(row.id, "inventories", val)}
                      />
                    </td>

                    {/* پیش پرداخت (۹۸۰۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.prepayments}
                        onChange={(val) => handleCellChange(row.id, "prepayments", val)}
                      />
                    </td>

                    {/* پیش پرداخت مواد و کالا (۹۸۰۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.materialPrepayments}
                        onChange={(val) => handleCellChange(row.id, "materialPrepayments", val)}
                      />
                    </td>

                    {/* پیش پرداخت اعتبار اسنادی (۹۸۰۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.lcPrepayments}
                        onChange={(val) => handleCellChange(row.id, "lcPrepayments", val)}
                      />
                    </td>

                    {/* علی الحساب (۹۸۰۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.onAccounts}
                        onChange={(val) => handleCellChange(row.id, "onAccounts", val)}
                      />
                    </td>

                    {/* سرمایه‌گذاری‌ها (دستی) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.investments}
                        onChange={(val) => handleCellChange(row.id, "investments", val)}
                      />
                    </td>

                    {/* وجوه ارسالی به خزانه (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-teal-50/50 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300">
                      {formatPersianAmount(calcSentTreasury)}
                    </td>

                    {/* وجوه انتقالی (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300">
                      {formatPersianAmount(calcTransferred)}
                    </td>

                    {/* اسناد واخواهی شده (۹۲۵۰۳) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.objectedDocuments}
                        onChange={(val) => handleCellChange(row.id, "objectedDocuments", val)}
                      />
                    </td>

                    {/* کسری ابواب جمعی انتقالی (۹۳۵۰۳ / ۸۱۰۰۷) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.transferredCashierDeficit}
                        onChange={(val) => handleCellChange(row.id, "transferredCashierDeficit", val)}
                      />
                    </td>

                    {/* اوراق مصرف نشده (۸۱۰۱۰ / ۸۱۰۱۹) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.unconsumedBonds}
                        onChange={(val) => handleCellChange(row.id, "unconsumedBonds", val)}
                      />
                    </td>

                    {/* مانده پایان سال (محاسباتی) */}
                    <td className="p-2 text-center font-mono font-bold text-xs bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      {formatPersianAmount(calcYearEnd)}
                    </td>

                    {/* دکمه حذف */}
                    <td className="p-1.5 text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRow(row.id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="حذف این سطر برنامه"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ─── سطر سرجمع (TOTAL ROW) ─── */}
            {formRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={5} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل وجوه مصرف نشده ({toPersianDigits(formRows.length)} برنامه):</span>
                    </div>
                  </td>

                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.initialYearBalance)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.transferredFromNonDefinite)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.transferredFromObjectionsAndDeficit)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.transferredFromInvestments)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 bg-purple-500/10">{formatPersianAmount(calculatedTotals.transferredDrafts)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 bg-purple-500/10">{formatPersianAmount(calculatedTotals.receivedNotifiedTransferred)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-purple-900 bg-purple-500/20">{formatPersianAmount(calculatedTotals.usableTransferredResources)}</td>

                  <td className="p-2.5 text-center font-mono font-bold text-blue-900 bg-blue-500/20">{formatPersianAmount(calculatedTotals.consumedTransferredCredit)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.inventories)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.prepayments)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.materialPrepayments)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.lcPrepayments)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.onAccounts)}</td>

                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.investments)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-teal-900 bg-teal-500/20">{formatPersianAmount(calculatedTotals.sentToTreasury)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-indigo-900 bg-indigo-500/20">{formatPersianAmount(calculatedTotals.transferredFunds)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.objectedDocuments)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.transferredCashierDeficit)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">{formatPersianAmount(calculatedTotals.unconsumedBonds)}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-900 bg-emerald-500/20">{formatPersianAmount(calculatedTotals.yearEndBalance)}</td>

                  <td className="p-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ─── راهنمای کدهای معین و قوانین سناما فرم ۱۰-ب ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در وجوه مصرف نشده (فرم ۱۰ - ب):</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li><b>ردیف ابلاغی دستگاه (ابلاغ دهنده)</b> در صورتی که نوع اعتبار <b>ابلاغی</b> باشد الزام قانونی ورود اطلاعات دارد.</li>
            <li><b>منابع انتقالی قابل مصرف</b> متصل به کد معین <b>۹۱۰۰۳</b> (اعتبارات هزینه‌ای انتقالی) می‌باشد.</li>
            <li><b>اعتبار انتقالی مصرف شده</b> متصل به کد معین <b>۹۹۰۰۳</b> می‌باشد.</li>
            <li>ستون‌های <b>وجوه ارسالی به خزانه، وجوه انتقالی و مانده پایان سال</b> کاملاً به‌صورت خودکار و محاسباتی رقم می‌خورند.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
