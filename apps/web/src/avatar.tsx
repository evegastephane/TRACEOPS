import React from 'react';

/**
 * Initials avatars. Each organisation or person keeps the same soft tone, derived from its
 * identifier, so it is recognisable at a glance. Tones are muted on purpose: green, amber and red
 * belong to conformity states, so none of them is dealt here.
 * The name is always written next to the avatar.
 */
const tones = [
  { bg: '#dfeaed', fg: '#1f4d5b' },
  { bg: '#e3e8ef', fg: '#334155' },
  { bg: '#ecebe6', fg: '#4a4740' },
  { bg: '#ece4ef', fg: '#5b3a66' },
  { bg: '#e3e6f3', fg: '#36407a' },
  { bg: '#dcebea', fg: '#24585a' },
  { bg: '#efe8dc', fg: '#5e4b2b' },
  { bg: '#e9e4f1', fg: '#463a6b' },
] as const;

function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase()).join('');

export function Avatar({ name, seed, shape = 'circle', size = 'md' }: { name: string; seed: string; shape?: 'circle' | 'square'; size?: 'sm' | 'md' | 'lg' }) {
  const tone = tones[hash(seed) % tones.length];
  const style = { ['--avatar-bg' as string]: tone.bg, ['--avatar-fg' as string]: tone.fg } as React.CSSProperties;
  return <span className={`avatar avatar-${shape} avatar-${size}`} aria-hidden="true" style={style}>{initials(name)}</span>;
}
