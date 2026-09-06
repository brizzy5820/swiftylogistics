import { useState, type FormEvent } from "react";
import { useParams, Link } from "wouter";
import { useGetTicket, useReplyToTicket, getGetTicketQueryKey, getListTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, User, ShieldAlert, Package, CheckCircle2 } from "lucide-react";

export default function TicketDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useGetTicket(id, {
    query: { enabled: !!id, queryKey: getGetTicketQueryKey(id) },
  });

  const replyMutation = useReplyToTicket({
    mutation: {
      onSuccess: () => {
        setReplyContent("");
        queryClient.invalidateQueries({ queryKey: getGetTicketQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        toast({ title: "Reply sent", description: "Your message has been added to the ticket." });
      },
      onError: () => {
        toast({ title: "Failed to send", description: "Could not send your reply.", variant: "destructive" });
      },
    },
  });

  const handleReplySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate({ id, data: { content: replyContent } });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-64 bg-secondary" />
        <Skeleton className="h-[200px] w-full bg-secondary" />
        <Skeleton className="h-[300px] w-full bg-secondary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold">Ticket not found</h2>
        <Link href="/tickets">
          <Button variant="link" className="mt-4">
            Back to tickets
          </Button>
        </Link>
      </div>
    );
  }

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

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="mx-auto max-w-3xl animate-in space-y-6 fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="h-8 w-8 border-border bg-secondary hover:bg-secondary/80">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">{ticket.subject}</h1>
            {getStatusBadge(ticket.status)}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono">{ticket.ticketNumber}</span>
            <span>&middot;</span>
            <span className="capitalize">{ticket.category.replace("_", " ")}</span>
            {ticket.shipmentId && (
              <>
                <span>&middot;</span>
                <Link href={`/shipments/${ticket.shipmentId}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Package className="h-3 w-3" /> Shipment #{ticket.shipmentId}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {ticket.messages.map((message) => {
          const isSupport = message.sender === "support";
          return (
            <Card key={message.id} className={`border-border ${isSupport ? "bg-secondary/40" : "bg-card"}`}>
              <CardHeader className="flex flex-row items-center gap-3 border-b border-border/50 bg-secondary/20 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSupport ? "bg-primary text-white" : "border border-border bg-secondary text-muted-foreground"}`}>
                  {isSupport ? <ShieldAlert className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{isSupport ? "Workplace Logistics Support" : "You"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(message.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                </div>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-foreground">{message.content}</CardContent>
            </Card>
          );
        })}
      </div>

      {!isClosed ? (
        <Card className="mt-8 border-border border-primary/20 bg-card">
          <CardContent className="p-0">
            <form onSubmit={handleReplySubmit}>
              <Textarea
                placeholder="Type your reply here..."
                className="min-h-[120px] resize-none rounded-none border-0 bg-transparent p-4 focus-visible:ring-0"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex items-center justify-between border-t border-border bg-secondary/30 p-3">
                <p className="ml-2 text-xs text-muted-foreground">We typically reply within 2 hours.</p>
                <Button type="submit" disabled={!replyContent.trim() || replyMutation.isPending} className="bg-primary text-primary-foreground">
                  {replyMutation.isPending ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send Reply</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 rounded-lg border border-border bg-secondary/20 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
          <h3 className="font-medium text-foreground">This ticket has been closed</h3>
          <p className="mt-1 text-sm text-muted-foreground">If you need further assistance, please open a new ticket.</p>
          <Link href="/tickets/new">
            <Button variant="outline" className="mt-4 border-border">
              Create New Ticket
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
