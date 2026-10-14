// Füllt die Vorschau des Vordrucks (Muster 13) aus der Ausgabe des n8n-Workflows
// „Verordnungs-Check – Vier Prüfer" (Code-Node „Ergebnis zusammenführen").
//
// Bewusst ohne Abhängigkeiten und ohne Build: Die Datei läuft direkt aus dem
// Dateisystem. Es wird nichts gerechnet und nichts erfunden – fehlt ein Wert in
// der Workflow-Ausgabe, bleibt das Feld leer und wird im Hinweisbereich genannt.

const QUELLE_BEISPIEL = () => window.BEISPIEL_WORKFLOW_AUSGABE;

let ausgabe = null;

/* ---------------------------------------------------------------- Helfer */

/** Wert per Pfad lesen: "patient.krankenkasse" oder "diagnose.1.code". */
function wert(pfad, daten = ausgabe?.eingabe?.verordnung ?? {}) {
  return pfad.split(".").reduce((acc, teil) => {
    if (acc === null || acc === undefined) return undefined;
    if (/^\d+$/.test(teil)) return Array.isArray(acc) ? acc[Number(teil) - 1] : undefined;
    return acc[teil];
  }, daten);
}

/** Datum ISO (YYYY-MM-DD) → TT.MM.JJJJ; andere Werte unverändert. */
function datum(iso) {
  if (typeof iso !== "string") return iso ?? "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function setzeWert(selector, value) {
  for (const el of document.querySelectorAll(selector)) {
    el.textContent = text(value);
  }
}

function setzeFlag(flag, aktiv) {
  const el = document.querySelector(`input[data-flag="${flag}"]`);
  if (el) el.checked = Boolean(aktiv);
}

function liste(id, eintraege) {
  const ziel = document.getElementById(id);
  ziel.innerHTML = "";
  for (const eintrag of eintraege) {
    const li = document.createElement("li");
    li.innerHTML = eintrag;
    ziel.appendChild(li);
  }
  if (eintraege.length === 0) {
    const li = document.createElement("li");
    li.textContent = "– keine –";
    ziel.appendChild(li);
  }
}

/* -------------------------------------------------------------- Vordruck */

