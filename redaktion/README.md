# Redaktionsdienst (lokale PII-Redaktion)

Kleiner Python-Dienst, der Freitext redigiert, **bevor** ihn ein Modell sieht. Er
kombiniert zwei Verfahren:

| Verfahren | Findet | Warum nicht anders |
|---|---|---|
| Regeln (`regeln.py`) | Versichertennummer, E-Mail, Telefon, IBAN, LANR/BSNR, Geburtsdatum, Straße + Hausnummer, PLZ + Ort, Praxisnamen, „Frau/Herr …" | Diese Formate erkennt ein NER-Modell unzuverlässig bis gar nicht |
| Modell (`Davlan/bert-base-multilingual-cased-ner-hrl`) | Personennamen, Orte, Organisationen – **auch ohne Rollenwort** („Mustermann klagt über …") | Genau der Fall, den reine Muster nicht abdecken |

Beide liefern Spannen auf dem Originaltext; bei Überlappung gewinnt die Regel. Ein
Modell-Treffer darf außerdem **keine** medizinisch nötigen Angaben überschreiben:
ICD-10-Codes, Datumswerte, Einheiten und Vordruck-Bezeichnungen (`KVNR`, `WS`, `KG` …)
sind geschützt (`GESCHUETZT` in `regeln.py`).

## Warum dieses Modell

Getestet mit deutschen Verordnungstexten (Vergleich im Repository-Verlauf):

| Modell | „Mustermann klagt" | „Frau Müller" | „Hauptstrasse 5" | Medizinischer Text |
|---|---|---|---|---|
| `ai4privacy/…-categorical-anonymiser-openpii` | nicht erkannt | nicht erkannt | nur mit Regeln | blieb stehen |
| `fhswf/bert_de_ner` | Wortstücke („muster", „web") | „mul" | Wortstücke | blieb stehen |
| **`Davlan/bert-base-multilingual-cased-ner-hrl`** | erkannt | erkannt | erkannt | blieb unangetastet |

Deshalb ist Davlan der Standard. Über `REDAKTION_MODELL` lässt sich das Modell tauschen;
`regeln.py` kennt zusätzlich die Labels der ai4privacy-Modelle (SURNAME, GIVENNAME, CITY,
ZIPCODE, TELEPHONENUM …), falls dort später ein besseres deutsches Modell erscheint.

## Starten

Der Dienst läuft getrennt von n8n: **Port 5678 gehört n8n selbst**, der
Redaktionsdienst hört auf **5680**.

```bash
npm run redaktion:bauen      # Image bauen (lädt das Modell einmalig ein)
npm run redaktion:starten    # Container pii-redaktion auf Port 5680
npm run redaktion:pruefen    # Beispieltexte gegen den laufenden Dienst prüfen
npm run test:redaktion       # Regeltests ohne Modell (schnell, offline)
```

Ohne Docker, direkt auf dem Rechner (Python 3.11+, `pip install -r redaktion/requirements.txt`):

```bash
npm run redaktion:lokal      # uvicorn auf 127.0.0.1:5680
```

n8n im Container erreicht den Dienst über `http://host.docker.internal:5680` (Docker
Desktop, Windows/macOS). Läuft auch n8n als npm-Prozess, genügt
`http://127.0.0.1:5680` – die URL steht im Knoten `Text redigieren`.

## Schnittstelle

```
GET  /gesund      → {"status":"ok","modell":"…","schwelle":0.5}
POST /redigieren  → {"text":"…", "entfernt":["Name","Geburtsdatum",…], "modell":"…", "dauer_ms":42}
POST /redigieren  → {"texte":["…","…"]}  → {"texte":[{"text":…,"entfernt":[…]}, …]}
```

## Datenschutz

- Das Modell wird **beim Bauen des Images** geladen; im Betrieb läuft der Container mit
  `TRANSFORMERS_OFFLINE=1`. Beim Redigieren geht nichts ins Netz.
- Der Dienst protokolliert keine Texte. Wer mitschneiden will, muss es selbst tun.
- n8n ist so verdrahtet, dass ein Ausfall des Dienstes den Freitext-Weg **abschaltet**
  (Fehlerausgang → `Hinweis Freitext`): lieber keine Prüfung als unredigierter Text an
  ein Modell. Der Formular-Weg ist davon unabhängig.

## Grenzen

- NER ist statistisch: seltene Namen, Initialen oder Namen in medizinischen
  Zusammensetzungen können durchrutschen. Für echte Patientendaten bleibt der
  Formular-Weg der vorgesehene Weg (dort werden Felder ersetzt, nicht erkannt).
- Adressen ohne Hausnummer werden als `[Ort]` markiert (das Modell unterscheidet Straße
  und Ort nicht immer); das ist gewollt konservativ.
- Der Dienst ersetzt keine Anonymisierung nach DSGVO-Standard; er senkt das Risiko, dass
  Identifikatoren an ein Sprachmodell gehen.
