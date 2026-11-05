import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { Database } from './database.module.js';
import { hashPassword, temporaryPassword } from './domain/password.js';
import { createPassage, localInstant, passages } from './interventions/interventions.controller.js';

/** Logins of the local demonstration. Field agents must replace their password at first sign-in. */
export const demoAccounts = [
 { login: 'demo.admin', name: 'Administrateur plateforme (démo)', role: 'PLATFORM_ADMIN', org: 'none' },
 { login: 'demo.client', name: 'Responsable services généraux AFISA (démo)', role: 'CLIENT_MANAGER', org: 'client' },
 { login: 'demo.controleur', name: 'Contrôleuse qualité AFISA (démo)', role: 'CLIENT_CONTROLLER', org: 'client' },
 { login: 'demo.prestataire', name: 'Chef d’équipe Hygiène Plus (démo)', role: 'PROVIDER_MANAGER', org: 'cleaning' },
 { login: 'demo.agent', name: 'Agent de nettoyage A (démo)', role: 'FIELD_AGENT', org: 'cleaning' },
 { login: 'demo.agent2', name: 'Agent de nettoyage B (démo)', role: 'FIELD_AGENT', org: 'cleaning' },
 { login: 'demo.maintenance', name: 'Responsable MécaTech Industrie (démo)', role: 'PROVIDER_MANAGER', org: 'maintenance' },
 { login: 'demo.technicien', name: 'Technicien de maintenance (démo)', role: 'FIELD_AGENT', org: 'maintenance' },
] as const;

