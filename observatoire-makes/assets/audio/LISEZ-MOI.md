# Voix enregistrées

Déposer ici les fichiers `<id>.<lang>.mp3` (lang = `fr`, `kr`, `en`), par exemple `intro0.fr.mp3`, `st1-brief.kr.mp3`.

Identifiants des bulles : `intro0` … `intro3` (variante classe : `intro2-classe`), `hub`, `st1-brief`, `st1-axe`, `st1-visee`, `st1-fin`, `marche2`, `st2-brief`, `st2-derive`, `st2-fin`.

Puis :
1. ajouter `"<id>.<lang>"` dans `VOIX_ENREGISTREES` (js/audio.js) ;
2. ajouter `"assets/audio/<id>.<lang>.mp3"` dans `FICHIERS` (sw.js) et incrémenter `VERSION`.

Sans fichier : synthèse vocale du navigateur en français et en anglais ; rien en kréol (texte affiché).
