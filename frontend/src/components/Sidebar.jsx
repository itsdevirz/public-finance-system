import { useState, useRef, createContext, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, Landmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BASIC_INFO_SUB, TOP_NAV } from "@/config/navigation";

const TimerCtx = createContext(null);
const MENU_GAP = 12;

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
        className="fixed z-[9999] min-w-[250px] overflow-hidden rounded-lg border border-sidebar-border bg-sidebar shadow-lg"
        style={{ right, top, maxHeight: `${maxH}px` }}
      >
        <div
          ref={panelRef}
          className="scrollbar-sidebar overflow-x-hidden overflow-y-auto p-1"
          style={{ maxHeight: `${maxH}px` }}
        >
          {items.map((item, i) => (
            <div
              key={item.to}
              onMouseEnter={(e) => handleItemEnter(item, e)}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors duration-100",
                activeChild?.to === item.to
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <span className="w-5 text-center text-[10px] text-sidebar-foreground/30 shrink-0">{i + 1}</span>
              <span className="flex-1 whitespace-nowrap">{item.label}</span>
              {item.children && <ChevronLeft className="h-3 w-3 opacity-40" />}
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
      <div onMouseEnter={handleMouseEnter} onMouseLeave={scheduleClose}>
        <NavLink
          to={to}
          onClick={(e) => hasChildren && e.preventDefault()}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-2 px-3 py-2 text-[13px] no-underline transition-colors duration-100",
              isActive || menuOpen
                ? "border-r-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary"
                : "border-r-2 border-transparent text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )
          }
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] text-sidebar-foreground/40">
            {num}
          </span>
          <span className="flex-1 text-sm">{label}</span>
          {hasChildren && <ChevronLeft className="h-3 w-3 opacity-30" />}
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
    <nav className="relative z-[100] flex w-[220px] shrink-0 flex-col overflow-visible bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
      {/* لوگو */}
      <button
        onClick={() => navigate("/")}
        className="border-b border-sidebar-border px-4 py-4 text-right transition-colors duration-100 hover:bg-sidebar-accent/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-primary">سامانه مالی</div>
            <div className="text-[10px] text-sidebar-foreground/40 mt-0.5">نظام مالی بخش عمومی</div>
          </div>
        </div>
      </button>

      {/* منو */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-sidebar">
        <SidebarItem num={1} label="اطلاعات پایه" to="/basic-info" subItems={BASIC_INFO_SUB} />
        {TOP_NAV.map(({ to, label, num, subItems }) => (
          <SidebarItem key={to} num={num} label={label} to={to} subItems={subItems ?? null} />
        ))}
      </div>

      {/* فوتر کاربر */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <span className="truncate text-xs text-sidebar-foreground/55">{user?.username}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="h-8 w-full justify-center rounded-md text-xs text-sidebar-foreground/55 transition-colors duration-100 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-sidebar-border/60"
        >
          <LogOut className="h-3 w-3 ml-1" />
          خروج
        </Button>
      </div>
    </nav>
  );
}
