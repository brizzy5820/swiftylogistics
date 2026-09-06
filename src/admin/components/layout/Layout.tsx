import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar, type NavItem } from "./Sidebar";
import { Header } from "./Header";
import type { AppUser, UserRole } from "@/lib/workspace-api";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  user: AppUser;
  role: UserRole;
  homeHref: string;
  navItems: NavItem[];
  accountLabel: string;
  accountValue: string;
  onLogout: () => void;
}

function MobileBottomNav({ navItems, homeHref, visible }: { navItems: NavItem[]; homeHref: string; visible: boolean }) {
  const [location] = useLocation();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_45px_-32px_rgba(15,23,42,0.35)] backdrop-blur md:hidden",
        "transition-transform duration-300 ease-out",
        visible ? "translate-y-0" : "translate-y-[130%]",
      )}
    >
      <div
        className="grid gap-1 rounded-[1.5rem] bg-white/70 p-1"
        style={{ gridTemplateColumns: `repeat(${Math.min(navItems.length, 5)}, minmax(0, 1fr))` }}
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = location === item.href || (item.href !== homeHref && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center transition-colors",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
              )}
            >
              <Icon size={18} />
              <span className="truncate text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Layout({ children, user, role, homeHref, navItems, accountLabel, accountValue, onLogout }: LayoutProps) {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);
  const lastScrollTop = useRef(0);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
    window.scrollTo({ top: 0, behavior: "auto" });
    setShowBottomNav(true);
    setIsMobileSidebarOpen(false);
    lastScrollTop.current = 0;
  }, [location]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen((open) => !open);
      return;
    }

    setIsSidebarCollapsed((collapsed) => !collapsed);
  };

  const handleMainScroll = () => {
    if (!isMobile || !mainRef.current) return;
    const currentTop = mainRef.current.scrollTop;

    if (currentTop <= 32) {
      setShowBottomNav(true);
      lastScrollTop.current = currentTop;
      return;
    }

    if (currentTop > lastScrollTop.current + 8) {
      setShowBottomNav(false);
    } else if (currentTop < lastScrollTop.current - 8) {
      setShowBottomNav(true);
    }

    lastScrollTop.current = currentTop;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground">
      <Sidebar
        homeHref={homeHref}
        navItems={navItems}
        accountLabel={accountLabel}
        accountValue={accountValue}
        collapsed={isSidebarCollapsed}
        isMobile={isMobile}
        mobileOpen={isMobileSidebarOpen}
        onMobileOpenChange={setIsMobileSidebarOpen}
        onToggleCollapse={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          role={role}
          navItems={navItems}
          onLogout={onLogout}
          onToggleSidebar={handleToggleSidebar}
        />
        <main
          ref={mainRef}
          onScroll={handleMainScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-[1440px] bg-gray-50 px-4 py-12 pb-28 sm:px-6 sm:py-6 sm:pb-28 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      {isMobile && <MobileBottomNav navItems={navItems} homeHref={homeHref} visible={showBottomNav} />}
    </div>
  );
}
