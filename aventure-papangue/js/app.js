/* ============================================================
   APP.JS — Écrans et navigation du moteur commun.
   Adresses : ?station=projet | accueil | intro | carte | <id d'étape> | victoire  (+ &demo=1 : diaporama)
   Le contenu (textes, personnage, lieux, lots) vient de window.H (js/contenu.js, propre à chaque hôtel).
   ============================================================ */
(function () {
  "use strict";
  const H = window.H, app = document.getElementById("app");
  Object.keys(H.couleurs).forEach(k => document.documentElement.style.setProperty("--" + k, H.couleurs[k]));
  // variantes foncées des couleurs de l'hôtel, pour du texte blanc ou du texte sur fond clair (contraste AA)
  const fonce = (hex, k) => "#" + String(hex).slice(1).match(/../g).map(x => Math.round(parseInt(x, 16) * k).toString(16).padStart(2, "0")).join("");
  document.documentElement.style.setProperty("--c1f", fonce(H.couleurs.c1, .62));
  document.documentElement.style.setProperty("--c2f", fonce(H.couleurs.c2, .6));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const Sfx = () => window.Audio2 ? Audio2.Sfx : {};
  const son = n => { try { const f = Sfx()[n]; if (f) f(); } catch (e) { /* silence */ } };
  const JOUABLES = H.etapes.filter(e => e.jeu);
  let route = { n: "projet", id: null, phase: null }, jeu = null, demo = false, demoIdx = 0, res = {}, introIdx = 0;

  // ---------- utilitaires d'affichage ----------
  function qui(texte, pose) { return '<div class="qui"><div class="avatar"><svg viewBox="0 0 200 200">' + H.perso(pose || "parle") + '</svg></div><div class="bulle" id="dit">' + texte + '</div></div>'; }
  function topbar(titre, sous, retour) {
    return '<header class="topbar">' + (retour ? '<button class="ib" data-act="retour" aria-label="Retour">←</button>' : "") +
      '<div class="tb-titre">' + esc(titre) + (sous ? '<small>' + esc(sous) + '</small>' : "") + '</div>' +
      '<button class="ib" data-act="son" aria-label="Son">' + (Store.get("son") ? "🔊" : "🔇") + '</button></header>';
  }
  function toast(t) { document.querySelectorAll(".toast").forEach(x => x.remove()); const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.innerHTML = t; document.body.appendChild(d); setTimeout(() => d.remove(), 3200); }
  function fete(grande) {
    document.querySelectorAll(".fete").forEach(x => x.remove());
    const f = document.createElement("div"); f.className = "fete" + (grande ? " grande" : ""); f.setAttribute("aria-hidden", "true");
    const c = [H.couleurs.accent, H.couleurs.c1, H.couleurs.c2, "#fff", "#7ae582"], n = grande ? 90 : 50;
    for (let i = 0; i < n; i++) {
      const k = document.createElement("i"), rond = i % 5 === 0;
      k.style.left = Math.random() * 100 + "%"; k.style.width = (rond ? 9 : 6 + Math.random() * 6) + "px"; k.style.height = (rond ? 9 : 10 + Math.random() * 8) + "px";
      if (rond) k.style.borderRadius = "50%";
      k.style.background = c[i % c.length]; k.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      k.style.animationDuration = 2.2 + Math.random() * 2 + "s"; k.style.animationDelay = Math.random() * (grande ? 1.4 : .6) + "s"; f.appendChild(k);
    }
    // quelques icônes du gain qui s'envolent (clés, gouttes…)
    for (let i = 0; i < (grande ? 10 : 5); i++) {
      const e = document.createElement("b"); e.textContent = i % 2 ? H.gain.icone : "⭐"; e.style.left = 5 + Math.random() * 90 + "%";
      e.style.animationDuration = 2.6 + Math.random() * 1.6 + "s"; e.style.animationDelay = Math.random() * .9 + "s"; f.appendChild(e);
    }
    document.body.appendChild(f); setTimeout(() => f.remove(), grande ? 6500 : 5200);
  }
  const etapeParId = id => H.etapes.find(e => e.id === id);
  const toutFini = () => JOUABLES.every(e => Store.faits()[e.id]);

  // =================== ÉCRANS ===================
  const ECRANS = {};

  /* ---------- 1. Le projet (pour la direction de l'hôtel) ---------- */
  ECRANS.projet = () => {
    const P = H.projet;
    return '<header class="topbar"><div class="tb-titre">Le projet<small>' + esc(H.nom) + '</small></div><button class="tb-demo" data-act="go" data-n="accueil">▶ Voir l\'aventure</button></header>' +
      '<main class="pj"><section class="pj-hero"><div class="pj-scene">' + Art.scene(H.decor, H.perso("coucou"), { h: 250, py: 92, ps: .72, px: 116, label: "L'univers de l'aventure" }) + '</div>' +
      '<span class="pj-pour">' + esc(P.pour) + '</span><h1>' + esc(H.titre) + '</h1><p class="pj-sous">' + P.sous + '</p>' +
      (P.puces ? '<ul class="pj-puces">' + P.puces.map(x => '<li><span aria-hidden="true">' + x[0] + '</span>' + x[1] + '</li>').join("") + '</ul>' : "") +
      '<button class="btn grand" data-act="go" data-n="accueil" style="margin-top:8px">▶ Essayer l\'aventure (2 étapes)</button></section>' +
      '<section class="pj-bloc"><h2><span class="num">1</span>L\'idée en 3 lignes</h2><ol class="pj-idee">' + P.idee.map(x => '<li>' + x + '</li>').join("") + '</ol></section>' +
      '<section class="pj-bloc"><h2><span class="num">2</span>Ce que ça apporte à l\'hôtel</h2><div class="apports">' + P.apports.map(a => '<div class="apport"><span class="ico" aria-hidden="true">' + a[0] + '</span><div><h3>' + a[1] + '</h3><p>' + a[2] + '</p></div></div>').join("") + '</div></section>' +
      '<section class="pj-bloc label-bloc"><h2><span class="num">3</span>' + P.label.titre + '</h2><p>' + P.label.intro + '</p>' + P.label.criteres.map(c => '<div class="critere"><span class="cn">' + c[0] + '</span><p>' + c[1] + '</p></div>').join("") + '<p class="note">' + P.label.note + '</p></section>' +
      '<section class="pj-bloc"><h2><span class="num">4</span>Les lots : un vrai gain, à chaque fois</h2><p>' + P.lotsIntro + '</p><div class="lots">' + P.lots.map(l => '<div class="lot"><span class="ico" aria-hidden="true">' + l[0] + '</span><span>' + l[1] + '<small>' + l[2] + '</small></span></div>').join("") + '</div><p class="note">Exemples, à définir avec vous. Pas de tirage au sort : chaque famille qui termine reçoit son lot.</p></section>' +
      '<section class="pj-bloc chambre-bloc"><h2><span class="num">5</span>La version « chambre »</h2><p>' + P.chambre.texte + '</p><ul class="coches">' + P.chambre.defis.map(d => '<li>' + d + '</li>').join("") + '</ul></section>' +
      '<section class="pj-bloc"><h2><span class="num">6</span>L\'application complète</h2><ul class="coches">' + P.complete.map(d => '<li>' + d + '</li>').join("") + '</ul>' + (P.appli ? '<p class="note">' + P.appli + '</p>' : "") + '</section>' +
      '<section class="pj-bloc"><h2><span class="num">7</span>Vos statistiques de jeu</h2><span class="fictif">Exemple fictif · tableau de bord de l\'hôtel</span>' +
      '<div class="stats">' + P.stats.map(s => '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>').join("") + '</div>' +
      '<div class="barres">' + P.barres.map(b => '<div class="barre"><span>' + b[0] + '</span><span class="rail"><i style="width:' + b[1] + '%"></i></span><b>' + b[1] + ' %</b></div>').join("") + '</div>' +
      '<p class="note">Aucune donnée personnelle : des compteurs anonymes, utiles pour votre dossier de label et votre bilan.</p></section>' +
      '<section class="signature"><b>Jonathan Bou — aventures sur téléphone</b><p class="small">Déjà en jeu : l\'aventure du Croc Parc, <a href="https://app.croc-parc.re" rel="noopener">app.croc-parc.re</a></p>' +
      '<button class="btn c1 grand" data-act="go" data-n="accueil">▶ Voir l\'aventure</button><p class="small" style="margin-top:12px">Maquette de démonstration, réalisée pour ' + esc(H.nom) + '. Illustrations originales, sans photo ni logo officiel.</p></section></main>';
  };

  /* ---------- 2. Accueil ---------- */
  ECRANS.accueil = () => topbar("", "", true) +
    '<main class="accueil"><div class="acc-scene">' + Art.scene(H.decor, H.perso("coucou"), { h: 360, ps: .9, px: 92, py: 168 }) + '</div>' +
    '<div class="acc-bas"><div class="acc-titre"><span class="hotel">' + esc(H.nomCourt) + '</span><h1>' + esc(H.titre) + '</h1><p>' + H.accroche + '</p></div>' +
    '<div class="bulle acc-bulle">' + H.accueilBulle + '</div>' +
    '<div class="pile"><button class="btn grand" data-act="go" data-n="intro">' + esc(H.boutonDepart) + '</button>' +
    (Object.keys(Store.faits()).length ? '<button class="btn sec" data-act="go" data-n="carte">🗺️ Reprendre sur la carte</button>' : "") +
    '<p class="small" style="text-align:center;margin-top:6px">' + H.infoFamille + '</p></div></div></main>';

  /* ---------- 3. Intro (le personnage raconte) ---------- */
  let chat = 0;
  ECRANS.intro = () => {
    const x = H.intro[introIdx], der = introIdx === H.intro.length - 1;
    return topbar(H.perso_nom, "raconte…", true) + '<main class="intro"><button class="grand-perso" data-act="chatouille" aria-label="Chatouiller ' + esc(H.perso_nom) + '"><svg viewBox="0 0 200 200" class="coucou">' + H.perso(x[0]) + '</svg></button><p class="astuce-tap">👆 Psst… chatouille-moi !</p>' +
      '<div class="bulle haut">' + x[1] + '</div><div class="points">' + H.intro.map((_, i) => '<i class="' + (i === introIdx ? "on" : "") + '"></i>').join("") + '</div>' +
      '<button class="btn grand" data-act="' + (der ? "go" : "intro-suite") + '" data-n="carte">' + (der ? x[2] || "🗺️ Voir la carte" : "Et alors ? ➜") + '</button></main>';
  };

  /* ---------- 4. Carte ---------- */
  ECRANS.carte = () => {
    const F = Store.faits();
    return topbar(H.carteTitre, H.nom, true) + '<main class="carte-ecran"><div class="carte-tete"><h1>' + esc(H.gain.nomPluriel) + '</h1><div class="cles">' + JOUABLES.concat(H.etapes.filter(e => !e.jeu)).map(e => '<span class="' + (F[e.id] ? "on" : "") + '" title="' + esc(e.lieu) + '">' + H.gain.icone + '</span>').join("") + '</div></div>' +
      '<div class="carte-svg">' + Art.carte(H, F) + '</div>' +
      (toutFini() ? '<div style="margin-top:14px"><button class="btn grand" data-act="go" data-n="victoire">🏆 Recevoir ma récompense</button></div>' : '<div style="margin-top:12px">' + qui(H.carteBulle, "parle") + '</div>') +
      '<div class="etapes">' + H.etapes.map((e, i) => {
        const ok = F[e.id], cl = e.jeu ? (ok ? "jouable fait" : "jouable") : "verrou";
        return '<button class="etape-c ' + cl + '" data-act="etape" data-id="' + e.id + '"><span class="n">' + (ok ? "✓" : e.jeu ? i + 1 : "🔒") + '</span><span class="t"><b>' + esc(e.lieu) + '</b><span>' + esc(e.resume) + '</span><span class="tag">' + (e.jeu ? (ok ? "Réussi !" : "À jouer · " + e.duree) : "Dans l'application complète") + '</span></span><span class="go">' + (e.jeu ? "➜" : "") + '</span></button>';
      }).join("") + '</div><p class="legende-carte">Plan illustré, non contractuel. Les lieux sont à choisir avec l\'hôtel.</p></main>';
  };

  /* ---------- 5. Étape : brief → jeu → bravo ---------- */
  ECRANS.etape = () => {
    const E = etapeParId(route.id); if (!E) return ECRANS.carte();
    const tete = '<div class="etape-tete"><span class="lieu">📍 ' + esc(E.lieu) + '</span><h1>' + esc(E.titre) + '</h1></div>';
    if (!E.jeu) {
      return topbar("Étape " + (H.etapes.indexOf(E) + 1), "Dans l'application complète", true) + '<main class="etape">' + tete + '<div class="mission">' + qui(E.teaser, "parle") + '</div>' +
        '<div class="encart"><h3>🔒 Dans l\'application complète</h3><ul>' + E.complet.map(x => '<li>' + x + '</li>').join("") + '</ul></div>' +
        '<button class="btn grand" data-act="go" data-n="carte">🗺️ Retour à la carte</button></main>';
    }
    if (route.phase === "jeu") return topbar(E.lieu, E.titre, true) + '<main class="etape"><div id="jeuhost"></div><p class="jeu-etat" id="etat" aria-live="polite"></p>' + (demo ? '<button class="btn sec mini demo-solve" data-act="resoudre">⏭ Résoudre (démo)</button>' : "") + '</main>';
    if (route.phase === "bravo") {
      const r = res[E.id] || { etoiles: 3 }, suivante = JOUABLES.find(e => !Store.faits()[e.id]);
      return topbar(E.lieu, "Réussi !", true) + '<main class="etape"><div class="resultat"><div class="etoiles" aria-label="' + r.etoiles + ' étoile(s) sur 3">' + [1, 2, 3].map(k => '<span class="et' + (k <= r.etoiles ? "" : " off") + '" style="animation-delay:' + (0.25 + k * 0.28) + 's">⭐</span>').join("") + '</div><h2>' + E.bravo.titre + '</h2>' +
        '<div class="gain"><span class="medaille">' + E.bravo.gainIcone + '</span><div><b>' + E.bravo.gain + '</b><br><span class="small">' + E.bravo.gainSous + '</span></div></div>' +
        qui(E.bravo.perso, "joie") +
        '<div class="savais"><h3>💡 ' + E.savais.titre + '</h3><p>' + E.savais.texte + '</p>' + (E.savais.src ? '<span class="src">Source : ' + E.savais.src + '</span>' : "") + '</div>' +
        (E.terrain ? '<div class="terrain">📍 <b>Sur place</b> · ' + E.terrain + '</div>' : "") +
        '<div class="pile">' + (suivante ? '<button class="btn grand" data-act="etape" data-id="' + suivante.id + '">➜ Étape suivante : ' + esc(suivante.lieuCourt) + '</button>' : '<button class="btn grand" data-act="go" data-n="victoire">🏆 Recevoir ma récompense</button>') +
        '<button class="btn sec" data-act="go" data-n="carte">🗺️ La carte</button></div></div></main>';
    }
    return topbar("Étape " + (H.etapes.indexOf(E) + 1), E.lieuCourt, true) + '<main class="etape">' + tete +
      '<div class="mission">' + qui(E.mission, "parle") + '</div>' +
      (E.regle ? '<div class="encart"><h3>🎮 Comment jouer</h3><ul>' + E.regle.map(x => '<li>' + x + '</li>').join("") + '</ul></div>' : "") +
      '<button class="btn grand" data-act="jouer">' + esc(E.boutonJeu || "C'est parti !") + '</button></main>';
  };

  /* ---------- 6. Victoire : badge + bon ---------- */
  ECRANS.victoire = () => {
    if (!Store.get("code")) Store.set("code", H.codePrefixe + "-" + String(1000 + Math.floor(Math.random() * 9000)));
    const lot = H.lot, avis = Store.get("avis");
    const d = new Date(), date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const code = esc(Store.get("code")), barres = Array.from(code).map((ch, i) => { const v = ch.charCodeAt(0) + i * 7; return '<i style="width:' + (1 + v % 3) + 'px;margin-right:' + (1 + (v >> 2) % 3) + 'px"></i>'; }).join("");
    return topbar("Bravo !", H.nom, true) + '<main class="victoire"><span class="debloque">🏅 Nouveau badge débloqué !</span>' + Art.badge(H) +
      '<h1>' + H.badge.titre + '</h1><p>' + H.victoireTexte + '</p>' +
      '<div class="bon" role="group" aria-label="Bon cadeau à montrer"><div class="bon-tete"><span>🎁 Bon cadeau</span><span class="tampon">Gagné !</span></div>' +
      '<div class="bon-hotel">' + esc(H.nom) + '</div>' +
      '<div class="bon-lot">' + lot.titre + '</div><div class="bon-lieu">📍 ' + lot.lieu + '</div><div class="bon-detail">' + lot.detail + '</div>' +
      '<div class="bon-perfo" aria-hidden="true"></div>' +
      '<div class="bon-code"><span>N° du bon<br><b>' + code + '</b></span><span class="codebarre" aria-hidden="true">' + barres + barres + '</span></div>' +
      '<div class="bon-pied"><span>Gagné le ' + esc(date) + '</span><span>1 lot par famille</span></div>' +
      '<div class="bon-visa">Visa de l\'équipe : <i></i></div>' +
      '<div class="bon-note">Exemple de lot, à définir avec vous. Gagné à coup sûr : pas de tirage au sort.</div></div>' +
      '<div class="encart"><h3>' + H.perso_nom + ' te demande :</h3><p style="margin:0 0 4px">Tu as aimé l\'aventure ?</p><div class="avis">' + ["😍", "🙂", "😐"].map(x => '<button data-act="avis" data-v="' + x + '" aria-pressed="' + (avis === x) + '">' + x + '</button>').join("") + '</div><p class="small" style="margin:0">' + H.compteur + '</p></div>' +
      '<div class="encart"><h3>✨ Dans l\'application complète</h3><ul>' + H.victoireSuite.map(x => '<li>' + x + '</li>').join("") + '</ul></div>' +
      '<div class="pile"><button class="btn grand" data-act="go" data-n="projet">📋 Revenir au projet</button><button class="btn sec" data-act="rejouer">↺ Rejouer la démo</button></div></main>';
  };

  // =================== NAVIGATION ===================
  function url() { const q = new URLSearchParams(); q.set("station", route.n === "etape" ? route.id : route.n); if (route.n === "etape" && route.phase && route.phase !== "brief") q.set("phase", route.phase); if (demo) q.set("demo", "1"); return "?" + q.toString(); }
  function go(n, opt) {
    opt = opt || {}; route = { n, id: opt.id || null, phase: opt.phase || (n === "etape" ? "brief" : null) };
    if (n === "intro" && !opt.garde) introIdx = 0;
    if (opt.histo !== "aucun") { try { history[opt.histo === "remplace" ? "replaceState" : "pushState"](route, "", url()); } catch (e) { /* fichier local */ } }
    rendu();
  }
  function rendu() {
    jeu = null;
    document.body.dataset.ecran = route.n;
    const f = ECRANS[route.n] || ECRANS.projet;
    app.innerHTML = f();
    window.scrollTo(0, 0);
    if (route.n === "etape" && route.phase === "jeu") {
      const E = etapeParId(route.id), etat = document.getElementById("etat");
      jeu = Games.mount(E.jeu, document.getElementById("jeuhost"), {
        say: t => { etat.innerHTML = t || ""; },
        onWin: r => { res[E.id] = r; Store.fait(E.id, r.etoiles); go("etape", { id: E.id, phase: "bravo", histo: "remplace" }); }
      });
    }
    if (route.n === "victoire") { son("fanfare"); fete(true); }
    if (route.n === "etape" && route.phase === "bravo") { son("indice"); fete(); }
    barreDemo();
  }

  // ---------- diaporama de présentation (?demo=1) ----------
  const SEQ = [["projet"], ["accueil"], ["intro"], ["carte"]].concat(...JOUABLES.map(e => [["etape", e.id, "brief"], ["etape", e.id, "jeu"], ["etape", e.id, "bravo"]]), [["carte"], ["victoire"]]);
  function barreDemo() {
    let b = document.getElementById("presbar");
    if (!demo) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("nav"); b.id = "presbar"; b.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:60;display:flex;gap:8px;align-items:center;background:rgba(0,0,0,.72);color:#fff;border-radius:999px;padding:6px 8px;font:700 13px system-ui"; document.body.appendChild(b); }
    const pareil = x => x && x[0] === route.n && (x[1] || null) === (route.id || null) && (x[2] || null) === (route.phase || null);
    if (!pareil(SEQ[demoIdx])) { const i = SEQ.findIndex(pareil); if (i >= 0) demoIdx = i; }
    b.innerHTML = '<button data-act="dprev" class="ib" aria-label="Écran précédent">◀</button><span>' + (demoIdx + 1) + ' / ' + SEQ.length + '</span><button data-act="dnext" class="ib" aria-label="Écran suivant">▶</button>';
  }
  function demoGo(d) {
    demoIdx = Math.max(0, Math.min(SEQ.length - 1, demoIdx + d)); const x = SEQ[demoIdx];
    SEQ.slice(0, demoIdx).forEach(y => { if (y[2] === "bravo") Store.fait(y[1], 3); });
    if (x[2] === "bravo") Store.fait(x[1], 3);
    go(x[0], { id: x[1], phase: x[2], histo: "remplace" });
  }

  // ---------- actions ----------
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    son("unlock");
    const a = b.dataset.act;
    if (a !== "son") son("tap");
    switch (a) {
      case "go": go(b.dataset.n); break;
      case "retour": if (history.length > 1 && history.state) history.back(); else go(route.n === "accueil" ? "projet" : route.n === "etape" ? "carte" : "accueil"); break;
      case "son": Store.set("son", !Store.get("son")); b.textContent = Store.get("son") ? "🔊" : "🔇"; break;
      case "chatouille": {
        const R = ["Hi hi hi ! Ça chatouille !", "Encore ! Encore !", "Hé ! Je suis chatouilleux de la tête aux pieds !", "Pouf ! Tu m'as fait faire un saut de dauphin !", "Arrête, je vais rire jusqu'à demain !"];
        b.classList.remove("saute"); void b.offsetWidth; b.classList.add("saute"); son("bulle");
        toast(H.perso_nom + " : « " + R[(chat++) % R.length] + " »"); break;
      }
      case "intro-suite": introIdx++; go("intro", { garde: true, histo: "remplace" }); son("page"); break;
      case "etape": {
        const E = etapeParId(b.dataset.id); if (!E) break;
        go("etape", { id: E.id }); break;
      }
      case "jouer": go("etape", { id: route.id, phase: "jeu", histo: "remplace" }); break;
      case "resoudre": if (jeu) jeu.resoudre(); break;
      case "avis": Store.set("avis", b.dataset.v); document.querySelectorAll('[data-act="avis"]').forEach(x => x.setAttribute("aria-pressed", x === b)); toast("Merci ! " + H.perso_nom + " saute de joie " + b.dataset.v); break;
      case "rejouer": Store.reset(); res = {}; go("accueil"); break;
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
    }
  });
  document.addEventListener("keydown", e => { if (!demo) return; if (e.key === "ArrowRight" || e.key === "PageDown") demoGo(1); if (e.key === "ArrowLeft" || e.key === "PageUp") demoGo(-1); });
  window.addEventListener("popstate", e => { if (e.state && e.state.n) { route = e.state; rendu(); } else depart(); });

  function depart() {
    const q = new URLSearchParams(location.search), st = q.get("station") || "projet";
    demo = q.get("demo") === "1";
    if (demo && st === "projet") Store.reset();
    if (etapeParId(st)) go("etape", { id: st, phase: q.get("phase") || "brief", histo: "remplace" });
    else go(ECRANS[st] && st !== "etape" ? st : "projet", { histo: "remplace" });
  }
  depart();
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
  window.App = { go, route: () => route, jeu: () => jeu, demoGo };
})();