function fuelleVordruck() {
  const vo = ausgabe?.eingabe?.verordnung ?? {};

  setzeWert('[data-wert="patient.krankenkasse"]', vo.patient?.krankenkasse);
  setzeWert(
    '[data-wert="patient.name"]',
    vo.patient ? `${vo.patient.nachname ?? ""}, ${vo.patient.vorname ?? ""}`.replace(/^, |, $/, "") : "",
  );
  setzeWert('[data-wert="patient.geburtsdatum"]', datum(vo.patient?.geburtsdatum));
  setzeWert('[data-wert="patient.kostentraegerkennung"]', vo.patient?.kostentraegerkennung);
  setzeWert('[data-wert="patient.versichertennummer"]', vo.patient?.versichertennummer);
  setzeWert('[data-wert="patient.versichertenstatus"]', vo.patient?.versichertenstatus);

  setzeWert('[data-wert="bsnr"]', vo.bsnr);
  setzeWert('[data-wert="lanr"]', vo.lanr);
  setzeWert('[data-wert="ausstellungsdatum"]', datum(vo.ausstellungsdatum));

  setzeFlag("zuzahlung_frei", vo.zuzahlung === "frei");
  setzeFlag("zuzahlung_pflicht", vo.zuzahlung === "pflicht");
  setzeFlag("unfallfolgen", vo.unfallfolgen === true);
  setzeFlag("bvg_ser", vo.bvg_ser === true);

  setzeFlag("bereich_physiotherapie", vo.heilmittelbereich === "physiotherapie");
  setzeFlag("bereich_podologie", vo.heilmittelbereich === "podologie");
  setzeFlag("bereich_ssss", vo.heilmittelbereich === "ssss");
  setzeFlag("bereich_ergotherapie", vo.heilmittelbereich === "ergotherapie");
  setzeFlag("bereich_ernaehrung", vo.heilmittelbereich === "ernaehrung");

  // Bis zu zwei ICD-10-GM-Zeilen: führende Diagnose + ggf. zweite Diagnose.
  const zweite = (vo.weitere_diagnosen ?? [])[0];
  setzeWert('[data-wert="diagnose.1.code"]', vo.icd10);
  setzeWert('[data-wert="diagnose.1.text"]', vo.icd10_bezeichnung);
  setzeWert('[data-wert="diagnose.2.code"]', zweite?.code);
  setzeWert('[data-wert="diagnose.2.text"]', zweite?.bezeichnung);

  setzeWert('[data-wert="diagnosegruppe"]', vo.diagnosegruppe);
  setzeFlag("ls_a", vo.leitsymptomatik === "a");
  setzeFlag("ls_b", vo.leitsymptomatik === "b");
  setzeFlag("ls_c", vo.leitsymptomatik === "c");
  // Die patientenindividuelle Leitsymptomatik wird angekreuzt, wenn der Katalog-
  // Buchstabe „x" gilt oder ein Freitext eingetragen ist (Freitextbox darunter).
  setzeFlag(
    "ls_patientenindividuell",
    vo.leitsymptomatik === "x" || Boolean(vo.leitsymptomatik_freitext),
  );
  setzeWert('[data-wert="leitsymptomatik_freitext"]', vo.leitsymptomatik_freitext);

  // Drei Zeilen für vorrangige Heilmittel + eine Zeile für ein ergänzendes.
  const vorrangig = (vo.heilmittel ?? []).filter((h) => h?.art !== "ergaenzend");
  for (let i = 1; i <= 3; i += 1) {
    const h = vorrangig[i - 1];
    setzeWert(`[data-wert="heilmittel.${i}"]`, h ? heilmittelZeile(h) : "");
    setzeWert(`[data-wert="einheiten.${i}"]`, h?.einheiten ?? "");
  }
  const ergaenzend =
    vo.ergaenzendes_heilmittel ?? (vo.heilmittel ?? []).find((h) => h?.art === "ergaenzend");
  setzeWert('[data-wert="heilmittel.ergaenzend"]', ergaenzend ? heilmittelZeile(ergaenzend) : "");
  setzeWert('[data-wert="einheiten.ergaenzend"]', ergaenzend?.einheiten ?? "");

  setzeFlag("therapiebericht", vo.therapiebericht === true);
  setzeFlag("hausbesuch_ja", vo.hausbesuch === true);
  setzeFlag("hausbesuch_nein", vo.hausbesuch === false);
  setzeWert('[data-wert="frequenz"]', vo.frequenz);
  setzeFlag("dringlich", vo.dringlich === true);
  setzeWert('[data-wert="therapieziele_hinweise"]', vo.therapieziele_hinweise);

  const arzt = [vo.arzt?.name, vo.arzt?.fachrichtung, vo.arzt?.betriebsstaette].filter(Boolean);
  setzeWert('[data-wert="arztzeile"]', arzt.join(" · "));

  // IK des Leistungserbringers: 9 leere Kästchen – die IK trägt der Heilmittelerbringer ein.
  for (const feld of document.querySelectorAll("[data-ik]")) {
    const anzahl = Number(feld.dataset.ik) || 9;
    feld.innerHTML = "";
    for (let i = 0; i < anzahl; i += 1) feld.appendChild(document.createElement("span"));
  }
}

