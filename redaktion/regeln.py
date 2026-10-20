"""Regex-Regeln und Span-Logik der PII-Redaktion (ohne Modell, ohne Netz).

Aufgabenteilung:
  * Regeln fangen strukturierte Identifikatoren ab, die ein NER-Modell systematisch
    übersieht (Versichertennummer, IBAN, LANR/BSNR, Geburtsdatum in festem Format).
  * Das Modell findet Namen und Adressen im Fließtext, auch ohne Rollenwort
    („Mustermann klagt über …").

Beide liefern Spannen auf dem Originaltext. Bei Überlappung gewinnt die Regel, und
medizinisch notwendige Angaben (ICD-Codes, Datumswerte, Einheiten) sind vor dem
Modell geschützt – sonst würde die Prüfung unbrauchbar, weil ein Modell „M54.4"
gern als Hausnummer liest.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Label -> Marker. Labels, die hier fehlen (DATE, TIME, AGE, GENDER, SEX, TITLE),
# bleiben bewusst stehen: Ausstellungs- und Behandlungsdaten braucht die Fristenprüfung.
# PER/LOC/ORG kommen vom Standardmodell (Davlan, multilingual), die übrigen Labels
# von den ai4privacy-Modellen – so lässt sich das Modell per Umgebungsvariable tauschen.
MARKE_FUER_LABEL: dict[str, str] = {
    "PER": "[Name]",
    "LOC": "[Ort]",
    "ORG": "[Organisation]",
    "SURNAME": "[Name]",
    "GIVENNAME": "[Name]",
    "CITY": "[Ort]",
    "STREET": "[Anschrift]",
    "BUILDINGNUM": "[Anschrift]",
    "ZIPCODE": "[PLZ]",
    "TELEPHONENUM": "[Telefon]",
    "EMAIL": "[E-Mail]",
    "SOCIALNUM": "[Versichertennummer]",
    "IDCARDNUM": "[Ausweisnummer]",
    "PASSPORTNUM": "[Ausweisnummer]",
    "DRIVERLICENSENUM": "[Führerscheinnummer]",
    "CREDITCARDNUMBER": "[Kartennummer]",
    "TAXNUM": "[Steuernummer]",
}

# Anzeigename je Marker für die Antwort ("entfernt": [...]).
NAME_FUER_MARKE: dict[str, str] = {
    "[Name]": "Name",
    "[Ort]": "Ort",
    "[Organisation]": "Organisation",
    "[Anschrift]": "Anschrift",
    "[PLZ]": "PLZ",
    "[PLZ Ort]": "PLZ und Ort",
    "[Telefon]": "Telefonnummer",
    "[E-Mail]": "E-Mail",
    "[Versichertennummer]": "Versichertennummer",
    "[Ausweisnummer]": "Ausweisnummer",
    "[Führerscheinnummer]": "Führerscheinnummer",
    "[Kartennummer]": "Kartennummer",
    "[Steuernummer]": "Steuernummer",
    "[Geburtsdatum]": "Geburtsdatum",
    "[Arzt]": "Arzt",
    "[Praxis]": "Praxis",
    "[IBAN]": "IBAN",
    "LANR [LANR]": "LANR",
    "BSNR [BSNR]": "BSNR",
}

# Diese Bereiche darf ein Modell nie maskieren: ohne sie ist keine Prüfung möglich.
GESCHUETZT: list[re.Pattern[str]] = [
    re.compile(r"\b[A-Z]\d{2}\.\d{1,2}\b"),  # ICD-10-GM, z. B. M54.4
    re.compile(r"\b[A-Z]\d{2}\b"),  # Code ohne Punkt, z. B. M54
    re.compile(r"\b\d{1,2}\.\d{1,2}\.\d{4}\b"),  # Datum – die Geburtsregel maskiert selbst
    re.compile(r"\b\d{1,3}\s?(?:x|mal)\b", re.IGNORECASE),  # 6x, 2x
    re.compile(r"\b\d{1,3}\b"),  # Einheiten und Frequenzen
    # Feldbezeichnungen des Vordrucks: das Modell hält «KVNR» gern für eine Organisation.
    re.compile(
        r"\b(?:KVNR|LANR|BSNR|IK|ICD(?:-10(?:-GM)?)?|Geb\.|Diagnosegruppe|Leitsymptomatik"
        r"|Heilmittel(?:bereich)?|Krankengymnastik|KG|MT|KMT|WT|WS|EX|BVG|SER)\b"
    ),
]

# Eine Ziffernfolge, die nur wie eine Telefonnummer aussieht, aber ein Datum ist.
DATUM = re.compile(r"^\d{1,2}\.\d{1,2}\.\d{4}$")

NUMERISCH = re.compile(r"\b(?:\+49|0049|0)[ \t\d/.-]{6,}\d")

# (Name, Muster, Marke, Gruppe?) – Gruppe = nur dieser Teil wird maskiert.
REGELN: list[tuple[str, re.Pattern[str], str, str | None]] = [
    # Geburtsdatum zuerst: sonst greift die Telefonnummern-Regel.
    (
        "geburtsdatum",
        re.compile(
            r"\b(?:geb(?:oren|\.)?\s*(?:am)?|Geb\.?-?Datum|Geburtsdatum)\s*:?\s*\d{1,2}\.\d{1,2}\.\d{4}",
            re.IGNORECASE,
        ),
        "[Geburtsdatum]",
        None,
    ),
    ("versichertennummer", re.compile(r"\b[A-Z]{1,2}\d{8,10}\b"), "[Versichertennummer]", None),
    ("email", re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+"), "[E-Mail]", None),
    (
        "telefon",
        re.compile(r"\b(?:Tel\.?|Telefon|Mobil|Handy|Fax)\s*:?\s*\+?[\d \t/()-]{6,}\d", re.IGNORECASE),
        "[Telefon]",
        None,
    ),
    ("iban-de", re.compile(r"\bDE\d{2}(?: ?\d{4}){4} ?\d{2}\b"), "[IBAN]", None),
    ("iban", re.compile(r"\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7} ?[A-Z0-9]{0,2}\b"), "[IBAN]", None),
    ("lanr", re.compile(r"\bLANR\s*:?\s*\d{6,10}\b", re.IGNORECASE), "LANR [LANR]", None),
    ("bsnr", re.compile(r"\bBSNR\s*:?\s*\d{6,10}\b", re.IGNORECASE), "BSNR [BSNR]", None),
    # Rollenwort bleibt stehen, nur der Name wird maskiert. Ziffern sind im Namen
    # ausgeschlossen, damit ein folgender ICD-Code stehen bleibt.
    (
        "rolle-name",
        re.compile(
            r"\b(?:Patient(?:in|en)?|Versicherte(?:r|n)?|Herr(?:n)?|Frau(?:en)?|Kind(?:er)?|Sohn|Tochter"
            r"|Ehefrau|Ehemann|Lebenspartner(?:in)?|Mutter|Vater|Angehörige(?:r|n)?)"
            r"\s+(?:Dr\.\s*)?(?:med\.\s*)?(?P<name>[A-ZÄÖÜ][a-zäöüß-]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)*)"
        ),
        "[Name]",
        "name",
    ),
    (
        "arzt",
        re.compile(r"\bDr\.\s*(?:med\.\s*)?(?:dent\.\s*)?[A-ZÄÖÜ][a-zäöüß-]+(?:\s+[A-ZÄÖÜ][a-zäöüß-]+)*"),
        "[Arzt]",
        None,
    ),
    ("name-zeile", re.compile(r"\b(?:Nach)?[Nn]ame\s*:\s*[^\n;,]+"), "[Name]", None),
    (
        "anschrift",
        re.compile(
            r"\b[A-ZÄÖÜ][a-zäöüß]+(?:straße|strasse|str\.|weg|allee|platz|ring|gasse|damm|ufer)\s*\d+[a-z]?\b",
            re.IGNORECASE,
        ),
        "[Anschrift]",
        None,
    ),
    ("plz-ort", re.compile(r"\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?"), "[PLZ Ort]", None),
    (
        "praxis",
        re.compile(
            r"\bPraxis\s+(?:(?:am|an der|im|für)\s+)?(?:Dr\.\s*(?:med\.\s*)?)?[A-ZÄÖÜ][a-zäöüß-]+"
            r"(?:\s+[A-ZÄÖÜ][a-zäöüß-]+){0,2}"
        ),
        "[Praxis]",
        None,
    ),
]


@dataclass(frozen=True)
class Spann:
    start: int
    end: int
    marke: str
    quelle: str  # "regel" oder "modell"

    def ueberlappt(self, andere: "Spann") -> bool:
        return self.start < andere.end and andere.start < self.end


def _ohne_rand(text: str, spann: Spann) -> Spann | None:
    """Leerraum am Rand entfernen – sonst verschwindet beim Ersetzen ein Leerzeichen."""
    start, ende = spann.start, spann.end
    while start < ende and text[start].isspace():
        start += 1
    while ende > start and text[ende - 1].isspace():
        ende -= 1
    if ende - start < 2:
        return None
    return Spann(start, ende, spann.marke, spann.quelle)


def _rest(spann: Spann, blockierer: list[Spann]) -> list[Spann]:
    """Zieht blockierte Bereiche von einer Spanne ab (statt sie ganz zu verwerfen)."""
    teile = [(spann.start, spann.end)]
    for block in blockierer:
        neu: list[tuple[int, int]] = []
        for start, ende in teile:
            if block.end <= start or block.start >= ende:
                neu.append((start, ende))
                continue
            if block.start > start:
                neu.append((start, block.start))
            if block.end < ende:
                neu.append((block.end, ende))
        teile = neu
    return [Spann(s, e, spann.marke, spann.quelle) for s, e in teile if e > s]


def geschuetzte_spannen(text: str) -> list[Spann]:
    """Bereiche, die ein Modell nicht maskieren darf (ICD-Codes, Daten, Zahlen)."""
    return [Spann(m.start(), m.end(), "", "regel") for muster in GESCHUETZT for m in muster.finditer(text)]


def regel_spannen(text: str) -> list[Spann]:
    """Alle Regel-Treffer als Spannen; die Telefonnummern-Regel nimmt Datumswerte aus."""
    spannen: list[Spann] = []
    for treffer in NUMERISCH.finditer(text):
        if DATUM.match(treffer.group().strip()):
            continue
        spannen.append(Spann(treffer.start(), treffer.end(), "[Telefon]", "regel"))
    for _name, muster, marke, gruppe in REGELN:
        for treffer in muster.finditer(text):
            if gruppe:
                start, ende = treffer.start(gruppe), treffer.end(gruppe)
            else:
                start, ende = treffer.start(), treffer.end()
            spannen.append(Spann(start, ende, marke, "regel"))
    return spannen


def modell_spannen(text: str, treffer: list[dict], schwelle: float) -> list[Spann]:
    """Übersetzt Modell-Treffer in Spannen und schneidet geschützte Bereiche heraus."""
    blockiert = geschuetzte_spannen(text)
    spannen: list[Spann] = []
    for eintrag in treffer:
        if eintrag.get("score", 1.0) < schwelle:
            continue
        label = (eintrag.get("entity_group") or eintrag.get("entity") or "").replace("B-", "").replace("I-", "")
        marke = MARKE_FUER_LABEL.get(label)
        if not marke:
            continue
        ohne_rand = _ohne_rand(text, Spann(int(eintrag["start"]), int(eintrag["end"]), marke, "modell"))
        if ohne_rand:
            spannen.extend(_rest(ohne_rand, blockiert))
    return spannen


def verschmelze(text: str, spannen: list[Spann]) -> list[Spann]:
    """Sortiert, löst Überlappungen (Regel vor Modell) und fasst gleiche Marker zusammen."""
    sortiert = sorted(spannen, key=lambda s: (s.start, s.quelle != "regel", -(s.end - s.start)))
    behalten: list[Spann] = []
    for spann in sortiert:
        if any(b.ueberlappt(spann) for b in behalten):
            continue
        behalten.append(spann)

    # "[Name] [Name]" bzw. "[Anschrift], [Anschrift]" zu einem Marker zusammenfassen.
    zusammengefasst: list[Spann] = []
    for spann in behalten:
        letzte = zusammengefasst[-1] if zusammengefasst else None
        if letzte and letzte.marke == spann.marke and set(text[letzte.end : spann.start]) <= set(" \t,"):
            zusammengefasst[-1] = Spann(letzte.start, spann.end, letzte.marke, letzte.quelle)
        else:
            zusammengefasst.append(spann)
    return zusammengefasst


def wende_an(text: str, spannen: list[Spann]) -> str:
    """Ersetzt die Spannen von rechts nach links, damit die Positionen gültig bleiben."""
    ergebnis = text
    for spann in sorted(spannen, key=lambda s: s.start, reverse=True):
        ergebnis = ergebnis[: spann.start] + spann.marke + ergebnis[spann.end :]
    return ergebnis


def redigiere(text: str, modell_treffer: list[dict], schwelle: float = 0.5) -> tuple[str, list[str]]:
    """Führt Regeln und Modell zusammen und liefert (redigierter Text, entfernte Kategorien)."""
    if not isinstance(text, str) or not text.strip():
        return text, []
    spannen = verschmelze(text, regel_spannen(text) + modell_spannen(text, modell_treffer, schwelle))
    if not spannen:
        return text, []
    entfernt: list[str] = []
    for spann in spannen:
        name = NAME_FUER_MARKE.get(spann.marke, spann.marke.strip("[]"))
        if name not in entfernt:
            entfernt.append(name)
    return wende_an(text, spannen), entfernt
