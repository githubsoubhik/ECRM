"use client";
// Path: src/app/dashboard/Clients/[id]/components/ui.tsx
// Small shared building blocks: Card, Avatar, Thumb (image with fallback), Trend, Modal, Segmented tabs

import { useEffect, useState, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import { getInitials } from "../../../../../data/clientDetailsData";
import s from "../ClientDetails.module.css";

export function Card({
  title,
  icon,
  action,
  tone,
  className = "",
  children,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "green" | "blue" | "orange";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${s.card} ${tone ? s[`tone_${tone}`] : ""} ${className}`}>
      {(title || action) && (
        <header className={s.cardHead}>
          <h3 className={s.cardTitle}>
            {icon && <span className={s.cardIcon}>{icon}</span>}
            {title}
          </h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function LinkBtn({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" className={s.linkBtn} onClick={onClick}>
      {children}
    </button>
  );
}

const AVATAR_COLORS = ["#fde68a", "#fed7aa", "#fbcfe8", "#c7d2fe", "#a7f3d0", "#bae6fd"];
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function Avatar({ src, name, size = 32, ring }: { src: string | null; name: string; size?: number; ring?: boolean }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.36) };
  if (src && !broken)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={`${s.avatar} ${ring ? s.avatarRing : ""}`} style={style} onError={() => setBroken(true)} />;
  return (
    <span className={`${s.avatar} ${s.avatarFallback} ${ring ? s.avatarRing : ""}`} style={{ ...style, background: colorFor(name) }} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}

const THUMB_GRADIENTS = [
  "linear-gradient(135deg,#7c2d12,#f59e0b)",
  "linear-gradient(135deg,#831843,#f472b6)",
  "linear-gradient(135deg,#1e1b4b,#8b5cf6)",
  "linear-gradient(135deg,#78350f,#fcd34d)",
  "linear-gradient(135deg,#7f1d1d,#fb7185)",
  "linear-gradient(135deg,#164e63,#22d3ee)",
];

/** Image that falls back to a warm gradient tile with the label if the URL fails. */
export function Thumb({ src, label, className = "" }: { src: string | null; label: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label} className={`${s.thumb} ${className}`} loading="lazy" onError={() => setBroken(true)} />;
  const g = THUMB_GRADIENTS[Math.abs([...label].reduce((a, c) => a + c.charCodeAt(0), 0)) % THUMB_GRADIENTS.length];
  return (
    <div className={`${s.thumb} ${s.thumbFallback} ${className}`} style={{ background: g }} role="img" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

export function Trend({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={`${s.trend} ${up ? s.trendUp : s.trendDown}`}>
      {up ? "↑" : "↓"} {Math.abs(value)}
      {suffix}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={`${s.segmented} ${className}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`${s.segBtn} ${value === o.value ? s.segActive : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
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
    <div className={s.modalBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${s.modal} ${wide ? s.modalWide : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className={s.modalHead}>
          <h2>{title}</h2>
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </header>
        <div className={s.modalBody}>{children}</div>
        {footer && <footer className={s.modalFoot}>{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={s.formField}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const cls =
    status === "Published" || status === "Connected" || status === "Active"
      ? s.pillGreen
      : status === "Scheduled" || status === "Internal"
      ? s.pillBlue
      : status === "Client"
      ? s.pillGreenSoft
      : s.pillGray;
  return <span className={`${s.pill} ${cls}`}>{status}</span>;
}
