(function(){
  var V=window.VILLA||{}, $=function(s,c){return (c||document).querySelector(s)}, $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
  var salut='Bonjour '+(V.hotes||'')+', ';
  var intro=salut+'je souhaite des informations sur '+V.nom+'.';
  var aWa=!!V.whatsapp, aMail=!!V.email;
  function lienWa(t){return 'https://wa.me/'+V.whatsapp+'?text='+encodeURIComponent(t)}
  function lienMail(t){return 'mailto:'+V.email+'?subject='+encodeURIComponent('Demande de séjour · '+V.nom)+'&body='+encodeURIComponent(t)}
  // boutons de contact
  $$('[data-wa]').forEach(function(a){ if(aWa){a.href=lienWa(intro)} else {a.classList.add('masque')} });
  $$('[data-tel]').forEach(function(a){ if(aWa){a.href='tel:+'+V.whatsapp; if(a.hasAttribute('data-aff')) a.textContent=V.telAffiche} else {a.classList.add('masque')} });
  $$('[data-mail]').forEach(function(a){ if(aMail){a.href=lienMail(intro); if(a.hasAttribute('data-aff')) a.textContent=V.email} else {a.classList.add('masque')} });
  $$('[data-annonce]').forEach(function(a){a.href=V.annonce});
  $$('[data-nom]').forEach(function(e){e.textContent=V.nom});
  $$('[data-hotes]').forEach(function(e){e.textContent=V.hotes});
  var n=$('#numero'); if(n) n.textContent=V.numeroEnregistrement||'numéro de déclaration en mairie à compléter';
  // révélation douce
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vu');io.unobserve(e.target)}})},{threshold:.12}):null;
  $$('.rev').forEach(function(el){io?io.observe(el):el.classList.add('vu')});
  // barre collante mobile
  var bar=$('#barre'),hero=$('.hero');
  if(bar&&hero&&'IntersectionObserver' in window){new IntersectionObserver(function(es){bar.classList.toggle('on',!es[0].isIntersecting)}).observe(hero)}
  // visionneuse
  var lb=$('#lb'),lbi=$('#lb img'),imgs=$$('.galerie a'),cur=0;
  function show(i){cur=(i+imgs.length)%imgs.length;lbi.src=imgs[cur].href;lbi.alt=imgs[cur].querySelector('img').alt;lb.classList.add('on');document.body.style.overflow='hidden'}
  function hide(){lb.classList.remove('on');document.body.style.overflow=''}
  imgs.forEach(function(a,i){a.addEventListener('click',function(e){e.preventDefault();show(i)})});
  $('#lb .x').onclick=hide;$('#lb .p').onclick=function(){show(cur-1)};$('#lb .s').onclick=function(){show(cur+1)};
  lb.addEventListener('click',function(e){if(e.target===lb)hide()});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;if(e.key==='Escape')hide();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)});
  // formulaire : message prêt (WhatsApp, sinon e-mail, sinon annonce)
  var f=$('#demande'), ok=$('#ok'), okBtn=ok&&ok.querySelector('a'), okTxt=$('#ok-canal');
  if(okBtn){ if(aWa){okBtn.textContent='Ouvrir WhatsApp avec ma demande'; if(okTxt) okTxt.textContent='sur WhatsApp'}
    else if(aMail){okBtn.textContent='Ouvrir ma messagerie avec ma demande'; if(okTxt) okTxt.textContent='par e-mail'}
    else {okBtn.textContent='Continuer sur l’annonce'; if(okTxt) okTxt.textContent='depuis l’annonce'} }
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var d=new FormData(f),t=salut+'demande de réservation (demi-pension) pour '+V.nom+' à Aurère :\n'+
      '• Nuit du : '+d.get('arrivee')+'\n• Départ le : '+d.get('depart')+'\n• Randonneurs : '+d.get('voyageurs')+'\n• Couchage : '+d.get('couchage')+'\n• Nom : '+d.get('nom')+'\n• Contact : '+d.get('contact')+(d.get('message')?'\n• Message : '+d.get('message'):'');
    okBtn.href=aWa?lienWa(t):(aMail?lienMail(t):V.annonce);
    ok.hidden=false;ok.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  var a=$('[name=arrivee]'),dp=$('[name=depart]'),today=new Date().toISOString().slice(0,10);a.min=today;dp.min=today;
  a.addEventListener('change',function(){dp.min=a.value||today;if(dp.value&&dp.value<=a.value)dp.value=''});
})();
