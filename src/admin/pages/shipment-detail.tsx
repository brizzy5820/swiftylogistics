import { useParams, Link } from "wouter";
import { useGetShipment, useGetShipmentTracking, useCancelShipment, getGetShipmentQueryKey, getListShipmentsQueryKey, useListInvoices } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard, Map, MapPin, Package, ReceiptText, ShieldCheck, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function ShipmentDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: shipment, isLoading: isLoadingShipment } = useGetShipment(id, {
    query: { enabled: !!id, queryKey: getGetShipmentQueryKey(id) },
  });

  const { data: tracking, isLoading: isLoadingTracking } = useGetShipmentTracking(id, {
    query: { enabled: !!id, queryKey: [`/api/shipments/${id}/tracking`] },
  });
  const { data: invoices = [] } = useListInvoices({ customerId: user?.id });

  const cancelMutation = useCancelShipment({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Shipment cancelled", description: "The delivery request has been cancelled." });
        queryClient.setQueryData(getGetShipmentQueryKey(id), data);
        queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to cancel", description: "Could not cancel this shipment.", variant: "destructive" });
      },
    },
  });

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this shipment? This action cannot be undone.")) {
      cancelMutation.mutate({ id });
    }
  };

  if (isLoadingShipment) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-secondary" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] bg-secondary lg:col-span-2" />
          <Skeleton className="col-span-1 h-[400px] bg-secondary" />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold">Shipment not found</h2>
        <Link href="/shipments">
          <Button variant="link" className="mt-4">
            Back to shipments
          </Button>
        </Link>
      </div>
    );
  }

  const relatedInvoice = invoices.find((invoice) => invoice.shipmentId === shipment.id);
  const orderSteps = [
    {
      label: "Request submitted",
      complete: true,
      detail: `Created ${format(new Date(shipment.createdAt), "MMM d, yyyy")}`,
    },
    {
      label: "Payment confirmed",
      complete: relatedInvoice?.status === "paid",
      detail: relatedInvoice?.status === "paid" ? `Receipt ${relatedInvoice.receiptNumber ?? relatedInvoice.paymentReference ?? "issued"}` : "Awaiting invoice payment",
    },
    {
      label: "Pickup scheduled",
      complete: Boolean(shipment.scheduledPickup) || shipment.status !== "pending",
      detail: shipment.scheduledPickup ? format(new Date(shipment.scheduledPickup), "MMM d, yyyy") : "Will appear after booking",
    },
    {
      label: "In transit",
      complete: shipment.status === "in_transit" || shipment.status === "delivered",
      detail: shipment.status === "in_transit" || shipment.status === "delivered" ? "Shipment is moving through the network" : "Dispatch pending",
    },
    {
      label: "Delivered",
      complete: shipment.status === "delivered",
      detail: shipment.status === "delivered" ? "Recipient completed handoff" : "Final delivery pending",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case "in_transit":
        return <Badge className="border-primary/20 bg-primary/10 text-primary">In Transit</Badge>;
      case "delivered":
        return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">Delivered</Badge>;
      case "cancelled":
        return <Badge className="border-destructive/20 bg-destructive/10 text-destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  return (
    <div className="animate-in fade-in duration-300 space-y-6">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-sky-100 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="desk-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#e8f3fc" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#desk-grid)" />
          <g opacity="0.055" transform="translate(480,12)">
            <rect x="0" y="8" width="38" height="30" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <line x1="0" y1="20" x2="38" y2="20" stroke="#1a6fbe" strokeWidth="1.2" />
            <polyline points="0,24 -16,24 -16,34" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <circle cx="-16" cy="38" r="5" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <polyline points="38,24 54,24 54,34" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <circle cx="54" cy="38" r="5" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
          </g>
          <g opacity="0.05" transform="translate(560,50)">
            <rect x="0" y="0" width="32" height="42" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <line x1="5" y1="10" x2="27" y2="10" stroke="#1a6fbe" strokeWidth="1.2" />
            <line x1="5" y1="16" x2="23" y2="16" stroke="#1a6fbe" strokeWidth="1.2" />
            <line x1="5" y1="22" x2="25" y2="22" stroke="#1a6fbe" strokeWidth="1.2" />
            <path d="M20 -6 L20 0 L12 0 L12 -6 Z" fill="none" stroke="#1a6fbe" strokeWidth="1.4" />
          </g>
          <g opacity="0.05" transform="translate(424,54)">
            <rect x="0" y="0" width="42" height="20" rx="10" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
            <line x1="8" y1="10" x2="16" y2="10" stroke="#1a6fbe" strokeWidth="1.3" />
            <line x1="20" y1="10" x2="26" y2="10" stroke="#1a6fbe" strokeWidth="1.3" />
            <line x1="30" y1="10" x2="34" y2="10" stroke="#1a6fbe" strokeWidth="1.3" />
            <circle cx="-6" cy="10" r="4" fill="none" stroke="#1a6fbe" strokeWidth="1.4" />
            <line x1="-2" y1="10" x2="0" y2="10" stroke="#1a6fbe" strokeWidth="1.3" />
          </g>
          <circle cx="94%" cy="15%" r="70" fill="rgba(56,189,248,0.06)" />
          <circle cx="96%" cy="88%" r="50" fill="rgba(56,189,248,0.04)" />
        </svg>

        <div className="relative z-10 px-5 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Link href="/shipments">
                <Button variant="ghost" size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl border border-border bg-white hover:bg-secondary/80">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Shipment detail
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                    {shipment.trackingNumber}
                  </h1>
                  {getStatusBadge(shipment.status)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Created {format(new Date(shipment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
            {shipment.status === "pending" && (
              <Button variant="destructive" onClick={handleCancel}
                disabled={cancelMutation.isPending} className="shrink-0">
                Cancel shipment
              </Button>
            )}
          </div>

          {/* Stat pills */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: "Service",          value: shipment.deliverySpeed },
              { label: "Weight",           value: `${shipment.weightKg} kg` },
              { label: "Est. delivery",    value: format(new Date(shipment.estimatedDelivery), "MMM d, yyyy") },
              { label: "Amount",           value: `$${shipment.price.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label}
                className="rounded-2xl border border-border/70 bg-white/90 px-4 py-3.5 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1.5 text-sm font-semibold capitalize text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

        {/* Left column */}
        <div className="space-y-5">

          {/* Order workflow */}
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" /> Order workflow
              </CardTitle>
              <CardDescription>From booking to final handoff.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {orderSteps.map((step, index) => (
                  <div key={step.label}
                    className={`rounded-2xl border p-4 ${
                      index === orderSteps.length - 1 ? "sm:col-span-2 " : ""
                    }${
                      step.complete && index === orderSteps.filter(s => s.complete).length - 1
                        ? "border-primary/20 bg-primary/5"
                        : "border-border bg-secondary/20"
                    }`}>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        step.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {step.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                      </div>
                      <p className="text-sm font-medium leading-tight">{step.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Route details */}
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Map className="h-4 w-4 text-muted-foreground" /> Route details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative rounded-2xl border border-border/70 bg-secondary/15 p-5">
                {/* vertical connector line */}
                <div className="absolute bottom-[60px] left-[29px] top-[52px] w-px bg-border" />

                {/* Origin */}
                <div className="relative mb-6 flex gap-4">
                  <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Pickup address
                    </p>
                    <p className="text-[15px] font-medium leading-snug">{shipment.pickupAddress}</p>
                    {shipment.scheduledPickup && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Scheduled for {format(new Date(shipment.scheduledPickup), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Destination */}
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-background">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Destination address
                    </p>
                    <p className="text-[15px] font-medium leading-snug">{shipment.destinationAddress}</p>
                    <div className="mt-3 rounded-xl border border-border bg-background/80 px-4 py-3">
                      <p className="mb-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Recipient</p>
                      <p className="text-sm font-medium">{shipment.recipientName || "Not specified"}</p>
                      {shipment.recipientPhone && (
                        <p className="text-sm text-muted-foreground">{shipment.recipientPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package + Billing side-by-side */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <Card className="overflow-hidden border-border bg-card">
              <CardHeader className="border-b border-border/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" /> Package info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Type</p>
                    <p className="text-sm font-medium capitalize">{shipment.packageType}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Weight</p>
                    <p className="text-sm font-medium">{shipment.weightKg} kg</p>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Dimensions</p>
                  <p className="text-sm font-medium">{shipment.dimensionsCm || "Not provided"}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Notes</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {shipment.notes || "No special instructions."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border bg-card">
              <CardHeader className="border-b border-border/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" /> Billing & service
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="divide-y divide-border/40">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-muted-foreground">Service level</span>
                    <Badge variant="outline" className="capitalize bg-secondary text-xs">
                      {shipment.deliverySpeed}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-muted-foreground">Est. delivery</span>
                    <span className="text-sm font-medium">
                      {format(new Date(shipment.estimatedDelivery), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-muted-foreground">Total cost</span>
                    <span className="text-lg font-bold">${shipment.price.toFixed(2)}</span>
                  </div>
                </div>
                {relatedInvoice && (
                  <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3.5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-medium">{relatedInvoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {relatedInvoice.status === "paid"
                            ? "Receipt attached"
                            : "Payment required to confirm order"}
                        </p>
                      </div>
                      <Badge variant="outline"
                        className={relatedInvoice.status === "paid"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-xs"
                          : "border-amber-500/20 bg-amber-500/10 text-amber-600 text-xs"}>
                        {relatedInvoice.status}
                      </Badge>
                    </div>
                    <Link href={`/invoices/${relatedInvoice.id}`}>
                      <Button variant="outline" className="w-full rounded-xl border-border bg-card text-sm h-9">
                        {relatedInvoice.status === "paid" ? "View invoice & receipt" : "Open invoice & pay"}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Payment snapshot */}
          {relatedInvoice && (
            <Card className="overflow-hidden border-border bg-card">
              <CardHeader className="border-b border-border/50 bg-secondary/30 pb-4">
                <CardTitle className="text-base">Payment snapshot</CardTitle>
                <CardDescription>Current billing state for this order.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <div className={`rounded-xl border p-4 ${
                  relatedInvoice.status === "paid"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-amber-500/20 bg-amber-500/10"
                }`}>
                  <div className="flex items-start gap-3">
                    {relatedInvoice.status === "paid"
                      ? <ReceiptText className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                      : <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${
                        relatedInvoice.status === "paid" ? "text-emerald-700" : "text-amber-700"
                      }`}>
                        {relatedInvoice.status === "paid" ? "Receipt issued" : "Paystack payment pending"}
                      </p>
                      <p className={`mt-1 text-xs leading-relaxed ${
                        relatedInvoice.status === "paid" ? "text-emerald-700/80" : "text-amber-700/80"
                      }`}>
                        {relatedInvoice.status === "paid"
                          ? `Receipt ${relatedInvoice.receiptNumber ?? relatedInvoice.paymentReference ?? ""} sent to ${relatedInvoice.receiptEmail ?? user?.email ?? "your billing email"}.`
                          : "Complete the payment to attach the receipt and confirm this order financially."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: "Amount",  value: `$${relatedInvoice.amount.toFixed(2)}` },
                    { label: "Invoice", value: relatedInvoice.invoiceNumber },
                  ].map(({ label, value }) => (
                    <div key={label}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-4 py-3">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking timeline */}
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="border-b border-border/50 bg-secondary/30 pb-4">
              <CardTitle className="text-base">Tracking timeline</CardTitle>
              <CardDescription>Real-time location updates</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {isLoadingTracking ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full bg-secondary" />)}
                </div>
              ) : !tracking || tracking.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-2 h-7 w-7 opacity-40" />
                  <p className="text-sm">No tracking events yet.</p>
                  <p className="mt-1 text-xs">Check back after pickup.</p>
                </div>
              ) : (
                <div className="relative ml-3 border-l border-border">
                  <div className="space-y-6 pb-2 pl-6">
                    {tracking.map((event, index) => {
                      const isLatest = index === 0;
                      return (
                        <div key={event.id} className="relative">
                          <div className={`absolute -left-[29px] top-1 flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-background ${
                            isLatest ? "bg-primary" : "bg-muted-foreground"
                          }`}>
                            {isLatest && (
                              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            )}
                          </div>
                          <p className={`text-sm font-medium ${isLatest ? "text-foreground" : "text-muted-foreground"}`}>
                            {event.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                            {event.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-primary">{event.location}</span>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(event.timestamp), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
