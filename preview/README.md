# Vorschau der ausgefüllten Verordnung

Statische Vorschau einer **ausgefüllten Heilmittelverordnung (Muster 13)** – die
Darstellung der Workflow-Ausgabe, kein eigener Rechenweg. Es gibt keinen Build und
keine Abhängigkeiten: Datei im Browser öffnen, fertig.

Feldliste, Zuordnung Workflow → Vordruck und die Auswahl der zwei ICD-10-Codes:
[`../docs/vordruck-muster13.md`](../docs/vordruck-muster13.md).

## Öffnen

1. `muster13.html` per Doppelklick öffnen (funktioniert auch über `file://`, es
   wird kein lokaler Server gebraucht).
2. Angezeigt wird der **letzte Lauf aus der lokalen n8n-Instanz**, sofern einer
   vorliegt (siehe unten); sonst der synthetische Physiotherapie-Beispielfall aus
   `beispiel-workflow-ausgabe.js`. Oben steht, welche Quelle gerade zu sehen ist.
3. Über **„Workflow-Ausgabe laden (JSON)"** lässt sich eine Ausgabe aus n8n
   einsetzen: im n8n-Workflow **Vier Prüfer** eine Verordnung prüfen, im
   Ausführungsprotokoll den Node **Ergebnis zusammenführen** öffnen, dessen JSON
   kopieren, in eine `.json`-Datei speichern und hier auswählen.

   Erwartet wird das Objekt aus dem Code-Node `Ergebnis zusammenführen`:
   `verordnung_ref`, `eingabe.verordnung`, `eingabe.fakten`, `gesamtstatus`,
   `absetzungsrisiko_eur`, `zusammenfassung`, `diagnose_auswahl`, `befunde`,
   `antwort`.

## Letzten n8n-Lauf anzeigen

```bash
npm run vorschau:lauf      # liest die letzte erfolgreiche Prüfung aus der lokalen n8n-Datenbank
```

