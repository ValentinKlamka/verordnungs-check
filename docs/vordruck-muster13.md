# Vordruck Muster 13: Felder, Zuordnung und Auswahl der Diagnosen

*Stand 14.10.2026 · Grundlage: KBV-/G-BA-Quellen (siehe unten), recherchiert und
gegen den Originalvordruck abgeglichen. Umsetzung: [`../formular/`](../formular/).*

Diese Notiz beantwortet drei Fragen:

1. Welche Felder hat der Vordruck **Muster 13** (Heilmittelverordnung)?
2. Woher kommt jeder Wert in unserer **Workflow-Ausgabe**?
3. Wie werden aus mehreren erkannten Diagnosen die **zwei ICD-10-GM-Zeilen**?

## 1. Quellen

| Kürzel | Dokument | Fundstelle |
|---|---|---|
| **[KBV-Erl]** | KBV: *Erläuterungen zur Vereinbarung über Vordrucke für die vertragsärztliche Versorgung* (Anlage 2 BMV-Ä), Stand 01/2026 | [PDF](https://www.kbv.de/documents/infothek/rechtsquellen/bundesmantelvertrag/anlage-02-vordruckvereinbarung/02_Erlaeuterungen.pdf), Muster 13 = S. 51–55 |
| **[KBV-VV]** | KBV/GKV-SV: *Vereinbarung über Vordrucke* (Vordruckvereinbarung), Stand 05/2026 | Nr. 2.13 (S. 13): Format DIN A5, blaue Flächenfarbe |
| **[KBV-Muster]** | KBV: *Mustersammlung* (Anlage 2) | S. 27 = Originalvordruck Muster 13 (Geometrie hieraus vermessen, ±1–2 mm) |
| **[HeilM-RL]** | G-BA: *Heilmittel-Richtlinie*, iK 05.08.2025 | § 7, § 12, § 13, § 15, § 16 |
| **[HMK]** | G-BA: *Heilmittelkatalog* (Zweiter Teil der HeilM-RL) | Diagnosegruppen WS/EX, Höchstmengen, Leitsymptomatik a)/b)/x) |

## 2. Feldliste in Vordruckreihenfolge

| # | Bereich | Felder |
|---|---|---|
| 1 | Kennzeichen links | **Zuzahlung frei**, **Zuzahlungspflicht**, **Unfallfolgen**, **BVG** (= SER) |
| 2 | Personalienblock | **Krankenkasse bzw. Kostenträger**, **Name, Vorname des Versicherten**, **geb. am**, **Kostenträgerkennung**, **Versicherten-Nr.**, **Status**, **Betriebsstätten-Nr.**, **Arzt-Nr.**, **Datum** (Ausstellungsdatum) |
| 3 | Rechts oben | Titel **Heilmittelverordnung 13** + fünf Bereichskreuze: **Physiotherapie**, **Podologische Therapie**, **Stimm-, Sprech-, Sprach- und Schlucktherapie**, **Ergotherapie**, **Ernährungstherapie** – genau eine Auswahl ([KBV-Erl] S. 52) |
| 4 | Diagnosen | **Behandlungsrelevante Diagnose(n)** mit **ICD-10-Code**: **zwei Codezeilen** + Klartextfeld ([KBV-Erl] S. 52) |
| 5 | Diagnosegruppe / Leitsymptomatik | **Diagnosegruppe**, **Leitsymptomatik gemäß Heilmittelkatalog** mit Kästchen **a), b), c)**, **patientenindividuelle Leitsymptomatik** (Kästchen + Freitextbox darunter) ([KBV-Erl] S. 52; [HMK] S. 61) |
| 6 | Heilmittel | **Heilmittel nach Maßgabe des Kataloges**: **drei Zeilen** für vorrangige Heilmittel + eine Zeile **Ergänzendes Heilmittel**, je mit **Behandlungseinheiten** ([KBV-Erl] S. 53; [HeilM-RL] § 12 Abs. 2–3) |
| 7 | Kennzeichenzeile | **Therapiebericht**, **Hausbesuch** ja/nein, **Therapiefrequenz** ([KBV-Erl] S. 54–55) |
| 8 | Dringlichkeit | **Dringlicher Behandlungsbedarf innerhalb von 14 Tagen** ([KBV-Erl] S. 55) |
| 9 | Freitext | **ggf. Therapieziele / weitere med. Befunde und Hinweise** |
| 10 | Fuß | **IK des Leistungserbringers** (9 Kästchen, trägt der Heilmittelerbringer ein), **Vertragsarztstempel / Unterschrift des Arztes**, Fußzeile **Muster 13 (10.2020)** |

