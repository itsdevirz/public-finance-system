import React from "react";
import { GitFork, CheckCircle2, Clock, Ban, X, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/components/ui/persian-date-picker";

const STATUS_LABEL = {
  DRAFT: "پیش‌نویس",
  REGISTERED: "ثبت اولیه",
  CONFIRMED: "تأییدشده",
  FINAL: "صدور سند قطعی",
  CANCELLED: "ابطال‌شده",
  "پیش‌نویس": "پیش‌نویس",
  "ثبت اولیه": "ثبت اولیه",
  "تأییدشده": "تأییدشده",
  "صدور سند قطعی": "صدور سند قطعی",
  "ابطال‌شده": "ابطال‌شده",
};

export function getCleanStatusLabel(status) {
  if (!status) return "—";
  let str = String(status).trim();
  str = str.replace(/^ابطال‌?شده\s*/i, "").trim();
  if (str.startsWith("(") && str.endsWith(")")) {
    str = str.slice(1, -1).trim();
  }
  return STATUS_LABEL[str] ?? str;
}

const STATUS_COLOR = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  REGISTERED: "bg-blue-100 text-blue-700 border-blue-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FINAL: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  "پیش‌نویس": "bg-amber-100 text-amber-700 border-amber-200",
  "ثبت اولیه": "bg-blue-100 text-blue-700 border-blue-200",
  "تأییدشده": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "صدور سند قطعی": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "ابطال‌شده": "bg-rose-100 text-rose-700 border-rose-200",
};

function formatDocDate(dateStr, fiscalYear) {
  if (!dateStr || dateStr === "—") return "—";
  const cleanStr = String(dateStr).replace(/[۰-۹]/g, ch => "۰۱۲۳۴۵۶۷۸۹".indexOf(ch).toString());
  if (cleanStr.includes("T")) {
    const [dPart, tPart] = cleanStr.split("T");
    const formattedDate = formatDocDate(dPart, fiscalYear);
    const timeStr = tPart ? tPart.slice(0, 5) : "";
    return `${formattedDate} ${toPersianDigits(timeStr)}`;
  }
  if (!fiscalYear) return toPersianDigits(dateStr);
  const fyStr = String(fiscalYear);
  const parts = cleanStr.split("/");
  if (parts.length === 3) {
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return toPersianDigits(`${fyStr}/${month}/${day}`);
  }
  return toPersianDigits(dateStr);
}

