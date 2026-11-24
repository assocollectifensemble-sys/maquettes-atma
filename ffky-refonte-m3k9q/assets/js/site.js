/* FFKY — maquette de refonte : interactions (autonome, fonctionne hors connexion).
   - Calendrier : filtre par type (stage, atelier, formation, festival), lien direct ?type=…
   - Carte des cours : points géolocalisés + liste, recherche, ordre aléatoire à chaque visite
   - Trouver un enseignant : recherche par nom, ordre aléatoire à chaque visite */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);

  /* Mélange de Fisher-Yates : même visibilité pour toutes et tous */
  function melanger(tableau) {
    var t = tableau.slice();
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = t[i]; t[i] = t[j]; t[j] = x;
    }
    return t;
  }
  function normaliser(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").trim();
  }
  function echapper(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pluriel(n, un, plusieurs) { return n + " " + (n > 1 ? plusieurs : un); }

  /* ---------------------------------------------------------------- Calendrier */
  document.querySelectorAll("[data-calendrier]").forEach(function (bloc) {
    var boutons = bloc.querySelectorAll("[data-filtre]");
    var items = bloc.querySelectorAll("[data-type]");
    var vide = bloc.querySelector(".agenda__vide");
    var annonce = bloc.querySelector("[data-annonce]");
    function appliquer(type) {
      var n = 0;
      boutons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filtre === type)); });
      items.forEach(function (it) {
        var ok = type === "tout" || it.dataset.type === type;
        it.hidden = !ok; if (ok) n++;
      });
      if (vide) vide.hidden = n > 0;
      if (annonce) annonce.textContent = n > 0 ? pluriel(n, "rendez-vous affiché", "rendez-vous affichés") : "Nouveaux rendez-vous à venir dans cette catégorie";
    }
    boutons.forEach(function (b) { b.addEventListener("click", function () { appliquer(b.dataset.filtre); }); });
    var depart = params.get("type");
    appliquer(depart && bloc.querySelector('[data-filtre="' + depart + '"]') ? depart : "tout");
  });

  /* --------------------------------------------------------- Carte des cours */
  var COURS = window.FFKY_COURS || [];
  var CARTE = window.FFKY_CARTE || null;
  var SVGNS = "http://www.w3.org/2000/svg";

  function projeter(c) {
    return [(c.lo - CARTE.lon0) * CARTE.kx + CARTE.dx, (CARTE.lat0 - c.la) * CARTE.ky + CARTE.dy];
  }
  function enFrance(c) {
    return c.la != null && c.la > 41.2 && c.la < 51.3 && c.lo > -5.3 && c.lo < 9.7;
  }

  function dessinerPoints(svg, liste, surClic) {
    var calque = svg.querySelector("[data-points]");
    if (!calque || !CARTE) return;
    calque.innerHTML = "";
    liste.forEach(function (c) {
      if (!enFrance(c)) return;
      var p = projeter(c);
      var g = document.createElementNS(SVGNS, "g");
      var halo = document.createElementNS(SVGNS, "circle");
      halo.setAttribute("class", "halo"); halo.setAttribute("cx", p[0]); halo.setAttribute("cy", p[1]); halo.setAttribute("r", 9);
      halo.style.animationDelay = (Math.random() * 3).toFixed(2) + "s";
      var pt = document.createElementNS(SVGNS, "circle");
      pt.setAttribute("class", "point"); pt.setAttribute("cx", p[0]); pt.setAttribute("cy", p[1]); pt.setAttribute("r", 5);
      pt.dataset.id = c.id;
      var titre = document.createElementNS(SVGNS, "title");
      titre.textContent = c.t + " — " + c.e + (c.v ? " (" + c.v + ")" : "");
      pt.appendChild(titre);
      if (surClic) pt.addEventListener("click", function () { surClic(c); });
      g.appendChild(halo); g.appendChild(pt); calque.appendChild(g);
    });
  }

  function ficheCours(c) {
    var etiquettes = (c.l ? '<span class="etiquette etiquette--ligne">En ligne</span>' : "") +
      (c.v ? '<span class="etiquette">En salle</span>' : "");
    return '<li class="fiche-cours" id="cours-' + c.id + '" data-id="' + c.id + '">' +
      "<h3>" + echapper(c.t) + "</h3>" +
      '<p class="fiche-cours__ens">' + echapper(c.e || "Enseignant·e présenté·e sur la fiche") + "</p>" +
      '<p class="fiche-cours__lieu">' + etiquettes + echapper(c.v || "Cours à distance") + (c.r ? " · " + echapper(c.r) : "") + "</p>" +
      '<a href="' + echapper(c.u) + '">Voir la fiche du cours<span class="sr"> « ' + echapper(c.t) + ' »</span></a>' +
      "</li>";
  }

  var blocCours = document.querySelector("[data-cours]");
  if (blocCours && COURS.length) {
    var ordre = melanger(COURS);
    var limite = parseInt(blocCours.dataset.limite || "0", 10);
    var svg = blocCours.querySelector(".carte-france svg");
    var liste = blocCours.querySelector(".liste-cours");
    var champ = blocCours.querySelector("[data-recherche-cours]");
    var formats = blocCours.querySelectorAll("[data-format]");
    var compteur = blocCours.querySelector("[data-compteur]");
    var format = "tout";
    var LOT = 24, montres = LOT, resultat = [];
    var plus = document.createElement("button");
    plus.type = "button"; plus.className = "bouton bouton--contour mt-1"; plus.hidden = true;
    if (!limite) liste.insertAdjacentElement("afterend", plus);
    plus.addEventListener("click", function () { montres += LOT; rendre(true); });

    function filtrer() {
      var q = normaliser(champ ? champ.value : "");
      return ordre.filter(function (c) {
        if (format === "salle" && !c.v) return false;
        if (format === "ligne" && !c.l) return false;
        if (!q) return true;
        return normaliser(c.t + " " + c.e + " " + c.v + " " + c.r).indexOf(q) !== -1;
      });
    }
    function surligner(c) {
      blocCours.querySelectorAll(".fiche-cours.actif, .point.actif").forEach(function (e) { e.classList.remove("actif"); });
      var fiche = document.getElementById("cours-" + c.id);
      var point = svg && svg.querySelector('.point[data-id="' + c.id + '"]');
      if (point) point.classList.add("actif");
      if (!fiche && !limite) {
        var rang = resultat.indexOf(c);
        if (rang >= montres) { montres = rang + 1; rendre(true); fiche = document.getElementById("cours-" + c.id); }
      }
      if (fiche) { fiche.classList.add("actif"); fiche.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
      else if (limite) { window.location.href = "trouver-un-cours.html?q=" + encodeURIComponent(c.e); }
    }
    function rendre(garder) {
      var r = filtrer();
      resultat = r;
      if (!garder) montres = LOT;
      if (svg && !garder) dessinerPoints(svg, r, surligner);
      var affiches = r.slice(0, limite || montres);
      if (!limite) {
        var reste = r.length - affiches.length;
        plus.hidden = reste <= 0;
        plus.textContent = "Afficher " + Math.min(LOT, reste) + " cours de plus (" + reste + " à découvrir)";
      }
      liste.innerHTML = affiches.map(ficheCours).join("") ||
        '<li class="agenda__vide">Essayez un autre mot : une ville, un prénom, un nom spirituel… ou explorez toute la carte.</li>';
      if (compteur) {
        compteur.textContent = !r.length ? "" : limite
          ? pluriel(r.length, "cours sur la carte", "cours sur la carte") + " · une sélection différente à chaque visite"
          : pluriel(r.length, "cours trouvé", "cours trouvés") + ", présentés dans un ordre aléatoire";
      }
    }
    if (champ) {
      if (params.get("q")) champ.value = params.get("q");
      champ.addEventListener("input", function () { rendre(); });
    }
    formats.forEach(function (b) {
      b.addEventListener("click", function () {
        format = b.dataset.format;
        formats.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        rendre();
      });
    });
    rendre();
  }

  /* Formulaire de recherche de l'accueil : renvoie vers la carte complète */
  document.querySelectorAll("form[data-vers-carte]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = f.querySelector("input").value.trim();
      window.location.href = "trouver-un-cours.html" + (v ? "?q=" + encodeURIComponent(v) : "") + "#carte";
    });
  });

  /* -------------------------------------------------------- Trouver un enseignant */
  var blocEns = document.querySelector("[data-enseignants]");
  if (blocEns && COURS.length) {
    var parNom = {};
    COURS.forEach(function (c) {
      var cle = normaliser(c.e);
      if (!cle) return;
      if (!parNom[cle]) parNom[cle] = { nom: c.e, cours: [], villes: {} };
      parNom[cle].cours.push(c);
      if (c.v) parNom[cle].villes[c.v] = true;
    });
    var ens = melanger(Object.keys(parNom).map(function (k) { return parNom[k]; }));
    var listeEns = blocEns.querySelector(".liste-enseignants");
    var champEns = blocEns.querySelector("[data-recherche-enseignant]");
    var compteurEns = blocEns.querySelector("[data-compteur]");

    function initiales(nom) {
      return nom.split(/[\s\-–()]+/).filter(Boolean).slice(0, 2).map(function (m) { return m.charAt(0).toUpperCase(); }).join("");
    }
    var LOT_ENS = 24, montresEns = LOT_ENS;
    var plusEns = document.createElement("button");
    plusEns.type = "button"; plusEns.className = "bouton bouton--contour mt-1"; plusEns.hidden = true;
    listeEns.insertAdjacentElement("afterend", plusEns);
    plusEns.addEventListener("click", function () { montresEns += LOT_ENS; rendreEns(true); });
    function rendreEns(garder) {
      if (garder !== true) montresEns = LOT_ENS;
      var q = normaliser(champEns.value);
      var r = ens.filter(function (x) { return !q || normaliser(x.nom).indexOf(q) !== -1; });
      var reste = Math.max(0, r.length - montresEns);
      plusEns.hidden = reste === 0;
      plusEns.textContent = "Afficher " + Math.min(LOT_ENS, reste) + " enseignant·es de plus (" + reste + " à découvrir)";
      listeEns.innerHTML = r.slice(0, montresEns).map(function (x) {
        var villes = Object.keys(x.villes);
        var ligne = x.cours.some(function (c) { return c.l; });
        return '<li class="fiche-ens">' +
          '<span class="fiche-ens__avatar" aria-hidden="true">' + echapper(initiales(x.nom)) + "</span>" +
          "<h3>" + echapper(x.nom) + "</h3>" +
          "<p>" + pluriel(x.cours.length, "cours", "cours") + (villes.length ? " · " + echapper(villes.slice(0, 3).join(", ")) : "") + (ligne ? " · en ligne" : "") + "</p>" +
          '<ul class="fiche-ens__liens">' + x.cours.slice(0, 3).map(function (c) {
            return '<li><a href="' + echapper(c.u) + '">' + echapper(c.t) + "</a></li>";
          }).join("") + "</ul></li>";
      }).join("") || '<li class="agenda__vide">Essayez une autre orthographe ou le nom spirituel : la recherche lit aussi les noms partiels.</li>';
      compteurEns.textContent = !r.length ? "" : pluriel(r.length, "enseignant·e", "enseignant·es") + ", dans un ordre aléatoire à chaque visite";
    }
    if (params.get("nom")) champEns.value = params.get("nom");
    champEns.addEventListener("input", function () { rendreEns(); });
    rendreEns();
  }

  /* Formulaire de contact (maquette) : affiche un message de confirmation */
  document.querySelectorAll("form[data-maquette]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = f.querySelector("[data-message-maquette]");
      if (m) m.textContent = "Merci ! Dans le site final, votre message part directement à la FFKY.";
    });
  });

  /* Sous-navigation : repère la section en cours de lecture */
  var sousNav = document.querySelector(".sous-nav");
  if (sousNav && "IntersectionObserver" in window) {
    var liens = sousNav.querySelectorAll('a[href^="#"]');
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (!en.isIntersecting) return;
        liens.forEach(function (a) {
          if (a.getAttribute("href") === "#" + en.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    liens.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s) obs.observe(s); });
  }
})();
