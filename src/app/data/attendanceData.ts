// src/app/data/attendanceData.ts
// Attendance Management data engine.
//
// Every employee gets one record per day, built from (highest priority first):
//   1. Manual changes made by the admin (Mark / Update, Bulk Update, Import)
//   2. Holidays and weekly offs
//   3. TODAY: live data from the check-in kiosk (employeeData attendance history + leaves)
//   4. PAST DAYS: demo history (deterministic, so it looks the same on every load)
// Future days have no record yet.
//
// Everything reads employees from employeeData.ts, so the Team page and this
// dashboard always show the same people and the same status for today.

import {
  buildLog,
  getTempStatus,
  isAddedEmployee,
  loadHistory,
  loadLeaveIds,
  newEvent,
  saveHistory,
  saveLeaveIds,
  setTempStatus,
  todayKey,
  workedMinutes,
  type AttendanceEvent,
  type Employee,
  type TeamStatus,
} from "./employeeData";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

export type AttStatus = "present" | "late" | "half-day" | "leave" | "absent" | "weekly-off" | "holiday";

export interface DayRecord {
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttStatus | null; // null = upcoming day, nothing to show yet
  checkIn: string | null; // HH:MM (24h)
  checkOut: string | null;
  workMinutes: number | null;
  remarks: string;
  source: "demo" | "live" | "manual" | "calendar";
}

export const STATUS_META: Record<AttStatus, { label: string; short: string; color: string; soft: string; text: string }> = {
  present: { label: "Present", short: "P", color: "#22a55b", soft: "#e3f6ea", text: "#15803d" },
  absent: { label: "Absent", short: "A", color: "#ef4444", soft: "#fde8e8", text: "#dc2626" },
  late: { label: "Late", short: "L", color: "#f5b531", soft: "#fef3dc", text: "#b7791f" },
  "half-day": { label: "Half Day", short: "H", color: "#a36bf0", soft: "#efe6fd", text: "#7c3aed" },
  leave: { label: "On Leave", short: "LV", color: "#4a8df0", soft: "#e4eefd", text: "#2563eb" },
  "weekly-off": { label: "Weekly Off", short: "WO", color: "#8b93a3", soft: "#eceef2", text: "#4b5563" },
  holiday: { label: "Holiday", short: "–", color: "#9aa1ad", soft: "#f1f2f5", text: "#6b7280" },
};

// Statuses an admin can set from "Mark / Update Attendance".
export const EDITABLE_STATUSES: AttStatus[] = ["present", "late", "half-day", "leave", "absent"];

// Legend order used across the dashboard.
export const LEGEND: AttStatus[] = ["present", "absent", "late", "half-day", "leave", "holiday"];

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];

// Sample employment types for the demo employees (anyone else is Full-time).
const DEFAULT_EMPLOYMENT: Record<string, string> = {
  EMP005: "Contract",
  EMP008: "Part-time",
  EMP011: "Contract",
};

export const employmentTypeOf = (e: Employee) => (e as Employee & { employmentType?: string }).employmentType ?? DEFAULT_EMPLOYMENT[e.id] ?? "Full-time";

// National holidays (edit as needed). Shown as grey "Holiday" days.
export const HOLIDAYS: Record<string, string> = {
  "2026-01-26": "Republic Day",
  "2026-05-01": "May Day",
  "2026-08-15": "Independence Day",
  "2026-10-02": "Gandhi Jayanti",
  "2026-12-25": "Christmas",
  "2027-01-26": "Republic Day",
};

/* ------------------------------------------------------------------ */
/* Date & time helpers                                                 */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

export const toKey = (d: Date) => todayKey(d);

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export function monthKeys(year: number, month: number): string[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, i) => toKey(new Date(year, month, i + 1)));
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (mins: number) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

// "09:32" → "09:32 AM"
export function fmtTime(hhmm: string | null): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

export const fmtHours = (mins: number | null) => (mins == null || mins <= 0 ? "—" : `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`);

const isoToHHMM = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface AttSettings {
  graceMinutes: number; // check-in this many minutes after shift start is still "Present"
  halfDayHours: number; // worked less than this → Half Day
  weeklyOff: number[]; // 0 = Sunday … 6 = Saturday
}

const SETTINGS_KEY = "pavion_attendance_settings";
export const DEFAULT_SETTINGS: AttSettings = { graceMinutes: 0, halfDayHours: 5, weeklyOff: [0] };

