// Erfassungsmaske für die Heilmittelverordnung (Muster 13).
//
// Die Rezeption füllt den Vordruck am Bildschirm aus – dieselbe Geometrie wie das
// Papier. „Verordnung prüfen" schickt die Angaben als strukturiertes JSON an den
// n8n-Workflow und zeigt das Ergebnis in der Seitenleiste.
//
// Bewusst ohne Build und ohne Abhängigkeiten. Der Workflow erkennt strukturiertes
// JSON selbst und überspringt dann den LLM-Extraktor (siehe n8n/vier-pruefer.json).
//
// Ziel-Adresse: http://127.0.0.1:5678/webhook/verordnungs-check/chat
// überschreibbar per ?webhook=… in der URL oder window.VERORDNUNGS_CHECK_WEBHOOK.

const ZIEL =
  new URLSearchParams(location.search).get("webhook") ??
  window.VERORDNUNGS_CHECK_WEBHOOK ??
  "http://127.0.0.1:5678/webhook/verordnungs-check/chat";

const AMPEL_TEXT = {
  gruen: "🟢 Verordnung in Ordnung",
  gelb: "🟡 Behandlung möglich – Hinweise beachten",
  rot: "🔴 Bitte nicht behandeln – Verordnung erst korrigieren lassen",
};

/* ---------------------------------------------------------------- Helfer */

const feld = (id) => document.querySelector(`[data-feld="${id}"]`);
const kastchen = (id) => document.querySelector(`[data-flag="${id}"]`);
const wert = (id) => (feld(id)?.value ?? "").trim();
const an = (id) => kastchen(id)?.checked === true;
const oderNull = (v) => (v && String(v).trim() ? String(v).trim() : null);

function setzeWert(id, v) {
  const el = feld(id);
  if (el) el.value = v === null || v === undefined ? "" : String(v);
}

function setzeFlag(id, v) {
  const el = kastchen(id);
  if (el) el.checked = Boolean(v);
}

function datumDeutsch(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso ?? "");
}

function isoDatum(deutsch) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(deutsch ?? "").trim());
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

