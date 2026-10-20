FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/modelle \
    REDAKTION_MODELL=Davlan/bert-base-multilingual-cased-ner-hrl

WORKDIR /app

# CPU-Variante von Torch: klein, kein CUDA
COPY requirements.txt .
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0 \
 && pip install -r requirements.txt

# Modell einbacken: der Dienst läuft im Betrieb ohne Netzzugang
COPY vorladen.py .
RUN python vorladen.py

# Ab hier kein HuggingFace-Zugriff mehr
ENV TRANSFORMERS_OFFLINE=1 \
    HF_HUB_OFFLINE=1

COPY regeln.py app.py ./

EXPOSE 5680

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:5680/gesund', timeout=4).status == 200 else 1)"

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5680"]
