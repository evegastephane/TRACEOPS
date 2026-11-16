import React, { useState } from 'react';
import type { Lang } from './i18n';
import { CheckIcon, DownIcon, PenIcon, PlusIcon, TrashIcon, UpIcon } from './icons';
import { allFieldKeys, fieldTypes, newKey, valueText, type Criterion, type Field, type FieldType, type FieldValue, type QualityCriterion, type Section } from './procurement-model';

/* Building and filling a tender form: sections and typed fields, the reply asked from providers,
   weighted award criteria and quality criteria. The same pieces edit a template (structure only)
   and a tender (values, with the structure adaptable section by section). */

const W = {
  fr: { yes: 'Oui', no: 'Non', edit: 'Modifier', done: 'Terminer', adapt: 'Adapter la rubrique', addField: 'Ajouter une information', addSection: 'Ajouter une rubrique',
    newField: 'Nouvelle information', newSection: 'Nouvelle rubrique', sectionName: 'Nom de la rubrique', fieldName: 'Nom de l’information', type: 'Type', unit: 'Unité', options: 'Options (une par ligne)',
    help: 'Aide (facultatif)', required: 'Obligatoire', up: 'Monter', down: 'Descendre', remove: 'Supprimer', removeSection: 'Supprimer la rubrique', emptySection: 'Aucune information dans cette rubrique.',
    criterion: 'Critère', weight: 'Pondération', total: 'Total', mustBe100: 'Le total doit faire 100 %.', addCriterion: 'Ajouter un critère', newCriterion: 'Nouveau critère',
    autoPrice: 'Calculé : le prix le plus bas obtient 10', autoDelay: 'Calculé : le délai le plus court obtient 10', manual: 'Noté de 0 à 10 par la commission',
    addPrice: 'Ajouter le critère du prix', addDelay: 'Ajouter le critère du délai', quality: 'Critère de qualité', addQuality: 'Ajouter un critère de qualité', newQuality: 'Nouveau critère de qualité',
    addQuestion: 'Ajouter une rubrique de réponse', newQuestion: 'Nouvelle rubrique de réponse', noQuestion: 'Aucune rubrique de réponse : seuls le montant, le délai, le contenu et les points forts seront demandés.' },
  en: { yes: 'Yes', no: 'No', edit: 'Edit', done: 'Done', adapt: 'Adapt the section', addField: 'Add a field', addSection: 'Add a section',
    newField: 'New field', newSection: 'New section', sectionName: 'Section name', fieldName: 'Field name', type: 'Type', unit: 'Unit', options: 'Options (one per line)',
    help: 'Help (optional)', required: 'Required', up: 'Move up', down: 'Move down', remove: 'Remove', removeSection: 'Remove the section', emptySection: 'No field in this section.',
    criterion: 'Criterion', weight: 'Weight', total: 'Total', mustBe100: 'The total must be 100%.', addCriterion: 'Add a criterion', newCriterion: 'New criterion',
    autoPrice: 'Computed: the lowest price gets 10', autoDelay: 'Computed: the shortest lead time gets 10', manual: 'Marked from 0 to 10 by the committee',
    addPrice: 'Add the price criterion', addDelay: 'Add the lead-time criterion', quality: 'Quality criterion', addQuality: 'Add a quality criterion', newQuality: 'New quality criterion',
    addQuestion: 'Add a reply item', newQuestion: 'New reply item', noQuestion: 'No reply item: only the amount, lead time, content and strengths will be asked.' },
};
type Words = typeof W.fr;
const move = <T,>(list: T[], i: number, d: -1 | 1) => { const next = [...list]; const j = i + d; if (j < 0 || j >= next.length) return list; [next[i], next[j]] = [next[j]!, next[i]!]; return next; };

/* ----------------------------------------------------------- filling a field */

