"use client";

// Employee View: month totals per employee + a profile panel.

import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  MoreVertical,
  Pencil,
  Plane,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserX,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  EDITABLE_STATUSES,
  STATUS_META,
  downloadCsv,
  employeeMonth,
  fmtTime,
  pct,
  recentActivity,
  summarize,
  type AttStatus,
  type EmployeeMonth,
} from "../../../../../data/attendanceData";
import { isAddedEmployee } from "../../../../../data/employeeData";
import { EMPTY_FILTERS, useAtt, type Member } from "./context";
import { EmptyRows } from "./DailyView";
import {
  ActivityList,
  Avatar,
  MonthPicker,
  PageHeader,
  Pagination,
  RowMenu,
  RowsPerPage,
  SearchBox,
  SelectBox,
  StatCard,
  Tabs,
  barColor,
  cx,
  shortDept,
  usePaged,
} from "./ui";
import styles from "../attendance.module.css";

const STATUS_ICON: Partial<Record<AttStatus, LucideIcon>> = {
  present: CheckCircle2,
  late: Clock3,
  absent: XCircle,
  leave: Plane,
  "half-day": Clock3,
};

function TodayStatus({ status }: { status: AttStatus | null }) {
  if (!status) return <span className={styles.muted}>—</span>;
  const m = STATUS_META[status];
  const Icon = STATUS_ICON[status];
  return (
    <span className={styles.statusTag} style={{ color: m.text, background: m.soft }}>
      {Icon ? <Icon size={14} /> : <i style={{ background: m.color }} />}
      {m.label}
    </span>
  );
}

function PercentBar({ value }: { value: number }) {
  return (
    <span className={styles.pctCell}>
      <b>{value}%</b>
      <span className={styles.bar}>
        <i style={{ width: `${value}%`, background: barColor(value) }} />
      </span>
    </span>
  );
}

const STATUS_OPTIONS = EDITABLE_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }));

