import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "lucide-react";

// ---- Shamsi Calendar Helpers ----
const MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

export function toPersianDigits(str) {
  const id = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return str?.toString().replace(/[0-9]/g, function(w) {
    return id[+w];
  }) || "";
}

function toEnglishDigits(str) {
  return str?.toString()
    .replace(/[۰-۹]/g, function(w) {
      return w.charCodeAt(0) - 1776;
    })
    .replace(/[٠-٩]/g, function(w) {
      return w.charCodeAt(0) - 1632;
    }) || "";
}

function isLeapYear(jy) {
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33);
}

function getDaysInMonth(jy, jm) {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  if (jm === 12) {
    return isLeapYear(jy) ? 30 : 29;
  }
  return 30;
}

// Convert Jalali to Gregorian to find weekday of the first day
function jalaliToGregorian(jy, jm, jd) {
  const jdn = jd + (jm - 1) * 31 - Math.floor(jm / 7) * (jm - 7) + Math.floor((jy - 474) / 2820) * 1029983 + Math.floor(((jy - 474) % 2820 + 312) / 33) * 12053 + Math.floor(((jy - 474) % 2820 + 312) % 33 * 365) + Math.floor(((jy - 474) % 2820 + 312) % 33 / 4) - 492688;
  
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const gd = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const gm = j + 2 - 12 * l;
  const gy = 100 * (n - 49) + i + l;
  
  return new Date(gy, gm - 1, gd);
}

function getWeekdayOfFirst(jy, jm) {
  const gDate = jalaliToGregorian(jy, jm, 1);
  // Gregorian: 0 (Sun), 1 (Mon), ..., 6 (Sat)
  // Persian: 0 (Sat), 1 (Sun), ..., 6 (Fri)
  return (gDate.getDay() + 1) % 7;
}

export function PersianDatePicker({ value = "", onChange, className = "", placeholder = "۱۴۰۵/۰۱/۰۱", disabled = false, required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Parse value
  const englishVal = toEnglishDigits(value);
  const parts = englishVal.split("/");
  
  const today = new Date();
  // Get current Shamsi date as fallback
  const todayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
  const todayParts = toEnglishDigits(todayFormatter.format(today)).split("/");
  const currentJy = parseInt(todayParts[0], 10) || 1404;
  const currentJm = parseInt(todayParts[1], 10) || 1;
  const currentJd = parseInt(todayParts[2], 10) || 1;

  // View year and month in picker
  const [viewYear, setViewYear] = useState(currentJy);
  const [viewMonth, setViewMonth] = useState(currentJm);

  useEffect(() => {
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (y >= 1300 && y <= 1500 && m >= 1 && m <= 12) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [value]);

  // Click outside listener to close popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    let raw = toEnglishDigits(e.target.value).replace(/\D/g, "");
    if (raw.length > 8) raw = raw.substring(0, 8);

    let formatted = "";
    if (raw.length > 0) {
      formatted += raw.substring(0, 4);
      if (raw.length > 4) {
        formatted += "/" + raw.substring(4, 6);
        if (raw.length > 6) {
          formatted += "/" + raw.substring(6, 8);
        }
      }
    }
    const finalVal = toPersianDigits(formatted);
    onChange({ target: { value: finalVal } });
  };

  const selectDay = (day) => {
    const yStr = viewYear.toString();
    const mStr = viewMonth.toString().padStart(2, "0");
    const dStr = day.toString().padStart(2, "0");
    const finalVal = toPersianDigits(`${yStr}/${mStr}/${dStr}`);
    onChange({ target: { value: finalVal } });
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const weekdayOfFirst = getWeekdayOfFirst(viewYear, viewMonth);

  // Render day grid cells
  const dayCells = [];
  for (let i = 0; i < weekdayOfFirst; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-8 w-8" />);
  }
  
  const selectedDay = parts.length === 3 && parseInt(parts[0], 10) === viewYear && parseInt(parts[1], 10) === viewMonth ? parseInt(parts[2], 10) : null;

  for (let d = 1; d <= daysInMonth; d++) {
    const isSelected = selectedDay === d;
    const isToday = currentJy === viewYear && currentJm === viewMonth && currentJd === d;
    dayCells.push(
      <button
        key={`day-${d}`}
        type="button"
        onClick={() => selectDay(d)}
        className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
          isSelected 
            ? "bg-primary text-white shadow-md shadow-primary/20 scale-105" 
            : isToday 
              ? "border border-primary text-primary bg-primary/5 hover:bg-primary/10" 
              : "hover:bg-muted text-foreground/80 hover:text-foreground"
        }`}
      >
        {toPersianDigits(d)}
      </button>
    );
  }

  return (
    <div className="relative inline-block w-full" ref={containerRef} dir="rtl">
      <div className="relative">
        <input
          type="text"
          value={toPersianDigits(value)}
          onChange={handleInputChange}
          placeholder={toPersianDigits(placeholder)}
          disabled={disabled}
          required={required}
          onFocus={() => setIsOpen(true)}
          className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 rounded-2xl border bg-popover p-3 text-popover-foreground shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-bold"
              title="سال قبل"
            >
              &lt;&lt;
            </button>
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-bold"
              title="ماه قبل"
            >
              &lt;
            </button>
            
            <div className="flex-1 text-center text-xs font-bold text-foreground">
              {MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-bold"
              title="ماه بعد"
            >
              &gt;
            </button>
            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs font-bold"
              title="سال بعد"
            >
              &gt;&gt;
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-1">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((w, idx) => (
              <div key={idx} className={idx === 6 ? "text-rose-500" : ""}>{w}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {dayCells}
          </div>
        </div>
      )}
    </div>
  );
}
