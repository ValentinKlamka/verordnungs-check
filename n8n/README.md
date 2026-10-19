# n8n-Workflows

| Datei | Workflow | Zweck |
|---|---|---|
| `wissensbasis-laden.json` | Verordnungs-Check – Wissensbasis laden | Lädt die Regelwerke als PDF, teilt sie in Abschnitte, erzeugt Embeddings und speichert sie in Supabase |
| `vier-pruefer.json` | Verordnungs-Check – Vier Prüfer | Chat, Erfassung, PII-Redaktion, Auswahl der zwei ICD-10-Zeilen, vier Prüf-Agenten, Ampel, Protokoll |
| `formular.json` | Verordnungs-Check – Formular | n8n-Formular (Form Trigger) mit den Feldern des Vordrucks; ruft den Chat-Webhook des Prüf-Workflows auf und zeigt das Ergebnis auf der Abschlussseite |

Import: n8n → Workflows → Import from File. Danach die Credentials setzen:
- **OpenRouter** (Chat-Modell `google/gemini-3.1-flash-lite`)
- **OpenRouter (OpenAI-kompatibel)** (Embeddings `google/gemini-embedding-001`, Base URL `https://openrouter.ai/api/v1`, Option *Dimensions* = `1536`) – n8n hat keinen eigenen OpenRouter-Embedding-Knoten
- **Supabase** (Host-URL des Projekts und Secret Key – nie ins Repository!)

Danach einmal **Wissensbasis laden** ausführen (füllt die Tabelle `documents`, rund 380 Abschnitte), dann den Chat im Workflow **Vier Prüfer** öffnen und eine Testverordnung aus `supabase/seed/testfaelle.sql` als JSON einfügen.

Hinweis: Der Extraktor antwortet grundsätzlich mit dem JSON-Objekt und stellt keine Rückfragen. Fehlende Angaben sind `null` und werden von den Prüfern als „fehlt“ gemeldet – ein Rückfrage-Text des Modells würde am Structured Output Parser scheitern.

Stand der Exporte: Version v4 nach der Evaluation vom 13.10.2026 (siehe `docs/evaluation.md`), am 15.10.2026 um den Code-Node **Diagnosen auswählen** und das erweiterte Schema `Verordnung` ergänzt, am 18.10.2026 um die Erfassungsmaske (`formular.json`) und den strukturierten Eingang im Prüf-Workflow.

Für die lokale Instanz die Import-Datei über `npm run n8n:vorbereiten` erzeugen: Der Export enthält keine Workflow-ID, deshalb würde n8n beim Import in eine schon eingerichtete Instanz sonst jedes Mal eine zweite Kopie anlegen. Die Import-Datei landet in `.n8n/tmp/` und ist nicht Teil des Repositories.

Zwei Eigenheiten beim Import per CLI, die über die Oberfläche nicht auftreten:

- **Knoten-Reihenfolge:** n8n ermittelt Vorgänger/Nachfolger teilweise über die Position in der `nodes`-Liste. Steht ein Knoten dort vor seinen Nachfolgern, kann die Ausführung mit `Cannot read properties of undefined` scheitern (so beim Form-Abschluss-Knoten passiert). Die Liste muss der Pipeline entsprechen: Trigger → Verarbeitung → Antwort.
- **webhookId:** Trigger-Knoten (`chatTrigger`, `formTrigger`) brauchen eine `webhookId`, sonst meldet die Aktivierung `No webhook path could be found` und die URL liefert 404.
