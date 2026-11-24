/* Outils d'interface partagés : formats, typographie française, modales, toasts, téléchargements. */
(function () {
  const ui = {};
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  ui.MOIS = MOIS; ui.JOURS = JOURS;

  ui.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  ui.parse = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  ui.iso = (d) => { const z = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()); };
  ui.today = () => ui.iso(App.data.J0);
  ui.diff = (a, b) => Math.round((ui.parse(b) - ui.parse(a)) / 86400000); // jours de a vers b
  ui.add = (iso, n) => { const d = ui.parse(iso); d.setDate(d.getDate() + n); return ui.iso(d); };
  ui.dCourt = (iso) => { const d = ui.parse(iso); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); };
  ui.dNum = (iso) => ui.dCourt(iso) + "/" + ui.parse(iso).getFullYear();
  ui.dLong = (iso, jour) => { const d = ui.parse(iso); return (jour ? JOURS[d.getDay()] + " " : "") + (d.getDate() === 1 ? "1er" : d.getDate()) + " " + MOIS[d.getMonth()] + " " + d.getFullYear(); };
  const MC = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  ui.MC = MC;
  ui.dMoyen = (iso) => { const d = ui.parse(iso); return (d.getDate() === 1 ? "1er" : d.getDate()) + " " + MC[d.getMonth()]; };
  ui.mois = (iso) => { const d = ui.parse(iso); return MOIS[d.getMonth()] + " " + d.getFullYear(); };
  ui.prix = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n).replace(/ /g, " ");
  ui.plage = (s) => s.dates.length === 1 ? ui.dLong(s.date, true) : "du " + ui.dMoyen(s.date) + " au " + ui.dMoyen(s.dateFin) + " " + ui.parse(s.dateFin).getFullYear();
  ui.relatif = (iso) => {
    const n = ui.diff(ui.today(), iso);
    if (n === 0) return "aujourd'hui"; if (n === 1) return "demain"; if (n === -1) return "hier";
    return n > 0 ? "dans " + n + " jours" : "il y a " + (-n) + " jours";
  };
  ui.restantes = (s) => Math.max(0, s.places - s.inscrits);
  ui.placesBadge = (s) => {
    const r = ui.restantes(s);
    if (ui.diff(ui.today(), s.date) < 0) return '<span class="badge badge-muted">Session réalisée</span>';
    if (r === 0) return '<span class="badge badge-muted">Complet · liste d\'attente</span>';
    if (r <= 3) return '<span class="badge badge-warn">' + r + (r > 1 ? " dernières places" : " dernière place") + '</span>';
    return '<span class="badge badge-ok">' + r + ' places disponibles</span>';
  };
  ui.initiales = (nom) => nom.split(/[\s-]+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  /* Typographie française : espace insécable avant : ; ! ? € » et après « */
  ui.typo = function (root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentNode && /^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE)$/.test(n.parentNode.nodeName)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    let n;
    while ((n = w.nextNode())) {
      const t = n.nodeValue;
      if (!/[:;!?€»«]/.test(t)) continue;
      const r = t.replace(/ ([:;!?»€])/g, " $1").replace(/« /g, "« ").replace(/(\d)([€])/g, "$1 $2");
      if (r !== t) n.nodeValue = r;
    }
  };
  ui.typoTexte = (t) => String(t).replace(/ ([:;!?»€])/g, " $1").replace(/« /g, "« ");

  /* Toasts */
  ui.toast = function (msg, type) {
    const zone = document.getElementById("toasts");
    const t = document.createElement("div");
    t.className = "toast toast-" + (type || "ok");
    t.setAttribute("role", "status");
    t.innerHTML = App.icon(type === "info" ? "info" : type === "warn" ? "alert" : "checkCircle") + "<span>" + ui.esc(ui.typoTexte(msg)) + "</span>";
    zone.appendChild(t);
    requestAnimationFrame(() => t.classList.add("in"));
    setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 3600);
  };

  /* Modale accessible */
  let lastFocus = null;
  ui.modal = function (opts) {
    ui.closeModal();
    lastFocus = document.activeElement;
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap" + (opts.large ? " modal-large" : "") + (opts.drawer ? " modal-drawer" : "");
    wrap.id = "modal";
    wrap.innerHTML = '<div class="modal-back" data-close></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<header class="modal-head"><h2 id="modal-title">' + opts.title + '</h2><button class="icon-btn" data-close aria-label="Fermer">' + App.icon("x") + '</button></header>' +
      '<div class="modal-body">' + opts.body + '</div>' + (opts.foot ? '<footer class="modal-foot">' + opts.foot + '</footer>' : '') + '</div>';
    document.body.appendChild(wrap);
    document.body.classList.add("no-scroll");
    ui.typo(wrap);
    wrap.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) ui.closeModal(); });
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Escape") ui.closeModal();
      if (e.key === "Tab") {
        const f = wrap.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
    requestAnimationFrame(() => { wrap.classList.add("in"); const h = wrap.querySelector(".modal-head .icon-btn"); h && h.focus(); });
    if (opts.onOpen) opts.onOpen(wrap.querySelector(".modal"));
    return wrap.querySelector(".modal");
  };
  ui.closeModal = function () {
    const m = document.getElementById("modal");
    if (!m) return;
    m.remove();
    document.body.classList.remove("no-scroll");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  };

  ui.confirm = function (title, text, okLabel, onOk) {
    const m = ui.modal({ title, body: "<p>" + text + "</p>", foot: '<button class="btn btn-ghost" data-close>Retour</button><button class="btn btn-primary" id="confirm-ok">' + okLabel + "</button>" });
    m.querySelector("#confirm-ok").addEventListener("click", () => { ui.closeModal(); onOk(); });
  };

  /* Téléchargement local (aucune requête réseau) */
  ui.download = function (nom, contenu, type) {
    const blob = new Blob([contenu], { type: type || "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  ui.docHTML = function (titre, corps) {
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + ui.esc(titre) + '</title><style>body{font-family:system-ui,sans-serif;color:#14243A;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.5}h1{font-family:Georgia,serif;color:#0B2A4A}table{width:100%;border-collapse:collapse}td,th{border:1px solid #cfd8e3;padding:8px;text-align:left}th{background:#F4ECDF}.demo{font-size:12px;color:#52627A;border-top:1px solid #ddd;margin-top:32px;padding-top:8px}</style></head><body><p><strong>' + ui.esc(App.config.nom) + '</strong></p>' + corps + '<p class="demo">Document de démonstration généré localement par la maquette — données fictives.</p></body></html>';
  };

  ui.statutPiece = {
    conforme: { nom: "Conforme", cls: "ok", ico: "checkCircle" },
    illisible: { nom: "Illisible", cls: "warn", ico: "eye" },
    expire: { nom: "Expiré", cls: "warn", ico: "clock" },
    mauvaise: { nom: "Mauvaise pièce", cls: "err", ico: "alert" },
    manquant: { nom: "Manquant", cls: "muted", ico: "plus" },
    attente: { nom: "En lecture", cls: "info", ico: "clock" }
  };
  ui.badgePiece = (st) => { const s = ui.statutPiece[st] || ui.statutPiece.attente; return '<span class="badge badge-' + s.cls + '">' + App.icon(s.ico) + s.nom + "</span>"; };

  ui.vide = (ico, titre, texte, action) => '<div class="empty">' + App.icon(ico) + '<h3>' + titre + '</h3><p>' + texte + '</p>' + (action || '') + '</div>';

  App.ui = ui;
})();
