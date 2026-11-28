/* ============================================================
   STORAGE.JS — sauvegarde locale (reprise de partie + carnet)
   ------------------------------------------------------------
   Tout reste sur le téléphone : localStorage uniquement.
   Les photos du carnet sont des vignettes JPEG réduites (≈ 20-40 Ko),
   rangées sous une clé séparée pour garder la sauvegarde légère.
   Stats : en pilote, AUCUN envoi réseau (voir README pour rebrancher
   l'endpoint existant stats/collect.php de la v28).
   ============================================================ */

const Store = (() => {
  const CLE_PARTIE = "crokiv2:partie";
  const CLE_CARNET = "crokiv2:carnet";
  const CLE_REGLAGES = "crokiv2:reglages";

  function lire(cle, defaut) {
    try {
      const brut = localStorage.getItem(cle);
      return brut ? JSON.parse(brut) : defaut;
    } catch (e) { return defaut; }
  }
  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; }
    catch (e) { return false; } // stockage plein ou navigation privée : on continue
  }

  return {
    partie: () => lire(CLE_PARTIE, null),
    sauverPartie: p => ecrire(CLE_PARTIE, p),
    effacerPartie: () => { try { localStorage.removeItem(CLE_PARTIE); localStorage.removeItem(CLE_CARNET); } catch (e) {} },

    carnet: () => lire(CLE_CARNET, {}),
    // Une vignette par étape (la dernière photo remplace la précédente)
    collerVignette(id, dataUrl, legende) {
      const c = lire(CLE_CARNET, {});
      c[id] = { img: dataUrl, legende, date: Date.now() };
      if (!ecrire(CLE_CARNET, c)) {
        // Trop lourd : on garde la vignette en mémoire pour la session
        Store._memoire = Store._memoire || {};
        Store._memoire[id] = c[id];
      }
    },
    vignette(id) {
      const c = lire(CLE_CARNET, {});
      return c[id] || (Store._memoire && Store._memoire[id]) || null;
    },

    reglages: () => lire(CLE_REGLAGES, { son: true }),
    sauverReglages: r => ecrire(CLE_REGLAGES, r),

    // Stats : point d'accroche unique, inactif en pilote (aucun réseau).
    stat(type, details) {
      if (window.CROKI_DEBUG) console.debug("[stat]", type, details || "");
    }
  };
})();
