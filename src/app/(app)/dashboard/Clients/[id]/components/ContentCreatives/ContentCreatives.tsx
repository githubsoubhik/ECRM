"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/ContentCreatives.tsx
// "Content Creatives" tab – media library for one client.
// Data comes from ./creativesApi.ts (demo now → API / Excel later).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FileSpreadsheet, Images, LayoutGrid, List, Plus, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import styles from "./ContentCreatives.module.css";
import { PLATFORMS } from "../../../../../../data/contentCalendarData";
import {
  CREATIVE_STATUSES,
  TYPE_META,
  TYPE_TABS,
  newCreativeId,
  type Creative,
  type CreativeStatus,
  type CreativeType,
  type Platform,
} from "../../../../../../data/contentCreativesData";
import { cx, useClickOutside } from "../ContentCalendar/ccUi";
import { CreativeCard, CreativeRow, SkeletonGrid, TYPE_ICONS, type CardActions } from "./CreativeCard";
import CreativeDrawer from "./CreativeDrawer";
import CreativeModal, { type ClientInfo, type ModalState, type SaveAction } from "./CreativeModal";
import { syncCreativeToCalendar } from "./requestUtils";
import { useClient } from "../ClientStore";
import { FolderPanel, QuickStats, StorageCard } from "./SidePanel";
import { csvToCreatives } from "./creativesApi";
import { useCreatives } from "./useCreatives";

const PAGE_SIZE = 18;
type TypeFilter = "All" | CreativeType;

