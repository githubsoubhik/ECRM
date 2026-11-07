  "use client";
// Path: src/app/dashboard/Billing/components/modals/FormModals.tsx
// Add Client · Add Product/Service · Subscription · Record Payment

import { useState } from "react";
import { PackagePlus, Repeat, UserPlus, Wallet } from "lucide-react";
import s from "../../Billing.module.css";
import {
  BILLING_CYCLES,
  PAYMENT_METHODS,
  SERVICE_CATEGORIES,
  addMonths,
  cycleMonths,
  formatINR,
  invoiceBalance,
  invoiceStatus,
  newId,
  type BillingClient,
  type BillingCycle,
  type PaymentMethod,
  type Service,
  type ServiceCategory,
  type Subscription,
  type SubscriptionStatus,
} from "../../../../../data/billingData";
import { useBilling } from "../BillingStore";
import { Field, Modal, cx } from "../ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

function Footer({ onClose, onSave, label }: { onClose: () => void; onSave: () => void; label: string }) {
  return (
    <>
      <span className={s.footSpacer} />
      <button type="button" className={s.btnOutline} onClick={onClose}>
        Cancel
      </button>
      <button type="button" className={s.btnPrimary} onClick={onSave}>
        {label}
      </button>
    </>
  );
}

/* ── Client ── */
export function ClientModal({ client, onClose }: { client?: BillingClient; onClose: () => void }) {
  const { data, today, actions, notify } = useBilling();
  const [f, setF] = useState({
    name: client?.name ?? "",
    contactPerson: client?.contactPerson ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    city: client?.city ?? "Kolkata",
    gstin: client?.gstin ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    const name = f.name.trim();
    if (!name) e.name = "Client / business name is required";
    else if (data.clients.some((c) => c.id !== client?.id && c.name.toLowerCase() === name.toLowerCase())) e.name = "A client with this name already exists";
    if (f.email && !EMAIL.test(f.email.trim())) e.email = "Enter a valid email";
    if (f.phone && f.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone number";
    if (f.gstin && !GSTIN.test(f.gstin.trim().toUpperCase())) e.gstin = "GSTIN should look like 19ABCDE1234F1Z5";
    setErrors(e);
    if (Object.keys(e).length) return;
    actions.saveClient({
      id: client?.id ?? newId("cl"),
      name,
      contactPerson: f.contactPerson.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      city: f.city.trim(),
      gstin: f.gstin.trim().toUpperCase(),
      logo: client?.logo ?? null,
      createdAt: client?.createdAt ?? today,
    });
    notify(client ? "Client updated" : `${name} added`);
    onClose();
  };

  return (
    <Modal title={client ? "Edit Client" : "Add Client"} subtitle="Billing details used on quotations and invoices" icon={<UserPlus />} onClose={onClose} footer={<Footer onClose={onClose} onSave={save} label={client ? "Save Changes" : "Add Client"} />}>
      <div className={s.formGrid2}>
        <Field label="Client / Business Name" required error={errors.name} className={s.spanAll}>
          <input className={cx(s.input, errors.name && s.invalid)} value={f.name} autoFocus maxLength={80} placeholder="e.g. Pure Ayus" onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Contact Person">
          <input className={s.input} value={f.contactPerson} maxLength={60} onChange={(e) => set("contactPerson", e.target.value)} />
        </Field>
        <Field label="City">
          <input className={s.input} value={f.city} maxLength={40} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className={cx(s.input, errors.email && s.invalid)} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input className={cx(s.input, errors.phone && s.invalid)} type="tel" value={f.phone} placeholder="+91" onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="GSTIN (optional)" error={errors.gstin} className={s.spanAll}>
          <input className={cx(s.input, errors.gstin && s.invalid)} value={f.gstin} maxLength={15} placeholder="19ABCDE1234F1Z5" onChange={(e) => set("gstin", e.target.value.toUpperCase())} />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Product / Service ── */
export function ServiceModal({ service, onClose }: { service?: Service; onClose: () => void }) {
  const { actions, notify } = useBilling();
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory>(service?.category ?? "Social Media Management");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [cycle, setCycle] = useState<BillingCycle>(service?.cycle ?? "Monthly");
  const [description, setDescription] = useState(service?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!(Number(price) > 0)) e.price = "Enter a price above 0";
    setErrors(e);
    if (Object.keys(e).length) return;
    actions.saveService({ id: service?.id ?? newId("sv"), name: name.trim(), category, price: Number(price), cycle, description: description.trim() });
    notify(service ? "Service updated" : `${name.trim()} added`);
    onClose();
  };

  return (
    <Modal title={service ? "Edit Product / Service" : "Add Product / Service"} subtitle="Appears in quotations, invoices and subscriptions" icon={<PackagePlus />} onClose={onClose} footer={<Footer onClose={onClose} onSave={save} label={service ? "Save Changes" : "Add Service"} />}>
      <div className={s.formGrid2}>
        <Field label="Name" required error={errors.name} className={s.spanAll}>
          <input className={cx(s.input, errors.name && s.invalid)} value={name} autoFocus maxLength={80} placeholder="e.g. Gold Package" onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Category">
          <select className={s.input} value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)}>
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Billing">
          <select className={s.input} value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}>
            {BILLING_CYCLES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Price (₹)" required error={errors.price} className={s.spanAll}>
          <input className={cx(s.input, errors.price && s.invalid)} type="number" min={0} step={100} value={price} placeholder="15000" onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Description" className={s.spanAll}>
          <textarea className={cx(s.input, s.textarea)} value={description} maxLength={300} placeholder="What's included" onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Subscription ── */
export function SubscriptionModal({ subscription, onClose }: { subscription?: Subscription; onClose: () => void }) {
  const { data, today, actions, notify } = useBilling();
  const recurring = data.services.filter((x) => x.cycle !== "One-time");
  const [clientId, setClientId] = useState(subscription?.clientId ?? "");
  const [serviceId, setServiceId] = useState(subscription?.serviceId ?? recurring[0]?.id ?? "");
  const [packageName, setPackageName] = useState(subscription?.packageName ?? recurring[0]?.name ?? "");
  const [amount, setAmount] = useState(String(subscription?.amount ?? recurring[0]?.price ?? ""));
  const [cycle, setCycle] = useState<Subscription["cycle"]>(subscription?.cycle ?? "Monthly");
  const [startDate, setStartDate] = useState(subscription?.startDate ?? today);
  const [nextRenewal, setNextRenewal] = useState(subscription?.nextRenewal ?? addMonths(today, 1));
  const [status, setStatus] = useState<SubscriptionStatus>(subscription?.status ?? "Active");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickService = (id: string) => {
    setServiceId(id);
    const svc = data.services.find((x) => x.id === id);
    if (!svc) return;
    setPackageName(svc.name);
    setAmount(String(svc.price));
    if (svc.cycle !== "One-time") {
      setCycle(svc.cycle);
      setNextRenewal(addMonths(startDate, cycleMonths(svc.cycle)));
    }
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!clientId) e.client = "Choose a client";
    if (!packageName.trim()) e.pkg = "Package name is required";
    if (!(Number(amount) > 0)) e.amount = "Enter an amount";
    if (nextRenewal < startDate) e.renewal = "Renewal must be after the start date";
    setErrors(e);
    if (Object.keys(e).length) return;
    const svc = data.services.find((x) => x.id === serviceId);
    actions.saveSubscription({
      id: subscription?.id ?? newId("sub"),
      clientId,
      serviceId: svc?.id ?? null,
      packageName: packageName.trim(),
      category: svc?.category ?? subscription?.category ?? "Others",
      amount: Number(amount),
      cycle,
      startDate,
      nextRenewal,
      status,
    });
    notify(subscription ? "Subscription updated" : "Subscription added");
    onClose();
  };

  return (
    <Modal title={subscription ? "Edit Subscription" : "New Subscription"} subtitle="Recurring package – renewals appear on the dashboard" icon={<Repeat />} onClose={onClose} footer={<Footer onClose={onClose} onSave={save} label={subscription ? "Save Changes" : "Add Subscription"} />}>
      <div className={s.formGrid2}>
        <Field label="Client" required error={errors.client} className={s.spanAll}>
          <select className={cx(s.input, errors.client && s.invalid)} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client</option>
            {[...data.clients]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Service">
          <select className={s.input} value={serviceId} onChange={(e) => pickService(e.target.value)}>
            <option value="">Custom package</option>
            {recurring.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Package Name" required error={errors.pkg}>
          <input className={cx(s.input, errors.pkg && s.invalid)} value={packageName} maxLength={60} onChange={(e) => setPackageName(e.target.value)} />
        </Field>
        <Field label="Amount (₹)" required error={errors.amount}>
          <input className={cx(s.input, errors.amount && s.invalid)} type="number" min={0} step={500} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Billing Cycle">
          <select
            className={s.input}
            value={cycle}
            onChange={(e) => {
              const c = e.target.value as Subscription["cycle"];
              setCycle(c);
              setNextRenewal(addMonths(startDate, cycleMonths(c)));
            }}
          >
            {(["Monthly", "Quarterly", "Yearly"] as const).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Start Date">
          <input
            type="date"
            className={s.input}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (!subscription) setNextRenewal(addMonths(e.target.value, cycleMonths(cycle)));
            }}
          />
        </Field>
        <Field label="Next Renewal" error={errors.renewal}>
          <input type="date" className={cx(s.input, errors.renewal && s.invalid)} value={nextRenewal} min={startDate} onChange={(e) => setNextRenewal(e.target.value)} />
        </Field>
        {subscription && (
          <Field label="Status" className={s.spanAll}>
            <select className={s.input} value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
              {(["Active", "Paused", "Cancelled"] as SubscriptionStatus[]).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </Modal>
  );
}

/* ── Record payment ── */
export function PaymentModal({ invoiceId, onClose }: { invoiceId?: string; onClose: () => void }) {
  const { data, today, actions, notify } = useBilling();
  const open = data.invoices
    .filter((i) => {
      const st = invoiceStatus(i, today);
      return st === "Pending" || st === "Overdue";
    })
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "Unknown";

  const [selected, setSelected] = useState(invoiceId ?? open[0]?.id ?? "");
  const inv = data.invoices.find((i) => i.id === selected);
  const [amount, setAmount] = useState(inv ? String(invoiceBalance(inv)) : "");
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = async () => {
    const e: Record<string, string> = {};
    if (!inv) e.invoice = "Choose an invoice";
    const amt = Number(amount);
    if (!(amt > 0)) e.amount = "Enter the amount received";
    else if (inv && amt > invoiceBalance(inv)) e.amount = `Balance is only ${formatINR(invoiceBalance(inv))}`;
    setErrors(e);
    if (Object.keys(e).length || !inv) return;
    await actions.recordPayment({ id: newId("pay"), invoiceId: inv.id, clientId: inv.clientId, amount: amt, date, method, reference: reference.trim() });
    notify(amt >= invoiceBalance(inv) ? `${inv.number} fully paid` : `${formatINR(amt)} recorded for ${inv.number}`);
    onClose();
  };

  return (
    <Modal title="Record Payment" subtitle="Part or full payment against an invoice" icon={<Wallet />} onClose={onClose} footer={<Footer onClose={onClose} onSave={save} label="Save Payment" />}>
      {open.length === 0 && !inv ? (
        <p className={s.note}>There are no unpaid invoices right now. 🎉</p>
      ) : (
        <div className={s.formGrid2}>
          <Field label="Invoice" required error={errors.invoice} className={s.spanAll}>
            <select
              className={cx(s.input, errors.invoice && s.invalid)}
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                const next = data.invoices.find((i) => i.id === e.target.value);
                setAmount(next ? String(invoiceBalance(next)) : "");
              }}
            >
              {open.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.number} · {clientName(i.clientId)} · {formatINR(invoiceBalance(i))} due
                </option>
              ))}
            </select>
          </Field>
          {inv && (
            <p className={cx(s.note, s.spanAll)}>
              Balance due: <b>{formatINR(invoiceBalance(inv))}</b> {invoiceStatus(inv, today) === "Overdue" && <span className={s.tDanger}>· overdue</span>}
            </p>
          )}
          <Field label="Amount Received (₹)" required error={errors.amount}>
            <input className={cx(s.input, errors.amount && s.invalid)} type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Payment Date">
            <input type="date" className={s.input} value={date} max={today} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Method">
            <select className={s.input} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Reference / UTR">
            <input className={s.input} value={reference} maxLength={40} placeholder="Optional" onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
      )}
    </Modal>
  );
}
