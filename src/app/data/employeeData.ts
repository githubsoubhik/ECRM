// src/app/data/employeeData.ts
// Demo employee "database" + today's attendance history.
// The history is the single source of truth: each employee's day log is rebuilt
// from it, so deleting a history row instantly lets that employee mark again.


export type AttendanceAction = 'check-in' | 'check-out' | 'break-start' | 'break-end';

export interface Employee {
  id: string;
  name: string;
  designation: string;
  team: string;
  officeLocation: string;
  photoUrl: string;      // put real photos in /public/employees/emp001.jpg
  email: string;
  shiftStart: string;    // HH:MM, used to decide Present vs Late
  // Added for the Team page (optional, so nothing else has to change)
  phone?: string;        // shown on the team cards
  department?: string;   // falls back to `team` without the word "Team"
   role?: string;          // 'Admin' | 'Employee' ...
  mongoId?: string;       // _id
  isActive?: boolean;
}

export interface ApiEmployee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  profileImage?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  joiningDate?: string;
}

export interface BreakEntry {
  start: string;         // ISO string
  end: string | null;
}

export interface DayLog {
  date: string;          // YYYY-MM-DD
  employeeId: string;
  checkIn: string | null;
  checkOut: string | null;
  breaks: BreakEntry[];
  lastPhoto?: string;
}

// One row of the attendance history.
export interface AttendanceEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  action: AttendanceAction;
  at: string;                  // ISO time of the action
  photoFile: string | null;    // file saved in /attendance-photos
  confidence: number | null;   // face-match score, null for check-out
}

export interface CaptureMetrics {
  brightness: number;    // 0-255 average
  contrast: number;      // standard deviation
  centerBrightness: number;
  motion: number;        // liveness: average change between frames (-1 = not measured yet)
}

export interface VerificationResult {
  ok: boolean;
  confidence: number;    // 0-100
  message: string;
  employee: Employee | null;
}

/* ------------------------------------------------------------------ */
/* Demo database                                                       */
/* ------------------------------------------------------------------ */


export const normalizeEmployeeId = (v: string) => v.replace(/\s+/g, '');


const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export function mapApiEmployee(r: ApiEmployee): Employee {
  const id = normalizeEmployeeId(r.employeeId);
  return {
    id,
    mongoId: r._id,
    name: `${r.firstName} ${r.lastName}`.trim(),
    designation: r.designation ?? '',
    department: r.department ?? '',
    team: r.department ? `${r.department} Team` : '',
    officeLocation: 'PAVION Office - Kolkata',   // not in the API yet, so a default
    photoUrl: r.profileImage ? `${API_BASE}${r.profileImage}` : '/employees/default.jpg',
    email: r.email,
    phone: r.phone ?? '',
    shiftStart: '10.00',                         // not in the API yet, so a default
    role: r.role,
    isActive: r.isActive,
  };
}


