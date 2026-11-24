"use client";
// Mark / Update, Import, Settings and the employee attendance sheet.
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FileUp, Search, UploadCloud } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  HOLIDAYS,
  IMPORT_TEMPLATE,
  MONTHS,
  STATUS_META,
  WEEKDAYS_SHORT,
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
  type AttSettings,
  type AttStatus,
  type ImportRow,
} from "../../../../../data/attendanceData";
import { useAtt } from "./context";
import { ActivityList, Avatar, Modal, StatusPill, barColor, cx, shortDept } from "./ui";
import { DailyAttendanceRecord, useAllAttendance } from "@/app/customHook/useAttendanceHistory";
import {
  apiBulkUpdateAttendance,
  apiUpdateAttendance,
} from "@/app/data/attendanceApi";
import styles from "../attendance.module.css";
import { on } from "events";
// const needsTimes = (s: AttStatus) => s === "present" || s === "late" || s === "half-day";

const needsTimes = (status: AttStatus | "") =>
  status === "present" || status === "late" || status === "half-day";



///   GET ALL EMPLOYEE 
type DirectoryEmployee = {
  employeeId: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImage?: string | null;
};

type EmployeeDirectory = {
  success: boolean;
  count: number;
  data: DirectoryEmployee[];
};





/* ------------------------------------------------------------------ */
/* Mark / Update attendance                                            */
/* ------------------------------------------------------------------ */
const API_STATUS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  leave: "Leave",
  "half-day": "Half Day",
} as const;
type EditableStatus = keyof typeof API_STATUS;
const statusOptions = Object.keys(API_STATUS) as EditableStatus[];
const normalizeEmployeeId = (id: string) => id.replace(/\s+/g, "").toUpperCase();
const istTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
function timeInput(value?: string | null) {
  if (!value) return "";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? "" : istTime.format(timestamp);
}
type AttendanceDraft = {
  status: EditableStatus | "";
  checkIn: string;
  checkOut: string;
  remarks: string;
};







