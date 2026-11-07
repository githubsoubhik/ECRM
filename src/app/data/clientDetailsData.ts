// Path: src/app/data/clientDetailsData.ts
// Types + DEMO data for the Client Details page (/dashboard/Clients/[id]).
//
// HOW TO CONNECT YOUR API LATER:
// Only change `fetchClientDetails()` at the bottom of this file so it returns
// a `ClientDetails` object from your API. Every section of the page reads from
// that one object, so no UI code needs to change.

import { INITIAL_CLIENTS, type Client } from "./clientsData";

/* ============================== TYPES ============================== */

export type CampaignBucket = "past" | "current" | "upcoming";
export type PostBucket = "past" | "today" | "upcoming";
export type PostType = "Static" | "Reel" | "Story" | "Carousel";
export type PostStatus = "Published" | "Scheduled" | "Draft";
export type Platform = "facebook" | "instagram" | "gmb";

export interface TeamMember {
  id: string; 
  name: string;
  role: string;
  avatar: string | null;
}

export const CAMPAIGN_OBJECTIVES = ["Lead Generation", "Brand Awareness", "Course Promotion", "Sales / Promotion", "Event Promotion"] as const;
export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];
export type CampaignStatus = "Active" | "Paused" | "Completed" | "Scheduled" | "Draft";

/** One "Update Performance" entry — spend & results for that period (entries add up to the campaign totals) */
export interface PerformanceUpdate {
  id: string;
  date: string; // ISO
  spent: number;
  results: number;
  leads: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  by: string;
}

export interface CampaignAttachment {
  id: string;
  name: string;
  size: number; // bytes
  type: string;
  url?: string;
}

export interface Campaign {
  id: string;
  name: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  type: string; // objective, e.g. "Lead Generation"
  budget: number; // ₹
  result: string; // legacy text, e.g. "224 Leads" (UI uses campaignResult())
  goal?: string; // e.g. "150 Leads"
  runBy?: string;
  thumbnail?: string | null;
  /* ---- performance fields (optional so old data still works) ---- */
  category?: string; // sub line, e.g. "Bridal Bookings"
  platforms?: Platform[];
  spent?: number; // ₹ spent so far
  leads?: number; // primary results count (leads / enquiries / bookings)
  resultUnit?: string; // "Leads" | "Enquiries" | "Bookings"
  resultMetric?: "leads" | "reach"; // what the Result column shows
  reach?: number;
  conversions?: number;
  ctr?: number; // %
  resultChange?: number; // % vs previous period
  paused?: boolean; // running campaigns can be paused (legacy — prefer statusOverride)
  /* ---- extra fields from the Add New Campaign form ---- */
  statusOverride?: "Paused" | "Completed" | "Draft";
  otherPlatform?: string; // e.g. "YouTube", "Google Ads"
  goalType?: string; // Campaign Goal select
  audience?: string;
  description?: string;
  results?: number; // results count (falls back to `leads`)
  impressions?: number;
  clicks?: number;
  creatives?: { planned: number; given: number; types: string[] };
  notes?: string;
  attachments?: CampaignAttachment[];
  updates?: PerformanceUpdate[];
}

export interface CalendarPost {
  id: string;
  title: string;
  type: PostType;
  time: string; // "10:00 AM"
  date: string; // ISO
  status: PostStatus;
  image: string | null;
}

export interface WorkCategory {
  id: string;
  label: string;
  count: number;
  image: string | null;
}

export interface MetricCard {
  label: string;
  value: number;
  change: number; // % vs previous period
  series: number[]; // sparkline points
}

export interface DailyPoint {
  label: string; // "5 Sep"
  views: number;
  engagement: number;
  leads: number;
}

export interface WeeklyPoint {
  label: string; // "Week 1"
  reach: number;
  engagement: number;
  leads: number;
}

export interface Conversation {
  id: string;
  name: string;
  avatar: string | null;
  time: string;
  message: string;
  tag: "Client" | "Internal";
}

export interface InternalNote {
  id: string;
  author: string;
  avatar: string | null;
  time: string;
  text: string;
  tag: "Internal" | "Client";
}

export interface ActivityItem {
  id: string;
  time: string;
  text: string;
  color: string;
}

export interface ClientFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  url?: string;
}

export interface ClientTask {
  id: string;
  title: string;
  assignee: string;
  due: string;
  done: boolean;
}

export interface AccountAccess {
  platform: Platform;
  handle: string;
  url: string;
  connected: boolean;
}

