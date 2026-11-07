"use client";

// "Search & Filter" card (desktop side panel, and the filter sheet on phones).
// Dropdowns and dates are a draft until "Apply Filters"; search applies as you type.

import { useCallback, useState } from "react";
import { CalendarDays, ChevronDown, Search, X } from "lucide-react";
import { addDays, fmtDate } from "../../../../data/announcementData";
import { todayKey } from "../../../../data/employeeData";
import { STATUS_OPTIONS, TYPE_OPTIONS, monthRange, type Filters } from "./feed";
import { SelectBox, cx, useDismiss } from "./ui";
import styles from "../announcements.module.css";

export default function FilterPanel({
  draft,
  setDraft,
  q,
  setQ,
  depts,
  now,
  onApply,
  onClear,
  showSearch = true,
}: {
  draft: Filters;
  setDraft: (f: Filters) => void;
  q: string;
  setQ: (q: string) => void;
  depts: string[];
  now: Date;
  onApply: () => void;
  onClear: () => void;
  showSearch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  const label = draft.from || draft.to ? `${draft.from ? fmtDate(draft.from) : "Any"} - ${draft.to ? fmtDate(draft.to) : "Any"}` : "All dates";
  const presets = [
    { label: "This month", ...monthRange(now) },
    { label: "Last month", ...monthRange(now, -1) },
    { label: "Next month", ...monthRange(now, 1) },
    { label: "Last 3 months", from: monthRange(now, -2).from, to: monthRange(now).to },
    { label: "Next 30 days", from: todayKey(now), to: addDays(todayKey(now), 30) },
    { label: "All dates", from: "", to: "" },
  ];

  return (
    <div className={styles.filterBody}>
      {showSearch && (
        <label className={styles.search}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search announcements..." aria-label="Search announcements" />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search">
              <X size={13} />
            </button>
          )}
        </label>
      )}

      <label className={styles.fLabel}>
        <span>Department</span>
        <SelectBox
          value={draft.dept}
          onChange={(v) => setDraft({ ...draft, dept: v })}
          allLabel="All Departments"
          ariaLabel="Department"
          options={depts.map((d) => ({ value: d, label: d }))}
        />
      </label>
      <label className={styles.fLabel}>
        <span>Announcement Type</span>
        <SelectBox
          value={draft.type}
          onChange={(v) => setDraft({ ...draft, type: v })}
          allLabel="All Types"
          ariaLabel="Announcement type"
          options={TYPE_OPTIONS}
        />
      </label>
      <label className={styles.fLabel}>
        <span>Status</span>
        <SelectBox value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} allLabel="All Status" ariaLabel="Status" options={STATUS_OPTIONS} />
      </label>
      <div className={styles.fLabel}>
        <span>Date Range</span>
        <div className={styles.rangeWrap} ref={ref}>
          <button type="button" className={styles.rangeBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Date range: ${label}`}>
            <CalendarDays size={16} />
            <span>{label}</span>
            <ChevronDown size={15} />
          </button>
          {open && (
            <div className={styles.rangePop}>
              <div className={styles.presets}>
                {presets.map((p) => (
                  <button
                    type="button"
                    key={p.label}
                    className={cx(draft.from === p.from && draft.to === p.to && styles.presetOn)}
                    onClick={() => {
                      setDraft({ ...draft, from: p.from, to: p.to });
                      setOpen(false);
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className={styles.customRange}>
                <label>
                  From
                  <input type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
                </label>
                <label>
                  To
                  <input type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterActions}>
        <button type="button" className={styles.clearBtn} onClick={onClear}>
          Clear Filters
        </button>
        <button type="button" className={styles.applyBtn} onClick={onApply}>
          Apply Filters
        </button>
      </div>
    </div>
  );
}
