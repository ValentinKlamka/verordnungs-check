# PII-Redaktion

*Stand 20.10.2026 · gilt für den Workflow „Verordnungs-Check – Vier Prüfer"*

Eine Heilmittelverordnung enthält personenbezogene Daten (Name, Geburtsdatum,
Versichertennummer, Arzt- und Praxisangaben) und Gesundheitsdaten (Diagnosen). Die
Prüf-Agenten sind LLM-Aufrufe über OpenRouter – dorthin dürfen keine direkten
Identifikatoren gehen. Deshalb steht vor den Agenten ein eigener Code-Knoten, der die
Verordnung pseudonymisiert; im Freitext-Weg kommt zusätzlich ein lokaler
Redaktionsdienst mit einem HuggingFace-Modell zum Einsatz.

## Wo die Redaktion sitzt

```
Fristen berechnen  →  PII entfernen  →  Formal-, Diagnose-, Mengen-, Fristen-Prüfer
         │
         └─→ Ergebnis zusammenführen → Protokoll (Supabase, vollständige Daten)

Freitext:  Text redigieren (lokaler Dienst, Port 5680)  →  Redaktion übernehmen  →  Verordnung erfassen
```

`PII entfernen` ersetzt Werte, **bevor** ein Modell sie sieht. Das Original bleibt im
Workflow erhalten (`Ergebnis zusammenführen` liest weiterhin `Fristen berechnen`), damit
Prüfprotokoll und Vorschau die echten Daten zeigen.

Zwei Eingabewege, zwei Redaktionen:

| Weg | Redaktion | Charakter |
|---|---|---|
| Formular (A5-Maske, n8n-Formular) | feldbasiert: Identifikatoren werden durch Marker ersetzt, Freitexte entfernt | vollständig, deterministisch, getestet |
| Freitext im Chat | lokaler Dienst: HuggingFace-NER + dieselben Regeln (`redaktion/`) | deutlich besser als Muster allein, aber statistisch – nicht garantierbar |

## Freitext: lokaler Redaktionsdienst

Der Code-Knoten von früher ist ersetzt: `Text redigieren` ruft jetzt
`http://host.docker.internal:5680/redigieren` auf (Port 5678 gehört n8n selbst). Der
Dienst läuft als eigener Container (`redaktion/`, Details dort) und arbeitet in zwei
Stufen:

1. **Regeln** – Versichertennummer, E-Mail, Telefon, IBAN, LANR/BSNR, Geburtsdatum,
   Straße + Hausnummer, PLZ + Ort, Praxisname, „Frau/Herr …".
