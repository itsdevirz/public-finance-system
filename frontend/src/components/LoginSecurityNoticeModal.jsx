import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, Clock, Calendar, Laptop, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function LoginSecurityNoticeModal() {
  const [sessionNotice, setSessionNotice] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("sessionNotice");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSessionNotice(parsed);
        setIsOpen(true);
      } catch (err) {
        console.error("Failed to parse sessionNotice from localStorage:", err);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.removeItem("sessionNotice");
    setIsOpen(false);
  };

  if (!isOpen || !sessionNotice) return null;

  const successPolicy = sessionNotice.policy?.successPolicy || { enable: true, displayDate: true, displayTime: true, displayOtherInfo: true };
  const failedPolicy = sessionNotice.policy?.failedPolicy || { enable: true, displayDate: true, displayTime: true, displayOtherInfo: true, displayFailedAttemptsCount: true };

  const showSuccessCard = successPolicy.enable !== false && (successPolicy.displayDate || successPolicy.displayTime || successPolicy.displayOtherInfo);
  const showFailedCard = failedPolicy.enable !== false && (failedPolicy.displayDate || failedPolicy.displayTime || failedPolicy.displayOtherInfo || failedPolicy.displayFailedAttemptsCount);

  if (!showSuccessCard && !showFailedCard) {
    return null;
  }

  const formatDate = (isoString) => {
    if (!isoString) return "ثبت نشده";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(d);
    } catch {
      return isoString.split("T")[0] || isoString;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "ثبت نشده";
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("fa-IR", { timeStyle: "medium" }).format(d);
    } catch {
      return isoString.split("T")[1]?.split(".")[0] || isoString;
    }
  };

  const lastSuccess = sessionNotice.lastSuccessfulAttempt;
  const lastFailed = sessionNotice.lastFailedAttempt;
  const failedCount = sessionNotice.failedLoginCount || 0;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                اعلان امنیتی نشست‌های کاربر
              </h3>
              <p className="text-xs text-blue-200/90 mt-0.5">
                گزارش وضعیت آخرین تلاش‌های ورود به سیستم و سوابق دسترسی
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] px-2.5 py-1">
            نشست فعال جدید
          </Badge>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-200 text-xs">
          
          {/* آخرین تلاش موفق برای ایجاد نشست */}
          {showSuccessCard && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>آخرین تلاش موفق برای ایجاد نشست قبلی</span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">ورود موفق قبلی</Badge>
              </div>

              {lastSuccess ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {successPolicy.displayDate && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">روز / تاریخ:</span>
                        <span className="font-extrabold dir-rtl">{formatDate(lastSuccess.timestamp)}</span>
                      </div>
                    </div>
                  )}

                  {successPolicy.displayTime && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">زمان / ساعت:</span>
                        <span className="font-extrabold dir-rtl">{formatTime(lastSuccess.timestamp)}</span>
                      </div>
                    </div>
                  )}

                  {successPolicy.displayOtherInfo && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">سایر موارد (IP و دستگاه):</span>
                        <span className="font-bold text-[11px] dir-ltr text-slate-800 dark:text-slate-200">
                          {lastSuccess.ip || "127.0.0.1"} ({lastSuccess.browserName || lastSuccess.osName || "مرورگر وب"})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] italic">
                  این اولین نشست موفقیت‌آمیز شما در سیستم می‌باشد یا سابقه قبلی ثبت نشده است.
                </p>
              )}
            </div>
          )}

          {/* آخرین تلاش ناموفق برای ایجاد نشست و تعداد تلاش‌های ناموفق */}
          {showFailedCard && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>آخرین تلاش ناموفق و تعداد تلاش‌های ناموفق تا این نشست</span>
                </div>
                {failedPolicy.displayFailedAttemptsCount && (
                  <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-[10px] font-bold">
                    تعداد تلاش‌های ناموفق: {failedCount} مورد
                  </Badge>
                )}
              </div>

              {lastFailed ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {failedPolicy.displayDate && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">روز / تاریخ:</span>
                        <span className="font-extrabold dir-rtl">{formatDate(lastFailed.timestamp)}</span>
                      </div>
                    </div>
                  )}

                  {failedPolicy.displayTime && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">زمان / ساعت:</span>
                        <span className="font-extrabold dir-rtl">{formatTime(lastFailed.timestamp)}</span>
                      </div>
                    </div>
                  )}

                  {failedPolicy.displayOtherInfo && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">سایر موارد (IP و علت):</span>
                        <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          IP: <span className="dir-ltr inline-block">{lastFailed.ip}</span> | {lastFailed.reason || "رمز عبور اشتباه"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px] italic">
                  هیچ تلاش ناموفقی قبل از این نشست ثبت نشده است (تعداد تلاش‌های ناموفق: ۰).
                </p>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-3">
          <Button
            type="button"
            onClick={handleDismiss}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-md gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            مشاهده شد و تأیید سوابق دسترسی
          </Button>
        </div>
      </div>
    </div>
  );
}