// export const EMPLOYEE_DB: Employee[] = [
//   {
//     id: 'EMP001',
//     name: 'Priyangshu Mandal',
//     designation: 'Digital Marketing Executive',
//     team: 'Marketing Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp001.jpg',
//     email: 'priyangshu@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43210',
//     department: 'Marketing',
//   },
//   {
//     id: 'EMP002',
//     name: 'Abhijit das',
//     designation: 'Graphics Designer',
//     team: 'Creative Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp002.jpg',
//     email: 'antora@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43211',
//     department: 'Creative',
//   },
//   {
//     id: 'EMP003',
//     name: 'Baban Mondal',
//     designation: 'Web Developer',
//     team: 'Tech Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp003.jpg',
//     email: 'baban@pavion.in',
//     shiftStart: '10:00',
//     phone: '+91 98765 43212',
//     department: 'Technology',
//   },
//   {
//     id: 'EMP004',
//     name: 'Indrajit Sarkar',
//     designation: 'SEO Executive',
//     team: 'Marketing Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp004.jpg',
//     email: 'indrajit@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43213',
//     department: 'Marketing',
//   },
//   {
//     id: 'EMP005',
//     name: 'Sarfaraz Ali',
//     designation: 'Video Editor',
//     team: 'Creative Team',
//     officeLocation: 'PAVION Office - Noida',
//     photoUrl: '/employees/emp005.jpg',
//     email: 'sarfaraz@pavion.in',
//     shiftStart: '10:30',
//     phone: '+91 98765 43214',
//     department: 'Creative',
//   },
//   {
//     id: 'EMP006',
//     name: 'Bidyut Kayal',
//     designation: 'Business Development',
//     team: 'Sales Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp006.jpg',
//     email: 'bidyut@pavion.in',
//     shiftStart: '09:00',
//     phone: '+91 98765 43215',
//     department: 'Sales',
//   },
//   // ---- Added for the Team page -------------------------------------
//   {
//     id: 'EMP007',
//     name: 'Soumi Bhattacharya',
//     designation: 'HR Executive',
//     team: 'HR Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp007.jpg',
//     email: 'soumi@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43216',
//     department: 'Human Resources',
//   },
//   {
//     id: 'EMP008',
//     name: 'Ankita Roy',
//     designation: 'Tele Caller Executive',
//     team: 'Sales Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp008.jpg',
//     email: 'ankita@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43217',
//     department: 'Sales',
//   },
//   {
//     id: 'EMP009',
//     name: 'Vikram Gupta',
//     designation: 'Project Manager',
//     team: 'Operations Team',
//     officeLocation: 'PAVION Office - Noida',
//     photoUrl: '/employees/emp009.jpg',
//     email: 'vikram@pavion.in',
//     shiftStart: '10:00',
//     phone: '+91 98765 43218',
//     department: 'Operations',
//   },
//   {
//     id: 'EMP010',
//     name: 'Pallabi Chatterjee',
//     designation: 'Accounts Executive',
//     team: 'Finance Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp010.jpg',
//     email: 'pallabi@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43219',
//     department: 'Finance',
//   },
//   {
//     id: 'EMP011',
//     name: 'Sourav Pal',
//     designation: 'Site Engineer',
//     team: 'Construction Team',
//     officeLocation: 'PAVION Office - Kolkata',
//     photoUrl: '/employees/emp011.jpg',
//     email: 'sourav@pavion.in',
//     shiftStart: '09:00',
//     phone: '+91 98765 43220',
//     department: 'Construction',
//   },
//   {
//     id: 'EMP012',
//     name: 'Madhurima Dey',
//     designation: 'Client Relationship',
//     team: 'Business Development Team',
//     officeLocation: 'PAVION Office - Bangkok',
//     photoUrl: '/employees/emp012.jpg',
//     email: 'madhurima@pavion.in',
//     shiftStart: '09:30',
//     phone: '+91 98765 43221',
//     department: 'Business Development',
//   },
// ];

// Employee selected first when the page opens.
// export const CURRENT_EMPLOYEE_ID = EMPLOYEE_DB[0].id;



export const EMPLOYEE_DB: Employee[] = [];  

const BLANK_EMPLOYEE: Employee = {
  id: '', name: '', designation: '', team: '', officeLocation: '',
  photoUrl: '/employees/default.jpg', email: '', shiftStart: '09:30',
};



export const findEmployee = (id: string) => EMPLOYEE_DB.find((e) => e.id === id) ?? null;


// Put the logged-in user (or anyone from the API) into the cache.
export function upsertEmployee(e: Employee) {
  const i = EMPLOYEE_DB.findIndex((x) => x.id === e.id);
  if (i > -1) EMPLOYEE_DB[i] = { ...EMPLOYEE_DB[i], ...e };
  else EMPLOYEE_DB.push(e);
}

// Full list for the Team page. Adjust the response key if yours differs.
let loadPromise: Promise<Employee[]> | null = null;
export async function fetchEmployees(force = false): Promise<Employee[]> {
  if (loadPromise && !force) return loadPromise;
  loadPromise = (async () => {
    const res = await fetch('/api/getAllEmployee', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) throw new Error(`getAllEmployee failed: ${res.status}`);
    const json = await res.json();
    const list: ApiEmployee[] = Array.isArray(json) ? json : json.data ?? [];
    list.map(mapApiEmployee).forEach(upsertEmployee);
    return EMPLOYEE_DB;
  })();
  loadPromise.catch(() => { loadPromise = null; });
  return loadPromise;
}

export const ACTION_META: Record<AttendanceAction, { label: string; verb: string; color: string; soft: string }> = {
  'check-in': { label: 'Check In', verb: 'checked in', color: '#16a34a', soft: '#e8f7ee' },
  'check-out': { label: 'Check Out', verb: 'checked out', color: '#ef4444', soft: '#fdecec' },
  'break-start': { label: 'Break Start', verb: 'started a break', color: '#f59e0b', soft: '#fef3e2' },
  'break-end': { label: 'Break End', verb: 'ended the break', color: '#2563eb', soft: '#e8f0fe' },
};

