"use client";
// Path: src/app/dashboard/Clients/[id]/components/CampaignModal.tsx
// "Add New Campaign" / "Edit Campaign" — two-column form:
//   Left : Campaign Details · Creative & Content · Notes & Files
//   Right: Performance & Updates · Past Updates · Current Summary
// Opened with openModal("addCampaign") or openModal("editCampaign", campaignId).

import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  FiBarChart2, FiCalendar, FiCheck, FiEdit2, FiEye, FiFileText, FiImage, FiLayers, FiLink, FiMoreVertical, FiPercent, FiPieChart,
  FiPlus, FiSend, FiTarget, FiTrash2, FiTrendingUp, FiUploadCloud, FiUser, FiUsers, FiX, FiMousePointer,
} from "react-icons/fi";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import {
  CAMPAIGN_OBJECTIVES,
  addDays,
  campaignResult,
  campaignStatus,
  campaignTimeLeft,
  daysBetween,
  formatDate,
  formatINR,
  newId,
  type Campaign,
  type CampaignAttachment,
  type CampaignBucket,
  type PerformanceUpdate,
  type Platform,
} from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import { Avatar } from "./ui";
import s from "../ClientDetails.module.css";

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

const GOALS = ["Leads", "Enquiries", "Bookings", "Registrations", "Sales", "Messages", "Reach", "Brand Awareness", "Engagement"];
const RESULT_TYPES = ["Leads", "Enquiries", "Bookings", "Registrations", "Purchases", "Messages"];
const OTHER_PLATFORMS = ["Google My Business", "Google Ads", "YouTube", "WhatsApp", "LinkedIn"];
const CREATIVE_TYPES = ["Image (Static)", "Video (Reel)", "Carousel", "Story", "Collection", "Other"];
const STATUSES = [
  { value: "Running", color: "#16a34a" },
  { value: "Paused", color: "#f59e0b" },
  { value: "Completed", color: "#64748b" },
] as const;
const MAX_FILE = 10 * 1024 * 1024;
const ACTOR = "You"; // TODO (auth): replace with the logged-in user's name
const TEXT_LIMIT = 500;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const toNum = (v: string) => (v.trim() === "" ? undefined : Number(v));
const str = (n?: number) => (n === undefined || n === null ? "" : String(n));
const fileSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const pctChange = (cur?: number, prev?: number) => (cur !== undefined && prev ? ((cur - prev) / prev) * 100 : undefined);

function MetaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path
        d="M6.5 7C4 7 2.5 10 2.5 12.6c0 2 1 3.4 2.6 3.4 1.6 0 2.7-1.4 4.4-4.3L12 7.9C10.6 7.3 8.4 7 6.5 7Zm11 0c-2.2 0-3.9 1.7-5.5 4.4l-1 1.7c1.6 2.7 2.8 3.9 4.6 3.9 1.9 0 3.9-1.6 3.9-4.6C19.5 9.6 18.7 7 17.5 7Z"
        fill="none"
        stroke="#0866FF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Splits an existing campaign's totals into a few dated updates so the log isn't empty (demo / legacy data) */
function synthUpdates(c: Campaign | undefined, today: string): PerformanceUpdate[] {
  if (!c || !c.spent || c.startDate > today) return [];
  const runEnd = c.endDate < today ? c.endDate : today;
  const days = daysBetween(c.startDate, runEnd) + 1;
  const n = Math.max(1, Math.min(4, days));
  const w = [0.22, 0.27, 0.24, 0.27].slice(0, n);
  const sum = w.reduce((a, b) => a + b, 0);
  const share = (total = 0, i: number, acc: number) => (i === n - 1 ? total - acc : Math.round((total * w[i]) / sum));
  const out: PerformanceUpdate[] = [];
  const acc = { spent: 0, results: 0, leads: 0, reach: 0, impressions: 0, clicks: 0 };
  const impressionsTotal = c.impressions ?? (c.reach ? Math.round(c.reach * 1.6) : undefined);
  const clicksTotal = c.clicks ?? (impressionsTotal && c.ctr ? Math.round((impressionsTotal * c.ctr) / 100) : undefined);
  for (let i = 0; i < n; i++) {
    const u: PerformanceUpdate = {
      id: `syn-${c.id}-${i}`,
      date: addDays(c.startDate, Math.round(((i + 1) * days) / n) - 1),
      spent: share(c.spent, i, acc.spent),
      results: share(c.results ?? c.leads, i, acc.results),
      leads: share(c.leads, i, acc.leads),
      reach: c.reach !== undefined ? share(c.reach, i, acc.reach) : undefined,
      impressions: impressionsTotal !== undefined ? share(impressionsTotal, i, acc.impressions) : undefined,
      clicks: clicksTotal !== undefined ? share(clicksTotal, i, acc.clicks) : undefined,
      by: c.runBy ?? ACTOR,
    };
    acc.spent += u.spent;
    acc.results += u.results;
    acc.leads += u.leads;
    acc.reach += u.reach ?? 0;
    acc.impressions += u.impressions ?? 0;
    acc.clicks += u.clicks ?? 0;
    out.push(u);
  }
  return out;
}

