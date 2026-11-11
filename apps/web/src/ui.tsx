import React from 'react';
import { AlertIcon, CheckIcon } from './icons';

/**
 * Shared pieces of the "rapport d'audit" console: the page cartouche, sheets, the visa band,
 * alerts and loading states. Pages compose them; the stylesheet owns every visual decision.
 */

export type Cell = { label: string; value: React.ReactNode; wide?: boolean };

/** Page header drawn as a document cartouche: the title band with its actions, then a band of labelled facts. */
export function PageHead({ title, subtitle, cells = [], actions, titleRef }: {
  title: string; subtitle?: React.ReactNode; cells?: Cell[]; actions?: React.ReactNode; titleRef?: React.Ref<HTMLHeadingElement>;
}) {
  return <header className="cartouche">
    <div className="cart-main">
      <div className="cart-title"><h1 ref={titleRef} tabIndex={titleRef ? -1 : undefined}>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {actions && <div className="cart-actions">{actions}</div>}
    </div>
    {cells.length > 0 && <dl className="cart-cells">{cells.map(c => <div key={c.label} className={c.wide ? 'cart-cell is-wide' : 'cart-cell'}><dt className="cart-label">{c.label}</dt><dd className="cart-value">{c.value}</dd></div>)}</dl>}
  </header>;
}

/** A white sheet with an optional title row. */
export function Sheet({ title, meta, actions, children, className, id }: {
  title?: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return <section className={['sheet', className].filter(Boolean).join(' ')} aria-labelledby={title ? headingId : undefined}>
    {(title || actions) && <div className="sheet-head">
      {title && <h2 id={headingId}>{title}</h2>}{meta && <span className="sheet-meta">{meta}</span>}
      {actions && <div className="sheet-actions">{actions}</div>}
    </div>}
    <div className="sheet-body">{children}</div>
  </section>;
}

export function Alert({ kind = 'error', children, retry, retryLabel }: { kind?: 'error' | 'success'; children: React.ReactNode; retry?: () => void; retryLabel?: string }) {
  return kind === 'success'
    ? <p className="alert alert-success" role="status"><CheckIcon /><span>{children}</span></p>
    : <div className="alert alert-error" role="alert"><AlertIcon /><div className="alert-body"><p>{children}</p>{retry && <button className="secondary small" onClick={retry}>{retryLabel}</button>}</div></div>;
}

export const Skeleton = ({ label, rows = 3 }: { label: string; rows?: number }) =>
  <div className="skeleton" role="status"><span className="sr-only">{label}</span>{Array.from({ length: rows }, (_, i) => <span key={i} className="skeleton-row" />)}</div>;

export function Empty({ icon, title, children, action }: { icon?: React.ReactNode; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="empty">{icon && <span className="empty-icon" aria-hidden="true">{icon}</span>}{title && <h3>{title}</h3>}{children && <p>{children}</p>}{action}</div>;
}

/** One case of the visa band: a step of the chain of custody, signed (name and date) or waiting. */
export type Visa = { key: string; step: string; state: 'signed' | 'waiting' | 'mine' | 'rework' | 'refused' | 'future'; name?: string; date?: string; note?: string; fresh?: boolean };

const Stamp = () => <svg className="visa-stamp" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" /><path d="m7.5 12.4 3 3 6-6.3" /></svg>;

export function VisaBand({ visas, label, compact = false }: { visas: Visa[]; label: string; compact?: boolean }) {
  return <ol className={compact ? 'visa-band is-compact' : 'visa-band'} aria-label={label} style={{ ['--visas' as string]: visas.length } as React.CSSProperties}>
    {visas.map((v, i) => <li key={v.key} className={`visa is-${v.state}${v.fresh ? ' is-fresh' : ''}`}>
      <span className="visa-step"><span className="visa-n">{i + 1}</span>{v.step}</span>
      <strong className="visa-name">{v.name ?? '—'}</strong>
      {v.date && <span className="visa-date">{v.date}</span>}
      {v.note && <span className="visa-note">{v.note}</span>}
      {v.state === 'signed' && <Stamp />}
    </li>)}
  </ol>;
}

/** The same chain, compact, for a table row: one square per step. */
export function VisaStrip({ marks, label }: { marks: Visa['state'][]; label: string }) {
  return <span className="visa-strip" role="img" aria-label={label}>{marks.map((m, i) => <i key={i} className={`v is-${m}`} />)}</span>;
}
