"use client";
// Path: src/app/dashboard/Clients/[id]/components/ContentCreatives/SidePanel.tsx
// Right column: Categories / Folders · Quick Stats · Storage Usage

import { useEffect, useState } from "react";
import { Check, Database, Folder, FolderOpen, MoreVertical, Pencil, PieChart, Plus, Trash2, X } from "lucide-react";
import styles from "./ContentCreatives.module.css";
import {
  CREATIVE_STATUSES,
  FOLDER_COLORS,
  STATUS_DOT,
  formatSize,
  newCreativeId,
  type CreativeFolder,
  type CreativeStatus,
} from "../../../../../../data/contentCreativesData";
import { cx } from "../ContentCalendar/ccUi";

/* ── Folders ─────────────────────────────────────────────── */

interface FolderProps {
  folders: CreativeFolder[];
  counts: Record<string, number>;
  total: number;
  uncategorised: number;
  active: string; // "all" | "none" | folder id
  onSelect: (id: string) => void;
  onSave: (folders: CreativeFolder[]) => void;
  onDelete: (id: string) => void;
}

export function FolderPanel({ folders, counts, total, uncategorised, active, onSelect, onSave, onDelete }: FolderProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!menuId) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-folder-menu]")) setMenuId(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuId]);

  const addFolder = () => {
    const name = newName.trim();
    if (!name) return setAdding(false);
    onSave([...folders, { id: `f-${newCreativeId()}`, name, color: FOLDER_COLORS[folders.length % FOLDER_COLORS.length] }]);
    setNewName("");
    setAdding(false);
  };

  const rename = () => {
    const name = editName.trim();
    if (editId && name) onSave(folders.map((f) => (f.id === editId ? { ...f, name } : f)));
    setEditId(null);
  };

  const renderRow = ({ id, name, color, count, editable }: { id: string; name: string; color: string; count: number; editable: boolean }) => {
    const on = active === id;
    const Icon = on ? FolderOpen : Folder;
    if (editId === id) {
      return (
        <li key={id} className={styles.folderEdit}>
          <input
            className={styles.input}
            value={editName}
            autoFocus
            maxLength={40}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") rename();
              if (e.key === "Escape") setEditId(null);
            }}
          />
          <button type="button" className={styles.iconSm} onClick={rename} aria-label="Save name"><Check /></button>
          <button type="button" className={styles.iconSm} onClick={() => setEditId(null)} aria-label="Cancel"><X /></button>
        </li>
      );
    }
    return (
      <li key={id} className={cx(styles.folderRow, on && styles.folderOn)} data-folder-menu>
        <button type="button" className={styles.folderBtn} onClick={() => onSelect(id)} aria-pressed={on}>
          <Icon className={styles.folderIcon} style={{ color, fill: `${color}33` }} />
          <span className={styles.folderName}>{name}</span>
          <span className={styles.folderCount}>{count}</span>
        </button>
        {editable ? (
          <div className={styles.menuWrap}>
            <button type="button" className={styles.folderKebab} aria-label={`Folder actions for ${name}`} onClick={() => setMenuId(menuId === id ? null : id)}>
              <MoreVertical />
            </button>
            {menuId === id && (
              <div className={styles.menu} role="menu">
                <button
                  type="button"
                  className={styles.menuItem}
                  onClick={() => {
                    setMenuId(null);
                    setEditId(id);
                    setEditName(name);
                  }}
                >
                  <Pencil /> Rename
                </button>
                <button
                  type="button"
                  className={cx(styles.menuItem, styles.menuDanger)}
                  onClick={() => {
                    setMenuId(null);
                    onDelete(id);
                  }}
                >
                  <Trash2 /> Delete folder
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className={styles.folderKebabGhost} />
        )}
      </li>
    );
  };

  return (
    <section className={styles.sideCard}>
      <h3 className={styles.sideTitle}>
        <FolderOpen className={styles.sideTitleIcon} style={{ color: "#4f46e5", fill: "#4f46e533" }} />
        Categories / Folders
      </h3>
      <ul className={styles.folderList}>
        {renderRow({ id: "all", name: "All Content", color: "#4f46e5", count: total, editable: false })}
        {folders.map((f) => renderRow({ id: f.id, name: f.name, color: f.color, count: counts[f.id] ?? 0, editable: true }))}
        {uncategorised > 0 && renderRow({ id: "none", name: "Uncategorised", color: "#94a3b8", count: uncategorised, editable: false })}
      </ul>
      {adding ? (
        <div className={styles.folderAdd}>
          <input
            className={styles.input}
            placeholder="Folder name"
            value={newName}
            autoFocus
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFolder();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <button type="button" className={styles.smallBtn} onClick={addFolder}>Add</button>
        </div>
      ) : (
        <button type="button" className={styles.addFolderBtn} onClick={() => setAdding(true)}>
          <Plus /> Add New Folder
        </button>
      )}
    </section>
  );
}

/* ── Quick stats ─────────────────────────────────────────── */

export function QuickStats({ counts, total, active, onSelect }: { counts: Record<CreativeStatus, number>; total: number; active: string; onSelect: (s: CreativeStatus) => void }) {
  return (
    <section className={styles.sideCard}>
      <h3 className={styles.sideTitle}>
        <PieChart className={styles.sideTitleIcon} style={{ color: "#7c3aed" }} />
        Quick Stats
      </h3>
      <ul className={styles.qsList}>
        {CREATIVE_STATUSES.map((st) => (
          <li key={st}>
            <button type="button" className={cx(styles.qsRow, active === st && styles.qsOn)} onClick={() => onSelect(st)}>
              <i style={{ background: STATUS_DOT[st] }} />
              <span>{st}</span>
              <strong>
                {counts[st]} <small>({total ? Math.round((counts[st] / total) * 100) : 0}%)</small>
              </strong>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Storage ─────────────────────────────────────────────── */

export function StorageCard({ usedMB, limitMB }: { usedMB: number; limitMB: number }) {
  const pct = limitMB ? Math.min(100, Math.round((usedMB / limitMB) * 100)) : 0;
  return (
    <section className={styles.sideCard}>
      <h3 className={styles.sideTitle}>
        <Database className={styles.sideTitleIcon} style={{ color: "#4f46e5" }} />
        Storage Usage
      </h3>
      <div className={styles.storageMeta}>
        <span>
          {formatSize(usedMB)} of {formatSize(limitMB)} used
        </span>
        <strong>{pct}%</strong>
      </div>
      <div className={styles.storageBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
        <i style={{ width: `${pct}%` }} className={pct >= 90 ? styles.storageHot : ""} />
      </div>
    </section>
  );
}
