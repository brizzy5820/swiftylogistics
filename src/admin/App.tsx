import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileText, LayoutDashboard, LifeBuoy, MapPin, Package, Users, Box, CheckCircle2, BarChart3 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, isAllowedRole, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard";
import Shipments from "@/pages/shipments";
import ShipmentNew from "@/pages/shipment-new";
import ShipmentDetail from "@/pages/shipment-detail";
import Invoices from "@/pages/invoices";
import InvoiceDetail from "@/pages/invoice-detail";
import Addresses from "@/pages/addresses";
import Tickets from "@/pages/tickets";
import TicketNew from "@/pages/ticket-new";
import TicketDetail from "@/pages/ticket-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCustomers from "@/pages/admin-customers";
import AdminSupport from "@/pages/admin-support";
import AdminPendingGoods from "@/pages/admin-pending-goods";
import AdminDeliveredGoods from "@/pages/admin-delivered-goods";
import AdminAccount from "@/pages/admin-account";

const queryClient = new QueryClient();

function RedirectTo({ href }: { href: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(href);
  }, [href, setLocation]);

  return null;
}

function ProtectedApp() {
  const { user, isLoading, logout } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }
  if (!user) return <RedirectTo href="/login" />;

  const isAdminRoute = location.startsWith("/admin");

  if (isAdminRoute && !isAllowedRole(user.role, "admin")) {
    return <RedirectTo href="/" />;
  }

  if (!isAdminRoute && user.role === "admin" && location === "/") {
    return <RedirectTo href="/admin" />;
  }

  if (user.role === "admin" && isAdminRoute) {
    return (
      <Layout
        user={user}
        role="admin"
        homeHref="/admin"
        accountLabel="Admin Access"
        accountValue={user.department ?? "Operations Control"}
        onLogout={logout}
        navItems={[
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/pending-goods", label: "Pending Goods", icon: Box },
          { href: "/admin/delivered-goods", label: "Delivered Goods", icon: CheckCircle2 },
          { href: "/admin/customers", label: "Customers", icon: Users },
          { href: "/admin/support", label: "Support Queue", icon: LifeBuoy },
        ]}
      >
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/pending-goods" component={AdminPendingGoods} />
          <Route path="/admin/delivered-goods" component={AdminDeliveredGoods} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/support" component={AdminSupport} />
          <Route path="/admin/account" component={AdminAccount} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    );
  }

  return (
    <Layout
      user={user}
      role="user"
      homeHref="/"
      accountLabel="Account Status"
      accountValue={user.company}
      onLogout={logout}
        navItems={[
          { href: "/", label: "Dashboard", icon: LayoutDashboard },
          { href: "/shipments", label: "Shipments", icon: Package },
          { href: "/invoices", label: "Invoices", icon: FileText },
          { href: "/addresses", label: "Addresses", icon: MapPin },
          { href: "/tickets", label: "Support Tickets", icon: LifeBuoy },
        ]}
    >
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/shipments" component={Shipments} />
        <Route path="/shipments/new" component={ShipmentNew} />
        <Route path="/shipments/:id" component={ShipmentDetail} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/invoices/:id" component={InvoiceDetail} />
        <Route path="/addresses" component={Addresses} />
        <Route path="/tickets" component={Tickets} />
        <Route path="/tickets/new" component={TicketNew} />
        <Route path="/tickets/:id" component={TicketDetail} />
        <Route path="/admin/:rest*" component={() => <RedirectTo href="/admin" />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppShell() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route component={ProtectedApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
