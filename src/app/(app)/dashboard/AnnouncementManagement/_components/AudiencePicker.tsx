"use client";

// Target Audience: five options; the chosen one opens its chooser underneath.

import { useMemo, useState } from "react";
import { Building2, Check, ChevronRight, Search, User, UserCheck, Users, UsersRound, type LucideIcon } from "lucide-react";
import {
  AUDIENCE_OPTIONS,
  departmentsOf,
  groupsOf,
  leadersOf,
  resolveAudience,
  type Audience,
  type AudienceType,
  type Person,
} from "../../../../data/announcementData";
import { Avatar, cx } from "./ui";
import styles from "../announcement.module.css";

const ICONS: Record<AudienceType, { icon: LucideIcon; color: string; soft: string }> = {
  all: { icon: Users, color: "#2f7de1", soft: "#e6f0fd" },
  departments: { icon: Building2, color: "#7c3aed", soft: "#efe7fd" },
  "team-leaders": { icon: UserCheck, color: "#4f46e5", soft: "#e8e7fd" },
  groups: { icon: UsersRound, color: "#16a34a", soft: "#e3f6ea" },
  individuals: { icon: User, color: "#e5484d", soft: "#fde8e8" },
};

export default function AudiencePicker({
  audience,
  onChange,
  list,
  error,
  showChevrons,
}: {
  audience: Audience;
  onChange: (a: Audience) => void;
  list: Person[];
  error?: string;
  showChevrons: boolean;
}) {
  const [q, setQ] = useState("");
  const depts = useMemo(() => departmentsOf(list), [list]);
  const groups = useMemo(() => groupsOf(list), [list]);
  const reach = useMemo(() => resolveAudience(audience, list), [audience, list]);

  const toggle = (key: "departments" | "groups" | "employeeIds", value: string) => {
    const cur = audience[key];
    onChange({ ...audience, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
  };

  const chips = (items: { value: string; label: string; count: number; hint?: string }[], key: "departments" | "groups") => (
    <div className={styles.chipGrid}>
      {items.map((it) => {
        const on = audience[key].includes(it.value);
        return (
          <button
            key={it.value}
            type="button"
            className={cx(styles.chip, on && styles.chipOn)}
            onClick={() => toggle(key, it.value)}
            aria-pressed={on}
            title={it.hint}
          >
            {on && <Check size={13} strokeWidth={3} />}
            {it.label}
            <em>{it.count}</em>
          </button>
        );
      })}
    </div>
  );

  const chooser = (type: AudienceType) => {
    if (type === "departments")
      return chips(
        depts.map((d) => ({ value: d, label: d, count: list.filter((p) => p.department === d).length })),
        "departments",
      );
    if (type === "team-leaders")
      return chips(
        depts.map((d) => {
          const leaders = leadersOf(d, list);
          return { value: d, label: d, count: leaders.length, hint: leaders.map((l) => l.name).join(", ") };
        }),
        "departments",
      );
    if (type === "groups")
      return chips(
        groups.map((g) => ({ value: g, label: g, count: resolveAudience({ type: "groups", groups: [g], departments: [], employeeIds: [] }, list).length })),
        "groups",
      );
    if (type === "individuals") {
      const s = q.trim().toLowerCase();
      const shown = list.filter((p) => !s || [p.name, p.id, p.department].some((v) => v.toLowerCase().includes(s)));
      return (
        <div className={styles.peoplePick}>
          <label className={styles.miniSearch}>
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, ID or department" />
          </label>
          <div className={styles.peopleList}>
            {shown.map((p) => (
              <label key={p.id} className={cx(audience.employeeIds.includes(p.id) && styles.personOn)}>
                <input type="checkbox" checked={audience.employeeIds.includes(p.id)} onChange={() => toggle("employeeIds", p.id)} />
                <Avatar name={p.name} photoUrl={p.photoUrl} size={26} />
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.id} · {p.department}
                  </small>
                </span>
              </label>
            ))}
            {!shown.length && <p className={styles.muted}>No employees match.</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.audience} role="radiogroup" aria-label="Target Audience">
      {AUDIENCE_OPTIONS.map((opt) => {
        const on = audience.type === opt.type;
        const ic = ICONS[opt.type];
        return (
          <div key={opt.type} className={cx(styles.audItem, on && styles.audItemOn)}>
            <label className={styles.audRow}>
              <input type="radio" name="audience" checked={on} onChange={() => onChange({ ...audience, type: opt.type })} />
              <span className={styles.radio} aria-hidden="true" />
              <span className={styles.audIcon} style={{ color: ic.color, background: ic.soft }}>
                <ic.icon size={17} />
              </span>
              <span className={styles.audText}>
                <b>{opt.label}</b>
                <small>{opt.sub}</small>
              </span>
              {showChevrons && <ChevronRight size={17} className={cx(styles.audChevron, on && opt.type !== "all" && styles.audChevronOn)} />}
            </label>
            {on && opt.type !== "all" && <div className={styles.audChooser}>{chooser(opt.type)}</div>}
          </div>
        );
      })}
      <div className={cx(styles.reach, error && styles.reachError)}>
        {error ? (
          error
        ) : (
          <>
            <Users size={15} /> Will reach <b>{reach.length}</b> {reach.length === 1 ? "employee" : "employees"}
          </>
        )}
      </div>
    </div>
  );
}
