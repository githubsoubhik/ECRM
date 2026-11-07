"use client";

// src/app/components/announcements/AnnouncementLogo.tsx
// Built-in symbols and the logo tile shown on announcement cards.
// Shared by /dashboard/AnnouncementManagement (picker, table, preview) and
// /dashboard/Announcements (cards, details). Add a symbol by adding one line to SYMBOLS.

import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Cake,
  CalendarDays,
  Clock,
  FileText,
  Gift,
  GraduationCap,
  HardHat,
  HeartPulse,
  Lightbulb,
  Megaphone,
  Palette,
  PartyPopper,
  Rocket,
  Settings,
  Star,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { AnnouncementLogo as Logo } from "../../../data/announcementData";

export interface SymbolDef {
  key: string;
  label: string;
  color: string; // icon colour
  soft: string; // tile background
  Icon?: LucideIcon; // lucide icon, or a custom drawing (see Glyph)
}

export const SYMBOLS: SymbolDef[] = [
  { key: "india-flag", label: "National holiday", color: "#138808", soft: "#e8f6ec" },
  { key: "megaphone", label: "Announcement", color: "#15803d", soft: "#e3f6ea", Icon: Megaphone },
  { key: "alert", label: "Important / Alert", color: "#e5484d", soft: "#fde8e8", Icon: AlertTriangle },
  { key: "document", label: "Policy / Document", color: "#c2410c", soft: "#fff0e3", Icon: FileText },
  { key: "chart", label: "Meeting / Report", color: "#2f7de1", soft: "#e3eefc", Icon: BarChart3 },
  { key: "gears", label: "Maintenance", color: "#6d28d9", soft: "#efe8fd", Icon: Settings },
  { key: "gift", label: "Incentive / Gift", color: "#e5484d", soft: "#fff0e3", Icon: Gift },
  { key: "celebration", label: "Festival / Celebration", color: "#db2777", soft: "#fde7f1", Icon: PartyPopper },
  { key: "calendar", label: "Event / Date", color: "#0f766e", soft: "#e0f5f2", Icon: CalendarDays },
  { key: "cake", label: "Birthday", color: "#d97706", soft: "#fff3dc", Icon: Cake },
  { key: "trophy", label: "Achievement", color: "#ca8a04", soft: "#fef6d8", Icon: Trophy },
  { key: "idea", label: "Tip / Idea", color: "#eab308", soft: "#fef9dc", Icon: Lightbulb },
  { key: "health", label: "Health", color: "#e11d48", soft: "#fde7ec", Icon: HeartPulse },
  { key: "briefcase", label: "Business / Client", color: "#0e7490", soft: "#e0f3f8", Icon: Briefcase },
  { key: "wallet", label: "Finance", color: "#0f766e", soft: "#e0f5f2", Icon: Wallet },
  { key: "safety", label: "Safety", color: "#d97706", soft: "#fff3dc", Icon: HardHat },
  { key: "team", label: "Team / Town hall", color: "#4f46e5", soft: "#e9e8fd", Icon: Users },
  { key: "training", label: "Training", color: "#2563eb", soft: "#e3eefc", Icon: GraduationCap },
  { key: "rocket", label: "Launch", color: "#7c3aed", soft: "#efe8fd", Icon: Rocket },
  { key: "creative", label: "Creative", color: "#c026d3", soft: "#fae8fc", Icon: Palette },
  { key: "star", label: "Recognition", color: "#f59e0b", soft: "#fff3dc", Icon: Star },
  { key: "clock", label: "Timing / Deadline", color: "#475569", soft: "#eef1f5", Icon: Clock },
];

const BY_KEY = new Map(SYMBOLS.map((s) => [s.key, s]));
export const symbolDef = (key: string) => BY_KEY.get(key) ?? BY_KEY.get("megaphone")!;

// Symbol used when the admin didn't choose a logo.
const CATEGORY_SYMBOL: Record<string, string> = {
  "Company Wide": "megaphone",
  "Human Resources": "document",
  Marketing: "chart",
  Operations: "gears",
  Sales: "trophy",
  Finance: "wallet",
  Technology: "rocket",
  Creative: "creative",
  Construction: "safety",
  "Business Development": "briefcase",
  Management: "star",
};
export const defaultSymbol = (category: string, urgent?: boolean) => (urgent ? "alert" : (CATEGORY_SYMBOL[category] ?? "megaphone"));

/** Resolves what a card shows: the uploaded logo, the chosen symbol, or a default. */
export function resolveLogo(logo: Logo | null | undefined, category: string, urgent?: boolean): Logo {
  return logo ?? { kind: "symbol", symbol: defaultSymbol(category, urgent) };
}

/* ------------------------------------------------------------------ */

export function AnnouncementLogo({
  logo,
  category = "",
  urgent,
  size = 64,
  background,
  className,
  title,
}: {
  logo: Logo | null | undefined;
  category?: string;
  urgent?: boolean;
  size?: number;
  /** Tile background. Defaults to the symbol's soft colour (white for uploaded logos). */
  background?: string;
  className?: string;
  title?: string;
}) {
  const shown = resolveLogo(logo, category, urgent);
  const def = shown.kind === "symbol" ? symbolDef(shown.symbol) : null;
  const tile: CSSProperties = {
    width: size,
    height: size,
    flex: "none",
    display: "grid",
    placeItems: "center",
    borderRadius: Math.round(size * 0.24),
    background: background ?? (def ? def.soft : "#ffffff"),
    overflow: "hidden",
  };
  return (
    <span className={className} style={tile} title={title ?? (def ? def.label : shown.kind === "image" ? shown.name : undefined)} aria-hidden="true">
      {shown.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown.dataUrl} alt="" style={{ width: "78%", height: "78%", objectFit: "contain" }} />
      ) : (
        <Glyph def={def!} size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

export function Glyph({ def, size }: { def: SymbolDef; size: number }) {
  if (def.key === "india-flag") return <IndiaFlag size={size * 1.25} />;
  const Icon = def.Icon ?? Megaphone;
  return <Icon size={size} color={def.color} strokeWidth={2.1} />;
}

// Flag on a pole (drawn, so no image file is needed).
function IndiaFlag({ size }: { size: number }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Flag of India">
      <rect x="9" y="6" width="3.2" height="54" rx="1.6" fill="#5b4636" />
      <circle cx="10.6" cy="6" r="2.6" fill="#c9a227" />
      <path d="M12 9 C24 5 36 13 56 9 V23 C36 27 24 19 12 23 Z" fill="#FF9933" />
      <path d="M12 23 C24 19 36 27 56 23 V37 C36 41 24 33 12 37 Z" fill="#ffffff" stroke="#e7e7e7" strokeWidth="0.4" />
      <path d="M12 37 C24 33 36 41 56 37 V51 C36 55 24 47 12 51 Z" fill="#138808" />
      <g transform="translate(34 30)">
        <circle r="5.2" fill="none" stroke="#000080" strokeWidth="1" />
        {spokes.map((deg) => (
          <line key={deg} x1="0" y1="0" x2="0" y2="5" stroke="#000080" strokeWidth="0.45" transform={`rotate(${deg})`} />
        ))}
        <circle r="1" fill="#000080" />
      </g>
    </svg>
  );
}
