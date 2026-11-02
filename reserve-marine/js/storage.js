/* ============================================================
   STORAGE.JS — Progression et réglages (localStorage). Tout reste sur
   le téléphone : aucune donnée envoyée, aucun compte, aucun traceur.
   ============================================================ */
(function () {
  "use strict";
  const KEY = "reserve-marine-lagon-v2";
  const defaut = () => ({ faits: {}, etoiles: {}, public: "famille", theme: "lagon", taille: 1, son: true, intro: false });
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
    fait(id, v, etoiles) { const c = charge(); c.faits[id] = v !== false; if (etoiles) c.etoiles[id] = Math.max(c.etoiles[id] || 0, etoiles); if (v === false) delete c.etoiles[id]; sauve(); },
    faits() { return charge().faits; },
    count() { return Object.values(charge().faits).filter(Boolean).length; },
    reset() { const c = charge(); mem = Object.assign(defaut(), { theme: c.theme, taille: c.taille, son: c.son, public: c.public }); sauve(); }
  };
})();
