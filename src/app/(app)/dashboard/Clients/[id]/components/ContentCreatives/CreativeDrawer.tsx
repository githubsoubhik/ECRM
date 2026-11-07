"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/CreativeDrawer.tsx
// Right-side "Creative Details" panel (full screen on phones)

import { useState } from "react";
import { ArrowLeft, CalendarCheck, CalendarDays, ClipboardList, Clock, Copy, Download, FileText, Folder, HardDrive, Megaphone, Pencil, Play, Tag, Trash2, User, X } from "lucide-react";
import rq from "./CreativeModal.module.css";
import styles from "./ContentCreatives.module.css";
import { formatShort, to12h } from "../../../../../../data/contentCalendarData";
import {
  CREATIVE_STATUSES,
  STATUS_DOT,
  formatDuration,
  formatSize,
  type Creative,
  type CreativeFolder,
  type CreativeStatus,
} from "../../../../../../data/contentCreativesData";
import { PlatformIcons, StatusPill, cx, useEscape } from "../ContentCalendar/ccUi";
import { CreativeThumb, TypeBadge } from "./CreativeCard";

interface Props {
  creative: Creative;
  folders: CreativeFolder[];
  campaigns: string[];
  focusFolder?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onChange: (c: Creative) => void;
}

function Caption({ text }: { text: string }) {
  return (
    <p className={styles.caption}>
      {text.split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className={styles.hashtag}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export default function CreativeDrawer({ creative: c, folders, campaigns, focusFolder, onClose, onEdit, onDuplicate, onDelete, onChange }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEscape(onClose);

  const media = c.media.length ? c.media : [{ url: c.thumbnail, kind: "image" as const }];
  const current = media[Math.min(index, media.length - 1)];
  const isVideoFile = current.kind === "video" && !!current.url;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Creative details" onMouseDown={(e) => e.stopPropagation()}>
        <header className={styles.drawerHead}>
          <button type="button" className={styles.plainIcon} onClick={onClose} aria-label="Back">
            <ArrowLeft />
          </button>
          <h3>Creative Details</h3>
          <button type="button" className={styles.plainIcon} onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>

        <div className={styles.drawerBody}>
          {/* Preview */}
          <div className={styles.preview}>
            {isVideoFile && playing ? (
              <video src={current.url} controls autoPlay playsInline className={styles.previewMedia} />
            ) : (
              <>
                <CreativeThumb src={current.kind === "image" ? current.url : c.thumbnail} alt={c.title} className={styles.previewMedia} />
                {c.type === "Video" && (
                  <button
                    type="button"
                    className={styles.previewPlay}
                    onClick={() => setPlaying(true)}
                    disabled={!isVideoFile}
                    title={isVideoFile ? "Play video" : "Video file not uploaded yet – showing cover"}
                  >
                    <Play />
                  </button>
                )}
              </>
            )}
            <TypeBadge type={c.type} />
            <span className={styles.cardPlatform}>
              <PlatformIcons platforms={c.platforms.slice(0, 1)} size={26} />
            </span>
            {c.durationSec ? <span className={styles.duration}>{formatDuration(c.durationSec)}</span> : null}
          </div>
          {media.length > 1 && (
            <div className={styles.previewStrip}>
              {media.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  className={cx(styles.stripItem, i === index && styles.stripOn)}
                  onClick={() => {
                    setIndex(i);
                    setPlaying(false);
                  }}
                  aria-label={`Show file ${i + 1}`}
                >
                  <CreativeThumb src={m.kind === "image" ? m.url : c.thumbnail} alt="" className={styles.cardImg} />
                </button>
              ))}
            </div>
          )}

          {/* Title + actions */}
          <div className={styles.detTitleRow}>
            <div>
              <h4 className={styles.detTitle}>{c.title}</h4>
              <span className={styles.detSub}>
                {c.type} · {c.platforms.join(", ")}
              </span>
            </div>
            <StatusPill status={c.status} />
          </div>

          <div className={styles.detActions}>
            <button type="button" className={styles.actBtn} onClick={onEdit}><Pencil /> Edit</button>
            <button type="button" className={styles.actBtn} onClick={onDuplicate}><Copy /> Duplicate</button>
            <a className={styles.actBtn} href={current.url || c.thumbnail} download={current.name ?? c.title} target="_blank" rel="noreferrer">
              <Download /> Download
            </a>
          </div>

          {/* Status */}
          <section className={styles.detCard}>
            <h5 className={styles.detCardHead}>Status</h5>
            <div className={styles.statusPick}>
              {CREATIVE_STATUSES.map((s: CreativeStatus) => (
                <button
                  key={s}
                  type="button"
                  className={cx(styles.statusOpt, c.status === s && styles.statusOptOn)}
                  onClick={() => c.status !== s && onChange({ ...c, status: s })}
                  aria-pressed={c.status === s}
                >
                  <i style={{ background: STATUS_DOT[s] }} />
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* Details */}
          <section className={styles.detCard}>
            <h5 className={styles.detCardHead}>Details</h5>
            <dl className={styles.detGrid}>
              <div>
                <dt><CalendarDays /> Post date</dt>
                <dd>{c.date ? formatShort(c.date) : "—"}</dd>
              </div>
              <div>
                <dt><Clock /> Time</dt>
                <dd>{c.time ? to12h(c.time) : "—"}</dd>
              </div>
              <div className={styles.detWide}>
                <dt><Folder /> Folder</dt>
                <dd>
                  <select
                    className={cx(styles.select, styles.selectFull, focusFolder && styles.selectFocus)}
                    value={c.folderId ?? ""}
                    autoFocus={focusFolder}
                    onChange={(e) => onChange({ ...c, folderId: e.target.value || null })}
                    aria-label="Folder"
                  >
                    <option value="">Uncategorised</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div className={styles.detWide}>
                <dt><Megaphone /> Campaign</dt>
                <dd>
                  <select
                    className={cx(styles.select, styles.selectFull)}
                    value={c.campaign ?? ""}
                    onChange={(e) => onChange({ ...c, campaign: e.target.value || null })}
                    aria-label="Campaign"
                  >
                    <option value="">No campaign</option>
                    {campaigns.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt><HardDrive /> Size</dt>
                <dd>{formatSize(c.sizeMB)}</dd>
              </div>
              <div>
                <dt><User /> Created by</dt>
                <dd>{c.createdBy}</dd>
              </div>
            </dl>
          </section>

          {c.brief && (
            <section className={styles.detCard}>
              <h5 className={styles.detCardHead}><ClipboardList /> Content Brief</h5>
              <div className={rq.brief}>
                <dl className={rq.briefGrid}>
                  <div>
                    <dt>Purpose</dt>
                    <dd>{c.brief.purpose || "—"}</dd>
                  </div>
                  <div>
                    <dt>Priority</dt>
                    <dd>
                      <span className={cx(rq.briefPriority, rq[`brief${c.brief.priority}`])}>{c.brief.priority}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Assigned to</dt>
                    <dd>{c.brief.assignee || "—"}</dd>
                  </div>
                  <div>
                    <dt>Deadline</dt>
                    <dd>{c.brief.deadlineDate ? `${formatShort(c.brief.deadlineDate)}, ${to12h(c.brief.deadlineTime)}` : "—"}</dd>
                  </div>
                  <div>
                    <dt>Tone / Style</dt>
                    <dd>{c.brief.tone || "—"}</dd>
                  </div>
                  <div>
                    <dt>Language</dt>
                    <dd>{c.brief.language || "—"}</dd>
                  </div>
                  {c.brief.colors.length > 0 && (
                    <div>
                      <dt>Color theme</dt>
                      <dd className={rq.briefColors}>
                        {c.brief.colors.map((col, i) => (
                          <i key={i} style={{ background: col }} title={col} />
                        ))}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Channels</dt>
                    <dd>{c.brief.channels.join(", ") || "—"}</dd>
                  </div>
                </dl>
                {c.brief.notes && <p className={rq.briefNotes}>{c.brief.notes}</p>}
                {c.brief.references.length > 0 && (
                  <div className={rq.briefRefs}>
                    {c.brief.references.map((m, i) =>
                      m.kind === "file" ? (
                        <a key={i} href={m.url} target="_blank" rel="noreferrer" className={rq.refFile} title={m.name}>
                          <FileText />
                        </a>
                      ) : (
                        <CreativeThumb key={i} src={m.kind === "image" ? m.url : c.thumbnail} alt={m.name ?? ""} className={rq.refMedia} />
                      ),
                    )}
                  </div>
                )}
                {c.brief.calendarPostId ? (
                  <span className={rq.briefCal}><CalendarCheck /> On the Content Calendar</span>
                ) : c.brief.autoCalendar ? (
                  <span className={styles.muted}>Will be added to the Content Calendar once approved (Scheduled / Published).</span>
                ) : null}
              </div>
            </section>
          )}

          <section className={styles.detCard}>
            <h5 className={styles.detCardHead}><FileText /> Caption</h5>
            {c.caption ? <Caption text={c.caption} /> : <p className={styles.muted}>No caption yet.</p>}
          </section>

          {c.tags.length > 0 && (
            <section className={styles.detCard}>
              <h5 className={styles.detCardHead}><Tag /> Tags</h5>
              <div className={styles.tagRow}>
                {c.tags.map((t) => (
                  <span key={t} className={styles.tagChip}>{t}</span>
                ))}
              </div>
            </section>
          )}

          <button type="button" className={styles.deleteBtn} onClick={onDelete}>
            <Trash2 /> Delete creative
          </button>
        </div>
      </aside>
    </div>
  );
}
