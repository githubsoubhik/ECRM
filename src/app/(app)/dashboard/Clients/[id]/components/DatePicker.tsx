"use client";
// Path: src/app/dashboard/Clients/[id]/components/DatePicker.tsx
// "View data as of" date picker shown on the right of the tab bar.
// Desktop/tablet: "Wed, Jul 29, 2026  📅"   ·   Phone: calendar icon only.
// Picking a date updates the whole page (campaigns, calendar, stats, charts) via ClientStore.

import { useEffect, useRef, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { addDays, formatLongDate, toISO } from "../../../../../data/clientDetailsData";
import { useClient } from "./ClientStore";
import s from "../ClientDetails.module.css";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker() {
  const { asOfDate, setAsOfDate, today, isToday, data } = useClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => asOfDate.slice(0, 7)); // "YYYY-MM" month being shown
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => wrapRef.current && !wrapRef.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Days that have posts or campaigns starting/ending — shown with a dot
  const marked = new Set<string>();
  Object.values(data.calendar).flat().forEach((p) => marked.add(p.date));
  Object.values(data.campaigns).flat().forEach((c) => {
    marked.add(c.startDate);
    marked.add(c.endDate);
  });

  const [vy, vm] = view.split("-").map(Number);
  const first = new Date(vy, vm - 1, 1);
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(vy, vm - 1, 1 - first.getDay() + i);
    return { iso: toISO(d), day: d.getDate(), inMonth: d.getMonth() === vm - 1 };
  });

  const shiftMonth = (n: number) => {
    const d = new Date(vy, vm - 1 + n, 1);
    setView(toISO(d).slice(0, 7));
  };

  const toggle = () => {
    if (!open) setView(asOfDate.slice(0, 7)); // open on the selected month
    setOpen((o) => !o);
  };

  const pick = (iso: string) => {
    setAsOfDate(iso);
    setOpen(false);
  };

  return (
    <div className={s.dateWrap} ref={wrapRef}>
      <button
        type="button"
        className={`${s.dateBtn} ${isToday ? "" : s.dateBtnActive}`}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`View data as of ${formatLongDate(asOfDate)}. Change date`}
        title="View data as of a date"
      >
        <span className={s.dateText}>{formatLongDate(asOfDate)}</span>
        <FiCalendar />
        {!isToday && <i className={s.dateDot} aria-hidden />}
      </button>

      {open && (
        <div className={s.datePop} role="dialog" aria-label="Choose date">
          <div className={s.dateHead}>
            <button type="button" className={s.dateNav} onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <FiChevronLeft />
            </button>
            <strong>{monthLabel}</strong>
            <button type="button" className={s.dateNav} onClick={() => shiftMonth(1)} aria-label="Next month">
              <FiChevronRight />
            </button>
          </div>

          <div className={s.dateGrid} role="grid">
            {WEEKDAYS.map((w) => (
              <span key={w} className={s.dateWeekday} role="columnheader">
                {w}
              </span>
            ))}
            {cells.map((c) => {
              const selected = c.iso === asOfDate;
              const isTodayCell = c.iso === today;
              return (
                <button
                  key={c.iso}
                  type="button"
                  role="gridcell"
                  aria-selected={selected}
                  aria-label={formatLongDate(c.iso)}
                  className={[
                    s.dateCell,
                    c.inMonth ? "" : s.dateOut,
                    selected ? s.dateSel : "",
                    isTodayCell && !selected ? s.dateToday : "",
                    c.iso > today ? s.dateFuture : "",
                  ].join(" ")}
                  onClick={() => pick(c.iso)}
                >
                  {c.day}
                  {marked.has(c.iso) && <i className={s.dateMark} aria-hidden />}
                </button>
              );
            })}
          </div>

          <div className={s.dateFoot}>
            <span className={s.dateLegend}>
              <i className={s.dateMarkInline} /> Has activity
            </span>
            <div className={s.dateQuick}>
              <button type="button" className={s.btnChip} onClick={() => pick(addDays(today, -7))}>
                −7 days
              </button>
              <button type="button" className={s.btnPrimarySm} onClick={() => pick(today)} disabled={isToday}>
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
