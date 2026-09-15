import { useState, useRef, createContext, useContext, memo, useCallback, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, Landmark, Laptop, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BASIC_INFO_SUB, DOCUMENT_SETUP_TOP, TOP_NAV } from "@/config/navigation";
import UserSessionsModal from "./UserSessionsModal";

const TimerCtx = createContext(null);

// فاصله بین sidebar و منوی شناور (px)
const MENU_GAP = 16;
// تاخیر بستن منو — افزایش به 400ms برای اینکه موس راحت‌تر بتواند به منو برسد
const CLOSE_DELAY = 400;

function normalizePersianText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/أ|إ|آ/g, "ا")
    .replace(/ؤ|ئ/g, "و")
    .replace(/[\u200c\s]+/g, " ")
    .trim();
}

// ─── FloatingMenu ────────────────────────────────────────────────────────────
const FloatingMenu = memo(function FloatingMenu({ items, anchorRect, onClose, parentPanelLeft = null }) {
  const navigate = useNavigate();
  const { cancelClose, scheduleClose } = useContext(TimerCtx);
  const panelRef = useRef(null);
  const [activeChild, setActiveChild] = useState(null);
  const [childRect, setChildRect] = useState(null);
  const [childPanelLeft, setChildPanelLeft] = useState(null);

  const horizontalAnchor = parentPanelLeft ?? anchorRect.left;
  const right = window.innerWidth - horizontalAnchor + MENU_GAP;
  const maxH = window.innerHeight * 0.85;
  const popupH = Math.min(items.length * 38 + 16, maxH);
  const rawTop = anchorRect.top;
  const overflow = rawTop + popupH - window.innerHeight + 8;
  const top = overflow > 0 ? Math.max(8, rawTop - overflow) : rawTop;

  function handleItemEnter(item, e) {
    cancelClose();
    if (item.children) {
      setActiveChild(item);
      setChildRect(e.currentTarget.getBoundingClientRect());
      setChildPanelLeft(panelRef.current?.getBoundingClientRect().left ?? null);
    } else {
      setActiveChild(null);
      setChildRect(null);
      setChildPanelLeft(null);
    }
  }

  function handleItemLeave() {
    // وقتی از یک ایتم خارج می‌شویم ولی هنوز داخل panel هستیم، چیزی نبندیم
    // scheduleClose فقط از onMouseLeave panel صدا زده می‌شود
  }

  function handleItemClick(item) {
    if (!item.children) {
      onClose();
      navigate(item.to);
    }
  }

  return (
    <>
      {/*
        Bridge: یک ناحیه شفاف بین trigger و panel که موس هنگام رفتن به منو
        از روی آن رد می‌شود. عرض = MENU_GAP، ارتفاع = از بالای trigger
        تا پایین panel تا کل مسیر diagonal cover شود.
      */}
      <div
        className="fixed z-[9998]"
        style={{
          right: window.innerWidth - horizontalAnchor,
          top: Math.min(anchorRect.top, top),
          width: MENU_GAP,
          height: Math.max(anchorRect.bottom, top + popupH) - Math.min(anchorRect.top, top),
        }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      />

      <div
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className="fixed z-[9999] min-w-[260px] overflow-hidden rounded-xl border border-sidebar-border bg-sidebar shadow-2xl backdrop-blur-md bg-sidebar/98"
        style={{ right, top, maxHeight: `${maxH}px` }}
      >
        <div
          ref={panelRef}
          className="scrollbar-sidebar overflow-x-hidden overflow-y-auto p-1.5"
          style={{ maxHeight: `${maxH}px` }}
        >
          {items.map((item, i) => (
            <div
              key={item.to}
              onMouseEnter={(e) => handleItemEnter(item, e)}
              onMouseLeave={handleItemLeave}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                activeChild?.to === item.to
                  ? "bg-sidebar-accent text-sidebar-primary shadow-inner font-bold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:pl-4"
              )}
            >
              <span className="w-5 text-center text-[10px] text-sidebar-foreground/30 shrink-0 font-mono">{i + 1}</span>
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.children && <ChevronLeft className="h-3.5 w-3.5 opacity-50 text-sidebar-primary" />}
            </div>
          ))}
        </div>
      </div>

      {activeChild && childRect && (
        <FloatingMenu
          items={activeChild.children}
          anchorRect={childRect}
          parentPanelLeft={childPanelLeft}
          onClose={onClose}
        />
      )}
    </>
  );
});

