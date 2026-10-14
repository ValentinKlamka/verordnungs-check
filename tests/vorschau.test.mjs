// Prüft die Vorschau der ausgefüllten Verordnung gegen den Workflow-Export.
// Aufruf: node tests/vorschau.test.mjs
//
// Geprüft wird:
//  1. Die in den Beispieldaten hinterlegten Fakten stimmen mit dem Code-Node
//     „Fristen berechnen" überein (dasselbe Verfahren wie fakten.test.mjs).
//  1b. Die Diagnoseauswahl der Beispieldaten stimmt mit dem Code-Node
//     „Diagnosen auswählen" überein (Regel: docs/vordruck-muster13.md).
//  2. Vordruck (HTML) und Fülllogik (JS) kennen dieselben Felder – kein Feld im
//     Markup ohne Zuweisung, keine Zuweisung ohne Feld.
//  3. Pflichtangaben des Vordrucks sind in den Beispieldaten gesetzt.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');

// --- Beispieldaten laden (die Datei schreibt in window) --------------------
const win = {};
new Function('window', lies('preview/beispiel-workflow-ausgabe.js'))(win);
const ausgabe = win.BEISPIEL_WORKFLOW_AUSGABE;
const vo = ausgabe.eingabe.verordnung;

// --- 1. Fakten gegen den Code-Node nachrechnen ------------------------------
const wf = JSON.parse(lies('n8n/vier-pruefer.json'));
const codeNode = wf.nodes.find((n) => n.name === 'Fristen berechnen').parameters.jsCode;
const fakten = new Function('$input', codeNode)({ first: () => ({ json: { output: vo } }) })[0].json
  .fakten;
assert.deepEqual(ausgabe.eingabe.fakten, fakten, 'Fakten der Beispieldaten weichen vom Workflow ab');
console.log('✓ Fakten stimmen mit dem Code-Node „Fristen berechnen" überein');

// --- 1b. Diagnoseauswahl gegen den Code-Node nachrechnen --------------------
const auswahlCode = wf.nodes.find((n) => n.name === 'Diagnosen auswählen').parameters.jsCode;
const auswahl = new Function('$input', auswahlCode)({ first: () => ({ json: { output: vo } }) })[0]
  .json;
assert.deepEqual(
  auswahl.output.weitere_diagnosen,
  vo.weitere_diagnosen,
  'Zweite Diagnosezeile der Beispieldaten weicht von der Auswahlregel ab',
);
assert.deepEqual(
  auswahl.output.nicht_verordnungsrelevant,
  vo.nicht_verordnungsrelevant,
  'Verworfene Diagnosen der Beispieldaten weichen von der Auswahlregel ab',
);
assert.equal(auswahl.output.icd10, vo.icd10, 'Führende Diagnose weicht von der Auswahlregel ab');
assert.deepEqual(
  auswahl.diagnose_auswahl,
  ausgabe.diagnose_auswahl,
  'diagnose_auswahl der Beispieldaten weicht vom Workflow ab',
);
console.log(
  `✓ Diagnoseauswahl stimmt mit dem Code-Node „Diagnosen auswählen" überein ` +
    `(${auswahl.diagnose_auswahl.erkannt} erkannt, ${auswahl.diagnose_auswahl.hinweise.length} Hinweise)`,
);

// --- 2. HTML und JS kennen dieselben Felder --------------------------------
const html = lies('preview/muster13.html');
const js = lies('preview/muster13.js');

