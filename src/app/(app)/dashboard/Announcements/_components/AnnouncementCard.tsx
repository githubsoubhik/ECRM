"use client";

// One announcement in the feed.

import Link from "next/link";
import type { CSSProperties } from "react";
import { CalendarDays, ChevronRight, CircleAlert, Clock3, FileText, Pin, Users } from "lucide-react";
import { AnnouncementLogo } from "../../../components/announcements/AnnouncementLogo";
import { audienceLabel, categoryLabel, categoryOf, fmtDate, fmtSize, type Announcement, type Person } from "../../../../data/announcementData";
import { dayMonth, feedStatus, preview, splitDateTime, themeOf } from "./feed";
import { Avatar, cx } from "./ui";
import styles from "../announcements.module.css";

export function authorOf(a: Announcement, list: Person[]) {
  const p = list.find((x) => x.name.toLowerCase() === a.createdBy.toLowerCase());
  return { name: a.createdBy, role: p?.designation ?? (a.createdBy === "Admin" ? "Administrator" : ""), photoUrl: p?.photoUrl };
}

export const fileKind = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { label: "PDF", color: "#e5484d" };
  if (ext === "doc" || ext === "docx") return { label: "DOC", color: "#2f7de1" };
  if (["jpg", "jpeg", "png"].includes(ext)) return { label: "IMG", color: "#0f766e" };
  return { label: ext.toUpperCase().slice(0, 3) || "FILE", color: "#64748b" };
};

export function FileBadge({ name }: { name: string }) {
  const k = fileKind(name);
  return (
    <span className={styles.fileBadge} style={{ background: k.color }}>
      <FileText size={11} strokeWidth={2.4} />
      <b>{k.label}</b>
    </span>
  );
}

export default function AnnouncementCard({
  a,
  list,
  now,
  isMobile,
  href,
  onOpenFile,
}: {
  a: Announcement;
  list: Person[];
  now: Date;
  isMobile: boolean;
  /** Notice page for this announcement. */
  href: string;
  /** Opens the first attachment straight from the card. */
  onOpenFile: () => void;
}) {
  const theme = themeOf(a);
  const cat = categoryOf(a);
  const status = feedStatus(a, now);
  const author = authorOf(a, list);
  const sent = splitDateTime(a.sendAt);
  const pinnedNow = !!a.pinned && status !== "expired";
  const dateBadge = pinnedNow ? dayMonth(a.endDate > a.startDate && status === "active" ? a.endDate : a.startDate) : null;
  const file = a.attachments[0];
  const lines = preview(a.message);
  const isFlag = a.logo?.kind === "symbol" && a.logo.symbol === "india-flag";

  const vars = {
    "--tint": theme.tint,
    "--tint2": theme.tint2,
    "--edge": theme.edge,
    "--badge": theme.badge,
    "--ink": theme.ink,
  } as CSSProperties;

  const audience = (
    <span className={styles.audChip}>
      <Users size={14} />
      <span>{audienceLabel(a.audience, list)}</span>
    </span>
  );

  return (
    <article className={cx(styles.card, status === "expired" && styles.cardExpired, dateBadge && styles.cardHasBadge)} style={vars}>
      <Link className={styles.cardHit} href={href} aria-label={`Open ${a.title}`} />
      {isFlag && <Ribbon />}

      <AnnouncementLogo logo={a.logo} category={cat} urgent={a.urgent} size={isMobile ? 58 : 88} background={theme.tile} className={styles.cardTile} />

      <div className={styles.cardMain}>
        <div className={styles.cardTop}>
          <div className={styles.tags}>
            <span className={styles.catBadge}>{categoryLabel(cat)}</span>
            {pinnedNow && (
              <span className={styles.tagPinned}>
                <Pin size={12} strokeWidth={2.4} /> Pinned
              </span>
            )}
            {a.urgent && status !== "expired" && (
              <span className={styles.tagUrgent}>
                <CircleAlert size={12} strokeWidth={2.4} /> Urgent
              </span>
            )}
            {status === "upcoming" && (
              <span className={styles.tagUpcoming}>
                <Clock3 size={12} strokeWidth={2.4} /> Starts {fmtDate(a.startDate)}
              </span>
            )}
            {status === "expired" && <span className={styles.tagExpired}>Expired</span>}
          </div>
          {dateBadge ? (
            <span className={styles.dateBadge}>
              <b>{dateBadge.day}</b>
              <small>{dateBadge.mon}</small>
            </span>
          ) : (
            audience
          )}
        </div>

        <h3 className={styles.cardTitle}>{a.title}</h3>

        {isMobile ? (
          <p className={styles.excerptMobile}>{lines.join(" ")}</p>
        ) : (
          <div className={styles.excerpt}>
            {lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        )}

        <div className={styles.cardFoot}>
          <span className={styles.author}>
            <Avatar name={author.name} photoUrl={author.photoUrl} size={isMobile ? 30 : 34} />
            <span>
              <b>{author.name}</b>
              {author.role && <small>{author.role}</small>}
            </span>
          </span>
          <span className={styles.when}>
            <CalendarDays size={16} />
            {isMobile ? (
              <span className={styles.whenStack}>
                <span>{sent.date}</span>
                <span>{sent.time}</span>
              </span>
            ) : (
              <span>
                {sent.date}, {sent.time}
              </span>
            )}
          </span>
          {file ? (
            <button
              className={styles.fileChip}
              onClick={onOpenFile}
              aria-label={`View attachment ${file.name}`}
              title={`View ${a.attachments.map((f) => f.name).join(", ")}`}
            >
              <FileBadge name={file.name} />
              <span>
                <b>{file.name}</b>
                <small>
                  {fmtSize(file.size)}
                  {a.attachments.length > 1 && ` · +${a.attachments.length - 1} more`}
                </small>
              </span>
            </button>
          ) : dateBadge ? (
            audience
          ) : null}
        </div>
      </div>

      <ChevronRight className={styles.chev} size={20} aria-hidden="true" />
    </article>
  );
}

// Decorative tricolour ribbon, shown on cards that use the national-flag symbol.
function Ribbon() {
  return (
    <svg className={styles.ribbon} viewBox="0 0 120 40" aria-hidden="true" preserveAspectRatio="none">
      <path d="M0 14 C30 2 70 4 120 0 V8 C70 12 30 10 0 22 Z" fill="#FF9933" />
      <path d="M0 22 C30 10 70 12 120 8 V16 C70 20 30 18 0 30 Z" fill="#ffffff" />
      <path d="M0 30 C30 18 70 20 120 16 V24 C70 28 30 26 0 38 Z" fill="#138808" />
    </svg>
  );
}
