/* Dodo lé pa là — énigmes (1/2) : outils communs, Alchimiste (jaune), Ornithologue (rouge), coups. */
(function () {
  const P = window.PUZZLES = window.PUZZLES || {};
  const C = window.CONTENT, A = window.ART;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  P.esc = esc;

  // ---------- cadenas / cryptex à molettes ----------
  // opts : n, alphabet (chaîne), colors (tableau), code, label, onOpen, onFail, testid
  P.lock = function (el, opts) {
    const alpha = opts.alphabet || '0123456789';
    const vals = opts.start ? opts.start.slice() : Array(opts.n).fill(0);
    el.innerHTML = `<div class="center"><div class="lockbody" data-testid="${opts.testid || 'lock'}">
      <div class="lock">${vals.map((v, i) => `<div class="wheel" data-i="${i}">
        <button type="button" data-d="-1" aria-label="molette ${i + 1} vers le haut" data-testid="w${i}-up">▲</button>
        <div class="val" data-testid="w${i}-val" style="${opts.colors ? `box-shadow:inset 0 3px 6px #000,inset 0 -3px 6px #000,0 0 0 3px ${opts.colors[i]}` : ''}">${alpha[v]}</div>
        <button type="button" data-d="1" aria-label="molette ${i + 1} vers le bas" data-testid="w${i}-down">▼</button></div>`).join('')}</div>
      <button class="btn" type="button" data-testid="${opts.testid || 'lock'}-open">${opts.label || 'Tirer sur l\'anse'}</button></div></div>`;
    el.querySelectorAll('.wheel').forEach(w => {
      const i = +w.dataset.i, v = w.querySelector('.val');
      w.querySelectorAll('button').forEach(b => b.onclick = () => {
        vals[i] = (vals[i] + (+b.dataset.d) + alpha.length) % alpha.length;
        v.textContent = alpha[vals[i]];
      });
    });
    el.querySelector('.btn').onclick = () => {
      const got = vals.map(v => alpha[v]).join('');
      if (got === opts.code) opts.onOpen(got); else opts.onFail(got);
    };
  };

  // ---------- boutons de direction (pour les 4 étapes du cartographe) ----------
  P.dirChoice = function (ctx, el, intro) {
    const dirs = [['HAUT', 'vers le haut'], ['DROITE', 'vers la droite'], ['BAS', 'vers le bas'], ['GAUCHE', 'vers la gauche']];
    el.innerHTML = `<p class="center">${intro}</p><div class="row c">${dirs.map(d => `<button class="btn ghost" data-dir="${d[0]}" data-testid="dir-${d[0]}" style="min-width:64px">${A.arrow(d[0], '#5b4632', 26)}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => {
      const d = b.dataset.dir;
      if (d === ctx.step.dir) {
        ctx.st.scratch.directions = ctx.st.scratch.directions || {};
        ctx.st.scratch.directions[ctx.step.id] = d; ctx.save();
        ctx.win('Flèche notée dans le carnet de route : ' + dirs.find(x => x[0] === d)[1] + '.', d);
      } else ctx.fail('Regardez encore : la flèche pointe ailleurs.', d);
    });
  };

  // ---------- carnet (lecture) ----------
  const ILLUS = [['fiole', 'La fiole verte', '♠'], ['mortier', 'Le mortier', null], ['plume', 'La plume grise', '♥'], ['alambic', 'L\'alambic', '♦'],
    ['lanterne', 'La lampe', null], ['sablier', 'Le sablier', '♣'], ['livre', 'Le grimoire', '♣'], ['pierre', 'La géode', '♦']];
  const eye = '<svg viewBox="0 0 24 14" width="26" height="15"><path d="M1 7c5-8 17-8 22 0-5 8-17 8-22 0z" fill="#fff8e8" stroke="#3b2a1a" stroke-width="1.5"/><circle cx="12" cy="7" r="3.6" fill="#3b2a1a"/></svg>';
  P.illusHTML = () => `<div class="objets" style="grid-template-columns:repeat(4,1fr)">${ILLUS.map((x, i) => `<div class="objet" style="min-height:0;cursor:default">${A.icon(x[0])}<div class="small">${i + 1}. ${x[1]}</div>${x[2] ? `<div>${eye} <b style="font-size:1.3em;color:${'♥♦'.includes(x[2]) ? '#b23a2e' : '#2b2016'}">${x[2]}</b></div>` : '<div class="small mut">—</div>'}</div>`).join('')}</div>`;
  P.carnet = function (ctx, el) {
    const d = C.DOCS[ctx.step.doc];
    el.innerHTML = `<div class="row c" style="margin-bottom:6px">${A.svg('0 0 220 150', '', '', '') && A.malle(ctx.team, C.TEAM_COLOR[ctx.team], true).replace('<svg', '<svg style="width:150px"')}</div>
      <p class="center">La malle est ouverte ! Au-dessus des objets, un carnet attend d'être lu.</p>
      ${d.prop ? '<p class="note-prop"><span class="prop">proposition</span> Le récit du cartographe est une proposition du prototype, à réécrire avec Alexia.</p>' : ''}
      <div class="paper old" style="box-shadow:inset 0 0 30px rgba(120,80,30,.3)"><h3>${d.titre}</h3>${d.html}${ctx.team === 'JAUNE' ? '<h3>Illustrations du carnet</h3>' + P.illusHTML() : ''}</div>
      <div class="row c"><button class="btn" data-testid="carnet-lu">Nous avons lu le carnet</button></div>
      <p class="small mut center">Le carnet rejoint votre sacoche : il resservira.</p>`;
    el.querySelector('[data-testid="carnet-lu"]').onclick = () => ctx.win('Vous connaissez maintenant votre personnage.', 'carnet lu');
  };

  // ---------- fouille : 7 pions dans 9 objets ----------
  P.fouille = function (ctx, el) {
    const objs = C.fouille(ctx.team);
    const sc = ctx.scratch; sc.found = sc.found || []; sc.opened = sc.opened || [];
    const draw = () => {
      el.innerHTML = `<p class="center">Les pions <b>${C.TEAM_LABEL[ctx.team]}s</b> sont incrustés dans les objets de la malle. Touchez un objet pour le fouiller.</p>
        <div class="objets">${objs.map((o, i) => {
          const op = sc.opened.includes(i);
          return `<button class="objet ${op && !o.pion ? 'vide' : ''}" data-i="${i}" data-testid="objet-${i}" data-pion="${o.pion || ''}">${A.icon(o.icon)}<div>${esc(o.nom)}</div>
            ${op && o.pion ? `<span class="found pop">${A.pionHTML(o.pion, C.TEAM_COLOR[ctx.team])}</span>` : ''}</button>`;
        }).join('')}</div>
        <div class="pions-tray">${sc.found.length ? sc.found.map(n => A.pionHTML(n, C.TEAM_COLOR[ctx.team])).join('') : '<span class="small" style="color:#e9d4a8">Vos pions viendront ici</span>'}</div>
        <p class="center"><b>${sc.found.length} / 7</b> pions trouvés · le 8e attend dans le coffre-fort.</p>`;
      el.querySelectorAll('.objet').forEach(b => b.onclick = () => {
        const i = +b.dataset.i, o = objs[i];
        if (sc.opened.includes(i)) return;
        sc.opened.push(i);
        if (o.pion) { sc.found.push(o.pion); ctx.save(); draw(); ctx.fb(`Pion n° ${o.pion} trouvé dans ${o.nom} !`, 'good'); if (sc.found.length === 7) ctx.win('Les 7 pions sont dans votre sacoche !', sc.found.join(',')); }
        else { ctx.save(); draw(); ctx.fail('Celui-ci est vide : le pion se cache dans un autre objet.', o.nom); }
      });
    };
    draw();
  };

  // ---------- JAUNE 1 : les lignes du couvercle ----------
  P.alchiLignes = function (ctx, el) {
    const sc = ctx.scratch; sc.rot = sc.rot || [1, 3, 2];
    const crossing = [[36, 10, 118, 84], [36, 63, 150, 22], [140, 88, 38, 62], [33, 20, 83, 83], [130, 36, 22, 17]]; // 7 croisements bien séparés (≥ 19 px)
    const draw = () => {
      const ok = sc.rot[0] === 0 && sc.rot[2] === 0 && sc.rot[1] % 2 === 0;
      const ink = '#3b2a1a';
      el.innerHTML = `<p class="center">Le couvercle est couvert de dessins. Quatre lignes de couleur partent des molettes du cadenas : chacune mène à son énigme.</p>
      <div class="stage"><svg viewBox="0 0 360 380" data-testid="couvercle">
        <rect x="4" y="4" width="352" height="372" rx="12" fill="#6b4426" stroke="#2a180b" stroke-width="3"/>
        <rect x="14" y="14" width="332" height="352" rx="8" fill="#efe2c6" opacity=".93"/>
        <!-- lignes colorées vers le cadenas -->
        <path d="M95 128 C 90 250, 130 300, 141 352" stroke="#b23a2e" stroke-width="4" fill="none" stroke-dasharray="1 0"/>
        <path d="M282 140 C 290 260, 210 300, 168 352" stroke="#3f7d3a" stroke-width="4" fill="none"/>
        <path d="M95 310 C 120 330, 180 300, 195 352" stroke="#2f5d95" stroke-width="4" fill="none"/>
        <path d="M268 300 C 260 330, 230 330, 222 352" stroke="#7a3fc4" stroke-width="4" fill="none"/>
        <!-- 1. croisements (rouge) -->
        <g transform="translate(20 22)"><rect x="-4" y="-6" width="166" height="132" rx="6" fill="#f6ecd6" stroke="#b23a2e" stroke-width="2" stroke-dasharray="5 4"/>
          ${crossing.map(l => `<line x1="${l[0]}" y1="${l[1]}" x2="${l[2]}" y2="${l[3]}" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${l[0]}" cy="${l[1]}" r="2.6" fill="${ink}"/><circle cx="${l[2]}" cy="${l[3]}" r="2.6" fill="${ink}"/>`).join('')}
          <text x="78" y="118" text-anchor="middle" font-family="Plume" font-size="16" fill="#b23a2e">combien de croisements ?</text></g>
        <!-- 2. fiole et règle (verte) -->
        <g transform="translate(200 20)"><rect x="-6" y="-4" width="148" height="132" rx="6" fill="#f6ecd6" stroke="#3f7d3a" stroke-width="2" stroke-dasharray="5 4"/>
          <path d="M34 34h16v6h-3v16c14 6 22 18 22 32 0 10-4 18-8 22H23c-4-4-8-12-8-22 0-14 8-26 22-32V40h-3z" fill="#e9f0e6" stroke="${ink}" stroke-width="2.2"/>
          <rect x="104" y="8" width="24" height="106" fill="#e6cf98" stroke="${ink}" stroke-width="1.5"/>
          ${[0, 1, 2, 3, 4].map(i => `<line x1="104" y1="${110 - i * 24}" x2="${i ? 114 : 128}" y2="${110 - i * 24}" stroke="${ink}" stroke-width="1.8"/><text x="122" y="${106 - i * 24}" font-size="11" text-anchor="middle" fill="${ink}" font-family="Fell">${i}</text>`).join('')}
          <line x1="52" y1="34" x2="104" y2="38" stroke="#3f7d3a" stroke-width="1.6" stroke-dasharray="3 3"/><line x1="70" y1="110" x2="104" y2="110" stroke="#3f7d3a" stroke-width="1.6" stroke-dasharray="3 3"/>
          <text x="60" y="124" text-anchor="middle" font-family="Plume" font-size="16" fill="#3f7d3a">la fiole mesure…</text></g>
        <!-- 3. flèche à reconstituer (bleue) -->
        <g transform="translate(20 160)"><rect x="-4" y="-6" width="166" height="148" rx="6" fill="#f6ecd6" stroke="#2f5d95" stroke-width="2" stroke-dasharray="5 4"/>
          <g fill="#f6e9cf" stroke="${ink}" stroke-width="1.8">
            <path d="M8 34 h26 l-13 -24z"/><rect x="126" y="10" width="24" height="24"/><path d="M146 58 l12 7 v14 l-12 7 -12-7 v-14z"/><circle cx="76" cy="112" r="13"/></g>
          <g class="frag" data-k="0" data-testid="frag-0" transform="rotate(${sc.rot[0] * 90} 28 72)" style="cursor:pointer"><rect x="8" y="52" width="40" height="40" fill="rgba(47,93,149,.06)"/><path d="M12 72 h32 M12 64 l8 8 -8 8 M20 64 l8 8 -8 8" stroke="#2f5d95" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
          <g class="frag" data-k="1" data-testid="frag-1" transform="rotate(${sc.rot[1] * 90} 70 72)" style="cursor:pointer"><rect x="50" y="52" width="40" height="40" fill="rgba(47,93,149,.06)"/><path d="M52 72 h36" stroke="#2f5d95" stroke-width="5" stroke-linecap="round"/></g>
          <g class="frag" data-k="2" data-testid="frag-2" transform="rotate(${sc.rot[2] * 90} 112 72)" style="cursor:pointer"><rect x="92" y="52" width="40" height="40" fill="rgba(47,93,149,.06)"/><path d="M94 72 h30 M114 60 l12 12 -12 12" stroke="#2f5d95" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
          ${ok ? '<circle cx="146" cy="72" r="19" fill="none" stroke="#2f5d95" stroke-width="3" class="glow"/>' : ''}
          <text x="80" y="138" text-anchor="middle" font-family="Plume" font-size="15" fill="#2f5d95">touchez les morceaux pour les tourner</text></g>
        <!-- 4. mix (violette) -->
        <g transform="translate(200 160)"><rect x="-6" y="-6" width="148" height="148" rx="6" fill="#f6ecd6" stroke="#7a3fc4" stroke-width="2" stroke-dasharray="5 4"/>
          <rect x="6" y="80" width="128" height="22" fill="#e6cf98" stroke="${ink}" stroke-width="1.5"/>
          ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="${14 + i * 22}" y1="80" x2="${14 + i * 22}" y2="92" stroke="${ink}" stroke-width="1.6"/><text x="${14 + i * 22}" y="100" font-size="9" text-anchor="middle" fill="${ink}">${i}</text>`).join('')}
          <path d="M58 14 v52 M46 52 l12 16 12-16" stroke="#7a3fc4" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="68" y="128" text-anchor="middle" font-family="Plume" font-size="15" fill="#7a3fc4">la flèche tombe sur…</text></g>
        <!-- cadenas peint -->
        <rect x="128" y="350" width="104" height="22" rx="5" fill="#b08a3e" stroke="#5b4214"/>
        ${['#b23a2e', '#3f7d3a', '#2f5d95', '#7a3fc4'].map((c, i) => `<circle cx="${141 + i * 27}" cy="361" r="8" fill="${c}"/>`).join('')}
      </svg></div><div id="lk"></div>`;
      el.querySelectorAll('.frag').forEach(g => g.addEventListener('click', () => { const k = +g.dataset.k; sc.rot[k] = (sc.rot[k] + 1) % 4; ctx.save(); draw(); if (sc.rot[0] === 0 && sc.rot[2] === 0 && sc.rot[1] % 2 === 0) ctx.fb('La flèche est reconstituée : elle désigne une figure.', 'good'); }));
      P.lock(el.querySelector('#lk'), { n: 4, code: ctx.step.code, colors: ['#b23a2e', '#3f7d3a', '#2f5d95', '#7a3fc4'], testid: 'cadenas',
        onOpen: c => ctx.win('Clac ! Le cadenas s\'ouvre, le couvercle se soulève.', c),
        onFail: c => ctx.fail(`${c.split('').join('-')} : le cadenas reste fermé. Reprenez les lignes une à une.`, c) });
    };
    draw();
  };

  // ---------- JAUNE 4 : cryptex + tarot ----------
  const SUITS = ['♠', '♥', '♦', '♣'];
  const TAROT = (() => { // 40 cartes, lettres fixes ; 3♠=P, 7♥=I, 9♦=E, 4♣=R
    const fill = 'MOTALUSINVEDRCBAGFHJ KLNOPQSTUXYZEAIRUSOL'.replace(/ /g, '');
    const t = {}; let k = 0;
    SUITS.forEach(s => { for (let v = 1; v <= 10; v++) t[v + s] = fill[k++ % fill.length]; });
    Object.assign(t, { '3♠': 'P', '7♥': 'I', '9♦': 'E', '4♣': 'R', '9♠': 'E', '3♣': 'A', '7♦': 'O', '4♥': 'S' });
    return t;
  })();
  P.TAROT = TAROT;
  P.cryptex = function (ctx, el) {
    const obj = [['dague', 'La dague', '♠', '3 encoches sur la lame'], ['fiolecoeur', 'La fiole en cœur', '♥', '7 gouttes gravées'], ['creuset', 'Le creuset', '♦', '9 clous sur le bord'], ['sablier', 'Le sablier', '♣', '4 traits sur le socle']];
    const red = s => '♥♦'.includes(s) ? '#b23a2e' : '#2b2016';
    el.innerHTML = `<p class="center">Le coffre-fort de l'Alchimiste est un <b>cryptex à 6 lettres</b>. Dans la malle : un jeu de tarot et quatre objets gravés.</p>
      <h3>Les illustrations du carnet</h3>${P.illusHTML()}
      <h3>Les quatre objets gravés</h3><div class="objets" style="grid-template-columns:repeat(4,1fr)">${obj.map(o => `<div class="objet" style="cursor:default">${A.icon(o[0])}<div class="small"><b style="font-size:1.4em;color:${red(o[2])}">${o[2]}</b><br>${o[3]}</div></div>`).join('')}</div>
      <h3>Le jeu de tarot</h3><div class="scroll-x"><table class="reg" style="text-align:center;min-width:330px" data-testid="tarot"><tr><th></th>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<th style="text-align:center">${v}</th>`).join('')}</tr>
        ${SUITS.map(s => `<tr><th style="color:${red(s)};font-size:1.2em">${s}</th>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<td style="padding:3px 1px"><span style="display:inline-block;min-width:24px;padding:2px 0;border:1px solid #b8a07a;border-radius:4px;background:#fffaf0;font-family:Fell;font-size:1.05em">${TAROT[v + s]}</span></td>`).join('')}</tr>`).join('')}</table></div>
      <div id="lk" style="margin-top:8px"></div>`;
    P.lock(el.querySelector('#lk'), { n: 6, alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', code: ctx.step.code, testid: 'cryptex', label: 'Tirer les deux embouts',
      onOpen: c => ctx.win(`Le cryptex glisse : « ${c} » ! Dedans, roulés ensemble : le 8e pion (n° ${C.HUITIEME.JAUNE}) et une recette.`, c),
      onFail: c => ctx.fail(`« ${c} » : le cryptex reste soudé. Suivez l'ordre des yeux du carnet.`, c) });
  };

  // ---------- étape « coups » (toutes les malles) ----------
  const TOOLS = { JAUNE: ['tableau'], ROUGE: ['insectes', 'carnetR'], VERT: ['permis', 'trophees'], BLEU: ['gabarit'] };
  const INTRO = {
    JAUNE: 'La recette transforme un élément en un autre. Chaque élément a son numéro dans le tableau périodique : c\'est un numéro de trou du plateau.',
    ROUGE: 'Chaque chaîne alimentaire relie des insectes épinglés (numéros du cadre) et des oiseaux bagués (numéros du carnet) : ce sont des numéros de trous.',
    VERT: 'Chaque ligne relie une arme (son calibre, dans le permis) et des trophées (leurs points, avec le même cadre) : ce sont des numéros de trous.',
    BLEU: 'Chaque vol relevé passe par des cases de la grille. Le gabarit en croix donne le numéro de trou de chaque case.'
  };
  P.coups = function (ctx, el) {
    const t = ctx.team, moves = C.movesOf(t);
    const sc = ctx.scratch; sc.vals = sc.vals || {};
    el.innerHTML = `${ctx.team === 'BLEU' ? '<p class="note-prop"><span class="prop">proposition</span> Coffre et coups du cartographe inventés pour le prototype.</p>' : ''}
      <p>${INTRO[t]}</p>
      <div class="row c">${TOOLS[t].map(id => `<button class="btn ghost" data-doc="${id}">${C.DOCS[id].titre}</button>`).join('')}</div>
      <div class="parch" data-testid="parchemin">
        <div class="row" style="justify-content:space-between;border-bottom:1px solid #c2a774;padding-bottom:4px"><b style="font-family:Fell">Parchemin ${C.PERSO[t].replace(/^L[ae]? ?'?/, 'de l\'').replace("de l'Braconnier", 'du Braconnier').replace("de l'Cartographe", 'du Cartographe')}</b>
          <svg viewBox="-26 -26 52 52" width="34" height="34"><circle r="24" fill="${C.TEAM_COLOR[t]}"/>${A.emblem(t)}</svg></div>
        ${moves.map(m => {
          const line = C.ligne(m);
          return `<div class="coupline" data-n="${m.n}" data-testid="coup-${m.n}">
            ${A.sym(m.n - 1, C.rainbow(m.n))}
            <span class="txt" style="color:${C.rainbow(m.n)}">${line.map(esc).join(`<span class="mut" style="font-size:.8em">${C.LIEN[t]}</span>`)}</span>
            <span class="nums">${m.path.map((_, i) => `${i ? '<span class="arrow">→</span>' : ''}<input inputmode="numeric" maxlength="2" aria-label="trou ${i + 1}" data-i="${i}" value="${(sc.vals[m.n] || [])[i] || ''}">`).join('')}</span></div>`;
        }).join('')}
      </div>
      <p class="small mut">Une ligne = un coup. Le premier numéro est le pion qui part ; chaque numéro suivant est un saut. La couleur de la ligne donne son rang dans la grande partie.</p>
      <div class="row c"><button class="btn" data-testid="verifier-coups">Vérifier nos coups</button></div>`;
    el.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => window.APP.showDoc(b.dataset.doc));
    el.querySelectorAll('.coupline input').forEach(inp => inp.addEventListener('input', () => {
      const n = +inp.closest('.coupline').dataset.n; sc.vals[n] = sc.vals[n] || []; sc.vals[n][+inp.dataset.i] = inp.value.trim(); ctx.save();
    }));
    el.querySelector('[data-testid="verifier-coups"]').onclick = () => {
      let good = 0;
      const typed = [];
      moves.forEach(m => {
        const row = el.querySelector(`.coupline[data-n="${m.n}"]`);
        const v = [...row.querySelectorAll('input')].map(i => parseInt(i.value, 10));
        typed.push(v.join('-'));
        const ok = v.join('-') === m.path.join('-');
        row.classList.toggle('ok', ok); row.classList.toggle('ko', !ok);
        if (ok) good++;
      });
      if (good === moves.length) ctx.win(`Les ${moves.length} coups de votre couleur sont justes : ils correspondent exactement à la partie.`, typed.join(' | '));
      else ctx.fail(`${good} ligne(s) juste(s) sur ${moves.length}. Les lignes encadrées de brique sont à reprendre.`, typed.join(' | '));
    };
  };

  // ---------- ROUGE 1 : les 7 différences ----------
  P.DIFFS = [[146, 40, 'huppe'], [120, 64, 'œil'], [80, 70, 'bec'], [150, 110, 'tache de l\'aile'], [130, 172, 'bague'], [190, 128, 'queue'], [60, 186, 'feuille']];
  function bird(v) { // v = true : oiseau modifié
    const ink = '#3b2a1a';
    return `<path d="M20 190 C60 180 140 186 196 180" stroke="#6a3f1f" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M60 186 c-10 -14 -2 -26 12 -28 c0 14 -4 22 -12 28z" fill="${v ? '#b8862a' : '#4c9a2a'}" stroke="${ink}" stroke-width="1.5"/>
      <path d="M176 118 l${v ? 34 : 26} 6 l-6 8 l${v ? 30 : 22} 12 l-30 -6z" fill="#7b5a3a" stroke="${ink}" stroke-width="2"/>
      <path d="M100 86 c-10 30 0 70 40 76 c30 4 50-14 46-40 c-4-30-30-46-56-46 c-14 0-26 4-30 10z" fill="#c9a77a" stroke="${ink}" stroke-width="2.4"/>
      <path d="M130 100 c20 4 40 16 46 32 c-16 -2 -32 0 -44 6 c4-12 2-26 -2-38z" fill="#8f6a44" stroke="${ink}" stroke-width="2"/>
      <circle cx="150" cy="114" r="${v ? 4 : 7}" fill="${v ? '#f6e9cf' : '#2b2016'}" stroke="${ink}" stroke-width="1"/>
      <circle cx="126" cy="66" r="26" fill="#c9a77a" stroke="${ink}" stroke-width="2.4"/>
      ${v ? '' : '<path d="M138 44 c6-14 18-16 22-10 c-8 0-12 6-14 14z" fill="#8f6a44" stroke="#3b2a1a" stroke-width="1.8"/>'}
      <path d="M102 64 l-${v ? 40 : 26} 8 l${v ? 40 : 26} 4z" fill="#d6a347" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="120" cy="62" r="6" fill="#fff8e8" stroke="${ink}" stroke-width="1.5"/><circle cx="119" cy="62" r="3" fill="${v ? '#b23a2e' : ink}"/>
      <path d="M124 160 l-4 24 M140 160 l2 24" stroke="#c99a45" stroke-width="4" stroke-linecap="round"/>
      ${v ? '<rect x="135" y="168" width="11" height="6" rx="2" fill="#b23a2e" stroke="#3b2a1a" stroke-width="1"/>' : ''}`;
  }
  P.differences = function (ctx, el) {
    const sc = ctx.scratch; sc.found = sc.found || [];
    el.innerHTML = `<p class="center">Sur le couvercle, deux oiseaux presque jumeaux. Visez chaque différence de l'oiseau de <b>droite</b> avec la loupe aimantée.</p>
      <div class="stage" style="max-width:640px"><svg viewBox="0 0 440 220" data-testid="oiseaux" style="touch-action:pan-y;background:#efe2c6;border-radius:8px;border:3px solid #6b4426">
        <g>${bird(false)}</g><line x1="220" y1="6" x2="220" y2="214" stroke="#6b4426" stroke-width="2" stroke-dasharray="4 4"/>
        <g transform="translate(220 0)" id="right">${bird(true)}<rect x="0" y="0" width="220" height="220" fill="transparent" id="hit"/>
          <g id="marks" style="pointer-events:none"></g><circle id="loupe" style="pointer-events:none" r="18" fill="rgba(255,255,255,.18)" stroke="#b23a2e" stroke-width="2.5" cx="-60" cy="-60"/></g>
      </svg></div><p class="center"><b id="cnt">${sc.found.length} / 7</b> différences visées</p>`;
    const svg = el.querySelector('svg'), marks = el.querySelector('#marks'), loupe = el.querySelector('#loupe');
    const drawMarks = () => { marks.innerHTML = sc.found.map(i => `<circle cx="${P.DIFFS[i][0]}" cy="${P.DIFFS[i][1]}" r="17" fill="none" stroke="#b23a2e" stroke-width="3" class="pop"/>`).join(''); el.querySelector('#cnt').textContent = sc.found.length + ' / 7'; };
    drawMarks();
    const toLocal = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [p.x - 220, p.y]; };
    // la loupe suit le doigt (glissé horizontal) ou se pose là où l'on touche ; un glissé vertical fait défiler la page
    const moveLoupe = e => { const [x, y] = toLocal(e); loupe.setAttribute('cx', x); loupe.setAttribute('cy', y); };
    svg.addEventListener('pointermove', moveLoupe); svg.addEventListener('pointerdown', moveLoupe);
    el.querySelector('#hit').addEventListener('click', e => {
      const [x, y] = toLocal(e);
      const i = P.DIFFS.findIndex(d => Math.hypot(d[0] - x, d[1] - y) < 20);
      if (i >= 0 && !sc.found.includes(i)) {
        sc.found.push(i); ctx.save(); drawMarks(); ctx.fb('Clic ! Un capteur répond : ' + P.DIFFS[i][2] + '.', 'good');
        if (sc.found.length === 7) ctx.win('Les 7 capteurs sont activés : la gâche claque, la malle s\'ouvre !', 'ILS x7');
      } else if (i < 0) ctx.fail('Ici les deux oiseaux sont pareils : visez une autre zone.', `${Math.round(x)},${Math.round(y)}`);
    });
  };

  // ---------- ROUGE 4 : câblage du walkman ----------
  P.CABLE = {
    birds: ['Paille-en-queue', 'Papangue', 'Tec-tec', 'Tuit-tuit'],
    lieux: ['Plaine des Chicots', 'Falaise de Sainte-Rose', 'Maïdo', 'Forêt de Bébour'],
    nids: ['1', '2', '3', '4'],
    sol: { 'Paille-en-queue': 'Falaise de Sainte-Rose', 'Papangue': 'Forêt de Bébour', 'Tec-tec': 'Maïdo', 'Tuit-tuit': 'Plaine des Chicots',
      'Falaise de Sainte-Rose': '1', 'Forêt de Bébour': '2', 'Plaine des Chicots': '3', 'Maïdo': '4' }
  };
  P.cables = function (ctx, el) {
    const K = P.CABLE, sc = ctx.scratch; sc.links = sc.links || {};
    const cols = [K.birds, K.lieux, K.nids], X = [70, 180, 290];
    const pos = (c, i) => [X[c], 46 + i * 62];
    let sel = null;
    const draw = () => {
      const cablesSvg = Object.entries(sc.links).map(([a, b]) => {
        const ca = K.birds.includes(a) ? 0 : 1, ia = cols[ca].indexOf(a), ib = cols[ca + 1].indexOf(b);
        const [x1, y1] = pos(ca, ia), [x2, y2] = pos(ca + 1, ib);
        const col = ['#b23a2e', '#2f5d95', '#3f7d3a', '#c08a1a'][ia];
        return `<path d="M${x1 + 10} ${y1} C ${x1 + 60} ${y1 + 24}, ${x2 - 60} ${y2 + 24}, ${x2 - 10} ${y2}" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`;
      }).join('');
      el.innerHTML = `<p class="center">Le walkman reste muet tant que ses 8 câbles relient chaque <b>oiseau</b> à son <b>lieu</b>, et chaque lieu à son <b>nid</b>. Touchez une douille puis une douille de la colonne voisine.</p>
        <div class="row c"><button class="btn ghost" data-sh="planches">Planches anatomiques</button><button class="btn ghost" data-sh="polas">Polaroïds</button><button class="btn ghost" data-sh="nids">Les 4 nids</button><button class="btn ghost" data-sh="logi">Logigramme</button></div>
        <div class="stage"><svg viewBox="0 0 360 300" data-testid="tableau-cables" style="background:#5a3a22;border-radius:10px">
          <rect x="6" y="6" width="348" height="288" rx="8" fill="#3e2716" stroke="#b08a3e" stroke-width="2"/>
          ${['Oiseau', 'Lieu', 'N° de nid'].map((h, c) => `<text x="${X[c]}" y="24" fill="#e2c47a" font-family="Fell" font-size="14" text-anchor="middle">${h}</text>`).join('')}
          ${cablesSvg}
          ${cols.map((col, c) => col.map((name, i) => { const [x, y] = pos(c, i); const isSel = sel && sel[0] === c && sel[1] === i;
            return `<g class="sock" data-c="${c}" data-i="${i}" data-testid="sock-${c}-${i}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/><circle cx="${x}" cy="${y}" r="13" fill="${isSel ? '#ffd36a' : '#1a100a'}" stroke="#e2c47a" stroke-width="3"/><circle cx="${x}" cy="${y}" r="4" fill="#b08a3e"/>
              <text x="${x}" y="${y + 28}" fill="#f6e9cf" font-size="${c === 2 ? 15 : 11}" text-anchor="middle" font-family="Garamond">${esc(name)}</text></g>`; }).join('')).join('')}
        </svg></div>
        <div class="row c"><button class="btn" data-testid="walkman-on">Appuyer sur PLAY</button><button class="btn ghost" data-testid="cables-clear">Débrancher tout</button></div>`;
      el.querySelectorAll('.sock').forEach(g => g.addEventListener('click', () => {
        const c = +g.dataset.c, i = +g.dataset.i;
        if (!sel) { sel = [c, i]; return draw(); }
        if (Math.abs(sel[0] - c) === 1) {
          const [a, b] = sel[0] < c ? [sel, [c, i]] : [[c, i], sel];
          const from = cols[a[0]][a[1]], to = cols[b[0]][b[1]];
          for (const k of Object.keys(sc.links)) if (k === from || (sc.links[k] === to && (K.birds.includes(k) === K.birds.includes(from)))) delete sc.links[k];
          sc.links[from] = to; ctx.save();
        }
        sel = null; draw();
      }));
      el.querySelector('[data-testid="cables-clear"]').onclick = () => { sc.links = {}; ctx.save(); draw(); };
      el.querySelector('[data-testid="walkman-on"]').onclick = () => {
        const ok = Object.keys(K.sol).every(k => sc.links[k] === K.sol[k]);
        const n = Object.keys(sc.links).length;
        if (ok) ctx.win('Le moteur ronronne, la bande tourne : la cassette est prête à jouer !', JSON.stringify(sc.links));
        else ctx.fail(n < 8 ? `${n} câble(s) sur 8 branchés : le walkman attend les autres.` : 'Le circuit attend encore une liaison juste : relisez le logigramme.', JSON.stringify(sc.links));
      };
      el.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => window.APP.modal(b.textContent, SHEETS[b.dataset.sh]));
    };
    draw();
  };
  const SHEETS = {
    planches: `<table class="reg"><tr><th>Planche</th><th>Taille</th><th>Note</th></tr>
      <tr><td>Paille-en-queue</td><td>80 cm (avec la queue)</td><td>oiseau marin, plonge en mer</td></tr><tr><td>Papangue</td><td>50 cm, 1,20 m d'envergure</td><td>rapace, le plus grand oiseau de l'intérieur</td></tr>
      <tr><td>Tec-tec</td><td>13 cm</td><td>le plus petit</td></tr><tr><td>Tuit-tuit</td><td>15 cm</td><td>discret, aime l'altitude</td></tr></table>`,
    polas: `<div class="objets" style="grid-template-columns:1fr 1fr">${[['Falaise de Sainte-Rose', '40 m'], ['Forêt de Bébour', '1 300 m'], ['Plaine des Chicots', '1 800 m'], ['Maïdo', '2 200 m']].map(p => `<div class="objet" style="cursor:default;background:#fff;border:6px solid #fff;border-bottom-width:22px;box-shadow:0 3px 6px rgba(0,0,0,.3)"><div style="height:56px;background:linear-gradient(180deg,#9cc3d6,#5d8a4f);border-radius:2px"></div><b>${p[0]}</b><br><span class="hand">alt. ${p[1]}</span></div>`).join('')}</div>`,
    nids: `<table class="reg"><tr><th>Nid</th><th>Description</th></tr><tr><td>n° 1</td><td>creux de roche, au bord de l'eau</td></tr><tr><td>n° 2</td><td>large plateforme de branches</td></tr><tr><td>n° 3</td><td>petite coupe dans les fougères</td></tr><tr><td>n° 4</td><td>minuscule coupe de mousse</td></tr></table>
      <p class="small">Les nids sont numérotés dans l'ordre des altitudes, du bord de mer vers les sommets.</p>`,
    logi: `<ol><li>L'oiseau marin niche au seul lieu situé sous 100 m.</li><li>Le plus grand oiseau de l'intérieur vit dans la forêt de Bébour.</li><li>Le plus petit oiseau vit au lieu le plus haut.</li>
      <li>Le tuit-tuit vit au-dessus de 1 500 m.</li><li>Chaque nid est numéroté selon l'altitude de son lieu, du plus bas au plus haut.</li><li>Le nid le plus large appartient au plus grand oiseau de l'intérieur.</li></ol>
      <table class="reg" style="text-align:center"><tr><th></th><th>Chicots</th><th>Ste-Rose</th><th>Maïdo</th><th>Bébour</th></tr>${P.CABLE.birds.map(b => `<tr><th>${b}</th><td>☐</td><td>☐</td><td>☐</td><td>☐</td></tr>`).join('')}</table>`
  };

  // ---------- ROUGE 5 : la cassette et la cage ----------
  P.CHANT = ['rrrou', 'rrrou', 'pfit', 'rrrou', 'grrr', 'pfit', 'rrrou', 'grrr', 'grrr', 'rrrou', 'grrr', 'pfit', 'grrr', 'grrr', 'grrr'];
  P.cassette = function (ctx, el) {
    el.innerHTML = `<p class="center">La cassette joue un chant étrange. Comptez combien de fois revient chaque cri : la cage s'ouvre avec ces trois nombres, dans l'ordre où les cris apparaissent.</p>
      <div class="stage" style="max-width:420px"><svg viewBox="0 0 300 150" data-testid="walkman"><rect x="10" y="10" width="280" height="130" rx="14" fill="#7d8d93" stroke="#2f3a40" stroke-width="3"/>
        <rect x="40" y="30" width="220" height="70" rx="6" fill="#2f3a40"/><g id="reels"><circle cx="105" cy="65" r="20" fill="#cfd8dc"/><circle cx="195" cy="65" r="20" fill="#cfd8dc"/></g>
        <text id="bulle" x="150" y="128" text-anchor="middle" font-family="Plume" font-size="26" fill="#fff8e0"></text></svg></div>
      <div class="row c"><button class="btn" data-testid="play">▶ Écouter la cassette</button></div><div id="lk"></div>`;
    let playing = false;
    el.querySelector('[data-testid="play"]').onclick = async () => {
      if (playing) return; playing = true;
      ctx.APP.log(ctx.team, ctx.step.id, 'écoute de la cassette');
      let ac = null; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
      const bulle = el.querySelector('#bulle');
      for (const cri of P.CHANT) {
        bulle.textContent = cri + ' !';
        if (ac) chirp(ac, cri);
        await new Promise(r => setTimeout(r, window.__FAST ? 30 : 650));
        bulle.textContent = '';
        await new Promise(r => setTimeout(r, window.__FAST ? 10 : 200));
      }
      bulle.textContent = '— fin de la face A —';
      playing = false;
      if (ac) setTimeout(() => ac.close(), 500);
    };
    P.lock(el.querySelector('#lk'), { n: 3, code: ctx.step.code, testid: 'cage', label: 'Ouvrir la cage',
      onOpen: c => ctx.win('La porte de la cage pivote : le perchoir est à vous.', c),
      onFail: c => ctx.fail(`${c.split('').join('-')} : la cage reste close. Réécoutez en comptant un cri à la fois.`, c) });
  };
  function chirp(ac, cri) {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.connect(g); g.connect(ac.destination);
    if (cri === 'rrrou') { o.type = 'triangle'; o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(300, t + .45); }
    else if (cri === 'pfit') { o.type = 'sine'; o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(3400, t + .15); }
    else { o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(110, t + .4); }
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + (cri === 'pfit' ? .2 : .45));
    o.start(t); o.stop(t + .5);
  }

  // ---------- dévisser (perchoir, tige) ----------
  P.devisser = function (ctx, el) {
    const perch = ctx.step.ou === 'perchoir';
    const need = perch ? 4 : 10; // demi-tours
    const sc = ctx.scratch; sc.turns = sc.turns || 0;
    const draw = () => {
      const done = sc.turns >= need;
      el.innerHTML = `<p class="center">${perch ? 'Le barreau du perchoir semble creux. Son embout se dévisse.' : 'Une tige filetée dépasse de la malle. Dévissez-la entièrement.'}</p>
        <div class="stage" style="max-width:320px"><svg viewBox="0 0 200 200" data-testid="vis">
          <rect x="${perch ? 30 : 88}" y="${perch ? 92 : 30}" width="${perch ? 120 : 24}" height="${perch ? 18 : 120}" rx="6" fill="${perch ? '#a8743c' : '#8f9ba1'}" stroke="#3b2a1a" stroke-width="2"/>
          ${perch ? '' : Array.from({ length: 12 }, (_, i) => `<line x1="88" y1="${36 + i * 9}" x2="112" y2="${40 + i * 9}" stroke="#3b2a1a" stroke-width="1.2"/>`).join('')}
          <g transform="translate(${perch ? 158 : 100} ${perch ? 101 : 160 + Math.min(sc.turns, need) * 3}) rotate(${sc.turns * 180})">
            <circle r="22" fill="#c9a04a" stroke="#3b2a1a" stroke-width="2.5"/><path d="M-14 0h28M0-14v28" stroke="#5b4214" stroke-width="3"/><circle r="5" fill="#5b4214"/></g>
          ${done ? (perch ? `<g class="pop"><circle cx="178" cy="60" r="14" fill="${C.TEAM_COLOR.ROUGE}" stroke="#3b2a1a"/><text x="178" y="65" font-family="Fell" text-anchor="middle" fill="#fff" font-size="14">${C.HUITIEME.ROUGE}</text><path d="M120 40h40v24h-40z" fill="#f3e5c0" stroke="#3b2a1a"/></g>` : '<path class="pop" d="M100 190 v-10 c0-14 18-14 18 0" stroke="#5d6f7a" stroke-width="5" fill="none"/>') : ''}
        </svg></div>
        <p class="center">${done ? '' : `${(sc.turns / 2).toLocaleString('fr-FR')} tour(s) effectué(s)`}</p>
        <div class="row c"><button class="btn" data-testid="tourner-gauche">↺ Tourner à gauche</button><button class="btn" data-testid="tourner-droite">Tourner à droite ↻</button></div>`;
      el.querySelector('[data-testid="tourner-gauche"]').onclick = () => {
        if (sc.turns >= need) return;
        sc.turns++; ctx.save(); draw();
        if (sc.turns >= need) ctx.win(perch ? `L'embout tombe dans votre main : le 8e pion (n° ${C.HUITIEME.ROUGE}) et un parchemin roulé !` : 'La tige sort : elle se termine par un crochet. Parfait pour la fente !', 'dévissé');
      };
      el.querySelector('[data-testid="tourner-droite"]').onclick = () => ctx.fail('Ça serre davantage : dévissez dans l\'autre sens.', 'droite');
    };
    draw();
  };

  // déblocage MJ : remplit ce qui sert ensuite
  P.autoSolve = function (team, step, st) {
    const sc = st.scratch[step.id] = st.scratch[step.id] || {};
    if (step.type === 'fouille') { const o = C.fouille(team); sc.opened = o.map((_, i) => i); sc.found = o.filter(x => x.pion).map(x => x.pion); }
    if (step.dir) { st.scratch.directions = st.scratch.directions || {}; st.scratch.directions[step.id] = step.dir; }
  };
})();
