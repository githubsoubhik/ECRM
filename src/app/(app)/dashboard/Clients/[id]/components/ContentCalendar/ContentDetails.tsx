"use client";

// Content Details view (shown inside the right drawer)
import { useCallback, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  CalendarClock,
  CalendarDays,
  Clock,
  Copy,
  Eye,
  FileText,
  Heart,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Tag,
  Trash2,
  X,
  Zap,
  LayoutList,
} from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  STATUSES,
  STATUS_META,
  formatShort,
  platformLabel,
  to12h,
  typeLabel,
  type ContentPost,
  type MediaItem,
  type PostStatus,
} from "../../../../../../data/contentCalendarData";
import { PlatformIcon, PlatformIcons, StatusPill, Thumb, cx, initials, readFilesAsMedia, useClickOutside } from "./ccUi";

interface Props {
  post: ContentPost;
  onBack?: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStatus: (s: PostStatus) => void;
  onReschedule: (date: string, time: string) => void;
  onAddComment: (text: string) => void;
  onAddMedia: (media: MediaItem[]) => void;
  onRemoveMedia: (index: number) => void;
}

type Tab = "details" | "performance" | "comments" | "history";

const fmtNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

function Caption({ text }: { text: string }) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/gu);
  return (
    <p className={styles.caption}>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className={styles.hashtag}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export default function ContentDetails(props: Props) {
  const { post } = props;
  const [tab, setTab] = useState<Tab>("details");
  const [moreOpen, setMoreOpen] = useState(false);
  const [resched, setResched] = useState(false);
  const [rDate, setRDate] = useState(post.date);
  const [rTime, setRTime] = useState(post.time);
  const [comment, setComment] = useState("");
  const [mediaError, setMediaError] = useState("");
  const moreRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  useClickOutside(moreRef, closeMore, moreOpen);

  const p = post.performance;
  const engagement = p.reach ? (((p.likes + p.comments + p.shares + p.saves) / p.reach) * 100).toFixed(1) : "0.0";

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const { media, rejected } = await readFilesAsMedia(files);
    if (media.length) props.onAddMedia(media);
    setMediaError(rejected.length ? `Skipped (over 50MB): ${rejected.join(", ")}` : "");
  };

  const submitComment = () => {
    const t = comment.trim();
    if (!t) return;
    props.onAddComment(t);
    setComment("");
  };

  const MoreMenu = (
    <div className={styles.menu} style={{ top: "calc(100% + 6px)", right: 0 }}>
      <div className={styles.popoverTitle}>Change status</div>
      {STATUSES.map((s) => (
        <button
          type="button"
          key={s}
          className={styles.menuItem}
          onClick={() => {
            setMoreOpen(false);
            props.onStatus(s);
          }}
        >
          <i className={styles.pillDot} style={{ background: STATUS_META[s].color }} />
          {s}
          {post.status === s && <span className={styles.menuCheck}>✓</span>}
        </button>
      ))}
      <div className={styles.menuSep} />
      <button type="button" className={styles.menuItem} onClick={() => { setMoreOpen(false); setTab("details"); setResched(true); }}>
        <CalendarClock /> Reschedule
      </button>
      <button type="button" className={cx(styles.menuItem, styles.menuDanger)} onClick={() => { setMoreOpen(false); props.onDelete(); }}>
        <Trash2 /> Delete post
      </button>
    </div>
  );

  return (
    <>
      <div className={styles.detHeader}>
        <button
          type="button"
          className={styles.plainIcon}
          onClick={props.onBack ?? props.onClose}
          aria-label={props.onBack ? "Back to day" : "Close"}
        >
          <ArrowLeft />
        </button>
        <h3 className={styles.detHeaderTitle}>Content Details</h3>
        <button type="button" className={styles.plainIcon} onClick={props.onClose} aria-label="Close">
          <X />
        </button>
      </div>

      <div className={styles.drawerBody}>
        {/* Hero */}
        <div className={styles.detHero}>
          <div className={styles.detHeroMedia}>
            <Thumb media={post.media[0]} className={styles.detHeroThumb} />
            <span className={styles.detHeroBadge}>
              <PlatformIcon platform={post.platforms[0] ?? "Other"} size={24} />
            </span>
          </div>
          <div className={styles.detHeroInfo}>
            <h4 className={styles.detTitle}>{post.title}</h4>
            <span className={styles.detSub}>
              {typeLabel(post.type)} | {platformLabel(post.platforms)}
            </span>
            <StatusPill status={post.status} />
            <span className={styles.detDate}>
              <CalendarDays /> {formatShort(post.date)}, {to12h(post.time)}
            </span>
          </div>
        </div>

        <div className={styles.detActions}>
          <button type="button" className={styles.actBtn} onClick={props.onEdit}>
            <Pencil /> Edit
          </button>
          <button type="button" className={styles.actBtn} onClick={props.onDuplicate}>
            <Copy /> Duplicate
          </button>
          <div className={styles.moreWrap} ref={moreRef}>
            <button type="button" className={styles.actBtn} onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen}>
              <MoreHorizontal /> More
            </button>
            {moreOpen && MoreMenu}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.detTabs} role="tablist">
          {(
            [
              ["details", "Details"],
              ["performance", "Performance"],
              ["comments", `Comments (${post.comments.length})`],
              ["history", "History"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              type="button"
              role="tab"
              key={id}
              aria-selected={tab === id}
              className={cx(styles.detTab, tab === id && styles.detTabActive)}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Details ── */}
        {tab === "details" && (
          <>
            <section className={styles.card}>
              <h5 className={styles.cardHead}>
                <span className={styles.cardIcon}><FileText /></span> Caption
              </h5>
              {post.caption ? <Caption text={post.caption} /> : <p className={styles.muted}>No caption yet.</p>}
            </section>

            <section className={styles.card}>
              <h5 className={styles.cardHead}>
                <span className={styles.cardIcon}><ImageIcon /></span> Media
              </h5>
              <div className={styles.mediaGrid}>
                {post.media.map((m, i) => (
                  <div key={i} className={styles.mediaTile}>
                    <Thumb media={m} className={styles.mediaThumb} />
                    <button
                      type="button"
                      className={styles.mediaRemove}
                      aria-label="Remove media"
                      onClick={() => props.onRemoveMedia(i)}
                    >
                      <X />
                    </button>
                  </div>
                ))}
                <button type="button" className={styles.mediaAdd} onClick={() => fileRef.current?.click()}>
                  <Plus /> Add More
                </button>
              </div>
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
              {mediaError && <p className={styles.error}>{mediaError}</p>}
            </section>

            <section className={styles.card}>
              <h5 className={styles.cardHead}>
                <PlatformIcons platforms={post.platforms} size={26} /> Platform
              </h5>
              <div className={styles.platformRow}>{platformLabel(post.platforms)}</div>
            </section>

            {post.tags.length > 0 && (
              <section className={styles.card}>
                <h5 className={styles.cardHead}>
                  <span className={styles.cardIcon}><Tag /></span> Tags / Category
                </h5>
                <div className={styles.tagRow}>
                  {post.tags.map((t) => (
                    <span key={t} className={styles.tagChip}>{t}</span>
                  ))}
                </div>
              </section>
            )}

            <section className={styles.card}>
              <h5 className={styles.cardHead}>
                <span className={styles.cardIcon}><LayoutList /></span> Status &amp; Schedule
              </h5>
              <div className={styles.scheduleRow}>
                <StatusPill status={post.status} />
                <span className={styles.scheduleItem}><CalendarDays /> {formatShort(post.date)}</span>
                <span className={styles.scheduleItem}><Clock /> {to12h(post.time)}</span>
              </div>
              {resched && (
                <div className={styles.rescheduleRow}>
                  <input type="date" className={styles.input} value={rDate} onChange={(e) => setRDate(e.target.value)} />
                  <input type="time" className={styles.input} value={rTime} onChange={(e) => setRTime(e.target.value)} />
                  <button
                    type="button"
                    className={styles.smallBtn}
                    disabled={!rDate || !rTime}
                    onClick={() => {
                      props.onReschedule(rDate, rTime);
                      setResched(false);
                    }}
                  >
                    Save
                  </button>
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h5 className={styles.cardHead}>
                <span className={styles.cardIcon}><Zap /></span> Quick Actions
              </h5>
              <div className={styles.quickGrid}>
                <button type="button" className={styles.quickBtn} onClick={props.onEdit}>
                  <Pencil /> Edit
                </button>
                <button type="button" className={styles.quickBtn} onClick={() => setResched((r) => !r)}>
                  <CalendarClock /> Reschedule
                </button>
                <button
                  type="button"
                  className={styles.quickBtn}
                  disabled={post.status === "Draft"}
                  onClick={() => props.onStatus("Draft")}
                >
                  <FileText /> Mark as Draft
                </button>
                <button type="button" className={cx(styles.quickBtn, styles.quickDanger)} onClick={props.onDelete}>
                  <Trash2 /> Delete
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── Performance ── */}
        {tab === "performance" &&
          (post.status !== "Published" ? (
            <div className={styles.perfNote}>
              <BarChart3 />
              <strong>No performance data yet</strong>
              <span>Insights will appear here once this post is published.</span>
            </div>
          ) : (
            <>
              <div className={styles.perfGrid}>
                {[
                  { label: "Reach", value: p.reach, icon: Eye },
                  { label: "Likes", value: p.likes, icon: Heart },
                  { label: "Comments", value: p.comments, icon: MessageCircle },
                  { label: "Shares", value: p.shares, icon: Share2 },
                  { label: "Saves", value: p.saves, icon: Bookmark },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className={styles.perfTile}>
                    <Icon />
                    <span className={styles.perfValue}>{fmtNum(value)}</span>
                    <span className={styles.perfLabel}>{label}</span>
                  </div>
                ))}
                <div className={cx(styles.perfTile, styles.perfTileAccent)}>
                  <BarChart3 />
                  <span className={styles.perfValue}>{engagement}%</span>
                  <span className={styles.perfLabel}>Engagement Rate</span>
                </div>
              </div>
            </>
          ))}

        {/* ── Comments ── */}
        {tab === "comments" && (
          <>
            <div className={styles.commentList}>
              {post.comments.length === 0 && <p className={styles.sideEmpty}>No comments yet – start the conversation.</p>}
              {post.comments.map((c) => (
                <div key={c.id} className={styles.comment}>
                  <span className={styles.commentAvatar}>{initials(c.author)}</span>
                  <div className={styles.commentBody}>
                    <strong>{c.author}</strong>
                    <span>{c.time}</span>
                    <p>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.commentForm}>
              <input
                className={styles.input}
                placeholder="Write a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
              />
              <button type="button" className={styles.smallBtn} onClick={submitComment}>
                Post
              </button>
            </div>
          </>
        )}

        {/* ── History ── */}
        {tab === "history" && (
          <ul className={styles.timeline}>
            {[...post.history].reverse().map((h) => (
              <li key={h.id} className={styles.timelineItem}>
                <strong>{h.action}</strong>
                <span>
                  {h.by} · {h.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
