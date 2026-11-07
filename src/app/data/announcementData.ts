// src/app/data/announcementData.ts
// Announcements: storage, audience targeting, status and stats.
//
// Admins create announcements on /dashboard/AnnouncementManagement.
// Employees read them on /dashboard/Announcements. A scheduled announcement
// appears there automatically once its send time arrives (until then it is
// listed under "Upcoming").
//     getAnnouncementsForEmployee(employeeId)
// returns the announcements that are currently active for one person.
//
// Everything is saved in the browser (localStorage) for now. To move to a real
// backend, replace the load*/save* functions below with API calls.

import { DEPARTMENT_ORDER, allEmployees, departmentOf, loadProfile, todayKey, type Employee } from "./employeeData";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AudienceType = "all" | "departments" | "team-leaders" | "groups" | "individuals";

export interface Audience {
  type: AudienceType;
  departments: string[]; // for 'departments' and 'team-leaders'
  groups: string[]; // for 'groups'
  employeeIds: string[]; // for 'individuals'
}

export interface AttachmentMeta {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // MIME type
  /**
   * Where the file can be opened: /api/announcements/files/<id> (saved on the server) or
   * local:<id> (kept in this browser, see announcementFiles.ts).
   * Missing = no real file (sample data, or attached before uploads were enabled).
   */
  url?: string;
}

/**
 * The picture shown on the announcement card: either one of the built-in
 * symbols (see src/app/components/announcements/AnnouncementLogo.tsx) or an
 * uploaded logo, stored as a small resized image (data URL).
 */
export type AnnouncementLogo = { kind: "symbol"; symbol: string } | { kind: "image"; dataUrl: string; name: string };

export interface AnnouncementInput {
  title: string;
  message: string; // HTML from the editor (sanitised before display)
  attachments: AttachmentMeta[];
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  audience: Audience;
  schedule: "now" | "later";
  sendDate: string; // YYYY-MM-DD, used when schedule = 'later'
  sendTime: string; // HH:MM
  category: string; // "" = automatic (from the audience), else "Company Wide", a department or "Others"
  logo: AnnouncementLogo | null;
  cover: AttachmentMeta | null; // banner image at the top of the notice page
  pinned: boolean; // shown first on the Announcements page
  urgent: boolean; // red "Urgent" tag
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  attachments: AttachmentMeta[];
  startDate: string;
  endDate: string;
  audience: Audience;
  sendAt: string; // ISO date-time it goes out
  createdAt: string; // ISO
  createdBy: string;
  recipientIds: string[]; // resolved when it was created
  cancelledAt: string | null;
  // Display options (optional so announcements saved before this update still load).
  category?: string;
  logo?: AnnouncementLogo | null;
  cover?: AttachmentMeta | null;
  pinned?: boolean;
  urgent?: boolean;
}

export type AnnStatus = "active" | "scheduled" | "expired" | "cancelled";

export interface Draft {
  id: string;
  savedAt: string;
  input: AnnouncementInput;
}

export interface Template {
  id: string;
  name: string;
  title: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

// Shown as "Created By". Replace with the logged-in user once auth is added.
export const CURRENT_USER_NAME = "Admin";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];

export const STATUS_META: Record<AnnStatus, { label: string; color: string; soft: string; text: string }> = {
  active: { label: "Active", color: "#22a55b", soft: "#e3f6ea", text: "#15803d" },
  scheduled: { label: "Scheduled", color: "#f59e0b", soft: "#fef3dc", text: "#b45309" },
  expired: { label: "Expired", color: "#ef4444", soft: "#fde8e8", text: "#dc2626" },
  cancelled: { label: "Cancelled", color: "#8b93a3", soft: "#eceef2", text: "#4b5563" },
};

export const AUDIENCE_OPTIONS: { type: AudienceType; label: string; sub: string }[] = [
  { type: "all", label: "All Employees", sub: "Send to everyone in the organization" },
  { type: "departments", label: "Specific Departments", sub: "Choose one or more departments" },
  { type: "team-leaders", label: "Department Team Leaders Only", sub: "Send only to team leaders of selected department(s)" },
  { type: "groups", label: "Specific Groups", sub: "Send to custom employee groups" },
  { type: "individuals", label: "Individual Employees", sub: "Select specific employees" },
];

