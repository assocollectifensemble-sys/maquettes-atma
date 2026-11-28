/* ============================================================
   AUDIO.JS — sons de jeu synthétisés en WebAudio + voix enregistrées
   ------------------------------------------------------------
   - Effets courts générés à la volée (aucun fichier, aucune voix).
   - Voix de Croki : fichiers assets/audio/voix/<clé>.mp3 UNIQUEMENT,
     joués si la clé figure dans CONFIG.voix. Sinon : silence.
   - Vibrations courtes si le téléphone sait le faire.
   ============================================================ */

const Sons = (() => {
  let ctx = null, master = null, actif = true, voixEnCours = null;

  function contexte() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  // Débloque l'audio au premier geste (exigence iOS / Chrome)
  function debloquer() { contexte(); }

  function env(g, t, a, d, v) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function note(freq, debut, duree, type = "sine", vol = 0.35, glisse = 0) {
    const c = contexte(); if (!c || !actif) return;
    const t = c.currentTime + debut;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glisse), t + duree);
    env(g, t, 0.008, duree, vol);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + duree + 0.05);
  }

  function bruit(debut, duree, vol = 0.3, filtre = 6000, typeFiltre = "highpass") {
    const c = contexte(); if (!c || !actif) return;
    const t = c.currentTime + debut;
    const n = Math.floor(c.sampleRate * (duree + 0.05));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = typeFiltre; f.frequency.value = filtre;
    const g = c.createGain(); env(g, t, 0.003, duree, vol);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + duree + 0.05);
  }

  // Les trois sons du beatbox (boum / tchak / tss) + un son de « pad »
  const tambours = {
    boum() { note(150, 0, 0.32, "sine", 0.9, -105); note(60, 0, 0.25, "triangle", 0.4); },
    tchak() { bruit(0, 0.16, 0.5, 1400, "bandpass"); note(220, 0, 0.09, "triangle", 0.25, -60); },
    tss() { bruit(0, 0.09, 0.32, 7000, "highpass"); }
  };

  const effets = {
    tap() { note(660, 0, 0.06, "triangle", 0.18); },
    bonne() { [523, 659, 784, 1046].forEach((f, i) => note(f, i * 0.07, 0.22, "triangle", 0.28)); },
    faux() { note(330, 0, 0.16, "sine", 0.22, -80); note(247, 0.14, 0.24, "sine", 0.22, -60); },
    lettre() { [784, 988, 1175, 1568].forEach((f, i) => note(f, i * 0.06, 0.3, "sine", 0.22)); bruit(0.05, 0.25, 0.06, 9000); },
    declic() { bruit(0, 0.05, 0.5, 2500, "highpass"); bruit(0.08, 0.07, 0.35, 1800, "bandpass"); },
    pop() { note(420, 0, 0.09, "sine", 0.3, 500); },
    whoosh() { bruit(0, 0.4, 0.12, 900, "bandpass"); },
    couac() { note(520, 0, 0.13, "sawtooth", 0.16, -220); note(470, 0.13, 0.11, "square", 0.08, -180); },
    fanfare() {
      [[523, 0], [659, .12], [784, .24], [1046, .36], [784, .54], [1046, .66]].forEach(([f, t]) => {
        note(f, t, 0.28, "square", 0.08); note(f, t, 0.3, "triangle", 0.18);
      });
    },
    plume() { note(880 + Math.random() * 300, 0, 0.12, "sine", 0.12, 300); }
  };

  function jouer(nom) {
    try {
      if (tambours[nom]) tambours[nom]();
      else if (effets[nom]) effets[nom]();
    } catch (e) { /* audio indisponible : le jeu continue */ }
  }

  function vibrer(motif) {
    try { if (actif && navigator.vibrate) navigator.vibrate(motif); } catch (e) {}
  }

  // ---------- Voix enregistrées (jamais de synthèse vocale) ----------
  function voixDispo(cle) {
    return Array.isArray(CONFIG.voix) && CONFIG.voix.includes(cle);
  }
  function dire(cle) {
    arreterVoix();
    if (!actif || !voixDispo(cle)) return false;
    try {
      voixEnCours = new Audio(`assets/audio/voix/${cle}.mp3`);
      voixEnCours.play().catch(() => {});
      return true;
    } catch (e) { return false; }
  }
  function arreterVoix() {
    if (voixEnCours) { try { voixEnCours.pause(); } catch (e) {} voixEnCours = null; }
  }

  // Fichier de victoire repris de la v28 (fête finale)
  function victoire() {
    if (!actif) return;
    try { const a = new Audio("assets/audio/victoire.mp3"); a.volume = 0.8; a.play().catch(() => {}); } catch (e) {}
  }

  return {
    debloquer, jouer, vibrer, dire, voixDispo, arreterVoix, victoire,
    get actif() { return actif; },
    set actif(v) { actif = !!v; if (!actif) arreterVoix(); },
    contexte
  };
})();