function zahl(text) {
  const t = String(text ?? "").replace(",", ".").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function heuteIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function setzeQuelle(text) {
  document.getElementById("quelle").textContent = text;
}

/* -------------------------------------------- Aus dem Vordruck Eingaben machen */

function baueEingabefelder() {
  for (const platzhalter of document.querySelectorAll("[data-wert]")) {
    const mehrzeilig = platzhalter.classList.contains("mehrzeilig");
    const eingabe = document.createElement(mehrzeilig ? "textarea" : "input");
    if (!mehrzeilig) eingabe.type = "text";
    eingabe.dataset.feld = platzhalter.dataset.wert;
    eingabe.className = `${platzhalter.className} eingabe`;
    eingabe.style.cssText = platzhalter.style.cssText;
    eingabe.setAttribute("aria-label", platzhalter.dataset.wert);
    platzhalter.replaceWith(eingabe);
  }

  // IK-Kästchen des Leistungserbringers bleiben leer (trägt der Therapeut ein).
  for (const feldIk of document.querySelectorAll("[data-ik]")) {
    const anzahl = Number(feldIk.dataset.ik) || 9;
    feldIk.innerHTML = "";
    for (let i = 0; i < anzahl; i += 1) feldIk.appendChild(document.createElement("span"));
  }
}

/** Auswahlgruppen: nur eine Möglichkeit gleichzeitig (wie auf dem Papier). */
const GRUPPEN = [
  ["zuzahlung_frei", "zuzahlung_pflicht"],
  ["hausbesuch_ja", "hausbesuch_nein"],
  ["bereich_physiotherapie", "bereich_podologie", "bereich_ssss", "bereich_ergotherapie", "bereich_ernaehrung"],
  ["ls_a", "ls_b", "ls_c", "ls_patientenindividuell"],
];

function verdrahteAuswahlgruppen() {
  for (const gruppe of GRUPPEN) {
    for (const id of gruppe) {
      const el = kastchen(id);
      if (!el) continue;
      el.addEventListener("change", () => {
        if (!el.checked) return;
        for (const andere of gruppe) {
          if (andere === id) continue;
          const o = kastchen(andere);
          if (o) o.checked = false;
        }
      });
    }
  }
}

/* -------------------------------------------------- Vordruck → Verordnung */

function sammleVerordnung() {
  const heute = heuteIso();
  const [nachname, vorname] = wert("patient.name").split(",").map((t) => t.trim());

  const heilmittel = [];
  for (const i of [1, 2, 3]) {
    const name = wert(`heilmittel.${i}`);
    if (name) heilmittel.push({ name, einheiten: zahl(wert(`einheiten.${i}`)), art: "vorrangig" });
  }
  const ergaenzendName = wert("heilmittel.ergaenzend");

  const code1 = wert("diagnose.1.code").toUpperCase();
  const code2 = wert("diagnose.2.code").toUpperCase();
  const text1 = oderNull(wert("diagnose.1.text"));
  const text2 = oderNull(wert("diagnose.2.text"));

  const leitsymptomatik = an("ls_a") ? "a" : an("ls_b") ? "b" : an("ls_c") ? "c" : an("ls_patientenindividuell") ? "x" : null;
  const heilmittelbereich = an("bereich_physiotherapie")
    ? "physiotherapie"
    : an("bereich_podologie")
      ? "podologie"
      : an("bereich_ssss")
        ? "ssss"
        : an("bereich_ergotherapie")
          ? "ergotherapie"
          : an("bereich_ernaehrung")
            ? "ernaehrung"
            : null;
  const krankenkasse = oderNull(wert("patient.krankenkasse"));

  const diagnosen = [];
  if (code1) diagnosen.push({ code: code1, bezeichnung: text1, anlass: true });
  if (code2) diagnosen.push({ code: code2, bezeichnung: text2, anlass: false });

  return {
    // Auf dem Vordruck gibt es keine Verordnungsnummer – für Protokoll und Antwort erzeugen wir eine.
    verordnung_ref: `VO-${heute.replace(/-/g, "")}-${new Date().toTimeString().slice(0, 5).replace(":", "")}`,
    patient: {
      krankenkasse,
      nachname: oderNull(nachname),
      vorname: oderNull(vorname),
      geburtsdatum: isoDatum(wert("patient.geburtsdatum")),
      kostentraegerkennung: oderNull(wert("patient.kostentraegerkennung")),
      versichertennummer: oderNull(wert("patient.versichertennummer")),
      versichertenstatus: oderNull(wert("patient.versichertenstatus")),
    },
    bsnr: oderNull(wert("bsnr")),
    lanr: oderNull(wert("lanr")),
    ausstellungsdatum: isoDatum(wert("ausstellungsdatum")),
    pruefdatum: heute,
    geplanter_beginn: null,
    zuzahlung: an("zuzahlung_frei") ? "frei" : an("zuzahlung_pflicht") ? "pflicht" : null,
    unfallfolgen: an("unfallfolgen"),
    bvg_ser: an("bvg_ser"),
    heilmittelbereich,
    icd10: oderNull(code1),
    icd10_bezeichnung: text1,
    weitere_diagnosen: code2 ? [{ code: code2, bezeichnung: text2 }] : [],
    nicht_verordnungsrelevant: [],
    diagnosen,
    diagnosegruppe: oderNull(wert("diagnosegruppe").toUpperCase()),
    leitsymptomatik,
    leitsymptomatik_freitext: oderNull(wert("leitsymptomatik_freitext")),
    heilmittel,
    ergaenzendes_heilmittel: ergaenzendName
      ? { name: ergaenzendName, einheiten: zahl(wert("einheiten.ergaenzend")) }
      : { name: null, einheiten: null },
    frequenz: oderNull(wert("frequenz")),
    therapiebericht: an("therapiebericht"),
    hausbesuch: an("hausbesuch_ja") ? true : an("hausbesuch_nein") ? false : null,
    dringlich: an("dringlich"),
    therapieziele_hinweise: oderNull(wert("therapieziele_hinweise")),
    arzt: { name: oderNull(wert("arztzeile")), fachrichtung: null, betriebsstaette: null },
    // Die Verordnung liegt unterschrieben vor – auf dem Vordruck ist dafür das Stempelfeld vorgesehen.
    unterschrift: true,
    letzte_behandlung: null,
    unterbrechungsgrund: null,
    kostentraeger: krankenkasse,
  };
}

function fuelleVordruck(vo) {
  setzeWert("patient.krankenkasse", vo.patient?.krankenkasse);
  setzeWert("patient.name", [vo.patient?.nachname, vo.patient?.vorname].filter(Boolean).join(", "));
  setzeWert("patient.geburtsdatum", datumDeutsch(vo.patient?.geburtsdatum));
  setzeWert("patient.kostentraegerkennung", vo.patient?.kostentraegerkennung);
  setzeWert("patient.versichertennummer", vo.patient?.versichertennummer);
  setzeWert("patient.versichertenstatus", vo.patient?.versichertenstatus);
  setzeWert("bsnr", vo.bsnr);
  setzeWert("lanr", vo.lanr);
  setzeWert("ausstellungsdatum", datumDeutsch(vo.ausstellungsdatum));

  setzeFlag("zuzahlung_frei", vo.zuzahlung === "frei");
  setzeFlag("zuzahlung_pflicht", vo.zuzahlung === "pflicht");
  setzeFlag("unfallfolgen", vo.unfallfolgen === true);
  setzeFlag("bvg_ser", vo.bvg_ser === true);

  setzeFlag("bereich_physiotherapie", vo.heilmittelbereich === "physiotherapie");
  setzeFlag("bereich_podologie", vo.heilmittelbereich === "podologie");
  setzeFlag("bereich_ssss", vo.heilmittelbereich === "ssss");
  setzeFlag("bereich_ergotherapie", vo.heilmittelbereich === "ergotherapie");
  setzeFlag("bereich_ernaehrung", vo.heilmittelbereich === "ernaehrung");

  setzeWert("diagnose.1.code", vo.icd10);
  setzeWert("diagnose.1.text", vo.icd10_bezeichnung);
  setzeWert("diagnose.2.code", vo.weitere_diagnosen?.[0]?.code);
  setzeWert("diagnose.2.text", vo.weitere_diagnosen?.[0]?.bezeichnung);

  setzeWert("diagnosegruppe", vo.diagnosegruppe);
  setzeFlag("ls_a", vo.leitsymptomatik === "a");
  setzeFlag("ls_b", vo.leitsymptomatik === "b");
  setzeFlag("ls_c", vo.leitsymptomatik === "c");
  setzeFlag("ls_patientenindividuell", vo.leitsymptomatik === "x" || Boolean(vo.leitsymptomatik_freitext));
  setzeWert("leitsymptomatik_freitext", vo.leitsymptomatik_freitext);

  const vorrangig = (vo.heilmittel ?? []).filter((h) => h?.art !== "ergaenzend");
  for (let i = 1; i <= 3; i += 1) {
    setzeWert(`heilmittel.${i}`, vorrangig[i - 1]?.name);
    setzeWert(`einheiten.${i}`, vorrangig[i - 1]?.einheiten);
  }
  const ergaenzend = vo.ergaenzendes_heilmittel ?? (vo.heilmittel ?? []).find((h) => h?.art === "ergaenzend");
  setzeWert("heilmittel.ergaenzend", ergaenzend?.name);
  setzeWert("einheiten.ergaenzend", ergaenzend?.einheiten);

  setzeFlag("therapiebericht", vo.therapiebericht === true);
  setzeFlag("hausbesuch_ja", vo.hausbesuch === true);
  setzeFlag("hausbesuch_nein", vo.hausbesuch === false);
  setzeWert("frequenz", vo.frequenz);
  setzeFlag("dringlich", vo.dringlich === true);
  setzeWert("therapieziele_hinweise", vo.therapieziele_hinweise);
  setzeWert("arztzeile", [vo.arzt?.name, vo.arzt?.fachrichtung, vo.arzt?.betriebsstaette].filter(Boolean).join(" · "));
}

/* ------------------------------------------------------------ Seitenleiste */

function liste(id, eintraege) {
  const ziel = document.getElementById(id);
  ziel.innerHTML = "";
  if (!eintraege.length) {
    ziel.innerHTML = "<li>– keine –</li>";
    return;
  }
  for (const eintrag of eintraege) {
    const li = document.createElement("li");
    li.innerHTML = eintrag;
    ziel.appendChild(li);
  }
}

function zeigeErgebnis(ergebnis, verordnung) {
  const status = ergebnis.gesamtstatus ?? "unbekannt";
  const ampel = document.getElementById("ampel");
  ampel.className = `ampel ${status}`;
  ampel.textContent = AMPEL_TEXT[status] ?? "Ergebnis ohne Ampel";

  const fakten = ergebnis.fakten ?? {};
  const details = document.getElementById("ampel-details");
  details.innerHTML = "";
  const zeilen = [
    ["Referenz", ergebnis.verordnung_ref ?? verordnung.verordnung_ref],
    ["Absetzungsrisiko", ergebnis.absetzungsrisiko_eur ? `${ergebnis.absetzungsrisiko_eur} €` : "0 €"],
    ["Behandlungseinheiten", fakten.summe_einheiten ?? "–"],
    ["Prüfpunkte", ergebnis.befunde ? `${ergebnis.befunde.filter((b) => b.status === "ok").length} von ${ergebnis.befunde.length} in Ordnung` : "–"],
    ["Geprüft", new Date().toLocaleString("de-DE")],
  ];
  for (const [bezeichnung, wertigkeit] of zeilen) {
    const dt = document.createElement("dt");
    dt.textContent = bezeichnung;
    const dd = document.createElement("dd");
    dd.textContent = String(wertigkeit);
    details.append(dt, dd);
  }

  const auswahl = ergebnis.diagnose_auswahl ?? {};
  if (auswahl.fuehrend) {
    liste("diagnoseauswahl", [
      `Erkannt: <strong>${auswahl.erkannt ?? "–"}</strong> ICD-10-GM-Code(s)`,
      `Zeile 1: <code>${auswahl.fuehrend.code}</code> ${auswahl.fuehrend.bezeichnung ?? ""}`,
      auswahl.zweite ? `Zeile 2: <code>${auswahl.zweite.code}</code> ${auswahl.zweite.bezeichnung ?? ""}` : "Zeile 2: nicht belegt",
      ...(auswahl.hinweise ?? []).map((h) => `<strong>Fachlich prüfen:</strong> ${h}`),
    ]);
  } else {
    const zweite = verordnung.weitere_diagnosen?.[0];
    liste("diagnoseauswahl", [
      `Zeile 1: <code>${verordnung.icd10 ?? "–"}</code> ${verordnung.icd10_bezeichnung ?? ""}`,
      zweite ? `Zeile 2: <code>${zweite.code}</code> ${zweite.bezeichnung ?? ""}` : "Zeile 2: nicht belegt",
      "<span class='muted'>Die Zeilen wurden im Formular gewählt, nicht vom Workflow aus dem Freitext abgeleitet.</span>",
    ]);
  }

  liste(
    "verworfen",
    (verordnung.nicht_verordnungsrelevant ?? []).map(
      (d) => `<code>${d.code}</code> ${d.bezeichnung ?? ""} – <em>${d.grund ?? ""}</em>`,
    ),
  );

  liste(
    "befunde",
    (ergebnis.befunde ?? []).map(
      (b) =>
        `<span class="status ${b.status}">${b.status}</span> <strong>${b.feld}</strong>: ` +
        `${b.korrekturhinweis ?? ""}${b.fundstelle ? ` <span class="muted">(${b.fundstelle})</span>` : ""}`,
    ),
  );

  let karte = document.getElementById("antwort-karte");
  if (!karte) {
    karte = document.createElement("section");
    karte.className = "card";
    karte.id = "antwort-karte";
    karte.innerHTML = "<h2>Antwort des Workflows</h2><pre class='markdown' id='antwort-text'></pre>";
    document.querySelector("aside.panel").appendChild(karte);
  }
  document.getElementById("antwort-text").textContent = ergebnis.output ?? "";

  document.title = `Verordnungs-Check – ${ergebnis.verordnung_ref ?? verordnung.verordnung_ref}`;
}

function zeigeFehler(meldungen) {
  const ampel = document.getElementById("ampel");
  ampel.className = "ampel rot";
  ampel.textContent = "Prüfung nicht möglich";
  document.getElementById("ampel-details").innerHTML = "";
  liste("befunde", []);
  let karte = document.getElementById("antwort-karte");
  if (!karte) {
    karte = document.createElement("section");
    karte.className = "card";
    karte.id = "antwort-karte";
    karte.innerHTML = "<h2>Antwort des Workflows</h2><pre class='markdown' id='antwort-text'></pre>";
    document.querySelector("aside.panel").appendChild(karte);
  }
  document.getElementById("antwort-text").textContent = meldungen.join("\n");
}

/* ------------------------------------------------------------------ Ablauf */

async function pruefen() {
  const verordnung = sammleVerordnung();
  const knopf = document.getElementById("pruefen");

  if (!verordnung.icd10 && !verordnung.heilmittel.length) {
    setzeQuelle("Bitte mindestens eine Diagnose und ein Heilmittel eintragen.");
    zeigeFehler(["Der Vordruck ist noch leer.", "Mindestens eine ICD-10-Zeile und ein Heilmittel sind nötig."]);
    return;
  }

  knopf.disabled = true;
  knopf.textContent = "Prüfung läuft …";
  setzeQuelle("Prüfung läuft …");
  try {
    const antwort = await fetch(ZIEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sendMessage",
        sessionId: `formular-${Date.now()}`,
        chatInput: JSON.stringify(verordnung),
      }),
    });
    if (!antwort.ok) throw new Error(`n8n antwortete mit HTTP ${antwort.status}`);
    const ergebnis = await antwort.json();
    zeigeErgebnis(ergebnis, verordnung);
    setzeQuelle(`Geprüft: ${ergebnis.verordnung_ref ?? verordnung.verordnung_ref}`);
  } catch (fehler) {
    setzeQuelle("Prüfung fehlgeschlagen");
    zeigeFehler([
      "Die Prüfung konnte nicht ausgeführt werden.",
      String(fehler.message),
      `Ziel: ${ZIEL}`,
      "Läuft n8n und ist der Workflow aktiv?",
    ]);
  } finally {
    knopf.disabled = false;
    knopf.textContent = "Verordnung prüfen";
  }
}

