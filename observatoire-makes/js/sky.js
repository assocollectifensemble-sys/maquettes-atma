/* ============================================================
   SKY.JS — Calculs astronomiques RÉELS (via astronomy-engine, MIT,
   copié en local : js/astronomy.min.js). Aucune position inventée.
   Lieu : Observatoire des Makes ≈ lat −21,20° · lon 55,41° E · alt 1000 m
   ============================================================ */
(function () {
  "use strict";
  const A = window.Astronomy;
  const LAT = -21.20, LON = 55.41, ALT = 1000;
  // Déclinaison magnétique (WMM2025, calculée pour ce lieu : ≈ −19,6° = Ouest).
  // Les boussoles de téléphone donnent le nord MAGNÉTIQUE : on corrige.
  const DECL = -19.6;
  const OBS = new A.Observer(LAT, LON, ALT);
  const RAD = Math.PI / 180;

  // Étoiles de la Croix du Sud + les 2 « Pointeurs » (J2000, Hipparcos ; voir SOURCES.md)
  const STARS = {
    acrux:  { nom: "Acrux (α Crucis)",  ra: 12 + 26 / 60 + 35.895 / 3600, dec: -(63 + 5 / 60 + 56.73 / 3600) },
    mimosa: { nom: "Mimosa (β Crucis)", ra: 12 + 47 / 60 + 43.269 / 3600, dec: -(59 + 41 / 60 + 19.58 / 3600) },
    gacrux: { nom: "Gacrux (γ Crucis)", ra: 12 + 31 / 60 + 9.960 / 3600,  dec: -(57 + 6 / 60 + 47.57 / 3600) },
    imai:   { nom: "Imai (δ Crucis)",   ra: 12 + 15 / 60 + 8.717 / 3600,  dec: -(58 + 44 / 60 + 56.14 / 3600) },
    acen:   { nom: "Alpha du Centaure", ra: 14 + 39 / 60 + 36.494 / 3600, dec: -(60 + 50 / 60 + 2.37 / 3600) },
    hadar:  { nom: "Hadar (β Centauri)", ra: 14 + 3 / 60 + 49.405 / 3600,  dec: -(60 + 22 / 60 + 22.93 / 3600) }
  };

  // Étoiles brillantes pour dessiner un VRAI ciel dans « Vise le ciel » :
  // les 57 étoiles de navigation (Wikipédia en anglais « List of stars for navigation »,
  // colonnes SHA et Dec. arrondies au degré ; AD = 360° − SHA). Voir SOURCES.md.
  // [nom affiché, SHA (°), Dec (°), magnitude]
  const NAV = [
    ["Alpheratz", 358, 29, 2.06], ["Ankaa", 354, -42, 2.37], ["Schedar", 350, 56, 2.25], ["Diphda", 349, -18, 2.04],
    ["Achernar", 336, -57, 0.5], ["Hamal", 328, 23, 2.0], ["Acamar", 316, -40, 3.2], ["Menkar", 315, 4, 2.5],
    ["Mirfak", 309, 50, 1.82], ["Aldébaran", 291, 16, 0.85], ["Rigel", 282, -8, 0.12], ["Capella", 281, 46, 0.71],
    ["Bellatrix", 279, 6, 1.64], ["Elnath", 279, 29, 1.68], ["Alnilam", 276, -1, 1.7], ["Bételgeuse", 271, 7, 0.58],
    ["Canopus", 264, -53, -0.72], ["Sirius", 259, -17, -1.47], ["Adhara", 256, -29, 1.51], ["Procyon", 245, 5, 0.34],
    ["Pollux", 244, 28, 1.15], ["Avior", 234, -59, 2.4], ["Suhail", 223, -43, 2.23], ["Miaplacidus", 222, -70, 1.7],
    ["Alphard", 218, -9, 2.0], ["Régulus", 208, 12, 1.35], ["Dubhe", 194, 62, 1.87], ["Denebola", 183, 15, 2.14],
    ["Gienah", 176, -17, 2.8], ["Alioth", 167, 56, 1.76], ["Spica", 159, -11, 1.04], ["Alkaid", 153, 49, 1.85],
    ["Menkent", 149, -36, 2.06], ["Arcturus", 146, 19, -0.04], ["Zubenelgenubi", 138, -16, 3.28], ["Kochab", 137, 74, 2.08],
    ["Alphecca", 127, 27, 2.24], ["Antarès", 113, -26, 1.09], ["Atria", 108, -69, 1.92], ["Sabik", 103, -16, 2.43],
    ["Shaula", 97, -37, 1.62], ["Rasalhague", 96, 13, 2.1], ["Eltanin", 91, 51, 2.23], ["Kaus Australis", 84, -34, 1.8],
    ["Véga", 81, 39, 0.03], ["Nunki", 76, -26, 2.06], ["Altaïr", 63, 9, 0.77], ["Peacock", 54, -57, 1.91],
    ["Deneb", 50, 45, 1.25], ["Enif", 34, 10, 2.4], ["Al Na'ir", 28, -47, 1.74], ["Fomalhaut", 16, -30, 1.16], ["Markab", 14, 15, 2.49]
  ]; // (Acrux, Gacrux, Hadar et Rigil Kentaurus sont déjà dans STARS, avec des coordonnées plus précises)

  // ---------- Heure : réelle ou simulée (pour la démo à l'écran) ----------
  // sim = "now" | une clé de SIMH | un nombre d'heures locales (ex. 4.67 = 4 h 40)
  let sim = "now";
  const SIMH = { midi: 12, matin: 10.5, soir: 21, nuit: 4.5 };
  function reunionParts(d) { const x = new Date(d.getTime() + 4 * 3600e3); return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate() }; }
  function heureLocale(real, h) { // date du jour (Réunion) à h heures locales ; UTC = locale − 4 h
    const p = reunionParts(real); return new Date(Date.UTC(p.y, p.m, p.d, 0, 0, 0) + (h - 4) * 3600e3);
  }
  function now() {
    const real = new Date();
    if (typeof sim === "number") return heureLocale(real, sim);
    if (sim === "now" || !SIMH[sim]) return real;
    return heureLocale(real, SIMH[sim]);
  }
  function setSim(s) { sim = (typeof s === "string" && /^\d+(\.\d+)?$/.test(s)) ? +s : s; }
  function getSim() { return sim; }

  // ---------- Conversions ----------
  function enu(az, alt) { // vecteur unitaire Est-Nord-Haut depuis azimut (0=N, 90=E) & hauteur
    const a = az * RAD, h = alt * RAD;
    return [Math.sin(a) * Math.cos(h), Math.cos(a) * Math.cos(h), Math.sin(h)];
  }
  function toAltAz(date, ra, dec) {
    const h = A.Horizon(A.MakeTime(date), OBS, ra, dec, "normal");
    return { az: h.azimuth, alt: h.altitude };
  }
  function bodyAltAz(name, date) {
    const t = A.MakeTime(date);
    const eq = A.Equator(name, t, OBS, true, true);
    return toAltAz(date, eq.ra, eq.dec);
  }
  function starAltAz(key, date) {
    const s = STARS[key]; const t = A.MakeTime(date);
    const v = A.VectorFromSphere(new A.Spherical(s.dec, s.ra * 15, 1), t);
    const vd = A.RotateVector(A.Rotation_EQJ_EQD(t), v); // J2000 → équateur de la date
    const eq = A.EquatorFromVector(vd);
    return toAltAz(date, eq.ra, eq.dec);
  }
  function polePos() { return { az: 180, alt: -LAT }; } // pôle sud céleste : hauteur = latitude

  // ---------- Heure solaire vs heure légale ----------
  function legalMinutes(date) { const x = new Date(date.getTime() + 4 * 3600e3); return x.getUTCHours() * 60 + x.getUTCMinutes() + x.getUTCSeconds() / 60; }
  function solarMinutes(date) { // heure solaire APPARENTE (celle d'un cadran) en minutes depuis minuit
    const ha = A.HourAngle("Sun", A.MakeTime(date), OBS); // heures ; 0 = Soleil au méridien
    return (((12 + ha) % 24) + 24) % 24 * 60;
  }
  function gapMinutes(date) { // heure légale − heure solaire (>0 : le cadran retarde)
    let d = legalMinutes(date) - solarMinutes(date);
    while (d > 720) d -= 1440; while (d < -720) d += 1440;
    return d;
  }
  let _yr = null;
  function yearRange(date) { // min / max de l'écart sur l'année, à midi légal
    const y = reunionParts(date).y; if (_yr && _yr.y === y) return _yr;
    let mn = 1e9, mx = -1e9;
    for (let i = 0; i < 366; i++) {
      const d = new Date(Date.UTC(y, 0, 1 + i, 8, 0, 0)); // midi légal = 08:00 UTC
      const g = gapMinutes(d); mn = Math.min(mn, g); mx = Math.max(mx, g);
    }
    return (_yr = { y, min: mn, max: mx });
  }
  // Écart « moyen » dû à la seule longitude : le fuseau UTC+4 est calé sur 60° E
  function longitudeGap() { return (60 - LON) * 4; }

  // ---------- Cibles du jeu « Vise le ciel » ----------
  function sunAlt(date) { return bodyAltAz("Sun", date).alt; }
  function isNight(date) { return sunAlt(date) < -6; }
  const PLAN = { Mercury: "Mercure", Venus: "Vénus", Mars: "Mars", Jupiter: "Jupiter", Saturn: "Saturne" };
  function cruxCenter(date) {
    const vs = ["acrux", "mimosa", "gacrux", "imai"].map(k => { const p = starAltAz(k, date); return enu(p.az, p.alt); });
    const s = [0, 1, 2].map(i => vs.reduce((a, v) => a + v[i], 0)); const n = Math.hypot(...s);
    const v = s.map(x => x / n); return vecToAzAlt(v);
  }
  function vecToAzAlt(v) { return { az: ((Math.atan2(v[0], v[1]) / RAD) + 360) % 360, alt: Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD }; }
  // ---------- Visibilité : UNE seule règle, UN seul jeu de messages ----------
  // Seuils : Soleil et Lune > 3° ; planètes et Croix > 5° (il faut un peu de marge au-dessus du relief).
  // Messages (accordés en genre) : sous l'horizon (h < 0°) · trop bas(se) sur l'horizon (0° ≤ h ≤ seuil) · il fait jour.
  const SEUIL = { sun: 3, moon: 3, planet: 5, croix: 5 };
  function visibilite(kind, alt, night, fem) {
    const s = SEUIL[kind] || 5, bas = fem ? "basse" : "bas", pr = fem ? "Elle" : "Il";
    if ((kind === "planet" || kind === "croix") && !night) return { visible: false, raison: "Il fait jour : on ne voit pas les étoiles ni les planètes." };
    if (alt < 0) return { visible: false, raison: pr + " est sous l'horizon en ce moment." };
    if (alt <= s) return { visible: false, raison: pr + " est trop " + bas + " sur l'horizon (" + Math.round(alt) + "°)." };
    return { visible: true, raison: "" };
  }
  function allTargets(date) {
    const out = [];
    const sun = bodyAltAz("Sun", date), moon = bodyAltAz("Moon", date);
    out.push({ id: "soleil", nom: "le Soleil", icone: "☀️", kind: "sun", ...sun, ...visibilite("sun", sun.alt, true, false) });
    out.push({ id: "lune", nom: "la Lune", icone: "🌙", kind: "moon", ...moon, ...visibilite("moon", moon.alt, true, true) });
    const night = sun.alt < -6;
    for (const k of Object.keys(PLAN)) {
      const p = bodyAltAz(k, date);
      out.push({ id: k.toLowerCase(), nom: PLAN[k], icone: "🪐", kind: "planet", ...p, ...visibilite("planet", p.alt, night, true) }); // « Elle » = la planète
    }
    const cx = cruxCenter(date);
    out.push({ id: "croix", nom: "la Croix du Sud", icone: "✨", kind: "croix", ...cx, ...visibilite("croix", cx.alt, night, true) });
    const pp = polePos();
    out.push({ id: "pole", nom: "le pôle sud céleste", icone: "🧭", kind: "pole", ...pp, visible: true, raison: "" });
    return out;
  }

  // Meilleure heure de la nuit (Soleil < −10°) pour voir la Croix du Sud le plus haut possible,
  // cherchée de 18 h à 6 h (heure locale) par pas de 10 min. Retourne {h (heures locales), alt}.
  const _best = {};
  function bestCroixHour(date) {
    const p = reunionParts(date), key = p.y + "-" + p.m + "-" + p.d; if (_best[key]) return _best[key];
    let best = null;
    for (let m = 18 * 60; m <= 30 * 60; m += 10) {
      const d = new Date(Date.UTC(p.y, p.m, p.d, 0, 0, 0) + (m - 240) * 60e3);
      if (sunAlt(d) >= -10) continue;
      const a = cruxCenter(d).alt; if (!best || a > best.alt) best = { h: (m / 60) % 24, alt: a };
    }
    return (_best[key] = best || { h: 4.5, alt: cruxCenter(heureLocale(date, 4.5)).alt });
  }

  // Phase de la Lune (astronomy-engine) : fraction éclairée 0..1 et angle de phase (0 = nouvelle, 180 = pleine)
  function moonPhase(date) { const t = A.MakeTime(date); return { frac: A.Illumination("Moon", t).phase_fraction, angle: A.MoonPhase(t) }; }

  // Étoiles brillantes (catalogue NAV) en coordonnées locales
  function brightStars(date) {
    const t = A.MakeTime(date);
    return NAV.map(s => { const h = A.Horizon(t, OBS, ((360 - s[1]) % 360) / 15, s[2], "normal"); return { nom: s[0], mag: s[3], az: h.azimuth, alt: h.altitude }; });
  }
  // Planètes visibles à l'œil nu (pour le décor du ciel)
  function planets(date) { return Object.keys(PLAN).map(k => ({ nom: PLAN[k], id: k, ...bodyAltAz(k, date) })); }
  function target(id, date) { return allTargets(date).find(t => t.id === id); }

  // Fournit aussi les positions des étoiles à tracer sur la vue
  function crossStars(date) {
    const o = {}; for (const k of ["acrux", "mimosa", "gacrux", "imai", "acen", "hadar"]) o[k] = starAltAz(k, date);
    return o;
  }

  function sep(a, b) { // séparation angulaire (deg) entre deux {az,alt}
    const u = enu(a.az, a.alt), v = enu(b.az, b.alt);
    const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    return Math.acos(Math.max(-1, Math.min(1, d))) / RAD;
  }

  // Cadran solaire HORIZONTAL à style polaire, réglé pour la latitude des Makes :
  // angle de la ligne horaire depuis la ligne de midi : tan(θ) = sin(latitude) × tan(angle horaire).
  // Aux Makes (hémisphère sud), vu de dessus nord en haut : matin → ombre vers l'OUEST, midi → SUD, soir → EST
  // ⇒ l'ombre tourne dans le sens inverse des aiguilles d'une montre. Retourne l'azimut de l'ombre (°).
  function ombreAzimut(solaireMin) {
    const H = (solaireMin / 60 - 12) * 15 * RAD, s = Math.sin(Math.abs(LAT) * RAD);
    const th = Math.atan2(s * Math.sin(H), Math.cos(H)) / RAD; // −90 (6 h) … 0 (midi) … +90 (18 h)
    // midi → 180° (sud) ; matin (H<0, th<0) → au-delà de 180°, vers l'ouest (270°) ; après-midi → vers l'est (90°)
    return (180 - th + 360) % 360;
  }

  window.Sky = { LAT, LON, ALT, DECL, STARS, NAV, now, setSim, getSim, enu, bodyAltAz, starAltAz, polePos, legalMinutes, solarMinutes, gapMinutes,
    yearRange, longitudeGap, sunAlt, isNight, allTargets, target, crossStars, sep, vecToAzAlt, reunionParts, heureLocale,
    visibilite, bestCroixHour, moonPhase, brightStars, planets, ombreAzimut };
})();
