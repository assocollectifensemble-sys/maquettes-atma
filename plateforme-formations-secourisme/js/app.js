/* Démarrage de l'application. */
(function () {
  const c = App.config;
  document.getElementById("brand-logo").innerHTML = App.logo(40);
  document.getElementById("footer-logo").innerHTML = App.logo(36);
  document.getElementById("brand-name").textContent = c.nom;
  document.getElementById("brand-tag").textContent = "Secourisme · Natation";
  document.getElementById("footer-name").textContent = c.nom;

  document.querySelectorAll(".role-btn").forEach((b) => b.addEventListener("click", () => {
    App.store.update((s) => { s.role = b.dataset.role; });
    App.go(App.HOME[b.dataset.role]);
  }));
  document.getElementById("brand").addEventListener("click", (e) => {
    e.preventDefault();
    App.go(App.HOME[App.store.get().role]);
  });
  document.getElementById("reset-demo").addEventListener("click", () => {
    App.ui.confirm("Réinitialiser la démo ?", "Les inscriptions, positionnements et réglages de cette démonstration reviennent à leur état d'origine.", "Réinitialiser", () => {
      App.store.reset();
      App.ui.toast("La démo repart de zéro, tout est prêt.");
      App.go("#/");
    });
  });
  document.querySelector(".skip").addEventListener("click", (e) => { e.preventDefault(); document.getElementById("app").focus(); });
  App.ui.typo(document.body);
  App.router.start();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
