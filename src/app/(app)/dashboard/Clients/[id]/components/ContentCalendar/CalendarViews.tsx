"use client";

// Month / Week / List views for the Content Calendar
import { ChevronRight, Clock, Plus } from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  MONTHS_SHORT,
  STATUS_META,
  WEEKDAYS_SHORT,
  formatLong,
  fromKey,
  platformLabel,
  to12h,
  toKey,
  typeLabel,
  type ContentPost,
} from "../../../../../../data/contentCalendarData";
import { PlatformIcons, StatusPill, Thumb, cx } from "./ccUi";

type ByDate = Record<string, ContentPost[]>;

/* ── Cell content: one post ──────────────────────────────── */
function SinglePostChip({ post }: { post: ContentPost }) {
  return (
    <div className={styles.postChip}>
      <Thumb media={post.media[0]} className={styles.chipThumb} />
      <div className={styles.chipMeta}>
        <span className={styles.chipTime}>{to12h(post.time)}</span>
        <PlatformIcons platforms={post.platforms} size={13} />
      </div>
      <div className={styles.chipTitle} title={post.title}>
        {post.title}
      </div>
      <StatusPill status={post.status} size="sm" />
    </div>
  );
}

/* ── Cell content: several posts → stacked thumbs + colored dots ── */
function MultiPostChip({ posts }: { posts: ContentPost[] }) {
  const shown = posts.slice(0, 3);
  return (
    <div className={styles.multiChip}>
      <div className={styles.stack}>
        {shown.map((p) => (
          <Thumb key={p.id} media={p.media[0]} className={styles.stackThumb} />
        ))}
        {posts.length > 3 && <span className={styles.stackMore}>+{posts.length - 3}</span>}
      </div>
      <div className={styles.multiLabel}>{posts.length} Posts</div>
      <div className={styles.dots}>
        {posts.map((p) => (
          <span
            key={p.id}
            className={styles.dot}
            style={{ background: STATUS_META[p.status].color }}
            title={`${p.title} · ${p.status}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Month view ──────────────────────────────────────────── */
interface MonthProps {
  year: number;
  month: number;
  byDate: ByDate;
  todayKey: string;
  selectedKey: string;
  onDayClick: (key: string) => void;
}

export function MonthView({ year, month, byDate, todayKey, selectedKey, onDayClick }: MonthProps) {
  const offset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((offset + daysInMonth) / 7) * 7;
  const days = Array.from({ length: total }, (_, i) => new Date(year, month, 1 - offset + i));

  return (
    <div className={styles.monthWrap}>
      <div className={styles.weekHeadRow}>
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className={styles.weekHead}>
            {w}
          </div>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {days.map((d) => {
          const key = toKey(d);
          const inMonth = d.getMonth() === month;
          const list = inMonth ? byDate[key] ?? [] : [];
          return (
            <div
              key={key}
              role={inMonth ? "button" : undefined}
              tabIndex={inMonth ? 0 : -1}
              aria-label={inMonth ? `${formatLong(key)} – ${list.length} post${list.length === 1 ? "" : "s"}` : undefined}
              className={cx(
                styles.dayCell,
                !inMonth && styles.dayOutside,
                inMonth && key === selectedKey && styles.daySelected,
                key === todayKey && styles.dayToday,
              )}
              onClick={() => inMonth && onDayClick(key)}
              onKeyDown={(e) => {
                if (inMonth && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onDayClick(key);
                }
              }}
            >
              <div className={styles.dayTop}>
                <span className={styles.dayNum}>{d.getDate()}</span>
                {list.length > 1 && <span className={styles.countBadge}>{list.length}</span>}
              </div>

              {inMonth && list.length === 0 && (
                <span className={styles.addPost}>
                  <Plus />
                  <span className={styles.addLabelLong}>Add Post</span>
                  <span className={styles.addLabelShort}>Add</span>
                </span>
              )}
              {list.length === 1 && <SinglePostChip post={list[0]} />}
              {list.length > 1 && <MultiPostChip posts={list} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Week view ───────────────────────────────────────────── */
interface WeekProps {
  anchorKey: string;
  byDate: ByDate;
  todayKey: string;
  selectedKey: string;
  onSelect: (key: string) => void;
  onPostClick: (id: string) => void;
  onAdd: (key: string) => void;
}

export function WeekView({ anchorKey, byDate, todayKey, selectedKey, onSelect, onPostClick, onAdd }: WeekProps) {
  const a = fromKey(anchorKey);
  const days = Array.from({ length: 7 }, (_, i) => new Date(a.getFullYear(), a.getMonth(), a.getDate() - a.getDay() + i));

  return (
    <div className={styles.weekGrid}>
      {days.map((d) => {
        const key = toKey(d);
        const list = byDate[key] ?? [];
        return (
          <div
            key={key}
            className={cx(styles.weekCol, key === todayKey && styles.weekColToday, key === selectedKey && styles.weekColSelected)}
          >
            <button type="button" className={styles.weekColHead} onClick={() => onSelect(key)}>
              <span>{WEEKDAYS_SHORT[d.getDay()]}</span>
              <strong>{d.getDate()}</strong>
              <em>
                {MONTHS_SHORT[d.getMonth()]}
                {list.length > 0 && ` · ${list.length} post${list.length > 1 ? "s" : ""}`}
              </em>
            </button>
            <div className={styles.weekColBody}>
              {list.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={styles.weekCard}
                  style={{ borderLeftColor: STATUS_META[p.status].color }}
                  onClick={() => onPostClick(p.id)}
                >
                  <Thumb media={p.media[0]} className={styles.weekThumb} />
                  <span className={styles.weekCardTop}>
                    <span className={styles.chipTime}>{to12h(p.time)}</span>
                    <PlatformIcons platforms={p.platforms} size={13} />
                  </span>
                  <span className={styles.weekCardTitle}>{p.title}</span>
                  <StatusPill status={p.status} size="sm" />
                </button>
              ))}
              <button type="button" className={styles.weekAdd} onClick={() => onAdd(key)}>
                <Plus /> Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── List view ───────────────────────────────────────────── */
interface ListProps {
  posts: ContentPost[];
  todayKey: string;
  onPostClick: (id: string) => void;
  onAdd: () => void;
}

export function ListView({ posts, todayKey, onPostClick, onAdd }: ListProps) {
  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No content matches the current month and filters.</p>
        <button type="button" className={styles.smallBtn} onClick={onAdd}>
          <Plus /> Add content
        </button>
      </div>
    );
  }

  const groups: { date: string; items: ContentPost[] }[] = [];
  [...posts]
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .forEach((p) => {
      const last = groups[groups.length - 1];
      if (last && last.date === p.date) last.items.push(p);
      else groups.push({ date: p.date, items: [p] });
    });

  return (
    <div className={styles.listWrap}>
      {groups.map((g) => (
        <section key={g.date}>
          <h4 className={cx(styles.listGroupHead, g.date === todayKey && styles.listGroupToday)}>
            {formatLong(g.date)}
            <span>
              {g.items.length} post{g.items.length > 1 ? "s" : ""}
            </span>
          </h4>
          {g.items.map((p) => (
            <button type="button" key={p.id} className={styles.listRow} onClick={() => onPostClick(p.id)}>
              <Thumb media={p.media[0]} className={styles.listThumb} />
              <span className={styles.listBody}>
                <span className={styles.listTitle}>{p.title}</span>
                <span className={styles.listMeta}>
                  <PlatformIcons platforms={p.platforms} size={13} />
                  {typeLabel(p.type)} · {platformLabel(p.platforms)}
                  <span className={styles.listMetaTime}>
                    <Clock /> {to12h(p.time)}
                  </span>
                </span>
              </span>
              <span className={styles.listTime}>{to12h(p.time)}</span>
              <StatusPill status={p.status} />
              <ChevronRight className={styles.listArrow} />
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}