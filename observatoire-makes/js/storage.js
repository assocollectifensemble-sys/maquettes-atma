/* ============================================================
   STORAGE.JS — Progression et réglages (localStorage, tout reste
   sur le téléphone : aucune donnée envoyée, aucun compte).
   ============================================================ */
(function () {
  "use strict";
  const KEY = "makes-ticfil-v1";
  const defaut = {
    etoiles: { 1: false, 2: false, 3: false, b: false },
    nom: "", theme: "ciel", public: "famille", son: true, voix: "fr", tolerance: 18, intro: false, sunOk: false
  };
  let mem = null;
  function charge() {
    if (mem) return mem;
    try { mem = Object.assign({}, defaut, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { mem = Object.assign({}, defaut); }
    mem.etoiles = Object.assign({}, defaut.etoiles, mem.etoiles || {});
    return mem;
  }
  function sauve() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* mode privé : on continue en mémoire */ } }
  window.Store = {
    get(k) { return charge()[k]; },
    set(k, v) { charge()[k] = v; sauve(); },
    star(id, v) { charge().etoiles[id] = v !== false; sauve(); },
    stars() { return charge().etoiles; },
    count() { return Object.values(charge().etoiles).filter(Boolean).length; },
    reset() { mem = Object.assign({}, defaut, { theme: charge().theme }); mem.etoiles = Object.assign({}, defaut.etoiles); sauve(); }
  };
})();
