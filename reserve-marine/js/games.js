/* ============================================================
   GAMES.JS — Les 3 mini-jeux tactiles (doigt, souris ; touche Entrée/Espace
   sur les objets pour le clavier).
   Games.mount(type, hote, { onWin(resultat) }) → { destroy(), solve() }
   resultat = { etoiles: 1 à 3, detail: texte }
   - plage  : ramasser les déchets, laisser le naturel ; un sac plastique file vers l'eau.
   - paddle : guider un paddle au doigt sur le sable, sans toucher les coraux, malgré le courant.
   - sac    : préparer le sac de plage (glisser-déposer ou toucher).
   ============================================================ */
(function () {
  "use strict";
  const C = () => window.Content, S = () => window.Audio2;
  const NS = "http://www.w3.org/2000/svg";
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ");
  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function ptSVG(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function etat(hote, t) { const e = hote.querySelector(".jeu-etat"); if (e) e.textContent = typo(t); }

  // =============================== 1. LA PLAGE ===============================
  function plage(hote, opts) {
    const items = C().plage, total = items.filter(i => i.mal).length;
    let pris = 0, fuites = 0, fini = false, raf = 0, t0 = 0, ventPause = 0;
    let sable = "";
    for (let i = 0; i < 70; i++) sable += '<circle cx="' + ((i * 53) % 360) + '" cy="' + (150 + ((i * 97) % 280)) + '" r="' + (1 + (i % 3) * .6) + '" fill="#d4ad6c" opacity=".45"/>';
    hote.innerHTML = '<div class="jeu jeu-plage"><svg class="plage-svg" viewBox="0 0 360 430" role="group" aria-label="La plage : touche les déchets">' +
      '<defs><linearGradient id="pl-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14a3bb"/><stop offset="1" stop-color="#5fd6d0"/></linearGradient>' +
      '<linearGradient id="pl-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e4b8"/><stop offset="1" stop-color="#ecc98c"/></linearGradient></defs>' +
      '<rect width="360" height="430" fill="url(#pl-s)"/>' + sable +
      '<path d="M0 0 H360 V138 Q270 152 180 142 T0 146Z" fill="url(#pl-l)"/>' +
      '<g class="pl-vagues"><path class="lechee" d="M0 140 Q90 128 180 138 T360 132 V150 Q270 160 180 152 T0 156Z" fill="#fff" opacity=".75"/></g>' +
      '<g fill="#25747a" opacity=".5"><ellipse cx="70" cy="50" rx="40" ry="12"/><ellipse cx="250" cy="70" rx="50" ry="14"/><ellipse cx="320" cy="26" rx="30" ry="8"/></g>' +
      '<g class="pl-caust" fill="none" stroke="#fff" stroke-width="1.4" opacity=".2"><path d="M-30 40 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/><path d="M-30 90 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/></g>' +
      '<text x="180" y="30" text-anchor="middle" font-size="13" font-weight="800" fill="#e8fdff" font-family="system-ui,sans-serif" opacity=".85">LE LAGON</text>' +
      '<g class="pl-objets">' + items.map(it => '<g class="obj" data-id="' + it.id + '" transform="translate(' + it.x + ' ' + it.y + ')" tabindex="0" role="button" aria-label="' + it.nom + '"><g class="obj-in"><circle r="27" fill="#fff" opacity="0" class="cible"/>' + window.Art.objets[it.id] + '</g></g>').join("") + '</g>' +
      '</svg><div class="collecte" aria-live="polite"><span class="collecte-ico" aria-hidden="true">🗑️</span><span>Sac de collecte</span><b class="compte">0 / ' + total + '</b><span class="fuite" hidden></span></div>' +
      '<p class="jeu-etat" role="status">Le vent souffle : le sac plastique file vers l\'eau !</p></div>';
    const svg = hote.querySelector("svg"), sacEl = svg.querySelector('[data-id="sac"]'), sacIn = sacEl.querySelector(".obj-in");
    const depart = items.find(i => i.vent); let sx = depart.x, sy = depart.y;
    function vent(ts) {
      if (fini) return;
      if (!t0) t0 = ts; const dt = Math.min(.05, (ts - t0) / 1000); t0 = ts;
      if (!sacEl.classList.contains("pris") && ts > ventPause) {
        sy -= dt * 9; sx += Math.sin(ts / 700) * dt * 14;
        sacEl.setAttribute("transform", "translate(" + sx.toFixed(1) + " " + sy.toFixed(1) + ") rotate(" + (Math.sin(ts / 400) * 12).toFixed(1) + ")");
        if (sy < 150) { // dans l'eau : on le rattrapera au prochain coup de vent
          fuites++; S().Sfx.plouf(); S().vibre(80);
          etat(hote, "Trop tard : le sac est parti dans le lagon… Tout ce qu'on abandonne finit dans l'eau. Il revient avec la vague : attrape-le !");
          const f = hote.querySelector(".fuite"); f.hidden = false; f.textContent = "🌊 " + fuites + " parti" + (fuites > 1 ? "s" : "") + " à l'eau";
          sx = depart.x + 30; sy = depart.y + 40; ventPause = ts + 1200;
        }
      }
      raf = requestAnimationFrame(vent);
    }
    if (!reduit()) raf = requestAnimationFrame(vent);
    function touche(g) {
      if (fini || !g || g.classList.contains("pris")) return;
      const it = items.find(i => i.id === g.dataset.id);
      if (it.mal) {
        g.classList.add("pris"); pris++; S().Sfx.ramasse(); S().vibre(30);
        hote.querySelector(".compte").textContent = pris + " / " + total;
        const col = hote.querySelector(".collecte"); col.classList.remove("pop"); void col.offsetWidth; col.classList.add("pop");
        etat(hote, it.msg + (pris < total ? "" : ""));
        if (pris === total) gagne();
      } else {
        const inn = g.querySelector(".obj-in"); inn.classList.remove("non"); void inn.getBBox(); inn.classList.add("non");
        S().Sfx.doux(); etat(hote, it.msg);
      }
    }
    function gagne() {
      fini = true; cancelAnimationFrame(raf);
      svg.classList.add("propre"); S().Sfx.ok();
      etat(hote, "Plage propre ! Tous les déchets sont dans le sac.");
      setTimeout(() => opts.onWin({ etoiles: 3 - Math.min(2, fuites), detail: fuites ? fuites + " sac parti à l'eau" : "Aucun déchet parti à l'eau" }), 1300);
    }
    svg.addEventListener("pointerdown", e => { const g = e.target.closest(".obj"); if (g) { e.preventDefault(); touche(g); } });
    svg.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { const g = e.target.closest(".obj"); if (g) { e.preventDefault(); touche(g); } } });
    return {
      destroy() { fini = true; cancelAnimationFrame(raf); },
      solve() { svg.querySelectorAll(".obj").forEach(g => { const it = items.find(i => i.id === g.dataset.id); if (it.mal && !g.classList.contains("pris")) touche(g); }); }
    };
  }

  // =============================== 2. LE PADDLE ===============================
  // massifs de corail : groupes de cercles [cx, cy, r] (zones SOMBRES) ; tout le reste = sable (zones CLAIRES)
  const MASSIFS = [
    [[204, 442, 36], [254, 410, 30], [314, 424, 40], [356, 470, 30]],
    [[58, 250, 38], [108, 266, 30], [18, 302, 28]],
    [[168, 368, 17]],
    [[344, 300, 36], [332, 236, 28]],
    [[188, 200, 36], [140, 218, 26], [228, 228, 20]],
    [[336, 140, 30], [350, 92, 24]],
    [[190, 104, 30], [104, 122, 34], [40, 172, 30], [150, 60, 22]]
  ];
  const DEPART = [76, 452], BUT = [262, 52], RP = 9; // rayon du paddle
  function paddle(hote, opts) {
    let x = DEPART[0], y = DEPART[1], ang = -90, cible = null, chocs = 0, fini = false, raf = 0, last = 0, invul = 0, sur = [x, y], sillage = 0;
    const couleurs = ["#2c7b7c", "#5c6f58", "#3b6f80", "#6a5f7a", "#2a7f86", "#4c7d70", "#3b7470"];
    const massifs = MASSIFS.map((m, k) => '<g class="massif" data-k="' + k + '">' +
      m.map(c => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (c[2] + 5) + '" fill="' + couleurs[k] + '" opacity=".35"/>').join("") +
      m.map(c => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + couleurs[k] + '"/>').join("") +
      m.map(c => { let d = ""; for (let i = 0; i < 7; i++) { const a = i * 2.4 + k, rr = c[2] * (.25 + (i % 3) * .2); d += '<circle cx="' + (c[0] + Math.cos(a) * rr).toFixed(1) + '" cy="' + (c[1] + Math.sin(a) * rr).toFixed(1) + '" r="' + (2 + (i % 2)) + '" fill="#f6e7c8" opacity=".55"/>'; } return d; }).join("") +
      '</g>').join("");
    hote.innerHTML = '<div class="jeu jeu-paddle"><svg class="paddle-svg" viewBox="0 0 360 480" role="application" aria-label="Le lagon vu du ciel : guide le paddle">' +
      '<defs><radialGradient id="pd-l" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#8ef0e4"/><stop offset=".6" stop-color="#5ad7d3"/><stop offset="1" stop-color="#2bb7c4"/></radialGradient></defs>' +
      '<rect width="360" height="480" fill="url(#pd-l)"/>' +
      '<g class="pd-caust" fill="none" stroke="#fff" stroke-width="1.5" opacity=".22">' + [60, 130, 200, 270, 340, 410].map(yy => '<path d="M-40 ' + yy + ' q20 -7 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/>').join("") + '</g>' +
      '<g class="courant" stroke="#fff" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"><path d="M40 330 h18 l-5 -4 M58 330 l-5 4"/><path d="M200 160 h18 l-5 -4 M218 160 l-5 4"/><path d="M110 40 h18 l-5 -4 M128 40 l-5 4"/></g>' +
      massifs +
      '<path d="M0 468 Q90 452 180 462 T360 458 V480 H0Z" fill="#f6e2b6"/><path d="M0 468 Q90 452 180 462 T360 458" fill="none" stroke="#fff" stroke-width="3"/>' +
      '<g transform="translate(' + BUT[0] + ' ' + BUT[1] + ')"><ellipse rx="44" ry="26" fill="#f8ecc8" opacity=".9"/><ellipse rx="44" ry="26" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="5 5" class="but-onde"/>' +
      '<path d="M8 -4 V-30 L26 -24 L8 -18" fill="#e0553f" stroke="#7a2a1a" stroke-width="1.5"/><circle cx="-8" cy="-2" r="6" fill="#7a4a2a"/><rect x="-13" y="4" width="10" height="12" rx="4" fill="#ffd23f"/>' +
      '<text y="20" x="22" font-size="9" font-weight="900" fill="#7a5a2a" font-family="system-ui,sans-serif">ARRIVÉE</text></g>' +
      '<g class="sillage"></g>' +
      '<g class="pd" transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')"><g class="pd-in">' +
      '<rect x="-24" y="-8" width="48" height="16" rx="8" fill="#ffd23f" stroke="#a87b00" stroke-width="2"/><path d="M-18 0 H20" stroke="#e0553f" stroke-width="3"/>' +
      '<circle cx="-2" cy="0" r="6.5" fill="#7a4a2a"/><path d="M-6 -16 L4 16" stroke="#5a3a20" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="5" cy="17" rx="3" ry="5" fill="#e0553f" transform="rotate(-18 5 17)"/></g></g>' +
      '<g class="doigt" transform="translate(' + (x + 40) + ' ' + (y - 50) + ')"><g class="doigt-in"><circle r="16" fill="#fff" opacity=".35" class="doigt-onde"/><text x="0" y="8" text-anchor="middle" font-size="24">👆</text></g></g>' +
      '</svg><div class="pd-hud"><span>🪸 Coraux touchés : <b class="chocs">0</b></span><span class="pd-courant">🌊 Courant →</span></div>' +
      '<p class="jeu-etat" role="status">Pose ton doigt sur le lagon : le paddle suit ton doigt.</p></div>';
    const svg = hote.querySelector("svg"), pd = svg.querySelector(".pd"), sil = svg.querySelector(".sillage"), doigt = svg.querySelector(".doigt");
    const touche = (px, py) => { for (let k = 0; k < MASSIFS.length; k++) for (const c of MASSIFS[k]) { if (Math.hypot(px - c[0], py - c[1]) < c[2] + RP) return k; } return -1; };
    function boucle(ts) {
      if (fini) return;
      const dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts;
      let vx = 7, vy = 0; // courant vers la droite (« à cause du vent ou du courant », guide p. 8)
      if (cible) { const dx = cible[0] - x, dy = cible[1] - y, d = Math.hypot(dx, dy); if (d > 3) { const v = Math.min(120, d * 3); vx += dx / d * v; vy += dy / d * v; ang = Math.atan2(dy, dx) * 180 / Math.PI; } }
      x = Math.max(12, Math.min(348, x + vx * dt)); y = Math.max(12, Math.min(470, y + vy * dt));
      const k = touche(x, y);
      if (k >= 0 && ts > invul) {
        chocs++; invul = ts + 900; S().Sfx.crac(); S().vibre([40, 30, 60]);
        const m = svg.querySelector('.massif[data-k="' + k + '"]'); m.classList.remove("touche"); void m.getBBox(); m.classList.add("touche");
        hote.querySelector(".chocs").textContent = chocs;
        etat(hote, ["Crac ! Une branche de corail cassée… Reviens sur le sable clair.", "Aïe ! Les zones sombres, ce sont des coraux vivants.", "Attention au courant : il te pousse vers les coraux !"][Math.min(2, chocs - 1)]);
        x = sur[0]; y = sur[1]; cible = null;
      } else if (k < 0) sur = [x, y];
      pd.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + ang.toFixed(0) + ")");
      if (cible && ts - sillage > 90) { sillage = ts; const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("r", "6"); c.setAttribute("class", "trace"); sil.appendChild(c); if (sil.childNodes.length > 18) sil.firstChild.remove(); }
      if (Math.hypot(x - BUT[0], y - BUT[1]) < 34) return gagne();
      raf = requestAnimationFrame(boucle);
    }
    function gagne() {
      fini = true; cancelAnimationFrame(raf); S().Sfx.ok(); svg.classList.add("arrive");
      const et = chocs === 0 ? 3 : chocs <= 2 ? 2 : 1;
      etat(hote, chocs === 0 ? "Arrivé sans toucher un seul corail : parfait !" : "Arrivé ! " + chocs + " corail" + (chocs > 1 ? "s" : "") + " touché" + (chocs > 1 ? "s" : "") + " en route.");
      setTimeout(() => opts.onWin({ etoiles: et, detail: chocs === 0 ? "Aucun corail touché" : chocs + " corail" + (chocs > 1 ? "s" : "") + " touché" + (chocs > 1 ? "s" : "") }), 1300);
    }
    const bouge = e => { if (fini) return; const p = ptSVG(svg, e); cible = [p.x, p.y]; };
    svg.addEventListener("pointerdown", e => { e.preventDefault(); svg.setPointerCapture && svg.setPointerCapture(e.pointerId); doigt.style.display = "none"; bouge(e); if (!last) etat(hote, "Garde le doigt sur l'écran et suis le sable clair jusqu'au drapeau."); });
    svg.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") bouge(e); });
    svg.addEventListener("pointerup", () => { cible = null; });
    svg.addEventListener("pointercancel", () => { cible = null; });
    raf = requestAnimationFrame(boucle);
    return {
      destroy() { fini = true; cancelAnimationFrame(raf); },
      solve() { if (!fini) { x = BUT[0]; y = BUT[1]; pd.setAttribute("transform", "translate(" + x + " " + y + ")"); gagne(); } },
      _etat: () => ({ x, y, chocs, fini })
    };
  }

  // =============================== 3. LE SAC DE PLAGE ===============================
  function sac(hote, opts) {
    const items = C().sac, aTrouver = items.filter(i => i.ok).length;
    let dedans = 0, erreurs = 0, fini = false, drag = null;
    hote.innerHTML = '<div class="jeu jeu-sac"><ul class="sac-objets">' + items.map(it => '<li><button class="sac-obj" data-id="' + it.id + '" aria-label="' + it.nom + '">' + window.Art.sacIco[it.id] + '<span>' + typo(it.nom) + '</span></button></li>').join("") + '</ul>' +
      '<div class="sac-zone" aria-hidden="true">' + window.Art.sacIco.sacplage + '<b class="sac-compte">0 / ' + aTrouver + '</b></div>' +
      '<p class="jeu-etat" role="status">Glisse un objet dans le sac, ou touche-le.</p></div>';
    const zone = hote.querySelector(".sac-zone");
    function decide(b) {
      if (fini || b.disabled) return;
      const it = items.find(i => i.id === b.dataset.id);
      if (it.ok) {
        b.disabled = true; b.classList.add("dedans"); dedans++; S().Sfx.ramasse(); S().vibre(30);
        zone.classList.remove("pop"); void zone.offsetWidth; zone.classList.add("pop");
        hote.querySelector(".sac-compte").textContent = dedans + " / " + aTrouver;
        etat(hote, it.msg);
        if (dedans === aTrouver) { fini = true; S().Sfx.ok(); zone.classList.add("plein"); etat(hote, "Le sac est prêt : tu viens admirer sans déranger !"); setTimeout(() => opts.onWin({ etoiles: 3 - Math.min(2, erreurs), detail: erreurs ? erreurs + " objet" + (erreurs > 1 ? "s" : "") + " à laisser à la maison" : "Aucune erreur" }), 1300); }
      } else {
        erreurs++; b.disabled = true; b.classList.add("refuse"); S().Sfx.ko(); S().vibre(100);
        zone.classList.remove("non"); void zone.offsetWidth; zone.classList.add("non");
        etat(hote, it.msg);
      }
    }
    // glisser-déposer (doigt ou souris) ; un simple appui = « je le mets dans le sac »
    hote.addEventListener("pointerdown", e => {
      const b = e.target.closest(".sac-obj"); if (!b || b.disabled || fini) return;
      e.preventDefault();
      const r = b.getBoundingClientRect(), fant = b.cloneNode(true);
      fant.className = "sac-obj fantome"; fant.style.width = r.width + "px"; fant.style.left = r.left + "px"; fant.style.top = r.top + "px";
      drag = { b, fant, x0: e.clientX, y0: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, bouge: false };
      document.body.appendChild(fant);
    });
    const move = e => {
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.bouge = true;
      drag.fant.style.left = (e.clientX - drag.ox) + "px"; drag.fant.style.top = (e.clientY - drag.oy) + "px";
      const z = zone.getBoundingClientRect(); zone.classList.toggle("survol", e.clientX > z.left && e.clientX < z.right && e.clientY > z.top - 20 && e.clientY < z.bottom);
    };
    const up = e => {
      if (!drag) return;
      const z = zone.getBoundingClientRect(), dansSac = e.clientX > z.left && e.clientX < z.right && e.clientY > z.top - 20 && e.clientY < z.bottom;
      const d = drag; drag = null; zone.classList.remove("survol"); d.fant.remove();
      if (!d.bouge || dansSac) decide(d.b);
      else etat(hote, "Lâche l'objet au-dessus du sac pour l'y mettre.");
    };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
    hote.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.closest(".sac-obj")) { e.preventDefault(); decide(e.target.closest(".sac-obj")); } });
    return {
      destroy() { fini = true; document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); if (drag) drag.fant.remove(); },
      solve() { hote.querySelectorAll(".sac-obj").forEach(b => { const it = items.find(i => i.id === b.dataset.id); if (it.ok && !b.disabled) decide(b); }); }
    };
  }

  window.Games = {
    mount(type, hote, opts) { return ({ plage, paddle, sac })[type](hote, opts); },
    MASSIFS, DEPART, BUT
  };
})();
