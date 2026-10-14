# Evaluation

*Verantwortlich: Süle · Testläufe am 13.10.2026 · Modell gpt-4.1-mini (Temperatur 0,1)*

## Vorgehen

1. **Baseline:** Sieben synthetische Testverordnungen (TF01–TF07) mit der ersten Version des Workflows.
2. **Fehleranalyse:** Jeder Befund ohne passenden erwarteten Fehler gilt als Fehlalarm und wird einer Ursache zugeordnet.
3. **Nachbessern in drei Schritten (v2–v4).** Dabei kein „Lernen auf den Test“: In den Prompts stehen keine ICD-Codes aus den Testfällen.
4. **Kontrollfälle:** Drei neue Fälle (TF08–TF10) wurden erst nach dem Nachbessern angelegt und nie zum Tuning verwendet. Sie zeigen, ob die Verbesserung verallgemeinert.

Testdaten: `supabase/seed/testfaelle.sql` und Tabelle `testfaelle`. Alle Ergebnisse stehen in den Tabellen `pruefungen` und `befunde`.

## Ergebnis auf einen Blick

| Kennzahl | Baseline (v1, 7 Fälle) | Final (v4, 10 Fälle) |
|---|---|---|
| Erwartete Fehler erkannt (Trefferquote) | 8 von 8 (100 %) | 9 von 9 (100 %) |
| Ampel korrekt | 6 von 7 | **10 von 10** |
| Kritische Fehlalarme (fälschlich „fehlt“ oder „fehlerhaft“) | 12 | **0** |
| Unnötige Hinweise | 10 | 0 (2 Hinweise, beide berechtigt) |
| Laufzeit je Prüfung (Durchschnitt) | 26,0 s | 24,0 s |
| Kosten je Prüfung | ca. 3–4 Cent (11 LLM-Aufrufe, rund 77.000 Eingabetoken laut n8n-Schätzung) | gleich |

**Kernaussage:** Erkannt hat das System die Fehler von Anfang an. Das Problem waren Fehlalarme. Eine Rezeption, die bei jeder korrekten Verordnung Rot sieht, ignoriert das Werkzeug nach einer Woche. Deshalb war die Senkung der Fehlalarme von 12 auf 0 die eigentliche Arbeit.

## Ergebnisse je Testfall (finale Version v4)

| Nr. | Fall | Erwarteter Befund | Erwartet | Ergebnis | Bestanden |
|---|---|---|---|---|---|
| TF01 | Vollständig und regelkonform | keiner | grün | grün, keine Befunde | ✅ |
| TF02 | Behandlungsbeginn 41 Tage nach Ausstellung | Fristen-Prüfer: Behandlungsbeginn | rot | rot, Behandlungsbeginn fehlerhaft | ✅ |
| TF03 | Schulter-Diagnose (M75.1) mit Diagnosegruppe WS | Diagnose-Prüfer: Diagnosegruppe | rot | rot, Diagnosegruppe fehlerhaft | ✅ |
| TF04 | 10 Einheiten bei WS | Mengen-Prüfer: Einheiten | rot | rot, Einheiten fehlerhaft | ✅ |
| TF05 | Leitsymptomatik und LANR fehlen | Formal-Prüfer: Leitsymptomatik, LANR | rot | rot, beide „fehlt“ (+ Verweis des Diagnose-Prüfers) | ✅ |
| TF06 | 22 Tage Unterbrechung ohne Grund | Fristen-Prüfer: Unterbrechung | rot | rot, Unterbrechung fehlerhaft | ✅ |
| TF07 | Dringlich, Beginn nach 18 Tagen | Fristen-Prüfer: Behandlungsbeginn | rot | rot, Behandlungsbeginn fehlerhaft | ✅ |
| TF08 | *Kontrollfall:* Gonarthrose (M17.1) mit EX, korrekt | keiner | grün | grün, keine Befunde | ✅ |
| TF09 | *Kontrollfall:* HWS-Bandscheibe (M50.1) mit EX | Diagnose-Prüfer: Diagnosegruppe | rot | rot, Diagnosegruppe fehlerhaft + Hinweis KBV-Diagnoseliste | ✅ |
| TF10 | *Kontrollfall:* dringlich, Beginn nach 7 Tagen | keiner | grün | grün, keine Befunde | ✅ |

Der Hinweis bei TF09 ist korrekt: M50.1 steht tatsächlich auf der KBV-Diagnoseliste (zervikaler Bandscheibenschaden mit Radikulopathie). Das wurde in der Wissensbasis nachgeprüft.

## Fehleranalyse der Baseline

