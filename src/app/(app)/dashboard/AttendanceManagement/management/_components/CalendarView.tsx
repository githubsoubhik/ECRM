"use client";

// Calendar View: month / week / day calendar with coloured status dots.

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  EDITABLE_STATUSES,
  MONTHS,
  STATUS_META,
  WEEKDAYS_SHORT,
  addDays,
  daysInMonth,
  fmtHours,
  fmtTime,
  fromKey,
  pct,
  recordsForDay,
  summarize,
  toKey,
  type AttStatus,
  type DaySummary,
} from "../../../../../data/attendanceData";
import { useAtt, type Member } from "./context";
import { LegendRow } from "./Sidebar";
import { Avatar, Donut, Dot, MonthPicker, PageHeader, RowMenu, SearchBox, SelectBox, StatCard, StatusPill, Tabs, cx, shortDept } from "./ui";
import styles from "../attendance.module.css";

type Mode = "month" | "week" | "day";

// Which counts show inside a calendar cell, in order.
const CELL_ORDER: [AttStatus, keyof DaySummary][] = [
  ["present", "onTime"],
  ["absent", "absent"],
  ["late", "late"],
  ["half-day", "halfDay"],
  ["leave", "leave"],
];

const STATUS_OPTIONS = EDITABLE_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }));

