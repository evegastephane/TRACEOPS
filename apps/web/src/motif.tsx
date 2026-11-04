import React from 'react';

/**
 * Organisation motifs. Each organisation gets a colour and a repeat pattern
 * derived from its identifier, the way a company has its own printed cloth:
 * dots and rings for clients, lozenges and chevrons for providers.
 *
 * The cloth is drawn as a CSS background of one SVG tile with
 * `background-repeat: round`: the browser fits a whole number of tiles to the
 * box, so no motif is ever cut at an edge, whatever the width.
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

/** One 16×16 tile of the motif, in the organisation's ink on its tint. Every motif stays inside its tile, except the chevron, which joins its neighbours. */
function tileSvg({ family, variant, ink, tint }: Motif): string {
  const shapes = family === 'client'
    ? [
        `<circle cx="4" cy="4" r="2.4" fill="${ink}"/><circle cx="12" cy="12" r="2.4" fill="${ink}"/>`,
        `<circle cx="8" cy="8" r="5" fill="none" stroke="${ink}" stroke-width="1.8"/><circle cx="8" cy="8" r="1.8" fill="${ink}"/>`,
        `<circle cx="4" cy="4" r="2.7" fill="none" stroke="${ink}" stroke-width="1.5"/><circle cx="12" cy="12" r="2.2" fill="${ink}"/>`,
      ]
    : [
        `<path d="M8 1 15 8 8 15 1 8Z" fill="${ink}"/><path d="M8 5.5 10.5 8 8 10.5 5.5 8Z" fill="${tint}"/>`,
        `<path d="M0 6 4 2 8 6 12 2 16 6M0 14 4 10 8 14 12 10 16 14" fill="none" stroke="${ink}" stroke-width="2"/>`,
        `<path d="M4 1 7 4 4 7 1 4ZM12 9 15 12 12 15 9 12Z" fill="${ink}"/>`,
      ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="${tint}"/>${shapes[variant]}</svg>`;
}

function clothStyle(motif: Motif, tile: number): React.CSSProperties {
  return {
    // The tint behind the tiles hides sub-pixel seams when `round` scales them to a fractional size.
    backgroundColor: motif.tint,
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tileSvg(motif))}")`,
    backgroundSize: `${tile}px ${tile}px`,
    backgroundRepeat: 'round',
  };
}

/** A piece of the organisation's cloth filling its box. Decorative: the name is always written nearby. */
export function Cloth({ org, className, tile = 16 }: { org: MotifOrg; className: string; tile?: number }) {
  return <span className={className} aria-hidden="true" style={clothStyle(motifFor(org), tile)} />;
}

/**
 * The selvedge: the cloth's edge, 12px wide (one row of 12px tiles), along the top of the
 * workspace and down the inner edge of the rail. Keyed on the organisation so it re-prints
 * (unrolls) whenever the active organisation changes.
 */
export function Selvedge({ org, vertical = false }: { org: MotifOrg; vertical?: boolean }) {
  return <Cloth key={org.id} org={org} tile={12} className={vertical ? 'selvedge selvedge-v' : 'selvedge'} />;
}

/** Sample book of the motif families, shown on the sign-in screen: the three client and three provider motifs, each in its own colour. */
export function SampleStrip() {
  const samples: Motif[] = [0, 1, 2, 3, 4, 5].map(i => ({
    family: i % 2 ? 'provider' : 'client', variant: Math.floor(i / 2), ink: waxColors[i].ink, tint: waxColors[i].tint,
  }));
  return <div className="sample-strip" aria-hidden="true">{samples.map((motif, i) => <span key={i} style={clothStyle(motif, 20)} />)}</div>;
}

/** Inline CSS variables carrying the organisation colour to the page. */
export function orgStyle(org?: MotifOrg): React.CSSProperties | undefined {
  if (!org) return undefined;
  const motif = motifFor(org);
  return {
    ['--org-ink' as string]: motif.ink,
    ['--org-tint' as string]: motif.tint,
    // The tile alone, for cloth edges drawn in CSS (detail cards).
    ['--org-cloth' as string]: `url("data:image/svg+xml,${encodeURIComponent(tileSvg(motif))}")`,
  };
}
