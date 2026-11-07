"use client";
// Path: src/app/dashboard/Clients/[id]/components/ClientHeader.tsx

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaStore } from "react-icons/fa";
import {
  FiCheck, FiChevronDown, FiCopy, FiGlobe, FiMail, FiMapPin, FiMoreVertical, FiPhone, FiPrinter, FiSettings, FiUserX,
} from "react-icons/fi";
import { formatLongDate } from "../../../../../data/clientDetailsData";
import { useClient, type TabKey } from "./ClientStore";
import DatePicker from "./DatePicker";
import { Avatar, StatusPill } from "./ui";
import s from "../ClientDetails.module.css";
import tb from "./TabBar.module.css";

export const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "campaigns", label: "Campaigns" },
  { key: "calendar", label: "Content Calendar" },
  { key: "creatives", label: "Content Creatives" },
  { key: "reports", label: "Reports" },
  { key: "conversations", label: "Conversations" },
  { key: "files", label: "Files" },
  { key: "notes", label: "Notes & Tasks" },
  { key: "settings", label: "Settings" },
];

function useOutsideClose<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, close]);
  return ref;
}

export default function ClientHeader() {
  const { data, openModal, updateClient, showToast, setTab } = useClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useOutsideClose<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const acc = (p: string) => data.accounts.find((a) => a.platform === p);
  const website = data.website.startsWith("http") ? data.website : `https://${data.website}`;

  const socials = [
    { p: "facebook", icon: <FaFacebookF />, cls: s.socFb, label: "Facebook" },
    { p: "instagram", icon: <FaInstagram />, cls: s.socIg, label: "Instagram" },
    { p: "gmb", icon: <FaStore />, cls: s.socGmb, label: "Google My Business" },
  ];

  const menu = (
    <div className={s.menuWrap} ref={menuRef}>
      <button type="button" className={s.iconBtn} aria-label="More actions" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
        <FiMoreVertical />
      </button>
      {menuOpen && (
        <div className={s.menu} role="menu">
          <button type="button" onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast("Profile link copied"); setMenuOpen(false); }}>
            <FiCopy /> Copy profile link
          </button>
          <button type="button" onClick={() => { window.print(); setMenuOpen(false); }}>
            <FiPrinter /> Print / Save PDF
          </button>
          <button type="button" onClick={() => { setTab("settings"); setMenuOpen(false); }}>
            <FiSettings /> Client settings
          </button>
          <button
            type="button"
            className={s.menuDanger}
            onClick={() => {
              const next = data.status === "Active" ? "Inactive" : "Active";
              updateClient({ status: next });
              showToast(`Client marked ${next}`);
              setMenuOpen(false);
            }}
          >
            <FiUserX /> Mark as {data.status === "Active" ? "Inactive" : "Active"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <header className={s.header}>
      <nav className={s.breadcrumb} aria-label="Breadcrumb">
        <Link href="/dashboard/Clients">Clients</Link>
        <span>›</span>
        <strong>{data.name}</strong>
      </nav>

      <div className={s.headerRow}>
        <div className={s.identity}>
          <div className={s.logo}>
            <Avatar src={data.logo} name={data.name} size={64} />
          </div>
          <div className={s.identityText}>
            <div className={s.nameRow}>
              <h1 className={s.clientName}>{data.name}</h1>
              <StatusPill status={data.status} />
            </div>
            <p className={s.categories}>{data.categories.join(" | ")}</p>
            <div className={s.contactRow}>
              <span><FiMapPin /> {data.location}</span>
              <a href={`tel:${data.phone.replace(/\s/g, "")}`} className={s.hideMobile}><FiPhone /> {data.phone}</a>
              <a href={`mailto:${data.email}`} className={s.hideMobile}><FiMail /> {data.email}</a>
              <a href={website} target="_blank" rel="noreferrer" className={s.hideMobile}><FiGlobe /> {data.website}</a>
            </div>
          </div>
        </div>

        {/* Desktop actions */}
        <div className={s.headerActions}>
          <div className={s.socials}>
            {socials.map((x) => {
              const a = acc(x.p);
              return (
                <a
                  key={x.p}
                  href={a?.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`${s.socBtn} ${x.cls} ${a?.connected ? "" : s.socOff}`}
                  aria-label={`${x.label}${a?.connected ? "" : " (not connected)"}`}
                  title={x.label}
                >
                  {x.icon}
                </a>
              );
            })}
          </div>
          <button type="button" className={s.btnOutline} onClick={() => openModal("editClient")}>
            Edit Client
          </button>
          {menu}
        </div>

        {/* Mobile quick icons */}
        <div className={s.mobileIcons}>
          <a href={`tel:${data.phone.replace(/\s/g, "")}`} className={s.iconBtn} aria-label="Call"><FiPhone /></a>
          <a href={`mailto:${data.email}`} className={s.iconBtn} aria-label="Email"><FiMail /></a>
          <a href={website} target="_blank" rel="noreferrer" className={s.iconBtn} aria-label="Website"><FiGlobe /></a>
          {menu}
        </div>

        <div className={s.teamCard}>
          <span className={s.teamTitle}>Assigned Team</span>
          <div className={s.teamRow}>
            <div className={s.avatarStack}>
              {data.team.slice(0, 3).map((m) => (
                <span key={m.id} title={`${m.name} · ${m.role}`}>
                  <Avatar src={m.avatar} name={m.name} size={30} ring />
                </span>
              ))}
              {data.team.length > 3 && <span className={s.moreBadge}>+{data.team.length - 3}</span>}
            </div>
            <button type="button" className={s.btnSoft} onClick={() => openModal("manageTeam")}>
              Manage
            </button>
          </div>
        </div>
      </div>

      <TabBar />
      <AsOfBanner />
    </header>
  );
}

/* ── Tab bar ──────────────────────────────────────────────
   Shows as many tabs as fit the available width; the rest go into
   "More". Re-measures on every resize, so it works on any screen.   */

const TAB_SLACK = 4; // px safety margin so tabs never touch the date picker

/** How many tabs (from the left) fit, leaving room for "More" when some don't */
function countFittingTabs(widths: number[], gap: number, avail: number, moreW: number) {
  const room = avail - TAB_SLACK;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
  if (total <= room) return widths.length;
  let used = 0;
  let fit = 0;
  for (const w of widths) {
    if (used + w + gap + moreW > room) break;
    used += w + gap;
    fit++;
  }
  return fit;
}

function TabBar() {
  const { tab, setTab } = useClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const [fit, setFit] = useState<number | null>(null); // null = not measured yet
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const moreRef = useOutsideClose<HTMLDivElement>(moreOpen, closeMore);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Re-measure whenever the bar resizes (ResizeObserver also fires once on start)
  useEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const calc = () => {
      const items = Array.from(measure.children) as HTMLElement[];
      const w = (el: HTMLElement) => el.getBoundingClientRect().width;
      const widths = items.slice(0, TABS.length).map(w);
      const moreW = w(items[TABS.length]); // "More ▾"
      const cs = getComputedStyle(row);
      const gap = parseFloat(cs.columnGap) || 0;
      const avail = row.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      setFit(countFittingTabs(widths, gap, avail, moreW));
    };
    const ro = new ResizeObserver(calc);
    ro.observe(row);
    ro.observe(measure); // labels change size when web fonts finish loading
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const visible = TABS.slice(0, fit ?? TABS.length);
  const hidden = TABS.slice(fit ?? TABS.length);
  const hiddenActive = hidden.some((t) => t.key === tab);
  const open = moreOpen && hidden.length > 0;

  return (
    <div className={s.tabBar}>
      <div className={`${s.tabs} ${tb.row} ${fit === null ? tb.pending : ""}`} ref={rowRef} role="tablist">
        {visible.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`${s.tab} ${tb.tab} ${tab === t.key ? s.tabActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}

        {hidden.length > 0 && (
          <div className={tb.moreWrap} ref={moreRef}>
            <button
              type="button"
              className={`${s.tab} ${tb.tab} ${tb.moreBtn} ${hiddenActive ? s.tabActive : ""}`}
              onClick={() => setMoreOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              title={hiddenActive ? `More – ${TABS.find((t) => t.key === tab)?.label}` : "More sections"}
            >
              More
              <FiChevronDown className={`${tb.chev} ${open ? tb.chevOpen : ""}`} />
            </button>
            {open && (
              <div className={`${s.menu} ${s.menuRight} ${tb.menu}`} role="menu">
                {hidden.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="menuitem"
                    aria-current={tab === t.key ? "page" : undefined}
                    className={`${tb.menuItem} ${tab === t.key ? tb.menuActive : ""}`}
                    onClick={() => {
                      setTab(t.key);
                      setMoreOpen(false);
                    }}
                  >
                    {t.label}
                    {tab === t.key && <FiCheck className={tb.menuCheck} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invisible copy of every tab – only used to measure widths */}
        <div className={`${s.tabs} ${tb.measure}`} ref={measureRef} aria-hidden="true" inert>
          {TABS.map((t) => (
            <button key={t.key} type="button" tabIndex={-1} className={`${s.tab} ${tb.tab}`}>
              {t.label}
            </button>
          ))}
          <button type="button" tabIndex={-1} className={`${s.tab} ${tb.tab} ${tb.moreBtn}`}>
            More
            <FiChevronDown className={tb.chev} />
          </button>
        </div>
      </div>
      <DatePicker />
    </div>
  );
}

/** Shows when the user is looking at a date other than today */
function AsOfBanner() {
  const { isToday, asOfDate, setAsOfDate, today } = useClient();
  if (isToday) return null;
  return (
    <div className={s.asOfBanner} role="status">
      <span>
        Showing data as of <strong>{formatLongDate(asOfDate)}</strong>
        {asOfDate > today && " (future — planned items only)"}
      </span>
      <button type="button" className={s.linkBtn} onClick={() => setAsOfDate(today)}>
        Back to today
      </button>
    </div>
  );
}
