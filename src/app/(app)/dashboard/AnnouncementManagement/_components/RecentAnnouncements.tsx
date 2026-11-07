"use client";

// Recent Announcements: search, filters, date range, sortable status, paging.

import { useMemo, useState } from "react";
import { ArrowDownUp, Ban, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Copy, Eye, MoreVertical, RefreshCw, Search, Trash2, X } from "lucide-react";
import {
  STATUS_META,
  TARGET_TYPE_LABEL,
  addDays,
  audienceLabel,
  categoryOf,
  departmentsOf,
  departmentsReached,
  fmtDate,
  statusOf,
  textOf,
  type AnnStatus,
  type Announcement,
  type AudienceType,
  type Person,
} from "../../../../data/announcementData";
import { todayKey } from "../../../../data/employeeData";
import { AnnouncementLogo } from "../../../components/announcements/AnnouncementLogo";
import { RowMenu, SelectBox, StatusPill, cx, useDismiss } from "./ui";
import styles from "../announcement.module.css";

export interface TableFilters {
  q: string;
  status: string;
  dept: string;
  type: string;
  from: string; // YYYY-MM-DD or ""
  to: string;
}

const PER_PAGE = 5;
const STATUS_ORDER: AnnStatus[] = ["active", "scheduled", "expired", "cancelled"];

export function monthRange(now: Date, offset = 0) {
  const from = todayKey(new Date(now.getFullYear(), now.getMonth() + offset, 1));
  const to = todayKey(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0));
  return { from, to };
}

