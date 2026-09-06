import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import {
  getGetDashboardSummaryQueryKey,
  getGetInvoiceQueryKey,
  getGetShipmentQueryKey,
  getListInvoicesQueryKey,
  getListShipmentsQueryKey,
  useGetInvoice,
  usePayInvoice,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Clock, CreditCard, Download, ExternalLink, FileText, Printer, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function InvoiceDetail() {
  // ... all hooks/logic unchanged ...
 const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [payerName, setPayerName] = useState(user?.name ?? "");
  const [receiptEmail, setReceiptEmail] = useState(user?.email ?? "");
  const [paymentChannel, setPaymentChannel] = useState<"card" | "bank_transfer">("card");

  const { data: invoice, isLoading } = useGetInvoice(id, {
    query: { enabled: !!id, queryKey: getGetInvoiceQueryKey(id) },
  });

  const payInvoiceMutation = usePayInvoice({
    mutation: {
      onSuccess: (paidInvoice) => {
        toast({
          title: "Payment successful",
          description: `Receipt ${paidInvoice.receiptNumber} has been issued and sent to ${paidInvoice.receiptEmail}.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetShipmentQueryKey(paidInvoice.shipmentId) });
        queryClient.invalidateQueries({ queryKey: getListShipmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: () => {
        toast({
          title: "Payment failed",
          description: "The test Paystack payment could not be completed.",
          variant: "destructive",
        });
      },
    },
  });

  const trackingFromQuery = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("tracking") ?? "";
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-secondary" />
        <Skeleton className="mx-auto h-[700px] w-full max-w-5xl rounded-3xl bg-secondary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Link href="/invoices">
          <Button variant="link" className="mt-4">
            Back to invoices
          </Button>
        </Link>
      </div>
    );
  }

  const createdAt = new Date(invoice.createdAt);
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + 14);

  const handlePayNow = () => {
    if (!payerName.trim() || !receiptEmail.trim()) {
      toast({
        title: "Missing payment details",
        description: "Please provide the payer name and receipt email.",
        variant: "destructive",
      });
      return;
    }

    payInvoiceMutation.mutate({
      id,
      data: {
        payerName: payerName.trim(),
        receiptEmail: receiptEmail.trim(),
        paymentChannel,
      },
    });
  };


  return (
    <div className="space-y-5">

      {/* ── Hero banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[1.75rem] border border-sky-100 bg-white px-5 py-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.22)] sm:px-6">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="desk-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#e8f3fc" strokeWidth="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#desk-grid)" />
          {/* Invoice / doc icon */}
          <g opacity="0.055" transform="translate(470,10)">
            <rect x="0" y="0" width="38" height="50" rx="3" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <line x1="6" y1="12" x2="32" y2="12" stroke="#1a6fbe" strokeWidth="1.2" />
            <line x1="6" y1="19" x2="28" y2="19" stroke="#1a6fbe" strokeWidth="1.2" />
            <line x1="6" y1="26" x2="30" y2="26" stroke="#1a6fbe" strokeWidth="1.2" />
            <rect x="6" y="33" width="26" height="8" rx="2" fill="none" stroke="#1a6fbe" strokeWidth="1.3" />
            <path d="M24 -6 L24 0 L14 0 L14 -6 Z" fill="none" stroke="#1a6fbe" strokeWidth="1.5" />
            <line x1="19" y1="-6" x2="19" y2="-10" stroke="#1a6fbe" strokeWidth="1.4" />
          </g>
          {/* Card / payment icon */}
          <g opacity="0.05" transform="translate(548,52)">
            <rect x="0" y="0" width="42" height="24" rx="5" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <line x1="8" y1="12" x2="20" y2="12" stroke="#1a6fbe" strokeWidth="1.5" />
            <circle cx="30" cy="12" r="4" fill="none" stroke="#1a6fbe" strokeWidth="1.4" />
            <line x1="8" y1="6" x2="34" y2="6" stroke="#1a6fbe" strokeWidth="0.8" />
          </g>
          {/* Clock icon */}
          <g opacity="0.05" transform="translate(416,58)">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#1a6fbe" strokeWidth="1.8" />
            <line x1="18" y1="6" x2="18" y2="18" stroke="#1a6fbe" strokeWidth="1.8" />
            <line x1="18" y1="18" x2="26" y2="24" stroke="#1a6fbe" strokeWidth="1.4" />
            <circle cx="18" cy="18" r="2.5" fill="#1a6fbe" />
          </g>
          <circle cx="94%" cy="12%" r="68" fill="rgba(56,189,248,0.06)" />
          <circle cx="95%" cy="90%" r="48" fill="rgba(56,189,248,0.04)" />
          <circle cx="-1%" cy="55%" r="42" fill="rgba(56,189,248,0.04)" />
        </svg>

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon"
                className="mt-0.5 h-9 w-9 shrink-0 rounded-xl border border-border bg-white hover:bg-secondary/80">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                Invoice & payment
              </p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                {invoice.invoiceNumber}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Tracking ID:{" "}
                <span className="font-semibold text-foreground">
                  {trackingFromQuery || invoice.trackingNumber}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-border">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button className="rounded-xl">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── New shipment success banner ───────────────────────── */}
      {trackingFromQuery && (
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.25rem] border border-border bg-secondary/40 px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">
                Shipment request created successfully
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                Your new tracking ID is{" "}
                <span className="font-mono font-semibold">{trackingFromQuery}</span>.
                Complete payment below to finalise the order workflow.
              </p>
            </div>
          </div>
          <Link href={`/shipments/${invoice.shipmentId}`}>
            <Button variant="outline" className="shrink-0 rounded-xl border-border">
              View shipment
            </Button>
          </Link>
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* Invoice document card */}
        <Card className="overflow-hidden border-border bg-card">
          <CardHeader className="border-b border-border/60 p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight">
                  Workplace Logistics & Courier
                </h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  123 Logistics Way<br />Lagos, Nigeria
                </p>
              </div>

              <div className="w-full rounded-2xl border border-border bg-secondary/35 p-4 sm:w-auto sm:min-w-64">
                {[
                  { label: "Invoice #", value: invoice.invoiceNumber },
                  { label: "Created",   value: format(createdAt, "MMM d, yyyy") },
                  { label: "Due date",  value: format(dueDate, "MMM d, yyyy") },
                ].map(({ label, value }) => (
                  <div key={label}
                    className="flex items-center justify-between gap-6 border-b border-border/40 py-2 last:border-0 last:pb-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-6 py-2">
                  <span className="text-sm text-muted-foreground">Tracking</span>
                  <Link href={`/shipments/${invoice.shipmentId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    {invoice.trackingNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Billed to + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Billed to
                </p>
                <p className="font-medium">{user?.company ?? "Customer Account"}</p>
                <p className="text-sm text-muted-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Status
                </p>
                {invoice.status === "paid" ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Paid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Pending payment</span>
                  </div>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[480px] border-collapse table-fixed text-sm">
                <thead className="border-b border-border bg-secondary/40">
                  <tr>
                    <th className="w-3/4 p-4 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Description
                    </th>
                    <th className="w-1/4 p-4 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-4 align-top">
                      <p className="font-medium">Logistics order booking and delivery service</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        Includes request handling, shipment setup, and dispatch workflow activation.
                      </p>
                    </td>
                    <td className="p-4 text-right align-top font-medium">
                      ${invoice.amount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full rounded-2xl border border-border bg-secondary/35 p-4 sm:w-72">
                <div className="divide-y divide-border/40">
                  {[
                    { label: "Subtotal", value: `$${invoice.amount.toFixed(2)}` },
                    { label: "Tax",      value: "$0.00" },
                  ].map(({ label, value }) => (
                    <div key={label}
                      className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/60 bg-secondary/20 px-6 py-4 text-center">
            <p className="w-full text-xs text-muted-foreground">
              Thank you for choosing Workplace Logistics & Courier ·{" "}
              billing@workplacelogistics.com
            </p>
          </CardFooter>
        </Card>

        {/* ── Sticky payment sidebar ──────────────────────────── */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden border-border bg-card">
            <CardHeader className="border-b border-border/60 bg-secondary/30 pb-4">
              <div className="flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-primary" />
                <span className="font-medium">Payment</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {/* Paystack notice */}
              <div className="rounded-xl border border-primary/15 bg-primary/[0.06] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Paystack test mode</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                      This demo uses a Paystack test-style flow and stores the
                      receipt against the invoice.
                    </p>
                  </div>
                </div>
              </div>

              {invoice.status === "pending" ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="payer-name" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Payer name
                    </Label>
                    <Input
                      id="payer-name"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="h-10 rounded-xl bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="receipt-email" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Receipt email
                    </Label>
                    <Input
                      id="receipt-email"
                      type="email"
                      value={receiptEmail}
                      onChange={(e) => setReceiptEmail(e.target.value)}
                      className="h-10 rounded-xl bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Payment channel
                    </Label>
                    <Select
                      value={paymentChannel}
                      onValueChange={(v: "card" | "bank_transfer") => setPaymentChannel(v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-secondary/50">
                        <SelectValue placeholder="Choose a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Checkout summary */}
                  <div className="rounded-xl border border-border bg-secondary/30 p-3.5 text-sm">
                    <p className="mb-2 font-medium">Test checkout details</p>
                    {[
                      { label: "Provider",    value: "Paystack Test" },
                      { label: "Amount",      value: `$${invoice.amount.toFixed(2)}` },
                      { label: "Tracking ID", value: invoice.trackingNumber },
                    ].map(({ label, value }) => (
                      <div key={label}
                        className="flex items-center justify-between py-1 text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handlePayNow}
                    disabled={payInvoiceMutation.isPending}
                    className="h-11 w-full rounded-xl"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {payInvoiceMutation.isPending ? "Processing..." : "Pay Now"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Paid state */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Payment recorded</p>
                        <p className="mt-0.5 text-xs text-emerald-700/80 leading-relaxed">
                          Receipt sent to {invoice.receiptEmail ?? user?.email}.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="divide-y divide-border/40 text-sm">
                      {[
                        { label: "Receipt #",  value: invoice.receiptNumber },
                        { label: "Reference",  value: invoice.paymentReference },
                        { label: "Provider",   value: invoice.paymentProvider },
                        { label: "Channel",    value: invoice.paymentChannel?.replace("_", " ") },
                        { label: "Paid on",    value: invoice.paidAt
                            ? format(new Date(invoice.paidAt), "MMM d, yyyy h:mm a")
                            : "—" },
                      ].map(({ label, value }) => (
                        <div key={label}
                          className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium capitalize">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Receipt attached to invoice</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          This order is ready for pickup scheduling and the receipt
                          remains linked to this invoice record.
                        </p>
                      </div>
                    </div>
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