/* État de la démo, persisté en localStorage. */
(function () {
  const KEY = App.config.storageKey;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function initial() {
    const d = App.data;
    return {
      v: App.config.version,
      role: "stagiaire",
      sessions: clone(d.sessions),
      dossiers: clone(d.dossiers),
      notifications: clone(d.notifications),
      inscriptions: [{
        id: "i-demo", session: "s2", nom: "Léa Grondin", financement: "cpf", statut: "pieces", creeLe: d.D(-3),
        pieces: [{ type: "identite", statut: "conforme", fichier: "CNI_recto-verso.jpg" }, { type: "photo", statut: "illisible", fichier: "photo_selfie.jpg" }, { type: "cpf", statut: "conforme", fichier: "MonCompteFormation_demande.png" }],
        montant: 0, regle: "financeur"
      }],
      brouillon: null,
      checklists: {}, bilans: {}, emargements: {}, parcours: {}, federal: {},
      alertes: {
        dossier: { mail: true, whatsapp: false }, pieces: { mail: true, whatsapp: true },
        formateur: { mail: true, whatsapp: true }, paiement: { mail: true, whatsapp: false }, federal: { mail: false, whatsapp: false }
      },
      chat: []
    };
  }

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || state.v !== App.config.version) state = initial();

  App.store = {
    get: () => state,
    save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota : la démo continue en mémoire */ } },
    update(fn) { fn(state); this.save(); },
    reset() { state = initial(); this.save(); },
    session: (id) => state.sessions.find((s) => s.id === id),
    formation: (id) => App.data.formations.find((f) => f.id === id),
    formateur: (id) => App.data.formateurs.find((f) => f.id === id),
    addNotif(n) { state.notifications.unshift(Object.assign({ id: "n" + Date.now(), quand: "à l'instant", lu: false }, n)); this.save(); }
  };
  App.store.save();
})();
