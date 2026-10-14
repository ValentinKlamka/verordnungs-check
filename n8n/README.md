# n8n-Workflows

| Datei | Workflow | Zweck |
|---|---|---|
| `wissensbasis-laden.json` | Verordnungs-Check – Wissensbasis laden | Lädt die Regelwerke als PDF, teilt sie in Abschnitte, erzeugt Embeddings und speichert sie in Supabase |
| `vier-pruefer.json` | Verordnungs-Check – Vier Prüfer | Chat, Erfassung, Auswahl der zwei ICD-10-Zeilen, vier Prüf-Agenten, Ampel, Protokoll |

Import: n8n → Workflows → Import from File. Danach die Credentials setzen:
- **OpenRouter** (Chat-Modell `google/gemini-3.1-flash-lite`)
- **OpenRouter (OpenAI-kompatibel)** (Embeddings `google/gemini-embedding-001`, Base URL `https://openrouter.ai/api/v1`, Option *Dimensions* = `1536`) – n8n hat keinen eigenen OpenRouter-Embedding-Knoten
- **Supabase** (Host-URL des Projekts und Secret Key – nie ins Repository!)

Danach einmal **Wissensbasis laden** ausführen (füllt die Tabelle `documents`, rund 380 Abschnitte), dann den Chat im Workflow **Vier Prüfer** öffnen und eine Testverordnung aus `supabase/seed/testfaelle.sql` als JSON einfügen.

Hinweis: Der Extraktor antwortet grundsätzlich mit dem JSON-Objekt und stellt keine Rückfragen. Fehlende Angaben sind `null` und werden von den Prüfern als „fehlt“ gemeldet – ein Rückfrage-Text des Modells würde am Structured Output Parser scheitern.

Stand der Exporte: Version v4 nach der Evaluation vom 13.10.2026 (siehe `docs/evaluation.md`), am 15.10.2026 um den Code-Node **Diagnosen auswählen** und das erweiterte Schema `Verordnung` ergänzt.

Für die lokale Instanz die Import-Datei über `npm run n8n:vorbereiten` erzeugen: Der Export enthält keine Workflow-ID, deshalb würde n8n beim Import in eine schon eingerichtete Instanz sonst jedes Mal eine zweite Kopie anlegen. Die Import-Datei landet in `.n8n/tmp/` und ist nicht Teil des Repositories.
