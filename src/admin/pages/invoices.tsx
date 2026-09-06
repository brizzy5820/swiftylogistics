import { Link } from "wouter";
import { useListInvoices } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowRight, Download, Receipt, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Invoices() {
  const { user } = useAuth();
  const { data: invoices, isLoading, error } = useListInvoices({ customerId: user?.id });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">Paid</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500">Pending</Badge>;
      case "overdue":
        return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="animate-in space-y-6 fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-display font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage billing, complete Paystack test payments, and review receipts.</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center p-12 text-center text-destructive">
              <AlertCircle className="mb-2 h-8 w-8" />
              <p>Failed to load invoices.</p>
            </div>
          ) : !invoices?.length ? (
            <div className="p-16 text-center">
              <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mb-1 text-lg font-medium text-foreground">No invoices found</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">You don't have any billing history yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-secondary/30 sm:p-6 lg:flex-row lg:items-center">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-secondary">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <Link href={`/invoices/${invoice.id}`} className="font-medium text-foreground transition-colors hover:text-primary">
                          {invoice.invoiceNumber}
                        </Link>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Shipment:{" "}
                          <Link href={`/shipments/${invoice.shipmentId}`} className="transition-colors hover:text-foreground">
                            {invoice.trackingNumber}
                          </Link>
                        </span>
                        <span>&middot;</span>
                        <span>Created {format(new Date(invoice.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      {invoice.receiptNumber && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Receipt {invoice.receiptNumber} sent to {invoice.receiptEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-14 flex shrink-0 items-center justify-between gap-6 lg:ml-0 lg:justify-end">
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-bold text-foreground">${invoice.amount.toFixed(2)}</p>
                      {invoice.paidAt && <p className="text-xs text-muted-foreground">Paid {format(new Date(invoice.paidAt), "MMM d")}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Link href={`/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="sm" className="group h-8">
                          View <ArrowRight className="ml-1 h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
                        </Button>
                      </Link>
                    </div>
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