export default function RecentAnnouncements({
  items,
  list,
  now,
  filters,
  setFilters,
  isMobile,
  onView,
  onDuplicate,
  onCancel,
  onDelete,
  onRefresh,
}: {
  items: Announcement[];
  list: Person[];
  now: Date;
  filters: TableFilters;
  setFilters: (f: TableFilters) => void;
  isMobile: boolean;
  onView: (a: Announcement) => void;
  onDuplicate: (a: Announcement) => void;
  onCancel: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
  onRefresh: () => void;
}) {
  const [sortDir, setSortDir] = useState<0 | 1 | -1>(0);
  const [page, setPage] = useState({ key: "", n: 1 });
  const [rangeOpen, setRangeOpen] = useState(false);
  const [spin, setSpin] = useState(0);
  const rangeRef = useDismiss<HTMLDivElement>(rangeOpen, () => setRangeOpen(false));
  const depts = useMemo(() => departmentsOf(list), [list]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let out = items.filter((a) => {
      const st = statusOf(a, now);
      if (filters.status && st !== filters.status) return false;
      if (filters.type && a.audience.type !== filters.type) return false;
      if (filters.dept && !departmentsReached(a, list).includes(filters.dept)) return false;
      if (filters.from && a.endDate < filters.from) return false; // period overlaps the range
      if (filters.to && a.startDate > filters.to) return false;
      if (q && ![a.title, a.createdBy, textOf(a.message)].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
    out = [...out].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    if (sortDir) out.sort((x, y) => sortDir * (STATUS_ORDER.indexOf(statusOf(x, now)) - STATUS_ORDER.indexOf(statusOf(y, now))));
    return out;
  }, [items, filters, list, now, sortDir]);

  // Paging resets when filters change (stored with the key it belongs to — no effect needed).
  const pageKey = `${JSON.stringify(filters)}|${sortDir}`;
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page.key === pageKey ? page.n : 1, pages);
  const shown = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const go = (n: number) => setPage({ key: pageKey, n });

  const rangeLabel = filters.from || filters.to ? `${filters.from ? fmtDate(filters.from) : "Any"} – ${filters.to ? fmtDate(filters.to) : "Any"}` : "All dates";
  const presets = [
    { label: "This month", ...monthRange(now) },
    { label: "Last month", ...monthRange(now, -1) },
    { label: "Last 3 months", from: monthRange(now, -2).from, to: monthRange(now).to },
    { label: "Next 30 days", from: todayKey(now), to: addDays(todayKey(now), 30) },
    { label: "All dates", from: "", to: "" },
  ];

  const menu = (a: Announcement) => {
    const st = statusOf(a, now);
    return [
      { label: "View details", icon: <Eye size={15} />, onClick: () => onView(a) },
      { label: "Duplicate", icon: <Copy size={15} />, onClick: () => onDuplicate(a) },
      ...(st === "active" || st === "scheduled"
        ? [{ label: st === "scheduled" ? "Cancel schedule" : "Cancel announcement", icon: <Ban size={15} />, onClick: () => onCancel(a) }]
        : []),
      { label: "Delete", icon: <Trash2 size={15} />, onClick: () => onDelete(a), danger: true },
    ];
  };

  return (
    <section className={styles.recent} aria-labelledby="recent-title">
      <h2 id="recent-title" className={styles.recentTitle}>
        Recent Announcements
      </h2>
      <div className={styles.recentFilters}>
        <label className={styles.search}>
          <Search size={17} />
          <input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Search announcements by title, content or creator..."
          />
          {filters.q && (
            <button onClick={() => setFilters({ ...filters, q: "" })} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
        <SelectBox
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          allLabel="All Status"
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))}
        />
        <SelectBox value={filters.dept} onChange={(v) => setFilters({ ...filters, dept: v })} allLabel="All Departments" options={depts} />
        <SelectBox
          value={filters.type}
          onChange={(v) => setFilters({ ...filters, type: v })}
          allLabel="All Target Types"
          options={(Object.keys(TARGET_TYPE_LABEL) as AudienceType[]).map((t) => ({ value: t, label: TARGET_TYPE_LABEL[t] }))}
        />
        <div className={styles.rangeWrap} ref={rangeRef}>
          <button className={styles.rangeBtn} onClick={() => setRangeOpen((o) => !o)} aria-expanded={rangeOpen}>
            <CalendarDays size={17} />
            <span>{rangeLabel}</span>
            <ChevronDown size={16} />
          </button>
          {rangeOpen && (
            <div className={styles.rangePop}>
              <div className={styles.presets}>
                {presets.map((p) => (
                  <button
                    key={p.label}
                    className={cx(filters.from === p.from && filters.to === p.to && styles.presetOn)}
                    onClick={() => {
                      setFilters({ ...filters, from: p.from, to: p.to });
                      setRangeOpen(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className={styles.customRange}>
                <label>
                  From
                  <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                </label>
                <label>
                  To
                  <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                </label>
              </div>
            </div>
          )}
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => {
            setSpin((n) => n + 1);
            onRefresh();
          }}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw size={17} key={spin} className={spin ? styles.spinOnce : undefined} />
        </button>
      </div>

      {!isMobile ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.cNum}>#</th>
                <th>Title</th>
                <th>Created By</th>
                <th>Target Audience</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Recipients</th>
                <th className={styles.cStatus}>
                  <button className={styles.sortBtn} onClick={() => setSortDir((d) => (d === 0 ? 1 : d === 1 ? -1 : 0))} aria-label="Sort by status">
                    Status <ArrowDownUp size={13} className={cx(sortDir !== 0 && styles.sortOn)} />
                  </button>
                </th>
                <th className={styles.cActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a, i) => (
                <tr key={a.id}>
                  <td className={styles.cNum}>{(current - 1) * PER_PAGE + i + 1}</td>
                  <td>
                    <span className={styles.titleCell}>
                      <AnnouncementLogo logo={a.logo} category={categoryOf(a)} urgent={a.urgent} size={28} />
                      <button className={styles.titleLink} onClick={() => onView(a)}>
                        {a.title}
                      </button>
                    </span>
                  </td>
                  <td>{a.createdBy}</td>
                  <td>{audienceLabel(a.audience, list)}</td>
                  <td>{fmtDate(a.startDate)}</td>
                  <td>{fmtDate(a.endDate)}</td>
                  <td>{a.recipientIds.length}</td>
                  <td className={styles.cStatus}>
                    <StatusPill status={statusOf(a, now)} />
                  </td>
                  <td className={styles.cActions}>
                    <RowMenu label={`Actions for ${a.title}`} icon={<MoreVertical size={17} />} items={menu(a)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty onReset={() => setFilters({ q: "", status: "", dept: "", type: "", from: "", to: "" })} />}
        </div>
      ) : (
        <div className={styles.cards}>
          {shown.map((a) => (
            <article key={a.id} className={styles.annCard}>
              <div className={styles.annTop}>
                <button className={styles.titleLink} onClick={() => onView(a)}>
                  {a.title}
                </button>
                <RowMenu label={`Actions for ${a.title}`} icon={<MoreVertical size={17} />} items={menu(a)} />
              </div>
              <p className={styles.annMeta}>
                {audienceLabel(a.audience, list)} · {a.recipientIds.length} {a.recipientIds.length === 1 ? "recipient" : "recipients"}
              </p>
              <div className={styles.annBottom}>
                <span>
                  {fmtDate(a.startDate)} – {fmtDate(a.endDate)}
                </span>
                <StatusPill status={statusOf(a, now)} />
              </div>
            </article>
          ))}
          {!rows.length && <Empty onReset={() => setFilters({ q: "", status: "", dept: "", type: "", from: "", to: "" })} />}
        </div>
      )}

      {rows.length > 0 && (
        <div className={styles.tableFoot}>
          <span>
            Showing {(current - 1) * PER_PAGE + 1} to {Math.min(current * PER_PAGE, rows.length)} of {rows.length} announcements
          </span>
          <div className={styles.pager}>
            <button onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            {!isMobile &&
              Array.from({ length: pages }, (_, i) => i + 1)
                .slice(Math.max(0, Math.min(current - 2, pages - 4)), Math.max(0, Math.min(current - 2, pages - 4)) + 4)
                .map((n) => (
                  <button key={n} className={cx(n === current && styles.pageOn)} onClick={() => go(n)}>
                    {n}
                  </button>
                ))}
            <button onClick={() => go(current + 1)} disabled={current >= pages} aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Empty({ onReset }: { onReset: () => void }) {
  return (
    <div className={styles.empty}>
      <p>No announcements match these filters.</p>
      <button className={styles.linkBtn} onClick={onReset}>
        Show all announcements
      </button>
    </div>
  );
}
