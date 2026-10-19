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
L'épisode 1 est devenu une saga, *La saga des deux généraux* (1.1 à 1.6, r89) : l'accueil la
montre en un seul bloc sous « Épisode 1 » (`saga: 1` dans `home.js`).

| N° | Épisode | Adresse | État |
|---|---|---|---|
| 1.1 | Le problème des deux généraux | https://javakhanstudio.github.io/Crypto_en_visuel/deux-generaux/ | publié |
| 1.2 | Eve lit tout (AES-256-CBC) | https://javakhanstudio.github.io/Crypto_en_visuel/eve-lit-tout/ | bientôt |
| 1.3 | L'octet changé (HMAC) | https://javakhanstudio.github.io/Crypto_en_visuel/octet-change/ | bientôt |
| 1.4 | La clé qui traverse la vallée (RSA-OAEP, chiffrement hybride) | https://javakhanstudio.github.io/Crypto_en_visuel/cle-vallee/ | bientôt |
| 1.5 | Le paquet complet | https://javakhanstudio.github.io/Crypto_en_visuel/paquet-complet/ | bientôt |
| 1.6 | Eve a encore des tours (signature, rejeu, AES-GCM) | https://javakhanstudio.github.io/Crypto_en_visuel/encore-des-tours/ | bientôt |
| 2 | Le cadenas de Bob (clé publique) | https://javakhanstudio.github.io/Crypto_en_visuel/cadenas/ | publié |
| 3 | Les couleurs de Diffie-Hellman (+ Eve au milieu) | https://javakhanstudio.github.io/Crypto_en_visuel/diffie-hellman/ | publié |
| 4 | La scytale | https://javakhanstudio.github.io/Crypto_en_visuel/scytale/ | publié |
| 5 | Enigma, une touche | https://javakhanstudio.github.io/Crypto_en_visuel/enigma/ | publié |
| 6 | Le pingouin et la chaîne (ECB, CBC, bit-flip) | https://javakhanstudio.github.io/Crypto_en_visuel/pingouin/ | publié |
| 7 | Le sel (et la lenteur de bcrypt) | https://javakhanstudio.github.io/Crypto_en_visuel/sel/ | publié |
| 8 | Le garde trop pressé (HMAC, timing attack) | https://javakhanstudio.github.io/Crypto_en_visuel/garde/ | publié |

Dans un épisode, `#story=N` est l'**étape** N de son histoire (pas un numéro d'épisode),
`#sandbox` et `#quiz` ses autres modes, `?lang=en` l'anglais. Les anciens liens vers la racine
(`…/Crypto_en_visuel/#story=5`, `#sandbox`, `#quiz`) sont renvoyés vers `deux-generaux/` avec le
même lien.

## Épisode 1 — Le problème des deux généraux

Démo interactive : deux armées, Alice et Bob,
doivent attaquer la ville d'Eve au même moment, et ne peuvent se parler que par des messagers
qu'Eve peut capturer. La démo montre pourquoi aucun nombre fini d'accusés de réception ne donne
la certitude et ce que fait TCP à la place. Il se termine sur les quatre autres ruses d'Eve (lire,
modifier, se faire passer pour Alice, rejouer), qu'affrontent les épisodes 1.2 à 1.6 de la série.

Interactive demo of the Two Generals' Problem, French first, English with `?lang=en`.

## Épisode 2 — Le cadenas de Bob

