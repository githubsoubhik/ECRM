// ═════════════════════════════════════════════════════════════
// Content Creatives – DATA SOURCE
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/creativesApi.ts
//
// ★ THIS IS THE ONLY FILE YOU CHANGE TO USE REAL DATA ★
//
// The page calls these functions and nothing else:
//   fetchCreatives · createCreative · updateCreative · bulkUpdateCreatives
//   deleteCreatives · saveFolders · uploadMedia
//
// Today (DATA_SOURCE = "demo") they use demo data and save to the browser.
// To switch to your backend:
//   1. Set DATA_SOURCE = "api"
//   2. Make your API return / accept the shapes in contentCreativesData.ts
//      (or adjust normalizeCreative() below to map your field names)
//   3. Optional: set CREATIVES_POLL_MS (e.g. 30000) for auto-refresh,
//      or call reload() from a WebSocket / Supabase / Firebase listener.
//
// Excel / CSV / Google Sheets: see rowToCreative() and csvToCreatives().
// ═════════════════════════════════════════════════════════════

import {
  DEMO_FOLDERS,
  STORAGE_LIMIT_MB,
  buildDemoCreatives,
  newCreativeId,
  type Creative,
  type CreativeFolder,
  type CreativeMedia,
  type CreativeStatus,
  type ContentBrief,
  type CreativeType,
  type CreativesPayload,
  type Platform,
} from "../../../../../../data/contentCreativesData";
import { readFilesAsMedia } from "../ContentCalendar/ccUi";

/* ── Settings ─────────────────────────────────────────────── */

export const DATA_SOURCE: "demo" | "api" = "demo";
/** Base URL of your backend, e.g. "/api/clients" or "https://api.pavion.in/clients" */
export const API_BASE = "/api/clients";
/** Auto-refresh interval in ms (0 = off). Use this for near real-time data. */
export const CREATIVES_POLL_MS = 0;
/** Biggest file a user can upload (MB) */
export const MAX_UPLOAD_MB = 50;

/* ── Demo storage (browser) ───────────────────────────────── */

const memory = new Map<string, CreativesPayload>();
const storageKey = (clientId: string) => `pavion-creatives-${clientId}`;

function demoPayload(): CreativesPayload {
  return { creatives: buildDemoCreatives(), folders: DEMO_FOLDERS.map((f) => ({ ...f })), storageLimitMB: STORAGE_LIMIT_MB };
}

function readLocal(clientId: string): CreativesPayload {
  const cached = memory.get(clientId);
  if (cached) return cached;
  let payload: CreativesPayload | null = null;
  try {
    const raw = window.localStorage.getItem(storageKey(clientId));
    if (raw) payload = normalizePayload(JSON.parse(raw));
  } catch {
    /* blocked or corrupt storage – fall back to demo */
  }
  const result = payload ?? demoPayload();
  memory.set(clientId, result);
  return result;
}

function writeLocal(clientId: string, payload: CreativesPayload) {
  memory.set(clientId, payload);
  try {
    window.localStorage.setItem(storageKey(clientId), JSON.stringify(payload));
  } catch {
    /* quota exceeded (large videos) – kept in memory for this visit */
  }
}

function mutateLocal(clientId: string, fn: (p: CreativesPayload) => CreativesPayload) {
  const next = fn(readLocal(clientId));
  writeLocal(clientId, next);
  return next;
}

