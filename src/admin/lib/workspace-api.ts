import { useMutation, useQuery, type QueryKey } from "@tanstack/react-query";

export type UserRole = "user" | "admin";
export type ShipmentStatus = "pending" | "in_transit" | "delivered" | "cancelled";
export type PackageType = "document" | "parcel" | "fragile" | "oversized";
export type DeliverySpeed = "standard" | "express" | "overnight";
export type InvoiceStatus = "paid" | "pending" | "overdue";
export type PaymentChannel = "card" | "bank_transfer";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "delivery_issue" | "payment" | "tracking" | "general";
export type MessageSender = "customer" | "support";

export interface AppUser {
  id: number;
  role: UserRole;
  name: string;
  company: string;
  email: string;
  phone: string;
  department?: string;
  region?: string;
}

export interface Shipment {
  id: number;
  customerId: number;
  customerName: string;
  trackingNumber: string;
  pickupAddress: string;
  destinationAddress: string;
  recipientName?: string;
  recipientPhone?: string;
  packageType: PackageType;
  weightKg: number;
  dimensionsCm?: string;
  deliverySpeed: DeliverySpeed;
  notes?: string;
  status: ShipmentStatus;
  price: number;
  estimatedDelivery: string;
  createdAt: string;
  scheduledPickup?: string;
}

export interface TrackingEvent {
  id: number;
  shipmentId: number;
  status: ShipmentStatus;
  description: string;
  location: string;
  timestamp: string;
}

export interface Invoice {
  id: number;
  customerId: number;
  invoiceNumber: string;
  shipmentId: number;
  trackingNumber: string;
  amount: number;
  status: InvoiceStatus;
  createdAt: string;
  paidAt?: string;
  receiptNumber?: string;
  receiptEmail?: string;
  paymentProvider?: string;
  paymentChannel?: PaymentChannel;
  paymentReference?: string;
  payerName?: string;
}

export interface ShipmentCreationResult {
  shipment: Shipment;
  invoice: Invoice;
}

export interface Address {
  id: number;
  customerId: number;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault?: boolean;
}

export interface TicketMessage {
  id: number;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  customerId: number;
  customerName: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  shipmentId?: number;
  status: TicketStatus;
  createdAt: string;
  messages: TicketMessage[];
}

export interface DashboardSummary {
  activeShipments: number;
  deliveredShipments: number;
  totalSpent: number;
  totalShipments: number;
}

export interface AdminOverview {
  totalCustomers: number;
  openTickets: number;
  monthlyRevenue: number;
  activeRoutes: number;
}

interface Store {
  users: AppUser[];
  shipments: Shipment[];
  tracking: TrackingEvent[];
  invoices: Invoice[];
  addresses: Address[];
  tickets: Ticket[];
}

const STORAGE_KEY = "xenith-logistics-store";

