/* Aide aux démarches : parcours guidés + mini-chat d'assistance (réponses préparées). */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;

  App.views.aide = function (el, [pid]) {
    const st = App.store.get();
    const p = pid ? D.parcours.find((x) => x.id === pid) : null;
    if (pid && !p) return App.views.notFound(el);
    if (!p) {
      el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("help") + 'Aide aux démarches</span><h1>On vous guide, étape par étape</h1><p class="lead">Financement, pièces, délais : choisissez votre situation et laissez-vous accompagner.</p></div>' +
        '<div class="grid g2">' + D.parcours.map((x) => {
          const done = (st.parcours[x.id] || []).filter(Boolean).length;
          return '<a class="card card-link path-card" href="#/aide/' + x.id + '"><span class="p-ico">' + I(x.icone) + '</span><span style="flex:1"><h2 style="font-size:1.15rem;margin-bottom:4px">' + x.titre + '</h2><span class="muted small" style="display:block">' + x.intro + '</span>' +
            '<span class="row mt" style="gap:8px"><span class="badge badge-sand">' + I("clock") + 'Environ ' + x.duree + '</span><span class="badge ' + (done === x.etapes.length ? "badge-ok" : "badge-info") + '">' + done + '/' + x.etapes.length + ' étapes</span></span></span>' + I("chevronRight") + '</a>';
        }).join("") + '</div>' +
        '<div class="card card-tint mt-l row" style="gap:16px;align-items:flex-start">' + '<span class="p-ico" style="width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#fff;color:var(--red-ink)">' + I("chat") + '</span><div style="flex:1"><h2 style="font-size:1.15rem">Une question précise ?</h2><p class="muted small">L\'assistant répond tout de suite aux questions fréquentes, et l\'équipe prend le relais pour le reste.</p><button class="btn btn-primary btn-sm" data-open-chat>' + I("chat") + 'Poser ma question</button></div></div><div class="section-sm"></div></div>';
    } else {
      const coche = st.parcours[p.id] || [];
      const total = p.etapes.reduce((a, e) => a + e.min, 0);
      el.innerHTML = '<div class="container narrow"><div class="page-head"><a class="back" href="#/aide">' + I("arrowLeft") + 'Toutes les démarches</a><span class="eyebrow" style="display:flex">' + I(p.icone) + 'Parcours guidé</span><h1>' + p.titre + '</h1><p class="lead">' + p.intro + '</p>' +
        '<div class="row"><span class="badge badge-sand">' + I("clock") + 'Durée estimée : ' + total + ' min</span><span class="badge badge-info" id="pc-count"></span></div>' +
        '<div class="progress mt" aria-hidden="true"><i id="pc-prog"></i></div></div>' +
        '<ol class="stack" style="list-style:none;padding:0;margin:16px 0 0">' + p.etapes.map((e, i) => '<li class="guide-step' + (coche[i] ? " done" : "") + '" data-i="' + i + '"><div class="guide-illu"><span class="n">' + (i + 1) + '</span>' + I(e.icone) + '</div><div><h2 style="font-size:1.05rem;margin:2px 0 4px;font-family:var(--serif)">' + e.t + '</h2><p>' + e.d + '</p>' +
          '<div class="row" style="gap:6px 14px"><label class="check"><input type="checkbox" data-c="' + i + '"' + (coche[i] ? " checked" : "") + '><span>C\'est fait</span></label><span class="small muted">' + I("clock") + ' ' + e.min + ' min</span>' +
          (e.action === "devis" ? '<button class="btn btn-ghost btn-sm" data-devis>' + I("download") + 'Télécharger un devis exemple</button>' : "") + '</div></div></li>').join("") + '</ol>' +
        '<div id="pc-end" class="mt"></div><div class="section-sm"></div></div>';
      const maj = () => {
        const n = (App.store.get().parcours[p.id] || []).filter(Boolean).length;
        el.querySelector("#pc-count").textContent = n + " / " + p.etapes.length + " étapes faites";
        el.querySelector("#pc-prog").style.width = (n / p.etapes.length * 100) + "%";
        el.querySelector("#pc-end").innerHTML = n === p.etapes.length ? '<div class="info-box ok">' + I("checkCircle") + '<p><b>Bravo, votre démarche est complète !</b> Prochaine étape : choisir votre session. <a href="#/formations">Voir les formations</a></p></div>' : "";
        ui.typo(el.querySelector("#pc-end"));
      };
      el.querySelectorAll("[data-c]").forEach((c) => c.addEventListener("change", () => {
        App.store.update((s) => { s.parcours[p.id] = s.parcours[p.id] || []; s.parcours[p.id][+c.dataset.c] = c.checked; });
        c.closest(".guide-step").classList.toggle("done", c.checked);
        maj();
      }));
      el.querySelectorAll("[data-devis]").forEach((b) => b.addEventListener("click", () => {
        ui.download("Devis_formation_exemple.html", ui.docHTML("Devis", "<h1>Devis de formation</h1><p>Formation : PSE1, Premiers Secours en Équipe de niveau 1 (35 h minimum)</p><table><tr><th>Désignation</th><th>Montant</th></tr><tr><td>Formation PSE1</td><td>390 €</td></tr></table><p>Devis valable 3 mois.</p>"));
        ui.toast("Devis exemple téléchargé.");
      }));
      maj();
    }
    el.querySelectorAll("[data-open-chat]").forEach((b) => b.addEventListener("click", () => App.chat.open()));
  };

  /* ---------- Mini-chat ---------- */
  App.chat = {
    sync() {
      let f = document.getElementById("help-fab");
      if (!f) {
        f = document.createElement("button");
        f.id = "help-fab"; f.className = "help-fab"; f.type = "button";
        f.innerHTML = I("chat") + "Besoin d'aide ?";
        f.addEventListener("click", () => App.chat.open());
        document.body.appendChild(f);
      }
      const show = /^#\/(aide|inscription|formation\/|espace)/.test(location.hash);
      f.hidden = !show;
      const p = document.getElementById("chat-panel");
      if (p && !show) p.hidden = true;
    },
    open() {
      let p = document.getElementById("chat-panel");
      if (!p) {
        p = document.createElement("section");
        p.id = "chat-panel"; p.className = "chat"; p.setAttribute("aria-label", "Assistant d'aide");
        p.innerHTML = '<header class="chat-head"><span class="ai-avatar" style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:var(--teal);color:var(--navy)">' + I("sparkle") + '</span><div><b>Assistant</b><small>Réponses immédiates · équipe en relais</small></div><button class="icon-btn" id="chat-close" aria-label="Fermer l\'assistant">' + I("x") + '</button></header>' +
          '<div class="chat-log" id="chat-log" aria-live="polite"></div><div class="chat-sugg" id="chat-sugg"></div>' +
          '<form class="chat-form" id="chat-form"><label class="sr" for="chat-in">Votre question</label><input class="input" id="chat-in" placeholder="Écrivez votre question…" autocomplete="off"><button class="icon-btn" style="background:var(--navy);color:#fff;border:0" aria-label="Envoyer">' + I("send") + '</button></form>';
        document.body.appendChild(p);
        p.querySelector("#chat-close").onclick = () => { p.hidden = true; document.getElementById("help-fab").focus(); };
        p.querySelector("#chat-form").addEventListener("submit", (e) => { e.preventDefault(); const v = p.querySelector("#chat-in").value.trim(); if (v) { p.querySelector("#chat-in").value = ""; this.ask(v); } });
        p.querySelector("#chat-sugg").innerHTML = D.faq.map((f, i) => '<button type="button" data-q="' + i + '">' + f.q + '</button>').join("");
        p.querySelectorAll("[data-q]").forEach((b) => b.addEventListener("click", () => this.ask(D.faq[+b.dataset.q].q, D.faq[+b.dataset.q].r)));
        this.bot("Bonjour ! Je réponds à vos questions sur les formations, les financements et les pièces à fournir. Que puis-je faire pour vous ?", true);
      }
      p.hidden = false;
      ui.typo(p);
      setTimeout(() => p.querySelector("#chat-in").focus(), 50);
    },
    bot(txt, instant) {
      const log = document.getElementById("chat-log");
      const m = document.createElement("div"); m.className = "msg bot";
      if (instant) { m.textContent = ui.typoTexte(txt); log.appendChild(m); return; }
      m.innerHTML = '<span class="typing" aria-label="L\'assistant écrit"><i></i><i></i><i></i></span>';
      log.appendChild(m); log.scrollTop = log.scrollHeight;
      setTimeout(() => { m.textContent = ui.typoTexte(txt); log.scrollTop = log.scrollHeight; }, 750);
    },
    ask(q, r) {
      const log = document.getElementById("chat-log");
      const m = document.createElement("div"); m.className = "msg me"; m.textContent = q; log.appendChild(m);
      if (!r) {
        const t = q.toLowerCase();
        const hit = D.faq.find((f) => f.mots.some((k) => t.includes(k)));
        r = hit ? hit.r : "Merci pour votre question ! Je la transmets à l'équipe, qui vous répond sous 24 h ouvrées par mail. En attendant, les parcours guidés de cette page couvrent les démarches les plus courantes.";
      }
      this.bot(r);
    }
  };
})();
