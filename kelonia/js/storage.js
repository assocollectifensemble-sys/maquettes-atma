/* ============================================================
   STORAGE.JS — Progression et réglages (localStorage). Tout reste sur
   le téléphone : aucune donnée envoyée, aucun compte, aucun traceur.
   ============================================================ */
(function () {
  "use strict";
  const KEY = "kelonia-kawann-v1";
  const defaut = () => ({
    faits: { 1: false, 2: false, 3: false, 4: false, 5: false },
    nom: "", equipe: [], tour: 0, public: "famille", lang: "fr", theme: "lagon",
    taille: 1, facile: false, son: true, intro: false, edits: {}
  });
  let mem = null;
  function charge() {
    if (mem) return mem;
    try { mem = Object.assign(defaut(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { mem = defaut(); }
    mem.faits = Object.assign(defaut().faits, mem.faits || {});
    return mem;
  }
  function sauve() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* mode privé : on continue en mémoire */ } }
  window.Store = {
    get(k) { return charge()[k]; },
    set(k, v) { charge()[k] = v; sauve(); },
    fait(id, v) { charge().faits[id] = v !== false; sauve(); },
    faits() { return charge().faits; },
    count() { return Object.values(charge().faits).filter(Boolean).length; },
    // remise à zéro de la partie (on garde les réglages et les textes modifiés dans l'éditeur)
    reset() { const c = charge(); mem = Object.assign(defaut(), { theme: c.theme, taille: c.taille, facile: c.facile, son: c.son, lang: c.lang, public: c.public, edits: c.edits }); sauve(); }
  };
})();
