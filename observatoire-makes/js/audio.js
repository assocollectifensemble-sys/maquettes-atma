/* ============================================================
   AUDIO.JS — Sons (Web Audio, aucun fichier) et voix.
   Sons : petites cloches (sinus + harmoniques), « scintillement » d'étoile,
          « fffuit » d'étoile filante (bruit filtré), écho spatial léger.
          Tout est généré à la volée : rien à télécharger, marche hors connexion.
   Voix : emplacement prévu pour des enregistrements
          assets/audio/<id>.fr.mp3  et  assets/audio/<id>.kr.mp3
          → ajouter l'identifiant dans VOIX_ENREGISTREES ci-dessous (évite de « sonder »
            le serveur et les erreurs 404 / hors connexion).
          Sinon : FR → synthèse vocale du navigateur (démo seulement)
                  KR → pas de synthèse (pas de voix créole fiable) : texte écrit affiché
   ============================================================ */
(function () {
  "use strict";
  // Liste des fichiers voix réellement déposés dans assets/audio/ (ex. "s1b.fr", "s1b.kr")
  const VOIX_ENREGISTREES = [];

  let ctx = null, bus = null, tick = null;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ctx = new C();
      // bus de sortie : compresseur doux + écho court (« espace ») mélangé à 18 %
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.19; fb.gain.value = 0.32; wet.gain.value = 0.18; lp.type = "lowpass"; lp.frequency.value = 2600;
      bus = ctx.createGain(); bus.gain.value = 0.9;
      bus.connect(comp); bus.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const on = () => Store.get("son");

  // Note simple avec enveloppe (attaque courte, décroissance exponentielle)
  function note(freq, dur, type, vol, when, glideTo) {
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.03);
  }
  // Cloche : fondamentale + 2 harmoniques inharmoniques (timbre « verre »)
  function cloche(f, when, vol, dur) {
    vol = vol || 0.13; dur = dur || 0.9;
    note(f, dur, "sine", vol, when); note(f * 2.76, dur * 0.5, "sine", vol * 0.35, when); note(f * 5.4, dur * 0.25, "sine", vol * 0.15, when);
  }
  // Bruit filtré qui balaie (étoile filante)
  function fuit(when, dur, from, to, vol) {
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; bp.type = "bandpass"; bp.Q.value = 6;
    bp.frequency.setValueAtTime(from, t); bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.25, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(bus); src.start(t); src.stop(t + dur + 0.05);
  }
  const DO = 523.25, MI = 659.25, SOL = 783.99;

  const Sfx = {
    unlock() { ac(); },
    tap() { note(740, 0.06, "triangle", 0.07); },
    page() { note(420, 0.12, "sine", 0.05, 0, 620); },                     // passage d'écran (discret)
    ok() { cloche(DO, 0, .12); cloche(MI, .09, .12); cloche(SOL * 2, .18, .1, 1.2); },
    ko() { note(330, .22, "sine", .12, 0, 220); note(262, .26, "sine", .08, .12, 175); }, // « bloop » doux, pas de son agressif
    filante() { fuit(0, 0.9, 5200, 900, 0.22); [SOL * 2, MI * 2, DO * 2].forEach((f, i) => cloche(f, .25 + i * .07, .05, .5)); },
    scintille() { [0, 1, 2, 3, 4, 5].forEach(i => cloche(1500 + Math.random() * 1600, i * 0.06, 0.035, 0.35)); },
    etoile() { fuit(0, .5, 1800, 6000, .08); [DO, MI, SOL, DO * 2, MI * 2].forEach((f, i) => cloche(f, .12 + i * .09, .11, 1.1)); Sfx.scintille(); },
    trouve() { cloche(SOL, 0, .13); cloche(DO * 2, .1, .13); cloche(MI * 2, .2, .12, 1.4); },
    fin() {
      [DO, MI, SOL, DO * 2, SOL, DO * 2, MI * 2, SOL * 2].forEach((f, i) => cloche(f, i * .14, .11, 1.1));
      [DO, MI, SOL].forEach(f => note(f / 2, 1.8, "triangle", .05, 1.1)); fuit(1.0, 1.2, 6000, 1200, .1);
    },
    // ping « chaud/froid » : plus c'est proche, plus c'est rapide et aigu
    ping(dist, tol) {
      const k = Math.max(0, Math.min(1, 1 - dist / (tol * 5)));
      note(330 + k * 700, 0.09 + k * .05, "sine", .11 + k * .05);
      if (k > .8) note((330 + k * 700) * 1.5, .06, "sine", .04, .02);
    }
  };

  // Boucle de ping pilotée par la distance (coupée quand l'onglet est caché)
  function startPing(getDist, tol) {
    stopPing();
    let last = 0;
    tick = setInterval(() => {
      if (document.hidden) return;
      const d = getDist(); if (d == null) return;
      const k = Math.max(0, Math.min(1, 1 - d / (tol * 5)));
      const gap = 1500 - k * 1300; // ms entre deux pings
      const n = performance.now();
      if (n - last >= gap) { last = n; Sfx.ping(d, tol); }
    }, 60);
  }
  function stopPing() { if (tick) clearInterval(tick); tick = null; }

  // ---------- Voix ----------
  let audioEl = null;
  function stopVoix() {
    if (audioEl) { audioEl.pause(); audioEl = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // retourne 'fichier' | 'synthese' | 'aucune'
  async function parle(id, lang, texte) {
    stopVoix();
    if (VOIX_ENREGISTREES.includes(id + "." + lang)) {
      audioEl = new Audio("assets/audio/" + id + "." + lang + ".mp3");
      try { await audioEl.play(); return "fichier"; } catch (e) { /* lecture refusée : on tente la synthèse */ }
    }
    if (lang === "fr" && window.speechSynthesis && texte) {
      const u = new SpeechSynthesisUtterance(texte.replace(/\s+/g, " "));
      u.lang = "fr-FR"; u.rate = 0.98; u.pitch = 1.15;
      const v = speechSynthesis.getVoices().find(x => /^fr/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u); return "synthese";
    }
    return "aucune";
  }
  function vibre(p) { try { if (Store.get("son") && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignoré */ } }

  window.Audio2 = { Sfx, startPing, stopPing, parle, stopVoix, vibre };
})();