Pflichtangaben: § 13 Abs. 2 HeilM-RL zählt auf, was anzugeben ist – u. a.
Personalienfeld, Heilmittelbereich, Hausbesuch ja/nein, Therapiebericht,
dringlicher Behandlungsbedarf, Anzahl der Behandlungseinheiten, Heilmittel
gemäß Katalog, Therapiefrequenz, Diagnosegruppe, behandlungsrelevante
Diagnose(n), Leitsymptomatik. Ohne vollständige Angaben darf die Behandlung
nicht durchgeführt werden (§ 16 Abs. 1).

## 3. Felder, die der Vordruck **nicht** hat

Für die Umsetzung ebenso wichtig, weil wir sie nicht erfinden dürfen:

| Nicht auf dem Vordruck | Was stattdessen gilt |
|---|---|
| **Behandlungsbeginn** | Kein Feld. Die Frist läuft ab dem **Datum** im Personalienblock: Beginn innerhalb von **28 Kalendertagen**, bei dringlichem Behandlungsbedarf innerhalb von **14 Kalendertagen** (§ 15 Abs. 1 HeilM-RL). |
| **Erst-/Folgeverordnung** | Kein Ankreuzfeld. Der Vordruck kennt den **Verordnungsfall**: gleiche Diagnose (erste 3 Stellen), gleiche Diagnosegruppe, gleicher Arzt; neuer Fall nach 6 Monaten (§ 7 Abs. 1 HeilM-RL). |
| **Besonderer / langfristiger Verordnungsbedarf** | Keine Ankreuzfelder. Geltendmachung **über die ICD-10-GM-Codes** der KBV-Diagnoseliste – genau dafür ist die **zweite Diagnosezeile** da ([KBV-Erl] S. 52; [KBV-DL]). |
| **Arbeitsunfall / Berufskrankheit** | „Unfallfolgen" gilt nur für **sonstige** Unfälle (Haus, Sport, Verkehr). Arbeitsunfall, Berufskrankheit und Schulunfall gehören auf andere Vordrucke (Muster 4, e01 bzw. 16). |
| **Patienten-Pseudonym, Prüfdatum, Historie** | Interne Felder des Prüfsystems, nicht Teil der Verordnung. |

## 4. Zuordnung Vordruck → Workflow-Feld

Die Erfassungsmaske ([`../formular/muster13.js`](../formular/muster13.js)) liest die
Felder des Vordrucks aus und schickt sie als Verordnung-JSON an den Workflow. Beim
Freitext-Weg füllt der Extraktor dieselben Felder aus `eingabe.verordnung` (= `vo`).

Die Spalte „Quelle" nennt, woher der Wert kommt: **Formular** = Eingabe der
Rezeption, **Extraktor** = Schema `Verordnung` im Node „Verordnung erfassen",
**Auswahl** = Code-Node „Diagnosen auswählen" (nur im Freitext-Weg).

