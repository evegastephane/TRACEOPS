import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Small SVG charts drawn from real counts. Marks stay thin (bars capped at 24px, 2px surface gaps,
 * 4px rounded data ends, 2px lines, 8px ringed markers), grids are solid hairlines, text wears text
 * tokens, and every value stays reachable without hovering: a legend, keyboard focus and a data table.
 * Colours come from CSS (`.mark-<key>`), so each series keeps its hue whatever the filter.
 */

export type Series = { key: string; label: string };
type Column = { key: string; label: string; short: string; values: Record<string, number>; highlight?: boolean; note?: string; top?: string; future?: boolean };

/** The plot is drawn at its real pixel width, so labels keep their size on every screen. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLElement>(null), [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const update = () => setW(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update(); const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const niceMax = (v: number) => { if (v <= 4) return 4; const p = 10 ** Math.floor(Math.log10(v)), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };

function DataTable({ caption, head, rows, show }: { caption: string; head: string[]; rows: (string | number)[][]; show: boolean }) {
  // A table ignores clipping, so the hidden copy lives in a clipped wrapper that keeps it out of the page's size.
  return <div className={show ? 'chart-table-wrap' : 'sr-only'}><table className="chart-table">
    <caption className="sr-only">{caption}</caption>
    <thead><tr>{head.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function Legend({ series, counts }: { series: Series[]; counts?: Record<string, number> }) {
  return <ul className="legend">{series.map(s => <li key={s.key}><span className={`swatch mark-${s.key}`} aria-hidden="true" />{s.label}{counts && <span className="legend-n">{counts[s.key] ?? 0}</span>}</li>)}</ul>;
}

/** Stacked columns, one per day (or any ordered bucket). Arrow keys move between columns. */
export function StackedColumns({ title, columns, series, height = 188, tableLabel, showTable, emptyText, futureLabel }: {
  title: string; columns: Column[]; series: Series[]; height?: number; tableLabel: string; showTable: boolean; emptyText: string; futureLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null), id = useId(), [box, width] = useWidth(720);
  const max = niceMax(Math.max(1, ...columns.map(c => series.reduce((n, s) => n + (c.values[s.key] ?? 0), 0))));
  const tops = columns.some(c => c.top), W = width, H = height, padL = 28, padB = 26, padT = tops ? 22 : 8, plotH = H - padB - padT, slot = (W - padL) / Math.max(1, columns.length), bar = Math.max(3, Math.min(24, slot - (slot > 10 ? 4 : 2)));
  const every = Math.max(1, Math.ceil(columns.length / Math.max(2, Math.floor((W - padL) / 72)))), hi = columns.findIndex(c => c.highlight);
  const y = (v: number) => (v / max) * plotH;
  const total = (c: Column) => series.reduce((n, s) => n + (c.values[s.key] ?? 0), 0);
  const empty = columns.every(c => total(c) === 0);
  const a = active !== null ? columns[active] : null;
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setActive(i => Math.max(0, Math.min(columns.length - 1, (i ?? (e.key === 'ArrowRight' ? -1 : columns.length)) + (e.key === 'ArrowRight' ? 1 : -1)))); }
    if (e.key === 'Home') { e.preventDefault(); setActive(0); } if (e.key === 'End') { e.preventDefault(); setActive(columns.length - 1); }
    if (e.key === 'Escape') setActive(null);
  };
  return <figure className="chart" aria-labelledby={id} ref={box as React.Ref<HTMLElement>}>
    <figcaption id={id} className="sr-only">{title}</figcaption>
    {empty ? <p className="chart-empty">{emptyText}</p> : <div className="chart-plot" onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="chart-svg" role="img" aria-label={title} tabIndex={0} onKeyDown={key} onFocus={() => setActive(i => i ?? columns.findIndex(c => c.highlight) ?? 0)} onBlur={() => setActive(null)}>
        {(() => { const f0 = columns.findIndex(c => c.future); return f0 > 0 ? <g><rect className="chart-future" x={padL + f0 * slot} y={padT - 4} width={W - padL - f0 * slot} height={plotH + 4} />{futureLabel && <text className="chart-tick chart-future-label" x={padL + f0 * slot + 6} y={padT + 8}>{futureLabel}</text>}</g> : null; })()}
        {[0, 0.5, 1].map(f => <g key={f}><line className="chart-grid" x1={padL} x2={W} y1={padT + plotH - f * plotH} y2={padT + plotH - f * plotH} /><text className="chart-tick" x={padL - 8} y={padT + plotH - f * plotH + 4} textAnchor="end">{Math.round(max * f)}</text></g>)}
        {columns.map((c, i) => {
          const x = padL + i * slot + (slot - bar) / 2; let acc = 0;
          const parts = series.map(s => ({ s, v: c.values[s.key] ?? 0 })).filter(p => p.v > 0);
          return <g key={c.key} className={active === i ? 'chart-col is-active' : 'chart-col'} onPointerEnter={() => setActive(i)}>
            {c.highlight && <line className="chart-today" x1={padL + i * slot + slot / 2} x2={padL + i * slot + slot / 2} y1={padT - 4} y2={padT + plotH} />}
            {parts.map((p, j) => {
              const h = y(p.v), top = j === parts.length - 1, yy = padT + plotH - acc - h; acc += h;
              const gap = j > 0 ? 2 : 0;
              return top
                ? <path key={p.s.key} className={`mark mark-${p.s.key}`} d={`M${x},${yy + h - gap} V${yy + Math.min(4, h / 2)} Q${x},${yy} ${x + Math.min(4, h / 2)},${yy} H${x + bar - Math.min(4, h / 2)} Q${x + bar},${yy} ${x + bar},${yy + Math.min(4, h / 2)} V${yy + h - gap} Z`} />
                : <rect key={p.s.key} className={`mark mark-${p.s.key}`} x={x} y={yy} width={bar} height={Math.max(0, h - gap)} />;
            })}
            {c.top && <text className="chart-top" x={padL + i * slot + slot / 2} y={padT + plotH - acc - 6} textAnchor="middle">{c.top.length * 6.4 > slot - 6 ? '—' : c.top}</text>}
            <rect className="chart-hit" x={padL + i * slot} y={0} width={slot} height={H} />
            {(c.short && (c.highlight || (i % every === 0 && !(hi >= 0 && Math.abs(hi - i) < Math.ceil(every * .8))))) && <text className={c.highlight ? 'chart-label is-strong' : 'chart-label'} x={padL + i * slot + slot / 2} y={H - 6} textAnchor="middle">{c.short}</text>}
          </g>;
        })}
        <line className="chart-axis" x1={padL} x2={W} y1={padT + plotH} y2={padT + plotH} />
      </svg>
      {a && <div className="chart-tip" role="presentation" style={{ left: `clamp(84px, ${((padL + (active! + 0.5) * slot) / W) * 100}%, calc(100% - 84px))` }}>
        <strong>{a.label}</strong>{a.note && <span className="chart-tip-note">{a.note}</span>}
        <ul>{series.filter(s => (a.values[s.key] ?? 0) > 0).map(s => <li key={s.key}><span className={`tip-key mark-${s.key}`} aria-hidden="true" /><b>{a.values[s.key]}</b>{s.label}</li>)}
          {total(a) === 0 && !a.note && <li className="muted">0</li>}</ul>
      </div>}
      <p className="sr-only" aria-live="polite">{a ? `${a.label} : ${series.filter(s => (a.values[s.key] ?? 0) > 0).map(s => `${a.values[s.key]} ${s.label}`).join(', ') || '0'}` : ''}</p>
    </div>}
    <Legend series={series} />
    <DataTable caption={tableLabel} show={showTable} head={['', ...series.map(s => s.label), 'Total']} rows={columns.map(c => [c.label, ...series.map(s => c.values[s.key] ?? 0), total(c)])} />
  </figure>;
}