export default function EmployeeView() {
  const {
    employees,
    year,
    month,
    date,
    ctx,
    record,
    filters,
    setFilters,
    applyFilters,
    departments,
    isMobile,
    openMark,
    openProfile,
    selectedEmp,
    setSelectedEmp,
    notify,
  } = useAtt();
  const [perPage, setPerPage] = useState(8);
  const [lowOnly, setLowOnly] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mSearch, setMSearch] = useState(false);
  const [showAllDepts, setShowAllDepts] = useState(false);

  // "Today" means the selected date when looking at an older month.
  const refDate = date;
  const isToday = refDate === ctx.today;

  const monthStats = useMemo(() => {
    const m = new Map<string, EmployeeMonth>();
    employees.forEach((e) => m.set(e.id, employeeMonth(e, year, month, ctx)));
    return m;
  }, [employees, year, month, ctx]);

  const rows = useMemo(() => {
    let list = applyFilters(employees, filters, refDate);
    if (lowOnly) list = list.filter((e) => (monthStats.get(e.id)?.percent ?? 100) < 80);
    return list;
  }, [employees, filters, refDate, applyFilters, lowOnly, monthStats]);

  const paged = usePaged(rows, perPage, `${JSON.stringify(filters)}|${lowOnly}|${year}-${month}`);

  // Keep a selected employee for the profile panel.
  // The profile panel shows the clicked employee, or the first one in the list.
  const activeEmp = selectedEmp && employees.some((e) => e.id === selectedEmp) ? selectedEmp : (rows[0]?.id ?? employees[0]?.id ?? null);

  const s = summarize(employees.map((e) => record(e.id, refDate)));
  const added = employees.filter((e) => isAddedEmployee(e.id)).length;
  const when = isToday ? "Today" : "";

  const stats = (
    <section className={cx(styles.stats, isMobile ? styles.stats4 : styles.stats5)}>
      <StatCard
        icon={Users}
        color="#4f6bed"
        soft="#e8ecfd"
        label="Total Employees"
        value={s.total}
        sub={!isMobile ? <span className={styles.subUp}>{added ? `↑ +${added} added this session` : `${departments.length} departments`}</span> : undefined}
      />
      <StatCard
        icon={UserCheck}
        color="#22a55b"
        soft="#e3f6ea"
        label={`Present ${when}`.trim()}
        value={s.present}
        badge={isMobile ? { text: `${pct(s.present, s.total)}%`, color: "#15803d", soft: "#e3f6ea" } : undefined}
        sub={
          !isMobile ? (
            <span className={styles.subPill} style={{ color: "#15803d", background: "#e3f6ea" }}>
              {pct(s.present, s.total)}% of total
            </span>
          ) : undefined
        }
      />
      <StatCard
        icon={UserX}
        color="#ef4444"
        soft="#fde8e8"
        label={`Absent ${when}`.trim()}
        value={s.absent}
        badge={isMobile ? { text: `${pct(s.absent, s.total)}%`, color: "#dc2626", soft: "#fde8e8" } : undefined}
        sub={
          !isMobile ? (
            <span className={styles.subPill} style={{ color: "#dc2626", background: "#fde8e8" }}>
              {pct(s.absent, s.total)}% of total
            </span>
          ) : undefined
        }
      />
      <StatCard
        icon={CalendarClock}
        color="#e0a526"
        soft="#fef3dc"
        label={`Late ${when}`.trim()}
        value={s.late}
        badge={isMobile ? { text: `${pct(s.late, s.total)}%`, color: "#b7791f", soft: "#fef3dc" } : undefined}
        sub={
          !isMobile ? (
            <span className={styles.subPill} style={{ color: "#b7791f", background: "#fef3dc" }}>
              {pct(s.late, s.total)}% of total
            </span>
          ) : undefined
        }
      />
      {!isMobile && (
        <StatCard
          icon={Plane}
          color="#6366f1"
          soft="#e9e8fd"
          label={`On Leave ${when}`.trim()}
          value={s.leave}
          sub={
            <span className={styles.subPill} style={{ color: "#4f46e5", background: "#e9e8fd" }}>
              {pct(s.leave, s.total)}% of total
            </span>
          }
        />
      )}
    </section>
  );

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setLowOnly(false);
  };

  const exportSummary = () => {
    const header = [
      "Employee ID",
      "Name",
      "Department",
      "Employment Type",
      "Today's Status",
      "Present",
      "Absent",
      "Late",
      "Half Day",
      "On Leave",
      "Attendance %",
    ];
    const body = rows.map((e) => {
      const m = monthStats.get(e.id)!;
      const r = record(e.id, refDate);
      return [
        e.id,
        e.name,
        e.department,
        e.employmentType,
        r.status ? STATUS_META[r.status].label : "",
        m.onTime,
        m.absent,
        m.late,
        m.halfDay,
        m.leave,
        m.percent,
      ];
    });
    downloadCsv(`attendance-employees-${year}-${String(month + 1).padStart(2, "0")}.csv`, [header, ...body]);
    notify("Employee attendance exported.");
  };

  const exportOne = (e: Member) => {
    const m = monthStats.get(e.id)!;
    const body = m.records.filter((r) => r.status).map((r) => [r.date, STATUS_META[r.status!].label, fmtTime(r.checkIn), fmtTime(r.checkOut), r.remarks]);
    downloadCsv(`attendance-${e.id}-${year}-${String(month + 1).padStart(2, "0")}.csv`, [["Date", "Status", "Check In", "Check Out", "Remarks"], ...body]);
  };

  const menu = (e: Member) => [
    { label: "View details", icon: Eye, onClick: () => (isMobile ? openProfile(e.id) : setSelectedEmp(e.id)) },
    { label: "Mark / Update", icon: Pencil, onClick: () => openMark({ ids: [e.id] }) },
    { label: "Full attendance", icon: CalendarClock, onClick: () => openProfile(e.id) },
    { label: "Download CSV", icon: Download, onClick: () => exportOne(e) },
  ];

  /* ---------------- Mobile ---------------- */
  if (isMobile) {
    const deptCounts = departments.map((d) => ({ d, n: employees.filter((e) => e.department === d).length }));
    const chips = showAllDepts ? deptCounts : deptCounts.slice(0, 3);
    return (
      <div className={styles.main}>
        <PageHeader crumb="Employee View" subtitle="View individual employee attendance and detailed records" />
        <Tabs />
        <div className={styles.mToolbar}>
          <MonthPicker />
          <button className={cx(styles.outlineBtn, showMore && styles.outlineOn)} onClick={() => setShowMore((v) => !v)}>
            <SlidersHorizontal size={16} /> Filters
          </button>
          <button className={cx(styles.outlineBtn, styles.iconOnly, mSearch && styles.outlineOn)} onClick={() => setMSearch((v) => !v)} aria-label="Search">
            <Search size={17} />
          </button>
        </div>
        {showMore && (
          <div className={styles.moreFilters}>
            <SelectBox
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
              options={["Full-time", "Part-time", "Contract", "Intern"]}
              allLabel="All Types"
            />
            <SelectBox value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={STATUS_OPTIONS} allLabel="All Status" />
            <label className={styles.check}>
              <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Below 80% attendance
            </label>
            <button className={styles.linkBtn} onClick={reset}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        )}
        {stats}
        <div className={styles.chipRow}>
          <button className={cx(!filters.dept && styles.chipOn)} onClick={() => setFilters({ ...filters, dept: "" })}>
            All ({employees.length})
          </button>
          {chips.map(({ d, n }) => (
            <button key={d} className={cx(filters.dept === d && styles.chipOn)} onClick={() => setFilters({ ...filters, dept: filters.dept === d ? "" : d })}>
              {shortDept(d)} ({n})
            </button>
          ))}
          {deptCounts.length > 3 && (
            <button onClick={() => setShowAllDepts((v) => !v)}>
              {showAllDepts ? "Less" : "More"} <ChevronDown size={14} style={{ transform: showAllDepts ? "rotate(180deg)" : undefined }} />
            </button>
          )}
        </div>
        {(mSearch || filters.q) && (
          <SearchBox value={filters.q} onChange={(v) => setFilters({ ...filters, q: v })} placeholder="Search employees by name, ID, or department..." />
        )}
        <div className={styles.mEmpList}>
          {paged.rows.map((e) => {
            const m = monthStats.get(e.id)!;
            const r = record(e.id, refDate);
            return (
              <div key={e.id} className={styles.mEmpRow}>
                <button className={styles.mEmpTop} onClick={() => openProfile(e.id)}>
                  <Avatar name={e.name} photoUrl={e.photoUrl} size={44} />
                  <span>
                    <b>{e.name}</b>
                    <small>
                      {e.id} | {shortDept(e.department)}
                    </small>
                  </span>
                </button>
                <TodayStatus status={r.status} />
                <RowMenu label={`Actions for ${e.name}`} icon={<MoreVertical size={17} />} items={menu(e)} />
                <div className={styles.mEmpStats}>
                  <span>
                    <b>{m.present}</b>
                    <small>Present</small>
                  </span>
                  <span>
                    <b>{m.absent}</b>
                    <small>Absent</small>
                  </span>
                  <span>
                    <b>{m.late}</b>
                    <small>Late</small>
                  </span>
                  <span>
                    <b>{m.leave}</b>
                    <small>On Leave</small>
                  </span>
                  <span>
                    <b>{m.percent}%</b>
                    <small>Attendance</small>
                  </span>
                </div>
              </div>
            );
          })}
          {!rows.length && <EmptyRows onReset={reset} />}
        </div>
        <div className={styles.tableFoot}>
          <span>
            Showing {paged.from} to {paged.to} of {paged.total} employees
          </span>
          <Pagination page={paged.page} pages={paged.pages} onPage={paged.setPage} compact />
        </div>
      </div>
    );
  }

  /* ---------------- Desktop ---------------- */
  const sel = employees.find((e) => e.id === activeEmp) ?? null;
  const selStats = sel ? monthStats.get(sel.id)! : null;
  const selToday = sel ? record(sel.id, refDate) : null;

  return (
    <>
      <PageHeader
        crumb="Employee View"
        subtitle="View individual employee attendance and detailed records"
        actions={
          <>
            <MonthPicker />
            <button className={styles.primaryBtn} onClick={exportSummary}>
              <Download size={18} /> Export Attendance
            </button>
          </>
        }
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <Tabs />
          {stats}
          <div className={cx(styles.filters, styles.empFilters)}>
            <SelectBox value={filters.dept} onChange={(v) => setFilters({ ...filters, dept: v })} options={departments} allLabel="All Departments" />
            <SelectBox
              value={filters.type}
              onChange={(v) => setFilters({ ...filters, type: v })}
              options={["Full-time", "Part-time", "Contract", "Intern"]}
              allLabel="All Employment Types"
            />
            <SelectBox value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={STATUS_OPTIONS} allLabel="All Status" />
            <SearchBox value={filters.q} onChange={(v) => setFilters({ ...filters, q: v })} placeholder="Search employees..." />
            <button
              className={cx(styles.outlineBtn, lowOnly && styles.outlineOn)}
              onClick={() => setLowOnly((v) => !v)}
              title="Show employees below 80% attendance"
            >
              <SlidersHorizontal size={16} /> {lowOnly ? "Below 80%" : "Filter"}
            </button>
            <button className={styles.outlineBtn} onClick={reset}>
              <RotateCcw size={16} /> Reset
            </button>
          </div>

          <div className={cx(styles.card, styles.tableCard)}>
            <div className={styles.tableScroll}>
              <table className={cx(styles.table, styles.empTable)}>
                <thead>
                  <tr>
                    <th rowSpan={2} className={styles.cNum}>
                      #
                    </th>
                    <th rowSpan={2}>Employee</th>
                    <th rowSpan={2}>Department</th>
                    <th rowSpan={2}>Employment Type</th>
                    <th rowSpan={2}>{isToday ? "Today's Status" : "Status"}</th>
                    <th colSpan={4} className={styles.groupHead}>
                      This Month
                    </th>
                    <th rowSpan={2}>Attendance %</th>
                    <th rowSpan={2} className={styles.cActions}>
                      Actions
                    </th>
                  </tr>
                  <tr className={styles.subHeadRow}>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>On Leave</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.rows.map((e, i) => {
                    const m = monthStats.get(e.id)!;
                    const r = record(e.id, refDate);
                    return (
                      <tr key={e.id} className={cx(styles.clickRow, activeEmp === e.id && styles.rowOn)} onClick={() => setSelectedEmp(e.id)}>
                        <td className={styles.cNum}>{paged.from + i}</td>
                        <td>
                          <span className={styles.person}>
                            <Avatar name={e.name} photoUrl={e.photoUrl} size={34} />
                            <span>
                              <b>{e.name}</b>
                              <small>{e.id}</small>
                            </span>
                          </span>
                        </td>
                        <td>{shortDept(e.department)}</td>
                        <td>{e.employmentType}</td>
                        <td>
                          <TodayStatus status={r.status} />
                        </td>
                        <td className={styles.num}>{m.present}</td>
                        <td className={styles.num}>{m.absent}</td>
                        <td className={styles.num}>{m.late}</td>
                        <td className={styles.num}>{m.leave}</td>
                        <td>
                          <PercentBar value={m.percent} />
                        </td>
                        <td className={styles.cActions} onClick={(ev) => ev.stopPropagation()}>
                          <RowMenu label={`Actions for ${e.name}`} icon={<MoreVertical size={17} />} items={menu(e)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!rows.length && <EmptyRows onReset={reset} />}
            </div>
          </div>
          <div className={styles.tableFoot}>
            <span>
              Showing {paged.from} to {paged.to} of {paged.total} employees
            </span>
            <div className={styles.footRight}>
              <Pagination page={paged.page} pages={paged.pages} onPage={paged.setPage} />
              <RowsPerPage value={perPage} onChange={setPerPage} />
            </div>
          </div>
        </div>

        <aside className={styles.aside}>
          {sel && selStats && selToday && (
            <section className={cx(styles.card, styles.profileCard)}>
              <div className={styles.profileTop}>
                <Avatar name={sel.name} photoUrl={sel.photoUrl} size={64} />
                <div>
                  <strong>{sel.name}</strong>
                  <small>{sel.id}</small>
                  <small>
                    {shortDept(sel.department)} <span className={styles.sep}>|</span> {sel.employmentType}
                  </small>
                </div>
              </div>
              <div className={styles.profileStatus}>
                <TodayStatus status={selToday.status} />
                {isToday && selToday.status && <span className={styles.muted}>Today</span>}
              </div>
              <div className={styles.miniStats}>
                {(
                  [
                    ["present", selStats.present, "Present", UserCheck],
                    ["absent", selStats.absent, "Absent", XCircle],
                    ["late", selStats.late, "Late", Clock3],
                    ["half-day", selStats.leave, "On Leave", Plane],
                  ] as [AttStatus, number, string, LucideIcon][]
                ).map(([k, v, l, Icon]) => (
                  <div key={l} style={{ background: STATUS_META[k].soft }}>
                    <Icon size={16} color={STATUS_META[k].color} />
                    <strong>{v}</strong>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className={styles.percentRow}>
                <span>
                  <b>{selStats.percent}%</b> Monthly Attendance
                </span>
                <div className={styles.bar}>
                  <i style={{ width: `${selStats.percent}%`, background: barColor(selStats.percent) }} />
                </div>
              </div>
              <button className={styles.primaryBtn} onClick={() => openProfile(sel.id)}>
                View Full Attendance
              </button>
              <div className={styles.activityHead}>
                <strong>Recent Activity</strong>
                <button className={styles.linkBtn} onClick={() => openProfile(sel.id)}>
                  View All
                </button>
              </div>
              <ActivityList items={recentActivity(sel, ctx, 5)} />
            </section>
          )}
        </aside>
      </div>
    </>
  );
}