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

// --- 5. n8n-Formular-Workflow (Form Trigger) --------------------------------
const formular = JSON.parse(lies('n8n/formular.json'));
const trigger = formular.nodes.find((n) => n.type === 'n8n-nodes-base.formTrigger');
const mapping = formular.nodes.find((n) => n.type === 'n8n-nodes-base.code').parameters.jsCode;

const felder = trigger.parameters.formFields.values.map((f) => f.fieldName);
// Heilmittel- und Einheitenzeilen bildet der Code über `f["heilmittel_" + i]` ab.
const unbenutzt = felder.filter((name) => {
  if (/^(heilmittel|einheiten)_\d$/.test(name)) return !mapping.includes(name.slice(0, -1));
  return !mapping.includes(name);
});
assert.deepEqual(unbenutzt, [], `Formularfelder ohne Abbildung im Mapping: ${unbenutzt.join(', ')}`);

const fehlendMapping = schema.required.filter((name) => !mapping.includes(name));
assert.deepEqual(fehlendMapping, [], `Schemafelder ohne Bezug im Formular-Mapping: ${fehlendMapping.join(', ')}`);

// Der Form-Workflow muss den Chat-Webhook aufrufen und eine Ergebnisseite zeigen.
const http = formular.nodes.find((n) => n.type === 'n8n-nodes-base.httpRequest');
assert.match(http.parameters.url, /\/webhook\/verordnungs-check\/chat$/, 'Formular ruft den richtigen Webhook auf');
assert.equal(formular.nodes.at(-1).type, 'n8n-nodes-base.form', 'Letzte Station muss die Ergebnisseite sein');
console.log(`✓ Form-Workflow: ${felder.length} Felder abgebildet, Webhook und Ergebnisseite verdrahtet`);

// --- 6. Vorlagen-Seite (Start mit dokumentierten Testfällen) ----------------
const vorlagenJs = lies('formular/vorlagen.js');
const datenDatei = lies('formular/vorlagen-daten.js');
const win2 = {};
new Function('window', datenDatei)(win2);
const vorlagen = win2.VORLAGEN;

// Die Daten müssen der Seed-Datei entsprechen – sonst laufen Demo und Evaluation auseinander.
const seed = lies('supabase/seed/testfaelle.sql');
const ausSeed = [...seed.matchAll(/\(\s*'([^']*)',\s*'(\{.*?\})',\s*'(\{.*?\})',\s*'([^']*)'\s*\)/gs)].map(
  ([, name, verordnung, erwartet, beschreibung]) => ({
    id: (name.match(/^(TF\d+)/) ?? [])[1],
    name: name.replace(/^TF\d+\s+/, ''),
    erwartet: JSON.parse(erwartet).gesamtstatus,
    beschreibung,
    verordnung: JSON.parse(verordnung),
  }),
);
assert.ok(ausSeed.length > 0, 'keine Testfälle im Seed gefunden');
assert.deepEqual(vorlagen, ausSeed, 'vorlagen-daten.js weicht vom Seed ab – `npm run vorlagen:daten` ausführen');

for (const vorlage of vorlagen) {
  assert.match(vorlage.id, /^TF\d+$/);
  assert.ok(['gruen', 'gelb', 'rot'].includes(vorlage.erwartet), `${vorlage.id}: unbekannte Erwartung`);
  assert.ok(vorlage.verordnung.icd10, `${vorlage.id}: ICD-Code fehlt`);
  assert.ok(vorlage.verordnung.heilmittel?.length, `${vorlage.id}: kein Heilmittel`);
}

// Die Seite muss strukturiertes JSON an den Chat-Webhook schicken (kein Freitext).
assert.match(vorlagenJs, /chatInput: JSON\.stringify\(vorlage\.verordnung\)/, 'Vorlage geht nicht als JSON an n8n');
assert.match(vorlagenJs, /\/webhook\/verordnungs-check\/chat/, 'falscher Webhook');
assert.match(lies('formular/vorlagen.html'), /vorlagen-daten\.js[\s\S]*vorlagen\.js/, 'Skripte in falscher Reihenfolge');
console.log(`✓ Vorlagen-Seite: ${vorlagen.length} Fälle deckungsgleich mit dem Seed, Webhook verdrahtet`);

console.log('\nAlle Prüfungen der Erfassungsmaske bestanden');
