"use client";

// Right-hand column: Add button, Recent / Upcoming, Content Approval donut, Content Ideas
import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Lightbulb, MoreVertical, Pencil, PieChart, Plus, Trash2 } from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  APPROVAL_COLORS,
  formatShort,
  typeLabel,
  type ApprovalBucket,
  type ContentIdea,
  type ContentPost,
} from "../../../../../../data/contentCalendarData";
import { StatusPill, Thumb, cx } from "./ccUi";

interface Props {
  posts: ContentPost[];
  nowStamp: string; // "YYYY-MM-DD HH:mm"
  approval: { bucket: ApprovalBucket; count: number }[];
  ideas: ContentIdea[];
  onAddNew: () => void;
  onOpenPost: (id: string) => void;
  onEdit: (post: ContentPost) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleIdea: (id: string) => void;
  onUseIdea: (idea: ContentIdea) => void;
  onAddIdea: (title: string) => void;
}

const stamp = (p: ContentPost) => `${p.date} ${p.time}`;

function Donut({ data, total }: { data: { bucket: ApprovalBucket; count: number }[]; total: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const shown = data.filter((d) => d.count > 0);
  const segments = shown.map((d, i) => {
    const before = shown.slice(0, i).reduce((sum, x) => sum + x.count, 0);
    return { ...d, len: total ? (d.count / total) * c : 0, start: total ? (before / total) * c : 0 };
  });
  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 100 100" className={styles.donut} aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eef0f6" strokeWidth="13" />
        {segments.map((d) => (
          <circle
            key={d.bucket}
            className={styles.donutSeg}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={APPROVAL_COLORS[d.bucket]}
            strokeWidth="13"
            strokeDasharray={`${Math.max(d.len - 1.6, 0.6)} ${c}`}
            strokeDashoffset={-d.start}
            transform="rotate(-90 50 50)"
          />
        ))}
      </svg>
      <div className={styles.donutCenter}>
        <strong>{total}</strong>
        <span>Total</span>
      </div>
    </div>
  );
}

