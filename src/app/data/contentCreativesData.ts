// ─────────────────────────────────────────────────────────────
// Content Creatives – types, constants & DEMO data
// Path: src/app/data/contentCreativesData.ts
//
// ⚠ The UI never reads DEMO data directly. Everything goes through
//   components/ContentCreatives/creativesApi.ts  (the data source).
//   To use real data you only change that file – see the notes there.
// ─────────────────────────────────────────────────────────────

import type { Platform, PostStatus } from "./contentCalendarData";

export type { Platform };
export type CreativeType = "Image" | "Video" | "Carousel" | "Story" | "Collection" | "Other";
export type CreativeStatus = Extract<PostStatus, "Published" | "Scheduled" | "In Review" | "Draft">;

export interface CreativeMedia {
  url: string;
  kind: "image" | "video" | "file";
  name?: string;
}

/** One creative (post / reel / carousel / story) – the shape your API or sheet must map to */
export interface Creative {
  id: string;
  title: string;
  type: CreativeType;
  platforms: Platform[];
  status: CreativeStatus;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  folderId: string | null; // null = not in a folder
  campaign: string | null;
  caption: string;
  tags: string[];
  thumbnail: string; // cover image URL
  media: CreativeMedia[]; // all files (carousel = several)
  durationSec?: number; // videos only
  sizeMB: number;
  createdBy: string;
  createdAt: string; // ISO date
  /** Design brief from "Add New Content Request" (optional – old items don't have one) */
  brief?: ContentBrief;
}

export type RequestPriority = "Low" | "Normal" | "High";

/** Everything the Graphics Team needs to design the content */
export interface ContentBrief {
  purpose: string;
  tone: string;
  colors: string[]; // hex values
  language: string;
  references: CreativeMedia[]; // reference images, brand assets, PDFs
  channels: string[]; // every selected channel incl. YouTube / LinkedIn …
  priority: RequestPriority;
  assignee: string;
  deadlineDate: string; // YYYY-MM-DD
  deadlineTime: string; // HH:mm
  notes: string;
  autoCalendar: boolean; // add to Content Calendar once approved
  calendarPostId: string | null; // set after it has been added to the calendar
}

export interface CreativeFolder {
  id: string;
  name: string;
  color: string;
}

export interface CreativesPayload {
  creatives: Creative[];
  folders: CreativeFolder[];
  storageLimitMB: number;
}

/* ── Option lists ─────────────────────────────────────────── */

/** Tabs shown above the grid (Collection / Other still appear under "All Media") */
export const TYPE_TABS: { value: CreativeType; label: string }[] = [
  { value: "Image", label: "Images" },
  { value: "Video", label: "Videos" },
  { value: "Carousel", label: "Carousels" },
  { value: "Story", label: "Stories" },
];

export const TYPE_META: Record<CreativeType, { label: string; short: string; color: string; soft: string }> = {
  Image: { label: "Image (Static)", short: "Image", color: "#16a34a", soft: "#dcf6e6" },
  Video: { label: "Video (Reel)", short: "Video", color: "#e11d48", soft: "#ffe4ea" },
  Carousel: { label: "Carousel", short: "Carousel", color: "#7c3aed", soft: "#efe7ff" },
  Story: { label: "Story", short: "Story", color: "#f59e0b", soft: "#fff1d6" },
  Collection: { label: "Collection", short: "Collection", color: "#0284c7", soft: "#e0f2fe" },
  Other: { label: "Other", short: "Other", color: "#64748b", soft: "#eef0f5" },
};

export const CREATIVE_TYPES = Object.keys(TYPE_META) as CreativeType[];
export const CREATIVE_STATUSES: CreativeStatus[] = ["Published", "Scheduled", "In Review", "Draft"];

/** Dot colours used in "Quick Stats" */
export const STATUS_DOT: Record<CreativeStatus, string> = {
  Published: "#22c55e",
  Scheduled: "#8b5cf6",
  "In Review": "#f59e0b",
  Draft: "#a5b4fc",
};

export const CREATIVE_TAGS = ["Bridal", "Tutorial", "Offer", "Testimonial", "Festive", "Academy", "Skincare", "Behind the Scenes", "Product", "Transformation"];

export const FOLDER_COLORS = ["#f59e0b", "#ec4899", "#8b5cf6", "#f472b6", "#22c55e", "#fb923c", "#eab308", "#f97316", "#10b981", "#3b82f6", "#e11d48", "#0ea5e9"];

export const STORAGE_LIMIT_MB = 10 * 1024;

/* ── Content request options (edit these lists freely) ───── */

export const PURPOSE_OPTIONS = [
  "Brand Awareness",
  "Engagement",
  "Lead Generation",
  "Sales / Bookings",
  "Offer / Promotion",
  "Education / Tips",
  "Announcement",
  "Festive Greeting",
];

