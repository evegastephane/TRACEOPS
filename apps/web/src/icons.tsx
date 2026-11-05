import React from 'react';

/** Line icons, 24px grid, 1.75 stroke, round joins. Decorative unless labelled by their button. */
function Icon({ children }: { children: React.ReactNode }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>;
}

export const TeamIcon = () => <Icon><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></Icon>;
export const SitesIcon = () => <Icon><path d="M3 21h18M5 21V6l7-3v18M12 8h7v13" /><path d="M8 9h1M8 13h1M8 17h1M15 12h1M15 16h1" /></Icon>;
export const PlusIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
export const ChevronIcon = () => <Icon><path d="m9 6 6 6-6 6" /></Icon>;
export const BackIcon = () => <Icon><path d="m15 6-6 6 6 6" /></Icon>;
export const LogoutIcon = () => <Icon><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10" /></Icon>;
export const CopyIcon = () => <Icon><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Icon>;
export const SearchIcon = () => <Icon><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Icon>;
export const CloseIcon = () => <Icon><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const CheckIcon = () => <Icon><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
export const AlertIcon = () => <Icon><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></Icon>;
export const LinkIcon = () => <Icon><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>;
export const UserPlusIcon = () => <Icon><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20c.6-3.6 3.2-5.5 6.5-5.5 1.4 0 2.7.3 3.7 1M18 14v6M15 17h6" /></Icon>;
export const DashboardIcon = () => <Icon><rect x="3.5" y="3.5" width="7" height="8" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="14.5" width="7" height="6" rx="1.5" /></Icon>;
export const CompanyIcon = () => <Icon><rect x="3.5" y="7" width="17" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17M10.5 12.5v2h3v-2" /></Icon>;
export const GlobeIcon = () => <Icon><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z" /></Icon>;
export const PanelIcon = () => <Icon><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M9.5 4v16" /></Icon>;
export const LogIcon = () => <Icon><path d="M8 6h12M8 12h12M8 18h12" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></Icon>;
export const UserIcon = () => <Icon><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" /></Icon>;
export const HandshakeIcon = () => <Icon><path d="m11 17 2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2L11.6 6.8a3 3 0 0 1 3.6-.5l.6.4a2 2 0 0 0 1.5.3L21 6" /><path d="M3 6l3.8.8a2 2 0 0 1 1.3 1L9 9.5M3 13l4 4" /></Icon>;
export const PinIcon = () => <Icon><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>;
