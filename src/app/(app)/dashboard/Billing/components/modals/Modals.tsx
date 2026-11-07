"use client";
// Path: src/app/dashboard/Billing/components/modals/Modals.tsx
// Shows whichever modal is open in the store.

import { useBilling } from "../BillingStore";
import DocumentModal from "./DocumentModal";
import { ClientModal, PaymentModal, ServiceModal, SubscriptionModal } from "./FormModals";
import InvoiceView from "./InvoiceView";

export default function Modals() {
  const { modal, closeModal } = useBilling();
  if (!modal) return null;
  switch (modal.kind) {
    case "invoice":
      return <DocumentModal key={modal.invoice?.id ?? "new-inv"} kind="invoice" invoice={modal.invoice} prefill={modal.prefill} onClose={closeModal} />;
    case "quotation":
      return <DocumentModal key={modal.quotation?.id ?? "new-qt"} kind="quotation" quotation={modal.quotation} onClose={closeModal} />;
    case "client":
      return <ClientModal client={modal.client} onClose={closeModal} />;
    case "service":
      return <ServiceModal service={modal.service} onClose={closeModal} />;
    case "subscription":
      return <SubscriptionModal subscription={modal.subscription} onClose={closeModal} />;
    case "payment":
      return <PaymentModal invoiceId={modal.invoiceId} onClose={closeModal} />;
    case "viewInvoice":
      return <InvoiceView invoiceId={modal.invoiceId} onClose={closeModal} />;
    default:
      return null;
  }
}
