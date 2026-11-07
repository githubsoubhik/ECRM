"use client";
// Path: src/app/dashboard/Billing/components/actions.tsx
// Row menus for invoices and subscriptions – permission aware.

import { useCallback } from "react";
import { Ban, Bell, CheckCircle2, Eye, FilePlus2, IndianRupee, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { formatDate, formatINR, invoiceBalance, invoiceStatus, type Invoice, type Subscription } from "../../../../data/billingData";
import { useAccess } from "../../../components/auth/access/useAccess";
import { useBilling, useClientName } from "./BillingStore";
import type { MenuItem } from "./ui";

/** opens the user's email app with a ready reminder */
export function sendReminderEmail(to: string, subject: string, body: string) {
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function useInvoiceMenu() {
  const { actions, openModal, notify, today } = useBilling();
  const { can } = useAccess();
  const client = useClientName();

  return useCallback(
    (inv: Invoice): MenuItem[] => {
      const st = invoiceStatus(inv, today);
      const open = st === "Pending" || st === "Overdue";
      const c = client(inv.clientId);
      return [
        { label: "View / Download", icon: <Eye />, onClick: () => openModal({ kind: "viewInvoice", invoiceId: inv.id }) },
        {
          label: "Record Payment",
          icon: <IndianRupee />,
          hidden: !open || !can("billing.create"),
          onClick: () => openModal({ kind: "payment", invoiceId: inv.id }),
        },
        {
          label: "Mark as Paid",
          icon: <CheckCircle2 />,
          hidden: !open || !can("billing.edit"),
          onClick: () => {
            actions.markPaid(inv);
            notify(`${inv.number} marked as paid`);
          },
        },
        {
          label: "Send Reminder",
          icon: <Bell />,
          hidden: !open,
          onClick: () => {
            sendReminderEmail(
              c?.email ?? "",
              `Payment reminder – ${inv.number}`,
              `Dear ${c?.contactPerson ?? c?.name ?? "Client"},\n\nThis is a friendly reminder that invoice ${inv.number} of ${formatINR(invoiceBalance(inv))} was due on ${formatDate(inv.dueDate)}.\n\nThank you,\nPavion Accounts`,
            );
            notify("Reminder email ready to send");
          },
        },
        { label: "Edit", icon: <Pencil />, hidden: !can("billing.edit") || inv.status === "Cancelled", onClick: () => openModal({ kind: "invoice", invoice: inv }) },
        {
          label: "Cancel Invoice",
          icon: <Ban />,
          hidden: !open || !can("billing.edit"),
          onClick: () => {
            if (!window.confirm(`Cancel ${inv.number}?`)) return;
            actions.cancelInvoice(inv);
            notify(`${inv.number} cancelled`);
          },
        },
        {
          label: "Delete",
          icon: <Trash2 />,
          danger: true,
          hidden: !can("billing.delete"),
          onClick: () => {
            if (!window.confirm(`Delete ${inv.number}? This cannot be undone.`)) return;
            actions.deleteInvoice(inv.id);
            notify(`${inv.number} deleted`);
          },
        },
      ];
    },
    [actions, openModal, notify, can, client, today],
  );
}

export function useSubscriptionMenu() {
  const { actions, openModal, notify } = useBilling();
  const { can } = useAccess();
  const client = useClientName();

  return useCallback(
    (sub: Subscription): MenuItem[] => {
      const c = client(sub.clientId);
      return [
        {
          label: "Renew & Create Invoice",
          icon: <RefreshCw />,
          hidden: !can("billing.create") || sub.status !== "Active",
          onClick: async () => {
            const inv = await actions.renewSubscription(sub);
            notify(`Renewed · ${inv.number} created`);
          },
        },
        {
          label: "Create Custom Invoice",
          icon: <FilePlus2 />,
          hidden: !can("billing.create"),
          onClick: () =>
            openModal({
              kind: "invoice",
              prefill: {
                clientId: sub.clientId,
                subscriptionId: sub.id,
                items: [{ id: "new", serviceId: sub.serviceId, name: sub.packageName, category: sub.category, qty: 1, rate: sub.amount }],
              },
            }),
        },
        {
          label: "Send Renewal Reminder",
          icon: <Bell />,
          hidden: sub.status !== "Active",
          onClick: () => {
            sendReminderEmail(
              c?.email ?? "",
              `Renewal reminder – ${sub.packageName}`,
              `Dear ${c?.contactPerson ?? c?.name ?? "Client"},\n\nYour ${sub.packageName} plan (${formatINR(sub.amount)} / ${sub.cycle.toLowerCase()}) renews on ${formatDate(sub.nextRenewal)}.\n\nThank you,\nPavion Accounts`,
            );
            notify("Reminder email ready to send");
          },
        },
        { label: "Edit Subscription", icon: <Pencil />, hidden: !can("billing.edit"), onClick: () => openModal({ kind: "subscription", subscription: sub }) },
        {
          label: sub.status === "Paused" ? "Resume" : "Pause",
          icon: <Ban />,
          hidden: !can("billing.edit") || sub.status === "Cancelled",
          onClick: () => {
            actions.saveSubscription({ ...sub, status: sub.status === "Paused" ? "Active" : "Paused" });
            notify(sub.status === "Paused" ? "Subscription resumed" : "Subscription paused");
          },
        },
      ];
    },
    [actions, openModal, notify, can, client],
  );
}
