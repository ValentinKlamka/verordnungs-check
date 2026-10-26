// Vorlagen-Seite: Ein Klick schickt einen dokumentierten Testfall an den Workflow.
//
// Ziel-Adresse wie bei der Erfassungsmaske: der Chat-Webhook des Prüf-Workflows.
// überschreibbar per ?webhook=… in der URL oder window.VERORDNUNGS_CHECK_WEBHOOK.
//
// Die Fälle selbst stehen in vorlagen-daten.js und werden aus
// supabase/seed/testfaelle.sql erzeugt (npm run vorlagen:daten).

const ZIEL =
  new URLSearchParams(location.search).get("webhook") ??
  window.VERORDNUNGS_CHECK_WEBHOOK ??
  "http://127.0.0.1:5678/webhook/verordnungs-check/chat";

const ZEITLIMIT_MS = 180_000;

const AMPEL_TEXT = {
  gruen: "🟢 Verordnung in Ordnung",
  gelb: "🟡 Behandlung möglich – Hinweise beachten",
  rot: "🔴 Bitte nicht behandeln – Verordnung erst korrigieren lassen",
};

const VORLAGEN = window.VORLAGEN ?? [];

const $ = (id) => document.getElementById(id);
const setzeStatus = (text) => ($("status").textContent = text);

/* ------------------------------------------------------------- Fall-Karten */

function zeile(dl, bezeichnung, wert) {
  const dt = document.createElement("dt");
  dt.textContent = bezeichnung;
  const dd = document.createElement("dd");
  dd.textContent = wert;
  dl.append(dt, dd);
}

function baueKarte(vorlage) {
  const karte = document.createElement("article");
  karte.className = "fall";
  karte.id = `fall-${vorlage.id}`;
  const kopf = document.createElement("header");
  const nr = document.createElement("span");
  nr.className = "nr";
  nr.textContent = vorlage.id;
  const titel = document.createElement("h3");
  titel.textContent = vorlage.name;
  kopf.append(nr, titel);

  const beschreibung = document.createElement("p");
  beschreibung.className = "beschreibung";
  beschreibung.textContent = vorlage.beschreibung;

  const fakten = document.createElement("dl");
  const vo = vorlage.verordnung;
  zeile(fakten, "ICD-10", `${vo.icd10} · Gruppe ${vo.diagnosegruppe ?? "–"}`);
  zeile(fakten, "Heilmittel", (vo.heilmittel ?? []).map((h) => `${h.name} ${h.einheiten}x`).join(", ") || "–");
  zeile(fakten, "Ausstellung", vo.ausstellungsdatum ?? "–");
  zeile(fakten, "Erwartet", AMPEL_TEXT[vorlage.erwartet] ?? vorlage.erwartet);
  const erwarteteBefunde = (vorlage.erwartete_befunde ?? []).map((b) => `${b.feld}`);
  if (erwarteteBefunde.length) zeile(fakten, "Befund", erwarteteBefunde.join(", "));

  const aktionen = document.createElement("div");
  aktionen.className = "aktionen";
  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.textContent = "Prüfen";
  knopf.addEventListener("click", () => starte([vorlage], knopf));
  aktionen.append(knopf);

  karte.append(kopf, beschreibung, fakten, aktionen);
  return karte;
}

for (const vorlage of VORLAGEN) $("raster").append(baueKarte(vorlage));

/* ---------------------------------------------------------------- Aufruf */

async function frageWorkflow(vorlage) {
  const steuerung = new AbortController();
  const uhr = setTimeout(() => steuerung.abort(), ZEITLIMIT_MS);
  try {
    const antwort = await fetch(ZIEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: steuerung.signal,
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: `vorlage-${vorlage.id}-${Date.now()}`,
        chatInput: JSON.stringify(vorlage.verordnung),
      }),
    });
    if (!antwort.ok) throw new Error(`n8n antwortete mit HTTP ${antwort.status}`);
    return await antwort.json();
  } finally {
    clearTimeout(uhr);
  }
}

async function starte(vorlagen, knopf) {
  const knoepfe = [...document.querySelectorAll("button")];
  for (const k of knoepfe) k.disabled = true;
  if (knopf) knopf.closest(".fall")?.classList.add("laeuft");

  const ergebnisse = [];
  try {
    for (const [index, vorlage] of vorlagen.entries()) {
      setzeStatus(`Prüfe ${vorlage.id} (${index + 1}/${vorlagen.length}) …`);
      const beginn = performance.now();
      try {
        const ergebnis = await frageWorkflow(vorlage);
        ergebnisse.push({ vorlage, ergebnis, dauer: Math.round(performance.now() - beginn) });
        if (vorlagen.length === 1) zeigeErgebnis(ergebnisse[0]);
      } catch (problem) {
        ergebnisse.push({ vorlage, fehler: problem.message, dauer: Math.round(performance.now() - beginn) });
      }
    }
    if (vorlagen.length > 1) zeigeUebersicht(ergebnisse);
    setzeStatus(ergebnisse.some((e) => e.fehler) ? "Fertig – mit Fehlern" : "Fertig");
  } finally {
    for (const k of knoepfe) k.disabled = false;
    knopf?.closest(".fall")?.classList.remove("laeuft");
  }
}

/* --------------------------------------------------------------- Anzeige */

function liste(items) {
  const ul = document.createElement("ul");
  ul.className = "hinweise";
  for (const eintrag of items) {
    const li = document.createElement("li");
    if (typeof eintrag === "string") li.textContent = eintrag;
    else li.append(eintrag);
    ul.append(li);
  }
  return ul;
}

