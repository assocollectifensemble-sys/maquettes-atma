/* Dodo lé pa là — grande partie de solitaire, 5e caisse, œuf et choix final. */
(function () {
  const C = window.CONTENT, A = window.ART, D = window.DODO_DATA;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CENTER = D.holes.find(h => h.r === 3 && h.c === 3).n;

  const MID = (a, b) => { const ha = D.holes[a - 1], hb = D.holes[b - 1]; return D.holes.find(x => x.r === (ha.r + hb.r) / 2 && x.c === (ha.c + hb.c) / 2); };
  // occupation après nMoves coups. Valeur = identité du pion (= son trou de départ, qui porte sa lettre UV).
  // Les sauts sont rejoués géométriquement ; m.eats (identités des pions mangés) sert de contrôle.
  function boardState(nMoves) {
    const occ = {}; D.holes.forEach(h => occ[h.n] = h.n !== CENTER ? h.n : null);
    for (let i = 0; i < nMoves; i++) {
      const m = D.moves[i]; let at = m.path[0]; const who = occ[at];
      m.path.slice(1).forEach((z, k) => { const mid = MID(at, z); if (occ[mid.n] !== m.eats[k]) throw new Error('partie incohérente au coup ' + m.n); occ[mid.n] = null; occ[at] = null; occ[z] = who; at = z; });
    }
    return occ;
  }
  const teamOfPion = n => D.holes[n - 1].team;
  const XY = h => [30 + h.c * 52, 30 + h.r * 52];

  window.FINALE = function (root, APP) {
    const S = APP.S(), F = S.finale;
    if (!F.started) { F.started = Date.now(); APP.log('PLATEAU', 'finale', 'début de la grande partie'); }
    let sel = null; // { from, hops:[...] }
    const render = () => {
      if (F.done) return caisse();
      const occ = boardState(F.moves);
      const next = D.moves[F.moves];
      const eatenPions = D.moves.slice(0, F.moves).flatMap(m => m.eats);
      const curOcc = Object.assign({}, occ);
      // appliquer les sauts en cours
      const pendingPions = [];
      if (sel) { let at = sel.from; sel.hops.forEach(h => { const mid = MID(at, h); pendingPions.push(curOcc[mid.n]); curOcc[h] = curOcc[at]; curOcc[at] = null; curOcc[mid.n] = null; at = h; }); }
      const at = sel ? (sel.hops.length ? sel.hops[sel.hops.length - 1] : sel.from) : null;
      const pions = eatenPions.concat(pendingPions);
      const letters = pions.map(n => D.holes[n - 1].letter);
      root.innerHTML = APP.topbar('La grande partie', '#5a3a22', { seal: F.moves }) + `
        <div class="paper"><p class="center">Le plateau de solitaire du muséum. Chaque équipe joue ses coups quand sa <b>couleur d'arc-en-ciel</b> arrive. Touchez le pion qui part, puis chaque trou où il atterrit.</p>
        <div class="greffier" data-testid="greffier">${next ? `<span class="sym-wrap">${A.sym(next.n - 1, C.rainbow(next.n))}</span> Coup <b>${next.n}</b> sur 18 · au tour de <b style="background:${C.TEAM_COLOR[next.team]};color:#fff;padding:1px 8px;border-radius:10px;white-space:nowrap">${C.PERSO[next.team]}</b> (${next.path.length - 1} saut${next.path.length > 2 ? 's' : ''})` : 'Tous les coups sont joués.'}</div>
        <div class="board-wrap"><svg viewBox="0 0 364 364" data-testid="plateau">
          <defs><radialGradient id="wood" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#a8743c"/><stop offset="1" stop-color="#5a3a22"/></radialGradient>
            <radialGradient id="hole" cx=".5" cy=".4"><stop offset="0" stop-color="#1a100a"/><stop offset="1" stop-color="#3e2716"/></radialGradient></defs>
          <circle cx="182" cy="182" r="178" fill="url(#wood)" stroke="#2a180b" stroke-width="4"/>
          <circle cx="182" cy="182" r="166" fill="none" stroke="#e2c47a" stroke-width="1" opacity=".5"/>
          ${D.holes.map(h => { const [x, y] = XY(h); const p = curOcc[h.n]; const isSel = at === h.n; const isEmpty = p == null;
            return `<g class="hole" data-n="${h.n}" data-testid="trou-${h.n}" style="cursor:pointer">
              <circle cx="${x}" cy="${y}" r="20" fill="url(#hole)" stroke="#2a180b" stroke-width="1.5"/>
              <text x="${x + 16}" y="${y - 15}" font-size="9" fill="#f3e2b0" text-anchor="middle">${h.n}</text>
              ${!isEmpty ? `<circle cx="${x}" cy="${y}" r="16" fill="${C.TEAM_COLOR[teamOfPion(p)]}" stroke="${isSel ? '#ffe680' : '#1a100a'}" stroke-width="${isSel ? 4 : 1.5}"/><circle cx="${x - 5}" cy="${y - 6}" r="5" fill="#fff" opacity=".35"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Fell" font-size="13" fill="#fff">${p}</text>` : ''}
              <circle cx="${x}" cy="${y}" r="24" fill="transparent"/></g>`; }).join('')}
        </svg></div>
        <div class="feedback" id="fb" aria-live="polite"></div>
        <div class="row c">${sel ? `<button class="btn" id="valider" data-testid="valider-coup">Poser le pion ici</button><button class="btn ghost" id="annuler" data-testid="annuler-coup">Reprendre ce coup</button>` : (F.moves ? `<button class="btn ghost" id="undo" data-testid="annuler-dernier">Rejouer le coup ${F.moves} (secours)</button>` : '')}</div>
        <h3>Les pions mangés, sous la lampe UV</h3>
        <p class="small mut">Chaque pion mangé sort du plateau et rejoint la file, dans l'ordre. Sa lettre cachée s'allume.</p>
        <div class="uvtray" data-testid="pions-manges">${pions.map(n => `<span class="uvp" style="--tc:${C.TEAM_COLOR[teamOfPion(n)]}"><small>${n}</small>${esc(D.holes[n - 1].letter)}</span>`).join('') || '<span class="small mut">La file attend le premier pion mangé.</span>'}</div>
        <div class="parch center" data-testid="message" style="font-family:Fell;font-size:1.25em;letter-spacing:.06em">${esc(C.PHRASE_FMT(letters))}</div>
        </div>
        <div class="paper"><h3>Légende du plateau : les 18 coups</h3><div class="legend">${D.moves.map(m => `<div class="lg ${m.n <= F.moves ? 'done' : m.n === F.moves + 1 ? 'next' : ''}"><span class="sym-wrap">${A.sym(m.n - 1, C.rainbow(m.n))}</span><b style="color:${C.rainbow(m.n)}">${m.n}</b> <svg viewBox="-26 -26 52 52" width="18" height="18"><circle r="24" fill="${C.TEAM_COLOR[m.team]}"/></svg></div>`).join('')}</div>
        <p class="small mut">Les parchemins disent quels trous ; la légende dit dans quel ordre (couleur + symbole). Le maître du jeu garde le corrigé.</p></div>`;
      const fb = (m, k) => { const f = root.querySelector('#fb'); f.className = 'feedback ' + (k || ''); f.textContent = m; };
      root.querySelectorAll('.hole').forEach(g => g.addEventListener('click', () => {
        const n = +g.dataset.n;
        if (!next) return;
        if (!sel) {
          if (curOcc[n] == null) return fb('Ce trou est vide : touchez d\'abord le pion qui part.', '');
          if (n !== next.path[0]) { F.errors = (F.errors || 0) + 1; APP.log(next.team, 'coup ' + next.n, 'mauvais pion de départ', n); APP.save(); return fb(`Le pion n° ${n} attend son tour. Relisez la ligne de couleur ${next.n} (son symbole est en haut).`, 'bad'); }
          sel = { from: n, hops: [] }; render(); return;
        }
        if (n === at) return;
        const ha = D.holes[at - 1], hb = D.holes[n - 1];
        const dr = hb.r - ha.r, dc = hb.c - ha.c;
        const mid = D.holes.find(x => x.r === ha.r + dr / 2 && x.c === ha.c + dc / 2);
        const legal = ((Math.abs(dr) === 2 && dc === 0) || (Math.abs(dc) === 2 && dr === 0)) && curOcc[n] == null && mid && curOcc[mid.n] != null;
        if (!legal) return fb('Un saut se fait par-dessus un pion voisin, vers un trou vide, en ligne droite.', 'bad');
        const k = sel.hops.length + 1;
        if (next.path[k] !== n) { F.errors = (F.errors || 0) + 1; APP.log(next.team, 'coup ' + next.n, 'saut hors parchemin', `${at}→${n}`); APP.save(); sel = null; render(); return fb('Ce saut est permis par les règles, mais ce n\'est pas celui du parchemin : le pion revient à son trou.', 'bad'); }
        sel.hops.push(n); render();
        if (sel.hops.length === next.path.length - 1) fb('Dernier saut du parchemin : posez le pion.', 'good');
        else fb('Saut réussi ! Le parchemin en prévoit un autre.', 'good');
      }));
      const v = root.querySelector('#valider');
      if (v) v.onclick = () => {
        if (sel.hops.length !== next.path.length - 1) { F.errors = (F.errors || 0) + 1; APP.log(next.team, 'coup ' + next.n, 'coup incomplet', sel.hops.join('-')); APP.save(); return fb(`Le parchemin prévoit ${next.path.length - 1} saut(s) : ${sel.hops.length} faits. Continuez !`, 'bad'); }
        APP.log(next.team, 'coup ' + next.n, 'coup joué', next.path.join('→'));
        F.moves++; sel = null;
        if (F.moves === D.moves.length) { F.done = Date.now(); APP.log('PLATEAU', 'finale', 'dernier pion au centre', `pion ${D.last} · ${APP.fmt(F.done - F.started)}`); }
        APP.save(); render();
      };
      const an = root.querySelector('#annuler'); if (an) an.onclick = () => { sel = null; render(); };
      const un = root.querySelector('#undo'); if (un) un.onclick = () => { F.moves--; APP.log(D.moves[F.moves].team, 'coup ' + (F.moves + 1), 'coup repris par le secours', ''); APP.save(); render(); fb(`Le coup ${F.moves + 1} revient sur le plateau : rejouez-le.`, ''); };
    };

    function caisse() {
      const letters = D.captureOrder.map(n => D.holes[n - 1].letter);
      const opened = !!F.caisse;
      root.innerHTML = APP.topbar('La cinquième caisse', '#5a3a22', { seal: '★' }) + `
        <div class="paper center pop" data-testid="finale-message"><h2>Le plateau a parlé</h2>
          <div class="parch" style="font-family:Fell;font-size:1.35em">${C.PHRASE_FMT(letters)}</div>
          <p class="small mut">« Le dodo n'est pas là, mais le solitaire était là depuis longtemps. »</p>
          <p>Il reste un seul pion, le n° ${D.last}, au centre du plateau. Il est lourd : un aimant est caché dedans.</p>
          ${opened ? '' : `<button class="btn glow" data-testid="ouvrir-caisse">Poser le pion n° ${D.last} sur la serrure de la 5e caisse</button>`}
        </div>
        ${opened ? `<div class="paper center" data-testid="oeuf"><div style="max-width:200px;margin:auto">${A.egg('pop')}</div>
          <h2>L'œuf du solitaire</h2><p>Le verrou magnétique cède. Dans la paille : un œuf, intact. Le dernier œuf du solitaire de La Réunion, celui que vos quatre chasseurs cherchaient.</p>
          <p><b>Que décidez-vous ?</b> Chaque équipe vote.</p>
          <div class="vote">${['science', 'foret'].map(k => `<div class="choice"><h3>${C.FINS[k].titre}</h3><div class="count" data-testid="count-${k}">${F.vote[k]}</div><button class="btn" data-v="${k}" data-testid="vote-${k}">Une voix pour ${k === 'science' ? 'la science' : 'la forêt'}</button></div>`).join('')}</div>
          <div class="row c"><button class="btn glow" data-testid="decider" ${F.vote.science + F.vote.foret ? '' : 'disabled'}>Sceller la décision</button></div></div>` : ''}
        ${F.choix ? `<div class="paper center pop" data-testid="fin"><h2>${C.FINS[F.choix].titre}</h2><p>${C.FINS[F.choix].txt}</p>
          <p>Temps de la grande partie : <b>${APP.fmt(F.done - F.started)}</b>.</p>
          <label>Signez le registre du muséum : <input id="sig" data-testid="signatures" style="width:100%;padding:8px;font-family:Plume;font-size:1.3em" value="${esc(F.signatures || '')}" placeholder="vos prénoms"></label>
          <div class="row c"><button class="btn" data-testid="signer">Signer le registre</button><a class="btn ghost" href="#/">Retour au musée</a></div></div>` : ''}`;
      const oc = root.querySelector('[data-testid="ouvrir-caisse"]'); if (oc) oc.onclick = () => { F.caisse = Date.now(); APP.log('PLATEAU', 'finale', '5e caisse ouverte'); APP.save(); caisse(); };
      root.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { F.vote[b.dataset.v]++; APP.log('PLATEAU', 'finale', 'vote', b.dataset.v); APP.save(); caisse(); });
      const dc = root.querySelector('[data-testid="decider"]'); if (dc) dc.onclick = () => {
        F.choix = F.vote.foret > F.vote.science ? 'foret' : F.vote.science > F.vote.foret ? 'science' : 'foret';
        APP.log('PLATEAU', 'finale', 'décision', `${F.choix} (${F.vote.science} science / ${F.vote.foret} forêt)`); APP.save(); caisse();
        setTimeout(() => { const f = root.querySelector('[data-testid="fin"]'); if (f) f.scrollIntoView({ behavior: 'smooth' }); }, 50);
      };
      const sg = root.querySelector('[data-testid="signer"]'); if (sg) sg.onclick = () => { F.signatures = root.querySelector('#sig').value; APP.log('PLATEAU', 'finale', 'registre signé', F.signatures); APP.save(); sg.textContent = 'Registre signé ✓'; };
    }
    render();
  };
  window.FINALE.boardState = boardState;
})();
