import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { PoolClient } from 'pg';
import { Database } from './database.module.js';
import { localInstant } from './interventions/interventions.controller.js';
import { addDays, siteToday } from './procurement/payable.js';

/*
 * Local demo: earlier plannings imported from Gantt files, the sites' check-in QR codes and two weeks of the agents'
 * arrivals, departures and absences. Fictitious Cameroonian companies, like the rest of the catalogue.
 */

const TZ = 'Africa/Douala';
const dayOf = (offset: number) => addDays(siteToday(), offset);
const at = (offset: number, time = '10:00') => localInstant(dayOf(offset), time, TZ);
const monthOf = (date: string) => new Date(date + 'T12:00:00Z').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
/** A stable number in [0, 1) drawn from a text: the demo comes out the same each time it is rebuilt. */
const chance = (key: string) => { let h = 2166136261; for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; };

type Task = [level: number, name: string, start: number, end: number, progress: number, resource?: string | null, predecessors?: string | null, milestone?: boolean];
const ABSENCES = ['Maladie — certificat médical transmis', 'Raison familiale — deuil au village', 'Problème de transport — route de Bonabéri coupée', 'Maladie — paludisme, arrêt de deux jours', 'Raison familiale — enfant hospitalisé'];

/** Where the agents check in, by kind of site. */
const pointLabel = (site: string) => /Usine|Dépôt|Plateforme/.test(site) ? 'Poste de garde — entrée du personnel'
  : /Hôpital|Polyclinique/.test(site) ? 'Entrée du personnel — sous-sol'
  : /Laboratoire/.test(site) ? 'Sas du personnel — rez-de-chaussée'
  : /Hôtel|Resort/.test(site) ? 'Entrée de service — côté cuisines'
  : /Cuisine/.test(site) ? 'Vestiaires du personnel'
  : /Hypermarché/.test(site) ? 'Accès livraisons et personnel'
  : /Tour|Siège/.test(site) ? 'Loge de sécurité — hall principal'
  : /Campus/.test(site) ? 'Loge du gardien — portail principal'
  : /Data Center/.test(site) ? 'Sas d’accès sécurisé'
  : 'Accueil du personnel';

