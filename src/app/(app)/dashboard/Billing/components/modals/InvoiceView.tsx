"use client";
// Path: src/app/dashboard/Billing/components/modals/InvoiceView.tsx
// Printable invoice – "Print / Save PDF" uses the browser's print dialog.

import { IndianRupee, Pencil, Printer, ReceiptText } from "lucide-react";
import s from "../../Billing.module.css";
import { COMPANY, docTotals, formatDate, formatINR, invoiceBalance, invoiceStatus } from "../../../../../data/billingData";
import { useAccess } from "../../../../components/auth/access/useAccess";
import { useBilling } from "../BillingStore";
import { Modal, StatusPill } from "../ui";

export default function InvoiceView({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const { data, today, openModal } = useBilling();
  const { can } = useAccess();
  const inv = data.invoices.find((i) => i.id === invoiceId);
  if (!inv) return null;
  const c = data.clients.find((x) => x.id === inv.clientId);
  const t = docTotals(inv);
  const st = invoiceStatus(inv, today);
  const balance = invoiceBalance(inv);
  const payments = data.payments.filter((p) => p.invoiceId === inv.id);

  return (
    <Modal
      wide
      title={inv.number}
      subtitle={`Issued ${formatDate(inv.date)} · due ${formatDate(inv.dueDate)}`}
      icon={<ReceiptText />}
      onClose={onClose}
      footer={
        <>
          {can("billing.edit") && inv.status !== "Cancelled" && (
            <button type="button" className={s.btnOutline} onClick={() => openModal({ kind: "invoice", invoice: inv })}>
              <Pencil /> Edit
            </button>
          )}
          <span className={s.footSpacer} />
          {can("billing.create") && balance > 0 && (
            <button type="button" className={s.btnOutline} onClick={() => openModal({ kind: "payment", invoiceId: inv.id })}>
              <IndianRupee /> Record Payment
            </button>
          )}
          <button type="button" className={s.btnPrimary} onClick={() => window.print()}>
            <Printer /> Print / Save PDF
          </button>
        </>
      }
    >
      <article className={s.printArea}>
        <div className={s.docHead}>
          <div>
            <h3>{COMPANY.name}</h3>
            <p>{COMPANY.address}</p>
            <p>
              {COMPANY.email} · {COMPANY.phone}
            </p>
            {COMPANY.gstin && <p>GSTIN: {COMPANY.gstin}</p>}
          </div>
          <div className={s.docMeta}>
            <h2>INVOICE</h2>
            <p>{inv.number}</p>
            <StatusPill status={st} />
          </div>
        </div>

        <div className={s.docParties}>
          <div>
            <small>Bill to</small>
            <strong>{c?.name ?? "Unknown client"}</strong>
            {c?.contactPerson && <span>{c.contactPerson}</span>}
            {c?.city && <span>{c.city}</span>}
            {c?.email && <span>{c.email}</span>}
            {c?.gstin && <span>GSTIN: {c.gstin}</span>}
          </div>
          <div>
            <small>Invoice date</small>
            <strong>{formatDate(inv.date)}</strong>
            <small>Due date</small>
            <strong>{formatDate(inv.dueDate)}</strong>
          </div>
        </div>

        <table className={s.docTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={it.id}>
                <td>{i + 1}</td>
                <td>
                  {it.name}
                  <small>{it.category}</small>
                </td>
                <td>{it.qty}</td>
                <td>{formatINR(it.rate)}</td>
                <td>{formatINR(it.qty * it.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={s.docSum}>
          <div>
            <span>Subtotal</span>
            <b>{formatINR(t.subtotal)}</b>
          </div>
          {inv.discount > 0 && (
            <div>
              <span>Discount</span>
              <b>− {formatINR(inv.discount)}</b>
            </div>
          )}
          {inv.taxRate > 0 && (
            <>
              <div>
                <span>CGST ({inv.taxRate / 2}%)</span>
                <b>{formatINR(t.tax / 2)}</b>
              </div>
              <div>
                <span>SGST ({inv.taxRate / 2}%)</span>
                <b>{formatINR(t.tax - t.tax / 2)}</b>
              </div>
            </>
          )}
          <div className={s.grand}>
            <span>Total</span>
            <b>{formatINR(t.total)}</b>
          </div>
          {inv.paidAmount > 0 && (
            <div>
              <span>Paid</span>
              <b className={s.tGreen}>{formatINR(inv.paidAmount)}</b>
            </div>
          )}
          {inv.status !== "Cancelled" && (
            <div>
              <span>Balance due</span>
              <b className={balance ? s.tDanger : s.tGreen}>{formatINR(balance)}</b>
            </div>
          )}
        </div>

        {payments.length > 0 && (
          <div className={s.docPayments}>
            <small>Payments received</small>
            {payments.map((p) => (
              <span key={p.id}>
                {formatDate(p.date)} · {p.method} {p.reference && `· ${p.reference}`} · <b>{formatINR(p.amount)}</b>
              </span>
            ))}
          </div>
        )}
        {inv.notes && <p className={s.docNotes}>{inv.notes}</p>}
      </article>
    </Modal>
  );
}