function totalsOf(list: PerformanceUpdate[]) {
  const t = list.reduce(
    (a, u) => ({
      spent: a.spent + u.spent,
      results: a.results + u.results,
      leads: a.leads + u.leads,
      reach: a.reach + (u.reach ?? 0),
      impressions: a.impressions + (u.impressions ?? 0),
      clicks: a.clicks + (u.clicks ?? 0),
    }),
    { spent: 0, results: 0, leads: 0, reach: 0, impressions: 0, clicks: 0 }
  );
  return { ...t, cpr: t.results ? t.spent / t.results : undefined, ctr: t.impressions ? (t.clicks / t.impressions) * 100 : undefined };
}

const entryCpr = (u: PerformanceUpdate) => (u.results ? u.spent / u.results : undefined);
const entryCtr = (u: PerformanceUpdate) => (u.impressions && u.clicks !== undefined ? (u.clicks / u.impressions) * 100 : undefined);

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

type StatusValue = "Running" | "Paused" | "Completed" | "Draft";

interface FormState {
  name: string;
  type: string;
  platforms: Platform[];
  other: string;
  goalType: string;
  goalTarget: string;
  audience: string;
  budget: string;
  startDate: string;
  endDate: string;
  runBy: string;
  status: StatusValue;
  description: string;
  planned: string;
  given: string;
  creativeTypes: string[];
  notes: string;
  resultUnit: string;
}

function toForm(c: Campaign | undefined, defaultRunBy: string): FormState {
  const goalMatch = c?.goal?.match(/^([\d.,]+)\s*(.*)$/);
  const gmb = c?.platforms?.includes("gmb");
  return {
    name: c?.name ?? "",
    type: c?.type ?? "",
    platforms: (c?.platforms ?? []).filter((p) => p !== "gmb"),
    other: c?.otherPlatform ?? (gmb ? "Google My Business" : ""),
    goalType: c?.goalType ?? (goalMatch ? goalMatch[2] : c?.goal) ?? "",
    goalTarget: goalMatch ? goalMatch[1].replace(/,/g, "") : "",
    audience: c?.audience ?? "",
    budget: str(c?.budget),
    startDate: c?.startDate ?? "",
    endDate: c?.endDate ?? "",
    runBy: c?.runBy ?? defaultRunBy,
    status: c?.statusOverride ?? (c?.paused ? "Paused" : "Running"),
    description: c?.description ?? "",
    planned: str(c?.creatives?.planned),
    given: str(c?.creatives?.given),
    creativeTypes: c?.creatives?.types ?? [],
    notes: c?.notes ?? "",
    resultUnit: c?.resultUnit ?? "",
  };
}

