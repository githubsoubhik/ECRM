"use client";
// Path: src/app/dashboard/Billing/components/ui.tsx
// Small building blocks used across the Billing page.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, MoreVertical, X } from "lucide-react";
import s from "../Billing.module.css";
import type { InvoiceStatus } from "../../../../data/billingData";

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* ── hooks ── */
export function useOutsideClose<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
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

/* ── Card ── */
export function Card({ title, action, children, className, bodyClass }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cx(s.card, className)}>
      {(title || action) && (
        <header className={s.cardHead}>
          {title && <h3 className={s.cardTitle}>{title}</h3>}
          {action}
        </header>
      )}
      <div className={cx(s.cardBody, bodyClass)}>{children}</div>
    </section>
  );
}

export function ViewAll({ onClick, label = "View All" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className={s.viewAll} onClick={onClick}>
      {label} <ArrowRight />
    </button>
  );
}

/* ── Small select (period pickers) ── */
export function MiniSelect<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <span className={s.miniSelect}>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown />
    </span>
  );
}

/* ── Avatar (logo or coloured initials) ── */
const AVATAR_BG = ["#1b1b1b", "#7a1f1f", "#3b2a6b", "#0f5132", "#7c3a10", "#1e3a8a", "#831843", "#334155"];
export function Avatar({ name, logo, size = 24 }: { name: string; logo?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const bg = AVATAR_BG[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];
  return (
    <span className={s.avatar} style={{ width: size, height: size, background: bg, fontSize: Math.max(9, size * 0.38) }} title={name}>
      {logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" onError={() => setFailed(true)} />
      ) : (
        initials || "?"
      )}
    </span>
  );
}

/* ── Status pill ── */
const PILL: Record<string, string> = {
  Paid: s.pillGreen,
  Accepted: s.pillGreen,
  Active: s.pillGreen,
  Pending: s.pillOrange,
  Sent: s.pillBlue,
  Paused: s.pillOrange,
  Overdue: s.pillRed,
  Rejected: s.pillRed,
  Cancelled: s.pillGray,
  Draft: s.pillGray,
};
export function StatusPill({ status }: { status: InvoiceStatus | string }) {
  return <span className={cx(s.pill, PILL[status] ?? s.pillGray)}>{status}</span>;
}

/* ── Row action menu (kebab) ── */
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}
export function RowMenu({ items, label = "Actions", horizontal }: { items: MenuItem[]; label?: string; horizontal?: boolean }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useOutsideClose<HTMLDivElement>(open, close);
  const visible = items.filter((i) => !i.hidden);
  if (!visible.length) return null;
  return (
    <div className={s.rowMenu} ref={ref}>
      <button type="button" className={s.kebab} aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MoreVertical className={horizontal ? s.rot90 : ""} />
      </button>
      {open && (
        <div className={s.menu} role="menu">
          {visible.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={cx(s.menuItem, it.danger && s.menuDanger)}
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

/* ── Modal shell ── */
export function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className={s.overlay} onMouseDown={onClose}>
      <div className={cx(s.modal, wide && s.modalWide)} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header className={s.modalHead}>
          {icon && <span className={s.modalIcon}>{icon}</span>}
          <div className={s.modalTitles}>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        <div className={s.modalBody}>{children}</div>
        {footer && <footer className={s.modalFoot}>{footer}</footer>}
      </div>
    </div>
  );
}

/* ── Form field ── */
export function Field({ label, required, error, children, className }: { label: string; required?: boolean; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx(s.field, className)}>
      <span className={s.label}>
        {label}
        {required && <b>*</b>}
      </span>
      {children}
      {error && <span className={s.error}>{error}</span>}
    </label>
  );
}

export function Toast({ text, tone }: { text: string; tone: "ok" | "error" }) {
  return (
    <div className={cx(s.toast, tone === "error" && s.toastError)} role="status">
      {tone === "ok" ? <Check /> : <X />} {text}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}
