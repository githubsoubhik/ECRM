"use client";

// "Upcoming / Active Announcements" and "Stay Informed" cards.

import Link from "next/link";
import { CalendarDays, Lightbulb } from "lucide-react";
import { audienceLabel, type Announcement, type Person } from "../../../../data/announcementData";
import { dayMonth, feedStatus } from "./feed";
import { cx } from "./ui";
import styles from "../announcements.module.css";

export function UpcomingPanel({
  upcoming,
  active,
  list,
  now,
  hrefOf,
  onViewAll,
}: {
  upcoming: Announcement[];
  active: Announcement[];
  list: Person[];
  now: Date;
  hrefOf: (a: Announcement) => string;
  onViewAll: () => void;
}) {
  // Soonest upcoming first, then currently active ones ending soonest.
  const items = [...upcoming, ...active.filter((a) => !upcoming.includes(a)).sort((x, y) => x.endDate.localeCompare(y.endDate))].slice(0, 4);
  return (
    <section className={styles.sideCard} aria-labelledby="upcoming-title">
      <h2 id="upcoming-title" className={styles.sideTitle}>
        <CalendarDays size={18} /> Upcoming / Active Announcements
      </h2>
      {items.length ? (
        <ul className={styles.upList}>
          {items.map((a) => {
            const st = feedStatus(a, now);
            const dm = dayMonth(st === "upcoming" ? a.startDate : a.endDate);
            return (
              <li key={a.id}>
                <Link href={hrefOf(a)} className={styles.upLink}>
                  <span className={styles.upDate}>
                    <b>{dm.day}</b>
                    <small>{dm.mon}</small>
                  </span>
                  <span className={styles.upText}>
                    <b>{a.title}</b>
                    <small>{a.audience.type === "all" ? "Company Wide" : audienceLabel(a.audience, list)}</small>
                  </span>
                  <em className={cx(styles.upChip, st === "active" && styles.upChipActive)}>{st === "upcoming" ? "Upcoming" : "Active"}</em>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.muted}>Nothing scheduled right now.</p>
      )}
      {upcoming.length > 0 && (
        <button className={styles.viewAll} onClick={onViewAll}>
          View all upcoming ({upcoming.length})
        </button>
      )}
    </section>
  );
}

export function StayInformed() {
  return (
    <section className={styles.stayCard}>
      <span className={styles.stayIcon}>
        <Lightbulb size={18} />
      </span>
      <div className={styles.stayText}>
        <b>Stay Informed</b>
        <p>Check this section regularly for important updates, policy changes, events and more.</p>
      </div>
      <Illustration />
    </section>
  );
}

// A person with a megaphone (simple shapes, no image file needed).
function Illustration() {
  return (
    <svg className={styles.stayArt} viewBox="0 0 96 110" aria-hidden="true">
      <ellipse cx="50" cy="104" rx="30" ry="4" fill="#cfe9dc" />
      {/* legs */}
      <path d="M40 72 L37 101 H44 L48 76 Z" fill="#1f3b57" />
      <path d="M52 76 L57 101 H64 L60 72 Z" fill="#1f3b57" />
      <path d="M35 100 h10 v4 h-12 z M56 100 h10 v4 h-12 z" fill="#0f2233" />
      {/* body */}
      <path d="M34 44 Q48 36 62 44 L64 76 H36 Z" fill="#15803d" />
      {/* arm to megaphone */}
      <path d="M58 48 Q70 50 74 42" stroke="#15803d" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="75" cy="41" r="3.6" fill="#8d5a3b" />
      {/* other arm */}
      <path d="M37 50 Q30 62 36 70" stroke="#15803d" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="37" cy="71" r="3.4" fill="#8d5a3b" />
      {/* head */}
      <rect x="45" y="31" width="7" height="7" rx="2" fill="#8d5a3b" />
      <circle cx="49" cy="25" r="9" fill="#8d5a3b" />
      <path d="M40 24 Q41 13 51 14 Q60 15 58 25 Q55 19 49 20 Q44 20 40 24 Z" fill="#1b1b1b" />
      <circle cx="58" cy="19" r="4.2" fill="#1b1b1b" />
      {/* megaphone */}
      <g transform="rotate(-18 80 36)">
        <path d="M72 32 L90 22 V50 L72 40 Z" fill="#e5484d" />
        <rect x="68" y="31" width="6" height="10" rx="2" fill="#b91c1c" />
        <path d="M90 22 V50" stroke="#fca5a5" strokeWidth="2" />
      </g>
      <path d="M92 18 q5 -3 3 -9 M94 30 h7 M92 42 q5 3 3 9" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
