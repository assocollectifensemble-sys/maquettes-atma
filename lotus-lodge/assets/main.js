/* ===== CONFIGURATION : seul endroit à modifier =====
   WHATSAPP : numéro au format international, chiffres uniquement            */
var CONFIG = {
  WHATSAPP: '23058071518'
};
/* =================================================== */
(function () {
  'use strict';
  var d = document, fr = d.documentElement.lang === 'fr';
  d.documentElement.className += ' js';
  function waUrl(t) { return 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(t); }
  function dateTxt(v) { var p = (v || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : '…'; }

  // Formulaire de demande directe -> message WhatsApp prérempli
  var f = d.getElementById('demande');
  if (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (f.elements[n] && f.elements[n].value || '').trim(); };
      var sel = f.elements.voyageurs, opt = sel && sel.options[sel.selectedIndex];
      var n = opt ? opt.getAttribute('data-n') : '…', who = opt ? opt.textContent : '';
      var t = fr
        ? 'Bonjour, je souhaite réserver le Lotus Lodge du ' + dateTxt(v('arrivee')) + ' au ' + dateTxt(v('depart')) + ' pour ' + n + (n === '1' ? ' personne' : ' personnes') + ' (' + who + ').'
        : 'Hello, I would like to book the Lotus Lodge from ' + dateTxt(v('arrivee')) + ' to ' + dateTxt(v('depart')) + ' for ' + n + (n === '1' ? ' guest' : ' guests') + ' (' + who + ').';
      if (v('message')) t += '\n\n' + v('message');
      window.open(waUrl(t), '_blank', 'noopener');
    });
  }

  // Vidéo de visite : la section reste masquée tant que assets/lotus-visite.mp4 est absent
  var vs = d.getElementById('video');
  if (vs) {
    var vid = vs.querySelector('video'), src = vid && vid.querySelector('source');
    var drop = function () { if (vs.parentNode) vs.parentNode.removeChild(vs); };
    if (!src || !window.fetch) drop();
    else {
      src.addEventListener('error', drop);
      fetch(src.getAttribute('src'), { method: 'HEAD' }).then(function (r) {
        var ct = r.headers.get('content-type') || '';
        if (r.ok && /video|octet-stream/.test(ct)) vs.hidden = false; else drop();
      }).catch(drop);
    }
  }

  // Barre d'action mobile : visible après le hero
  var bar = d.querySelector('.sticky'), hero = d.querySelector('.hero');
  if (bar && hero && 'IntersectionObserver' in window) {
    bar.classList.add('off');
    new IntersectionObserver(function (en) { bar.classList.toggle('off', en[0].isIntersecting); }).observe(hero);
  }

  // Lightbox galerie (clavier + tactile)
  var links = [].slice.call(d.querySelectorAll('.gal a')), lb = d.getElementById('lb');
  if (!links.length || !lb || !lb.showModal) return;
  var img = lb.querySelector('img'), cap = lb.querySelector('figcaption'), ct = lb.querySelector('.ct'), i = 0, last;
  function show(n) {
    i = (n + links.length) % links.length;
    var a = links[i], t = a.querySelector('img');
    img.src = a.getAttribute('href'); img.alt = t.alt; cap.textContent = t.alt;
    ct.textContent = (i + 1) + ' / ' + links.length;
    var nx = new Image(); nx.src = links[(i + 1) % links.length].getAttribute('href');
  }
  links.forEach(function (a, n) {
    a.addEventListener('click', function (e) { e.preventDefault(); last = a; show(n); lb.showModal(); lb.querySelector('.x').focus(); });
  });
  lb.querySelector('.x').addEventListener('click', function () { lb.close(); });
  lb.querySelector('.pv').addEventListener('click', function () { show(i - 1); });
  lb.querySelector('.nx').addEventListener('click', function () { show(i + 1); });
  lb.addEventListener('close', function () { if (last) last.focus(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
  }, { passive: true });
})();
