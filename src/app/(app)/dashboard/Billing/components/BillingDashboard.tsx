"use client";
// Path: src/app/dashboard/Billing/components/BillingDashboard.tsx
// Billing & Invoicing – header, KPI cards, tabs and the active section.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Hourglass,
  IndianRupee,
  PackagePlus,
  Plus,
  ReceiptText,
  RefreshCw,
  Repeat,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";
import s from "../Billing.module.css";
import { formatINR } from "../../../../data/billingData";
import { useAccess } from "../../../components/auth/access/useAccess";
import { kpis } from "../lib/selectors";
import { useBilling, type BillingTab } from "./BillingStore";
import Overview from "./Overview";
import Modals from "./modals/Modals";
import { InvoicesSection, PlaceholderSection, SettingsSection, SubscriptionsSection } from "./Sections";
import { Toast, cx, useOutsideClose } from "./ui";

export const BILLING_TABS: { key: BillingTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "clients", label: "Clients" },
  { key: "products", label: "Products & Services" },
  { key: "quotations", label: "Quotations" },
  { key: "invoices", label: "Invoices" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "payments", label: "Payments" },
  { key: "reports", label: "Reports" },
  { key: "expenses", label: "Expenses" },
  { key: "settings", label: "Settings" },
];

/* ── Header ── */
function Header() {
  const { openModal } = useBilling();
  const { can } = useAccess();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClose<HTMLDivElement>(open, close);

  const more = [
    { label: "Create Invoice", icon: <ReceiptText />, show: can("billing.create"), run: () => openModal({ kind: "invoice" }) },
    { label: "New Subscription", icon: <Repeat />, show: can("billing.create"), run: () => openModal({ kind: "subscription" }) },
    { label: "Record Payment", icon: <Wallet />, show: can("billing.create"), run: () => openModal({ kind: "payment" }) },
  ].filter((m) => m.show);

  return (
    <header className={s.header}>
      <div className={s.titleWrap}>
        <span className={s.titleIcon}>
          <FileText />
        </span>
        <div>
          <h1 className={s.title}>Billing &amp; Invoicing</h1>
          <p className={s.subtitle}>Manage clients, products, quotations, invoices, subscriptions and payments – all in one place.</p>
        </div>
      </div>

      <div className={s.headActions}>
        {can("clients.create") && (
          <button type="button" className={s.btnOutline} onClick={() => openModal({ kind: "client" })}>
            <Plus /> Add Client
          </button>
        )}
        {can("products.manage") && (
          <button type="button" className={s.btnOutline} onClick={() => openModal({ kind: "service" })}>
            <Plus />
            <span>
              Add <span className={s.hideSm}>Product/</span>Service
            </span>
          </button>
        )}
        {can("quotations.create") && (
          <div className={s.split} ref={ref}>
            <button type="button" className={s.splitMain} onClick={() => openModal({ kind: "quotation" })}>
              <Plus /> Create Quotation
            </button>
            {more.length > 0 && (
              <>
                <button type="button" className={s.splitToggle} aria-label="More create options" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                  <ChevronDown className={open ? s.flip : ""} />
                </button>
                {open && (
                  <div className={cx(s.menu, s.menuWide)} role="menu">
                    {more.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        role="menuitem"
                        className={s.menuItem}
                        onClick={() => {
                          setOpen(false);
                          m.run();
                        }}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* ── KPI cards ── */
function Trend({ up, text, tone }: { up?: boolean; text: string; tone: string }) {
  return (
    <span className={cx(s.kpiSub, tone)}>
      {up === undefined ? null : up ? <TrendingUp /> : <TrendingDown />}
      {text}
    </span>
  );
}

function KpiCards() {
  const { data, today, goTo, status } = useBilling();
  const k = kpis(data, today);
  const loading = status === "loading" && !data.invoices.length;
  const cards = [
    { label: "Total Revenue", value: formatINR(k.totalRevenue), icon: <IndianRupee />, tone: s.icGreen, sub: <Trend up={k.revenueGrowth >= 0} tone={k.revenueGrowth >= 0 ? s.up : s.down} text={`${Math.abs(k.revenueGrowth)}% vs last month`} />, onClick: () => goTo("reports") },
    { label: "Paid Invoices", value: formatINR(k.paid), icon: <CircleDollarSign />, tone: s.icTeal, sub: <Trend up tone={s.up} text={`${k.paidPct}% of total`} />, onClick: () => goTo("invoices", "Paid") },
    { label: "Pending Payments", value: formatINR(k.pending), icon: <Hourglass />, tone: s.icOrange, sub: <Trend up={false} tone={s.warn} text={`${k.pendingPct}% of total`} />, onClick: () => goTo("invoices", "Pending") },
    { label: "Total Clients", value: String(k.clients), icon: <Users />, tone: s.icBlue, sub: <Trend up tone={s.up} text={`${k.newClients} new this month`} />, onClick: () => goTo("clients") },
    { label: "Active Subscriptions", value: String(k.activeSubs), icon: <Repeat />, tone: s.icViolet, sub: <Trend up tone={s.muted} text={`${k.renewalRate}% renewal rate`} />, onClick: () => goTo("subscriptions") },
    {
      label: "Renewals Due (30 Days)",
      value: String(k.renewalsDue),
      icon: <CalendarClock />,
      tone: s.icRed,
      valueTone: s.kpiRed,
      sub: (
        <span className={cx(s.kpiSub, s.kpiLink)}>
          View upcoming <ArrowRight />
        </span>
      ),
      onClick: () => goTo("subscriptions"),
    },
  ];
  return (
    <div className={s.kpis}>
      {cards.map((c) => (
        <button key={c.label} type="button" className={s.kpi} onClick={c.onClick}>
          <span className={cx(s.kpiIcon, c.tone)}>{c.icon}</span>
          <span className={s.kpiText}>
            <span className={s.kpiLabel}>{c.label}</span>
            {loading ? <span className={s.skelLine} /> : <strong className={cx(s.kpiValue, "valueTone" in c && c.valueTone)}>{c.value}</strong>}
            {!loading && c.sub}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Tabs – shows what fits, the rest go under "More" ── */
function Tabs() {
  const { tab, setTab } = useBilling();
  const [fit, setFit] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const moreRef = useOutsideClose<HTMLDivElement>(open, close);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const calc = () => {
      const items = Array.from(measure.children) as HTMLElement[];
      const widths = items.slice(0, BILLING_TABS.length).map((el) => el.getBoundingClientRect().width);
      const moreW = items[BILLING_TABS.length].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const room = row.clientWidth - 4;
      const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
      if (total <= room) return setFit(widths.length);
      let used = 0;
      let n = 0;
      for (const w of widths) {
        if (used + w + gap + moreW > room) break;
        used += w + gap;
        n++;
      }
      setFit(n);
    };
    const ro = new ResizeObserver(calc);
    ro.observe(row);
    ro.observe(measure);
    return () => ro.disconnect();
  }, []);

  const count = fit ?? BILLING_TABS.length;
  const visible = BILLING_TABS.slice(0, count);
  const hidden = BILLING_TABS.slice(count);
  const hiddenActive = hidden.some((t) => t.key === tab);

  return (
    <nav className={cx(s.tabs, fit === null && s.tabsPending)} ref={rowRef} aria-label="Billing sections">
      {visible.map((t) => (
        <button key={t.key} type="button" className={cx(s.tab, tab === t.key && s.tabOn)} aria-current={tab === t.key ? "page" : undefined} onClick={() => setTab(t.key)}>
          {t.label}
        </button>
      ))}
      {hidden.length > 0 && (
        <div className={s.moreWrap} ref={moreRef}>
          <button type="button" className={cx(s.tab, hiddenActive && s.tabOn)} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            More <ChevronDown className={open ? s.flip : ""} />
          </button>
          {open && (
            <div className={cx(s.menu, s.menuRight)} role="menu">
              {hidden.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="menuitem"
                  className={cx(s.menuItem, tab === t.key && s.menuItemOn)}
                  onClick={() => {
                    setTab(t.key);
                    setOpen(false);
                  }}
                >
                  {t.label}
                  {tab === t.key && <Check className={s.menuCheck} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className={s.tabMeasure} ref={measureRef} aria-hidden="true" inert>
        {BILLING_TABS.map((t) => (
          <button key={t.key} type="button" tabIndex={-1} className={s.tab}>
            {t.label}
          </button>
        ))}
        <button type="button" tabIndex={-1} className={s.tab}>
          More <ChevronDown />
        </button>
      </div>
    </nav>
  );
}

/* ── Active section ── */
function Section() {
  const { tab, openModal, data } = useBilling();
  switch (tab) {
    case "overview":
      return <Overview />;
    case "invoices":
      return <InvoicesSection />;
    case "subscriptions":
      return <SubscriptionsSection />;
    case "settings":
      return <SettingsSection />;
    case "clients":
      return <PlaceholderSection title="Clients" count={`${data.clients.length} clients`} icon={<Users />} action={{ label: "Add Client", perm: "clients.create", run: () => openModal({ kind: "client" }), icon: <UserPlus /> }} />;
    case "products":
      return <PlaceholderSection title="Products & Services" count={`${data.services.length} products & services`} icon={<PackagePlus />} action={{ label: "Add Product/Service", perm: "products.manage", run: () => openModal({ kind: "service" }), icon: <PackagePlus /> }} />;
    case "quotations":
      return <PlaceholderSection title="Quotations" count={`${data.quotations.length} quotations`} icon={<FileText />} action={{ label: "Create Quotation", perm: "quotations.create", run: () => openModal({ kind: "quotation" }), icon: <Plus /> }} />;
    case "payments":
      return <PlaceholderSection title="Payments" count={`${data.payments.length} payments received`} icon={<Wallet />} action={{ label: "Record Payment", perm: "billing.create", run: () => openModal({ kind: "payment" }), icon: <Wallet /> }} />;
    case "reports":
      return <PlaceholderSection title="Reports" count="Revenue, GST, client & service reports" icon={<FileText />} />;
    case "expenses":
      return <PlaceholderSection title="Expenses" count="Track office, salary, ad-spend and vendor expenses" icon={<IndianRupee />} />;
    default:
      return null;
  }
}

export default function BillingDashboard() {
  const { status, error, reload, toast } = useBilling();
  return (
    <div className={s.page}>
      <Header />
      <KpiCards />
      <Tabs />
      {status === "error" ? (
        <div className={s.errorBox}>
          <p>Couldn&apos;t load billing data: {error}</p>
          <button type="button" className={s.btnOutline} onClick={reload}>
            <RefreshCw /> Try again
          </button>
        </div>
      ) : status === "loading" ? (
        <div className={s.skeleton} aria-busy="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      ) : (
        <Section />
      )}
      <Modals />
      {toast && <Toast key={toast.id} text={toast.text} tone={toast.tone} />}
    </div>
  );
}
