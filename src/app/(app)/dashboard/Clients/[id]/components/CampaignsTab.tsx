"use client";
// Path: src/app/dashboard/Clients/[id]/components/CampaignsTab.tsx
// The "Campaigns" tab: KPI cards, Past/Current/Upcoming tabs, filters, table (cards on phones),
// ⋮ menu (Edit / Delete), bulk delete, Performance Trend, Goal Distribution, Top Performing.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FiBarChart2, FiCalendar, FiEdit2, FiFilter, FiMoreVertical, FiPlus, FiRefreshCw, FiSearch, FiTarget, FiTrash2, FiTrendingUp, FiUsers, FiX,
} from "react-icons/fi";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { FaTrophy } from "react-icons/fa";
import {
  CAMPAIGN_OBJECTIVES,
  campaignCPL,
  campaignResult,
  campaignScore,
  campaignSpentPct,
  campaignStatus,
  campaignTimeLeft,
  campaignTrend,
  formatDate,
  formatINR,
  formatMetric,
  formatShortDate,
  type Campaign,
  type CampaignBucket,
  type CampaignStatus,
  type Platform,
} from "../../../../../data/clientDetailsData";
import { Donut, GroupedBars, MultiArea, SERIES } from "./Charts";
import { useClient } from "./ClientStore";
import { PLATFORM } from "./LeftPanel";
import { Avatar, Card, LinkBtn, Modal, Segmented, Thumb } from "./ui";
import s from "../ClientDetails.module.css";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const STATUS_CLASS: Record<CampaignStatus, string> = {
  Active: s.stActive,
  Paused: s.stPaused,
  Completed: s.stCompleted,
  Scheduled: s.stScheduled,
  Draft: s.stDraft,
};

const TYPE_CLASS: Record<string, string> = {
  "Lead Generation": s.tyLead,
  "Brand Awareness": s.tyBrand,
  "Course Promotion": s.tyCourse,
  "Sales / Promotion": s.tySales,
  "Event Promotion": s.tyEvent,
};

// Fixed colour per objective (colour follows the category, never its rank)
const OBJECTIVE_COLOR: Record<string, string> = {
  "Lead Generation": "#7c3aed",
  "Brand Awareness": "#f08c00",
  "Course Promotion": "#3b5bdb",
  "Sales / Promotion": "#0ca678",
  "Event Promotion": "#d6336c",
  Others: "#94a3b8",
};

/** "150 Leads" -> "Leads", "Brand Awareness" -> "Brand Awareness" */
const goalKind = (goal?: string) => (goal ? goal.replace(/^[\d.,]+\s*[KkLlMm]?\s+/, "").trim() : "");

function PlatformIcons({ list }: { list?: Platform[] }) {
  if (!list?.length) return <span className={s.textMuted}>—</span>;
  return (
    <span className={s.platformIcons}>
      {list.map((p) => (
        <span key={p} className={`${s.socBtn} ${s.socXs} ${PLATFORM[p].cls}`} title={PLATFORM[p].name}>
          {PLATFORM[p].icon}
        </span>
      ))}
    </span>
  );
}

