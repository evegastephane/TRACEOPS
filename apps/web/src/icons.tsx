import React from 'react';

/** Line icons, 24px grid, 1.75 stroke, round joins. Decorative unless labelled by their button. */
function Icon({ children }: { children: React.ReactNode }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>;
}

export const TeamIcon = () => <Icon><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></Icon>;
export const SitesIcon = () => <Icon><path d="M3 21h18M5 21V6l7-3v18M12 8h7v13" /><path d="M8 9h1M8 13h1M8 17h1M15 12h1M15 16h1" /></Icon>;
export const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
export const ChevronIcon = () => <Icon><path d="m9 6 6 6-6 6" /></Icon>;
export const ChevronDownIcon = () => <Icon><path d="m6 9 6 6 6-6" /></Icon>;
export const BackIcon = () => <Icon><path d="m15 6-6 6 6 6" /></Icon>;
export const LogoutIcon = () => <Icon><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></Icon>;
export const CopyIcon = () => <Icon><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Icon>;
export const SearchIcon = () => <Icon><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Icon>;
export const KeyIcon = () => <Icon><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l2 2M14 9l2 2" /></Icon>;
