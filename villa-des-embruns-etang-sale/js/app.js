(function(){
  var V=window.VILLA, $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
  $$('[data-wa]').forEach(function(a){a.href='https://wa.me/'+V.whatsapp+'?text='+encodeURIComponent('Bonjour Pierre et Léa, je souhaite des informations sur la Villa des Embruns.')});
  $$('[data-tel]').forEach(function(a){a.href='tel:+'+V.whatsapp; if(a.hasAttribute('data-aff')) a.textContent=V.telAffiche});
  $$('[data-airbnb]').forEach(function(a){a.href=V.airbnb});
  var n=$('#numero'); if(n) n.textContent=V.numeroEnregistrement||'à renseigner dès l’ouverture du téléservice national (attendu en 2027)';
  // révélation douce
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vu');io.unobserve(e.target)}})},{threshold:.12}):null;
  $$('.rev').forEach(function(el){io?io.observe(el):el.classList.add('vu')});
  // barre collante mobile
  var bar=$('#barre'),hero=$('.hero');
  if(bar&&'IntersectionObserver' in window){new IntersectionObserver(function(es){bar.classList.toggle('on',!es[0].isIntersecting)}).observe(hero)}
  // lightbox
  var lb=$('#lb'),lbi=$('#lb img'),imgs=$$('.galerie a'),cur=0;
  function show(i){cur=(i+imgs.length)%imgs.length;lbi.src=imgs[cur].href;lbi.alt=imgs[cur].querySelector('img').alt;lb.classList.add('on');document.body.style.overflow='hidden'}
  function hide(){lb.classList.remove('on');document.body.style.overflow=''}
  imgs.forEach(function(a,i){a.addEventListener('click',function(e){e.preventDefault();show(i)})});
  $('#lb .x').onclick=hide;$('#lb .p').onclick=function(){show(cur-1)};$('#lb .s').onclick=function(){show(cur+1)};
  lb.addEventListener('click',function(e){if(e.target===lb)hide()});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;if(e.key==='Escape')hide();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)});
  // formulaire : démonstration, message prêt pour WhatsApp
  var f=$('#demande');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d=new FormData(f),t='Bonjour Pierre et Léa, demande de réservation pour la Villa des Embruns :\n'+
      '• Arrivée : '+d.get('arrivee')+'\n• Départ : '+d.get('depart')+'\n• Voyageurs : '+d.get('voyageurs')+'\n• Nom : '+d.get('nom')+'\n• Contact : '+d.get('contact')+(d.get('message')?'\n• Message : '+d.get('message'):'');
    var ok=$('#ok');ok.hidden=false;ok.querySelector('a').href='https://wa.me/'+V.whatsapp+'?text='+encodeURIComponent(t);ok.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  var a=$('[name=arrivee]'),dp=$('[name=depart]'),today=new Date().toISOString().slice(0,10);a.min=today;dp.min=today;
  a.addEventListener('change',function(){dp.min=a.value||today;if(dp.value&&dp.value<=a.value)dp.value=''});
})();
