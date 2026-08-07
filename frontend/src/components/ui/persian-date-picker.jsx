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
export function jalaliToGregorian(jy, jm, jd) {
  const sal_a = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let jy2 = jy - 979;
  let jm2 = jm - 1;
  let jd2 = jd - 1;
  let days = jy2 * 365 + Math.floor(jy2 / 33) * 8 + Math.floor((jy2 % 33 + 3) / 4);
  for (let i = 0; i <= jm2; ++i) days += sal_a[i];
  days += jd2;
  let g_day_no = days + 79;
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097);
  g_day_no = g_day_no % 146097;
  let leap = 1;
  if (g_day_no >= 36525) {
    g_day_no--;
    gy += 100 * Math.floor(g_day_no / 36524);
    g_day_no = g_day_no % 36524;
    if (g_day_no >= 365) {
      g_day_no++;
    } else {
      leap = 0;
    }
  }
  gy += 4 * Math.floor(g_day_no / 1461);
  g_day_no %= 1461;
  if (g_day_no >= 366) {
    leap = 0;
    g_day_no--;
    gy += Math.floor(g_day_no / 365);
    g_day_no = g_day_no % 365;
  }
  let i;
  const sal_g = [31, (leap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (i = 0; g_day_no >= sal_g[i]; i++) {
    g_day_no -= sal_g[i];
  }
  let gm = i + 1;
  let gd = g_day_no + 1;
  return new Date(gy, gm - 1, gd);
}

export function gregorianToJalali(date) {
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
  const parts = formatter.formatToParts(date);
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value.padStart(2, '0');
  const d = parts.find(p => p.type === 'day').value.padStart(2, '0');
  return `${y}/${m}/${d}`;
}

export function parseJalaliDate(dateStr) {
  if (!dateStr) return null;
  const english = toEnglishDigits(dateStr);
  const parts = english.split("/");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { y, m, d };
    }
  }
  return null;
}

export function addDaysToJalali(dateStr, days) {
  const parsed = parseJalaliDate(dateStr);
  if (!parsed) return "";
  const gDate = jalaliToGregorian(parsed.y, parsed.m, parsed.d);
  gDate.setDate(gDate.getDate() + days);
  return gregorianToJalali(gDate);
}

export function diffDaysJalali(dateStr1, dateStr2) {
  const parsed1 = parseJalaliDate(dateStr1);
  const parsed2 = parseJalaliDate(dateStr2);
  if (!parsed1 || !parsed2) return 0;
  const gDate1 = jalaliToGregorian(parsed1.y, parsed1.m, parsed1.d);
  const gDate2 = jalaliToGregorian(parsed2.y, parsed2.m, parsed2.d);
  const diffTime = gDate2.getTime() - gDate1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
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
    const val = e.target.value;
    let filtered = toEnglishDigits(val).replace(/[^0-9/]/g, "");
    if (filtered.length > 10) filtered = filtered.substring(0, 10);
    const finalVal = toPersianDigits(filtered);
    onChange({ target: { value: finalVal } });
  };

  const handleInputBlur = (e) => {
    let val = toEnglishDigits(e.target.value);
    let digits = val.replace(/\D/g, "");
    if (digits.length === 8) {
      const formatted = `${digits.substring(0, 4)}/${digits.substring(4, 6)}/${digits.substring(6, 8)}`;
      onChange({ target: { value: toPersianDigits(formatted) } });
    }
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

  const displayValue = (value === "0" || value === 0 || value === "00000000" || !value) ? "" : toPersianDigits(value);

  return (
    <div className="relative inline-block w-full" ref={containerRef} dir="rtl">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={toPersianDigits(placeholder)}
          disabled={disabled}
          required={required}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          className={`flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${className}`}
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
        <div className="absolute z-50 right-0 mt-1 w-72 rounded-2xl border border-border bg-white p-3 text-popover-foreground shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
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
