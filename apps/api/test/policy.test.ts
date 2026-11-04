import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Actor, Intervention, authorize, nextStatus, overlaps, PolicyError } from '../src/domain/intervention-policy.js';

const client: Actor = { userId: 'client-user', organizationId: 'client', role: 'CLIENT_MANAGER', siteIds: ['site'], active: true };
const provider: Actor = { ...client, userId: 'provider-user', organizationId: 'provider', role: 'PROVIDER_MANAGER' };
const agent: Actor = { ...provider, userId: 'agent', role: 'FIELD_AGENT' };
const controller: Actor = { ...client, role: 'CLIENT_CONTROLLER' };
const admin: Actor = { ...client, userId: 'owner', role: 'PLATFORM_ADMIN', siteIds: [] };
const mission: Intervention = { clientId: 'client', providerId: 'provider', siteId: 'site', status: 'DRAFT', assignedUserIds: ['agent', 'helper'], leadUserId: 'agent', version: 1 };
const error = (code: string) => (e: unknown) => e instanceof PolicyError && e.code === code;

test('only client in the correct organization and site creates', () => {
  authorize(client, mission, 'CREATE');
  for (const actor of [provider, agent, { ...client, organizationId: 'other' }, { ...client, siteIds: [] }, { ...client, active: false }]) {
    assert.throws(() => authorize(actor, mission, 'CREATE'), error('FORBIDDEN'));
  }
});
test('provider assigns, contributors start, only the lead submits', () => {
  assert.equal(nextStatus(provider, { ...mission, status: 'PLANNED' }, 'ASSIGN', 1), 'ASSIGNED');
  assert.equal(nextStatus({ ...agent, userId: 'helper' }, { ...mission, status: 'ASSIGNED' }, 'START', 1), 'IN_PROGRESS');
  assert.throws(() => authorize({ ...agent, userId: 'helper' }, mission, 'SUBMIT'), error('FORBIDDEN'));
  assert.equal(nextStatus(agent, { ...mission, status: 'IN_PROGRESS' }, 'SUBMIT', 1), 'UNDER_REVIEW');
});
test('client controls directly; provider and submitter cannot validate', () => {
  const submitted = { ...mission, status: 'UNDER_REVIEW' as const, submittedBy: 'agent' };
  assert.equal(nextStatus(controller, submitted, 'VALIDATE', 1), 'VALIDATED');
  assert.throws(() => nextStatus(provider, submitted, 'VALIDATE', 1), error('FORBIDDEN'));
  assert.throws(() => nextStatus({ ...controller, userId: 'agent' }, submitted, 'VALIDATE', 1), error('FORBIDDEN'));
});
test('administrative exception requires reason and preserves self-review rule', () => {
  assert.throws(() => authorize(admin, mission, 'CREATE'), error('REASON_REQUIRED'));
  authorize(admin, mission, 'CREATE', 'Client assistance');
  assert.throws(() => authorize(admin, mission, 'SUBMIT', 'Assistance'), error('FORBIDDEN'));
  assert.throws(() => authorize(admin, { ...mission, submittedBy: admin.userId }, 'VALIDATE', 'Assistance'), error('FORBIDDEN'));
});
test('stale version and terminal state prevent another decision', () => {
  assert.throws(() => nextStatus(controller, { ...mission, status: 'UNDER_REVIEW' }, 'VALIDATE', 0), error('CONFLICT'));
  assert.throws(() => nextStatus(controller, { ...mission, status: 'VALIDATED' }, 'VALIDATE', 1), error('INVALID_STATE'));
});
test('change requests do not change status and rescheduling stops at start', () => {
  const assigned = { ...mission, status: 'ASSIGNED' as const };
  assert.equal(nextStatus(provider, assigned, 'REQUEST_CANCEL', 1, 'Cannot attend'), 'ASSIGNED');
  assert.equal(nextStatus(provider, assigned, 'REQUEST_RESCHEDULE', 1, 'Unavailable'), 'ASSIGNED');
  assert.throws(() => nextStatus(provider, { ...assigned, startedAt: '2026-11-03T10:00:00Z' }, 'REQUEST_RESCHEDULE', 1, 'Unavailable'), error('INVALID_STATE'));
  assert.throws(() => nextStatus(provider, assigned, 'CANCEL', 1, 'Unavailable'), error('FORBIDDEN'));
});
test('client cancels in progress but not after submission', () => {
  assert.equal(nextStatus(client, { ...mission, status: 'IN_PROGRESS' }, 'CANCEL', 1, 'Client request'), 'CANCELLED');
  assert.throws(() => nextStatus(client, { ...mission, status: 'REWORK', submittedAt: '2026-11-03T10:00:00Z' }, 'CANCEL', 1, 'Client request'), error('INVALID_STATE'));
});
test('rework requires a reason and can be resubmitted', () => {
  assert.throws(() => nextStatus(controller, { ...mission, status: 'UNDER_REVIEW' }, 'REQUEST_REWORK', 1), error('REASON_REQUIRED'));
  assert.equal(nextStatus(controller, { ...mission, status: 'UNDER_REVIEW' }, 'REQUEST_REWORK', 1, 'Clean room 2'), 'REWORK');
  assert.equal(nextStatus(agent, { ...mission, status: 'REWORK' }, 'SUBMIT', 1), 'UNDER_REVIEW');
});
test('half-open intervals reject overlap but allow adjacent missions', () => {
  const interval = (start: number, end: number) => ({ start: new Date(start), end: new Date(end) });
  assert.equal(overlaps(interval(0, 10), interval(9, 20)), true);
  assert.equal(overlaps(interval(0, 10), interval(10, 20)), false);
  assert.equal(overlaps(interval(0, 10), interval(2, 5)), true);
  assert.throws(() => overlaps(interval(10, 0), interval(0, 10)), RangeError);
  assert.throws(() => overlaps(interval(NaN, 10), interval(0, 10)), RangeError);
});
