import React, { useId } from 'react';

/**
 * Organisation motifs. Each organisation gets a colour and a repeat pattern
 * derived from its identifier, the way a company has its own printed cloth:
 * dots and rings for clients, lozenges and chevrons for providers.
 */

type Kind = 'CLIENT' | 'PROVIDER' | string;
export type MotifOrg = { id: string; kind: Kind };

export const waxColors = [
  { name: 'roi', ink: '#2f4fc4', tint: '#dfe6fb' },
  { name: 'safran', ink: '#c27a06', tint: '#fcefd2' },
  { name: 'vermillon', ink: '#d2452a', tint: '#fbe1da' },
  { name: 'emeraude', ink: '#12805a', tint: '#d7f0e4' },
  { name: 'fuchsia', ink: '#b8306f', tint: '#f8dcea' },
  { name: 'turquoise', ink: '#0e7c8a', tint: '#d5eef1' },
  { name: 'aubergine', ink: '#6b3fa0', tint: '#e8ddf5' },
] as const;

export type Motif = { family: 'client' | 'provider'; variant: number; ink: string; tint: string };

function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function motifFor(org: MotifOrg): Motif {
  const h = hash(org.id);
  const color = waxColors[h % waxColors.length];
  return { family: org.kind === 'PROVIDER' ? 'provider' : 'client', variant: (h >>> 8) % 3, ink: color.ink, tint: color.tint };
}

/** One 16×16 tile of the motif, drawn in the organisation's ink on its tint. */
function Tile({ motif }: { motif: Motif }) {
  const { ink, tint } = motif;
  const ground = <rect width="16" height="16" fill={tint} />;
  if (motif.family === 'client') {
    if (motif.variant === 0) return <>{ground}<circle cx="4" cy="4" r="2.4" fill={ink} /><circle cx="12" cy="12" r="2.4" fill={ink} /></>;
    if (motif.variant === 1) return <>{ground}<circle cx="8" cy="8" r="5" fill="none" stroke={ink} strokeWidth="1.8" /><circle cx="8" cy="8" r="1.8" fill={ink} /></>;
    return <>{ground}<circle cx="4" cy="4" r="2.7" fill="none" stroke={ink} strokeWidth="1.5" /><circle cx="12" cy="12" r="2.2" fill={ink} /></>;
  }
  if (motif.variant === 0) return <>{ground}<path d="M8 1 15 8 8 15 1 8Z" fill={ink} /><path d="M8 5.5 10.5 8 8 10.5 5.5 8Z" fill={tint} /></>;
  if (motif.variant === 1) return <>{ground}<path d="M0 6 4 2 8 6 12 2 16 6M0 14 4 10 8 14 12 10 16 14" fill="none" stroke={ink} strokeWidth="2" /></>;
  return <>{ground}<path d="M4 1 7 4 4 7 1 4Z M12 9 15 12 12 15 9 12Z" fill={ink} /></>;
}

function Pattern({ id, motif, scale = 1 }: { id: string; motif: Motif; scale?: number }) {
  return <pattern id={id} width={16 * scale} height={16 * scale} patternUnits="userSpaceOnUse" viewBox="0 0 16 16"><Tile motif={motif} /></pattern>;
}

/** A small cloth swatch identifying an organisation. Decorative: the name is always written beside it. */
export function OrgSwatch({ org, className = 'swatch' }: { org: MotifOrg; className?: string }) {
  const id = useId().replace(/:/g, '');
  const motif = motifFor(org);
  return <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <defs><Pattern id={id} motif={motif} scale={0.75} /></defs>
    <rect width="40" height="40" rx="6" fill={`url(#${id})`} />
  </svg>;
}

/** The selvedge: a band of the active organisation's motif along the top of the workspace. */
export function Selvedge({ org }: { org: MotifOrg }) {
  const id = useId().replace(/:/g, '');
  const motif = motifFor(org);
  return <svg key={org.id} className="selvedge" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <defs><Pattern id={id} motif={motif} /></defs>
    <rect width="100%" height="100%" fill={`url(#${id})`} />
  </svg>;
}

/** Sample book of the motif families, shown on the sign-in screen. */
export function SampleStrip() {
  const id = useId().replace(/:/g, '');
  // The whole vocabulary: the three client and three provider motifs, each in its own colour.
  const samples: Motif[] = [0, 1, 2, 3, 4, 5].map(i => ({
    family: i % 2 ? 'provider' : 'client', variant: Math.floor(i / 2), ink: waxColors[i].ink, tint: waxColors[i].tint,
  }));
  const w = 56;
  return <svg className="sample-strip" viewBox={`0 0 ${w * samples.length} ${w}`} aria-hidden="true" focusable="false">
    <defs>
      <clipPath id={`${id}-clip`}><rect width={w * samples.length} height={w} rx="6" /></clipPath>
      {samples.map((m, i) => <Pattern key={i} id={`${id}-${i}`} motif={m} />)}
    </defs>
    <g clipPath={`url(#${id}-clip)`}>{samples.map((_, i) => <rect key={i} x={i * w} width={w} height={w} fill={`url(#${id}-${i})`} />)}</g>
  </svg>;
}

/** Inline CSS variables carrying the organisation colour to the page. */
export function orgStyle(org?: MotifOrg): React.CSSProperties | undefined {
  if (!org) return undefined;
  const motif = motifFor(org);
  return { ['--org-ink' as string]: motif.ink, ['--org-tint' as string]: motif.tint };
}