function ChangePill({ value, goodWhenDown = false }: { value?: number; goodWhenDown?: boolean }) {
  if (value === undefined || value === null || Number.isNaN(value)) return null;
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  return (
    <span className={`${s.trend} ${good ? s.trendUp : s.trendDown}`}>
      {up ? "↑" : "↓"} {Math.abs(Math.round(value))}%
    </span>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  return <span className={`${s.pill} ${STATUS_CLASS[status]}`}>{status}</span>;
}

function SpentBar({ c }: { c: Campaign }) {
  const pct = campaignSpentPct(c);
  return (
    <div className={s.spent}>
      <span className={s.spentAmt}>{formatINR(c.spent ?? 0)}</span>
      <div className={s.spentRow}>
        <div className={s.bar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget spent">
          <i style={{ width: `${pct}%` }} className={pct >= 90 ? s.barHot : ""} />
        </div>
        <small>{pct}%</small>
      </div>
    </div>
  );
}

/** Fixed-position popover anchored to an element (escapes scrolling containers) */
type Anchor = { el: HTMLElement; top: number; left: number };
function anchorAt(el: HTMLElement, width: number, height: number): Anchor {
  const r = el.getBoundingClientRect();
  let left = r.right - width;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  let top = r.bottom + 6;
  if (top + height > window.innerHeight - 8) top = Math.max(8, r.top - height - 6);
  return { el, top, left };
}

function Popover({
  anchor,
  onClose,
  width,
  closeOnScroll = false,
  onReposition,
  children,
  label,
}: {
  anchor: Anchor;
  onClose: () => void;
  width: number;
  closeOnScroll?: boolean;
  onReposition?: (a: Anchor) => void;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.el.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const scroll = () => (closeOnScroll ? onClose() : onReposition?.(anchorAt(anchor.el, width, ref.current?.offsetHeight ?? 0)));
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [anchor, onClose, closeOnScroll, onReposition, width]);

  return (
    <div ref={ref} className={s.popover} style={{ top: anchor.top, left: anchor.left, width }} role="dialog" aria-label={label}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI cards                                                           */
/* ------------------------------------------------------------------ */

function CampaignKpis({ all }: { all: Campaign[] }) {
  const { data, asOfDate } = useClient();
  const started = all.filter((c) => c.startDate <= asOfDate);
  const spend = started.reduce((a, c) => a + (c.spent ?? 0), 0);
  const reach = started.reduce((a, c) => a + (c.reach ?? 0), 0);
  const leads = started.reduce((a, c) => a + (c.leads ?? 0), 0);
  const cpl = leads ? Math.round(spend / leads) : 0;

  // CPL change: running campaigns vs completed ones
  const sumOf = (list: Campaign[], k: "spent" | "leads") => list.reduce((a, c) => a + (c[k] ?? 0), 0);
  const prevLeads = sumOf(data.campaigns.past, "leads");
  const curLeads = sumOf(data.campaigns.current, "leads");
  const prevCpl = prevLeads ? sumOf(data.campaigns.past, "spent") / prevLeads : 0;
  const curCpl = curLeads ? sumOf(data.campaigns.current, "spent") / curLeads : 0;
  const cplChange = prevCpl && curCpl ? ((curCpl - prevCpl) / prevCpl) * 100 : undefined;

  const cards = [
    {
      key: "count", icon: <HiOutlineSpeakerphone />, tone: s.icGreen, value: String(all.length), label: "Total Campaigns", trend: null as ReactNode,
      sub: `${data.campaigns.past.length} Completed | ${data.campaigns.current.length} Running | ${data.campaigns.upcoming.length} Upcoming`,
    },
    { key: "spend", icon: <span className={s.rupee}>₹</span>, tone: s.icBlue, value: formatINR(spend), label: "Total Ad Spend", trend: <ChangePill value={data.stats.spendChange} />, sub: "Across all campaigns" },
    { key: "reach", icon: <FiBarChart2 />, tone: s.icPurple, value: formatMetric(reach), label: "Total Reach", trend: <ChangePill value={data.reports.reach.change} />, sub: "Across all campaigns" },
    { key: "leads", icon: <FiUsers />, tone: s.icTeal, value: leads.toLocaleString("en-IN"), label: "Total Leads", trend: <ChangePill value={data.stats.leadsChange} />, sub: "From paid campaigns" },
    { key: "cpl", icon: <FiTarget />, tone: s.icRed, value: cpl ? formatINR(cpl) : "—", label: "Avg. Cost Per Lead", trend: <ChangePill value={cplChange} goodWhenDown />, sub: "Across all campaigns", hideMobile: true },
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
              {c.trend}
            </div>
            <span className={s.statSub}>{c.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

interface Filters {
  q: string;
  type: string;
  platform: string;
  status: string;
  goal: string;
  from: string;
  to: string;
}
const EMPTY: Filters = { q: "", type: "", platform: "", status: "", goal: "", from: "", to: "" };

function DateRangeButton({ f, setF, compact }: { f: Filters; setF: (p: Partial<Filters>) => void; compact?: boolean }) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const label = f.from || f.to ? `${f.from ? formatShortDate(f.from) : "…"} – ${f.to ? formatShortDate(f.to) : "…"}` : compact ? "Date" : "Select date range";
  return (
    <>
      <button
        type="button"
        className={`${compact ? s.chipSelect : s.rangeBtn} ${f.from || f.to ? s.filterOn : ""}`}
        onClick={(e) => (anchor ? setAnchor(null) : setAnchor(anchorAt(e.currentTarget, 260, 170)))}
        aria-expanded={!!anchor}
      >
        <FiCalendar />
        <span>{label}</span>
      </button>
      {anchor && (
        <Popover anchor={anchor} width={260} onClose={() => setAnchor(null)} onReposition={setAnchor} label="Date range">
          <div className={s.rangePop}>
            <label>
              From
              <input type="date" value={f.from} max={f.to || undefined} onChange={(e) => setF({ from: e.target.value })} />
            </label>
            <label>
              To
              <input type="date" value={f.to} min={f.from || undefined} onChange={(e) => setF({ to: e.target.value })} />
            </label>
            <div className={s.rangeActions}>
              <button type="button" className={s.btnChip} onClick={() => setF({ from: "", to: "" })}>Clear</button>
              <button type="button" className={s.btnPrimarySm} onClick={() => setAnchor(null)}>Done</button>
            </div>
          </div>
        </Popover>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Row ⋮ menu                                                          */
/* ------------------------------------------------------------------ */

function RowMenu({ c, onDelete }: { c: Campaign; onDelete: (c: Campaign) => void }) {
  const { openModal } = useClient();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  return (
    <>
      <button
        type="button"
        className={s.kebab}
        aria-label={`Actions for ${c.name}`}
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={(e) => (anchor ? setAnchor(null) : setAnchor(anchorAt(e.currentTarget, 150, 92)))}
      >
        <FiMoreVertical />
      </button>
      {anchor && (
        <Popover anchor={anchor} width={150} onClose={() => setAnchor(null)} closeOnScroll label={`Actions for ${c.name}`}>
          <div className={s.rowMenu} role="menu">
            <button type="button" role="menuitem" onClick={() => { setAnchor(null); openModal("editCampaign", c.id); }}>
              <FiEdit2 /> Edit
            </button>
            <button type="button" role="menuitem" className={s.menuDanger} onClick={() => { setAnchor(null); onDelete(c); }}>
              <FiTrash2 /> Delete
            </button>
          </div>
        </Popover>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Table (desktop / tablet) & cards (phone)                            */
/* ------------------------------------------------------------------ */

function RunBy({ name }: { name?: string }) {
  const { data } = useClient();
  const m = data.team.find((t) => t.name === name);
  return (
    <span className={s.runByCell}>
      <Avatar src={m?.avatar ?? null} name={name ?? "Team"} size={26} />
      <span>{name ?? "—"}</span>
    </span>
  );
}

function CampaignTable({
  rows, selected, toggle, toggleAll, onDelete, onReset,
}: {
  rows: Campaign[]; selected: string[]; toggle: (id: string) => void; toggleAll: () => void; onDelete: (c: Campaign) => void; onReset: () => void;
}) {
  const { asOfDate } = useClient();
  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  return (
    <div className={`${s.card} ${s.cTableCard}`}>
      <div className={s.tableScroll}>
        <table className={s.cTable}>
          <thead>
            <tr>
              <th className={s.cCheck}>
                <input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all campaigns" />
              </th>
              <th>Campaign Name</th>
              <th>Platform</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Budget</th>
              <th>Spent</th>
              <th>Goal</th>
              <th>Result</th>
              <th>Status</th>
              <th>Run By</th>
              <th className={s.cActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const on = selected.includes(c.id);
              return (
                <tr key={c.id} className={on ? s.rowSelected : ""}>
                  <td className={s.cCheck}>
                    <input type="checkbox" checked={on} onChange={() => toggle(c.id)} aria-label={`Select ${c.name}`} />
                  </td>
                  <td>
                    <div className={s.cName}>
                      <div className={s.cThumb}><Thumb src={c.thumbnail ?? null} label={c.name} /></div>
                      <div>
                        <strong>{c.name}</strong>
                        {c.category && <small>{c.category}</small>}
                      </div>
                    </div>
                  </td>
                  <td><PlatformIcons list={c.platforms} /></td>
                  <td><span className={`${s.typePill} ${TYPE_CLASS[c.type] ?? s.tyOther}`}>{c.type}</span></td>
                  <td>
                    <div className={s.duration}>
                      <FiCalendar />
                      <span>{formatDate(c.startDate)}<br />{formatDate(c.endDate)}</span>
                    </div>
                  </td>
                  <td className={s.strong}>{formatINR(c.budget)}</td>
                  <td><SpentBar c={c} /></td>
                  <td className={s.strong}>{c.goal ?? "—"}</td>
                  <td>
                    <div className={s.resultCell}>
                      <strong>{campaignResult(c)}</strong>
                      {c.startDate <= asOfDate && <ChangePill value={c.resultChange} />}
                    </div>
                  </td>
                  <td><StatusBadge status={campaignStatus(c, asOfDate)} /></td>
                  <td><RunBy name={c.runBy} /></td>
                  <td className={s.cActions}><RowMenu c={c} onDelete={onDelete} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className={s.empty}>
                  No campaigns match these filters. <LinkBtn onClick={onReset}>Reset filters</LinkBtn>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CampaignCards({ rows, onDelete, onReset }: { rows: Campaign[]; onDelete: (c: Campaign) => void; onReset: () => void }) {
  const { asOfDate } = useClient();
  return (
    <div className={s.cCards}>
      {rows.map((c) => {
        const cpl = campaignCPL(c);
        const status = campaignStatus(c, asOfDate);
        return (
          <article key={c.id} className={s.cCard}>
            <div className={s.cCardHead}>
              <div className={s.cCardThumb}><Thumb src={c.thumbnail ?? null} label={c.name} /></div>
              <div className={s.cCardMain}>
                <StatusBadge status={status} />
                <div className={s.cCardTitle}>
                  <strong>{c.name}</strong>
                  <PlatformIcons list={c.platforms} />
                </div>
                {c.category && <small>{c.category}</small>}
              </div>
              <div className={s.cCardSide}>
                <span><FiCalendar /> {formatShortDate(c.startDate)} – {formatDate(c.endDate)}</span>
                <small>{campaignTimeLeft(c, asOfDate)}</small>
              </div>
              <RowMenu c={c} onDelete={onDelete} />
            </div>
            <div className={s.cCardStats}>
              <div><strong>{formatINR(c.budget)}</strong><small>Budget</small></div>
              <div className={s.cCardSpent}>
                <strong>{formatINR(c.spent ?? 0)}</strong>
                <small>Spent ({campaignSpentPct(c)}%)</small>
                <div className={s.bar}><i style={{ width: `${campaignSpentPct(c)}%` }} /></div>
              </div>
              <div><strong>{c.leads ?? 0}</strong><small>{c.resultUnit ?? "Leads"}</small></div>
              <div><strong>{cpl ? formatINR(cpl) : "—"}</strong><small>CPL</small></div>
              <div><strong>{c.ctr !== undefined ? `${c.ctr}%` : "—"}</strong><small>CTR</small></div>
              <div className={s.cCardResult}>
                <small>Result</small>
                <strong>{campaignResult(c)}</strong>
                {c.startDate <= asOfDate && <ChangePill value={c.resultChange} />}
              </div>
            </div>
          </article>
        );
      })}
      {rows.length === 0 && (
        <p className={s.empty}>
          No campaigns match these filters. <LinkBtn onClick={onReset}>Reset</LinkBtn>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom cards                                                        */
/* ------------------------------------------------------------------ */

type TrendMetric = "spend" | "reach" | "leads" | "conversions";
const TREND_META: Record<TrendMetric, { name: string; color: string; fmt: (n: number) => string }> = {
  spend: { name: "Spend (₹)", color: SERIES.blue, fmt: (n) => formatINR(n) },
  reach: { name: "Reach", color: SERIES.purple, fmt: (n) => formatMetric(n) },
  leads: { name: "Leads", color: SERIES.orange, fmt: (n) => n.toLocaleString("en-IN") },
  conversions: { name: "Conversions", color: SERIES.green, fmt: (n) => n.toLocaleString("en-IN") },
};

function PerformanceTrendCard({ all }: { all: Campaign[] }) {
  const { asOfDate } = useClient();
  const [months, setMonths] = useState(9);
  const [metric, setMetric] = useState<TrendMetric>("spend");
  const rows = useMemo(() => campaignTrend(all, asOfDate, months), [all, asOfDate, months]);
  const meta = TREND_META[metric];
  const total = rows.reduce((a, r) => a + r[metric], 0);
  const series = [{ key: metric, name: meta.name, color: meta.color }];

  return (
    <Card
      title="Campaign Performance Trend"
      icon={<FiTrendingUp />}
      action={
        <select className={s.select} value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Trend range">
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={9}>Last 9 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
      }
    >
      <Segmented
        className={s.segFull}
        value={metric}
        onChange={setMetric}
        options={(Object.keys(TREND_META) as TrendMetric[]).map((k) => ({
          value: k,
          label: (
            <span className={s.metricTab}>
              <i style={{ background: TREND_META[k].color }} />
              {TREND_META[k].name}
            </span>
          ),
        }))}
      />
      <p className={s.trendTotal}>
        <strong>{meta.fmt(total)}</strong> {meta.name.replace(" (₹)", "").toLowerCase()} in the last {months} months
      </p>
      {metric === "spend" ? <GroupedBars rows={rows} series={series} height={190} /> : <MultiArea rows={rows} series={series} height={190} />}
    </Card>
  );
}

function GoalDistributionCard({ all }: { all: Campaign[] }) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    all.forEach((c) => {
      const k = (CAMPAIGN_OBJECTIVES as readonly string[]).includes(c.type) ? c.type : "Others";
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return [...CAMPAIGN_OBJECTIVES, "Others"].filter((k) => m.get(k)).map((k) => ({ name: k, value: m.get(k) ?? 0, color: OBJECTIVE_COLOR[k] }));
  }, [all]);

  return (
    <Card title="Campaign Goal Distribution" icon={<FiTarget />}>
      <div className={s.goalBody}>
        <div className={s.goalDonut}>
          <Donut total={all.length} parts={counts} label="Campaigns" />
        </div>
        <ul className={s.goalLegend}>
          {counts.map((c) => (
            <li key={c.name}>
              <i style={{ background: c.color }} />
              <span>{c.name}</span>
              <strong>{c.value}</strong>
            </li>
          ))}
          {counts.length === 0 && <li className={s.textMuted}>No campaigns yet</li>}
        </ul>
      </div>
    </Card>
  );
}

function rankLine(c: Campaign) {
  const cpl = campaignCPL(c);
  if (c.resultMetric === "reach") return `${formatMetric(c.reach ?? 0)} Reach | ${c.ctr ?? 0}% CTR`;
  return `${(c.leads ?? 0).toLocaleString("en-IN")} ${c.resultUnit ?? "Leads"}${cpl ? ` | ${formatINR(cpl)} CPL` : ""}`;
}

function TopPerformingCard({ all }: { all: Campaign[] }) {
  const [showAll, setShowAll] = useState(false);
  const ranked = useMemo(() => all.filter((c) => (c.spent ?? 0) > 0).sort((a, b) => campaignScore(b) - campaignScore(a)), [all]);
  return (
    <Card title="Top Performing Campaigns" icon={<FaTrophy />} action={ranked.length > 3 && <LinkBtn onClick={() => setShowAll(true)}>View All</LinkBtn>}>
      <ol className={s.topList}>
        {ranked.slice(0, 3).map((c, i) => (
          <li key={c.id}>
            <span className={s.rank}>{i + 1}</span>
            <div className={s.topThumb}><Thumb src={c.thumbnail ?? null} label={c.name} /></div>
            <div className={s.topMain}>
              <strong>{c.name}</strong>
              <small>{rankLine(c)}</small>
            </div>
            <ChangePill value={c.resultChange} />
          </li>
        ))}
        {ranked.length === 0 && <li className={s.textMuted}>No results yet</li>}
      </ol>
      {showAll && (
        <Modal title="Campaign Ranking" onClose={() => setShowAll(false)} wide>
          <p className={s.formHint}>Ranked by results per ₹ spent.</p>
          <ol className={s.topList}>
            {ranked.map((c, i) => (
              <li key={c.id}>
                <span className={s.rank}>{i + 1}</span>
                <div className={s.topThumb}><Thumb src={c.thumbnail ?? null} label={c.name} /></div>
                <div className={s.topMain}>
                  <strong>{c.name}</strong>
                  <small>{rankLine(c)} · Spent {formatINR(c.spent ?? 0)}</small>
                </div>
                <ChangePill value={c.resultChange} />
              </li>
            ))}
          </ol>
        </Modal>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Tab                                                                 */
/* ------------------------------------------------------------------ */

export default function CampaignsTab() {
  const { data, asOfDate, openModal, deleteCampaigns, showToast, setTab } = useClient();
  const [bucket, setBucket] = useState<CampaignBucket>("current");
  const [f, setFState] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<Campaign[] | null>(null);
  const [sheet, setSheet] = useState(false);

  // past → current → upcoming (Object.values keeps that order)
  const all = useMemo(() => Object.values(data.campaigns).flat(), [data.campaigns]);
  const setF = (patch: Partial<Filters>) => {
    setFState((x) => ({ ...x, ...patch }));
    setSelected([]);
  };
  const reset = () => {
    setFState(EMPTY);
    setSelected([]);
  };
  const activeFilters = Object.values(f).filter(Boolean).length;

  const goalOptions = useMemo(() => [...new Set(all.map((c) => goalKind(c.goal)).filter(Boolean))].sort(), [all]);

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return data.campaigns[bucket].filter((c) => {
      if (q && !`${c.name} ${c.category ?? ""} ${c.type} ${c.runBy ?? ""}`.toLowerCase().includes(q)) return false;
      if (f.type && c.type !== f.type) return false;
      if (f.platform && !c.platforms?.includes(f.platform as Platform)) return false;
      if (f.status && campaignStatus(c, asOfDate) !== f.status) return false;
      if (f.goal && goalKind(c.goal) !== f.goal) return false;
      if (f.from && c.endDate < f.from) return false; // campaign must overlap the range
      if (f.to && c.startDate > f.to) return false;
      return true;
    });
  }, [data.campaigns, bucket, f, asOfDate]);

  const toggle = (id: string) => setSelected((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  const toggleAll = () => setSelected((x) => (rows.every((r) => x.includes(r.id)) ? [] : rows.map((r) => r.id)));
  const askDelete = (c: Campaign) => setConfirm([c]);
  const doDelete = () => {
    if (!confirm) return;
    const ids = confirm.map((c) => c.id);
    deleteCampaigns(ids);
    setSelected((x) => x.filter((id) => !ids.includes(id)));
    showToast(ids.length > 1 ? `${ids.length} campaigns deleted` : "Campaign deleted");
    setConfirm(null);
  };

  const selectEl = (key: keyof Filters, label: string, options: { value: string; label: string }[], allLabel: string, chip = false) => (
    <label className={chip ? s.chipWrap : s.filterField}>
      {!chip && <span>{label}</span>}
      <select
        className={`${chip ? s.chipSelect : s.filterSelect} ${f[key] ? s.filterOn : ""}`}
        value={f[key]}
        onChange={(e) => setF({ [key]: e.target.value })}
        aria-label={label}
      >
        <option value="">{chip ? label : allLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  const typeOpts = CAMPAIGN_OBJECTIVES.map((o) => ({ value: o, label: o }));
  const platformOpts = (["facebook", "instagram", "gmb"] as Platform[]).map((p) => ({ value: p, label: PLATFORM[p].name }));
  const statusOpts = (["Active", "Paused", "Completed", "Scheduled"] as CampaignStatus[]).map((x) => ({ value: x, label: x }));
  const goalOpts = goalOptions.map((g) => ({ value: g, label: g }));

  return (
    <div className={s.campaignsTab}>
      <CampaignKpis all={all} />

      {/* Past / Current / Upcoming + Add */}
      <div className={s.bucketRow}>
        <Segmented
          className={s.bucketTabs}
          value={bucket}
          onChange={(b) => { setBucket(b); setSelected([]); }}
          options={[
            { value: "past", label: <><span className={s.longLabel}>Past Campaigns</span><span className={s.shortLabel}>Past</span> ({data.campaigns.past.length})</> },
            { value: "current", label: <><span className={s.longLabel}>Current Campaigns</span><span className={s.shortLabel}>Current</span> ({data.campaigns.current.length})</> },
            { value: "upcoming", label: <><span className={s.longLabel}>Upcoming Campaigns</span><span className={s.shortLabel}>Upcoming</span> ({data.campaigns.upcoming.length})</> },
          ]}
        />
        <button type="button" className={`${s.btnPrimary} ${s.addCampaignBtn}`} onClick={() => openModal("addCampaign")}>
          <FiPlus /> Add New Campaign
        </button>
      </div>

      {/* Desktop / tablet filters */}
      <div className={s.filterBar}>
        <label className={s.searchBox}>
          <FiSearch />
          <input value={f.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Search campaigns..." aria-label="Search campaigns" />
          {f.q && <button type="button" onClick={() => setF({ q: "" })} aria-label="Clear search"><FiX /></button>}
        </label>
        {selectEl("type", "Campaign Type", typeOpts, "All Types")}
        {selectEl("platform", "Platform", platformOpts, "All Platforms")}
        {selectEl("status", "Status", statusOpts, "All Status")}
        {selectEl("goal", "Goal", goalOpts, "All Goals")}
        <div className={s.filterField}>
          <span>&nbsp;</span>
          <DateRangeButton f={f} setF={setF} />
        </div>
        <div className={s.filterField}>
          <span>&nbsp;</span>
          <button type="button" className={s.resetBtn} onClick={reset} disabled={!activeFilters}>
            <FiRefreshCw /> Reset
          </button>
        </div>
      </div>

      {/* Phone filters */}
      <div className={s.mFilterBar}>
        <button type="button" className={`${s.chipSelect} ${activeFilters ? s.filterOn : ""}`} onClick={() => setSheet(true)}>
          <FiFilter /> Filter{activeFilters ? ` (${activeFilters})` : ""}
        </button>
        {selectEl("type", "Campaign Type", typeOpts, "All Types", true)}
        {selectEl("platform", "Platform", platformOpts, "All Platforms", true)}
        {selectEl("status", "Status", statusOpts, "All Status", true)}
        <DateRangeButton f={f} setF={setF} compact />
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className={s.bulkBar} role="status">
          <span><strong>{selected.length}</strong> selected</span>
          <div>
            <button type="button" className={s.btnOutlineSm} onClick={() => setSelected([])}>Clear</button>
            <button type="button" className={s.btnDangerSm} onClick={() => setConfirm(all.filter((c) => selected.includes(c.id)))}>
              <FiTrash2 /> Delete selected
            </button>
          </div>
        </div>
      )}

      <CampaignTable rows={rows} selected={selected} toggle={toggle} toggleAll={toggleAll} onDelete={askDelete} onReset={reset} />
      <CampaignCards rows={rows} onDelete={askDelete} onReset={reset} />

      <div className={s.campaignBottom}>
        <div className={s.cbTrend}><PerformanceTrendCard all={all} /></div>
        <div className={s.cbGoal}><GoalDistributionCard all={all} /></div>
        <div className={s.cbTop}><TopPerformingCard all={all} /></div>
      </div>

      {/* Phone sticky actions */}
      <div className={s.mActionBar}>
        <button type="button" className={s.btnPrimary} onClick={() => openModal("addCampaign")}><FiPlus /> Add New Campaign</button>
        <button type="button" className={s.btnOutline} onClick={() => setTab("reports")}><FiBarChart2 /> View Reports</button>
      </div>

      {/* Phone filter sheet */}
      {sheet && (
        <Modal
          title="Filter Campaigns"
          onClose={() => setSheet(false)}
          footer={
            <>
              <button type="button" className={s.btnOutline} onClick={reset}>Reset</button>
              <button type="button" className={s.btnPrimary} onClick={() => setSheet(false)}>Show {rows.length} result{rows.length === 1 ? "" : "s"}</button>
            </>
          }
        >
          <div className={s.sheetFields}>
            <label className={s.searchBox}>
              <FiSearch />
              <input value={f.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Search campaigns..." aria-label="Search campaigns" />
            </label>
            {selectEl("type", "Campaign Type", typeOpts, "All Types")}
            {selectEl("platform", "Platform", platformOpts, "All Platforms")}
            {selectEl("status", "Status", statusOpts, "All Status")}
            {selectEl("goal", "Goal", goalOpts, "All Goals")}
            <div className={s.sheetDates}>
              <label className={s.filterField}><span>From</span><input type="date" className={s.filterSelect} value={f.from} max={f.to || undefined} onChange={(e) => setF({ from: e.target.value })} /></label>
              <label className={s.filterField}><span>To</span><input type="date" className={s.filterSelect} value={f.to} min={f.from || undefined} onChange={(e) => setF({ to: e.target.value })} /></label>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirm && (
        <Modal
          title={confirm.length > 1 ? `Delete ${confirm.length} campaigns?` : "Delete campaign?"}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button type="button" className={s.btnOutline} onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className={s.btnDanger} onClick={doDelete}><FiTrash2 /> Delete</button>
            </>
          }
        >
          <p className={s.confirmText}>
            {confirm.length > 1 ? (
              <>These campaigns will be permanently removed: <strong>{confirm.map((c) => c.name).join(", ")}</strong>.</>
            ) : (
              <><strong>{confirm[0].name}</strong> will be permanently removed.</>
            )}{" "}
            This can&apos;t be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