export const TONE_OPTIONS = ["Elegant & Royal", "Fun & Playful", "Minimal & Clean", "Bold & Vibrant", "Warm & Emotional", "Professional"];

export const LANGUAGE_OPTIONS = ["English", "Bengali", "Hindi", "Hinglish", "Benglish"];

/** Default "Primary Color Theme" swatches */
export const DEFAULT_THEME_COLORS = ["#a3171d", "#c9973a", "#f3e2c4"];

/** Teams shown first in "Assign To" (client team members are added after these) */
export const ASSIGN_TEAMS = ["Graphics Team", "Video Editing Team", "Content Writing Team"];

/** Extra channels under the "Other" platform dropdown */
export const OTHER_CHANNELS = ["LinkedIn", "Pinterest", "Google Business Profile", "WhatsApp", "X (Twitter)", "Threads"];

/* ── Helpers ──────────────────────────────────────────────── */

export const formatSize = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.max(0.1, Math.round(mb * 10) / 10)} MB`);
export const formatDuration = (sec?: number) => {
  if (!sec && sec !== 0) return "";
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
export const newCreativeId = () => `cr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ── DEMO data (deterministic so server & browser render the same) ── */

export const DEMO_FOLDERS: CreativeFolder[] = [
  { id: "f-bridal", name: "Bridal Makeup", color: "#f59e0b" },
  { id: "f-tips", name: "Makeup Tips", color: "#ec4899" },
  { id: "f-testimonials", name: "Client Testimonials", color: "#8b5cf6" },
  { id: "f-offers", name: "Offers & Promotions", color: "#f472b6" },
  { id: "f-class", name: "Class Updates", color: "#22c55e" },
  { id: "f-skincare", name: "Skincare Tips", color: "#fb923c" },
  { id: "f-festive", name: "Festive Content", color: "#eab308" },
  { id: "f-product", name: "Product Highlights", color: "#f97316" },
  { id: "f-bts", name: "Behind The Scenes", color: "#10b981" },
  { id: "f-reels", name: "Reels", color: "#3b82f6" },
  { id: "f-stories", name: "Stories", color: "#e11d48" },
];
const FOLDER_TARGET: Record<string, number> = {
  "f-bridal": 42, "f-tips": 28, "f-testimonials": 20, "f-offers": 18, "f-class": 16, "f-skincare": 14,
  "f-festive": 12, "f-product": 10, "f-bts": 8, "f-reels": 6, "f-stories": 4,
};

const PHOTO_IDS = [
  "photo-1487412947147-5cebf100ffc2",
  "photo-1522335789203-aabd1fc54bc9",
  "photo-1596462502278-27bfdc403348",
  "photo-1512496015851-a90fb38ba796",
  "photo-1560066984-138dadb4c035",
  "photo-1516975080664-ed2fc6a32937",
  "photo-1457972729786-0411a3b2b626",
  "photo-1526045478516-99145907023c",
];
const photo = (i: number) => `https://images.unsplash.com/${PHOTO_IDS[i % PHOTO_IDS.length]}?auto=format&fit=crop&w=600&q=60`;

const TEAM = ["Rohan Das", "Priyanka S.", "Amit Roy"];
const TIMES = ["10:00", "11:30", "13:00", "16:00", "18:30", "20:00"];
const CAMPAIGN_NAMES = ["Durga Puja Bookings", "Wedding Season Launch", "Academy Admissions", "Diwali Offer"];

const tagFromFolder: Record<string, string> = {
  "f-bridal": "Bridal", "f-tips": "Tutorial", "f-testimonials": "Testimonial", "f-offers": "Offer", "f-class": "Academy",
  "f-skincare": "Skincare", "f-festive": "Festive", "f-product": "Product", "f-bts": "Behind the Scenes", "f-reels": "Tutorial", "f-stories": "Festive",
};

