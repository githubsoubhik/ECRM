"use client";

// Monthly View: register of every employee × every day of the month.

import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, PenLine, Plane, RotateCcw, SlidersHorizontal, UserCheck, UserX, Users } from "lucide-react";
import { STATUS_META, WEEKDAYS_SHORT, daysInMonth, employeeMonth, fmtTime, fromKey, monthAverages, monthKeys, pct } from "../../../../../data/attendanceData";
import { EMPTY_FILTERS, useAtt, type Filters } from "./context";
import { EmptyRows } from "./DailyView";
import { AttendanceSummaryCard, LegendRow, MiniCalendar, PromoCard, QuickActions } from "./Sidebar";
import { Avatar, MonthPicker, PageHeader, Pagination, RowsPerPage, SearchBox, SelectBox, StatCard, Tabs, cx, shortDept, usePaged } from "./ui";
import styles from "../attendance.module.css";

export default function MonthlyView() {
  const { employees, year, month, setMonth, date, setDate, ctx, filters, setFilters, applyFilters, departments, isMobile, openMark, openProfile } = useAtt();

  // Filters here apply on "Apply" (like the design); search applies instantly.
  const [draft, setDraft] = useState<Filters>(filters);
  const [perPage, setPerPage] = useState(8);
  const [showFilters, setShowFilters] = useState(false);

  const keys = useMemo(() => monthKeys(year, month), [year, month]);
  const size = isMobile ? 7 : 15;
  const todayIdx = keys.indexOf(ctx.today);
  const selIdx = keys.indexOf(date);
  // Default window: the one holding the selected date (or today). The arrows
  // override it until the month, date or screen size changes — no effect needed.
  const focus = selIdx >= 0 ? selIdx : todayIdx >= 0 ? todayIdx : 0;
  const defaultStart = isMobile ? Math.floor(focus / 7) * 7 : focus >= 15 ? 15 : 0;
  const windowKey = `${year}-${month}|${date}|${isMobile}`;
  const [nav, setNav] = useState<{ key: string; start: number } | null>(null);
  const start = nav && nav.key === windowKey ? nav.start : defaultStart;

  const windowKeys = keys.slice(start, start + size);
  const canPrev = start > 0;
  const canNext = start + size < keys.length;
  const shiftWindow = (dir: 1 | -1) => {
    if (dir === -1 && !canPrev) {
      const d = new Date(year, month - 1, 1);
      setMonth(d.getFullYear(), d.getMonth());
      return;
    }
    if (dir === 1 && !canNext) {
      const d = new Date(year, month + 1, 1);
      if (d <= fromKey(ctx.today)) setMonth(d.getFullYear(), d.getMonth());
      return;
    }
    setNav({ key: windowKey, start: Math.max(0, Math.min(keys.length - 1, start + dir * size)) });
  };

  const rows = useMemo(() => applyFilters(employees, { ...filters, status: "" }), [employees, filters, applyFilters]);
  const monthStats = useMemo(() => new Map(rows.map((e) => [e.id, employeeMonth(e, year, month, ctx)])), [rows, year, month, ctx]);
  const paged = usePaged(rows, perPage, `${year}-${month}|${JSON.stringify(filters)}`);

  const avg = useMemo(() => monthAverages(rows, year, month, ctx), [rows, year, month, ctx]);
  const total = rows.length;

  const stats = (
    <section className={cx(styles.stats, styles.stats5)}>
      <StatCard icon={Users} color="#22a55b" soft="#e3f6ea" label="Total Employees" value={total} />
      <StatCard
        icon={UserCheck}
        color="#22a55b"
        soft="#e3f6ea"
        label="Present (Avg.)"
        value={avg.present}
        badge={{ text: `${pct(avg.present, total)}%`, color: "#15803d", soft: "#e3f6ea" }}
      />
      <StatCard
        icon={UserX}
        color="#ef4444"
        soft="#fde8e8"
        label="Absent (Avg.)"
        value={avg.absent}
        badge={{ text: `${pct(avg.absent, total)}%`, color: "#dc2626", soft: "#fde8e8" }}
      />
      <StatCard
        icon={CalendarClock}
        color="#e0a526"
        soft="#fef3dc"
        label="Late (Avg.)"
        value={avg.late}
        badge={{ text: `${pct(avg.late, total)}%`, color: "#b7791f", soft: "#fef3dc" }}
      />
      <StatCard
        icon={Plane}
        color="#6366f1"
        soft="#e9e8fd"
        label="On Leave (Avg.)"
        value={avg.leave}
        badge={{ text: `${pct(avg.leave, total)}%`, color: "#4f46e5", soft: "#e9e8fd" }}
      />
    </section>
  );

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
  };

  const rangeLabel = windowKeys.length ? `${fromKey(windowKeys[0]).getDate()}–${fromKey(windowKeys[windowKeys.length - 1]).getDate()}` : "";

  const grid = (
    <div className={cx(styles.card, styles.registerCard)}>
      <div className={styles.tableScroll}>
        <table className={cx(styles.table, styles.register)}>
          <thead>
            <tr>
              {!isMobile && <th className={styles.cNum}>#</th>}
              <th className={styles.cEmp}>Employee</th>
              {windowKeys.map((k) => {
                const d = fromKey(k);
                return (
                  <th key={k} className={cx(styles.cDay, k === ctx.today && styles.cToday, k === date && styles.cSel)}>
                    <button onClick={() => k <= ctx.today && setDate(k)} disabled={k > ctx.today}>
                      <b>{d.getDate()}</b>
                      <small>{WEEKDAYS_SHORT[d.getDay()]}</small>
                    </button>
                  </th>
                );
              })}
              {!isMobile && <th className={styles.cTotal}>Total</th>}
            </tr>
          </thead>
          <tbody>
            {paged.rows.map((e, i) => {
              const st = monthStats.get(e.id)!;
              return (
                <tr key={e.id}>
                  {!isMobile && <td className={styles.cNum}>{paged.from + i}</td>}
                  <td className={styles.cEmp}>
                    <button className={styles.person} onClick={() => openProfile(e.id)}>
                      <Avatar name={e.name} photoUrl={e.photoUrl} size={isMobile ? 30 : 34} />
                      <span>
                        <b>{e.name}</b>
                        <small>{shortDept(e.department)}</small>
                      </span>
                    </button>
                  </td>
                  {windowKeys.map((k) => {
                    const r = st.records[fromKey(k).getDate() - 1];
                    const m = r.status ? STATUS_META[r.status] : null;
                    return (
                      <td key={k} className={cx(styles.cDay, k === ctx.today && styles.cToday)}>
                        {m ? (
                          <button
                            className={cx(styles.cellChip, r.source === "manual" && styles.cellEdited)}
                            style={{ color: m.text, background: m.soft }}
                            onClick={() => openMark({ ids: [e.id], date: k })}
                            title={`${e.name} · ${fromKey(k).toDateString()} · ${m.label}${r.checkIn ? ` (${fmtTime(r.checkIn)}–${fmtTime(r.checkOut)})` : ""}`}
                          >
                            {isMobile && r.status === "weekly-off" ? "W" : m.short}
                          </button>
                        ) : (
                          <span className={styles.cellEmpty} />
                        )}
                      </td>
                    );
                  })}
                  {!isMobile && (
                    <td className={styles.cTotal}>
                      <b>{st.present}</b>/{st.workingDays}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyRows onReset={reset} />}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        crumb="Monthly View"
        subtitle="View, track and manage monthly attendance of all employees"
        actions={
          <>
            {!isMobile ? <MonthPicker withArrows /> : <MonthPicker variant="short" />}
            {!isMobile && (
              <button className={styles.primaryBtn} onClick={() => openMark({ ids: rows.map((e) => e.id) })}>
                <PenLine size={17} /> Bulk Update
              </button>
            )}
          </>
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <Tabs />
          {stats}

          {!isMobile ? (
            <div className={cx(styles.filters, styles.monthlyFilters)}>
              <SelectBox value={draft.dept} onChange={(v) => setDraft({ ...draft, dept: v })} options={departments} allLabel="All Departments" />
              <SelectBox
                value={draft.type}
                onChange={(v) => setDraft({ ...draft, type: v })}
                options={["Full-time", "Part-time", "Contract", "Intern"]}
                allLabel="All Employment Types"
              />
              <SearchBox value={filters.q} onChange={(v) => setFilters({ ...filters, q: v })} placeholder="Search employee..." />
              <button className={styles.darkBtn} onClick={() => setFilters({ ...filters, dept: draft.dept, type: draft.type })}>
                Apply
              </button>
              <button className={styles.outlineBtn} onClick={reset}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          ) : (
            <>
              <div className={styles.mToolbar}>
                <SearchBox value={filters.q} onChange={(v) => setFilters({ ...filters, q: v })} placeholder="Search employees..." />
                <button className={cx(styles.outlineBtn, showFilters && styles.outlineOn)} onClick={() => setShowFilters((v) => !v)}>
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <button className={styles.darkBtn} onClick={() => openMark({ ids: rows.map((e) => e.id) })}>
                  <PenLine size={15} /> Bulk Update
                </button>
              </div>
              {showFilters && (
                <div className={styles.moreFilters}>
                  <SelectBox value={filters.dept} onChange={(v) => setFilters({ ...filters, dept: v })} options={departments} allLabel="All Departments" />
                  <SelectBox
                    value={filters.type}
                    onChange={(v) => setFilters({ ...filters, type: v })}
                    options={["Full-time", "Part-time", "Contract", "Intern"]}
                    allLabel="All Types"
                  />
                </div>
              )}
            </>
          )}

          <div className={styles.legendBar}>
            <LegendRow boxed={!isMobile} withWeeklyOff />
            {!isMobile && (
              <div className={styles.windowNav}>
                <span>
                  Days {rangeLabel} of {daysInMonth(year, month)}
                </span>
                <button className={styles.iconBtn} onClick={() => shiftWindow(-1)} aria-label="Previous days">
                  <ChevronLeft size={16} />
                </button>
                <button className={styles.iconBtn} onClick={() => shiftWindow(1)} aria-label="Next days">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          {isMobile && (
            <div className={styles.mMonthNav}>
              <button className={styles.iconBtn} onClick={() => shiftWindow(-1)} aria-label="Previous week">
                <ChevronLeft size={17} />
              </button>
              <strong>
                {fromKey(keys[0]).toLocaleString("en-US", { month: "long" })} {year}
              </strong>
              <button className={styles.iconBtn} onClick={() => shiftWindow(1)} aria-label="Next week">
                <ChevronRight size={17} />
              </button>
              <span className={styles.flexSpacer} />
              <button
                className={styles.softBtn}
                onClick={() => {
                  const t = fromKey(ctx.today);
                  setMonth(t.getFullYear(), t.getMonth());
                  setDate(ctx.today);
                }}
              >
                Today
              </button>
              <MonthPicker variant="icon" />
            </div>
          )}

          {grid}

          <div className={styles.tableFoot}>
            <span>
              Showing {paged.from} to {paged.to} of {paged.total} employees
            </span>
            <div className={styles.footRight}>
              <Pagination page={paged.page} pages={paged.pages} onPage={paged.setPage} compact={isMobile} />
              {!isMobile && <RowsPerPage value={perPage} onChange={setPerPage} />}
            </div>
          </div>

          {isMobile && <PromoCard variant="banner" />}
        </div>

        {!isMobile && (
          <aside className={styles.aside}>
            <MiniCalendar />
            <AttendanceSummaryCard />
            <QuickActions variant="monthly" />
            <PromoCard variant="monthly" />
          </aside>
        )}
      </div>
    </>
  );
}