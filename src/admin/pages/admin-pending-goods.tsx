import { useMemo, useState } from "react";
import { useListShipments } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { Search, Clock, Package, Filter, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPendingGoods() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { data: shipments = [], isLoading, error } = useListShipments({ status: "pending" });

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
        if (priorityFilter === "urgent") {
          const hoursOld = (Date.now() - new Date(shipment.createdAt).getTime()) / (1000 * 60 * 60);
          return hoursOld > 12;
        }
        if (priorityFilter === "unassigned") {
          return !shipment.riderId;
        }
        return true;
      }),
    [priorityFilter, searchQuery, shipments]
  );

  const getUrgencyBadge = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const hoursOld = (Date.now() - created) / (1000 * 60 * 60);

    if (hoursOld > 24) {
      return <Badge className="bg-red-500/10 text-red-700 border-red-200">Urgent</Badge>;
    }
    if (hoursOld > 12) {
      return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200">High</Badge>;
    }
    if (hoursOld > 6) {
      return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">Medium</Badge>;
    }
    return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">New</Badge>;
  };

  const stats = [
    { label: "Total Pending", value: shipments.length, icon: Package, color: "text-blue-600" },
    { label: "Awaiting Pickup", value: shipments.filter((s) => s.status === "pending").length, icon: Clock, color: "text-orange-600" },
    { label: "Oldest Request", value: shipments.length > 0 ? format(new Date(shipments[0].createdAt), "h:mm a") : "—", icon: Package, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Pending Goods</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor all pending shipments awaiting pickup. Prioritize urgent requests and coordinate with riders.
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
          <Tabs value={priorityFilter} onValueChange={setPriorityFilter} className="w-full sm:w-auto">
            <TabsList className="h-auto w-max border border-border bg-secondary p-1">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="urgent">Urgent</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
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
            <Button variant="outline" size="icon" className="shrink-0 border-border bg-secondary">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </Button>
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
              <p>Failed to load pending shipments.</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mb-1 text-lg font-medium text-foreground">No pending shipments</h3>
              <p className="text-sm text-muted-foreground">All goods are either picked up or delivered!</p>
            </div>
          ) : (
            <Table className="min-w-[1000px]">
              <TableCaption className="px-6 py-4 text-sm text-muted-foreground text-left">{filteredShipments.length} pending shipments</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Tracking</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Route</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Customer</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Details</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Created</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm text-right">Urgency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
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
                    <TableCell className="px-6 py-5 text-foreground text-sm">{shipment.weightKg}kg · {shipment.packageType}</TableCell>
                    <TableCell className="px-6 py-5 text-foreground text-sm">{format(new Date(shipment.createdAt), "MMM d, h:mm a")}</TableCell>
                    <TableCell className="px-6 py-5 text-right">{getUrgencyBadge(shipment.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
