"use client";
// Path: src/app/dashboard/Clients/[id]/components/ClientStore.tsx
// Holds the loaded client + every action the page can perform.
// When you connect an API, call it inside these actions (e.g. POST /api/clients/:id/notes)
// and keep the local state update so the UI responds instantly.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  newId,
  todayISO,
  viewAsOf,
  type Campaign,
  type CampaignBucket,
  type CalendarPost,
  type ClientDetails,
  type ClientFile,
  type ClientTask,
  type InternalNote,
  type Platform,
  type PostBucket,
  type TeamMember,
} from "../../../../../data/clientDetailsData";

export type TabKey =
  | "overview"
  | "campaigns"
  | "calendar"
  | "creatives"
  | "reports"
  | "conversations"
  | "files"
  | "notes"
  | "settings";

export type ModalKey = null | "editClient" | "addCampaign" | "editCampaign" | "addPost" | "addNote" | "manageTeam";

interface Store {
  /** Data as of the selected date — every section reads this */
  data: ClientDetails;
  /** Original (un-prorated) data — used when editing a record */
  raw: ClientDetails;
  /** Selected "as of" date (YYYY-MM-DD) and the real today */
  asOfDate: string;
  today: string;
  isToday: boolean;
  setAsOfDate: (iso: string) => void;
  tab: TabKey;
  setTab: (t: TabKey) => void;
  modal: ModalKey;
  /** Extra info for the open modal, e.g. the campaign id being edited */
  modalPayload: string | null;
  openModal: (m: ModalKey, payload?: string) => void;
  toast: string | null;
  showToast: (msg: string) => void;

  updateClient: (patch: Omit<Partial<ClientDetails>, "info"> & { info?: Partial<ClientDetails["info"]> }) => void;
  toggleAccount: (p: Platform) => void;
  /** Returns the new campaign id */
  addCampaign: (bucket: CampaignBucket, c: Omit<Campaign, "id">) => string;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaigns: (ids: string[]) => void;
  addPost: (bucket: PostBucket, p: Omit<CalendarPost, "id">) => void;
  addNote: (text: string) => void;
  uploadCreatives: (files: File[]) => void;
  uploadFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  addTask: (t: Omit<ClientTask, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  sendMessage: (text: string) => void;
  setTeam: (team: TeamMember[]) => void;
}

const Ctx = createContext<Store | null>(null);

export function useClient() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useClient must be used inside <ClientStoreProvider>");
  return v;
}

const nowLabel = () => {
  const d = new Date();
  return `Today, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}`;
};

const fileSize = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

const ACTOR = "You";

const logActivity = (d: ClientDetails, text: string, color = "#3b82f6"): ClientDetails => ({
  ...d,
  activity: [{ id: newId("a"), time: nowLabel(), text, color }, ...d.activity],
});

const TAB_KEYS: TabKey[] = ["overview", "campaigns", "calendar", "creatives", "reports", "conversations", "files", "notes", "settings"];

/** Read ?tab= and ?date= from the URL once, when the store is created */
function readUrl() {
  if (typeof window === "undefined") return { tab: null as TabKey | null, date: null as string | null };
  const q = new URLSearchParams(window.location.search);
  const t = q.get("tab") as TabKey | null;
  const d = q.get("date");
  return { tab: t && TAB_KEYS.includes(t) ? t : null, date: d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null };
}

function writeUrl(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState(null, "", url.toString());
}

