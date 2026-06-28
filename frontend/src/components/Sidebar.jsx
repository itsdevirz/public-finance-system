import { useState, useRef, createContext, useContext, memo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, Landmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BASIC_INFO_SUB, TOP_NAV } from "@/config/navigation";

const TimerCtx = createContext(null);
const MENU_GAP = 12;

// ─── بهینه‌سازی پرفورمنس: استفاده از memo برای منوهای شناور تو در تو ─────────
const FloatingMenu = memo(function FloatingMenu({ items, anchorRect, onClose, parentPanelLeft = null }) {
  const navigate = useNavigate();
  const { cancelClose, scheduleClose } = useContext(TimerCtx);
  const panelRef = useRef(null);
  const [activeChild, setActiveChild] = useState(null);
  const [childRect, setChildRect] = useState(null);
  const [childPanelLeft, setChildPanelLeft] = useState(null);

  const horizontalAnchor = parentPanelLeft ?? anchorRect.left;
  const right = window.innerWidth - horizontalAnchor + MENU_GAP;
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
      setChildPanelLeft(panelRef.current?.getBoundingClientRect().left ?? null);
    } else {
      setActiveChild(null);
      setChildRect(null);
      setChildPanelLeft(null);
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
      {/* bridge gap */}
      <div
        className="fixed z-[9998]"
        style={{
          right: window.innerWidth - horizontalAnchor,
          top: anchorRect.top,
          width: MENU_GAP,
          height: anchorRect.height,
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

// ─── بهینه‌سازی پرفورمنس: استفاده از memo برای آیتم‌های سایدبار ───────────────
const SidebarItem = memo(function SidebarItem({ label, num, to, subItems }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const closeTimer = useRef(null);
  const hasChildren = subItems?.length > 0;

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 250);
  };

  function handleMouseEnter(e) {
    cancelClose();
    if (hasChildren) {
      setAnchorRect(e.currentTarget.getBoundingClientRect());
      setMenuOpen(true);
    }
  }

  return (
    <TimerCtx.Provider value={{ cancelClose, scheduleClose }}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={scheduleClose} className="px-2 py-0.5">
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
            (menuOpen) ? "bg-sidebar-primary text-sidebar-background font-bold" : "bg-sidebar-foreground/10 text-sidebar-foreground/60 group-hover:bg-sidebar-foreground/20"
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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="relative z-[100] flex w-[240px] shrink-0 flex-col overflow-visible bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-xl">
      {/* لوگو و عنوان سامانه */}
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

      {/* لیست منوها */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-sidebar space-y-1">
        <SidebarItem num={1} label="اطلاعات پایه" to="/basic-info" subItems={BASIC_INFO_SUB} />
        {TOP_NAV.map(({ to, label, num, subItems }) => (
          <SidebarItem key={to} num={num} label={label} to={to} subItems={subItems ?? null} />
        ))}
      </div>

      {/* بخش کاربری و خروج */}
      <div className="border-t border-sidebar-border p-3 bg-sidebar-accent/30 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-3 px-2 py-1.5 rounded-lg bg-sidebar-background/60 border border-sidebar-border/50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-background text-xs font-extrabold shadow-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-bold text-sidebar-foreground">{user?.username}</p>
            <p className="text-[10px] text-sidebar-primary font-medium">کاربر سیستم</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="h-9 w-full justify-center rounded-lg text-xs font-semibold text-sidebar-foreground/70 transition-all duration-150 hover:bg-destructive hover:text-destructive-foreground border border-sidebar-border/80 shadow-sm"
        >
          <LogOut className="h-4 w-4 ml-1.5" />
          خروج از حساب کاربری
        </Button>
      </div>
    </nav>
  );
}
