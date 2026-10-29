/* ============================================================
   AIM.JS — Mini-jeu « Vise le ciel »
   L'enfant oriente son téléphone (dos tourné vers le ciel) vers un astre
   ou une zone du ciel de La Réunion. Flèche + « chaud/froid » (texte, sons,
   vibration), tolérance réglable (±18° par défaut : boussole imprécise).
   Le ciel dessiné est le VRAI ciel du moment aux Makes (astronomy-engine) :
   couleur selon la hauteur du Soleil, étoiles de navigation, Croix du Sud et
   Pointeurs, planètes, Lune avec sa phase, Soleil ; horizon et points cardinaux.
   Repli : on fait glisser le ciel au doigt/souris/clavier.
   Plein écran pendant la visée (bouton ✕ pour revenir).
   ============================================================ */
(function () {
  "use strict";
  const RAD = Math.PI / 180;
  const NIV = [
    { mot: "Glacé", ico: "🧊", c: "#9bd1ff" },
    { mot: "Froid", ico: "❄️", c: "#7be0ff" },
    { mot: "Tiède", ico: "🌤️", c: "#ffe27a" },
    { mot: "Chaud", ico: "🔥", c: "#ff9a3c" },
    { mot: "Brûlant", ico: "🎯", c: "#ff4d3d" }
  ];
  const HOLD = 1.1;        // secondes à tenir dans la zone
  let sunGate = false;     // la consigne de sécurité a été validée dans cette session

  // mélange de deux couleurs hexadécimales (t = 0..1)
  function mix(a, b, t) {
    t = Math.max(0, Math.min(1, t)); const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const c = [16, 8, 0].map(s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
    return "#" + c.map(x => x.toString(16).padStart(2, "0")).join("");
  }

  function mount(host, o) {
    const tol = o.tol || Store.get("tolerance") || 18;
    let target = null, date = Sky.now(), lastUpd = 0, raf = 0, hold = 0, done = false, t0 = performance.now(), lastIn = false, lastT = 0;
    let cw = 0, ch = 0, F = 1, dpr = 1, started = false, pulse = 0, burst = null, full = false;
    const isSun = o.targetId === "soleil";
    const theme = () => document.body.dataset.theme;
    const FONT = getComputedStyle(document.body).fontFamily;
    let C = {}; // cache du ciel (rafraîchi chaque seconde)

    host.innerHTML =
      '<div class="aimwrap" id="aimwrap" tabindex="0" aria-label="Zone de visée du ciel. Au clavier, utilise les flèches pour tourner la vue.">' +
        '<canvas id="aimcv" aria-hidden="true"></canvas>' +
        '<div class="reticle" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="ring" cx="60" cy="60" r="50"/><path class="cross" d="M60 4v22M60 94v22M4 60h22M94 60h22"/><circle class="prog" id="prog" cx="60" cy="60" r="54" stroke-dasharray="339.3" stroke-dashoffset="339.3"/></svg></div>' +
        '<div class="arrow" id="arrow" aria-hidden="true"><div class="arrow-in" id="arrowin">' + Art.ICO.arrow + '</div></div>' +
        '<div class="hud-top"><span class="chip mission" id="hmis">🎯 ' + (o.titreCourt || "Vise le ciel") + '</span><button class="iconbtn quit" id="bquit" aria-label="Quitter le plein écran">✕</button></div>' +
        '<div class="hud-mid"><span class="chip" id="hcap">Cap —</span><span class="chip" id="hhaut">Hauteur —</span></div>' +
        '<div class="hud-bottom"><div class="row" style="gap:8px;flex-wrap:nowrap">' +
          '<button class="iconbtn" id="bcal" aria-label="Calibrer : dessiner un 8 avec le téléphone" title="Calibrer">🧭</button>' +
          '<button class="iconbtn" id="brec" aria-label="Recaler la boussole sur le sud" title="Recaler">📍</button>' +
          '<button class="iconbtn" id="bson" aria-label="Son" aria-pressed="true">🔊</button>' +
          '<button class="iconbtn" id="bmode" aria-label="Changer de mode de visée" title="Capteurs / glisser">✋</button>' +
          '<button class="iconbtn skip" id="bskip" data-act="aimskip" aria-label="Je n\'arrive pas : passer" title="Passer" hidden>⏭</button></div>' +
          '<span class="chip big temp" id="htemp" aria-hidden="true">…</span></div>' +
        '<div id="overlay"></div>' +
      '</div>' +
      '<div class="hotbar" aria-hidden="true"><i id="hotfill"></i></div>' +
      '<p class="sr-only" id="live" role="status" aria-live="polite"></p>' +
      (isSun ? '<div class="safety" role="note"><h3>⚠️ Ne regarde jamais le Soleil</h3><p>Même avec des lunettes de soleil. Ici, regarde seulement l\'écran : la flèche te guide. Astuce : ton ombre pointe à l\'opposé du Soleil.</p></div>' : '') +
      '<div class="note small" id="aimmsg"></div>';

    const $ = id => host.querySelector("#" + id);
    const cv = $("aimcv"), g = cv.getContext("2d"), wrap = $("aimwrap");
    // ---------- nuit rouge « native » du canevas ----------
    // En plein écran de nuit, on retire le filtre rouge global (coûteux à 60 images/s sur tout l'écran)
    // et on convertit chaque couleur AU MOMENT DU TRACÉ (même formule que le filtre #filtre-nuit).
    const rougeNatif = () => document.body.dataset.theme === "rouge";
    const memo = new Map();
    function enRouge(c) {
      if (typeof c !== "string" || !rougeNatif()) return c;
      let v = memo.get(c); if (v) return v;
      let r, gg, bb, a = 1, m;
      if ((m = /^#([0-9a-f]{6})$/i.exec(c))) { const n = parseInt(m[1], 16); r = n >> 16; gg = (n >> 8) & 255; bb = n & 255; }
      else if ((m = /^rgba?\(([^)]+)\)$/i.exec(c))) { const p = m[1].split(",").map(Number); [r, gg, bb] = p; if (p.length > 3) a = p[3]; }
      else return c;
      const L = Math.min(255, Math.round(0.44 * r + 0.36 * gg + 0.2 * bb));
      v = "rgba(" + L + ",0,0," + a + ")"; memo.set(c, v); return v;
    }
    ["fillStyle", "strokeStyle"].forEach(k => {
      const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, k);
      Object.defineProperty(g, k, { get() { return d.get.call(this); }, set(v) { d.set.call(this, enRouge(v)); } });
    });
    ["createLinearGradient", "createRadialGradient"].forEach(k => {
      const f = g[k].bind(g);
      g[k] = (...a) => { const gr = f(...a), add = gr.addColorStop.bind(gr); gr.addColorStop = (o, c) => add(o, enRouge(c)); return gr; };
    });
    $("bson").setAttribute("aria-pressed", String(!!Store.get("son"))); $("bson").textContent = Store.get("son") ? "🔊" : "🔇";

    function resize() {
      dpr = Math.min(1.5, window.devicePixelRatio || 1); // 1,5 suffit pour un ciel ; ~45 % de pixels en moins qu'à 2
      const r = wrap.getBoundingClientRect(); cw = Math.max(200, r.width); ch = Math.max(200, r.height);
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      F = (Math.min(cw, ch * 0.75) / 2) / Math.tan(32 * RAD); // champ ≈ 64° sur le petit côté
    }
    window.addEventListener("resize", resize); resize();

    // ---------- cache du ciel ----------
    function refresh(force) {
      const n = performance.now();
      if (!force && n - lastUpd < 1000) return; lastUpd = n;
      date = Sky.now(); target = Sky.target(o.targetId, date);
      const sun = Sky.bodyAltAz("Sun", date), moon = Sky.bodyAltAz("Moon", date);
      C = { sun, moon, ph: Sky.moonPhase(date), cs: Sky.crossStars(date), nav: Sky.brightStars(date), pl: Sky.planets(date), sa: sun.alt };
      C.pal = palette(sun.alt);
    }
    // Couleurs du ciel selon la hauteur du Soleil (jour → crépuscule → nuit)
    function palette(sa) {
      const th = theme();
      const jour = th === "soleil" ? { top: "#2d7fe0", bot: "#d4ecff" } : { top: "#1f63c9", bot: "#a9d4ff" };
      const crep = { top: "#1a2f6e", bot: "#f2a65a" }, nuit = { top: "#020617", bot: "#10265a" };
      let top, bot;
      if (sa > 6) { top = jour.top; bot = jour.bot; }
      else if (sa > -1) { const t = (6 - sa) / 7; top = mix(jour.top, crep.top, t); bot = mix(jour.bot, crep.bot, t); }
      else if (sa > -12) { const t = (-1 - sa) / 11; top = mix(crep.top, nuit.top, t); bot = mix(crep.bot, nuit.bot, t); }
      else { top = nuit.top; bot = nuit.bot; }
      const night = sa < -3, dark = sa < 2;
      return {
        top, bot, night, starA: sa > -1 ? 0 : Math.min(1, (-1 - sa) / 8),
        gnd: dark ? "#06130d" : (th === "soleil" ? "#2f6b3c" : "#1f4d2b"), gnd2: dark ? "#020604" : "#13301b",
        hor: dark ? "#7be0ff" : "#04102c", txt: dark ? "#ffffff" : "#04102c", acc: dark ? "#ffd23f" : (th === "soleil" ? "#0a2a8c" : "#fff2a8"),
        grid: dark ? "rgba(190,215,255,.35)" : "rgba(4,16,44,.32)"
      };
    }
    refresh(true);
    const msg = t => { $("aimmsg").innerHTML = t; };
    msg(o.consigne || "Tiens le téléphone debout, le <b>dos</b> tourné vers le ciel. Tourne-toi doucement : la flèche te montre la direction.");

    // ---------- projections ----------
    const D = Vec.dot;
    function proj(v, b) { const x = D(v, b.r), y = D(v, b.u), z = D(v, b.f); if (z <= 0.03) return null; return [cw / 2 + F * x / z, ch / 2 - F * y / z]; }
    const P = (az, alt, b) => proj(Sky.enu(az, alt), b);
    const inScreen = (p, m) => p && p[0] > -m && p[0] < cw + m && p[1] > -m && p[1] < ch + m;
    function label(t, x, y, col, size, weight) { g.font = (weight || 700) + " " + (size || 15) + "px " + FONT; g.fillStyle = col; g.fillText(t, x, y); }

    function drawSky(b, Pl) {
      const gx = b.r[2], gy = b.u[2], gz = b.f[2], gg = Math.hypot(gx, gy);
      let grad;
      const p0x = gg < 0.02 ? 0 : -(gz * F / (gg * gg)) * gx, p0y = gg < 0.02 ? 0 : -(gz * F / (gg * gg)) * gy; // point de l'horizon le plus proche du centre
      if (gg < 0.02) grad = g.createLinearGradient(0, 0, 0, ch);
      else { const dx = gx / gg, dy = gy / gg, sx = cw / 2 + p0x, sy = ch / 2 - p0y; grad = g.createLinearGradient(sx, sy, sx + dx * ch * 0.9, sy - dy * ch * 0.9); }
      grad.addColorStop(0, Pl.bot); grad.addColorStop(1, Pl.top);
      g.fillStyle = grad; g.fillRect(0, 0, cw, ch);
      // halo du Soleil dans l'atmosphère
      if (C.sun.alt > -8) {
        const ps = P(C.sun.az, C.sun.alt, b);
        if (ps) { const R = Math.max(cw, ch) * 0.7, rg = g.createRadialGradient(ps[0], ps[1], 0, ps[0], ps[1], R); rg.addColorStop(0, "rgba(255,244,200,.55)"); rg.addColorStop(1, "rgba(255,244,200,0)"); g.fillStyle = rg; g.fillRect(0, 0, cw, ch); }
      }
      return { p0x, p0y, gg, gx, gy, gz };
    }
    function drawGround(H, Pl) {
      g.fillStyle = Pl.gnd;
      if (H.gg < 0.02) { if (H.gz < 0) g.fillRect(0, 0, cw, ch); return; }
      const L = 3 * (cw + ch), dx = -H.gy / H.gg, dy = H.gx / H.gg, nx = H.gx / H.gg, ny = H.gy / H.gg;
      const pts = [[H.p0x + dx * L, H.p0y + dy * L], [H.p0x - dx * L, H.p0y - dy * L], [H.p0x - dx * L - nx * L, H.p0y - dy * L - ny * L], [H.p0x + dx * L - nx * L, H.p0y + dy * L - ny * L]];
      const gr = g.createLinearGradient(cw / 2 + H.p0x, ch / 2 - H.p0y, cw / 2 + H.p0x - nx * ch * .6, ch / 2 - H.p0y + ny * ch * .6);
      gr.addColorStop(0, Pl.gnd); gr.addColorStop(1, Pl.gnd2); g.fillStyle = gr;
      g.beginPath(); pts.forEach((p, i) => { const X = cw / 2 + p[0], Y = ch / 2 - p[1]; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill();
      // brume claire juste au-dessus de l'horizon + ligne d'horizon
      g.strokeStyle = Pl.night ? "rgba(123,224,255,.18)" : "rgba(255,255,255,.35)"; g.lineWidth = 16;
      g.beginPath(); g.moveTo(cw / 2 + H.p0x + dx * L + nx * 9, ch / 2 - (H.p0y + dy * L + ny * 9)); g.lineTo(cw / 2 + H.p0x - dx * L + nx * 9, ch / 2 - (H.p0y - dy * L + ny * 9)); g.stroke();
      g.strokeStyle = Pl.hor; g.lineWidth = 3; g.beginPath();
      g.moveTo(cw / 2 + H.p0x + dx * L, ch / 2 - (H.p0y + dy * L)); g.lineTo(cw / 2 + H.p0x - dx * L, ch / 2 - (H.p0y - dy * L)); g.stroke();
    }
    function drawGrid(b, Pl) {
      g.lineWidth = 1.4; g.strokeStyle = Pl.grid; g.setLineDash([4, 7]);
      [30, 60].forEach(h => {
        g.beginPath(); let pen = false;
        for (let a = 0; a <= 360; a += 3) { const p = P(a, h, b); if (p) { pen ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); pen = true; } else pen = false; }
        g.stroke();
      });
      g.setLineDash([]);
      // étiquettes de hauteur (30°, 60°) près de la direction regardée
      const az0 = Vec.azOf(b.f);
      g.textAlign = "left"; g.textBaseline = "middle";
      [30, 60].forEach(h => { const p = P(az0 + 12, h, b); if (inScreen(p, -10)) label(h + "°", p[0] + 4, p[1] - 10, Pl.grid.replace(/[\d.]+\)$/, ".9)"), 13, 800); });
      // graduations de l'horizon : tous les 10°, nombres tous les 30°, points cardinaux
      g.textAlign = "center";
      const CARD = { 0: "N", 45: "NE", 90: "E", 135: "SE", 180: "S", 225: "SO", 270: "O", 315: "NO" };
      for (let a = 0; a < 360; a += 5) {
        const p = P(a, 0, b); if (!inScreen(p, 40)) continue;
        if (a % 90 === 0) {
          g.fillStyle = Pl.hor; g.beginPath(); g.arc(p[0], p[1], 19, 0, 7); g.fill();
          label(CARD[a], p[0], p[1] + 1, Pl.night ? "#04102c" : "#ffffff", 21, 900);
        } else if (a % 45 === 0) {
          g.strokeStyle = Pl.hor; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p[0], p[1] - 10); g.lineTo(p[0], p[1] + 10); g.stroke();
          label(CARD[a], p[0], p[1] + 24, Pl.txt, 15, 900);
        } else if (a % 10 === 0) {
          g.strokeStyle = Pl.hor; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0], p[1] - 6); g.lineTo(p[0], p[1] + 6); g.stroke();
          if (a % 30 === 0) label(a + "°", p[0], p[1] + 20, Pl.txt, 12, 700);
        }
      }
    }
    function drawStars(b, Pl) {
      const A = Pl.starA;
      // jour : on montre où est (cachée) la Croix du Sud, pour comprendre que les étoiles sont toujours là
      const veutCroix = o.etoiles || o.targetId === "pole" || o.targetId === "croix";
      if (A < 0.05) {
        if (!veutCroix) return;
        g.setLineDash([3, 4]); g.strokeStyle = Pl.night ? "#bfe3ff" : "rgba(4,16,44,.55)"; g.lineWidth = 1.6;
        let any = null;
        ["acrux", "mimosa", "gacrux", "imai"].forEach(k => { const s = C.cs[k]; if (s.alt < 0) return; const p = P(s.az, s.alt, b); if (!inScreen(p, 20)) return; g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.stroke(); any = p; });
        g.setLineDash([]);
        if (any) { g.textAlign = "center"; label("Croix du Sud (cachée par le jour)", any[0], any[1] + 26, Pl.txt, 13, 800); }
        return;
      }
      g.globalAlpha = A;
      // étoiles de navigation (taille selon la magnitude)
      g.textAlign = "center"; g.textBaseline = "middle";
      for (const s of C.nav) {
        if (s.alt < 0) continue; const p = P(s.az, s.alt, b); if (!inScreen(p, 10)) continue;
        const r = Math.max(1.1, 3.6 - s.mag * 0.95);
        g.fillStyle = "#fff8e0"; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
        if (s.mag < 0.9) { g.globalAlpha = A * .22; g.beginPath(); g.arc(p[0], p[1], r * 3, 0, 7); g.fill(); g.globalAlpha = A; label(s.nom, p[0], p[1] + r + 12, "rgba(255,255,255,.75)", 12, 700); }
      }
      // Croix du Sud + Pointeurs (coordonnées précises)
      const cs = C.cs, R = { acrux: 5, mimosa: 4.6, gacrux: 4.2, imai: 3.2, acen: 5.2, hadar: 4.6 };
      const montre = done || veutCroix;
      if (montre) {
        g.strokeStyle = Pl.acc; g.globalAlpha = A * (done ? .95 : .4); g.lineWidth = done ? 3 : 1.6;
        [["gacrux", "acrux"], ["mimosa", "imai"]].forEach(l => { const a = P(cs[l[0]].az, cs[l[0]].alt, b), c = P(cs[l[1]].az, cs[l[1]].alt, b); if (a && c) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); g.stroke(); } });
        g.globalAlpha = A;
      }
      // étiquettes écartées vers l'extérieur de la Croix (sinon elles se chevauchent : la Croix ne fait que 6°)
      const pc = {}; Object.keys(cs).forEach(k => { if (cs[k].alt >= 0) pc[k] = P(cs[k].az, cs[k].alt, b); });
      const cc = ["acrux", "mimosa", "gacrux", "imai"].map(k => pc[k]).filter(Boolean);
      const mx = cc.reduce((s, p) => s + p[0], 0) / (cc.length || 1), my = cc.reduce((s, p) => s + p[1], 0) / (cc.length || 1);
      Object.keys(pc).forEach(k => {
        const p = pc[k]; if (!inScreen(p, 10)) return;
        g.fillStyle = "#fff6c2"; g.beginPath(); g.arc(p[0], p[1], R[k], 0, 7); g.fill();
        g.globalAlpha = A * .25; g.beginPath(); g.arc(p[0], p[1], R[k] * 2.6, 0, 7); g.fill(); g.globalAlpha = A;
        if (montre && (done || frame.dist < tol * 3)) {
          const croixK = k !== "acen" && k !== "hadar", dx = croixK ? p[0] - mx : 0, dy = croixK ? p[1] - my : 1, n = Math.hypot(dx, dy) || 1;
          const nom = k === "acen" ? "α Centaure" : Sky.STARS[k].nom.split(" (")[0];
          g.textAlign = dx / n > .35 ? "left" : dx / n < -.35 ? "right" : "center";
          label(nom, p[0] + dx / n * (R[k] + 10), p[1] + dy / n * (R[k] + 12), Pl.txt, 13, 800);
        }
      });
      g.textAlign = "center";
      // planètes
      for (const pl of C.pl) {
        if (pl.alt < 0) continue; const p = P(pl.az, pl.alt, b); if (!inScreen(p, 10)) continue;
        g.fillStyle = ({ Mars: "#ffb08a", Jupiter: "#ffe9c2", Saturn: "#f3dca0", Venus: "#ffffff", Mercury: "#e8e1d0" })[pl.id] || "#fff";
        g.beginPath(); g.arc(p[0], p[1], 4.4, 0, 7); g.fill(); label(pl.nom, p[0], p[1] - 14, "#ffe9a8", 12, 800);
      }
      g.globalAlpha = 1;
    }
    function drawSun(b, Pl) {
      if (C.sun.alt < -1) return; const p = P(C.sun.az, C.sun.alt, b); if (!inScreen(p, 60)) return;
      const rg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 46); rg.addColorStop(0, "rgba(255,250,220,1)"); rg.addColorStop(.35, "rgba(255,226,120,.9)"); rg.addColorStop(1, "rgba(255,200,80,0)");
      g.fillStyle = rg; g.beginPath(); g.arc(p[0], p[1], 46, 0, 7); g.fill();
      g.fillStyle = "#fffbe8"; g.beginPath(); g.arc(p[0], p[1], 15, 0, 7); g.fill();
    }
    // Lune avec sa VRAIE phase ; le côté éclairé est tourné vers le Soleil
    function drawMoon(b, Pl) {
      if (C.moon.alt < -1) return; const m = Sky.enu(C.moon.az, C.moon.alt), p = proj(m, b); if (!inScreen(p, 30)) return;
      const s = Sky.enu(C.sun.az, C.sun.alt), k = D(s, m), tg = [s[0] - k * m[0], s[1] - k * m[1], s[2] - k * m[2]], tn = Math.hypot(...tg) || 1;
      const q = proj([m[0] + .03 * tg[0] / tn, m[1] + .03 * tg[1] / tn, m[2] + .03 * tg[2] / tn], b);
      const ang = q ? Math.atan2(q[1] - p[1], q[0] - p[0]) : 0, R = 15, f = C.ph.frac;
      g.save(); g.translate(p[0], p[1]); g.rotate(ang);
      g.fillStyle = Pl.night ? "#2a3350" : "rgba(170,190,225,.55)"; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
      // partie éclairée : demi-disque côté Soleil (+x) + ellipse du terminateur
      g.fillStyle = "#fbf6dc"; g.beginPath(); g.arc(0, 0, R, -Math.PI / 2, Math.PI / 2, false);
      const e = R * (1 - 2 * f); g.ellipse(0, 0, Math.abs(e), R, 0, Math.PI / 2, -Math.PI / 2, e > 0); g.fill();
      g.restore();
      g.textAlign = "center"; label("Lune", p[0], p[1] + R + 13, Pl.txt, 12, 800);
    }
    function drawPole(b, Pl) {
      if (o.targetId === "pole") return; // c'est la cible : son repère (mystérieux puis nommé) est dessiné par drawTarget
      if (!(o.etoiles || o.targetId === "pole")) return;
      const p = P(180, -Sky.LAT, b); if (!inScreen(p, 20)) return;
      g.strokeStyle = Pl.acc; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 9, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(p[0] - 15, p[1]); g.lineTo(p[0] + 15, p[1]); g.moveTo(p[0], p[1] - 15); g.lineTo(p[0], p[1] + 15); g.stroke();
      const droite = p[0] < cw - 140; g.textAlign = droite ? "left" : "right"; label("pôle sud céleste", p[0] + (droite ? 14 : -14), p[1] - 14, Pl.acc, 13, 800);
    }
    function drawTarget(b, Pl, dist) {
      if (!target) return; const p = P(target.az, target.alt, b); if (!p) return;
      pulse += 0.06; const rr = 30 + Math.sin(pulse) * 4;
      g.lineWidth = 4; g.strokeStyle = Pl.acc; g.setLineDash(done ? [] : [8, 8]); g.beginPath(); g.arc(p[0], p[1], rr, 0, 7); g.stroke(); g.setLineDash([]);
      g.textAlign = "center"; g.textBaseline = "middle";
      if (!(target.kind === "sun" || target.kind === "moon") || !done) {
        const icone = done || dist < tol * 2;
        if (icone && rougeNatif()) { // les emojis sont en couleur (police) : en nuit rouge, étoile vectorielle à la place
          g.fillStyle = Pl.acc; g.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, r = i % 2 ? 5 : 15; g.lineTo(p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)); } g.closePath(); g.fill();
        } else { g.font = "30px serif"; g.fillStyle = Pl.acc; g.fillText(icone ? target.icone : "?", p[0], p[1] + 2); }
      }
      if (done) label(target.nom.replace(/^l[ea]s? |^l'/, ""), p[0], p[1] + rr + 18, Pl.txt, 18, 900);
      // gerbe d'étincelles au moment du succès
      if (burst) {
        const t = (performance.now() - burst) / 1000; if (t > 1.4) { burst = null; return; }
        for (let i = 0; i < 28; i++) {
          const a = i / 28 * Math.PI * 2, d = 20 + t * (120 + (i % 4) * 30);
          g.globalAlpha = Math.max(0, 1 - t / 1.4); g.fillStyle = ["#ffd23f", "#7be0ff", "#ff9ec4", "#fff"][i % 4];
          g.beginPath(); g.arc(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d, 4 - t * 2, 0, 7); g.fill();
        }
        g.globalAlpha = 1; g.strokeStyle = Pl.acc; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], 30 + t * 160, 0, 7); g.globalAlpha = Math.max(0, .8 - t); g.stroke(); g.globalAlpha = 1;
      }
    }

    function draw(b, dist) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const Pl = C.pal;
      const H = drawSky(b, Pl);
      drawStars(b, Pl); drawSun(b, Pl); drawMoon(b, Pl);
      drawGround(H, Pl); drawGrid(b, Pl); drawPole(b, Pl); drawTarget(b, Pl, dist);
    }

    // ---------- boucle ----------
    let lastLevel = -1;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      const dt = lastT ? Math.min(0.1, (ts - lastT) / 1000) : 1 / 60; lastT = ts;   // temps réel (60, 90, 120 Hz…)
      if (!started) return;
      refresh();
      const b = Sensors.get(), f = b.f;
      const t = Sky.enu(target.az, target.alt);
      const dist = Math.acos(Math.max(-1, Math.min(1, D(f, t)))) / RAD;
      frame.dist = dist;
      const pt = Sensors.pointing();
      draw(b, dist);
      // HUD
      const pts = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(pt.az / 45) % 8];
      $("hcap").textContent = "Cap " + Math.round(pt.az) + "° " + pts;
      $("hhaut").textContent = "Hauteur " + Math.round(pt.alt) + "°";
      const n = dist <= tol ? 4 : dist <= tol * 1.7 ? 3 : dist <= tol * 3 ? 2 : dist <= tol * 5 ? 1 : 0;
      const N = NIV[n], tc = $("htemp");
      if (!done) { tc.textContent = N.ico + " " + N.mot; tc.dataset.n = n; tc.style.background = N.c; tc.style.color = "#0a1233"; }
      $("hotfill").style.width = Math.max(4, 100 - Math.min(100, dist / (tol * 5) * 100)) + "%";
      if (n !== lastLevel) { lastLevel = n; $("live").textContent = N.mot; }
      // flèche
      const x = D(t, b.r), y = D(t, b.u), z = D(t, f);
      const ang = Math.atan2(x, y) / RAD;
      const arrow = $("arrow"), inview = z > 0 && Math.abs(x / z * F) < cw / 2 - 20 && Math.abs(y / z * F) < ch / 2 - 20;
      arrow.style.opacity = done || n >= 4 ? 0 : (inview && dist < 25 ? 0.35 : 1);
      $("arrowin").style.transform = "rotate(" + ang.toFixed(1) + "deg) translateY(-" + (inview && dist < 25 ? 105 : 125) + "px) scale(" + (0.8 + 0.4 * (1 - Math.min(1, dist / 120))).toFixed(2) + ")";
      // maintien dans la zone
      if (dist <= tol && !done) { hold += dt; if (!lastIn) Audio2.vibre(40); }
      else hold = Math.max(0, hold - dt * 2);
      lastIn = dist <= tol;
      $("prog").style.strokeDashoffset = (339.3 * (1 - Math.min(1, hold / HOLD))).toFixed(1);
      if (hold >= HOLD && !done) success();
    }
    function success() {
      done = true; burst = performance.now(); Audio2.stopPing(); Audio2.Sfx.trouve(); Audio2.vibre([80, 60, 160]);
      $("arrow").style.opacity = 0; const tc = $("htemp"); tc.textContent = "🎯 Trouvé !"; tc.dataset.n = 4; $("live").textContent = "Trouvé !";
      wrap.classList.add("gagne");
      msg("✅ <b>Trouvé !</b> Tu as visé " + target.nom + (o.apres ? ". " + o.apres : "."));
      if (o.onSuccess) setTimeout(() => { setFull(false); o.onSuccess({ secondes: Math.round((performance.now() - t0) / 1000) }); }, 1600);
    }

    // ---------- plein écran immersif ----------
    function setFull(v) {
      full = !!v; document.body.classList.toggle("aim-full", full); wrap.classList.toggle("full", full);
      // nuit rouge : en plein écran, filtre global coupé (le canevas se dessine lui-même en rouge, le HUD garde un petit filtre)
      if (rougeNatif()) document.documentElement.classList.toggle("nuit", !full);
      requestAnimationFrame(resize);
    }
    $("bquit").onclick = () => setFull(false);
    const onKey = e => { if (e.key === "Escape" && full) setFull(false); };
    document.addEventListener("keydown", onKey);

    // ---------- démarrage (geste obligatoire sur iOS) ----------
    function overlay(html) { $("overlay").innerHTML = html ? '<div class="aim-ov">' + html + '</div>' : ""; }
    function demarrage() {
      if (isSun && !sunGate) {
        overlay('<h3 style="color:#ffb3b3;font-size:24px">⚠️ Sécurité : le Soleil</h3><p><b>Ne regarde JAMAIS le Soleil</b>, ni à l\'œil nu, ni avec des lunettes de soleil, des jumelles ou un télescope.</p><p>Dans ce jeu, tu regardes <b>seulement l\'écran</b>. Ton ombre t\'aide : elle pointe à l\'opposé du Soleil.</p><button class="btn" id="ok1">J\'ai compris</button>');
        $("ok1").onclick = () => { sunGate = true; Audio2.Sfx.unlock(); demarrage(); };
        return;
      }
      overlay('<div class="ov-ico" aria-hidden="true">🎯</div><h3 style="font-size:24px">Vise le ciel</h3><p>Trouve <b>' + (target ? target.nom : "la cible") + '</b> : ' + (o.mission || "tourne-toi, la flèche te guide") + '.</p>' +
        '<button class="btn" id="bsens">📱 Utiliser les capteurs</button><button class="btn sec" id="bdrag">✋ Faire glisser le ciel au doigt</button>' +
        '<p class="small" style="opacity:.85">Pas de capteur (ordinateur) ? Le mode « glisser » marche partout.</p>');
      $("bsens").onclick = async () => {
        Audio2.Sfx.unlock(); overlay('<p class="center">Activation des capteurs…</p>');
        const m = await Sensors.start();          // requestPermission() est appelé DANS le geste (iOS)
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
    let skipTimer = 0;
    function go() {
      overlay(""); started = true; t0 = performance.now(); setMode(); setFull(true);
      Audio2.startPing(() => (done || !started ? null : frame.dist), tol);
      // porte de secours : bouton « passer » après 25 s (tout de suite en mode démo)
      clearTimeout(skipTimer); skipTimer = setTimeout(() => { const s = $("bskip"); if (s) s.hidden = false; }, o.skipNow ? 0 : 25000);
    }
    function setMode() {
      const sens = Sensors.isSensor();
      $("bmode").textContent = sens ? "✋" : "📱"; $("bmode").setAttribute("aria-label", sens ? "Passer en mode glisser" : "Utiliser les capteurs");
      if (!sens) { const p = Sensors.pointing(); Sensors.setView(Sensors.vue.az || p.az, Sensors.vue.alt); msg("✋ <b>Mode glisser</b> : fais glisser le ciel au doigt (ou à la souris, ou avec les flèches du clavier) jusqu'à ce que le viseur soit sur la cible.  " + (Sensors.raison ? '<span class="dim">(' + Sensors.raison + ')</span>' : "")); }
    }
    function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3800); }

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

    raf = requestAnimationFrame(frame); demarrage();
    return {
      destroy() { cancelAnimationFrame(raf); clearTimeout(skipTimer); Audio2.stopPing(); window.removeEventListener("resize", resize); document.removeEventListener("keydown", onKey); setFull(false); },
      state: () => ({ started, done, dist: frame.dist, target, hold, tol, full })
    };
  }
  window.Aim = { mount };
})();
