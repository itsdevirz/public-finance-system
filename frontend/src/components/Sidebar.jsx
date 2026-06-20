import { useState, useRef, createContext, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, Landmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BASIC_INFO_SUB, TOP_NAV } from "@/config/navigation";

const TimerCtx = createContext(null);

const MENU_GAP = 16;

function FloatingMenu({ items, anchorRect, onClose, parentPanelLeft = null }) {
  const navigate = useNavigate();
  const { cancelClose, scheduleClose } = useContext(TimerCtx);
  const panelRef = useRef(null);
  const [activeChild, setActiveChild] = useState(null);
  const [childRect, setChildRect] = useState(null);
  const [childPanelLeft, setChildPanelLeft] = useState(null);

  const horizontalAnchor = parentPanelLeft ?? anchorRect.left;
  const right = window.innerWidth - horizontalAnchor + MENU_GAP;
  const maxH = window.innerHeight * 0.8;
  const popupH = Math.min(items.length * 40 + 16, maxH);
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
        className="fixed z-[9999] min-w-[260px] overflow-hidden rounded-xl border border-sidebar-border bg-sidebar shadow-elevated animate-in fade-in slide-in-from-right-2 duration-300 ease-smooth"
        style={{ right, top, maxHeight: `${maxH}px` }}
      >
        <div
          ref={panelRef}
          className="scrollbar-sidebar overflow-x-hidden overflow-y-auto p-1.5 pl-2 pr-1.5"
          style={{ maxHeight: `${maxH}px` }}
        >
          {items.map((item, i) => (
            <div
              key={item.to}
              onMouseEnter={(e) => handleItemEnter(item, e)}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] transition-all duration-200 ease-smooth",
                activeChild?.to === item.to
                  ? "bg-sidebar-accent text-sidebar-primary border-r-2 border-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              )}
            >
              <span className="min-w-[22px] text-center text-[10px] opacity-40">{i + 1}</span>
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.children && <ChevronLeft className="h-3 w-3 opacity-50" />}
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
}

function SidebarItem({ label, num, to, subItems }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const closeTimer = useRef(null);
  const hasChildren = subItems?.length > 0;

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 300);
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
      <div onMouseEnter={handleMouseEnter} onMouseLeave={scheduleClose}>
        <NavLink
          to={to}
          onClick={(e) => hasChildren && e.preventDefault()}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-2.5 px-4 py-2.5 text-[13px] no-underline transition-all duration-300 ease-smooth",
              isActive || menuOpen
                ? "border-r-[3px] border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary"
                : "border-r-[3px] border-transparent text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )
          }
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-sidebar-foreground/10 text-[10px] text-sidebar-foreground/50 transition-colors duration-300 group-hover:bg-sidebar-primary/20 group-hover:text-sidebar-primary">
            {num}
          </span>
          <span className="flex-1">{label}</span>
          {hasChildren && <ChevronLeft className="h-3 w-3 opacity-40 transition-transform duration-300 group-hover:opacity-70" />}
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
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="relative z-[100] flex w-[230px] shrink-0 flex-col overflow-visible bg-sidebar text-sidebar-foreground shadow-elevated">
      <button
        onClick={() => navigate("/")}
        className="border-b border-sidebar-border px-4 py-5 text-right transition-colors duration-200 hover:bg-sidebar-accent/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/15 text-sidebar-primary transition-transform duration-300 hover:scale-105">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-primary">سامانه مالی</div>
            <div className="mt-0.5 text-[10px] text-sidebar-foreground/40">نظام مالی بخش عمومی</div>
          </div>
        </div>
      </button>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-sidebar">
        <SidebarItem num={1} label="اطلاعات پایه" to="/basic-info" subItems={BASIC_INFO_SUB} />
        {TOP_NAV.map(({ to, label, num, subItems }) => (
          <SidebarItem key={to} num={num} label={label} to={to} subItems={subItems ?? null} />
        ))}
      </div>

      <div className="border-t border-sidebar-border bg-black/10 px-4 py-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sidebar text-xs font-bold text-sidebar-primary">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="truncate text-xs text-sidebar-foreground/60">{user?.username}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="h-9 w-full justify-center rounded-lg border border-sidebar-border bg-sidebar-foreground/5 text-sidebar-foreground/60 transition-all duration-300 hover:border-sidebar-primary/30 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          خروج از سیستم
        </Button>
      </div>
    </nav>
  );
}