/** Simulates network delay so loading states are visible in demo mode */
const tick = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/* ── HTTP helper (api mode) ───────────────────────────────── */

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} failed (${res.status})`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/* ── Public API used by the page ──────────────────────────── */

/** GET all creatives + folders for one client */
export async function fetchCreatives(clientId: string): Promise<CreativesPayload> {
  if (DATA_SOURCE === "api") {
    return normalizePayload(await http<unknown>(`${API_BASE}/${clientId}/creatives`));
  }
  await tick();
  return readLocal(clientId);
}

/** POST a new creative */
export async function createCreative(clientId: string, creative: Creative): Promise<Creative> {
  if (DATA_SOURCE === "api") {
    return normalizeCreative(await http<unknown>(`${API_BASE}/${clientId}/creatives`, { method: "POST", body: JSON.stringify(creative) }));
  }
  mutateLocal(clientId, (p) => ({ ...p, creatives: [creative, ...p.creatives] }));
  return creative;
}

/** PUT one creative */
export async function updateCreative(clientId: string, creative: Creative): Promise<Creative> {
  if (DATA_SOURCE === "api") {
    return normalizeCreative(
      await http<unknown>(`${API_BASE}/${clientId}/creatives/${creative.id}`, { method: "PUT", body: JSON.stringify(creative) }),
    );
  }
  mutateLocal(clientId, (p) => ({ ...p, creatives: p.creatives.map((c) => (c.id === creative.id ? creative : c)) }));
  return creative;
}

/** PATCH many creatives at once (move to folder, change status…) */
export async function bulkUpdateCreatives(clientId: string, list: Creative[]): Promise<void> {
  if (!list.length) return;
  if (DATA_SOURCE === "api") {
    await http(`${API_BASE}/${clientId}/creatives`, { method: "PATCH", body: JSON.stringify(list) });
    return;
  }
  const byId = new Map(list.map((c) => [c.id, c]));
  mutateLocal(clientId, (p) => ({ ...p, creatives: p.creatives.map((c) => byId.get(c.id) ?? c) }));
}

/** DELETE creatives */
export async function deleteCreatives(clientId: string, ids: string[]): Promise<void> {
  if (DATA_SOURCE === "api") {
    await http(`${API_BASE}/${clientId}/creatives`, { method: "DELETE", body: JSON.stringify({ ids }) });
    return;
  }
  mutateLocal(clientId, (p) => ({ ...p, creatives: p.creatives.filter((c) => !ids.includes(c.id)) }));
}

/** PUT the full folder list */
export async function saveFolders(clientId: string, folders: CreativeFolder[]): Promise<void> {
  if (DATA_SOURCE === "api") {
    await http(`${API_BASE}/${clientId}/creative-folders`, { method: "PUT", body: JSON.stringify(folders) });
    return;
  }
  mutateLocal(clientId, (p) => ({ ...p, folders }));
}

/**
 * Upload files and get back URLs.
 * Demo: files are kept in the browser as data URLs.
 * API:  POST multipart/form-data → your storage (S3, Cloudinary, Firebase…) → [{ url, kind, name }]
 */
export async function uploadMedia(clientId: string, files: File[]): Promise<{ media: CreativeMedia[]; totalMB: number; rejected: string[] }> {
  const totalMB = files.reduce((a, f) => a + f.size, 0) / (1024 * 1024);
  if (DATA_SOURCE === "api") {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await fetch(`${API_BASE}/${clientId}/creatives/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const media = ((await res.json()) as unknown[]).map(normalizeMedia);
    return { media, totalMB, rejected: [] };
  }
  const { media, rejected } = await readFilesAsMedia(files);
  return { media, totalMB, rejected };
}

/* ── Mapping helpers (adjust these to your field names) ───── */

const str = (v: unknown, d = "") => (v === undefined || v === null ? d : String(v));
const TYPES: CreativeType[] = ["Image", "Video", "Carousel", "Story", "Collection", "Other"];
const STATUSES: CreativeStatus[] = ["Published", "Scheduled", "In Review", "Draft"];
const PLATFORMS: Platform[] = ["Instagram", "Facebook", "Meta", "Other"];

const pick = <T extends string>(value: unknown, list: T[], fallback: T): T => {
  const v = str(value).trim().toLowerCase();
  return list.find((x) => x.toLowerCase() === v) ?? (v.startsWith("reel") && list.includes("Video" as T) ? ("Video" as T) : fallback);
};

function normalizeMedia(raw: unknown): CreativeMedia {
  const r = (raw ?? {}) as Record<string, unknown>;
  const url = str(r.url ?? r.src ?? r.link);
  const kind = str(r.kind ?? r.type) === "video" || /\.(mp4|mov|webm)(\?|$)/i.test(url) ? "video" : "image";
  return { url, kind, name: r.name ? str(r.name) : undefined };
}

/** Turns any object (API JSON, sheet row…) into a safe Creative */
export function normalizeCreative(raw: unknown): Creative {
  const r = (raw ?? {}) as Record<string, unknown>;
  const media = Array.isArray(r.media) ? r.media.map(normalizeMedia) : [];
  const platformsRaw = Array.isArray(r.platforms) ? r.platforms : str(r.platforms ?? r.platform).split(/[,|]/);
  const platforms = platformsRaw.map((p) => pick(p, PLATFORMS, "Other")).filter((p, i, a) => a.indexOf(p) === i);
  const tags = Array.isArray(r.tags) ? r.tags.map((t) => str(t)) : str(r.tags).split(/[,|]/).map((t) => t.trim()).filter(Boolean);
  const thumbnail = str(r.thumbnail ?? r.thumbnailUrl ?? r.image ?? media[0]?.url);
  return {
    id: str(r.id ?? r._id, newCreativeId()),
    title: str(r.title ?? r.name, "Untitled"),
    type: pick(r.type, TYPES, "Image"),
    platforms: platforms.length ? platforms : ["Instagram"],
    status: pick(r.status, STATUSES, "Draft"),
    date: str(r.date ?? r.postDate).slice(0, 10),
    time: str(r.time ?? r.postTime, "10:00").slice(0, 5),
    folderId: r.folderId ? str(r.folderId) : null,
    campaign: r.campaign ? str(r.campaign) : null,
    caption: str(r.caption),
    tags,
    thumbnail,
    media: media.length ? media : thumbnail ? [{ url: thumbnail, kind: "image" }] : [],
    durationSec: r.durationSec !== undefined || r.duration !== undefined ? Number(r.durationSec ?? r.duration) || undefined : undefined,
    sizeMB: Number(r.sizeMB ?? r.size ?? 0) || 0,
    createdBy: str(r.createdBy ?? r.owner, "Team"),
    createdAt: str(r.createdAt ?? r.date).slice(0, 10),
    brief: r.brief ? normalizeBrief(r.brief) : undefined,
  };
}

