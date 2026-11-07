"use client";
// Path: src/app/dashboard/Billing/components/Overview.tsx
// "Overview" tab – every widget is calculated live from the store.

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  FileSpreadsheet,
  PackagePlus,
  ReceiptText,
  UserPlus,
} from "lucide-react";
import s from "../Billing.module.css";
import {
  CATEGORY_COLORS,
  STATUS_COLORS,
  formatDate,
  formatINR,
  invoiceStatus,
  invoiceTotal,
  type InvoiceStatus,
} from "../../../../data/billingData";
import { useAccess } from "../../../components/auth/access/useAccess";
import type { Permission } from "../../../components/auth/access/roles";
import {
  PERIODS,
  REVENUE_RANGES,
  monthlyRevenue,
  recentInvoices,
  salesByService,
  salesSummary,
  statusCounts,
  topClients,
  upcomingRenewals,
  type Period,
  type RevenueRange,
} from "../lib/selectors";
import { useBilling, useClientName } from "./BillingStore";
import { Donut, RevenueChart, SERIES, type SeriesKey } from "./Charts";
import { useInvoiceMenu, useSubscriptionMenu } from "./actions";
import { Avatar, Card, MiniSelect, RowMenu, StatusPill, ViewAll, cx } from "./ui";

/* ── Revenue overview ── */
function RevenueOverview() {
  const { data, today } = useBilling();
  const [range, setRange] = useState<RevenueRange>("12m");
  const [hidden, setHidden] = useState<Set<SeriesKey>>(() => new Set());
  const bars = useMemo(() => monthlyRevenue(data, today, range), [data, today, range]);
  const toggle = (k: SeriesKey) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(k)) n.delete(k);
      else if (n.size < SERIES.length - 1) n.add(k);
      return n;
    });

  return (
    <Card
      className={s.aRevenue}
      title={
        <>
          Revenue Overview
          <span className={s.legend}>
            {SERIES.map((x) => (
              <button key={x.key} type="button" className={cx(s.legendItem, hidden.has(x.key) && s.legendOff)} onClick={() => toggle(x.key)} aria-pressed={!hidden.has(x.key)}>
                <i style={{ background: x.color }} />
                {x.label}
              </button>
            ))}
          </span>
        </>
      }
      action={<MiniSelect label="Revenue range" value={range} onChange={setRange} options={REVENUE_RANGES} />}
    >
      <RevenueChart bars={bars} hidden={hidden} />
    </Card>
  );
}