export function ClientStoreProvider({ initial, children }: { initial: ClientDetails; children: ReactNode }) {
  const [raw, setData] = useState<ClientDetails>(initial);
  const [today] = useState(todayISO);
  const [asOfDate, setAsOfDateState] = useState(() => readUrl().date ?? today);
  const [tab, setTabState] = useState<TabKey>(() => readUrl().tab ?? "overview");
  const data = useMemo(() => viewAsOf(raw, asOfDate, today), [raw, asOfDate, today]);
  const [modal, setModal] = useState<ModalKey>(null);
  const [modalPayload, setModalPayload] = useState<string | null>(null);
  const openModal = useCallback((m: ModalKey, payload?: string) => {
    setModal(m);
    setModalPayload(payload ?? null);
  }, []);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const setTab = useCallback((t: TabKey) => {
    setTabState(t);
    writeUrl("tab", t === "overview" ? null : t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const setAsOfDate = useCallback(
    (iso: string) => {
      setAsOfDateState(iso);
      writeUrl("date", iso === today ? null : iso);
    },
    [today]
  );

  const store = useMemo<Store>(
    () => ({
      data,
      raw,
      asOfDate,
      today,
      isToday: asOfDate === today,
      setAsOfDate,
      tab,
      setTab,
      modal,
      modalPayload,
      openModal,
      toast,
      showToast,

      updateClient: (patch) =>
        setData((d) => logActivity({ ...d, ...patch, info: { ...d.info, ...(patch.info ?? {}) } }, "Client details updated.", "#3b82f6")),

      toggleAccount: (p) =>
        setData((d) => ({
          ...d,
          accounts: d.accounts.map((a) => (a.platform === p ? { ...a, connected: !a.connected } : a)),
        })),

      // Campaigns are grouped into past/current/upcoming from their dates (see viewAsOf), so the bucket is only a hint.
      addCampaign: (bucket, c) => {
        const id = newId("cmp");
        setData((d) =>
          logActivity(
            { ...d, campaigns: { ...d.campaigns, [bucket]: [{ ...c, id }, ...d.campaigns[bucket]] } },
            `New campaign "${c.name}" ${c.statusOverride === "Draft" ? "saved as draft" : "added"}.`,
            "#22c55e"
          )
        );
        return id;
      },

      // TODO (API): PATCH /api/clients/:id/campaigns/:campaignId
      updateCampaign: (id, patch) =>
        setData((d) => {
          const map = (list: Campaign[]) => list.map((c) => (c.id === id ? { ...c, ...patch } : c));
          const name = [...d.campaigns.past, ...d.campaigns.current, ...d.campaigns.upcoming].find((c) => c.id === id)?.name ?? "Campaign";
          return logActivity(
            { ...d, campaigns: { past: map(d.campaigns.past), current: map(d.campaigns.current), upcoming: map(d.campaigns.upcoming) } },
            `Campaign "${patch.name ?? name}" updated.`,
            "#3b82f6"
          );
        }),

      // TODO (API): DELETE /api/clients/:id/campaigns (body: ids)
      deleteCampaigns: (ids) =>
        setData((d) => {
          const keep = (list: Campaign[]) => list.filter((c) => !ids.includes(c.id));
          return logActivity(
            { ...d, campaigns: { past: keep(d.campaigns.past), current: keep(d.campaigns.current), upcoming: keep(d.campaigns.upcoming) } },
            `${ids.length} campaign${ids.length > 1 ? "s" : ""} deleted.`,
            "#ef4444"
          );
        }),

      addPost: (bucket, p) =>
        setData((d) =>
          logActivity(
            { ...d, calendar: { ...d.calendar, [bucket]: [...d.calendar[bucket], { ...p, id: newId("post") }] } },
            `Post "${p.title}" added to content calendar.`,
            "#f59e0b"
          )
        ),

      addNote: (text) =>
        setData((d) =>
          logActivity(
            { ...d, notes: [{ id: newId("n"), author: ACTOR, avatar: null, time: nowLabel(), text, tag: "Internal" } as InternalNote, ...d.notes] },
            "Internal note added.",
            "#8b5cf6"
          )
        ),

      uploadCreatives: (files) =>
        setData((d) => {
          const added: ClientFile[] = files.map((f) => ({
            id: newId("f"),
            name: f.name,
            type: (f.name.split(".").pop() || "FILE").toUpperCase(),
            size: fileSize(f.size),
            uploadedBy: ACTOR,
            date: new Date().toISOString().slice(0, 10),
            url: URL.createObjectURL(f),
          }));
          return logActivity(
            { ...d, creatives: { ...d.creatives, pending: d.creatives.pending + files.length }, files: [...added, ...d.files] },
            `${files.length} creative${files.length > 1 ? "s" : ""} uploaded for review.`,
            "#8b5cf6"
          );
        }),

      uploadFiles: (files) =>
        setData((d) => {
          const added: ClientFile[] = files.map((f) => ({
            id: newId("f"),
            name: f.name,
            type: (f.name.split(".").pop() || "FILE").toUpperCase(),
            size: fileSize(f.size),
            uploadedBy: ACTOR,
            date: new Date().toISOString().slice(0, 10),
            url: URL.createObjectURL(f),
          }));
          return logActivity({ ...d, files: [...added, ...d.files] }, `${files.length} file${files.length > 1 ? "s" : ""} uploaded.`, "#3b82f6");
        }),

      removeFile: (id) => setData((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) })),

      addTask: (t) => setData((d) => ({ ...d, tasks: [{ ...t, id: newId("k"), done: false }, ...d.tasks] })),
      toggleTask: (id) => setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      removeTask: (id) => setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),

      sendMessage: (text) =>
        setData((d) => ({
          ...d,
          conversations: [{ id: newId("m"), name: ACTOR, avatar: null, time: nowLabel(), message: text, tag: "Internal" }, ...d.conversations],
        })),

      setTeam: (team) => setData((d) => logActivity({ ...d, team }, "Assigned team updated.", "#22c55e")),
    }),
    [data, raw, asOfDate, today, setAsOfDate, tab, modal, modalPayload, openModal, toast, setTab, showToast]
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