const initialStore: Store = {
  users: [
    {
      id: 1,
      role: "admin",
      name: "Amina Yusuf",
      company: "Xenith Logistics",
      email: "admin@xenithlogistics.com",
      phone: "+234 800 100 9000",
      department: "Operations Control",
      region: "All Regions",
    },
    {
      id: 101,
      role: "user",
      name: "Chika Okafor",
      company: "Acme Corp Logistics",
      email: "chika@acmecorp.com",
      phone: "+234 803 111 2299",
      region: "Lagos",
    },
    {
      id: 102,
      role: "user",
      name: "Bayo Thomas",
      company: "BlueMarket Retail",
      email: "bayo@bluemarket.ng",
      phone: "+234 806 420 1103",
      region: "Lagos",
    },
  ],
  shipments: [
    {
      id: 101,
      customerId: 101,
      customerName: "Acme Corp Logistics",
      trackingNumber: "XEN-240501",
      pickupAddress: "12 Admiralty Way, Lekki, Lagos, Nigeria",
      destinationAddress: "4 Gana Street, Maitama, Abuja, Nigeria",
      recipientName: "Chika Okafor",
      recipientPhone: "+234 803 111 2299",
      packageType: "fragile",
      weightKg: 18,
      dimensionsCm: "45x30x28",
      deliverySpeed: "express",
      notes: "Handle upright. Fragile electronics inside.",
      status: "in_transit",
      price: 245,
      estimatedDelivery: "2026-05-22T16:00:00.000Z",
      createdAt: "2026-05-19T09:15:00.000Z",
      scheduledPickup: "2026-05-19T08:00:00.000Z",
    },
    {
      id: 102,
      customerId: 102,
      customerName: "BlueMarket Retail",
      trackingNumber: "XEN-240502",
      pickupAddress: "90 Allen Avenue, Ikeja, Lagos, Nigeria",
      destinationAddress: "18 Chief Yesufu Abiodun Way, Oniru, Lagos, Nigeria",
      recipientName: "Bayo Thomas",
      recipientPhone: "+234 806 420 1103",
      packageType: "parcel",
      weightKg: 6.5,
      dimensionsCm: "32x22x18",
      deliverySpeed: "standard",
      notes: "",
      status: "pending",
      price: 86,
      estimatedDelivery: "2026-05-24T18:00:00.000Z",
      createdAt: "2026-05-21T07:30:00.000Z",
      scheduledPickup: "2026-05-21T10:00:00.000Z",
    },
    {
      id: 103,
      customerId: 101,
      customerName: "Acme Corp Logistics",
      trackingNumber: "XEN-240503",
      pickupAddress: "17 Glover Road, Ikoyi, Lagos, Nigeria",
      destinationAddress: "31 Tombia Street, GRA Phase 2, Port Harcourt, Nigeria",
      recipientName: "Ebi West",
      recipientPhone: "+234 809 887 5540",
      packageType: "document",
      weightKg: 1.1,
      dimensionsCm: "28x21x2",
      deliverySpeed: "overnight",
      notes: "Signed delivery required.",
      status: "delivered",
      price: 120,
      estimatedDelivery: "2026-05-20T12:00:00.000Z",
      createdAt: "2026-05-18T14:05:00.000Z",
      scheduledPickup: "2026-05-18T16:00:00.000Z",
    },
  ],
  tracking: [
    {
      id: 3001,
      shipmentId: 101,
      status: "in_transit",
      description: "Shipment departed the Ibadan transfer hub.",
      location: "Ibadan Hub",
      timestamp: "2026-05-21T11:10:00.000Z",
    },
    {
      id: 3002,
      shipmentId: 101,
      status: "in_transit",
      description: "Shipment arrived at the regional transfer hub.",
      location: "Ibadan Hub",
      timestamp: "2026-05-20T19:45:00.000Z",
    },
    {
      id: 3003,
      shipmentId: 101,
      status: "pending",
      description: "Courier picked up the shipment from origin.",
      location: "Lekki, Lagos",
      timestamp: "2026-05-19T09:45:00.000Z",
    },
    {
      id: 3004,
      shipmentId: 102,
      status: "pending",
      description: "Shipment request created and waiting for pickup.",
      location: "Ikeja, Lagos",
      timestamp: "2026-05-21T07:30:00.000Z",
    },
    {
      id: 3005,
      shipmentId: 103,
      status: "delivered",
      description: "Shipment delivered successfully to recipient.",
      location: "Port Harcourt",
      timestamp: "2026-05-20T11:40:00.000Z",
    },
  ],
  invoices: [
    {
      id: 201,
      customerId: 101,
      invoiceNumber: "INV-240501",
      shipmentId: 101,
      trackingNumber: "XEN-240501",
      amount: 245,
      status: "pending",
      createdAt: "2026-05-19T10:00:00.000Z",
    },
    {
      id: 202,
      customerId: 102,
      invoiceNumber: "INV-240502",
      shipmentId: 102,
      trackingNumber: "XEN-240502",
      amount: 86,
      status: "pending",
      createdAt: "2026-05-21T08:00:00.000Z",
    },
    {
      id: 203,
      customerId: 101,
      invoiceNumber: "INV-240503",
      shipmentId: 103,
      trackingNumber: "XEN-240503",
      amount: 120,
      status: "paid",
      createdAt: "2026-05-18T15:00:00.000Z",
      paidAt: "2026-05-19T10:00:00.000Z",
    },
  ],
  addresses: [
    {
      id: 401,
      customerId: 101,
      label: "Main Warehouse",
      street: "12 Admiralty Way",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      isDefault: true,
    },
    {
      id: 402,
      customerId: 101,
      label: "Abuja Branch",
      street: "4 Gana Street, Maitama",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      isDefault: false,
    },
    {
      id: 403,
      customerId: 102,
      label: "Fulfillment Center",
      street: "90 Allen Avenue",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      isDefault: true,
    },
  ],
  tickets: [
    {
      id: 501,
      customerId: 101,
      customerName: "Acme Corp Logistics",
      ticketNumber: "TKT-240501",
      subject: "Need delivery ETA confirmation",
      category: "tracking",
      priority: "medium",
      shipmentId: 101,
      status: "in_progress",
      createdAt: "2026-05-20T12:40:00.000Z",
      messages: [
        {
          id: 7001,
          sender: "support",
          content: "Your shipment is moving as planned. We are confirming the final arrival window with the Abuja team.",
          createdAt: "2026-05-21T09:00:00.000Z",
        },
        {
          id: 7002,
          sender: "customer",
          content: "Can you confirm if delivery is still expected before close of business tomorrow?",
          createdAt: "2026-05-20T12:40:00.000Z",
        },
      ],
    },
    {
      id: 502,
      customerId: 102,
      customerName: "BlueMarket Retail",
      ticketNumber: "TKT-240502",
      subject: "Billing question on overnight rate",
      category: "payment",
      priority: "low",
      status: "open",
      createdAt: "2026-05-19T16:10:00.000Z",
      messages: [
        {
          id: 7003,
          sender: "customer",
          content: "Please help me understand the surcharge applied to the overnight invoice.",
          createdAt: "2026-05-19T16:10:00.000Z",
        },
      ],
    },
  ],
};

