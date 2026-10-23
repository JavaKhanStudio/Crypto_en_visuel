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
| 1.2 | Eve lit tout (AES-256-CBC) | https://javakhanstudio.github.io/Crypto_en_visuel/eve-lit-tout/ | publié |
| 1.3 | L'octet changé (HMAC-SHA256) | https://javakhanstudio.github.io/Crypto_en_visuel/octet-change/ | publié |
| 1.4 | La clé qui traverse la vallée (RSA-OAEP, chiffrement hybride) | https://javakhanstudio.github.io/Crypto_en_visuel/cle-vallee/ | publié |
| 1.5 | Le paquet complet (l'ordre des opérations, un fichier par rôle) | https://javakhanstudio.github.io/Crypto_en_visuel/paquet-complet/ | publié |
| 1.6 | Eve a encore des tours (signature, rejeu, AES-GCM) | https://javakhanstudio.github.io/Crypto_en_visuel/encore-des-tours/ | publié |
| 2 | Le cadenas de Bob (clé publique) | https://javakhanstudio.github.io/Crypto_en_visuel/cadenas/ | publié |
| 3 | Les couleurs de Diffie-Hellman (+ Eve au milieu) | https://javakhanstudio.github.io/Crypto_en_visuel/diffie-hellman/ | publié |
| 4 | La scytale | https://javakhanstudio.github.io/Crypto_en_visuel/scytale/ | publié |
| 5.1 | Enigma, une touche | https://javakhanstudio.github.io/Crypto_en_visuel/enigma/ | publié |
| 5.2 | Enigma, le vrai réglage (câbles, bagues, encoche, double pas, nombre de réglages) | https://javakhanstudio.github.io/Crypto_en_visuel/enigma-reglage/ | publié |
| 5.3 | Enigma, la casse (jamais elle-même, le mot probable, le menu, la bombe de Turing) | https://javakhanstudio.github.io/Crypto_en_visuel/enigma-casse/ | publié |
| 6 | Le pingouin et la chaîne (ECB, CBC, bit-flip) | https://javakhanstudio.github.io/Crypto_en_visuel/pingouin/ | publié |
| 7 | Le sel (et la lenteur de bcrypt) | https://javakhanstudio.github.io/Crypto_en_visuel/sel/ | publié |
| 8 | Le garde trop pressé (HMAC, timing attack) | https://javakhanstudio.github.io/Crypto_en_visuel/garde/ | publié |
| 9 | La roue et le caillou (Vigenère, l'attaque de Kasiski) | https://javakhanstudio.github.io/Crypto_en_visuel/kasiski/ | publié |
| 10 | Le tunnel (VPN, WireGuard : X25519 et ChaCha20-Poly1305) | https://javakhanstudio.github.io/Crypto_en_visuel/vpn/ | publié |
| 11 | AES de l'intérieur (les 14 tours d'AES-256 sur un bloc) | https://javakhanstudio.github.io/Crypto_en_visuel/aes-interieur/ | publié |

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
Sa dernière étape ouvre quatre portes, une image chacune : bac à sable, quiz, tous les épisodes,
et l'épisode 1.2 en dernier, à droite ; au survol, un clip de 4 s de la destination tourne en boucle
(`tests/last_doors.py`, images par `tools/door_thumbs.py`, clips par `tools/door_clips.py`).

Interactive demo of the Two Generals' Problem, French first, English with `?lang=en`.

## Épisode 1.2 — Eve lit tout

Eve ne capture plus les messagers : ses gardes les arrêtent sous ses murs, elle lit l'ordre et les
laisse repartir. Alice chiffre alors l'ordre en AES-256-CBC : une clé de 32 octets, des blocs de
16 octets, le padding PKCS7, le chaînage CBC et l'IV, puis une clé et un IV neufs à chaque envoi
pour qu'Eve ne reconnaisse plus un ordre qui revient. Le chapitre AES se passe dans le donjon
d'Alice : la caméra entre par sa fenêtre, et une machine montée sur les vrais octets grandit d'une
étape à l'autre (la clé, AES sur P1, le padding, la chaîne CBC), puis ressort à « Eve lit… du
bruit » (`eve-lit-tout/js/inside.js`, vérifié par `tests/eve_inside.py`). 12 étapes en 4 chapitres, un bac à sable
(votre ordre, envoyé en clair, avec la même clé, ou avec une clé et un IV neufs ; le carnet d'Eve
montre ce qu'elle reconnaît), un quiz de 7 questions. Même vallée et même distribution que
`deux-generaux/`. Le chiffrement est calculé dans la page (`lib/aes.js`, vrai AES-256, avec les valeurs de `eve-lit-tout/js/values.js`)
et vérifié par `node tests/eve_values.mjs` contre FIPS-197, openssl et WebCrypto ;
`tests/eve_story.py` joue chaque chevauchée et le bac à sable.

## Épisode 1.3 — L'octet changé

Eve ne sait plus lire le chiffré, mais elle peut l'écrire : elle change le 11e octet de l'IV (XOR 0f),
et Bob déchiffre « ATTAQUE A 9H DEMAIN » au lieu de 6H, sans aucune erreur. Un octet du chiffré
marche aussi (un bloc de bruit, un octet changé dans le suivant). Alice scelle alors l'IV et le
chiffré d'un HMAC-SHA256, avec une deuxième clé ; Bob recalcule le sceau, rejette le paquet changé
et le faux cavalier d'Eve, vérifie AVANT de déchiffrer (oracle de padding) et compare en temps
constant (renvoi à l'épisode 8). Le chapitre du sceau se passe dans le donjon d'Alice : la caméra
entre par sa fenêtre, et une machine HMAC-SHA256 montée sur les vrais octets grandit d'une étape à
l'autre (la clé HMAC à côté de la clé AES, le sceau de l'IV et du chiffré en deux passes de SHA-256,
puis le calcul de Bob sur le paquet changé : un autre sceau), puis ressort à « Le sceau à la porte de
Bob » (`octet-change/js/inside.js`, vérifié par `tests/octet_inside.py`). 13 étapes en 4 chapitres, un bac à sable (votre ordre ; Eve ne
touche à rien, change un octet de l'IV ou du chiffré, ou envoie son cavalier ; Bob vérifie le sceau
ou non), un quiz de 7 questions. Tout est calculé dans la page (`lib/saga-aes.js`,
`lib/hmac.js`) et vérifié par `node tests/octet_values.mjs` contre FIPS-197, RFC 4231,
openssl, le module `hmac` de Python et WebCrypto ; `tests/octet_story.py` joue chaque chevauchée et
le bac à sable. La dernière étape ouvre quatre portes avec leur clip au survol : bac à sable, quiz, tous les
épisodes, puis l'épisode 1.4 en or à droite (`lib/doors.js`, `tests/last_doors.py octet-change 13 cle-vallee`).

## Épisode 1.4 — La clé qui traverse la vallée

Les deux clés, AES et HMAC, doivent arriver chez Bob, et Alice et Bob ne se sont jamais vus.
Envoyées en clair, Eve les recopie à sa porte, déchiffre l'ordre, écrit 9H et refait un sceau
valide : tout ce qui précède tombe. Bob envoie alors son cadenas ouvert, sa clé publique RSA-2048
(RSA à la main d'abord : 5 × 11 = 55, e = 3, d = 27, 7 → 13 → 7). Ces deux étapes se passent dans le
donjon de Bob : la caméra entre par sa fenêtre ; 5 et 11 donnent n = 55, le cadenas et la clé se
chargent dans deux boîtes, 7 entre, 13 sort, 13 entre, 7 ressort ; puis 5 et 11 deviennent deux murs
de 128 octets cachés, leur produit n se pose, les 256 octets de la carte, avec e = 65537 et un
crochet sur les 829 bits de RSA-250 ; la caméra ressort à « Le cadenas traverse la vallée ». Eve recopie le cadenas en route, il
ferme et n'ouvre pas. Alice ferme ses 64 octets de clés en RSA-OAEP (SHA-256, graine de 32 octets :
mêmes clés, deux graines, deux blocs sans rapport), Bob les rouvre avec sa clé privée. « Alice ferme le cadenas » se passe dans le donjon d'Alice : la
caméra entre par sa fenêtre, et un mur de 256 octets se monte sur les vrais octets (les deux clés,
01, les zéros, le hachage du label, la graine), deux masques le balaient, puis EM entre dans la boîte
où pend le cadenas ouvert de Bob, qui se ferme, et c en sort ; la caméra ressort à « Pourquoi OAEP »
(`cle-vallee/js/inside.js`, vérifié par `tests/cle_inside.py`). Puis le
chiffrement hybride (190 octets au plus par bloc, RSA lent), des clés neuves à chaque ordre, et le
paquet complet ; la fin renvoie aux épisodes 2 (le cadenas) et 3 (Diffie-Hellman), et ouvre quatre portes
avec leur clip au survol : bac à sable, quiz, tous les épisodes, puis l'épisode 1.5 en or à droite (`lib/doors.js`,
`tests/last_doors.py cle-vallee 13 paquet-complet`). 13 étapes en 4
chapitres, un bac à sable (votre ordre ; les clés en clair ou fermées ; Eve lit ou change l'ordre),
un quiz de 7 questions. RSA et OAEP sont calculés dans la page sur BigInt (`lib/rsa.js`, partagé avec 1.5 et 1.6,
la paire de Bob tirée une fois avec openssl, des graines fixes pour l'histoire) et vérifiés par
`node tests/cle_values.mjs` contre openssl (`pkeyutl`, OAEP SHA-256), WebCrypto et `pow` de
Python ; `tests/cle_story.py` joue chaque chevauchée et le bac à sable.

## Épisode 1.5 — Le paquet complet

Les quatre briques dans l'ordre, et ce que les étudiants construisent. Côté Alice, quatre gestes,
dans son donjon : la caméra entre par sa fenêtre, et le paquet se monte brique par brique à mesure
que les vrais octets passent par quatre machines : trois tirages neufs (`os.urandom`), chiffrer
l'ordre (PKCS7, AES-256-CBC), sceller IV ‖ chiffré (HMAC-SHA256), fermer clé AES ‖ clé HMAC au
cadenas de Bob (RSA-2048-OAEP), vérifié par `tests/paquet_alice.py`. Le paquet traverse (336 octets, Eve n'ouvre rien) ; côté
Bob, trois gestes : ouvrir les clés, vérifier le sceau, seulement alors déchiffrer, dans son donjon :
la caméra entre par sa fenêtre, et les vrais octets passent par trois machines (les clés fermées dans
RSA-2048 avec sa clé privée, IV ‖ chiffré dans HMAC-SHA256 et son sceau comparé octet par octet à
celui du paquet, puis seulement AES-256-CBC, le padding retiré, l'ordre lu). Eve change le 1er
octet du chiffré : rejeté sans être déchiffré ; un octet changé dans chacune des quatre briques,
rejeté chaque fois ; pourquoi vérifier avant de déchiffrer (ce que Bob aurait déchiffré, l'oracle de
padding, `compare_digest`), de nouveau dans le donjon de Bob : sur le paquet d'Eve la lampe passe au
rouge et AES reste fermé, puis l'erreur, déchiffrer d'abord, montre ce qu'AES rend des octets d'Eve
(`paquet-complet/js/inside.js`, vérifié par `tests/paquet_inside.py`). Puis le code : les quatre fichiers et leurs fonctions, la scène de
`main.py` rejouée par deux cavaliers dans un terminal (« Bonjour Bob ! », puis « ALERTE : HMAC
invalide »), les choix que le README justifie ; la fin renvoie aux épisodes 1.2, 1.3 et 1.4, et ouvre quatre portes avec
leur clip au survol : bac à sable, quiz, tous les épisodes, puis l'épisode 1.6 en or à droite (`lib/doors.js`,
`tests/last_doors.py paquet-complet 14 encore-des-tours`). 14
étapes en 4 chapitres, un bac à sable (votre ordre ; Eve laisse passer ou change l'octet de votre
choix dans la brique de votre choix ; Bob vérifie d'abord ou déchiffre d'abord), un quiz de 7
questions. Le moteur et les valeurs sont ceux de 1.4 (`paquet-complet/js/packet.js` assemble) ;
`node tests/paquet_values.mjs` rejoue `receive_message` hors de la page (openssl `enc` et `pkeyutl`,
`hmac.compare_digest` de Python) et contre WebCrypto ; `tests/paquet_story.py` joue chaque
chevauchée, la scène de `main.py` et le bac à sable.

## Épisode 1.6 — Eve a encore des tours

Le « Pour aller plus loin » de l'atelier, dans `encore-des-tours/`, construit sur 1.5. Le cadenas de
Bob est public : Eve fabrique un paquet entier (« JE SUIS ALICE, DONNE-MOI LE CODE ») avec ses
propres clés, et Bob l'accepte, car le HMAC prouve « quelqu'un qui a la clé » et c'est l'expéditeur
qui la tire. Alice signe le paquet (RSA-PSS, SHA-256, sel de 32 octets, sa propre paire RSA-2048) ;
Bob vérifie avec sa clé publique avant d'ouvrir quoi que ce soit ; Eve signe avec sa clé : rejeté.
La signature se passe dans les donjons : la caméra entre par la fenêtre d'Alice, où le paquet passe
dans SHA-256, puis PSS monte un bloc de 256 octets (l'empreinte, le sel, un masque) que sa clé
privée change en signature ; elle traverse ensuite chez Bob, où la clé publique d'Alice rend le bloc
et où l'empreinte recalculée tombe sous celle qu'il porte, octet pour octet. Même chose pour
AES-GCM : chez Alice, les compteurs, le flux, le chiffré, GHASH et le tag ; chez Bob, l'octet
d'Eve, un tag qui ne correspond plus, InvalidTag et pas un octet de l'ordre
(`encore-des-tours/js/inside.js`, vérifié par `tests/tours_inside.py`).
Puis le rejeu : Eve garde la copie d'un vrai paquet signé et la renvoie le lendemain, acceptée ; un
numéro sous la signature (n° 42, Bob retient le plus grand reçu) l'arrête, et changer 42 en 43
casse la signature. AES-256-GCM chiffre et scelle d'un geste (InvalidTag, le piège du nonce
réutilisé) ; un paquet qui arrête les quatre tours ; la fin donne les questions de l'atelier
attaque-défense et renvoie à 1.5, 1.3 et 1.4, et ouvre quatre portes avec leur clip au survol : bac à
sable, quiz, tous les épisodes, puis l'épisode 2 en or à droite (`lib/doors.js`,
`tests/last_doors.py encore-des-tours 14 cadenas`). 14 étapes en 5 chapitres, un bac à sable (le tour
d'Eve : laisser passer, changer un octet, fabriquer, rejouer ; les défenses de Bob : signature,
numéro), un quiz de 7 questions. `encore-des-tours/js/sign.js` (RSA-PSS sur le RSA BigInt de 1.4) et
`js/gcm.js` (GCM sur l'AES de 1.2) calculent tout dans la page ; `node tests/tours_values.mjs` les
vérifie contre openssl (`dgst` PSS, `pkeyutl` OAEP, `enc`), le `hmac` de Python, le crypto de node et
WebCrypto ; `tests/tours_story.py` joue chaque chevauchée et le bac à sable.

## Épisode 2 — Le cadenas de Bob

La clé publique racontée avec la carte « Deux clés - Le cadenas de Bob » du cours : Bob fabrique
des cadenas ouverts et les distribue partout (sa clé publique), il garde la seule clé (sa clé
privée) ; Alice ferme sa boîte, Eve l'intercepte avec le même cadenas en main et ne peut pas
l'ouvrir, seul Bob l'ouvre. 10 étapes en 5 chapitres, un bac à sable (Eve intercepte ou non,
Eve a volé la clé ou non, qui essaie d'ouvrir), un quiz de 6 questions. Même structure que
`deux-generaux/` (`cadenas/js/stage.js` tient les accessoires et leurs animations). La dernière
étape ouvre quatre portes en image (bac à sable, quiz, tous les épisodes, puis l'épisode 3 en or à
droite), chacune avec un extrait de 4 s au survol (`tests/last_doors.py cadenas 10 diffie-hellman`).
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
même couleur. La dernière étape ouvre quatre portes en image (bac à sable, quiz, tous les
épisodes, puis l'épisode 4 en or à droite), chacune avec un extrait de 4 s au survol
(`tests/last_doors.py diffie-hellman 15 scytale`). `tests/dh_story.py` clique chaque bouton et
vérifie le contenu de chaque pot.

## Épisode 4 — La scytale

La carte « Une histoire de casse - La scytale » du cours : une bandelette enroulée sur un bâton,
le message écrit dans la longueur ; déroulée, elle n'affiche qu'un charabia, et seul un bâton du
même diamètre la remet en ordre. La diapo ne donne pas de message : l'épisode prend « ATTAQUEZ
DEMAIN À L'AUBE » (en anglais « ATTACK TOMORROW AT DAWN », même forme : 20 lettres) sur un bâton
de 4 lettres par tour, soit 4 lignes de 5 (ATTAQ, UEZDE, MAINA, LAUBE) et la bandelette
AUMLTEAATZIUADNBQEAE. Eve essaie un bâton de 3 lettres par tour (ALAZABA, UTAIDQE, METUNE) puis
de 5 (AEIB…), Bob relit avec le sien. 12 étapes en 5 chapitres, un bac à sable (votre message,
le bâton d'Alice et celui de relecture, de 2 à 6 lettres par tour), un quiz de 6 questions.
La dernière étape ouvre quatre portes en image (bac à sable, quiz, tous les épisodes, puis
l'épisode 5 Enigma en or à droite), chacune avec un extrait de 4 s au survol
(`tests/last_doors.py scytale 12 enigma`).
L'arithmétique est seule dans `scytale/js/scytale.js` ; la bandelette (`scytale/js/strip.js`) est
un ruban dont chaque point est placé à chaque image : à plat, en hélice sur un bâton, roulé sur
la tête du messager. Le tableau en haut à droite (`card.js`) garde à chaque lettre la couleur de
la ligne où Alice l'a écrite. `tests/scytale_story.py` clique chaque bouton et vérifie ce que lit
chaque bâton.

## Épisode 5.1 — Enigma, une touche

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

## Épisode 5.2 — Enigma, le vrai réglage

La suite de 5.1, avec la machine réelle réglée en quatre parties comme sur une feuille du jour :
rotors I, II, III, réflecteur B, bague du rotor de droite sur B, dix câbles au tableau
(BS CZ DN ER FI GU HO KW LM QY), départ ADU. Le même O qu'en 5.1 : T sans rien, F avec les câbles
(H, Q, Q, X… puis le câble I–F au retour), C avec la bague. Depuis ADU, OUI donne SMK, l'encoche V
fait avancer le rotor du milieu (AEW) puis le double pas (BFX) ; Bob tape SMK et lit OUI. Puis le
compte : 60 ordres × 17 576 départs × 150 738 274 937 250 tableaux = 158 962 555 217 826 360 000
réglages (environ 1,59 × 10²⁰, bagues à part), et la faille qui reste : aucune lettre ne devient
elle-même. 18 étapes en 7 chapitres, un bac à sable (trois rotors sur cinq, bagues, câbles, départ),
un quiz de 8 questions. L'arithmétique est seule dans `enigma-reglage/js/enigma.js` ;
`node tests/enigma-reglage_values.mjs` la compare d'abord à des vecteurs publiés (AAAAA → BDZGO,
le message Barbarossa de 1941), puis aux valeurs et chiffres écrits dans l'histoire ;
`tests/enigma-reglage_story.py` clique chaque bouton.

## Épisode 5.3 — Enigma, la casse

Le réglage de 5.2 (rotors I, II, III, bague B à droite, les dix mêmes câbles), départ IXX : Alice
chiffre le bulletin météo HEUTEXWETTERBERICHTXEIS en EBOWTASBRMHCEFBMMXEFFPA. Eve part de la faille
de 5.2, aucune lettre ne devient elle-même, et du mot probable WETTERBERICHT : glissé sous le
chiffré, il tombe sur une lettre identique aux places 1, 2, 3, 4, 6 ; il en reste cinq. Le menu de
la place 7 (13 liens, 12 lettres, la boucle E–B–R–T–E), puis une vraie course de la bombe sur un
seul ordre de rotors (I II III, bagues A, lettre test E) : les 5 menus × 17 576 positions =
87 880 essais donnent 9 arrêts ; le contrôle du commis sur la machine en écarte huit. Reste IXW
avec les câbles B–S, C–Z, E–R, F–I, H–O, K–W, L–M ; la première lecture HEGTEX… donne le dernier câble
G–U, et le message se lit. 16 étapes en 7 chapitres, un bac à sable, un quiz de 6 questions.
L'arithmétique est seule dans `enigma-casse/js/enigma.js` ; `node tests/enigma-casse_values.mjs` la
compare à des vecteurs publiés, refait la casse depuis zéro (places, menus, arrêts, contrôle,
lecture) et vérifie les chiffres écrits dans l'histoire ; `tests/enigma-casse_story.py` clique
chaque bouton.

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
ou sans HMAC), un quiz de 7 questions. `lib/aes.js` est un vrai AES, ici AES-128 (ECB, CBC, PKCS#7),
`tests/pingouin_values.mjs` le compare aux diapos et au vecteur de FIPS-197
(`node tests/pingouin_values.mjs`), `tests/pingouin_story.py` clique chaque bouton de l'histoire et
du bac à sable et vérifie les caisses, le tableau et le verdict de Bob. La dernière étape ouvre quatre
portes en image (bac à sable, quiz, tous les épisodes, puis l'épisode 7 en or à droite), chacune avec
un extrait de 4 s au survol (`tests/last_doors.py pingouin 13 sel`).

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
bouton de l'histoire et du bac à sable et vérifie la base, la copie d'Eve et son compteur. La
dernière étape ouvre quatre portes en image (bac à sable, quiz, tous les épisodes, puis l'épisode
8 en or à droite), chacune avec un extrait de 4 s au survol (`tests/last_doors.py sel 13 garde`).

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
l'attaque) et un quiz de 6 questions. `lib/hmac.js` est un vrai SHA-256 (FIPS 180-4) et un
vrai HMAC-SHA256 (RFC 2104), calculés dans la page. `tests/garde_values.mjs` les compare à
`node:crypto` et aux valeurs de Python (`node tests/garde_values.mjs`), `tests/garde_story.py`
clique chaque bouton de l'histoire et du bac à sable et vérifie le verdict du garde, le registre
de Bob, le préfixe retrouvé par Eve et ses barres de temps. La dernière étape ouvre quatre
portes en image (bac à sable, quiz, tous les épisodes, puis l'épisode 9 en or à droite), chacune
avec un extrait de 4 s au survol (`tests/last_doors.py garde 10 kasiski`).

## Épisode 9 — La roue et le caillou

L'attaque de Kasiski contre Vigenère, d'abord par une image : un caillou coincé sous le bandage
de fer d'une roue de la charrette d'Alice (2 m de tour) frappe le sol à chaque tour, et seule la
boue des flaques garde la marque ; Eve ne voit que la trace, mesure les écarts (4, 6, 10 m, jamais
2 m), avec deux gravillons enfoncés par la roue qu'elle ne peut pas trier et qui brouillent (3,7 et
2,3 m, 7,6 et 2,4 m), et garde le plus long pas qui divise le plus d'écarts : 2 m en divise 10 sur 14. Puis le
chiffre : la clé LEMON sur une roue à cinq faces roule sur un paragraphe français de 399 lettres ;
« LA MEME LETTRE », deux fois à 30 lettres d'écart, donne deux fois PMARXIXSGEVQ. Eve relève les
trigrammes qui reviennent, 48 distances : 5 en divise 44 (les 4 autres, 37, 76, 86, 154, sont du
hasard), 2 en divise 36 ; puis cinq colonnes, cinq César, E le plus fréquent : L, E, M, O, N.
12 étapes en 5 chapitres, un bac à sable (le tour de roue et le gravier, ou votre propre clé),
un quiz de 6 questions. `node tests/kasiski_values.mjs` refait le chiffrement et le compte et
vérifie les chiffres écrits dans l'histoire ; `tests/kasiski_story.py` clique chaque bouton.

## Épisode 10 — Le tunnel

Ce qu'un VPN cache, et ce qu'il ne cache pas. Alice, au Wi-Fi ouvert d'un café, ouvre le site de
Bob ; Eve est à la table voisine, le fournisseur d'accès entre les deux, et Victor fait tourner un
serveur VPN dans une autre ville. Une enveloppe porte deux adresses dehors (celle de la box du
café, 203.0.113.7, et celle de Bob, 198.51.100.20) ; chaque boîte du chemin les lit. Sans HTTPS,
Eve lit aussi le mot de passe ; avec HTTPS, le contenu est fermé, mais l'adresse, le nom du site,
l'heure et la taille fuient encore, au café comme chez le fournisseur. Puis le tunnel, à la
WireGuard : une paire de clés X25519 de chaque côté, le même secret calculé chez Alice et chez
Victor, l'enveloppe entière (adresse comprise) scellée par ChaCha20-Poly1305 dans une nouvelle
enveloppe vers le VPN, 192.0.2.44 ; un bit changé en chemin, et Victor jette le paquet. Enfin qui
voit quoi : Eve et le fournisseur ne voient plus que le VPN, Bob voit l'autre ville, et Victor voit
ce que le fournisseur voyait — la confiance se déplace ; à quoi sert un VPN, et ce qu'il ne fait
pas. 14 étapes en 5 chapitres, un bac à sable (VPN et HTTPS allumés ou non, Eve à l'une des quatre
places, un bit changé en chemin) et un quiz de 7 questions. X25519 et ChaCha20-Poly1305 sont
calculés dans la page ; `node tests/vpn_values.mjs` les compare aux vecteurs des RFC 7748 et 8439
et à `node:crypto`, et vérifie les adresses, octets et nombres écrits dans l'histoire ;
`tests/vpn_story.py` clique chaque bouton de l'histoire et du bac à sable.

## Épisode 11 — AES de l'intérieur

La boîte AES-256 de l'épisode 1.2, ouverte, dans le donjon d'Alice. Le bloc qu'elle reçoit
(P1 ⊕ IV, 16 octets) est posé en cubes, colonne par colonne : c'est l'état ; la clé d'Alice
(32 octets) donne les 15 clés de tour. Le tour 1 en détail, une étape à la fois (AddRoundKey,
SubBytes avec sa case de la S-box, ShiftRows, MixColumns, AddRoundKey), les tours 2 à 13 en
accéléré, le tour 14 sans MixColumns, et la sortie est le C1 de l'épisode 1.2, octet pour octet.
Puis une seule lettre du message changée : 1 octet diffère, 4 après le tour 1, les 16 après le tour 2.
13 étapes en 4 chapitres, un bac à sable (changer un octet du bloc ou de la clé, lancer les
14 tours, les cubes qui diffèrent cerclés de rouge) et un quiz de 6 questions. Le chiffrement est
calculé dans la page par `lib/aes.js` ; `node tests/aes_interieur_values.mjs` le compare, tour
par tour, à l'exemple C.3 de FIPS-197 et à l'épisode 1.2 ; `tests/aes_interieur_story.py` lit ce
que montrent les cubes à chaque étape et dans le bac à sable.

## Lancer

Aucune dépendance, aucun build : three.js r170 est copié dans `vendor/` (la démo marche hors
ligne, en salle). Il faut seulement un serveur HTTP (les modules ES ne se chargent pas en `file://`) :

```sh
python3 -m http.server 8793
```

puis http://localhost:8793/ (l'accueil) ou http://localhost:8793/deux-generaux/.

## Déployer (simonbedardprog.com/ficelle/)

Le dépôt est aussi servi tel quel, sans build, par le Worker Cloudflare `ficelle`
(simonbedardprog r97) à https://simonbedardprog.com/ficelle/ ; GitHub Pages reste l'adresse
que donne le cours.

- `wrangler.jsonc` sert la racine du dépôt comme fichiers statiques et route
  `simonbedardprog.com/ficelle*` et `www.simonbedardprog.com/ficelle*` vers le Worker ;
  `worker/ficelle.js` retire le préfixe `/ficelle` (et le remet dans les redirections).
- `.assetsignore` garde hors du web `tools/`, `tests/`, `out/`, `worker/`, `.atelier`, `.claude`,
  `README.md`, `wrangler.jsonc` et `lab/print` (r452 : la page d'impression ne tourne que sur la machine
  de Simon, derrière `tools/serve_review.py`).
- La mise en ligne passe par la branche `prod` (Workers Builds, tableau de bord Cloudflare) :
  c'est Simon qui la pousse (`git push origin main:prod`). Les sessions du tableau ne poussent
  jamais `prod` et ne lancent jamais `wrangler deploy`.

Trois règles pour ne pas le casser :

1. **Tout lien reste relatif.** Le site vit sous `/ficelle/` : un chemin absolu depuis la racine
   (`/lib/...`, `src="/assets/..."`, `fetch('/...')`) vise simonbedardprog.com/lib/ et casse.
   Écrire `../lib/...`, `../../lib/...`, `../assets/...`. Vérifier (ne doit rien trouver) :
   `grep -rnE "(src|href)=./[a-z]|from ./[a-z]|fetch\(./[a-z]" --include=*.html --include=*.js --include=*.css . | grep -vE '^./(tools|tests|out|worker|vendor)/'`
2. **Un nouveau dossier de premier niveau qui n'est pas pour le web** (outils, captures, données
   de travail) va dans `.assetsignore` dans le même commit.
3. **Après toute modification de `wrangler.jsonc` ou de `worker/`**, lancer
   `tools/probe_ficelle_worker.sh` (sous `wrangler dev`, rien n'est déployé) : chaque ligne doit
   être ✓ et la dernière dire `ok.` ; avec une adresse (`tools/probe_ficelle_worker.sh
   https://simonbedardprog.com`), il vérifie le site en ligne.

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
lib/saga/           la vallée de la saga 1.1-1.6, une seule copie (r423) :
  world.js            terrain, châteaux, ville d'Eve, route, ciel, aube (buildWorld(scene, { castles: 'middle-earth' | 'keep' }))
  castles.js          les deux châteaux de la Terre du Milieu : la cité blanche des humains (Alice), Caras Galadhon, la cité des mallorns des elfes (Bob)
  camera.js           plans nommés, vols, poursuite d'un messager
<slug>/index.html   épisode pas encore construit : renvoie à sa carte sur l'accueil
deux-generaux/      l'épisode 1 :
  index.html          la page, les panneaux
  vignette.jpg        sa carte sur l'accueil
  css/style.css
  js/main.js          rendu, bloom, boucle, modes
  lab/castles.html    les châteaux de lib/saga/ de près, sans l'histoire (?view=, ?cam=x,y,z,tx,ty,tz)
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