export interface ClientDetails {
  id: string;
  name: string;
  logo: string | null;
  status: "Active" | "Inactive" | "Prospect" | string;
  categories: string[];
  location: string;
  phone: string;
  email: string;
  website: string;

  team: TeamMember[];

  stats: {
    totalCampaigns: number;
    completed: number;
    running: number;
    upcoming: number;
    totalSpend: number;
    spendChange: number;
    leads: number;
    leadsChange: number;
    followersGrowth: number;
    followersChange: number;
    postsPublished: number;
    staticPosts: number;
    reels: number;
    engagementRate: number;
    engagementChange: number;
    industryAvg: number;
  };

  info: {
    businessType: string;
    contactPerson: string;
    contactRole: string;
    package: string;
    startDate: string;
    endDate: string;
  };

  accounts: AccountAccess[];
  campaigns: Record<CampaignBucket, Campaign[]>;
  calendar: Record<PostBucket, CalendarPost[]>;
  creatives: { delivered: number; pending: number };
  works: WorkCategory[];
  reports: { reach: MetricCard; engagement: MetricCard; leads: MetricCard; conversions: MetricCard };
  last7Days: DailyPoint[];
  monthly: WeeklyPoint[];
  conversations: Conversation[];
  notes: InternalNote[];
  activity: ActivityItem[];
  files: ClientFile[];
  tasks: ClientTask[];
}

/* ============================== HELPERS ============================== */