function cloneStore(store: Store): Store {
  return JSON.parse(JSON.stringify(store)) as Store;
}

function isValidStore(store: unknown): store is Store {
  if (!store || typeof store !== "object") return false;

  const candidate = store as Partial<Store>;
  return (
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.shipments) &&
    Array.isArray(candidate.tracking) &&
    Array.isArray(candidate.invoices) &&
    Array.isArray(candidate.addresses) &&
    Array.isArray(candidate.tickets)
  );
}

function getStore(): Store {
  if (typeof window === "undefined") {
    return cloneStore(initialStore);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = cloneStore(initialStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isValidStore(parsed)) {
      return parsed;
    }

    const seeded = cloneStore(initialStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  } catch {
    const seeded = cloneStore(initialStore);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveStore(store: Store) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

function nextId(items: Array<{ id: number }>) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function generateTrackingNumber(id: number) {
  return `XEN-${String(240500 + id).slice(-6)}`;
}

function generateInvoiceNumber(id: number) {
  return `INV-${String(240500 + id).slice(-6)}`;
}

function generateTicketNumber(id: number) {
  return `TKT-${String(240500 + id).slice(-6)}`;
}

function estimatePrice(weightKg: number, deliverySpeed: DeliverySpeed) {
  const base = 55 + weightKg * 8;
  const multiplier = deliverySpeed === "overnight" ? 1.65 : deliverySpeed === "express" ? 1.3 : 1;
  return Math.round(base * multiplier);
}

function estimateDelivery(speed: DeliverySpeed) {
  const now = new Date();
  const daysToAdd = speed === "overnight" ? 1 : speed === "express" ? 2 : 4;
  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString();
}

function ensureCustomer(customerId?: number) {
  const store = getStore();
  const customer = store.users.find((user) => user.id === customerId && user.role === "user");
  if (!customer) {
    throw new Error("Customer not found");
  }
  return customer;
}

function filterByCustomer<T extends { customerId: number }>(items: T[], customerId?: number) {
  return customerId ? items.filter((item) => item.customerId === customerId) : items;
}

function computeSummary(customerId?: number): DashboardSummary {
  const store = getStore();
  const scopedShipments = filterByCustomer(store.shipments, customerId);
  const scopedInvoices = filterByCustomer(store.invoices, customerId);

  return {
    activeShipments: scopedShipments.filter((shipment) => shipment.status === "in_transit").length,
    deliveredShipments: scopedShipments.filter((shipment) => shipment.status === "delivered").length,
    totalSpent: scopedInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    totalShipments: scopedShipments.length,
  };
}

function computeAdminOverview(): AdminOverview {
  const store = getStore();
  return {
    totalCustomers: store.users.filter((user) => user.role === "user").length,
    openTickets: store.tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress").length,
    monthlyRevenue: store.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    activeRoutes: store.shipments.filter((shipment) => shipment.status === "in_transit" || shipment.status === "pending").length,
  };
}

type QueryOptions = {
  query?: {
    enabled?: boolean;
    queryKey?: QueryKey;
  };
};

type MutationConfig<TData, TVariables> = {
  mutation?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  };
};

export function getListShipmentsQueryKey() {
  return ["shipments"];
}

export function getGetShipmentQueryKey(id: number) {
  return ["shipments", id];
}

export function getGetDashboardSummaryQueryKey() {
  return ["dashboard-summary"];
}

export function getGetInvoiceQueryKey(id: number) {
  return ["invoices", id];
}

export function getListInvoicesQueryKey() {
  return ["invoices"];
}

export function getListAddressesQueryKey() {
  return ["addresses"];
}

export function getListTicketsQueryKey() {
  return ["tickets"];
}

export function getGetTicketQueryKey(id: number) {
  return ["tickets", id];
}

export function useListUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getStore().users,
  });
}

