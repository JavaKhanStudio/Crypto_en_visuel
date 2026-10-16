# Le problème des deux généraux — démo 3D

Démo interactive pour le cours **Cryptographie** de Simon Bédard : deux armées, Alice et Bob,
doivent attaquer la ville d'Eve au même moment, et ne peuvent se parler que par des messagers
qu'Eve peut capturer. La démo montre pourquoi aucun nombre fini d'accusés de réception ne donne
la certitude, ce que fait TCP à la place, et ce que la cryptographie (HMAC) règle ou ne règle pas.

Interactive demo of the Two Generals' Problem, French first, English with `?lang=en`.

## Lancer

Aucune dépendance, aucun build : three.js r170 est copié dans `vendor/` (la démo marche hors
ligne, en salle). Il faut seulement un serveur HTTP (les modules ES ne se chargent pas en `file://`) :

```sh
python3 -m http.server 8793
```

puis http://localhost:8793/.

## Ce qu'il y a dedans

| Mode | Contenu |
|---|---|
| **Histoire** | 17 étapes en 6 chapitres : le problème, un messager, l'accusé, la régression infinie (avec la preuve par l'absurde), le monde réel (rafales, TCP, l'aube), et la crypto (faux messager d'Eve, HMAC, ce que le HMAC ne fait pas). Flèches ou télécommande de présentation pour avancer. |
| **Bac à sable** | Envoyer des messagers dans les deux sens, protocole automatique, rafale de 10, probabilité de capture, « le prochain est capturé », faux messager, HMAC, règle de l'aube. |
| **Quiz** | 8 questions (FR/EN) avec explication de chaque réponse. |

Le panneau **Qui sait quoi ?** tient l'échelle de connaissance (« Alice sait que Bob sait que… ») ;
au-dessus des châteaux, une colonne de blocs lumineux la double en 3D, et un « ? » flotte là où
le prochain messager devrait arriver.

Liens directs : `#story=5`, `#sandbox`, `#quiz` ; `?lang=en`.

## Fichiers

```
index.html          la page, les panneaux
css/style.css
js/main.js          rendu, bloom, boucle, modes
js/world.js         terrain, châteaux, ville d'Eve, route, ciel, aube
js/camera.js        plans nommés, vols, poursuite d'un messager
js/messenger.js     un cavalier : livré, capturé, ou refusé (HMAC)
js/sim.js           le protocole : numéros de message, qui sait quoi, l'aube
js/ladder.js        l'échelle de connaissance (texte + 3D)
js/bubbles.js       bulles de dialogue accrochées à la scène
js/story.js         les 17 étapes
js/sandbox.js       le bac à sable
js/quiz.js, js/quiz-data.js
js/army.js          les armées à l'aube
js/fx.js            particules, anneaux, icônes, feux d'artifice
js/sound.js         sons synthétisés (coupés par défaut)
js/i18n.js          tous les textes, FR et EN
tools/shoot.py      captures d'écran headless (playwright + SwiftShader)
```

## Captures

```sh
python3 -m http.server 8793 &
tools/shoot.py out/etape5 --query '?instant=1' --hash '#story=5'
```

`?instant=1` coupe les vols de caméra et l'écriture progressive des bulles, sinon le rendu
logiciel n'a pas le temps de les finir avant la capture.
