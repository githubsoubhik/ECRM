// ─────────────────────────────────────────────────────────────
// Content Calendar – types, sample data & helpers
// Path: src/app/data/contentCalendarData.ts
// ─────────────────────────────────────────────────────────────

export type PostStatus = "Published" | "Scheduled" | "In Review" | "Needs Changes" | "Draft";
export type ContentType = "Image" | "Reel" | "Carousel" | "Story" | "Collection" | "Other";
export type Platform = "Instagram" | "Facebook" | "Meta" | "Other";
export type ApprovalBucket = "Approved" | "In Review" | "Needs Changes" | "Draft";

export interface MediaItem {
  url: string;
  kind: "image" | "video" | "file";
  name?: string;
}

export interface PostComment {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface PostHistoryItem {
  id: string;
  action: string;
  by: string;
  time: string;
}

export interface PostPerformance {
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface ContentPost {
  id: string;
  title: string;
  type: ContentType;
  platforms: Platform[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24h)
  status: PostStatus;
  caption: string;
  media: MediaItem[];
  tags: string[];
  performance: PostPerformance;
  comments: PostComment[];
  history: PostHistoryItem[];
  createdBy: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  done: boolean;
}

/* ── Option lists ─────────────────────────────────────────── */

export const CONTENT_TYPES: { value: ContentType; label: string; short: string }[] = [
  { value: "Image", label: "Image (Static)", short: "Image" },
  { value: "Reel", label: "Video (Reel)", short: "Reel" },
  { value: "Carousel", label: "Carousel", short: "Carousel" },
  { value: "Story", label: "Story", short: "Story" },
  { value: "Collection", label: "Collection", short: "Collection" },
  { value: "Other", label: "Other", short: "Other" },
];

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "Meta", label: "Meta (FB + IG)" },
  { value: "Other", label: "Other" },
];

export const STATUSES: PostStatus[] = ["Published", "Scheduled", "In Review", "Needs Changes", "Draft"];

/** Colors used for pills AND for the multi-post dots in the calendar */
export const STATUS_META: Record<PostStatus, { color: string; bg: string; text: string }> = {
  Published: { color: "#22c55e", bg: "#e6f8ee", text: "#15803d" },
  Scheduled: { color: "#3b82f6", bg: "#e8f0ff", text: "#2753c9" },
  "In Review": { color: "#f59e0b", bg: "#fff4dc", text: "#b26b00" },
  "Needs Changes": { color: "#ef4444", bg: "#fdeaea", text: "#c42b2b" },
  Draft: { color: "#9aa0b8", bg: "#eef0f5", text: "#575d78" },
};

export const APPROVAL_BUCKETS: ApprovalBucket[] = ["Approved", "In Review", "Needs Changes", "Draft"];
export const APPROVAL_COLORS: Record<ApprovalBucket, string> = {
  Approved: "#22c55e",
  "In Review": "#f59e0b",
  "Needs Changes": "#ef4444",
  Draft: "#a5a9c9",
};
export const approvalOf = (s: PostStatus): ApprovalBucket =>
  s === "Published" || s === "Scheduled" ? "Approved" : s;

export const TAG_OPTIONS = [
  "Bridal",
  "Tutorial",
  "Offer",
  "Testimonial",
  "Festive",
  "Academy",
  "Behind the Scenes",
  "Skincare",
  "Engagement",
  "Transformation",
];

/* ── Date helpers (locale-independent) ────────────────────── */

