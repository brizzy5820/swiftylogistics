import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListAddresses, useCreateAddress, useDeleteAddress, getListAddressesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2, Home, Building2, Map } from "lucide-react";
import { useAuth } from "@/lib/auth";

const addressSchema = z.object({
  label: z.string().min(2, "Label is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export default function Addresses() {
  const { user } = useAuth();
  const { data: addresses, isLoading } = useListAddresses({ customerId: user?.id });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      street: "",
      city: "",
      state: "",
      country: "",
      isDefault: false,
    },
  });

  const createMutation = useCreateAddress({
    mutation: {
      onSuccess: () => {
        toast({ title: "Address added", description: "The new address has been saved." });
        queryClient.invalidateQueries({ queryKey: getListAddressesQueryKey() });
        setIsAddOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Failed to add address", variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteAddress({
    mutation: {
      onSuccess: () => {
        toast({ title: "Address deleted", description: "The address has been removed." });
        queryClient.invalidateQueries({ queryKey: getListAddressesQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to delete address", variant: "destructive" });
      },
    },
  });

  const onSubmit = (data: AddressFormValues) => {
    if (!user) return;
    createMutation.mutate({ data: { ...data, customerId: user.id } });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="animate-in space-y-6 fade-in duration-300">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 text-3xl font-display font-bold tracking-tight text-foreground">Saved Addresses</h1>
          <p className="text-muted-foreground">Manage your frequent pickup and delivery locations.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>Save an address for quick selection during shipment creation.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label (e.g. Main Warehouse)</FormLabel>
                      <FormControl>
                        <Input placeholder="Warehouse A" {...field} className="bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Logistics Way" {...field} className="bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Lagos" {...field} className="bg-secondary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="Lagos State" {...field} className="bg-secondary" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Nigeria" {...field} className="bg-secondary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border bg-secondary/50 p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-primary data-[state=checked]:bg-primary" />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Set as default address</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="border-border">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground">
                    {createMutation.isPending ? "Saving..." : "Save Address"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg bg-secondary" />
          ))}
        </div>
      ) : !addresses?.length ? (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center p-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-medium text-foreground">No addresses saved</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">Save your frequent locations to speed up the delivery request process.</p>
            <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground">
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className="group flex flex-col border-border bg-card transition-colors hover:border-primary/50">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {address.label.toLowerCase().includes("home") ? <Home className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}
                    {address.label}
                  </CardTitle>
                  {address.isDefault && (
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-[10px] font-semibold uppercase text-primary">
                      Default
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={() => handleDelete(address.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div className="mt-2 flex items-start gap-3 text-sm text-muted-foreground">
                  <Map className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-relaxed">
                    {address.street}
                    <br />
                    {address.city}, {address.state}
                    <br />
                    {address.country}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
