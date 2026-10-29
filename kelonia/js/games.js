/* ============================================================
   GAMES.JS — Les 5 mini-jeux tactiles (doigt, souris ET clavier).
   Games.mount(id, hôte, { lang, nuit, onWin, onMsg }) → { destroy(), solve() }
   solve() = résolution instantanée (bouton « passer » du mode démo, tests).
   ============================================================ */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const L = (o, lang) => (o && (o[lang] || o.fr)) || "";
  const reduit = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // coordonnées d'un événement pointeur dans le repère du SVG
  function ptSVG(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }

  // =========================================================
  // 1. RADIO : un scanner (loupe) révèle l'hameçon caché
  // =========================================================
  function squelette(clair) {
    const c = clair ? "#e9fbff" : "#5d8aa0", w = clair ? 3 : 2.4, o = clair ? 1 : .55;
    return '<g fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" opacity="' + o + '">' +
      '<ellipse cx="160" cy="150" rx="92" ry="110"/>' +                                        // carapace
      '<path d="M160 44 V262"/>' +                                                               // colonne
      [70, 96, 122, 148, 174, 200, 226].map(y => '<path d="M150 ' + y + ' h20"/>').join("") +   // vertèbres
      [78, 106, 134, 162, 190, 218].map((y, i) => '<path d="M160 ' + y + ' Q' + (110 - i * 2) + ' ' + (y + 6) + ' ' + (82 + Math.abs(i - 2.5) * 4) + ' ' + (y + 20) + ' M160 ' + y + ' Q' + (210 + i * 2) + ' ' + (y + 6) + ' ' + (238 - Math.abs(i - 2.5) * 4) + ' ' + (y + 20) + '"/>').join("") + // côtes soudées
      '<path d="M114 66 L88 54 L74 58 M88 54 L80 46 M74 58 L22 24 M76 56 L18 34 M78 58 L18 46 M80 60 L22 56 M82 62 L30 66"/>' + // nageoire avant gauche (humérus, avant-bras, doigts très allongés)
      '<path d="M206 66 L232 54 L246 58 M232 54 L240 46 M246 58 L298 24 M244 56 L302 34 M242 58 L302 46 M240 60 L298 56 M238 62 L290 66"/>' + // nageoire avant droite
      '<path d="M124 238 L108 256 M108 256 L86 278 M108 256 L94 286 M108 256 L104 290 M196 238 L212 256 M212 256 L234 278 M212 256 L226 286 M212 256 L216 290"/>' + // nageoires arrière
      '<path d="M146 44 Q142 14 160 4 Q178 14 174 44 Z"/><circle cx="152" cy="18" r="4"/><circle cx="168" cy="18" r="4"/>' + // crâne
      '</g>';
  }
  function radio(host, o) {
    const H = { x: 162, y: 54 }; // position de l'hameçon (dans l'œsophage, au niveau du cou)
    host.innerHTML = '<div class="jeu jeu-radio"><svg viewBox="0 0 320 300" class="radio-svg" tabindex="0" role="application" aria-label="Radiographie de Kawann : déplace le scanner avec le doigt ou les flèches du clavier, puis Entrée">' +
      '<defs><clipPath id="loupe"><circle id="lc" cx="80" cy="220" r="46"/></clipPath><radialGradient id="rg" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#16364a"/><stop offset="1" stop-color="#050d14"/></radialGradient></defs>' +
      '<rect width="320" height="300" rx="16" fill="url(#rg)"/>' + squelette(false) +
      '<g clip-path="url(#loupe)"><rect width="320" height="300" fill="#0d2a3b"/>' + squelette(true) +
      '<g id="hook" transform="translate(' + H.x + ' ' + H.y + ') rotate(-20)"><path d="M0 -26 V8 a10 10 0 0 1 -20 0 l-4 -6" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-28" r="4" fill="none" stroke="#fff" stroke-width="3"/><path d="M-24 2 l6 -2" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g></g>' +
      '<circle id="lb" cx="80" cy="220" r="46" fill="none" stroke="#7ff0ff" stroke-width="3"/><circle id="lb2" cx="80" cy="220" r="52" fill="none" stroke="#7ff0ff" stroke-width="1" stroke-dasharray="3 5" class="tourne"/>' +
      '<text x="12" y="290" font-size="12" fill="#7ff0ff" font-family="ui-monospace,monospace">RX · KAWANN · VUE DE DESSUS</text>' +
      '<g id="main" class="main-indice"><path d="M96 238 c-6 -14 4 -20 10 -8 l4 8 c2 -8 12 -6 12 2 c2 -6 12 -4 11 4 c3 -4 11 -2 10 6 l-2 18 c-2 10 -10 14 -20 14 h-6 c-8 0 -12 -6 -16 -14z" fill="#fff" stroke="#06505a" stroke-width="2"/></g>' +
      '</svg><p class="jeu-etat" id="etat" aria-live="polite"></p></div>';
    const svg = host.querySelector("svg"), lc = svg.querySelector("#lc"), lb = svg.querySelector("#lb"), lb2 = svg.querySelector("#lb2"), hook = svg.querySelector("#hook"), etat = host.querySelector("#etat"), main = svg.querySelector("#main");
    let x = 80, y = 220, fini = false, proche = 0, glisse = false;
    const place = () => { [lc, lb, lb2].forEach(c => { c.setAttribute("cx", x); c.setAttribute("cy", y); }); test(); };
    function test() {
      const d = Math.hypot(x - H.x, y - (H.y - 8));
      if (d < 34) { if (!proche) { proche = performance.now(); Audio2.Sfx.bip(); etat.textContent = L({ fr: "Il y a quelque chose ici… touche-le !", en: "Something's here… tap it!" }, o.lang); hook.classList.add("vu"); } }
      else { proche = 0; hook.classList.remove("vu"); }
    }
    function gagne() {
      if (fini) return; fini = true; x = H.x; y = H.y - 8; place();
      hook.classList.add("trouve"); etat.textContent = L({ fr: "Trouvé : un hameçon !", en: "Found: a hook!" }, o.lang); Audio2.Sfx.ok(); Audio2.vibre(80);
      setTimeout(() => o.onWin && o.onWin(), reduit() ? 200 : 900);
    }
    const down = e => { glisse = true; main.style.display = "none"; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); move(e); };
    const move = e => { if (!glisse || fini) return; const p = ptSVG(svg, e); x = Math.max(20, Math.min(300, p.x)); y = Math.max(20, Math.min(280, p.y - 30)); place(); }; // la loupe au-dessus du doigt
    const up = e => { glisse = false; const p = ptSVG(svg, e); if (proche || Math.hypot(p.x - H.x, p.y - H.y) < 30) gagne(); };
    svg.addEventListener("pointerdown", down); svg.addEventListener("pointermove", move); svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", () => glisse = false);
    svg.addEventListener("keydown", e => {
      const k = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[e.key];
      if (k) { e.preventDefault(); main.style.display = "none"; x = Math.max(20, Math.min(300, x + k[0])); y = Math.max(20, Math.min(280, y + k[1])); place(); }
      if ((e.key === "Enter" || e.key === " ") && proche) { e.preventDefault(); gagne(); }
    });
    etat.textContent = L({ fr: "Glisse le doigt : le cercle bleu est le scanner.", en: "Slide your finger: the blue circle is the scanner." }, o.lang);
    return { destroy() { }, solve: gagne };
  }

  // =========================================================
  // 2. TRI : retirer du bassin ce qui est dangereux (glisser)
  // =========================================================
  const OBJ = {
    meduse: '<svg viewBox="0 0 64 64"><path d="M10 30 C10 10 54 10 54 30 q-6 4 -11 0 q-6 4 -11 0 q-6 4 -11 0 q-6 4 -11 0z" fill="#e7a6ff" stroke="#9b4fc2" stroke-width="2.4"/><path d="M18 34 q-4 10 2 22 M28 34 q4 12 -2 24 M38 34 q-4 12 2 22 M46 34 q4 8 0 18" stroke="#b46bd9" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="26" cy="22" r="2.5" fill="#fff"/></svg>',
    sac: '<svg viewBox="0 0 64 64"><path d="M20 10 q-6 0 -6 8 v6 M44 10 q6 0 6 8 v6" stroke="#cfe3ea" stroke-width="4" fill="none"/><path d="M12 24 C12 16 52 16 52 24 L50 50 q-5 4 -9 0 q-5 4 -9 0 q-5 4 -9 0 q-5 4 -9 0z" fill="#f3fbff" fill-opacity=".75" stroke="#9fc3cf" stroke-width="2.4"/><path d="M22 28 v14 M42 28 v14" stroke="#cfe3ea" stroke-width="2"/></svg>',
    crabe: '<svg viewBox="0 0 64 64"><ellipse cx="32" cy="36" rx="17" ry="12" fill="#ff7a45" stroke="#b9431a" stroke-width="2.4"/><path d="M15 34 l-8 -10 M15 30 q-12 -6 -6 -16 q6 2 8 8 M49 30 q12 -6 6 -16 q-6 2 -8 8 M18 42 l-10 6 M20 46 l-8 10 M46 42 l10 6 M44 46 l8 10" stroke="#b9431a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="26" cy="26" r="3" fill="#222"/><circle cx="38" cy="26" r="3" fill="#222"/></svg>',
    fil: '<svg viewBox="0 0 64 64"><path d="M6 20 C20 4 40 40 24 44 C8 48 30 10 50 18 C62 24 44 40 52 52" stroke="#2fb36b" stroke-width="2.6" fill="none"/><path d="M52 52 v6 a5 5 0 0 1 -10 0" stroke="#7a8a90" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    coquillage: '<svg viewBox="0 0 64 64"><path d="M32 8 C14 8 8 26 12 40 Q32 60 52 40 C56 26 50 8 32 8z" fill="#ffd9b0" stroke="#c48a4f" stroke-width="2.4"/><path d="M32 12 V52 M22 14 L26 50 M42 14 L38 50 M14 26 L24 48 M50 26 L40 48" stroke="#c48a4f" stroke-width="2"/></svg>',
    bouteille: '<svg viewBox="0 0 64 64"><g transform="rotate(-30 32 32)"><rect x="26" y="6" width="12" height="6" rx="2" fill="#2d7bd8"/><path d="M26 12 h12 v6 q8 4 8 12 v24 q0 4 -4 4 h-20 q-4 0 -4 -4 v-24 q0 -8 8 -12z" fill="#bfe6ff" fill-opacity=".85" stroke="#5aa7d6" stroke-width="2.4"/><rect x="20" y="32" width="24" height="10" fill="#ff5a5a" opacity=".8"/></g></svg>',
    ballon: '<svg viewBox="0 0 64 64"><ellipse cx="30" cy="24" rx="15" ry="18" fill="#ff4f6d" stroke="#b81f3c" stroke-width="2.4"/><path d="M30 42 l-3 4 h6z" fill="#b81f3c"/><path d="M30 46 q8 6 0 10 q-8 4 2 8" stroke="#555" stroke-width="2" fill="none"/><ellipse cx="24" cy="16" rx="4" ry="6" fill="#fff" opacity=".5"/></svg>'
  };
  // positions dans le bassin (en %), choisies pour ne pas se chevaucher
  const POS = { meduse: [16, 20], sac: [56, 16], crabe: [70, 64], fil: [12, 62], coquillage: [42, 72], bouteille: [76, 32], ballon: [38, 38] };
  function tri(host, o) {
    const C = window.Content;
    host.innerHTML = '<div class="jeu jeu-tri"><div class="bassin" id="bassin" aria-label="La mer"><div class="reflets"></div>' +
      C.tri.map(it => '<button class="objet" data-id="' + it.id + '" style="left:' + POS[it.id][0] + '%;top:' + POS[it.id][1] + '%" aria-label="' + L(it, o.lang) + ' : retirer de l\'eau">' + OBJ[it.id] + '</button>').join("") +
      '</div><div class="poubelle" id="poub"><span aria-hidden="true">🗑️</span> <b>' + L({ fr: "Hors de l'eau", en: "Out of the water" }, o.lang) + '</b> <span id="compte" class="compte">0 / 4</span></div><p class="jeu-etat" id="etat" aria-live="polite"></p></div>';
    const bassin = host.querySelector("#bassin"), etat = host.querySelector("#etat"), compte = host.querySelector("#compte"), poub = host.querySelector("#poub");
    const total = C.tri.filter(t => t.danger).length; let retires = 0, fini = false;
    function juge(btn) {
      const it = C.tri.find(t => t.id === btn.dataset.id); if (!it || btn.classList.contains("retire")) return;
      const nom = L(it, o.lang);
      if (it.danger) {
        btn.classList.add("retire"); btn.disabled = true; retires++; compte.textContent = retires + " / " + total; poub.classList.add("pop"); setTimeout(() => poub.classList.remove("pop"), 400);
        etat.textContent = (it.id === "sac" ? L(C.triMsg.piege, o.lang) + " " : "") + L(C.triMsg.bien, o.lang).replace("{x}", nom.charAt(0).toUpperCase() + nom.slice(1));
        Audio2.Sfx.bulle(); Audio2.vibre(40);
        if (retires === total && !fini) { fini = true; setTimeout(() => { Audio2.Sfx.ok(); bassin.classList.add("propre"); etat.textContent = L({ fr: "Mer propre ! Il ne reste que la nourriture de Kawann.", en: "Clean sea! Only Kawann's food is left." }, o.lang); }, 300); setTimeout(() => o.onWin && o.onWin(), reduit() ? 400 : 1400); }
      } else {
        btn.classList.add("non"); setTimeout(() => btn.classList.remove("non"), 600);
        etat.textContent = L(C.triMsg.nourriture, o.lang).replace("{x}", nom.charAt(0).toUpperCase() + nom.slice(1)); Audio2.Sfx.ko(); Audio2.vibre(120);
      }
    }
    // glisser-déposer au doigt : on suit le doigt, on juge au lâcher s'il est sorti du bassin
    let drag = null;
    bassin.addEventListener("pointerdown", e => {
      const b = e.target.closest(".objet"); if (!b || b.disabled) return;
      e.preventDefault(); const r = b.getBoundingClientRect();
      drag = { b, x0: e.clientX, y0: e.clientY, bouge: false }; b.setPointerCapture && b.setPointerCapture(e.pointerId); b.classList.add("tenu");
      void r;
    });
    bassin.addEventListener("pointermove", e => {
      if (!drag) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (Math.hypot(dx, dy) > 6) drag.bouge = true;
      drag.b.style.transform = "translate(" + dx + "px," + dy + "px) scale(1.12)";
    });
    const fin = e => {
      if (!drag) return; const b = drag.b, br = bassin.getBoundingClientRect();
      const dehors = e.clientX < br.left || e.clientX > br.right || e.clientY < br.top || e.clientY > br.bottom;
      b.classList.remove("tenu"); b.style.transform = "";
      if (drag.bouge && dehors) juge(b);
      else if (drag.bouge) etat.textContent = L({ fr: "Glisse-le jusqu'en dehors de l'eau (vers la poubelle).", en: "Drag it out of the water (towards the bin)." }, o.lang);
      drag = null;
    };
    bassin.addEventListener("pointerup", fin); bassin.addEventListener("pointercancel", () => { if (drag) { drag.b.classList.remove("tenu"); drag.b.style.transform = ""; drag = null; } });
    // clavier / lecteur d'écran : Entrée sur un objet = « le retirer »
    bassin.addEventListener("keydown", e => { const b = e.target.closest(".objet"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); juge(b); } });
    etat.textContent = L({ fr: "Pose le doigt sur un objet et fais-le glisser hors de l'eau.", en: "Put your finger on an object and drag it out of the water." }, o.lang);
    return { destroy() { }, solve() { host.querySelectorAll(".objet").forEach(b => { const it = C.tri.find(t => t.id === b.dataset.id); if (it.danger) juge(b); }); } };
  }

  // =========================================================
  // 3. PHOTO-IDENTIFICATION : écailles de la tête
  // =========================================================
  // Un « profil » = nombre d'écailles par colonne derrière l'œil + découpes (fractions)
  const PROFILS = {
    cible: { post: [.22, .5, .74], r2: [.36, .7], r3: [.5], tache: 0 },
    A: { post: [.33, .66], r2: [.3, .62], r3: [.45], tache: 1 },
    B: { post: [.22, .5, .74], r2: [.36, .7], r3: [.5], tache: 2 },
    C: { post: [.25, .52, .76], r2: [.55], r3: [.3, .7], tache: 3 }
  };
  function tete(p, opts) {
    opts = opts || {};
    // colonnes de 22 px de large, de y=48 à y=104, courbes légèrement
    const col = (x0, x1, cuts, fill, cls, haut, h) => {
      const ys = [0].concat(cuts, [1]).map(f => haut + f * h);
      let s = "";
      for (let i = 0; i < ys.length - 1; i++) {
        const a = ys[i], b = ys[i + 1], w = (i % 2) ? 2 : -2;
        s += '<path class="' + cls + '" d="M' + x0 + ' ' + (a + w) + ' L' + x1 + ' ' + (a - w) + ' L' + (x1 + 2) + ' ' + (b - w) + ' L' + (x0 - 2) + ' ' + (b + w) + 'Z" fill="' + fill + '"/>';
      }
      return s;
    };
    const peau = opts.peau || "#9bb07a", sc = opts.surligne ? "#ff7b5c" : peau, trait = "#34401f";
    // profil gauche d'une tortue verte : crâne arrondi, museau court, bec, cou plissé, grandes écailles de la tête
    return '<svg viewBox="16 14 222 132" class="tete-svg" aria-hidden="true">' +
      '<path d="M20 146 C26 116 40 96 66 84 L84 76 C96 50 128 34 168 34 C200 34 222 50 228 72 C232 86 228 98 220 104 C212 110 200 112 186 112 L160 114 C132 118 108 126 92 146Z" fill="' + peau + '" stroke="' + trait + '" stroke-width="3" stroke-linejoin="round"/>' + // tête + cou
      '<path d="M34 132 q14 -8 28 -4 M46 140 q12 -6 24 -2 M30 120 q10 -6 22 -4" stroke="' + trait + '" stroke-width="1.6" fill="none" opacity=".5"/>' + // plis du cou
      '<path d="M214 104 C222 106 228 112 226 120 C220 118 212 114 206 108Z" fill="#d9d2a0" stroke="' + trait + '" stroke-width="2.4"/>' + // bec (mandibule)
      '<path d="M160 112 C180 110 200 108 218 102" stroke="' + trait + '" stroke-width="2.6" fill="none"/>' + // ligne de la mâchoire
      '<g stroke="' + trait + '" stroke-width="2.2" stroke-linejoin="round">' +
      col(146, 166, p.post, sc, "post", 56, 52) + col(122, 144, p.r2, peau, "r2", 56, 54) + col(98, 120, p.r3, peau, "r3", 62, 52) +
      '<path d="M128 46 L158 38 L190 40 L184 56 L152 54Z" fill="' + peau + '"/><path d="M190 40 L214 52 L208 64 L184 56Z" fill="' + peau + '"/><path d="M208 64 L224 72 L222 88 L204 82Z" fill="' + peau + '"/>' +
      '</g>' +
      '<ellipse cx="186" cy="76" rx="13" ry="11" fill="#f2eedc" stroke="' + trait + '" stroke-width="2"/><circle cx="189" cy="76" r="8" fill="#1d2414"/><circle cx="192" cy="73" r="2.6" fill="#fff"/>' +
      '<path d="M173 70 q13 -10 26 0" stroke="' + trait + '" stroke-width="2.4" fill="none"/>' + // paupière
      (p.tache ? '<circle cx="' + (64 + p.tache * 6) + '" cy="' + (118 - p.tache * 4) + '" r="5" fill="#000" opacity=".12"/>' : "") +
      '</svg>';
  }
  function photoid(host, o) {
    const nb = PROFILS.cible.post.length + 1;
    host.innerHTML = '<div class="jeu jeu-photoid"><figure class="photo-plongeur"><div class="cadre-photo">' + tete(PROFILS.cible, { surligne: true }) + '<span class="exif">📷 Plongeur · Saint-Leu · profil gauche</span></div></figure>' +
      '<div id="etape1"><p class="consigne-jeu"><b>1.</b> ' + L({ fr: "Combien d'écailles juste derrière l'œil (en orange) ?", en: "How many scales just behind the eye (orange)?" }, o.lang) + '</p><div class="choix-nb">' +
      [2, 3, 4, 5].map(n => '<button class="btn nb" data-n="' + n + '">' + n + '</button>').join("") + '</div></div>' +
      '<div id="etape2" hidden><p class="consigne-jeu"><b>2.</b> ' + L({ fr: "Code « " + nb + "… » : quelle fiche du fichier est la même tortue ?", en: "Code “" + nb + "…”: which file card is the same turtle?" }, o.lang) + '</p><div class="fiches">' +
      ["A", "B", "C"].map(k => '<button class="fiche" data-k="' + k + '" aria-label="Fiche ' + k + '"><span class="fiche-k">' + L({ fr: "Fiche", en: "Card" }, o.lang) + ' ' + k + '</span>' + tete(PROFILS[k], { peau: "#a9bd88" }) + '<span class="fiche-code">' + (PROFILS[k].post.length + 1) + '-…</span></button>').join("") +
      '</div></div><p class="jeu-etat" id="etat" aria-live="polite"></p></div>';
    const etat = host.querySelector("#etat"); let fini = false;
    host.addEventListener("click", e => {
      const b = e.target.closest(".nb");
      if (b && !b.disabled) {
        if (+b.dataset.n === nb) { b.classList.add("ok"); host.querySelectorAll(".nb").forEach(x => x.disabled = true); Audio2.Sfx.ok(); etat.textContent = L({ fr: nb + " écailles : c'est le début de son code d'identification !", en: nb + " scales: that's the start of her ID code!" }, o.lang); const e2 = host.querySelector("#etape2"); e2.hidden = false; setTimeout(() => e2.scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "center" }), 150); }
        else { b.classList.add("ko"); b.disabled = true; Audio2.Sfx.ko(); etat.textContent = L({ fr: "Recompte bien les écailles orange, une par une.", en: "Count the orange scales again, one by one." }, o.lang); }
        return;
      }
      const f = e.target.closest(".fiche");
      if (f && !f.disabled && !fini) {
        if (f.dataset.k === "B") gagne(f);
        else { f.classList.add("ko"); f.disabled = true; Audio2.Sfx.ko(); etat.textContent = f.dataset.k === "A" ? L({ fr: "Celle-ci n'a que 3 écailles derrière l'œil.", en: "This one has only 3 scales behind the eye." }, o.lang) : L({ fr: "Même nombre derrière l'œil… mais regarde la rangée suivante : le dessin change !", en: "Same number behind the eye… but look at the next row: the pattern differs!" }, o.lang); }
      }
    });
    function gagne(f) {
      if (fini) return; fini = true; f = f || host.querySelector('.fiche[data-k="B"]');
      host.querySelector("#etape2").hidden = false; f.classList.add("ok"); host.querySelectorAll(".fiche").forEach(x => x.disabled = true);
      etat.textContent = L({ fr: "C'est elle : même dessin d'écailles, écaille par écaille !", en: "That's her: same scale pattern, scale by scale!" }, o.lang); Audio2.Sfx.ok(); Audio2.vibre(80);
      setTimeout(() => o.onWin && o.onWin(), reduit() ? 300 : 1200);
    }
    return { destroy() { }, solve() { const b = host.querySelector('.nb[data-n="' + nb + '"]'); if (b && !b.disabled) b.click(); gagne(); } };
  }

  // =========================================================
  // 4. MESURE : mètre ruban sur la carapace (vue de dessus)
  // =========================================================
  function mesure(host, o) {
    const Y0 = 70, Y1 = 306, CM = 62; // ⚠️ 62 cm : valeur INVENTÉE pour le jeu
    const cm = y => Math.round((y - Y0) / (Y1 - Y0) * CM);
    let ticks = ""; for (let c = 10; c <= 70; c += 10) { const y = Y0 + c / CM * (Y1 - Y0); ticks += '<g class="tick" data-c="' + c + '"><path d="M154 ' + y + ' h12" stroke="#5e4300" stroke-width="2"/><text x="170" y="' + (y + 4) + '" font-size="11" fill="#5e4300" font-weight="700">' + c + '</text></g>'; }
    host.innerHTML = '<div class="jeu jeu-mesure"><svg viewBox="40 0 260 360" class="mesure-svg" role="application" aria-label="Mesure de la carapace">' +
      '<defs><radialGradient id="mc" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#d98c4f"/><stop offset="1" stop-color="#8a4519"/></radialGradient><clipPath id="ruban-clip"><rect id="rclip" x="140" y="' + Y0 + '" width="40" height="0"/></clipPath></defs>' +
      '<rect x="40" width="260" height="360" rx="18" fill="#cfeef0"/><g stroke="#a9dbe0" stroke-width="1">' + [60, 120, 180, 240, 300].map(y => '<path d="M40 ' + y + ' h260"/>').join("") + '</g>' +
      '<path d="M110 120 q-50 -10 -62 -50 q30 -4 66 30z M230 120 q50 -10 62 -50 q-30 -4 -66 30z M118 270 q-34 10 -40 36 q24 4 46 -22z M222 270 q34 10 40 36 q-24 4 -46 -22z" fill="#d9a066" stroke="#7d4a22" stroke-width="2.5"/>' +
      '<path d="M152 78 C146 56 146 34 156 22 C162 14 178 14 184 22 C194 34 194 56 188 78Z" fill="#d6a062" stroke="#6e3f1c" stroke-width="2.5"/><path d="M160 26 l10 -6 10 6 M158 38 l12 4 12 -4 M170 20 v22" stroke="#a86d3a" stroke-width="1.6" fill="none" opacity=".6"/><circle cx="156" cy="32" r="3.4" fill="#2a160b"/><circle cx="184" cy="32" r="3.4" fill="#2a160b"/>' +
      '<path d="M170 ' + Y0 + ' C250 ' + (Y0 + 6) + ' 268 230 170 ' + Y1 + ' C72 230 90 ' + (Y0 + 6) + ' 170 ' + Y0 + 'Z" fill="url(#mc)" stroke="#5e2d10" stroke-width="3"/>' +
      '<g fill="none" stroke="#6b3313" stroke-width="2.2" opacity=".8" stroke-linejoin="round"><path d="M154 96 h32 l6 22 -6 22 h-32 l-6 -22z M154 140 h32 l6 24 -6 24 h-32 l-6 -24z M154 188 h32 l6 22 -10 22 h-24 l-10 -22z M158 232 h24 l4 18 -16 22 -16 -22z"/>' +
      '<path d="M148 118 L104 104 M148 164 L94 156 M148 210 L100 214 M152 250 L118 262 M192 118 L236 104 M192 164 L246 156 M192 210 L240 214 M188 250 L222 262"/></g>' +
      '<g clip-path="url(#ruban-clip)"><rect x="154" y="' + Y0 + '" width="32" height="' + (Y1 - Y0 + 40) + '" fill="#ffd23f" stroke="#c99b00" stroke-width="1.5"/>' + ticks + '</g>' +
      '<rect x="150" y="' + (Y0 - 8) + '" width="40" height="10" rx="3" fill="#333"/>' +
      '<g id="poignee" tabindex="0" role="slider" aria-label="Bout du mètre ruban" aria-valuemin="0" aria-valuemax="70" aria-valuenow="0" class="poignee"><circle id="pc" cx="170" cy="' + (Y0 + 30) + '" r="27" fill="#ff6f59" stroke="#fff" stroke-width="4"/><path id="pf" d="M162 ' + (Y0 + 30) + ' l8 8 8 -8" stroke="#fff" stroke-width="3" fill="none"/></g>' +
      '<g id="lecture"><rect x="222" y="10" width="72" height="34" rx="10" fill="#063b4c"/><text id="lt" x="258" y="33" text-anchor="middle" font-size="18" font-weight="800" fill="#fff">0 cm</text></g>' +
      '</svg><p class="jeu-etat" id="etat" aria-live="polite"></p><p class="mini-note">' + L({ fr: "Les mesures de Kawann sont inventées pour le jeu.", en: "Kawann's measurements are made up for the game." }, o.lang) + '</p></div>';
    const svg = host.querySelector("svg"), pc = svg.querySelector("#pc"), pf = svg.querySelector("#pf"), rclip = svg.querySelector("#rclip"), lt = svg.querySelector("#lt"), poi = svg.querySelector("#poignee"), etat = host.querySelector("#etat");
    let y = Y0 + 30, fini = false, glisse = false, lastTick = 0;
    const place = () => {
      pc.setAttribute("cy", y); pf.setAttribute("d", "M162 " + (y - 4) + " l8 8 8 -8"); rclip.setAttribute("height", y - Y0); lt.textContent = cm(y) + " cm"; poi.setAttribute("aria-valuenow", cm(y));
      const c = cm(y); if (c !== lastTick && c % 5 === 0) { lastTick = c; Audio2.Sfx.tic(); }
    };
    function verifie() {
      if (Math.abs(y - Y1) <= 9) gagne();
      else if (y < Y1) etat.textContent = L({ fr: "Encore un peu : va jusqu'au bout de la carapace (pas de la queue !).", en: "A bit more: go to the end of the shell." }, o.lang);
      else etat.textContent = L({ fr: "Trop loin ! On mesure seulement la carapace.", en: "Too far! Only measure the shell." }, o.lang);
    }
    function gagne() {
      if (fini) return; fini = true; y = Y1; place(); poi.classList.add("ok");
      etat.textContent = L({ fr: "Longueur de la carapace : " + CM + " cm. Le soigneur la note dans le dossier.", en: "Shell length: " + CM + " cm. The keeper writes it in the file." }, o.lang); Audio2.Sfx.ok(); Audio2.vibre(80);
      setTimeout(() => o.onWin && o.onWin(), reduit() ? 300 : 1100);
    }
    poi.addEventListener("pointerdown", e => { glisse = true; poi.setPointerCapture && poi.setPointerCapture(e.pointerId); e.preventDefault(); });
    poi.addEventListener("pointermove", e => { if (!glisse || fini) return; y = Math.max(Y0 + 20, Math.min(Y1 + 34, ptSVG(svg, e).y)); place(); });
    poi.addEventListener("pointerup", () => { if (!glisse) return; glisse = false; if (!fini) verifie(); });
    poi.addEventListener("keydown", e => { if (fini) return; if (e.key === "ArrowDown" || e.key === "ArrowRight") { y = Math.min(Y1 + 34, y + 8); place(); e.preventDefault(); } if (e.key === "ArrowUp" || e.key === "ArrowLeft") { y = Math.max(Y0 + 20, y - 8); place(); e.preventDefault(); } if (e.key === "Enter") verifie(); });
    place(); etat.textContent = L({ fr: "Tire le rond orange vers le bas, jusqu'au bout de la carapace.", en: "Pull the orange circle down to the end of the shell." }, o.lang);
    return { destroy() { }, solve: gagne };
  }

  // =========================================================
  // 5. PLAGE DE NUIT : éteindre les lumières pour guider les bébés tortues
  // =========================================================
  const LUMIERES = [
    { id: "lampadaire", x: 70, y: 352, fr: "le lampadaire", en: "the street lamp", jaune: true },
    { id: "terrasse", x: 300, y: 318, fr: "le projecteur de la terrasse", en: "the terrace floodlight" },
    { id: "torche", x: 246, y: 236, fr: "la lampe torche du promeneur", en: "the walker's torch" },
    { id: "enseigne", x: 186, y: 394, fr: "l'enseigne lumineuse", en: "the neon sign" }
  ];
  function plage(host, o) {
    const NID = { x: 160, y: 262 };
    const lum = LUMIERES.map(l => {
      let forme = "";
      if (l.id === "lampadaire") forme = '<path d="M' + l.x + ' ' + (l.y + 40) + ' v-46 q0 -10 12 -10 h8" stroke="#2b2b2b" stroke-width="5" fill="none"/><rect x="' + (l.x + 12) + '" y="' + (l.y - 22) + '" width="18" height="8" rx="3" fill="#444"/><path class="cone-jaune" d="M' + (l.x + 14) + ' ' + (l.y - 14) + ' l-14 52 h42 l-14 -52z" fill="#ffb000" opacity="0"/>';
      if (l.id === "terrasse") forme = '<rect x="' + (l.x - 26) + '" y="' + (l.y + 8) + '" width="60" height="30" fill="#3a2a20"/><rect x="' + (l.x - 4) + '" y="' + (l.y - 6) + '" width="14" height="10" rx="2" fill="#555" transform="rotate(-30 ' + l.x + ' ' + l.y + ')"/>';
      if (l.id === "torche") forme = '<circle cx="' + (l.x + 12) + '" cy="' + (l.y - 22) + '" r="6" fill="#1b1b1b"/><path d="M' + (l.x + 6) + ' ' + (l.y - 14) + ' h12 l2 24 h-16z" fill="#1b1b1b"/><rect x="' + (l.x - 4) + '" y="' + (l.y - 8) + '" width="10" height="5" fill="#666"/>';
      if (l.id === "enseigne") forme = '<rect x="' + (l.x - 30) + '" y="' + (l.y - 12) + '" width="60" height="22" rx="4" fill="#222" stroke="#555"/><text class="neon" x="' + l.x + '" y="' + (l.y + 4) + '" text-anchor="middle" font-size="13" font-weight="900" fill="#fff">SNACK</text>';
      return '<g class="lumiere on" data-id="' + l.id + '" tabindex="0" role="button" aria-label="Éteindre ' + L(l, o.lang) + '"><circle class="halo-l" cx="' + l.x + '" cy="' + (l.y - 10) + '" r="70" fill="url(#hl)"/>' + forme + '<circle cx="' + l.x + '" cy="' + (l.y - 6) + '" r="30" fill="transparent"/></g>';
    }).join("");
    host.innerHTML = '<div class="jeu jeu-plage"><svg viewBox="0 0 360 440" class="plage-svg" aria-label="Plage de nuit : touche les lumières">' +
      '<defs><radialGradient id="hl"><stop offset="0" stop-color="#fff7d6" stop-opacity=".95"/><stop offset=".35" stop-color="#ffe9a8" stop-opacity=".5"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="mn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1830"/><stop offset="1" stop-color="#1d3a5c"/></linearGradient><linearGradient id="sb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c5040"/><stop offset="1" stop-color="#3a3026"/></linearGradient></defs>' +
      '<rect width="360" height="440" fill="#070d18"/><rect width="360" height="70" fill="url(#mn)"/>' +
      '<circle cx="280" cy="30" r="14" fill="#f4ecd2"/>' +
      '<rect y="70" width="360" height="110" fill="#14304e"/><path d="M262 76 h36 M254 92 h52 M266 110 h28 M258 128 h44" stroke="#c9d8e8" stroke-width="3" opacity=".55" class="reflet-lune"/>' +
      '<path d="M0 70 h360" stroke="#5f86ad" stroke-width="2"/>' +
      '<g class="ressac"><path d="M-40 176 q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 v10 h-440z" fill="#9fb9cf" opacity=".6"/></g>' +
      '<rect y="182" width="360" height="160" fill="url(#sb)"/>' +
      '<rect y="342" width="360" height="98" fill="#1a1a1e"/><path d="M0 392 h360" stroke="#d8c25a" stroke-width="3" stroke-dasharray="18 14" opacity=".5"/>' +
      '<ellipse cx="' + NID.x + '" cy="' + NID.y + '" rx="26" ry="10" fill="#2e261d"/>' +
      '<g id="petrel" class="petrel"><path d="M0 0 q-14 -10 -26 -2 q12 -2 26 8 q14 -10 26 -8 q-12 -8 -26 2z" fill="#1a1a1a" stroke="#888" stroke-width=".8"/></g>' +
      lum + '<g id="bebes"></g></svg>' +
      '<div class="jauge"><span>' + L({ fr: "Lumières allumées", en: "Lights on" }, o.lang) + '</span><b id="nbl">4</b></div><p class="jeu-etat" id="etat" aria-live="polite"></p></div>';
    const svg = host.querySelector("svg"), gb = svg.querySelector("#bebes"), etat = host.querySelector("#etat"), nbl = host.querySelector("#nbl"), pet = svg.querySelector("#petrel");
    const bebes = [];
    for (let i = 0; i < 7; i++) {
      const g = document.createElementNS(NS, "g");
      g.innerHTML = '<g class="bb"><ellipse rx="6" ry="7.5" fill="#3a2a1c" stroke="#a88a60" stroke-width="1.2"/><circle cy="-9" r="3.2" fill="#3a2a1c" stroke="#a88a60" stroke-width="1"/><path d="M-6 -3 l-6 -4 M6 -3 l6 -4 M-5 5 l-4 4 M5 5 l4 4" stroke="#a88a60" stroke-width="2" stroke-linecap="round"/></g>';
      gb.appendChild(g); bebes.push({ g, x: NID.x - 18 + i * 6, y: NID.y - 4 + (i % 2) * 6, a: 0, mer: false });
    }
    const etats = {}; LUMIERES.forEach(l => etats[l.id] = "on");
    let fini = false, raf = 0, t0 = performance.now(), pt = 0;
    const allumees = () => LUMIERES.filter(l => etats[l.id] === "on");
    function bascule(id) {
      if (fini || etats[id] !== "on") return;
      const l = LUMIERES.find(x => x.id === id), g = svg.querySelector('.lumiere[data-id="' + id + '"]');
      etats[id] = l.jaune ? "jaune" : "off"; g.classList.remove("on"); g.classList.add(l.jaune ? "jaune" : "off"); g.setAttribute("aria-label", L(l, o.lang) + " : OK");
      Audio2.Sfx.clic(); Audio2.vibre(30);
      const n = allumees().length; nbl.textContent = n;
      etat.textContent = l.jaune ? L({ fr: "Le lampadaire passe en lumière jaune, tournée vers le sol. Bien !", en: "The street lamp now gives yellow light, pointing down. Good!" }, o.lang)
        : n ? L({ fr: "Éteinte ! Encore " + n + " lumière" + (n > 1 ? "s" : "") + "…", en: "Off! " + n + " more…" }, o.lang) : "";
      if (n === 0) { etat.textContent = L({ fr: "La plage est sombre : les bébés tortues retrouvent le chemin de la mer !", en: "The beach is dark: the hatchlings find their way to the sea!" }, o.lang); svg.classList.add("sombre"); }
    }
    svg.addEventListener("click", e => { const g = e.target.closest(".lumiere"); if (g) bascule(g.dataset.id); });
    svg.addEventListener("keydown", e => { const g = e.target.closest(".lumiere"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); bascule(g.dataset.id); } });
    // boucle d'animation : les bébés vont vers la lumière la plus forte… ou vers la mer
    function boucle(t) {
      const dt = Math.min(.05, (t - (pt || t)) / 1000); pt = t;
      const on = allumees();
      bebes.forEach((b, i) => {
        if (b.mer) return;
        let tx, ty, v;
        if (on.length) { const l = on[i % on.length]; tx = l.x; ty = l.y - 20; v = 14; }
        else { tx = 40 + i * 44; ty = 150; v = 34; }
        const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
        const wob = Math.sin(t / 180 + i) * .6;
        if (d > 4) { b.x += (dx / d + wob * (dy / d) * .3) * v * dt; b.y += (dy / d - wob * (dx / d) * .3) * v * dt; }
        else if (!on.length) { b.mer = true; b.g.classList.add("dans-mer"); }
        b.a = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        b.g.setAttribute("transform", "translate(" + b.x.toFixed(1) + " " + b.y.toFixed(1) + ") rotate(" + b.a.toFixed(0) + ")");
      });
      // le pétrel tourne autour du lampadaire tant qu'il est blanc et allumé
      const tt = (t - t0) / 1000;
      if (etats.lampadaire === "on") pet.setAttribute("transform", "translate(" + (82 + Math.cos(tt * 1.6) * 40).toFixed(1) + " " + (300 + Math.sin(tt * 1.6) * 22).toFixed(1) + ") scale(.9)");
      else { const k = Math.min(1, (pet._k = (pet._k || 0) + dt * .5)); pet.setAttribute("transform", "translate(" + (82 - k * 120).toFixed(1) + " " + (300 - k * 300).toFixed(1) + ") scale(.9)"); }
      if (!fini && bebes.every(b => b.mer)) gagne();
      raf = requestAnimationFrame(boucle);
    }
    function gagne() {
      if (fini) return; fini = true; Audio2.Sfx.vague(); Audio2.Sfx.ok(); Audio2.vibre([60, 40, 60]);
      etat.textContent = L({ fr: "Tous les bébés tortues ont rejoint la mer !", en: "All the hatchlings reached the sea!" }, o.lang);
      setTimeout(() => o.onWin && o.onWin(), reduit() ? 300 : 1000);
    }
    raf = requestAnimationFrame(boucle);
    etat.textContent = L({ fr: "Regarde : les bébés tortues partent vers les lumières… Touche chaque lumière !", en: "Look: the hatchlings head for the lights… Tap each light!" }, o.lang);
    return {
      destroy() { cancelAnimationFrame(raf); },
      solve() { LUMIERES.forEach(l => bascule(l.id)); bebes.forEach((b, i) => { b.x = 40 + i * 44; b.y = 150; b.mer = true; b.g.setAttribute("transform", "translate(" + b.x + " " + b.y + ")"); }); gagne(); }
    };
  }

  const JEUX = { radio, tri, photoid, mesure, plage };
  window.Games = { mount(id, host, o) { return JEUX[id](host, o || {}); }, tete, PROFILS };
})();
