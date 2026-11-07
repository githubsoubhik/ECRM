"use client";
// Path: src/app/dashboard/Clients/[id]/components/Charts.tsx
// cspell:words sparkline sparklines
// Dependency-free SVG charts: Sparkline, Donut, GroupedBars, MultiArea (with hover tooltips)

import { useEffect, useId, useRef, useState } from "react";
import { formatCompact } from "../../../../../data/clientDetailsData";
import s from "../ClientDetails.module.css";

export const SERIES = { blue: "#3b5bdb", pink: "#d6336c", orange: "#f08c00", green: "#16a34a", purple: "#7c3aed" };

/* ---------------- Sparkline ---------------- */
export function Sparkline({ data, color, height = 44 }: { data: number[]; color: string; height?: number }) {
  const gid = useId().replace(/:/g, "");
  const w = 120;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 4 - ((v - min) / (max - min || 1)) * (height - 10)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={s.sparkline} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Donut ---------------- */
export function Donut({ parts, total, label = "Total" }: { parts: { value: number; color: string; name: string }[]; total: number; label?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const gap = parts.filter((p) => p.value > 0).length > 1 ? 1.5 : 0;
  // Pre-compute where each segment starts (no variable is changed while rendering)
  const segments = parts.map((p, i) => {
    const before = parts.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    return {
      ...p,
      len: total ? (p.value / total) * c : 0,
      start: total ? (before / total) * c : 0,
    };
  });
  return (
    <svg viewBox="0 0 120 120" className={s.donut} role="img" aria-label={`${label} ${total}: ${parts.map((p) => `${p.name} ${p.value}`).join(", ")}`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#eef0f6" strokeWidth="16" />
      {segments.map((p) => (
        <circle
          key={p.name}
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={p.color}
          strokeWidth="16"
          strokeDasharray={`${Math.max(0, p.len - gap)} ${c}`}
          strokeDashoffset={-p.start}
          transform="rotate(-90 60 60)"
        >
          <title>{`${p.name}: ${p.value}`}</title>
        </circle>
      ))}
      <text x="60" y="58" textAnchor="middle" className={s.donutValue}>
        {total}
      </text>
      <text x="60" y="74" textAnchor="middle" className={s.donutLabel}>
        {label}
      </text>
    </svg>
  );
}

/* ---------------- Legend ---------------- */
export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className={s.legend}>
      {items.map((i) => (
        <span key={i.name}>
          <i style={{ background: i.color }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

/** Measures the chart container so the SVG is drawn at real pixel size (text never stretches) */
function useMeasuredWidth(fallback = 320) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Any row with a label; numeric fields are read by name via `num()` (no `any` needed) */
type Row = { label: string };
type Series = { key: string; name: string; color: string };
const num = (r: Row, key: string) => Number((r as unknown as Record<string, unknown>)[key] ?? 0);

/* ---------------- Grouped bars ---------------- */
export function GroupedBars<R extends Row>({ rows, series, height = 160 }: { rows: R[]; series: Series[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [wrapRef, W] = useMeasuredWidth();
  const H = height, L = 34, B = 20, T = 8;
  const max = niceMax(Math.max(...rows.flatMap((r) => series.map((sr) => num(r, sr.key)))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const band = (W - L) / rows.length;
  const bw = Math.max(3, Math.min(series.length === 1 ? 18 : 10, (band - 10) / series.length - 2));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const labelStep = Math.max(1, Math.ceil((rows.length * 34) / (W - L))); // skip labels when crowded

  return (
    <div className={s.chartWrap} ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.chartSvg} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W} y1={y(t)} y2={y(t)} className={s.gridLine} />
            <text x={L - 4} y={y(t) + 3} textAnchor="end" className={s.axisText}>
              {formatCompact(t)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const x0 = L + i * band + (band - series.length * (bw + 2)) / 2;
          return (
            <g key={r.label} onMouseEnter={() => setHover(i)}>
              <rect x={L + i * band} y={T} width={band} height={H - T - B} fill={hover === i ? "rgba(59,91,219,0.06)" : "transparent"} />
              {series.map((sr, j) => {
                const v = num(r, sr.key);
                const top = y(v);
                const h = H - B - top;
                return <path key={sr.key} d={roundedTop(x0 + j * (bw + 2), top, bw, h, Math.min(3, bw / 2))} fill={sr.color} />;
              })}
              {i % labelStep === 0 && (
                <text x={L + i * band + band / 2} y={H - 6} textAnchor="middle" className={s.axisText}>
                  {r.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className={s.tooltip} style={{ left: `${((L + hover * band + band / 2) / W) * 100}%` }}>
          <strong>{rows[hover].label}</strong>
          {series.map((sr) => (
            <span key={sr.key}>
              <i style={{ background: sr.color }} />
              {sr.name}: {num(rows[hover], sr.key).toLocaleString("en-IN")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  r = Math.min(r, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/* ---------------- Multi-series area ---------------- */
export function MultiArea<R extends Row>({ rows, series, height = 160 }: { rows: R[]; series: Series[]; height?: number }) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const [wrapRef, W] = useMeasuredWidth();
  const H = height, L = 36, R = 10, B = 20, T = 8;
  const max = niceMax(Math.max(...rows.flatMap((r) => series.map((sr) => num(r, sr.key)))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const x = (i: number) => L + (i / (rows.length - 1)) * (W - L - R);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const labelStep = Math.max(1, Math.ceil((rows.length * 38) / (W - L - R))); // skip labels when crowded

  const pathFor = (key: string) => {
    const pts = rows.map((r, i) => [x(i), y(num(r, key))]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
    return d;
  };

  return (
    <div className={s.chartWrap} ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={s.chartSvg}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - L) / (W - L - R)) * (rows.length - 1));
          setHover(Math.max(0, Math.min(rows.length - 1, i)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((sr) => (
            <linearGradient key={sr.key} id={`${gid}-${sr.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={sr.color} stopOpacity="0.22" />
              <stop offset="1" stopColor={sr.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={s.gridLine} />
            <text x={L - 4} y={y(t) + 3} textAnchor="end" className={s.axisText}>
              {formatCompact(t)}
            </text>
          </g>
        ))}
        {series.map((sr) => (
          <g key={sr.key}>
            <path d={`${pathFor(sr.key)} L${x(rows.length - 1)},${H - B} L${x(0)},${H - B} Z`} fill={`url(#${gid}-${sr.key})`} />
            <path d={pathFor(sr.key)} fill="none" stroke={sr.color} strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
        {rows.map((r, i) =>
          i % labelStep === 0 || i === rows.length - 1 ? (
            <text key={r.label} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"} className={s.axisText}>
              {r.label}
            </text>
          ) : null
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#94a3b8" strokeDasharray="3 3" />
            {series.map((sr) => (
              <circle key={sr.key} cx={x(hover)} cy={y(num(rows[hover], sr.key))} r="4" fill={sr.color} stroke="#fff" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className={s.tooltip} style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{rows[hover].label}</strong>
          {series.map((sr) => (
            <span key={sr.key}>
              <i style={{ background: sr.color }} />
              {sr.name}: {num(rows[hover], sr.key).toLocaleString("en-IN")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
