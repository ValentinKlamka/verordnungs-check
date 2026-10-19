# PII-Redaktion

*Stand 19.10.2026 · gilt für den Workflow „Verordnungs-Check – Vier Prüfer"*

Eine Heilmittelverordnung enthält personenbezogene Daten (Name, Geburtsdatum,
Versichertennummer, Arzt- und Praxisangaben) und Gesundheitsdaten (Diagnosen). Die
Prüf-Agenten sind LLM-Aufrufe über OpenRouter – dorthin dürfen keine direkten
Identifikatoren gehen. Deshalb steht vor den Agenten ein eigener Code-Knoten, der die
Verordnung pseudonymisiert.

## Wo die Redaktion sitzt

```
Fristen berechnen  →  PII entfernen  →  Formal-, Diagnose-, Mengen-, Fristen-Prüfer
         │
         └─→ Ergebnis zusammenführen → Protokoll (Supabase, vollständige Daten)
```

`PII entfernen` ersetzt Werte, **bevor** ein Modell sie sieht. Das Original bleibt im
Workflow erhalten (`Ergebnis zusammenführen` liest weiterhin `Fristen berechnen`), damit
Prüfprotokoll und Vorschau die echten Daten zeigen.

Zwei Eingabewege, zwei Redaktionen:

| Weg | Redaktion | Charakter |
|---|---|---|
| Formular (A5-Maske, n8n-Formular) | feldbasiert: Identifikatoren werden durch Marker ersetzt, Freitexte entfernt | vollständig, deterministisch, getestet |
| Freitext im Chat | Muster-Ersetzung auf dem Rohtext (`Text redigieren`) | **best effort** – nicht garantierbar |

## Was ersetzt wird

| Angabe | Was die Agenten sehen | Warum |
|---|---|---|
| `patient.nachname`, `vorname` | `[Name]`, `[Vorname]` | direkter Identifikator |
| `patient.geburtsdatum` | `[Geburtsdatum]` | Quasi-Identifikator (kein Prüfpunkt) |
| `patient.versichertennummer` | `[Versichertennummer]` | direkter Identifikator |
| `patient.kostentraegerkennung` | `[Kostenträgerkennung]` | Institutions- und Personenbezug |
| `lanr`, `bsnr` | `[LANR]`, `[BSNR]` | Arzt-/Praxisbezug; das Format prüft ohnehin der Code (`fakten.lanr_format_ok`) |
| `arzt.name`, `arzt.betriebsstaette` | `[Arzt]`, `[Praxis]` | Personenbezug |
| `leitsymptomatik_freitext`, `therapieziele_hinweise` | `[Freitext entfernt]` | unstrukturierter Text, kein Prüfpunkt |
| `unterbrechungsgrund`, Diagnose-Bezeichnungen | muster-basiert bereinigt (`[Name]`, `[Versichertennummer]`, …) | medizinischer Kontext bleibt lesbar |

Die Marker sind bewusst **nicht** `null`: Der Formal-Prüfer unterscheidet „fehlt" von
„vorhanden", und ein ausgefülltes Feld mit entferntem Wert ist vorhanden. Damit das nicht
von der Formulierung des Modells abhängt, stehen die Anwesenheits-Checks zusätzlich als
deterministische Fakten bereit:

- `fakten.pflichtangaben` – je Pflichtangabe `true`/`false`, ermittelt **vor** der
  Redaktion aus dem Original (Kostenträger, LANR, BSNR, Ausstellungsdatum, Unterschrift,
  ICD-10, Diagnosegruppe, Leitsymptomatik, Heilmittel mit Einheiten, Frequenz).
  Nur `false` darf zu „fehlt" führen (Regel in allen vier Prüfer-Prompts).
- `fakten.lanr_format_ok` / `bsnr_format_ok` – `null` bei einem Marker (Format nicht
  prüfbar), `true`/`false` nur bei echten Werten. Sonst würde `[LANR]` fälschlich als
  Formatfehler gewertet.

Im Freitext-Weg übernimmt der Extraktor die Marker unverändert als Feldwert, damit die
Pflichtangaben-Prüfung auch dort „vorhanden" erkennt.

## Was bewusst bleibt

- **ICD-10-Codes, Diagnosegruppe, Leitsymptomatik, Heilmittel, Einheiten, Frequenz,
  Termine** – ohne sie ist keine Prüfung möglich.