export const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** 320K, 1.2M — used for reach / impressions */
export const formatMetric = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "")}K` : `${n}`;

export const formatCompact = (n: number) =>
  n >= 100000 ? `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : `${n}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatDate(iso: string, withYear = true) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}
export function formatPeriod(start: string, end: string) {
  const sy = start.slice(0, 4);
  const ey = end.slice(0, 4);
  return sy === ey ? `${formatDate(start, false)} – ${formatDate(end)}` : `${formatDate(start)} – ${formatDate(end)}`;
}

/* ---------- date helpers (local time, ISO yyyy-mm-dd) ---------- */
const pad2 = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const fromISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const todayISO = () => toISO(new Date());
export const addDays = (iso: string, n: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const daysBetween = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
/** "Wed, Jul 29, 2026" */
export const formatLongDate = (iso: string) =>
  fromISO(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
/** "29 Jul" */
export const formatShortDate = (iso: string) => formatDate(iso, false);
/** First and last day of the month `offset` months from `base` */
export function monthRange(offset: number, base: string) {
  const b = fromISO(base);
  const start = new Date(b.getFullYear(), b.getMonth() + offset, 1);
  const end = new Date(b.getFullYear(), b.getMonth() + offset + 1, 0);
  return { start: toISO(start), end: toISO(end) };
}
/** Day `day` of the month `offset` months from `base` */
const dayOfMonth = (offset: number, day: number, base: string) => {
  const b = fromISO(base);
  return toISO(new Date(b.getFullYear(), b.getMonth() + offset, day));
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

export const newId = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/* ============================== DEMO DATA ============================== */

const IMG = (id: string, w = 300) => `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=70`;
const PHOTOS = {
  bride: IMG("1583001931096-959e9a1a6223"),
  model1: IMG("1487412947147-5cebf100ffc2"),
  model2: IMG("1534528741775-53994a69daeb"),
  model3: IMG("1494790108377-be9c29b29330"),
  products: IMG("1522335789203-aabd1fc54bc9"),
  cosmetics: IMG("1512496015851-a90fb38ba796"),
  brushes: IMG("1596462502278-27bfdc403348"),
};
const AVATAR = {
  priyanka: IMG("1494790108377-be9c29b29330", 80),
  rohan: IMG("1507003211169-0a1dd7228f2d", 80),
  sneha: IMG("1438761681033-6461ffad8d80", 80),
  anu: IMG("1534528741775-53994a69daeb", 80),
};

function buildDemoDetails(c: Client, today: string): ClientDetails {
  const M = (o: number) => monthRange(o, today);
  const D = (o: number) => addDays(today, o);
  const slug = c.company.toLowerCase().replace(/[^a-z0-9]/g, "");
  const domain = c.email.split("@")[1] ?? `${slug}.com`;

  return {
    id: c.id,
    name: c.company === "Freelance Client" ? c.clientName : c.company,
    logo: c.avatar,
    status: c.status,
    categories: c.industry ? [c.industry, "Makeup Academy", "Bridal Services"] : ["Beauty", "Makeup Academy", "Bridal Services"],
    location: "Kolkata, West Bengal",
    phone: c.phone,
    email: c.email,
    website: domain.includes("gmail") ? `www.${slug}.com` : `www.${domain}`,

    team: [
      { id: "t1", name: "Priyanka Sharma", role: "Account Manager", avatar: AVATAR.priyanka },
      { id: "t2", name: "Rohan Das", role: "Designer", avatar: AVATAR.rohan },
      { id: "t3", name: "Sneha Paul", role: "Content Writer", avatar: AVATAR.sneha },
      { id: "t4", name: "Ayan", role: "Video Editor", avatar: null },
      { id: "t5", name: "Antora", role: "Ads Specialist", avatar: null },
    ],

    stats: {
      totalCampaigns: 12,
      completed: 5,
      running: 4,
      upcoming: 3,
      totalSpend: 95000,
      spendChange: 12,
      leads: 482,
      leadsChange: 28,
      followersGrowth: 1250,
      followersChange: 18,
      postsPublished: 86,
      staticPosts: 56,
      reels: 30,
      engagementRate: 6.8,
      engagementChange: 2.4,
      industryAvg: 3.2,
    },

    info: {
      businessType: c.industry ?? "Makeup Academy & Bridal Services",
      contactPerson: c.company === "Freelance Client" ? c.clientName : "Priyanka Sharma",
      contactRole: "Admin",
      package: "Gold Package (Social Media + Ads)",
      startDate: M(-9).start,
      endDate: M(2).end,
    },

    accounts: [
      { platform: "facebook", handle: slug, url: `https://facebook.com/${slug}`, connected: true },
      { platform: "instagram", handle: slug, url: `https://instagram.com/${slug}`, connected: true },
      { platform: "gmb", handle: c.company, url: "https://business.google.com", connected: true },
    ],

    campaigns: {
      past: [
        { id: "p1", name: "Puja Glam Leads", category: "Lead Generation | Bridal Bookings", startDate: M(-1).start, endDate: M(-1).end, type: "Lead Generation", platforms: ["facebook", "instagram"], budget: 10000, spent: 9800, goal: "200 Leads", leads: 224, resultUnit: "Leads", resultMetric: "leads", reach: 86000, conversions: 61, ctr: 2.3, resultChange: 14, result: "224 Leads", runBy: "Rohan Das", thumbnail: PHOTOS.model3 },
        { id: "p2", name: "Brand Awareness Push", category: "Brand Awareness | Reach", startDate: M(-2).start, endDate: dayOfMonth(-2, 26, today), type: "Brand Awareness", platforms: ["facebook"], budget: 8000, spent: 8000, goal: "1M Reach", leads: 48, resultUnit: "Leads", resultMetric: "reach", reach: 1200000, conversions: 12, ctr: 1.6, resultChange: 22, result: "1.2M Reach", runBy: "Antora", thumbnail: PHOTOS.cosmetics },
        { id: "p3", name: "Course Enquiry Boost", category: "Course Promotion | Enquiries", startDate: M(-3).start, endDate: M(-3).end, type: "Course Promotion", platforms: ["instagram"], budget: 12000, spent: 11600, goal: "150 Enquiries", leads: 186, resultUnit: "Enquiries", resultMetric: "leads", reach: 74000, conversions: 44, ctr: 2.0, resultChange: 9, result: "186 Enquiries", runBy: "Rohan Das", thumbnail: PHOTOS.model1 },
        { id: "p4", name: "Bridal Booking Season", category: "Lead Generation | Bridal Bookings", startDate: M(-4).start, endDate: M(-4).end, type: "Lead Generation", platforms: ["facebook", "instagram"], budget: 10000, spent: 9500, goal: "80 Bookings", leads: 92, resultUnit: "Bookings", resultMetric: "leads", reach: 52000, conversions: 92, ctr: 1.9, resultChange: 6, result: "92 Bookings", runBy: "Priyanka Sharma", thumbnail: PHOTOS.bride },
        { id: "p5", name: "Academy Open House", category: "Event Promotion | Registrations", startDate: M(-6).start, endDate: dayOfMonth(-6, 20, today), type: "Event Promotion", platforms: ["facebook", "gmb"], budget: 6000, spent: 5700, goal: "60 Registrations", leads: 71, resultUnit: "Leads", resultMetric: "leads", reach: 38000, conversions: 33, ctr: 1.7, resultChange: -4, result: "71 Leads", runBy: "Antora", thumbnail: PHOTOS.brushes },
      ],
      current: [
        { id: "c1", name: "Bridal Booking Campaign", category: "Lead Generation | Bridal Bookings", startDate: M(0).start, endDate: M(0).end, type: "Lead Generation", platforms: ["facebook", "instagram"], budget: 15000, spent: 12450, goal: "150 Leads", leads: 142, resultUnit: "Leads", resultMetric: "leads", reach: 64000, conversions: 41, ctr: 2.1, resultChange: 18, result: "142 Leads", runBy: "Rohan Das", thumbnail: PHOTOS.bride },
        { id: "c2", name: "Makeup Course Promotion", category: "Course Promotion | Enquiries", startDate: dayOfMonth(0, 15, today) > today ? dayOfMonth(-1, 15, today) : dayOfMonth(0, 15, today), endDate: dayOfMonth(0, 15, today) > today ? dayOfMonth(0, 15, today) : dayOfMonth(1, 15, today), type: "Course Promotion", platforms: ["instagram"], budget: 10000, spent: 8200, goal: "100 Enquiries", leads: 76, resultUnit: "Enquiries", resultMetric: "leads", reach: 41000, conversions: 19, ctr: 1.8, resultChange: -12, result: "76 Enquiries", runBy: "Priyanka Sharma", thumbnail: PHOTOS.model1 },
        { id: "c3", name: "Diwali Offer Campaign", category: "Sales Promotion | Course Enrolment", startDate: M(0).start, endDate: M(0).end, type: "Sales / Promotion", platforms: ["facebook"], budget: 8000, spent: 5600, goal: "200 Bookings", leads: 38, resultUnit: "Bookings", resultMetric: "reach", reach: 320000, conversions: 38, ctr: 2.4, resultChange: 24, result: "320K Reach", runBy: "Antora", thumbnail: PHOTOS.products },
        { id: "c4", name: "New Year Campaign", category: "Brand Awareness | Reach & Engagement", startDate: M(0).start, endDate: M(0).end, type: "Brand Awareness", platforms: ["facebook"], budget: 12000, spent: 3200, goal: "Brand Awareness", leads: 38, resultUnit: "Leads", resultMetric: "leads", reach: 118000, conversions: 9, ctr: 2.1, resultChange: 9, result: "38 Leads", runBy: "Sneha Paul", thumbnail: PHOTOS.cosmetics },
      ],
      upcoming: [
        { id: "u1", name: "Diwali Festive Offer", category: "Sales Promotion | Bookings", startDate: M(1).start, endDate: M(1).end, type: "Sales / Promotion", platforms: ["facebook", "instagram"], budget: 12000, spent: 0, goal: "200 Leads", leads: 0, resultUnit: "Leads", resultMetric: "leads", result: "", runBy: "Rohan Das", thumbnail: PHOTOS.products },
        { id: "u2", name: "Bridal Season", category: "Lead Generation | Bridal Bookings", startDate: M(2).start, endDate: M(2).end, type: "Lead Generation", platforms: ["facebook", "instagram"], budget: 18000, spent: 0, goal: "100 Bookings", leads: 0, resultUnit: "Bookings", resultMetric: "leads", result: "", runBy: "Antora", thumbnail: PHOTOS.bride },
        { id: "u3", name: "New Year Glam Launch", category: "Brand Awareness | Reach", startDate: M(3).start, endDate: M(3).end, type: "Brand Awareness", platforms: ["instagram"], budget: 15000, spent: 0, goal: "Brand Awareness", leads: 0, resultUnit: "Leads", resultMetric: "reach", result: "", runBy: "Priyanka Sharma", thumbnail: PHOTOS.model3 },
      ],
    },

    calendar: {
      past: [
        { id: "cp1", title: "Engagement Glam Look", type: "Static", time: "11:00 AM", date: D(-3), status: "Published", image: PHOTOS.model3 },
        { id: "cp2", title: "Behind the Scenes", type: "Reel", time: "06:00 PM", date: D(-3), status: "Published", image: PHOTOS.brushes },
        { id: "cp3", title: "Student Testimonial", type: "Reel", time: "01:00 PM", date: D(-2), status: "Published", image: PHOTOS.model2 },
        { id: "cp4", title: "Product Flat Lay", type: "Static", time: "10:30 AM", date: D(-2), status: "Published", image: PHOTOS.products },
        { id: "cp5", title: "Bridal Transformation", type: "Reel", time: "07:00 PM", date: D(-1), status: "Published", image: PHOTOS.bride },
        { id: "cp6", title: "Party Makeup Tips", type: "Carousel", time: "12:00 PM", date: D(-1), status: "Published", image: PHOTOS.model1 },
        { id: "cp7", title: "Academy Batch Open", type: "Static", time: "09:00 AM", date: D(-1), status: "Published", image: PHOTOS.cosmetics },
      ],
      today: [
        { id: "ct1", title: "Bridal Makeup Look", type: "Static", time: "10:00 AM", date: D(0), status: "Published", image: PHOTOS.bride },
        { id: "ct2", title: "Student Work Reel", type: "Reel", time: "01:00 PM", date: D(0), status: "Scheduled", image: PHOTOS.model2 },
      ],
      upcoming: [
        { id: "cu1", title: "Makeup Course", type: "Static", time: "03:00 PM", date: D(1), status: "Scheduled", image: PHOTOS.cosmetics },
        { id: "cu2", title: "Before After Reel", type: "Reel", time: "05:00 PM", date: D(1), status: "Scheduled", image: PHOTOS.model1 },
        { id: "cu3", title: "Skincare Tips", type: "Static", time: "11:00 AM", date: D(2), status: "Scheduled", image: PHOTOS.model3 },
        { id: "cu4", title: "Diwali Offer Teaser", type: "Reel", time: "07:00 PM", date: D(2), status: "Scheduled", image: PHOTOS.products },
        { id: "cu5", title: "Makeup Course Batch", type: "Carousel", time: "12:00 PM", date: D(3), status: "Draft", image: PHOTOS.brushes },
        { id: "cu6", title: "Bridal Package Offer", type: "Static", time: "10:00 AM", date: D(4), status: "Scheduled", image: PHOTOS.bride },
        { id: "cu7", title: "Client Review Story", type: "Story", time: "08:00 PM", date: D(4), status: "Draft", image: PHOTOS.model2 },
        { id: "cu8", title: "Glam Night Look", type: "Reel", time: "06:00 PM", date: D(5), status: "Scheduled", image: PHOTOS.cosmetics },
      ],
    },

    creatives: { delivered: 80, pending: 40 },

    works: [
      { id: "w1", label: "Social Media Posts", count: 45, image: PHOTOS.model3 },
      { id: "w2", label: "Reels & Videos", count: 22, image: PHOTOS.cosmetics },
      { id: "w3", label: "Ad Creatives", count: 18, image: PHOTOS.products },
      { id: "w4", label: "Banners & Graphics", count: 12, image: PHOTOS.brushes },
      { id: "w5", label: "Stories", count: 28, image: PHOTOS.model1 },
      { id: "w6", label: "Others", count: 10, image: PHOTOS.bride },
    ],

    reports: {
      reach: { label: "Reach", value: 125000, change: 18, series: [42, 48, 45, 60, 58, 70, 66, 78, 74, 88, 92, 100] },
      engagement: { label: "Engagement", value: 8420, change: 26, series: [30, 34, 40, 38, 52, 48, 60, 64, 58, 72, 80, 86] },
      leads: { label: "Leads", value: 182, change: 32, series: [20, 26, 24, 36, 34, 44, 40, 52, 58, 56, 66, 74] },
      conversions: { label: "Conversions", value: 46, change: 20, series: [10, 12, 18, 16, 22, 20, 28, 26, 34, 32, 40, 44] },
    },

    last7Days: [
      { label: "5 Sep", views: 9200, engagement: 5400, leads: 3100 },
      { label: "6 Sep", views: 6800, engagement: 4200, leads: 2400 },
      { label: "7 Sep", views: 11800, engagement: 7400, leads: 3600 },
      { label: "8 Sep", views: 8600, engagement: 12400, leads: 4200 },
      { label: "9 Sep", views: 13600, engagement: 6800, leads: 5200 },
      { label: "10 Sep", views: 10400, engagement: 8800, leads: 3800 },
      { label: "11 Sep", views: 14600, engagement: 9600, leads: 6200 },
    ],

    monthly: [
      { label: "Week 1", reach: 62000, engagement: 38000, leads: 22000 },
      { label: "Week 2", reach: 84000, engagement: 52000, leads: 31000 },
      { label: "Week 3", reach: 96000, engagement: 70000, leads: 42000 },
      { label: "Week 4", reach: 128000, engagement: 94000, leads: 56000 },
    ],

    conversations: [
      { id: "m1", name: "Priyanka Sharma", avatar: AVATAR.priyanka, time: "Today, 11:20 AM", message: "Can we run a reel campaign for our new course? Please share the plan.", tag: "Client" },
      { id: "m2", name: "Rohan Das", avatar: AVATAR.rohan, time: "Today, 10:45 AM", message: "Created 3 new ad creatives for Diwali campaign. Shared with client for approval.", tag: "Internal" },
      { id: "m3", name: "Priyanka Sharma", avatar: AVATAR.priyanka, time: "Yesterday, 06:30 PM", message: "Loved the bridal reel! Can we boost it this weekend?", tag: "Client" },
    ],

    notes: [
      { id: "n1", author: "Rohan Das", avatar: AVATAR.rohan, time: "Today, 10:45 AM", text: "Created 3 new ad creatives for Diwali campaign. Shared with client for approval.", tag: "Internal" },
      { id: "n2", author: "Priyanka Sharma", avatar: AVATAR.priyanka, time: "Yesterday, 04:10 PM", text: "Client wants a softer colour palette for the academy posts.", tag: "Internal" },
    ],

    activity: [
      { id: "a1", time: "Today, 11:30 AM", text: "Client asked for Diwali campaign plan.", color: "#22c55e" },
      { id: "a2", time: "Today, 10:45 AM", text: "3 ad creatives shared for approval.", color: "#8b5cf6" },
      { id: "a3", time: "Yesterday, 04:30 PM", text: "September performance report sent to client.", color: "#ef4444" },
      { id: "a4", time: "Today, 10:00 AM", text: "Content calendar updated for next week.", color: "#f59e0b" },
      { id: "a5", time: "09 Sep, 05:20 PM", text: "Campaign budget revised.", color: "#3b82f6" },
    ],

    files: [
      { id: "f1", name: "Brand Guidelines.pdf", type: "PDF", size: "2.4 MB", uploadedBy: "Priyanka Sharma", date: D(-28) },
      { id: "f2", name: "Diwali Creatives.zip", type: "ZIP", size: "18.6 MB", uploadedBy: "Rohan Das", date: D(-2) },
      { id: "f3", name: "September Report.pdf", type: "PDF", size: "1.1 MB", uploadedBy: "Antora", date: D(-1) },
      { id: "f4", name: "Logo Pack.png", type: "PNG", size: "640 KB", uploadedBy: "Rohan Das", date: D(-270) },
      { id: "f5", name: "Content Calendar Oct.xlsx", type: "XLSX", size: "84 KB", uploadedBy: "Sneha Paul", date: D(-4) },
    ],

    tasks: [
      { id: "k1", title: "Share Diwali campaign plan with client", assignee: "Priyanka Sharma", due: D(1), done: false },
      { id: "k2", title: "Finalise 3 Diwali ad creatives", assignee: "Rohan Das", due: D(0), done: true },
      { id: "k3", title: "Schedule October content calendar", assignee: "Sneha Paul", due: D(2), done: false },
      { id: "k4", title: "Set up Diwali lead form on Meta", assignee: "Antora", due: D(3), done: false },
    ],
  };
}