export function MarkModal({
    initialIds,
    initialDate,
    onClose,
    onSaved,
    onPartialSave,
   dailyAttendance,
    dailyLoading,
    dailyError,        
    today,
    onDateChange,
    onReload: refetch,
         
}: {
  initialIds: string[];
  initialDate: string;
  onClose: () => void;
  onSaved: (message: string) => void;
  onPartialSave?: () => void;
  dailyAttendance: DailyAttendanceRecord[];
  dailyLoading: boolean;
  dailyError: string | null;
  today: string;
onDateChange: (date: string) => void;
onReload: () => void | Promise<unknown>;
 

  
}) {
  //const {  ctx } = useAtt();
  const [date, setDate] = useState(initialDate);
 const [ids, setIds] = useState(
  () => new Set(initialIds.map(normalizeEmployeeId)),
);
  const [search, setSearch] = useState("");

const [currentStatusFilter, setCurrentStatusFilter] = useState(
  initialIds.length ? "" : ""
);
  const [draft, setDraft] = useState<Partial<AttendanceDraft>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
 // const { records, loading, error: fetchError, refetch } = useAllAttendance(date);

  const loading = dailyLoading;
const fetchError = dailyError;

  const recordsById = new Map(
  dailyAttendance
    .filter((row) => row.dateKey === date)
    .map((row) => [normalizeEmployeeId(row.employeeId), row] as const),
);

  const selectedId = ids.size === 1 ? [...ids][0] : undefined;
  const current = selectedId ? recordsById.get(normalizeEmployeeId(selectedId)) : undefined;
  // Remarks may be missing from older API responses.
  const existingRemarks = current && "remarks" in current && typeof current.remarks === "string"
    ? current.remarks
    : "";
  const status = draft.status ?? statusOptions.find((key) => API_STATUS[key] === current?.status) ?? "";
  const checkIn = draft.checkIn ?? timeInput(current?.checkIn);
  const checkOut = draft.checkOut ?? timeInput(current?.checkOut);
  const remarks = draft.remarks ?? existingRemarks;

  const close = () => {
    if (!savingRef.current) onClose();
  };
  const pick = (nextIds: Set<string>, nextDate: string) => {
    if (savingRef.current) return;
    setIds(nextIds);
    setDate(nextDate);
    setDraft({});
    setError("");
  };


  
const [directory, setDirectory] = useState<EmployeeDirectory | null>(null);
const [directoryError, setDirectoryError] = useState("");

useEffect(() => {
  const controller = new AbortController();

  async function loadEmployees() {
    try {
      const response = await fetch("/api/getAllEmployee", {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Employee request failed (${response.status}).`);
      }

      const result: EmployeeDirectory = await response.json();

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error("Unable to load employee details.");
      }

      if (!controller.signal.aborted) setDirectory(result);
    } catch (error) {
      if (!controller.signal.aborted) {
        setDirectoryError(
          error instanceof Error ? error.message : "Unable to load employee details.",
        );
      }
    }
  }

  void loadEmployees();
  return () => controller.abort();
}, []);


const employeeById = new Map(
  (directory?.data ?? []).map((employee) => [
    normalizeEmployeeId(employee.employeeId),
    employee,
  ] as const),
);

  
  // const list = useMemo(() => {
  //   const q = search.trim().toLowerCase();
  //   return employees.filter((e) => !q || [e.name, e.id, e.department].some((v) => v.toLowerCase().includes(q)));
  // }, [employees, search]);






//    const q = search.trim().toLowerCase();

// const list = loading || fetchError
//   ? []
//   : Array.from(recordsById, ([id, row]) => ({
//       id,
//       employeeId: row.employeeId,
//       department: row.department?.trim() || "—",
//       status: row.status?.trim().toLowerCase(),
//     })).filter((employee) => {
//       const matchesStatus =
//         !currentStatusFilter || employee.status === currentStatusFilter;

//       const matchesSearch =
//         !q ||
//         [employee.employeeId, employee.department].some((value) =>
//           value.toLowerCase().includes(q),
//         );

//       return matchesStatus && matchesSearch;
//     });


  const q = search.trim().toLowerCase();

const list = loading || fetchError
  ? []
  : Array.from(recordsById, ([id, row]) => {
      const employee = employeeById.get(id);
      const name = [employee?.firstName?.trim(), employee?.lastName?.trim()]
        .filter(Boolean)
        .join(" ") || row.employeeId;

      return {
        id,
        employeeId: row.employeeId,
        name,
        photoUrl: employee?.profileImage?.trim() || undefined,
        department: row.department?.trim() || "—",
        status: row.status?.trim().toLowerCase(),
      };
    }).filter((employee) => {
      const matchesStatus =
        !currentStatusFilter || employee.status === currentStatusFilter;

      const matchesSearch = [employee.name, employee.employeeId, employee.department]
        .some((value) => value.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });


  const allOn = list.length > 0 && list.every((e) => ids.has(e.id));
  const toggle = (id: string) => {
    const n = new Set(ids);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    pick(n, date);
  };
  const save = async () => {
    if (savingRef.current || loading || fetchError) return;
    setError("");
    if (!date || date > today) {
      return setError("Choose today or a past date.");
    }
    if (!ids.size) {
      return setError("Select at least one employee.");
    }
    if (!status) {
      return setError("Choose an attendance status.");
    }
    if (!Object.keys(draft).length) {
      return setError("Change at least one field before saving.");
    }
    if (
      ids.size === 1 &&
      needsTimes(status) &&
      checkOut &&
      (!checkIn || checkOut < checkIn)
    ) {
      return setError(
        "Check-out requires a check-in time and cannot be earlier than check-in."
      );
    }

    // Include the selected status because the current backend rejects notes-only requests.
    // Only send a timestamp when its field was edited, preserving untouched ISO values.
    const body: Parameters<typeof apiUpdateAttendance>[2] = { status: API_STATUS[status] };
    if (needsTimes(status)) {
      if (draft.checkIn !== undefined) body.checkIn = draft.checkIn || null;
      if (draft.checkOut !== undefined) body.checkOut = draft.checkOut || null;
    }
    if (draft.remarks !== undefined) body.remarks = draft.remarks.trim();

    // const employeeIds = [...ids];
    // const updates = employeeIds.map((id) => ({
    //   ...body,
    //   employeeId: recordsById.get(normalizeEmployeeId(id))?.employeeId ?? id,
    //   date,
    // }));


      const employeeIds = [...ids];
      const updates = [];

      for (const id of employeeIds) {
        const row = recordsById.get(id);

        if (!row) {
          return setError("Select employees with attendance records for this date.");
        }

        updates.push({ ...body, employeeId: row.employeeId, date });
      }

    savingRef.current = true;
    setSaving(true);

    try {
      if (updates.length === 1) {
        await apiUpdateAttendance(updates[0].employeeId, date, body);
        onSaved("Attendance updated.");
        return;
      }
      const response = await apiBulkUpdateAttendance(updates);
      const results = response?.results;
      if (
        !Array.isArray(results) ||
        results.length !== updates.length ||
        results.some((result) => typeof result?.success !== "boolean")
      ) {
        void refetch();
        onPartialSave?.();
        setError("The server returned incomplete results. Review attendance before retrying.");
        return;
      }
      const failedIds = new Set<string>();
      const messages: string[] = [];
      results.forEach((result, index) => {
        if (result.success) return;
        const id = employeeIds[index];
        failedIds.add(id);
        messages.push(`${id}: ${result.message || "Update failed"}`);
      });
      if (failedIds.size > 0) {
        const updated = updates.length - failedIds.size;
        setIds(failedIds);
        setDraft({ ...draft, status });
        if (updated > 0) {
          void refetch();
          onPartialSave?.();
          messages.unshift(`${updated} saved. Retry the remaining employees.`);
        }
        setError(messages.join(" "));
        return;
      }
      onSaved(`Attendance updated for ${updates.length} employees.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update attendance.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Mark / Update Attendance"
      subtitle="Set attendance for one or more employees on a day."
      onClose={close}
      wide
      footer={
        <>
          <span className={styles.footNote}>
            {ids.size} {ids.size === 1 ? "employee" : "employees"} selected
          </span>
          <button className={styles.ghostBtn} onClick={close} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={save}
            disabled={saving || loading || Boolean(fetchError) || !date || !ids.size}
          >
            <Check size={17} />
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </>
      }
    >
      <div className={styles.formGrid}>
        <div className={styles.formCol}>
          <label className={styles.field}>
            <span>Date</span>
            <input type="date" value={date} max={today} disabled={saving} onChange={(event) => {
  const nextDate = event.target.value;
  pick(new Set<string>(), nextDate);
  onDateChange(nextDate);
}} />
          </label>
          <div className={styles.field}>
            <span>Status</span>
            <div className={styles.statusChoice}>
              {statusOptions.map((s) => {
                const m = STATUS_META[s];
                const on = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    disabled={saving || loading || Boolean(fetchError)}
                    onClick={() => setDraft({ ...draft, status: s })}
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
                <input type="time" value={checkIn} disabled={saving || loading || Boolean(fetchError)} onChange={(e) => setDraft({ ...draft, checkIn: e.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Check Out</span>
                <input type="time" value={checkOut} disabled={saving || loading || Boolean(fetchError)} onChange={(e) => setDraft({ ...draft, checkOut: e.target.value })} />
              </label>
            </div>
          )}
          <label className={styles.field}>
            <span>Remarks</span>
            <input value={remarks} disabled={saving || loading || Boolean(fetchError)} onChange={(e) => setDraft({ ...draft, remarks: e.target.value })} placeholder="e.g. Approved leave, Traffic, Client visit" />
          </label>
          {loading && <p role="status">Loading attendance…</p>}
          {fetchError && (
            <div role="alert">
              <p className={styles.formError}>{fetchError}</p>
              <button type="button" className={styles.linkBtn} onClick={() => void refetch()}>
                Retry loading
              </button>
            </div>
          )}
          {error && <p className={styles.formError} role="alert">{error}</p>}
        </div>
        <div className={cx(styles.formCol, styles.pickCol)}>
          <div className={styles.pickHead}>
            <span>
  Employees · {directory
    ? `Total: ${directory.count}`
    : directoryError
      ? "Total unavailable"
      : "Loading total…"}
</span>
            <button
              className={styles.linkBtn}
              disabled={saving}
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

         <label className={styles.field}>
  <span>Current attendance</span>
  {/* <select
    value={currentStatusFilter}
    onChange={(event) => setCurrentStatusFilter(event.target.value)}
    disabled={saving || loading || Boolean(fetchError)}
  > */}
    <option value="" >All statuses</option>
    {/* <option value="present">Present</option>
    <option value="absent">Absent</option>
    <option value="leave">On leave</option>
    <option value="late">Late</option>
    <option value="half day">Half day</option>
    <option value="not-marked">Not marked</option> */}
  {/* </select> */}
</label>

          <div className={styles.pickList}>
            {list.map((e) => (
              <label key={e.id} className={cx(ids.has(e.id) && styles.picked)}>
                <input type="checkbox" disabled={saving} checked={ids.has(e.id)} onChange={() => toggle(e.id)} />
                {/* <Avatar name={e.employeeId} size={30} />
<span>
  <b>{e.employeeId}</b>
  <small>{shortDept(e.department)}</small>
</span> */}
             <Avatar name={e.name} photoUrl={e.photoUrl} size={30} />
<span>
  <b>{e.name}</b>
  <small>{e.employeeId} · {shortDept(e.department)}</small>
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
    // const res = parseImport(text, new Set(employees.map((e) => e.id)), today);\
    const res = parseImport(
  text,
  new Set(employees.map((e) => e.id)),
  ctx.today,
);
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
  //const today = record(e.id, .today);
   
  const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

  const lead = new Date(cur.y, cur.m, 1).getDay();
  const n = daysInMonth(cur.y, cur.m);
  const [ty, tm] = today.split("-").map(Number);
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
          {/* <StatusPill status={today?.status} dot /> */}
          <StatusPill status={record(e.id, today).status} dot />
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
                  className={cx(styles.sheetDay, key === today && styles.sheetToday)}
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
