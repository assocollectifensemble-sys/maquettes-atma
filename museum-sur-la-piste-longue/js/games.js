/* ============================================================
   GAMES.JS — Les aventures tactiles (doigt, souris, clavier).
   Étape 1 · L'énigme du Solitaire
     fouille()    : dégager au pinceau 5 os pris dans les sédiments
     squelette()  : remonter le squelette sur la silhouette, puis l'habiller
     legende()    : comparer le « dodo blanc » des tableaux et l'ibis des os
   Étape 2 · Les îles sœurs
     carte()      : placer chaque animal sur son île des Mascareignes
     temps()      : faire avancer le temps de 1600 à aujourd'hui
   Chaque jeu renvoie { destroy(), solve() } (solve = bouton « Résoudre » du mode démo).
   ============================================================ */
(function () {
  "use strict";
  const S = () => Audio2.Sfx;
  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgPt = (svg, x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(svg.getScreenCTM().inverse()); };

  // ---------- les 5 os (coordonnées du squelette monté, repère 400 × 320) ----------
  function capsule(x1, y1, x2, y2, w) {
    const l = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return '<rect x="' + x1 + '" y="' + (y1 - w / 2) + '" width="' + l.toFixed(1) + '" height="' + w + '" rx="' + w / 2 + '" transform="rotate(' + a.toFixed(1) + ' ' + x1 + ' ' + y1 + ')"/>';
  }
  const le = (a, b, n) => { const r = []; for (let i = 0; i <= n; i++) r.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return r; };
  const VERT = [[281, 88, -58], [273, 100, -55], [265, 111, -50], [257, 121, -45], [249, 131, -40], [241, 141, -35]];
  const OS = [
    { id: "crane", c: [318, 80], svg: '<ellipse cx="292" cy="72" rx="17" ry="13"/><path d="M305 66 C326 67 344 72 358 84 C344 81 326 79 305 80 Z"/><circle class="trou" cx="295" cy="69" r="4.6"/>',
      pts: [[292, 72], [282, 74], [300, 78], [310, 72], [318, 73], [328, 75], [338, 77], [348, 80], [355, 83]] },
    { id: "cou", c: [261, 114], svg: VERT.map(v => '<rect x="-8" y="-5.5" width="16" height="11" rx="4" transform="translate(' + v[0] + ' ' + v[1] + ') rotate(' + v[2] + ')"/>').join(""),
      pts: VERT.map(v => [v[0], v[1]]) },
    { id: "aile", c: [194, 146], svg: capsule(152, 138, 236, 154, 9) + '<circle cx="152" cy="138" r="8"/><circle cx="236" cy="154" r="7"/>',
      pts: le([152, 138], [236, 154], 7) },
    { id: "sternum", c: [204, 190], svg: '<path d="M168 170 L240 170 C242 186 228 204 204 212 C182 204 168 188 168 170 Z"/><path class="trou" d="M204 174 L204 208" stroke-width="3"/>',
      pts: [[180, 175], [198, 176], [222, 176], [234, 176], [204, 190], [192, 196], [216, 196], [204, 205]] },
    { id: "patte", c: [208, 262], svg: capsule(204, 214, 214, 262, 9) + capsule(214, 262, 206, 302, 7) + capsule(206, 302, 228, 308, 5) + capsule(206, 302, 186, 308, 5) + capsule(206, 302, 210, 314, 5) + '<circle cx="214" cy="262" r="6"/>',
      pts: le([204, 214], [214, 262], 4).concat(le([214, 262], [206, 302], 4)).concat([[222, 306], [192, 306]]) }
  ];
  const OSG = id => OS.find(o => o.id === id);
  // position des os dans la fouille (repère 400 × 300) : rotation autour du centre c puis translation
  const POSE = { crane: [-212, -12, -18], cou: [40, -48, 58], aile: [92, 70, -24], sternum: [-96, 16, 18], patte: [-8, -106, 68] };
  function poser(id, p) {
    const o = OSG(id), t = POSE[id], r = t[2] * Math.PI / 180, dx = p[0] - o.c[0], dy = p[1] - o.c[1];
    return [o.c[0] + dx * Math.cos(r) - dy * Math.sin(r) + t[0], o.c[1] + dx * Math.sin(r) + dy * Math.cos(r) + t[1]];
  }
  const trPose = id => { const t = POSE[id], o = OSG(id); return "translate(" + t[0] + " " + t[1] + ") rotate(" + t[2] + " " + o.c[0] + " " + o.c[1] + ")"; };

  // graine pseudo-aléatoire (le décor est le même à chaque partie)
  function hasard(g) { let x = g || 3; return () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }

  // ===================== FOUILLE : dégager les os au pinceau =====================
  function fouille(el, o) {
    o = o || {};
    const trouve = {}, ordre = OS.map(x => x.id);
    let fini = false, compteur = 0, dernierGrain = 0, actif = null, last = null;
    el.innerHTML = '<div class="fouille" data-jeu="fouille"><svg class="fo-os" viewBox="0 0 400 300" aria-hidden="true">' +
      '<defs><radialGradient id="foFond" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#d9c8a4"/><stop offset="1" stop-color="#b59d73"/></radialGradient></defs>' +
      '<rect width="400" height="300" fill="url(#foFond)"/>' + cailloux() +
      OS.map(b => '<g class="os-f" data-os="' + b.id + '" transform="' + trPose(b.id) + '">' + b.svg + '</g>').join("") + '</svg>' +
      '<canvas class="fo-sed" aria-hidden="true"></canvas><div class="fo-fx" aria-hidden="true"></div>' +
      '<div class="fo-etiquettes" aria-live="polite"></div></div>' +
      '<div class="fo-barre"><div class="fo-compte" aria-live="polite"><b>0</b> / 5 ' + (o.motOs || "os") + '</div>' +
      '<button class="btn mini sec" data-jeu-act="indice">' + (o.motIndice || "Un indice") + '</button></div>';
    const box = el.querySelector(".fouille"), cv = box.querySelector("canvas"), fx = box.querySelector(".fo-fx"), lab = box.querySelector(".fo-etiquettes");
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    let W = 0, H = 0, k = 1;
    function cailloux() {
      const r = hasard(5); let s = "";
      for (let i = 0; i < 26; i++) s += '<ellipse cx="' + (r() * 400).toFixed(0) + '" cy="' + (r() * 300).toFixed(0) + '" rx="' + (3 + r() * 9).toFixed(1) + '" ry="' + (2 + r() * 6).toFixed(1) + '" fill="#9c8660" opacity=".55"/>';
      return s;
    }
    function sediments() {
      const r = hasard(9);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#7a5c3c"); g.addColorStop(.5, "#6a4e33"); g.addColorStop(1, "#57402a");
      ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const couleurs = ["#8a6a45", "#5e4529", "#7d6040", "#94754d", "#4f3a26"];
      for (let i = 0; i < 9; i++) { // strates ondulées
        const y0 = (i + .5) * H / 9; ctx.beginPath(); ctx.moveTo(0, y0);
        for (let x = 0; x <= W; x += W / 8) ctx.lineTo(x, y0 + (r() - .5) * H * .05);
        ctx.lineWidth = H * (.012 + r() * .03); ctx.strokeStyle = couleurs[i % 5]; ctx.globalAlpha = .55; ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 420; i++) { ctx.fillStyle = r() > .5 ? "rgba(255,240,210,.12)" : "rgba(30,20,10,.18)"; ctx.fillRect(r() * W, r() * H, 1.5 * k, 1.5 * k); }
      for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(r() * W, r() * H, (4 + r() * 10) * k, (3 + r() * 6) * k, r() * 3, 0, 7); ctx.fillStyle = "rgba(160,135,100,.55)"; ctx.fill(); }
      for (let i = 0; i < 5; i++) { // racines
        ctx.beginPath(); let x = r() * W, y = 0; ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) { x += (r() - .5) * 40 * k; y += H / 10; ctx.lineTo(x, y); }
        ctx.lineWidth = 1.4 * k; ctx.strokeStyle = "rgba(40,28,16,.45)"; ctx.stroke();
      }
    }
    function taille() {
      const w = box.clientWidth, h = Math.round(w * .75), d = Math.min(2, window.devicePixelRatio || 1);
      if (!w || (cv.width === Math.round(w * d))) return;
      cv.width = Math.round(w * d); cv.height = Math.round(h * d); W = cv.width; H = cv.height; k = W / 400;
      sediments(); OS.forEach(b => { if (trouve[b.id]) degage(b.id); });
    }
    function degage(id) { // efface tout autour d'un os trouvé (et pour le mode « Résoudre »)
      ctx.globalCompositeOperation = "destination-out"; ctx.globalAlpha = 1; ctx.lineCap = "round"; ctx.lineWidth = 30 * k; ctx.strokeStyle = "#000";
      const pts = OSG(id).pts.map(p => poser(id, p));
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] * k, p[1] * k) : ctx.moveTo(p[0] * k, p[1] * k)); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    function brosse(x, y) {
      ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 26 * k;
      ctx.beginPath(); ctx.moveTo((last ? last[0] : x) * k, (last ? last[1] : y) * k); ctx.lineTo(x * k + .1, y * k); ctx.stroke();
      ctx.globalCompositeOperation = "source-over"; last = [x, y];
    }
    function grain(px, py) {
      const t = performance.now(); if (reduit() || t - dernierGrain < 45) return; dernierGrain = t;
      const g = document.createElement("i"); g.style.left = px + "px"; g.style.top = py + "px";
      g.style.setProperty("--dx", ((Math.random() - .5) * 60).toFixed(0) + "px"); g.style.setProperty("--dy", (-10 - Math.random() * 40).toFixed(0) + "px");
      fx.appendChild(g); setTimeout(() => g.remove(), 700);
    }
    function verifie() {
      if (fini) return;
      const img = ctx.getImageData(0, 0, W, H).data;
      OS.forEach(b => {
        if (trouve[b.id]) return;
        const pts = b.pts.map(p => poser(b.id, p)); let libres = 0;
        pts.forEach(p => { const x = Math.min(W - 1, Math.max(0, Math.round(p[0] * k))), y = Math.min(H - 1, Math.max(0, Math.round(p[1] * k))); if (img[(y * W + x) * 4 + 3] < 120) libres++; });
        if (libres / pts.length >= .62) decouvre(b.id);
      });
    }
    function decouvre(id) {
      if (trouve[id]) return; trouve[id] = true; degage(id);
      const g = box.querySelector('[data-os="' + id + '"]'); g.classList.add("trouve");
      const n = Object.keys(trouve).length, c = poser(id, OSG(id).c);
      const e = document.createElement("span"); e.className = "fo-lbl"; e.textContent = (o.noms && o.noms[id]) || id;
      e.style.left = (c[0] / 4) + "%"; e.style.top = (c[1] / 3) + "%"; lab.appendChild(e);
      el.querySelector(".fo-compte b").textContent = n;
      el.querySelectorAll(".fo-anneau").forEach(a => a.remove());
      S().decouverte(); Audio2.vibre(40);
      if (o.onOs) o.onOs(id, n);
      if (n === OS.length) { fini = true; setTimeout(() => o.onFin && o.onFin(), 1100); }
    }
    function pos(e) { const r = box.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 300, e.clientX - r.left, e.clientY - r.top]; }
    const down = e => { if (fini) return; actif = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (er) { } last = null; const p = pos(e); brosse(p[0], p[1]); S().unlock(); };
    const move = e => { if (actif !== e.pointerId || fini) return; e.preventDefault(); const p = pos(e); brosse(p[0], p[1]); grain(p[2], p[3]); S().pinceau(); if (++compteur % 5 === 0) verifie(); };
    const up = e => { if (actif !== e.pointerId) return; actif = null; last = null; verifie(); };
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    const indice = () => {
      const id = ordre.find(x => !trouve[x]); if (!id) return;
      box.querySelectorAll(".fo-anneau").forEach(a => a.remove());
      const c = poser(id, OSG(id).c), a = document.createElement("span"); a.className = "fo-anneau"; a.style.left = (c[0] / 4) + "%"; a.style.top = (c[1] / 3) + "%"; box.appendChild(a);
      S().tap();
    };
    el.querySelector('[data-jeu-act="indice"]').addEventListener("click", indice);
    const ro = new ResizeObserver(taille); ro.observe(box); taille();
    return {
      destroy() { ro.disconnect(); fini = true; },
      solve() { ordre.forEach((id, i) => setTimeout(() => decouvre(id), i * 180)); },
      trouves: () => Object.keys(trouve).length
    };
  }

  // ===================== SQUELETTE : remonter les os sur la silhouette =====================
  const SILHOUETTE = "M126 176 C120 140 160 122 214 124 C246 126 262 142 262 150 C254 132 262 104 276 86 C280 70 284 58 300 58 C312 58 318 66 320 74 C336 72 352 76 362 86 C346 84 332 86 318 88 C304 98 290 112 284 132 C276 160 268 188 244 204 C232 212 222 214 214 214 L216 262 L210 306 L230 310 L186 310 L204 302 L210 262 L204 214 C176 212 150 204 136 190 C116 196 98 198 86 192 C100 188 116 184 126 176 Z";
  // annotations façon planche de naturaliste, visibles une fois l'ibis « habillé » (faits M35, M36, M37)
  function annotations(a) {
    if (!a) return "";
    const n = (x1, y1, x2, y2, tx, ty, anc, t, i) => '<g class="sq-annot" style="transition-delay:' + (1.2 + i * .55) + 's"><path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '"/><circle cx="' + x1 + '" cy="' + y1 + '" r="3"/><text x="' + tx + '" y="' + ty + '" text-anchor="' + anc + '">' + t + '</text></g>';
    return n(348, 82, 360, 40, 392, 32, "end", a.bec, 0) + n(96, 214, 70, 132, 8, 122, "start", a.ailes, 1) + n(226, 252, 282, 248, 392, 252, "end", a.pattes, 2);
  }
  function squelette(el, o) {
    o = o || {};
    const place = {}; let choisi = null, fini = false, drag = null;
    const bbox = { crane: "270 54 90 50", cou: "226 76 66 80", aile: "140 126 106 40", sternum: "160 164 90 54", patte: "176 206 60 112" };
    el.innerHTML = '<div class="squelette" data-jeu="squelette"><svg class="sq-svg" viewBox="0 0 400 320" aria-label="Silhouette à compléter">' +
      '<path class="sq-ombre" d="' + SILHOUETTE + '"/>' +
      '<g class="sq-plumes" opacity="0"><g transform="translate(40 4) scale(2.25)">' + Art.solitaire("").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + '</g></g>' +
      OS.map(b => '<g class="sq-slot" data-slot="' + b.id + '" tabindex="-1" role="button" aria-label="' + ((o.noms && o.noms[b.id]) || b.id) + ' : emplacement">' + b.svg + '</g>').join("") +
      annotations(o.annot) + '</svg><div class="sq-bulle" aria-live="polite"></div></div>' +
      '<div class="sq-plateau" role="group" aria-label="Os à placer">' + OS.map(b => '<button class="sq-os" data-os="' + b.id + '" aria-label="' + ((o.noms && o.noms[b.id]) || b.id) + '"><svg viewBox="' + bbox[b.id] + '" aria-hidden="true"><g class="os-p">' + b.svg + '</g></svg><span>' + ((o.court && o.court[b.id]) || "") + '</span></button>').join("") + '</div>';
    const svg = el.querySelector(".sq-svg"), info = el.querySelector(".sq-bulle");
    // l'ibis « habillé » est dessiné à l'échelle du squelette : on cale ses plumes sur la silhouette
    function dire(t, cls) { info.textContent = t; info.className = "sq-bulle " + (cls || ""); }
    function poserOs(id, slot) {
      if (place[id] || fini) return false;
      if (slot !== id) { S().ko(); Audio2.vibre([30, 40, 30]); dire((o.rate && o.rate[id]) || "Essaie ailleurs !", "ko"); return false; }
      place[id] = true; S().os(); Audio2.vibre(25);
      svg.querySelector('[data-slot="' + id + '"]').classList.add("pose");
      const b = el.querySelector('.sq-os[data-os="' + id + '"]'); b.classList.add("utilise"); b.disabled = true;
      dire((o.bravo && o.bravo[id]) || "Bien vu !", "ok");
      choisi = null; el.querySelectorAll(".sq-os.choisi").forEach(x => x.classList.remove("choisi")); svg.classList.remove("attend");
      if (o.onPose) o.onPose(id);
      if (Object.keys(place).length === OS.length) { fini = true; setTimeout(() => o.onFin && o.onFin(), 700); }
      return true;
    }
    // glisser-déposer
    el.querySelectorAll(".sq-os").forEach(b => {
      b.addEventListener("pointerdown", e => {
        if (b.disabled || fini) return; S().unlock();
        const fant = b.cloneNode(true); fant.classList.add("fantome"); fant.removeAttribute("data-os"); document.body.appendChild(fant);
        const r = b.getBoundingClientRect();
        drag = { id: b.dataset.os, fant, ox: e.clientX - r.left, oy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, bouge: false, pid: e.pointerId, w: r.width };
        fant.style.width = r.width + "px"; fant.style.left = r.left + "px"; fant.style.top = r.top + "px";
        try { b.setPointerCapture(e.pointerId); } catch (er) { }
      });
      b.addEventListener("pointermove", e => {
        if (!drag || drag.pid !== e.pointerId) return;
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.bouge = true;
        drag.fant.style.left = (e.clientX - drag.ox) + "px"; drag.fant.style.top = (e.clientY - drag.oy) + "px";
        drag.fant.classList.toggle("visible", drag.bouge);
      });
      const fin = e => {
        if (!drag || drag.pid !== e.pointerId) return;
        const d = drag; drag = null; d.fant.remove();
        if (!d.bouge) return; // simple toucher : géré par « click »
        const p = svgPt(svg, e.clientX, e.clientY); let best = null, bd = 1e9;
        OS.forEach(s => { const dd = Math.hypot(p.x - s.c[0], p.y - s.c[1]); if (dd < bd) { bd = dd; best = s.id; } });
        if (bd < 70) poserOs(d.id, best); else dire(o.lacher || "Lâche l'os sur la silhouette.", "");
        b.dataset.glisse = "1"; setTimeout(() => { delete b.dataset.glisse; }, 50);
      };
      b.addEventListener("pointerup", fin); b.addEventListener("pointercancel", e => { if (drag) { drag.fant.remove(); drag = null; } });
      // toucher (ou clavier) : on choisit l'os, puis on touche son emplacement
      b.addEventListener("click", () => {
        if (b.dataset.glisse || b.disabled || fini) return;
        el.querySelectorAll(".sq-os.choisi").forEach(x => x.classList.remove("choisi"));
        choisi = b.dataset.os; b.classList.add("choisi"); svg.classList.add("attend"); S().tap();
        svg.querySelectorAll(".sq-slot:not(.pose)").forEach(s => s.setAttribute("tabindex", "0"));
        dire(o.choisi || "Touche maintenant le bon emplacement sur la silhouette.", "");
      });
    });
    svg.querySelectorAll(".sq-slot").forEach(s => {
      const act = () => { if (choisi) poserOs(choisi, s.dataset.slot); };
      s.addEventListener("click", act);
      s.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
    dire(o.depart || "", "");
    return {
      destroy() { if (drag) drag.fant.remove(); fini = true; },
      solve() { OS.forEach((b, i) => setTimeout(() => poserOs(b.id, b.id), i * 160)); },
      habiller() { // les plumes apparaissent par-dessus les os : l'ibis se révèle
        svg.classList.add("habille"); dire("", ""); S().vent(); setTimeout(() => S().decouverte(), 500);
      }
    };
  }

  // ===================== LÉGENDE : le tableau et les os, avec un volet à faire glisser =====================
  function legende(el, o) {
    o = o || {};
    let vu = { gauche: false, droite: false }, fini = false;
    el.innerHTML = '<div class="legende" data-jeu="legende"><div class="lg-cadre">' +
      '<div class="lg-vue lg-mythe"><div class="lg-tableau">' + Art.dodoBlanc("") + '</div><span class="lg-etq">' + (o.etqMythe || "") + '</span></div>' +
      '<div class="lg-vue lg-science"><div class="lg-planche">' + Art.solitaire("") + '</div><span class="lg-etq">' + (o.etqScience || "") + '</span></div>' +
      '<div class="lg-poignee" aria-hidden="true"><span>⟷</span></div></div>' +
      '<input class="lg-curseur" type="range" min="0" max="100" value="50" aria-label="' + (o.aria || "Comparer") + '">' + (o.note ? '<p class="lg-note">' + o.note + '</p>' : "") + '</div>';
    const cadre = el.querySelector(".lg-cadre"), r = el.querySelector(".lg-curseur");
    function maj(v) {
      if (fini) return;
      cadre.style.setProperty("--x", v + "%");
      if (v < 18) vu.droite = true; if (v > 82) vu.gauche = true;
      if (!fini && vu.gauche && vu.droite) { fini = true; S().decouverte(); setTimeout(() => { cadre.classList.add("revele"); cadre.style.setProperty("--x", "0%"); r.value = 0; }, 350); if (o.onFin) o.onFin(); }
    }
    r.addEventListener("input", () => { maj(+r.value); if (+r.value % 10 === 0) S().temps(); });
    // glisser directement sur l'image
    let act = false;
    const p = e => { const b = cadre.getBoundingClientRect(); const v = Math.max(0, Math.min(100, (e.clientX - b.left) / b.width * 100)); r.value = v; maj(v); };
    cadre.addEventListener("pointerdown", e => { act = true; try { cadre.setPointerCapture(e.pointerId); } catch (er) { } p(e); S().unlock(); });
    cadre.addEventListener("pointermove", e => { if (act) { e.preventDefault(); p(e); } });
    cadre.addEventListener("pointerup", () => { act = false; }); cadre.addEventListener("pointercancel", () => { act = false; });
    maj(50);
    if (!reduit()) { // petite invitation : le volet bouge tout seul une fois
      cadre.classList.add("invite"); setTimeout(() => cadre.classList.remove("invite"), 2600);
    }
    return { destroy() { fini = true; }, solve() { r.value = 5; maj(5); setTimeout(() => { r.value = 95; maj(95); }, 250); } };
  }

  // ===================== CARTE : chaque animal sur son île =====================
  const SLOTS = { reunion: [[44, 182], [112, 134], [180, 224]], maurice: [[268, 132]], rodrigues: [[340, 80]] };
  function mini(id, x, y, s) { return Art.ESPECES[id]("").replace("<svg ", '<svg x="' + (x - 80 * s) + '" y="' + (y - 70 * s) + '" width="' + 160 * s + '" height="' + 140 * s + '" '); }
  function carte(el, o) {
    o = o || {};
    const animaux = o.animaux; // [{id, ile, nom}]
    const place = {}, occupe = { reunion: 0, maurice: 0, rodrigues: 0 }; let choisi = null, drag = null, fini = false;
    el.innerHTML = '<div class="carte-jeu" data-jeu="carte">' + Art.carte() + '</div>' +
      '<div class="ca-bulle" aria-live="polite"></div>' +
      '<div class="ca-plateau" role="group" aria-label="Animaux à placer">' + animaux.map(a => '<button class="ca-carte" data-an="' + a.id + '"><span class="ca-art">' + Art.ESPECES[a.id]("") + '</span><span class="ca-nom">' + a.nom + '</span></button>').join("") + '</div>';
    const svg = el.querySelector("svg.carte"), info = el.querySelector(".ca-bulle"), couche = document.createElementNS("http://www.w3.org/2000/svg", "g");
    couche.setAttribute("class", "ca-poses"); svg.appendChild(couche);
    svg.querySelectorAll(".ile").forEach(g => { g.setAttribute("tabindex", "-1"); g.setAttribute("role", "button"); g.setAttribute("aria-label", Art.ILES[g.dataset.ile].nom); });
    const dire = (t, c) => { info.textContent = t; info.className = "ca-bulle " + (c || ""); };
    function poser(id, ile) {
      if (place[id] || fini) return;
      const a = animaux.find(x => x.id === id);
      if (a.ile !== ile) { S().ko(); Audio2.vibre([30, 40, 30]); dire((o.rate && o.rate(a, ile)) || "Essaie une autre île.", "ko"); svg.querySelector('[data-ile="' + ile + '"]').classList.add("non"); setTimeout(() => { const g = svg.querySelector('[data-ile="' + ile + '"]'); if (g) g.classList.remove("non"); }, 600); return; }
      place[id] = ile; const s = SLOTS[ile][occupe[ile]++] || SLOTS[ile][0];
      couche.insertAdjacentHTML("beforeend", '<g class="ca-pose" data-an="' + id + '">' + mini(id, s[0], s[1], .34) + '</g>');
      S().ok(); Audio2.vibre(30);
      const b = el.querySelector('.ca-carte[data-an="' + id + '"]'); b.classList.add("utilise"); b.disabled = true;
      dire((o.bravo && o.bravo(a)) || "Bravo !", "ok");
      choisi = null; svg.classList.remove("attend"); el.querySelectorAll(".ca-carte.choisi").forEach(x => x.classList.remove("choisi"));
      if (Object.keys(place).length === animaux.length) { fini = true; setTimeout(() => o.onFin && o.onFin(), 900); }
    }
    function ileSous(x, y) {
      const p = svgPt(svg, x, y); let best = null, bd = 1e9;
      Object.keys(Art.ILES).forEach(k => { const I = Art.ILES[k], d = Math.hypot(p.x - I.cx, p.y - I.cy); if (d < bd) { bd = d; best = k; } });
      return bd < 80 ? best : null;
    }
    el.querySelectorAll(".ca-carte").forEach(b => {
      b.addEventListener("pointerdown", e => {
        if (b.disabled || fini) return; S().unlock();
        const r = b.getBoundingClientRect(), f = b.cloneNode(true); f.classList.add("fantome"); f.removeAttribute("data-an"); document.body.appendChild(f);
        f.style.width = r.width + "px"; f.style.left = r.left + "px"; f.style.top = r.top + "px";
        drag = { id: b.dataset.an, f, ox: e.clientX - r.left, oy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, bouge: false, pid: e.pointerId };
        try { b.setPointerCapture(e.pointerId); } catch (er) { }
      });
      b.addEventListener("pointermove", e => {
        if (!drag || drag.pid !== e.pointerId) return;
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.bouge = true;
        drag.f.style.left = (e.clientX - drag.ox) + "px"; drag.f.style.top = (e.clientY - drag.oy) + "px"; drag.f.classList.toggle("visible", drag.bouge);
        svg.querySelectorAll(".ile").forEach(g => g.classList.toggle("survol", drag.bouge && g.dataset.ile === ileSous(e.clientX, e.clientY)));
      });
      b.addEventListener("pointerup", e => {
        if (!drag || drag.pid !== e.pointerId) return;
        const d = drag; drag = null; d.f.remove(); svg.querySelectorAll(".ile.survol").forEach(g => g.classList.remove("survol"));
        if (!d.bouge) return;
        const ile = ileSous(e.clientX, e.clientY); if (ile) poser(d.id, ile); else dire(o.lacher || "Lâche l'animal sur une île.", "");
        b.dataset.glisse = "1"; setTimeout(() => { delete b.dataset.glisse; }, 50);
      });
      b.addEventListener("pointercancel", () => { if (drag) { drag.f.remove(); drag = null; } });
      b.addEventListener("click", () => {
        if (b.dataset.glisse || b.disabled || fini) return;
        el.querySelectorAll(".ca-carte.choisi").forEach(x => x.classList.remove("choisi"));
        choisi = b.dataset.an; b.classList.add("choisi"); svg.classList.add("attend"); S().tap();
        svg.querySelectorAll(".ile").forEach(g => g.setAttribute("tabindex", "0"));
        dire(o.choisi || "Touche maintenant son île.", "");
      });
    });
    svg.querySelectorAll(".ile").forEach(g => {
      const act = () => { if (choisi) poser(choisi, g.dataset.ile); };
      g.addEventListener("click", act); g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    });
    dire(o.depart || "", "");
    return { destroy() { if (drag) drag.f.remove(); fini = true; }, solve() { animaux.forEach((a, i) => setTimeout(() => poser(a.id, a.ile), i * 150)); } };
  }

  // ===================== TEMPS : remonter le cours des siècles =====================
  function temps(el, o) {
    o = o || {};
    const ev = o.evenements.slice().sort((a, b) => a.an - b.an), DEB = o.debut || 1600, FIN = o.fin || 2026;
    const vus = new Set(); let attente = false, fini = false;
    const poses = (o.animaux || []).map(a => { const s = (SLOTS[a.ile] || [])[(o.animaux.filter(x => x.ile === a.ile).indexOf(a))] || [0, 0]; return '<g class="ca-pose" data-an="' + a.id + '">' + mini(a.id, s[0], s[1], .34) + '</g>'; }).join("");
    el.innerHTML = '<div class="temps' + (o.auto ? " auto" : "") + '" data-jeu="temps"><div class="carte-jeu">' + Art.carte().replace("</svg>", '<g class="ca-poses">' + poses + '</g><g class="tp-bateaux"></g></svg>') +
      '<div class="tp-annee" aria-live="polite"><small>' + (o.motAn || "an") + '</small><b>' + DEB + '</b></div></div>' +
      '<div class="tp-regle"><input type="range" class="tp-curseur" min="' + DEB + '" max="' + FIN + '" step="1" value="' + DEB + '" aria-label="' + (o.aria || "Faire avancer le temps") + '">' +
      '<div class="tp-graduations" aria-hidden="true">' + [1600, 1700, 1800, 1900, 2000].filter(a => a >= DEB && a <= FIN).map(a => '<span style="left:' + ((a - DEB) / (FIN - DEB) * 100) + '%">' + a + '</span>').join("") + '</div></div>' +
      '<div class="tp-fiche" hidden></div><ol class="tp-frise" aria-label="' + (o.motFrise || "Frise") + '"></ol></div>';
    const r = el.querySelector(".tp-curseur"), an = el.querySelector(".tp-annee b"), fiche = el.querySelector(".tp-fiche"), frise = el.querySelector(".tp-frise"), svg = el.querySelector("svg.carte"), bateaux = el.querySelector(".tp-bateaux");
    let dernierAn = DEB;
    // mode « auto » (version courte) : un seul geste, chaque date s'inscrit au passage du curseur
    function auto(e) {
      vus.add(e);
      if (e.animal) { const g = svg.querySelector('.ca-pose[data-an="' + e.animal + '"]'); if (g) g.classList.add("disparu"); S().vent(); }
      else if (e.bateau) { const I = Art.ILES[e.bateau]; bateaux.insertAdjacentHTML("beforeend", '<g class="tp-bateau" transform="translate(' + (I.cx + 30) + ' ' + (I.cy + 6) + ')"><path d="M-14 0 H14 L9 7 H-9 Z" fill="#6b4e33"/><path d="M0 0 V-20 M0 -19 L11 -6 H0" stroke="#3b2b1c" stroke-width="1.6" fill="#f3e9d2"/></g>'); S().page(); }
      else S().tampon();
      Audio2.vibre(20);
      fiche.hidden = false; fiche.className = "tp-fiche " + (e.animal ? "disparition" : "humains");
      fiche.innerHTML = '<span class="tp-f-an">' + (e.vers ? (o.motVers || "vers") + " " : "") + e.an + '</span><p>' + e.texte + '</p>' + (e.src ? '<small class="src">' + e.src + '</small>' : "");
      frise.insertAdjacentHTML("beforeend", '<li class="' + (e.animal ? "d" : "h") + '"><b>' + (e.vers ? "≈ " : "") + e.an + '</b> ' + e.court + '</li>');
    }
    function montre(e) {
      if (o.auto) return auto(e);
      vus.add(e); attente = true; r.disabled = true; r.value = e.an; an.textContent = (e.vers ? "≈ " : "") + e.an;
      if (e.animal) { const g = svg.querySelector('.ca-pose[data-an="' + e.animal + '"]'); if (g) g.classList.add("disparu"); S().vent(); }
      else if (e.bateau) { const I = Art.ILES[e.bateau]; bateaux.insertAdjacentHTML("beforeend", '<g class="tp-bateau" transform="translate(' + (I.cx + 30) + ' ' + (I.cy + 6) + ')"><path d="M-14 0 H14 L9 7 H-9 Z" fill="#6b4e33"/><path d="M0 0 V-20 M0 -19 L11 -6 H0" stroke="#3b2b1c" stroke-width="1.6" fill="#f3e9d2"/></g>'); S().page(); }
      fiche.hidden = false; fiche.className = "tp-fiche " + (e.animal ? "disparition" : "humains");
      fiche.innerHTML = '<span class="tp-f-an">' + (e.vers ? (o.motVers || "vers") + " " : "") + e.an + '</span><p>' + e.texte + '</p>' + (e.src ? '<small class="src">' + e.src + '</small>' : "") + '<button class="btn mini" data-jeu-act="noter">' + (o.motNoter || "Noter dans le carnet ✓") + '</button>';
      fiche.querySelector("button").addEventListener("click", note);
      setTimeout(() => { const b = fiche.querySelector("button"); if (b) { b.focus({ preventScroll: true }); fiche.scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "nearest" }); } }, 50);
    }
    function note() {
      const e = [...vus].pop();
      frise.insertAdjacentHTML("beforeend", '<li class="' + (e.animal ? "d" : "h") + '"><b>' + (e.vers ? "≈ " : "") + e.an + '</b> ' + e.court + '</li>');
      fiche.hidden = true; attente = false; r.disabled = false; S().tampon(); r.focus({ preventScroll: true });
      if (ev.every(x => vus.has(x)) && !fini) { r.value = FIN; maj(); }
    }
    function maj() {
      if (attente) return;
      const v = +r.value;
      if (Math.floor(v / 10) !== Math.floor(dernierAn / 10)) S().temps();
      dernierAn = v;
      if (o.auto) { ev.filter(e => !vus.has(e) && e.an <= v).forEach(auto); }
      else { const suivant = ev.find(e => !vus.has(e) && e.an <= v); if (suivant) return montre(suivant); }
      an.textContent = v;
      if (v >= FIN && ev.every(x => vus.has(x)) && !fini) { fini = true; r.disabled = true; svg.classList.add("aujourdhui"); if (o.auto) { fiche.hidden = true; el.querySelector(".temps").classList.add("fini"); } setTimeout(() => o.onFin && o.onFin(), 600); }
    }
    r.addEventListener("input", maj); r.addEventListener("change", maj);
    return {
      destroy() { fini = true; },
      solve() { const pas = () => { if (fini) return; if (attente) { note(); return setTimeout(pas, 120); } r.value = FIN; maj(); setTimeout(pas, 120); }; pas(); }
    };
  }

  window.Games = { fouille, squelette, legende, carte, temps, OS };
})();
