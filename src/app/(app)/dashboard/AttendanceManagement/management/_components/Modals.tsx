"use client";

// Mark / Update, Import, Settings and the employee attendance sheet.

import { useMemo, useRef, useState } from "react";
import { Check, Download, FileUp, RotateCcw, Search, UploadCloud } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  HOLIDAYS,
  IMPORT_TEMPLATE,
  EDITABLE_STATUSES,
  MONTHS,
  STATUS_META,
  WEEKDAYS_SHORT,
  clearAttendance,
  daysInMonth,
  downloadCsv,
  employeeMonth,
  fmtTime,
  loadSettings,
  parseImport,
  recentActivity,
  saveSettings,
  setAttendance,
  toKey,
  toMinutes,
  type AttSettings,
  type AttStatus,
  type ImportRow,
} from "../../../../../data/attendanceData";
import { useAtt } from "./context";
import { ActivityList, Avatar, Modal, StatusPill, barColor, cx, shortDept } from "./ui";
import styles from "../attendance.module.css";

const needsTimes = (s: AttStatus) => s === "present" || s === "late" || s === "half-day";

/* ------------------------------------------------------------------ */
/* Mark / Update attendance                                            */
/* ------------------------------------------------------------------ */

export function MarkModal({
  initialIds,
  initialDate,
  onClose,
  onSaved,
}: {
  initialIds: string[];
  initialDate: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { employees, record, ctx } = useAtt();

  // When exactly one employee is picked, the form starts from their existing record.
  // This runs from the change handlers (not an effect), as React recommends.
  const formFor = (idSet: Set<string>, d: string) => {
    if (idSet.size !== 1) return null;
    const id = [...idSet][0];
    const emp = employees.find((e) => e.id === id);
    if (!emp) return null;
    const r = record(id, d);
    return {
      status: r.status && EDITABLE_STATUSES.includes(r.status) ? r.status : ("present" as AttStatus),
      checkIn: r.checkIn ?? emp.shiftStart ?? "09:30",
      // Today: leave check-out empty unless it already happened.
      checkOut: r.checkOut ?? (d === ctx.today ? "" : "18:30"),
      remarks: r.remarks && !["Not checked in yet", "Working", "Weekly off"].includes(r.remarks) ? r.remarks : "",
    };
  };
  const initial = formFor(new Set(initialIds), initialDate);

  const [date, setDate] = useState(initialDate);
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AttStatus>(initial?.status ?? "present");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "09:30");
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? (initialDate === ctx.today ? "" : "18:30"));
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [error, setError] = useState("");

  const single = ids.size === 1 ? (employees.find((e) => ids.has(e.id)) ?? null) : null;
  const current = single ? record(single.id, date) : null;

  // Apply the new selection / date and prefill the form for a single employee.
  const pick = (idSet: Set<string>, d: string) => {
    setIds(idSet);
    setDate(d);
    const f = formFor(idSet, d);
    if (!f) return;
    setStatus(f.status);
    setCheckIn(f.checkIn);
    setCheckOut(f.checkOut);
    setRemarks(f.remarks);
  };

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => !q || [e.name, e.id, e.department].some((v) => v.toLowerCase().includes(q)));
  }, [employees, search]);
  const allOn = list.length > 0 && list.every((e) => ids.has(e.id));

  const toggle = (id: string) => {
    const n = new Set(ids);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    pick(n, date);
  };

  const save = () => {
    setError("");
    if (!date || date > ctx.today) return setError("Choose today or a past date.");
    if (!ids.size) return setError("Select at least one employee.");
    if (needsTimes(status)) {
      if (!checkIn) return setError("Enter the check-in time.");
      if (checkOut && toMinutes(checkOut) <= toMinutes(checkIn)) return setError("Check-out must be after check-in.");
    }
    const chosen = employees.filter((e) => ids.has(e.id));
    setAttendance(chosen, date, { status, checkIn: needsTimes(status) ? checkIn : null, checkOut: needsTimes(status) ? checkOut || null : null, remarks });
    onSaved(
      chosen.length === 1
        ? `${chosen[0].name} marked ${STATUS_META[status].label} for ${prettyDate(date)}.`
        : `${chosen.length} employees marked ${STATUS_META[status].label} for ${prettyDate(date)}.`,
    );
  };

  const resetAuto = () => {
    if (!single) return;
    clearAttendance(single, date);
    onSaved(`Manual change removed for ${single.name}.`);
  };

  return (
    <Modal
      title="Mark / Update Attendance"
      subtitle="Set attendance for one or more employees on a day."
      onClose={onClose}
      wide
      footer={
        <>
          <span className={styles.footNote}>
            {ids.size} {ids.size === 1 ? "employee" : "employees"} selected
          </span>
          <button className={styles.ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={save}>
            <Check size={17} /> Save Attendance
          </button>
        </>
      }
    >
      <div className={styles.formGrid}>
        <div className={styles.formCol}>
          <label className={styles.field}>
            <span>Date</span>
            <input type="date" value={date} max={ctx.today} onChange={(e) => pick(ids, e.target.value)} />
          </label>

          <div className={styles.field}>
            <span>Status</span>
            <div className={styles.statusChoice}>
              {EDITABLE_STATUSES.map((s) => {
                const m = STATUS_META[s];
                const on = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setStatus(s)}
                    style={on ? { color: m.text, background: m.soft, borderColor: m.color } : undefined}
                  >
                    <i style={{ background: m.color }} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {needsTimes(status) && (
            <div className={styles.twoCol}>
              <label className={styles.field}>
                <span>Check In</span>
                <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </label>
              <label className={styles.field}>
                <span>Check Out</span>
                <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </label>
            </div>
          )}

          <label className={styles.field}>
            <span>Remarks</span>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Approved leave, Traffic, Client visit" />
          </label>

          {single && current && (
            <div className={styles.currentBox}>
              <span>Current record</span>
              <StatusPill status={current.status} size="sm" />
              <small>
                {current.checkIn ? `${fmtTime(current.checkIn)} – ${fmtTime(current.checkOut)}` : current.remarks || "—"}
                {current.source === "manual" ? " · edited manually" : current.source === "live" ? " · from check-in kiosk" : ""}
              </small>
              {current.source === "manual" && (
                <button className={styles.linkBtn} onClick={resetAuto}>
                  <RotateCcw size={13} /> Reset to automatic
                </button>
              )}
            </div>
          )}
          {error && <p className={styles.formError}>{error}</p>}
        </div>

        <div className={cx(styles.formCol, styles.pickCol)}>
          <div className={styles.pickHead}>
            <span>Employees</span>
            <button
              className={styles.linkBtn}
              onClick={() => {
                const n = new Set(ids);
                list.forEach((e) => (allOn ? n.delete(e.id) : n.add(e.id)));
                pick(n, date);
              }}
            >
              {allOn ? "Clear all" : "Select all"}
            </button>
          </div>
          <label className={styles.pickSearch}>
            <Search size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID or department" />
          </label>
          <div className={styles.pickList}>
            {list.map((e) => (
              <label key={e.id} className={cx(ids.has(e.id) && styles.picked)}>
                <input type="checkbox" checked={ids.has(e.id)} onChange={() => toggle(e.id)} />
                <Avatar name={e.name} photoUrl={e.photoUrl} size={30} />
                <span>
                  <b>{e.name}</b>
                  <small>
                    {e.id} · {shortDept(e.department)}
                  </small>
                </span>
              </label>
            ))}
            {!list.length && <p className={styles.muted}>No employees match.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

const prettyDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

export function ImportModal({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const { employees, ctx } = useAtt();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setRows([]);
      setErrors(["Please upload a .csv file. In Excel use File → Save As → CSV (Comma delimited)."]);
      return;
    }
    const text = await file.text();
    const res = parseImport(text, new Set(employees.map((e) => e.id)), ctx.today);
    setRows(res.rows);
    setErrors(res.errors);
  };

  const doImport = () => {
    const byId = new Map(employees.map((e) => [e.id, e]));
    rows.forEach((r) => setAttendance([byId.get(r.employeeId)!], r.date, r.input));
    onSaved(`${rows.length} attendance ${rows.length === 1 ? "record" : "records"} imported.`);
  };

  return (
    <Modal
      title="Import Attendance"
      subtitle="Upload a CSV exported from Excel or Google Sheets."
      onClose={onClose}
      footer={
        <>
          <button className={styles.ghostBtn} onClick={() => downloadCsv("attendance-import-template.csv", IMPORT_TEMPLATE)}>
            <Download size={16} /> Template
          </button>
          <span className={styles.footSpacer} />
          <button className={styles.ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryBtn} onClick={doImport} disabled={!rows.length}>
            <FileUp size={16} /> Import {rows.length ? `${rows.length} rows` : ""}
          </button>
        </>
      }
    >
      <div
        className={cx(styles.drop, drag && styles.dropOn)}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          readFile(e.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud size={30} />
        <strong>{fileName || "Drop your CSV here or click to browse"}</strong>
        <small>Columns: employee_id, date, status, check_in, check_out, remarks</small>
        <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => readFile(e.target.files?.[0])} />
      </div>
      {(rows.length > 0 || errors.length > 0) && (
        <div className={styles.importResult}>
          {rows.length > 0 && (
            <p className={styles.okNote}>
              <Check size={15} /> {rows.length} {rows.length === 1 ? "row is" : "rows are"} ready to import.
            </p>
          )}
          {errors.length > 0 && (
            <ul className={styles.errList}>
              {errors.slice(0, 6).map((e) => (
                <li key={e}>{e}</li>
              ))}
              {errors.length > 6 && <li>…and {errors.length - 6} more.</li>}
            </ul>
          )}
        </div>
      )}
      <p className={styles.hint}>Status can be present, late, half-day, leave or absent. Imported rows replace what is shown for that employee and date.</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export function SettingsModal({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [s, setS] = useState<AttSettings>(() => loadSettings());
  const toggleDay = (d: number) =>
    setS((x) => ({ ...x, weeklyOff: x.weeklyOff.includes(d) ? x.weeklyOff.filter((v) => v !== d) : [...x.weeklyOff, d].sort() }));
  return (
    <Modal
      title="Attendance Settings"
      subtitle="These rules decide Late, Half Day and weekly offs."
      onClose={onClose}
      footer={
        <>
          <button className={styles.ghostBtn} onClick={() => setS(DEFAULT_SETTINGS)}>
            Reset defaults
          </button>
          <span className={styles.footSpacer} />
          <button className={styles.ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              saveSettings(s);
              onSaved("Attendance settings saved.");
            }}
          >
            <Check size={16} /> Save
          </button>
        </>
      }
    >
      <div className={styles.twoCol}>
        <label className={styles.field}>
          <span>Grace period (minutes)</span>
          <input
            type="number"
            min={0}
            max={120}
            value={s.graceMinutes}
            onChange={(e) => setS({ ...s, graceMinutes: Math.max(0, Number(e.target.value) || 0) })}
          />
          <small className={styles.hint}>Check-ins within this time after shift start count as Present.</small>
        </label>
        <label className={styles.field}>
          <span>Half day below (hours)</span>
          <input
            type="number"
            min={1}
            max={12}
            step={0.5}
            value={s.halfDayHours}
            onChange={(e) => setS({ ...s, halfDayHours: Math.max(1, Number(e.target.value) || 1) })}
          />
          <small className={styles.hint}>Worked hours below this are marked Half Day.</small>
        </label>
      </div>
      <div className={styles.field}>
        <span>Weekly off</span>
        <div className={styles.weekdayChips}>
          {WEEKDAYS_SHORT.map((w, i) => (
            <button
              key={w}
              type="button"
              aria-pressed={s.weeklyOff.includes(i)}
              className={cx(s.weeklyOff.includes(i) && styles.on)}
              onClick={() => toggleDay(i)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <span>Holidays</span>
        <ul className={styles.holidayList}>
          {Object.entries(HOLIDAYS).map(([d, name]) => (
            <li key={d}>
              <b>{prettyDate(d)}</b> {name}
            </li>
          ))}
        </ul>
        <small className={styles.hint}>Edit the HOLIDAYS list in src/app/data/attendanceData.ts.</small>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Employee attendance sheet (View Full Attendance)                    */
/* ------------------------------------------------------------------ */

export function ProfileModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { employees, ctx, year, month, openMark, record } = useAtt();
  const e = employees.find((x) => x.id === employeeId);
  const [cur, setCur] = useState({ y: year, m: month });
  const stats = useMemo(() => (e ? employeeMonth(e, cur.y, cur.m, ctx) : null), [e, cur, ctx]);
  const activity = useMemo(() => (e ? recentActivity(e, ctx, 5) : []), [e, ctx]);
  if (!e || !stats) return null;

  const today = record(e.id, ctx.today);
  const lead = new Date(cur.y, cur.m, 1).getDay();
  const n = daysInMonth(cur.y, cur.m);
  const [ty, tm] = ctx.today.split("-").map(Number);
  const canNext = cur.y < ty || (cur.y === ty && cur.m < tm - 1);
  const move = (k: number) => {
    const d = new Date(cur.y, cur.m + k, 1);
    setCur({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <Modal
      title={
        <span className={styles.profileTitle}>
          <Avatar name={e.name} photoUrl={e.photoUrl} size={44} />
          <span>
            {e.name}
            <small>
              {e.id} · {e.department} · {e.employmentType}
            </small>
          </span>
        </span>
      }
      onClose={onClose}
      wide
      footer={
        <>
          <StatusPill status={today.status} dot />
          <span className={styles.footSpacer} />
          <button className={styles.ghostBtn} onClick={onClose}>
            Close
          </button>
          <button
            className={styles.primaryBtn}
            onClick={() => {
              onClose();
              openMark({ ids: [e.id] });
            }}
          >
            Mark / Update
          </button>
        </>
      }
    >
      <div className={styles.sheetGrid}>
        <div>
          <div className={styles.sheetMonth}>
            <button className={styles.iconBtn} onClick={() => move(-1)} aria-label="Previous month">
              ‹
            </button>
            <strong>
              {MONTHS[cur.m]} {cur.y}
            </strong>
            <button className={styles.iconBtn} onClick={() => move(1)} disabled={!canNext} aria-label="Next month">
              ›
            </button>
          </div>
          <div className={styles.sheetCal}>
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w} className={styles.sheetWd}>
                {w}
              </span>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: n }, (_, i) => {
              const key = toKey(new Date(cur.y, cur.m, i + 1));
              const r = stats.records[i];
              const m = r.status ? STATUS_META[r.status] : null;
              return (
                <span
                  key={key}
                  className={cx(styles.sheetDay, key === ctx.today && styles.sheetToday)}
                  style={m ? { background: m.soft, color: m.text } : undefined}
                  title={m ? `${m.label}${r.checkIn ? ` · ${fmtTime(r.checkIn)}–${fmtTime(r.checkOut)}` : ""}` : "Upcoming"}
                >
                  <b>{i + 1}</b>
                  <small>{m ? m.short : ""}</small>
                </span>
              );
            })}
          </div>
        </div>
        <div>
          <div className={styles.miniStats}>
            {(
              [
                ["present", stats.onTime, "Present"],
                ["absent", stats.absent, "Absent"],
                ["late", stats.late, "Late"],
                ["half-day", stats.halfDay, "Half Day"],
                ["leave", stats.leave, "On Leave"],
              ] as [AttStatus, number, string][]
            ).map(([k, v, l]) => (
              <div key={k} style={{ background: STATUS_META[k].soft }}>
                <strong style={{ color: STATUS_META[k].text }}>{v}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className={styles.percentRow}>
            <span>
              <b>{stats.percent}%</b> Monthly Attendance
            </span>
            <div className={styles.bar}>
              <i style={{ width: `${stats.percent}%`, background: barColor(stats.percent) }} />
            </div>
          </div>
          <h4 className={styles.subHead}>Recent Activity</h4>
          <ActivityList items={activity} />
        </div>
      </div>
    </Modal>
  );
}