/* ============================== DATA ACCESS ============================== */

/**
 * Fetch one client's full details.
 * TODO (API): replace the body with e.g.
 *   const res = await fetch(`/api/clients/${id}`); if (!res.ok) return null; return res.json();
 */
export async function fetchClientDetails(id: string): Promise<ClientDetails | null> {
  const client = INITIAL_CLIENTS.find((c) => c.id === id);
  if (!client) return null;
  await new Promise((r) => setTimeout(r, 250)); // simulate network
  return buildDemoDetails(client, todayISO());
}

/* ============================== "DATA AS OF A DATE" ============================== */

/** Small deterministic random generator so demo numbers stay stable for the same date */
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

const uniqById = <T extends { id: string }>(list: T[]) => list.filter((x, i) => list.findIndex((y) => y.id === x.id) === i);

/**
 * Returns the client's data as it looked on `date`.
 * - Campaigns & posts are re-grouped into past / current(today) / upcoming relative to `date` (real logic).
 * - Totals like spend are recalculated from campaigns that had started by `date`.
 * - Cumulative metrics (leads, followers, posts, reach…) are scaled by how far into the contract `date` is,
 *   and days after the real "today" show no data yet.
 *
 * TODO (API): when you have a backend, request `/api/clients/:id?date=YYYY-MM-DD` instead and return that.
 */