2. **Modell** (`Davlan/bert-base-multilingual-cased-ner-hrl`) – Personennamen, Orte,
   Organisationen, auch ohne Rollenwort. Damit wird der früher dokumentierte blinde Fleck
   („Mustermann klagt über …") geschlossen.

Geschützt vor dem Modell sind ICD-10-Codes, Datumswerte, Einheiten und
Vordruck-Bezeichnungen – sonst würde „M54.4" als Hausnummer maskiert und die Prüfung
unbrauchbar.

**Fail-closed:** Ist der Dienst nicht erreichbar, geht der Freitext-Weg über den
Fehlerausgang zum Knoten `Hinweis Freitext` („bitte das Formular nutzen"). Es wird dann
**kein** Modell aufgerufen – lieber keine Prüfung als unredigierter Text bei OpenRouter.
Nachgewiesen: Ausfall des Dienstes → 0 Modell-Läufe, HTTP 200 mit Hinweis.

Prüfen:

```bash
npm run test:redaktion     # Regeln, ohne Modell (Python, schnell)
npm run redaktion:pruefen  # echte Sätze gegen den laufenden Dienst
```


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

Der Dienst erkennt die strukturierten Formate über Regeln und Namen/Orte über das Modell.
Das ist **kein** vollständiger Schutz: seltene Schreibweisen, Initialen („M. Mustermann"
wird als Name erkannt, „M." allein nicht) und Namen, die wie Fachbegriffe aussehen,
können durchrutschen. Für echte Patientendaten bleibt der Formularweg der vorgesehene
Weg; der Chat ist für Demonstration und synthetische Daten gedacht – der Chat-Untertitel
sagt das auch.

Fallstricke, die Regeln und Tests absichern:

- **Datumsangaben sind keine Telefonnummern.** Das Geburtsdatum wird vor der
  Telefonnummern-Regel ersetzt; die allgemeine Nummern-Regel lässt `TT.MM.JJJJ` stehen.
  Ausstellungs- und Behandlungsdaten bleiben für die Fristprüfung erhalten.
- **Namen enden nicht mit Ziffern.** `[A-ZÄÖÜ][a-zäöüß-]+` statt `\w` – sonst verschluckt
  das Namensmuster den ICD-Code direkt dahinter (`Frau Müller M51.1` → `Frau [Name].1`).
- **Das Modell darf Medizinisches nicht anfassen.** ICD-Codes, Daten, Einheiten und
  Vordruck-Bezeichnungen (`KVNR`, `WS`, `KG`) sind geschützt; ohne das hat das erste
  getestete Modell `M54.4` als Hausnummer maskiert.
- **Satzzeichen gehören zum Text, nicht zum Muster.** Telefon- und Praxis-Muster enden an
  der Zahl bzw. am Wort, damit Komma, Punkt und Folgesatz erhalten bleiben.

Scheitert der Dienst oder der Extraktor (z. B. weil das Modell nur Werkzeugaufrufe
liefert), läuft der Workflow über den jeweiligen Fehlerausgang in den Knoten
`Hinweis Freitext` und antwortet freundlich mit Verweis auf das Formular – statt mit
HTTP 500.

## Was die Redaktion nicht abdeckt

| Ort | Inhalt | Empfehlung |
|---|---|---|
| **n8n-Ausführungsdaten** | enthalten die Rohdaten der Ausführung (Trigger-Eingang, `PII entfernen`-Eingang) | in Produktion `EXECUTIONS_DATA_SAVE_ON_SUCCESS=none` setzen und die Aufbewahrung begrenzen (`EXECUTIONS_DATA_PRUNE`, `EXECUTIONS_DATA_MAX_AGE`) |
| **Supabase-Prüfprotokoll** | vollständige Verordnung (`pruefungen.eingabe`), wie für die Praxis nachvollziehbar nötig | EU-Region, RLS aktiv, Zugriff nur über service_role; Aufbewahrungsfrist festlegen |
| **Chat-Verlauf in n8n** | Rohtext, solange die Unterhaltung gespeichert wird | für echte Daten nicht verwenden (siehe oben) |
| **Redaktionsdienst** | verarbeitet den Rohtext im Arbeitsspeicher, schreibt nichts auf Platte und ruft im Betrieb kein Netz | Container ohne Volume betreiben, Logs nicht mitschneiden |
| **Modellantworten** | Befunde und Antworttext – enthalten keine Namen, weil die Eingabe redigiert war | – |

## Prüfen

```bash
node tests/pii.test.mjs      # 27 Prüfungen: strukturierte Redaktion, Pflichtangaben, Verdrahtung
npm run test:redaktion       # 14 Prüfungen der Freitext-Regeln (Python, ohne Modell)
npm run redaktion:pruefen    # 4 echte Sätze gegen den laufenden Dienst (Modell + Regeln)
npm test                     # alle Node-Tests des Projekts
```

Nachgewiesen am 20.10.2026 mit dem laufenden Dienst (Modell
`Davlan/bert-base-multilingual-cased-ner-hrl`, ~0,2–0,7 s je Verordnung):

- Freitext mit allen Personalien: 11 Kategorien maskiert, `M54.4`, `M51.1`,
  `Diagnosegruppe WS`, `6x` und beide Datumswerte blieben erhalten; alle acht
  Modell-Aufrufe der Prüfung enthielten danach weder Name, Geburtsdatum,
  Versichertennummer, Telefon, E-Mail, LANR/BSNR, Arzt- noch Praxisangabe. Ergebnis 🟢 18/18.
- Dienst gestoppt: Chat antwortet mit dem Hinweis, **0 Modell-Aufrufe**, kein Rohtext
  verlässt den Workflow.
- Strukturierter Weg (Formular-JSON) unverändert: 18 Befunde.