const TZ = 'Africa/Douala';
const DAY = 86400000;
/** Today's date at the site, "YYYY-MM-DD", shifted by a number of days. */
function siteDate(shift = 0) {
 const now = new Date(Date.now() + shift * DAY);
 return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * Explicit local demo initializer, never called by the application startup.
 * Fictional data for a presentation at AFISA Food Industry (agri-food plant): a cleaning contract with
 * daily passages, and one-off industrial maintenance with a prior quote when needed, at every step.
 */
export async function initializeDemo(db: Database) {
 const accounts = demoAccounts.map(a => ({ ...a, id: randomUUID(), membership: randomUUID(), password: temporaryPassword() }));
 const hashed = await Promise.all(accounts.map(a => hashPassword(a.password)));
 const org = { client: randomUUID(), cleaning: randomUUID(), maintenance: randomUUID() };
 const site = randomUUID();
 await db.transaction(async tx => {
  await tx.query('SELECT pg_advisory_xact_lock(728135)');
  const existing = await tx.query('SELECT 1 FROM app_user UNION ALL SELECT 1 FROM organization LIMIT 1');
  if (existing.rowCount) throw new Error('DEMO_REQUIRES_EMPTY_DATABASE');
  await tx.query(`INSERT INTO organization(id,name,kind) VALUES($1,'AFISA Food Industry','CLIENT'),($2,'Hygiène Plus Services','PROVIDER'),($3,'MécaTech Industrie','PROVIDER')`, [org.client, org.cleaning, org.maintenance]);
  for (const [index, account] of accounts.entries()) {
   await tx.query('INSERT INTO app_user(id,login,password_hash,display_name,must_change_password) VALUES($1,$2,$3,$4,$5)', [account.id, account.login, hashed[index], account.name, account.role === 'FIELD_AGENT']);
   if (account.role === 'PLATFORM_ADMIN') { await tx.query('INSERT INTO platform_admin(user_id) VALUES($1)', [account.id]); continue; }
   await tx.query('INSERT INTO membership(id,user_id,organization_id) VALUES($1,$2,$3)', [account.membership, account.id, org[account.org as keyof typeof org]]);
   await tx.query('INSERT INTO membership_role(membership_id,role) VALUES($1,$2)', [account.membership, account.role]);
  }
  const who = (login: string) => accounts.find(a => a.login === login)!;
  const admin = who('demo.admin').id, manager = who('demo.client').id, controller = who('demo.controleur').id;
  const cleanLead = who('demo.prestataire').id, mecaLead = who('demo.maintenance').id;
  const agentA = who('demo.agent'), agentB = who('demo.agent2'), tech = who('demo.technicien');

  const profile = `INSERT INTO organization_profile(organization_id,city,phone,email,services,description,contact_name,updated_by) VALUES($1,'Douala',$2,$3,$4,$5,$6,$7)`;
  await tx.query(profile, [org.client, '+237 600 00 00 01', 'services.generaux@afisa.example', 'Industrie agroalimentaire', 'Données fictives pour la présentation.', 'Responsable services généraux', admin]);
  await tx.query(profile, [org.cleaning, '+237 600 00 00 02', 'contact@hygieneplus.example', 'Nettoyage industriel, désinfection, hygiène agroalimentaire', 'Prestataire fictif de nettoyage sous contrat.', 'Chef d’équipe', admin]);
  await tx.query(profile, [org.maintenance, '+237 600 00 00 03', 'atelier@mecatech.example', 'Maintenance industrielle, mécanique, froid, électricité', 'Prestataire fictif de maintenance ponctuelle.', 'Responsable atelier', admin]);

  await tx.query(`INSERT INTO site(id,client_id,name,sector,timezone) VALUES($1,$2,'Usine de Bonabéri','Industrie agroalimentaire',$3)`, [site, org.client, TZ]);
  const zones: Record<string, string> = {};
  const zone = async (code: string, name: string, kind: string, parent?: string) => {
   zones[code] = randomUUID();
   await tx.query('INSERT INTO zone(id,site_id,parent_id,code,name,kind) VALUES($1,$2,$3,$4,$5,$6)', [zones[code], site, parent ? zones[parent] : null, code, name, kind]);
  };
  await zone('BAT-P', 'Bâtiment de production', 'BUILDING');
  await zone('ZN-RCP', 'Réception des matières premières', 'AREA', 'BAT-P');
  await zone('ZN-PRE', 'Zone de préparation', 'AREA', 'BAT-P');
  await zone('EQ-MEL1', 'Mélangeur M1 (500 L)', 'EQUIPMENT', 'ZN-PRE');
  await zone('ZN-CUI', 'Zone de cuisson', 'AREA', 'BAT-P');
  await zone('EQ-FOU1', 'Four tunnel F1', 'EQUIPMENT', 'ZN-CUI');
  await zone('SAL-CDT', 'Salle de conditionnement', 'ROOM', 'BAT-P');
  await zone('EQ-CON2', 'Convoyeur ligne 2', 'EQUIPMENT', 'SAL-CDT');
  await zone('EQ-ENS1', 'Ensacheuse E1', 'EQUIPMENT', 'SAL-CDT');
  await zone('CF-POS', 'Chambre froide positive (+4 °C)', 'ROOM', 'BAT-P');
  await zone('CF-NEG', 'Chambre froide négative (−18 °C)', 'ROOM', 'BAT-P');
  await zone('SAS-HYG', 'Sas d’hygiène et vestiaires', 'ROOM', 'BAT-P');
  await zone('BAT-L', 'Bâtiment logistique', 'BUILDING');
  await zone('QUAI-EXP', 'Quai d’expédition', 'AREA', 'BAT-L');
  await zone('BAT-A', 'Bâtiment administratif', 'BUILDING');
  await zone('SAL-REU', 'Salle de réunion', 'ROOM', 'BAT-A');

  for (const provider of [org.cleaning, org.maintenance]) await tx.query('INSERT INTO service_agreement(id,client_id,site_id,provider_id,starts_at) VALUES($1,$2,$3,$4,now())', [randomUUID(), org.client, site, provider]);
  await tx.query('INSERT INTO site_grant(membership_id,site_id) VALUES($1,$2)', [who('demo.controleur').membership, site]);
  for (const [m, z] of [[agentA.membership, 'SAL-CDT'], [agentA.membership, 'SAS-HYG'], [agentB.membership, 'SAL-CDT'], [agentB.membership, 'CF-POS'], [tech.membership, 'BAT-P']] as const)
   await tx.query('INSERT INTO agent_assignment(membership_id,zone_id,created_by) VALUES($1,$2,$3)', [m, zones[z], cleanLead]);

  const ev = (id: string, actor: string, action: string, from: string | null, to: string | null, at: Date, reason: string | null = null) =>
   tx.query('INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status,reason,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [randomUUID(), id, actor, action, from, to, reason, at]);
  const tasksOf = async (id: string) => (await tx.query('SELECT id,label FROM intervention_task WHERE intervention_id=$1 ORDER BY position', [id])).rows as { id: string; label: string }[];
  const setStatus = (id: string, status: string, extra = '', values: unknown[] = []) => tx.query(`UPDATE intervention SET status=$2${extra} WHERE id=$1`, [id, status, ...values]);
  const doTasks = async (id: string, actor: string, at: Date, impossible?: { index: number; note: string }) => {
   for (const [i, t] of (await tasksOf(id)).entries()) {
    const off = impossible?.index === i;
    await tx.query('UPDATE intervention_task SET status=$2,note=$3,done_by=$4,done_at=$5 WHERE id=$1', [t.id, off ? 'IMPOSSIBLE' : 'DONE', off ? impossible!.note : null, actor, new Date(at.getTime() + (i + 1) * 9 * 60000)]);
   }
  };

  /* Contract cleaning: daily passages (Monday to Saturday) in packing and the hygiene airlock. */
  const p1 = { id: randomUUID(), client: org.client, provider: org.cleaning, site, title: 'Nettoyage quotidien — conditionnement et sas d’hygiène',
   description: 'Contrat annuel de nettoyage. Passage avant le démarrage de la ligne 2. Produits alimentaires compatibles uniquement.',
   zones: [zones['SAL-CDT']!, zones['EQ-CON2']!, zones['SAS-HYG']!],
   tasks: ['Démontage des carters et dégraissage du convoyeur ligne 2', 'Nettoyage et désinfection des surfaces en contact alimentaire', 'Lavage et raclage des sols, évacuation des siphons', 'Nettoyage du sas d’hygiène (lave-mains, distributeurs, pédiluve)', 'Vidage et désinfection des poubelles'],
   team: [agentA.membership, agentB.membership], lead: agentA.membership, actor: manager };
  const p1Start = siteDate(-12), p1End = siteDate(75);
  await tx.query(`INSERT INTO programme(id,client_id,provider_id,site_id,title,description,weekdays,start_date,end_date,start_time,end_time,zone_ids,tasks,team,lead_membership_id,created_by,created_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'05:30','07:00',$10,$11,$12,$13,$14,$15)`, [p1.id, p1.client, p1.provider, site, p1.title, p1.description, [1, 2, 3, 4, 5, 6], p1Start, p1End, p1.zones, p1.tasks, p1.team, p1.lead, manager, new Date(Date.now() - 14 * DAY)]);
  const today = siteDate();
  for (const date of passages(p1Start, p1End, [1, 2, 3, 4, 5, 6])) {
   const starts = localInstant(date, '05:30', TZ), ends = localInstant(date, '07:00', TZ);
   const id = await createPassage(tx as PoolClient, p1, starts, ends, 'ASSIGNED');
   await tx.query('UPDATE intervention SET created_at=$2 WHERE id=$1', [id, new Date(Date.now() - 14 * DAY)]);
   await tx.query("UPDATE intervention_event SET created_at=$2 WHERE intervention_id=$1 AND action IN ('SCHEDULED','ASSIGNED')", [id, new Date(Date.now() - 14 * DAY)]);
   if (date >= today) {
    if (date === today) {
     await setStatus(id, 'IN_PROGRESS', ',started_at=$3', [starts]); await ev(id, agentA.id, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', starts);
     const ts = await tasksOf(id);
     for (const t of ts.slice(0, 2)) await tx.query(`UPDATE intervention_task SET status='DONE',done_by=$2,done_at=$3 WHERE id=$1`, [t.id, agentA.id, new Date(starts.getTime() + 20 * 60000)]);
    }
    continue;
   }
   const back = Math.round((Date.parse(today) - Date.parse(date)) / DAY);
   await setStatus(id, 'IN_PROGRESS', ',started_at=$3', [starts]); await ev(id, agentA.id, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', starts);
   await doTasks(id, back % 2 ? agentB.id : agentA.id, starts);
   const submitted = new Date(ends.getTime() - 5 * 60000);
   await tx.query(`UPDATE intervention SET submitted_at=$2,submitted_by=$3,report_note=$4 WHERE id=$1`, [id, submitted, agentA.id, 'Ligne 2 prête pour le démarrage de 07h00. Produits : détergent alcalin puis désinfectant agréé contact alimentaire.']);
   await ev(id, agentA.id, 'SUBMITTED', 'IN_PROGRESS', 'UNDER_REVIEW', submitted);
   if (back <= 1) { await setStatus(id, 'UNDER_REVIEW'); continue; }
   if (back === 2) {
    const t = (await tasksOf(id))[0]!;
    await tx.query(`UPDATE intervention_task SET status='TODO',rework=true,done_by=NULL,done_at=NULL WHERE id=$1`, [t.id]);
    await tx.query(`UPDATE intervention SET round=2 WHERE id=$1`, [id]);
    await setStatus(id, 'REWORK'); await ev(id, controller, 'REWORK_REQUESTED', 'UNDER_REVIEW', 'REWORK', new Date(ends.getTime() + 90 * 60000), 'Résidus de graisse visibles sous le carter aval du convoyeur. Reprendre le dégraissage avant 10h.');
    continue;
   }
   await setStatus(id, 'ACCEPTED', ',accepted_at=$3', [new Date(ends.getTime() + 2 * 3600000)]);
   await ev(id, controller, 'ACCEPTED', 'UNDER_REVIEW', 'ACCEPTED', new Date(ends.getTime() + 2 * 3600000), 'Contrôle visuel et test ATP conformes.');
  }

  /* Weekly cold-room cleaning, not yet staffed by the provider: the passages wait to be assigned. */
  const p2 = { id: randomUUID(), client: org.client, provider: org.cleaning, site, title: 'Nettoyage hebdomadaire des chambres froides', description: 'Chambres froides vidées par la logistique le samedi midi.',
   zones: [zones['CF-POS']!, zones['CF-NEG']!], tasks: ['Évacuation des palettes vides et déchets', 'Nettoyage des parois, portes et joints', 'Désinfection des étagères et du sol', 'Contrôle de la température après fermeture'], team: [], lead: null, actor: manager };
  const p2Start = siteDate(1), p2End = siteDate(60);
  await tx.query(`INSERT INTO programme(id,client_id,provider_id,site_id,title,description,weekdays,start_date,end_date,start_time,end_time,zone_ids,tasks,created_by)
   VALUES($1,$2,$3,$4,$5,$6,'{6}',$7,$8,'13:00','16:00',$9,$10,$11)`, [p2.id, p2.client, p2.provider, site, p2.title, p2.description, p2Start, p2End, p2.zones, p2.tasks, manager]);
  for (const date of passages(p2Start, p2End, [6])) await createPassage(tx as PoolClient, p2, localInstant(date, '13:00', TZ), localInstant(date, '16:00', TZ));

  /* One-off industrial maintenance with MécaTech, at every step of the journey. */
  const maintenance = async (o: { title: string; description: string; zones: string[]; tasks: string[]; day: number; from: string; to: string; quote: boolean; priority?: string; createdDays: number }) => {
   const id = randomUUID(), starts = localInstant(siteDate(o.day), o.from, TZ), ends = localInstant(siteDate(o.day), o.to, TZ), created = new Date(Date.now() - o.createdDays * DAY);
   await tx.query(`INSERT INTO intervention(id,client_id,provider_id,site_id,kind,title,description,priority,starts_at,ends_at,status,quote_required,created_by,created_at)
    VALUES($1,$2,$3,$4,'MAINTENANCE',$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [id, org.client, org.maintenance, site, o.title, o.description, o.priority ?? 'NORMAL', starts, ends, o.quote ? 'REQUESTED' : 'PLANNED', o.quote, manager, created]);
   for (const z of o.zones) await tx.query('INSERT INTO intervention_zone(intervention_id,zone_id) VALUES($1,$2)', [id, zones[z]]);
   for (const [i, label] of o.tasks.entries()) await tx.query('INSERT INTO intervention_task(id,intervention_id,position,label) VALUES($1,$2,$3,$4)', [randomUUID(), id, i + 1, label]);
   await ev(id, manager, 'REQUESTED', null, o.quote ? 'REQUESTED' : 'PLANNED', created);
   return { id, starts, ends, created };
  };
  const quote = async (id: string, amount: number, delay: number, description: string, at: Date, decision?: { accept: boolean; at: Date; reason?: string }) => {
   await tx.query(`INSERT INTO quote(id,intervention_id,amount_xaf,delay_days,description,status,reason,created_by,created_at,decided_by,decided_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [randomUUID(), id, amount, delay, description, decision ? (decision.accept ? 'ACCEPTED' : 'REFUSED') : 'PENDING', decision?.reason ?? null, mecaLead, at, decision ? manager : null, decision?.at ?? null]);
   await ev(id, mecaLead, 'QUOTE_SUBMITTED', 'REQUESTED', 'QUOTE_SUBMITTED', at);
   if (decision) await ev(id, manager, decision.accept ? 'QUOTE_ACCEPTED' : 'QUOTE_REFUSED', 'QUOTE_SUBMITTED', decision.accept ? 'PLANNED' : 'QUOTE_REFUSED', decision.at, decision.reason ?? null);
  };
  const crew = async (id: string, at: Date) => { await tx.query('INSERT INTO intervention_agent(intervention_id,membership_id,lead) VALUES($1,$2,true)', [id, tech.membership]); await ev(id, mecaLead, 'ASSIGNED', 'PLANNED', 'ASSIGNED', at); };

  const m1 = await maintenance({ title: 'Fuite d’huile hydraulique sur l’ensacheuse E1', description: 'Fuite constatée sous le vérin de soudure. Bac de rétention en place. Devis demandé avant intervention.', zones: ['EQ-ENS1'],
   tasks: ['Consignation électrique et hydraulique de l’ensacheuse', 'Recherche de fuite et remplacement des joints du vérin', 'Essais à vide puis en production', 'Nettoyage de la zone et déconsignation'], day: 4, from: '14:00', to: '18:00', quote: true, priority: 'URGENT', createdDays: 1 });
  const m2 = await maintenance({ title: 'Remplacement des roulements du convoyeur ligne 2', description: 'Bruit anormal en sortie de ligne. Intervention à prévoir lors de l’arrêt hebdomadaire.', zones: ['EQ-CON2'],
   tasks: ['Consignation du convoyeur', 'Dépose du tambour et remplacement des roulements', 'Graissage alimentaire (NSF H1) et remontage', 'Essais et mesure vibratoire'], day: 6, from: '08:00', to: '12:00', quote: true, createdDays: 5 });
  await quote(m2.id, 850000, 2, 'Fourniture de 4 roulements étanches inox, main-d’œuvre 2 techniciens, graisse alimentaire NSF H1. Pièces disponibles sous 48 h.', new Date(Date.now() - 2 * DAY));
  await setStatus(m2.id, 'QUOTE_SUBMITTED');

  const m3 = await maintenance({ title: 'Révision annuelle du four tunnel F1', description: 'Révision préventive annuelle prévue au plan de maintenance.', zones: ['EQ-FOU1'],
   tasks: ['Contrôle des brûleurs et de la combustion', 'Vérification des joints de portes et de l’isolation', 'Contrôle des sondes de température', 'Essais de montée en température'], day: -6, from: '07:00', to: '15:00', quote: true, createdDays: 20 });
  await quote(m3.id, 1250000, 5, 'Révision complète selon le carnet constructeur, remplacement des pièces d’usure courantes inclus.', new Date(Date.now() - 18 * DAY), { accept: true, at: new Date(Date.now() - 17 * DAY), reason: 'Budget maintenance préventive validé.' });
  await crew(m3.id, new Date(Date.now() - 16 * DAY));
  await setStatus(m3.id, 'ACCEPTED', ',started_at=$3,submitted_at=$4,submitted_by=$5,report_note=$6,accepted_at=$7',
   [m3.starts, new Date(m3.ends.getTime() - 15 * 60000), tech.id, 'Révision réalisée. Combustion réglée. Joint de la porte de sortie usé : pièce commandée, remplacement à planifier.', new Date(m3.ends.getTime() + 20 * 3600000)]);
  await ev(m3.id, tech.id, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', m3.starts);
  await doTasks(m3.id, tech.id, m3.starts);
  await ev(m3.id, tech.id, 'SUBMITTED', 'IN_PROGRESS', 'UNDER_REVIEW', new Date(m3.ends.getTime() - 15 * 60000));
  await tx.query(`INSERT INTO anomaly(id,intervention_id,zone_id,title,description,status,resolution,created_by,created_at) VALUES($1,$2,$3,$4,$5,'RESOLUTION_PROPOSED',$6,$7,$8)`,
   [randomUUID(), m3.id, zones['EQ-FOU1'], 'Joint de la porte de sortie usé', 'Perte de chaleur mesurée en sortie de four.', 'Joint commandé, remplacement proposé lors de l’arrêt du mois prochain.', tech.id, new Date(m3.ends.getTime() - 60 * 60000)]);
  await ev(m3.id, tech.id, 'ANOMALY_REPORTED', 'IN_PROGRESS', 'IN_PROGRESS', new Date(m3.ends.getTime() - 60 * 60000), 'Joint de la porte de sortie usé');
  await ev(m3.id, controller, 'ACCEPTED', 'UNDER_REVIEW', 'ACCEPTED', new Date(m3.ends.getTime() + 20 * 3600000), 'Révision acceptée. L’anomalie du joint reste ouverte jusqu’à son remplacement.');

  const m4 = await maintenance({ title: 'Contrôle d’étanchéité de la chambre froide négative', description: 'Givre anormal autour de la porte.', zones: ['CF-NEG'],
   tasks: ['Contrôle des joints et de la résistance de porte', 'Recherche de fuite de fluide frigorigène', 'Relevé des températures sur 2 h'], day: -9, from: '09:00', to: '12:00', quote: false, createdDays: 12 });
  await crew(m4.id, new Date(Date.now() - 11 * DAY));
  await setStatus(m4.id, 'ACCEPTED', ',started_at=$3,submitted_at=$4,submitted_by=$5,report_note=$6,accepted_at=$7',
   [m4.starts, m4.ends, tech.id, 'Résistance de porte défectueuse remplacée. Pas de fuite de fluide.', new Date(m4.ends.getTime() + 4 * 3600000)]);
  await ev(m4.id, tech.id, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', m4.starts);
  await doTasks(m4.id, tech.id, m4.starts);
  await ev(m4.id, tech.id, 'SUBMITTED', 'IN_PROGRESS', 'UNDER_REVIEW', m4.ends);
  await tx.query(`INSERT INTO anomaly(id,intervention_id,zone_id,title,description,status,resolution,closing_note,created_by,created_at,closed_by,closed_at) VALUES($1,$2,$3,$4,$5,'CLOSED',$6,$7,$8,$9,$10,$11)`,
   [randomUUID(), m4.id, zones['CF-NEG'], 'Résistance de porte hors service', 'Givre sur le cadre de porte.', 'Résistance remplacée pendant l’intervention.', 'Plus de givre constaté après 48 h.', tech.id, m4.starts, controller, new Date(m4.ends.getTime() + 2 * DAY)]);
  await ev(m4.id, controller, 'ACCEPTED', 'UNDER_REVIEW', 'ACCEPTED', new Date(m4.ends.getTime() + 4 * 3600000), 'Intervention acceptée.');
  await ev(m4.id, controller, 'ANOMALY_CLOSED', 'ACCEPTED', 'ACCEPTED', new Date(m4.ends.getTime() + 2 * DAY), 'Résistance de porte hors service — plus de givre après 48 h.');

  const m5 = await maintenance({ title: 'Étalonnage des sondes de température — cuisson', description: 'Étalonnage annuel exigé par le plan HACCP.', zones: ['ZN-CUI', 'EQ-FOU1'],
   tasks: ['Comparaison des sondes avec l’étalon de référence', 'Ajustement des écarts supérieurs à 0,5 °C', 'Rédaction du certificat d’étalonnage'], day: 2, from: '10:00', to: '13:00', quote: false, createdDays: 3 });
  await crew(m5.id, new Date(Date.now() - 2 * DAY)); await setStatus(m5.id, 'ASSIGNED');

  await tx.query("INSERT INTO access_audit(id,actor_id,action,target_id,reason) VALUES($1,$2,'LOCAL_DEMO_INITIALIZED',$3,'Données fictives AFISA Food Industry pour la présentation')", [randomUUID(), admin, site]);
 });
 return accounts.map(({ login, password, role }) => ({ login, password, role }));
}
