// src/app/data/announcementFiles.ts
// Saving announcement files (attachments + cover image).
//
// 1. The file is uploaded to the server: POST /api/announcements/files
//    (src/app/api/announcements/files/route.ts) → saved in <project>/announcement-files.
// 2. If the server upload fails (API missing, blocked by a login middleware, disk error…)
//    the file is kept in this browser instead (IndexedDB), so attaching still works.
//    Those files get a "local:<id>" url and open only in the same browser — the same as the
//    announcements themselves, which are saved in this browser (localStorage) for now.

import { FILE_API, type AttachmentMeta } from "./announcementData";

export const LOCAL_PREFIX = "local:";
export const isLocalUrl = (url?: string) => !!url && url.startsWith(LOCAL_PREFIX);

/* ---------------- Browser storage (IndexedDB) ---------------- */

const DB_NAME = "pavion-announcement-files";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("This browser can't store files."));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Couldn't open browser storage."));
  });
}

async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Browser storage error."));
    tx.oncomplete = () => db.close();
  });
}

export async function saveInBrowser(file: File): Promise<AttachmentMeta> {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await idb("readwrite", (s) => s.put(file, id));
  return { id, name: file.name, size: file.size, type: file.type || "application/octet-stream", url: `${LOCAL_PREFIX}${id}` };
}

const objectUrls = new Map<string, string>();

/** Turns a stored url into something <img>/<a> can use. null = the file isn't available here. */
export async function resolveFileUrl(url: string): Promise<string | null> {
  if (!isLocalUrl(url)) return url;
  const cached = objectUrls.get(url);
  if (cached) return cached;
  try {
    const blob = await idb<Blob | undefined>("readonly", (s) => s.get(url.slice(LOCAL_PREFIX.length)) as IDBRequest<Blob | undefined>);
    if (!blob) return null;
    const obj = URL.createObjectURL(blob);
    objectUrls.set(url, obj);
    return obj;
  } catch {
    return null;
  }
}

/* ---------------- Upload ---------------- */

export interface UploadResult {
  file: AttachmentMeta;
  /** Set when the server upload failed and the file was kept in this browser instead. */
  warning?: string;
}

/**
 * Uploads a file. Problems with the file itself (wrong type, too big) are thrown as errors;
 * problems with the server fall back to browser storage and return a warning.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  let serverProblem: string;
  try {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(FILE_API, { method: "POST", body });
    const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
    const data = (isJson ? await res.json().catch(() => ({})) : {}) as Partial<AttachmentMeta> & { error?: string };
    if (res.ok && data.url && data.id) {
      return { file: { id: data.id, name: data.name ?? file.name, size: data.size ?? file.size, type: data.type ?? file.type, url: data.url } };
    }
    if (isJson && [400, 413, 415].includes(res.status)) throw new FileRejected(data.error || "This file can't be uploaded.");
    serverProblem = !isJson
      ? res.redirected
        ? "the upload was redirected (a login middleware may be blocking /api/announcements/files)"
        : `the upload API wasn't found (HTTP ${res.status}) — check src/app/api/announcements/files/route.ts`
      : data.error || `server error (HTTP ${res.status})`;
  } catch (e) {
    if (e instanceof FileRejected) throw e;
    serverProblem = "the server couldn't be reached";
  }
  try {
    return { file: await saveInBrowser(file), warning: `Server upload failed: ${serverProblem}. Saved in this browser instead.` };
  } catch {
    throw new Error(`Upload failed: ${serverProblem}.`);
  }
}

class FileRejected extends Error {}