/* ------------------------------------------------------------------ */
/* Date / time helpers                                                 */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');

export const todayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const formatTime = (iso: string | null) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const formatClock = (d: Date) => {
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${h >= 12 ? 'PM' : 'AM'}`;
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDateChip = (d: Date) =>
  `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;

export const durationLabel = (minutes: number) =>
  minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;

/* ------------------------------------------------------------------ */
/* Attendance history (stand-in for the database)                      */
/* ------------------------------------------------------------------ */

const HISTORY_KEY = 'pavion_attendance_history';
const PROFILE_KEY = 'pavion_employee_profiles';

export function loadHistory(): AttendanceEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AttendanceEvent[];
    const today = todayKey();
    // Yesterday's rows are dropped, so every day starts clean.
    return parsed.filter((e) => todayKey(new Date(e.at)) === today);
  } catch {
    return [];
  }
}

export function saveHistory(list: AttendanceEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — the page still works for this session */
  }
}

export function newEvent(
  employee: Employee,
  action: AttendanceAction,
  at: Date,
  photoFile: string | null,
  confidence: number | null
): AttendanceEvent {
  return {
    id: `${employee.id}-${action}-${at.getTime()}`,
    employeeId: employee.id,
    employeeName: employee.name,
    action,
    at: at.toISOString(),
    photoFile,
    confidence,
  };
}

// Newest first, which is how the table shows them.
export const sortHistory = (list: AttendanceEvent[]) =>
  [...list].sort((a, b) => b.at.localeCompare(a.at));

/* ------------------------------------------------------------------ */
/* Rebuilding one employee's day from the history                      */
/* ------------------------------------------------------------------ */

export const emptyLog = (employeeId: string, date = todayKey()): DayLog => ({
  date,
  employeeId,
  checkIn: null,
  checkOut: null,
  breaks: [],
});

export function applyAction(log: DayLog, action: AttendanceAction, at: Date, photo?: string): DayLog {
  const iso = at.toISOString();
  const next: DayLog = { ...log, breaks: [...log.breaks], lastPhoto: photo ?? log.lastPhoto };

  if (action === 'check-in') next.checkIn = iso;
  if (action === 'check-out') next.checkOut = iso;
  if (action === 'break-start') next.breaks.push({ start: iso, end: null });
  if (action === 'break-end') {
    const idx = next.breaks.findIndex((b) => !b.end);
    if (idx > -1) next.breaks[idx] = { ...next.breaks[idx], end: iso };
  }
  return next;
}

// Replays today's events for one employee, oldest first.
export function buildLog(employeeId: string, history: AttendanceEvent[]): DayLog {
  return history
    .filter((e) => e.employeeId === employeeId)
    .sort((a, b) => a.at.localeCompare(b.at))
    .reduce((log, e) => applyAction(log, e.action, new Date(e.at)), emptyLog(employeeId));
}

// Kiosk helper: who should mark next? First employee who hasn't checked in.
// export function nextEmployeeToMark(history: AttendanceEvent[], skipId?: string): string {
//   const free = EMPLOYEE_DB.find(
//     (e) => e.id !== skipId && canPerform('check-in', buildLog(e.id, history)).allowed
//   );
//   return free?.id ?? EMPLOYEE_DB[0].id ?? '';
// }

export function nextEmployeeToMark(history: AttendanceEvent[], skipId?: string): string {
  const free = EMPLOYEE_DB.find(
    (e) => e.id !== skipId && canPerform('check-in', buildLog(e.id, history)).allowed
  );
  return free?.id ?? EMPLOYEE_DB[0]?.id ?? '';
}

/* ------------------------------------------------------------------ */
/* Breaks: who is on a break right now                                 */
/* ------------------------------------------------------------------ */

export interface ActiveBreak {
  employeeId: string;
  employeeName: string;
  startedAt: string;   // ISO
}

// Break Start / Break End never ask for a photo.
export const needsPhoto = (action: AttendanceAction) =>
  action !== 'break-start' && action !== 'break-end';

