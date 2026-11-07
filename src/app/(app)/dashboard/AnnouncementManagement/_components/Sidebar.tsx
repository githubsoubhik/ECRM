"use client";

// Quick Actions and Announcement Tips.

import { CheckCircle2, Clock, FileEdit, FileText, Lightbulb, Megaphone, type LucideIcon } from "lucide-react";
import styles from "../announcement.module.css";

export function QuickActions({
  drafts,
  scheduled,
  onCreate,
  onTemplates,
  onDrafts,
  onScheduled,
}: {
  drafts: number;
  scheduled: number;
  onCreate: () => void;
  onTemplates: () => void;
  onDrafts: () => void;
  onScheduled: () => void;
}) {
  const items: { icon: LucideIcon; label: string; color: string; soft: string; count?: number; onClick: () => void }[] = [
    { icon: Megaphone, label: "Create Announcement", color: "#15803d", soft: "#e3f6ea", onClick: onCreate },
    { icon: FileText, label: "Manage Templates", color: "#0f3d33", soft: "#eef1f5", onClick: onTemplates },
    { icon: FileEdit, label: "View Drafts", color: "#2f7de1", soft: "#e6f0fd", count: drafts, onClick: onDrafts },
    { icon: Clock, label: "Scheduled Announcements", color: "#e08a0b", soft: "#fff1dc", count: scheduled, onClick: onScheduled },
  ];
  return (
    <section className={styles.sideCard}>
      <h3>Quick Actions</h3>
      <div className={styles.quickList}>
        {items.map((it) => (
          <button key={it.label} onClick={it.onClick}>
            <span className={styles.quickIcon} style={{ color: it.color, background: it.soft }}>
              <it.icon size={17} />
            </span>
            <span className={styles.quickLabel}>{it.label}</span>
            {!!it.count && <em className={styles.quickCount}>{it.count}</em>}
          </button>
        ))}
      </div>
    </section>
  );
}

const TIPS = [
  "Keep the message clear and concise.",
  "Use a relevant and descriptive title.",
  "Attach supporting documents if needed.",
  "Choose the right audience for better reach.",
  "Set a start and end date for time-sensitive announcements.",
];

export function Tips() {
  return (
    <section className={styles.sideCard}>
      <h3 className={styles.tipsHead}>
        <Lightbulb size={18} /> Announcement Tips
      </h3>
      <ul className={styles.tips}>
        {TIPS.map((t) => (
          <li key={t}>
            <CheckCircle2 size={17} />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}
