/* ============================================================
   ART.JS — Illustrations SVG dessinées à la main (aucun fichier externe).
   Ti Bassoul, la façade créole, les 4 cartes du port, la carte des lieux.
   ============================================================ */
(function () {
  "use strict";
  const V = "#4CAF50", VF = "#2E7D32", VC = "#A5D6A7", BR = "#B5462F", CH = "#FAF7F0", BL = "#2E6E8E";

  // ---------- Ti Bassoul, petit lézard vert ----------
  function bassoul(cls) {
    return `<svg class="bassoul ${cls || ""}" viewBox="0 0 220 200" aria-label="Ti Bassoul, petit lézard vert" role="img">
  <defs>
    <radialGradient id="gb-corps" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#7BD67F"/><stop offset="1" stop-color="${V}"/></radialGradient>
    <radialGradient id="gb-tete" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#8EE092"/><stop offset="1" stop-color="${V}"/></radialGradient>
  </defs>
  <ellipse cx="112" cy="186" rx="70" ry="9" fill="#000" opacity=".12"/>
  <g class="b-queue"><path d="M70 150 C 30 160, 8 140, 18 112 C 26 92, 48 96, 44 112 C 41 124, 30 122, 32 114" fill="none" stroke="${V}" stroke-width="16" stroke-linecap="round"/>
    <path d="M70 150 C 30 160, 8 140, 18 112" fill="none" stroke="${VF}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity=".5"/></g>
  <g class="b-corps">
    <path d="M58 168 q-14 6 -22 2 M60 168 q-6 10 -16 12" stroke="${VF}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M150 166 q14 6 22 2 M148 166 q6 10 16 12" stroke="${VF}" stroke-width="7" stroke-linecap="round" fill="none"/>
    <ellipse cx="104" cy="140" rx="52" ry="34" fill="url(#gb-corps)"/>
    <ellipse cx="104" cy="152" rx="34" ry="18" fill="${VC}" opacity=".75"/>
    <circle cx="80" cy="124" r="4" fill="#F57C4A"/><circle cx="96" cy="116" r="3.2" fill="#F57C4A"/><circle cx="118" cy="120" r="4" fill="#F57C4A"/><circle cx="132" cy="132" r="3" fill="#F57C4A"/>
    <g class="b-bras"><path d="M140 128 q22 -6 30 -22" stroke="${V}" stroke-width="11" stroke-linecap="round" fill="none"/>
      <circle cx="171" cy="104" r="5" fill="${VC}"/><circle cx="178" cy="110" r="4" fill="${VC}"/><circle cx="165" cy="97" r="4" fill="${VC}"/></g>
  </g>
  <g class="b-tete">
    <ellipse cx="128" cy="78" rx="50" ry="40" fill="url(#gb-tete)"/>
    <path d="M100 92 q28 22 60 2" stroke="${VF}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M118 99 q10 8 22 0" fill="#E8676B" opacity=".85"/>
    <circle cx="96" cy="86" r="5" fill="#F48FB1" opacity=".55"/><circle cx="166" cy="84" r="5" fill="#F48FB1" opacity=".55"/>
    <g class="b-yeux">
      <circle cx="108" cy="58" r="17" fill="#fff" stroke="${VF}" stroke-width="3"/><circle cx="152" cy="56" r="17" fill="#fff" stroke="${VF}" stroke-width="3"/>
      <circle class="b-pupille" cx="112" cy="60" r="8" fill="#26323a"/><circle class="b-pupille" cx="155" cy="58" r="8" fill="#26323a"/>
      <circle cx="115" cy="56" r="3" fill="#fff"/><circle cx="158" cy="54" r="3" fill="#fff"/>
      <g class="b-paupieres"><rect x="90" y="40" width="36" height="36" rx="18" fill="${V}"/><rect x="134" y="38" width="36" height="36" rx="18" fill="${V}"/></g>
    </g>
    <path d="M86 34 q6 -12 18 -6" stroke="${BR}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M84 30 l40 -4 l-3 -10 q-18 -8 -34 2 z" fill="${BR}"/><rect x="82" y="27" width="46" height="6" rx="3" fill="#8E3522"/>
  </g>
</svg>`;
  }

  // ---------- Frise de lambrequins (motif en bandeau) ----------
  function lambrequinsPath(x0, y, w, n, h) {
    const p = w / n; let d = `M${x0} ${y}`;
    for (let i = 0; i < n; i++) { const a = x0 + i * p; d += ` L${a} ${y + h * .45} Q${a + p * .25} ${y + h} ${a + p / 2} ${y + h} Q${a + p * .75} ${y + h} ${a + p} ${y + h * .45}`; }
    return d + ` L${x0 + w} ${y} Z`;
  }
  function trous(x0, y, w, n, h) {
    const p = w / n; let s = "";
    for (let i = 0; i < n; i++) s += `<circle cx="${x0 + i * p + p / 2}" cy="${y + h * .55}" r="${h * .16}" fill="#C9E7F5"/><path d="M${x0 + i * p + p / 2} ${y + h * .12} l${h * .12} ${h * .16} l-${h * .24} 0 z" fill="#C9E7F5"/>`;
    return s;
  }

  // ---------- La façade créole (maison de départ) ----------
  // viewBox complet 0 0 360 300 ; vb permet de « zoomer » sur un détail (vignettes)
  function facade(vb, zones) {
    const cols = [62, 132, 228, 298];
    let slats = ""; for (let x = 52; x <= 308; x += 9) if (!cols.some(c => Math.abs(c - x) < 7) && !(x > 160 && x < 200)) slats += `<rect x="${x}" y="214" width="4" height="30" rx="1.5" fill="#fff" stroke="#c9c1b0" stroke-width=".6"/>`;
    let tole = ""; for (let x = 40; x <= 320; x += 10) tole += `<line x1="${180 + (x - 180) * .62}" y1="44" x2="${x}" y2="118" stroke="#8E3522" stroke-width="1.4" opacity=".55"/>`;
    const col = c => `<rect x="${c - 6}" y="140" width="12" height="104" fill="#fff" stroke="#d8d0bf"/><rect x="${c - 9}" y="138" width="18" height="6" fill="#efe9dc"/><rect x="${c - 9}" y="240" width="18" height="6" fill="#efe9dc"/>`;
    const persienne = x => `<g><rect x="${x}" y="158" width="34" height="56" fill="${BL}"/>${[0,1,2,3,4,5,6,7,8].map(k => `<line x1="${x + 2}" y1="${163 + k * 6}" x2="${x + 32}" y2="${163 + k * 6}" stroke="#1E4E66" stroke-width="2"/>`).join("")}<line x1="${x + 17}" y1="158" x2="${x + 17}" y2="214" stroke="#1E4E66" stroke-width="1.5"/></g>`;
    const z = zones ? `
  <g class="zones">
    <rect class="zone" data-zone="toit" x="70" y="40" width="220" height="70" rx="8"/>
    <rect class="zone" data-zone="lambrequins" x="30" y="112" width="300" height="26" rx="6"/>
    <rect class="zone" data-zone="persiennes" x="94" y="154" width="42" height="58" rx="6"/>
    <rect class="zone" data-zone="persiennes" x="224" y="154" width="42" height="58" rx="6"/>
    <rect class="zone" data-zone="varangue" x="40" y="140" width="50" height="70" rx="6"/>
    <rect class="zone" data-zone="varangue" x="270" y="140" width="50" height="70" rx="6"/>
    <rect class="zone" data-zone="varangue" x="140" y="140" width="80" height="22" rx="6"/>
    <rect class="zone" data-zone="barreaudage" x="44" y="210" width="114" height="36" rx="6"/>
    <rect class="zone" data-zone="barreaudage" x="202" y="210" width="114" height="36" rx="6"/>
    <rect class="zone" data-zone="jardin" x="0" y="256" width="360" height="44" rx="0"/>
  </g>` : "";
    return `<svg class="facade" viewBox="${vb || "0 0 360 300"}" role="img" aria-label="Façade d'une case créole">
  <defs>
    <linearGradient id="gf-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FD0F0"/><stop offset="1" stop-color="#E3F4FB"/></linearGradient>
    <linearGradient id="gf-toit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C85A40"/><stop offset="1" stop-color="${BR}"/></linearGradient>
    <linearGradient id="gf-ombre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9cfbd"/><stop offset="1" stop-color="#efe7d8"/></linearGradient>
  </defs>
  <rect width="360" height="300" fill="url(#gf-ciel)"/>
  <circle cx="318" cy="36" r="18" fill="#FFE082"/>
  <path d="M0 250 q40 -40 70 -10 q20 -30 50 0 L120 260 L0 260z" fill="#6DBF6A" opacity=".5"/>
  <path d="M360 246 q-40 -44 -76 -8 q-14 -20 -36 2 L248 260 L360 260z" fill="#6DBF6A" opacity=".5"/>
  <polygon points="96,44 264,44 330,118 30,118" fill="url(#gf-toit)"/>${tole}
  <rect x="150" y="18" width="16" height="30" fill="#efe9dc" stroke="#c9c1b0"/>
  <path d="${lambrequinsPath(30, 116, 300, 20, 20)}" fill="#fff" stroke="#c9c1b0" stroke-width=".8"/>${trous(30, 116, 300, 20, 20)}
  <rect x="40" y="136" width="280" height="110" fill="url(#gf-ombre)"/>
  <rect x="84" y="140" width="192" height="104" fill="${CH}" stroke="#e5dccb"/>
  ${persienne(98)}${persienne(228)}
  <rect x="160" y="150" width="40" height="94" fill="${BL}"/><rect x="164" y="154" width="15" height="86" fill="#3B82A6"/><rect x="181" y="154" width="15" height="86" fill="#3B82A6"/>
  <path d="M160 150 q20 -16 40 0" fill="#FAF7F0" stroke="#d8d0bf"/>
  ${cols.map(col).join("")}
  <rect x="44" y="210" width="272" height="5" fill="#fff" stroke="#c9c1b0" stroke-width=".6"/>
  ${slats}
  <rect x="44" y="240" width="272" height="4" fill="#efe9dc"/>
  <rect x="36" y="244" width="288" height="10" fill="#d6cdb9"/>
  <rect x="160" y="254" width="40" height="6" fill="#cfc5b0"/><rect x="154" y="260" width="52" height="6" fill="#c4b9a2"/>
  <rect x="0" y="262" width="360" height="38" fill="#7CB85E"/>
  <path d="M174 300 L186 300 L206 266 L154 266 Z" fill="#E8DCC2"/>
  <g fill="#E57373"><circle cx="40" cy="268" r="5"/><circle cx="56" cy="274" r="4"/><circle cx="300" cy="270" r="5"/><circle cx="318" cy="276" r="4"/><circle cx="120" cy="276" r="4"/></g>
  <g fill="#FFD54F"><circle cx="48" cy="278" r="3"/><circle cx="310" cy="282" r="3"/><circle cx="246" cy="276" r="4"/></g>
  <g fill="#3E8E41"><ellipse cx="20" cy="262" rx="18" ry="10"/><ellipse cx="342" cy="262" rx="18" ry="10"/></g>
  ${z}
</svg>`;
  }

  // ---------- Les 4 cartes du port (illustrations génériques, en attente des images d'archives) ----------
  const mer = `<rect y="78" width="160" height="42" fill="#3E8FB5"/><path d="M0 84 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#BFE3F2" stroke-width="2" fill="none"/>`;
  const cielC = c => `<rect width="160" height="80" fill="${c}"/>`;
  const voile = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 l40 0 l-6 10 l-28 0 z" fill="#6D4C41"/><line x1="20" y1="0" x2="20" y2="-38" stroke="#5D4037" stroke-width="2"/><path d="M21 -36 l0 32 l18 0 z" fill="#FFF8E1"/><path d="M19 -30 l0 26 l-14 0 z" fill="#FFF3D6"/></g>`;
  const cartes = {
    marine: `<svg viewBox="0 0 160 120" role="img" aria-label="Une marine en bois et des chaloupes à voile">${cielC("#F6D9A8")}<circle cx="128" cy="26" r="12" fill="#FFB74D"/>${mer}
      <rect x="0" y="66" width="70" height="8" fill="#8D6E63"/>${[6,22,38,54].map(x => `<rect x="${x}" y="70" width="4" height="40" fill="#6D4C41"/>`).join("")}
      <rect x="8" y="54" width="14" height="12" rx="3" fill="#D7CCC8"/><rect x="24" y="56" width="14" height="10" rx="3" fill="#D7CCC8"/><rect x="16" y="46" width="12" height="9" rx="3" fill="#EFEBE9"/>
      ${voile(84, 92, 1)}${voile(120, 98, .7)}</svg>`,
    chantier: `<svg viewBox="0 0 160 120" role="img" aria-label="Le chantier de la jetée en pierre">${cielC("#DCEFF7")}${mer}
      <path d="M0 70 L96 70 L104 78 L104 120 L0 120 Z" fill="#9E9E9E"/>${[0,16,32,48,64,80].map(x => `<rect x="${x + 2}" y="72" width="13" height="9" fill="#BDBDBD" stroke="#757575" stroke-width=".6"/>`).join("")}
      <rect x="104" y="84" width="12" height="9" fill="#BDBDBD" stroke="#757575" stroke-width=".6"/><rect x="118" y="92" width="10" height="8" fill="#BDBDBD" stroke="#757575" stroke-width=".6"/>
      <line x1="60" y1="70" x2="60" y2="22" stroke="#6D4C41" stroke-width="3"/><line x1="60" y1="24" x2="104" y2="40" stroke="#6D4C41" stroke-width="3"/><line x1="104" y1="40" x2="104" y2="62" stroke="#5D4037" stroke-width="1.2"/><rect x="98" y="62" width="12" height="9" fill="#BDBDBD" stroke="#757575" stroke-width=".6"/>
      <g fill="#5D4037"><circle cx="30" cy="54" r="4"/><rect x="27" y="58" width="6" height="12" rx="2"/><circle cx="44" cy="56" r="4"/><rect x="41" y="60" width="6" height="10" rx="2"/></g></svg>`,
    trois_mats: `<svg viewBox="0 0 160 120" role="img" aria-label="Un grand voilier à quai dans le port achevé">${cielC("#CFE8F3")}${mer}
      <path d="M0 74 L40 74 L40 120 L0 120Z" fill="#9E9E9E"/><path d="M120 74 L160 74 L160 120 L120 120Z" fill="#9E9E9E"/>
      <rect x="140" y="40" width="10" height="34" fill="#fff"/><rect x="138" y="34" width="14" height="8" fill="${BR}"/><path d="M138 34 l7 -8 l7 8z" fill="#8E3522"/>
      <path d="M46 92 L114 92 L106 104 L54 104 Z" fill="#4E342E"/>${[60, 80, 100].map(x => `<line x1="${x}" y1="92" x2="${x}" y2="${x === 80 ? 30 : 40}" stroke="#3E2723" stroke-width="2"/><rect x="${x - 10}" y="${x === 80 ? 38 : 46}" width="20" height="12" fill="#FFF8E1"/><rect x="${x - 8}" y="${x === 80 ? 54 : 62}" width="16" height="12" fill="#FFF3D6"/><rect x="${x - 9}" y="${x === 80 ? 70 : 78}" width="18" height="10" fill="#FFF8E1"/>`).join("")}
      <g fill="#D7CCC8"><rect x="6" y="64" width="12" height="10" rx="2"/><rect x="20" y="64" width="12" height="10" rx="2"/><rect x="13" y="56" width="12" height="9" rx="2"/></g></svg>`,
    moteurs: `<svg viewBox="0 0 160 120" role="img" aria-label="Le port d'aujourd'hui, bateaux à moteur de pêche et de plaisance">${cielC("#BDE6F7")}<circle cx="30" cy="22" r="10" fill="#FFE082"/>${mer}
      <rect x="0" y="96" width="160" height="5" fill="#ECEFF1"/>${[20, 60, 100, 140].map(x => `<rect x="${x}" y="96" width="4" height="24" fill="#B0BEC5"/>`).join("")}
      <path d="M8 86 L52 86 L46 96 L14 96Z" fill="#fff"/><rect x="20" y="76" width="16" height="10" fill="#F5F5F5" stroke="#90A4AE"/><rect x="50" y="88" width="5" height="8" fill="#455A64"/>
      <path d="M64 84 L112 84 L104 96 L70 96Z" fill="#E53935"/><rect x="74" y="72" width="18" height="12" fill="#FFCDD2" stroke="#B71C1C" stroke-width=".8"/><line x1="98" y1="84" x2="98" y2="62" stroke="#455A64" stroke-width="2"/><rect x="110" y="86" width="5" height="9" fill="#455A64"/>
      <path d="M120 88 L154 88 L148 96 L124 96Z" fill="#1E88E5"/><rect x="130" y="80" width="12" height="8" fill="#E3F2FD" stroke="#1565C0" stroke-width=".8"/>
      <g fill="#fff" opacity=".8"><circle cx="60" cy="100" r="2"/><circle cx="64" cy="103" r="1.6"/><circle cx="118" cy="100" r="2"/></g></svg>`
  };

  // ---------- Carte stylisée des lieux (plan en damier du centre-ville) ----------
  function plan() {
    let rues = ""; for (let x = 30; x < 360; x += 62) rues += `<rect x="${x}" y="0" width="14" height="380" fill="#EFE6D2"/>`;
    for (let y = 20; y < 300; y += 58) rues += `<rect x="0" y="${y}" width="360" height="14" fill="#EFE6D2"/>`;
    let ilots = ""; for (let x = 44; x < 360; x += 62) for (let y = 34; y < 300; y += 58) ilots += `<rect x="${x + 4}" y="${y + 4}" width="40" height="36" rx="5" fill="#F7F1E4" stroke="#E4D9C2"/>`;
    return `<svg class="plan" viewBox="0 0 360 380" role="img" aria-label="Plan stylisé du centre-ville de Saint-Pierre">
  <rect width="360" height="380" fill="#F3EAD7"/>${rues}${ilots}
  <path d="M0 300 Q90 286 180 300 T360 296 L360 380 L0 380Z" fill="#4C9CC2"/>
  <path d="M0 312 q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#BFE3F2" stroke-width="2" fill="none"/>
  <path d="M232 300 L232 344 L240 344 L240 304Z M290 298 L290 350 L298 350 L298 300Z" fill="#9E9E9E"/>
  <g fill="#7CB85E" opacity=".8"><circle cx="20" cy="292" r="8"/><circle cx="64" cy="290" r="7"/><circle cx="110" cy="292" r="8"/><circle cx="330" cy="290" r="8"/></g>
  <path id="trajet" d="M96 86 C 150 120, 120 200, 200 244 S 300 210, 296 150 S 230 70, 170 60" fill="none" stroke="${BR}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>
</svg>`;
  }

  function badge(txt, couleur) {
    return `<svg class="badge-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="${couleur || V}"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><text x="50" y="62" text-anchor="middle" font-size="34" fill="#fff">${txt}</text></svg>`;
  }

  window.Art = { bassoul, facade, cartes, plan, badge, lambrequinsPath };
})();
