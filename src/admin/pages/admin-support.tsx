import { useState } from "react";
import { useListTickets, useReplyToTicket, useUpdateTicketStatus, getListTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminSupport() {
  const { data: tickets = [] } = useListTickets();
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const replyMutation = useReplyToTicket({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        setDrafts({});
        toast({ title: "Reply sent", description: "Support response added successfully." });
      },
    },
  });

  const statusMutation = useUpdateTicketStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        toast({ title: "Ticket updated", description: "Ticket status changed successfully." });
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Support Operations</h1>
        <p className="mt-2 text-muted-foreground">Resolve incoming issues from a dedicated admin queue instead of the customer view.</p>
      </div>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="border-border bg-card">
            <CardHeader className="border-b border-border/50">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ticket.customerName} · {ticket.ticketNumber} · {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{ticket.priority}</Badge>
                  <Badge variant="secondary" className="capitalize">{ticket.status.replace("_", " ")}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                {ticket.messages.slice(0, 3).map((message) => (
                  <div key={message.id} className="rounded-2xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium capitalize">{message.sender}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(message.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{message.content}</p>
                  </div>
                ))}
              </div>

              <Textarea
                placeholder="Reply as support..."
                value={drafts[ticket.id] ?? ""}
                onChange={(e) => setDrafts((current) => ({ ...current, [ticket.id]: e.target.value }))}
                className="min-h-[96px] bg-secondary"
              />

              <div className="flex flex-wrap gap-3">
                <Button
                  className="bg-primary text-primary-foreground"
                  disabled={!drafts[ticket.id]?.trim() || replyMutation.isPending}
                  onClick={() => replyMutation.mutate({ id: ticket.id, data: { content: drafts[ticket.id], sender: "support" } })}
                >
                  Send Response
                </Button>
                <Button variant="outline" className="border-border" onClick={() => statusMutation.mutate({ id: ticket.id, status: "resolved" })}>
                  Mark Resolved
                </Button>
                <Button variant="ghost" onClick={() => statusMutation.mutate({ id: ticket.id, status: "in_progress" })}>
                  Move to In Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
