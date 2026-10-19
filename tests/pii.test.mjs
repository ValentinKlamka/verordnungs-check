// Prüft die beiden Redaktions-Knoten aus dem Workflow-Export.
// Aufruf: node tests/pii.test.mjs
//
//  1. "PII entfernen" – was die Prüf-Agenten sehen (strukturierte Eingabe).
//  2. "Text redigieren" – was der Extraktor im Freitext-Weg liest.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const wf = JSON.parse(readFileSync(new URL('../n8n/vier-pruefer.json', import.meta.url)));
const code = (name) => wf.nodes.find((n) => n.name === name).parameters.jsCode;
const entfernen = (json) => new Function('$input', code('PII entfernen'))({ first: () => ({ json }) })[0].json;
const redigieren = (json) => new Function('$input', code('Text redigieren'))({ first: () => ({ json }) })[0].json;

const verordnung = {
  verordnung_ref: 'VO-20261019-1015',
  patient: {
    krankenkasse: 'Musterkasse',
    nachname: 'Mustermann',
    vorname: 'Erika',
    geburtsdatum: '1972-04-18',
    kostentraegerkennung: '999999999',
    versichertennummer: 'A123456789',
    versichertenstatus: 'Mitglied',
  },
  bsnr: '987654300',
  lanr: '123456701',
  ausstellungsdatum: '2026-10-15',
  pruefdatum: '2026-10-19',
  geplanter_beginn: null,
  zuzahlung: 'pflicht',
  unfallfolgen: false,
  bvg_ser: false,
  heilmittelbereich: 'physiotherapie',
  icd10: 'M54.4',
  icd10_bezeichnung: 'Lumboischialgie',
  weitere_diagnosen: [{ code: 'M51.1', bezeichnung: 'Bandscheibenschäden mit Radikulopathie' }],
  nicht_verordnungsrelevant: [{ code: 'I10.9', bezeichnung: 'Hypertonie bei Frau Müller', grund: 'andere Region' }],
  diagnosen: [{ code: 'M54.4', bezeichnung: 'Lumboischialgie', anlass: true }],
  diagnosegruppe: 'WS',
  leitsymptomatik: 'a',
  leitsymptomatik_freitext: 'Schmerz links, seit Januar',
  heilmittel: [{ name: 'Krankengymnastik (KG)', einheiten: 6, art: 'vorrangig' }],
  ergaenzendes_heilmittel: { name: null, einheiten: null },
  frequenz: '2x pro Woche',
  therapiebericht: false,
  hausbesuch: false,
  dringlich: false,
  therapieziele_hinweise: 'Rückruf unter 0170 1234567, Termin mit Erika Mustermann',
  arzt: { name: 'Dr. med. Anna Beispiel', fachrichtung: 'Orthopädie', betriebsstaette: 'Praxis am Musterplatz' },
  unterschrift: true,
  letzte_behandlung: null,
  unterbrechungsgrund: 'Urlaub von Herrn Mustermann',
  kostentraeger: 'Musterkasse',
};

const fakten = { summe_einheiten: 6, lanr_format_ok: true, bsnr_format_ok: true, beginn_fristgerecht: true };
const ergebnis = entfernen({ vo: verordnung, fakten, diagnose_auswahl: { hinweise: [] } });
const redigiert = ergebnis.vo;

let ok = 0;
const pruefe = (name, fn) => {
  fn();
  ok += 1;
  console.log('✓', name);
};

// --- 1. Direkte Identifikatoren sind ersetzt, aber als "ausgefüllt" erkennbar ---
pruefe('Name, Vorname und Geburtsdatum sind maskiert', () => {
  assert.equal(redigiert.patient.nachname, '[Name]');
  assert.equal(redigiert.patient.vorname, '[Vorname]');
  assert.equal(redigiert.patient.geburtsdatum, '[Geburtsdatum]');
});

pruefe('Versichertennummer und Kostenträgerkennung sind maskiert', () => {
  assert.equal(redigiert.patient.versichertennummer, '[Versichertennummer]');
  assert.equal(redigiert.patient.kostentraegerkennung, '[Kostenträgerkennung]');
});

pruefe('LANR, BSNR und Arztangaben sind maskiert', () => {
  assert.equal(redigiert.lanr, '[LANR]');
  assert.equal(redigiert.bsnr, '[BSNR]');
  assert.equal(redigiert.arzt.name, '[Arzt]');
  assert.equal(redigiert.arzt.betriebsstaette, '[Praxis]');
  assert.equal(redigiert.arzt.fachrichtung, 'Orthopädie', 'Fachrichtung ist kein Personenbezug');
});

