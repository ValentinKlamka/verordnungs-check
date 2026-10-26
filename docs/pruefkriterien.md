# Die 18 Prüfkriterien des Verordnungs-Checks

Stand 26.10.2026 · Workflow „Verordnungs-Check – Vier Prüfer" (n8n)

Der Verordnungs-Check prüft eine Heilmittelverordnung (Physiotherapie, Muster 13) mit
vier spezialisierten Agenten. Sie liefern zusammen **18 Prüfpunkte**: 10 zum Formalbereich,
3 zur Diagnose, 3 zu den Mengen und 2 zu den Fristen.

> Nachgezählt an erfolgreichen Läufen (jeweils 10 + 3 + 3 + 2 = 18). Die Zahl in der
> Antwort ist die Länge der Befundliste, kein fest verdrahteter Katalog.

## Statuswerte

| Status | Bedeutung |
|---|---|
| `ok` | in Ordnung |
| `fehlt` | Pflichtangabe leer |
| `fehlerhaft` | Regelverstoß, der zur Absetzung führen kann |
| `hinweis` | die Rezeption muss etwas beachten oder tun |

## 1. Formal-Prüfer – 10 Prüfpunkte

Mandat: Vollständigkeit und Form der Pflichtangaben (HeilM-RL § 13 Abs. 2, Vordruck).
Für jedes Feld genau ein Befund.

| # | Prüfpunkt | Was geprüft wird | Entscheidungsgrundlage |
|---|---|---|---|
| 1 | Kostenträger | ausgefüllt? | Code-Fakt `pflichtangaben.kostentraeger` |
| 2 | LANR | ausgefüllt? + 9 Ziffern? | `pflichtangaben.lanr`, `lanr_format_ok` |
| 3 | BSNR | ausgefüllt? + 9 Ziffern? | `pflichtangaben.bsnr`, `bsnr_format_ok` |
| 4 | Ausstellungsdatum | vorhanden? | `pflichtangaben.ausstellungsdatum` |
| 5 | Unterschrift | liegt vor? | `pflichtangaben.unterschrift` |
| 6 | ICD-10-Code | mindestens einer vorhanden? | `pflichtangaben.icd10` |
| 7 | Diagnosegruppe | ausgefüllt? | `pflichtangaben.diagnosegruppe` |
| 8 | Leitsymptomatik | Buchstabe a/b/c **oder** patientenindividueller Freitext? | `pflichtangaben.leitsymptomatik` |
| 9 | Heilmittel mit Einheitenzahl | mindestens eines mit Einheiten > 0? | `pflichtangaben.heilmittel_mit_einheiten` |
| 10 | Therapiefrequenz | ausgefüllt? | `pflichtangaben.frequenz` |

Alle zehn Werte werden **vor** der PII-Redaktion aus der Original-Verordnung ermittelt und
den Agenten als verbindliche Fakten mitgegeben. Grund: Nach der Redaktion steht bei
LANR/BSNR nur noch ein Marker (`[LANR]`), der nicht als „leer" gelesen werden darf.

## 2. Diagnose-Prüfer – 3 Prüfpunkte

Mandat: inhaltliche Passung. Quellen: Heilmittelkatalog (G-BA), KBV-Diagnoseliste.

| # | Prüfpunkt | Was geprüft wird | Entscheidungsgrundlage |
|---|---|---|---|
| 11 | Diagnosegruppe | Passt die Körperregion des ICD-Codes zur angegebenen Gruppe? WS = Hals-/Brust-/Lendenwirbelsäule, EX = Schulter, Arm, Hand, Becken, Hüfte, Knie, Unterschenkel, Fuß | Code-Fakt `diagnosegruppe_passt_zu_icd`, wenn die Region aus dem Code ableitbar ist (M40–M54, ausgewählte S15/S16/S22/S23/S32/S33 → WS; M15–M25, M75–M77, S40–S99 → EX); sonst Vektorsuche |
| 12 | Leitsymptomatik | Ist a/b/c für diese Diagnosegruppe zulässig? | Modell + Vektorsuche (Heilmittelkatalog) |
| 13 | Besonderer Verordnungsbedarf | Steht der Code auf der KBV-Diagnoseliste (besonderer / langfristiger Heilmittelbedarf)? | Vektorsuche (KBV-Diagnoseliste); **nie** `fehlt` oder `fehlerhaft`, nur `hinweis` oder `ok` |

## 3. Mengen-Prüfer – 3 Prüfpunkte

Mandat: Höchstmengen und Kombinationen. Quelle: Heilmittelkatalog (G-BA), Zweiter Teil der
HeilM-RL.

| # | Prüfpunkt | Was geprüft wird | Entscheidungsgrundlage |
|---|---|---|---|
| 14 | Einheiten je Verordnung | Höchstmenge je Verordnung überschritten? Für WS und EX in der Physiotherapie in der Regel bis zu 6 Einheiten; Ausnahme: besonderer oder langfristiger Verordnungsbedarf (bis 12 Wochen) | Code zählt (`summe_einheiten`), Vektorsuche für die Grenze |
| 15 | Heilmittel-Kombination | Höchstens drei vorrangige Heilmittel; ergänzende Heilmittel nicht mehr Einheiten als vorrangige | Code zählt (`anzahl_vorrangige_heilmittel`), Vektorsuche für die Regel |
| 16 | Therapiefrequenz | Liegt die Frequenz im empfohlenen Rahmen der Diagnosegruppe (z. B. 1–3× wöchentlich)? | Modell + Vektorsuche |

