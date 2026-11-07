// ─────────────────────────────────────────────────────────────
// Billing & Invoicing – types, constants, helpers & DEMO data
// Path: src/app/data/billingData.ts
//
// ⚠ The UI never reads the demo data directly. Everything goes through
//   dashboard/Billing/lib/billingApi.ts (the data source).
//   To use real data you only change that file.
// ─────────────────────────────────────────────────────────────

/* ── Types ────────────────────────────────────────────────── */

export type ServiceCategory =
  | "Social Media Management"
  | "Meta Ads"
  | "Website Development"
  | "Branding & Creatives"
  | "Photography & Video"
  | "Others";

export type BillingCycle = "One-time" | "Monthly" | "Quarterly" | "Yearly";
export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Cancelled";
/** What is stored. "Overdue" is worked out from the due date. */
export type StoredInvoiceStatus = "Paid" | "Pending" | "Cancelled";
export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected";
export type SubscriptionStatus = "Active" | "Paused" | "Cancelled";
export type PaymentMethod = "UPI" | "Bank Transfer" | "Cash" | "Card" | "Cheque";

export interface BillingClient {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  gstin: string;
  logo: string | null;
  createdAt: string; // YYYY-MM-DD
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  cycle: BillingCycle;
  description: string;
}

export interface LineItem {
  id: string;
  serviceId: string | null;
  name: string;
  category: ServiceCategory;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  number: string; // INV-2026-186
  clientId: string;
  date: string; // issue date
  dueDate: string;
  items: LineItem[];
  taxRate: number; // GST %
  discount: number; // ₹
  status: StoredInvoiceStatus;
  paidAmount: number;
  paidOn: string | null;
  notes: string;
  subscriptionId: string | null;
}

export interface Quotation {
  id: string;
  number: string; // QT-2026-012
  clientId: string;
  date: string;
  validUntil: string;
  items: LineItem[];
  taxRate: number;
  discount: number;
  status: QuotationStatus;
  notes: string;
}

export interface Subscription {
  id: string;
  clientId: string;
  serviceId: string | null;
  packageName: string;
  category: ServiceCategory;
  amount: number;
  cycle: Exclude<BillingCycle, "One-time">;
  startDate: string;
  nextRenewal: string;
  status: SubscriptionStatus;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
}

export interface BillingData {
  clients: BillingClient[];
  services: Service[];
  invoices: Invoice[];
  quotations: Quotation[];
  subscriptions: Subscription[];
  payments: Payment[];
}

/* ── Constants ────────────────────────────────────────────── */

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Social Media Management",
  "Meta Ads",
  "Website Development",
  "Branding & Creatives",
  "Photography & Video",
  "Others",
];

export const CATEGORY_COLORS: Record<ServiceCategory, string> = {
  "Social Media Management": "#2f80ed",
  "Meta Ads": "#f2556b",
  "Website Development": "#f6a623",
  "Branding & Creatives": "#8b8ff0",
  "Photography & Video": "#b9a4e8",
  Others: "#cfd4e2",
};

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  Paid: "#22b573",
  Pending: "#f6a623",
  Overdue: "#ef4444",
  Cancelled: "#b8bfd3",
};

export const BILLING_CYCLES: BillingCycle[] = ["One-time", "Monthly", "Quarterly", "Yearly"];
export const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Bank Transfer", "Cash", "Card", "Cheque"];
export const GST_RATES = [0, 5, 12, 18];
export const DEFAULT_GST = 18;

/** Your company details – printed on invoices */
export const COMPANY = {
  name: "Pavion Tech & Construction Pvt. Ltd.",
  address: "Kolkata, West Bengal",
  email: "support@pavion.in",
  phone: "+91 86974 99881",
  gstin: "",
};

