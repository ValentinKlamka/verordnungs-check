// Erzeugt aus supabase/seed/testfaelle.sql – nicht von Hand bearbeiten.
// Neu erzeugen mit: npm run vorlagen:daten
window.VORLAGEN = [
  {
    "id": "TF01",
    "name": "korrekt",
    "erwartet": "gruen",
    "erwartete_befunde": [],
    "beschreibung": "Vollständig und regelkonform, alle 18 Kriterien im grünen Bereich",
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
    "erwartete_befunde": [
      {
        "agent": "frist",
        "feld": "Behandlungsbeginn",
        "status": "fehlerhaft"
      }
    ],
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
    "erwartete_befunde": [
      {
        "agent": "diagnose",
        "feld": "Diagnosegruppe",
        "status": "fehlerhaft"
      }
    ],
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
    "erwartete_befunde": [
      {
        "agent": "menge",
        "feld": "Einheiten",
        "status": [
          "fehlerhaft",
          "hinweis"
        ]
      }
    ],
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
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "LANR",
        "status": "fehlt"
      },
      {
        "agent": "formal",
        "feld": "Leitsymptomatik",
        "status": "fehlt"
      }
    ],
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
    "erwartete_befunde": [
      {
        "agent": "frist",
        "feld": "Unterbrechung",
        "status": "fehlerhaft"
      }
    ],
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
    "erwartete_befunde": [
      {
        "agent": "frist",
        "feld": "Behandlungsbeginn",
        "status": "fehlerhaft"
      }
    ],
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
    "erwartete_befunde": [],
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
    "erwartete_befunde": [
      {
        "agent": "diagnose",
        "feld": "Diagnosegruppe",
        "status": "fehlerhaft"
      }
    ],
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
    "erwartete_befunde": [],
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
  },
  {
    "id": "TF11",
    "name": "Kostenträger fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Kostenträger",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 1: kein Kostenträger eingetragen",
    "verordnung": {
      "verordnung_ref": "VO-0011",
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
      "kostentraeger": null
    }
  },
  {
    "id": "TF12",
    "name": "LANR mit falschem Format",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "LANR",
        "status": "fehlerhaft"
      }
    ],
    "beschreibung": "Kriterium 2: LANR vorhanden, aber nur 5 Ziffern (Format prüft der Code)",
    "verordnung": {
      "verordnung_ref": "VO-0012",
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
      "lanr": "12345",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF13",
    "name": "BSNR mit falschem Format",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "BSNR",
        "status": "fehlerhaft"
      }
    ],
    "beschreibung": "Kriterium 3: BSNR vorhanden, aber nur 5 Ziffern",
    "verordnung": {
      "verordnung_ref": "VO-0013",
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
      "bsnr": "98765",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF14",
    "name": "Ausstellungsdatum fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Ausstellungsdatum",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 4: kein Ausstellungsdatum (die Fristprüfung entfällt dadurch)",
    "verordnung": {
      "verordnung_ref": "VO-0014",
      "ausstellungsdatum": null,
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": null,
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
    "id": "TF15",
    "name": "Unterschrift fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Unterschrift",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 5: Verordnung nicht unterschrieben",
    "verordnung": {
      "verordnung_ref": "VO-0015",
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
      "unterschrift": false,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF16",
    "name": "ICD-10-Code fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "ICD-10",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 6: kein ICD-10-Code eingetragen",
    "verordnung": {
      "verordnung_ref": "VO-0016",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": null,
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
    "id": "TF17",
    "name": "Diagnosegruppe fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Diagnosegruppe",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 7: Diagnosegruppe nicht angekreuzt",
    "verordnung": {
      "verordnung_ref": "VO-0017",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": "M54.4",
      "diagnosegruppe": null,
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
    "id": "TF18",
    "name": "Leitsymptomatik fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Leitsymptomatik",
        "status": "fehlt"
      },
      {
        "agent": "diagnose",
        "feld": "Leitsymptomatik",
        "status": [
          "hinweis",
          "fehlt"
        ]
      }
    ],
    "beschreibung": "Kriterien 8 und 12: keine Leitsymptomatik – der Formal-Prüfer meldet fehlt, der Diagnose-Prüfer verweist darauf",
    "verordnung": {
      "verordnung_ref": "VO-0018",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
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
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF19",
    "name": "Heilmittel ohne Einheitenzahl",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Heilmittel",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 9: kein Heilmittel mit Behandlungseinheiten verordnet",
    "verordnung": {
      "verordnung_ref": "VO-0019",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": "M54.4",
      "diagnosegruppe": "WS",
      "leitsymptomatik": "a",
      "heilmittel": [],
      "frequenz": "2x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF20",
    "name": "Therapiefrequenz fehlt",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "formal",
        "feld": "Therapiefrequenz",
        "status": "fehlt"
      }
    ],
    "beschreibung": "Kriterium 10: keine Therapiefrequenz angegeben",
    "verordnung": {
      "verordnung_ref": "VO-0020",
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
      "frequenz": null,
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF21",
    "name": "Vier vorrangige Heilmittel",
    "erwartet": "rot",
    "erwartete_befunde": [
      {
        "agent": "menge",
        "feld": "Kombination",
        "status": [
          "fehlerhaft",
          "hinweis"
        ]
      }
    ],
    "beschreibung": "Kriterium 15: vier vorrangige Heilmittel (erlaubt sind höchstens drei), Summe bleibt mit 4 Einheiten im Rahmen",
    "verordnung": {
      "verordnung_ref": "VO-0021",
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
          "einheiten": 1,
          "art": "vorrangig"
        },
        {
          "name": "MT",
          "einheiten": 1,
          "art": "vorrangig"
        },
        {
          "name": "KMT",
          "einheiten": 1,
          "art": "vorrangig"
        },
        {
          "name": "WT",
          "einheiten": 1,
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
    "id": "TF22",
    "name": "Frequenz außerhalb des Rahmens",
    "erwartet": "gelb",
    "erwartete_befunde": [
      {
        "agent": "menge",
        "feld": "Therapiefrequenz",
        "status": [
          "hinweis",
          "fehlerhaft"
        ]
      }
    ],
    "beschreibung": "Kriterium 16: siebenmal wöchentlich liegt über der Empfehlung (1–3x)",
    "verordnung": {
      "verordnung_ref": "VO-0022",
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
      "frequenz": "7x/Woche",
      "lanr": "123456701",
      "bsnr": "987654300",
      "unterschrift": true,
      "letzte_behandlung": null,
      "kostentraeger": "GKV"
    }
  },
  {
    "id": "TF23",
    "name": "Besonderer Verordnungsbedarf",
    "erwartet": "gelb",
    "erwartete_befunde": [
      {
        "agent": "diagnose",
        "feld": "Verordnungsbedarf",
        "status": "hinweis"
      }
    ],
    "beschreibung": "Kriterium 13: M51.1 steht auf der KBV-Diagnoseliste (Hinweis, kein Fehler)",
    "verordnung": {
      "verordnung_ref": "VO-0023",
      "ausstellungsdatum": "2026-10-05",
      "pruefdatum": "2026-10-12",
      "geplanter_beginn": "2026-10-13",
      "dringlich": false,
      "icd10": "M51.1",
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
  }
];