export function viewAsOf(d: ClientDetails, date: string, today: string): ClientDetails {
  const effective = date > today ? today : date;
  const start = d.info.startDate;
  const span = Math.max(1, daysBetween(start, today));
  const factor = date < start ? 0 : Math.min(1, Math.max(0, daysBetween(start, effective) / span));
  const sc = (n: number) => Math.round(n * factor);

  // Each campaign's spend/results accrue evenly over its running days up to the real today.
  // Viewing an earlier date shows only what had accrued by then.
  const allCampaigns = uniqById([...d.campaigns.past, ...d.campaigns.current, ...d.campaigns.upcoming]).map((c) => {
    if (c.startDate > today) return c; // not started yet — nothing to prorate
    const minISO = (...xs: string[]) => xs.reduce((a, b) => (a < b ? a : b));
    const full = daysBetween(c.startDate, minISO(c.endDate, today)) + 1; // days run up to the real today
    const part = date < c.startDate ? 0 : daysBetween(c.startDate, minISO(c.endDate, today, date)) + 1; // days run by `date`
    const f = full > 0 ? Math.min(1, part / full) : 0;
    if (f >= 1) return c;
    const r = (n?: number) => (n === undefined ? undefined : Math.round(n * f));
    return {
      ...c,
      spent: r(c.spent),
      leads: r(c.leads),
      results: r(c.results),
      reach: r(c.reach),
      impressions: r(c.impressions),
      clicks: r(c.clicks),
      conversions: r(c.conversions),
    };
  });
  const campaigns: Record<CampaignBucket, Campaign[]> = {
    past: allCampaigns.filter((c) => c.endDate < date).sort((a, b) => b.endDate.localeCompare(a.endDate)),
    current: allCampaigns.filter((c) => c.startDate <= date && c.endDate >= date).sort((a, b) => a.startDate.localeCompare(b.startDate)),
    upcoming: allCampaigns.filter((c) => c.startDate > date).sort((a, b) => a.startDate.localeCompare(b.startDate)),
  };

  const timeKey = (t: string) => {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
  };
  const byDateTime = (a: CalendarPost, b: CalendarPost) => a.date.localeCompare(b.date) || timeKey(a.time) - timeKey(b.time);
  const allPosts = uniqById([...d.calendar.past, ...d.calendar.today, ...d.calendar.upcoming]);
  const calendar: Record<PostBucket, CalendarPost[]> = {
    past: allPosts.filter((p) => p.date < date).sort(byDateTime).reverse(),
    today: allPosts.filter((p) => p.date === date).sort(byDateTime),
    upcoming: allPosts.filter((p) => p.date > date).sort(byDateTime),
  };

  const totalSpend = allCampaigns.filter((c) => c.startDate <= date).reduce((sum, c) => sum + (c.spent ?? c.budget), 0);
  const posts = sc(d.stats.postsPublished);
  const statics = sc(d.stats.staticPosts);

  const rand = seeded(date);
  const last7Days = d.last7Days.map((p, i) => {
    const day = addDays(date, i - 6);
    const v = day > today || day < start ? 0 : 0.75 + rand() * 0.5;
    return { label: formatShortDate(day), views: Math.round(p.views * v), engagement: Math.round(p.engagement * v), leads: Math.round(p.leads * v) };
  });

  const scaleMetric = (m: MetricCard): MetricCard => ({ ...m, value: sc(m.value) });

  return {
    ...d,
    campaigns,
    calendar,
    stats: {
      ...d.stats,
      totalCampaigns: allCampaigns.length,
      completed: campaigns.past.length,
      running: campaigns.current.length,
      upcoming: campaigns.upcoming.length,
      totalSpend,
      leads: sc(d.stats.leads),
      followersGrowth: sc(d.stats.followersGrowth),
      postsPublished: posts,
      staticPosts: statics,
      reels: posts - statics,
    },
    creatives: { delivered: sc(d.creatives.delivered), pending: d.creatives.pending },
    reports: {
      reach: scaleMetric(d.reports.reach),
      engagement: scaleMetric(d.reports.engagement),
      leads: scaleMetric(d.reports.leads),
      conversions: scaleMetric(d.reports.conversions),
    },
    last7Days,
  };
}

