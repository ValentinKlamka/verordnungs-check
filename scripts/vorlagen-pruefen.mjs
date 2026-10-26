// Prüft alle Testfälle aus supabase/seed/testfaelle.sql gegen den laufenden Workflow.
//
// Aufruf: npm run vorlagen:pruefen            (Workflow muss laufen)
//         npm run vorlagen:pruefen -- --url http://localhost:5678/webhook/verordnungs-check/chat
//
// Geprüft wird zweierlei:
//   1. die Ampel (gesamtstatus) gegen die im Seed dokumentierte Erwartung,
//   2. je Fall die dort genannten Befunde (Agent + Feld + Status).
// Am Ende steht eine Übersicht, welche der 18 Prüfkriterien von den Fällen abgedeckt
// sind – das ist der Beleg, dass die Evaluation jedes Kriterium anfasst.
import { readFileSync } from "node:fs";

import { KRITERIEN, kriteriumFuer } from "./kriterien.mjs";

const argumente = process.argv.slice(2);
const index = argumente.indexOf("--url");
const ZIEL = index >= 0 ? argumente[index + 1] : "http://127.0.0.1:5678/webhook/verordnungs-check/chat";
const ZEITLIMIT_MS = 180_000;

const seed = readFileSync(new URL("../supabase/seed/testfaelle.sql", import.meta.url), "utf8");
const faelle = [...seed.matchAll(/\(\s*'([^']*)',\s*'(\{.*?\})',\s*'(\{.*?\})',\s*'([^']*)'\s*\)/gs)].map(
  ([, name, verordnung, erwartet, beschreibung]) => {
    const erwartung = JSON.parse(erwartet);
    return {
      id: (name.match(/^(TF\d+)/) ?? [])[1],
      name: name.replace(/^TF\d+\s+/, ""),
      beschreibung,
      verordnung: JSON.parse(verordnung),
      gesamtstatus: erwartung.gesamtstatus,
      erwartet: erwartung.erwartet ?? [],
    };
  },
);

if (!faelle.length) {
  console.error("Keine Testfälle gefunden.");
  process.exit(1);
}

const kuerzel = { gruen: "🟢", gelb: "🟡", rot: "🔴" };
const alsListe = (status) => (Array.isArray(status) ? status : [status]);

function findeBefund(befunde, erwartung) {
  return befunde.find(
    (b) =>
      b.agent === erwartung.agent &&
      String(b.feld ?? "").toLowerCase().includes(erwartung.feld.toLowerCase()) &&
      alsListe(erwartung.status).includes(b.status),
  );
}

const zeilen = [];
const abdeckung = new Map(KRITERIEN.map((k) => [k.nr, { kriterium: k, faelle: [], bestanden: 0, geprueft: 0 }]));
let fehler = 0;

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
    if (!antwort.ok) throw new Error(`HTTP ${antwort.status}`);
    const ergebnis = await antwort.json();
    const dauer = ((performance.now() - beginn) / 1000).toFixed(1);
    const befunde = ergebnis.befunde ?? [];
    const offen = befunde.filter((b) => b.status !== "ok");
    const status = ergebnis.gesamtstatus ?? "unbekannt";

    const ampelPasst = status === fall.gesamtstatus;
    const befundFehlt = fall.erwartet.filter((erwartung) => !findeBefund(befunde, erwartung));
    const fallPasst = ampelPasst && befundFehlt.length === 0;
    if (!fallPasst) fehler += 1;

    for (const erwartung of fall.erwartet) {
      const kriterium = kriteriumFuer(erwartung);
      if (!kriterium) continue;
      const eintrag = abdeckung.get(kriterium.nr);
      if (!eintrag.faelle.includes(fall.id)) eintrag.faelle.push(fall.id);
      eintrag.geprueft += 1;
      if (findeBefund(befunde, erwartung)) eintrag.bestanden += 1;
    }

    console.log(
      `${fallPasst ? "✓" : "✗"} ${fall.id} ${fall.name.padEnd(36)} ${kuerzel[status] ?? status} (erwartet ${kuerzel[fall.gesamtstatus] ?? fall.gesamtstatus})  ${offen.length} offen  ${dauer} s`,
    );
    if (!ampelPasst) console.log(`      Ampel weicht ab: erwartet ${fall.gesamtstatus}, erhalten ${status}`);
    for (const erwartung of befundFehlt) {
      console.log(`      Befund fehlt: ${erwartung.agent}/${erwartung.feld} (${alsListe(erwartung.status).join("|")})`);
    }
    for (const befund of offen) console.log(`      ${befund.status.padEnd(11)} ${befund.agent}/${befund.feld}`);

    zeilen.push({
      Fall: `${fall.id} ${fall.name}`,
      Erwartet: kuerzel[fall.gesamtstatus] ?? fall.gesamtstatus,
      Erhalten: kuerzel[status] ?? status,
      Befunde: `${fall.erwartet.length - befundFehlt.length}/${fall.erwartet.length}`,
      Offen: offen.length,
      Dauer: `${dauer} s`,
      Ergebnis: fallPasst ? "bestanden" : "Abweichung",
    });
  } catch (problem) {
    fehler += 1;
    zeilen.push({ Fall: `${fall.id} ${fall.name}`, Ergebnis: `Fehler: ${problem.message}` });
    console.log(`✗ ${fall.id} ${fall.name}: ${problem.message}`);
  } finally {
    clearTimeout(uhr);
  }
}

console.log("");
console.table(zeilen);

console.log("\nAbdeckung der 18 Prüfkriterien:");
console.table(
  KRITERIEN.map((k) => {
    const eintrag = abdeckung.get(k.nr);
    return {
      Nr: k.nr,
      Kriterium: k.name,
      Fälle: eintrag.faelle.join(", ") || "–",
      Befund: eintrag.faelle.length ? `${eintrag.bestanden}/${eintrag.geprueft}` : "nicht geprüft",
    };
  }),
);

const ohneFall = [...abdeckung.values()].filter((e) => !e.faelle.length);
const nichtBestanden = [...abdeckung.values()].filter((e) => e.faelle.length && e.bestanden < e.geprueft);

if (ohneFall.length) console.log(`⚠️  ohne Testfall: ${ohneFall.map((e) => e.kriterium.nr).join(", ")}`);
const gesamt = fehler === 0 && !ohneFall.length && !nichtBestanden.length;
console.log(
  gesamt
    ? `\nAlle ${faelle.length} Testfälle bestanden, alle 18 Kriterien abgedeckt.`
    : `\n${faelle.length - fehler} von ${faelle.length} Testfällen bestanden, ${fehler} Abweichung(en), ${ohneFall.length} Kriterium(en) ohne Fall.`,
);
process.exit(gesamt ? 0 : 1);
