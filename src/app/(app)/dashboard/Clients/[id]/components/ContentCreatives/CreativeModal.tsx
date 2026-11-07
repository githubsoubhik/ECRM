"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/CreativeModal.tsx
// "Add New Content Request" – brief for the Graphics Team.
// Two columns on desktop, one column on tablets, full screen on phones.

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckSquare,
  ChevronDown,
  CircleDashed,
  ClipboardList,
  Clock,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import rq from "./CreativeModal.module.css";
import { toKey } from "../../../../../../data/contentCalendarData";
import {
  ASSIGN_TEAMS,
  DEFAULT_THEME_COLORS,
  LANGUAGE_OPTIONS,
  OTHER_CHANNELS,
  PURPOSE_OPTIONS,
  TONE_OPTIONS,
  newCreativeId,
  type Creative,
  type CreativeFolder,
  type CreativeMedia,
  type CreativeType,
  type Platform,
  type RequestPriority,
} from "../../../../../../data/contentCreativesData";
import { PlatformIcon, cx, useClickOutside, useEscape } from "../ContentCalendar/ccUi";
import { CreativeThumb } from "./CreativeCard";
import { MAX_UPLOAD_MB, uploadMedia } from "./creativesApi";
import { generateCaption } from "./requestUtils";
import RequestPreview from "./RequestPreview";

export type ModalState = null | { mode: "add"; type?: CreativeType } | { mode: "edit"; creative: Creative };
export type SaveAction = "assign" | "calendar" | "draft";

export interface ClientInfo {
  name: string;
  logo: string | null;
  team: { name: string; role: string }[];
}

interface Props {
  state: Exclude<ModalState, null>;
  clientId: string;
  client: ClientInfo;
  folders: CreativeFolder[];
  campaigns: string[];
  defaultFolderId: string | null;
  onClose: () => void;
  onSave: (creative: Creative, mode: "add" | "edit", action: SaveAction) => void;
}

const TITLE_MAX = 100;
const CAPTION_MAX = 500;
const NOTES_MAX = 300;
const MAX_REFS = 10;
const MAX_COLORS = 6;

const CONTENT_TYPES: { value: CreativeType; label: string; Icon: typeof ImageIcon }[] = [
  { value: "Image", label: "Static Post", Icon: ImageIcon },
  { value: "Video", label: "Reel / Video", Icon: Clapperboard },
  { value: "Carousel", label: "Carousel", Icon: LayoutGrid },
  { value: "Story", label: "Story", Icon: CircleDashed },
];

const MAIN_CHANNELS = ["Instagram", "Facebook", "Meta", "YouTube"] as const;
const CHANNEL_LABEL: Record<string, string> = { Meta: "Meta (FB + IG)" };

const PRIORITIES: { value: RequestPriority; Icon: typeof ArrowDown }[] = [
  { value: "Low", Icon: ArrowDown },
  { value: "Normal", Icon: CheckSquare },
  { value: "High", Icon: AlertCircle },
];

interface Form {
  title: string;
  campaign: string;
  purpose: string;
  type: CreativeType;
  caption: string;
  tone: string;
  colors: string[];
  language: string;
  references: CreativeMedia[];
  sizeMB: number;
  channels: string[];
  publishDate: string;
  publishTime: string;
  autoCalendar: boolean;
  priority: RequestPriority;
  assignee: string;
  deadlineDate: string;
  deadlineTime: string;
  notes: string;
  draft: boolean;
}

const addDays = (key: string, days: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return toKey(new Date(y, m - 1, d + days));
};

