import React, { useState, useEffect, useRef, useId } from "react";
import { Building2, CheckCircle2 } from "lucide-react";

// لیست کد بانک‌های ایران در شماره شبا (سه رقم سوم تا پنجم در شماره ۲۴ رقمی شبا)
export const IRAN_BANKS = {
  "010": { name: "بانک مرکزی", bg: "bg-blue-900", text: "text-white", border: "border-blue-800", color: "#1e3a8a", icon: "central" },
  "011": { name: "بانک صنعت و معدن", bg: "bg-emerald-800", text: "text-white", border: "border-emerald-700", color: "#065f46", icon: "industry" },
  "012": { name: "بانک ملت", bg: "bg-rose-700", text: "text-white", border: "border-rose-600", color: "#be123c", icon: "mellat" },
  "013": { name: "بانک رفاه کارگران", bg: "bg-blue-700", text: "text-white", border: "border-blue-600", color: "#1d4ed8", icon: "refah" },
  "014": { name: "بانک مسکن", bg: "bg-amber-600", text: "text-white", border: "border-amber-500", color: "#d97706", icon: "maskan" },
  "015": { name: "بانک سپه", bg: "bg-amber-700", text: "text-white", border: "border-amber-600", color: "#b45309", icon: "sepah" },
  "016": { name: "بانک کشاورزی", bg: "bg-green-700", text: "text-white", border: "border-green-600", color: "#15803d", icon: "keshavarzi" },
  "017": { name: "بانک ملی ایران", bg: "bg-sky-700", text: "text-white", border: "border-sky-600", color: "#0369a1", icon: "melli" },
  "018": { name: "بانک تجارت", bg: "bg-indigo-700", text: "text-white", border: "border-indigo-600", color: "#4338ca", icon: "tejarat" },
  "019": { name: "بانک صادرات ایران", bg: "bg-teal-700", text: "text-white", border: "border-teal-600", color: "#0f766e", icon: "saderat" },
  "020": { name: "بانک توسعه صادرات", bg: "bg-emerald-700", text: "text-white", border: "border-emerald-600", color: "#047857", icon: "export" },
  "021": { name: "پست بانک ایران", bg: "bg-cyan-700", text: "text-white", border: "border-cyan-600", color: "#0e7490", icon: "post" },
  "022": { name: "بانک توسعه تعاون", bg: "bg-teal-800", text: "text-white", border: "border-teal-700", color: "#115e59", icon: "taavon" },
  "051": { name: "مؤسسه اعتباری توسعه", bg: "bg-slate-700", text: "text-white", border: "border-slate-600", color: "#334155", icon: "generic" },
  "053": { name: "بانک کارآفرین", bg: "bg-cyan-800", text: "text-white", border: "border-cyan-700", color: "#155e75", icon: "karafarin" },
  "054": { name: "بانک پارسیان", bg: "bg-amber-600", text: "text-white", border: "border-amber-500", color: "#ca8a04", icon: "parsian" },
  "055": { name: "بانک اقتصاد نوین", bg: "bg-purple-700", text: "text-white", border: "border-purple-600", color: "#7e22ce", icon: "eghtesad" },
  "056": { name: "بانک سامان", bg: "bg-blue-600", text: "text-white", border: "border-blue-500", color: "#2563eb", icon: "saman" },
  "057": { name: "بانک پاسارگاد", bg: "bg-yellow-700", text: "text-white", border: "border-yellow-600", color: "#a16207", icon: "pasargad" },
  "058": { name: "بانک سرمایه", bg: "bg-sky-600", text: "text-white", border: "border-sky-500", color: "#0284c7", icon: "sarmayeh" },
  "059": { name: "بانک سینا", bg: "bg-emerald-600", text: "text-white", border: "border-emerald-500", color: "#059669", icon: "sina" },
  "060": { name: "بانک مهر ایران", bg: "bg-teal-600", text: "text-white", border: "border-teal-500", color: "#0d9488", icon: "mehr" },
  "061": { name: "بانک شهر", bg: "bg-red-700", text: "text-white", border: "border-red-600", color: "#b91c1c", icon: "shahr" },
  "062": { name: "بانک آینده", bg: "bg-orange-800", text: "text-white", border: "border-orange-700", color: "#9a3412", icon: "ayandeh" },
  "063": { name: "بانک انصار", bg: "bg-blue-900", text: "text-white", border: "border-blue-800", color: "#1e3a8a", icon: "sepah" },
  "064": { name: "بانک گردشگری", bg: "bg-rose-800", text: "text-white", border: "border-rose-700", color: "#9f1239", icon: "gardeshgari" },
  "065": { name: "بانک حکمت ایرانیان", bg: "bg-indigo-800", text: "text-white", border: "border-indigo-700", color: "#3730a3", icon: "sepah" },
  "066": { name: "بانک دی", bg: "bg-pink-700", text: "text-white", border: "border-pink-600", color: "#be185d", icon: "day" },
  "069": { name: "بانک ایران زمین", bg: "bg-lime-700", text: "text-white", border: "border-lime-600", color: "#4d7c0f", icon: "iranzamin" },
  "070": { name: "بانک رسالت", bg: "bg-sky-800", text: "text-white", border: "border-sky-700", color: "#075985", icon: "resalat" },
  "073": { name: "مؤسسه اعتباری کوثر", bg: "bg-indigo-900", text: "text-white", border: "border-indigo-800", color: "#312e81", icon: "sepah" },
  "075": { name: "مؤسسه اعتباری ملل", bg: "bg-amber-800", text: "text-white", border: "border-amber-700", color: "#92400e", icon: "melal" },
  "078": { name: "بانک خاورمیانه", bg: "bg-slate-800", text: "text-white", border: "border-slate-700", color: "#1e293b", icon: "khavarmiane" },
  "079": { name: "بانک مهر اقتصاد", bg: "bg-blue-800", text: "text-white", border: "border-blue-700", color: "#1e40af", icon: "sepah" },
  "080": { name: "مؤسسه اعتباری نور", bg: "bg-yellow-800", text: "text-white", border: "border-yellow-700", color: "#854d0e", icon: "generic" },
};