export function useGetDashboardSummary(filters?: { customerId?: number }) {
  return useQuery({
    queryKey: [...getGetDashboardSummaryQueryKey(), filters?.customerId ?? "all"],
    queryFn: () => computeSummary(filters?.customerId),
  });
}

export function useGetAdminOverview() {
  return useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => computeAdminOverview(),
  });
}

export function useListShipments(filters?: { status?: ShipmentStatus; customerId?: number }) {
  return useQuery({
    queryKey: [...getListShipmentsQueryKey(), filters?.status ?? "all", filters?.customerId ?? "all"],
    queryFn: () => {
      const shipments = filterByCustomer(getStore().shipments, filters?.customerId);
      return filters?.status ? shipments.filter((shipment) => shipment.status === filters.status) : shipments;
    },
  });
}

export function useGetShipment(id: number, options?: QueryOptions) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetShipmentQueryKey(id),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => getStore().shipments.find((shipment) => shipment.id === id),
  });
}

export function useGetShipmentTracking(id: number, options?: QueryOptions) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? ["shipment-tracking", id],
    enabled: options?.query?.enabled ?? true,
    queryFn: () =>
      getStore()
        .tracking.filter((event) => event.shipmentId === id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  });
}

export function useCancelShipment(options?: MutationConfig<Shipment, { id: number }>) {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const store = getStore();
      const shipment = store.shipments.find((entry) => entry.id === id);
      if (!shipment) {
        throw new Error("Shipment not found");
      }

      shipment.status = "cancelled";
      store.tracking.unshift({
        id: nextId(store.tracking),
        shipmentId: id,
        status: "cancelled",
        description: "Shipment was cancelled by the account owner.",
        location: shipment.pickupAddress.split(",")[0] ?? "Operations",
        timestamp: new Date().toISOString(),
      });
      saveStore(store);
      return shipment;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useUpdateShipmentStatus(options?: MutationConfig<Shipment, { id: number; status: ShipmentStatus }>) {
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ShipmentStatus }) => {
      const store = getStore();
      const shipment = store.shipments.find((entry) => entry.id === id);
      if (!shipment) {
        throw new Error("Shipment not found");
      }

      shipment.status = status;
      store.tracking.unshift({
        id: nextId(store.tracking),
        shipmentId: id,
        status,
        description: `Shipment status updated to ${status.replace(/_/g, " ")} by operations.`,
        location: shipment.destinationAddress.split(",")[0] ?? "Operations",
        timestamp: new Date().toISOString(),
      });
      saveStore(store);
      return shipment;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useCreateShipment(
  options?: MutationConfig<
    ShipmentCreationResult,
    {
      data: Omit<
        Shipment,
        "id" | "trackingNumber" | "status" | "price" | "estimatedDelivery" | "createdAt" | "customerName"
      >;
    }
  >,
) {
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: Omit<
        Shipment,
        "id" | "trackingNumber" | "status" | "price" | "estimatedDelivery" | "createdAt" | "customerName"
      >;
    }) => {
      const store = getStore();
      const customer = ensureCustomer(data.customerId);
      const id = nextId(store.shipments);
      const createdAt = new Date().toISOString();
      const shipment: Shipment = {
        id,
        customerName: customer.company,
        trackingNumber: generateTrackingNumber(id),
        status: "pending",
        price: estimatePrice(data.weightKg, data.deliverySpeed),
        estimatedDelivery: estimateDelivery(data.deliverySpeed),
        createdAt,
        ...data,
      };

      store.shipments.unshift(shipment);
      store.tracking.unshift({
        id: nextId(store.tracking),
        shipmentId: id,
        status: "pending",
        description: "Shipment request created and waiting for pickup.",
        location: shipment.pickupAddress.split(",")[0] ?? "Origin",
        timestamp: createdAt,
      });

      const invoice: Invoice = {
        id: nextId(store.invoices),
        customerId: shipment.customerId,
        invoiceNumber: generateInvoiceNumber(id),
        shipmentId: id,
        trackingNumber: shipment.trackingNumber,
        amount: shipment.price,
        status: "pending",
        createdAt,
      };

      store.invoices.unshift(invoice);

      saveStore(store);
      return { shipment, invoice };
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useListInvoices(filters?: { customerId?: number }) {
  return useQuery({
    queryKey: ["invoices", filters?.customerId ?? "all"],
    queryFn: () => filterByCustomer(getStore().invoices, filters?.customerId),
  });
}

export function useGetInvoice(id: number, options?: QueryOptions) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetInvoiceQueryKey(id),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => getStore().invoices.find((invoice) => invoice.id === id),
  });
}