export function FieldInput({ field, value, onChange, lang, id }: { field: Field; value: FieldValue | undefined; onChange: (v: FieldValue) => void; lang: Lang; id: string }) {
  const w = W[lang];
  const label = <><span className="fb-label">{field.label}{field.required && <><span className="req" aria-hidden="true"> *</span><span className="sr-only"> ({w.required.toLowerCase()})</span></>}</span>
    {field.help && <small>{field.help}</small>}</>;
  if (field.type === 'yesno') return <fieldset className="fb-input">
    <legend>{label}</legend>
    <span className="segmented yesno">{[true, false].map(v => <button type="button" key={String(v)} aria-pressed={value === v} onClick={() => onChange(value === v ? null : v)}>{v ? w.yes : w.no}</button>)}</span>
  </fieldset>;
  if (field.type === 'multi') {
    const list = Array.isArray(value) ? value : [];
    return <fieldset className="fb-input"><legend>{label}</legend>
      <span className="multi-chips">{(field.options ?? []).filter(Boolean).map(o => <label key={o} className="chip-check"><input type="checkbox" checked={list.includes(o)} onChange={e => onChange(e.target.checked ? [...list, o] : list.filter(x => x !== o))} /><span>{o}</span></label>)}</span>
    </fieldset>;
  }
  const str = value === null || value === undefined ? '' : String(value);
  return <label className="fb-input" htmlFor={id}>{label}
    {field.type === 'textarea' ? <textarea id={id} value={str} rows={3} maxLength={4000} required={field.required} onChange={e => onChange(e.target.value)} />
      : field.type === 'number' ? <span className="unit-input"><input id={id} type="number" step="any" inputMode="decimal" value={str} required={field.required} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} />{field.unit && <span className="unit">{field.unit}</span>}</span>
      : field.type === 'choice' ? <select id={id} value={str} required={field.required} onChange={e => onChange(e.target.value || null)}><option value="">—</option>{(field.options ?? []).filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}</select>
      : field.type === 'date' ? <input id={id} type="date" value={str} required={field.required} onChange={e => onChange(e.target.value || null)} />
      : <input id={id} value={str} maxLength={500} required={field.required} onChange={e => onChange(e.target.value)} />}
  </label>;
}

/** The field's description when only its structure matters (template editing). */
function FieldSummary({ field, lang }: { field: Field; lang: Lang }) {
  const w = W[lang];
  const meta = [fieldTypes[field.type][lang === 'fr' ? 0 : 1], field.unit, field.options?.filter(Boolean).length ? field.options.filter(Boolean).join(' · ') : '', field.required ? w.required.toLowerCase() : ''].filter(Boolean).join(' — ');
  return <div className="fb-summary"><strong>{field.label}</strong><span className="muted">{meta}</span>{field.help && <span className="fb-hint">{field.help}</span>}</div>;
}

