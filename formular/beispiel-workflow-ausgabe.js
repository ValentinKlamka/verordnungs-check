// Beispiel-Ausgabe des n8n-Workflows „Verordnungs-Check – Vier Prüfer".
//
// Aufbau = Objekt aus dem Code-Node „Ergebnis zusammenführen":
//   verordnung_ref, eingabe.verordnung, eingabe.fakten, gesamtstatus,
//   absetzungsrisiko_eur, zusammenfassung, dauer_ms, freigabe,
//   diagnose_auswahl, befunde, antwort
//
// Die Datei ist bewusst eine JS-Datei (kein JSON): Aus dem Dateisystem heraus
// (file://) blockiert der Browser fetch() auf lokale Dateien, die Vorschau ließe
// sich sonst nur über einen lokalen Server öffnen.
//
// Alle Angaben sind synthetisch (Muster-Praxis, Musterkasse, erfundene Nummern).
// Der Fall ist ein Physiotherapie-Beispiel: Der Freitext nennt vier Diagnosen,
// auf den Vordruck passen zwei („icd10" + „weitere_diagnosen"). Auswahlregel und
// Feldzuordnung: docs/vordruck-muster13.md
window.BEISPIEL_WORKFLOW_AUSGABE = {
  verordnung_ref: "VO-2001",
  eingabe: {
    verordnung: {
      verordnung_ref: "VO-2001",
      // --- Personalienblock ---
      patient: {
        krankenkasse: "Musterkasse",
        nachname: "Mustermann",
        vorname: "Erika",
        geburtsdatum: "1972-04-18",
        kostentraegerkennung: "999999999",
        versichertennummer: "A123456789",
        versichertenstatus: "Mitglied",
      },
      bsnr: "987654300",
      lanr: "123456701",
      ausstellungsdatum: "2026-10-05",
      // --- Kennzeichen links ---
      zuzahlung: "pflicht",
      unfallfolgen: false,
      bvg_ser: false,
      // --- Heilmittelbereich (genau eine Auswahl) ---
      heilmittelbereich: "physiotherapie",
      // --- Diagnosen aus dem Freitext, so wie der Extraktor sie erkennt ---
      // Ein Code-Node wählt daraus die zwei Zeilen des Vordrucks aus (Regel in
      // docs/vordruck-muster13.md, Abschnitt 5).
      diagnosen: [
        { code: "M54.4", bezeichnung: "Lumboischialgie", anlass: true },
        {
          code: "M51.1",
          bezeichnung: "Lumbale und sonstige Bandscheibenschäden mit Radikulopathie",
          anlass: false,
        },
        { code: "M17.1", bezeichnung: "Sonstige primäre Gonarthrose", anlass: false },
        {
          code: "I10.9",
          bezeichnung: "Essentielle Hypertonie, nicht näher bezeichnet",
          anlass: false,
        },
      ],
      // --- Behandlungsrelevante Diagnose(n): zwei ICD-10-GM-Zeilen ---
      icd10: "M54.4",
      icd10_bezeichnung: "Lumboischialgie",
      weitere_diagnosen: [
        {
          code: "M51.1",
          bezeichnung: "Lumbale und sonstige Bandscheibenschäden mit Radikulopathie",
        },
      ],
      // Erkannt, aber nicht auf den Vordruck übernommen (Begründung in docs/vordruck-muster13.md)
      nicht_verordnungsrelevant: [
        {
          code: "M17.1",
          bezeichnung: "Sonstige primäre Gonarthrose",
          grund: "andere Körperregion, nicht Anlass der Verordnung",
        },
        {
          code: "I10.9",
          bezeichnung: "Essentielle Hypertonie, nicht näher bezeichnet",
          grund: "internistische Begleiterkrankung ohne Bezug zum Heilmittel",
        },
      ],
      diagnosegruppe: "WS",
      leitsymptomatik: "a",
      leitsymptomatik_freitext: null,
      // --- Heilmittel nach Maßgabe des Kataloges: 3 Zeilen + 1 ergänzendes ---
      heilmittel: [{ name: "KG", einheiten: 6, art: "vorrangig" }],
      ergaenzendes_heilmittel: null,
      frequenz: "2x/Woche", // Feld „Therapiefrequenz" auf dem Vordruck
      therapiebericht: false,
      hausbesuch: false,
      dringlich: false,
      // Auf dem Vordruck liegt die Unterschrift vor (Stempelfeld) – die Maske sendet sie immer mit.
      unterschrift: true,
      therapieziele_hinweise:
        "Schmerzreduktion und Aufbau der Rumpfstabilität; Anleitung zu einem Heimprogramm.",
      // --- Prüfgrundlage (nicht Teil des Vordrucks) ---
      pruefdatum: "2026-10-12",
      geplanter_beginn: "2026-10-13",
      letzte_behandlung: null,
      unterbrechungsgrund: null,
      kostentraeger: "GKV",
      arzt: {
        name: "Dr. med. Anna Beispiel",
        fachrichtung: "Orthopädie",
        betriebsstaette: "Praxis am Musterplatz, Musterstadt",
      },
    },
    fakten: {
      frist_grenze_tage: 28,
      dringlich: false,
      bereits_begonnen: false,
      tage_ausstellung_bis_beginn: 8,
      beginn_fristgerecht: true,
      tage_unterbrechung: null,
      unterbrechung_grenze_tage: 14,
      unterbrechung_zulaessig: null,
      summe_einheiten: 6,
      anzahl_vorrangige_heilmittel: 1,
      lanr_format_ok: true,
      bsnr_format_ok: true,
      icd_passende_diagnosegruppe: "WS",
      diagnosegruppe_passt_zu_icd: true,
    },
  },
  gesamtstatus: "gruen",
  absetzungsrisiko_eur: 0,
  zusammenfassung: "🟢 Verordnung in Ordnung",
  dauer_ms: 23800,
  freigabe: "offen",
  diagnose_auswahl: {
    fuehrend: { code: "M54.4", bezeichnung: "Lumboischialgie", anlass: true },
    zweite: {
      code: "M51.1",
      bezeichnung: "Lumbale und sonstige Bandscheibenschäden mit Radikulopathie",
      anlass: false,
    },
    erkannt: 4,
    hinweise: [],
  },
  befunde: [
    {
      agent: "formal",
      feld: "Pflichtangaben (LANR, BSNR, ICD-10, Leitsymptomatik, Unterschrift)",
      status: "ok",
      fundstelle: "§ 13 Abs. 2 HeilM-RL; Vordruckvereinbarung Anlage 2, Nr. 2.13",
      korrekturhinweis: "Alle Pflichtangaben vorhanden.",
    },
    {
      agent: "diagnose",
      feld: "Diagnosegruppe",
      status: "ok",
      fundstelle: "Heilmittelkatalog, Diagnosengruppe WS",
      korrekturhinweis: "M54.4 gehört zur Diagnosengruppe WS und passt zum Heilmittel KG.",
    },
    {
      agent: "menge",
      feld: "Behandlungseinheiten",
      status: "ok",
      fundstelle: "Heilmittelkatalog, Höchstmenge je Verordnung bei WS",
      korrekturhinweis: "6 Einheiten liegen im Rahmen der Höchstmenge (bis zu 6x je Verordnung).",
    },
    {
      agent: "frist",
      feld: "Datum / Behandlungsbeginn",
      status: "ok",
      fundstelle: "§ 15 Abs. 1 HeilM-RL",
      korrekturhinweis: "Beginn 8 Tage nach Ausstellungsdatum (Grenze 28 Tage).",
    },
  ],
  antwort:
    "**Verordnungs-Check VO-2001**\n\n🟢 Verordnung in Ordnung\n\n4 Prüfpunkte von 4 Prüfern, davon 4 in Ordnung.",
};
