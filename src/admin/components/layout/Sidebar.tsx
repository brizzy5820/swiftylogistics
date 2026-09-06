import type { ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { PanelLeft, PanelRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: string | number; className?: string }>;
}

interface SidebarProps {
  homeHref: string;
  navItems: NavItem[];
  accountLabel: string;
  accountValue: string;
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ homeHref, navItems, accountLabel, accountValue, collapsed, isMobile, mobileOpen, onMobileOpenChange, onToggleCollapse }: SidebarProps) {
  const [location] = useLocation();
  const CollapseIcon = collapsed ? PanelLeft : PanelRight;

  const sidebarContent = (
    <div className="flex h-full flex-col overflow-hidden bg-transparent">
      <div className={cn("shrink-0 border-b border-border p-4", collapsed ? "px-3" : "px-5")}>
        <div className={cn("flex items-start", collapsed ? "flex-col items-center gap-3" : "justify-between gap-3")}>
          <Link href={homeHref} className={cn("group flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_40px_-24px_rgba(34,90,216,0.85)] transition-transform group-hover:scale-105">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white overflow-hidden">
                <img
                  src="/img/5802946905544265575-removebg-preview.png"
                  alt="Xenith Logistics"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate font-display text-lg font-bold uppercase tracking-tight text-foreground">
                  Workplace 
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  workplace logistics & courier
                </span>
              </div>
            )}
          </Link>
          {!isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              // className="h-10 w-10 rounded-full border border-border bg-card/80 text-muted-foreground hover:text-foreground"
              onClick={onToggleCollapse}
            >
              <CollapseIcon size={18} />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== homeHref && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-2xl text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_18px_35px_-24px_rgba(37,99,235,0.95)]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => {
                  if (isMobile) onMobileOpenChange(false);
                }}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <div className={cn("rounded-2xl border border-border/70 bg-secondary/65", collapsed ? "p-3" : "p-4")}>
          <p className={cn("text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground", collapsed && "text-center")}>
            {collapsed ? "Acct" : accountLabel}
          </p>
          <div className={cn("mt-2 flex items-center", collapsed ? "justify-center" : "gap-2")}>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
            {!collapsed && <span className="text-sm font-medium">{accountValue}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[86vw] max-w-[320px] border-border bg-card p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Browse the logistics portal.</SheetDescription>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 border-r border-border bg-card/92 backdrop-blur md:flex",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-24" : "w-72",
      )}
    >
      {sidebarContent}
    </aside>
  );
}
