/* ATMA Digital : barre « Je veux ce site » commune à toutes les maquettes.
   Usage : <script src="/outils/cta.js" data-nom="Nom du commerce" defer></script>
   Le clic ouvre WhatsApp vers Jonathan avec un message prérempli (nom + lien de la page) :
   ce message est l'alerte. */
(function () {
  var s = document.currentScript || document.querySelector('script[src*="/outils/cta.js"]');
  var nom = (s && s.getAttribute('data-nom')) || document.title.split(/ [·—|-] /)[0].trim();
  var url = location.origin + location.pathname;
  var TEL = '262693828108';
  function wa(txt) { return 'https://wa.me/' + TEL + '?text=' + encodeURIComponent(txt); }
  var veux = wa('Bonjour Jonathan ! J\u2019ai vu la page « ' + nom + ' » et je veux ce site \uD83D\uDE42 ' + url);
  var appel = wa('Bonjour Jonathan, j\u2019aimerais en parler 10 minutes au téléphone de la page « ' + nom + ' ». Je suis disponible : ');

  var css = '' +
    '.atma-cta{position:fixed;left:50%;bottom:14px;transform:translate(-50%,140%);z-index:2147483000;display:flex;gap:8px;align-items:center;' +
    'background:rgba(20,16,16,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:8px;border-radius:999px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.35);font:600 15px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;transition:transform .5s cubic-bezier(.2,.8,.2,1);max-width:calc(100vw - 20px)}' +
    '.atma-cta.on{transform:translate(-50%,0)}' +
    '.atma-cta a{text-decoration:none;border-radius:999px;padding:11px 18px;white-space:nowrap;transition:transform .15s,filter .15s}' +
    '.atma-cta a:hover{transform:translateY(-1px);filter:brightness(1.08)}' +
    '.atma-cta .v{background:#25D366;color:#0b2b17}' +
    '.atma-cta .a{color:#fff;border:1px solid rgba(255,255,255,.35)}' +
    '.atma-cta button{background:none;border:0;color:rgba(255,255,255,.6);font-size:18px;cursor:pointer;padding:0 8px 0 2px}' +
    '@media (max-width:520px){.atma-cta{left:8px;right:8px;max-width:none;transform:translateY(140%);gap:6px;padding:6px}.atma-cta.on{transform:translateY(0)}'+
    '.atma-cta a{flex:1 1 0;min-width:0;text-align:center;padding:11px 6px;font-size:14px;white-space:normal}.atma-cta button{flex:0 0 auto;padding:0 6px}}' +
    'body{padding-bottom:84px}' +
    '@media print{.atma-cta{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var bar = document.createElement('div');
  bar.className = 'atma-cta';
  bar.setAttribute('role', 'complementary');
  bar.innerHTML =
    '<a class="v" target="_blank" rel="noopener" href="' + veux + '">Je veux ce site</a>' +
    '<a class="a" target="_blank" rel="noopener" href="' + appel + '">En parler 10 min</a>' +
    '<button type="button" aria-label="Masquer">\u00D7</button>';
  bar.querySelector('button').onclick = function () { bar.classList.remove('on'); setTimeout(function () { bar.remove(); }, 600); };

  function show() { document.body.appendChild(bar); setTimeout(function () { bar.classList.add('on'); }, 50); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(show, 2500); });
  else setTimeout(show, 2500);
})();
