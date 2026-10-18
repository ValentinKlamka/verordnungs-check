// Prüft die Erfassungsmaske (Muster 13) gegen den Workflow-Export.
// Aufruf: node tests/formular.test.mjs
//
// Geprüft wird:
//  1. Jedes Wertfeld des Vordrucks wird im Skript befüllt/gelesen – und umgekehrt.
//  2. Jedes Ankreuzfeld des Vordrucks kommt im Skript vor.
//  3. Die Beispieldaten enthalten alles, was das Formular vorbefüllt.
//  4. Jedes Feld des Workflow-Schemas „Verordnung" taucht im Formular-Skript auf.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const html = lies('formular/muster13.html');
const js = lies('formular/muster13.js');
const wf = JSON.parse(lies('n8n/vier-pruefer.json'));

// --- 1. Wertfelder ----------------------------------------------------------
const imHtml = new Set([...html.matchAll(/data-wert="([^"]+)"/g)].map((m) => m[1]));

const imJs = new Set();
for (const m of js.matchAll(/setzeWert\(\s*"([^"]+)"/g)) imJs.add(m[1]);
for (const m of js.matchAll(/\bwert\(\s*"([^"]+)"/g)) imJs.add(m[1]);
// Vorlagen wie `heilmittel.${i}` gelten für die drei Heilmittelzeilen.
for (const m of js.matchAll(/`((?:heilmittel|einheiten)\.)\$\{i\}`/g)) {
  for (const i of [1, 2, 3]) imJs.add(`${m[1]}${i}`);
}

const ohneZuweisung = [...imHtml].filter((name) => !imJs.has(name));
assert.deepEqual(ohneZuweisung, [], `Felder im Vordruck ohne Zuweisung im Skript: ${ohneZuweisung.join(', ')}`);

const ohneFeld = [...imJs].filter((name) => !imHtml.has(name));
assert.deepEqual(ohneFeld, [], `Zuweisungen ohne Feld im Vordruck: ${ohneFeld.join(', ')}`);
console.log(`✓ ${imHtml.size} Wertfelder in Vordruck und Skript deckungsgleich`);

// --- 2. Ankreuzfelder -------------------------------------------------------
const flags = [...new Set([...html.matchAll(/data-flag="([^"]+)"/g)].map((m) => m[1]))];
for (const flag of flags) {
  assert.ok(js.includes(`"${flag}"`), `Ankreuzfeld ohne Bezug im Skript: ${flag}`);
}
console.log(`✓ ${flags.length} Ankreuzfelder im Skript berücksichtigt`);

// --- 3. Beispieldaten für die Vorbefüllung ----------------------------------
const win = {};
new Function('window', lies('formular/beispiel-workflow-ausgabe.js'))(win);
const vo = win.BEISPIEL_WORKFLOW_AUSGABE.eingabe.verordnung;

const pflicht = {
  Krankenkasse: vo.patient?.krankenkasse,
  Name: vo.patient?.nachname && vo.patient?.vorname,
  Geburtsdatum: vo.patient?.geburtsdatum,
  'Versicherten-Nr.': vo.patient?.versichertennummer,
  Ausstellungsdatum: vo.ausstellungsdatum,
  LANR: vo.lanr,
  BSNR: vo.bsnr,
  Heilmittelbereich: vo.heilmittelbereich,
  'Erste Diagnose': vo.icd10,
  'Zweite Diagnose': vo.weitere_diagnosen?.[0]?.code,
  Diagnosegruppe: vo.diagnosegruppe,
  Leitsymptomatik: vo.leitsymptomatik,
  Heilmittel: vo.heilmittel?.[0]?.name,
  Einheiten: vo.heilmittel?.[0]?.einheiten,
  Frequenz: vo.frequenz,
};
for (const [feld, wertigkeit] of Object.entries(pflicht)) {
  assert.ok(wertigkeit !== undefined && wertigkeit !== null && wertigkeit !== '', `Beispieldaten unvollständig: ${feld}`);
}
assert.match(vo.lanr, /^\d{9}$/, 'LANR muss 9-stellig sein');
assert.match(vo.bsnr, /^\d{9}$/, 'BSNR muss 9-stellig sein');
assert.equal(vo.heilmittelbereich, 'physiotherapie', 'Beispielfall ist kein Physiotherapie-Fall');
console.log(`✓ Beispieldaten vollständig (${vo.icd10} + ${vo.weitere_diagnosen[0].code}, ${vo.heilmittel[0].name} ${vo.heilmittel[0].einheiten}x)`);

// --- 4. Felder des Workflow-Schemas im Formular-Skript ----------------------
const parser = wf.nodes.find((n) => n.name === 'Schema Verordnung');
const schema = JSON.parse(parser.parameters.inputSchema);
const fehlend = schema.required.filter((name) => !js.includes(name));
assert.deepEqual(fehlend, [], `Schemafelder ohne Bezug im Formular: ${fehlend.join(', ')}`);
console.log(`✓ Alle ${schema.required.length} Schemafelder im Formular berücksichtigt`);

console.log('\nAlle Prüfungen der Erfassungsmaske bestanden');