/** A weekly rate (0–1) as a 2px line with ringed markers; weeks without data leave a gap. */
export function RateLine({ title, points, target, targetLabel, tableLabel, showTable, format, emptyText, height = 150 }: {
  title: string; points: { label: string; short: string; rate: number | null; detail: string }[]; target?: number; targetLabel?: string;
  tableLabel: string; showTable: boolean; format: (v: number) => string; emptyText: string; height?: number;
}) {
  const [active, setActive] = useState<number | null>(null), id = useId(), [box, width] = useWidth(420);
  const W = width, H = height, padL = 34, padR = 14, padB = 24, plotH = H - padB - 10;
  const x = (i: number) => padL + (points.length < 2 ? (W - padL - padR) / 2 : (i / (points.length - 1)) * (W - padL - padR));
  const y = (v: number) => 10 + plotH - v * plotH;
  const segments: { i: number; v: number }[][] = []; let run: { i: number; v: number }[] = [];
  points.forEach((p, i) => { if (p.rate === null) { if (run.length) segments.push(run); run = []; } else run.push({ i, v: p.rate }); }); if (run.length) segments.push(run);
  const empty = points.every(p => p.rate === null), a = active !== null ? points[active] : null;
  return <figure className="chart" aria-labelledby={id} ref={box as React.Ref<HTMLElement>}>
    <figcaption id={id} className="sr-only">{title}</figcaption>
    {empty ? <p className="chart-empty">{emptyText}</p> : <div className="chart-plot" onPointerLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="chart-svg" role="img" aria-label={title} tabIndex={0} onBlur={() => setActive(null)}
        onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setActive(i => Math.max(0, Math.min(points.length - 1, (i ?? points.length - 1) + (e.key === 'ArrowRight' ? 1 : -1)))); } }}
        onPointerMove={e => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W; let best = 0; points.forEach((_, i) => { if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i; }); setActive(best); }}>
        {[0, 0.5, 1].map(f => <g key={f}><line className="chart-grid" x1={padL} x2={W - padR} y1={y(f)} y2={y(f)} /><text className="chart-tick" x={padL - 8} y={y(f) + 4} textAnchor="end">{format(f)}</text></g>)}
        {target !== undefined && <g><line className="chart-target" x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} />{targetLabel && <text className="chart-tick" x={W - padR} y={y(target) - 6} textAnchor="end">{targetLabel}</text>}</g>}
        {active !== null && <line className="chart-cross" x1={x(active)} x2={x(active)} y1={10} y2={10 + plotH} />}
        {segments.map((s, k) => <polyline key={k} className="mark-line" points={s.map(p => `${x(p.i)},${y(p.v)}`).join(' ')} />)}
        {points.map((p, i) => p.rate !== null && <circle key={i} className={active === i ? 'mark-dot is-active' : 'mark-dot'} cx={x(i)} cy={y(p.rate)} r={active === i ? 5.5 : 4.5} />)}
        {points.map((p, i) => <text key={'l' + i} className="chart-label" x={x(i)} y={H - 6} textAnchor="middle">{p.short}</text>)}
      </svg>
      {a && <div className="chart-tip" role="presentation" style={{ left: `clamp(84px, ${(x(active!) / W) * 100}%, calc(100% - 84px))` }}><strong>{a.rate === null ? '—' : format(a.rate)}</strong><span className="chart-tip-note">{a.label} · {a.detail}</span></div>}
      <p className="sr-only" aria-live="polite">{a ? `${a.label} : ${a.rate === null ? '—' : format(a.rate)}, ${a.detail}` : ''}</p>
    </div>}
    <DataTable caption={tableLabel} show={showTable} head={['', title]} rows={points.map(p => [p.label, p.rate === null ? '—' : `${format(p.rate)} (${p.detail})`])} />
  </figure>;
}

