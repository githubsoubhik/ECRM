// Tabs, colours, filters and small formatters for the Announcements page.

import {
  COMPANY_WIDE,
  OTHERS,
  categoryOf,
  departmentsReached,
  fmtDate,
  shortDept,
  statusOf,
  textOf,
  type Announcement,
  type Person,
} from "../../../../data/announcementData";
import { todayKey } from "../../../../data/employeeData";

/* ---------------- Tabs ---------------- */

// Tabs after "All". Categories not listed here are grouped under "Others".
// Add a department name here to give it its own tab.
export const FEED_TABS = [COMPANY_WIDE, "Marketing", "Operations", "Human Resources", "Finance"];

export const tabOf = (a: Announcement) => {
  const c = categoryOf(a);
  return FEED_TABS.includes(c) ? c : OTHERS;
};
export const tabLabel = (t: string) => (t === COMPANY_WIDE || t === OTHERS ? t : shortDept(t));

/* ---------------- Card colours ---------------- */

export interface Theme {
  tint: string; // card background (left)
  tint2: string; // card background (right)
  edge: string; // border
  badge: string; // category badge background
  ink: string; // category badge text / accents
  tile: string; // logo tile background
}

const T = (tint: string, tint2: string, edge: string, badge: string, ink: string, tile: string): Theme => ({ tint, tint2, edge, badge, ink, tile });

const THEMES: Record<string, Theme> = {
  [COMPANY_WIDE]: T("#eaf7f0", "#f6fbf8", "#d5eee0", "#d6f0e1", "#15803d", "#d9f1e4"),
  "Human Resources": T("#fff1ea", "#fff9f5", "#fbdfcf", "#fde2d2", "#c2410c", "#fde3d8"),
  Marketing: T("#ecf3fe", "#f7faff", "#d6e5fa", "#dae8fb", "#1d5fbf", "#d9e7fb"),
  Operations: T("#f3effd", "#faf8ff", "#e3daf9", "#e7defb", "#6d28d9", "#e5dbfb"),
  Sales: T("#fff5e6", "#fffbf4", "#f9e3c3", "#fde8cc", "#b45309", "#fde7c9"),
  Finance: T("#e9f7f5", "#f6fcfb", "#cfeee8", "#d3f0ea", "#0f766e", "#d2efe9"),
  Technology: T("#eef0fe", "#f8f9ff", "#dcdffa", "#e0e3fc", "#4338ca", "#dfe2fb"),
  Creative: T("#fdeef8", "#fff8fc", "#f7d9ec", "#fadcef", "#be185d", "#f9dbee"),
  Construction: T("#fdf3e7", "#fffaf3", "#f3e0c6", "#f6e4cb", "#9a5b13", "#f5e1c6"),
  "Business Development": T("#e9f6fb", "#f6fbfe", "#cfe9f3", "#d3ebf5", "#0e7490", "#d2eaf4"),
  Management: T("#eff2f6", "#f8f9fb", "#dde3eb", "#e1e6ee", "#334155", "#e0e5ed"),
  [OTHERS]: T("#f1f3f7", "#f9fafc", "#e0e4eb", "#e3e7ee", "#475569", "#e2e6ed"),
};
export const themeOf = (a: Announcement): Theme => THEMES[categoryOf(a)] ?? THEMES[OTHERS];

/* ---------------- Status on this page ---------------- */

export type FeedStatus = "active" | "upcoming" | "expired";

export function feedStatus(a: Announcement, now: Date): FeedStatus {
  if (new Date(a.sendAt) > now) return "upcoming";
  const s = statusOf(a, now);
  return s === "scheduled" ? "upcoming" : s === "expired" ? "expired" : "active";
}

/* ---------------- Filters ---------------- */

export interface Filters {
  dept: string;
  type: string; // audience type, "pinned", "urgent" or "files"
  status: string; // "", active, upcoming, expired
  from: string;
  to: string;
}

