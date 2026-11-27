/* ============================================================
   APP.JS — Navigation, écrans et mini-jeux de la maquette
   « Le Secret de la Ville du Sud » (Saint-Pierre).
   Adresses directes : ?station=projet | accueil | carte | 1 | 2 | victoire
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const screen = $("#screen"), topbar = $("#topbar");
  const S = Audio2.Sfx;
  let courant = null;

  // ---------- utilitaires ----------
  function toast(txt) {
    const t = $("#toast"); t.textContent = txt; t.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2600);
  }
  function secrets() { return C.etapes.filter(e => e.jouable && Store.faits()[e.id]).length; }
  function barre() {
    const n = secrets();
    topbar.innerHTML = `
      <button class="brand" data-go="carte" aria-label="Ouvrir le plan">
        <span class="brand-ico" aria-hidden="true">🦎</span>
        <span class="brand-t"><b>${C.titre}</b><small>${C.lieu}</small></span>
      </button>
      <span class="carnet" title="Secrets du carnet" aria-label="${n} secret(s) sur 4">📖 <b>${n}</b>/4</span>
      <button class="ico" id="btn-son" aria-label="Son ${Store.get("son") ? "activé" : "coupé"}" aria-pressed="${Store.get("son")}">${Store.get("son") ? "🔊" : "🔈"}</button>`;
    $("#btn-son").onclick = () => { Store.set("son", !Store.get("son")); barre(); if (Store.get("son")) S.tap(); };
  }
  function bulle(txt, cls) { return `<div class="bulle ${cls || ""}"><p>${txt}</p></div>`; }

  // ---------- routeur ----------
  const ecrans = { projet, accueil, carte, "1": () => etape(0), "2": () => etape(1), victoire };
  function aller(nom, sansHisto) {
    if (!ecrans[nom]) nom = "projet";
    courant = nom;
    document.body.dataset.ecran = nom;
    barre();
    screen.innerHTML = "";
    ecrans[nom]();
    screen.scrollTop = 0; window.scrollTo(0, 0);
    screen.classList.remove("entre"); void screen.offsetWidth; screen.classList.add("entre");
    if (!sansHisto) history.pushState({ e: nom }, "", "?station=" + nom);
    try { screen.focus({ preventScroll: true }); } catch (e) { /* ignoré */ }
  }
  window.addEventListener("popstate", ev => aller((ev.state && ev.state.e) || lireStation(), true));
  document.addEventListener("click", ev => {
    const b = ev.target.closest("[data-go]"); if (!b) return;
    S.unlock(); S.page(); aller(b.dataset.go);
  });
  function lireStation() { return new URLSearchParams(location.search).get("station") || "projet"; }

  // ---------- 1. LE PROJET (décideur) ----------
  function projet() {
    const P = C.projet;
    screen.innerHTML = `
    <section class="hero">
      <p class="sur">${P.sur}</p>
      <h1>${C.titre}</h1>
      <div class="hero-art">${Art.bassoul("hero-b")}</div>
      <p class="accroche">${P.accroche}</p>
      <button class="cta" data-go="accueil">▶ Jouer la démo</button>
      <p class="petit">${P.jouable}</p>
    </section>
    <section class="bloc">
      <h2>Ce que la Ville y gagne</h2>
      <div class="gains">${P.gains.map(g => `<div class="gain"><span class="g-ico" aria-hidden="true">${g[0]}</span><div><h3>${g[1]}</h3><p>${g[2]}</p></div></div>`).join("")}</div>
    </section>
    <section class="bloc">
      <h2>Comment ça se joue</h2>
      <ol class="etapes-how">${P.comment.map(t => `<li>${t}</li>`).join("")}</ol>
      <div class="mini-plan">${Art.plan()}${marqueurs(false)}</div>
      <ul class="liste-lieux">${C.etapes.map(e => `<li><b>${e.num}. ${e.nom}</b> · ${e.lieu}${e.jouable ? ' <span class="tag ok">jouable ici</span>' : ' <span class="tag">application complète</span>'}</li>`).join("")}</ul>
    </section>
    <section class="bloc scolaire">
      <h2>🎒 Version scolaire</h2>
      <p>${P.scolaire}</p>
    </section>
    <section class="bloc jonathan">
      <h2>🎭 En personnage pour les lancements</h2>
      <p>Jonathan Bou, artiste de spectacle à La Réunion (jonglage, danse, beatbox) et développeur, crée l'aventure et peut l'animer en personnage les jours forts. Ensuite, le parcours vit seul, toute l'année.</p>
      <p class="petit">Référence en service : Croki Adventure, au Croc Parc.</p>
    </section>
    <section class="bloc coecrire">
      <h2>✍️ Exemple, contenu à co-écrire avec vous</h2>
      <p>Cette maquette montre l'expérience. Les éléments suivants restent à choisir et valider avec le service patrimoine :</p>
      <ul>${P.coecrire.map(t => `<li>${t}</li>`).join("")}</ul>
    </section>
    <section class="bloc fin">
      <button class="cta" data-go="accueil">▶ Jouer la démo</button>
      <p class="sign">Atma Digital — aventures immersives sur téléphone<br>aurelie.jonathanb@gmail.com</p>
    </section>`;
  }

  // ---------- 2. ACCUEIL ----------
  function accueil() {
    screen.innerHTML = `
    <section class="accueil">
      <div class="scene">${Art.bassoul("parle")}</div>
      ${bulle(C.accueil.bulle, "grande")}
      <button class="cta" data-go="carte">${C.accueil.bouton}</button>
      <button class="lien" data-go="projet">← Le projet</button>
    </section>`;
    setTimeout(() => S.bulle(), 300);
  }

  // ---------- 3. CARTE DES LIEUX ----------
  function marqueurs(actifs) {
    const f = Store.faits();
    return `<div class="marqueurs">${C.etapes.map(e => {
      const etat = !e.jouable ? "verrou" : f[e.id] ? "fait" : "ouvert";
      const lab = `${e.num}. ${e.nom} — ${e.jouable ? (f[e.id] ? "secret trouvé" : "à jouer") : C.carte.complet}`;
      const attrs = actifs && e.jouable ? `data-go="${e.num}" role="button" tabindex="0"` : "";
      return `<span class="mq ${etat}" style="left:${e.x / 360 * 100}%;top:${e.y / 380 * 100}%" ${attrs} aria-label="${lab}">${etat === "verrou" ? "🔒" : etat === "fait" ? "✓" : e.num}</span>`;
    }).join("")}</div>`;
  }
  function carte() {
    const f = Store.faits();
    screen.innerHTML = `
    <section class="carte-ecran">
      <h2>${C.carte.titre}</h2>
      <p>${C.carte.intro}</p>
      <div class="plan-wrap">${Art.plan()}${marqueurs(true)}</div>
      <div class="stations">${C.etapes.map(e => e.jouable ? `
        <button class="station ${f[e.id] ? "fait" : ""}" data-go="${e.num}">
          <span class="num">${f[e.id] ? "✓" : e.num}</span>
          <span class="st-t"><b>${e.nom}</b><small>${e.lieu}${f[e.id] ? " · secret trouvé" : ""}</small></span><span class="fl" aria-hidden="true">›</span>
        </button>` : `
        <div class="station verrou" aria-disabled="true">
          <span class="num">🔒</span>
          <span class="st-t"><b>${e.num}. ${e.nom}</b><small>${e.lieu} · ${C.carte.complet}</small><em>${e.resume}</em></span>
        </div>`).join("")}
      </div>
      ${secrets() >= 2 ? `<button class="cta" data-go="victoire">📖 Ouvrir le carnet</button>` : ""}
    </section>`;
    $$(".mq[data-go]").forEach(m => m.addEventListener("keydown", ev => { if (ev.key === "Enter") m.click(); }));
  }

  // ---------- 4. ÉTAPES ----------
  function entete(e) {
    return `<div class="et-tete"><span class="et-num">${e.num}</span><div><h2>${e.nom}</h2><small>📍 ${e.lieu}</small></div></div>
      <div class="dialogue">${Art.bassoul("mini")}${bulle(e.intro)}</div>`;
  }
  function boutonIndice(e, zone) {
    let n = 0;
    const b = document.createElement("button"); b.className = "indice"; b.textContent = "💡 Un indice, Ti Bassoul ?";
    b.onclick = () => {
      S.indice();
      zone.innerHTML = `<div class="papier"><b>Indice ${n + 1}</b><p>${e.indices[Math.min(n, e.indices.length - 1)]}</p></div>`;
      n++; if (n >= e.indices.length) b.textContent = "💡 Relire l'indice";
    };
    return b;
  }
  function etape(i) {
    const e = C.etapes[i];
    screen.innerHTML = `<section class="etape" id="et-${e.id}">${entete(e)}<div id="jeu"></div><div id="zone-indice"></div><div id="pied"></div></section>`;
    const pied = $("#pied");
    pied.appendChild(boutonIndice(e, $("#zone-indice")));
    const retour = document.createElement("button"); retour.className = "lien"; retour.dataset.go = "carte"; retour.textContent = "← Le plan";
    pied.appendChild(retour);
    if (e.id === "e1") jeuFacade(e); else jeuPort(e);
  }

  // --- Étape 1 : la façade qui parle ---
  function jeuFacade(e) {
    const jeu = $("#jeu"), trouves = new Set();
    jeu.innerHTML = `
      <div class="facade-wrap">${Art.facade(null, true)}</div>
      <div class="compteur" aria-live="polite"><span class="pt"></span><span class="pt"></span><span class="pt"></span> <b id="nb">0</b>/3 détails trouvés</div>
      <div id="info" aria-live="polite"></div>`;
    $$(".zone", jeu).forEach(z => z.addEventListener("click", () => {
      S.unlock();
      const k = z.dataset.zone, d = e.zones[k];
      if (d.bon) {
        if (!trouves.has(k)) { trouves.add(k); S.ok(); Audio2.vibre(30); }
        $$(`.zone[data-zone="${k}"]`, jeu).forEach(x => x.classList.add("trouve"));
        $("#info").innerHTML = bulle(`<b>${d.titre}</b> — ${d.texte}`, "info ok");
      } else {
        S.doux(); z.classList.add("essai"); setTimeout(() => z.classList.remove("essai"), 600);
        $("#info").innerHTML = bulle(d.texte, "info");
      }
      $("#nb").textContent = trouves.size;
      $$(".compteur .pt", jeu).forEach((p, j) => p.classList.toggle("on", j < trouves.size));
      if (trouves.size === 3 && !$("#suite")) {
        const s = document.createElement("button"); s.id = "suite"; s.className = "cta"; s.textContent = "Trois détails trouvés ! Continuer →";
        s.onclick = () => { S.page(); jeuMots(e); };
        $("#info").after(s);
      }
    }));
  }
  function jeuMots(e) {
    const jeu = $("#jeu"); $("#zone-indice").innerHTML = "";
    let choisi = null; const places = {};
    jeu.innerHTML = `
      ${bulle(e.consigneMots, "info")}
      <div class="vignettes">${e.vignettes.map((v, j) => `
        <div class="vig"><div class="vig-img">${Art.facade(v.vb)}</div><div class="slot" data-attend="${v.mot}" data-i="${j}" role="button" tabindex="0" aria-label="Case du dessin ${j + 1}">déposer ici</div></div>`).join("")}
      </div>
      <div class="mots">${e.mots.map(m => `<button class="mot" data-mot="${m}">${m}</button>`).join("")}</div>
      <div id="info2" aria-live="polite"></div>`;
    const mots = $$(".mot", jeu), slots = $$(".slot", jeu);
    function selection(m) { choisi = m; mots.forEach(x => x.classList.toggle("choisi", x === m)); }
    function poser(m, slot) {
      if (!m || !slot || slot.classList.contains("plein")) return;
      if (slot.dataset.attend === m.dataset.mot) {
        S.ramasse(); Audio2.vibre(25);
        slot.textContent = m.dataset.mot; slot.classList.add("plein");
        m.classList.add("pose"); m.disabled = true; places[m.dataset.mot] = true; selection(null);
        $("#info2").innerHTML = "";
        if (Object.keys(places).length === 3) setTimeout(() => reussite(e), 500);
      } else {
        S.ko(); slot.classList.add("essai"); setTimeout(() => slot.classList.remove("essai"), 600);
        $("#info2").innerHTML = bulle("Presque ! Regarde encore le dessin et essaie une autre case.", "info");
        selection(null);
      }
    }
    mots.forEach(m => {
      m.addEventListener("click", () => { if (m._glisse) { m._glisse = false; return; } S.tap(); selection(choisi === m ? null : m); });
      // glisser-déposer au doigt (pointer events)
      m.addEventListener("pointerdown", ev => {
        if (m.disabled) return;
        const x0 = ev.clientX, y0 = ev.clientY; let fant = null;
        const move = mv => {
          if (!fant && Math.hypot(mv.clientX - x0, mv.clientY - y0) > 8) {
            fant = m.cloneNode(true); fant.classList.add("fantome"); document.body.appendChild(fant); m.classList.add("tenu");
          }
          if (fant) { mv.preventDefault(); fant.style.left = mv.clientX + "px"; fant.style.top = mv.clientY + "px";
            const sous = document.elementFromPoint(mv.clientX, mv.clientY); slots.forEach(s => s.classList.toggle("survol", s === (sous && sous.closest(".slot")))); }
        };
        const up = u => {
          document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up);
          if (fant) {
            fant.remove(); m.classList.remove("tenu"); m._glisse = true; slots.forEach(s => s.classList.remove("survol"));
            const sous = document.elementFromPoint(u.clientX, u.clientY); poser(m, sous && sous.closest(".slot"));
          }
        };
        document.addEventListener("pointermove", move, { passive: false }); document.addEventListener("pointerup", up);
      });
    });
    slots.forEach(s => {
      s.addEventListener("click", () => { if (choisi) poser(choisi, s); else if (!s.classList.contains("plein")) toast("Touche d'abord un mot, puis sa case."); });
      s.addEventListener("keydown", ev => { if (ev.key === "Enter") s.click(); });
    });
  }

  // --- Étape 2 : le port d'autrefois ---
  function jeuPort(e) {
    const jeu = $("#jeu"); const ordre = [];
    const leg = id => e.cartes.find(c => c.id === id).legende;
    jeu.innerHTML = `
      <p class="petit attente">🖼️ ${e.attente}</p>
      <div class="frise-temps" aria-label="Ligne du temps">${[0, 1, 2, 3].map(k => `<div class="case-t" data-k="${k}"><span class="k">${k + 1}</span></div>`).join("")}</div>
      <div class="fleche-temps" aria-hidden="true"><span>plus ancien</span><span>plus récent</span></div>
      <p class="consigne">Touche les images dans l'ordre : la plus ancienne d'abord.</p>
      <div class="cartes-port">${e.melange.map(id => `<button class="carte-p" data-id="${id}"><span class="c-img">${Art.cartes[id]}</span><span class="c-leg">${leg(id)}</span></button>`).join("")}</div>
      <div class="actions"><button class="btn2" id="vider">↺ Recommencer</button><button class="cta" id="valider" disabled>Vérifier l'ordre</button></div>
      <div id="info" aria-live="polite"></div>`;
    const cases = $$(".case-t", jeu);
    function rendu() {
      cases.forEach((c, k) => {
        const id = ordre[k];
        c.innerHTML = `<span class="k">${k + 1}</span>` + (id ? `<span class="mini-c">${Art.cartes[id]}</span>` : "");
        c.classList.toggle("plein", !!id); c.classList.remove("bon", "faux");
      });
      $$(".carte-p", jeu).forEach(b => { const p = ordre.indexOf(b.dataset.id); b.classList.toggle("placee", p >= 0); b.dataset.rang = p >= 0 ? p + 1 : ""; });
      $("#valider").disabled = ordre.length < 4;
    }
    $$(".carte-p", jeu).forEach(b => b.addEventListener("click", () => {
      S.unlock();
      const p = ordre.indexOf(b.dataset.id);
      if (p >= 0) ordre.splice(p, 1); else if (ordre.length < 4) { ordre.push(b.dataset.id); S.ramasse(); }
      $("#info").innerHTML = ""; rendu();
    }));
    cases.forEach((c, k) => c.addEventListener("click", () => { if (ordre[k]) { ordre.splice(k, 1); S.tap(); rendu(); } }));
    $("#vider").onclick = () => { ordre.length = 0; S.tap(); $("#info").innerHTML = ""; rendu(); };
    $("#valider").onclick = () => {
      const juste = e.cartes.map(c => c.id);
      let bons = 0; cases.forEach((c, k) => { const ok = ordre[k] === juste[k]; c.classList.add(ok ? "bon" : "faux"); if (ok) bons++; });
      if (bons === 4) { S.ok(); Audio2.vibre([30, 40, 30]); setTimeout(() => reussite(e), 700); }
      else { S.ko(); $("#info").innerHTML = bulle(`${bons} image${bons > 1 ? "s" : ""} déjà à la bonne place (en vert). Touche une case orange pour la libérer et réessaie !`, "info"); }
    };
    rendu();
  }

  // --- Réussite d'une étape ---
  function reussite(e) {
    Store.fait(e.id, 1);
    S.fanfare(); barre();
    const reste = C.etapes.filter(x => x.jouable && !Store.faits()[x.id]);
    $("#jeu").innerHTML = `
      <div class="reussite">
        ${confettis()}
        <div class="badge-gagne">${Art.badge(e.badge.icone)}<b>${e.badge.nom}</b></div>
        <div class="dialogue">${Art.bassoul("mini joie")}${bulle(e.reussite)}</div>
        <div class="secret-carte"><small>Secret n° ${e.num} du carnet</small><p>« ${e.secret} »</p></div>
        ${reste.length ? `<button class="cta" data-go="${reste[0].num}">Étape suivante : ${reste[0].nom} →</button>` : `<button class="cta" data-go="victoire">📖 Ouvrir le carnet du gardien</button>`}
        <button class="lien" data-go="carte">← Le plan</button>
      </div>`;
    $("#zone-indice").innerHTML = ""; $("#pied").innerHTML = "";
    $("#jeu").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function confettis() {
    const c = ["#4CAF50", "#B5462F", "#2E6E8E", "#FFD54F", "#F57C4A"];
    let s = ""; for (let i = 0; i < 26; i++) s += `<i style="left:${(i * 37) % 100}%;background:${c[i % 5]};animation-delay:${(i % 7) * .12}s;animation-duration:${1.6 + (i % 5) * .25}s"></i>`;
    return `<div class="confettis" aria-hidden="true">${s}</div>`;
  }

  // ---------- 5. VICTOIRE ----------
  function victoire() {
    const f = Store.faits(), V = C.victoire;
    screen.innerHTML = `
    <section class="victoire">
      ${confettis()}
      <div class="scene">${Art.bassoul("joie")}</div>
      <h2>${f.e1 && f.e2 ? V.titre : "Le carnet du gardien"}</h2>
      <p>${V.texte}</p>
      <div class="carnet-ouvert">
        ${C.etapes.map(e => {
          const ok = e.jouable && f[e.id];
          return `<div class="page-c ${ok ? "ok" : ""}"><small>Secret ${e.num} · ${e.lieu}</small><p>${ok ? "« " + e.secret + " »" : e.jouable ? "À retrouver ici, dans la démo" : "Dans l'application complète"}</p></div>`;
        }).join("")}
      </div>
      <div class="badges">${C.etapes.filter(e => e.jouable && f[e.id]).map(e => `<div class="badge-gagne petit-b">${Art.badge(e.badge.icone)}<b>${e.badge.nom}</b></div>`).join("")}</div>
      ${bulle(V.merci, "info ok")}
      <button class="cta" data-go="projet">Le projet pour Saint-Pierre</button>
      <button class="btn2" id="rejouer">↺ Rejouer depuis le début</button>
    </section>`;
    $("#rejouer").onclick = () => { Store.reset(); S.tap(); aller("accueil"); };
  }

  // ---------- démarrage ----------
  document.addEventListener("pointerdown", () => S.unlock(), { once: true });
  const st = lireStation();
  history.replaceState({ e: ecrans[st] ? st : "projet" }, "", location.search || "?station=projet");
  aller(ecrans[st] ? st : "projet", true);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { /* hors ligne indisponible : l'aventure reste jouable */ });
})();