// ─── SidebarItem ─────────────────────────────────────────────────────────────
const SidebarItem = memo(function SidebarItem({ label, num, to, subItems }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const closeTimer = useRef(null);
  const hasChildren = subItems?.length > 0;

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenuOpen(false), CLOSE_DELAY);
  }, []);

  function handleMouseEnter(e) {
    cancelClose();
    if (hasChildren) {
      setAnchorRect(e.currentTarget.getBoundingClientRect());
      setMenuOpen(true);
    }
  }

  function handleMouseLeave() {
    // فقط زمان‌بندی می‌کنیم — اگر موس وارد bridge یا panel شود cancelClose صدا زده می‌شود
    scheduleClose();
  }

  return (
    <TimerCtx.Provider value={{ cancelClose, scheduleClose }}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="px-2 py-0.5"
      >
        <NavLink
          to={to}
          onClick={(e) => hasChildren && e.preventDefault()}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium no-underline rounded-lg transition-all duration-200",
              isActive || menuOpen
                ? "bg-sidebar-accent text-sidebar-primary font-bold shadow-sm border-r-4 border-sidebar-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:pr-4"
            )
          }
        >
          <span className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-mono transition-colors duration-200",
            menuOpen
              ? "bg-sidebar-primary text-sidebar-background font-bold"
              : "bg-sidebar-foreground/10 text-sidebar-foreground/60 group-hover:bg-sidebar-foreground/20"
          )}>
            {num}
          </span>
          <span className="flex-1 text-sm tracking-tight">{label}</span>
          {hasChildren && <ChevronLeft className="h-3.5 w-3.5 opacity-40 group-hover:opacity-80 group-hover:-translate-x-0.5 transition-all duration-200" />}
        </NavLink>

        {menuOpen && anchorRect && (
          <FloatingMenu
            items={subItems}
            anchorRect={anchorRect}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </TimerCtx.Provider>
  );
});

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isAdminUser = user?.role === "admin" || user?.role === "مدیر سیستم" || user?.username?.toLowerCase() === "admin";

  const allSearchableNavItems = useMemo(() => {
    const results = [];

    function traverse(items, parentLabels = []) {
      if (!items || !Array.isArray(items)) return;
      for (const item of items) {
        const currentPath = [...parentLabels, item.label];
        if (item.to) {
          results.push({
            to: item.to,
            label: item.label,
            categoryPath: parentLabels.join(" › "),
            fullSearchText: currentPath.join(" ")
          });
        }
        if (item.children?.length) {
          traverse(item.children, currentPath);
        }
        if (item.subItems?.length) {
          traverse(item.subItems, currentPath);
        }
      }
    }

    traverse(DOCUMENT_SETUP_TOP, ["تنظیم اسناد"]);
    traverse(BASIC_INFO_SUB, ["اطلاعات پایه"]);

    for (const group of TOP_NAV) {
      if (group.subItems?.length) {
        traverse(group.subItems, [group.label]);
      } else if (group.to) {
        results.push({
          to: group.to,
          label: group.label,
          categoryPath: "",
          fullSearchText: group.label
        });
      }
    }

    const uniqueMap = new Map();
    for (const item of results) {
      if (!uniqueMap.has(item.to)) {
        uniqueMap.set(item.to, item);
      }
    }
    return Array.from(uniqueMap.values());
  }, []);

  const filteredResults = useMemo(() => {
    const query = normalizePersianText(searchQuery);
    if (!query) return [];
    return allSearchableNavItems.filter((item) =>
      normalizePersianText(item.fullSearchText).includes(query)
    );
  }, [searchQuery, allSearchableNavItems]);

  return (
    <>
      <nav className="relative z-[100] flex w-[240px] shrink-0 flex-col overflow-visible bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-xl">
        {/* لوگو */}
        <button
          onClick={() => navigate("/")}
          className="border-b border-sidebar-border px-4 py-5 text-right transition-all duration-200 hover:bg-sidebar-accent/50 group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/30 shadow-inner group-hover:scale-105 transition-transform duration-200">
              <Landmark className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-sidebar-primary tracking-tight">سامانه جامع مالی</div>
              <div className="text-[11px] text-sidebar-foreground/50 mt-0.5 font-medium">نظام مالی بخش عمومی</div>
            </div>
          </div>
        </button>

        {/* سرچ باکس منوها */}
        <div className="px-3 py-3 border-b border-sidebar-border/60 bg-sidebar-accent/10">
          <div className="relative flex items-center">
            <Search className="absolute right-3 h-3.5 w-3.5 text-sidebar-primary/70 pointer-events-none transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchQuery("");
              }}
              placeholder="جستجوی سریع منوها..."
              className="w-full h-9 pr-9 pl-7 rounded-xl bg-sidebar-accent/50 text-xs font-semibold text-sidebar-foreground placeholder:text-sidebar-foreground/40 border border-sidebar-border/50 focus:outline-none focus:bg-sidebar-accent/80 focus:border-sidebar-primary/60 focus:ring-2 focus:ring-sidebar-primary/20 transition-all duration-200 shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                title="پاک کردن جستجو"
                className="absolute left-2.5 text-sidebar-foreground/40 hover:text-sidebar-foreground p-1 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="absolute left-2.5 text-[9px] font-mono font-bold text-sidebar-foreground/30 px-1 py-0.5 rounded border border-sidebar-border/40 pointer-events-none">
                ESC
              </span>
            )}
          </div>
        </div>

        {/* منوها یا نتایج جستجو */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-sidebar space-y-1">
          {searchQuery.trim() ? (
            <div className="space-y-1 px-2">
              <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-bold text-sidebar-foreground/60 border-b border-sidebar-border/40">
                <span>نتایج جستجو</span>
                <span className="bg-sidebar-primary/20 text-sidebar-primary px-1.5 py-0.5 rounded-md font-mono text-[10px]">
                  {filteredResults.length} مورد
                </span>
              </div>

              {filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      navigate(item.to);
                      setSearchQuery("");
                    }}
                    className="w-full text-right px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-primary transition-all duration-150 group border border-transparent hover:border-sidebar-border/50 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold group-hover:text-sidebar-primary">
                        {item.label}
                      </span>
                      <ChevronLeft className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-sidebar-primary transition-opacity shrink-0" />
                    </div>
                    {item.categoryPath && (
                      <span className="text-[10px] text-sidebar-foreground/50 truncate font-medium">
                        {item.categoryPath}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-sidebar-foreground/50 space-y-1">
                  <p className="text-xs font-bold">نتیجه‌ای یافت نشد</p>
                  <p className="text-[10px] text-sidebar-foreground/40">عنوان دیگری را جستجو نمایید</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <SidebarItem num={1} label="تنظیم اسناد" to="/document-setup" subItems={DOCUMENT_SETUP_TOP} />
              <SidebarItem num={2} label="اطلاعات پایه" to="/basic-info" subItems={BASIC_INFO_SUB} />
              {TOP_NAV.map(({ to, label, num, subItems }) => (
                <SidebarItem key={to} num={num} label={label} to={to} subItems={subItems ?? null} />
              ))}
            </>
          )}
        </div>

        {/* کاربر، نشست‌های فعال و خروج */}
        <div className="border-t border-sidebar-border p-3 bg-sidebar-accent/30 backdrop-blur-sm space-y-2">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-sidebar-background/60 border border-sidebar-border/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-background text-xs font-extrabold shadow-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-bold text-sidebar-foreground">{user?.username}</p>
              <p className="text-[10px] text-sidebar-primary font-medium">کاربر سیستم</p>
            </div>
          </div>

          {isAdminUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSessionsModalOpen(true)}
              className="h-8 w-full justify-center rounded-lg text-xs font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-sidebar-border/60 shadow-sm gap-1.5 cursor-pointer"
            >
              <Laptop className="h-3.5 w-3.5 text-blue-500" />
              نشست‌های فعال
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="h-8 w-full justify-center rounded-lg text-xs font-semibold text-sidebar-foreground/70 transition-all duration-150 hover:bg-destructive hover:text-destructive-foreground border border-sidebar-border/80 shadow-sm"
          >
            <LogOut className="h-4 w-4 ml-1.5" />
            خروج از حساب کاربری
          </Button>
        </div>
      </nav>

      {/* مودال مدیریت نشست‌های کاربر */}
      <UserSessionsModal
        isOpen={sessionsModalOpen}
        onClose={() => setSessionsModalOpen(false)}
      />
    </>
  );
}