/* ============================== CAMPAIGN HELPERS ============================== */

/** Status shown in the UI — derived from the dates (and the paused flag) relative to `date` */
export function campaignStatus(c: Campaign, date: string): CampaignStatus {
  if (c.statusOverride === "Draft") return "Draft";
  if (c.statusOverride === "Completed" || c.endDate < date) return "Completed";
  if (c.startDate > date) return "Scheduled";
  return c.statusOverride === "Paused" || c.paused ? "Paused" : "Active";
}

/** Results count used for "Result" and cost per result */
export const campaignResults = (c: Campaign) => c.results ?? c.leads ?? 0;

/** Result text, e.g. "142 Leads" or "320K Reach" */
export function campaignResult(c: Campaign): string {
  if (c.resultMetric === "reach" && c.reach) return `${formatMetric(c.reach)} Reach`;
  const n = c.results ?? c.leads;
  if (n !== undefined && c.resultUnit) return n ? `${n.toLocaleString("en-IN")} ${c.resultUnit}` : "—";
  return c.result || "—";
}

export const campaignCPL = (c: Campaign) => (c.leads && c.spent ? Math.round(c.spent / c.leads) : null);
export const campaignSpentPct = (c: Campaign) => (c.budget ? Math.min(100, Math.round(((c.spent ?? 0) / c.budget) * 100)) : 0);