export function loadSettings(): AttSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AttSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Manual changes (admin)                                              */
/* ------------------------------------------------------------------ */

export interface Override {
  status: AttStatus;
  checkIn: string | null;
  checkOut: string | null;
  remarks: string;
  updatedAt: string;
  /** Today only: the kiosk data before the first manual change, so "Reset" can restore it. */
  backup?: { events: AttendanceEvent[]; onLeave: boolean; temp: TeamStatus | null };
}

const OVERRIDE_KEY = "pavion_attendance_overrides";
const oKey = (id: string, date: string) => `${id}|${date}`;

export function loadOverrides(): Record<string, Override> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(OVERRIDE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveOverrides(map: Record<string, Override>) {
  try {
    window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export interface MarkInput {
  status: AttStatus;
  checkIn: string | null;
  checkOut: string | null;
  remarks: string;
}

const needsTimes = (s: AttStatus) => s === "present" || s === "late" || s === "half-day";

// Saves the admin's change for many employees at once. Today's changes are also
// written to the live attendance history, so the Team page shows the same status.
export function setAttendance(employees: Employee[], date: string, input: MarkInput) {
  const map = loadOverrides();
  const isToday = date === todayKey();
  const clean: Override = {
    status: input.status,
    checkIn: needsTimes(input.status) ? input.checkIn : null,
    checkOut: needsTimes(input.status) ? input.checkOut : null,
    remarks: input.remarks.trim(),
    updatedAt: new Date().toISOString(),
  };
  employees.forEach((e) => {
    const key = oKey(e.id, date);
    const backup = isToday ? (map[key]?.backup ?? snapshotToday(e)) : undefined;
    map[key] = backup ? { ...clean, backup } : clean;
  });
  saveOverrides(map);
  if (isToday) employees.forEach((e) => syncToday(e, clean));
}

// Removes the manual change. For today, the original kiosk data comes back too.
export function clearAttendance(employee: Employee, date: string) {
  const map = loadOverrides();
  const key = oKey(employee.id, date);
  const backup = map[key]?.backup;
  delete map[key];
  saveOverrides(map);
  if (date === todayKey() && backup) {
    saveHistory([...loadHistory().filter((ev) => ev.employeeId !== employee.id), ...backup.events]);
    const leave = loadLeaveIds().filter((id) => id !== employee.id);
    if (backup.onLeave) leave.push(employee.id);
    saveLeaveIds(leave);
    if (isAddedEmployee(employee.id)) setTempStatus(employee.id, backup.temp);
  }
}

function snapshotToday(e: Employee): Override["backup"] {
  return {
    events: loadHistory().filter((ev) => ev.employeeId === e.id),
    onLeave: loadLeaveIds().includes(e.id),
    temp: getTempStatus(e.id) ?? null,
  };
}

const TEAM_STATUS: Partial<Record<AttStatus, TeamStatus>> = {
  present: "Present",
  "half-day": "Present",
  late: "Late",
  leave: "On Leave",
  absent: "Absent",
};

function syncToday(e: Employee, o: Override) {
  const today = todayKey();
  const at = (hhmm: string) => {
    const d = fromKey(today);
    const [h, m] = hhmm.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const history = loadHistory().filter((ev) => ev.employeeId !== e.id);
  if (needsTimes(o.status) && o.checkIn) {
    history.push(newEvent(e, "check-in", at(o.checkIn), null, null));
    if (o.checkOut) history.push(newEvent(e, "check-out", at(o.checkOut), null, null));
  }
  saveHistory(history);
  const leave = loadLeaveIds().filter((id) => id !== e.id);
  if (o.status === "leave") leave.push(e.id);
  saveLeaveIds(leave);
  if (isAddedEmployee(e.id)) setTempStatus(e.id, TEAM_STATUS[o.status] ?? null);
}

/* ------------------------------------------------------------------ */
/* Building records                                                    */
/* ------------------------------------------------------------------ */

export interface AttContext {
  today: string;
  now: Date;
  settings: AttSettings;
  overrides: Record<string, Override>;
  history: AttendanceEvent[];
  leaveIds: string[];
}

export function loadContext(): AttContext {
  return {
    today: todayKey(),
    now: new Date(),
    settings: loadSettings(),
    overrides: loadOverrides(),
    history: loadHistory(),
    leaveIds: loadLeaveIds(),
  };
}

// Small deterministic random generator: same employee + date → same demo day.
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

const workBetween = (a: string | null, b: string | null) => (a && b ? Math.max(0, toMinutes(b) - toMinutes(a) - 45) : null); // 45 min lunch

function demoRecord(e: Employee, date: string, s: AttSettings): DayRecord {
  const rnd = seeded(`${e.id}|${date}`);
  const r = rnd();
  const shift = toMinutes(e.shiftStart);
  const base = { employeeId: e.id, date, source: "demo" as const };

  if (r < 0.045) return { ...base, status: "absent", checkIn: null, checkOut: null, workMinutes: null, remarks: "No log" };
  if (r < 0.085) return { ...base, status: "leave", checkIn: null, checkOut: null, workMinutes: null, remarks: "Approved Leave" };

  if (r < 0.12) {
    const cin = fromMinutes(shift - 10 + Math.floor(rnd() * 15));
    const cout = fromMinutes(toMinutes(cin) + 240 + Math.floor(rnd() * 40));
    return { ...base, status: "half-day", checkIn: cin, checkOut: cout, workMinutes: workBetween(cin, cout), remarks: "Left early" };
  }
  if (r < 0.2) {
    const cin = fromMinutes(shift + s.graceMinutes + 6 + Math.floor(rnd() * 50));
    const cout = fromMinutes(toMinutes(cin) + 510 + Math.floor(rnd() * 30));
    const reasons = ["Traffic", "Metro delay", "Informed manager"];
    return { ...base, status: "late", checkIn: cin, checkOut: cout, workMinutes: workBetween(cin, cout), remarks: reasons[Math.floor(rnd() * reasons.length)] };
  }
  const cin = fromMinutes(shift - 25 + Math.floor(rnd() * (25 + Math.min(s.graceMinutes, 5))));
  const cout = fromMinutes(shift + 520 + Math.floor(rnd() * 45));
  return { ...base, status: "present", checkIn: cin, checkOut: cout, workMinutes: workBetween(cin, cout), remarks: rnd() < 0.45 ? "On time" : "" };
}

function liveRecord(e: Employee, ctx: AttContext): DayRecord {
  const base = { employeeId: e.id, date: ctx.today, source: "live" as const };
  const temp = getTempStatus(e.id); // status chosen when the member was added on the Team page
  if (ctx.leaveIds.includes(e.id) || temp === "On Leave") {
    return { ...base, status: "leave", checkIn: null, checkOut: null, workMinutes: null, remarks: "Approved Leave" };
  }
  const log = buildLog(e.id, ctx.history);
  if (!log.checkIn) {
    if (temp === "Present" || temp === "Late") {
      return { ...base, status: temp === "Late" ? "late" : "present", checkIn: null, checkOut: null, workMinutes: null, remarks: "Marked on Team page" };
    }
    return { ...base, status: "absent", checkIn: null, checkOut: null, workMinutes: null, remarks: "Not checked in yet" };
  }
  const cin = isoToHHMM(log.checkIn);
  const cout = log.checkOut ? isoToHHMM(log.checkOut) : null;
  const worked = workedMinutes(log, ctx.now);
  let status: AttStatus = toMinutes(cin) > toMinutes(e.shiftStart) + ctx.settings.graceMinutes ? "late" : "present";
  if (cout && worked < ctx.settings.halfDayHours * 60) status = "half-day";
  const remarks = !cout ? (log.breaks.some((b) => !b.end) ? "On break" : "Working") : status === "present" ? "On time" : "";
  return { ...base, status, checkIn: cin, checkOut: cout, workMinutes: worked, remarks };
}

export function recordFor(e: Employee, date: string, ctx: AttContext): DayRecord {
  const empty = { employeeId: e.id, date, checkIn: null, checkOut: null, workMinutes: null };
  if (date > ctx.today) return { ...empty, status: null, remarks: "", source: "calendar" };

  const o = ctx.overrides[oKey(e.id, date)];
  if (o) {
    // Checked in today but not out yet: hours so far.
    const running = date === ctx.today && o.checkIn && !o.checkOut ? Math.max(0, ctx.now.getHours() * 60 + ctx.now.getMinutes() - toMinutes(o.checkIn)) : null;
    return {
      employeeId: e.id,
      date,
      status: o.status,
      checkIn: o.checkIn,
      checkOut: o.checkOut,
      workMinutes: running ?? workBetween(o.checkIn, o.checkOut),
      remarks: o.remarks,
      source: "manual",
    };
  }
  if (HOLIDAYS[date]) return { ...empty, status: "holiday", remarks: HOLIDAYS[date], source: "calendar" };
  if (ctx.settings.weeklyOff.includes(fromKey(date).getDay())) {
    return { ...empty, status: "weekly-off", remarks: "Weekly off", source: "calendar" };
  }
  return date === ctx.today ? liveRecord(e, ctx) : demoRecord(e, date, ctx.settings);
}

export const recordsForDay = (employees: Employee[], date: string, ctx: AttContext) => employees.map((e) => recordFor(e, date, ctx));

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

export interface DaySummary {
  total: number;
  present: number; // present + late + half day (everyone who came in)
  onTime: number;
  late: number;
  halfDay: number;
  leave: number;
  absent: number;
  weeklyOff: number;
  holiday: number;
  upcoming: boolean;
  offDay: boolean; // everyone off (holiday / weekly off)
}

export function summarize(records: DayRecord[]): DaySummary {
  const c = (s: AttStatus) => records.filter((r) => r.status === s).length;
  const onTime = c("present");
  const late = c("late");
  const halfDay = c("half-day");
  const weeklyOff = c("weekly-off");
  const holiday = c("holiday");
  return {
    total: records.length,
    present: onTime + late + halfDay,
    onTime,
    late,
    halfDay,
    leave: c("leave"),
    absent: c("absent"),
    weeklyOff,
    holiday,
    upcoming: records.length > 0 && records.every((r) => r.status === null),
    offDay: records.length > 0 && weeklyOff + holiday === records.length,
  };
}

export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export interface EmployeeMonth {
  present: number; // came in (present + late + half day)
  onTime: number;
  late: number;
  halfDay: number;
  leave: number;
  absent: number;
  workingDays: number; // days so far that were not weekly off / holiday
  percent: number;
  records: DayRecord[];
}

export function employeeMonth(e: Employee, year: number, month: number, ctx: AttContext): EmployeeMonth {
  const records = monthKeys(year, month).map((d) => recordFor(e, d, ctx));
  const c = (s: AttStatus) => records.filter((r) => r.status === s).length;
  const onTime = c("present");
  const late = c("late");
  const halfDay = c("half-day");
  const leave = c("leave");
  const absent = c("absent");
  const workingDays = onTime + late + halfDay + leave + absent;
  const attended = onTime + late + halfDay * 0.5;
  return {
    present: onTime + late + halfDay,
    onTime,
    late,
    halfDay,
    leave,
    absent,
    workingDays,
    percent: pct(attended, workingDays),
    records,
  };
}

// Average daily counts over the working days of a month (so far).
export function monthAverages(employees: Employee[], year: number, month: number, ctx: AttContext) {
  const days = monthKeys(year, month)
    .filter((d) => d <= ctx.today)
    .map((d) => summarize(recordsForDay(employees, d, ctx)))
    .filter((s) => !s.offDay && !s.upcoming);
  const avg = (f: (s: DaySummary) => number) => (days.length ? Math.round(days.reduce((sum, s) => sum + f(s), 0) / days.length) : 0);
  return {
    days: days.length,
    present: avg((s) => s.present),
    absent: avg((s) => s.absent),
    late: avg((s) => s.late),
    halfDay: avg((s) => s.halfDay),
    leave: avg((s) => s.leave),
  };
}

// Latest working day before `date` (for the "vs. yesterday" figures).
export function previousWorkingDay(employees: Employee[], date: string, ctx: AttContext): DaySummary | null {
  for (let i = 1; i <= 10; i++) {
    const s = summarize(recordsForDay(employees, addDays(date, -i), ctx));
    if (!s.offDay && !s.upcoming) return s;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Recent activity (Employee View)                                     */
/* ------------------------------------------------------------------ */

export interface ActivityItem {
  date: string;
  kind: "check-in" | "check-out" | AttStatus;
  title: string;
  detail: string;
  time: string | null;
}

export function recentActivity(e: Employee, ctx: AttContext, limit = 5): ActivityItem[] {
  const items: ActivityItem[] = [];
  const office = e.officeLocation.replace("PAVION Office - ", "Office (") + (e.officeLocation.includes("-") ? ")" : "");
  for (let i = 0; i < 20 && items.length < limit; i++) {
    const date = addDays(ctx.today, -i);
    const r = recordFor(e, date, ctx);
    if (!r.status) continue;
    if (i === 0) {
      if (r.checkOut) items.push({ date, kind: "check-out", title: "Checked Out", detail: office, time: r.checkOut });
      if (r.checkIn) items.push({ date, kind: "check-in", title: "Checked In", detail: office, time: r.checkIn });
      if (!r.checkIn && r.status !== "weekly-off") {
        items.push({ date, kind: r.status, title: STATUS_META[r.status].label, detail: r.remarks || "—", time: null });
      }
      continue;
    }
    if (r.status === "weekly-off") continue;
    const detail =
      r.status === "late" && r.checkIn
        ? `Checked in at ${fmtTime(r.checkIn)}`
        : r.status === "present"
          ? "Working Day"
          : r.status === "half-day" && r.checkOut
            ? `Left at ${fmtTime(r.checkOut)}`
            : r.remarks || STATUS_META[r.status].label;
    items.push({ date, kind: r.status, title: STATUS_META[r.status].label, detail, time: null });
  }
  return items.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* CSV export / import                                                 */
/* ------------------------------------------------------------------ */

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: (string | number)[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n");

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export const IMPORT_TEMPLATE: string[][] = [
  ["employee_id", "date", "status", "check_in", "check_out", "remarks"],
  ["EMP001", "2026-09-24", "present", "09:25", "18:15", "On time"],
  ["EMP002", "2026-09-24", "leave", "", "", "Approved Leave"],
];

const STATUS_ALIASES: Record<string, AttStatus> = {
  present: "present",
  p: "present",
  late: "late",
  l: "late",
  "half-day": "half-day",
  "half day": "half-day",
  halfday: "half-day",
  h: "half-day",
  leave: "leave",
  "on leave": "leave",
  lv: "leave",
  absent: "absent",
  a: "absent",
};

export interface ImportRow {
  employeeId: string;
  date: string;
  input: MarkInput;
}

// Accepts dates as YYYY-MM-DD or DD/MM/YYYY and times as HH:MM or h:mm AM/PM.
export function parseImport(text: string, validIds: Set<string>, today: string): { rows: ImportRow[]; errors: string[] } {
  const table = parseCsv(text);
  const errors: string[] = [];
  const rows: ImportRow[] = [];
  if (!table.length) return { rows, errors: ["The file is empty."] };

  const header = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  const idx = { id: col("employee_id"), date: col("date"), status: col("status"), cin: col("check_in"), cout: col("check_out"), rem: col("remarks") };
  if (idx.id < 0 || idx.date < 0 || idx.status < 0) {
    return { rows, errors: ["Missing columns. The first row must include employee_id, date and status."] };
  }

  const normDate = (v: string) => {
    v = v.trim();
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
    m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
    return null;
  };
  const normTime = (v: string | undefined) => {
    if (!v || !v.trim()) return null;
    const m = v.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!m) return undefined;
    let h = +m[1];
    if (m[3]) h = (h % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
    return h < 24 && +m[2] < 60 ? `${pad(h)}:${m[2]}` : undefined;
  };

  table.slice(1).forEach((r, i) => {
    const line = i + 2;
    const id = (r[idx.id] ?? "").trim().toUpperCase();
    const date = normDate(r[idx.date] ?? "");
    const status = STATUS_ALIASES[(r[idx.status] ?? "").trim().toLowerCase()];
    const cin = idx.cin >= 0 ? normTime(r[idx.cin]) : null;
    const cout = idx.cout >= 0 ? normTime(r[idx.cout]) : null;
    if (!validIds.has(id)) return errors.push(`Row ${line}: unknown employee ID "${id}".`);
    if (!date) return errors.push(`Row ${line}: date must be YYYY-MM-DD or DD/MM/YYYY.`);
    if (date > today) return errors.push(`Row ${line}: ${date} is in the future.`);
    if (!status) return errors.push(`Row ${line}: status must be present, late, half-day, leave or absent.`);
    if (cin === undefined || cout === undefined) return errors.push(`Row ${line}: times must look like 09:30 or 9:30 AM.`);
    rows.push({ employeeId: id, date, input: { status, checkIn: cin, checkOut: cout, remarks: idx.rem >= 0 ? (r[idx.rem] ?? "") : "" } });
  });
  return { rows, errors };
}