function FieldEditor({ field, onChange, onRemove, onUp, onDown, lang }: { field: Field; onChange: (f: Field) => void; onRemove: () => void; onUp?: () => void; onDown?: () => void; lang: Lang }) {
  const w = W[lang];
  const setType = (type: FieldType) => {
    const next: Field = { ...field, type, value: null };
    if (type !== 'number') delete next.unit;
    if (type === 'choice' || type === 'multi') next.options = field.options?.length ? field.options : [''];
    else delete next.options;
    onChange(next);
  };
  return <div className="fb-edit">
    <label>{w.fieldName}<input value={field.label} maxLength={200} required onChange={e => onChange({ ...field, label: e.target.value })} /></label>
    <div className="form-row">
      <label>{w.type}<select value={field.type} onChange={e => setType(e.target.value as FieldType)}>{(Object.keys(fieldTypes) as FieldType[]).map(k => <option key={k} value={k}>{fieldTypes[k][lang === 'fr' ? 0 : 1]}</option>)}</select></label>
      {field.type === 'number' ? <label>{w.unit}<input value={field.unit ?? ''} maxLength={30} placeholder="m², heures, agents…" onChange={e => onChange({ ...field, unit: e.target.value || undefined })} /></label> : <span />}
    </div>
    {(field.type === 'choice' || field.type === 'multi') && <label>{w.options}<textarea rows={4} value={(field.options ?? []).join('\n')} onChange={e => onChange({ ...field, options: e.target.value.split('\n'), value: null })} /></label>}
    <label>{w.help}<input value={field.help ?? ''} maxLength={300} onChange={e => onChange({ ...field, help: e.target.value || undefined })} /></label>
    <div className="fb-edit-foot">
      <label className="check inline"><input type="checkbox" checked={Boolean(field.required)} onChange={e => onChange({ ...field, required: e.target.checked || undefined })} /><span><strong>{w.required}</strong></span></label>
      <span className="fb-tools">
        <button type="button" className="icon-button" aria-label={w.up} title={w.up} disabled={!onUp} onClick={onUp}><UpIcon /></button>
        <button type="button" className="icon-button" aria-label={w.down} title={w.down} disabled={!onDown} onClick={onDown}><DownIcon /></button>
        <button type="button" className="icon-button danger-icon" aria-label={`${w.remove} : ${field.label}`} title={w.remove} onClick={onRemove}><TrashIcon /></button>
      </span>
    </div>
  </div>;
}

/** A list of fields: filled (with values) or described (structure), each one editable in place. */
function FieldList({ fields, onChange, withValues, structure, lang, idPrefix, taken, addLabel, newLabel }: {
  fields: Field[]; onChange: (f: Field[]) => void; withValues: boolean; structure: boolean; lang: Lang; idPrefix: string; taken: () => string[]; addLabel: string; newLabel: string;
}) {
  const w = W[lang];
  const [editing, setEditing] = useState<string | null>(null);
  const set = (k: number, f: Field) => onChange(fields.map((x, j) => j === k ? f : x));
  return <>
    <ul className="fb-fields">{fields.map((f, k) => <li key={f.key} className={editing === f.key ? 'fb-item is-editing' : 'fb-item'}>
      <div className="fb-line">
        {withValues ? <FieldInput field={f} value={f.value} lang={lang} id={`${idPrefix}-${f.key}`} onChange={v => set(k, { ...f, value: v })} /> : <FieldSummary field={f} lang={lang} />}
        {structure && <button type="button" className={editing === f.key ? 'icon-button is-on' : 'icon-button'} aria-expanded={editing === f.key} aria-label={`${w.edit} : ${f.label}`} title={w.edit}
          onClick={() => setEditing(editing === f.key ? null : f.key)}>{editing === f.key ? <CheckIcon /> : <PenIcon />}</button>}
      </div>
      {structure && editing === f.key && <FieldEditor field={f} lang={lang} onChange={nf => set(k, nf)} onRemove={() => { onChange(fields.filter((_, j) => j !== k)); setEditing(null); }}
        onUp={k > 0 ? () => onChange(move(fields, k, -1)) : undefined} onDown={k < fields.length - 1 ? () => onChange(move(fields, k, 1)) : undefined} />}
    </li>)}</ul>
    {structure && <button type="button" className="secondary small fb-add" onClick={() => { const key = newKey(newLabel, taken()); onChange([...fields, { key, label: newLabel, type: 'text', ...(withValues ? { value: null } : {}) }]); setEditing(key); }}><PlusIcon />{addLabel}</button>}
  </>;
}

