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
import InsuranceSettings from "./InsuranceSettings";
import PayslipForm from "./PayslipForm";
import LoanRegisterForm from "./LoanRegisterForm";
import LoanList from "./LoanList";
import SalaryAdvanceForm from "./SalaryAdvanceForm";
import PayrollReports from "./PayrollReports";

import { useNavigate } from "react-router-dom";
import { Users, Building2, Calculator, Receipt, Landmark, FileText, ArrowRight, ShieldCheck, CalendarCheck, Clock, UserPlus, FileSpreadsheet, Percent, CreditCard, Banknote } from "lucide-react";

export default function Payroll() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname === "/payroll/reports") {
    return <PayrollReports />;
  }

  if (pathname === "/payroll/loans/new") {
    return <LoanRegisterForm />;
  }

  if (pathname === "/payroll/loans/list") {
    return <LoanList />;
  }

  if (pathname === "/payroll/loans/advance") {
    return <SalaryAdvanceForm />;
  }

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

  if (pathname === "/payroll/calculate/monthly") {
    return <PayrollCalculate />;
  }

  if (pathname === "/payroll/calculate/settings") {
    return <PayrollSettings />;
  }

  if (pathname === "/payroll/calculate/tax" || pathname === "/payroll/calculate/tax-table") {
    return <TaxTables />;
  }

  if (pathname === "/payroll/calculate/insurance") {
    return <InsuranceSettings />;
  }

  if (pathname === "/payroll/payslip") {
    return <PayslipForm />;
  }

  // Hub view for /payroll, /payroll/administrative, /payroll/financial, /payroll/dashboard, /payroll/calculate
  const isAdminOnly = pathname === "/payroll/administrative";
  const isFinOnly = pathname === "/payroll/financial";

  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => navigate("/payroll")}>سیستم حقوق و دستمزد</span>
        <span>/</span>
        <span>تفکیک واحد اداری و مالی</span>
      </div>

      <PageHeader
        title="سیستم جامع حقوق و دستمزد (تفکیک اداری - مالی)"
        description="مدیریت پرونده‌های پرسنلی، احکام و کارکرد در واحد اداری و پردازش محاسبات، فیش‌ها و پرداخت در واحد مالی"
      />

      <div className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 🏢 واحد اداری و منابع انسانی */}
          {(!isFinOnly) && (
            <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-blue-600/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">واحد اداری (امور اداری و منابع انسانی)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مدیریت پرونده‌ها، قراردادها، احکام حقوقی و ثبت کارکرد و مرخصی پرسنل</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 space-y-5">
                {/* گروه ۱: اطلاعات پرسنلی و کارگزینی */}
                <div>
                  <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2 border-r-4 border-blue-600 pr-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    اطلاعات پرسنلی و کارگزینی
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button onClick={() => navigate("/payroll/employees/new")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <UserPlus className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ثبت کارمند جدید</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/employees/list")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Users className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">لیست و پرونده پرسنل</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/employees/decrees")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">احکام حقوقی و کارگزینی</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/employees/contracts")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">قراردادهای پرسنل</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* گروه ۲: حضور و غیاب و کارکرد */}
                <div>
                  <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2 border-r-4 border-teal-600 pr-2">
                    <Clock className="h-4 w-4 text-teal-600" />
                    حضور و غیاب و کارکرد پرسنل
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button onClick={() => navigate("/payroll/attendance/register")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <CalendarCheck className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ثبت کارکرد ماهانه</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/attendance/list")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">خلاصه کارکرد پرسنل</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/attendance/leave")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">مدیریت مرخصی‌ها</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/attendance/mission")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">مأموریت‌های اداری</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 💰 واحد مالی و حسابداری حقوق */}
          {(!isAdminOnly) && (
            <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-emerald-600/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">واحد مالی (امور مالی و حسابداری)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">محاسبه حقوق ماهانه، مالیات، بیمه، صدور فیش، اقساط وام و گزارش‌های مالی</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 space-y-5">
                {/* گروه ۱: محاسبه و پردازش حقوق */}
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 mb-3 flex items-center gap-2 border-r-4 border-emerald-600 pr-2">
                    <Calculator className="h-4 w-4 text-emerald-600" />
                    محاسبه و تنظیمات مالی حقوق
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button onClick={() => navigate("/payroll/calculate/monthly")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Calculator className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">محاسبه حقوق ماهانه</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/calculate/tax-table")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Percent className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">جدول مالیات حقوق</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/calculate/insurance")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">تنظیمات و نرخ‌های بیمه</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/calculate/settings")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">تنظیمات حقوق و کارگاه</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* گروه ۲: صدور فیش و پرداخت‌ها */}
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 mb-3 flex items-center gap-2 border-r-4 border-indigo-600 pr-2">
                    <Receipt className="h-4 w-4 text-indigo-600" />
                    فیش حقوقی، وام و گزارش‌ها
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button onClick={() => navigate("/payroll/payslip")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Receipt className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">صدور و چاپ فیش حقوقی</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/loans/list")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">مدیریت وام‌های پرسنل</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/loans/advance")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <Banknote className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ثبت و کسر مساعده</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button onClick={() => navigate("/payroll/reports")} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-right group">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="h-4 w-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">گزارش‌ها و دیسکت‌های مالی</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </PageShell>
  );
}