function initialForm(state: Props["state"], today: string): Form {
  if (state.mode === "edit") {
    const c = state.creative;
    const b = c.brief;
    return {
      title: c.title,
      campaign: c.campaign ?? "",
      purpose: b?.purpose ?? "",
      type: c.type,
      caption: c.caption,
      tone: b?.tone ?? TONE_OPTIONS[0],
      colors: b?.colors.length ? b.colors : [...DEFAULT_THEME_COLORS],
      language: b?.language ?? "English",
      references: b?.references ?? c.media,
      sizeMB: c.sizeMB,
      channels: b?.channels.length ? b.channels : [...c.platforms],
      publishDate: c.date || addDays(today, 7),
      publishTime: c.time || "11:30",
      autoCalendar: b?.autoCalendar ?? true,
      priority: b?.priority ?? "Normal",
      assignee: b?.assignee ?? ASSIGN_TEAMS[0],
      deadlineDate: b?.deadlineDate ?? "",
      deadlineTime: b?.deadlineTime ?? "18:00",
      notes: b?.notes ?? "",
      draft: c.status === "Draft",
    };
  }
  return {
    title: "",
    campaign: "",
    purpose: "",
    type: state.type && CONTENT_TYPES.some((t) => t.value === state.type) ? state.type : "Image",
    caption: "",
    tone: TONE_OPTIONS[0],
    colors: [...DEFAULT_THEME_COLORS],
    language: "English",
    references: [],
    sizeMB: 0,
    channels: ["Instagram"],
    publishDate: addDays(today, 7),
    publishTime: "11:30",
    autoCalendar: true,
    priority: "Normal",
    assignee: ASSIGN_TEAMS[0],
    deadlineDate: addDays(today, 5),
    deadlineTime: "18:00",
    notes: "",
    draft: false,
  };
}

const toPlatforms = (channels: string[]): Platform[] => {
  const out = new Set<Platform>();
  channels.forEach((ch) => out.add(ch === "Instagram" || ch === "Facebook" || ch === "Meta" ? ch : "Other"));
  return out.size ? [...out] : ["Instagram"];
};

/* ── Small building blocks ───────────────────────────────── */

function Section({ n, title, sub, children, className }: { n: number; title: string; sub: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx(rq.section, className)}>
      <header className={rq.secHead}>
        <span className={rq.secNum}>{n}</span>
        <div>
          <h3>{title}</h3>
          <p>{sub}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className={rq.label}>
      {children}
      {required && <b>*</b>}
    </span>
  );
}

function ErrorText({ text }: { text?: string }) {
  return text ? <span className={rq.error}>{text}</span> : null;
}

function SelectBox({
  value,
  onChange,
  options,
  placeholder,
  invalid,
  icon,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
  icon?: ReactNode;
  ariaLabel: string;
}) {
  return (
    <span className={cx(rq.selectWrap, !!icon && rq.withIcon)}>
      {icon && <span className={rq.fieldIcon}>{icon}</span>}
      <select className={cx(rq.input, rq.select, !value && rq.placeholder, invalid && rq.invalid)} value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} data-invalid={invalid || undefined}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className={rq.selectChev} />
    </span>
  );
}

function YouTubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="YouTube">
      <rect width="24" height="24" rx="6.5" fill="#FF0000" />
      <path d="M10 8.3v7.4l6.1-3.7z" fill="#fff" />
    </svg>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "YouTube") return <YouTubeIcon />;
  if (channel === "Instagram" || channel === "Facebook" || channel === "Meta") return <PlatformIcon platform={channel} size={16} />;
  return <PlatformIcon platform="Other" size={16} />;
}

/* ── Main component ──────────────────────────────────────── */