## 4. Fristen-Prüfer – 2 Prüfpunkte

Mandat: Behandlungsbeginn und Unterbrechung. Der Agent rechnet **keine** Tage selbst – er
liest ausschließlich die berechneten Fakten. Er arbeitet ohne Werkzeug, weil sein Mandat
vollständig durch diese Fakten bestimmt ist.

| # | Prüfpunkt | Was geprüft wird | Entscheidungsgrundlage |
|---|---|---|---|
| 17 | Behandlungsbeginn | Beginnt die Behandlung innerhalb von 28 Tagen nach Ausstellung (14 Tagen bei dringlichem Behandlungsbedarf)? Fundstelle: HeilM-RL § 15 | Code-Fakt `beginn_fristgerecht`, `tage_ausstellung_bis_beginn`, `frist_grenze_tage` |
| 18 | Unterbrechung | Liegt die Unterbrechung ≤ 14 Tage bzw. ist sie begründet? Fundstelle: HeilM-RL § 15 und § 16 | Code-Fakt `unterbrechung_zulaessig`, `tage_unterbrechung` |

Ein Wert `null` heißt „nicht anwendbar" und ergibt `ok` (z. B. keine frühere Behandlung
angegeben). Ist die Behandlung bereits begonnen, gilt der Behandlungsbeginn als geprüft.

## Testfälle: jedes Kriterium ist abgedeckt

`supabase/seed/testfaelle.sql` enthält **23 Testfälle**. Jeder Fall ändert gegenüber dem
grünen Basisfall (TF01) genau eine Sache, damit der Befund eindeutig zuzuordnen ist.
TF01–TF10 sind die ursprünglichen Fälle und Kontrollfälle, TF11–TF23 schließen die
Lücken zu den Kriterien.

| # | Kriterium | Testfall |
|---|---|---|
| 1 | Kostenträger | TF11 |
| 2 | LANR (ausgefüllt, 9 Ziffern) | TF05 (fehlt), TF12 (Format) |
| 3 | BSNR (ausgefüllt, 9 Ziffern) | TF13 |
| 4 | Ausstellungsdatum | TF14 |
| 5 | Unterschrift | TF15 |
| 6 | ICD-10-Code vorhanden | TF16 |
| 7 | Diagnosegruppe vorhanden | TF17 |
| 8 | Leitsymptomatik vorhanden | TF05, TF18 |
| 9 | Heilmittel mit Einheitenzahl | TF19 |
| 10 | Therapiefrequenz vorhanden | TF20 |
| 11 | Diagnosegruppe passt zum ICD-Code | TF03, TF09 |
| 12 | Leitsymptomatik zulässig | TF18 |
| 13 | Besonderer Verordnungsbedarf | TF23 |
| 14 | Einheiten je Verordnung (Höchstmenge) | TF04 |
| 15 | Heilmittel-Kombination | TF21 |
| 16 | Therapiefrequenz im Rahmen | TF22 |
| 17 | Behandlungsbeginn (Frist) | TF02, TF07 |
| 18 | Unterbrechung (Frist) | TF06 |

Die Erwartung steht im Seed als Liste von Befunden
(`{"agent":"…","feld":"…","status":"…"}`); `feld` wird als Teilstring geprüft, `status`
darf eine Liste sein, wenn die Regel mehrere Ausgänge zulässt (z. B. „fehlerhaft" oder
„hinweis").

```bash
npm run vorlagen:pruefen     # prüft Ampel und Befunde, gibt die Abdeckungstabelle aus
```

Die Kriterienliste selbst steht in [`../scripts/kriterien.mjs`](../scripts/kriterien.mjs);
`tests/formular.test.mjs` schlägt fehl, wenn ein Kriterium keinen Testfall mehr hat.

## Drei Hinweise zur Einordnung

**1. Drei Felder kommen absichtlich doppelt vor.** Diagnosegruppe (7/11), Leitsymptomatik
(8/12) und Therapiefrequenz (10/16) werden zweimal geprüft: einmal auf *Vorhandensein*
(Formal), einmal auf *inhaltliche Passung* (Diagnose bzw. Menge). „Fehlt" und „passt nicht"
sind unterschiedliche Absetzungsrisiken und werden deshalb getrennt ausgewiesen.

**2. 13 der 18 Prüfpunkte sind deterministisch.** Die zehn Formal-Punkte und die zwei
Fristen kommen aus berechnetem Code, die Diagnosegruppe zusätzlich bei bekanntem
ICD-Bereich. Nur bei den übrigen entscheidet das Sprachmodell über gefundene
Fundstellen – dort kann der Status zwischen Läufen schwanken.

**3. Sichtbar sind in der Antwort nur die nicht-grünen Zeilen.** Alle 18 Befunde stehen im
JSON-Feld `befunde` der Antwort und im Prüfprotokoll (`befunde` in Supabase); die Tabelle
im Chat filtert auf `fehlt`, `fehlerhaft` und `hinweis`.

## Nicht geprüft (bewusst außerhalb des Scopes)

- Verordnungsfall / 6-Monats-Regel über mehrere Verordnungen (§ 7 HeilM-RL) – für Sprint 2
  vorgesehen
- Erst-/Folgeverordnung – kennt der Vordruck Muster 13 nicht
- Wirtschaftlichkeit und medizinische Notwendigkeit jenseits des Heilmittelkatalogs
- Korrektheit der Stammdaten (Krankenkasse, Versichertenstatus, IK)
- Prüfziffern von LANR/BSNR (nur Format: 9 Ziffern)