/* ── Invoice status ── */
function InvoiceStatusCard() {
  const { data, today, goTo } = useBilling();
  const [hover, setHover] = useState<string | null>(null);
  const { counts, total } = useMemo(() => statusCounts(data, today), [data, today]);
  const order: InvoiceStatus[] = ["Paid", "Pending", "Overdue", "Cancelled"];
  const slices = order.map((st) => ({ label: st, value: counts[st], color: STATUS_COLORS[st] }));
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <Card className={s.aStatus} title="Invoice Status">
      <div className={s.donutRow}>
        <Donut
          slices={slices}
          size={150}
          thickness={24}
          active={hover}
          onHover={setHover}
          onSelect={(st) => goTo("invoices", st)}
          center={
            <>
              <strong>{hover ? counts[hover as InvoiceStatus] : total}</strong>
              <span>{hover ?? "Total Invoices"}</span>
            </>
          }
        />
        <ul className={s.donutLegend}>
          {slices.map((sl) => (
            <li key={sl.label}>
              <button
                type="button"
                onMouseEnter={() => setHover(sl.label)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(sl.label)}
                onBlur={() => setHover(null)}
                onClick={() => goTo("invoices", sl.label)}
                title={`See ${sl.label.toLowerCase()} invoices`}
              >
                <i style={{ background: sl.color }} />
                <span>{sl.label}</span>
                <b>
                  {sl.value} <small>({pct(sl.value)}%)</small>
                </b>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* ── Quick actions ── */
function QuickActions() {
  const { openModal, goTo } = useBilling();
  const { can } = useAccess();
  const items: { label: string; icon: ReactNode; perm: Permission; onClick: () => void }[] = [
    { label: "Create Quotation", icon: <FileText />, perm: "quotations.create", onClick: () => openModal({ kind: "quotation" }) },
    { label: "Create Invoice", icon: <ReceiptText />, perm: "billing.create", onClick: () => openModal({ kind: "invoice" }) },
    { label: "Add Client", icon: <UserPlus />, perm: "clients.create", onClick: () => openModal({ kind: "client" }) },
    { label: "Add Product/Service", icon: <PackagePlus />, perm: "products.manage", onClick: () => openModal({ kind: "service" }) },
    { label: "Manage Subscriptions", icon: <CalendarClock />, perm: "billing.view", onClick: () => goTo("subscriptions") },
    { label: "View Reports", icon: <FileSpreadsheet />, perm: "billing.view", onClick: () => goTo("reports") },
  ];
  return (
    <Card className={s.aQuick} title="Quick Actions" bodyClass={s.quickBody}>
      <div className={s.quickGrid}>
        {items.map((it) => {
          const allowed = can(it.perm);
          return (
            <button key={it.label} type="button" className={s.quickItem} onClick={it.onClick} disabled={!allowed} title={allowed ? it.label : "You don't have permission"}>
              <span className={s.quickIcon}>{it.icon}</span>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Upcoming renewals ── */
function UpcomingRenewals() {
  const { data, today, goTo } = useBilling();
  const client = useClientName();
  const menu = useSubscriptionMenu();
  const rows = useMemo(() => upcomingRenewals(data, today, 30).slice(0, 5), [data, today]);

  return (
    <Card className={s.aRenew} title="Upcoming Renewals" action={<ViewAll onClick={() => goTo("subscriptions")} />} bodyClass={s.flush}>
      <div className={cx(s.table, s.renewTable)} role="table" aria-label="Upcoming renewals">
        <div className={s.tHead} role="row">
          <span role="columnheader">Client</span>
          <span role="columnheader">Service Package</span>
          <span role="columnheader">Renewal Date</span>
          <span role="columnheader">Amount</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className={s.tCenter}>
            Action
          </span>
        </div>
        {rows.length === 0 && <p className={s.tEmpty}>No renewals in the next 30 days 🎉</p>}
        {rows.map(({ sub, inDays }) => {
          const c = client(sub.clientId);
          return (
            <div key={sub.id} className={s.tRow} role="row">
              <span className={s.tClient} role="cell">
                <Avatar name={c?.name ?? "?"} logo={c?.logo} />
                <span>{c?.name ?? "Unknown client"}</span>
              </span>
              <span className={s.tMuted} role="cell" data-area="pkg">
                {sub.packageName}
              </span>
              <span role="cell" data-area="date">
                {formatDate(sub.nextRenewal)}
              </span>
              <span className={s.tAmount} role="cell">
                {formatINR(sub.amount)}
              </span>
              <span role="cell" data-area="status">
                <span className={cx(s.pill, inDays <= 7 ? s.pillRed : s.pillOrange)}>{inDays === 0 ? "Today" : `In ${inDays} Day${inDays === 1 ? "" : "s"}`}</span>
              </span>
              <span className={s.tCenter} role="cell" data-area="act">
                <RowMenu items={menu(sub)} label={`Actions for ${c?.name ?? "renewal"}`} />
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Recent invoices ── */
function RecentInvoices() {
  const { data, today, goTo, openModal } = useBilling();
  const client = useClientName();
  const menu = useInvoiceMenu();
  const rows = useMemo(() => recentInvoices(data, 5), [data]);

  return (
    <Card className={s.aRecent} title="Recent Invoices" action={<ViewAll onClick={() => goTo("invoices", "All")} />} bodyClass={s.flush}>
      <div className={cx(s.table, s.invTable)} role="table" aria-label="Recent invoices">
        <div className={s.tHead} role="row">
          <span role="columnheader">Invoice No.</span>
          <span role="columnheader">Client</span>
          <span role="columnheader">Date</span>
          <span role="columnheader">Amount</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className={s.tCenter}>
            Action
          </span>
        </div>
        {rows.map((inv) => {
          const c = client(inv.clientId);
          return (
            <div key={inv.id} className={s.tRow} role="row">
              <span role="cell" data-area="no">
                <button type="button" className={s.linkCell} onClick={() => openModal({ kind: "viewInvoice", invoiceId: inv.id })}>
                  {inv.number}
                </button>
              </span>
              <span className={s.tClient} role="cell">
                <Avatar name={c?.name ?? "?"} logo={c?.logo} />
                <span>{c?.name ?? "Unknown client"}</span>
              </span>
              <span role="cell" data-area="date">
                {formatDate(inv.date)}
              </span>
              <span className={s.tAmount} role="cell">
                {formatINR(invoiceTotal(inv))}
              </span>
              <span role="cell" data-area="status">
                <StatusPill status={invoiceStatus(inv, today)} />
              </span>
              <span className={s.tCenter} role="cell" data-area="act">
                <RowMenu items={menu(inv)} label={`Actions for ${inv.number}`} horizontal />
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Top clients ── */
function TopClients() {
  const { data, today } = useBilling();
  const [period, setPeriod] = useState<Period>("this-month");
  const rows = useMemo(() => topClients(data, today, period, 5), [data, today, period]);
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <Card className={s.aTop} title="Top Clients by Revenue" action={<MiniSelect label="Period" value={period} onChange={setPeriod} options={PERIODS} />}>
      {rows.length === 0 ? (
        <p className={s.tEmpty}>No invoices in this period.</p>
      ) : (
        <ul className={s.hbars}>
          {rows.map((r) => (
            <li key={r.clientId}>
              <span className={s.tClient}>
                <Avatar name={r.client?.name ?? "?"} logo={r.client?.logo} />
                <span>{r.client?.name ?? "Unknown client"}</span>
              </span>
              <span className={s.hbarTrack}>
                <i style={{ width: `${(r.amount / max) * 100}%` }} />
              </span>
              <b>{formatINR(r.amount)}</b>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ── Sales by service ── */
function SalesByService() {
  const { data, today } = useBilling();
  const [period, setPeriod] = useState<Period>("this-month");
  const [hover, setHover] = useState<string | null>(null);
  const { total, rows } = useMemo(() => salesByService(data, today, period), [data, today, period]);
  const slices = rows.map((r) => ({ label: r.category, value: r.amount, color: CATEGORY_COLORS[r.category] }));
  const hovered = rows.find((r) => r.category === hover);
  return (
    <Card className={s.aSales} title="Sales by Service" action={<MiniSelect label="Period" value={period} onChange={setPeriod} options={PERIODS} />}>
      <div className={s.donutRow}>
        <Donut
          slices={slices}
          size={160}
          thickness={24}
          active={hover}
          onHover={setHover}
          center={
            <>
              <strong className={s.donutMoney}>{formatINR(hovered ? hovered.amount : total)}</strong>
              <span>{hovered ? hovered.category : "Total Sales"}</span>
            </>
          }
        />
        <ul className={cx(s.donutLegend, s.serviceLegend)}>
          {rows.map((r) => (
            <li key={r.category}>
              <button type="button" onMouseEnter={() => setHover(r.category)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(r.category)} onBlur={() => setHover(null)}>
                <i style={{ background: CATEGORY_COLORS[r.category] }} />
                <span>{r.category}</span>
                <b>{r.pct}%</b>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* ── Sales summary ── */
function SalesSummary() {
  const { data, today, goTo } = useBilling();
  const [period, setPeriod] = useState<Period>("this-month");
  const sum = useMemo(() => salesSummary(data, today, period), [data, today, period]);
  const rows = [
    { label: "Total Revenue", value: formatINR(sum.revenue), icon: <BarChart3 />, tone: s.sumBlue, onClick: undefined },
    { label: "Total Invoices", value: String(sum.invoices), icon: <FileText />, tone: s.sumViolet, onClick: () => goTo("invoices", "All") },
    { label: "Paid Amount", value: formatINR(sum.paid), icon: <CheckCircle2 />, tone: s.sumGreen, onClick: () => goTo("invoices", "Paid") },
    { label: "Pending Amount", value: formatINR(sum.pending), icon: <Clock3 />, tone: s.sumOrange, onClick: () => goTo("invoices", "Pending") },
    { label: "Overdue Amount", value: formatINR(sum.overdue), icon: <AlertCircle />, tone: s.sumRed, onClick: () => goTo("invoices", "Overdue") },
  ];
  return (
    <Card className={s.aSummary} title="Sales Summary" action={<MiniSelect label="Period" value={period} onChange={setPeriod} options={PERIODS} />}>
      <ul className={s.summary}>
        {rows.map((r) => (
          <li key={r.label} className={r.tone}>
            <button type="button" onClick={r.onClick} disabled={!r.onClick}>
              <span className={s.sumIcon}>{r.icon}</span>
              <span>{r.label}</span>
              <b>{r.value}</b>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Overview() {
  return (
    <div className={s.overview}>
      <RevenueOverview />
      <InvoiceStatusCard />
      <QuickActions />
      <UpcomingRenewals />
      <RecentInvoices />
      <TopClients />
      <SalesByService />
      <SalesSummary />
    </div>
  );
}