function leeren() {
  for (const el of document.querySelectorAll("[data-feld]")) el.value = "";
  for (const el of document.querySelectorAll("[data-flag]")) el.checked = false;
  document.getElementById("ampel").className = "ampel";
  document.getElementById("ampel").textContent = "–";
  document.getElementById("ampel-details").innerHTML = "";
  for (const id of ["hinweise", "diagnoseauswahl", "verworfen", "befunde"]) liste(id, []);
  const karte = document.getElementById("antwort-karte");
  if (karte) karte.remove();
  setzeQuelle("Noch nicht geprüft");
  document.title = "Heilmittelverordnung erfassen (Muster 13) – Verordnungs-Check";
}

/* ------------------------------------------------------------------ Start */

baueEingabefelder();
verdrahteAuswahlgruppen();

document.getElementById("pruefen").addEventListener("click", pruefen);
document.getElementById("leeren").addEventListener("click", leeren);
document.getElementById("beispiel").addEventListener("click", () => {
  fuelleVordruck(window.BEISPIEL_WORKFLOW_AUSGABE.eingabe.verordnung);
  setzeQuelle("Beispielfall geladen – noch nicht geprüft");
});
document.getElementById("zoom").addEventListener("click", (event) => {
  const buehne = document.getElementById("buehne");
  buehne.classList.toggle("zoom");
  event.currentTarget.textContent = buehne.classList.contains("zoom") ? "Ansicht 100 %" : "Ansicht 150 %";
});
document.getElementById("drucken").addEventListener("click", () => window.print());

