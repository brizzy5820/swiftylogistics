import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell,
  LogOut,
  Menu,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import {
  useListAddresses,
  useListInvoices,
  useListShipments,
  useListTickets,
} from "@workspace/api-client-react";
import { useListUsers } from "@/lib/workspace-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppUser, UserRole } from "@/lib/workspace-api";
import type { NavItem } from "./Sidebar";
import { useNotifications } from "@/hooks/use-notifications";

interface HeaderProps {
  user: AppUser;
  role: UserRole;
  navItems: NavItem[];
  onLogout: () => void;
  onToggleSidebar: () => void;
}

interface SearchResult {
  href: string;
  section: string;
  title: string;
  subtitle: string;
}

const SEARCH_PLACEHOLDER = "Search tracking number, invoice, ticket, address, or page...";

function BrandText({ role, user }: { role: UserRole; user: AppUser }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-display text-base font-bold uppercase tracking-tight text-primary-foreground sm:text-lg">
        Workplace
      </div>
      <div className="truncate text-xs text-gray-200">
        {role === "admin" ? "Operations Portal" : user.company}
      </div>
    </div>
  );
}

export function Header({ user, role, navItems, onLogout, onToggleSidebar }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const customerId = role === "admin" ? undefined : user.id;
  const { data: shipments = [] } = useListShipments(customerId ? { customerId } : undefined);
  const { data: invoices = [] } = useListInvoices(customerId ? { customerId } : undefined);
  const { data: tickets = [] } = useListTickets(customerId ? { customerId } : undefined);
  const { data: addresses = [] } = useListAddresses(customerId ? { customerId } : undefined);
  const { data: users = [] } = useListUsers();
  const { notifications, unreadCount, markAllRead } = useNotifications({
    userId: user.id,
    role,
    shipments,
    invoices,
    tickets,
  });

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const timeout = window.setTimeout(() => mobileSearchInputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeout);
  }, [mobileSearchOpen]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const results = useMemo<SearchResult[]>(() => {
    if (!trimmedQuery) return [];

    const pageResults = navItems
      .filter((item) => item.label.toLowerCase().includes(trimmedQuery))
      .map((item) => ({
        href: item.href,
        section: "Pages",
        title: item.label,
        subtitle: "Open app section",
      }));

    const shipmentResults = shipments
      .filter((shipment) =>
        [
          shipment.trackingNumber,
          String(shipment.id),
          shipment.pickupAddress,
          shipment.destinationAddress,
          shipment.recipientName ?? "",
        ].some((value) => value.toLowerCase().includes(trimmedQuery)),
      )
      .slice(0, 4)
      .map((shipment) => ({
        href: `/shipments/${shipment.id}`,
        section: "Shipments",
        title: shipment.trackingNumber,
        subtitle: `${shipment.pickupAddress.split(",")[0]} to ${shipment.destinationAddress.split(",")[0]}`,
      }));

    const invoiceResults = invoices
      .filter((invoice) =>
        [invoice.invoiceNumber, invoice.trackingNumber, String(invoice.id)].some((value) =>
          value.toLowerCase().includes(trimmedQuery),
        ),
      )
      .slice(0, 4)
      .map((invoice) => ({
        href: `/invoices/${invoice.id}`,
        section: "Invoices",
        title: invoice.invoiceNumber,
        subtitle: `Tracking ${invoice.trackingNumber} · $${invoice.amount.toFixed(2)}`,
      }));

    const ticketResults = tickets
      .filter((ticket) =>
        [ticket.ticketNumber, ticket.subject, ticket.category, String(ticket.id)].some((value) =>
          value.toLowerCase().includes(trimmedQuery),
        ),
      )
      .slice(0, 4)
      .map((ticket) => ({
        href: `/tickets/${ticket.id}`,
        section: "Support",
        title: ticket.ticketNumber,
        subtitle: ticket.subject,
      }));

    const addressResults = addresses
      .filter((address) =>
        [address.label, address.street, address.city, address.state, address.country].some((value) =>
          value.toLowerCase().includes(trimmedQuery),
        ),
      )
      .slice(0, 3)
      .map((address) => ({
        href: "/addresses",
        section: "Addresses",
        title: address.label,
        subtitle: `${address.street}, ${address.city}`,
      }));

    const userResults =
      role === "admin"
        ? users
            .filter((entry) =>
              [entry.name, entry.company, entry.email, entry.department ?? ""].some((value) =>
                value.toLowerCase().includes(trimmedQuery),
              ),
            )
            .slice(0, 4)
            .map((entry) => ({
              href: "/admin/customers",
              section: "Customers",
              title: entry.name,
              subtitle: `${entry.company} · ${entry.email}`,
            }))
        : [];

    return [...pageResults, ...shipmentResults, ...invoiceResults, ...ticketResults, ...addressResults, ...userResults].slice(0, 12);
  }, [addresses, invoices, navItems, role, shipments, tickets, trimmedQuery, users]);

  const showSearchResults = (searchFocused || mobileSearchOpen) && trimmedQuery.length > 0;

  const handleOpenResult = (href: string) => {
    setLocation(href);
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchSubmit = () => {
    if (results[0]) {
      handleOpenResult(results[0].href);
      return;
    }

    const shipmentMatch = shipments.find(
      (shipment) =>
        shipment.trackingNumber.toLowerCase() === trimmedQuery || String(shipment.id) === trimmedQuery,
    );
    if (shipmentMatch) {
      handleOpenResult(`/shipments/${shipmentMatch.id}`);
    }
  };

  const SearchPanel = (
    <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-40 overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/98 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.35)] backdrop-blur">
      {results.length > 0 ? (
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.map((result) => (
            <button
              key={`${result.section}-${result.href}-${result.title}`}
              type="button"
              onClick={() => handleOpenResult(result.href)}
              className="flex w-full items-start justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-secondary/70"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{result.title}</p>
                <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {result.section}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-5 text-sm text-muted-foreground">
          No matching results yet. Try a tracking number, invoice number, ticket number, or page name.
        </div>
      )}
    </div>
  );

  const SearchField = ({ mobile }: { mobile?: boolean }) => (
    <div ref={searchRef} className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <Input
        ref={mobile ? mobileSearchInputRef : undefined}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onFocus={() => setSearchFocused(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSearchSubmit();
          }
          if (event.key === "Escape") {
            setSearchFocused(false);
            setMobileSearchOpen(false);
          }
        }}
        className={cn(
          "w-full border border-border/70 bg-card shadow-sm focus-visible:ring-2 focus-visible:ring-primary",
          mobile ? "h-12 rounded-2xl pl-11 pr-12" : "h-11 rounded-full pl-11 pr-4",
        )}
        placeholder={SEARCH_PLACEHOLDER}
        data-testid={mobile ? "input-global-search-mobile" : "input-global-search"}
      />
      {mobile && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full text-muted-foreground"
          onClick={() => {
            setMobileSearchOpen(false);
            setSearchFocused(false);
            setSearchQuery("");
          }}
        >
          <X size={18} />
        </Button>
      )}
      {showSearchResults && SearchPanel}
    </div>
  );

  const NotificationList = (
    <div className="max-h-[24rem] overflow-y-auto ui-scrollbar">
      {notifications.length > 0 ? (
        <div className="space-y-1 p-2">
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markAllRead();
                setLocation(item.href);
              }}
              className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-secondary/70"
            >
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  item.tone === "success" ? "bg-emerald-500" : item.tone === "warning" ? "bg-amber-500" : "bg-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
      )}
    </div>
  );

  return (
    <header
      className="sticky top-0 z-30 shrink-0 shadow-md bg-primary px-3 py-3 backdrop-blur md:px-6"
    >
      <div className="hidden items-center justify-between gap-5 md:flex">
        <div className="flex max-w-2xl flex-1 justify-center">
          <SearchField />
        </div>

        <div className="flex items-center gap-2 pl-3 md:gap-3">
          <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 rounded-full border border-border/60 bg-card/70 text-muted-foreground hover:text-foreground"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-sm ring-2 ring-background">
                    {Math.min(unreadCount, 9)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[24rem] rounded-[1.5rem] border-border bg-card p-0">
              <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                <span>Notifications</span>
                <span className="text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NotificationList}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden items-center gap-3 rounded-full border border-border/70 bg-card/85 px-3 py-2 text-left shadow-sm lg:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary">
              {role === "admin" ? (
                <Shield size={18} className="text-muted-foreground" />
              ) : (
                <User size={18} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium leading-none">
                {user.name}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {role === "admin" ? user.department : user.company}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full border border-border/60 bg-card/70 text-muted-foreground hover:text-foreground"
              >
                <User size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 rounded-2xl border-border bg-card p-2"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="text-sm font-semibold text-foreground">
                  {user.name}
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  {role === "admin" ? user.department : user.company}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                  <Link href={role === "admin" ? "/admin/account" : "/account"}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Manage Account</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="rounded-xl px-3 py-2 text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
            >
              <Menu size={18} className="text-white"/>
            </Button>
            <div className="flex gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_40px_-24px_rgba(34,90,216,0.85)]">
                 <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white overflow-hidden">
          <img
            src="/img/5802946905544265575-removebg-preview.png"
            alt="Logo"
            className="h-full w-full object-cover"
          />
        </div>
              </div>
              <BrandText  role={role} user={user} />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setMobileSearchOpen((open) => !open);
                setSearchFocused(true);
              }}
            >
              <Search size={22} className="text-white"/>
            </Button>
            <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <Bell size={22} className="text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-primary shadow-sm">
                      {Math.min(unreadCount, 9)}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[22rem] rounded-[1.5rem] border-border bg-card p-0">
                <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                  <span>Notifications</span>
                  <span className="text-xs font-normal text-muted-foreground">{unreadCount} unread</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NotificationList}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  //  className="h-11 w-11 rounded-full border border-border/60 bg-card/80 text-muted-foreground"
                >
                  <User size={22} className="text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-2xl border-border bg-card p-2"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="text-sm font-semibold text-foreground">
                    {user.name}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {role === "admin" ? user.department : user.company}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                    <Link href={role === "admin" ? "/admin" : "/"}>
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={onLogout}
                  className="rounded-xl px-3 py-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <SearchField mobile />
          </div>
        )}
      </div>
    </header>
  );
}
