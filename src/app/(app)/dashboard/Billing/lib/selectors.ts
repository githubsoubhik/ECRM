// Path: src/app/dashboard/Billing/lib/selectors.ts
// Every number on the dashboard is calculated here from the raw data,
// so the whole page updates the moment an invoice / payment changes.

import {
  SERVICE_CATEGORIES,
  addMonths,
  daysBetween,
  docTotals,
  fromKey,
  invoiceBalance,
  invoiceStatus,
  invoiceTotal,
  monthLabel,
  toKey,
  type BillingData,
  type Invoice,
  type InvoiceStatus,
  type ServiceCategory,
} from "../../../../data/billingData";

export type Period = "this-month" | "last-month" | "this-quarter" | "this-year" | "all";
export const PERIODS: { value: Period; label: string }[] = [
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "this-quarter", label: "This Quarter" },
  { value: "this-year", label: "This Year" },
  { value: "all", label: "All Time" },
];

export type RevenueRange = "12m" | "6m" | "3m" | "ytd";
export const REVENUE_RANGES: { value: RevenueRange; label: string }[] = [
  { value: "12m", label: "Last 12 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "3m", label: "Last 3 Months" },
  { value: "ytd", label: "This Year" },
];

const monthStart = (k: string) => `${k.slice(0, 7)}-01`;

export function periodRange(period: Period, today: string): [string, string] {
  const m0 = monthStart(today);
  switch (period) {
    case "this-month":
      return [m0, today];
    case "last-month":
      return [addMonths(m0, -1), toKey(new Date(fromKey(m0).getTime() - 86400000))];
    case "this-quarter": {
      const d = fromKey(today);
      return [toKey(new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)), today];
    }
    case "this-year":
      return [`${today.slice(0, 4)}-01-01`, today];
    default:
      return ["0000-01-01", "9999-12-31"];
  }
}

const inRange = (k: string, [a, b]: [string, string]) => k >= a && k <= b;
const live = (inv: Invoice) => inv.status !== "Cancelled";
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const growth = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 100) : now ? 100 : 0);

/* ── KPI cards ── */
export function kpis(data: BillingData, today: string) {
  const liveInv = data.invoices.filter(live);
  const total = liveInv.reduce((s, i) => s + invoiceTotal(i), 0);
  const paid = liveInv.reduce((s, i) => s + Math.min(i.paidAmount, invoiceTotal(i)), 0);
  const pending = liveInv.reduce((s, i) => s + invoiceBalance(i), 0);

  const thisM = periodRange("this-month", today);
  // fair comparison: this month so far vs. the same days of last month
  const lastStart = periodRange("last-month", today)[0];
  const lastEnd = periodRange("last-month", today)[1];
  const sameDay = `${lastStart.slice(0, 8)}${today.slice(8)}`;
  const lastM: [string, string] = [lastStart, sameDay < lastEnd ? sameDay : lastEnd];
  const revIn = (r: [string, string]) => liveInv.filter((i) => inRange(i.date, r)).reduce((s, i) => s + invoiceTotal(i), 0);

  const active = data.subscriptions.filter((s) => s.status === "Active");
  const cancelled = data.subscriptions.filter((s) => s.status === "Cancelled").length;
  const renewals = upcomingRenewals(data, today, 30);

  return {
    totalRevenue: total,
    revenueGrowth: growth(revIn(thisM), revIn(lastM)),
    paid,
    paidPct: pct(paid, total),
    pending,
    pendingPct: pct(pending, total),
    clients: data.clients.length,
    newClients: data.clients.filter((c) => inRange(c.createdAt, thisM)).length,
    activeSubs: active.length,
    renewalRate: pct(active.length, active.length + cancelled),
    renewalsDue: renewals.length,
  };
}

/* ── Revenue overview (stacked bars) ── */
export interface MonthBar {
  key: string;
  label: string;
  paid: number;
  pending: number;
  overdue: number;
}