document.getElementById("buehne").classList.add("zoom");
document.getElementById("zoom").textContent = "Ansicht 100 %";

liste("hinweise", [
  "<strong>Behandlungsbeginn:</strong> kein Feld auf dem Vordruck. Die Frist (28 Tage, bei dringlichem Bedarf 14) läuft ab dem Datum im Personalienblock (§ 15 Abs. 1 HeilM-RL) – geprüft wird ab dem heutigen Tag.",
  "<strong>Erst-/Folgeverordnung:</strong> nicht vorgesehen. Der Vordruck kennt den Verordnungsfall (gleiche Diagnose, gleiche Diagnosegruppe, gleicher Arzt; § 7 Abs. 1 HeilM-RL).",
  "<strong>Besonderer Verordnungsbedarf:</strong> keine Ankreuzfelder – er wird über die ICD-10-Codes der Diagnoseliste geltend gemacht, dafür ist die zweite Zeile da.",
  "<strong>IK und Unterschrift:</strong> Die IK trägt der Heilmittelerbringer ein; die Unterschrift wird als vorhanden angenommen.",
]);

fuelleVordruck(window.BEISPIEL_WORKFLOW_AUSGABE.eingabe.verordnung);
setzeQuelle("Beispielfall geladen – noch nicht geprüft");
