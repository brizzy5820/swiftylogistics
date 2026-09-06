import { useGetAdminOverview, useListShipments, useListTickets } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CircleDollarSign, PackageCheck, ShieldAlert, Users } from "lucide-react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: overview, isLoading: isLoadingOverview } = useGetAdminOverview();
  const { data: shipments = [], isLoading: isLoadingShipments } = useListShipments();
  const { data: tickets = [], isLoading: isLoadingTickets } = useListTickets();

  const metrics = [
    { label: "Customers", value: overview?.totalCustomers ?? 0, icon: Users },
    { label: "Open Tickets", value: overview?.openTickets ?? 0, icon: ShieldAlert },
    { label: "Monthly Revenue", value: `$${(overview?.monthlyRevenue ?? 0).toLocaleString()}`, icon: CircleDollarSign },
    { label: "Active Routes", value: overview?.activeRoutes ?? 0, icon: Activity },
  ];

  const recentShipments = shipments.slice(0, 5);
  const priorityTickets = tickets.filter((ticket) => ticket.priority === "high" || ticket.priority === "urgent").slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Admin Command Center</h1>
        <p className="mt-2 text-muted-foreground">Monitor customer activity, ticket pressure, and route movement from one control surface.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                {isLoadingOverview ? <Skeleton className="mt-2 h-8 w-24 bg-secondary" /> : <p className="mt-2 text-3xl font-display font-bold">{metric.value}</p>}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <metric.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageCheck className="h-4 w-4 text-primary" /> Shipment Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingShipments ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-16 w-full bg-secondary" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentShipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{shipment.trackingNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {shipment.customerName} · {shipment.pickupAddress.split(",")[0]} to {shipment.destinationAddress.split(",")[0]}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">
                        {shipment.status.replace("_", " ")}
                      </Badge>
                      <p className="mt-2 text-xs text-muted-foreground">{format(new Date(shipment.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base">Priority Ticket Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {isLoadingTickets ? (
              <>
                <Skeleton className="h-20 w-full bg-secondary" />
                <Skeleton className="h-20 w-full bg-secondary" />
              </>
            ) : priorityTickets.length ? (
              priorityTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{ticket.customerName}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Opened {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No high-priority tickets right now.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