export const TARGET_TYPE_LABEL: Record<AudienceType, string> = {
  all: "All Employees",
  departments: "Departments",
  "team-leaders": "Team Leaders",
  groups: "Groups",
  individuals: "Individuals",
};

// Team leaders per department. Anyone whose designation includes one of these
// words counts as a leader; a department with none falls back to its first member.
// Edit TEAM_LEADER_IDS to name leaders explicitly (e.g. { Marketing: ['EMP001'] }).
const LEADER_WORDS = /(manager|lead|head|director|supervisor)/i;
export const TEAM_LEADER_IDS: Record<string, string[]> = {};

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "tpl-holiday",
    name: "Holiday notice",
    title: "Office Holiday Notice",
    message:
      "<p>Dear Team,</p><p>The office will remain <b>closed</b> on the dates below. Work resumes on the next working day.</p><p>Wishing you and your family a happy holiday!</p>",
  },
  {
    id: "tpl-meeting",
    name: "Team meeting",
    title: "Team Meeting",
    message:
      "<p>Hi all,</p><p>Please join the team meeting.</p><ul><li><b>Date:</b> </li><li><b>Time:</b> </li><li><b>Venue:</b> </li></ul><p>Attendance is mandatory.</p>",
  },
  {
    id: "tpl-policy",
    name: "Policy update",
    title: "Policy Update",
    message: "<p>Dear Team,</p><p>We have updated our <b>policy</b>. Please read the attached document and reach out to HR with any questions.</p>",
  },
  {
    id: "tpl-maintenance",
    name: "System maintenance",
    title: "System Maintenance Alert",
    message: "<p>Our systems will be under maintenance during the period below. Some tools may be unavailable. Please save your work in advance.</p>",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  return todayKey(new Date(y, m - 1, d + n));
}

// "2026-09-15" → "15 Sep 2026"
export function fmtDate(key: string) {
  if (!key) return "—";
  const [y, m, d] = key.split("-").map(Number);
  return `${pad(d)} ${MONTHS_SHORT[m - 1]} ${y}`;
}

export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${fmtDate(todayKey(d))}, ${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(d.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
}

export const fmtSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

export const EMPTY_AUDIENCE: Audience = { type: "all", departments: [], groups: [], employeeIds: [] };

export function emptyInput(today = todayKey()): AnnouncementInput {
  return {
    title: "",
    message: "",
    attachments: [],
    startDate: "",
    endDate: "",
    audience: { ...EMPTY_AUDIENCE },
    schedule: "now",
    sendDate: today,
    sendTime: "10:00",
    category: "",
    logo: null,
    cover: null,
    pinned: false,
    urgent: false,
  };
}

// Plain text of the editor's HTML (for validation and search).
export const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

// Allows only simple formatting tags and safe links. Run before showing HTML.
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return textOf(html);
  const allowed = new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "UL", "OL", "LI", "H3", "H4", "A", "DIV", "SPAN"]);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const walk = (node: Element) => {
    [...node.children].forEach((child) => {
      if (!allowed.has(child.tagName)) {
        child.replaceWith(...[...child.childNodes]);
        return;
      }
      [...child.attributes].forEach((a) => {
        const keep = child.tagName === "A" && a.name === "href" && /^(https?:|mailto:)/i.test(a.value);
        if (!keep) child.removeAttribute(a.name);
      });
      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    });
  };
  const root = doc.body.firstElementChild as Element;
  walk(root);
  return root.innerHTML;
}