// تبدیل اعداد فارسی به انگلیسی
export function toEnglishDigits(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

// استخراج خالص ۲۴ رقم شبا
export function extractShebaDigits(str) {
  const clean = toEnglishDigits(str).toUpperCase();
  const withoutIR = clean.replace(/^IR/, "").replace(/[^\d]/g, "");
  return withoutIR.slice(0, 24);
}

// فرمت‌بندی نمایش: ۲ رقم + ۵ تا ۴ رقمی + ۲ رقم (جداشده با فاصله)
export function formatShebaDigits(rawDigits) {
  const digits = extractShebaDigits(rawDigits);
  if (!digits) return "";

  const p1 = digits.slice(0, 2);   // ۲ رقم اول (Check Digits)
  const p2 = digits.slice(2, 6);   // ۴ رقم اول (شامل کد بانک)
  const p3 = digits.slice(6, 10);  // ۴ رقم دوم
  const p4 = digits.slice(10, 14); // ۴ رقم سوم
  const p5 = digits.slice(14, 18); // ۴ رقم چهارم
  const p6 = digits.slice(18, 22); // ۴ رقم پنجم
  const p7 = digits.slice(22, 24); // ۲ رقم پایانی

  return [p1, p2, p3, p4, p5, p6, p7].filter(Boolean).join(" ");
}

// تشخیص مشخصات بانک از روی ۲۴ رقم شبا
export function getBankFromSheba(rawDigits) {
  const digits = extractShebaDigits(rawDigits);
  if (digits.length < 5) return null;
  const bankCode = digits.slice(2, 5);
  return IRAN_BANKS[bankCode] || null;
}

// کامپوننت رندر آرم/لوگوی بانک‌ها
export function BankLogoIcon({ bank, size = "h-4 w-4" }) {
  if (!bank) return <Building2 className={size} />;

  switch (bank.icon) {
    case "melli":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#0369a1" />
          <path d="M12 4L16 10H8L12 4Z" fill="#fef08a" />
          <path d="M12 20L8 14H16L12 20Z" fill="#fef08a" />
          <circle cx="12" cy="12" r="3" fill="#ffffff" />
        </svg>
      );
    case "mellat":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#be123c" />
          <circle cx="12" cy="12" r="6" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="2.5" fill="#facc15" />
        </svg>
      );
    case "tejarat":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#4338ca" />
          <path d="M6 6H18V18H6V6Z" stroke="#ffffff" strokeWidth="2" />
          <path d="M9 9H15V15H9V9Z" fill="#60a5fa" />
        </svg>
      );
    case "saderat":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0f766e" />
          <path d="M12 4L19 12L12 20L5 12L12 4Z" stroke="#ffffff" strokeWidth="2" fill="#2dd4bf" />
        </svg>
      );
    case "sepah":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#b45309" />
          <path d="M12 5L15 11L21 12L16.5 16.5L18 22.5L12 19.5L6 22.5L7.5 16.5L3 12L9 11L12 5Z" fill="#fef08a" />
        </svg>
      );
    case "maskan":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#d97706" />
          <path d="M4 12L12 5L20 12V19H4V12Z" fill="#ffffff" />
          <rect x="9" y="13" width="6" height="6" fill="#d97706" />
        </svg>
      );
    case "keshavarzi":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#15803d" />
          <path d="M12 4V20M12 12L7 7M12 16L6 11M12 16L17 7M12 16L18 11" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "pasargad":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#a16207" />
          <circle cx="12" cy="12" r="7" stroke="#fef08a" strokeWidth="2" fill="#78350f" />
          <path d="M12 8V16M8 12H16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "saman":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#2563eb" />
          <path d="M6 16C6 11 12 11 12 8C12 5 6 6 6 6M18 8C18 13 12 13 12 16C12 19 18 18 18 18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "parsian":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#ca8a04" />
          <circle cx="12" cy="12" r="7" fill="#ffffff" />
          <circle cx="12" cy="12" r="3.5" fill="#ca8a04" />
        </svg>
      );
    case "refah":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#1d4ed8" />
          <path d="M12 5L19 9V15L12 19L5 15V9L12 5Z" stroke="#ffffff" strokeWidth="2" fill="#3b82f6" />
        </svg>
      );
    case "shahr":
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#b91c1c" />
          <path d="M6 18V10L12 5L18 10V18H6Z" fill="#ffffff" />
          <rect x="10" y="12" width="4" height="6" fill="#b91c1c" />
        </svg>
      );
    default:
      return (
        <div className={`flex items-center justify-center rounded ${bank.bg} ${bank.text} font-bold text-[9px] px-1 py-0.5 min-w-[20px] shadow-xs`}>
          {bank.name.replace("بانک ", "").replace("مؤسسه اعتباری ", "").slice(0, 6)}
        </div>
      );
  }
}

