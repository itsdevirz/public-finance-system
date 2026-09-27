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

export function useAmountPlusShortcut() {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== "+" && e.code !== "NumpadAdd") return;

      const el = document.activeElement;
      if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;
      if (el.disabled || el.readOnly) return;

      const type = (el.getAttribute("type") || "text").toLowerCase();
      if (["checkbox", "radio", "submit", "button", "file", "password", "search", "date", "time", "color"].includes(type)) {
        return;
      }

      const name = (el.name || "").toLowerCase();
      const id = (el.id || "").toLowerCase();
      const placeholder = (el.placeholder || "").toLowerCase();
      const className = (el.className || "").toLowerCase();
      const dataKey = (el.dataset?.key || el.dataset?.field || "").toLowerCase();

      // Ignore description / search / non-numeric text inputs
      if (
        name.includes("desc") || id.includes("desc") ||
        placeholder.includes("شرح") || placeholder.includes("جستجو") ||
        name.includes("search") || type === "search" ||
        placeholder.includes("آدرس") || placeholder.includes("توضیح") ||
        name.includes("username") || name.includes("title")
      ) {
        return;
      }

      const amountKeywords = [
        "amount", "debit", "credit", "mablagh", "price", "cost", "rate", "fee",
        "budget", "balance", "value", "remittance", "sum", "total", "pay",
        "مبلغ", "بدهکار", "بستانکار", "قیمت", "هزینه", "نرخ", "اعتبار", "تنخواه", "وجه", "ارزش"
      ];

      const hasAmountAttr = amountKeywords.some(kw =>
        name.includes(kw) || id.includes(kw) || placeholder.includes(kw) || className.includes(kw) || dataKey.includes(kw)
      );

      const val = (el.value || "").trim();
      const engVal = toEnglishDigits(val).replace(/,/g, "").replace(/،/g, "");
      const cleanPlaceholder = toEnglishDigits(placeholder).replace(/,/g, "").trim();

      const isNumericValue = /^\d+(\.\d+)?$/.test(engVal) && engVal !== "";
      const isNumericPlaceholder = /^\d+(\.\d+)?$/.test(cleanPlaceholder);
      const isInTableCell = Boolean(el.closest("td, th, .amount-field, [data-amount]"));

      const isTarget = hasAmountAttr || type === "number" || type === "tel" || isNumericValue || isNumericPlaceholder || isInTableCell;

      if (!isTarget) return;

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

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
