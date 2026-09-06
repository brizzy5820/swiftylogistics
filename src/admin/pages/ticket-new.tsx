import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useCreateTicket, getListTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(["delivery_issue", "payment", "tracking", "general"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  shipmentId: z.coerce.number().optional().or(z.literal("")),
  message: z.string().min(10, "Please provide more details in your message"),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

export default function TicketNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      category: "general",
      priority: "medium",
      message: "",
    },
  });

  const createMutation = useCreateTicket({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Ticket created", description: "Our support team will respond shortly." });
        queryClient.invalidateQueries({ queryKey: getListTicketsQueryKey() });
        setLocation(`/tickets/${data.id}`);
      },
      onError: () => {
        toast({ title: "Failed to submit", description: "Could not create the ticket.", variant: "destructive" });
      }
    }
  });

  const onSubmit = (data: TicketFormValues) => {
    if (!user) return;
    const payload = {
      ...data,
      customerId: user.id,
      shipmentId: data.shipmentId ? Number(data.shipmentId) : undefined
    };
    createMutation.mutate({ data: payload });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-secondary border-border">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">New Support Ticket</h1>
          <p className="text-sm text-muted-foreground">Describe your issue and we'll help you resolve it.</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="Briefly describe the issue..." {...field} className="bg-secondary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="delivery_issue">Delivery Issue</SelectItem>
                          <SelectItem value="payment">Billing & Payment</SelectItem>
                          <SelectItem value="tracking">Tracking & Status</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-secondary">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (General question)</SelectItem>
                          <SelectItem value="medium">Medium (Needs attention)</SelectItem>
                          <SelectItem value="high">High (Time sensitive)</SelectItem>
                          <SelectItem value="urgent">Urgent (Operation blocked)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="shipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Shipment ID (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 1234" {...field} className="bg-secondary" />
                    </FormControl>
                    <FormDescription>If this issue is about a specific shipment, provide its ID.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide as much detail as possible..." 
                        className="resize-none h-32 bg-secondary" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Link href="/tickets">
                  <Button type="button" variant="outline" className="border-border">Cancel</Button>
                </Link>
                <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground min-w-[150px]">
                  {createMutation.isPending ? "Submitting..." : (
                    <><Send className="w-4 h-4 mr-2" /> Submit Ticket</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
