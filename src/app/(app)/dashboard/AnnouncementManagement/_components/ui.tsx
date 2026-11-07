"use client";

// Small shared pieces for the Announcement Management page.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { STATUS_META, fmtDate, type AnnStatus } from "../../../../data/announcementData";
import styles from "../announcement.module.css";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// Media query without setting state in an effect.
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

// true in the browser, false during server rendering.
const noop = () => () => {};
export const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

// Closes a popover on outside click or Escape.
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open, close]);
  return ref;
}

export function StatusPill({ status }: { status: AnnStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={styles.pill} style={{ color: m.text, background: m.soft }}>
      <i style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

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

// Date input with a calendar icon and a real placeholder ("Select start date").
export function DateField({
  value,
  onChange,
  placeholder,
  min,
  invalid,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min?: string;
  invalid?: boolean;
  ariaLabel: string;
}) {
  return (
    <label className={cx(styles.dateField, invalid && styles.invalid, !value && styles.dateEmpty)}>
      <CalendarDays size={17} />
      <input type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} />
      {!value && <span className={styles.datePlaceholder}>{placeholder}</span>}
      {value && <span className={styles.dateText}>{fmtDate(value)}</span>}
    </label>
  );
}

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

// Row "⋮" menu.
export function RowMenu({
  label,
  icon,
  items,
}: {
  label: string;
  icon: ReactNode;
  items: { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div className={styles.rowMenu} ref={ref}>
      <button className={styles.menuBtn} onClick={() => setOpen((o) => !o)} aria-label={label} aria-expanded={open}>
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
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TONES = ["#dbe7ff", "#fde2e4", "#dcf5e7", "#fff1d6", "#ece3ff", "#d9f3f6"];
export function Avatar({ name, photoUrl, size = 28 }: { name: string; photoUrl?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const tone = TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span className={styles.avatar} style={{ width: size, height: size, background: tone, fontSize: size * 0.38 }}>
      {!failed && photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