export function DocWorkflowTreeModal({ doc, onClose }) {
  if (!doc) return null;

  const history = doc.workflowHistory || [];
  const currentStep = doc.workflowStep || "REGULATOR";
  const status = (doc.status || "").trim();
  const isFinalized = status === "CONFIRMED" || status === "صدور سند قطعی" || status === "FINAL" || currentStep === "FINAL";

  const STEPS = [
    { key: "ACCOUNTANT", roleName: "حسابدار", title: "ثبت اولیه و صدور سند" },
    { key: "REGULATOR", roleName: "تنظیم حساب", title: "بررسی و تنظیم حساب" },
    { key: "FIN_HEAD", roleName: "رئیس امور مالی", title: "تأیید رئیس امور مالی" },
    { key: "FIN_DIRECTOR", roleName: "مدیر مالی و ذیحساب", title: "تأیید مدیر مالی و ذیحساب" },
    { key: "AGENCY_HEAD", roleName: "رئیس دستگاه اجرایی", title: "تأیید نهایی و صدور سند قطعی" },
  ];

  const STEP_KEYS = ["ACCOUNTANT", "REGULATOR", "FIN_HEAD", "FIN_DIRECTOR", "AGENCY_HEAD"];

  let currentIdx = 1;
  if (isFinalized) {
    currentIdx = 5;
  } else if (currentStep === "ACCOUNTANT" || currentStep === "DRAFT") {
    const hasRejectionToAccountant = history.some(h => h.toStep === "ACCOUNTANT" && h.action === "REJECT");
    currentIdx = hasRejectionToAccountant ? 0 : 1;
  } else {
    const found = STEP_KEYS.indexOf(currentStep);
    currentIdx = found >= 0 ? found : 1;
  }

  const getStepStatus = (stepKey, index) => {
    // 1. Step 0 (ACCOUNTANT)
    if (stepKey === "ACCOUNTANT") {
      const creatorName = doc.createdBy || doc.rawHeader?.registeredBy || doc.user || "حسابدار";
      if (index === currentIdx) {
        const lastReject = history.slice().reverse().find(h => h.action === "REJECT");
        return {
          current: true,
          actionText: "در انتظار اقدام در کارتابل (برگشت‌داده‌شده)",
          user: creatorName,
          date: doc.createdAt || doc.document_date || "—",
          reason: lastReject?.reason,
          badgeColor: "bg-rose-100 text-rose-700 border-rose-200 animate-pulse",
        };
      }
      return {
        completed: true,
        actionText: "ثبت اولیه سند",
        user: creatorName,
        date: doc.createdAt || doc.document_date || "—",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      };
    }

    // 2. Finalized Document State
    if (isFinalized) {
      const approveAction = history.slice().reverse().find(h => h.fromStep === stepKey && h.action === "APPROVE");
      return {
        completed: true,
        actionText: stepKey === "AGENCY_HEAD" ? "تأیید نهایی و صدور سند قطعی" : "تأیید و ارسال به مرحله بعد",
        user: approveAction?.user || (stepKey === "AGENCY_HEAD" ? (doc.confirmedBy || "رئیس دستگاه اجرایی") : undefined),
        date: approveAction?.date || doc.updatedAt || doc.createdAt,
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }

    // 3. Current Active Step (Awaiting Action)
    if (index === currentIdx) {
      const lastRejectToThisStep = history.slice().reverse().find(h => h.toStep === stepKey && h.action === "REJECT");
      return {
        current: true,
        actionText: lastRejectToThisStep ? "در انتظار اقدام در کارتابل (برگشت داده شده)" : "در انتظار اقدام در کارتابل",
        reason: lastRejectToThisStep?.reason,
        returnedBy: lastRejectToThisStep?.user,
        badgeColor: "bg-amber-100 text-amber-700 border-amber-200 animate-pulse",
      };
    }

    // 4. Past Completed Step (Approved & Sent Forward)
    if (index < currentIdx) {
      const approveAction = history.slice().reverse().find(h => h.fromStep === stepKey && h.action === "APPROVE");
      return {
        completed: true,
        actionText: "تأیید و ارسال به مرحله بعد",
        user: approveAction?.user,
        date: approveAction?.date,
        badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }

    // 5. Future Step (Check if Rejected in Past or Pending)
    const rejectAction = history.slice().reverse().find(h => h.fromStep === stepKey && h.action === "REJECT");
    if (rejectAction) {
      return {
        completed: false,
        rejected: true,
        actionText: "رد سند و ارجاع به گام قبل",
        user: rejectAction.user,
        date: rejectAction.date,
        reason: rejectAction.reason,
        badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
      };
    }

    return {
      pending: true,
      actionText: "در صف انتظار",
      badgeColor: "bg-muted text-muted-foreground border-border",
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border bg-background shadow-2xl flex flex-col">
        {/* هدر مدال */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">درختواره و سوابق گردش کاری سند</h2>
              <p className="text-xs text-muted-foreground font-mono">شماره سند: {toPersianDigits(doc.document_number)} | دوره مالی: {toPersianDigits(doc.fiscal_year)}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* بدنه درختواره */}
        <div className="p-6 space-y-6 flex-1">
          {doc.isPermanentlyRejected || (doc.rejectionCount || 0) >= 3 || doc.workflowStep === "PERMANENTLY_REJECTED" ? (
            <div className="p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-950 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <Ban className="h-6 w-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-900">این سند به طور دائم رد شده است</h4>
                  <p className="text-[11px] text-rose-700 font-medium">به دلیل رسیدن به حد مجاز (۳ بار رد شدن)، این سند ابطال گردیده و دیگر قابل تأیید نمی‌باشد.</p>
                </div>
              </div>
              <span className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-xs">
                تعداد دفعات رد: ۳ از ۳
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/20 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">وضعیت کنونی سند:</span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
                  doc.status?.includes("برگشت") ? "bg-amber-100 text-amber-700 border-amber-200" : (STATUS_COLOR[doc.status] ?? "bg-muted"))}>
                  {getCleanStatusLabel(doc.status)}
                </span>
              </div>
              {(doc.rejectionCount || 0) > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span>تعداد دفعات رد شده: {toPersianDigits(doc.rejectionCount)} از ۳</span>
                </div>
              )}
            </div>
          )}

          <div className="relative pr-4 space-y-6 before:absolute before:right-[27px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-primary/80 before:via-emerald-500/40 before:to-muted">
            {STEPS.map((step, idx) => {
              const info = getStepStatus(step.key, idx);

              // استخراج تمامی سوابق رد مرتبط با این گام
              const stepRejections = history.filter(h => h.fromStep === step.key && h.action === "REJECT");
              const hasRejectionOnCard = stepRejections.length > 0 || info.reason;

              return (
                <div key={step.key} className="relative flex items-start gap-4 group">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold z-10 transition-all shadow-sm",
                    info.completed ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-200" :
                    info.rejected || hasRejectionOnCard ? "bg-rose-600 text-white border-rose-600 shadow-rose-200" :
                    info.current ? "bg-amber-500 text-white border-amber-500 ring-4 ring-amber-100" :
                    "bg-background text-muted-foreground border-border"
                  )}>
                    {info.completed ? <CheckCircle2 className="h-4 w-4" /> :
                     info.rejected || hasRejectionOnCard ? <Ban className="h-4 w-4" /> :
                     info.current ? <Clock className="h-4 w-4 animate-spin" /> :
                     toPersianDigits(idx + 1)}
                  </div>

                  <div className={cn(
                    "flex-1 rounded-2xl border p-4 transition-all shadow-sm",
                    info.rejected || hasRejectionOnCard ? "bg-rose-50/60 border-rose-200 dark:bg-rose-950/20" :
                    info.completed ? "bg-emerald-50/40 border-emerald-200 dark:bg-emerald-950/20" :
                    info.current ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20" :
                    "bg-background border-border/80 opacity-70"
                  )}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-foreground">{step.roleName}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">({step.title})</span>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", info.badgeColor)}>
                        {info.actionText}
                      </span>
                    </div>

                    {info.user && (
                      <p className="text-xs text-foreground/80 font-medium mt-1">
                        • اقدام کننده: <span className="font-bold text-foreground">{info.user}</span>
                      </p>
                    )}

                    {info.date && (
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        • زمان اقدام: {formatDocDate(info.date, doc.fiscal_year)}
                      </p>
                    )}

                    {/* نمایش تمامی ردهای اتفاق افتاده در این گام */}
                    {stepRejections.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {stepRejections.map((rj, rjIdx) => (
                          <div key={rjIdx} className="p-2.5 rounded-xl bg-rose-100/90 text-rose-950 border border-rose-300 text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold flex-wrap gap-1">
                              <span className="flex items-center gap-1 text-rose-700">
                                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                دلیل رد سند {stepRejections.length > 1 ? `(نوبت ${toPersianDigits(rjIdx + 1)})` : ""}:
                              </span>
                              <span className="text-[10px] text-rose-800 font-mono">{formatDocDate(rj.date, doc.fiscal_year)}</span>
                            </div>
                            <p className="pr-4 leading-relaxed font-semibold text-rose-900">{rj.reason}</p>
                            <p className="text-[10px] text-rose-700 font-medium pr-4">• ردکننده: {rj.user}</p>
                          </div>
                        ))}
                      </div>
                    ) : info.reason ? (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-rose-100/90 text-rose-950 border border-rose-300 text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1 text-rose-700">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          دلیل رد سند:
                        </p>
                        <p className="pr-4 leading-relaxed font-semibold text-rose-900">{info.reason}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {history.length > 0 && (
            <div className="mt-6 pt-4 border-t space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                ریز سوابق کامل رویدادها ({toPersianDigits(history.length)} مورد)
              </h4>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <div key={i} className={cn("text-xs p-3 rounded-2xl border flex flex-col gap-1.5 transition-colors",
                    h.action === "REJECT" ? "bg-rose-50/80 border-rose-200 text-rose-950" : "bg-muted/30 border-border/80")}>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          h.action === "APPROVE" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200")}>
                          {h.action === "APPROVE" ? "تأیید" : "رد سند"}
                        </span>
                        <span className="font-bold text-foreground">{h.user}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatDocDate(h.date, doc.fiscal_year)}</span>
                    </div>
                    {h.reason && (
                      <div className="text-xs font-semibold text-rose-900 bg-rose-100/90 p-2.5 rounded-xl border border-rose-300 flex items-start gap-1.5 mt-0.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-rose-800">علت رد: </span>
                          <span className="leading-relaxed">{h.reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-3 bg-muted/20 rounded-b-3xl shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-xl border border-input bg-background px-4 py-1.5 text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> بستن
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocWorkflowTreeModal;
