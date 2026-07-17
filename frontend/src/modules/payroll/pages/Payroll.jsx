import { useLocation } from "react-router-dom";
import { FileX } from "lucide-react";
import { PageShell, PageHeader, EmptyState } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";

const ROUTE_LABELS = {
  "/payroll": "سیستم حقوق و دستمزد",
  "/payroll/dashboard": "داشبورد حقوق",
  "/payroll/employees": "اطلاعات کارکنان",
  "/payroll/employees/list": "لیست کارکنان",
  "/payroll/employees/new": "ثبت کارمند جدید",
  "/payroll/employees/contracts": "قراردادها",
  "/payroll/employees/decrees": "احکام حقوقی",
  "/payroll/attendance": "حضور و غیاب",
  "/payroll/attendance/register": "ثبت کارکرد ماه",
  "/payroll/attendance/list": "لیست کارکرد",
  "/payroll/attendance/leave": "مرخصی‌ها",
  "/payroll/attendance/mission": "مأموریت",
  "/payroll/calculate": "محاسبه حقوق",
  "/payroll/calculate/monthly": "محاسبه ماهانه",
  "/payroll/calculate/settings": "تنظیمات محاسبه",
  "/payroll/calculate/tax-table": "جدول مالیات",
  "/payroll/calculate/insurance": "تنظیمات بیمه",
  "/payroll/payslip": "فیش حقوقی",
  "/payroll/payslip/view": "مشاهده فیش حقوقی",
  "/payroll/payslip/print": "چاپ فیش حقوقی",
  "/payroll/payslip/bulk": "چاپ گروهی فیش‌ها",
  "/payroll/loans": "وام و مساعده",
  "/payroll/loans/new": "ثبت وام",
  "/payroll/loans/list": "لیست وام‌ها",
  "/payroll/loans/advance": "مساعده",
  "/payroll/loans/balance": "مانده وام کارکنان",
  "/payroll/reports": "گزارش‌ها",
  "/payroll/reports/list": "لیست حقوق ماهانه",
  "/payroll/reports/insurance": "لیست بیمه",
  "/payroll/reports/tax": "لیست مالیات",
  "/payroll/reports/overtime": "گزارش اضافه‌کاری",
  "/payroll/reports/absence": "گزارش غیبت",
  "/payroll/reports/leave": "گزارش مرخصی",
  "/payroll/reports/unit-cost": "هزینه حقوق واحدها",
  "/payroll/reports/annual": "گزارش سالانه حقوق",
  "/payroll/reports/eid": "گزارش عیدی و سنوات",
};

import EmployeeRegisterForm from "./EmployeeRegisterForm";
import EmployeeList from "./EmployeeList";
import EmployeeContracts from "./EmployeeContracts";
import EmployeeDecrees from "./EmployeeDecrees";
import AttendanceRegister from "./AttendanceRegister";
import AttendanceList from "./AttendanceList";
import EmployeeLeaves from "./EmployeeLeaves";
import EmployeeMissions from "./EmployeeMissions";
import PayrollCalculate from "./PayrollCalculate";
import PayrollSettings from "./PayrollSettings";
import TaxTables from "./TaxTables";

export default function Payroll() {
  const { pathname } = useLocation();

  if (pathname === "/payroll/employees/new") {
    return <EmployeeRegisterForm />;
  }

  if (pathname === "/payroll/employees/list" || pathname === "/payroll/employees") {
    return <EmployeeList />;
  }

  if (pathname === "/payroll/employees/contracts") {
    return <EmployeeContracts />;
  }

  if (pathname === "/payroll/employees/decrees") {
    return <EmployeeDecrees />;
  }

  if (pathname === "/payroll/attendance/register" || pathname === "/payroll/attendance") {
    return <AttendanceRegister />;
  }

  if (pathname === "/payroll/attendance/list") {
    return <AttendanceList />;
  }

  if (pathname === "/payroll/attendance/leave") {
    return <EmployeeLeaves />;
  }

  if (pathname === "/payroll/attendance/mission") {
    return <EmployeeMissions />;
  }

  if (pathname === "/payroll/calculate" || pathname === "/payroll/calculate/monthly") {
    return <PayrollCalculate />;
  }

  if (pathname === "/payroll/calculate/settings") {
    return <PayrollSettings />;
  }

  if (pathname === "/payroll/calculate/tax" || pathname === "/payroll/calculate/tax-table") {
    return <TaxTables />;
  }

  const title = ROUTE_LABELS[pathname] ?? "سیستم حقوق و دستمزد";
  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline">سیستم حقوق</span>
        <span>/</span>
        <span>{title}</span>
      </div>

      <PageHeader title={title} description="سیستم مدیریت حقوق و دستمزد" />
      <Card className="animate-in fade-in zoom-in-95 duration-500">
        <CardContent>
          <EmptyState icon={FileX} title="این بخش در حال توسعه است"
            description={`صفحه «${title}» به زودی پیاده‌سازی می‌شود`} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
