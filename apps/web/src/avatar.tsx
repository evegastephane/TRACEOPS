import React from 'react';

/**
 * Initials avatars. Each organisation or person keeps the same soft tone, derived from its
 * identifier, so it is recognisable at a glance. A tone never carries a status or a permission:
 * green and red belong to states, and the blue accent to actions, so neither is dealt here.
 * The name is always written next to the avatar.
 */
const tones = [
  { bg: '#e0e7ff', fg: '#3730a3' },
  { bg: '#ede9fe', fg: '#5b21b6' },
  { bg: '#f3e8ff', fg: '#6b21a8' },
  { bg: '#e0f2fe', fg: '#075985' },
  { bg: '#cffafe', fg: '#155e75' },
  { bg: '#fef3c7', fg: '#92400e' },
  { bg: '#f1f5f9', fg: '#334155' },
  { bg: '#f5f5f4', fg: '#44403c' },
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