function befundInhalt(befund) {
  const inhalt = document.createDocumentFragment();
  const marke = document.createElement("span");
  marke.className = `status ${befund.status}`;
  marke.textContent = befund.status;
  const teile = [`${befund.feld}:`];
  if (befund.status === "ok") teile.push("in Ordnung");
  else if (befund.korrekturhinweis) teile.push(befund.korrekturhinweis);
  if (befund.fundstelle) teile.push(`(${befund.fundstelle})`);
  inhalt.append(marke, document.createTextNode(` ${teile.join(" ")}`));
  return inhalt;
}

function zeigeErgebnis({ vorlage, ergebnis, fehler, dauer }) {
  const block = $("ergebnis");
  const panel = $("ergebnis-panel");
  panel.innerHTML = "";
  block.hidden = false;

  const karte = document.createElement("section");
  karte.className = "card breit";
  const titel = document.createElement("h2");
  titel.textContent = `${vorlage.id} · ${vorlage.name}`;

  if (fehler) {
    const meldung = document.createElement("p");
    meldung.className = "vergleich abweichung";
    meldung.textContent = `Prüfung nicht möglich: ${fehler}`;
    karte.append(titel, meldung);
    panel.append(karte);
    block.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const status = ergebnis.gesamtstatus ?? "unbekannt";
  const passt = status === vorlage.erwartet;
  const vergleich = document.createElement("p");
  vergleich.className = `vergleich ${passt ? "passt" : "abweichung"}`;
  vergleich.textContent = passt
    ? "✅ Deckungsgleich mit der Erwartung"
    : `⚠️ Abweichung: erwartet ${AMPEL_TEXT[vorlage.erwartet] ?? vorlage.erwartet}, erhalten ${
        AMPEL_TEXT[status] ?? status
      }`;

  const ampel = document.createElement("p");
  ampel.className = `ampel ${status}`;
  ampel.textContent = AMPEL_TEXT[status] ?? "Ergebnis ohne Ampel";

  const befunde = ergebnis.befunde ?? [];
  const offen = befunde.filter((b) => b.status !== "ok");
  const kv = document.createElement("dl");
  kv.className = "kv";
  const kopfzeilen = [
    ["Referenz", ergebnis.verordnung_ref ?? vorlage.verordnung.verordnung_ref ?? "–"],
    ["Prüfpunkte", `${befunde.length - offen.length} von ${befunde.length} in Ordnung`],
    ["Absetzungsrisiko", `${ergebnis.absetzungsrisiko_eur ?? 0} €`],
    ["Dauer", `${(dauer / 1000).toFixed(1)} s`],
  ];
  for (const [bezeichnung, wert] of kopfzeilen) zeile(kv, bezeichnung, wert);

  karte.append(titel, vergleich, ampel, kv);
  if (offen.length) {
    const unter = document.createElement("h2");
    unter.textContent = "Zu beachten";
    karte.append(unter, liste(offen.map(befundInhalt)));
  }
  panel.append(karte);

  const details = document.createElement("section");
  details.className = "card breit";
  const detailsTitel = document.createElement("h2");
  detailsTitel.textContent = `Alle ${befunde.length} Prüfpunkte`;
  details.append(detailsTitel, liste(befunde.map(befundInhalt)));
  panel.append(details);

  if (ergebnis.output) {
    const antwort = document.createElement("section");
    antwort.className = "card breit";
    const antwortTitel = document.createElement("h2");
    antwortTitel.textContent = "Antwort des Workflows";
    const pre = document.createElement("pre");
    pre.className = "markdown";
    pre.textContent = ergebnis.output;
    antwort.append(antwortTitel, pre);
    panel.append(antwort);
  }

  block.scrollIntoView({ behavior: "smooth", block: "start" });
}

function zeigeUebersicht(ergebnisse) {
  const block = $("uebersicht");
  const tabelle = $("uebersicht-tabelle");
  tabelle.innerHTML = "";

  const kopf = document.createElement("tr");
  for (const spalte of ["Fall", "Erwartet", "Erhalten", "Offene Punkte", "Dauer"]) {
    const th = document.createElement("th");
    th.textContent = spalte;
    kopf.append(th);
  }
  const thead = document.createElement("thead");
  thead.append(kopf);
  tabelle.append(thead);

  const koerper = document.createElement("tbody");
  for (const { vorlage, ergebnis, fehler, dauer } of ergebnisse) {
    const zeile = document.createElement("tr");
    const zellen = [
      `${vorlage.id} ${vorlage.name}`,
      AMPEL_TEXT[vorlage.erwartet] ?? vorlage.erwartet,
      fehler ? `Fehler: ${fehler}` : AMPEL_TEXT[ergebnis.gesamtstatus] ?? ergebnis.gesamtstatus,
      fehler ? "–" : String((ergebnis.befunde ?? []).filter((b) => b.status !== "ok").length),
      `${(dauer / 1000).toFixed(1)} s`,
    ];
    for (const [index, text] of zellen.entries()) {
      const td = document.createElement("td");
      td.textContent = text;
      if (index === 2) {
        const passt = !fehler && ergebnis.gesamtstatus === vorlage.erwartet;
        td.className = passt ? "passt" : "abweichung";
        td.textContent = `${passt ? "✅" : "⚠️"} ${text}`;
      }
      zeile.append(td);
    }
    koerper.append(zeile);
  }
  tabelle.append(koerper);
  block.hidden = false;
}

$("alle").addEventListener("click", () => starte(VORLAGEN, $("alle")));
setzeStatus(`${VORLAGEN.length} Vorlagen bereit`);
