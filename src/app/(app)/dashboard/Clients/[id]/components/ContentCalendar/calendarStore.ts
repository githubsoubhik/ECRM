"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCalendar/calendarStore.ts
// Shared storage for the Content Calendar.
// Other tabs (e.g. Content Creatives → "Save & Add to Calendar") use
// upsertCalendarPost() so the calendar updates instantly.
// Swap these functions for your API later.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { initialContentPosts, type ContentPost } from "../../../../../../data/contentCalendarData";

export const calendarPostsKey = (clientId: string) => `pavion-cc-posts-${clientId}`;
export const calendarIdeasKey = (clientId: string) => `pavion-cc-ideas-${clientId}`;

/* ── localStorage-backed state ────────────────────────────────
   Built on useSyncExternalStore: no setState inside effects and
   no hydration mismatch (server renders the initial data, the
   browser then switches to the saved data). If storage is full or
   blocked, the latest value is still kept in memory. */
const memoryStore = new Map<string, string>();
const storeListeners = new Set<() => void>();

function readRaw(key: string): string | null {
  const mem = memoryStore.get(key);
  if (mem !== undefined) return mem;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribeStore(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key) memoryStore.delete(e.key); // another tab changed it
    cb();
  };
  storeListeners.add(cb);
  window.addEventListener("storage", onStorage);
  return () => {
    storeListeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function parseOr<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribeStore,
    () => readRaw(key),
    () => null,
  );
  const value = useMemo(() => parseOr(raw, initial), [raw, initial]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parseOr(readRaw(key), initial);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeRaw(key, JSON.stringify(resolved));
    },
    [key, initial],
  );

  return [value, setValue] as const;
}

function writeRaw(key: string, text: string) {
  memoryStore.set(key, text);
  try {
    window.localStorage.setItem(key, text);
  } catch {
    /* quota exceeded – kept in memory only */
  }
  storeListeners.forEach((l) => l());
}

/** Add or replace a post in a client's calendar (works even if the calendar tab is closed) */
export function upsertCalendarPost(clientId: string, post: ContentPost) {
  const key = calendarPostsKey(clientId);
  const prev = parseOr<ContentPost[]>(readRaw(key), initialContentPosts);
  const exists = prev.some((p) => p.id === post.id);
  const next = exists ? prev.map((p) => (p.id === post.id ? post : p)) : [...prev, post];
  writeRaw(key, JSON.stringify(next));
}
