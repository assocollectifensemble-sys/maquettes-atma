/* Démo appli de commande + pilotage restaurant. Tout le contenu vient de config.json et data/demo.json. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const JK = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const JL = { lun: 'lundi', mar: 'mardi', mer: 'mercredi', jeu: 'jeudi', ven: 'vendredi', sam: 'samedi', dim: 'dimanche' };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const ST = ['recue', 'preparation', 'prete', 'retiree'];
const STL = { recue: 'Reçues', preparation: 'En préparation', prete: 'Prêtes', retiree: 'Retirées' };
const SRC = { appli: 'Appli', messenger: 'Messenger', telephone: 'Téléphone' };
let C, D, S, P = {}, DAY, DAYK, ISO, SEM, MENU = [];

/* ---------- utilitaires ---------- */
const pad = n => String(n).padStart(2, '0');
const hm = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
const fmt = m => pad(Math.floor(m / 60) % 24) + ':' + pad(Math.floor(m % 60));
const hFr = s => s.replace(':00', ' h').replace(':', ' h ');
const euro = n => n.toFixed(2).replace('.', ',') + '\u00a0€';
const eur0 = n => Math.round(n).toLocaleString('fr-FR') + '\u00a0€';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, "'");
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const wpick = (r, a, w) => { let s = w.reduce((x, y) => x + y, 0), v = r() * s; for (let i = 0; i < a.length; i++) { v -= w[i]; if (v <= 0) return a[i]; } return a[a.length - 1]; };
const plat = id => C.plats.find(p => p.id === id);
const dateLong = d => `${JL[JK[d.getDay()]]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const initials = n => n.split(' ').map(x => x[0]).join('').slice(0, 2);
const photo = (p, cls = 'ph') => p.photo ? `<img class="${cls}" src="${p.photo}" alt="${esc(p.nom)}" loading="lazy">` : `<div class="tile${cls === 'ph sm' ? ' sm' : ''}" aria-hidden="true">${esc(p.nom[0])}</div>`;

/* ---------- jour de démo, rotation, horloge ---------- */
function demoDay() { const d = new Date(); d.setHours(12, 0, 0, 0); for (let i = 0; i < 8; i++) { if (C.horaires[JK[d.getDay()]]) return d; d.setDate(d.getDate() + 1); } return d; }
function semaine(d) {
  const ref = new Date(C.rotation.lundiReferenceS1 + 'T12:00:00'); const l = new Date(d); l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  const w = Math.round((l - ref) / 864e5 / 7); return 'S' + (((w % 3) + 3) % 3 + 1);
}
function menuDu(d) {
  const j = JK[d.getDay()], R = C.rotation; if (!R.special[j]) return [];
  return [...new Set([R.special[j], ...R.base, ...((R.semaines[semaine(d)] || {})[j] || [])])];
}
const services = () => C.horaires[DAYK].length > 1 ? ['midi', 'soir'] : ['midi'];
const now = () => hm(C.demo.heureDepart) + (Date.now() - S.t0) / 60000;
const ouvert = s => services().includes(s) && now() < hm(C.heuresLimites[s]);
const dispo = id => MENU.includes(id) && !S.epuises.includes(id);
const pris = h => S.orders.filter(o => o.creneau === h).length;
function prochainService(id) { // prochain jour où le plat est au menu
  const d = new Date(DAY); for (let i = 1; i < 22; i++) { d.setDate(d.getDate() + 1); if (menuDu(d).includes(id)) return i === 1 ? 'demain' : JL[JK[d.getDay()]]; } return 'bientôt';
}

/* ---------- état partagé (client + resto) ---------- */
const KEY = () => 'demo-resto-' + C.id;
function fresh() {
  return { v: 2, iso: ISO, t0: Date.now(), orders: [], seq: 0, epuises: [], flux: 0, next: Date.now() + 6000, cap: C.creneaux.capaciteParCreneau,
    imprimante: true, sms: true, notif: true, tampons: C.demo.clientDemo.tampons, mine: [], transmis: [], chat: [], panier: {},
    nom: C.demo.clientDemo.nom, tel: C.demo.clientDemo.tel, rem: [], remTxt: '', creneau: null, paie: 'en_ligne', format: '80', sync: 0 };
}
function load() { try { const s = JSON.parse(localStorage.getItem(KEY())); if (s && s.v === 2 && s.iso === ISO) return s; } catch (e) { /* état neuf */ } return null; }
function save() { try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch (e) { /* stockage plein : la démo continue en mémoire */ } }

/* ---------- génération des commandes de la journée ---------- */
function clientNom(r) { return pick(r, D.prenoms) + ' ' + pick(r, D.initiales.split('')) + '.'; }
function texteLibre(r, items, h, svc, rem) {
  const parts = items.map(([id, q]) => `${q} ${plat(id).court}`);
  const list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1] : parts[0];
  const hello = pick(r, ['Bonjour ! ', 'Sawadee 🙏 ', 'Salut, ', 'Bonjour, ', '', 'Coucou ! ']);
  const quand = r() < .5 ? (svc === 'midi' ? 'pour midi' : 'pour ce soir') : 'pour ' + h.replace(':', 'h');
  const verbe = pick(r, ['je voudrais ', 'je prends ', '', 'svp ', 'je réserve ']);
  return `${hello}${verbe}${list} ${quand}${rem ? ', ' + rem.toLowerCase() : ''}${pick(r, ['', ' merci', ' 🙏', ' svp'])}`.replace(/\s+/g, ' ').trim();
}
function genOrder(r, cree, force) {
  const svcs = services().filter(s => cree < hm(C.heuresLimites[s]));
  if (!svcs.length) return null;
  let svc = force || (svcs.length > 1 && r() > .72 ? svcs[1] : svcs[0]);
  if (!svcs.includes(svc)) svc = svcs[0];
  const w = svc === 'midi' ? [1, 3, 5, 6, 5, 3, 2, 1] : [1, 3, 5, 5, 3, 2, 1];
  const sl = C.creneaux[svc].map((h, i) => ({ h, w: pris(h) < S.cap ? (w[i] || 1) : 0 })).filter(x => x.w);
  if (!sl.length) return null;
  const h = wpick(r, sl.map(x => x.h), sl.map(x => x.w));
  const plats = MENU.filter(id => plat(id).cat === 'plat' && !S.epuises.includes(id));
  if (!plats.length) return null;
  const items = {}; const n = wpick(r, [1, 2, 3], [80, 15, 5]);
  for (let i = 0; i < n; i++) {
    const x = r(); let id = x < .3 ? MENU[0] : x < .6 ? 'padthai-poulet' : x < .72 ? 'padthai-legumes' : pick(r, plats);
    if (!plats.includes(id)) id = pick(r, plats);
    items[id] = (items[id] || 0) + 1;
  }
  if (r() < .35 && dispo('nems')) items.nems = pick(r, [2, 3, 3, 4]);
  const des = MENU.filter(id => plat(id).cat === 'dessert' && dispo(id));
  if (des.length && r() < .12) items[pick(r, des)] = 1;
  const it = Object.entries(items);
  const source = wpick(r, ['appli', 'messenger', 'telephone'], [50, 42, 8]);
  const rem = r() < .4 ? pick(r, D.remarques) : '';
  const nom = clientNom(r);
  const message = source === 'messenger' ? texteLibre(r, it, h, svc, rem) : source === 'telephone' ? 'Pris au téléphone par Yannick' + (rem ? ' · ' + rem : '') : rem;
  return mk({ nom, tel: '0692 ·· ·· ' + pad(Math.floor(r() * 100)), source, items: it, message, paiement: source === 'appli' && r() < .62 ? 'en_ligne' : 'sur_place', creneau: h, service: svc, cree });
}
function mk(o) {
  S.seq++;
  return Object.assign({ id: S.seq, num: pad(S.seq).padStart(3, '0'), statut: 'recue', imprime: S.imprimante, relais: !S.imprimante && S.sms, ts: Date.now() }, o);
}
function total(o) { return o.items.reduce((s, [id, q]) => s + plat(id).prix * q, 0); }
function seed() {
  const r = rng(hash(ISO + C.id)); let t = hm('07:35');
  for (let i = 0; i < 11; i++) {
    t += 4 + r() * 12; const o = genOrder(r, Math.min(t, now() - 2), i < 9 ? 'midi' : null);
    if (o) { o.ts = Date.now() - 600000; S.orders.push(o); }
  }
  S.orders.filter(o => o.creneau === C.creneaux.midi[0]).forEach(o => { o.statut = 'preparation'; });
}

/* ---------- boucle temps réel ---------- */
let dragging = false;
function tick() {
  let change = false;
  if (Date.now() >= S.next && S.orders.length < 38) {
    const r = rng(hash(ISO + 'f' + S.flux)); S.flux++;
    S.next = Date.now() + (C.demo.intervalleNouvelleCommandeSec * 1000) * (0.8 + r() * 0.4);
    const o = genOrder(r, now());
    if (o) { o.fresh = true; S.orders.push(o); change = true; annonce(o); }
  }
  for (const o of S.orders) {
    if (!o.mine) continue;
    const age = (Date.now() - o.ts) / 1000;
    if (o.statut === 'recue' && age > 25) { o.statut = 'preparation'; change = true; }
    else if (o.statut === 'preparation' && age > 55 && !o.manuel) { o.statut = 'prete'; change = true; if (route().side === 'client') toast('🎉 <b>Votre commande est prête !</b> À tout de suite au comptoir.'); if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) { /* vibreur indisponible */ } }
  }
  document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = fmt(now()); });
  const cd = $('[data-countdown]'); if (cd) cd.innerHTML = limiteTexte();
  if (change) { save(); if (!dragging) refresh(); }
}
function annonce(o) {
  if (route().side !== 'resto') return;
  const relais = o.relais ? ' · relais SMS vers Yannick' : '';
  toast(`🔔 <b>Commande ${o.num}</b> · ${SRC[o.source]} · ${esc(o.nom)} · ${o.creneau}${relais}`);
}
function toast(html, ms = 3600) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; $('#toasts').append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, ms);
}

/* ---------- routage ---------- */
function route() { const h = (location.hash || '#/client').slice(2).split('?'); const [side, page] = h[0].split('/'); return { side: side === 'resto' ? 'resto' : 'client', page: page || '', q: new URLSearchParams(h[1] || '') }; }
const app = () => $('#app');
function render() {
  const r = route();
  const bar = `<div class="demo-bar"><span class="demo-tag"><i></i>Démo · données d'exemple</span><nav class="switch" aria-label="Choisir la vue"><a href="#/client" class="${r.side === 'client' ? 'on' : ''}">Côté client</a><a href="#/resto" class="${r.side === 'resto' ? 'on' : ''}">Côté resto</a></nav></div>`;
  app().innerHTML = bar + (r.side === 'client' ? client(r) : resto(r));
  after(r);
}
function refresh() {
  const r = route();
  if (r.side === 'resto') {
    const v = $('#rview'); if (!v) return render();
    if (['', 'tickets'].includes(r.page) || (r.page === 'reglages')) { v.innerHTML = restoPage(r); badge(); after(r); }
    else badge();
  } else if (['suivi', 'fidelite'].includes(r.page)) { const v = $('#cview'); if (v) { v.innerHTML = clientPage(r); after(r); } }
  else if (r.page === 'panier') { const sl = $('#slots'); if (sl) sl.innerHTML = slotsHTML(); }
}
function badge() { const n = S.orders.filter(o => o.statut === 'recue').length; document.querySelectorAll('[data-badge]').forEach(b => { b.textContent = n; b.style.display = n ? '' : 'none'; }); }