/** Ranked rows: a name, a thin segmented bar (bands), and the total. */
export function RankedRows({ rows, series, unit, empty }: { rows: { name: string; total: number; counts: Record<string, number> }[]; series: Series[]; unit: (n: number) => string; empty: string }) {
  const max = Math.max(1, ...rows.map(r => r.total));
  if (!rows.length) return <p className="chart-empty">{empty}</p>;
  return <ul className="ranked">{rows.map(r => <li key={r.name}>
    <span className="ranked-name" title={r.name}>{r.name}</span>
    <span className="ranked-total">{unit(r.total)}</span>
    <span className="ranked-bar" style={{ width: `${(r.total / max) * 100}%` }} role="img" aria-label={`${r.name} : ${series.filter(s => r.counts[s.key]).map(s => `${r.counts[s.key]} ${s.label}`).join(', ')}`}>
      {series.filter(s => r.counts[s.key] > 0).map(s => <span key={s.key} className={`ranked-seg mark-${s.key}`} style={{ flexGrow: r.counts[s.key] }} title={`${s.label} : ${r.counts[s.key]}`} />)}
    </span>
  </li>)}</ul>;
}

/** Single-hue ranked bars for one measure (places, sites). */
export function SimpleBars({ rows, label, empty }: { rows: { name: string; total: number }[]; label: (n: number) => string; empty: string }) {
  const max = useMemo(() => Math.max(1, ...rows.map(r => r.total)), [rows]);
  if (!rows.length) return <p className="chart-empty">{empty}</p>;
  return <ul className="ranked ranked-simple">{rows.map(r => <li key={r.name}>
    <span className="ranked-name" title={r.name}>{r.name}</span><span className="ranked-total">{label(r.total)}</span>
    <span className="ranked-bar" style={{ width: `${(r.total / max) * 100}%` }} aria-hidden="true"><span className="ranked-seg mark-one" style={{ flexGrow: 1 }} /></span>
  </li>)}</ul>;
}
