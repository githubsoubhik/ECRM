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
  Plus,
  RotateCcw,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  EDITABLE_STATUSES,
  STATUS_META,
  WEEKDAYS_SHORT,
  addDays,
  fmtHours,
  fromKey,
  pct,
  type DayRecord,
} from "../../../../../data/attendanceData";
import { OFFICE_LOCATIONS } from "../../../../../data/employeeData";
import { EMPTY_FILTERS, useAtt } from "./context";
import { PromoCard, QuickActions, MiniCalendar, StatusLegendCard } from "./Sidebar";
import { Avatar, MonthPicker, PageHeader, Pagination, RowMenu, SearchBox, SelectBox, StatCard, StatusPill, Tabs, cx, usePaged } from "./ui";
import styles from "../attendance.module.css";

import { type DailyAttendanceRecord } from '@/app/customHook/useAttendanceHistory';

import { useAllAttendance } from '@/app/customHook/useAttendanceHistory';




interface DailyViewProps {
  dailyAttendance: DailyAttendanceRecord[];
  dailyLoading: boolean;
  dailyError: string | null;
  refetch: () => void;
}


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

/// formetting   attandance time to 12 hour format with AM/PM and IST timezone

const formatAttendanceTime = (value?: string | null) => {
  if (!value) return '-';

  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return '—';

  return time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

const normalizeEmployeeId = (id: string) => id.trim().replace(/\s+/g, "").toUpperCase();

function normalizeStatus(value: string): DayRecord["status"] | undefined {
  const status = value.trim().toLowerCase().replace(/[ _]+/g, "-");
  const normalized = status === "on-leave" ? "leave" : status;
  return Object.prototype.hasOwnProperty.call(STATUS_META, normalized)
    ? normalized as DayRecord["status"]
    : undefined;
}

const formatBreaks = (
  breaks: DailyAttendanceRecord['breaks'] = []
) => {
  if (!breaks?.length) return '-';

  return breaks.map((item) => (
    `${formatAttendanceTime(item.start)} - ${
      item.end ? formatAttendanceTime(item.end) : 'Ongoing'
    }`
  )).join(', ');
};

export default function DailyView({
  dailyAttendance,
  dailyLoading,
  dailyError,
  refetch,
}: DailyViewProps) {
  const { employees, date, setDate: updateDate, ctx, filters, setFilters, isMobile, departments, openMark, openProfile } = useAtt();
  const [office, setOffice] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [picked, setPicked] = useState<{ date: string; ids: Set<string> }>({ date, ids: new Set() });
  const selected = picked.date === date ? picked.ids : EMPTY_SET;
  const setSelected = (update: Set<string> | ((ids: Set<string>) => Set<string>)) => {
    setPicked((current) => ({
      date,
      ids: typeof update === "function" ? update(current.date === date ? current.ids : EMPTY_SET) : update,
    }));
  };

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [normalizeEmployeeId(employee.id), employee])),
    [employees],
  );
  const records = useMemo(() => dailyAttendance.map((record) => {
    const employee = employeeById.get(normalizeEmployeeId(record.employeeId));
    return {
      id: employee?.id ?? record.employeeId,
      name: employee?.name ?? record.employeeId,
      designation: employee?.designation,
      photoUrl: employee?.photoUrl,
      department: record.department || employee?.department || "",
      employee,
      record,
      status: normalizeStatus(record.status),
    };
  }), [dailyAttendance, employeeById]);

  // const s = {
  //   total: employees.length || records.length,
  //   present: records.filter(({ status }) => status === "present" || status === "late" || status === "half-day").length,
  //   absent: records.filter(({ status }) => status === "absent").length,
  //   leave: records.filter(({ status }) => status === "leave").length,
  // };
  const isToday = date === ctx.today;
  const query = filters.q.trim().toLowerCase();
  const rows = records.filter((row) =>
    (!filters.dept || row.department === filters.dept) &&
    (!filters.type || row.employee?.employmentType === filters.type) &&
    (!filters.status || row.status === filters.status) &&
    (!office || row.employee?.officeLocation === office) &&
    (!query || [row.name, row.id, row.department, row.designation, row.employee?.email]
      .some((value) => value?.toLowerCase().includes(query))),
  );

  const paged = usePaged(rows, 8, `${date}|${JSON.stringify(filters)}|${office}`);

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
  };

  const future = date > ctx.today;
  const menuItems = (id: string, hasProfile: boolean) => [
    ...(future ? [] : [{ label: "Edit attendance", icon: Pencil, onClick: () => openMark({ ids: [id], date }) }]),
    ...(hasProfile ? [{ label: "View attendance", icon: Eye, onClick: () => openProfile(id) }] : []),
  ];

  // employee tortal count
   
