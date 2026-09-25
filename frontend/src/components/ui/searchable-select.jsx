import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X, Check } from "lucide-react";

/**
 * SearchableSelect — RTL-safe dropdown با createPortal، کیبورد ناویگیشن و استایل کاستوم لوکس
 */
export function SearchableSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "انتخاب کنید...",
  disabled = false,
  className = "",
  searchable,
}) {
  const [open, setOpen]                 = useState(false);
  const [query, setQuery]               = useState("");
  const [style, setStyle]               = useState({});
  const [highlightIdx, setHighlightIdx] = useState(0);

  const triggerRef = useRef(null);
  const panelRef   = useRef(null);
  const searchRef  = useRef(null);
  const listRef    = useRef(null);

  const showSearch  = searchable !== undefined ? searchable : options.length > 7;
  const MIN_W       = 180;
  const MAX_W       = 650;
  const MAX_H       = 300;
  const SEARCH_H    = 46;
  const ITEM_H      = 38;

  /* ─── محاسبه موقعیت پاپ‌آپ ─────────────────────────────────── */
  const calcStyle = useCallback(() => {
    if (!triggerRef.current) return;
    const r   = triggerRef.current.getBoundingClientRect();
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;

    /* عرض پاپ‌آپ: متناسب با عرض ورودی (حداقل 180 و حداکثر 650 پیکسل) */
    const panelW = Math.min(Math.max(r.width, MIN_W), MAX_W);
    const validCount = options.filter(o => !o.disabled).length;
    const panelH = Math.min(
      validCount * ITEM_H + (showSearch ? SEARCH_H : 0) + 16,
      MAX_H
    );

    /* باز شدن بالا یا پایین */
    const spaceBelow = vh - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const openUp     = spaceBelow < panelH && spaceAbove > spaceBelow;
    const topVal     = openUp ? Math.max(8, r.top - panelH - 4) : Math.min(vh - panelH - 8, r.bottom + 4);

    /* تراز راست (RTL) با trigger */
    let rightVal = vw - r.right;
    const leftEdge = vw - rightVal - panelW;
    if (leftEdge < 8) rightVal = Math.max(vw - panelW - 8, 8);

    setStyle({
      position: "fixed",
      top:      topVal,
      right:    rightVal,
      width:    panelW,
      zIndex:   99999,
      maxHeight: MAX_H,
    });
  }, [options, showSearch]);

  /* ─── فیلتر لیست ────────────────────────────────────────── */
  const lq       = query.toLowerCase();
  const filtered = query
    ? options.filter(o => !o.disabled && (o.label?.toLowerCase().includes(lq) || String(o.value).toLowerCase().includes(lq)))
    : options;

  const selectableOptions = filtered.filter(o => !o.disabled);

  /* ─── کلیدهای کیبورد ────────────────────────────────────── */
  function handleKeyDown(e) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        calcStyle();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(prev => (prev + 1) % (selectableOptions.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(prev => (prev - 1 + selectableOptions.length) % (selectableOptions.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = selectableOptions[highlightIdx];
      if (target) {
        handleSelect(target.value);
      }
    }
  }

  /* ─── باز / بسته کردن ────────────────────────────────────── */
  function handleOpen(e) {
    e.stopPropagation();
    if (disabled) return;
    if (!open) { calcStyle(); setQuery(""); setHighlightIdx(0); }
    setOpen(o => !o);
  }

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  /* ─── کلیک بیرون / Esc ────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  /* ─── ریسایز / اسکیرول ────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const fn = () => calcStyle();
    window.addEventListener("scroll", fn, true);
    window.addEventListener("resize", fn);
    return () => {
      window.removeEventListener("scroll", fn, true);
      window.removeEventListener("resize", fn);
    };
  }, [open, calcStyle]);

  /* ─── اتوفوکس جستجو ───────────────────────────────────────── */
  useEffect(() => {
    if (open && showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open, showSearch]);

  /* ─── اسکرول خودکار به گزینه highlighted ──────────────────── */
  useEffect(() => {
    if (!open || !listRef.current) return;
    const itemEl = listRef.current.querySelector(`[data-idx="${highlightIdx}"]`);
    if (itemEl) {
      itemEl.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx, open]);

  const hasGroups = options.some(o => o.group);
  const grouped   = hasGroups
    ? filtered.filter(o => !o.disabled).reduce((acc, o) => {
        const g = o.group ?? "";
        (acc[g] ??= []).push(o);
        return acc;
      }, {})
    : null;

  const selectedOption = options.find(o => String(o.value) === String(value));
  const selectedLabel  = selectedOption?.label ?? "";

  /* ─── رندر پاپ‌آپ ──────────────────────────────────────────── */
  let currentSelectableCounter = 0;

  const panel = open && createPortal(
    <div
      ref={panelRef}
      style={style}
      onKeyDown={handleKeyDown}
      className="flex flex-col overflow-hidden rounded-xl border border-primary/20 bg-background/98 backdrop-blur-xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.22)] ring-1 ring-primary/10 transition-all duration-150 animate-in fade-in-50 zoom-in-95"
      dir="rtl"
    >
      {/* ── فیلد جستجو ── */}
      {showSearch && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-primary" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setHighlightIdx(0); }}
            placeholder="جستجو در بین گزینه‌ها..."
            className="flex-1 bg-transparent text-xs text-right outline-none placeholder:text-muted-foreground/60 text-foreground font-medium"
            dir="rtl"
          />
          {query && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setQuery(""); setHighlightIdx(0); }}
              className="rounded-full p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── لیست گزینه‌ها ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-sidebar"
        style={{ maxHeight: MAX_H - (showSearch ? SEARCH_H : 0) - 8 }}
      >
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-7 text-xs text-muted-foreground">
            <Search className="h-4 w-4 opacity-40 text-primary" />
            <span>هیچ موردی یافت نشد</span>
          </div>
        )}

        {hasGroups && grouped
          ? Object.entries(grouped).map(([grp, items]) => (
              <div key={grp} className="space-y-0.5">
                {grp && (
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/90 px-2.5 py-1 backdrop-blur-md rounded-sm my-1">
                    <span className="text-[10px] font-bold text-primary tracking-wide uppercase">{grp}</span>
                    <div className="h-px flex-1 bg-primary/20" />
                  </div>
                )}
                {items.map(opt => {
                  const idx = currentSelectableCounter++;
                  return (
                    <OptionRow
                      key={opt.value}
                      opt={opt}
                      idx={idx}
                      selected={String(opt.value) === String(value)}
                      highlighted={idx === highlightIdx}
                      onSelect={handleSelect}
                      onMouseEnter={() => setHighlightIdx(idx)}
                    />
                  );
                })}
              </div>
            ))
          : filtered.map(opt => {
              if (opt.disabled) {
                return <GroupHeader key={opt.label || opt.value} label={opt.label} />;
              }
              const idx = currentSelectableCounter++;
              return (
                <OptionRow
                  key={opt.value}
                  opt={opt}
                  idx={idx}
                  selected={String(opt.value) === String(value)}
                  highlighted={idx === highlightIdx}
                  onSelect={handleSelect}
                  onMouseEnter={() => setHighlightIdx(idx)}
                />
              );
            })
        }
      </div>
    </div>,
    document.body
  );

  /* ─── Trigger Button ────────────────────────────────────────── */
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        dir="rtl"
        className={[
          "group relative flex w-full items-center justify-between gap-2",
          "h-9 rounded-lg border border-input/90 bg-background/90 px-3",
          "text-xs transition-all duration-150 cursor-pointer select-none",
          "hover:border-primary/70 hover:bg-background hover:shadow-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary",
          open  ? "border-primary bg-background ring-2 ring-primary/25 shadow-xs" : "",
          disabled ? "cursor-not-allowed opacity-50 pointer-events-none" : "",
          className,
        ].filter(Boolean).join(" ")}
      >
        <span
          title={selectedLabel || placeholder}
          className={[
            "flex-1 truncate text-right leading-tight transition-colors",
            selectedLabel ? "font-semibold text-foreground" : "text-muted-foreground/70 font-normal",
          ].join(" ")}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={["h-3.5 w-3.5 shrink-0 text-primary/70 transition-transform duration-200", open ? "-rotate-180 text-primary" : "group-hover:text-primary"].join(" ")} />
      </button>

      {panel}
    </>
  );
}

function GroupHeader({ label }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/80 px-2.5 py-1 backdrop-blur-md rounded-sm my-1">
      <span className="text-[10px] font-bold text-primary uppercase">{label}</span>
      <div className="h-px flex-1 bg-primary/20" />
    </div>
  );
}

function OptionRow({ opt, idx, selected, highlighted, onSelect, onMouseEnter }) {
  return (
    <button
      type="button"
      data-idx={idx}
      data-sel={selected}
      onMouseDown={e => { e.preventDefault(); onSelect(opt.value); }}
      onMouseEnter={onMouseEnter}
      title={opt.label}
      dir="rtl"
      style={{ minHeight: 36 }}
      className={[
        "relative flex w-full items-center gap-2 px-3 py-2 text-right text-xs leading-snug rounded-md transition-all duration-100 cursor-pointer select-none",
        selected
          ? "bg-primary text-primary-foreground font-bold shadow-xs"
          : highlighted
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/85 hover:bg-muted hover:text-foreground",
      ].filter(Boolean).join(" ")}
    >
      <span className="flex-1 truncate text-right" title={opt.label}>{opt.label}</span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary-foreground stroke-[2.5]" />}
    </button>
  );
}

