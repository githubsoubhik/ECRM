"use client";
// Path: src/app/dashboard/Billing/components/Sections.tsx
// Tabs other than Overview.
//  • Invoices & Subscriptions – working lists (Overview "View All" opens them)
//  • Settings – roles & access overview (+ demo role switcher)
//  • Others – placeholders until you build Clients, Products, Quotations …
//    Create a file per section (e.g. sections/ClientsSection.tsx) and swap it
//    into the switch in BillingDashboard.tsx.

import { useMemo, useState, type ReactNode } from "react";
import { Check, Construction, Plus, RefreshCw, Repeat, Search, ShieldCheck, X } from "lucide-react";
import s from "../Billing.module.css";
import {
  daysBetween,
  formatDate,
  formatINR,
  invoiceBalance,
  invoiceStatus,
  invoiceTotal,
  type InvoiceStatus,
  type SubscriptionStatus,
} from "../../../../data/billingData";
import { ROLES, ROLE_PERMISSIONS, type Permission, type Role } from "../../../components/auth/access/roles";
import { useAccess } from "../../../components/auth/access/useAccess";
import { DATA_SOURCE, resetDemoData } from "../lib/billingApi";
import { useBilling, useClientName } from "./BillingStore";
import { useInvoiceMenu, useSubscriptionMenu } from "./actions";
import { Avatar, Card, EmptyState, RowMenu, StatusPill, cx } from "./ui";

const PAGE = 15;

/* ── Invoices ─────────────────────────────────────────────── */
export function InvoicesSection() {
  const { data, today, invoiceFilter, setInvoiceFilter, openModal } = useBilling();
  const { can } = useAccess();
  const client = useClientName();
  const menu = useInvoiceMenu();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "high" | "low">("new");
  const [limit, setLimit] = useState(PAGE);

  const withStatus = useMemo(() => data.invoices.map((inv) => ({ inv, st: invoiceStatus(inv, today), total: invoiceTotal(inv) })), [data.invoices, today]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: withStatus.length, Paid: 0, Pending: 0, Overdue: 0, Cancelled: 0 };
    withStatus.forEach((x) => c[x.st]++);
    return c;
  }, [withStatus]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = withStatus.filter(({ inv, st }) => {
      if (invoiceFilter !== "All" && st !== invoiceFilter) return false;
      if (!q) return true;
      return inv.number.toLowerCase().includes(q) || (client(inv.clientId)?.name ?? "").toLowerCase().includes(q);
    });
    const by = {
      new: (a: (typeof list)[number], b: (typeof list)[number]) => (a.inv.date === b.inv.date ? b.inv.number.localeCompare(a.inv.number) : a.inv.date < b.inv.date ? 1 : -1),
      old: (a: (typeof list)[number], b: (typeof list)[number]) => (a.inv.date < b.inv.date ? -1 : 1),
      high: (a: (typeof list)[number], b: (typeof list)[number]) => b.total - a.total,
      low: (a: (typeof list)[number], b: (typeof list)[number]) => a.total - b.total,
    }[sort];
    return [...list].sort(by);
  }, [withStatus, invoiceFilter, query, sort, client]);

  const filters: (InvoiceStatus | "All")[] = ["All", "Paid", "Pending", "Overdue", "Cancelled"];

  return (
    <Card
      title="Invoices"
      action={
        can("billing.create") && (
          <button type="button" className={s.btnPrimarySm} onClick={() => openModal({ kind: "invoice" })}>
            <Plus /> Create Invoice
          </button>
        )
      }
      bodyClass={s.flush}
    >
      <div className={s.listTools}>
        <div className={s.chips} role="tablist" aria-label="Filter by status">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={invoiceFilter === f}
              className={cx(s.chip, invoiceFilter === f && s.chipOn)}
              onClick={() => {
                setInvoiceFilter(f);
                setLimit(PAGE);
              }}
            >
              {f} <small>{counts[f]}</small>
            </button>
          ))}
        </div>
        <div className={s.toolsRight}>
          <label className={s.search}>
            <Search />
            <input
              placeholder="Search invoice no. or client"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X />
              </button>
            )}
          </label>
          <select className={s.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="high">Amount: high → low</option>
            <option value="low">Amount: low → high</option>
          </select>
        </div>
      </div>

      <div className={cx(s.table, s.fullInvTable)} role="table" aria-label="Invoices">
        <div className={s.tHead} role="row">
          <span role="columnheader">Invoice No.</span>
          <span role="columnheader">Client</span>
          <span role="columnheader">Date</span>
          <span role="columnheader">Due Date</span>
          <span role="columnheader">Amount</span>
          <span role="columnheader">Balance</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className={s.tCenter}>
            Action
          </span>
        </div>
        {rows.length === 0 && <p className={s.tEmpty}>No invoices match these filters.</p>}
        {rows.slice(0, limit).map(({ inv, st, total }) => {
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
              <span role="cell" data-area="due" className={st === "Overdue" ? s.tDanger : s.tMuted}>
                {formatDate(inv.dueDate)}
              </span>
              <span className={s.tAmount} role="cell">
                {formatINR(total)}
              </span>
              <span role="cell" data-area="bal" className={s.tMuted}>
                {invoiceBalance(inv) ? formatINR(invoiceBalance(inv)) : "—"}
              </span>
              <span role="cell" data-area="status">
                <StatusPill status={st} />
              </span>
              <span className={s.tCenter} role="cell" data-area="act">
                <RowMenu items={menu(inv)} label={`Actions for ${inv.number}`} horizontal />
              </span>
            </div>
          );
        })}
      </div>
      {rows.length > limit && (
        <div className={s.loadMore}>
          <button type="button" className={s.btnOutline} onClick={() => setLimit((l) => l + PAGE)}>
            Load more ({rows.length - limit} left)
          </button>
        </div>
      )}
    </Card>
  );
}

