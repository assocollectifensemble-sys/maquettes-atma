/* ============================================================
   GAMES.JS — Mini-jeux tactiles du moteur commun.
   Games.mount(cfg, hote, { onWin(res), say(texte) }) → { resoudre() }
   Types : « chemin » (traverser le lagon sur le sable), « tuyaux » (guider l'eau de pluie),
           « plage » (ramasser ce qui n'est pas de la plage), « chambre » (défis cachés dans la chambre).
   res = { etoiles: 1..3, erreurs }
   ============================================================ */
(function () {
  "use strict";
  const S = () => window.Audio2 ? Audio2.Sfx : { tap() {}, ok() {}, ko() {}, ramasse() {}, plouf() {}, bulle() {}, indice() {}, doux() {} };
  const NS = "http://www.w3.org/2000/svg";
  const etoiles = e => e === 0 ? 3 : e <= 2 ? 2 : 1;
  function barre(titre, n) { return '<div class="jeu-barre"><span>' + titre + '</span><span class="pastilles">' + Array.from({ length: n }, () => "<i></i>").join("") + '</span></div>'; }
  function pastille(hote, k) { const p = hote.querySelectorAll(".pastilles i"); for (let i = 0; i < p.length; i++) p[i].classList.toggle("on", i < k); }
  function pt(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  function fin(opts, erreurs, delai) { setTimeout(() => opts.onWin({ etoiles: etoiles(erreurs), erreurs }), delai || 900); }
  const P = () => window.H;

  /* ======================= CHEMIN (lagon) ======================= */
  function chemin(cfg, hote, opts) {
    const G = cfg.grille, L = G.length, C = G[0].length, T = 60, ox = (360 - C * T) / 2, oy = 10;
    const chemin = cfg.solution; // liste [c,r] du départ (plage) jusqu'à la cible
    let pos = [cfg.depart[0], L], erreurs = 0, pas = 0, finie = false;
    const couleursCorail = ["#e86f8f", "#f2a65a", "#9a6fd1", "#ff8fa3", "#e05a7a"];
    let s = '<svg viewBox="0 0 360 440" aria-label="Le lagon : touche les taches de sable pour avancer">' +
      '<rect width="360" height="440" fill="' + (cfg.eau || "#5fd0d6") + '"/>' +
      '<path class="reflet" d="M20 40 q20 -6 40 0 M200 120 q20 -6 40 0 M120 260 q20 -6 40 0 M280 330 q20 -6 40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".5"/>';
    for (let r = 0; r < L; r++) for (let c = 0; c < C; c++) {
      const x = ox + c * T, y = oy + r * T, t = G[r][c];
      s += '<g class="obj case" data-c="' + c + '" data-r="' + r + '" data-t="' + t + '"><g class="obj-in">';
      if (t === "S") s += '<rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="' + (T - 8) + '" height="' + (T - 8) + '" rx="18" fill="#f5e6c4"/><circle cx="' + (x + 20) + '" cy="' + (y + 22) + '" r="2" fill="#e0c995"/><circle cx="' + (x + 38) + '" cy="' + (y + 36) + '" r="2.5" fill="#e0c995"/>';
      else if (t === "C") {
        const k = (r * 7 + c * 3) % 5, cc = couleursCorail[k], cc2 = couleursCorail[(k + 2) % 5];
        s += '<rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="' + (T - 4) + '" height="' + (T - 4) + '" rx="14" fill="#47b9c3" opacity=".55"/>' +
          '<path d="M' + (x + 16) + ' ' + (y + 48) + ' v-14 q-8 -6 -6 -16 M' + (x + 16) + ' ' + (y + 34) + ' q6 -8 4 -16 M' + (x + 16) + ' ' + (y + 40) + ' q10 -4 12 -12" stroke="' + cc + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
          '<circle cx="' + (x + 42) + '" cy="' + (y + 40) + '" r="11" fill="' + cc2 + '"/><path d="M' + (x + 34) + ' ' + (y + 40) + ' q8 -6 16 0 M' + (x + 34) + ' ' + (y + 44) + ' q8 -6 16 0" stroke="rgba(255,255,255,.5)" stroke-width="1.6" fill="none"/>' +
          ((r + c) % 3 === 0 ? '<path d="M' + (x + 30) + ' ' + (y + 18) + ' q5 -4 10 0 q-5 4 -10 0z M' + (x + 39) + ' ' + (y + 18) + ' l4 -3 v6z" fill="#ff8c1a"/><path d="M' + (x + 33) + ' ' + (y + 15) + ' v6" stroke="#fff" stroke-width="1.5"/>' : "");
      } else if (t === "N") s += '<rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="' + (T - 8) + '" height="' + (T - 8) + '" rx="18" fill="#bff0e4"/>';
      s += '<rect class="cible" x="' + x + '" y="' + y + '" width="' + T + '" height="' + T + '"/></g></g>';
    }
    // la cible (le personnage)
    const ci = G.findIndex(l => l.includes("N")), cj = G[ci].indexOf("N");
    s += '<g class="flotte" pointer-events="none"><g transform="translate(' + (ox + cj * T - 14) + ' ' + (oy + ci * T - 16) + ') scale(.44)">' + P().perso("coucou") + '</g></g>';
    // la plage (départ)
    s += '<path d="M0 ' + (oy + L * T + 6) + ' q90 -10 180 0 t180 0 V440 H0z" fill="#f6e7c6"/><path class="ressac" d="M0 ' + (oy + L * T + 6) + ' q90 -10 180 0 t180 0" stroke="#fff" stroke-width="4" fill="none"/>' +
      '<text x="352" y="430" text-anchor="end" font-size="12" font-weight="800" fill="#a88a55" font-family="system-ui,sans-serif">' + (cfg.plageNom || "la plage") + '</text>' +
      '<g id="pas"></g><g id="joueur" style="transition:transform .28s ease-out"><circle r="17" fill="#ffd166" stroke="#fff" stroke-width="3"/><rect x="-11" y="-7" width="22" height="9" rx="4" fill="#2a7fd4"/><rect x="-8" y="-5" width="7" height="5" rx="2" fill="#bfe9ff"/><rect x="1" y="-5" width="7" height="5" rx="2" fill="#bfe9ff"/><path d="M10 -5 q6 -2 5 -14" stroke="#ff7b3d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-6 7 q6 5 12 0" stroke="#7a4b1d" stroke-width="2" fill="none" stroke-linecap="round"/></g>';
    s += '</svg>';
    hote.innerHTML = '<div class="jeu">' + barre(cfg.titreBarre || "🐾 Pas de héron", 3) + s + '</div>';
    const svg = hote.querySelector("svg"), joueur = svg.querySelector("#joueur"), pasG = svg.querySelector("#pas");
    const centre = (c, r) => r >= L ? [ox + c * T + T / 2, oy + L * T + 34] : [ox + c * T + T / 2, oy + r * T + T / 2];
    function place() { const p = centre(pos[0], pos[1]); joueur.setAttribute("transform", "translate(" + p[0] + " " + p[1] + ")"); joueur.style.transform = "translate(" + p[0] + "px," + p[1] + "px)"; joueur.removeAttribute("transform"); }
    place();
    const total = chemin.length;
    function avance(c, r) {
      const anc = centre(pos[0], pos[1]);
      pasG.insertAdjacentHTML("beforeend", '<g transform="translate(' + anc[0] + ' ' + anc[1] + ')" opacity=".55"><ellipse cx="-5" cy="2" rx="3" ry="5" fill="#fff"/><ellipse cx="5" cy="-2" rx="3" ry="5" fill="#fff"/></g>');
      pos = [c, r]; pas++; place(); S().tap();
      pastille(hote, Math.min(3, Math.floor(pas / Math.ceil(total / 3))));
    }
    function touche(g) {
      if (finie) return;
      const c = +g.dataset.c, r = +g.dataset.r, t = g.dataset.t;
      const adj = Math.abs(c - pos[0]) + Math.abs(r - pos[1]) === 1;
      if (!adj) { opts.say(cfg.msgLoin); S().doux(); return; }
      if (t === "C") {
        erreurs++; g.classList.remove("non"); void g.getBBox(); g.classList.add("non"); S().ko(); if (window.Audio2) Audio2.vibre(40);
        opts.say(cfg.msgCorail[(erreurs - 1) % cfg.msgCorail.length]); return;
      }
      avance(c, r);
      if (t === "N") { finie = true; pastille(hote, 3); S().ok(); opts.say(cfg.msgGagne); fin(opts, erreurs, 1100); }
      else opts.say(cfg.msgPas[pas % cfg.msgPas.length]);
    }
    svg.addEventListener("click", e => { const g = e.target.closest(".case"); if (g) touche(g); });
    opts.say(cfg.msgDebut);
    return {
      resoudre() { if (finie) return; let i = 0; const go = () => { if (finie || i >= chemin.length) return; const [c, r] = chemin[i++]; const g = svg.querySelector('.case[data-c="' + c + '"][data-r="' + r + '"]'); touche(g); setTimeout(go, 160); }; go(); }
    };
  }

  /* ======================= TUYAUX (eau de pluie) ======================= */
  const FORME = { I: 5, L: 3, T: 7 }; // bits : N=1 E=2 S=4 O=8
  const tourne = (m, r) => { for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
  function tuyaux(cfg, hote, opts) {
    const N = 4, T = 72, ox = 36, oy = 104;
    const tuiles = cfg.tuiles.map(t => ({ f: t[0], sol: t[1], rot: t[2], chemin: !!t[3] }));
    let coups = 0, finie = false;
    let s = '<svg viewBox="0 0 360 440" aria-label="Fais tourner les tuyaux pour amener l\'eau de pluie au potager">' +
      '<rect width="360" height="440" fill="#eaf6ef"/>' + (cfg.decorHaut || "") +
      '<rect x="' + (ox - 8) + '" y="' + (oy - 8) + '" width="' + (N * T + 16) + '" height="' + (N * T + 16) + '" rx="16" fill="#cfe6d6"/>';
    tuiles.forEach((t, i) => {
      const c = i % N, r = Math.floor(i / N), x = ox + c * T, y = oy + r * T;
      if (!t.chemin) { // case de jardin, non jouable : la grille respire et le chemin se lit d'un coup d'œil
        const fl = ["#ff8fab", "#ffd166", "#ffffff", "#c77dff"][i % 4];
        s += '<g class="jardin" aria-hidden="true" transform="translate(' + x + ' ' + y + ')"><rect x="6" y="6" width="60" height="60" rx="14" fill="#8cc9a0" opacity=".45"/>' +
          '<circle cx="' + (24 + (i * 13) % 24) + '" cy="' + (26 + (i * 7) % 18) + '" r="4" fill="' + fl + '" opacity=".8"/></g>';
        return;
      }
      let tracé = t.f === "I" ? "M36 0 V72" : t.f === "L" ? "M36 0 V36 H72" : "M36 0 V72 M36 36 H72";
      s += '<g class="tuile" data-i="' + i + '" transform="translate(' + x + ' ' + y + ')"><rect x="3" y="6" width="66" height="66" rx="12" fill="rgba(0,0,0,.18)"/><rect class="fond-t" x="3" y="3" width="66" height="66" rx="12" fill="#fff" stroke="#2a6f97" stroke-width="3"/><text x="62" y="18" font-size="12" text-anchor="end" fill="#2a6f97" font-weight="900" aria-hidden="true">↻</text>' +
        '<g class="rot" style="transform:rotate(' + (t.rot * 90) + 'deg)"><path class="tuyau" d="' + tracé + '" stroke-width="16" stroke-linecap="butt" fill="none"/><circle cx="36" cy="36" r="9" fill="#cfd8de"/></g></g>';
    });
    // repère d'arrivée : là où l'eau doit sortir
    const ax = ox + (N - 1) * T + 36, ay = oy + N * T;
    s += (cfg.decorBas || "") + '<g class="arrivee" aria-hidden="true"><circle class="indice-pulse" cx="' + ax + '" cy="' + (ay + 2) + '" r="13" fill="none" stroke="#ffd166" stroke-width="4"/><path d="M' + (ax - 7) + ' ' + (ay - 4) + ' l7 9 l7 -9" fill="none" stroke="#ffd166" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>';
    hote.innerHTML = '<div class="jeu">' + barre(cfg.titreBarre || "💧 Le chemin de l'eau", 3) + s + '</div>';
    const svg = hote.querySelector("svg");
    const masque = t => t.chemin ? tourne(FORME[t.f], t.rot % 4) : 0;
    function coule() {
      const vu = new Set(); const pile = [];
      if (masque(tuiles[0]) & 1) { vu.add(0); pile.push(0); }
      while (pile.length) {
        const i = pile.pop(), c = i % N, r = Math.floor(i / N), m = masque(tuiles[i]);
        [[1, 0, -1, 4], [2, 1, 0, 8], [4, 0, 1, 1], [8, -1, 0, 2]].forEach(([b, dc, dr, opp]) => {
          const nc = c + dc, nr = r + dr; if (!(m & b) || nc < 0 || nr < 0 || nc >= N || nr >= N) return;
          const j = nr * N + nc; if (vu.has(j) || !(masque(tuiles[j]) & opp)) return; vu.add(j); pile.push(j);
        });
      }
      svg.querySelectorAll(".tuile").forEach(g => g.classList.toggle("eau", vu.has(+g.dataset.i)));
      const enChemin = tuiles.filter((t, i) => t.chemin && vu.has(i)).length, nChemin = tuiles.filter(t => t.chemin).length;
      pastille(hote, Math.floor(3 * enChemin / nChemin));
      return vu.has(N * N - 1) && (masque(tuiles[N * N - 1]) & 4);
    }
    function gagne() {
      finie = true; pastille(hote, 3); S().plouf(); setTimeout(() => S().ok(), 300);
      svg.classList.add("pousse"); const sortie = svg.querySelector("#sortie"); if (sortie) sortie.style.opacity = 1;
      opts.say(cfg.msgGagne); const minimum = cfg.coupsMini || 8; fin(opts, coups <= minimum + 2 ? 0 : coups <= minimum + 8 ? 2 : 3, 1500);
    }
    svg.addEventListener("click", e => {
      const g = e.target.closest(".tuile"); if (!g || finie) return;
      const t = tuiles[+g.dataset.i]; t.rot++; coups++; g.querySelector(".rot").style.transform = "rotate(" + (t.rot * 90) + "deg)"; S().tap();
      if (coule()) gagne(); else if (coups === 6 || coups % 14 === 0) opts.say(cfg.msgAide);
    });
    coule(); opts.say(cfg.msgDebut);
    return {
      resoudre() { if (finie) return; tuiles.forEach((t, i) => { if (t.chemin) { while (t.rot % 4 !== t.sol % 4 && !(t.f === "I" && (t.rot - t.sol) % 2 === 0)) t.rot++; svg.querySelector('.tuile[data-i="' + i + '"] .rot').style.transform = "rotate(" + (t.rot * 90) + "deg)"; } }); if (coule()) gagne(); }
    };
  }

  /* ======================= PLAGE (ramasser) ======================= */
  function plage(cfg, hote, opts) {
    const items = cfg.objets.map((o, i) => Object.assign({ i, pris: false }, o));
    const nDechets = items.filter(o => o.dechet).length, panier = cfg.panier || [292, 382];
    let pris = 0, erreurs = 0, finie = false;
    let s = '<svg viewBox="0 0 360 440" aria-label="La plage : touche ou glisse dans le panier ce qui n\'est pas de la plage">' + cfg.decor;
    items.forEach(o => { s += '<g class="obj item" data-i="' + o.i + '" transform="translate(' + o.x + ' ' + o.y + ')"><g class="obj-in"><g transform="scale(' + (o.s || 1.15) + ')">' + Obj[o.obj]() + '</g></g><circle class="cible" r="30"/></g>'; });
    s += '<g id="panier" transform="translate(' + panier[0] + ' ' + panier[1] + ')">' + (cfg.panierSvg || '<path d="M-40 -14 h80 l-8 44 h-64z" fill="#c98d4a"/><path d="M-40 -14 h80" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M-30 -2 h60 M-28 12 h56" stroke="#a8733a" stroke-width="3"/>') + '<text id="compte" y="62" text-anchor="middle" font-size="15" font-weight="900" fill="#5a3a16" font-family="system-ui,sans-serif">0 / ' + nDechets + '</text></g></svg>';
    hote.innerHTML = '<div class="jeu">' + barre(cfg.titreBarre || "🧺 Le panier", 3) + s + '</div>';
    const svg = hote.querySelector("svg"), compte = svg.querySelector("#compte");
    function range(o, g) {
      o.pris = true; pris++; g.style.transition = "transform .45s cubic-bezier(.5,-0.3,.6,1), opacity .45s"; g.setAttribute("transform", "translate(" + panier[0] + " " + (panier[1] - 6) + ") scale(.3)"); g.style.opacity = "0";
      compte.textContent = pris + " / " + nDechets; pastille(hote, Math.floor(3 * pris / nDechets)); S().ramasse();
      if (pris === nDechets) { finie = true; S().ok(); opts.say(cfg.msgGagne); fin(opts, erreurs, 1200); }
      else opts.say(o.msg || cfg.msgPris[(pris - 1) % cfg.msgPris.length]);
    }
    function habitant(o, g) { erreurs++; g.classList.remove("non"); void g.getBBox(); g.classList.add("non"); S().bulle(); opts.say(o.msg); }
    let drag = null;
    svg.addEventListener("pointerdown", e => {
      const g = e.target.closest(".item"); if (!g || finie) return; const o = items[+g.dataset.i]; if (o.pris) return;
      const p = pt(svg, e); drag = { g, o, x0: p.x, y0: p.y, bouge: false }; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } e.preventDefault();
    });
    svg.addEventListener("pointermove", e => {
      if (!drag) return; const p = pt(svg, e), dx = p.x - drag.x0, dy = p.y - drag.y0;
      if (Math.abs(dx) + Math.abs(dy) > 8) drag.bouge = true;
      if (drag.bouge) drag.g.setAttribute("transform", "translate(" + (drag.o.x + dx) + " " + (drag.o.y + dy) + ") scale(1.12)");
    });
    svg.addEventListener("pointerup", e => {
      if (!drag) return; const d = drag; drag = null; const p = pt(svg, e);
      const surPanier = Math.hypot(p.x - panier[0], p.y - panier[1]) < 62;
      if (!d.bouge || surPanier) { if (d.o.dechet) range(d.o, d.g); else { d.g.setAttribute("transform", "translate(" + d.o.x + " " + d.o.y + ")"); habitant(d.o, d.g); } }
      else d.g.setAttribute("transform", "translate(" + d.o.x + " " + d.o.y + ")");
    });
    svg.addEventListener("pointercancel", () => { if (drag) { drag.g.setAttribute("transform", "translate(" + drag.o.x + " " + drag.o.y + ")"); drag = null; } });
    opts.say(cfg.msgDebut);
    return { resoudre() { let k = 0; items.filter(o => o.dechet && !o.pris).forEach(o => setTimeout(() => { if (!o.pris) range(o, svg.querySelector('.item[data-i="' + o.i + '"]')); }, 220 * k++)); } };
  }

  /* ======================= CHAMBRE (défis cachés) ======================= */
  function chambre(cfg, hote, opts) {
    const H = P(), objs = cfg.objets.map((o, i) => Object.assign({ i, fait: false }, o));
    let n = 0, finie = false, ouvert = null;
    let s = '<svg viewBox="0 0 360 440" aria-label="La chambre : trouve les défis cachés">' + Obj.chambre(cfg.palette, cfg.vue);
    objs.forEach(o => {
      s += '<g class="obj defi" data-i="' + o.i + '" transform="translate(' + o.x + ' ' + o.y + ')"><circle class="indice-pulse" r="' + (o.r || 40) + '" fill="none" stroke="' + H.couleurs.accent + '" stroke-width="3" stroke-dasharray="6 6"/>' +
        '<g class="obj-in"><g class="dessin" transform="scale(' + (o.s || 1) + ')">' + Obj[o.obj]("avant", o.couleur) + '</g></g><circle class="cible" r="' + (o.r || 40) + '"/></g>';
    });
    s += '<g transform="translate(296 352) scale(.36)" class="flotte" pointer-events="none">' + H.perso("coucou") + '</g></svg>';
    hote.innerHTML = '<div class="jeu">' + barre(cfg.titreBarre || "🔎 Défis trouvés", objs.length) + s + '</div><div class="carte-defi" hidden></div>';
    const svg = hote.querySelector("svg"), carteD = hote.querySelector(".carte-defi");
    function ouvre(o) {
      ouvert = o; S().bulle();
      carteD.hidden = false;
      carteD.innerHTML = '<div class="savais" style="margin-top:12px"><h3>' + o.icone + ' ' + o.titre + '</h3><p>' + o.defi + '</p></div><button class="btn grand" data-act="defi-ok">' + (o.bouton || "Défi accepté ✓") + '</button>';
      carteD.querySelector("button").addEventListener("click", () => valide(o));
      opts.say(o.indice || ""); carteD.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    function valide(o) {
      if (o.fait) return; o.fait = true; n++; ouvert = null;
      const g = svg.querySelector('.defi[data-i="' + o.i + '"]');
      g.querySelector(".dessin").innerHTML = Obj[o.obj]("apres", o.couleur); g.querySelector(".indice-pulse").remove(); g.classList.add("fait");
      pastille(hote, n); S().ok(); carteD.hidden = true; carteD.innerHTML = "";
      if (n === objs.length) { finie = true; opts.say(cfg.msgGagne); fin(opts, 0, 1200); }
      else opts.say(o.bravo + " " + (cfg.msgReste || "Encore {n} défi(s) caché(s) !").replace("{n}", objs.length - n));
    }
    svg.addEventListener("click", e => { const g = e.target.closest(".defi"); if (!g || finie) return; const o = objs[+g.dataset.i]; if (o.fait) { opts.say(o.bravo); return; } ouvre(o); });
    opts.say(cfg.msgDebut);
    return { resoudre() { let k = 0; objs.filter(o => !o.fait).forEach(o => setTimeout(() => valide(o), 250 * k++)); }, ouvre: i => ouvre(objs[i]) };
  }

  window.Games = { mount(cfg, hote, opts) { return ({ chemin, tuyaux, plage, chambre })[cfg.type](cfg, hote, opts); } };
})();
