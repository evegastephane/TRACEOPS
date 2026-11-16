import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnswers, cleanCriteria, cleanFields, cleanSections, cleanValue, library } from '../src/procurement/forms.js';

test('every library form is valid: unique keys, award weights totalling 100, computed price, quality criteria', () => {
  assert.equal(new Set(library.map(t => t.serviceType)).size, library.length);
  for (const t of library) {
    assert.doesNotThrow(() => cleanSections(t.sections, false), t.id);
    assert.doesNotThrow(() => cleanFields(t.questions, false), t.id);
    assert.doesNotThrow(() => cleanCriteria(t.criteria), t.id);
    assert.equal(t.criteria.reduce((s, c) => s + c.weight, 0), 100, t.id);
    assert.equal(t.criteria.filter(c => c.auto === 'price').length, 1, t.id);
    assert.ok(t.qualityCriteria.length >= 5, t.id);
    assert.ok(t.questions.some(q => q.key === 'references' && q.required), t.id);
  }
});

test('a field value is checked against its type, empty values become null', () => {
  assert.equal(cleanValue({ type: 'number' }, '3 850,5'), 3850.5);
  assert.throws(() => cleanValue({ type: 'number' }, 'beaucoup'), /INVALID_VALUE/);
  assert.equal(cleanValue({ type: 'yesno' }, false), false);
  assert.throws(() => cleanValue({ type: 'yesno' }, 'oui'), /INVALID_VALUE/);
  assert.equal(cleanValue({ type: 'choice', options: ['Mensuelle', 'Trimestrielle'] }, 'Mensuelle'), 'Mensuelle');
  assert.throws(() => cleanValue({ type: 'choice', options: ['Mensuelle'] }, 'Annuelle'), /INVALID_VALUE/);
  assert.deepEqual(cleanValue({ type: 'multi', options: ['A', 'B'] }, ['A', 'A', 'B']), ['A', 'B']);
  assert.throws(() => cleanValue({ type: 'date' }, '15/11/2026'), /INVALID_VALUE/);
  assert.equal(cleanValue({ type: 'text' }, ''), null);
  assert.equal(cleanValue({ type: 'multi', options: ['A'] }, []), null);
});

test('forms refuse duplicate keys, blank names and choice fields without options', () => {
  const field = { key: 'surface', label: 'Surface', type: 'number' };
  assert.throws(() => cleanSections([{ key: 'a', title: 'A', fields: [field] }, { key: 'b', title: 'B', fields: [field] }], false), /DUPLICATE_KEY/);
  assert.throws(() => cleanSections([{ key: 'a', title: '  ', fields: [] }], false), /INVALID_FORM/);
  assert.throws(() => cleanFields([{ key: 'freq', label: 'Fréquence', type: 'choice', options: [] }], false), /OPTIONS_REQUIRED/);
  assert.throws(() => cleanFields([{ key: 'bad key!', label: 'X', type: 'text' }], false), /INVALID_FORM/);
});

test('award criteria total 100, with at most one computed price and one computed delay', () => {
  assert.throws(() => cleanCriteria([{ key: 'prix', label: 'Prix', weight: 60, auto: 'price' }]), /CRITERIA_WEIGHTS/);
  assert.throws(() => cleanCriteria([{ key: 'a', label: 'A', weight: 50, auto: 'price' }, { key: 'b', label: 'B', weight: 50, auto: 'price' }]), /INVALID_FORM/);
  assert.deepEqual(cleanCriteria([{ key: 'prix', label: 'Prix', weight: 40, auto: 'price' }, { key: 'tech', label: 'Valeur technique', weight: 60, auto: 'other' }]),
    [{ key: 'prix', label: 'Prix', weight: 40, auto: 'price' }, { key: 'tech', label: 'Valeur technique', weight: 60 }]);
  assert.deepEqual(cleanCriteria([]), []);
});

test('an offer only keeps the answers to the questions of the reply form', () => {
  const questions = cleanFields([{ key: 'effectif', label: 'Effectif', type: 'number', required: true }, { key: 'refs', label: 'Références', type: 'textarea' }], false);
  assert.deepEqual(cleanAnswers(questions, { effectif: '11', refs: '  Trois sites  ', intrus: 'ignoré' }), { effectif: 11, refs: 'Trois sites' });
  assert.throws(() => cleanAnswers(questions, { effectif: 'onze' }), /INVALID_VALUE/);
});
