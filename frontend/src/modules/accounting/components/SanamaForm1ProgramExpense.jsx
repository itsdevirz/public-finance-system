import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Trash2, RefreshCw, Layers, Calculator, CheckCircle2, 
  Info, TrendingUp, Coins, ShieldCheck, Scale, Landmark, FileText, Download, Save
} from "lucide-react";
import api from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPersianAmount, toPersianDigits, PersianAmountInput } from "../pages/SanamaFormsViewer";

export const DEFAULT_PROGRAM_ROWS = [
  {
    id: "prog_1",
    programTitle: "برنامه راهبری و برنامه‌ریزی امور عمومی دستگاه",
    programCode: "1304001001",
    creditType: "مصوب",
    notifier: "-",
    initialBudget: 0,
    increase: 0,
    decrease: 0,
    legalDocs: "قانون بودجه کل کشور",
    allocatedCredit: 0,
    receivedCredit: 0,
    consumedCredit: 0,
    transferredCash: 0,
    inventories: 0,
    prepayment: 0,
    deficit: 0,
    protestedDocs: 0,
  },
  {
    id: "prog_2",
    programTitle: "برنامه ارائه خدمات تخصصی و خدمات عمومی سالانه",
    programCode: "1304001002",
    creditType: "ابلاغی",
    notifier: "109000 - سازمان برنامه و بودجه کشور",
    initialBudget: 0,
    increase: 0,
    decrease: 0,
    legalDocs: "ابلاغیه تخصیص سازمان برنامه",
    allocatedCredit: 0,
    receivedCredit: 0,
    consumedCredit: 0,
    transferredCash: 0,
    inventories: 0,
    prepayment: 0,
    deficit: 0,
    protestedDocs: 0,
  },
];

export const COMMON_NOTIFIER_BUDGET_ROWS = [
  { code: "109000", title: "109000 - سازمان برنامه و بودجه کشور" },
  { code: "105000", title: "105000 - وزارت بهداشت، درمان و آموزش پزشکی" },
  { code: "108000", title: "108000 - وزارت آموزش و پرورش" },
  { code: "107000", title: "107000 - وزارت علوم، تحقیقات و فناوری" },
  { code: "102000", title: "102000 - وزارت کشور" },
  { code: "104000", title: "104000 - وزارت امور اقتصادی و دارایی" },
  { code: "111000", title: "111000 - وزارت جهاد کشاورزی" },
  { code: "114000", title: "114000 - وزارت راه و شهرسازی" },
  { code: "129000", title: "129000 - وزارت نیرو" },
  { code: "131500", title: "131500 - سازمان غذا و دارو" },
  { code: "101000", title: "101000 - نهاد ریاست جمهوری" },
  { code: "101500", title: "101500 - دیوان محاسبات کشور" },
];

