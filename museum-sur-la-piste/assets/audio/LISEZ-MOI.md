# Voix enregistrées (à venir : voix de Jonathan)

1. Déposer chaque fichier ici sous la forme `<id>.<lang>.mp3`, avec `lang` = `fr`, `kr` ou `en`.
   Les identifiants (`intro0`, `st1-brief`, `st1-revelation`, `marche2`, `st2-temps`…) sont listés dans `TEXTES.md`.
   Variante classe : `<id>-classe.<lang>.mp3` (ex. `intro3-classe.fr.mp3`).
2. Ajouter l'identifiant dans `VOIX_ENREGISTREES` (`js/audio.js`), par exemple `"intro0.kr"`.
3. Ajouter le chemin dans `FICHIERS` (`sw.js`) pour l'écoute hors connexion, puis incrémenter `VERSION`.

En attendant : FR et EN passent par la synthèse vocale du navigateur ; en kréol, le texte s'affiche et un message annonce la voix de Jonathan.
