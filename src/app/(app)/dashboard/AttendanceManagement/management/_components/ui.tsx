"use client";

// Small building blocks shared by all Attendance views.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LogIn,
  LogOut,
  Plane,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { MONTHS, MONTHS_SHORT, STATUS_META, fmtTime, fromKey, type ActivityItem, type AttStatus } from "../../../../../data/attendanceData";
import { VIEWS, useAtt, type ViewKey } from "./context";
import styles from "../attendance.module.css";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

// Subscribes to a media query without setting state inside an effect.
export function useIsMobile(breakpoint = 767) {
  const query = `(max-width: ${breakpoint}px)`;
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Closes a popover when clicking outside it or pressing Escape.
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/* ------------------------------------------------------------------ */
/* Avatar & status                                                     */
/* ------------------------------------------------------------------ */

const AVATAR_TONES = ["#dbe7ff", "#fde2e4", "#dcf5e7", "#fff1d6", "#ece3ff", "#d9f3f6", "#ffe4d1"];

export function Avatar({ name, photoUrl, size = 36 }: { name: string; photoUrl?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const tone = AVATAR_TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span className={styles.avatar} style={{ width: size, height: size, background: tone, fontSize: size * 0.36 }}>
      {!failed && photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}

export function StatusPill({ status, dot = false, size = "md" }: { status: AttStatus | null; dot?: boolean; size?: "sm" | "md" }) {
  if (!status) return <span className={styles.muted}>—</span>;
  const m = STATUS_META[status];
  return (
    <span className={cx(styles.pill, size === "sm" && styles.pillSm)} style={{ color: m.text, background: m.soft }}>
      {dot && <i style={{ background: m.color }} />}
      {m.label}
    </span>
  );
}

export function Dot({ status, size = 8 }: { status: AttStatus; size?: number }) {
  return <i className={styles.dot} style={{ background: STATUS_META[status].color, width: size, height: size }} />;
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

export interface StatProps {
  icon: LucideIcon;
  color: string;
  soft: string;
  label: string;
  value: number | string;
  badge?: { text: string; color: string; soft: string };
  trend?: { text: string; up: boolean | null; good: boolean };
  sub?: ReactNode;
  layout?: "labelTop" | "valueTop";
}

export function StatCard({ icon: Icon, color, soft, label, value, badge, trend, sub, layout = "valueTop" }: StatProps) {
  return (
    <div className={cx(styles.stat, layout === "labelTop" ? styles.statLabelTop : styles.statValueTop)}>
      <span className={styles.statIcon} style={{ color, background: soft }}>
        <Icon />
      </span>
      <div className={styles.statBody}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statValueRow}>
          <strong className={styles.statValue}>{value}</strong>
          {badge && (
            <span className={styles.statBadge} style={{ color: badge.color, background: badge.soft }}>
              {badge.text}
            </span>
          )}
        </div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
      {trend && (
        <div className={styles.statTrend}>
          <span
            className={styles.trendChip}
            style={{
              color: trend.up === null ? "#6b7280" : trend.good ? "#15803d" : "#dc2626",
              background: trend.up === null ? "#f1f2f5" : trend.good ? "#e3f6ea" : "#fde8e8",
            }}
          >
            {trend.up === null ? "↑" : trend.up ? "↑" : "↓"} {trend.text}
          </span>
          <small>vs. yesterday</small>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export function SelectBox({
  value,
  onChange,
  options,
  allLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  allLabel: string;
  className?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className={cx(styles.select, className)}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={allLabel}>
        <option value="">{allLabel}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} />
    </label>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={cx(styles.search, className)}>
      <Search size={17} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search">
          <X size={14} />
        </button>
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Month picker                                                        */
/* ------------------------------------------------------------------ */

export function MonthPicker({ variant = "full", withArrows = false }: { variant?: "full" | "short" | "icon"; withArrows?: boolean }) {
  const { year, month, setMonth, ctx } = useAtt();
  const [open, setOpen] = useState(false);
  const [pickYear, setPickYear] = useState(year);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const [ty, tm] = ctx.today.split("-").map(Number);
  const isFuture = (y: number, m: number) => y > ty || (y === ty && m > tm - 1);

  const shift = (n: number) => {
    const d = new Date(year, month + n, 1);
    if (!isFuture(d.getFullYear(), d.getMonth())) setMonth(d.getFullYear(), d.getMonth());
  };

  const label = variant === "short" ? `${MONTHS_SHORT[month]} ${year}` : `${MONTHS[month]} ${year}`;

  return (
    <div className={styles.monthPickerWrap}>
      {withArrows && (
        <button className={styles.iconBtn} onClick={() => shift(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
      )}
      <div className={styles.monthPicker} ref={ref}>
        <button
          className={cx(styles.monthBtn, variant === "icon" && styles.monthBtnIcon)}
          onClick={() => {
            setPickYear(year);
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          aria-label={variant === "icon" ? `Choose month (${label})` : undefined}
        >
          <CalendarDays size={17} />
          {variant !== "icon" && <span>{label}</span>}
          {variant !== "icon" && <ChevronDown size={16} />}
        </button>
        {open && (
          <div className={styles.monthPop}>
            <div className={styles.monthPopHead}>
              <button onClick={() => setPickYear((y) => y - 1)} aria-label="Previous year">
                <ChevronLeft size={16} />
              </button>
              <strong>{pickYear}</strong>
              <button onClick={() => setPickYear((y) => y + 1)} disabled={pickYear >= ty} aria-label="Next year">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className={styles.monthGrid}>
              {MONTHS_SHORT.map((m, i) => (
                <button
                  key={m}
                  disabled={isFuture(pickYear, i)}
                  className={cx(pickYear === year && i === month && styles.on)}
                  onClick={() => {
                    setMonth(pickYear, i);
                    setOpen(false);
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {withArrows && (
        <button
          className={styles.iconBtn}
          onClick={() => shift(1)}
          disabled={isFuture(new Date(year, month + 1, 1).getFullYear(), new Date(year, month + 1, 1).getMonth())}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export function Tabs({ pill = false }: { pill?: boolean }) {
  const { view, setView, isMobile } = useAtt();
  return (
    <nav className={cx(styles.tabs, pill && styles.tabsPill)} role="tablist">
      {VIEWS.map((v) => (
        <button key={v.key} role="tab" aria-selected={view === v.key} className={cx(view === v.key && styles.tabOn)} onClick={() => setView(v.key as ViewKey)}>
          {isMobile && v.key !== view ? v.short : v.label}
        </button>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

// Paging that returns to page 1 whenever `resetKey` or the page size changes.
// The page is stored together with the key it belongs to, so no effect is needed.
export function usePaged<T>(items: T[], perPage: number, resetKey: unknown) {
  const key = `${String(resetKey)}|${perPage}`;
  const [state, setState] = useState({ key, page: 1 });
  const page = state.key === key ? state.page : 1;
  const setPage = (p: number) => setState({ key, page: p });
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(page, pages);
  const start = (current - 1) * perPage;
  return {
    page: current,
    pages,
    setPage,
    rows: items.slice(start, start + perPage),
    from: items.length ? start + 1 : 0,
    to: Math.min(start + perPage, items.length),
    total: items.length,
  };
}

export function Pagination({ page, pages, onPage, compact = false }: { page: number; pages: number; onPage: (p: number) => void; compact?: boolean }) {
  const nums: number[] = [];
  const lo = Math.max(1, Math.min(page - 1, pages - 3));
  for (let i = lo; i <= Math.min(pages, lo + 3); i++) nums.push(i);
  return (
    <div className={styles.pager}>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {!compact &&
        nums.map((n) => (
          <button key={n} className={cx(n === page && styles.on)} onClick={() => onPage(n)}>
            {n}
          </button>
        ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function RowsPerPage({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <label className={styles.rowsPer}>
      <span>Rows per page</span>
      <span className={styles.select}>
        <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
          {[8, 10, 15, 25].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                         */
/* ------------------------------------------------------------------ */

export function Donut({ parts, total, size = 120, stroke = 14 }: { parts: { value: number; color: string }[]; total: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = parts.reduce((s, p) => s + p.value, 0) || 1;
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 2 : 0;
  // Where each segment starts along the ring (computed up front, no reassignment in render).
  const lens = parts.map((p) => (p.value / sum) * c);
  const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className={styles.donut} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f4" strokeWidth={stroke} />
        {parts.map((p, i) => {
          if (!p.value) return null;
          const len = lens[i];
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
              strokeDashoffset={-starts[i]}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className={styles.donutCenter}>
        <strong>{total}</strong>
        <span>Employees</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal shell                                                         */
/* ------------------------------------------------------------------ */

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={cx(styles.modal, wide && styles.modalWide)} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFoot}>{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row "⋮" menu                                                        */
/* ------------------------------------------------------------------ */

export function RowMenu({
  items,
  icon,
  label,
}: {
  items: { label: string; icon?: LucideIcon; onClick: () => void; danger?: boolean }[];
  icon: ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className={styles.rowMenu} ref={ref}>
      <button className={styles.actionBtn} onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open}>
        {icon}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              className={cx(it.danger && styles.danger)}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
            >
              {it.icon && <it.icon size={15} />} {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// "EMP001 | Marketing" style helpers
export const shortDept = (d: string) => (d === "Business Development" ? "Business Dev." : d === "Human Resources" ? "HR" : d);

export const barColor = (p: number) => (p >= 80 ? "#22a55b" : p >= 60 ? "#f5b531" : "#ef4444");

/* ------------------------------------------------------------------ */
/* Recent activity timeline                                            */
/* ------------------------------------------------------------------ */

const ACTIVITY_ICON: Record<string, { icon: LucideIcon; color: string; soft: string }> = {
  "check-in": { icon: LogIn, color: "#15803d", soft: "#e3f6ea" },
  "check-out": { icon: LogOut, color: "#dc2626", soft: "#fde8e8" },
  present: { icon: CalendarCheck, color: "#15803d", soft: "#e3f6ea" },
  late: { icon: Clock3, color: "#b7791f", soft: "#fef3dc" },
  "half-day": { icon: Clock3, color: "#7c3aed", soft: "#efe6fd" },
  leave: { icon: Plane, color: "#2563eb", soft: "#e4eefd" },
  absent: { icon: CalendarX2, color: "#dc2626", soft: "#fde8e8" },
  holiday: { icon: CalendarDays, color: "#6b7280", soft: "#f1f2f5" },
  "weekly-off": { icon: CalendarDays, color: "#6b7280", soft: "#f1f2f5" },
};

export function ActivityList({ items }: { items: ActivityItem[] }) {
  if (!items.length) return <p className={styles.muted}>No activity yet.</p>;
  return (
    <ol className={styles.activity}>
      {items.map((a, i) => {
        const meta = ACTIVITY_ICON[a.kind];
        const d = fromKey(a.date);
        const isToday = i === 0 && (a.kind === "check-in" || a.kind === "check-out");
        const when = `${isToday ? "Today" : `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`}${a.time ? `, ${fmtTime(a.time)}` : ""}`;
        return (
          <li key={`${a.date}-${a.kind}-${i}`}>
            <span className={styles.activityIcon} style={{ color: meta.color, background: meta.soft }}>
              <meta.icon size={15} />
            </span>
            <div>
              <small>{when}</small>
              <b>{a.title}</b>
              <span>{a.detail}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({ crumb, subtitle, actions }: { crumb?: string; subtitle: string; actions?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div className={styles.headText}>
        {crumb && (
          <nav className={styles.crumb} aria-label="Breadcrumb">
            <Link href="/dashboard">Dashboard</Link>
            <ChevronRight size={13} />
            <Link href="/dashboard/Attendance">Attendance</Link>
            <ChevronRight size={13} />
            <span>{crumb}</span>
          </nav>
        )}
        <h1>Attendance Management</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className={styles.headActions}>{actions}</div>}
    </header>
  );
}