export default function CreativeModal({ state, clientId, client, folders, campaigns, defaultFolderId, onClose, onSave }: Props) {
  const editing = state.mode === "edit" ? state.creative : null;
  const [today] = useState(() => toKey(new Date()));
  const [form, setForm] = useState<Form>(() => initialForm(state, today));
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiRound, setAiRound] = useState(0);
  const [otherOpen, setOtherOpen] = useState(false);
  const [addingColor, setAddingColor] = useState<number | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLDivElement>(null);
  const closeOther = useCallback(() => setOtherOpen(false), []);
  useClickOutside(otherRef, closeOther, otherOpen);

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm("Discard this content request? Your changes will be lost.")) return;
    onClose();
  }, [dirty, onClose]);
  useEscape(requestClose);

  const update = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
    const keys = Object.keys(patch);
    if (keys.some((k) => errors[k])) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))));
  };

  /* team list for "Assign To" */
  const assignOptions = [...ASSIGN_TEAMS, ...client.team.map((m) => `${m.name} (${m.role})`)];
  if (form.assignee && !assignOptions.includes(form.assignee)) assignOptions.push(form.assignee);
  const campaignOptions = form.campaign && !campaigns.includes(form.campaign) ? [form.campaign, ...campaigns] : campaigns;

  /* ── references upload ── */
  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    const room = MAX_REFS - form.references.length;
    if (room <= 0) return setErrors((e) => ({ ...e, references: `You can attach up to ${MAX_REFS} files` }));
    const list = Array.from(files);
    const tooBig = list.filter((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024).map((f) => f.name);
    const ok = list.filter((f) => !tooBig.includes(f.name)).slice(0, room);
    if (!ok.length) return setErrors((e) => ({ ...e, references: `Over ${MAX_UPLOAD_MB}MB: ${tooBig.join(", ")}` }));
    setUploading(true);
    try {
      const res = await uploadMedia(clientId, ok);
      setForm((f) => ({ ...f, references: [...f.references, ...res.media], sizeMB: Math.round((f.sizeMB + res.totalMB) * 10) / 10 }));
      setDirty(true);
      setErrors((e) => ({ ...e, references: tooBig.length ? `Skipped (over ${MAX_UPLOAD_MB}MB): ${tooBig.join(", ")}` : "" }));
    } catch (err) {
      setErrors((e) => ({ ...e, references: (err as Error).message }));
    } finally {
      setUploading(false);
    }
  };

  /* ── AI caption (template based – see requestUtils.ts) ── */
  const runAi = () => {
    setAiBusy(true);
    const round = aiRound;
    window.setTimeout(() => {
      update({
        caption: generateCaption(
          { title: form.title, purpose: form.purpose, tone: form.tone, language: form.language, clientName: client.name, type: form.type, round },
          CAPTION_MAX,
        ),
      });
      setAiRound(round + 1);
      setAiBusy(false);
    }, 550);
  };

  /* ── channels ── */
  const toggleChannel = (ch: string) =>
    update({ channels: form.channels.includes(ch) ? form.channels.filter((c) => c !== ch) : [...form.channels, ch] });
  const otherSelected = form.channels.filter((c) => !(MAIN_CHANNELS as readonly string[]).includes(c));

  /* ── validation & save ── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Content title is required";
    if (!form.draft) {
      if (!form.purpose) e.purpose = "Choose the purpose of this content";
      if (!form.caption.trim()) e.caption = "Add a caption or reference text";
      if (!form.channels.length) e.channels = "Select at least one platform";
      if (!form.publishDate) e.publishDate = "Pick a publish date";
      else if (!editing && form.publishDate < today) e.publishDate = "Publish date can't be in the past";
      if (!form.publishTime) e.publishTime = "Pick a time";
      if (!form.assignee) e.assignee = "Choose who will design this";
      if (!form.deadlineDate) e.deadlineDate = "Set a deadline for the team";
      else if (form.publishDate && `${form.deadlineDate} ${form.deadlineTime}` > `${form.publishDate} ${form.publishTime}`)
        e.deadlineDate = "Deadline must be before the publish date";
    }
    setErrors(e);
    const ok = !Object.values(e).some(Boolean);
    if (!ok) requestAnimationFrame(() => bodyRef.current?.querySelector('[data-invalid="true"]')?.scrollIntoView({ block: "center", behavior: "smooth" }));
    return ok;
  };

  const submit = (action: "assign" | "calendar") => {
    if (!validate()) return;
    const finalAction: SaveAction = form.draft ? "draft" : action;
    const prev = editing?.status;
    const status =
      finalAction === "draft"
        ? "Draft"
        : finalAction === "calendar"
          ? prev === "Published"
            ? "Published"
            : "Scheduled"
          : prev === "Published" || prev === "Scheduled"
            ? prev
            : "In Review";
    const refs = form.references;
    const creative: Creative = {
      id: editing?.id ?? newCreativeId(),
      title: form.title.trim(),
      type: form.type,
      platforms: toPlatforms(form.channels),
      status,
      date: form.publishDate || today,
      time: form.publishTime || "11:30",
      folderId: editing ? editing.folderId : defaultFolderId,
      campaign: form.campaign || null,
      caption: form.caption.trim(),
      tags: editing?.tags ?? (form.purpose ? [form.purpose.split(" ")[0]] : []),
      thumbnail: refs.find((m) => m.kind === "image")?.url ?? (refs.length ? "" : (editing?.thumbnail ?? "")),
      media: refs,
      durationSec: editing?.durationSec,
      sizeMB: form.sizeMB,
      createdBy: editing?.createdBy ?? "You",
      createdAt: editing?.createdAt ?? today,
      brief: {
        purpose: form.purpose,
        tone: form.tone,
        colors: form.colors,
        language: form.language,
        references: refs,
        channels: form.channels,
        priority: form.priority,
        assignee: form.assignee,
        deadlineDate: form.deadlineDate,
        deadlineTime: form.deadlineTime,
        notes: form.notes.trim(),
        autoCalendar: form.autoCalendar,
        calendarPostId: editing?.brief?.calendarPostId ?? null,
      },
    };
    onSave(creative, editing ? "edit" : "add", finalAction);
  };

  const folderName = editing ? folders.find((f) => f.id === editing.folderId)?.name : folders.find((f) => f.id === defaultFolderId)?.name;

  return (
    <div className={rq.overlay} onMouseDown={requestClose}>
      <div className={rq.modal} role="dialog" aria-modal="true" aria-labelledby="rq-title" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className={rq.head}>
          <span className={rq.headIcon}>
            <ClipboardList />
          </span>
          <div className={rq.headText}>
            <h2 id="rq-title">{editing ? "Edit Content Request" : "Add New Content Request"}</h2>
            <p>
              Submit a content brief for the Graphics Team to design and create.
              {folderName && <span className={rq.headFolder}> · Folder: {folderName}</span>}
            </p>
          </div>
          <button type="button" className={rq.close} onClick={requestClose} aria-label="Close">
            <X />
          </button>
        </header>

        <div className={rq.body} ref={bodyRef}>
          {/* ── Left column ── */}
          <div className={rq.col}>
            <Section n={1} title="Basic Information" sub="Provide key details about the content you want to create.">
              <div className={rq.row2}>
                <label className={rq.field}>
                  <Label required>Client</Label>
                  <span className={cx(rq.selectWrap, rq.withIcon)}>
                    <span className={rq.clientAvatar}>
                      {client.logo ? <CreativeThumb src={client.logo} alt="" className={rq.clientImg} /> : client.name.charAt(0)}
                    </span>
                    <select className={cx(rq.input, rq.select)} value={client.name} onChange={() => undefined} aria-label="Client">
                      <option value={client.name}>{client.name}</option>
                    </select>
                    <ChevronDown className={rq.selectChev} />
                  </span>
                </label>
                <label className={rq.field}>
                  <Label>Campaign (Optional)</Label>
                  <SelectBox
                    ariaLabel="Campaign"
                    value={form.campaign}
                    onChange={(v) => update({ campaign: v })}
                    placeholder="Select Campaign"
                    options={campaignOptions.map((c) => ({ value: c, label: c }))}
                  />
                </label>
              </div>

              <label className={rq.field}>
                <Label required>Content Title</Label>
                <span className={rq.inputWrap}>
                  <input
                    className={cx(rq.input, rq.withCounter, errors.title && rq.invalid)}
                    data-invalid={!!errors.title || undefined}
                    placeholder="e.g. Bridal Makeup Look - Traditional"
                    maxLength={TITLE_MAX}
                    value={form.title}
                    autoFocus
                    onChange={(e) => update({ title: e.target.value })}
                  />
                  <span className={rq.counter}>
                    {form.title.length}/{TITLE_MAX}
                  </span>
                </span>
                <ErrorText text={errors.title} />
              </label>

              <label className={rq.field}>
                <Label required>Purpose / Goal</Label>
                <SelectBox
                  ariaLabel="Purpose / Goal"
                  value={form.purpose}
                  onChange={(v) => update({ purpose: v })}
                  placeholder="Select purpose"
                  invalid={!!errors.purpose}
                  options={PURPOSE_OPTIONS.map((p) => ({ value: p, label: p }))}
                />
                <ErrorText text={errors.purpose} />
              </label>

              <div className={rq.field}>
                <Label required>Content Type</Label>
                <div className={rq.typeGrid} role="radiogroup" aria-label="Content type">
                  {CONTENT_TYPES.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={form.type === value}
                      className={cx(rq.typeBtn, form.type === value && rq.typeOn)}
                      onClick={() => update({ type: value })}
                    >
                      <Icon />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section n={2} title="Content Details & Instructions" sub="Share complete requirements so the design team can create the perfect content.">
              <div className={rq.field}>
                <div className={rq.labelRow}>
                  <Label required>Caption / Text (Reference)</Label>
                  <button type="button" className={rq.aiBtn} onClick={runAi} disabled={aiBusy} title="Write a caption from the title, purpose, tone and language">
                    {aiBusy ? <Loader2 className={rq.spin} /> : <Sparkles />}
                    {aiBusy ? "Writing…" : form.caption ? "Regenerate with AI" : "Generate with AI"}
                  </button>
                </div>
                <span className={rq.inputWrap}>
                  <textarea
                    className={cx(rq.input, rq.textarea, errors.caption && rq.invalid)}
                    data-invalid={!!errors.caption || undefined}
                    placeholder="Write the caption, text for the design, hashtags…"
                    maxLength={CAPTION_MAX}
                    value={form.caption}
                    onChange={(e) => update({ caption: e.target.value })}
                    aria-label="Caption / Text"
                  />
                  <span className={cx(rq.counter, rq.counterBottom)}>
                    {form.caption.length}/{CAPTION_MAX}
                  </span>
                </span>
                <ErrorText text={errors.caption} />
              </div>

              <div className={rq.row3}>
                <label className={rq.field}>
                  <Label>Tone / Style</Label>
                  <SelectBox ariaLabel="Tone / Style" value={form.tone} onChange={(v) => update({ tone: v })} options={TONE_OPTIONS.map((t) => ({ value: t, label: t }))} />
                </label>

                <div className={rq.field}>
                  <Label>Primary Color Theme</Label>
                  <div className={rq.swatches}>
                    {form.colors.map((c, i) => (
                      <span key={i} className={rq.swatch} style={{ background: c }}>
                        <input
                          type="color"
                          value={c}
                          aria-label={`Change color ${i + 1}`}
                          onChange={(e) => update({ colors: form.colors.map((x, j) => (j === i ? e.target.value : x)) })}
                        />
                        {form.colors.length > 1 && (
                          <button type="button" className={rq.swatchX} aria-label={`Remove color ${c}`} onClick={() => update({ colors: form.colors.filter((_, j) => j !== i) })}>
                            <X />
                          </button>
                        )}
                      </span>
                    ))}
                    {form.colors.length < MAX_COLORS && (
                      <label className={rq.swatchAdd} title="Add a color" onClick={() => setAddingColor(null)}>
                        <Plus />
                        <input
                          type="color"
                          defaultValue="#1f2ff2"
                          aria-label="Add color"
                          onChange={(e) => {
                            const v = e.target.value;
                            if (addingColor === null) {
                              setAddingColor(form.colors.length);
                              update({ colors: [...form.colors, v] });
                            } else {
                              update({ colors: form.colors.map((x, j) => (j === addingColor ? v : x)) });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <label className={rq.field}>
                  <Label>Language</Label>
                  <SelectBox ariaLabel="Language" value={form.language} onChange={(v) => update({ language: v })} options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))} />
                </label>
              </div>
            </Section>

            <Section n={3} title="Reference & Assets" sub="Attach reference images, brand assets, or any inspirations for the design team.">
              <div
                className={cx(rq.refGrid, dragOver && rq.refDrag)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                {form.references.map((m, i) => (
                  <div key={`${m.url}-${i}`} className={rq.refItem} title={m.name}>
                    {m.kind === "video" ? (
                      <video src={m.url} muted playsInline preload="metadata" className={rq.refMedia} />
                    ) : m.kind === "file" ? (
                      <span className={rq.refFile}>
                        <FileText />
                        <small>{m.name ?? "File"}</small>
                      </span>
                    ) : (
                      <CreativeThumb src={m.url} alt={m.name ?? `Reference ${i + 1}`} className={rq.refMedia} />
                    )}
                    <button type="button" className={rq.refX} aria-label="Remove file" onClick={() => update({ references: form.references.filter((_, j) => j !== i) })}>
                      <X />
                    </button>
                  </div>
                ))}
                {form.references.length < MAX_REFS && (
                  <button type="button" className={rq.uploadTile} onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className={rq.spin} /> : <Upload />}
                    <strong>{uploading ? "Uploading…" : "Upload Files"}</strong>
                    <small>(Images, PDF, etc.)</small>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
              <ErrorText text={errors.references} />
            </Section>

            <Section n={4} title="Publishing Plan" sub="When and where should this content be published?">
              <div className={rq.field}>
                <Label required>Platform(s)</Label>
                <div className={rq.channels} data-invalid={!!errors.channels || undefined}>
                  {MAIN_CHANNELS.map((ch) => {
                    const on = form.channels.includes(ch);
                    return (
                      <button key={ch} type="button" className={cx(rq.channel, on && rq.channelOn)} aria-pressed={on} onClick={() => toggleChannel(ch)}>
                        <span className={cx(rq.check, on && rq.checkOn)}>
                          <Check />
                        </span>
                        <ChannelIcon channel={ch} />
                        <span>{CHANNEL_LABEL[ch] ?? ch}</span>
                      </button>
                    );
                  })}
                  <div className={rq.otherWrap} ref={otherRef}>
                    <button
                      type="button"
                      className={cx(rq.channel, otherSelected.length > 0 && rq.channelOn)}
                      onClick={() => setOtherOpen((o) => !o)}
                      aria-expanded={otherOpen}
                      aria-haspopup="menu"
                    >
                      <span className={cx(rq.check, otherSelected.length > 0 && rq.checkOn)}>
                        <Check />
                      </span>
                      <span>{otherSelected.length ? `${otherSelected[0]}${otherSelected.length > 1 ? ` +${otherSelected.length - 1}` : ""}` : "Other"}</span>
                      <ChevronDown className={rq.otherChev} />
                    </button>
                    {otherOpen && (
                      <div className={rq.menu} role="menu">
                        {OTHER_CHANNELS.map((ch) => {
                          const on = form.channels.includes(ch);
                          return (
                            <button key={ch} type="button" role="menuitemcheckbox" aria-checked={on} className={rq.menuItem} onClick={() => toggleChannel(ch)}>
                              <span className={cx(rq.check, on && rq.checkOn)}>
                                <Check />
                              </span>
                              {ch}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <ErrorText text={errors.channels} />
              </div>

              <div className={rq.planRow}>
                <label className={rq.field}>
                  <Label required>Preferred Publish Date</Label>
                  <span className={cx(rq.inputWrap, rq.withIcon)}>
                    <CalendarDays className={rq.fieldIcon} />
                    <input
                      type="date"
                      className={cx(rq.input, errors.publishDate && rq.invalid)}
                      data-invalid={!!errors.publishDate || undefined}
                      value={form.publishDate}
                      min={editing ? undefined : today}
                      onChange={(e) => update({ publishDate: e.target.value })}
                    />
                  </span>
                  <ErrorText text={errors.publishDate} />
                </label>
                <label className={rq.field}>
                  <Label required>Preferred Time</Label>
                  <span className={cx(rq.inputWrap, rq.withIcon)}>
                    <Clock className={rq.fieldIcon} />
                    <input
                      type="time"
                      className={cx(rq.input, errors.publishTime && rq.invalid)}
                      data-invalid={!!errors.publishTime || undefined}
                      value={form.publishTime}
                      onChange={(e) => update({ publishTime: e.target.value })}
                    />
                  </span>
                  <ErrorText text={errors.publishTime} />
                </label>
                <label className={rq.toggleField}>
                  <span className={rq.switch}>
                    <input type="checkbox" checked={form.autoCalendar} onChange={(e) => update({ autoCalendar: e.target.checked })} />
                    <i />
                  </span>
                  <span>
                    <strong>Add to Content Calendar</strong>
                    <small>Auto add to calendar after approval</small>
                  </span>
                </label>
              </div>
            </Section>
          </div>

          {/* ── Right column ── */}
          <div className={rq.col}>
            <Section n={5} title="Content Preview (Reference)" sub="This is how the content may look (for reference only).">
              <RequestPreview
                title={form.title}
                caption={form.caption}
                purpose={form.purpose}
                colors={form.colors}
                references={form.references}
                clientName={client.name}
                clientLogo={client.logo}
                type={form.type}
              />
            </Section>

            <Section n={6} title="Workflow & Assignment" sub="Set priority and assign for the Graphics Team.">
              <div className={rq.field}>
                <Label>Priority</Label>
                <div className={rq.priorities} role="radiogroup" aria-label="Priority">
                  {PRIORITIES.map(({ value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={form.priority === value}
                      className={cx(rq.priority, rq[`p${value}`], form.priority === value && rq.priorityOn)}
                      onClick={() => update({ priority: value })}
                    >
                      <Icon />
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className={rq.field}>
                <Label required>Assign To</Label>
                <SelectBox
                  ariaLabel="Assign to"
                  icon={<Users />}
                  value={form.assignee}
                  onChange={(v) => update({ assignee: v })}
                  placeholder="Select team or member"
                  invalid={!!errors.assignee}
                  options={assignOptions.map((a) => ({ value: a, label: a }))}
                />
                <ErrorText text={errors.assignee} />
              </label>

              <div className={rq.field}>
                <Label required>Deadline</Label>
                <div className={cx(rq.row2, rq.keep)}>
                  <span className={cx(rq.inputWrap, rq.withIcon)}>
                    <CalendarDays className={rq.fieldIcon} />
                    <input
                      type="date"
                      className={cx(rq.input, errors.deadlineDate && rq.invalid)}
                      data-invalid={!!errors.deadlineDate || undefined}
                      value={form.deadlineDate}
                      max={form.publishDate || undefined}
                      onChange={(e) => update({ deadlineDate: e.target.value })}
                      aria-label="Deadline date"
                    />
                  </span>
                  <span className={cx(rq.inputWrap, rq.withIcon)}>
                    <Clock className={rq.fieldIcon} />
                    <input type="time" className={rq.input} value={form.deadlineTime} onChange={(e) => update({ deadlineTime: e.target.value })} aria-label="Deadline time" />
                  </span>
                </div>
                <ErrorText text={errors.deadlineDate} />
              </div>

              <label className={rq.field}>
                <Label>Additional Notes (Internal)</Label>
                <span className={rq.inputWrap}>
                  <textarea
                    className={cx(rq.input, rq.textarea, rq.notes)}
                    placeholder="Any special instructions for the design team..."
                    maxLength={NOTES_MAX}
                    value={form.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                  />
                  <span className={cx(rq.counter, rq.counterBottom)}>
                    {form.notes.length}/{NOTES_MAX}
                  </span>
                </span>
              </label>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <footer className={rq.foot}>
          <label className={rq.draftCheck}>
            <input type="checkbox" checked={form.draft} onChange={(e) => update({ draft: e.target.checked })} />
            <span className={cx(rq.check, form.draft && rq.checkOn)}>
              <Check />
            </span>
            Save as Draft
          </label>
          <div className={rq.footBtns}>
            <button type="button" className={rq.btnGhost} onClick={requestClose}>
              Cancel
            </button>
            <button type="button" className={rq.btnSoft} onClick={() => submit("assign")} disabled={uploading}>
              <Send /> {form.draft ? "Save Draft" : "Save & Assign"}
            </button>
            <button type="button" className={rq.btnPrimary} onClick={() => submit("calendar")} disabled={uploading || form.draft} title={form.draft ? "Untick “Save as Draft” to add it to the calendar" : undefined}>
              <CalendarPlus /> Save &amp; Add to Calendar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
