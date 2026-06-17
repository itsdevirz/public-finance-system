import { useState, useRef, createContext, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── shared timer context — همه سطوح popup یه timer مشترک دارن ──────────────
const TimerCtx = createContext(null);

// ─── داده‌های منو ─────────────────────────────────────────────────────────────

const CREDITS_SUB = [
  { to: "/basic-info/credits/chapters",           label: "تعریف فصول" },
  { to: "/basic-info/credits/sub-chapters",       label: "تعریف زیرفصول" },
  { to: "/basic-info/credits/chapter-parts",      label: "تعریف جز فصول" },
  { to: "/basic-info/credits/chapters-full",      label: "تعریف فصول / زیرفصول / جز فصول" },
  { to: "/basic-info/credits/resources",          label: "تعریف منابع" },
  { to: "/basic-info/credits/clauses",            label: "تعریف بند و اجزا" },
  { to: "/basic-info/credits/deputies",           label: "تعریف معاونت‌ها" },
  { to: "/basic-info/credits/departments",        label: "تعریف ادارات کل" },
  { to: "/basic-info/credits/representatives",    label: "تعریف نمایندگی" },
  { to: "/basic-info/credits/program-specs",      label: "تعریف مشخصات برنامه / طرح" },
  { to: "/basic-info/credits/activity-specs",     label: "تعریف مشخصات فعالیت / پروژه" },
  { to: "/basic-info/credits/sub-activity-specs", label: "تعریف مشخصات زیرفعالیت / زیرپروژه" },
  { to: "/basic-info/credits/sub-account-agents", label: "تعریف عاملین زیرحساب" },
  { to: "/basic-info/credits/notification-recv",  label: "معرفی ابلاغ‌گیرندگان" },
  { to: "/basic-info/credits/misc-payments",      label: "تعریف پرداخت‌های متفرقه" },
  { to: "/basic-info/credits/resource-nature",    label: "ماهیت منابع" },
  { to: "/basic-info/credits/cost-center",        label: "مرکز هزینه" },
  { to: "/basic-info/credits/row",                label: "ردیف" },
  { to: "/basic-info/credits/income-type",        label: "نوع درآمد" },
  { to: "/basic-info/credits/income-subject",     label: "موضوع درآمد / سایر درآمدهای دولت" },
  { to: "/basic-info/credits/tax-period",         label: "دوره مالیاتی" },
  { to: "/basic-info/credits/donations-class",    label: "طبقه‌بندی هدایا و کمک‌های دریافتی" },
  { to: "/basic-info/credits/securities",         label: "اوراق بهادار" },
  { to: "/basic-info/credits/notifier",           label: "ابلاغ‌دهنده" },
  { to: "/basic-info/credits/deposit-nature",     label: "ماهیت سپرده" },
  { to: "/basic-info/credits/receivables-status", label: "وضعیت مطالبات" },
  { to: "/basic-info/credits/non-final-payment",  label: "انواع پرداخت غیرقطعی" },
  { to: "/basic-info/credits/shortage-subject",   label: "موضوع کسری ابوابجمعی" },
  { to: "/basic-info/credits/insurance-type",     label: "نوع بیمه" },
  { to: "/basic-info/credits/bank-account-type",  label: "نوع حساب بانکی" },
  { to: "/basic-info/credits/income-specs",       label: "مشخصات درآمد" },
  { to: "/basic-info/credits/creation-year",      label: "سال ایجاد" },
  { to: "/basic-info/credits/securities-specs",   label: "مشخصات اوراق یا اسناد" },
  { to: "/basic-info/credits/transferred-items",  label: "اقلام انتقال‌یافته" },
  { to: "/basic-info/credits/securities-price",   label: "تعریف قیمت واحد اوراق بهادار" },
  { to: "/basic-info/credits/fixed-assets-types", label: "تعریف انواع دارایی ثابت" },
  {
    to: "/basic-info/credits/equivalent-detail",
    label: "تفضیلی‌های معادل",
    children: [
      { to: "/basic-info/credits/equivalent-detail/commercial-chapters",     label: "فصول بازرگانی" },
      { to: "/basic-info/credits/equivalent-detail/commercial-cost-centers", label: "مراکز هزینه بازرگانی" },
    ],
  },
  { to: "/basic-info/credits/receivables-subject", label: "موضوع مطالبات" },
];

const BASIC_INFO_SUB = [
  { to: "/basic-info/credits",        label: "اعتبارات",    children: CREDITS_SUB },
  {
    to: "/basic-info/document-setup", label: "تنظیم اسناد",
    children: [
      { to: "/basic-info/document-setup/document-types", label: "تعریف انواع سند" },
      { to: "/basic-info/document-setup/payment-types",  label: "تعریف انواع پرداخت" },
    ],
  },
  {
    to: "/basic-info/check-issuance", label: "صدور چک",
    children: [
      { to: "/basic-info/check-issuance/bank-branches",  label: "تعریف شعب بانکی" },
      { to: "/basic-info/check-issuance/bank-accounts",  label: "تعریف شماره حساب بانکی" },
      { to: "/basic-info/check-issuance/checkbooks",     label: "تعریف دسته چک هر شماره حساب" },
      { to: "/basic-info/check-issuance/recipients",     label: "تعریف گیرندگان چک" },
      { to: "/basic-info/check-issuance/contract-desc",  label: "تعریف شرح چک هر قرارداد" },
    ],
  },
  {
    to: "/basic-info/contracts", label: "قراردادها",
    children: [
      { to: "/basic-info/contracts/deduction-types",     label: "تعریف انواع کسور" },
      { to: "/basic-info/contracts/parties",             label: "تعریف طرف قرارداد" },
      { to: "/basic-info/contracts/drafts",              label: "تعریف پیش‌نویس قراردادها" },
      { to: "/basic-info/contracts/register",            label: "ثبت قراردادها" },
      { to: "/basic-info/contracts/deductions",          label: "تعریف کسور هر قرارداد" },
      { to: "/basic-info/contracts/change-25",           label: "ثبت افزایش و کاهش ۲۵٪ قرارداد" },
      { to: "/basic-info/contracts/addendum",            label: "ثبت متمم قراردادها" },
      { to: "/basic-info/contracts/change-25-addendum",  label: "ثبت افزایش و کاهش ۲۵٪ تغییرات" },
      { to: "/basic-info/contracts/report-by-party",     label: "گزارش بر اساس طرف قرارداد" },
      { to: "/basic-info/contracts/status",              label: "وضعیت قرارداد" },
      { to: "/basic-info/contracts/card",                label: "کارت قرارداد" },
      { to: "/basic-info/contracts/payment-statement",   label: "صورت پرداخت قراردادها" },
      { to: "/basic-info/contracts/purchase-power-rate", label: "نرخ حفظ قدرت خرید" },
      { to: "/basic-info/contracts/penalty-rate",        label: "نرخ درصد محاسبه جرائم" },
    ],
  },
  {
    to: "/basic-info/bookkeeping", label: "دفترداری",
    children: [
      { to: "/basic-info/bookkeeping/account-heads",      label: "تعریف سرفصل حساب‌ها" },
      { to: "/basic-info/bookkeeping/fiscal-period",      label: "تعریف دوره مالی" },
      { to: "/basic-info/bookkeeping/persons",            label: "تعریف اشخاص" },
      { to: "/basic-info/bookkeeping/detail",             label: "تعریف تفصیلی" },
      { to: "/basic-info/bookkeeping/detail-moein",       label: "ارتباط تفصیلی با معین" },
      {
        to: "/basic-info/bookkeeping/reports", label: "گزارش‌ها",
        children: [
          { to: "/basic-info/bookkeeping/reports/general-ledger-req", label: "ملزومات حساب کل" },
          { to: "/basic-info/bookkeeping/reports/subsidiary-req",     label: "ملزومات حساب معین" },
          { to: "/basic-info/bookkeeping/reports/permanent-equiv",    label: "کدهای معادل حساب‌های دائمی" },
        ],
      },
      { to: "/basic-info/bookkeeping/treasurer-moein",    label: "ارتباط ذیحساب با معین" },
      { to: "/basic-info/bookkeeping/sanama",             label: "الزامات سناما" },
      { to: "/basic-info/bookkeeping/person-replacement", label: "جایگزینی اشخاص" },
    ],
  },
];

const DOCUMENT_SETUP_TOP = [
  { to: "/document-setup/calc-form",          label: "تعریف فرم محاسبه" },
  { to: "/document-setup/calc-form-search",   label: "جستجوی فرم‌های محاسبه" },
  { to: "/document-setup/manual-doc",         label: "صدور سند دستی" },
  { to: "/document-setup/issue-doc",          label: "صدور سند" },
  { to: "/document-setup/search-doc",         label: "جستجو در سند" },
  { to: "/document-setup/transfer-doc",       label: "انتقال اسناد" },
  {
    to: "/document-setup/report", label: "گزارش",
    children: [
      { to: "/document-setup/report/doc-report",          label: "گزارش اسناد" },
      { to: "/document-setup/report/no-doc-funded",       label: "گزارش تامین اعتبار شده‌هایی که سند ندارند" },
      { to: "/document-setup/report/print-count",         label: "گزارش تعداد چاپ سند توسط کاربر" },
      { to: "/document-setup/report/fund-doc-compare",    label: "گزارش مقایسه‌ای تامین و سند" },
      { to: "/document-setup/report/revert-calc-form",    label: "برگرداندن فرم محاسبه از تامین شده" },
      { to: "/document-setup/report/moein-violation",     label: "عدم رعایت الزامات معین" },
      { to: "/document-setup/report/accrual-performance", label: "عملکرد مطابق با رویکرد تعهدی" },
      { to: "/document-setup/report/combined-turnover",   label: "گزارش گردش حساب تلفیقی" },
      { to: "/document-setup/report/moein-detail-link",   label: "ارتباط معین با تفصیلی‌ها" },
      { to: "/document-setup/report/all-period-docs",     label: "گزارش کلیه اسناد دوره مالی" },
      { to: "/document-setup/report/bank-report",         label: "گزارش بانک" },
      { to: "/document-setup/report/attachment",          label: "مشاهده و ذخیره ضمیمه اسناد" },
    ],
  },
  { to: "/document-setup/copy-doc",           label: "کپی اسناد" },
  { to: "/document-setup/payroll-doc",        label: "صدور سند حقوق" },
  { to: "/document-setup/empty-doc",          label: "درج سند خالی" },
  { to: "/document-setup/receipt-form",       label: "فرم دریافت وجه دریافت پرداخت" },
  { to: "/document-setup/income-reg",         label: "ثبت درآمد" },
  { to: "/document-setup/securities-reg",     label: "ثبت اوراق بهادار" },
  { to: "/document-setup/securities-dist",    label: "توزیع اوراق بهادار" },
  { to: "/document-setup/securities-collect", label: "وصول درآمد اوراق بهادار" },
  {
    to: "/document-setup/securities-report", label: "گزارشات اوراق",
    children: [
      { to: "/document-setup/securities-report/performance", label: "گزارش عملکرد اوراق" },
    ],
  },
  { to: "/document-setup/merge-docs",         label: "ادغام اسناد" },
  { to: "/document-setup/assets-doc",         label: "صدور سند اموال" },
  { to: "/document-setup/income-doc",         label: "ثبت سند درآمدی" },
  { to: "/document-setup/penalty-calc",       label: "محاسبه جرائم" },
];

const TOP_NAV = [
  { to: "/document-setup",    label: "تنظیم اسناد",              num: 2, subItems: DOCUMENT_SETUP_TOP },
  { to: "/review",            label: "رسیدگی",                   num: 3 },
  { to: "/credits",           label: "اعتبارات",                 num: 4 },
  { to: "/check-issuance",    label: "صدور چک",                  num: 5 },
  { to: "/bookkeeping",       label: "دفترداری و تنظیم حساب‌ها", num: 6 },
  { to: "/system-management", label: "مدیریت سیستم",             num: 7 },
  { to: "/guarantees",        label: "تضمینات",                  num: 8 },
  { to: "/deposits",          label: "سپرده‌ها",                 num: 9 },
];

// ─── FloatingMenu ─────────────────────────────────────────────────────────────

function FloatingMenu({ items, anchorRect, onClose }) {
  const navigate = useNavigate();
  const { cancelClose, scheduleClose } = useContext(TimerCtx);
  const [activeChild, setActiveChild] = useState(null);
  const [childRect, setChildRect] = useState(null);

  const right = window.innerWidth - anchorRect.left + 4;
  const maxH = window.innerHeight * 0.8;
  const popupH = Math.min(items.length * 38 + 12, maxH);
  const rawTop = anchorRect.top;
  const overflow = rawTop + popupH - window.innerHeight + 8;
  const top = overflow > 0 ? Math.max(8, rawTop - overflow) : rawTop;

  function handleItemEnter(item, e) {
    cancelClose();
    if (item.children) {
      setActiveChild(item);
      setChildRect(e.currentTarget.getBoundingClientRect());
    } else {
      setActiveChild(null);
      setChildRect(null);
    }
  }

  function handleItemClick(item) {
    if (!item.children) {
      onClose();
      navigate(item.to);
    }
  }

  return (
    <>
      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        style={{
          position: "fixed", right, top, zIndex: 9999,
          pointerEvents: "all",
          background: "linear-gradient(160deg, #1a3050 0%, #162840 100%)",
          borderRadius: 10,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
          padding: "6px 0",
          minWidth: 260,
          maxHeight: `${maxH}px`,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#2e5080 transparent",
          direction: "rtl",
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.to}
            onMouseEnter={(e) => handleItemEnter(item, e)}
            onClick={() => handleItemClick(item)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px", cursor: "pointer", fontSize: 12.5,
              color: activeChild?.to === item.to ? "#f0c040" : "#ccd",
              background: activeChild?.to === item.to ? "rgba(255,255,255,0.07)" : "transparent",
              borderRight: activeChild?.to === item.to ? "2px solid #f0c040" : "2px solid transparent",
              transition: "all 0.12s", userSelect: "none", whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.35, fontSize: 10, minWidth: 22, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.children && <span style={{ fontSize: 9, opacity: 0.5 }}>◀</span>}
          </div>
        ))}
      </div>

      {activeChild && childRect && (
        <FloatingMenu items={activeChild.children} anchorRect={childRect} onClose={onClose} />
      )}
    </>
  );
}

