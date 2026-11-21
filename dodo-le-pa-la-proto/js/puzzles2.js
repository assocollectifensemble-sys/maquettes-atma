/* Dodo lé pa là — énigmes (2/2) : Braconnier (vert) et Cartographe (bleu). */
(function () {
  const P = window.PUZZLES, C = window.CONTENT, A = window.ART, D = window.DODO_DATA;
  const esc = P.esc;
  const INK = '#3b2a1a';

  // ================= VERT =================
  // ---------- baguenaudier ----------
  P.anneaux = function (ctx, el) {
    const sc = ctx.scratch; sc.r = sc.r || [1, 1, 1, 1]; sc.n = sc.n || 0;
    const can = k => k === 0 || (sc.r[k - 1] === 1 && sc.r.slice(0, k - 1).every(x => x === 0));
    const draw = () => {
      el.innerHTML = `<p class="center">Un filet enserre la malle. Il est fermé par un <b>casse-tête à anneaux</b> : libérez les 4 anneaux de la barre pour dégager le filet.</p>
        <div class="stage" style="max-width:520px"><svg viewBox="0 0 340 170" data-testid="baguenaudier" style="background:radial-gradient(#3d5a3a,#22341f);border-radius:10px">
          ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 40} 0 L${i * 40 + 60} 170 M${i * 40 + 60} 0 L${i * 40} 170" stroke="#c9b48a" stroke-width="1" opacity=".35"/>`).join('')}
          <path d="M20 80 H300 a14 14 0 0 1 0 28 H20" fill="none" stroke="#d8dde0" stroke-width="5"/>
          ${sc.r.map((on, k) => { const x = 60 + k * 62; return `<g class="ring" data-k="${k}" data-testid="anneau-${k + 1}" style="cursor:pointer">
            <rect x="${x - 26}" y="10" width="52" height="150" fill="transparent"/>
            <line x1="${x}" y1="160" x2="${x}" y2="${on ? 94 : 128}" stroke="#a8743c" stroke-width="5"/>
            <ellipse cx="${x}" cy="${on ? 94 : 138}" rx="22" ry="12" fill="none" stroke="${on ? '#e2c47a' : '#8f9ba1'}" stroke-width="5"/>
            <text x="${x}" y="30" text-anchor="middle" fill="#f6e9cf" font-family="Fell" font-size="15">${k + 1}</text>
            <text x="${x}" y="48" text-anchor="middle" fill="${on ? '#e2c47a' : '#b9d7a8'}" font-size="10">${on ? 'engagé' : 'libéré'}</text></g>`; }).join('')}
        </svg></div><p class="center">${sc.n} geste(s)</p>`;
      el.querySelectorAll('.ring').forEach(g => g.addEventListener('click', () => {
        const k = +g.dataset.k;
        if (!can(k)) return ctx.fail(`L'anneau ${k + 1} est bloqué par la barre : préparez d'abord ses voisins.`, 'anneau ' + (k + 1));
        sc.r[k] ^= 1; sc.n++; ctx.save(); draw(); ctx.fb(`Anneau ${k + 1} ${sc.r[k] ? 'réengagé' : 'libéré'}.`, '');
        if (sc.r.every(x => x === 0)) ctx.win(`Les 4 anneaux glissent hors de la barre en ${sc.n} gestes : le filet tombe !`, sc.n + ' gestes');
      }));
    };
    draw();
  };

  // ---------- regards : appuyer à 4 en même temps ----------
  P.ANIMAUX = [ // [nom, regarde (index ou null), x, y, couleur]
    ['Dodo', 1], ['Baleine', 2], ['Chien', 9], ['Tangue', null], ['Caméléon', null], ['Tortue', 0], ['Hibou', 10],
    ['Paon', null], ['Lapin', 11], ['Chat', 6], ['Renard', 8], ['Cerf', null], ['Ours', null], ['Corbeau', 5]];
  P.REGARDS_OK = [3, 4, 7, 12];
  P.regards = function (ctx, el) {
    const N = P.ANIMAUX, pos = N.map((_, i) => [55 + (i % 4) * 90 + (Math.floor(i / 4) % 2 ? 20 : 0), 50 + Math.floor(i / 4) * 92]);
    const keys = 'QSDFGHJKLMWXCV';
    const held = new Set();
    let done = false;
    const looked = new Set(N.map(a => a[1]).filter(x => x != null));
    el.innerHTML = `<p class="center">Quatorze animaux peints sur les flancs. Chacun a des yeux-boutons. Suivez les regards : seuls les animaux <b>ni regardés, ni regardant un autre</b> ouvrent la trappe, si on appuie sur leurs yeux <b>tous ensemble</b>.</p>
      <div class="stage"><svg viewBox="0 0 400 380" data-testid="animaux" style="background:#7a5130;border-radius:10px;touch-action:pan-y">
        <defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ffe9a8"/></marker></defs>
        ${N.map((a, i) => a[1] == null ? '' : (() => { const [x1, y1] = pos[i], [x2, y2] = pos[a[1]]; const d = Math.hypot(x2 - x1, y2 - y1); const ux = (x2 - x1) / d, uy = (y2 - y1) / d;
          return `<line x1="${x1 + ux * 30}" y1="${y1 + uy * 30}" x2="${x2 - ux * 32}" y2="${y2 - uy * 32}" stroke="#ffe9a8" stroke-width="2.6" stroke-dasharray="6 4" marker-end="url(#ar)"/>`; })()).join('')}
        ${N.map((a, i) => { const [x, y] = pos[i]; let dx = 0, dy = -4;
          if (a[1] != null) { const [x2, y2] = pos[a[1]]; const d = Math.hypot(x2 - x, y2 - y); dx = (x2 - x) / d * 4; dy = (y2 - y) / d * 4; }
          return `<g class="eye-btn" data-i="${i}" data-testid="animal-${i}" style="cursor:pointer;touch-action:none">
            <circle cx="${x}" cy="${y}" r="28" fill="#efe2c6" stroke="${INK}" stroke-width="2"/>
            <circle class="eyeball" cx="${x}" cy="${y - 4}" r="11" fill="#fff" stroke="${INK}" stroke-width="2"/>
            <circle cx="${x + dx}" cy="${y - 4 + dy}" r="5" fill="${INK}"/>
            ${a[1] == null ? `<path d="M${x - 8} ${y - 18} q8 -6 16 0" stroke="${INK}" fill="none" stroke-width="1.5"/>` : ''}
            <text x="${x}" y="${y + 18}" text-anchor="middle" font-size="9.5" font-family="Garamond" fill="${INK}">${a[0]}</text>
            <text x="${x + 22}" y="${y - 20}" font-size="9" fill="#5b4632" font-family="Garamond">${keys[i]}</text></g>`; }).join('')}
      </svg></div>
      <p class="small mut center">Sur téléphone : quatre doigts en même temps. Au clavier : maintenez quatre touches (lettre à côté de chaque animal).</p>
      <p class="center" id="held">Yeux pressés : 0</p>`;
    const svg = el.querySelector('svg');
    const paint = () => {
      el.querySelectorAll('.eye-btn').forEach(g => g.querySelector('.eyeball').setAttribute('fill', held.has(+g.dataset.i) ? '#ffd36a' : '#fff'));
      el.querySelector('#held').textContent = 'Yeux pressés : ' + held.size + (held.size ? ' (' + [...held].map(i => N[i][0]).join(', ') + ')' : '');
    };
    const check = () => {
      paint();
      if (done || held.size < 4) return;
      const ok = held.size === 4 && P.REGARDS_OK.every(i => held.has(i));
      const names = [...held].map(i => N[i][0]).join(' + ');
      if (ok) { done = true; ctx.win('Clic-clic-clic-clic ! La trappe latérale s\'entrouvre… mais une tige la retient encore.', names); }
      else { ctx.fail('Quatre yeux pressés, et la trappe attend d\'autres animaux. Suivez encore les regards.', names); }
    };
    const pointers = new Map();
    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.eye-btn'); if (!g) return;
      e.preventDefault();
      pointers.set(e.pointerId, +g.dataset.i); held.add(+g.dataset.i); check();
    });
    const up = e => { if (!pointers.has(e.pointerId)) return; held.delete(pointers.get(e.pointerId)); pointers.delete(e.pointerId); paint(); };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('pointerleave', up);
    const kd = e => { const i = keys.indexOf(e.key.toUpperCase()); if (i < 0 || e.repeat) return; held.add(i); check(); };
    const ku = e => { const i = keys.indexOf(e.key.toUpperCase()); if (i < 0) return; held.delete(i); paint(); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const cleanup = () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('hashchange', cleanup); };
    window.addEventListener('hashchange', cleanup);
    const obs = new MutationObserver(() => { if (!document.body.contains(svg)) { cleanup(); obs.disconnect(); } });
    obs.observe(document.getElementById('app'), { childList: true, subtree: true });
  };
  P.REGARDS_KEYS = 'QSDFGHJKLMWXCV';

  // ---------- fente : labyrinthe à l'aveugle ----------
  P.MAZE = ['S..#.', '##.#.', '...#.', '.###.', '....R'];
  P.aveugle = function (ctx, el) {
    const M = P.MAZE, sc = ctx.scratch;
    sc.p = sc.p || [0, 0]; sc.seen = sc.seen || ['0,0']; sc.walls = sc.walls || [];
    const draw = () => {
      const [r, c] = sc.p, cell = 52;
      el.innerHTML = `<p class="center">La tige-crochet passe par une fente du couvercle. Dessous : un labyrinthe que personne ne voit. Avancez à tâtons jusqu'à sentir l'anneau, puis tirez.</p>
        <div class="stage" style="max-width:300px"><svg viewBox="0 0 270 270" data-testid="fente" style="background:#1d120a;border-radius:10px">
          ${M.map((row, y) => row.split('').map((ch, x) => { const k = y + ',' + x; const seen = sc.seen.includes(k);
            return `<rect x="${5 + x * cell}" y="${5 + y * cell}" width="${cell - 2}" height="${cell - 2}" rx="4" fill="${seen ? '#4a3220' : '#24170d'}"/>`; }).join('')).join('')}
          ${sc.walls.map(w => { const [y, x] = w.split(',').map(Number); return `<rect x="${5 + x * cell + 8}" y="${5 + y * cell + 8}" width="${cell - 18}" height="${cell - 18}" fill="#6b4426" opacity=".7"/><text x="${5 + x * cell + cell / 2 - 1}" y="${5 + y * cell + cell / 2 + 4}" fill="#e9d4a8" font-size="11" text-anchor="middle" font-family="Plume">toc</text>`; }).join('')}
          <text x="31" y="20" fill="#e2c47a" font-size="10" text-anchor="middle">fente</text>
          <g transform="translate(${5 + c * cell + cell / 2 - 1} ${5 + r * cell + cell / 2 - 1})"><path d="M0 -14 v18 a7 7 0 0 0 14 0" stroke="#d8dde0" stroke-width="4" fill="none"/></g>
        </svg></div>
        <div class="row c" style="max-width:220px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr)">
          <span></span><button class="btn" data-m="-1,0" data-testid="m-haut">▲</button><span></span>
          <button class="btn" data-m="0,-1" data-testid="m-gauche">◀</button><button class="btn" data-testid="tirer">Tirer</button><button class="btn" data-m="0,1" data-testid="m-droite">▶</button>
          <span></span><button class="btn" data-m="1,0" data-testid="m-bas">▼</button><span></span></div>`;
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
        const [dr, dc] = b.dataset.m.split(',').map(Number), nr = sc.p[0] + dr, nc = sc.p[1] + dc;
        if (nr < 0 || nc < 0 || nr > 4 || nc > 4) { ctx.fb('Toc : le bord de la malle.', ''); return; }
        if (M[nr][nc] === '#') { const k = nr + ',' + nc; if (!sc.walls.includes(k)) sc.walls.push(k); ctx.fb('Toc : un tasseau barre le passage.', ''); }
        else { sc.p = [nr, nc]; const k = nr + ',' + nc; if (!sc.seen.includes(k)) sc.seen.push(k); ctx.fb(M[nr][nc] === 'R' ? 'Le crochet frôle quelque chose de rond…' : '', ''); }
        ctx.save(); draw();
      });
      el.querySelector('[data-testid="tirer"]').onclick = () => {
        if (M[sc.p[0]][sc.p[1]] === 'R') ctx.win('Le crochet attrape l\'anneau : le loquet cède, la malle du Braconnier s\'ouvre !', sc.p.join(','));
        else ctx.fail('Le crochet remonte à vide : l\'anneau est plus loin.', sc.p.join(','));
      };
    };
    draw();
  };

  // ---------- peau de bête + cordelette ----------
  const ISLAND = 'M60 120 C 50 80, 90 40, 150 34 C 210 28, 270 40, 300 80 C 330 120, 320 170, 290 200 C 250 236, 170 246, 120 226 C 80 210, 66 160, 60 120 Z';
  P.LIEUX = { stpaul: [78, 108, 'Étang de Saint-Paul'], maido: [118, 112, 'Maïdo'], piton: [170, 128, 'Piton des Neiges'], palmistes: [232, 136, 'Plaine des Palmistes'],
    stpierre: [140, 222, 'Saint-Pierre'], stdenis: [170, 42, 'Saint-Denis'], stbenoit: [292, 120, 'Saint-Benoît'], volcan: [256, 186, 'Piton de la Fournaise'], cilaos: [150, 160, 'Cilaos'], mafate: [140, 96, 'Mafate'] };
  P.PISTES = {
    stpaul: { via: ['stpaul', 'maido', 'piton', 'palmistes'], letters: 'RUSE', at: [[100, 127], [144, 137], [192, 148], [215, 151]], col: '#7a3f1f' },
    stpierre: { via: ['stpierre', 'cilaos', 'piton', 'mafate'], letters: 'PIEU', at: [[153, 215], [157, 194], [173, 121], [158, 105]], col: '#5b5b5b' },
    stbenoit: { via: ['stbenoit', 'palmistes', 'volcan', 'stpierre'], letters: 'BOUC', at: [[255, 125], [251, 182], [205, 196], [171, 207]], col: '#7a6a2a' },
    stdenis: { via: ['stdenis', 'mafate', 'maido', 'stpaul'], letters: 'CERF', at: [[154, 54], [145, 71], [135, 88], [121, 102]], col: '#3d5a3a' }
  };
  P.peau = function (ctx, el) {
    const sc = ctx.scratch; const L = P.LIEUX;
    const draw = () => {
      const pistes = Object.entries(P.PISTES).map(([k, p]) => {
        const pts = p.via.map(v => L[v]);
        const d = 'M' + pts.map(q => q[0] + ' ' + q[1]).join(' L');
        const lettersAt = p.at; // placées par un petit script : ≥ 19 unités entre deux lettres, à l'écart des noms de lieux
        const on = sc.piste === k;
        return `<path d="${d}" stroke="${p.col}" stroke-width="2.5" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>
          ${pts.map((q, i) => i ? `<g transform="translate(${q[0] - 4} ${q[1] - 10}) scale(.5)" fill="${p.col}"><ellipse cx="8" cy="12" rx="5" ry="6"/><circle cx="3" cy="3" r="2.4"/><circle cx="8" cy="1" r="2.4"/><circle cx="13" cy="3" r="2.4"/></g>` : '').join('')}
          ${lettersAt.map((q, i) => `<text x="${q[0]}" y="${q[1]}" font-family="Fell" font-size="20" fill="#2b1a0c" stroke="#e9d4a8" stroke-width="3" paint-order="stroke" text-anchor="middle">${p.letters[i]}</text>`).join('')}
          ${on ? `<path d="${d}" stroke="#f3e2b0" stroke-width="3.5" fill="none" class="pop"/>${lettersAt.map(q => `<circle cx="${q[0]}" cy="${q[1] - 5}" r="11" fill="none" stroke="#f3e2b0" stroke-width="3"/>`).join('')}` : ''}`;
      }).join('');
      // lettres leurres semées
      const decoy = [[299, 53, 'T'], [70, 215, 'A'], [226, 50, 'N'], [71, 51, 'O'], [300, 225, 'L'], [108, 178, 'M'], [300, 102, 'I']].map(q => `<text x="${q[0]}" y="${q[1]}" font-family="Fell" font-size="20" fill="#2b1a0c" stroke="#e9d4a8" stroke-width="3" paint-order="stroke" text-anchor="middle">${q[2]}</text>`).join('');
      el.innerHTML = `<p class="center">Le coffre est une boîte à munitions fermée par un cadenas à lettres. Dans la malle : une peau de bête peinte et une cordelette à 4 nœuds. Choisissez par où la poser : elle épouse une piste et ses nœuds entourent 4 lettres.</p>
        <div class="row c"><button class="btn ghost" data-doc="carnetV">Relire le carnet de traque</button></div>
        <div class="stage"><svg viewBox="0 0 380 270" data-testid="peau">
          <path d="M14 30 C 4 70 26 110 10 150 C 0 200 30 240 60 262 C 150 270 240 258 330 266 C 372 230 360 180 374 130 C 384 80 360 40 368 12 C 280 0 180 14 100 4 C 60 2 30 10 14 30Z" fill="#c9a274" stroke="#6b4426" stroke-width="3"/>
          <path d="${ISLAND}" fill="#b08458" stroke="#5a371d" stroke-width="2.5" opacity=".9"/>
          ${pistes}${decoy}
          ${Object.values(L).map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="2.6" fill="#2b1a0c"/><text x="${q[0]}" y="${q[1] + 14}" font-size="10" text-anchor="middle" fill="#2b1a0c" font-style="italic" stroke="#c9a274" stroke-width="2.5" paint-order="stroke">${q[2]}</text>`).join('')}
        </svg></div>
        <p class="center"><b>Poser la cordelette à partir de :</b></p>
        <div class="row c">${Object.keys(P.PISTES).map(k => `<button class="btn ${sc.piste === k ? '' : 'ghost'}" data-p="${k}" data-testid="piste-${k}">${L[k][2]}</button>`).join('')}</div>
        <div id="lk"></div>`;
      el.querySelector('[data-doc]').onclick = () => window.APP.showDoc('carnetV');
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { sc.piste = b.dataset.p; ctx.save(); ctx.APP.log(ctx.team, ctx.step.id, 'cordelette posée', b.dataset.p); draw(); });
      P.lock(el.querySelector('#lk'), { n: 4, alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', code: ctx.step.code, testid: 'munitions', label: 'Ouvrir la boîte à munitions',
        onOpen: c => ctx.win(`« ${c} » : le couvercle de la boîte à munitions bascule. Dedans, une cartouche roulée et le 8e pion (n° ${C.HUITIEME.VERT}).`, c),
        onFail: c => ctx.fail(`« ${c} » : la boîte reste fermée. Quelle piste raconte le carnet ?`, c) });
    };
    draw();
  };

  // ================= BLEU =================
  function carteDiagonale(dirs) {
    const st = [['volcan', '#c0392b'], ['piton', '#f6f6f2'], ['cilaos', '#3f7d3a'], ['mafate', '#7a4b26']];
    const L = P.LIEUX;
    return `<svg viewBox="40 20 300 230" style="width:100%;max-width:420px" data-testid="diagonale"><rect x="40" y="20" width="300" height="230" fill="#c5d9e0"/>
      <path d="${ISLAND}" fill="#d8c69a" stroke="#5a371d" stroke-width="2"/>
      <path d="M${L.stpierre[0]} ${L.stpierre[1]} C 230 230, 270 200, ${L.volcan[0]} ${L.volcan[1]} C 220 160, 180 150, ${L.piton[0]} ${L.piton[1]} C 150 150, 140 160, ${L.cilaos[0]} ${L.cilaos[1]} C 120 130, 130 110, ${L.mafate[0]} ${L.mafate[1]} C 150 70, 160 60, ${L.stdenis[0]} ${L.stdenis[1]}" fill="none" stroke="#3b2a1a" stroke-width="2" stroke-dasharray="5 4"/>
      <g transform="translate(${L.stpierre[0] - 8} ${L.stpierre[1] - 6})"><path d="M8 0v16M2 12c2 5 10 5 12 0M4 4h8" stroke="#2f5d95" stroke-width="2.4" fill="none"/></g>
      <text x="${L.stpierre[0]}" y="${L.stpierre[1] + 22}" font-size="10" text-anchor="middle">Saint-Pierre (départ)</text>
      <text x="${L.stdenis[0]}" y="${L.stdenis[1] - 8}" font-size="10" text-anchor="middle">Saint-Denis (arrivée)</text>
      ${st.map((s, i) => `<circle cx="${L[s[0]][0]}" cy="${L[s[0]][1]}" r="9" fill="${s[1]}" stroke="#3b2a1a" stroke-width="1.6"/><text x="${L[s[0]][0] + 13}" y="${L[s[0]][1] + 4}" font-size="9.5">${L[s[0]][2]}</text>
        ${dirs && dirs[i] ? `<g transform="translate(${L[s[0]][0] - 10} ${L[s[0]][1] - 30})">${A.arrow(dirs[i], s[1], 20).replace('<svg', '<svg x="0" y="0"')}</g>` : ''}`).join('')}
    </svg>`;
  }
  P.carteDiagonale = carteDiagonale;
  const stepIntro = (ctx, txt) => `<p class="center">${txt}</p><details class="small"><summary>Voir la carte du couvercle</summary><div class="center">${carteDiagonale()}</div></details>`;

  // ---------- anamorphose ----------
  P.anamorphose = function (ctx, el) {
    const sc = ctx.scratch; sc.h = sc.h ?? 70;
    const k = 6; // étirement peint
    el.innerHTML = stepIntro(ctx, 'Sur le couvercle, une tache rouge étirée près du volcan. Un œilleton de longue-vue est fixé au ras du bois : abaissez votre regard jusqu\'à ce que le dessin devienne net.') + `
      <div class="stage" style="max-width:360px"><svg viewBox="0 0 200 200" data-testid="anamorphose" style="background:#efe2c6;border-radius:50%;border:8px solid #b08a3e">
        <g id="ana"></g></svg></div>
      <label class="center" style="display:block">Hauteur de l'œil au-dessus du couvercle : <b id="hv"></b>
        <input type="range" min="2" max="90" value="${sc.h}" id="h" data-testid="oeil" style="width:100%;accent-color:#8b5a2b"></label>
      <div id="dirs"></div>`;
    const g = el.querySelector('#ana'), out = el.querySelector('#hv'), inp = el.querySelector('#h');
    const render = () => {
      const h = +inp.value, s = k * Math.sin(h * Math.PI / 180);
      const sharp = Math.abs(s - 1) < .2;
      out.textContent = h + '°' + (sharp ? ' — net !' : '');
      g.innerHTML = `<g transform="translate(100 100) scale(1 ${s}) translate(-100 -100)" style="filter:${sharp ? 'none' : `blur(${Math.min(3, Math.abs(s - 1) * 1.2)}px)`}">
        <circle cx="86" cy="42" r="9" fill="#cfc6b8"/><circle cx="100" cy="34" r="12" fill="#ddd5c8"/><circle cx="116" cy="40" r="9" fill="#cfc6b8"/>
        <path d="M18 150 L76 74 Q100 64 124 74 L182 150Z" fill="#6b4c3b" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M40 150 L80 96 M150 150 L118 100" stroke="#4a3326" stroke-width="2" fill="none"/>
        <ellipse cx="100" cy="72" rx="22" ry="6" fill="#e2552c" stroke="${INK}" stroke-width="1.6"/>
        <path d="M108 74 C 118 92, 128 104, 146 108 L 146 98 L 172 114 L 146 130 L 146 120 C 120 118, 104 102, 96 76Z" fill="#d03a22" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M104 80 C 112 96, 124 108, 146 113" stroke="#ffb347" stroke-width="2" fill="none"/>
</g>`;
      sc.h = h; ctx.save();
    };
    inp.addEventListener('input', render); render();
    P.dirChoice(ctx, el.querySelector('#dirs'), 'Vers où file la coulée de lave ?');
  };

  // ---------- taquin ----------
  P.TAQUIN_MOVES = [7, 4, 3, 6, 7, 8, 5, 2, 1, 4, 7, 8]; // index des cases que la case vide visite (mélange)
  P.taquin = function (ctx, el) {
    const sc = ctx.scratch;
    if (!sc.b) { // mélange déterministe depuis la position résolue (vide en 8)
      let b = [0, 1, 2, 3, 4, 5, 6, 7, null], e = 8;
      for (const m of P.TAQUIN_MOVES) { b[e] = b[m]; b[m] = null; e = m; }
      sc.b = b; sc.moves = 0;
    }
    const leurre = { 0: 'BAS', 2: 'GAUCHE', 4: 'DROITE', 6: 'HAUT', 7: 'GAUCHE' };
    const tileArt = t => { const x = (t % 3) * 60, y = Math.floor(t / 3) * 60;
      return `<svg viewBox="${x} ${y} 60 60" width="100%" height="100%" preserveAspectRatio="none"><rect x="0" y="0" width="180" height="180" fill="#dfe9ec"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${20 + i * 8} 170 C ${50 + i * 6} ${100 - i * 10}, ${80 + i * 3} ${30 + i * 10}, 90 ${20 + i * 12} C ${100 - i * 3} ${30 + i * 10}, ${130 - i * 6} ${100 - i * 10}, ${160 - i * 8} 170" fill="none" stroke="${i > 3 ? '#fff' : '#6b8f71'}" stroke-width="${i > 3 ? 3 : 1.6}"/>`).join('')}
        <path d="M78 34 l12 -16 12 16" fill="#fff" stroke="#3b2a1a"/><text x="${x + 56}" y="${y + 12}" font-size="9" text-anchor="end" fill="#3b2a1a" font-family="Fell">${t + 1}</text>
        ${leurre[t] ? `<g transform="translate(${x + 4} ${y + 40})">${A.arrow(leurre[t], '#9aa3a8', 16).replace('<svg', '<svg x="0" y="0"')}</g>` : ''}</svg>`; };
    const draw = () => {
      const solved = sc.b.every((t, i) => i === 8 ? t === null : t === i);
      const e = sc.b.indexOf(null);
      el.innerHTML = stepIntro(ctx, 'Le Piton des Neiges est un taquin repeint, vissé sur le flanc. Reconstituez la montagne : la case libre dévoile alors la vraie flèche.') + `
        <div class="stage" style="max-width:300px"><div data-testid="taquin" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#5a3a22;padding:6px;border-radius:10px;aspect-ratio:1">
          ${sc.b.map((t, i) => t === null ? `<div data-testid="case-vide" style="border-radius:4px;background:#efe2c6;display:grid;place-items:center">${solved ? A.arrow('HAUT', '#f6f6f2', 54).replace('<svg', '<svg class="pop" style="filter:drop-shadow(0 0 2px #3b2a1a)"') : '<span class="small mut">…</span>'}</div>`
            : `<button class="tile" data-i="${i}" data-testid="tuile-${t + 1}" style="padding:0;border:2px solid #3b2a1a;border-radius:4px;overflow:hidden;cursor:pointer;aspect-ratio:1;background:#dfe9ec">${tileArt(t)}</button>`).join('')}
        </div></div><p class="center">${sc.moves} glissement(s)</p><div id="dirs"></div>`;
      el.querySelectorAll('.tile').forEach(b => b.onclick = () => {
        const i = +b.dataset.i, adj = Math.abs(i - e) === 3 || (Math.abs(i - e) === 1 && Math.floor(i / 3) === Math.floor(e / 3));
        if (!adj) { ctx.fb('Cette tuile est coincée : faites glisser une voisine de la case libre.', ''); return; }
        sc.b[e] = sc.b[i]; sc.b[i] = null; sc.moves++; ctx.save(); draw();
      });
      P.dirChoice(ctx, el.querySelector('#dirs'), solved ? 'La montagne est entière ! Quelle direction montre la case libre ?' : 'Les petites flèches grises des tuiles sont des leurres… Quelle est la vraie direction ?');
    };
    draw();
  };

  // ---------- fil de kermesse ----------
  P.FIL_D = 'M20 150 C 40 60, 70 60, 80 120 S 110 190, 130 110 S 150 30, 170 90 S 200 170, 220 100 S 250 40, 270 80 S 290 140, 300 60';
  P.fil = function (ctx, el) {
    const sc = ctx.scratch;
    el.innerHTML = stepIntro(ctx, 'Cilaos et sa route aux 400 virages : un fil de cuivre tordu. Glissez la boucle du départ à l\'arrivée en restant autour du fil. Au moindre contact, retour au départ.') + `
      <div class="stage"><div class="fil-cadre"><svg viewBox="0 0 320 210" data-testid="fil" style="background:#2c3b2a;border-radius:10px;touch-action:pan-y">
        <path id="wire" d="${P.FIL_D}" stroke="#d68a3c" stroke-width="4" fill="none"/>
        <circle cx="20" cy="150" r="8" fill="#3f7d3a"/><text x="20" y="176" fill="#e9d4a8" font-size="11" text-anchor="middle">départ</text>
        <circle cx="300" cy="60" r="8" fill="#c0392b"/><text x="300" y="44" fill="#e9d4a8" font-size="11" text-anchor="middle">arrivée</text>
        <g id="leds"></g>
        <circle id="loop" cx="20" cy="150" r="13" fill="rgba(255,255,255,.06)" stroke="#e2c47a" stroke-width="3" style="cursor:grab"/>
      </svg><div class="fil-prise" aria-hidden="true"></div></div></div><p class="center" id="st">Saisissez la boucle au départ.</p><div id="dirs"></div>`;
    // poignée HTML posée sur le départ : là, le doigt saisit la boucle ; partout ailleurs sur le dessin, il fait défiler la page
    el.querySelector('.fil-prise').addEventListener('pointerdown', e => { el.querySelector('[data-testid="fil"]').dispatchEvent(new PointerEvent('pointerdown', e)); });
    const svg = el.querySelector('[data-testid="fil"]'), wire = el.querySelector('#wire'), loop = el.querySelector('#loop'), leds = el.querySelector('#leds');
    const len = wire.getTotalLength();
    const samples = Array.from({ length: 400 }, (_, i) => wire.getPointAtLength(len * i / 399));
    // 21 LED en rosace ; la flèche GAUCHE = sous-ensemble
    const ledPos = Array.from({ length: 21 }, (_, i) => { const a = i / 21 * Math.PI * 2; return [255 + Math.cos(a) * 34, 160 + Math.sin(a) * 34]; });
    const arrowLeds = [[230, 160], [244, 160], [258, 160], [272, 160], [286, 160], [240, 148], [240, 172], [250, 138], [250, 182]];
    const showLeds = mode => {
      leds.innerHTML = (mode === 'win' ? arrowLeds : ledPos).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${mode ? '#ffe680' : '#55623f'}" ${mode ? 'style="filter:drop-shadow(0 0 4px #ffe680)"' : ''}/>`).join('');
    };
    showLeds(null);
    let drag = false, best = 0, done = !!sc.done;
    const toSvg = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
    const reset = (msg) => { drag = false; best = 0; el.querySelector('#st').textContent = 'Reprenez la boucle au départ.'; loop.setAttribute('cx', 20); loop.setAttribute('cy', 150); showLeds('flash'); setTimeout(() => !done && showLeds(null), 350); if (msg) ctx.fail(msg, 'contact'); };
    svg.addEventListener('pointerdown', e => { if (done) return; const p = toSvg(e); if (Math.hypot(p.x - 20, p.y - 150) < 22) { drag = true; svg.setPointerCapture(e.pointerId); el.querySelector('#st').textContent = 'Doucement dans les virages…'; } });
    svg.addEventListener('pointermove', e => {
      if (!drag || done) return;
      const p = toSvg(e);
      let bi = 0, bd = 1e9;
      for (let i = Math.max(0, best - 30); i < Math.min(400, best + 30); i++) { const d = Math.hypot(samples[i].x - p.x, samples[i].y - p.y); if (d < bd) { bd = d; bi = i; } }
      if (bd > 12) return reset('Bzzz ! La boucle a touché le fil : retour au départ.');
      best = Math.max(best, bi);
      loop.setAttribute('cx', p.x); loop.setAttribute('cy', p.y);
      if (best >= 396) { done = true; drag = false; sc.done = true; ctx.save(); showLeds('win'); el.querySelector('#st').textContent = 'Arrivée ! Les lumières dessinent une flèche.'; ctx.APP.log(ctx.team, ctx.step.id, 'fil réussi'); }
    });
    svg.addEventListener('pointerup', () => { if (drag && !done) { drag = false; el.querySelector('#st').textContent = 'Boucle lâchée : reprenez-la au départ.'; reset(); } });
    if (done) showLeds('win');
    P.FIL_SAMPLES = samples;
    P.dirChoice(ctx, el.querySelector('#dirs'), 'Quelle direction dessinent les lumières ?');
  };

  // ---------- ponts de Mafate (PROPOSITION) ----------
  P.PONTS_T = [[0, 1], [1, 2, 3], [2, 0], [3, 1]];
  P.ponts = function (ctx, el) {
    const sc = ctx.scratch; sc.up = sc.up || [0, 1, 0, 0]; sc.n = sc.n || 0;
    const names = ['A', 'B', 'C', 'D'];
    const draw = () => {
      const all = sc.up.every(x => x === 0);
      el.innerHTML = stepIntro(ctx, 'Le sentier de Mafate fait le tour de la malle et franchit 4 ravines par des ponts-lamelles. Un pont en entraîne d\'autres. Posez-les tous en position « je passe ».') + `
        <p class="note-prop"><span class="prop">proposition</span> Alexia cherchait comment Mafate donne sa direction : ici, les 4 ponts posés libèrent 4 goupilles et un petit volet à ressort s'ouvre sur une flèche marron.</p>
        <div class="stage"><svg viewBox="0 0 340 200" data-testid="mafate" style="background:#6b4426;border-radius:10px">
          <path d="M20 160 C 60 100, 100 170, 140 110 S 220 60, 250 120 S 300 170, 320 60" stroke="#e9d4a8" stroke-width="6" fill="none" stroke-dasharray="10 6"/>
          ${[[62, 128], [140, 110], [214, 80], [286, 140]].map((p, i) => `<g class="pont" data-i="${i}" data-testid="pont-${names[i]}" style="cursor:pointer">
            <ellipse cx="${p[0]}" cy="${p[1]}" rx="28" ry="18" fill="#2a180b"/>
            <g transform="translate(${p[0]} ${p[1]}) rotate(${sc.up[i] ? -70 : 0})"><rect x="-30" y="-6" width="60" height="12" rx="3" fill="${sc.up[i] ? '#9c7a52' : '#c9a274'}" stroke="#2a180b" stroke-width="2"/>
            <path d="M-24 -6v12M-12 -6v12M0 -6v12M12 -6v12M24 -6v12" stroke="#6b4426"/></g>
            <text x="${p[0]}" y="${p[1] + 34}" text-anchor="middle" fill="#f6e9cf" font-family="Fell" font-size="13">pont ${names[i]} · ${sc.up[i] ? 'levé' : 'je passe'}</text></g>`).join('')}
          <g transform="translate(296 16)"><rect width="36" height="36" rx="4" fill="${all ? '#efe2c6' : '#4a2c16'}" stroke="#2a180b" stroke-width="2"/>
            ${all ? `<g class="pop">${A.arrow('BAS', '#7a4b26', 30).replace('<svg', '<svg x="3" y="3"')}</g>` : '<circle cx="18" cy="18" r="3" fill="#b08a3e"/>'}</g>
        </svg></div><p class="center">${sc.n} manœuvre(s) · ${all ? 'le volet s\'est ouvert !' : 'volet fermé'}</p><div id="dirs"></div>`;
      el.querySelectorAll('.pont').forEach(g => g.addEventListener('click', () => {
        const i = +g.dataset.i; P.PONTS_T[i].forEach(j => sc.up[j] ^= 1); sc.n++; ctx.save(); draw();
        const moved = P.PONTS_T[i].map(j => names[j]).join(' + ');
        ctx.fb(`Le pont ${names[i]} entraîne : ${moved}.`, '');
      }));
      P.dirChoice(ctx, el.querySelector('#dirs'), all ? 'Le volet s\'est ouvert : quelle direction montre-t-il ?' : 'Quand tous les ponts seront posés, la direction apparaîtra.');
    };
    draw();
  };

  // ---------- cadenas directionnel ----------
  P.directionnel = function (ctx, el) {
    const dirs = (ctx.st.scratch.directions) || {};
    const order = ['B-volcan', 'B-taquin', 'B-fil', 'B-mafate'].map(id => dirs[id]);
    const seq = [];
    const sym = { HAUT: '▲', DROITE: '▶', BAS: '▼', GAUCHE: '◀' };
    el.innerHTML = `<p class="center">Le cadenas directionnel attend 4 poussées. Le parcours de la Diagonale des Fous, de l'ancre de Saint-Pierre jusqu'à Saint-Denis, donne l'ordre.</p>
      <div class="center">${carteDiagonale(order)}</div>
      <div class="center"><div class="lockbody" data-testid="directionnel" style="display:inline-grid;grid-template-columns:repeat(3,56px);gap:6px;justify-items:center">
        <span></span><button class="btn" data-d="HAUT" data-testid="d-HAUT">▲</button><span></span>
        <button class="btn" data-d="GAUCHE" data-testid="d-GAUCHE">◀</button><div id="seq" style="font-size:20px;color:#fff3c8;align-self:center;min-width:56px;text-align:center">·</div><button class="btn" data-d="DROITE" data-testid="d-DROITE">▶</button>
        <span></span><button class="btn" data-d="BAS" data-testid="d-BAS">▼</button><span></span>
        <button class="btn" data-testid="d-open" style="grid-column:1/4">Tirer l'anse</button></div></div>`;
    const show = () => el.querySelector('#seq').textContent = seq.length ? seq.map(d => sym[d]).join('') : '·';
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (seq.length < 8) seq.push(b.dataset.d); show(); });
    el.querySelector('[data-testid="d-open"]').onclick = () => {
      const got = seq.join(',');
      if (got === ctx.step.code.join(',')) ctx.win('Le cadenas directionnel s\'ouvre : la malle du Cartographe est à vous !', got);
      else { ctx.fail('L\'anse résiste : le cadenas se remet à zéro. Suivez la course dans l\'ordre.', got); seq.length = 0; show(); }
    };
  };

  // ---------- calque (PROPOSITION) ----------
  P.NIDS = [[4, 1, 4], [2, 3, 1], [3, 4, 8], [5, 3, 5], [1, 1, 7], [5, 5, 2], [2, 5, 9], [3, 2, 3], [6, 2, 6]]; // [col 0-6, ligne 0-6, n° de bague]
  P.calque = function (ctx, el) {
    const sc = ctx.scratch; if (!sc.off) sc.off = [2, -1];
    const cell = 34, ox = 30, oy = 22;
    const draw = () => {
      const [dx, dy] = sc.off, al = dx === 0 && dy === 0;
      el.innerHTML = `<p class="note-prop"><span class="prop">proposition</span> Coffre du cartographe imaginé pour le prototype : carte des nids sans quadrillage + calque quadrillé.</p>
        <p class="center">Sur la carte, des nids bagués, sans aucun repère. Faites glisser le calque jusqu'à ce que ses 4 croix tombent sur celles de la carte, puis lisez les cases du carnet.</p>
        <div class="row c"><button class="btn ghost" data-doc="carnetB">Relire le carnet</button></div>
        <div class="stage" style="max-width:340px"><svg viewBox="0 0 300 290" data-testid="calque" style="background:#c5d9e0;border-radius:8px">
          <path d="M50 120 C 40 70, 90 30, 150 26 C 220 22, 270 50, 278 110 C 286 170, 250 240, 180 258 C 110 270, 60 220, 50 120Z" fill="#d8c69a" stroke="#5a371d" stroke-width="2"/>
          ${[[0, 0], [6, 0], [0, 6], [6, 6]].map(([c, r]) => `<path d="M${ox + c * cell + 11} ${oy + r * cell + 17}h12M${ox + c * cell + 17} ${oy + r * cell + 11}v12" stroke="#b23a2e" stroke-width="2.5"/>`).join('')}
          ${P.NIDS.map(([c, r, n]) => `<g transform="translate(${ox + c * cell + 17} ${oy + r * cell + 17})"><path d="M-10 2c2 8 18 8 20 0" fill="#8a6a3c" stroke="#3b2a1a"/><ellipse cx="-3" cy="0" rx="4" ry="5" fill="#f3ead8" stroke="#3b2a1a" stroke-width=".8"/><ellipse cx="4" cy="0" rx="4" ry="5" fill="#f3ead8" stroke="#3b2a1a" stroke-width=".8"/><text y="-9" text-anchor="middle" font-size="14" font-family="Fell" fill="#3b2a1a" stroke="#f3ead8" stroke-width="3" paint-order="stroke">${n}</text></g>`).join('')}
          <g transform="translate(${dx * cell} ${dy * cell})" opacity=".92" style="pointer-events:none">
            <rect x="${ox}" y="${oy}" width="${7 * cell}" height="${7 * cell}" fill="rgba(240,250,255,.18)" stroke="#2f5d95" stroke-width="1.5"/>
            ${Array.from({ length: 8 }, (_, i) => `<line x1="${ox + i * cell}" y1="${oy}" x2="${ox + i * cell}" y2="${oy + 7 * cell}" stroke="#2f5d95" stroke-width=".8"/><line x1="${ox}" y1="${oy + i * cell}" x2="${ox + 7 * cell}" y2="${oy + i * cell}" stroke="#2f5d95" stroke-width=".8"/>`).join('')}
            ${'ABCDEFG'.split('').map((L, i) => `<text x="${ox + i * cell + 17}" y="${oy - 5}" text-anchor="middle" font-size="11" fill="#2f5d95" font-weight="bold">${L}</text>`).join('')}
            ${[1, 2, 3, 4, 5, 6, 7].map((n, i) => `<text x="${ox - 9}" y="${oy + i * cell + 21}" text-anchor="middle" font-size="11" fill="#2f5d95" font-weight="bold">${n}</text>`).join('')}
            ${[[0, 0], [6, 0], [0, 6], [6, 6]].map(([c, r]) => `<circle cx="${ox + c * cell + 17}" cy="${oy + r * cell + 17}" r="9" fill="none" stroke="#2f5d95" stroke-width="2"/>`).join('')}
          </g></svg></div>
        <p class="center">${al ? '<b>Les 4 croix sont alignées.</b>' : 'Calque décalé : alignez les croix.'}</p>
        <div class="row c"><button class="btn ghost" data-m="-1,0" data-testid="calque-gauche">◀</button><button class="btn ghost" data-m="0,-1" data-testid="calque-haut">▲</button><button class="btn ghost" data-m="0,1" data-testid="calque-bas">▼</button><button class="btn ghost" data-m="1,0" data-testid="calque-droite">▶</button></div>
        <div id="lk"></div>`;
      el.querySelector('[data-doc]').onclick = () => window.APP.showDoc('carnetB');
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.m.split(',').map(Number); sc.off = [Math.max(-3, Math.min(3, sc.off[0] + a)), Math.max(-3, Math.min(3, sc.off[1] + c))]; ctx.save(); draw(); });
      P.lock(el.querySelector('#lk'), { n: 4, code: ctx.step.code, testid: 'instruments', label: 'Ouvrir la boîte d\'instruments',
        onOpen: c => ctx.win(`La boîte d'instruments s'ouvre : le parchemin des vols, le gabarit en croix et le 8e pion bleu (n° ${C.HUITIEME.BLEU}), lourd et aimanté.`, c),
        onFail: c => ctx.fail(`${c.split('').join('-')} : la boîte reste close. Lisez les nids dans l'ordre du carnet.`, c) });
    };
    draw();
  };

  // ---------- gabarit en croix (document) ----------
  P.gabaritHTML = () => {
    let h = '<p class="small mut">Chaque trou du plateau a sa case : lettre de colonne + chiffre de ligne. Le grand nombre est le numéro du trou.</p><table class="reg" style="text-align:center;width:auto;margin:auto"><tr><th></th>' + 'ABCDEFG'.split('').map(l => `<th style="text-align:center">${l}</th>`).join('') + '</tr>';
    for (let r = 0; r < 7; r++) {
      h += `<tr><th>${r + 1}</th>`;
      for (let c = 0; c < 7; c++) { const hole = D.holes.find(x => x.r === r && x.c === c); h += hole ? `<td style="background:#fbf4e2;border:1px solid #b8a07a;padding:4px 6px"><b style="font-size:1.1em">${hole.n}</b></td>` : '<td></td>'; }
      h += '</tr>';
    }
    return h + '</table>';
  };
})();
