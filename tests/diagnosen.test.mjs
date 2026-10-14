// Testet den deterministischen Code-Knoten "Diagnosen auswählen" direkt aus dem Workflow-Export.
// Regel und Beispiele: docs/vordruck-muster13.md, Abschnitt 5.
// Aufruf: node tests/diagnosen.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const wf = JSON.parse(readFileSync(new URL('../n8n/vier-pruefer.json', import.meta.url)));
const code = wf.nodes.find((n) => n.name === 'Diagnosen auswählen').parameters.jsCode;
const auswahl = (vo) => {
  const $input = { first: () => ({ json: { output: vo } }) };
  return new Function('$input', code)($input)[0].json;
};

const basis = {
  diagnosen: [{ code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true }],
  diagnosegruppe: 'WS',
};

const faelle = [
  [
    'Beispielfall: erster Code führt, zweiter passender Code wird Zeile 2',
    {
      diagnosen: [
        { code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true },
        { code: 'M51.1', bezeichnung: 'Bandscheibenschäden mit Radikulopathie', anlass: false },
        { code: 'M17.1', bezeichnung: 'Sonstige primäre Gonarthrose', anlass: false },
        { code: 'I10.9', bezeichnung: 'Essentielle Hypertonie', anlass: false },
      ],
    },
    {
      icd10: 'M54.4',
      weitere: ['M51.1'],
      verworfen: ['M17.1', 'I10.9'],
    },
  ],
  [
    'Eine einzige Diagnose: Zeile 2 bleibt leer',
    {},
    { icd10: 'M54.4', weitere: [], verworfen: [] },
  ],
  [
    'Anlass-Code passt nicht zur Diagnosegruppe: passender Code führt',
    {
      diagnosen: [
        { code: 'I10.9', bezeichnung: 'Hypertonie', anlass: true },
        { code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: false },
      ],
    },
    { icd10: 'M54.4', weitere: [], verworfen: ['I10.9'] },
  ],
  [
    'EX: Schulter führt, Knie wird Zeile 2',
    {
      diagnosen: [
        { code: 'M75.1', bezeichnung: 'Supraspinatussehnen-Syndrom', anlass: true },
        { code: 'M17.1', bezeichnung: 'Sonstige primäre Gonarthrose', anlass: false },
      ],
      diagnosegruppe: 'EX',
    },
    { icd10: 'M75.1', weitere: ['M17.1'], verworfen: [] },
  ],
  [
    'Diagnosegruppe klein geschrieben wird erkannt',
    {
      diagnosen: [
        { code: 'M75.1', bezeichnung: 'Supraspinatussehnen-Syndrom', anlass: true },
        { code: 'M17.1', bezeichnung: 'Sonstige primäre Gonarthrose', anlass: false },
      ],
      diagnosegruppe: 'ex',
    },
    { icd10: 'M75.1', weitere: ['M17.1'], verworfen: [] },
  ],
  [
    'Doppelt genannter Code wird nur einmal geführt',
    {
      diagnosen: [
        { code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true },
        { code: 'm54.4', bezeichnung: 'Lumboischialgie', anlass: false },
      ],
    },
    { icd10: 'M54.4', weitere: [], verworfen: [] },
  ],
  [
    'Drei passende Codes: zwei auf dem Vordruck, einer wird begründet verworfen',
    {
      diagnosen: [
        { code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true },
        { code: 'M51.1', bezeichnung: 'Bandscheibenschäden mit Radikulopathie', anlass: false },
        { code: 'M54.5', bezeichnung: 'Kreuzschmerz', anlass: false },
      ],
    },
    { icd10: 'M54.4', weitere: ['M51.1'], verworfen: ['M54.5'] },
  ],
  [
    'Diagnosegruppe ohne Treffer: erster Code führt als Vorschlag',
    {
      diagnosen: [
        { code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true },
        { code: 'M17.1', bezeichnung: 'Sonstige primäre Gonarthrose', anlass: false },
      ],
      diagnosegruppe: 'ZN',
    },
    { icd10: 'M54.4', weitere: [], verworfen: ['M17.1'] },
  ],
  [
    'Keine Diagnose erkannt: Zeile 1 bleibt leer',
    { diagnosen: [] },
    { icd10: null, weitere: [], verworfen: [] },
  ],
  [
    'Alte Ausgabe ohne diagnosen[]: icd10 wird weiterverwendet',
    { icd10: 'M54.4', icd10_bezeichnung: 'Lumboischialgie', diagnosen: undefined },
    { icd10: 'M54.4', weitere: [], verworfen: [] },
  ],
];

let ok = 0;
for (const [name, aenderung, erwartet] of faelle) {
  const { output, diagnose_auswahl } = auswahl({ ...basis, ...aenderung });
  assert.equal(output.icd10, erwartet.icd10, `${name}: icd10`);
  assert.deepEqual(
    (output.weitere_diagnosen ?? []).map((d) => d.code),
    erwartet.weitere,
    `${name}: weitere_diagnosen`,
  );
  assert.deepEqual(
    (output.nicht_verordnungsrelevant ?? []).map((d) => d.code),
    erwartet.verworfen,
    `${name}: nicht_verordnungsrelevant`,
  );
  for (const d of output.nicht_verordnungsrelevant ?? []) {
    assert.ok(d.grund, `${name}: Begründung fehlt für ${d.code}`);
  }
  ok++;
  console.log('✓', name);
}

// Hinweise: nur wenn es etwas zu prüfen gibt, und niemals stumm verwerfen.
const ohneTreffer = auswahl({ diagnosen: [{ code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true }], diagnosegruppe: 'ZN' });
assert.ok(ohneTreffer.diagnose_auswahl.hinweise.some((h) => h.includes('passt zur Diagnosegruppe')), 'Hinweis bei fehlendem Treffer');
console.log('✓ Hinweis bei fehlendem Treffer');

const viele = auswahl({
  diagnosen: [
    { code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true },
    { code: 'M51.1', bezeichnung: 'Bandscheibenschäden', anlass: false },
    { code: 'M54.5', bezeichnung: 'Kreuzschmerz', anlass: false },
  ],
  diagnosegruppe: 'WS',
});
assert.ok(viele.diagnose_auswahl.hinweise.some((h) => h.includes('Codes passen')), 'Hinweis bei mehr als zwei Treffern');
console.log('✓ Hinweis bei mehr als zwei Treffern');

const keine = auswahl({ diagnosen: [], diagnosegruppe: 'WS' });
assert.ok(keine.diagnose_auswahl.hinweise.some((h) => h.includes('Kein ICD-10-GM-Code')), 'Hinweis bei leerer Diagnoseliste');
console.log('✓ Hinweis bei leerer Diagnoseliste');

const eindeutig = auswahl(basis);
assert.deepEqual(eindeutig.diagnose_auswahl.hinweise, [], 'ohne Zweifelsfall keine Hinweise');
assert.equal(eindeutig.diagnose_auswahl.fuehrend.code, 'M54.4', 'führende Diagnose wird gemeldet');
console.log('✓ Ohne Zweifelsfall keine Hinweise');

ok += 4;
console.log(`\n${ok}/${faelle.length + 4} Tests bestanden`);
