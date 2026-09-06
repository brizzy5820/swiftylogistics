import { useMemo, useState } from "react";
import { useListUsers, useListShipments, useListTickets, useListInvoices } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { Search } from "lucide-react";

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: users = [] } = useListUsers();
  const { data: shipments = [] } = useListShipments();
  const { data: tickets = [] } = useListTickets();
  const { data: invoices = [] } = useListInvoices();

  const customers = useMemo(() => users.filter((user) => user.role === "user"), [users]);

  const filteredCustomers = useMemo(
    () =>
      customers
        .map((customer) => {
          const customerShipments = shipments.filter((shipment) => shipment.customerId === customer.id);
          const customerTickets = tickets.filter((ticket) => ticket.customerId === customer.id);
          const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id);
          const spend = customerInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
          const openTickets = customerTickets.filter(
            (ticket) => ticket.status === "open" || ticket.status === "in_progress"
          ).length;
          const lastShipmentAt = customerShipments.reduce(
            (latest, shipment) => Math.max(latest, new Date(shipment.createdAt).getTime()), 0
          );

          return {
            ...customer,
            company: customer.company || "—",
            region: customer.region || "Unknown",
            shipments: customerShipments.length,
            openTickets,
            spend,
            lastActivity: lastShipmentAt,
          };
        })
        .filter((customer) => {
          if (!searchQuery.trim()) return true;
          const search = searchQuery.toLowerCase();
          return (
            customer.name.toLowerCase().includes(search) ||
            customer.email.toLowerCase().includes(search) ||
            customer.company.toLowerCase().includes(search) ||
            customer.region.toLowerCase().includes(search)
          );
        })
        .sort((a, b) => b.lastActivity - a.lastActivity),
    [customers, invoices, searchQuery, shipments, tickets]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Customer accounts</h1>
        <p className="mt-2 text-muted-foreground">A support-facing table of customer activity, order volume, and billing health.</p>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Customer table</p>
            <p className="text-xs text-muted-foreground">Search customers by name, email, company, or region.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-[260px] border-none bg-transparent px-0 text-sm"
            />
          </div>
        </CardContent>

        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="p-16 text-center text-muted-foreground">
              No matching customers were found.
            </div>
          ) : (
            <Table className="min-w-[960px]">
              <TableCaption className="px-6 py-4 text-sm text-muted-foreground text-left">{filteredCustomers.length} customer accounts found</TableCaption>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Customer</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Company</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Region</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Shipments</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm">Open tickets</TableHead>
                  <TableHead className="px-6 py-5 font-semibold text-foreground text-sm text-right">Lifetime spend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <TableCell className="px-6 py-5 font-medium text-foreground">{customer.name}</TableCell>
                    <TableCell className="px-6 py-5 text-foreground">{customer.company}</TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                        {customer.region}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-foreground font-medium">{customer.shipments}</TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge className={`text-xs font-semibold rounded-full px-3 py-1 ${
                        customer.openTickets > 0 
                          ? "bg-orange-500/10 text-orange-700 border border-orange-200" 
                          : "bg-emerald-500/10 text-emerald-700 border border-emerald-200"
                      }`}>
                        {customer.openTickets}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-foreground font-semibold text-right">${customer.spend.toLocaleString()}</TableCell>
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
