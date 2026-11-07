"use client";
// Path: src/app/dashboard/Billing/components/Charts.tsx
// Light-weight charts (no chart library): stacked revenue bars + donut.

import { useState, type ReactNode } from "react";
import s from "../Billing.module.css";
import { formatINR, formatINRShort } from "../../../../data/billingData";
import type { MonthBar } from "../lib/selectors";
import { cx } from "./ui";

/* ── Stacked bars ─────────────────────────────────────────── */

export type SeriesKey = "paid" | "pending" | "overdue";
export const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: "paid", label: "Paid", color: "#22b573" },
  { key: "pending", label: "Pending", color: "#f6a623" },
  { key: "overdue", label: "Overdue", color: "#ef4444" },
];

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (const st of steps) if (st * exp >= v) return st * exp;
  return 10 * exp;
}

export function RevenueChart({ bars, hidden }: { bars: MonthBar[]; hidden: Set<SeriesKey> }) {
  const [active, setActive] = useState<number | null>(null);
  const shown = SERIES.filter((x) => !hidden.has(x.key));
  const totals = bars.map((b) => shown.reduce((sum, x) => sum + b[x.key], 0));
  const max = niceMax(Math.max(...totals, 0) * 1.05);
  const ticks = [5, 4, 3, 2, 1, 0].map((i) => (max / 5) * i);
  const a = active !== null ? bars[active] : null;

  return (
    <div className={s.barChart} onMouseLeave={() => setActive(null)}>
      <div className={s.yAxis} aria-hidden="true">
        {ticks.map((t) => (
          <span key={t}>{t === 0 ? "0" : formatINRShort(t)}</span>
        ))}
      </div>
      <div className={s.plot}>
        <div className={s.gridLines} aria-hidden="true">
          {ticks.map((t) => (
            <i key={t} />
          ))}
        </div>
        <div className={s.bars} role="list" aria-label="Monthly revenue">
          {bars.map((b, i) => (
            <button
              key={b.key}
              type="button"
              role="listitem"
              className={cx(s.barCol, active === i && s.barColOn)}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={`${b.label}: ${SERIES.map((x) => `${x.label} ${formatINR(b[x.key])}`).join(", ")}`}
            >
              <span className={s.barStack}>
                {/* bottom → top: paid, pending, overdue */}
                <span className={s.barInner} style={{ height: `${(totals[i] / max) * 100}%` }}>
                  {shown.map((x) =>
                    b[x.key] > 0 ? <i key={x.key} style={{ height: `${(b[x.key] / totals[i]) * 100}%`, background: x.color }} /> : null,
                  )}
                </span>
              </span>
              <span className={s.barLabel}>{b.label}</span>
            </button>
          ))}
        </div>
        {a && active !== null && (
          <div className={s.chartTip} style={{ left: `${((active + 0.5) / bars.length) * 100}%` }} role="status">
            <strong>
              {a.label} {a.key.slice(0, 4)}
            </strong>
            {SERIES.map((x) => (
              <span key={x.key}>
                <i style={{ background: x.color }} />
                {x.label}
                <b>{formatINR(a[x.key])}</b>
              </span>
            ))}
            <span className={s.tipTotal}>
              Total <b>{formatINR(a.paid + a.pending + a.overdue)}</b>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Donut ────────────────────────────────────────────────── */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  slices,
  center,
  size = 150,
  thickness = 22,
  active,
  onHover,
  onSelect,
}: {
  slices: DonutSlice[];
  center: ReactNode;
  size?: number;
  thickness?: number;
  active?: string | null;
  onHover?: (label: string | null) => void;
  onSelect?: (label: string) => void;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((a, b) => a + b.value, 0);
  const gap = slices.filter((x) => x.value > 0).length > 1 ? 2 : 0;
  // start offsets worked out up front (no mutation inside render)
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((a, b) => a + b.value, 0));

  return (
    <div className={s.donut} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img" aria-label="Chart">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f6" strokeWidth={thickness} />
        {total > 0 &&
          slices.map((sl, i) => {
            if (!sl.value) return null;
            const len = (sl.value / total) * c;
            const dim = active && active !== sl.label;
            return (
              <circle
                key={sl.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={sl.color}
                strokeWidth={active === sl.label ? thickness + 4 : thickness}
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                strokeDashoffset={-(starts[i] / total) * c}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className={s.donutSlice}
                style={{ opacity: dim ? 0.35 : 1, cursor: onSelect ? "pointer" : "default" }}
                onMouseEnter={() => onHover?.(sl.label)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => onSelect?.(sl.label)}
              >
                <title>{`${sl.label}: ${sl.value}`}</title>
              </circle>
            );
          })}
      </svg>
      <div className={s.donutCenter}>{center}</div>
    </div>
  );
}
