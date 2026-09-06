import { useMemo, useState } from "react";
import { useListShipments } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { Search, CheckCircle2, Package, Filter, AlertCircle, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDeliveredGoods() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const { data: shipments = [], isLoading, error } = useListShipments({ status: "delivered" });

  const filteredShipments = useMemo(
    () =>
      shipments.filter((shipment) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          shipment.trackingNumber.toLowerCase().includes(query) ||
          shipment.pickupAddress.toLowerCase().includes(query) ||
          shipment.destinationAddress.toLowerCase().includes(query) ||
          (shipment.customerName && shipment.customerName.toLowerCase().includes(query));

        if (!matchesQuery) return false;
        if (timeFilter === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return new Date(shipment.createdAt) >= today;
        }
        if (timeFilter === "week") {
          return new Date(shipment.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }
        if (timeFilter === "month") {
          return new Date(shipment.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }
        return true;
      }),
    [searchQuery, shipments, timeFilter]
  );

  const totalRevenue = filteredShipments.reduce((sum, s) => sum + s.price, 0);
  const avgDeliveryTime = filteredShipments.length > 0
    ? Math.round(
        filteredShipments.reduce((sum, s) => {
          const created = new Date(s.createdAt).getTime();
          const delivered = new Date(s.updatedAt || s.createdAt).getTime();
          return sum + (delivered - created) / (1000 * 60);
        }, 0) / filteredShipments.length
      )
    : 0;

  const stats = [
    { label: "Total Delivered", value: filteredShipments.length, icon: CheckCircle2, color: "text-green-600" },
    { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp, color: "text-green-600" },
    { label: "Avg Delivery Time", value: `${avgDeliveryTime} min`, icon: Package, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Delivered Goods</h1>
        <p className="mt-2 text-muted-foreground">
          Track all successfully delivered shipments. Monitor delivery performance and revenue metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border bg-card">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-20 bg-secondary" />
                ) : (
                  <p className="mt-2 text-3xl font-display font-bold">{stat.value}</p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-4 sm:flex-row sm:items-center">
          <Tabs value={timeFilter} onValueChange={setTimeFilter} className="w-full sm:w-auto">
            <TabsList className="h-auto w-max border border-border bg-secondary p-1">
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tracking # or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-border bg-background pl-9"
              />
            </div>
            <button variant="outline" size="icon" className="shrink-0 border-border bg-secondary">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center p-12 text-center text-destructive">
              <AlertCircle className="mb-2 h-8 w-8" />
              <p>Failed to load delivered shipments.</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="p-16 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mb-1 text-lg font-medium text-foreground">No delivered shipments</h3>
              <p className="text-sm text-muted-foreground">Shipments will appear here once delivered.</p>
            </div>
          ) : (
            <Table className="min-w-[1000px]">
              <TableCaption className="px-6 py-4 text-sm text-muted-foreground text-left">{filteredShipments.length} delivered shipments</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Tracking</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Route</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Customer</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Delivered</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Delivery time</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => {
                  const deliveryTime = Math.round(
                    (new Date(shipment.updatedAt || shipment.createdAt).getTime() - new Date(shipment.createdAt).getTime()) /
                      (1000 * 60)
                  );

                  return (
                    <TableRow key={shipment.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <TableCell className="px-6 py-5 font-semibold text-foreground">{shipment.trackingNumber}</TableCell>
                      <TableCell className="px-6 py-5 text-foreground">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="truncate">{shipment.pickupAddress}</span>
                          <span className="text-muted-foreground flex-shrink-0">→</span>
                          <span className="truncate">{shipment.destinationAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-foreground font-medium">{shipment.customerName || "Guest"}</TableCell>
                      <TableCell className="px-6 py-5 text-foreground text-sm">{format(new Date(shipment.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="px-6 py-5 text-foreground font-medium">{deliveryTime} min</TableCell>
                      <TableCell className="px-6 py-5 text-foreground font-semibold text-right">${shipment.price.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
