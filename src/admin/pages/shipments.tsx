import { useState } from "react";
import { useListShipments } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Package, ArrowRight, Filter, AlertCircle } from "lucide-react";
import { ListShipmentsStatus } from "@workspace/api-zod";
import { useAuth } from "@/lib/auth";

export default function Shipments() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const queryParams = statusFilter !== "all" ? { status: statusFilter as ListShipmentsStatus, customerId: user?.id } : { customerId: user?.id };
  const { data: shipments, isLoading, error } = useListShipments(queryParams);

  const filteredShipments = shipments?.filter(
    (shipment) =>
      shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destinationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shipment.recipientName && shipment.recipientName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case "in_transit":
        return <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">In Transit</Badge>;
      case "delivered":
        return <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="animate-in space-y-6 fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-display font-bold tracking-tight text-foreground">Shipments</h1>
          <p className="text-muted-foreground">Manage and track your delivery requests.</p>
        </div>
        <Link href="/shipments/new">
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-4 sm:flex-row sm:items-center">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <TabsList className="h-auto w-max min-w-full border border-border bg-secondary p-1 sm:min-w-0">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_transit">In Transit</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tracking # or destination..."
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
              <p>Failed to load shipments.</p>
            </div>
          ) : filteredShipments?.length === 0 ? (
            <div className="p-16 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mb-1 text-lg font-medium text-foreground">No shipments found</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {searchQuery ? "Try adjusting your search terms or filters." : "You don't have any shipments matching this status."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredShipments?.map((shipment) => (
                <div key={shipment.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-secondary/30 sm:p-6 lg:flex-row lg:items-center lg:gap-6">
                  <div className="lg:w-[200px] lg:flex-shrink-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Link href={`/shipments/${shipment.id}`} className="truncate font-mono font-medium text-foreground transition-colors hover:text-primary">
                        {shipment.trackingNumber}
                      </Link>
                    </div>
                    <div>{getStatusBadge(shipment.status)}</div>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-4 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">From</p>
                      <p className="truncate font-medium" title={shipment.pickupAddress}>
                        {shipment.pickupAddress.split(",")[0]}
                      </p>
                    </div>
                    <ArrowRight className="mt-4 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">To</p>
                      <p className="truncate font-medium" title={shipment.destinationAddress}>
                        {shipment.destinationAddress.split(",")[0]}
                      </p>
                      {shipment.recipientName && <p className="mt-0.5 truncate text-xs text-muted-foreground">{shipment.recipientName}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 text-sm lg:w-[240px] lg:flex-shrink-0 lg:justify-end">
                    <div className="text-left lg:text-right">
                      <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Details</p>
                      <p className="font-medium">
                        {shipment.weightKg}kg &middot; <span className="capitalize">{shipment.packageType}</span>
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">{shipment.deliverySpeed} Speed</p>
                    </div>
                    <div className="text-right">
                      <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(shipment.createdAt), "MMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="hidden shrink-0 sm:block">
                    <Link href={`/shipments/${shipment.id}`}>
                      <Button variant="ghost" size="sm" className="h-8">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