/** Content request / design brief (see ContentBrief in contentCreativesData.ts) */
export function normalizeBrief(raw: unknown): ContentBrief {
  const b = (raw ?? {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x)) : str(v).split(/[,|]/).map((x) => x.trim()).filter(Boolean));
  const priority = str(b.priority, "Normal");
  return {
    purpose: str(b.purpose ?? b.goal),
    tone: str(b.tone ?? b.style),
    colors: list(b.colors ?? b.colours),
    language: str(b.language, "English"),
    references: Array.isArray(b.references) ? b.references.map(normalizeMedia) : [],
    channels: list(b.channels),
    priority: (["Low", "Normal", "High"].includes(priority) ? priority : "Normal") as ContentBrief["priority"],
    assignee: str(b.assignee ?? b.assignTo),
    deadlineDate: str(b.deadlineDate ?? b.deadline).slice(0, 10),
    deadlineTime: str(b.deadlineTime, "18:00").slice(0, 5),
    notes: str(b.notes),
    autoCalendar: b.autoCalendar === undefined ? true : !!b.autoCalendar,
    calendarPostId: b.calendarPostId ? str(b.calendarPostId) : null,
  };
}

export function normalizePayload(raw: unknown): CreativesPayload {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(raw) ? raw : Array.isArray(r.creatives) ? r.creatives : [];
  const folders = Array.isArray(r.folders)
    ? r.folders.map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        return { id: str(o.id, newCreativeId()), name: str(o.name, "Folder"), color: str(o.color, "#3b82f6") };
      })
    : [];
  return {
    creatives: list.map(normalizeCreative),
    folders,
    storageLimitMB: Number(r.storageLimitMB) || STORAGE_LIMIT_MB,
  };
}

/**
 * EXCEL / GOOGLE SHEETS / CSV ROW → Creative
 * Expected column headers (any case):
 *   Title | Type | Platforms | Status | Date | Time | Folder | Campaign | Caption | Tags |
 *   Thumbnail | Video URL | Duration | Size MB | Created By
 *
 * Excel example (npm i xlsx):
 *   import * as XLSX from "xlsx";
 *   const wb = XLSX.read(await file.arrayBuffer());
 *   const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);
 *   const creatives = rows.map((row) => rowToCreative(row, folders));
 */
export function rowToCreative(row: Record<string, unknown>, folders: CreativeFolder[]): Creative {
  const get = (...keys: string[]) => {
    const found = Object.keys(row).find((k) => keys.includes(k.trim().toLowerCase()));
    return found ? row[found] : undefined;
  };
  const folderName = str(get("folder", "category")).trim().toLowerCase();
  const video = str(get("video url", "video", "videourl"));
  const thumb = str(get("thumbnail", "thumbnail url", "image", "image url"));
  return normalizeCreative({
    title: get("title", "name"),
    type: get("type", "content type"),
    platforms: get("platforms", "platform"),
    status: get("status"),
    date: get("date", "post date"),
    time: get("time", "post time"),
    folderId: folders.find((f) => f.name.toLowerCase() === folderName)?.id ?? null,
    campaign: get("campaign"),
    caption: get("caption"),
    tags: get("tags"),
    thumbnail: thumb,
    media: video ? [{ url: video, kind: "video" }] : thumb ? [{ url: thumb, kind: "image" }] : [],
    duration: get("duration", "duration (sec)"),
    sizeMB: get("size mb", "size"),
    createdBy: get("created by", "owner"),
  });
}

/** Minimal CSV parser (handles quotes, commas and new lines inside quotes) */
export function parseCsv(text: string): Record<string, string>[] {
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
  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

export const csvToCreatives = (text: string, folders: CreativeFolder[]) => parseCsv(text).map((row) => rowToCreative(row, folders));