- **Krankenkasse und Versichertenstatus** – Institution bzw. Status, kein Identifikator.
- **Fachrichtung des Arztes** – kein Personenbezug.
- **Berechnete Fakten** (Fristen, Formate, Summen) – schon im Code entstanden.

## Freitext-Weg: Grenzen offen benennen

`Text redigieren` erkennt Muster für Versichertennummer, E-Mail, Telefon (mit und ohne
Label), IBAN, „Herr/Frau/Patient/in + Name" (auch Beugungen wie „Herrn", „Patienten",
„Angehörige"), Arztnamen mit Titel, „Name:"-Zeilen, Geburtsdatum, LANR/BSNR sowie
Anschriften (Straße + Hausnummer, PLZ + Ort) und Praxisnamen. Das ist **kein**
vollständiger Schutz: Namen ohne Rolle („Mustermann klagt über …"), seltene Schreibweisen
oder Namen in medizinischen Zusammenhängen bleiben stehen. Für echte Patientendaten ist
deshalb der Formularweg der vorgesehene Weg; der Chat ist für Demonstration und
synthetische Daten gedacht – der Chat-Untertitel sagt das auch.

Drei Fallstricke, die die Muster berücksichtigen (und die Tests absichern):

- **Datumsangaben sind keine Telefonnummern.** Das Geburtsdatum wird vor der
  Telefonnummern-Regel ersetzt; die allgemeine Nummern-Regel lässt `TT.MM.JJJJ` stehen.
  Ausstellungs- und Behandlungsdaten bleiben für die Fristprüfung erhalten.
- **Namen enden nicht mit Ziffern.** `[A-ZÄÖÜ][a-zäöüß-]+` statt `\w` – sonst verschluckt
  das Namensmuster den ICD-Code direkt dahinter (`Frau Müller M51.1` → `Frau [Name].1`).
- **Satzzeichen gehören zum Text, nicht zum Muster.** Telefon- und Praxis-Muster enden an
  der Zahl bzw. am Wort, damit Komma, Punkt und Folgesatz erhalten bleiben.

Scheitert der Extraktor (z. B. weil das Modell nur Werkzeugaufrufe liefert), läuft der
Workflow über den Fehlerausgang von `Verordnung erfassen` in den Knoten `Hinweis Freitext`
und antwortet freundlich mit Verweis auf das Formular – statt mit HTTP 500.

## Was die Redaktion nicht abdeckt

| Ort | Inhalt | Empfehlung |
|---|---|---|
| **n8n-Ausführungsdaten** | enthalten die Rohdaten der Ausführung (Trigger-Eingang, `PII entfernen`-Eingang) | in Produktion `EXECUTIONS_DATA_SAVE_ON_SUCCESS=none` setzen und die Aufbewahrung begrenzen (`EXECUTIONS_DATA_PRUNE`, `EXECUTIONS_DATA_MAX_AGE`) |
| **Supabase-Prüfprotokoll** | vollständige Verordnung (`pruefungen.eingabe`), wie für die Praxis nachvollziehbar nötig | EU-Region, RLS aktiv, Zugriff nur über service_role; Aufbewahrungsfrist festlegen |
| **Chat-Verlauf in n8n** | Rohtext, solange die Unterhaltung gespeichert wird | für echte Daten nicht verwenden (siehe oben) |
| **Modellantworten** | Befunde und Antworttext – enthalten keine Namen, weil die Eingabe redigiert war | – |

## Prüfen

```bash
node tests/pii.test.mjs   # 36 Prüfungen: Marker, Original, Freitexte, Pflichtangaben, Verdrahtung
npm test                  # alle Tests des Projekts
```

Der Test belegt außerdem, dass das Original unverändert bleibt, dass in der Ausgabe des
Redaktions-Knotens weder Name noch Versichertennummer mitwandern, dass Markern die
Anwesenheit erhalten bleibt (Format dann `null`) und dass ICD-Codes hinter Namen stehen
bleiben.

Nachgewiesen am 19.10.2026 mit einer Verordnung im Container: Nach der Redaktion
enthielten alle acht Modell-Aufrufe weder `Musterfrau`, `Müller`, das Geburtsdatum, die
Versichertennummer, die Telefonnummer, die E-Mail-Adresse, LANR/BSNR noch die
Praxisanschrift – die fachlichen Angaben (M54.4, M51.1, WS, 6 Einheiten KG) kamen
unverändert an. Ergebnis des Freitext-Wegs: 🟡 mit 18 Befunden, alle Pflichtangaben
erkannt; derselbe strukturierte Fall wie zuvor: 🟢 18/18.