export default function SidePanel(props: Props) {
  const { posts, nowStamp, approval, ideas } = props;
  const [tab, setTab] = useState<"recent" | "upcoming">("recent");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [newIdea, setNewIdea] = useState("");

  useEffect(() => {
    if (!menuId) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-cc-menu]")) setMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);

  const recent = useMemo(
    () => posts.filter((p) => stamp(p) <= nowStamp).sort((a, b) => stamp(b).localeCompare(stamp(a))).slice(0, 8),
    [posts, nowStamp],
  );
  const upcoming = useMemo(
    () => posts.filter((p) => stamp(p) > nowStamp && p.status !== "Published").sort((a, b) => stamp(a).localeCompare(stamp(b))),
    [posts, nowStamp],
  );
  const list = tab === "recent" ? recent : upcoming;
  const total = approval.reduce((s, a) => s + a.count, 0);
  const visibleIdeas = showAllIdeas ? ideas : ideas.slice(0, 5);

  const submitIdea = () => {
    const t = newIdea.trim();
    if (!t) return;
    props.onAddIdea(t);
    setNewIdea("");
  };

  return (
    <>
      <button type="button" className={styles.addNewBtn} onClick={props.onAddNew}>
        <Plus /> Add New Content
      </button>

      {/* Recent / Upcoming */}
      <section className={styles.sideCard}>
        <div className={styles.sideTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "recent"}
            className={cx(styles.sideTab, tab === "recent" && styles.sideTabActive)}
            onClick={() => setTab("recent")}
          >
            Recent Content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "upcoming"}
            className={cx(styles.sideTab, tab === "upcoming" && styles.sideTabActive)}
            onClick={() => setTab("upcoming")}
          >
            Upcoming ({upcoming.length})
          </button>
        </div>

        <div className={styles.recentList}>
          {list.length === 0 && (
            <p className={styles.sideEmpty}>{tab === "recent" ? "Nothing posted yet." : "No upcoming content scheduled."}</p>
          )}
          {list.map((p) => (
            <div key={p.id} className={styles.recentRow} data-cc-menu>
              <button type="button" className={styles.recentOpen} onClick={() => props.onOpenPost(p.id)}>
                <Thumb media={p.media[0]} className={styles.recentThumb} />
                <span className={styles.recentBody}>
                  <span className={styles.recentTitle}>{p.title}</span>
                  <span className={styles.recentMeta}>
                    {typeLabel(p.type)} | {formatShort(p.date)}
                  </span>
                  <StatusPill status={p.status} size="sm" />
                </span>
              </button>
              <button
                type="button"
                className={styles.kebab}
                aria-label="More actions"
                onClick={() => setMenuId((m) => (m === p.id ? null : p.id))}
              >
                <MoreVertical />
              </button>
              {menuId === p.id && (
                <div className={styles.menu}>
                  <button type="button" className={styles.menuItem} onClick={() => { setMenuId(null); props.onOpenPost(p.id); }}>
                    <Eye /> View details
                  </button>
                  <button type="button" className={styles.menuItem} onClick={() => { setMenuId(null); props.onEdit(p); }}>
                    <Pencil /> Edit
                  </button>
                  <button type="button" className={styles.menuItem} onClick={() => { setMenuId(null); props.onDuplicate(p.id); }}>
                    <Copy /> Duplicate
                  </button>
                  <button
                    type="button"
                    className={cx(styles.menuItem, styles.menuDanger)}
                    onClick={() => { setMenuId(null); props.onDelete(p.id); }}
                  >
                    <Trash2 /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Content Approval */}
      <section className={styles.sideCard}>
        <div className={styles.sideCardHead}>
          <h3 className={styles.sideCardTitle}>
            <span className={styles.sideCardIcon} style={{ background: "#fff1dc", color: "#f59e0b" }}>
              <PieChart />
            </span>
            Content Approval
          </h3>
        </div>
        <div className={styles.approvalBody}>
          <div className={styles.approvalList}>
            {approval.map((a) => (
              <div key={a.bucket} className={styles.approvalRow}>
                <span className={styles.approvalSwatch} style={{ background: APPROVAL_COLORS[a.bucket] }} />
                <span>{a.bucket}</span>
                <span className={styles.approvalCount}>{a.count}</span>
              </div>
            ))}
          </div>
          <Donut data={approval} total={total} />
        </div>
      </section>

      {/* Content Ideas */}
      <section className={styles.sideCard}>
        <div className={styles.sideCardHead}>
          <h3 className={styles.sideCardTitle}>
            <span className={styles.sideCardIcon} style={{ background: "#fff6d6", color: "#eab308" }}>
              <Lightbulb />
            </span>
            Content Ideas
          </h3>
          <button type="button" className={styles.viewAll} onClick={() => setShowAllIdeas((s) => !s)}>
            {showAllIdeas ? "Show Less" : "View All"}
          </button>
        </div>
        <ul className={styles.ideasList}>
          {visibleIdeas.map((idea) => (
            <li key={idea.id} className={styles.ideaRow}>
              <button
                type="button"
                className={cx(styles.checkBox, idea.done && styles.checkBoxOn)}
                aria-label={idea.done ? "Mark idea as open" : "Mark idea as done"}
                onClick={() => props.onToggleIdea(idea.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </button>
              <span className={cx(styles.ideaTitle, idea.done && styles.ideaDone)} title={idea.title}>
                {idea.title}
              </span>
              <button type="button" className={styles.ideaAdd} onClick={() => props.onUseIdea(idea)}>
                <Plus /> Add
              </button>
            </li>
          ))}
        </ul>
        {showAllIdeas && (
          <div className={styles.ideaInputRow}>
            <input
              className={styles.input}
              placeholder="Write a new idea…"
              value={newIdea}
              maxLength={80}
              onChange={(e) => setNewIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitIdea()}
            />
            <button type="button" className={styles.smallBtn} onClick={submitIdea}>
              Save
            </button>
          </div>
        )}
      </section>
    </>
  );
}