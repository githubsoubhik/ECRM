"use client";

/**
 * Content Calendar – client tab
 * Path: src/app/dashboard/Clients/[id]/components/ContentCalendar/ContentCalendar.tsx
 *
 * • Month / Week / List views, month picker, prev / next
 * • 1 post on a day  → thumbnail + time + platform + status
 * • 2+ posts on a day → stacked thumbs + one colored dot per post (color = status)
 *   → click opens a right-side drawer listing that day's posts → click a post → Content Details
 * • Add / Edit / Duplicate / Reschedule / Status change / Delete / Comments / Media
 * • Filters (status, platform, type, search) and live stats
 * • Data is saved in localStorage per client (swap usePersistentState for your API later)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  APPROVAL_BUCKETS,
  CONTENT_TYPES,
  EMPTY_PERFORMANCE,
  MONTHS_LONG,
  MONTHS_SHORT,
  PLATFORMS,
  STATUSES,
  STATUS_META,
  approvalOf,
  formatShort,
  fromKey,
  genId,
  initialContentIdeas,
  initialContentPosts,
  pad,
  to12h,
  toKey,
  type ContentIdea,
  type ContentPost,
  type ContentType,
  type Platform,
  type PostHistoryItem,
  type PostStatus,
} from "../../../../../../data/contentCalendarData";
import { cx, useClickOutside } from "./ccUi";
import { ListView, MonthView, WeekView } from "./CalendarViews";
import SidePanel from "./SidePanel";
import DayDrawer, { type DrawerState } from "./DayDrawer";
import AddContentModal, { type ContentFormValues, type ModalState } from "./AddContentModal";
import { calendarPostsKey, calendarIdeasKey, usePersistentState } from "./calendarStore";

type ViewMode = "month" | "week" | "list";

const nowParts = () => {
  const n = new Date();
  return { date: toKey(n), time: `${pad(n.getHours())}:${pad(n.getMinutes())}` };
};

interface Props {
  clientId?: string;
}

export default function ContentCalendar({ clientId = "default" }: Props) {
  const [{ date: todayKey, time: nowTime }] = useState(nowParts);

  const [posts, setPosts] = usePersistentState<ContentPost[]>(calendarPostsKey(clientId), initialContentPosts);
  const [ideas, setIdeas] = usePersistentState<ContentIdea[]>(calendarIdeasKey(clientId), initialContentIdeas);

  const [view, setView] = useState<ViewMode>("month");
  const [anchorKey, setAnchorKey] = useState(todayKey);
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const [statusFilter, setStatusFilter] = useState<PostStatus[]>([]);
  const [platformFilter, setPlatformFilter] = useState<Platform | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ContentType | "All">("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sideRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const closeFilter = useCallback(() => setFilterOpen(false), []);
  useClickOutside(filterRef, closeFilter, filterOpen);

  const anchor = fromKey(anchorKey);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const monthPrefix = `${year}-${pad(month + 1)}`;

  /* lock page scroll while an overlay is open */
  useEffect(() => {
    if (!drawer && !modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer, modal]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter.length && !statusFilter.includes(p.status)) return false;
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (platformFilter !== "All") {
        const viaMeta = (platformFilter === "Facebook" || platformFilter === "Instagram") && p.platforms.includes("Meta");
        if (!p.platforms.includes(platformFilter) && !viaMeta) return false;
      }
      if (q && !`${p.title} ${p.caption} ${p.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, statusFilter, platformFilter, typeFilter, query]);

  const byDate = useMemo(() => {
    const map: Record<string, ContentPost[]> = {};
    filtered.forEach((p) => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [filtered]);

  const monthPosts = useMemo(() => filtered.filter((p) => p.date.startsWith(monthPrefix)), [filtered, monthPrefix]);

  /* ── Stats ─────────────────────────────────────────────── */
  const count = (s: PostStatus) => monthPosts.filter((p) => p.status === s).length;
  const total = monthPosts.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const statCards: {
    key: string;
    label: string;
    value: number;
    sub: string;
    icon: LucideIcon;
    soft: string;
    strong: string;
    filled: boolean;
    status: PostStatus | null;
  }[] = [
    { key: "total", label: "Total Posts", value: total, sub: "This Month", icon: CalendarDays, soft: "#e9eeff", strong: "#3b5bdb", filled: false, status: null },
    { key: "pub", label: "Published", value: count("Published"), sub: `${pct(count("Published"))}% of total`, icon: Check, soft: "#dcf6e6", strong: "#22c55e", filled: true, status: "Published" },
    { key: "sch", label: "Scheduled", value: count("Scheduled"), sub: `${pct(count("Scheduled"))}% of total`, icon: Clock3, soft: "#efe7ff", strong: "#8b5cf6", filled: false, status: "Scheduled" },
    { key: "rev", label: "In Review", value: count("In Review"), sub: `${pct(count("In Review"))}% of total`, icon: Clock3, soft: "#ffefd6", strong: "#f59e0b", filled: true, status: "In Review" },
    { key: "dra", label: "Drafts", value: count("Draft"), sub: `${pct(count("Draft"))}% of total`, icon: FileText, soft: "#eef0f5", strong: "#6b7190", filled: false, status: "Draft" },
  ];

  const approval = APPROVAL_BUCKETS.map((bucket) => ({
    bucket,
    count: monthPosts.filter((p) => approvalOf(p.status) === bucket).length,
  }));

  const activeFilterCount =
    statusFilter.length + (platformFilter !== "All" ? 1 : 0) + (typeFilter !== "All" ? 1 : 0) + (query ? 1 : 0);

  /* ── Navigation ────────────────────────────────────────── */
  const shift = (dir: 1 | -1) => {
    if (view === "week") {
      const d = fromKey(anchorKey);
      d.setDate(d.getDate() + dir * 7);
      const k = toKey(d);
      setAnchorKey(k);
      setSelectedKey(k);
    } else {
      setAnchorKey(toKey(new Date(year, month + dir, 1)));
    }
  };

  const goToday = () => {
    setAnchorKey(todayKey);
    setSelectedKey(todayKey);
  };

  const changeView = (v: ViewMode) => {
    if (v === "week") setAnchorKey(selectedKey.startsWith(monthPrefix) ? selectedKey : `${monthPrefix}-01`);
    setView(v);
  };

  const openMonthPicker = () => {
    const el = monthInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!el) return;
    try {
      el.showPicker?.();
    } catch {
      el.focus();
    }
  };

  const title = (() => {
    if (view !== "week") return `${MONTHS_LONG[month]} ${year}`;
    const s = new Date(year, month, anchor.getDate() - anchor.getDay());
    const e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
    return `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]} ${e.getFullYear()}`;
  })();

  /* ── Mutations ─────────────────────────────────────────── */
  const historyEntry = (action: string): PostHistoryItem => {
    const n = nowParts();
    return { id: genId("h"), action, by: "You", time: `${formatShort(n.date)}, ${to12h(n.time)}` };
  };

  const updatePost = (id: string, patch: Partial<ContentPost>, action?: string) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch, history: action ? [...p.history, historyEntry(action)] : p.history } : p)),
    );

  const openAdd = (date?: string, title?: string, ideaId?: string) =>
    setModal({ mode: "add", date: date ?? selectedKey, title, ideaId });

  const handleDayClick = (key: string) => {
    setSelectedKey(key);
    const list = byDate[key] ?? [];
    if (list.length === 0) openAdd(key);
    else if (list.length === 1) setDrawer({ mode: "post", postId: list[0].id, fromDate: null });
    else setDrawer({ mode: "day", date: key });
  };

  const openPost = (id: string, fromDate: string | null = null) => setDrawer({ mode: "post", postId: id, fromDate });

  const handleSave = (values: ContentFormValues, asDraft: boolean) => {
    if (!modal) return;
    if (modal.mode === "add") {
      const post: ContentPost = {
        id: genId("cc"),
        ...values,
        title: values.title.trim(),
        status: asDraft ? "Draft" : "Scheduled",
        performance: { ...EMPTY_PERFORMANCE },
        comments: [],
        history: [historyEntry(asDraft ? "Saved as draft" : "Post scheduled")],
        createdBy: "You",
      };
      setPosts((prev) => [...prev, post]);
      if (modal.ideaId) setIdeas((prev) => prev.map((i) => (i.id === modal.ideaId ? { ...i, done: true } : i)));
      setSelectedKey(post.date);
      setAnchorKey(post.date);
      setDrawer(null);
      setToast(asDraft ? `Draft saved for ${formatShort(post.date)}` : `Post scheduled for ${formatShort(post.date)}, ${to12h(post.time)}`);
    } else {
      const was = modal.post.status;
      const status: PostStatus = asDraft ? "Draft" : was === "Draft" ? "Scheduled" : was;
      updatePost(modal.post.id, { ...values, title: values.title.trim(), status }, "Content edited");
      setToast("Changes saved");
    }
    setModal(null);
  };

  const duplicatePost = (id: string) => {
    const src = posts.find((p) => p.id === id);
    if (!src) return;
    const copy: ContentPost = {
      ...src,
      id: genId("cc"),
      title: `${src.title} (Copy)`.slice(0, 100),
      status: "Draft",
      performance: { ...EMPTY_PERFORMANCE },
      comments: [],
      history: [historyEntry(`Duplicated from "${src.title}"`)],
    };
    setPosts((prev) => [...prev, copy]);
    setDrawer({ mode: "post", postId: copy.id, fromDate: null });
    setToast("Post duplicated as draft");
  };

  const deletePost = (id: string) => {
    const p = posts.find((x) => x.id === id);
    if (!p || !window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setPosts((prev) => prev.filter((x) => x.id !== id));
    setDrawer((d) => (d && d.mode === "post" && d.fromDate ? { mode: "day", date: d.fromDate } : null));
    setToast("Post deleted");
  };

  const toggleStatusFilter = (s: PostStatus) =>
    setStatusFilter((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]));

  const clearFilters = () => {
    setStatusFilter([]);
    setPlatformFilter("All");
    setTypeFilter("All");
    setQuery("");
  };

  /* drawer data */
  const drawerPost = drawer?.mode === "post" ? posts.find((p) => p.id === drawer.postId) : undefined;
  const drawerDayPosts = drawer?.mode === "day" ? byDate[drawer.date] ?? [] : [];
  const showDrawer = drawer && (drawer.mode === "day" || drawerPost);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* ═══════════ MAIN COLUMN ═══════════ */}
        <div className={styles.mainCol}>
          {/* Stats */}
          <section className={styles.statsRow}>
            {statCards.map((c) => {
              const Icon = c.icon;
              const active = c.status ? statusFilter.length === 1 && statusFilter[0] === c.status : false;
              return (
                <button
                  type="button"
                  key={c.key}
                  className={cx(styles.statCard, active && styles.statCardActive)}
                  onClick={() => setStatusFilter(c.status && !active ? [c.status] : [])}
                  title={c.status ? `Show only ${c.status}` : "Show all"}
                >
                  <span className={styles.statIcon} style={{ background: c.soft, color: c.strong }}>
                    {c.filled ? (
                      <span className={styles.statIconFilled} style={{ background: c.strong }}>
                        <Icon />
                      </span>
                    ) : (
                      <Icon />
                    )}
                  </span>
                  <span className={styles.statBody}>
                    <span className={styles.statLabel}>{c.label}</span>
                    <span className={styles.statValue}>{c.value}</span>
                    <span className={styles.statSub}>{c.sub}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className={styles.statsMore}
              aria-label="Show content insights"
              onClick={() => sideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <ChevronRight />
            </button>
          </section>

          {/* Calendar */}
          <section className={styles.calendarCard}>
            <div className={styles.toolbar}>
              <div className={styles.navGroup}>
                <button type="button" className={styles.navBtn} onClick={() => shift(-1)} aria-label="Previous">
                  <ChevronLeft />
                </button>
                <button type="button" className={styles.navBtn} onClick={() => shift(1)} aria-label="Next">
                  <ChevronRight />
                </button>
                <button type="button" className={styles.monthTitle} onClick={openMonthPicker}>
                  {title}
                  <ChevronDown className={styles.monthChevron} />
                </button>
                <input
                  ref={monthInputRef}
                  type="month"
                  tabIndex={-1}
                  aria-hidden
                  className={styles.hiddenInput}
                  value={monthPrefix}
                  onChange={(e) => e.target.value && setAnchorKey(`${e.target.value}-01`)}
                />
              </div>

              <div className={styles.mobileTools}>
                <button
                  type="button"
                  className={cx(styles.iconBtn, mobileFiltersOpen && styles.iconBtnActive)}
                  onClick={() => setMobileFiltersOpen((o) => !o)}
                  aria-label="Filters"
                >
                  <SlidersHorizontal />
                  {activeFilterCount > 0 && <span className={styles.badgeDot}>{activeFilterCount}</span>}
                </button>
              </div>

              <div className={styles.viewToggle} role="tablist">
                {(["month", "week", "list"] as ViewMode[]).map((v) => (
                  <button
                    type="button"
                    role="tab"
                    key={v}
                    aria-selected={view === v}
                    className={cx(styles.viewBtn, view === v && styles.viewBtnActive)}
                    onClick={() => changeView(v)}
                  >
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              <button type="button" className={cx(styles.iconBtn, styles.todayBtnMobile)} onClick={goToday} aria-label="Go to today">
                <CalendarDays />
              </button>

              <div className={cx(styles.filters, mobileFiltersOpen && styles.filtersOpen)}>
                <div className={styles.filterWrap} ref={filterRef}>
                  <button
                    type="button"
                    className={cx(styles.toolBtn, statusFilter.length > 0 && styles.toolBtnActive)}
                    onClick={() => setFilterOpen((o) => !o)}
                    aria-expanded={filterOpen}
                  >
                    <Filter /> Filter
                    {statusFilter.length > 0 && <span className={styles.toolCount}>{statusFilter.length}</span>}
                  </button>
                  {filterOpen && (
                    <div className={styles.popover}>
                      <div className={styles.popoverTitle}>Status</div>
                      {STATUSES.map((s) => {
                        const on = statusFilter.includes(s);
                        return (
                          <button type="button" key={s} className={styles.popoverItem} onClick={() => toggleStatusFilter(s)}>
                            <span className={cx(styles.checkBox, on && styles.checkBoxOn)}>
                              <Check />
                            </span>
                            <i className={styles.pillDot} style={{ background: STATUS_META[s].color }} />
                            {s}
                          </button>
                        );
                      })}
                      <div className={styles.popoverFoot}>
                        <button type="button" className={styles.linkBtn} onClick={clearFilters}>
                          Clear all
                        </button>
                        <button type="button" className={styles.linkBtn} onClick={closeFilter}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.selectWrap}>
                  <select
                    className={cx(styles.select, platformFilter !== "All" && styles.selectActive)}
                    value={platformFilter}
                    aria-label="Platform"
                    onChange={(e) => setPlatformFilter(e.target.value as Platform | "All")}
                  >
                    <option value="All">Platform</option>
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={styles.selectIcon} />
                </div>

                <div className={styles.selectWrap}>
                  <select
                    className={cx(styles.select, typeFilter !== "All" && styles.selectActive)}
                    value={typeFilter}
                    aria-label="Content type"
                    onChange={(e) => setTypeFilter(e.target.value as ContentType | "All")}
                  >
                    <option value="All">Content Type</option>
                    {CONTENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={styles.selectIcon} />
                </div>

                <div className={cx(styles.searchWrap, (searchOpen || query) && styles.searchOpen)}>
                  <button
                    type="button"
                    className={styles.searchBtn}
                    aria-label="Search"
                    onClick={() => {
                      setSearchOpen((o) => !o);
                      setTimeout(() => searchRef.current?.focus(), 50);
                    }}
                  >
                    <Search />
                  </button>
                  <input
                    ref={searchRef}
                    className={styles.searchInput}
                    placeholder="Search posts…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button type="button" className={styles.searchBtn} aria-label="Clear search" onClick={() => setQuery("")}>
                      <X />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {view === "month" && (
              <MonthView
                year={year}
                month={month}
                byDate={byDate}
                todayKey={todayKey}
                selectedKey={selectedKey}
                onDayClick={handleDayClick}
              />
            )}
            {view === "week" && (
              <WeekView
                anchorKey={anchorKey}
                byDate={byDate}
                todayKey={todayKey}
                selectedKey={selectedKey}
                onSelect={setSelectedKey}
                onPostClick={(id) => openPost(id)}
                onAdd={(k) => openAdd(k)}
              />
            )}
            {view === "list" && (
              <ListView posts={monthPosts} todayKey={todayKey} onPostClick={(id) => openPost(id)} onAdd={() => openAdd()} />
            )}

            <div className={styles.legend}>
              {STATUSES.map((s) => (
                <span key={s} className={styles.legendItem}>
                  <i style={{ background: STATUS_META[s].color }} />
                  {s}
                </span>
              ))}
              {activeFilterCount > 0 && (
                <button type="button" className={styles.linkBtn} onClick={clearFilters}>
                  Clear filters ({activeFilterCount})
                </button>
              )}
              <span className={styles.legendHint}>Colored dots = multiple posts on a day</span>
            </div>
          </section>
        </div>

        {/* ═══════════ SIDE COLUMN ═══════════ */}
        <div className={styles.sideCol} ref={sideRef}>
          <SidePanel
            posts={posts}
            nowStamp={`${todayKey} ${nowTime}`}
            approval={approval}
            ideas={ideas}
            onAddNew={() => openAdd()}
            onOpenPost={(id) => openPost(id)}
            onEdit={(p) => setModal({ mode: "edit", post: p })}
            onDuplicate={duplicatePost}
            onDelete={deletePost}
            onToggleIdea={(id) => setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))}
            onUseIdea={(idea) => openAdd(selectedKey, idea.title, idea.id)}
            onAddIdea={(t) => setIdeas((prev) => [...prev, { id: genId("idea"), title: t, done: false }])}
          />
        </div>
      </div>

      {showDrawer && drawer && (
        <DayDrawer
          state={drawer}
          dayPosts={drawerDayPosts}
          post={drawerPost}
          onClose={() => setDrawer(null)}
          onOpenPost={(id, from) => openPost(id, from)}
          onBackToDay={(date) => setDrawer({ mode: "day", date })}
          onAdd={(date) => openAdd(date)}
          onEdit={(p) => setModal({ mode: "edit", post: p })}
          onDuplicate={duplicatePost}
          onDelete={deletePost}
          onStatus={(id, s) => {
            updatePost(id, { status: s }, `Status changed to ${s}`);
            setToast(`Marked as ${s}`);
          }}
          onReschedule={(id, d, t) => {
            updatePost(id, { date: d, time: t }, `Rescheduled to ${formatShort(d)}, ${to12h(t)}`);
            setSelectedKey(d);
            setAnchorKey(d);
            setDrawer({ mode: "post", postId: id, fromDate: null });
            setToast(`Rescheduled to ${formatShort(d)}`);
          }}
          onAddComment={(id, text) => {
            const n = nowParts();
            setPosts((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      comments: [...p.comments, { id: genId("c"), author: "You", text, time: `${formatShort(n.date)}, ${to12h(n.time)}` }],
                    }
                  : p,
              ),
            );
          }}
          onAddMedia={(id, media) => {
            const p = posts.find((x) => x.id === id);
            if (p) updatePost(id, { media: [...p.media, ...media] }, `Added ${media.length} media file${media.length > 1 ? "s" : ""}`);
          }}
          onRemoveMedia={(id, index) => {
            const p = posts.find((x) => x.id === id);
            if (p) updatePost(id, { media: p.media.filter((_, i) => i !== index) }, "Removed a media file");
          }}
        />
      )}

      {modal && <AddContentModal key={modal.mode === "edit" ? modal.post.id : `add-${modal.date}`} state={modal} onClose={() => setModal(null)} onSave={handleSave} />}

      {toast && (
        <div className={styles.toast} role="status">
          <Check /> {toast}
        </div>
      )}
    </div>
  );
}
