/* Suivi FFKY : lit data.json et construit la page. Mise à jour = éditer data.json. */
(function () {
  "use strict";
  var MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  var POIDS = { fait: 1, en_cours: 0.5, attend_ffky: 0, a_venir: 0 };
  var state = { statut: "tous", qui: "tous", ouvertes: {} };
  var D;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dateFr(iso, court) {
    if (!iso) return "";
    var p = iso.split("-"); var j = parseInt(p[2], 10);
    return (j === 1 ? "1er" : j) + " " + MOIS[parseInt(p[1], 10) - 1] + (court ? "" : " " + p[0]);
  }
  function pct(taches) {
    if (!taches.length) return 0;
    var s = 0; taches.forEach(function (t) { s += POIDS[t.statut] || 0; });
    return Math.round(100 * s / taches.length);
  }
  function groupeQui(q) { return /jonathan/i.test(q) ? "jonathan" : "ffky"; }
  function badge(st) { return '<span class="badge b-' + st + '">' + esc(D.statuts[st] || st) + "</span>"; }

  function filtres() {
    var toutes = []; D.etapes.forEach(function (e) { toutes = toutes.concat(e.taches); });
    var compte = { tous: toutes.length };
    toutes.forEach(function (t) { compte[t.statut] = (compte[t.statut] || 0) + 1; });
    var ordre = ["tous", "fait", "en_cours", "attend_ffky", "a_venir"];
    $("filtres").innerHTML = ordre.map(function (k) {
      var lib = k === "tous" ? "Tout voir" : D.statuts[k];
      return '<button class="chip" data-f="statut" data-v="' + k + '" aria-pressed="' + (state.statut === k) + '">' + esc(lib) + '<span class="n">' + (compte[k] || 0) + "</span></button>";
    }).join("");
    var quis = [["tous", "Tout le monde"], ["jonathan", "Porté par Jonathan"], ["ffky", "Porté par la FFKY"]];
    $("filtres-qui").innerHTML = quis.map(function (q) {
      return '<button class="chip" data-f="qui" data-v="' + q[0] + '" aria-pressed="' + (state.qui === q[0]) + '">' + q[1] + "</button>";
    }).join("");
  }

  function etapes() {
    var filtre = state.statut !== "tous" || state.qui !== "tous";
    var html = D.etapes.map(function (e) {
      var vis = e.taches.filter(function (t) {
        return (state.statut === "tous" || t.statut === state.statut) && (state.qui === "tous" || groupeQui(t.qui) === state.qui);
      });
      if (filtre && !vis.length) return "";
      var p = pct(e.taches);
      var nf = e.taches.filter(function (t) { return t.statut === "fait"; }).length;
      var ouverte = filtre || state.ouvertes[e.id];
      var li = vis.map(function (t) {
        var meta = [t.date ? dateFr(t.date) : "", t.qui ? "Porté par " + t.qui : ""].filter(Boolean).join(" · ");
        return '<li class="tache"><div class="tache__l1"><div><div class="tache__titre">' + esc(t.titre) + "</div>" +
          (meta ? '<div class="tache__meta">' + esc(meta) + "</div>" : "") + "</div>" + badge(t.statut) + "</div>" +
          (t.detail ? "<p>" + esc(t.detail) + "</p>" : "") +
          (t.preuve && t.statut === "fait" ? '<p class="preuve">' + esc(t.preuve) + "</p>" : "") + "</li>";
      }).join("");
      return '<article class="etape" id="etape-' + e.id + '" open-state="' + (ouverte ? 1 : 0) + '">' +
        '<button class="etape__head" aria-expanded="' + (ouverte ? "true" : "false") + '" data-etape="' + e.id + '">' +
        '<div class="etape__top"><span class="etape__id">' + esc(e.id) + '</span><span class="etape__nom">' + esc(e.nom) + "</span>" + badge(e.statut) + '<span class="chev" aria-hidden="true">▾</span></div>' +
        '<p class="etape__resume">' + esc(e.resume) + "</p>" +
        '<div class="etape__jauge"><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '" aria-label="Avancement ' + esc(e.id) + '"><span style="width:' + p + '%"></span></div><span>' + p + " % · " + nf + "/" + e.taches.length + " faites</span></div>" +
        (e.prochaine && e.prochaine.action ? '<p class="etape__next"><b>Prochaine action :</b> ' + esc(e.prochaine.action) + (e.prochaine.qui ? " — " + esc(e.prochaine.qui) : "") + "</p>" : "") +
        "</button>" + '<ul class="taches">' + li + "</ul></article>";
    }).join("");
    $("liste-etapes").innerHTML = html || '<p class="vide">Changez de filtre pour afficher d\u2019autres lignes.</p>';
  }

  function global() {
    var toutes = []; D.etapes.forEach(function (e) { toutes = toutes.concat(e.taches); });
    var p = pct(toutes);
    $("global-pct").textContent = p + " %";
    requestAnimationFrame(function () { $("global-bar").style.width = p + "%"; });
  }

  function listes() {
    $("liste-attentes").innerHTML = D.attentes.length ? D.attentes.map(function (a) {
      return "<li><b>" + esc(a.titre) + "</b><span>" + esc(a.detail) + "</span><small>" + esc(a.qui) + (a.etape ? " · étape " + esc(a.etape) : "") + "</small></li>";
    }).join("") : '<li><b>Tout est entre mes mains pour le moment.</b><span>Merci !</span></li>';
    $("liste-historique").innerHTML = D.historique.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (h) {
      return '<li><time datetime="' + h.date + '">' + dateFr(h.date) + "</time>" + (h.etape ? '<span class="et">' + esc(h.etape) + "</span>" : "") + "<p>" + esc(h.texte) + "</p></li>";
    }).join("");
    $("liste-offert").innerHTML = D.offert.map(function (o) { return '<div class="carte"><b>' + esc(o.titre) + "</b><p>" + esc(o.detail) + "</p></div>"; }).join("");
    $("liste-surveillance").innerHTML = D.surveillance.map(function (s) { return "<li><b>" + esc(s.rythme) + "</b>" + esc(s.texte) + "</li>"; }).join("");
  }

  function rendre() { filtres(); etapes(); }

  document.addEventListener("click", function (ev) {
    var c = ev.target.closest(".chip");
    if (c) { state[c.dataset.f] = c.dataset.v; rendre(); return; }
    var h = ev.target.closest(".etape__head");
    if (h) { var id = h.dataset.etape; state.ouvertes[id] = !state.ouvertes[id]; var art = h.parentNode; var o = art.getAttribute("open-state") !== "1"; art.setAttribute("open-state", o ? 1 : 0); h.setAttribute("aria-expanded", o); }
  });

  fetch("data.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    D = d;
    document.title = d.meta.titre + " — FFKY";
    $("titre").textContent = d.meta.titre;
    $("sous-titre").textContent = d.meta.sous_titre;
    $("intro").textContent = d.meta.intro;
    $("maj").textContent = dateFr(d.meta.maj);
    $("auteur").textContent = d.meta.auteur;
    global(); rendre(); listes();
  }).catch(function () {
    $("liste-etapes").innerHTML = '<p class="vide">Rechargez la page pour afficher le suivi.</p>';
  });
})();