/* ── Date & money helpers ─────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const addDays = (k: string, n: number) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
export const addMonths = (k: string, n: number) => {
  const d = fromKey(k);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toKey(d);
};
export const daysBetween = (from: string, to: string) => Math.round((fromKey(to).getTime() - fromKey(from).getTime()) / 86400000);
export const cycleMonths = (c: BillingCycle) => (c === "Yearly" ? 12 : c === "Quarterly" ? 3 : c === "Monthly" ? 1 : 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (k: string) => MONTHS[fromKey(k).getMonth()];
export const formatDate = (k: string | null | undefined) => {
  if (!k) return "—";
  const d = fromKey(k);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const formatINR = (n: number) => `₹${inr.format(Math.round(n))}`;
/** ₹2.5L, ₹48K – for chart axes */
export const formatINRShort = (n: number) => {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${+(n / 1e3).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
};

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ── Amount helpers ───────────────────────────────────────── */

export const itemsSubtotal = (items: LineItem[]) => items.reduce((s, i) => s + i.qty * i.rate, 0);
export const docTotals = (doc: { items: LineItem[]; taxRate: number; discount: number }) => {
  const subtotal = itemsSubtotal(doc.items);
  const taxable = Math.max(0, subtotal - doc.discount);
  const tax = Math.round((taxable * doc.taxRate) / 100);
  return { subtotal, taxable, tax, total: taxable + tax };
};
export const invoiceTotal = (inv: Invoice) => docTotals(inv).total;

/** Paid / Pending / Overdue / Cancelled, using today's date */
export const invoiceStatus = (inv: Invoice, today: string): InvoiceStatus => {
  if (inv.status === "Paid" || inv.status === "Cancelled") return inv.status;
  return inv.dueDate < today ? "Overdue" : "Pending";
};
export const invoiceBalance = (inv: Invoice) => (inv.status === "Cancelled" ? 0 : Math.max(0, invoiceTotal(inv) - inv.paidAmount));

/** Next document number, e.g. INV-2026-187 */
export const nextNumber = (prefix: "INV" | "QT", existing: string[], today: string) => {
  const year = today.slice(0, 4);
  const max = existing.reduce((m, n) => {
    const parts = n.split("-");
    return parts[1] === year ? Math.max(m, Number(parts[2]) || 0) : m;
  }, 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
};

/* ── DEMO data ────────────────────────────────────────────────
   Built relative to "today" so renewals, overdue invoices and
   "this month" always look realistic. Seeded → same every load. */

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_SERVICES: Service[] = [
  { id: "sv-smm-basic", name: "Social Media Management – Basic", category: "Social Media Management", price: 8000, cycle: "Monthly", description: "12 posts + 4 reels per month" },
  { id: "sv-smm-gold", name: "Gold Package", category: "Social Media Management", price: 15000, cycle: "Monthly", description: "20 posts, 8 reels, community management" },
  { id: "sv-smm-premium", name: "Premium Package", category: "Social Media Management", price: 25000, cycle: "Monthly", description: "Full social media + monthly shoot" },
  { id: "sv-smm", name: "Social Media Management", category: "Social Media Management", price: 12000, cycle: "Monthly", description: "Content calendar, posting and reporting" },
  { id: "sv-meta", name: "Meta Ads Management", category: "Meta Ads", price: 10000, cycle: "Monthly", description: "Campaign setup, optimisation and reports" },
  { id: "sv-sm-ads", name: "Social Media + Ads", category: "Meta Ads", price: 15000, cycle: "Monthly", description: "Social media management with Meta ads" },
  { id: "sv-web", name: "Website Development", category: "Website Development", price: 25000, cycle: "One-time", description: "5-page responsive website" },
  { id: "sv-web-ecom", name: "E-commerce Website", category: "Website Development", price: 55000, cycle: "One-time", description: "Online store with payment gateway" },
  { id: "sv-brand", name: "Logo & Branding Kit", category: "Branding & Creatives", price: 12000, cycle: "One-time", description: "Logo, colours, fonts, brand guide" },
  { id: "sv-creatives", name: "Creative Pack (20 designs)", category: "Branding & Creatives", price: 8000, cycle: "One-time", description: "20 social media creatives" },
  { id: "sv-photo", name: "Product Photography", category: "Photography & Video", price: 10000, cycle: "One-time", description: "Half-day studio shoot" },
  { id: "sv-content-ads", name: "Content & Ads", category: "Photography & Video", price: 20000, cycle: "Monthly", description: "Reel shoots + ads" },
  { id: "sv-gst", name: "GST Return Filing", category: "Others", price: 2000, cycle: "Monthly", description: "Monthly GST compliance" },
  { id: "sv-tm", name: "Trademark Registration", category: "Others", price: 6500, cycle: "One-time", description: "Filing + documentation" },
];

const FEATURED_CLIENTS = ["Pure Ayus", "Trisha'z Makeover & Academy", "YCPF Photos & Films", "Rup'z Makeover", "Arinaz Makeup Academy", "Pavion EdTech"];
const NAME_A = ["Bloom", "Glow", "Aura", "Velvet", "Royal", "Urban", "Lotus", "Silk", "Golden", "Bliss", "Pearl", "Crimson", "Saffron", "Ivory"];
const NAME_B = ["Bridal Studio", "Salon", "Makeup Lounge", "Skin Clinic", "Boutique", "Cafe", "Academy", "Fitness", "Jewellers", "Spa"];
const CITIES = ["Kolkata", "Howrah", "Salt Lake", "Dum Dum", "Barrackpore", "Siliguri", "Durgapur"];
const PEOPLE = ["Ritika Sen", "Ankit Das", "Moumita Roy", "Sourav Paul", "Priya Shaw", "Arjun Ghosh", "Sneha Dutta", "Rahul Bose"];

export function buildDemoBilling(today: string): BillingData {
  const rnd = seeded(20260);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  /* clients – 48, six joined this month */
  const names: string[] = [...FEATURED_CLIENTS];
  for (let i = 0; names.length < 48; i++) {
    const n = `${NAME_A[i % NAME_A.length]} ${NAME_B[(i * 3 + Math.floor(i / NAME_A.length)) % NAME_B.length]}`;
    if (!names.includes(n)) names.push(n);
  }
  const clients: BillingClient[] = names.map((name, i) => {
    const person = PEOPLE[i % PEOPLE.length];
    const isNew = i >= 42;
    return {
      id: `cl-${slug(name)}`,
      name,
      contactPerson: person,
      email: `${slug(name).replace(/-/g, "")}@gmail.com`,
      phone: `+91 9${String(830000000 + i * 7919).slice(0, 9)}`,
      city: CITIES[i % CITIES.length],
      gstin: i % 3 === 0 ? `19ABCDE${String(1000 + i)}F1Z${i % 10}` : "",
      logo: null,
      createdAt: isNew ? addDays(today, -Math.floor(rnd() * Math.max(1, Number(today.slice(8)) - 1))) : addDays(today, -(40 + i * 9)),
    };
  });

  /* invoices – ~186 over the last 12 months, growing month by month */
  const invoices: Invoice[] = [];
  const perMonth = [10, 11, 13, 14, 15, 15, 16, 16, 17, 18, 19, 22];
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  let counter = 0;
  perMonth.forEach((count, idx) => {
    const monthStart = addMonths(firstOfMonth, idx - 11);
    const daysInMonth = idx === 11 ? Number(today.slice(8)) : new Date(fromKey(monthStart).getFullYear(), fromKey(monthStart).getMonth() + 1, 0).getDate();
    for (let k = 0; k < count; k++) {
      counter++;
      const date = addDays(monthStart, Math.min(daysInMonth - 1, Math.floor(rnd() * daysInMonth)));
      const client = clients[Math.floor(Math.pow(rnd(), 1.6) * 42)];
      const svc = pick(DEMO_SERVICES);
      const items: LineItem[] = [{ id: `li-${counter}`, serviceId: svc.id, name: svc.name, category: svc.category, qty: 1, rate: svc.price }];
      if (rnd() < 0.18) {
        const extra = pick(DEMO_SERVICES);
        items.push({ id: `li-${counter}b`, serviceId: extra.id, name: extra.name, category: extra.category, qty: 1, rate: extra.price });
      }
      const dueDate = addDays(date, 15);
      const age = daysBetween(date, today);
      const r = rnd();
      let status: StoredInvoiceStatus = "Paid";
      if (r < 0.045) status = "Cancelled";
      else if (age < 25 ? r < 0.5 : age < 70 ? r < 0.2 : r < 0.06) status = "Pending";
      const inv: Invoice = {
        id: `inv-${counter}`,
        number: "",
        clientId: client.id,
        date,
        dueDate,
        items,
        taxRate: 0,
        discount: 0,
        status,
        paidAmount: 0,
        paidOn: null,
        notes: "",
        subscriptionId: null,
      };
      if (status === "Paid") {
        inv.paidAmount = invoiceTotal(inv);
        inv.paidOn = addDays(date, Math.min(age, 2 + Math.floor(rnd() * 12)));
      } else if (status === "Pending" && rnd() < 0.15) {
        inv.paidAmount = Math.round(invoiceTotal(inv) * 0.4);
      }
      invoices.push(inv);
    }
  });
  invoices.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  invoices.forEach((inv, i) => {
    inv.number = `INV-${inv.date.slice(0, 4)}-${String(i + 1).padStart(3, "0")}`;
  });

  /* payments for every paid / part-paid invoice */
  const payments: Payment[] = invoices
    .filter((i) => i.paidAmount > 0)
    .map((i, n) => ({
      id: `pay-${n + 1}`,
      invoiceId: i.id,
      clientId: i.clientId,
      amount: i.paidAmount,
      date: i.paidOn ?? addDays(i.date, 3),
      method: PAYMENT_METHODS[n % 3],
      reference: n % 3 === 0 ? `UPI${1040000 + n}` : "",
    }));

  /* subscriptions – 32 active, eight renew in the next 30 days */
  const subPlans: { svc: string; amount: number }[] = [
    { svc: "sv-smm-gold", amount: 15000 },
    { svc: "sv-smm", amount: 12000 },
    { svc: "sv-smm-premium", amount: 25000 },
    { svc: "sv-content-ads", amount: 20000 },
    { svc: "sv-sm-ads", amount: 15000 },
    { svc: "sv-meta", amount: 10000 },
    { svc: "sv-smm-basic", amount: 8000 },
    { svc: "sv-gst", amount: 2000 },
  ];
  const dueSoon = [9, 14, 19, 22, 26, 27, 29, 30];
  const subscriptions: Subscription[] = [];
  for (let i = 0; i < 38; i++) {
    const plan = subPlans[i % subPlans.length];
    const svc = DEMO_SERVICES.find((s) => s.id === plan.svc)!;
    const status: SubscriptionStatus = i < 32 ? "Active" : i < 35 ? "Paused" : "Cancelled";
    const offset = i < dueSoon.length ? dueSoon[i] : 31 + ((i * 7) % 60);
    const cycle = i % 9 === 8 ? "Quarterly" : "Monthly";
    subscriptions.push({
      id: `sub-${i + 1}`,
      clientId: clients[i % 40].id,
      serviceId: svc.id,
      packageName: svc.name.replace("Social Media Management – ", ""),
      category: svc.category,
      amount: plan.amount,
      cycle,
      startDate: addMonths(today, -(3 + (i % 10))),
      nextRenewal: addDays(today, offset),
      status,
    });
  }

  /* quotations */
  const quotations: Quotation[] = Array.from({ length: 14 }, (_, i) => {
    const svc = DEMO_SERVICES[(i * 5) % DEMO_SERVICES.length];
    const date = addDays(today, -(i * 6 + 1));
    return {
      id: `qt-${i + 1}`,
      number: `QT-${date.slice(0, 4)}-${String(14 - i).padStart(3, "0")}`,
      clientId: clients[(i * 7) % clients.length].id,
      date,
      validUntil: addDays(date, 15),
      items: [{ id: `qli-${i}`, serviceId: svc.id, name: svc.name, category: svc.category, qty: 1, rate: svc.price }],
      taxRate: DEFAULT_GST,
      discount: 0,
      status: (["Sent", "Accepted", "Draft", "Rejected", "Sent", "Accepted"] as QuotationStatus[])[i % 6],
      notes: "",
    };
  });

  return { clients, services: DEMO_SERVICES.map((s) => ({ ...s })), invoices, quotations, subscriptions, payments };
}
