/** Domain policy only. Actors must eventually come from authenticated server-side
 * memberships, never from request bodies. Persistence must recheck under a transaction. */
export type Role = 'CLIENT_MANAGER' | 'CLIENT_CONTROLLER' | 'PROVIDER_MANAGER' | 'FIELD_AGENT' | 'PLATFORM_ADMIN';
export type Status = 'DRAFT' | 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'BLOCKED' | 'UNDER_REVIEW' | 'REWORK' | 'VALIDATED' | 'CANCELLED';
export interface Actor {
  userId: string;
  role: Role;
  organizationId: string;
  siteIds: readonly string[];
  active: boolean;
}
export interface Intervention {
  clientId: string;
  providerId: string;
  siteId: string;
  status: Status;
  assignedUserIds: readonly string[];
  leadUserId: string;
  submittedBy?: string;
  startedAt?: string;
  submittedAt?: string;
  version: number;
}
export type Action = 'CREATE' | 'ASSIGN' | 'START' | 'SUBMIT' | 'VALIDATE' | 'REQUEST_REWORK' | 'REQUEST_RESCHEDULE' | 'CONFIRM_RESCHEDULE' | 'REQUEST_CANCEL' | 'CANCEL';
export class PolicyError extends Error {
  constructor(readonly code: 'FORBIDDEN' | 'CONFLICT' | 'INVALID_STATE' | 'REASON_REQUIRED') { super(code); }
}
const deny = () => { throw new PolicyError('FORBIDDEN'); };

export function authorize(actor: Actor, item: Intervention, action: Action, reason?: string): void {
  if (!actor.active) deny();
  if (actor.role === 'PLATFORM_ADMIN') {
    // Admin may intervene for a client, but cannot impersonate field contributors.
    if (['START', 'SUBMIT'].includes(action)) deny();
    if (!reason?.trim()) throw new PolicyError('REASON_REQUIRED');
  } else {
    if (!actor.siteIds.includes(item.siteId)) deny();
    const client = actor.organizationId === item.clientId;
    const provider = actor.organizationId === item.providerId;
    const allowed = {
      CREATE: client && actor.role === 'CLIENT_MANAGER',
      ASSIGN: provider && actor.role === 'PROVIDER_MANAGER',
      START: provider && actor.role === 'FIELD_AGENT' && item.assignedUserIds.includes(actor.userId),
      SUBMIT: provider && actor.role === 'FIELD_AGENT' && item.assignedUserIds.includes(actor.userId) && item.leadUserId === actor.userId,
      VALIDATE: client && actor.role === 'CLIENT_CONTROLLER',
      REQUEST_REWORK: client && actor.role === 'CLIENT_CONTROLLER',
      REQUEST_RESCHEDULE: provider && actor.role === 'PROVIDER_MANAGER',
      CONFIRM_RESCHEDULE: client && actor.role === 'CLIENT_MANAGER',
      REQUEST_CANCEL: provider && actor.role === 'PROVIDER_MANAGER',
      CANCEL: client && actor.role === 'CLIENT_MANAGER',
    }[action];
    if (!allowed) deny();
  }
  if (['VALIDATE', 'REQUEST_REWORK'].includes(action) && actor.userId === item.submittedBy) deny();
}

/** This function returns an intended state only; it does not persist or claim an audit. */
export function nextStatus(actor: Actor, item: Intervention, action: Action, expectedVersion: number, reason?: string): Status {
  authorize(actor, item, action, reason);
  if (expectedVersion !== item.version) throw new PolicyError('CONFLICT');
  const invalid = () => { throw new PolicyError('INVALID_STATE'); };
  if (['REQUEST_REWORK', 'REQUEST_CANCEL', 'CANCEL', 'REQUEST_RESCHEDULE', 'CONFIRM_RESCHEDULE'].includes(action) && !reason?.trim()) {
    throw new PolicyError('REASON_REQUIRED');
  }
  switch (action) {
    case 'CREATE': return item.status === 'DRAFT' ? 'DRAFT' : invalid();
    case 'ASSIGN': return ['PLANNED', 'ASSIGNED'].includes(item.status) ? 'ASSIGNED' : invalid();
    case 'START': return item.status === 'ASSIGNED' ? 'IN_PROGRESS' : invalid();
    case 'SUBMIT': return ['IN_PROGRESS', 'REWORK'].includes(item.status) ? 'UNDER_REVIEW' : invalid();
    case 'VALIDATE': return item.status === 'UNDER_REVIEW' ? 'VALIDATED' : invalid();
    case 'REQUEST_REWORK': return item.status === 'UNDER_REVIEW' ? 'REWORK' : invalid();
    case 'REQUEST_RESCHEDULE':
    case 'CONFIRM_RESCHEDULE':
      return !item.startedAt && ['PLANNED', 'ASSIGNED'].includes(item.status) ? item.status : invalid();
    case 'REQUEST_CANCEL':
    case 'CANCEL':
      if (item.submittedAt || !['DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED'].includes(item.status)) return invalid();
      return action === 'CANCEL' ? 'CANCELLED' : item.status;
  }
}

export function overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  for (const interval of [a, b]) {
    if (!Number.isFinite(interval.start.getTime()) || !Number.isFinite(interval.end.getTime()) || interval.start >= interval.end) {
      throw new RangeError('Invalid interval');
    }
  }
  return a.start < b.end && b.start < a.end;
}
