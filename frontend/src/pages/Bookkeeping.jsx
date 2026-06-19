import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/bookkeeping": "دفترداری و تنظیم حساب‌ها",
  "/bookkeeping/operations-balance": "تراز عملیات",
  "/bookkeeping/operations-balance/different-states": "تراز در حالت های مختلف",
  "/bookkeeping/operations-balance/moein-chapters": "تراز عملیات معین/فصول",
  "/bookkeeping/operations-balance/moein-detail-link": "ارتباط معین و تفصیلی",
  "/bookkeeping/operations-balance/samad-system": "سامانه سماد(الف-ب)",
  "/bookkeeping/operations-balance/sanama-attachments": "ضمائم الصاقی سناما",
  "/bookkeeping/misc-accounts": "متفرقه(لیست حساب‌ها)",
  "/bookkeeping/misc-accounts/account-groups": "لیست گروه حساب ها",
  "/bookkeeping/misc-accounts/main-accounts": "لیست حساب های کل",
  "/bookkeeping/misc-accounts/moein-accounts": "لیست حساب های معین",
  "/bookkeeping/misc-accounts/detail-accounts": "لیست حساب های تفصیلی",
  "/bookkeeping/misc-accounts/detailed-report": "گزارش تفصیلی",
  "/bookkeeping/ledger-reports": "گزارش دفاتر",
  "/bookkeeping/ledger-reports/general-ledger": "دفتر کل",
  "/bookkeeping/ledger-reports/moein-ledger": "دفتر معین",
  "/bookkeeping/ledger-reports/journal": "دفتر روزنامه",
  "/bookkeeping/ledger-reports/model-13": "مدل 13",
  "/bookkeeping/ledger-reports/moein-program-chapter": "دفتر معین (معین-برنامه-فصل)",
  "/bookkeeping/ledger-reports/detail-ledger": "دفتر تفصیلی",
  "/bookkeeping/ledger-reports/account-review": "مرور حساب ها",
  "/bookkeeping/ledger-reports/securities": "گزارش اوراق بهادار",
  "/bookkeeping/summary-status": "گزارش خلاصه وضعیت",
  "/bookkeeping/bank-reconciliation": "مغایرت بانکی",
  "/bookkeeping/bank-reconciliation/account-format-setup": "تنظیم فرمت صورت حساب بانک",
  "/bookkeeping/bank-reconciliation/account-info-read": "خواندن اطلاعات حساب ها",
  "/bookkeeping/bank-reconciliation/account-reconciliation": "مغایرت حساب ها",
  "/bookkeeping/final-documents": "سندهای قطعی",
  "/bookkeeping/final-documents/finalize-doc": "قطعی کردن سند",
  "/bookkeeping/final-documents/unfinalize-doc": "خارج نمودن سند از قطعی",
  "/bookkeeping/budget-execution": "گزارش‌های تفریغ بودجه",
  "/bookkeeping/budget-execution/budget-allocation-setup": "تنظیمات تفریغ بودجه",
  "/bookkeeping/budget-execution/budget-allocation": "تفریغ بودجه",
  "/bookkeeping/budget-execution/aggregate-budget-allocation": "تفریغ بودجه تجمیعی",
  "/bookkeeping/misc-persons": "گزارش‌های متفرقه(اشخاص)",
  "/bookkeeping/misc-persons/persons-report": "گزارش اشخاص",
  "/bookkeeping/misc-persons/persons-balance": "گزارش مانده اشخاص",
  "/bookkeeping/financial-statements": "صورت‌های مالی",
  "/bookkeeping/financial-statements/balance-sheet": "صورت وضعیت مالی1",
  "/bookkeeping/financial-statements/change-in-financial-position": "صورت تغییرات در وضعیت مالی",
  "/bookkeeping/financial-statements/comparison-budget-performance": "صورت مقایسه بودجه عمومی و عملکرد تلفیقی",
  "/bookkeeping/financial-statements/parametric-balance-sheet": "صورت وضعیت مالی پارامتریک",
  "/bookkeeping/financial-statements/notes": "یادداشت توضیحی",
  "/bookkeeping/financial-statements/reports-settings": "تنظیمات گزارش",
  "/bookkeeping/accountant-agents": "گزارش عاملین ذیحساب",
  "/bookkeeping/document-notification": "گزارش ابلاغ سند",
  "/bookkeeping/smart-control": "کنترل هوشمند",
  "/bookkeeping/petty-cash": "گزارش تنخواه",
  "/bookkeeping/open-items": "هشدار اقلام باز دفتر",
  "/bookkeeping/resource-forms": "فرم‌های منابع و مصارف",
  "/bookkeeping/resource-forms/deposit-expense-confirmation": "فرم تاییدیه مصارف سپرده",
};

export default function Bookkeeping() {
  const { pathname } = useLocation();
  const title = ROUTE_LABELS[pathname] ?? "دفترداری و تنظیم حساب‌ها";

  return (
    <PageShell>
      <PageHeader title={title} description="بخش دفترداری و تنظیم حساب‌ها - در حال توسعه" />
      <Card>
        <CardContent className="p-0 pt-6 px-6 pb-6">
          <EmptyState
            icon={FileX}
            title="این بخش در حال توسعه است"
            description={`صفحه «${title}» به زودی پیاده‌سازی می‌شود`}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
