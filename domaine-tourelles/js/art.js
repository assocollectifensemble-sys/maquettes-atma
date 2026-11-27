/* ============================================================
   ART.JS — illustrations SVG dessinées à la main (aucun fichier externe)
   Ti Bwa (petit fantôme), Maison de Villeneuve aux deux tours, carte, plantes.
   ============================================================ */
(function () {
  "use strict";
  const C = { vert: "#3E6B48", vertf: "#2a4a32", vertc: "#6f9a6a", bois: "#8B5E3C", boisf: "#5e3d25", creme: "#F4EBD9", brume: "#B8C4C9", rouge: "#C8423B", or: "#e2b04a" };

  /* Ti Bwa : petit fantôme en drap crème, joues géranium, une page de conte à la main */
  function tibwa(opt) {
    opt = opt || {};
    const humeur = opt.humeur || "joie"; // joie | malice | bravo
    const bouche = humeur === "bravo"
      ? '<path d="M84 104 Q100 124 116 104 Z" fill="#5e3d25"/><path d="M92 112 Q100 118 108 112" fill="#C8423B"/>'
      : humeur === "malice"
        ? '<path d="M88 106 Q102 116 114 102" stroke="#5e3d25" stroke-width="4" fill="none" stroke-linecap="round"/>'
        : '<path d="M88 104 Q100 116 112 104" stroke="#5e3d25" stroke-width="4" fill="none" stroke-linecap="round"/>';
    const oeilG = humeur === "malice" ? '<path d="M70 84 Q78 78 86 84" stroke="#2b2620" stroke-width="5" fill="none" stroke-linecap="round"/>' : '<ellipse class="cligne" cx="78" cy="84" rx="7" ry="9" fill="#2b2620"/><circle cx="80" cy="81" r="2.4" fill="#fff"/>';
    return `<svg viewBox="0 0 200 200" role="img" aria-label="Ti Bwa, le petit fantôme du Domaine">
      <ellipse cx="100" cy="188" rx="46" ry="7" fill="#2b2620" opacity=".12"/>
      <g class="flotte">
        <path d="M100 22 C58 22 40 56 40 96 L40 150 Q48 166 58 152 Q68 168 78 152 Q88 168 100 152 Q112 168 122 152 Q132 168 142 152 Q152 166 160 150 L160 96 C160 56 142 22 100 22 Z" fill="#fffaf0" stroke="#d9cdb3" stroke-width="3"/>
        <path d="M60 60 Q70 40 92 36" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="M70 20 Q100 2 130 20 L124 30 Q100 18 76 30 Z" fill="#3E6B48"/>
        <path d="M118 14 q14 -10 22 2 q-12 -2 -18 8 z" fill="#C8423B"/>
        ${oeilG}
        <ellipse class="cligne" cx="122" cy="84" rx="7" ry="9" fill="#2b2620"/><circle cx="124" cy="81" r="2.4" fill="#fff"/>
        <ellipse cx="66" cy="100" rx="9" ry="6" fill="#C8423B" opacity=".35"/>
        <ellipse cx="134" cy="100" rx="9" ry="6" fill="#C8423B" opacity=".35"/>
        ${bouche}
        <path d="M42 112 Q22 104 20 86" stroke="#d9cdb3" stroke-width="3" fill="#fffaf0"/>
        <g transform="rotate(-10 170 112)"><rect x="150" y="92" width="34" height="42" rx="3" fill="#fff8e8" stroke="#8B5E3C" stroke-width="2.5"/>
          <path d="M156 102h22M156 110h22M156 118h16" stroke="#8B5E3C" stroke-width="2" opacity=".6"/></g>
        <path d="M158 112 Q168 116 172 110" stroke="#d9cdb3" stroke-width="3" fill="#fffaf0"/>
      </g>
    </svg>`;
  }

  /* Maison de Villeneuve : façade crème, deux tours, varangue, brume des Hauts */
  function maison(opt) {
    opt = opt || {};
    const pages = opt.pages !== false;
    return `<svg viewBox="0 0 400 300" role="img" aria-label="La Maison de Villeneuve et ses deux tours, dans la brume de la Plaine">
      <defs>
        <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4bd"/><stop offset=".7" stop-color="#dfe6e6"/></linearGradient>
        <linearGradient id="mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf4e4"/><stop offset="1" stop-color="#eadcc0"/></linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ciel)"/>
      <path d="M0 150 Q60 96 130 128 Q190 80 260 120 Q330 88 400 128 L400 300 L0 300Z" fill="#7c9a8a" opacity=".7"/>
      <path d="M0 180 Q80 140 170 168 Q260 136 400 166 L400 300 L0 300Z" fill="#5c8462"/>
      <g class="brume"><ellipse cx="80" cy="150" rx="120" ry="16" fill="#fff" opacity=".55"/></g>
      <g class="brume b2"><ellipse cx="320" cy="138" rx="110" ry="13" fill="#fff" opacity=".5"/></g>
      <g class="vole" opacity=".7"><path d="M0 60 q8 -8 16 0 q8 -8 16 0" stroke="#2a4a32" stroke-width="2.4" fill="none"/></g>
      <!-- palmistes -->
      <g class="balance"><rect x="30" y="120" width="6" height="110" fill="#8B5E3C"/><path d="M33 122 q-34 -6 -40 10 M33 122 q-28 -22 -40 -12 M33 122 q30 -20 42 -8 M33 122 q34 0 38 16 M33 122 q0 -28 8 -34" stroke="#3E6B48" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <g class="balance"><rect x="356" y="128" width="6" height="100" fill="#8B5E3C"/><path d="M359 130 q-34 -6 -40 10 M359 130 q-28 -22 -40 -12 M359 130 q30 -20 42 -8 M359 130 q34 0 38 16" stroke="#3E6B48" stroke-width="7" fill="none" stroke-linecap="round"/></g>
      <!-- tours -->
      <g>
        <rect x="96" y="104" width="52" height="128" fill="url(#mur)" stroke="#b9a684" stroke-width="2"/>
        <path d="M88 108 L122 62 L156 108 Z" fill="#C8423B" stroke="#9e2f29" stroke-width="2"/>
        <rect x="112" y="126" width="20" height="28" rx="10" fill="#3E6B48"/>
        <rect x="252" y="104" width="52" height="128" fill="url(#mur)" stroke="#b9a684" stroke-width="2"/>
        <path d="M244 108 L278 62 L312 108 Z" fill="#C8423B" stroke="#9e2f29" stroke-width="2"/>
        <rect x="268" y="126" width="20" height="28" rx="10" fill="#3E6B48"/>
        <path d="M122 62 v-14 M278 62 v-14" stroke="#5e3d25" stroke-width="3"/>
      </g>
      <!-- corps central -->
      <rect x="146" y="132" width="108" height="100" fill="url(#mur)" stroke="#b9a684" stroke-width="2"/>
      <path d="M140 136 L200 104 L260 136 Z" fill="#a8473e" stroke="#9e2f29" stroke-width="2"/>
      <rect x="160" y="146" width="18" height="26" fill="#3E6B48"/><rect x="222" y="146" width="18" height="26" fill="#3E6B48"/>
      <rect x="190" y="146" width="20" height="26" fill="#3E6B48"/>
      <!-- varangue -->
      <rect x="92" y="186" width="216" height="8" fill="#8B5E3C"/>
      <path d="M92 194 h216" stroke="#5e3d25" stroke-width="2"/>
      ${[100, 124, 148, 172, 196, 220, 244, 268, 292].map(x => `<rect x="${x}" y="194" width="6" height="38" fill="#fffaf0" stroke="#b9a684"/>`).join("")}
      <path d="M92 214 h216" stroke="#b9a684" stroke-width="2"/>
      <rect x="186" y="200" width="28" height="32" fill="#5e3d25"/>
      <!-- marches, allée, géraniums -->
      <path d="M178 232 h44 l14 68 h-72z" fill="#d8c7a6"/>
      ${[70, 84, 316, 330].map(x => `<g><circle cx="${x}" cy="236" r="6" fill="#C8423B"/><circle cx="${x + 7}" cy="242" r="5" fill="#e05a50"/><path d="M${x} 242 v10" stroke="#3E6B48" stroke-width="3"/></g>`).join("")}
      ${pages ? `<g class="page-vole"><rect x="330" y="40" width="22" height="28" rx="2" fill="#fff8e8" stroke="#8B5E3C" stroke-width="2"/><path d="M334 48h14M334 54h14M334 60h9" stroke="#8B5E3C" stroke-width="1.6"/></g>
      <g class="page-vole" style="animation-delay:-3s"><rect x="40" y="70" width="18" height="24" rx="2" fill="#fff8e8" stroke="#8B5E3C" stroke-width="2"/><path d="M43 78h11M43 84h11" stroke="#8B5E3C" stroke-width="1.6"/></g>` : ""}
    </svg>`;
  }

  /* Plantes du parcours (dessins) */
  const plantes = {
    ayapana: `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="94" rx="30" ry="4" fill="#2b2620" opacity=".1"/>
      <path d="M50 92 V40" stroke="#6b4a8a" stroke-width="4"/><path d="M50 70 q-18 -4 -26 -18 q18 0 26 14 M50 70 q18 -4 26 -18 q-18 0 -26 14 M50 54 q-16 -4 -22 -16 q16 0 22 12 M50 54 q16 -4 22 -16 q-16 0 -22 12" fill="#3E6B48"/>
      <path d="M50 80 q-20 -2 -30 -12 q20 -2 30 8 M50 80 q20 -2 30 -12 q-20 -2 -30 8" fill="#5c8462"/>
      <circle cx="50" cy="34" r="6" fill="#b48ad1"/><circle cx="42" cy="38" r="4" fill="#c9a5e0"/><circle cx="58" cy="38" r="4" fill="#c9a5e0"/></svg>`,
    vetiver: `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="94" rx="32" ry="4" fill="#2b2620" opacity=".1"/>
      ${[-26, -18, -10, -3, 4, 11, 18, 26].map((d, i) => `<path d="M50 92 Q${50 + d * .4} 60 ${50 + d} ${14 + (i % 3) * 8}" stroke="${i % 2 ? "#6f9a6a" : "#3E6B48"}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join("")}
      <path d="M38 92 q-2 4 -6 6 M50 92 q0 5 -2 8 M62 92 q2 4 6 6" stroke="#8B5E3C" stroke-width="2"/></svg>`,
    chouchou: `<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="94" rx="30" ry="4" fill="#2b2620" opacity=".1"/>
      <path d="M10 30 Q30 10 50 26 Q70 42 90 22" stroke="#3E6B48" stroke-width="3" fill="none"/>
      <path d="M26 20 q-10 -10 -18 0 q8 8 18 0 M70 34 q8 -12 18 -4 q-8 10 -18 4" fill="#5c8462"/>
      <path d="M48 26 v12" stroke="#3E6B48" stroke-width="3"/>
      <path d="M50 38 C30 40 26 66 36 80 C42 90 58 90 64 80 C74 66 70 40 50 38 Z" fill="#a9c97a" stroke="#6f9a6a" stroke-width="2.5"/>
      <path d="M42 50 q-4 14 0 28 M50 46 v36 M58 50 q4 14 0 28" stroke="#6f9a6a" stroke-width="2" fill="none" opacity=".8"/></svg>`
  };

  /* Carte du Domaine (plan stylisé, d'après le plan du dépliant) */
  function carte(etat) {
    const pin = (id, x, y, n, e) => {
      const col = e === "fait" ? "#3f8f4f" : e === "jouable" ? "#C8423B" : "#a39a8c";
      return `<g class="pin" data-pin="${id}" tabindex="-1">
        ${e === "jouable" ? `<circle class="halo" cx="${x}" cy="${y}" r="16" fill="${col}" opacity=".5"/>` : ""}
        <path d="M${x} ${y + 20} C${x - 4} ${y + 10} ${x - 16} ${y + 4} ${x - 16} ${y - 8} A16 16 0 1 1 ${x + 16} ${y - 8} C${x + 16} ${y + 4} ${x + 4} ${y + 10} ${x} ${y + 20}Z" fill="${col}" stroke="#fff" stroke-width="3"/>
        <text x="${x}" y="${y - 2}" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="system-ui">${e === "fait" ? "✓" : e === "verrou" ? "🔒" : n}</text></g>`;
    };
    return `<svg viewBox="0 0 400 330" role="img" aria-label="Carte du Domaine des Tourelles et des 4 étapes">
      <rect width="400" height="330" fill="#cfdcc4"/>
      <path d="M0 0 h400 v70 Q320 90 240 60 Q160 34 80 66 Q40 80 0 70Z" fill="#4f7a57"/>
      ${[20, 60, 100, 300, 340, 380].map((x, i) => `<g><path d="M${x} ${44 + (i % 2) * 8} l-14 22 h28z" fill="#2a4a32"/><path d="M${x} ${30 + (i % 2) * 8} l-11 20 h22z" fill="#3E6B48"/></g>`).join("")}
      <text x="200" y="26" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="system-ui">FORÊT</text>
      <path d="M200 330 C200 280 150 260 140 220 C130 180 200 170 220 140 C240 110 200 96 200 80" stroke="#efe4cc" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M200 330 C200 280 150 260 140 220 C130 180 200 170 220 140 C240 110 200 96 200 80" stroke="#d6c39d" stroke-width="2" stroke-dasharray="6 8" fill="none"/>
      <!-- maison -->
      <g transform="translate(150 150)">
        <rect x="0" y="10" width="20" height="34" fill="#fbf4e4" stroke="#8B5E3C" stroke-width="2"/><path d="M-4 12 L10 -6 L24 12Z" fill="#C8423B"/>
        <rect x="80" y="10" width="20" height="34" fill="#fbf4e4" stroke="#8B5E3C" stroke-width="2"/><path d="M76 12 L90 -6 L104 12Z" fill="#C8423B"/>
        <rect x="20" y="18" width="60" height="26" fill="#fbf4e4" stroke="#8B5E3C" stroke-width="2"/><path d="M16 20 L50 4 L84 20Z" fill="#a8473e"/>
        <rect x="-4" y="44" width="108" height="6" fill="#8B5E3C"/>
      </g>
      <text x="200" y="222" text-anchor="middle" font-size="11" font-weight="800" fill="#5e3d25" font-family="system-ui">MAISON DE VILLENEUVE</text>
      <!-- jardins utilitaires -->
      <g>${[0, 1, 2, 3].map(i => `<rect x="${36 + i * 22}" y="${236 + (i % 2) * 6}" width="18" height="40" rx="4" fill="#8fb27a" stroke="#6f9a6a"/>`).join("")}</g>
      <text x="80" y="296" text-anchor="middle" font-size="10" font-weight="800" fill="#2a4a32" font-family="system-ui">JARDINS UTILITAIRES</text>
      <!-- boutique -->
      <rect x="284" y="236" width="70" height="40" rx="5" fill="#e8d3b0" stroke="#8B5E3C" stroke-width="2"/><path d="M280 238 l39 -16 l39 16z" fill="#8B5E3C"/>
      <text x="319" y="292" text-anchor="middle" font-size="10" font-weight="800" fill="#5e3d25" font-family="system-ui">BOUTIQUE ARTISANALE</text>
      <text x="200" y="322" text-anchor="middle" font-size="10" font-weight="800" fill="#5e3d25" font-family="system-ui">▲ ENTRÉE</text>
      ${pin("varangue", 200, 132, 1, etat.varangue)}
      ${pin("jardin", 80, 226, 2, etat.jardin)}
      ${pin("salon", 268, 160, 3, etat.salon)}
      ${pin("boutique", 319, 216, 4, etat.boutique)}
    </svg>`;
  }

  /* Livre de contes ouvert (victoire) */
  function livre(n) {
    return `<svg class="livre-ouvert" viewBox="0 0 320 200" role="img" aria-label="Le livre de contes de Ti Bwa, ${n} pages retrouvées sur 4">
      <ellipse cx="160" cy="190" rx="130" ry="8" fill="#2b2620" opacity=".12"/>
      <path d="M20 40 Q90 20 160 44 Q230 20 300 40 L300 176 Q230 156 160 180 Q90 156 20 176Z" fill="#8B5E3C"/>
      <path d="M30 36 Q92 18 158 40 V172 Q92 150 30 168Z" fill="#fff8e8"/>
      <path d="M162 40 Q228 18 290 36 V168 Q228 150 162 172Z" fill="#fffdf6"/>
      ${[0, 1, 2, 3].map(i => i < n ? `<path d="M${46 + (i % 2) * 130} ${66 + Math.floor(i / 2) * 50} h90" stroke="#8B5E3C" stroke-width="3" opacity=".55"/><path d="M${46 + (i % 2) * 130} ${78 + Math.floor(i / 2) * 50} h70" stroke="#8B5E3C" stroke-width="3" opacity=".4"/>` : `<rect x="${46 + (i % 2) * 130}" y="${58 + Math.floor(i / 2) * 50}" width="90" height="30" rx="6" fill="none" stroke="#c9b58f" stroke-width="2" stroke-dasharray="5 5"/>`).join("")}
      <path d="M160 44 V180" stroke="#5e3d25" stroke-width="2"/>
    </svg>`;
  }

  function sceau() {
    return `<svg class="d-sceau" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="#C8423B"/><circle cx="40" cy="40" r="27" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M28 46 L34 30 L40 40 L46 30 L52 46Z" fill="#fff"/><text x="40" y="60" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="system-ui">TI BWA</text></svg>`;
  }

  window.Art = { tibwa, maison, plantes, carte, livre, sceau, C };
})();
