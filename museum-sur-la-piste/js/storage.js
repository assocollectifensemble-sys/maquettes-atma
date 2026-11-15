/* ============================================================
   STORAGE.JS — Progression, réglages et statistiques anonymes,
   tout reste sur le téléphone (localStorage) : zéro compte, zéro traceur.
   Les statistiques locales alimentent l'aperçu du tableau de bord
   (?station=stats). Dans l'application complète, elles seront
   regroupées de façon anonyme pour le Muséum.
   ============================================================ */
(function () {
  "use strict";
  const KEY = "museum-piste-v1";
  const ETAPES = ["1", "2", "3", "4", "5", "jardin"];
  const defaut = () => ({
    faits: { 1: false, 2: false, 3: false, 4: false, 5: false, jardin: false },
    nom: "", equipe: [], tour: 0, tablette: false,
    public: "famille", lang: "fr", theme: "salle", taille: 1, son: true, intro: false,
    stats: { lancements: 0, departs: 0, etapes: {}, durees: {}, langues: {}, publics: {}, quiz: {}, fins: 0 }
  });
  let mem = null;
  function charge() {
    if (mem) return mem;
    try { mem = Object.assign(defaut(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { mem = defaut(); }
    mem.faits = Object.assign(defaut().faits, mem.faits || {});
    mem.stats = Object.assign(defaut().stats, mem.stats || {});
    return mem;
  }
  function sauve() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* navigation privée : on continue en mémoire */ } }
  const inc = (o, k, n) => { o[k] = (o[k] || 0) + (n == null ? 1 : n); };
  window.Store = {
    ETAPES,
    get(k) { return charge()[k]; },
    set(k, v) { charge()[k] = v; sauve(); },
    fait(id, v) { charge().faits[id] = v !== false; sauve(); },
    faits() { return charge().faits; },
    count() { return ETAPES.filter(k => charge().faits[k]).length; },
    // nouvelle partie : on garde les réglages et les statistiques
    reset() { const c = charge(); mem = Object.assign(defaut(), { theme: c.theme, taille: c.taille, son: c.son, lang: c.lang, public: c.public, tablette: c.tablette, stats: c.stats }); sauve(); },
    Stats: {
      lancement() { inc(charge().stats, "lancements"); sauve(); },
      depart() { const s = charge().stats; inc(s, "departs"); inc(s.langues, charge().lang); inc(s.publics, charge().public + (charge().tablette ? "-tablette" : "")); sauve(); },
      etape(id, secondes) { const s = charge().stats; inc(s.etapes, id); if (secondes) inc(s.durees, id, Math.round(secondes)); sauve(); },
      quiz(id, juste) { const s = charge().stats; s.quiz[id] = s.quiz[id] || { ok: 0, n: 0 }; s.quiz[id].n++; if (juste) s.quiz[id].ok++; sauve(); },
      fin() { inc(charge().stats, "fins"); sauve(); },
      lire() { return JSON.parse(JSON.stringify(charge().stats)); },
      effacer() { charge().stats = defaut().stats; sauve(); }
    }
  };
})();