export function activeBreaks(history: AttendanceEvent[]): ActiveBreak[] {
  const out: ActiveBreak[] = [];
  for (const employee of EMPLOYEE_DB) {
    const open = buildLog(employee.id, history).breaks.find((b) => !b.end);
    if (open) out.push({ employeeId: employee.id, employeeName: loadProfile(employee.id).name, startedAt: open.start });
  }
  return out;
}

// 00:07:21 style running clock
export function elapsedLabel(fromIso: string, now: Date = new Date()) {
  const total = Math.max(0, Math.floor((now.getTime() - new Date(fromIso).getTime()) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

type ProfileMap = Record<string, Partial<Employee>>;

function loadProfileMap(): ProfileMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? '{}') as ProfileMap;
  } catch {
    return {};
  }
}

export function loadProfile(employeeId: string): Employee {
  // never fall back to another person's record
  const base = findEmployee(employeeId) ?? BLANK_EMPLOYEE;
  return { ...base, ...(loadProfileMap()[employeeId] ?? {}) };
}

export function saveProfile(profile: Employee) {
  if (typeof window === 'undefined') return;
  try {
    const map = loadProfileMap();
    map[profile.id] = profile;
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Which actions are allowed right now                                 */
/* ------------------------------------------------------------------ */

export const onBreak = (log: DayLog) => log.breaks.some((b) => !b.end);

export function canPerform(action: AttendanceAction, log: DayLog): { allowed: boolean; reason: string } {
  const open = onBreak(log);
  switch (action) {
    case 'check-in':
      if (log.checkIn) return { allowed: false, reason: `Already checked in at ${formatTime(log.checkIn)}` };
      return { allowed: true, reason: 'Start the work day' };
    case 'check-out':
      if (!log.checkIn) return { allowed: false, reason: 'Check in first' };
      if (log.checkOut) return { allowed: false, reason: `Already checked out at ${formatTime(log.checkOut)}` };
      if (open) return { allowed: false, reason: 'End the break first' };
      return { allowed: true, reason: 'Finish the work day' };
    case 'break-start':
      if (!log.checkIn) return { allowed: false, reason: 'Check in first' };
      if (log.checkOut) return { allowed: false, reason: 'The day is already closed' };
      if (open) return { allowed: false, reason: 'Already on a break' };
      return { allowed: true, reason: 'Pause the work timer' };
    case 'break-end':
      if (!open) return { allowed: false, reason: 'No break is running' };
      return { allowed: true, reason: 'Resume work' };
  }
}

export function breakMinutes(log: DayLog, now: Date = new Date()) {
  return log.breaks.reduce((sum, b) => {
    const end = b.end ? new Date(b.end) : now;
    return sum + Math.max(0, Math.round((end.getTime() - new Date(b.start).getTime()) / 60000));
  }, 0);
}

export function workedMinutes(log: DayLog, now: Date = new Date()) {
  if (!log.checkIn) return 0;
  const end = log.checkOut ? new Date(log.checkOut) : now;
  const gross = Math.max(0, Math.round((end.getTime() - new Date(log.checkIn).getTime()) / 60000));
  return Math.max(0, gross - breakMinutes(log, now));
}

export function attendanceStatus(log: DayLog, employee: Employee): 'Present' | 'Late' | 'Not Marked' {
  if (!log.checkIn) return 'Not Marked';
  const d = new Date(log.checkIn);
  const [h, m] = employee.shiftStart.split(':').map(Number);
  return d.getHours() * 60 + d.getMinutes() > h * 60 + m ? 'Late' : 'Present';
}

/* ------------------------------------------------------------------ */
/* Demo face verification                                              */
/* ------------------------------------------------------------------ */
// Swap this for your real API call, e.g.
//   const res = await fetch('/api/attendance/verify-face', {
//     method: 'POST', body: JSON.stringify({ employeeId, photo: dataUrl }),
//   });
// The UI only needs { ok, confidence, message, employee } back.

// Live-scan settings. The camera samples a frame every SCAN_INTERVAL_MS and needs
// SCAN_STREAK good frames in a row before it captures on its own.
export const SCAN_INTERVAL_MS = 350;
export const SCAN_STREAK = 4;
export const SCAN_RETRY_MS = 2500;

// Liveness: a real camera feed always changes a little between frames.
// A held-up photo of a screen, a paused stream or a virtual camera playing a
// still image produces almost identical frames, which we reject.
export const LIVENESS_MIN_MOTION = 0.9;

// Shared frame check, used both by the live scanner and by the final verification,
// so the preview and the result never disagree.
export function frameQuality(m: CaptureMetrics): { ok: boolean; hint: string } {
  if (m.motion < 0) return { ok: false, hint: 'Checking the live camera…' };
  if (m.motion < LIVENESS_MIN_MOTION) {
    return { ok: false, hint: 'No live feed detected — a photo or a still screen can’t be used' };
  }
  if (m.brightness < 45) return { ok: false, hint: 'Too dark — move to a brighter spot' };
  if (m.brightness > 235) return { ok: false, hint: 'Too bright — move away from the light' };
  if (m.contrast < 12) return { ok: false, hint: 'Nothing to scan — face the camera' };
  if (m.centerBrightness < 35) return { ok: false, hint: 'Keep your face inside the frame' };
  return { ok: true, hint: 'Face detected — hold still' };
}

export function verifyFaceDemo(metrics: CaptureMetrics, employeeId: string): VerificationResult {
  const employee = findEmployee(employeeId);

  if (!employee) {
    return { ok: false, confidence: 0, message: 'No matching record found in the employee database.', employee: null };
  }

  const quality = frameQuality(metrics);
  if (!quality.ok) {
    return { ok: false, confidence: 0, message: `${quality.hint}.`, employee: null };
  }

  // Deterministic "confidence" from the frame quality, so the demo feels real.
  const score = Math.min(1, metrics.contrast / 60) * 0.6 + Math.min(1, metrics.brightness / 160) * 0.4;
  const confidence = Math.round((90 + score * 9.4) * 10) / 10;

  return {
    ok: true,
    confidence,
    message: `Face matched with ${employee.id} records.`,
    employee,
  };
}

/* ------------------------------------------------------------------ */
/* Team directory (used by the Team page)                              */
/* ------------------------------------------------------------------ */
// Everything below is additive: it only reads EMPLOYEE_DB, the attendance
// history and the saved profiles, so the Attendance page keeps working as-is.

export type TeamStatus = 'Present' | 'Late' | 'On Leave' | 'Absent';

export const TEAM_STATUSES: TeamStatus[] = ['Present', 'Late', 'On Leave', 'Absent'];

export const TEAM_STATUS_META: Record<TeamStatus, { color: string; soft: string }> = {
  Present: { color: '#16a34a', soft: '#e8f7ee' },
  Late: { color: '#d97706', soft: '#fef3e2' },
  'On Leave': { color: '#f59e0b', soft: '#fff6e5' },
  Absent: { color: '#ef4444', soft: '#fdecec' },
};

// Approved leaves for today (stand-in until a Leave module exists).
const LEAVE_KEY = 'pavion_leave_today';
export const DEMO_ON_LEAVE_TODAY: string[] = [''];

export function loadLeaveIds(): string[] {
  if (typeof window === 'undefined') return DEMO_ON_LEAVE_TODAY;
  try {
    const raw = window.localStorage.getItem(LEAVE_KEY);
    if (!raw) return DEMO_ON_LEAVE_TODAY;
    const parsed = JSON.parse(raw) as { date: string; ids: string[] };
    return parsed.date === todayKey() ? parsed.ids : DEMO_ON_LEAVE_TODAY;
  } catch {
    return DEMO_ON_LEAVE_TODAY;
  }
}

export function saveLeaveIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LEAVE_KEY, JSON.stringify({ date: todayKey(), ids }));
  } catch {
    /* ignore */
  }
}