interface PerfState {
  spent: string;
  results: string;
  leads: string;
  reach: string;
  impressions: string;
  clicks: string;
}
const EMPTY_PERF: PerfState = { spent: "", results: "", leads: "", reach: "", impressions: "", clicks: "" };

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Section({ icon, title, extra, children, className = "" }: { icon: ReactNode; title: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${s.cmSection} ${className}`}>
      <header className={s.cmSectionHead}>
        <h3>
          <span className={s.cmSectionIcon}>{icon}</span>
          {title}
        </h3>
        {extra}
      </header>
      {children}
    </section>
  );
}

function F({ label, req, error, hint, children, className = "" }: { label: string; req?: boolean; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`${s.cmField} ${error ? s.cmHasError : ""} ${className}`}>
      <span className={s.cmLabel}>
        {label} {req && <b>*</b>}
      </span>
      {children}
      {error ? <small className={s.cmError}>{error}</small> : hint ? <small className={s.cmHint}>{hint}</small> : null}
    </label>
  );
}

function Affix({ icon, children, readOnly }: { icon: ReactNode; children: ReactNode; readOnly?: boolean }) {
  return (
    <div className={`${s.cmAffix} ${readOnly ? s.cmReadOnly : ""}`}>
      <span className={s.cmAffixIcon}>{icon}</span>
      {children}
    </div>
  );
}

function Change({ value, goodWhenDown = false }: { value?: number; goodWhenDown?: boolean }) {
  if (value === undefined || !Number.isFinite(value)) return <span className={s.cmChangeNone}>—</span>;
  const up = value >= 0;
  const good = goodWhenDown ? !up : up;
  return (
    <span className={`${s.trend} ${good ? s.trendUp : s.trendDown}`}>
      {up ? "↑" : "↓"} {Math.abs(Math.round(value))}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export default function CampaignModal() {
  const { raw, modal, modalPayload, openModal, addCampaign, updateCampaign, showToast, today } = useClient();
  const editing = useMemo(
    () => (modal === "editCampaign" && modalPayload ? Object.values(raw.campaigns).flat().find((c) => c.id === modalPayload) : undefined),
    [modal, modalPayload, raw.campaigns]
  );
  const team = raw.team;

  const [f, setF] = useState<FormState>(() => toForm(editing, team[0]?.name ?? ACTOR));
  const [updates, setUpdates] = useState<PerformanceUpdate[]>(() => editing?.updates ?? synthUpdates(editing, today));
  const [perf, setPerf] = useState<PerfState>(EMPTY_PERF);
  const [editingUpdate, setEditingUpdate] = useState<string | null>(null);
  const [files, setFiles] = useState<CampaignAttachment[]>(() => editing?.attachments ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [perfErrors, setPerfErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setDirty(true);
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };
  const setP = (k: keyof PerfState, v: string) => {
    setPerf((x) => ({ ...x, [k]: v }));
    if (perfErrors[k]) setPerfErrors((e) => ({ ...e, [k]: "" }));
  };

  const close = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    openModal(null);
  };

  // Escape to close, lock page scroll, close row menu on outside click / scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu) setMenu(null);
      else if (!dirty || window.confirm("Discard unsaved changes?")) openModal(null);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [menu, dirty, openModal]);
  useEffect(() => {
    if (!menu) return;
    const shut = (e: Event) => {
      if (e.type === "mousedown" && (e.target as HTMLElement).closest?.("[data-upd-menu]")) return;
      setMenu(null);
    };
    document.addEventListener("mousedown", shut);
    const body = bodyRef.current;
    body?.addEventListener("scroll", shut);
    return () => {
      document.removeEventListener("mousedown", shut);
      body?.removeEventListener("scroll", shut);
    };
  }, [menu]);

  /* ---------- derived ---------- */
  const sortedUpdates = useMemo(() => [...updates].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)), [updates]);
  const totals = totalsOf(updates);
  const latest = sortedUpdates[0];
  const previous = sortedUpdates[1];
  const budgetNum = Number(f.budget) || 0;
  const spentPct = budgetNum ? Math.round((totals.spent / budgetNum) * 100) : 0;

  const perfSpent = toNum(perf.spent);
  const perfResults = toNum(perf.results);
  const perfImpr = toNum(perf.impressions);
  const perfClicks = toNum(perf.clicks);
  const autoCpr = perfSpent && perfResults ? perfSpent / perfResults : undefined;
  const autoCtr = perfImpr && perfClicks !== undefined ? (perfClicks / perfImpr) * 100 : undefined;

  const otherIsGmb = f.other === "Google My Business";
  const allPlatforms: Platform[] = [...f.platforms, ...(otherIsGmb ? (["gmb"] as Platform[]) : [])];
  const metaOn = f.platforms.includes("facebook") && f.platforms.includes("instagram");

  const togglePlatform = (p: Platform) => set("platforms", f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p]);
  const toggleMeta = () =>
    set("platforms", metaOn ? f.platforms.filter((p) => p !== "facebook" && p !== "instagram") : [...new Set([...f.platforms, "facebook", "instagram"] as Platform[])]);
  const toggleCreative = (t: string) => set("creativeTypes", f.creativeTypes.includes(t) ? f.creativeTypes.filter((x) => x !== t) : [...f.creativeTypes, t]);

  const plannedNum = toNum(f.planned) ?? 0;
  const givenNum = toNum(f.given) ?? 0;
  const pending = f.planned === "" && f.given === "" ? "" : String(Math.max(0, plannedNum - givenNum));

  /* ---------- performance updates ---------- */
  const validatePerf = () => {
    const e: Record<string, string> = {};
    if (perfSpent === undefined || perfSpent <= 0) e.spent = "Enter amount spent";
    if (perfResults === undefined || perfResults < 0) e.results = "Enter results";
    if (!f.resultUnit) e.resultUnit = "Select result type";
    const leads = toNum(perf.leads);
    if (leads !== undefined && leads < 0) e.leads = "Can't be negative";
    if (perfImpr !== undefined && perfClicks !== undefined && perfClicks > perfImpr) e.clicks = "Clicks can't exceed impressions";
    setPerfErrors(e);
    return Object.keys(e).length === 0;
  };

  const perfEntry = (id: string, date: string, by: string): PerformanceUpdate => ({
    id,
    date,
    spent: perfSpent ?? 0,
    results: perfResults ?? 0,
    leads: toNum(perf.leads) ?? 0,
    reach: toNum(perf.reach),
    impressions: perfImpr,
    clicks: perfClicks,
    by,
  });

  const submitUpdate = () => {
    if (!validatePerf()) return;
    if (editingUpdate) {
      setUpdates((list) => list.map((u) => (u.id === editingUpdate ? perfEntry(u.id, u.date, u.by) : u)));
      showToast("Update saved");
    } else {
      setUpdates((list) => [...list, perfEntry(newId("upd"), today, ACTOR)]);
      showToast("Performance updated");
    }
    setPerf(EMPTY_PERF);
    setEditingUpdate(null);
    setDirty(true);
  };

  const startEditUpdate = (u: PerformanceUpdate) => {
    setPerf({ spent: str(u.spent), results: str(u.results), leads: str(u.leads), reach: str(u.reach), impressions: str(u.impressions), clicks: str(u.clicks) });
    setEditingUpdate(u.id);
    setPerfErrors({});
    setMenu(null);
  };
  const deleteUpdate = (id: string) => {
    setUpdates((list) => list.filter((u) => u.id !== id));
    if (editingUpdate === id) {
      setEditingUpdate(null);
      setPerf(EMPTY_PERF);
    }
    setMenu(null);
    setDirty(true);
    showToast("Update removed");
  };

  /* ---------- files ---------- */
  const addFiles = (list: FileList | File[]) => {
    const ok: CampaignAttachment[] = [];
    const bad: string[] = [];
    Array.from(list).forEach((file) => {
      const allowed = /^(image|video)\//.test(file.type) || file.type === "application/pdf";
      if (!allowed) bad.push(`${file.name} (type not allowed)`);
      else if (file.size > MAX_FILE) bad.push(`${file.name} (over 10 MB)`);
      else ok.push({ id: newId("att"), name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) });
    });
    if (ok.length) {
      setFiles((x) => [...x, ...ok]);
      setDirty(true);
    }
    setFileError(bad.length ? `Not added: ${bad.join(", ")}` : "");
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  /* ---------- save ---------- */
  const validate = (draft: boolean) => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "Campaign name is required";
    if (!draft) {
      if (!f.type) e.type = "Select a campaign type";
      if (!allPlatforms.length && !f.other) e.platforms = "Select at least one platform";
      if (!budgetNum || budgetNum <= 0) e.budget = "Enter a budget greater than 0";
      if (!f.startDate) e.startDate = "Select a start date";
      if (!f.endDate) e.endDate = "Select an end date";
      else if (f.startDate && f.endDate < f.startDate) e.endDate = "End date must be after start date";
      if (!f.runBy) e.runBy = "Select who runs it";
      if (givenNum > plannedNum && f.planned !== "") e.given = "Can't be more than planned";
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      bodyRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(e).length === 0;
  };

  /** Saves the campaign. Returns the saved id (or null if validation failed). */
  const save = (mode: "create" | "draft") => {
    const draft = mode === "draft";
    if (!validate(draft)) return null;

    // Values typed in "Performance & Updates" but not yet added count as an update
    let finalUpdates = updates;
    if (perf.spent.trim() !== "" || perf.results.trim() !== "") {
      if (!validatePerf()) {
        bodyRef.current?.querySelector('[data-field="perf"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
        return null;
      }
      finalUpdates = editingUpdate
        ? updates.map((u) => (u.id === editingUpdate ? perfEntry(u.id, u.date, u.by) : u))
        : [...updates, perfEntry(newId("upd"), today, ACTOR)];
    }
    const t = totalsOf(finalUpdates);
    const sorted = [...finalUpdates].sort((a, b) => b.date.localeCompare(a.date));
    const start = f.startDate || today;
    const end = f.endDate || addDays(start, 30);
    const goal = f.goalType ? (f.goalTarget ? `${Number(f.goalTarget).toLocaleString("en-IN")} ${f.goalType}` : f.goalType) : undefined;
    const firstImage = files.find((x) => x.type.startsWith("image/"))?.url;

    const payload: Omit<Campaign, "id"> = {
      name: f.name.trim(),
      type: f.type || "Lead Generation",
      category: `${f.type || "Campaign"}${f.goalType ? ` | ${f.goalType}` : ""}`,
      platforms: allPlatforms,
      otherPlatform: f.other && !otherIsGmb ? f.other : undefined,
      goalType: f.goalType || undefined,
      goal,
      audience: f.audience.trim() || undefined,
      budget: budgetNum,
      startDate: start,
      endDate: end,
      runBy: f.runBy,
      statusOverride: draft ? "Draft" : f.status === "Running" ? undefined : (f.status as "Paused" | "Completed" | "Draft"),
      paused: false,
      description: f.description.trim() || undefined,
      creatives: f.planned || f.given || f.creativeTypes.length ? { planned: plannedNum, given: givenNum, types: f.creativeTypes } : undefined,
      notes: f.notes.trim() || undefined,
      attachments: files,
      updates: finalUpdates,
      spent: t.spent,
      results: t.results,
      leads: t.leads,
      reach: t.reach || undefined,
      impressions: t.impressions || undefined,
      clicks: t.clicks || undefined,
      ctr: t.ctr !== undefined ? Math.round(t.ctr * 10) / 10 : editing?.ctr,
      resultUnit: f.resultUnit || editing?.resultUnit || "Leads",
      resultMetric: f.goalType === "Reach" || f.goalType === "Brand Awareness" ? "reach" : editing?.resultMetric ?? "leads",
      resultChange: sorted.length > 1 ? Math.round(pctChange(sorted[0].results, sorted[1].results) ?? 0) : editing?.resultChange,
      thumbnail: editing?.thumbnail ?? firstImage ?? null,
      result: "",
    };
    payload.result = campaignResult(payload as Campaign);

    setUpdates(finalUpdates);
    setPerf(EMPTY_PERF);
    setEditingUpdate(null);
    setDirty(false);

    if (editing) {
      updateCampaign(editing.id, payload);
      return editing.id;
    }
    const bucket: CampaignBucket = end < today ? "past" : start > today ? "upcoming" : "current";
    return addCampaign(bucket, payload);
  };

  const onCreate = () => {
    const id = save("create");
    if (!id) return;
    showToast(editing ? "Campaign updated" : "Campaign created");
    openModal(null);
  };
  const onCreateAndTrack = () => {
    const id = save("create");
    if (!id) return;
    showToast(editing ? "Saved — keep adding updates" : "Campaign created — keep tracking performance");
    if (!editing) openModal("editCampaign", id); // reopen in edit mode to keep logging updates
  };
  const onDraft = () => {
    const id = save("draft");
    if (!id) return;
    showToast("Saved as draft");
    openModal(null);
  };

  /* ---------- summary ---------- */
  const previewStatus = campaignStatus(
    {
      id: "preview",
      name: f.name,
      type: f.type,
      budget: budgetNum,
      result: "",
      startDate: f.startDate || today,
      endDate: f.endDate || addDays(today, 30),
      statusOverride: f.status === "Running" ? undefined : f.status,
    },
    today
  );
  const timeLeft = f.startDate && f.endDate ? campaignTimeLeft({ startDate: f.startDate, endDate: f.endDate } as Campaign, today) : "Set dates";
  const statusClass = { Active: s.stActive, Paused: s.stPaused, Completed: s.stCompleted, Scheduled: s.stScheduled, Draft: s.stDraft }[previewStatus];
  const shown = showAll ? sortedUpdates : sortedUpdates.slice(0, 4);
  const runByMember = team.find((m) => m.name === f.runBy);
  const statusColor = STATUSES.find((x) => x.value === f.status)?.color ?? "#94a3b8";

  return (
    <div className={s.modalBackdrop} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className={s.cmDialog} role="dialog" aria-modal="true" aria-labelledby="cm-title">
        {/* ---------- Header ---------- */}
        <header className={s.cmHead}>
          <span className={s.cmHeadIcon}>
            <HiOutlineSpeakerphone />
          </span>
          <div className={s.cmHeadText}>
            <h2 id="cm-title">{editing ? "Edit Campaign" : "Add New Campaign"}</h2>
            <p>Create campaign and keep updating performance, spend and results.</p>
          </div>
          <div className={s.cmHeadActions}>
            <button type="button" className={s.cmBtnSoft} onClick={onCreateAndTrack}>
              {editing ? "Save & Keep Tracking" : "Create & Track Campaign"}
            </button>
            <button type="button" className={s.cmBtnGhost} onClick={onDraft}>
              Save as Draft
            </button>
          </div>
          <button type="button" className={s.cmClose} onClick={close} aria-label="Close">
            <FiX />
          </button>
        </header>

        {/* ---------- Body ---------- */}
        <div className={s.cmBody} ref={bodyRef}>
          <div className={s.cmCol}>
            {/* Campaign Details */}
            <Section icon={<FiFileText />} title="Campaign Details">
              <div className={s.cmGrid2}>
                <F label="Campaign Name" req error={errors.name}>
                  <input data-field="name" className={s.cmInput} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Enter campaign name" autoFocus />
                </F>
                <F label="Campaign Type" req error={errors.type}>
                  <select data-field="type" className={`${s.cmInput} ${!f.type ? s.cmPlaceholder : ""}`} value={f.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="">Select campaign type</option>
                    {CAMPAIGN_OBJECTIVES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </F>
              </div>

              <div className={`${s.cmField} ${errors.platforms ? s.cmHasError : ""}`} data-field="platforms">
                <span className={s.cmLabel}>
                  Platform(s) <b>*</b>
                </span>
                <div className={s.cmPlatforms}>
                  <label className={`${s.cmCheckCard} ${f.platforms.includes("facebook") ? s.cmChecked : ""}`}>
                    <input type="checkbox" checked={f.platforms.includes("facebook")} onChange={() => togglePlatform("facebook")} />
                    <span className={`${s.socBtn} ${s.socXs} ${s.socFb}`}><FaFacebookF /></span> Facebook
                  </label>
                  <label className={`${s.cmCheckCard} ${f.platforms.includes("instagram") ? s.cmChecked : ""}`}>
                    <input type="checkbox" checked={f.platforms.includes("instagram")} onChange={() => togglePlatform("instagram")} />
                    <span className={`${s.socBtn} ${s.socXs} ${s.socIg}`}><FaInstagram /></span> Instagram
                  </label>
                  <label className={`${s.cmCheckCard} ${metaOn ? s.cmChecked : ""}`}>
                    <input type="checkbox" checked={metaOn} onChange={toggleMeta} />
                    <MetaIcon /> Meta (FB + IG)
                  </label>
                  <label className={`${s.cmCheckCard} ${s.cmOther} ${f.other ? s.cmChecked : ""}`}>
                    <span className={s.cmRadioDot} aria-hidden>{f.other && <i />}</span>
                    <select value={f.other} onChange={(e) => set("other", e.target.value)} aria-label="Other platform">
                      <option value="">Other</option>
                      {OTHER_PLATFORMS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {errors.platforms && <small className={s.cmError}>{errors.platforms}</small>}
              </div>

              <div className={s.cmGrid2}>
                <F label="Campaign Goal" hint={f.goalType ? "Target is optional" : undefined}>
                  <div className={s.cmGoalRow}>
                    <input
                      className={s.cmInput}
                      type="number"
                      min={0}
                      value={f.goalTarget}
                      onChange={(e) => set("goalTarget", e.target.value)}
                      placeholder="Target"
                      aria-label="Goal target"
                    />
                    <select className={`${s.cmInput} ${!f.goalType ? s.cmPlaceholder : ""}`} value={f.goalType} onChange={(e) => set("goalType", e.target.value)}>
                      <option value="">Select campaign goal</option>
                      {GOALS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </F>
                <F label="Target Audience" hint="e.g. Women, 25-40, Kolkata">
                  <input className={s.cmInput} value={f.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Enter target audience" />
                </F>
              </div>

              <div className={s.cmGrid3}>
                <F label="Budget" req error={errors.budget}>
                  <Affix icon="₹">
                    <input data-field="budget" type="number" min={0} value={f.budget} onChange={(e) => set("budget", e.target.value)} placeholder="Enter total budget" />
                  </Affix>
                </F>
                <F label="Start Date" req error={errors.startDate}>
                  <Affix icon={<FiCalendar />}>
                    <input data-field="startDate" type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
                  </Affix>
                </F>
                <F label="End Date" req error={errors.endDate}>
                  <Affix icon={<FiCalendar />}>
                    <input data-field="endDate" type="date" value={f.endDate} min={f.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} />
                  </Affix>
                </F>
              </div>

              <div className={s.cmGrid2}>
                <F label="Campaign Run By" req error={errors.runBy}>
                  <div className={s.cmAvatarSelect} data-field="runBy">
                    <Avatar src={runByMember?.avatar ?? null} name={f.runBy || "?"} size={24} />
                    <select className={s.cmInput} value={f.runBy} onChange={(e) => set("runBy", e.target.value)}>
                      <option value="">Select team member</option>
                      {[...new Set([...team.map((m) => m.name), ...(f.runBy ? [f.runBy] : [])])].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </F>
                <F label="Status" req>
                  <div className={s.cmAvatarSelect}>
                    <i className={s.cmStatusDot} style={{ background: statusColor }} />
                    <select className={s.cmInput} value={f.status} onChange={(e) => set("status", e.target.value as StatusValue)}>
                      {STATUSES.map((x) => (
                        <option key={x.value}>{x.value}</option>
                      ))}
                      {f.status === "Draft" && <option>Draft</option>}
                    </select>
                  </div>
                </F>
              </div>

              <F label="Campaign Description">
                <div className={s.cmTextareaWrap}>
                  <textarea
                    className={s.cmInput}
                    rows={3}
                    maxLength={TEXT_LIMIT}
                    value={f.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Enter campaign description, strategy, targeting, ad set details etc..."
                  />
                  <span className={s.cmCount}>{f.description.length}/{TEXT_LIMIT}</span>
                </div>
              </F>
            </Section>

            {/* Creative & Content */}
            <Section icon={<FiLayers />} title="Creative & Content">
              <div className={s.cmGrid3}>
                <F label="Total Creatives Planned">
                  <input className={s.cmInput} type="number" min={0} value={f.planned} onChange={(e) => set("planned", e.target.value)} placeholder="Enter number" />
                </F>
                <F label="Creatives Given" error={errors.given}>
                  <input data-field="given" className={s.cmInput} type="number" min={0} value={f.given} onChange={(e) => set("given", e.target.value)} placeholder="Enter number" />
                </F>
                <F label="Creatives Pending" hint="Auto calculated">
                  <input className={`${s.cmInput} ${s.cmReadOnlyInput}`} value={pending} readOnly placeholder="—" tabIndex={-1} />
                </F>
              </div>
              <div className={s.cmField}>
                <span className={s.cmLabel}>Creative Type</span>
                <div className={s.cmChips}>
                  {CREATIVE_TYPES.map((t) => (
                    <label key={t} className={`${s.cmCheckCard} ${s.cmChipSm} ${f.creativeTypes.includes(t) ? s.cmChecked : ""}`}>
                      <input type="checkbox" checked={f.creativeTypes.includes(t)} onChange={() => toggleCreative(t)} />
                      {t.startsWith("Video") ? <FiSend /> : <FiImage />} {t}
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            {/* Notes & Files */}
            <Section icon={<FiFileText />} title="Notes & Files">
              <div className={s.cmGrid2}>
                <F label="Internal Notes">
                  <div className={s.cmTextareaWrap}>
                    <textarea className={s.cmInput} rows={4} maxLength={TEXT_LIMIT} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Add any additional notes..." />
                    <span className={s.cmCount}>{f.notes.length}/{TEXT_LIMIT}</span>
                  </div>
                </F>
                <div className={s.cmField}>
                  <span className={s.cmLabel}>Upload Files</span>
                  <div
                    role="button"
                    tabIndex={0}
                    className={`${s.cmDrop} ${dragging ? s.cmDropOn : ""}`}
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileRef.current?.click())}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                  >
                    <FiUploadCloud />
                    <div>
                      <strong>Drag &amp; drop files here or choose files</strong>
                      <small>Images, Videos, PDFs (Max 10MB each)</small>
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {fileError && <small className={s.cmError}>{fileError}</small>}
                  {files.length > 0 && (
                    <ul className={s.cmFiles}>
                      {files.map((x) => (
                        <li key={x.id}>
                          {x.url ? (
                            <a href={x.url} target="_blank" rel="noreferrer" title={x.name}>{x.name}</a>
                          ) : (
                            <span title={x.name}>{x.name}</span>
                          )}
                          <small>{fileSize(x.size)}</small>
                          <button type="button" aria-label={`Remove ${x.name}`} onClick={() => { setFiles((l) => l.filter((y) => y.id !== x.id)); setDirty(true); }}>
                            <FiX />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Section>
          </div>

          <div className={s.cmCol}>
            {/* Performance & Updates */}
            <Section icon={<FiBarChart2 />} title="Performance & Updates" extra={<span className={s.cmBadge}><i /> Update regularly</span>}>
              <div data-field="perf">
                {editingUpdate && (
                  <p className={s.cmEditingNote}>
                    Editing update from <strong>{formatDate(updates.find((u) => u.id === editingUpdate)?.date ?? today)}</strong>
                    <button type="button" className={s.linkBtn} onClick={() => { setEditingUpdate(null); setPerf(EMPTY_PERF); setPerfErrors({}); }}>
                      Cancel edit
                    </button>
                  </p>
                )}
                <div className={s.cmGrid3}>
                  <F label="Amount Spent (₹)" req error={perfErrors.spent}>
                    <Affix icon="₹">
                      <input type="number" min={0} value={perf.spent} onChange={(e) => setP("spent", e.target.value)} placeholder="Enter amount spent" />
                    </Affix>
                  </F>
                  <F label="Results" req error={perfErrors.results}>
                    <input className={s.cmInput} type="number" min={0} value={perf.results} onChange={(e) => setP("results", e.target.value)} placeholder="Enter result value" />
                  </F>
                  <F label="Result Type" req error={perfErrors.resultUnit}>
                    <select
                      className={`${s.cmInput} ${!f.resultUnit ? s.cmPlaceholder : ""}`}
                      value={f.resultUnit}
                      onChange={(e) => { set("resultUnit", e.target.value); setPerfErrors((x) => ({ ...x, resultUnit: "" })); }}
                    >
                      <option value="">Select result type</option>
                      {RESULT_TYPES.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </F>

                  <F label="Leads Generated" error={perfErrors.leads}>
                    <Affix icon={<FiUser />}>
                      <input type="number" min={0} value={perf.leads} onChange={(e) => setP("leads", e.target.value)} placeholder="Enter number of leads" />
                    </Affix>
                  </F>
                  <F label="Cost Per Result (₹)" hint="Auto calculated">
                    <Affix icon="₹" readOnly>
                      <input readOnly tabIndex={-1} value={autoCpr !== undefined ? autoCpr.toFixed(2) : ""} placeholder="-" />
                    </Affix>
                  </F>
                  <F label="CTR (%)" hint="Auto calculated">
                    <Affix icon={<FiPercent />} readOnly>
                      <input readOnly tabIndex={-1} value={autoCtr !== undefined ? autoCtr.toFixed(2) : ""} placeholder="-" />
                    </Affix>
                  </F>

                  <F label="Reach" hint="Optional">
                    <Affix icon={<FiUsers />}>
                      <input type="number" min={0} value={perf.reach} onChange={(e) => setP("reach", e.target.value)} placeholder="-" />
                    </Affix>
                  </F>
                  <F label="Impressions" hint="Optional · used for CTR">
                    <Affix icon={<FiEye />}>
                      <input type="number" min={0} value={perf.impressions} onChange={(e) => setP("impressions", e.target.value)} placeholder="-" />
                    </Affix>
                  </F>
                  <F label="Link Clicks" hint="Optional · used for CTR" error={perfErrors.clicks}>
                    <Affix icon={<FiLink />}>
                      <input type="number" min={0} value={perf.clicks} onChange={(e) => setP("clicks", e.target.value)} placeholder="-" />
                    </Affix>
                  </F>
                </div>

                <div className={s.cmPerfActions}>
                  <button type="button" className={s.cmBtnPrimary} onClick={submitUpdate}>
                    <FiSend /> {editingUpdate ? "Save Update" : "Update Performance"}
                  </button>
                  <label className={`${s.cmCompleteBtn} ${f.status === "Completed" ? s.cmChecked : ""}`}>
                    <input type="checkbox" checked={f.status === "Completed"} onChange={(e) => set("status", e.target.checked ? "Completed" : "Running")} />
                    Mark as Completed
                  </label>
                </div>
              </div>
            </Section>

            {/* Past Updates */}
            <Section
              icon={<FiPieChart />}
              title="Past Updates"
              extra={
                sortedUpdates.length > 4 ? (
                  <button type="button" className={s.linkBtn} onClick={() => setShowAll((x) => !x)}>
                    {showAll ? "Show Less" : `View All (${sortedUpdates.length})`}
                  </button>
                ) : undefined
              }
            >
              <div className={s.tableScroll}>
                <table className={s.cmTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount Spent</th>
                      <th>Results</th>
                      <th>Leads</th>
                      <th>Cost/Result</th>
                      <th>CTR</th>
                      <th>Updated By</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((u) => {
                      const member = team.find((m) => m.name === u.by);
                      const cpr = entryCpr(u);
                      const ctr = entryCtr(u);
                      return (
                        <tr key={u.id} className={editingUpdate === u.id ? s.rowSelected : ""}>
                          <td>{formatDate(u.date)}</td>
                          <td>{formatINR(u.spent)}</td>
                          <td>{u.results.toLocaleString("en-IN")}</td>
                          <td>{u.leads.toLocaleString("en-IN")}</td>
                          <td>{cpr !== undefined ? formatINR(Math.round(cpr)) : "—"}</td>
                          <td>{ctr !== undefined ? `${ctr.toFixed(1)}%` : "—"}</td>
                          <td>
                            <span className={s.runByCell}>
                              <Avatar src={member?.avatar ?? null} name={u.by} size={22} />
                              {u.by}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={s.kebab}
                              aria-label={`Actions for update on ${formatDate(u.date)}`}
                              onClick={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                setMenu(menu?.id === u.id ? null : { id: u.id, top: r.bottom + 4, left: Math.max(8, r.right - 140) });
                              }}
                            >
                              <FiMoreVertical />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedUpdates.length === 0 && (
                      <tr>
                        <td colSpan={8} className={s.empty}>
                          No updates yet — enter spend &amp; results above and click <strong>Update Performance</strong>.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Current Summary */}
            <Section
              icon={<FiBarChart2 />}
              title="Current Summary"
              extra={
                <span className={s.cmSummaryMeta}>
                  <span className={`${s.pill} ${statusClass}`}>{previewStatus === "Active" ? "Running" : previewStatus}</span>
                  <span>{timeLeft}</span>
                </span>
              }
            >
              <div className={s.cmSummary}>
                <div className={s.cmStat}>
                  <span className={`${s.statIcon} ${s.icBlue}`}><span className={s.rupee}>₹</span></span>
                  <strong>{formatINR(totals.spent)}</strong>
                  <small>Total Spent</small>
                  <div className={s.bar}><i style={{ width: `${Math.min(100, spentPct)}%` }} className={spentPct > 100 ? s.barHot : ""} /></div>
                  <small className={spentPct > 100 ? s.cmOver : ""}>
                    {budgetNum ? `${spentPct}% of ${formatINR(budgetNum)}` : "Set a budget"}
                  </small>
                </div>
                <div className={s.cmStat}>
                  <span className={`${s.statIcon} ${s.icRed}`}><FiTarget /></span>
                  <strong>{totals.results.toLocaleString("en-IN")}</strong>
                  <small>Total Results</small>
                  <Change value={pctChange(latest?.results, previous?.results)} />
                </div>
                <div className={s.cmStat}>
                  <span className={`${s.statIcon} ${s.icTeal}`}><FiUsers /></span>
                  <strong>{totals.leads.toLocaleString("en-IN")}</strong>
                  <small>Leads Generated</small>
                  <Change value={pctChange(latest?.leads, previous?.leads)} />
                </div>
                <div className={s.cmStat}>
                  <span className={`${s.statIcon} ${s.icPurple}`}><FiTrendingUp /></span>
                  <strong>{totals.cpr !== undefined ? formatINR(Math.round(totals.cpr)) : "—"}</strong>
                  <small>Cost Per Result</small>
                  <Change value={latest && previous ? pctChange(entryCpr(latest), entryCpr(previous)) : undefined} goodWhenDown />
                </div>
                <div className={s.cmStat}>
                  <span className={`${s.statIcon} ${s.icViolet}`}><FiMousePointer /></span>
                  <strong>{totals.ctr !== undefined ? `${totals.ctr.toFixed(1)}%` : editing?.ctr !== undefined ? `${editing.ctr}%` : "—"}</strong>
                  <small>CTR</small>
                  <Change value={latest && previous ? pctChange(entryCtr(latest), entryCtr(previous)) : undefined} />
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/* ---------- Footer ---------- */}
        <footer className={s.cmFoot}>
          <button type="button" className={s.btnOutline} onClick={close}>
            Cancel
          </button>
          <button type="button" className={s.cmBtnPrimary} onClick={onCreate}>
            {editing ? <FiCheck /> : <FiPlus />} {editing ? "Save Changes" : "Create Campaign"}
          </button>
        </footer>

        {/* Row menu for Past Updates (fixed so it isn't clipped by the table) */}
        {menu && (
          <div className={`${s.popover} ${s.rowMenu}`} style={{ top: menu.top, left: menu.left, width: 140 }} role="menu" data-upd-menu>
            <button type="button" role="menuitem" onClick={() => { const u = updates.find((x) => x.id === menu.id); if (u) startEditUpdate(u); }}>
              <FiEdit2 /> Edit
            </button>
            <button type="button" role="menuitem" className={s.menuDanger} onClick={() => deleteUpdate(menu.id)}>
              <FiTrash2 /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
