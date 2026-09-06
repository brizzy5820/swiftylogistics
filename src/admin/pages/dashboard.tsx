import { useGetDashboardSummary, useListShipments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Package, Truck, CheckCircle2, DollarSign, Activity, ArrowRight, Plus, FileText, MapPin, LifeBuoy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const customerId = user?.id;
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({ customerId });
  const { data: recentShipments, isLoading: isLoadingShipments } = useListShipments({ status: "in_transit", customerId });

  const stats = [
    { label: "Active Shipments", value: summary?.activeShipments, icon: Truck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Delivered", value: summary?.deliveredShipments, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Spent", value: summary ? `$${summary.totalSpent.toLocaleString()}` : undefined, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Shipments", value: summary?.totalShipments, icon: Package, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="animate-in space-y-8 fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-col md:items-start">
       <div className="relative mb-6 w-full overflow-hidden rounded-[2rem] border border-sky-100 bg-white px-5 py-6 shadow-[0_28px_80px_-42px_rgba(14,53,110,0.28)] sm:px-6">

  {/* Subtle grid background */}
  <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="desk-grid" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#e8f3fc" strokeWidth="0.7" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#desk-grid)" />

    {/* Shipping truck / container icon */}
    <g opacity="0.055" transform="translate(440,18)">
      <rect x="0" y="10" width="52" height="36" rx="4" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <rect x="6" y="18" width="12" height="8" rx="1.5" fill="#1a6fbe" />
      <rect x="22" y="18" width="12" height="8" rx="1.5" fill="#1a6fbe" />
      <polyline points="0,26 -18,26 -18,36" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <circle cx="-18" cy="40" r="5" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <polyline points="52,26 70,26 70,36" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <circle cx="70" cy="40" r="5" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
    </g>

    {/* Package / box icon */}
    <g opacity="0.055" transform="translate(520,68)">
      <path d="M0 28 L14 0 L28 0 L42 28 Z" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <line x1="8" y1="16" x2="34" y2="16" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="3" y1="24" x2="39" y2="24" stroke="#1a6fbe" strokeWidth="1.2" />
      <rect x="6" y="28" width="30" height="8" rx="2" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
    </g>

    {/* Clipboard / manifest icon */}
    <g opacity="0.055" transform="translate(380,72)">
      <rect x="0" y="0" width="34" height="44" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <line x1="5" y1="10" x2="29" y2="10" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="5" y1="16" x2="25" y2="16" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="5" y1="22" x2="27" y2="22" stroke="#1a6fbe" strokeWidth="1.2" />
      <line x1="5" y1="28" x2="22" y2="28" stroke="#1a6fbe" strokeWidth="1.2" />
      <path d="M22 -4 L22 4 L12 4 L12 -4 Z" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
      <line x1="17" y1="0" x2="17" y2="-6" stroke="#1a6fbe" strokeWidth="1.5" />
    </g>

    {/* Clock icon */}
    <g opacity="0.06" transform="translate(300,20)">
      <circle cx="28" cy="28" r="22" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <line x1="28" y1="6" x2="28" y2="28" stroke="#1a6fbe" strokeWidth="1.8" />
      <line x1="28" y1="28" x2="42" y2="38" stroke="#1a6fbe" strokeWidth="1.4" />
      <circle cx="28" cy="28" r="3" fill="#1a6fbe" />
    </g>

    {/* Warehouse icon */}
    <g opacity="0.05" transform="translate(570,14)">
      <rect x="0" y="14" width="50" height="30" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
      <polygon points="0,14 25,0 50,14" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
      <line x1="8" y1="28" x2="8" y2="44" stroke="#1a6fbe" strokeWidth="1.4" />
      <line x1="18" y1="28" x2="18" y2="44" stroke="#1a6fbe" strokeWidth="1.4" />
      <line x1="32" y1="28" x2="32" y2="44" stroke="#1a6fbe" strokeWidth="1.4" />
      <line x1="42" y1="28" x2="42" y2="44" stroke="#1a6fbe" strokeWidth="1.4" />
    </g>

    {/* Soft glow circles */}
    <circle cx="96%" cy="15%" r="80" fill="rgba(56,189,248,0.07)" />
    <circle cx="98%" cy="90%" r="60" fill="rgba(56,189,248,0.05)" />
    <circle cx="-2%" cy="50%" r="50" fill="rgba(56,189,248,0.04)" />
  </svg>

  <div className="relative flex flex-col items-start gap-4">
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-primary">Hi, {user?.name}</p>
      <h1 className="mt-1 text-3xl font-display font-bold tracking-tight text-foreground">
        Your logistics desk is ready
      </h1>
      <p className="mt-2 text-muted-foreground">
        Manage shipments, billing, and support requests for {user?.company} from one place.
      </p>
    </div>
  </div>
</div>
        <div className="flex flex-wrap gap-3">
          
          <Link href="/shipments">
            <Button variant="outline" className="border-border hover:bg-secondary">
              View All Shipments
            </Button>
          </Link>
          <Link href="/shipments/new">
            <Button className="bg-primary font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card shadow-sm transition-colors hover:border-muted-foreground/30">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">{stat.label}</p>
                {isLoadingSummary ? <Skeleton className="h-8 w-24 bg-secondary" /> : <p className="text-3xl font-display font-bold">{stat.value || 0}</p>}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-1   bg-card shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-primary" /> Active In-Transit
            </CardTitle>
            <Link href="/shipments" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingShipments ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-secondary" />
                ))}
              </div>
            ) : recentShipments?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Truck className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>No shipments currently in transit.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentShipments?.slice(0, 5).map((shipment) => (
                  <div key={shipment.id} className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-secondary sm:mt-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <Link href={`/shipments/${shipment.id}`} className="font-medium transition-colors hover:text-primary">
                            {shipment.trackingNumber}
                          </Link>
                          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-[10px] font-semibold uppercase text-primary">
                            {shipment.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="block max-w-[120px] truncate sm:max-w-[200px]" title={shipment.pickupAddress}>{shipment.pickupAddress.split(",")[0]}</span>
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          <span className="block max-w-[120px] truncate sm:max-w-[200px]" title={shipment.destinationAddress}>{shipment.destinationAddress.split(",")[0]}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-row items-center justify-between sm:flex-col sm:items-end sm:justify-center">
                      <span className="text-sm font-semibold">${shipment.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">Est. {format(new Date(shipment.estimatedDelivery), "MMM d")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 overflow-hidden border-primary/25 bg-card shadow-sm">
          <CardHeader className="relative border-b border-border/50 pb-4">
            <div className="pointer-events-none absolute right-4 top-3 h-16 w-16 rounded-full bg-primary/10 blur-xl" />
            <CardTitle className="relative text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,248,255,0.72))] p-4">
            <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full border border-sky-100/80 bg-white/40" />
            <Link href="/shipments/new" className="block">
              <Button className="h-12 w-full justify-start border border-sky-100 bg-white/85 text-foreground shadow-sm hover:bg-white">
                <Truck className="mr-3 h-4 w-4 text-primary" /> Create Delivery Request
              </Button>
            </Link>
            <Link href="/invoices" className="block">
              <Button variant="outline" className="h-12 w-full justify-start border border-sky-100 bg-white/80 text-foreground hover:bg-white">
                <FileText className="mr-3 h-4 w-4 text-muted-foreground" /> Review Invoices
              </Button>
            </Link>
            <Link href="/addresses" className="block">
              <Button variant="outline" className="h-12 w-full justify-start border border-sky-100 bg-white/80 text-foreground hover:bg-white">
                <MapPin className="mr-3 h-4 w-4 text-muted-foreground" /> Manage Saved Addresses
              </Button>
            </Link>
            <Link href="/tickets/new" className="mt-4 block">
              <Button variant="ghost" className="h-12 w-full justify-start text-muted-foreground hover:text-foreground">
                <LifeBuoy className="mr-3 h-4 w-4" /> Report an Issue
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
