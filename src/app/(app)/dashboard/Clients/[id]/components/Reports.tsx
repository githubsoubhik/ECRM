"use client";
// Path: src/app/dashboard/Clients/[id]/components/Reports.tsx
// Reports – built only with the shared client-page UI (Card, stat cards, miniTable, charts),
// so it looks the same as the Overview and Campaigns tabs.
//
// Used on Overview:  ReportsOverviewCard · Last7DaysCard · MonthlyReportCard
// Used on Reports:   ReportsDashboard

import { useMemo, useState } from "react";
import { FiAlertCircle, FiBarChart2, FiCalendar, FiCheckSquare, FiDownload, FiHeart, FiLayers, FiPieChart, FiUsers } from "react-icons/fi";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import {
  campaignSpentPct,
  campaignStatus,
  daysBetween,
  formatDate,
  formatINR,
  type Campaign,
  type CampaignStatus,
  type MetricCard,
} from "../../../../../data/clientDetailsData";
import { Donut, GroupedBars, Legend, MultiArea, SERIES, Sparkline } from "./Charts";
import { useClient } from "./ClientStore";
import { Avatar, Card, LinkBtn, Trend } from "./ui";
import s from "../ClientDetails.module.css";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

// DEMO scaling for the range pickers. With an API, request the range instead.
const RANGES = { "7": { label: "Last 7 Days", f: 0.28 }, "30": { label: "Last 30 Days", f: 1 }, "90": { label: "Last 90 Days", f: 2.7 } } as const;
type RangeKey = keyof typeof RANGES;

const METRIC_COLORS = [SERIES.blue, SERIES.pink, SERIES.orange, SERIES.green];