export function SectionsEditor({ sections, onChange, withValues, lang }: { sections: Section[]; onChange: (s: Section[]) => void; withValues: boolean; lang: Lang }) {
  const w = W[lang];
  const [adapt, setAdapt] = useState<Record<string, boolean>>({});
  const set = (i: number, s: Section) => onChange(sections.map((x, j) => j === i ? s : x));
  return <div className="fb">
    {sections.map((s, i) => {
      const structure = !withValues || Boolean(adapt[s.key]);
      return <section key={s.key} className={structure && withValues ? 'fb-section is-adapting' : 'fb-section'} aria-label={s.title}>
        <header className="fb-section-head">
          <span className="fb-n" aria-hidden="true">{i + 1}</span>
          {structure ? <input className="fb-title-input" aria-label={w.sectionName} value={s.title} maxLength={200} required onChange={e => set(i, { ...s, title: e.target.value })} /> : <h3>{s.title}</h3>}
          <span className="fb-tools">
            {withValues && <button type="button" className="link-button" aria-pressed={structure} onClick={() => setAdapt(a => ({ ...a, [s.key]: !a[s.key] }))}>{structure ? w.done : w.adapt}</button>}
            {structure && <>
              <button type="button" className="icon-button" aria-label={w.up} title={w.up} disabled={i === 0} onClick={() => onChange(move(sections, i, -1))}><UpIcon /></button>
              <button type="button" className="icon-button" aria-label={w.down} title={w.down} disabled={i === sections.length - 1} onClick={() => onChange(move(sections, i, 1))}><DownIcon /></button>
              <button type="button" className="icon-button danger-icon" aria-label={`${w.removeSection} : ${s.title}`} title={w.removeSection} onClick={() => onChange(sections.filter((_, j) => j !== i))}><TrashIcon /></button>
            </>}
          </span>
        </header>
        {s.help && <p className="fb-help">{s.help}</p>}
        {!s.fields.length && <p className="muted fb-empty">{w.emptySection}</p>}
        <FieldList fields={s.fields} withValues={withValues} structure={structure} lang={lang} idPrefix={`f-${s.key}`} taken={() => allFieldKeys(sections)} addLabel={w.addField} newLabel={w.newField}
          onChange={fields => set(i, { ...s, fields })} />
      </section>;
    })}
    <button type="button" className="secondary" onClick={() => { const key = newKey(w.newSection, sections.map(s => s.key)); onChange([...sections, { key, title: w.newSection, fields: [] }]); setAdapt(a => ({ ...a, [key]: true })); }}><PlusIcon />{w.addSection}</button>
  </div>;
}

export function QuestionsEditor({ questions, onChange, lang }: { questions: Field[]; onChange: (q: Field[]) => void; lang: Lang }) {
  const w = W[lang];
  return <div className="fb fb-flat">
    {!questions.length && <p className="muted">{w.noQuestion}</p>}
    <FieldList fields={questions} withValues={false} structure lang={lang} idPrefix="q" taken={() => questions.map(q => q.key)} addLabel={w.addQuestion} newLabel={w.newQuestion} onChange={onChange} />
  </div>;
}

