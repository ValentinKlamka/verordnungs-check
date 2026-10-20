"""Tests der Redaktionsregeln ohne Modell: Aufruf mit `python -m unittest` in redaktion/."""

import unittest

from regeln import redigiere, regel_spannen, verschmelze, wende_an


def nur_regeln(text):
    rot, entfernt = redigiere(text, [])
    return rot, entfernt


class RegelnTest(unittest.TestCase):
    def test_versichertennummer_und_kontakt(self):
        text = "KVNR A123456789, Mail erika@example.de, Telefon 0721 445566."
        rot, entfernt = nur_regeln(text)
        self.assertNotIn("A123456789", rot)
        self.assertNotIn("erika@example.de", rot)
        self.assertNotIn("445566", rot)
        self.assertIn("[Versichertennummer]", rot)
        self.assertIn("Telefonnummer", entfernt)

    def test_geburtsdatum_ist_keine_telefonnummer(self):
        rot, _ = nur_regeln("Patientin Erika Mustermann, geb. 03.04.1958, wohnhaft Rosenweg 12.")
        self.assertIn("[Geburtsdatum]", rot)
        self.assertNotIn("1958", rot)

    def test_ausstellungsdatum_bleibt(self):
        rot, _ = nur_regeln("Ausstellungsdatum 15.10.2026, Behandlungsbeginn 22.10.2026.")
        self.assertIn("15.10.2026", rot)
        self.assertIn("22.10.2026", rot)

    def test_icd_code_hinter_name_bleibt(self):
        rot, _ = nur_regeln("Bandscheibenschäden bei Frau Müller M51.1, Lumboischialgie M54.4.")
        self.assertNotIn("Müller", rot)
        self.assertIn("M51.1", rot)
        self.assertIn("M54.4", rot)

    def test_lanr_und_bsnr(self):
        rot, _ = nur_regeln("Verordnet von Dr. med. Anna Beispiel, LANR 123456789, BSNR 987654300.")
        self.assertNotIn("123456789", rot)
        self.assertNotIn("987654300", rot)
        self.assertIn("LANR [LANR]", rot)
        self.assertIn("BSNR [BSNR]", rot)

    def test_telefon_schluckt_folgetext_nicht(self):
        rot, _ = nur_regeln("Telefon 0721 445566, E-Mail egal. Praxis am Markt. Diagnose M54.4.")
        self.assertIn("[Telefon], E-Mail", rot)
        self.assertIn("Diagnose M54.4", rot)


class ModellTest(unittest.TestCase):
    """Modell-Treffer werden übernommen – hier mit erfundenen Spans statt echtem Modell."""

    def test_name_ohne_rollenwort_wird_erkannt(self):
        text = "Mustermann klagt über Rückenschmerzen."
        treffer = [{"entity_group": "SURNAME", "score": 0.99, "start": 0, "end": 10}]
        rot, entfernt = redigiere(text, treffer)
        self.assertEqual(rot, "[Name] klagt über Rückenschmerzen.")
        self.assertEqual(entfernt, ["Name"])

    def test_datum_wird_nicht_vom_modell_maskiert(self):
        text = "Behandlungsbeginn 22.10.2026."
        treffer = [{"entity_group": "DATE", "score": 0.99, "start": 17, "end": 27}]
        rot, entfernt = redigiere(text, treffer)
        self.assertIn("22.10.2026", rot)
        self.assertEqual(entfernt, [])

    def test_schwache_treffer_werden_ignoriert(self):
        text = "Musterstadt ist ein Ort."
        treffer = [{"entity_group": "CITY", "score": 0.2, "start": 0, "end": 11}]
        rot, _ = redigiere(text, treffer, schwelle=0.5)
        self.assertIn("Musterstadt", rot)

    def test_regel_gewinnt_bei_ueberlappung(self):
        text = "KVNR A123456789"
        treffer = [{"entity_group": "IDCARDNUM", "score": 0.99, "start": 5, "end": 15}]
        rot, entfernt = redigiere(text, treffer)
        self.assertIn("[Versichertennummer]", rot)
        self.assertNotIn("[Ausweisnummer]", rot)

    def test_gleiche_marker_werden_zusammengefasst(self):
        text = "Erika Mustermann"
        treffer = [
            {"entity_group": "GIVENNAME", "score": 0.99, "start": 0, "end": 5},
            {"entity_group": "SURNAME", "score": 0.99, "start": 6, "end": 16},
        ]
        rot, _ = redigiere(text, treffer)
        self.assertEqual(rot, "[Name]")

    def test_leerer_text(self):
        self.assertEqual(redigiere("", []), ("", []))
        self.assertEqual(redigiere("   ", []), ("   ", []))


class SpannenTest(unittest.TestCase):
    def test_wende_an_von_rechts_nach_links(self):
        text = "A und B"
        spannen = regel_spannen(text)
        self.assertEqual(wende_an(text, spannen), text)

    def test_verschmelze_sortiert(self):
        text = "Herr Müller"
        spannen = regel_spannen(text)
        zusammengefasst = verschmelze(text, spannen)
        self.assertEqual([s.start for s in zusammengefasst], sorted(s.start for s in zusammengefasst))


if __name__ == "__main__":
    unittest.main()
