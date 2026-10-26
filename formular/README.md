# Erfassungsmaske (Muster 13)

Die Rezeption füllt die Heilmittelverordnung am Bildschirm aus – dieselbe Geometrie
wie der Papiervordruck – und schickt sie mit einem Klick zur Prüfung. Das Ergebnis
(Ampel, Befunde, Fundstellen) erscheint in der Seitenleiste.

Kein Build, keine Abhängigkeiten. Feldzuordnung und Auswahlregeln:
[`../docs/vordruck-muster13.md`](../docs/vordruck-muster13.md).

## Starten

```bash
npm run formular        # http://127.0.0.1:4321/muster13.html
```

Der kleine Dateiserver (`scripts/formular-server.mjs`) ist nötig, weil die Seite die
Verordnung an n8n schickt (anderer Port). Aus dem Dateisystem heraus (`file://`)
blockieren viele Browser diesen Aufruf. Ziel-Adresse ist
`http://127.0.0.1:5678/webhook/verordnungs-check/chat`, überschreibbar per URL:
`muster13.html?webhook=http://…/webhook/…/chat`.

Voraussetzung: n8n läuft und der Workflow **Vier Prüfer** ist aktiv (Chat-Trigger,
CORS ist dort mit `*` freigegeben).

## Bedienung

- **Verordnung prüfen** – sammelt alle Felder, schickt sie als strukturiertes JSON
  und zeigt das Ergebnis. Der Workflow erkennt die strukturierte Eingabe und
  überspringt den LLM-Extraktor (schneller und ohne Rateweg).
- **Beispielfall** – füllt den synthetischen Physiotherapie-Fall ein.
- **Leeren** – setzt den Vordruck zurück.
- **Ansicht 100 % / 150 %** und **Drucken** – gedruckt wird A5 in Originalgröße.

Was das Formular **nicht** liefert und was stattdessen gilt, steht in der Seitenleiste:
Behandlungsbeginn (kein Feld auf dem Vordruck, Frist ab Datum nach § 15 Abs. 1
HeilM-RL), Erst-/Folgeverordnung (Verordnungsfall, § 7 Abs. 1), besonderer
Verordnungsbedarf (über die ICD-Codes der Diagnoseliste). Die **Unterschrift** gilt
als vorhanden, weil die Verordnung unterschrieben vorliegt; die **IK** trägt der
Heilmittelerbringer ein und bleibt deshalb leer.

## Vorlagen (Start mit dokumentierten Testfällen)

```bash
npm run formular              # dann http://127.0.0.1:4321/vorlagen
npm run vorlagen:pruefen      # dieselben Fälle per CLI gegen den Workflow
```

Die Seite zeigt die zehn Testfälle aus [`../supabase/seed/testfaelle.sql`](../supabase/seed/testfaelle.sql)
als Karten. Ein Klick auf **Prüfen** schickt den Fall als strukturiertes JSON an denselben
Webhook und zeigt darunter Ampel, alle 18 Prüfpunkte und die Workflow-Antwort. Neben dem
Ergebnis steht, ob es zur im Seed dokumentierten Erwartung passt („✅ Deckungsgleich" oder
„⚠️ Abweichung: erwartet 🔴, erhalten 🟡").

**Alle durchprüfen** arbeitet die zehn Fälle nacheinander ab und ergänzt eine Übersicht
mit Erwartung, Ergebnis, offenen Punkten und Dauer – rund zwei Minuten, weil jeder Fall
die vier Agenten durchläuft.

Die Falldaten stehen in `vorlagen-daten.js` und werden **aus dem Seed erzeugt** – nicht von
Hand pflegen:

```bash
npm run vorlagen:daten        # formular/vorlagen-daten.js neu schreiben
```

`tests/formular.test.mjs` vergleicht die Datei mit dem Seed und schlägt fehl, wenn beide
auseinanderlaufen.

## n8n-Formular (Standardweg)

```bash
npm run n8n:vorbereiten && npm run n8n      # Workflows importieren, Instanz starten
```

Danach `http://localhost:5678/form/verordnung` aufrufen: n8n rendert die Felder des
Vordrucks (Pflichtfelder, Datumsfelder, Auswahllisten), das Absenden startet die
Prüfung und die Abschlussseite zeigt Ampel, Tabelle und Prüfpunkte als Text. Der
Workflow ([`formular.json`](../n8n/formular.json)) bildet die Formularfelder auf das
Verordnung-Schema ab und ruft den Chat-Webhook des Prüf-Workflows auf
(`http://127.0.0.1:5678/webhook/verordnungs-check/chat`) – deshalb muss der
Prüf-Workflow aktiv sein. Bewusste Ja/Nein-Auswahlen statt Ankreuzfeldern, weil n8n
Checkboxen im Formular standardmäßig auf „an" setzt.

Beim Import per CLI in eine bestehende Instanz siehe die Hinweise in
[`../n8n/README.md`](../n8n/README.md) (IDs, `webhookId`, Knoten-Reihenfolge).

## Was hier bewusst nicht passiert

- **Keine Diagnoseauswahl.** Anders als beim Freitext-Chat bestimmt die Rezeption die
  zwei ICD-Zeilen selbst; der Workflow übernimmt sie unverändert. Passt eine Zeile
  nicht zur Diagnosegruppe, melden das Formal- und Diagnose-Prüfer.
- **Keine Bewertung im Browser.** Ampel, Status und Hinweise kommen ausschließlich
  aus der Workflow-Antwort; die Maske rechnet nichts.

## Dateien

| Datei | Zweck |
|---|---|
| `muster13.html` | Aufbau des Vordrucks (Kästen, Beschriftungen, Ankreuzfelder) |
| `muster13.css` | A5-Darstellung, Druck, Eingabefelder |
| `muster13.js` | Erzeugt die Eingabefelder, sammelt die Verordnung, ruft den Workflow, zeigt das Ergebnis |
| `vorlagen.html` / `vorlagen.css` / `vorlagen.js` | Startseite mit den Testfällen: ein Klick prüft einen Fall und vergleicht mit der Erwartung |
| `vorlagen-daten.js` | Die Testfälle als Daten – erzeugt aus dem Seed (`npm run vorlagen:daten`) |
| `beispiel-workflow-ausgabe.js` | Synthetischer Physiotherapie-Fall für **Beispielfall** |

Die Eingabefelder entstehen im Browser aus den markierten Wertfeldern des Vordrucks
(`data-wert` → `data-feld`) – Markup und Füll-Logik können deshalb nicht auseinander-
laufen; `tests/formular.test.mjs` prüft das.

## Prüfen

```bash
node tests/formular.test.mjs   # Feldgleichheit, Ankreuzfelder, Beispieldaten, Schemafelder, Vorlagen
npm test                       # alle Tests (Fakten, Diagnoseauswahl, Formular)
```