/**
 * کامپوننت ورودی استاندارد شماره شبا
 * - IR دقیقا در سمت چپ و لوگوی بانک در سمت راست (دستور صریح کاربر)
 * - عدم از دست رفتن فوکوس هنگام تایپ
 * - محدودیت ۲۴ رقم عددی و فرمت‌بندی ۲ + ۵ تا ۴ رقمی + ۲ رقم
 */
export default function ShebaInput({
  value = "",
  onChange,
  onBlur,
  onFocus,
  placeholder = "مثال: 12 0170 0000 0010 2345 6789 01",
  className = "",
  disabled = false,
  readOnly = false,
  showBankBadge = true,
  name,
  id,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const inputRef = useRef(null);
  const isFocusedRef = useRef(false);
  const [isFocusedState, setIsFocusedState] = useState(false);

  // نگهداشت local digits جهت عدم قطعی فوکوس و تایپ پیوسته
  const [localRaw, setLocalRaw] = useState(() => extractShebaDigits(value));

  // همگام‌سازی با تغییرات خارجی پروپ value (در صورتی که فوکوس نباشد)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalRaw(extractShebaDigits(value));
    }
  }, [value]);

  const digits = localRaw;
  const formattedText = formatShebaDigits(digits);
  const bank = getBankFromSheba(digits);

  const showIR = isFocusedState || digits.length > 0;

  const handleChange = (e) => {
    const rawInput = e.target.value;
    const newDigits = extractShebaDigits(rawInput);
    setLocalRaw(newDigits);

    if (onChange) {
      const eventObj = {
        target: { name: name || inputId, value: newDigits },
        currentTarget: { name: name || inputId, value: newDigits },
      };
      onChange(newDigits, eventObj);
    }
  };

  const handleFocus = (e) => {
    isFocusedRef.current = true;
    setIsFocusedState(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    isFocusedRef.current = false;
    setIsFocusedState(false);
    // پس از blur مقدار نهایی را مجددا با پروپ value همگام کنید
    setLocalRaw(extractShebaDigits(value));
    if (onBlur) onBlur(e);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* کانتینر با dir="ltr" تا IR حتما سمت چپ و لوگوی بانک سمت راست قرار بگیرد */}
      <div 
        dir="ltr"
        className={`relative flex items-center rounded-md border bg-white shadow-xs transition-all duration-150 ${
          isFocusedState ? "border-primary ring-1 ring-primary/20 shadow-xs" : "border-input hover:border-muted-foreground/40"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-muted/20" : ""}`}
      >
        
        {/* ۱. سمت چپ (Left Side): پیشوند IR */}
        <div className={`flex items-center justify-center pl-2.5 pr-2 py-1 select-none transition-all duration-150 border-r border-border/40 shrink-0 ${
          showIR ? "bg-primary/10 text-primary font-bold text-xs opacity-100" : "bg-muted/30 text-muted-foreground/50 font-medium text-xs opacity-70"
        }`}>
          <span className="font-mono tracking-wider">IR</span>
        </div>

        {/* ۲. وسط (Middle): فیلد ورودی عدد */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          dir="ltr"
          disabled={disabled}
          readOnly={readOnly}
          value={formattedText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full bg-transparent py-1 px-2 text-xs font-mono tracking-wider text-left text-foreground outline-none placeholder:text-muted-foreground/40 placeholder:font-sans placeholder:tracking-normal ${className}`}
        />

        {/* ۳. سمت راست (Right Side): آرم و نام بانک */}
        {showBankBadge && (
          <div className="flex items-center gap-1.5 px-2 select-none shrink-0 border-l border-border/30">
            {bank ? (
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[10px] font-semibold text-foreground truncate max-w-[100px] dir-rtl">
                  {bank.name}
                </span>
                <BankLogoIcon bank={bank} size="h-3.5 w-3.5" />
              </div>
            ) : digits.length >= 5 ? (
              <span className="text-[9px] text-muted-foreground/60 italic">کد بانک ناشناخته</span>
            ) : null}

            {digits.length === 24 && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 animate-in zoom-in duration-150" title="شماره شبا ۲۴ رقم کامل است" />
            )}
          </div>
        )}
      </div>

      {/* زیرنویس شماره شبا با فرمت خروجی */}
      {showIR && formattedText && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5 dir-rtl">
          <span className="font-mono dir-ltr text-[11px] text-primary/90 font-semibold">
            IR {formattedText}
          </span>
          <span className="text-[10px] text-muted-foreground/80">
            {digits.length} از ۲۴ رقم
          </span>
        </div>
      )}
    </div>
  );
}