/* ------------------------------------------------------------------ */
/* Attachment files                                                    */
/* ------------------------------------------------------------------ */
// Files are uploaded to the API route in src/app/api/announcements/files and saved
// in the "announcement-files" folder at the project root (like attendance-photos).
export const FILE_API = "/api/announcements/files";
// Files are saved by src/app/data/announcementFiles.ts (uploadFile) and shown with
// src/app/components/announcements/FileSource.tsx.
const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
export const isImageFile = (f: Pick<AttachmentMeta, "name" | "type">) => f.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(extOf(f.name));
export const isPdfFile = (f: Pick<AttachmentMeta, "name" | "type">) => f.type === "application/pdf" || extOf(f.name) === "pdf";
/** Images and PDFs open inside the page; Word files can only be downloaded. */
export const canPreview = (f: AttachmentMeta) => !!f.url && (isImageFile(f) || isPdfFile(f));
/* ------------------------------------------------------------------ */
/* People: departments, groups, leaders                                */
/* ------------------------------------------------------------------ */

export interface Person {
  id: string;
  name: string;
  department: string;
  designation: string;
  team: string;
  office: string;
  photoUrl: string;
}

export function people(): Person[] {
  return allEmployees().map((base) => {
    const e: Employee = base.id.startsWith("EMP") ? { ...base, ...pick(loadProfile(base.id), base.id) } : base;
    return {
      id: e.id,
      name: e.name,
      department: departmentOf(e),
      designation: e.designation,
      team: e.team,
      office: e.officeLocation,
      photoUrl: e.photoUrl,
    };
  });
}

// loadProfile falls back to the first employee for unknown ids; only use it when it matches.
const pick = (p: Employee, id: string) => (p.id === id ? p : {});

export const departmentsOf = (list: Person[]) => [...new Set(list.map((p) => p.department))].sort();

// Groups = teams and office locations.
export const groupsOf = (list: Person[]) => [
  ...new Set([...list.map((p) => p.team), ...list.map((p) => p.office.replace("PAVION Office - ", "") + " Office")]),
];

const inGroup = (p: Person, g: string) => p.team === g || p.office.replace("PAVION Office - ", "") + " Office" === g;

export function leadersOf(dept: string, list: Person[]): Person[] {
  const members = list.filter((p) => p.department === dept);
  const named = TEAM_LEADER_IDS[dept];
  if (named?.length) return members.filter((p) => named.includes(p.id));
  const byTitle = members.filter((p) => LEADER_WORDS.test(p.designation));
  return byTitle.length ? byTitle : members.slice(0, 1);
}

export function resolveAudience(a: Audience, list: Person[] = people()): Person[] {
  switch (a.type) {
    case "all":
      return list;
    case "departments":
      return list.filter((p) => a.departments.includes(p.department));
    case "team-leaders":
      return a.departments.flatMap((d) => leadersOf(d, list));
    case "groups":
      return list.filter((p) => a.groups.some((g) => inGroup(p, g)));
    case "individuals":
      return list.filter((p) => a.employeeIds.includes(p.id));
  }
}

export function audienceLabel(a: Audience, list: Person[] = people()): string {
  const many = (items: string[], noun: string) => (items.length === 1 ? items[0] : `${items.length} ${noun}`);
  switch (a.type) {
    case "all":
      return "All Employees";
    case "departments":
      return a.departments.length ? (a.departments.length === 1 ? `${a.departments[0]} Department` : `${a.departments.length} Departments`) : "No department";
    case "team-leaders":
      return a.departments.length ? `${many(a.departments, "Departments")} (Team Leaders)` : "Team Leaders";
    case "groups":
      return a.groups.length ? many(a.groups, "Groups") : "No group";
    case "individuals": {
      if (a.employeeIds.length === 1) return list.find((p) => p.id === a.employeeIds[0])?.name ?? "1 Employee";
      return `${a.employeeIds.length} Employees`;
    }
  }
}

// Departments an announcement reaches (for the department filter).
export function departmentsReached(a: Announcement, list: Person[] = people()): string[] {
  if (a.audience.type === "all") return departmentsOf(list);
  if (a.audience.type === "departments" || a.audience.type === "team-leaders") return a.audience.departments;
  return [...new Set(list.filter((p) => a.recipientIds.includes(p.id)).map((p) => p.department))];
}

