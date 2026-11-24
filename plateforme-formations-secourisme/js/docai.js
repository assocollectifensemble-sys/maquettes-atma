/* Assistant documents : contrôle « IA » simulé, crédible et bienveillant. Tout se passe en local. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const AIDE = {
    conforme: () => "Pièce lisible, complète et valide. Merci !",
    illisible: (p) => p.type === "photo" ? "La photo est un peu floue : reprenez-la à la lumière du jour, visage bien net, sur fond clair." : "Le document est flou par endroits : posez-le à plat près d'une fenêtre et photographiez-le avec les quatre coins visibles.",
    expire: (p) => p.type === "medical" ? "Ce certificat date de plus de 3 mois. Un certificat récent de votre médecin fera parfaitement l'affaire." : "La date de validité est dépassée. Joignez la version en cours ou votre dernière attestation de formation continue.",
    mauvaise: (p) => "Nous avons reçu un autre document (une facture, semble-t-il). La pièce attendue : " + p.label.toLowerCase() + ". " + p.aide,
    manquant: (p) => "Ajoutez cette pièce dès que vous l'avez : votre place reste réservée 7 jours. " + p.aide
  };
  const ETAPES = ["Lecture du document", "Contrôle de la lisibilité", "Vérification des dates de validité", "Correspondance avec la pièce attendue"];

  function verdictFichier(file) {
    const n = file.name.toLowerCase();
    if (!/\.(pdf|jpe?g|png|heic|webp)$/.test(n)) return "mauvaise";
    if (/facture|ticket/.test(n)) return "mauvaise";
    if (/flou|blur/.test(n)) return "illisible";
    if (/2019|2020|2021|ancien|old/.test(n)) return "expire";
    if (/^image\//.test(file.type) && file.size < 30000) return "illisible";
    return "conforme";
  }

  App.docAI = {
    AIDE,
    piecesPour(formationId, financement) {
      const types = (D.piecesFormation[formationId] || ["identite"]).slice();
      if (financement && financement !== "perso" && D.piecesBase[financement]) types.push(financement);
      return types.map((t) => Object.assign({ type: t }, D.piecesBase[t]));
    },
    mount(root, opts) {
      const pieces = opts.pieces;
      const etat = opts.etat || [];
      pieces.forEach((p, i) => { etat[i] = etat[i] || { type: p.type, statut: null, fichier: null }; etat[i].type = p.type; });
      etat.length = pieces.length;
      let busy = false;

      root.innerHTML = '<div class="docai"><div class="split">' +
        '<div class="stack"><div class="dropzone" id="dz"><svg class="ico ico-big" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/></svg>' +
        '<h3 style="margin:6px 0 0">Glissez vos documents ici</h3><p>PDF ou photo, depuis votre téléphone ou votre ordinateur.</p>' +
        '<label class="btn btn-primary" for="dz-input">' + I("upload") + 'Choisir des fichiers</label><input id="dz-input" type="file" multiple accept=".pdf,image/*" class="sr"></div>' +
        '<div><p class="label" style="margin-bottom:8px">Ou testez avec un exemple :</p><div class="scenarios">' +
        D.scenariosIA.map((s, i) => '<button type="button" class="scenario" data-sc="' + s.id + '">' + I(i === 0 ? "checkCircle" : i === 1 ? "eye" : "alert") + '<span><b>' + s.nom + '</b><small>' + s.desc + '</small></span></button>').join("") +
        '</div></div></div>' +
        '<section class="ai-panel" aria-labelledby="ai-t"><div class="ai-head"><span class="ai-avatar">' + I("sparkle") + '</span><div><h3 id="ai-t">Assistant documents</h3><small>Vérifie lisibilité, validité et correspondance</small></div></div>' +
        '<div class="ai-status" id="ai-status" aria-live="polite"></div><div id="ai-pieces"></div>' +
        '<div class="human-note">' + I("users") + '<span><b>La décision finale reste humaine :</b> l\'assistant prépare le travail, une personne du bureau relit et valide chaque dossier.</span></div></section>' +
        '</div><div id="ai-mail"></div></div>';

      const $ = (s) => root.querySelector(s);
      const status = $("#ai-status");

      function render() {
        const done = etat.filter((e) => e.statut === "conforme").length;
        if (!busy) status.innerHTML = etat.some((e) => e.statut) ? I("checkCircle") + '<span>' + done + ' pièce' + (done > 1 ? "s" : "") + ' conforme' + (done > 1 ? "s" : "") + ' sur ' + pieces.length + '</span>' : '<span class="pulse"></span><span>Prêt à analyser vos ' + pieces.length + ' pièce' + (pieces.length > 1 ? "s" : "") + '</span>';
        $("#ai-pieces").innerHTML = pieces.map((p, i) => {
          const e = etat[i];
          const st = e.statut;
          let inner = "";
          if (st === "attente") {
            inner = '<div class="scan"><i id="scan-' + i + '"></i></div><ul class="scan-steps" id="steps-' + i + '"></ul>';
          } else if (st) {
            inner = '<p class="piece-help' + (st === "conforme" ? " ok" : "") + '">' + AIDE[st](p) + '</p>' +
              (st !== "conforme" ? '<div class="row" style="gap:6px"><label class="btn btn-ghost btn-sm" for="re-' + i + '">' + I("upload") + 'Redéposer</label><input type="file" id="re-' + i + '" data-re="' + i + '" class="sr" accept=".pdf,image/*"><button type="button" class="link-btn" data-fix="' + i + '">Utiliser une version corrigée (exemple)</button></div>' : "");
          } else {
            inner = '<p class="small muted mb0">' + p.aide + '</p>';
          }
          return '<div class="piece" data-piece="' + i + '"><div class="piece-top"><div><b>' + p.label + '</b>' + (e.fichier ? '<span class="piece-file">' + I("file") + ui.esc(e.fichier) + '</span>' : "") + '</div>' +
            (st ? ui.badgePiece(st) : '<span class="badge badge-muted">À déposer</span>') + '</div>' + inner + '</div>';
        }).join("");
        root.querySelectorAll("[data-re]").forEach((inp) => inp.addEventListener("change", () => { if (inp.files[0]) analyse([[+inp.dataset.re, inp.files[0].name, "conforme"]]); }));
        root.querySelectorAll("[data-fix]").forEach((b) => b.addEventListener("click", () => {
          const i = +b.dataset.fix; analyse([[i, (D.fichiersExemple[pieces[i].type] || "document.pdf").replace(/(\.\w+)$/, "_v2$1"), "conforme"]]);
        }));
        renderMail();
        ui.typo(root);
        if (opts.onChange) opts.onChange(etat);
      }

      function renderMail() {
        const pb = pieces.map((p, i) => [p, etat[i]]).filter(([, e]) => e.statut && !["conforme", "attente"].includes(e.statut));
        const box = $("#ai-mail");
        if (busy || !pb.length) { box.innerHTML = ""; return; }
        const ok = etat.filter((e) => e.statut === "conforme").length;
        const prenom = opts.prenom ? opts.prenom() : "Léa";
        const lim = ui.add(ui.today(), 7);
        box.innerHTML = '<div class="mail" role="region" aria-label="Mail de relance"><div class="mail-bar">' + I("mail") + 'Mail de relance envoyé automatiquement · à l\'instant</div>' +
          '<div class="mail-head"><div><span>De :</span> ' + ui.esc(App.config.nom) + '</div><div><span>Objet :</span> <b>Votre dossier ' + opts.code() + ' : ' + pb.length + ' pièce' + (pb.length > 1 ? "s" : "") + ' à compléter</b></div></div>' +
          '<div class="mail-body"><p>Bonjour ' + ui.esc(prenom) + ',</p><p>Merci pour votre inscription ! Votre dossier avance bien : ' + ok + ' pièce' + (ok > 1 ? "s" : "") + ' sur ' + pieces.length + ' ' + (ok > 1 ? "sont validées" : "est validée") + '. Pour le finaliser, il reste :</p><ul>' +
          pb.map(([p, e]) => '<li><b>' + p.label + '</b> (' + ui.statutPiece[e.statut].nom.toLowerCase() + ') : ' + AIDE[e.statut](p) + '</li>').join("") +
          '</ul><p>Deux minutes suffisent, depuis votre téléphone :</p><p><a class="mail-cta" href="#/espace">' + I("upload") + 'Compléter mon dossier</a></p><p>Votre place reste réservée jusqu\'au ' + ui.dLong(lim) + '. Je reste disponible si vous avez la moindre question.</p><p class="mb0">À très vite,<br>L\'équipe ' + ui.esc(App.config.nom) + '</p></div></div>';
      }

      function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
      async function analyse(jobs) {
        if (busy) return;
        busy = true;
        jobs.forEach(([i, nom, res]) => { etat[i].fichier = res === "manquant" ? null : nom; etat[i].statut = "attente"; });
        status.innerHTML = '<span class="pulse"></span><span>Analyse en cours…</span>';
        render();
        for (const [i, , res] of jobs) {
          status.innerHTML = '<span class="pulse"></span><span>Analyse : ' + pieces[i].label + '…</span>';
          const bar = $("#scan-" + i), ul = $("#steps-" + i);
          const q = opts.fast ? 60 : 380;
          for (let k = 0; k < ETAPES.length; k++) {
            if (bar) bar.style.width = ((k + 1) / ETAPES.length * 100) + "%";
            if (ul) ul.insertAdjacentHTML("beforeend", "<li>" + I("check") + ETAPES[k] + "</li>");
            await wait(q);
          }
          etat[i].statut = res;
        }
        busy = false;
        render();
        const pb = etat.filter((e) => e.statut !== "conforme").length;
        ui.toast(pb ? "Analyse terminée : " + pb + " pièce" + (pb > 1 ? "s" : "") + " à reprendre, le mail d'aide est parti." : "Analyse terminée : toutes les pièces sont conformes.", pb ? "warn" : "ok");
      }

      root.querySelectorAll("[data-sc]").forEach((b) => b.addEventListener("click", () => {
        const sc = D.scenariosIA.find((s) => s.id === b.dataset.sc);
        const jobs = pieces.map((p, i) => {
          let r = sc.resultat[i] || "conforme";
          if (sc.resultat.last && i === pieces.length - 1) r = sc.resultat.last;
          if (r === "mauvaise" && p.type !== "ft") { /* le fichier reçu ressemble à une facture */ }
          const nom = r === "mauvaise" ? "facture_telephone.pdf" : r === "illisible" ? "photo_IMG_2231_floue.jpg" : r === "expire" ? (D.fichiersExemple[p.type] || "document.pdf").replace(/(\.\w+)$/, "_2022$1") : (D.fichiersExemple[p.type] || "document.pdf");
          return [i, nom, r];
        });
        analyse(jobs);
      }));

      function deposer(files) {
        const libres = etat.map((e, i) => (!e.statut || e.statut !== "conforme") ? i : -1).filter((i) => i >= 0);
        const jobs = Array.from(files).slice(0, libres.length).map((f, k) => [libres[k], f.name, verdictFichier(f)]);
        if (jobs.length) analyse(jobs); else ui.toast("Toutes les pièces sont déjà conformes.", "info");
      }
      $("#dz-input").addEventListener("change", (e) => deposer(e.target.files));
      const dz = $("#dz");
      ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("over"); }));
      ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
      dz.addEventListener("drop", (e) => deposer(e.dataTransfer.files));
      render();
      return { etat, analyse };
    }
  };
})();