function caption(title: string, tags: string[]) {
  return `${title} ✨\nBook your slot with Trisha'z Makeover & Academy today! 💄\n\n${[...tags, "MakeupArtist", "KolkataMakeup"]
    .map((t) => `#${t.replace(/[^a-z0-9]/gi, "")}`)
    .join(" ")}`;
}

function make(
  i: number,
  title: string,
  type: CreativeType,
  platforms: Platform[],
  date: string,
  status: CreativeStatus,
  folderId: string | null,
  durationSec?: number,
): Creative {
  const tags = folderId ? [tagFromFolder[folderId]] : ["Motivation"];
  const mediaCount = type === "Carousel" ? 3 : 1;
  const sizeMB =
    type === "Video" ? 38 + ((i * 7) % 30) : type === "Carousel" ? 14 + ((i * 3) % 10) : type === "Story" ? 6 + (i % 4) : 3 + ((i * 11) % 25) / 10;
  return {
    id: `cr-${i}`,
    title,
    type,
    platforms,
    status,
    date,
    time: TIMES[i % TIMES.length],
    folderId,
    campaign: i % 5 === 0 ? CAMPAIGN_NAMES[(i / 5) % CAMPAIGN_NAMES.length] : null,
    caption: caption(title, tags),
    tags,
    thumbnail: photo(i),
    media: Array.from({ length: mediaCount }, (_, k) => ({ url: photo(i + k * 3), kind: "image" as const })),
    durationSec: type === "Video" ? durationSec ?? 15 + ((i * 13) % 46) : undefined,
    sizeMB: Math.round(sizeMB * 10) / 10,
    createdBy: TEAM[i % TEAM.length],
    createdAt: date,
  };
}

/** The 18 creatives from the design, then 168 generated ones (186 total) */
export function buildDemoCreatives(): Creative[] {
  const IG: Platform[] = ["Instagram"];
  const FB: Platform[] = ["Facebook"];
  const first: Creative[] = [
    make(1, "Bridal Makeup Look", "Image", IG, "2026-09-01", "Published", "f-bridal"),
    make(2, "Makeup Tips Carousel", "Carousel", IG, "2026-09-02", "Scheduled", "f-tips"),
    make(3, "Festive Look Reel", "Video", IG, "2026-09-03", "Published", "f-festive", 28),
    make(4, "Skincare Tips Post", "Image", FB, "2026-09-04", "In Review", "f-skincare"),
    make(5, "Motivational Quote", "Story", IG, "2026-09-05", "Published", null),
    make(6, "Client Testimonial", "Video", IG, "2026-09-06", "Scheduled", "f-testimonials", 32),
    make(7, "Batch Update", "Image", FB, "2026-09-07", "Published", "f-class"),
    make(8, "Workshop Promotion", "Image", IG, "2026-09-08", "Published", "f-offers"),
    make(9, "Bridal Transformation", "Video", IG, "2026-09-09", "Published", "f-bridal", 45),
    make(10, "Client Review", "Image", IG, "2026-09-10", "Scheduled", "f-testimonials"),
    make(11, "Festive Offer", "Carousel", IG, "2026-09-11", "In Review", "f-offers"),
    make(12, "Eye Makeup Tutorial", "Image", IG, "2026-09-12", "Draft", "f-tips"),
    make(13, "Behind The Scenes", "Video", IG, "2026-09-13", "Published", "f-bts", 30),
    make(14, "Product Highlight", "Image", IG, "2026-09-14", "Scheduled", "f-product"),
    make(15, "Classroom Moments", "Carousel", FB, "2026-09-15", "Published", "f-class"),
    make(16, "Makeup Tips", "Image", IG, "2026-09-16", "Draft", "f-tips"),
    make(17, "Client Makeover", "Video", IG, "2026-09-17", "Published", "f-bridal", 40),
    make(18, "Festival Greeting", "Image", FB, "2026-09-18", "Scheduled", "f-festive"),
  ];

  // deterministic shuffle
  let seed = 20260906;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pool = <T,>(entries: [T, number][]) => {
    const arr = entries.flatMap(([v, n]) => Array<T>(Math.max(0, n)).fill(v));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const types = pool<CreativeType>([["Image", 115], ["Video", 37], ["Carousel", 13], ["Story", 3]]);
  const statuses = pool<CreativeStatus>([["Published", 89], ["Scheduled", 41], ["In Review", 22], ["Draft", 16]]);
  const used: Record<string, number> = {};
  first.forEach((c) => c.folderId && (used[c.folderId] = (used[c.folderId] ?? 0) + 1));
  const folderIds = pool<string | null>([
    ...Object.entries(FOLDER_TARGET).map(([id, n]) => [id, n - (used[id] ?? 0)] as [string, number]),
    [null, 7],
  ]);

  const names: Record<CreativeType, string[]> = {
    Image: ["Bridal Look", "Party Makeup", "Skincare Routine", "Offer Poster", "Client Smile", "Academy Batch", "Product Shot", "Festive Glam", "Hair Styling", "Nail Art"],
    Video: ["Makeup Reel", "Tutorial Reel", "Transformation Reel", "Client Reel", "GRWM Reel"],
    Carousel: ["Tips Carousel", "Before & After", "Lookbook"],
    Story: ["Daily Story", "Poll Story"],
    Collection: ["Collection"],
    Other: ["Post"],
  };
  const platformsFor = (i: number): Platform[] => (i % 10 < 7 ? ["Instagram"] : i % 10 < 9 ? ["Facebook"] : ["Meta"]);
  const base = Date.UTC(2026, 7, 31);

  const rest = types.map((type, k) => {
    const d = new Date(base - Math.floor(k * 0.6) * 86400000);
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const list = names[type];
    const title = `${list[k % list.length]} ${Math.floor(k / list.length) + 1}`;
    return make(19 + k, title, type, platformsFor(k), date, statuses[k], folderIds[k] ?? null);
  });

  return [...first, ...rest];
}
