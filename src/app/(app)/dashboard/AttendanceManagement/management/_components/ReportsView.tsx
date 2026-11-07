"use client";

// Reports: month overview, trends, department comparison and exports.

import { useMemo } from "react";
import { AlertTriangle, CalendarDays, Clock3, Download, FileSpreadsheet, FileText, Percent, Plane, UserX } from "lucide-react";
import {
  MONTHS,
  STATUS_META,
  downloadCsv,
  employeeMonth,
  fmtHours,
  fmtTime,
  fromKey,
  monthKeys,
  pct,
  recordsForDay,
  summarize,
  type AttStatus,
} from "../../../../../data/attendanceData";
import { useAtt } from "./context";
import { Avatar, Donut, Dot, MonthPicker, PageHeader, SelectBox, StatCard, Tabs, barColor, cx, shortDept } from "./ui";
import styles from "../attendance.module.css";

export default function ReportsView() {
  const { employees, year, month, date, ctx, filters, setFilters, applyFilters, departments, isMobile, exportMonth, openProfile, notify } = useAtt();
  const scoped = useMemo(() => applyFilters(employees, { ...filters, status: "", q: "" }), [employees, filters, applyFilters]);

  const monthData = useMemo(() => scoped.map((e) => ({ e, m: employeeMonth(e, year, month, ctx) })), [scoped, year, month, ctx]);

  const days = useMemo(
    () =>
      monthKeys(year, month)
        .filter((k) => k <= ctx.today)
        .map((k) => ({ k, s: summarize(recordsForDay(scoped, k, ctx)) })),
    [scoped, year, month, ctx],
  );
  const working = days.filter((d) => !d.s.offDay);

  const totals = monthData.reduce(
    (t, { m }) => ({
      onTime: t.onTime + m.onTime,
      late: t.late + m.late,
      halfDay: t.halfDay + m.halfDay,
      leave: t.leave + m.leave,
      absent: t.absent + m.absent,
      work: t.work + m.workingDays,
    }),
    { onTime: 0, late: 0, halfDay: 0, leave: 0, absent: 0, work: 0 },
  );
  const avgPct = monthData.length ? Math.round(monthData.reduce((s, { m }) => s + m.percent, 0) / monthData.length) : 0;

  const deptRows = useMemo(() => {
    const map = new Map<string, number[]>();
    monthData.forEach(({ e, m }) => map.set(e.department, [...(map.get(e.department) ?? []), m.percent]));
    return [...map.entries()]
      .map(([d, list]) => ({ d, n: list.length, p: Math.round(list.reduce((a, b) => a + b, 0) / list.length) }))
      .sort((a, b) => b.p - a.p);
  }, [monthData]);

  const lowest = [...monthData].sort((a, b) => a.m.percent - b.m.percent).slice(0, 5);
  const mostLate = [...monthData]
    .filter((x) => x.m.late > 0)
    .sort((a, b) => b.m.late - a.m.late)
    .slice(0, 5);

  const exportDay = () => {
    const recs = recordsForDay(scoped, date, ctx);
    const byId = new Map(scoped.map((e) => [e.id, e]));
    downloadCsv(`attendance-${date}.csv`, [
      ["Employee ID", "Name", "Department", "Check In", "Check Out", "Work Hours", "Status", "Remarks"],
      ...recs.map((r) => {
        const e = byId.get(r.employeeId)!;
        return [
          e.id,
          e.name,
          e.department,
          fmtTime(r.checkIn),
          fmtTime(r.checkOut),
          fmtHours(r.workMinutes),
          r.status ? STATUS_META[r.status].label : "",
          r.remarks,
        ];
      }),
    ]);
    notify("Daily attendance log downloaded.");
  };

  const exportSummary = () => {
    downloadCsv(`attendance-summary-${year}-${String(month + 1).padStart(2, "0")}.csv`, [
      ["Employee ID", "Name", "Department", "Present", "Late", "Half Day", "On Leave", "Absent", "Working Days", "Attendance %"],
      ...monthData.map(({ e, m }) => [e.id, e.name, e.department, m.onTime, m.late, m.halfDay, m.leave, m.absent, m.workingDays, m.percent]),
    ]);
    notify("Monthly summary downloaded.");
  };

  const breakdown: { k: AttStatus; v: number }[] = [
    { k: "present", v: totals.onTime },
    { k: "late", v: totals.late },
    { k: "half-day", v: totals.halfDay },
    { k: "leave", v: totals.leave },
    { k: "absent", v: totals.absent },
  ];
  const d = fromKey(date);

  return (
    <div
  style={{
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "#040718",
  }}
>
  <div
    style={{
      fontSize: "56px",
      fontWeight: 800,
      lineHeight: 1.1,
      marginBottom: "12px",
    }}
  >
    Coming Soon...
  </div> 

  <div
    style={{
      fontSize: "18px",
      color: "#6b7280",
    }}
  >
    This feature is currently under development.
  </div>
</div>


  // this below code are full Full-fledged code for the REPORT_PAGE :- just u need to uncomment it and delete the above code for see teh resulte .
// [-----------------------------------------------------------------X----------------------------------------------------------------------------]
    // <div className={styles.main}>
    //   <PageHeader
    //     crumb="Reports"
    //     subtitle="Monthly insights, trends and downloadable attendance reports"
    //     actions={
    //       <>
    //         <MonthPicker withArrows={!isMobile} />
    //         {!isMobile && (
    //           <button className={styles.primaryBtn} onClick={exportMonth}>
    //             <Download size={18} /> Download Report
    //           </button>
    //         )}
    //       </>
    //     }
    //   />
    //   <Tabs />
    //   <section className={cx(styles.stats, styles.stats5)}>
    //     <StatCard icon={CalendarDays} color="#4f6bed" soft="#e8ecfd" label="Working Days" value={working.length} />
    //     <StatCard icon={Percent} color="#22a55b" soft="#e3f6ea" label="Avg. Attendance" value={`${avgPct}%`} />
    //     <StatCard icon={Clock3} color="#e0a526" soft="#fef3dc" label="Late Arrivals" value={totals.late} />
    //     <StatCard icon={Plane} color="#4a8df0" soft="#e4eefd" label="Leave Days" value={totals.leave} />
    //     <StatCard icon={UserX} color="#ef4444" soft="#fde8e8" label="Absences" value={totals.absent} />
    //   </section>

    //   <div className={styles.filters}>
    //     <SelectBox value={filters.dept} onChange={(v) => setFilters({ ...filters, dept: v })} options={departments} allLabel="All Departments" />
    //     <SelectBox
    //       value={filters.type}
    //       onChange={(v) => setFilters({ ...filters, type: v })}
    //       options={["Full-time", "Part-time", "Contract", "Intern"]}
    //       allLabel="All Employment Types"
    //     />
    //   </div>

    //   <div className={styles.reportGrid}>
    //     <section className={cx(styles.card, styles.reportCard, styles.span2)}>
    //       <header>
    //         <strong>Daily Attendance Trend</strong>
    //         <small>
    //           {MONTHS[month]} {year} · % of employees present each day
    //         </small>
    //       </header>
    //       <div className={styles.trend}>
    //         {monthKeys(year, month).map((k) => {
    //           const day = days.find((x) => x.k === k);
    //           const off = day?.s.offDay;
    //           const p = day && !off ? pct(day.s.present, day.s.total) : 0;
    //           return (
    //             <div
    //               key={k}
    //               className={styles.trendCol}
    //               title={day ? (off ? "Off day" : `${fromKey(k).getDate()} ${MONTHS[month].slice(0, 3)}: ${p}% present`) : "Upcoming"}
    //             >
    //               <span className={styles.trendBar}>
    //                 <i style={{ height: `${off ? 6 : p}%`, background: off ? "#d9dce3" : day ? barColor(p) : "transparent" }} />
    //               </span>
    //               <small>{fromKey(k).getDate()}</small>
    //             </div>
    //           );
    //         })}
    //       </div>
    //     </section>

    //     <section className={cx(styles.card, styles.reportCard)}>
    //       <header>
    //         <strong>Status Breakdown</strong>
    //         <small>All working days this month</small>
    //       </header>
    //       <div className={styles.breakdown}>
    //         <Donut total={scoped.length} parts={breakdown.map((b) => ({ value: b.v, color: STATUS_META[b.k].color }))} size={130} />
    //         <ul>
    //           {breakdown.map((b) => (
    //             <li key={b.k}>
    //               <Dot status={b.k} size={9} /> <span>{STATUS_META[b.k].label}</span>
    //               <b>{b.v}</b>
    //               <em>{pct(b.v, totals.work)}%</em>
    //             </li>
    //           ))}
    //         </ul>
    //       </div>
    //     </section>

    //     <section className={cx(styles.card, styles.reportCard)}>
    //       <header>
    //         <strong>Department-wise Attendance</strong>
    //         <small>Average monthly attendance %</small>
    //       </header>
    //       <ul className={styles.deptBars}>
    //         {deptRows.map((r) => (
    //           <li key={r.d}>
    //             <span>
    //               {shortDept(r.d)} <small>({r.n})</small>
    //             </span>
    //             <span className={styles.bar}>
    //               <i style={{ width: `${r.p}%`, background: barColor(r.p) }} />
    //             </span>
    //             <b>{r.p}%</b>
    //           </li>
    //         ))}
    //       </ul>
    //     </section>

    //     <section className={cx(styles.card, styles.reportCard)}>
    //       <header>
    //         <strong>Needs Attention</strong>
    //         <small>Lowest attendance this month</small>
    //       </header>
    //       <ul className={styles.rankList}>
    //         {lowest.map(({ e, m }) => (
    //           <li key={e.id}>
    //             <button className={styles.person} onClick={() => openProfile(e.id)}>
    //               <Avatar name={e.name} photoUrl={e.photoUrl} size={30} />
    //               <span>
    //                 <b>{e.name}</b>
    //                 <small>
    //                   {m.absent} absent · {m.leave} leave
    //                 </small>
    //               </span>
    //             </button>
    //             <b style={{ color: barColor(m.percent) }}>{m.percent}%</b>
    //           </li>
    //         ))}
    //       </ul>
    //     </section>

    //     <section className={cx(styles.card, styles.reportCard)}>
    //       <header>
    //         <strong>Frequent Late Arrivals</strong>
    //         <small>Most late check-ins this month</small>
    //       </header>
    //       {mostLate.length ? (
    //         <ul className={styles.rankList}>
    //           {mostLate.map(({ e, m }) => (
    //             <li key={e.id}>
    //               <button className={styles.person} onClick={() => openProfile(e.id)}>
    //                 <Avatar name={e.name} photoUrl={e.photoUrl} size={30} />
    //                 <span>
    //                   <b>{e.name}</b>
    //                   <small>{shortDept(e.department)}</small>
    //                 </span>
    //               </button>
    //               <span className={styles.pill} style={{ color: STATUS_META.late.text, background: STATUS_META.late.soft }}>
    //                 <AlertTriangle size={12} /> {m.late} late
    //               </span>
    //             </li>
    //           ))}
    //         </ul>
    //       ) : (
    //         <p className={styles.muted}>No late arrivals this month.</p>
    //       )}
    //     </section>

    //     <section className={cx(styles.card, styles.reportCard, styles.span2)}>
    //       <header>
    //         <strong>Download Reports</strong>
    //         <small>CSV files open in Excel and Google Sheets</small>
    //       </header>
    //       <div className={styles.exportGrid}>
    //         <button onClick={exportMonth}>
    //           <FileSpreadsheet size={22} />
    //           <b>Monthly Register</b>
    //           <small>Every employee × every day, {MONTHS[month]}</small>
    //         </button>
    //         <button onClick={exportSummary}>
    //           <FileText size={22} />
    //           <b>Employee Summary</b>
    //           <small>Totals and attendance % per employee</small>
    //         </button>
    //         <button onClick={exportDay}>
    //           <Download size={22} />
    //           <b>Daily Log</b>
    //           <small>
    //             Check-ins for {d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)} {d.getFullYear()}
    //           </small>
    //         </button>
    //       </div>
    //     </section>
    //   </div>
    // </div>
  );
}
