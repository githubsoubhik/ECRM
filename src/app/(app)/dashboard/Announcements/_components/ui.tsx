"use client";

// Small building blocks for the Announcements page.

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import styles from "../announcements.module.css";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const noop = () => () => {};
/** false during the server render, true in the browser (localStorage is safe to read). */
export const useIsClient = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

const MOBILE_QUERY = "(max-width: 767px)";
const subscribeMobile = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
export const useIsMobile = () =>
  useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

/** Reads ?employee=EMP001 so the page can show one employee's announcements. */
const subscribeUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
export const useViewerId = () =>
  useSyncExternalStore(
    subscribeUrl,
    () => new URLSearchParams(window.location.search).get("employee"),
    () => null,
  );

/** Closes a popover when clicking outside it or pressing Escape. */
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
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

export function SelectBox({
  value,
  onChange,
  options,
  allLabel,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel: string;
  ariaLabel: string;
}) {
  return (
    <span className={styles.select}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} />
    </span>
  );
}

const TONES = ["#dbe7ff", "#fde2e4", "#dcf5e7", "#fff1d6", "#ece3ff", "#d9f3f6"];
export function Avatar({ name, photoUrl, size = 34 }: { name: string; photoUrl?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const tone = TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];
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

/** Centered dialog on desktop, bottom sheet on phones (CSS decides). */
export function Dialog({
  label,
  onClose,
  children,
  footer,
  header,
  wide,
  className,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Escape closes only the top-most dialog (the file viewer can open over the details).
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const all = document.querySelectorAll('[role="dialog"]');
      if (all[all.length - 1] === box.current) onClose();
    };
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
      <div
        ref={box}
        className={cx(styles.dialog, wide && styles.dialogWide, className)}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHead}>
          <div className={styles.dialogHeadMain}>{header ?? <h2>{label}</h2>}</div>
          <button onClick={onClose} aria-label="Close" className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.dialogBody}>{children}</div>
        {footer && <div className={styles.dialogFoot}>{footer}</div>}
      </div>
    </div>
  );
}