/* ------------------------------------------------------------------ */
/* Categories (the tabs on the Announcements page)                     */
/* ------------------------------------------------------------------ */

export const COMPANY_WIDE = "Company Wide";
export const OTHERS = "Others";

// Short names used on tabs and badges.
export const shortDept = (d: string) => (d === "Human Resources" ? "HR" : d);

// Category choices in the form: Company Wide, every department, Others.
export function categoryOptions(list: Person[] = people()): string[] {
  const depts = departmentsOf(list);
  const ordered = [...DEPARTMENT_ORDER.filter((d) => depts.includes(d)), ...depts.filter((d) => !DEPARTMENT_ORDER.includes(d))];
  return [COMPANY_WIDE, ...ordered, OTHERS];
}

// The category chosen in the form, or one worked out from the audience.
export function autoCategory(audience: Audience): string {
  if (audience.type === "all") return COMPANY_WIDE;
  if ((audience.type === "departments" || audience.type === "team-leaders") && audience.departments.length === 1) return audience.departments[0];
  return OTHERS;
}
export const categoryOf = (a: Pick<Announcement, "category" | "audience">) => a.category || autoCategory(a.audience);

// Badge text on a card: "Company Wide", "HR Department", "Others".
export function categoryLabel(cat: string) {
  if (cat === COMPANY_WIDE || cat === OTHERS) return cat;
  return `${shortDept(cat)} Department`;
}

/* ------------------------------------------------------------------ */
/* Status & stats                                                      */
/* ------------------------------------------------------------------ */

export function statusOf(a: Announcement, now: Date = new Date()): AnnStatus {
  if (a.cancelledAt) return "cancelled";
  const today = todayKey(now);
  if (new Date(a.sendAt) > now || a.startDate > today) return "scheduled";
  if (a.endDate < today) return "expired";
  return "active";
}

const monthKey = (iso: string) => iso.slice(0, 7);