Das Skript `aus-n8n-lauf.mjs` liest die SQLite-Datenbank der lokalen Instanz
(nur lesend), holt die Ausgabe des Nodes `Ergebnis zusammenführen` der jüngsten
erfolgreichen Prüfung und schreibt sie nach `letzter-lauf.js`. Danach zeigt die
Vorschau diesen Fall – ein Neuladen der Seite genügt. Die Datei steht in
`.gitignore`, weil sie den zuletzt geprüften Fall enthält (im Prototyp nur
synthetische Daten). Liegt die Instanz woanders (z. B. in Docker), den
Datenordner herausgeholt und den Pfad mitgeben: `--db=Pfad/zu/database.sqlite`
(Abschnitt „n8n in einer bestehenden Instanz" in [`../README.md`](../README.md)).

Schaltflächen: **Letzter n8n-Lauf** (nur aktiv, wenn ein Lauf vorliegt),
**Beispielfall** (synthetischer Fall), **Ansicht 100 % / 150 %**
(gedruckt wird immer A5 in Originalgröße), **Drucken** (`@page: A5`, Seitenleiste
wird nicht mitgedruckt).

## Dateien

| Datei | Zweck |
|---|---|
| `muster13.html` | Aufbau des Vordrucks (Kästen, Felder, Heilmittelzeilen) |
| `muster13.css` | Bildschirm- und Druckdarstellung im A5-Format |
| `muster13.js` | Füllt die Felder aus der Workflow-Ausgabe, Datei-Upload, Zoom, Drucken |
| `beispiel-workflow-ausgabe.js` | Synthetischer Physiotherapie-Fall als Beispieldaten |
| `aus-n8n-lauf.mjs` | Holt den letzten n8n-Lauf in die Vorschau (Node, nur zum Erzeugen) |
| `letzter-lauf.js` | Aus dem Lauf erzeugt, nicht im Repository (siehe `.gitignore`) |

Die Beispieldaten liegen bewusst in einer `.js`-Datei statt in `.json`: Aus dem
Dateisystem heraus (`file://`) blockiert der Browser `fetch()` auf lokale Dateien.
Für echte Daten ist der Datei-Upload in der Oberfläche der vorgesehene Weg.

## Was die Vorschau bewusst nicht tut

- **Nichts rechnen und nichts erfinden.** Fehlt ein Wert in der Workflow-Ausgabe,
  bleibt das Feld leer und wird in der Seitenleiste genannt.
- **Keine Felder erfinden.** „Behandlungsbeginn", „Erst-/Folgeverordnung" und
  „besonderer Verordnungsbedarf" stehen nicht auf dem Vordruck; die Seitenleiste
  erklärt stattdessen, wo die Information hingehört.
- **Keine Diagnoseauswahl.** Welche zwei der erkannten Codes auf den Vordruck
  kommen, entscheidet die Regel im Workflow (Abschnitt 5 in
  [`../docs/vordruck-muster13.md`](../docs/vordruck-muster13.md)); die Vorschau
  zeigt nur das Ergebnis (Karte „Auswahl der zwei Diagnosezeilen") und listet die
  verworfenen Codes mit Begründung.
- **Kein amtlicher Vordruck.** Der Aufdruck „Vorschau – Nachbildung, kein
  amtlicher Vordruck" steht auf dem Blatt, die Positionen sind aus dem
  Originalvordruck vermessen (±1–2 mm).

## Beispiel-Fall (synthetisch)

Physiotherapie, Verordnung über **6× KG bei Lumboischialgie**, Ausstellung
05.10.2026, geplanter Behandlungsbeginn 13.10.2026. Der Freitext nennt vier
Diagnosen, zwei davon stehen auf dem Vordruck (M54.4 führend, M51.1 zweite
Zeile); M17.1 und I10.9 werden mit Begründung verworfen. Alle Angaben sind
erfunden (Musterkasse, erfundene Nummern).

## Prüfen, dass Beispieldaten und Vordruck zusammenpassen

`node tests/vorschau.test.mjs` prüft vier Dinge:

1. Die in den Beispieldaten hinterlegten Fakten stimmen mit dem Code-Node
   `Fristen berechnen` überein (dasselbe Verfahren wie `tests/fakten.test.mjs`).
2. Die Diagnoseauswahl der Beispieldaten stimmt mit dem Code-Node
   `Diagnosen auswählen` überein (führende und zweite Diagnose, verworfene Codes
   mit Begründung, `diagnose_auswahl`).
3. Vordruck (`muster13.html`) und Fülllogik (`muster13.js`) kennen dieselben
   Felder – kein Feld im Markup ohne Zuweisung, keine Zuweisung ohne Feld.
4. Pflichtangaben des Vordrucks sind gesetzt (Personalien, genau zwei
   Diagnosezeilen, Heilmittelbereich, Heilmittel, Frequenz, 9-stellige
   LANR/BSNR).

## Stand

- **Umgesetzt:** Vorschau mit A5-Vordruck, Füllung aus der Workflow-Ausgabe,
  Datei-Upload, Anzeige des letzten lokalen n8n-Laufs, Druck (A5), Seitenleiste mit
  Prüfergebnis, Auswahl der zwei Diagnosezeilen, Feldhinweisen, verworfenen
  Diagnosen und Befunden.
- **Umgesetzt (n8n):** Das Schema `Verordnung` liefert Personalienblock,
  Kennzeichen, Heilmittelbereich, die erkannten `diagnosen[]`, Hausbesuch,
  Therapiebericht, ergänzendes Heilmittel, Therapieziele und Arztangaben; der
  Code-Node `Diagnosen auswählen` belegt die zwei ICD-10-Zeilen nach der Regel in
  [`../docs/vordruck-muster13.md`](../docs/vordruck-muster13.md), Abschnitt 5, und
  meldet seine Entscheidung als `diagnose_auswahl` (auch im Prüfprotokoll,
  Spalte `pruefungen.diagnose_auswahl`).
- **Offen:** Die KBV-Diagnoseliste liegt nur als Text in der Wissensbasis vor.
  Deshalb kann der Code-Node nicht selbst erkennen, ob eine Diagnose den
  besonderen Verordnungsbedarf begründet – das prüft der Diagnose-Prüfer per RAG,
  und die Zeile 2 belegt der Code-Node nach Nennungsreihenfolge. Sobald die Liste
  strukturiert vorliegt (Code, Diagnosegruppe, erforderlicher zweiter Code), kann
  die Regel das bevorzugt auswerten.
- **Offen (Druck):** Ein Overlay auf dem amtlichen Druckstück wird erst mit dem
  Bezug der Originalvordrucke belastbar; die Geometrie ist vermessen (±1–2 mm).