export const TYPE_OPTIONS = [
  { value: "all", label: "Company Wide" },
  { value: "departments", label: "Department" },
  { value: "team-leaders", label: "Team Leaders" },
  { value: "groups", label: "Groups" },
  { value: "individuals", label: "Individual" },
  { value: "pinned", label: "Pinned" },
  { value: "urgent", label: "Urgent" },
  { value: "files", label: "With Attachments" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "expired", label: "Expired" },
];

export function monthRange(now: Date, offset = 0) {
  return {
    from: todayKey(new Date(now.getFullYear(), now.getMonth() + offset, 1)),
    to: todayKey(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)),
  };
}

export const defaultFilters = (now: Date): Filters => ({ dept: "", type: "", status: "", ...monthRange(now) });
export const emptyFilters = (): Filters => ({ dept: "", type: "", status: "", from: "", to: "" });

export const activeFilterCount = (f: Filters, now: Date) => {
  const d = defaultFilters(now);
  return [f.dept, f.type, f.status].filter(Boolean).length + (f.from !== d.from || f.to !== d.to ? 1 : 0);
};

/**
 * Applies search + filters (not the tab).
 * `published` = sent announcements; `upcoming` = not sent yet. "All Status" shows the
 * published ones; "Upcoming" also includes scheduled ones that haven't been sent.
 */
export function applyFilters(published: Announcement[], upcoming: Announcement[], q: string, f: Filters, list: Person[], now: Date) {
  const base = f.status === "upcoming" ? [...upcoming, ...published.filter((a) => !upcoming.includes(a))] : published;
  const s = q.trim().toLowerCase();
  return base.filter((a) => {
    const st = feedStatus(a, now);
    if (f.status && st !== f.status) return false;
    if (f.dept && !departmentsReached(a, list).includes(f.dept)) return false;
    if (f.type) {
      if (f.type === "pinned" ? !a.pinned : f.type === "urgent" ? !a.urgent : f.type === "files" ? !a.attachments.length : a.audience.type !== f.type)
        return false;
    }
    if (f.from && a.endDate < f.from) return false; // visible period overlaps the range
    if (f.to && a.startDate > f.to) return false;
    if (s && ![a.title, a.createdBy, textOf(a.message), categoryOf(a)].some((v) => v.toLowerCase().includes(s))) return false;
    return true;
  });
}

/* ---------------- Formatting ---------------- */

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
export const dayMonth = (key: string) => {
  const [, m, d] = key.split("-").map(Number);
  return { day: String(d).padStart(2, "0"), mon: MON[m - 1] };
};

export function splitDateTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const time = `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  return { date: fmtDate(todayKey(d)), time };
}

/** Paragraphs of the message as plain text (for the card preview). */
export function paragraphs(html: string): string[] {
  return html
    .split(/<\/(?:p|h3|h4|li|div)>|<br\s*\/?>/i)
    .map(textOf)
    .filter(Boolean);
}

/** Short preview: a greeting like "Dear Team," stays on its own line, like a letter. */
export function preview(html: string): string[] {
  const ps = paragraphs(html);
  if (ps.length > 1 && ps[0].length <= 24) return [ps[0], ps.slice(1).join(" ")];
  return [ps.join(" ")];
}

/* ---------------- Links ---------------- */

/** Address of the notice page for one announcement (keeps ?employee= when set). */
export const noticeHref = (id: string, viewerId?: string | null) =>
  `/dashboard/Announcements/${encodeURIComponent(id)}${viewerId ? `?employee=${encodeURIComponent(viewerId)}` : ""}`;

/** Address of the list, optionally opened on one category tab. */
export const listHref = (tab?: string, viewerId?: string | null) => {
  const q = new URLSearchParams();
  if (tab) q.set("tab", tab);
  if (viewerId) q.set("employee", viewerId);
  const s = q.toString();
  return `/dashboard/Announcements${s ? `?${s}` : ""}`;
};
