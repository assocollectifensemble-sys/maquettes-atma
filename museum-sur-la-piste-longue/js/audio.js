/* ============================================================
   AUDIO.JS — Sons (Web Audio, fabriqués à la volée : zéro fichier,
   fonctionne hors connexion) et voix.
   Sons : papier qui se tourne, coup de pinceau, os qui s'emboîte,
          coup de tampon, petit vent (le pétrel), clochettes de victoire.
   Voix : emplacement prévu pour les enregistrements de Jonathan
          assets/audio/<id>.<lang>.mp3   (lang = fr | kr | en)
          → AJOUTER l'identifiant dans VOIX_ENREGISTREES ci-dessous
            (et le chemin dans sw.js pour le hors connexion).
          En attendant : FR et EN → synthèse vocale du navigateur ;
          KR → texte affiché, la voix créole viendra de Jonathan.
   ============================================================ */
(function () {
  "use strict";
  // Fichiers voix réellement déposés dans assets/audio/ (ex. "intro0.fr", "intro0.kr")
  const VOIX_ENREGISTREES = [];

  let ctx = null, bus = null;
  // zéro son ni vibration avant le premier toucher (arrivée directe par un lien ou un QR)
  const geste = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
  function ac() {
    if (!geste()) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ctx = new C();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      // légère réverbération « grande salle de musée » (écho filtré mélangé à 14 %)
      const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.11; fb.gain.value = 0.3; wet.gain.value = 0.14; lp.type = "lowpass"; lp.frequency.value = 2400;
      bus = ctx.createGain(); bus.gain.value = 0.85;
      bus.connect(comp); bus.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  const on = () => Store.get("son");
  function note(freq, dur, type, vol, when, glideTo) {
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.03);
  }
  function cloche(f, when, vol, dur) { vol = vol || .1; dur = dur || .8; note(f, dur, "sine", vol, when); note(f * 3.01, dur * .35, "sine", vol * .25, when); }
  // bruit filtré (papier, pinceau, vent)
  function bruit(when, dur, type, from, to, vol, q) {
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = type; f.Q.value = q || 1;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .15, t + dur * .2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus); src.start(t); src.stop(t + dur + .05);
  }
  const DO = 523.25, RE = 587.33, MI = 659.25, SOL = 783.99, LA = 880;
  let dernierPinceau = 0;
  const Sfx = {
    unlock() { ac(); },
    tap() { note(760, .045, "triangle", .05); },
    page() { bruit(0, .22, "bandpass", 1800, 5200, .09, 1.4); },                       // page de carnet tournée
    pinceau() { const n = performance.now(); if (n - dernierPinceau < 110) return; dernierPinceau = n; bruit(0, .12, "highpass", 2600, 4200, .035, .7); },
    os() { note(1150, .05, "triangle", .1); note(620, .09, "triangle", .07, .03); },    // os qui s'emboîte (petit « toc » de bois)
    tampon() { note(110, .22, "sine", .22, 0, 55); bruit(0, .09, "lowpass", 900, 200, .2); },
    vent() { bruit(0, 1.4, "bandpass", 500, 1400, .12, 2.5); },
    decouverte() { [SOL, LA, DO * 2, MI * 2].forEach((f, i) => cloche(f, i * .07, .08, .9)); },
    ok() { cloche(DO, 0, .1); cloche(MI, .08, .1); cloche(SOL * 2, .16, .08, 1.1); },
    ko() { note(330, .2, "sine", .09, 0, 240); note(262, .24, "sine", .06, .1, 190); },   // doux, bienveillant
    temps() { note(1600, .03, "square", .02); },                                         // cliquet de la frise du temps
    fanfare() { Sfx.vent(); [DO, MI, SOL, DO * 2, SOL, DO * 2, MI * 2, SOL * 2].forEach((f, i) => cloche(f, .15 + i * .12, .09, 1.1)); [DO, MI, SOL].forEach(f => note(f / 2, 1.8, "triangle", .035, 1.1)); }
  };

  // ---------- Voix ----------
  let audioEl = null;
  function stopVoix() { if (audioEl) { audioEl.pause(); audioEl = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  // retourne 'fichier' | 'synthese' | 'attente' (créole : voix de Jonathan à venir)
  const VOIX_ACTIVES = true;
  async function parle(id, lang, texte) {
    stopVoix();
    if (!VOIX_ACTIVES) return "muet";
    if (VOIX_ENREGISTREES.includes(id + "." + lang)) {
      audioEl = new Audio("assets/audio/" + id + "." + lang + ".mp3");
      try { await audioEl.play(); return "fichier"; } catch (e) { /* lecture refusée : on passe à la synthèse */ }
    }
    if ((lang === "fr" || lang === "en") && window.speechSynthesis && texte) {
      const u = new SpeechSynthesisUtterance(texte.replace(/\s+/g, " "));
      u.lang = lang === "fr" ? "fr-FR" : "en-GB"; u.rate = .96; u.pitch = 1.08;
      const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u); return "synthese";
    }
    return "attente";
  }
  function vibre(p) { try { if (geste() && Store.get("son") && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignoré */ } }
  window.Audio2 = { Sfx, parle, stopVoix, vibre, VOIX_ENREGISTREES };
})();
