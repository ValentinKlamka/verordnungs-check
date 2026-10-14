# Implementierungsweg und Komplexitätsübersicht

*Sprint 1 · Stand 13.10.2026 · Verantwortlich: Valentin*

## Gewählter Weg

**Hybrid innerhalb von n8n:**

- **Sprachmodell:** erfasst den Freitext der Verordnung und prüft vier Mandate mit Fundstellen aus den Regelwerken (RAG).
- **Code-Nodes:** rechnen alles, was sich als feste Regel aufschreiben lässt (Fristen, Formate, ICD-Bereich, Ampel, Verordnungsfall).
- **Konfigurierte Nodes:** übernehmen Chat, Vektorsuche und Speichern.

## Begründung nach den fünf Faktoren

| Faktor | Bezug zu unserem Scope |
|---|---|
| **Form des Problems** | Eine ausgelöste Sequenz mit einem klaren Trigger (Verordnung kommt an) und einem festen Ablauf. Konversation braucht es nur für die Eingabe. Prüfregeln sind teils sprachlich (Regelwerk finden und anwenden), teils reine Rechnung. Deshalb Hybrid. |
| **Integrationen** | Nur zwei Systeme: OpenRouter (Modell, Embeddings) und Supabase (Vektorspeicher, Protokoll, Historie). Für beide gibt es native n8n-Nodes. Die Praxissoftware ist bewusst ausgeschlossen. |
| **Deployment** | n8n Cloud (vorhandene Instanz), Supabase in der EU-Region Frankfurt. Die Rezeption erreicht das System über den n8n-Chat, der erst mit aktiver Anmeldung veröffentlicht wird. Quelle und Evidenz liegen auf GitHub. |
| **Wartbarkeit** | Regeln stecken in wenigen, getesteten Code-Nodes (`tests/fakten.test.mjs`). Ändert sich ein Regelwerk, wird die Wissensbasis per Knopfdruck neu geladen. Prompts liegen im Workflow-Export und sind versioniert. |
| **Skill-Fit** | n8n, Supabase und RAG kennt das Team aus dem MSIT-Programm. Das Risiko liegt im JavaScript der Code-Nodes, deshalb ist jeder Code-Node mit Tests abgesichert. |

## Erwogen und verworfen

| Alternative | Warum verworfen |
|---|---|
| **Ein einziger Allround-Agent** | In der Evaluation nicht nachvollziehbar, welche Regel versagt. Vier Mandate lassen sich einzeln testen und Fehler einem Prüfer zuordnen. |
| **Alles durch das Sprachmodell** (auch Fristen und ICD-Zuordnung) | So gebaut in v1–v3: Das LLM rechnete Tage falsch und ordnete einen Knie-Code der Wirbelsäule zu. Ab v4 im Code (siehe `evaluation.md`). |
| **Reine Regel-Engine ohne Sprachmodell** | Die Eingabe ist Freitext, und die Regeln stehen in langen PDF-Regelwerken. Für Erfassung und Fundstellensuche braucht es Sprachverständnis. |
| **Microsoft Copilot Studio** | Im MSIT-Programm bekannt, aber n8n ist die vorgegebene Kernplattform. Die Anbindung an Supabase ist in n8n direkter. |
| **Eigenes Frontend** (z. B. mit Lovable) | Kostet Build-Zeit ohne Prüfnutzen. Der n8n-Chat reicht für den Prototyp. |

## Komplexitätsübersicht je Komponente

Legende: **N** = konfigurierter Node · **E** = Expression · **C** = Code-Node · **KI** = AI-Node · *neu* = Sprint 2 (Verordnungsfall-Prüfung)

