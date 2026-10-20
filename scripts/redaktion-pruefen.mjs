// Prüft den laufenden Redaktionsdienst mit echten Texten (Modell + Regeln).
// Aufruf: node scripts/redaktion-pruefen.mjs [--url http://127.0.0.1:5680]
// Der Dienst muss laufen (`npm run redaktion:starten`), sonst bricht das Skript mit Hinweis ab.
import assert from "node:assert/strict";

const argumente = process.argv.slice(2);
const index = argumente.indexOf("--url");
const BASIS = index >= 0 ? argumente[index + 1] : "http://127.0.0.1:5680";

const faelle = [
  {
    name: "Verordnung mit allen Personalien",
    text:
      "Verordnung Physiotherapie: Patientin Helene Musterfrau, geb. 03.04.1958, KVNR A123456789, " +
      "wohnhaft Rosenweg 12, 76133 Karlsruhe, Telefon 0721 445566, E-Mail helene.musterfrau@example.de. " +
      "Verordnet von Dr. med. Anna Beispiel, LANR 123456789, BSNR 987654300, Praxis am Markt. " +
      "Diagnose: Lumboischialgie M54.4 als Anlass, Bandscheibenschäden bei Frau Müller M51.1. " +
      "Heilmittel: Krankengymnastik 6x, Frequenz 2x pro Woche, Diagnosegruppe WS, Leitsymptomatik B. " +
      "Ausstellungsdatum 19.10.2026, Behandlungsbeginn 22.10.2026.",
    weg: [
      "Musterfrau",
      "Helene",
      "03.04.1958",
      "A123456789",
      "Rosenweg",
      "76133",
      "Karlsruhe",
      "0721 445566",
      "helene.musterfrau@example.de",
      "123456789",
      "987654300",
      "Anna Beispiel",
      "Markt",
      "Müller"
    ],
    bleibt: ["M54.4", "M51.1", "Lumboischialgie", "Diagnosegruppe WS", "6x", "19.10.2026", "22.10.2026"]
  },
  {
    name: "Name ohne Rollenwort (das kann nur das Modell)",
    text: "Mustermann klagt über Rückenschmerzen, Behandlung bei Kollegin Weber in der Praxis Nordstadt.",
    weg: ["Mustermann", "Weber", "Nordstadt"],
    bleibt: ["Rückenschmerzen"]
  },
  {
    name: "Anschrift mit ss und Telefonnummer",
    text: "Der Patient wohnt in der Hauptstrasse 5 in 80331 München und ist unter 0170 1234567 erreichbar.",
    weg: ["Hauptstrasse 5", "80331", "München", "0170 1234567"],
    bleibt: ["erreichbar"]
  },
  {
    name: "Rein medizinischer Text bleibt unangetastet",
    text:
      "Diagnose Lumboischialgie M54.4, Heilmittel Krankengymnastik 6x, Diagnosegruppe WS, " +
      "Leitsymptomatik B, Behandlungsbeginn 22.10.2026.",
    weg: [],
    bleibt: ["M54.4", "Krankengymnastik 6x", "Diagnosegruppe WS", "Leitsymptomatik B", "22.10.2026"]
  }
];

const gesund = await fetch(`${BASIS}/gesund`).catch(() => null);
if (!gesund?.ok) {
  console.error(`Der Redaktionsdienst antwortet nicht unter ${BASIS}.`);
  console.error("Starten mit: npm run redaktion:starten  (oder npm run redaktion:lokal)");
  process.exit(1);
}
const steckbrief = await gesund.json();
console.log(`Dienst bereit · Modell: ${steckbrief.modell} · Schwelle: ${steckbrief.schwelle}\n`);

let fehler = 0;
for (const fall of faelle) {
  const antwort = await fetch(`${BASIS}/redigieren`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: fall.text })
  });
  const ergebnis = await antwort.json();
  try {
    assert.equal(antwort.status, 200, `HTTP ${antwort.status}`);
    for (const teil of fall.weg) {
      assert.equal(ergebnis.text.includes(teil), false, `nicht entfernt: ${teil}`);
    }
    for (const teil of fall.bleibt) {
      assert.equal(ergebnis.text.includes(teil), true, `versehentlich entfernt: ${teil}`);
    }
    console.log(`✓ ${fall.name} (${ergebnis.dauer_ms} ms · entfernt: ${ergebnis.entfernt.join(", ") || "nichts"})`);
  } catch (problem) {
    fehler += 1;
    console.log(`✗ ${fall.name}: ${problem.message}`);
    console.log(`  Ergebnis: ${ergebnis.text}`);
  }
}

if (fehler > 0) {
  console.error(`\n${fehler} von ${faelle.length} Fällen fehlgeschlagen`);
  process.exit(1);
}
console.log(`\nAlle ${faelle.length} Fälle bestanden`);
