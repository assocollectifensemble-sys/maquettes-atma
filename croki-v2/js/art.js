/* ============================================================
   ART.JS — illustrations vectorielles maison (aucune ressource externe)
   Style : formes rondes, aplats francs, contour doux, palette tropicale.
   ============================================================ */

const Art = (() => {

  // ---------- Feuillages de décor (coins d'écran) ----------
  const feuille = (c1, c2) => `
    <svg viewBox="0 0 200 200" aria-hidden="true"><defs>
      <linearGradient id="fl${c1.slice(1)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <path d="M10 190 C 20 90 90 20 190 10 C 180 110 110 180 10 190 Z" fill="url(#fl${c1.slice(1)})"/>
      <path d="M10 190 C 70 130 120 80 190 10" stroke="rgba(255,255,255,.45)" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${[0.25, 0.42, 0.58, 0.74].map(t => {
        const x = 10 + 180 * t, y = 190 - 180 * t;
        return `<path d="M${x} ${y} q ${-18} ${-30} ${-44} ${-34}" stroke="rgba(255,255,255,.3)" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M${x} ${y} q ${30} ${16} ${36} ${42}" stroke="rgba(255,255,255,.3)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      }).join("")}
    </svg>`;

  const monstera = c => `
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M100 196 C 30 190 6 130 14 84 C 22 40 62 8 104 8 C 150 8 190 44 192 92 C 194 150 160 192 100 196 Z" fill="${c}"/>
      <path d="M100 196 C 104 140 104 80 104 8" stroke="rgba(0,0,0,.14)" stroke-width="5" fill="none"/>
      <path d="M14 84 L 70 96 L 20 120 Z M 40 30 L 86 70 L 30 64 Z M 192 92 L 136 100 L 186 128 Z M 162 30 L 120 70 L 176 60 Z M 60 176 L 92 140 L 96 186 Z" fill="var(--fond, #fff7e8)"/>
    </svg>`;

  function decor() {
    return `
      <div class="deco deco-hg">${feuille("#2fae6f", "#0f6b45")}</div>
      <div class="deco deco-hd">${monstera("#1f8f5f")}</div>
      <div class="deco deco-bg">${monstera("#13704a")}</div>
      <div class="deco deco-bd">${feuille("#46c07f", "#178256")}</div>
      <div class="deco-hibiscus" aria-hidden="true">${hibiscus()}</div>`;
  }

  function hibiscus() {
    return `<svg viewBox="0 0 100 100">${[0, 72, 144, 216, 288].map(a =>
      `<ellipse cx="50" cy="28" rx="19" ry="25" fill="#ff5d73" transform="rotate(${a} 50 50)"/>`).join("")}
      <circle cx="50" cy="50" r="9" fill="#ffd166"/><path d="M50 50 L 66 22" stroke="#ffd166" stroke-width="3" stroke-linecap="round"/>
      <circle cx="66" cy="22" r="4" fill="#ffb627"/></svg>`;
  }

  // ---------- Bassin aux crocodiles (alternative au toucher, étape 1) ----------
  function bassin() {
    return `<svg class="bassin-svg" viewBox="0 0 360 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="eau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fb7a6"/><stop offset="1" stop-color="#11665e"/></linearGradient>
      </defs>
      <rect width="360" height="300" fill="url(#eau)"/>
      ${[40, 110, 190, 250].map((y, i) => `<path class="vague v${i % 2}" d="M-20 ${y} q 30 -10 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0" stroke="rgba(255,255,255,.22)" stroke-width="3" fill="none"/>`).join("")}
      ${[[50, 70, 26], [300, 60, 22], [80, 240, 30], [290, 230, 24], [180, 150, 18]].map(([x, y, r]) =>
        `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#58b368"/><path d="M0 0 L ${r} ${-r * .35} L ${r} ${r * .2} Z" fill="url(#eau)"/><circle r="${r * .55}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/></g>`).join("")}
      <g fill="#2e7d32">${[12, 22, 34, 330, 342, 350].map((x, i) => `<path d="M${x} 300 q ${i % 2 ? 6 : -6} -60 ${i % 2 ? -4 : 4} -${90 + i * 8}" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}</g>
    </svg>`;
  }

  function yeuxCroco() {
    return `<svg viewBox="0 0 120 70" aria-hidden="true">
      <ellipse cx="60" cy="60" rx="58" ry="14" fill="rgba(255,255,255,.25)"/>
      <path d="M8 58 C 10 30 30 22 42 24 C 52 26 56 40 60 44 C 64 40 68 26 78 24 C 90 22 110 30 112 58 Z" fill="#3c8f3a"/>
      <circle cx="38" cy="38" r="13" fill="#f6e27a"/><circle cx="82" cy="38" r="13" fill="#f6e27a"/>
      <ellipse cx="38" cy="38" rx="3.5" ry="10" fill="#1b2a12"/><ellipse cx="82" cy="38" rx="3.5" ry="10" fill="#1b2a12"/>
      <circle cx="34" cy="33" r="3" fill="#fff"/><circle cx="78" cy="33" r="3" fill="#fff"/>
      <path d="M26 30 q 12 -10 24 0 M70 30 q 12 -10 24 0" stroke="#2a6b29" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${[20, 30, 90, 100].map(x => `<circle cx="${x}" cy="54" r="2.2" fill="#2a6b29"/>`).join("")}
    </svg>`;
  }

  // ---------- Paon (étape 2) : roue de 11 plumes à ocelle ----------
  const NB_PLUMES = 11;
  function paon() {
    const plumes = Array.from({ length: NB_PLUMES }, (_, i) => `
      <g class="plume" data-i="${i}" style="--i:${i - (NB_PLUMES - 1) / 2}">
        <path d="M0 0 C -14 -50 -22 -110 0 -150 C 22 -110 14 -50 0 0 Z" fill="url(#plumeG)"/>
        <path d="M0 0 L 0 -128" stroke="#c8a23a" stroke-width="2"/>
        <g class="ocelle" transform="translate(0 -128)">
          <ellipse rx="17" ry="21" fill="#e8c547"/><ellipse rx="13" ry="16.5" fill="#1aa38a"/>
          <ellipse rx="8.5" ry="11" cy="2" fill="#1d4fa8"/><ellipse rx="4.5" ry="6" cy="3" fill="#0d1b3d"/>
        </g>
      </g>`).join("");
    return `<svg class="paon-svg" viewBox="-180 -190 360 300" aria-hidden="true">
      <defs><linearGradient id="plumeG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f7d4a"/><stop offset=".7" stop-color="#58b04a"/><stop offset="1" stop-color="#9ccc3c"/></linearGradient>
      <linearGradient id="corpsP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c6fd6"/><stop offset="1" stop-color="#16408f"/></linearGradient></defs>
      <ellipse cx="0" cy="96" rx="120" ry="10" fill="rgba(0,0,0,.12)"/>
      <g class="roue">${plumes}</g>
      <g class="corps-paon">
        <path d="M-26 92 C -36 40 -24 6 0 2 C 24 6 36 40 26 92 Z" fill="url(#corpsP)"/>
        <path d="M-4 20 C -8 -10 -10 -30 -2 -46 C 6 -58 20 -54 18 -40 C 16 -28 8 -10 10 20 Z" fill="#2563c9"/>
        <ellipse cx="6" cy="-44" rx="15" ry="13" fill="#2a6cdc"/>
        <path d="M14 -46 L 30 -41 L 14 -37 Z" fill="#f2b33d"/>
        <ellipse cx="4" cy="-47" rx="6" ry="4.5" fill="#fff"/><circle cx="6" cy="-47" r="2.6" fill="#10203f"/>
        ${[-10, -3, 4].map(x => `<line x1="${x}" y1="-56" x2="${x * 1.4}" y2="-74" stroke="#2a6cdc" stroke-width="2"/><circle cx="${x * 1.4}" cy="-76" r="3.6" fill="#3fc0c9"/>`).join("")}
        <path d="M-10 92 l -6 10 M 10 92 l 6 10" stroke="#9c7a4a" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  // ---------- Maki catta (étape 3) : tête + queue annelée qui danse ----------
  function maki() {
    const anneaux = Array.from({ length: 12 }, (_, i) =>
      `<circle cx="0" cy="${-i * 15}" r="11" fill="${i % 2 ? "#f4f1ea" : "#2a2622"}"/>`).join("");
    return `<svg class="maki-svg" viewBox="-110 -200 220 300" aria-hidden="true">
      <g class="maki-queue" transform="translate(52 40)">${anneaux}</g>
      <ellipse cx="0" cy="70" rx="44" ry="34" fill="#9d9993"/>
      <ellipse cx="0" cy="76" rx="26" ry="22" fill="#efe9de"/>
      <g class="maki-tete">
        <path d="M-46 -14 C -60 -40 -52 -64 -34 -60 C -26 -40 -30 -26 -30 -18 Z" fill="#8c8882"/>
        <path d="M46 -14 C 60 -40 52 -64 34 -60 C 26 -40 30 -26 30 -18 Z" fill="#8c8882"/>
        <path d="M-50 0 C -50 -40 -22 -52 0 -52 C 22 -52 50 -40 50 0 C 50 30 24 48 0 56 C -24 48 -50 30 -50 0 Z" fill="#a19d97"/>
        <path d="M-40 4 C -40 -28 -14 -36 0 -24 C 14 -36 40 -28 40 4 C 40 26 20 40 0 48 C -20 40 -40 26 -40 4 Z" fill="#f4f1ea"/>
        <path d="M-34 -4 C -30 -22 -10 -20 -8 -6 C -8 6 -22 12 -30 8 Z" fill="#2a2622"/>
        <path d="M34 -4 C 30 -22 10 -20 8 -6 C 8 6 22 12 30 8 Z" fill="#2a2622"/>
        <circle class="oeil" cx="-20" cy="-5" r="7" fill="#f28c1e"/><circle class="oeil" cx="20" cy="-5" r="7" fill="#f28c1e"/>
        <circle cx="-20" cy="-5" r="3.4" fill="#111"/><circle cx="20" cy="-5" r="3.4" fill="#111"/>
        <circle cx="-22" cy="-8" r="1.6" fill="#fff"/><circle cx="18" cy="-8" r="1.6" fill="#fff"/>
        <path d="M0 6 C -4 22 -6 30 0 34 C 6 30 4 22 0 6 Z" fill="#2a2622"/>
        <path d="M-8 40 q 8 6 16 0" stroke="#2a2622" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  // Maki en bain de soleil (guide de pose)
  function makiSoleil() {
    return `<svg viewBox="0 0 200 170" aria-hidden="true">
      <circle cx="160" cy="34" r="22" fill="#ffd166"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="160" y1="2" x2="160" y2="-8" stroke="#ffb627" stroke-width="5" stroke-linecap="round" transform="rotate(${a} 160 34)"/>`).join("")}
      <path d="M70 160 C 40 130 50 95 62 80 L 138 80 C 150 95 160 130 130 160 Z" fill="#9d9993"/>
      <ellipse cx="100" cy="122" rx="30" ry="34" fill="#f4f1ea"/>
      <path d="M64 92 C 40 78 24 70 14 52" stroke="#9d9993" stroke-width="16" stroke-linecap="round" fill="none"/>
      <path d="M136 92 C 160 78 176 70 186 52" stroke="#9d9993" stroke-width="16" stroke-linecap="round" fill="none"/>
      <circle cx="12" cy="48" r="9" fill="#2a2622"/><circle cx="188" cy="48" r="9" fill="#2a2622"/>
      <ellipse cx="100" cy="58" rx="34" ry="30" fill="#a19d97"/>
      <ellipse cx="100" cy="64" rx="25" ry="22" fill="#f4f1ea"/>
      <path d="M80 58 q 8 -5 14 0 M106 58 q 8 -5 14 0" stroke="#2a2622" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M100 70 l -5 9 h 10 z" fill="#2a2622"/>
    </svg>`;
  }

  // ---------- Oie (étape 5) ----------
  function oie() {
    return `<svg class="oie-svg" viewBox="-80 -80 160 140" aria-hidden="true">
      <g class="aile-arriere"><path d="M-6 -2 C -40 -60 -70 -50 -76 -40 C -58 -36 -40 -20 -20 6 Z" fill="#dfe6ec"/></g>
      <path d="M-56 10 C -60 -14 -30 -20 0 -14 C 30 -10 46 4 40 22 C 30 40 -40 40 -56 10 Z" fill="#fff"/>
      <path d="M-56 10 L -74 2 L -60 20 Z" fill="#f4f6f8"/>
      <path d="M30 4 C 40 -20 34 -46 44 -58 C 52 -66 66 -62 66 -50 C 66 -40 56 -38 54 -30 C 50 -14 50 4 40 18 Z" fill="#fff"/>
      <path d="M64 -54 L 84 -48 L 64 -42 Z" fill="#ff9a1f"/><path d="M64 -48 L 82 -48" stroke="#d9741a" stroke-width="1.5"/>
      <circle cx="56" cy="-52" r="3.2" fill="#1a2433"/><circle cx="57" cy="-53" r="1" fill="#fff"/>
      <g class="aile-avant"><path d="M-10 2 C -36 -50 -60 -48 -66 -36 C -50 -28 -38 -10 -18 18 C -8 20 0 14 -10 2 Z" fill="#eef2f5" stroke="#cfd8df" stroke-width="2"/></g>
      <g class="pattes"><path d="M-6 34 l -4 18 l -8 4 h 16 M 12 34 l 2 18 l -6 4 h 16" stroke="#ff9a1f" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
    </svg>`;
  }

  // ---------- Couronne / diadème (posé sur la tête de Croki) ----------
  function diademe() {
    return `<svg viewBox="0 0 100 60" aria-hidden="true">
      <path d="M8 52 L 4 14 L 28 32 L 50 4 L 72 32 L 96 14 L 92 52 Z" fill="#ffc83d" stroke="#d99a00" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="34" r="7" fill="#ff5d73"/><circle cx="26" cy="40" r="5" fill="#3ec1d3"/><circle cx="74" cy="40" r="5" fill="#3ec1d3"/>
      <circle cx="4" cy="14" r="4" fill="#fff4c2"/><circle cx="50" cy="4" r="4" fill="#fff4c2"/><circle cx="96" cy="14" r="4" fill="#fff4c2"/>
    </svg>`;
  }

  // ---------- La fête de Croki : scène qui se remplit ----------
  // gagnes : Set des id d'étapes dont l'accessoire est acquis
  // nouveau : id de l'accessoire qui vient d'arriver (animation d'entrée)
  function fete(gagnes, nouveau, lettres) {
    const a = id => gagnes.has(id);
    const anim = id => (id === nouveau ? " arrive" : "");
    const couleurs = ["#ff5d73", "#ffb627", "#3ec1d3", "#7bd389", "#b28dff", "#ff8c42", "#4d96ff"];
    const W = 360;
    const fanions = CONFIG.motCible.split("").map((L, i) => {
      const x = 30 + i * 50, y = 48 + Math.sin((i / 6) * Math.PI) * 22;
      const visible = lettres[i];
      return `<g class="fanion${visible ? " on" : ""}${lettres.nouveau === i ? " arrive" : ""}" transform="translate(${x} ${y})">
        <path d="M-18 0 L 18 0 L 0 34 Z" fill="${visible ? couleurs[i] : "rgba(255,255,255,.55)"}" stroke="${visible ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.9)"}" stroke-width="2" ${visible ? "" : 'stroke-dasharray="4 3"'}/>
        <text x="0" y="17" text-anchor="middle" class="fanion-l">${visible ? L : "?"}</text></g>`;
    }).join("");
    const guirlande = `<path d="M10 40 Q 180 ${40 + 50} 350 40" stroke="#7a4b21" stroke-width="2.5" fill="none"/>`;
    const ampoules = a("chevres") ? `<g class="lumieres${anim("chevres")}">
        <path d="M0 18 Q 180 64 360 18" stroke="#3d2a14" stroke-width="2" fill="none"/>
        ${Array.from({ length: 13 }, (_, i) => { const t = i / 12, x = t * 360, y = 18 + 4 * t * (1 - t) * 46;
          return `<circle class="ampoule" style="--d:${(i % 4) * .25}s" cx="${x}" cy="${y + 6}" r="5.5" fill="${["#fff17a", "#ffb3c1", "#9ef0ff", "#c6ff9e"][i % 4]}"/>`; }).join("")}
      </g>` : "";
    const serpentins = a("iguane") ? `<g class="serpentins${anim("iguane")}">${[60, 140, 220, 300].map((x, i) =>
      `<path d="M${x} 62 c 10 14 -10 22 0 36 s -10 22 0 36" stroke="${couleurs[(i + 2) % 7]}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join("")}</g>` : "";
    const rubans = a("makis") ? `<g class="rubans${anim("makis")}">${[[24, 120], [336, 120]].map(([x, y]) =>
      `<g transform="translate(${x} ${y})"><path d="M0 0 l -16 -10 v 20 z M0 0 l 16 -10 v 20 z" fill="#ff5d73"/><circle r="5" fill="#d93c55"/><path d="M-2 4 l -8 26 M 2 4 l 8 26" stroke="#ff5d73" stroke-width="5" stroke-linecap="round"/></g>`).join("")}</g>` : "";
    const palmier = (x, flip) => `<g transform="translate(${x} 0) scale(${flip ? -1 : 1} 1)">
      <path d="M0 260 C 6 200 2 140 -6 40" stroke="#8a5a2b" stroke-width="12" fill="none" stroke-linecap="round"/>
      ${[-50, -20, 15, 45, 80].map(r => `<path d="M-6 40 q 30 -20 70 6 q -36 -4 -70 -6" fill="#2a9d61" transform="rotate(${r} -6 40)"/>`).join("")}
    </g>`;
    const assiettes = a("paon") ? `<g class="assiettes${anim("paon")}">${[[96, 226], [264, 226]].map(([x, y]) =>
      `<ellipse cx="${x}" cy="${y}" rx="24" ry="8" fill="#fff" stroke="#3ec1d3" stroke-width="3"/><ellipse cx="${x}" cy="${y - 2}" rx="11" ry="3.6" fill="#ffd166"/>`).join("")}</g>` : "";
    const ananas = a("inseparables") ? `<g class="ananas${anim("inseparables")}" transform="translate(${W / 2 + 60} 196)">
      ${[-14, -6, 2, 10].map(r => `<path d="M0 0 q ${r} -20 ${r * 1.6} -26" stroke="#2f9e44" stroke-width="6" stroke-linecap="round" fill="none"/>`).join("")}
      <ellipse cx="0" cy="18" rx="15" ry="20" fill="#ffb627"/><path d="M-12 8 l 24 18 M -12 24 l 22 -16 M -8 34 l 18 -14" stroke="#d98a00" stroke-width="2"/></g>` : "";
    const invites = CONFIG.stages.filter(s => a(s.id)).map((s, i, arr) => {
      const pos = [[44, 196], [316, 196], [62, 236], [298, 236], [20, 230], [340, 230], [180, 250]][CONFIG.stages.indexOf(s)];
      return `<text class="invite${s.id === nouveau ? " arrive" : ""}" x="${pos[0]}" y="${pos[1]}" text-anchor="middle">${s.emoji}</text>`;
    }).join("");
    const paillettes = a("crocos") ? `<div class="paillettes${anim("crocos")}">${Array.from({ length: 18 }, (_, i) =>
      `<i style="--x:${(i * 53) % 100}%;--d:${(i % 6) * .7}s;--c:${couleurs[i % 7]};--r:${i * 37}deg"></i>`).join("")}</div>` : "";
    const diad = a("oies") ? `<div class="fete-diademe${anim("oies")}">${diademe()}</div>` : "";
    return `
      <div class="fete-scene">
        <svg class="fete-fond" viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs><linearGradient id="ciel-fete" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd59e"/><stop offset=".6" stop-color="#ffb3a7"/><stop offset="1" stop-color="#f59fb0"/></linearGradient></defs>
          <rect width="360" height="260" fill="url(#ciel-fete)"/>
          <circle cx="180" cy="196" r="70" fill="#fff1c9" opacity=".7"/>
          <path d="M0 200 Q 90 180 180 196 T 360 190 V 260 H 0 Z" fill="#7cc6a2"/>
          ${palmier(14, false)}${palmier(346, true)}
          ${ampoules}${guirlande}${fanions}${serpentins}${rubans}
        </svg>
        <img class="fete-croki" src="assets/img/croki-victoire-peace.webp" alt="Croki en fête">
        ${diad}
        <svg class="fete-avant" viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M70 214 H 290 L 300 260 H 60 Z" fill="#ffffff"/>
          <path d="M70 214 H 290 L 292 224 H 68 Z" fill="#ff5d73"/>
          ${[80, 120, 160, 200, 240, 280].map(x => `<path d="M${x} 224 q 10 12 20 0" fill="#ff5d73"/>`).join("")}
          ${assiettes}${ananas}${invites}
        </svg>
        ${paillettes}
      </div>`;
  }

  return { decor, bassin, yeuxCroco, paon, NB_PLUMES, maki, makiSoleil, oie, diademe, fete, hibiscus };
})();