// ─── SidebarItem ──────────────────────────────────────────────────────────────

function SidebarItem({ label, num, to, subItems }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const closeTimer = useRef(null);
  const hasChildren = subItems?.length > 0;

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setMenuOpen(false), 250); };

  function handleMouseEnter(e) {
    cancelClose();
    if (hasChildren) {
      setAnchorRect(e.currentTarget.getBoundingClientRect());
      setMenuOpen(true);
    }
  }

  return (
    // TimerCtx به همه FloatingMenu های nested پاس میشه
    <TimerCtx.Provider value={{ cancelClose, scheduleClose }}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={scheduleClose}>
        <NavLink
          to={to}
          onClick={(e) => hasChildren && e.preventDefault()}
          style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 16px",
            color: isActive ? "#f0c040" : menuOpen ? "#f0c040" : "rgba(255,255,255,0.82)",
            background: isActive ? "rgba(240,192,64,0.1)" : menuOpen ? "rgba(255,255,255,0.06)" : "transparent",
            textDecoration: "none", fontSize: 13,
            borderRight: isActive ? "3px solid #f0c040" : "3px solid transparent",
            transition: "all 0.15s",
          })}
        >
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: 4,
            background: "rgba(255,255,255,0.07)",
            fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0,
          }}>
            {num}
          </span>
          <span style={{ flex: 1 }}>{label}</span>
          {hasChildren && <span style={{ fontSize: 8, opacity: 0.4 }}>◀</span>}
        </NavLink>

        {menuOpen && anchorRect && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}>
            <FloatingMenu
              items={subItems}
              anchorRect={anchorRect}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        )}
      </div>
    </TimerCtx.Provider>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      width: 220,
      background: "linear-gradient(180deg, #152d4a 0%, #1a3557 100%)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      boxShadow: "2px 0 12px rgba(0,0,0,0.25)",
      direction: "rtl",
      overflow: "visible",
      position: "relative",
      zIndex: 100,
    }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 13, fontWeight: "bold", color: "#f0c040" }}>سامانه مالی</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>نظام مالی بخش عمومی</div>
      </div>

      <div style={{ flex: 1, paddingTop: 6, paddingBottom: 6 }}>
        <SidebarItem num={1} label="اطلاعات پایه" to="/basic-info" subItems={BASIC_INFO_SUB} />
        {TOP_NAV.map(({ to, label, num, subItems }) => (
          <SidebarItem key={to} num={num} label={label} to={to} subItems={subItems ?? null} />
        ))}
      </div>

      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #2e6ea6, #1e3a5f)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#f0c040", flexShrink: 0,
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.username}
          </span>
        </div>
        <button
          onClick={logout}
          style={{
            width: "100%", padding: "6px 0",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.55)",
            borderRadius: 6, cursor: "pointer",
            fontSize: 11, fontFamily: "Tahoma",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "white"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >
          خروج از سیستم
        </button>
      </div>
    </nav>
  );
}
