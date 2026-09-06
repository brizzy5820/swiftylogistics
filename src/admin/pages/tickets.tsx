import { Link } from "wouter";
import { useListTickets } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Tickets() {
  const { user } = useAuth();
  const { data: tickets, isLoading, error } = useListTickets({ customerId: user?.id });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">Open</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500">In Progress</Badge>;
      case "resolved":
      case "closed":
        return <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div className="animate-in space-y-6 fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-display font-bold tracking-tight text-foreground">Support Tickets</h1>
          <p className="text-muted-foreground">Get help with shipments, billing, and account issues.</p>
        </div>
        <Link href="/tickets/new">
          <Button className="bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center p-12 text-center text-destructive">
              <AlertCircle className="mb-2 h-8 w-8" />
              <p>Failed to load tickets.</p>
            </div>
          ) : !tickets?.length ? (
            <div className="p-16 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mb-1 text-lg font-medium text-foreground">No support tickets</h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">Need help? Create a new support ticket and our team will assist you.</p>
              <Link href="/tickets/new">
                <Button variant="outline" className="mt-6 border-border">Create Ticket</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
                  <div className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary sm:mt-0">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary/80">{ticket.ticketNumber}</span>
                          <h3 className="text-base font-medium text-foreground">{ticket.subject}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {getStatusBadge(ticket.status)}
                          <span className="flex items-center gap-1">
                            {getPriorityIcon(ticket.priority)}
                            <span className="capitalize">{ticket.priority}</span>
                          </span>
                          <span className="hidden capitalize sm:inline">&middot; {ticket.category.replace("_", " ")}</span>
                          <span className="hidden sm:inline">&middot; Created {format(new Date(ticket.createdAt), "MMM d")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between sm:w-32 sm:justify-end">
                      <div className="text-sm text-muted-foreground sm:hidden">Created {format(new Date(ticket.createdAt), "MMM d")}</div>
                      <Badge variant="secondary" className="border-border bg-secondary font-normal text-foreground">
                        {ticket.messages.length} msg{ticket.messages.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
