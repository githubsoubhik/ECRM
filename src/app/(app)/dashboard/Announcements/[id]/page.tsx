"use client";

// src/app/dashboard/Announcements/[id]/page.tsx
// One announcement, full page: banner image(s), message, attachments (view + download),
// key date, details and related announcements. Opened from a card on /dashboard/Announcements.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Download,
  Eye,
  Flag,
  LayoutList,
  Megaphone,
  Paperclip,
  Pin,
  Users,
} from "lucide-react";
import { AnnouncementLogo } from "../../../components/announcements/AnnouncementLogo";
import {
  VIEWS_EVENT,
  announcementFeed,
  audienceLabel,
  browserViewerKey,
  categoryLabel,
  categoryOf,
  fmtDate,
  fmtSize,
  isImageFile,
  loadAnnouncements,
  people,
  recordView,
  sanitizeHtml,
  viewCount,
  type Announcement,
  type Person,
} from "../../../../data/announcementData";
import { FileBadge, authorOf } from "../_components/AnnouncementCard";
import FileViewer from "../_components/FileViewer";
import { FileDownload, FileImage } from "../../../components/announcements/FileSource";
import { feedStatus, listHref, noticeHref, splitDateTime, tabOf, themeOf } from "../_components/feed";
import { Avatar, cx, useIsClient, useViewerId } from "../_components/ui";
import base from "../announcements.module.css";
import s from "./notice.module.css";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ordinal = (n: number) => (n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th"));
// "2026-08-15" → "Friday, 15th August 2026"
function longDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS[date.getDay()]}, ${d}${ordinal(d)} ${MONTHS[m - 1]} ${y}`;
}
const daysBetween = (from: string, to: string) => Math.round((new Date(`${to}T00:00`).getTime() - new Date(`${from}T00:00`).getTime()) / 86_400_000);

const subscribeViews = (cb: () => void) => {
  window.addEventListener(VIEWS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(VIEWS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

export default function AnnouncementNoticePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id ?? ""));
  const ready = useIsClient();
  const viewerId = useViewerId();
  const [version, setVersion] = useState(0);
  const [tick, setTick] = useState(0);
  const [fileIndex, setFileIndex] = useState<number | null>(null);
  const [broken, setBroken] = useState<string[]>([]); // images that couldn't be loaded

  // Stay in sync with changes from Announcement Management (another tab) and scheduled times.
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    const refresh = () => setVersion((n) => n + 1);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [tick, version]);
  const list = useMemo(() => (ready ? people() : []), [ready]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const all = useMemo(() => (ready ? loadAnnouncements() : []), [ready, version]);
  const found = all.find((x) => x.id === id);
  // Hidden when cancelled, or when viewing as an employee who wasn't a recipient.
  const a = found && !found.cancelledAt && (!viewerId || found.recipientIds.includes(viewerId)) ? found : undefined;
  const published = !!a && new Date(a.sendAt) <= now;

  // Count this visit once per viewer (only after it has been sent).
  useEffect(() => {
    if (a && published) recordView(a.id, viewerId ?? browserViewerKey());
  }, [a, published, viewerId]);
  const views = useSyncExternalStore(
    subscribeViews,
    () => (a ? viewCount(a.id) : 0),
    () => 0,
  );

  const related = useMemo(() => {
    if (!a || !ready) return [];
    const pool = announcementFeed(viewerId, now).published.filter((x) => x.id !== a.id);
    const cat = categoryOf(a);
    return [...pool.filter((x) => categoryOf(x) === cat), ...pool.filter((x) => categoryOf(x) !== cat)].slice(0, 3);
  }, [a, ready, viewerId, now]);

  const closeViewer = useCallback(() => setFileIndex(null), []);
  const markBroken = useCallback((id: string) => setBroken((prev) => (prev.includes(id) ? prev : [...prev, id])), []);

  if (!ready) {
    return (
      <div className={cx(base.page, s.notice)}>
        <p className={base.loading}>Loading announcement…</p>
      </div>
    );
  }
  if (!a) return <NotFound viewerId={viewerId} />;

  const cat = categoryOf(a);
  const theme = themeOf(a);
  const status = feedStatus(a, now);
  const author = authorOf(a, list);
  const sent = splitDateTime(a.sendAt);
  const files = a.attachments;
  // Viewer list = cover image (if any) + attachments. Banner = cover image, else the first attached image.
  const cover = a.cover?.url ? a.cover : null;
  const viewFiles = cover ? [cover, ...files] : files;
  const offset = cover ? 1 : 0;
  const attachedImages = published ? files.map((f, i) => ({ f, i: i + offset })).filter(({ f }) => f.url && isImageFile(f) && !broken.includes(f.id)) : [];
  const banner = !published ? undefined : cover && !broken.includes(cover.id) ? { f: cover, i: 0 } : attachedImages[0];
  const gallery = attachedImages.filter((x) => x !== banner);
  const isFlag = a.logo?.kind === "symbol" && a.logo.symbol === "india-flag";
  const vars = { "--badge": theme.badge, "--ink": theme.ink, "--tile": theme.tile } as CSSProperties;

  return (
    <div className={cx(base.page, s.notice)} style={vars}>
      <nav className={s.crumb} aria-label="Breadcrumb">
        <Link href="/dashboard">Home</Link>
        <ChevronRight size={13} />
        <Link href={listHref(undefined, viewerId)}>Announcements</Link>
        <ChevronRight size={13} />
        <span>{a.title}</span>
      </nav>

      <div className={s.grid}>
        {/* ---------------- Main column ---------------- */}
        <main className={s.main}>
          <Link href={listHref(undefined, viewerId)} className={s.back}>
            <ArrowLeft size={16} /> Back to announcements
          </Link>
          <h1 className={s.title}>{a.title}</h1>
          <div className={s.tags}>
            <span className={s.catTag}>
              {cat === "Company Wide" ? <Megaphone size={15} /> : <LayoutList size={15} />} {categoryLabel(cat)}
            </span>
            {a.pinned && status !== "expired" && (
              <span className={s.pinTag}>
                <Pin size={14} /> Pinned
              </span>
            )}
            {a.urgent && (
              <span className={s.urgentTag}>
                <CircleAlert size={14} /> Urgent
              </span>
            )}
            {status === "upcoming" && (
              <span className={s.upcomingTag}>
                <Clock3 size={14} /> Upcoming
              </span>
            )}
            {status === "expired" && <span className={s.expiredTag}>Expired</span>}
          </div>

          <article className={s.card}>
            {/* Images uploaded with the announcement: the first is the banner, the rest a gallery. */}
            {banner && (
              <button className={s.banner} onClick={() => setFileIndex(banner.i)} aria-label={`View image ${banner.f.name}`}>
                <FileImage file={banner.f} alt={banner.f.name} onMissing={() => markBroken(banner.f.id)} />
              </button>
            )}
            {gallery.length > 0 && (
              <div className={s.gallery}>
                {gallery.map(({ f, i }) => (
                  <button key={f.id} onClick={() => setFileIndex(i)} aria-label={`View image ${f.name}`}>
                    <FileImage file={f} alt={f.name} onMissing={() => markBroken(f.id)} />
                  </button>
                ))}
              </div>
            )}

            <div className={s.meta}>
              <span className={s.metaAuthor}>
                <Avatar name={author.name} photoUrl={author.photoUrl} size={44} />
                <span>
                  <b>{author.name}</b>
                  {author.role && <small>{author.role}</small>}
                </span>
              </span>
              <span className={s.metaItem}>
                <CalendarDays size={20} />
                <span>
                  <b>
                    {sent.date}, {sent.time}
                  </b>
                  <small>{published ? "Created on" : "Publishes on"}</small>
                </span>
              </span>
              <span className={s.metaItem}>
                <Eye size={20} />
                <span>
                  <b>{views}</b>
                  <small>{views === 1 ? "" : "Views"}</small>
                </span>
              </span>
              <span className={cx(s.metaItem, s.metaAudience)}>
                <Users size={20} />
                <span>
                  <b>{audienceLabel(a.audience, list)}</b>
                  <small>Target Audience</small>
                </span>
              </span>
            </div>

            {published ? (
              <div className={s.body} dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.message) }} />
            ) : (
              <p className={s.scheduled}>
                <Clock3 size={17} /> This announcement will be published on {sent.date} at {sent.time}. The full message and files will appear here then.
              </p>
            )}

            {published && files.length > 0 && (
              <section className={s.attachments} aria-labelledby="attach-title">
                <h2 id="attach-title">
                  <Paperclip size={17} /> Attachments ({files.length})
                </h2>
                <ul>
                  {files.map((f, i) => (
                    <li key={f.id}>
                      <button className={s.fileOpen} onClick={() => setFileIndex(i + offset)} title="View file">
                        <FileBadge name={f.name} />
                        <span>
                          <b>{f.name}</b>
                          <small>{f.url ? fmtSize(f.size) : `${fmtSize(f.size)} · not uploaded`}</small>
                        </span>
                      </button>
                      {f.url ? (
                        <FileDownload file={f} className={s.download} aria-label={`Download ${f.name}`} title="Download">
                          <Download size={18} />
                        </FileDownload>
                      ) : (
                        <span
                          className={cx(s.download, s.downloadOff)}
                          title="This file was never uploaded (sample data, or attached before uploads were enabled)"
                        >
                          <Download size={18} />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        </main>

        {/* ---------------- Side column ---------------- */}
        <aside className={s.aside}>
          <section className={cx(s.side, s.dateCard)}>
            {isFlag && <Ribbon />}
            <span className={s.dateIcon}>
              <CalendarDays size={26} />
            </span>
            <div>
              <p className={s.dateBig}>
                <b>{a.startDate.slice(8, 10)}</b> {MONTHS[Number(a.startDate.slice(5, 7)) - 1].slice(0, 3).toUpperCase()} {a.startDate.slice(0, 4)}
              </p>
              <p className={s.dateLong}>{longDate(a.startDate)}</p>
              <p className={s.dateNote}>{dateNote(a, now)}</p>
            </div>
          </section>

          <section className={cx(s.side, s.details)} aria-labelledby="details-title">
            <h2 id="details-title">Announcement Details</h2>
            <dl>
              <Detail icon={<LayoutList size={18} />} label="Announcement Type" value={categoryLabel(cat)} />
              <Detail icon={<Users size={18} />} label="Target Audience" value={audienceLabel(a.audience, list)} />
              <Detail
                icon={<CalendarRange size={18} />}
                label="Active Period"
                value={a.startDate === a.endDate ? fmtDate(a.startDate) : `${fmtDate(a.startDate)} – ${fmtDate(a.endDate)}`}
              />
              <Detail
                icon={<CircleCheck size={18} />}
                label="Status"
                value={
                  <span className={cx(s.status, s[`st_${status}`])}>{status === "active" ? "Active" : status === "upcoming" ? "Upcoming" : "Expired"}</span>
                }
              />
              <Detail icon={<Flag size={18} />} label="Priority" value={a.urgent ? <span className={s.urgentText}>Urgent</span> : "Normal"} />
              {files.length > 0 && <Detail icon={<Paperclip size={18} />} label="Attachments" value={`${files.length} file${files.length > 1 ? "s" : ""}`} />}
            </dl>
          </section>

          <Related items={related} list={list} viewerId={viewerId} viewAllHref={listHref(tabOf(a), viewerId)} />
        </aside>
      </div>

      {fileIndex !== null && <FileViewer files={viewFiles} index={fileIndex} onIndex={setFileIndex} onClose={closeViewer} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function dateNote(a: Announcement, now: Date) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (a.startDate > today) {
    const n = daysBetween(today, a.startDate);
    return n === 1 ? "Starts tomorrow" : `Starts in ${n} days`;
  }
  if (a.endDate < today) return `Ended on ${fmtDate(a.endDate)}`;
  if (a.startDate === a.endDate) return "Today";
  return a.endDate === today ? "Last day today" : `Active until ${fmtDate(a.endDate)}`;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailIcon}>{icon}</span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}

function Related({ items, list, viewerId, viewAllHref }: { items: Announcement[]; list: Person[]; viewerId: string | null; viewAllHref: string }) {
  return (
    <section className={cx(s.side, s.related)} aria-labelledby="related-title">
      <div className={s.relatedHead}>
        <h2 id="related-title">Related Announcements</h2>
        <Link href={viewAllHref}>View All</Link>
      </div>
      {items.length ? (
        <ul>
          {items.map((r) => (
            <li key={r.id}>
              <Link href={noticeHref(r.id, viewerId)}>
                <AnnouncementLogo logo={r.logo} category={categoryOf(r)} urgent={r.urgent} size={38} background={themeOf(r).tile} />
                <span>
                  <b>{r.title}</b>
                  <small>
                    {fmtDate(r.startDate)}
                    {r.audience.type !== "all" && ` · ${audienceLabel(r.audience, list)}`}
                  </small>
                </span>
                <ChevronRight size={18} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={base.muted}>No other announcements yet.</p>
      )}
    </section>
  );
}

function NotFound({ viewerId }: { viewerId: string | null }) {
  return (
    <div className={cx(base.page, s.notice)}>
      <div className={s.notFound}>
        <span>
          <Megaphone size={28} />
        </span>
        <h1>Announcement not found</h1>
        <p>It may have been cancelled or deleted, or it wasn&apos;t sent to you.</p>
        <Link href={listHref(undefined, viewerId)} className={base.applyBtn}>
          <ArrowLeft size={16} /> Back to announcements
        </Link>
      </div>
    </div>
  );
}

// Decorative tricolour ribbon for announcements that use the national-flag symbol.
function Ribbon() {
  return (
    <svg className={s.ribbon} viewBox="0 0 120 40" aria-hidden="true" preserveAspectRatio="none">
      <path d="M0 14 C30 2 70 4 120 0 V8 C70 12 30 10 0 22 Z" fill="#FF9933" />
      <path d="M0 22 C30 10 70 12 120 8 V16 C70 20 30 18 0 30 Z" fill="#ffffff" />
      <path d="M0 30 C30 18 70 20 120 16 V24 C70 28 30 26 0 38 Z" fill="#138808" />
    </svg>
  );
}
