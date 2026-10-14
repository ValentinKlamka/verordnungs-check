-- Auswahl der zwei ICD-10-GM-Zeilen des Vordrucks Muster 13.
--
-- Der Code-Node „Diagnosen auswählen" liefert sie als eigenes Feld im Ergebnis
-- (führende Diagnose, zweite Diagnose, Anzahl erkannter Codes, Hinweise). Damit
-- bleibt im Prüfprotokoll nachvollziehbar, warum welche Diagnose auf dem
-- Vordruck steht und welche mit welcher Begründung verworfen wurde
-- (Regel: docs/vordruck-muster13.md, Abschnitt 5).
alter table public.pruefungen add column if not exists diagnose_auswahl jsonb;
