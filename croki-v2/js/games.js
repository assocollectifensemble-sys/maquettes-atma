/* ============================================================
   GAMES.JS — les mini-défis physiques et sensoriels
   ------------------------------------------------------------
   Chaque défi : Defis[type](zone, stage, fini) → renvoie arreter()
   - zone  : élément où dessiner le défi
   - fini(vignette) : appelé UNE fois quand le défi est réussi
   Chaque capteur a son alternative au toucher, affichée toute seule
   en cas de refus, d'absence (ordinateur) ou de silence du capteur.
   ============================================================ */

const $ = (sel, racine = document) => racine.querySelector(sel);
const $$ = (sel, racine = document) => Array.from(racine.querySelectorAll(sel));
const melanger = t => { const a = t.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const attendre = ms => new Promise(r => setTimeout(r, ms));
const reduireAnim = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Vignettes dessinées (quand il n'y a pas de photo) ----------
const Stickers = {
  creer(emoji, titre, c1, c2) {
    try {
      const T = 360, cv = document.createElement("canvas");
      cv.width = cv.height = T;
      const g = cv.getContext("2d");
      const grad = g.createLinearGradient(0, 0, T, T);
      grad.addColorStop(0, c1); grad.addColorStop(1, c2);
      g.fillStyle = grad; g.fillRect(0, 0, T, T);
      g.fillStyle = "rgba(255,255,255,.16)";
      for (let i = 0; i < 9; i++) { g.beginPath(); g.arc((i * 97) % T, (i * 151) % T, 18 + (i % 3) * 14, 0, 7); g.fill(); }
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "170px 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
      g.fillText(emoji, T / 2, T / 2 - 16);
      g.font = "700 30px Fredoka, Nunito, sans-serif";
      g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 6;
      g.strokeText(titre, T / 2, T - 42); g.fillText(titre, T / 2, T - 42);
      return cv.toDataURL("image/jpeg", 0.82);
    } catch (e) { return null; }
  }
};

// ---------- Viseur photo commun (croco, pose du maki) ----------
function viseurPhoto(zone, { face = "environment", cadre = "croco", consigne, legende, surPhoto, surRepli }) {
  let actif = true, stream = null;
  zone.innerHTML = `
    <div class="viseur viseur-${cadre}">
      <video playsinline muted autoplay></video>
      <div class="viseur-coins" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="viseur-mire" aria-hidden="true"></div>
      <img class="viseur-croki" src="assets/img/croki-appuye-malin.webp" alt="">
      <div class="viseur-flash" aria-hidden="true"></div>
      <p class="viseur-attente">Ouverture de l'œil magique…</p>
    </div>
    <p class="consigne-courte">${consigne}</p>
    <div class="rangee-centre">
      <button class="declencheur" type="button" disabled aria-label="Prendre la photo"><span>Clic-clac</span></button>
    </div>
    <button class="lien-repli" type="button">✋ Jouer au toucher</button>`;
  const video = $("video", zone), btn = $(".declencheur", zone);
  $(".lien-repli", zone).addEventListener("click", () => { arreter(); surRepli("choix"); });

  Capteurs.camera(face).then(r => {
    if (!actif) { if (r.ok) r.stream.getTracks().forEach(t => t.stop()); return; }
    if (!r.ok) { surRepli(r.raison); return; }
    stream = r.stream;
    video.srcObject = stream;
    if (face === "user") video.classList.add("miroir");
    video.play().catch(() => {});
    const pret = () => { $(".viseur-attente", zone) && $(".viseur-attente", zone).remove(); btn.disabled = false; };
    if (video.readyState >= 2) pret(); else video.addEventListener("loadeddata", pret, { once: true });
  });

  btn.addEventListener("click", () => {
    const img = Capteurs.vignette(video, 360);
    if (!img) return;
    Sons.jouer("declic"); Sons.vibrer(30);
    const f = $(".viseur-flash", zone); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    surPhoto(img);
  });

  function arreter() {
    actif = false;
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  }
  return arreter;
}

// Aperçu « polaroïd » + bouton coller dans le carnet
function apercuPolaroid(zone, img, legende, { recommencer, coller }) {
  zone.innerHTML = `
    <div class="polaroid-wrap">
      <figure class="polaroid"><img src="${img}" alt="${legende}"><figcaption>${legende}</figcaption></figure>
    </div>
    <div class="pile-boutons">
      <button class="btn btn-principal" data-coller type="button">📒 Coller dans le carnet de Croki</button>
      ${recommencer ? `<button class="btn btn-doux" data-refaire type="button">🔁 Reprendre la photo</button>` : ""}
    </div>`;
  $("[data-coller]", zone).addEventListener("click", () => {
    $(".polaroid", zone).classList.add("vole");
    Sons.jouer("pop");
    setTimeout(coller, reduireAnim() ? 50 : 650);
  });
  if (recommencer) $("[data-refaire]", zone).addEventListener("click", recommencer);
}

const Defis = {

  /* =========== 1. L'ŒIL DU CROCO (caméra) =========== */
  oeil(zone, stage, fini) {
    let arreterCourant = () => {};
    const legende = "Mon cousin le croco";

    function camera() {
      arreterCourant = viseurPhoto(zone, {
        cadre: "croco", consigne: "Cadre le croco dans l'œil de Croki, puis appuie sur le bouton !",
        surPhoto: img => { arreterCourant(); apercu(img); },
        surRepli: raison => repli(raison)
      });
    }
    function apercu(img) {
      apercuPolaroid(zone, img, legende, {
        recommencer: camera,
        coller: () => { Store.collerVignette(stage.id, img, legende); fini(img); }
      });
    }
    // Alternative au toucher : retrouver 3 paires d'yeux dans le bassin
    function repli(raison) {
      arreterCourant();
      const msg = raison === "choix" ? "" : `<p class="note-repli">✋ Ton doigt devient l'œil du croco !</p>`;
      zone.innerHTML = `${msg}
        <p class="consigne-courte">${stage.defi.consigneTouch}</p>
        <div class="bassin" role="application" aria-label="Bassin des crocodiles">${Art.bassin()}
          <div class="compteur-bulle"><b>0</b> / 3</div>
        </div>`;
      const bassinEl = $(".bassin", zone), cpt = $(".compteur-bulle b", zone);
      const positions = melanger([[14, 18], [58, 14], [30, 44], [66, 48], [12, 70], [52, 74], [40, 28], [70, 30]]);
      let trouves = 0, k = 0, minuteur = null, fin = false;
      function apparaitre() {
        if (fin) return;
        $$(".yeux", bassinEl).forEach(e => e.remove());
        const [x, y] = positions[k++ % positions.length];
        const b = document.createElement("button");
        b.type = "button"; b.className = "yeux"; b.setAttribute("aria-label", "Des yeux de crocodile !");
        b.style.left = x + "%"; b.style.top = y + "%";
        b.innerHTML = Art.yeuxCroco();
        b.addEventListener("pointerdown", e => {
          e.preventDefault();
          if (b.classList.contains("trouve")) return;
          b.classList.add("trouve"); trouves++; cpt.textContent = trouves;
          Sons.jouer("pop"); Sons.vibrer(25);
          clearTimeout(minuteur);
          if (trouves >= 3) { fin = true; setTimeout(gagne, 700); }
          else minuteur = setTimeout(apparaitre, 650);
        });
        bassinEl.appendChild(b);
        minuteur = setTimeout(() => { b.classList.add("plonge"); minuteur = setTimeout(apparaitre, 450); }, 2600);
      }
      minuteur = setTimeout(apparaitre, 700);
      arreterCourant = () => { fin = true; clearTimeout(minuteur); };
      function gagne() {
        const img = Stickers.creer("🐊", "Trouvé !", "#16a085", "#0b5e57");
        apercu(img || "assets/img/croki-reflechit-pilier.webp");
      }
    }
    // Écran de départ : on demande l'autorisation au moment du geste
    zone.innerHTML = `
      <div class="carte-capteur">
        <div class="icone-capteur">📷</div>
        <p>${stage.defi.consigne}</p>
        <button class="btn btn-principal" data-go type="button">Ouvrir l'œil du croco</button>
        <button class="lien-repli" data-touch type="button">✋ Jouer au toucher</button>
      </div>`;
    $("[data-go]", zone).addEventListener("click", camera);
    $("[data-touch]", zone).addEventListener("click", () => repli("choix"));
    return () => arreterCourant();
  },

  /* =========== 2. FAIS LA ROUE (inclinaison) =========== */
  roue(zone, stage, fini) {
    let progres = 0, capteur = null, fin = false, dernierCote = 0, dernierGamma = null;
    zone.innerHTML = `
      <div class="scene-paon">
        <div class="paon" style="--p:0">${Art.paon()}</div>
        <div class="jauge-roue" aria-hidden="true"><i></i></div>
        <p class="etat-roue" aria-live="polite">Roue fermée</p>
      </div>
      <div class="zone-commande">
        <p class="consigne-courte">${stage.defi.consigne}</p>
        <button class="btn btn-principal" data-incl type="button">📱 Activer l'inclinaison</button>
        <button class="lien-repli" data-touch type="button">✋ Jouer au toucher</button>
      </div>`;
    const paonEl = $(".paon", zone), jauge = $(".jauge-roue i", zone), etat = $(".etat-roue", zone);

    function avancer(d) {
      if (fin) return;
      progres = Math.min(1, progres + d);
      paonEl.style.setProperty("--p", progres.toFixed(3));
      jauge.style.width = (progres * 100) + "%";
      etat.textContent = progres < 1 ? `Roue ouverte à ${Math.round(progres * 100)} %` : "La roue est grande ouverte !";
      if (progres >= 1) { fin = true; ouverte(); }
    }
    // Inclinaison : chaque balancier gauche ↔ droite ouvre la roue
    function surMesure(ev) {
      const g = ev.gamma || 0;
      if (dernierGamma !== null) avancer(Math.min(Math.abs(g - dernierGamma), 12) / 900);
      dernierGamma = g;
      const cote = g > 14 ? 1 : g < -14 ? -1 : 0;
      if (cote && cote !== dernierCote) { dernierCote = cote; avancer(0.13); Sons.jouer("plume"); Sons.vibrer(15); paonEl.classList.toggle("penche"); }
    }
    async function activer() {
      const r = await Capteurs.inclinaison(surMesure);
      if (r.ok) {
        capteur = r;
        $(".zone-commande", zone).innerHTML = `<p class="consigne-courte">📱 Penche le téléphone à gauche… à droite… à gauche… !</p><button class="lien-repli" data-touch type="button">✋ Jouer au toucher</button>`;
        $("[data-touch]", zone).addEventListener("click", repli);
      } else repli(r.raison);
    }
    // Alternative au toucher : glisser le doigt sur la roue
    function repli(raison) {
      if (capteur) { capteur.arreter(); capteur = null; }
      $(".zone-commande", zone).innerHTML = `${typeof raison === "string" ? `<p class="note-repli">✋ Ton doigt devient le vent qui ouvre la roue !</p>` : ""}
        <p class="consigne-courte">${stage.defi.consigneTouch}</p>`;
      paonEl.classList.add("glissable");
      let x0 = null, dirPrec = 0;
      paonEl.addEventListener("pointerdown", e => { x0 = e.clientX; paonEl.setPointerCapture && paonEl.setPointerCapture(e.pointerId); });
      paonEl.addEventListener("pointermove", e => {
        if (x0 === null) return;
        const dx = e.clientX - x0; x0 = e.clientX;
        avancer(Math.abs(dx) / 1100);
        const dir = Math.sign(dx);
        if (dir && dir !== dirPrec && Math.abs(dx) > 2) { dirPrec = dir; Sons.jouer("plume"); }
      });
      const lacher = () => { x0 = null; };
      paonEl.addEventListener("pointerup", lacher); paonEl.addEventListener("pointercancel", lacher);
    }
    // Roue ouverte → on compte les ocelles
    function ouverte() {
      if (capteur) { capteur.arreter(); capteur = null; }
      paonEl.classList.add("fiere"); Sons.jouer("bonne"); Sons.vibrer([30, 40, 30]);
      const N = Art.NB_PLUMES;
      const choix = melanger([N - 2, N, N + 2]);
      $(".zone-commande", zone).innerHTML = `
        <p class="consigne-courte">${stage.defi.compte}</p>
        <div class="choix-nombres">${choix.map(n => `<button class="nombre" type="button" data-n="${n}">${n}</button>`).join("")}</div>
        <p class="indice" aria-live="polite"></p>`;
      $$(".nombre", zone).forEach(b => b.addEventListener("click", async () => {
        if (+b.dataset.n === N) {
          b.classList.add("juste"); Sons.jouer("bonne");
          $$(".nombre", zone).forEach(x => x.disabled = true);
          await attendre(700);
          const img = Stickers.creer("🦚", "Belle roue !", "#3a5fcf", "#1c8b74");
          if (img) Store.collerVignette(stage.id, img, "La roue du paon");
          fini(img);
        } else {
          b.classList.add("faux"); b.disabled = true; Sons.jouer("faux"); Sons.vibrer(60);
          $(".indice", zone).textContent = "Presque ! On recompte ensemble, plume par plume…";
          $$(".ocelle", zone).forEach((o, i) => { o.style.animationDelay = (i * 0.35) + "s"; o.classList.remove("compte"); void o.getBBox; o.classList.add("compte"); });
        }
      }));
    }
    $("[data-incl]", zone).addEventListener("click", activer);
    $("[data-touch]", zone).addEventListener("click", repli);
    return () => { fin = true; if (capteur) capteur.arreter(); };
  },

  /* =========== 3. LE BEATBOX DU MAKI (rythme) + IMITE LE MAKI =========== */
  beatbox(zone, stage, fini) {
    const PADS = [
      { cle: "boum", nom: "Boum", couleur: "orange" },
      { cle: "tchak", nom: "Tchak", couleur: "rose" },
      { cle: "tss", nom: "Tss", couleur: "bleu" }
    ];
    const LONGUEURS = [3, 4, 4, 5];
    let manche = 0, motif = [], saisie = [], ecoute = false, rates = 0, fin = false, arreterPhoto = () => {};
    zone.innerHTML = `
      <div class="scene-maki">
        <div class="maki">${Art.maki()}</div>
        <div class="bulle-etat" aria-live="polite">Prêt pour le beatbox ?</div>
        <div class="manches" aria-label="Rythmes réussis">${LONGUEURS.map(() => "<i></i>").join("")}</div>
      </div>
      <div class="pads">${PADS.map((p, i) => `<button class="pad pad-${p.couleur}" type="button" data-i="${i}" disabled><span class="pad-nom">${p.nom}</span></button>`).join("")}</div>
      <div class="rangee-centre"><button class="btn btn-principal" data-ecoute type="button">🎵 Écouter le rythme de Croki</button></div>`;
    const makiEl = $(".maki", zone), etat = $(".bulle-etat", zone), pads = $$(".pad", zone), btnEcoute = $("[data-ecoute]", zone);

    function frapper(i, parCroki) {
      const p = pads[i];
      p.classList.remove("tape"); void p.offsetWidth; p.classList.add("tape");
      makiEl.classList.remove("danse", "danse2"); void makiEl.offsetWidth; makiEl.classList.add(i % 2 ? "danse2" : "danse");
      Sons.jouer(PADS[i].cle);
      if (!parCroki) Sons.vibrer(18);
    }
    async function jouerMotif() {
      ecoute = false; pads.forEach(p => { p.disabled = true; p.classList.remove("guide"); });
      btnEcoute.disabled = true;
      etat.textContent = "🎧 Écoute bien le rythme de Croki…";
      const tempo = rates >= 1 ? 720 : 560;
      await attendre(500);
      for (const i of motif) { if (fin) return; frapper(i, true); await attendre(tempo); }
      if (fin) return;
      etat.textContent = rates >= 2 ? "On le fait ensemble : tape sur le tam-tam qui brille !" : "🥁 À toi ! Rejoue le même rythme";
      saisie = []; ecoute = true;
      pads.forEach(p => p.disabled = false);
      btnEcoute.disabled = false; btnEcoute.textContent = "🔁 Réécouter";
      guider();
    }
    function guider() {
      pads.forEach(p => p.classList.remove("guide"));
      if (rates >= 2 && ecoute) pads[motif[saisie.length]].classList.add("guide");
    }
    function nouvelleManche() {
      const n = LONGUEURS[manche];
      motif = Array.from({ length: n }, (_, k) => k === 0 ? 0 : Math.floor(Math.random() * 3));
      rates = 0;
      jouerMotif();
    }
    pads.forEach((p, i) => p.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (!ecoute || p.disabled) return;
      frapper(i, false);
      if (i !== motif[saisie.length]) {
        ecoute = false; rates++;
        Sons.vibrer(80);
        etat.textContent = rates >= 2 ? "On va le faire ensemble, tranquille !" : "Presque ! Écoute encore une fois…";
        setTimeout(() => { Sons.jouer("faux"); }, 180);
        setTimeout(jouerMotif, 1100);
        return;
      }
      saisie.push(i); guider();
      if (saisie.length === motif.length) {
        ecoute = false; pads.forEach(p => p.disabled = true);
        $$(".manches i", zone)[manche].classList.add("ok");
        manche++;
        Sons.jouer("bonne");
        if (manche >= LONGUEURS.length) { etat.textContent = "🔥 Tu es le roi du beatbox !"; makiEl.classList.add("fete"); setTimeout(pose, 1300); }
        else { etat.textContent = ["Bravo ! Rythme suivant…", "Wouah ! Encore un…", "Dernier rythme, le plus long !"][manche - 1]; setTimeout(nouvelleManche, 1200); }
      }
    }));
    btnEcoute.addEventListener("click", () => { Sons.debloquer(); if (!motif.length) nouvelleManche(); else jouerMotif(); });

    // Bonus « Imite le maki » : pose bain de soleil en photo (ou compte à rebours)
    function pose() {
      if (fin) return;
      zone.innerHTML = `
        <div class="carte-pose">
          <div class="pose-guide">${Art.makiSoleil()}</div>
          <h3>Imite le maki !</h3>
          <p>${stage.defi.pose}</p>
          <div class="pile-boutons">
            <button class="btn btn-principal" data-photo type="button">📸 Photographier la pose</button>
            <button class="btn btn-doux" data-pose type="button">☀️ Prendre la pose (3, 2, 1…)</button>
          </div>
        </div>`;
      $("[data-photo]", zone).addEventListener("click", photo);
      $("[data-pose]", zone).addEventListener("click", rebours);
    }
    function photo() {
      arreterPhoto = viseurPhoto(zone, {
        cadre: "maki", consigne: "Le maki prend son bain de soleil : bras ouverts, ventre au soleil !",
        surPhoto: img => { arreterPhoto(); apercuPolaroid(zone, img, "Ma pose de maki", { recommencer: photo, coller: () => { Store.collerVignette(stage.id, img, "Ma pose de maki"); fini(img); } }); },
        surRepli: () => rebours()
      });
    }
    async function rebours() {
      arreterPhoto();
      zone.innerHTML = `<div class="carte-pose"><div class="pose-guide">${Art.makiSoleil()}</div><p class="consigne-courte">Bras ouverts, ventre au soleil, yeux mi-clos…</p><div class="rebours" aria-live="assertive">3</div></div>`;
      const r = $(".rebours", zone);
      for (const n of ["3", "2", "1", "☀️"]) { if (fin) return; r.textContent = n; r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); Sons.jouer("tap"); await attendre(850); }
      const img = Stickers.creer("🐒", "Pose de maki !", "#f0a830", "#c45d1e");
      if (img) Store.collerVignette(stage.id, img, "Pose bain de soleil");
      fini(img);
    }
    return () => { fin = true; arreterPhoto(); };
  },

  /* =========== 5. LE GRAND CACARDAGE (micro) =========== */
  cacardage(zone, stage, fini) {
    let hauteur = 0, fin = false, raf = 0, micro = null, base = null, calib = [], tPrec = 0, mode = null;
    zone.innerHTML = `
      <div class="ciel-oie">
        <div class="nuage n1"></div><div class="nuage n2"></div><div class="nuage n3"></div>
        <div class="mare"></div>
        <div class="oie" style="--h:0">${Art.oie()}</div>
        <div class="altimetre" aria-hidden="true"><i></i><span>🏁</span></div>
        <div class="vu" aria-hidden="true">${Array.from({ length: 10 }, () => "<b></b>").join("")}</div>
      </div>
      <div class="zone-commande">
        <p class="consigne-courte">${stage.defi.consigne}</p>
        <button class="btn btn-principal" data-micro type="button">🎤 Allumer le micro magique</button>
        <p class="petite-note">Le micro mesure seulement le volume. Le son reste dans le téléphone.</p>
        <button class="lien-repli" data-touch type="button">✋ Jouer au toucher</button>
      </div>`;
    const oieEl = $(".oie", zone), alti = $(".altimetre i", zone), barres = $$(".vu b", zone), ciel = $(".ciel-oie", zone);

    function regler(h) {
      hauteur = Math.max(0, Math.min(100, h));
      oieEl.style.setProperty("--h", (hauteur / 100).toFixed(3));
      alti.style.height = hauteur + "%";
      if (hauteur >= 100 && !fin) decollage();
    }
    function vu(niv) { const n = Math.round(niv * 10); barres.forEach((b, i) => b.classList.toggle("on", i < n)); }

    async function allumer() {
      Sons.debloquer();
      const btn = $("[data-micro]", zone); btn.disabled = true; btn.textContent = "🎤 Le micro s'allume…";
      const r = await Capteurs.micro();
      if (fin) { if (r.ok) { r.couper(); r.stream.getTracks().forEach(t => t.stop()); } return; }
      if (!r.ok) { repli(r.raison); return; }
      micro = r; mode = "micro";
      $(".zone-commande", zone).innerHTML = `<p class="consigne-courte">📢 Tous ensemble : « Couac ! Couac ! » Plus fort… encore plus fort !</p>
        <button class="lien-repli" data-touch type="button">✋ Jouer au toucher</button>`;
      $("[data-touch]", zone).addEventListener("click", () => repli("choix"));
      ciel.classList.add("ecoute");
      tPrec = performance.now();
      raf = requestAnimationFrame(boucle);
    }
    function boucle(t) {
      if (fin || mode !== "micro") return;
      const dt = Math.min(0.1, (t - tPrec) / 1000); tPrec = t;
      const niv = micro.niveau();
      if (base === null) { calib.push(niv); if (calib.length > 20) base = Math.min(0.03, calib.sort((a, b) => a - b)[10]); }
      const seuil = Math.max(0.012, (base || 0.01) * 1.8);
      const force = Math.max(0, niv - seuil);
      vu(Math.min(1, niv / 0.25));
      oieEl.classList.toggle("bat", force > 0);
      regler(hauteur + (force > 0 ? Math.min(40, 18 + force * 160) * dt : -6 * dt));
      raf = requestAnimationFrame(boucle);
    }
    // Alternative au toucher : tapoter le gros bouton « Couac ! »
    function repli(raison) {
      cancelAnimationFrame(raf);
      if (micro) { micro.couper(); micro.stream.getTracks().forEach(t => t.stop()); micro = null; }
      mode = "toucher"; ciel.classList.remove("ecoute");
      $(".zone-commande", zone).innerHTML = `${raison !== "choix" ? `<p class="note-repli">✋ Ton doigt devient le cri de l'oie !</p>` : ""}
        <p class="consigne-courte">${stage.defi.consigneTouch}</p>
        <div class="rangee-centre"><button class="btn-couac" type="button">Couac !</button></div>`;
      const b = $(".btn-couac", zone);
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        Sons.jouer("couac"); Sons.vibrer(20);
        b.classList.remove("pouet"); void b.offsetWidth; b.classList.add("pouet");
        oieEl.classList.add("bat"); clearTimeout(b._t); b._t = setTimeout(() => oieEl.classList.remove("bat"), 350);
        regler(hauteur + 7.5);
        vu(0.9); setTimeout(() => vu(0), 200);
      });
      // L'oie redescend doucement si on s'arrête
      let tp = performance.now();
      const chute = t => { if (fin || mode !== "toucher") return; const dt = Math.min(.1, (t - tp) / 1000); tp = t; if (hauteur > 0 && hauteur < 100) regler(hauteur - 2.5 * dt); raf = requestAnimationFrame(chute); };
      raf = requestAnimationFrame(chute);
    }
    async function decollage() {
      fin = true; cancelAnimationFrame(raf);
      if (micro) { micro.couper(); micro.stream.getTracks().forEach(t => t.stop()); micro = null; }
      vu(0); oieEl.classList.add("envol", "bat");
      Sons.jouer("fanfare"); Sons.vibrer([40, 50, 40, 50, 80]);
      $(".zone-commande", zone).innerHTML = `<p class="consigne-courte gros">🪿 Décollage réussi !</p>`;
      await attendre(reduireAnim() ? 300 : 1800);
      const img = Stickers.creer("🪿", "Décollage !", "#58b6e8", "#2468b4");
      if (img) Store.collerVignette(stage.id, img, "Le grand cacardage");
      fini(img);
    }
    $("[data-micro]", zone).addEventListener("click", allumer);
    $("[data-touch]", zone).addEventListener("click", () => repli("choix"));
    return () => {
      fin = true; cancelAnimationFrame(raf);
      if (micro) { micro.couper(); micro.stream.getTracks().forEach(t => t.stop()); micro = null; }
    };
  }
};
