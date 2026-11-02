/* ============================================================
   AUDIO.JS — Sons discrets, générés à la volée par Web Audio
   (rien à télécharger : fonctionne hors connexion). Coupables dans les réglages.
   Voix : prévues dans l'application complète (voix enregistrées FR / kréol / EN) ;
   emplacement : assets/audio/<id>.<fr|kr|en>.mp3.
   Moteur repris du prototype Kélonia (« Le dossier Kawann »), sons adaptés au lagon.
   ============================================================ */
(function () {
  "use strict";
  let ctx = null, bus = null;
  function ac() {
    if (!ctx) {
      const K = window.AudioContext || window.webkitAudioContext; if (!K) return null;
      ctx = new K();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      // petit écho « sous-marin » filtré, mélangé à 14 %
      const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.15; fb.gain.value = 0.25; wet.gain.value = 0.14; lp.type = "lowpass"; lp.frequency.value = 1800;
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
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.03);
  }
  function cloche(f, when, vol, dur) { vol = vol || .1; dur = dur || .8; note(f, dur, "sine", vol, when); note(f * 2.76, dur * .45, "sine", vol * .3, when); }
  // bruit filtré : vague, éclaboussure, craquement
  function bruit(when, dur, type, from, to, vol, q) {
    if (!on()) return; const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0), n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf; f.type = type; f.Q.value = q || 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur * .5); f.frequency.exponentialRampToValueAtTime(from, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .2, t + Math.min(.02, dur * .2) + dur * (type === "lowpass" ? .4 : 0)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus); src.start(t); src.stop(t + dur + .05);
  }
  const DO = 523.25, MI = 659.25, SOL = 783.99, LA = 880;
  const Sfx = {
    unlock() { ac(); },
    tap() { note(700, .05, "triangle", .05); },
    page() { note(380, .14, "sine", .05, 0, 760); },
    bulle() { note(300, .12, "sine", .1, 0, 900); note(500, .08, "sine", .05, .07, 1300); },
    ramasse() { note(520, .07, "triangle", .08, 0, 1040); note(1040, .1, "sine", .05, .05, 1560); },
    doux() { note(440, .12, "sine", .06, 0, 520); },
    plouf() { bruit(0, .5, "bandpass", 1200, 300, .18, 2); note(260, .3, "sine", .08, 0, 90); },
    crac() { bruit(0, .12, "highpass", 2400, 3800, .2, .8); bruit(.06, .1, "highpass", 2000, 3000, .14, .8); note(140, .12, "square", .04, 0, 80); },
    vague() { bruit(0, 2.2, "lowpass", 300, 1500, .2); },
    ok() { cloche(DO, 0, .1); cloche(MI, .08, .1); cloche(SOL * 2, .16, .08, 1.1); },
    ko() { note(330, .2, "sine", .09, 0, 230); note(262, .24, "sine", .06, .1, 180); },
    indice() { [SOL, LA, DO * 2, MI * 2].forEach((f, i) => cloche(f, i * .08, .08, .9)); Sfx.bulle(); },
    fanfare() { bruit(0, 2.4, "lowpass", 300, 1300, .14); [DO, MI, SOL, DO * 2, SOL, DO * 2, MI * 2, SOL * 2].forEach((f, i) => cloche(f, .2 + i * .13, .09, 1.1)); [DO, MI, SOL].forEach(f => note(f / 2, 1.8, "triangle", .035, 1.2)); }
  };
  function vibre(p) { try { if (Store.get("son") && navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignoré */ } }
  window.Audio2 = { Sfx, vibre };
})();
