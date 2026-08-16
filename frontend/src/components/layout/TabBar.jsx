import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Landmark,
  FileText,
  ChevronRight,
  ChevronLeft,
  XCircle,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TabBar() {
  const { tabs, activeTabId, activateTab, closeTab, closeAllTabs } = useTabs();
  const scrollContainerRef = useRef(null);

  // Handle horizontal scrolling via mouse wheel
  const handleWheel = (e) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // Handle middle-click tab closure
  const handleMouseDown = (tabId, e) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  const isOverLimit = tabs.length >= 10;

  return (
    <div className="sticky top-0 z-40 flex w-full flex-col border-b border-border/70 bg-card/85 backdrop-blur-md transition-colors dir-rtl select-none shadow-sm">
      <div className="flex items-center justify-between px-2 py-1.5 gap-2 overflow-hidden">
        
        {/* Scroll Left Button (for RTL) */}
        <button
          onClick={scrollRight}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="پیمایش به راست"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Tabs Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="scrollbar-none flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5 scroll-smooth"
        >
          <AnimatePresence initial={false}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isHome = tab.path === "/";

              return (
                <motion.div
                  key={tab.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => activateTab(tab.id)}
                  onMouseDown={(e) => handleMouseDown(tab.id, e)}
                  className={cn(
                    "group relative flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-medium cursor-pointer transition-all duration-200 border",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/40 font-bold shadow-sm border-b-2 border-b-primary"
                      : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/80 hover:text-foreground hover:border-border"
                  )}
                >
                  {/* Active background indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pointer-events-none"
                    />
                  )}

                  {/* Tab Icon */}
                  {isHome ? (
                    <Landmark
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground opacity-70 group-hover:opacity-100"
                      )}
                    />
                  ) : (
                    <FileText
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground opacity-70 group-hover:opacity-100"
                      )}
                    />
                  )}

                  {/* Tab Title */}
                  <span className="truncate max-w-[140px] tracking-tight">{tab.title}</span>

                  {/* Close Tab Button (x) */}
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-all hover:bg-destructive/20 hover:text-destructive",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    title="بستن پنجره"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Scroll Right Button (for RTL) */}
        <button
          onClick={scrollLeft}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="پیمایش به چپ"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Right Actions & Badge */}
        <div className="flex items-center gap-2 border-r border-border/60 pr-2 shrink-0">
          {/* Tab Count Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-mono font-bold border transition-all shadow-2xs",
              isOverLimit
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 animate-pulse"
                : "bg-primary/10 text-primary border-primary/20"
            )}
            title={isOverLimit ? "تعداد پنجره‌های باز ۱۰ یا بیشتر است" : "تعداد پنجره‌های باز"}
          >
            {isOverLimit ? (
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <LayoutGrid className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span>{tabs.length} پنجره</span>
          </div>

          {/* Close All Tabs Button */}
          {tabs.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeAllTabs}
              className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 rounded-lg"
              title="بستن همه پنجره‌ها"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">بستن همه</span>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
