// Die 18 Prüfkriterien als eine Quelle für Prüfskript und Test.
//
// `agent` und `feld` bilden den Befund ab, den der Workflow liefert; `feld` wird als
// Teilstring geprüft, weil die Prüfer die Bezeichnung leicht anders formulieren
// („Einheiten je Verordnung" vs. „Höchstmenge"). Die Reihenfolge entspricht
// docs/pruefkriterien.md.
export const KRITERIEN = [
  { nr: 1, name: "Kostenträger", agent: "formal", feld: "Kostenträger" },
  { nr: 2, name: "LANR (ausgefüllt, 9 Ziffern)", agent: "formal", feld: "LANR" },
  { nr: 3, name: "BSNR (ausgefüllt, 9 Ziffern)", agent: "formal", feld: "BSNR" },
  { nr: 4, name: "Ausstellungsdatum", agent: "formal", feld: "Ausstellungsdatum" },
  { nr: 5, name: "Unterschrift", agent: "formal", feld: "Unterschrift" },
  { nr: 6, name: "ICD-10-Code vorhanden", agent: "formal", feld: "ICD-10" },
  { nr: 7, name: "Diagnosegruppe vorhanden", agent: "formal", feld: "Diagnosegruppe" },
  { nr: 8, name: "Leitsymptomatik vorhanden", agent: "formal", feld: "Leitsymptomatik" },
  { nr: 9, name: "Heilmittel mit Einheitenzahl", agent: "formal", feld: "Heilmittel" },
  { nr: 10, name: "Therapiefrequenz vorhanden", agent: "formal", feld: "Therapiefrequenz" },
  { nr: 11, name: "Diagnosegruppe passt zum ICD-Code", agent: "diagnose", feld: "Diagnosegruppe" },
  { nr: 12, name: "Leitsymptomatik zulässig", agent: "diagnose", feld: "Leitsymptomatik" },
  { nr: 13, name: "Besonderer Verordnungsbedarf", agent: "diagnose", feld: "Verordnungsbedarf" },
  { nr: 14, name: "Einheiten je Verordnung (Höchstmenge)", agent: "menge", feld: "Einheiten" },
  { nr: 15, name: "Heilmittel-Kombination", agent: "menge", feld: "Kombination" },
  { nr: 16, name: "Therapiefrequenz im Rahmen", agent: "menge", feld: "Therapiefrequenz" },
  { nr: 17, name: "Behandlungsbeginn (Frist)", agent: "frist", feld: "Behandlungsbeginn" },
  { nr: 18, name: "Unterbrechung (Frist)", agent: "frist", feld: "Unterbrechung" },
];

// Ordnet einen erwarteten Befund dem Kriterium zu, das er abdeckt.
export function kriteriumFuer(erwartet) {
  return KRITERIEN.find(
    (k) => k.agent === erwartet.agent && erwartet.feld.toLowerCase().includes(k.feld.toLowerCase()),
  );
}
