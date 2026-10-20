"""Lokaler Redaktionsdienst für den Verordnungs-Check.

Ein kleines Modell von HuggingFace erkennt Namen, Adressen und Kontaktdaten im
Freitext; die Regeln in `regeln.py` ergänzen die strukturierten Identifikatoren
(Versichertennummer, IBAN, LANR/BSNR …). Das Modell läuft lokal, das Image wird
mitgeliefert – der Dienst spricht im Betrieb nicht nach außen.

Start:  uvicorn app:app --host 0.0.0.0 --port 5680
"""

from __future__ import annotations

import os
import re
import time

from fastapi import FastAPI
from pydantic import BaseModel, Field
from transformers import pipeline

from regeln import redigiere

MODELL = os.environ.get("REDAKTION_MODELL", "Davlan/bert-base-multilingual-cased-ner-hrl")
SCHWELLE = float(os.environ.get("REDAKTION_SCHWELLE", "0.5"))
MAX_ZEICHEN = 1500

app = FastAPI(title="Verordnungs-Check Redaktion", version="1.0")

_ner = None


def ner():
    """Lädt das Modell beim ersten Aufruf (dauert einmalig ein paar Sekunden)."""
    global _ner
    if _ner is None:
        _ner = pipeline(
            "token-classification",
            model=MODELL,
            aggregation_strategy="simple",
            device=-1,
        )
    return _ner


SATZENDE = re.compile(r"(?<=[.!?])\s+")


def zerlege(text: str, max_zeichen: int = MAX_ZEICHEN) -> list[str]:
    """Teilt langen Text an Satzgrenzen – das Modell soll nichts abschneiden."""
    if len(text) <= max_zeichen:
        return [text]
    stuecke, aktuell = [], ""
    for satz in SATZENDE.split(text):
        if aktuell and len(aktuell) + len(satz) + 1 > max_zeichen:
            stuecke.append(aktuell)
            aktuell = satz
        else:
            aktuell = f"{aktuell} {satz}".strip() if aktuell else satz
    if aktuell:
        stuecke.append(aktuell)
    return stuecke


def redigiere_text(text: str) -> tuple[str, list[str]]:
    """Regeln + Modell je Textstück, dann zusammensetzen."""
    if not isinstance(text, str) or not text.strip():
        return text, []
    ergebnis, entfernt = [], []
    for stueck in zerlege(text):
        treffer = ner()(stueck)
        rot, labels = redigiere(stueck, treffer, SCHWELLE)
        ergebnis.append(rot)
        for label in labels:
            if label not in entfernt:
                entfernt.append(label)
    return " ".join(ergebnis), entfernt


class Anfrage(BaseModel):
    text: str | None = None
    texte: list[str] = Field(default_factory=list)


@app.get("/gesund")
def gesund() -> dict:
    return {"status": "ok", "modell": MODELL, "schwelle": SCHWELLE}


@app.post("/redigieren")
def redigieren(anfrage: Anfrage) -> dict:
    start = time.perf_counter()
    if anfrage.text is not None:
        rot, entfernt = redigiere_text(anfrage.text)
        return {
            "text": rot,
            "entfernt": entfernt,
            "modell": MODELL,
            "dauer_ms": round((time.perf_counter() - start) * 1000, 1),
        }
    ergebnisse = []
    for eintrag in anfrage.texte:
        rot, entfernt = redigiere_text(eintrag)
        ergebnisse.append({"text": rot, "entfernt": entfernt})
    return {
        "texte": ergebnisse,
        "modell": MODELL,
        "dauer_ms": round((time.perf_counter() - start) * 1000, 1),
    }