export function stats(list: Announcement[], now: Date = new Date()) {
  const thisMonth = todayKey(now).slice(0, 7);
  const lastMonth = todayKey(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
  const change = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : 100) : Math.round(((cur - prev) / prev) * 100));
  const count = (pred: (a: Announcement) => boolean) => list.filter(pred).length;

  const sent = (a: Announcement) => !a.cancelledAt && new Date(a.sendAt) <= now;
  const scheduled = (a: Announcement) => statusOf(a, now) === "scheduled";

  return {
    total: list.length,
    totalChange: change(
      count((a) => monthKey(a.createdAt) === thisMonth),
      count((a) => monthKey(a.createdAt) === lastMonth),
    ),
    sent: count(sent),
    sentChange: change(
      count((a) => sent(a) && monthKey(a.sendAt) === thisMonth),
      count((a) => sent(a) && monthKey(a.sendAt) === lastMonth),
    ),
    scheduled: count(scheduled),
    scheduledChange: change(
      count((a) => scheduled(a) && monthKey(a.createdAt) === thisMonth),
      count((a) => scheduled(a) && monthKey(a.createdAt) === lastMonth),
    ),
    cancelled: count((a) => !!a.cancelledAt),
    cancelledChange: change(
      count((a) => !!a.cancelledAt && monthKey(a.cancelledAt) === thisMonth),
      count((a) => !!a.cancelledAt && monthKey(a.cancelledAt) === lastMonth),
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const KEY = "pavion_announcements";
const DRAFTS_KEY = "pavion_announcement_drafts";
const TEMPLATES_KEY = "pavion_announcement_templates";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const SEED_VERSION_KEY = "pavion_announcements_seed";
const SEED_VERSION = 2;

export function loadAnnouncements(): Announcement[] {
  if (typeof window === "undefined") return [];
  const stored = read<Announcement[] | null>(KEY, null);
  const version = read<number>(SEED_VERSION_KEY, stored ? 1 : 0);
  if (stored && version >= SEED_VERSION) return stored;

  // First visit, or sample data from an older version: (re)create the samples
  // but keep every announcement the admin created.
  const seed = seedAnnouncements();
  const own = (stored ?? []).filter((a) => !a.id.startsWith("seed-") && !OLD_SEED_TITLES.includes(a.title));
  const next = [...own, ...seed];
  write(KEY, next);
  write(SEED_VERSION_KEY, SEED_VERSION);
  return next;
}

// Titles of the first sample set, replaced by the richer set below.
const OLD_SEED_TITLES = [
  "Durga Puja Holiday Notice",
  "Marketing Team Meeting",
  "New HR Policy Update",
  "System Maintenance Alert",
  "Sales Incentive Announcement",
  "Quarterly Town Hall",
  "Website Launch Celebration",
  "Client Visit – Dress Code",
  "Team Outing Postponed",
  "Training Session on SEO",
  "Office Wi-Fi Upgrade",
  "Monthly Birthday Celebration",
];

export const saveAnnouncements = (list: Announcement[]) => write(KEY, list);

export const loadDrafts = () => read<Draft[]>(DRAFTS_KEY, []);
export const saveDrafts = (list: Draft[]) => write(DRAFTS_KEY, list);

export const loadTemplates = () => read<Template[]>(TEMPLATES_KEY, DEFAULT_TEMPLATES);
export const saveTemplates = (list: Template[]) => write(TEMPLATES_KEY, list);

/* ------------------------------------------------------------------ */
/* Views (shown on the notice page)                                    */
/* ------------------------------------------------------------------ */
// Counts unique viewers per announcement: the employee id when known (?employee=EMP001),
// otherwise one id per browser. Saved in the browser for now — move to your API with login.

const VIEWS_KEY = "pavion_announcement_views";
const BROWSER_KEY = "pavion_viewer_key";
export const VIEWS_EVENT = "pavion-announcement-views";

export function browserViewerKey(): string {
  if (typeof window === "undefined") return "server";
  let k = window.localStorage.getItem(BROWSER_KEY);
  if (!k) {
    k = newId("viewer");
    window.localStorage.setItem(BROWSER_KEY, k);
  }
  return k;
}

export const viewCount = (id: string) => read<Record<string, string[]>>(VIEWS_KEY, {})[id]?.length ?? 0;

/** Adds this viewer to the announcement's viewers (once) and tells the page to refresh the count. */
export function recordView(id: string, viewerKey: string) {
  const all = read<Record<string, string[]>>(VIEWS_KEY, {});
  const seen = all[id] ?? [];
  if (seen.includes(viewerKey)) return;
  all[id] = [...seen, viewerKey];
  write(VIEWS_KEY, all);
  window.dispatchEvent(new Event(VIEWS_EVENT));
}

/* ------------------------------------------------------------------ */
/* Creating                                                            */
/* ------------------------------------------------------------------ */

export function validate(input: AnnouncementInput, now: Date = new Date()): Partial<Record<keyof AnnouncementInput | "audience", string>> {
  const e: Partial<Record<keyof AnnouncementInput | "audience", string>> = {};
  if (input.title.trim().length < 3) e.title = "Enter a title (at least 3 characters).";
  if (textOf(input.message).length < 5) e.message = "Write a message (at least 5 characters).";
  if (!input.startDate) e.startDate = "Choose a start date.";
  if (!input.endDate) e.endDate = "Choose an end date.";
  else if (input.startDate && input.endDate < input.startDate) e.endDate = "End date must be on or after the start date.";
  const a = input.audience;
  if (a.type === "departments" && !a.departments.length) e.audience = "Choose at least one department.";
  if (a.type === "team-leaders" && !a.departments.length) e.audience = "Choose at least one department.";
  if (a.type === "groups" && !a.groups.length) e.audience = "Choose at least one group.";
  if (a.type === "individuals" && !a.employeeIds.length) e.audience = "Choose at least one employee.";
  if (!e.audience && !resolveAudience(a).length) e.audience = "This audience has no employees.";
  if (input.schedule === "later") {
    if (!input.sendDate || !input.sendTime) e.sendDate = "Choose when to send.";
    else if (new Date(`${input.sendDate}T${input.sendTime}`) <= now) e.sendDate = "Choose a time in the future.";
  }
  return e;
}

export function buildAnnouncement(input: AnnouncementInput, now: Date = new Date()): Announcement {
  const sendAt = input.schedule === "later" ? new Date(`${input.sendDate}T${input.sendTime}`) : now;
  return {
    id: newId("ann"),
    title: input.title.trim(),
    message: input.message,
    attachments: input.attachments,
    startDate: input.startDate,
    endDate: input.endDate,
    audience: input.audience,
    sendAt: sendAt.toISOString(),
    createdAt: now.toISOString(),
    createdBy: CURRENT_USER_NAME,
    recipientIds: resolveAudience(input.audience).map((p) => p.id),
    cancelledAt: null,
    category: input.category,
    logo: input.logo,
    cover: input.cover,
    pinned: input.pinned,
    urgent: input.urgent,
  };
}

/* ------------------------------------------------------------------ */
/* For other pages                                                     */
/* ------------------------------------------------------------------ */

/**
 * Announcements an employee should see right now (active, targeted at them),
 * newest first. Use this on the employee-facing announcements page.
 */
export function getAnnouncementsForEmployee(employeeId: string, now: Date = new Date()): Announcement[] {
  return loadAnnouncements()
    .filter((a) => statusOf(a, now) === "active" && a.recipientIds.includes(employeeId))
    .sort((x, y) => y.sendAt.localeCompare(x.sendAt));
}

/**
 * Everything the Announcements page needs, for one employee or (employeeId = null)
 * for the whole company:
 *   published – sent and not cancelled (active or expired), pinned first, newest first
 *   upcoming  – scheduled, not sent yet, soonest first
 */
export function announcementFeed(employeeId: string | null, now: Date = new Date()) {
  const mine = loadAnnouncements().filter((a) => !a.cancelledAt && (!employeeId || a.recipientIds.includes(employeeId)));
  const published = mine
    .filter((a) => new Date(a.sendAt) <= now)
    .sort(
      (x, y) => Number(!!y.pinned && statusOf(y, now) === "active") - Number(!!x.pinned && statusOf(x, now) === "active") || y.sendAt.localeCompare(x.sendAt),
    );
  const upcoming = mine
    .filter((a) => statusOf(a, now) === "scheduled")
    .sort((x, y) => x.startDate.localeCompare(y.startDate) || x.sendAt.localeCompare(y.sendAt));
  return { published, upcoming };
}

/* ------------------------------------------------------------------ */
/* Sample data (first visit only)                                      */
/* ------------------------------------------------------------------ */

function seedAnnouncements(): Announcement[] {
  const now = new Date();
  const today = todayKey(now);
  const list = people();
  const depts = departmentsOf(list);
  const d = (n: number) => addDays(today, n);
  const at = (n: number, h = 10, m = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + n, h, m, 0).toISOString();
  const all: Audience = { ...EMPTY_AUDIENCE };
  const dept = (x: string): Audience => ({ ...EMPTY_AUDIENCE, type: "departments", departments: [x] });
  const leaders = (x: string): Audience => ({ ...EMPTY_AUDIENCE, type: "team-leaders", departments: [x] });
  const has = (name: string) => (depts.includes(name) ? name : depts[0]);
  const sym = (symbol: string): AnnouncementLogo => ({ kind: "symbol", symbol });
  const file = (name: string, kb: number, type: string): AttachmentMeta => ({ id: `seed-file-${name}`, name, size: kb * 1024, type });

  let n = 0;
  const make = (o: {
    title: string;
    by: string;
    audience: Audience;
    start: number;
    end: number;
    send: number;
    sendHour?: number;
    sendMin?: number;
    message: string;
    category?: string;
    symbol?: string;
    pinned?: boolean;
    urgent?: boolean;
    files?: AttachmentMeta[];
    cancelled?: boolean;
    startKey?: string;
    endKey?: string;
    sendIso?: string;
  }): Announcement => {
    const sendAt = o.sendIso ?? at(o.send, o.sendHour ?? 10, o.sendMin ?? 0);
    return {
      id: `seed-${++n}`,
      title: o.title,
      message: o.message,
      attachments: o.files ?? [],
      startDate: o.startKey ?? d(o.start),
      endDate: o.endKey ?? d(o.end),
      audience: o.audience,
      sendAt,
      createdAt: new Date(Math.min(new Date(sendAt).getTime(), now.getTime()) - 86_400_000).toISOString(),
      createdBy: o.by,
      recipientIds: resolveAudience(o.audience, list).map((p) => p.id),
      cancelledAt: o.cancelled ? at(Math.min(o.send, -1) + 1, 12) : null,
      category: o.category ?? "",
      logo: o.symbol ? sym(o.symbol) : null,
      pinned: !!o.pinned,
      urgent: !!o.urgent,
    };
  };

  // Next 2 October (Gandhi Jayanti): a scheduled holiday notice that goes live on the day.
  const y = now.getMonth() > 9 || (now.getMonth() === 9 && now.getDate() > 2) ? now.getFullYear() + 1 : now.getFullYear();
  const gandhi = `${y}-10-02`;

  return [
    make({
      title: "Durga Puja Holiday Notice",
      by: "Soumi Bhattacharya",
      audience: all,
      start: -18,
      end: 12,
      send: -18,
      sendHour: 11,
      sendMin: 30,
      category: COMPANY_WIDE,
      symbol: "celebration",
      pinned: true,
      message:
        "<p>Dear Team,</p><p>We are pleased to inform you that our office will remain <b>closed</b> for Durga Puja. Work resumes on the next working day after the holidays.</p><p>Wishing you and your family a joyful Puja!</p>",
    }),
    make({
      title: "Updated HR Policy – Work From Office Guidelines",
      by: "Soumi Bhattacharya",
      audience: all,
      start: -20,
      end: 20,
      send: -20,
      sendHour: 15,
      sendMin: 15,
      category: has("Human Resources"),
      symbol: "alert",
      urgent: true,
      files: [file("WFO Policy 2026.pdf", 1229, "application/pdf")],
      message:
        "<p>Please find the updated Work From Office (WFO) policy effective from 1st October. All employees are requested to read the attached document carefully.</p><ul><li>Minimum 4 office days a week</li><li>Core hours: 10:30 AM – 4:30 PM</li></ul><p>Reach out to HR with any questions.</p>",
    }),
    make({
      title: "Marketing Team Meeting",
      by: "Priyangshu Mandal",
      audience: leaders(has("Marketing")),
      start: -1,
      end: 2,
      send: -1,
      category: has("Marketing"),
      symbol: "chart",
      message:
        "<p>There will be a team meeting for the Marketing Department to discuss Q4 plans, campaign strategies and client targets.</p><ul><li><b>Venue:</b> Conference Room, Kolkata office</li><li><b>Time:</b> 11:00 AM</li></ul>",
    }),
    make({
      title: "System Maintenance Alert",
      by: "Vikram Gupta",
      audience: all,
      start: -25,
      end: 5,
      send: -25,
      sendHour: 17,
      sendMin: 20,
      category: has("Operations"),
      symbol: "gears",
      message:
        "<p>Our internal systems will be under maintenance from 10:00 PM to 6:00 AM. Some tools may be unavailable during this window. Please save your work in advance.</p>",
    }),
    make({
      title: "Sales Incentive Announcement",
      by: "Bidyut Kayal",
      audience: dept(has("Sales")),
      start: -27,
      end: 3,
      send: -27,
      sendHour: 13,
      sendMin: 10,
      category: has("Sales"),
      symbol: "gift",
      message: "<p>We are excited to announce a new incentive plan for the sales team effective this quarter. Top performers earn a bonus every month.</p>",
    }),
    make({
      title: "Expense Claims – Submission Deadline",
      by: "Pallabi Chatterjee",
      audience: all,
      start: -6,
      end: 4,
      send: -6,
      sendHour: 12,
      category: has("Finance"),
      symbol: "wallet",
      files: [file("Expense Claim Form.docx", 84, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")],
      message:
        "<p>Please submit all pending expense claims for this month with bills attached before the deadline. Late claims move to next month’s cycle.</p>",
    }),
    make({
      title: "Training Session on SEO",
      by: "Indrajit Sarkar",
      audience: dept(has("Marketing")),
      start: -5,
      end: 10,
      send: -5,
      sendHour: 16,
      category: has("Marketing"),
      symbol: "training",
      message: "<p>An SEO training session is scheduled for the marketing team. Bring your laptops and current client keyword lists.</p>",
    }),
    make({
      title: "Site Safety Guidelines",
      by: "Sourav Pal",
      audience: dept(has("Construction")),
      start: -3,
      end: 27,
      send: -3,
      sendHour: 9,
      sendMin: 30,
      category: has("Construction"),
      symbol: "safety",
      urgent: true,
      message: "<p>Helmets, safety shoes and reflective jackets are mandatory on all sites from today. Site in-charges will check daily.</p>",
    }),
    make({
      title: "Gandhi Jayanti Holiday",
      by: "Soumi Bhattacharya",
      audience: all,
      start: 0,
      end: 0,
      send: 0,
      startKey: gandhi,
      endKey: gandhi,
      sendIso: new Date(`${gandhi}T09:00`).toISOString(),
      category: COMPANY_WIDE,
      symbol: "india-flag",
      pinned: true,
      message: "<p>Dear Team,</p><p>The office will remain closed on <b>2nd October</b> on account of Gandhi Jayanti.</p>",
    }),
    make({
      title: "Quarterly Town Hall",
      by: "Priyangshu Mandal",
      audience: all,
      start: 12,
      end: 12,
      send: 10,
      category: COMPANY_WIDE,
      symbol: "team",
      message: "<p>Join the quarterly town hall to review results and plans for next quarter.</p>",
    }),
    make({
      title: "Health Check-up Camp",
      by: "Soumi Bhattacharya",
      audience: all,
      start: 17,
      end: 17,
      send: 15,
      category: has("Human Resources"),
      symbol: "health",
      message: "<p>A free health check-up camp will be held at the Kolkata office. Register with HR to book your slot.</p>",
    }),
    make({
      title: "Monthly Birthday Celebration",
      by: "Soumi Bhattacharya",
      audience: all,
      start: 3,
      end: 3,
      send: 1,
      category: COMPANY_WIDE,
      symbol: "cake",
      message: "<p>Cake and celebrations for this month’s birthdays in the break room!</p>",
    }),
    make({
      title: "Website Launch Celebration",
      by: "Baban Mondal",
      audience: dept(has("Technology")),
      start: -40,
      end: -35,
      send: -40,
      category: has("Technology"),
      symbol: "rocket",
      message: "<p>Thank you, team, for shipping the new website!</p>",
    }),
    make({
      title: "Client Visit – Dress Code",
      by: "Madhurima Dey",
      audience: all,
      start: -45,
      end: -44,
      send: -45,
      category: has("Business Development"),
      symbol: "briefcase",
      message: "<p>A client visits the office tomorrow. Please follow formal dress code.</p>",
    }),
    make({
      title: "Team Outing Postponed",
      by: "Soumi Bhattacharya",
      audience: all,
      start: -10,
      end: -8,
      send: -12,
      category: COMPANY_WIDE,
      symbol: "calendar",
      cancelled: true,
      message: "<p>The team outing is postponed. New dates will be shared soon.</p>",
    }),
    make({
      title: "Office Wi-Fi Upgrade",
      by: "Baban Mondal",
      audience: all,
      start: -38,
      end: -37,
      send: -38,
      category: has("Technology"),
      cancelled: true,
      message: "<p>Wi-Fi will be down for one hour during the upgrade.</p>",
    }),
  ];
}
