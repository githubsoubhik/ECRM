"use client";

// Right-side drawer: list of a day's posts → Content Details
import { ChevronRight, Clock, Plus, X } from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  STATUSES,
  STATUS_META,
  formatLong,
  platformLabel,
  to12h,
  typeLabel,
  type ContentPost,
  type MediaItem,
  type PostStatus,
} from "../../../../../../data/contentCalendarData";
import { PlatformIcons, StatusPill, Thumb, useEscape } from "./ccUi";
import ContentDetails from "./ContentDetails";

export type DrawerState =
  | null
  | { mode: "day"; date: string }
  | { mode: "post"; postId: string; fromDate: string | null };

interface Props {
  state: Exclude<DrawerState, null>;
  dayPosts: ContentPost[];
  post?: ContentPost;
  onClose: () => void;
  onOpenPost: (id: string, fromDate: string) => void;
  onBackToDay: (date: string) => void;
  onAdd: (date: string) => void;
  onEdit: (post: ContentPost) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: PostStatus) => void;
  onReschedule: (id: string, date: string, time: string) => void;
  onAddComment: (id: string, text: string) => void;
  onAddMedia: (id: string, media: MediaItem[]) => void;
  onRemoveMedia: (id: string, index: number) => void;
}

export default function DayDrawer(props: Props) {
  const { state, dayPosts, post, onClose } = props;
  useEscape(onClose);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {state.mode === "day" ? (
          <>
            <div className={styles.drawerHead}>
              <div>
                <p className={styles.drawerEyebrow}>
                  {dayPosts.length} post{dayPosts.length === 1 ? "" : "s"} planned
                </p>
                <h3 className={styles.drawerTitle}>{formatLong(state.date)}</h3>
              </div>
              <button type="button" className={styles.plainIcon} onClick={onClose} aria-label="Close">
                <X />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.dayStats}>
                {STATUSES.map((s) => {
                  const n = dayPosts.filter((p) => p.status === s).length;
                  if (!n) return null;
                  return (
                    <span key={s} className={styles.dayStat}>
                      <i style={{ background: STATUS_META[s].color }} />
                      {n} {s}
                    </span>
                  );
                })}
              </div>

              {dayPosts.length === 0 ? (
                <p className={styles.sideEmpty}>No posts on this day yet.</p>
              ) : (
                <div className={styles.dayList}>
                  {dayPosts.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={styles.dayItem}
                      onClick={() => props.onOpenPost(p.id, state.date)}
                    >
                      <span className={styles.dayItemBar} style={{ background: STATUS_META[p.status].color }} />
                      <Thumb media={p.media[0]} className={styles.dayItemThumb} />
                      <span className={styles.dayItemBody}>
                        <span className={styles.dayItemTitle}>{p.title}</span>
                        <span className={styles.dayItemMeta}>
                          <PlatformIcons platforms={p.platforms} size={14} />
                          {typeLabel(p.type)} | {platformLabel(p.platforms)}
                        </span>
                        <span className={styles.dayItemFoot}>
                          <Clock /> {to12h(p.time)}
                          <StatusPill status={p.status} size="sm" />
                        </span>
                      </span>
                      <ChevronRight className={styles.dayItemArrow} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.drawerFoot}>
              <button type="button" className={styles.primaryBtn} onClick={() => props.onAdd(state.date)}>
                <Plus /> Add post on this day
              </button>
            </div>
          </>
        ) : post ? (
          <ContentDetails
            key={post.id}
            post={post}
            onBack={state.fromDate ? () => props.onBackToDay(state.fromDate as string) : undefined}
            onClose={onClose}
            onEdit={() => props.onEdit(post)}
            onDuplicate={() => props.onDuplicate(post.id)}
            onDelete={() => props.onDelete(post.id)}
            onStatus={(s) => props.onStatus(post.id, s)}
            onReschedule={(d, t) => props.onReschedule(post.id, d, t)}
            onAddComment={(t) => props.onAddComment(post.id, t)}
            onAddMedia={(m) => props.onAddMedia(post.id, m)}
            onRemoveMedia={(i) => props.onRemoveMedia(post.id, i)}
          />
        ) : null}
      </aside>
    </div>
  );
}
