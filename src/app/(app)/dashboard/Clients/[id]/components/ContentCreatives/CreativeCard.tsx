"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/CreativeCard.tsx
// Grid card, list row, ⋮ menu and small shared bits for Content Creatives

import { useState, type ReactNode } from "react";
import {
  Clock3, Copy, Download, Eye, Film, FolderInput, ImageIcon, Layers, MoreHorizontal, MoreVertical, Pencil, Play, ShoppingBag, Trash2,
  type LucideIcon,
} from "lucide-react";
import styles from "./ContentCreatives.module.css";
import { formatShort } from "../../../../../../data/contentCalendarData";
import { TYPE_META, formatDuration, type Creative, type CreativeType } from "../../../../../../data/contentCreativesData";
import { PlatformIcons, StatusPill, cx } from "../ContentCalendar/ccUi";

export const TYPE_ICONS: Record<CreativeType, LucideIcon> = {
  Image: ImageIcon,
  Video: Film,
  Carousel: Layers,
  Story: Clock3,
  Collection: ShoppingBag,
  Other: MoreHorizontal,
};

/** Cover image with a soft placeholder if the URL fails */
export function CreativeThumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={cx(styles.thumbFallback, className)} aria-label={alt}>
        <ImageIcon />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

export function TypeBadge({ type, small }: { type: CreativeType; small?: boolean }) {
  const Icon = TYPE_ICONS[type];
  return (
    <span className={cx(styles.typeBadge, small && styles.typeBadgeSm)}>
      <Icon />
      {TYPE_META[type].short}
    </span>
  );
}

/* ── ⋮ menu ──────────────────────────────────────────────── */

export interface CardActions {
  onOpen: (c: Creative) => void;
  onEdit: (c: Creative) => void;
  onDuplicate: (c: Creative) => void;
  onMove: (c: Creative) => void;
  onDelete: (c: Creative) => void;
}

function MenuItem({ icon, children, danger, onClick }: { icon: ReactNode; children: ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" className={cx(styles.menuItem, danger && styles.menuDanger)} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function CardMenu({ c, open, setOpen, actions, align = "right" }: { c: Creative; open: boolean; setOpen: (id: string | null) => void; actions: CardActions; align?: "right" | "up" }) {
  const close = () => setOpen(null);
  const download = c.media[0]?.url || c.thumbnail;
  return (
    <div className={styles.menuWrap} data-cr-menu>
      <button
        type="button"
        className={styles.kebab}
        aria-label={`Actions for ${c.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(open ? null : c.id);
        }}
      >
        <MoreVertical />
      </button>
      {open && (
        <div className={cx(styles.menu, align === "up" && styles.menuUp)} role="menu">
          <MenuItem icon={<Eye />} onClick={() => { close(); actions.onOpen(c); }}>View details</MenuItem>
          <MenuItem icon={<Pencil />} onClick={() => { close(); actions.onEdit(c); }}>Edit</MenuItem>
          <MenuItem icon={<Copy />} onClick={() => { close(); actions.onDuplicate(c); }}>Duplicate</MenuItem>
          <MenuItem icon={<FolderInput />} onClick={() => { close(); actions.onMove(c); }}>Move to folder</MenuItem>
          {download && (
            <a className={styles.menuItem} href={download} download={c.media[0]?.name ?? c.title} target="_blank" rel="noreferrer" onClick={close}>
              <Download /> Download
            </a>
          )}
          <div className={styles.menuSep} />
          <MenuItem icon={<Trash2 />} danger onClick={() => { close(); actions.onDelete(c); }}>Delete</MenuItem>
        </div>
      )}
    </div>
  );
}

/* ── Grid card ───────────────────────────────────────────── */

export function CreativeCard({ c, menuOpen, setMenu, actions }: { c: Creative; menuOpen: boolean; setMenu: (id: string | null) => void; actions: CardActions }) {
  const isVideo = c.type === "Video";
  return (
    <article className={cx(styles.card, menuOpen && styles.cardRaised)}>
      <button type="button" className={styles.cardMedia} onClick={() => actions.onOpen(c)} aria-label={`Open ${c.title}`}>
        <CreativeThumb src={c.thumbnail} alt={c.title} className={styles.cardImg} />
        <TypeBadge type={c.type} />
        <span className={styles.cardPlatform}>
          <PlatformIcons platforms={c.platforms.slice(0, 1)} size={22} />
        </span>
        {isVideo && (
          <span className={styles.playBtn}>
            <Play />
          </span>
        )}
        {isVideo && c.durationSec ? <span className={styles.duration}>{formatDuration(c.durationSec)}</span> : null}
        {!isVideo && c.media.length > 1 && <span className={styles.duration}>1/{c.media.length}</span>}
        {!isVideo && c.media.length <= 1 && (
          <span className={styles.peek}>
            <Eye />
          </span>
        )}
      </button>
      <div className={styles.cardBody}>
        <div className={styles.cardInfo}>
          <strong className={styles.cardTitle} title={c.title}>{c.title}</strong>
          <span className={styles.cardDate}>{formatShort(c.date)}</span>
          <StatusPill status={c.status} size="sm" />
        </div>
        <CardMenu c={c} open={menuOpen} setOpen={setMenu} actions={actions} />
      </div>
    </article>
  );
}

/* ── List row ────────────────────────────────────────────── */

export function CreativeRow({
  c,
  folderName,
  menuOpen,
  setMenu,
  actions,
}: {
  c: Creative;
  folderName: string;
  menuOpen: boolean;
  setMenu: (id: string | null) => void;
  actions: CardActions;
}) {
  return (
    <div className={cx(styles.row, menuOpen && styles.cardRaised)}>
      <button type="button" className={styles.rowMain} onClick={() => actions.onOpen(c)}>
        <span className={styles.rowThumb}>
          <CreativeThumb src={c.thumbnail} alt={c.title} className={styles.cardImg} />
          {c.type === "Video" && (
            <span className={styles.rowPlay}>
              <Play />
            </span>
          )}
        </span>
        <span className={styles.rowText}>
          <strong>{c.title}</strong>
          <small>{c.caption.split("\n")[0]}</small>
        </span>
      </button>
      <span className={styles.rowCell}>
        <TypeBadge type={c.type} small />
      </span>
      <span className={styles.rowCell}>
        <PlatformIcons platforms={c.platforms} size={18} />
      </span>
      <span className={cx(styles.rowCell, styles.rowMuted, styles.hideSm)}>{folderName}</span>
      <span className={cx(styles.rowCell, styles.rowMuted)}>{formatShort(c.date)}</span>
      <span className={styles.rowCell}>
        <StatusPill status={c.status} size="sm" />
      </span>
      <CardMenu c={c} open={menuOpen} setOpen={setMenu} actions={actions} />
    </div>
  );
}

/* ── Loading skeleton ────────────────────────────────────── */

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading creatives">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <span className={styles.skeletonMedia} />
          <span className={styles.skeletonLine} />
          <span className={cx(styles.skeletonLine, styles.skeletonShort)} />
        </div>
      ))}
    </div>
  );
}
