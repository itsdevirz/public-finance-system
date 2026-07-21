import { useState, useEffect } from "react";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, FileText,
  Building2, ArrowLeftRight, Search, Info, Layers, Check, FileCheck2, Filter,
  FileSpreadsheet, Download, Save, Calculator, HelpCircle, Eye, Printer, LayoutDashboard,
  Pencil, X
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import api from "@/api";
import { validateSanamaPerformanceForms, SANAMA_PERFORMANCE_RULES } from "@/lib/sanamaPerformanceValidation";

// ─── توابع کمکی تبدیل و نمایش اعداد به فارسی ──────────────────────────────────────────
export function toPersianDigits(n) {
  if (n === null || n === undefined) return "";
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

export function formatPersianAmount(val) {
  if (val === null || val === undefined || val === "") return "۰";
  const num = Number(val);
  if (isNaN(num)) return toPersianDigits(val);
  return toPersianDigits(num.toLocaleString("fa-IR"));
}

export function PersianAmountInput({ value, onChange, className = "", disabled = false, textColor = "" }) {
  const displayVal = (value !== undefined && value !== null && value !== "")
    ? toPersianDigits(Number(value).toLocaleString("fa-IR"))
    : "۰";

  return (
    <Input
      type="text"
      dir="ltr"
      disabled={disabled}
      value={displayVal}
      onChange={(e) => {
        const raw = e.target.value
          .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
          .replace(/,/g, "")
          .replace(/\D/g, "");
        const num = raw ? Number(raw) : 0;
        onChange(num);
      }}
      className={cn("h-8 text-xs font-mono text-center font-bold", textColor, className)}
    />
  );
}

const INITIAL_FORM1 = {
  initialBudget: 0,
  increase: 0,
  decrease: 0,
  drafts: 0,
  legalAdjustments: 0,
};

const INITIAL_FORM_4_6_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 0 },
  { id: 5, title: "پیش پرداخت", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 6, title: "پیش پرداخت اعتبار اسنادی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 7, title: "علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 8, title: "اسناد واخواهی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501", approvedAmount: 0 },
  { id: 9, title: "کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93501", approvedAmount: 0 },
  { id: 10, title: "وجوه انتقالی (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
  { id: 11, title: "اوراق انتقالی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_5_7_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل تخصیص هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده هزینه‌ای", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 0 },
  { id: 5, title: "پیش پرداخت و علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 6, title: "اسناد واخواهی و کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501 / 81007 / 93501", approvedAmount: 0 },
  { id: 7, title: "وجوه انتقالی سالانه (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
];

const INITIAL_FORM_7_5_CAPITAL = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "91002 / -94002", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "93002 / 97002 / 98002 / 99002 / 92502 / 93502", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "41003 / 81010 / 81017 / 81019 / -94002", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "99002", approvedAmount: 0 },
  { id: 5, title: "موجودی‌ها", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 6, title: "پیش پرداخت", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 7, title: "پیش پرداخت مواد و کالا", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 8, title: "پیش پرداخت اعتبار اسنادی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 9, title: "علی‌الحساب", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 10, title: "اسناد واخواهی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "92502", approvedAmount: 0 },
  { id: 11, title: "کسری ابواب جمعی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93502", approvedAmount: 0 },
  { id: 12, title: "وجوه انتقالی (محاسباتی)", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
  { id: 13, title: "اوراق انتقالی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_8_RESOURCES = [
  { id: 1, resourceKind: "درآمد عمومی", expectedMoein: "81008", receivedMoein: "71001 / 81013", sentMoein: "71001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 2, resourceKind: "درآمد اختصاصی", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 3, resourceKind: "واگذاری دارایی مالی (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 4, resourceKind: "واگذاری دارایی سرمایه‌ای (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 5, resourceKind: "واگذاری دارایی سرمایه‌ای (اختصاصی)", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
];

const INITIAL_FORM_9 = {
  prepayments: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003", moeinCapital: "98004" },
  inventories: { initialBalance: 0, consumedTransferred: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003", moeinCapital: "98004" },
  onAccounts: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003", moeinCapital: "98004" }
};

const INITIAL_FORM_10 = [
  { id: 1, section: "وجوه انتقالی", initialBalance: 0, nonFinalPrevYears: 0, objectionDeficitPrevYears: 0, investmentsPrevYears: 0, transferredDraftsExpense: 94003, transferredDraftsCapital: 94004, receivedNotifiedBonds: "81010 / 81019 / 81017", consumedTransferred: 0, prepayments: 0, onAccounts: 0, sentToTreasury: 0, objectionTransferred: 92503, deficitTransferred: 93503, yearEndMoeinApproved: "91501 / 97003", yearEndMoeinNotified: "95003" },
  { id: 2, section: "سرمایه‌گذاری", initialBalance: 0, transferredFunds: 0, deficitTransferred: 93503, yearEndBalance: 0 }
];

const INITIAL_FORM_11 = [
  { id: 1, rowType: "سطر اسناد واخواهی شده", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, deficit: 0, moeinExpense: "92503", moeinCapital: "92504" },
  { id: 2, rowType: "سطر کسری ابواب جمعی (دارای مانده)", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "93503", yearEndMoeinCapital: "93504" },
  { id: 3, rowType: "سطر کسری ابواب جمعی برداشتی", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "81007", yearEndMoeinCapital: "81007" },
];

const INITIAL_FORM_13 = [
  { id: 1, rowType: "اوراق دریافتی", accountType: "o", creditType: "مصوب / ابلاغی", moeinExpenseApproved: "41001 / 41006 / 81010 / 81017 / -94001", moeinExpenseNotified: "81010 / 81017", moeinCapitalApproved: "41003 / 81010 / 81017 / -94002", moeinCapitalNotified: "81010 / 81017", amount: 0 },
  { id: 2, rowType: "اوراق واگذار شده", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "99001 / 98001 / 92501 / 93501", moeinExpenseNotified: "", moeinCapitalApproved: "99002 / 98002 / 92502 / 93502", moeinCapitalNotified: "", amount: 0 },
  { id: 3, rowType: "اوراق مصرف نشده (قفل)", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "قفل شده", moeinExpenseNotified: "", moeinCapitalApproved: "قفل شده", moeinCapitalNotified: "", amount: 0 },
  { id: 4, rowType: "اوراق انتقالی", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "81010", moeinExpenseNotified: "81010", moeinCapitalApproved: "81010", moeinCapitalNotified: "81010", amount: 0 },
];

export function getFixPathwayInfo(code) {
  let formTab = "form1";
  let formName = "فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه";
  let steps = [
    "۱. در تب‌های بالای صفحه به «فرم ۱» مراجعه نمایید.",
    "۲. مبالغ اولیه، افزایش، کاهش یا حواله‌ها را بررسی و اصلاح کنید.",
    "۳. فرمول بودجه اعتبار نهایی (اولیه + استنادات + افزایش - کاهش - حواله) را موازنه نمایید."
  ];

  if ([106, 3010, 3011].includes(code)) {
    formTab = "form1";
    formName = "فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه و حواله‌ها";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱» منتقل شوید.",
      "۲. ستون حواله‌ها و مانده حساب معین ۹۴۰۰۱ / ۹۴۰۰۲ را اعمال نمایید.",
      "۳. از صحت موازنه حواله‌ها با ابلاغ اعتبار اطمینان حاصل کنید."
    ];
  } else if ([23, 24, 25, 26, 27, 40, 41, 42, 44, 45, 46, 49, 50, 53, 54, 60, 61, 62, 63, 64, 65, 66, 67, 68, 70, 71, 812, 813, 1204, 1448, 1451, 1452, 1462, 3250, 3251, 3252, 3253, 3254, 3255, 3256, 3257, 3258].includes(code)) {
    formTab = "form46";
    formName = "فرم ۴-۶ / ۵-۷ / ۴-۴ — اعتبارات هزینه، طرح‌های تملک و تخصیص خزانه";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۴-۶»، «فرم ۵-۷» یا «فرم ۴-۴» منتقل شوید.",
      "۲. مبالغ مصوب، تخصیص‌یافته، دریافتی و تطابق تخصیص خزانه را بازبینی نمایید.",
      "۳. از عدم مغایرت حساب ابلاغ‌گیرنده با حوالجات ابلاغ‌دهنده اطمینان حاصل کنید."
    ];
  } else if ([253, 254, 801, 803, 804, 807, 808, 809, 810, 814, 815, 816, 817, 818, 819, 820, 3218].includes(code)) {
    formTab = "form8";
    formName = "فرم ۸ — منابع و درآمدهای عمومی و اختصاصی";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۸» منتقل شوید.",
      "۲. فیلدهای پیش‌بینی، وصولی و وجوه ارسالی به خزانه ردیف درآمدی را تنظیم نمایید.",
      "۳. شماره طبقه‌بندی (مانند ۱۴۰۱۱۶ و ۱۴۰۱۴۹) و کد معین وصول/ارسال به خزانه را مطابقت دهید."
    ];
  } else if ([901, 902, 903, 904, 905, 906, 907, 908, 1008].includes(code)) {
    formTab = "form9";
    formName = "فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۹» منتقل شوید.",
      "۲. مبالغ مانده ابتدای سال و مانده پایان سال سطر مورد نظر را اصلاح نمایید.",
      "۳. از صحت فرمول محاسباتی وجوه انتقالی و عدم تکراری بودن عنوان مطمئن شوید."
    ];
  } else if ([271, 272, 320, 811, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1062, 1156, 3012, 3013, 3233, 3234, 3235, 3236, 3237, 3238].includes(code)) {
    formTab = "form10";
    formName = "فرم ۱۰ — وجوه انتقالی، سرمایه‌گذاری‌ها و تراز سرفصل‌های ۹۴۰۰۳/۹۴۰۰۴ و ۹۱۰۰۳/۹۱۰۰۴";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱۰» منتقل شوید.",
      "۲. مبالغ حواله انتقالی، حساب‌های معین ۹۴۰۰۳ و ۹۴۰۰۴ و گردش کار سال قبل را بررسی فرمایید.",
      "۳. موازنه منابع انتقالی قابل مصرف با سرفصل‌های ۹۱۰۰۳ و ۹۱۰۰۴ تراز حساب‌ها را انجام دهید."
    ];
  } else if ([507, 1101, 1102, 1103, 1104, 1105, 1106, 1159, 1160].includes(code)) {
    formTab = "form11";
    formName = "فرم ۱۱ / ۱۲ — اسناد واخواهی شده، کسری ابواب جمعی و فرم ۱۲";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱۱» یا «فرم ۱۲» منتقل شوید.",
      "۲. عنوان سطر و مانده ابتدای سال اسناد واخواهی/کسری ابواب‌جمعی را وارد کنید.",
      "۳. وضعیت فرم را در صورت وجود اسناد انتقالی روی «واخواهی» تنظیم نمایید."
    ];
  } else if ([1302, 1303, 1304, 1305, 1307, 1308, 1309, 1310, 1311, 1313, 1362].includes(code)) {
    formTab = "form13";
    formName = "فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱۳» منتقل شوید.",
      "۲. مبالغ اوراق دریافتی، واگذار شده، مصرف‌نشده و اوراق انتقالی را موازنه نمایید.",
      "۳. در اعتبارات ابلاغی از ردیف ابلاغ دهنده و شماره طبقه‌بندی یکتا استفاده کنید."
    ];
  }

  return { formTab, formName, steps };
}

