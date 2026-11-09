/* ============================================================
   STORAGE.JS — Progression et réglages (localStorage), propres à chaque hôtel.
   Tout reste sur le téléphone : aucune donnée envoyée, aucun compte, aucun traceur.
   ============================================================ */
(function () {
  "use strict";
  const KEY = "aventure-" + ((window.H && window.H.id) || "hotel") + "-v1";
  const defaut = () => ({ faits: {}, etoiles: {}, son: true, promesse: null, avis: null, code: null, bonus: {} });
  let mem = null;
  function charge() {
    if (mem) return mem;
    try { mem = Object.assign(defaut(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { mem = defaut(); }
    return mem;
  }
  function sauve() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* mode privé : on continue en mémoire */ } }
  window.Store = {
    get(k) { return charge()[k]; },
    set(k, v) { charge()[k] = v; sauve(); },
    fait(id, etoiles) { const c = charge(); c.faits[id] = true; c.etoiles[id] = Math.max(c.etoiles[id] || 0, etoiles || 1); sauve(); },
    faits() { return charge().faits; },
    reset() { const son = charge().son; mem = Object.assign(defaut(), { son }); sauve(); }
  };
})();
