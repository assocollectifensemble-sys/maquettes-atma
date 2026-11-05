/* ============================================================
   STORAGE.JS — Progression, réglages et statistiques ANONYMES locales
   (localStorage). Tout reste sur le téléphone : aucun compte, aucun
   traceur, rien n'est envoyé. Dans l'application complète, seuls des
   compteurs agrégés et anonymes remonteraient (à définir avec l'Observatoire).
   ============================================================ */
(function () {
  "use strict";
  const KEY = "makes-tikomet-v1", KSTAT = "makes-tikomet-stats-v1";
  const defaut = () => ({
    faits: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
    public: "famille", lang: "fr", theme: "auto", taille: 1, son: true, intro: false,
    prenom: "", tolerance: 18
  });
  let mem = null;
  function charge() {
    if (mem) return mem;
    try { mem = Object.assign(defaut(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { mem = defaut(); }
    mem.faits = Object.assign(defaut().faits, mem.faits || {});
    return mem;
  }
  function sauve() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* mode privé : on continue en mémoire */ } }

  // ---------- statistiques anonymes locales (compteurs, aucune donnée personnelle) ----------
  let st = null;
  function stats() {
    if (st) return st;
    try { st = JSON.parse(localStorage.getItem(KSTAT) || "null"); } catch (e) { st = null; }
    if (!st) st = { sessions: 0, publics: {}, langues: {}, debut: {}, fin: {}, duree: {}, quizOk1: {}, quizN: {}, capteurs: 0, glisser: 0, findemo: 0 };
    return st;
  }
  function sauveStats() { try { localStorage.setItem(KSTAT, JSON.stringify(st)); } catch (e) { } }
  const inc = (o, k, n) => { o[k] = (o[k] || 0) + (n == null ? 1 : n); };

  window.Store = {
    get(k) { return charge()[k]; },
    set(k, v) { charge()[k] = v; sauve(); },
    fait(id, v) { charge().faits[id] = v !== false; sauve(); },
    faits() { return charge().faits; },
    count() { return Object.values(charge().faits).filter(Boolean).length; },
    // remise à zéro de la partie (on garde les réglages)
    reset() { const c = charge(); mem = Object.assign(defaut(), { theme: c.theme, taille: c.taille, son: c.son, lang: c.lang, public: c.public, tolerance: c.tolerance }); sauve(); },
    Stats: {
      lire: () => JSON.parse(JSON.stringify(stats())),
      session(pub, lang) { const s = stats(); s.sessions++; inc(s.publics, pub); inc(s.langues, lang); sauveStats(); },
      debut(id) { inc(stats().debut, id); sauveStats(); },
      fin(id, secondes) { const s = stats(); inc(s.fin, id); inc(s.duree, id, Math.max(0, Math.round(secondes || 0))); sauveStats(); },
      quiz(id, premierCoup) { const s = stats(); inc(s.quizN, id); if (premierCoup) inc(s.quizOk1, id); sauveStats(); },
      visee(capteur) { inc(stats(), capteur ? "capteurs" : "glisser"); sauveStats(); },
      findemo() { inc(stats(), "findemo"); sauveStats(); },
      effacer() { st = null; try { localStorage.removeItem(KSTAT); } catch (e) { } }
    }
  };
})();