const s = useMemo(() => {
  const total = dailyAttendance.length;

  const present = records.filter(({ status }) =>
    ["present", "late", "half-day"].includes(status ?? "")
  ).length;

  const absent = records.filter(
    ({ status }) => status === "absent"
  ).length;

  const leave = records.filter(
    ({ status }) => status === "leave"
  ).length;

  return {
    total,
    present,
    absent,
    leave,
  };
}, [dailyAttendance, records]);

  // const statCards = (
  //   <section className={cx(styles.stats, styles.stats4)}>
  //     <StatCard layout="labelTop" icon={Users} color="#4f6bed" soft="#e8ecfd" label="Total Employees" value={s.total} />
  //     <StatCard
  //       layout="labelTop"
  //       icon={UserCheck}
  //       color="#22a55b"
  //       soft="#e3f6ea"
  //       label={isToday ? "Present Today" : "Present"}
  //       value={toatalEmployees}
  //       badge={{ text: `${pct(s.present, s.total)}%`, color: "#15803d", soft: "#e3f6ea" }}
  //     />
  //     <StatCard
  //       layout="labelTop"
  //       icon={UserX}
  //       color="#ef4444"
  //       soft="#fde8e8"
  //       label={isToday ? "Absent Today" : "Absent"}
  //       value={s.present}
  //       badge={{ text: `${pct(s.absent, s.total)}%`, color: "#dc2626", soft: "#fde8e8" }}
  //     />
  //     <StatCard
  //       layout="labelTop"
  //       icon={CalendarClock}
  //       color="#e0a526"
  //       soft="#fef3dc"
  //       label="On Leave"
  //       value={s.absent}
  //       badge={{ text: `${pct(s.leave, s.total)}%`, color: "#b7791f", soft: "#fef3dc" }}
  //     />
  //   </section>
  // );

  const statCards = (
  <section className={cx(styles.stats, styles.stats4)}>

    {/* Total Employees */}
    <StatCard
      layout="labelTop"
      icon={Users}
      color="#4f6bed"
      soft="#e8ecfd"
      label="Total Employees"
      value={dailyLoading ? "..." : s.total}
    />

    {/* Present */}
    <StatCard
      layout="labelTop"
      icon={UserCheck}
      color="#22a55b"
      soft="#e3f6ea"
      label={isToday ? "Present Today" : "Present"}
      value={dailyLoading ? "..." : s.present}
      badge={{
        text: `${pct(s.present, s.total)}%`,
        color: "#15803d",
        soft: "#e3f6ea",
      }}
    />

    {/* Absent */}
    <StatCard
      layout="labelTop"
      icon={UserX}
      color="#ef4444"
      soft="#fde8e8"
      label={isToday ? "Absent Today" : "Absent"}
      value={dailyLoading ? "..." : s.absent}
      badge={{
        text: `${pct(s.absent, s.total)}%`,
        color: "#dc2626",
        soft: "#fde8e8",
      }}
    />

    {/* On Leave */}
    <StatCard
      layout="labelTop"
      icon={CalendarClock}
      color="#e0a526"
      soft="#fef3dc"
      label="On Leave"
      value={dailyLoading ? "..." : s.leave}
      badge={{
        text: `${pct(s.leave, s.total)}%`,
        color: "#b7791f",
        soft: "#fef3dc",
      }}
    />

  </section>
);

  const bulkBar = selected.size > 0 && (
    <div className={styles.bulkBar}>
      <strong>{selected.size} selected</strong>
      <button onClick={() => openMark({ ids: [...selected], date })} disabled={future}>
        Mark / Update Attendance
      </button>
      <button className={styles.bulkClear} onClick={() => setSelected(new Set())}>
        Clear
      </button>
    </div>
  );

  function setDate(today: string): void {
    updateDate(today);
  }

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
            </div>
          )}

          {dailyLoading ? (
            <p role="status">Loading attendance records…</p>
          ) : dailyError ? (
            <div role="alert">
              <p>{dailyError}</p>
              <button type="button" onClick={refetch}>Retry</button>
            </div>
          ) : (
            <>
          {bulkBar}

          {records.length === 0 ? (
            <p>No attendance records found for {date}.</p>
          ) : !isMobile ? (
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
                      <th>Breaks</th>
                      <th>Work Hours</th>
                      <th>Status</th>
                                            <th className={styles.cActions}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.rows.map((e, i) => {
                      return (
                        <tr key={e.id} className={cx(selected.has(e.id) && styles.rowOn)}>
                          <td className={styles.cCheck}>
                            <input type="checkbox" aria-label={`Select ${e.name}`} checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                          </td>
                          <td className={styles.cNum}>{paged.from + i}</td>
                          <td>
                            <button className={styles.person} onClick={() => openProfile(e.id)} disabled={!e.employee}>
                              <Avatar name={e.name} photoUrl={e.photoUrl} size={34} />
                              <span>
                                <b>{e.name}</b>
                                <small>{e.designation}</small>
                              </span>
                            </button>
                          </td>
                          <td>{e.department}</td>
                          <td>{formatAttendanceTime(e.record.checkIn)}</td>
                          <td>{formatAttendanceTime(e.record.checkOut)}</td>
                          <td>{formatBreaks(e.record.breaks)}</td>
                          <td>{fmtHours(e.record.workMinutes ?? 0)}</td>
                          <td>
                            {e.status ? <StatusPill status={e.status} /> : (e.record.status || "—")}
                          </td>
                          <td className={styles.cActions}>
                            <div className={styles.actionsCell}>
                           <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() =>
                                openMark({
                                  ids: [e.id],
                                  date,
                                })
                              }
                              disabled={future}
                              aria-label={`Edit ${e.name}`}
                            >
                              <Pencil size={15} />
                            </button>
                              <RowMenu
                                label={`More actions for ${e.name}`}
                                icon={<MoreHorizontal size={16} />}
                                items={menuItems(e.id, Boolean(e.employee)).filter(({ label }) => label !== "Edit attendance")}
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
                return (
                  <div key={e.id} className={styles.mRow}>
                    <button className={styles.mPerson} onClick={() => openProfile(e.id)} disabled={!e.employee}>
                      <Avatar name={e.name} photoUrl={e.photoUrl} size={42} />
                      <span>
                        <b>{e.name}</b>
                        <small>{e.designation}</small>
                        <small>{e.department}</small>
                      </span>
                    </button>
                    <div className={styles.mTime}>
                      <b>{formatAttendanceTime(e.record.checkIn)}</b>
                      <small>Check In</small>
                    </div>
                    <div className={styles.mTime}>
                      <b>{formatAttendanceTime(e.record.checkOut)}</b>
                      <small>Check Out</small>  
                    </div>
                    {e.status ? <StatusPill status={e.status} size="sm" /> : (e.record.status || "—")}
                    <RowMenu
                      label={`Actions for ${e.name}`}
                      icon={<MoreVertical size={17} />}
                      items={menuItems(e.id, Boolean(e.employee))}
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
            </>
          )}
        </div>

        {!isMobile && (
          <aside className={styles.aside}>
            <MiniCalendar />
            <StatusLegendCard />
            <QuickActions variant="daily"    />
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