export const departmentOf = (e: Employee) => e.department ?? e.team.replace(/\s*Team$/i, '');

// Leave wins; otherwise today's check-in decides Present / Late / Absent.
export function teamStatus(employee: Employee, history: AttendanceEvent[], leaveIds: string[]): TeamStatus {
  if (leaveIds.includes(employee.id)) return 'On Leave';
  const status = attendanceStatus(buildLog(employee.id, history), employee);
  return status === 'Not Marked' ? 'Absent' : status;
}

export interface TeamMember extends Employee {
  department: string;
  phone: string;
  status: TeamStatus;
}

// The full team, with saved profile edits applied and today's status attached.
// Includes members the admin added from the Team page.
export function buildTeam(history: AttendanceEvent[], leaveIds: string[] = loadLeaveIds()): TeamMember[] {
  const profiles = loadProfileMap();
  return allEmployees().map((base) => {
    const e: Employee = { ...base, ...(profiles[base.id] ?? {}) };
    return {
      ...e,
      department: departmentOf(e),
      phone: e.phone ?? '',
      status: tempStatus.get(e.id) ?? teamStatus(e, history, leaveIds),
    };
  });
}

export function teamSummary(team: TeamMember[]) {
  return {
    total: team.length,
    present: team.filter((m) => m.status === 'Present' || m.status === 'Late').length,
    onLeave: team.filter((m) => m.status === 'On Leave').length,
    absent: team.filter((m) => m.status === 'Absent').length,
  };
}