const STATUS_CLASS: Record<CampaignStatus, string> = {
  Active: s.stActive,
  Paused: s.stPaused,
  Completed: s.stCompleted,
  Scheduled: s.stScheduled,
  Draft: s.stDraft,
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const t = String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Overview-tab cards (same names and look as before)                  */
/* ------------------------------------------------------------------ */

export function ReportsOverviewCard() {
  const { data } = useClient();
  const [range, setRange] = useState<RangeKey>("30");
  const f = RANGES[range].f;
  const metrics: MetricCard[] = [data.reports.reach, data.reports.engagement, data.reports.leads, data.reports.conversions];

  return (
    <Card
      title="Reports Overview"
      icon={<FiBarChart2 />}
      action={
        <select className={s.select} value={range} onChange={(e) => setRange(e.target.value as RangeKey)} aria-label="Report range">
          {Object.entries(RANGES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      }
    >
      <div className={s.metrics}>
        {metrics.map((m, i) => (
          <div key={m.label} className={s.metric}>
            <span className={s.metricLabel}>{m.label}</span>
            <div className={s.metricRow}>
              <strong>{Math.round(m.value * f).toLocaleString("en-IN")}</strong>
              <Trend value={m.change} />
            </div>
            <Sparkline data={range === "7" ? m.series.slice(-7) : m.series} color={METRIC_COLORS[i]} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Last7DaysCard() {
  const { data } = useClient();
  const series = [
    { key: "views", name: "Views", color: SERIES.blue },
    { key: "engagement", name: "Engagement", color: SERIES.pink },
    { key: "leads", name: "Leads", color: SERIES.orange },
  ];
  return (
    <Card title="Last 7 Days Report" icon={<FiPieChart />}>
      <Legend items={series} />
      <GroupedBars rows={data.last7Days} series={series} />
    </Card>
  );
}

export function MonthlyReportCard() {
  const { data, today } = useClient();
  // DEMO months (current + 2 previous) — with an API, fetch data for the selected month
  const months = useMemo(() => {
    const [y, m] = today.split("-").map(Number);
    return [1, 0.82, 0.7].map((f, i) => {
      const idx = m - 1 - i;
      const yy = y + Math.floor(idx / 12);
      const mm = ((idx % 12) + 12) % 12;
      return { key: `${yy}-${String(mm + 1).padStart(2, "0")}`, label: `${MONTH_NAMES[mm]} ${yy}`, f };
    });
  }, [today]);
  const [month, setMonth] = useState(months[0].key);
  const f = months.find((m) => m.key === month)?.f ?? 1;
  const rows = useMemo(
    () => data.monthly.map((w) => ({ ...w, reach: Math.round(w.reach * f), engagement: Math.round(w.engagement * f), leads: Math.round(w.leads * f) })),
    [data.monthly, f]
  );
  const series = [
    { key: "reach", name: "Reach", color: SERIES.blue },
    { key: "engagement", name: "Engagement", color: SERIES.pink },
    { key: "leads", name: "Leads", color: SERIES.orange },
  ];
  return (
    <Card
      title="Monthly Report"
      icon={<FiCalendar />}
      action={
        <select className={s.select} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
          {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      }
    >
      <Legend items={series} />
      <MultiArea rows={rows} series={series} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Reports-tab sections                                                */
/* ------------------------------------------------------------------ */

/** KPI row – same markup as the Overview / Campaigns stat cards */
function ReportKpis({ campaigns }: { campaigns: Campaign[] }) {
  const { data, asOfDate } = useClient();
  const started = campaigns.filter((c) => c.startDate <= asOfDate);
  const spend = started.reduce((a, c) => a + (c.spent ?? 0), 0);
  const leads = started.reduce((a, c) => a + (c.leads ?? 0), 0);
  const { delivered, pending } = data.creatives;
  const st = data.stats;

  const cards = [
    { key: "spend", icon: <span className={s.rupee}>₹</span>, tone: s.icBlue, label: "Total Ad Spend", value: formatINR(spend), trend: st.spendChange, sub: "Across all campaigns" },
    { key: "leads", icon: <FiUsers />, tone: s.icTeal, label: "Leads Generated", value: leads.toLocaleString("en-IN"), trend: st.leadsChange, sub: leads ? `${formatINR(Math.round(spend / leads))} per lead` : "From paid campaigns" },
    { key: "eng", icon: <FiHeart />, tone: s.icRed, label: "Engagement Rate", value: `${st.engagementRate}%`, trend: st.engagementChange, sub: `Industry avg. ${st.industryAvg}%` },
    { key: "posts", icon: <HiOutlineSpeakerphone />, tone: s.icViolet, label: "Posts Published", value: String(st.postsPublished), trend: null, sub: `${st.staticPosts} Static | ${st.reels} Reels` },
    { key: "creatives", icon: <FiLayers />, tone: s.icGreen, label: "Creatives Delivered", value: `${delivered}/${delivered + pending}`, trend: null, sub: `${pending} pending`, hideMobile: true },
  ];

  return (
    <div className={`${s.stats} ${s.stats5}`}>
      {cards.map((c) => (
        <div key={c.key} className={`${s.statCard} ${c.hideMobile ? s.hideMobile : ""}`}>
          <span className={`${s.statIcon} ${c.tone}`}>{c.icon}</span>
          <div className={s.statBody}>
            <span className={s.statLabel}>{c.label}</span>
            <div className={s.statValueRow}>
              <strong className={s.statValue}>{c.value}</strong>
              {c.trend !== null && <Trend value={c.trend} />}
            </div>
            <span className={s.statSub}>{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Budget vs spend per campaign – same table + spend bar as the Campaigns tab */
function BudgetTableCard({ campaigns }: { campaigns: Campaign[] }) {
  const { data, asOfDate, setTab } = useClient();
  const rows = campaigns.filter((c) => c.startDate <= asOfDate);
  const budget = rows.reduce((a, c) => a + c.budget, 0);
  const spent = rows.reduce((a, c) => a + (c.spent ?? 0), 0);

  const exportCsv = () =>
    downloadCsv(`${data.name.replace(/\s+/g, "_")}_campaign_spend.csv`, [
      ["Campaign", "Status", "Budget", "Spent", "Spent %", "Leads", "Start", "End"],
      ...rows.map((c) => [c.name, campaignStatus(c, asOfDate), c.budget, c.spent ?? 0, campaignSpentPct(c), c.leads ?? 0, c.startDate, c.endDate]),
    ]);

  return (
    <Card
      title="Budget vs Spend"
      icon={<FiBarChart2 />}
      action={
        <button type="button" className={s.btnOutlineSm} onClick={exportCsv} disabled={!rows.length}>
          <FiDownload /> Export
        </button>
      }
    >
      <p className={s.trendTotal}>
        <strong>{formatINR(spent)}</strong> spent of {formatINR(budget)} budget
      </p>
      <div className={s.tableScroll}>
        <table className={`${s.miniTable} ${s.fullTable}`}>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Spent</th>
              <th>Leads</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const pct = campaignSpentPct(c);
              const status = campaignStatus(c, asOfDate);
              return (
                <tr key={c.id}>
                  <td className={s.strong}>{c.name}</td>
                  <td><span className={`${s.pill} ${STATUS_CLASS[status]}`}>{status}</span></td>
                  <td>{formatINR(c.budget)}</td>
                  <td>
                    <div className={s.spent}>
                      <span className={s.spentAmt}>{formatINR(c.spent ?? 0)}</span>
                      <div className={s.spentRow}>
                        <div className={s.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget spent">
                          <i style={{ width: `${pct}%` }} className={pct >= 90 ? s.barHot : ""} />
                        </div>
                        <small>{pct}%</small>
                      </div>
                    </div>
                  </td>
                  <td>{(c.leads ?? 0).toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className={s.empty}>
                  No campaigns have started yet. <LinkBtn onClick={() => setTab("campaigns")}>Go to Campaigns</LinkBtn>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Deliverables – donut + legend, same layout as Campaign Goal Distribution */
function DeliveryCard() {
  const { data } = useClient();
  const posts = Object.values(data.calendar).flat();
  const published = posts.filter((p) => p.status === "Published").length;
  const scheduled = posts.filter((p) => p.status === "Scheduled").length;
  const other = posts.length - published - scheduled;
  const parts = [
    { name: "Published", value: published, color: SERIES.green },
    { name: "Scheduled", value: scheduled, color: SERIES.blue },
    { name: "Draft / Other", value: other, color: "#94a3b8" },
  ];
  const { delivered, pending } = data.creatives;

  return (
    <Card title="Content Delivery" icon={<FiPieChart />}>
      <div className={s.goalBody}>
        <div className={s.goalDonut}>
          <Donut total={posts.length} parts={parts} label="Posts" />
        </div>
        <ul className={s.goalLegend}>
          {parts.map((p) => (
            <li key={p.name}>
              <i style={{ background: p.color }} />
              <span>{p.name}</span>
              <strong>{p.value}</strong>
            </li>
          ))}
          <li>
            <i style={{ background: SERIES.orange }} />
            <span>Creatives pending</span>
            <strong>{pending}/{delivered + pending}</strong>
          </li>
        </ul>
      </div>
    </Card>
  );
}

/** Leads per team member – same ranked list as Top Performing Campaigns */
function TeamLeadsCard({ campaigns }: { campaigns: Campaign[] }) {
  const { data } = useClient();
  const people = useMemo(() => {
    const map = new Map<string, { leads: number; spent: number; count: number }>();
    campaigns.forEach((c) => {
      const who = c.runBy ?? "Team";
      const cur = map.get(who) ?? { leads: 0, spent: 0, count: 0 };
      map.set(who, { leads: cur.leads + (c.leads ?? 0), spent: cur.spent + (c.spent ?? 0), count: cur.count + 1 });
    });
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.leads - a.leads);
  }, [campaigns]);

  return (
    <Card title="Leads by Team Member" icon={<FiUsers />}>
      <ol className={s.topList}>
        {people.slice(0, 5).map((p, i) => (
          <li key={p.name}>
            <span className={s.rank}>{i + 1}</span>
            <Avatar src={data.team.find((t) => t.name === p.name)?.avatar ?? null} name={p.name} size={34} />
            <div className={s.topMain}>
              <strong>{p.name}</strong>
              <small>
                {p.leads.toLocaleString("en-IN")} leads · {p.count} campaign{p.count > 1 ? "s" : ""}
                {p.leads ? ` · ${formatINR(Math.round(p.spent / p.leads))} CPL` : ""}
              </small>
            </div>
          </li>
        ))}
        {people.length === 0 && <li className={s.textMuted}>No campaigns yet</li>}
      </ol>
    </Card>
  );
}

/** Overdue + upcoming tasks for this client */
function TasksCard() {
  const { data, asOfDate, setTab } = useClient();
  const open = data.tasks
    .filter((t) => !t.done)
    .map((t) => ({ ...t, diff: daysBetween(asOfDate, t.due) }))
    .sort((a, b) => a.due.localeCompare(b.due));
  const overdue = open.filter((t) => t.diff < 0).length;

  return (
    <Card
      title={`Open Tasks (${open.length})`}
      icon={overdue ? <FiAlertCircle /> : <FiCheckSquare />}
      action={<LinkBtn onClick={() => setTab("notes")}>View All</LinkBtn>}
    >
      {overdue > 0 && (
        <p className={s.trendTotal}>
          <strong>{overdue}</strong> task{overdue > 1 ? "s are" : " is"} overdue
        </p>
      )}
      <div className={s.tableScroll}>
        <table className={`${s.miniTable} ${s.fullTable}`}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Owner</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {open.slice(0, 6).map((t) => (
              <tr key={t.id}>
                <td className={s.strong}>{t.title}</td>
                <td>
                  <span className={s.runByCell}>
                    <Avatar src={data.team.find((m) => m.name === t.assignee)?.avatar ?? null} name={t.assignee} size={24} />
                    <span>{t.assignee}</span>
                  </span>
                </td>
                <td>{formatDate(t.due)}</td>
                <td>
                  {t.diff < 0 ? (
                    <span className={`${s.trend} ${s.trendDown}`}>{Math.abs(t.diff)}d overdue</span>
                  ) : (
                    <span className={`${s.pill} ${s.pillBlue}`}>{t.diff === 0 ? "Due today" : `Due in ${t.diff}d`}</span>
                  )}
                </td>
              </tr>
            ))}
            {open.length === 0 && (
              <tr>
                <td colSpan={4} className={s.empty}>All tasks are done.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Full Reports tab                                                    */
/* ------------------------------------------------------------------ */

export function ReportsDashboard() {
  const { data } = useClient();
  const campaigns = useMemo(() => Object.values(data.campaigns).flat(), [data.campaigns]);

  return (
    <div className={s.stack}>
      <ReportKpis campaigns={campaigns} />
      <ReportsOverviewCard />
      <div className={s.twoCol}>
        <MonthlyReportCard />
        <Last7DaysCard />
      </div>
      <div className={s.campaignBottom}>
        <div className={s.cbTrend}><BudgetTableCard campaigns={campaigns} /></div>
        <div className={s.cbGoal}><DeliveryCard /></div>
        <div className={s.cbTop}><TeamLeadsCard campaigns={campaigns} /></div>
      </div>
      <TasksCard />
    </div>
  );
}