export function monthlyRevenue(data: BillingData, today: string, range: RevenueRange): MonthBar[] {
  const m0 = monthStart(today);
  const count = range === "12m" ? 12 : range === "6m" ? 6 : range === "3m" ? 3 : fromKey(today).getMonth() + 1;
  const bars: MonthBar[] = Array.from({ length: count }, (_, i) => {
    const key = addMonths(m0, i - count + 1);
    return { key: key.slice(0, 7), label: monthLabel(key), paid: 0, pending: 0, overdue: 0 };
  });
  const byKey = new Map(bars.map((b) => [b.key, b]));
  data.invoices.filter(live).forEach((inv) => {
    const bar = byKey.get(inv.date.slice(0, 7));
    if (!bar) return;
    const total = invoiceTotal(inv);
    const paid = Math.min(inv.paidAmount, total);
    bar.paid += paid;
    const rest = total - paid;
    if (rest > 0) {
      if (invoiceStatus(inv, today) === "Overdue") bar.overdue += rest;
      else bar.pending += rest;
    }
  });
  return bars;
}

/* ── Invoice status donut ── */
export function statusCounts(data: BillingData, today: string) {
  const counts: Record<InvoiceStatus, number> = { Paid: 0, Pending: 0, Overdue: 0, Cancelled: 0 };
  data.invoices.forEach((i) => counts[invoiceStatus(i, today)]++);
  return { counts, total: data.invoices.length };
}

/* ── Upcoming renewals ── */
export function upcomingRenewals(data: BillingData, today: string, days = 30) {
  return data.subscriptions
    .filter((s) => s.status === "Active")
    .map((s) => ({ sub: s, inDays: daysBetween(today, s.nextRenewal) }))
    .filter((r) => r.inDays >= 0 && r.inDays <= days)
    .sort((a, b) => a.inDays - b.inDays);
}

/* ── Recent invoices ── */
export const recentInvoices = (data: BillingData, n = 5) =>
  [...data.invoices].sort((a, b) => (a.date === b.date ? b.number.localeCompare(a.number) : a.date < b.date ? 1 : -1)).slice(0, n);

/* ── Period widgets ── */
export function topClients(data: BillingData, today: string, period: Period, n = 5) {
  const r = periodRange(period, today);
  const sums = new Map<string, number>();
  data.invoices.filter((i) => live(i) && inRange(i.date, r)).forEach((i) => sums.set(i.clientId, (sums.get(i.clientId) ?? 0) + invoiceTotal(i)));
  return [...sums.entries()]
    .map(([clientId, amount]) => ({ client: data.clients.find((c) => c.id === clientId), clientId, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export function salesByService(data: BillingData, today: string, period: Period) {
  const r = periodRange(period, today);
  const sums = Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c, 0])) as Record<ServiceCategory, number>;
  data.invoices
    .filter((i) => live(i) && inRange(i.date, r))
    .forEach((inv) => {
      const { subtotal, total } = docTotals(inv);
      const factor = subtotal ? total / subtotal : 1; // spread tax / discount over the items
      inv.items.forEach((it) => (sums[it.category] += it.qty * it.rate * factor));
    });
  const total = Object.values(sums).reduce((a, b) => a + b, 0);
  return {
    total,
    rows: SERVICE_CATEGORIES.map((c) => ({ category: c, amount: sums[c], pct: pct(sums[c], total) })),
  };
}

export function salesSummary(data: BillingData, today: string, period: Period) {
  const r = periodRange(period, today);
  const list = data.invoices.filter((i) => inRange(i.date, r));
  const liveList = list.filter(live);
  const sum = (f: (i: Invoice) => number) => liveList.reduce((s, i) => s + f(i), 0);
  return {
    revenue: sum(invoiceTotal),
    invoices: list.length,
    paid: sum((i) => Math.min(i.paidAmount, invoiceTotal(i))),
    pending: sum((i) => (invoiceStatus(i, today) === "Pending" ? invoiceBalance(i) : 0)),
    overdue: sum((i) => (invoiceStatus(i, today) === "Overdue" ? invoiceBalance(i) : 0)),
  };
}