/** Feldnamen aus `data-XX="…"` im Skript, einschließlich Vorlagen wie "heilmittel.${i}". */
function feldnamenAusJs(attribut) {
  const namen = new Set(
    [...js.matchAll(new RegExp(`\\[data-${attribut}="([^"$]+)"\\]`, 'g'))].map((m) => m[1]),
  );
  const vorlagen = new RegExp(`\\[data-${attribut}="([^"$]*)\\$\\{[^}]+\\}([^"$]*)"\\]`, 'g');
  for (const [, vor, nach] of js.matchAll(vorlagen)) {
    if (vor === '' && nach === '') continue; // Selektor-Bau im Hilfsfunktionskörper
    for (let i = 1; i <= 3; i += 1) namen.add(`${vor}${i}${nach}`);
  }
  // Ankreuzfelder werden über die Hilfsfunktion gesetzt: setzeFlag("name", …)
  // – auch über mehrere Zeilen umbrochen.
  if (attribut === 'flag') {
    for (const [, name] of js.matchAll(/setzeFlag\(\s*"([^"$]+)"/g)) namen.add(name);
  }
  return namen;
}

for (const attribut of ['wert', 'flag']) {
  const imHtml = new Set([...html.matchAll(new RegExp(`data-${attribut}="([^"]+)"`, 'g'))].map((m) => m[1]));
  const imJs = feldnamenAusJs(attribut);

  const ohneZuweisung = [...imHtml].filter((name) => !imJs.has(name));
  assert.deepEqual(
    ohneZuweisung,
    [],
    `Felder im Vordruck ohne Zuweisung im Skript: ${ohneZuweisung.join(', ')}`,
  );

  const ohneFeld = [...imJs].filter((name) => !imHtml.has(name));
  assert.deepEqual(ohneFeld, [], `Zuweisungen ohne Feld im Vordruck: ${ohneFeld.join(', ')}`);

  console.log(
    `✓ ${imHtml.size} ${attribut === 'wert' ? 'Wertfelder' : 'Ankreuzfelder'} in Vordruck und Skript deckungsgleich`,
  );
}

// --- 3. Pflichtangaben für den Vordruck -------------------------------------
const pflicht = {
  Krankenkasse: vo.patient?.krankenkasse,
  'Name des Versicherten': vo.patient?.nachname && vo.patient?.vorname,
  Geburtsdatum: vo.patient?.geburtsdatum,
  'Versicherten-Nr.': vo.patient?.versichertennummer,
  Ausstellungsdatum: vo.ausstellungsdatum,
  'Arzt-Nr. (LANR)': vo.lanr,
  'Betriebsstätten-Nr. (BSNR)': vo.bsnr,
  Heilmittelbereich: vo.heilmittelbereich,
  'Erste Diagnose': vo.icd10,
  'Zweite Diagnose': vo.weitere_diagnosen?.[0]?.code,
  Diagnosegruppe: vo.diagnosegruppe,
  Leitsymptomatik: vo.leitsymptomatik,
  Heilmittel: vo.heilmittel?.[0]?.name,
  Behandlungseinheiten: vo.heilmittel?.[0]?.einheiten,
  Therapiefrequenz: vo.frequenz,
};
for (const [feld, wert] of Object.entries(pflicht)) {
  assert.ok(wert !== undefined && wert !== null && wert !== '', `Pflichtangabe fehlt: ${feld}`);
}
assert.match(vo.lanr, /^\d{9}$/, 'LANR muss 9-stellig sein');
assert.match(vo.bsnr, /^\d{9}$/, 'BSNR muss 9-stellig sein');
assert.equal(vo.heilmittelbereich, 'physiotherapie', 'Beispielfall ist kein Physiotherapie-Fall');

// Der Vordruck hat zwei Diagnosezeilen – die zweite nicht mehrfach belegen.
assert.ok((vo.weitere_diagnosen ?? []).length <= 1, 'Der Vordruck hat nur zwei Diagnosezeilen');

// Verworfene Diagnosen müssen begründet sein (Transparenz in der Vorschau).
for (const diagnose of vo.nicht_verordnungsrelevant ?? []) {
  assert.ok(diagnose.code && diagnose.grund, `Verworfene Diagnose ohne Begründung: ${diagnose.code}`);
}
console.log(
  `✓ Pflichtangaben vollständig, Diagnosen ${vo.icd10} + ${vo.weitere_diagnosen[0].code}, ` +
    `${vo.nicht_verordnungsrelevant.length} verworfene Codes mit Begründung`,
);

console.log('\nAlle Prüfungen der Vorschau bestanden');
