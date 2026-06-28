import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X, Check } from "lucide-react";

/**
 * SearchableSelect — RTL-safe dropdown با createPortal
 *
 * رندر panel داخل document.body انجام می‌شود تا از هر
 * overflow/transform/stacking-context مصون باشد.
 * موقعیت‌یابی: ابتدا از راست trigger شروع می‌شود؛ اگر panel
 * از لبه چپ صفحه بیرون رود، به چپ جابجا می‌شود.
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
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState({});

  const triggerRef = useRef(null);
  const panelRef   = useRef(null);
  const searchRef  = useRef(null);
  const listRef    = useRef(null);

  const showSearch  = searchable !== undefined ? searchable : options.length > 8;
  const MIN_W       = 240;
  const MAX_H       = 288;
  const SEARCH_H    = 44;
  const ITEM_H      = 36;

  /* ─── محاسبه موقعیت ─────────────────────────────────── */
  const calcStyle = useCallback(() => {
    if (!triggerRef.current) return;
    const r   = triggerRef.current.getBoundingClientRect();
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;

    const panelW = Math.max(r.width, MIN_W);
    const listCount = options.filter(o => !o.disabled).length;
    const panelH = Math.min(
      listCount * ITEM_H + (showSearch ? SEARCH_H : 0) + 8,
      MAX_H
    );

    /* باز شدن بالا یا پایین */
    const below   = vh - r.bottom - 6;
    const above   = r.top - 6;
    const openUp  = below < panelH && above > below;
    const topVal  = openUp ? r.top - panelH - 4 : r.bottom + 4;

    /* تراز افقی — RTL: راست-تراز با trigger */
    /* right در fixed = vw - rect.right */
    let rightVal = vw - r.right;

    /* اگر panel از لبه چپ بیرون برود، به چپ shift می‌دهیم */
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
  }, [options.length, showSearch]);

  /* ─── باز / بسته ─────────────────────────────────────── */
  function handleOpen(e) {
    e.stopPropagation();
    if (disabled) return;
    if (!open) { calcStyle(); setQuery(""); }
    setOpen(o => !o);
  }

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  /* ─── بستن با کلیک بیرون / Escape ─────────────────────── */
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [open]);

  /* ─── recalc on scroll/resize ───────────────────────── */
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

  /* ─── focus search ──────────────────────────────────── */
  useEffect(() => {
    if (open && showSearch) {
      const t = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, showSearch]);

  /* ─── scroll to selected ────────────────────────────── */
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelector("[data-sel='true']")?.scrollIntoView({ block: "nearest" });
  }, [open]);

  /* ─── filter ────────────────────────────────────────── */
  const lq       = query.toLowerCase();
  const filtered = query
    ? options.filter(o => !o.disabled && o.label.toLowerCase().includes(lq))
    : options;

  const hasGroups = options.some(o => o.group);
  const grouped   = hasGroups
    ? filtered.filter(o => !o.disabled).reduce((acc, o) => {
        const g = o.group ?? "";
        (acc[g] ??= []).push(o);
        return acc;
      }, {})
    : null;

  const selectedLabel = options.find(o => o.value === value)?.label ?? "";

  /* ─── Panel ─────────────────────────────────────────── */
  const panel = open && createPortal(
    <div
      ref={panelRef}
      style={style}
      className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_8px_32px_-4px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04]"
      dir="rtl"
    >
      {/* ── جستجو ── */}
      {showSearch && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="جستجو..."
            className="flex-1 bg-transparent text-xs text-right outline-none placeholder:text-muted-foreground/50"
            dir="rtl"
          />
          {query && (
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setQuery(""); }}
              className="rounded-full p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── لیست ── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ maxHeight: MAX_H - (showSearch ? SEARCH_H : 0) }}
      >
        {filtered.length === 0 && !filtered.some(o => o.disabled) && (
          <div className="flex flex-col items-center gap-1 py-7 text-xs text-muted-foreground/60">
            <Search className="h-4 w-4 opacity-30" />
            <span>موردی یافت نشد</span>
          </div>
        )}

        {hasGroups && grouped
          ? Object.entries(grouped).map(([grp, items]) => (
              <div key={grp}>
                {grp && (
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/70 px-3 py-1.5 backdrop-blur-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{grp}</span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                )}
                {items.map(opt => <OptionRow key={opt.value} opt={opt} selected={opt.value === value} onSelect={handleSelect} />)}
              </div>
            ))
          : filtered.map(opt =>
              opt.disabled
                ? <GroupHeader key={opt.value} label={opt.label} />
                : <OptionRow key={opt.value} opt={opt} selected={opt.value === value} onSelect={handleSelect} />
            )
        }
      </div>
    </div>,
    document.body
  );

  /* ─── Trigger ───────────────────────────────────────── */
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        dir="rtl"
        className={[
          "group relative flex w-full items-center justify-between gap-1.5",
          "h-9 rounded-lg border border-input/80 bg-background/80 px-2.5",
          "text-xs transition-all duration-150 cursor-pointer select-none",
          "hover:border-primary/60 hover:bg-background hover:shadow-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          open  ? "border-primary bg-background ring-2 ring-primary/20 shadow-sm" : "",
          disabled ? "cursor-not-allowed opacity-40 pointer-events-none" : "",
          className,
        ].filter(Boolean).join(" ")}
      >
        <span
          title={selectedLabel || placeholder}
          className={[
            "flex-1 truncate text-right leading-tight transition-colors",
            selectedLabel ? "font-medium text-foreground" : "text-muted-foreground/70",
          ].join(" ")}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={["h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200", open ? "-rotate-180" : ""].join(" ")} />
      </button>

      {panel}
    </>
  );
}

/* ─── ردیف گروه (header غیرقابل انتخاب) ────────────────── */
function GroupHeader({ label }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/70 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

/* ─── ردیف آیتم ─────────────────────────────────────────── */
function OptionRow({ opt, selected, onSelect }) {
  return (
    <button
      type="button"
      data-sel={selected}
      onMouseDown={e => { e.preventDefault(); onSelect(opt.value); }}
      title={opt.label}
      dir="rtl"
      style={{ minHeight: 36 }}
      className={[
        "relative flex w-full items-center gap-2 px-3 py-1.5 text-right text-xs leading-snug",
        "transition-colors duration-100",
        selected
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/80 hover:bg-muted/50 hover:text-foreground",
      ].join(" ")}
    >
      {/* نوار راست برای آیتم انتخابی */}
      {selected && (
        <span className="absolute right-0 top-1 bottom-1 w-[3px] rounded-full bg-primary" />
      )}
      <span className="flex-1 text-right">{opt.label}</span>
      {selected && <Check className="h-3 w-3 shrink-0 text-primary" />}
    </button>
  );
}
