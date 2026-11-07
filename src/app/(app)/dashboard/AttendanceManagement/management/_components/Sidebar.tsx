"use client";

// Right-hand column pieces: mini calendar, legend, summary, quick actions, promo.

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { LEGEND, MONTHS, STATUS_META, daysInMonth, pct, summarize, toKey, type AttStatus } from "../../../../../data/attendanceData";
import { useAtt } from "./context";
import { Dot, cx } from "./ui";
import styles from "../attendance.module.css";

/* ------------------------------------------------------------------ */
/* Mini calendar with coloured dots                                    */
/* ------------------------------------------------------------------ */

// Which dots to show under a day: anything other than a normal present day.
const DOT_ORDER: AttStatus[] = ["absent", "late", "half-day", "leave", "holiday"];

export function MiniCalendar() {
  const { date, setDate, day, ctx, employees } = useAtt();
  const [cursor, setCursor] = useState({ y: Number(date.slice(0, 4)), m: Number(date.slice(5, 7)) - 1 });

  // Follow the selected date when it moves to another month.
  const selY = Number(date.slice(0, 4));
  const selM = Number(date.slice(5, 7)) - 1;
  const [lastSel, setLastSel] = useState(`${selY}-${selM}`);
  if (lastSel !== `${selY}-${selM}`) {
    setLastSel(`${selY}-${selM}`);
    setCursor({ y: selY, m: selM });
  }

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const n = daysInMonth(cursor.y, cursor.m);
    const out: ({ key: string; d: number; dots: AttStatus[]; future: boolean } | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= n; d++) {
      const key = toKey(new Date(cursor.y, cursor.m, d));
      const future = key > ctx.today;
      let dots: AttStatus[] = [];
      if (!future && employees.length) {
        const s = summarize(day(key));
        const has: Record<AttStatus, number> = {
          absent: s.absent,
          late: s.late,
          "half-day": s.halfDay,
          leave: s.leave,
          holiday: s.holiday,
          present: 0,
          "weekly-off": 0,
        };
        dots = DOT_ORDER.filter((k) => has[k] > 0).slice(0, 3);
      }
      out.push({ key, d, dots, future });
    }
    return out;
  }, [cursor, day, ctx.today, employees.length]);

  const move = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <section className={cx(styles.card, styles.miniCal)}>
      <header>
        <strong>
          {MONTHS[cursor.m]} {cursor.y}
        </strong>
        <div>
          <button onClick={() => move(-1)} aria-label="Previous month">
            <ChevronLeft size={17} />
          </button>
          <button onClick={() => move(1)} aria-label="Next month">
            <ChevronRight size={17} />
          </button>
        </div>
      </header>
      <div className={styles.miniGrid}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
          <span key={w} className={styles.miniWd}>
            {w}
          </span>
        ))}
        {cells.map((c, i) =>
          c ? (
            <button
              key={c.key}
              className={cx(styles.miniDay, c.key === date && styles.miniSel, c.key === ctx.today && styles.miniToday, c.future && styles.miniFuture)}
              onClick={() => !c.future && setDate(c.key)}
              disabled={c.future}
              title={c.dots.map((d) => STATUS_META[d].label).join(", ") || undefined}
            >
              <span>{c.d}</span>
              <em>
                {c.dots.map((d) => (
                  <Dot key={d} status={d} size={4} />
                ))}
              </em>
            </button>
          ) : (
            <span key={`b${i}`} />
          ),
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

export function StatusLegendCard() {
  return (
    <section className={cx(styles.card, styles.legendCard)}>
      <h3>Attendance Status</h3>
      <ul>
        {(["present", "half-day", "absent", "leave", "late", "holiday"] as AttStatus[]).map((s) => (
          <li key={s}>
            <Dot status={s} size={10} /> {STATUS_META[s].label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LegendRow({ boxed = false, withWeeklyOff = false }: { boxed?: boolean; withWeeklyOff?: boolean }) {
  const list: AttStatus[] = boxed
    ? ["present", "absent", "late", "half-day", "leave", "weekly-off", "holiday"]
    : withWeeklyOff
      ? ["present", "absent", "late", "half-day", "leave", "holiday", "weekly-off"]
      : LEGEND;
  return (
    <ul className={cx(styles.legendRow, boxed && styles.legendBoxed)}>
      {list.map((s) => (
        <li key={s}>
          {boxed ? (
            <span className={styles.cellChip} style={{ color: STATUS_META[s].text, background: STATUS_META[s].soft }}>
              {STATUS_META[s].short}
            </span>
          ) : (
            <Dot status={s} size={9} />
          )}
          {STATUS_META[s].label}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Summary for the selected date (Monthly view)                        */
/* ------------------------------------------------------------------ */

export function AttendanceSummaryCard() {
  const { date, day } = useAtt();
  const s = summarize(day(date));
  const rows: [AttStatus, number][] = [
    ["present", s.onTime],
    ["absent", s.absent],
    ["late", s.late],
    ["half-day", s.halfDay],
    ["leave", s.leave],
    ["weekly-off", s.weeklyOff],
    ["holiday", s.holiday],
  ];
  return (
    <section className={cx(styles.card, styles.summaryCard)}>
      <h3>Attendance Summary</h3>
      <ul>
        {rows.map(([k, n]) => {
          const m = STATUS_META[k];
          const show = k !== "weekly-off" && k !== "holiday";
          return (
            <li key={k}>
              <Dot status={k} size={10} />
              <span>{m.label}</span>
              <strong>{n}</strong>
              <em style={show ? { color: m.text, background: m.soft } : undefined}>{show ? `${pct(n, s.total)}%` : "–"}</em>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick actions                                                       */
/* ------------------------------------------------------------------ */

interface Action {
  icon: LucideIcon;
  label: string;
  sub?: string;
  onClick: () => void;
}

export function QuickActions({ variant }: { variant: "daily" | "monthly" }) {
  const { openMark, openImport, openSettings, setView, exportMonth } = useAtt();
  const actions: Action[] =
    variant === "daily"
      ? [
          { icon: FilePenLine, label: "Bulk Update Attendance", onClick: () => openMark() },
          { icon: FileSpreadsheet, label: "Import Attendance (Excel)", onClick: openImport },
          { icon: FileText, label: "Attendance Report", onClick: () => setView("reports") },
          { icon: Settings, label: "Attendance Settings", onClick: openSettings },
        ]
      : [
          { icon: CalendarCheck2, label: "Mark / Update Attendance", sub: "Edit individual or multiple days", onClick: () => openMark() },
          { icon: Upload, label: "Import from Excel", sub: "Upload and sync attendance", onClick: openImport },
          { icon: Download, label: "Download Report", sub: "Get detailed attendance report", onClick: exportMonth },
        ];
  return (
    <section className={cx(styles.card, styles.quickCard)}>
      <h3>Quick Actions</h3>
      <div className={cx(styles.quickList, variant === "monthly" && styles.quickListSub)}>
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick}>
            <a.icon size={17} />
            <span>
              <b>{a.label}</b>
              {a.sub && <small>{a.sub}</small>}
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Promo cards                                                         */
/* ------------------------------------------------------------------ */

export function PromoCard({ variant }: { variant: "daily" | "monthly" | "banner" }) {
  const { setView } = useAtt();
  if (variant === "daily") {
    return (
      <section className={cx(styles.promo, styles.promoDaily)}>
        <span className={styles.promoIcon}>
          <CalendarCheck2 size={20} />
        </span>
        <strong>Keep your team on track</strong>
        <p>Accurate attendance leads to a more productive workplace.</p>
        <Bars />
      </section>
    );
  }
  return (
    <button className={cx(styles.promo, styles.promoMonthly, variant === "banner" && styles.promoBanner)} onClick={() => setView("reports")}>
      <span className={styles.promoChart}>
        <BarChart3 size={34} strokeWidth={2.2} />
      </span>
      <span>
        <strong>{variant === "banner" ? "Better Attendance Stronger Teams" : "Consistent Teams Brighter Tomorrow"}</strong>
        <small>Track. Manage. Grow.</small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}

function Bars() {
  return (
    <svg className={styles.promoBars} viewBox="0 0 60 50" aria-hidden="true">
      <rect x="4" y="30" width="10" height="20" rx="3" />
      <rect x="19" y="20" width="10" height="30" rx="3" />
      <rect x="34" y="10" width="10" height="40" rx="3" />
      <rect x="49" y="0" width="10" height="50" rx="3" />
    </svg>
  );
}