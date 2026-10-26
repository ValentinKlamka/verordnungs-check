// Kleiner Dateiserver für die Erfassungsmaske – kein Build, keine Abhängigkeiten.
//
// Warum ein Server und nicht einfach die Datei im Browser: Die Maske schickt die
// Verordnung an n8n (anderer Port). Aus dem Dateisystem heraus (file://) ist das
// in vielen Browsern blockiert; über http://127.0.0.1 ist es ein normaler Fetch.
//
// Aufruf: npm run formular   →  http://127.0.0.1:4321/muster13.html
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projekt = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const ORDNER = join(projekt, 'formular');
const PORT = Number(process.env.FORMULAR_PORT ?? 4321);
const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (anfrage, antwort) => {
  const pfad = decodeURIComponent(new URL(anfrage.url, 'http://127.0.0.1').pathname);
  const ziel = pfad === '/' ? '/muster13.html' : pfad === '/vorlagen' ? '/vorlagen.html' : pfad;
  const datei = join(ORDNER, normalize(ziel));

  if (!datei.startsWith(ORDNER)) {
    antwort.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Verboten');
    return;
  }

  try {
    const inhalt = await readFile(datei);
    antwort.writeHead(200, {
      'Content-Type': TYPEN[extname(datei)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    antwort.end(inhalt);
  } catch {
    antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Erfassungsmaske: http://127.0.0.1:${PORT}/muster13.html`);
  console.log(`Vorlagen:        http://127.0.0.1:${PORT}/vorlagen`);
  console.log('Beenden mit Strg+C.');
});
