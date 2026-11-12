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