export async function seedPlanning(tx: PoolClient, actor: string) {
  const one = async <T>(sql: string, values: unknown[] = []) => (await tx.query(sql, values)).rows[0] as T | undefined;
  const orgId = async (name: string, kind: 'CLIENT' | 'PROVIDER') => (await one<{ id: string }>('SELECT id FROM organization WHERE lower(name)=lower($1) AND kind=$2 ORDER BY id LIMIT 1', [name, kind]))?.id ?? null;
  const userId = async (login: string) => (await one<{ id: string }>('SELECT id FROM app_user WHERE lower(login)=$1', [login]))?.id ?? null;
  const done = { plans: 0, points: 0, records: 0, absences: 0 };
  void actor;

  /* 1. Earlier plannings, imported from the files the teams already kept (MS Project, GanttProject, Excel). */
  const addPlan = async (p: { org: string | null; by: string | null; title: string; source: string; format: string; site?: string | null; contract?: string | null; created: Date; tasks: Task[] }) => {
    if (!p.org || !p.by || await one('SELECT 1 FROM plan WHERE organization_id=$1 AND title=$2', [p.org, p.title])) return;
    const id = randomUUID();
    await tx.query('INSERT INTO plan(id,organization_id,contract_id,site_id,title,source,format,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, p.org, p.contract ?? null, p.site ?? null, p.title, p.source, p.format, p.by, p.created]);
    for (const [i, [level, name, start, end, progress, resource, predecessors, milestone]] of p.tasks.entries())
      await tx.query('INSERT INTO plan_task(id,plan_id,position,level,name,start_date,end_date,progress,milestone,resource,predecessors) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [randomUUID(), id, i + 1, level, name, dayOf(start), dayOf(Math.max(start, end)), progress, milestone ?? false, resource ?? null, predecessors ?? null]);
    done.plans++;
  };
  const afisa = await orgId('AFISA Food Industry', 'CLIENT'), ebode = await userId('c.ebode');
  const usine = afisa ? (await one<{ id: string }>('SELECT id FROM site WHERE client_id=$1 AND name=$2', [afisa, 'Usine de Bonabéri']))?.id ?? null : null;
  const shutdown = 22;
  await addPlan({ org: afisa, by: ebode, site: usine, format: 'MSPROJECT_XML', source: 'Arret_technique_Bonaberi.xml', created: at(-3, '15:40'),
    title: `Arrêt technique annuel de l’usine — ${monthOf(dayOf(shutdown))}`,
    tasks: [
      [0, 'Arrêt technique annuel de l’usine', shutdown, shutdown + 12, 0],
      [1, 'Arrêt et consignation des lignes L1 à L3', shutdown, shutdown, 0, 'Service maintenance AFISA'],
      [1, 'Vidange et nettoyage des fours tunnel', shutdown + 1, shutdown + 3, 0, 'Bleu Azur Nettoyage Industriel', '2'],
      [1, 'Révision du groupe frigorifique et des chambres froides', shutdown + 1, shutdown + 4, 0, 'Arctica Froid & Climatisation', '2'],
      [1, 'Remplacement des roulements des convoyeurs', shutdown + 4, shutdown + 7, 0, 'MécaTech Industrie', '3'],
      [1, 'Contrôle des armoires électriques et thermographie', shutdown + 5, shutdown + 6, 0, 'Ampère & Fluides Services', '2'],
      [1, 'Nettoyage approfondi et désinfection des zones de production', shutdown + 8, shutdown + 10, 0, 'Hygiène Plus Services', '5;6'],
      [1, 'Prélèvements de surface et levée des consignations', shutdown + 11, shutdown + 11, 0, 'Service qualité AFISA', '7'],
      [1, 'Redémarrage des lignes', shutdown + 12, shutdown + 12, 0, 'Service production AFISA', '8', true],
    ] });
  await addPlan({ org: afisa, by: ebode, site: usine, format: 'GANTTPROJECT', source: 'HACCP_ligne_biscuits.gan', created: at(-64, '10:05'),
    title: 'Mise en conformité HACCP de la ligne biscuits — phase 1',
    tasks: [
      [0, 'Mise en conformité HACCP — ligne biscuits', -60, 25, 58],
      [1, 'Audit initial et analyse des dangers', -60, -46, 100, 'Cabinet Qualis Cameroun'],
      [1, 'Plan de nettoyage et de désinfection par zone', -45, -31, 100, 'Hygiène Plus Services', '2'],
      [1, 'Remplacement des siphons et caniveaux en inox', -30, -9, 100, 'Sotrabat Littoral', '3'],
      [1, 'Formation des opérateurs aux bonnes pratiques d’hygiène', -12, 4, 60, 'Service qualité AFISA', '3'],
      [1, 'Mise en place des contrôles ATP hebdomadaires', 0, 14, 10, 'Bleu Azur Nettoyage Industriel', '4'],
      [1, 'Audit de certification à blanc', 20, 24, 0, 'Cabinet Qualis Cameroun', '5;6'],
      [1, 'Validation du plan de maîtrise sanitaire', 25, 25, 0, 'Direction qualité AFISA', '7', true],
    ] });
  // The provider's own maintenance planning, attached to its contract: the client sees it in its Gantt too.
  const ampere = await orgId('Ampère & Fluides Services', 'PROVIDER');
  const ge = ampere ? await one<{ id: string; site_id: string | null; s: number; e: number }>(`SELECT id,site_id,(start_date-$1::date)::int AS s,(planned_end_date-$1::date)::int AS e FROM contract
      WHERE provider_id=$2 AND title=$3 AND status IN ('ACTIVE','CLOSED')`, [siteToday(), ampere, 'Maintenance des groupes électrogènes et de l’onduleur du bloc opératoire']) : undefined;
  if (ge) {
    const visits: Task[] = [];
    for (let k = 0; k < 6; k++) { const d = ge.s + 12 + 30 * k; if (d <= ge.e - 3) visits.push([1, `Visite préventive n° ${k + 1} — groupes 1 et 2 (vidange, filtres, batteries)`, d, d, d < 0 ? 100 : 0, 'Ampère & Fluides Services', k ? String(k + 1) : null]); }
    const more: Task[] = [
      [1, 'Remplacement des batteries de l’onduleur 40 kVA', ge.s + 70, ge.s + 71, ge.s + 71 < 0 ? 100 : 0, 'Ampère & Fluides Services'],
      [1, 'Essai de basculement en charge réelle', ge.s + 90, ge.s + 90, ge.s + 90 < 0 ? 100 : 0, 'Ampère & Fluides Services ; service biomédical Wouri Santé'],
      [1, 'Essai de basculement en charge réelle', ge.s + 165, ge.s + 165, ge.s + 165 < 0 ? 100 : 0, 'Ampère & Fluides Services ; service biomédical Wouri Santé'],
      [1, 'Rapport semestriel et préconisations', ge.e - 2, ge.e - 2, 0, 'Ampère & Fluides Services', null, true],
    ];
    const tasks = [...visits, ...more].filter(x => x[2] <= ge.e);
    const progress = Math.round((tasks.filter(x => x[4] === 100).length / tasks.length) * 100);
    await addPlan({ org: ampere, by: await userId('d.nguele'), contract: ge.id, site: ge.site_id, format: 'CSV', source: 'Maintenance_GE_Wouri_S2.csv', created: at(ge.s + 2, '17:20'),
      title: 'Plan de maintenance des groupes électrogènes — second semestre', tasks: [[0, 'Groupes électrogènes et onduleur du bloc opératoire', ge.s, ge.e, progress], ...tasks] });
  }

  /* 2. One check-in QR code per site where agents worked these last two weeks, printed by the client. */
  const sites = (await tx.query(`SELECT s.id,s.name,s.client_id,
      (SELECT m.user_id FROM membership m JOIN membership_role r ON r.membership_id=m.id JOIN app_user u ON u.id=m.user_id
        WHERE m.organization_id=s.client_id AND m.active AND r.role='CLIENT_MANAGER' ORDER BY u.created_at,u.id LIMIT 1) AS manager
    FROM site s WHERE EXISTS (SELECT 1 FROM intervention i JOIN intervention_agent ag ON ag.intervention_id=i.id WHERE i.site_id=s.id AND i.starts_at>now()-interval '15 days' AND i.starts_at<now())
      AND NOT EXISTS (SELECT 1 FROM attendance_point p WHERE p.site_id=s.id) ORDER BY s.name`)).rows as { id: string; name: string; client_id: string; manager: string | null }[];
  const startOfToday = localInstant(siteToday(), '00:00', TZ).getTime(), now = Date.now();
  for (const site of sites) {
    if (!site.manager) continue;
    const point = randomUUID();
    await tx.query('INSERT INTO attendance_point(id,client_id,site_id,label,token,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [point, site.client_id, site.id, pointLabel(site.name), randomBytes(16).toString('hex'), site.manager, at(-15, '07:30')]);
    done.points++;

    /* 3. The agents' check-ins: on time for most, a few late, a forgotten departure now and then, and declared absences. */
    const crew = (await tx.query(`SELECT i.id,i.starts_at,i.ends_at,i.provider_id,ag.membership_id,ag.lead,m.user_id FROM intervention i
        JOIN intervention_agent ag ON ag.intervention_id=i.id JOIN membership m ON m.id=ag.membership_id
      WHERE i.site_id=$1 AND i.starts_at>now()-interval '14 days' AND i.starts_at<now() AND i.status IN ('ASSIGNED','IN_PROGRESS','UNDER_REVIEW','ACCEPTED','REWORK')
      ORDER BY i.starts_at`, [site.id])).rows as { id: string; starts_at: Date; ends_at: Date; provider_id: string; membership_id: string; lead: boolean; user_id: string }[];
    for (const x of crew) {
      const r = chance(x.id + x.membership_id), start = x.starts_at.getTime(), end = x.ends_at.getTime();
      const row = (kind: 'IN' | 'OUT' | 'ABSENT', when: number, reason: string | null, from: string | null) => tx.query(
        'INSERT INTO attendance(id,point_id,client_id,site_id,provider_id,membership_id,user_id,intervention_id,kind,at,reason,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$10)',
        [randomUUID(), from, site.client_id, site.id, x.provider_id, x.membership_id, x.user_id, x.id, kind, new Date(when), reason]);
      if (!x.lead && r < 0.03) {
        // Declared from the phone one to two hours before the mission; the team lead carried on with the rest of the crew.
        const when = start - (60 + Math.round(r * 3000)) * 60000, reason = ABSENCES[Math.floor(r * 1000) % ABSENCES.length]!;
        await row('ABSENT', when, reason, null);
        await tx.query(`INSERT INTO intervention_event(id,intervention_id,actor_id,action,from_status,to_status,reason,created_at) SELECT $1,$2,$3,'ABSENCE_DECLARED',status,status,$4,$5 FROM intervention WHERE id=$2`,
          [randomUUID(), x.id, x.user_id, reason, new Date(when)]);
        done.absences++;
        continue;
      }
      const late = !x.lead && r > 0.91 ? 14 + Math.round((r - 0.91) * 222) : 0;
      const arrive = start + (late || (-12 + (Math.round(r * 160) % 16))) * 60000;
      if (arrive > now) continue;
      await row('IN', arrive, null, point); done.records++;
      const leave = end + (Math.round(r * 997) % 19) * 60000, forgot = r > 0.86 && r < 0.885 && end < startOfToday;
      if (leave < now && !forgot) { await row('OUT', leave, null, point); done.records++; }
    }
  }
  return done;
}

/* Standalone run, inside its own transaction: node dist/src/demo-planning.js */
async function main() {
  if (process.env.TRACEOPS_DEMO !== 'local-only' || process.env.NODE_ENV !== 'development') throw new Error('LOCAL_DEMO_DISABLED');
  const db = new Database();
  try {
    const n = await db.transaction(async tx => {
      await tx.query("SET LOCAL statement_timeout = '600s'");
      await tx.query('SELECT pg_advisory_xact_lock(728137)');
      const actor = (await tx.query('SELECT user_id AS id FROM platform_admin ORDER BY user_id LIMIT 1')).rows[0]?.id ?? (await tx.query('SELECT id FROM app_user ORDER BY created_at LIMIT 1')).rows[0]?.id;
      if (!actor) throw new Error('NO_ACCOUNT_TO_RECORD_CHANGES');
      return seedPlanning(tx, actor);
    });
    process.stdout.write(`Plannings importés : ${n.plans} · QR codes : ${n.points} · pointages : ${n.records} · absences : ${n.absences}\n`);
  } finally { await db.onApplicationShutdown(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  process.stderr.write(`Données de planning et de pointage refusées : ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
