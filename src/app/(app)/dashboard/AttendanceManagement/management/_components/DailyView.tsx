"use client";

// Daily View: one day's check-ins for everyone.

import { useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Users,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import {
  EDITABLE_STATUSES,
  STATUS_META,
  WEEKDAYS_SHORT,
  addDays,
  fmtHours,
  fmtTime,
  fromKey,
  pct,
  previousWorkingDay,
  summarize,
  type DayRecord,
} from "../../../../../data/attendanceData";
import { OFFICE_LOCATIONS } from "../../../../../data/employeeData";
import { EMPTY_FILTERS, useAtt, type Member } from "./context";
import { PromoCard, QuickActions, MiniCalendar, StatusLegendCard } from "./Sidebar";
import { Avatar, MonthPicker, PageHeader, Pagination, RowMenu, SearchBox, SelectBox, StatCard, StatusPill, Tabs, cx, usePaged } from "./ui";
import styles from "../attendance.module.css";

/* ------------------------------------------------------------------ */
/* Stats shared with other views                                       */
/* ------------------------------------------------------------------ */

export function trendOf(now: number, before: number | null, higherIsGood: boolean) {
  if (before === null) return undefined;
  const diff = now - before;
  return {
    text: `${diff > 0 ? "+" : ""}${diff}%`,
    up: diff === 0 ? null : diff > 0,
    good: diff === 0 ? true : higherIsGood ? diff > 0 : diff < 0,
  };
}

/* ------------------------------------------------------------------ */
/* Date strip                                                          */
/* ------------------------------------------------------------------ */

export function DateStrip({ size }: { size: number }) {
  const { date, setDate, ctx } = useAtt();
  // The arrows move the strip; picking a day outside it re-centres it.
  // The strip position is stored with the date it was set for, so no effect is needed.
  const [nav, setNav] = useState<{ start: string; date: string; size: number } | null>(null);
  const centred = addDays(date, -Math.floor(size / 2) + 1);
  let start = nav && nav.size === size ? nav.start : centred;
  if (nav && nav.date !== date && (date < start || date > addDays(start, size - 1))) start = centred;
  const setStart = (s: string) => setNav({ start: s, date, size });

  const days = Array.from({ length: size }, (_, i) => addDays(start, i));
  return (
    <div className={styles.strip}>
      <button className={styles.stripArrow} onClick={() => setStart(addDays(start, -7))} aria-label="Earlier days">
        <ChevronLeft size={18} />
      </button>
      <div className={styles.stripDays} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {days.map((k) => {
          const d = fromKey(k);
          const future = k > ctx.today;
          return (
            <button
              key={k}
              className={cx(styles.stripDay, k === date && styles.stripOn, k === ctx.today && styles.stripToday)}
              onClick={() => setDate(k)}
              disabled={future}
              aria-pressed={k === date}
            >
              <b>{String(d.getDate()).padStart(2, "0")}</b>
              <small>{WEEKDAYS_SHORT[d.getDay()]}</small>
            </button>
          );
        })}
      </div>
      <button className={styles.stripArrow} onClick={() => setStart(addDays(start, 7))} aria-label="Later days">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

const EMPTY_SET: Set<string> = new Set();

const STATUS_OPTIONS = EDITABLE_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })).concat([
  { value: "weekly-off", label: "Weekly Off" },
  { value: "holiday", label: "Holiday" },
]);

