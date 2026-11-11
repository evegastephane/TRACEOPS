import React from 'react';
import { PlusIcon, SitesIcon } from './icons';
import { Empty, PageHead } from './ui';

type Org = { id: string; name: string; kind: string; roles?: string[] };

/** Home without any organisation: the administrator creates the first one, anyone else is told why the space is empty. */
export function Dashboard({ admin, lang, orgCount, onCreateOrg }: { org?: Org; admin: boolean; lang: 'fr' | 'en'; orgCount: number; onNavigate: (s: 'team' | 'sites') => void; onCreateOrg?: () => void }) {
  const fr = lang === 'fr';
  return <section className="dashboard">
    <PageHead title={fr ? 'Vue d’ensemble' : 'Overview'} subtitle={admin ? (fr ? 'Administration de la plateforme' : 'Platform administration') : (fr ? 'Aucune organisation' : 'No organization')}
      cells={[{ label: fr ? 'Organisations accessibles' : 'Accessible organizations', value: String(orgCount) }]} />
    <div className="sheet">
      <Empty icon={<SitesIcon />} title={admin ? (fr ? 'Aucune organisation pour le moment' : 'No organization yet') : (fr ? 'Votre compte n’est rattaché à aucune organisation' : 'Your account is not linked to any organization')}
        action={admin && onCreateOrg ? <button className="primary" onClick={onCreateOrg}><PlusIcon />{fr ? 'Créer une organisation' : 'Create an organization'}</button> : undefined}>
        {admin ? (fr ? 'Créez un client ou un prestataire : ses rubriques apparaîtront ici.' : 'Create a client or a provider: its sections will appear here.')
          : (fr ? 'Demandez à votre responsable une invitation : votre espace s’affichera dès qu’elle sera acceptée.' : 'Ask your manager for an invitation: your workspace appears once it is accepted.')}
      </Empty>
    </div>
  </section>;
}
