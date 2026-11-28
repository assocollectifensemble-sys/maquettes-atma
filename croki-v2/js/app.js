/* ============================================================
   APP.JS — Croki v2 « pilote » : écrans, parcours, fête finale
   ------------------------------------------------------------
   Navigation : un seul écran à la fois, rendu dans #ecran.
   Retour Android : History API (une entrée « garde » ; le bouton
   retour ferme d'abord la fenêtre ouverte, puis remonte d'un niveau).
   Sauvegarde : localStorage (Store) après chaque étape → reprise.
   ============================================================ */

(() => {
  "use strict";

  const PARAMS = new URLSearchParams(location.search);
  const DEMO = PARAMS.get("demo") === "1";
  const S = CONFIG.stages;
  const MOT = CONFIG.motCible;
  const jouables = () => S.filter(CONFIG.estJouable);

  // ---------------- État de la partie ----------------
  const NEUVE = () => ({ v: 2, mode: null, faits: [], mots: [], offerts: false, etape: null, phase: null, finale: null, prenom: "", debut: Date.now() });
  let P = Store.partie() || null;
  let R = Store.reglages();
  Sons.actif = R.son !== false;

  let ecranCourant = "accueil", arreterJeu = null, overlayOuvert = null, ignorerPop = 0;
  const ecran = document.getElementById("ecran");
  const topbar = document.getElementById("topbar");
  const overlay = document.getElementById("overlay");

  function sauver() { if (P) Store.sauverPartie(P); }
  const stage = id => S.find(s => s.id === id);
  const prochaine = () => jouables().find(s => !P.faits.includes(s.id)) || null;
  const lettresAcquises = () => S.map(s => P.faits.includes(s.id) || (P.offerts && !CONFIG.estJouable(s)));
  const nbAcquises = () => lettresAcquises().filter(Boolean).length;

  // ---------------- Outils d'affichage ----------------
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // **mot** → mot doré (message caché)
  const dore = (t, id) => esc(t).replace(/\*\*(.+?)\*\*/g, (_, m) => `<button type="button" class="mot-dore" data-mot="${id || ""}">${m}</button>`);
  const sansGras = t => t.replace(/\*\*/g, "");

  function bulle(texte, cleVoix, { image = "croki-accueil-salut", classe = "", html = null } = {}) {
    const voix = cleVoix && Sons.voixDispo(cleVoix)
      ? `<button class="btn-voix" type="button" data-voix="${cleVoix}" aria-label="Réécouter Croki">🔊</button>` : "";
    return `<div class="croki-dit ${classe}">
      <img class="croki-portrait" src="assets/img/${image}.webp" alt="Croki">
      <div class="bulle-croki"><p>${html || esc(texte)}</p>${voix}</div>
    </div>`;
  }

  function toast(texte, ms = 2400) {
    const t = document.getElementById("toast");
    t.textContent = texte; t.classList.add("on");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), ms);
  }

  function confettis(n = 40) {
    if (reduireAnim()) return;
    const box = document.getElementById("confettis");
    const couleurs = ["#ff5d73", "#ffb627", "#3ec1d3", "#7bd389", "#b28dff", "#ff8c42"];
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = couleurs[i % couleurs.length];
      c.style.animationDelay = Math.random() * 0.5 + "s";
      c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      c.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      c.style.setProperty("--dx", (Math.random() * 120 - 60) + "px");
      box.appendChild(c);
      setTimeout(() => c.remove(), 3600);
    }
  }

  // ---------------- Barre du haut ----------------
  function barre(visible) {
    if (!visible) { topbar.hidden = true; return; }
    topbar.hidden = false;
    const acq = lettresAcquises();
    topbar.innerHTML = `
      <button class="ico-btn" type="button" data-act="parcours" aria-label="Mon parcours">🧭</button>
      <div class="mini-lettres" aria-label="Lettres gagnées : ${nbAcquises()} sur 7">
        ${MOT.split("").map((L, i) => `<span class="${acq[i] ? "on" : ""}">${acq[i] ? L : ""}</span>`).join("")}
      </div>
      <button class="ico-btn" type="button" data-act="plan" aria-label="Voir le plan du parc">🗺️</button>
      <button class="ico-btn" type="button" data-act="carnet" aria-label="Carnet de Croki">📒</button>`;
  }

  // ---------------- Navigation ----------------
  const PARENTS = {
    video: "accueil", joueurs: "accueil", parcours: "accueil",
    route: "parcours", intro: "parcours", question: "parcours", defi: "parcours", recompense: "parcours",
    offertes: "parcours", enigme: "parcours", fete: "parcours", photo: "fete", diplome: "fete", secret: "fete", merci: "fete"
  };

  function nettoyer() {
    if (arreterJeu) { try { arreterJeu(); } catch (e) {} arreterJeu = null; }
    Capteurs.toutArreter();
    Sons.arreterVoix();
    $$("video", ecran).forEach(v => { try { v.pause(); } catch (e) {} });
  }

  // Quand un jeu change de phase (viseur, bassin, tam-tams…), on le remonte
  // pour que la commande principale reste sous le pouce, sans faire défiler à la main.
  function garderEnVue(zone) {
    let t = null;
    const obs = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!zone.isConnected) { obs.disconnect(); return; }
        const r = zone.getBoundingClientRect();
        if (r.bottom > window.innerHeight - 8 && r.top > 80) zone.scrollIntoView({ behavior: reduireAnim() ? "auto" : "smooth", block: "start" });
      }, 60);
    });
    obs.observe(zone, { childList: true });
  }

  function aller(nom, arg) {
    nettoyer();
    ecranCourant = nom;
    ecran.className = "ecran ecran-" + nom;
    ecran.scrollTop = 0; window.scrollTo(0, 0);
    ECRANS[nom](arg);
    ecran.classList.remove("entre"); void ecran.offsetWidth; ecran.classList.add("entre");
    const titre = $("h1, h2", ecran);
    if (titre) { titre.setAttribute("tabindex", "-1"); titre.focus({ preventScroll: true }); }
    // Voix enregistrée de l'écran (si fichier présent)
    const v = $("[data-voix]", ecran);
    if (v && Sons.actif) Sons.dire(v.dataset.voix);
  }

  // Une entrée « garde » dans l'historique : le retour Android revient à l'appli
  function armerRetour() {
    try {
      history.replaceState({ croki: "base" }, "");
      history.pushState({ croki: "app" }, "");
    } catch (e) {}
  }
  // Fermer une fenêtre par ✕ : on dépile son entrée d'historique sans remonter d'écran
  function retirerEntreeOverlay() { ignorerPop++; history.back(); }
  window.addEventListener("popstate", () => {
    if (ignorerPop) { ignorerPop--; return; }
    if (overlayOuvert) { fermerOverlay(true); history.pushState({ croki: "app" }, ""); return; }
    const parent = PARENTS[ecranCourant];
    if (!parent) return; // accueil : le prochain retour quitte l'appli
    history.pushState({ croki: "app" }, "");
    if (["intro", "question", "defi"].includes(ecranCourant) && P) { P.phase = "route"; sauver(); }
    if (parent === "accueil") aller("accueil");
    else if (parent === "parcours" && P && P.mode) aller("parcours");
    else aller(parent);
  });

  // ---------------- Fenêtres (plan, carnet, parc, réglages) ----------------
  function ouvrirOverlay(nom) {
    overlayOuvert = nom;
    overlay.innerHTML = `<div class="feuille" role="dialog" aria-modal="true" aria-label="${esc(nom)}">
      <button class="fermer" type="button" data-act="fermer" aria-label="Fermer">✕</button>
      <div class="feuille-corps">${OVERLAYS[nom]()}</div></div>`;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("on"));
    $(".fermer", overlay).focus({ preventScroll: true });
    if (OVERLAYS[nom].apres) OVERLAYS[nom].apres();
  }
  function fermerOverlay(depuisRetour) {
    if (!overlayOuvert) return;
    overlayOuvert = null;
    overlay.classList.remove("on");
    setTimeout(() => { if (!overlayOuvert) { overlay.hidden = true; overlay.innerHTML = ""; } }, 220);
  }

  const OVERLAYS = {
    plan() {
      const s = P && P.etape ? stage(P.etape) : null;
      return `<h2>🗺️ Le plan du parc</h2>
        <p class="sous">${s ? `Prochain panneau : <b>n°${s.num} · ${esc(s.court)}</b>` : "Suis les panneaux numérotés de 1 à 7."}</p>
        <div class="plan-zoom" data-zoom="1"><img src="assets/img/plan-parc.webp" alt="Plan du Croc Parc avec les panneaux numérotés de 1 à 7"></div>
        <div class="rangee-centre"><button class="btn btn-doux petit" type="button" data-act="zoom">🔍 Agrandir / réduire</button></div>`;
    },
    carnet() {
      const c = Store.carnet();
      return `<h2>📒 Le carnet de Croki</h2>
        <p class="sous">Tes photos et tes stickers restent dans ce téléphone.</p>
        <div class="carnet-grille">${S.map(s => {
          const v = c[s.id] || Store.vignette(s.id);
          const ouvert = CONFIG.estJouable(s);
          return `<figure class="sticker ${v ? "colle" : ""} ${ouvert ? "" : "verrou"}">
            ${v ? `<img src="${v.img}" alt="${esc(v.legende)}">` : `<div class="sticker-vide">${ouvert ? s.emoji : "🔒"}</div>`}
            <figcaption>${v ? esc(v.legende) : `n°${s.num} · ${esc(s.court)}`}</figcaption></figure>`;
        }).join("")}</div>`;
    },
    parc() {
      const barres = [["Crocodiles", 6.2, 2.1], ["Paons", 4.8, 1.6], ["Makis catta", 5.6, 2.4], ["Oies", 4.1, 1.3]];
      return `<h2>🌴 Pour le parc</h2>
        <p class="sous">Ce que Croki v2 apporte à Croc Parc</p>
        <ul class="atouts">
          <li><b>⏱️ Plus de temps devant les enclos.</b> Chaque défi se joue face à l'animal : les familles observent, cherchent, comptent.</li>
          <li><b>👨‍👩‍👧 Des familles actives ensemble.</b> Le grand tient le téléphone, le petit fait le geste : tout le monde joue.</li>
          <li><b>📸 Un souvenir photo qui voyage.</b> La photo de fête aux couleurs de Croki circule chez les proches : une belle visibilité pour le parc.</li>
          <li><b>🔒 Des données qui restent chez le visiteur.</b> Photos et sons restent sur le téléphone.</li>
        </ul>
        <div class="tableau-bord">
          <div class="tb-tete"><b>Aperçu du tableau de bord</b><span class="etiquette-fictive">données fictives</span></div>
          <div class="tb-kpis">
            <div><b>1 240</b><span>familles / mois</span></div>
            <div><b>78 %</b><span>parcours finis</span></div>
            <div><b>9 min</b><span>de défis / visite</span></div>
          </div>
          <p class="tb-legende">Minutes passées devant chaque enclos (v2 / v1)</p>
          ${barres.map(([n, v2, v1]) => `<div class="tb-ligne"><span>${n}</span><div class="tb-barres"><i class="v2" style="width:${v2 * 14}%"></i><i class="v1" style="width:${v1 * 14}%"></i></div><em>${String(v2).replace(".", ",")}</em></div>`).join("")}
          <p class="tb-note">Exemple de présentation : chiffres inventés pour la maquette.</p>
        </div>`;
    },
    reglages() {
      return `<h2>⚙️ Réglages</h2>
        <div class="ligne-reglage"><span>Sons du jeu</span><button class="interrupteur ${Sons.actif ? "on" : ""}" type="button" data-act="son" aria-pressed="${Sons.actif}"><i></i></button></div>
        <div class="pile-boutons">
          <button class="btn btn-doux" type="button" data-act="parc">🌴 Pour le parc</button>
          <button class="btn btn-doux" type="button" data-act="recommencer">🔄 Recommencer l'aventure</button>
        </div>
        <p class="petite-note">Version ${esc(CONFIG.version)}${DEMO ? " · mode démo" : ""}</p>`;
    }
  };
  OVERLAYS.plan.apres = () => {};

  // ---------------- Écrans ----------------
  const ECRANS = {

    accueil() {
      barre(false);
      const enCours = P && P.mode && (P.faits.length || P.etape);
      ecran.innerHTML = `
        <div class="accueil">
          <div class="accueil-badge">✨ Nouvelle aventure</div>
          <h1 class="titre-geant"><span>Croki</span> revient !</h1>
          <div class="accueil-scene">
            <div class="soleil" aria-hidden="true"></div>
            <img class="accueil-croki" src="assets/img/croki-splash.webp" alt="Croki le crocodile salue">
            <div class="accueil-pastilles" aria-hidden="true"><span>📷</span><span>🥁</span><span>🎤</span><span>📱</span></div>
          </div>
          ${bulle(CONFIG.textes.accueil, "accueil_v2", { image: "croki-accueil-salut", classe: "compact" })}
          <div class="pile-boutons">
            ${enCours ? `<button class="btn btn-principal" type="button" data-act="reprendre">▶️ Continuer là où tu t'étais arrêté</button>
                         <button class="btn btn-doux" type="button" data-act="nouvelle">✨ Nouvelle partie</button>`
                      : `<button class="btn btn-principal btn-geant" type="button" data-act="partir">C'est parti !</button>`}
          </div>
          <div class="accueil-pied">
            <button class="lien-discret" type="button" data-act="parc">🌴 Pour le parc</button>
            <button class="lien-discret" type="button" data-act="reglages">⚙️ Réglages</button>
          </div>
          ${DEMO ? `<div class="badge-demo">Mode démo</div>` : ""}
        </div>`;
    },

    video() {
      barre(false);
      ecran.innerHTML = `
        <div class="video-plein">
          <video src="assets/video/intro.mp4" playsinline autoplay preload="auto"></video>
          <button class="btn btn-doux passer" type="button" data-act="apres-video">Passer ⏭</button>
        </div>`;
      const v = $("video", ecran);
      const suite = () => { if (ecranCourant === "video") aller("joueurs"); };
      v.addEventListener("ended", suite);
      v.addEventListener("error", suite);
      const p = v.play();
      if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(suite); });
    },

    joueurs() {
      barre(false);
      ecran.innerHTML = `
        <div class="carte-centre">
          ${bulle(CONFIG.textes.choixJoueurs, "choix_joueurs", { image: "croki-hesite" })}
          <div class="choix-mode">
            <button class="mode-carte" type="button" data-mode="famille">
              <span class="mode-ico">👨‍👩‍👧</span><b>En famille</b><small>Le grand tient le téléphone, le petit fait le geste. Chacun son tour !</small>
            </button>
            <button class="mode-carte" type="button" data-mode="solo">
              <span class="mode-ico">🧒</span><b>Super Marmaille solo</b><small>Un enfant joue, un grand l'accompagne.</small>
            </button>
          </div>
        </div>`;
    },

    parcours() {
      barre(true);
      const suiv = prochaine();
      const gagnes = new Set(P.faits.concat(P.offerts ? S.filter(s => !CONFIG.estJouable(s)).map(s => s.id) : []));
      const acq = lettresAcquises(); acq.nouveau = -1;
      let cta;
      if (suiv) {
        cta = `<div class="carte-suivante" style="--c:${suiv.couleur}">
            <div class="cs-num">${suiv.num}</div>
            <div class="cs-texte"><small>Prochain panneau</small><b>${suiv.emoji} ${esc(suiv.nom)}</b><span>${esc(suiv.defi.titre)} · ${esc(suiv.defi.accroche)}</span></div>
          </div>
          <div class="pile-boutons">
            ${DEMO ? `<button class="btn btn-principal" type="button" data-act="arrive" data-id="${suiv.id}">✅ Je suis arrivé(e) devant le panneau</button>
                      <button class="btn btn-doux" type="button" data-act="route" data-id="${suiv.id}">🗺️ Voir le chemin</button>`
                   : `<button class="btn btn-principal" type="button" data-act="route" data-id="${suiv.id}">🚶 En route vers le panneau n°${suiv.num}</button>`}
          </div>`;
      } else if (!P.finale) {
        cta = `<div class="pile-boutons"><button class="btn btn-principal btn-geant" type="button" data-act="vers-fete">🎉 Préparer la fête !</button></div>`;
      } else {
        cta = `<div class="pile-boutons"><button class="btn btn-principal" type="button" data-act="reprendre-fete">🎉 Retourner à la fête</button></div>`;
      }
      const c = Store.carnet();
      ecran.innerHTML = `
        <div class="titre-bloc"><h1>La fête surprise de Croki</h1><p>${nbAcquises()} / 7 décorations · ${P.mode === "famille" ? "👨‍👩‍👧 En famille" : "🧒 Solo"}${DEMO ? " · démo" : ""}</p></div>
        <div class="cadre-fete">${Art.fete(gagnes, null, acq)}</div>
        ${cta}
        <h2 class="titre-section">Mon parcours</h2>
        <ol class="sentier">${S.map(s => {
          const fait = P.faits.includes(s.id), ouvert = CONFIG.estJouable(s), courant = suiv && suiv.id === s.id;
          const v = c[s.id];
          const cls = fait ? "fait" : !ouvert ? "verrou" : courant ? "courant" : "avenir";
          return `<li class="pas ${cls}" style="--c:${s.couleur}">
            <span class="pas-num">${fait ? "✓" : !ouvert ? "🔒" : s.num}</span>
            <div class="pas-texte">
              <b>${s.emoji} ${esc(s.court)} <em>· ${esc(s.defi.titre)}</em></b>
              <span>${esc(s.defi.accroche)}</span>
              ${!ouvert ? `<i class="badge-complete">Version complète</i>${P.offerts ? `<i class="badge-offerte">Lettre ${s.lettre} offerte</i>` : ""}` : ""}
            </div>
            ${fait && v ? `<img class="pas-vignette" src="${v.img}" alt="">` : fait ? `<span class="pas-lettre">${s.lettre}</span>` : ""}
          </li>`;
        }).join("")}</ol>
        <div class="pied-actions">
          <button class="lien-discret" type="button" data-act="carnet">📒 Carnet de Croki</button>
          <button class="lien-discret" type="button" data-act="reglages">⚙️ Réglages</button>
        </div>`;
    },

    route(id) {
      barre(true);
      const s = stage(id);
      P.etape = id; P.phase = "route"; sauver();
      ecran.innerHTML = `
        <div class="entete-etape" style="--c:${s.couleur}"><span>Panneau n°${s.num}</span><b>${s.emoji} ${esc(s.nom)}</b></div>
        ${bulle(s.transition, `${s.id}__transition`, { image: "croki-court" })}
        <button class="plan-carte" type="button" data-act="plan" aria-label="Agrandir le plan">
          <img src="assets/img/plan-parc.webp" alt="Plan du parc">
          <span class="plan-cible" style="--c:${s.couleur}">Cherche le panneau n°${s.num}</span>
          <span class="plan-loupe">🔍 Agrandir</span>
        </button>
        <div class="cta-colle">
          <button class="btn btn-principal" type="button" data-act="arrive" data-id="${s.id}">✅ Je suis arrivé(e) devant le panneau</button>
        </div>`;
    },

    intro(id) {
      barre(true);
      const s = stage(id);
      P.etape = id; P.phase = "intro"; sauver();
      const deja = P.mots.includes(id);
      ecran.innerHTML = `
        <div class="entete-etape" style="--c:${s.couleur}"><span>Panneau n°${s.num}</span><b>${s.emoji} ${esc(s.nom)}</b></div>
        ${bulle("", `${s.id}__intro`, { image: s.crokiImage, html: dore(s.intro, id), classe: "grande" })}
        <p class="astuce-dore ${deja ? "trouve" : ""}">${deja ? "✨ Mot doré déjà rangé dans ton message secret." : "✨ Un mot doré se cache dans mon message : touche-le !"}</p>
        <div class="pile-boutons"><button class="btn btn-principal" type="button" data-act="question" data-id="${id}">❓ La question de Croki</button></div>`;
      if (deja) $$(".mot-dore", ecran).forEach(b => b.classList.add("pris"));
    },

    question(id) {
      barre(true);
      const s = stage(id), q = s.question;
      P.etape = id; P.phase = "question"; sauver();
      ecran.innerHTML = `
        <div class="entete-etape" style="--c:${s.couleur}"><span>Panneau n°${s.num}</span><b>${s.emoji} ${esc(s.nom)}</b></div>
        <div class="carte-question">
          <h2>${esc(q.texte)}</h2>
          <div class="options">${q.options.map((o, i) => `<button class="option" type="button" data-opt="${i}"><span class="opt-lettre">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>
          <p class="indice" aria-live="polite"></p>
        </div>
        <div class="suite-question"></div>`;
      let essais = 0;
      $$(".option", ecran).forEach(b => b.addEventListener("click", () => {
        const i = +b.dataset.opt;
        if (b.disabled) return;
        if (i === q.bonne) {
          b.classList.add("juste"); Sons.jouer("bonne"); Sons.vibrer(30);
          Store.stat("question", `${s.id} · ${essais + 1} essai(s)`);
          $$(".option", ecran).forEach(x => x.disabled = true);
          const suite = CONFIG.estJouable(s) && s.defi.pilote;
          $(".indice", ecran).textContent = "";
          $(".suite-question", ecran).innerHTML = `
            ${bulle(q.explication, `${s.id}__explication`, { image: "croki-victoire-peace", classe: "apparait" })}
            <div class="pile-boutons">${suite
              ? `<button class="btn btn-principal" type="button" data-act="defi" data-id="${id}">🎯 Défi : ${esc(s.defi.titre)}</button>`
              : `<button class="btn btn-principal" type="button" data-act="gagner" data-id="${id}">🎁 Ma lettre et ma décoration</button>`}</div>`;
          setTimeout(() => $(".suite-question", ecran).scrollIntoView({ behavior: reduireAnim() ? "auto" : "smooth", block: "start" }), 120);
        } else {
          essais++;
          b.classList.add("faux"); b.disabled = true; Sons.jouer("faux"); Sons.vibrer(70);
          let indice = "Presque ! Relis bien le panneau et essaie encore 😉";
          if (q.indices) indice = (q.indiceTrop && i > q.bonne) ? q.indiceTrop : q.indices[Math.min(essais, q.indices.length) - 1];
          $(".indice", ecran).textContent = indice;
        }
      }));
    },

    defi(id) {
      barre(true);
      const s = stage(id), d = s.defi;
      P.etape = id; P.phase = "defi"; sauver();
      const roles = P.mode === "famille" && d.role ? `
        <div class="roles">
          <div class="role"><span>${CONFIG.roles[d.role.tient].ico}</span><b>${CONFIG.roles[d.role.tient].nom}</b><small>tient le téléphone</small></div>
          <div class="role"><span>${CONFIG.roles[d.role.geste].ico}</span><b>${CONFIG.roles[d.role.geste].nom}</b><small>${esc(d.role.texteGeste)}</small></div>
        </div>` : "";
      ecran.innerHTML = `
        <div class="entete-defi" style="--c:${s.couleur}">
          <span class="defi-etiquette">Défi n°${s.num}</span>
          <h1>${esc(d.titre)}</h1>
          <p>${esc(d.accroche)}</p>
        </div>
        ${roles}
        <div class="zone-defi" style="--c:${s.couleur}"></div>`;
      const zone = $(".zone-defi", ecran);
      garderEnVue(zone);
      let fini = false;
      arreterJeu = Defis[d.type](zone, s, vignette => {
        if (fini) return; fini = true;
        arreterJeu = null;
        Capteurs.toutArreter();
        setTimeout(() => gagner(id), 200);
      });
    },

    recompense(id) {
      barre(true);
      const s = stage(id);
      const gagnes = new Set(P.faits.concat(P.offerts ? S.filter(x => !CONFIG.estJouable(x)).map(x => x.id) : []));
      const acq = lettresAcquises(); acq.nouveau = S.indexOf(s);
      const suiv = prochaine();
      ecran.innerHTML = `
        <div class="recompense">
          <div class="lettre-gagnee" style="--c:${s.couleur}"><span>${s.lettre}</span></div>
          <h1>Lettre ${s.lettre} + ${esc(s.accessoire)} ${s.accessoireEmoji}</h1>
          <p class="sous">${esc(s.defi.bravo || "Bravo, Super Marmaille !")} ${esc(sansGras(`Tes ${s.accessoire.toLowerCase()} décorent ma fête !`))}</p>
          <div class="cadre-fete grand">${Art.fete(gagnes, s.id, acq)}</div>
          <div class="pile-boutons">
            ${suiv ? `<button class="btn btn-principal" type="button" data-act="route" data-id="${suiv.id}">🚶 Panneau suivant : n°${suiv.num} ${suiv.emoji}</button>`
                   : `<button class="btn btn-principal" type="button" data-act="vers-fete">🎉 Préparer la fête !</button>`}
            <button class="btn btn-doux" type="button" data-act="carnet">📒 Voir mon carnet</button>
          </div>
        </div>`;
      Sons.jouer("lettre"); Sons.vibrer([30, 60, 30]);
      setTimeout(() => confettis(36), 250);
    },

    offertes() {
      barre(true);
      const manquantes = S.filter(s => !CONFIG.estJouable(s));
      P.offerts = true; sauver();
      const gagnes = new Set(S.map(s => s.id).filter(id => P.faits.includes(id) || manquantes.some(m => m.id === id)));
      const acq = lettresAcquises(); acq.nouveau = -1;
      ecran.innerHTML = `
        <div class="recompense">
          ${bulle(CONFIG.textes.offertes, "lettres_offertes", { image: "croki-espoir-nuage" })}
          <div class="cadeaux">${manquantes.map((s, i) => `<div class="cadeau" style="--c:${s.couleur};--d:${i * .25}s"><b>${s.lettre}</b><span>${s.accessoireEmoji} ${esc(s.accessoire)}</span></div>`).join("")}</div>
          <div class="cadre-fete grand">${Art.fete(gagnes, null, acq)}</div>
          <div class="pile-boutons"><button class="btn btn-principal" type="button" data-act="enigme">🔤 La dernière énigme</button></div>
        </div>`;
      Sons.jouer("lettre"); confettis(30);
    },

    enigme() {
      barre(true);
      P.finale = "enigme"; sauver();
      const lettres = MOT.split("");
      let pioche = melanger(lettres.map((l, i) => ({ l, k: i })));
      if (pioche.map(x => x.l).join("") === MOT) pioche.reverse();
      const cases = new Array(lettres.length).fill(null);
      ecran.innerHTML = `
        ${bulle(CONFIG.textes.enigme, "enigme_finale", { image: "croki-reflechit-pilier" })}
        <div class="puzzle">
          <div class="cases">${lettres.map((_, i) => `<button class="case" type="button" data-case="${i}" aria-label="Case ${i + 1}"></button>`).join("")}</div>
          <div class="pioche">${pioche.map((x, i) => `<button class="jeton" type="button" data-j="${i}">${x.l}</button>`).join("")}</div>
          <p class="indice" aria-live="polite">Touche une lettre pour la poser. Vert = bien placée, rouge = à déplacer.</p>
          <div class="rangee-centre"><button class="btn btn-doux petit" type="button" data-reset>↺ Tout reprendre</button></div>
        </div>`;
      const casesEl = $$(".case", ecran), jetons = $$(".jeton", ecran), indice = $(".indice", ecran);
      function maj() {
        casesEl.forEach((c, i) => {
          const j = cases[i];
          c.textContent = j === null ? "" : pioche[j].l;
          c.classList.toggle("pleine", j !== null);
          c.classList.toggle("bien", j !== null && pioche[j].l === lettres[i]);
          c.classList.toggle("mal", j !== null && pioche[j].l !== lettres[i]);
        });
        jetons.forEach((b, j) => b.classList.toggle("utilise", cases.includes(j)));
        if (cases.every((j, i) => j !== null && pioche[j].l === lettres[i])) gagne();
      }
      jetons.forEach((b, j) => b.addEventListener("click", () => {
        if (cases.includes(j)) return;
        const libre = cases.indexOf(null);
        if (libre < 0) return;
        cases[libre] = j;
        const bien = pioche[j].l === lettres[libre];
        Sons.jouer(bien ? "pop" : "tap"); Sons.vibrer(bien ? 15 : 40);
        maj();
      }));
      casesEl.forEach((c, i) => c.addEventListener("click", () => { if (cases[i] !== null) { cases[i] = null; Sons.jouer("tap"); maj(); } }));
      $("[data-reset]", ecran).addEventListener("click", () => { cases.fill(null); maj(); indice.textContent = "On recommence tranquillement !"; });
      let gagnee = false;
      function gagne() {
        if (gagnee) return; gagnee = true;
        casesEl.forEach((c, i) => { c.style.animationDelay = i * 0.08 + "s"; c.classList.add("victoire"); });
        indice.textContent = "✨ PARADIS ! ✨";
        Sons.jouer("fanfare"); Sons.vibrer([50, 50, 50, 50, 120]);
        confettis(60);
        P.finale = "fete"; sauver();
        Store.stat("parcours_termine", Math.round((Date.now() - P.debut) / 60000) + " min");
        setTimeout(() => aller("fete"), reduireAnim() ? 600 : 1800);
      }
    },

    fete() {
      barre(true);
      P.finale = P.finale === "enigme" ? "fete" : (P.finale || "fete"); sauver();
      const tout = new Set(S.map(s => s.id));
      const acq = MOT.split("").map(() => true); acq.nouveau = -1;
      ecran.innerHTML = `
        <div class="titre-bloc"><h1>Bienvenue au PARADIS !</h1></div>
        <div class="cadre-fete grand fete-finale">${Art.fete(tout, null, acq)}</div>
        ${bulle(CONFIG.textes.motTrouve, "mot_trouve", { image: "croki-victoire-peace" })}
        <div class="pile-boutons">
          <button class="btn btn-principal" type="button" data-act="photo">📸 La photo de fête</button>
          <button class="btn btn-doux" type="button" data-act="film">🎬 Le film de la fête</button>
          <button class="btn btn-doux" type="button" data-act="diplome">🏅 Mon diplôme</button>
          <button class="btn btn-doux" type="button" data-act="secret">🔐 Le bonus secret</button>
        </div>`;
      Sons.victoire(); confettis(50);
    },

    film() {
      barre(false);
      ecran.innerHTML = `
        <div class="video-plein">
          <video src="assets/video/outro.mp4" playsinline autoplay preload="auto"></video>
          <button class="btn btn-doux passer" type="button" data-act="fete-retour">Retour à la fête ⏭</button>
        </div>`;
      const v = $("video", ecran);
      const suite = () => { if (ecranCourant === "film") aller("fete"); };
      v.addEventListener("ended", suite); v.addEventListener("error", suite);
      const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(suite); });
    },

    photo() {
      barre(true);
      ecran.innerHTML = `
        <div class="titre-bloc"><h1>📸 La photo de fête</h1><p>${esc(CONFIG.textes.photoFete)}</p></div>
        <div class="zone-photo"></div>`;
      garderEnVue($(".zone-photo", ecran));
      PhotoFete.lancer($(".zone-photo", ecran), {
        surArret: f => { arreterJeu = f; },
        apres: () => aller("diplome")
      });
    },

    diplome() {
      barre(true);
      ecran.innerHTML = `
        <div class="titre-bloc"><h1>🏅 Mon diplôme</h1></div>
        ${bulle(CONFIG.textes.diplome, "diplome", { image: "croki-victoire-peace", classe: "compact" })}
        <label class="champ"><span>Ton prénom (si tu veux)</span><input id="prenom" type="text" maxlength="18" autocomplete="off" value="${esc(P.prenom || "")}" placeholder="Super Marmaille"></label>
        <div class="diplome-apercu"></div>
        <div class="pile-boutons">
          <a class="btn btn-principal" id="dl-diplome" download="diplome-super-marmaille.png" href="#">💾 Enregistrer le diplôme</a>
          <button class="btn btn-doux" type="button" data-act="secret">🔐 Le bonus secret</button>
        </div>`;
      const apercu = $(".diplome-apercu", ecran), lien = $("#dl-diplome", ecran), champ = $("#prenom", ecran);
      let url = null;
      const dessiner = async () => {
        P.prenom = champ.value.trim(); sauver();
        const cv = await PhotoFete.diplome(P.prenom);
        apercu.innerHTML = ""; cv.classList.add("diplome-canvas"); apercu.appendChild(cv);
        cv.toBlob(b => { if (url) URL.revokeObjectURL(url); url = b ? URL.createObjectURL(b) : "#"; lien.href = url; }, "image/png");
      };
      let t; champ.addEventListener("input", () => { clearTimeout(t); t = setTimeout(dessiner, 350); });
      lien.addEventListener("click", () => { Sons.jouer("pop"); toast("🏅 Diplôme enregistré dans tes téléchargements !"); });
      dessiner();
    },

    secret() {
      barre(true);
      const mots = CONFIG.secret;
      ecran.innerHTML = `
        <div class="titre-bloc"><h1>🔐 Le bonus secret</h1></div>
        ${bulle(CONFIG.textes.secretBonus, "secret_bonus", { image: "croki-appuye-malin" })}
        <div class="coffre">
          <div class="mots-secrets">${mots.map((m, i) => {
            const s = S[i], trouve = P.mots.includes(s.id);
            return `<span class="mot-secret ${trouve ? "trouve" : "offert"}" style="--d:${i * .18}s">${esc(m)}</span>`;
          }).join("")}<span class="mot-secret point" style="--d:${mots.length * .18}s">?</span></div>
          <p class="legende-secret"><span class="pastille trouve"></span> trouvé par toi · <span class="pastille offert"></span> offert par Croki</p>
        </div>
        <div class="carte-golf">⛳ <b>Mission bonus :</b> filez au mini golf et comptez les trous tous ensemble !</div>
        <div class="pile-boutons"><button class="btn btn-principal" type="button" data-act="merci">💚 Le mot de la fin</button></div>`;
      Sons.jouer("lettre");
    },

    merci() {
      barre(true);
      P.finale = "merci"; sauver();
      ecran.innerHTML = `
        <div class="titre-bloc"><h1>Merci, Super Marmaille !</h1></div>
        ${bulle(CONFIG.textes.finale, "finale", { image: "croki-victoire-peace" })}
        <div class="carte-avis">
          <p>Racontez votre visite dans un avis Google : vos retours aident Croc Parc à grandir ! 🙏</p>
          <a class="btn btn-soleil" href="https://maps.app.goo.gl/9z3HJ1a9ryugV8Za6" target="_blank" rel="noopener">⭐ Laisser un avis Google</a>
        </div>
        <div class="pile-boutons">
          <button class="btn btn-doux" type="button" data-act="carnet">📒 Mon carnet de Croki</button>
          <button class="btn btn-doux" type="button" data-act="fete-retour">🎉 Revoir la fête</button>
          <button class="btn btn-doux" type="button" data-act="recommencer">🔄 Nouvelle aventure</button>
        </div>`;
    }
  };

  // ---------------- Actions de jeu ----------------
  function gagner(id) {
    if (!P.faits.includes(id)) P.faits.push(id);
    if (!P.mots.includes(id)) P.mots.push(id);
    P.phase = null; P.etape = null;
    const suiv = prochaine();
    if (suiv) P.etape = suiv.id;
    sauver();
    Store.stat("defi_reussi", id);
    aller("recompense", id);
  }

  function versFete() {
    const manquent = S.some(s => !CONFIG.estJouable(s));
    if (manquent && !P.offerts) aller("offertes");
    else aller("enigme");
  }

  function reprendre() {
    if (!P || !P.mode) { aller("joueurs"); return; }
    if (P.finale) { aller(P.finale === "enigme" ? "enigme" : P.finale === "merci" ? "merci" : "fete"); return; }
    if (P.etape && P.phase && ["intro", "question", "defi"].includes(P.phase)) {
      toast("Te revoilà ! On reprend au panneau n°" + stage(P.etape).num);
      aller(P.phase === "defi" ? "intro" : P.phase, P.etape); return;
    }
    aller("parcours");
  }

  function collecterMot(b) {
    if (b.classList.contains("pris")) return;
    const id = P.etape;
    $$(".mot-dore", ecran).forEach(x => x.classList.add("pris"));
    if (id && !P.mots.includes(id)) { P.mots.push(id); sauver(); }
    Sons.jouer("lettre"); Sons.vibrer(25);
    const a = $(".astuce-dore", ecran);
    if (a) { a.textContent = `✨ « ${b.textContent} » rejoint ton message secret !`; a.classList.add("trouve"); }
    // petit vol du mot vers la barre du haut
    if (!reduireAnim()) {
      const r = b.getBoundingClientRect(), vol = document.createElement("span");
      vol.className = "mot-volant"; vol.textContent = b.textContent;
      vol.style.left = r.left + "px"; vol.style.top = r.top + "px";
      document.body.appendChild(vol);
      requestAnimationFrame(() => vol.classList.add("go"));
      setTimeout(() => vol.remove(), 1100);
    }
  }

  // ---------------- Délégation des clics ----------------
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act], [data-mode], .mot-dore, [data-voix]");
    if (!b) { if (e.target === overlay) { fermerOverlay(); retirerEntreeOverlay(); } return; }
    Sons.debloquer();
    if (b.matches(".mot-dore")) { collecterMot(b); return; }
    if (b.matches("[data-voix]")) { Sons.dire(b.dataset.voix); return; }
    if (b.dataset.mode) {
      P = NEUVE(); P.mode = b.dataset.mode; sauver();
      Store.stat("debut", P.mode);
      Sons.jouer("bonne");
      toast(b.dataset.mode === "famille" ? CONFIG.textes.famille : CONFIG.textes.solo, 3600);
      aller("parcours"); return;
    }
    const act = b.dataset.act, id = b.dataset.id;
    if (act !== "fermer" && act !== "zoom" && act !== "son") Sons.jouer("tap");
    switch (act) {
      case "partir": P = null; aller("video"); break;
      case "apres-video": aller("joueurs"); break;
      case "reprendre": reprendre(); break;
      case "nouvelle": if (confirm("Commencer une nouvelle partie ? Ton carnet repart à zéro.")) { Store.effacerPartie(); P = null; aller("video"); } break;
      case "parcours": if (overlayOuvert) { fermerOverlay(); retirerEntreeOverlay(); } P && P.mode ? aller("parcours") : aller("accueil"); break;
      case "route": aller("route", id); break;
      case "arrive": Sons.jouer("bonne"); aller("intro", id); break;
      case "question": aller("question", id); break;
      case "defi": aller("defi", id); break;
      case "gagner": gagner(id); break;
      case "vers-fete": versFete(); break;
      case "enigme": aller("enigme"); break;
      case "reprendre-fete": reprendre(); break;
      case "photo": aller("photo"); break;
      case "film": aller("film"); break;
      case "fete-retour": aller("fete"); break;
      case "diplome": aller("diplome"); break;
      case "secret": aller("secret"); break;
      case "merci": aller("merci"); break;
      case "plan": case "carnet": case "parc": case "reglages":
        if (overlayOuvert) { overlay.innerHTML = ""; overlayOuvert = null; ouvrirOverlay(act); }
        else { history.pushState({ croki: "overlay" }, ""); ouvrirOverlay(act); }
        break;
      case "fermer": fermerOverlay(); retirerEntreeOverlay(); break;
      case "zoom": { const z = $(".plan-zoom", overlay); z.classList.toggle("zoome"); break; }
      case "son":
        Sons.actif = !Sons.actif; R.son = Sons.actif; Store.sauverReglages(R);
        b.classList.toggle("on", Sons.actif); b.setAttribute("aria-pressed", Sons.actif);
        if (Sons.actif) Sons.jouer("pop");
        break;
      case "recommencer":
        if (confirm("Recommencer l'aventure depuis le début ? Ton carnet repart à zéro.")) {
          Store.effacerPartie(); P = null; if (overlayOuvert) { fermerOverlay(); retirerEntreeOverlay(); } aller("accueil");
        }
        break;
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlayOuvert) { fermerOverlay(); retirerEntreeOverlay(); } });

  // ---------------- Démarrage ----------------
  document.documentElement.classList.toggle("demo", DEMO);
  document.getElementById("decor").innerHTML = Art.decor();
  armerRetour();
  aller("accueil");

  // Service worker (hors-ligne). Erreurs silencieuses : l'appli marche sans.
  if ("serviceWorker" in navigator && location.protocol !== "file:" && !PARAMS.has("nosw")) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }

  window.CrokiApp = { aller, etat: () => P };
})();
