/* ============================================================
   APP.JS — « Les Légendes de la Plaine » · moteur d'écrans
   Écrans : projet → accueil → intro → carte → varangue / jardin → bravo → victoire
   Adresses directes : ?station=projet|accueil|intro|carte|varangue|jardin|victoire
   ============================================================ */
(function () {
  "use strict";
  const K = window.CONTENU, A = window.Art, S = window.Audio2 ? window.Audio2.Sfx : {}, vibre = window.Audio2 ? window.Audio2.vibre : () => {};
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $("#app");
  const son = n => { try { S[n] && S[n](); } catch (e) { /* son facultatif */ } };
  const JOUABLES = ["varangue", "jardin"];
  let ecran = "projet", introI = 0, kreol = false;

  function nbPages() { const f = Store.faits(); return JOUABLES.filter(j => f[j]).length; }
  function etatEtape(id) {
    if (!JOUABLES.includes(id)) return "verrou";
    return Store.faits()[id] ? "fait" : "jouable";
  }
  function toast(t) {
    $$(".toast").forEach(e => e.remove());
    const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
    document.body.appendChild(d); setTimeout(() => d.remove(), 2800);
  }
  function fete() {
    const f = document.createElement("div"); f.className = "fete"; f.setAttribute("aria-hidden", "true");
    const cols = ["#C8423B", "#3E6B48", "#e2b04a", "#8B5E3C", "#B8C4C9"];
    let h = "";
    for (let i = 0; i < 46; i++) h += `<i style="left:${Math.random() * 100}%;width:${6 + Math.random() * 6}px;height:${8 + Math.random() * 8}px;background:${cols[i % 5]};--dx:${(Math.random() - .5) * 120}px;animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * .4}s"></i>`;
    for (let i = 0; i < 6; i++) h += `<b style="left:${10 + i * 15}%;animation-duration:${2.4 + Math.random()}s;animation-delay:${i * .12}s">📜</b>`;
    f.innerHTML = h; document.body.appendChild(f); setTimeout(() => f.remove(), 4200);
  }

  /* ---------- barre du haut ---------- */
  function topbar(titre, sous, retour) {
    const sonOn = Store.get("son");
    return `<header class="topbar">
      ${retour ? `<button class="ib" data-go="${retour}" aria-label="Retour">←</button>` : `<span style="width:4px"></span>`}
      <div class="tb-titre">${titre}${sous ? `<small>${sous}</small>` : ""}</div>
      <button class="ib" data-act="son" aria-label="${sonOn ? "Couper le son" : "Activer le son"}" aria-pressed="${sonOn ? "true" : "false"}">${sonOn ? "🔊" : "🔈"}</button>
    </header>`;
  }

  /* ---------- 1. LE PROJET (pour le décideur) ---------- */
  function vProjet() {
    const P = K.projet;
    return `<header class="topbar"><span style="width:4px"></span><div class="tb-titre">${K.lieu}<small>Proposition Atma Digital</small></div>
        <button class="tb-demo" data-go="accueil">Jouer la démo ▶</button></header>
      <main class="pj" id="contenu">
        <section class="pj-hero">
          <div class="pj-scene">${A.maison()}</div>
          <span class="pj-pour">${P.pour}</span>
          <h1>${P.titre}</h1>
          <p class="pj-sous">${P.sous}</p>
          <ul class="pj-puces">${P.puces.map(p => `<li><span aria-hidden="true">${p[0]}</span>${p[1]}</li>`).join("")}</ul>
          <button class="btn grand" data-go="accueil">▶ Essayer les 2 premières étapes</button>
        </section>
        <section class="pj-bloc"><h2><span class="num">1</span>L'idée en 30 secondes</h2>
          <ol class="pj-idee">${P.idee.map(i => `<li>${i}</li>`).join("")}</ol></section>
        <section class="pj-bloc"><h2><span class="num">2</span>Ce que le Domaine y gagne</h2>
          <div class="apports">${P.apports.map(a => `<div class="apport"><div class="ico" aria-hidden="true">${a[0]}</div><div><h3>${a[1]}</h3><p>${a[2]}</p></div></div>`).join("")}</div></section>
        <section class="pj-bloc"><h2><span class="num">3</span>Le parcours imaginé</h2>
          <ul class="parcours-l">${P.parcours.map((p, i) => `<li class="${p[2] ? "jouable" : ""}"><b>${i + 1}</b><span><strong>${p[0]}</strong><br><span class="small">${p[1]}</span></span><span class="tg">${p[2] ? "jouable ici" : "appli complète"}</span></li>`).join("")}</ul>
          <p class="note">À la fin : le diplôme « Gardien des Légendes » au prénom de l'enfant.</p></section>
        <section class="pj-bloc scolaire"><h2><span class="num">4</span>${P.scolaire.titre}</h2>
          <p>${P.scolaire.texte}</p><ul class="coches">${P.scolaire.points.map(p => `<li>${p}</li>`).join("")}</ul></section>
        <section class="pj-bloc jonathan"><h2><span class="num">5</span>Un lancement en personnage</h2>
          <p>${P.jonathan}</p></section>
        <section class="pj-bloc sources"><h2><span class="num">6</span>D'où viennent les contenus</h2>
          <h3><span class="etiq verif">Vérifié</span> d'après vos documents publics</h3>
          <ul>${P.verifies.map(v => `<li>${v[0]} <span class="src-l">— ${v[1]}</span></li>`).join("")}</ul>
          <h3><span class="etiq coecrit">Exemple</span> contenu à co-écrire avec vous</h3>
          <ul>${P.acoecrire.map(v => `<li>${v}</li>`).join("")}</ul>
          <p class="note">Sources consultées le 27/11/2026 :<br>${P.sources.map(s => `<span class="src-l">${s}</span>`).join("<br>")}</p></section>
        <div class="signature"><b>Jonathan Bou — Atma Digital</b>
          <span class="small">Aventures immersives à jouer sur téléphone · La Réunion</span><br>
          <span class="small">aurelie.jonathanb@gmail.com</span><br>
          <button class="btn vert" data-go="accueil">▶ Jouer la démo</button></div>
      </main>`;
  }

  /* ---------- 2. ACCUEIL ---------- */
  function vAccueil() {
    return `${topbar("", "", "projet")}
      <main class="accueil" id="contenu">
        <div class="acc-scene">${A.maison()}</div>
        <div class="acc-bas">
          <div class="qui"><div class="avatar">${A.tibwa({ humeur: "malice" })}</div>
            <div class="bulle"><span class="tb">Ti Bwa</span><span id="phrase-acc">${kreol ? K.accueil.kreol : K.accueil.phrase}</span></div></div>
          <div class="acc-titre"><span class="lieu-nom">${K.lieu}</span><h1>${K.titre}</h1>
            <p>Une aventure pour les familles, à partir de 6 ans · 4 étapes dans le Domaine</p></div>
          <div class="pile">
            <button class="btn grand" data-act="commencer">Commencer l'aventure</button>
            <button class="btn sec grand" data-act="kreol" aria-pressed="${kreol}">${kreol ? "🇫🇷 Lire en français" : "🗣️ Écouter en créole"}</button>
          </div>
          <div class="encart-voix">🎙️ Dans l'application complète, Ti Bwa parle avec une vraie voix enregistrée, en français et en créole.</div>
        </div>
      </main>`;
  }

  /* ---------- 3. INTRO ---------- */
  function vIntro() {
    const t = K.intro[introI], der = introI === K.intro.length - 1;
    return `${topbar(K.titre, "Rencontre avec Ti Bwa", "accueil")}
      <main class="intro" id="contenu">
        <button class="grand-perso" data-act="sauter" aria-label="Toucher Ti Bwa">${A.tibwa({ humeur: introI === 1 ? "malice" : "joie" })}</button>
        <p class="astuce-tap">Touche Ti Bwa !</p>
        <div class="bulle haut"><span class="tb">Ti Bwa</span>${t}</div>
        <div class="points" aria-label="Bulle ${introI + 1} sur ${K.intro.length}">${K.intro.map((_, i) => `<i class="${i === introI ? "on" : ""}"></i>`).join("")}</div>
        <button class="btn grand" data-act="intro-suite">${der ? "🗺️ Voir la carte du Domaine" : "Suite →"}</button>
      </main>`;
  }

  /* ---------- 4. CARTE ---------- */
  function vCarte() {
    const n = nbPages(), ids = ["varangue", "jardin", "salon", "boutique"], etat = {};
    ids.forEach(i => etat[i] = etatEtape(i));
    return `${topbar(K.titre, K.lieu, "accueil")}
      <main class="carte-ecran" id="contenu">
        <div class="livre-tete"><h1>Le livre de Ti Bwa</h1>
          <div class="pages" aria-label="${n} pages retrouvées sur 4">${[0, 1, 2, 3].map(i => `<span class="${i < n ? "on" : ""}" aria-hidden="true">${i < n ? "📜" : ""}</span>`).join("")}</div></div>
        <div class="carte-svg">${A.carte(etat)}</div>
        <div class="etapes">${ids.map(id => {
          const E = K.etapes[id], e = etat[id];
          const tag = e === "fait" ? "✓ page retrouvée" : e === "jouable" ? "à jouer" : "🔒 dans l'application complète";
          return `<button class="etape-c ${e}" data-etape="${id}"><span class="n">${e === "fait" ? "✓" : E.n}</span>
            <span class="t"><strong>${E.titre}</strong><span>${E.court}</span><span class="tag">${tag}</span></span>
            <span class="go" aria-hidden="true">${e === "verrou" ? "" : "›"}</span></button>`;
        }).join("")}</div>
        ${n >= 2 ? `<div class="pile"><button class="btn grand vert" data-go="victoire">📖 Voir mon livre</button></div>` : ""}
        <p class="legende-carte">Plan stylisé d'après le plan du dépliant · sur place, un QR code à chaque étape ouvre l'énigme directement.</p>
      </main>`;
  }

  /* ---------- 5a. ÉTAPE 1 : cadenas ---------- */
  let code = [0, 0, 0, 0], ind1 = 0, rate1 = 0;
  function vVarangue() {
    const E = K.etapes.varangue;
    return `${topbar("Étape 1 sur 4", K.lieu, "carte")}
      <main class="etape" id="contenu">
        <div class="etape-tete"><span class="lieu">${E.lieu}</span><h1>${E.titre}</h1></div>
        <div class="qui mission"><div class="avatar">${A.tibwa({ humeur: "malice" })}</div><div class="bulle"><span class="tb">Ti Bwa</span>${E.mission}</div></div>
        <div class="panneau" role="note"><div class="pt">${E.panneau[0]}</div><p>${E.panneau[1]}</p><span class="ex">exemple de panneau · sur place, on lit le vrai</span></div>
        <div class="cadenas" id="cadenas"><div class="anse"></div><div class="corps">
          <div class="roues">${code.map((v, i) => `<div class="roue"><button data-roue="${i}" data-d="1" aria-label="Chiffre ${i + 1} plus">▲</button>
            <output id="r${i}" aria-live="polite" aria-label="Chiffre ${i + 1}">${v}</output>
            <button data-roue="${i}" data-d="-1" aria-label="Chiffre ${i + 1} moins">▼</button></div>`).join("")}</div>
          <div class="trou"></div></div></div>
        <p class="jeu-etat" id="etat1" aria-live="polite"></p>
        <div class="pile"><button class="btn grand" data-act="ouvrir">🔓 Ouvrir le livre</button>
          <button class="btn sec grand" data-act="indice1">💡 Un indice de Ti Bwa</button></div>
        <div class="indices" id="indices1">${E.indices.slice(0, ind1).map((t, i) => `<div class="indice"><b>Indice ${i + 1} :</b> ${t}</div>`).join("")}</div>
        <button class="btn sec mini demo-solve" data-act="solve1">Mode démo : afficher la solution</button>
      </main>`;
  }
  function tourne(i, d) {
    code[i] = (code[i] + d + 10) % 10; const o = $("#r" + i); if (!o) return;
    o.textContent = code[i]; o.classList.remove("tourne"); void o.offsetWidth; o.classList.add("tourne"); son("tap");
  }
  function ouvrir() {
    const E = K.etapes.varangue, cad = $("#cadenas"), et = $("#etat1");
    if (code.join("") === E.code) {
      cad.classList.add("ouvert"); son("ok"); vibre([40, 40, 80]); et.className = "jeu-etat"; et.textContent = "Clic ! Le cadenas s'ouvre…";
      Store.fait("varangue", Math.max(1, 3 - ind1 - (rate1 > 2 ? 1 : 0)));
      setTimeout(() => aller("bravo-varangue"), 900);
    } else {
      rate1++; cad.classList.remove("secoue"); void cad.offsetWidth; cad.classList.add("secoue"); son("ko"); vibre(60);
      et.className = "jeu-etat oups"; et.textContent = E.essai;
      if (rate1 === 2 && ind1 === 0) toast("Ti Bwa chuchote : un indice t'attend juste en dessous 💡");
    }
  }

  /* ---------- 5b. ÉTAPE 2 : plantes (glisser-déposer + toucher) ---------- */
  let place = {}, choisie = null, rate2 = 0;
  function vJardin() {
    const E = K.etapes.jardin;
    return `${topbar("Étape 2 sur 4", K.lieu, "carte")}
      <main class="etape" id="contenu">
        <div class="etape-tete"><span class="lieu">${E.lieu}</span><h1>${E.titre}</h1></div>
        <div class="qui mission"><div class="avatar">${A.tibwa()}</div><div class="bulle"><span class="tb">Ti Bwa</span>${E.mission}</div></div>
        <p class="small" style="text-align:center">Glisse chaque plante sur son usage d'autrefois (ou touche la plante, puis l'usage).</p>
        <div class="plantes-jeu">
          <div class="cartes-p" id="cartes-p">${E.plantes.map(p => `<div class="carte-p ${place[p.id] ? "place" : ""}" data-plante="${p.id}" role="button" tabindex="0" aria-label="${p.nom}">${A.plantes[p.id]}${p.nom}<small>${p.etiq}</small></div>`).join("")}</div>
          <div class="zones">${E.usages.map(u => {
            const pid = Object.keys(place).find(k => place[k] === u.id);
            return `<div class="zone ${pid ? "ok" : ""}" data-zone="${u.id}" role="button" tabindex="0" aria-label="Usage : ${u.nom}"><div class="zi" aria-hidden="true">${pid ? "" : u.ico}</div>
              <div class="zt"><b>${u.nom}</b><span>${u.txt}</span></div><div class="zp">${pid ? A.plantes[pid] : ""}</div></div>`;
          }).join("")}</div>
        </div>
        <p class="jeu-etat" id="etat2" aria-live="polite"></p>
        <div class="encart"><h3>🔎 Sur place</h3><ul><li>Chaque plante du jardin a son étiquette : c'est elle qui donne la réponse.</li><li>Les 3 plantes de la démo sont un exemple, à choisir avec l'équipe du Domaine.</li></ul></div>
        <button class="btn sec mini demo-solve" data-act="solve2">Mode démo : afficher la solution</button>
      </main>`;
  }
  function poser(pid, zid) {
    const E = K.etapes.jardin, p = E.plantes.find(x => x.id === pid), z = $(`[data-zone="${zid}"]`), et = $("#etat2");
    if (!p || !z || place[pid]) return false;
    if (p.usage === zid) {
      place[pid] = zid; son("ramasse"); vibre(30);
      if (Object.keys(place).length === E.plantes.length) {
        son("ok"); Store.fait("jardin", rate2 === 0 ? 3 : rate2 < 3 ? 2 : 1);
        rendre(); const e2 = $("#etat2"); if (e2) e2.textContent = "Tout le jardin est rangé !";
        setTimeout(() => aller("bravo-jardin"), 900);
      } else { rendre(); const e2 = $("#etat2"); if (e2) { e2.className = "jeu-etat"; e2.textContent = "Kler ! " + p.nom + " : bien vu."; } }
      return true;
    }
    rate2++; z.classList.remove("non"); void z.offsetWidth; z.classList.add("non"); son("ko"); vibre(60);
    et.className = "jeu-etat oups"; et.textContent = E.essai; return false;
  }
  function brancherGlisser() {
    $$(".carte-p").forEach(c => {
      if (c.classList.contains("place")) return;
      let x0, y0, bouge = false, id = null;
      c.addEventListener("pointerdown", ev => {
        id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; bouge = false;
        try { c.setPointerCapture(id); } catch (e) { /* ancien navigateur */ }
      });
      c.addEventListener("pointermove", ev => {
        if (id !== ev.pointerId) return;
        const dx = ev.clientX - x0, dy = ev.clientY - y0;
        if (!bouge && Math.hypot(dx, dy) > 8) { bouge = true; c.classList.add("tenu"); son("tap"); }
        if (!bouge) return;
        c.style.transform = `translate(${dx}px,${dy}px) scale(1.06)`;
        const z = zoneSous(ev.clientX, ev.clientY);
        $$(".zone").forEach(q => q.classList.toggle("proche", q === z));
      });
      const fin = ev => {
        if (id !== ev.pointerId) return; id = null;
        $$(".zone").forEach(q => q.classList.remove("proche"));
        if (!bouge) { choisir(c.dataset.plante); return; }
        c.classList.remove("tenu");
        const z = zoneSous(ev.clientX, ev.clientY);
        if (z && poser(c.dataset.plante, z.dataset.zone)) return;
        c.classList.add("revient"); c.style.transform = "";
        setTimeout(() => c.classList.remove("revient"), 400);
      };
      c.addEventListener("pointerup", fin); c.addEventListener("pointercancel", fin);
      c.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); choisir(c.dataset.plante); } });
    });
  }
  function zoneSous(x, y) { return $$(".zone").find(z => { const b = z.getBoundingClientRect(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; }) || null; }
  function choisir(pid) {
    choisie = choisie === pid ? null : pid; son("tap");
    $$(".carte-p").forEach(c => c.classList.toggle("choisie", c.dataset.plante === choisie));
    const et = $("#etat2"); if (et && choisie) { et.className = "jeu-etat"; et.textContent = "Et maintenant, touche son usage 👇"; }
  }

  /* ---------- 6. BRAVO (page gagnée) ---------- */
  function vBravo(id) {
    const E = K.etapes[id], n = nbPages(), et = Store.get("etoiles")[id] || 1;
    return `${topbar("Page retrouvée !", E.titre, "carte")}
      <main class="etape resultat" id="contenu">
        <div class="avatar" style="width:130px;margin:0 auto">${A.tibwa({ humeur: "bravo" })}</div>
        <div class="etoiles" aria-label="${et} étoiles sur 3">${[1, 2, 3].map(i => `<span class="et ${i <= et ? "" : "off"}" style="animation-delay:${i * .15}s">⭐</span>`).join("")}</div>
        <h2>${E.bravo}</h2>
        <div class="page-gagnee"><span class="num-p">Page ${E.n} sur 4</span><p>${E.page}</p></div>
        <div class="savais"><h3>💡 ${E.savais[0]}</h3><p>${E.savais[1]}</p><span class="src">Source : ${E.savais[2]}</span></div>
        <div class="pile">${n >= 2 ? `<button class="btn grand vert" data-go="victoire">📖 Ouvrir le livre de Ti Bwa</button>` : `<button class="btn grand" data-go="carte">🗺️ Vers la page suivante</button>`}</div>
      </main>`;
  }

  /* ---------- 7. VICTOIRE ---------- */
  function vVictoire() {
    const n = nbPages(), V = K.victoire, prenom = Store.get("prenom") || "", avis = Store.get("avis");
    return `${topbar(K.titre, "Le livre de Ti Bwa", "carte")}
      <main class="victoire" id="contenu">
        ${A.livre(n)}
        <h1>${n >= 2 ? V.titre : n + " page sur 4"}</h1>
        <div class="qui"><div class="avatar">${A.tibwa({ humeur: "bravo" })}</div><div class="bulle"><span class="tb">Ti Bwa</span>${V.texte}</div></div>
        <div class="diplome" aria-label="Aperçu du diplôme">
          <p class="d-titre">Diplôme de ${V.diplome}</p>
          <span class="small">décerné à</span>
          <div class="d-nom" id="d-nom">${prenom || "…"}</div>
          <span class="d-apercu">Aperçu · remis avec les 4 pages dans l'application complète</span>
          ${A.sceau()}
        </div>
        <form class="prenom" data-form="prenom"><input id="in-prenom" type="text" maxlength="24" autocomplete="given-name" placeholder="Ton prénom" aria-label="Ton prénom" value="${prenom.replace(/"/g, "&quot;")}"><button class="btn mini vert" type="submit">OK</button></form>
        <p style="margin-top:16px;font-weight:700">Tu as aimé l'aventure ?</p>
        <div class="avis">${["😍", "🙂", "🤔"].map(e => `<button data-avis="${e}" aria-pressed="${avis === e}" aria-label="Avis ${e}">${e}</button>`).join("")}</div>
        <div class="pile">
          <button class="btn grand" data-go="projet">Découvrir le projet complet</button>
          <button class="btn sec grand" data-act="rejouer">↺ Rejouer depuis le début</button>
        </div>
      </main>`;
  }

  /* ---------- routeur ---------- */
  const VUES = { projet: vProjet, accueil: vAccueil, intro: vIntro, carte: vCarte, varangue: vVarangue, jardin: vJardin, victoire: vVictoire };
  function rendre() {
    const v = ecran.startsWith("bravo-") ? () => vBravo(ecran.slice(6)) : VUES[ecran] || vProjet;
    document.body.dataset.ecran = ecran.startsWith("bravo-") ? "bravo" : ecran;
    app.innerHTML = v();
    if (ecran === "jardin") brancherGlisser();
  }
  function aller(e, garder) {
    if (e === "varangue") { code = [0, 0, 0, 0]; ind1 = 0; rate1 = 0; }
    if (e === "jardin") { place = {}; choisie = null; rate2 = 0; }
    if (e === "intro" && !garder) introI = 0;
    ecran = e; rendre(); window.scrollTo(0, 0); son("page");
    try { history.replaceState(null, "", "?station=" + e); } catch (er) { /* fichier local */ }
    if (e.startsWith("bravo-")) setTimeout(fete, 150);
    if (e === "victoire") setTimeout(() => { fete(); son("fanfare"); }, 250);
    const h = $("h1, h2"); if (h) { h.setAttribute("tabindex", "-1"); }
  }

  document.addEventListener("click", ev => {
    const t = ev.target.closest("[data-go],[data-act],[data-etape],[data-roue],[data-zone],[data-avis]");
    if (!t) return;
    son("unlock");
    if (t.dataset.go) return aller(t.dataset.go);
    if (t.dataset.etape) {
      const e = etatEtape(t.dataset.etape);
      if (e === "verrou") { son("doux"); return toast("🔒 « " + K.etapes[t.dataset.etape].titre + " » se joue dans l'application complète."); }
      return aller(t.dataset.etape);
    }
    if (t.dataset.roue) return tourne(+t.dataset.roue, +t.dataset.d);
    if (t.dataset.zone) {
      if (choisie) { const p = choisie; choisie = null; $$(".carte-p").forEach(c => c.classList.remove("choisie")); poser(p, t.dataset.zone); }
      else { const et = $("#etat2"); if (et) { et.className = "jeu-etat"; et.textContent = "Choisis d'abord une plante 🌿"; } }
      return;
    }
    if (t.dataset.avis) { Store.set("avis", t.dataset.avis); $$(".avis button").forEach(b => b.setAttribute("aria-pressed", b === t)); son("ok"); return toast("Merci ! Ti Bwa garde ton avis précieusement."); }
    const a = t.dataset.act;
    if (a === "son") { Store.set("son", !Store.get("son")); rendre(); return; }
    if (a === "commencer") return aller("intro");
    if (a === "kreol") {
      kreol = !kreol; rendre(); son("bulle");
      if (kreol) toast("🎙️ Démo : texte en créole. La voix enregistrée vient avec l'application complète.");
      return;
    }
    if (a === "sauter") { const g = $(".grand-perso"); g.classList.remove("saute"); void g.offsetWidth; g.classList.add("saute"); son("bulle"); vibre(20); return; }
    if (a === "intro-suite") { if (introI < K.intro.length - 1) { introI++; rendre(); son("page"); return; } return aller("carte"); }
    if (a === "ouvrir") return ouvrir();
    if (a === "indice1") {
      const E = K.etapes.varangue;
      if (ind1 < E.indices.length) { ind1++; son("indice"); $("#indices1").innerHTML = E.indices.slice(0, ind1).map((x, i) => `<div class="indice"><b>Indice ${i + 1} :</b> ${x}</div>`).join(""); }
      else toast("Tu as tous les indices : regarde bien le panneau 😉");
      return;
    }
    if (a === "solve1") { code = K.etapes.varangue.code.split("").map(Number); code.forEach((v, i) => { const o = $("#r" + i); if (o) o.textContent = v; }); return toast("Code affiché : appuie sur « Ouvrir le livre »."); }
    if (a === "solve2") { K.etapes.jardin.plantes.forEach(p => { if (!place[p.id]) poser(p.id, p.usage); }); return; }
    if (a === "rejouer") { Store.reset(); kreol = false; return aller("accueil"); }
  });
  document.addEventListener("submit", ev => {
    if (!ev.target.matches("[data-form=prenom]")) return;
    ev.preventDefault(); const v = $("#in-prenom").value.trim().slice(0, 24);
    Store.set("prenom", v); $("#d-nom").textContent = v || "…"; son("ok"); toast(v ? "Bravo " + v + " !" : "Prénom effacé");
  });
  document.addEventListener("keydown", ev => {
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches(".zone")) { ev.preventDefault(); ev.target.click(); }
  });

  /* démarrage : ?station=… ou écran projet */
  const st = new URLSearchParams(location.search).get("station");
  const ok = Object.keys(VUES).concat(["bravo-varangue", "bravo-jardin"]);
  ecran = ok.includes(st) ? st : "projet";
  rendre();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { /* hors ligne facultatif */ }));
  }
})();