| Vordruckfeld | Feld im Verordnung-JSON | Quelle |
|---|---|---|
| Krankenkasse bzw. Kostenträger | `patient.krankenkasse` | Formular · Extraktor |
| Name, Vorname des Versicherten | `patient.nachname`, `patient.vorname` | Formular · Extraktor |
| geb. am | `patient.geburtsdatum` | Formular · Extraktor |
| Kostenträgerkennung | `patient.kostentraegerkennung` | Formular · Extraktor |
| Versicherten-Nr. | `patient.versichertennummer` | Formular · Extraktor |
| Status | `patient.versichertenstatus` | Formular · Extraktor |
| Betriebsstätten-Nr. | `bsnr` | Formular · Extraktor |
| Arzt-Nr. | `lanr` | Formular · Extraktor |
| Datum | `ausstellungsdatum` | Formular · Extraktor |
| Zuzahlung frei / -pflicht | `zuzahlung` (`"frei"` oder `"pflicht"`) | Formular · Extraktor |
| Unfallfolgen | `unfallfolgen` | Formular · Extraktor |
| BVG / SER | `bvg_ser` | Formular · Extraktor |
| Bereichskreuz | `heilmittelbereich` (`"physiotherapie"`, `"podologie"`, `"ssss"`, `"ergotherapie"`, `"ernaehrung"`) | Formular · Extraktor |
| ICD-10-Code Zeile 1 + Klartext | `icd10`, `icd10_bezeichnung` | Formular · Auswahl |
| ICD-10-Code Zeile 2 + Klartext | `weitere_diagnosen[0].code`, `.bezeichnung` | Formular · Auswahl |
| Diagnosegruppe | `diagnosegruppe` | Formular · Extraktor |
| Leitsymptomatik a/b/c | `leitsymptomatik` | Formular · Extraktor |
| patientenindividuelle Leitsymptomatik | Kästchen an, wenn `leitsymptomatik === "x"` oder `leitsymptomatik_freitext` gesetzt; Freitextbox darunter zeigt `leitsymptomatik_freitext` | Formular · Extraktor |
| Heilmittelzeilen 1–3 / ergänzendes Heilmittel | `heilmittel[]` (`name`, `einheiten`, `art`), `ergaenzendes_heilmittel` | Formular · Extraktor |
| Behandlungseinheiten | `heilmittel[].einheiten` | Formular · Extraktor |
| Therapiebericht | `therapiebericht` | Formular · Extraktor |
| Hausbesuch ja/nein | `hausbesuch` | Formular · Extraktor |
| Therapiefrequenz | `frequenz` | Formular · Extraktor |
| Dringlicher Behandlungsbedarf | `dringlich` | Formular · Extraktor |
| Therapieziele / Hinweise | `therapieziele_hinweise` | Formular · Extraktor |
| IK des Leistungserbringers | – | bleibt leer (trägt der Heilmittelerbringer ein) |
| Arztstempel / Unterschrift | `arzt.name`, `arzt.fachrichtung`, `arzt.betriebsstaette` | Formular · Extraktor |
| nicht auf dem Vordruck | `nicht_verordnungsrelevant[]` | Auswahl, mit Begründung je Code |

Zusätzlich, ohne Entsprechung auf dem Vordruck: `diagnosen[]` (alle erkannten
Codes mit `anlass`-Kennzeichen, Grundlage der Auswahl) und `diagnose_auswahl`
(führende und zweite Diagnose, Anzahl erkannter Codes, Hinweise zum fachlichen
Prüfen). Beides landet im Prüfprotokoll (`pruefungen.eingabe`,
`pruefungen.diagnose_auswahl`, siehe [`../supabase/migrations/002_diagnose_auswahl.sql`](../supabase/migrations/002_diagnose_auswahl.sql)).

## 5. Auswahlregel für die zwei Diagnosen

Auf den Vordruck passen **zwei** ICD-10-GM-Codes. Erkannt werden im Freitext
häufig mehr. Die Regel ist als Code-Node **Diagnosen auswählen** umgesetzt –
deterministisch, damit sie prüfbar bleibt
([`../tests/diagnosen.test.mjs`](../tests/diagnosen.test.mjs)):

1. **Sammeln:** alle Diagnosen mit ICD-10-GM-Code aus dem Freitext, in der
   Reihenfolge ihrer Nennung, ohne Doppelte.
