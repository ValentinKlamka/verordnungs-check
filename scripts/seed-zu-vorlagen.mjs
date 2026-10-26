// Erzeugt formular/vorlagen-daten.js aus supabase/seed/testfaelle.sql.
//
// Warum generiert: Die Testfälle sind die eine Quelle der Wahrheit (auch für die
// Evaluation). Die Vorlagen-Seite soll nicht auseinanderlaufen, wenn dort ein Fall
// geändert wird. `tests/formular.test.mjs` prüft, dass beide übereinstimmen.
//
// Aufruf: npm run vorlagen:daten
import { readFileSync, writeFileSync } from "node:fs";

const quelle = readFileSync(new URL("../supabase/seed/testfaelle.sql", import.meta.url), "utf8");

// Zeilen der Form: ('Name', '{…verordnung…}', '{…erwartet…}', 'Beschreibung'),
const zeilen = [...quelle.matchAll(/\(\s*'([^']*)',\s*'(\{.*?\})',\s*'(\{.*?\})',\s*'([^']*)'\s*\)/gs)];
if (!zeilen.length) throw new Error("Keine Testfälle in testfaelle.sql gefunden");

const vorlagen = zeilen.map(([, name, verordnung, erwartet, beschreibung]) => {
  const id = (name.match(/^(TF\d+)/) ?? [])[1];
  if (!id) throw new Error(`Testfall ohne TF-Nummer: ${name}`);
  const erwartung = JSON.parse(erwartet);
  return {
    id,
    name: name.replace(/^TF\d+\s+/, ""),
    erwartet: erwartung.gesamtstatus,
    erwartete_befunde: erwartung.erwartet ?? [],
    beschreibung,
    verordnung: JSON.parse(verordnung),
  };
});

const inhalt = `// Erzeugt aus supabase/seed/testfaelle.sql – nicht von Hand bearbeiten.
// Neu erzeugen mit: npm run vorlagen:daten
window.VORLAGEN = ${JSON.stringify(vorlagen, null, 2)};
`;

writeFileSync(new URL("../formular/vorlagen-daten.js", import.meta.url), inhalt);
console.log(`formular/vorlagen-daten.js geschrieben (${vorlagen.length} Vorlagen)`);
for (const vorlage of vorlagen) console.log(`  ${vorlage.id}  erwartet ${vorlage.erwartet.padEnd(6)} ${vorlage.name}`);
