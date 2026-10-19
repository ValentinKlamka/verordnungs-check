# Architektur

## Ablauf

1. **Eingang:** Zwei Wege führen in dieselbe Prüfung. Die **Erfassungsmaske** ([`../formular/`](../formular/README.md)) schickt die am Bildschirm ausgefüllte Verordnung als strukturiertes JSON; der **Chat** nimmt Freitext. Der Code-Node `Eingabe prüfen` erkennt, ob schon eine vollständige Verordnung vorliegt, `Verordnung strukturiert?` (IF) entscheidet den Weg.
2. **Verordnung erfassen (nur Freitext):** Ein LLM-Agent überführt den Text in ein festes JSON-Schema. Fehlende Angaben werden `null`, nichts wird geraten. Marker aus der Redaktion (`[LANR]`, `[Name]` …) übernimmt er unverändert als Wert – sie bedeuten „vorhanden, aber redigiert“. Er erfasst alle genannten ICD-10-GM-Codes als Liste (`diagnosen[]`, in Nennungsreihenfolge, mit Kennzeichen `anlass`), dazu Personalien, Kennzeichen und Stammdaten. Endet er trotz Wiederholungen ohne JSON, geht es über den Fehlerausgang zum Knoten `Hinweis Freitext` (freundliche Antwort mit Verweis auf das Formular statt HTTP 500).
3. **Diagnosen auswählen (nur Freitext):** Auf den Vordruck Muster 13 passen zwei ICD-10-Zeilen. Der Node wählt sie nach der Regel in [`vordruck-muster13.md`](vordruck-muster13.md), Abschnitt 5 (verordnungsrelevant = passt zur Diagnosegruppe des Heilmittels), belegt `icd10` und `weitere_diagnosen`, begründet jede verworfene Diagnose in `nicht_verordnungsrelevant` und meldet Zweifelsfälle als `diagnose_auswahl.hinweise`. Abgesichert durch `tests/diagnosen.test.mjs`. Im Formular-Weg entfällt der Node: Die Rezeption hat die zwei Zeilen bereits gewählt, der Code-Node normalisiert sie nur.
4. **Fakten berechnen (Code-Node „Fristen berechnen“):** Alles, was sich als Regel aufschreiben lässt, rechnet der Code, nicht das LLM:
   - Tage zwischen Ausstellung, geplantem Beginn und letzter Behandlung. Grenzwerte: Behandlungsbeginn 28 Tage (14 Tage bei dringlichem Behandlungsbedarf), Unterbrechung 14 Tage
   - Format von LANR und BSNR (9 Ziffern)
   - Körperregion des ICD-Codes → passende Diagnosegruppe (WS oder EX) für die häufigsten Muskel-Skelett-Bereiche
   - Summe der Einheiten, Anzahl vorrangiger Heilmittel
   - Anwesenheit der Pflichtangaben (`pflichtangaben`) – ermittelt aus dem Original, damit die späteren Marker nicht als „fehlt“ gelesen werden

   Die Prüf-Agenten erhalten diese Werte als „berechnete Fakten“, die für sie verbindlich sind. Abgesichert durch `tests/fakten.test.mjs` und `tests/pii.test.mjs`.
5. **PII entfernen (Code-Node):** Vor den Prüf-Agenten werden direkte Identifikatoren (Name, Geburtsdatum, Versichertennummer, LANR/BSNR, Arzt-/Praxisangaben) durch Marker wie `[Name]` ersetzt und Freitexte entfernt; das Original bleibt für Protokoll und Antwort erhalten. Im Freitext-Weg redigiert `Text redigieren` den Rohtext muster-basiert (best effort). Details und Grenzen: [`pii-redaktion.md`](pii-redaktion.md). Abgesichert durch `tests/pii.test.mjs`.
6. **Vier Prüf-Agenten:** Jeder Agent bekommt die redigierte Verordnung und die berechneten Fakten und liefert Befunde im gemeinsamen JSON-Schema. Formal-, Diagnose- und Mengen-Prüfer durchsuchen dafür ihren Ausschnitt der Wissensbasis (Vektorsuche); der **Fristen-Prüfer arbeitet ohne Werkzeug**, weil sein Mandat vollständig durch die berechneten Fakten bestimmt ist und die Fundstelle feststeht (§ 15 HeilM-RL) – das verhindert auch, dass er in einer erfolglosen Suchschleife endet. Alle Agenten sind auf Wiederholung gesetzt (`retryOnFail`, 3 Versuche), weil ein Modell gelegentlich mit einem Werkzeugaufruf statt JSON endet.
7. **Ergebnis zusammenführen (Code-Node):** Ampel (rot / gelb / grün), Absetzungsrisiko, Antworttext – und die Diagnoseauswahl für Protokoll und Erfassungsmaske.
8. **Protokoll:** Prüfung und Befunde werden in Supabase gespeichert.