export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const pad = (n: number) => String(n).padStart(2, "0");
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const to12h = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};
/** "01 Sep 2026" */
export const formatShort = (key: string) => {
  const d = fromKey(key);
  return `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};
/** "Tue, 15 Sep 2026" */
export const formatLong = (key: string) => {
  const d = fromKey(key);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};
export const typeLabel = (t: ContentType) => CONTENT_TYPES.find((c) => c.value === t)?.short ?? t;
export const platformLabel = (list: Platform[]) =>
  list.map((p) => (p === "Meta" ? "Meta (FB + IG)" : p)).join(", ");
export const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const EMPTY_PERFORMANCE: PostPerformance = { reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 };

/* ── Sample data (replace with your API later) ───────────── */

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
const photo = (i: number) =>
  `https://images.unsplash.com/${PHOTO_IDS[i % PHOTO_IDS.length]}?auto=format&fit=crop&w=480&q=60`;

const hashtag = (t: string) => `#${t.replace(/[^a-z0-9]/gi, "")}`;
const buildCaption = (title: string, tags: string[]) =>
  `${title} ✨\nBook your slot with Trisha'z Makeover & Academy today! 💄\n\n${[
    ...tags.map(hashtag),
    "#KolkataMakeup",
    "#MakeupArtist",
    "#TrishazMakeover",
  ].join(" ")}`;

let seq = 0;
function seedPost(
  date: string,
  time: string,
  title: string,
  type: ContentType,
  platforms: Platform[],
  status: PostStatus,
  tags: string[] = [],
): ContentPost {
  seq += 1;
  const i = seq;
  const id = `cc-${i}`;
  const mediaCount = type === "Carousel" || type === "Collection" ? 3 : 1;
  const media: MediaItem[] = Array.from({ length: mediaCount }, (_, k) => ({ url: photo(i + k * 3), kind: "image" }));
  const live = status === "Published";
  const when = `${formatShort(date)}, ${to12h(time)}`;

  return {
    id,
    title,
    type,
    platforms,
    date,
    time,
    status,
    tags,
    caption: buildCaption(title, tags),
    media,
    performance: live
      ? {
          reach: 1400 + ((i * 733) % 5200),
          likes: 90 + ((i * 97) % 640),
          comments: 6 + ((i * 13) % 58),
          shares: 3 + ((i * 7) % 45),
          saves: 8 + ((i * 11) % 90),
        }
      : { ...EMPTY_PERFORMANCE },
    comments:
      i % 2 === 0
        ? [
            { id: `${id}-c1`, author: "Priyanka S.", text: "Looks great! Can we add the academy logo on the last frame?", time: when },
            { id: `${id}-c2`, author: "Rohan Das", text: "Done — updated the final frame.", time: when },
          ]
        : [],
    history: [
      { id: `${id}-h1`, action: "Post created", by: "Rohan Das", time: `${formatShort(date)}, 09:15 AM` },
      ...(status !== "Draft"
        ? [{ id: `${id}-h2`, action: `Status set to ${status}`, by: "Priyanka S.", time: when }]
        : []),
    ],
    createdBy: "Rohan Das",
  };
}

export const initialContentPosts: ContentPost[] = [
  // ── September 2026 ──
  seedPost("2026-09-01", "10:00", "Bridal Makeup Reel", "Reel", ["Instagram"], "Published", ["Bridal", "Tutorial"]),
  seedPost("2026-09-02", "11:30", "Course Promo Post", "Image", ["Facebook"], "Published", ["Academy", "Offer"]),
  seedPost("2026-09-03", "16:00", "Student Testimonial", "Reel", ["Instagram"], "Published", ["Testimonial", "Academy"]),
  seedPost("2026-09-04", "12:00", "Makeup Tips Carousel", "Carousel", ["Instagram"], "Scheduled", ["Tutorial"]),
  seedPost("2026-09-05", "18:00", "Festive Look Reel", "Reel", ["Instagram"], "Scheduled", ["Festive"]),
  seedPost("2026-09-06", "11:00", "Skincare Tips", "Image", ["Instagram"], "Published", ["Skincare"]),
  seedPost("2026-09-06", "17:30", "Skincare Q&A Story", "Story", ["Facebook"], "Published", ["Skincare"]),
  seedPost("2026-09-07", "15:00", "Makeup Course Ad", "Image", ["Facebook"], "Published", ["Academy", "Offer"]),
  seedPost("2026-09-09", "11:00", "Behind The Scenes", "Reel", ["Instagram"], "In Review", ["Behind the Scenes"]),
  seedPost("2026-09-10", "13:00", "Client Transformation", "Reel", ["Instagram"], "Scheduled", ["Transformation"]),
  seedPost("2026-09-11", "17:00", "Offer Announcement", "Image", ["Facebook"], "Published", ["Offer"]),
  seedPost("2026-09-13", "10:00", "Bridal Look Carousel", "Carousel", ["Instagram"], "Published", ["Bridal"]),
  seedPost("2026-09-14", "14:00", "Makeup Tutorial Reel", "Reel", ["Instagram"], "Published", ["Tutorial"]),
  seedPost("2026-09-14", "19:00", "Tutorial Teaser Story", "Story", ["Instagram"], "Published", ["Tutorial"]),
  seedPost("2026-09-14", "20:30", "Academy Batch Poll", "Story", ["Facebook"], "Needs Changes", ["Academy"]),
  seedPost("2026-09-16", "11:30", "Student Work", "Image", ["Facebook"], "Scheduled", ["Academy"]),
  seedPost("2026-09-17", "13:00", "Live Session Promo", "Image", ["Instagram"], "Draft", ["Academy"]),
  seedPost("2026-09-18", "12:00", "Client Review", "Reel", ["Instagram"], "Scheduled", ["Testimonial"]),
  seedPost("2026-09-19", "16:00", "Festival Makeup Look", "Reel", ["Instagram"], "In Review", ["Festive"]),
  seedPost("2026-09-20", "11:00", "Makeup Tip Post", "Image", ["Facebook"], "Published", ["Tutorial"]),
  seedPost("2026-09-21", "14:00", "Course Batch Update", "Image", ["Instagram"], "Scheduled", ["Academy"]),
  seedPost("2026-09-23", "17:00", "Salon Transformation", "Reel", ["Instagram"], "Draft", ["Transformation"]),
  seedPost("2026-09-24", "15:00", "Student Testimonial", "Reel", ["Facebook"], "Published", ["Testimonial"]),
  seedPost("2026-09-25", "13:00", "Engagement Look", "Reel", ["Instagram"], "Scheduled", ["Engagement", "Bridal"]),
  seedPost("2026-09-25", "18:30", "Engagement Look BTS", "Story", ["Meta"], "In Review", ["Behind the Scenes"]),
  seedPost("2026-09-27", "12:00", "Year End Offer", "Image", ["Instagram"], "Draft", ["Offer"]),
  seedPost("2026-09-28", "10:00", "Makeup Workshop", "Image", ["Facebook"], "Scheduled", ["Academy"]),
  seedPost("2026-09-29", "15:00", "Client Feedback", "Reel", ["Instagram"], "In Review", ["Testimonial"]),
  seedPost("2026-09-30", "11:00", "Before After Reel", "Reel", ["Instagram"], "Scheduled", ["Transformation"]),

  // ── October 2026 ──
  seedPost("2026-10-01", "11:00", "Pujo Countdown Begins", "Image", ["Instagram"], "Published", ["Festive"]),
  seedPost("2026-10-02", "10:00", "Gandhi Jayanti Wishes", "Image", ["Meta"], "Published", ["Festive"]),
  seedPost("2026-10-02", "18:00", "Pujo Booking Open Reel", "Reel", ["Instagram"], "Published", ["Festive", "Offer"]),
  seedPost("2026-10-05", "12:00", "Pujo Lookbook", "Carousel", ["Instagram"], "Scheduled", ["Festive"]),
  seedPost("2026-10-07", "16:00", "Student Success Story", "Reel", ["Facebook"], "In Review", ["Academy", "Testimonial"]),
  seedPost("2026-10-09", "11:30", "Bridal Skincare Tips", "Carousel", ["Instagram"], "Scheduled", ["Bridal", "Skincare"]),
  seedPost("2026-10-09", "19:00", "Skincare Live Reminder", "Story", ["Instagram"], "Draft", ["Skincare"]),
  seedPost("2026-10-12", "13:00", "Pujo Offer Announcement", "Image", ["Meta"], "Scheduled", ["Offer", "Festive"]),
  seedPost("2026-10-15", "10:30", "Pujo Makeup Look", "Reel", ["Instagram"], "Needs Changes", ["Festive"]),
  seedPost("2026-10-17", "09:30", "Pujo Day Look", "Reel", ["Instagram"], "Scheduled", ["Festive"]),
  seedPost("2026-10-17", "13:00", "Pujo Client Diaries", "Carousel", ["Facebook"], "Scheduled", ["Festive", "Transformation"]),
  seedPost("2026-10-17", "19:30", "Pandal Hopping Story", "Story", ["Instagram"], "Draft", ["Festive"]),
  seedPost("2026-10-19", "12:00", "Red & White Look", "Reel", ["Instagram"], "Scheduled", ["Festive"]),
  seedPost("2026-10-21", "17:00", "Bijoya Wishes", "Image", ["Meta"], "Draft", ["Festive"]),
  seedPost("2026-10-26", "11:00", "Wedding Season Bookings", "Image", ["Instagram"], "Draft", ["Bridal", "Offer"]),
];

export const initialContentIdeas: ContentIdea[] = [
  { id: "idea-1", title: "Durga Puja Makeup Look", done: false },
  { id: "idea-2", title: "Student Success Story", done: false },
  { id: "idea-3", title: "Bridal Skincare Tips", done: false },
  { id: "idea-4", title: "Academy Classroom Reel", done: false },
  { id: "idea-5", title: "Client Transformations", done: false },
  { id: "idea-6", title: "Get Ready With Me – Pujo Edition", done: false },
  { id: "idea-7", title: "Makeup Kit Unboxing", done: false },
];