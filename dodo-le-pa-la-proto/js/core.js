/* Dodo lé pa là — noyau : état, chronos, journal, routeur, accueil, coque des malles, mode MJ, fiche de fabrication. */
(function () {
  const C = window.CONTENT, A = window.ART, D = window.DODO_DATA;
  const KEY = 'dodo-proto-v1';
  const $ = (s, r = document) => r.querySelector(s);
  const now = () => Date.now();
  const fmt = ms => { if (ms == null || ms < 0) ms = 0; const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------- état ----------------
  function fresh() {
    const teams = {};
    C.TEAMS.forEach(t => teams[t] = { step: 0, started: null, stepStart: null, finished: null, hints: {}, durations: {}, errors: {}, scratch: {} });
    return { v: 1, created: now(), teams, journal: [], finale: { moves: 0, hop: [], letters: [], started: null, done: null, vote: { science: 0, foret: 0 }, choix: null, signatures: '' } };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  if (!S.teams || !S.finale) S = fresh();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage plein : la partie continue en mémoire */ } };
  function log(team, step, event, detail = '') {
    S.journal.push({ t: new Date().toISOString(), ms: now(), equipe: team || '', etape: step || '', evenement: event, detail: String(detail) });
    save();
  }

  const APP = { S: () => S, save, log, fmt, esc, $ };
  window.APP = APP;

  // ---------------- coque ----------------
  const root = () => $('#app');
  function topbar(title, color, opts = {}) {
    return `<div class="topbar">
      <a class="iconbtn" href="#/" aria-label="Accueil">${A.icons.ui.home}<span class="lbl">Accueil</span></a>
      ${color ? `<span class="seal" style="background:${color}">${opts.seal || ''}</span>` : ''}
      <div class="ttl">${title}</div>
      ${opts.chrono ? `<span class="chrono" id="chrono">${opts.chrono}</span>` : ''}
      ${opts.sac ? `<button class="iconbtn" id="btn-sac" aria-label="Sacoche">${A.icons.ui.sac}<span class="lbl">Sacoche</span></button>` : ''}
    </div>`;
  }
  let tick = null;
  function setTick(fn) { if (tick) clearInterval(tick); tick = fn ? setInterval(fn, 1000) : null; }

  function modal(title, html) {
    const m = document.createElement('div');
    m.className = 'modal'; m.setAttribute('role', 'dialog');
    m.innerHTML = `<div class="paper pop"><button class="btn ghost close" data-close>Fermer</button><h2>${title}</h2>${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.hasAttribute('data-close')) m.remove(); });
    const esc = e => { if (e.key === 'Escape') { m.remove(); document.removeEventListener('keydown', esc); } };
    document.addEventListener('keydown', esc);
    window.addEventListener('hashchange', () => m.remove(), { once: true });
    document.body.appendChild(m);
    return m;
  }
  APP.modal = modal;

  // ---------------- accueil ----------------
  function home() {
    setTick(null);
    const card = t => {
      const st = S.teams[t], n = C.STEPS[t].length, done = st.step >= n;
      const label = done ? 'Coups trouvés : prêts pour la grande partie' : st.step === 0 && !st.started ? 'Malle fermée, prête à jouer' : `Étape ${st.step + 1} sur ${n}`;
      return `<button class="malle-card" data-team="${t}" data-testid="malle-${t}">
        ${A.malle(t, C.TEAM_COLOR[t], done)}
        <div class="nm">${C.PERSO[t]}</div><div class="st">Équipe ${C.TEAM_LABEL[t]} · ${label}</div>
        ${t === 'BLEU' ? '<span class="tag prop" title="Suite inventée pour le prototype">proposition</span>' : ''}
      </button>`;
    };
    const allDone = C.TEAMS.every(t => S.teams[t].step >= C.STEPS[t].length);
    root().innerHTML = `
      <div class="hero">${A.dodo()}<h1>Dodo lé pa là</h1><div class="sub">l'enquête du dernier solitaire</div></div>
      <div class="paper"><p><b>Quatre malles</b> sont arrivées au musée, mal remballées par Marcel l'archiviste. Chacune a appartenu à un chasseur de dodo. Ouvrez-la, découvrez son propriétaire, rassemblez vos 8 pions et vos coups : ensemble, vous jouerez la grande partie de solitaire qui ouvre la cinquième caisse.</p>
      <p class="small mut">Prototype de test : chaque écran simule le geste réel et indique comment il sera fabriqué.</p></div>
      <div class="malles">${C.TEAMS.map(card).join('')}</div>
      <div class="paper"><h3>La grande partie</h3><p>${allDone ? 'Les quatre équipes ont leurs coups : le plateau vous attend.' : 'Elle s\'ouvre quand les quatre équipes ont trouvé leurs coups (le maître du jeu peut l\'ouvrir à tout moment).'}</p>
        <a class="btn wide ${allDone ? 'glow' : ''}" href="#/finale" data-testid="go-finale">Approcher le plateau de solitaire</a></div>
      <div class="bandeau"><a class="btn" href="#/mj" data-testid="go-mj">Maître du jeu</a><a class="btn" href="#/fiche" data-testid="go-fiche">Fiche de fabrication</a><a class="btn" href="#/regles">Mode d'emploi</a></div>`;
    root().querySelectorAll('.malle-card').forEach(b => b.onclick = () => location.hash = '#/malle/' + b.dataset.team);
  }

  function regles() {
    setTick(null);
    root().innerHTML = topbar('Mode d\'emploi') + `<div class="paper"><h2>Comment tester</h2>
      <p>Chaque équipe prend un téléphone (ou une fenêtre) et choisit sa malle. Les étapes suivent la trame d'Alexia : <b>ouvrir la malle → découvrir le personnage → trouver 7 pions → ouvrir le coffre-fort → 8e pion + parchemin → déduire ses coups</b>.</p>
      <p>Les gestes se font au doigt ou à la souris : tourner des molettes, glisser, maintenir. Pour « appuyer à quatre en même temps », chacun pose un doigt (ou maintient une touche du clavier).</p>
      <p>Le bouton <b>Coup de pouce</b> donne deux niveaux d'indice. Le <b>maître du jeu</b> suit les chronos, débloque une étape, exporte le journal et remet tout à zéro entre deux parties.</p>
      <p>Les cadres « <b>↔ en vrai</b> » décrivent l'objet réel à fabriquer. Le badge <span class="prop">proposition</span> signale une idée inventée pour le prototype, à valider par Alexia.</p>
      <p class="small mut">Tout est enregistré sur cet appareil : la partie reprend où elle en était après un rechargement.</p></div>`;
  }

  // ---------------- malle ----------------
  function stepElapsed(st) { return st.stepStart ? now() - st.stepStart : 0; }
  function malle(team) {
    const st = S.teams[team], steps = C.STEPS[team];
    if (!st.started) { st.started = now(); st.stepStart = now(); log(team, steps[0].id, 'début de malle'); }
    if (st.step >= steps.length) return malleFinie(team);
    const step = steps[st.step];
    if (!st.stepStart) st.stepStart = now();
    save();
    const prog = steps.map((s, i) => `<span class="${i < st.step ? 'done' : i === st.step ? 'cur' : ''}" title="${esc(s.titre)}"></span>`).join('');
    root().innerHTML = topbar(C.PERSO[team], C.TEAM_COLOR[team], { chrono: fmt(now() - st.started), sac: true, seal: st.step + 1 }) +
      `<div class="progress">${prog}</div>
      <div class="paper" id="step" data-step="${step.id}" data-testid="step-${step.id}">
        <div class="kicker">${esc(step.group)} ${step.prop ? '<span class="prop">proposition</span>' : ''}</div>
        <h2>${esc(step.titre)}</h2>
        <div id="puzzle"></div>
        <div class="feedback" id="fb" aria-live="polite"></div>
        <div class="row c" id="after"></div>
        <div class="row c"><button class="btn ghost" id="btn-hint" data-testid="hint">${A.icons.ui.lamp ? '' : ''}Coup de pouce</button></div>
        <div class="envrai"><b>en vrai :</b> ${esc(step.enVrai)}</div>
      </div>`;
    $('#btn-sac').onclick = () => sacoche(team);
    $('#btn-hint').onclick = () => hint(team, step);
    setTick(() => { const c = $('#chrono'); if (c) c.textContent = fmt(now() - st.started); });
    const ctx = makeCtx(team, step);
    window.PUZZLES[step.type](ctx, $('#puzzle'));
  }
  function makeCtx(team, step) {
    const st = S.teams[team];
    const ctx = {
      team, step, C, A, APP, st,
      scratch: st.scratch[step.id] || (st.scratch[step.id] = {}),
      save,
      fb(msg, kind) { const f = $('#fb'); if (!f) return; f.className = 'feedback ' + (kind || ''); f.textContent = msg; },
      fail(msg, detail) {
        st.errors[step.id] = (st.errors[step.id] || 0) + 1;
        log(team, step.id, 'essai à reprendre', detail || msg);
        ctx.fb(msg, 'bad');
        const p = $('#puzzle'); if (p) { p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); }
        if (navigator.vibrate) try { navigator.vibrate(80); } catch (e) { }
      },
      win(msg, detail) {
        if (ctx.won) return; ctx.won = true;
        const dur = now() - (st.stepStart || now());
        st.durations[step.id] = dur;
        log(team, step.id, 'réussi', (detail || '') + ` (${fmt(dur)})`);
        ctx.fb(msg || 'Bravo !', 'good');
        const after = $('#after');
        after.innerHTML = `<button class="btn pop" data-testid="next">Continuer l'aventure</button>`;
        after.querySelector('button').onclick = () => nextStep(team);
        save();
      }
    };
    return ctx;
  }
  function nextStep(team) {
    const st = S.teams[team];
    st.step++; st.stepStart = now();
    const steps = C.STEPS[team];
    if (st.step >= steps.length) { st.finished = now(); log(team, '', 'malle terminée', fmt(st.finished - st.started)); }
    else log(team, steps[st.step].id, 'début d\'étape');
    save();
    malle(team);
    window.scrollTo(0, 0);
  }
  APP.nextStep = nextStep;
  function hint(team, step) {
    const st = S.teams[team];
    const lvl = Math.min((st.hints[step.id] || 0) + 1, 2);
    st.hints[step.id] = lvl;
    log(team, step.id, 'coup de pouce ' + lvl);
    const all = step.hints.slice(0, lvl).map((h, i) => `<p><b>Indice ${i + 1}.</b> ${esc(h)}</p>`).join('');
    modal('Coup de pouce', all + (lvl < 2 ? '<p class="small mut">Un second coup de pouce, plus précis, est disponible ensuite.</p>' : ''));
  }
  function malleFinie(team) {
    const st = S.teams[team];
    setTick(null);
    const mv = C.movesOf(team);
    root().innerHTML = topbar(C.PERSO[team], C.TEAM_COLOR[team], { sac: true, seal: '✓' }) + `
      <div class="paper center pop" data-testid="malle-finie-${team}">
        ${A.malle(team, C.TEAM_COLOR[team], true)}
        <h2>Vos coups sont prêts !</h2>
        <p>${C.MALLE[team].replace(/^./, c => c.toUpperCase())} vous a livré ses 8 pions et ses ${mv.length} coups, en ${fmt(st.finished - st.started)}.</p>
        <div class="parch" style="text-align:left">${mv.map(m => `<div class="coupline"><span class="sym-wrap">${A.sym(m.n - 1, C.rainbow(m.n))}</span><span class="txt" style="color:${C.rainbow(m.n)}">${m.path.join(' → ')}</span></div>`).join('')}</div>
        <p>Rejoignez les autres équipes autour du plateau : la couleur de chaque ligne donne son rang dans la partie.</p>
        <a class="btn" href="#/finale">Aller au plateau</a> <a class="btn ghost" href="#/">Accueil</a>
      </div>`;
    $('#btn-sac').onclick = () => sacoche(team);
  }
  function sacoche(team) {
    const st = S.teams[team];
    const ids = C.DOCS_OF[team];
    const unlocked = ids.filter((id, i) => i > 0 || st.step > C.STEPS[team].findIndex(s => s.type === 'carnet'));
    const firstCarnetIdx = C.STEPS[team].findIndex(s => s.type === 'carnet');
    const list = ids.map(id => {
      const ok = id.startsWith('carnet') ? st.step > firstCarnetIdx : st.step >= firstCarnetIdx;
      const d = C.DOCS[id];
      return ok ? `<button class="docbtn" data-doc="${id}">${d.titre}${d.prop ? ' <span class="prop">proposition</span>' : ''}<small>à consulter</small></button>` : `<div class="docbtn" style="opacity:.5">Document à découvrir<small>il apparaîtra plus tard</small></div>`;
    }).join('');
    const pions = (st.scratch[C.STEPS[team].find(s => s.type === 'fouille').id] || {}).found || [];
    const m = modal('Sacoche de l\'équipe ' + C.TEAM_LABEL[team], `<div class="doclist">${list}</div>
      <h3 style="margin-top:12px">Pions trouvés</h3><div class="pions-tray">${pions.length ? pions.map(n => A.pionHTML(n, C.TEAM_COLOR[team])).join('') : '<span class="small" style="color:#e9d4a8">Vos pions apparaîtront ici</span>'}</div>`);
    m.querySelectorAll('[data-doc]').forEach(b => b.onclick = () => { m.remove(); showDoc(b.dataset.doc); });
  }
  function showDoc(id) { const d = C.DOCS[id]; modal(d.titre, id === 'gabarit' ? window.PUZZLES.gabaritHTML() : d.html); }
  APP.showDoc = showDoc;

  // ---------------- maître du jeu ----------------
  function mj() {
    const draw = () => {
      const rows = C.TEAMS.map(t => {
        const st = S.teams[t], steps = C.STEPS[t], step = steps[st.step];
        const el = step ? stepElapsed(st) : 0;
        const est = step ? step.dur * 60000 : 0;
        return `<tr data-team="${t}"><td><span class="pion" style="background:${C.TEAM_COLOR[t]};width:18px;height:18px"></span> <b>${C.PERSO[t]}</b></td>
          <td>${step ? `${st.step + 1}/${steps.length} · ${esc(step.titre)}` : '<b>terminée</b>'}</td>
          <td>${st.started ? fmt((st.finished || now()) - st.started) : '—'}</td>
          <td class="${step && el > est ? 'over' : 'under'}">${step && st.started ? `${fmt(el)} / ${step.dur} min` : '—'}</td>
          <td>${step ? `<button class="btn" data-act="h1" data-t="${t}">Indice 1</button><button class="btn" data-act="h2" data-t="${t}">Indice 2</button><button class="btn" data-act="unlock" data-t="${t}" data-testid="unlock-${t}">Débloquer</button>` : ''}</td></tr>`;
      }).join('');
      const perStep = C.TEAMS.map(t => C.STEPS[t].map(s => {
        const d = S.teams[t].durations[s.id];
        return `<tr><td>${C.PERSO[t]}</td><td>${esc(s.titre)}${s.prop ? ' <span class="prop">prop.</span>' : ''}</td><td>${s.dur} min</td><td class="${d != null ? (d > s.dur * 60000 ? 'over' : 'under') : ''}">${d != null ? fmt(d) : '—'}</td><td>${S.teams[t].errors[s.id] || 0}</td><td>${S.teams[t].hints[s.id] || 0}</td></tr>`;
      }).join('')).join('');
      const F = S.finale;
      root().innerHTML = topbar('Maître du jeu', '#5a3a22', { seal: 'MJ' }) + `
        <div class="paper"><h2>Équipes en jeu</h2><div class="scroll-x"><table class="mj" data-testid="mj-table"><tr><th>Malle</th><th>Étape</th><th>Chrono malle</th><th>Étape : réel / prévu</th><th>Actions</th></tr>${rows}</table></div>
          <p class="small mut">Vert : dans les temps d'Alexia. Rouge-brique : au-delà de son estimation.</p>
          <p><b>Grande partie :</b> ${F.moves}/18 coups joués${F.done ? ' · 5e caisse ouverte' : ''}${F.choix ? ' · choix : ' + C.FINS[F.choix].titre : ''}.</p>
          <div id="mj-hint"></div></div>
        <div class="paper"><h2>Durées par énigme</h2><div class="scroll-x"><table class="mj"><tr><th>Malle</th><th>Énigme</th><th>Prévu (Alexia)</th><th>Réel</th><th>Essais</th><th>Indices</th></tr>${perStep}</table></div></div>
        <div class="paper"><h2>Journal horodaté</h2>
          <div class="row"><button class="btn" id="exp-json" data-testid="export-json">Exporter en JSON</button><button class="btn" id="exp-csv" data-testid="export-csv">Exporter en CSV</button>
          <button class="btn ghost" id="reset" data-testid="reset">Remettre à zéro (nouvelle partie)</button></div>
          <div class="scroll-x" style="max-height:300px;overflow:auto"><table class="mj" data-testid="journal"><tr><th>Heure</th><th>Équipe</th><th>Étape</th><th>Événement</th><th>Détail</th></tr>
          ${S.journal.slice(-120).reverse().map(j => `<tr><td>${j.t.slice(11, 19)}</td><td>${j.equipe}</td><td>${esc(j.etape)}</td><td>${esc(j.evenement)}</td><td>${esc(j.detail)}</td></tr>`).join('')}</table></div></div>`;
      root().querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
        const t = b.dataset.t, st = S.teams[t], step = C.STEPS[t][st.step];
        if (!step) return;
        if (b.dataset.act === 'unlock') {
          if (!st.started) st.started = now();
          if (!st.stepStart) st.stepStart = now();
          st.durations[step.id] = now() - st.stepStart;
          window.PUZZLES.autoSolve && window.PUZZLES.autoSolve(t, step, st);
          log(t, step.id, 'débloqué par le MJ');
          st.step++; st.stepStart = now();
          if (st.step >= C.STEPS[t].length) { st.finished = now(); log(t, '', 'malle terminée', fmt(st.finished - st.started)); }
          save(); draw();
        } else {
          const lvl = b.dataset.act === 'h1' ? 1 : 2;
          st.hints[step.id] = Math.max(st.hints[step.id] || 0, lvl);
          log(t, step.id, 'indice ' + lvl + ' donné par le MJ');
          save(); draw();
          $('#mj-hint').innerHTML = `<div class="note-prop"><b>${C.PERSO[t]} — ${esc(step.titre)}, indice ${lvl} :</b> ${esc(step.hints[lvl - 1])}<br><span class="small">Solution : ${esc(step.solution)}</span></div>`;
        }
      });
      $('#exp-json').onclick = () => download('journal-dodo.json', JSON.stringify({ exporte: new Date().toISOString(), etat: S }, null, 2), 'application/json');
      $('#exp-csv').onclick = () => {
        const head = 'heure;equipe;etape;evenement;detail\n';
        download('journal-dodo.csv', head + S.journal.map(j => [j.t, j.equipe, j.etape, j.evenement, j.detail].map(x => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv');
      };
      $('#reset').onclick = () => {
        if (!confirm('Remettre toutes les malles et le plateau à zéro ?')) return;
        S = fresh(); log('', '', 'remise à zéro'); save(); draw();
      };
    };
    draw();
    setTick(draw);
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: type + ';charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    log('', '', 'export', name);
  }

  // ---------------- fiche de fabrication ----------------
  const A_TRANCHER = {
    JAUNE: ['Cadenas : 3 ou 4 chiffres ? (le prototype en prend 4)', 'Tarot rangé en vrac ou dans une boîte casse-tête pour rallonger (vocal 17/10)', 'Lettre du cryptex : 6 anneaux du commerce, mot PIERRE à valider', 'Tableau périodique 1-36 : vrai tableau ou extrait stylisé'],
    ROUGE: ['Fiabilité des ILS sous la peinture (épaisseur, distance aimant)', 'Chant séquencé : enregistrer de vrais chants ou des onomatopées', 'Walkman : alimentation et autonomie sur une journée', 'Liste des insectes et des bagues à harmoniser avec les vrais oiseaux de La Réunion'],
    VERT: ['Baguenaudier : 4 anneaux (10 gestes) ou 5 (21 gestes) selon l\'âge', 'Regards : 14 animaux et 10 leurres, lisibilité des yeux à 1 m', 'Fente + labyrinthe : taille du crochet, solidité de la ficelle', 'Peau de bête : suédine ou toile peinte, lettres lisibles au soleil'],
    BLEU: ['Mafate : mécanisme des ponts couplés et révélation de la flèche (PROPOSITION du prototype)', 'Coffre du cartographe : calque + carte des nids + cadenas 4185 (PROPOSITION)', 'Coups du cartographe : coordonnées A-G × 1-7 + gabarit en croix (PROPOSITION)', 'Anamorphose : position de l\'œilleton et taille du dessin', 'Fil de kermesse : pile, LED, robustesse avec des enfants']
  };
  function fiche() {
    setTick(null);
    const html = C.TEAMS.map(t => {
      const pions = D.teamPions[t];
      return `<div class="paper" data-testid="fiche-${t}"><h2><span class="seal" style="background:${C.TEAM_COLOR[t]};width:26px;height:26px;font-size:12px">${t[0]}</span> ${C.PERSO[t]} — malle ${C.TEAM_LABEL[t]}</h2>
        <p><b>Pions :</b> ${pions.join(', ')} (8e pion dans le coffre-fort : n° ${C.HUITIEME[t]}${t === 'BLEU' ? ', aimanté' : ''}). <b>Coups :</b> ${C.movesOf(t).map(m => `n° ${m.n} (${m.path.join('→')})`).join(', ')}.</p>
        ${C.STEPS[t].map(s => `<h3>${esc(s.titre)} ${s.prop ? '<span class="prop">proposition</span>' : ''} <span class="small mut">· ${s.dur} min prévues</span></h3>
          <ul>${s.objets.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
          <p class="small"><b>Fabrication :</b> ${esc(s.enVrai)}</p><p class="small"><b>Code / solution :</b> ${esc(s.solution)}</p>`).join('')}
        <h3>Ce qui reste à trancher</h3><ul>${A_TRANCHER[t].map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    }).join('');
    const total = t => C.STEPS[t].reduce((a, s) => a + s.dur, 0);
    root().innerHTML = topbar('Fiche de fabrication') + `<div class="paper"><h2>Fiche de fabrication</h2>
      <p>Générée à partir du contenu du prototype : mêmes codes, mêmes coups que dans le jeu. Durées prévues par malle : ${C.TEAMS.map(t => `${C.PERSO[t]} ${total(t)} min`).join(' · ')}.</p>
      <p><b>Plateau commun :</b> solitaire anglais 33 trous numérotés 1-33 en ordre de lecture, légende des 18 coups en couleurs d'arc-en-ciel + symboles ; lettres UV sous les pions ; message « ${C.PHRASE_FMT(D.phrase.split(''))} » ; dernier pion n° ${D.last} (bleu) aimanté, posé au centre, ouvre la 5e caisse (verrou magnétique) → œuf + vote science/forêt.</p>
      <p><b>Vérification automatique des coups :</b> ${C.verifierCoups().map(v => `${C.PERSO[v.team]} ${v.ok ? '✓' : '✗'} (${v.coups.join(', ')})`).join(' · ')}</p></div>${html}`;
  }

  // ---------------- routeur ----------------
  function route() {
    document.querySelectorAll('.modal').forEach(m => m.remove());
    const h = location.hash.replace(/^#\/?/, '');
    const [page, arg] = h.split('/');
    if (page === 'malle' && C.TEAMS.includes(arg)) malle(arg);
    else if (page === 'finale') { setTick(null); window.FINALE(root(), APP); }
    else if (page === 'mj') mj();
    else if (page === 'fiche') fiche();
    else if (page === 'regles') regles();
    else home();
  }
  APP.route = route;
  APP.topbar = topbar;
  APP.setTick = setTick;
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', route);
})();
