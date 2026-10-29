# Voix enregistrées (à venir)

Déposer ici les fichiers `<id>.<lang>.mp3` (lang = `fr`, `kr` ou `en`), puis :
1. ajouter `"<id>.<lang>"` dans `VOIX_ENREGISTREES` (js/audio.js) ;
2. ajouter le chemin du fichier dans `FICHIERS` de `sw.js` et incrémenter `VERSION` (écoute hors connexion).

Identifiants des bulles : `intro0`, `intro1`, `intro2`, `st1-brief` … `st5-brief`, `st1-fin` … `st5-fin`, `dossier`, `relacher`, `secret`. Les variantes « soirée » et « classe » ont le suffixe `-soiree` / `-classe` (ex. `intro1-soiree.fr.mp3`). Liste complète et textes : TEXTES.md.

Conseils : mono, 64 à 96 kbit/s, normaliser vers −16 LUFS, pas plus d'une demi-seconde de silence au début.
