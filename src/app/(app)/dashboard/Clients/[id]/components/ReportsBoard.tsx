"use client";
// Path: src/app/dashboard/Clients/[id]/components/ReportsBoard.tsx
// Dark "Client Performance Board" – every number comes from the client store (useClient),
// so it follows the selected client AND the "as of" date picker.
//
//  ┌ Overall Progress ┐┌──────── Service Pipeline ────────┐┌ Contract Renewal ┐
//  ┌ Ad Spend ────────┐┌ Campaign Budget ──┐┌ Overdue Tasks ──────────────────┐
//  ┌ Content Output ──┐┌ Leads by Team ────┐┌ Results vs Goal per Campaign ───┐

import { useMemo, type ReactNode } from "react";
import { FiCheck, FiClock, FiFlag, FiZap } from "react-icons/fi";
import { campaignStatus, daysBetween, formatDate, formatINR, type Campaign } from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import { Avatar } from "./ui";
import b from "./ReportsBoard.module.css";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const COLORS = { yellow: "#f6b21b", green: "#16a37a", red: "#e5395a", blue: "#3b82f6", purple: "#8b5cf6", grey: "#cbd2e6" };

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pctOf = (a: number, total: number) => (total ? (a / total) * 100 : 0);
const compactINR = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (a >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
const compact = (n: number) => (n >= 1e5 ? `${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n)));
/** "150 Leads" → 150 */
const goalTarget = (c: Campaign) => {
  const m = c.goal?.match(/^([\d.,]+)/);
  return m ? Number(m[1].replace(/,/g, "")) : 0;
};
const shortName = (name: string, max = 16) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

/* ------------------------------------------------------------------ */
/* Small visuals                                                       */
/* ------------------------------------------------------------------ */

function Panel({ title, area, glow, children, extra }: { title: string; area: string; glow?: boolean; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className={`${b.card} ${area} ${glow ? b.glow : ""}`}>
      {(title || extra) && (
        <header className={b.head}>
          <h3>{title}</h3>
          {extra}
        </header>
      )}
      {children}
    </section>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 70;
  const len = Math.PI * r;
  const v = clamp(value);
  return (
    <svg viewBox="0 0 180 104" className={b.gauge} role="img" aria-label={`${Math.round(v)}% complete`}>
      <path d="M20 92 A70 70 0 0 1 160 92" className={b.gaugeTrack} />
      <path d="M20 92 A70 70 0 0 1 160 92" className={b.gaugeFill} strokeDasharray={`${(len * v) / 100} ${len}`} />
      <text x="90" y="88" textAnchor="middle" className={b.gaugeText}>
        {Math.round(v)}%
      </text>
    </svg>
  );
}

function Ring({ value, color }: { value: number; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className={b.ring} aria-hidden>
      <circle cx="28" cy="28" r={r} className={b.ringTrack} />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(c * clamp(value)) / 100} ${c}`}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32" textAnchor="middle" className={b.ringText}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

type StageState = { kind: "done" } | { kind: "progress"; value: number } | { kind: "waiting" } | { kind: "live"; value: number };

function StageIcon({ state, color }: { state: StageState; color: string }) {
  if (state.kind === "done")
    return (
      <span className={b.stageDot} style={{ background: color }}>
        <FiCheck />
      </span>
    );
  if (state.kind === "waiting")
    return (
      <span className={`${b.stageDot} ${b.stageWait}`}>
        <FiClock />
      </span>
    );
  return <Ring value={state.value} color={state.kind === "live" ? COLORS.green : COLORS.purple} />;
}

/** Horizontal bar with value badge at the end (like the reference) */
function HBar({ label, value, max, color, badge, marker }: { label: string; value: number; max: number; color: string; badge: string; marker?: number }) {
  const w = clamp(pctOf(value, max));
  return (
    <div className={b.hRow} title={`${label}: ${badge}`}>
      <span className={b.hLabel}>{label}</span>
      <div className={b.hTrack}>
        <div className={b.hFill} style={{ width: `${w}%`, background: color }} />
        {marker !== undefined && <i className={b.hMarker} style={{ left: `${clamp(pctOf(marker, max))}%` }} />}
        <span className={b.hBadge} style={{ left: `${w}%`, background: color }}>
          {badge}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Board                                                               */
/* ------------------------------------------------------------------ */

export default function ReportsBoard() {
  const { data, asOfDate } = useClient();

  const m = useMemo(() => {
    const campaigns: Campaign[] = Object.values(data.campaigns).flat();
    const posts = Object.values(data.calendar).flat();

    // Contract timeline
    const start = data.info.startDate;
    const end = data.info.endDate;
    const contractDays = Math.max(1, daysBetween(start, end));
    const elapsedPct = clamp(pctOf(daysBetween(start, asOfDate), contractDays));
    const daysLeft = daysBetween(asOfDate, end);

    // Deliverables
    const { delivered, pending } = data.creatives;
    const creativesPct = pctOf(delivered, delivered + pending);
    const published = posts.filter((p) => p.status === "Published").length;
    const postsPct = pctOf(published, posts.length);

    // Campaigns
    const statuses = campaigns.map((c) => campaignStatus(c, asOfDate));
    const completed = statuses.filter((s) => s === "Completed").length;
    const live = statuses.filter((s) => s === "Active").length;
    const campaignsPct = pctOf(completed, campaigns.length);

    const overall = (creativesPct + postsPct + campaignsPct) / 3;

    // Money
    const budget = campaigns.reduce((a, c) => a + (c.budget || 0), 0);
    const spent = campaigns.reduce((a, c) => a + (c.spent ?? 0), 0);
    const expected = campaigns.reduce((a, c) => {
      const len = Math.max(1, daysBetween(c.startDate, c.endDate));
      const ran = clamp(pctOf(daysBetween(c.startDate, asOfDate), len)) / 100;
      return a + (c.budget || 0) * ran;
    }, 0);
    const pace = expected ? (spent / expected - 1) * 100 : 0;

    // Tasks
    const openTasks = data.tasks.filter((t) => !t.done);
    const overdue = openTasks
      .filter((t) => t.due < asOfDate)
      .sort((x, y) => x.due.localeCompare(y.due))
      .map((t) => ({ ...t, days: daysBetween(t.due, asOfDate) }));
    const upcoming = openTasks
      .filter((t) => t.due >= asOfDate)
      .sort((x, y) => x.due.localeCompare(y.due))
      .map((t) => ({ ...t, days: daysBetween(asOfDate, t.due) }));

    // Leads by person who runs the campaign
    const byPerson = new Map<string, number>();
    campaigns.forEach((c) => {
      const who = c.runBy ?? "Team";
      byPerson.set(who, (byPerson.get(who) ?? 0) + (c.leads ?? 0));
    });
    const people = [...byPerson.entries()].map(([name, leads]) => ({ name, leads })).sort((x, y) => y.leads - x.leads);

    // Results vs goal
    const goals = campaigns
      .filter((c) => c.startDate <= asOfDate)
      .map((c) => ({ id: c.id, name: c.name, result: c.leads ?? c.results ?? 0, target: goalTarget(c), status: campaignStatus(c, asOfDate) }))
      .sort((x, y) => (x.status === "Active" ? -1 : 0) - (y.status === "Active" ? -1 : 0) || y.result - x.result)
      .slice(0, 6);

    // Content mix
    const mix = ["Static", "Reel", "Carousel", "Story"].map((type) => ({ type, count: posts.filter((p) => p.type === type).length }));
    const nextPost = [...posts].filter((p) => p.date >= asOfDate && p.status !== "Published").sort((x, y) => `${x.date}${x.time}`.localeCompare(`${y.date}${y.time}`))[0];

    return {
      campaigns, posts, start, end, elapsedPct, daysLeft, delivered, pending, creativesPct, published, postsPct,
      completed, live, campaignsPct, overall, budget, spent, expected, pace, overdue, upcoming, people, goals, mix, nextPost,
    };
  }, [data, asOfDate]);

  /* ---------- pipeline stages ---------- */
  const stages: { name: string; state: StageState; note: string; color: string }[] = [
    { name: "Onboarding", state: asOfDate >= m.start ? { kind: "done" } : { kind: "waiting" }, note: asOfDate >= m.start ? "Completed" : "Starts soon", color: COLORS.blue },
    {
      name: "Creatives",
      state: m.creativesPct >= 100 ? { kind: "done" } : { kind: "progress", value: m.creativesPct },
      note: m.creativesPct >= 100 ? "Completed" : `${m.pending} pending`,
      color: COLORS.green,
    },
    {
      name: "Campaigns",
      state:
        m.campaigns.length && m.completed === m.campaigns.length
          ? { kind: "done" }
          : m.live > 0
            ? { kind: "live", value: m.campaignsPct }
            : m.campaigns.length
              ? { kind: "progress", value: m.campaignsPct }
              : { kind: "waiting" },
      note: m.live > 0 ? `${m.live} running` : m.campaigns.length ? `${m.completed}/${m.campaigns.length} done` : "Not started",
      color: COLORS.green,
    },
    {
      name: "Reporting",
      state: m.elapsedPct >= 100 ? { kind: "done" } : { kind: "waiting" },
      note: m.elapsedPct >= 100 ? "Completed" : "Waiting",
      color: COLORS.blue,
    },
  ];

  /* ---------- budget chart ---------- */
  const budgetBars = [
    { label: "Total Budget", value: m.budget, color: COLORS.blue },
    { label: "Amount Spent", value: m.spent, color: COLORS.yellow },
    { label: "Expected by Today", value: m.expected, color: COLORS.red },
  ];
  const bMax = Math.max(1, ...budgetBars.map((x) => x.value)) * 1.1;
  const over = m.pace > 0;

  const spendBars = m.campaigns.filter((c) => (c.spent ?? 0) > 0).slice(-8);
  const spendMax = Math.max(1, ...spendBars.map((c) => c.spent ?? 0));
  const mixMax = Math.max(1, ...m.mix.map((x) => x.count));
  const leadsMax = Math.max(1, ...m.people.map((p) => p.leads));
  const goalMax = Math.max(1, ...m.goals.map((g) => Math.max(g.result, g.target)));
  const memberAvatar = (name: string) => data.team.find((t) => t.name === name)?.avatar ?? null;

  const taskRows = m.overdue.length ? m.overdue : m.upcoming;
  const showingOverdue = m.overdue.length > 0;

  return (
    <div className={b.board}>
      {/* ── Overall progress ── */}
      <Panel title="Overall Progress" area={b.aProg}>
        <div className={b.center}>
          <Gauge value={m.overall} />
        </div>
        <ul className={b.miniLegend}>
          <li><i style={{ background: COLORS.green }} />Creatives <strong>{Math.round(m.creativesPct)}%</strong></li>
          <li><i style={{ background: COLORS.blue }} />Posts <strong>{Math.round(m.postsPct)}%</strong></li>
          <li><i style={{ background: COLORS.yellow }} />Campaigns <strong>{Math.round(m.campaignsPct)}%</strong></li>
        </ul>
      </Panel>

      {/* ── Service pipeline ── */}
      <Panel title="" area={b.aStages} glow>
        <div className={b.timeline} title={`${Math.round(m.elapsedPct)}% of contract period`}>
          <div className={b.timelineFill} style={{ width: `${m.elapsedPct}%` }} />
        </div>
        <div className={b.timelineMeta}>
          <span>{formatDate(m.start)}</span>
          <strong>{Math.round(m.elapsedPct)}% of contract period</strong>
          <span>{formatDate(m.end)}</span>
        </div>
        <ol className={b.stages}>
          {stages.map((st) => (
            <li key={st.name}>
              <span className={b.stageName}>{st.name}</span>
              <StageIcon state={st.state} color={st.color} />
              <span className={b.stageNote}>{st.note}</span>
            </li>
          ))}
        </ol>
      </Panel>

      {/* ── Contract renewal ── */}
      <Panel title="Contract Renewal" area={b.aRenew}>
        <div className={b.renew}>
          <FiFlag className={b.flag} />
          <div>
            <small>{formatDate(m.end)}</small>
            <strong>{m.daysLeft >= 0 ? `${m.daysLeft} Days` : "Expired"}</strong>
            <span className={m.daysLeft <= 30 ? b.warnText : b.mutedText}>
              {m.daysLeft < 0 ? `${Math.abs(m.daysLeft)} days ago` : m.daysLeft <= 30 ? "Renewal due soon" : data.info.package}
            </span>
          </div>
        </div>
      </Panel>

      {/* ── Ad spend ── */}
      <Panel title="Ad Spend Overview" area={b.aSpend}>
        <p className={b.bigLabel}>Spend</p>
        <div className={b.kv}>
          <div><small>SPENT</small><strong>{compactINR(m.spent)}</strong></div>
          <div><small>BUDGET</small><strong>{compactINR(m.budget)}</strong></div>
        </div>
        <p className={b.pctLine}><strong>{pctOf(m.spent, m.budget).toFixed(1)} %</strong> OF BUDGET</p>
        <div className={b.segBar}>
          <div className={b.segFill} style={{ width: `${clamp(pctOf(m.spent, m.budget))}%` }} />
          {[25, 50, 75].map((t) => (
            <span key={t} className={b.segTick} style={{ left: `${t}%` }}>{t}%</span>
          ))}
        </div>
        <p className={b.smallCaps}>Per campaign</p>
        <div className={b.miniBars}>
          {spendBars.map((c) => (
            <span key={c.id} title={`${c.name}: ${formatINR(c.spent ?? 0)}`} style={{ height: `${Math.max(8, pctOf(c.spent ?? 0, spendMax))}%` }} />
          ))}
          {spendBars.length === 0 && <em className={b.mutedText}>No spend yet</em>}
        </div>
      </Panel>

      {/* ── Campaign budget ── */}
      <Panel title="Campaign Budget" area={b.aBudget}>
        <div className={b.budget}>
          <div className={b.budgetChart}>
            <div className={b.yAxis}>
              {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                <span key={f}>{compact((bMax * f) / 1000)}</span>
              ))}
            </div>
            <div className={b.columns}>
              {budgetBars.map((x) => (
                <div key={x.label} className={b.colWrap} title={`${x.label}: ${formatINR(Math.round(x.value))}`}>
                  <div className={b.col} style={{ height: `${pctOf(x.value, bMax)}%`, background: x.color }} />
                </div>
              ))}
            </div>
            <span className={b.yTitle}>₹ (thousands)</span>
          </div>
          <div className={b.budgetSide}>
            <div><small>Total Budget</small><strong>{formatINR(m.budget)}</strong></div>
            <div><small>Remaining</small><strong>{formatINR(Math.max(0, m.budget - m.spent))}</strong></div>
            <div>
              <small>Currently</small>
              <strong className={over ? b.redText : b.greenText}>
                {Math.abs(m.pace).toFixed(1)}% <em>{over ? "Over Pace" : "Under Pace"}</em>
              </strong>
            </div>
          </div>
        </div>
        <ul className={b.legend}>
          {budgetBars.map((x) => (
            <li key={x.label}><i style={{ background: x.color }} />{x.label}</li>
          ))}
        </ul>
      </Panel>

      {/* ── Overdue tasks ── */}
      <Panel
        title={showingOverdue ? "Overdue Tasks" : "Upcoming Tasks"}
        area={b.aTasks}
        extra={showingOverdue ? <span className={b.countBadge}>{m.overdue.length}</span> : <span className={b.okBadge}><FiCheck /> Nothing overdue</span>}
      >
        <div className={b.tableWrap}>
          <table className={b.table}>
            <thead>
              <tr>
                <th>{showingOverdue ? "Overdue" : "Due In"}</th>
                <th>Task</th>
                <th>Deadline</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {taskRows.slice(0, 6).map((t) => (
                <tr key={t.id}>
                  <td className={showingOverdue ? (t.days > 7 ? b.redText : b.yellowText) : b.greenText}>
                    <strong>{t.days === 0 ? "Today" : `${t.days} Day${t.days > 1 ? "s" : ""}`}</strong>
                  </td>
                  <td className={b.taskName}>{t.title}</td>
                  <td>{formatDate(t.due)}</td>
                  <td>
                    <span className={b.owner}>
                      <Avatar src={memberAvatar(t.assignee)} name={t.assignee} size={22} />
                      {t.assignee}
                    </span>
                  </td>
                </tr>
              ))}
              {taskRows.length === 0 && (
                <tr>
                  <td colSpan={4} className={b.emptyCell}>All tasks are done 🎉</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Content output ── */}
      <Panel title="Content Output" area={b.aOutput}>
        <p className={b.bigLabel}>Posts</p>
        <div className={b.kv}>
          <div><small>PUBLISHED</small><strong>{data.stats.postsPublished}</strong></div>
          <div><small>THIS PERIOD</small><strong>{m.published}/{m.posts.length}</strong></div>
        </div>
        <div className={b.mixList}>
          {m.mix.map((x) => (
            <div key={x.type} className={b.mixRow}>
              <span>{x.type}</span>
              <div className={b.mixTrack}><div style={{ width: `${pctOf(x.count, mixMax)}%` }} /></div>
              <strong>{x.count}</strong>
            </div>
          ))}
        </div>
        {m.nextPost && (
          <p className={b.nextPost}>
            <FiZap /> Next: <strong>{m.nextPost.title}</strong> · {formatDate(m.nextPost.date)}
          </p>
        )}
      </Panel>

      {/* ── Leads by team member ── */}
      <Panel title="Leads by Team Member" area={b.aLeads}>
        <div className={b.hList}>
          {m.people.map((p) => (
            <HBar key={p.name} label={p.name.split(" ")[0]} value={p.leads} max={leadsMax} color={COLORS.yellow} badge={String(p.leads)} />
          ))}
          {m.people.length === 0 && <p className={b.mutedText}>No campaign leads yet.</p>}
        </div>
      </Panel>

      {/* ── Results vs goal ── */}
      <Panel
        title="Results vs Goal per Campaign"
        area={b.aResults}
        extra={<span className={b.markerKey}><i /> Goal</span>}
      >
        <div className={b.hList}>
          {m.goals.map((g) => {
            const hit = g.target > 0 && g.result >= g.target;
            return (
              <HBar
                key={g.id}
                label={shortName(g.name)}
                value={g.result}
                max={goalMax * 1.05}
                color={hit ? COLORS.green : g.status === "Active" ? COLORS.blue : COLORS.purple}
                badge={g.target ? `${g.result}/${g.target}` : String(g.result)}
                marker={g.target || undefined}
              />
            );
          })}
          {m.goals.length === 0 && <p className={b.mutedText}>No campaigns have started yet.</p>}
        </div>
      </Panel>
    </div>
  );
}