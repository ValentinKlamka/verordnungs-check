# Vorschau der ausgefüllten Verordnung

Statische Vorschau einer **ausgefüllten Heilmittelverordnung (Muster 13)** – die
Darstellung der Workflow-Ausgabe, kein eigener Rechenweg. Es gibt keinen Build und
keine Abhängigkeiten: Datei im Browser öffnen, fertig.

Feldliste, Zuordnung Workflow → Vordruck und die Auswahl der zwei ICD-10-Codes:
[`../docs/vordruck-muster13.md`](../docs/vordruck-muster13.md).

## Öffnen

1. `muster13.html` per Doppelklick öffnen (funktioniert auch über `file://`, es
   wird kein lokaler Server gebraucht).
2. Standardmäßig wird der synthetische Physiotherapie-Beispielfall aus
   `beispiel-workflow-ausgabe.js` angezeigt.
3. Über **„Workflow-Ausgabe laden (JSON)"** lässt sich eine echte Ausgabe aus n8n
   einsetzen: im n8n-Workflow **Vier Prüfer** eine Verordnung prüfen, im
   Ausführungsprotokoll den Node **Ergebnis zusammenführen** öffnen, dessen JSON
   kopieren, in eine `.json`-Datei speichern und hier auswählen.

   Erwartet wird das Objekt aus dem Code-Node `Ergebnis zusammenführen`:
   `verordnung_ref`, `eingabe.verordnung`, `eingabe.fakten`, `gesamtstatus`,
   `absetzungsrisiko_eur`, `zusammenfassung`, `befunde`, `antwort`.

Schaltflächen: **Beispielfall** (zurücksetzen), **Ansicht 100 % / 150 %**
(gedruckt wird immer A5 in Originalgröße), **Drucken** (`@page: A5`, Seitenleiste
wird nicht mitgedruckt).

## Dateien

| Datei | Zweck |
|---|---|
| `muster13.html` | Aufbau des Vordrucks (Kästen, Felder, Heilmittelzeilen) |
| `muster13.css` | Bildschirm- und Druckdarstellung im A5-Format |
| `muster13.js` | Füllt die Felder aus der Workflow-Ausgabe, Datei-Upload, Zoom, Drucken |
| `beispiel-workflow-ausgabe.js` | Synthetischer Physiotherapie-Fall als Beispieldaten |

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
  zeigt nur das Ergebnis und listet die verworfenen Codes mit Begründung.
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

`node tests/vorschau.test.mjs` prüft drei Dinge:

1. Die in den Beispieldaten hinterlegten Fakten stimmen mit dem Code-Node
   `Fristen berechnen` überein (dasselbe Verfahren wie `tests/fakten.test.mjs`).
2. Vordruck (`muster13.html`) und Fülllogik (`muster13.js`) kennen dieselben
   Felder – kein Feld im Markup ohne Zuweisung, keine Zuweisung ohne Feld.
3. Pflichtangaben des Vordrucks sind gesetzt (Personalien, genau zwei
   Diagnosezeilen, Heilmittelbereich, Heilmittel, Frequenz, 9-stellige
   LANR/BSNR).

## Stand

- **Umgesetzt:** Vorschau mit A5-Vordruck, Füllung aus der Workflow-Ausgabe,
  Datei-Upload, Druck (A5), Seitenleiste mit Prüfergebnis, Feldhinweisen,
  verworfenen Diagnosen und Befunden.
- **Offen (n8n):** Der Workflow liefert bisher eine ICD-10-GM (`icd10`) und keine
  Patienten-, Kennzeichen- oder Stammdatenfelder. Für ein vollständig
  ausgefülltes Muster 13 muss das Schema `Verordnung` erweitert werden
  (Patientenblock, `weitere_diagnosen`, `verordnungsart`-frei, `hausbesuch`,
  `therapiebericht`, `unfallfolgen`, `bvg_ser`, `zuzahlung`,
  `ergaenzendes_heilmittel`, `therapieziele_hinweise`) und ein Code-Node die zwei
  Diagnosen nach der Regel aus `docs/vordruck-muster13.md` auswählen.

