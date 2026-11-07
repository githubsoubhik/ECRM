"use client";
// Path: src/app/dashboard/Billing/components/modals/DocumentModal.tsx
// Create / edit an Invoice or a Quotation (same line-item builder).

import { useState } from "react";
import { FileText, Plus, ReceiptText, Trash2 } from "lucide-react";
import s from "../../Billing.module.css";
import {
  DEFAULT_GST,
  GST_RATES,
  addDays,
  docTotals,
  formatINR,
  invoiceTotal,
  newId,
  nextNumber,
  type Invoice,
  type LineItem,
  type Quotation,
  type QuotationStatus,
} from "../../../../../data/billingData";
import { useBilling } from "../BillingStore";
import { Field, Modal, cx } from "../ui";

type Props =
  | { kind: "invoice"; invoice?: Invoice; prefill?: Partial<Invoice>; onClose: () => void }
  | { kind: "quotation"; quotation?: Quotation; onClose: () => void };

const blankItem = (): LineItem => ({ id: newId("li"), serviceId: null, name: "", category: "Others", qty: 1, rate: 0 });

export default function DocumentModal(props: Props) {
  const { data, today, actions, notify, openModal } = useBilling();
  const isInvoice = props.kind === "invoice";
  const inv = props.kind === "invoice" ? props.invoice : undefined;
  const pre = props.kind === "invoice" ? props.prefill : undefined;
  const qt = props.kind === "quotation" ? props.quotation : undefined;
  const existing = inv ?? qt;

  const [clientId, setClientId] = useState(existing?.clientId ?? pre?.clientId ?? "");
  const [date, setDate] = useState(existing?.date ?? today);
  const [due, setDue] = useState(inv?.dueDate ?? qt?.validUntil ?? addDays(today, 15));
  const [items, setItems] = useState<LineItem[]>(() =>
    (existing?.items ?? pre?.items ?? [blankItem()]).map((i) => ({ ...i, id: i.id === "new" ? newId("li") : i.id })),
  );
  const [taxRate, setTaxRate] = useState(existing?.taxRate ?? pre?.taxRate ?? DEFAULT_GST);
  const [discount, setDiscount] = useState(existing?.discount ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [invStatus, setInvStatus] = useState<"Pending" | "Paid">(inv?.status === "Paid" ? "Paid" : "Pending");
  const [qtStatus, setQtStatus] = useState<QuotationStatus>(qt?.status ?? "Sent");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totals = docTotals({ items, taxRate, discount });
  const [number] = useState(
    () =>
      existing?.number ??
      (isInvoice ? nextNumber("INV", data.invoices.map((i) => i.number), today) : nextNumber("QT", data.quotations.map((q) => q.number), today)),
  );
  const clients = [...data.clients].sort((a, b) => a.name.localeCompare(b.name));

  const clearError = (key: string) => setErrors((e) => (e[key] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const setItem = (id: string, patch: Partial<LineItem>) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    clearError("items");
  };
  const pickService = (id: string, serviceId: string) => {
    const svc = data.services.find((x) => x.id === serviceId);
    if (!svc) return setItem(id, { serviceId: null });
    setItem(id, { serviceId: svc.id, name: svc.name, category: svc.category, rate: svc.price });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!clientId) e.client = "Choose a client";
    if (!date) e.date = "Pick a date";
    if (due && date && due < date) e.due = isInvoice ? "Due date can't be before the invoice date" : "Must be after the quotation date";
    const good = items.filter((i) => i.name.trim() && i.rate > 0 && i.qty > 0);
    if (!good.length) e.items = "Add at least one item with a name and price";
    if (discount > totals.subtotal) e.discount = "Discount is more than the subtotal";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async () => {
    if (!validate()) return;
    const clean = items.filter((i) => i.name.trim() && i.rate > 0 && i.qty > 0).map((i) => ({ ...i, name: i.name.trim() }));
    if (isInvoice) {
      const base: Invoice = {
        id: inv?.id ?? newId("inv"),
        number,
        clientId,
        date,
        dueDate: due || addDays(date, 15),
        items: clean,
        taxRate,
        discount,
        status: inv?.status === "Cancelled" ? "Cancelled" : "Pending",
        paidAmount: inv?.paidAmount ?? 0,
        paidOn: inv?.paidOn ?? null,
        notes: notes.trim(),
        subscriptionId: inv?.subscriptionId ?? pre?.subscriptionId ?? null,
      };
      const total = invoiceTotal(base);
      base.paidAmount = Math.min(base.paidAmount, total);
      if (base.paidAmount >= total && total > 0) base.status = "Paid";
      if (invStatus === "Paid" && base.status !== "Paid") {
        await actions.saveInvoice(base);
        await actions.markPaid(base);
      } else {
        await actions.saveInvoice(base);
      }
      notify(inv ? `${number} updated` : `${number} created`);
    } else {
      const q: Quotation = {
        id: qt?.id ?? newId("qt"),
        number,
        clientId,
        date,
        validUntil: due || addDays(date, 15),
        items: clean,
        taxRate,
        discount,
        status: qtStatus,
        notes: notes.trim(),
      };
      await actions.saveQuotation(q);
      notify(qt ? `${number} updated` : `${number} created`);
    }
    props.onClose();
  };

  const convertToInvoice = () => {
    if (!validate()) return;
    openModal({ kind: "invoice", prefill: { clientId, items, taxRate } });
  };

  return (
    <Modal
      wide
      title={`${existing ? "Edit" : "Create"} ${isInvoice ? "Invoice" : "Quotation"}`}
      subtitle={`${number}${isInvoice ? "" : " · send a price estimate to your client"}`}
      icon={isInvoice ? <ReceiptText /> : <FileText />}
      onClose={props.onClose}
      footer={
        <>
          {!isInvoice && qt && (
            <button type="button" className={s.btnOutline} onClick={convertToInvoice}>
              <ReceiptText /> Convert to Invoice
            </button>
          )}
          <span className={s.footSpacer} />
          <button type="button" className={s.btnOutline} onClick={props.onClose}>
            Cancel
          </button>
          <button type="button" className={s.btnPrimary} onClick={save}>
            {existing ? "Save Changes" : isInvoice ? "Create Invoice" : "Create Quotation"}
          </button>
        </>
      }
    >
      <div className={s.formGrid3}>
        <Field label="Client" required error={errors.client} className={s.span2}>
          <select className={cx(s.input, errors.client && s.invalid)} value={clientId} onChange={(e) => {
              setClientId(e.target.value);
              clearError("client");
            }}>
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={isInvoice ? "Status" : "Quotation Status"}>
          {isInvoice ? (
            <select className={s.input} value={invStatus} onChange={(e) => setInvStatus(e.target.value as "Pending" | "Paid")} disabled={inv?.status === "Cancelled"}>
              <option value="Pending">Pending (awaiting payment)</option>
              <option value="Paid">Paid</option>
            </select>
          ) : (
            <select className={s.input} value={qtStatus} onChange={(e) => setQtStatus(e.target.value as QuotationStatus)}>
              {(["Draft", "Sent", "Accepted", "Rejected"] as QuotationStatus[]).map((st) => (
                <option key={st}>{st}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label={isInvoice ? "Invoice Date" : "Quotation Date"} required error={errors.date}>
          <input type="date" className={cx(s.input, errors.date && s.invalid)} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={isInvoice ? "Due Date" : "Valid Until"} error={errors.due}>
          <input type="date" className={cx(s.input, errors.due && s.invalid)} value={due} min={date} onChange={(e) => {
              setDue(e.target.value);
              clearError("due");
            }} />
        </Field>
        <Field label="GST">
          <select className={s.input} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}>
            {GST_RATES.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "No GST" : `GST ${r}%`}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className={s.itemsBox}>
        <div className={cx(s.itemRow, s.itemHead)}>
          <span>Product / Service</span>
          <span>Description</span>
          <span>Qty</span>
          <span>Rate (₹)</span>
          <span className={s.tRight}>Amount</span>
          <span />
        </div>
        {items.map((it) => (
          <div key={it.id} className={s.itemRow}>
            <select className={s.input} value={it.serviceId ?? ""} onChange={(e) => pickService(it.id, e.target.value)} aria-label="Product or service">
              <option value="">Custom item</option>
              {data.services.map((sv) => (
                <option key={sv.id} value={sv.id}>
                  {sv.name}
                </option>
              ))}
            </select>
            <input className={s.input} value={it.name} placeholder="Item name" onChange={(e) => setItem(it.id, { name: e.target.value })} aria-label="Item name" />
            <input className={s.input} type="number" min={1} value={it.qty} onChange={(e) => setItem(it.id, { qty: Math.max(0, Number(e.target.value)) })} aria-label="Quantity" />
            <input className={s.input} type="number" min={0} step={100} value={it.rate} onChange={(e) => setItem(it.id, { rate: Math.max(0, Number(e.target.value)) })} aria-label="Rate" />
            <span className={cx(s.tRight, s.itemAmount)}>{formatINR(it.qty * it.rate)}</span>
            <button type="button" className={s.iconBtn} onClick={() => setItems((l) => (l.length > 1 ? l.filter((x) => x.id !== it.id) : [blankItem()]))} aria-label="Remove item">
              <Trash2 />
            </button>
          </div>
        ))}
        <button type="button" className={s.addItem} onClick={() => setItems((l) => [...l, blankItem()])}>
          <Plus /> Add item
        </button>
        {errors.items && <span className={s.error}>{errors.items}</span>}
      </div>

      <div className={s.docBottom}>
        <Field label="Notes / Terms">
          <textarea className={cx(s.input, s.textarea)} value={notes} maxLength={500} placeholder="e.g. 50% advance, balance on delivery. Bank: …" onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div className={s.totals}>
          <div>
            <span>Subtotal</span>
            <b>{formatINR(totals.subtotal)}</b>
          </div>
          <div>
            <span>Discount (₹)</span>
            <input
              type="number"
              min={0}
              step={100}
              className={cx(s.input, s.discountInput, errors.discount && s.invalid)}
              value={discount}
              onChange={(e) => {
                setDiscount(Math.max(0, Number(e.target.value)));
                clearError("discount");
              }}
              aria-label="Discount"
            />
          </div>
          <div>
            <span>{taxRate ? `GST (${taxRate}%)` : "GST"}</span>
            <b>{formatINR(totals.tax)}</b>
          </div>
          <div className={s.grand}>
            <span>Total</span>
            <b>{formatINR(totals.total)}</b>
          </div>
          {errors.discount && <span className={s.error}>{errors.discount}</span>}
        </div>
      </div>
    </Modal>
  );
}
