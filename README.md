# Crypto en visuel

**Crypto en visuel** (*Crypto, Visualized*) : des notions de cryptographie racontées par de petites
histoires en 3D, pour le cours **Cryptographie** de Simon Bédard. La page d'accueil liste les
épisodes : https://javakhanstudio.github.io/Crypto_en_visuel/

## Les épisodes et leur adresse

Chaque épisode vit dans son dossier, et son adresse ne bouge plus une fois réservée : les cartes
du cours pointent dessus. Un épisode pas encore construit a déjà son dossier, qui renvoie à sa
carte « Bientôt » sur l'accueil ; sa vraie page remplace ce renvoi quand il est publié (et passe
`live: true` dans `home.js`). Le numéro d'épisode est fixé aussi. Les 7 suivants ont été choisis
dans cryptographie r66.

| N° | Épisode | Adresse | État |
|---|---|---|---|
| 1 | Le problème des deux généraux | https://javakhanstudio.github.io/Crypto_en_visuel/deux-generaux/ | publié |
| 2 | Le cadenas de Bob (clé publique) | https://javakhanstudio.github.io/Crypto_en_visuel/cadenas/ | bientôt |
| 3 | Les couleurs de Diffie-Hellman (+ Eve au milieu) | https://javakhanstudio.github.io/Crypto_en_visuel/diffie-hellman/ | bientôt |
| 4 | La scytale | https://javakhanstudio.github.io/Crypto_en_visuel/scytale/ | bientôt |
| 5 | Enigma, une touche | https://javakhanstudio.github.io/Crypto_en_visuel/enigma/ | bientôt |
| 6 | Le pingouin et la chaîne (ECB, CBC, bit-flip) | https://javakhanstudio.github.io/Crypto_en_visuel/pingouin/ | bientôt |
| 7 | Le sel (et la lenteur de bcrypt) | https://javakhanstudio.github.io/Crypto_en_visuel/sel/ | bientôt |
| 8 | Le garde trop pressé (HMAC, timing attack) | https://javakhanstudio.github.io/Crypto_en_visuel/garde/ | bientôt |

Dans un épisode, `#story=N` est l'**étape** N de son histoire (pas un numéro d'épisode),
`#sandbox` et `#quiz` ses autres modes, `?lang=en` l'anglais. Les anciens liens vers la racine
(`…/Crypto_en_visuel/#story=5`, `#sandbox`, `#quiz`) sont renvoyés vers `deux-generaux/` avec le
même lien.

## Épisode 1 — Le problème des deux généraux

Démo interactive : deux armées, Arnaud et Bastien,
doivent attaquer la ville d'Étienne au même moment, et ne peuvent se parler que par des messagers
qu'Étienne peut capturer. La démo montre pourquoi aucun nombre fini d'accusés de réception ne donne
la certitude, ce que fait TCP à la place, et ce que la cryptographie (HMAC) règle ou ne règle pas.

Interactive demo of the Two Generals' Problem, French first, English with `?lang=en`.

## Lancer

Aucune dépendance, aucun build : three.js r170 est copié dans `vendor/` (la démo marche hors
ligne, en salle). Il faut seulement un serveur HTTP (les modules ES ne se chargent pas en `file://`) :

```sh
python3 -m http.server 8793
```

puis http://localhost:8793/ (l'accueil) ou http://localhost:8793/deux-generaux/.

## Ce qu'il y a dedans

| Mode | Contenu |
|---|---|
| **Histoire** | 17 étapes en 6 chapitres : le problème, un messager, l'accusé, la régression infinie (avec la preuve par l'absurde), le monde réel (rafales, TCP, l'aube), et la crypto (faux messager d'Étienne, HMAC, ce que le HMAC ne fait pas). Flèches ou télécommande de présentation pour avancer. |
| **Bac à sable** | Envoyer des messagers dans les deux sens, protocole automatique, rafale de 10, probabilité de capture, « le prochain est capturé », faux messager, HMAC, règle de l'aube. |
| **Quiz** | 8 questions (FR/EN) avec explication de chaque réponse. |

Le panneau **Qui sait quoi ?** tient l'échelle de connaissance (« Arnaud sait que Bastien sait que… ») ;
au-dessus des châteaux, une colonne de blocs lumineux la double en 3D, et un « ? » flotte là où
le prochain messager devrait arriver.

Liens directs : `deux-generaux/#story=5`, `#sandbox`, `#quiz` ; `?lang=en`.

## Fichiers

```
index.html, home.js, home.css   l'accueil de la série (liste des épisodes, renvoi des anciens liens)
vendor/three/       three.js r170, partagé par les épisodes
<slug>/index.html   épisode pas encore construit : renvoie à sa carte sur l'accueil
deux-generaux/      l'épisode 1 :
  index.html          la page, les panneaux
  vignette.jpg        sa carte sur l'accueil
  css/style.css
  js/main.js          rendu, bloom, boucle, modes
  js/world.js         terrain, châteaux, ville d'Étienne, route, ciel, aube
  js/camera.js        plans nommés, vols, poursuite d'un messager
  js/messenger.js     un cavalier : livré, capturé, ou refusé (HMAC)
  js/sim.js           le protocole : numéros de message, qui sait quoi, l'aube
  js/ladder.js        l'échelle de connaissance (texte + 3D)
  js/bubbles.js       bulles de dialogue accrochées à la scène
  js/story.js         les étapes
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
tools/shoot.py out/etape5 --query '?instant=1' --hash '#story=5'   # deux-generaux/ par défaut
tools/shoot.py out/accueil --page ''                                # l'accueil
```

`?instant=1` coupe les vols de caméra et l'écriture progressive des bulles, sinon le rendu
logiciel n'a pas le temps de les finir avant la capture.
