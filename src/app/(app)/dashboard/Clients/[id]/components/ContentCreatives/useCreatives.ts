"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/useCreatives.ts
// Loads creatives from the data source and keeps the screen in sync.
// Every change is shown instantly (optimistic) and rolled back if the save fails.

import { useCallback, useEffect, useState } from "react";
import { STORAGE_LIMIT_MB, type Creative, type CreativeFolder, type CreativesPayload } from "../../../../../../data/contentCreativesData";
import * as api from "./creativesApi";

type Status = "loading" | "ready" | "error";
interface State {
  status: Status;
  data: CreativesPayload;
  error: string | null;
}

const EMPTY: CreativesPayload = { creatives: [], folders: [], storageLimitMB: STORAGE_LIMIT_MB };

export function useCreatives(clientId: string, onError?: (message: string) => void) {
  const [state, setState] = useState<State>({ status: "loading", data: EMPTY, error: null });

  /* initial load + whenever the client changes */
  useEffect(() => {
    let alive = true;
    api
      .fetchCreatives(clientId)
      .then((data) => alive && setState({ status: "ready", data, error: null }))
      .catch((e: Error) => alive && setState((s) => ({ ...s, status: "error", error: e.message })));
    return () => {
      alive = false;
    };
  }, [clientId]);

  const reload = useCallback(
    () =>
      api
        .fetchCreatives(clientId)
        .then((data) => setState({ status: "ready", data, error: null }))
        .catch((e: Error) => setState((s) => ({ ...s, status: "error", error: e.message }))),
    [clientId],
  );

  /* optional auto-refresh (set CREATIVES_POLL_MS in creativesApi.ts) */
  useEffect(() => {
    if (!api.CREATIVES_POLL_MS) return;
    const t = window.setInterval(() => {
      api
        .fetchCreatives(clientId)
        .then((data) => setState((s) => ({ ...s, status: "ready", data })))
        .catch(() => undefined);
    }, api.CREATIVES_POLL_MS);
    return () => window.clearInterval(t);
  }, [clientId]);

  /** Apply a change on screen now, save in the background, undo on failure */
  const run = useCallback(
    (apply: (p: CreativesPayload) => CreativesPayload, save: () => Promise<unknown>) => {
      let before: CreativesPayload | null = null;
      setState((s) => {
        before = s.data;
        return { ...s, data: apply(s.data) };
      });
      save().catch((e: Error) => {
        const prev = before;
        if (prev) setState((s) => ({ ...s, data: prev }));
        onError?.(e.message || "Could not save changes");
      });
    },
    [onError],
  );

  const actions = {
    add: (c: Creative) => run((p) => ({ ...p, creatives: [c, ...p.creatives] }), () => api.createCreative(clientId, c)),

    addMany: (list: Creative[]) =>
      run(
        (p) => ({ ...p, creatives: [...list, ...p.creatives] }),
        () => Promise.all(list.map((c) => api.createCreative(clientId, c))),
      ),

    update: (c: Creative) =>
      run((p) => ({ ...p, creatives: p.creatives.map((x) => (x.id === c.id ? c : x)) }), () => api.updateCreative(clientId, c)),

    updateMany: (list: Creative[]) => {
      const byId = new Map(list.map((c) => [c.id, c]));
      run((p) => ({ ...p, creatives: p.creatives.map((x) => byId.get(x.id) ?? x) }), () => api.bulkUpdateCreatives(clientId, list));
    },

    remove: (ids: string[]) =>
      run((p) => ({ ...p, creatives: p.creatives.filter((x) => !ids.includes(x.id)) }), () => api.deleteCreatives(clientId, ids)),

    setFolders: (folders: CreativeFolder[]) => run((p) => ({ ...p, folders }), () => api.saveFolders(clientId, folders)),

    /** Deletes a folder; its creatives become "uncategorised" */
    deleteFolder: (folderId: string, folders: CreativeFolder[], moved: Creative[]) => {
      const byId = new Map(moved.map((c) => [c.id, c]));
      run(
        (p) => ({ ...p, folders, creatives: p.creatives.map((x) => byId.get(x.id) ?? x) }),
        () => Promise.all([api.saveFolders(clientId, folders), api.bulkUpdateCreatives(clientId, moved)]),
      );
    },
  };

  return { status: state.status, error: state.error, data: state.data, reload, actions };
}