export function usePayInvoice(
  options?: MutationConfig<
    Invoice,
    { id: number; data: { payerName: string; receiptEmail: string; paymentChannel: PaymentChannel } }
  >,
) {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { payerName: string; receiptEmail: string; paymentChannel: PaymentChannel };
    }) => {
      const store = getStore();
      const invoice = store.invoices.find((entry) => entry.id === id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const relatedShipment = store.shipments.find((entry) => entry.id === invoice.shipmentId);
      const paidAt = new Date().toISOString();
      const suffix = Date.now().toString().slice(-8);

      invoice.status = "paid";
      invoice.paidAt = paidAt;
      invoice.paymentProvider = "Paystack Test";
      invoice.paymentChannel = data.paymentChannel;
      invoice.paymentReference = `PSTK-TEST-${suffix}`;
      invoice.receiptNumber = `RCT-${invoice.id}-${suffix}`;
      invoice.receiptEmail = data.receiptEmail;
      invoice.payerName = data.payerName;

      if (relatedShipment) {
        store.tracking.unshift({
          id: nextId(store.tracking),
          shipmentId: relatedShipment.id,
          status: relatedShipment.status,
          description: "Payment confirmed via Paystack test and dispatch booking is now active.",
          location: relatedShipment.pickupAddress.split(",")[0] ?? "Origin",
          timestamp: paidAt,
        });
      }

      saveStore(store);
      return invoice;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useListAddresses(filters?: { customerId?: number }) {
  return useQuery({
    queryKey: [...getListAddressesQueryKey(), filters?.customerId ?? "all"],
    queryFn: () => filterByCustomer(getStore().addresses, filters?.customerId),
  });
}

export function useCreateAddress(options?: MutationConfig<Address, { data: Omit<Address, "id"> }>) {
  return useMutation({
    mutationFn: async ({ data }: { data: Omit<Address, "id"> }) => {
      const store = getStore();
      ensureCustomer(data.customerId);
      const address: Address = {
        id: nextId(store.addresses),
        ...data,
      };

      if (address.isDefault) {
        store.addresses.forEach((entry) => {
          if (entry.customerId === address.customerId) {
            entry.isDefault = false;
          }
        });
      }

      store.addresses.unshift(address);
      saveStore(store);
      return address;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useDeleteAddress(options?: MutationConfig<Address | undefined, { id: number }>) {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const store = getStore();
      const index = store.addresses.findIndex((address) => address.id === id);
      if (index === -1) {
        throw new Error("Address not found");
      }

      const [removed] = store.addresses.splice(index, 1);
      if (removed?.isDefault) {
        const replacement = store.addresses.find((address) => address.customerId === removed.customerId);
        if (replacement) {
          replacement.isDefault = true;
        }
      }
      saveStore(store);
      return removed;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useListTickets(filters?: { customerId?: number }) {
  return useQuery({
    queryKey: [...getListTicketsQueryKey(), filters?.customerId ?? "all"],
    queryFn: () => filterByCustomer(getStore().tickets, filters?.customerId),
  });
}

export function useGetTicket(id: number, options?: QueryOptions) {
  return useQuery({
    queryKey: options?.query?.queryKey ?? getGetTicketQueryKey(id),
    enabled: options?.query?.enabled ?? true,
    queryFn: () => getStore().tickets.find((ticket) => ticket.id === id),
  });
}

export function useReplyToTicket(options?: MutationConfig<Ticket, { id: number; data: { content: string; sender?: MessageSender } }>) {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { content: string; sender?: MessageSender } }) => {
      const store = getStore();
      const ticket = store.tickets.find((entry) => entry.id === id);
      if (!ticket) {
        throw new Error("Ticket not found");
      }

      ticket.messages.unshift({
        id: ticket.messages.reduce((max, message) => Math.max(max, message.id), 0) + 1,
        sender: data.sender ?? "customer",
        content: data.content,
        createdAt: new Date().toISOString(),
      });
      if (data.sender === "support") {
        ticket.status = "resolved";
      } else if (ticket.status === "open") {
        ticket.status = "in_progress";
      }
      saveStore(store);
      return ticket;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useUpdateTicketStatus(options?: MutationConfig<Ticket, { id: number; status: TicketStatus }>) {
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TicketStatus }) => {
      const store = getStore();
      const ticket = store.tickets.find((entry) => entry.id === id);
      if (!ticket) {
        throw new Error("Ticket not found");
      }

      ticket.status = status;
      saveStore(store);
      return ticket;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}

export function useCreateTicket(
  options?: MutationConfig<
    Ticket,
    { data: Omit<Ticket, "id" | "ticketNumber" | "status" | "createdAt" | "messages" | "customerName"> & { message: string } }
  >,
) {
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: Omit<Ticket, "id" | "ticketNumber" | "status" | "createdAt" | "messages" | "customerName"> & { message: string };
    }) => {
      const store = getStore();
      const customer = ensureCustomer(data.customerId);
      const id = nextId(store.tickets);
      const createdAt = new Date().toISOString();
      const ticket: Ticket = {
        id,
        customerName: customer.company,
        ticketNumber: generateTicketNumber(id),
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        shipmentId: data.shipmentId,
        customerId: data.customerId,
        status: "open",
        createdAt,
        messages: [
          {
            id: 1,
            sender: "customer",
            content: data.message,
            createdAt,
          },
        ],
      };

      store.tickets.unshift(ticket);
      saveStore(store);
      return ticket;
    },
    onSuccess: options?.mutation?.onSuccess,
    onError: (error, variables) => options?.mutation?.onError?.(error as Error, variables),
  });
}