La clé publique racontée avec la carte « Deux clés - Le cadenas de Bob » du cours : Bob fabrique
des cadenas ouverts et les distribue partout (sa clé publique), il garde la seule clé (sa clé
privée) ; Alice ferme sa boîte, Eve l'intercepte avec le même cadenas en main et ne peut pas
l'ouvrir, seul Bob l'ouvre. 10 étapes en 5 chapitres, un bac à sable (Eve intercepte ou non,
Eve a volé la clé ou non, qui essaie d'ouvrir), un quiz de 6 questions. Même structure que
`deux-generaux/` (`cadenas/js/stage.js` tient les accessoires et leurs animations).
`tests/cadenas_story.py` clique chaque bouton de l'histoire et vérifie où finit la boîte.

## Épisode 3 — Les couleurs de Diffie-Hellman

L'échange de Diffie-Hellman raconté avec les valeurs des cartes « Diffie-Hellman - Les couleurs »,
« - Les calculs », « - Au milieu » et « - La parade » du cours : JAUNE public, ROUGE (Alice) et
BLEU (Bob) secrets, ORANGE et VERT envoyés sous les yeux d'Eve, le même MARRON des deux côtés ;
puis les nombres de la carte suivante (p = 23, g = 5, a = 6 → 8, b = 15 → 19, secret 2). Eve ne
sait pas démélanger. Ensuite Eve se met au milieu (son NOIR, son KAKI envoyé des deux côtés, un
secret avec chacun, un message lu et rechiffré), et la parade : la part de Bob porte un sceau
que le certificat permet de vérifier. 15 étapes en 6 chapitres, un bac à sable (couleurs
secrètes, Eve regarde ou se met au milieu, Bob signe ou non), un quiz de 7 questions.
La couleur d'un pot ne dépend que de sa recette (`diffie-hellman/js/paint.js`) : même recette,
même couleur. `tests/dh_story.py` clique chaque bouton et vérifie le contenu de chaque pot.

## Épisode 4 — La scytale

La carte « Une histoire de casse - La scytale » du cours : une bandelette enroulée sur un bâton,
le message écrit dans la longueur ; déroulée, elle n'affiche qu'un charabia, et seul un bâton du
même diamètre la remet en ordre. La diapo ne donne pas de message : l'épisode prend « ATTAQUEZ
DEMAIN À L'AUBE » (en anglais « ATTACK TOMORROW AT DAWN », même forme : 20 lettres) sur un bâton
de 4 lettres par tour, soit 4 lignes de 5 (ATTAQ, UEZDE, MAINA, LAUBE) et la bandelette
AUMLTEAATZIUADNBQEAE. Eve essaie un bâton de 3 lettres par tour (ALAZABA, UTAIDQE, METUNE) puis
de 5 (AEIB…), Bob relit avec le sien. 12 étapes en 5 chapitres, un bac à sable (votre message,
le bâton d'Alice et celui de relecture, de 2 à 6 lettres par tour), un quiz de 6 questions.
L'arithmétique est seule dans `scytale/js/scytale.js` ; la bandelette (`scytale/js/strip.js`) est
un ruban dont chaque point est placé à chaque image : à plat, en hélice sur un bâton, roulé sur
la tête du messager. Le tableau en haut à droite (`card.js`) garde à chaque lettre la couleur de
la ligne où Alice l'a écrite. `tests/scytale_story.py` clique chaque bouton et vérifie ce que lit
chaque bâton.

## Épisode 5 — Enigma, une touche

Une seule touche, lentement, avec les valeurs de la carte « Enigma - À la main » du cours :
rotors I, II, III, réflecteur B, départ AAA, sans câble au tableau de connexions. Alice tape O :
le rotor de droite avance d'abord (AAB), puis le courant traverse III, II, I (D, K, N), le
réflecteur (K), et revient par I, II, III (B, J, T) jusqu'à la lampe T. Le même O en AAB allume
I (G R U C Y V I) ; OUI depuis AAA donne TVG, qui part par radio sous l'antenne d'Eve ; Bob,
réglé sur AAA, tape TVG et lit OUI. L'anglais garde ces valeurs (OUI y est présenté comme le oui
de la diapo). Les rotors sortent de la machine et s'écartent, en verre, pour qu'on voie leurs
fils ; le tableau en haut à droite est celui de la diapo, rempli au passage du courant.
13 étapes en 6 chapitres, un bac à sable (position de départ, clavier, « remettre au départ et
taper le chiffré »), un quiz de 7 questions. L'arithmétique est seule dans `enigma/js/enigma.js`
(pas réel d'Enigma I, double pas compris) ; `tests/enigma_values.mjs` la compare à la diapo
(`node tests/enigma_values.mjs`), `tests/enigma_story.py` clique chaque bouton de l'histoire et
du bac à sable et vérifie positions, lampes et lignes du tableau.

## Épisode 6 — Le pingouin et la chaîne

Les modes d'opération avec les valeurs des cartes du cours (« Modes - L'exemple suivi »,
« ECB - Un exemple », « CBC - Un exemple », « CBC - L'IV - Un exemple », « Bit-flip - Un exemple »,
autour de « Modes d'opération - ECB - Le pingouin ») : clé `cle-de-16-octets`, le message de 53
octets VIREMENT URGENT! | montant=00100EUR | VIREMENT URGENT! | Alice (un en-tête générique là où
les diapos ont le nom de l'école, r78) en 4 caisses sur un tapis
roulant. En ECB, chaque caisse passe seule dans la presse AES et C1 = C3 (ac b5 67 95…) ; le
pingouin de la diapo, chiffré pour de vrai (un octet par pixel, un bloc = 16 pixels d'une ligne),
garde sa silhouette en ECB et devient du bruit en CBC. En CBC, chaque caisse passe d'abord dans un
anneau XOR avec le bloc chiffré précédent (l'IV 7e fa 5a… pour le premier) ; un autre IV
(1a 2f 1c…) donne un tout autre chiffré. Eve retourne les bits 09 de l'octet 8 de C1 (ff → f6) :
Bob lit P1 détruit et montant=90100EUR. La parade : un HMAC sur l'IV et le chiffré, vérifié par Bob
avant de déchiffrer. La diapo ne donne pas de clé HMAC : l'épisode prend `cle-hmac-secrete`.
13 étapes en 6 chapitres, un bac à sable (votre message, ECB ou CBC, le bit qu'Eve retourne, avec
ou sans HMAC), un quiz de 7 questions. `pingouin/js/aes.js` est un vrai AES-128 (ECB, CBC, PKCS#7),
`tests/pingouin_values.mjs` le compare aux diapos et au vecteur de FIPS-197
(`node tests/pingouin_values.mjs`), `tests/pingouin_story.py` clique chaque bouton de l'histoire et
du bac à sable et vérifie les caisses, le tableau et le verdict de Bob.

## Épisode 7 — Le sel (et la lenteur de bcrypt)

Stocker un mot de passe, avec les valeurs de la carte « Mots de passe - Le sel » du cours :
Alice et Bob s'inscrivent avec password, MD5 donne 5f4dcc3b aux deux, la base fuit et Eve
retrouve password dans sa table précalculée (celle de « Mots de passe - Dictionnaire » :
password, 123456, admin…). Avec un sel tiré pour chacun, x7k2m et r3n8q, collé au bout du mot de
passe (la diapo écrit password+x7k2m, MD5 reçoit passwordx7k2m) : cffbee8f et 648c5237, et la
table ne sert plus. Eve essaie alors un par un, à plus de dix milliards par seconde (six heures
pour tous les mots de 8 caractères alphanumériques, « SHA-256 est trop rapide ») ; bcrypt
rounds=12 (0,24 s par hachage sur la machine de Simon, « bcrypt - La lenteur ») la ramène à
quelques milliers par seconde, plus de mille ans, mais password tombe encore : il est en tête de
sa liste. 13 étapes en 6 chapitres, un bac à sable (deux mots de passe, MD5 sans sel, avec sel ou
bcrypt, Eve vole la base et estime son temps ; « Mesurer » chronomètre un vrai bcrypt et MD5 dans
le navigateur), un quiz de 7 questions. `sel/js/hash.js` est un vrai MD5 et un vrai bcrypt (les
tables de Blowfish sont calculées depuis les décimales de pi) ; le bac à sable lance bcrypt dans
un worker (`sel/js/worker.js`). `tests/sel_values.mjs` les compare aux diapos, à la RFC 1321 et à
la bibliothèque bcrypt de Python (`node tests/sel_values.mjs`), `tests/sel_story.py` clique chaque
bouton de l'histoire et du bac à sable et vérifie la base, la copie d'Eve et son compteur.

## Épisode 8 — Le garde trop pressé (HMAC, timing attack)

La timing attack sur la comparaison d'un HMAC, avec les valeurs des cartes « HMAC » et
« HMAC - La timing attack » du cours : clé `cle_secrete_partagee`, message
« Transfert 1000 euros a Bob », HMAC-SHA256 `1598e59f…`. Le badge d'Alice (message + HMAC) passe
le garde, qui recalcule le HMAC et compare les 64 lettres. Eve ne connaît pas la clé, donc pas le
bon HMAC de son ordre (« …a Eve », `b2ef0922…`) ; un badge au hasard est refusé dès la première
lettre. Mais le garde compare avec `==`, qui s'arrête au premier caractère différent : plus le
début est juste, plus la réponse tarde. Eve chronomètre, essaie les 16 lettres hexadécimales à
chaque position et garde la plus lente — au plus 64 × 16 = 1 024 essais, au lieu de 16⁶⁴ — et
reconstitue le HMAC lettre par lettre ; son faux ordre passe. `hmac.compare_digest` regarde
toujours les 64 lettres : seize barres égales, l'attaque s'effondre. 10 étapes en 5 chapitres, un
bac à sable (choisir l'ordre d'Eve et le garde en service, == ou compare_digest, puis lancer
l'attaque) et un quiz de 6 questions. `garde/js/hmac.js` est un vrai SHA-256 (FIPS 180-4) et un
vrai HMAC-SHA256 (RFC 2104), calculés dans la page. `tests/garde_values.mjs` les compare à
`node:crypto` et aux valeurs de Python (`node tests/garde_values.mjs`), `tests/garde_story.py`
clique chaque bouton de l'histoire et du bac à sable et vérifie le verdict du garde, le registre
de Bob, le préfixe retrouvé par Eve et ses barres de temps.

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
| **Histoire** | 14 étapes en 6 chapitres : le problème, un messager, l'accusé, la régression infinie (avec la preuve par l'absurde), le monde réel (rafales, TCP, l'aube), et la suite (les quatre ruses d'Eve que la cryptographie arrête, épisodes 1.2 à 1.6). Flèches ou télécommande de présentation pour avancer. |
| **Bac à sable** | Envoyer des messagers dans les deux sens, protocole automatique, rafale de 10, probabilité de capture, « le prochain est capturé », règle de l'aube. |
| **Quiz** | 6 questions (FR/EN) avec explication de chaque réponse. |

Le panneau **Qui sait quoi ?** tient l'échelle de connaissance (« Alice sait que Bob sait que… ») ;
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
  js/world.js         terrain, châteaux, ville d'Eve, route, ciel, aube
  js/camera.js        plans nommés, vols, poursuite d'un messager
  js/messenger.js     un cavalier : livré ou capturé (le faux cavalier refusé au HMAC y reste pour l'épisode 1.3)
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