| Fehlalarm | Häufigkeit | Ursache | Maßnahme |
|---|---|---|---|
| Leitsymptomatik „a“ als fehlend, fehlerhaft oder unklar gemeldet | 6 von 6 Fällen mit Angabe | Prüfer kannte die Kodierung a/b/c des Formulars nicht | v2: Kodierung im Prompt erklärt |
| LANR/BSNR als fehlerhaft gemeldet | 4 von 7 | LLM versuchte, Prüfziffern „im Kopf“ zu prüfen, mit zufälligem Ergebnis | v2: Formatprüfung (9 Ziffern) in den Code verlagert |
| „Besonderer Verordnungsbedarf“ als Hinweis oder sogar „fehlt“ | 6 von 7 | Unklare Anweisung: Hinweis auch dann, wenn der Code *nicht* auf der Liste steht | v2: nur bei Treffer ein Hinweis, sonst „ok“ |
| Therapiefrequenz als Hinweis | 2 von 7 | Keine klare Schwelle | v2: Hinweis nur bei belegter Abweichung |
| Behandlungsbeginn bei laufender Behandlung als Hinweis | 1 von 7 | Sonderfall „bereits begonnen“ nicht erklärt | v2: Regel ergänzt |
| Knie-Code S83.5 der Wirbelsäule zugeordnet | v2: 2 Fälle, v3: 1 Fall | **Wissenslücke des Modells:** Es kennt die ICD-Systematik nicht zuverlässig, Prompts halfen nur teilweise | v4: Zuordnung ICD-Bereich → WS/EX im Code |

## Wichtigster Fehlermodus

**Das Sprachmodell „weiß“ Dinge falsch, und zwar mit Begründung.** In Version 3 schrieb der Diagnose-Prüfer: „ICD-10-Code S83.5 gehört zur Diagnosegruppe WS, nicht EX.“ S83.5 ist eine Knieverletzung. Der Befund klingt plausibel, nennt eine Fundstelle und ist trotzdem falsch. Für die Rezeption ist so ein Fehler kaum zu erkennen.

Bessere Prompts haben das nur teilweise behoben: Von v2 auf v3 sank der Fehler von zwei Fällen auf einen, verschwand aber nicht. Erst als die Zuordnung in den Code wanderte, war er weg.

**Lehre für die Architektur:** Was sich als Regel aufschreiben lässt (Fristen, Formate, ICD-Bereiche), gehört in den Code. Das LLM übernimmt nur, was Sprachverständnis braucht: Freitext erfassen, Regelwerk durchsuchen, Befunde verständlich formulieren.

## Grenzen dieser Evaluation

- 10 synthetische Fälle sind ein Funktionsnachweis, keine Statistik. Bei einem LLM schwankt das Ergebnis zwischen zwei Läufen. Jeder Fall lief in der finalen Version einmal.
- Die ICD-Zuordnung im Code deckt nur die häufigsten Muskel-Skelett-Bereiche ab (WS, EX). Andere Diagnosegruppen (z. B. ZN, AT) beurteilt weiterhin das LLM.
- Die KBV-Diagnoseliste gilt nur zusammen mit der dort genannten Diagnosegruppe und teils mit einem zweiten ICD-Code (bei M50.1: G55.1). Das prüft der Prototyp noch nicht.
- Das Absetzungsrisiko rechnet mit einer angenommenen Vergütung von 28 € je Einheit. Der echte Wert kommt aus dem Ist-Interview mit der Praxis.
- Die Testfälle hat das Team selbst geschrieben. Echte Verordnungen (anonymisiert) können Fehlerarten enthalten, an die wir nicht gedacht haben.

## Verbesserungsplan

| Priorität | Maßnahme | Nutzen |
|---|---|---|
| 1 | Jeden Testfall 3× laufen lassen und Abweichungen zählen | Stabilität statt Einzelergebnis |
| 2 | 10–20 anonymisierte echte Verordnungen aus der Praxis als Testfälle (mit Einwilligung) | Realistische Fehlerarten |
| 3 | KBV-Diagnoseliste strukturiert laden (Code, Gruppe, Sekundärcode) statt nur als Text | Hinweis „besonderer Verordnungsbedarf“ vollständig und korrekt |
| 4 | ICD-Zuordnung im Code um weitere Diagnosegruppen erweitern | Weniger Abhängigkeit vom LLM |
| 5 | Kostenmessung über das OpenRouter-Dashboard statt Schätzung | Belastbarer Business Case |

## Automatische Tests für den Code-Anteil

`tests/fakten.test.mjs` prüft den Code-Knoten „Fristen berechnen“ direkt aus dem Workflow-Export: Fristgrenzen (28 und 14 Tage, jeweils genau an der Grenze), Unterbrechung mit und ohne Grund, LANR-Format und die ICD-Zuordnung.

```bash
node tests/fakten.test.mjs   # 13/13 Tests bestanden
```