// Department tiles, in a fixed order; unknown departments are appended.
export const DEPARTMENT_ORDER = [
  'Management',
  'Human Resources',
  'Marketing',
  'Creative',
  'Technology',
  'Sales',
  'Operations',
  'Finance',
  'Construction',
  'Business Development',
];

export function departmentCounts(team: TeamMember[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  team.forEach((m) => map.set(m.department, (map.get(m.department) ?? 0) + 1));
  const names = [
    ...DEPARTMENT_ORDER.filter((d) => map.has(d)),
    ...[...map.keys()].filter((d) => !DEPARTMENT_ORDER.includes(d)).sort(),
  ];
  return names.map((name) => ({ name, count: map.get(name) ?? 0 }));
}

/* ------------------------------------------------------------------ */
/* Demo changes from the Team page (in memory only)                    */
/* ------------------------------------------------------------------ */
// Members added with "Add Member" and members deleted from a card live only in
// memory: a page reload brings back the original 12 and drops the added ones.
// EMPLOYEE_DB itself is never modified, so the Attendance page is unaffected.
// To make these permanent later, swap these functions for API calls.

let tempAdded: Employee[] = [];
const tempDeleted = new Set<string>();
const tempStatus = new Map<string, TeamStatus>(); // status set in the Add Member form

export const OFFICE_LOCATIONS = [
  'PAVION Office - Kolkata',
  'PAVION Office - Noida',
  'PAVION Office - Bangkok',
];

export const loadAddedEmployees = (): Employee[] => [...tempAdded];

// Everyone currently on the dashboard: built-in + added, minus deleted.
export const allEmployees = (): Employee[] =>
  [...EMPLOYEE_DB, ...tempAdded].filter((e) => !tempDeleted.has(e.id));

export const isAddedEmployee = (id: string) => tempAdded.some((e) => e.id === id);

// EMP013, EMP014, ... Deleted IDs are never reused, so Undo stays safe.
export function nextEmployeeId(): string {
  const max = [...EMPLOYEE_DB, ...tempAdded].reduce((m, e) => {
    const n = Number(e.id.replace(/\D/g, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `EMP${String(max + 1).padStart(3, '0')}`;
}

// "98765 43210", "+91-9876543210", "919876543210" → "+91 98765 43210"; null if invalid.
export function normalizeIndianPhone(value: string): string | null {
  let d = value.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export function addEmployee(
  employee: Employee,
  status?: TeamStatus
): { ok: boolean; error?: string; field?: keyof Employee } {
  const everyone = [...EMPLOYEE_DB, ...tempAdded]; // includes deleted, so Undo can't clash
  if (everyone.some((e) => e.id.toLowerCase() === employee.id.toLowerCase())) {
    return { ok: false, field: 'id', error: 'This employee ID is already in use.' };
  }
  if (allEmployees().some((e) => e.email.toLowerCase() === employee.email.toLowerCase())) {
    return { ok: false, field: 'email', error: 'A member with this email already exists.' };
  }
  tempAdded = [...tempAdded, employee];
  if (status) tempStatus.set(employee.id, status);
  return { ok: true };
}

// Hides a member from the dashboard until the page reloads (or Undo / Restore).
export function removeEmployee(id: string) {
  tempDeleted.add(id);
}

export function restoreEmployee(id: string) {
  tempDeleted.delete(id);
}

export const loadRemovedIds = (): string[] => [...tempDeleted];

export function restoreRemovedEmployees() {
  tempDeleted.clear();
}

// Temporary status override (used for added members and the "⋯" leave toggle on them).
export const getTempStatus = (id: string) => tempStatus.get(id);
export function setTempStatus(id: string, status: TeamStatus | null) {
  if (status) tempStatus.set(id, status);
  else tempStatus.delete(id);
}