**Ab Sprint 2 (Verordnungsfall-Prüfung):** Zwischen Schritt 4 und 5 kommen zwei Komponenten dazu:

- **Historie abfragen** (Supabase-Node): liest frühere Verordnungen mit demselben Patienten-Pseudonym, derselben ICD-Stelle (3-stellig), Diagnosegruppe und LANR.
- **Verordnungsfall berechnen** (Code-Node): summiert die Einheiten und prüft die 6-Monats-Regel (§ 7 HeilM-RL).

Das Ergebnis geht als berechneter Fakt an den Mengen-Prüfer. Jede geprüfte Verordnung wird in die Historie geschrieben. Details: [`dateneingang.md`](dateneingang.md).
9. **Antwort:** Die Rezeption erhält Ampel, Korrekturhinweise und Fundstellen.

## Befund-Schema

```json
{
  "agent": "formal | diagnose | menge | frist",
  "befunde": [
    { "feld": "LANR", "status": "ok | fehlt | fehlerhaft | hinweis", "fundstelle": "…", "korrekturhinweis": "…" }
  ]
}
```

## Datenmodell (Supabase)

| Tabelle | Zweck |
|---|---|
| `documents` | Wissensbasis für den RAG (Text, Metadaten, Embedding 1536) |
| `pruefungen` | Ein Prüflauf pro Verordnung: Eingabe, Ampel, Risiko, Dauer, Freigabe |
| `befunde` | Ein Befund pro Prüfpunkt und Agent |
| `testfaelle` | Synthetische Verordnungen mit erwarteten Befunden für die Evaluation |
| `verordnungen` *(Sprint 2)* | Historie: eine Zeile je geprüfter Verordnung mit Pseudonym, ICD 3-stellig, Diagnosegruppe, LANR, Datum, Einheiten |

Row Level Security ist auf allen Tabellen aktiv, es gibt keine öffentlichen Policies. Nur n8n greift mit dem service_role-Schlüssel zu.

## Deployment

| Punkt | Umsetzung |
|---|---|
| Laufzeitumgebung | n8n Cloud (vorhandene Instanz des Teams) |
| Datenbank | Supabase, Region eu-central-1 (Frankfurt) |
| Zugang für die Rezeption | n8n-Chat. Veröffentlicht wird er erst mit aktiver Anmeldung (Basic Auth oder n8n-Login), sonst kann jeder mit dem Link Kosten erzeugen |
| Nachweis einer erfolgreichen Ausführung | Ausführungsprotokoll in n8n und Zeilen in `pruefungen` und `befunde`. Für die Präsentation: Screenshots je Ampelfarbe |
| Veröffentlichung | Workflow-Export (ohne Credential-IDs und Webhook-ID), Migrationen, Testdaten und Tests auf GitHub |

Komponenten im Detail und Begründung des Wegs: [`implementierung.md`](implementierung.md).

## Bewusste Design-Entscheidungen (Trade-offs)

| Entscheidung | Alternative | Begründung |
|---|---|---|
| Vier spezialisierte Prüfer | Ein Allround-Agent | Jedes Mandat einzeln erklärbar und testbar; Fehler lassen sich einem Prüfer zuordnen |
| Fristen im Code | LLM rechnet Tage | Datumsarithmetik ist keine Sprachaufgabe; reproduzierbar |
| ICD-Bereich → Diagnosegruppe im Code | LLM ordnet zu | In der Evaluation ordnete das LLM einen Knie-Code der Wirbelsäule zu, trotz Prompt-Regeln (siehe `evaluation.md`) |
| Ampel im Code | LLM entscheidet Gesamtstatus | Nachvollziehbar und prüfbar |
| Ein gemeinsames Sprachmodell | Ein Modell je Agent | Geringere Kosten, einfachere Wartung |
| Freigabe durch die Rezeption | Automatische Abweisung | Mensch behält die Verantwortung (menschliche Aufsicht) |
| Synthetische Daten | Echte Verordnungen | Gesundheitsdaten (Art. 9 DSGVO) gehören nicht in einen Prototyp |