export default function CalendarView() {
  const {
    employees,
    date,
    setDate,
    year,
    month,
    setMonth,
    ctx,
    filters,
    setFilters,
    applyFilters,
    departments,
    isMobile,
    openMark,
    openProfile,
    setView,
    quickMark,
  } = useAtt();
  const [mode, setMode] = useState<Mode>("month");
  const [listQuery, setListQuery] = useState("");

  // Counts in the calendar follow the department / type / search filters.
  const scoped = useMemo(() => applyFilters(employees, { ...filters, status: "" }), [employees, filters, applyFilters]);
  // Status counts for one day (a few dozen small calculations per render — no cache needed).
  const summaryFor = useCallback((key: string): DaySummary => summarize(recordsForDay(scoped, key, ctx)), [scoped, ctx]);

  const sel = summaryFor(date);
  const selRecords = useMemo(() => new Map(recordsForDay(scoped, date, ctx).map((r) => [r.employeeId, r])), [scoped, date, ctx]);
  const selDate = fromKey(date);
  const dayTitle = `${selDate.getDate()} ${MONTHS[selDate.getMonth()]} ${selDate.getFullYear()}`;
  const weekday = selDate.toLocaleDateString("en-US", { weekday: "long" });

  const dayList = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return scoped.filter((e) => {
      const r = selRecords.get(e.id);
      if (filters.status && r?.status !== filters.status) return false;
      return !q || [e.name, e.department, e.id].some((v) => v.toLowerCase().includes(q));
    });
  }, [scoped, selRecords, listQuery, filters.status]);

  const goToday = () => {
    const t = fromKey(ctx.today);
    setMonth(t.getFullYear(), t.getMonth());
    setDate(ctx.today);
  };

  const moveMonth = (n: number) => {
    const d = new Date(year, month + n, 1);
    if (d <= fromKey(ctx.today)) setMonth(d.getFullYear(), d.getMonth());
  };
  const move = (n: number) => {
    if (mode === "month") return moveMonth(n);
    const next = addDays(date, mode === "week" ? n * 7 : n);
    setDate(next > ctx.today ? ctx.today : next);
  };

  /* ---------------- Stats ---------------- */
  const stats = (
    <section className={cx(styles.stats, isMobile ? styles.stats4 : styles.stats5)}>
      <StatCard icon={Users} color="#22a55b" soft="#e3f6ea" label="Total Employees" value={sel.total} />
      <StatCard
        icon={UserCheck}
        color="#22a55b"
        soft="#e3f6ea"
        label="Present"
        value={sel.present}
        badge={{ text: `${pct(sel.present, sel.total)}%`, color: "#15803d", soft: "#e3f6ea" }}
      />
      <StatCard
        icon={UserX}
        color="#ef4444"
        soft="#fde8e8"
        label="Absent"
        value={sel.absent}
        badge={{ text: `${pct(sel.absent, sel.total)}%`, color: "#dc2626", soft: "#fde8e8" }}
      />
      <StatCard
        icon={CalendarClock}
        color="#e0a526"
        soft="#fef3dc"
        label="Late"
        value={sel.late}
        badge={{ text: `${pct(sel.late, sel.total)}%`, color: "#b7791f", soft: "#fef3dc" }}
      />
      {!isMobile && (
        <StatCard
          icon={Plane}
          color="#6366f1"
          soft="#e9e8fd"
          label="On Leave"
          value={sel.leave}
          badge={{ text: `${pct(sel.leave, sel.total)}%`, color: "#4f46e5", soft: "#e9e8fd" }}
        />
      )}
    </section>
  );

  /* ---------------- Month grid ---------------- */
  const monthCells = useMemo(() => {
    const first = new Date(year, month, 1);
    const lead = first.getDay();
    const n = daysInMonth(year, month);
    const cells: { key: string; inMonth: boolean }[] = [];
    for (let i = lead; i > 0; i--) cells.push({ key: toKey(new Date(year, month, 1 - i)), inMonth: false });
    for (let d = 1; d <= n; d++) cells.push({ key: toKey(new Date(year, month, d)), inMonth: true });
    while (cells.length % 7) cells.push({ key: toKey(new Date(year, month, n + (cells.length - lead - n) + 1)), inMonth: false });
    return cells;
  }, [year, month]);

  const cellContent = (key: string, compact: boolean) => {
    if (key > ctx.today) return null;
    const s = summaryFor(key);
    if (s.offDay) {
      const label = s.holiday ? "Holiday" : "Weekly Off";
      return compact ? (
        <em className={styles.calDots}>
          <Dot status={s.holiday ? "holiday" : "weekly-off"} size={6} />
        </em>
      ) : (
        <span className={styles.calOff}>{label}</span>
      );
    }
    const items = CELL_ORDER.filter(([, f]) => (s[f] as number) > 0);
    if (compact) {
      return (
        <em className={styles.calDots}>
          {items.slice(0, 3).map(([k]) => (
            <Dot key={k} status={k} size={6} />
          ))}
        </em>
      );
    }
    return (
      <span className={styles.calCounts}>
        {items.slice(0, 4).map(([k, f]) => (
          <span key={k}>
            <Dot status={k} size={7} />
            {s[f] as number}
          </span>
        ))}
      </span>
    );
  };

  const monthGrid = (
    <div className={styles.calGrid}>
      {WEEKDAYS_SHORT.map((w) => (
        <div key={w} className={styles.calWd}>
          {w}
        </div>
      ))}
      {monthCells.map(({ key, inMonth }) => {
        const future = key > ctx.today;
        return (
          <button
            key={key}
            className={cx(
              styles.calCell,
              !inMonth && styles.calOut,
              key === date && styles.calSel,
              key === ctx.today && styles.calTodayCell,
              future && styles.calFuture,
            )}
            onClick={() => {
              if (future) return;
              setDate(key);
            }}
            onDoubleClick={() => !future && setMode("day")}
            disabled={future}
            aria-pressed={key === date}
            aria-label={`${fromKey(key).toDateString()}${future ? " (upcoming)" : ""}`}
          >
            <b>{fromKey(key).getDate()}</b>
            {inMonth && cellContent(key, isMobile)}
          </button>
        );
      })}
    </div>
  );

  /* ---------------- Week view ---------------- */
  const weekStart = addDays(date, -selDate.getDay());
  const weekGrid = (
    <div className={styles.weekGrid}>
      {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((k) => {
        const d = fromKey(k);
        const future = k > ctx.today;
        const s = future ? null : summaryFor(k);
        return (
          <button
            key={k}
            className={cx(styles.weekCol, k === date && styles.calSel, future && styles.calFuture)}
            onClick={() => !future && setDate(k)}
            disabled={future}
          >
            <span className={styles.weekHead}>
              <small>{WEEKDAYS_SHORT[d.getDay()]}</small>
              <b>{d.getDate()}</b>
            </span>
            {s && s.offDay ? (
              <span className={styles.calOff}>{s.holiday ? "Holiday" : "Weekly Off"}</span>
            ) : s ? (
              <ul>
                {CELL_ORDER.map(([k2, f]) => (
                  <li key={k2}>
                    <Dot status={k2} size={8} />
                    <span>{STATUS_META[k2].label}</span>
                    <b>{s[f] as number}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.calOff}>Upcoming</span>
            )}
          </button>
        );
      })}
    </div>
  );

  /* ---------------- Day view ---------------- */
  const dayTable = (
    <div className={styles.dayView}>
      <div className={styles.dayChips}>
        {CELL_ORDER.map(([k, f]) => (
          <span key={k} style={{ background: STATUS_META[k].soft, color: STATUS_META[k].text }}>
            <b>{sel[f] as number}</b> {STATUS_META[k].label}
          </span>
        ))}
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Work Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dayList.map((e) => {
              const r = selRecords.get(e.id)!;
              return (
                <tr key={e.id}>
                  <td>
                    <button className={styles.person} onClick={() => openProfile(e.id)}>
                      <Avatar name={e.name} photoUrl={e.photoUrl} size={30} />
                      <span>
                        <b>{e.name}</b>
                        <small>{e.department}</small>
                      </span>
                    </button>
                  </td>
                  <td>{fmtTime(r.checkIn)}</td>
                  <td>{fmtTime(r.checkOut)}</td>
                  <td>{fmtHours(r.workMinutes)}</td>
                  <td>
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const heading =
    mode === "month"
      ? `${MONTHS[month]} ${year}`
      : mode === "week"
        ? `${fromKey(weekStart).getDate()} ${MONTHS[fromKey(weekStart).getMonth()].slice(0, 3)} – ${fromKey(addDays(weekStart, 6)).getDate()} ${MONTHS[fromKey(addDays(weekStart, 6)).getMonth()].slice(0, 3)}`
        : `${weekday}, ${dayTitle}`;

  const calendarCard = (
    <section className={cx(styles.card, styles.calCard)}>
      <div className={styles.calHead}>
        <button className={styles.iconBtn} onClick={() => move(-1)} aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <strong>{heading}</strong>
        <button className={styles.iconBtn} onClick={() => move(1)} aria-label="Next">
          <ChevronRight size={18} />
        </button>
        {isMobile && (
          <>
            <span className={styles.flexSpacer} />
            <button className={styles.softBtn} onClick={goToday}>
              Today
            </button>
          </>
        )}
      </div>
      {mode === "month" || isMobile ? monthGrid : mode === "week" ? weekGrid : dayTable}
    </section>
  );

  /* ---------------- Aside cards ---------------- */
  const donutParts = (["present", "absent", "late", "half-day", "leave", "holiday"] as AttStatus[]).map((k) => ({
    k,
    value:
      k === "present"
        ? sel.onTime
        : k === "absent"
          ? sel.absent
          : k === "late"
            ? sel.late
            : k === "half-day"
              ? sel.halfDay
              : k === "leave"
                ? sel.leave
                : sel.holiday + sel.weeklyOff,
  }));

  const dayCard = (
    <section className={cx(styles.card, styles.dayCard)}>
      <header>
        <div>
          <strong>{dayTitle}</strong>
          <small>{weekday}</small>
        </div>
        <button className={styles.linkBtn} onClick={() => setMode("day")}>
          View Day Details
        </button>
      </header>
      <div className={styles.dayCardBody}>
        <Donut total={sel.total} size={112} stroke={13} parts={donutParts.map((p) => ({ value: p.value, color: STATUS_META[p.k].color }))} />
        <ul>
          {donutParts.map((p) => (
            <li key={p.k}>
              <Dot status={p.k} size={9} />
              <b>{p.value}</b>
              <span>{p.k === "holiday" ? "Holiday / Off" : STATUS_META[p.k].label}</span>
              <em style={{ color: STATUS_META[p.k].text, background: STATUS_META[p.k].soft }}>{pct(p.value, sel.total)}%</em>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

  const employeeItem = (e: Member) => {
    const r = selRecords.get(e.id)!;
    return (
      <li key={e.id}>
        <button className={styles.person} onClick={() => openProfile(e.id)}>
          <Avatar name={e.name} photoUrl={e.photoUrl} size={34} />
          <span>
            <b>{e.name}</b>
            <small>{shortDept(e.department)}</small>
          </span>
        </button>
        <StatusPill status={r.status} size="sm" />
        <RowMenu
          label={`Actions for ${e.name}`}
          icon={<MoreHorizontal size={16} />}
          items={[
            { label: "View attendance", icon: Eye, onClick: () => openProfile(e.id) },
            { label: "Edit this day", icon: Pencil, onClick: () => openMark({ ids: [e.id], date }) },
            { label: "Mark Present", icon: UserCheck, onClick: () => quickMark([e.id], date, "present") },
            { label: "Mark Absent", icon: UserX, onClick: () => quickMark([e.id], date, "absent") },
          ]}
        />
      </li>
    );
  };

  const listCard = (
    <section className={cx(styles.card, styles.empListCard)}>
      <header>
        <strong>
          Employees on {selDate.getDate()} {MONTHS[selDate.getMonth()]}
        </strong>
        {isMobile && (
          <button className={styles.linkBtn} onClick={() => setView("daily")}>
            View All <ArrowRight size={14} />
          </button>
        )}
      </header>
      {!isMobile && <SearchBox value={listQuery} onChange={setListQuery} placeholder="Search employees..." />}
      <ul className={styles.empList}>{(isMobile ? dayList.slice(0, 5) : dayList.slice(0, 8)).map(employeeItem)}</ul>
      {!dayList.length && <p className={styles.muted}>No employees for this filter.</p>}
      {!isMobile && (
        <button className={styles.outlineWide} onClick={() => setView("daily")}>
          View Full Employee List <ArrowRight size={16} />
        </button>
      )}
    </section>
  );

  /* ---------------- Layout ---------------- */
  if (isMobile) {
    return (
      <div className={styles.mCalendar}>
        <PageHeader crumb="Calendar View" subtitle="Track, view and manage attendance with an interactive calendar" />
        <Tabs />
        <div className={styles.mTwo}>
          <MonthPicker />
          <SelectBox value={filters.dept} onChange={(v) => setFilters({ ...filters, dept: v })} options={departments} allLabel="All Departments" />
        </div>
        {stats}
        <LegendRow />
        {calendarCard}
        <section className={styles.mDaySummary}>
          <header>
            <strong>{dayTitle}</strong>
            <small>{sel.total} Employees</small>
          </header>
          <div className={styles.mDayChips}>
            {(
              [
                ["present", sel.present, UserCheck],
                ["absent", sel.absent, UserX],
                ["late", sel.late, CalendarClock],
                ["half-day", sel.halfDay, CalendarCheck2],
                ["leave", sel.leave, Plane],
              ] as [AttStatus, number, typeof UserCheck][]
            ).map(([k, v, Icon]) => (
              <span key={k} style={{ background: STATUS_META[k].soft }}>
                <Icon size={15} color={STATUS_META[k].color} />
                <b>{v}</b>
                <small>{STATUS_META[k].label}</small>
              </span>
            ))}
          </div>
        </section>
        {listCard}
        <button className={styles.fab} onClick={() => openMark({ date })} aria-label="Mark / Update Attendance">
          <Plus size={26} />
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        crumb="Calendar View"
        subtitle="Track, view and manage attendance with an interactive calendar"
        actions={
          <>
            <MonthPicker withArrows />
            <button className={styles.primaryBtn} onClick={() => openMark({ date })}>
              <Plus size={18} /> Mark / Update Attendance
            </button>
          </>
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <Tabs />
          {stats}
          <div className={cx(styles.filters, styles.calFilters)}>
            <SelectBox value={filters.dept} onChange={(v) => setFilters({ ...filters, dept: v })} options={departments} allLabel="All Departments" />
            <SelectBox
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
              options={["Full-time", "Part-time", "Contract", "Intern"]}
              allLabel="All Employment Types"
            />
            <SelectBox value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={STATUS_OPTIONS} allLabel="All Status" />
            <SearchBox value={filters.q} onChange={(v) => setFilters({ ...filters, q: v })} placeholder="Search employees..." />
          </div>
          <div className={styles.calToolbar}>
            <LegendRow />
            <div className={styles.segment} role="group" aria-label="Calendar mode">
              {(["month", "week", "day"] as Mode[]).map((m) => (
                <button key={m} className={cx(mode === m && styles.on)} onClick={() => setMode(m)} aria-pressed={mode === m}>
                  {m[0].toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
            <button className={styles.softBtn} onClick={goToday}>
              Today
            </button>
          </div>
          {calendarCard}
        </div>
        <aside className={styles.aside}>
          {dayCard}
          {listCard}
        </aside>
      </div>
      <section className={styles.quoteBanner}>
        <span className={styles.quoteIcon}>
          <CalendarCheck2 size={24} />
        </span>
        <div>
          <strong>Consistent Attendance Builds Stronger Teams</strong>
          <p>Track. Manage. Motivate. Together for a better tomorrow.</p>
        </div>
        <svg className={styles.leaf} viewBox="0 0 80 60" aria-hidden="true">
          <path d="M40 58 C40 40 40 25 40 10" />
          <path d="M40 30 C28 28 20 18 18 6 C30 8 38 18 40 30Z" />
          <path d="M40 38 C52 36 62 26 64 14 C52 16 42 26 40 38Z" />
        </svg>
        <blockquote>“A disciplined team achieves extraordinary results.”</blockquote>
      </section>
    </>
  );
}