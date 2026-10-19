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
„vorhanden", und ein ausgefülltes Feld mit entferntem Wert ist vorhanden.

## Was bewusst bleibt

- **ICD-10-Codes, Diagnosegruppe, Leitsymptomatik, Heilmittel, Einheiten, Frequenz,
  Termine** – ohne sie ist keine Prüfung möglich.
- **Krankenkasse und Versichertenstatus** – Institution bzw. Status, kein Identifikator.
- **Fachrichtung des Arztes** – kein Personenbezug.
- **Berechnete Fakten** (Fristen, Formate, Summen) – schon im Code entstanden.

## Freitext-Weg: Grenzen offen benennen

`Text redigieren` erkennt Muster für Versichertennummer, E-Mail, Telefon, IBAN,
„Herr/Frau/Patient/in + Name", Geburtsdatum, „Name:"-Zeilen und Anschriften mit
Hausnummer. Das ist **kein** vollständiger Schutz: Namen ohne Rolle („Mustermann klagt
über …"), seltene Schreibweisen oder Namen in medizinischen Zusammenhängen bleiben
stehen. Für echte Patientendaten ist deshalb der Formularweg der vorgesehene Weg; der
Chat ist für Demonstration und synthetische Daten gedacht – der Chat-Untertitel sagt das
auch.

## Was die Redaktion nicht abdeckt

| Ort | Inhalt | Empfehlung |
|---|---|---|
| **n8n-Ausführungsdaten** | enthalten die Rohdaten der Ausführung (Trigger-Eingang, `PII entfernen`-Eingang) | in Produktion `EXECUTIONS_DATA_SAVE_ON_SUCCESS=none` setzen und die Aufbewahrung begrenzen (`EXECUTIONS_DATA_PRUNE`, `EXECUTIONS_DATA_MAX_AGE`) |
| **Supabase-Prüfprotokoll** | vollständige Verordnung (`pruefungen.eingabe`), wie für die Praxis nachvollziehbar nötig | EU-Region, RLS aktiv, Zugriff nur über service_role; Aufbewahrungsfrist festlegen |
| **Chat-Verlauf in n8n** | Rohtext, solange die Unterhaltung gespeichert wird | für echte Daten nicht verwenden (siehe oben) |
| **Modellantworten** | Befunde und Antworttext – enthalten keine Namen, weil die Eingabe redigiert war | – |

## Prüfen

```bash
node tests/pii.test.mjs   # 19 Prüfungen: Marker, Original, Freitexte, Verdrahtung
npm test                  # alle Tests des Projekts
```

Der Test belegt außerdem, dass das Original unverändert bleibt und dass in der Ausgabe
des Redaktions-Knotens weder Name noch Versichertennummer mitwandern.

Nachgewiesen am 19.10.2026 mit einer Verordnung im Container: Nach der Redaktion
enthielten alle sieben Modell-Eingaben weder `Mustermann`, `Müller`, `Erika`, die
Versichertennummer, das Geburtsdatum, die Telefonnummer noch die Praxisanschrift – die
fachlichen Angaben (M54.4, M51.1, WS, 6 Einheiten KG) kamen unverändert an, das
Prüfergebnis war identisch (18 Befunde, 🟢).