/* ── Subscriptions ────────────────────────────────────────── */
export function SubscriptionsSection() {
  const { data, today, openModal } = useBilling();
  const { can } = useAccess();
  const client = useClientName();
  const menu = useSubscriptionMenu();
  const [filter, setFilter] = useState<SubscriptionStatus | "All" | "Due">("Due");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: data.subscriptions.length, Active: 0, Paused: 0, Cancelled: 0, Due: 0 };
    data.subscriptions.forEach((x) => {
      c[x.status]++;
      const d = daysBetween(today, x.nextRenewal);
      if (x.status === "Active" && d >= 0 && d <= 30) c.Due++;
    });
    return c;
  }, [data.subscriptions, today]);

  const rows = useMemo(
    () =>
      data.subscriptions
        .filter((x) => {
          if (filter === "All") return true;
          if (filter === "Due") {
            const d = daysBetween(today, x.nextRenewal);
            return x.status === "Active" && d >= 0 && d <= 30;
          }
          return x.status === filter;
        })
        .sort((a, b) => (a.nextRenewal < b.nextRenewal ? -1 : 1)),
    [data.subscriptions, filter, today],
  );

  const filters: { key: typeof filter; label: string }[] = [
    { key: "Due", label: "Due in 30 days" },
    { key: "Active", label: "Active" },
    { key: "Paused", label: "Paused" },
    { key: "Cancelled", label: "Cancelled" },
    { key: "All", label: "All" },
  ];

  return (
    <Card
      title="Subscriptions"
      action={
        can("billing.create") && (
          <button type="button" className={s.btnPrimarySm} onClick={() => openModal({ kind: "subscription" })}>
            <Plus /> New Subscription
          </button>
        )
      }
      bodyClass={s.flush}
    >
      <div className={s.listTools}>
        <div className={s.chips} role="tablist" aria-label="Filter subscriptions">
          {filters.map((f) => (
            <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={cx(s.chip, filter === f.key && s.chipOn)} onClick={() => setFilter(f.key)}>
              {f.label} <small>{counts[f.key]}</small>
            </button>
          ))}
        </div>
      </div>
      <div className={cx(s.table, s.subTable)} role="table" aria-label="Subscriptions">
        <div className={s.tHead} role="row">
          <span role="columnheader">Client</span>
          <span role="columnheader">Package</span>
          <span role="columnheader">Cycle</span>
          <span role="columnheader">Amount</span>
          <span role="columnheader">Next Renewal</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className={s.tCenter}>
            Action
          </span>
        </div>
        {rows.length === 0 && (
          <EmptyState icon={<Repeat />} title="Nothing here" text="No subscriptions match this filter." />
        )}
        {rows.map((sub) => {
          const c = client(sub.clientId);
          const d = daysBetween(today, sub.nextRenewal);
          return (
            <div key={sub.id} className={s.tRow} role="row">
              <span className={s.tClient} role="cell">
                <Avatar name={c?.name ?? "?"} logo={c?.logo} />
                <span>{c?.name ?? "Unknown client"}</span>
              </span>
              <span className={s.tMuted} role="cell" data-area="pkg">
                {sub.packageName}
              </span>
              <span role="cell" data-area="cycle" className={s.tMuted}>
                {sub.cycle}
              </span>
              <span className={s.tAmount} role="cell">
                {formatINR(sub.amount)}
              </span>
              <span role="cell" data-area="date">
                {formatDate(sub.nextRenewal)}
                {sub.status === "Active" && d >= 0 && d <= 30 && <small className={cx(s.inDays, d <= 7 && s.inDaysHot)}>in {d}d</small>}
              </span>
              <span role="cell" data-area="status">
                <StatusPill status={sub.status} />
              </span>
              <span className={s.tCenter} role="cell" data-area="act">
                <RowMenu items={menu(sub)} label={`Actions for ${c?.name ?? "subscription"}`} />
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Settings: roles & access ─────────────────────────────── */
const PERMISSION_LABELS: { key: Permission; label: string }[] = [
  { key: "billing.view", label: "View billing" },
  { key: "billing.create", label: "Create invoices / payments" },
  { key: "billing.edit", label: "Edit, mark paid, renew" },
  { key: "billing.delete", label: "Delete" },
  { key: "quotations.create", label: "Quotations" },
  { key: "clients.create", label: "Add clients" },
  { key: "products.manage", label: "Products & services" },
  { key: "billing.export", label: "Reports & export" },
];

export function SettingsSection() {
  const { role, setRole, can } = useAccess();
  const { reload, notify } = useBilling();
  const has = (r: Role, p: Permission) => {
    const list = ROLE_PERMISSIONS[r];
    return list === "*" || list.includes(p);
  };
  return (
    <div className={s.stack}>
      <Card
        title={
          <>
            <ShieldCheck className={s.titleIco} /> Roles &amp; Access
          </>
        }
        action={
          <label className={s.roleSwitch}>
            Viewing as
            <select value={role ?? "admin"} onChange={(e) => setRole(e.target.value as Role)} aria-label="Switch role (demo)">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        }
        bodyClass={s.flush}
      >
        <p className={s.note}>
          Permissions are defined in <code>src/app/components/auth/access/roles.ts</code>. The &quot;Viewing as&quot; switch is for testing – replace it with the role
          from your login once authentication is ready.
        </p>
        <div className={s.permScroll}>
          <table className={s.permTable}>
            <thead>
              <tr>
                <th>Permission</th>
                {ROLES.map((r) => (
                  <th key={r.value} className={r.value === role ? s.permMe : ""}>
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_LABELS.map((p) => (
                <tr key={p.key}>
                  <td>{p.label}</td>
                  {ROLES.map((r) => (
                    <td key={r.value} className={r.value === role ? s.permMe : ""}>
                      {has(r.value, p.key) ? <Check className={s.permYes} aria-label="Allowed" /> : <X className={s.permNo} aria-label="Not allowed" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {DATA_SOURCE === "demo" && can("billing.settings") && (
        <Card title="Demo Data">
          <div className={s.demoRow}>
            <p>You are using demo data saved in this browser. Reset it to start fresh.</p>
            <button
              type="button"
              className={s.btnOutline}
              onClick={() => {
                if (!window.confirm("Reset all billing demo data?")) return;
                resetDemoData();
                reload();
                notify("Demo data reset");
              }}
            >
              <RefreshCw /> Reset demo data
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Placeholder for sections still to be built ───────────── */
export function PlaceholderSection({
  title,
  count,
  icon,
  action,
}: {
  title: string;
  count: string;
  icon: ReactNode;
  action?: { label: string; perm: Permission; run: () => void; icon: ReactNode };
}) {
  const { can } = useAccess();
  return (
    <Card title={title}>
      <EmptyState
        icon={icon}
        title={count}
        text={`The full ${title} section is coming next. Everything you add from here already appears across the dashboard.`}
        action={
          <div className={s.emptyActions}>
            <span className={s.soonBadge}>
              <Construction /> In progress
            </span>
            {action && can(action.perm) && (
              <button type="button" className={s.btnPrimarySm} onClick={action.run}>
                {action.icon} {action.label}
              </button>
            )}
          </div>
        }
      />
    </Card>
  );
}
