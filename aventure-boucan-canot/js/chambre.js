/* ============================================================
   CHAMBRE.JS — Les micro-actions tactiles de la mission « chambre ».
   Chaque défi de la chambre ouvre un volet où l'enfant FAIT le geste au doigt :
     serviette → la glisser jusqu'au porte-serviettes (aimantation, elle se suspend)
     lampe     → appuyer : la lumière s'éteint, la pièce passe en mode nuit (lune, étoiles)
     robinet   → faire tourner la poignée au doigt (geste circulaire, ~1 tour) : les gouttes ralentissent puis s'arrêtent
     douche    → même geste circulaire sur le mitigeur : la douche s'arrête
     carafe    → la glisser au-dessus du verre : elle verse, le verre se remplit
     tri       → glisser chaque déchet dans le bon bac
     clim      → ouvrir la fenêtre : la clim se met en pause
   Actions.scene(o, cfg) → { svg, init(svgEl, api) } ; api = { fini(), say(t) }.
   Souris + doigt (pointer events), cibles ≥ 44 px, et chaque cible est un « bouton »
   au clavier (Tab puis Entrée/Espace) : l'action se fait alors d'un coup.
   ============================================================ */
(function () {
  "use strict";
  const S = () => window.Audio2 ? Audio2.Sfx : { tap() {}, ok() {}, ko() {}, ramasse() {}, plouf() {}, bulle() {}, indice() {}, doux() {} };
  const vibre = p => { if (window.Audio2) Audio2.vibre(p); };
  const W = 360, HT = 300;
  function pt(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  const pos = (g, x, y, extra) => { g.style.transform = "translate(" + x + "px," + y + "px)" + (extra || ""); };
  const carreaux = (y0, y1, c) => '<g opacity=".55" stroke="' + (c || "#c9dfe4") + '" stroke-width="2">' + Array.from({ length: Math.ceil((y1 - y0) / 34) }, (_, i) => '<path d="M0 ' + (y0 + 34 * (i + 1)) + ' H360"/>').join("") + [1, 2, 3, 4, 5, 6, 7].map(i => '<path d="M' + i * 48 + ' ' + y0 + ' V' + y1 + '"/>').join("") + '</g>';
  const sol = (p, y) => '<rect y="' + y + '" width="360" height="' + (HT - y) + '" fill="' + p.sol + '"/><rect y="' + (y - 4) + '" width="360" height="5" fill="rgba(0,0,0,.08)"/>' +
    [0, 1, 2].map(i => '<path d="M0 ' + (y + 24 * (i + 1)) + ' H360" stroke="rgba(0,0,0,.07)" stroke-width="2"/>').join("");
  const cible = r => '<circle class="cible" r="' + r + '"/>';
  const fete = (x, y) => '<g class="fete-act" transform="translate(' + x + ' ' + y + ')">' + [[0, -46], [40, -22], [40, 24], [0, 46], [-40, 24], [-40, -22]].map(([a, b], i) => '<g transform="translate(' + a + ' ' + b + ')">' + Obj.etincelle(0, 0, ["#ffd166", "#7fd1ff", "#ff9fb2"][i % 3]) + '</g>').join("") +
    '<g class="coche-act">' + Obj.coche(0, 0) + '</g></g>';

  // rend un groupe « bouton » : clavier + lecteur d'écran
  function bouton(g, label, faire) {
    g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", label);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); faire(); } });
  }
  // glisser au doigt ou à la souris, avec zones d'accroche aimantées
  function glisser(svg, g, o) {
    let d = null, x = o.x, y = o.y;
    const proche = (px, py) => o.zones.find(z => Math.hypot(px - z.x, py - z.y) < z.r);
    pos(g, x, y);
    g.addEventListener("pointerdown", e => {
      if (o.bloque && o.bloque()) return;
      const p = pt(svg, e); d = { dx: p.x - x, dy: p.y - y, bouge: false }; g.classList.add("tenu"); g.classList.remove("revient");
      try { g.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
      e.preventDefault(); S().tap(); vibre(12); if (o.prise) o.prise();
    });
    g.addEventListener("pointermove", e => {
      if (!d) return; const p = pt(svg, e); let nx = p.x - d.dx, ny = p.y - d.dy;
      if (Math.abs(nx - o.x) + Math.abs(ny - o.y) > 6) d.bouge = true;
      nx = Math.max(10, Math.min(W - 10, nx)); ny = Math.max(10, Math.min(HT - 10, ny));
      const z = proche(nx, ny); if (z) { nx += (z.x - nx) * .4; ny += (z.y - ny) * .4; }
      x = nx; y = ny; pos(g, x, y, " scale(1.08)"); if (o.survol) o.survol(z || null);
    });
    const lache = e => {
      if (!d) return; const bouge = d.bouge; d = null; g.classList.remove("tenu");
      try { g.releasePointerCapture(e.pointerId); } catch (err) { /* rien */ }
      const z = proche(x, y); if (o.survol) o.survol(null);
      if (z && o.lache(z) !== false) return;
      x = o.x; y = o.y; g.classList.add("revient"); pos(g, x, y); if (o.rate) o.rate(bouge, z);
    };
    g.addEventListener("pointerup", lache); g.addEventListener("pointercancel", lache);
    return { place(nx, ny, extra) { x = nx; y = ny; pos(g, nx, ny, extra); } };
  }
  function tapoter(g, faire) {
    let fait = false; const go = () => { if (fait) return; fait = true; faire(); };
    g.addEventListener("click", go); return go;
  }
  // GESTE CIRCULAIRE : l'objet suit l'angle du doigt autour de son centre.
  // Angle cumulé (sans saut à ±180°), capture du pointeur sur le <svg> (le doigt peut sortir de l'objet),
  // zone morte au centre (atan2 instable). Un simple appui ne fait rien tourner : balaye ≈ 0°.
  // o = { centre() → {x,y} (coord. svg), angle(cumul, delta), fin(cumul, balaye), debut(), bloque(), mort }
  function rotation(svg, zone, o) {
    let g = null;
    zone.addEventListener("pointerdown", e => {
      if (g || (o.bloque && o.bloque())) return;
      const c = o.centre(), p = pt(svg, e), loin = Math.hypot(p.x - c.x, p.y - c.y) >= (o.mort || 8);
      g = { c, a: loin ? Math.atan2(p.y - c.y, p.x - c.x) : null, cumul: 0, balaye: 0, id: e.pointerId };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* rien */ }
      e.preventDefault(); if (o.debut) o.debut();
    });
    svg.addEventListener("pointermove", e => {
      if (!g || e.pointerId !== g.id) return;
      const p = pt(svg, e), dx = p.x - g.c.x, dy = p.y - g.c.y;
      if (Math.hypot(dx, dy) < (o.mort || 8)) return;
      const a = Math.atan2(dy, dx); if (g.a === null) { g.a = a; return; }
      let d = (a - g.a) * 180 / Math.PI; if (d > 180) d -= 360; if (d < -180) d += 360;
      g.a = a; g.cumul += d; g.balaye += Math.abs(d); o.angle(g.cumul, d);
    });
    const fin = e => {
      if (!g || e.pointerId !== g.id) return; const r = g; g = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (err) { /* rien */ }
      o.fin(r.cumul, r.balaye);
    };
    svg.addEventListener("pointerup", fin); svg.addEventListener("pointercancel", fin);
  }
  // indice animé : rond pointillé + flèche + doigt fantôme qui tourne autour du centre
  const indiceRond = (r, couleur) => '<g class="indice-rond" pointer-events="none"><circle r="' + r + '" fill="none" stroke="' + couleur + '" stroke-width="3.5" stroke-dasharray="7 8" opacity=".75"/>' +
    '<circle class="progres" r="' + r + '" fill="none" stroke="#2fbf71" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" transform="rotate(-90)"/>' +
    '<path d="M' + (r - 9) + ' -10 l9 12 l9 -12" fill="none" stroke="' + couleur + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<g class="orbite"><g transform="translate(0 ' + (-r) + ')"><circle r="13" fill="rgba(255,255,255,.75)" stroke="' + couleur + '" stroke-width="2.5"/><text y="7" text-anchor="middle" font-size="18" font-family="system-ui,sans-serif">👆</text></g></g></g>';

  /* ---------------- SERVIETTE : glisser jusqu'au porte-serviettes ---------------- */
  function serviette(o, cfg) {
    const c = o.couleur || "#ff8a5c", A = [262, 74];
    const svg = '<rect width="360" height="300" fill="#e8f4f6"/>' + carreaux(0, 228) + sol(cfg.palette, 228) +
      '<g class="zone-accroche"><rect class="indice-pulse" x="196" y="58" width="132" height="128" rx="16" fill="rgba(255,255,255,.35)" stroke="' + cfg.accent + '" stroke-width="3.5" stroke-dasharray="9 7"/>' +
      '<text x="262" y="176" text-anchor="middle" font-size="13" font-weight="800" fill="#2f5966" font-family="system-ui,sans-serif">accroche-la ici</text></g>' +
      '<rect x="198" y="64" width="9" height="24" rx="3" fill="#8aa0ad"/><rect x="317" y="64" width="9" height="24" rx="3" fill="#8aa0ad"/>' +
      '<rect x="192" y="68" width="140" height="10" rx="5" fill="#c9d6dd" stroke="#8aa0ad" stroke-width="2"/>' +
      '<g class="pendue" transform="translate(' + A[0] + ' ' + A[1] + ')" opacity="0"><g class="balancier">' +
      '<path d="M-46 -2 h92 v104 q-46 10 -92 0z" fill="' + c + '"/><path d="M-46 72 h92 M-46 80 h92" stroke="#fff" stroke-width="4" opacity=".75"/>' +
      '<rect x="-48" y="-8" width="96" height="16" rx="7" fill="' + c + '"/><rect x="-48" y="-8" width="96" height="16" rx="7" fill="rgba(0,0,0,.16)"/></g></g>' +
      '<text class="consigne-svg" x="96" y="200" text-anchor="middle" font-size="13" font-weight="800" fill="#2f5966" font-family="system-ui,sans-serif">👆 glisse-moi !</text>' +
      '<path class="fleche-act" d="M126 196 q60 -10 70 -84" fill="none" stroke="' + cfg.accent + '" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round"/>' +
      '<g class="obj act-drag" data-act-drag="serviette"><g class="obj-in"><g transform="scale(1.5)">' + Obj.serviette("avant", c) + '</g></g>' + cible(48) + '</g>' +
      fete(A[0], 120);
    return {
      svg, init(el, api) {
        const g = el.querySelector(".act-drag"), pendue = el.querySelector(".pendue"), zone = el.querySelector(".zone-accroche");
        let fini = false;
        const reussi = () => {
          if (fini) return; fini = true; g.style.opacity = "0"; g.style.pointerEvents = "none"; zone.style.opacity = "0";
          el.querySelector(".consigne-svg").style.opacity = "0"; el.querySelector(".fleche-act").style.opacity = "0";
          pendue.setAttribute("opacity", "1"); pendue.classList.add("suspend"); S().ramasse(); vibre([20, 40, 30]); api.fini();
        };
        glisser(el, g, {
          x: 96, y: 246, zones: [{ x: A[0], y: A[1] + 46, r: 92 }], bloque: () => fini,
          survol: z => zone.classList.toggle("proche", !!z),
          lache: () => { reussi(); },
          rate: bouge => api.say(bouge ? "Presque ! Amène la serviette jusqu'au porte-serviettes, dans le cadre en pointillés." : "Garde le doigt appuyé sur la serviette et fais-la glisser jusqu'au porte-serviettes 👆")
        });
        bouton(g, "Suspendre la serviette sur le porte-serviettes", reussi);
      }
    };
  }

  /* ---------------- LAMPE : appuyer, la pièce s'assombrit ---------------- */
  function lampe(o, cfg) {
    const etoiles = [[40, 54], [62, 70], [86, 50], [118, 74], [52, 88], [150, 58], [104, 92]].map(([x, y], i) => '<circle class="scintille" style="animation-delay:-' + (i * .37).toFixed(2) + 's" cx="' + x + '" cy="' + y + '" r="' + (i % 3 ? 1.6 : 2.4) + '" fill="#fff"/>').join("");
    const svg = '<svg x="0" y="0" width="360" height="300" viewBox="10 30 300 250">' + Obj.chambre(cfg.palette, cfg.vue) +
      '<rect class="nuit" x="0" y="0" width="360" height="440" fill="#0b1640" opacity="0"/>' +
      '<g class="ciel-nuit" opacity="0"><rect x="28" y="42" width="140" height="120" fill="#16285f"/><rect x="28" y="110" width="140" height="52" fill="#0f3550"/>' +
      '<path d="M120 112 h18 M114 122 h30 M122 132 h14" stroke="#ffe9a8" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>' + etoiles +
      '<circle cx="130" cy="72" r="13" fill="#fff3c4"/><circle cx="125" cy="69" r="3" fill="#ead9a0"/><circle cx="135" cy="77" r="2" fill="#ead9a0"/>' +
      '<path d="M98 42 v120" stroke="' + cfg.palette.bois + '" stroke-width="5"/></g>' +
      '<g class="zzz" opacity="0" font-family="system-ui,sans-serif" font-weight="900" fill="#cfe0ff"><text x="262" y="236" font-size="16">z</text><text x="274" y="222" font-size="20">z</text><text x="290" y="204" font-size="24">Z</text></g>' +
      '<g class="obj act-tap" data-act-tap="lampe" transform="translate(177 236)"><g class="obj-in lampe-dessin"><g transform="scale(1.15)">' + Obj.lampe("avant") + '</g></g>' + cible(40) + '</g>' +
      '<g class="appuie" transform="translate(206 196)"><text font-size="13" font-weight="800" fill="#7a5a12" font-family="system-ui,sans-serif">👆 appuie !</text></g>' +
      fete(177, 214) + '</svg>';
    return {
      svg, init(el, api) {
        const g = el.querySelector(".act-tap");
        const faire = tapoter(g, () => {
          S().tap(); vibre(25);
          g.querySelector(".lampe-dessin").innerHTML = '<g transform="scale(1.15)">' + Obj.lampe("eteinte") + '</g>';
          el.querySelector(".appuie").style.opacity = "0";
          el.querySelector(".nuit").style.opacity = ".62"; el.querySelector(".ciel-nuit").style.opacity = "1";
          setTimeout(() => { el.querySelector(".zzz").style.opacity = "1"; S().doux(); }, 900);
          setTimeout(() => api.fini(), 1100);
        });
        bouton(g, "Éteindre la lampe", faire);
      }
    };
  }

  /* ---------------- ROBINET / DOUCHE : tourner avec le doigt pour fermer ----------------
     La poignée suit le doigt (geste circulaire). Environ un tour (330°) ferme l'eau :
     les gouttes ralentissent puis s'arrêtent, l'anneau vert se remplit. Clavier : flèches = un quart de tour, Entrée = fermer. */
  const TOUR = 330;
  function poignee(x, y, label, ly, lx) {
    return '<g class="obj act-tourne" data-act-tourne="poignee" transform="translate(' + x + ' ' + y + ')"><circle class="cible zone-tourne" r="76"/>' +
      indiceRond(48, "#2f7fb5") +
      '<g class="tourne-poignee"><circle r="20" fill="#9fb4c0" stroke="#6d8593" stroke-width="3"/>' +
      '<rect x="-30" y="-7" width="60" height="14" rx="7" fill="#7f97a5"/><circle r="6" fill="#dfe8ec"/></g>' +
      '<text class="label-tourne" x="' + (lx || 0) + '" y="' + (ly || 72) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#2f5966" font-family="system-ui,sans-serif">' + label + '</text></g>';
  }
  function fermer(svgEau, px, py, label, fx, fy, ly, lx) {
    return {
      svg: svgEau + poignee(px, py, label, ly, lx) + fete(fx, fy),
      init(el, api) {
        const g = el.querySelector(".act-tourne"), h = g.querySelector(".tourne-poignee"), prog = g.querySelector(".progres"), ind = g.querySelector(".indice-rond");
        const eau = Array.from(el.querySelectorAll(".eau-coule")), anims = () => eau.flatMap(e => [e, ...e.querySelectorAll("*")]).flatMap(e => e.getAnimations ? e.getAnimations() : []);
        let total = 0, fini = false, quart = 0;
        const montre = a => {
          h.style.transform = "rotate(" + a + "deg)";
          const p = Math.min(1, Math.abs(a) / TOUR);
          prog.setAttribute("stroke-dasharray", (p * 100).toFixed(1) + " 100");
          eau.forEach(e => e.style.opacity = String(1 - .55 * p));
          anims().forEach(an => { try { an.playbackRate = Math.max(.12, 1 - .88 * p); } catch (err) { /* rien */ } });
          const q = Math.trunc(a / 90); if (q !== quart) { quart = q; S().tap(); vibre(10); }
          return p;
        };
        const ferme = () => {
          if (fini) return; fini = true; g.classList.remove("tenu"); g.style.pointerEvents = "none";
          h.style.transform = "rotate(" + (total >= 0 ? 360 : -360) + "deg)"; prog.setAttribute("stroke-dasharray", "100 0");
          ind.style.opacity = "0"; el.querySelector(".label-tourne").style.opacity = "0";
          eau.forEach(e => { e.style.opacity = "0"; e.classList.add("stop"); });
          S().tap(); vibre([15, 30, 15]);
          setTimeout(() => S().bulle(), 500); setTimeout(() => api.fini(), 900);
        };
        rotation(el, g, {
          centre: () => ({ x: px, y: py }), mort: 10, bloque: () => fini,
          debut: () => { g.classList.add("tenu"); },
          angle: c => { if (montre(total + c) >= 1) ferme(); },
          fin: (c, balaye) => {
            if (fini) return; g.classList.remove("tenu"); total += c; montre(total);
            if (balaye < 25) api.say("Fais tourner avec ton doigt : pose-le sur la poignée et dessine un grand rond ↻");
            else api.say("Ça ralentit… continue de tourner, encore un peu ! ↻");
          }
        });
        bouton(g, label + " (flèches : un quart de tour, Entrée : fermer)", ferme);
        g.addEventListener("keydown", e => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault(); total += (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -90 : 90; if (montre(total) >= 1) ferme();
        });
      }
    };
  }
  function robinet(o, cfg) {
    const gouttes = [0, 1, 2].map(i => '<path class="goutte-chute" style="animation-delay:-' + (i * .3) + 's" d="M208 150 q5 8 0 12 q-5 -4 0 -12z" fill="#3aa7ff"/>').join("");
    const svg = '<rect width="360" height="300" fill="#e8f4f6"/>' + carreaux(0, 300) +
      '<rect x="110" y="10" width="140" height="92" rx="12" fill="#dff3f7" stroke="#b9d3db" stroke-width="3"/><path d="M128 30 l20 -12 M136 48 l34 -22" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
      '<rect x="40" y="168" width="280" height="16" rx="7" fill="#f2f8fa" stroke="#b9d3db" stroke-width="2.5"/>' +
      '<path d="M62 184 h236 l-16 44 a16 16 0 0 1 -16 12 h-172 a16 16 0 0 1 -16 -12z" fill="#fff" stroke="#b9d3db" stroke-width="2.5"/><ellipse cx="180" cy="214" rx="70" ry="10" fill="#e6f2f6"/>' +
      '<path d="M186 168 v-36 q0 -14 14 -14 h18 v16 h-8 v34z" fill="#9fb4c0" stroke="#6d8593" stroke-width="2"/>' +
      '<g class="eau-coule"><rect class="filet" x="205" y="150" width="7" height="58" rx="3.5" fill="#3aa7ff" opacity=".75"/>' + gouttes + '<ellipse class="filet" cx="208" cy="210" rx="14" ry="3.5" fill="#9fd8ff"/></g>' +
      '<g transform="translate(286 150)"><path d="M-12 -18 h24 l-3 34 h-18z" fill="rgba(200,230,240,.8)" stroke="#9cc7d9" stroke-width="2"/><rect x="-2" y="-46" width="5" height="40" rx="2.5" fill="' + cfg.accent + '" transform="rotate(10)"/><rect x="-6" y="-56" width="12" height="12" rx="3" fill="#fff" stroke="#c9dfe4" transform="rotate(10)"/></g>';
    return fermer(svg, 112, 134, "fais tourner avec ton doigt", 208, 190, -60);
  }
  function douche(o, cfg) {
    const filets = [0, 1, 2, 3, 4, 5].map(i => '<rect class="goutte-pluie" style="animation-delay:-' + (i * .17).toFixed(2) + 's" x="' + (196 + i * 14) + '" y="80" width="4" height="22" rx="2" fill="#3aa7ff"/>').join("");
    const notes = ["♪", "♫", "♪"].map((n, i) => '<text class="note-chante" style="animation-delay:-' + (i * .8) + 's" x="' + (150 + i * 22) + '" y="120" font-size="22" font-weight="900" fill="#7a5ad1" font-family="system-ui,sans-serif">' + n + '</text>').join("");
    const svg = '<rect width="360" height="300" fill="#e8f4f6"/>' + carreaux(0, 300) +
      '<path d="M330 10 v26 q0 10 -10 10 h-46" fill="none" stroke="#7f97a5" stroke-width="8" stroke-linecap="round"/><path d="M196 52 h104 l-12 18 h-80z" fill="#9fb4c0" stroke="#6d8593" stroke-width="2"/>' +
      '<g class="eau-coule">' + filets + '<g>' + notes + '</g></g>' +
      '<rect x="160" y="250" width="180" height="16" rx="6" fill="#dfe8ec" stroke="#b9c9d2" stroke-width="2"/><ellipse cx="250" cy="250" rx="70" ry="6" fill="#bfe6ff" class="eau-coule"/>';
    return fermer(svg, 92, 160, "fais tourner avec ton doigt", 248, 150, 74, 22);
  }

  /* ---------------- CARAFE : la verser dans le verre ---------------- */
  function carafe(o, cfg) {
    const V = [262, 196];
    const svg = '<rect width="360" height="300" fill="' + cfg.palette.mur + '"/>' + sol(cfg.palette, 262) +
      '<rect x="14" y="224" width="332" height="14" rx="6" fill="' + cfg.palette.bois + '"/><rect x="30" y="238" width="10" height="34" fill="' + cfg.palette.bois + '"/><rect x="320" y="238" width="10" height="34" fill="' + cfg.palette.bois + '"/>' +
      '<g class="zone-accroche"><circle class="indice-pulse" cx="' + V[0] + '" cy="' + (V[1] - 16) + '" r="58" fill="rgba(255,255,255,.3)" stroke="' + cfg.accent + '" stroke-width="3.5" stroke-dasharray="9 7"/></g>' +
      '<g transform="translate(' + V[0] + ' ' + V[1] + ')"><path class="verre-eau" d="M-19 -6 h38 l-3.6 32 h-30.8z" fill="#5cc4f2" opacity=".85"/><path d="M-24 -34 h48 l-6 62 h-36z" fill="rgba(220,240,250,.45)" stroke="#9cc7d9" stroke-width="3"/><path d="M-14 -26 v40" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/></g>' +
      '<text x="' + V[0] + '" y="252" text-anchor="middle" font-size="13" font-weight="800" fill="#5a4a2a" font-family="system-ui,sans-serif">ton verre</text>' +
      '<path class="filet-verse" d="M274 96 q-4 40 -12 92" fill="none" stroke="#5cc4f2" stroke-width="7" stroke-linecap="round" opacity="0"/>' +
      '<text class="consigne-svg" x="98" y="70" text-anchor="middle" font-size="13" font-weight="800" fill="#5a4a2a" font-family="system-ui,sans-serif">👆 glisse la carafe vers le verre</text>' +
      '<g class="obj act-drag" data-act-drag="carafe"><g class="obj-in carafe-in"><path d="M-22 -52 h28 l-2 10 q24 14 24 46 v26 q0 8 -8 8 h-48 q-8 0 -8 -8 v-26 q0 -32 24 -46z" fill="rgba(220,240,250,.6)" stroke="#9cc7d9" stroke-width="3"/>' +
      '<path d="M6 -52 l14 -8 l-4 14" fill="rgba(220,240,250,.6)" stroke="#9cc7d9" stroke-width="3" stroke-linejoin="round"/>' +
      '<path class="carafe-eau" d="M-31 -2 q15 -6 30 0 q15 5 30 0 v22 q0 6 -6 6 h-48 q-6 0 -6 -6z" fill="#5cc4f2" opacity=".85"/><path d="M-18 -30 v40" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/></g>' + cible(52) + '</g>' +
      fete(V[0], V[1] - 20);
    return {
      svg, init(el, api) {
        const g = el.querySelector(".act-drag"), zone = el.querySelector(".zone-accroche");
        let fini = false, d;
        const reussi = () => {
          if (fini) return; fini = true; g.style.pointerEvents = "none"; zone.style.opacity = "0"; el.querySelector(".consigne-svg").style.opacity = "0";
          g.classList.add("revient"); d.place(222, 112, " rotate(52deg)"); vibre([15, 30, 15]);
          setTimeout(() => { el.querySelector(".filet-verse").style.opacity = "1"; el.querySelector(".verre-eau").classList.add("plein"); el.querySelector(".carafe-eau").classList.add("vide"); S().plouf(); }, 450);
          setTimeout(() => { el.querySelector(".filet-verse").style.opacity = "0"; d.place(150, 176, ""); }, 1900);
          setTimeout(() => api.fini(), 2200);
        };
        d = glisser(el, g, {
          x: 92, y: 176, zones: [{ x: 226, y: 120, r: 84 }, { x: V[0], y: V[1] - 30, r: 70 }], bloque: () => fini,
          survol: z => zone.classList.toggle("proche", !!z), lache: () => { reussi(); },
          rate: bouge => api.say(bouge ? "Encore un peu ! Amène la carafe juste au-dessus du verre." : "Garde le doigt sur la carafe et glisse-la vers le verre 👆")
        });
        bouton(g, "Verser la carafe dans le verre", reussi);
      }
    };
  }

  /* ---------------- TRI : chaque déchet dans le bon bac ---------------- */
  const BACS = { jaune: ["#ffd34d", "#e6b52a", "#3a2a00"], vert: ["#4fae6b", "#3d8f56", "#fff"], marron: ["#9a6b3f", "#7c5330", "#fff"], gris: ["#8d9aa3", "#6f7c85", "#fff"] };
  function tri(o, cfg) {
    const T = o.tri || { bacs: [{ id: "emb", nom: "Emballages", c: "jaune" }, { id: "eplu", nom: "Épluchures", c: "marron" }], dechets: [{ obj: "bouteille", nom: "bouteille", bac: "emb" }, { obj: "emballage", nom: "papier de bonbon", bac: "emb" }, { obj: "epluchure", nom: "épluchure", bac: "eplu" }] };
    const nb = T.bacs.length, bx = i => nb === 1 ? 180 : 70 + i * (220 / (nb - 1)), dx = i => 60 + i * (240 / Math.max(1, T.dechets.length - 1));
    let svg = '<rect width="360" height="300" fill="' + cfg.palette.mur + '"/>' + sol(cfg.palette, 168) +
      '<text x="180" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="#4a3a1a" font-family="system-ui,sans-serif">👆 glisse chaque déchet dans le bon bac</text>';
    T.bacs.forEach((b, i) => {
      const k = BACS[b.c] || BACS.gris;
      svg += '<g class="bac" data-bac="' + b.id + '" transform="translate(' + bx(i) + ' 238)"><rect x="-46" y="-40" width="92" height="88" rx="10" fill="' + k[0] + '"/><rect class="couvercle" x="-50" y="-52" width="100" height="14" rx="6" fill="' + k[1] + '"/>' +
        '<text y="0" text-anchor="middle" font-size="13" font-weight="900" fill="' + k[2] + '" font-family="system-ui,sans-serif">' + b.nom.split(" ").slice(0, 2).join(" ") + '</text>' +
        (b.nom.split(" ").length > 2 ? '<text y="16" text-anchor="middle" font-size="13" font-weight="900" fill="' + k[2] + '" font-family="system-ui,sans-serif">' + b.nom.split(" ").slice(2).join(" ") + '</text>' : "") +
        '<text class="compte-bac" y="36" text-anchor="middle" font-size="16" font-weight="900" fill="' + k[2] + '" font-family="system-ui,sans-serif"></text></g>';
    });
    T.dechets.forEach((d, i) => {
      svg += '<g class="obj act-drag dechet" data-i="' + i + '" data-bac="' + d.bac + '"><g class="obj-in"><g transform="scale(1.45)">' + Obj[d.obj]() + '</g></g>' +
        '<text y="44" text-anchor="middle" font-size="12" font-weight="800" fill="#4a3a1a" font-family="system-ui,sans-serif">' + d.nom + '</text>' + cible(34) + '</g>';
    });
    svg += fete(180, 120);
    return {
      svg, init(el, api) {
        let ranges = 0, fini = false;
        const zones = T.bacs.map((b, i) => ({ x: bx(i), y: 236, r: 62, id: b.id }));
        el.querySelectorAll(".dechet").forEach((g, i) => {
          const D = T.dechets[i], home = [dx(i), 86];
          let ok = false;
          const range = z => {
            if (ok) return; ok = true; ranges++; g.style.pointerEvents = "none"; g.removeAttribute("tabindex");
            g.classList.add("revient"); pos(g, z.x, z.y - 30, " scale(.25)"); g.style.opacity = "0";
            const bac = el.querySelector('.bac[data-bac="' + z.id + '"]'); bac.classList.remove("hop"); void bac.getBBox(); bac.classList.add("hop");
            S().ramasse(); vibre(20);
            if (ranges === T.dechets.length) { fini = true; setTimeout(() => api.fini(), 600); }
            else api.say("Bien vu ! Encore " + (T.dechets.length - ranges) + " déchet" + (T.dechets.length - ranges > 1 ? "s" : "") + " à trier.");
          };
          glisser(el, g, {
            x: home[0], y: home[1], zones, bloque: () => ok || fini,
            lache: z => { if (z.id !== D.bac) { S().ko(); vibre(40); const b = T.bacs.find(x => x.id === D.bac); api.say("Pas ce bac-là ! " + (D.aide || ("Ce déchet va dans le bac « " + b.nom + " ».")) ); return false; } range(z); },
            rate: (bouge, z) => { if (!bouge) api.say("Garde le doigt dessus et glisse-le jusqu'au bon bac 👆"); }
          });
          bouton(g, "Mettre « " + D.nom + " » dans le bac " + T.bacs.find(x => x.id === D.bac).nom, () => range(zones.find(z => z.id === D.bac)));
        });
      }
    };
  }

  /* ---------------- CLIM : ouvrir la fenêtre, la clim se met en pause ---------------- */
  function clim(o, cfg) {
    const svg = '<rect width="360" height="300" fill="' + cfg.palette.mur + '"/>' +
      '<g transform="translate(180 40)"><rect x="-110" y="-26" width="220" height="50" rx="12" fill="#f4f7f9" stroke="#c4d0d8" stroke-width="3"/><rect x="-96" y="10" width="192" height="5" rx="2.5" fill="#c4d0d8"/>' +
      '<circle class="led-clim" cx="88" cy="-10" r="5" fill="#2fbf71"/><text class="pause-clim" x="-90" y="-2" font-size="13" font-weight="900" fill="#5a6a74" opacity="0" font-family="system-ui,sans-serif">⏸ en pause</text>' +
      '<g class="souffle" fill="none" stroke="#7cc6ff" stroke-width="3.5" stroke-linecap="round">' + [-60, -20, 20, 60].map((x, i) => '<path class="souffle-l" style="animation-delay:-' + (i * .3) + 's" d="M' + x + ' 30 q8 10 0 20 q-8 10 0 20"/>').join("") + '</g></g>' +
      '<rect x="72" y="118" width="216" height="150" rx="8" fill="' + cfg.palette.bois + '"/>' +
      '<svg x="80" y="126" width="200" height="134" viewBox="0 0 140 120" preserveAspectRatio="xMidYMid slice">' + cfg.vue + '</svg>' +
      '<g class="brise" opacity="0" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path class="souffle-l" d="M110 160 q30 -10 60 0 t60 0"/><path class="souffle-l" style="animation-delay:-.5s" d="M120 200 q30 -10 60 0 t60 0"/></g>' +
      '<g class="obj act-tap" data-act-tap="fenetre"><g class="battant"><rect x="180" y="126" width="100" height="134" fill="rgba(210,236,246,.88)" stroke="' + cfg.palette.bois + '" stroke-width="5"/><rect x="190" y="186" width="7" height="22" rx="3" fill="#8a6440"/></g>' +
      '<g class="battant-g"><rect x="80" y="126" width="100" height="134" fill="rgba(210,236,246,.88)" stroke="' + cfg.palette.bois + '" stroke-width="5"/></g>' +
      '<text class="consigne-svg" x="180" y="292" text-anchor="middle" font-size="13" font-weight="800" fill="#4a3a1a" font-family="system-ui,sans-serif">👆 appuie sur la fenêtre pour l\'ouvrir</text>' +
      '<rect class="cible" x="72" y="118" width="216" height="150"/></g>' + fete(180, 60);
    return {
      svg, init(el, api) {
        const g = el.querySelector(".act-tap");
        const faire = tapoter(g, () => {
          S().tap(); vibre(20);
          g.querySelector(".battant").classList.add("ouvert"); g.querySelector(".battant-g").classList.add("ouvert"); el.querySelector(".consigne-svg").style.opacity = "0";
          setTimeout(() => { el.querySelector(".brise").style.opacity = "1"; el.querySelector(".led-clim").setAttribute("fill", "#c4d0d8"); el.querySelector(".souffle").style.opacity = "0"; el.querySelector(".pause-clim").setAttribute("opacity", "1"); S().doux(); }, 600);
          setTimeout(() => api.fini(), 1300);
        });
        bouton(g, "Ouvrir la fenêtre", faire);
      }
    };
  }

  const SCENES = { serviette, lampe, robinet, douche, carafe, tri, clim };
  const CONSIGNES = {
    serviette: "Glisse la serviette avec ton doigt jusqu'au porte-serviettes 👆",
    lampe: "Appuie sur la lampe pour l'éteindre 💡",
    robinet: "Fais tourner la poignée avec ton doigt, en rond, pour fermer le robinet 🚰",
    douche: "Fais tourner le mitigeur avec ton doigt, en rond, pour couper la douche 🚿",
    carafe: "Glisse la carafe au-dessus du verre pour le remplir 💧",
    tri: "Glisse chaque déchet dans le bon bac ♻️",
    clim: "Ouvre la fenêtre et regarde bien la clim 🌬️"
  };
  window.Geste = { rotation, indiceRond, pt };
  window.Actions = {
    scene(o, cfg) { const f = SCENES[o.obj]; return f ? f(o, Object.assign({ accent: "#ff9f80" }, cfg, { accent: (cfg.palette && cfg.palette.accent) || "#ff9f80" })) : null; },
    consigne: o => o.consigne || CONSIGNES[o.obj] || "À toi de jouer !"
  };
})();
