// Erzeugt aus supabase/seed/testfaelle.sql – nicht von Hand bearbeiten.
// Neu erzeugen mit: npm run vorlagen:daten
window.VORLAGEN = [
  {
    "id": "TF01",
    "name": "korrekt",
    "erwartet": "gruen",
    "beschreibung": "Vollständig und regelkonform",
    "verordnung": {
      "verordnung_ref": "VO-0001",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": "M54.4",
      "diagnosegruppe": "WS",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF02",
    "name": "Behandlungsbeginn zu spät",
    "erwartet": "rot",
    "beschreibung": "Beginn 41 Tage nach Ausstellung, Grenze 28 Tage",
    "verordnung": {
      "verordnung_ref": "VO-0002",
      "ausstellungsdatum": "2026-09-01",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-12",
      "dringlich": false,
      "icd10": "M54.4",
      "diagnosegruppe": "WS",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF03",
    "name": "ICD passt nicht zur Diagnosegruppe",
    "erwartet": "rot",
    "beschreibung": "Schulter-Diagnose (Rotatorenmanschette) mit Wirbelsäulen-Diagnosegruppe",
    "verordnung": {
      "verordnung_ref": "VO-0003",
      "ausstellungsdatum": "2026-10-06",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-14",
      "dringlich": false,
      "icd10": "M75.1",
      "diagnosegruppe": "WS",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "1-2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF04",
    "name": "Höchstmenge überschritten",
    "erwartet": "rot",
    "beschreibung": "10 Einheiten bei WS, Höchstmenge je Verordnung 6",
    "verordnung": {
      "verordnung_ref": "VO-0004",
      "ausstellungsdatum": "2026-10-07",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": "M54.4",
      "diagnosegruppe": "WS",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 10,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF05",
    "name": "Pflichtangaben fehlen",
    "erwartet": "rot",
    "beschreibung": "Leitsymptomatik und Arztnummer fehlen",
    "verordnung": {
      "verordnung_ref": "VO-0005",
      "ausstellungsdatum": "2026-10-08",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-15",
      "dringlich": false,
      "icd10": "M54.4",
      "diagnosegruppe": "WS",
      "leitsymptomatik": null,
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": null,
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF06",
    "name": "Unterbrechung zu lang",
    "erwartet": "rot",
    "beschreibung": "22 Tage Pause ohne dokumentierten Grund, Grenze 14 Tage",
    "verordnung": {
      "verordnung_ref": "VO-0006",
      "ausstellungsdatum": "2026-09-10",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-12",
      "dringlich": false,
      "icd10": "S83.5",
      "diagnosegruppe": "EX",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": "2026-09-20",
      "unterbrechungsgrund": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF07",
    "name": "Dringlich, aber zu spät",
    "erwartet": "rot",
    "beschreibung": "Dringlicher Behandlungsbedarf: Grenze 14 Tage, hier 18 Tage",
    "verordnung": {
      "verordnung_ref": "VO-0007",
      "ausstellungsdatum": "2026-09-24",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-12",
      "dringlich": true,
      "icd10": "S83.5",
      "diagnosegruppe": "EX",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF08",
    "name": "Kontrollfall Knie korrekt",
    "erwartet": "gruen",
    "beschreibung": "Kontrollfall (nicht zum Nachbessern verwendet): Gonarthrose mit EX, regelkonform",
    "verordnung": {
      "verordnung_ref": "VO-0008",
      "ausstellungsdatum": "2026-10-02",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-14",
      "dringlich": false,
      "icd10": "M17.1",
      "diagnosegruppe": "EX",
      "leitsymptomatik": "b",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "1-2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF09",
    "name": "Kontrollfall HWS mit EX",
    "erwartet": "rot",
    "beschreibung": "Kontrollfall: zervikaler Bandscheibenschaden (Wirbelsäule) mit Diagnosegruppe EX",
    "verordnung": {
      "verordnung_ref": "VO-0009",
      "ausstellungsdatum": "2026-10-07",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": "M50.1",
      "diagnosegruppe": "EX",
      "leitsymptomatik": "a",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF10",
    "name": "Kontrollfall dringlich, fristgerecht",
    "erwartet": "gruen",
    "beschreibung": "Kontrollfall: Schulterdistorsion, dringlich, Beginn nach 7 Tagen (Grenze 14)",
    "verordnung": {
      "verordnung_ref": "VO-0010",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-12",
      "dringlich": true,
      "icd10": "S43.4",
      "diagnosegruppe": "EX",
      "leitsymptomatik": "c",
      "heilmittel": [
        {
          "name": "KG",
          "einheiten": 6,
          "art": "vorrangig"
        }
      ],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  }
];