2. **Verordnungsbezug prüfen:** Ein Code ist verordnungsrelevant, wenn er zur
   **Diagnosegruppe** des Heilmittels passt (Zuordnung ICD-Bereich → WS/EX ist
   bereits im Code-Node `Fristen berechnen` vorhanden). Ob eine Diagnose
   zusätzlich über die **KBV-Diagnoseliste** den besonderen Verordnungsbedarf
   begründet, prüft der **Diagnose-Prüfer** per RAG – der Code-Node kann das
   nicht, solange die Liste nur als Text vorliegt (Abschnitt 6).
3. **Reihenfolge festlegen:**
   - **Zeile 1 = führende Diagnose:** der Code, der Anlass und Gegenstand der
     Verordnung ist (der zum Heilmittel passende, in der Regel der im Freitext
     zuerst genannte Beschwerdegrund). Passt der Anlass-Code nicht zur
     Diagnosegruppe, führt der erste passende Code und der Node weist darauf hin.
   - **Zeile 2 = zweite Diagnose:** der nächste passende Code in
     Nennungsreihenfolge – im Regelfall die Diagnose, die den besonderen
     Verordnungsbedarf begründet.
4. **Alles Übrige** kommt nach `nicht_verordnungsrelevant` mit Begründung –
   sichtbar in der Vorschau, damit die Rezeption die Auswahl prüfen kann. Es
   wird nichts stillschweigend verworfen.
5. **Gleichstand:** Passen mehr als zwei Codes gleich gut, stehen die
   Alternativen als Hinweis („fachlich prüfen") in `diagnose_auswahl.hinweise`
   und in der Vorschau; die Rezeption entscheidet.

Beispiel aus dem Beispielfall ([`../formular/`](../formular/)) – im Freitext-Weg
liefert der Code-Node dieselbe Auswahl:

| Code | Bezeichnung | Entscheidung |
|---|---|---|
| M54.4 | Lumboischialgie | **Zeile 1** – Anlass der Verordnung, Diagnosegruppe WS passt zu KG |
| M51.1 | Lumbale Bandscheibenschäden mit Radikulopathie | **Zeile 2** – begründet die Therapie mit, gleiche Region; steht auf der Diagnoseliste (vom Diagnose-Prüfer per RAG bestätigt) |
| M17.1 | Sonstige primäre Gonarthrose | verworfen – andere Körperregion |
| I10.9 | Essentielle Hypertonie | verworfen – internistische Begleiterkrankung ohne Heilmittelbezug |

## 6. Offene Punkte

1. **Geometrie:** Die Vorschau nutzt die aus dem Originalvordruck vermessenen
   Positionen (±1–2 mm) und ist als Nachbildung gekennzeichnet. Für ein
   pixelgenaues Overlay oder den Ausdruck auf Originalvordrucken ist das
   Druckstück bzw. die Bezugsquelle der KV nötig.
2. **Ankreuzlogik „Zuzahlung frei/pflichtig“:** Feld belegt, die Regel dazu ist
   in den gesichteten Quellen nicht beschrieben (belegt sind nur Höhe und
   Befreiungen, [KBV-PW] S. 5).
3. **Diagnoseliste maschinenlesbar:** Für Zeile 2 und den Hinweis „besonderer
   Verordnungsbedarf“ müsste die KBV-Diagnoseliste strukturiert vorliegen
   (Code, Diagnosegruppe, erforderlicher zweiter Code) – bisher liegt sie nur
   als Text in der Wissensbasis. Solange prüft der Diagnose-Prüfer den
   besonderen Verordnungsbedarf per RAG, und der Code-Node belegt Zeile 2 nach
   Nennungsreihenfolge.
4. **Druck:** Die Vorschau ist für A5 eingerichtet (`@page`). Ein echtes
   Formular-Overlay wird erst mit dem amtlichen Druckstück belastbar.
