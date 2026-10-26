import { useEffect } from "react";

function toEnglishDigits(str) {
  if (str == null) return "";
  const s = String(str);
  return s
    .replace(/[۰-۹]/g, (w) => String.fromCharCode(w.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (w) => String.fromCharCode(w.charCodeAt(0) - 1632));
}

function toPersianDigits(str) {
  if (str == null) return "";
  const id = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return String(str).replace(/[0-9]/g, (w) => id[+w]);
}

function setNativeInputValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function isZeroValue(val) {
  if (val == null) return false;
  const s = String(val).trim();
  if (s === "0" || s === "۰" || s === "0.00" || s === "۰.۰۰" || s === "00") return true;
  const eng = toEnglishDigits(s).replace(/,/g, "").replace(/،/g, "").trim();
  return eng === "0" || eng === "0.00";
}

function isCodeOrIdField(el) {
  if (!el) return false;
  if (
    el.dataset?.allowLeadingZero === "true" ||
    el.hasAttribute("data-allow-leading-zero") ||
    el.dataset?.preserveZeros === "true" ||
    el.hasAttribute("data-preserve-zeros") ||
    el.dataset?.code === "true" ||
    el.getAttribute("data-type") === "code"
  ) {
    return true;
  }

  const name = (el.name || "").toLowerCase();
  const id = (el.id || "").toLowerCase();
  const placeholder = (el.placeholder || "").toLowerCase();
  const dataKey = (el.dataset?.key || el.dataset?.field || "").toLowerCase();
  const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase();
  const className = (el.className || "").toLowerCase();
  const combined = `${name} ${id} ${placeholder} ${dataKey} ${ariaLabel} ${className}`;

  const codeKeywords = [
    "project", "program", "code", "number", "num", "shomare",
    "national", "melli", "postal", "phone", "mobile", "tel", "account",
    "sheba", "iban", "card", "serial", "track", "ref", "notifier", "radif",
    "طرح", "برنامه", "شماره", "کد", "ردیف", "ملی", "پستی", "تلفن",
    "موبایل", "حساب", "شبا", "کارت", "سریال", "پیگیری", "شناسه", "فصل"
  ];

  return codeKeywords.some((kw) => combined.includes(kw));
}

function isAmountField(el) {
  if (!el) return false;
  if (isCodeOrIdField(el)) return false;

  const type = (el.getAttribute("type") || "text").toLowerCase();
  if (["checkbox", "radio", "submit", "button", "file", "password", "search", "date", "time", "color"].includes(type)) {
    return false;
  }

  if (el.dataset?.amount === "true" || el.hasAttribute("data-amount")) {
    return true;
  }

  const name = (el.name || "").toLowerCase();
  const id = (el.id || "").toLowerCase();
  const placeholder = (el.placeholder || "").toLowerCase();
  const className = (el.className || "").toLowerCase();
  const dataKey = (el.dataset?.key || el.dataset?.field || "").toLowerCase();

  // Exclude non-amount text inputs
  if (
    name.includes("desc") || id.includes("desc") ||
    placeholder.includes("شرح") || placeholder.includes("جستجو") ||
    name.includes("search") || type === "search" ||
    placeholder.includes("آدرس") || placeholder.includes("توضیح") ||
    name.includes("username") || name.includes("title") || placeholder.includes("عنوان")
  ) {
    return false;
  }

  const amountKeywords = [
    "amount", "debit", "credit_amount", "mablagh", "price", "cost", "rate", "fee",
    "balance", "remittance", "sum", "total", "pay",
    "مبلغ", "بدهکار", "بستانکار", "قیمت", "نرخ", "تنخواه", "وجه", "ارزش"
  ];

  const hasAmountAttr = amountKeywords.some((kw) =>
    name.includes(kw) || id.includes(kw) || placeholder.includes(kw) || className.includes(kw) || dataKey.includes(kw)
  );

  const isInAmountCell = Boolean(el.closest(".amount-field, [data-amount]"));

  return hasAmountAttr || isInAmountCell;
}

export function useAmountPlusShortcut() {
  useEffect(() => {
    function handleFocusIn(e) {
      const el = e.target;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      if (el.disabled || el.readOnly) return;
      if (isCodeOrIdField(el)) return;
      if (!isAmountField(el)) return;

      if (isZeroValue(el.value)) {
        setTimeout(() => {
          try {
            if (document.activeElement === el) {
              el.select();
            }
          } catch (_) {}
        }, 10);
      }
    }

    function handleInput(e) {
      const el = e.target;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      if (el.disabled || el.readOnly) return;

      // Never strip leading zeros from code/ID fields or non-amount fields
      if (isCodeOrIdField(el)) return;
      if (!isAmountField(el)) return;

      const val = el.value || "";
      if (/^[0۰]+[1-9۱-۹]/.test(val)) {
        const eng = toEnglishDigits(val).replace(/^0+/, "");
        const cleaned = /[۰-۹]/.test(val) ? toPersianDigits(eng) : eng;
        setNativeInputValue(el, cleaned);
      }
    }

    function handleKeyDown(e) {
      const el = document.activeElement;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      if (el.disabled || el.readOnly) return;

      // Code/ID inputs should behave normally without shortcut interference
      if (isCodeOrIdField(el)) return;
      if (!isAmountField(el)) return;

      // Handle Backspace on default zero (0 / ۰) value for amounts
      if (e.key === "Backspace" || e.code === "Backspace") {
        if (isZeroValue(el.value)) {
          e.preventDefault();
          e.stopPropagation();
          setNativeInputValue(el, "");
          return;
        }
      }

      // Handle Plus shortcut (+ or NumpadAdd)
      if (e.key !== "+" && e.code !== "NumpadAdd") return;

      const type = (el.getAttribute("type") || "text").toLowerCase();
      const val = (el.value || "").trim();
      const engVal = toEnglishDigits(val).replace(/,/g, "").replace(/،/g, "");

      e.preventDefault();
      e.stopPropagation();

      const engDigits = engVal.replace(/\D/g, "");
      let newEngDigits = engDigits ? (engDigits + "000") : "000";

      const hasPersian = /[۰-۹]/.test(val);
      const hasCommas = val.includes(",") || val.includes("،");

      let finalFormatted = newEngDigits;
      if (type !== "number") {
        if (hasCommas) {
          const num = parseInt(newEngDigits, 10) || 0;
          finalFormatted = num.toLocaleString("fa-IR");
          if (!hasPersian) {
            finalFormatted = toEnglishDigits(finalFormatted);
          }
        } else if (hasPersian) {
          finalFormatted = toPersianDigits(newEngDigits);
        }
      }

      setNativeInputValue(el, finalFormatted);
    }

    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("input", handleInput, true);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("input", handleInput, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);
}
