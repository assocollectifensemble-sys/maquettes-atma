/* APP.JS — moteur du prototype « Enquête au bord du lagon » (même principe que le prototype Kélonia :
   écrans, étapes à QR code, mini-jeux tactiles, mode démo, hors connexion). */
(function () {
  "use strict";
  const C = window.Content, S = window.Store, A = window.Audio2.Sfx, Art = window.Art;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const screen = $("#screen"), top = $("#topbar");
  const q = new URLSearchParams(location.search);
  const DEMO = q.get("demo") === "1";
  let etat = { e: "projet", id: 0, phase: "", i: 0 };
  let lock = false;

  function topbar() {
    const n = S.count();
    top.innerHTML = '<button class="tb" data-go="projet" aria-label="Le projet">ℹ︎ Le projet</button><span class="tb-t">' + (etat.e === "projet" ? "Prototype" : "Zouzou · " + n + "/2") + '</span>' +
      (DEMO ? '<span class="pill">Mode démo</span>' : '<button class="tb" data-go="accueil">Accueil</button>');
  }
  function go(e, o) { etat = Object.assign({ e: e, id: 0, phase: "", i: 0 }, o || {}); document.body.dataset.ecran = e; render(); window.scrollTo(0, 0); }
  function setBody(h) { screen.innerHTML = h; }
  const btn = (id, txt, cls) => '<button class="btn ' + (cls || "") + '" data-a="' + id + '">' + txt + '</button>';
  const bulle = (qui, expr, t) => '<div class="dial">' + Art.zouzou(expr, 84) + '<p class="bulle">' + esc(t) + '</p></div>';

  /* ---------------- écrans ---------------- */
  function projet() {
    const P = C.projet;
    setBody('<section class="pad projet"><p class="kicker">' + esc(P.kicker) + '</p><h1>' + esc(P.titre) + '</h1><p class="idee">' + esc(P.idee) + '</p>' +
      '<ul class="cartes">' + P.cartes.map(c => '<li><span class="ico">' + c.ico + '</span><div><b>' + esc(c.t) + '</b><span>' + esc(c.d) + '</span></div></li>').join("") + '</ul>' +
      '<p class="mention">' + esc(P.mention) + '</p>' +
      btn("jouer", "Essayer l'aventure", "main") + btn("fiche", "Voir les QR codes des étapes", "ghost") + btn("credits", "Crédits et sources", "ghost") + '</section>');
  }
  function accueil() {
    setBody('<section class="accueil">' + Art.scene(false) + '<div class="pad"><p class="kicker">Réserve naturelle marine de La Réunion</p><h1>Enquête au bord du lagon</h1>' +
      '<p class="idee">Aide Zouzou la zourite à retrouver qui a abîmé sa maison dans le récif. Tu restes sur la plage : pas besoin d\'entrer dans l\'eau.</p>' +
      btn("start", S.count() ? "Reprendre l'aventure" : "Commencer l'enquête", "main") + (S.count() ? btn("reset", "Recommencer", "ghost") : "") + '</div></section>');
  }
  function intro() {
    const l = C.intro[etat.i];
    setBody('<section class="pad">' + Art.scene(true) + bulle(l.qui, l.expr, l.t) + btn("introNext", etat.i < C.intro.length - 1 ? "Suivant" : "Je pars à l'enquête", "main") + '</section>');
  }
  function hub() {
    const f = S.faits();
    setBody('<section class="pad"><h2>Les indices de Zouzou</h2><p class="idee">Scanne le QR code d\'une étape sur place, ou touche « Je suis à l\'étape » (mode démo).</p><ol class="etapes">' +
      C.etapes.map(e => {
        const jouable = !!e.jeu, fait = f[e.id];
        return '<li class="' + (fait ? "ok" : "") + (jouable ? "" : " off") + '"><span class="ico">' + e.ico + '</span><div><b>' + e.id + ". " + esc(e.titre) + '</b><span>' +
          (jouable ? esc(e.lieu) : "Version complète · " + esc(e.apercu)) + '</span></div>' +
          (jouable ? '<button class="mini" data-a="st" data-id="' + e.id + '">' + (fait ? "Rejouer" : "Je suis à l'étape") + '</button>' : '<em>à venir</em>') + '</li>';
      }).join("") + '</ol>' + (S.count() >= 2 ? btn("findemo", "Résoudre l'enquête", "main") : "") + '</section>');
  }
  function etape() {
    const e = C.etapes.find(x => x.id === etat.id), p = etat.phase;
    const tete = '<p class="kicker">Étape ' + e.id + " · " + esc(e.titre) + '</p>';
    if (p === "brief") return setBody('<section class="pad">' + tete + Art.scene(true) + bulle("zouzou", "clin", e.brief) + btn("jeu", "C'est parti !", "main") + '</section>');
    if (p === "jeu") { setBody('<section class="pad">' + tete + '<p class="idee">' + esc(e.consigne) + '</p><div id="zone"></div><p id="msg" class="msg" role="status" aria-live="polite"></p></section>'); return e.jeu === "tri" ? jeuTri() : jeuLagon(); }
    if (p === "quiz") {
      const z = e.quiz;
      return setBody('<section class="pad">' + tete + '<h2>' + esc(z.q) + '</h2><div class="opts">' + z.opts.map((o, i) => '<button class="opt" data-a="rep" data-i="' + i + '">' + esc(o) + '</button>').join("") + '</div><p id="msg" class="msg" role="status" aria-live="polite"></p></section>');
    }
    if (p === "info") {
      return setBody('<section class="pad">' + tete + bulle("zouzou", "content", e.quiz.bravo) + '<div class="fait"><b>À retenir</b><p>' + esc(e.fait) + '</p><small>' + esc(e.src) + '</small></div>' +
        '<details class="classe"><summary>Pour la classe</summary><p>' + esc(e.classe.notion) + '</p><p><i>' + e.classe.mots.map(esc).join(" · ") + '</i></p><p>Question : ' + esc(e.classe.q) + '</p></details>' +
        '<p class="idee">' + esc(e.fin) + '</p>' + btn("etapeFin", "Continuer", "main") + '</section>');
    }
  }
  function findemo() {
    const D = C.dossier;
    setBody('<section class="pad"><p class="kicker">' + esc(D.titre) + '</p><h2>' + esc(D.q) + '</h2>' + bulle("zouzou", "fete", D.reponse) +
      '<div class="fait"><b>Mes 5 bons gestes</b><ul class="gestes">' + C.fin.gestes.map(g => '<li><span>' + g.ico + '</span>' + esc(g.t) + '</li>').join("") + '</ul><small>' + esc(C.fin.src) + '</small></div>' +
      '<p class="mention">Fin de la démonstration : dans la version complète, deux autres étapes (zones de quiétude, admirer sans déranger) prolongent l\'enquête.</p>' + btn("accueil", "Retour à l'accueil", "ghost") + btn("projet", "Revoir le projet", "main") + '</section>');
  }
  function fiche() {
    const base = location.origin + location.pathname;
    setBody('<section class="pad"><h2>QR codes des étapes</h2><p class="idee">Ces QR codes ouvrent directement chaque étape. Ils sont à imprimer et à poser sur place (emplacements à choisir ensemble).</p><div class="qrs">' +
      C.etapes.filter(e => e.jeu).map(e => '<figure><div class="qr" data-url="' + base + '?station=' + e.id + '"></div><figcaption><b>Étape ' + e.id + '</b><br>' + esc(e.titre) + '</figcaption></figure>').join("") +
      '</div>' + btn("projet", "Retour", "ghost") + '</section>');
    document.querySelectorAll(".qr").forEach(d => { d.innerHTML = window.QR.svg(d.dataset.url, { taille: 150 }); });
  }
  function credits() {
    setBody('<section class="pad"><h2>Crédits et sources</h2>' + C.credits.map(c => '<p class="idee">' + esc(c) + '</p>').join("") + btn("projet", "Retour", "ghost") + '</section>');
  }

  /* ---------------- mini-jeux ---------------- */
  function jeuTri() {
    const z = $("#zone"), msg = $("#msg"); let reste = C.tri.filter(t => t.mal).length;
    z.innerHTML = '<div class="grille-tri">' + C.tri.map((t, i) => '<button class="carte" data-i="' + i + '"><span>' + t.ico + '</span><small>' + esc(t.nom) + '</small></button>').join("") + '</div>';
    z.querySelectorAll(".carte").forEach(b => b.addEventListener("click", () => {
      const t = C.tri[+b.dataset.i]; if (b.classList.contains("done")) return;
      if (t.mal) {
        b.classList.add("done"); b.disabled = true; A.ok(); reste--; msg.textContent = "✔︎ " + t.msg;
        if (!reste) setTimeout(() => go("st", { id: 1, phase: "quiz" }), 1400);
      } else { b.classList.add("keep"); A.page(); msg.textContent = "On le garde ! " + t.msg; }
    }));
    msg.textContent = reste + " objets à retirer.";
  }
  function jeuLagon() {
    const G = C.lagon, z = $("#zone"), msg = $("#msg"); let pos = G.depart.slice(), ko = 0;
    function dessine() {
      z.innerHTML = '<div class="lagon" style="--n:' + G.grille[0].length + '">' + G.grille.map((r, y) => r.split("").map((c, x) => {
        const est = pos[0] === y && pos[1] === x, arr = G.arrivee[0] === y && G.arrivee[1] === x;
        return '<button class="case ' + (c === "S" ? "sable" : "corail") + (est ? " ici" : "") + '" data-y="' + y + '" data-x="' + x + '" aria-label="' + (c === "S" ? "sable" : "corail") + (est ? ", ton paddle" : "") + (arr ? ", arrivée" : "") + '">' + (est ? Art.paddle() : arr ? "🏁" : (c === "C" ? "🪸" : "")) + '</button>';
      }).join("")).join("") + '</div>';
      z.querySelectorAll(".case").forEach(b => b.addEventListener("click", () => {
        const y = +b.dataset.y, x = +b.dataset.x, d = Math.abs(y - pos[0]) + Math.abs(x - pos[1]);
        if (d !== 1) { msg.textContent = "Avance d'une case à la fois, à côté de ton paddle."; return; }
        if (G.grille[y][x] === "C") { A.ko(); b.classList.add("shake"); msg.textContent = G.ko[ko++ % G.ko.length]; return; }
        pos = [y, x]; A.tap(); dessine();
        if (y === G.arrivee[0] && x === G.arrivee[1]) { A.ok(); msg.textContent = "Arrivé sans toucher le moindre corail !"; setTimeout(() => go("st", { id: 2, phase: "quiz" }), 1300); }
      }));
    }
    dessine(); msg.textContent = "Départ en haut à gauche.";
  }

  /* ---------------- actions ---------------- */
  const actions = {
    jouer() { go("accueil"); }, fiche() { go("fiche"); }, credits() { go("credits"); }, projet() { go("projet"); }, accueil() { go("accueil"); },
    start() { A.unlock(); S.get("intro") && S.count() ? go("hub") : go("intro"); },
    reset() { S.reset(); go("accueil"); },
    introNext() { A.page(); if (etat.i < C.intro.length - 1) go("intro", { i: etat.i + 1 }); else { S.set("intro", true); go("hub"); } },
    st(d) { A.unlock(); A.bip(); go("st", { id: +d.id, phase: "brief" }); },
    jeu() { A.tap(); go("st", { id: etat.id, phase: "jeu" }); },
    rep(d) {
      const e = C.etapes.find(x => x.id === etat.id), i = +d.i, m = $("#msg"); if (lock) return;
      if (i === e.quiz.ok) { lock = true; A.ok(); document.querySelectorAll(".opt")[i].classList.add("bon"); setTimeout(() => { lock = false; go("st", { id: etat.id, phase: "info" }); }, 700); }
      else { A.ko(); document.querySelectorAll(".opt")[i].classList.add("mauvais"); m.textContent = e.quiz.rate; }
    },
    etapeFin() { S.fait(etat.id); A.indice(); go("hub"); },
    findemo() { A.fanfare(); go("findemo"); }
  };
  document.addEventListener("click", ev => {
    const t = ev.target.closest("[data-a],[data-go]"); if (!t) return;
    if (t.dataset.go) { go(t.dataset.go); return; }
    const f = actions[t.dataset.a]; if (f) f(t.dataset);
  });

  function render() {
    topbar();
    ({ projet, accueil, intro, hub, st: etape, findemo, fiche, credits }[etat.e] || accueil)();
  }

  /* ---------------- démarrage ---------------- */
  const st = q.get("station");
  if (st && /^\d+$/.test(st) && C.etapes.find(e => e.id === +st && e.jeu)) go("st", { id: +st, phase: "brief" });
  else go("projet");
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