export default function SanamaForm1ProgramExpense({ 
  rows = [], 
  onChange,
  moeinBalancesMap = {},
  onSyncMoein,
  fiscalYear = "1404",
  period = "کامل"
}) {
  const [programRows, setProgramRows] = useState(rows && rows.length > 0 ? rows : DEFAULT_PROGRAM_ROWS);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false);

  // به‌روزرسانی ردیف‌ها و اطلاع به کامپوننت مادر
  const updateRows = (newRows) => {
    setProgramRows(newRows);
    if (onChange) onChange(newRows);
  };

  // تغییر نوع اعتبار و اعمال الزامات تفصیلی کد معین ۹۱۰۰۱ (فیلد ابلاغ‌دهنده)
  const handleCreditTypeChange = (id, newType) => {
    const updated = programRows.map((r) => {
      if (r.id === id) {
        if (newType === "مصوب") {
          return { ...r, creditType: "مصوب", notifier: "-" };
        } else {
          // برای اعتبار ابلاغی، درج یا انتخاب ردیف ابلاغی دستگاه الزامی است
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
    const m93001 = (moeinBalancesMap["93001"] || 0) + (moeinBalancesMap["91501"] || 0) + (moeinBalancesMap["93501"] || 0);
    // تفکیک بر پایه ماهیت اعتبارات هزینه‌ای و فصل‌های اعتباری تفصیلی برای کدهای انتظامی (۸۱۰۱۰ و ۸۱۰۱۷)
    const mReceived = (moeinBalancesMap["41001"] || 0) + (moeinBalancesMap["41005"] || 0) + (moeinBalancesMap["81017_expense"] || moeinBalancesMap["81017"] || 0) + (moeinBalancesMap["81010_expense"] || moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81019"] || 0);
    const m99001 = moeinBalancesMap["99001"] || 0;
    const m98001 = moeinBalancesMap["98001"] || 0;
    const mDeficit = (moeinBalancesMap["81007"] || 0) + (moeinBalancesMap["93501"] || 0);
    const m92501 = moeinBalancesMap["92501"] || 0;

    // اگر سطری در فرم نباشد، ایجاد اتوماتیک سطر بر اساس تراز کدهای معین اسناد
    if (programRows.length === 0 && (m91001 > 0 || m93001 > 0 || mReceived > 0 || m99001 > 0)) {
      const autoRow = {
        id: `auto_moein_${Date.now()}`,
        programTitle: "برنامه عملکرد هزینه‌ای عمومی (استخراج اتوماتیک از تراز معین)",
        programCode: "1304001001",
        creditType: "مصوب",
        notifier: "خزانه‌داری کل کشور",
        initialBudget: m91001,
        increase: 0,
        decrease: 0,
        legalDocs: "استخراج اتوماتیک از اسناد معین دفترکل",
        allocatedCredit: m93001,
        receivedCredit: mReceived,
        consumedCredit: m99001,
        transferredCash: 0,
        inventories: 0,
        prepayment: m98001,
        deficit: mDeficit,
        protestedDocs: m92501,
      };
      updateRows([autoRow]);
    } else if (programRows.length > 0) {
      // به‌روزرسانی اتوماتیک کدهای معین برای سطرهای موجود
      const updated = programRows.map((r) => {
        const ratio = 1 / programRows.length;
        return {
          ...r,
          initialBudget: r.initialBudget > 0 ? r.initialBudget : Math.round(m91001 * ratio),
          allocatedCredit: m93001 > 0 ? Math.round(m93001 * ratio) : r.allocatedCredit,
          receivedCredit: mReceived > 0 ? Math.round(mReceived * ratio) : r.receivedCredit,
          consumedCredit: m99001 > 0 ? Math.round(m99001 * ratio) : r.consumedCredit,
          prepayment: m98001 > 0 ? Math.round(m98001 * ratio) : r.prepayment,
          deficit: mDeficit > 0 ? Math.round(mDeficit * ratio) : r.deficit,
          protestedDocs: m92501 > 0 ? Math.round(m92501 * ratio) : r.protestedDocs,
        };
      });

      const hasChanged = JSON.stringify(updated) !== JSON.stringify(programRows);
      if (hasChanged) {
        updateRows(updated);
      }
    }
  }, [moeinBalancesMap]);

  // تغییر فیلد یک ردیف مشخص
  const handleCellChange = (id, field, value) => {
    const updated = programRows.map((r) => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    updateRows(updated);
  };

  // افزودن سطر برنامه جدید
  const handleAddRow = () => {
    const newId = `prog_${Date.now()}`;
    const newRow = {
      id: newId,
      programTitle: "",
      programCode: "",
      creditType: "مصوب",
      notifier: "",
      initialBudget: 0,
      increase: 0,
      decrease: 0,
      legalDocs: "",
      allocatedCredit: 0,
      receivedCredit: 0,
      consumedCredit: 0,
      transferredCash: 0,
      inventories: 0,
      prepayment: 0,
      deficit: 0,
      protestedDocs: 0,
    };
    updateRows([...programRows, newRow]);
  };

  // حذف سطر برنامه
  const handleRemoveRow = (id) => {
    const filtered = programRows.filter((r) => r.id !== id);
    updateRows(filtered);
  };

  // فراخوانی موافقت‌نامه‌های بودجه‌ای واقعی از دیتابیس
  const handleLoadRealAgreements = async () => {
    setIsLoadingAgreements(true);
    try {
      const res = await api.get("/api/credits/agreements");
      const agrs = res.data?.data || res.data || [];
      
      if (!Array.isArray(agrs) || agrs.length === 0) {
        alert("هیچ موافقت‌نامه بودجه‌ای در سیستم ثبت نشده است. می‌توانید برنامه‌ها را دستی ایجاد نمایید.");
        return;
      }

      // تبدیل موافقت‌نامه‌های واقعی ثبت شده به ردیف‌های برنامه‌ای
      const realRows = agrs.flatMap((agr, idx) => {
        if (Array.isArray(agr.items) && agr.items.length > 0) {
          return agr.items.map((item, itemIdx) => ({
            id: `real_agr_${agr._id || idx}_${itemIdx}`,
            programTitle: item.programOrProjectTitle || item.title || agr.title || `برنامه ${itemIdx + 1}`,
            programCode: item.programOrProjectNumber || item.code || `130400100${itemIdx + 1}`,
            creditType: agr.credit_type || agr.creditType || "مصوب",
            notifier: agr.notifier || agr.organization || "دستگاه اجرایی",
            initialBudget: Number(item.amount || item.initialBudget) || Number(agr.total_amount) || 0,
            increase: 0,
            decrease: 0,
            legalDocs: agr.agreement_number || "-",
            allocatedCredit: 0,
            receivedCredit: 0,
            consumedCredit: 0,
            transferredCash: 0,
            inventories: 0,
            prepayment: 0,
            deficit: 0,
            protestedDocs: 0,
          }));
        }
        return [{
          id: `real_agr_${agr._id || idx}`,
          programTitle: agr.title || agr.agreement_number || `برنامه بودجه ${idx + 1}`,
          programCode: agr.code || `130400100${idx + 1}`,
          creditType: agr.credit_type || "مصوب",
          notifier: agr.notifier || "دستگاه اجرایی",
          initialBudget: Number(agr.total_amount || agr.amount) || 0,
          increase: 0,
          decrease: 0,
          legalDocs: agr.agreement_number || "-",
          allocatedCredit: 0,
          receivedCredit: 0,
          consumedCredit: 0,
          transferredCash: 0,
          inventories: 0,
          prepayment: 0,
          deficit: 0,
          protestedDocs: 0,
        }];
      });

      updateRows(realRows);
      alert(`تعداد ${toPersianDigits(realRows.length)} سطر واقعی از موافقت‌نامه‌های بودجه‌ای ثبت‌شده فراخوانی گردید.`);
    } catch (err) {
      console.error("خطا در فراخوانی موافقت‌نامه‌های بودجه:", err);
      alert("خطا در دریافت موافقت‌نامه‌های بودجه‌ای از سرور.");
    } finally {
      setIsLoadingAgreements(false);
    }
  };

  // همگام‌سازی خودکار ردیف‌ها با کدهای معین احصا شده از دفاتر اسناد
  const handleAutoFillFromMoein = () => {
    if (onSyncMoein) {
      onSyncMoein();
    }
    
    // مقادیر معین از نقشه کدهای دفتر معین
    const m91001 = moeinBalancesMap["91001"] || 0;
    const m93001 = (moeinBalancesMap["93001"] || 0) + (moeinBalancesMap["91501"] || 0) + (moeinBalancesMap["93501"] || 0);
    const mReceived = (moeinBalancesMap["41001"] || 0) + (moeinBalancesMap["41005"] || 0) + (moeinBalancesMap["81017_expense"] || moeinBalancesMap["81017"] || 0) + (moeinBalancesMap["81010_expense"] || moeinBalancesMap["81010"] || 0) + (moeinBalancesMap["81019"] || 0);
    const m99001 = moeinBalancesMap["99001"] || 0;
    const m98001 = moeinBalancesMap["98001"] || 0;
    const mDeficit = (moeinBalancesMap["81007"] || 0) + (moeinBalancesMap["93501"] || 0);
    const m92501 = moeinBalancesMap["92501"] || 0;

    if (programRows.length > 0 && (m91001 > 0 || m93001 > 0 || mReceived > 0 || m99001 > 0)) {
      const updated = programRows.map((r) => {
        const ratio = 1 / programRows.length;
        return {
          ...r,
          allocatedCredit: m93001 > 0 ? Math.round(m93001 * ratio) : r.allocatedCredit,
          receivedCredit: mReceived > 0 ? Math.round(mReceived * ratio) : r.receivedCredit,
          consumedCredit: m99001 > 0 ? Math.round(m99001 * ratio) : r.consumedCredit,
          prepayment: m98001 > 0 ? Math.round(m98001 * ratio) : r.prepayment,
          deficit: mDeficit > 0 ? Math.round(mDeficit * ratio) : r.deficit,
          protestedDocs: m92501 > 0 ? Math.round(m92501 * ratio) : r.protestedDocs,
        };
      });
      updateRows(updated);
    }
  };

  // محاسبات مجموع سرجمع کدهای سطری
  const calculatedTotals = useMemo(() => {
    return programRows.reduce(
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
        const transBonds = rec - cons; // اوراق انتقالی محاسباتی: تفاوت دریافت شده و مصرف شده

        const inv = Number(r.inventories) || 0;
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
        prepayment: 0,
        deficit: 0,
        protestedDocs: 0,
      }
    );
  }, [programRows]);

  return (
    <div className="space-y-4 text-right select-none dir-rtl">
      
      {/* ─── کارت‌های شاخص‌های کلیدی (KPIs) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>بودجه اعتبار نهایی</span>
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
              ۹۳۰۰۱ | ۹۱۵۰۱
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
              ۴۱۰۰۱ | ۸۱۰۱۰
            </Badge>
          </div>
          <div className="text-sm font-mono font-bold text-purple-800 dark:text-purple-200 mt-1.5">
            {formatPersianAmount(calculatedTotals.receivedCredit)} <span className="text-[10px]">ریال</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span>اعتبار مصرف شده</span>
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
            <Layers className="h-3.5 w-3.5" />
            <span>تعداد برنامه‌ها: {toPersianDigits(programRows.length)} سطر</span>
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            فرمت سطری تفکیک برنامه‌های عملکرد هزینه‌ای عمومی
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleLoadRealAgreements}
            disabled={isLoadingAgreements}
            className="h-8 text-xs font-bold gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>فراخوانی از موافقت‌نامه‌ها</span>
          </Button>

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
            <span>افزودن برنامه جدید</span>
          </Button>
        </div>
      </div>

      {/* ─── جدول تفصیلی و سطری عملکرد بر حسب برنامه ─── */}
      <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-[11px] border-collapse min-w-[1700px]">
            {/* هدر گروهی و تک‌ستونی */}
            <thead>
              {/* سطر ۱: سرگروه‌های اصلی */}
              <tr className="bg-muted/80 text-muted-foreground text-center font-bold border-b border-border/80">
                <th colSpan={5} className="p-2 border-r border-border/60 bg-primary/5 text-primary">
                  مشخصات پایه برنامه بودجه‌ای
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
                <th colSpan={4} className="p-2 border-r border-border/60 bg-amber-500/5 text-amber-700 dark:text-amber-400">
                  موجودی، پیش پرداخت و سایر حساب‌ها
                </th>
                <th colSpan={1} className="p-2 bg-muted/90 text-center">
                  عملیات
                </th>
              </tr>

              {/* سطر ۲: عنوان دقیق ۲۱ ستون */}
              <tr className="bg-muted/50 text-foreground font-bold text-center border-b border-border/80 divide-x divide-x-reverse divide-border/60">
                <th className="p-2 w-10">#</th>
                <th className="p-2 min-w-[180px]">عنوان برنامه</th>
                <th className="p-2 min-w-[100px]">کد برنامه</th>
                <th className="p-2 min-w-[80px]">نوع اعتبار</th>
                <th className="p-2 min-w-[120px]">ابلاغ دهنده</th>

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
                  <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">۹۳۰۰۱ | ۹۱۵۰۱ | ۹۳۵۰۱</span>
                </th>

                <th className="p-2 min-w-[140px] bg-purple-50/50 dark:bg-purple-950/20 text-purple-800">
                  اعتبار دریافت شده <br/>
                  <span className="text-[9px] font-mono bg-purple-100 text-purple-800 px-1 rounded">۴۱۰۰۱ | ۴۱۰۰۳ | ۴۱۰۰۵ | ۸۱۰۱۷ | ۸۱۰۱۰ | ۸۱۰۱۹</span>
                </th>
                <th className="p-2 min-w-[130px] bg-amber-50/50 dark:bg-amber-950/20 text-amber-800">
                  اعتبار مصرف شده <br/>
                  <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1 rounded">۹۹۰۰۱</span>
                </th>

                <th className="p-2 min-w-[110px]">وجوه انتقالی (وجه نقد)</th>
                <th className="p-2 min-w-[130px] bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-800">
                  اوراق انتقالی <br/>
                  <span className="text-[9px] font-normal text-muted-foreground">(محاسباتی: دریافتی - مصرف)</span>
                </th>

                <th className="p-2 min-w-[100px]">موجودی‌ها</th>
                <th className="p-2 min-w-[110px]">
                  پیش پرداخت <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۹۸۰۰۱</span>
                </th>
                <th className="p-2 min-w-[110px]">
                  کسری ابواب جمعی <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۸۱۰۰۷ | ۹۳۵۰۱</span>
                </th>
                <th className="p-2 min-w-[110px]">
                  اسناد واخواهی شده <br/>
                  <span className="text-[9px] font-mono bg-muted px-1 rounded">۹۲۵۰۱</span>
                </th>

                <th className="p-2 w-12 text-center">حذف</th>
              </tr>
            </thead>

            {/* بدنه سطرها */}
            <tbody className="divide-y divide-border/60">
              {programRows.length === 0 && (
                <tr>
                  <td colSpan={21} className="p-10 text-center bg-muted/5">
                    <div className="max-w-md mx-auto space-y-3">
                      <Layers className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                      <h4 className="text-xs font-bold text-foreground">
                        هیچ سطر برنامه‌ای ثبت نشده است
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        می‌توانید برنامه‌ها را به‌صورت دستی ایجاد نمایید یا از موافقت‌نامه‌های بودجه‌ای ثبت‌شده در سیستم فراخوانی نمایید.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleLoadRealAgreements}
                          disabled={isLoadingAgreements}
                          variant="outline"
                          className="text-xs font-bold gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-500/40"
                        >
                          <Landmark className="h-3.5 w-3.5" />
                          <span>فراخوانی موافقت‌نامه‌ها</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddRow}
                          className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>افزودن سطر جدید</span>
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {programRows.map((row, index) => {
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

                    {/* عنوان برنامه */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        value={row.programTitle}
                        onChange={(e) => handleCellChange(row.id, "programTitle", e.target.value)}
                        className="h-8 text-xs font-medium bg-background/80"
                        placeholder="عنوان برنامه..."
                      />
                    </td>

                    {/* کد برنامه */}
                    <td className="p-1.5">
                      <Input
                        type="text"
                        dir="ltr"
                        value={row.programCode}
                        onChange={(e) => handleCellChange(row.id, "programCode", e.target.value)}
                        className="h-8 text-xs font-mono text-center bg-background/80"
                        placeholder="کد..."
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
                            list={`notifiers_${row.id}`}
                            value={row.notifier && row.notifier !== "-" ? row.notifier : ""}
                            onChange={(e) => handleCellChange(row.id, "notifier", e.target.value)}
                            className={cn(
                              "h-8 text-xs font-medium bg-background border-amber-500/80 focus:ring-amber-500",
                              (!row.notifier || row.notifier === "-" || row.notifier.trim() === "") && "border-rose-500 bg-rose-50/20"
                            )}
                            placeholder="ردیف ابلاغی دستگاه (مثلاً 109000)..."
                          />
                          <datalist id={`notifiers_${row.id}`}>
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

                    {/* اعتبار تخصیص یافته (۹۳۰۰۱...) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.allocatedCredit}
                        onChange={(val) => handleCellChange(row.id, "allocatedCredit", val)}
                        textColor="text-blue-800"
                      />
                    </td>

                    {/* اعتبار دریافت شده (۴۱۰۰۱...) */}
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

                    {/* وجوه انتقالی (وجه نقد) */}
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

                    {/* موجودی‌ها */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.inventories}
                        onChange={(val) => handleCellChange(row.id, "inventories", val)}
                      />
                    </td>

                    {/* پیش پرداخت (۹۸۰۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.prepayment}
                        onChange={(val) => handleCellChange(row.id, "prepayment", val)}
                      />
                    </td>

                    {/* کسری ابواب جمعی (۸۱۰۰۷ / ۹۳۵۰۱) */}
                    <td className="p-1.5">
                      <PersianAmountInput
                        value={row.deficit}
                        onChange={(val) => handleCellChange(row.id, "deficit", val)}
                        textColor="text-rose-700"
                      />
                    </td>

                    {/* اسناد واخواهی شده (۹۲۵۰۱) */}
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
            {programRows.length > 0 && (
              <tfoot>
                <tr className="bg-primary/10 text-primary-foreground font-bold text-xs border-t-2 border-primary/40 divide-x divide-x-reverse divide-primary/20">
                  <td colSpan={5} className="p-3 text-right text-foreground font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>سرجمع کل عملکرد اعتبارات بر حسب برنامه ({toPersianDigits(programRows.length)} برنامه):</span>
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

                  {/* مجموع موجودی‌ها */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.inventories)}
                  </td>

                  {/* مجموع پیش پرداخت (۹۸۰۰۱) */}
                  <td className="p-2.5 text-center font-mono font-bold text-foreground">
                    {formatPersianAmount(calculatedTotals.prepayment)}
                  </td>

                  {/* مجموع کسری ابواب جمعی */}
                  <td className="p-2.5 text-center font-mono font-bold text-rose-700 dark:text-rose-400">
                    {formatPersianAmount(calculatedTotals.deficit)}
                  </td>

                  {/* مجموع اسناد واخواهی */}
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

      {/* ─── راهنمای کدهای معین و قوانین سناما ─── */}
      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">راهنمای استانداردهای خزانه‌داری (سناما) در فرم خلاصه عملکرد بر حسب برنامه:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground leading-relaxed">
            <li>فیلدهای بودجه اولیه، افزایش، کاهش، مستندات قانونی و وجوه انتقالی به‌صورت <b>دستی</b> یا از طریق ثبت‌های بودجه‌ای تکمیل می‌گردند.</li>
            <li>فیلد <b>خالص افزایش و کاهش</b> به‌صورت محاسباتی حاصل تفاضل افزایش از کاهش می‌باشد.</li>
            <li>فیلد <b>بودجه اعتبار نهایی</b> مرتبط با کد معین <b>۹۱۰۰۱</b> بوده و از مجموع اعتبار اولیه و خالص تغییرات به دست می‌آید.</li>
            <li>اعتبارات تخصیص یافته متصل به کدهای معین <b>۹۳۰۰۱، ۹۱۵۰۱ و ۹۳۵۰۱</b>، دریافتی متصل به کدهای <b>۴۱۰۰۱، ۴۱۰۰۳، ۴۱۰۰۵، ۸۱۰۱۷، ۸۱۰۱۰ و ۸۱۰۱۹</b> و اعتبار مصرف شده متصل به کد <b>۹۹۰۰۱</b> می‌باشند.</li>
            <li>فیلد <b>اوراق انتقالی</b> به‌صورت خودکار از تفاوت بین <b>اعتبار دریافت شده</b> با <b>اعتبار مصرف شده</b> محاسبه می‌گردد.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