export function CriteriaEditor({ criteria, onChange, lang }: { criteria: Criterion[]; onChange: (c: Criterion[]) => void; lang: Lang }) {
  const w = W[lang];
  const total = criteria.reduce((s, c) => s + (Number.isFinite(c.weight) ? c.weight : 0), 0);
  const set = (i: number, c: Criterion) => onChange(criteria.map((x, j) => j === i ? c : x));
  const add = (label: string, auto?: 'price' | 'delay') => onChange([...criteria, { key: newKey(label, criteria.map(c => c.key)), label, weight: Math.max(0, 100 - total), ...(auto ? { auto } : {}) }]);
  return <div className="weights">
    <ul>{criteria.map((c, i) => <li key={c.key} className="weight-row">
      <label className="weight-label"><span className="sr-only">{w.criterion}</span><input value={c.label} maxLength={120} required onChange={e => set(i, { ...c, label: e.target.value })} />
        <small>{c.auto === 'price' ? w.autoPrice : c.auto === 'delay' ? w.autoDelay : w.manual}</small></label>
      <label className="weight-value"><span className="sr-only">{w.weight}</span><span className="unit-input"><input type="number" min={0} max={100} step={1} value={Number.isFinite(c.weight) ? c.weight : ''} onChange={e => set(i, { ...c, weight: e.target.value === '' ? 0 : Math.round(Number(e.target.value)) })} /><span className="unit">%</span></span></label>
      <span className="weight-bar" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, c.weight))}%` }} /></span>
      <button type="button" className="icon-button danger-icon" aria-label={`${w.remove} : ${c.label}`} title={w.remove} onClick={() => onChange(criteria.filter((_, j) => j !== i))}><TrashIcon /></button>
    </li>)}</ul>
    <div className="weight-foot">
      <span className={total === 100 ? 'state state-green' : 'state state-red'}>{w.total} : {total} %</span>
      {total !== 100 && <small className="weight-warn">{w.mustBe100}</small>}
      <span className="toolbar-actions">
        {!criteria.some(c => c.auto === 'price') && <button type="button" className="link-button" onClick={() => add(lang === 'fr' ? 'Prix' : 'Price', 'price')}>{w.addPrice}</button>}
        {!criteria.some(c => c.auto === 'delay') && <button type="button" className="link-button" onClick={() => add(lang === 'fr' ? 'Délai' : 'Lead time', 'delay')}>{w.addDelay}</button>}
        <button type="button" className="secondary small" onClick={() => add(w.newCriterion)}><PlusIcon />{w.addCriterion}</button>
      </span>
    </div>
  </div>;
}

export function QualityEditor({ items, onChange, lang }: { items: QualityCriterion[]; onChange: (q: QualityCriterion[]) => void; lang: Lang }) {
  const w = W[lang];
  return <div className="quality-edit">
    <ol>{items.map((q, i) => <li key={q.key}>
      <span className="fb-n" aria-hidden="true">{i + 1}</span>
      <label className="grow"><span className="sr-only">{w.quality}</span><input value={q.label} maxLength={160} required onChange={e => onChange(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} /></label>
      <button type="button" className="icon-button danger-icon" aria-label={`${w.remove} : ${q.label}`} title={w.remove} onClick={() => onChange(items.filter((_, j) => j !== i))}><TrashIcon /></button>
    </li>)}</ol>
    <button type="button" className="secondary small" onClick={() => onChange([...items, { key: newKey(w.newQuality, items.map(x => x.key)), label: w.newQuality }])}><PlusIcon />{w.addQuality}</button>
  </div>;
}

/* ---------------------------------------------------------- reading a form */

export function SectionsView({ sections, lang }: { sections: Section[]; lang: Lang }) {
  return <div className="spec">{sections.map((s, i) => <section key={s.key} className="spec-section" aria-label={s.title}>
    <h3><span className="fb-n" aria-hidden="true">{i + 1}</span>{s.title}</h3>
    <dl className="spec-fields">{s.fields.map(f => <div key={f.key}><dt>{f.label}</dt><dd>{valueText(f, f.value, lang)}</dd></div>)}</dl>
  </section>)}</div>;
}

/** Make a form ready to send: trimmed names, options without blanks, values only where they belong. */
export function cleanForm(sections: Section[], withValues: boolean): Section[] {
  return sections.map(s => ({ ...s, title: s.title.trim(), fields: cleanFieldsList(s.fields, withValues) }));
}
export function cleanFieldsList(fields: Field[], withValues: boolean): Field[] {
  return fields.map(f => {
    const out: Field = { key: f.key, label: f.label.trim(), type: f.type };
    if (f.unit?.trim()) out.unit = f.unit.trim();
    if (f.help?.trim()) out.help = f.help.trim();
    if (f.required) out.required = true;
    if (f.type === 'choice' || f.type === 'multi') out.options = [...new Set((f.options ?? []).map(o => o.trim()).filter(Boolean))];
    if (withValues) {
      let v = f.value ?? null;
      if (typeof v === 'string') v = v.trim() || null;
      if (Array.isArray(v)) v = v.filter(x => out.options?.includes(x));
      if (f.type === 'choice' && typeof v === 'string' && !out.options?.includes(v)) v = null;
      out.value = v;
    }
    return out;
  });
}
export type { Words };
