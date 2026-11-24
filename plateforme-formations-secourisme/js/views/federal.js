/* Ouverture de session sur le site fédéral : l'IA pré-remplit, le bureau relit et valide (simulation 100 % locale). */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const AVERT = "La démo reste hors ligne : elle contacte zéro site réel, et l'envoi est entièrement simulé.";

  App.views.bureauFederal = function (el) {
    const st = App.store.get();
    let etape = 1, sid = null, champs = [];
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("globe") + 'Espace bureau</span><h1>Ouverture de session sur le site fédéral</h1><p class="lead">L\'assistant prépare le formulaire de la fédération à partir de vos données. Vous relisez, vous validez.</p>' +
      '<div class="info-box sand">' + I("shield") + '<p><b>Démonstration :</b> ' + AVERT + '</p></div></div><div id="fd"></div><div class="section-sm"></div></div>';
    const z = el.querySelector("#fd");

    function construire(s) {
      const f = App.store.formation(s.formation), eq = s.equipe.filter((e) => e.s === "confirme").map((e) => App.store.formateur(e.f));
      return [
        ["centre", "Centre de formation affilié", App.config.nom + " · centre n° 974-0" + (12 + s.id.length) + " (fictif)"],
        ["type", "Type de formation", f.code + " · " + f.nom],
        ["debut", "Date de début", ui.dNum(s.date)],
        ["fin", "Date de fin", ui.dNum(s.dateFin)],
        ["volume", "Volume horaire", f.duree],
        ["lieu", "Lieu de formation", D.lieux[s.lieu].nom + " · " + D.lieux[s.lieu].detail],
        ["places", "Nombre de places", String(s.places)],
        ["resp", "Formateur responsable", eq[0] ? eq[0].nom + " · certificat n° FPS-974-" + (100 + eq[0].nom.length) + " (fictif)" : "À désigner"],
        ["assoc", "Formateurs associés", eq.slice(1).map((x) => x.nom).join(", ") || "Équipe en cours de constitution"],
        ["tarif", "Tarif public", ui.prix(f.tarif) + " TTC"],
        ["contact", "Contact inscriptions", App.config.contactMail]
      ];
    }

    function render() {
      if (etape === 1) {
        const ss = App.parts.futures();
        z.innerHTML = '<h2 style="font-size:1.25rem">1. Choisissez la session à ouvrir</h2><div class="grid g2 mt">' + ss.map((s) => {
          const f = App.store.formation(s.formation), env = st.federal[s.id];
          return '<label class="radio-card sec-' + f.secteur + '"><input type="radio" name="fs" value="' + s.id + '"' + (sid === s.id ? " checked" : "") + '><span style="flex:1"><b>' + f.code + ' · ' + ui.plage(s) + '</b><span class="sub">' + D.lieux[s.lieu].nom + ' · ' + s.places + ' places</span>' +
            (env ? '<span class="badge badge-ok" style="margin-top:6px">' + I("check") + 'Ouverte · réf. ' + env.ref + '</span>' : '<span class="badge badge-info" style="margin-top:6px">À ouvrir</span>') + '</span></label>';
        }).join("") + '</div><div class="wizard-nav"><span></span><button class="btn btn-primary" id="fd-go">' + I("sparkle") + 'Préparer l\'ouverture</button></div>';
        z.querySelectorAll("[name=fs]").forEach((r) => r.onchange = () => { sid = r.value; });
        z.querySelector("#fd-go").onclick = () => { if (!sid) { ui.toast("Choisissez une session.", "info"); return; } etape = 2; render(); };
      } else if (etape === 2 || etape === 3) {
        const s = App.store.session(sid), f = App.store.formation(s.formation);
        if (etape === 2) champs = construire(s);
        z.innerHTML = '<div class="split"><div><h2 style="font-size:1.25rem">2. ' + (etape === 2 ? "L'assistant prépare le formulaire" : "Relisez et validez") + '</h2>' +
          '<div class="ai-panel"><div class="ai-head"><span class="ai-avatar">' + I("sparkle") + '</span><div><h3>Assistant d\'ouverture</h3><small>' + f.code + ' du ' + ui.dCourt(s.date) + '</small></div></div><ul class="scan-steps" id="fd-steps" style="color:#B9D3E6"></ul>' +
          '<div class="human-note">' + I("users") + '<span><b>Vous gardez la main :</b> chaque champ reste modifiable, l\'envoi part uniquement après votre validation.</span></div></div>' +
          (etape === 3 ? '<label class="check mt"><input type="checkbox" id="fd-ok"><span>J\'ai relu les informations et je valide l\'ouverture de cette session.</span></label><div class="row mt"><button class="btn btn-ghost" id="fd-back">' + I("arrowLeft") + 'Changer de session</button><button class="btn btn-primary" id="fd-send" disabled>' + I("send") + 'Valider l\'envoi</button></div>' : "") + '</div>' +
          '<div><h2 style="font-size:1.25rem">Aperçu du formulaire fédéral</h2><div class="fed-form"><div class="fed-bar"><span class="dots"><i></i><i></i><i></i></span><span class="fed-url">extranet-federation.exemple/sessions/nouvelle</span></div>' +
          '<div class="fed-body"><p class="small mb0" style="color:#2B3A4E"><b>Déclaration d\'une session de formation</b> · reproduction schématique</p>' +
          champs.map(([k, l, v]) => '<div class="fed-field"><label for="ff-' + k + '"><span>' + l + '</span><span class="ai-tag" id="tag-' + k + '" hidden>' + I("sparkle") + 'pré-rempli</span></label><input class="input" id="ff-' + k + '" value="' + (etape === 3 ? ui.esc(v) : "") + '"' + (etape === 2 ? " readonly" : "") + '></div>').join("") +
          '</div></div></div></div>';
        ui.typo(z);
        if (etape === 2) animer(); else {
          champs.forEach(([k]) => { z.querySelector("#ff-" + k).classList.add("filled"); z.querySelector("#tag-" + k).hidden = false; z.querySelector("#ff-" + k).addEventListener("input", (e) => { champs.find((c) => c[0] === k)[2] = e.target.value; z.querySelector("#tag-" + k).innerHTML = I("pen") + "modifié par vous"; }); });
          z.querySelector("#fd-steps").innerHTML = ["Fiche session lue", "Formateurs et certificats récupérés", "Prérequis fédéraux vérifiés", "Formulaire pré-rempli : 11 champs"].map((t) => "<li>" + I("check") + t + "</li>").join("");
          const ok = z.querySelector("#fd-ok"), send = z.querySelector("#fd-send");
          ok.onchange = () => { send.disabled = !ok.checked; };
          z.querySelector("#fd-back").onclick = () => { etape = 1; render(); };
          send.onclick = envoyer;
        }
      } else {
        const s = App.store.session(sid), f = App.store.formation(s.formation), env = st.federal[sid];
        z.innerHTML = '<div class="card narrow" style="margin:0 auto;text-align:center"><div class="success-mark">' + I("check") + '</div><h2>Session ouverte (simulation)</h2><p>' + f.code + ' du ' + ui.dCourt(s.date) + ' · ' + D.lieux[s.lieu].nom + '</p><p><span class="badge badge-navy">Référence fictive ' + env.ref + '</span></p><p class="small muted">' + AVERT + ' En production, l\'automatisation transmettrait ces champs au site fédéral puis enregistrerait la référence dans le dossier de session.</p>' +
          '<div class="row" style="justify-content:center"><button class="btn btn-primary" id="fd-new">Ouvrir une autre session</button><a class="btn btn-ghost" href="#/bureau">Retour au rétro-planning</a></div></div>';
        z.querySelector("#fd-new").onclick = () => { etape = 1; sid = null; render(); };
      }
      ui.typo(z);
    }
    async function animer() {
      const steps = z.querySelector("#fd-steps");
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const lignes = ["Lecture de la fiche session", "Récupération des formateurs et de leurs certificats", "Vérification des prérequis fédéraux", "Pré-remplissage du formulaire"];
      for (const t of lignes) { if (!document.contains(steps)) return; steps.insertAdjacentHTML("beforeend", "<li>" + I("check") + t + "</li>"); await wait(320); }
      for (const [k, , v] of champs) {
        const inp = z.querySelector("#ff-" + k); if (!inp) return;
        inp.classList.add("filled", "typewriter");
        const step = Math.max(1, Math.ceil(v.length / 10));
        for (let i = 0; i <= v.length; i += step) { inp.value = v.slice(0, i); await wait(18); }
        inp.value = v; inp.classList.remove("typewriter");
        z.querySelector("#tag-" + k).hidden = false;
      }
      await wait(250);
      if (document.contains(steps)) { etape = 3; render(); ui.toast("Formulaire pré-rempli : à vous de relire."); }
    }
    function envoyer() {
      const b = z.querySelector("#fd-send");
      b.disabled = true; b.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:3px;margin:0"></span>Envoi simulé…';
      setTimeout(() => {
        const ref = "FED-" + new Date().getFullYear() + "-" + String(Math.floor(1000 + Math.random() * 8999));
        App.store.update((x) => { x.federal[sid] = { ref, le: ui.today() }; });
        const s = App.store.session(sid);
        App.store.addNotif({ type: "ok", texte: "Session " + App.store.formation(s.formation).code + " du " + ui.dCourt(s.date) + " ouverte sur le site fédéral (simulation)", lien: "#/bureau/federal" });
        etape = 4; render(); ui.toast("Envoi simulé avec succès.");
      }, 1200);
    }
    render();
  };
})();
