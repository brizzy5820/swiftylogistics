import { useEffect, useMemo, useState } from "react";
import type { Invoice, Shipment, Ticket, UserRole } from "@/lib/workspace-api";

export interface AppNotification {
  id: string;
  href: string;
  title: string;
  description: string;
  createdAt: string;
  tone: "info" | "success" | "warning";
}

function getNotificationStorageKey(userId: number, role: UserRole) {
  return `xenith-notifications-read-${role}-${userId}`;
}

function timeValue(value?: string) {
  return value ? new Date(value).getTime() : 0;
}

export function useNotifications({
  userId,
  role,
  shipments,
  invoices,
  tickets,
}: {
  userId: number;
  role: UserRole;
  shipments: Shipment[];
  invoices: Invoice[];
  tickets: Ticket[];
}) {
  const notifications = useMemo<AppNotification[]>(() => {
    const shipmentItems = shipments.map((shipment) => ({
      id: `shipment-${shipment.id}-${shipment.createdAt}`,
      href: `/shipments/${shipment.id}`,
      title:
        shipment.status === "delivered"
          ? `Shipment ${shipment.trackingNumber} delivered`
          : shipment.status === "in_transit"
            ? `Shipment ${shipment.trackingNumber} is moving`
            : shipment.status === "cancelled"
              ? `Shipment ${shipment.trackingNumber} cancelled`
              : `Shipment ${shipment.trackingNumber} created`,
      description:
        shipment.status === "pending"
          ? "Your booking is waiting for pickup scheduling."
          : shipment.status === "in_transit"
            ? "Operations has the delivery in motion."
            : shipment.status === "delivered"
              ? "The package has reached its destination."
              : "This booking is no longer active.",
      createdAt: shipment.createdAt,
      tone:
        shipment.status === "delivered"
          ? "success"
          : shipment.status === "cancelled"
            ? "warning"
            : "info",
    }));

    const invoiceItems = invoices.map((invoice) => ({
      id: `invoice-${invoice.id}-${invoice.paidAt ?? invoice.createdAt}`,
      href: `/invoices/${invoice.id}`,
      title:
        invoice.status === "paid"
          ? `Invoice ${invoice.invoiceNumber} paid`
          : `Invoice ${invoice.invoiceNumber} awaiting payment`,
      description:
        invoice.status === "paid"
          ? `Receipt ${invoice.receiptNumber ?? "generated"} is ready.`
          : `Tracking ${invoice.trackingNumber} has an open balance of $${invoice.amount.toFixed(2)}.`,
      createdAt: invoice.paidAt ?? invoice.createdAt,
      tone: invoice.status === "paid" ? "success" : "warning",
    }));

    const ticketItems = tickets.map((ticket) => {
      const latestMessage = [...ticket.messages].sort(
        (a, b) => timeValue(b.createdAt) - timeValue(a.createdAt),
      )[0];
      const hasSupportReply = latestMessage?.sender === "support";

      return {
        id: `ticket-${ticket.id}-${latestMessage?.id ?? ticket.id}`,
        href: `/tickets/${ticket.id}`,
        title: hasSupportReply
          ? `Support replied to ${ticket.ticketNumber}`
          : `Ticket ${ticket.ticketNumber} is ${ticket.status.replace(/_/g, " ")}`,
        description: hasSupportReply
          ? latestMessage.content
          : ticket.subject,
        createdAt: latestMessage?.createdAt ?? ticket.createdAt,
        tone: hasSupportReply || ticket.status === "resolved" ? "success" : "info",
      } satisfies AppNotification;
    });

    return [...shipmentItems, ...invoiceItems, ...ticketItems]
      .sort((a, b) => timeValue(b.createdAt) - timeValue(a.createdAt))
      .slice(0, 12);
  }, [invoices, shipments, tickets]);

  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(getNotificationStorageKey(userId, role));
    if (!raw) {
      setReadIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      setReadIds(Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : []);
    } catch {
      setReadIds([]);
    }
  }, [role, userId]);

  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;

  const markAllRead = () => {
    const ids = notifications.map((item) => item.id);
    setReadIds(ids);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(getNotificationStorageKey(userId, role), JSON.stringify(ids));
    }
  };

  return {
    notifications,
    unreadCount,
    markAllRead,
  };
}
