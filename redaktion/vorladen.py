"""Lädt das Redaktionsmodell beim Bauen des Images in den HuggingFace-Cache.

Danach braucht der Dienst kein Internet mehr (TRANSFORMERS_OFFLINE=1 gesetzt im
Dockerfile): Patientendaten verlassen den Rechner nicht, und ein Ausfall von
huggingface.co betrifft den Betrieb nicht.
"""

import os

from transformers import pipeline

MODELL = os.environ.get("REDAKTION_MODELL", "Davlan/bert-base-multilingual-cased-ner-hrl")

pipeline("token-classification", model=MODELL, aggregation_strategy="simple")
print("Modell vorgeladen:", MODELL)