/** "10 days left", "Starts in 5 days", "Ended" */
export function campaignTimeLeft(c: Campaign, date: string) {
  if (c.endDate < date) return "Ended";
  if (c.startDate > date) {
    const n = daysBetween(date, c.startDate);
    return `Starts in ${n} day${n === 1 ? "" : "s"}`;
  }
  const n = daysBetween(date, c.endDate);
  return n === 0 ? "Ends today" : `${n} day${n === 1 ? "" : "s"} left`;
}

/** Results per ₹ — used to rank "Top Performing Campaigns" */
export function campaignScore(c: Campaign) {
  if (!c.spent) return 0;
  return ((c.leads ?? 0) * 100 + (c.reach ?? 0) / 50) / c.spent;
}

export interface TrendPoint {
  label: string;
  spend: number;
  reach: number;
  leads: number;
  conversions: number;
}

/** Month-by-month totals for the `months` months ending at `date`'s month (campaign values spread over their run days) */
export function campaignTrend(campaigns: Campaign[], date: string, months: number): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const { start: ms, end: me } = monthRange(-i, date);
    const point: TrendPoint = { label: fromISO(ms).toLocaleDateString("en-US", { month: "short" }), spend: 0, reach: 0, leads: 0, conversions: 0 };
    campaigns.forEach((c) => {
      if (c.startDate > date || !c.spent) return;
      const runEnd = c.endDate < date ? c.endDate : date;
      const runDays = daysBetween(c.startDate, runEnd) + 1;
      const oStart = c.startDate > ms ? c.startDate : ms;
      const oEnd = runEnd < me ? runEnd : me;
      const overlap = oEnd >= oStart ? daysBetween(oStart, oEnd) + 1 : 0;
      if (!overlap || runDays <= 0) return;
      const share = overlap / runDays;
      point.spend += (c.spent ?? 0) * share;
      point.reach += (c.reach ?? 0) * share;
      point.leads += (c.leads ?? 0) * share;
      point.conversions += (c.conversions ?? Math.round((c.leads ?? 0) * 0.3)) * share;
    });
    out.push({ ...point, spend: Math.round(point.spend), reach: Math.round(point.reach), leads: Math.round(point.leads), conversions: Math.round(point.conversions) });
  }
  return out;
}

