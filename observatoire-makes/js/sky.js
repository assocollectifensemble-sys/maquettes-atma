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

  // ---------- Heure : réelle ou simulée (pour la démo à l'écran) ----------
  let sim = "now";
  const SIMH = { midi: 12, matin: 10.5, soir: 21, nuit: 4.5 };
  function reunionParts(d) { const x = new Date(d.getTime() + 4 * 3600e3); return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate() }; }
  function now() {
    const real = new Date();
    if (sim === "now" || !SIMH[sim]) return real;
    const p = reunionParts(real); const h = SIMH[sim];
    // heure locale Réunion = UTC+4 → UTC = locale − 4 h
    return new Date(Date.UTC(p.y, p.m, p.d, 0, 0, 0) + (h - 4) * 3600e3);
  }
  function setSim(s) { sim = s; }
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
  function allTargets(date) {
    const out = [];
    const sun = bodyAltAz("Sun", date), moon = bodyAltAz("Moon", date);
    out.push({ id: "soleil", nom: "le Soleil", icone: "☀️", kind: "sun", ...sun, visible: sun.alt > 3,
      raison: sun.alt > 3 ? "" : "Il est couché." });
    out.push({ id: "lune", nom: "la Lune", icone: "🌙", kind: "moon", ...moon, visible: moon.alt > 3,
      raison: moon.alt > 3 ? "" : "Elle n'est pas levée en ce moment." });
    const night = sun.alt < -6;
    for (const k of Object.keys(PLAN)) {
      const p = bodyAltAz(k, date);
      out.push({ id: k.toLowerCase(), nom: PLAN[k], icone: "🪐", kind: "planet", ...p, visible: night && p.alt > 5,
        raison: !night ? "Il fait jour." : (p.alt > 5 ? "" : "Elle est sous l'horizon.") });
    }
    const cx = cruxCenter(date);
    out.push({ id: "croix", nom: "la Croix du Sud", icone: "✨", kind: "croix", ...cx, visible: night && cx.alt > 5,
      raison: !night ? "Il fait jour : on ne voit pas les étoiles." : (cx.alt > 5 ? "" : "Elle est trop basse.") });
    const pp = polePos();
    out.push({ id: "pole", nom: "le pôle sud céleste", icone: "🧭", kind: "pole", ...pp, visible: true,
      raison: "" });
    return out;
  }
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

  window.Sky = { LAT, LON, ALT, DECL, STARS, now, setSim, getSim, enu, bodyAltAz, starAltAz, polePos, legalMinutes, solarMinutes, gapMinutes,
    yearRange, longitudeGap, sunAlt, isNight, allTargets, target, crossStars, sep, vecToAzAlt, reunionParts };
})();
