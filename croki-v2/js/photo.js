/* ============================================================
   PHOTO.JS — « Photo de fête » (selfie + cadre Croki) et diplôme
   ------------------------------------------------------------
   Tout est composé dans un <canvas> local puis proposé en
   téléchargement (lien download) : rien ne quitte le téléphone.
   Repli automatique : sans caméra, la carte de fête illustrée
   (Croki + accessoires) reste enregistrable.
   ============================================================ */

const PhotoFete = (() => {
  const W = 1080, H = 1350; // format portrait 4:5, idéal galerie / partage
  const cacheImg = {};

  function charger(src) {
    if (cacheImg[src]) return cacheImg[src];
    cacheImg[src] = new Promise(res => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => res(null);
      i.src = src;
    });
    return cacheImg[src];
  }
  async function polices() {
    try { await Promise.all([document.fonts.load("700 60px Fredoka"), document.fonts.load("800 40px Nunito")]); } catch (e) {}
  }
  const EMOJI = "'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',sans-serif";

  function rondRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // Cadre commun : bandeau PARADIS, guirlande de fanions, accessoires, Croki
  async function cadre(g, { avecPhoto }) {
    const couleurs = ["#ff5d73", "#ffb627", "#3ec1d3", "#7bd389", "#b28dff", "#ff8c42", "#4d96ff"];
    // Bordure épaisse façon polaroïd tropical
    g.lineWidth = 36; g.strokeStyle = "#fff7e8"; rondRect(g, 18, 18, W - 36, H - 36, 46); g.stroke();
    g.lineWidth = 10; g.strokeStyle = "#ffb627"; rondRect(g, 40, 40, W - 80, H - 80, 36); g.stroke();
    // Guirlande de fanions PARADIS
    g.strokeStyle = "#6b3f17"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(40, 70); g.quadraticCurveTo(W / 2, 230, W - 40, 70); g.stroke();
    CONFIG.motCible.split("").forEach((L, i) => {
      const t = (i + 1) / 8, x = 40 + (W - 80) * t, y = 70 + 2 * t * (1 - t) * 160 - 4;
      g.save(); g.translate(x, y);
      g.fillStyle = couleurs[i]; g.beginPath(); g.moveTo(-50, 0); g.lineTo(50, 0); g.lineTo(0, 100); g.closePath(); g.fill();
      g.fillStyle = "#fff"; g.font = "700 50px Fredoka, Nunito, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText(L, 0, 38); g.restore();
    });
    // Accessoires gagnés aux coins (tous offerts à la fête)
    g.font = `92px ${EMOJI}`; g.textAlign = "center"; g.textBaseline = "middle";
    const acc = CONFIG.stages.map(s => s.accessoireEmoji);
    [[110, 330], [W - 110, 330], [100, 760], [W - 100, 700]].forEach(([x, y], i) => g.fillText(acc[i], x, y));
    // Croki en bas à droite
    const croki = await charger("assets/img/croki-victoire-peace.webp");
    if (croki) {
      const h = avecPhoto ? 500 : 620, w = croki.width * h / croki.height;
      g.drawImage(croki, W - w - 30, H - h - 150, w, h);
    }
    // Bandeau bas
    g.fillStyle = "#12806f"; rondRect(g, 70, H - 200, W - 140, 130, 65); g.fill();
    g.fillStyle = "#fff"; g.font = "700 58px Fredoka, Nunito, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("La fête de Croki 🐊", W / 2, H - 150);
    g.font = "700 34px Nunito, sans-serif"; g.fillStyle = "#c9fff0";
    g.fillText("Croc Parc · Étang-Salé · " + new Date().toLocaleDateString("fr-FR"), W / 2, H - 100);
    g.font = `78px ${EMOJI}`;
    [[150, H - 290], [W / 2 - 120, H - 270]].forEach(([x, y], i) => g.fillText(acc[4 + i], x, y));
  }

  async function composer(video) {
    await polices();
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    if (video && video.videoWidth) {
      // Photo plein cadre, recadrée « cover », en miroir comme un selfie
      const vw = video.videoWidth, vh = video.videoHeight, r = Math.max(W / vw, H / vh);
      const dw = vw * r, dh = vh * r;
      g.save(); g.translate(W, 0); g.scale(-1, 1);
      g.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh); g.restore();
      const voile = g.createLinearGradient(0, 0, 0, H);
      voile.addColorStop(0, "rgba(255,180,90,.18)"); voile.addColorStop(.6, "rgba(0,0,0,0)"); voile.addColorStop(1, "rgba(0,0,0,.25)");
      g.fillStyle = voile; g.fillRect(0, 0, W, H);
    } else {
      // Carte illustrée : ciel de fête
      const ciel = g.createLinearGradient(0, 0, 0, H);
      ciel.addColorStop(0, "#ffd59e"); ciel.addColorStop(.6, "#ffb3a7"); ciel.addColorStop(1, "#f59fb0");
      g.fillStyle = ciel; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(W / 2, 420, 300, 0, 7); g.fill();
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillStyle = "#e8505b"; g.font = "700 130px Fredoka, Nunito, sans-serif"; g.fillText("Bravo !", W / 2, 360);
      g.fillStyle = "#0f5148"; g.font = "700 56px Fredoka, Nunito, sans-serif"; g.fillText("la Super Marmaille", W / 2, 460);
      g.fillStyle = "#7cc6a2"; g.beginPath(); g.moveTo(0, H * .72); g.quadraticCurveTo(W / 2, H * .64, W, H * .72); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      // Croki (dessiné par le cadre) est rejoint par son copain qui salue
      const copain = await charger("assets/img/croki-salut-4pattes.webp");
      if (copain) { const h = 430, w = copain.width * h / copain.height; g.drawImage(copain, 60, H - h - 190, w, h); }
    }
    await cadre(g, { avecPhoto: !!(video && video.videoWidth) });
    return cv;
  }

  function lancer(zone, { surArret, apres }) {
    let stream = null, url = null;
    const fermer = () => { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };
    surArret(fermer);

    function depart() {
      zone.innerHTML = `
        <div class="carte-capteur">
          <div class="icone-capteur">🤳</div>
          <p>Tournez le téléphone vers vous : Croki ajoute son cadre de fête et toutes vos décorations !</p>
          <button class="btn btn-principal" data-selfie type="button">📸 Ouvrir le selfie de fête</button>
          <button class="lien-repli" data-carte type="button">🎨 Créer la carte de fête illustrée</button>
        </div>`;
      $("[data-selfie]", zone).addEventListener("click", selfie);
      $("[data-carte]", zone).addEventListener("click", () => resultat(null));
    }

    async function selfie() {
      zone.innerHTML = `
        <div class="viseur viseur-fete">
          <video playsinline muted autoplay class="miroir"></video>
          <div class="cadre-selfie" aria-hidden="true">
            <div class="cs-fanions">${CONFIG.motCible.split("").map(L => `<span>${L}</span>`).join("")}</div>
            <img src="assets/img/croki-victoire-peace.webp" alt="">
          </div>
          <div class="viseur-flash" aria-hidden="true"></div>
          <div class="rebours-selfie" aria-live="assertive"></div>
          <p class="viseur-attente">Ouverture de la caméra…</p>
        </div>
        <div class="rangee-centre"><button class="declencheur" type="button" disabled aria-label="Prendre la photo de fête"><span>Souriez !</span></button></div>
        <button class="lien-repli" data-carte type="button">🎨 Créer la carte de fête illustrée</button>`;
      $("[data-carte]", zone).addEventListener("click", () => { fermer(); resultat(null); });
      const r = await Capteurs.camera("user");
      if (!document.body.contains(zone)) { if (r.ok) r.stream.getTracks().forEach(t => t.stop()); return; }
      if (!r.ok) {
        zone.insertAdjacentHTML("afterbegin", `<p class="note-repli">🎨 Croki dessine la carte de fête pour toi !</p>`);
        resultat(null, true); return;
      }
      stream = r.stream;
      const video = $("video", zone), btn = $(".declencheur", zone);
      video.srcObject = stream; video.play().catch(() => {});
      const pret = () => { const a = $(".viseur-attente", zone); if (a) a.remove(); btn.disabled = false; };
      if (video.readyState >= 2) pret(); else video.addEventListener("loadeddata", pret, { once: true });
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const rb = $(".rebours-selfie", zone);
        for (const n of ["3", "2", "1"]) { rb.textContent = n; rb.classList.remove("pulse"); void rb.offsetWidth; rb.classList.add("pulse"); Sons.jouer("tap"); await attendre(700); }
        rb.textContent = "";
        Sons.jouer("declic"); Sons.vibrer(40);
        const f = $(".viseur-flash", zone); f.classList.add("go");
        const cv = await composer(video);
        fermer();
        resultat(cv);
      });
    }

    async function resultat(cvDonne, garderNote) {
      const note = garderNote ? `<p class="note-repli">🎨 Croki a dessiné la carte de fête pour toi !</p>` : "";
      zone.innerHTML = `${note}<div class="photo-resultat"><p class="viseur-attente">Croki prépare la photo…</p></div>`;
      const cv = cvDonne || await composer(null);
      cv.classList.add("photo-finale");
      const box = $(".photo-resultat", zone); box.innerHTML = ""; box.appendChild(cv);
      zone.insertAdjacentHTML("beforeend", `
        <div class="pile-boutons">
          <a class="btn btn-principal" data-dl download="fete-de-croki.jpg" href="#">💾 Enregistrer dans la galerie</a>
          <button class="btn btn-doux" data-refaire type="button">🔁 Une autre photo</button>
          <button class="btn btn-doux" data-suite type="button">🏅 Mon diplôme</button>
        </div>`);
      const lien = $("[data-dl]", zone);
      cv.toBlob(b => { if (url) URL.revokeObjectURL(url); url = b ? URL.createObjectURL(b) : "#"; lien.href = url; }, "image/jpeg", 0.9);
      lien.addEventListener("click", () => { Sons.jouer("pop"); const t = document.getElementById("toast"); t.textContent = "📸 Photo enregistrée dans tes téléchargements !"; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2400); });
      $("[data-refaire]", zone).addEventListener("click", depart);
      $("[data-suite]", zone).addEventListener("click", apres);
      Sons.jouer("fanfare");
    }

    depart();
  }

  // ---------------- Diplôme Super Marmaille ----------------
  async function diplome(prenom) {
    await polices();
    const w = 1200, h = 850, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d");
    const fond = g.createLinearGradient(0, 0, w, h);
    fond.addColorStop(0, "#fff7e3"); fond.addColorStop(1, "#ffe9c7");
    g.fillStyle = fond; g.fillRect(0, 0, w, h);
    // motif de feuilles
    g.fillStyle = "rgba(18,128,111,.08)";
    for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse((i * 173) % w, (i * 241) % h, 70, 28, i, 0, 7); g.fill(); }
    g.lineWidth = 14; g.strokeStyle = "#12806f"; rondRect(g, 30, 30, w - 60, h - 60, 40); g.stroke();
    g.lineWidth = 4; g.strokeStyle = "#ffb627"; rondRect(g, 52, 52, w - 104, h - 104, 28); g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "#e8505b"; g.font = "700 40px Fredoka, Nunito, sans-serif";
    g.fillText("DIPLÔME OFFICIEL", w / 2, 128);
    g.fillStyle = "#0f5148"; g.font = "700 92px Fredoka, Nunito, sans-serif";
    g.fillText("Super Marmaille", w / 2, 220);
    g.fillStyle = "#3d3027"; g.font = "700 36px Nunito, sans-serif";
    g.fillText("est décerné à", w / 2, 300);
    const nom = (prenom || "").trim() || "Super Marmaille";
    let taille = 84; g.font = `700 ${taille}px Fredoka, Nunito, sans-serif`;
    while (g.measureText(nom).width > 640 && taille > 40) { taille -= 4; g.font = `700 ${taille}px Fredoka, Nunito, sans-serif`; }
    g.fillStyle = "#e07a00"; g.fillText(nom, w / 2 - 140, 392);
    g.strokeStyle = "#ffb627"; g.lineWidth = 5; g.beginPath(); g.moveTo(150, 446); g.lineTo(w - 450, 446); g.stroke();
    g.fillStyle = "#3d3027"; g.font = "700 30px Nunito, sans-serif";
    ["pour avoir aidé Croki à préparer sa fête surprise", "et retrouvé le mot magique P A R A D I S !"].forEach((l, i) => g.fillText(l, w / 2 - 140, 506 + i * 46));
    // Badges des défis
    g.font = `52px ${EMOJI}`;
    CONFIG.stages.forEach((s, i) => {
      const x = 170 + i * 102, y = 660;
      g.fillStyle = s.couleur; g.beginPath(); g.arc(x, y, 42, 0, 7); g.fill();
      g.fillStyle = "#fff"; g.font = "700 40px Fredoka, Nunito, sans-serif"; g.fillText(s.lettre, x, y + 2);
    });
    g.fillStyle = "#6b5a4c"; g.font = "700 26px Nunito, sans-serif";
    g.fillText("Croc Parc · Étang-Salé · " + new Date().toLocaleDateString("fr-FR"), w / 2 - 140, 750);
    const croki = await charger("assets/img/croki-victoire-peace.webp");
    if (croki) { const hh = 400, ww = croki.width * hh / croki.height; g.drawImage(croki, w - ww - 40, h - hh - 60, ww, hh); }
    // Sceau
    g.fillStyle = "#e8505b"; g.beginPath(); g.arc(w - 150, 150, 70, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.font = "700 26px Fredoka, Nunito, sans-serif"; g.fillText("BRAVO", w - 150, 140);
    g.font = `40px ${EMOJI}`; g.fillText("🐊", w - 150, 180);
    return cv;
  }

  return { lancer, diplome, composer };
})();