export default function DailyView() {
  const api = useAtt();
  const { employees, date, setDate, day, ctx, filters, setFilters, applyFilters, isMobile, departments, openMark, openProfile, quickMark, resetRecord } = api;

  const [office, setOffice] = useState("");
  const [manualOnly, setManualOnly] = useState(false);
  const [showMore, setShowMore] = useState(false);
  // Ticked rows belong to one day; picking another day starts with nothing ticked.
  const [picked, setPicked] = useState<{ date: string; ids: Set<string> }>({ date, ids: new Set() });
  const selected = picked.date === date ? picked.ids : EMPTY_SET;
  const setSelected = (next: Set<string> | ((cur: Set<string>) => Set<string>)) => setPicked({ date, ids: typeof next === "function" ? next(selected) : next });

  const records = day(date);
  const byId = useMemo(() => new Map(records.map((r) => [r.employeeId, r])), [records]);
  const s = summarize(records);
  const prev = useMemo(() => previousWorkingDay(employees, date, ctx), [employees, date, ctx]);
  const isToday = date === ctx.today;

  const rows = useMemo(() => {
    let list = applyFilters(employees, filters, date);
    if (office) list = list.filter((e) => e.officeLocation === office);
    if (manualOnly) list = list.filter((e) => byId.get(e.id)?.source === "manual");
    return list;
  }, [employees, filters, date, applyFilters, office, manualOnly, byId]);

  const paged = usePaged(rows, 8, `${date}|${JSON.stringify(filters)}|${office}|${manualOnly}`);

  const allOnPage = paged.rows.length > 0 && paged.rows.every((e) => selected.has(e.id));
  const toggle = (id: string) =>
    setSelected((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setOffice("");
    setManualOnly(false);
  };

  const future = date > ctx.today;
  const menuItems = (e: Member, r: DayRecord) => [
    { label: "View attendance", icon: Eye, onClick: () => openProfile(e.id) },
    { label: "Mark Present", icon: CheckCircle2, onClick: () => quickMark([e.id], date, "present") },
    { label: "Mark Absent", icon: XCircle, onClick: () => quickMark([e.id], date, "absent") },
    { label: "Mark On Leave", icon: Plane, onClick: () => quickMark([e.id], date, "leave") },
    ...(r.source === "manual" ? [{ label: "Reset to automatic", icon: RotateCcw, onClick: () => resetRecord(e.id, date) }] : []),
  ];

  const statCards = (
    <section className={cx(styles.stats, styles.stats4)}>
      <StatCard layout="labelTop" icon={Users} color="#4f6bed" soft="#e8ecfd" label="Total Employees" value={s.total} />
      <StatCard
        layout="labelTop"
        icon={UserCheck}
        color="#22a55b"
        soft="#e3f6ea"
        label={isToday ? "Present Today" : "Present"}
        value={s.present}
        badge={{ text: `${pct(s.present, s.total)}%`, color: "#15803d", soft: "#e3f6ea" }}
        trend={isMobile ? undefined : trendOf(pct(s.present, s.total), prev ? pct(prev.present, prev.total) : null, true)}
      />
      <StatCard
        layout="labelTop"
        icon={UserX}
        color="#ef4444"
        soft="#fde8e8"
        label={isToday ? "Absent Today" : "Absent"}
        value={s.absent}
        badge={{ text: `${pct(s.absent, s.total)}%`, color: "#dc2626", soft: "#fde8e8" }}
        trend={isMobile ? undefined : trendOf(pct(s.absent, s.total), prev ? pct(prev.absent, prev.total) : null, false)}
      />
      <StatCard
        layout="labelTop"
        icon={CalendarClock}
        color="#e0a526"
        soft="#fef3dc"
        label="On Leave"
        value={s.leave}
        badge={{ text: `${pct(s.leave, s.total)}%`, color: "#b7791f", soft: "#fef3dc" }}
        trend={isMobile ? undefined : trendOf(pct(s.leave, s.total), prev ? pct(prev.leave, prev.total) : null, false)}
      />
    </section>
  );

  const bulkBar = selected.size > 0 && (
    <div className={styles.bulkBar}>
      <strong>{selected.size} selected</strong>
      <button onClick={() => quickMark([...selected], date, "present")}>Mark Present</button>
      <button onClick={() => quickMark([...selected], date, "absent")}>Mark Absent</button>
      <button onClick={() => quickMark([...selected], date, "leave")}>On Leave</button>
      <button onClick={() => openMark({ ids: [...selected], date })}>More…</button>
      <button className={styles.bulkClear} onClick={() => setSelected(new Set())}>
        Clear
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        subtitle="Track, view and update employee attendance records"
        actions={
          <>
            <MonthPicker variant={isMobile ? "short" : "full"} />
            {!isMobile && (
              <button className={styles.primaryBtn} onClick={() => openMark({ date: isToday || future ? ctx.today : date })}>
                <Plus size={18} /> Mark / Update Attendance
              </button>
            )}
          </>
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          {statCards}
          <Tabs pill={isMobile} />

          <div className={styles.stripRow}>
            <DateStrip size={isMobile ? 7 : 14} />
            {!isMobile && (
              <button className={styles.todayBtn} onClick={() => setDate(ctx.today)} disabled={isToday}>
                Today
              </button>
            )}
          </div>

          {/* Filters */}
          <div className={cx(styles.filters, styles.dailyFilters)}>
            <SelectBox
              className={styles.fDept}
              value={filters.dept}
              onChange={(v) => setFilters({ ...filters, dept: v })}
              options={departments}
              allLabel="All Departments"
            />
            <SelectBox
              className={styles.fType}
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
              options={["Full-time", "Part-time", "Contract", "Intern"]}
              allLabel={isMobile ? "All Types" : "All Employment Types"}
            />
            <SelectBox
              className={styles.fStatus}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              options={STATUS_OPTIONS}
              allLabel="All Status"
            />
            <SearchBox
              className={styles.fSearch}
              value={filters.q}
              onChange={(v) => setFilters({ ...filters, q: v })}
              placeholder={isMobile ? "Search employee, department..." : "Search by name, ID or department..."}
            />
            <button
              className={cx(styles.outlineBtn, styles.fFilter, showMore && styles.outlineOn)}
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
            >
              <SlidersHorizontal size={16} /> Filter
            </button>
            <button className={cx(styles.outlineBtn, styles.fReset)} onClick={reset}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>
          {showMore && (
            <div className={styles.moreFilters}>
              <SelectBox
                value={office}
                onChange={setOffice}
                options={OFFICE_LOCATIONS.map((o) => ({ value: o, label: o.replace("PAVION Office - ", "") }))}
                allLabel="All Offices"
              />
              <label className={styles.check}>
                <input type="checkbox" checked={manualOnly} onChange={(e) => setManualOnly(e.target.checked)} />
                Only manually edited records
              </label>
            </div>
          )}

          {bulkBar}

          {/* Desktop table */}
          {!isMobile ? (
            <div className={cx(styles.card, styles.tableCard)}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.cCheck}>
                        <input
                          type="checkbox"
                          aria-label="Select all on this page"
                          checked={allOnPage}
                          onChange={() =>
                            setSelected((cur) => {
                              const n = new Set(cur);
                              paged.rows.forEach((e) => (allOnPage ? n.delete(e.id) : n.add(e.id)));
                              return n;
                            })
                          }
                        />
                      </th>
                      <th className={styles.cNum}>#</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Work Hours</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th className={styles.cActions}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.rows.map((e, i) => {
                      const r = byId.get(e.id)!;
                      return (
                        <tr key={e.id} className={cx(selected.has(e.id) && styles.rowOn)}>
                          <td className={styles.cCheck}>
                            <input type="checkbox" aria-label={`Select ${e.name}`} checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                          </td>
                          <td className={styles.cNum}>{paged.from + i}</td>
                          <td>
                            <button className={styles.person} onClick={() => openProfile(e.id)}>
                              <Avatar name={e.name} photoUrl={e.photoUrl} size={34} />
                              <span>
                                <b>{e.name}</b>
                                <small>{e.designation}</small>
                              </span>
                            </button>
                          </td>
                          <td>{e.department}</td>
                          <td>{fmtTime(r.checkIn)}</td>
                          <td>{fmtTime(r.checkOut)}</td>
                          <td>{fmtHours(r.workMinutes)}</td>
                          <td>
                            <StatusPill status={r.status} />
                          </td>
                          <td className={styles.remarks}>
                            {r.remarks || "—"}
                            {r.source === "manual" && <span className={styles.editedTag}>edited</span>}
                          </td>
                          <td className={styles.cActions}>
                            <div className={styles.actionsCell}>
                              <button
                                className={styles.actionBtn}
                                onClick={() => openMark({ ids: [e.id], date })}
                                disabled={future}
                                aria-label={`Edit ${e.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <RowMenu
                                label={`More actions for ${e.name}`}
                                icon={<MoreHorizontal size={16} />}
                                items={future ? menuItems(e, r).slice(0, 1) : menuItems(e, r)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!rows.length && <EmptyRows onReset={reset} />}
              </div>
            </div>
          ) : (
            /* Mobile cards */
            <div className={styles.mList}>
              {paged.rows.map((e) => {
                const r = byId.get(e.id)!;
                return (
                  <div key={e.id} className={styles.mRow}>
                    <button className={styles.mPerson} onClick={() => openProfile(e.id)}>
                      <Avatar name={e.name} photoUrl={e.photoUrl} size={42} />
                      <span>
                        <b>{e.name}</b>
                        <small>{e.designation}</small>
                        <small>{e.department}</small>
                      </span>
                    </button>
                    <div className={styles.mTime}>
                      <b>{r.checkIn ? fmtTime(r.checkIn) : "—"}</b>
                      <small>Check In</small>
                    </div>
                    <div className={styles.mTime}>
                      <b>{r.checkOut ? fmtTime(r.checkOut) : "—"}</b>
                      <small>Check Out</small>  
                    </div>
                    <StatusPill status={r.status} size="sm" />
                    <RowMenu
                      label={`Actions for ${e.name}`}
                      icon={<MoreVertical size={17} />}
                      items={[{ label: "Edit attendance", icon: Pencil, onClick: () => openMark({ ids: [e.id], date }) }, ...menuItems(e, r)]}
                    />
                  </div>
                );
              })}
              {!rows.length && <EmptyRows onReset={reset} />}
            </div>
          )}

          <div className={styles.tableFoot}>
            <span>
              Showing {paged.from} to {paged.to} of {paged.total} employees
            </span>
            <Pagination page={paged.page} pages={paged.pages} onPage={paged.setPage} compact={isMobile} />
          </div>

          {isMobile && (
            <div className={styles.stickyCta}>
              <button className={styles.primaryBtn} onClick={() => openMark({ date: future ? ctx.today : date })}>
                <Plus size={18} /> Mark / Update Attendance
              </button>
            </div>
          )}
        </div>

        {!isMobile && (
          <aside className={styles.aside}>
            <MiniCalendar />
            <StatusLegendCard />
            <QuickActions variant="daily" />
            <PromoCard variant="daily" />
          </aside>
        )}
      </div>
    </>
  );
}

export function EmptyRows({ onReset }: { onReset: () => void }) {
  return (
    <div className={styles.emptyRows}>
      <p>No employees match these filters.</p>
      <button className={styles.linkBtn} onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
}