pruefe('Krankenkasse und Versichertenstatus bleiben (Institution/Status)', () => {
  assert.equal(redigiert.patient.krankenkasse, 'Musterkasse');
  assert.equal(redigiert.patient.versichertenstatus, 'Mitglied');
});

pruefe('Fehlende Angaben bleiben null und werden nicht zu Markern', () => {
  assert.equal(redigiert.geplanter_beginn, null);
  assert.equal(redigiert.letzte_behandlung, null);
  assert.equal(redigiert.ergaenzendes_heilmittel.name, null);
});

// --- 2. Fachliche Angaben bleiben unverändert ---
pruefe('Diagnosen, Heilmittel und Termine bleiben unverändert', () => {
  assert.equal(redigiert.icd10, 'M54.4');
  assert.equal(redigiert.diagnosegruppe, 'WS');
  assert.equal(redigiert.leitsymptomatik, 'a');
  assert.deepEqual(redigiert.heilmittel, verordnung.heilmittel);
  assert.equal(redigiert.frequenz, '2x pro Woche');
  assert.equal(redigiert.ausstellungsdatum, '2026-10-15');
  assert.equal(redigiert.weitere_diagnosen[0].code, 'M51.1');
});

pruefe('Medizinische Bezeichnungen bleiben lesbar', () => {
  assert.equal(redigiert.icd10_bezeichnung, 'Lumboischialgie');
  assert.equal(redigiert.weitere_diagnosen[0].bezeichnung, 'Bandscheibenschäden mit Radikulopathie');
});

// --- 3. Freitexte ---
pruefe('Freitextfelder werden entfernt', () => {
  assert.equal(redigiert.leitsymptomatik_freitext, '[Freitext entfernt]');
  assert.equal(redigiert.therapieziele_hinweise, '[Freitext entfernt]');
});

pruefe('Freitext in Bezeichnungen wird bereinigt (Name im Klartext)', () => {
  assert.doesNotMatch(redigiert.nicht_verordnungsrelevant[0].bezeichnung, /Müller/);
  assert.match(redigiert.nicht_verordnungsrelevant[0].bezeichnung, /\[Name\]/);
});

pruefe('Unterbrechungsgrund wird bereinigt, nicht entfernt', () => {
  assert.doesNotMatch(redigiert.unterbrechungsgrund, /Mustermann/);
  assert.match(redigiert.unterbrechungsgrund, /Urlaub/);
});

// --- 4. Original und Protokoll bleiben vollständig ---
pruefe('Das Original bleibt unverändert (Prüfprotokoll behält die Daten)', () => {
  assert.equal(verordnung.patient.nachname, 'Mustermann');
  assert.equal(verordnung.patient.versichertennummer, 'A123456789');
  assert.equal(verordnung.therapieziele_hinweise.includes('Mustermann'), true);
});

pruefe('Die Ausgabe trägt die redigierte Verordnung unter "vo" und keine Kopie des Originals', () => {
  assert.equal(ergebnis.vo.patient.nachname, '[Name]');
  assert.equal(JSON.stringify(ergebnis).includes('Mustermann'), false, 'Original darf nicht mitwandern');
  assert.equal(JSON.stringify(ergebnis).includes('A123456789'), false, 'Versichertennummer darf nicht mitwandern');
});

pruefe('Die Redaktion wird als Liste gemeldet', () => {
  assert.equal(ergebnis.pii.pseudonymisiert, true);
  for (const feld of ['Name', 'Vorname', 'Geburtsdatum', 'Versichertennummer', 'LANR', 'BSNR', 'Arzt', 'Therapieziele']) {
    assert.ok(ergebnis.pii.entfernt.includes(feld), `nicht gemeldet: ${feld}`);
  }
});

pruefe('Berechnete Fakten gehen unverändert an die Prüfer', () => {
  assert.deepEqual(ergebnis.fakten, fakten);
});

// --- 4b. Pflichtangaben: die Redaktion ersetzt Werte durch Marker, die Prüfer brauchen die Fakten ---
const faktenCode = wf.nodes.find((n) => n.name === 'Fristen berechnen').parameters.jsCode;
const rechneFakten = (vo) => new Function('$input', faktenCode)({ first: () => ({ json: { output: vo } }) })[0].json.fakten;

pruefe('Pflichtangaben werden vor der Redaktion ermittelt', () => {
  const f = rechneFakten(verordnung).pflichtangaben;
  assert.equal(f.lanr, true, 'LANR ist ausgefüllt, auch wenn später nur [LANR] beim Prüfer ankommt');
  assert.equal(f.bsnr, true);
  assert.equal(f.unterschrift, true);
  assert.equal(f.diagnosegruppe, true);
  assert.equal(f.frequenz, true);
});

