import { useMemo } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { toDateKey } from "@/lib/domain";
import { renderTemplate } from "@/lib/messages";
import type { OrderDTO } from "@/services/order.service";
import type { CustomerDTO } from "@/services/customer.service";
import type { MessageTemplateDTO } from "@/services/message-template.service";

interface UseDashboardActionsProps {
  orders: OrderDTO[];
  customers: CustomerDTO[];
  selectedDate: string;
  business: { id: string; name: string; slug: string };
  messageTemplates: MessageTemplateDTO[];
}

export type ActionItemType = "order" | "customer";

export interface ActionItem {
  type: ActionItemType;
  id: string;
  title: string;
  reason: string;
  status: string;
  due: string;
  phone: string;
  message: string;
}

export function useDashboardActions({
  orders,
  customers,
  selectedDate,
  business,
  messageTemplates,
}: UseDashboardActionsProps) {
  return useMemo(() => {
    function getMessageFromTemplate(
      category: string,
      customValues: Record<string, string>,
      defaultText: string
    ) {
      const template =
        messageTemplates.find(
          (item) => item.category === category && item.businessId === business.id
        ) ?? messageTemplates.find((item) => item.category === category);

      if (!template) return defaultText;

      const values = { business_name: business.name, ...customValues };
      return renderTemplate(template.content, values) || defaultText;
    }

    const unpaidItems = orders
      .filter(
        (order) =>
          (order.scheduledDate === selectedDate ||
            (!order.scheduledDate &&
              toDateKey(new Date(order.createdAt)) === selectedDate)) &&
          order.paymentStatus !== "PAID" &&
          order.status !== "BATAL"
      )
      .map((order): ActionItem => {
        const isWaitingDp = order.status === "WAITING_DP";
        const message = getMessageFromTemplate(
          "PEMBAYARAN",
          {
            customer_name: order.customerName,
            order_title: order.title,
            dp_amount: order.dpAmount ? formatCurrency(order.dpAmount) : "0",
            total_amount: order.totalAmount ? formatCurrency(order.totalAmount) : "0",
          },
          isWaitingDp
            ? `Halo ${order.customerName}, mau ingatkan untuk DP ${order.title} sebesar ${formatCurrency(order.dpAmount ?? 0)} ya.`
            : `Halo ${order.customerName}, mau ingatkan untuk pelunasan ${order.title} sebesar ${formatCurrency(order.totalAmount ?? 0)} ya.`
        );
        return {
          type: "order",
          id: order.id,
          title: order.customerName,
          reason: isWaitingDp ? "Menunggu DP (Booking)" : "Tagihan belum lunas",
          status: order.status,
          due: order.scheduledDate
            ? `${formatDate(order.scheduledDate)}${order.scheduledTime ? ` · ${order.scheduledTime}` : ""}`
            : formatDateTime(order.createdAt),
          phone: order.whatsappNumber,
          message,
        };
      });

    const staleItems = customers
      .filter((customer) => {
        if (customer.status !== "NEED_FOLLOW_UP" && customer.status !== "NEW") return false;
        const lastDateStr = customer.lastInteractionAt ?? customer.createdAt;
        const staleDate = new Date(new Date(lastDateStr).getTime() + 24 * 60 * 60 * 1000);
        return toDateKey(staleDate) === selectedDate;
      })
      .map((customer): ActionItem => ({
        type: "customer",
        id: customer.id,
        title: customer.name,
        reason: "Calon customer didiamkan > 24 jam",
        status: customer.status,
        due: customer.lastInteractionAt
          ? formatDateTime(customer.lastInteractionAt)
          : formatDateTime(customer.createdAt),
        phone: customer.whatsappNumber,
        message: getMessageFromTemplate(
          "FOLLOW_UP",
          {
            customer_name: customer.name,
            order_title: customer.lastOrderSummary || "order",
          },
          `Halo ${customer.name}, saya follow-up lagi ya untuk rencana ${customer.lastOrderSummary || "order"}.`
        ),
      }));

    const reviewItems = orders
      .filter((order) => {
        if (order.status !== "SELESAI") return false;
        const askDate = new Date(new Date(order.updatedAt || order.createdAt).getTime() + 24 * 60 * 60 * 1000);
        return toDateKey(askDate) === selectedDate;
      })
      .map((order): ActionItem => ({
        type: "order",
        id: order.id,
        title: order.customerName,
        reason: "Minta ulasan (Order selesai)",
        status: order.status,
        due: formatDateTime(order.updatedAt || order.createdAt),
        phone: order.whatsappNumber,
        message: getMessageFromTemplate(
          "REVIEW",
          { customer_name: order.customerName, order_title: order.title },
          `Terima kasih ya ${order.customerName}, order ${order.title} sudah selesai. Jika berkenan, mohon ulasannya ya!`
        ),
      }));

    const items: ActionItem[] = [];
    items.push(...unpaidItems);
    items.push(...staleItems);
    items.push(...reviewItems);
    return items.slice(0, 6);
  }, [orders, customers, selectedDate, business, messageTemplates]);
}