| Komponente | Zweck | Input → Output | Art | Warum diese Ebene | Wichtigster Edge Case | Test isoliert | Wartung |
|---|---|---|---|---|---|---|---|
| Rezeption: Verordnung eingeben | Eingang | Text der Rezeption → Chat-Nachricht | N | Chat Trigger reicht | Leere oder unvollständige Nachricht | Manuell im Chat | n8n-Grundkenntnisse |
| Verordnung erfassen (+ Schema Verordnung) | Freitext in festes Schema | Text → JSON-Verordnung | KI + N | Freitext braucht Sprachverständnis, Output Parser erzwingt das Schema | Fehlende Angabe wird geraten statt `null` | Testfälle als Text eingeben, JSON vergleichen | Prompt-Pflege |
| Fristen berechnen | Berechnete Fakten | JSON-Verordnung + Prüfdatum → Fristen, LANR/BSNR-Format, ICD → WS/EX, Summen | C | Datumsarithmetik und Formatregeln sind keine Sprachaufgabe (Evaluation v1–v3) | Genau 28 bzw. 14 Tage, dringlich, bereits begonnene Behandlung | `tests/fakten.test.mjs` (13/13) | JavaScript + HeilM-RL |
| *neu* Historie abfragen | Frühere Verordnungen desselben Falls | Pseudonym, ICD 3-stellig, Diagnosegruppe, LANR → Liste früherer Verordnungen | N (Supabase, Get many mit Filter) | Einfacher gefilterter Lesezugriff | Keine Historie (erste Verordnung), mehrere Treffer am selben Tag | Seed mit synthetischen Vorverordnungen | n8n-Grundkenntnisse |
| *neu* Verordnungsfall berechnen | Verordnungsfall-Prüfung | Historie + aktuelle Verordnung → Einheiten bisher, Summe, orientierende Menge überschritten ja/nein | C | 6-Monats-Regel und Fallabgrenzung (§ 7 HeilM-RL) wären als Node-Kette unlesbar | Lücke genau 6 Monate, anderer Arzt = neuer Fall | Neue Tests in `tests/` | JavaScript + HeilM-RL |
| Formal-, Diagnose-, Mengen-, Fristen-Prüfer (+ Regelwerk, Embeddings, Schema Befunde) | Prüfung je Mandat mit Fundstelle | Verordnung + Fakten → Befunde im JSON-Schema | KI + N | Regeltext finden und anwenden braucht RAG; Vector Store und Output Parser sind native Nodes | Plausibel klingender, aber falscher Befund | Testfälle je Prüfer, Befunde gegen Soll | Prompt-Pflege, Fachwissen |
| Befunde sammeln | Vier Ergebnisse zusammenführen | 4 × Befunde → 1 Liste | N (Merge) | Standardfunktion | Ein Prüfer liefert nichts | Ausführungsprotokoll | n8n-Grundkenntnisse |
| Ergebnis zusammenführen | Ampel und Absetzungsrisiko | Befunde → Ampel, Risiko €, Antworttext | C | Ampelregel muss deterministisch und nachvollziehbar sein | Widersprüchliche Befunde zweier Prüfer | Fixe Befundlisten → erwartete Ampel | JavaScript |
| Befunde vorbereiten | Zeilen für das Protokoll | Befundliste → eine Zeile je Befund | C | Umformen verschachtelter Arrays | Leere Befundliste | Ausführungsprotokoll | JavaScript |
| Prüfung / Befunde protokollieren | Nachweis | Ergebnis → Zeilen in `pruefungen`, `befunde` | N (Supabase) | Standard-Insert | Datenbank nicht erreichbar | Abfrage in Supabase nach Testlauf | n8n-Grundkenntnisse |
| Antwort an Rezeption | Ausgabe | Ampel + Hinweise → Chat-Antwort | N (Set) + E | Nur Feldzuordnung | Sehr lange Hinweisliste | Manuell im Chat | n8n-Grundkenntnisse |

**Zusätzlicher Wartungsaufwand durch Code:** Vier Code-Nodes (künftig fünf) brauchen jemanden, der JavaScript lesen kann und die Heilmittel-Richtlinie kennt. Gegenmittel: Tests im Repo, Kommentare im Code, Regeln mit Paragraf im Code benannt.