function heilmittelZeile(h) {
  const teile = [h.name];
  if (h.zusatz) teile.push(h.zusatz);
  return teile.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------ Seitenleiste */

function fuellePanel() {
  const vo = ausgabe?.eingabe?.verordnung ?? {};
  const fakten = ausgabe?.eingabe?.fakten ?? {};
  const status = ausgabe?.gesamtstatus ?? "unbekannt";

  const ampel = document.getElementById("ampel");
  ampel.className = `ampel ${status}`;
  ampel.textContent = ausgabe?.zusammenfassung ?? "Keine Ausgabe geladen.";

  const details = document.getElementById("ampel-details");
  details.innerHTML = "";
  const zeilen = [
    ["Referenz", ausgabe?.verordnung_ref ?? "–"],
    ["Gesamtstatus", status],
    ["Absetzungsrisiko", ausgabe?.absetzungsrisiko_eur ? `${ausgabe.absetzungsrisiko_eur} €` : "0 €"],
    ["Behandlungseinheiten", fakten.summe_einheiten ?? "–"],
    [
      "Behandlungsbeginn",
      fakten.beginn_fristgerecht === null || fakten.beginn_fristgerecht === undefined
        ? "laufende Behandlung"
        : `${datum(vo.geplanter_beginn)} (${fakten.tage_ausstellung_bis_beginn} Tage nach Ausstellung, Grenze ${fakten.frist_grenze_tage})`,
    ],
    ["Freigabe", ausgabe?.freigabe ?? "–"],
  ];
  for (const [bezeichnung, wertigkeit] of zeilen) {
    const dt = document.createElement("dt");
    dt.textContent = bezeichnung;
    const dd = document.createElement("dd");
    dd.textContent = text(wertigkeit);
    details.append(dt, dd);
  }

  // Felder, die der Vordruck nicht kennt – hier sichtbar machen statt erfinden.
  const hinweise = [];
  hinweise.push(
    "<strong>Behandlungsbeginn:</strong> kein Feld auf dem Originalvordruck. Die Frist (28 Tage, " +
      "bei dringlichem Bedarf 14 Tage) läuft ab dem Datum im Personalienblock (§ 15 Abs. 1 HeilM-RL).",
  );
  hinweise.push(
    "<strong>Erst-/Folgeverordnung:</strong> nicht vorgesehen. Der Vordruck kennt stattdessen den " +
      "Verordnungsfall (gleiche Diagnose, gleiche Diagnosegruppe, gleicher Arzt; § 7 Abs. 1 HeilM-RL).",
  );
  hinweise.push(
    "<strong>Besonderer / langfristiger Verordnungsbedarf:</strong> keine Ankreuzfelder. " +
      "Die Geltendmachung läuft über die ICD-10-GM-Codes der Diagnoseliste – dafür ist die zweite " +
      "Diagnosezeile da.",
  );
  if (vo.unfallfolgen === true) {
    hinweise.push(
      "<strong>Unfallfolgen angekreuzt:</strong> gilt nur für sonstige Unfälle (Haus-, Sport-, " +
        "Verkehrsunfall). Arbeitsunfall, Berufskrankheit und Schulunfall gehören auf Muster 4/e01",
    );
  }
  hinweise.push(
    "<strong>IK des Leistungserbringers</strong> und die <strong>Unterschrift</strong> bleiben leer: " +
      "Die IK trägt der Heilmittelerbringer ein, unterschrieben wird der Ausdruck vom Arzt.",
  );
  liste("hinweise", hinweise);

  liste(
    "verworfen",
    (vo.nicht_verordnungsrelevant ?? []).map(
      (d) =>
        `<code>${text(d.code)}</code> ${text(d.bezeichnung)} – <em>${text(d.grund)}</em>` +
        " <span class=\"muted\">(nicht auf dem Vordruck)</span>",
    ),
  );

  liste(
    "befunde",
    (ausgabe?.befunde ?? []).map(
      (b) =>
        `<span class="status ${b.status}">${b.status}</span> <strong>${text(b.feld)}</strong>: ` +
        `${text(b.korrekturhinweis)}${b.fundstelle ? ` <span class="muted">(${text(b.fundstelle)})</span>` : ""}`,
    ),
  );
}

/* ------------------------------------------------------------------ Ablauf */

function anzeigen(daten, quelle) {
  ausgabe = daten;
  fuelleVordruck();
  fuellePanel();
  document.title = `Vorschau Muster 13 – ${ausgabe?.verordnung_ref ?? "ohne Referenz"} (${quelle})`;
}

document.getElementById("beispiel").addEventListener("click", () => {
  anzeigen(QUELLE_BEISPIEL(), "Beispielfall");
});

document.getElementById("datei").addEventListener("change", async (event) => {
  const datei = event.target.files?.[0];
  if (!datei) return;
  try {
    const geladen = JSON.parse(await datei.text());
    // Auch ein Array mit einem Ergebnis (mehrere Items einer n8n-Ausführung) wird akzeptiert.
    anzeigen(Array.isArray(geladen) ? geladen[0] : geladen, datei.name);
  } catch (fehler) {
    window.alert(`Datei konnte nicht gelesen werden: ${fehler.message}`);
  } finally {
    event.target.value = "";
  }
});

document.getElementById("zoom").addEventListener("click", (event) => {
  const buehne = document.getElementById("buehne");
  buehne.classList.toggle("zoom");
  event.currentTarget.textContent = buehne.classList.contains("zoom") ? "Ansicht 100 %" : "Ansicht 150 %";
});

document.getElementById("drucken").addEventListener("click", () => window.print());

// Startzustand: Bildschirmansicht 150 %, gedruckt wird immer A5 in 100 %.
document.getElementById("buehne").classList.add("zoom");
document.getElementById("zoom").textContent = "Ansicht 100 %";
anzeigen(QUELLE_BEISPIEL(), "Beispielfall");
