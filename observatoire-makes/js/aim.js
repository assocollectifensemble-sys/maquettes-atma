/* ============================================================
   AIM.JS — Mini-jeu « Vise le ciel »
   L'enfant oriente son téléphone (dos tourné vers le ciel) vers un astre
   ou une zone du ciel de La Réunion. Flèche + « chaud/froid » (texte, sons,
   vibration), tolérance réglable (±18° par défaut : boussole imprécise).
   Repli : on fait glisser le ciel au doigt/souris/clavier.
   ============================================================ */
(function () {
  "use strict";
  const RAD = Math.PI / 180;
  const NIV = [
    { mot: "Glacé", ico: "🧊", c: "#9bd1ff", cr: "#6a1a1a" },
    { mot: "Froid", ico: "❄️", c: "#7be0ff", cr: "#8c2020" },
    { mot: "Tiède", ico: "🌤️", c: "#ffe27a", cr: "#b3321f" },
    { mot: "Chaud", ico: "🔥", c: "#ff9a3c", cr: "#d9402a" },
    { mot: "Brûlant", ico: "🎯", c: "#ff4d3d", cr: "#ff6a52" }
  ];
  let sunGate = false; // la consigne de sécurité a été validée dans cette session

  function mount(host, o) {
    const tol = o.tol || Store.get("tolerance") || 18;
    let target = null, date = Sky.now(), lastUpd = 0, raf = 0, hold = 0, done = false, t0 = performance.now(), lastIn = false;
    let cw = 0, ch = 0, F = 1, dpr = 1, started = false, pulse = 0;
    const isSun = o.targetId === "soleil";
    const theme = () => document.body.dataset.theme;

    host.innerHTML =
      '<div class="aimwrap" id="aimwrap" tabindex="0" aria-label="Zone de visée du ciel. Au clavier, utilise les flèches pour tourner la vue.">' +
        '<canvas id="aimcv" aria-hidden="true"></canvas>' +
        '<div class="reticle" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="ring" cx="60" cy="60" r="50"/><path class="cross" d="M60 4v22M60 94v22M4 60h22M94 60h22"/><circle class="prog" id="prog" cx="60" cy="60" r="54" stroke-dasharray="339.3" stroke-dashoffset="339.3"/></svg></div>' +
        '<div class="arrow" id="arrow" aria-hidden="true"><div class="arrow-in" id="arrowin">' + Art.ICO.arrow + '</div></div>' +
        '<div class="hud-top"><span class="chip" id="hcap">Cap —</span><span class="chip" id="hhaut">Hauteur —</span></div>' +
        '<div class="hud-bottom"><div class="row" style="gap:8px;flex-wrap:nowrap">' +
          '<button class="iconbtn" id="bcal" aria-label="Calibrer : dessiner un 8 avec le téléphone" title="Calibrer">🧭</button>' +
          '<button class="iconbtn" id="brec" aria-label="Recaler la boussole sur le sud" title="Recaler">📍</button>' +
          '<button class="iconbtn" id="bson" aria-label="Son" aria-pressed="true">🔊</button>' +
          '<button class="iconbtn" id="bmode" aria-label="Changer de mode de visée" title="Capteurs / glisser">✋</button></div>' +
          '<span class="chip big temp" id="htemp" aria-hidden="true">…</span></div>' +
        '<div id="overlay"></div>' +
      '</div>' +
      '<div class="hotbar" aria-hidden="true"><i id="hotfill"></i></div>' +
      '<p class="sr-only" id="live" role="status" aria-live="polite"></p>' +
      (isSun ? '<div class="safety" role="note"><h3>⚠️ Ne regarde jamais le Soleil</h3><p>Même avec des lunettes de soleil. Ici, regarde seulement l\'écran : la flèche te guide. Astuce : ton ombre pointe à l\'opposé du Soleil.</p></div>' : '') +
      '<div class="note small" id="aimmsg"></div>';

    const $ = id => host.querySelector("#" + id);
    const cv = $("aimcv"), g = cv.getContext("2d"), wrap = $("aimwrap");
    $("bson").setAttribute("aria-pressed", String(!!Store.get("son"))); $("bson").textContent = Store.get("son") ? "🔊" : "🔇";

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = wrap.getBoundingClientRect(); cw = Math.max(200, r.width); ch = Math.max(200, r.height);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      F = (cw / 2) / Math.tan(37 * RAD);
    }
    window.addEventListener("resize", resize); resize();

    function refreshTarget(force) {
      const n = performance.now();
      if (!force && n - lastUpd < 1000) return; lastUpd = n;
      date = Sky.now(); target = Sky.target(o.targetId, date);
    }
    refreshTarget(true);
    const msg = t => { $("aimmsg").innerHTML = t; };
    msg(o.consigne || "Tiens le téléphone debout, le <b>dos</b> tourné vers le ciel. Tourne-toi doucement : la flèche te montre la direction.");

    // ---------- projections ----------
    const D = Vec.dot;
    function proj(v, b) { const x = D(v, b.r), y = D(v, b.u), z = D(v, b.f); if (z <= 0.03) return null; return [cw / 2 + F * x / z, ch / 2 - F * y / z]; }
    function pal() {
      const th = theme(), night = Sky.sunAlt(date) < -3;
      if (th === "rouge") return { top: "#050000", bot: "#2a0505", gnd: "#0d0000", hor: "#ff5b4a", txt: "#ff8c7c", acc: "#ff6a52" };
      if (night) return { top: "#030818", bot: "#16337a", gnd: "#07140d", hor: "#7be0ff", txt: "#ffffff", acc: "#ffd23f" };
      return th === "soleil"
        ? { top: "#2d7fe0", bot: "#cfeaff", gnd: "#2f6b3c", hor: "#04102c", txt: "#04102c", acc: "#0a2a8c" }
        : { top: "#2b72d6", bot: "#a8d6ff", gnd: "#1f4d2b", hor: "#04102c", txt: "#04102c", acc: "#fff2a8" };
    }

    function draw(b, P) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gx = b.r[2], gy = b.u[2], gz = b.f[2], gg = Math.hypot(gx, gy);
      // ciel
      let grad;
      if (gg < 0.02) grad = g.createLinearGradient(0, 0, 0, ch);
      else {
        const p0x = -(gz * F / (gg * gg)) * gx, p0y = -(gz * F / (gg * gg)) * gy; // point de l'horizon le plus proche du centre (repère X,Yc)
        const dx = gx / gg, dy = gy / gg; // direction du zénith
        const sx = cw / 2 + p0x, sy = ch / 2 - p0y;
        grad = g.createLinearGradient(sx, sy, sx + dx * ch * 0.9, sy - dy * ch * 0.9);
      }
      grad.addColorStop(0, P.bot); grad.addColorStop(1, P.top);
      g.fillStyle = grad; g.fillRect(0, 0, cw, ch);
      // sol (demi-plan sous l'horizon, droite en projection gnomonique)
      g.fillStyle = P.gnd;
      if (gg < 0.02) { if (gz < 0) g.fillRect(0, 0, cw, ch); }
      else {
        const L = 3 * (cw + ch), p0x = -(gz * F / (gg * gg)) * gx, p0y = -(gz * F / (gg * gg)) * gy, dx = -gy / gg, dy = gx / gg, nx = gx / gg, ny = gy / gg;
        const pts = [[p0x + dx * L, p0y + dy * L], [p0x - dx * L, p0y - dy * L], [p0x - dx * L - nx * L, p0y - dy * L - ny * L], [p0x + dx * L - nx * L, p0y + dy * L - ny * L]];
        g.beginPath(); pts.forEach((p, i) => { const X = cw / 2 + p[0], Y = ch / 2 - p[1]; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill();
        g.strokeStyle = P.hor; g.lineWidth = 4; g.beginPath();
        g.moveTo(cw / 2 + p0x + dx * L, ch / 2 - (p0y + dy * L)); g.lineTo(cw / 2 + p0x - dx * L, ch / 2 - (p0y - dy * L)); g.stroke();
      }
      // arcs de hauteur 30° et 60°
      g.lineWidth = 1.5; g.strokeStyle = P.txt; g.globalAlpha = .35; g.setLineDash([5, 7]);
      [30, 60].forEach(h => {
        g.beginPath(); let pen = false;
        for (let a = 0; a <= 360; a += 4) { const p = proj(Sky.enu(a, h), b); if (p) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; }
        g.stroke();
      });
      g.setLineDash([]); g.globalAlpha = 1;
      // graduations sur l'horizon + points cardinaux
      g.font = "800 22px " + getComputedStyle(document.body).fontFamily; g.textAlign = "center"; g.textBaseline = "middle";
      for (let a = 0; a < 360; a += 15) {
        const p = proj(Sky.enu(a, 0), b); if (!p) continue;
        const card = { 0: "N", 90: "E", 180: "S", 270: "O" }[a];
        if (card) {
          g.fillStyle = P.hor; g.beginPath(); g.arc(p[0], p[1], 20, 0, 7); g.fill();
          g.fillStyle = (theme() === "soleil" || !(Sky.sunAlt(date) < -3 || theme() === "rouge")) ? "#fff" : "#04102c"; if (theme() === "rouge") g.fillStyle = "#1a0000";
          g.fillText(card, p[0], p[1] + 1);
        } else { g.strokeStyle = P.hor; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p[0], p[1] - 7); g.lineTo(p[0], p[1] + 7); g.stroke(); }
      }
      // étoiles réelles (la nuit, pour la Croix du Sud et le pôle)
      if (o.etoiles && Sky.isNight(date)) {
        const cs = Sky.crossStars(date); g.fillStyle = "#fff6c2";
        const found = done;
        const lines = [["gacrux", "acrux"], ["mimosa", "imai"], ["acen", "hadar"]];
        Object.keys(cs).forEach(k => {
          const p = proj(Sky.enu(cs[k].az, cs[k].alt), b); if (!p || cs[k].alt < 0) return;
          const r = ({ acrux: 8, mimosa: 7.5, gacrux: 6.5, imai: 5, acen: 8, hadar: 7.5 })[k];
          g.beginPath(); g.fillStyle = theme() === "rouge" ? "#ffb0a0" : "#fff6c2"; g.arc(p[0], p[1], r, 0, 7); g.fill();
          g.globalAlpha = .25; g.beginPath(); g.arc(p[0], p[1], r * 2.4, 0, 7); g.fill(); g.globalAlpha = 1;
          if (found) { g.font = "700 16px " + getComputedStyle(document.body).fontFamily; g.fillStyle = P.txt; g.fillText(Sky.STARS[k].nom.split(" (")[0], p[0], p[1] + r + 16); }
        });
        if (found) {
          g.strokeStyle = P.acc; g.lineWidth = 3;
          lines.forEach(l => { const a = proj(Sky.enu(cs[l[0]].az, cs[l[0]].alt), b), c = proj(Sky.enu(cs[l[1]].az, cs[l[1]].alt), b); if (a && c) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); } });
        }
      }
      // cible
      if (target) {
        const p = proj(Sky.enu(target.az, target.alt), b);
        if (p) {
          pulse += 0.06; const rr = 30 + Math.sin(pulse) * 4;
          g.lineWidth = 4; g.strokeStyle = P.acc; g.setLineDash(done ? [] : [8, 8]); g.beginPath(); g.arc(p[0], p[1], rr, 0, 7); g.stroke(); g.setLineDash([]);
          g.font = "34px serif"; g.fillStyle = P.acc; g.fillText(done || P.dist < tol * 2 ? target.icone : "?", p[0], p[1] + 2);
          if (done) { g.font = "800 18px " + getComputedStyle(document.body).fontFamily; g.fillStyle = P.txt; g.fillText(target.nom.replace(/^l[ea]s? |^l'/, ""), p[0], p[1] + rr + 18); }
        }
      }
    }

    // ---------- boucle ----------
    let hist = 0, lastLevel = -1;
    function frame() {
      raf = requestAnimationFrame(frame);
      if (!started) return;
      refreshTarget();
      const b = Sensors.get(), f = b.f;
      const t = Sky.enu(target.az, target.alt);
      const dist = Math.acos(Math.max(-1, Math.min(1, D(f, t)))) / RAD;
      const pt = Sensors.pointing();
      const P = pal(); P.dist = dist; frame.dist = dist;
      draw(b, P);
      // HUD
      const pts = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(pt.az / 45) % 8];
      $("hcap").textContent = "Cap " + Math.round(pt.az) + "° " + pts;
      $("hhaut").textContent = "Hauteur " + Math.round(pt.alt) + "°";
      const n = dist <= tol ? 4 : dist <= tol * 1.7 ? 3 : dist <= tol * 3 ? 2 : dist <= tol * 5 ? 1 : 0;
      const N = NIV[n], tc = $("htemp");
      tc.textContent = N.ico + " " + N.mot; tc.dataset.n = n; tc.style.background = theme() === "rouge" ? N.cr : N.c; tc.style.color = theme() === "rouge" ? "#fff" : "#0a1233";
      $("hotfill").style.width = Math.max(4, 100 - Math.min(100, dist / (tol * 5) * 100)) + "%";
      if (n !== lastLevel) { lastLevel = n; $("live").textContent = N.mot; }
      // flèche
      const x = D(t, b.r), y = D(t, b.u), z = D(t, f);
      const ang = Math.atan2(x, y) / RAD;
      const arrow = $("arrow"), inview = z > 0 && Math.abs(x / z * F) < cw / 2 - 20 && Math.abs(y / z * F) < ch / 2 - 20;
      arrow.style.opacity = n >= 4 ? 0 : (inview && dist < 25 ? 0.35 : 1);
      $("arrowin").style.transform = "rotate(" + ang.toFixed(1) + "deg) translateY(-" + (inview && dist < 25 ? 105 : 125) + "px) scale(" + (0.8 + 0.4 * (1 - Math.min(1, dist / 120))).toFixed(2) + ")";
      // maintien dans la zone
      const dt = 1 / 60;
      if (dist <= tol && !done) {
        hold += dt; if (!lastIn) { Audio2.vibre(40); }
      } else hold = Math.max(0, hold - dt * 2);
      lastIn = dist <= tol;
      $("prog").style.strokeDashoffset = (339.3 * (1 - Math.min(1, hold / 1.1))).toFixed(1);
      if (hold >= 1.1 && !done) success();
    }
    function success() {
      done = true; Audio2.stopPing(); Audio2.Sfx.ok(); Audio2.vibre([80, 60, 160]);
      $("arrow").style.opacity = 0; $("htemp").textContent = "🎯 Trouvé !"; $("live").textContent = "Trouvé !";
      msg("✅ <b>Trouvé !</b> Tu as visé " + target.nom + (o.apres ? ". " + o.apres : "."));
      if (o.onSuccess) setTimeout(() => o.onSuccess({ secondes: Math.round((performance.now() - t0) / 1000) }), 1100);
    }

    // ---------- démarrage (geste obligatoire sur iOS) ----------
    function overlay(html) { $("overlay").innerHTML = html ? '<div style="position:absolute;inset:0;background:rgba(2,6,23,.88);color:#fff;display:flex;flex-direction:column;gap:12px;justify-content:center;padding:18px;z-index:5">' + html + '</div>' : ""; }
    function demarrage() {
      if (isSun && !sunGate) {
        overlay('<h3 style="color:#ffb3b3;font-size:24px">⚠️ Sécurité : le Soleil</h3><p><b>Ne regarde JAMAIS le Soleil</b>, ni à l\'œil nu, ni avec des lunettes de soleil, des jumelles ou un télescope.</p><p>Dans ce jeu, tu regardes <b>seulement l\'écran</b>. Ton ombre t\'aide : elle pointe à l\'opposé du Soleil.</p><button class="btn" id="ok1">J\'ai compris</button>');
        $("ok1").onclick = () => { sunGate = true; Audio2.Sfx.unlock(); demarrage(); };
        return;
      }
      overlay('<h3 style="font-size:24px">🎯 Vise le ciel</h3><p>Trouve ' + (target ? target.nom : "la cible") + ' : ' + (o.mission || "tourne-toi, la flèche te guide") + '.</p>' +
        '<button class="btn" id="bsens">📱 Utiliser les capteurs</button><button class="btn sec" id="bdrag">✋ Faire glisser le ciel au doigt</button>' +
        '<p class="small" style="opacity:.85">Pas de capteur (ordinateur) ? Le mode « glisser » marche partout.</p>');
      $("bsens").onclick = async () => {
        Audio2.Sfx.unlock(); overlay('<p class="center">Activation des capteurs…</p>');
        const m = await Sensors.start();
        if (m === "glisse") { go(); toast("Mode « glisser » : " + Sensors.raison); } else { calibration(); }
      };
      $("bdrag").onclick = () => { Audio2.Sfx.unlock(); Sensors.glisse(); go(); };
    }
    function calibration() {
      const s0 = Sensors.spread; let ok = false;
      overlay('<h3 style="font-size:22px">🧭 Calibration</h3><p>Dessine un grand <b>8</b> en l\'air avec ton téléphone, 3 ou 4 fois. Cela aide la boussole à être plus juste.</p><div style="color:#7be0ff">' + Art.ICO.eight + '</div><div class="hotbar"><i id="calbar" style="width:0"></i></div><button class="btn sec" id="skipcal">Passer</button>');
      const iv = setInterval(() => {
        const p = Math.min(1, (Sensors.spread - s0) / 900); const bar = $("calbar"); if (bar) bar.style.width = (p * 100) + "%";
        if (p >= 1 && !ok) { ok = true; clearInterval(iv); Audio2.Sfx.ok(); go(); }
      }, 150);
      $("skipcal").onclick = () => { clearInterval(iv); go(); };
    }
    function go() {
      overlay(""); started = true; t0 = performance.now(); setMode();
      Audio2.startPing(() => (done || !started ? null : frame.dist), tol);
    }
    function setMode() {
      const sens = Sensors.isSensor();
      $("bmode").textContent = sens ? "✋" : "📱"; $("bmode").setAttribute("aria-label", sens ? "Passer en mode glisser" : "Utiliser les capteurs");
      if (!sens) { const p = Sensors.pointing(); Sensors.setView(Sensors.vue.az || p.az, Sensors.vue.alt); msg("✋ <b>Mode glisser</b> : fais glisser le ciel au doigt (ou à la souris, ou avec les flèches du clavier) jusqu'à ce que le viseur soit sur la cible.  " + (Sensors.raison ? '<span class="dim">(' + Sensors.raison + ')</span>' : "")); }
    }
    function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3800); }

    // ---------- commandes ----------
    $("bmode").onclick = async () => {
      if (Sensors.isSensor()) { Sensors.glisse(); setMode(); } else { const m = await Sensors.start(); if (m === "glisse") toast(Sensors.raison); else calibration(); setMode(); }
    };
    $("bcal").onclick = () => { if (!Sensors.isSensor()) { toast("La calibration sert seulement avec les capteurs."); return; } started = false; calibration(); };
    $("brec").onclick = () => {
      overlay('<h3 style="font-size:22px">📍 Recaler</h3><p>Si la flèche te semble fausse, tourne le téléphone vers le <b>SUD</b> (demande à ton guide, ou repère-le avec le panneau d\'orientation), puis touche le bouton.</p><button class="btn" id="rsud">Je vise le sud</button><button class="btn sec" id="rrst">Remettre à zéro</button><button class="btn ghost" id="rno" style="color:#fff">Annuler</button>');
      $("rsud").onclick = () => { if (Sensors.isSensor()) Sensors.recaleSur(180); else Sensors.setView(180, Sensors.vue.alt); overlay(""); toast("Boussole recalée sur le sud"); };
      $("rrst").onclick = () => { Sensors.resetRecale(); overlay(""); toast("Réglage remis à zéro"); };
      $("rno").onclick = () => overlay("");
    };
    $("bson").onclick = () => {
      const v = !Store.get("son"); Store.set("son", v); $("bson").textContent = v ? "🔊" : "🔇"; $("bson").setAttribute("aria-pressed", String(v)); if (v) Audio2.Sfx.tap();
    };
    // glisser
    let drag = null;
    wrap.addEventListener("pointerdown", e => { if (Sensors.isSensor() || e.target.closest("button")) return; drag = { x: e.clientX, y: e.clientY }; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener("pointermove", e => {
      if (!drag) return; const k = 57.3 / F; // degrés par pixel
      const v = Sensors.vue; Sensors.setView(v.az - (e.clientX - drag.x) * k, v.alt + (e.clientY - drag.y) * k); drag = { x: e.clientX, y: e.clientY };
    });
    wrap.addEventListener("pointerup", () => { drag = null; }); wrap.addEventListener("pointercancel", () => { drag = null; });
    wrap.addEventListener("keydown", e => {
      if (Sensors.isSensor()) return; const v = Sensors.vue, s = e.shiftKey ? 1 : 4;
      const m = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, s], ArrowDown: [0, -s] }[e.key];
      if (m) { e.preventDefault(); Sensors.setView(v.az + m[0], v.alt + m[1]); }
    });
    wrap.addEventListener("wheel", e => { if (Sensors.isSensor()) return; e.preventDefault(); const v = Sensors.vue; Sensors.setView(v.az + e.deltaX * 0.1, v.alt - e.deltaY * 0.1); }, { passive: false });

    frame(); demarrage();
    return {
      destroy() { cancelAnimationFrame(raf); Audio2.stopPing(); window.removeEventListener("resize", resize); },
      state: () => ({ started, done, dist: frame.dist, target, hold, tol })
    };
  }
  window.Aim = { mount };
})();
