"use client";

// src/app/dashboard/Announcements/page.tsx
// Announcements – what employees read.
// Shows every announcement sent from /dashboard/AnnouncementManagement. Scheduled ones
// are listed under "Upcoming" and move into the feed automatically at their send time.
// Add ?employee=EMP001 to the URL to see only what that employee received.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Inbox, Search, Send, SlidersHorizontal, X } from "lucide-react";
import { OTHERS, announcementFeed, departmentsOf, people, statusOf, type Announcement } from "../../../data/announcementData";
import AnnouncementCard from "./_components/AnnouncementCard";
import FileViewer from "./_components/FileViewer";
import FilterPanel from "./_components/FilterPanel";
import { StayInformed, UpcomingPanel } from "./_components/SidePanels";
import { FEED_TABS, applyFilters, defaultFilters, emptyFilters, noticeHref, tabLabel, tabOf, type Filters } from "./_components/feed";
import { Dialog, cx, useIsClient, useIsMobile, useViewerId } from "./_components/ui";
import styles from "./announcements.module.css";

const PAGE_SIZE = 6;
const ALL = "";

export default function AnnouncementsPage() {
  const ready = useIsClient();
  const isMobile = useIsMobile();
  const viewerId = useViewerId();

  const [version, setVersion] = useState(0);
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  // ?tab=Marketing opens a category directly (used by "View All" on the notice page).
  const [tab, setTab] = useState(() => (typeof window === "undefined" ? ALL : (new URLSearchParams(window.location.search).get("tab") ?? ALL)));
  const [applied, setApplied] = useState<Filters>(() => defaultFilters(new Date()));
  const [draft, setDraft] = useState<Filters>(() => defaultFilters(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fileView, setFileView] = useState<{ id: string; index: number } | null>(null);
  const [limit, setLimit] = useState({ key: "", n: PAGE_SIZE });

  // New and scheduled announcements show up without a reload: re-check every 30 s,
  // when the tab becomes visible again, and when another tab saves announcements.
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    const refresh = () => setVersion((n) => n + 1);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [tick, version]);
  const list = useMemo(() => (ready ? people() : []), [ready]);
  const depts = useMemo(() => departmentsOf(list), [list]);
  const feed = useMemo(() => (ready ? announcementFeed(viewerId, now) : { published: [], upcoming: [] }), [ready, viewerId, now]);
  const viewer = viewerId ? list.find((p) => p.id === viewerId) : undefined;

  const filtered = useMemo(() => applyFilters(feed.published, feed.upcoming, q, applied, list, now), [feed, q, applied, list, now]);
  const tabs = useMemo(() => {
    const count = (t: string) => filtered.filter((a) => tabOf(a) === t).length;
    return [
      { key: ALL, label: "All Announcements", short: "All", n: filtered.length },
      ...[...FEED_TABS, OTHERS].map((t) => ({ key: t, label: tabLabel(t), short: tabLabel(t), n: count(t) })),
    ];
  }, [filtered]);
  const shown = useMemo(() => (tab === ALL ? filtered : filtered.filter((a) => tabOf(a) === tab)), [filtered, tab]);

  // "Load more" resets when the list changes (kept with the key it belongs to).
  const listKey = `${tab}|${q}|${JSON.stringify(applied)}`;
  const visibleCount = limit.key === listKey ? limit.n : PAGE_SIZE;
  const visible = shown.slice(0, visibleCount);

  const active = useMemo(() => feed.published.filter((a) => statusOf(a, now) === "active"), [feed, now]);

  const apply = () => {
    setApplied(draft);
    setSheetOpen(false);
  };
  const clear = () => {
    setDraft(emptyFilters());
    setApplied(emptyFilters());
    setQ("");
    setTab(ALL);
    setSheetOpen(false);
  };
  const showUpcoming = () => {
    const f = { ...emptyFilters(), status: "upcoming" };
    setDraft(f);
    setApplied(f);
    setTab(ALL);
    document.getElementById("feed-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const openSheet = () => {
    setDraft(applied);
    setSheetOpen(true);
  };
  const closeViewer = useCallback(() => setFileView(null), []);
  const viewing = fileView ? [...feed.published, ...feed.upcoming].find((a) => a.id === fileView.id) : undefined;
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const mobileFilterCount = [applied.dept, applied.type, applied.status].filter(Boolean).length;

  const filterPanel = (showSearch: boolean) => (
    <FilterPanel draft={draft} setDraft={setDraft} q={q} setQ={setQ} depts={depts} now={now} onApply={apply} onClear={clear} showSearch={showSearch} />
  );

  const side = (
    <>
      <UpcomingPanel
        upcoming={feed.upcoming}
        active={active}
        list={list}
        now={now}
        hrefOf={(a: Announcement) => noticeHref(a.id, viewerId)}
        onViewAll={showUpcoming}
      />
      <StayInformed />
    </>
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          {!isMobile && (
            <nav className={styles.crumb} aria-label="Breadcrumb">
              <Link href="/dashboard">Home</Link>
              <ChevronRight size={13} />
              <span>Announcements</span>
            </nav>
          )}
          <h1>Announcements</h1>
          <p>Stay updated with the latest news, policies, events and important information.</p>
          {viewer && (
            <span className={styles.viewerChip}>
              Showing announcements for <b>{viewer.name}</b>
            </span>
          )}
        </div>
        {!isMobile && (
          <Link href="/dashboard/AnnouncementManagement" className={styles.headBtn} title="Create and manage announcements">
            <Send size={17} /> Announcements
          </Link>
        )}
      </header>

      {!ready ? (
        <p className={styles.loading}>Loading announcements…</p>
      ) : (
        <div className={styles.layout}>
          <main className={styles.main}>
            {isMobile && (
              <div className={styles.mobileSearch}>
                <label className={styles.search}>
                  <Search size={17} />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search announcements, keywords..." aria-label="Search announcements" />
                  {q && (
                    <button type="button" onClick={() => setQ("")} aria-label="Clear search">
                      <X size={13} />
                    </button>
                  )}
                </label>
                <button className={styles.filterBtn} onClick={openSheet} aria-label="Filters">
                  <SlidersHorizontal size={19} />
                  {mobileFilterCount > 0 && <em>{mobileFilterCount}</em>}
                </button>
              </div>
            )}

            <div id="feed-top" className={styles.tabs} role="tablist" aria-label="Categories">
              {tabs.map((t) => (
                <button
                  key={t.key || "all"}
                  role="tab"
                  aria-selected={tab === t.key}
                  className={cx(styles.tab, tab === t.key && styles.tabOn)}
                  onClick={() => setTab(t.key)}
                >
                  {isMobile ? t.short : t.label} ({t.n})
                </button>
              ))}
            </div>

            {(applied.status || applied.dept || applied.type) && (
              <div className={styles.activeFilters}>
                {applied.status === "upcoming" && <span>Showing upcoming announcements</span>}
                <button className={styles.clearLink} onClick={clear}>
                  Clear filters
                </button>
              </div>
            )}

            <div className={styles.feed}>
              {visible.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  a={a}
                  list={list}
                  now={now}
                  isMobile={isMobile}
                  href={noticeHref(a.id, viewerId)}
                  onOpenFile={() => setFileView({ id: a.id, index: 0 })}
                />
              ))}
              {!shown.length && (
                <div className={styles.empty}>
                  <span>
                    <Inbox size={26} />
                  </span>
                  <b>No announcements here</b>
                  <p>
                    {q || applied.dept || applied.type || applied.status
                      ? "Try a different search or clear the filters."
                      : "New announcements will appear here as soon as they are sent."}
                  </p>
                  <button className={styles.clearLink} onClick={clear}>
                    Show all announcements
                  </button>
                </div>
              )}
            </div>

            {shown.length > visibleCount && (
              <button className={styles.loadMore} onClick={() => setLimit({ key: listKey, n: visibleCount + PAGE_SIZE })}>
                Load more announcements ({shown.length - visibleCount} more)
              </button>
            )}

            {isMobile && <div className={styles.mobileSide}>{side}</div>}
          </main>

          {!isMobile && (
            <aside className={styles.aside}>
              <section className={styles.sideCard} aria-labelledby="filter-title">
                <h2 id="filter-title" className={styles.sideTitle}>
                  Search &amp; Filter
                </h2>
                {filterPanel(true)}
              </section>
              {side}
            </aside>
          )}
        </div>
      )}

      {sheetOpen && (
        <Dialog label="Filter Announcements" onClose={closeSheet}>
          {filterPanel(false)}
        </Dialog>
      )}

      {viewing && fileView && (
        <FileViewer files={viewing.attachments} index={fileView.index} onIndex={(index) => setFileView({ id: viewing.id, index })} onClose={closeViewer} />
      )}
    </div>
  );
}
