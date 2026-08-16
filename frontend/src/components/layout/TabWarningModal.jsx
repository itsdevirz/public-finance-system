import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TabWarningModal({ open, pendingTab, tabCount, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 selection:bg-amber-500/30">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
          onClick={onCancel}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-card p-6 shadow-2xl shadow-amber-500/10 dir-rtl text-right"
        >
          {/* Header Glow Bar */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          <div className="flex items-start gap-4 pt-2">
            {/* Warning Icon Box */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-inner">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  هشدار: تعداد پنجره‌های باز
                </h3>
                <button
                  onClick={onCancel}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                تعداد پنجره‌های باز شما در سامانه به{" "}
                <span className="font-bold text-amber-600 dark:text-amber-400 px-1 py-0.5 rounded bg-amber-500/10 font-mono">
                  {tabCount} پنجره
                </span>{" "}
                رسیده است.
              </p>

              {pendingTab && (
                <div className="mt-3 rounded-xl bg-amber-500/5 p-3 border border-amber-500/20">
                  <p className="text-[11px] font-medium text-muted-foreground">پنجره جدید در درخواست:</p>
                  <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                    📄 {pendingTab.title}
                  </p>
                </div>
              )}

              <p className="mt-3 text-[11px] font-medium text-muted-foreground/80">
                آیا از باز کردن پنجره جدید اطمینان دارید؟
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs font-semibold px-4 rounded-xl hover:bg-muted"
            >
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 font-bold text-xs px-4 rounded-xl shadow-md gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              بله، باز شود
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