pruefe('Fehlende Angaben bleiben in den Pflichtangaben false', () => {
  const f = rechneFakten({ ...verordnung, lanr: null, unterschrift: null, frequenz: '  ' }).pflichtangaben;
  assert.equal(f.lanr, false);
  assert.equal(f.unterschrift, false);
  assert.equal(f.frequenz, false);
});

pruefe('Redigierte Marker gelten als ausgefüllt, aber mit unprüfbarem Format', () => {
  const f = rechneFakten({ ...verordnung, lanr: '[LANR]', bsnr: '[BSNR]' });
  assert.equal(f.pflichtangaben.lanr, true);
  assert.equal(f.pflichtangaben.bsnr, true);
  assert.equal(f.lanr_format_ok, null, 'null = nicht prüfbar, nicht false = fehlerhaft');
  assert.equal(f.bsnr_format_ok, null);
});

pruefe('Echte Werte werden weiterhin auf 9 Ziffern geprüft', () => {
  const gut = rechneFakten({ ...verordnung, lanr: '123456789', bsnr: '987654300' });
  assert.equal(gut.lanr_format_ok, true);
  assert.equal(gut.bsnr_format_ok, true);
  const schlecht = rechneFakten({ ...verordnung, lanr: '1234' });
  assert.equal(schlecht.lanr_format_ok, false);
});

pruefe('Der Extraktor übernimmt Marker als Wert', () => {
  const prompt = wf.nodes.find((n) => n.name === 'Verordnung erfassen').parameters.options.systemMessage;
  assert.match(prompt, /eckigen Klammern/);
  assert.match(prompt, /Übernimm den Marker/);
});

pruefe('Die Prüfer-Regel verweist auf die Pflichtangaben und erklärt Marker', () => {
  const formal = wf.nodes.find((n) => n.name === 'Formal-Prüfer').parameters.options.systemMessage;
  assert.match(formal, /pflichtangaben/);
  for (const name of ['Formal-Prüfer', 'Diagnose-Prüfer', 'Mengen-Prüfer', 'Fristen-Prüfer']) {
    const s = wf.nodes.find((n) => n.name === name).parameters.options.systemMessage;
    assert.match(s, /eckigen Klammern/, `${name} erklärt die Marker nicht`);
  }
});

// --- 5. Freitext-Eingang (Chat) ---
const text = redigieren({
  modus: 'freitext',
  text: 'Patientin Erika Mustermann, geb. am 18.04.1972, Versichertennummer A123456789, Tel. 0170 1234567, erika@example.de, wohnhaft Musterstraße 12. Ausstellungsdatum 15.10.2026, ICD-10 M54.4 Lumboischialgie, Diagnosegruppe WS, 6x KG.',
}).text;

pruefe('Freitext: Name, Geburtsdatum und Versichertennummer sind entfernt', () => {
  assert.doesNotMatch(text, /Mustermann/);
  assert.doesNotMatch(text, /18\.04\.1972/);
  assert.doesNotMatch(text, /A123456789/);
  assert.match(text, /\[Name\]/);
});

pruefe('Freitext: Kontaktdaten und Anschrift sind entfernt', () => {
  assert.doesNotMatch(text, /0170 1234567/);
  assert.doesNotMatch(text, /erika@example\.de/);
  assert.doesNotMatch(text, /Musterstraße 12/);
});

pruefe('Freitext: medizinische Angaben und Ausstellungsdatum bleiben', () => {
  assert.match(text, /M54\.4/);
  assert.match(text, /Lumboischialgie/);
  assert.match(text, /Diagnosegruppe WS/);
  assert.match(text, /15\.10\.2026/, 'Ausstellungsdatum wird für die Fristprüfung gebraucht');
});

// --- 5b. Weitere Muster im Freitext ---
const weitere = (eingabe) => redigieren({ modus: 'freitext', text: eingabe }).text;

pruefe('Freitext: "geboren am" wird wie "geb. am" behandelt', () => {
  const t = weitere('Die Patientin ist geboren am 03.09.1985 in Musterstadt.');
  assert.doesNotMatch(t, /03\.09\.1985/);
});

pruefe('Freitext: Arztname mit Titel wird entfernt', () => {
  const t = weitere('Verordnet von Dr. med. Anna Beispiel, Fachrichtung Orthopädie.');
  assert.doesNotMatch(t, /Anna Beispiel/);
  assert.match(t, /\[Arzt\]/);
});

