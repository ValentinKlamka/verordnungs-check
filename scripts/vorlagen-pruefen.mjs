// Prüft alle Vorlagen (Testfälle aus supabase/seed/testfaelle.sql) gegen den Workflow
// und vergleicht die Ampel mit der dort dokumentierten Erwartung.
//
// Aufruf: npm run vorlagen:pruefen            (Workflow muss laufen)
//         npm run vorlagen:pruefen -- --url http://localhost:5678/webhook/verordnungs-check/chat
//
// Das ist die Evaluationsschleife des Prototyps: Die Erwartung stammt aus den Testfällen,
// nicht aus dem Modell. Abweichungen werden ausgegeben, brechen aber nicht ab – ein
// abweichender Fall ist ein Befund über das Modell, kein Fehler des Skripts.
import { readFileSync } from "node:fs";

const argumente = process.argv.slice(2);
const index = argumente.indexOf("--url");
const ZIEL = index >= 0 ? argumente[index + 1] : "http://127.0.0.1:5678/webhook/verordnungs-check/chat";
const ZEITLIMIT_MS = 180_000;

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), "utf8");

const seed = lies("supabase/seed/testfaelle.sql");
const faelle = [...seed.matchAll(/\(\s*'([^']*)',\s*'(\{.*?\})',\s*'(\{.*?\})',\s*'([^']*)'\s*\)/gs)].map(
  ([, name, verordnung, erwartet, beschreibung]) => ({
    id: (name.match(/^(TF\d+)/) ?? [])[1],
    name: name.replace(/^TF\d+\s+/, ""),
    erwartet: JSON.parse(erwartet).gesamtstatus,
    beschreibung,
    verordnung: JSON.parse(verordnung),
  }),
);

if (!faelle.length) {
  console.error("Keine Testfälle gefunden.");
  process.exit(1);
}

const kuerzel = { gruen: "🟢", gelb: "🟡", rot: "🔴" };
const zeilen = [];
let abweichungen = 0;

for (const fall of faelle) {
  const steuerung = new AbortController();
  const uhr = setTimeout(() => steuerung.abort(), ZEITLIMIT_MS);
  const beginn = performance.now();
  try {
    const antwort = await fetch(ZIEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: steuerung.signal,
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: `seed-${fall.id}-${Date.now()}`,
        chatInput: JSON.stringify(fall.verordnung),
      }),
    });
    const dauer = ((performance.now() - beginn) / 1000).toFixed(1);
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
    const ergebnis = await antwort.json();
    const status = ergebnis.gesamtstatus ?? "unbekannt";
    const offen = (ergebnis.befunde ?? []).filter((b) => b.status !== "ok");
    const passt = status === fall.erwartet;
    if (!passt) abweichungen += 1;
    zeilen.push({
      Fall: `${fall.id} ${fall.name}`,
      Erwartet: kuerzel[fall.erwartet] ?? fall.erwartet,
      Erhalten: kuerzel[status] ?? status,
      Offen: offen.length,
      Dauer: `${dauer} s`,
      Vergleich: passt ? "deckungsgleich" : "Abweichung",
    });
    console.log(
      `${passt ? "✓" : "⚠"} ${fall.id} ${fall.name.padEnd(38)} erwartet ${kuerzel[fall.erwartet]} erhalten ${kuerzel[status]}  ${offen.length} offen  ${dauer} s`,
    );
    for (const befund of offen) console.log(`      ${befund.status.padEnd(11)} ${befund.feld}: ${befund.korrekturhinweis ?? ""}`);
  } catch (problem) {
    abweichungen += 1;
    zeilen.push({ Fall: `${fall.id} ${fall.name}`, Fehler: problem.message });
    console.log(`✗ ${fall.id} ${fall.name}: ${problem.message}`);
  } finally {
    clearTimeout(uhr);
  }
}

console.log("");
console.table(zeilen);
console.log(
  abweichungen === 0
    ? `Alle ${faelle.length} Testfälle deckungsgleich mit der Erwartung.`
    : `${faelle.length - abweichungen} von ${faelle.length} Testfällen deckungsgleich, ${abweichungen} Abweichung(en).`,
);
process.exit(abweichungen === 0 ? 0 : 1);
