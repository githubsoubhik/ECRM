"use client";
// Path: src/app/dashboard/Billing/components/BillingStore.tsx
// One shared store for the Billing page: data, actions, tabs, modals, toast.
// Every change is applied instantly (optimistic) and rolled back if saving fails.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  addMonths,
  cycleMonths,
  invoiceTotal,
  newId,
  nextNumber,
  toKey,
  type BillingClient,
  type BillingData,
  type Invoice,
  type Payment,
  type Quotation,
  type Service,
  type Subscription,
} from "../../../../data/billingData";
import { BILLING_POLL_MS, deleteItem, fetchBilling, saveItem, type Collection } from "../lib/billingApi";

export type BillingTab =
  | "overview"
  | "clients"
  | "products"
  | "quotations"
  | "invoices"
  | "subscriptions"
  | "payments"
  | "reports"
  | "expenses"
  | "settings";

export type ModalState =
  | null
  | { kind: "invoice"; invoice?: Invoice; prefill?: Partial<Invoice> }
  | { kind: "quotation"; quotation?: Quotation }
  | { kind: "client"; client?: BillingClient }
  | { kind: "service"; service?: Service }
  | { kind: "subscription"; subscription?: Subscription }
  | { kind: "payment"; invoiceId?: string }
  | { kind: "viewInvoice"; invoiceId: string };

const EMPTY: BillingData = { clients: [], services: [], invoices: [], quotations: [], subscriptions: [], payments: [] };

function useBillingState() {
  const [today] = useState(() => toKey(new Date()));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<BillingData>(EMPTY);
  const [tab, setTab] = useState<BillingTab>("overview");
  const [invoiceFilter, setInvoiceFilter] = useState<string>("All");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ id: number; text: string; tone: "ok" | "error" } | null>(null);
  const dataRef = useRef(data);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const notify = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2800);
  }, []);

  /* load (+ optional polling) */
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchBilling()
        .then((d) => {
          if (!alive) return;
          setData(d);
          setStatus("ready");
        })
        .catch((e: Error) => {
          if (!alive) return;
          setError(e.message);
          setStatus("error");
        });
    load();
    const timer = BILLING_POLL_MS ? window.setInterval(load, BILLING_POLL_MS) : 0;
    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadKey((k) => k + 1);
  }, []);

  /** apply locally, then persist; undo if the save fails */
  const run = useCallback(
    async (apply: (d: BillingData) => BillingData, persist: () => Promise<unknown>, errorText = "Couldn't save – please try again") => {
      const before = dataRef.current;
      const after = apply(before);
      dataRef.current = after;
      setData(after);
      try {
        await persist();
      } catch {
        dataRef.current = before;
        setData(before);
        notify(errorText, "error");
      }
    },
    [notify],
  );

  const upsert = useCallback(
    <C extends Collection>(collection: C, item: BillingData[C][number]) => {
      const id = (item as { id: string }).id;
      const isNew = !(dataRef.current[collection] as { id: string }[]).some((x) => x.id === id);
      return run(
        (d) => ({
          ...d,
          [collection]: isNew ? [...d[collection], item] : (d[collection] as { id: string }[]).map((x) => (x.id === id ? item : x)),
        }),
        () => saveItem(collection, item, isNew),
      );
    },
    [run],
  );

  const remove = useCallback(
    (collection: Collection, id: string) =>
      run(
        (d) => ({ ...d, [collection]: (d[collection] as { id: string }[]).filter((x) => x.id !== id) }),
        () => deleteItem(collection, id),
      ),
    [run],
  );

  /* ── actions ── */
  const actions = useMemo(
    () => ({
      saveClient: (c: BillingClient) => upsert("clients", c),
      saveService: (s: Service) => upsert("services", s),
      saveQuotation: (q: Quotation) => upsert("quotations", q),
      saveSubscription: (s: Subscription) => upsert("subscriptions", s),
      saveInvoice: (i: Invoice) => upsert("invoices", i),
      deleteInvoice: (id: string) => remove("invoices", id),
      deleteQuotation: (id: string) => remove("quotations", id),

      nextInvoiceNumber: () => nextNumber("INV", dataRef.current.invoices.map((i) => i.number), today),
      nextQuotationNumber: () => nextNumber("QT", dataRef.current.quotations.map((q) => q.number), today),

      /** records a payment and updates the invoice (fully paid → "Paid") */
      recordPayment: async (p: Payment) => {
        const inv = dataRef.current.invoices.find((i) => i.id === p.invoiceId);
        if (!inv) return;
        const paidAmount = Math.min(invoiceTotal(inv), inv.paidAmount + p.amount);
        const full = paidAmount >= invoiceTotal(inv);
        const updated: Invoice = { ...inv, paidAmount, status: full ? "Paid" : inv.status, paidOn: full ? p.date : inv.paidOn };
        await upsert("payments", p);
        await upsert("invoices", updated);
      },

      markPaid: async (inv: Invoice) => {
        const balance = invoiceTotal(inv) - inv.paidAmount;
        const p: Payment = { id: newId("pay"), invoiceId: inv.id, clientId: inv.clientId, amount: balance, date: today, method: "Bank Transfer", reference: "" };
        await upsert("payments", p);
        await upsert("invoices", { ...inv, status: "Paid", paidAmount: invoiceTotal(inv), paidOn: today });
      },

      cancelInvoice: (inv: Invoice) => upsert("invoices", { ...inv, status: "Cancelled" }),

      /** moves the renewal date forward and raises the renewal invoice */
      renewSubscription: async (sub: Subscription) => {
        const number = nextNumber("INV", dataRef.current.invoices.map((i) => i.number), today);
        const inv: Invoice = {
          id: newId("inv"),
          number,
          clientId: sub.clientId,
          date: today,
          dueDate: sub.nextRenewal > today ? sub.nextRenewal : today,
          items: [{ id: newId("li"), serviceId: sub.serviceId, name: sub.packageName, category: sub.category, qty: 1, rate: sub.amount }],
          taxRate: 0,
          discount: 0,
          status: "Pending",
          paidAmount: 0,
          paidOn: null,
          notes: `Renewal – ${sub.cycle}`,
          subscriptionId: sub.id,
        };
        await upsert("invoices", inv);
        await upsert("subscriptions", { ...sub, nextRenewal: addMonths(sub.nextRenewal, cycleMonths(sub.cycle)) });
        return inv;
      },
    }),
    [upsert, remove, today],
  );

  const openModal = useCallback((m: ModalState) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  /** jump to a tab (optionally with an invoice status filter) and scroll up */
  const goTo = useCallback((t: BillingTab, filter?: string) => {
    setTab(t);
    if (filter) setInvoiceFilter(filter);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    today,
    status,
    error,
    data,
    reload,
    actions,
    tab,
    setTab,
    goTo,
    invoiceFilter,
    setInvoiceFilter,
    modal,
    openModal,
    closeModal,
    toast,
    notify,
  };
}

export type BillingStore = ReturnType<typeof useBillingState>;
const Ctx = createContext<BillingStore | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const store = useBillingState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useBilling() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useBilling must be used inside <BillingProvider>");
  return s;
}

/** client lookup helper */
export function useClientName() {
  const { data } = useBilling();
  return useMemo(() => {
    const map = new Map(data.clients.map((c) => [c.id, c]));
    return (id: string) => map.get(id);
  }, [data.clients]);
}
