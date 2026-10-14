// Bereitet den Workflow-Export für den Import in eine lokale n8n-Instanz vor.
//
// Zwei Anpassungen sind nötig:
//  1. Der Chat-Trigger braucht lokal eine feste webhookId, damit die Adresse
//     http://127.0.0.1:5678/webhook/verordnungs-check-lokal/chat stabil bleibt.
//  2. Der Export enthält keine Workflow-ID. Beim Import in eine schon
//     eingerichtete Instanz legt n8n sonst bei jedem Import eine zweite Kopie
//     an – die ID des vorhandenen Workflows wird deshalb übernommen.
//
// Aufruf:  npm run n8n:vorbereiten
//          npx n8n import:workflow --input=.n8n/tmp/vier-pruefer-lokal.json
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const quelle = 'n8n/vier-pruefer.json';
const ziel = '.n8n/tmp/vier-pruefer-lokal.json';
const datenbank = '.n8n/.n8n/database.sqlite';
const WEBHOOK_ID = 'verordnungs-check-lokal';

const roh = JSON.parse(readFileSync(quelle, 'utf8'));
const wf = Array.isArray(roh) ? roh[0] : roh;
wf.nodes.find((n) => n.type.includes('chatTrigger')).webhookId = WEBHOOK_ID;

if (existsSync(datenbank)) {
  const db = new DatabaseSync(datenbank, { readOnly: true });
  const vorhanden = db.prepare('SELECT id FROM workflow_entity WHERE name = ?').all(wf.name);
  if (vorhanden.length === 1) {
    wf.id = vorhanden[0].id;
    console.log(`ID des vorhandenen Workflows übernommen: ${wf.id}`);
  } else if (vorhanden.length > 1) {
    console.error(`Mehrere Workflows namens "${wf.name}" in der lokalen Instanz – bitte einen löschen.`);
    process.exit(1);
  }
}

mkdirSync('.n8n/tmp', { recursive: true });
writeFileSync(ziel, JSON.stringify(roh, null, 2) + '\n');
console.log(`${ziel} geschrieben (webhookId=${WEBHOOK_ID}, ${wf.nodes.length} Knoten)`);
