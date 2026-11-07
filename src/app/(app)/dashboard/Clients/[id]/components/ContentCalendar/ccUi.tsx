"use client";

// Small shared UI pieces for the Content Calendar module
import { useEffect, useId, useState, type RefObject } from "react";
import { FileText, ImageIcon, Play } from "lucide-react";
import styles from "./ContentCalendar.module.css";
import {
  STATUS_META,
  type MediaItem,
  type Platform,
  type PostStatus,
} from "../../../../../../data/contentCalendarData";

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* ── Status pill ─────────────────────────────────────────── */
export function StatusPill({ status, size = "md" }: { status: PostStatus; size?: "sm" | "md" }) {
  const m = STATUS_META[status];
  return (
    <span className={cx(styles.pill, size === "sm" && styles.pillSm)} style={{ background: m.bg, color: m.text }}>
      {size === "md" && <i className={styles.pillDot} style={{ background: m.color }} />}
      {status}
    </span>
  );
}

/* ── Media thumbnail (image / video / file) ──────────────── */
export function Thumb({ media, className }: { media?: MediaItem; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!media || failed) {
    return (
      <span className={cx(styles.thumb, styles.thumbEmpty, className)}>
        <ImageIcon />
      </span>
    );
  }
  if (media.kind === "video") {
    return (
      <span className={cx(styles.thumb, className)}>
        <video src={media.url} muted playsInline preload="metadata" />
        <span className={styles.thumbPlay}>
          <Play />
        </span>
      </span>
    );
  }
  if (media.kind === "file") {
    return (
      <span className={cx(styles.thumb, styles.thumbEmpty, className)} title={media.name}>
        <FileText />
      </span>
    );
  }
  return (
    <span className={cx(styles.thumb, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.url} alt={media.name ?? ""} loading="lazy" onError={() => setFailed(true)} />
    </span>
  );
}

/* ── Platform brand icons (inline SVG – no extra deps) ───── */
export function PlatformIcon({ platform, size = 14 }: { platform: Platform; size?: number }) {
  const gid = `ccig${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const common = { width: size, height: size, viewBox: "0 0 24 24", "aria-label": platform, role: "img" as const };

  if (platform === "Instagram") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#feda75" />
            <stop offset=".35" stopColor="#fa7e1e" />
            <stop offset=".65" stopColor="#d62976" />
            <stop offset="1" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6.5" fill={`url(#${gid})`} />
        <rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.9" />
        <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.9" />
        <circle cx="16.2" cy="7.8" r="1.05" fill="#fff" />
      </svg>
    );
  }
  if (platform === "Facebook") {
    return (
      <svg {...common}>
        <rect width="24" height="24" rx="6.5" fill="#1877F2" />
        <path
          d="M13.4 20v-6.6h2.2l.35-2.6H13.4V9.2c0-.75.22-1.27 1.3-1.27H16V5.6c-.24-.03-1.05-.1-2-.1-1.98 0-3.33 1.2-3.33 3.42v1.9H8.5v2.6h2.17V20h2.73z"
          fill="#fff"
        />
      </svg>
    );
  }
  if (platform === "Meta") {
    return (
      <svg {...common}>
        <rect width="24" height="24" rx="6.5" fill="#0866FF" />
        <path
          d="M7.6 8.6c-1.95 0-3.1 1.55-3.1 3.4s1.15 3.4 3.1 3.4c2.7 0 6.1-6.8 8.8-6.8 1.95 0 3.1 1.55 3.1 3.4s-1.15 3.4-3.1 3.4c-2.7 0-6.1-6.8-8.8-6.8z"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect width="24" height="24" rx="6.5" fill="#8b90ad" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#fff" strokeWidth="1.7" />
      <path d="M6 12h12M12 6c2 2 2 10 0 12M12 6c-2 2-2 10 0 12" fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function PlatformIcons({ platforms, size = 14 }: { platforms: Platform[]; size?: number }) {
  return (
    <span className={styles.platformIcons}>
      {platforms.map((p) => (
        <PlatformIcon key={p} platform={p} size={size} />
      ))}
    </span>
  );
}

/* ── File helpers ────────────────────────────────────────── */
export const MAX_FILE_MB = 50;

export function readFilesAsMedia(files: FileList | File[]): Promise<{ media: MediaItem[]; rejected: string[] }> {
  const rejected: string[] = [];
  const ok = Array.from(files).filter((f) => {
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      rejected.push(f.name);
      return false;
    }
    return true;
  });
  return Promise.all(
    ok.map(
      (f) =>
        new Promise<MediaItem>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              url: String(reader.result),
              name: f.name,
              kind: f.type.startsWith("video/") ? "video" : f.type.startsWith("image/") ? "image" : "file",
            });
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        }),
    ),
  ).then((media) => ({ media, rejected }));
}

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ── Hooks ───────────────────────────────────────────────── */
export function useEscape(handler: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handler]);
}

export function useClickOutside(ref: RefObject<HTMLElement | null>, handler: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("touchstart", h);
    };
  }, [ref, handler, active]);
}
