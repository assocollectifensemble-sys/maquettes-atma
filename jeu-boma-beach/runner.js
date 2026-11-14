/* runner.js v4 · Atma Digital · thème boma-beach · 3D (three.js, MIT) avec repli 2D */
/* ==========================================================================
   RUNNER.JS — Atma Digital · « Défi du mois »
   Runner 3 couloirs vu de derrière, pseudo-3D sur canvas 2D. Aucune dépendance.

   API :
     Runner.start(container, opts) -> Promise<{score, coins, distance, duration}>
     Runner.stop()
     opts = { theme, duration (0 = illimité), best, paliers:[{n,label}] ou ["25 🐚 : un sirop"],
              onCoin(n), onEnd(result), sound:false, labelRejouer:'Rejouer' }
   La Promise se résout au clic sur le bouton de l'écran de fin (ou sur stop()).

   Game design (repris des runners qui marchent : Subway Surfers, Temple Run) :
   - vitesse douce : 5 s à vitesse fixe puis montée logarithmique, +40 % max à 65 s, plafonnée ;
   - obstacles en « chunks » dessinés à la main (toujours un passage), inversés au hasard,
     déverrouillés par niveau ; tempo des rangées qui se resserre doucement ;
   - tutoriel intégré dans les premières secondes (pièces seules, puis 1 obstacle de chaque type) ;
   - tampon d'entrée (saut demandé en l'air = saut à l'atterrissage), plongeon en l'air (glisse bas),
     choc latéral contre un mur = simple rebond ;
   - juice : squash & stretch, particules, shake, hit-stop, vibration, compteur qui « pop »,
     combo ×2/×3, frôlés récompensés, paliers fêtés pendant la course ;
   - 1 bonus (bouclier + aimant) et 1 seconde chance (2 s d'invulnérabilité) par partie.
   ========================================================================== */
(function () {
  'use strict';

  var EMOFONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  var UIFONT = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';

  // ---------------------------------------------------------------- réglages
  var C = {
    v0: 10,            // couloirs/s au départ (1 unité = 1 couloir)
    vGain: 0.40,       // +40 % max
    rampDelay: 5,      // 5 s à vitesse confortable
    rampSpan: 60,      // le maximum est atteint 60 s plus tard
    laneLerp: 17,      // vitesse du changement de couloir (≈ 0,15 s)
    jumpT: 0.62, jumpH: 1.25, slideT: 0.66, dive: -15,
    zFar: 64, zSpawn: 80, camH: 3.0, camD: 4.0,
    bufT: 0.18, invulT: 2.0, shieldT: 9, comboWin: 1.4
  };
  var GRAV = 8 * C.jumpH / (C.jumpT * C.jumpT), VJUMP = 4 * C.jumpH / C.jumpT;

  function speedAt(t) {
    var u = Math.max(0, t - C.rampDelay);
    var k = Math.min(1, Math.log(1 + u / 8) / Math.log(1 + C.rampSpan / 8));
    return C.v0 * (1 + C.vGain * k);
  }

  // ---------------------------------------------------------------- outils
  var rs = 1;
  function rnd() { rs = (rs + 0x6D2B79F5) | 0; var t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hex(h) { h = String(h || '#888').replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { var A = hex(a), B = hex(b), r = [0, 0, 0]; for (var i = 0; i < 3; i++) r[i] = Math.round(A[i] + (B[i] - A[i]) * t); return '#' + ((1 << 24) + (r[0] << 16) + (r[1] << 8) + r[2]).toString(16).slice(1); }
  function rgba(h, a) { var A = hex(h); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function lum(h) { var A = hex(h); return (0.2126 * A[0] + 0.7152 * A[1] + 0.0722 * A[2]) / 255; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mkCv(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function vib(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* facultatif */ } }

  // ---------------------------------------------------------------- thème
  var DEF = {
    titre: 'Le défi du mois', joueur: '🏄', obstacles: { haut: '🦀', bas: '🌴', mur: '🚧' },
    noms: { haut: 'le crabe', bas: 'la branche', mur: 'la barrière' },
    piece: '🐚', bonus: '🏄', bonusNom: 'Super-planche',
    ciel: ['#ffb26b', '#ffe2a8'], sol: ['#e9d3a6', '#dcc18f'], mer: ['#2aa7b8', '#0d5d73'],
    decor: 'plage', accent: '#ff7a45', mur: null, props: null, maisons: null
  };
  function mergeTheme(t) {
    var o = {}, k;
    for (k in DEF) o[k] = DEF[k];
    for (k in t) if (t[k] != null) o[k] = t[k];
    o.obstacles = { haut: (t.obstacles && t.obstacles.haut) || DEF.obstacles.haut, bas: (t.obstacles && t.obstacles.bas) || DEF.obstacles.bas, mur: (t.obstacles && t.obstacles.mur) || DEF.obstacles.mur };
    o.noms = { haut: (t.noms && t.noms.haut) || DEF.noms.haut, bas: (t.noms && t.noms.bas) || DEF.noms.bas, mur: (t.noms && t.noms.mur) || DEF.noms.mur };
    if (!o.mur) o.mur = mix(o.accent, '#2a2a2a', 0.25);
    if (['plage', 'ville', 'ponton'].indexOf(o.decor) < 0) o.decor = 'plage';
    return o;
  }
  function parsePaliers(p) {
    var out = [];
    (p || []).forEach(function (x) {
      if (x && typeof x === 'object' && +x.n > 0) out.push({ n: +x.n, label: String(x.label || '') });
      else if (typeof x === 'string') { var m = x.match(/^\s*(\d+)\s*[^:]*:\s*(.+)$/); if (m) out.push({ n: +m[1], label: m[2].trim() }); }
    });
    out.sort(function (a, b) { return a.n - b.n; });
    return out;
  }

  // ---------------------------------------------------------------- chunks
  // Une ligne = un temps (beat). Colonnes = couloirs gauche, centre, droite.
  // .  vide   o pièce   H à sauter   J à sauter + arc de pièces   B à glisser dessous   M mur (contourner)   * bonus
  var CHUNKS = [
    [0, ['.o.', '.o.', '.J.', '.o.', '.o.']],
    [0, ['o..', 'o..', 'oM.', 'o..', 'o..']],
    [0, ['.o.', '.o.', '.B.', '.o.']],
    [0, ['.o.', 'HoH', '.o.', '.o.']],
    [0, ['.o.', 'MoM', '.o.']],
    [0, ['Jo.', '.o.', '.oJ']],
    [0, ['o.o', 'oMo', 'o.o']],
    [0, ['..o', '.Mo', '..o', '...', 'o..', 'oM.', 'o..']],
    [0, ['B..', '.o.', '.oB', '.o.']],
    [1, ['..o', 'MMo', '..o', '...', 'o..', 'oMM', 'o..']],
    [1, ['...', 'BBB', 'ooo', 'ooo']],
    [1, ['JJJ', '...', '.o.', '.o.']],
    [1, ['HMB', '...', 'oMo', 'BMH']],
    [1, ['M.M', '.o.', '.B.', '.o.', 'M.M']],
    [1, ['.M.', 'oMo', 'oMo', 'o.o']],
    [1, ['o.M', 'o.M', 'oHM', 'o.M', '..M']],
    [1, ['oHH', 'o..', 'o..', 'MMo', '..o']],
    [2, ['M..', '.M.', '..M', '...', 'o..', 'o..']],
    [2, ['MBM', '...', 'MHM', '.o.']],
    [2, ['HHM', '...', 'MBB', '...', 'o..']],
    [2, ['.M.', 'oMo', 'BMH', '...', '.o.']],
    [2, ['MM.', '..o', '...', '.MM', 'o..', '...', 'MM.']],
    [2, ['JMJ', '...', 'MBM', '.o.']],
    [3, ['MMB', '...', 'HMM', '...', 'MBM']],
    [3, ['JJM', '...', 'MBB', '...', 'HMH']],
    [3, ['M.M', 'M.M', 'MBM', 'MoM', 'M.M']],
    [3, ['.MM', '..M', 'B.M', '..M', 'H..']],
    [3, ['BHB', '...', 'MMo', '..o', 'oMM']]
  ];

  // ---------------------------------------------------------------- CSS
  var cssDone = false;
  function injectCSS() {
    if (cssDone) return; cssDone = true;
    var s = document.createElement('style');
    s.textContent = [
      '.rnr-wrap{position:absolute;inset:0;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:contain;font-family:' + UIFONT + ';background:#0b1a20;color:#fff;contain:strict}',
      '.rnr-wrap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}',
      '.rnr-ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:16px;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,.18),rgba(0,0,0,.6));touch-action:none}',
      '.rnr-ov.on{display:flex}',
      '.rnr-card{width:min(350px,100%);max-height:100%;overflow:hidden;background:rgba(255,255,255,.97);color:#1d2430;border-radius:24px;padding:18px 16px 16px;box-shadow:0 24px 60px rgba(0,0,0,.4);text-align:center;animation:rnrIn .4s cubic-bezier(.2,1.4,.4,1) both}',
      '.rnr-kicker{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--acc-d);font-weight:900}',
      '.rnr-card h2{margin:4px 0 10px;font-size:23px;line-height:1.12;font-weight:900;letter-spacing:-.01em}',
      '.rnr-how{list-style:none;margin:0;padding:0;display:grid;gap:7px;text-align:left}',
      '.rnr-how li{display:flex;align-items:center;gap:10px;background:#f2f4f7;border-radius:14px;padding:7px 10px;font-size:13.5px;font-weight:650;line-height:1.25}',
      '.rnr-ico{font-size:21px;min-width:50px;text-align:center;font-family:' + EMOFONT + '}',
      '.rnr-count{font-size:60px;font-weight:900;color:var(--acc-d);height:70px;line-height:70px;margin-top:4px}',
      '.rnr-pop{animation:rnrPop .55s cubic-bezier(.2,1.6,.4,1) both}',
      '.rnr-btn{appearance:none;-webkit-appearance:none;border:0;border-radius:16px;background:var(--acc);color:var(--ink);font:inherit;font-size:19px;font-weight:900;padding:15px 18px;width:100%;margin-top:14px;box-shadow:0 6px 0 var(--acc-d);cursor:pointer;touch-action:manipulation}',
      '.rnr-btn:active{transform:translateY(4px);box-shadow:0 2px 0 var(--acc-d)}',
      '.rnr-snd{position:absolute;top:58px;right:10px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.34);color:#fff;font-size:17px;line-height:36px;padding:0;text-align:center;cursor:pointer;font-family:' + EMOFONT + ';touch-action:manipulation;z-index:2}',
      '.rnr-score{font-size:58px;font-weight:900;line-height:1;margin:4px 0 0;letter-spacing:-.02em;font-variant-numeric:tabular-nums}',
      '.rnr-sub{font-size:13px;color:#677284;font-weight:650;margin-top:4px}',
      '.rnr-rec{display:inline-block;background:linear-gradient(135deg,#ffe066,#ffb703);color:#3b2a00;border-radius:999px;padding:5px 12px;font-weight:900;font-size:13px;margin-top:6px;animation:rnrPop .6s .5s cubic-bezier(.2,1.6,.4,1) both}',
      '.rnr-stats{display:flex;gap:7px;justify-content:center;margin:12px 0 10px}',
      '.rnr-stat{flex:1;background:#f2f4f7;border-radius:14px;padding:8px 4px 7px;font-size:11.5px;color:#677284;font-weight:650}',
      '.rnr-stat b{display:block;font-size:20px;color:#1d2430;font-weight:900;font-variant-numeric:tabular-nums}',
      '.rnr-goal{background:var(--acc-l);border-radius:16px;padding:10px 12px 11px;font-weight:800;font-size:14.5px;line-height:1.3;color:#1d2430}',
      '.rnr-goal small{display:block;font-weight:650;font-size:12px;color:#4d5868;margin-top:2px}',
      '.rnr-bar{height:10px;background:rgba(0,0,0,.08);border-radius:6px;overflow:hidden;margin-top:8px}',
      '.rnr-bar i{display:block;height:100%;width:0;background:var(--acc);border-radius:6px;transition:width 1.1s .35s cubic-bezier(.2,.9,.3,1)}',
      '@keyframes rnrIn{from{transform:scale(.86) translateY(24px);opacity:0}to{transform:none;opacity:1}}',
      '@keyframes rnrPop{0%{transform:scale(2.1);opacity:0}45%{opacity:1}100%{transform:scale(1);opacity:1}}',
      '@media (max-height:600px){.rnr-card{padding:14px 14px 12px}.rnr-card h2{font-size:20px;margin-bottom:8px}.rnr-how li{padding:5px 9px;font-size:12.5px}.rnr-count{height:56px;line-height:56px;font-size:50px}.rnr-score{font-size:48px}.rnr-btn{padding:12px;margin-top:10px}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------------- sprites
  function emojiCv(ch, px, glow) {
    var pad = Math.round(px * 0.14), c = mkCv(px + pad * 2, px + pad * 2), g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = Math.round(px * 0.84) + 'px ' + EMOFONT;
    var x = c.width / 2, y = c.height / 2 + px * 0.05;
    if (glow) { g.shadowColor = glow; g.shadowBlur = px * 0.09; g.fillText(ch, x, y); g.fillText(ch, x, y); g.shadowBlur = 0; }
    g.fillText(ch, x, y);
    c._k = c.width / px; // rapport taille du canvas / taille de l'emoji
    return c;
  }

  function sprPalm(night) {
    var c = mkCv(200, 360), g = c.getContext('2d');
    g.lineCap = 'round';
    var trunk = night ? '#2e2a26' : '#8b6a47', bx = 92, by = 358, tx = 112, ty = 96;
    g.strokeStyle = trunk; g.lineWidth = 17; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(70, 220, tx, ty); g.stroke();
    g.strokeStyle = night ? 'rgba(0,0,0,.35)' : 'rgba(60,35,10,.28)'; g.lineWidth = 3;
    for (var i = 1; i < 14; i++) { var t = i / 14, x = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * 70 + t * t * tx, y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * 220 + t * t * ty; g.beginPath(); g.moveTo(x - 8, y + 2); g.lineTo(x + 8, y - 2); g.stroke(); }
    var A = [-3.05, -2.55, -2.05, -1.45, -0.85, -0.3, 0.2, -1.75];
    for (var j = 0; j < A.length; j++) {
      var a = A[j], L = j === 7 ? 62 : 96, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + 34, cx = tx + Math.cos(a) * L * 0.55, cy = ty + Math.sin(a) * L * 0.55 - 14;
      g.fillStyle = j % 2 ? (night ? '#173326' : '#2d8a4b') : (night ? '#1e3e2d' : '#3aa35a');
      g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(cx, cy - 12, ex, ey); g.quadraticCurveTo(cx + 4, cy + 12, tx, ty + 6); g.fill();
      g.strokeStyle = night ? 'rgba(0,0,0,.3)' : 'rgba(10,60,25,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, ty + 2); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    }
    g.fillStyle = night ? '#3a2a1c' : '#6b4423';
    [[106, 104], [118, 106], [111, 113]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 7, 0, 6.3); g.fill(); });
    return { c: c, wu: 3.6 * 200 / 360, hu: 3.6, ax: bx / 200 };
  }
  function sprParasol(acc, night) {
    var c = mkCv(180, 200), g = c.getContext('2d');
    g.strokeStyle = night ? '#555' : '#d8d8d8'; g.lineWidth = 6; g.beginPath(); g.moveTo(90, 200); g.lineTo(90, 40); g.stroke();
    g.save(); g.beginPath(); g.moveTo(6, 78); g.quadraticCurveTo(90, -22, 174, 78);
    for (var i = 6; i >= 0; i--) g.quadraticCurveTo(6 + i * 24 + 12, 92, 6 + i * 24, 78);
    g.closePath(); g.clip();
    for (var k = 0; k < 7; k++) { g.fillStyle = k % 2 ? (night ? '#cfc8b8' : '#ffffff') : (night ? mix(acc, '#000', 0.35) : acc); g.fillRect(6 + k * 24, 0, 24, 100); }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 62, 180, 40);
    g.restore();
    g.fillStyle = night ? '#777' : '#eee'; g.beginPath(); g.arc(90, 26, 5, 0, 6.3); g.fill();
    return { c: c, wu: 1.9 * 180 / 200, hu: 1.9, ax: 0.5 };
  }
  function sprLamp(night) {
    var c = mkCv(120, 320), g = c.getContext('2d');
    if (night) { var gr = g.createRadialGradient(80, 46, 2, 80, 46, 58); gr.addColorStop(0, 'rgba(255,214,140,.85)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, 120, 120); }
    g.strokeStyle = '#26303b'; g.lineCap = 'round'; g.lineWidth = 7; g.beginPath(); g.moveTo(40, 318); g.lineTo(40, 50); g.quadraticCurveTo(42, 28, 74, 32); g.stroke();
    g.fillStyle = '#26303b'; g.beginPath(); g.moveTo(64, 32); g.lineTo(96, 32); g.lineTo(90, 44); g.lineTo(70, 44); g.closePath(); g.fill();
    g.fillStyle = night ? '#ffe7a8' : '#f4efe0'; g.beginPath(); g.ellipse(80, 46, 9, 5, 0, 0, 6.3); g.fill();
    g.fillStyle = '#26303b'; g.fillRect(32, 300, 16, 18);
    return { c: c, wu: 3.2 * 120 / 320, hu: 3.2, ax: 40 / 120 };
  }
  function sprTiki(night) {
    var c = mkCv(90, 240), g = c.getContext('2d');
    var gr = g.createRadialGradient(45, 34, 2, 45, 34, 44); gr.addColorStop(0, night ? 'rgba(255,170,60,.8)' : 'rgba(255,190,90,.35)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 90, 90);
    g.fillStyle = night ? '#6e5534' : '#c9a066'; g.fillRect(40, 60, 10, 180);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (var y = 90; y < 240; y += 34) g.fillRect(38, y, 14, 4);
    g.fillStyle = night ? '#4a3a26' : '#8a6a3c'; g.beginPath(); g.moveTo(30, 52); g.lineTo(60, 52); g.lineTo(54, 66); g.lineTo(36, 66); g.closePath(); g.fill();
    g.fillStyle = '#ff8a1f'; g.beginPath(); g.moveTo(45, 14); g.quadraticCurveTo(60, 36, 54, 52); g.lineTo(36, 52); g.quadraticCurveTo(30, 36, 45, 14); g.fill();
    g.fillStyle = '#ffd34d'; g.beginPath(); g.moveTo(45, 28); g.quadraticCurveTo(53, 42, 50, 52); g.lineTo(40, 52); g.quadraticCurveTo(37, 42, 45, 28); g.fill();
    return { c: c, wu: 2.3 * 90 / 240, hu: 2.3, ax: 0.5 };
  }
  function sprBoat(acc, night) {
    var c = mkCv(300, 170), g = c.getContext('2d');
    g.fillStyle = night ? '#9aa3ad' : '#ffffff';
    g.beginPath(); g.moveTo(10, 98); g.lineTo(290, 98); g.quadraticCurveTo(278, 150, 230, 154); g.lineTo(60, 154); g.quadraticCurveTo(24, 148, 10, 98); g.fill();
    g.fillStyle = night ? mix(acc, '#000', 0.4) : acc; g.fillRect(14, 112, 274, 12);
    g.fillStyle = night ? '#3c5d74' : '#7fd3ff'; for (var i = 0; i < 6; i++) { g.beginPath(); g.ellipse(70 + i * 34, 138, 9, 6, 0, 0, 6.3); g.fill(); }
    g.strokeStyle = night ? '#777' : '#cfd6dd'; g.lineWidth = 5; for (var k = 0; k < 4; k++) { g.beginPath(); g.moveTo(60 + k * 60, 98); g.lineTo(60 + k * 60, 50); g.stroke(); }
    g.fillStyle = night ? '#4a5560' : '#f5f0e6'; rr(g, 40, 34, 220, 22, 10); g.fill();
    g.fillStyle = night ? mix(acc, '#000', 0.4) : acc; g.fillRect(40, 50, 220, 6);
    return { c: c, wu: 3.6, hu: 3.6 * 170 / 300, ax: 0.5 };
  }
  function sprBanner(acc, ch) {
    var c = mkCv(300, 210), g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, 4, 10, 292, 160, 18); g.fill();
    g.save(); rr(g, 0, 4, 300, 160, 18); g.clip();
    g.fillStyle = acc; g.fillRect(0, 0, 300, 170);
    g.fillStyle = 'rgba(255,255,255,.28)'; for (var x = -200; x < 340; x += 44) { g.beginPath(); g.moveTo(x, 170); g.lineTo(x + 22, 170); g.lineTo(x + 182, 0); g.lineTo(x + 160, 0); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 4, 300, 8);
    g.restore();
    g.fillStyle = mix(acc, '#000', 0.25); for (var i = 0; i < 10; i++) { g.beginPath(); g.moveTo(8 + i * 29, 160); g.lineTo(37 + i * 29, 160); g.lineTo(22 + i * 29, 196); g.closePath(); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(150, 86, 62, 0, 6.3); g.fill();
    g.strokeStyle = mix(acc, '#000', 0.2); g.lineWidth = 5; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '86px ' + EMOFONT; g.fillText(ch, 150, 92);
    return c;
  }
  function sprWall(col, acc, ch) {
    var c = mkCv(220, 420), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 220, 0); gr.addColorStop(0, mix(col, '#fff', 0.12)); gr.addColorStop(1, mix(col, '#000', 0.12));
    g.fillStyle = gr; rr(g, 0, 0, 220, 420, 18); g.fill();
    function hazard(y, h) {
      g.save(); g.beginPath(); g.rect(10, y, 200, h); g.clip();
      g.fillStyle = '#1e1e1e'; g.fillRect(10, y, 200, h);
      g.fillStyle = '#ffcf33'; for (var x = -40; x < 240; x += 40) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + 20, y + h); g.lineTo(x + 20 + h, y); g.lineTo(x + h, y); g.closePath(); g.fill(); }
      g.restore();
    }
    hazard(14, 34);
    // flèches « contourne » : lecture immédiate « change de couloir »
    g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
    [[-1, 62], [1, 158]].forEach(function (a) { var d = a[0], cx = a[1], cy = 335; g.beginPath(); g.moveTo(cx + d * 34, cy); g.lineTo(cx - d * 4, cy - 30); g.lineTo(cx - d * 4, cy - 13); g.lineTo(cx - d * 34, cy - 13); g.lineTo(cx - d * 34, cy + 13); g.lineTo(cx - d * 4, cy + 13); g.lineTo(cx - d * 4, cy + 30); g.closePath(); g.fill(); g.stroke(); });
    g.fillStyle = 'rgba(255,255,255,.95)'; rr(g, 24, 112, 172, 172, 30); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '128px ' + EMOFONT; g.fillText(ch, 110, 205);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; rr(g, 4, 4, 212, 412, 16); g.stroke();
    return c;
  }
  function sprHurdle() {
    var c = mkCv(200, 40), g = c.getContext('2d');
    rr(g, 0, 0, 200, 40, 8); g.save(); g.clip();
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 200, 40);
    g.fillStyle = '#e63946'; for (var x = -40; x < 240; x += 40) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 20, 40); g.lineTo(x + 40, 0); g.lineTo(x + 20, 0); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 30, 200, 10);
    g.restore(); g.strokeStyle = '#2b2b2b'; g.lineWidth = 3; rr(g, 1.5, 1.5, 197, 37, 7); g.stroke();
    return c;
  }
  function sprToken(ch, acc) {
    // jeton doré bien contrasté + emoji de la pièce : lisible sur sable clair comme sur ponton sombre
    var c = mkCv(140, 140), g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(70, 74, 62, 0, 6.3); g.fill();
    var gr = g.createLinearGradient(0, 8, 0, 132); gr.addColorStop(0, '#fff3a8'); gr.addColorStop(0.5, '#ffc928'); gr.addColorStop(1, '#e08a00');
    g.fillStyle = gr; g.beginPath(); g.arc(70, 70, 62, 0, 6.3); g.fill();
    g.lineWidth = 6; g.strokeStyle = '#fff8d6'; g.stroke();
    g.fillStyle = '#fffdf3'; g.beginPath(); g.arc(70, 70, 46, 0, 6.3); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '62px ' + EMOFONT; g.fillText(ch, 70, 74);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(48, 34, 16, 8, -0.6, 0, 6.3); g.fill();
    return c;
  }
  function sprGlow(col) {
    var c = mkCv(96, 96), g = c.getContext('2d'), gr = g.createRadialGradient(48, 48, 2, 48, 48, 48);
    gr.addColorStop(0, rgba(col, 0.75)); gr.addColorStop(0.45, rgba(col, 0.28)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return c;
  }

  // ======================================================================
  //   PARTIE
  // ======================================================================
  function createGame(container, opts, resolve) {
    var th = mergeTheme(opts.theme || {});
    var night = lum(th.ciel[0]) < 0.22;
    var duration = +opts.duration || 0, best0 = +opts.best || 0;
    var paliers = parsePaliers(opts.paliers);
    var onCoin = typeof opts.onCoin === 'function' ? opts.onCoin : null;
    var onEnd = typeof opts.onEnd === 'function' ? opts.onEnd : null;
    var decor = th.decor;
    rs = (Date.now() ^ (Math.random() * 1e9)) | 0;

    injectCSS();
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    var wrap = document.createElement('div'); wrap.className = 'rnr-wrap';
    var accD = mix(th.accent, '#000', 0.28);
    wrap.style.setProperty('--acc', th.accent);
    wrap.style.setProperty('--acc-d', lum(th.accent) > 0.6 ? mix(th.accent, '#000', 0.45) : accD);
    wrap.style.setProperty('--acc-l', mix(th.accent, '#fff', 0.82));
    wrap.style.setProperty('--ink', lum(th.accent) > 0.58 ? '#1d1608' : '#ffffff');
    var cv = document.createElement('canvas'); cv.setAttribute('aria-label', 'Jeu : ' + th.titre);
    var ctx = cv.getContext('2d', { alpha: false });
    var ov = document.createElement('div'); ov.className = 'rnr-ov';
    var sndBtn = document.createElement('button'); sndBtn.className = 'rnr-snd'; sndBtn.type = 'button';
    wrap.appendChild(cv); wrap.appendChild(ov); wrap.appendChild(sndBtn);
    container.appendChild(wrap);

    // ------------------------------------------------ son (WebAudio, coupé par défaut)
    var AC = null, sndOn = !!opts.sound, noise = null;
    function ac() {
      if (!AC) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { AC = new A(); } catch (e) { return null; } }
      if (AC.state === 'suspended') AC.resume();
      return AC;
    }
    function tone(f, d, type, vol, f2, delay) {
      if (!sndOn) return; var a = ac(); if (!a) return;
      var t = a.currentTime + (delay || 0), o = a.createOscillator(), gn = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + d + 0.03);
    }
    function thud() {
      if (!sndOn) return; var a = ac(); if (!a) return;
      if (!noise) { noise = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate); var d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); }
      var s = a.createBufferSource(), gn = a.createGain(), f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      s.buffer = noise; gn.gain.value = 0.35; s.connect(f); f.connect(gn); gn.connect(a.destination); s.start();
      tone(160, 0.25, 'sine', 0.3, 60);
    }
    var SFX = {
      coin: function (c) { var f = 880 * Math.pow(2, Math.min(c, 14) / 24); tone(f, 0.08, 'triangle', 0.13); tone(f * 1.5, 0.1, 'sine', 0.06, 0, 0.04); },
      jump: function () { tone(280, 0.18, 'square', 0.04, 640); },
      slide: function () { tone(420, 0.16, 'sawtooth', 0.03, 160); },
      lane: function () { tone(520, 0.04, 'sine', 0.04, 640); },
      near: function () { tone(1100, 0.08, 'sine', 0.08, 1700); tone(1650, 0.08, 'sine', 0.05, 0, 0.06); },
      power: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.12, 'triangle', 0.1, 0, i * 0.07); }); },
      palier: function () { [659, 784, 988, 1319].forEach(function (f, i) { tone(f, 0.16, 'triangle', 0.12, 0, i * 0.09); }); },
      go: function () { tone(660, 0.12, 'square', 0.05); tone(990, 0.2, 'square', 0.05, 0, 0.1); },
      tick: function () { tone(440, 0.08, 'square', 0.04); },
      hit: thud
    };
    function sndLabel() { sndBtn.textContent = sndOn ? '🔊' : '🔇'; sndBtn.setAttribute('aria-label', sndOn ? 'Son activé' : 'Activer le son'); }
    sndBtn.addEventListener('click', function (e) { e.stopPropagation(); sndOn = !sndOn; if (sndOn) { ac(); SFX.coin(0); } sndLabel(); });
    sndBtn.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    sndLabel();

    // ------------------------------------------------ géométrie
    var W = 390, H = 780, dpr = 1, PPL = 100, Y0 = 600, HY = 300, F = 400, CX = 195, zNear = -2, camX = 0;
    var P = { x: 0, y: 0, s: 1 };
    function proj(x, y, z) { var s = F / Math.max(z + C.camD, 0.2); P.s = s; P.x = CX + (x - camX) * s; P.y = HY + (C.camH - y) * s; }

    // ------------------------------------------------ ressources graphiques
    var spr = {}, bg = null, mtFar = null, mtNear = null, vign = null, fogG = null, seaG = null, groundG = null, mtH1 = 0, mtH2 = 0;
    var FONTS = {};
    var E = {
      player: emojiCv(th.joueur, 160, 'rgba(255,255,255,.95)'),
      haut: emojiCv(th.obstacles.haut, 128, 'rgba(255,255,255,.7)'),
      piece: emojiCv(th.piece, 96, null), bonus: emojiCv(th.bonus, 112, null),
      heart: emojiCv('❤️', 64, null), hand: emojiCv('👆', 96, 'rgba(0,0,0,.35)'), pieceHud: emojiCv(th.piece, 64, null)
    };
    var banner = sprBanner(th.accent, th.obstacles.bas), wallFace = sprWall(th.mur, th.accent, th.obstacles.mur);
    var glowGold = sprGlow('#ffd75e'), glowAcc = sprGlow(th.accent), token = sprToken(th.piece, th.accent), hurdle = sprHurdle();
    spr.palmier = sprPalm(night); spr.parasol = sprParasol(th.accent, night); spr.lampadaire = sprLamp(night);
    spr.tiki = sprTiki(night); spr.bateau = sprBoat(th.accent, night);
    var wallTop = mix(th.mur, '#ffffff', 0.25), wallSide = mix(th.mur, '#000000', 0.32), wallShade = mix(th.mur, '#000000', 0.5);
    var sol0 = th.sol[0], sol1 = th.sol[1] || mix(th.sol[0], '#000', 0.08);
    var laneCol = decor === 'ponton' ? 'rgba(60,35,15,.35)' : 'rgba(255,255,255,.75)';
    var curbA = decor === 'ponton' ? mix(sol0, '#000', 0.35) : th.accent, curbB = decor === 'ponton' ? mix(sol0, '#000', 0.5) : '#ffffff';
    var sideCol = decor === 'ville' ? mix(sol0, '#ffffff', 0.32) : decor === 'plage' ? mix(sol0, '#f3dfb2', 0.5) : th.mer[1];
    if (night && decor !== 'ponton') sideCol = mix(sideCol, '#0e2329', 0.35);
    var HOUSE = th.maisons || ['#f2c14e', '#e76f51', '#2a9d8f', '#f4a261', '#89c2d9', '#e9c46a', '#c8a2c8', '#8ab17d'];
    var ROOF = ['#b5463a', '#3d6b5e', '#7a3b2e', '#c0603a'];

    function buildBackground() {
      // ciel + soleil + nuages
      bg = mkCv(W * dpr, (HY + 6) * dpr); var g = bg.getContext('2d'); g.scale(dpr, dpr);
      var sky = g.createLinearGradient(0, 0, 0, HY); sky.addColorStop(0, th.ciel[0]); sky.addColorStop(1, th.ciel[1]);
      g.fillStyle = sky; g.fillRect(0, 0, W, HY + 6);
      var r0 = rs; rs = 7;
      if (night) { for (var i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.6) + ')'; var sz = rnd() < 0.15 ? 2 : 1.2; g.fillRect(rnd() * W, rnd() * HY * 0.7, sz, sz); } }
      var sx = W * 0.7, sy = HY * (night ? 0.3 : 0.8), sr = Math.max(18, PPL * (night ? 0.3 : 0.5));
      var gl = g.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 5);
      gl.addColorStop(0, night ? 'rgba(255,240,200,.35)' : 'rgba(255,248,215,.75)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gl; g.fillRect(0, 0, W, HY + 6);
      g.fillStyle = night ? '#f6efd6' : '#fff6cf'; g.beginPath(); g.arc(sx, sy, sr, 0, 6.3); g.fill();
      if (night) { g.fillStyle = th.ciel[0]; g.globalAlpha = 0.9; g.beginPath(); g.arc(sx + sr * 0.42, sy - sr * 0.2, sr * 0.85, 0, 6.3); g.fill(); g.globalAlpha = 1; }
      for (var k = 0; k < 5; k++) {
        var cx = rnd() * W, cy = HY * (0.12 + rnd() * 0.45), cw = W * (0.12 + rnd() * 0.16);
        g.fillStyle = night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.42)';
        g.beginPath(); g.ellipse(cx, cy, cw, cw * 0.18, 0, 0, 6.3); g.fill();
        g.beginPath(); g.ellipse(cx + cw * 0.3, cy - cw * 0.1, cw * 0.5, cw * 0.18, 0, 0, 6.3); g.fill();
      }
      // montagnes de l'île (loin) + collines ou toits (près), plus larges que l'écran pour la parallaxe
      mtH1 = Math.max(30, HY * 0.3); mtH2 = Math.max(20, HY * 0.17);
      mtFar = mkCv(W * 1.5 * dpr, mtH1 * dpr); g = mtFar.getContext('2d'); g.scale(dpr, dpr);
      var w2 = W * 1.5;
      g.fillStyle = mix(mix(th.ciel[1], th.ciel[0], 0.45), night ? '#000000' : '#3c5a6e', night ? 0.45 : 0.35);
      g.beginPath(); g.moveTo(0, mtH1);
      for (var x = 0; x <= w2; x += 6) {
        var u = x / w2, h = 0.35 + 0.18 * Math.sin(u * 9.1 + 1) + 0.1 * Math.sin(u * 23 + 2) + 0.05 * Math.sin(u * 61);
        h += 0.55 * Math.exp(-Math.pow((u - 0.62) / 0.09, 2)) + 0.3 * Math.exp(-Math.pow((u - 0.3) / 0.12, 2));
        if (decor === 'plage') h *= 0.35 + 0.65 * clamp((u - 0.18) * 2.2, 0, 1);
        g.lineTo(x, mtH1 * (1 - clamp(h, 0, 1) * 0.95));
      }
      g.lineTo(w2, mtH1); g.closePath(); g.fill();
      mtNear = mkCv(W * 1.5 * dpr, mtH2 * dpr); g = mtNear.getContext('2d'); g.scale(dpr, dpr);
      var nearCol = night ? '#0a1a1f' : mix(th.ciel[0], '#1f3b33', 0.7);
      g.fillStyle = nearCol;
      if (decor === 'ville') {
        g.beginPath(); g.moveTo(0, mtH2); var xx = 0;
        while (xx < w2) { var bw = 14 + rnd() * 26, bh = mtH2 * (0.35 + rnd() * 0.5); g.lineTo(xx, mtH2 - bh); g.lineTo(xx + bw * 0.5, mtH2 - bh - bw * 0.25); g.lineTo(xx + bw, mtH2 - bh); xx += bw; }
        g.lineTo(w2, mtH2); g.closePath(); g.fill();
        g.fillRect(w2 * 0.46, mtH2 * 0.02, 8, mtH2); // clocher
        if (night) { g.fillStyle = 'rgba(255,210,120,.8)'; for (var q = 0; q < 40; q++) g.fillRect(rnd() * w2, mtH2 * (0.5 + rnd() * 0.45), 2, 2); }
      } else {
        g.beginPath(); g.moveTo(0, mtH2);
        for (var x2 = 0; x2 <= w2; x2 += 5) { var u2 = x2 / w2, h2 = 0.4 + 0.25 * Math.sin(u2 * 13 + 0.5) + 0.12 * Math.sin(u2 * 37);
          if (decor === 'plage') h2 *= clamp((u2 - 0.35) * 3, 0, 1);
          g.lineTo(x2, mtH2 * (1 - clamp(h2, 0, 1))); }
        g.lineTo(w2, mtH2); g.closePath(); g.fill();
      }
      rs = r0;
      // vignette
      vign = mkCv(W * dpr / 2, H * dpr / 2); g = vign.getContext('2d');
      var vg = g.createRadialGradient(vign.width / 2, vign.height * 0.55, vign.height * 0.3, vign.width / 2, vign.height * 0.55, vign.height * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, night ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.22)');
      g.fillStyle = vg; g.fillRect(0, 0, vign.width, vign.height);
      // dégradés réutilisés à chaque image
      fogG = ctx.createLinearGradient(0, HY, 0, HY + (H - HY) * 0.22);
      fogG.addColorStop(0, rgba(th.ciel[1], 0.95)); fogG.addColorStop(1, rgba(th.ciel[1], 0));
      seaG = ctx.createLinearGradient(0, HY, 0, H); seaG.addColorStop(0, mix(th.mer[0], th.ciel[1], 0.35)); seaG.addColorStop(0.35, th.mer[0]); seaG.addColorStop(1, th.mer[1]);
      groundG = ctx.createLinearGradient(0, HY, 0, H); groundG.addColorStop(0, mix(sideCol, th.ciel[1], 0.35)); groundG.addColorStop(1, mix(sideCol, '#000', 0.12));
    }

    function resize() {
      var r = wrap.getBoundingClientRect();
      W = Math.max(240, Math.round(r.width)); H = Math.max(320, Math.round(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      PPL = Math.min(W * 0.29, H * 0.165); Y0 = H * 0.86; HY = Y0 - C.camH * PPL;
      if (HY < H * 0.27) { HY = H * 0.27; PPL = (Y0 - HY) / C.camH; }
      if (HY > H * 0.42) { HY = H * 0.42; PPL = (Y0 - HY) / C.camH; }
      F = PPL * C.camD; CX = W / 2;
      zNear = F * C.camH / (H - HY) - C.camD;
      var b = Math.round(Math.min(W, H * 0.6));
      FONTS.score = '900 ' + Math.round(b * 0.095) + 'px ' + UIFONT;
      FONTS.hud = '800 ' + Math.round(b * 0.056) + 'px ' + UIFONT;
      FONTS.small = '700 ' + Math.round(b * 0.032) + 'px ' + UIFONT;
      FONTS.prompt = '850 ' + Math.round(b * 0.05) + 'px ' + UIFONT;
      FONTS.pop = '900 ' + Math.round(b * 0.055) + 'px ' + UIFONT;
      FONTS.big = '900 ' + Math.round(b * 0.075) + 'px ' + UIFONT;
      FONTS.mult = '900 ' + Math.round(b * 0.042) + 'px ' + UIFONT;
      buildBackground();
      if (state !== 'run') render();
    }

    // ------------------------------------------------ pools (aucune allocation par image)
    function pool(n, f) { var a = []; for (var i = 0; i < n; i++) a.push(f()); return a; }
    var OBS = pool(56, function () { return { on: false, k: 'o', type: 0, lane: 0, wz: 0, len: 0.7, z: 0, done: false, crossed: false, tuto: null, tdir: '', tdone: false, burst: 0, free: 0 }; });
    var COINS = pool(160, function () { return { on: false, k: 'c', pw: false, lane: 0, x: 0, y: 0.45, wz: 0, z: 0, fly: false, tuto: null, tdir: '', tdone: false }; });
    var PROPS = pool(48, function () { return { on: false, k: 'p', kind: '', x: 0, wz: 0, z: 0, side: 1, ph: 0 }; });
    var HOUSES = pool(20, function () { return { on: false, side: 1, wz: 0, len: 6, h: 3, col: '#fff', roof: '#a33', z: 0 }; });
    var PARTS = pool(240, function () { return { on: false, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, r: 3, col: '#fff', sq: false }; });
    var POPS = pool(14, function () { return { on: false, txt: '', x: 0, y: 0, life: 0, max: 1, col: '#fff', big: false }; });
    var LINES = pool(14, function () { return { a: 0, p: 0, v: 0 }; });
    var PL = { k: 'P', z: 0 };
    var DL = new Array(56 + 160 + 48 + 2); var nDL = 0;

    function getObs() { for (var i = 0; i < OBS.length; i++) if (!OBS[i].on) return OBS[i]; return null; }
    function getCoin() { for (var i = 0; i < COINS.length; i++) if (!COINS[i].on) return COINS[i]; return null; }
    function getProp() { for (var i = 0; i < PROPS.length; i++) if (!PROPS[i].on) return PROPS[i]; return null; }

    function addObs(type, lane, wz, len) {
      var o = getObs(); if (!o) return null;
      o.on = true; o.type = type; o.lane = lane; o.wz = wz; o.len = len || 0.7; o.done = false; o.crossed = false; o.tuto = null; o.tdir = ''; o.tdone = false; o.burst = 0; o.free = 0;
      return o;
    }
    function addCoin(lane, wz, y, pw) {
      var c = getCoin(); if (!c) return null;
      c.on = true; c.pw = !!pw; c.lane = lane; c.x = lane; c.y = y == null ? 0.45 : y; c.wz = wz; c.fly = false; c.tuto = null; c.tdir = ''; c.tdone = false;
      return c;
    }
    function addArc(lane, wz, spd) {
      var jd = spd * C.jumpT, us = [-0.3, -0.15, 0, 0.15, 0.3];
      for (var i = 0; i < 5; i++) { var u = us[i]; addCoin(lane, wz + u * jd, 0.5 + C.jumpH * (1 - 4 * u * u) * 0.82); }
    }

    // ------------------------------------------------ état de la partie
    var state = 'ready', paused = false, raf = 0, last = 0, gt = 0, dist = 0, speed = C.v0, speedMul = 1;
    var px = 0, lane = 0, tlane = 0, prevLane = 0, laneT = -9, py = 0, vy = 0, air = false, diving = false, slide = 0, jumpBuf = 0, slideBuf = 0, jumpAt = -9, slideAt = -9;
    var sqx = 1, sqy = 1, tilt = 0, invul = 0, shield = 0, secondChance = true, hitStop = 0, shake = 0, dieT = 0, dieRot = 0, dieVy = 0, endReason = '';
    var coins = 0, pts = 0, score = 0, combo = 0, mult = 1, lastCoinT = -9, coinPop = 0, multPop = 0, palierIdx = 0, lastPower = 0, dustT = 0;
    var nextWZ = 0, lastChunk = -1, propNext = [0, 0], houseNext = [0, 0], garlandNext = 30, nearCount = 0;
    var flash = 0, flashCol = '#fff', scoreStr = '0', coinStr = '0', lastScoreShown = -1, lastCoinShown = -1, prompt = null, promptA = 0, promptTxt = '', promptDir = '', bravo = 0;
    var result = null, resolved = false, fpsN = 0, fpsT = 0, fps = 0, frameCount = 0, frameTime = 0;
    var DBG = window.Runner && window.Runner._debug;

    for (var li = 0; li < LINES.length; li++) { LINES[li].a = rnd() * 6.283; LINES[li].p = rnd(); LINES[li].v = 0.8 + rnd() * 0.8; }

    function beatT() { return 0.42 - 0.08 * clamp((gt - 8) / 60, 0, 1); }
    function level() { return gt < 22 ? 0 : gt < 40 ? 1 : gt < 60 ? 2 : 3; }

    function placeTuto() {
      var i, c;
      for (i = 0; i < 4; i++) { c = addCoin(1, 14 + i * 2.6); if (i === 0) { c.tuto = 'Glisse à droite'; c.tdir = 'right'; } }
      for (i = 0; i < 4; i++) { c = addCoin(-1, 36 + i * 2.6); if (i === 0) { c.tuto = 'Glisse à gauche'; c.tdir = 'left'; } }
      for (i = -1; i <= 1; i++) { var o = addObs(0, i, 74); if (i === 0) { o.tuto = 'Saute par-dessus ' + th.noms.haut; o.tdir = 'up'; } }
      addArc(-1, 74, C.v0 * 1.05);
      for (i = -1; i <= 1; i++) { var b = addObs(1, i, 96); if (i === 0) { b.tuto = 'Glisse vers le bas : passe dessous'; b.tdir = 'down'; } }
      addCoin(0, 96, 0.3);
      var free = rnd() < 0.5 ? -1 : 1;
      for (i = -1; i <= 1; i++) if (i !== free) { var m = addObs(2, i, 118, 1.4); if (i === 0) { m.tuto = 'Change de couloir'; m.tdir = 'lr'; m.free = free; } }
      for (i = 0; i < 3; i++) addCoin(free, 114 + i * 2.6);
      nextWZ = 136;
    }

    function placeChunk() {
      var L = level(), bt = beatT(), bz = speed * bt;
      // bonus de temps en temps
      if (gt > 12 && gt - lastPower > 22 && rnd() < 0.5) {
        lastPower = gt; var pl = Math.floor(rnd() * 3) - 1;
        addCoin(pl, nextWZ, 0.7, true); nextWZ += bz * 3; return;
      }
      var tot = 0, i, w;
      for (i = 0; i < CHUNKS.length; i++) if (CHUNKS[i][0] <= L && i !== lastChunk) tot += CHUNKS[i][0] === L ? 3 : CHUNKS[i][0] === L - 1 ? 2 : 1;
      var r = rnd() * tot, pick = 0;
      for (i = 0; i < CHUNKS.length; i++) { if (CHUNKS[i][0] > L || i === lastChunk) continue; w = CHUNKS[i][0] === L ? 3 : CHUNKS[i][0] === L - 1 ? 2 : 1; r -= w; if (r <= 0) { pick = i; break; } }
      lastChunk = pick;
      var rows = CHUNKS[pick][1], mir = rnd() < 0.5, lastM = [null, null, null];
      for (var ri = 0; ri < rows.length; ri++) {
        var wz = nextWZ + ri * bz, row = rows[ri];
        for (var j = 0; j < 3; j++) {
          var ch = row.charAt(mir ? 2 - j : j), ln = j - 1;
          if (ch === 'M') { if (lastM[j]) { lastM[j].len += bz; } else { lastM[j] = addObs(2, ln, wz, 1.4); } continue; }
          lastM[j] = null;
          if (ch === 'H') addObs(0, ln, wz);
          else if (ch === 'J') { addObs(0, ln, wz); addArc(ln, wz, speed); }
          else if (ch === 'B') addObs(1, ln, wz);
          else if (ch === 'o') addCoin(ln, wz);
          else if (ch === '*') addCoin(ln, wz, 0.7, true);
        }
      }
      nextWZ += rows.length * bz + bz * (L === 0 ? 2.2 : L === 1 ? 1.8 : 1.4);
    }

    function spawnProps() {
      for (var si = 0; si < 2; si++) {
        var side = si ? 1 : -1;
        while (propNext[si] - dist < C.zSpawn) {
          var p = getProp(); if (!p) break;
          p.on = true; p.side = side; p.wz = propNext[si]; p.ph = rnd() * 6.28;
          var kinds, gap;
          if (decor === 'plage') {
            kinds = (th.props && th.props[side < 0 ? 'g' : 'd']) || (side < 0 ? ['palmier', 'palmier', 'parasol'] : ['palmier', 'parasol', 'palmier', 'parasol']);
            p.kind = kinds[Math.floor(rnd() * kinds.length)];
            p.x = side * (p.kind === 'palmier' ? 2.5 + rnd() * (side < 0 ? 0.5 : 1.8) : 2.4 + rnd() * (side < 0 ? 0.4 : 1.2));
            gap = side < 0 ? 6 + rnd() * 7 : 3.5 + rnd() * 5;
          } else if (decor === 'ponton') {
            p.kind = 'pile'; p.x = side * 1.82; gap = 3;
            var q = getProp();
            if (q && rnd() < 0.22) { q.on = true; q.side = side; q.wz = p.wz + 1.5; q.ph = rnd() * 6.28; kinds = (th.props && th.props[side < 0 ? 'g' : 'd']) || ['bateau', 'lampadaire', 'bateau']; q.kind = kinds[Math.floor(rnd() * kinds.length)]; q.x = q.kind === 'bateau' ? side * (4.6 + rnd() * 2.5) : side * 1.78; }
          } else {
            kinds = (th.props && th.props[side < 0 ? 'g' : 'd']) || ['lampadaire', 'palmier', 'lampadaire'];
            p.kind = kinds[Math.floor(rnd() * kinds.length)]; p.x = side * (p.kind === 'palmier' ? 2.25 : 2.05); gap = 6 + rnd() * 6;
          }
          propNext[si] += gap;
        }
        if (decor === 'ville') {
          while (houseNext[si] - dist < C.zSpawn + 10) {
            var h = null; for (var k = 0; k < HOUSES.length; k++) if (!HOUSES[k].on) { h = HOUSES[k]; break; }
            if (!h) break;
            h.on = true; h.side = side; h.wz = houseNext[si]; h.len = 4.5 + rnd() * 3.5; h.h = 2.3 + rnd() * 1.1;
            h.col = HOUSE[Math.floor(rnd() * HOUSE.length)]; h.roof = ROOF[Math.floor(rnd() * ROOF.length)];
            houseNext[si] += h.len + (rnd() < 0.3 ? 1.2 + rnd() * 1.5 : 0.25);
          }
        }
      }
      if (decor !== 'plage') {
        while (garlandNext - dist < C.zSpawn) {
          var gp = getProp(); if (!gp) break;
          gp.on = true; gp.kind = 'guirlande'; gp.x = 0; gp.side = 0; gp.wz = garlandNext; gp.ph = rnd() * 6.28;
          garlandNext += decor === 'ville' ? 16 + rnd() * 10 : 26 + rnd() * 12;
        }
      }
    }

    // ------------------------------------------------ particules / popups
    function part(x, y, vx, vy, g, life, r, col, sq) {
      for (var i = 0; i < PARTS.length; i++) { var p = PARTS[i]; if (!p.on) { p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.g = g; p.life = p.max = life; p.r = r; p.col = col; p.sq = !!sq; return; } }
    }
    function burst(x, y, n, col, spd, g) { for (var i = 0; i < n; i++) { var a = rnd() * 6.283, v = spd * (0.4 + rnd() * 0.8); part(x, y, Math.cos(a) * v, Math.sin(a) * v - spd * 0.3, g, 0.4 + rnd() * 0.35, 2 + rnd() * 3, col, false); } }
    var CONF = ['#ff5d73', '#ffd23f', '#3bceac', '#4d9de0', '#ffffff', th.accent];
    function confetti(n) { for (var i = 0; i < n; i++) part(rnd() * W, -10 - rnd() * 60, (rnd() - 0.5) * 120, 80 + rnd() * 160, 160, 1.6 + rnd() * 1.2, 3 + rnd() * 3, CONF[i % CONF.length], true); }
    function popup(txt, x, y, col, big) {
      var p = null, i; for (i = 0; i < POPS.length; i++) if (!POPS[i].on) { p = POPS[i]; break; }
      if (!p) { p = POPS[0]; for (i = 1; i < POPS.length; i++) if (POPS[i].life < p.life) p = POPS[i]; }
      p.on = true; p.txt = txt; p.x = x; p.y = y; p.life = p.max = big ? 1.6 : 0.9; p.col = col || '#fff'; p.big = !!big;
    }

    // ------------------------------------------------ actions du joueur
    function act(dir) {
      if (state !== 'run' || paused) return;
      if (dir === 'left' || dir === 'right') {
        var d = dir === 'left' ? -1 : 1, nl = tlane + d;
        if (nl < -1 || nl > 1) { shake = Math.max(shake, 3); sqx = 0.85; sqy = 1.1; tilt = d * 0.25; return; }
        prevLane = tlane; tlane = nl; laneT = gt; tilt = d * 0.32; sqx = 0.86; sqy = 1.1; SFX.lane();
      } else if (dir === 'up') {
        if (!air) doJump(); else jumpBuf = C.bufT;
      } else if (dir === 'down') {
        if (air) { diving = true; vy = Math.min(vy, C.dive); slideBuf = C.bufT + 0.2; jumpBuf = 0; }
        else doSlide();
      }
      if (prompt && !prompt.tdone) {
        var ok = prompt.tdir === dir || (prompt.tdir === 'lr' && (dir === 'left' || dir === 'right'));
        if (ok) { prompt.tdone = true; bravo = 0.9; }
      }
    }
    function doJump() {
      air = true; diving = false; vy = VJUMP; slide = 0; jumpAt = gt; jumpBuf = 0; sqx = 0.72; sqy = 1.32; SFX.jump();
      proj(px, 0, 0); for (var i = 0; i < 6; i++) part(P.x + (rnd() - 0.5) * P.s * 0.5, P.y, (rnd() - 0.5) * 80, -rnd() * 50, 200, 0.35, 2.5 + rnd() * 2, 'rgba(255,255,255,.7)');
    }
    function doSlide() { slide = C.slideT; slideAt = gt; slideBuf = 0; sqx = 1.35; sqy = 0.5; SFX.slide(); }

    // ------------------------------------------------ entrées : swipe tactile, tap gauche/droite, souris, clavier
    var tS = { id: -1, x: 0, y: 0, t: 0, sw: false, lx: 0, ly: 0 };
    function swipeTh() { return Math.max(22, Math.min(W, H) * 0.065); }
    function gStart(x, y) { tS.x = tS.lx = x; tS.y = tS.ly = y; tS.t = performance.now(); tS.sw = false; }
    function gMove(x, y) {
      var dx = x - tS.lx, dy = y - tS.ly, th2 = swipeTh();
      if (Math.abs(dx) < th2 && Math.abs(dy) < th2) return;
      if (Math.abs(dx) > Math.abs(dy)) act(dx > 0 ? 'right' : 'left'); else act(dy < 0 ? 'up' : 'down');
      tS.sw = true; tS.lx = x; tS.ly = y; // une même glissade peut enchaîner deux gestes
    }
    function gEnd(x, y) {
      if (state === 'paused') return;
      if (!tS.sw) {
        var dx = x - tS.x, dy = y - tS.y, dt = performance.now() - tS.t;
        if (Math.abs(dx) < swipeTh() && Math.abs(dy) < swipeTh() && dt < 350) act(x < W / 2 ? 'left' : 'right');
      }
    }
    function rel(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function onTS(e) { e.preventDefault(); if (tS.id !== -1) return; var t = e.changedTouches[0]; tS.id = t.identifier; var p = rel(t); gStart(p.x, p.y); }
    function onTM(e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier === tS.id) { var p = rel(t); gMove(p.x, p.y); } } }
    function onTE(e) { e.preventDefault(); for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier === tS.id) { var p = rel(t); if (e.type === 'touchend') gEnd(p.x, p.y); tS.id = -1; } } }
    var mDown = false;
    function onPD(e) { if (e.pointerType !== 'mouse') return; mDown = true; var p = rel(e); gStart(p.x, p.y); }
    function onPM(e) { if (e.pointerType !== 'mouse' || !mDown) return; var p = rel(e); gMove(p.x, p.y); }
    function onPU(e) { if (e.pointerType !== 'mouse' || !mDown) return; mDown = false; var p = rel(e); gEnd(p.x, p.y); }
    var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', q: 'left', d: 'right', w: 'up', z: 'up', s: 'down', ' ': 'up' };
    function onKey(e) { var k = KEYS[e.key]; if (k && state === 'run') { e.preventDefault(); act(k); } }
    function noScroll(e) { if (e.cancelable && !(e.target && e.target.closest && e.target.closest('button'))) e.preventDefault(); }
    function onVis() { if (document.hidden && state === 'run') pause(); }
    cv.addEventListener('touchstart', onTS, { passive: false });
    cv.addEventListener('touchmove', onTM, { passive: false });
    cv.addEventListener('touchend', onTE, { passive: false });
    cv.addEventListener('touchcancel', onTE, { passive: false });
    cv.addEventListener('pointerdown', onPD); window.addEventListener('pointermove', onPM); window.addEventListener('pointerup', onPU);
    window.addEventListener('keydown', onKey);
    wrap.addEventListener('touchmove', noScroll, { passive: false });
    document.addEventListener('visibilitychange', onVis);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { resize(); }) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', resize);

    // ------------------------------------------------ écrans (Prêt ? / Pause / Fin)
    function showReady() {
      ov.innerHTML = '<div class="rnr-card"><div class="rnr-kicker">Défi du mois</div><h2>' + esc(th.titre) + '</h2>' +
        '<ul class="rnr-how">' +
        '<li><span class="rnr-ico">👈 👉</span><span>Glisse à gauche ou à droite : change de couloir et contourne ' + esc(th.obstacles.mur) + '</span></li>' +
        '<li><span class="rnr-ico">👆 ' + esc(th.obstacles.haut) + '</span><span>Glisse vers le haut : saute par-dessus ' + esc(th.noms.haut) + '</span></li>' +
        '<li><span class="rnr-ico">👇 ' + esc(th.obstacles.bas) + '</span><span>Glisse vers le bas : passe sous ' + esc(th.noms.bas) + '</span></li>' +
        '<li><span class="rnr-ico">' + esc(th.piece) + ' ' + esc(th.bonus) + '</span><span>Ramasse les ' + esc(th.piece) + ' ; ' + esc(th.bonus) + ' te protège 9 s</span></li>' +
        '</ul><div class="rnr-count" aria-live="assertive">Prêt ?</div></div>';
      ov.classList.add('on');
      var el = ov.querySelector('.rnr-count'), steps = ['3', '2', '1', 'Partez !'], i = 0;
      function step() {
        if (state !== 'ready') return;
        if (i < steps.length) {
          el.textContent = steps[i]; el.classList.remove('rnr-pop'); void el.offsetWidth; el.classList.add('rnr-pop');
          if (i < 3) SFX.tick(); else SFX.go();
          i++; readyTimer = setTimeout(step, i === 4 ? 420 : 700);
        } else { ov.classList.remove('on'); ov.innerHTML = ''; state = 'run'; last = performance.now(); }
      }
      readyTimer = setTimeout(step, 900);
    }
    var readyTimer = 0;
    function pause() {
      if (state !== 'run') return; state = 'paused';
      ov.innerHTML = '<div class="rnr-card"><div class="rnr-kicker">Pause</div><h2>On reprend quand tu veux</h2><div class="rnr-sub">' + scoreStr + ' points · ' + coins + ' ' + esc(th.piece) + '</div><button class="rnr-btn" type="button">Reprendre</button></div>';
      ov.classList.add('on');
      ov.querySelector('button').addEventListener('click', function () { ov.classList.remove('on'); ov.innerHTML = ''; state = 'run'; last = performance.now(); });
    }
    function showEnd() {
      var r = result, rec = r.score > best0 && r.score > 0, bestNow = Math.max(best0, r.score);
      var got = null, next = null;
      for (var i = 0; i < paliers.length; i++) { if (r.coins >= paliers[i].n) got = paliers[i]; else if (!next) next = paliers[i]; }
      var goal = '';
      if (paliers.length) {
        var prevN = got ? got.n : 0, pct = next ? Math.round(100 * (r.coins - prevN) / (next.n - prevN)) : 100;
        goal = '<div class="rnr-goal">' +
          (got ? '🎉 Palier atteint : ' + esc(got.label) : '') +
          (next ? (got ? '<small>' : '') + 'Plus que ' + (next.n - r.coins) + ' ' + esc(th.piece) + ' pour ' + esc(next.label) + (got ? '</small>' : '') : (got ? '<small>Tous les paliers sont à toi, bravo !</small>' : '')) +
          '<div class="rnr-bar"><i data-w="' + clamp(pct, 3, 100) + '%"></i></div></div>';
      }
      var title = endReason === 'temps' ? 'Temps écoulé, bravo !' : rec ? 'Nouveau record !' : r.score >= best0 * 0.8 && best0 > 0 ? 'Tout près du record !' : 'Belle course !';
      ov.innerHTML = '<div class="rnr-card"><div class="rnr-kicker">' + esc(th.titre) + '</div><h2>' + title + '</h2>' +
        '<div class="rnr-score">0</div><div class="rnr-sub">points</div>' +
        (rec ? '<div class="rnr-rec">🏆 Record personnel</div>' : '<div class="rnr-sub">Meilleur score : ' + bestNow + '</div>') +
        '<div class="rnr-stats"><div class="rnr-stat"><b>' + r.coins + '</b>' + esc(th.piece) + ' ramassés</div><div class="rnr-stat"><b>' + r.distance + ' m</b>parcourus</div><div class="rnr-stat"><b>' + Math.round(r.duration) + ' s</b>de course</div></div>' +
        goal + '<button class="rnr-btn" type="button">' + esc(opts.labelRejouer || 'Rejouer') + '</button></div>';
      ov.classList.add('on');
      var sEl = ov.querySelector('.rnr-score'), t0 = performance.now();
      (function count() { var u = Math.min(1, (performance.now() - t0) / 900); sEl.textContent = Math.round(r.score * (1 - Math.pow(1 - u, 3))); if (u < 1 && ov.contains(sEl)) requestAnimationFrame(count); })();
      var bar = ov.querySelector('.rnr-bar i'); if (bar) setTimeout(function () { bar.style.width = bar.getAttribute('data-w'); }, 30);
      if (rec) { confetti(90); SFX.palier(); }
      ov.querySelector('button').addEventListener('click', function () { finishPromise(); });
    }
    function finishPromise() {
      if (resolved) return; resolved = true;
      var r = result || mkResult(); destroy(); resolve(r);
    }
    function mkResult() { return { score: score, coins: coins, distance: Math.round(dist), duration: Math.round(gt * 10) / 10 }; }

    function endGame(reason) {
      if (state === 'dying' || state === 'end') return;
      endReason = reason; result = mkResult();
      if (onEnd) { try { onEnd(result); } catch (e) { /* hôte */ } }
      if (reason === 'temps') { state = 'end'; confetti(50); setTimeout(showEnd, 500); }
      else { state = 'dying'; dieT = 0; dieVy = 6; dieRot = 0; }
    }

    // ------------------------------------------------ collisions
    function hit(o) {
      if (invul > 0) return;
      proj(px, 0.6, 0); var hx = P.x, hy = P.y;
      if (shield > 0) {
        shield = 0; invul = 1.0; o.burst = 0.35; o.done = true; shake = 7; flash = 0.25; flashCol = th.accent;
        burst(hx, hy, 22, th.accent, 260, 300); vib(40); SFX.hit(); popup('Protégé !', hx, hy - 60, '#fff', false); return;
      }
      if (secondChance) {
        secondChance = false; invul = C.invulT; o.burst = 0.35; o.done = true; hitStop = 0.09; shake = 11; flash = 0.35; flashCol = '#ff4d4d';
        speedMul = 0.8; combo = 0; mult = 1; burst(hx, hy, 26, '#ffffff', 300, 300); vib([60, 40, 60]); SFX.hit();
        popup('Seconde chance !', W / 2, H * 0.42, '#fff', true); return;
      }
      hitStop = 0.12; shake = 14; flash = 0.4; flashCol = '#ff3b3b'; vib(220); SFX.hit(); burst(hx, hy, 30, '#ffffff', 320, 300);
      endGame('choc');
    }

    function update(dt) {
      // effets qui vivent même hors course
      shake *= Math.exp(-dt * 9); if (shake < 0.3) shake = 0;
      flash = Math.max(0, flash - dt); coinPop = Math.max(0, coinPop - dt * 3.2); multPop = Math.max(0, multPop - dt * 2.5); bravo = Math.max(0, bravo - dt);
      for (var pi = 0; pi < PARTS.length; pi++) { var p = PARTS[pi]; if (!p.on) continue; p.life -= dt; if (p.life <= 0) { p.on = false; continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      for (var qi = 0; qi < POPS.length; qi++) { var q = POPS[qi]; if (!q.on) continue; q.life -= dt; if (q.life <= 0) q.on = false; else q.y -= dt * (q.big ? 18 : 55); }

      if (state === 'ready' || state === 'paused') { gt += 0; return; }
      if (state === 'end') return;
      if (state === 'dying') {
        dieT += dt; speed *= Math.exp(-dt * 5); dist += speed * dt; dieVy -= 22 * dt; py = Math.max(0, py + dieVy * dt); dieRot += dt * 9;
        if (dieT > 1.0) { state = 'end'; showEnd(); }
        return;
      }
      // --- course
      gt += dt;
      speedMul = Math.min(1, speedMul + dt * 0.07);
      speed = speedAt(gt) * speedMul;
      var dd = speed * dt; dist += dd;
      if (duration > 0 && gt >= duration) { endGame('temps'); return; }
      while (nextWZ - dist < C.zSpawn) placeChunk();
      spawnProps();

      // déplacement latéral + vertical
      px += (tlane - px) * Math.min(1, dt * C.laneLerp); if (Math.abs(tlane - px) < 0.002) px = tlane;
      lane = Math.round(px);
      tilt *= Math.exp(-dt * 7);
      if (air) {
        vy -= GRAV * dt * (diving ? 1.5 : 1); py += vy * dt;
        if (py <= 0) {
          py = 0; vy = 0; air = false; diving = false; sqx = 1.3; sqy = 0.72;
          proj(px, 0, 0); for (var k = 0; k < 8; k++) part(P.x + (rnd() - 0.5) * P.s * 0.6, P.y, (rnd() - 0.5) * 140, -rnd() * 60, 240, 0.4, 2 + rnd() * 2.5, 'rgba(255,255,255,.75)');
          if (slideBuf > 0) doSlide(); else if (jumpBuf > 0) doJump();
        }
      }
      jumpBuf = Math.max(0, jumpBuf - dt); slideBuf = Math.max(0, slideBuf - dt);
      if (slide > 0) { slide -= dt; if (slide <= 0) { slide = 0; sqx = 0.85; sqy = 1.18; } }
      var tx = slide > 0 ? 1.32 : 1, ty = slide > 0 ? 0.52 : 1;
      sqx += (tx - sqx) * Math.min(1, dt * 11); sqy += (ty - sqy) * Math.min(1, dt * 11);
      invul = Math.max(0, invul - dt); shield = Math.max(0, shield - dt);
      if (gt - lastCoinT > C.comboWin && combo > 0) { combo = 0; mult = 1; }

      // poussière de course
      dustT -= dt;
      if (dustT <= 0 && !air) { dustT = slide > 0 ? 0.03 : 0.09; proj(px, 0, 0.1); part(P.x + (rnd() - 0.5) * P.s * 0.3, P.y, (rnd() - 0.5) * 30, -10 - rnd() * 25, 0, 0.45, 2 + rnd() * 2.5 * (slide > 0 ? 1.6 : 1), decor === 'ponton' ? 'rgba(255,255,255,.35)' : 'rgba(255,248,230,.55)'); }

      // obstacles
      var pTop = slide > 0 ? 0.45 : 1.0;
      for (var oi = 0; oi < OBS.length; oi++) {
        var o = OBS[oi]; if (!o.on) continue;
        o.z = o.wz - dist;
        if (o.burst > 0) o.burst -= dt;
        if (o.z + o.len < -6) { o.on = false; continue; }
        if (o.done) continue;
        var z0 = o.z - (o.type === 2 ? 0.25 : 0.35), z1 = o.type === 2 ? o.z + o.len : o.z + 0.35;
        if (z0 < 0.3 && z1 > -0.3) {
          var dx = Math.abs(px - o.lane);
          if (dx < 0.56) {
            var hitIt = o.type === 0 ? py < 0.48 : o.type === 1 ? (py + pTop > 0.74) : true;
            if (hitIt) {
              if (o.type === 2 && Math.abs(px - tlane) > 0.22 && prevLane !== o.lane && tlane === o.lane) {
                // choc latéral contre un mur : simple rebond vers le couloir d'origine
                tlane = prevLane; prevLane = o.lane; shake = 5; vib(30); sqx = 0.8; sqy = 1.15; SFX.lane();
              } else { hit(o); if (state !== 'run') return; }
            }
          }
        }
        // franchissement : frôlé ?
        if (!o.crossed && o.z + (o.type === 2 ? o.len : 0) < -0.4) {
          o.crossed = true;
          if (!o.done) {
            var near = false;
            if (o.lane === tlane && o.type === 0 && gt - jumpAt < 0.38 && gt - jumpAt > 0) near = true;
            if (o.lane === tlane && o.type === 1 && gt - slideAt < 0.34 && gt - slideAt > 0) near = true;
            if (o.lane !== tlane && o.lane === prevLane && gt - laneT < 0.4) near = true;
            if (near && invul <= 0) {
              nearCount++; pts += 25 * mult; lastCoinT = gt; proj(px, 1.2, 0);
              popup('Frôlé ! +' + 25 * mult, P.x, P.y - 30, '#ffe066', false); burst(P.x, P.y, 10, '#ffe066', 220, 0); SFX.near(); vib(12);
            }
          }
        }
      }
      // pièces + bonus
      var pc = py + (slide > 0 ? 0.3 : 0.55);
      for (var ci = 0; ci < COINS.length; ci++) {
        var c = COINS[ci]; if (!c.on) continue;
        c.z = c.wz - dist;
        if (c.z < -3) { c.on = false; continue; }
        if (shield > 0 && !c.pw && !c.fly && c.z < 10 && c.z > -0.5 && Math.abs(c.x - px) < 2.2) c.fly = true;
        if (c.fly) {
          var k2 = Math.min(1, dt * 14); c.x += (px - c.x) * k2; c.y += (pc - c.y) * k2; c.wz += (dist - c.wz) * k2; c.z = c.wz - dist;
        }
        if (Math.abs(c.z) < 0.45 && Math.abs(c.x - px) < 0.5 && Math.abs(c.y - pc) < 0.78) collect(c);
      }
      // décor
      for (var si = 0; si < PROPS.length; si++) { var pr = PROPS[si]; if (!pr.on) continue; pr.z = pr.wz - dist; if (pr.z < zNear - 4) pr.on = false; }
      for (var hi = 0; hi < HOUSES.length; hi++) { var hs = HOUSES[hi]; if (!hs.on) continue; hs.z = hs.wz - dist; if (hs.z + hs.len < zNear - 2) hs.on = false; }
      for (var li2 = 0; li2 < LINES.length; li2++) { var ln2 = LINES[li2]; ln2.p += dt * ln2.v * (speed / 10); if (ln2.p > 1) { ln2.p -= 1; ln2.a = rnd() * 6.283; } }

      // consigne du tutoriel : l'élément marqué le plus proche
      prompt = null;
      for (var ti = 0; ti < OBS.length; ti++) { var to = OBS[ti]; if (to.on && to.tuto && !to.tdone && to.z > 0.4 && to.z < speed * 1.7) { prompt = to; break; } }
      if (!prompt) for (var tc = 0; tc < COINS.length; tc++) { var tco = COINS[tc]; if (tco.on && tco.tuto && !tco.tdone && tco.z > 0.4 && tco.z < speed * 2.2) { prompt = tco; break; } }
      if (prompt) {
        if (prompt.tdir === 'right' && tlane === 1) { prompt.tdone = true; bravo = 0.9; }
        else if (prompt.tdir === 'left' && tlane === -1) { prompt.tdone = true; bravo = 0.9; }
        else if (prompt.tdir === 'lr' && tlane === prompt.free) { prompt.tdone = true; bravo = 0.9; }
      }
      if (prompt && !prompt.tdone) {
        promptA = Math.min(1, promptA + dt * 6); promptTxt = prompt.tuto;
        promptDir = prompt.tdir === 'lr' ? (prompt.free > tlane ? 'right' : 'left') : prompt.tdir;
        if (prompt.tdir === 'lr') promptTxt = 'Change de couloir ' + (promptDir === 'right' ? '→' : '←');
      } else promptA = Math.max(0, promptA - dt * 5);

      score = Math.floor(dist) + pts;
      if (DBG) { DBG.t = gt; }
    }

    function collect(c) {
      c.on = false;
      proj(c.x, c.y, Math.max(c.z, 0)); var sx = P.x, sy = P.y;
      if (c.pw) {
        shield = C.shieldT; flash = 0.3; flashCol = th.accent; SFX.power(); vib(30);
        burst(sx, sy, 24, th.accent, 280, 120); popup(th.bonusNom + ' !', W / 2, H * 0.42, '#fff', true); return;
      }
      if (gt - lastCoinT <= C.comboWin) combo++; else combo = 1;
      lastCoinT = gt;
      var nm = combo >= 25 ? 3 : combo >= 10 ? 2 : 1;
      if (nm > mult) { mult = nm; multPop = 1; popup('Combo ×' + mult + ' !', W / 2, H * 0.36, '#ffe066', true); vib(15); }
      mult = nm;
      coins++; pts += 10 * mult; coinPop = 1;
      SFX.coin(combo);
      for (var i = 0; i < 7; i++) { var a = i / 7 * 6.283 + rnd() * 0.5, v = 90 + rnd() * 110; part(sx, sy, Math.cos(a) * v, Math.sin(a) * v - 60, 260, 0.38 + rnd() * 0.2, 2 + rnd() * 2.2, i % 2 ? '#fff6c2' : '#ffd23f'); }
      if (onCoin) { try { onCoin(coins); } catch (e) { /* hôte */ } }
      if (palierIdx < paliers.length && coins >= paliers[palierIdx].n) {
        popup('🎉 Palier : ' + paliers[palierIdx].label + ' !', W / 2, H * 0.3, '#fff', true);
        palierIdx++; confetti(60); SFX.palier(); vib([30, 30, 60]); flash = 0.25; flashCol = '#ffe066';
      }
    }

    // ======================================================================
    //   RENDU
    // ======================================================================
    function quadPath(x0, x1, y, z0, z1) {
      proj(x0, y, z0); ctx.moveTo(P.x, P.y); proj(x1, y, z0); ctx.lineTo(P.x, P.y);
      proj(x1, y, z1); ctx.lineTo(P.x, P.y); proj(x0, y, z1); ctx.lineTo(P.x, P.y); ctx.closePath();
    }
    function vquadPath(x, y0, y1, z0, z1) {
      proj(x, y0, z0); ctx.moveTo(P.x, P.y); proj(x, y1, z0); ctx.lineTo(P.x, P.y);
      proj(x, y1, z1); ctx.lineTo(P.x, P.y); proj(x, y0, z1); ctx.lineTo(P.x, P.y); ctx.closePath();
    }
    function fade(z) { return clamp((C.zFar - z) / 14, 0, 1); }

    function drawGround(zs) {
      var zf = 400;
      ctx.fillStyle = decor === 'ponton' ? seaG : groundG; ctx.fillRect(0, HY, W, H - HY);
      if (decor === 'plage') {
        // mer à gauche, ligne d'écume animée, sable mouillé
        ctx.fillStyle = seaG; ctx.beginPath(); proj(-3.3, 0, zf); ctx.moveTo(P.x, HY); proj(-3.3, 0, zs); ctx.lineTo(P.x, P.y); ctx.lineTo(-20, H + 20); ctx.lineTo(-20, HY); ctx.closePath(); ctx.fill();
        ctx.fillStyle = rgba(mix(sideCol, '#000', 0.25), 0.35); ctx.beginPath(); quadPath(-3.3, -2.7, 0, zs, zf); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.beginPath();
        for (var i = 0; i <= 26; i++) { var z = zs + Math.pow(i / 26, 1.7) * (C.zFar - zs); proj(-3.3 + Math.sin(z * 0.7 + gtv * 2.2) * 0.12, 0, z); if (i) ctx.lineTo(P.x, P.y); else ctx.moveTo(P.x, P.y); }
        ctx.stroke();
        drawShimmer(-60, -3.6);
      } else if (decor === 'ponton') {
        drawShimmer(-60, 60);
      } else {
        ctx.fillStyle = mix(sideCol, '#000', 0.05); ctx.beginPath(); quadPath(-2.6, -1.62, 0, zs, zf); quadPath(1.62, 2.6, 0, zs, zf); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; ctx.beginPath();
        var off = dist % 1.2;
        for (var t = 0; t < 40; t++) { var zz = zs + t * 1.2 - off; if (zz > C.zFar) break; proj(-2.6, 0, zz); ctx.moveTo(P.x, P.y); proj(-1.62, 0, zz); ctx.lineTo(P.x, P.y); proj(1.62, 0, zz); ctx.moveTo(P.x, P.y); proj(2.6, 0, zz); ctx.lineTo(P.x, P.y); }
        ctx.stroke();
      }
    }
    function drawShimmer(xa, xb) {
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath();
      for (var i = 0; i < 30; i++) {
        var z = ((i * 7.3 + dist * 0.25) % 60), x = -9 + ((i * 37) % 18);
        if (x < xa || x > xb || (decor === 'ponton' && Math.abs(x) < 2.1)) continue;
        z = 60 - z; proj(x, 0, z); var w = P.s * (0.5 + (i % 3) * 0.3), h = Math.max(1, P.s * 0.04);
        ctx.rect(P.x - w / 2, P.y, w, h);
      }
      ctx.fill();
    }

    function drawRoad(zs) {
      var zf = C.zFar + 6, i, z;
      var rw = decor === 'ponton' ? 1.72 : 1.5;
      if (decor === 'ponton') {
        // flanc du ponton
        ctx.fillStyle = mix(sol0, '#000', 0.55); ctx.beginPath(); vquadPath(-rw, 0, -0.35, zs, zf); vquadPath(rw, 0, -0.35, zs, zf); ctx.fill();
      }
      ctx.fillStyle = sol0; ctx.beginPath(); quadPath(-rw, rw, 0, zs, zf); ctx.fill();
      // bandes alternées qui défilent : sensation de vitesse
      var seg = decor === 'ponton' ? 0.8 : 2.4, off = dist % (seg * 2);
      ctx.fillStyle = sol1; ctx.beginPath();
      for (i = 0; i < 80; i++) { z = zs - off + i * seg * 2 - seg * 2; if (z > zf) break; var a = Math.max(z, zs), b = Math.min(z + seg, zf); if (b > a) quadPath(-rw, rw, 0, a, b); }
      ctx.fill();
      if (decor === 'ponton') {
        ctx.strokeStyle = 'rgba(40,20,5,.35)'; ctx.lineWidth = 1; ctx.beginPath();
        for (i = 0; i < 160; i++) { z = zs - (dist % 0.4) + i * 0.4; if (z > zf) break; if (z < zs) continue; proj(-rw, 0, z); ctx.moveTo(P.x, P.y); proj(rw, 0, z); ctx.lineTo(P.x, P.y); }
        ctx.stroke();
      }
      // séparations de couloirs (pointillés défilants)
      ctx.fillStyle = laneCol; ctx.beginPath();
      var dl = 1.3, dg = 3.0, o2 = dist % dg;
      for (i = 0; i < 40; i++) { z = zs - o2 + i * dg; if (z > zf) break; var za = Math.max(z, zs), zb = z + dl; if (zb <= za) continue; quadPath(-0.53, -0.47, 0, za, zb); quadPath(0.47, 0.53, 0, za, zb); }
      ctx.fill();
      // bordures alternées
      var cs = 1.2, co = dist % (cs * 2);
      ctx.fillStyle = curbB; ctx.beginPath(); quadPath(-rw - 0.14, -rw, 0.02, zs, zf); quadPath(rw, rw + 0.14, 0.02, zs, zf); ctx.fill();
      ctx.fillStyle = curbA; ctx.beginPath();
      for (i = 0; i < 60; i++) { z = zs - co + i * cs * 2; if (z > zf) break; var ca = Math.max(z, zs), cb = z + cs; if (cb <= ca) continue; quadPath(-rw - 0.14, -rw, 0.02, ca, cb); quadPath(rw, rw + 0.14, 0.02, ca, cb); }
      ctx.fill();
      if (decor === 'ponton') {
        // cordes le long du ponton
        ctx.strokeStyle = 'rgba(240,225,190,.85)'; ctx.lineWidth = 2; ctx.beginPath();
        for (var s = -1; s <= 1; s += 2) { proj(s * 1.82, 0.62, zs); ctx.moveTo(P.x, P.y); proj(s * 1.82, 0.62, C.zFar); ctx.lineTo(P.x, P.y); }
        ctx.stroke();
      }
    }

    function drawHouses() {
      for (var pass = 0; pass < 2; pass++) for (var i = 0; i < HOUSES.length; i++) {
        var h = HOUSES[i]; if (!h.on) continue;
        var z0 = Math.max(h.z, zNear - 1), z1 = h.z + h.len; if (z1 <= z0 || z0 > C.zFar + 4) continue;
        var x = h.side * 2.6, a = fade(z0); if (a <= 0) continue;
        ctx.globalAlpha = a;
        if (pass === 0) {
          // pignon côté caméra (épaisseur)
          if (h.z > zNear) { ctx.fillStyle = mix(h.col, '#000', 0.25); ctx.beginPath(); proj(x, 0, h.z); ctx.moveTo(P.x, P.y); proj(x, h.h, h.z); ctx.lineTo(P.x, P.y); proj(x + h.side * 3, h.h, h.z); ctx.lineTo(P.x, P.y); proj(x + h.side * 3, 0, h.z); ctx.lineTo(P.x, P.y); ctx.closePath(); ctx.fill(); }
          continue;
        }
        ctx.fillStyle = night ? mix(h.col, '#0e2329', 0.45) : h.col; ctx.beginPath(); vquadPath(x, 0, h.h, z0, z1); ctx.fill();
        ctx.fillStyle = h.roof; ctx.beginPath(); vquadPath(x, h.h - 0.05, h.h + 0.35, z0, z1); ctx.fill();
        // lambrequins (dentelle de bois blanc sous le toit)
        ctx.fillStyle = '#ffffff'; ctx.beginPath();
        var n = Math.max(3, Math.round((z1 - z0) / 0.45));
        for (var k = 0; k < n; k++) { var za = z0 + (z1 - z0) * k / n, zb = z0 + (z1 - z0) * (k + 1) / n; proj(x, h.h - 0.04, za); ctx.moveTo(P.x, P.y); proj(x, h.h - 0.04, zb); ctx.lineTo(P.x, P.y); proj(x, h.h - 0.24, (za + zb) / 2); ctx.lineTo(P.x, P.y); ctx.closePath(); }
        ctx.fill();
        // fenêtres et volets
        var nw = Math.max(1, Math.floor(h.len / 2.2));
        for (var w = 0; w < nw; w++) {
          var wz0 = h.z + (w + 0.3) * h.len / nw, wz1 = wz0 + h.len / nw * 0.42; if (wz0 < z0) continue;
          ctx.fillStyle = night ? '#ffcf73' : '#3b4b5a'; ctx.beginPath(); vquadPath(x, 0.9, 1.75, wz0, wz1); ctx.fill();
          ctx.fillStyle = mix(h.col, h.side > 0 ? '#1e5d4a' : '#7a2e2e', 0.65); ctx.beginPath(); vquadPath(x, 0.9, 1.75, wz0 - 0.22, wz0); vquadPath(x, 0.9, 1.75, wz1, wz1 + 0.22); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function drawSprite(sp, x, z, scale, alpha) {
      proj(x, 0, z); var h = sp.hu * P.s * scale, w = sp.wu * P.s * scale;
      ctx.globalAlpha = alpha; ctx.drawImage(sp.c, P.x - w * sp.ax, P.y - h, w, h);
    }
    function shadow(x, z, rx, a) { proj(x, 0, z); ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(P.x, P.y, rx * P.s, rx * P.s * 0.28, 0, 0, 6.283); ctx.fill(); }

    function drawProp(p) {
      var a = fade(p.z); if (a <= 0) return;
      if (p.kind === 'pile') {
        proj(p.x, 0.75, p.z); var x = P.x, y0 = P.y, w = Math.max(2, P.s * 0.13); proj(p.x, -0.7, p.z);
        ctx.globalAlpha = a; ctx.fillStyle = mix(sol0, '#000', 0.45); ctx.fillRect(x - w / 2, y0, w, P.y - y0);
        ctx.fillStyle = mix(sol0, '#fff', 0.2); ctx.fillRect(x - w / 2, y0, w, w * 0.5);
        return;
      }
      if (p.kind === 'guirlande') {
        var cols = ['#ff5d73', '#ffd23f', '#3bceac', '#4d9de0', '#ff9f1c'];
        var yA = 3.1, sag = 0.55;
        ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(30,30,30,.6)'; ctx.lineWidth = Math.max(1, F / (p.z + C.camD) * 0.02);
        ctx.beginPath();
        for (var i = 0; i <= 12; i++) { var u = i / 12, xx = -2.5 + 5 * u, yy = yA - sag * 4 * u * (1 - u); proj(xx, yy, p.z); if (i) ctx.lineTo(P.x, P.y); else ctx.moveTo(P.x, P.y); }
        ctx.stroke();
        for (var j = 1; j < 12; j++) {
          var u2 = j / 12; proj(-2.5 + 5 * u2, yA - sag * 4 * u2 * (1 - u2) - 0.08, p.z);
          var r = Math.max(1.5, P.s * 0.07);
          if (night) { ctx.globalAlpha = a * 0.35; ctx.drawImage(glowGold, P.x - r * 3, P.y - r * 3, r * 6, r * 6); ctx.globalAlpha = a; }
          ctx.fillStyle = cols[j % 5]; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, 6.283); ctx.fill();
        }
        return;
      }
      var sp = spr[p.kind]; if (!sp) return;
      if (p.kind === 'bateau') { proj(p.x, 0, p.z); var bob = Math.sin(gtv * 1.6 + p.ph) * 0.05; var hh = sp.hu * P.s, ww = sp.wu * P.s; ctx.globalAlpha = a; ctx.drawImage(sp.c, P.x - ww / 2, P.y - hh * 0.8 + bob * P.s, ww, hh); return; }
      if (p.kind === 'palmier' || p.kind === 'parasol') shadow(p.x + 0.3, p.z, p.kind === 'palmier' ? 0.7 : 0.8, 0.12 * a);
      drawSprite(sp, p.x, p.z, p.kind === 'palmier' ? 0.9 + 0.2 * Math.sin(p.ph) : 1, a);
    }

    function drawObs(o) {
      var a = fade(o.z); if (a <= 0) return;
      var x = o.lane, z = Math.max(o.z, zNear - 0.6);
      if (o.done && o.burst <= 0) return;
      var bs = o.done ? clamp(o.burst / 0.35, 0, 1) : 1; a *= bs;
      if (o.type === 0) {
        // petite haie rayée (lecture immédiate « à sauter ») + l'emoji du thème posé dessus
        shadow(x, z, 0.46, 0.3 * a);
        ctx.globalAlpha = a;
        proj(x - 0.44, 0.34, z); var hx0 = P.x, hy0 = P.y, sc0 = P.s; proj(x + 0.44, 0.16, z); var hx1 = P.x, hy1 = P.y;
        var pw2 = Math.max(2, sc0 * 0.06); proj(x, 0, z); var gy = P.y;
        ctx.fillStyle = '#2b2b2b'; ctx.fillRect(hx0 - pw2 / 2, hy0, pw2, gy - hy0); ctx.fillRect(hx1 - pw2 / 2, hy0, pw2, gy - hy0);
        ctx.drawImage(hurdle, hx0 - pw2, hy0, hx1 - hx0 + pw2 * 2, hy1 - hy0);
        var hop = Math.abs(Math.sin(gtv * 7 + o.wz)) * 0.05, wob = Math.sin(gtv * 5 + o.wz) * 0.04;
        proj(x + wob, 0.3 + hop, z); var s = 0.66 * P.s * (2 - bs), k = E.haut._k;
        ctx.drawImage(E.haut, P.x - s * k / 2, P.y - s * k * 0.86, s * k, s * k);
      } else if (o.type === 1) {
        proj(x, 0, z); ctx.globalAlpha = 0.16 * a; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(P.x, P.y, 0.5 * P.s, 0.1 * P.s, 0, 0, 6.283); ctx.fill();
        proj(x - 0.47, 0, z); var xL = P.x, yB = P.y; proj(x + 0.47, 1.5, z); var xR = P.x, yT = P.y;
        var pw = Math.max(2, P.s * 0.07);
        ctx.globalAlpha = a; ctx.fillStyle = night ? '#5b4630' : '#7b5a3a'; ctx.fillRect(xL - pw / 2, yT, pw, yB - yT); ctx.fillRect(xR - pw / 2, yT, pw, yB - yT);
        proj(x, 0.76, z); var yb = P.y; proj(x, 1.46, z); var yt = P.y;
        var bw = xR - xL; ctx.drawImage(banner, xL - bw * 0.02, yt, bw * 1.04, (yb - yt) * 1.22);
      } else {
        var z1 = o.z + o.len, hgt = 1.75; if (z1 < zNear) return;
        ctx.globalAlpha = 0.22 * a; ctx.fillStyle = '#000'; ctx.beginPath(); quadPath(x - 0.56, x + 0.6, 0, z, z1 + 0.3); ctx.fill();
        ctx.globalAlpha = a;
        var rel2 = x - camX;
        if (rel2 > 0.05) { ctx.fillStyle = wallSide; ctx.beginPath(); vquadPath(x - 0.46, 0, hgt, z, z1); ctx.fill(); }
        else if (rel2 < -0.05) { ctx.fillStyle = wallSide; ctx.beginPath(); vquadPath(x + 0.46, 0, hgt, z, z1); ctx.fill(); }
        ctx.fillStyle = wallTop; ctx.beginPath(); quadPath(x - 0.46, x + 0.46, hgt, z, z1); ctx.fill();
        if (o.len > 2) { ctx.strokeStyle = wallShade; ctx.lineWidth = 1; ctx.beginPath(); for (var t = z + 2; t < z1 - 0.5; t += 2) { proj(x - 0.46, hgt, t); ctx.moveTo(P.x, P.y); proj(x + 0.46, hgt, t); ctx.lineTo(P.x, P.y); } ctx.stroke(); }
        if (o.z > zNear - 0.2) {
          proj(x - 0.46, hgt, o.z); var fx = P.x, fy = P.y; proj(x + 0.46, 0, o.z);
          var sc = o.done ? 2 - bs : 1, fw = (P.x - fx) * sc, fh = (P.y - fy) * sc;
          ctx.drawImage(wallFace, fx - (fw - (P.x - fx)) / 2, fy - (fh - (P.y - fy)), fw, fh);
        }
      }
    }

    function drawCoin(c) {
      var a = fade(c.z); if (a <= 0) return;
      var bob = c.fly ? 0 : Math.sin(gtv * 5 + c.wz) * 0.07;
      if (c.y < 0.8 && !c.fly) shadow(c.x, c.z, 0.16, 0.18 * a);
      proj(c.x, c.y + bob, Math.max(c.z, zNear));
      if (c.pw) {
        var r = P.s * 0.55 * (1 + Math.sin(gtv * 6) * 0.06);
        ctx.globalAlpha = a; ctx.drawImage(glowAcc, P.x - r * 2.2, P.y - r * 2.2, r * 4.4, r * 4.4);
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, 6.283); ctx.fill();
        ctx.strokeStyle = th.accent; ctx.lineWidth = Math.max(2, r * 0.12); ctx.stroke();
        var k = E.bonus._k, s = r * 1.5; ctx.drawImage(E.bonus, P.x - s * k / 2, P.y - s * k / 2, s * k, s * k);
        return;
      }
      var sz = P.s * 0.5, spin = 0.72 + 0.28 * Math.abs(Math.cos(gtv * 3 + c.wz * 0.3));
      ctx.globalAlpha = a * 0.45; ctx.drawImage(glowGold, P.x - sz * 1.1, P.y - sz * 1.1, sz * 2.2, sz * 2.2);
      ctx.globalAlpha = a; ctx.drawImage(token, P.x - sz * spin / 2, P.y - sz / 2, sz * spin, sz);
    }

    function drawPlayer() {
      var y = py, rot = tilt;
      if (state === 'dying') rot = dieRot;
      // ombre portée
      proj(px, 0, 0); ctx.globalAlpha = 0.3 * (1 - Math.min(0.6, py * 0.3)); ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(P.x, P.y, P.s * 0.4 * sqx * (1 - Math.min(0.5, py * 0.25)), P.s * 0.11, 0, 0, 6.283); ctx.fill();
      var running = !air && slide <= 0 && state === 'run', stp = gtv * (9 + speed * 0.35);
      var bob = running ? Math.abs(Math.sin(stp)) * 0.09 : 0;
      if (running) rot += Math.sin(stp) * 0.07;
      if (air && state === 'run') rot += clamp(vy * -0.012, -0.12, 0.12);
      proj(px, y + bob, 0);
      var stepSq = running ? 1 - Math.abs(Math.cos(stp)) * 0.06 : 1;
      var size = 1.08 * P.s, k = E.player._k, w = size * k * sqx * (2 - stepSq), h = size * k * sqy * stepSq;
      var blink = invul > 0 && state === 'run' && (Math.floor(invul * 12) % 2 === 0);
      ctx.globalAlpha = blink ? 0.35 : 1;
      ctx.save(); ctx.translate(P.x, P.y - size * 0.08); ctx.rotate(rot);
      if (state === 'dying') { ctx.translate(0, -h * 0.45); ctx.drawImage(E.player, -w / 2, -h / 2, w, h); }
      else ctx.drawImage(E.player, -w / 2, -h, w, h);
      ctx.restore();
      if (shield > 0) {
        var pulse = 1 + Math.sin(gtv * 8) * 0.04, r = size * 0.62 * pulse, cy = P.y - size * 0.5 * sqy;
        var end = shield < 2 && Math.floor(shield * 8) % 2 === 0;
        ctx.globalAlpha = end ? 0.25 : 0.55; ctx.drawImage(glowAcc, P.x - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
        ctx.globalAlpha = end ? 0.4 : 0.95; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, size * 0.035); ctx.beginPath(); ctx.arc(P.x, cy, r, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = th.accent; ctx.lineWidth = Math.max(1.5, size * 0.02); ctx.beginPath(); ctx.arc(P.x, cy, r * 1.08, gtv * 4, gtv * 4 + 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawArrow(dir, x, y, s, t) {
      var dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0, dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.16;
      for (var i = 0; i < 3; i++) {
        var ph = ((t * 1.6 - i * 0.22) % 1 + 1) % 1, al = Math.sin(ph * Math.PI);
        var cx = x + dx * (i - 1) * s * 0.5, cy = y + dy * (i - 1) * s * 0.5;
        ctx.globalAlpha = 0.25 + 0.75 * al; ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        if (dx) { ctx.moveTo(cx - dx * s * 0.2, cy - s * 0.32); ctx.lineTo(cx + dx * s * 0.15, cy); ctx.lineTo(cx - dx * s * 0.2, cy + s * 0.32); }
        else { ctx.moveTo(cx - s * 0.32, cy - dy * s * 0.2); ctx.lineTo(cx, cy + dy * s * 0.15); ctx.lineTo(cx + s * 0.32, cy - dy * s * 0.2); }
        ctx.stroke();
      }
      // main qui glisse
      var u = (t * 1.1) % 1, hs = s * 1.1, k = E.hand._k, ease = u < 0.7 ? u / 0.7 : 1;
      ctx.globalAlpha = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25;
      var hx = x + dx * (ease - 0.5) * s * 2.2 + (dy ? s * 0.9 : 0), hy = y + dy * (ease - 0.5) * s * 2.2 + (dx ? s * 0.75 : s * 0.2);
      ctx.drawImage(E.hand, hx - hs * k / 2, hy - hs * k * 0.2, hs * k, hs * k);
      ctx.globalAlpha = 1;
    }

    function textOut(txt, x, y, fill, lw) { ctx.lineWidth = lw; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y); }

    function drawHUD() {
      var m = 10, b = Math.min(W, H * 0.6);
      ctx.textBaseline = 'middle';
      // pièces + progression vers le palier suivant
      if (coins !== lastCoinShown) { coinStr = String(coins); lastCoinShown = coins; }
      var ph = Math.round(b * 0.105), pwid = Math.round(b * 0.32), cp = 1 + coinPop * coinPop * 0.35;
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,.36)'; rr(ctx, m, m, pwid, ph, ph / 2); ctx.fill();
      var es = ph * 0.78 * cp, kk = E.pieceHud._k;
      ctx.drawImage(E.pieceHud, m + ph * 0.5 - es * kk / 2, m + ph / 2 - es * kk / 2, es * kk, es * kk);
      ctx.font = FONTS.hud; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
      ctx.save(); ctx.translate(m + ph * 1.02, m + ph / 2); ctx.scale(cp, cp); ctx.fillText(coinStr, 0, 1); ctx.restore();
      if (paliers.length) {
        var nx = palierIdx < paliers.length ? paliers[palierIdx] : null, pv = palierIdx > 0 ? paliers[palierIdx - 1].n : 0;
        var bw = pwid, by = m + ph + 6, bh = Math.max(5, Math.round(b * 0.018));
        ctx.fillStyle = 'rgba(0,0,0,.36)'; rr(ctx, m, by, bw, bh, bh / 2); ctx.fill();
        var fr = nx ? clamp((coins - pv) / (nx.n - pv), 0, 1) : 1;
        if (fr > 0) { ctx.fillStyle = '#ffd23f'; rr(ctx, m, by, Math.max(bh, bw * fr), bh, bh / 2); ctx.fill(); }
        ctx.font = FONTS.small; ctx.fillStyle = '#fff';
        var lab = nx ? nx.n + ' ' + th.piece + ' : ' + nx.label : '🎉 ' + paliers[paliers.length - 1].label;
        textOut(lab, m + 2, by + bh + Math.round(b * 0.03), '#fff', 3);
      }
      // score
      if (score !== lastScoreShown) { scoreStr = String(score); lastScoreShown = score; }
      ctx.textAlign = 'center'; ctx.font = FONTS.score; textOut(scoreStr, W / 2, m + ph * 0.55, '#fff', 5);
      var yy = m + ph * 1.25;
      if (duration > 0) {
        var rem = Math.max(0, Math.ceil(duration - gt)), mm = Math.floor(rem / 60), ss = rem % 60;
        ctx.font = FONTS.small; textOut('⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss, W / 2, yy + 4, rem <= 5 ? '#ffd23f' : '#fff', 3); yy += b * 0.05;
      }
      if (mult > 1 || multPop > 0) {
        var ms = 1 + multPop * multPop * 0.6; ctx.save(); ctx.translate(W / 2, yy + b * 0.03); ctx.scale(ms, ms);
        ctx.fillStyle = th.accent; rr(ctx, -b * 0.075, -b * 0.03, b * 0.15, b * 0.06, b * 0.03); ctx.fill();
        ctx.font = FONTS.mult; ctx.fillStyle = lum(th.accent) > 0.58 ? '#1d1608' : '#fff'; ctx.fillText('×' + mult, 0, 1); ctx.restore();
      }
      // vies : cœur plein + seconde chance
      var hs = ph * 0.72, kh = E.heart._k, hx = W - m - hs * 0.6;
      for (var i = 0; i < 2; i++) {
        var used = i === 0 && !secondChance;
        ctx.globalAlpha = used ? 0.28 : 1; var hh = hs * (used ? 0.85 : 1);
        ctx.drawImage(E.heart, hx - i * hs * 1.05 - hh * kh / 2, m + ph / 2 - hh * kh / 2, hh * kh, hh * kh);
      }
      ctx.globalAlpha = 1;
      // bonus actif (anneau qui se vide)
      if (shield > 0) {
        var sx = W - m - ph * 0.5 - ph * 1.25, sy = m + ph * 1.2 + ph * 0.5, rr2 = ph * 0.48;
        ctx.fillStyle = 'rgba(0,0,0,.36)'; ctx.beginPath(); ctx.arc(sx, sy, rr2, 0, 6.283); ctx.fill();
        ctx.strokeStyle = th.accent; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, rr2 - 2, -1.5708, -1.5708 + 6.283 * shield / C.shieldT); ctx.stroke();
        var kb = E.bonus._k, bs = rr2 * 1.2; ctx.drawImage(E.bonus, sx - bs * kb / 2, sy - bs * kb / 2, bs * kb, bs * kb);
      }
      // consigne du tutoriel
      if (promptA > 0.01 && state === 'run') {
        var pyy = H * 0.5, s2 = b * 0.09;
        ctx.globalAlpha = promptA; ctx.font = FONTS.prompt; ctx.textAlign = 'center';
        var tw = ctx.measureText(promptTxt).width + b * 0.08, th2 = b * 0.1;
        ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, W / 2 - tw / 2, pyy - th2 / 2, tw, th2, th2 / 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(promptTxt, W / 2, pyy + 1);
        var ay = promptDir === 'up' || promptDir === 'down' ? pyy - th2 * 1.8 : pyy - th2 * 1.4;
        var ax = W / 2 + (promptDir === 'left' ? -W * 0.18 : promptDir === 'right' ? W * 0.18 : 0);
        if (promptDir === 'left' || promptDir === 'right') ax = W / 2;
        ctx.globalAlpha = promptA; drawArrow(promptDir, ax, ay, s2, gtv);
        ctx.globalAlpha = 1;
      }
      if (bravo > 0 && state === 'run') {
        ctx.globalAlpha = clamp(bravo / 0.3, 0, 1); ctx.font = FONTS.big; ctx.textAlign = 'center';
        var bsc = 1 + (bravo > 0.75 ? (bravo - 0.75) * 3 : 0);
        ctx.save(); ctx.translate(W / 2, H * 0.34); ctx.scale(bsc, bsc); textOut('Bien joué !', 0, 0, '#ffe066', 6); ctx.restore();
        ctx.globalAlpha = 1;
      }
    }

    var gtv = 0; // horloge visuelle (continue même en pause d'écran prêt)
    function render() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      var tcx = px * 0.72; camX += (tcx - camX) * 0.18; if (state === 'ready') camX = tcx;
      ctx.fillStyle = th.ciel[1]; ctx.fillRect(0, 0, W, H);
      if (shake > 0) ctx.translate((rnd() * 2 - 1) * shake, (rnd() * 2 - 1) * shake);
      ctx.drawImage(bg, 0, 0, W, HY + 6);
      ctx.drawImage(mtFar, -W * 0.25 - camX * PPL * 0.04, HY - mtH1 + 1, W * 1.5, mtH1);
      ctx.drawImage(mtNear, -W * 0.25 - camX * PPL * 0.1, HY - mtH2 + 1, W * 1.5, mtH2);
      var zs = Math.max(zNear - 0.5, -C.camD + 0.3);
      drawGround(zs);
      drawRoad(zs);
      ctx.fillStyle = fogG; ctx.fillRect(0, HY - 1, W, (H - HY) * 0.22 + 1);
      if (decor === 'ville') drawHouses();
      // liste d'affichage triée de loin vers près
      nDL = 0; var i;
      for (i = 0; i < PROPS.length; i++) if (PROPS[i].on && PROPS[i].z < C.zFar + 2 && PROPS[i].z > zNear - 3) DL[nDL++] = PROPS[i];
      for (i = 0; i < OBS.length; i++) if (OBS[i].on && OBS[i].z < C.zFar + 2 && OBS[i].z + (OBS[i].type === 2 ? OBS[i].len : 0) > zNear - 1) DL[nDL++] = OBS[i];
      for (i = 0; i < COINS.length; i++) if (COINS[i].on && COINS[i].z < C.zFar + 2 && COINS[i].z > zNear - 0.5) DL[nDL++] = COINS[i];
      PL.z = 0.02; DL[nDL++] = PL;
      for (i = 1; i < nDL; i++) { var it = DL[i], j = i - 1; while (j >= 0 && DL[j].z < it.z) { DL[j + 1] = DL[j]; j--; } DL[j + 1] = it; }
      for (i = 0; i < nDL; i++) {
        var e = DL[i];
        if (e.k === 'p') drawProp(e); else if (e.k === 'o') drawObs(e); else if (e.k === 'c') drawCoin(e); else drawPlayer();
      }
      ctx.globalAlpha = 1;
      // lignes de vitesse quand ça accélère
      var sl = clamp((speed - 11) / 3, 0, 1) * (state === 'run' ? 1 : 0);
      if (sl > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.28 * sl).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath();
        for (i = 0; i < LINES.length; i++) {
          var L = LINES[i], r0 = Math.max(W, H) * (0.25 + L.p * 0.8), r1 = r0 + Math.max(W, H) * 0.12 * (0.5 + L.p);
          var ca = Math.cos(L.a), sa = Math.sin(L.a), ox = W / 2, oy = HY + (H - HY) * 0.25;
          ctx.moveTo(ox + ca * r0, oy + sa * r0 * 0.75); ctx.lineTo(ox + ca * r1, oy + sa * r1 * 0.75);
        }
        ctx.stroke();
      }
      // particules
      for (i = 0; i < PARTS.length; i++) {
        var p = PARTS[i]; if (!p.on) continue;
        var al = p.life / p.max; ctx.globalAlpha = al > 0.5 ? 1 : al * 2; ctx.fillStyle = p.col;
        if (p.sq) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 6 + i); ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); ctx.restore(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + al * 0.5), 0, 6.283); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(vign, 0, 0, W, H);
      if (flash > 0) { ctx.globalAlpha = Math.min(0.45, flash); ctx.fillStyle = flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // popups
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (i = 0; i < POPS.length; i++) {
        var q = POPS[i]; if (!q.on) continue;
        var u = 1 - q.life / q.max, sc = u < 0.15 ? 0.6 + u / 0.15 * 0.55 : u < 0.3 ? 1.15 - (u - 0.15) / 0.15 * 0.15 : 1;
        ctx.globalAlpha = q.life < 0.3 ? q.life / 0.3 : 1; ctx.font = q.big ? FONTS.big : FONTS.pop;
        ctx.save(); ctx.translate(q.x, q.y); ctx.scale(sc, sc); textOut(q.txt, 0, 0, q.col, q.big ? 7 : 5); ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (state !== 'ready') drawHUD();
    }

    // ------------------------------------------------ boucle
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      var dt = (ts - last) / 1000; last = ts;
      if (!(dt > 0)) dt = 0; if (dt > 0.05) dt = 0.05;
      fpsN++; fpsT += dt; if (fpsT >= 1) { fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
      frameCount++;
      gtv += dt;
      if (hitStop > 0) { hitStop -= dt; dt = 0; }
      if (state !== 'paused') {
        // pas fixes ≤ 1/60 s : collisions fiables même à 30 fps
        var n = Math.ceil(dt / (1 / 60)); if (n < 1) n = 1; var h = dt / n;
        for (var k = 0; k < n && state !== 'end'; k++) update(h);
        if (state === 'end') update(dt);
      }
      var t0 = performance.now(); render(); frameTime = performance.now() - t0;
      if (DBG) {
        DBG.state = state; DBG.t = gt; DBG.speed = speed; DBG.lane = tlane; DBG.x = px; DBG.y = py; DBG.air = air; DBG.sliding = slide > 0;
        DBG.coins = coins; DBG.score = score; DBG.dist = dist; DBG.fps = fps; DBG.invul = invul; DBG.shield = shield; DBG.lives = secondChance ? 2 : 1;
        DBG.frames = frameCount; DBG.renderMs = frameTime; DBG.near = nearCount; DBG.combo = combo; DBG.mult = mult;
      }
    }

    function obstaclesList() {
      var out = [];
      for (var i = 0; i < OBS.length; i++) { var o = OBS[i]; if (o.on && !o.done && o.z + (o.type === 2 ? o.len : 0) > -1) out.push({ type: o.type === 0 ? 'haut' : o.type === 1 ? 'bas' : 'mur', lane: o.lane, z: +o.z.toFixed(2), len: o.type === 2 ? +o.len.toFixed(2) : 0.7 }); }
      out.sort(function (a, b) { return a.z - b.z; });
      return out;
    }
    function coinsList() {
      var out = [];
      for (var i = 0; i < COINS.length; i++) { var c = COINS[i]; if (c.on && c.z > -1) out.push({ lane: c.lane, z: +c.z.toFixed(2), y: +c.y.toFixed(2), bonus: c.pw }); }
      out.sort(function (a, b) { return a.z - b.z; });
      return out;
    }
    if (DBG) { DBG.obstacles = obstaclesList; DBG.coinList = coinsList; DBG.act = act; DBG.speedAt = speedAt; DBG.pause = pause; }

    function destroy() {
      cancelAnimationFrame(raf); clearTimeout(readyTimer);
      cv.removeEventListener('touchstart', onTS); cv.removeEventListener('touchmove', onTM); cv.removeEventListener('touchend', onTE); cv.removeEventListener('touchcancel', onTE);
      cv.removeEventListener('pointerdown', onPD); window.removeEventListener('pointermove', onPM); window.removeEventListener('pointerup', onPU);
      window.removeEventListener('keydown', onKey); wrap.removeEventListener('touchmove', noScroll); document.removeEventListener('visibilitychange', onVis);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      if (AC && AC.close) { try { AC.close(); } catch (e) { /* rien */ } }
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      if (DBG) DBG.state = 'stopped';
      if (current === api) current = null;
    }

    // démarrage
    placeTuto();
    propNext[0] = -6; propNext[1] = -4; houseNext[0] = -8; houseNext[1] = -6; garlandNext = 18;
    spawnProps();
    for (var pi2 = 0; pi2 < PROPS.length; pi2++) if (PROPS[pi2].on) PROPS[pi2].z = PROPS[pi2].wz;
    for (var hi2 = 0; hi2 < HOUSES.length; hi2++) if (HOUSES[hi2].on) HOUSES[hi2].z = HOUSES[hi2].wz;
    for (var oi2 = 0; oi2 < OBS.length; oi2++) if (OBS[oi2].on) OBS[oi2].z = OBS[oi2].wz;
    for (var ci2 = 0; ci2 < COINS.length; ci2++) if (COINS[ci2].on) COINS[ci2].z = COINS[ci2].wz;
    resize();
    last = performance.now();
    raf = requestAnimationFrame(frame);
    showReady();

    var api = {
      stop: function () { if (!result) result = mkResult(); finishPromise(); }
    };
    return api;
  }

  // ======================================================================
  var current = null;
  window.Runner = {
    _v: 3,
    _debug: { state: 'idle' },
    start: function (container, opts) {
      if (current) current.stop();
      return new Promise(function (resolve) {
        current = createGame(container, opts || {}, resolve);
      });
    },
    stop: function () { if (current) { var c = current; current = null; c.stop(); } }
  };
})();

;(()=>{var Tc=0,il=1,Ec=2;var ar=1,Cc=2,cs=3,xi=0,Ht=1,yn=2,Ci=0,hs=1,or=2,sl=3,rl=4,Rc=5;var Ri=100,Pc=101,Ic=102,Lc=103,Dc=104,Nc=200,Uc=201,Fc=202,Oc=203,al=204,ol=205,Bc=206,zc=207,kc=208,Gc=209,Vc=210,Hc=211,Wc=212,Xc=213,qc=214,$r=0,Kr=1,jr=2,ji=3,Qr=4,ea=5,ta=6,na=7,ll=0,Yc=1,Zc=2,kn=0,cl=1,hl=2,ul=3,dl=4,fl=5,pl=6,ml=7;var gl=300,Pi=301,us=302,Ca=303,Ra=304,ia=1e3,Nn=1001,sa=1002,Gt=1003,Jc=1004;var lr=1005;var nn=1006,Pa=1007;var ei=1008;var ln=1009,_l=1010,xl=1011,ds=1012,Ia=1013,Rn=1014,Mn=1015,Pn=1016,La=1017,Da=1018,Ii=1020,vl=35902,yl=35899,Ml=1021,Sl=1022,In=1023,$n=1026,ti=1027,fs=1028,Na=1029,vi=1030,Ua=1031;var Fa=1033,cr=33776,hr=33777,ur=33778,dr=33779,Oa=35840,Ba=35841,za=35842,ka=35843,Ga=36196,Va=37492,Ha=37496,Wa=37488,Xa=37489,fr=37490,qa=37491,Ya=37808,Za=37809,Ja=37810,$a=37811,Ka=37812,ja=37813,Qa=37814,eo=37815,to=37816,no=37817,io=37818,so=37819,ro=37820,ao=37821,oo=36492,lo=36494,co=36495,ho=36283,uo=36284,pr=36285,fo=36286;var Is=2300,ra=2301,Zr=2302,Jo=2303,$o=2400,Ko=2401,jo=2402;var $c=3200;var po=0,Kc=1,ni="",en="srgb",Ls="srgb-linear",Ds="linear",vt="srgb";var Jr=7680;var jc=519,Qc=512,eh=513,th=514,bl=515,nh=516,ih=517,wl=518,Al=519,sh=35044,mr=35048;var Tl="300 es",xn=2e3,Qi=2001;function su(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ru(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Ns(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function rh(){let i=Ns("canvas");return i.style.display="block",i}var Ql={},es=null;function El(...i){let e="THREE."+i.shift();es?es("log",e,...i):console.log(e,...i)}function ah(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ge(...i){i=ah(i);let e="THREE."+i.shift();if(es)es("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Xe(...i){i=ah(i);let e="THREE."+i.shift();if(es)es("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Ps(...i){let e=i.join(" ");e in Ql||(Ql[e]=!0,Ge(...i))}function oh(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var lh={[$r]:$r,[jr]:ta,[Qr]:Qr,[ji]:ea,[Kr]:Kr,[ta]:jr,[na]:na,[ea]:ji},Un=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},Kt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Eo=Math.PI/180,aa=180/Math.PI;function gr(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Kt[i&255]+Kt[i>>8&255]+Kt[i>>16&255]+Kt[i>>24&255]+"-"+Kt[e&255]+Kt[e>>8&255]+"-"+Kt[e>>16&15|64]+Kt[e>>24&255]+"-"+Kt[t&63|128]+Kt[t>>8&255]+"-"+Kt[t>>16&255]+Kt[t>>24&255]+Kt[n&255]+Kt[n>>8&255]+Kt[n>>16&255]+Kt[n>>24&255]).toLowerCase()}function mt(i,e,t){return Math.max(e,Math.min(t,i))}function au(i,e){return(i%e+e)%e}function Co(i,e,t){return(1-t)*i+t*e}function ch(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Cl(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function ou(i,e){if(e.constructor===Float32Array)return i;let t=Cl(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/t,-1)}function lu(i,e){if(e.constructor===Float32Array)return i;let t=Cl(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*t)}var Dl=class Dl{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=mt(this.x,e.x,t.x),this.y=mt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=mt(this.x,e,t),this.y=mt(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(mt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Dl.prototype.isVector2=!0;var $e=Dl,vn=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],u=n[s+2],d=n[s+3],h=r[a+0],m=r[a+1],x=r[a+2],S=r[a+3];if(d!==S||l!==h||c!==m||u!==x){let f=l*h+c*m+u*x+d*S;f<0&&(h=-h,m=-m,x=-x,S=-S,f=-f);let p=1-o;if(f<.9995){let v=Math.acos(f),E=Math.sin(v);p=Math.sin(p*v)/E,o=Math.sin(o*v)/E,l=l*p+h*o,c=c*p+m*o,u=u*p+x*o,d=d*p+S*o}else{l=l*p+h*o,c=c*p+m*o,u=u*p+x*o,d=d*p+S*o;let v=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=v,c*=v,u*=v,d*=v}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],u=n[s+3],d=r[a],h=r[a+1],m=r[a+2],x=r[a+3];return e[t]=o*x+u*d+l*m-c*h,e[t+1]=l*x+u*h+c*d-o*m,e[t+2]=c*x+u*m+o*h-l*d,e[t+3]=u*x-o*d-l*h-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(s/2),d=o(r/2),h=l(n/2),m=l(s/2),x=l(r/2);switch(a){case"XYZ":this._x=h*u*d+c*m*x,this._y=c*m*d-h*u*x,this._z=c*u*x+h*m*d,this._w=c*u*d-h*m*x;break;case"YXZ":this._x=h*u*d+c*m*x,this._y=c*m*d-h*u*x,this._z=c*u*x-h*m*d,this._w=c*u*d+h*m*x;break;case"ZXY":this._x=h*u*d-c*m*x,this._y=c*m*d+h*u*x,this._z=c*u*x+h*m*d,this._w=c*u*d-h*m*x;break;case"ZYX":this._x=h*u*d-c*m*x,this._y=c*m*d+h*u*x,this._z=c*u*x-h*m*d,this._w=c*u*d+h*m*x;break;case"YZX":this._x=h*u*d+c*m*x,this._y=c*m*d+h*u*x,this._z=c*u*x-h*m*d,this._w=c*u*d-h*m*x;break;case"XZY":this._x=h*u*d-c*m*x,this._y=c*m*d-h*u*x,this._z=c*u*x+h*m*d,this._w=c*u*d+h*m*x;break;default:Ge("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],d=t[10],h=n+o+d;if(h>0){let m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(u-l)*m,this._y=(r-c)*m,this._z=(a-s)*m}else if(n>o&&n>d){let m=2*Math.sqrt(1+n-o-d);this._w=(u-l)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+c)/m}else if(o>d){let m=2*Math.sqrt(1+o-n-d);this._w=(r-c)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(l+u)/m}else{let m=2*Math.sqrt(1+d-n-o);this._w=(a-s)/m,this._x=(r+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(mt(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-s*o,this._w=a*u-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Nl=class Nl{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ec.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ec.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),u=2*(o*t-r*s),d=2*(r*n-a*t);return this.x=t+l*c+a*d-o*u,this.y=n+l*u+o*c-r*d,this.z=s+l*d+r*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=mt(this.x,e.x,t.x),this.y=mt(this.y,e.y,t.y),this.z=mt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=mt(this.x,e,t),this.y=mt(this.y,e,t),this.z=mt(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(mt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ro.copy(this).projectOnVector(e),this.sub(Ro)}reflect(e){return this.sub(Ro.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(mt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Nl.prototype.isVector3=!0;var z=Nl,Ro=new z,ec=new vn,Ul=class Ul{constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let u=this.elements;return u[0]=e,u[1]=s,u[2]=o,u[3]=t,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],d=n[7],h=n[2],m=n[5],x=n[8],S=s[0],f=s[3],p=s[6],v=s[1],E=s[4],b=s[7],R=s[2],w=s[5],g=s[8];return r[0]=a*S+o*v+l*R,r[3]=a*f+o*E+l*w,r[6]=a*p+o*b+l*g,r[1]=c*S+u*v+d*R,r[4]=c*f+u*E+d*w,r[7]=c*p+u*b+d*g,r[2]=h*S+m*v+x*R,r[5]=h*f+m*E+x*w,r[8]=h*p+m*b+x*g,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*r*u+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],d=u*a-o*c,h=o*l-u*r,m=c*r-a*l,x=t*d+n*h+s*m;if(x===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/x;return e[0]=d*S,e[1]=(s*c-u*n)*S,e[2]=(o*n-s*a)*S,e[3]=h*S,e[4]=(u*t-s*l)*S,e[5]=(s*r-o*t)*S,e[6]=m*S,e[7]=(n*l-c*t)*S,e[8]=(a*t-n*r)*S,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Ps("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Po.makeScale(e,t)),this}rotate(e){return Ps("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Po.makeRotation(-e)),this}translate(e,t){return Ps("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Po.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Ul.prototype.isMatrix3=!0;var Ze=Ul,Po=new Ze,tc=new Ze().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),nc=new Ze().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function cu(){let i={enabled:!0,workingColorSpace:Ls,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===vt&&(s.r=Jn(s.r),s.g=Jn(s.g),s.b=Jn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===vt&&(s.r=Ki(s.r),s.g=Ki(s.g),s.b=Ki(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===ni?Ds:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ls]:{primaries:e,whitePoint:n,transfer:Ds,toXYZ:tc,fromXYZ:nc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:en},outputColorSpaceConfig:{drawingBufferColorSpace:en}},[en]:{primaries:e,whitePoint:n,transfer:vt,toXYZ:tc,fromXYZ:nc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:en}}}),i}var pt=cu();function Jn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ki(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Oi,oa=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement=="undefined")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Oi===void 0&&(Oi=Ns("canvas")),Oi.width=e.width,Oi.height=e.height;let s=Oi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=Oi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement!="undefined"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&e instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&e instanceof ImageBitmap){let t=Ns("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Jn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Jn(t[n]/255)*255):t[n]=Jn(t[n]);return{data:t,width:e.width,height:e.height}}else return Ge("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},hu=0,ts=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:hu++}),this.uuid=gr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement!="undefined"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame!="undefined"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Io(s[a].image)):r.push(Io(s[a]))}else r=Io(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Io(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?oa.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ge("Texture: Unable to serialize Texture."),{})}var uu=0,Lo=new z,sn=class i extends Un{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Nn,s=Nn,r=nn,a=ei,o=In,l=ln,c=i.DEFAULT_ANISOTROPY,u=ni){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:uu++}),this.uuid=gr(),this.name="",this.source=new ts(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new $e(0,0),this.repeat=new $e(1,1),this.center=new $e(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ze,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Lo).x}get height(){return this.source.getSize(Lo).y}get depth(){return this.source.getSize(Lo).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Ge(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ge(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==gl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case ia:e.x=e.x-Math.floor(e.x);break;case Nn:e.x=e.x<0?0:1;break;case sa:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case ia:e.y=e.y-Math.floor(e.y);break;case Nn:e.y=e.y<0?0:1;break;case sa:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};sn.DEFAULT_IMAGE=null;sn.DEFAULT_MAPPING=gl;sn.DEFAULT_ANISOTROPY=1;var Fl=class Fl{constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],u=l[4],d=l[8],h=l[1],m=l[5],x=l[9],S=l[2],f=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-S)<.01&&Math.abs(x-f)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+S)<.1&&Math.abs(x+f)<.1&&Math.abs(c+m+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(c+1)/2,b=(m+1)/2,R=(p+1)/2,w=(u+h)/4,g=(d+S)/4,M=(x+f)/4;return E>b&&E>R?E<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(E),s=w/n,r=g/n):b>R?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=w/s,r=M/s):R<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),n=g/r,s=M/r),this.set(n,s,r,t),this}let v=Math.sqrt((f-x)*(f-x)+(d-S)*(d-S)+(h-u)*(h-u));return Math.abs(v)<.001&&(v=1),this.x=(f-x)/v,this.y=(d-S)/v,this.z=(h-u)/v,this.w=Math.acos((c+m+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=mt(this.x,e.x,t.x),this.y=mt(this.y,e.y,t.y),this.z=mt(this.z,e.z,t.z),this.w=mt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=mt(this.x,e,t),this.y=mt(this.y,e,t),this.z=mt(this.z,e,t),this.w=mt(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(mt(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Fl.prototype.isVector4=!0;var Rt=Fl,la=class extends Un{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:nn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Rt(0,0,e,t),this.scissorTest=!1,this.viewport=new Rt(0,0,e,t),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new sn({width:e,height:t,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:nn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new ts(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},mn=class extends la{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Us=class extends sn{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Gt,this.minFilter=Gt,this.wrapR=Nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var ca=class extends sn{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Gt,this.minFilter=Gt,this.wrapR=Nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Ea=class Ea{constructor(e,t,n,s,r,a,o,l,c,u,d,h,m,x,S,f){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,u,d,h,m,x,S,f)}set(e,t,n,s,r,a,o,l,c,u,d,h,m,x,S,f){let p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=d,p[14]=h,p[3]=m,p[7]=x,p[11]=S,p[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ea().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/Bi.setFromMatrixColumn(e,0).length(),r=1/Bi.setFromMatrixColumn(e,1).length(),a=1/Bi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let h=a*u,m=a*d,x=o*u,S=o*d;t[0]=l*u,t[4]=-l*d,t[8]=c,t[1]=m+x*c,t[5]=h-S*c,t[9]=-o*l,t[2]=S-h*c,t[6]=x+m*c,t[10]=a*l}else if(e.order==="YXZ"){let h=l*u,m=l*d,x=c*u,S=c*d;t[0]=h+S*o,t[4]=x*o-m,t[8]=a*c,t[1]=a*d,t[5]=a*u,t[9]=-o,t[2]=m*o-x,t[6]=S+h*o,t[10]=a*l}else if(e.order==="ZXY"){let h=l*u,m=l*d,x=c*u,S=c*d;t[0]=h-S*o,t[4]=-a*d,t[8]=x+m*o,t[1]=m+x*o,t[5]=a*u,t[9]=S-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let h=a*u,m=a*d,x=o*u,S=o*d;t[0]=l*u,t[4]=x*c-m,t[8]=h*c+S,t[1]=l*d,t[5]=S*c+h,t[9]=m*c-x,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let h=a*l,m=a*c,x=o*l,S=o*c;t[0]=l*u,t[4]=S-h*d,t[8]=x*d+m,t[1]=d,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=m*d+x,t[10]=h-S*d}else if(e.order==="XZY"){let h=a*l,m=a*c,x=o*l,S=o*c;t[0]=l*u,t[4]=-d,t[8]=c*u,t[1]=h*d+S,t[5]=a*u,t[9]=m*d-x,t[2]=x*d-m,t[6]=o*u,t[10]=S*d+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(du,e,fu)}lookAt(e,t,n){let s=this.elements;return fn.subVectors(e,t),fn.lengthSq()===0&&(fn.z=1),fn.normalize(),ai.crossVectors(n,fn),ai.lengthSq()===0&&(Math.abs(n.z)===1?fn.x+=1e-4:fn.z+=1e-4,fn.normalize(),ai.crossVectors(n,fn)),ai.normalize(),Ar.crossVectors(fn,ai),s[0]=ai.x,s[4]=Ar.x,s[8]=fn.x,s[1]=ai.y,s[5]=Ar.y,s[9]=fn.y,s[2]=ai.z,s[6]=Ar.z,s[10]=fn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],d=n[5],h=n[9],m=n[13],x=n[2],S=n[6],f=n[10],p=n[14],v=n[3],E=n[7],b=n[11],R=n[15],w=s[0],g=s[4],M=s[8],D=s[12],C=s[1],I=s[5],N=s[9],k=s[13],P=s[2],Y=s[6],$=s[10],J=s[14],le=s[3],j=s[7],re=s[11],T=s[15];return r[0]=a*w+o*C+l*P+c*le,r[4]=a*g+o*I+l*Y+c*j,r[8]=a*M+o*N+l*$+c*re,r[12]=a*D+o*k+l*J+c*T,r[1]=u*w+d*C+h*P+m*le,r[5]=u*g+d*I+h*Y+m*j,r[9]=u*M+d*N+h*$+m*re,r[13]=u*D+d*k+h*J+m*T,r[2]=x*w+S*C+f*P+p*le,r[6]=x*g+S*I+f*Y+p*j,r[10]=x*M+S*N+f*$+p*re,r[14]=x*D+S*k+f*J+p*T,r[3]=v*w+E*C+b*P+R*le,r[7]=v*g+E*I+b*Y+R*j,r[11]=v*M+E*N+b*$+R*re,r[15]=v*D+E*k+b*J+R*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],d=e[6],h=e[10],m=e[14],x=e[3],S=e[7],f=e[11],p=e[15],v=l*m-c*h,E=o*m-c*d,b=o*h-l*d,R=a*m-c*u,w=a*h-l*u,g=a*d-o*u;return t*(S*v-f*E+p*b)-n*(x*v-f*R+p*w)+s*(x*E-S*R+p*g)-r*(x*b-S*w+f*g)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],u=e[10];return t*(a*u-o*c)-n*(r*u-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],d=e[9],h=e[10],m=e[11],x=e[12],S=e[13],f=e[14],p=e[15],v=t*o-n*a,E=t*l-s*a,b=t*c-r*a,R=n*l-s*o,w=n*c-r*o,g=s*c-r*l,M=u*S-d*x,D=u*f-h*x,C=u*p-m*x,I=d*f-h*S,N=d*p-m*S,k=h*p-m*f,P=v*k-E*N+b*I+R*C-w*D+g*M;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let Y=1/P;return e[0]=(o*k-l*N+c*I)*Y,e[1]=(s*N-n*k-r*I)*Y,e[2]=(S*g-f*w+p*R)*Y,e[3]=(h*w-d*g-m*R)*Y,e[4]=(l*C-a*k-c*D)*Y,e[5]=(t*k-s*C+r*D)*Y,e[6]=(f*b-x*g-p*E)*Y,e[7]=(u*g-h*b+m*E)*Y,e[8]=(a*N-o*C+c*M)*Y,e[9]=(n*C-t*N-r*M)*Y,e[10]=(x*w-S*b+p*v)*Y,e[11]=(d*b-u*w-m*v)*Y,e[12]=(o*D-a*I-l*M)*Y,e[13]=(t*I-n*D+s*M)*Y,e[14]=(S*E-x*R-f*v)*Y,e[15]=(u*R-d*E+h*v)*Y,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+n,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,u=a+a,d=o+o,h=r*c,m=r*u,x=r*d,S=a*u,f=a*d,p=o*d,v=l*c,E=l*u,b=l*d,R=n.x,w=n.y,g=n.z;return s[0]=(1-(S+p))*R,s[1]=(m+b)*R,s[2]=(x-E)*R,s[3]=0,s[4]=(m-b)*w,s[5]=(1-(h+p))*w,s[6]=(f+v)*w,s[7]=0,s[8]=(x+E)*g,s[9]=(f-v)*g,s[10]=(1-(h+S))*g,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=Bi.set(s[0],s[1],s[2]).length(),o=Bi.set(s[4],s[5],s[6]).length(),l=Bi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),wn.copy(this);let c=1/a,u=1/o,d=1/l;return wn.elements[0]*=c,wn.elements[1]*=c,wn.elements[2]*=c,wn.elements[4]*=u,wn.elements[5]*=u,wn.elements[6]*=u,wn.elements[8]*=d,wn.elements[9]*=d,wn.elements[10]*=d,t.setFromRotationMatrix(wn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=xn,l=!1){let c=this.elements,u=2*r/(t-e),d=2*r/(n-s),h=(t+e)/(t-e),m=(n+s)/(n-s),x,S;if(l)x=r/(a-r),S=a*r/(a-r);else if(o===xn)x=-(a+r)/(a-r),S=-2*a*r/(a-r);else if(o===Qi)x=-a/(a-r),S=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=d,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=xn,l=!1){let c=this.elements,u=2/(t-e),d=2/(n-s),h=-(t+e)/(t-e),m=-(n+s)/(n-s),x,S;if(l)x=1/(a-r),S=a/(a-r);else if(o===xn)x=-2/(a-r),S=-(a+r)/(a-r);else if(o===Qi)x=-1/(a-r),S=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=d,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=x,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Ea.prototype.isMatrix4=!0;var yt=Ea,Bi=new z,wn=new yt,du=new z(0,0,0),fu=new z(1,1,1),ai=new z,Ar=new z,fn=new z,ic=new yt,sc=new vn,Fn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],d=s[2],h=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(mt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-mt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(mt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-mt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(mt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-mt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,m),this._y=0);break;default:Ge("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ic.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ic,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return sc.setFromEuler(this),this.setFromQuaternion(sc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Fn.DEFAULT_ORDER="XYZ";var Fs=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},pu=0,rc=new z,zi=new vn,Wn=new yt,Tr=new z,ws=new z,mu=new z,gu=new vn,ac=new z(1,0,0),oc=new z(0,1,0),lc=new z(0,0,1),cc={type:"added"},_u={type:"removed"},ki={type:"childadded",child:null},Do={type:"childremoved",child:null},Vt=class i extends Un{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:pu++}),this.uuid=gr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new z,t=new Fn,n=new vn,s=new z(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new yt},normalMatrix:{value:new Ze}}),this.matrix=new yt,this.matrixWorld=new yt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Fs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return zi.setFromAxisAngle(e,t),this.quaternion.multiply(zi),this}rotateOnWorldAxis(e,t){return zi.setFromAxisAngle(e,t),this.quaternion.premultiply(zi),this}rotateX(e){return this.rotateOnAxis(ac,e)}rotateY(e){return this.rotateOnAxis(oc,e)}rotateZ(e){return this.rotateOnAxis(lc,e)}translateOnAxis(e,t){return rc.copy(e).applyQuaternion(this.quaternion),this.position.add(rc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ac,e)}translateY(e){return this.translateOnAxis(oc,e)}translateZ(e){return this.translateOnAxis(lc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Wn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Tr.copy(e):Tr.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ws.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Wn.lookAt(ws,Tr,this.up):Wn.lookAt(Tr,ws,this.up),this.quaternion.setFromRotationMatrix(Wn),s&&(Wn.extractRotation(s.matrixWorld),zi.setFromRotationMatrix(Wn),this.quaternion.premultiply(zi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Xe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(cc),ki.child=e,this.dispatchEvent(ki),ki.child=null):Xe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(_u),Do.child=e,this.dispatchEvent(Do),Do.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Wn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Wn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Wn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(cc),ki.child=e,this.dispatchEvent(ki),ki.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ws,e,mu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ws,gu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),d=a(e.shapes),h=a(e.skeletons),m=a(e.animations),x=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),d.length>0&&(n.shapes=d),h.length>0&&(n.skeletons=h),m.length>0&&(n.animations=m),x.length>0&&(n.nodes=x)}return n.object=s,n;function a(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Vt.DEFAULT_UP=new z(0,1,0);Vt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Vt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var on=class extends Vt{constructor(){super(),this.isGroup=!0,this.type="Group"}},xu={type:"move"},ns=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new on,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new on,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new on,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let S of e.hand.values()){let f=t.getJointPose(S,n),p=this._getHandJoint(c,S);f!==null&&(p.matrix.fromArray(f.transform.matrix),p.matrix.decompose(p.position,p.quaternion,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=f.radius),p.visible=f!==null}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),m=.02,x=.005;c.inputState.pinching&&h>m+x?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=m-x&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(xu)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new on;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},hh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},oi={h:0,s:0,l:0},Er={h:0,s:0,l:0};function No(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var et=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=en){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,pt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=pt.workingColorSpace){return this.r=e,this.g=t,this.b=n,pt.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=pt.workingColorSpace){if(e=au(e,1),t=mt(t,0,1),n=mt(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=No(a,r,e+1/3),this.g=No(a,r,e),this.b=No(a,r,e-1/3)}return pt.colorSpaceToWorking(this,s),this}setStyle(e,t=en){function n(r){r!==void 0&&parseFloat(r)<1&&Ge("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,t);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ge("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Ge("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=en){let n=hh[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ge("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Jn(e.r),this.g=Jn(e.g),this.b=Jn(e.b),this}copyLinearToSRGB(e){return this.r=Ki(e.r),this.g=Ki(e.g),this.b=Ki(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=en){return pt.workingToColorSpace(jt.copy(this),e),Math.round(mt(jt.r*255,0,255))*65536+Math.round(mt(jt.g*255,0,255))*256+Math.round(mt(jt.b*255,0,255))}getHexString(e=en){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=pt.workingColorSpace){pt.workingToColorSpace(jt.copy(this),t);let n=jt.r,s=jt.g,r=jt.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,u=(o+a)/2;if(o===a)l=0,c=0;else{let d=a-o;switch(c=u<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=pt.workingColorSpace){return pt.workingToColorSpace(jt.copy(this),t),e.r=jt.r,e.g=jt.g,e.b=jt.b,e}getStyle(e=en){pt.workingToColorSpace(jt.copy(this),e);let t=jt.r,n=jt.g,s=jt.b;return e!==en?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(oi),this.setHSL(oi.h+e,oi.s+t,oi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(oi),e.getHSL(Er);let n=Co(oi.h,Er.h,t),s=Co(oi.s,Er.s,t),r=Co(oi.l,Er.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},jt=new et;et.NAMES=hh;var Os=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new et(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Bs=class extends Vt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Fn,this.environmentIntensity=1,this.environmentRotation=new Fn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},An=new z,Xn=new z,Uo=new z,qn=new z,Gi=new z,Vi=new z,hc=new z,Fo=new z,Oo=new z,Bo=new z,zo=new Rt,ko=new Rt,Go=new Rt,ui=class i{constructor(e=new z,t=new z,n=new z){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),An.subVectors(e,t),s.cross(An);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){An.subVectors(s,t),Xn.subVectors(n,t),Uo.subVectors(e,t);let a=An.dot(An),o=An.dot(Xn),l=An.dot(Uo),c=Xn.dot(Xn),u=Xn.dot(Uo),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;let h=1/d,m=(c*l-o*u)*h,x=(a*u-o*l)*h;return r.set(1-m-x,x,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,qn)===null?!1:qn.x>=0&&qn.y>=0&&qn.x+qn.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,qn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,qn.x),l.addScaledVector(a,qn.y),l.addScaledVector(o,qn.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return zo.setScalar(0),ko.setScalar(0),Go.setScalar(0),zo.fromBufferAttribute(e,t),ko.fromBufferAttribute(e,n),Go.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(zo,r.x),a.addScaledVector(ko,r.y),a.addScaledVector(Go,r.z),a}static isFrontFacing(e,t,n,s){return An.subVectors(n,t),Xn.subVectors(e,t),An.cross(Xn).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return An.subVectors(this.c,this.b),Xn.subVectors(this.a,this.b),An.cross(Xn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;Gi.subVectors(s,n),Vi.subVectors(r,n),Fo.subVectors(e,n);let l=Gi.dot(Fo),c=Vi.dot(Fo);if(l<=0&&c<=0)return t.copy(n);Oo.subVectors(e,s);let u=Gi.dot(Oo),d=Vi.dot(Oo);if(u>=0&&d<=u)return t.copy(s);let h=l*d-u*c;if(h<=0&&l>=0&&u<=0&&l-u>0)return a=l/(l-u),t.copy(n).addScaledVector(Gi,a);Bo.subVectors(e,r);let m=Gi.dot(Bo),x=Vi.dot(Bo);if(x>=0&&m<=x)return t.copy(r);let S=m*c-l*x;if(S<=0&&c>=0&&x<=0)return o=c/(c-x),t.copy(n).addScaledVector(Vi,o);let f=u*x-m*d;if(f<=0&&d-u>=0&&m-x>=0)return hc.subVectors(r,s),o=(d-u)/(d-u+(m-x)),t.copy(s).addScaledVector(hc,o);let p=1/(f+S+h);return a=S*p,o=h*p,t.copy(n).addScaledVector(Gi,a).addScaledVector(Vi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},On=class{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Tn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Tn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Tn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Tn):Tn.fromBufferAttribute(r,a),Tn.applyMatrix4(e.matrixWorld),this.expandByPoint(Tn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Cr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Cr.copy(n.boundingBox)),Cr.applyMatrix4(e.matrixWorld),this.union(Cr)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Tn),Tn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(As),Rr.subVectors(this.max,As),Hi.subVectors(e.a,As),Wi.subVectors(e.b,As),Xi.subVectors(e.c,As),li.subVectors(Wi,Hi),ci.subVectors(Xi,Wi),bi.subVectors(Hi,Xi);let t=[0,-li.z,li.y,0,-ci.z,ci.y,0,-bi.z,bi.y,li.z,0,-li.x,ci.z,0,-ci.x,bi.z,0,-bi.x,-li.y,li.x,0,-ci.y,ci.x,0,-bi.y,bi.x,0];return!Vo(t,Hi,Wi,Xi,Rr)||(t=[1,0,0,0,1,0,0,0,1],!Vo(t,Hi,Wi,Xi,Rr))?!1:(Pr.crossVectors(li,ci),t=[Pr.x,Pr.y,Pr.z],Vo(t,Hi,Wi,Xi,Rr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Tn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Tn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Yn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Yn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Yn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Yn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Yn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Yn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Yn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Yn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Yn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Yn=[new z,new z,new z,new z,new z,new z,new z,new z],Tn=new z,Cr=new On,Hi=new z,Wi=new z,Xi=new z,li=new z,ci=new z,bi=new z,As=new z,Rr=new z,Pr=new z,wi=new z;function Vo(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){wi.fromArray(i,r);let o=s.x*Math.abs(wi.x)+s.y*Math.abs(wi.y)+s.z*Math.abs(wi.z),l=e.dot(wi),c=t.dot(wi),u=n.dot(wi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var kt=new z,Ir=new $e,vu=0,Cn=class extends Un{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:vu++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=sh,this.updateRanges=[],this.gpuType=Mn,this.version=0,this._normalizationScale=e!==void 0?Cl(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ir.fromBufferAttribute(this,t),Ir.applyMatrix3(e),this.setXY(t,Ir.x,Ir.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)kt.fromBufferAttribute(this,t),kt.applyMatrix3(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)kt.fromBufferAttribute(this,t),kt.applyMatrix4(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)kt.fromBufferAttribute(this,t),kt.applyNormalMatrix(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)kt.fromBufferAttribute(this,t),kt.transformDirection(e),this.setXYZ(t,kt.x,kt.y,kt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){let t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):ou(e,this.array)}_normalize(e){let t=this._normalizationScale;return t!==void 0?Math.round(e*t):lu(e,this.array)}};var zs=class extends Cn{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var ks=class extends Cn{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var it=class extends Cn{constructor(e,t,n){super(new Float32Array(e),t,n)}},yu=new On,Ts=new z,Ho=new z,Kn=class{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):yu.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ts.subVectors(e,this.center);let t=Ts.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Ts,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Ho.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ts.copy(e.center).add(Ho)),this.expandByPoint(Ts.copy(e.center).sub(Ho))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Mu=0,_n=new yt,Wo=new Vt,qi=new z,pn=new On,Es=new On,Jt=new z,Bt=class i extends Un{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Mu++}),this.uuid=gr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(su(e)?ks:zs)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Ze().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return _n.makeRotationFromQuaternion(e),this.applyMatrix4(_n),this}rotateX(e){return _n.makeRotationX(e),this.applyMatrix4(_n),this}rotateY(e){return _n.makeRotationY(e),this.applyMatrix4(_n),this}rotateZ(e){return _n.makeRotationZ(e),this.applyMatrix4(_n),this}translate(e,t,n){return _n.makeTranslation(e,t,n),this.applyMatrix4(_n),this}scale(e,t,n){return _n.makeScale(e,t,n),this.applyMatrix4(_n),this}lookAt(e){return Wo.lookAt(e),Wo.updateMatrix(),this.applyMatrix4(Wo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(qi).negate(),this.translate(qi.x,qi.y,qi.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new it(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Ge("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new On);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];pn.setFromBufferAttribute(r),this.morphTargetsRelative?(Jt.addVectors(this.boundingBox.min,pn.min),this.boundingBox.expandByPoint(Jt),Jt.addVectors(this.boundingBox.max,pn.max),this.boundingBox.expandByPoint(Jt)):(this.boundingBox.expandByPoint(pn.min),this.boundingBox.expandByPoint(pn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Xe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Kn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Xe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(e){let n=this.boundingSphere.center;if(pn.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];Es.setFromBufferAttribute(o),this.morphTargetsRelative?(Jt.addVectors(pn.min,Es.min),pn.expandByPoint(Jt),Jt.addVectors(pn.max,Es.max),pn.expandByPoint(Jt)):(pn.expandByPoint(Es.min),pn.expandByPoint(Es.max))}pn.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Jt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Jt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Jt.fromBufferAttribute(o,c),l&&(qi.fromBufferAttribute(e,c),Jt.add(qi)),s=Math.max(s,n.distanceToSquared(Jt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Xe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Xe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Cn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],c=new Uint8Array(n.count);for(let D=0;D<n.count;D++)o[D]=new z,l[D]=new z;let u=new z,d=new z,h=new z,m=new $e,x=new $e,S=new $e,f=new z,p=new z;function v(D,C,I){c[D]=c[C]=c[I]=1,u.fromBufferAttribute(n,D),d.fromBufferAttribute(n,C),h.fromBufferAttribute(n,I),m.fromBufferAttribute(r,D),x.fromBufferAttribute(r,C),S.fromBufferAttribute(r,I),d.sub(u),h.sub(u),x.sub(m),S.sub(m);let N=1/(x.x*S.y-S.x*x.y);isFinite(N)&&(f.copy(d).multiplyScalar(S.y).addScaledVector(h,-x.y).multiplyScalar(N),p.copy(h).multiplyScalar(x.x).addScaledVector(d,-S.x).multiplyScalar(N),o[D].add(f),o[C].add(f),o[I].add(f),l[D].add(p),l[C].add(p),l[I].add(p))}let E=this.groups;E.length===0&&(E=[{start:0,count:e.count}]);for(let D=0,C=E.length;D<C;++D){let I=E[D],N=I.start,k=I.count;for(let P=N,Y=N+k;P<Y;P+=3)v(e.getX(P+0),e.getX(P+1),e.getX(P+2))}let b=new z,R=new z,w=new z,g=new z;function M(D){w.fromBufferAttribute(s,D),g.copy(w);let C=o[D];b.copy(C),b.sub(w.multiplyScalar(w.dot(C))).normalize(),R.crossVectors(g,C);let N=R.dot(l[D])<0?-1:1;a.setXYZW(D,b.x,b.y,b.z,N)}for(let D=0,C=n.count;D<C;++D)c[D]&&M(D);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Cn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let h=0,m=n.count;h<m;h++)n.setXYZ(h,0,0,0);let s=new z,r=new z,a=new z,o=new z,l=new z,c=new z,u=new z,d=new z;if(e)for(let h=0,m=e.count;h<m;h+=3){let x=e.getX(h+0),S=e.getX(h+1),f=e.getX(h+2);s.fromBufferAttribute(t,x),r.fromBufferAttribute(t,S),a.fromBufferAttribute(t,f),u.subVectors(a,r),d.subVectors(s,r),u.cross(d),o.fromBufferAttribute(n,x),l.fromBufferAttribute(n,S),c.fromBufferAttribute(n,f),o.add(u),l.add(u),c.add(u),n.setXYZ(x,o.x,o.y,o.z),n.setXYZ(S,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let h=0,m=t.count;h<m;h+=3)s.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),u.subVectors(a,r),d.subVectors(s,r),u.cross(d),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Jt.fromBufferAttribute(e,t),Jt.normalize(),e.setXYZ(t,Jt.x,Jt.y,Jt.z)}toNonIndexed(){function e(o,l){let c=o.array,u=o.itemSize,d=o.normalized,h=new c.constructor(l.length*u),m=0,x=0;for(let S=0,f=l.length;S<f;S++){o.isInterleavedBufferAttribute?m=l[S]*o.data.stride+o.offset:m=l[S]*u;for(let p=0;p<u;p++)h[x++]=c[m++]}return new Cn(h,u,d)}if(this.index===null)return Ge("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let u=0,d=c.length;u<d;u++){let h=c[u],m=e(h,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){let m=c[d];u.push(m.toJSON(e.data))}u.length>0&&(s[l]=u,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(t))}let r=e.morphAttributes;for(let c in r){let u=[],d=r[c];for(let h=0,m=d.length;h<m;h++)u.push(d[h].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,u=a.length;c<u;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Xo=new z,Su=new z,bu=new Ze,En=class{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Xo.subVectors(n,t).cross(Su.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(Xo),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||bu.getNormalMatrix(e),s=this.coplanarPoint(Xo).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},wu=0,jn=class extends Un{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:wu++}),this.uuid=gr(),this.name="",this.type="Material",this.blending=hs,this.side=xi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=al,this.blendDst=ol,this.blendEquation=Ri,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new et(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=jc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Jr,this.stencilZFail=Jr,this.stencilZPass=Jr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Ge(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ge(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new et().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new En().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new $e().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new $e().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var Zn=new z,qo=new z,Lr=new z,Dr=new z,Gs=class{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Zn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Zn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Zn.copy(this.origin).addScaledVector(this.direction,t),Zn.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){qo.copy(e).add(t).multiplyScalar(.5),Lr.copy(t).sub(e).normalize(),Dr.copy(this.origin).sub(qo);let r=e.distanceTo(t)*.5,a=-this.direction.dot(Lr),o=Dr.dot(this.direction),l=-Dr.dot(Lr),c=Dr.lengthSq(),u=Math.abs(1-a*a),d,h,m,x;if(u>0)if(d=a*l-o,h=a*o-l,x=r*u,d>=0)if(h>=-x)if(h<=x){let S=1/u;d*=S,h*=S,m=d*(d+a*h+2*o)+h*(a*d+h+2*l)+c}else h=r,d=Math.max(0,-(a*h+o)),m=-d*d+h*(h+2*l)+c;else h=-r,d=Math.max(0,-(a*h+o)),m=-d*d+h*(h+2*l)+c;else h<=-x?(d=Math.max(0,-(-a*r+o)),h=d>0?-r:Math.min(Math.max(-r,-l),r),m=-d*d+h*(h+2*l)+c):h<=x?(d=0,h=Math.min(Math.max(-r,-l),r),m=h*(h+2*l)+c):(d=Math.max(0,-(a*r+o)),h=d>0?r:Math.min(Math.max(-r,-l),r),m=-d*d+h*(h+2*l)+c);else h=a>0?-r:r,d=Math.max(0,-(a*h+o)),m=-d*d+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(qo).addScaledVector(Lr,h),m}intersectSphere(e,t){if(e.radius<0)return null;Zn.subVectors(e.center,this.origin);let n=Zn.dot(this.direction),s=Zn.dot(Zn)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(n=(e.min.x-h.x)*c,s=(e.max.x-h.x)*c):(n=(e.max.x-h.x)*c,s=(e.min.x-h.x)*c),u>=0?(r=(e.min.y-h.y)*u,a=(e.max.y-h.y)*u):(r=(e.max.y-h.y)*u,a=(e.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(e.min.z-h.z)*d,l=(e.max.z-h.z)*d):(o=(e.max.z-h.z)*d,l=(e.min.z-h.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Zn)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,d=e.x-a.x,h=e.y-a.y,m=e.z-a.z,x=t.x-a.x,S=t.y-a.y,f=t.z-a.z,p=n.x-a.x,v=n.y-a.y,E=n.z-a.z,b=Math.abs(l),R=Math.abs(c),w=Math.abs(u),g,M,D,C,I,N,k,P,Y,$,J,le;if(b>=R&&b>=w?(D=l,N=d,Y=x,le=p,l>=0?(g=c,M=u,C=h,I=m,k=S,P=f,$=v,J=E):(g=u,M=c,C=m,I=h,k=f,P=S,$=E,J=v)):R>=w?(D=c,N=h,Y=S,le=v,c>=0?(g=u,M=l,C=m,I=d,k=f,P=x,$=E,J=p):(g=l,M=u,C=d,I=m,k=x,P=f,$=p,J=E)):(D=u,N=m,Y=f,le=E,u>=0?(g=l,M=c,C=d,I=h,k=x,P=S,$=p,J=v):(g=c,M=l,C=h,I=d,k=S,P=x,$=v,J=p)),D===0)return null;let j=g/D,re=M/D,T=1/D,X=C-j*N,he=I-re*N,W=k-j*Y,K=P-re*Y,me=$-j*le,Me=J-re*le,ee=me*K-Me*W,te=X*Me-he*me,Ke=W*he-K*X;if(s){if(ee<0||te<0||Ke<0)return null}else if((ee<0||te<0||Ke<0)&&(ee>0||te>0||Ke>0))return null;let Te=ee+te+Ke;if(Te===0)return null;let ke=T*(ee*N+te*Y+Ke*le);return(Te>0?ke<0:ke>0)?null:this.at(ke/Te,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Bn=class extends jn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new et(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Fn,this.combine=ll,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},uc=new yt,Ai=new Gs,Nr=new Kn,dc=new z,Ur=new z,Fr=new z,Or=new z,Yo=new z,Br=new z,fc=new z,zr=new z,Tt=class extends Vt{constructor(e=new Bt,t=new Bn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){Br.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=o[l],d=r[l];u!==0&&(Yo.fromBufferAttribute(d,e),a?Br.addScaledVector(Yo,u):Br.addScaledVector(Yo.sub(t),u))}t.add(Br)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Nr.copy(n.boundingSphere),Nr.applyMatrix4(r),Ai.copy(e.ray).recast(e.near),!(Nr.containsPoint(Ai.origin)===!1&&(Ai.intersectSphere(Nr,dc)===null||Ai.origin.distanceToSquared(dc)>(e.far-e.near)**2))&&(uc.copy(r).invert(),Ai.copy(e.ray).applyMatrix4(uc),!(n.boundingBox!==null&&Ai.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Ai)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,d=r.attributes.normal,h=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let x=0,S=h.length;x<S;x++){let f=h[x],p=a[f.materialIndex],v=Math.max(f.start,m.start),E=Math.min(o.count,Math.min(f.start+f.count,m.start+m.count));for(let b=v,R=E;b<R;b+=3){let w=o.getX(b),g=o.getX(b+1),M=o.getX(b+2);s=kr(this,p,e,n,c,u,d,w,g,M),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{let x=Math.max(0,m.start),S=Math.min(o.count,m.start+m.count);for(let f=x,p=S;f<p;f+=3){let v=o.getX(f),E=o.getX(f+1),b=o.getX(f+2);s=kr(this,a,e,n,c,u,d,v,E,b),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let x=0,S=h.length;x<S;x++){let f=h[x],p=a[f.materialIndex],v=Math.max(f.start,m.start),E=Math.min(l.count,Math.min(f.start+f.count,m.start+m.count));for(let b=v,R=E;b<R;b+=3){let w=b,g=b+1,M=b+2;s=kr(this,p,e,n,c,u,d,w,g,M),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=f.materialIndex,t.push(s))}}else{let x=Math.max(0,m.start),S=Math.min(l.count,m.start+m.count);for(let f=x,p=S;f<p;f+=3){let v=f,E=f+1,b=f+2;s=kr(this,a,e,n,c,u,d,v,E,b),s&&(s.faceIndex=Math.floor(f/3),t.push(s))}}}};function Au(i,e,t,n,s,r,a,o){let l;if(e.side===Ht?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===xi,o),l===null)return null;zr.copy(o),zr.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(zr);return c<t.near||c>t.far?null:{distance:c,point:zr.clone(),object:i}}function kr(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,Ur),i.getVertexPosition(l,Fr),i.getVertexPosition(c,Or);let u=Au(i,e,t,n,Ur,Fr,Or,fc);if(u){let d=new z;ui.getBarycoord(fc,Ur,Fr,Or,d),s&&(u.uv=ui.getInterpolatedAttribute(s,o,l,c,d,new $e)),r&&(u.uv1=ui.getInterpolatedAttribute(r,o,l,c,d,new $e)),a&&(u.normal=ui.getInterpolatedAttribute(a,o,l,c,d,new z),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new z,materialIndex:0};ui.getNormal(Ur,Fr,Or,h.normal),u.face=h,u.barycoord=d}return u}var Ei=class extends sn{constructor(e=null,t=1,n=1,s,r,a,o,l,c=Gt,u=Gt,d,h){super(null,a,o,l,c,u,s,r,d,h),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Vs=class extends Cn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Yi=new yt,pc=new yt,Gr=[],mc=new On,Tu=new yt,Cs=new Tt,Rs=new Kn,is=class extends Tt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Vs(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Tu)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new On),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Yi),mc.copy(e.boundingBox).applyMatrix4(Yi),this.boundingBox.union(mc)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Kn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Yi),Rs.copy(e.boundingSphere).applyMatrix4(Yi),this.boundingSphere.union(Rs)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture!==null?e.morphTexture.clone():null,this.instanceColor=e.instanceColor!==null?e.instanceColor.clone():null,this.count=e.count,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Cs.geometry=this.geometry,Cs.material=this.material,Cs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Rs.copy(this.boundingSphere),Rs.applyMatrix4(n),e.ray.intersectsSphere(Rs)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Yi),pc.multiplyMatrices(n,Yi),Cs.matrixWorld=pc,Cs.raycast(e,Gr);for(let a=0,o=Gr.length;a<o;a++){let l=Gr[a];l.instanceId=r,l.object=this,t.push(l)}Gr.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new Vs(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ei(new Float32Array(s*this.count),s,this.count,fs,Mn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Ti=new Kn,Eu=new $e(.5,.5),Vr=new z,di=class{constructor(e=new En,t=new En,n=new En,s=new En,r=new En,a=new En){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=xn,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],u=r[4],d=r[5],h=r[6],m=r[7],x=r[8],S=r[9],f=r[10],p=r[11],v=r[12],E=r[13],b=r[14],R=r[15];if(s[0].setComponents(c-a,m-u,p-x,R-v).normalize(),s[1].setComponents(c+a,m+u,p+x,R+v).normalize(),s[2].setComponents(c+o,m+d,p+S,R+E).normalize(),s[3].setComponents(c-o,m-d,p-S,R-E).normalize(),n)s[4].setComponents(l,h,f,b).normalize(),s[5].setComponents(c-l,m-h,p-f,R-b).normalize();else if(s[4].setComponents(c-l,m-h,p-f,R-b).normalize(),t===xn)s[5].setComponents(c+l,m+h,p+f,R+b).normalize();else if(t===Qi)s[5].setComponents(l,h,f,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ti.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ti.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ti)}intersectsSprite(e){Ti.center.set(0,0,0);let t=Eu.distanceTo(e.center);return Ti.radius=.7071067811865476+t,Ti.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ti)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(Vr.x=s.normal.x>0?e.max.x:e.min.x,Vr.y=s.normal.y>0?e.max.y:e.min.y,Vr.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Vr)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},gc=new yt,ha=class i{constructor(){this.coordinateSystem=xn,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let s=0;s<t.length;s++){let r=t[s];gc.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new di),n[s].setFromProjectionMatrix(gc,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let s=0;s<e._count;s++)t[s]===void 0&&(t[s]=new di),t[s].copy(n[s]);return this._count=e._count,this}clone(){return new i().copy(this)}};var ss=class extends jn{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new et(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},_c=new yt,Qo=new Gs,Hr=new Kn,Wr=new z,Hs=class extends Vt{constructor(e=new Bt,t=new ss){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Hr.copy(n.boundingSphere),Hr.applyMatrix4(s),Hr.radius+=r,e.ray.intersectsSphere(Hr)===!1)return;_c.copy(s).invert(),Qo.copy(e.ray).applyMatrix4(_c);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){let h=Math.max(0,a.start),m=Math.min(c.count,a.start+a.count);for(let x=h,S=m;x<S;x++){let f=c.getX(x);Wr.fromBufferAttribute(d,f),xc(Wr,f,l,s,e,t,this)}}else{let h=Math.max(0,a.start),m=Math.min(d.count,a.start+a.count);for(let x=h,S=m;x<S;x++)Wr.fromBufferAttribute(d,x),xc(Wr,x,l,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function xc(i,e,t,n,s,r,a){let o=Qo.distanceSqToPoint(i);if(o<t){let l=new z;Qo.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}var Ws=class extends sn{constructor(e=[],t=Pi,n,s,r,a,o,l,c,u){super(e,t,n,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},rs=class extends sn{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Qn=class extends sn{constructor(e,t,n=Rn,s,r,a,o=Gt,l=Gt,c,u=$n,d=1){if(u!==$n&&u!==ti)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:t,depth:d};super(h,s,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new ts(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Xs=class extends Qn{constructor(e,t=Rn,n=Pi,s,r,a=Gt,o=Gt,l,c=$n){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,n,s,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},qs=class extends sn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},fi=class i extends Bt{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],u=[],d=[],h=0,m=0;x("z","y","x",-1,-1,n,t,e,a,r,0),x("z","y","x",1,-1,n,t,-e,a,r,1),x("x","z","y",1,1,e,n,t,s,a,2),x("x","z","y",1,-1,e,n,-t,s,a,3),x("x","y","z",1,-1,e,t,n,s,r,4),x("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new it(c,3)),this.setAttribute("normal",new it(u,3)),this.setAttribute("uv",new it(d,2));function x(S,f,p,v,E,b,R,w,g,M,D){let C=b/g,I=R/M,N=b/2,k=R/2,P=w/2,Y=g+1,$=M+1,J=0,le=0,j=new z;for(let re=0;re<$;re++){let T=re*I-k;for(let X=0;X<Y;X++){let he=X*C-N;j[S]=he*v,j[f]=T*E,j[p]=P,c.push(j.x,j.y,j.z),j[S]=0,j[f]=0,j[p]=w>0?1:-1,u.push(j.x,j.y,j.z),d.push(X/g),d.push(1-re/M),J+=1}}for(let re=0;re<M;re++)for(let T=0;T<g;T++){let X=h+T+Y*re,he=h+T+Y*(re+1),W=h+(T+1)+Y*(re+1),K=h+(T+1)+Y*re;l.push(X,he,K),l.push(he,W,K),le+=6}o.addGroup(m,le,D),m+=le,h+=J}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}},Ys=class i extends Bt{constructor(e=1,t=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:e,height:t,capSegments:n,radialSegments:s,heightSegments:r},t=Math.max(0,t),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let a=[],o=[],l=[],c=[],u=t/2,d=Math.PI/2*e,h=t,m=2*d+h,x=n*2+r,S=s+1,f=new z,p=new z;for(let v=0;v<=x;v++){let E=0,b=0,R=0,w=0;if(v<=n){let D=v/n,C=D*Math.PI/2;b=-u-e*Math.cos(C),R=e*Math.sin(C),w=-e*Math.cos(C),E=D*d}else if(v<=n+r){let D=(v-n)/r;b=-u+D*t,R=e,w=0,E=d+D*h}else{let D=(v-n-r)/n,C=D*Math.PI/2;b=u+e*Math.sin(C),R=e*Math.cos(C),w=e*Math.sin(C),E=d+h+D*d}let g=Math.max(0,Math.min(1,E/m)),M=0;v===0?M=.5/s:v===x&&(M=-.5/s);for(let D=0;D<=s;D++){let C=D/s,I=C*Math.PI*2,N=Math.sin(I),k=Math.cos(I);p.x=-R*k,p.y=b,p.z=R*N,o.push(p.x,p.y,p.z),f.set(-R*k,w,R*N),f.normalize(),l.push(f.x,f.y,f.z),c.push(C+M,g)}if(v>0){let D=(v-1)*S;for(let C=0;C<s;C++){let I=D+C,N=D+C+1,k=v*S+C,P=v*S+C+1;a.push(I,N,k),a.push(N,P,k)}}}this.setIndex(a),this.setAttribute("position",new it(o,3)),this.setAttribute("normal",new it(l,3)),this.setAttribute("uv",new it(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.height,e.capSegments,e.radialSegments,e.heightSegments)}},Zs=class i extends Bt{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],a=[],o=[],l=[],c=new z,u=new $e;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let d=0,h=3;d<=t;d++,h+=3){let m=n+d/t*s;c.x=e*Math.cos(m),c.y=e*Math.sin(m),a.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(a[h]/e+1)/2,u.y=(a[h+1]/e+1)/2,l.push(u.x,u.y)}for(let d=1;d<=t;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("normal",new it(o,3)),this.setAttribute("uv",new it(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}},as=class i extends Bt{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let u=[],d=[],h=[],m=[],x=0,S=[],f=n/2,p=0;v(),a===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new it(d,3)),this.setAttribute("normal",new it(h,3)),this.setAttribute("uv",new it(m,2));function v(){let b=new z,R=new z,w=0,g=(t-e)/n;for(let M=0;M<=r;M++){let D=[],C=M/r,I=C*(t-e)+e;for(let N=0;N<=s;N++){let k=N/s,P=k*l+o,Y=Math.sin(P),$=Math.cos(P);R.x=I*Y,R.y=-C*n+f,R.z=I*$,d.push(R.x,R.y,R.z),b.set(Y,g,$).normalize(),h.push(b.x,b.y,b.z),m.push(k,1-C),D.push(x++)}S.push(D)}for(let M=0;M<s;M++)for(let D=0;D<r;D++){let C=S[D][M],I=S[D+1][M],N=S[D+1][M+1],k=S[D][M+1];(e>0||D!==0)&&(u.push(C,I,k),w+=3),(t>0||D!==r-1)&&(u.push(I,N,k),w+=3)}c.addGroup(p,w,0),p+=w}function E(b){let R=x,w=new $e,g=new z,M=0,D=b===!0?e:t,C=b===!0?1:-1;for(let N=1;N<=s;N++)d.push(0,f*C,0),h.push(0,C,0),m.push(.5,.5),x++;let I=x;for(let N=0;N<=s;N++){let P=N/s*l+o,Y=Math.cos(P),$=Math.sin(P);g.x=D*$,g.y=f*C,g.z=D*Y,d.push(g.x,g.y,g.z),h.push(0,C,0),w.x=Y*.5+.5,w.y=$*.5*C+.5,m.push(w.x,w.y),x++}for(let N=0;N<s;N++){let k=R+N,P=I+N;b===!0?u.push(P,P+1,k):u.push(P+1,P,k),M+=3}c.addGroup(p,M,b===!0?1:2),p+=M}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Js=class i extends as{constructor(e=1,t=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,e,t,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(e){return new i(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},ua=class i extends Bt{constructor(e=[],t=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:s};let r=[],a=[];o(s),c(n),u(),this.setAttribute("position",new it(r,3)),this.setAttribute("normal",new it(r.slice(),3)),this.setAttribute("uv",new it(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(v){let E=new z,b=new z,R=new z;for(let w=0;w<t.length;w+=3)m(t[w+0],E),m(t[w+1],b),m(t[w+2],R),l(E,b,R,v)}function l(v,E,b,R){let w=R+1,g=[];for(let M=0;M<=w;M++){g[M]=[];let D=v.clone().lerp(b,M/w),C=E.clone().lerp(b,M/w),I=w-M;for(let N=0;N<=I;N++)N===0&&M===w?g[M][N]=D:g[M][N]=D.clone().lerp(C,N/I)}for(let M=0;M<w;M++)for(let D=0;D<2*(w-M)-1;D++){let C=Math.floor(D/2);D%2===0?(h(g[M][C+1]),h(g[M+1][C]),h(g[M][C])):(h(g[M][C+1]),h(g[M+1][C+1]),h(g[M+1][C]))}}function c(v){let E=new z;for(let b=0;b<r.length;b+=3)E.x=r[b+0],E.y=r[b+1],E.z=r[b+2],E.normalize().multiplyScalar(v),r[b+0]=E.x,r[b+1]=E.y,r[b+2]=E.z}function u(){let v=new z;for(let E=0;E<r.length;E+=3){v.x=r[E+0],v.y=r[E+1],v.z=r[E+2];let b=f(v)/2/Math.PI+.5,R=p(v)/Math.PI+.5;a.push(b,1-R)}x(),d()}function d(){for(let v=0;v<a.length;v+=6){let E=a[v+0],b=a[v+2],R=a[v+4],w=Math.max(E,b,R),g=Math.min(E,b,R);w>.9&&g<.1&&(E<.2&&(a[v+0]+=1),b<.2&&(a[v+2]+=1),R<.2&&(a[v+4]+=1))}}function h(v){r.push(v.x,v.y,v.z)}function m(v,E){let b=v*3;E.x=e[b+0],E.y=e[b+1],E.z=e[b+2]}function x(){let v=new z,E=new z,b=new z,R=new z,w=new $e,g=new $e,M=new $e;for(let D=0,C=0;D<r.length;D+=9,C+=6){v.set(r[D+0],r[D+1],r[D+2]),E.set(r[D+3],r[D+4],r[D+5]),b.set(r[D+6],r[D+7],r[D+8]),w.set(a[C+0],a[C+1]),g.set(a[C+2],a[C+3]),M.set(a[C+4],a[C+5]),R.copy(v).add(E).add(b).divideScalar(3);let I=f(R);S(w,C+0,v,I),S(g,C+2,E,I),S(M,C+4,b,I)}}function S(v,E,b,R){R<0&&v.x===1&&(a[E]=v.x-1),b.x===0&&b.z===0&&(a[E]=R/2/Math.PI+.5)}function f(v){return Math.atan2(v.z,-v.x)}function p(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.vertices,e.indices,e.radius,e.detail)}};var $s=class i extends ua{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new i(e.radius,e.detail)}},Ks=class i extends Bt{constructor(e=[new $e(0,-.5),new $e(.5,0),new $e(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=mt(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],u=1/t,d=new z,h=new $e,m=new z,x=new z,S=new z,f=0,p=0;for(let v=0;v<=e.length-1;v++)switch(v){case 0:f=e[v+1].x-e[v].x,p=e[v+1].y-e[v].y,m.x=p*1,m.y=-f,m.z=p*0,S.copy(m),m.normalize(),l.push(m.x,m.y,m.z);break;case e.length-1:S.normalize(),l.push(S.x,S.y,S.z);break;default:f=e[v+1].x-e[v].x,p=e[v+1].y-e[v].y,m.x=p*1,m.y=-f,m.z=p*0,x.copy(m),m.x+=S.x,m.y+=S.y,m.z+=S.z,m.normalize(),l.push(m.x,m.y,m.z),S.copy(x)}for(let v=0;v<=t;v++){let E=n+v*u*s,b=Math.sin(E),R=Math.cos(E);for(let w=0;w<=e.length-1;w++){d.x=e[w].x*b,d.y=e[w].y,d.z=e[w].x*R,a.push(d.x,d.y,d.z),h.x=v/t,h.y=w/(e.length-1),o.push(h.x,h.y);let g=l[3*w+0]*b,M=l[3*w+1],D=l[3*w+0]*R;c.push(g,M,D)}}for(let v=0;v<t;v++)for(let E=0;E<e.length-1;E++){let b=E+v*e.length,R=b,w=b+e.length,g=b+e.length+1,M=b+1;r.push(R,w,M),r.push(g,M,w)}this.setIndex(r),this.setAttribute("position",new it(a,3)),this.setAttribute("uv",new it(o,2)),this.setAttribute("normal",new it(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}};var zn=class i extends Bt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,u=l+1,d=e/o,h=t/l,m=[],x=[],S=[],f=[];for(let p=0;p<u;p++){let v=p*h-a;for(let E=0;E<c;E++){let b=E*d-r;x.push(b,-v,0),S.push(0,0,1),f.push(E/o),f.push(1-p/l)}}for(let p=0;p<l;p++)for(let v=0;v<o;v++){let E=v+c*p,b=v+c*(p+1),R=v+1+c*(p+1),w=v+1+c*p;m.push(E,b,w),m.push(b,R,w)}this.setIndex(m),this.setAttribute("position",new it(x,3)),this.setAttribute("normal",new it(S,3)),this.setAttribute("uv",new it(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var pi=class i extends Bt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,u=[],d=new z,h=new z,m=[],x=[],S=[],f=[];for(let p=0;p<=n;p++){let v=[],E=p/n,b=a+E*o,R=e*Math.cos(b),w=Math.sqrt(e*e-R*R),g=0;p===0&&a===0?g=.5/t:p===n&&l===Math.PI&&(g=-.5/t);for(let M=0;M<=t;M++){let D=M/t,C=s+D*r;d.x=-w*Math.cos(C),d.y=R,d.z=w*Math.sin(C),x.push(d.x,d.y,d.z),h.copy(d).normalize(),S.push(h.x,h.y,h.z),f.push(D+g,1-E),v.push(c++)}u.push(v)}for(let p=0;p<n;p++)for(let v=0;v<t;v++){let E=u[p][v+1],b=u[p][v],R=u[p+1][v],w=u[p+1][v+1];(p!==0||a>0)&&m.push(E,b,w),(p!==n-1||l<Math.PI)&&m.push(b,R,w)}this.setIndex(m),this.setAttribute("position",new it(x,3)),this.setAttribute("normal",new it(S,3)),this.setAttribute("uv",new it(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var js=class i extends Bt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],u=[],d=[],h=new z,m=new z,x=new z;for(let S=0;S<=n;S++){let f=a+S/n*o;for(let p=0;p<=s;p++){let v=p/s*r;m.x=(e+t*Math.cos(f))*Math.cos(v),m.y=(e+t*Math.cos(f))*Math.sin(v),m.z=t*Math.sin(f),c.push(m.x,m.y,m.z),h.x=e*Math.cos(v),h.y=e*Math.sin(v),x.subVectors(m,h).normalize(),u.push(x.x,x.y,x.z),d.push(p/s),d.push(S/n)}}for(let S=1;S<=n;S++)for(let f=1;f<=s;f++){let p=(s+1)*S+f-1,v=(s+1)*(S-1)+f-1,E=(s+1)*(S-1)+f,b=(s+1)*S+f;l.push(p,v,b),l.push(v,E,b)}this.setIndex(l),this.setAttribute("position",new it(c,3)),this.setAttribute("normal",new it(u,3)),this.setAttribute("uv",new it(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};function Li(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(vc(s))s.isRenderTargetTexture?(Ge("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(vc(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function Qt(i){let e={};for(let t=0;t<i.length;t++){let n=Li(i[t]);for(let s in n)e[s]=n[s]}return e}function vc(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Cu(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Rl(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:pt.workingColorSpace}var uh={clone:Li,merge:Qt},Ru=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Pu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,rn=class extends jn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ru,this.fragmentShader=Pu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Li(e.uniforms),this.uniformsGroups=Cu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new et().setHex(s.value);break;case"v2":this.uniforms[n].value=new $e().fromArray(s.value);break;case"v3":this.uniforms[n].value=new z().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Rt().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Ze().fromArray(s.value);break;case"m4":this.uniforms[n].value=new yt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},da=class extends rn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Qs=class extends jn{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new et(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new et(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=po,this.normalScale=new $e(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var fa=class extends jn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=$c,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},pa=class extends jn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Zi(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Xr(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var mi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},ma=class extends mi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:$o,endingEnd:$o}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ko:r=e,o=2*t-n;break;case jo:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ko:a=e,l=2*n-t;break;case jo:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=a*u}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,m=this._weightNext,x=(n-t)/(s-t),S=x*x,f=S*x,p=-h*f+2*h*S-h*x,v=(1+h)*f+(-1.5-2*h)*S+(-.5+h)*x+1,E=(-1-m)*f+(1.5+m)*S+.5*x,b=m*f-m*S;for(let R=0;R!==o;++R)r[R]=p*a[u+R]+v*a[c+R]+E*a[l+R]+b*a[d+R];return r}},ga=class extends mi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=(n-t)/(s-t),d=1-u;for(let h=0;h!==o;++h)r[h]=a[c+h]*d+a[l+h]*u;return r}},_a=class extends mi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},xa=class extends mi{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this.inTangents,d=this.outTangents;if(!u||!d){let x=(n-t)/(s-t),S=1-x;for(let f=0;f!==o;++f)r[f]=a[c+f]*S+a[l+f]*x;return r}let h=o*2,m=e-1;for(let x=0;x!==o;++x){let S=a[c+x],f=a[l+x],p=m*h+x*2,v=d[p],E=d[p+1],b=e*h+x*2,R=u[b],w=u[b+1],g=Lu(n,t,v,R,s);r[x]=dh(g,S,E,w,f)}return r}};function dh(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function Iu(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function Lu(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=dh(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=Iu(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var gn=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Zi(t,this.TimeBufferType),this.values=Zi(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Zi(e.times,Array),values:Zi(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),Xr(e.settings)&&(n.settings={inTangents:Zi(e.settings.inTangents,Array),outTangents:Zi(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new _a(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new ga(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new ma(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new xa(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Is:t=this.InterpolantFactoryMethodDiscrete;break;case ra:t=this.InterpolantFactoryMethodLinear;break;case Zr:t=this.InterpolantFactoryMethodSmooth;break;case Jo:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ge("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Is;case this.InterpolantFactoryMethodLinear:return ra;case this.InterpolantFactoryMethodSmooth:return Zr;case this.InterpolantFactoryMethodBezier:return Jo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e;Xr(this.settings)&&(yc(this.settings.inTangents,e),yc(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;Xr(this.settings)&&(Mc(this.settings.inTangents,e),Mc(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Xe("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Xe("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Xe("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Xe("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&ru(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Xe("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Zr,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],u=e[o+1];if(c!==u&&(o!==1||c!==e[0]))if(s)l=!0;else{let d=o*n,h=d-n,m=d+n;for(let x=0;x!==n;++x){let S=t[d+x];if(S!==t[h+x]||S!==t[m+x]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let d=o*n,h=a*n;for(let m=0;m!==n;++m)t[h+m]=t[d+m]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,Xr(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function yc(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]+=e}function Mc(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}gn.prototype.ValueTypeName="";gn.prototype.TimeBufferType=Float32Array;gn.prototype.ValueBufferType=Float32Array;gn.prototype.DefaultInterpolation=ra;var gi=class extends gn{constructor(e,t,n){super(e,t,n)}};gi.prototype.ValueTypeName="bool";gi.prototype.ValueBufferType=Array;gi.prototype.DefaultInterpolation=Is;gi.prototype.InterpolantFactoryMethodLinear=void 0;gi.prototype.InterpolantFactoryMethodSmooth=void 0;var va=class extends gn{constructor(e,t,n,s){super(e,t,n,s)}};va.prototype.ValueTypeName="color";var ya=class extends gn{constructor(e,t,n,s){super(e,t,n,s)}};ya.prototype.ValueTypeName="number";var Ma=class extends mi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let u=c+o;c!==u;c+=4)vn.slerpFlat(r,0,a,c-o,a,c,l);return r}},er=class extends gn{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new Ma(this.times,this.values,this.getValueSize(),e)}};er.prototype.ValueTypeName="quaternion";er.prototype.InterpolantFactoryMethodSmooth=void 0;var _i=class extends gn{constructor(e,t,n){super(e,t,n)}};_i.prototype.ValueTypeName="string";_i.prototype.ValueBufferType=Array;_i.prototype.DefaultInterpolation=Is;_i.prototype.InterpolantFactoryMethodLinear=void 0;_i.prototype.InterpolantFactoryMethodSmooth=void 0;var Sa=class extends gn{constructor(e,t,n,s){super(e,t,n,s)}};Sa.prototype.ValueTypeName="vector";var ba=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){let d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=c.length;d<h;d+=2){let m=c[d],x=c[d+1];if(m.global&&(m.lastIndex=0),m.test(u))return x}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},fh=new ba,wa=class{constructor(e){this.manager=e!==void 0?e:fh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}};wa.DEFAULT_MATERIAL_NAME="__DEFAULT";var os=class extends Vt{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new et(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},tr=class extends os{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Vt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new et(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Zo=new yt,Sc=new z,bc=new z,Aa=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new $e(512,512),this.mapType=ln,this.map=null,this.mapPass=null,this.matrix=new yt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new di,this._frameExtents=new $e(1,1),this._viewportCount=1,this._viewports=[new Rt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Sc.setFromMatrixPosition(e.matrixWorld),t.position.copy(Sc),bc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(bc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){Zo.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Zo,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===Qi||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Zo)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},qr=new z,Yr=new vn,Dn=new z,nr=class extends Vt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new yt,this.projectionMatrix=new yt,this.projectionMatrixInverse=new yt,this.coordinateSystem=xn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(qr,Yr,Dn),Dn.x===1&&Dn.y===1&&Dn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qr,Yr,Dn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(qr,Yr,Dn),Dn.x===1&&Dn.y===1&&Dn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qr,Yr,Dn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},hi=new z,wc=new $e,Ac=new $e,tn=class extends nr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=aa*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Eo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return aa*2*Math.atan(Math.tan(Eo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){hi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(hi.x,hi.y).multiplyScalar(-e/hi.z),hi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(hi.x,hi.y).multiplyScalar(-e/hi.z)}getViewSize(e,t){return this.getViewBounds(e,wc,Ac),t.subVectors(Ac,wc)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Eo*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var ir=class extends nr{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},el=class extends Aa{constructor(){super(new ir(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},sr=class extends os{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Vt.DEFAULT_UP),this.updateMatrix(),this.target=new Vt,this.shadow=new el}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},rr=class extends os{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var Ji=-90,$i=1,ls=class extends Vt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new tn(Ji,$i,e,t);s.layers=this.layers,this.add(s);let r=new tn(Ji,$i,e,t);r.layers=this.layers,this.add(r);let a=new tn(Ji,$i,e,t);a.layers=this.layers,this.add(a);let o=new tn(Ji,$i,e,t);o.layers=this.layers,this.add(o);let l=new tn(Ji,$i,e,t);l.layers=this.layers,this.add(l);let c=new tn(Ji,$i,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===xn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Qi)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,u]=this.children,d=e.getRenderTarget(),h=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),x=e.xr.enabled;e.xr.enabled=!1;let S=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let f=!1;e.isWebGLRenderer===!0?f=e.state.buffers.depth.getReversed():f=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=S,e.setRenderTarget(n,5,s),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(d,h,m),e.xr.enabled=x,n.texture.needsPMREMUpdate=!0}},Ta=class extends tn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}};var Pl="\\[\\]\\.:\\/",Du=new RegExp("["+Pl+"]","g"),Il="[^"+Pl+"]",Nu="[^"+Pl.replace("\\.","")+"]",Uu=/((?:WC+[\/:])*)/.source.replace("WC",Il),Fu=/(WCOD+)?/.source.replace("WCOD",Nu),Ou=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Il),Bu=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Il),zu=new RegExp("^"+Uu+Fu+Ou+Bu+"$"),ku=["material","materials","bones","map"],tl=class{constructor(e,t,n){let s=n||Ct.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ct=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(Du,"")}static parseTrackName(e){let t=zu.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);ku.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ge("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Xe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Xe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Xe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Xe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Xe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Xe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Xe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;Xe("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Xe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Xe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ct.Composite=tl;Ct.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ct.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ct.prototype.GetterByBindingType=[Ct.prototype._getValue_direct,Ct.prototype._getValue_array,Ct.prototype._getValue_arrayElement,Ct.prototype._getValue_toArray];Ct.prototype.SetterByBindingTypeAndVersioning=[[Ct.prototype._setValue_direct,Ct.prototype._setValue_direct_setNeedsUpdate,Ct.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ct.prototype._setValue_array,Ct.prototype._setValue_array_setNeedsUpdate,Ct.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ct.prototype._setValue_arrayElement,Ct.prototype._setValue_arrayElement_setNeedsUpdate,Ct.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ct.prototype._setValue_fromArray,Ct.prototype._setValue_fromArray_setNeedsUpdate,Ct.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var H0=new Float32Array(1);var Ol=class Ol{constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};Ol.prototype.isMatrix2=!0;var nl=Ol;function Ll(i,e,t,n){let s=Gu(n);switch(t){case Ml:return i*e;case fs:return i*e/s.components*s.byteLength;case Na:return i*e/s.components*s.byteLength;case vi:return i*e*2/s.components*s.byteLength;case Ua:return i*e*2/s.components*s.byteLength;case Sl:return i*e*3/s.components*s.byteLength;case In:return i*e*4/s.components*s.byteLength;case Fa:return i*e*4/s.components*s.byteLength;case cr:case hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ur:case dr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ba:case ka:return Math.max(i,16)*Math.max(e,8)/4;case Oa:case za:return Math.max(i,8)*Math.max(e,8)/2;case Ga:case Va:case Wa:case Xa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ha:case fr:case qa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ya:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Za:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Ja:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case $a:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ka:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case ja:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Qa:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case eo:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case to:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case no:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case io:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case so:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ro:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case ao:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case oo:case lo:case co:return Math.ceil(i/4)*Math.ceil(e/4)*16;case ho:case uo:return Math.ceil(i/4)*Math.ceil(e/4)*8;case pr:case fo:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Gu(i){switch(i){case ln:case _l:return{byteLength:1,components:1};case ds:case xl:case Pn:return{byteLength:2,components:1};case La:case Da:return{byteLength:2,components:4};case Rn:case Ia:case Mn:return{byteLength:4,components:1};case vl:case yl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window!="undefined"&&(window.__THREE__?Ge("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function Uh(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Hu(i){let e=new WeakMap;function t(o,l){let c=o.array,u=o.usage,d=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array!="undefined"&&c instanceof Float16Array)m=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){let u=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,u);else{d.sort((m,x)=>m.start-x.start);let h=0;for(let m=1;m<d.length;m++){let x=d[h],S=d[m];S.start<=x.start+x.count+1?x.count=Math.max(x.count,S.start+S.count-x.start):(++h,d[h]=S)}d.length=h+1;for(let m=0,x=d.length;m<x;m++){let S=d[m];i.bufferSubData(c,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Wu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Xu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,qu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Yu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ju=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,$u=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ku=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ju=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Qu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ed=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,td=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,nd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,id=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,sd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,rd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ad=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,od=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ld=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,cd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,hd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,ud=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,dd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,fd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,pd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,md=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,gd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_d=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,xd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,vd="gl_FragColor = linearToOutputTexel( gl_FragColor );",yd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Md=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Sd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,bd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,wd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Ad=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Td=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ed=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Cd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Rd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Pd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Id=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Ld=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Dd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Nd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Ud=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Fd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Od=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Bd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,zd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,kd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Gd=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Vd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Hd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Wd=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Xd=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,qd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Yd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Jd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,$d=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Kd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Qd=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ef=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,tf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,nf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,sf=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,rf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,af=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,of=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,cf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,hf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,uf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,df=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,ff=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,pf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,mf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_f=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,xf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,vf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,yf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Mf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Sf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,bf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,wf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Af=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Tf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Ef=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Cf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Rf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Pf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,If=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Lf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Df=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Nf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Uf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Ff=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Of=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,zf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,kf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Vf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Hf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Wf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Xf=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Yf=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Jf=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$f=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Kf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,jf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Qf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,ep=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,tp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,np=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ip=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,rp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ap=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,op=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,cp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,up=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,dp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,mp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_p=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xp=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,vp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,yp=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Mp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,bp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ot={alphahash_fragment:Wu,alphahash_pars_fragment:Xu,alphamap_fragment:qu,alphamap_pars_fragment:Yu,alphatest_fragment:Zu,alphatest_pars_fragment:Ju,aomap_fragment:$u,aomap_pars_fragment:Ku,batching_pars_vertex:ju,batching_vertex:Qu,begin_vertex:ed,beginnormal_vertex:td,bsdfs:nd,iridescence_fragment:id,bumpmap_pars_fragment:sd,clipping_planes_fragment:rd,clipping_planes_pars_fragment:ad,clipping_planes_pars_vertex:od,clipping_planes_vertex:ld,color_fragment:cd,color_pars_fragment:hd,color_pars_vertex:ud,color_vertex:dd,common:fd,defaultnormal_vertex:pd,displacementmap_pars_vertex:md,displacementmap_vertex:gd,emissivemap_fragment:_d,emissivemap_pars_fragment:xd,colorspace_fragment:vd,colorspace_pars_fragment:yd,envmap_fragment:Md,envmap_common_pars_fragment:Sd,envmap_pars_fragment:bd,envmap_pars_vertex:wd,envmap_physical_pars_fragment:Ud,envmap_vertex:Ad,fog_vertex:Td,fog_pars_vertex:Ed,fog_fragment:Cd,fog_pars_fragment:Rd,gradientmap_pars_fragment:Pd,lightmap_pars_fragment:Id,lights_lambert_fragment:Ld,lights_lambert_pars_fragment:Dd,lights_pars_begin:Nd,lights_toon_fragment:Fd,lights_toon_pars_fragment:Od,lights_phong_fragment:Bd,lights_phong_pars_fragment:zd,lights_physical_fragment:kd,lights_physical_pars_fragment:Gd,lights_fragment_begin:Vd,lights_fragment_maps:Hd,lights_fragment_end:Wd,lightprobes_pars_fragment:Xd,logdepthbuf_fragment:qd,logdepthbuf_pars_fragment:Yd,logdepthbuf_pars_vertex:Zd,logdepthbuf_vertex:Jd,map_fragment:$d,map_pars_fragment:Kd,map_particle_fragment:jd,map_particle_pars_fragment:Qd,metalnessmap_fragment:ef,metalnessmap_pars_fragment:tf,morphinstance_vertex:nf,morphcolor_vertex:sf,morphnormal_vertex:rf,morphtarget_pars_vertex:af,morphtarget_vertex:of,normal_fragment_begin:lf,normal_fragment_maps:cf,normal_pars_fragment:hf,normal_pars_vertex:uf,normal_vertex:df,normalmap_pars_fragment:ff,clearcoat_normal_fragment_begin:pf,clearcoat_normal_fragment_maps:mf,clearcoat_pars_fragment:gf,iridescence_pars_fragment:_f,opaque_fragment:xf,packing:vf,premultiplied_alpha_fragment:yf,project_vertex:Mf,dithering_fragment:Sf,dithering_pars_fragment:bf,roughnessmap_fragment:wf,roughnessmap_pars_fragment:Af,shadowmap_pars_fragment:Tf,shadowmap_pars_vertex:Ef,shadowmap_vertex:Cf,shadowmask_pars_fragment:Rf,skinbase_vertex:Pf,skinning_pars_vertex:If,skinning_vertex:Lf,skinnormal_vertex:Df,specularmap_fragment:Nf,specularmap_pars_fragment:Uf,tonemapping_fragment:Ff,tonemapping_pars_fragment:Of,transmission_fragment:Bf,transmission_pars_fragment:zf,uv_pars_fragment:kf,uv_pars_vertex:Gf,uv_vertex:Vf,worldpos_vertex:Hf,background_vert:Wf,background_frag:Xf,backgroundCube_vert:qf,backgroundCube_frag:Yf,cube_vert:Zf,cube_frag:Jf,depth_vert:$f,depth_frag:Kf,distance_vert:jf,distance_frag:Qf,equirect_vert:ep,equirect_frag:tp,linedashed_vert:np,linedashed_frag:ip,meshbasic_vert:sp,meshbasic_frag:rp,meshlambert_vert:ap,meshlambert_frag:op,meshmatcap_vert:lp,meshmatcap_frag:cp,meshnormal_vert:hp,meshnormal_frag:up,meshphong_vert:dp,meshphong_frag:fp,meshphysical_vert:pp,meshphysical_frag:mp,meshtoon_vert:gp,meshtoon_frag:_p,points_vert:xp,points_frag:vp,shadow_vert:yp,shadow_frag:Mp,sprite_vert:Sp,sprite_frag:bp},Ae={common:{diffuse:{value:new et(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ze},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ze}},envmap:{envMap:{value:null},envMapRotation:{value:new Ze},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ze},normalScale:{value:new $e(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new et(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new et(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0},uvTransform:{value:new Ze}},sprite:{diffuse:{value:new et(16777215)},opacity:{value:1},center:{value:new $e(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ze},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0}}},Vn={basic:{uniforms:Qt([Ae.common,Ae.specularmap,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.fog]),vertexShader:ot.meshbasic_vert,fragmentShader:ot.meshbasic_frag},lambert:{uniforms:Qt([Ae.common,Ae.specularmap,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.fog,Ae.lights,{emissive:{value:new et(0)},envMapIntensity:{value:1}}]),vertexShader:ot.meshlambert_vert,fragmentShader:ot.meshlambert_frag},phong:{uniforms:Qt([Ae.common,Ae.specularmap,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.fog,Ae.lights,{emissive:{value:new et(0)},specular:{value:new et(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ot.meshphong_vert,fragmentShader:ot.meshphong_frag},standard:{uniforms:Qt([Ae.common,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.roughnessmap,Ae.metalnessmap,Ae.fog,Ae.lights,{emissive:{value:new et(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ot.meshphysical_vert,fragmentShader:ot.meshphysical_frag},toon:{uniforms:Qt([Ae.common,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.gradientmap,Ae.fog,Ae.lights,{emissive:{value:new et(0)}}]),vertexShader:ot.meshtoon_vert,fragmentShader:ot.meshtoon_frag},matcap:{uniforms:Qt([Ae.common,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.fog,{matcap:{value:null}}]),vertexShader:ot.meshmatcap_vert,fragmentShader:ot.meshmatcap_frag},points:{uniforms:Qt([Ae.points,Ae.fog]),vertexShader:ot.points_vert,fragmentShader:ot.points_frag},dashed:{uniforms:Qt([Ae.common,Ae.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ot.linedashed_vert,fragmentShader:ot.linedashed_frag},depth:{uniforms:Qt([Ae.common,Ae.displacementmap]),vertexShader:ot.depth_vert,fragmentShader:ot.depth_frag},normal:{uniforms:Qt([Ae.common,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,{opacity:{value:1}}]),vertexShader:ot.meshnormal_vert,fragmentShader:ot.meshnormal_frag},sprite:{uniforms:Qt([Ae.sprite,Ae.fog]),vertexShader:ot.sprite_vert,fragmentShader:ot.sprite_frag},background:{uniforms:{uvTransform:{value:new Ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ot.background_vert,fragmentShader:ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ze}},vertexShader:ot.backgroundCube_vert,fragmentShader:ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ot.cube_vert,fragmentShader:ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ot.equirect_vert,fragmentShader:ot.equirect_frag},distance:{uniforms:Qt([Ae.common,Ae.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:ot.distance_vert,fragmentShader:ot.distance_frag},shadow:{uniforms:Qt([Ae.lights,Ae.fog,{color:{value:new et(0)},opacity:{value:1}}]),vertexShader:ot.shadow_vert,fragmentShader:ot.shadow_frag}};Vn.physical={uniforms:Qt([Vn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ze},clearcoatNormalScale:{value:new $e(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ze},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Ze},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ze},sheen:{value:0},sheenColor:{value:new et(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ze},transmissionSamplerSize:{value:new $e},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ze},attenuationDistance:{value:0},attenuationColor:{value:new et(0)},specularColor:{value:new et(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ze},anisotropyVector:{value:new $e},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ze}}]),vertexShader:ot.meshphysical_vert,fragmentShader:ot.meshphysical_frag};var mo={r:0,b:0,g:0},wp=new yt,Fh=new Ze;Fh.set(-1,0,0,0,1,0,0,0,1);function Ap(i,e,t,n,s,r){let a=new et(0),o=s===!0?0:1,l,c,u=null,d=0,h=null;function m(v){let E=v.isScene===!0?v.background:null;if(E&&E.isTexture){let b=v.backgroundBlurriness>0;E=e.get(E,b)}return E}function x(v){let E=!1,b=m(v);b===null?f(a,o):b&&b.isColor&&(f(b,1),E=!0);let R=i.xr.getEnvironmentBlendMode();R==="additive"?t.buffers.color.setClear(0,0,0,1,r):R==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||E)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(v,E){let b=m(E);b&&b.isCubeTexture?(c===void 0&&(c=new Tt(new fi(1,1,1),new rn({name:"BackgroundCubeMaterial",uniforms:Li(Vn.backgroundCube.uniforms),vertexShader:Vn.backgroundCube.vertexShader,fragmentShader:Vn.backgroundCube.fragmentShader,side:Ht,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(R,w,g){this.matrixWorld.copyPosition(g.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=b,c.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(wp.makeRotationFromEuler(E.backgroundRotation)).transpose(),b.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Fh),c.material.toneMapped=pt.getTransfer(b.colorSpace)!==vt,(u!==b||d!==b.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=b,d=b.version,h=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):b&&b.isTexture&&(l===void 0&&(l=new Tt(new zn(2,2),new rn({name:"BackgroundMaterial",uniforms:Li(Vn.background.uniforms),vertexShader:Vn.background.vertexShader,fragmentShader:Vn.background.fragmentShader,side:xi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=b,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=pt.getTransfer(b.colorSpace)!==vt,b.matrixAutoUpdate===!0&&b.updateMatrix(),l.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||d!==b.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=b,d=b.version,h=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function f(v,E){v.getRGB(mo,Rl(i)),t.buffers.color.setClear(mo.r,mo.g,mo.b,E,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,E=1){a.set(v),o=E,f(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,f(a,o)},render:x,addToRenderList:S,dispose:p}}function Tp(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null),r=s,a=!1;function o(I,N,k,P,Y){let $=!1,J=d(I,P,k,N);r!==J&&(r=J,c(r.object)),$=m(I,P,k,Y),$&&x(I,P,k,Y),Y!==null&&e.update(Y,i.ELEMENT_ARRAY_BUFFER),($||a)&&(a=!1,b(I,N,k,P),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Y).buffer))}function l(){return i.createVertexArray()}function c(I){return i.bindVertexArray(I)}function u(I){return i.deleteVertexArray(I)}function d(I,N,k,P){let Y=P.wireframe===!0,$=n[N.id];$===void 0&&($={},n[N.id]=$);let J=I.isInstancedMesh===!0?I.id:0,le=$[J];le===void 0&&(le={},$[J]=le);let j=le[k.id];j===void 0&&(j={},le[k.id]=j);let re=j[Y];return re===void 0&&(re=h(l()),j[Y]=re),re}function h(I){let N=[],k=[],P=[];for(let Y=0;Y<t;Y++)N[Y]=0,k[Y]=0,P[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:k,attributeDivisors:P,object:I,attributes:{},index:null}}function m(I,N,k,P){let Y=r.attributes,$=N.attributes,J=0,le=k.getAttributes();for(let j in le)if(le[j].location>=0){let T=Y[j],X=$[j];if(X===void 0&&(j==="instanceMatrix"&&I.instanceMatrix&&(X=I.instanceMatrix),j==="instanceColor"&&I.instanceColor&&(X=I.instanceColor)),T===void 0||T.attribute!==X||X&&T.data!==X.data)return!0;J++}return r.attributesNum!==J||r.index!==P}function x(I,N,k,P){let Y={},$=N.attributes,J=0,le=k.getAttributes();for(let j in le)if(le[j].location>=0){let T=$[j];T===void 0&&(j==="instanceMatrix"&&I.instanceMatrix&&(T=I.instanceMatrix),j==="instanceColor"&&I.instanceColor&&(T=I.instanceColor));let X={};X.attribute=T,T&&T.data&&(X.data=T.data),Y[j]=X,J++}r.attributes=Y,r.attributesNum=J,r.index=P}function S(){let I=r.newAttributes;for(let N=0,k=I.length;N<k;N++)I[N]=0}function f(I){p(I,0)}function p(I,N){let k=r.newAttributes,P=r.enabledAttributes,Y=r.attributeDivisors;k[I]=1,P[I]===0&&(i.enableVertexAttribArray(I),P[I]=1),Y[I]!==N&&(i.vertexAttribDivisor(I,N),Y[I]=N)}function v(){let I=r.newAttributes,N=r.enabledAttributes;for(let k=0,P=N.length;k<P;k++)N[k]!==I[k]&&(i.disableVertexAttribArray(k),N[k]=0)}function E(I,N,k,P,Y,$,J){J===!0?i.vertexAttribIPointer(I,N,k,Y,$):i.vertexAttribPointer(I,N,k,P,Y,$)}function b(I,N,k,P){S();let Y=P.attributes,$=k.getAttributes(),J=N.defaultAttributeValues;for(let le in $){let j=$[le];if(j.location>=0){let re=Y[le];if(re===void 0&&(le==="instanceMatrix"&&I.instanceMatrix&&(re=I.instanceMatrix),le==="instanceColor"&&I.instanceColor&&(re=I.instanceColor)),re!==void 0){let T=re.normalized,X=re.itemSize,he=e.get(re);if(he===void 0)continue;let W=he.buffer,K=he.type,me=he.bytesPerElement,Me=K===i.INT||K===i.UNSIGNED_INT||re.gpuType===Ia;if(re.isInterleavedBufferAttribute){let ee=re.data,te=ee.isInterleavedBuffer===!0?ee.stride:ee.itemSize,Ke=re.offset;if(ee.isInstancedInterleavedBuffer||ee.isInstancedBufferAttribute){for(let Te=0;Te<j.locationSize;Te++)p(j.location+Te,ee.meshPerAttribute);I.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let Te=0;Te<j.locationSize;Te++)f(j.location+Te);i.bindBuffer(i.ARRAY_BUFFER,W);for(let Te=0;Te<j.locationSize;Te++)E(j.location+Te,X/j.locationSize,K,T,te*me,(Ke+X/j.locationSize*Te)*me,Me)}else{if(re.isInstancedBufferAttribute){for(let ee=0;ee<j.locationSize;ee++)p(j.location+ee,re.meshPerAttribute);I.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let ee=0;ee<j.locationSize;ee++)f(j.location+ee);i.bindBuffer(i.ARRAY_BUFFER,W);for(let ee=0;ee<j.locationSize;ee++)E(j.location+ee,X/j.locationSize,K,T,X*me,X/j.locationSize*ee*me,Me)}}else if(J!==void 0){let T=J[le];if(T!==void 0)switch(T.length){case 2:i.vertexAttrib2fv(j.location,T);break;case 3:i.vertexAttrib3fv(j.location,T);break;case 4:i.vertexAttrib4fv(j.location,T);break;default:i.vertexAttrib1fv(j.location,T)}}}}v()}function R(){D();for(let I in n){let N=n[I];for(let k in N){let P=N[k];for(let Y in P){let $=P[Y];for(let J in $)u($[J].object),delete $[J];delete P[Y]}}delete n[I]}}function w(I){if(n[I.id]===void 0)return;let N=n[I.id];for(let k in N){let P=N[k];for(let Y in P){let $=P[Y];for(let J in $)u($[J].object),delete $[J];delete P[Y]}}delete n[I.id]}function g(I){for(let N in n){let k=n[N];for(let P in k){let Y=k[P];if(Y[I.id]===void 0)continue;let $=Y[I.id];for(let J in $)u($[J].object),delete $[J];delete Y[I.id]}}}function M(I){for(let N in n){let k=n[N],P=I.isInstancedMesh===!0?I.id:0,Y=k[P];if(Y!==void 0){for(let $ in Y){let J=Y[$];for(let le in J)u(J[le].object),delete J[le];delete Y[$]}delete k[P],Object.keys(k).length===0&&delete n[N]}}}function D(){C(),a=!0,r!==s&&(r=s,c(r.object))}function C(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:D,resetDefaultState:C,dispose:R,releaseStatesOfGeometry:w,releaseStatesOfObject:M,releaseStatesOfProgram:g,initAttributes:S,enableAttribute:f,disableUnusedAttributes:v}}function Ep(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,u){u!==0&&(i.drawArraysInstanced(n,l,c,u),t.update(c,n,u))}function o(l,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,u);let h=0;for(let m=0;m<u;m++)h+=c[m];t.update(h,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Cp(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let g=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(g.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(g){return!(g!==In&&n.convert(g)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(g){let M=g===Pn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(g!==ln&&g!==Mn&&!M&&n.convert(g)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(g){if(g==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";g="mediump"}return g==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",u=l(c);u!==c&&(Ge("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),h=t.logarithmicDepthBuffer===!0&&d===!1;t.reversedDepthBuffer===!0&&d===!1&&Ge("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&d===!0&&Ge("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),f=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:m,maxVertexTextures:x,maxTextureSize:S,maxCubemapSize:f,maxAttributes:p,maxVertexUniforms:v,maxVaryings:E,maxFragmentUniforms:b,maxSamples:R,samples:w}}function Rp(i){let e=this,t=null,n=0,s=!1,r=!1,a=new En,o=new Ze,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let m=d.length!==0||h||n!==0||s;return s=h,n=d.length,m},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){t=u(d,h,0)},this.setState=function(d,h,m){let x=d.clippingPlanes,S=d.clipIntersection,f=d.clipShadows,p=i.get(d);if(!s||x===null||x.length===0||r&&!f)r?u(null):c();else{let v=r?0:n,E=v*4,b=p.clippingState||null;l.value=b,b=u(x,h,E,m);for(let R=0;R!==E;++R)b[R]=t[R];p.clippingState=b,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(d,h,m,x){let S=d!==null?d.length:0,f=null;if(S!==0){if(f=l.value,x!==!0||f===null){let p=m+S*4,v=h.matrixWorldInverse;o.getNormalMatrix(v),(f===null||f.length<p)&&(f=new Float32Array(p));for(let E=0,b=m;E!==S;++E,b+=4)a.copy(d[E]).applyMatrix4(v,o),a.normal.toArray(f,b),f[b+3]=a.constant}l.value=f,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,f}}var vr=class extends mn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Ws(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new fi(5,5,5),r=new rn({name:"CubemapFromEquirect",uniforms:Li(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ht,blending:Ci});r.uniforms.tEquirect.value=t;let a=new Tt(s,r),o=t.minFilter;return t.minFilter===ei&&(t.minFilter=nn),new ls(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},ph=256,Pp=3,Ip=20,Oh=256,Bh=16,Lp=3,Dp=new z,Np=new et,_o=class i{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new ls(1,10,null),this._boxMesh=new Tt(new fi(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=Dp}=r,l=this._renderer;this._setSize(a);let c=this._allocateTarget(),u=this._getSourceTarget(!0);t>0&&(u.texture.mipmapsAutoUpdate=!1);let d=l.autoClear,h=l.autoClearColor,m=l.autoClearDepth,x=l.autoClearStencil,S=e.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,S===null&&(e.background=l.getClearColor(Np));let f=new ls(n,s,u);return f.position.copy(o),f.update(l,e),l.autoClear=d,l.autoClearColor=h,l.autoClearDepth=m,l.autoClearStencil=x,e.background=S,t>0&&(u.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=_h(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=gh(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(ph,ch(e))}_fromTexture(e,t){e.mapping===Pi||e.mapping===us?this._setSize(e.image.length===0?ph:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=mh(e,!1,!1),n=Math.log2(e)-Pp;for(let s=0;s<=n;s++)t.texture.mipmaps.push({width:e>>s,height:e>>s});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=mh(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=e,r.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),r.update(this._renderer,s),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===Pi||e.mapping===us?(this._cubemapMaterial===null&&(this._cubemapMaterial=_h()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=gh()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=Up(),this._integrationMaterial=Fp());let t=this._cubeSize,n=e.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(t/Bh);for(let a=0;a<=n;a++){let o=i.lodToRoughness(a,n);if(a>n-Lp)r.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{let l=o>0?Math.log2(t)+.5*Math.log2(6/(Oh*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Op());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(e,0,n),s.envMap.value=e.texture,this._renderCube(r,0,n)}};function mh(i,e,t){return new vr(i,{minFilter:ei,generateMipmaps:e,type:Pn,colorSpace:Ls,depthBuffer:t})}function yr(i,e,t){return new rn({name:i,uniforms:e,vertexShader:ot.cube_vert,fragmentShader:t,side:Ht,blending:Ci,depthTest:!1,depthWrite:!1})}function Up(){return yr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Oh}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Fp(){return yr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Bh}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Op(){return yr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Ip}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function gh(){return yr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function _h(){return yr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function Bp(i){let e=new WeakMap,t=new WeakMap,n=null;function s(h,m=!1){return h==null?null:m?a(h):r(h)}function r(h){if(h&&h.isTexture){let m=h.mapping;if(m===Ca||m===Ra)if(e.has(h)){let x=e.get(h).texture;return o(x,h.mapping)}else{let x=h.image;if(x&&x.height>0){let S=new vr(x.height);return S.fromEquirectangularTexture(i,h),e.set(h,S),h.addEventListener("dispose",c),o(S.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture&&h.isPMREMTexture!==!0){let m=h.mapping,x=m===Ca||m===Ra,S=m===Pi||m===us;if(x||S){let f=t.get(h),p=f!==void 0?f.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return n===null&&(n=new _o(i)),f=x?n.fromEquirectangular(h,f):n.fromCubemap(h,f),f.texture.pmremVersion=h.pmremVersion,t.set(h,f),f.texture;if(f!==void 0)return f.texture;{let v=h.image;return x&&v&&v.height>0||S&&v&&l(v)?(n===null&&(n=new _o(i)),f=x?n.fromEquirectangular(h):n.fromCubemap(h),f.texture.pmremVersion=h.pmremVersion,t.set(h,f),h.addEventListener("dispose",u),f.texture):null}}}return h}function o(h,m){return m===Ca?h.mapping=Pi:m===Ra&&(h.mapping=us),h}function l(h){let m=0,x=6;for(let S=0;S<x;S++)h[S]!==void 0&&m++;return m===x}function c(h){let m=h.target;m.removeEventListener("dispose",c);let x=e.get(m);x!==void 0&&(e.delete(m),x.dispose())}function u(h){let m=h.target;m.removeEventListener("dispose",u);let x=t.get(m);x!==void 0&&(t.delete(m),x.dispose())}function d(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function zp(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Ps("WebGLRenderer: "+n+" extension not supported."),s}}}function kp(i,e,t,n){let s={},r=new WeakMap,a=new FinalizationRegistry(x=>delete s[x]);function o(x){l(x.target)}function l(x){x.index!==null&&e.remove(x.index);for(let f in x.attributes)e.remove(x.attributes[f]);x.removeEventListener("dispose",o),delete s[x.id],a.unregister(x);let S=r.get(x);S&&(e.remove(S),r.delete(x)),n.releaseStatesOfGeometry(x),x.isInstancedBufferGeometry===!0&&delete x._maxInstanceCount,t.memory.geometries--}function c(x,S){return s[S.id]!==void 0||(S.addEventListener("dispose",o),s[S.id]=new WeakRef(S),a.register(S,S.id,S),t.memory.geometries++),S}function u(x){let S=x.attributes;for(let f in S)e.update(S[f],i.ARRAY_BUFFER)}function d(x){let S=x.index,f=x.attributes.position,p=0;if(f===void 0)return;let v=S!==null?S.array.length:f.array.length/3-1,E=f.count>=65535?ks:zs,b=new E(Math.ceil(v/3)*6,1),R=b.array;if(S!==null){let g=S.array;p=S.version;for(let M=0,D=0;M<v;M+=3){let C=g[M+0],I=g[M+1],N=g[M+2];R[D++]=C,R[D++]=I,R[D++]=I,R[D++]=N,R[D++]=N,R[D++]=C}}else{p=f.version;for(let g=0,M=0;g<v;g+=3){let D=g+0,C=g+1,I=g+2;R[M++]=D,R[M++]=C,R[M++]=C,R[M++]=I,R[M++]=I,R[M++]=D}}b.version=p;let w=r.get(x);w&&e.remove(w),r.set(x,b)}function h(x){let S=r.get(x);if(S){let f=x.index;f!==null&&S.version<f.version&&d(x)}else d(x);return r.get(x)}function m(){for(let x in s){let S=s[x].deref();S!==void 0&&l(S)}}return{get:c,update:u,getWireframeAttribute:h,dispose:m}}function Gp(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,h){i.drawElements(n,h,r,d*a),t.update(h,n,1)}function c(d,h,m){m!==0&&(i.drawElementsInstanced(n,h,r,d*a,m),t.update(h,n,m))}function u(d,h,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,r,d,0,m);let S=0;for(let f=0;f<m;f++)S+=h[f];t.update(S,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function Vp(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Xe("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Hp(i,e,t){let n=new WeakMap,s=new Rt;function r(a,o,l){let c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0,h=n.get(o);if(h===void 0||h.count!==d){let D=function(){g.dispose(),n.delete(o),o.removeEventListener("dispose",D)};h!==void 0&&h.texture.dispose();let m=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],E=0;m===!0&&(E=1),x===!0&&(E=2),S===!0&&(E=3);let b=o.attributes.position.count*E,R=1;b>e.maxTextureSize&&(R=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);let w=new Float32Array(b*R*4*d),g=new Us(w,b,R,d);g.type=Mn,g.needsUpdate=!0;let M=E*4;for(let C=0;C<d;C++){let I=f[C],N=p[C],k=v[C],P=b*R*4*C;for(let Y=0;Y<I.count;Y++){let $=Y*M;m===!0&&(s.fromBufferAttribute(I,Y),w[P+$+0]=s.x,w[P+$+1]=s.y,w[P+$+2]=s.z,w[P+$+3]=0),x===!0&&(s.fromBufferAttribute(N,Y),w[P+$+4]=s.x,w[P+$+5]=s.y,w[P+$+6]=s.z,w[P+$+7]=0),S===!0&&(s.fromBufferAttribute(k,Y),w[P+$+8]=s.x,w[P+$+9]=s.y,w[P+$+10]=s.z,w[P+$+11]=k.itemSize===4?s.w:1)}}h={count:d,texture:g,size:new $e(b,R)},n.set(o,h),o.addEventListener("dispose",D)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let S=0;S<c.length;S++)m+=c[S];let x=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function Wp(i,e,t,n,s){let r=new WeakMap;function a(c){let u=s.render.frame,d=c.geometry,h=e.get(c,d);if(r.get(h)!==u&&(e.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){let m=c.skeleton;r.get(m)!==u&&(m.update(),r.set(m,u))}return h}function o(){r=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}var Xp={[cl]:"LINEAR_TONE_MAPPING",[hl]:"REINHARD_TONE_MAPPING",[ul]:"CINEON_TONE_MAPPING",[dl]:"ACES_FILMIC_TONE_MAPPING",[pl]:"AGX_TONE_MAPPING",[ml]:"NEUTRAL_TONE_MAPPING",[fl]:"CUSTOM_TONE_MAPPING"};function qp(i,e,t,n,s,r){let a=new mn(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=null,u=new Bt;u.setAttribute("position",new it([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute("uv",new it([0,2,0,0,2,0],2));let d=new da({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new Tt(u,d),m=new ir(-1,1,1,-1,0,1),x=null,S=null,f=!1,p,v=null,E=[],b=!1;this.setSize=function(R,w){a.setSize(R,w),o!==null&&o.setSize(R,w),l!==null&&l.setSize(R,w);for(let g=0;g<E.length;g++){let M=E[g];M.setSize&&M.setSize(R,w)}},this.setEffects=function(R){E=R,b=E.length>0&&E[0].isRenderPass===!0;let w=a.width,g=a.height;E.length>0&&o===null&&(o=new mn(w,g,{type:Pn,depthBuffer:!1,stencilBuffer:!1}),l=new mn(w,g,{type:Pn,depthBuffer:!1,stencilBuffer:!1}));let M=s===!0&&E.some(D=>D.needsDepthTexture===!0);M!==(a.depthTexture!==null)&&(M===!0&&c===null&&(c=new Qn(w,g),r===!0&&(c.format=ti,c.type=Ii)),a.dispose(),a.depthTexture=M?c:null,a.resolveDepthBuffer=M,a.storeMultisampledDepthBuffer=M);for(let D=0;D<E.length;D++){let C=E[D];C.setSize&&C.setSize(w,g),M&&C.needsDepthTexture===!0&&C.setDepthTexture&&C.setDepthTexture(c)}},this.begin=function(R,w){if(f||R.toneMapping===kn&&E.length===0)return!1;if(v=w,w!==null){let g=w.width,M=w.height;(a.width!==g||a.height!==M)&&this.setSize(g,M)}return b===!1&&R.setRenderTarget(a),p=R.toneMapping,R.toneMapping=kn,!0},this.hasRenderPass=function(){return b},this.end=function(R,w){R.toneMapping=p,f=!0;let g=a,M=o;for(let D=0;D<E.length;D++){let C=E[D];C.enabled!==!1&&(C.render(R,M,g,w),C.needsSwap!==!1&&(g=M,M=M===o?l:o))}if(x!==R.outputColorSpace||S!==R.toneMapping){x=R.outputColorSpace,S=R.toneMapping,d.defines={},pt.getTransfer(x)===vt&&(d.defines.SRGB_TRANSFER="");let D=Xp[S];D&&(d.defines[D]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=g.texture,R.setRenderTarget(v),R.render(h,m),v=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),u.dispose(),d.dispose()}}var zh=new sn,kh=new Qn(1,1),Gh=new Xs(1),Vh=new Us,Hh=new ca,Wh=new Ws,xh=[],vh=[],yh=new Float32Array(16),Mh=new Float32Array(9),Sh=new Float32Array(4);function ms(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=xh[s];if(r===void 0&&(r=new Float32Array(s),xh[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Wt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Xt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function vo(i,e){let t=vh[e];t===void 0&&(t=new Int32Array(e),vh[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Yp(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Zp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Wt(t,e))return;i.uniform2fv(this.addr,e),Xt(t,e)}}function Jp(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Wt(t,e))return;i.uniform3fv(this.addr,e),Xt(t,e)}}function $p(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Wt(t,e))return;i.uniform4fv(this.addr,e),Xt(t,e)}}function Kp(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Wt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Xt(t,e)}else{if(Wt(t,n))return;Sh.set(n),i.uniformMatrix2fv(this.addr,!1,Sh),Xt(t,n)}}function jp(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Wt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Xt(t,e)}else{if(Wt(t,n))return;Mh.set(n),i.uniformMatrix3fv(this.addr,!1,Mh),Xt(t,n)}}function Qp(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Wt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Xt(t,e)}else{if(Wt(t,n))return;yh.set(n),i.uniformMatrix4fv(this.addr,!1,yh),Xt(t,n)}}function em(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function tm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Wt(t,e))return;i.uniform2iv(this.addr,e),Xt(t,e)}}function nm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Wt(t,e))return;i.uniform3iv(this.addr,e),Xt(t,e)}}function im(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Wt(t,e))return;i.uniform4iv(this.addr,e),Xt(t,e)}}function sm(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function rm(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Wt(t,e))return;i.uniform2uiv(this.addr,e),Xt(t,e)}}function am(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Wt(t,e))return;i.uniform3uiv(this.addr,e),Xt(t,e)}}function om(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Wt(t,e))return;i.uniform4uiv(this.addr,e),Xt(t,e)}}function yo(i){return i.version===0&&(i.compareFunction=Al,i.needsUpdate=!0),i}function lm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=yo(kh):r=zh,t.setTexture2D(e||r,s)}function cm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Hh,s)}function hm(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=yo(Gh):r=Wh,t.setTextureCube(e||r,s)}function um(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Vh,s)}function dm(i){switch(i){case 5126:return Yp;case 35664:return Zp;case 35665:return Jp;case 35666:return $p;case 35674:return Kp;case 35675:return jp;case 35676:return Qp;case 5124:case 35670:return em;case 35667:case 35671:return tm;case 35668:case 35672:return nm;case 35669:case 35673:return im;case 5125:return sm;case 36294:return rm;case 36295:return am;case 36296:return om;case 35678:case 36198:case 36298:case 36306:case 35682:return lm;case 35679:case 36299:case 36307:return cm;case 35680:case 36300:case 36308:case 36293:return hm;case 36289:case 36303:case 36311:case 36292:return um}}function fm(i,e){i.uniform1fv(this.addr,e)}function pm(i,e){let t=ms(e,this.size,2);i.uniform2fv(this.addr,t)}function mm(i,e){let t=ms(e,this.size,3);i.uniform3fv(this.addr,t)}function gm(i,e){let t=ms(e,this.size,4);i.uniform4fv(this.addr,t)}function _m(i,e){let t=ms(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function xm(i,e){let t=ms(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function vm(i,e){let t=ms(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function ym(i,e){i.uniform1iv(this.addr,e)}function Mm(i,e){i.uniform2iv(this.addr,e)}function Sm(i,e){i.uniform3iv(this.addr,e)}function bm(i,e){i.uniform4iv(this.addr,e)}function wm(i,e){i.uniform1uiv(this.addr,e)}function Am(i,e){i.uniform2uiv(this.addr,e)}function Tm(i,e){i.uniform3uiv(this.addr,e)}function Em(i,e){i.uniform4uiv(this.addr,e)}function Cm(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Wt(n,r)||(i.uniform1iv(this.addr,r),Xt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=yo(kh):a=zh;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function Rm(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Wt(n,r)||(i.uniform1iv(this.addr,r),Xt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||Hh,r[a])}function Pm(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Wt(n,r)||(i.uniform1iv(this.addr,r),Xt(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=yo(Gh):a=Wh;for(let o=0;o!==s;++o)t.setTextureCube(e[o]||a,r[o])}function Im(i,e,t){let n=this.cache,s=e.length,r=vo(t,s);Wt(n,r)||(i.uniform1iv(this.addr,r),Xt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Vh,r[a])}function Lm(i){switch(i){case 5126:return fm;case 35664:return pm;case 35665:return mm;case 35666:return gm;case 35674:return _m;case 35675:return xm;case 35676:return vm;case 5124:case 35670:return ym;case 35667:case 35671:return Mm;case 35668:case 35672:return Sm;case 35669:case 35673:return bm;case 5125:return wm;case 36294:return Am;case 36295:return Tm;case 36296:return Em;case 35678:case 36198:case 36298:case 36306:case 35682:return Cm;case 35679:case 36299:case 36307:return Rm;case 35680:case 36300:case 36308:case 36293:return Pm;case 36289:case 36303:case 36311:case 36292:return Im}}var kl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=dm(t.type)}},Gl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Lm(t.type)}},Vl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Bl=/(\w+)(\])?(\[|\.)?/g;function bh(i,e){i.seq.push(e),i.map[e.id]=e}function Dm(i,e,t){let n=i.name,s=n.length;for(Bl.lastIndex=0;;){let r=Bl.exec(n),a=Bl.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){bh(t,c===void 0?new kl(o,i,e):new Gl(o,i,e));break}else{let d=t.map[o];d===void 0&&(d=new Vl(o),bh(t,d)),t=d}}}var ps=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);Dm(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function wh(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var Nm=37297,Um=0;function Fm(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var Ah=new Ze;function Om(i){pt._getMatrix(Ah,pt.workingColorSpace,i);let e=`mat3( ${Ah.elements.map(t=>t.toFixed(4))} )`;switch(pt.getTransfer(i)){case Ds:return[e,"LinearTransferOETF"];case vt:return[e,"sRGBTransferOETF"];default:return Ge("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Th(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+Fm(i.getShaderSource(e),o)}else return r}function Bm(i,e){let t=Om(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var zm={[cl]:"Linear",[hl]:"Reinhard",[ul]:"Cineon",[dl]:"ACESFilmic",[pl]:"AgX",[ml]:"Neutral",[fl]:"Custom"};function km(i,e){let t=zm[e];return t===void 0?(Ge("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var go=new z;function Gm(){pt.getLuminanceCoefficients(go);let i=go.x.toFixed(4),e=go.y.toFixed(4),t=go.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Vm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xr).join(`
`)}function Hm(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Wm(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function xr(i){return i!==""}function Eh(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function Ch(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Xm=/^[ \t]*#include +<([\w\d./]+)>/gm;function Hl(i){return i.replace(Xm,qm)}function qm(i,e){let t=ot[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return Hl(t)}var Ym=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Rh(i){return i.replace(Ym,Zm)}function Zm(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Ph(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var Jm={[ar]:"SHADOWMAP_TYPE_PCF",[cs]:"SHADOWMAP_TYPE_VSM"};function $m(i){return Jm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Km={[us]:"ENVMAP_MODE_REFRACTION"};function jm(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Km[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Qm={[ll]:"ENVMAP_BLENDING_MULTIPLY",[Yc]:"ENVMAP_BLENDING_MIX",[Zc]:"ENVMAP_BLENDING_ADD"};function e0(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Qm[i.combine]||"ENVMAP_BLENDING_NONE"}function t0(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=$m(t),c=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",u=jm(t),d=e0(t),h=Vm(t),m=Hm(r),x=s.createProgram(),S,f,p=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(S=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(xr).join(`
`),S.length>0&&(S+=`
`),f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(xr).join(`
`),f.length>0&&(f+=`
`)):(S=[Ph(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xr).join(`
`),f=[Ph(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==kn?"#define TONE_MAPPING":"",t.toneMapping!==kn?ot.tonemapping_pars_fragment:"",t.toneMapping!==kn?km("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ot.colorspace_pars_fragment,Bm("linearToOutputTexel",t.outputColorSpace),Gm(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(xr).join(`
`)),a=Hl(a),a=Eh(a,t),a=Ch(a,t),o=Hl(o),o=Eh(o,t),o=Ch(o,t),a=Rh(a),o=Rh(o),t.isRawShaderMaterial!==!0&&(p=`#version 300 es
`,S=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+S,f=["#define varying in",t.glslVersion===Tl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Tl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let v=p+S+a,E=p+f+o,b=wh(s,s.VERTEX_SHADER,v),R=wh(s,s.FRAGMENT_SHADER,E);s.attachShader(x,b),s.attachShader(x,R),t.index0AttributeName!==void 0?s.bindAttribLocation(x,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function w(C){if(i.debug.checkShaderErrors){let I=s.getProgramInfoLog(x)||"",N=s.getShaderInfoLog(b)||"",k=s.getShaderInfoLog(R)||"",P=I.trim(),Y=N.trim(),$=k.trim(),J=!0,le=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,b,R);else{let j=Th(s,b,"vertex"),re=Th(s,R,"fragment");Xe("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+P+`
`+j+`
`+re)}else P!==""?Ge("WebGLProgram: Program Info Log:",P):(Y===""||$==="")&&(le=!1);le&&(C.diagnostics={runnable:J,programLog:P,vertexShader:{log:Y,prefix:S},fragmentShader:{log:$,prefix:f}})}s.deleteShader(b),s.deleteShader(R),g=new ps(s,x),M=Wm(s,x)}let g;this.getUniforms=function(){return g===void 0&&w(this),g};let M;this.getAttributes=function(){return M===void 0&&w(this),M};let D=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=s.getProgramParameter(x,Nm)),D},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Um++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=b,this.fragmentShader=R,this}var n0=0,Wl=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Xl(e),t.set(e,n)),n}},Xl=class{constructor(e){this.id=n0++,this.code=e,this.usedTimes=0}};function i0(i){return i===vi||i===fr||i===pr}function s0(i,e,t,n,s,r){let a=new Fs,o=new Wl,l=new Set,c=[],u=new Map,d=n.logarithmicDepthBuffer,h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(g){return l.add(g),g===0?"uv":`uv${g}`}function x(g,M,D,C,I,N){let k=C.fog,P=I.geometry,Y=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?C.environment:null,$=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap,J=e.get(g.envMap||Y,$),le=h[g.type],j=n.precision;g.precision!==null&&(j=n.getMaxPrecision(g.precision),j!==g.precision&&Ge("WebGLProgram.getParameters:",g.precision,"not supported, using",j,"instead."));let re=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,T=re!==void 0?re.length:0,X=0;P.morphAttributes.position!==void 0&&(X=1),P.morphAttributes.normal!==void 0&&(X=2),P.morphAttributes.color!==void 0&&(X=3);let he,W,K,me;if(le){let Se=Vn[le];he=Se.vertexShader,W=Se.fragmentShader}else{he=g.vertexShader,W=g.fragmentShader;let Se=o.getVertexShaderStage(g),_t=o.getFragmentShaderStage(g);o.update(g,Se,_t),K=Se.id,me=_t.id}let Me=i.getRenderTarget(),ee=i.state.buffers.depth.getReversed(),te=I.isInstancedMesh===!0,Ke=I.isBatchedMesh===!0,Te=!!g.map,ke=!!g.matcap,ut=!!J,Fe=ut&&J.isPMREMTexture===!0,dt=!!g.aoMap,rt=!!g.lightMap,He=!!g.bumpMap&&g.wireframe===!1,je=!!g.normalMap,St=!!g.displacementMap,qe=!!g.emissiveMap,tt=!!g.metalnessMap,Oe=!!g.roughnessMap,st=g.anisotropy>0,F=g.clearcoat>0,Nt=g.diffuseRoughness>0,ze=g.dispersion>0,nt=g.retroreflectivity>0,de=g.iridescence>0,bt=g.sheen>0,De=g.transmission>0,Be=st&&!!g.anisotropyMap,A=F&&!!g.clearcoatMap,_=F&&!!g.clearcoatNormalMap,G=F&&!!g.clearcoatRoughnessMap,ce=Nt&&!!g.diffuseRoughnessMap,oe=de&&!!g.iridescenceMap,q=de&&!!g.iridescenceThicknessMap,fe=bt&&!!g.sheenColorMap,ne=bt&&!!g.sheenRoughnessMap,ie=!!g.specularMap,ge=!!g.specularColorMap,L=!!g.specularIntensityMap,se=De&&!!g.transmissionMap,Q=De&&!!g.thicknessMap,ye=!!g.gradientMap,pe=!!g.alphaMap,_e=g.alphaTest>0,Pe=!!g.alphaHash,Qe=!!g.extensions,ue=kn;g.toneMapped&&(Me===null||Me.isXRRenderTarget===!0)&&(ue=i.toneMapping);let Ue=Fe?J.isCompressedCubeTexture?J.image[0].mipmaps:J.mipmaps:null,Je={shaderID:le,shaderType:g.type,shaderName:g.name,vertexShader:he,fragmentShader:W,defines:g.defines,customVertexShaderID:K,customFragmentShaderID:me,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:j,batching:Ke,batchingColor:Ke&&I._colorsTexture!==null,instancing:te,instancingColor:te&&I.instanceColor!==null,instancingMorph:te&&I.morphTexture!==null,outputColorSpace:Me===null?i.outputColorSpace:Me.isXRRenderTarget===!0?Me.texture.colorSpace:pt.workingColorSpace,alphaToCoverage:!!g.alphaToCoverage,map:Te,matcap:ke,envMap:ut,envMapMode:ut&&J.mapping,envMapPMREM:Fe,envMapMaxLod:Fe?Ue.length-1:null,envMapSize:Fe?Ue[0].width:null,aoMap:dt,lightMap:rt,bumpMap:He,normalMap:je,displacementMap:St,emissiveMap:qe,normalMapObjectSpace:je&&g.normalMapType===Kc,normalMapTangentSpace:je&&g.normalMapType===po,packedNormalMap:je&&g.normalMapType===po&&i0(g.normalMap.format),metalnessMap:tt,roughnessMap:Oe,anisotropy:st,anisotropyMap:Be,clearcoat:F,clearcoatMap:A,clearcoatNormalMap:_,clearcoatRoughnessMap:G,diffuseRoughness:Nt,diffuseRoughnessMap:ce,dispersion:ze,retroreflection:nt,iridescence:de,iridescenceMap:oe,iridescenceThicknessMap:q,sheen:bt,sheenColorMap:fe,sheenRoughnessMap:ne,specularMap:ie,specularColorMap:ge,specularIntensityMap:L,transmission:De,transmissionMap:se,thicknessMap:Q,gradientMap:ye,opaque:g.transparent===!1&&g.blending===hs&&g.alphaToCoverage===!1,alphaMap:pe,alphaTest:_e,alphaHash:Pe,combine:g.combine,mapUv:Te&&m(g.map.channel),aoMapUv:dt&&m(g.aoMap.channel),lightMapUv:rt&&m(g.lightMap.channel),bumpMapUv:He&&m(g.bumpMap.channel),normalMapUv:je&&m(g.normalMap.channel),displacementMapUv:St&&m(g.displacementMap.channel),emissiveMapUv:qe&&m(g.emissiveMap.channel),metalnessMapUv:tt&&m(g.metalnessMap.channel),roughnessMapUv:Oe&&m(g.roughnessMap.channel),anisotropyMapUv:Be&&m(g.anisotropyMap.channel),clearcoatMapUv:A&&m(g.clearcoatMap.channel),clearcoatNormalMapUv:_&&m(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:G&&m(g.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:ce&&m(g.diffuseRoughnessMap.channel),iridescenceMapUv:oe&&m(g.iridescenceMap.channel),iridescenceThicknessMapUv:q&&m(g.iridescenceThicknessMap.channel),sheenColorMapUv:fe&&m(g.sheenColorMap.channel),sheenRoughnessMapUv:ne&&m(g.sheenRoughnessMap.channel),specularMapUv:ie&&m(g.specularMap.channel),specularColorMapUv:ge&&m(g.specularColorMap.channel),specularIntensityMapUv:L&&m(g.specularIntensityMap.channel),transmissionMapUv:se&&m(g.transmissionMap.channel),thicknessMapUv:Q&&m(g.thicknessMap.channel),alphaMapUv:pe&&m(g.alphaMap.channel),vertexTangents:!!P.attributes.tangent&&(je||st),vertexNormals:!!P.attributes.normal,vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!P.attributes.uv&&(Te||pe),fog:!!k,useFog:g.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:g.wireframe===!1&&(g.flatShading===!0||P.attributes.normal===void 0&&je===!1&&(g.isMeshLambertMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isMeshPhysicalMaterial)),sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ee,skinning:I.isSkinnedMesh===!0,hasPositionAttribute:P.attributes.position!==void 0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:X,numSunLights:M.sun.length,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numSunLightShadows:M.sunShadowMap.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:N.filter(Se=>Se.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&D.length>0,shadowMapType:i.shadowMap.type,toneMapping:ue,decodeVideoTexture:Te&&g.map.isVideoTexture===!0&&pt.getTransfer(g.map.colorSpace)===vt,decodeVideoTextureEmissive:qe&&g.emissiveMap.isVideoTexture===!0&&pt.getTransfer(g.emissiveMap.colorSpace)===vt,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===yn,flipSided:g.side===Ht,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:Qe&&g.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Qe&&g.extensions.multiDraw===!0||Ke)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return Je.vertexUv1s=l.has(1),Je.vertexUv2s=l.has(2),Je.vertexUv3s=l.has(3),l.clear(),Je}function S(g){let M=[];if(g.shaderID?M.push(g.shaderID):(M.push(g.customVertexShaderID),M.push(g.customFragmentShaderID)),g.defines!==void 0)for(let D in g.defines)M.push(D),M.push(g.defines[D]);return g.isRawShaderMaterial===!1&&(f(M,g),p(M,g),M.push(i.outputColorSpace)),M.push(g.customProgramCacheKey),M.join()}function f(g,M){g.push(M.precision),g.push(M.outputColorSpace),g.push(M.envMapMode),g.push(M.envMapPMREM),g.push(M.envMapMaxLod),g.push(M.envMapSize),g.push(M.mapUv),g.push(M.alphaMapUv),g.push(M.lightMapUv),g.push(M.aoMapUv),g.push(M.bumpMapUv),g.push(M.normalMapUv),g.push(M.displacementMapUv),g.push(M.emissiveMapUv),g.push(M.metalnessMapUv),g.push(M.roughnessMapUv),g.push(M.anisotropyMapUv),g.push(M.clearcoatMapUv),g.push(M.clearcoatNormalMapUv),g.push(M.clearcoatRoughnessMapUv),g.push(M.diffuseRoughnessMapUv),g.push(M.iridescenceMapUv),g.push(M.iridescenceThicknessMapUv),g.push(M.sheenColorMapUv),g.push(M.sheenRoughnessMapUv),g.push(M.specularMapUv),g.push(M.specularColorMapUv),g.push(M.specularIntensityMapUv),g.push(M.transmissionMapUv),g.push(M.thicknessMapUv),g.push(M.combine),g.push(M.fogExp2),g.push(M.sizeAttenuation),g.push(M.morphTargetsCount),g.push(M.numSunLights),g.push(M.numDirLights),g.push(M.numPointLights),g.push(M.numSpotLights),g.push(M.numSpotLightMaps),g.push(M.numHemiLights),g.push(M.numRectAreaLights),g.push(M.numSunLightShadows),g.push(M.numDirLightShadows),g.push(M.numPointLightShadows),g.push(M.numSpotLightShadows),g.push(M.numSpotLightShadowsWithMaps),g.push(M.numLightProbes),g.push(M.numLightProbeGrids),g.push(M.shadowMapType),g.push(M.toneMapping),g.push(M.numClippingPlanes),g.push(M.numClipIntersection),g.push(M.depthPacking)}function p(g,M){a.disableAll(),M.instancing&&a.enable(0),M.instancingColor&&a.enable(1),M.instancingMorph&&a.enable(2),M.matcap&&a.enable(3),M.envMap&&a.enable(4),M.normalMapObjectSpace&&a.enable(5),M.normalMapTangentSpace&&a.enable(6),M.clearcoat&&a.enable(7),M.iridescence&&a.enable(8),M.alphaTest&&a.enable(9),M.vertexColors&&a.enable(10),M.vertexAlphas&&a.enable(11),M.vertexUv1s&&a.enable(12),M.vertexUv2s&&a.enable(13),M.vertexUv3s&&a.enable(14),M.vertexTangents&&a.enable(15),M.anisotropy&&a.enable(16),M.alphaHash&&a.enable(17),M.batching&&a.enable(18),M.dispersion&&a.enable(19),M.retroreflection&&a.enable(24),M.diffuseRoughness&&a.enable(25),M.batchingColor&&a.enable(20),M.gradientMap&&a.enable(21),M.packedNormalMap&&a.enable(22),M.vertexNormals&&a.enable(23),g.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reversedDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),M.numLightProbeGrids>0&&a.enable(22),M.hasPositionAttribute&&a.enable(23),g.push(a.mask)}function v(g){let M=h[g.type],D;if(M){let C=Vn[M];D=uh.clone(C.uniforms)}else D=g.uniforms;return D}function E(g,M){let D=u.get(M);return D!==void 0?++D.usedTimes:(D=new t0(i,M,g,s),c.push(D),u.set(M,D)),D}function b(g){if(--g.usedTimes===0){let M=c.indexOf(g);c[M]=c[c.length-1],c.pop(),u.delete(g.cacheKey),g.destroy()}}function R(g){o.remove(g)}function w(){o.dispose()}return{getParameters:x,getProgramCacheKey:S,getUniforms:v,acquireProgram:E,releaseProgram:b,releaseShaderCache:R,programs:c,dispose:w}}function r0(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function a0(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Ih(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Lh(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(h){let m=0;return h.isInstancedMesh&&(m+=2),h.isSkinnedMesh&&(m+=1),m}function o(h,m,x,S,f,p){let v=i[e];return v===void 0?(v={id:h.id,object:h,geometry:m,material:x,materialVariant:a(h),groupOrder:S,renderOrder:h.renderOrder,z:f,group:p},i[e]=v):(v.id=h.id,v.object=h,v.geometry=m,v.material=x,v.materialVariant=a(h),v.groupOrder=S,v.renderOrder=h.renderOrder,v.z=f,v.group=p),e++,v}function l(h,m,x,S,f,p,v){v.reversedDepth===!0&&(f=-f);let E=o(h,m,x,S,f,p);x.transmission>0?n.push(E):x.transparent===!0?s.push(E):t.push(E)}function c(h,m,x,S,f,p){let v=o(h,m,x,S,f,p);x.transmission>0?n.unshift(v):x.transparent===!0?s.unshift(v):t.unshift(v)}function u(h,m){t.length>1&&t.sort(h||a0),n.length>1&&n.sort(m||Ih),s.length>1&&s.sort(m||Ih)}function d(){for(let h=e,m=i.length;h<m;h++){let x=i[h];if(x.id===null)break;x.id=null,x.object=null,x.geometry=null,x.material=null,x.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:d,sort:u}}function o0(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new Lh,i.set(n,[a])):s>=r.length?(a=new Lh,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function l0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new z,color:new et};break;case"SpotLight":t={position:new z,direction:new z,color:new et,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new et,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new et,groundColor:new et};break;case"RectAreaLight":t={color:new et,position:new z,halfWidth:new z,halfHeight:new z};break}return i[e.id]=t,t}}}function c0(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var h0=0;function u0(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function d0(i){let e=new l0,t=c0(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);let s=new z,r=new yt,a=new yt;function o(c){let u=0,d=0,h=0;for(let N=0;N<9;N++)n.probe[N].set(0,0,0);let m=0,x=0,S=0,f=0,p=0,v=0,E=0,b=0,R=0,w=0,g=0,M=0,D=0,C=0;c.sort(u0);for(let N=0,k=c.length;N<k;N++){let P=c[N],Y=P.color,$=P.intensity,J=P.distance,le=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===vi?le=P.shadow.map.texture:le=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)u+=Y.r*$,d+=Y.g*$,h+=Y.b*$;else if(P.isLightProbe){for(let j=0;j<9;j++)n.probe[j].addScaledVector(P.sh.coefficients[j],$);C++}else if(P.isSunLight){let j=e.get(P);if(j.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let re=P.shadow,T=t.get(P);T.shadowIntensity=re.intensity,T.shadowBias=re.bias,T.shadowNormalBias=re.normalBias,T.shadowRadius=re.radius,T.shadowMapSize.copy(re.mapSize).multiply(re.getFrameExtents()),n.sunShadow[x]=T,n.sunShadowMap[x]=le;let X=re.getViewportCount();for(let he=0;he<X;he++)n.sunShadowMatrix[S+he]=re.getMatrix(he),n.sunShadowCascade[S+he]=re._cascadeData[he];S+=X,x++}n.sun[m]=j,m++}else if(P.isDirectionalLight){let j=e.get(P);if(j.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){let re=P.shadow,T=t.get(P);T.shadowIntensity=re.intensity,T.shadowBias=re.bias,T.shadowNormalBias=re.normalBias,T.shadowRadius=re.radius,T.shadowMapSize=re.mapSize,n.directionalShadow[f]=T,n.directionalShadowMap[f]=le,n.directionalShadowMatrix[f]=P.shadow.matrix,R++}n.directional[f]=j,f++}else if(P.isSpotLight){let j=e.get(P);j.position.setFromMatrixPosition(P.matrixWorld),j.color.copy(Y).multiplyScalar($),j.distance=J,j.coneCos=Math.cos(P.angle),j.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),j.decay=P.decay,n.spot[v]=j;let re=P.shadow;if(P.map&&(n.spotLightMap[M]=P.map,M++,re.updateMatrices(P),P.castShadow&&D++),n.spotLightMatrix[v]=re.matrix,P.castShadow){let T=t.get(P);T.shadowIntensity=re.intensity,T.shadowBias=re.bias,T.shadowNormalBias=re.normalBias,T.shadowRadius=re.radius,T.shadowMapSize=re.mapSize,n.spotShadow[v]=T,n.spotShadowMap[v]=le,g++}v++}else if(P.isRectAreaLight){let j=e.get(P);j.color.copy(Y).multiplyScalar($),j.halfWidth.set(P.width*.5,0,0),j.halfHeight.set(0,P.height*.5,0),n.rectArea[E]=j,E++}else if(P.isPointLight){let j=e.get(P);if(j.color.copy(P.color).multiplyScalar(P.intensity),j.distance=P.distance,j.decay=P.decay,P.castShadow){let re=P.shadow,T=t.get(P);T.shadowIntensity=re.intensity,T.shadowBias=re.bias,T.shadowNormalBias=re.normalBias,T.shadowRadius=re.radius,T.shadowMapSize=re.mapSize,T.shadowCameraNear=re.camera.near,T.shadowCameraFar=re.camera.far,n.pointShadow[p]=T,n.pointShadowMap[p]=le,n.pointShadowMatrix[p]=P.shadow.matrix,w++}n.point[p]=j,p++}else if(P.isHemisphereLight){let j=e.get(P);j.skyColor.copy(P.color).multiplyScalar($),j.groundColor.copy(P.groundColor).multiplyScalar($),n.hemi[b]=j,b++}}E>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Ae.LTC_FLOAT_1,n.rectAreaLTC2=Ae.LTC_FLOAT_2):(n.rectAreaLTC1=Ae.LTC_HALF_1,n.rectAreaLTC2=Ae.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=d,n.ambient[2]=h;let I=n.hash;(I.sunLength!==m||I.directionalLength!==f||I.pointLength!==p||I.spotLength!==v||I.rectAreaLength!==E||I.hemiLength!==b||I.numSunShadows!==x||I.numDirectionalShadows!==R||I.numPointShadows!==w||I.numSpotShadows!==g||I.numSpotMaps!==M||I.numLightProbes!==C)&&(n.sun.length=m,n.directional.length=f,n.spot.length=v,n.rectArea.length=E,n.point.length=p,n.hemi.length=b,n.sunShadow.length=x,n.sunShadowMap.length=x,n.sunShadowMatrix.length=S,n.sunShadowCascade.length=S,n.directionalShadow.length=R,n.directionalShadowMap.length=R,n.directionalShadowMatrix.length=R,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=g,n.spotShadowMap.length=g,n.spotLightMatrix.length=g+M-D,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=D,n.numLightProbes=C,I.sunLength=m,I.directionalLength=f,I.pointLength=p,I.spotLength=v,I.rectAreaLength=E,I.hemiLength=b,I.numSunShadows=x,I.numDirectionalShadows=R,I.numPointShadows=w,I.numSpotShadows=g,I.numSpotMaps=M,I.numLightProbes=C,n.version=h0++)}function l(c,u){let d=0,h=0,m=0,x=0,S=0,f=0,p=u.matrixWorldInverse;for(let v=0,E=c.length;v<E;v++){let b=c[v];if(b.isSunLight){let R=n.sun[d];R.direction.setFromMatrixPosition(b.matrixWorld),R.direction.transformDirection(p),d++}else if(b.isDirectionalLight){let R=n.directional[h];R.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),R.direction.sub(s),R.direction.transformDirection(p),h++}else if(b.isSpotLight){let R=n.spot[x];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(p),R.direction.setFromMatrixPosition(b.matrixWorld),s.setFromMatrixPosition(b.target.matrixWorld),R.direction.sub(s),R.direction.transformDirection(p),x++}else if(b.isRectAreaLight){let R=n.rectArea[S];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(p),a.identity(),r.copy(b.matrixWorld),r.premultiply(p),a.extractRotation(r),R.halfWidth.set(b.width*.5,0,0),R.halfHeight.set(0,b.height*.5,0),R.halfWidth.applyMatrix4(a),R.halfHeight.applyMatrix4(a),S++}else if(b.isPointLight){let R=n.point[m];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(p),m++}else if(b.isHemisphereLight){let R=n.hemi[f];R.direction.setFromMatrixPosition(b.matrixWorld),R.direction.transformDirection(p),f++}}}return{setup:o,setupView:l,state:n}}function Dh(i){let e=new d0(i),t=[],n=[],s=[];function r(d){u.camera=d,t.length=0,n.length=0,s.length=0}function a(d){d.isLightProbeGrid?s.push(d):t.push(d)}function o(d){n.push(d)}function l(){e.setup(t),s.sort((d,h)=>d.priority-h.priority||d.id-h.id)}function c(d){e.setupView(t,d)}let u={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function f0(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new Dh(i),e.set(s,[o])):r>=a.length?(o=new Dh(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var p0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,m0=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,g0=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],_0=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],Nh=new yt,_r=new z,zl=new z;function x0(i,e,t){let n=new di,s=new $e,r=new $e,a=new Rt,o=new fa,l=new pa,c={},u=t.maxTextureSize,d={[xi]:Ht,[Ht]:xi,[yn]:yn},h=new rn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new $e},radius:{value:4}},vertexShader:p0,fragmentShader:m0}),m=h.clone();m.defines.HORIZONTAL_PASS=1;let x=new Bt;x.setAttribute("position",new Cn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new Tt(x,h),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ar;let p=this.type;this.render=function(w,g,M){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||w.length===0)return;this.type===Cc&&(Ge("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=ar);let D=i.getRenderTarget(),C=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),N=i.state;N.setBlending(Ci),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);let k=p!==this.type;k&&g.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(Y=>Y.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,Y=w.length;P<Y;P++){let $=w[P],J=$.shadow;if(J===void 0){Ge("WebGLShadowMap:",$,"has no shadow.");continue}if(J.autoUpdate===!1&&J.needsUpdate===!1)continue;s.copy(J.mapSize);let le=J.getFrameExtents();s.multiply(le),r.copy(J.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/le.x),s.x=r.x*le.x,J.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/le.y),s.y=r.y*le.y,J.mapSize.y=r.y));let j=i.state.buffers.depth.getReversed();if(J.camera._reversedDepth=j,J.map===null||k===!0){if(J.map!==null&&(J.map.depthTexture!==null&&(J.map.depthTexture.dispose(),J.map.depthTexture=null),J.map.dispose()),this.type===cs){if($.isPointLight){Ge("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}J.map=new mn(s.x,s.y,{format:vi,type:Pn,minFilter:nn,magFilter:nn,generateMipmaps:!1}),J.map.texture.name=$.name+".shadowMap",J.map.depthTexture=new Qn(s.x,s.y,Mn),J.map.depthTexture.name=$.name+".shadowMapDepth",J.map.depthTexture.format=$n,J.map.depthTexture.compareFunction=null,J.map.depthTexture.minFilter=Gt,J.map.depthTexture.magFilter=Gt}else $.isPointLight?(J.map=new vr(s.x),J.map.depthTexture=new Xs(s.x,Rn)):(J.map=new mn(s.x,s.y),J.map.depthTexture=new Qn(s.x,s.y,Rn)),J.map.depthTexture.name=$.name+".shadowMap",J.map.depthTexture.format=$n,this.type===ar?(J.map.depthTexture.compareFunction=j?wl:bl,J.map.depthTexture.minFilter=nn,J.map.depthTexture.magFilter=nn):(J.map.depthTexture.compareFunction=null,J.map.depthTexture.minFilter=Gt,J.map.depthTexture.magFilter=Gt);J.camera.updateProjectionMatrix()}J.map.isWebGLCubeRenderTarget!==!0&&(J.map.width!==s.x||J.map.height!==s.y)&&J.map.setSize(s.x,s.y);let re=J.map.isWebGLCubeRenderTarget?6:J.getViewportCount();$.isPointLight!==!0&&J.updateMatrices($,M);let T=(J.camera.layers.mask&4294967294)!==0?J.camera.layers:M.layers;for(let X=0;X<re;X++){let he=J.getCamera(X);if($.isPointLight){let W=J.camera,K=J.matrix,me=$.distance||W.far;me!==W.far&&(W.far=me,W.updateProjectionMatrix()),_r.setFromMatrixPosition($.matrixWorld),W.position.copy(_r),zl.copy(W.position),zl.add(g0[X]),W.up.copy(_0[X]),W.lookAt(zl),W.updateMatrixWorld(),K.makeTranslation(-_r.x,-_r.y,-_r.z),Nh.multiplyMatrices(W.projectionMatrix,W.matrixWorldInverse),J._frustum.setFromProjectionMatrix(Nh,W.coordinateSystem,W.reversedDepth)}if(J.map.isWebGLCubeRenderTarget)i.setRenderTarget(J.map,X),i.clear();else{X===0&&(i.setRenderTarget(J.map),i.clear());let W=J.getViewport(X);a.set(r.x*W.x,r.y*W.y,r.x*W.z,r.y*W.w),N.viewport(a)}n=J.getFrustum(X),b(g,M,he,$,T,this.type)}J.isPointLightShadow!==!0&&this.type===cs&&v(J,M),J.needsUpdate=!1}p=this.type,f.needsUpdate=!1,i.setRenderTarget(D,C,I)};function v(w,g){let M=e.update(S);h.defines.VSM_SAMPLES!==w.blurSamples&&(h.defines.VSM_SAMPLES=w.blurSamples,m.defines.VSM_SAMPLES=w.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),w.mapPass===null?w.mapPass=new mn(s.x,s.y,{format:vi,type:Pn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),h.uniforms.shadow_pass.value=w.map.depthTexture,h.uniforms.resolution.value.set(w.map.width,w.map.height),h.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(g,null,M,h,S,null),m.uniforms.shadow_pass.value=w.mapPass.texture,m.uniforms.resolution.value.set(w.map.width,w.map.height),m.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(g,null,M,m,S,null)}function E(w,g,M,D){let C=null,I=M.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(I!==void 0)C=I;else if(C=M.isPointLight===!0?l:o,i.localClippingEnabled&&g.clipShadows===!0&&Array.isArray(g.clippingPlanes)&&g.clippingPlanes.length!==0||g.displacementMap&&g.displacementScale!==0||g.alphaMap&&g.alphaTest>0||g.map&&g.alphaTest>0||g.alphaToCoverage===!0){let N=C.uuid,k=g.uuid,P=c[N];P===void 0&&(P={},c[N]=P);let Y=P[k];Y===void 0&&(Y=C.clone(),P[k]=Y,g.addEventListener("dispose",R)),C=Y}if(C.visible=g.visible,C.wireframe=g.wireframe,D===cs?C.side=g.shadowSide!==null?g.shadowSide:g.side:C.side=g.shadowSide!==null?g.shadowSide:d[g.side],C.alphaMap=g.alphaMap,C.alphaTest=g.alphaToCoverage===!0?.5:g.alphaTest,C.map=g.map,C.clipShadows=g.clipShadows,C.clippingPlanes=g.clippingPlanes,C.clipIntersection=g.clipIntersection,C.displacementMap=g.displacementMap,C.displacementScale=g.displacementScale,C.displacementBias=g.displacementBias,C.wireframeLinewidth=g.wireframeLinewidth,C.linewidth=g.linewidth,M.isPointLight===!0&&C.isMeshDistanceMaterial===!0){let N=i.properties.get(C);N.light=M}return C}function b(w,g,M,D,C,I){if(w.visible===!1)return;if(w.layers.test(C)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&I===cs)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,w.matrixWorld);let P=e.update(w),Y=w.material;if(Array.isArray(Y)){let $=P.groups;for(let J=0,le=$.length;J<le;J++){let j=$[J],re=Y[j.materialIndex];if(re&&re.visible){let T=E(w,re,D,I);w.onBeforeShadow(i,w,g,M,P,T,j),i.renderBufferDirect(M,null,P,T,w,j),w.onAfterShadow(i,w,g,M,P,T,j)}}}else if(Y.visible){let $=E(w,Y,D,I);w.onBeforeShadow(i,w,g,M,P,$,null),i.renderBufferDirect(M,null,P,$,w,null),w.onAfterShadow(i,w,g,M,P,$,null)}}let k=w.children;for(let P=0,Y=k.length;P<Y;P++)b(k[P],g,M,D,C,I)}function R(w){w.target.removeEventListener("dispose",R);for(let M in c){let D=c[M],C=w.target.uuid;C in D&&(D[C].dispose(),delete D[C])}}}function v0(i,e){function t(){let L=!1,se=new Rt,Q=null,ye=new Rt(0,0,0,0);return{setMask:function(pe){Q!==pe&&!L&&(i.colorMask(pe,pe,pe,pe),Q=pe)},setLocked:function(pe){L=pe},setClear:function(pe,_e,Pe,Qe,ue){ue===!0&&(pe*=Qe,_e*=Qe,Pe*=Qe),se.set(pe,_e,Pe,Qe),ye.equals(se)===!1&&(i.clearColor(pe,_e,Pe,Qe),ye.copy(se))},reset:function(){L=!1,Q=null,ye.set(-1,0,0,0)}}}function n(){let L=!1,se=!1,Q=null,ye=null,pe=null;return{setReversed:function(_e){if(se!==_e){let Pe=e.get("EXT_clip_control");_e?Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.ZERO_TO_ONE_EXT):Pe.clipControlEXT(Pe.LOWER_LEFT_EXT,Pe.NEGATIVE_ONE_TO_ONE_EXT),se=_e;let Qe=pe;pe=null,this.setClear(Qe)}},getReversed:function(){return se},setTest:function(_e){_e?ee(i.DEPTH_TEST):te(i.DEPTH_TEST)},setMask:function(_e){Q!==_e&&!L&&(i.depthMask(_e),Q=_e)},setFunc:function(_e){if(se&&(_e=lh[_e]),ye!==_e){switch(_e){case $r:i.depthFunc(i.NEVER);break;case Kr:i.depthFunc(i.ALWAYS);break;case jr:i.depthFunc(i.LESS);break;case ji:i.depthFunc(i.LEQUAL);break;case Qr:i.depthFunc(i.EQUAL);break;case ea:i.depthFunc(i.GEQUAL);break;case ta:i.depthFunc(i.GREATER);break;case na:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ye=_e}},setLocked:function(_e){L=_e},setClear:function(_e){pe!==_e&&(pe=_e,se&&(_e=1-_e),i.clearDepth(_e))},reset:function(){L=!1,Q=null,ye=null,pe=null,se=!1}}}function s(){let L=!1,se=null,Q=null,ye=null,pe=null,_e=null,Pe=null,Qe=null,ue=null;return{setTest:function(Ue){L||(Ue?ee(i.STENCIL_TEST):te(i.STENCIL_TEST))},setMask:function(Ue){se!==Ue&&!L&&(i.stencilMask(Ue),se=Ue)},setFunc:function(Ue,Je,Se){(Q!==Ue||ye!==Je||pe!==Se)&&(i.stencilFunc(Ue,Je,Se),Q=Ue,ye=Je,pe=Se)},setOp:function(Ue,Je,Se){(_e!==Ue||Pe!==Je||Qe!==Se)&&(i.stencilOp(Ue,Je,Se),_e=Ue,Pe=Je,Qe=Se)},setLocked:function(Ue){L=Ue},setClear:function(Ue){ue!==Ue&&(i.clearStencil(Ue),ue=Ue)},reset:function(){L=!1,se=null,Q=null,ye=null,pe=null,_e=null,Pe=null,Qe=null,ue=null}}}let r=new t,a=new n,o=new s,l={},c=new WeakMap,u={},d={},h={},m=new WeakMap,x=[],S=null,f=!1,p=null,v=null,E=null,b=null,R=null,w=null,g=null,M=new et(0,0,0),D=0,C=!1,I=null,N=null,k=null,P=null,Y=null,$=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),J=!1,le=0,j=i.getParameter(i.VERSION);j.indexOf("WebGL")!==-1?(le=parseFloat(/^WebGL (\d)/.exec(j)[1]),J=le>=1):j.indexOf("OpenGL ES")!==-1&&(le=parseFloat(/^OpenGL ES (\d)/.exec(j)[1]),J=le>=2);let re=null,T={},X=i.getParameter(i.SCISSOR_BOX),he=i.getParameter(i.VIEWPORT),W=new Rt().fromArray(X),K=new Rt().fromArray(he);function me(L,se,Q,ye){let pe=new Uint8Array(4),_e=i.createTexture();i.bindTexture(L,_e),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Pe=0;Pe<Q;Pe++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(se,0,i.RGBA,1,1,ye,0,i.RGBA,i.UNSIGNED_BYTE,pe):i.texImage2D(se+Pe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,pe);return _e}let Me={};Me[i.TEXTURE_2D]=me(i.TEXTURE_2D,i.TEXTURE_2D,1),Me[i.TEXTURE_CUBE_MAP]=me(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Me[i.TEXTURE_2D_ARRAY]=me(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Me[i.TEXTURE_3D]=me(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ee(i.DEPTH_TEST),a.setFunc(ji),He(!1),je(il),ee(i.CULL_FACE),dt(Ci);function ee(L){u[L]!==!0&&(i.enable(L),u[L]=!0)}function te(L){u[L]!==!1&&(i.disable(L),u[L]=!1)}function Ke(L,se){return h[L]!==se?(i.bindFramebuffer(L,se),h[L]=se,L===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=se),L===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=se),!0):!1}function Te(L,se){let Q=x,ye=!1;if(L){Q=m.get(se),Q===void 0&&(Q=[],m.set(se,Q));let pe=L.textures;if(Q.length!==pe.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let _e=0,Pe=pe.length;_e<Pe;_e++)Q[_e]=i.COLOR_ATTACHMENT0+_e;Q.length=pe.length,ye=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,ye=!0);ye&&i.drawBuffers(Q)}function ke(L){return S!==L?(i.useProgram(L),S=L,!0):!1}let ut={[Ri]:i.FUNC_ADD,[Pc]:i.FUNC_SUBTRACT,[Ic]:i.FUNC_REVERSE_SUBTRACT};ut[Lc]=i.MIN,ut[Dc]=i.MAX;let Fe={[Nc]:i.ZERO,[Uc]:i.ONE,[Fc]:i.SRC_COLOR,[al]:i.SRC_ALPHA,[Vc]:i.SRC_ALPHA_SATURATE,[kc]:i.DST_COLOR,[Bc]:i.DST_ALPHA,[Oc]:i.ONE_MINUS_SRC_COLOR,[ol]:i.ONE_MINUS_SRC_ALPHA,[Gc]:i.ONE_MINUS_DST_COLOR,[zc]:i.ONE_MINUS_DST_ALPHA,[Hc]:i.CONSTANT_COLOR,[Wc]:i.ONE_MINUS_CONSTANT_COLOR,[Xc]:i.CONSTANT_ALPHA,[qc]:i.ONE_MINUS_CONSTANT_ALPHA};function dt(L,se,Q,ye,pe,_e,Pe,Qe,ue,Ue){if(L===Ci){f===!0&&(te(i.BLEND),f=!1);return}if(f===!1&&(ee(i.BLEND),f=!0),L!==Rc){if(L!==p||Ue!==C){if((v!==Ri||R!==Ri)&&(i.blendEquation(i.FUNC_ADD),v=Ri,R=Ri),Ue)switch(L){case hs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case or:i.blendFunc(i.ONE,i.ONE);break;case sl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case rl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Xe("WebGLState: Invalid blending: ",L);break}else switch(L){case hs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case or:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case sl:Xe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case rl:Xe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Xe("WebGLState: Invalid blending: ",L);break}E=null,b=null,w=null,g=null,M.set(0,0,0),D=0,p=L,C=Ue}return}pe=pe||se,_e=_e||Q,Pe=Pe||ye,(se!==v||pe!==R)&&(i.blendEquationSeparate(ut[se],ut[pe]),v=se,R=pe),(Q!==E||ye!==b||_e!==w||Pe!==g)&&(i.blendFuncSeparate(Fe[Q],Fe[ye],Fe[_e],Fe[Pe]),E=Q,b=ye,w=_e,g=Pe),(Qe.equals(M)===!1||ue!==D)&&(i.blendColor(Qe.r,Qe.g,Qe.b,ue),M.copy(Qe),D=ue),p=L,C=!1}function rt(L,se){L.side===yn?te(i.CULL_FACE):ee(i.CULL_FACE);let Q=L.side===Ht;se&&(Q=!Q),He(Q),L.blending===hs&&L.transparent===!1?dt(Ci):dt(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),r.setMask(L.colorWrite);let ye=L.stencilWrite;o.setTest(ye),ye&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),qe(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?ee(i.SAMPLE_ALPHA_TO_COVERAGE):te(i.SAMPLE_ALPHA_TO_COVERAGE)}function He(L){I!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),I=L)}function je(L){L!==Tc?(ee(i.CULL_FACE),L!==N&&(L===il?i.cullFace(i.BACK):L===Ec?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):te(i.CULL_FACE),N=L}function St(L){L!==k&&(J&&i.lineWidth(L),k=L)}function qe(L,se,Q){L?(ee(i.POLYGON_OFFSET_FILL),(P!==se||Y!==Q)&&(P=se,Y=Q,a.getReversed()&&(se=-se,Q=-Q),i.polygonOffset(se,Q))):te(i.POLYGON_OFFSET_FILL)}function tt(L){L?ee(i.SCISSOR_TEST):te(i.SCISSOR_TEST)}function Oe(L){L===void 0&&(L=i.TEXTURE0+$-1),re!==L&&(i.activeTexture(L),re=L)}function st(L,se,Q){Q===void 0&&(re===null?Q=i.TEXTURE0+$-1:Q=re);let ye=T[Q];ye===void 0&&(ye={type:void 0,texture:void 0},T[Q]=ye),(ye.type!==L||ye.texture!==se)&&(re!==Q&&(i.activeTexture(Q),re=Q),i.bindTexture(L,se||Me[L]),ye.type=L,ye.texture=se)}function F(){let L=T[re];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Nt(){try{i.compressedTexImage2D(...arguments)}catch(L){Xe("WebGLState:",L)}}function ze(){try{i.compressedTexImage3D(...arguments)}catch(L){Xe("WebGLState:",L)}}function nt(){try{i.texSubImage2D(...arguments)}catch(L){Xe("WebGLState:",L)}}function de(){try{i.texSubImage3D(...arguments)}catch(L){Xe("WebGLState:",L)}}function bt(){try{i.compressedTexSubImage2D(...arguments)}catch(L){Xe("WebGLState:",L)}}function De(){try{i.compressedTexSubImage3D(...arguments)}catch(L){Xe("WebGLState:",L)}}function Be(){try{i.texStorage2D(...arguments)}catch(L){Xe("WebGLState:",L)}}function A(){try{i.texStorage3D(...arguments)}catch(L){Xe("WebGLState:",L)}}function _(){try{i.texImage2D(...arguments)}catch(L){Xe("WebGLState:",L)}}function G(){try{i.texImage3D(...arguments)}catch(L){Xe("WebGLState:",L)}}function ce(L){return d[L]!==void 0?d[L]:i.getParameter(L)}function oe(L,se){d[L]!==se&&(i.pixelStorei(L,se),d[L]=se)}function q(L){W.equals(L)===!1&&(i.scissor(L.x,L.y,L.z,L.w),W.copy(L))}function fe(L){K.equals(L)===!1&&(i.viewport(L.x,L.y,L.z,L.w),K.copy(L))}function ne(L,se){let Q=c.get(se);Q===void 0&&(Q=new WeakMap,c.set(se,Q));let ye=Q.get(L);ye===void 0&&(ye=i.getUniformBlockIndex(se,L.name),i.uniformBlockBinding(se,ye,ye),Q.set(L,ye))}function ie(L,se,Q){let pe=c.get(se).get(L);l[pe]!==Q&&(i.bindBufferBase(i.UNIFORM_BUFFER,pe,Q),l[pe]=Q)}function ge(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},d={},re=null,T={},h={},l={},m=new WeakMap,x=[],S=null,f=!1,p=null,v=null,E=null,b=null,R=null,w=null,g=null,M=new et(0,0,0),D=0,C=!1,I=null,N=null,k=null,P=null,Y=null,W.set(0,0,i.canvas.width,i.canvas.height),K.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ee,disable:te,bindFramebuffer:Ke,drawBuffers:Te,useProgram:ke,setBlending:dt,setMaterial:rt,setFlipSided:He,setCullFace:je,setLineWidth:St,setPolygonOffset:qe,setScissorTest:tt,activeTexture:Oe,bindTexture:st,unbindTexture:F,compressedTexImage2D:Nt,compressedTexImage3D:ze,texImage2D:_,texImage3D:G,pixelStorei:oe,getParameter:ce,updateUBOMapping:ne,uniformBlockBinding:ie,texStorage2D:Be,texStorage3D:A,texSubImage2D:nt,texSubImage3D:de,compressedTexSubImage2D:bt,compressedTexSubImage3D:De,scissor:q,viewport:fe,reset:ge}}function y0(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new $e,u=new WeakMap,d=new Set,h,m=new WeakMap,x=new Set,S=new FinalizationRegistry(A=>x.delete(A)),f=!1;try{f=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(A){}function p(A,_){return f?new OffscreenCanvas(A,_):Ns("canvas")}function v(A,_,G){let ce=1,oe=Be(A);if((oe.width>G||oe.height>G)&&(ce=G/Math.max(oe.width,oe.height)),ce<1)if(typeof HTMLImageElement!="undefined"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&A instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&A instanceof ImageBitmap||typeof VideoFrame!="undefined"&&A instanceof VideoFrame){let q=Math.floor(ce*oe.width),fe=Math.floor(ce*oe.height);h===void 0&&(h=p(q,fe));let ne=_?p(q,fe):h;return ne.width=q,ne.height=fe,ne.getContext("2d").drawImage(A,0,0,q,fe),Ge("WebGLRenderer: Texture has been resized from ("+oe.width+"x"+oe.height+") to ("+q+"x"+fe+")."),ne}else return"data"in A&&Ge("WebGLRenderer: Image in DataTexture is too big ("+oe.width+"x"+oe.height+")."),A;return A}function E(A){return A.generateMipmaps}function b(A){i.generateMipmap(A)}function R(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(A,_,G,ce,oe,q=!1){if(A!==null){if(i[A]!==void 0)return i[A];Ge("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let fe;ce&&(fe=e.get("EXT_texture_norm16"),fe||Ge("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ne=_;if(_===i.RED&&(G===i.FLOAT&&(ne=i.R32F),G===i.HALF_FLOAT&&(ne=i.R16F),G===i.UNSIGNED_BYTE&&(ne=i.R8),G===i.UNSIGNED_SHORT&&fe&&(ne=fe.R16_EXT),G===i.SHORT&&fe&&(ne=fe.R16_SNORM_EXT)),_===i.RED_INTEGER&&(G===i.UNSIGNED_BYTE&&(ne=i.R8UI),G===i.UNSIGNED_SHORT&&(ne=i.R16UI),G===i.UNSIGNED_INT&&(ne=i.R32UI),G===i.BYTE&&(ne=i.R8I),G===i.SHORT&&(ne=i.R16I),G===i.INT&&(ne=i.R32I)),_===i.RG&&(G===i.FLOAT&&(ne=i.RG32F),G===i.HALF_FLOAT&&(ne=i.RG16F),G===i.UNSIGNED_BYTE&&(ne=i.RG8),G===i.UNSIGNED_SHORT&&fe&&(ne=fe.RG16_EXT),G===i.SHORT&&fe&&(ne=fe.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(G===i.UNSIGNED_BYTE&&(ne=i.RG8UI),G===i.UNSIGNED_SHORT&&(ne=i.RG16UI),G===i.UNSIGNED_INT&&(ne=i.RG32UI),G===i.BYTE&&(ne=i.RG8I),G===i.SHORT&&(ne=i.RG16I),G===i.INT&&(ne=i.RG32I)),_===i.RGB_INTEGER&&(G===i.UNSIGNED_BYTE&&(ne=i.RGB8UI),G===i.UNSIGNED_SHORT&&(ne=i.RGB16UI),G===i.UNSIGNED_INT&&(ne=i.RGB32UI),G===i.BYTE&&(ne=i.RGB8I),G===i.SHORT&&(ne=i.RGB16I),G===i.INT&&(ne=i.RGB32I)),_===i.RGBA_INTEGER&&(G===i.UNSIGNED_BYTE&&(ne=i.RGBA8UI),G===i.UNSIGNED_SHORT&&(ne=i.RGBA16UI),G===i.UNSIGNED_INT&&(ne=i.RGBA32UI),G===i.BYTE&&(ne=i.RGBA8I),G===i.SHORT&&(ne=i.RGBA16I),G===i.INT&&(ne=i.RGBA32I)),_===i.RGB&&(G===i.UNSIGNED_SHORT&&fe&&(ne=fe.RGB16_EXT),G===i.SHORT&&fe&&(ne=fe.RGB16_SNORM_EXT),G===i.UNSIGNED_INT_5_9_9_9_REV&&(ne=i.RGB9_E5),G===i.UNSIGNED_INT_10F_11F_11F_REV&&(ne=i.R11F_G11F_B10F)),_===i.RGBA){let ie=q?Ds:pt.getTransfer(oe);G===i.FLOAT&&(ne=i.RGBA32F),G===i.HALF_FLOAT&&(ne=i.RGBA16F),G===i.UNSIGNED_BYTE&&(ne=ie===vt?i.SRGB8_ALPHA8:i.RGBA8),G===i.UNSIGNED_SHORT&&fe&&(ne=fe.RGBA16_EXT),G===i.SHORT&&fe&&(ne=fe.RGBA16_SNORM_EXT),G===i.UNSIGNED_SHORT_4_4_4_4&&(ne=i.RGBA4),G===i.UNSIGNED_SHORT_5_5_5_1&&(ne=i.RGB5_A1)}return(ne===i.R16F||ne===i.R32F||ne===i.RG16F||ne===i.RG32F||ne===i.RGBA16F||ne===i.RGBA32F)&&e.get("EXT_color_buffer_float"),ne}function g(A,_){let G;return A?_===null||_===Rn||_===Ii?G=i.DEPTH24_STENCIL8:_===Mn?G=i.DEPTH32F_STENCIL8:_===ds&&(G=i.DEPTH24_STENCIL8,Ge("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Rn||_===Ii?G=i.DEPTH_COMPONENT24:_===Mn?G=i.DEPTH_COMPONENT32F:_===ds&&(G=i.DEPTH_COMPONENT16),G}function M(A,_){return E(A)===!0||A.isFramebufferTexture&&A.minFilter!==Gt&&A.minFilter!==nn?Math.log2(Math.max(_.width,_.height))+1:A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?_.mipmaps.length:1}function D(A){let _=new WeakRef(A);n.get(A).__ref=_,x.add(_),S.register(A,_,_)}function C(A){let _=n.get(A).__ref;_!==void 0&&(x.delete(_),S.unregister(_))}function I(A){k(A.target)}function N(A){P(A.target)}function k(A){A.removeEventListener("dispose",I),C(A),$(A),A.isVideoTexture&&u.delete(A),A.isHTMLTexture&&d.delete(A)}function P(A){A.removeEventListener("dispose",N),C(A),le(A)}function Y(){for(let A of x){let _=A.deref();_!==void 0&&(_.isRenderTarget===!0?P(_):k(_))}x.clear(),d.clear()}function $(A){let _=n.get(A);if(_.__webglInit===void 0)return;let G=A.source,ce=m.get(G);if(ce){let oe=ce[_.__cacheKey];oe.usedTimes--,oe.usedTimes===0&&J(A),Object.keys(ce).length===0&&m.delete(G)}n.remove(A)}function J(A){let _=n.get(A);i.deleteTexture(_.__webglTexture);let G=A.source,ce=m.get(G);delete ce[_.__cacheKey],a.memory.textures--}function le(A){let _=n.get(A);_.__depthDisposeCallback&&_.__depthDisposeCallback();let G=A.depthTexture;if(G&&G.renderTarget===A&&k(G),A.isWebGLCubeRenderTarget)for(let oe=0;oe<6;oe++){if(Array.isArray(_.__webglFramebuffer[oe]))for(let q=0;q<_.__webglFramebuffer[oe].length;q++)i.deleteFramebuffer(_.__webglFramebuffer[oe][q]);else i.deleteFramebuffer(_.__webglFramebuffer[oe]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[oe])}else{if(Array.isArray(_.__webglFramebuffer))for(let oe=0;oe<_.__webglFramebuffer.length;oe++)i.deleteFramebuffer(_.__webglFramebuffer[oe]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let oe=0;oe<_.__webglColorRenderbuffer.length;oe++)_.__webglColorRenderbuffer[oe]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[oe]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let ce=A.textures;for(let oe=0,q=ce.length;oe<q;oe++){let fe=n.get(ce[oe]);fe.__webglTexture&&(i.deleteTexture(fe.__webglTexture),a.memory.textures--),n.remove(ce[oe])}n.remove(A)}let j=0;function re(){j=0}function T(){return j}function X(A){j=A}function he(){let A=j;return A>=s.maxTextures&&Ge("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),j+=1,A}function W(A){let _=[];return _.push(A.wrapS),_.push(A.wrapT),_.push(A.wrapR||0),_.push(A.magFilter),_.push(A.minFilter),_.push(A.anisotropy),_.push(A.internalFormat),_.push(A.format),_.push(A.type),_.push(A.generateMipmaps),_.push(A.mipmapsAutoUpdate),_.push(A.premultiplyAlpha),_.push(A.flipY),_.push(A.unpackAlignment),_.push(A.colorSpace),_.join()}function K(A,_){let G=n.get(A);if(A.isVideoTexture&&bt(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&G.__version!==A.version){let ce=A.image;if(ce===null)Ge("WebGLRenderer: Texture marked for update but no image data found.");else if(ce.complete===!1)Ge("WebGLRenderer: Texture marked for update but image is incomplete");else{rt(G,A,_);return}}else A.isExternalTexture&&(G.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,G.__webglTexture,i.TEXTURE0+_)}function me(A,_){let G=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&G.__version!==A.version){rt(G,A,_);return}else A.isExternalTexture&&(G.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,G.__webglTexture,i.TEXTURE0+_)}function Me(A,_){let G=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&G.__version!==A.version){rt(G,A,_);return}t.bindTexture(i.TEXTURE_3D,G.__webglTexture,i.TEXTURE0+_)}function ee(A,_){let G=n.get(A);if(A.version>0&&G.__version!==A.version){He(G,A,_);return}t.bindTexture(i.TEXTURE_CUBE_MAP,G.__webglTexture,i.TEXTURE0+_)}let te={[ia]:i.REPEAT,[Nn]:i.CLAMP_TO_EDGE,[sa]:i.MIRRORED_REPEAT},Ke={[Gt]:i.NEAREST,[Jc]:i.NEAREST_MIPMAP_NEAREST,[lr]:i.NEAREST_MIPMAP_LINEAR,[nn]:i.LINEAR,[Pa]:i.LINEAR_MIPMAP_NEAREST,[ei]:i.LINEAR_MIPMAP_LINEAR},Te={[Qc]:i.NEVER,[Al]:i.ALWAYS,[eh]:i.LESS,[bl]:i.LEQUAL,[th]:i.EQUAL,[wl]:i.GEQUAL,[nh]:i.GREATER,[ih]:i.NOTEQUAL};function ke(A,_){if(_.type===Mn&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===nn||_.magFilter===Pa||_.magFilter===lr||_.magFilter===ei||_.minFilter===nn||_.minFilter===Pa||_.minFilter===lr||_.minFilter===ei)&&Ge("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,te[_.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,te[_.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,te[_.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,Ke[_.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,Ke[_.minFilter]),_.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,Te[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Gt||_.minFilter!==lr&&_.minFilter!==ei||_.type===Mn&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let G=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function ut(A,_){let G=!1;A.__webglInit===void 0&&(A.__webglInit=!0,_.addEventListener("dispose",I),D(_));let ce=_.source,oe=m.get(ce);oe===void 0&&(oe={},m.set(ce,oe));let q=W(_);if(q!==A.__cacheKey){oe[q]===void 0&&(oe[q]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,G=!0),oe[q].usedTimes++;let fe=oe[A.__cacheKey];fe!==void 0&&(oe[A.__cacheKey].usedTimes--,fe.usedTimes===0&&J(_)),A.__cacheKey=q,A.__webglTexture=oe[q].texture}return G}function Fe(A,_,G){return Math.floor(Math.floor(A/G)/_)}function dt(A,_,G,ce){let q=A.updateRanges;if(q.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,G,ce,_.data);else{q.sort((L,se)=>L.start-se.start);let fe=0;for(let L=1;L<q.length;L++){let se=q[fe],Q=q[L],ye=se.start+se.count,pe=Fe(Q.start,_.width,4),_e=Fe(se.start,_.width,4);Q.start<=ye+1&&pe===_e&&Fe(Q.start+Q.count-1,_.width,4)===pe?se.count=Math.max(se.count,Q.start+Q.count-se.start):(++fe,q[fe]=Q)}q.length=fe+1;let ne=t.getParameter(i.UNPACK_ROW_LENGTH),ie=t.getParameter(i.UNPACK_SKIP_PIXELS),ge=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let L=0,se=q.length;L<se;L++){let Q=q[L],ye=Math.floor(Q.start/4),pe=Math.ceil(Q.count/4),_e=ye%_.width,Pe=Math.floor(ye/_.width),Qe=pe,ue=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,_e),t.pixelStorei(i.UNPACK_SKIP_ROWS,Pe),t.texSubImage2D(i.TEXTURE_2D,0,_e,Pe,Qe,ue,G,ce,_.data)}A.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,ne),t.pixelStorei(i.UNPACK_SKIP_PIXELS,ie),t.pixelStorei(i.UNPACK_SKIP_ROWS,ge)}}function rt(A,_,G){let ce=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(ce=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(ce=i.TEXTURE_3D);let oe=ut(A,_),q=_.source;t.bindTexture(ce,A.__webglTexture,i.TEXTURE0+G);let fe=n.get(q);if(q.version!==fe.__version||oe===!0){if(t.activeTexture(i.TEXTURE0+G),(typeof ImageBitmap!="undefined"&&_.image instanceof ImageBitmap)===!1){let ue=pt.getPrimaries(pt.workingColorSpace),Ue=_.colorSpace===ni?null:pt.getPrimaries(_.colorSpace),Je=_.colorSpace===ni||ue===Ue?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Je)}t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let ie=v(_.image,!1,s.maxTextureSize);ie=De(_,ie);let ge=r.convert(_.format,_.colorSpace),L=r.convert(_.type),se=w(_.internalFormat,ge,L,_.normalized,_.colorSpace,_.isVideoTexture);ke(ce,_);let Q,ye=_.mipmaps,pe=_.isVideoTexture!==!0,_e=fe.__version===void 0||oe===!0,Pe=q.dataReady,Qe=M(_,ie);if(_.isDepthTexture)se=g(_.format===ti,_.type),_e&&(pe?t.texStorage2D(i.TEXTURE_2D,1,se,ie.width,ie.height):t.texImage2D(i.TEXTURE_2D,0,se,ie.width,ie.height,0,ge,L,null));else if(_.isDataTexture)if(ye.length>0){pe&&_e&&t.texStorage2D(i.TEXTURE_2D,Qe,se,ye[0].width,ye[0].height);for(let ue=0,Ue=ye.length;ue<Ue;ue++)Q=ye[ue],pe?Pe&&t.texSubImage2D(i.TEXTURE_2D,ue,0,0,Q.width,Q.height,ge,L,Q.data):t.texImage2D(i.TEXTURE_2D,ue,se,Q.width,Q.height,0,ge,L,Q.data);_.generateMipmaps=!1}else pe?(_e&&t.texStorage2D(i.TEXTURE_2D,Qe,se,ie.width,ie.height),Pe&&dt(_,ie,ge,L)):t.texImage2D(i.TEXTURE_2D,0,se,ie.width,ie.height,0,ge,L,ie.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){pe&&_e&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Qe,se,ye[0].width,ye[0].height,ie.depth);for(let ue=0,Ue=ye.length;ue<Ue;ue++)if(Q=ye[ue],_.format!==In)if(ge!==null)if(pe){if(Pe)if(_.layerUpdates.size>0){let Je=Ll(Q.width,Q.height,_.format,_.type);for(let Se of _.layerUpdates){let _t=Q.data.subarray(Se*Je/Q.data.BYTES_PER_ELEMENT,(Se+1)*Je/Q.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ue,0,0,Se,Q.width,Q.height,1,ge,_t)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ue,0,0,0,Q.width,Q.height,ie.depth,ge,Q.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ue,se,Q.width,Q.height,ie.depth,0,Q.data,0,0);else Ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else pe?Pe&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,ue,0,0,0,Q.width,Q.height,ie.depth,ge,L,Q.data):t.texImage3D(i.TEXTURE_2D_ARRAY,ue,se,Q.width,Q.height,ie.depth,0,ge,L,Q.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{pe&&_e&&t.texStorage2D(i.TEXTURE_2D,Qe,se,ye[0].width,ye[0].height);for(let ue=0,Ue=ye.length;ue<Ue;ue++)Q=ye[ue],_.format!==In?ge!==null?pe?Pe&&t.compressedTexSubImage2D(i.TEXTURE_2D,ue,0,0,Q.width,Q.height,ge,Q.data):t.compressedTexImage2D(i.TEXTURE_2D,ue,se,Q.width,Q.height,0,Q.data):Ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):pe?Pe&&t.texSubImage2D(i.TEXTURE_2D,ue,0,0,Q.width,Q.height,ge,L,Q.data):t.texImage2D(i.TEXTURE_2D,ue,se,Q.width,Q.height,0,ge,L,Q.data)}else if(_.isDataArrayTexture)if(pe){if(_e&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Qe,se,ie.width,ie.height,ie.depth),Pe)if(_.layerUpdates.size>0){let ue=Ll(ie.width,ie.height,_.format,_.type);for(let Ue of _.layerUpdates){let Je=ie.data.subarray(Ue*ue/ie.data.BYTES_PER_ELEMENT,(Ue+1)*ue/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Ue,ie.width,ie.height,1,ge,L,Je)}_.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,ge,L,ie.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,se,ie.width,ie.height,ie.depth,0,ge,L,ie.data);else if(_.isData3DTexture)pe?(_e&&t.texStorage3D(i.TEXTURE_3D,Qe,se,ie.width,ie.height,ie.depth),Pe&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,ge,L,ie.data)):t.texImage3D(i.TEXTURE_3D,0,se,ie.width,ie.height,ie.depth,0,ge,L,ie.data);else if(_.isFramebufferTexture){if(_e)if(pe)t.texStorage2D(i.TEXTURE_2D,Qe,se,ie.width,ie.height);else{let ue=ie.width,Ue=ie.height;for(let Je=0;Je<Qe;Je++)t.texImage2D(i.TEXTURE_2D,Je,se,ue,Ue,0,ge,L,null),ue>>=1,Ue>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let ue=i.canvas;if(ue.hasAttribute("layoutsubtree")||ue.setAttribute("layoutsubtree","true"),ie.parentNode!==ue){ue.appendChild(ie),d.add(_),ue.onpaint=Ue=>{let Je=Ue.changedElements;for(let Se of d)Je.includes(Se.image)&&(Se.needsUpdate=!0)},ue.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,ie);else{let Je=i.RGBA,Se=i.RGBA,_t=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Je,Se,_t,ie)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(ye.length>0){if(pe&&_e){let ue=Be(ye[0]);t.texStorage2D(i.TEXTURE_2D,Qe,se,ue.width,ue.height)}for(let ue=0,Ue=ye.length;ue<Ue;ue++)Q=ye[ue],pe?Pe&&t.texSubImage2D(i.TEXTURE_2D,ue,0,0,ge,L,Q):t.texImage2D(i.TEXTURE_2D,ue,se,ge,L,Q);_.generateMipmaps=!1}else if(pe){if(_e){let ue=Be(ie);t.texStorage2D(i.TEXTURE_2D,Qe,se,ue.width,ue.height)}Pe&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ge,L,ie)}else t.texImage2D(i.TEXTURE_2D,0,se,ge,L,ie);E(_)&&_.mipmapsAutoUpdate===!0&&b(ce),fe.__version=q.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function He(A,_,G){if(_.image.length!==6)return;let ce=ut(A,_),oe=_.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+G);let q=n.get(oe);if(oe.version!==q.__version||ce===!0){t.activeTexture(i.TEXTURE0+G);let fe=pt.getPrimaries(pt.workingColorSpace),ne=_.colorSpace===ni?null:pt.getPrimaries(_.colorSpace),ie=_.colorSpace===ni||fe===ne?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ie);let ge=_.isCompressedTexture||_.image[0].isCompressedTexture,L=_.image[0]&&_.image[0].isDataTexture,se=[];for(let Se=0;Se<6;Se++)!ge&&!L?se[Se]=v(_.image[Se],!0,s.maxCubemapSize):se[Se]=L?_.image[Se].image:_.image[Se],se[Se]=De(_,se[Se]);let Q=se[0],ye=r.convert(_.format,_.colorSpace),pe=r.convert(_.type),_e=w(_.internalFormat,ye,pe,_.normalized,_.colorSpace),Pe=_.isVideoTexture!==!0,Qe=q.__version===void 0||ce===!0,ue=oe.dataReady,Ue=M(_,Q);ke(i.TEXTURE_CUBE_MAP,_);let Je;if(_.isDepthTexture){if(_e=g(_.format===ti,_.type),Qe)if(Pe)t.texStorage2D(i.TEXTURE_CUBE_MAP,1,_e,Q.width,Q.height);else for(let Se=0;Se<6;Se++)t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,_e,Q.width,Q.height,0,ye,pe,null)}else if(ge){Pe&&Qe&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ue,_e,Q.width,Q.height);for(let Se=0;Se<6;Se++){Je=se[Se].mipmaps;for(let _t=0;_t<Je.length;_t++){let Ut=Je[_t];_.format!==In?ye!==null?Pe?ue&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t,0,0,Ut.width,Ut.height,ye,Ut.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t,_e,Ut.width,Ut.height,0,Ut.data):Ge("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Pe?ue&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t,0,0,Ut.width,Ut.height,ye,pe,Ut.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t,_e,Ut.width,Ut.height,0,ye,pe,Ut.data)}}}else{if(Je=_.mipmaps,Pe&&Qe){Je.length>0&&Ue++;let Se=Be(se[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ue,_e,Se.width,Se.height)}for(let Se=0;Se<6;Se++)if(L){Pe?ue&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,0,0,se[Se].width,se[Se].height,ye,pe,se[Se].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,_e,se[Se].width,se[Se].height,0,ye,pe,se[Se].data);for(let _t=0;_t<Je.length;_t++){let qt=Je[_t].image[Se].image;Pe?ue&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t+1,0,0,qt.width,qt.height,ye,pe,qt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t+1,_e,qt.width,qt.height,0,ye,pe,qt.data)}}else{Pe?ue&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,0,0,ye,pe,se[Se]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,0,_e,ye,pe,se[Se]);for(let _t=0;_t<Je.length;_t++){let Ut=Je[_t];Pe?ue&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t+1,0,0,ye,pe,Ut.image[Se]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Se,_t+1,_e,ye,pe,Ut.image[Se])}}}E(_)&&_.mipmapsAutoUpdate===!0&&b(i.TEXTURE_CUBE_MAP),q.__version=oe.version,_.onUpdate&&_.onUpdate(_)}A.__version=_.version}function je(A,_,G,ce,oe,q){let fe=r.convert(G.format,G.colorSpace),ne=r.convert(G.type),ie=w(G.internalFormat,fe,ne,G.normalized,G.colorSpace),ge=n.get(_),L=n.get(G);if(L.__renderTarget=_,!ge.__hasExternalTextures){let se=Math.max(1,_.width>>q),Q=Math.max(1,_.height>>q);oe===i.TEXTURE_3D||oe===i.TEXTURE_2D_ARRAY?t.texImage3D(oe,q,ie,se,Q,_.depth,0,fe,ne,null):t.texImage2D(oe,q,ie,se,Q,0,fe,ne,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),de(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ce,oe,L.__webglTexture,0,nt(_)):(oe===i.TEXTURE_2D||oe>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&oe<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ce,oe,L.__webglTexture,q),t.bindFramebuffer(i.FRAMEBUFFER,null)}function St(A,_,G){if(i.bindRenderbuffer(i.RENDERBUFFER,A),_.depthBuffer){let ce=_.depthTexture,oe=ce&&ce.isDepthTexture?ce.type:null,q=g(_.stencilBuffer,oe),fe=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;de(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt(_),q,_.width,_.height):G?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt(_),q,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,q,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,fe,i.RENDERBUFFER,A)}else{let ce=_.textures;for(let oe=0;oe<ce.length;oe++){let q=ce[oe],fe=r.convert(q.format,q.colorSpace),ne=r.convert(q.type),ie=w(q.internalFormat,fe,ne,q.normalized,q.colorSpace);de(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,nt(_),ie,_.width,_.height):G?i.renderbufferStorageMultisample(i.RENDERBUFFER,nt(_),ie,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,ie,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function qe(A,_,G){let ce=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let oe=n.get(_.depthTexture);oe.__renderTarget=_;let q=ce?_.depthTexture.image[0]:_.depthTexture.image;(!oe.__webglTexture||q.width!==_.width||q.height!==_.height)&&(q.width=_.width,q.height=_.height,_.depthTexture.needsUpdate=!0),ce?ee(_.depthTexture,0):K(_.depthTexture,0);let fe=oe.__webglTexture,ne=nt(_),ie=ce?i.TEXTURE_CUBE_MAP_POSITIVE_X+G:i.TEXTURE_2D,ge=_.depthTexture.format===ti?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===$n)de(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ge,ie,fe,0,ne):i.framebufferTexture2D(i.FRAMEBUFFER,ge,ie,fe,0);else if(_.depthTexture.format===ti)de(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ge,ie,fe,0,ne):i.framebufferTexture2D(i.FRAMEBUFFER,ge,ie,fe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function tt(A){let _=n.get(A),G=A.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==A.depthTexture){let ce=A.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),ce){let oe=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,ce.removeEventListener("dispose",oe)};ce.addEventListener("dispose",oe),_.__depthDisposeCallback=oe}_.__boundDepthTexture=ce}if(A.depthTexture&&!_.__autoAllocateDepthBuffer)if(G)for(let ce=0;ce<6;ce++)qe(_.__webglFramebuffer[ce],A,ce);else A.texture.mipmaps.length>0?qe(_.__webglFramebuffer[0],A,0):qe(_.__webglFramebuffer,A,0);else if(G){_.__webglDepthbuffer=[];for(let ce=0;ce<6;ce++)if(t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[ce]),_.__webglDepthbuffer[ce]===void 0)_.__webglDepthbuffer[ce]=i.createRenderbuffer(),St(_.__webglDepthbuffer[ce],A,!1);else{let oe=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,q=_.__webglDepthbuffer[ce];i.bindRenderbuffer(i.RENDERBUFFER,q),i.framebufferRenderbuffer(i.FRAMEBUFFER,oe,i.RENDERBUFFER,q)}}else if(A.texture.mipmaps.length>0?t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),St(_.__webglDepthbuffer,A,!1);else{let oe=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,q=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,q),i.framebufferRenderbuffer(i.FRAMEBUFFER,oe,i.RENDERBUFFER,q)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Oe(A,_,G){let ce=n.get(A);_!==void 0&&je(ce.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),G!==void 0&&tt(A)}function st(A){let _=A.texture,G=n.get(A),ce=n.get(_);A.addEventListener("dispose",N),D(A);let oe=A.textures,q=A.isWebGLCubeRenderTarget===!0,fe=oe.length>1;if(fe||(ce.__webglTexture===void 0&&(ce.__webglTexture=i.createTexture()),ce.__version=_.version,a.memory.textures++),q){G.__webglFramebuffer=[];for(let ne=0;ne<6;ne++)if(_.mipmaps.length>0){G.__webglFramebuffer[ne]=[];for(let ie=0;ie<_.mipmaps.length;ie++)G.__webglFramebuffer[ne][ie]=i.createFramebuffer()}else G.__webglFramebuffer[ne]=i.createFramebuffer()}else{if(_.mipmaps.length>0){G.__webglFramebuffer=[];for(let ne=0;ne<_.mipmaps.length;ne++)G.__webglFramebuffer[ne]=i.createFramebuffer()}else G.__webglFramebuffer=i.createFramebuffer();if(fe)for(let ne=0,ie=oe.length;ne<ie;ne++){let ge=n.get(oe[ne]);ge.__webglTexture===void 0&&(ge.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&de(A)===!1){G.__webglMultisampledFramebuffer=i.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let ne=0;ne<oe.length;ne++){let ie=oe[ne];G.__webglColorRenderbuffer[ne]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,G.__webglColorRenderbuffer[ne]);let ge=r.convert(ie.format,ie.colorSpace),L=r.convert(ie.type),se=w(ie.internalFormat,ge,L,ie.normalized,ie.colorSpace,A.isXRRenderTarget===!0),Q=nt(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,Q,se,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ne,i.RENDERBUFFER,G.__webglColorRenderbuffer[ne])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(G.__webglDepthRenderbuffer=i.createRenderbuffer(),St(G.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(q){t.bindTexture(i.TEXTURE_CUBE_MAP,ce.__webglTexture),ke(i.TEXTURE_CUBE_MAP,_);for(let ne=0;ne<6;ne++)if(_.mipmaps.length>0)for(let ie=0;ie<_.mipmaps.length;ie++)je(G.__webglFramebuffer[ne][ie],A,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,ie);else je(G.__webglFramebuffer[ne],A,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ne,0);E(_)?b(i.TEXTURE_CUBE_MAP):_.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,_.mipmaps.length-1),t.unbindTexture()}else if(fe){for(let ne=0,ie=oe.length;ne<ie;ne++){let ge=oe[ne],L=n.get(ge),se=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(se=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(se,L.__webglTexture),ke(se,ge),je(G.__webglFramebuffer,A,ge,i.COLOR_ATTACHMENT0+ne,se,0),E(ge)&&b(se)}t.unbindTexture()}else{let ne=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(ne=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ne,ce.__webglTexture),ke(ne,_),_.mipmaps.length>0)for(let ie=0;ie<_.mipmaps.length;ie++)je(G.__webglFramebuffer[ie],A,_,i.COLOR_ATTACHMENT0,ne,ie);else je(G.__webglFramebuffer,A,_,i.COLOR_ATTACHMENT0,ne,0);E(_)?b(ne):_.mipmaps.length>0&&i.texParameteri(ne,i.TEXTURE_MAX_LEVEL,_.mipmaps.length-1),t.unbindTexture()}A.depthBuffer&&tt(A)}function F(A){let _=A.textures;for(let G=0,ce=_.length;G<ce;G++){let oe=_[G];if(E(oe)&&oe.mipmapsAutoUpdate===!0){let q=R(A),fe=n.get(oe).__webglTexture;t.bindTexture(q,fe),b(q),t.unbindTexture()}}}let Nt=[];function ze(A){if(A.samples>0){if(de(A)===!1){let _=A.textures,G=A.width,ce=A.height,oe=i.COLOR_BUFFER_BIT,q=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,fe=n.get(A),ne=_.length>1;if(ne)for(let ge=0;ge<_.length;ge++)t.bindFramebuffer(i.FRAMEBUFFER,fe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,fe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,fe.__webglMultisampledFramebuffer),A.texture.mipmaps.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,fe.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,fe.__webglFramebuffer);for(let ge=0;ge<_.length;ge++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(oe|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(oe|=i.STENCIL_BUFFER_BIT)),ne){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,fe.__webglColorRenderbuffer[ge]);let L=n.get(_[ge]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,L,0)}i.blitFramebuffer(0,0,G,ce,0,0,G,ce,oe,i.NEAREST),l===!0&&(Nt.length=0,Nt.push(i.COLOR_ATTACHMENT0+ge),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&Nt.push(q),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Nt))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ne)for(let ge=0;ge<_.length;ge++){t.bindFramebuffer(i.FRAMEBUFFER,fe.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.RENDERBUFFER,fe.__webglColorRenderbuffer[ge]);let L=n.get(_[ge]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,fe.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ge,i.TEXTURE_2D,L,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,fe.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&l){let _=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function nt(A){return Math.min(s.maxSamples,A.samples)}function de(A){let _=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function bt(A){let _=a.render.frame;u.get(A)!==_&&(u.set(A,_),A.update())}function De(A,_){let G=A.colorSpace,ce=A.format,oe=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||G!==Ls&&G!==ni&&(pt.getTransfer(G)===vt?(ce!==In||oe!==ln)&&Ge("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Xe("WebGLTextures: Unsupported texture color space:",G)),_}function Be(A){return typeof HTMLImageElement!="undefined"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame!="undefined"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=he,this.resetTextureUnits=re,this.getTextureUnits=T,this.setTextureUnits=X,this.setTexture2D=K,this.setTexture2DArray=me,this.setTexture3D=Me,this.setTextureCube=ee,this.rebindTextures=Oe,this.setupRenderTarget=st,this.updateRenderTargetMipmap=F,this.updateMultisampleRenderTarget=ze,this.setupDepthRenderbuffer=tt,this.setupFrameBufferTexture=je,this.useMultisampledRTT=de,this.dispose=Y}function M0(i,e){function t(n,s=ni){let r,a=pt.getTransfer(s);if(n===ln)return i.UNSIGNED_BYTE;if(n===La)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Da)return i.UNSIGNED_SHORT_5_5_5_1;if(n===vl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===yl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===_l)return i.BYTE;if(n===xl)return i.SHORT;if(n===ds)return i.UNSIGNED_SHORT;if(n===Ia)return i.INT;if(n===Rn)return i.UNSIGNED_INT;if(n===Mn)return i.FLOAT;if(n===Pn)return i.HALF_FLOAT;if(n===Ml)return i.ALPHA;if(n===Sl)return i.RGB;if(n===In)return i.RGBA;if(n===$n)return i.DEPTH_COMPONENT;if(n===ti)return i.DEPTH_STENCIL;if(n===fs)return i.RED;if(n===Na)return i.RED_INTEGER;if(n===vi)return i.RG;if(n===Ua)return i.RG_INTEGER;if(n===Fa)return i.RGBA_INTEGER;if(n===cr||n===hr||n===ur||n===dr)if(a===vt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===cr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===cr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Oa||n===Ba||n===za||n===ka)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Oa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ba)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===za)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ka)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ga||n===Va||n===Ha||n===Wa||n===Xa||n===fr||n===qa)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ga||n===Va)return a===vt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ha)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Wa)return r.COMPRESSED_R11_EAC;if(n===Xa)return r.COMPRESSED_SIGNED_R11_EAC;if(n===fr)return r.COMPRESSED_RG11_EAC;if(n===qa)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ya||n===Za||n===Ja||n===$a||n===Ka||n===ja||n===Qa||n===eo||n===to||n===no||n===io||n===so||n===ro||n===ao)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ya)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Za)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ja)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===$a)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ka)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ja)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Qa)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===eo)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===to)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===no)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===io)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===so)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ro)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ao)return a===vt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===oo||n===lo||n===co)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===oo)return a===vt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===lo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===co)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===ho||n===uo||n===pr||n===fo)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===ho)return r.COMPRESSED_RED_RGTC1_EXT;if(n===uo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===pr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===fo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ii?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var S0=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,b0=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,ql=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new qs(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new rn({vertexShader:S0,fragmentShader:b0,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Tt(new zn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Yl=class extends Un{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,d=null,h=null,m=null,x=null,S=typeof XRWebGLBinding!="undefined",f=new ql,p={},v=t.getContextAttributes(),E=null,b=null,R=[],w=[],g=new $e,M=null,D=null,C=new tn;C.viewport=new Rt;let I=new tn;I.viewport=new Rt;let N=[C,I],k=new Ta,P=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let K=R[W];return K===void 0&&(K=new ns,R[W]=K),K.getTargetRaySpace()},this.getControllerGrip=function(W){let K=R[W];return K===void 0&&(K=new ns,R[W]=K),K.getGripSpace()},this.getHand=function(W){let K=R[W];return K===void 0&&(K=new ns,R[W]=K),K.getHandSpace()};function $(W){let K=w.indexOf(W.inputSource);if(K===-1)return;let me=R[K];me!==void 0&&(me.update(W.inputSource,W.frame,c||a),me.dispatchEvent({type:W.type,data:W.inputSource}))}function J(){s.removeEventListener("select",$),s.removeEventListener("selectstart",$),s.removeEventListener("selectend",$),s.removeEventListener("squeeze",$),s.removeEventListener("squeezestart",$),s.removeEventListener("squeezeend",$),s.removeEventListener("end",J),s.removeEventListener("inputsourceschange",le);for(let W=0;W<R.length;W++){let K=w[W];K!==null&&(w[W]=null,R[W].disconnect(K))}P=null,Y=null,f.reset();for(let W in p)delete p[W];if(e.setRenderTarget(E),m=null,h=null,d=null,s=null,b=null,he.stop(),n.isPresenting=!1,e.setPixelRatio(M),e.setSize(g.width,g.height,!1),D!==null){let W=D.camera;W.fov=D.fov,W.zoom=D.zoom,W.updateProjectionMatrix(),D=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&Ge("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){o=W,n.isPresenting===!0&&Ge("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return d===null&&S&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return x},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(E=e.getRenderTarget(),s.addEventListener("select",$),s.addEventListener("selectstart",$),s.addEventListener("selectend",$),s.addEventListener("squeeze",$),s.addEventListener("squeezestart",$),s.addEventListener("squeezeend",$),s.addEventListener("end",J),s.addEventListener("inputsourceschange",le),v.xrCompatible!==!0&&await t.makeXRCompatible(),M=e.getPixelRatio(),e.getSize(g),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let me=null,Me=null,ee=null;v.depth&&(ee=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,me=v.stencil?ti:$n,Me=v.stencil?Ii:Rn);let te={colorFormat:t.RGBA8,depthFormat:ee,scaleFactor:r};d=this.getBinding(),h=d.createProjectionLayer(te),s.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),b=new mn(h.textureWidth,h.textureHeight,{format:In,type:ln,depthTexture:new Qn(h.textureWidth,h.textureHeight,Me,void 0,void 0,void 0,void 0,void 0,void 0,me),stencilBuffer:v.stencil,colorSpace:e.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let me={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,me),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),b=new mn(m.framebufferWidth,m.framebufferHeight,{format:In,type:ln,colorSpace:e.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1,storeMultisampledDepthBuffer:m.ignoreDepthValues===!1,storeMultisampledStencilBuffer:m.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),he.setContext(s),he.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return f.getDepthTexture()};function le(W){for(let K=0;K<W.removed.length;K++){let me=W.removed[K],Me=w.indexOf(me);Me>=0&&(w[Me]=null,R[Me].disconnect(me))}for(let K=0;K<W.added.length;K++){let me=W.added[K],Me=w.indexOf(me);if(Me===-1){for(let te=0;te<R.length;te++)if(te>=w.length){w.push(me),Me=te;break}else if(w[te]===null){w[te]=me,Me=te;break}if(Me===-1)break}let ee=R[Me];ee&&ee.connect(me)}}function j(W,K){K===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(K.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;let K=W.near,me=W.far;f.texture!==null&&(f.depthNear>0&&(K=f.depthNear),f.depthFar>0&&(me=f.depthFar)),k.near=I.near=C.near=K,k.far=I.far=C.far=me,(P!==k.near||Y!==k.far)&&(s.updateRenderState({depthNear:k.near,depthFar:k.far}),P=k.near,Y=k.far),k.layers.mask=W.layers.mask|6,C.layers.mask=k.layers.mask&-5,I.layers.mask=k.layers.mask&-3;let Me=W.parent,ee=k.cameras;j(k,Me);for(let te=0;te<ee.length;te++)j(ee[te],Me);k.projectionMatrix.copy(C.projectionMatrix),k.projectionMatrixInverse.copy(C.projectionMatrixInverse),D===null&&W.isPerspectiveCamera&&(D={camera:W,fov:W.fov,zoom:W.zoom}),re(W,k,Me)};function re(W,K,me){me===null?W.matrix.copy(K.matrixWorld):(W.matrix.copy(me.matrixWorld),W.matrix.invert(),W.matrix.multiply(K.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(K.projectionMatrix),W.projectionMatrixInverse.copy(K.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=aa*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return k},this.getFoveation=function(){if(!(h===null&&m===null))return l},this.setFoveation=function(W){l=W,h!==null&&(h.fixedFoveation=W),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=W)},this.hasDepthSensing=function(){return f.texture!==null},this.getDepthSensingMesh=function(){return f.getMesh(k)},this.getCameraTexture=function(W){return p[W]};let T=null;function X(W,K){if(u=K.getViewerPose(c||a),x=K,u!==null){let me=u.views;m!==null&&(e.setRenderTargetFramebuffer(b,m.framebuffer),e.setRenderTarget(b));let Me=!1;me.length!==k.cameras.length&&(k.cameras.length=0,Me=!0);for(let Te=0;Te<me.length;Te++){let ke=me[Te],ut=null;if(m!==null)ut=m.getViewport(ke);else{let dt=d.getViewSubImage(h,ke);ut=dt.viewport,Te===0&&(e.setRenderTargetTextures(b,dt.colorTexture,dt.depthStencilTexture),e.setRenderTarget(b))}let Fe=N[Te];Fe===void 0&&(Fe=new tn,Fe.layers.enable(Te),Fe.viewport=new Rt,N[Te]=Fe),Fe.matrix.fromArray(ke.transform.matrix),Fe.matrix.decompose(Fe.position,Fe.quaternion,Fe.scale),Fe.projectionMatrix.fromArray(ke.projectionMatrix),Fe.projectionMatrixInverse.copy(Fe.projectionMatrix).invert(),Fe.viewport.set(ut.x,ut.y,ut.width,ut.height),Te===0&&(k.matrix.copy(Fe.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale)),Me===!0&&k.cameras.push(Fe)}let ee=s.enabledFeatures;if(ee&&ee.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){d=n.getBinding();let Te=d.getDepthInformation(me[0]);Te&&Te.isValid&&Te.texture&&f.init(Te,s.renderState)}if(ee&&ee.includes("camera-access")&&S){e.state.unbindTexture(),d=n.getBinding();for(let Te=0;Te<me.length;Te++){let ke=me[Te].camera;if(ke){let ut=p[ke];ut||(ut=new qs,p[ke]=ut);let Fe=d.getCameraImage(ke);ut.sourceTexture=Fe}}}}for(let me=0;me<R.length;me++){let Me=w[me],ee=R[me];Me!==null&&ee!==void 0&&ee.update(Me,K,c||a)}T&&T(W,K),K.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:K}),x=null}let he=new Uh;he.setAnimationLoop(X),this.setAnimationLoop=function(W){T=W},this.dispose=function(){}}},w0=new yt,Xh=new Ze;Xh.set(-1,0,0,0,1,0,0,0,1);function A0(i,e){function t(f,p){f.matrixAutoUpdate===!0&&f.updateMatrix(),p.value.copy(f.matrix)}function n(f,p){p.color.getRGB(f.fogColor.value,Rl(i)),p.isFog?(f.fogNear.value=p.near,f.fogFar.value=p.far):p.isFogExp2&&(f.fogDensity.value=p.density)}function s(f,p,v,E,b){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(f,p):p.isMeshLambertMaterial?(r(f,p),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(f,p),d(f,p)):p.isMeshPhongMaterial?(r(f,p),u(f,p),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(f,p),h(f,p),p.isMeshPhysicalMaterial&&m(f,p,b)):p.isMeshMatcapMaterial?(r(f,p),x(f,p)):p.isMeshDepthMaterial?r(f,p):p.isMeshDistanceMaterial?(r(f,p),S(f,p)):p.isMeshNormalMaterial?r(f,p):p.isLineBasicMaterial?(a(f,p),p.isLineDashedMaterial&&o(f,p)):p.isPointsMaterial?l(f,p,v,E):p.isSpriteMaterial?c(f,p):p.isShadowMaterial?(f.color.value.copy(p.color),f.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(f,p){f.opacity.value=p.opacity,p.color&&f.diffuse.value.copy(p.color),p.emissive&&f.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.bumpMap&&(f.bumpMap.value=p.bumpMap,t(p.bumpMap,f.bumpMapTransform),f.bumpScale.value=p.bumpScale,p.side===Ht&&(f.bumpScale.value*=-1)),p.normalMap&&(f.normalMap.value=p.normalMap,t(p.normalMap,f.normalMapTransform),f.normalScale.value.copy(p.normalScale),p.side===Ht&&f.normalScale.value.negate()),p.displacementMap&&(f.displacementMap.value=p.displacementMap,t(p.displacementMap,f.displacementMapTransform),f.displacementScale.value=p.displacementScale,f.displacementBias.value=p.displacementBias),p.emissiveMap&&(f.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,f.emissiveMapTransform)),p.specularMap&&(f.specularMap.value=p.specularMap,t(p.specularMap,f.specularMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest);let v=e.get(p),E=v.envMap,b=v.envMapRotation;E&&(f.envMap.value=E,f.envMapRotation.value.setFromMatrix4(w0.makeRotationFromEuler(b)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&f.envMapRotation.value.premultiply(Xh),f.reflectivity.value=p.reflectivity,f.ior.value=p.ior,f.refractionRatio.value=p.refractionRatio),p.lightMap&&(f.lightMap.value=p.lightMap,f.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,f.lightMapTransform)),p.aoMap&&(f.aoMap.value=p.aoMap,f.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,f.aoMapTransform))}function a(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform))}function o(f,p){f.dashSize.value=p.dashSize,f.totalSize.value=p.dashSize+p.gapSize,f.scale.value=p.scale}function l(f,p,v,E){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.size.value=p.size*v,f.scale.value=E*.5,p.map&&(f.map.value=p.map,t(p.map,f.uvTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function c(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.rotation.value=p.rotation,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function u(f,p){f.specular.value.copy(p.specular),f.shininess.value=Math.max(p.shininess,1e-4)}function d(f,p){p.gradientMap&&(f.gradientMap.value=p.gradientMap)}function h(f,p){f.metalness.value=p.metalness,p.metalnessMap&&(f.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,f.metalnessMapTransform)),f.roughness.value=p.roughness,p.roughnessMap&&(f.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,f.roughnessMapTransform)),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)}function m(f,p,v){f.ior.value=p.ior,p.diffuseRoughness>0&&(f.diffuseRoughness.value=p.diffuseRoughness,p.diffuseRoughnessMap&&(f.diffuseRoughnessMap.value=p.diffuseRoughnessMap,t(p.diffuseRoughnessMap,f.diffuseRoughnessMapTransform))),p.sheen>0&&(f.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),f.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(f.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,f.sheenColorMapTransform)),p.sheenRoughnessMap&&(f.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,f.sheenRoughnessMapTransform))),p.clearcoat>0&&(f.clearcoat.value=p.clearcoat,f.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(f.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,f.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(f.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ht&&f.clearcoatNormalScale.value.negate())),p.dispersion>0&&(f.dispersion.value=p.dispersion),p.retroreflectivity>0&&(f.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(f.iridescence.value=p.iridescence,f.iridescenceIOR.value=p.iridescenceIOR,f.iridescenceThicknessMinimum.value=p.iridescenceThicknessMinimum,f.iridescenceThicknessMaximum.value=p.iridescenceThicknessMaximum,p.iridescenceMap&&(f.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,f.iridescenceMapTransform)),p.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),p.transmission>0&&(f.transmission.value=p.transmission,f.transmissionSamplerMap.value=v.texture,f.transmissionSamplerSize.value.set(v.width,v.height),p.transmissionMap&&(f.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,f.transmissionMapTransform)),f.thickness.value=p.thickness,p.thicknessMap&&(f.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=p.attenuationDistance,f.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(f.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(f.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=p.specularIntensity,f.specularColor.value.copy(p.specularColor),p.specularColorMap&&(f.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,f.specularColorMapTransform)),p.specularIntensityMap&&(f.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,f.specularIntensityMapTransform))}function x(f,p){p.matcap&&(f.matcap.value=p.matcap)}function S(f,p){let v=e.get(p).light;f.referencePosition.value.setFromMatrixPosition(v.matrixWorld),f.nearDistance.value=v.shadow.camera.near,f.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function T0(i,e,t,n){let s={},r={};function a(v,E){let b=E.program;n.uniformBlockBinding(v,b,s[v.id])}function o(v,E){let b=s[v.id];b===void 0&&(x(v),b=l(v),s[v.id]=b,v.addEventListener("dispose",f));let R=E.program;n.updateUBOMapping(v,R);let w=e.render.frame;r[v.id]!==w&&(c(v),r[v.id]=w)}function l(v){let E=i.createBuffer(),b=v.__size,R=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,b,R),i.bindBuffer(i.UNIFORM_BUFFER,null),E}function c(v){let E=s[v.id],b=v.uniforms,R=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,E);for(let w=0,g=b.length;w<g;w++){let M=b[w];if(Array.isArray(M))for(let D=0,C=M.length;D<C;D++)u(M[D],w,D,R);else u(M,w,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(v,E,b,R){if(h(v,E,b,R)===!0){let w=v.__offset,g=v.value;if(Array.isArray(g)){let M=0;for(let D=0;D<g.length;D++){let C=g[D],I=S(C,!0);d(C,v.__data,M),M+=I.storage/Float32Array.BYTES_PER_ELEMENT}}else d(g,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,w,v.__data)}}function d(v,E,b){typeof v=="number"||typeof v=="boolean"?E[b]=v:v.isMatrix3?(E[b]=v.elements[0],E[b+1]=v.elements[1],E[b+2]=v.elements[2],E[b+3]=0,E[b+4]=v.elements[3],E[b+5]=v.elements[4],E[b+6]=v.elements[5],E[b+7]=0,E[b+8]=v.elements[6],E[b+9]=v.elements[7],E[b+10]=v.elements[8],E[b+11]=0):ArrayBuffer.isView(v)?E.set(v.subarray(0,E.length-b),b):v.toArray(E,b)}function h(v,E,b,R){let w=v.value,g=E+"_"+b;if(Array.isArray(w)){R[g]===void 0&&(R[g]=[]);let M=R[g],D=!1;for(let C=0;C<w.length;C++)m(w[C],M,C)===!0&&(D=!0);return D}return m(w,R,g)}function m(v,E,b){if(E[b]===void 0)return typeof v=="number"||typeof v=="boolean"?E[b]=v:ArrayBuffer.isView(v)?E[b]=v.slice():E[b]=v.clone(),!0;{let R=E[b];if(typeof v=="number"||typeof v=="boolean"){if(R!==v)return E[b]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(R.equals(v)===!1)return R.copy(v),!0}}return!1}function x(v){let E=v.uniforms,b=0,R=16;for(let g=0,M=E.length;g<M;g++){let D=Array.isArray(E[g])?E[g]:[E[g]];for(let C=0,I=D.length;C<I;C++){let N=D[C],k=Array.isArray(N.value)?N.value:[N.value],P=Array.isArray(E[g])||Array.isArray(N.value),Y=b;for(let J=0,le=k.length;J<le;J++){let j=k[J],re=S(j,P),T=b%R,X=T%re.boundary,he=T+X;b+=X,he!==0&&R-he<re.storage&&(b+=R-he),J===0&&(Y=b),b+=re.storage}let $=N.type==="int"?Int32Array:N.type==="uint"?Uint32Array:Float32Array;N.__data=new $((b-Y)/Float32Array.BYTES_PER_ELEMENT),N.__offset=Y}}let w=b%R;return w>0&&(b+=R-w),v.__size=b,v.__cache={},this}function S(v,E){let b={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(b.boundary=4,b.storage=4):v.isVector2?(b.boundary=8,b.storage=8):v.isVector3||v.isColor?(b.boundary=16,b.storage=12):v.isVector4?(b.boundary=16,b.storage=16):v.isMatrix3?(b.boundary=16,b.storage=48):v.isMatrix4?(b.boundary=16,b.storage=64):v.isTexture?Ge("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(b.boundary=16,b.storage=v.byteLength):Ge("WebGLRenderer: Unsupported uniform value type.",v),E===!0&&(b.boundary=16,b.storage=Math.ceil(b.storage/16)*16),b}function f(v){let E=v.target;E.removeEventListener("dispose",f),i.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function p(){for(let v in s)i.deleteBuffer(s[v]);s={},r={}}return{bind:a,update:o,dispose:p}}var E0=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Gn=null;function C0(){return Gn===null&&(Gn=new Ei(E0,16,16,vi,Pn),Gn.name="DFG_LUT",Gn.minFilter=nn,Gn.magFilter=nn,Gn.wrapS=Nn,Gn.wrapT=Nn,Gn.generateMipmaps=!1,Gn.needsUpdate=!0),Gn}var xo=class{constructor(e={}){let{canvas:t=rh(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1,outputBufferType:m=ln}=e;this.isWebGLRenderer=!0;let x;if(n!==null){if(typeof WebGLRenderingContext!="undefined"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");x=n.getContextAttributes().alpha}else x=a;let S=m,f=new Set([Fa,Ua,Na]),p=new Set([ln,Rn,ds,Ii,La,Da]),v=new Uint32Array(4),E=new Int32Array(4),b={textures:[],min:[],max:[],resolution:[]},R=null,w=null,g=[],M=[],D=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=kn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let C=this,I=!1,N=null,k=null,P=null,Y=null;this._outputColorSpace=en;let $=0,J=0,le=null,j=-1,re=null,T=new Rt,X=new Rt,he=null,W=new et(0),K=0,me=t.width,Me=t.height,ee=1,te=null,Ke=null,Te=new Rt(0,0,me,Me),ke=new Rt(0,0,me,Me),ut=!1,Fe=new di,dt=new ha,rt=!1,He=!1,je=new yt,St=new z,qe=new Rt,tt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Oe=!1;function st(){return le===null?ee:1}let F=n;function Nt(y,U){return t.getContext(y,U)}let ze,nt,de,bt,De,Be,A,_,G,ce,oe,q,fe,ne,ie,ge,L,se,Q,ye,pe,_e,Pe;try{let y={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"187"}`),t.addEventListener("webglcontextlost",Ue,!1),t.addEventListener("webglcontextrestored",Je,!1),t.addEventListener("webglcontextcreationerror",Se,!1),F===null){let U="webgl2";if(F=Nt(U,y),F===null)throw Nt(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Qe()}catch(y){throw t.removeEventListener("webglcontextlost",Ue,!1),t.removeEventListener("webglcontextrestored",Je,!1),t.removeEventListener("webglcontextcreationerror",Se,!1),Xe("WebGLRenderer: "+y.message),y}function Qe(){ze=new zp(F),ze.init(),pe=new M0(F,ze),nt=new Cp(F,ze,e,pe),de=new v0(F,ze),nt.reversedDepthBuffer&&h&&de.buffers.depth.setReversed(!0),k=F.createFramebuffer(),P=F.createFramebuffer(),Y=F.createFramebuffer(),bt=new Vp(F),De=new r0,Be=new y0(F,ze,de,De,nt,pe,bt),A=new Bp(C),_=new Hu(F),_e=new Tp(F,_),G=new kp(F,_,bt,_e),ce=new Wp(F,G,_,_e,bt),se=new Hp(F,nt,Be),ie=new Rp(De),oe=new s0(C,A,ze,nt,_e,ie),q=new A0(C,De),fe=new o0,ne=new f0(ze),L=new Ap(C,A,de,ce,x,l),ge=new x0(C,ce,nt),Pe=new T0(F,bt,nt,de),Q=new Ep(F,ze,bt),ye=new Gp(F,ze,bt),bt.programs=oe.programs,C.capabilities=nt,C.extensions=ze,C.properties=De,C.renderLists=fe,C.shadowMap=ge,C.state=de,C.info=bt}S!==ln&&(D=new qp(S,t.width,t.height,o,s,r));let ue=new Yl(C,F);this.xr=ue,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let y=ze.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){let y=ze.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return ee},this.setPixelRatio=function(y){y!==void 0&&(ee=y,this.setSize(me,Me,!1))},this.getSize=function(y){return y.set(me,Me)},this.setSize=function(y,U,Z=!0){if(ue.isPresenting){Ge("WebGLRenderer: Can't change size while VR device is presenting.");return}me=y,Me=U,t.width=Math.floor(y*ee),t.height=Math.floor(U*ee),Z===!0&&(t.style.width=y+"px",t.style.height=U+"px"),D!==null&&D.setSize(t.width,t.height),this.setViewport(0,0,y,U)},this.getDrawingBufferSize=function(y){return y.set(me*ee,Me*ee).floor()},this.setDrawingBufferSize=function(y,U,Z){me=y,Me=U,ee=Z,t.width=Math.floor(y*Z),t.height=Math.floor(U*Z),this.setViewport(0,0,y,U)},this.setEffects=function(y){if(S===ln){Xe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let U=0;U<y.length;U++)if(y[U].isOutputPass===!0){Ge("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}D.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(T)},this.getViewport=function(y){return y.copy(Te)},this.setViewport=function(y,U,Z,H){y.isVector4?Te.set(y.x,y.y,y.z,y.w):Te.set(y,U,Z,H),de.viewport(T.copy(Te).multiplyScalar(st()).round())},this.getScissor=function(y){return y.copy(ke)},this.setScissor=function(y,U,Z,H){y.isVector4?ke.set(y.x,y.y,y.z,y.w):ke.set(y,U,Z,H),de.scissor(X.copy(ke).multiplyScalar(st()).round())},this.getScissorTest=function(){return ut},this.setScissorTest=function(y){de.setScissorTest(ut=y)},this.setOpaqueSort=function(y){te=y},this.setTransparentSort=function(y){Ke=y},this.getClearColor=function(y){return y.copy(L.getClearColor())},this.setClearColor=function(){L.setClearColor(...arguments)},this.getClearAlpha=function(){return L.getClearAlpha()},this.setClearAlpha=function(){L.setClearAlpha(...arguments)},this.clear=function(y=!0,U=!0,Z=!0){let H=0;if(y){let V=!1;if(le!==null){let xe=le.texture.format;V=f.has(xe)}if(V){let xe=le.texture.type,Ee=p.has(xe),ve=L.getClearColor(),we=L.getClearAlpha(),Ce=ve.r,Ye=ve.g,ct=ve.b;Ee?(v[0]=Ce,v[1]=Ye,v[2]=ct,v[3]=we,F.clearBufferuiv(F.COLOR,0,v)):(E[0]=Ce,E[1]=Ye,E[2]=ct,E[3]=we,F.clearBufferiv(F.COLOR,0,E))}else H|=F.COLOR_BUFFER_BIT}U&&(H|=F.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Z&&(H|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H!==0&&F.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),N=y},this.dispose=function(){t.removeEventListener("webglcontextlost",Ue,!1),t.removeEventListener("webglcontextrestored",Je,!1),t.removeEventListener("webglcontextcreationerror",Se,!1),L.dispose(),fe.dispose(),ne.dispose(),Be.dispose(),De.dispose(),A.dispose(),ce.dispose(),G.dispose(),_e.dispose(),Pe.dispose(),oe.dispose(),ue.dispose(),ue.removeEventListener("sessionstart",xs),ue.removeEventListener("sessionend",vs),bn.stop()};function Ue(y){y.preventDefault(),El("WebGLRenderer: Context Lost."),I=!0}function Je(){El("WebGLRenderer: Context Restored."),I=!1;let y=bt.autoReset,U=ge.enabled,Z=ge.autoUpdate,H=ge.needsUpdate,V=ge.type;Qe(),bt.autoReset=y,ge.enabled=U,ge.autoUpdate=Z,ge.needsUpdate=H,ge.type=V}function Se(y){Xe("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function _t(y){let U=y.target;U.removeEventListener("dispose",_t),Ut(U)}function Ut(y){qt(y),De.remove(y)}function qt(y){let U=De.get(y).programs;U!==void 0&&(U.forEach(function(Z){oe.releaseProgram(Z)}),y.isShaderMaterial&&oe.releaseShaderCache(y))}this.renderBufferDirect=function(y,U,Z,H,V,xe){U===null&&(U=tt);let Ee=V.isMesh&&V.matrixWorld.determinantAffine()<0,ve=be(y,U,Z,H,V);de.setMaterial(H,Ee);let we=Z.index,Ce=1;if(H.wireframe===!0){if(we=G.getWireframeAttribute(Z),we===void 0)return;Ce=2}let Ye=Z.drawRange,ct=Z.attributes.position,Ie=Ye.start*Ce,ht=(Ye.start+Ye.count)*Ce;xe!==null&&(Ie=Math.max(Ie,xe.start*Ce),ht=Math.min(ht,(xe.start+xe.count)*Ce)),we!==null?(Ie=Math.max(Ie,0),ht=Math.min(ht,we.count)):ct!=null&&(Ie=Math.max(Ie,0),ht=Math.min(ht,ct.count));let Ft=ht-Ie;if(Ft<0||Ft===1/0)return;_e.setup(V,H,ve,Z,we);let wt,Mt=Q;if(we!==null&&(wt=_.get(we),Mt=ye,Mt.setIndex(wt)),V.isMesh)H.wireframe===!0?(de.setLineWidth(H.wireframeLinewidth*st()),Mt.setMode(F.LINES)):Mt.setMode(F.TRIANGLES);else if(V.isLine){let Yt=H.linewidth;Yt===void 0&&(Yt=1),de.setLineWidth(Yt*st()),V.isLineSegments?Mt.setMode(F.LINES):V.isLineLoop?Mt.setMode(F.LINE_LOOP):Mt.setMode(F.LINE_STRIP)}else V.isPoints?Mt.setMode(F.POINTS):V.isSprite&&Mt.setMode(F.TRIANGLES);if(V.isBatchedMesh)if(ze.get("WEBGL_multi_draw"))Mt.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let Yt=V._multiDrawStarts,Re=V._multiDrawCounts,Ot=V._multiDrawCount,ft=we?_.get(we).bytesPerElement:1,hn=De.get(H).currentProgram.getUniforms();for(let Zt=0;Zt<Ot;Zt++)hn.setValue(F,"_gl_DrawID",Zt),Mt.render(Yt[Zt]/ft,Re[Zt])}else if(V.isInstancedMesh)Mt.renderInstances(Ie,Ft,V.count);else if(Z.isInstancedBufferGeometry){let Yt=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,Re=Math.min(Z.instanceCount,Yt);Mt.renderInstances(Ie,Ft,Re)}else Mt.render(Ie,Ft)};function _s(y,U,Z,H){N!==null&&y.isNodeMaterial&&N.setObject(H,y),rt===!0&&ie.setState(y,Z,!1),y.transparent===!0&&y.side===yn&&y.forceSinglePass===!1?(y.side=Ht,y.needsUpdate=!0,ri(y,U,H),y.side=xi,y.needsUpdate=!0,ri(y,U,H),y.side=yn):ri(y,U,H)}this.compile=function(y,U,Z=null){Z===null&&(Z=y),N!==null&&N.renderStart(y,U,Z),w=ne.get(Z),w.init(U),M.push(w),Z.traverseVisible(function(V){V.isLight&&V.layers.test(U.layers)&&(w.pushLight(V),V.castShadow&&w.pushShadow(V))}),y!==Z&&y.traverseVisible(function(V){V.isLight&&V.layers.test(U.layers)&&(w.pushLight(V),V.castShadow&&w.pushShadow(V))}),w.setupLights(),N!==null&&N.updateLights(w.state.lightsArray),He=this.localClippingEnabled,rt=ie.init(this.clippingPlanes,He),rt===!0&&ie.setGlobalState(this.clippingPlanes,U),N!==null&&ge.render(w.state.shadowsArray,Z,U);let H=new Set;return y.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let xe=V.material;if(xe)if(Array.isArray(xe))for(let Ee=0;Ee<xe.length;Ee++){let ve=xe[Ee];_s(ve,Z,U,V),H.add(ve)}else _s(xe,Z,U,V),H.add(xe)}),w=M.pop(),N!==null&&N.renderEnd(),H},this.compileAsync=function(y,U,Z=null){let H=this.compile(y,U,Z);return new Promise(V=>{function xe(){if(H.forEach(function(Ee){let we=De.get(Ee).currentProgram;(we===void 0||we.isReady())&&H.delete(Ee)}),H.size===0){V(y);return}setTimeout(xe,10)}ze.get("KHR_parallel_shader_compile")!==null?xe():setTimeout(xe,10)})};let Hn=null;function Ln(y){Hn&&Hn(y)}function xs(){bn.stop()}function vs(){bn.start()}let bn=new Uh;bn.setAnimationLoop(Ln),typeof self!="undefined"&&bn.setContext(self),this.setAnimationLoop=function(y){Hn=y,ue.setAnimationLoop(y),y===null?bn.stop():bn.start()},ue.addEventListener("sessionstart",xs),ue.addEventListener("sessionend",vs),this.render=function(y,U){if(U!==void 0&&U.isCamera!==!0){Xe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;N!==null&&N.renderStart(y,U);let Z=ue.enabled===!0&&ue.isPresenting===!0,H=D!==null&&(le===null||Z)&&D.begin(C,le);if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),ue.enabled===!0&&ue.isPresenting===!0&&(D===null||D.isCompositing()===!1)&&(ue.cameraAutoUpdate===!0&&ue.updateCamera(U),U=ue.getCamera()),y.isScene===!0&&y.onBeforeRender(C,y,U,le),w=ne.get(y,M.length),w.init(U),w.state.textureUnits=Be.getTextureUnits(),M.push(w),je.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),U.isArrayCamera?dt.setFromArrayCamera(U):Fe.setFromProjectionMatrix(je,xn,U.reversedDepth),He=this.localClippingEnabled,rt=ie.init(this.clippingPlanes,He),R=fe.get(y,g.length),R.init(),g.push(R),this.info.render.frame++,ue.enabled===!0&&ue.isPresenting===!0){let Ee=C.xr.getDepthSensingMesh();Ee!==null&&ys(Ee,U,-1/0,C.sortObjects)}ys(y,U,0,C.sortObjects),R.finish(),N!==null&&N.updateLights(w.state.lightsArray),C.sortObjects===!0&&R.sort(te,Ke),Oe=ue.enabled===!1||ue.isPresenting===!1||ue.hasDepthSensing()===!1,Oe&&L.addToRenderList(R,y),this.info.autoReset===!0&&this.info.reset(),rt===!0&&ie.beginShadows();let V=w.state.shadowsArray;if(ge.render(V,y,U),rt===!0&&ie.endShadows(),(H&&D.hasRenderPass())===!1){let Ee=R.opaque,ve=R.transmissive;if(w.setupLights(),U.isArrayCamera){let we=U.cameras;if(ve.length>0)for(let Ce=0,Ye=we.length;Ce<Ye;Ce++){let ct=we[Ce];Si(Ee,ve,y,ct)}Oe&&L.render(y);for(let Ce=0,Ye=we.length;Ce<Ye;Ce++){let ct=we[Ce];ii(R,y,ct,ct.viewport)}}else ve.length>0&&Si(Ee,ve,y,U),Oe&&L.render(y),ii(R,y,U)}le!==null&&J===0&&(Be.updateMultisampleRenderTarget(le),Be.updateRenderTargetMipmap(le)),H&&D.end(C),y.isScene===!0&&y.onAfterRender(C,y,U),_e.resetDefaultState(),j=-1,re=null,M.pop(),M.length>0?(w=M[M.length-1],Be.setTextureUnits(w.state.textureUnits),rt===!0&&ie.setGlobalState(C.clippingPlanes,w.state.camera)):w=null,g.pop(),g.length>0?R=g[g.length-1]:R=null,N!==null&&N.renderEnd()};function ys(y,U,Z,H){if(y.visible===!1)return;if(y.layers.test(U.layers)){if(y.isGroup)Z=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(U);else if(y.isLight)w.pushLight(y),y.castShadow&&w.pushShadow(y);else if(y.isSprite){let Ee=U.isArrayCamera?dt:Fe;if(!y.frustumCulled||y.intersectsFrustum(Ee)){H&&qe.setFromMatrixPosition(y.matrixWorld).applyMatrix4(je);let ve=ce.update(y),we=y.material;we.visible&&R.push(y,ve,we,Z,qe.z,null,U)}}else if(y.isMesh||y.isLine||y.isPoints){let Ee=U.isArrayCamera?dt:Fe;if(!y.frustumCulled||y.intersectsFrustum(Ee)){let ve=ce.update(y),we=y.material;if(H&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),qe.copy(y.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),qe.copy(ve.boundingSphere.center)),qe.applyMatrix4(y.matrixWorld).applyMatrix4(je)),Array.isArray(we)){let Ce=ve.groups;for(let Ye=0,ct=Ce.length;Ye<ct;Ye++){let Ie=Ce[Ye],ht=we[Ie.materialIndex];ht&&ht.visible&&R.push(y,ve,ht,Z,qe.z,Ie,U)}}else we.visible&&R.push(y,ve,we,Z,qe.z,null,U)}}}let xe=y.children;for(let Ee=0,ve=xe.length;Ee<ve;Ee++)ys(xe[Ee],U,Z,H)}function ii(y,U,Z,H){let{opaque:V,transmissive:xe,transparent:Ee}=y;w.setupLightsView(Z),rt===!0&&ie.setGlobalState(C.clippingPlanes,Z),H&&de.viewport(T.copy(H)),V.length>0&&si(V,U,Z),xe.length>0&&si(xe,U,Z),Ee.length>0&&si(Ee,U,Z),de.buffers.depth.setTest(!0),de.buffers.depth.setMask(!0),de.buffers.color.setMask(!0),de.setPolygonOffset(!1)}function Si(y,U,Z,H){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[H.id]===void 0){let Ie=ze.has("EXT_color_buffer_half_float")||ze.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[H.id]=new mn(1,1,{generateMipmaps:!0,type:Ie?Pn:ln,minFilter:ei,samples:Math.max(4,nt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:pt.workingColorSpace})}let xe=w.state.transmissionRenderTarget[H.id],Ee=H.viewport||T;xe.setSize(Ee.z*C.transmissionResolutionScale,Ee.w*C.transmissionResolutionScale);let ve=C.getRenderTarget(),we=C.getActiveCubeFace(),Ce=C.getActiveMipmapLevel();C.setRenderTarget(xe),C.getClearColor(W),K=C.getClearAlpha(),K<1&&C.setClearColor(16777215,.5),C.clear(),Oe&&L.render(Z);let Ye=C.toneMapping;C.toneMapping=kn;let ct=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),w.setupLightsView(H),rt===!0&&ie.setGlobalState(C.clippingPlanes,H),si(y,Z,H),Be.updateMultisampleRenderTarget(xe),Be.updateRenderTargetMipmap(xe),ze.has("WEBGL_multisampled_render_to_texture")===!1){let Ie=!1;for(let ht=0,Ft=U.length;ht<Ft;ht++){let wt=U[ht],{object:Mt,geometry:Yt,material:Re,group:Ot}=wt;if(Re.side===yn&&Mt.layers.test(H.layers)){let ft=Re.side;Re.side=Ht,Re.needsUpdate=!0,wr(Mt,Z,H,Yt,Re,Ot),Re.side=ft,Re.needsUpdate=!0,Ie=!0}}Ie===!0&&(Be.updateMultisampleRenderTarget(xe),Be.updateRenderTargetMipmap(xe))}C.setRenderTarget(ve,we,Ce),C.setClearColor(W,K),ct!==void 0&&(H.viewport=ct),C.toneMapping=Ye}function si(y,U,Z){let H=U.isScene===!0?U.overrideMaterial:null;for(let V=0,xe=y.length;V<xe;V++){let Ee=y[V],{object:ve,geometry:we,group:Ce}=Ee,Ye=Ee.material;Ye.allowOverride===!0&&H!==null&&(Ye=H),ve.layers.test(Z.layers)&&wr(ve,U,Z,we,Ye,Ce)}}function wr(y,U,Z,H,V,xe){N!==null&&V.isNodeMaterial&&N.setObject(y,V),y.onBeforeRender(C,U,Z,H,V,xe),y.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),V.onBeforeRender(C,U,Z,H,y,xe),V.transparent===!0&&V.side===yn&&V.forceSinglePass===!1?(V.side=Ht,V.needsUpdate=!0,C.renderBufferDirect(Z,U,H,V,y,xe),V.side=xi,V.needsUpdate=!0,C.renderBufferDirect(Z,U,H,V,y,xe),V.side=yn):C.renderBufferDirect(Z,U,H,V,y,xe),y.onAfterRender(C,U,Z,H,V,xe)}function Ms(y){let U=0;for(let Z of y)Z.texture!==null&&U++;return U}function ri(y,U,Z){U.isScene!==!0&&(U=tt);let H=De.get(y),V=w.state.lights,xe=w.state.shadowsArray,Ee=V.state.version,ve=oe.getParameters(y,V.state,xe,U,Z,w.state.lightProbeGridArray),we=oe.getProgramCacheKey(ve),Ce=H.programs;H.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?U.environment:null,H.fog=U.fog;let Ye=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;H.envMap=A.get(y.envMap||H.environment,Ye),H.envMapRotation=H.environment!==null&&y.envMap===null?U.environmentRotation:y.envMapRotation,Ce===void 0&&(y.addEventListener("dispose",_t),Ce=new Map,H.programs=Ce,H.programVariants=new Map);let ct=Ce.get(we);if(ct!==void 0){if(H.currentProgram===ct&&H.lightsStateVersion===Ee)return ae(y,ve),ct}else ve.uniforms=oe.getUniforms(y),N!==null&&y.isNodeMaterial&&N.build(y,Z,ve),y.onBeforeCompile(ve,C),ct=oe.acquireProgram(ve,we),Ce.set(we,ct),H.uniforms=ve.uniforms;let Ie=H.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Ie.clippingPlanes=ie.uniform),ae(y,ve),H.needsLights=Et(y),H.lightsStateVersion=Ee,H.needsLights&&(Ie.ambientLightColor.value=V.state.ambient,Ie.lightProbe.value=V.state.probe,Ie.sunLights.value=V.state.sun,Ie.sunLightShadows.value=V.state.sunShadow,Ie.directionalLights.value=V.state.directional,Ie.directionalLightShadows.value=V.state.directionalShadow,Ie.spotLights.value=V.state.spot,Ie.spotLightShadows.value=V.state.spotShadow,Ie.rectAreaLights.value=V.state.rectArea,Ie.ltc_1.value=V.state.rectAreaLTC1,Ie.ltc_2.value=V.state.rectAreaLTC2,Ie.pointLights.value=V.state.point,Ie.pointLightShadows.value=V.state.pointShadow,Ie.hemisphereLights.value=V.state.hemi,Ie.sunShadowMatrix.value=V.state.sunShadowMatrix,Ie.sunShadowCascade.value=V.state.sunShadowCascade,Ie.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Ie.spotLightMatrix.value=V.state.spotLightMatrix,Ie.spotLightMap.value=V.state.spotLightMap,Ie.pointShadowMatrix.value=V.state.pointShadowMatrix),H.numLightProbeGrids=Ms(w.state.lightProbeGridArray),H.currentProgram=ct,H.uniformsList=null,ct}function To(y,U,Z,H,V){let xe=De.get(y),Ee=xe.currentProgram.id+","+H+","+V,ve=xe.programVariants.get(Ee);return ve===void 0?(ve=ri(y,U,Z),xe.programVariants.set(Ee,ve)):(xe.currentProgram=ve,xe.uniformsList=null,xe.outputColorSpace=H,xe.toneMapping=V),ve}function Ss(y){if(y.uniformsList===null){let U=y.currentProgram.getUniforms();y.uniformsList=ps.seqWithValue(U.seq,y.uniforms)}return y.uniformsList}function ae(y,U){let Z=De.get(y);Z.outputColorSpace=U.outputColorSpace,Z.batching=U.batching,Z.batchingColor=U.batchingColor,Z.instancing=U.instancing,Z.instancingColor=U.instancingColor,Z.instancingMorph=U.instancingMorph,Z.skinning=U.skinning,Z.morphTargets=U.morphTargets,Z.morphNormals=U.morphNormals,Z.morphColors=U.morphColors,Z.morphTargetsCount=U.morphTargetsCount,Z.numClippingPlanes=U.numClippingPlanes,Z.numIntersection=U.numClipIntersection,Z.vertexAlphas=U.vertexAlphas,Z.vertexTangents=U.vertexTangents,Z.toneMapping=U.toneMapping}function be(y,U,Z,H,V){U.isScene!==!0&&(U=tt),Be.resetTextureUnits();let xe=U.fog,Ee=H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial?U.environment:null,ve=le===null?C.outputColorSpace:le.isXRRenderTarget===!0?le.texture.colorSpace:pt.workingColorSpace,we=H.isMeshStandardMaterial||H.isMeshLambertMaterial&&!H.envMap||H.isMeshPhongMaterial&&!H.envMap,Ce=A.get(H.envMap||Ee,we),Ye=H.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,ct=!!Z.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Ie=!!Z.morphAttributes.position,ht=!!Z.morphAttributes.normal,Ft=!!Z.morphAttributes.color,wt=kn;H.toneMapped&&(le===null||le.isXRRenderTarget===!0)&&(wt=C.toneMapping);let Mt=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,Yt=Mt!==void 0?Mt.length:0,Re=De.get(H),Ot=w.state.lights;if(rt===!0&&(He===!0||y!==re)){let At=y===re&&H.id===j;ie.setState(H,y,At)}let ft=!1,hn=!1;H.version===Re.__version?Re.needsLights&&Re.lightsStateVersion!==Ot.state.version||V.isBatchedMesh&&Re.batching===!1||!V.isBatchedMesh&&Re.batching===!0||V.isBatchedMesh&&Re.batchingColor===!0&&V._colorsTexture===null||V.isBatchedMesh&&Re.batchingColor===!1&&V._colorsTexture!==null||V.isInstancedMesh&&Re.instancing===!1||!V.isInstancedMesh&&Re.instancing===!0||V.isSkinnedMesh&&Re.skinning===!1||!V.isSkinnedMesh&&Re.skinning===!0||V.isInstancedMesh&&Re.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Re.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Re.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Re.instancingMorph===!1&&V.morphTexture!==null||Re.envMap!==Ce||H.fog===!0&&Re.fog!==xe||Re.numClippingPlanes!==void 0&&(Re.numClippingPlanes!==ie.numPlanes||Re.numIntersection!==ie.numIntersection)||Re.vertexAlphas!==Ye||Re.vertexTangents!==ct||Re.morphTargets!==Ie||Re.morphNormals!==ht||Re.morphColors!==Ft||Re.morphTargetsCount!==Yt||Re.numLightProbeGrids!==Ms(w.state.lightProbeGridArray)?ft=!0:(Re.outputColorSpace!==ve||Re.toneMapping!==wt)&&(hn=!0):(ft=!0,Re.__version=H.version);let Zt=Re.currentProgram;(ft===!0||hn===!0)&&(Zt=hn===!0?To(H,U,V,ve,wt):ri(H,U,V),N&&H.isNodeMaterial&&N.onUpdateProgram(H,Zt,Re));let Ve=!1,Ne=!1,gt=!1,We=Zt.getUniforms(),Lt=Re.uniforms;if(de.useProgram(Zt.program)&&(Ve=!0,Ne=!0,gt=!0),H.id!==j&&(j=H.id,Ne=!0),Ve||re!==y){de.buffers.depth.getReversed()&&y.reversedDepth!==!0&&(y._reversedDepth=!0,y.updateProjectionMatrix()),We.setValue(F,"projectionMatrix",y.projectionMatrix),We.setValue(F,"viewMatrix",y.matrixWorldInverse);let Dt=We.map.cameraPosition;Dt!==void 0&&Dt.setValue(F,St.setFromMatrixPosition(y.matrixWorld)),nt.logarithmicDepthBuffer&&We.setValue(F,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&We.setValue(F,"isOrthographic",y.isOrthographicCamera===!0),re!==y&&(re=y,Ne=!0,gt=!0)}if(Re.needsLights&&(Ot.state.sunShadowMap.length>0&&We.setValue(F,"sunShadowMap",Ot.state.sunShadowMap,Be),Ot.state.directionalShadowMap.length>0&&We.setValue(F,"directionalShadowMap",Ot.state.directionalShadowMap,Be),Ot.state.spotShadowMap.length>0&&We.setValue(F,"spotShadowMap",Ot.state.spotShadowMap,Be),Ot.state.pointShadowMap.length>0&&We.setValue(F,"pointShadowMap",Ot.state.pointShadowMap,Be)),V.isSkinnedMesh){We.setOptional(F,V,"bindMatrix"),We.setOptional(F,V,"bindMatrixInverse");let At=V.skeleton;At&&(At.boneTexture===null&&At.computeBoneTexture(),We.setValue(F,"boneTexture",At.boneTexture,Be))}V.isBatchedMesh&&(We.setOptional(F,V,"batchingTexture"),We.setValue(F,"batchingTexture",V._matricesTexture,Be),We.setOptional(F,V,"batchingIdTexture"),We.setValue(F,"batchingIdTexture",V._indirectTexture,Be),We.setOptional(F,V,"batchingColorTexture"),V._colorsTexture!==null&&We.setValue(F,"batchingColorTexture",V._colorsTexture,Be));let un=Z.morphAttributes;if((un.position!==void 0||un.normal!==void 0||un.color!==void 0)&&se.update(V,Z,Zt),(Ne||Re.receiveShadow!==V.receiveShadow)&&(Re.receiveShadow=V.receiveShadow,We.setValue(F,"receiveShadow",V.receiveShadow)),(H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial)&&H.envMap===null&&U.environment!==null&&(Lt.envMapIntensity.value=U.environmentIntensity),Lt.dfgLUT!==void 0&&(Lt.dfgLUT.value=C0()),Ne){if(We.setValue(F,"toneMappingExposure",C.toneMappingExposure),Re.needsLights&&Le(Lt,gt),xe&&H.fog===!0&&q.refreshFogUniforms(Lt,xe),q.refreshMaterialUniforms(Lt,H,ee,Me,w.state.transmissionRenderTarget[y.id]),Re.needsLights&&Re.numLightProbeGrids>0){let At=b,Dt=0;for(let dn of w.state.lightProbeGridArray)dn.texture!==null&&(At.textures[Dt]=dn.texture,At.min[Dt]=dn.boundingBox.min,At.max[Dt]=dn.boundingBox.max,At.resolution[Dt]=dn.resolution,Dt++);for(let dn in At)At[dn].length=Dt;Lt.probesSH.value=At.textures,Lt.probesMin.value=At.min,Lt.probesMax.value=At.max,Lt.probesResolution.value=At.resolution}ps.upload(F,Ss(Re),Lt,Be)}if(H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(ps.upload(F,Ss(Re),Lt,Be),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&We.setValue(F,"center",V.center),We.setValue(F,"modelViewMatrix",V.modelViewMatrix),We.setValue(F,"normalMatrix",V.normalMatrix),We.setValue(F,"modelMatrix",V.matrixWorld),H.uniformsGroups!==void 0){let At=H.uniformsGroups;for(let Dt=0,dn=At.length;Dt<dn;Dt++){let bs=At[Dt];Pe.update(bs,Zt),Pe.bind(bs,Zt)}}return Zt}function Le(y,U){y.ambientLightColor.needsUpdate=U,y.lightProbe.needsUpdate=U,y.sunLights.needsUpdate=U,y.sunLightShadows.needsUpdate=U,y.directionalLights.needsUpdate=U,y.directionalLightShadows.needsUpdate=U,y.pointLights.needsUpdate=U,y.pointLightShadows.needsUpdate=U,y.spotLights.needsUpdate=U,y.spotLightShadows.needsUpdate=U,y.rectAreaLights.needsUpdate=U,y.hemisphereLights.needsUpdate=U}function Et(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return $},this.getActiveMipmapLevel=function(){return J},this.getRenderTarget=function(){return le},this.setRenderTargetTextures=function(y,U,Z){let H=De.get(y);H.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,H.__autoAllocateDepthBuffer===!1&&(H.__useRenderToTexture=!1),De.get(y.texture).__webglTexture=U,De.get(y.depthTexture).__webglTexture=H.__autoAllocateDepthBuffer?void 0:Z,H.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,U){let Z=De.get(y);Z.__webglFramebuffer=U,Z.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(y,U=0,Z=0){le=y,$=U,J=Z;let H=null,V=!1,xe=!1;if(y){let ve=De.get(y);if(ve.__useDefaultFramebuffer!==void 0){de.bindFramebuffer(F.FRAMEBUFFER,ve.__webglFramebuffer),T.copy(y.viewport),X.copy(y.scissor),he=y.scissorTest,de.viewport(T),de.scissor(X),de.setScissorTest(he),j=-1;return}else if(ve.__webglFramebuffer===void 0)Be.setupRenderTarget(y);else if(ve.__hasExternalTextures)Be.rebindTextures(y,De.get(y.texture).__webglTexture,De.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){let Ye=y.depthTexture;if(ve.__boundDepthTexture!==Ye){if(Ye!==null&&De.has(Ye)&&(y.width!==Ye.image.width||y.height!==Ye.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Be.setupDepthRenderbuffer(y)}}let we=y.texture;(we.isData3DTexture||we.isDataArrayTexture||we.isCompressedArrayTexture)&&(xe=!0);let Ce=De.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Ce[U])?H=Ce[U][Z]:H=Ce[U],V=!0):y.samples>0&&Be.useMultisampledRTT(y)===!1?H=De.get(y).__webglMultisampledFramebuffer:Array.isArray(Ce)?H=Ce[Z]:H=Ce,T.copy(y.viewport),X.copy(y.scissor),he=y.scissorTest}else T.copy(Te).multiplyScalar(ee).floor(),X.copy(ke).multiplyScalar(ee).floor(),he=ut;if(Z!==0&&(H=k),de.bindFramebuffer(F.FRAMEBUFFER,H)&&de.drawBuffers(y,H),de.viewport(T),de.scissor(X),de.setScissorTest(he),V){let ve=De.get(y.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+U,ve.__webglTexture,Z)}else if(xe){let ve=U;for(let we=0;we<y.textures.length;we++){let Ce=De.get(y.textures[we]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+we,Ce.__webglTexture,Z,ve)}}else if(y!==null&&Z!==0){let ve=De.get(y.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,ve.__webglTexture,Z)}j=-1};function It(y){let U=De.get(y);return(U.__readFormat!==y.format||U.__readType!==y.type)&&(U.__readFormat=y.format,U.__readType=y.type,U.__formatReadable=nt.textureFormatReadable(y.format),U.__typeReadable=nt.textureTypeReadable(y.type)),U}this.readRenderTargetPixels=function(y,U,Z,H,V,xe,Ee,ve=0){if(!(y&&y.isWebGLRenderTarget)){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let we=De.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Ee!==void 0&&(we=we[Ee],Array.isArray(we)&&(we=we[0])),we){de.bindFramebuffer(F.FRAMEBUFFER,we);try{let Ce=y.textures[ve],Ye=Ce.format,ct=Ce.type;y.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+ve);let Ie=It(Ce);if(Ie.__formatReadable===!1){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ie.__typeReadable===!1){Xe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=y.width-H&&Z>=0&&Z<=y.height-V&&F.readPixels(U,Z,H,V,pe.convert(Ye),pe.convert(ct),xe)}finally{let Ce=le!==null?De.get(le).__webglFramebuffer:null;de.bindFramebuffer(F.FRAMEBUFFER,Ce)}}},this.readRenderTargetPixelsAsync=async function(y,U,Z,H,V,xe,Ee,ve=0){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let we=De.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Ee!==void 0&&(we=we[Ee],Array.isArray(we)&&(we=we[0])),we)if(U>=0&&U<=y.width-H&&Z>=0&&Z<=y.height-V){de.bindFramebuffer(F.FRAMEBUFFER,we);let Ce=y.textures[ve],Ye=Ce.format,ct=Ce.type;y.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+ve);let Ie=It(Ce);if(Ie.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ie.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ht=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,ht),F.bufferData(F.PIXEL_PACK_BUFFER,xe.byteLength,F.STREAM_READ),F.readPixels(U,Z,H,V,pe.convert(Ye),pe.convert(ct),0),F.bindBuffer(F.PIXEL_PACK_BUFFER,null);let Ft=le!==null?De.get(le).__webglFramebuffer:null;de.bindFramebuffer(F.FRAMEBUFFER,Ft);let wt=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await oh(F,wt,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,ht),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,xe),F.bindBuffer(F.PIXEL_PACK_BUFFER,null),F.deleteBuffer(ht),F.deleteSync(wt),xe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,U=null,Z=0){let H=Math.pow(2,-Z),V=Math.floor(y.image.width*H),xe=Math.floor(y.image.height*H),Ee=U!==null?U.x:0,ve=U!==null?U.y:0;Be.setTexture2D(y,0),F.copyTexSubImage2D(F.TEXTURE_2D,Z,0,0,Ee,ve,V,xe),de.unbindTexture()},this.copyTextureToTexture=function(y,U,Z=null,H=null,V=0,xe=0){let Ee,ve,we,Ce,Ye,ct,Ie,ht,Ft,wt=y.isCompressedTexture?y.mipmaps[xe]:y.image;if(Z!==null)Ee=Z.max.x-Z.min.x,ve=Z.max.y-Z.min.y,we=Z.isBox3?Z.max.z-Z.min.z:1,Ce=Z.min.x,Ye=Z.min.y,ct=Z.isBox3?Z.min.z:0;else{let We=Math.pow(2,-V);Ee=Math.floor(wt.width*We),ve=Math.floor(wt.height*We),y.isDataArrayTexture?we=wt.depth:y.isData3DTexture?we=Math.floor(wt.depth*We):we=1,Ce=0,Ye=0,ct=0}H!==null?(Ie=H.x,ht=H.y,Ft=H.z):(Ie=0,ht=0,Ft=0);let Mt=pe.convert(U.format),Yt=pe.convert(U.type),Re;U.isData3DTexture?(Be.setTexture3D(U,0),Re=F.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(Be.setTexture2DArray(U,0),Re=F.TEXTURE_2D_ARRAY):(Be.setTexture2D(U,0),Re=F.TEXTURE_2D),de.activeTexture(F.TEXTURE0),de.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,U.flipY),de.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),de.pixelStorei(F.UNPACK_ALIGNMENT,U.unpackAlignment);let Ot=de.getParameter(F.UNPACK_ROW_LENGTH),ft=de.getParameter(F.UNPACK_IMAGE_HEIGHT),hn=de.getParameter(F.UNPACK_SKIP_PIXELS),Zt=de.getParameter(F.UNPACK_SKIP_ROWS),Ve=de.getParameter(F.UNPACK_SKIP_IMAGES);de.pixelStorei(F.UNPACK_ROW_LENGTH,wt.width),de.pixelStorei(F.UNPACK_IMAGE_HEIGHT,wt.height),de.pixelStorei(F.UNPACK_SKIP_PIXELS,Ce),de.pixelStorei(F.UNPACK_SKIP_ROWS,Ye),de.pixelStorei(F.UNPACK_SKIP_IMAGES,ct);let Ne=y.isDataArrayTexture||y.isData3DTexture,gt=U.isDataArrayTexture||U.isData3DTexture;if(y.isDepthTexture){let We=De.get(y),Lt=De.get(U),un=De.get(We.__renderTarget),At=De.get(Lt.__renderTarget);de.bindFramebuffer(F.READ_FRAMEBUFFER,un.__webglFramebuffer),de.bindFramebuffer(F.DRAW_FRAMEBUFFER,At.__webglFramebuffer);for(let Dt=0;Dt<we;Dt++)Ne&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,De.get(y).__webglTexture,V,ct+Dt),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,De.get(U).__webglTexture,xe,Ft+Dt)),F.blitFramebuffer(Ce,Ye,Ce+Ee,Ye+ve,Ie,ht,Ie+Ee,ht+ve,F.DEPTH_BUFFER_BIT,F.NEAREST);de.bindFramebuffer(F.READ_FRAMEBUFFER,null),de.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(V!==0||y.isRenderTargetTexture||De.has(y)){let We=De.get(y),Lt=De.get(U);de.bindFramebuffer(F.READ_FRAMEBUFFER,P),de.bindFramebuffer(F.DRAW_FRAMEBUFFER,Y);for(let un=0;un<we;un++)Ne?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,We.__webglTexture,V,ct+un):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,We.__webglTexture,V),gt?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Lt.__webglTexture,xe,Ft+un):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,Lt.__webglTexture,xe),V!==0?F.blitFramebuffer(Ce,Ye,Ce+Ee,Ye+ve,Ie,ht,Ie+Ee,ht+ve,F.COLOR_BUFFER_BIT,F.NEAREST):gt?F.copyTexSubImage3D(Re,xe,Ie,ht,Ft+un,Ce,Ye,Ee,ve):F.copyTexSubImage2D(Re,xe,Ie,ht,Ce,Ye,Ee,ve);de.bindFramebuffer(F.READ_FRAMEBUFFER,null),de.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else gt?y.isDataTexture||y.isData3DTexture?F.texSubImage3D(Re,xe,Ie,ht,Ft,Ee,ve,we,Mt,Yt,wt.data):U.isCompressedArrayTexture?F.compressedTexSubImage3D(Re,xe,Ie,ht,Ft,Ee,ve,we,Mt,wt.data):F.texSubImage3D(Re,xe,Ie,ht,Ft,Ee,ve,we,Mt,Yt,wt):y.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,xe,Ie,ht,Ee,ve,Mt,Yt,wt.data):y.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,xe,Ie,ht,wt.width,wt.height,Mt,wt.data):F.texSubImage2D(F.TEXTURE_2D,xe,Ie,ht,Ee,ve,Mt,Yt,wt);de.pixelStorei(F.UNPACK_ROW_LENGTH,Ot),de.pixelStorei(F.UNPACK_IMAGE_HEIGHT,ft),de.pixelStorei(F.UNPACK_SKIP_PIXELS,hn),de.pixelStorei(F.UNPACK_SKIP_ROWS,Zt),de.pixelStorei(F.UNPACK_SKIP_IMAGES,Ve),xe===0&&U.generateMipmaps===!0&&U.mipmapsAutoUpdate===!0&&F.generateMipmap(Re),de.unbindTexture()},this.initRenderTarget=function(y){De.get(y).__webglFramebuffer===void 0&&Be.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?Be.setTextureCube(y,0):y.isData3DTexture?Be.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?Be.setTexture2DArray(y,0):Be.setTexture2D(y,0),de.unbindTexture()},this.resetState=function(){$=0,J=0,le=null,de.reset(),_e.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=pt._getDrawingBufferColorSpace(e),t.unpackColorSpace=pt._getUnpackColorSpace()}};var at={v0:10,rampDelay:9,rampSpan:62,vMax:2.2,laneLerp:18,jumpT0:.62,jumpH:1.25,slideT0:.62,dive:-16,zFar:70,zSpawn:86,bufT:.18,invulT:2,shieldT:9,magnetT:9,boostT:8,comboWin:1.4,zoneT:5};function qh(i){if(i<=at.rampDelay)return at.v0;let e=(i-at.rampDelay)/at.rampSpan,t=e<=1?Math.pow(e,.92):1+(at.vMax-2)*(1-Math.exp(-(e-1)*1.6))/1;return at.v0*Math.min(at.vMax,1+t)}function R0(i){return .42-.11*Math.min(1,Math.max(0,(i-10)/60))}function P0(i){return i<15?0:i<28?1:i<42?2:i<58?3:4}var Di=[[0,[".o.",".o.",".J.",".o.",".o."]],[0,["o..","o..","oM.","o..","o.."]],[0,[".o.",".o.",".B.",".o."]],[0,[".o.","HoH",".o.",".o."]],[0,[".o.","MoM",".o."]],[0,["Jo.",".o.",".oJ"]],[0,["o.o","oMo","o.o"]],[0,["..o",".Mo","..o","...","o..","oM.","o.."]],[0,["B..",".o.",".oB",".o."]],[1,["..o","MMo","..o","...","o..","oMM","o.."]],[1,["...","BBB","ooo","ooo"]],[1,["JJJ","...",".o.",".o."]],[1,["HMB","...","oMo","BMH"]],[1,["M.M",".o.",".B.",".o.","M.M"]],[1,[".M.","oMo","oMo","o.o"]],[1,["o.M","o.M","oHM","o.M","..M"]],[1,["oHH","o..","o..","MMo","..o"]],[2,["M..",".M.","..M","...","o..","o.."]],[2,["MBM","...","MHM",".o."]],[2,["HHM","...","MBB","...","o.."]],[2,[".M.","oMo","BMH","...",".o."]],[2,["MM.","..o","...",".MM","o..","...","MM."]],[2,["JMJ","...","MBM",".o."]],[2,["M^M","M^M","MJM","...",".o."]],[3,["MMB","...","HMM","...","MBM"]],[3,["JJM","...","MBB","...","HMH"]],[3,["M.M","M.M","MBM","MoM","M.M"]],[3,[".MM","..M","B.M","..M","H.."]],[3,["BHB","...","MMo","..o","oMM"]],[3,["MMo","MMo","MM.","M..","..M","o.M","oMM"]],[3,["HBH","...","BHB","...","MoM"]],[4,["M.M","MHM","M.M","MBM","M.M","..."]],[4,[".MM",".MM","BMM","..M","M.H","M..","MM.","..."]],[4,["HHH","...","MBM","...","BBB","...","M.M"]],[4,["MoM","MHM","...","B.B",".M.","H.H","..."]],[4,["o.M","oMM","o..","BMo",".Mo","HM.","...","MMB"]],[4,["J.M","..M","M.B","M..","MH.","..."]]];function I0(i){let e=[];return(i||[]).forEach(function(t){if(t&&typeof t=="object"&&+t.n>0)e.push({n:+t.n,label:String(t.label||"")});else if(typeof t=="string"){let n=t.match(/^\s*(\d+)\s*[^:]*:\s*(.+)$/);n&&e.push({n:+n[1],label:n[2].trim()})}}),e.sort(function(t,n){return t.n-n.n}),e}function Yh(i,e,t){return i<e?e:i>t?t:i}function Zh(i,e){let t=[];for(let n=0;n<i;n++)t.push(e(n));return t}function Jh(i){i=i||{};let e=null;function t(){let T=e.rs=e.rs+1831565813|0,X=Math.imul(T^T>>>15,1|T);return X=X+Math.imul(X^X>>>7,61|X)^X,((X^X>>>14)>>>0)/4294967296}let n=function(){},s=Object.assign({jump:n,land:n,slide:n,lane:n,bump:n,coin:n,power:n,hit:n,near:n,palier:n,combo:n,zone:n,evt:n,end:n,bravo:n},i.fx||{}),r={};Object.keys(s).forEach(function(T){r[T]=function(){if(!e.muet)return s[T].apply(null,arguments)}});let a=Object.assign({haut:"l'obstacle",bas:"la barre",mur:"le mur"},i.noms||{}),o=i.evenement&&i.evenement.nom||"La grande vague",l=i.evenement&&i.evenement.consigne||"Glisse dessous !",c=I0(i.paliers),u=+i.duration||0,d=Zh(70,function(){return{on:!1,type:0,lane:0,wz:0,len:.7,z:0,done:!1,crossed:!1,tuto:null,tdir:"",tdone:!1,burst:0,free:0,big:!1,v:0,id:0}}),h=Zh(180,function(){return{on:!1,pw:"",lane:0,x:0,y:.45,wz:0,z:0,fly:!1,tuto:null,tdir:"",tdone:!1,v:0}});e={rs:(i.seed==null?Date.now()^Math.random()*1e9:i.seed)|0,uid:0,nextWZ:0,lastChunk:-1,lastPwKind:"",lastFree:[-1,0,1],lastRowZ:-99,hits:0,muet:!1,state:"ready",gt:0,dist:0,speed:at.v0,speedMul:1,px:0,lane:0,tlane:0,prevLane:0,laneT:-9,py:0,vy:0,air:!1,diving:!1,slide:0,jumpBuf:0,slideBuf:0,jumpAt:-9,slideAt:-9,jumpT:at.jumpT0,slideT:at.slideT0,grav:0,tilt:0,invul:0,shield:0,magnet:0,boost:0,secondChance:!0,hitStop:0,dieT:0,endReason:"",coins:0,pts:0,score:0,combo:0,mult:1,lastCoinT:-9,palierIdx:0,lastPower:0,nearCount:0,level:0,zone:0,zoneA:-1,zoneB:-1,lastZone:0,evAt:40,prompt:null,bravo:0,result:null,OBS:d,COINS:h,paliers:c,duration:u,noms:a};function m(){for(let T=0;T<d.length;T++)if(!d[T].on)return d[T];return null}function x(){for(let T=0;T<h.length;T++)if(!h[T].on)return h[T];return null}function S(T,X,he,W){let K=m();return K?(K.on=!0,K.type=T,K.lane=X,K.wz=he,K.z=he-e.dist,K.len=W||.7,K.done=!1,K.crossed=!1,K.tuto=null,K.tdir="",K.tdone=!1,K.burst=0,K.free=0,K.big=!1,K.v=Math.floor(t()*1e3),K.id=++e.uid,K):null}function f(T,X,he,W){let K=x();return K?(K.on=!0,K.pw=W||"",K.lane=T,K.x=T,K.y=he==null?.45:he,K.wz=X,K.z=X-e.dist,K.fly=!1,K.tuto=null,K.tdir="",K.tdone=!1,K.v=Math.floor(t()*1e3),K):null}function p(T,X,he,W){let K=he*W,me=[-.3,-.15,0,.15,.3];for(let Me=0;Me<5;Me++){let ee=me[Me];f(T,X+ee*K,.5+at.jumpH*(1-4*ee*ee)*.82)}}function v(T){return Yh(at.jumpT0*Math.pow(at.v0/T,.62),.4,at.jumpT0)}function E(){let T,X;for(T=0;T<4;T++)X=f(1,12+T*2.6),T===0&&(X.tuto="Glisse à droite",X.tdir="right");for(T=0;T<4;T++)X=f(-1,30+T*2.6),T===0&&(X.tuto="Glisse à gauche",X.tdir="left");for(T=-1;T<=1;T++){let W=S(0,T,60);T===0&&(W.tuto="Glisse vers le haut : saute par-dessus "+a.haut,W.tdir="up")}for(p(-1,60,at.v0*1.02,at.jumpT0),T=-1;T<=1;T++){let W=S(1,T,78);T===0&&(W.tuto="Glisse vers le bas : passe sous "+a.bas,W.tdir="down")}f(0,78,.3);let he=t()<.5?-1:1;for(T=-1;T<=1;T++)if(T!==he){let W=S(2,T,96,1.4);T===0&&(W.tuto="Change de couloir",W.tdir="lr",W.free=he)}for(T=0;T<3;T++)f(he,92+T*2.6);e.nextWZ=110}function b(T){return e.gt+Math.max(0,T-e.dist)/Math.max(1,e.speed)}function R(T){let X=Math.round(at.zoneT*e.speed*1.12/T);e.zoneA=e.nextWZ,e.zoneB=e.nextWZ+X*T;for(let he=0;he<X;he++){let W=e.nextWZ+he*T;if(he%4===2){let K=Math.floor(t()*3)-1;for(let me=-1;me<=1;me++)me===K?S(0,me,W):f(me,W,1.5)}else for(let K=-1;K<=1;K++)f(K,W,he%2?.45:.6)}e.lastRowZ=e.nextWZ+(X-1)*T,e.nextWZ+=X*T+T*2,e.lastFree=[-1,0,1]}function w(T){e.nextWZ+=T;for(let X=-1;X<=1;X++){let he=S(1,X,e.nextWZ);he.big=!0,X===0&&(he.tuto=l,he.tdir="down",he.evt=!0)}for(let X=-1;X<=1;X++)f(X,e.nextWZ,.3);e.lastRowZ=e.nextWZ,e.nextWZ+=T*3,e.lastFree=[-1,0,1]}function g(){let T=b(e.nextWZ),X=P0(T),he=R0(T),W=qh(T),K=W*he,me=v(W);if(e.level=X,T>30&&T-e.lastZone>30&&t()<.6){e.lastZone=T,R(K);return}if(T>e.evAt){e.evAt=T+34+t()*10,w(K);return}if(T>12&&T-e.lastPower>16&&t()<.5){e.lastPower=T;let He=Math.floor(t()*3)-1,je=["shield","magnet","boost"].filter(function(qe){return qe!==e.lastPwKind}),St=je[Math.floor(t()*je.length)];e.lastPwKind=St,f(He,e.nextWZ,.7,St),e.nextWZ+=K*3;return}let Me=0,ee,te,Ke=function(He){return He===X?4:He===X-1?2:1};for(ee=0;ee<Di.length;ee++)Di[ee][0]<=X&&ee!==e.lastChunk&&(Me+=Ke(Di[ee][0]));let Te=t()*Me,ke=0;for(ee=0;ee<Di.length;ee++)if(!(Di[ee][0]>X||ee===e.lastChunk)&&(te=Ke(Di[ee][0]),Te-=te,Te<=0)){ke=ee;break}e.lastChunk=ke;let ut=Di[ke][1],Fe=t()<.5,dt=[null,null,null],rt=0;for(let He=0;He<ut.length;He++){let je=ut[He],St=[],qe={};for(let Oe=0;Oe<3;Oe++){let st=je.charAt(Fe?2-Oe:Oe);st!=="M"&&(St.push(Oe-1),qe[Oe-1]=st==="H"||st==="J"||st==="B"?.6:0)}if(St.length&&e.lastFree.length){let Oe=0;for(let ze of e.lastFree){let nt=9;for(let de of St)nt=Math.min(nt,Math.abs(ze-de)*1.05+qe[de]+(Math.abs(ze-de)?.35:0));Oe=Math.max(Oe,nt)}let st=e.nextWZ+He*K+rt,F=st-e.lastRowZ,Nt=Math.max((Oe+.25)*K,(Oe*.4+.25)*W);if(Oe>1&&F<Nt){rt+=Nt-F;for(let ze=0;ze<3;ze++)dt[ze]=null}}e.lastFree=St.length?St:e.lastFree;let tt=e.nextWZ+He*K+rt;e.lastRowZ=tt;for(let Oe=0;Oe<3;Oe++){let st=je.charAt(Fe?2-Oe:Oe),F=Oe-1;if(st==="M"){dt[Oe]?dt[Oe].len+=K:dt[Oe]=S(2,F,tt,1.4);continue}dt[Oe]=null,st==="H"?S(0,F,tt):st==="J"?(S(0,F,tt),p(F,tt,W,me)):st==="B"?S(1,F,tt):st==="o"?f(F,tt):st==="^"?f(F,tt,1.55):st==="*"&&f(F,tt,.7,"shield")}}e.nextWZ+=ut.length*K+rt+K*[2.2,1.8,1.45,1.2,1][X]}function M(T){if(e.state!=="run")return;if(T==="left"||T==="right"){let he=T==="left"?-1:1,W=e.tlane+he;if(W<-1||W>1){e.tilt=he*.25,r.bump(he);return}e.prevLane=e.tlane,e.tlane=W,e.laneT=e.gt,e.tilt=he*.32,r.lane(he)}else T==="up"?e.air?e.jumpBuf=at.bufT:D():T==="down"&&(e.air?(e.diving=!0,e.vy=Math.min(e.vy,at.dive),e.slideBuf=at.bufT+.2,e.jumpBuf=0):C());let X=e.prompt;X&&!X.tdone&&(X.tdir===T||X.tdir==="lr"&&(T==="left"||T==="right"))&&(X.tdone=!0,e.bravo=.9,r.bravo())}function D(){let T=v(e.speed)*(e.boost>0?1.25:1),X=at.jumpH*(e.boost>0?1.9:1);e.jumpT=T,e.grav=8*X/(T*T),e.air=!0,e.diving=!1,e.vy=4*X/T,e.slide=0,e.jumpAt=e.gt,e.jumpBuf=0,r.jump(e.boost>0)}function C(){e.slideT=Yh(at.slideT0*Math.pow(at.v0/e.speed,.5),.42,at.slideT0),e.slide=e.slideT,e.slideAt=e.gt,e.slideBuf=0,r.slide()}function I(){return{score:e.score,coins:e.coins,distance:Math.round(e.dist),duration:Math.round(e.gt*10)/10}}function N(T){e.state==="dying"||e.state==="end"||(e.endReason=T,e.result=I(),T==="temps"?e.state="end":(e.state="dying",e.dieT=0),r.end(T,e.result))}function k(T){if(!(e.invul>0)){if(e.hits++,e.shield>0){e.shield=0,e.invul=1,T.burst=.35,T.done=!0,r.hit("shield",T);return}if(e.secondChance){i.immortel||(e.secondChance=!1),e.invul=at.invulT,T.burst=.35,T.done=!0,e.hitStop=.09,e.speedMul=.78,e.combo=0,e.mult=1,r.hit("second",T);return}e.hitStop=.12,r.hit("dead",T),N("choc")}}function P(T){if(T.on=!1,T.pw){T.pw==="shield"?e.shield=at.shieldT:T.pw==="magnet"?e.magnet=at.magnetT:e.boost=at.boostT,r.power(T.pw,T);return}e.gt-e.lastCoinT<=at.comboWin?e.combo++:e.combo=1,e.lastCoinT=e.gt;let X=e.combo>=25?3:e.combo>=10?2:1;X>e.mult&&(e.mult=X,r.combo(X)),e.mult=X,e.coins++,e.pts+=10*e.mult*(e.zone>0?2:1),r.coin(T,e.combo),e.palierIdx<c.length&&e.coins>=c[e.palierIdx].n&&(r.palier(c[e.palierIdx].label),e.palierIdx++)}function Y(T){if(e.bravo=Math.max(0,e.bravo-T),e.state==="ready"||e.state==="paused"||e.state==="end")return;if(e.state==="dying"){e.dieT+=T,e.speed*=Math.exp(-T*5),e.dist+=e.speed*T;for(let ee=0;ee<d.length;ee++)d[ee].on&&(d[ee].z=d[ee].wz-e.dist);for(let ee=0;ee<h.length;ee++)h[ee].on&&(h[ee].z=h[ee].wz-e.dist);e.dieT>1.15&&(e.state="end");return}e.gt+=T,e.speedMul=Math.min(1,e.speedMul+T*.07);let X=e.dist>=e.zoneA&&e.dist<e.zoneB;if(X&&e.zone<=0?(e.zone=1,r.zone(!0)):!X&&e.zone>0&&(e.zone=0,r.zone(!1)),e.speed=qh(e.gt)*e.speedMul*(e.zone>0?1.12:1),e.dist+=e.speed*T,u>0&&e.gt>=u){N("temps");return}for(;e.nextWZ-e.dist<at.zSpawn;)g();e.px+=(e.tlane-e.px)*Math.min(1,T*at.laneLerp*(1+(e.speed/at.v0-1)*.5)),Math.abs(e.tlane-e.px)<.002&&(e.px=e.tlane),e.lane=Math.round(e.px),e.tilt*=Math.exp(-T*7),e.air&&(e.vy-=e.grav*T*(e.diving?1.5:1),e.py+=e.vy*T,e.py<=0&&(e.py=0,e.vy=0,e.air=!1,e.diving=!1,r.land(),e.slideBuf>0?C():e.jumpBuf>0&&D())),e.jumpBuf=Math.max(0,e.jumpBuf-T),e.slideBuf=Math.max(0,e.slideBuf-T),e.slide>0&&(e.slide-=T,e.slide<=0&&(e.slide=0)),e.invul=Math.max(0,e.invul-T),e.shield=Math.max(0,e.shield-T),e.magnet=Math.max(0,e.magnet-T),e.boost=Math.max(0,e.boost-T),e.gt-e.lastCoinT>at.comboWin&&e.combo>0&&(e.combo=0,e.mult=1);let he=e.slide>0?.45:1,W=e.px,K=e.py;for(let ee=0;ee<d.length;ee++){let te=d[ee];if(!te.on)continue;if(te.z=te.wz-e.dist,te.burst>0&&(te.burst-=T),te.z+te.len<-8){te.on=!1;continue}if(te.done)continue;let Ke=te.z-(te.type===2?.25:.35),Te=te.type===2?te.z+te.len:te.z+.35;if(Ke<.3&&Te>-.3&&Math.abs(W-te.lane)<.56&&(te.type===0?K<.48:te.type===1?K+he>.74:!0)){if(te.type===2&&Math.abs(W-e.tlane)>.22&&e.prevLane!==te.lane&&e.tlane===te.lane)e.tlane=e.prevLane,e.prevLane=te.lane,r.bump(0);else if(k(te),e.state!=="run")return}if(!te.crossed&&te.z+(te.type===2?te.len:0)<-.4&&(te.crossed=!0,!te.done)){let ke=!1;te.lane===e.tlane&&te.type===0&&e.gt-e.jumpAt<.38&&e.gt-e.jumpAt>0&&(ke=!0),te.lane===e.tlane&&te.type===1&&e.gt-e.slideAt<.34&&e.gt-e.slideAt>0&&(ke=!0),te.lane!==e.tlane&&te.lane===e.prevLane&&e.gt-e.laneT<.4&&(ke=!0),ke&&e.invul<=0&&(e.nearCount++,e.pts+=25*e.mult,e.lastCoinT=e.gt,r.near(te))}}let me=K+(e.slide>0?.3:.55);for(let ee=0;ee<h.length;ee++){let te=h[ee];if(te.on){if(te.z=te.wz-e.dist,te.z<-3){te.on=!1;continue}if(e.magnet>0&&!te.pw&&!te.fly&&te.z<13&&te.z>-.5&&Math.abs(te.x-W)<2.4&&(te.fly=!0),te.fly){let Ke=Math.min(1,T*14);te.x+=(W-te.x)*Ke,te.y+=(me-te.y)*Ke,te.wz+=(e.dist-te.wz)*Ke,te.z=te.wz-e.dist}Math.abs(te.z)<.45&&Math.abs(te.x-W)<.5&&Math.abs(te.y-me)<.78&&P(te)}}let Me=null;for(let ee=0;ee<d.length;ee++){let te=d[ee];if(te.on&&te.tuto&&!te.tdone&&te.z>.4&&te.z<e.speed*(te.evt?2.2:1.7)){Me=te;break}}if(!Me)for(let ee=0;ee<h.length;ee++){let te=h[ee];if(te.on&&te.tuto&&!te.tdone&&te.z>.4&&te.z<e.speed*2.2){Me=te;break}}Me&&Me.evt&&e.prompt!==Me&&r.evt(o),Me&&(Me.tdir==="right"&&e.tlane===1||Me.tdir==="left"&&e.tlane===-1||Me.tdir==="lr"&&e.tlane===Me.free)&&(Me.tdone=!0,e.bravo=.9,r.bravo()),e.prompt=Me,e.score=Math.floor(e.dist)+e.pts}function $(){let T=[];for(let X=0;X<d.length;X++){let he=d[X];he.on&&!he.done&&he.z+(he.type===2?he.len:0)>-1&&T.push({type:he.type===0?"haut":he.type===1?"bas":"mur",lane:he.lane,z:+he.z.toFixed(2),len:he.type===2?+he.len.toFixed(2):.7})}return T.sort(function(X,he){return X.z-he.z}),T}function J(){let T=[];for(let X=0;X<h.length;X++){let he=h[X];he.on&&he.z>-1&&T.push({lane:he.lane,z:+he.z.toFixed(2),y:+he.y.toFixed(2),bonus:he.pw})}return T.sort(function(X,he){return X.z-he.z}),T}E();for(let T=0;T<d.length;T++)d[T].on&&(d[T].z=d[T].wz);for(let T=0;T<h.length;T++)h[T].on&&(h[T].z=h[T].wz);let le=Object.keys(e).filter(function(T){let X=e[T];return typeof X!="object"&&typeof X!="function"});function j(){let T={};for(let X=0;X<le.length;X++)T[le[X]]=e[le[X]];return T.OBS=d.map(function(X){return Object.assign({},X)}),T.COINS=h.map(function(X){return Object.assign({},X)}),T.prompt=e.prompt,T.result=e.result,T.lastFree=e.lastFree,T.lastRowZ=e.lastRowZ,T}function re(T){for(let X=0;X<le.length;X++)e[le[X]]=T[le[X]];for(let X=0;X<d.length;X++)Object.assign(d[X],T.OBS[X]);for(let X=0;X<h.length;X++)Object.assign(h[X],T.COINS[X]);e.prompt=T.prompt,e.result=T.result,e.lastFree=T.lastFree,e.lastRowZ=T.lastRowZ}return e.snapshot=j,e.restore=re,e.update=Y,e.act=M,e.rnd=t,e.mkResult=I,e.endGame=N,e.obstacles=$,e.coinList=J,e}var O={box:fi,sphere:pi,cyl:as,cone:Js,ico:$s,torus:js,lathe:Ks,plane:zn,capsule:Ys},$h=new yt,Kh=new vn,jh=new Fn,Qh=new z,eu=new z,Mo=new et;function B(i,e,t,n,s){i=i.index?i.toNonIndexed():i,jh.set(n?n[0]:0,n?n[1]:0,n?n[2]:0),Kh.setFromEuler(jh),Qh.set(s?s[0]:1,s?s[1]:1,s?s[2]:1),eu.set(t?t[0]:0,t?t[1]:0,t?t[2]:0),$h.compose(eu,Kh,Qh),i.applyMatrix4($h);let r=i.attributes.position.count,a=new Float32Array(r*3);Mo.set(e);for(let o=0;o<r;o++)a[o*3]=Mo.r,a[o*3+1]=Mo.g,a[o*3+2]=Mo.b;return i.setAttribute("color",new it(a,3)),i.attributes.uv&&i.deleteAttribute("uv"),i}function Ni(i,e,t){let n=i.attributes.color,s=i.attributes.position;for(let r=0;r<n.count;r++){let a=Math.sin(s.getX(r)*12.9898+s.getY(r)*78.233+s.getZ(r)*37.719+(t||0))*43758.5453,o=1+(a-Math.floor(a)-.5)*e;n.setXYZ(r,n.getX(r)*o,n.getY(r)*o,n.getZ(r)*o)}return i}function lt(i){let e=0;for(let o of i)e+=o.attributes.position.count;let t=new Float32Array(e*3),n=new Float32Array(e*3),s=new Float32Array(e*3),r=0;for(let o of i)o.attributes.normal||o.computeVertexNormals(),t.set(o.attributes.position.array,r*3),n.set(o.attributes.normal.array,r*3),s.set(o.attributes.color.array,r*3),r+=o.attributes.position.count,o.dispose();let a=new Bt;return a.setAttribute("position",new it(t,3)),a.setAttribute("normal",new it(n,3)),a.setAttribute("color",new it(s,3)),a.computeBoundingSphere(),a}function gs(i,e,t){let n=i.attributes.position;for(let s=0;s<n.count;s++){let r=n.getX(s),a=n.getY(s),o=n.getZ(s),l=Math.sin(r*7.1+a*3.7+o*5.3+t*1.7)+Math.sin(r*2.3-o*4.1+t)*.6,c=1+l*e;n.setXYZ(s,r*c,a*(1+l*e*.6),o*c)}return i.computeVertexNormals(),i}var yi=null;function L0(){return yi||(yi=new Ei(new Uint8Array([95,170,255]),3,1,fs),yi.minFilter=yi.magFilter=Gt,yi.generateMipmaps=!1,yi.needsUpdate=!0,yi)}function So(i){return new Qs(Object.assign({vertexColors:!0,gradientMap:L0()},i||{}))}function Mr(i,e){let t=new Bn({color:e||1450026,side:Ht});return t.onBeforeCompile=function(n){n.uniforms.uOut={value:i},n.vertexShader=`uniform float uOut;
`+n.vertexShader.replace("#include <begin_vertex>","vec3 transformed = position + normal * uOut;")},t.customProgramCacheKey=function(){return"ol"+i},t}var _v=Math.PI/180;function bo(i,e,t){return i+(e-i)*t}function Sn(i,e,t,n){let s=new on;return s.position.set(e,t,n),i.add(s),s}function tu(i,e,t){t=t||{};let n=So(),s=Mr(t.outline||.018),r=[];function a(C,I,N){let k=lt(I),P=new Tt(k,n);if(C.add(P),r.push(P),!N){let Y=new Tt(k,s);P.add(Y)}return P}let o=Object.assign({peau:"#b9774f",cheveux:"#2a1a12",haut:"#1f8a8a",short:"#caaa6d",short2:"#0e2329",planche:"#f4ead2",bande:"#e3743c",yeux:"#1b1b1b",corps:"#6cc04a",ventre:"#d9f0a0",taches:"#3f8f2e",casquette:"#ef7aa0"},e||{}),l={kind:i,root:new on},c=l.root,u=Sn(c,0,0,0);l.body=u;let d=i==="margouillat",h=d?{hipY:.4,thigh:.17,shin:.17,torso:.3,upArm:.14,foreArm:.13,headR:.17,hipW:.1,shW:.13}:{hipY:.49,thigh:.23,shin:.23,torso:.31,upArm:.17,foreArm:.16,headR:.115,hipW:.085,shW:.15};l.P=h;let m=Sn(u,0,h.hipY,0);l.hips=m,a(m,d?[B(new O.sphere(.13,10,8),o.corps,[0,.02,0],null,[1,.9,.95])]:[B(new O.capsule(.085,.07,3,8),o.short,[0,.02,0],[0,0,Math.PI/2],[1,1,.85]),B(new O.box(.04,.12,.2),o.short2,[.075,-.02,0],null)]);function x(C){let I=Sn(m,C*h.hipW,-.01,0);a(I,d?[B(new O.capsule(.05,h.thigh-.04,3,7),o.corps,[0,-h.thigh/2,0])]:[B(new O.capsule(.058,h.thigh-.05,3,7),o.short,[0,-h.thigh/2+.02,0]),B(new O.capsule(.045,.06,2,6),o.peau,[0,-h.thigh+.04,0])]);let N=Sn(I,0,-h.thigh,0);a(N,[B(new O.capsule(.042,h.shin-.05,3,7),d?o.corps:o.peau,[0,-h.shin/2,0])]);let k=Sn(N,0,-h.shin,0);return a(k,d?[B(new O.sphere(.06,8,6),o.corps,[0,-.005,-.04],null,[1.15,.45,1.5]),B(new O.sphere(.022,6,5),o.ventre,[-.035,-.01,-.1]),B(new O.sphere(.022,6,5),o.ventre,[0,-.01,-.115]),B(new O.sphere(.022,6,5),o.ventre,[.035,-.01,-.1])]:[B(new O.box(.08,.04,.15),o.peau,[0,-.01,-.03])]),{th:I,sh:N,ft:k}}let S=x(-1),f=x(1);l.legL=S,l.legR=f;let p=Sn(m,0,.05,0);l.torso=p,a(p,d?[B(new O.capsule(.13,h.torso-.1,4,10),o.corps,[0,h.torso/2,0],null,[1,1,.92]),B(new O.capsule(.095,h.torso-.14,3,8),o.ventre,[0,h.torso/2-.01,-.055],null,[1,1,.7]),B(new O.sphere(.03,6,5),o.taches,[.07,h.torso*.7,.1]),B(new O.sphere(.025,6,5),o.taches,[-.06,h.torso*.45,.11]),B(new O.sphere(.022,6,5),o.taches,[.02,h.torso*.25,.12])]:[B(new O.capsule(.11,h.torso-.13,4,10),o.haut,[0,h.torso/2,0],null,[1.12,1,.78]),B(new O.box(.2,.035,.16),o.bande,[0,h.torso*.62,0],null),B(new O.capsule(.04,.05,2,6),o.peau,[0,h.torso+.03,0])]);let v=Sn(p,0,h.torso+(d?.06:.07),0);l.head=v,d?(a(v,[B(new O.sphere(h.headR,12,10),o.corps,[0,.08,-.03],null,[1.05,.85,1.15]),B(new O.sphere(.1,10,8),o.corps,[0,.03,-.14],null,[1.05,.6,1]),B(new O.sphere(.075,10,8),o.ventre,[0,-.01,-.12],null,[1.1,.4,1]),B(new O.sphere(.07,10,8),"#ffffff",[-.09,.17,-.07]),B(new O.sphere(.07,10,8),"#ffffff",[.09,.17,-.07]),B(new O.sphere(.04,8,6),o.yeux,[-.1,.18,-.125]),B(new O.sphere(.04,8,6),o.yeux,[.1,.18,-.125]),B(new O.sphere(.013,5,4),"#ffffff",[-.11,.2,-.16]),B(new O.sphere(.013,5,4),"#ffffff",[.09,.2,-.16]),B(new O.torus(.07,.012,5,12,Math.PI),"#28401c",[0,.02,-.215],[Math.PI*.62,0,Math.PI],[1,1,1])]),a(v,[B(new O.sphere(.12,10,6,0,Math.PI*2,0,Math.PI/2),o.casquette,[0,.19,0],null,[1.1,.7,1.1]),B(new O.cyl(.13,.13,.015,12,1,!1,-Math.PI*.35,Math.PI*.7),o.casquette,[0,.2,-.045],[0,Math.PI,0])])):a(v,[B(new O.sphere(h.headR,12,10),o.peau,[0,.07,0],null,[.95,1.05,1]),B(new O.sphere(h.headR*1.04,12,8,0,Math.PI*2,0,Math.PI*.55),o.cheveux,[0,.085,.012],[-.25,0,0],[1,1,1.02]),B(new O.cone(.035,.07,5),o.cheveux,[.05,.19,.02],[.4,0,-.5]),B(new O.cone(.035,.07,5),o.cheveux,[-.04,.19,.03],[.5,0,.4]),B(new O.cone(.035,.07,5),o.cheveux,[0,.18,.08],[1.1,0,0]),B(new O.sphere(.022,6,5),o.peau,[0,.06,-.115]),B(new O.sphere(.016,6,5),o.yeux,[-.04,.09,-.103]),B(new O.sphere(.016,6,5),o.yeux,[.04,.09,-.103]),B(new O.sphere(.022,6,5),o.peau,[-.115,.07,0],null,[.6,1,1]),B(new O.sphere(.022,6,5),o.peau,[.115,.07,0],null,[.6,1,1])]);function E(C){let I=Sn(p,C*h.shW,h.torso-.04,0);a(I,[B(new O.capsule(d?.036:.042,h.upArm-.04,3,7),d?o.corps:o.peau,[0,-h.upArm/2,0])]);let N=Sn(I,0,-h.upArm,0);return a(N,d?[B(new O.capsule(.032,h.foreArm-.04,3,7),o.corps,[0,-h.foreArm/2,0]),B(new O.sphere(.04,8,6),o.corps,[0,-h.foreArm-.01,0],null,[1.2,.7,1])]:[B(new O.capsule(.036,h.foreArm-.04,3,7),o.peau,[0,-h.foreArm/2,0]),B(new O.sphere(.042,8,6),o.peau,[0,-h.foreArm-.012,0])]),{sh:I,el:N}}let b=E(-1),R=E(1);if(l.armL=b,l.armR=R,l.tail=[],d){let C=Sn(m,0,0,.1),I=.07;for(let N=0;N<5;N++){let k=Sn(C,0,0,N===0?0:.11);a(k,[B(new O.capsule(I*(1-N*.16),.08,2,7),N%2?o.taches:o.corps,[0,0,.055],[Math.PI/2,0,0])],N>2),l.tail.push(k),C=k}}if(t.planche||i==="surfeur"){let C=Sn(c,0,0,0);l.board=C;let I=[];a(C,[B(new O.sphere(.5,16,6),o.planche,[0,.03,0],null,[.3,.06,1]),B(new O.sphere(.5,16,6),o.bande,[0,.037,0],null,[.06,.06,.98]),B(new O.cone(.03,.08,4),o.short2,[0,-.015,.36],[Math.PI,0,0])])}let w={t:0,ph:0,blink:0,hit:0,land:0,sq:0},g={};function M(C,I,N,k){let P=C.uuid+I,Y=g[P]==null?N:g[P],$=bo(Y,N,k);g[P]=$,C.rotation[I]=$}function D(C,I,N,k){let P=C.uuid+"p"+I,Y=g[P]==null?N:g[P],$=bo(Y,N,k);g[P]=$,C.position[I]=$}return l.update=function(C,I){w.t+=C;let N=Math.min(1,C*16),k=Math.min(1,C*9),P=Math.min(1,C*5),Y=I.mode,$=Math.max(.6,I.speedK||1);w.ph+=C*(d?11.5:2.4)*(Y==="run"?Math.sqrt($):.5);let J=w.ph,le=Math.sin(J),j=Math.cos(J);w.hit=Math.max(0,w.hit-C*2.5),w.land=Math.max(0,w.land-C*5);let re=I.lean||0,T=h.hipY,X=0,he=0,W=0,K=0,me=0,Me=0,ee=0,te=0,Ke=0,Te=0,ke=0,ut=0,Fe=[0,0],dt=[0,0],rt=0,He=0,je=0,St=0,qe=[0,.15],tt=[0,-.15],Oe=0,st=0,F=0,Nt=0,ze=0,nt=0,de=0,bt=0,De=0,Be=0;if(d)if(Y==="run"||Y==="hit")Fe=[le*.95,.02],dt=[-le*.95,-.02],rt=Math.max(0,-j)*1.4+.15,He=Math.max(0,j)*1.4+.15,je=-.3*le,St=.3*le,qe=[-le*.9,.35],tt=[le*.9,-.35],Oe=-1.2,st=-1.2,T=h.hipY-.02+Math.abs(j)*.035,ee=.32,Te=-.25,ut=le*.06,te=le*.15,W=-re*.35,me=-re*.25,ze=Math.sin(J)*.35,nt=-.15;else if(Y==="air"){let _=I.airT||0;Fe=[-1.1,.1],dt=[-.5,-.1],rt=1.6,He=1.1,qe=[-2.5,.5],tt=[-2.3,-.5],Oe=-.4,st=-.4,ee=_<.5?-.15:.25,Te=-.2,ze=0,nt=.5,I.boost&&(K=-_*Math.PI*2),W=-re*.3}else if(Y==="slide")T=.13,K=-1.35,Fe=[.2,.25],dt=[.2,-.25],rt=.6,He=.6,qe=[-2.9,.4],tt=[-2.9,-.4],Oe=0,st=0,Te=1,ee=0,ze=Math.sin(w.t*20)*.2,nt=-.3,Me=0,W=-re*.3;else if(Y==="dead"){let _=Math.min(1,(I.dieT||0)/.6);T=bo(h.hipY,.1,_),K=bo(0,1.45,_),Fe=[-1.2,.4],dt=[-1,-.4],rt=.3,He=.5,qe=[-2.8,1.2],tt=[-2.6,-1.2],Te=-.4,nt=.6*_,ze=.3}else if(Y==="win"){let _=Math.abs(Math.sin(w.t*6));Me=_*.25,qe=[-3,.6+Math.sin(w.t*12)*.3],tt=[-3,-.6-Math.sin(w.t*12)*.3],Oe=-.3,st=-.3,rt=.3+(1-_)*.6,He=rt,Fe=[-.3*(1-_),.1],dt=[-.3*(1-_),-.1],ze=Math.sin(w.t*14)*.6,Te=-.25,me=Math.sin(w.t*3)*.3}else{let _=Math.sin(w.t*2.2);T=h.hipY+_*.01,ee=.05+_*.03,Te=-.1,ke=Math.sin(w.t*.7)*.35,qe=[.1,.25],tt=[.1,-.25],Oe=-.4,st=-.4,rt=.1,He=.1,ze=Math.sin(w.t*1.6)*.5,nt=-.1}else{he=-1.05;let G=Y==="run"?Math.sin(w.t*2.6*Math.sqrt($)):Math.sin(w.t*1.6)*.5;if(T=h.hipY-.07-G*.025-w.land*.08,Fe=[-.35,-.42],dt=[.5,.42],rt=.7+G*.08,He=.95+G*.08,je=-.35,St=-.55,ee=.38,te=.55+re*.25,Ke=.1,Te=-.25,ke=.85,qe=[-.2,1.05+G*.08],tt=[.1,-1-G*.08],Oe=-.35,st=-.25,W=-re*.5,me=-re*.35,bt=-re*.45,De=-re*.35,de=-.04,Y==="air"){let ce=I.airT||0;T=h.hipY-.2,rt=1.7,He=1.8,Fe=[-1,-.4],dt=[-.3,.4],tt=[.6,-.4],st=-1.6,qe=[-1.4,1.4],ee=.6,de=Math.sin(ce*Math.PI)*-.35,Be=0,I.boost&&(me=ce*Math.PI*2,De=me)}else if(Y==="slide")T=.19,rt=2.1,He=2.2,Fe=[-1.3,-.5],dt=[-.6,.5],ee=.95,Te=-.75,qe=[-.6,1.4],Oe=0,tt=[.9,-.6],st=-.3,de=.05;else if(Y==="dead"){let ce=Math.min(1,(I.dieT||0)/.7);Me=Math.sin(ce*Math.PI)*.5,K=-ce*2.4,W=ce*.8,qe=[-2.9,1.4],tt=[-2.9,-1.4],rt=.2,He=.3,Fe=[-.6,-.5],dt=[.4,.6],de=ce*.9,bt=ce*1.5,Be=Math.sin(ce*Math.PI)*.35}else Y==="win"?(T=h.hipY-.03,ee=.05,qe=[-2.9,.4],tt=[-2.9+Math.sin(w.t*10)*.3,-.4],Oe=-.2,st=-.2,Te=-.3,rt=.3,He=.4):Y==="idle"&&(T=h.hipY-.04,rt=.45,He=.55,ee=.15,qe=[0,.4],tt=[0,-.4],Oe=-.25,st=-.25,ke=.7+Math.sin(w.t*.6)*.25)}if(w.hit>0){let _=Math.sin(w.t*40)*w.hit;W+=_*.5,ee-=w.hit*.4,Te+=_*.3}let A=w.land;D(c,"y",Me,k),M(u,"x",K,Y==="dead"?P:k),M(u,"z",W,k),M(u,"y",me,k),u.scale.set(1+A*.12,1-A*.18,1+A*.12),D(m,"y",T,N),D(m,"x",X,N),M(m,"y",he,k),M(S.th,"x",Fe[0],N),M(S.th,"z",Fe[1],N),M(f.th,"x",dt[0],N),M(f.th,"z",dt[1],N),M(S.sh,"x",rt,N),M(f.sh,"x",He,N),M(S.ft,"x",je,N),M(f.ft,"x",St,N),M(p,"x",ee,k),M(p,"y",te,k),M(p,"z",Ke,k),M(v,"x",Te,k),M(v,"y",ke,P),M(v,"z",ut,k),M(b.sh,"x",qe[0],N),M(b.sh,"z",qe[1],N),M(R.sh,"x",tt[0],N),M(R.sh,"z",tt[1],N),M(b.sh,"y",F,N),M(R.sh,"y",Nt,N),M(b.el,"x",Oe,N),M(R.el,"x",st,N);for(let _=0;_<l.tail.length;_++)M(l.tail[_],"y",ze*(.5+_*.3)*Math.cos(w.t*0+_*.6),k),M(l.tail[_],"x",nt*(_?.6:1)+(_?.08:0),k);l.board&&(M(l.board,"x",de,k),M(l.board,"z",bt,k),M(l.board,"y",De,k),D(l.board,"y",Be,k))},l.onLand=function(){w.land=1},l.onHit=function(){w.hit=1},l.meshes=r,l}var Pt=Math.PI;function an(i,e,t){return i&&i[e]||t}function xt(i,e){let t=Math.sin(i*91.17+e*13.37)*43758.5453;return t-Math.floor(t)}var Zl={filao(i,e){let t=7+xt(e,1)*4,n=[B(new O.cyl(.09,.18,t,6),an(i,"tronc","#5a4636"),[0,t/2,0],[0,0,(xt(e,2)-.5)*.12])];for(let s=0;s<5;s++){let r=t*(.45+s*.13),a=1.5-s*.18+xt(e,s+3)*.4;n.push(Ni(B(new O.cone(a,1.8,7,1,!0),s%2?an(i,"filao","#2f5a2a"):an(i,"filao2","#3d6b2f"),[(xt(e,s)-.5)*.6,r,(xt(e,s+9)-.5)*.6],[Pt,xt(e,s+4)*2,0],[1,1,1]),.25,e+s))}return lt(n)},cocotier(i,e){let t=6+xt(e,1)*3,n=(xt(e,2)-.3)*.5,s=[];for(let a=0;a<6;a++){let o=t/6*a,l=Math.sin(n)*o*o/t*.9;s.push(B(new O.cyl(.17-a*.012,.2-a*.012,t/6+.05,7),a%2?an(i,"tronc","#8a6b4a"):"#9c7b55",[l,o+t/12,0],[0,0,-n*(o/t)*1.4]))}let r=Math.sin(n)*t*.9;for(let a=0;a<8;a++){let o=a/8*Pt*2+xt(e,a)*.4;s.push(B(new O.box(.5,.05,2.6),a%2?an(i,"palme","#3e7d32"):"#4f9a3a",[r+Math.cos(o)*1.1,t-.35,Math.sin(o)*1.1],[.55,-o+Pt/2,0],[1,1,1]))}return s.push(B(new O.sphere(.22,6,5),"#6b4a22",[r+.15,t-.45,.1]),B(new O.sphere(.22,6,5),"#6b4a22",[r-.12,t-.5,-.12])),lt(s)},buisson(i,e){let t=[];for(let n=0;n<4;n++)t.push(Ni(B(new O.ico(.6+xt(e,n)*.4,0),n%2?an(i,"filao","#2f5a2a"):"#4c7a35",[(xt(e,n+1)-.5)*1.4,.4,(xt(e,n+2)-.5)*1.4]),.3,e));return lt(t)},rocher_noir(i,e){let t=[];for(let n=0;n<3;n++)t.push(gs(B(new O.ico(.8+xt(e,n)*.9,1),n?an(i,"roche","#2a2a2e"):"#3a3a40",[(xt(e,n+3)-.5)*2.2,.2,(xt(e,n+5)-.5)*2],null,[1.2,.7,1]),.12,e+n));return lt(t)},parasol(i,e){let t=xt(e,1)<.5?an(i,"toile","#c9b48e"):an(i,"toile2","#e3743c");return lt([B(new O.cyl(.05,.05,2.4,5),"#6d4c35",[0,1.2,0]),Ni(B(new O.cone(1.5,.55,8,1,!0),t,[0,2.45,0]),.1,e),B(new O.cone(1.5,.55,8,1,!1),t,[0,2.45,0],[0,0,0],[1,1,1])])},transat(i,e){let t=xt(e,2)<.5?an(i,"coussin","#1f8a8a"):an(i,"coussin2","#d8a43a");return lt([B(new O.box(.7,.12,1.4),"#ab805f",[0,.3,0]),B(new O.box(.62,.1,1.2),"#f5eee2",[0,.4,.05]),B(new O.box(.62,.1,.7),t,[0,.62,-.62],[-.7,0,0])])},lit_balinais(i,e){let t=[B(new O.box(2,.4,2),"#f5eee2",[0,.25,0]),B(new O.box(2.1,.12,2.1),"#6d4c35",[0,.06,0])];for(let[n,s]of[[-.95,-.95],[.95,-.95],[-.95,.95],[.95,.95]])t.push(B(new O.box(.1,2.3,.1),"#ab805f",[n,1.2,s]));return t.push(B(new O.box(2.2,.1,2.2),"#e7cf98",[0,2.35,0])),t.push(B(new O.box(.6,.25,.4),xt(e,1)<.5?"#1f8a8a":"#d8a43a",[-.5,.55,-.6]),B(new O.box(.6,.25,.4),"#2e7d5b",[.5,.55,-.6])),lt(t)},bouee_filet(i,e){return lt([B(new O.sphere(.32,8,6),xt(e,1)<.5?"#f6c33a":"#f2f2f2",[0,.1,0])])},passerelle(i,e){let t=[];for(let n=0;n<8;n++)t.push(B(new O.box(1.4,.08,.32),n%2?"#9d835b":"#7f552c",[0,.12,-1.4+n*.4]));return t.push(B(new O.box(.08,.6,3.2),"#633515",[-.72,.35,0]),B(new O.box(.08,.6,3.2),"#633515",[.72,.35,0])),lt(t)},lampion(i,e){return lt([B(new O.cyl(.04,.05,3,5),"#392417",[0,1.5,0]),B(new O.sphere(.25,8,6),"#facc76",[0,3.05,0])])},feu_boma(i,e){let t=[B(new O.cyl(1.1,1.2,.35,12),"#3d3a36",[0,.17,0]),B(new O.cyl(.85,.85,.1,12),"#1d1a18",[0,.36,0])];for(let n=0;n<4;n++)t.push(B(new O.cyl(.08,.1,1.2,5),"#5a3a22",[0,.5,0],[Pt/2,n/4*Pt,.2]));t.push(B(new O.cone(.45,1.1,6),"#f2a03d",[0,.95,0]),B(new O.cone(.28,.8,6),"#ffe08a",[.1,.9,.05]));for(let n=0;n<8;n++){let s=n/8*Pt*2;t.push(B(new O.box(.5,.35,.5),"#e7cf98",[Math.cos(s)*2.3,.18,Math.sin(s)*2.3],[0,-s,0]))}return lt(t)},boma_pavillon(i,e){let t=[B(new O.box(8,.4,6),"#e6d4c3",[0,.2,0]),B(new O.box(7.6,3,.3),"#f5eee2",[0,1.9,2.8])];for(let n=0;n<16;n++)t.push(B(new O.box(.12,3,.12),n%2?"#ab805f":"#af8665",[-3.75+n*.5,1.9,-2.8]));for(let n=0;n<9;n++)t.push(B(new O.box(.18,.22,6.2),"#6d4c35",[-3.8+n*.95,3.5,0]));return t.push(B(new O.box(8.2,.25,.25),"#392417",[0,3.35,-3]),B(new O.box(8.2,.25,.25),"#392417",[0,3.35,3])),t.push(B(new O.torus(.75,.12,6,16),"#392417",[-2,1.9,2.62]),B(new O.torus(.75,.12,6,16),"#392417",[2,1.9,2.62])),t.push(B(new O.box(1.6,.5,.15),"#0e2329",[0,3,-3.1])),t.push(B(new O.box(8.4,.2,6.4),"#e6d4c3",[0,3.75,0]),B(new O.box(8.4,.5,.08),"#caaa6d",[0,4.1,-3.2])),lt(t)},snack(i,e){let t=5+xt(e,1)*3,n=2.8+(xt(e,2)<.35?2.6:0),s=["#f2e6cf","#e9d1a8","#f7f1e3","#d9e4dd","#f3d9c4"][Math.floor(xt(e,3)*5)],r=["#5b3a29","#3d4a52","#7a4e2a","#8c3b2b"][Math.floor(xt(e,4)*4)],a=[B(new O.box(t,n,4),s,[0,n/2,0]),B(new O.box(t+.6,.35,4.6),r,[0,n+.15,0])];return a.push(B(new O.box(t*.7,1.2,.1),"#24313a",[0,1.4,-2.02])),a.push(B(new O.box(t*.5,.45,.1),xt(e,5)<.5?"#c2552b":"#1f8a8a",[0,n-.45,-2.06])),a.push(B(new O.box(t,.1,2),["#e3743c","#1f8a8a","#f6c33a","#c2552b"][Math.floor(xt(e,6)*4)],[0,2.3,-3],[.18,0,0])),a.push(B(new O.box(.1,2.2,.1),"#6d4c35",[-t/2+.2,1.1,-3.9]),B(new O.box(.1,2.2,.1),"#6d4c35",[t/2-.2,1.1,-3.9])),lt(a)},case_bambou(i,e){let t=[B(new O.box(8,.3,6),"#7a4e2a",[0,.15,0])];for(let n=0;n<6;n++)for(let s of[-2.8,2.8])t.push(B(new O.cyl(.13,.13,3,6),n%2?"#c9a55a":"#b8944a",[-3.7+n*1.48,1.8,s]));for(let n=0;n<6;n++)for(let s of[-2.8,2.8])for(let r of[1,2])t.push(B(new O.cyl(.15,.15,.06,6),"#8a6a2f",[-3.7+n*1.48,r,s]));for(let n=0;n<26;n++)t.push(B(new O.cyl(.08,.08,2.8,5),n%3?"#c9a55a":"#a8873f",[-3.9+n*.31,1.7,2.7]));t.push(Ni(B(new O.box(9.2,.35,4.2),"#d8b46a",[0,3.85,-1.5],[.42,0,0]),.2,e)),t.push(Ni(B(new O.box(9.2,.35,4.2),"#c9a55a",[0,3.85,1.5],[-.42,0,0]),.2,e+1)),t.push(B(new O.box(9.3,.12,.6),"#9c7a3c",[0,4.7,0]));for(let n=0;n<18;n++)t.push(B(new O.cone(.28,.45,4),"#d8b46a",[-4.3+n*.5,2.85,-3.4],[Pt,0,0]));t.push(B(new O.box(3.6,.7,.12),"#f7f1e3",[0,3.15,-3.45]),B(new O.box(3.2,.22,.14),"#c2552b",[0,3.15,-3.47])),t.push(B(new O.box(3.4,1,.9),"#7a4e2a",[1.6,.8,1.6]),B(new O.box(3,.45,.7),"#cfe9f2",[1.6,1.5,1.6]));for(let n=0;n<6;n++)t.push(B(new O.sphere(.13,6,5),["#ef7aa0","#fff1c9","#f2a03d","#6b3a22","#f7f7f2","#a8d82e"][n],[.4+n*.48,1.42,1.6]));for(let n=0;n<3;n++){let s=-3+n*1.8,r=-1.4+n%2*.9;t.push(B(new O.cyl(.45,.45,.07,8),"#9d835b",[s,1.05,r]),B(new O.cyl(.05,.05,.75,5),"#633515",[s,.67,r]));for(let a of[-.6,.6])t.push(B(new O.box(.42,.06,.42),"#a8d82e",[s+a,.75,r]),B(new O.box(.42,.5,.06),"#a8d82e",[s+a*1.35,1,r],[0,Pt/2,0]))}return lt(t)},cornet_geant(i,e){let t=[B(new O.cone(.9,3.2,10),"#d9a35b",[0,2.1,0],[Pt,0,0])];for(let n=0;n<5;n++)t.push(B(new O.torus(.85-n*.16,.035,4,12),"#b07a3a",[0,3.3-n*.6,0],[Pt/2,0,0]));return t.push(B(new O.sphere(.95,12,10),"#ef7aa0",[0,3.9,0]),B(new O.sphere(.8,12,10),"#fff1c9",[.15,4.95,.05]),B(new O.sphere(.6,10,8),"#f2a03d",[-.1,5.8,0])),t.push(B(new O.cyl(.6,.8,.5,8),"#7a4e2a",[0,.25,0])),lt(t)},chaise_anis(i,e){return lt([B(new O.box(.45,.06,.45),"#a8d82e",[0,.45,0]),B(new O.box(.45,.5,.06),"#a8d82e",[0,.7,.2]),B(new O.box(.05,.45,.05),"#6e9b1c",[.18,.22,.18]),B(new O.box(.05,.45,.05),"#6e9b1c",[-.18,.22,-.18])])},lampadaire(i,e){return lt([B(new O.cyl(.06,.08,3.6,6),"#3d4a52",[0,1.8,0]),B(new O.box(.6,.12,.25),"#3d4a52",[.25,3.6,0]),B(new O.sphere(.14,6,5),"#fff1c9",[.45,3.5,0])])},poubelle(i,e){return lt([B(new O.cyl(.3,.27,.8,8),"#2e7d5b",[0,.4,0])])},hotel(i,e){let t=[];for(let n=0;n<4;n++)t.push(B(new O.box(9,3+n%2*2,7),n%2?"#f7f3ea":"#ece6da",[n*8.5,1.5+n%2,n%2*2]),B(new O.box(9.4,.4,7.4),"#b2463a",[n*8.5,3.2+n%2*2,n%2*2]));return lt(t)},falaise(i,e){let t=[];for(let n=0;n<7;n++)t.push(gs(B(new O.ico(9+xt(e,n)*6,1),n%2?an(i,"colline","#8c8a55"):"#6f7048",[n*12,-2+xt(e,n+1)*4,(xt(e,n+2)-.5)*10],null,[1.3,1,1]),.1,e+n));return lt(t)},montagne(i,e){let t=[];for(let n=0;n<9;n++)t.push(B(new O.cone(60+xt(e,n)*30,34+xt(e,n+3)*14+(n===5?10:0),6),n%2?an(i,"brume","#7e93a8"):an(i,"brume2","#8aa0b2"),[n*70-280,0,(xt(e,n+5)-.5)*40],[0,xt(e,n)*3,0],[1,1,.6]));return lt(t)},nuage(i,e){let t=[];for(let n=0;n<5;n++)t.push(B(new O.sphere(3+xt(e,n)*2.5,8,6),"#ffffff",[n*4-8,xt(e,n+1)*2,0],null,[1,.6,.8]));return lt(t)}},nu={bouee(i,e){return lt([B(new O.cyl(.42,.5,.42,10),"#f26b2a",[0,.18,0]),B(new O.cyl(.43,.43,.1,10),"#ffffff",[0,.3,0]),B(new O.cone(.16,.6,6),"#f26b2a",[0,.7,0]),B(new O.sphere(.09,6,5),"#ffe08a",[0,1.02,0])])},tronc(i,e){return lt([B(new O.cyl(.24,.26,1.15,8),"#6d4c35",[0,.18,0],[0,0,Pt/2]),B(new O.cyl(.2,.2,1.17,8),"#c9a874",[0,.18,0],[0,0,Pt/2],[1,1,1]),B(new O.box(.08,.3,.05),"#3e7d32",[.2,.45,0])])},recif(i,e){return lt([gs(B(new O.ico(.48,1),"#3a3a40",[0,.12,0],null,[1.15,.6,.8]),.12,e),B(new O.sphere(.12,6,4),"#e86a8a",[.25,.4,.1]),B(new O.cone(.08,.3,5),"#f6c33a",[-.25,.42,0])])},banc(i,e){let t=[B(new O.box(1.05,.08,.45),"#9d835b",[0,.42,0])];for(let n=0;n<3;n++)t.push(B(new O.box(1.05,.04,.12),n%2?"#7f552c":"#af8665",[0,.47,-.15+n*.15]));return t.push(B(new O.box(.1,.4,.4),"#3d4a52",[-.42,.2,0]),B(new O.box(.1,.4,.4),"#3d4a52",[.42,.2,0])),lt(t)},crabe(i,e){let t=[B(new O.sphere(.3,10,6),"#e2552d",[0,.25,0],null,[1.3,.55,1])];for(let n of[-1,1]){t.push(B(new O.sphere(.13,7,5),"#e2552d",[n*.42,.33,-.25],null,[1,.7,1.2]));for(let s=0;s<3;s++)t.push(B(new O.cyl(.03,.03,.35,4),"#c2441f",[n*.38,.12,-.1+s*.13],[0,0,n*1]));t.push(B(new O.sphere(.06,6,5),"#ffffff",[n*.1,.45,-.18]),B(new O.sphere(.035,5,4),"#111111",[n*.1,.47,-.23]))}return lt(t)},levre(i,e){let t=[];for(let n=0;n<7;n++){let s=n/6,r=-.62+s*1.24,a=1.25+Math.sin(s*Pt)*.12;t.push(B(new O.sphere(.3,8,6),n%2?"#e8f7fb":"#bfeef2",[r,a,0],null,[1.2,.85,1.1]))}return t.push(B(new O.cyl(.06,.06,.6,5),"#e8f7fb",[-.62,.95,0]),B(new O.cyl(.06,.06,.6,5),"#e8f7fb",[.62,.95,0])),lt(t)},banderole(i,e){return lt([B(new O.cyl(.07,.07,1.9,6),"#c9a55a",[-.56,.95,0]),B(new O.cyl(.07,.07,1.9,6),"#c9a55a",[.56,.95,0]),B(new O.box(1.2,.42,.06),"#f7f1e3",[0,1.12,0]),B(new O.box(1.05,.12,.07),an(i,"accent","#ef7aa0"),[0,1.12,0]),B(new O.cone(.08,.16,3),"#f2a03d",[-.4,.85,0],[Pt,0,0]),B(new O.cone(.08,.16,3),"#a8d82e",[0,.85,0],[Pt,0,0]),B(new O.cone(.08,.16,3),"#c2552b",[.4,.85,0],[Pt,0,0])])},rocher(i,e){let t=[gs(B(new O.ico(.62,1),"#2a2a2e",[0,.55,0],null,[.9,1.4,.9]),.1,e),gs(B(new O.ico(.4,1),"#3a3a40",[.15,1.35,.1]),.12,e+2)];return t.push(B(new O.ico(.25,0),"#4f7a6a",[-.2,1.65,-.1])),lt(t)},stand_crepes(i,e){let t=[B(new O.box(1,1,1),"#f7f1e3",[0,.55,0]),B(new O.box(1.04,.2,1.04),"#c2552b",[0,1.1,0])];t.push(B(new O.box(1.1,.06,1.1),"#d8b46a",[0,1.85,0]));for(let[n,s]of[[-.46,-.46],[.46,-.46],[-.46,.46],[.46,.46]])t.push(B(new O.cyl(.04,.04,.7,5),"#c9a55a",[n,1.5,s]));return t.push(B(new O.box(.7,.24,.05),"#f7f1e3",[0,1.98,-.52]),B(new O.cyl(.18,.18,.03,10),"#d9a35b",[0,1.22,-.2])),t.push(B(new O.cyl(.1,.1,.12,8),"#3d3a36",[0,.05,-.4],[Pt/2,0,0]),B(new O.cyl(.1,.1,.12,8),"#3d3a36",[0,.05,.4],[Pt/2,0,0])),lt(t)}},Sr={coquillage(i){let e=[];for(let t=0;t<5;t++)e.push(B(new O.sphere(.2-t*.032,8,6),t%2?"#ffd7e2":"#f7f1e3",[0,.02+t*.07,0],null,[1,.75,1]));return e.push(B(new O.cone(.18,.28,8),"#f4a6b8",[0,-.12,0],[Pt,0,0])),lt(e)},boule_glace(i){return lt([B(new O.cone(.13,.32,8),"#d9a35b",[0,-.12,0],[Pt,0,0]),B(new O.sphere(.17,10,8),"#ffffff",[0,.1,0])])},etoile(i){let e=[];for(let t=0;t<5;t++){let n=t/5*Pt*2;e.push(B(new O.cone(.12,.34,4),"#f6c33a",[Math.sin(n)*.17,Math.cos(n)*.17,0],[0,0,-n]))}return e.push(B(new O.sphere(.13,8,6),"#ffd35a",[0,0,0],null,[1,1,.5])),lt(e)},aimant(i){return lt([B(new O.torus(.2,.07,6,12,Pt),"#e2452d",[0,.02,0],[0,0,0]),B(new O.box(.14,.12,.14),"#e8e8e8",[-.2,-.04,0]),B(new O.box(.14,.12,.14),"#e8e8e8",[.2,-.04,0])])},dauphin(i){return lt([B(new O.sphere(.25,10,8),"#7f9fb5",[0,0,0],null,[.6,.6,1.4]),B(new O.cone(.08,.2,4),"#5f7f95",[0,.18,.02]),B(new O.cone(.12,.2,4),"#5f7f95",[0,0,.38],[Pt/2,0,0],[1.6,1,.4]),B(new O.sphere(.12,8,6),"#eef3f6",[0,-.07,-.08],null,[.8,.5,1.6])])},cornet(i){return lt([B(new O.cone(.16,.45,8),"#d9a35b",[0,-.15,0],[Pt,0,0]),B(new O.sphere(.17,8,6),"#ef7aa0",[0,.12,0]),B(new O.sphere(.14,8,6),"#fff1c9",[0,.32,0])])}};var cn=1.3,Jl=Math.PI,$l=`
uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
vec3 applyFog(vec3 c, float d){ float f = smoothstep(fogNear, fogFar, d); return mix(c, fogColor, f); }`;function zt(i){return new et(i)}function D0(i){let e=i.eau;return new rn({uniforms:{uT:{value:0},uDist:{value:0},uLagon:{value:zt(e.lagon)},uLarge:{value:zt(e.large)},uMousse:{value:zt(e.mousse)},uShore:{value:e.rivage},uSide:{value:e.cote},uCalme:{value:e.calme||0},fogColor:{value:zt(i.brume)},fogNear:{value:i.brumeDe},fogFar:{value:i.brumeA}},vertexShader:`
uniform float uT, uDist, uCalme; varying float vH; varying float vX; varying float vW; varying float vD;
float wave(float x, float w){ return 0.07*sin(x*0.7 + w*0.35 + uT*1.6) + 0.05*sin(-x*0.45 + w*0.9 - uT*2.1) + 0.03*sin(x*1.9 - w*1.4 + uT*3.0); }
void main(){ vec3 p = position; float w = uDist - p.z; float k = mix(1.0, 0.35, uCalme);
  vH = wave(p.x, w) * k; p.y += vH; vX = p.x; vW = w;
  vec4 mv = modelViewMatrix * vec4(p,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,fragmentShader:$l+`
uniform float uT, uShore, uSide; uniform vec3 uLagon, uLarge, uMousse; varying float vH; varying float vX; varying float vW; varying float vD;
void main(){
  float dS = (uShore - vX) * uSide;                // distance au rivage (positive côté large)
  float deep = smoothstep(4.0, 26.0, dS);
  vec3 c = mix(uLagon, uLarge, floor(deep*3.0+0.35)/3.0);
  c *= 0.93 + 0.12*step(0.045, vH);               // crêtes plus claires (aplats « cartoon »)
  // traînées de mousse qui défilent
  float n = sin(vX*2.3 + sin(vW*0.31)*2.4) * sin(vW*0.83 + vX*0.6 - uT*0.7);
  float foam = step(0.93, n) * (0.5 + 0.5*step(0.97, n));
  // bande d'écume au rivage, ondulée
  float edge = dS + sin(vW*0.5 + uT*1.3)*0.7 + sin(vW*1.7 - uT*2.0)*0.25;
  foam = max(foam, step(edge, 1.3) * step(-0.5, edge));
  foam = max(foam, step(edge, 2.6) * step(1.9, edge) * 0.6);
  c = mix(c, uMousse, foam);
  gl_FragColor = vec4(applyFog(c, vD), 1.0);
}`})}function N0(i){let e=i.sol.bandes,t=8,n=[],s=[],r=[];for(let a=0;a<t;a++){let o=e[Math.min(a,e.length-1)];n.push(a<e.length?o[0]:1e4),s.push(zt(o[1])),r.push(o[2]||0)}return new rn({uniforms:{uDist:{value:0},uX:{value:n},uC:{value:s},uP:{value:r},fogColor:{value:zt(i.brume)},fogNear:{value:i.brumeDe},fogFar:{value:i.brumeA}},vertexShader:`uniform float uDist; varying float vX; varying float vW; varying float vD;
void main(){ vec3 p = position; vX = p.x; vW = uDist - p.z; vec4 mv = modelViewMatrix * vec4(p,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,fragmentShader:$l+`
uniform float uX[8]; uniform vec3 uC[8]; uniform float uP[8]; varying float vX; varying float vW; varying float vD;
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec3 c = uC[7]; float pat = uP[7]; float x0 = -1e4;
  for (int i = 0; i < 8; i++) { if (vX < uX[i]) { c = uC[i]; pat = uP[i]; break; } x0 = uX[i]; }
  float lx = vX - x0;
  if (pat > 0.5 && pat < 1.5) { // dalles
    vec2 g = vec2(lx/1.3, vW/1.3); vec2 f = fract(g); float j = step(f.x, 0.04) + step(f.y, 0.05);
    c *= 0.94 + 0.1*h21(floor(g)); c = mix(c, c*0.78, min(1.0, j)); }
  else if (pat > 1.5 && pat < 2.5) { // planches
    float f = fract(lx/0.42); c *= 0.9 + 0.12*h21(vec2(floor(lx/0.42), floor(vW/3.0))); c = mix(c, c*0.65, step(f, 0.06)); }
  else if (pat > 2.5 && pat < 3.5) { // sable
    c *= 0.95 + 0.07*h21(floor(vec2(vX*3.0, vW*3.0))); }
  else if (pat > 3.5) { c *= 0.9 + 0.1*step(0.5, fract(vW/2.0)); }
  gl_FragColor = vec4(applyFog(c, vD), 1.0);
}`})}function U0(i){let e=i.ciel;return new rn({side:Ht,depthWrite:!1,uniforms:{uZ:{value:zt(e.zenith)},uH:{value:zt(e.horizon)},uS:{value:zt(e.soleil)},uSun:{value:new z().fromArray(e.soleilDir).normalize()},uBas:{value:zt(i.brume)}},vertexShader:"varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`uniform vec3 uZ, uH, uS, uSun, uBas; varying vec3 vP;
void main(){ float y = vP.y; vec3 c = mix(uH, uZ, smoothstep(0.0, 0.55, y)); c = mix(uBas, c, smoothstep(-0.05, 0.03, y));
  float s = max(0.0, dot(vP, uSun)); c = mix(c, uS, pow(s, 18.0)*0.75); c = mix(c, vec3(1.0,0.98,0.9), smoothstep(0.9985, 0.9992, s));
  gl_FragColor = vec4(c, 1.0); }`})}function F0(i){let e=i.vague,t=e.profil,n=90,s=30,r=-230,a=[],o=[],l=[],c=0,u=[0];for(let x=1;x<t.length;x++)c+=Math.hypot(t[x][0]-t[x-1][0],t[x][1]-t[x-1][1]),u.push(c);for(let x=0;x<=n;x++){let S=s+(r-s)*(x/n);for(let f=0;f<t.length;f++)a.push(t[f][0],t[f][1],S),o.push(u[f]/c)}let d=t.length;for(let x=0;x<n;x++)for(let S=0;S<d-1;S++){let f=x*d+S,p=f+1,v=f+d,E=v+1;l.push(f,v,p,p,v,E)}let h=new Bt;h.setAttribute("position",new it(a,3)),h.setAttribute("aS",new it(o,1)),h.setIndex(l);let m=new rn({side:yn,uniforms:{uT:{value:0},uDist:{value:0},uBase:{value:zt(e.base)},uFace:{value:zt(e.face)},uHaut:{value:zt(e.haut)},uMousse:{value:zt(i.eau.mousse)},uEpaule:{value:e.epaule||.35},fogColor:{value:zt(i.brume)},fogNear:{value:i.brumeDe},fogFar:{value:i.brumeA}},vertexShader:`uniform float uT, uDist, uEpaule; attribute float aS; varying float vS; varying float vW; varying float vD;
void main(){ vec3 p = position; float w = uDist - p.z; vS = aS; vW = w;
  float sh = 1.0 - uEpaule * smoothstep(20.0, 170.0, -p.z);
  float br = 0.18*sin(w*0.13 + uT*0.9) + 0.1*sin(w*0.37 - uT*1.4);
  p.y = p.y * (sh + br*0.25*aS); p.x += (p.x + 2.3) * (1.0 - sh) * 0.2 + br * aS * 0.5;
  vec4 mv = modelViewMatrix * vec4(p,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,fragmentShader:$l+`
uniform float uT; uniform vec3 uBase, uFace, uHaut, uMousse; varying float vS; varying float vW; varying float vD;
void main(){
  vec3 c = mix(uBase, uFace, smoothstep(0.0, 0.35, vS)); c = mix(c, uHaut, smoothstep(0.42, 0.7, vS));
  float st = sin(vW*0.55 + vS*14.0 - uT*2.2) * sin(vW*0.21 + 1.7);
  c = mix(c, c*1.18, step(0.82, st) * (1.0 - smoothstep(0.75, 0.85, vS)));
  float lip = smoothstep(0.78, 0.83, vS + 0.03*sin(vW*1.3 + uT*4.0));
  float spr = step(0.6, sin(vW*2.1 + uT*6.0) * sin(vW*0.7 - uT*3.0)) * smoothstep(0.7, 0.78, vS);
  c = mix(c, uMousse, max(lip, spr));
  c = mix(c, uMousse, step(vS, 0.035 + 0.02*sin(vW*1.1 + uT*3.0)));
  gl_FragColor = vec4(applyFog(c, vD), 1.0);
}`});return new Tt(h,m)}function O0(){let i=document.createElement("canvas");i.width=i.height=64;let e=i.getContext("2d"),t=e.createRadialGradient(32,32,2,32,32,31);return t.addColorStop(0,"rgba(0,0,0,0.55)"),t.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=t,e.fillRect(0,0,64,64),new rs(i)}function B0(){let i=document.createElement("canvas");i.width=i.height=32;let e=i.getContext("2d"),t=e.createRadialGradient(16,16,1,16,16,15);return t.addColorStop(0,"rgba(255,255,255,1)"),t.addColorStop(.5,"rgba(255,255,255,0.8)"),t.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=t,e.fillRect(0,0,32,32),new rs(i)}var z0=`
.r3{position:absolute;inset:0;overflow:hidden;background:#000;touch-action:none;user-select:none;-webkit-user-select:none;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.r3 canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block}
.r3 .hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:max(10px,env(safe-area-inset-top)) 12px 0;pointer-events:none;gap:8px}
.r3 .pill{background:rgba(10,24,30,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;border-radius:16px;padding:6px 12px;font-weight:800;font-size:15px;line-height:1.15;box-shadow:0 2px 8px rgba(0,0,0,.2)}
.r3 .sc{font-size:22px;letter-spacing:.5px;font-variant-numeric:tabular-nums}
.r3 .sub{font-size:11px;font-weight:700;opacity:.85}
.r3 .cn{display:flex;align-items:center;gap:6px;font-size:20px;font-variant-numeric:tabular-nums}
.r3 .bar{height:7px;border-radius:5px;background:rgba(255,255,255,.25);margin-top:5px;overflow:hidden;width:128px}
.r3 .bar i{display:block;height:100%;width:0;background:var(--acc);border-radius:5px;transition:width .25s}
.r3 .pw{position:absolute;left:12px;top:86px;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.r3 .pw div{background:rgba(10,24,30,.55);color:#fff;border-radius:12px;padding:4px 9px;font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px}
.r3 .pw b{display:block;height:5px;border-radius:3px;background:var(--acc);width:44px}
.r3 .mult{position:absolute;right:12px;top:86px;color:#fff;font-weight:900;font-size:26px;text-shadow:0 2px 6px rgba(0,0,0,.45);pointer-events:none;transition:transform .2s}
.r3 .msg{position:absolute;left:8%;right:8%;top:30%;text-align:center;color:#fff;font-weight:900;font-size:25px;line-height:1.2;text-shadow:0 3px 10px rgba(0,0,0,.55),0 0 2px rgba(0,0,0,.6);pointer-events:none;opacity:0;transition:opacity .2s,transform .2s;transform:scale(.9)}
.r3 .msg.on{opacity:1;transform:scale(1)}
.r3 .msg small{display:block;font-size:15px;font-weight:800;margin-top:6px;opacity:.95}
.r3 .ban{position:absolute;left:50%;top:19%;transform:translate(-50%,-20px);background:var(--acc);color:#10202a;font-weight:900;font-size:17px;padding:9px 16px;border-radius:18px;box-shadow:0 6px 18px rgba(0,0,0,.3);opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;max-width:92%;overflow:hidden;text-overflow:ellipsis}
.r3 .ban.on{opacity:1;transform:translate(-50%,0)}
.r3 .flash{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .25s;background:radial-gradient(ellipse at center,rgba(255,255,255,0) 45%,rgba(255,255,255,.55) 100%)}
.r3 .vit{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .4s;background:repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,.0) 0deg,rgba(255,255,255,.0) 5deg,rgba(255,255,255,.22) 5.6deg,rgba(255,255,255,0) 6.2deg);-webkit-mask:radial-gradient(ellipse at 50% 46%,transparent 38%,#000 75%);mask:radial-gradient(ellipse at 50% 46%,transparent 38%,#000 75%)}
.r3 .hint{position:absolute;left:0;right:0;bottom:max(18px,env(safe-area-inset-bottom));text-align:center;color:#fff;font-weight:800;font-size:14px;text-shadow:0 2px 6px rgba(0,0,0,.6);pointer-events:none;transition:opacity .4s}
`,Ui=null,$t={state:"idle",t:0,fps:0,score:0,coins:0};function k0(i,e){e=e||{},Ui&&Ui.stop(!0);let t=e.theme3d;return new Promise(function(n,s){let r;try{r=G0(i,t,e,n)}catch(a){s(a);return}Ui=r})}function G0(i,e,t,n){if(!document.getElementById("r3css")){let ae=document.createElement("style");ae.id="r3css",ae.textContent=z0,document.head.appendChild(ae)}let s=document.createElement("div");s.className="r3",s.style.setProperty("--acc",e.accent||"#caaa6d"),i.innerHTML="",i.appendChild(s);let r=Math.max(1,i.clientWidth||innerWidth),a=Math.max(1,i.clientHeight||innerHeight),o=new xo({antialias:(devicePixelRatio||1)<2,powerPreference:"high-performance",failIfMajorPerformanceCaveat:!1});if(!o.getContext())throw new Error("webgl");let l=Math.min(2,t.pixelRatio||devicePixelRatio||1);o.setPixelRatio(l),o.setSize(r,a,!1),o.outputColorSpace=en,s.appendChild(o.domElement);let c=document.createElement("div");for(c.innerHTML=`<div class="hud"><div class="pill"><div class="sub">${e.hud.score}</div><div class="sc">0</div></div><div class="pill" style="text-align:right"><div class="cn"><span class="cv">0</span><span>${e.hud.piece}</span></div><div class="bar"><i></i></div><div class="sub pal" style="margin-top:3px"></div></div></div>
     <div class="pw"></div><div class="mult"></div><div class="vit"></div><div class="flash"></div><div class="msg"></div><div class="ban"></div><div class="hint">${e.hud.aide}</div>`;c.firstChild;)s.appendChild(c.firstChild);let u=function(ae){return s.querySelector(ae)},d=u(".sc"),h=u(".cv"),m=u(".bar i"),x=u(".pal"),S=u(".pw"),f=u(".mult"),p=u(".msg"),v=u(".ban"),E=u(".flash"),b=u(".vit"),R=u(".hint"),w=new Bs;w.background=zt(e.brume),w.fog=new Os(zt(e.brume),e.brumeDe,e.brumeA);let g=new tn(62,r/a,.1,900);w.add(new tr(zt(e.lumiere.ciel),zt(e.lumiere.sol),e.lumiere.hemi));let M=new sr(zt(e.lumiere.soleil),e.lumiere.dir);M.position.fromArray(e.ciel.soleilDir).multiplyScalar(10).add(new z(0,6,0)),w.add(M),w.add(new rr(16777215,e.lumiere.amb||.15));let D=new Tt(new pi(600,24,12),U0(e));D.renderOrder=-10,w.add(D);let C=new on;w.add(C);let I=So(),N=Mr(.03),k=Mr(.02),P=new Tt(new zn(e.eau.largeur||700,900,e.eau.seg||70,150).rotateX(-Jl/2),D0(e));P.position.set(e.eau.cx||0,e.eau.y||0,-390),C.add(P);let Y=null;e.sol&&(Y=new Tt(new zn(e.sol.x1-e.sol.x0,900,1,1).rotateX(-Jl/2),N0(e)),Y.position.set((e.sol.x0+e.sol.x1)/2,e.sol.y||0,-390),C.add(Y));let $=null;e.vague&&($=F0(e),C.add($));let J=new on;w.add(J);for(let ae of e.fond||[]){let be=Zl[ae.item](e.palette,ae.graine||1),Le=new Tt(be,ae.plat?new Bn({vertexColors:!0,fog:!0}):I);Le.position.fromArray(ae.pos),Le.rotation.y=ae.rot||0,Le.scale.setScalar(ae.echelle||1),J.add(Le)}let le={};function j(ae,be){let Le=ae+be;return le[Le]||(le[Le]=Zl[ae](e.palette,be+1)),le[Le]}let re=[],T=260;for(let ae of e.bandes||[]){let be=Math.ceil(T/ae.pas)+1,Le=ae.items.reduce(function(It,y){return It+(y[1]||1)},0),Et=[];for(let It=0;It<be;It++){let y=new Tt(void 0,I);y.matrixAutoUpdate=!0,C.add(y),Et.push({m:y,k:It-2})}re.push({b:ae,slots:Et,n:be,tot:Le})}function X(ae,be){let Le=Math.sin(ae*127.1+be*311.7)*43758.5453;return Le-Math.floor(Le)}function he(ae,be){let Le=ae.b,Et=be.k,It=X(Et,Le.pas*7+Le.x[0])*ae.tot,y=Le.items[0];for(let H of Le.items)if(It-=H[1]||1,It<=0){y=H;break}let U=Le.vide&&X(Et,3.3+Le.x[1])<Le.vide;if(be.m.visible=!U&&y[0]!=="-",!be.m.visible)return;be.m.geometry=j(y[0],Math.floor(X(Et,9.1)*3)),be.wz=Et*Le.pas+(Le.decal||0)+(X(Et,5.5)-.5)*Le.pas*(Le.alea==null?.5:Le.alea),be.m.position.x=Le.x[0]+(Le.x[1]-Le.x[0])*X(Et,2.2),be.m.position.y=Le.y||0,be.m.rotation.y=(Le.rot||0)+(Le.rotAlea||0)*(X(Et,4.4)-.5);let Z=(Le.echelle||1)*(1+(X(Et,6.6)-.5)*(Le.echelleAlea||.25));be.m.scale.setScalar(Z)}for(let ae of re)for(let be of ae.slots)he(ae,be);let W=tu(e.perso.modele,e.perso.couleurs,{outline:.016}),K=new on;K.add(W.root),C.add(K),W.root.rotation.y=0;let me=new Tt(new Zs(.5,16).rotateX(-Jl/2),new Bn({map:O0(),transparent:!0,depthWrite:!1}));me.position.y=.02,C.add(me);let Me={0:[],1:[],2:[]};[["haut",0],["bas",1],["mur",2]].forEach(function(ae){for(let be of e.obstacles[ae[0]])for(let Le=0;Le<2;Le++)Me[ae[1]].push(nu[be](e.palette,Le+1))});let ee=[],te=Sr[e.piece.modele](e.palette),Ke=new is(te,I,200);Ke.instanceMatrix.setUsage(mr),Ke.frustumCulled=!1,C.add(Ke);let Te=new is(te,k,200);Te.instanceMatrix=Ke.instanceMatrix,Te.frustumCulled=!1,C.add(Te);let ke=(e.piece.teintes||["#ffffff"]).map(zt);if(e.piece.teintes)for(let ae=0;ae<200;ae++)Ke.setColorAt(ae,ke[ae%ke.length]);let ut={shield:Sr[e.bonus.shield.modele](e.palette),magnet:Sr[e.bonus.magnet.modele](e.palette),boost:Sr[e.bonus.boost.modele](e.palette)},Fe=[],dt=new Bn({color:16777215,transparent:!0,opacity:.35,depthWrite:!1,blending:or}),rt=new pi(.55,12,8),He=160,je=new Float32Array(He*3),St=new Float32Array(He*3),qe=new Float32Array(He*3),tt=new Float32Array(He),Oe=new Bt;Oe.setAttribute("position",new it(je,3).setUsage(mr)),Oe.setAttribute("color",new it(St,3).setUsage(mr));let st=new Hs(Oe,new ss({size:.22,map:B0(),vertexColors:!0,transparent:!0,depthWrite:!1,sizeAttenuation:!0}));st.frustumCulled=!1,C.add(st);for(let ae=0;ae<He;ae++)je[ae*3+1]=-99;let F=0,Nt=new et;function ze(ae,be,Le,Et,It,y,U,Z){Nt.set(It);for(let H=0;H<Et;H++){let V=F;F=(F+1)%He,je[V*3]=ae,je[V*3+1]=be,je[V*3+2]=Le,qe[V*3]=(Math.random()-.5)*y,qe[V*3+1]=U*(.5+Math.random()),qe[V*3+2]=(Z||0)+(Math.random()-.5)*y,St[V*3]=Nt.r,St[V*3+1]=Nt.g,St[V*3+2]=Nt.b,tt[V]=.5+Math.random()*.4}}let nt=0,de=0,bt=0,De=0,Be=0,A=function(ae){try{navigator.vibrate&&navigator.vibrate(ae)}catch(be){}},_=function(ae){return function(){q.sim||ae.apply(null,arguments)}};function G(ae,be){v.textContent=ae,v.classList.add("on"),bt=be||1.6}function ce(ae){E.style.background="radial-gradient(ellipse at center,rgba(255,255,255,0) 40%,"+(ae||"rgba(255,255,255,.6)")+" 100%)",E.style.opacity=1,de=.18}let oe={jump:_(function(ae){ze(q.px*cn,.1,.2,10,e.fx.saut,1.6,2.2,1),ae&&ce("rgba(120,220,255,.6)")}),land:_(function(){W.onLand(),Be=1,ze(q.px*cn,.08,.1,12,e.fx.saut,2.2,1.6,1.5)}),slide:_(function(){ze(q.px*cn,.1,.2,8,e.fx.saut,1.2,1.2,2)}),lane:_(function(){ze(q.px*cn,.08,.3,4,e.fx.saut,.8,1,2)}),bump:_(function(){nt=Math.max(nt,.12),A(15)}),coin:_(function(ae,be){ze(ae.x*cn,ae.y+.1,-ae.z,6,e.fx.piece,1.8,1.6,2),t.onCoin&&t.onCoin(q.coins)}),power:_(function(ae){G(e.bonus[ae].nom,2),ce(),A([20,30,20]),ze(q.px*cn,.8,0,24,e.fx.piece,3,3,1)}),hit:_(function(ae,be){nt=ae==="dead"?.55:.4,A(ae==="dead"?[60,40,90]:70),W.onHit(),ce(ae==="shield"?"rgba(120,220,255,.7)":"rgba(255,90,60,.55)"),ze(be.lane*cn,.5,-be.z,18,ae==="shield"?"#bfefff":e.fx.choc,3,2.5,1),ae==="second"?G(e.hud.relance,1.6):ae==="shield"&&G(e.bonus.shield.fin,1.4)}),near:_(function(){G(e.hud.justesse,.7)}),palier:_(function(ae){G("🎁 "+ae,2.6),ce("rgba(255,220,120,.7)"),A([30,40,30]),ze(q.px*cn,1.2,0,30,"#ffe08a",3,3.5,0)}),combo:_(function(ae){f.textContent="×"+ae,f.style.transform="scale(1.4)",setTimeout(function(){f.style.transform=""},200)}),zone:_(function(ae){ae&&(G(e.hud.zone,2.2),ce("rgba(255,230,120,.6)"))}),evt:_(function(ae){G(ae,2.2),A(40)}),end:_(function(){}),bravo:_(function(){})},q=Jh({fx:oe,immortel:!!t.immortel,paliers:t.paliers,duration:t.duration,seed:t.seed,noms:e.noms,evenement:e.evenement});q.sim=!1,$t.core=q;let fe=null;function ne(ae){let be=ae.touches?ae.touches[0]:ae;fe={x:be.clientX,y:be.clientY,t:performance.now(),done:!1}}function ie(ae){if(!fe||fe.done)return;let be=ae.touches?ae.touches[0]:ae,Le=be.clientX-fe.x,Et=be.clientY-fe.y,It=22;(Math.abs(Le)>It||Math.abs(Et)>It)&&(fe.done=!0,Q(Math.abs(Le)>Math.abs(Et)?Le>0?"right":"left":Et>0?"down":"up")),ae.cancelable&&ae.preventDefault()}function ge(){fe&&!fe.done&&performance.now()-fe.t<260&&Q("up"),fe=null}function L(ae){let be={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down",a:"left",d:"right",w:"up",s:"down"," ":"up",q:"left",z:"up"}[ae.key];be&&(Q(be),ae.preventDefault())}let se=!1;function Q(ae){se&&(q.act(ae),R.style.opacity!=="0"&&(R.style.opacity=0))}let ye=o.domElement;s.addEventListener("touchstart",ne,{passive:!0}),s.addEventListener("touchmove",ie,{passive:!1}),s.addEventListener("touchend",ge),s.addEventListener("mousedown",ne),addEventListener("mousemove",ie),addEventListener("mouseup",ge),addEventListener("keydown",L);function pe(){document.hidden&&q.state==="run"&&(q.state="paused",Pe(e.hud.pause,e.hud.reprise))}document.addEventListener("visibilitychange",pe),s.addEventListener("pointerdown",function(){q.state==="paused"&&(q.state="run",Pe(""))});function _e(){let ae=Math.max(1,i.clientWidth||innerWidth),be=Math.max(1,i.clientHeight||innerHeight);o.setSize(ae,be,!1),g.aspect=ae/be,g.updateProjectionMatrix()}addEventListener("resize",_e);function Pe(ae,be){if(!ae){p.classList.remove("on");return}p.innerHTML=ae+(be?"<small>"+be+"</small>":""),p.classList.add("on")}let Qe=performance.now(),ue=0,Ue=!0,Je=0,Se=0,_t=0,Ut=0,qt=0,_s=t.intro==null?1.7:t.intro,Hn=new Vt,Ln=new z(0,2.6,4.5),xs=new z(0,.9,-7);Pe(e.hud.pret,e.hud.consigne);let vs=null,bn="",ys={shield:"shield",magnet:"magnet",boost:"boost"},ii=l,Si=0,si=0;function wr(ae){if(Si+=Math.max(0,ae),si++,Si<2)return;let be=si/Si;Si=0,si=0,$t.pr=ii,be<26&&ii>.5&&(ii=Math.max(.5,ii*.75),o.setPixelRatio(ii))}function Ms(ae){if(!Ue)return;ue=requestAnimationFrame(Ms);let be=(ae-Qe)/1e3;Qe=ae,_t+=Math.max(0,be),Ut++,wr(be),be>.05&&(be=.05),be<=0&&(be=1e-4),_t>=.5&&($t.fps=Ut/_t,_t=0,Ut=0),qt+=be,se||(Je+=be,Je>=_s&&(se=!0,q.state="run",Pe(""))),t.autoplay&&$t.bot&&$t.bot(q,be),q.hitStop>0?q.hitStop-=be:q.update(be);let Le=q.state;$t.state=Le==="ready"?"intro":Le,$t.t=q.gt,$t.score=q.score,$t.coins=q.coins,$t.speed=q.speed,$t.level=q.level;let Et=q.dist,It=q.speed/at.v0,y=Le==="dying"||Le==="end"?"dead":se?q.air?"air":q.slide>0?"slide":"run":"idle";W.update(be,{mode:y,speedK:It,lean:(q.tlane-q.px)*1.6+q.tilt,airT:q.air?Math.min(1,(q.gt-q.jumpAt)/q.jumpT):0,boost:q.boost>0,dieT:q.dieT});let U=e.perso.flotte?Math.sin(qt*2.3)*.05+Math.sin(qt*1.3+q.px)*.03:0;K.position.set(q.px*cn,q.py+U+(e.perso.y||0),0),K.visible=!(q.invul>0&&Le==="run"&&Math.floor(q.invul*12)%2===0),me.position.x=K.position.x;let Z=Math.max(.35,1-q.py*.35);me.scale.set(Z,1,Z*1.2),me.visible=!e.perso.flotte||q.py>.05,e.perso.flotte&&Le==="run"&&!q.air&&Math.random()<.6+It*.2&&ze(K.position.x+(Math.random()-.5)*.4,.05,.5,1,e.fx.sillage,.6,.7,3+It*2),!e.perso.flotte&&Le==="run"&&!q.air&&Math.random()<.15&&ze(K.position.x,.05,.3,1,e.fx.saut,.4,.4,2);let H=q.OBS;for(let Ve=0;Ve<H.length;Ve++){let Ne=H[Ve],gt=ee[Ve];if(!Ne.on||Ne.done&&Ne.burst<=0||Ne.z>at.zFar+20){gt&&(gt.visible=!1);continue}if(!gt){gt=new Tt(Me[0][0],I);let Fi=new Tt(Me[0][0],N);gt.add(Fi),gt.userData.ol=Fi,C.add(gt),ee[Ve]=gt}let We=Me[Ne.type],Lt=We[Ne.v%We.length];gt.geometry!==Lt&&(gt.geometry=Lt,gt.userData.ol.geometry=Lt),gt.visible=!0;let un=Ne.type===2?-(Ne.z+Ne.len/2):-Ne.z;gt.position.set(Ne.lane*cn,0,un);let At=1,Dt=1,dn=1;if(Ne.type===2&&(dn=Math.max(1,Ne.len/1.1)),Ne.big&&(At=1.15,Dt=1.25,dn=1.3),Ne.done&&Ne.burst>0){let Fi=1-Ne.burst/.35;Dt*=1-Fi,At*=1+Fi,gt.position.y=Fi*.8}let bs=Math.min(1,Math.max(0,(at.zFar-Ne.z)/10));bs<1&&(Dt*=bs),Ne.type===0&&e.perso.flotte&&(gt.position.y+=Math.sin(qt*2+Ne.v)*.06),gt.rotation.y=Ne.type===0?Ne.v%7*.25-.75:0,gt.scale.set(At,Dt,dn)}let V=q.COINS,xe=0,Ee=0,ve=qt*3;for(let Ve=0;Ve<V.length;Ve++){let Ne=V[Ve];if(!Ne.on||Ne.z>at.zFar+10)continue;if(Ne.pw){let We=Fe[Ee];if(!We){We=new Tt(ut.shield,I);let Lt=new Tt(rt,dt);We.add(Lt),C.add(We),Fe[Ee]=We}We.geometry=ut[ys[Ne.pw]],We.visible=!0,We.position.set(Ne.x*cn,Ne.y+.25+Math.sin(qt*3)*.1,-Ne.z),We.rotation.y=ve,We.scale.setScalar(1.6),Ee++;continue}Hn.position.set(Ne.x*cn,Ne.y+.05+Math.sin(qt*4+Ne.v)*.04,-Ne.z),Hn.rotation.set(0,ve+Ne.v,0);let gt=Ne.fly?.8:1.15;Hn.scale.set(gt,gt,gt),Hn.updateMatrix(),Ke.setMatrixAt(xe,Hn.matrix),e.piece.teintes&&Ke.setColorAt(xe,ke[Ne.v%ke.length]),xe++}for(let Ve=Ee;Ve<Fe.length;Ve++)Fe[Ve].visible=!1;Ke.count=xe,Te.count=xe,Ke.instanceMatrix.needsUpdate=!0,Ke.instanceColor&&(Ke.instanceColor.needsUpdate=!0);for(let Ve of re)for(let Ne of Ve.slots){Ne.wz==null&&(Ne.wz=-1e9);let gt=-(Ne.wz-Et);gt>14&&(Ne.k+=Ve.n,he(Ve,Ne),gt=-(Ne.wz-Et)),Ne.m.position.z=gt}J.position.z=0,P.material.uniforms.uT.value=qt,P.material.uniforms.uDist.value=Et,Y&&(Y.material.uniforms.uDist.value=Et),$&&($.material.uniforms.uT.value=qt,$.material.uniforms.uDist.value=Et);for(let Ve=0;Ve<He;Ve++)tt[Ve]<=0||(tt[Ve]-=be,qe[Ve*3+1]-=6*be,je[Ve*3]+=qe[Ve*3]*be,je[Ve*3+1]+=qe[Ve*3+1]*be,je[Ve*3+2]+=(qe[Ve*3+2]+q.speed*(Le==="run"?1:.2))*be,(tt[Ve]<=0||je[Ve*3+1]<-.2)&&(tt[Ve]=0,je[Ve*3+1]=-99));Oe.attributes.position.needsUpdate=!0,Oe.attributes.color.needsUpdate=!0;let we=Math.min(1,Je/Math.max(.01,_s)),Ce=1-Math.pow(1-we,3),Ye=q.px*cn*.6+(e.camera.x||0),ct=(e.camera.y||2.6)+q.py*.45,Ie=e.camera.z||4.6,ht=2.2*(1-Ce),Ft=-1.3*(1-Ce),wt=-7.5*(1-Ce);Ln.x+=(Ye+ht-Ln.x)*Math.min(1,be*7),Ln.y+=(ct+Ft-Ln.y)*Math.min(1,be*6),Ln.z=Ie+wt,nt=Math.max(0,nt-be*1.6);let Mt=(Math.random()-.5)*nt*.5,Yt=(Math.random()-.5)*nt*.5;g.position.set(Ln.x+Mt,Ln.y+Yt,Ln.z),xs.set(q.px*cn*.8+(e.camera.vx||0),.9+q.py*.6+(e.camera.vy||0)-.4*(1-Ce),-8*Ce+.2*(1-Ce)),g.lookAt(xs),g.rotation.z+=(q.px-q.tlane)*.03-q.tilt*.05,De=Math.max(0,De-be*2);let Re=60+(It-1)*13+(q.zone>0?6:0)+(q.boost>0?4:0)+De*6;Math.abs(g.fov-Re)>.05&&(g.fov+=(Re-g.fov)*Math.min(1,be*3),g.updateProjectionMatrix()),D.position.copy(g.position),J.position.x=0,d.textContent=q.score,h.textContent=q.coins;let Ot=q.paliers,ft=q.palierIdx;if(Ot.length){let Ve=Ot[Math.min(ft,Ot.length-1)],Ne=ft>0?Ot[ft-1].n:0,gt=ft>=Ot.length?1:(q.coins-Ne)/Math.max(1,Ve.n-Ne);m.style.width=Math.round(Math.min(1,gt)*100)+"%",x.textContent=ft>=Ot.length?e.hud.tousPaliers:Ve.n-q.coins+" "+e.hud.piece+" → "+Ve.label}let hn="";if(q.shield>0&&(hn+="<div>"+e.bonus.shield.icone+'<b style="width:'+Math.round(q.shield/at.shieldT*44)+'px"></b></div>'),q.magnet>0&&(hn+="<div>"+e.bonus.magnet.icone+'<b style="width:'+Math.round(q.magnet/at.magnetT*44)+'px"></b></div>'),q.boost>0&&(hn+="<div>"+e.bonus.boost.icone+'<b style="width:'+Math.round(q.boost/at.boostT*44)+'px"></b></div>'),S.innerHTML!==hn&&(S.innerHTML=hn),q.mult<=1&&f.textContent&&(f.textContent=""),b.style.opacity=q.zone>0||q.boost>0?.9:It>1.6?Math.min(.55,(It-1.6)*1.2):0,de>0&&(de-=be,de<=0&&(E.style.opacity=0)),bt>0&&(bt-=be,bt<=0&&v.classList.remove("on")),se&&Le==="run"){let Ve=q.prompt;if(Ve!==vs)if(vs=Ve,Ve){let Ne={up:"⬆️",down:"⬇️",left:"⬅️",right:"➡️",lr:"↔️"}[Ve.tdir]||"";Pe(Ne+" "+Ve.tuto)}else Pe("");q.bravo>0&&bn!=="bravo"&&(bn="bravo"),q.bravo<=0&&(bn="")}if(Le==="end"&&(Se+=be,Se>.25&&!p.classList.contains("on")&&Pe(e.hud.finTitre,q.score+" "+e.hud.points),Se>(t.endDelay==null?1.1:t.endDelay))){To();return}let Zt=performance.now();o.render(w,g),$t.renderMs=performance.now()-Zt,$t.calls=o.info.render.calls,$t.tris=o.info.render.triangles}ue=requestAnimationFrame(function(ae){Qe=ae,Ms(ae)});function ri(){Ue=!1,cancelAnimationFrame(ue),removeEventListener("keydown",L),removeEventListener("resize",_e),removeEventListener("mousemove",ie),removeEventListener("mouseup",ge),document.removeEventListener("visibilitychange",pe),w.traverse(function(ae){ae.geometry&&ae.geometry.dispose(),ae.material&&(Array.isArray(ae.material)?ae.material:[ae.material]).forEach(function(Le){Le.map&&Le.map.dispose(),Le.dispose()})});for(let ae in le)le[ae].dispose();o.dispose();try{o.forceContextLoss()}catch(ae){}Ui===Ss&&(Ui=null),$t.state="idle"}function To(){let ae=q.result||q.mkResult();ri(),n(ae)}let Ss={stop:function(ae){Ue&&(ri(),ae||n(q.result||q.mkResult()))}};return $t.act=function(ae){q.act(ae)},Ss}function Kl(){try{let i=document.createElement("canvas");return!!(window.WebGLRenderingContext&&(i.getContext("webgl2")||i.getContext("webgl")))}catch(i){return!1}}var br={start:k0,stop:function(){Ui&&Ui.stop()},_debug:$t,webglOK:Kl};var jl={_source:"v4/recherche/boma-beach.md : surfeur sur la gauche de Boucan Canot, large à gauche, plage + filaos + front de mer à droite, Cap Boucan / hôtel droit devant, crête du Maïdo côté terre, coucher de soleil sur la mer (OSO).",accent:"#caaa6d",brume:"#d8c4a2",brumeDe:70,brumeA:560,ciel:{zenith:"#4f9fe0",horizon:"#f7dcb0",soleil:"#ffb347",soleilDir:[-.75,.16,-.62]},lumiere:{ciel:"#dff3ff",sol:"#c9a874",hemi:1.05,soleil:"#fff0d6",dir:1.25,amb:.18},eau:{lagon:"#3fc1e6",large:"#1e6fb8",mousse:"#f4fbff",rivage:15,cote:1,largeur:520,seg:80,cx:-40,y:0},sol:{x0:13,x1:160,y:.1,bandes:[[24,"#e9d9b8",3],[27,"#c9b48e",3],[32,"#7f552c",2],[44,"#d8cfc0",1],[160,"#8c8a55",0]]},vague:{profil:[[-2.6,-.2],[-3.4,.6],[-4.4,1.7],[-5.6,3],[-6.6,3.9],[-7.2,4.2],[-7,4.25],[-6.2,4],[-5.2,3.6]],base:"#2b8fc7",face:"#3fc1e6",haut:"#9be3f2",epaule:.45},palette:{tronc:"#5a4636",filao:"#2f5a2a",filao2:"#3d6b2f",palme:"#3e7d32",roche:"#2a2a2e",toile:"#c9b48e",toile2:"#e3743c",coussin:"#1f8a8a",coussin2:"#d8a43a",colline:"#8c8a55",brume:"#4f6f5c",brume2:"#5d7d66",accent:"#caaa6d"},fond:[{item:"montagne",pos:[260,-4,-430],rot:.35,echelle:1.25,plat:!0,graine:3},{item:"falaise",pos:[40,-3,-230],rot:.2,echelle:1,graine:2},{item:"hotel",pos:[22,5,-205],rot:.3,echelle:1,graine:1},{item:"nuage",pos:[-120,70,-380],echelle:2.4,plat:!0,graine:1},{item:"nuage",pos:[140,95,-420],echelle:2,plat:!0,graine:4},{item:"nuage",pos:[10,120,-460],echelle:2.8,plat:!0,graine:7}],bandes:[{pas:5,x:[8.5,9.5],items:[["bouee_filet",1]],alea:.1,echelle:1,y:.02},{pas:22,x:[-26,-9],items:[["rocher_noir",1]],vide:.45,echelle:.9,y:-.2},{pas:7,x:[17,23],items:[["parasol",3],["transat",3],["lit_balinais",2],["-",2]],rot:1.57,rotAlea:.5},{pas:4.5,x:[27.5,31.5],items:[["filao",4],["cocotier",3]],echelleAlea:.35},{pas:16,x:[36,37],items:[["passerelle",1]],rot:1.57,vide:.3,y:.1},{pas:11,x:[47,49],items:[["snack",5],["boma_pavillon",2]],rot:1.57,alea:.2},{pas:30,x:[33,35],items:[["feu_boma",1]],vide:.3},{pas:9,x:[25.5,26],items:[["lampion",1]],vide:.2}],perso:{modele:"surfeur",flotte:!0,y:0,couleurs:{peau:"#b9774f",cheveux:"#2a1a12",haut:"#0e2329",short:"#caaa6d",short2:"#e3743c",planche:"#f4ead2",bande:"#e3743c"}},obstacles:{haut:["bouee","tronc","recif"],bas:["levre"],mur:["rocher"]},noms:{haut:"la bouée",bas:"la lèvre de la vague",mur:"le rocher"},evenement:{nom:"🌊 La vague géante de Boucan",consigne:"Glisse vers le bas : passe dans le tube !"},piece:{modele:"coquillage"},bonus:{shield:{modele:"dauphin",nom:"🐬 Le dauphin te protège",icone:"🐬",fin:"Le dauphin t'a sauvé !"},magnet:{modele:"aimant",nom:"🧲 Aimant à coquillages",icone:"🧲"},boost:{modele:"etoile",nom:"⭐ Turbo étoile de mer",icone:"⭐"}},fx:{saut:"#f4fbff",piece:"#ffd7e2",choc:"#ffffff",sillage:"#f4fbff"},camera:{x:0,y:2.7,z:4.8},hud:{score:"Score",piece:"🐚",aide:"⬅️ ➡️ couloir · ⬆️ saut · ⬇️ tube",relance:"Deuxième vague, c'est reparti !",justesse:"Tout juste !",zone:"🔥 Zone folle : pièces ×2 !",pause:"Pause",reprise:"Touche l'écran pour reprendre",pret:"Prêt à surfer ?",consigne:"Ride la vague de Boucan Canot",finTitre:"Belle session !",points:"points",tousPaliers:"Tous les cadeaux débloqués 🎉"}};var Mi=window.Runner||null,iu=Mi&&Mi._debug,wo=null,Ao={_v:4,_theme:jl,_debug:br._debug,get mode(){return wo},start:function(i,e){if(e=e||{},!(e.force2d||/[?&]runner=2d\b/.test(location.search))&&Kl()){wo="3d",Ao._debug=br._debug;let n=Object.assign({},e,{theme3d:e.theme3d||jl});return br.start(i,n).catch(function(s){if(!Mi)throw s;return console.warn("runner 3D indisponible, version 2D",s&&s.message),wo="2d",Ao._debug=iu,i.innerHTML="",Mi.start(i,e)})}return Mi?(wo="2d",Ao._debug=iu,Mi.start(i,e)):Promise.reject(new Error("runner 2D absent"))},stop:function(){try{br.stop()}catch(i){}Mi&&Mi.stop()}};window.Runner=Ao;})();
