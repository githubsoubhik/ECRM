// ═════════════════════════════════════════════════════════════
// Billing data source – THE ONLY FILE TO CHANGE FOR REAL DATA
// Path: src/app/dashboard/Billing/lib/billingApi.ts
//
// Now:   DATA_SOURCE = "demo"  → demo data saved in the browser
// Later: DATA_SOURCE = "api"   → your backend. It should provide:
//   GET    {API_BASE}                → BillingData (clients, services, invoices, …)
//   POST   {API_BASE}/{collection}   → create, returns the saved item
//   PUT    {API_BASE}/{collection}/{id} → update, returns the saved item
//   DELETE {API_BASE}/{collection}/{id}
//   collection = clients | services | invoices | quotations | subscriptions | payments
// Field names can be mapped in normalizeBilling() below.
// ═════════════════════════════════════════════════════════════

import { buildDemoBilling, toKey, type BillingData } from "../../../../data/billingData";

export const DATA_SOURCE: "demo" | "api" = "demo";
export const API_BASE = "/api/billing";
/** Auto refresh in ms for near real-time numbers (0 = off) */
export const BILLING_POLL_MS = 0;

export type Collection = keyof BillingData;
type Item<C extends Collection> = BillingData[C][number];

/* ── demo storage ── */
const STORAGE_KEY = "pavion-billing-v1";
let memory: BillingData | null = null;

function readLocal(): BillingData {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) memory = normalizeBilling(JSON.parse(raw));
  } catch {
    /* ignore broken storage */
  }
  if (!memory) memory = buildDemoBilling(toKey(new Date()));
  return memory;
}

function writeLocal(next: BillingData) {
  memory = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full – kept in memory */
  }
}

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/* ── public API ── */

export async function fetchBilling(): Promise<BillingData> {
  if (DATA_SOURCE === "api") return normalizeBilling(await http<unknown>(API_BASE, { cache: "no-store" }));
  await wait();
  return readLocal();
}

export async function saveItem<C extends Collection>(collection: C, item: Item<C>, isNew: boolean): Promise<Item<C>> {
  if (DATA_SOURCE === "api") {
    const url = isNew ? `${API_BASE}/${collection}` : `${API_BASE}/${collection}/${(item as { id: string }).id}`;
    return http<Item<C>>(url, { method: isNew ? "POST" : "PUT", body: JSON.stringify(item) });
  }
  const data = readLocal();
  const list = data[collection] as Item<C>[];
  const id = (item as { id: string }).id;
  const next = isNew ? [...list, item] : list.map((x) => ((x as { id: string }).id === id ? item : x));
  writeLocal({ ...data, [collection]: next });
  return item;
}

export async function deleteItem(collection: Collection, id: string): Promise<void> {
  if (DATA_SOURCE === "api") return http<void>(`${API_BASE}/${collection}/${id}`, { method: "DELETE" });
  const data = readLocal();
  writeLocal({ ...data, [collection]: (data[collection] as { id: string }[]).filter((x) => x.id !== id) });
}

/** Demo only – wipe local changes and rebuild the demo data */
export function resetDemoData() {
  memory = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Map your backend's field names here if they differ */
export function normalizeBilling(raw: unknown): BillingData {
  const r = (raw ?? {}) as Partial<Record<Collection, unknown>>;
  const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  return {
    clients: arr(r.clients),
    services: arr(r.services),
    invoices: arr(r.invoices),
    quotations: arr(r.quotations),
    subscriptions: arr(r.subscriptions),
    payments: arr(r.payments),
  };
}
