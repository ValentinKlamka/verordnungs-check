// Bereitet die Import-Dateien aus den Repository-Exporten vor.
//
// Zwei Ziele:
//  1. `.n8n/tmp/vier-pruefer-lokal.json` – für die lokale npm-Instanz. Der
//     Chat-Trigger bekommt eine feste webhookId, damit die Chat-Adresse stabil
//     bleibt, und – falls der Workflow dort schon existiert – dessen ID, damit
//     der Import aktualisiert statt zu duplizieren.
//  2. `.n8n/tmp/import-fremdinstanz/` – für eine bereits laufende Instanz
//     (z. B. Docker-Container). Dort sind zwei Eigenheiten zu beachten, die der
//     Import über die Oberfläche automatisch erledigt, der CLI-Import aber nicht
//     (getestet mit n8n 2.20.8):
//       - Workflow und Credentials brauchen eine ID in der Datei.
//       - Credentials werden nur über die ID aufgelöst, nicht über den Namen.
//     Das Skript erzeugt daher beide Dateien mit zueinander passenden IDs.
//
// Aufruf: npm run n8n:vorbereiten
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const QUELLE_WORKFLOW = 'n8n/vier-pruefer.json';
const QUELLE_CREDENTIALS = '.n8n/credentials/vier-pruefer.json';
const ORDNER_TMP = '.n8n/tmp';
const ORDNER_FREMD = `${ORDNER_TMP}/import-fremdinstanz`;
const LOKALE_DATENBANK = '.n8n/.n8n/database.sqlite';
const WEBHOOK_ID_LOKAL = 'verordnungs-check-lokal';
const WEBHOOK_ID_FREMD = 'verordnungs-check';

/** n8n-IDs sind 16-stellige nanoid-Werte. */
const alphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
const neueId = (size = 16) => Array.from(randomBytes(size), (b) => alphabet[b % 64]).join('');

const lies = (pfad) => {
  const roh = JSON.parse(readFileSync(pfad, 'utf8'));
  return Array.isArray(roh) ? roh[0] : roh;
};

mkdirSync(ORDNER_TMP, { recursive: true });

/* ------------------------------------------------- 1. lokale npm-Instanz --- */
const lokal = lies(QUELLE_WORKFLOW);
lokal.nodes.find((n) => n.type.includes('chatTrigger')).webhookId = WEBHOOK_ID_LOKAL;

if (existsSync(LOKALE_DATENBANK)) {
  const db = new DatabaseSync(LOKALE_DATENBANK, { readOnly: true });
  const vorhanden = db.prepare('SELECT id FROM workflow_entity WHERE name = ?').all(lokal.name);
  if (vorhanden.length === 1) {
    lokal.id = vorhanden[0].id;
  } else if (vorhanden.length > 1) {
    console.error(`Mehrere Workflows namens "${lokal.name}" in der lokalen Instanz – bitte einen löschen.`);
    process.exit(1);
  }
}

writeFileSync(`${ORDNER_TMP}/vier-pruefer-lokal.json`, JSON.stringify(lokal, null, 2) + '\n');
console.log(
  `${ORDNER_TMP}/vier-pruefer-lokal.json geschrieben ` +
    `(webhookId=${WEBHOOK_ID_LOKAL}, ID=${lokal.id ?? 'neu'}, ${lokal.nodes.length} Knoten)`,
);

/* ------------------------------------------- 2. fremde Instanz (Docker) --- */
if (!existsSync(QUELLE_CREDENTIALS)) {
  console.log(
    `${QUELLE_CREDENTIALS} fehlt – die Import-Dateien für eine fremde Instanz wurden übersprungen.\n` +
      '  (Zugangsdaten dort anlegen oder als Datei ablegen: {name, type, data} je Credential.)',
  );
  process.exit(0);
}

mkdirSync(ORDNER_FREMD, { recursive: true });

// IDs einmalig erzeugen und merken: Workflow und Credentials müssen bei jedem
// erneuten Import dieselben IDs behalten, sonst entstehen Kopien und die
// Credential-Verweise im Workflow zeigen ins Leere.
const idDatei = `${ORDNER_FREMD}/ids.json`;
const ids = existsSync(idDatei) ? JSON.parse(readFileSync(idDatei, 'utf8')) : { workflow: null, credentials: {} };
ids.credentials ??= {};

const credentials = JSON.parse(readFileSync(QUELLE_CREDENTIALS, 'utf8'));
const idNachTypUndName = new Map();
for (const c of credentials) {
  const schluessel = `${c.type}|${c.name}`;
  ids.credentials[schluessel] ??= neueId();
  c.id = ids.credentials[schluessel];
  idNachTypUndName.set(schluessel, c.id);
}
writeFileSync(`${ORDNER_FREMD}/credentials.json`, JSON.stringify(credentials, null, 2) + '\n');

const fremd = lies(QUELLE_WORKFLOW);
ids.workflow ??= neueId();
fremd.id = ids.workflow;
fremd.nodes.find((n) => n.type.includes('chatTrigger')).webhookId = WEBHOOK_ID_FREMD;
for (const n of fremd.nodes) {
  for (const [typ, ref] of Object.entries(n.credentials ?? {})) {
    const id = idNachTypUndName.get(`${typ}|${ref.name}`);
    if (!id) throw new Error(`Kein Credential für Typ "${typ}" und Namen "${ref.name}" (Knoten ${n.name})`);
    n.credentials[typ] = { id, name: ref.name };
  }
}
writeFileSync(`${ORDNER_FREMD}/vier-pruefer.json`, JSON.stringify(fremd, null, 2) + '\n');
writeFileSync(idDatei, JSON.stringify(ids, null, 2) + '\n');

console.log(`${ORDNER_FREMD}/credentials.json und vier-pruefer.json geschrieben`);
console.log(`  Workflow-ID: ${fremd.id}  (n8n update:workflow --id=${fremd.id} --active=true)`);
console.log(`  Chat-Adresse nach der Aktivierung: /webhook/${WEBHOOK_ID_FREMD}/chat`);
console.log(`  IDs gemerkt in ${idDatei} – bei erneutem Import bleiben sie gleich.`);
