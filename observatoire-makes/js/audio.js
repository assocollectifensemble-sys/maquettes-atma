/* ============================================================
   AUDIO.JS — Sons (WebAudio, aucun fichier) et voix.
   Voix : emplacement prévu pour des enregistrements
          assets/audio/<id>.fr.mp3  et  assets/audio/<id>.kr.mp3
          Si le fichier n'existe pas :
            - FR  → synthèse vocale du navigateur (Web Speech API, démo seulement)
            - KR  → pas de synthèse (pas de voix créole fiable) : texte écrit affiché
   ============================================================ */
(function () {
  "use strict";
  let ctx = null, tick = null;
  function ac() {
    if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function bip(freq, dur, type, vol, when) {
    if (!Store.get("son")) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const Sfx = {
    unlock() { ac(); },
    tap() { bip(520, 0.07, "triangle", 0.12); },
    ok() { bip(660, .12, "triangle", .2); bip(880, .12, "triangle", .2, .11); bip(1175, .22, "triangle", .2, .22); },
    ko() { bip(220, .18, "sawtooth", .12); bip(165, .24, "sawtooth", .12, .15); },
    etoile() { [523, 659, 784, 1047, 1319].forEach((f, i) => bip(f, .3, "sine", .2, i * .1)); },
    fin() { [523, 659, 784, 659, 784, 1047, 1319, 1568].forEach((f, i) => bip(f, .35, "triangle", .2, i * .13)); },
    // ping « chaud/froid » : plus c'est proche, plus c'est rapide et aigu
    ping(dist, tol) {
      const k = Math.max(0, Math.min(1, 1 - dist / (tol * 5)));
      bip(330 + k * 700, 0.09 + k * .04, "sine", .16);
    }
  };
  // Boucle de ping pilotée par la distance
  function startPing(getDist, tol) {
    stopPing();
    let last = 0;
    tick = setInterval(() => {
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
  const dispo = {};
  async function fichierExiste(url) {
    if (url in dispo) return dispo[url];
    try { const r = await fetch(url, { method: "HEAD" }); dispo[url] = r.ok && /audio/.test(r.headers.get("content-type") || ""); }
    catch (e) { dispo[url] = false; }
    return dispo[url];
  }
  function stopVoix() {
    if (audioEl) { audioEl.pause(); audioEl = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
  }
  // retourne 'fichier' | 'synthese' | 'aucune'
  async function parle(id, lang, texte) {
    stopVoix();
    const url = "assets/audio/" + id + "." + lang + ".mp3";
    if (await fichierExiste(url)) { audioEl = new Audio(url); audioEl.play(); return "fichier"; }
    if (lang === "fr" && window.speechSynthesis) {
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
