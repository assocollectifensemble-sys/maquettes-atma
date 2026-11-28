/* ============================================================
   SENSORS.JS — caméra, micro, inclinaison (avec repli au toucher)
   ------------------------------------------------------------
   Adapté de visites-immersives/makes/app/js/sensors.js.
   Règle d'or : chaque fonction RÉSOUT toujours (jamais d'exception
   non gérée) avec { ok:true, … } ou { ok:false, raison } pour que le
   défi bascule tout seul sur son alternative au toucher.
   Rien n'est enregistré ni envoyé : le flux reste dans la page.
   ============================================================ */

const Capteurs = (() => {
  const flux = new Set();

  function mediaDispo() {
    return !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Petite course contre la montre : certaines demandes restent muettes
  function avecDelai(promesse, ms) {
    return Promise.race([promesse, new Promise((_, rej) => setTimeout(() => rej(new Error("delai")), ms))]);
  }

  async function camera(face = "environment") {
    if (!mediaDispo()) return { ok: false, raison: "absent" };
    try {
      const s = await avecDelai(navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: face }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      }), 15000);
      flux.add(s);
      return { ok: true, stream: s };
    } catch (e) {
      return { ok: false, raison: (e && e.name === "NotAllowedError") ? "refus" : "absent" };
    }
  }

  // Micro : on lit UNIQUEMENT le niveau sonore (aucun enregistrement)
  async function micro() {
    if (!mediaDispo()) return { ok: false, raison: "absent" };
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return { ok: false, raison: "absent" };
    try {
      const s = await avecDelai(navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false
      }), 15000);
      flux.add(s);
      const ctx = Sons.contexte() || new AC();
      const src = ctx.createMediaStreamSource(s);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      src.connect(an); // on n'envoie RIEN vers les haut-parleurs
      const buf = new Float32Array(an.fftSize);
      function niveau() {
        an.getFloatTimeDomainData(buf);
        let somme = 0;
        for (let i = 0; i < buf.length; i++) somme += buf[i] * buf[i];
        return Math.sqrt(somme / buf.length); // RMS 0..~1
      }
      return { ok: true, stream: s, niveau, couper: () => { try { src.disconnect(); } catch (e) {} } };
    } catch (e) {
      return { ok: false, raison: (e && e.name === "NotAllowedError") ? "refus" : "absent" };
    }
  }

  // Inclinaison : demande de permission iOS 13+, puis vérifie qu'un vrai
  // capteur répond (sur ordinateur, l'événement existe mais reste muet).
  async function inclinaison(surMesure) {
    if (!("DeviceOrientationEvent" in window)) return { ok: false, raison: "absent" };
    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const rep = await DeviceOrientationEvent.requestPermission();
        if (rep !== "granted") return { ok: false, raison: "refus" };
      }
    } catch (e) { return { ok: false, raison: "refus" }; }
    return new Promise(resolve => {
      let vu = false;
      const h = ev => {
        if (ev.gamma == null && ev.beta == null) return;
        vu = true;
        surMesure(ev);
      };
      window.addEventListener("deviceorientation", h);
      setTimeout(() => {
        if (vu) resolve({ ok: true, arreter: () => window.removeEventListener("deviceorientation", h) });
        else { window.removeEventListener("deviceorientation", h); resolve({ ok: false, raison: "absent" }); }
      }, 1200);
    });
  }

  function toutArreter() {
    flux.forEach(s => { try { s.getTracks().forEach(t => t.stop()); } catch (e) {} });
    flux.clear();
  }

  // Vignette JPEG réduite depuis une vidéo, recadrée au centre (carré)
  function vignette(video, taille = 360, qualite = 0.78) {
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return null;
    const cote = Math.min(w, h);
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    const g = c.getContext("2d");
    g.drawImage(video, (w - cote) / 2, (h - cote) / 2, cote, cote, 0, 0, taille, taille);
    try { return c.toDataURL("image/jpeg", qualite); } catch (e) { return null; }
  }

  return { mediaDispo, camera, micro, inclinaison, toutArreter, vignette };
})();
