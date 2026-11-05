/* ============================================================
   AUDIO.JS — Sons (Web Audio, générés à la volée : rien à télécharger,
   marche hors connexion) et voix.
   Sons : cloches de verre, « fffuit » de comète, moteur de coupole,
          ouverture de trappe, scintillement, fanfare douce. Jamais de son agressif.
   Voix : emplacement prévu pour les enregistrements de Jonathan
          assets/audio/<id>.<lang>.mp3   (lang = fr | kr | en)
          → AJOUTER l'identifiant (ex. "intro0.fr") dans VOIX_ENREGISTREES
            ci-dessous ET le chemin dans sw.js (pas de sonde réseau : aucune 404).
          Sinon : FR et EN → synthèse vocale du navigateur (en attendant) ;
                  KR → pas de synthèse créole fiable : texte affiché + message.
   ============================================================ */
(function () {
  "use strict";
  const VOIX_ENREGISTREES = []; // ex. ["intro0.fr", "intro0.kr"]

  let ctx = null, bus = null, tick = null;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ctx = new C();
      // bus : compresseur doux + écho « spatial » court mélangé à 18 %
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.21; fb.gain.value = 0.33; wet.gain.value = 0.18; lp.type = "lowpass"; lp.frequency.value = 2400;
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
  function cloche(f, when, vol, dur) {
    vol = vol || 0.12; dur = dur || 0.9;
    note(f, dur, "sine", vol, when); note(f * 2.76, dur * 0.5, "sine", vol * 0.32, when); note(f * 5.4, dur * 0.25, "sine", vol * 0.12, when);
  }
  function bruit(when, dur, type, from, to, vol, q) { // bruit filtré qui balaie (comète, moteur, trappe)
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = type; f.Q.value = q || 4;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus); src.start(t); src.stop(t + dur + 0.05);
  }
  const DO = 523.25, RE = 587.33, MI = 659.25, SOL = 783.99, LA = 880;

  const Sfx = {
    unlock() { ac(); },
    tap() { note(760, 0.05, "triangle", 0.06); },
    page() { note(440, 0.12, "sine", 0.045, 0, 660); },
    bulle() { note(620, .09, "sine", .06, 0, 940); },
    ok() { cloche(DO * 2, 0, .11); cloche(MI * 2, .09, .11); cloche(SOL * 2, .18, .1, 1.2); },
    ko() { note(330, .22, "sine", .11, 0, 220); note(262, .26, "sine", .07, .12, 175); },
    comete() { bruit(0, 1.1, "bandpass", 5200, 700, 0.2, 6); [SOL * 2, MI * 2, DO * 2].forEach((f, i) => cloche(f, .3 + i * .08, .05, .6)); },
    scintille() { [0, 1, 2, 3, 4, 5].forEach(i => cloche(1500 + Math.random() * 1700, i * 0.06, 0.03, 0.35)); },
    repere() { bruit(0, .5, "bandpass", 1800, 6000, .07, 5); [DO, MI, SOL, DO * 2, MI * 2].forEach((f, i) => cloche(f, .12 + i * .09, .1, 1.1)); Sfx.scintille(); },
    trouve() { cloche(SOL, 0, .12); cloche(DO * 2, .1, .12); cloche(MI * 2, .2, .11, 1.4); },
    moteur(dur) { bruit(0, dur || .5, "lowpass", 180, 260, .12, 2); note(70, dur || .5, "triangle", .03); },
    trappe() { bruit(0, .9, "lowpass", 300, 1400, .12, 1.5); cloche(RE * 2, .85, .05, .5); },
    clic() { note(1800, .02, "square", .025); },
    fanfare() {
      [DO, MI, SOL, DO * 2, SOL, DO * 2, MI * 2, SOL * 2].forEach((f, i) => cloche(f, i * .13, .1, 1.1));
      [DO, MI, SOL].forEach(f => note(f / 2, 1.8, "triangle", .045, 1.05)); bruit(1.0, 1.2, "bandpass", 6000, 1200, .08, 6);
    },
    ping(dist, tol) { // « chaud/froid » : plus c'est proche, plus c'est rapide et aigu
      const k = Math.max(0, Math.min(1, 1 - dist / (tol * 5)));
      note(330 + k * 700, 0.09 + k * .05, "sine", .1 + k * .05);
      if (k > .8) note((330 + k * 700) * 1.5, .06, "sine", .04, .02);
    },
    accord() { cloche(LA, 0, .07, .6); cloche(LA * 1.5, .05, .05, .6); }
  };
  function startPing(getDist, tol) {
    stopPing(); let last = 0;
    tick = setInterval(() => {
      if (document.hidden) return;
      const d = getDist(); if (d == null) return;
      const k = Math.max(0, Math.min(1, 1 - d / (tol * 5))), gap = 1500 - k * 1300, n = performance.now();
      if (n - last >= gap) { last = n; Sfx.ping(d, tol); }
    }, 60);
  }
  function stopPing() { if (tick) clearInterval(tick); tick = null; }

  // ---------- voix ----------
  let audioEl = null;
  function stopVoix() { if (audioEl) { audioEl.pause(); audioEl = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
  async function parle(id, lang, texte) { // → "fichier" | "synthese" | "aucune"
    stopVoix();
    if (VOIX_ENREGISTREES.includes(id + "." + lang)) {
      audioEl = new Audio("assets/audio/" + id + "." + lang + ".mp3");
      try { await audioEl.play(); return "fichier"; } catch (e) { /* lecture refusée : synthèse */ }
    }
    if ((lang === "fr" || lang === "en") && window.speechSynthesis && texte) {
      const u = new SpeechSynthesisUtterance(texte.replace(/\s+/g, " "));
      u.lang = lang === "en" ? "en-GB" : "fr-FR"; u.rate = 0.98; u.pitch = 1.2;
      const v = speechSynthesis.getVoices().find(x => new RegExp("^" + lang, "i").test(x.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u); return "synthese";
    }
    return "aucune";
  }
  function vibre(p) { try { if (Store.get("son") && navigator.vibrate) navigator.vibrate(p); } catch (e) { } }

  window.Audio2 = { Sfx, startPing, stopPing, parle, stopVoix, vibre, VOIX_ENREGISTREES };
})();
