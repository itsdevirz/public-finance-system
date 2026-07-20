import { useState, useEffect } from "react";
import {
  FileSpreadsheet, Download, Save, CheckCircle2, AlertTriangle,
  RefreshCw, Layers, Calculator, HelpCircle, Eye, Printer, Filter, ShieldCheck
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { validateSanamaPerformanceForms } from "@/lib/sanamaPerformanceValidation";

// ─── ثوابت و مقادیر اولیه فرم‌های سناما ──────────────────────────────────────────

const INITIAL_FORM1 = {
  initialBudget: 1000000000,
  increase: 100000000,
  decrease: 50000000,
  drafts: 800000000,
  legalAdjustments: 0,
};

const INITIAL_FORM_4_6_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 250000000 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 200000000 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 180000000 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 150000000 },
  { id: 5, title: "پیش پرداخت", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 10000000 },
  { id: 6, title: "پیش پرداخت اعتبار اسنادی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 7, title: "علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 10000000 },
  { id: 8, title: "اسناد واخواهی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501", approvedAmount: 0 },
  { id: 9, title: "کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93501", approvedAmount: 0 },
  { id: 10, title: "وجوه انتقالی (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 10000000, isCalculated: true },
  { id: 11, title: "اوراق انتقالی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_7_5_CAPITAL = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "91002 / -94002", approvedAmount: 500000000 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "93002 / 97002 / 98002 / 99002 / 92502 / 93502", approvedAmount: 400000000 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "41003 / 81010 / 81017 / 81019 / -94002", approvedAmount: 380000000 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "99002", approvedAmount: 300000000 },
  { id: 5, title: "موجودی‌ها", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 20000000 },
  { id: 6, title: "پیش پرداخت", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 30000000 },
  { id: 7, title: "پیش پرداخت مواد و کالا", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 8, title: "پیش پرداخت اعتبار اسنادی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 9, title: "علی‌الحساب", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 15000000 },
  { id: 10, title: "اسناد واخواهی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "92502", approvedAmount: 0 },
  { id: 11, title: "کسری ابواب جمعی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93502", approvedAmount: 0 },
  { id: 12, title: "وجوه انتقالی (محاسباتی)", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 15000000, isCalculated: true },
  { id: 13, title: "اوراق انتقالی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_8_RESOURCES = [
  { id: 1, resourceKind: "درآمد عمومی", expectedMoein: "81008", receivedMoein: "71001 / 81013", sentMoein: "71001 / 81013", expectedAmount: 1000000000, receivedAmount: 950000000, sentAmount: 950000000 },
  { id: 2, resourceKind: "درآمد اختصاصی", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 200000000, receivedAmount: 180000000, sentAmount: 180000000 },
  { id: 3, resourceKind: "واگذاری دارایی مالی (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 4, resourceKind: "واگذاری دارایی سرمایه‌ای (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 500000000, receivedAmount: 480000000, sentAmount: 480000000 },
  { id: 5, resourceKind: "واگذاری دارایی سرمایه‌ای (اختصاصی)", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
];

const INITIAL_FORM_9 = {
  prepayments: { initialBalance: 100000000, consumedTransferred: 40000000, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 10000000, yearEndBalance: 50000000, moeinExpense: "98003", moeinCapital: "98004" },
  inventories: { initialBalance: 50000000, consumedTransferred: 20000000, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 5000000, yearEndBalance: 25000000, moeinExpense: "98003", moeinCapital: "98004" },
  onAccounts: { initialBalance: 60000000, consumedTransferred: 30000000, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 10000000, yearEndBalance: 20000000, moeinExpense: "98003", moeinCapital: "98004" }
};

const INITIAL_FORM_10 = [
  { id: 1, section: "وجوه انتقالی", initialBalance: 150000000, nonFinalPrevYears: 20000000, objectionDeficitPrevYears: 0, investmentsPrevYears: 0, transferredDraftsExpense: 94003, transferredDraftsCapital: 94004, receivedNotifiedBonds: "81010 / 81019 / 81017", consumedTransferred: 100000000, prepayments: 10000000, onAccounts: 10000000, sentToTreasury: 10000000, objectionTransferred: 92503, deficitTransferred: 93503, yearEndMoeinApproved: "91501 / 97003", yearEndMoeinNotified: "95003" },
  { id: 2, section: "سرمایه‌گذاری", initialBalance: 50000000, transferredFunds: 50000000, deficitTransferred: 93503, yearEndBalance: 0 }
];

const INITIAL_FORM_11 = [
  { id: 1, rowType: "سطر اسناد واخواهی شده", initialBalance: 30000000, consumedTransferred: 10000000, sentToTreasury: 5000000, deficit: 0, moeinExpense: "92503", moeinCapital: "92504" },
  { id: 2, rowType: "سطر کسری ابواب جمعی (دارای مانده)", initialBalance: 15000000, consumedTransferred: 5000000, sentToTreasury: 0, yearEndMoeinExpense: "93503", yearEndMoeinCapital: "93504" },
  { id: 3, rowType: "سطر کسری ابواب جمعی برداشتی", initialBalance: 10000000, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "81007", yearEndMoeinCapital: "81007" },
];

const INITIAL_FORM_13 = [
  { id: 1, rowType: "اوراق دریافتی", accountType: "o", creditType: "مصوب / ابلاغی", moeinExpenseApproved: "41001 / 41006 / 81010 / 81017 / -94001", moeinExpenseNotified: "81010 / 81017", moeinCapitalApproved: "41003 / 81010 / 81017 / -94002", moeinCapitalNotified: "81010 / 81017", amount: 500000000 },
  { id: 2, rowType: "اوراق واگذار شده", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "99001 / 98001 / 92501 / 93501", moeinExpenseNotified: "", moeinCapitalApproved: "99002 / 98002 / 92502 / 93502", moeinCapitalNotified: "", amount: 450000000 },
  { id: 3, rowType: "اوراق مصرف نشده (قفل)", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "قفل شده", moeinExpenseNotified: "", moeinCapitalApproved: "قفل شده", moeinCapitalNotified: "", amount: 0 },
  { id: 4, rowType: "اوراق انتقالی", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "81010", moeinExpenseNotified: "81010", moeinCapitalApproved: "81010", moeinCapitalNotified: "81010", amount: 50000000 },
];

export default function SanamaFormsViewer() {
  const [activeTab, setActiveTab] = useState("form1");
  const [form1Data, setForm1Data] = useState(INITIAL_FORM1);
  const [form46Data, setForm46Data] = useState(INITIAL_FORM_4_6_EXPENSE);
  const [form75Data, setForm75Data] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form8Data, setForm8Data] = useState(INITIAL_FORM_8_RESOURCES);
  const [form9Data, setForm9Data] = useState(INITIAL_FORM_9);
  const [form10Data, setForm10Data] = useState(INITIAL_FORM_10);
  const [form11Data, setForm11Data] = useState(INITIAL_FORM_11);
  const [form13Data, setForm13Data] = useState(INITIAL_FORM_13);
  const [auditErrors, setAuditErrors] = useState([]);

  // فرمول‌های محاسباتی فرم ۱
  const calculatedForm1Final = form1Data.initialBudget + form1Data.legalAdjustments + form1Data.increase - form1Data.decrease - form1Data.drafts;

  // فرمول‌های محاسباتی فرم ۹ (وجوه انتقالی)
  const calculateForm9Transferred = (sec) => {
    return sec.initialBalance - (sec.consumedTransferred + (sec.inventory || 0) + sec.objectionTransferred + sec.deficitTransferred + sec.sentToTreasury + sec.yearEndBalance);
  };

  // فرمول‌های محاسباتی فرم ۴-۶
  const f46Received = form46Data.find(r => r.id === 3)?.approvedAmount || 0;
  const f46Consumed = form46Data.find(r => r.id === 4)?.approvedAmount || 0;
  const f46Prepay = form46Data.find(r => r.id === 5)?.approvedAmount || 0;
  const f46PrepayLetter = form46Data.find(r => r.id === 6)?.approvedAmount || 0;
  const f46OnAccount = form46Data.find(r => r.id === 7)?.approvedAmount || 0;
  const f46Objection = form46Data.find(r => r.id === 8)?.approvedAmount || 0;
  const f46Deficit = form46Data.find(r => r.id === 9)?.approvedAmount || 0;
  const f46Bonds = form46Data.find(r => r.id === 11)?.approvedAmount || 0;
  const calculatedF46Transferred = f46Received - (f46Consumed + f46Prepay + f46PrepayLetter + f46OnAccount + f46Objection + f46Deficit + f46Bonds);

  useEffect(() => {
    const auditPayload = [
      {
        id: "FORM-1",
        form_type: 1,
        credit_type: "مصوب",
        credit_location: "استانی",
        program_number: "10101",
        final_credit_budget: calculatedForm1Final,
        initial_credit_budget: form1Data.initialBudget,
        increase: form1Data.increase,
        decrease: form1Data.decrease,
        drafts: form1Data.drafts,
        legal_adjustments: form1Data.legalAdjustments,
        allocated_credit: form46Data.find(r => r.id === 2)?.approvedAmount || 0,
        received_credit: f46Received,
        consumed_credit: f46Consumed,
      },
      {
        id: "FORM-4-6",
        form_type: 4,
        credit_type: "ابلاغی",
        credit_location: "متمرکز",
        program_number: "10102",
        notifier_budget_row: "102000",
        executive_body_budget_row: "101000",
        final_credit_budget: form46Data.find(r => r.id === 1)?.approvedAmount || 0,
        allocated_credit: form46Data.find(r => r.id === 2)?.approvedAmount || 0,
        received_credit: f46Received,
        consumed_credit: f46Consumed,
      }
    ];

    const errs = validateSanamaPerformanceForms(auditPayload);
    setAuditErrors(errs);
  }, [form1Data, form46Data, form75Data, form9Data]);

  return (
    <PageShell>
      <PageHeader
        title="فرم‌های جامع سناما (وزارت امور اقتصادی و دارایی)"
        description="مشاهده، تکمیل، محاسبه خودکار و ممیزی فرم‌های ۱، ۴-۶، ۵-۷، ۸، ۹، ۱۰، ۱۱ و ۱۳ سناما"
      />

      {/* ─── هشدار ممیزی هوشمند ─── */}
      {auditErrors.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/70 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ممیزی سناما فعال است</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  تعداد {auditErrors.length} عدم تطابق در موازنه و کدهای معین فرم‌های سناما شناسایی شد.
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-[11px]">
              {auditErrors.length} خطای سناما
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ─── منوی تب‌های فرم‌های ۸‌گانه ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 bg-muted/60 p-1.5 rounded-xl mb-6 overflow-x-auto">
          <TabsTrigger value="form1" className="text-[11px] font-bold py-2">فرم ۱</TabsTrigger>
          <TabsTrigger value="form46" className="text-[11px] font-bold py-2">فرم ۴-۶</TabsTrigger>
          <TabsTrigger value="form75" className="text-[11px] font-bold py-2">فرم ۵-۷</TabsTrigger>
          <TabsTrigger value="form8" className="text-[11px] font-bold py-2">فرم ۸</TabsTrigger>
          <TabsTrigger value="form9" className="text-[11px] font-bold py-2">فرم ۹</TabsTrigger>
          <TabsTrigger value="form10" className="text-[11px] font-bold py-2">فرم ۱۰</TabsTrigger>
          <TabsTrigger value="form11" className="text-[11px] font-bold py-2">فرم ۱۱</TabsTrigger>
          <TabsTrigger value="form13" className="text-[11px] font-bold py-2">فرم ۱۳</TabsTrigger>
        </TabsList>

        {/* ════════════════════════ فرم ۱ ════════════════════════ */}
        <TabsContent value="form1">
          <Card className="border shadow-sm">
            <CardHeader className="bg-lime-50/60 dark:bg-lime-950/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-lime-900 dark:text-lime-300">
                    فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    تعیین بودجه اولیه، افزایش، کاهش، حواله‌ها و محاسبه خودکار بودجه اعتبار نهایی با معین‌های ۹۱۰۰۱ و ۹۴۰۰۱-
                  </CardDescription>
                </div>
                <Badge className="bg-lime-600 text-white text-xs">معین ۹۱۰۰۱ / ۹۴۰۰۱-</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-lime-200">
                  <thead>
                    <tr className="bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-200 font-bold border-b border-lime-300">
                      <th className="p-3 border-l border-lime-300">عنوان ستون</th>
                      <th className="p-3 border-l border-lime-300">نوع حساب</th>
                      <th className="p-3 border-l border-lime-300">حساب معین</th>
                      <th className="p-3 border-l border-lime-300">سطوح تفصیلی</th>
                      <th className="p-3">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lime-100">
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-slate-800">بودجه اعتبار اولیه</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                      <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={form1Data.initialBudget}
                          onChange={(e) => setForm1Data({ ...form1Data, initialBudget: Number(e.target.value) })}
                          className="h-8 text-xs font-mono"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-emerald-700">افزایش (+)</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                      <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={form1Data.increase}
                          onChange={(e) => setForm1Data({ ...form1Data, increase: Number(e.target.value) })}
                          className="h-8 text-xs font-mono text-emerald-700"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-rose-700">کاهش (-)</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                      <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={form1Data.decrease}
                          onChange={(e) => setForm1Data({ ...form1Data, decrease: Number(e.target.value) })}
                          className="h-8 text-xs font-mono text-rose-700"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-blue-700">حواله (-)</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-bold text-blue-800">94001</td>
                      <td className="p-3 text-slate-500">سطوح تفصیلی مطابق الزامات سناما</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={form1Data.drafts}
                          onChange={(e) => setForm1Data({ ...form1Data, drafts: Number(e.target.value) })}
                          className="h-8 text-xs font-mono text-blue-700"
                        />
                      </td>
                    </tr>
                    <tr className="bg-lime-200/60 font-black text-slate-900">
                      <td className="p-3">بودجه اعتبار نهایی (محاسباتی)</td>
                      <td className="p-3">هزینه</td>
                      <td className="p-3 font-mono">91001 / -94001</td>
                      <td className="p-3 text-slate-700">مطابق الزامات پروتکل تبادل الکترونیکی</td>
                      <td className="p-3 font-mono text-sm text-lime-900">
                        {calculatedForm1Final.toLocaleString("fa-IR")} ریال
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۴-۶ ════════════════════════ */}
        <TabsContent value="form46">
          <Card className="border shadow-sm">
            <CardHeader className="bg-amber-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-amber-900">
                فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-amber-100 text-amber-900 font-bold border-b">
                      <th className="p-3 border-l w-12 text-center">ردیف</th>
                      <th className="p-3 border-l">عنوان ستون</th>
                      <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                      <th className="p-3 border-l w-28 text-center">اعتبار</th>
                      <th className="p-3 border-l font-mono">حساب معین</th>
                      <th className="p-3 w-44">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form46Data.map((row) => (
                      <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-amber-100/50 font-bold")}>
                        <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                        <td className="p-3 text-center font-mono">{row.accountType}</td>
                        <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">{row.moeinCodes}</td>
                        <td className="p-2">
                          {row.isCalculated ? (
                            <div className="p-2 font-mono font-black text-amber-900 bg-amber-200/50 rounded text-center">
                              {calculatedF46Transferred.toLocaleString("fa-IR")}
                            </div>
                          ) : (
                            <Input
                              type="number"
                              value={row.approvedAmount}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setForm46Data(form46Data.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r));
                              }}
                              className="h-8 text-xs font-mono"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۵-۷ ════════════════════════ */}
        <TabsContent value="form75">
          <Card className="border shadow-sm">
            <CardHeader className="bg-emerald-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-emerald-900">
                فرم ۵-۷ — اعتبارات سرمایه‌ای (نوع حساب t)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-900 font-bold border-b">
                      <th className="p-3 border-l w-12 text-center">ردیف</th>
                      <th className="p-3 border-l">عنوان ستون</th>
                      <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                      <th className="p-3 border-l w-28 text-center">اعتبار</th>
                      <th className="p-3 border-l font-mono">حساب معین سناما</th>
                      <th className="p-3 w-44">مبلغ مصوب (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form75Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                        <td className="p-3 text-center font-mono">{row.accountType}</td>
                        <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                        <td className="p-3 font-mono text-emerald-700 font-semibold">{row.moeinCodes}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.approvedAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setForm75Data(form75Data.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r));
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۸ ════════════════════════ */}
        <TabsContent value="form8">
          <Card className="border shadow-sm">
            <CardHeader className="bg-blue-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-blue-900">
                فرم ۸ — منابع و درآمدهای عمومی و اختصاصی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-blue-100 text-blue-900 font-bold border-b">
                      <th className="p-3 border-l w-12 text-center">ردیف</th>
                      <th className="p-3 border-l">ماهیت منابع</th>
                      <th className="p-3 border-l font-mono">معین پیش‌بینی</th>
                      <th className="p-3 border-l font-mono">معین وصول</th>
                      <th className="p-3 border-l font-mono">معین ارسال به خزانه</th>
                      <th className="p-3 w-32">پیش‌بینی</th>
                      <th className="p-3 w-32">وصول</th>
                      <th className="p-3 w-32">ارسال به خزانه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form8Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-mono font-semibold">{row.id}</td>
                        <td className="p-3 font-bold text-slate-800">{row.resourceKind}</td>
                        <td className="p-3 font-mono text-slate-600">{row.expectedMoein}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">{row.receivedMoein}</td>
                        <td className="p-3 font-mono text-emerald-700 font-semibold">{row.sentMoein}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.expectedAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, expectedAmount: val } : r));
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.receivedAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, receivedAmount: val } : r));
                            }}
                            className="h-8 text-xs font-mono text-blue-700"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.sentAmount}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, sentAmount: val } : r));
                            }}
                            className="h-8 text-xs font-mono text-emerald-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۹ ════════════════════════ */}
        <TabsContent value="form9">
          <Card className="border shadow-sm">
            <CardHeader className="bg-purple-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-purple-900">
                فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {/* پیش پرداخت‌ها */}
              <div className="border rounded-xl p-4 bg-purple-50/20">
                <h4 className="font-bold text-xs text-purple-900 mb-3">سطر پیش پرداخت‌ها (معین ۹۸۰۰۳ / ۹۸۰۰۴)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                    <Input type="number" value={form9Data.prepayments.initialBalance} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, initialBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                    <Input type="number" value={form9Data.prepayments.consumedTransferred} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, consumedTransferred: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                    <Input type="number" value={form9Data.prepayments.sentToTreasury} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, sentToTreasury: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده پایان سال (معین ۹۸۰۰۳/۹۸۰۰۴)</label>
                    <Input type="number" value={form9Data.prepayments.yearEndBalance} onChange={e => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, yearEndBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1 text-purple-700 font-bold" />
                  </div>
                </div>
                <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                  <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                  <span>{calculateForm9Transferred(form9Data.prepayments).toLocaleString("fa-IR")} ریال</span>
                </div>
              </div>

              {/* موجودی‌ها */}
              <div className="border rounded-xl p-4 bg-purple-50/20">
                <h4 className="font-bold text-xs text-purple-900 mb-3">سطر موجودی‌ها (معین ۹۸۰۰۳ / ۹۸۰۰۴)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                    <Input type="number" value={form9Data.inventories.initialBalance} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, initialBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                    <Input type="number" value={form9Data.inventories.consumedTransferred} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, consumedTransferred: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                    <Input type="number" value={form9Data.inventories.sentToTreasury} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, sentToTreasury: Number(e.target.value)}})} className="h-8 font-mono mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                    <Input type="number" value={form9Data.inventories.yearEndBalance} onChange={e => setForm9Data({...form9Data, inventories: {...form9Data.inventories, yearEndBalance: Number(e.target.value)}})} className="h-8 font-mono mt-1 text-purple-700 font-bold" />
                  </div>
                </div>
                <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                  <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                  <span>{calculateForm9Transferred(form9Data.inventories).toLocaleString("fa-IR")} ریال</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۱۰ ════════════════════════ */}
        <TabsContent value="form10">
          <Card className="border shadow-sm">
            <CardHeader className="bg-teal-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-teal-900">
                فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-teal-100 text-teal-900 font-bold border-b">
                      <th className="p-3 border-l">عنوان بخش</th>
                      <th className="p-3 border-l font-mono">حواله انتقالی</th>
                      <th className="p-3 border-l font-mono">دریافتی از اعتبار انتقالی</th>
                      <th className="p-3 border-l font-mono">اعتبار مصرف شده</th>
                      <th className="p-3 border-l font-mono">مانده پایان سال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form10Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{row.section}</td>
                        <td className="p-3 font-mono text-teal-700 font-semibold">{row.transferredDraftsExpense || row.transferredFunds}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">{row.receivedNotifiedBonds || "-"}</td>
                        <td className="p-3 font-mono font-bold">{row.consumedTransferred?.toLocaleString("fa-IR") || "-"}</td>
                        <td className="p-3 font-mono text-emerald-800 font-black">{row.yearEndMoeinApproved || row.yearEndBalance || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۱۱ ════════════════════════ */}
        <TabsContent value="form11">
          <Card className="border shadow-sm">
            <CardHeader className="bg-indigo-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-indigo-900">
                فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-indigo-100 text-indigo-900 font-bold border-b">
                      <th className="p-3 border-l">عنوان سطر</th>
                      <th className="p-3 border-l font-mono">معین هزینه‌ای</th>
                      <th className="p-3 border-l font-mono">معین سرمایه‌ای</th>
                      <th className="p-3 w-36">مانده ابتدای سال</th>
                      <th className="p-3 w-36">مصرف شده</th>
                      <th className="p-3 w-36">ارسال به خزانه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form11Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                        <td className="p-3 font-mono text-indigo-700 font-semibold">{row.moeinExpense || row.yearEndMoeinExpense}</td>
                        <td className="p-3 font-mono text-indigo-700 font-semibold">{row.moeinCapital || row.yearEndMoeinCapital}</td>
                        <td className="p-2 font-mono">{row.initialBalance.toLocaleString("fa-IR")}</td>
                        <td className="p-2 font-mono">{row.consumedTransferred.toLocaleString("fa-IR")}</td>
                        <td className="p-2 font-mono">{row.sentToTreasury.toLocaleString("fa-IR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۱۳ ════════════════════════ */}
        <TabsContent value="form13">
          <Card className="border shadow-sm">
            <CardHeader className="bg-cyan-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-cyan-900">
                فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-cyan-100 text-cyan-900 font-bold border-b">
                      <th className="p-3 border-l">عنوان ستون</th>
                      <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                      <th className="p-3 border-l font-mono">معین هزینه‌ای مصوب</th>
                      <th className="p-3 border-l font-mono">معین سرمایه‌ای مصوب</th>
                      <th className="p-3 w-40">مبلغ اوراق (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form13Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                        <td className="p-3 text-center font-mono">{row.accountType}</td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{row.moeinExpenseApproved}</td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{row.moeinCapitalApproved}</td>
                        <td className="p-3 font-mono font-bold text-cyan-900">{row.amount.toLocaleString("fa-IR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </PageShell>
  );
}