/* =====================================================================
   CÔTÉ CLIENT
   ===================================================================== */
function client(r) {
  const nb = Object.values(S.panier).reduce((a, b) => a + b, 0);
  const t = Object.entries(S.panier).reduce((s, [id, q]) => s + plat(id).prix * q, 0);
  const tab = (p, ic, l, extra = '') => `<a href="#/client${p ? '/' + p : ''}" class="${r.page === p ? 'on' : ''}"><span>${ic}</span>${l}${extra}</a>`;
  const mine = S.orders.filter(o => o.mine && o.statut !== 'retiree');
  const cta = (r.page === '' && nb) ? `<a class="cta" href="#/client/panier" data-act="go-panier"><span><span class="n">${nb}</span>Mon panier</span><span>${euro(t)}</span></a>` : '';
  const head = r.page === 'messenger' ? '' : `<header class="cl-head"><img class="lg" src="${C.logo}" alt="${esc(C.nom)}"><div><b>${esc(C.nom)}</b><small>${esc(C.sousTitre)} · ${esc(C.ville)}</small></div><span class="clock" data-clock>${fmt(now())}</span></header>`;
  return `<div class="cl-wrap"><aside class="cl-aside" hidden></aside><div class="cl" id="clscroll">${head}<div id="cview">${clientPage(r)}</div>${cta}
  <nav class="tabbar" aria-label="Navigation client">${tab('', '🍜', 'Menu')}${tab('messenger', '💬', 'Messenger')}${tab('suivi', '🛍️', 'Commande', mine.length ? `<b class="bdg">${mine.length}</b>` : '')}${tab('fidelite', '⭐', 'Fidélité')}</nav></div></div>`;
}
function clientPage(r) {
  switch (r.page) {
    case 'panier': return panier();
    case 'suivi': return suivi();
    case 'fidelite': return fidelite();
    case 'messenger': return messenger();
    default: return accueil();
  }
}
function limiteTexte() {
  const n = now();
  for (const s of services()) {
    const l = hm(C.heuresLimites[s]);
    if (n < l) { const m = Math.max(1, Math.round(l - n)); const reste = m >= 60 ? `${Math.floor(m / 60)} h ${pad(m % 60)}` : `${m} min`; return `⏱️ Commandes du ${s} jusqu'à ${hFr(C.heuresLimites[s])} · encore ${reste}`; }
  }
  return `🌙 Commandes ouvertes pour ${JL[JK[(DAY.getDay() + 1) % 7]] || 'le prochain service'}`;
}
function accueil() {
  const cd = C.demo.clientDemo, sp = plat(MENU[0]);
  const hab = cd.habitude.filter(([id]) => dispo(id));
  const habTxt = cd.habitude.map(([id, q]) => `${q} ${plat(id).court}`).join(' + ');
  const prenom = cd.nom.split(' ')[0];
  const cats = Object.keys(C.categories);
  const reste = C.fidelite.objectif - (S.tampons % C.fidelite.objectif);
  let h = `<section class="sec"><div class="hello"><div><h1>${esc(C.accroche)}</h1><p>${cap(dateLong(DAY))} · menu ${SEM}</p></div></div><div class="chip-limit" data-countdown>${limiteTexte()}</div></section>`;
  if (hab.length) h += `<section class="sec"><div class="card habit"><div class="ic">↻</div><div><small>Comme d'habitude, ${esc(prenom)} ?</small><b>${esc(habTxt)}</b></div><button class="btn btn-a btn-s" data-act="habitude">Recommander</button></div></section>`;
  h += `<section class="sec"><article class="special">${sp.photo ? `<img src="${sp.photo}" alt="${esc(sp.nom)}">` : '<div style="height:200px"></div>'}<div class="tx"><span class="tag">Plat spécial du ${JL[DAYK]}</span><h3>${esc(sp.nom)}</h3><p>${esc(sp.desc)}</p><div class="row"><span class="px">${euro(sp.prix)}</span>${dispo(sp.id) ? stepper(sp.id) : '<span class="succes">Victime de son succès 🎉</span>'}</div></div></article></section>`;
  h += `<section class="sec"><h2>Le menu du jour</h2>`;
  for (const c of cats) {
    const ids = MENU.slice(1).filter(id => plat(id).cat === c); if (!ids.length) continue;
    h += `<div class="cat-t">${esc(C.categories[c])}</div>` + ids.map(id => dishRow(plat(id))).join('');
  }
  h += `</section><section class="sec"><div class="card fid-mini"><div style="font-size:26px">⭐</div><div style="flex:1"><b>${S.tampons % C.fidelite.objectif} / ${C.fidelite.objectif} plats</b><div class="muted" style="font-size:13px">Encore ${reste} et ${esc(C.fidelite.recompense)}</div></div><a class="btn btn-l btn-s" href="#/client/fidelite">Ma carte</a></div></section>`;
  h += C.atouts.map((a, i) => `<section class="sec"><div class="card ${i === 0 ? 'eco' : ''}" style="${i ? 'display:flex;gap:12px;align-items:center' : ''}"><div class="ic" style="font-size:28px">${a.icone}</div><div><b>${esc(a.titre)}</b><p style="margin:2px 0 0;font-size:13px">${esc(a.texte)}</p></div></div></section>`).join('');
  const hor = Object.entries(C.horaires).map(([j, p]) => `${cap(JL[j]).slice(0, 3)}. ${p.map(x => x.join('–')).join(' · ')}`).join('<br>');
  h += `<section class="sec"><div class="infos"><div class="card"><b>Horaires</b>${hor}</div><div class="card"><b>Retrait</b>${esc(C.adresse)}<br><span class="muted">Commandes jusqu'à ${hFr(C.heuresLimites.midi)} (midi) et ${hFr(C.heuresLimites.soir)} (soir)</span></div></div></section>`;
  h += `<section class="sec" style="padding-bottom:10px"><button class="btn btn-l btn-w" data-act="install">📲 Installer ${esc(C.nom)} sur l'écran d'accueil</button></section>`;
  return h;
}
function stepper(id) {
  const q = S.panier[id] || 0;
  return `<div class="step">${q ? `<button class="m" data-act="moins" data-id="${id}" aria-label="Retirer">−</button><span>${q}</span>` : ''}<button data-act="plus" data-id="${id}" aria-label="Ajouter ${esc(plat(id).nom)}">+</button></div>`;
}
function dishRow(p) {
  const ok = dispo(p.id);
  return `<div class="dish ${ok ? '' : 'off'}" id="d-${p.id}">${photo(p)}<div class="in"><b>${esc(p.nom)}</b><em>${esc(p.desc)}</em>${ok ? `<span class="px">${euro(p.prix)}</span>` : '<span class="succes">Victime de son succès 🎉</span>'}</div>${ok ? stepper(p.id) : ''}</div>`;
}
function slotsHTML() {
  let h = '';
  for (const s of services()) {
    const open = ouvert(s);
    h += `<div class="svc">${s === 'midi' ? 'Midi' : 'Soir'}${open ? '' : ' · commandes closes à ' + hFr(C.heuresLimites[s])}</div><div class="slots" style="margin-bottom:10px">`;
    h += C.creneaux[s].map(x => { const l = S.cap - pris(x); const dis = !open || l <= 0; return `<button class="slot ${S.creneau === x ? 'on' : ''} ${l === 1 ? 'low' : ''}" data-act="slot" data-h="${x}" ${dis ? 'disabled' : ''}>${x}<small>${!open ? '·' : l <= 0 ? 'Complet' : l === 1 ? '1 place' : l + ' places'}</small></button>`; }).join('');
    h += '</div>';
  }
  return h;
}
function panier() {
  const it = Object.entries(S.panier).filter(([, q]) => q > 0);
  if (!it.length) return `<a class="back" href="#/client">← Menu</a><section class="sec ctr"><div style="font-size:54px;margin-top:30px">🍜</div><h2>Votre panier vous attend</h2><p class="muted">Choisissez vos plats dans le menu du jour.</p><a class="btn btn-p" href="#/client">Voir le menu</a></section>`;
  const t = it.reduce((s, [id, q]) => s + plat(id).prix * q, 0);
  let h = `<a class="back" href="#/client">← Menu</a><section class="sec"><h2>Mon panier</h2><div class="card">`;
  h += it.map(([id, q]) => `<div class="line"><span>${esc(plat(id).nom)}</span>${stepper(id)}<b style="min-width:62px;text-align:right">${euro(plat(id).prix * q)}</b></div>`).join('');
  h += `<div class="line t"><span>Total</span><span>${euro(t)}</span></div></div></section>`;
  h += `<section class="sec"><h2>Heure de retrait</h2><div class="card" id="slots">${slotsHTML()}</div></section>`;
  h += `<section class="sec"><h2>Vos coordonnées</h2><div class="card"><label class="fld"><span>Prénom et initiale</span><input id="f-nom" value="${esc(S.nom)}" autocomplete="name"></label><label class="fld" style="margin:0"><span>Téléphone</span><input id="f-tel" value="${esc(S.tel)}" inputmode="tel" autocomplete="tel"></label></div></section>`;
  h += `<section class="sec"><h2>Un mot pour Néo</h2><div class="card"><div class="chips" style="margin-bottom:10px">${C.remarquesRapides.map(x => `<button class="chip ${S.rem.includes(x) ? 'on' : ''}" data-act="rem" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div><label class="fld" style="margin:0"><textarea id="f-rem" rows="2" placeholder="Votre message, il s'imprime tel quel sur le ticket">${esc(S.remTxt)}</textarea></label></div></section>`;
  h += `<section class="sec"><h2>Règlement</h2><div class="pay"><button class="${S.paie === 'en_ligne' ? 'on' : ''}" data-act="paie" data-v="en_ligne"><span>💳</span>En ligne</button><button class="${S.paie === 'sur_place' ? 'on' : ''}" data-act="paie" data-v="sur_place"><span>🏪</span>Sur place</button></div>`;
  h += S.paie === 'en_ligne' ? `<div class="cardpay"><div class="cb"></div><div><b>Carte •••• 4242</b><br><span class="muted">Paiement de démonstration, simulé</span></div></div>` : `<div class="cardpay"><div style="font-size:22px">🤝</div><div>Vous réglez au comptoir, au moment du retrait.</div></div>`;
  h += `<p class="hint" id="hint"></p><button class="btn btn-ok btn-w" style="padding:15px;font-size:16px;margin-top:4px" data-act="valider">${S.paie === 'en_ligne' ? 'Payer et valider' : 'Valider la commande'} · ${euro(t)}</button></section>`;
  return h;
}
function remarqueFinale() { return [...S.rem, S.remTxt.trim()].filter(Boolean).join(', '); }
function valider() {
  const it = Object.entries(S.panier).filter(([, q]) => q > 0);
  const hint = $('#hint');
  if (!S.creneau || pris(S.creneau) >= S.cap) { hint.textContent = '👉 Choisissez votre heure de retrait.'; $('#slots').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  if (!S.nom.trim()) { hint.textContent = '👉 Indiquez votre prénom pour le ticket.'; return; }
  const go = () => {
    const svc = C.creneaux.midi.includes(S.creneau) ? 'midi' : 'soir';
    const o = mk({ nom: S.nom.trim(), tel: S.tel, source: 'appli', items: it, message: remarqueFinale(), paiement: S.paie, creneau: S.creneau, service: svc, cree: now(), mine: true, fresh: true });
    S.orders.push(o); S.mine.push(o.id); S.tampons += it.filter(([id]) => plat(id).cat === 'plat').reduce((s, [, q]) => s + q, 0);
    S.panier = {}; S.rem = []; S.remTxt = ''; S.creneau = null; save();
    location.hash = '#/client/suivi';
  };
  if (S.paie === 'en_ligne') {
    const ov = document.createElement('div'); ov.className = 'overlay'; ov.innerHTML = `<div class="box"><div class="spin"></div><b>Paiement sécurisé…</b><p class="muted" style="font-size:13px;margin:6px 0 0">Démonstration : paiement simulé</p></div>`;
    document.body.append(ov); setTimeout(() => { ov.remove(); go(); }, 1300);
  } else go();
}
function suivi() {
  const mine = S.orders.filter(o => o.mine).sort((a, b) => b.id - a.id);
  if (!mine.length) return `<section class="sec ctr"><div style="font-size:54px;margin-top:40px">🛍️</div><h2>Votre prochaine commande</h2><p class="muted">Elle s'affichera ici, avec son suivi en direct.</p><a class="btn btn-p" href="#/client">Commander</a></section>`;
  const o = mine[0], i = ST.indexOf(o.statut), rdy = i >= 2;
  const prenom = o.nom.split(' ')[0];
  let h = `<section class="sec ctr"><div class="okc ${rdy ? 'rdy' : ''}">${rdy ? '🍜' : '✓'}</div><h1 class="big">${rdy ? `C'est prêt, ${esc(prenom)} !` : `C'est noté, ${esc(prenom)} !`}</h1><p class="muted" style="margin:6px 0 0">Commande n° ${o.num} · retrait à <b style="color:var(--e)">${o.creneau}</b></p></section>`;
  h += `<section class="sec"><div class="card"><div class="track"><div class="bar" style="width:${Math.min(i, 2) * 38}%"></div>${['Reçue', 'En préparation', 'Prête'].map((l, k) => `<div class="tk ${k <= i ? 'on' : ''} ${k === Math.min(i, 2) && i < 2 ? 'now' : ''}"><i>${['📩', '🔥', '🍜'][k]}</i>${l}</div>`).join('')}</div>
  <p class="ctr muted" style="font-size:13px;margin:12px 0 0">${['Votre ticket est en cuisine, Néo l\'a sous les yeux.', 'Néo prépare votre commande.', 'Votre commande vous attend au comptoir.', 'Bon appétit !'][i]}</p></div></section>`;
  h += `<section class="sec"><div class="card">${o.items.map(([id, q]) => `<div class="line"><span>${q} × ${esc(plat(id).nom)}</span><span>${euro(plat(id).prix * q)}</span></div>`).join('')}
  ${o.message ? `<div class="line"><span class="muted">Votre mot : « ${esc(o.message)} »</span></div>` : ''}
  <div class="line t"><span>${o.paiement === 'en_ligne' ? 'Réglé en ligne ✓' : 'À régler au retrait'}</span><span>${euro(total(o))}</span></div></div></section>`;
  h += `<section class="sec"><div class="card fid-mini"><div style="font-size:26px">⭐</div><div style="flex:1"><b>+${o.items.filter(([id]) => plat(id).cat === 'plat').reduce((s, [, q]) => s + q, 0)} sur votre carte</b><div class="dots" style="margin-top:5px">${dots(S.tampons % C.fidelite.objectif)}</div></div></div></section>`;
  h += `<section class="sec" style="display:grid;gap:9px"><button class="btn btn-a btn-w" data-act="install">📲 Ajouter ${esc(C.nom)} à l'écran d'accueil</button><a class="btn btn-l btn-w" href="#/resto/tickets?o=${o.id}">Voir le ticket côté cuisine →</a></section>`;
  return h;
}
const dots = n => Array.from({ length: C.fidelite.objectif }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('');
function fidelite() {
  const n = S.tampons % C.fidelite.objectif, off = Math.floor(S.tampons / C.fidelite.objectif);
  const g = Array.from({ length: C.fidelite.objectif }, (_, k) => k === C.fidelite.objectif - 1 ? `<i class="gift ${k < n ? 'on' : ''}">🎁</i>` : `<i class="${k < n ? 'on' : ''}">${k < n ? '★' : ''}</i>`).join('');
  return `<section class="sec"><div class="fid"><small style="color:#e4c977;letter-spacing:.1em;text-transform:uppercase;font-size:11.5px">Carte fidélité</small><h3>${esc(S.nom || C.demo.clientDemo.nom)}</h3><div class="grid">${g}</div><div style="font-size:14px">${n} / ${C.fidelite.objectif} · ${esc(C.fidelite.recompense)} 🎉</div></div></section>
  <section class="sec"><div class="card"><div class="line"><span>Plats offerts gagnés</span><b>${off}</b></div><div class="line"><span>Plats sur la carte</span><b>${n}</b></div><div class="line"><span>Prochain cadeau</span><b>dans ${C.fidelite.objectif - n} plat${C.fidelite.objectif - n > 1 ? 's' : ''}</b></div></div></section>
  <section class="sec"><p class="muted ctr" style="font-size:13px">Chaque plat commandé dans l'appli ou sur Messenger s'ajoute tout seul à votre carte.</p></section>`;
}

/* ---------- Messenger simulé ---------- */
function messenger() {
  const sugg = ['2 pad thaï poulet pour midi, plus de sauce', 'Vous êtes ouverts ce soir ?', 'Je voudrais le bol de la mer', 'Un massaman et 3 nems pour 19h, citron à part', 'Il y a un plat végétarien ?'];
  const pend = S.pending;
  const qr = pend ? ['Oui, c\'est parfait', 'Modifier'] : sugg;
  return `<div class="ms"><div class="ms-head"><a href="#/client" aria-label="Retour" style="text-decoration:none;font-size:20px;color:var(--msg)">‹</a><img src="${C.logo}" alt=""><div><b>${esc(C.nom)}</b><small>● Répond en quelques secondes</small></div><div class="note">Simulation Messenger : l'assistant comprend le texte libre</div></div>
  <div class="ms-body" id="msb"><div class="ms-day">Aujourd'hui · ${esc(C.demo.clientMessenger)}</div>${S.chat.map(bubble).join('')}</div>
  <div class="qr" id="qr">${qr.map(x => `<button data-act="say" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
  <form class="ms-in" id="msf"><input id="msi" placeholder="Écrivez votre message…" autocomplete="off" aria-label="Message"><button aria-label="Envoyer">➤</button></form></div>`;
}
function bubble(m) { return `<div class="bub ${m[0]}">${m[0] === 'c' ? esc(m[1]) : m[1]}</div>`; }
function menuCarte() {
  return `<div class="mn"><b>Menu du ${JL[DAYK]}</b><br>${MENU.filter(id => plat(id).cat === 'plat').map(id => `${dispo(id) ? '•' : '◦'} ${esc(plat(id).nom)} · ${euro(plat(id).prix)}${dispo(id) ? '' : ' (victime de son succès)'}`).join('<br>')}<br><a href="#/client">Ouvrir le menu complet →</a></div>`;
}
function parse(txt) {
  let t = ' ' + norm(txt).replace(/[!?.,;]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const nums = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6 };
  const found = [];
  const keys = [];
  C.plats.forEach(p => p.mots.forEach(m => keys.push([norm(m), p.id])));
  keys.sort((a, b) => b[0].length - a[0].length);
  for (const [k, id] of keys) {
    const re = new RegExp(`(?:\\b(\\d+|un|une|deux|trois|quatre|cinq|six)\\s+(?:x\\s+)?)?(?:(?:le|la|les|des|du|d')\\s*)?${k.replace(/ /g, '\\s*')}s?\\b`);
    const m = t.match(re);
    if (m) { const q = m[1] ? (nums[m[1]] || parseInt(m[1], 10)) : 1; const ex = found.find(f => f[0] === id); if (ex) ex[1] += q; else found.push([id, q]); t = t.replace(m[0], ' '); }
  }
  let heure = null; const hm2 = norm(txt).match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/);
  if (hm2) heure = pad(+hm2[1]) + ':' + (hm2[2] || '00');
  const n = norm(txt); let svc = /soir/.test(n) ? 'soir' : /midi|dejeuner/.test(n) ? 'midi' : null;
  if (heure && !svc) svc = hm(heure) >= hm('17:00') ? 'soir' : 'midi';
  const rems = []; [['plus de sauce', 'plus de sauce'], ['sauce a part', 'sauce à part'], ['citron', 'citron à part'], ['moins de riz', 'moins de riz'], ['epice', 'bien épicé'], ['piment', 'piment à part'], ['couvert', 'couverts en plus']].forEach(([k, l]) => { if (n.includes(k)) rems.push(l); });
  return { items: found, heure, svc, rems, n };
}
function choisirCreneau(svc, heure) {
  let s = svc && ouvert(svc) ? svc : services().find(ouvert);
  if (!s) return null;
  const list = C.creneaux[s].filter(h => pris(h) < S.cap);
  if (!list.length) return null;
  if (heure && s === (hm(heure) >= hm('17:00') ? 'soir' : 'midi')) return list.reduce((b, h) => Math.abs(hm(h) - hm(heure)) < Math.abs(hm(b) - hm(heure)) ? h : b, list[0]);
  const pref = s === 'midi' ? '12:30' : '19:00';
  return list.includes(pref) ? pref : list[0];
}
function repondre(txt) {
  const p = parse(txt), prenom = C.demo.clientMessenger.split(' ')[0];
  if (S.pending) {
    if (/^\s*(oui|ok|parfait|valide|c'est bon|yes|go|👍|top|d'accord|daccord)/i.test(norm(txt)) || txt.includes('👍')) {
      const pd = S.pending; S.pending = null;
      const o = mk({ nom: C.demo.clientMessenger, tel: 'via Messenger', source: 'messenger', items: pd.items, message: pd.message, paiement: 'sur_place', creneau: pd.creneau, service: C.creneaux.midi.includes(pd.creneau) ? 'midi' : 'soir', cree: now(), fresh: true });
      S.orders.push(o);
      return [['b', `C'est noté ${esc(prenom)} ! Commande n° ${o.num}, prête à ${o.creneau}. ${esc(C.remerciement)} 🙏`], ['sys', `🖨️ Ticket ${o.num} imprimé en cuisine, avec votre message exact · <a href="#/resto/tickets?o=${o.id}">voir côté resto</a>`]];
    }
    if (/modif|change|attend/.test(norm(txt)) && !p.items.length) { S.pending = null; return [['b', 'Avec plaisir ! Réécrivez votre commande comme vous le souhaitez 😉']]; }
    if (!p.items.length) S.pending = null;
  }
  if (p.items.length) {
    const hors = p.items.filter(([id]) => !MENU.includes(id));
    const ep = p.items.filter(([id]) => MENU.includes(id) && S.epuises.includes(id));
    if (hors.length) {
      const id = hors[0][0]; const j = Object.entries(C.rotation.special).find(([, v]) => v === id);
      return [['b', `${esc(plat(id).nom)}, c'est ${j ? 'le plat spécial du ' + JL[j[0]] : 'au menu ' + prochainService(id)} 😉 Aujourd'hui, ${esc(C.cheffe)} vous propose :${menuCarte()}`]];
    }
    if (ep.length) { const alt = MENU.filter(id => plat(id).cat === 'plat' && dispo(id)).slice(0, 2).map(id => plat(id).nom).join(' ou le '); return [['b', `${esc(plat(ep[0][0]).nom)} a été victime de son succès aujourd'hui 🎉 Je vous propose le ${esc(alt)} ?`]]; }
    const cr = choisirCreneau(p.svc, p.heure);
    if (!cr) return [['b', `Les créneaux du jour sont tous réservés 🎉 ${esc(C.cheffe)} vous attend au prochain service : écrivez-nous dès la veille au soir !`]];
    const tt = p.items.reduce((s, [id, q]) => s + plat(id).prix * q, 0);
    const decal = p.svc && !ouvert(p.svc) ? `Les commandes du ${p.svc} se prennent jusqu'à ${hFr(C.heuresLimites[p.svc])} : je vous propose ce créneau.\n` : '';
    S.pending = { items: p.items, creneau: cr, message: txt };
    return [['b', `Sawadee ${esc(prenom)} ! ${decal}Je note :\n${p.items.map(([id, q]) => `• ${q} × ${esc(plat(id).nom)}`).join('\n')}\n🕒 Retrait ${cr}${p.rems.length ? '\n✍️ ' + p.rems.join(', ') : ''}\nTotal ${euro(tt)}, à régler sur place. Je valide ?`]];
  }
  const f = C.faq.find(x => x.q.some(k => p.n.includes(k)));
  if (/soir/.test(p.n) && /ouvert/.test(p.n)) return [['b', services().includes('soir') ? `Oui, ce soir ${esc(C.nom)} vous accueille de ${C.horaires[DAYK][1].join(' à ')}. Commandes jusqu'à ${hFr(C.heuresLimites.soir)} 😉` : f.r]];
  if (f) return [['b', esc(f.r)]];
  if (/menu|carte|aujourd/.test(p.n)) return [['b', `Voici le menu du jour 😉${menuCarte()}`]];
  if (/^\s*(bonjour|salut|hello|coucou|sawadee|bonsoir)\b/.test(p.n)) return [['b', `Sawadee ${esc(prenom)} 🙏 Que puis-je vous préparer ?${menuCarte()}`]];
  S.transmis.unshift({ nom: C.demo.clientMessenger, sujet: txt, etat: 'À traiter', heure: fmt(now()) });
  return [['b', `Bonne question ! Je transmets votre message à ${esc(C.gerant)}, qui vous répond très vite 😉`], ['sys', `📨 Cas transmis à ${esc(C.gerant)} · <a href="#/resto/assistant">voir côté resto</a>`]];
}
function say(txt) {
  if (!txt.trim()) return;
  S.chat.push(['c', txt]); save();
  const b = $('#msb'); b.insertAdjacentHTML('beforeend', bubble(['c', txt]) + '<div class="typing" id="typ"><i></i><i></i><i></i></div>'); b.scrollTop = b.scrollHeight;
  $('#qr').innerHTML = '';
  setTimeout(() => {
    const rep = repondre(txt); rep.forEach(m => S.chat.push(m)); save();
    const t = $('#typ'); if (t) t.remove();
    const bb = $('#msb'); if (!bb) return;
    bb.insertAdjacentHTML('beforeend', rep.map(bubble).join('')); bb.scrollTop = bb.scrollHeight;
    const qr = S.pending ? ['Oui, c\'est parfait', 'Modifier'] : ['Merci !', 'Quel est le menu du jour ?', 'Où êtes-vous ?'];
    $('#qr').innerHTML = qr.map(x => `<button data-act="say" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  }, 750);
}

/* =====================================================================
   CÔTÉ RESTO
   ===================================================================== */
const RP = [['', '📋', 'Commandes'], ['tickets', '🖨️', 'Tickets'], ['menu', '🍜', 'Menu'], ['stats', '📈', 'Statistiques'], ['clients', '👥', 'Clients'], ['assistant', '🤖', 'Assistant'], ['reglages', '⚙️', 'Réglages']];
function resto(r) {
  const n = S.orders.filter(o => o.statut === 'recue').length;
  const side = `<aside class="side"><div class="brand"><img src="${C.logo}" alt=""><div><b>${esc(C.nom)}</b><small>Tableau de bord</small></div></div>${RP.map(([p, ic, l]) => `<a href="#/resto${p ? '/' + p : ''}" class="${r.page === p ? 'on' : ''}">${ic} ${l}${p === '' ? `<b class="bdg" data-badge style="${n ? '' : 'display:none'}">${n}</b>` : ''}</a>`).join('')}<div class="foot">Pour ${esc(C.cheffe)} et ${esc(C.gerant)}<br>Atma Digital · démo</div></aside>`;
  const top = `<div class="rs-top"><div class="r1"><img class="lg" src="${C.logo}" alt=""><div class="nm"><b>${esc(C.nom)}</b><small>Côté resto</small></div><span class="prt ${S.imprimante ? '' : 'off'}"><i></i>${S.imprimante ? 'Imprimante connectée' : 'Relais SMS actif'}</span><span class="clock">${cap(dateLong(DAY))} · <b data-clock>${fmt(now())}</b></span></div>
  <nav class="rtabs" aria-label="Sections">${RP.map(([p, ic, l]) => `<a href="#/resto${p ? '/' + p : ''}" class="${r.page === p ? 'on' : ''}">${ic} ${l}</a>`).join('')}</nav></div>`;
  return `<div class="rs">${side}<main class="rs-main">${top}<div id="rview">${restoPage(r)}</div></main></div>`;
}
function restoPage(r) {
  switch (r.page) {
    case 'tickets': return tickets(r);
    case 'menu': return menuGestion();
    case 'stats': return stats();
    case 'clients': return clients();
    case 'assistant': return assistant();
    case 'reglages': return reglages();
    default: return commandes();
  }
}
function itemsTxt(o) { return o.items.map(([id, q]) => `${q} ${plat(id).court}`).join(' · '); }
function commandes() {
  const f = P.filtre || 'tous';
  const list = S.orders.filter(o => f === 'tous' || o.service === f);
  const plats = list.filter(o => o.statut !== 'retiree').reduce((s, o) => s + o.items.filter(([id]) => plat(id).cat === 'plat').reduce((a, [, q]) => a + q, 0), 0);
  const du = S.orders.filter(o => o.paiement === 'sur_place').reduce((s, o) => s + total(o), 0);
  const ligne = S.orders.filter(o => o.paiement === 'en_ligne');
  let h = `<div class="wrap"><div class="ttl"><div><h2>Commandes du jour</h2><p>Glissez une carte d'une colonne à l'autre, ou touchez le bouton.</p></div><div class="seg">${['tous', ...services()].map(x => `<button class="${f === x ? 'on' : ''}" data-act="filtre" data-v="${x}">${x === 'tous' ? 'Tout' : cap(x)}</button>`).join('')}</div></div>
  <div class="kpis"><div class="kpi"><small>Commandes</small><b>${S.orders.length}</b><em>${S.orders.filter(o => o.source === 'appli').length} appli · ${S.orders.filter(o => o.source === 'messenger').length} Messenger</em></div><div class="kpi"><small>Plats à préparer</small><b>${plats}</b><em>tickets imprimés</em></div><div class="kpi"><small>Réglé en ligne</small><b>${euro(ligne.reduce((s, o) => s + total(o), 0))}</b><em>${ligne.length} commandes</em></div><div class="kpi"><small>À encaisser</small><b>${euro(du)}</b><em>au comptoir</em></div></div>
  <div class="board">`;
  for (const st of ST) {
    const cs = list.filter(o => o.statut === st).sort((a, b) => a.creneau.localeCompare(b.creneau) || a.id - b.id);
    const shown = st === 'retiree' ? cs.slice(-6) : cs;
    h += `<section class="col" data-col="${st}"><h3>${STL[st]} <span>${cs.length}</span></h3>${shown.map(card).join('') || `<div class="empty">${st === 'recue' ? 'Les nouvelles commandes arrivent ici' : 'Déposez une carte ici'}</div>`}</section>`;
  }
  return h + '</div></div>';
}
function card(o) {
  const nx = { recue: ['preparation', 'Lancer'], preparation: ['prete', 'Prête'], prete: ['retiree', 'Retirée'] }[o.statut];
  const c = `<article class="oc ${o.fresh ? 'new' : ''}" data-drag="${o.id}" data-open="${o.id}"><div class="h"><span class="num">#${o.num}</span><span class="nm">${esc(o.nom)}</span><span class="slt">${o.creneau}</span></div>
  <div class="its">${esc(itemsTxt(o))}</div>${o.message ? `<div class="msg">« ${esc(o.message)} »</div>` : ''}
  <div class="ft"><span class="src ${o.source}">${SRC[o.source]}</span>${o.paiement === 'en_ligne' ? '<span class="payt ok">RÉGLÉ EN LIGNE</span>' : `<span class="payt du">À ENCAISSER ${euro(total(o))}</span>`}${o.relais ? '<span class="src telephone">SMS</span>' : ''}${nx ? `<button class="adv" data-act="adv" data-id="${o.id}" data-to="${nx[0]}">${nx[1]} →</button>` : ''}</div><span class="handle" aria-hidden="true">⋮⋮</span></article>`;
  o.fresh = false;
  return c;
}
function setStatut(id, st) { const o = S.orders.find(x => x.id === id); if (!o || o.statut === st) return; o.statut = st; o.manuel = true; save(); refresh(); toast(`Commande <b>${o.num}</b> · ${STL[st].toLowerCase().replace(/s$/, '')}`, 1800); }

/* ---------- tickets ---------- */
function ticketHTML(o, w) {
  const tt = total(o);
  return `<div class="ticket w${w}"><div class="c hd">${esc(C.nom.toUpperCase())}</div><div class="c">${esc(C.sousTitre)}</div><hr>
  <div class="c xl">N° ${o.num}</div><div class="c"><b>COMMANDE ${o.service.toUpperCase()} · ${fmt(o.cree)}</b></div><div class="c">RETRAIT <b style="font-size:17px">${o.creneau}</b></div><hr>
  <div><b>${esc(o.nom)}</b></div><div>${esc(o.tel)}</div><div>Source : ${SRC[o.source]}</div>
  ${o.paiement === 'en_ligne' ? '<div class="paid">RÉGLÉ EN LIGNE</div>' : `<div class="due">À ENCAISSER<span>${euro(tt)}</span></div>`}
  ${o.items.map(([id, q]) => `<div class="r"><span><span class="q">${q} x</span> ${esc(plat(id).nom)}</span></div>`).join('')}<hr>
  ${o.message ? `<div>${o.source === 'messenger' ? 'Message exact du client :' : 'Mot du client :'}</div><div class="note">${esc(o.message)}</div><hr>` : ''}
  <div class="c">${esc(C.remerciement)}</div></div>`;
}
function synthese(svc, w) {
  const os = S.orders.filter(o => o.service === svc);
  const cnt = {}; os.forEach(o => o.items.forEach(([id, q]) => { cnt[id] = (cnt[id] || 0) + q; }));
  const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const cr = {}; os.forEach(o => { cr[o.creneau] = (cr[o.creneau] || 0) + 1; });
  const du = os.filter(o => o.paiement === 'sur_place');
  return `<div class="ticket w${w}"><div class="c hd">${esc(C.nom.toUpperCase())}</div><div class="c xl">SYNTHÈSE ${hFr(C.heuresLimites[svc]).toUpperCase()}</div><div class="c"><b>SERVICE DU ${svc.toUpperCase()}</b></div><div class="c">${cap(dateLong(DAY))}</div><hr>
  ${rows.map(([id, q]) => `<div class="r"><span><span class="q">${q}</span> ${esc(plat(id).court)}</span></div>`).join('') || '<div>La file se remplit…</div>'}<hr>
  <div class="r"><span>Commandes</span><b>${os.length}</b></div><div class="r"><span>Réglé en ligne</span><b>${os.length - du.length}</b></div>
  <div class="due">À ENCAISSER<span>${euro(du.reduce((s, o) => s + total(o), 0))}</span></div>
  <div><b>Par créneau</b></div>${Object.entries(cr).sort().map(([h, n]) => `<div class="r"><span>${h}</span><span>${'■'.repeat(n)} ${n}</span></div>`).join('')}<hr><div class="c">Bon service ${esc(C.cheffe)} !</div></div>`;
}
function tickets(r) {
  const w = S.format; const sel = r.q.get('o') || P.ticket || (S.orders.length ? String(S.orders[S.orders.length - 1].id) : 'midi');
  const os = [...S.orders].sort((a, b) => b.id - a.id);
  const btn = (k, lab, sub) => `<button class="${sel === k ? 'on' : ''}" data-act="ticket" data-v="${k}"><b>${lab}</b><span class="muted" style="font-size:12px">${sub}</span></button>`;
  const o = S.orders.find(x => String(x.id) === sel);
  const tk = o ? ticketHTML(o, w) : synthese(sel === 'soir' ? 'soir' : 'midi', w);
  return `<div class="wrap"><div class="ttl"><div><h2>Tickets cuisine</h2><p>Un ticket par commande, imprimé à l'arrivée. Synthèse à ${hFr(C.heuresLimites.midi)} et ${hFr(C.heuresLimites.soir)}.</p></div><div class="seg"><button class="${w === '58' ? 'on' : ''}" data-act="fmt" data-v="58">58 mm</button><button class="${w === '80' ? 'on' : ''}" data-act="fmt" data-v="80">80 mm</button></div></div>
  <div class="grid2 t"><div class="panel"><h3>Synthèses</h3><div class="tlist" style="margin-bottom:14px">${services().map(s => btn(s, `Synthèse ${hFr(C.heuresLimites[s])}`, `service du ${s}`)).join('')}</div><h3>Commandes</h3><div class="tlist">${os.map(x => btn(String(x.id), `#${x.num} ${esc(x.nom)}`, `${x.creneau} · ${x.paiement === 'en_ligne' ? 'réglé' : 'à encaisser'}`)).join('')}</div></div>
  <div class="panel"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;flex-wrap:wrap"><h3 style="margin:0">Aperçu ${w} mm</h3><button class="btn btn-p btn-s" data-act="print">🖨️ Imprimer</button></div><div class="paper" id="tkprev">${tk}</div>
  <p class="note-e">Deux libellés bien distincts : <b>RÉGLÉ EN LIGNE</b> encadré, tout est payé · <b>À ENCAISSER</b> en bandeau noir, avec le montant.</p></div></div></div>`;
}

/* ---------- menu ---------- */
function canalTexte(c) {
  const lignes = MENU.map(id => { const p = plat(id); const t = `${p.nom} · ${euro(p.prix)}`; return S.epuises.includes(id) ? `<s>${esc(t)}</s> victime de son succès 🎉` : esc(t); });
  const sp = lignes[0], rest = lignes.slice(1).map(l => '• ' + l).join('\n');
  const lim = `Commandes jusqu'à ${hFr(C.heuresLimites.midi)} pour le midi${services().includes('soir') ? ' et ' + hFr(C.heuresLimites.soir) + ' pour le soir' : ''}.`;
  if (c === 'Facebook') return `${esc(C.accroche)} 🙏\nMenu du ${dateLong(DAY)}\n⭐ Plat spécial : ${sp}\n${rest}\n${lim}\nDans l'appli ou sur Messenger. ${esc(C.remerciement)}`;
  if (c === 'Instagram') return `⭐ ${sp}\n${rest}\n#cuisinethai #reunion #${C.ville.toLowerCase().replace(/[^a-z]/g, '')}`;
  if (c === 'Google') return `Menu du jour · ${dateLong(DAY)}\n⭐ ${sp}\n${rest}\n[Commander]`;
  if (c === 'Assistant') return `Base de l'assistant à jour :\n« Aujourd'hui : ${MENU.filter(dispo).map(id => plat(id).nom).join(', ')}. »${S.epuises.length ? `\n« ${S.epuises.map(id => plat(id).nom).join(', ')} : victime de son succès, je propose une autre idée. »` : ''}`;
  return `Menu du ${dateLong(DAY)}\n⭐ ${sp}\n${rest}\n${lim}`;
}
function menuGestion() {
  const ch = P.canal || 'Facebook';
  const sync = S.sync ? `✓ Mis à jour partout à ${fmt(S.sync)}` : '✓ Synchronisé avec votre tableau';
  const d1 = new Date(DAY); d1.setDate(d1.getDate() + 1); while (!C.horaires[JK[d1.getDay()]]) d1.setDate(d1.getDate() + 1);
  const sp1 = plat(menuDu(d1)[0]);
  const prevHead = { Facebook: ['Facebook', `Publié hier à ${hFr(C.publication.menuVeille)}`], Instagram: ['Instagram', `Publié hier à ${hFr(C.publication.menuVeille)}`], Google: ['Fiche Google', 'Actualité du jour'], Assistant: ['Assistant Messenger', 'Connaissances du jour'], Site: ['Site', 'Page « Menu du jour »'] }[ch];
  const sp = plat(MENU[0]);
  let h = `<div class="wrap"><div class="ttl"><div><h2>Menu</h2><p>Une ligne changée ici, et le site, Facebook, Instagram, Google et l'assistant suivent.</p></div><span class="src appli">Semaine ${SEM} de la rotation</span></div>
  <div class="grid2"><div class="panel"><h3>Aujourd'hui · ${cap(JL[DAYK])}</h3>${MENU.map(id => { const p = plat(id); const ok = !S.epuises.includes(id); return `<div class="mrow">${photo(p, 'ph sm')}<div><b>${esc(p.nom)}${id === MENU[0] ? ' ⭐' : ''}</b><small>${euro(p.prix)} · ${ok ? 'disponible' : 'épuisé, affiché « victime de son succès »'}</small></div><button class="sw ${ok ? '' : 'off'}" role="switch" aria-checked="${ok}" aria-label="${esc(p.nom)} disponible" data-act="epuise" data-id="${id}"></button></div>`; }).join('')}</div>
  <div class="panel"><h3>Ce que voient vos clients</h3><div class="chans">${C.publication.canaux.map(c => `<button class="${c === ch ? 'on' : ''} ${S.sync && Date.now() - S.syncTs < 1500 ? 'fl' : ''}" data-act="canal" data-v="${c}"><i></i>${c}</button>`).join('')}</div>
  <div class="prev ${S.sync && Date.now() - S.syncTs < 1500 ? 'fl' : ''}"><div class="pt"><img src="${C.logo}" alt=""><div><b>${esc(C.nom)} · ${prevHead[0]}</b><small>${prevHead[1]}</small></div></div>${ch === 'Instagram' && sp.photo ? `<img class="igimg" src="${sp.photo}" alt="">` : ''}<div class="txt">${canalTexte(ch)}</div></div><div class="sync">${sync}</div></div>
  <div class="panel" style="grid-column:1/-1"><h3>Rotation sur 3 semaines</h3><div class="seg" style="margin-bottom:10px">${['S1', 'S2', 'S3'].map(s => `<button class="${(P.sem || SEM) === s ? 'on' : ''}" data-act="sem" data-v="${s}">${s}${s === SEM ? ' · en cours' : ''}</button>`).join('')}</div>${rotTable(P.sem || SEM)}<p class="note-e">Base de chaque jour : ${C.rotation.base.map(id => plat(id).nom).join(', ')}.</p></div><div class="panel" style="grid-column:1/-1"><h3>Publications programmées</h3><div class="sched"><div><time>05:00</time><span>Plat spécial du jour : <b>${esc(sp.nom)}</b> · Facebook, Instagram</span></div><div><time>${C.publication.menuVeille} ce soir</time><span>Menu de ${dateLong(d1)} · Facebook, Instagram, site, Google</span></div><div><time>05:00 ${JL[JK[d1.getDay()]].slice(0, 3)}.</time><span>Plat spécial : <b>${esc(sp1.nom)}</b></span></div></div><p class="note-e">Publication en direct à l'heure dite, depuis votre tableau Google Sheets : la rotation ${['S1', 'S2', 'S3'].join(' → ')} repart toute seule.</p></div>
  </div></div>`;
  return h;
}
function rotTable(s) {
  const jours = Object.keys(C.horaires);
  return `<div class="scroll-x"><table class="rot"><tr>${jours.map(j => `<th>${JL[j].slice(0, 3)}.</th>`).join('')}</tr><tr>${jours.map(j => `<td class="${s === SEM && j === DAYK ? 'today' : ''}"><div class="sp">${esc(plat(C.rotation.special[j]).nom)}</div>${(C.rotation.semaines[s][j] || []).map(id => `<div>${esc(plat(id).court)}</div>`).join('')}</td>`).join('')}</tr></table></div>`;
}

/* ---------- statistiques ---------- */
function bars(vals, labels, opt = {}) {
  const W = 640, H = opt.h || 200, pl = 34, pb = 26, max = Math.max(...vals.map(v => Array.isArray(v) ? v.reduce((a, b) => a + b, 0) : v)) * 1.1 || 1;
  const bw = (W - pl) / vals.length; const cols = opt.colors || ['var(--a)'];
  let g = '';
  for (let k = 0; k <= 3; k++) { const y = H - pb - (H - pb - 8) * k / 3; g += `<line x1="${pl}" x2="${W}" y1="${y}" y2="${y}" stroke="#eee8dc"/><text x="${pl - 6}" y="${y + 4}" font-size="11" text-anchor="end" fill="#8a8f99">${opt.fy ? opt.fy(max / 1.1 * k / 3 * 1.1) : Math.round(max * k / 3)}</text>`; }
  vals.forEach((v, i) => {
    const arr = Array.isArray(v) ? v : [v]; let y0 = H - pb;
    arr.forEach((x, j) => { const hh = (H - pb - 8) * x / max; y0 -= hh; g += `<rect x="${pl + i * bw + bw * .16}" y="${y0}" width="${bw * .68}" height="${hh}" rx="3" fill="${cols[j % cols.length]}"><title>${labels[i]} : ${x}</title></rect>`; });
    if (!opt.every || i % opt.every === 0) g += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#8a8f99">${labels[i]}</text>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg></div>`;
}
function stats() {
  const T = D.totaux, sem = {};
  D.jours.forEach(j => { const d = new Date(j.date + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const k = d.toISOString().slice(0, 10); sem[k] = sem[k] || { ca: 0, n: 0 }; sem[k].ca += j.ca; sem[k].n += j.commandes; });
  const sk = Object.keys(sem).sort();
  const lab = k => { const d = new Date(k + 'T12:00:00'); return d.getDate() + '/' + (d.getMonth() + 1); };
  const tops = D.plats.filter(p => plat(p.id) && plat(p.id).cat === 'plat').slice(0, 7); const mx = tops[0].qte;
  const sps = D.sourcesParSemaine;
  const part = s => Math.round(100 * T.sources[s] / T.commandes);
  const last = sps[sps.length - 1], lastT = (last.appli || 0) + (last.messenger || 0) + (last.telephone || 0);
  const nbj = D.jours.length;
  const p1 = new Date(D.periode.debut + 'T12:00:00'), p2 = new Date(D.periode.fin + 'T12:00:00');
  return `<div class="wrap"><div class="ttl"><div><h2>Statistiques</h2><p>Du ${p1.getDate()} ${MOIS[p1.getMonth()]} au ${p2.getDate()} ${MOIS[p2.getMonth()]} · ${nbj} jours de service · données d'exemple</p></div></div>
  <div class="kpis"><div class="kpi"><small>Chiffre d'affaires</small><b>${eur0(T.ca)}</b><em>${eur0(T.ca / nbj)} par jour</em></div><div class="kpi"><small>Commandes</small><b>${T.commandes.toLocaleString('fr-FR')}</b><em>${Math.round(T.commandes / nbj)} par jour en moyenne</em></div><div class="kpi"><small>Panier moyen</small><b>${euro(T.panierMoyen)}</b><em>${T.clients} clients différents</em></div><div class="kpi"><small>Temps gagné [E]</small><b>${D.tempsGagne.heures} h</b><em>≈ ${Math.round(D.tempsGagne.heures / (nbj / 5))} h par semaine</em></div></div>
  <div class="grid2"><div class="panel"><h3>Chiffre d'affaires par semaine</h3>${bars(sk.map(k => Math.round(sem[k].ca)), sk.map(lab), { every: 2, fy: v => String(Math.round(v / 100) / 10).replace('.', ',') + ' k' })}</div>
  <div class="panel"><h3>Plats stars</h3>${tops.map(p => `<div class="hbar"><span>${esc(p.nom)}</span><div><i style="width:${100 * p.qte / mx}%"></i></div><b>${p.qte}</b></div>`).join('')}<p class="note-e">Les nems, vendus à l'unité : ${D.plats.find(p => p.id === 'nems') ? D.plats.find(p => p.id === 'nems').qte.toLocaleString('fr-FR') : '—'} pièces.</p></div>
  <div class="panel"><h3>Heures de pointe (retraits)</h3>${bars(D.creneaux.map(c => c.n), D.creneaux.map(c => c.h), { every: 1, h: 190 })}</div>
  <div class="panel"><h3>D'où viennent les commandes</h3>${bars(sps.map(s => [s.appli || 0, s.messenger || 0, s.telephone || 0]), sps.map(s => lab(s.semaine)), { every: 2, colors: ['var(--a)', '#5b8def', '#b9b9b9'] })}<div class="legend"><span><i style="background:var(--a)"></i>Appli ${part('appli')} %</span><span><i style="background:#5b8def"></i>Messenger ${part('messenger')} %</span><span><i style="background:#b9b9b9"></i>Téléphone ${part('telephone')} %</span></div><p class="note-e">Dernière semaine : ${Math.round(100 * (last.appli || 0) / lastT)} % des commandes passent par l'appli.</p></div>
  <div class="panel"><h3>Clients fidèles</h3><div class="kpis" style="grid-template-columns:1fr 1fr;margin:0 0 8px"><div class="kpi"><small>Habitués (6 commandes et +)</small><b>${T.fideles}</b></div><div class="kpi"><small>Part de leurs commandes</small><b>${Math.round(T.partFideles * 100)} %</b></div></div>${D.clients.slice(0, 5).map(c => `<div class="hbar"><span>${esc(c.nom)}</span><div><i style="width:${100 * c.commandes / D.clients[0].commandes}%"></i></div><b>${c.commandes}</b></div>`).join('')}</div>
  <div class="panel"><h3>Temps gagné, estimation</h3><div class="hbar"><span>Commandes recopiées</span><div><i style="width:100%"></i></div><b>${Math.round(D.tempsGagne.minutesCommandes / 60)} h</b></div><div class="hbar"><span>Menus publiés</span><div><i style="width:${100 * D.tempsGagne.minutesMenus / D.tempsGagne.minutesCommandes}%"></i></div><b>${Math.round(D.tempsGagne.minutesMenus / 60)} h</b></div><p class="note-e">${esc(D.tempsGagne.hypothese)}.</p></div></div></div>`;
}

/* ---------- clients ---------- */
function clients() {
  const q = norm(P.cq || '');
  const l = D.clients.filter(c => !q || norm(c.nom).includes(q) || norm(c.favori).includes(q));
  const dd = s => { const d = new Date(s + 'T12:00:00'); return `${d.getDate()} ${MOIS[d.getMonth()].slice(0, 4)}.`; };
  return `<div class="wrap"><div class="ttl"><div><h2>Clients</h2><p>Les habitués, leur rythme et leur plat préféré. Prénoms fictifs.</p></div></div><input class="search" id="cq" placeholder="Rechercher un client ou un plat" value="${esc(P.cq || '')}">
  <div class="cgrid">${l.map(c => `<div class="cc"><div class="av">${esc(initials(c.nom))}</div><div class="in"><b>${esc(c.nom)}</b> <span class="src ${c.canal}">${SRC[c.canal]}</span><div class="meta">${c.commandes} commandes · ${String(c.parSemaine).replace('.', ',')} par semaine · panier ${euro(c.panierMoyen)}</div><div class="fav">❤️ ${esc(c.favori)}${c.remarque ? ` · <span class="muted">« ${esc(c.remarque)} »</span>` : ''}</div><div class="meta" style="display:flex;align-items:center;gap:8px;margin-top:6px"><span class="dots">${dots(c.tampons)}</span><span>${c.offerts} offert${c.offerts > 1 ? 's' : ''} · vu le ${dd(c.derniere)}</span></div></div></div>`).join('')}</div></div>`;
}

/* ---------- assistant ---------- */
function assistant() {
  const A = D.assistant, mx = A.faq[0].n;
  const tr = [...S.transmis, ...A.transmis];
  return `<div class="wrap"><div class="ttl"><div><h2>Assistant IA</h2><p>Il répond sur Messenger, confirme les commandes et passe la main à ${esc(C.gerant)} pour les cas particuliers.</p></div></div>
  <div class="kpis"><div class="kpi"><small>Conversations (3 mois)</small><b>${A.stats.conversations.toLocaleString('fr-FR')}</b></div><div class="kpi"><small>Commandes confirmées</small><b>${A.stats.commandesConfirmees.toLocaleString('fr-FR')}</b></div><div class="kpi"><small>Transmis à ${esc(C.gerant)}</small><b>${A.stats.transmis + S.transmis.length}</b></div><div class="kpi"><small>Réponse moyenne</small><b>${A.stats.reponseMoyenneSec} s</b></div></div>
  <div class="grid2"><div class="panel"><h3>Conversations récentes</h3>${A.conversations.map((c, i) => `<details class="conv" ${i === 0 ? 'open' : ''}><summary><span class="av" style="width:30px;height:30px;font-size:12px">${esc(initials(c.nom))}</span><b>${esc(c.nom)}</b><span class="iss ${c.issue}">${{ commande: 'Commande', info: 'Info', transmis: 'Transmis' }[c.issue]}</span><span class="muted" style="font-size:12px">${c.heure}</span></summary><div class="fil">${c.fil.map(([w, t]) => `<div class="bub ${w}">${esc(t)}</div>`).join('')}</div></details>`).join('')}</div>
  <div><div class="panel" style="margin-bottom:12px"><h3>Questions fréquentes</h3>${A.faq.map(f => `<div class="hbar"><span>${esc(f.q)}</span><div><i style="width:${100 * f.n / mx}%"></i></div><b>${f.n}</b></div>`).join('')}</div>
  <div class="panel"><h3>Cas transmis à ${esc(C.gerant)}</h3>${tr.map(t => `<div class="set"><div>${esc(t.sujet)}<small>${esc(t.nom)}${t.heure ? ' · ' + t.heure : ''}</small></div><span class="iss ${t.etat === 'À traiter' ? 'transmis' : 'commande'}">${esc(t.etat)}</span></div>`).join('')}</div></div></div></div>`;
}

/* ---------- réglages ---------- */
function reglages() {
  return `<div class="wrap"><div class="ttl"><div><h2>Réglages</h2><p>Tout se règle ici, en un geste.</p></div></div><div class="grid2">
  <div class="panel"><h3>Horaires</h3>${Object.entries(C.horaires).map(([j, p]) => `<div class="set"><span>${cap(JL[j])}</span><span class="hrs">${p.map(x => `<span>${x.join(' – ')}</span>`).join('')}</span></div>`).join('')}<div class="set"><span>Dimanche et lundi</span><span class="muted">repos</span></div>
  <div class="set"><div>Heures limites de commande<small>midi et soir</small></div><span class="hrs"><span>${C.heuresLimites.midi}</span><span>${C.heuresLimites.soir}</span></span></div></div>
  <div class="panel"><h3>Créneaux de retrait</h3><div class="set"><div>Commandes par créneau de ${C.creneaux.pasMinutes} min<small>l'appli ferme le créneau une fois plein</small></div><div class="stp"><button data-act="cap" data-v="-1" aria-label="Moins">−</button><b>${S.cap}</b><button data-act="cap" data-v="1" aria-label="Plus">+</button></div></div><div class="set"><div>Créneaux midi</div><span class="hrs"><span>${C.creneaux.midi[0]} → ${C.creneaux.midi[C.creneaux.midi.length - 1]}</span></span></div>${C.creneaux.soir.length ? `<div class="set"><div>Créneaux soir</div><span class="hrs"><span>${C.creneaux.soir[0]} → ${C.creneaux.soir[C.creneaux.soir.length - 1]}</span></span></div>` : ''}</div>
  <div class="panel"><h3>Imprimante</h3><div class="set"><div>Imprimante tickets, Wi-Fi<small>${S.imprimante ? 'Connectée · papier 80 mm' : 'En pause · les commandes partent en relais SMS'}</small></div><button class="sw ${S.imprimante ? '' : 'off'}" role="switch" aria-checked="${S.imprimante}" aria-label="Imprimante connectée" data-act="imprimante"></button></div><div class="set"><div>Ticket de test</div><button class="btn btn-l btn-s" data-act="test">Imprimer</button></div><div class="set"><div>Synthèses automatiques</div><span class="hrs"><span>${C.heuresLimites.midi}</span><span>${C.heuresLimites.soir}</span></span></div></div>
  <div class="panel"><h3>Alertes de secours</h3><div class="set"><div>Relais SMS au téléphone de ${esc(C.gerant)}<small>quand l'imprimante ou le réseau fait une pause</small></div><button class="sw ${S.sms ? '' : 'off'}" role="switch" aria-checked="${S.sms}" aria-label="Relais SMS" data-act="sms"></button></div><div class="set"><div>Notification à chaque commande<small>sur le téléphone de votre choix</small></div><button class="sw ${S.notif ? '' : 'off'}" role="switch" aria-checked="${S.notif}" aria-label="Notification" data-act="notif"></button></div><div class="set"><div>Démo<small>repartir de ${C.demo.heureDepart} avec la file du matin</small></div><button class="btn btn-l btn-s" data-act="reset">Rejouer la démo</button></div></div>
  </div></div>`;
}

/* =====================================================================
   ÉVÉNEMENTS
   ===================================================================== */
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
function install() {
  if (installEvt) { installEvt.prompt(); installEvt = null; return; }
  const sh = document.createElement('div'); sh.className = 'overlay'; sh.innerHTML = `<div class="sheet" role="dialog"><h2>📲 ${esc(C.nom)} sur votre écran d'accueil</h2><ol><li>iPhone : touchez <b>Partager</b> ⬆️ puis <b>Sur l'écran d'accueil</b></li><li>Android : menu <b>⋮</b> puis <b>Installer l'application</b></li></ol><p class="muted" style="font-size:13px">L'appli s'ouvre ensuite comme une vraie application, même hors connexion.</p><button class="btn btn-p btn-w" data-act="close">C'est parti</button></div>`;
  document.body.append(sh); sh.addEventListener('click', e => { if (e.target === sh || e.target.closest('[data-act=close]')) sh.remove(); });
}
function printTicket() {
  const zone = $('#print-area'); zone.innerHTML = $('#tkprev').innerHTML;
  let st = $('#pagesize'); if (!st) { st = document.createElement('style'); st.id = 'pagesize'; document.head.append(st); }
  st.textContent = `@page{size:${S.format}mm auto;margin:2mm}`;
  window.print();
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) {
    const oc = e.target.closest('[data-open]');
    if (oc && !moved) location.hash = '#/resto/tickets?o=' + oc.dataset.open;
    return;
  }
  const act = a.dataset.act, id = a.dataset.id, v = a.dataset.v;
  const rr = route();
  switch (act) {
    case 'plus': S.panier[id] = (S.panier[id] || 0) + 1; save(); rerenderClient(); break;
    case 'moins': S.panier[id] = Math.max(0, (S.panier[id] || 0) - 1); if (!S.panier[id]) delete S.panier[id]; save(); rerenderClient(); break;
    case 'habitude': S.panier = {}; C.demo.clientDemo.habitude.forEach(([pid, q]) => { if (dispo(pid)) S.panier[pid] = q; }); S.rem = C.demo.clientDemo.remarque ? [C.demo.clientDemo.remarque] : []; save(); location.hash = '#/client/panier'; toast('↻ Votre commande habituelle est dans le panier', 2200); break;
    case 'slot': S.creneau = a.dataset.h; save(); $('#slots').innerHTML = slotsHTML(); $('#hint').textContent = ''; break;
    case 'rem': S.rem = S.rem.includes(v) ? S.rem.filter(x => x !== v) : [...S.rem, v]; save(); a.classList.toggle('on'); break;
    case 'paie': S.paie = v; save(); rerenderClient(); break;
    case 'valider': valider(); break;
    case 'install': install(); break;
    case 'say': say(v); break;
    case 'filtre': P.filtre = v; refresh(); break;
    case 'adv': e.stopPropagation(); setStatut(+id, a.dataset.to); break;
    case 'ticket': P.ticket = v; if (rr.q.get('o')) history.replaceState(null, '', '#/resto/tickets'); $('#rview').innerHTML = tickets(route()); break;
    case 'fmt': S.format = v; save(); $('#rview').innerHTML = tickets(route()); break;
    case 'print': printTicket(); break;
    case 'epuise': {
      S.epuises = S.epuises.includes(id) ? S.epuises.filter(x => x !== id) : [...S.epuises, id]; S.sync = now(); S.syncTs = Date.now(); save();
      $('#rview').innerHTML = menuGestion();
      toast(S.epuises.includes(id) ? `🎉 <b>${esc(plat(id).nom)}</b> victime de son succès · site, Facebook, Instagram, Google et assistant à jour` : `✓ <b>${esc(plat(id).nom)}</b> de retour partout`, 3000);
      break;
    }
    case 'canal': P.canal = v; $('#rview').innerHTML = menuGestion(); break;
    case 'sem': P.sem = v; $('#rview').innerHTML = menuGestion(); break;
    case 'cap': S.cap = Math.max(1, Math.min(12, S.cap + (+v))); save(); $('#rview').innerHTML = reglages(); break;
    case 'imprimante': S.imprimante = !S.imprimante; save(); render(); toast(S.imprimante ? '🖨️ Imprimante connectée' : '📱 Relais SMS actif : chaque commande part sur le téléphone de ' + esc(C.gerant)); break;
    case 'sms': S.sms = !S.sms; save(); $('#rview').innerHTML = reglages(); break;
    case 'notif': S.notif = !S.notif; save(); $('#rview').innerHTML = reglages(); break;
    case 'test': toast('🖨️ Ticket de test imprimé'); break;
    case 'reset': S = fresh(); seed(); save(); render(); toast('Démo relancée à ' + C.demo.heureDepart); break;
    case 'go-panier': break;
    default: break;
  }
});
function rerenderClient() {
  const r = route(); const sc = window.scrollY, cl = $('#clscroll'), cs = cl ? cl.scrollTop : 0;
  render(); window.scrollTo(0, sc); const c2 = $('#clscroll'); if (c2) c2.scrollTop = cs;
  void r;
}
document.addEventListener('input', e => {
  if (e.target.id === 'f-nom') { S.nom = e.target.value; save(); }
  if (e.target.id === 'f-tel') { S.tel = e.target.value; save(); }
  if (e.target.id === 'f-rem') { S.remTxt = e.target.value; save(); }
  if (e.target.id === 'cq') { P.cq = e.target.value; const pos = e.target.selectionStart; $('#rview').innerHTML = clients(); const i = $('#cq'); i.focus(); i.setSelectionRange(pos, pos); }
});
document.addEventListener('submit', e => { if (e.target.id === 'msf') { e.preventDefault(); const i = $('#msi'); say(i.value); i.value = ''; } });

/* glisser-déposer (souris et doigt via la poignée) */
let drag = null, moved = false;
document.addEventListener('pointerdown', e => {
  const c = e.target.closest('[data-drag]'); if (!c || e.target.closest('button')) return;
  if (e.pointerType !== 'mouse' && !e.target.closest('.handle')) return;
  const rc = c.getBoundingClientRect();
  drag = { c, id: +c.dataset.drag, x: e.clientX, y: e.clientY, ox: e.clientX - rc.left, oy: e.clientY - rc.top, w: rc.width }; moved = false;
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) {
    moved = true; dragging = true; drag.g = drag.c.cloneNode(true); drag.g.classList.add('ghost'); drag.g.style.width = drag.w + 'px'; document.body.append(drag.g); drag.c.classList.add('dragging');
  }
  if (!moved) return;
  e.preventDefault();
  drag.g.style.transform = `translate(${e.clientX - drag.ox}px,${e.clientY - drag.oy}px)`;
  document.querySelectorAll('.col.over').forEach(x => x.classList.remove('over'));
  const el = document.elementFromPoint(e.clientX, e.clientY); const col = el && el.closest('[data-col]'); if (col) col.classList.add('over');
}, { passive: false });
document.addEventListener('pointerup', e => {
  if (!drag) return;
  if (moved) {
    const el = document.elementFromPoint(e.clientX, e.clientY); const col = el && el.closest('[data-col]');
    drag.g.remove(); drag.c.classList.remove('dragging'); document.querySelectorAll('.col.over').forEach(x => x.classList.remove('over'));
    dragging = false; const id = drag.id; drag = null;
    if (col) setStatut(id, col.dataset.col);
    setTimeout(() => { moved = false; }, 50);
  } else drag = null;
});

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
window.addEventListener('storage', e => { if (e.key === KEY()) { const s = load(); if (s) { S = s; refresh(); } } });

function after(r) {
  if (r.side === 'client' && r.page === 'messenger') { const b = $('#msb'); if (b) b.scrollTop = b.scrollHeight; }
  const aside = $('.cl-aside');
  if (aside && innerWidth >= 1000) { aside.hidden = false; aside.innerHTML = `<img src="${C.logo}" alt=""><h1>${esc(C.nom)}</h1><p>L'appli de commande, côté client.</p><ul><li>🍜 Le menu du jour, en photos</li><li>🕒 L'heure de retrait au choix</li><li>💳 En ligne ou sur place</li><li>💬 Ou sur Messenger, comme d'habitude</li></ul><a class="btn btn-a" href="#/resto">Voir le côté resto →</a>`; }
}

/* ---------- démarrage ---------- */
Promise.all([fetch('config.json').then(r => r.json()), fetch('data/demo.json').then(r => r.json())]).then(([c, d]) => {
  C = c; D = d;
  const root = document.documentElement.style, k = C.couleurs;
  root.setProperty('--p', k.primaire); root.setProperty('--a', k.accent); root.setProperty('--f', k.fond); root.setProperty('--e', k.encre); root.setProperty('--d', k.doux); root.setProperty('--ok', k.succes);
  document.title = `${C.nom} · Commande`; const tc = $('meta[name=theme-color]'); if (tc) tc.content = k.primaire;
  DAY = demoDay(); DAYK = JK[DAY.getDay()]; ISO = `${DAY.getFullYear()}-${pad(DAY.getMonth() + 1)}-${pad(DAY.getDate())}`; SEM = semaine(DAY); MENU = menuDu(DAY);
  S = load(); if (!S) { S = fresh(); seed(); save(); }
  render(); setInterval(tick, 1000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => { /* hors-ligne indisponible ici */ });
}).catch(err => { app().innerHTML = `<p style="padding:20px">Chargement : ${esc(err.message)}</p>`; });
})();