function FixPathwayModal({ error, onClose, onNavigate }) {
  if (!error) return null;
  const info = getFixPathwayInfo(error.code);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-amber-500 bg-background animate-in fade-in zoom-in duration-200">
        <CardHeader className="bg-amber-600 text-white p-4 flex flex-row items-center justify-between rounded-t-xl">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-200" />
              <span>مسیر اصلاح و برطرف‌سازی خطای سناما (کد {toPersianDigits(error.code)})</span>
            </CardTitle>
            <CardDescription className="text-xs text-amber-100 font-sans mt-1">
              شناسه ردیف / بخش مربوطه: <strong className="text-white font-mono">{toPersianDigits(error.itemRef || "اقلام فرم سناما")}</strong>
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white hover:bg-amber-700 h-8 w-8 p-0 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>شرح مغایرت شناسایی‌شده:</span>
            </p>
            <p className="leading-relaxed text-xs font-semibold pr-5">{error.message}</p>
          </div>

          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>مسیر خطایابی و مراحل برطرف‌سازی:</span>
            </h4>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 font-bold rounded-lg text-xs">
              فرم هدف: {info.formName}
            </div>
            <ul className="space-y-1.5 pt-1 text-slate-600 dark:text-slate-300">
              {info.steps.map((st, sIdx) => (
                <li key={sIdx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{toPersianDigits(st)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2 border-t mt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 text-xs">
              انصراف
            </Button>
            <Button
              onClick={() => onNavigate(info.formTab)}
              className="w-full sm:w-auto h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow"
            >
              <Pencil className="h-4 w-4" />
              <span>انتقال مستقیم به فرم و اصلاح فیلد</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SanamaPerformanceControls() {
  const [mainMode, setMainMode] = useState("forms"); // "forms" یا "audit"
  const [activeFormTab, setActiveFormTab] = useState("form1");

  // وضعیت ممیزی و قوانین
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [selectedRuleCode, setSelectedRuleCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedCount, setCheckedCount] = useState(0);

  // وضعیت فرم‌های استاندارد سناما
  const [form1Data, setForm1Data] = useState(INITIAL_FORM1);
  const [form46Data, setForm46Data] = useState(INITIAL_FORM_4_6_EXPENSE);
  const [form57ExpData, setForm57ExpData] = useState(INITIAL_FORM_5_7_EXPENSE);
  const [form75CapData, setForm75CapData] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form8Data, setForm8Data] = useState(INITIAL_FORM_8_RESOURCES);
  const [form9Data, setForm9Data] = useState(INITIAL_FORM_9);
  const [form10Data, setForm10Data] = useState(INITIAL_FORM_10);
  const [form11Data, setForm11Data] = useState(INITIAL_FORM_11);
  const [form13Data, setForm13Data] = useState(INITIAL_FORM_13);
  // وضعیت مدال راهنمای هوشمند مسیر رفع خطا
  const [fixPathwayError, setFixPathwayError] = useState(null);

  // بارگذاری داده‌های واقعی از دیتابیس
  useEffect(() => {
    const loadSavedForms = async () => {
      try {
        const res = await api.get("/api/credits/sanama-forms");
        if (res.data?.data) {
          const d = res.data.data;
          if (d.form1Data) setForm1Data(d.form1Data);
          if (d.form46Data) setForm46Data(d.form46Data);
          if (d.form57ExpData) setForm57ExpData(d.form57ExpData);
          if (d.form75CapData) setForm75CapData(d.form75CapData);
          if (d.form8Data) setForm8Data(d.form8Data);
          if (d.form9Data) setForm9Data(d.form9Data);
          if (d.form10Data) setForm10Data(d.form10Data);
          if (d.form11Data) setForm11Data(d.form11Data);
          if (d.form13Data) setForm13Data(d.form13Data);
        }
      } catch (e) {
        console.error("خطا در دریافت فرم‌های ذخیره‌شده سناما:", e);
      }
    };
    loadSavedForms();
  }, []);

  // ویرایش سریع ردیف خطادار
  const [editingItem, setEditingItem] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [editForm, setEditForm] = useState({
    project_number: "",
    misc_row_number: "",
    financial_assets_row_number: "",
    program_number: "",
    notifier_budget_row: "",
    credit_type: "مصوب",
  });

  const openEditModal = (itemRef) => {
    setModalError(null);
    setModalSuccess(null);
    const target = items.find(it => String(it.id) === String(itemRef)) 
      || items[0];
    if (!target) return;
    
    setEditingItem(target);
    setEditForm({
      project_number: target.project_number || "",
      misc_row_number: target.misc_row_number || "",
      financial_assets_row_number: target.financial_assets_row_number || "",
      program_number: target.program_number || "",
      notifier_budget_row: target.notifier_budget_row || "",
      credit_type: target.credit_type || "مصوب",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setModalError(null);
    setModalSuccess(null);

    // اعتبارسنجی مقادیر ضروری برای رفع خطای ۱۳۲ و ۱۳۱
    const { project_number, misc_row_number, financial_assets_row_number } = editForm;
    if (!project_number?.trim() && !misc_row_number?.trim() && !financial_assets_row_number?.trim()) {
      setModalError("علت عدم اعمال: حداقل یکی از فیلدهای «شماره طرح»، «شماره ردیف متفرقه» یا «شماره ردیف تملک دارایی‌های مالی» باید مقداردهی شود تا خطای ۱۳۲ خزانه‌داری برطرف گردد.");
      return;
    }

    setModalSaving(true);
    try {
      const payload = {
        ...editForm,
        notifierRow: editForm.notifier_budget_row,
        creditKind: editForm.credit_type === "ابلاغی" ? "notified" : "approved",
        capital: {
          ...(editingItem.raw?.capital || {}),
          projectNumber: editForm.project_number
        },
        expense: {
          ...(editingItem.raw?.expense || {}),
          programNumber: editForm.program_number
        }
      };

      const targetId = editingItem.raw?._id || editingItem.id;
      if (targetId && String(targetId).length === 24) {
        await api.put(`/api/credits/definitions/${targetId}`, payload);
      }

      setModalSuccess("اصلاحات با موفقیت در سناما و دیتابیس اعتبارات ذخیره شد.");

      // فراخوانی مجدد اطلاعات جهت بروزرسانی فیلترها و ممیزی
      await fetchData();

      setTimeout(() => {
        setEditingItem(null);
        setModalSaving(false);
      }, 1000);
    } catch (err) {
      console.error("Error saving SANAMA definition edit:", err);
      const errMsg = err?.response?.data?.message || err?.message || "خطا در برقراری ارتباط با سرور و ثبت اطلاعات.";
      setModalError(`علت عدم اعمال: ${errMsg}`);
      setModalSaving(false);
    }
  };

  // محاسبات فرم ۱
  const calculatedForm1Final = form1Data.initialBudget + form1Data.legalAdjustments + form1Data.increase - form1Data.decrease - form1Data.drafts;

  // محاسبات فرم ۹ (وجوه انتقالی)
  const calculateForm9Transferred = (sec) => {
    return sec.initialBalance - (sec.consumedTransferred + (sec.inventory || 0) + sec.objectionTransferred + sec.deficitTransferred + sec.sentToTreasury + sec.yearEndBalance);
  };

  // محاسبات فرم ۴-۶
  const f46Received = form46Data.find(r => r.id === 3)?.approvedAmount || 0;
  const f46Consumed = form46Data.find(r => r.id === 4)?.approvedAmount || 0;
  const f46Prepay = form46Data.find(r => r.id === 5)?.approvedAmount || 0;
  const f46PrepayLetter = form46Data.find(r => r.id === 6)?.approvedAmount || 0;
  const f46OnAccount = form46Data.find(r => r.id === 7)?.approvedAmount || 0;
  const f46Objection = form46Data.find(r => r.id === 8)?.approvedAmount || 0;
  const f46Deficit = form46Data.find(r => r.id === 9)?.approvedAmount || 0;
  const calculatedF46Transferred = f46Received - (f46Consumed + f46Prepay + f46PrepayLetter + f46OnAccount + f46Objection + f46Deficit);

  // محاسبات فرم ۵-۷ هزینه‌ای
  const f57ExpReceived = form57ExpData.find(r => r.id === 3)?.approvedAmount || 0;
  const f57ExpConsumed = form57ExpData.find(r => r.id === 4)?.approvedAmount || 0;
  const f57ExpPrepay = form57ExpData.find(r => r.id === 5)?.approvedAmount || 0;
  const f57ExpObjection = form57ExpData.find(r => r.id === 6)?.approvedAmount || 0;
  const calculatedF57ExpTransferred = f57ExpReceived - (f57ExpConsumed + f57ExpPrepay + f57ExpObjection);

  // بارگذاری داده‌ها و اعتبارسنجی واقعی
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/credits/definitions");
      const list = res.data?.data || [];
      const mapped = list.map((item, idx) => ({
        id: item._id || idx + 1,
        project_number: item.project_number || item.capital?.projectNumber || "",
        program_number: item.program_number || item.expense?.programNumber || "",
        misc_row_number: item.misc_row_number || "",
        financial_assets_row_number: item.financial_assets_row_number || "",
        credit_type: item.creditKind === "notified" ? "ابلاغی" : (item.credit_type || "مصوب"),
        credit_location: item.credit_location || (item.creditKind === "notified" ? "متمرکز" : "استانی"),
        receipt_location: item.receipt_location || "استانی",
        notifier_budget_row: item.notifierRow || item.notifier_budget_row || "",
        executive_body_budget_row: item.executive_body_budget_row || "101000",
        final_credit_budget: Number(item.final_credit_budget ?? item.amount ?? 0),
        initial_credit_budget: Number(item.initial_credit_budget ?? item.amount ?? 0),
        allocated_credit: Number(item.allocated_credit ?? item.amount ?? 0),
        received_credit: Number(item.received_credit ?? item.amount ?? 0),
        consumed_credit: Number(item.consumed_credit ?? 0),
        non_final_payments: Number(item.non_final_payments ?? 0),
        transferred_bonds: Number(item.transferred_bonds ?? 0),
        other_consumption: Number(item.other_consumption ?? 0),
        legal_adjustments: Number(item.legal_adjustments ?? 0),
        legal_adjustments_row: item.legal_adjustments_row || "",
        increase: Number(item.increase ?? 0),
        decrease: Number(item.decrease ?? 0),
        drafts: Number(item.drafts ?? 0),
        special_revenue_received: Number(item.special_revenue_received ?? 0),
        form_type: item.form_type || 1,
        title: item.title || item.expense?.expenseChapter || item.capital?.projectTitle || `اعتبار ردیف ${idx + 1}`,
        raw: item,
      }));

      setItems(mapped);
      runValidation(mapped);
    } catch (err) {
      console.error("خطا در دریافت اطلاعات:", err);
      setItems([]);
      runValidation([]);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = (data) => {
    const errs = validateSanamaPerformanceForms(data);
    setErrors(errs);
    setCheckedCount(data.length);
  };

  useEffect(() => {
    fetchData();
  }, [form1Data, form46Data, form57ExpData, form75CapData, form9Data]);

  const filteredRules = SANAMA_PERFORMANCE_RULES
    .filter(rule => 
      rule.title.includes(searchTerm) || 
      rule.desc.includes(searchTerm) || 
      String(rule.code).includes(searchTerm)
    )
    .sort((a, b) => a.code - b.code);

  const activeErrors = (selectedRuleCode 
    ? errors.filter(e => e.code === selectedRuleCode)
    : errors).slice().sort((a, b) => a.code - b.code);

  const handleExportExcel = () => {
    let title = "";
    let headers = [];
    let rows = [];

    if (activeFormTab === "form1") {
      title = "فرم ۱ — موافقت‌نامه / عملکرد اعتبار مصوب هزینه‌ای";
      headers = ["عنوان ستون", "نوع حساب", "حساب معین", "سطوح تفصیلی", "مبلغ (ریال)"];
      rows = [
        ["بودجه اعتبار اولیه", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.initialBudget],
        ["افزایش (+)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.increase],
        ["کاهش (-)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.decrease],
        ["حواله (-)", "هزینه", "94001", "سطوح تفصیلی مطابق الزامات پروتکل الکترونیکی", form1Data.drafts],
        ["بودجه اعتبار نهایی (محاسباتی)", "هزینه", "91001 / -94001", "مطابق الزامات پروتکل تبادل الکترونیکی", calculatedForm1Final]
      ];
    } else if (activeFormTab === "form46") {
      title = "فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی معین)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ (ریال)"];
      rows = form46Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF46Transferred : r.approvedAmount]);
    } else if (activeFormTab === "form57exp") {
      title = "فرم ۵-۷ — اعتبارات هزینه (تراز عملکرد هزینه‌ای)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form57ExpData.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF57ExpTransferred : r.approvedAmount]);
    } else if (activeFormTab === "form75cap") {
      title = "فرم ۵-۷ — اعتبارات سرمایه‌ای (تملک دارایی‌های سرمایه‌ای)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form75CapData.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.approvedAmount]);
    } else if (activeFormTab === "form8") {
      title = "فرم ۸ — منابع و درآمدهای عمومی و اختصاصی";
      headers = ["ردیف", "ماهیت منابع", "معین پیش‌بینی", "معین وصول", "معین ارسال به خزانه", "پیش‌بینی", "وصول", "ارسال به خزانه"];
      rows = form8Data.map(r => [r.id, r.resourceKind, r.expectedMoein, r.receivedMoein, r.sentMoein, r.expectedAmount, r.receivedAmount, r.sentAmount]);
    } else if (activeFormTab === "form9") {
      title = "فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب";
      headers = ["عنوان", "مانده ابتدای سال", "اعتبار انتقالی مصرف شده", "وجوه ارسالی به خزانه", "وجوه انتقالی (محاسباتی)", "مانده پایان سال"];
      rows = [
        ["پیش‌پرداخت‌ها", form9Data.prepayments.initialBalance, form9Data.prepayments.consumedTransferred, form9Data.prepayments.sentToTreasury, calculateForm9Transferred(form9Data.prepayments), form9Data.prepayments.yearEndBalance],
        ["موجودی‌ها", form9Data.inventories.initialBalance, form9Data.inventories.consumedTransferred, form9Data.inventories.sentToTreasury, calculateForm9Transferred(form9Data.inventories), form9Data.inventories.yearEndBalance],
        ["علی‌الحساب", form9Data.onAccounts.initialBalance, form9Data.onAccounts.consumedTransferred, form9Data.onAccounts.sentToTreasury, calculateForm9Transferred(form9Data.onAccounts), form9Data.onAccounts.yearEndBalance],
      ];
    } else if (activeFormTab === "form10") {
      title = "فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها";
      headers = ["عنوان بخش", "حواله انتقالی", "دریافتی از اعتبار انتقالی", "اعتبار مصرف شده", "مانده پایان سال"];
      rows = form10Data.map(r => [r.section, r.transferredDraftsExpense || r.transferredFunds, r.receivedNotifiedBonds || "-", r.consumedTransferred || "-", r.yearEndMoeinApproved || r.yearEndBalance || "-"]);
    } else if (activeFormTab === "form11") {
      title = "فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی";
      headers = ["عنوان سطر", "معین هزینه‌ای", "معین سرمایه‌ای", "مانده ابتدای سال", "مصرف شده", "ارسال به خزانه"];
      rows = form11Data.map(r => [r.rowType, r.moeinExpense || r.yearEndMoeinExpense, r.moeinCapital || r.yearEndMoeinCapital, r.initialBalance, r.consumedTransferred, r.sentToTreasury]);
    } else if (activeFormTab === "form13") {
      title = "فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی";
      headers = ["عنوان ستون", "نوع حساب", "معین هزینه‌ای مصوب", "معین سرمایه‌ای مصوب", "مبلغ اوراق (ریال)"];
      rows = form13Data.map(r => [r.rowType, r.accountType, r.moeinExpenseApproved, r.moeinCapitalApproved, r.amount]);
    }

    let csvContent = "\uFEFF";
    csvContent += `${title}\n\n`;
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

    rows.forEach(r => {
      csvContent += r.map(c => {
        if (typeof c === "number") return `"${toPersianDigits(c.toLocaleString("fa-IR"))}"`;
        return `"${toPersianDigits(c)}"`;
      }).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sanama_${activeFormTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    let title = "";
    let headers = [];
    let rows = [];

    if (activeFormTab === "form1") {
      title = "فرم ۱ — موافقت‌نامه / عملکرد اعتبار مصوب هزینه‌ای";
      headers = ["عنوان ستون", "نوع حساب", "حساب معین", "سطوح تفصیلی", "مبلغ (ریال)"];
      rows = [
        ["بودجه اعتبار اولیه", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.initialBudget],
        ["افزایش (+)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.increase],
        ["کاهش (-)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.decrease],
        ["حواله (-)", "هزینه", "94001", "سطوح تفصیلی مطابق الزامات پروتکل الکترونیکی", form1Data.drafts],
        ["بودجه اعتبار نهایی (محاسباتی)", "هزینه", "91001 / -94001", "مطابق الزامات پروتکل تبادل الکترونیکی", calculatedForm1Final]
      ];
    } else if (activeFormTab === "form46") {
      title = "فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی معین)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ (ریال)"];
      rows = form46Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF46Transferred : r.approvedAmount]);
    } else if (activeFormTab === "form57exp") {
      title = "فرم ۵-۷ — اعتبارات هزینه (تراز عملکرد هزینه‌ای)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form57ExpData.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF57ExpTransferred : r.approvedAmount]);
    } else if (activeFormTab === "form75cap") {
      title = "فرم ۵-۷ — اعتبارات سرمایه‌ای (تملک دارایی‌های سرمایه‌ای)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form75CapData.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.approvedAmount]);
    } else if (activeFormTab === "form8") {
      title = "فرم ۸ — منابع و درآمدهای عمومی و اختصاصی";
      headers = ["ردیف", "ماهیت منابع", "معین پیش‌بینی", "معین وصول", "معین ارسال به خزانه", "پیش‌بینی", "وصول", "ارسال به خزانه"];
      rows = form8Data.map(r => [r.id, r.resourceKind, r.expectedMoein, r.receivedMoein, r.sentMoein, r.expectedAmount, r.receivedAmount, r.sentAmount]);
    } else if (activeFormTab === "form9") {
      title = "فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب";
      headers = ["عنوان", "مانده ابتدای سال", "اعتبار انتقالی مصرف شده", "وجوه ارسالی به خزانه", "وجوه انتقالی (محاسباتی)", "مانده پایان سال"];
      rows = [
        ["پیش‌پرداخت‌ها", form9Data.prepayments.initialBalance, form9Data.prepayments.consumedTransferred, form9Data.prepayments.sentToTreasury, calculateForm9Transferred(form9Data.prepayments), form9Data.prepayments.yearEndBalance],
        ["موجودی‌ها", form9Data.inventories.initialBalance, form9Data.inventories.consumedTransferred, form9Data.inventories.sentToTreasury, calculateForm9Transferred(form9Data.inventories), form9Data.inventories.yearEndBalance],
        ["علی‌الحساب", form9Data.onAccounts.initialBalance, form9Data.onAccounts.consumedTransferred, form9Data.onAccounts.sentToTreasury, calculateForm9Transferred(form9Data.onAccounts), form9Data.onAccounts.yearEndBalance],
      ];
    } else if (activeFormTab === "form10") {
      title = "فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها";
      headers = ["عنوان بخش", "حواله انتقالی", "دریافتی از اعتبار انتقالی", "اعتبار مصرف شده", "مانده پایان سال"];
      rows = form10Data.map(r => [r.section, r.transferredDraftsExpense || r.transferredFunds, r.receivedNotifiedBonds || "-", r.consumedTransferred || "-", r.yearEndMoeinApproved || r.yearEndBalance || "-"]);
    } else if (activeFormTab === "form11") {
      title = "فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی";
      headers = ["عنوان سطر", "معین هزینه‌ای", "معین سرمایه‌ای", "مانده ابتدای سال", "مصرف شده", "ارسال به خزانه"];
      rows = form11Data.map(r => [r.rowType, r.moeinExpense || r.yearEndMoeinExpense, r.moeinCapital || r.yearEndMoeinCapital, r.initialBalance, r.consumedTransferred, r.sentToTreasury]);
    } else if (activeFormTab === "form13") {
      title = "فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی";
      headers = ["عنوان ستون", "نوع حساب", "معین هزینه‌ای مصوب", "معین سرمایه‌ای مصوب", "مبلغ اوراق (ریال)"];
      rows = form13Data.map(r => [r.rowType, r.accountType, r.moeinExpenseApproved, r.moeinCapitalApproved, r.amount]);
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const tableHeadHtml = headers.map(h => `<th>${h}</th>`).join("");
    const tableRowsHtml = rows.map(r => `<tr>${r.map(c => `<td>${typeof c === 'number' ? toPersianDigits(c.toLocaleString('fa-IR')) : toPersianDigits(c)}</td>`).join("")}</tr>`).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Tahoma, Vazir, sans-serif; font-size: 11px; direction: rtl; color: #111; padding: 15px; }
          .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
          .hdr h1 { font-size: 16px; margin: 0; color: #1e3a8a; font-weight: bold; }
          .hdr p { font-size: 10px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #94a3b8; padding: 8px 10px; text-align: right; font-size: 10px; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 25px; font-size: 9px; color: #64748b; text-align: left; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <div>
            <h1>وزارت امور اقتصادی و دارایی - خزانه‌داری کل کشور</h1>
            <p>سامانه نظارت آنی خزانه‌داری (سناما) — ${title}</p>
          </div>
          <div style="text-align: left;">
            <div>تاریخ گزارش: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
            <div>ارز: ریال ایران</div>
          </div>
        </div>
        <table>
          <thead><tr>${tableHeadHtml}</tr></thead>
          <tbody>${tableRowsHtml}</tbody>
        </table>
        <div class="footer">ایجاد شده توسط سیستم جامع مالی و حسابداری عمومی</div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 350);
          };
        </script>
      </body>
      </html>
    `);
  };

  return (
    <PageShell>
      <PageHeader 
        title="ممیزی و نمایش فرم‌های عملکرد سناما (خزانه‌داری کل کشور)" 
        description="مشاهده، تکمیل، موازنه هوشمند و ممیزی ۲۲ ضابطه و کنترل‌های استاندارد وزارت دارایی"
      />

      {/* ─── نوار سوئیچ اصلی (فرم‌ها / داشبورد ممیزی) ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900 text-white p-3 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100">سامانه نظارت آنی خزانه‌داری کل (سناما)</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">کنترل موازنه، معین‌ها و انطباق فرم‌های عملکرد مالی ۱ تا ۱۳</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto justify-center">
          <Button
            size="sm"
            variant={mainMode === "forms" ? "default" : "ghost"}
            onClick={() => setMainMode("forms")}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-4",
              mainMode === "forms" && "bg-blue-600 text-white shadow-md hover:bg-blue-700"
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>فرم‌های استاندارد سناما (۹ فرم)</span>
          </Button>

          <Button
            size="sm"
            variant={mainMode === "audit" ? "default" : "ghost"}
            onClick={() => setMainMode("audit")}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-4 relative",
              mainMode === "audit" && "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>ممیزی هوشمند قوانین ({errors.length} خطا)</span>
            {errors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </Button>
        </div>
      </div>

      {/* ─── خلاصه وضعیت خطاهای سناما ─── */}
      {errors.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/70 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ممیزی آنلاین سناما فعال است</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  تعداد {errors.length} مغایرت موازنه و کد معین در فرم‌های فعال عملکرد شناسایی شد.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMainMode("audit")}
              className="text-xs gap-1.5 h-8 border-amber-400 text-amber-900 hover:bg-amber-100"
            >
              <span>مشاهده ریز مغایرت‌ها</span>
              <Badge variant="destructive" className="text-[10px]">{errors.length}</Badge>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════ حالت ۱: نمایش فرم‌های ۹‌گانه ════════════════════════ */}
      {mainMode === "forms" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                عملیات خروجی و گزارش‌گیری فرم فعال سناما:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                className="text-xs font-bold gap-1.5 h-8 border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <Download className="h-3.5 w-3.5" />
                <span>خروجی اکسل (Excel)</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                className="text-xs font-bold gap-1.5 h-8 border-rose-600 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>خروجی PDF / چاپ</span>
              </Button>
            </div>
          </div>

          <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 bg-slate-200/70 dark:bg-slate-800/70 p-1.5 rounded-xl mb-6 overflow-x-auto">
              <TabsTrigger value="form1" className="text-[11px] font-bold py-2">فرم ۱</TabsTrigger>
              <TabsTrigger value="form46" className="text-[11px] font-bold py-2">فرم ۴-۶</TabsTrigger>
              <TabsTrigger value="form57exp" className="text-[11px] font-bold py-2">۵-۷ هزینه</TabsTrigger>
              <TabsTrigger value="form75cap" className="text-[11px] font-bold py-2 text-emerald-700 dark:text-emerald-400">۵-۷ سرمایه</TabsTrigger>
              <TabsTrigger value="form8" className="text-[11px] font-bold py-2 text-blue-700 dark:text-blue-400">فرم ۸</TabsTrigger>
              <TabsTrigger value="form9" className="text-[11px] font-bold py-2 text-purple-700 dark:text-purple-400">فرم ۹</TabsTrigger>
              <TabsTrigger value="form10" className="text-[11px] font-bold py-2 text-teal-700 dark:text-teal-400">فرم ۱۰</TabsTrigger>
              <TabsTrigger value="form11" className="text-[11px] font-bold py-2 text-indigo-700 dark:text-indigo-400">فرم ۱۱</TabsTrigger>
              <TabsTrigger value="form13" className="text-[11px] font-bold py-2 text-cyan-700 dark:text-cyan-400">فرم ۱۳</TabsTrigger>
            </TabsList>

            {/* ─── فرم ۱ ─── */}
            <TabsContent value="form1">
              <Card className="border shadow-sm">
                <CardHeader className="bg-lime-50/70 dark:bg-lime-950/20 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black text-lime-900 dark:text-lime-300">
                        فرم ۱ — موافقت‌نامه / عملکرد اعتبار مصوب هزینه‌ای
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        تنظیم اولیه، افزایش، کاهش، حواله‌ها و محاسبه خودکار بودجه اعتبار نهایی با معین‌های ۹۱۰۰۱ و ۹۴۰۰۱-
                      </CardDescription>
                    </div>
                    <Badge className="bg-lime-600 text-white text-xs px-3 py-1">معین ۹۱۰۰۱ / ۹۴۰۰۱-</Badge>
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
                          <th className="p-3 w-48">مبلغ (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lime-100">
                        <tr className="hover:bg-lime-50/40">
                          <td className="p-3 font-bold text-slate-800">بودجه اعتبار اولیه</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.initialBudget} onChange={(val) => setForm1Data({ ...form1Data, initialBudget: val })} />
                          </td>
                        </tr>
                        <tr className="hover:bg-lime-50/40">
                          <td className="p-3 font-bold text-emerald-700">افزایش (+)</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.increase} onChange={(val) => setForm1Data({ ...form1Data, increase: val })} textColor="text-emerald-700" />
                          </td>
                        </tr>
                        <tr className="hover:bg-lime-50/40">
                          <td className="p-3 font-bold text-rose-700">کاهش (-)</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.decrease} onChange={(val) => setForm1Data({ ...form1Data, decrease: val })} textColor="text-rose-700" />
                          </td>
                        </tr>
                        <tr className="hover:bg-lime-50/40">
                          <td className="p-3 font-bold text-blue-700">حواله (-)</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-bold text-blue-800">{toPersianDigits("94001")}</td>
                          <td className="p-3 text-slate-500">سطوح تفصیلی مطابق الزامات پروتکل الکترونیکی</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.drafts} onChange={(val) => setForm1Data({ ...form1Data, drafts: val })} textColor="text-blue-700" />
                          </td>
                        </tr>
                        <tr className="bg-lime-200/70 font-black text-slate-900">
                          <td className="p-3">بودجه اعتبار نهایی (محاسباتی)</td>
                          <td className="p-3">هزینه</td>
                          <td className="p-3 font-mono">{toPersianDigits("91001 / -94001")}</td>
                          <td className="p-3 text-slate-700">مطابق الزامات پروتکل تبادل الکترونیکی</td>
                          <td className="p-3 font-mono text-sm text-lime-900">
                            {formatPersianAmount(calculatedForm1Final)} ریال
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* ─── فرم ۴-۶ ─── */}
          <TabsContent value="form46">
            <Card className="border shadow-sm">
              <CardHeader className="bg-amber-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-amber-900">
                  فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی معین)
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
                        <th className="p-3 border-l font-mono">حساب معین سناما</th>
                        <th className="p-3 w-48">مبلغ (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form46Data.map((row) => (
                        <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-amber-100/50 font-bold")}>
                          <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                          <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                          <td className="p-2">
                            {row.isCalculated ? (
                              <div className="p-2 font-mono font-black text-amber-900 bg-amber-200/60 rounded text-center">
                                {formatPersianAmount(calculatedF46Transferred)}
                              </div>
                            ) : (
                              <PersianAmountInput
                                value={row.approvedAmount}
                                onChange={(val) => setForm46Data(form46Data.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
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

          {/* ─── فرم ۵-۷ اعتبارات هزینه ─── */}
          <TabsContent value="form57exp">
            <Card className="border shadow-sm">
              <CardHeader className="bg-blue-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-blue-900">
                  فرم ۵-۷ — اعتبارات هزینه (تراز عملکرد هزینه‌ای)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-blue-100 text-blue-900 font-bold border-b">
                        <th className="p-3 border-l w-12 text-center">ردیف</th>
                        <th className="p-3 border-l">عنوان ستون</th>
                        <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                        <th className="p-3 border-l w-28 text-center">اعتبار</th>
                        <th className="p-3 border-l font-mono">حساب معین سناما</th>
                        <th className="p-3 w-48">مبلغ مصوب (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form57ExpData.map((row) => (
                        <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-blue-100/50 font-bold")}>
                          <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                          <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                          <td className="p-2">
                            {row.isCalculated ? (
                              <div className="p-2 font-mono font-black text-blue-900 bg-blue-200/60 rounded text-center">
                                {formatPersianAmount(calculatedF57ExpTransferred)}
                              </div>
                            ) : (
                              <PersianAmountInput
                                value={row.approvedAmount}
                                onChange={(val) => setForm57ExpData(form57ExpData.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
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

          {/* ─── فرم ۵-۷ اعتبارات سرمایه‌ای ─── */}
          <TabsContent value="form75cap">
            <Card className="border shadow-sm">
              <CardHeader className="bg-emerald-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-emerald-900">
                  فرم ۵-۷ — اعتبارات سرمایه‌ای (تملک دارایی‌های سرمایه‌ای - نوع حساب t)
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
                        <th className="p-3 w-48">مبلغ مصوب (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form75CapData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                          <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                          <td className="p-3 font-mono text-emerald-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                          <td className="p-2">
                            <PersianAmountInput
                              value={row.approvedAmount}
                              onChange={(val) => setForm75CapData(form75CapData.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
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

          {/* ─── فرم ۸ منابع ─── */}
          <TabsContent value="form8">
            <Card className="border shadow-sm">
              <CardHeader className="bg-blue-50/70 border-b pb-4">
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
                          <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                          <td className="p-3 font-bold text-slate-800">{row.resourceKind}</td>
                          <td className="p-3 font-mono text-slate-600">{toPersianDigits(row.expectedMoein)}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.receivedMoein)}</td>
                          <td className="p-3 font-mono text-emerald-700 font-semibold">{toPersianDigits(row.sentMoein)}</td>
                          <td className="p-2">
                            <PersianAmountInput value={row.expectedAmount} onChange={(val) => setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, expectedAmount: val } : r))} />
                          </td>
                          <td className="p-2">
                            <PersianAmountInput value={row.receivedAmount} onChange={(val) => setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, receivedAmount: val } : r))} textColor="text-blue-700" />
                          </td>
                          <td className="p-2">
                            <PersianAmountInput value={row.sentAmount} onChange={(val) => setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, sentAmount: val } : r))} textColor="text-emerald-700" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۹ ─── */}
          <TabsContent value="form9">
            <Card className="border shadow-sm">
              <CardHeader className="bg-purple-50/70 border-b pb-4">
                <CardTitle className="text-base font-black text-purple-900">
                  فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="border rounded-xl p-4 bg-purple-50/20">
                  <h4 className="font-bold text-xs text-purple-900 mb-3">سطر پیش پرداخت‌ها (معین {toPersianDigits("98003 / 98004")})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                      <PersianAmountInput value={form9Data.prepayments.initialBalance} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, initialBalance: val}})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                      <PersianAmountInput value={form9Data.prepayments.consumedTransferred} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, consumedTransferred: val}})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                      <PersianAmountInput value={form9Data.prepayments.sentToTreasury} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, sentToTreasury: val}})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                      <PersianAmountInput value={form9Data.prepayments.yearEndBalance} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, yearEndBalance: val}})} className="mt-1" textColor="text-purple-700" />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                    <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                    <span>{formatPersianAmount(calculateForm9Transferred(form9Data.prepayments))} ریال</span>
                  </div>
                </div>

                <div className="border rounded-xl p-4 bg-purple-50/20">
                  <h4 className="font-bold text-xs text-purple-900 mb-3">سطر موجودی‌ها (معین {toPersianDigits("98003 / 98004")})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                      <PersianAmountInput value={form9Data.inventories.initialBalance} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, initialBalance: val}})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                      <PersianAmountInput value={form9Data.inventories.consumedTransferred} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, consumedTransferred: val}})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                      <PersianAmountInput value={form9Data.inventories.sentToTreasury} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, sentToTreasury: val}})} className="mt-1" />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                      <PersianAmountInput value={form9Data.inventories.yearEndBalance} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, yearEndBalance: val}})} className="mt-1" textColor="text-purple-700" />
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                    <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                    <span>{formatPersianAmount(calculateForm9Transferred(form9Data.inventories))} ریال</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۱۰ ─── */}
          <TabsContent value="form10">
            <Card className="border shadow-sm">
              <CardHeader className="bg-teal-50/70 border-b pb-4">
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
                          <td className="p-3 font-mono text-teal-700 font-semibold">{toPersianDigits(row.transferredDraftsExpense || row.transferredFunds)}</td>
                          <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.receivedNotifiedBonds || "-")}</td>
                          <td className="p-3 font-mono font-bold">{formatPersianAmount(row.consumedTransferred)}</td>
                          <td className="p-3 font-mono text-emerald-800 font-black">{toPersianDigits(row.yearEndMoeinApproved || row.yearEndBalance || "-")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۱۱ ─── */}
          <TabsContent value="form11">
            <Card className="border shadow-sm">
              <CardHeader className="bg-indigo-50/70 border-b pb-4">
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
                          <td className="p-3 font-mono text-indigo-700 font-semibold">{toPersianDigits(row.moeinExpense || row.yearEndMoeinExpense)}</td>
                          <td className="p-3 font-mono text-indigo-700 font-semibold">{toPersianDigits(row.moeinCapital || row.yearEndMoeinCapital)}</td>
                          <td className="p-2 font-mono">{formatPersianAmount(row.initialBalance)}</td>
                          <td className="p-2 font-mono">{formatPersianAmount(row.consumedTransferred)}</td>
                          <td className="p-2 font-mono">{formatPersianAmount(row.sentToTreasury)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── فرم ۱۳ ─── */}
          <TabsContent value="form13">
            <Card className="border shadow-sm">
              <CardHeader className="bg-cyan-50/70 border-b pb-4">
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
                        <th className="p-3 w-44">مبلغ اوراق (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form13Data.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                          <td className="p-3 text-center font-mono">{row.accountType}</td>
                          <td className="p-3 font-mono text-cyan-700 font-semibold">{toPersianDigits(row.moeinExpenseApproved)}</td>
                          <td className="p-3 font-mono text-cyan-700 font-semibold">{toPersianDigits(row.moeinCapitalApproved)}</td>
                          <td className="p-3 font-mono font-bold text-cyan-900">{formatPersianAmount(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        </div>
      )}

      {/* ════════════════════════ حالت ۲: داشبورد ممیزی و قوانین ════════════════════════ */}
      {mainMode === "audit" && (
        <div className="space-y-6">
          {/* خلاصه کارت‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">فرم‌های اعتبارسنجی شده</p>
                  <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{toPersianDigits(checkedCount)} فرم</h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                  <FileCheck2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-2",
              errors.length > 0 
                ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" 
                : "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
            )}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground/80">مجموع مغایرت‌های سناما</p>
                  <h3 className={cn("text-2xl font-black mt-1", errors.length > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {toPersianDigits(errors.length)} خطای سناما
                  </h3>
                </div>
                <div className={cn("p-3 rounded-xl", errors.length > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                  {errors.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">قواعد خزانه‌داری کل</p>
                  <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{toPersianDigits(SANAMA_PERFORMANCE_RULES.length)} ضابطه سناما</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">انواع اعتبارات</p>
                  <h3 className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-1">مصوب / ابلاغی</h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
                  <Layers className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ابزار ممیزی و قوانین */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>قوانین کنترل فرم عملکرد</span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-1.5 h-8">
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    <span>بازبینی</span>
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی کد یا عنوان قانون..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-2 max-h-[600px] overflow-y-auto divide-y">
                <button
                  onClick={() => setSelectedRuleCode(null)}
                  className={cn(
                    "w-full text-right p-3 rounded-lg text-xs font-semibold transition flex items-center justify-between",
                    selectedRuleCode === null ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted/50"
                  )}
                >
                  <span>نمایش همه قوانین و خطاها</span>
                  <Badge variant={selectedRuleCode === null ? "secondary" : "outline"} className="text-[10px]">
                    {toPersianDigits(errors.length)} خطا
                  </Badge>
                </button>

                {filteredRules.map((rule) => {
                  const ruleErrors = errors.filter(e => e.code === rule.code);
                  const isSelected = selectedRuleCode === rule.code;

                  return (
                    <button
                      key={rule.code}
                      onClick={() => {
                        setSelectedRuleCode(rule.code);
                        if (ruleErrors.length > 0) {
                          setFixPathwayError(ruleErrors[0]);
                        } else {
                          setFixPathwayError({ code: rule.code, message: rule.desc, itemRef: "قانون سناما" });
                        }
                      }}
                      className={cn(
                        "w-full text-right p-3 rounded-lg text-xs transition flex flex-col gap-1 mt-1 cursor-pointer group",
                        isSelected ? "bg-primary/10 border-primary border text-primary font-medium" : "hover:bg-muted/60 text-foreground/90"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 group-hover:text-primary">
                          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[11px]">کد {toPersianDigits(rule.code)}</span>
                          {rule.title}
                        </span>
                        {ruleErrors.length > 0 ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {toPersianDigits(ruleErrors.length)} خطا (مشاهده مسیر اصلاح)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50 px-1.5 py-0">
                            سالم
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{rule.desc}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <span>نتایج بررسی هوشمند و مغایرت‌ها</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedRuleCode 
                      ? `نمایش نتایج مربوط به قانون کد ${toPersianDigits(selectedRuleCode)}`
                      : "نمایش کلیه خطاها و مغایرت‌های یافت شده در فرم عملکرد سناما — جهت دریافت مسیر اصلاح روی هر خطا کلیک کنید"}
                  </CardDescription>
                </div>
                {selectedRuleCode && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRuleCode(null)} className="text-xs h-8">
                    پاک‌سازی فیلتر
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto">
                {activeErrors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">هیچ مغایرتی یافت نشد!</h4>
                    <p className="text-xs max-w-md">
                      تمامی قوانین و ضوابط خزانه‌داری کل کشور (سناما) در فیلدها و اقلام اعتبارات با موفقیت برقرار است.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeErrors.map((err, i) => (
                      <div 
                        key={i} 
                        onClick={() => setFixPathwayError(err)}
                        className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 flex flex-col gap-2 transition hover:shadow-md cursor-pointer hover:border-destructive/60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded font-black text-xs">
                              خطای کد {toPersianDigits(err.code)}
                            </span>
                            <span className="text-xs font-semibold text-foreground/80">
                              شناسه ردیف: <span className="font-mono text-primary">{toPersianDigits(err.itemRef)}</span>
                            </span>
                          </div>
                          <Badge variant="outline" className="border-destructive/40 text-destructive text-[11px] font-bold gap-1">
                            <span>دریافت مسیر اصلاح</span>
                            <Pencil className="h-3 w-3" />
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-destructive/20 mt-1">
                          <p className="text-xs font-medium text-destructive dark:text-red-400 leading-relaxed pr-1">
                            {err.message}
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFixPathwayError(err);
                            }}
                            className="text-xs gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-sm"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>مسیر رفع خطا و هدایت</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── مدال اصلاح سریع فیلدهای سناما (پاسخ به کد ۱۳۲ و سایر کدها) ─── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-lg shadow-2xl border-2 border-blue-500 bg-background animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between rounded-t-xl">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-blue-200" />
                  <span>اصلاح فیلدهای سناما برای اعتبار مشخص‌شده</span>
                </CardTitle>
                <CardDescription className="text-xs text-blue-100 font-sans mt-1 flex flex-col gap-0.5">
                  <span>عنوان اعتبار: <strong className="text-white">{editingItem.title || "اعتبار ردیف ثبت‌شده در سیستم"}</strong></span>
                  <span className="font-mono text-[11px] opacity-90">شناسه رکورد: {editingItem.id}</span>
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="text-white hover:bg-blue-700 h-8 w-8 p-0 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg text-amber-900 dark:text-amber-300">
                <p className="font-bold">راهنمای رفع خطای ۱۳۲ و قوانین سناما:</p>
                <p className="mt-1 leading-relaxed">
                  حداقل یکی از فیلدهای «شماره طرح»، «شماره ردیف متفرقه» یا «شماره ردیف تملک دارایی‌های مالی» باید با یک شماره معتبر خزانه‌داری جای‌گذاری و مقداردهی شود.
                </p>
              </div>

              {/* نمایش خطای عدم اعمال با دلیل روشن */}
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 font-medium text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{modalError}</div>
                </div>
              )}

              {/* نمایش پیغام موفقیت */}
              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-medium text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>{modalSuccess}</div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره طرح (project_number)</label>
                <Input
                  value={editForm.project_number}
                  onChange={e => {
                    setEditForm({ ...editForm, project_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 1307002001"
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره ردیف متفرقه (misc_row_number)</label>
                <Input
                  value={editForm.misc_row_number}
                  onChange={e => {
                    setEditForm({ ...editForm, misc_row_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 503000"
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره ردیف تملک دارایی‌های مالی (financial_assets_row_number)</label>
                <Input
                  value={editForm.financial_assets_row_number}
                  onChange={e => {
                    setEditForm({ ...editForm, financial_assets_row_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 700001"
                  className="h-9 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">شماره برنامه</label>
                  <Input
                    value={editForm.program_number}
                    onChange={e => setEditForm({ ...editForm, program_number: e.target.value })}
                    placeholder="مثال: 10101"
                    className="h-9 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ردیف ابلاغ دهنده</label>
                  <Input
                    value={editForm.notifier_budget_row}
                    onChange={e => setEditForm({ ...editForm, notifier_budget_row: e.target.value })}
                    placeholder="مثال: 102000"
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t mt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)} disabled={modalSaving} className="h-9 text-xs">
                  انصراف
                </Button>
                <Button onClick={handleSaveEdit} disabled={modalSaving} className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow">
                  {modalSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{modalSaving ? "در حال ذخیره‌سازی..." : "ذخیره و اعمال در سناما"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* ─── مدال مسیر اصلاح و برطرف‌سازی هوشمند خطاهای سناما ─── */}
      <FixPathwayModal
        error={fixPathwayError}
        onClose={() => setFixPathwayError(null)}
        onNavigate={(tab) => {
          setMainMode("forms");
          setActiveFormTab(tab);
          setFixPathwayError(null);
        }}
      />
    </PageShell>
  );
}