pruefe('Freitext: Praxisname wird entfernt', () => {
  const t = weitere('Praxis am Musterplatz, Termin am 20.10.2026.');
  assert.doesNotMatch(t, /Musterplatz/);
  assert.match(t, /20\.10\.2026/, 'Termine bleiben erhalten');
});

pruefe('Freitext: Postleitzahl mit Ort wird entfernt', () => {
  const t = weitere('Wohnhaft in 12345 Musterstadt.');
  assert.doesNotMatch(t, /Musterstadt/);
});

pruefe('Freitext: Telefon mit Label und Name-Zeile werden entfernt', () => {
  const t = weitere('Tel. 0170 1234567, Name: Mustermann');
  assert.doesNotMatch(t, /0170 1234567/);
  assert.doesNotMatch(t, /Mustermann/);
});

pruefe('Bekannte Grenze: Name ohne Rollenwort bleibt stehen (dokumentiert)', () => {
  // Ehrlich getestet: ein Regex erkennt "Mustermann klagt über ..." nicht sicher als Namen.
  const t = weitere('Mustermann klagt über Rückenschmerzen.');
  assert.match(t, /Mustermann/, 'ohne Rollenwort keine Erkennung – deshalb ist der Formularweg der sichere Weg');
});

pruefe('ICD-Codes direkt hinter einem Namen bleiben erhalten', () => {
  const t = weitere('Bandscheibenschäden bei Frau Müller M51.1, Lumboischialgie M54.4.');
  assert.doesNotMatch(t, /Müller/);
  assert.match(t, /M51\.1/);
  assert.match(t, /M54\.4/);
});

pruefe('Geburtsdatum mit führender Null wird nicht als Telefonnummer ersetzt', () => {
  const t = weitere('Patientin Erika Mustermann, geb. 03.04.1958, wohnhaft Rosenweg 12.');
  assert.match(t, /\[Geburtsdatum\]/);
  assert.doesNotMatch(t, /1958/);
});

pruefe('LANR und BSNR werden auch im Freitext maskiert', () => {
  const t = weitere('Verordnet von Dr. med. Anna Beispiel, LANR 123456789, BSNR 987654300.');
  assert.doesNotMatch(t, /123456789/);
  assert.doesNotMatch(t, /987654300/);
  assert.match(t, /\[LANR\]/);
  assert.match(t, /\[BSNR\]/);
});

pruefe('Telefon- und Praxis-Muster schlucken den Folgetext nicht', () => {
  const t = weitere('Telefon 0721 445566, E-Mail egal. Praxis am Markt. Diagnose M54.4.');
  assert.match(t, /\[Telefon\], E-Mail/, 'Komma und Folgetext bleiben stehen');
  assert.match(t, /\[Praxis\]\.\s*Diagnose/, 'Satzgrenze hinter dem Praxisnamen bleibt');
});

pruefe('Scheitert der Extraktor, antwortet der Workflow mit einem Hinweis statt HTTP 500', () => {
  const erfassen = wf.nodes.find((n) => n.name === 'Verordnung erfassen');
  assert.equal(erfassen.onError, 'continueErrorOutput');
  const fehlerzweig = wf.connections['Verordnung erfassen'].main[1][0].node;
  assert.equal(fehlerzweig, 'Hinweis Freitext');
  const hinweis = wf.nodes.find((n) => n.name === 'Hinweis Freitext');
  assert.match(hinweis.parameters.assignments.assignments[0].value, /Formular/);
  assert.equal(hinweis.parameters.assignments.assignments[0].name, 'output', 'der Chat liest das Feld output');
  const trigger = wf.nodes.find((n) => n.name === 'Rezeption: Verordnung eingeben');
  assert.equal(trigger.parameters.options.responseMode, 'lastNode', 'sonst käme der Hinweis nie beim Chat an');
});

// --- 6. Verdrahtung im Workflow ---
pruefe('Alle vier Prüfer hängen hinter der Redaktion', () => {
  const ziele = wf.connections['PII entfernen'].main[0].map((c) => c.node);
  assert.deepEqual(ziele, ['Formal-Prüfer', 'Diagnose-Prüfer', 'Mengen-Prüfer', 'Fristen-Prüfer']);
  assert.deepEqual(wf.connections['Fristen berechnen'].main[0].map((c) => c.node), ['PII entfernen']);
});

pruefe('Der Freitext-Weg läuft über die Textredaktion', () => {
  assert.deepEqual(wf.connections['Verordnung strukturiert?'].main[1].map((c) => c.node), ['Text redigieren']);
  assert.deepEqual(wf.connections['Text redigieren'].main[0].map((c) => c.node), ['Verordnung erfassen']);
});

console.log(`\n${ok} Prüfungen bestanden`);