/** Weekly numbers for one month ("YYYY-MM"). Weeks that haven't happened yet show 0. */
export function monthlyFor(d: ClientDetails, monthKey: string, today: string): WeeklyPoint[] {
  const rand = seeded(monthKey);
  return d.monthly.map((w, i) => {
    const weekStart = `${monthKey}-${String(i * 7 + 1).padStart(2, "0")}`;
    const v = weekStart > today ? 0 : 0.8 + rand() * 0.4;
    return { ...w, reach: Math.round(w.reach * v), engagement: Math.round(w.engagement * v), leads: Math.round(w.leads * v) };
  });
}

/** Team members that can be assigned (used by "Manage" team). */
export const ASSIGNABLE_TEAM: TeamMember[] = [
  { id: "t1", name: "Priyanka Sharma", role: "Account Manager", avatar: AVATAR.priyanka },
  { id: "t2", name: "Rohan Das", role: "Designer", avatar: AVATAR.rohan },
  { id: "t3", name: "Sneha Paul", role: "Content Writer", avatar: AVATAR.sneha },
  { id: "t4", name: "Ayan", role: "Video Editor", avatar: null },
  { id: "t5", name: "Antora", role: "Ads Specialist", avatar: null },
  { id: "t6", name: "Baban Mondal", role: "Photographer", avatar: null },
  { id: "t7", name: "Bidyut Kayal", role: "SEO Specialist", avatar: null },
  { id: "t8", name: "Indrajit Sarkar", role: "Developer", avatar: null },
  { id: "t9", name: "Sarfaraz Ali", role: "Graphic Designer", avatar: null },
];
