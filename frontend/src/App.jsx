import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import BasicInfo from "./pages/BasicInfo";
import DocumentSetup from "./pages/DocumentSetup";
import Review from "./pages/Review";
import Credits from "./pages/Credits";
import CheckIssuance from "./pages/CheckIssuance";
import Bookkeeping from "./pages/Bookkeeping";
import SystemManagement from "./pages/SystemManagement";
import Guarantees from "./pages/Guarantees";
import Deposits from "./pages/Deposits";
import Placeholder from "./pages/Placeholder";

function Layout() {
  const { user } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Tahoma" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: 30, direction: "rtl", background: "#f5f7fa", overflowY: "auto" }}>
        <Routes>
          <Route path="/"                                       element={<h2 style={{ color: "#1e3a5f" }}>خوش آمدید، {user?.username}</h2>} />

          {/* اطلاعات پایه */}
          <Route path="/basic-info"                             element={<BasicInfo />} />
          <Route path="/basic-info/credits"                     element={<Credits />} />
          <Route path="/basic-info/document-setup"                        element={<DocumentSetup />} />
          <Route path="/basic-info/document-setup/document-types"        element={<Placeholder label="تعریف انواع سند" />} />
          <Route path="/basic-info/document-setup/payment-types"         element={<Placeholder label="تعریف انواع پرداخت" />} />
          <Route path="/basic-info/check-issuance"                        element={<CheckIssuance />} />
          <Route path="/basic-info/check-issuance/bank-branches"         element={<Placeholder label="تعریف شعب بانکی" />} />
          <Route path="/basic-info/check-issuance/bank-accounts"         element={<Placeholder label="تعریف شماره حساب بانکی" />} />
          <Route path="/basic-info/check-issuance/checkbooks"            element={<Placeholder label="تعریف دسته چک هر شماره حساب" />} />
          <Route path="/basic-info/check-issuance/recipients"            element={<Placeholder label="تعریف گیرندگان چک" />} />
          <Route path="/basic-info/check-issuance/contract-desc"         element={<Placeholder label="تعریف شرح چک هر قرارداد" />} />
          <Route path="/basic-info/contracts"                              element={<Placeholder label="قراردادها" />} />
          <Route path="/basic-info/contracts/deduction-types"            element={<Placeholder label="تعریف انواع کسور" />} />
          <Route path="/basic-info/contracts/parties"                    element={<Placeholder label="تعریف طرف قرارداد" />} />
          <Route path="/basic-info/contracts/drafts"                     element={<Placeholder label="تعریف پیش‌نویس قراردادها" />} />
          <Route path="/basic-info/contracts/register"                   element={<Placeholder label="ثبت قراردادها" />} />
          <Route path="/basic-info/contracts/deductions"                 element={<Placeholder label="تعریف کسور هر قرارداد" />} />
          <Route path="/basic-info/contracts/change-25"                  element={<Placeholder label="ثبت افزایش و کاهش ۲۵٪ قرارداد" />} />
          <Route path="/basic-info/contracts/addendum"                   element={<Placeholder label="ثبت متمم قراردادها" />} />
          <Route path="/basic-info/contracts/change-25-addendum"         element={<Placeholder label="ثبت افزایش و کاهش ۲۵٪ تغییرات" />} />
          <Route path="/basic-info/contracts/report-by-party"            element={<Placeholder label="گزارش بر اساس طرف قرارداد" />} />
          <Route path="/basic-info/contracts/status"                     element={<Placeholder label="وضعیت قرارداد" />} />
          <Route path="/basic-info/contracts/card"                       element={<Placeholder label="کارت قرارداد" />} />
          <Route path="/basic-info/contracts/payment-statement"          element={<Placeholder label="صورت پرداخت قراردادها" />} />
          <Route path="/basic-info/contracts/purchase-power-rate"        element={<Placeholder label="نرخ حفظ قدرت خرید" />} />
          <Route path="/basic-info/contracts/penalty-rate"               element={<Placeholder label="نرخ درصد محاسبه جرائم" />} />
          <Route path="/basic-info/bookkeeping"                          element={<Bookkeeping />} />
          <Route path="/basic-info/bookkeeping/account-heads"           element={<Placeholder label="تعریف سرفصل حساب‌ها" />} />
          <Route path="/basic-info/bookkeeping/fiscal-period"           element={<Placeholder label="تعریف دوره مالی" />} />
          <Route path="/basic-info/bookkeeping/persons"                 element={<Placeholder label="تعریف اشخاص" />} />
          <Route path="/basic-info/bookkeeping/detail"                  element={<Placeholder label="تعریف تفصیلی" />} />
          <Route path="/basic-info/bookkeeping/detail-moein"            element={<Placeholder label="ارتباط تفصیلی با معین" />} />
          <Route path="/basic-info/bookkeeping/reports"                        element={<Placeholder label="گزارش‌ها" />} />
          <Route path="/basic-info/bookkeeping/reports/general-ledger-req"    element={<Placeholder label="ملزومات حساب کل" />} />
          <Route path="/basic-info/bookkeeping/reports/subsidiary-req"        element={<Placeholder label="ملزومات حساب معین" />} />
          <Route path="/basic-info/bookkeeping/reports/permanent-equiv"       element={<Placeholder label="کدهای معادل حساب‌های دائمی" />} />
          <Route path="/basic-info/bookkeeping/treasurer-moein"         element={<Placeholder label="ارتباط ذیحساب با معین" />} />
          <Route path="/basic-info/bookkeeping/sanama"                  element={<Placeholder label="الزامات سناما" />} />
          <Route path="/basic-info/bookkeeping/person-replacement"      element={<Placeholder label="جایگزینی اشخاص" />} />

          {/* منوی اصلی */}
          {/* تنظیم اسناد */}
          <Route path="/document-setup"                          element={<DocumentSetup />} />
          <Route path="/document-setup/calc-form"               element={<Placeholder label="تعریف فرم محاسبه" />} />
          <Route path="/document-setup/calc-form-search"        element={<Placeholder label="جستجوی فرم‌های محاسبه" />} />
          <Route path="/document-setup/manual-doc"              element={<Placeholder label="صدور سند دستی" />} />
          <Route path="/document-setup/issue-doc"               element={<Placeholder label="صدور سند" />} />
          <Route path="/document-setup/search-doc"              element={<Placeholder label="جستجو در سند" />} />
          <Route path="/document-setup/transfer-doc"            element={<Placeholder label="انتقال اسناد" />} />
          <Route path="/document-setup/report"                        element={<Placeholder label="گزارش" />} />
          <Route path="/document-setup/report/doc-report"          element={<Placeholder label="گزارش اسناد" />} />
          <Route path="/document-setup/report/no-doc-funded"       element={<Placeholder label="گزارش تامین اعتبار شده‌هایی که برای آنها سند صادر نشده" />} />
          <Route path="/document-setup/report/print-count"         element={<Placeholder label="گزارش تعداد چاپ سند توسط کاربر" />} />
          <Route path="/document-setup/report/fund-doc-compare"    element={<Placeholder label="گزارش مقایسه‌ای تامین و سند" />} />
          <Route path="/document-setup/report/revert-calc-form"    element={<Placeholder label="برگرداندن فرم محاسبه از تامین شده" />} />
          <Route path="/document-setup/report/moein-violation"     element={<Placeholder label="عدم رعایت الزامات معین" />} />
          <Route path="/document-setup/report/accrual-performance" element={<Placeholder label="عملکرد مطابق با رویکرد تعهدی" />} />
          <Route path="/document-setup/report/combined-turnover"   element={<Placeholder label="گزارش گردش حساب تلفیقی" />} />
          <Route path="/document-setup/report/moein-detail-link"   element={<Placeholder label="ارتباط معین با تفصیلی‌ها" />} />
          <Route path="/document-setup/report/all-period-docs"     element={<Placeholder label="گزارش کلیه اسناد دوره مالی" />} />
          <Route path="/document-setup/report/bank-report"         element={<Placeholder label="گزارش بانک" />} />
          <Route path="/document-setup/report/attachment"          element={<Placeholder label="مشاهده و ذخیره ضمیمه اسناد" />} />
          <Route path="/document-setup/copy-doc"                element={<Placeholder label="کپی اسناد" />} />
          <Route path="/document-setup/payroll-doc"             element={<Placeholder label="صدور سند حقوق" />} />
          <Route path="/document-setup/empty-doc"               element={<Placeholder label="درج سند خالی" />} />
          <Route path="/document-setup/receipt-form"            element={<Placeholder label="فرم دریافت وجه دریافت پرداخت" />} />
          <Route path="/document-setup/income-reg"              element={<Placeholder label="ثبت درآمد" />} />
          <Route path="/document-setup/securities-reg"          element={<Placeholder label="ثبت اوراق بهادار" />} />
          <Route path="/document-setup/securities-dist"         element={<Placeholder label="توزیع اوراق بهادار" />} />
          <Route path="/document-setup/securities-collect"      element={<Placeholder label="وصول درآمد اوراق بهادار" />} />
          <Route path="/document-setup/securities-report"             element={<Placeholder label="گزارشات اوراق" />} />
          <Route path="/document-setup/securities-report/performance" element={<Placeholder label="گزارش عملکرد اوراق" />} />
          <Route path="/document-setup/merge-docs"              element={<Placeholder label="ادغام اسناد" />} />
          <Route path="/document-setup/assets-doc"              element={<Placeholder label="صدور سند اموال" />} />
          <Route path="/document-setup/income-doc"              element={<Placeholder label="ثبت سند درآمدی" />} />
          <Route path="/document-setup/penalty-calc"            element={<Placeholder label="محاسبه جرائم" />} />
          <Route path="/review"                                 element={<Review />} />
          <Route path="/credits"                                element={<Credits />} />
          <Route path="/check-issuance"                         element={<CheckIssuance />} />
          <Route path="/bookkeeping"                            element={<Bookkeeping />} />
          <Route path="/system-management"                      element={<SystemManagement />} />
          <Route path="/guarantees"                             element={<Guarantees />} />
          <Route path="/deposits"                               element={<Deposits />} />

          <Route path="*"                                       element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
