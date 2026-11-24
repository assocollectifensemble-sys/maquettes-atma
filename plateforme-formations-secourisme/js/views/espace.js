/* Mon espace stagiaire. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const ETATS = [["recu", "Reçu"], ["pieces", "Pièces"], ["valide", "Validé"], ["paye", "Payé"], ["convoque", "Convoqué"]];

  App.views.espace = function (el) {
    const st = App.store.get();
    const ins = st.inscriptions;
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("user") + 'Mon espace</span><h1>Bonjour ' + ui.esc((ins[0] && ins[0].nom.split(" ")[0]) || "") + '</h1><p class="lead">Suivez vos inscriptions, vos documents et vos certificats au même endroit.</p></div><div id="es-list" class="stack"></div><div class="section-sm"></div></div>';
    const list = el.querySelector("#es-list");
    function render() {
      list.innerHTML = ins.length ? ins.map((x) => {
        const s = App.store.session(x.session), f = App.store.formation(s.formation);
        const idx = ETATS.findIndex((e) => e[0] === x.statut);
        const aFaire = x.pieces.filter((p) => p.statut !== "conforme");
        return '<article class="card sec-' + f.secteur + '"><div class="session-card">' + App.parts.dateBlock(s.date) + '<div><span class="tag">' + f.code + '</span><h2 style="font-size:1.2rem;margin:6px 0 4px">' + f.nom + '</h2><div class="meta"><span>' + I("calendar") + ui.plage(s) + '</span><span>' + I("pin") + D.lieux[s.lieu].nom + '</span><span>' + I("wallet") + D.financements[x.financement].court + '</span></div></div></div>' +
          '<div class="track" aria-label="État du dossier">' + ETATS.map((e, i) => '<div class="' + (i < idx || x.statut === "convoque" ? "done" : i === idx ? "cur" : "") + '"><i>' + (i < idx || x.statut === "convoque" ? I("check") : "") + '</i>' + e[1] + '</div>').join("") + '</div>' +
          '<div class="grid g2 mt"><div><h3 style="font-size:1rem">Mes documents</h3><ul class="checklist-ul">' + x.pieces.map((p) => '<li style="justify-content:space-between;align-items:center"><span class="row" style="gap:8px">' + I("file") + (D.piecesBase[p.type] || {}).label + '</span>' + ui.badgePiece(p.statut || "manquant") + '</li>').join("") + '</ul>' +
          (aFaire.length ? '<button class="btn btn-primary btn-sm mt" data-fix="' + x.id + '">' + I("upload") + 'Compléter mon dossier (' + aFaire.length + ')</button>' : '<p class="small mt" style="color:var(--ok)">' + I("checkCircle") + ' Toutes vos pièces sont conformes.</p>') + '</div>' +
          '<div class="stack"><div class="info-box' + (x.statut === "convoque" ? " ok" : "") + '">' + I(x.statut === "convoque" ? "mail" : "clock") + '<p>' + (x.statut === "convoque" ? "<b>Convocation disponible.</b> Rendez-vous " + ui.plage(s) + " à 8 h 30." : "<b>Convocation :</b> elle arrive dès la validation de vos pièces par le bureau.") + '</p></div>' +
          '<div class="info-box sand">' + I("award") + '<p><b>Attestation à venir</b> : votre ' + f.certif.charAt(0).toLowerCase() + f.certif.slice(1) + ' sera disponible ici dès le ' + ui.dLong(ui.add(s.dateFin, 2)) + '.</p></div>' +
          (x.statut === "convoque" ? '<button class="btn btn-ghost btn-sm" data-convoc="' + x.id + '">' + I("download") + 'Télécharger ma convocation</button>' : "") + '</div></div></article>';
      }).join("") : ui.vide("calendar", "Votre première formation vous attend", "Choisissez une session : elle apparaîtra ici avec le suivi de votre dossier.", '<a class="btn btn-primary" href="#/formations">Voir les formations</a>');
      list.querySelectorAll("[data-fix]").forEach((b) => b.addEventListener("click", () => completer(b.dataset.fix)));
      list.querySelectorAll("[data-convoc]").forEach((b) => b.addEventListener("click", () => {
        const x = ins.find((i) => i.id === b.dataset.convoc), s = App.store.session(x.session), f = App.store.formation(s.formation);
        ui.download("Convocation_" + f.code.replace(/\s/g, "-") + "_" + s.date + ".html", ui.docHTML("Convocation", "<h1>Convocation : " + f.nom + "</h1><p>" + ui.esc(x.nom) + ", vous êtes attendu·e " + ui.plage(s) + " à 8 h 30, " + D.lieux[s.lieu].nom + ".</p>"));
        ui.toast("Convocation téléchargée.");
      }));
      ui.typo(list);
    }
    function completer(id) {
      const x = ins.find((i) => i.id === id), s = App.store.session(x.session), f = App.store.formation(s.formation);
      const pieces = x.pieces.map((p) => Object.assign({ type: p.type }, D.piecesBase[p.type]));
      const m = ui.modal({ title: "Compléter mon dossier " + f.code, large: true, body: '<div id="es-docai"></div>', foot: '<button class="btn btn-primary" data-close>Terminer</button>' });
      App.docAI.mount(m.querySelector("#es-docai"), {
        pieces, etat: x.pieces, prenom: () => x.nom.split(" ")[0], code: () => f.code + " du " + ui.dCourt(s.date),
        onChange: (etat) => {
          x.pieces = etat;
          if (etat.every((p) => p.statut === "conforme") && x.statut === "pieces") {
            x.statut = "convoque";
            ui.toast("Dossier complet : votre convocation est prête !");
            App.store.addNotif({ type: "ok", texte: "Dossier complet : " + x.nom + " · " + f.code + " du " + ui.dCourt(s.date), lien: "#/bureau/dossiers" });
          }
          App.store.save();
        }
      });
      m.closest(".modal-wrap").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) setTimeout(render, 0); });
    }
    render();
  };
})();
