// Holt die letzte erfolgreiche Ausführung des Workflows „Verordnungs-Check –
// Vier Prüfer" aus der lokalen n8n-Datenbank und schreibt sie als
// preview/letzter-lauf.js, damit die Vorschau einen echten Lauf anzeigen kann.
//
// Aufruf:  npm run vorschau:lauf        (oder: node preview/aus-n8n-lauf.mjs)
// Option:   --db=Pfad/zu/database.sqlite (wenn die Instanz woanders liegt)
//
// Die Datenbank wird nur gelesen. Die erzeugte Datei steht in .gitignore, weil
// sie den zuletzt geprüften Fall enthält (im Prototyp ausschließlich
// synthetische Daten).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const hier = dirname(fileURLToPath(import.meta.url));
const projekt = resolve(hier, '..');
const ZIEL = join(hier, 'letzter-lauf.js');
const KNOTEN = 'Ergebnis zusammenführen';

/** Pfad zur SQLite-Datenbank der lokalen n8n-Instanz (N8N_USER_FOLDER aus .env). */
function datenbankPfad() {
  const argument = process.argv.find((a) => a.startsWith('--db='));
  if (argument) return resolve(argument.slice('--db='.length));
  let ordner = '.n8n';
  const envDatei = join(projekt, '.env');
  if (existsSync(envDatei)) {
    const zeile = readFileSync(envDatei, 'utf8')
      .split(/\r?\n/)
      .find((z) => z.trim().startsWith('N8N_USER_FOLDER='));
    if (zeile) ordner = zeile.slice(zeile.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') || ordner;
  }
  return join(projekt, ordner, '.n8n', 'database.sqlite');
}

/**
 * n8n 2.x speichert Ausführungsdaten flach: Strings wie "12" sind Verweise auf
 * Indizes im selben Array. Diese Funktion löst die Verweise rekursiv auf.
 */
function aufloesen(flach, wert, tiefe = 0) {
  if (typeof wert === 'string' && /^\d+$/.test(wert) && Number(wert) < flach.length && tiefe < 60) {
    return aufloesen(flach, flach[Number(wert)], tiefe + 1);
  }
  if (Array.isArray(wert)) return wert.map((x) => aufloesen(flach, x, tiefe + 1));
  if (wert && typeof wert === 'object') {
    return Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, aufloesen(flach, v, tiefe + 1)]));
  }
  return wert;
}

const pfad = datenbankPfad();
if (!existsSync(pfad)) {
  console.error(`Keine n8n-Datenbank unter ${pfad}.`);
  console.error('Erst "npm run n8n" starten und eine Verordnung prüfen – oder den Pfad mit --db= angeben.');
  process.exit(1);
}

const db = new DatabaseSync(pfad, { readOnly: true });
const workflow = db
  .prepare("SELECT id, name FROM workflow_entity WHERE name LIKE '%Vier Prüfer%' LIMIT 1")
  .get();
if (!workflow) {
  console.error('Der Workflow „Verordnungs-Check – Vier Prüfer" ist in dieser Instanz nicht vorhanden.');
  process.exit(1);
}

const ausfuehrungen = db
  .prepare(
    'SELECT e.id, e.stoppedAt, d.data FROM execution_entity e JOIN execution_data d ON d.executionId = e.id ' +
      "WHERE e.workflowId = ? AND e.status = 'success' ORDER BY e.id DESC LIMIT 10",
  )
  .all(workflow.id);

let treffer = null;
for (const zeile of ausfuehrungen) {
  const flach = JSON.parse(zeile.data);
  if (!Array.isArray(flach)) continue; // anderes Speicherformat, nicht lesbar
  const daten = aufloesen(flach, flach[2]);
  const lauf = daten.runData?.[KNOTEN]?.[0];
  const ergebnis = lauf?.data?.main?.[0]?.[0]?.json;
  if (ergebnis?.eingabe?.verordnung) {
    treffer = { id: zeile.id, stoppedAt: zeile.stoppedAt, ergebnis };
    break;
  }
}

if (!treffer) {
  console.error('Keine erfolgreiche Prüfung gefunden. Im n8n-Chat eine Verordnung prüfen und erneut aufrufen.');
  process.exit(1);
}

const inhalt =
  `// Erzeugt von preview/aus-n8n-lauf.mjs – nicht committen (siehe .gitignore).\n` +
  `// Quelle: n8n-Ausführung ${treffer.id} vom ${treffer.stoppedAt}.\n` +
  `window.LETZTER_LAUF = ${JSON.stringify(treffer.ergebnis, null, 2)};\n`;
writeFileSync(ZIEL, inhalt);

const vo = treffer.ergebnis.eingabe.verordnung;
const auswahl = treffer.ergebnis.diagnose_auswahl;
console.log(`${ZIEL} aus Ausführung ${treffer.id} geschrieben.`);
console.log(`  Fall: ${treffer.ergebnis.verordnung_ref} | Status: ${treffer.ergebnis.gesamtstatus} | ${treffer.ergebnis.befunde?.length ?? 0} Befunde`);
console.log(`  Diagnosen: ${vo.icd10 ?? '–'}${vo.weitere_diagnosen?.[0] ? ' + ' + vo.weitere_diagnosen[0].code : ''}${vo.nicht_verordnungsrelevant?.length ? ' (' + vo.nicht_verordnungsrelevant.length + ' verworfen)' : ''}`);
if (auswahl?.hinweise?.length) console.log(`  Hinweise zur Auswahl: ${auswahl.hinweise.join(' | ')}`);