export default function ContentCreatives({ clientId = "default" }: { clientId?: string }) {
  /* ── toast ── */
  const [toast, setToast] = useState<string | null>(null);
  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  /* ── client (name / logo / team for the content request form) ── */
  const { data: clientData } = useClient();
  const client: ClientInfo = useMemo(
    () => ({
      name: clientData?.name ?? "Client",
      logo: clientData?.logo ?? null,
      team: (clientData?.team ?? []).map((m: { name: string; role: string }) => ({ name: m.name, role: m.role })),
    }),
    [clientData],
  );

  /* ── data ── */
  const { status, error, data, reload, actions } = useCreatives(clientId, notify);
  const { creatives, folders, storageLimitMB } = data;

  /* ── filters & view ── */
  const [typeTab, setTypeTab] = useState<TypeFilter>("All");
  const [platform, setPlatform] = useState<Platform | "All">("All");
  const [campaign, setCampaign] = useState("All");
  const [statusFilter, setStatusFilter] = useState<CreativeStatus | "All">("All");
  const [folder, setFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);

  /* ── overlays ── */
  const [openId, setOpenId] = useState<string | null>(null);
  const [focusFolder, setFocusFolder] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeAdd = useCallback(() => setAddOpen(false), []);
  useClickOutside(addRef, closeAdd, addOpen);

  // close any card ⋮ menu on outside click
  useEffect(() => {
    if (!menuId) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-cr-menu]")) setMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);

  // lock page scroll behind drawer / modal
  useEffect(() => {
    if (!openId && !modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openId, modal]);

  const resetPage = () => setPage(1);

  /* ── derived data ── */
  const campaigns = useMemo(
    () => [...new Set(creatives.map((c) => c.campaign).filter((c): c is string => !!c))].sort(),
    [creatives],
  );

  const folderCounts = useMemo(() => {
    const m: Record<string, number> = {};
    creatives.forEach((c) => c.folderId && (m[c.folderId] = (m[c.folderId] ?? 0) + 1));
    return m;
  }, [creatives]);
  const uncategorised = creatives.filter((c) => !c.folderId || !folders.some((f) => f.id === c.folderId)).length;

  /** everything except the type tab – used for tab counts */
  const base = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creatives.filter((c) => {
      if (folder === "none" ? c.folderId && folders.some((f) => f.id === c.folderId) : folder !== "all" && c.folderId !== folder) return false;
      if (platform !== "All") {
        const viaMeta = (platform === "Facebook" || platform === "Instagram") && c.platforms.includes("Meta");
        if (!c.platforms.includes(platform) && !viaMeta) return false;
      }
      if (campaign !== "All" && c.campaign !== campaign) return false;
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (q && !`${c.title} ${c.caption} ${c.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [creatives, folders, folder, platform, campaign, statusFilter, query]);

  const tabCounts = useMemo(() => {
    const m: Record<string, number> = { All: base.length };
    base.forEach((c) => (m[c.type] = (m[c.type] ?? 0) + 1));
    return m;
  }, [base]);

  const filtered = typeTab === "All" ? base : base.filter((c) => c.type === typeTab);
  const visible = filtered.slice(0, page * PAGE_SIZE);

  const totals = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus = { Published: 0, Scheduled: 0, "In Review": 0, Draft: 0 } as Record<CreativeStatus, number>;
    let used = 0;
    creatives.forEach((c) => {
      byType[c.type] = (byType[c.type] ?? 0) + 1;
      byStatus[c.status] += 1;
      used += c.sizeMB;
    });
    return { byType, byStatus, used };
  }, [creatives]);

  const total = creatives.length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");
  const activeFilters = (platform !== "All" ? 1 : 0) + (campaign !== "All" ? 1 : 0) + (statusFilter !== "All" ? 1 : 0) + (folder !== "all" ? 1 : 0) + (query ? 1 : 0);

  const clearFilters = () => {
    setPlatform("All");
    setCampaign("All");
    setStatusFilter("All");
    setFolder("all");
    setQuery("");
    setTypeTab("All");
    resetPage();
  };

  /* ── actions ── */
  const openCreative = openId ? creatives.find((c) => c.id === openId) : undefined;
  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name ?? "Uncategorised";

  const cardActions: CardActions = {
    onOpen: (c) => {
      setFocusFolder(false);
      setOpenId(c.id);
    },
    onEdit: (c) => setModal({ mode: "edit", creative: c }),
    onDuplicate: (c) => {
      const copy: Creative = { ...c, id: newCreativeId(), title: `${c.title} (Copy)`.slice(0, 100), status: "Draft", createdBy: "You" };
      actions.add(copy);
      notify("Duplicated as draft");
    },
    onMove: (c) => {
      setFocusFolder(true);
      setOpenId(c.id);
    },
    onDelete: (c) => {
      if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return;
      actions.remove([c.id]);
      if (openId === c.id) setOpenId(null);
      notify("Creative deleted");
    },
  };

  const handleSave = (input: Creative, mode: "add" | "edit", action: SaveAction) => {
    // "Save & Add to Calendar" → put it on the Content Calendar right away
    const c = action === "calendar" ? syncCreativeToCalendar(clientId, input) : input;
    if (mode === "add") {
      actions.add(c);
      setTypeTab("All");
      resetPage();
    } else {
      // keep an already-linked calendar post up to date
      actions.update(c.brief?.calendarPostId && action !== "calendar" ? syncCreativeToCalendar(clientId, c) : c);
    }
    notify(
      action === "draft"
        ? "Saved as draft"
        : action === "calendar"
          ? "Saved & added to Content Calendar"
          : `${mode === "add" ? "Request sent" : "Saved"} · assigned to ${c.brief?.assignee ?? "team"}`,
    );
    setModal(null);
  };

  /** Status changed in the details drawer – auto-add approved requests to the calendar */
  const handleDrawerChange = (c: Creative) => {
    const approved = c.status === "Scheduled" || c.status === "Published";
    const shouldSync = !!c.brief && ((c.brief.autoCalendar && approved) || !!c.brief.calendarPostId);
    const next = shouldSync ? syncCreativeToCalendar(clientId, c) : c;
    actions.update(next);
    if (shouldSync && !c.brief?.calendarPostId) notify("Approved · added to Content Calendar");
    else notify("Saved");
  };

  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    try {
      const list = csvToCreatives(await file.text(), folders).map((c) => ({ ...c, id: newCreativeId() }));
      if (!list.length) return notify("No rows found in the file");
      actions.addMany(list);
      notify(`${list.length} creative${list.length > 1 ? "s" : ""} imported`);
    } catch {
      notify("Could not read that file");
    }
  };

  const statCards: { key: TypeFilter; label: string; value: number; sub: string; color: string; soft: string; Icon: typeof Images }[] = [
    { key: "All", label: "Total Creatives", value: total, sub: "All time", color: "#4f46e5", soft: "#e8e9ff", Icon: Images },
    ...TYPE_TABS.map((t) => ({
      key: t.value as TypeFilter,
      label: t.label,
      value: totals.byType[t.value] ?? 0,
      sub: pct(totals.byType[t.value] ?? 0),
      color: TYPE_META[t.value].color,
      soft: TYPE_META[t.value].soft,
      Icon: TYPE_ICONS[t.value],
    })),
  ];

  /* ── render ── */
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* ═══ MAIN ═══ */}
        <div className={styles.main}>
          {/* stats */}
          <section className={styles.stats}>
            {statCards.map(({ key, label, value, sub, color, soft, Icon }) => (
              <button
                key={key}
                type="button"
                className={cx(styles.statCard, typeTab === key && key !== "All" && styles.statOn)}
                onClick={() => {
                  setTypeTab(key);
                  resetPage();
                }}
              >
                <span className={styles.statIcon} style={{ background: soft, color }}>
                  <Icon />
                </span>
                <span className={styles.statBody}>
                  <span className={styles.statLabel}>{label}</span>
                  <strong className={styles.statValue}>{status === "loading" ? "–" : value}</strong>
                  <span className={styles.statSub}>{sub}</span>
                </span>
              </button>
            ))}
          </section>

          {/* library card */}
          <section className={styles.library}>
            <div className={styles.toolbar}>
              <div className={styles.tabs} role="tablist" aria-label="Media type">
                {(["All", ...TYPE_TABS.map((t) => t.value)] as TypeFilter[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={typeTab === t}
                    className={cx(styles.tab, typeTab === t && styles.tabOn)}
                    onClick={() => {
                      setTypeTab(t);
                      resetPage();
                    }}
                  >
                    {t === "All" ? "All Media" : TYPE_TABS.find((x) => x.value === t)?.label} ({tabCounts[t] ?? 0})
                  </button>
                ))}
              </div>

              <div className={styles.tools}>
                <button
                  type="button"
                  className={cx(styles.iconBtn, styles.mobileOnly, mobileFilters && styles.iconBtnOn)}
                  onClick={() => setMobileFilters((o) => !o)}
                  aria-label="Filters"
                  aria-expanded={mobileFilters}
                >
                  <SlidersHorizontal />
                  {activeFilters > 0 && <span className={styles.badge}>{activeFilters}</span>}
                </button>

                <div className={cx(styles.filters, mobileFilters && styles.filtersOpen)}>
                  <span className={styles.selectWrap}>
                    <select
                      className={cx(styles.select, platform !== "All" && styles.selectOn)}
                      value={platform}
                      aria-label="Platform"
                      onChange={(e) => {
                        setPlatform(e.target.value as Platform | "All");
                        resetPage();
                      }}
                    >
                      <option value="All">All Platforms</option>
                      {PLATFORMS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </span>
                  <span className={styles.selectWrap}>
                    <select
                      className={cx(styles.select, campaign !== "All" && styles.selectOn)}
                      value={campaign}
                      aria-label="Campaign"
                      onChange={(e) => {
                        setCampaign(e.target.value);
                        resetPage();
                      }}
                    >
                      <option value="All">All Campaigns</option>
                      {campaigns.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </span>
                  <span className={styles.selectWrap}>
                    <select
                      className={cx(styles.select, statusFilter !== "All" && styles.selectOn)}
                      value={statusFilter}
                      aria-label="Status"
                      onChange={(e) => {
                        setStatusFilter(e.target.value as CreativeStatus | "All");
                        resetPage();
                      }}
                    >
                      <option value="All">All Status</option>
                      {CREATIVE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </span>
                </div>

                <div className={cx(styles.search, (searchOpen || query) && styles.searchOpen)}>
                  <button
                    type="button"
                    className={styles.searchBtn}
                    aria-label="Search"
                    onClick={() => {
                      setSearchOpen((o) => !o);
                      window.setTimeout(() => searchRef.current?.focus(), 30);
                    }}
                  >
                    <Search />
                  </button>
                  <input
                    ref={searchRef}
                    className={styles.searchInput}
                    placeholder="Search content by title, tag or caption…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      resetPage();
                    }}
                  />
                  {query && (
                    <button type="button" className={styles.searchBtn} aria-label="Clear search" onClick={() => setQuery("")}>
                      <X />
                    </button>
                  )}
                </div>

                <div className={styles.viewToggle} role="group" aria-label="View">
                  <button type="button" className={cx(styles.viewBtn, view === "grid" && styles.viewOn)} onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}>
                    <LayoutGrid />
                  </button>
                  <button type="button" className={cx(styles.viewBtn, view === "list" && styles.viewOn)} onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}>
                    <List />
                  </button>
                </div>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className={styles.activeBar}>
                <span>
                  Showing <strong>{filtered.length}</strong> of {total} creatives
                  {folder !== "all" && <> in <strong>{folder === "none" ? "Uncategorised" : folderName(folder)}</strong></>}
                </span>
                <button type="button" className={styles.linkBtn} onClick={clearFilters}>Clear filters</button>
              </div>
            )}

            {/* content */}
            {status === "loading" && <SkeletonGrid />}

            {status === "error" && (
              <div className={styles.empty}>
                <strong>Couldn’t load creatives</strong>
                <span>{error}</span>
                <button type="button" className={styles.smallBtn} onClick={reload}><RefreshCw /> Try again</button>
              </div>
            )}

            {status === "ready" && filtered.length === 0 && (
              <div className={styles.empty}>
                <Images className={styles.emptyIcon} />
                <strong>No creatives found</strong>
                <span>Try another filter or add new content.</span>
                <div className={styles.emptyActions}>
                  {activeFilters > 0 && <button type="button" className={styles.ghostBtn} onClick={clearFilters}>Clear filters</button>}
                  <button type="button" className={styles.smallBtn} onClick={() => setModal({ mode: "add" })}><Plus /> Add Content</button>
                </div>
              </div>
            )}

            {status === "ready" && filtered.length > 0 && view === "grid" && (
              <div className={styles.grid}>
                {visible.map((c) => (
                  <CreativeCard key={c.id} c={c} menuOpen={menuId === c.id} setMenu={setMenuId} actions={cardActions} />
                ))}
              </div>
            )}

            {status === "ready" && filtered.length > 0 && view === "list" && (
              <div className={styles.list}>
                <div className={styles.listHead}>
                  <span>Content</span>
                  <span>Type</span>
                  <span>Platform</span>
                  <span className={styles.hideSm}>Folder</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span />
                </div>
                {visible.map((c) => (
                  <CreativeRow key={c.id} c={c} folderName={folderName(c.folderId)} menuOpen={menuId === c.id} setMenu={setMenuId} actions={cardActions} />
                ))}
              </div>
            )}

            {status === "ready" && visible.length < filtered.length && (
              <div className={styles.more}>
                <button type="button" className={styles.ghostBtn} onClick={() => setPage((p) => p + 1)}>
                  Load more ({filtered.length - visible.length} remaining)
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ═══ SIDE ═══ */}
        <aside className={styles.side}>
          <div className={styles.addWrap} ref={addRef}>
            <button type="button" className={styles.addBtn} onClick={() => setModal({ mode: "add" })}>
              <Plus /> Add New Content
            </button>
            <button type="button" className={styles.addCaret} onClick={() => setAddOpen((o) => !o)} aria-label="More add options" aria-expanded={addOpen}>
              <ChevronDown />
            </button>
            {addOpen && (
              <div className={cx(styles.menu, styles.addMenu)} role="menu">
                {TYPE_TABS.map((t) => {
                  const Icon = TYPE_ICONS[t.value];
                  return (
                    <button
                      key={t.value}
                      type="button"
                      className={styles.menuItem}
                      onClick={() => {
                        setAddOpen(false);
                        setModal({ mode: "add", type: t.value });
                      }}
                    >
                      <Icon style={{ color: TYPE_META[t.value].color }} /> New {TYPE_META[t.value].short}
                    </button>
                  );
                })}
                <div className={styles.menuSep} />
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setAddOpen(false);
                    csvRef.current?.click();
                  }}
                >
                  <FileSpreadsheet style={{ color: "#16a34a" }} /> Import from CSV
                </button>
              </div>
            )}
            <input
              ref={csvRef}
              type="file"
              hidden
              accept=".csv,text/csv"
              onChange={(e) => {
                importCsv(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <FolderPanel
            folders={folders}
            counts={folderCounts}
            total={total}
            uncategorised={uncategorised}
            active={folder}
            onSelect={(id) => {
              setFolder(id);
              resetPage();
            }}
            onSave={(next) => {
              actions.setFolders(next);
              notify("Folders updated");
            }}
            onDelete={(id) => {
              const f = folders.find((x) => x.id === id);
              const inside = creatives.filter((c) => c.folderId === id);
              if (!f || !window.confirm(`Delete folder "${f.name}"? ${inside.length} creative(s) will move to Uncategorised.`)) return;
              actions.deleteFolder(
                id,
                folders.filter((x) => x.id !== id),
                inside.map((c) => ({ ...c, folderId: null })),
              );
              if (folder === id) setFolder("all");
              notify("Folder deleted");
            }}
          />

          <QuickStats
            counts={totals.byStatus}
            total={total}
            active={statusFilter}
            onSelect={(s) => {
              setStatusFilter((cur) => (cur === s ? "All" : s));
              resetPage();
            }}
          />

          <StorageCard usedMB={totals.used} limitMB={storageLimitMB} />
        </aside>
      </div>

      {/* sticky add button on phones */}
      <button type="button" className={styles.fab} onClick={() => setModal({ mode: "add" })}>
        <Plus /> Add New Content
      </button>

      {openCreative && (
        <CreativeDrawer
          key={openCreative.id}
          creative={openCreative}
          folders={folders}
          campaigns={campaigns}
          focusFolder={focusFolder}
          onClose={() => setOpenId(null)}
          onEdit={() => setModal({ mode: "edit", creative: openCreative })}
          onDuplicate={() => cardActions.onDuplicate(openCreative)}
          onDelete={() => cardActions.onDelete(openCreative)}
          onChange={handleDrawerChange}
        />
      )}

      {modal && (
        <CreativeModal
          key={modal.mode === "edit" ? modal.creative.id : `add-${modal.type ?? "any"}`}
          state={modal}
          clientId={clientId}
          client={client}
          folders={folders}
          campaigns={campaigns}
          defaultFolderId={folder !== "all" && folder !== "none" ? folder : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <Check /> {toast}
        </div>
      )}
    </div>
  );
}
