/* Les coulisses : schéma du système et automatisation animée. */
(function () {
  const ui = App.ui, I = App.icon;
  const NODES = {
    site: ["Site et appli", "Inscriptions, planning", "globe"],
    bdd: ["Base de données", "Formations, dossiers", "database"],
    n8n: ["n8n", "Automatisations", "flow"],
    ia: ["IA de contrôle", "Lecture des pièces", "sparkle"],
    msg: ["Mails et WhatsApp", "Relances, alertes", "mail"],
    qua: ["Logiciel de financements", "Financements, délais", "clipboard"],
    fed: ["Site fédéral", "Ouverture des sessions", "award"]
  };
  const LINKS = [["site", "bdd"], ["bdd", "n8n"], ["n8n", "ia"], ["n8n", "msg"], ["n8n", "qua"], ["n8n", "fed"]];
  const FLOW = [
    [0, "Léa s'inscrit au PSE1 depuis son téléphone : son dossier est créé dans la base."],
    [1, "Elle dépose sa photo d'identité : n8n déclenche aussitôt le contrôle."],
    [2, "L'IA lit la pièce en 3 secondes : photo floue, elle prépare un conseil clair."],
    [3, "Un mail et un WhatsApp bienveillants partent vers Léa, avec le lien pour redéposer."],
    [4, "Le logiciel de financements est mis à jour : prise en charge CPF et délai suivis."]
  ];
  const LAYOUT = {
    h: { vb: "0 0 1000 415", w: 190, h: 72, pos: { site: [20, 205], bdd: [270, 205], n8n: [510, 205], ia: [510, 55], msg: [790, 60], qua: [790, 190], fed: [790, 320] }, zone: [250, 18, 470, 300] },
    v: { vb: "0 0 360 900", w: 220, h: 70, pos: { site: [60, 20], bdd: [60, 150], n8n: [60, 265], ia: [60, 380], msg: [60, 530], qua: [60, 655], fed: [60, 780] }, zone: [30, 120, 300, 375] }
  };

  function svg(kind) {
    const L = LAYOUT[kind], W = L.w, H = L.h;
    const mid = (n, side) => { const [x, y] = L.pos[n]; return side === "r" ? [x + W, y + H / 2] : side === "l" ? [x, y + H / 2] : side === "t" ? [x + W / 2, y] : [x + W / 2, y + H]; };
    const path = (a, b, i) => {
      if (kind === "h") {
        if (a === "n8n" && b === "ia") { const p = mid(a, "t"), q = mid(b, "b"); return "M" + p + " L" + q; }
        const p = mid(a, "r"), q = mid(b, "l"), dx = (q[0] - p[0]) / 2;
        return "M" + p + " C" + (p[0] + dx) + "," + p[1] + " " + (q[0] - dx) + "," + q[1] + " " + q;
      }
      if ((a === "site" && b === "bdd") || (a === "bdd" && b === "n8n") || (a === "n8n" && b === "ia")) { const p = mid(a, "b"), q = mid(b, "t"); return "M" + p + " L" + q; }
      const p = mid(a, "r"), q = mid(b, "r"), bulge = 300 + (i - 3) * 22;
      return "M" + p + " C" + bulge + "," + p[1] + " " + bulge + "," + q[1] + " " + q;
    };
    const z = L.zone;
    return '<svg class="schema schema-' + kind + '" viewBox="' + L.vb + '" role="img" aria-label="Schéma du système : site, base de données, automatisations n8n, IA de contrôle, mails et WhatsApp, logiciel de financements, site fédéral">' +
      '<rect class="zone" x="' + z[0] + '" y="' + z[1] + '" width="' + z[2] + '" height="' + z[3] + '" rx="18"/><text class="zone-t" x="' + (z[0] + 14) + '" y="' + (z[1] + z[3] - 12) + '">SERVEUR DÉDIÉ · DONNÉES EN FRANCE</text>' +
      LINKS.map(([a, b], i) => '<path class="link" id="' + kind + '-l' + i + '" d="' + path(a, b, i) + '"/>').join("") +
      Object.entries(L.pos).map(([k, [x, y]]) => '<g class="node" id="' + kind + '-n-' + k + '" transform="translate(' + x + ',' + y + ')"><rect width="' + W + '" height="' + H + '" rx="14"/>' +
        '<g transform="translate(14,' + (H / 2 - 14) + ')" style="color:#0A7483"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + I(NODES[k][2]).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + '</svg></g>' +
        '<text class="t" x="52" y="' + (H / 2 - 3) + '">' + NODES[k][0] + '</text><text class="s" x="52" y="' + (H / 2 + 15) + '">' + NODES[k][1] + '</text></g>').join("") +
      '<circle class="token" id="' + kind + '-tok" r="9" fill="#E5484D" stroke="#fff" stroke-width="3" opacity="0"/></svg>';
  }

  App.views.coulisses = function (el) {
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("flow") + 'Les coulisses</span><h1>Comment tout s\'enchaîne</h1><p class="lead">Derrière l\'écran, des outils qui travaillent ensemble pour que l\'équipe se concentre sur la formation.</p></div>' +
      '<div class="schema-wrap">' + svg("h") + svg("v") + '</div>' +
      '<div class="row mt"><button class="btn btn-primary" id="cl-play">' + I("play") + 'Voir une automatisation en action</button><span class="badge badge-sand">' + I("server") + 'Hébergé sur serveur dédié, données en France</span></div>' +
      '<div class="split mt-l"><section><h2 style="font-size:1.25rem">Le parcours d\'une pièce</h2><ol class="flow-log" id="cl-log">' + FLOW.map(([, t], i) => '<li><span class="n">' + (i + 1) + '</span><span>' + t + '</span></li>').join("") + '</ol></section>' +
      '<section><h2 style="font-size:1.25rem">En langage simple</h2><div class="legend-list">' +
      [["globe", "Site et appli", "La vitrine et le guichet : on y découvre les formations, on s'inscrit, on suit son dossier. Installable sur téléphone."],
       ["database", "Base de données", "Le classeur central : formations, sessions, stagiaires, pièces. Une seule source, toujours à jour."],
       ["flow", "n8n", "Le chef d'orchestre : quand un événement arrive (inscription, pièce, paiement), il déclenche la bonne action."],
       ["sparkle", "IA de contrôle", "Une assistante de lecture : elle repère une pièce floue, expirée ou hors sujet. Le bureau garde la décision."],
       ["mail", "Mails et WhatsApp", "Les messages partent au bon moment, avec un ton chaleureux et un lien direct."],
       ["clipboard", "Logiciel de financements", "Le registre qualité : prises en charge, délais, émargements et preuves, synchronisés."],
       ["award", "Site fédéral", "L'ouverture des sessions est préparée automatiquement, puis validée par le bureau."]].map(([ic, t, d]) => '<div class="legend-item"><span class="l-ico">' + I(ic) + '</span><div><b style="color:var(--navy)">' + t + '</b><p>' + d + '</p></div></div>').join("") +
      '</div></section></div><div class="section-sm"></div></div>';

    let running = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    function anime(kind, li) {
      return new Promise((res) => {
        const p = el.querySelector("#" + kind + "-l" + li), tok = el.querySelector("#" + kind + "-tok");
        if (!p || !tok) return res();
        p.classList.add("on");
        const [a, b] = LINKS[li];
        el.querySelector("#" + kind + "-n-" + a).classList.add("hl");
        const len = p.getTotalLength(), t0 = performance.now(), dur = reduce ? 1 : 1100;
        tok.setAttribute("opacity", "1");
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur), pt = p.getPointAtLength(len * k);
          tok.setAttribute("cx", pt.x); tok.setAttribute("cy", pt.y);
          if (k < 1 && document.contains(p)) requestAnimationFrame(step); else { el.querySelector("#" + kind + "-n-" + b).classList.add("hl"); res(); }
        };
        requestAnimationFrame(step);
      });
    }
    el.querySelector("#cl-play").onclick = async () => {
      if (running) return;
      running = true;
      const btn = el.querySelector("#cl-play");
      btn.disabled = true;
      el.querySelectorAll(".link").forEach((l) => l.classList.remove("on"));
      el.querySelectorAll(".node").forEach((n) => n.classList.remove("hl"));
      const lis = el.querySelectorAll("#cl-log li");
      lis.forEach((l) => l.classList.remove("on"));
      for (let i = 0; i < FLOW.length; i++) {
        if (!document.contains(btn)) return;
        lis[i].classList.add("on");
        await Promise.all([anime("h", FLOW[i][0]), anime("v", FLOW[i][0])]);
        await wait(reduce ? 50 : 500);
      }
      el.querySelectorAll(".token").forEach((t) => t.setAttribute("opacity", "0"));
      btn.disabled = false; running = false;
      ui.toast("Automatisation terminée : le dossier est à jour, Léa a reçu son conseil.");
    };
  };
})();
