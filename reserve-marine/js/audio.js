/* ============================================================
   AUDIO.JS — Sons (Web Audio, générés à la volée : rien à télécharger,
   marche hors connexion) et voix.
   Sons : bulles, vagues (bruit filtré), clochettes, petit « tic » de mètre.
   Voix : emplacement prévu pour les enregistrements de Jonathan
          assets/audio/<id>.<lang>.mp3   (lang = fr | kr | en)
          → AJOUTER l'identifiant dans VOIX_ENREGISTREES ci-dessous
            (évite de sonder le serveur : pas d'erreur 404, rien hors ligne).
          Sinon : FR et EN → synthèse vocale du navigateur (en attendant),
                  KR → pas de synthèse créole fiable : texte affiché + message.
   ============================================================ */
(function () {
  "use strict";
  // Fichiers voix réellement déposés dans assets/audio/ (ex. "intro0.fr", "intro0.kr")
  const VOIX_ENREGISTREES = [];

  let ctx = null, bus = null;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ctx = new C();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      // petit écho « sous-marin » (filtré) mélangé à 16 %
      const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.16; fb.gain.value = 0.28; wet.gain.value = 0.16; lp.type = "lowpass"; lp.frequency.value = 1800;
      bus = ctx.createGain(); bus.gain.value = 0.9;
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
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.03);
  }
  function cloche(f, when, vol, dur) { vol = vol || .12; dur = dur || .8; note(f, dur, "sine", vol, when); note(f * 2.76, dur * .45, "sine", vol * .3, when); }
  // bruit filtré : vague (passe-bas qui s'ouvre puis se referme)
  function souffle(when, dur, from, to, vol) {
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = "lowpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur * .5); f.frequency.exponentialRampToValueAtTime(from, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .2, t + dur * .45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus); src.start(t); src.stop(t + dur + .05);
  }
  const DO = 523.25, MI = 659.25, SOL = 783.99, LA = 880;
  const Sfx = {
    unlock() { ac(); },
    tap() { note(700, .05, "triangle", .06); },
    page() { note(380, .14, "sine", .05, 0, 760); },                                    // « bloup » de bulle montante
    bulle() { note(300, .12, "sine", .12, 0, 900); note(500, .08, "sine", .06, .07, 1300); },
    bip() { note(1320, .07, "square", .03); note(1760, .07, "square", .025, .08); },   // scanner
    tic() { note(2400, .02, "triangle", .03); },
    clic() { note(220, .06, "triangle", .08, 0, 120); },                                // interrupteur
    vague() { souffle(0, 2.2, 300, 1600, .22); },
    ok() { cloche(DO, 0, .11); cloche(MI, .08, .11); cloche(SOL * 2, .16, .09, 1.1); },
    ko() { note(330, .2, "sine", .1, 0, 230); note(262, .24, "sine", .07, .1, 180); },  // doux, jamais agressif
    indice() { [SOL, LA, DO * 2, MI * 2].forEach((f, i) => cloche(f, i * .08, .09, .9)); Sfx.bulle(); },
    fanfare() { souffle(0, 2.4, 300, 1400, .16); [DO, MI, SOL, DO * 2, SOL, DO * 2, MI * 2, SOL * 2].forEach((f, i) => cloche(f, .2 + i * .13, .1, 1.1)); [DO, MI, SOL].forEach(f => note(f / 2, 1.8, "triangle", .04, 1.2)); }
  };

  // ---------- Voix ----------
  let audioEl = null;
  function stopVoix() { if (audioEl) { audioEl.pause(); audioEl = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  // retourne 'fichier' | 'synthese' | 'aucune'
  // VOIX COUPÉES (demande de Jonathan, 29/10) : le bouton reste visible mais ne joue rien.
  // Pour réactiver : VOIX_ACTIVES = true.
  const VOIX_ACTIVES = false;
  async function parle(id, lang, texte) {
    stopVoix();
    if (!VOIX_ACTIVES) return "muet";
    if (VOIX_ENREGISTREES.includes(id + "." + lang)) {
      audioEl = new Audio("assets/audio/" + id + "." + lang + ".mp3");
      try { await audioEl.play(); return "fichier"; } catch (e) { /* lecture refusée : on tente la synthèse */ }
    }
    if ((lang === "fr" || lang === "en") && window.speechSynthesis && texte) {
      const u = new SpeechSynthesisUtterance(texte.replace(/\s+/g, " "));
      u.lang = lang === "fr" ? "fr-FR" : "en-GB"; u.rate = .97; u.pitch = 1.05;
      const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u); return "synthese";
    }
    return "aucune";
  }
  function vibre(p) { try { if (Store.get("son") && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignoré */ } }
  window.Audio2 = { Sfx, parle, stopVoix, vibre, VOIX_ENREGISTREES };
})();
