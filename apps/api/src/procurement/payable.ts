import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';

export const TZ = 'Africa/Douala';
export const DEFAULT_TERMS_DAYS = 30;

/** Today's date in Douala, "YYYY-MM-DD". */
export const siteToday = (at = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at));
/** A calendar date shifted by a number of days. */
export const addDays = (date: string, days: number) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);

/**
 * An accepted service becomes payable: the due date is the acceptance day plus the payment terms.
 * Acceptance and payment stay two separate facts; a service accepted twice is never payable twice.
 */
export async function recordPayable(tx: PoolClient, p: { client: string; provider: string; delivery?: string; intervention?: string; label: string; amount: number | string; terms: number; acceptedAt?: Date }) {
  const accepted = p.acceptedAt ?? new Date();
  await tx.query(`INSERT INTO payment(id,client_id,provider_id,delivery_id,intervention_id,label,amount_xaf,accepted_at,terms_days,due_date)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
    [randomUUID(), p.client, p.provider, p.delivery ?? null, p.intervention ?? null, p.label, p.amount, accepted, p.terms, addDays(siteToday(accepted.getTime()), p.terms)]);
}
