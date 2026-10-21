// Every visible word of episode 1.5 « Le paquet complet », in French (the course language) and
// English. t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.
// Python names (files, functions, os.urandom) are code: the same in both languages.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Le paquet complet — Crypto en visuel',
  title: 'Le paquet complet',
  subtitle: 'Les quatre briques dans l’ordre : Alice ferme, Bob vérifie avant de déchiffrer, Eve est prise.',
  loading: 'Construction des châteaux…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chroniqueur' },
  ord: '{o} octet',

  // what Eve and Bob say when a rider passes
  'm.evePass': 'Des clés fermées, un IV, un chiffré, un sceau : {h}… Je ne sais rien ouvrir. Repars.',
  'm.eveFlip': 'Je ne lis rien… mais je change le {o} octet {b}. Repars, cavalier.',
  'm.of': { ek: 'des clés fermées', iv: 'de l’IV', ct: 'du chiffré', tag: 'du sceau' },
  'm.bobRead': 'Clés ouvertes, sceau vérifié, je déchiffre : « {m} ».',
  'm.bobReject': 'ALERTE : HMAC invalide, paquet rejeté. Je ne déchiffre rien.',
  'm.bobNoKeys': 'Ma clé privée n’ouvre pas ces clés : paquet rejeté. Je ne déchiffre rien.',
  'm.bobLate': 'J’ai déchiffré d’abord… et le sceau est faux. Rejeté, mais j’ai travaillé sur les octets d’Eve.',
  'm.busy': 'Un messager est déjà en route.',

  // the corner card
  card: {
    whole: 'Le paquet complet', bytes: '{n} octets', more: '⋮ {n} lignes de plus',
    fields: { ek: 'clés fermées', iv: 'IV', ct: 'chiffré', tag: 'sceau' },
    role: { ek: 'clé AES ‖ clé HMAC, RSA-2048-OAEP : Bob seul les ouvre', iv: 'au hasard : le même ordre ne donne jamais le même chiffré',
      ct: 'l’ordre, AES-256-CBC : illisible sans la clé AES', tag: 'HMAC-SHA256 de IV ‖ chiffré : trahit tout octet changé' },
    draw: '1. Trois tirages neufs', ivWhere: 'dans aes_cbc_encrypt',
    drawNote: 'Tirés pour cet ordre, jamais réutilisés. Seul l’IV voyage tel quel ; les deux clés, Alice les fermera au geste 4.',
    encrypt: '2. Chiffrer', padded: 'l’ordre : {n} octets + {p} de padding PKCS7 (soulignés)', cbcArrow: 'AES-256-CBC, avec la clé AES et l’IV',
    ctL: 'le chiffré ({n} octets)', encNote: 'Chaque bloc est mêlé au bloc chiffré d’avant, le premier à l’IV.',
    seal: '3. Sceller', ivct: 'IV ‖ chiffré (48 octets)', hmacArrow: 'HMAC-SHA256, avec la clé HMAC', tagL: 'le sceau (32 octets)',
    sealNote: 'L’IV est sous le sceau, lui aussi : un octet changé dans l’IV change l’ordre déchiffré.',
    lock: '4. Fermer les clés', keysL: 'clé AES ‖ clé HMAC (64 octets)', oaepArrow: 'RSA-2048-OAEP, avec la clé publique de Bob',
    ekL: 'les clés fermées (256 octets)', lockNote: 'Même Alice ne peut plus les rouvrir : il faut la clé privée de Bob.',
    bob: 'Bob : trois gestes, dans cet ordre', keysOk: 'les 64 octets : clé AES ‖ clé HMAC', mine: 'le sceau que Bob recalcule',
    sealOk: 'égal au sceau du paquet', readOk: 'l’ordre d’Alice',
    evil: 'Eve change le 1er octet du chiffré', ctSent: 'le chiffré envoyé par Alice', ctGot: 'le chiffré reçu par Bob',
    tagGot: 'le sceau du paquet (intact)', sealSame: 'octets égaux à la même place : {n} sur 32',
    verdict: { ok: 'accepté', reject: 'rejeté, non déchiffré', late: 'rejeté, mais déjà déchiffré' },
    anywhere: 'Un octet changé dans chaque brique', noKeys: 'la clé privée n’ouvre plus : pas de clés',
    allRejected: 'Les quatre fois : rejeté, non déchiffré.',
    anyNote: 'Un octet changé dans l’IV ou le chiffré : le sceau recalculé n’a plus que le hasard en commun avec celui du paquet (1 chance sur 256 par octet). Dans le sceau : il ne manque qu’un octet, et c’est assez.',
    order: 'L’ordre des gestes de Bob', right: 'vérifier, puis déchiffrer',
    rightNote: 'Le sceau est faux : Bob s’arrête là. Pas un octet d’Eve n’est passé par AES.',
    wrong: 'déchiffrer, puis vérifier', wrongNote: 'Ce que Bob aurait déchiffré du paquet d’Eve : le 1er bloc en bouillie, et dans le 2e, le 1er octet changé exactement comme Eve l’a voulu. Le padding est {pad}.',
    padYes: 'bon', padNo: 'faux',
    cmp: 'et comparer en temps constant', cmpNote: 'Avec ==, la comparaison s’arrête au premier octet différent : sa durée dit combien étaient bons.',
    files: 'messagerie/, un fichier par rôle', filesNote: 'Une seule responsabilité par fichier.',
    term: 'python main.py', termNote: 'Ce que la démonstration doit afficher, ligne pour ligne.',
    readme: 'Les choix, et pourquoi',
    sbPass: 'Eve laisse passer le paquet', sbEve: 'Eve change le {o} octet {b}',
    sbRight: 'Bob vérifie, puis déchiffre', sbWrong: 'Bob déchiffre, puis vérifie',
    op1: 'ouvrir les clés', op2: 'vérifier le sceau', op3: 'déchiffrer',
  },

  // the four files, as [file, role, functions]
  files: [
    ['crypto_utils.py', 'AES, HMAC', ['aes_cbc_encrypt(plaintext, aes_key) → (iv, ciphertext)', 'aes_cbc_decrypt(iv, ciphertext, aes_key) → plaintext', 'compute_hmac(hmac_key, data) → 32 octets', 'verify_hmac(hmac_key, data, mac) → bool, en temps constant']],
    ['rsa_utils.py', 'RSA', ['generer_paire_rsa() → (private_key, public_key)', 'rsa_chiffrer_cle(cles, rsa_public_key) → bytes', 'rsa_dechiffrer_cle(cles_chiffrees, rsa_private_key) → bytes']],
    ['messenger.py', 'envoi, réception', ['send_message(plaintext, rsa_public_key) → dict', 'receive_message(packet, rsa_private_key) → str']],
    ['main.py', 'la démonstration', ['python main.py']],
    ['README.md', 'le trajet d’un message, les choix justifiés', []],
  ],
  // what main.py prints; {m} is what Bob decrypted
  term: { lines: ['[Bob] Génération des clés RSA...', '[Alice] Envoi du message : "Bonjour Bob !"', '[Bob] Message reçu : "{m}"', '[OK] Message identique', '',
    '[Test] Eve modifie un octet du ciphertext...', '[Bob] ALERTE : HMAC invalide, message rejeté', '[OK] Manipulation détectée'] },
  // the README's choices, as [choice, why]
  choices: [
    ['AES-256', 'une clé de 256 bits : 2²⁵⁶ clés possibles, hors de portée de tout essai exhaustif'],
    ['CBC, IV neuf', 'le même ordre ne donne jamais le même chiffré ; ECB, bloc par bloc, laisse voir les motifs (épisode 6, le pingouin)'],
    ['PKCS7', 'AES chiffre par blocs de 16 octets : le padding complète le dernier, et dit à Bob combien en retirer'],
    ['HMAC-SHA256', 'un octet changé, un sceau faux ; avec sa propre clé, distincte de la clé AES'],
    ['RSA-2048', 'le record public de factorisation est de 829 bits ; 2 048 bits restent acceptables jusqu’en 2030 selon le NIST'],
    ['OAEP', 'les mêmes clés ne donnent jamais le même bloc fermé ; jamais RSA sans OAEP'],
    ['vérifier, puis déchiffrer', 'un paquet faux est rejeté sans qu’aucun de ses octets passe par AES'],
    ['compare_digest', 'en temps constant : la durée ne trahit pas où les sceaux diffèrent (épisode 8, le garde)'],
    ['os.urandom', 'un hasard imprévisible pour les clés et l’IV, neuf à chaque message ; jamais le module random'],
  ],

  // inside Bob's keep: his three moves on the real packet (inside.js); its colours are the card's
  'in.ek': 'clés fermées · 256 octets', 'in.priv': 'clé privée de Bob', 'in.unlock': 'c^d mod n, puis OAEP retiré',
  'in.aes': 'clé AES · 32 octets', 'in.mac': 'clé HMAC · 32 octets', 'in.msg': 'IV ‖ chiffré · 48 octets',
  'in.tag': 'le sceau du paquet', 'in.mine': 'le sceau que Bob recalcule', 'in.sealOk': '✔ 32 octets sur 32 égaux : on peut déchiffrer',
  'in.sealBad': '✖ égaux à la même place : {n} sur 32 · rejeté', 'in.dec': 'avec la clé AES et l’IV', 'in.unpad': 'padding retiré : {n} octets de valeur {n}',
  'in.flip': 'changé par Eve', 'in.shut': 'AES reste fermé : rien n’est déchiffré', 'in.first': 'L’erreur : déchiffrer d’abord',
  'in.pad': 'ce qu’AES rend des octets d’Eve · padding {pad}',

  // story
  ch: ['Côté Alice', 'Côté Bob', 'L’octet d’Eve', 'Le code'],
  steps: {
    intro: { t: 'Le paquet complet', p: "Quatre épisodes ont posé quatre briques. Dans le paquet que le cavalier emporte : les deux clés d'Alice, fermées au cadenas de Bob (RSA-2048 avec OAEP, épisode 1.4) ; l'IV, 16 octets tirés au hasard ; l'ordre, chiffré en AES-256-CBC (épisode 1.2) ; et le sceau, un HMAC-SHA256 de l'IV et du chiffré (épisode 1.3). Le paquet est là, devant le château d'Alice, et la carte montre ses vrais octets. Cet épisode remet les briques dans l'ordre : ce que fait Alice, ce que fait Bob, ce qu'Eve tente, puis le code qui fait tout cela, un fichier par rôle.",
      a: 'Quatre briques, un paquet. Et un ordre pour les poser.' },
    draw: { t: 'Alice, geste 1 : trois tirages neufs', p: "Avant tout, Alice tire au hasard trois choses neuves : une clé AES de 32 octets, une clé HMAC de 32 octets et un IV de 16 octets. En Python, avec os.urandom, qui puise dans le hasard du système, fait pour la cryptographie ; jamais avec le module random, dont les tirages se prédisent : 624 nombres observés suffisent à prévoir tous les suivants. Neufs à chaque envoi : la même clé et le même IV donneraient le même chiffré pour le même ordre, et Eve verrait « 6H » revenir. Seul l'IV entre déjà dans le paquet ; les deux clés restent chez Alice pour l'instant.",
      a: 'Trois tirages neufs. Rien de réutilisé.' },
    encrypt: { t: 'Alice, geste 2 : chiffrer l’ordre', p: "AES chiffre par blocs de 16 octets. « ATTAQUE A 6H DEMAIN » en fait 19 : le padding PKCS7 complète le dernier bloc avec 13 octets valant chacun 13 (0d en hexadécimal), soulignés sur la carte ; à l'arrivée, Bob lira le dernier octet et saura combien en retirer. Puis le mode CBC : chaque bloc est mêlé (XOR) au bloc chiffré d'avant, le premier à l'IV, et passe dans AES avec la clé de 32 octets. C'est AES-256-CBC. Les 32 octets du chiffré ne disent rien de l'ordre à qui n'a pas la clé AES.",
      a: 'Deux blocs de 16 octets, chiffrés en chaîne.' },
    seal: { t: 'Alice, geste 3 : sceller l’IV et le chiffré', p: "Chiffrer n'empêche pas de modifier : un octet changé en route, et Bob déchiffre un autre ordre sans rien voir (épisode 1.3). Alice calcule donc, avec sa deuxième clé, la clé HMAC, un HMAC-SHA256 de l'IV suivi du chiffré : 32 octets, le sceau. L'IV passe sous le sceau, lui aussi : c'est en changeant un octet de l'IV qu'Eve changeait 6H en 9H. Sans la clé HMAC, personne ne sait faire un sceau qui corresponde à d'autres octets.",
      a: 'L’IV et le chiffré, sous un même sceau.' },
    lock: { t: 'Alice, geste 4 : fermer les clés', p: "Reste à faire passer les deux clés. Alice les met bout à bout, AES puis HMAC, 64 octets, et les ferme avec la clé publique de Bob, en RSA-2048 avec OAEP : 256 octets que seule la clé privée de Bob ouvre (épisode 1.4). Le paquet est complet : clés fermées, IV, chiffré, sceau. L'ordre des gestes d'Alice est souple : elle pourrait fermer les clés dès qu'elles sont tirées. Celui de Bob ne l'est pas.",
      a: 'Le paquet est complet. Même moi, je ne peux plus rouvrir les clés.' },
    ride: { t: 'Le paquet traverse la vallée', p: "Lancez le messager. Les gardes d'Eve l'arrêtent sous ses murs, comme toujours. Eve a les quatre briques sous les yeux, 336 octets en tout : des clés qu'elle ne sait pas ouvrir, un IV, un chiffré qu'elle ne sait pas lire et un sceau qu'elle ne sait pas refaire. Cette fois, elle le laisse repartir sans rien toucher. Bob reçoit le paquet.",
      go: 'Envoyer le paquet ▶' },
    open: { t: 'Bob : ouvrir, vérifier, déchiffrer', p: "Bob fait trois gestes, dans cet ordre. 1. Ouvrir les clés : sa clé privée ouvre les 256 octets et rend la clé AES et la clé HMAC. 2. Vérifier le sceau : avec la clé HMAC, il recalcule le HMAC de l'IV et du chiffré qu'il a reçus, et le compare à celui du paquet, en temps constant. S'ils diffèrent, le paquet est rejeté là, sans rien déchiffrer. 3. Seulement alors, déchiffrer : AES-256-CBC avec la clé AES et l'IV, puis retirer le padding. La carte montre les trois gestes et leurs octets.",
      b: 'Ouvrir, vérifier, et seulement alors déchiffrer.' },
    eve: { t: 'Eve change un octet', p: "Rejouons le trajet, mais cette fois Eve ne se contente pas de lire. Elle ne sait rien déchiffrer, alors elle touche : elle change le premier octet du chiffré, un seul bit, et laisse repartir le cavalier. Lancez-le. Bob ouvre les clés sans souci : Eve n'a pas touché à cette brique. Il recalcule le sceau sur l'IV et le chiffré reçus : un seul bit change à l'entrée, et le HMAC qui sort ne ressemble plus du tout à celui d'Alice. Paquet rejeté, et rien n'a été déchiffré.",
      go: 'Eve change un octet ▶' },
    anywhere: { t: 'Un octet, n’importe où', p: "Et si Eve change un octet ailleurs ? La carte essaie les quatre briques. Dans l'IV, le chiffré ou le sceau : le HMAC que Bob recalcule ne correspond plus au sceau du paquet. Dans les clés fermées : la clé privée de Bob ne rend plus un bloc OAEP valide, et Bob n'a même pas de clés. Chaque fois, le paquet est rejeté sans avoir été déchiffré. Eve ne peut ni lire le paquet, ni le modifier en route sans que Bob le voie. (Elle a d'autres tours : c'est l'épisode 1.6.)",
      e: 'Quel que soit l’octet que je change, Bob le voit.' },
    why: { t: 'Pourquoi vérifier avant de déchiffrer', p: "Bob pourrait déchiffrer d'abord et vérifier ensuite : il rejetterait le paquet quand même. Mais il aurait déjà fait travailler AES sur des octets choisis par Eve ; la carte montre ce qu'il aurait obtenu. S'il répond autrement quand le padding est faux que quand le sceau est faux, ou plus vite, Eve apprend quelque chose à chaque paquet qu'elle lui envoie : en 2002, Serge Vaudenay a montré qu'une telle différence, sur le padding de CBC, suffit à déchiffrer un message octet par octet (l'attaque par oracle de padding). D'où la règle : vérifier, puis déchiffrer. Et comparer en temps constant, avec hmac.compare_digest en Python : avec ==, la comparaison s'arrête au premier octet différent, et sa durée dit à Eve combien d'octets étaient bons (épisode 8, le garde trop pressé).",
      b: 'Un sceau faux, et je m’arrête : pas un octet d’Eve ne passe par AES.' },
    files: { t: 'Un fichier par rôle', p: "En Python, avec la bibliothèque cryptography, ce paquet tient dans un dossier messagerie et quatre fichiers, chacun avec un seul rôle. crypto_utils.py : AES et HMAC, rien d'autre. rsa_utils.py : la paire de clés RSA, fermer et ouvrir les clés. messenger.py : send_message fait les quatre gestes d'Alice et rend le paquet ; receive_message fait les trois gestes de Bob et rend l'ordre, ou lève une exception si le sceau est faux. main.py : la démonstration. On doit pouvoir lire crypto_utils.py sans rien savoir de RSA, et main.py sans rien savoir d'AES. Le README.md, enfin, dessine le trajet d'un message et justifie les choix.",
      n: 'Un rôle par fichier : chacun se lit sans les autres.' },
    main: { t: 'La scène de main.py', p: "main.py raconte la scène de bout en bout. Bob crée sa paire de clés RSA. Alice lui écrit « Bonjour Bob ! », avec des clés et un IV neufs ; Bob lit, et le programme vérifie que le message reçu est bien celui envoyé. Puis Eve modifie un octet du chiffré en transit, et Bob doit refuser le paquet. Lancez la scène : deux cavaliers partent, et le terminal affiche, ligne pour ligne, ce que python main.py doit afficher.",
      go: 'Lancer python main.py ▶' },
    readme: { t: 'Ce que le README justifie', p: "Le README dit pourquoi chaque choix. La carte en fait le tour : la taille des clés, le mode, le padding, le sceau, OAEP, l'ordre de la vérification et du déchiffrement, la comparaison en temps constant, et le hasard d'où tout part. Chaque ligne répond à un tour d'Eve vu dans la saga : lire, reconnaître un ordre qui revient, changer un octet, recopier une clé, mesurer un temps.",
      a: 'Chaque choix répond à un tour d’Eve.' },
    end: { t: 'À vous', p: "Dans le bac à sable, écrivez votre ordre, choisissez l'octet qu'Eve change (dans quelle brique, à quelle place) et l'ordre des gestes de Bob : la carte montre chaque geste et ce que Bob lit. Chaque brique a son épisode, en détail : 1.2 pour AES-256-CBC, 1.3 pour le sceau HMAC, 1.4 pour le cadenas RSA. Et Eve a encore des tours : le cadenas de Bob est public, elle peut fabriquer un paquet entier avec ses propres clés. C'est l'épisode 1.6.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz', link: ['Épisode 1.2 : AES ▶', 'Épisode 1.3 : le sceau ▶', 'Épisode 1.4 : le cadenas RSA ▶', 'Épisode 1.6 : Eve a encore des tours ▶'] },
  },

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': "Écrivez un ordre, choisissez l'octet qu'Eve change et l'ordre des gestes de Bob, et regardez ce qu'il lit.",
  'sb.order': "L'ordre", 'sb.eve': 'Eve', 'sb.bob': 'Bob',
  'sb.pass': 'laisse passer le paquet', 'sb.flip': 'change un octet de :',
  'sb.byte': 'à la place n°',
  'sb.check': 'vérifie le sceau, puis déchiffre', 'sb.decrypt': 'déchiffre, puis vérifie le sceau (l’erreur)',
  'sb.send': 'Envoyer le messager ▶',
  'sb.stats': 'Envoyés <b>{sent}</b> · acceptés <b>{ok}</b> · rejetés <b>{rejected}</b> · déchiffrés avant le rejet <b>{late}</b>',
  'sb.empty': 'Écrivez un ordre d’abord.',

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'The Whole Packet — Crypto, Visualized',
  title: 'The Whole Packet',
  subtitle: 'The four bricks in order: Alice locks, Bob checks before he decrypts, Eve is caught.',
  loading: 'Building the castles…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chronicler' },
  ord: 'byte {n}',

  'm.evePass': 'Locked keys, an IV, a ciphertext, a seal: {h}… I can open nothing. Ride on.',
  'm.eveFlip': 'I read nothing… but I change byte {n} {b}. Ride on, rider.',
  'm.of': { ek: 'of the locked keys', iv: 'of the IV', ct: 'of the ciphertext', tag: 'of the seal' },
  'm.bobRead': 'Keys opened, seal checked, I decrypt: “{m}”.',
  'm.bobReject': 'ALERT: invalid HMAC, packet rejected. I decrypt nothing.',
  'm.bobNoKeys': 'My private key does not open these keys: packet rejected. I decrypt nothing.',
  'm.bobLate': 'I decrypted first… and the seal is wrong. Rejected, but I worked on Eve’s bytes.',
  'm.busy': 'A messenger is already on the road.',

  card: {
    whole: 'The whole packet', bytes: '{n} bytes', more: '⋮ {n} more rows',
    fields: { ek: 'locked keys', iv: 'IV', ct: 'ciphertext', tag: 'seal' },
    role: { ek: 'AES key ‖ HMAC key, RSA-2048-OAEP: only Bob opens them', iv: 'random: the same order never gives the same ciphertext',
      ct: 'the order, AES-256-CBC: unreadable without the AES key', tag: 'HMAC-SHA256 of IV ‖ ciphertext: gives away any changed byte' },
    draw: '1. Three fresh draws', ivWhere: 'inside aes_cbc_encrypt',
    drawNote: 'Drawn for this order, never reused. Only the IV travels as it is; the two keys Alice will lock in move 4.',
    encrypt: '2. Encrypt', padded: 'the order: {n} bytes + {p} of PKCS7 padding (underlined)', cbcArrow: 'AES-256-CBC, with the AES key and the IV',
    ctL: 'the ciphertext ({n} bytes)', encNote: 'Each block is mixed with the encrypted block before it, the first one with the IV.',
    seal: '3. Seal', ivct: 'IV ‖ ciphertext (48 bytes)', hmacArrow: 'HMAC-SHA256, with the HMAC key', tagL: 'the seal (32 bytes)',
    sealNote: 'The IV is under the seal too: a changed byte of the IV changes the decrypted order.',
    lock: '4. Lock the keys', keysL: 'AES key ‖ HMAC key (64 bytes)', oaepArrow: "RSA-2048-OAEP, with Bob's public key",
    ekL: 'the locked keys (256 bytes)', lockNote: "Not even Alice can reopen them: that takes Bob's private key.",
    bob: 'Bob: three moves, in this order', keysOk: 'the 64 bytes: AES key ‖ HMAC key', mine: 'the seal Bob recomputes',
    sealOk: "equal to the packet's seal", readOk: "Alice's order",
    evil: 'Eve changes byte 1 of the ciphertext', ctSent: 'the ciphertext Alice sent', ctGot: 'the ciphertext Bob receives',
    tagGot: "the packet's seal (untouched)", sealSame: 'bytes equal at the same place: {n} out of 32',
    verdict: { ok: 'accepted', reject: 'rejected, not decrypted', late: 'rejected, but already decrypted' },
    anywhere: 'One byte changed in each brick', noKeys: 'the private key no longer opens: no keys',
    allRejected: 'All four times: rejected, not decrypted.',
    anyNote: 'A byte changed in the IV or the ciphertext: the recomputed seal has nothing in common with the packet’s but chance (1 chance in 256 per byte). In the seal: only one byte is off, and that is enough.',
    order: "The order of Bob's moves", right: 'check, then decrypt',
    rightNote: "The seal is wrong: Bob stops there. Not one of Eve's bytes went through AES.",
    wrong: 'decrypt, then check', wrongNote: "What Bob would have decrypted from Eve's packet: the 1st block scrambled, and in the 2nd, the 1st byte changed exactly the way Eve wanted. The padding is {pad}.",
    padYes: 'right', padNo: 'wrong',
    cmp: 'and compare in constant time', cmpNote: 'With ==, the comparison stops at the first differing byte: how long it takes tells how many were right.',
    files: 'messagerie/, one file per job', filesNote: 'One responsibility per file.',
    term: 'python main.py', termNote: 'What the demo must print, line for line.',
    readme: 'The choices, and why',
    sbPass: 'Eve lets the packet through', sbEve: 'Eve changes byte {n} {b}',
    sbRight: 'Bob checks, then decrypts', sbWrong: 'Bob decrypts, then checks',
    op1: 'open the keys', op2: 'check the seal', op3: 'decrypt',
  },

  files: [
    ['crypto_utils.py', 'AES, HMAC', ['aes_cbc_encrypt(plaintext, aes_key) → (iv, ciphertext)', 'aes_cbc_decrypt(iv, ciphertext, aes_key) → plaintext', 'compute_hmac(hmac_key, data) → 32 bytes', 'verify_hmac(hmac_key, data, mac) → bool, in constant time']],
    ['rsa_utils.py', 'RSA', ['generer_paire_rsa() → (private_key, public_key)', 'rsa_chiffrer_cle(cles, rsa_public_key) → bytes', 'rsa_dechiffrer_cle(cles_chiffrees, rsa_private_key) → bytes']],
    ['messenger.py', 'sending, receiving', ['send_message(plaintext, rsa_public_key) → dict', 'receive_message(packet, rsa_private_key) → str']],
    ['main.py', 'the demo', ['python main.py']],
    ['README.md', 'the path of a message, the choices justified', []],
  ],
  term: { lines: ['[Bob] Generating RSA keys...', '[Alice] Sending message: "Hello Bob!"', '[Bob] Message received: "{m}"', '[OK] Same message', '',
    '[Test] Eve changes one byte of the ciphertext...', '[Bob] ALERT: invalid HMAC, message rejected', '[OK] Tampering detected'] },
  choices: [
    ['AES-256', 'a 256-bit key: 2²⁵⁶ possible keys, beyond the reach of any exhaustive search'],
    ['CBC, fresh IV', 'the same order never gives the same ciphertext; ECB, block by block, lets patterns show (episode 6, the penguin)'],
    ['PKCS7', 'AES encrypts 16-byte blocks: padding fills the last one, and tells Bob how much to remove'],
    ['HMAC-SHA256', 'one changed byte, a wrong seal; with its own key, separate from the AES key'],
    ['RSA-2048', 'the public factoring record is 829 bits; 2,048 bits remain acceptable until 2030 according to NIST'],
    ['OAEP', 'the same keys never give the same locked block; never RSA without OAEP'],
    ['check, then decrypt', 'a fake packet is rejected before any of its bytes goes through AES'],
    ['compare_digest', 'constant time: how long it takes does not give away where the seals differ (episode 8, the guard)'],
    ['os.urandom', 'unpredictable randomness for the keys and the IV, fresh for every message; never the random module'],
  ],

  'in.ek': 'locked keys · 256 bytes', 'in.priv': "Bob's private key", 'in.unlock': 'c^d mod n, then OAEP removed',
  'in.aes': 'AES key · 32 bytes', 'in.mac': 'HMAC key · 32 bytes', 'in.msg': 'IV ‖ ciphertext · 48 bytes',
  'in.tag': "the packet's seal", 'in.mine': 'the seal Bob recomputes', 'in.sealOk': '✔ 32 bytes of 32 equal: decrypting is safe',
  'in.sealBad': '✖ equal at the same place: {n} of 32 · rejected', 'in.dec': 'with the AES key and the IV', 'in.unpad': 'padding removed: {n} bytes of value {n}',
  'in.flip': 'changed by Eve', 'in.shut': 'AES stays shut: nothing is decrypted', 'in.first': 'The mistake: decrypting first',
  'in.pad': "what AES gives from Eve's bytes · padding {pad}",

  ch: ["Alice's side", "Bob's side", "Eve's byte", 'The code'],
  steps: {
    intro: { t: 'The whole packet', p: "Four episodes laid four bricks. In the packet the rider carries: Alice's two keys, locked with Bob's padlock (RSA-2048 with OAEP, episode 1.4); the IV, 16 random bytes; the order, encrypted with AES-256-CBC (episode 1.2); and the seal, an HMAC-SHA256 of the IV and the ciphertext (episode 1.3). The packet stands there, in front of Alice's castle, and the card shows its real bytes. This episode puts the bricks back in order: what Alice does, what Bob does, what Eve tries, then the code that does all of it, one file per job.",
      a: 'Four bricks, one packet. And an order to lay them in.' },
    draw: { t: 'Alice, move 1: three fresh draws', p: "First of all, Alice draws three fresh things at random: a 32-byte AES key, a 32-byte HMAC key and a 16-byte IV. In Python, with os.urandom, which draws from the system's randomness, made for cryptography; never with the random module, whose draws can be predicted: watching 624 numbers is enough to foresee all the next ones. Fresh for every send: the same key and the same IV would give the same ciphertext for the same order, and Eve would see “6AM” come back. Only the IV goes into the packet yet; the two keys stay with Alice for now.",
      a: 'Three fresh draws. Nothing reused.' },
    encrypt: { t: 'Alice, move 2: encrypt the order', p: "AES encrypts 16-byte blocks. “ATTACK AT 6AM TOMORROW” is 22 bytes: PKCS7 padding fills the last block with 10 bytes, each worth 10 (0a in hexadecimal), underlined on the card; on arrival, Bob will read the last byte and know how many to remove. Then CBC mode: each block is mixed (XOR) with the encrypted block before it, the first one with the IV, and goes through AES with the 32-byte key. That is AES-256-CBC. The 32 bytes of ciphertext say nothing about the order to anyone without the AES key.",
      a: 'Two 16-byte blocks, encrypted as a chain.' },
    seal: { t: 'Alice, move 3: seal the IV and the ciphertext', p: "Encrypting does not stop anyone from changing things: one byte changed on the way, and Bob decrypts another order without noticing (episode 1.3). So Alice computes, with her second key, the HMAC key, an HMAC-SHA256 of the IV followed by the ciphertext: 32 bytes, the seal. The IV goes under the seal too: changing a byte of the IV is how Eve turned 6AM into 9AM. Without the HMAC key, nobody can make a seal that matches other bytes.",
      a: 'The IV and the ciphertext, under one seal.' },
    lock: { t: 'Alice, move 4: lock the keys', p: "The two keys still have to get across. Alice lays them end to end, AES then HMAC, 64 bytes, and locks them with Bob's public key, using RSA-2048 with OAEP: 256 bytes that only Bob's private key opens (episode 1.4). The packet is complete: locked keys, IV, ciphertext, seal. The order of Alice's moves is flexible: she could lock the keys as soon as they are drawn. Bob's is not.",
      a: 'The packet is complete. Not even I can reopen the keys.' },
    ride: { t: 'The packet crosses the valley', p: "Launch the messenger. Eve's guards stop him under her walls, as always. Eve has the four bricks before her eyes, 336 bytes in all: keys she cannot open, an IV, a ciphertext she cannot read and a seal she cannot remake. This time, she lets him go on without touching anything. Bob receives the packet.",
      go: 'Send the packet ▶' },
    open: { t: 'Bob: open, check, decrypt', p: "Bob makes three moves, in this order. 1. Open the keys: his private key opens the 256 bytes and gives back the AES key and the HMAC key. 2. Check the seal: with the HMAC key, he recomputes the HMAC of the IV and the ciphertext he received, and compares it with the packet's, in constant time. If they differ, the packet is rejected right there, with nothing decrypted. 3. Only then, decrypt: AES-256-CBC with the AES key and the IV, then remove the padding. The card shows the three moves and their bytes.",
      b: 'Open, check, and only then decrypt.' },
    eve: { t: 'Eve changes a byte', p: "Let's replay the ride, but this time Eve does not just read. She can decrypt nothing, so she tampers: she changes the first byte of the ciphertext, a single bit, and lets the rider go on. Launch him. Bob opens the keys without trouble: Eve did not touch that brick. He recomputes the seal over the IV and the ciphertext he received: one bit changes at the input, and the HMAC that comes out looks nothing like Alice's. Packet rejected, and nothing was decrypted.",
      go: 'Eve changes a byte ▶' },
    anywhere: { t: 'One byte, anywhere', p: "And if Eve changes a byte somewhere else? The card tries all four bricks. In the IV, the ciphertext or the seal: the HMAC Bob recomputes no longer matches the packet's seal. In the locked keys: Bob's private key no longer gives a valid OAEP block, and Bob does not even have keys. Every time, the packet is rejected without being decrypted. Eve can neither read the packet nor change it on the way without Bob seeing it. (She has other tricks: that is episode 1.6.)",
      e: 'Whatever byte I change, Bob sees it.' },
    why: { t: 'Why check before decrypting', p: "Bob could decrypt first and check afterwards: he would reject the packet all the same. But he would already have made AES work on bytes Eve chose; the card shows what he would have got. If he answers differently when the padding is wrong than when the seal is wrong, or faster, Eve learns something from every packet she sends him: in 2002, Serge Vaudenay showed that such a difference, on CBC padding, is enough to decrypt a message byte by byte (the padding oracle attack). Hence the rule: check, then decrypt. And compare in constant time, with hmac.compare_digest in Python: with ==, the comparison stops at the first differing byte, and how long it takes tells Eve how many bytes were right (episode 8, the guard in a hurry).",
      b: "A wrong seal, and I stop: not one of Eve's bytes goes through AES." },
    files: { t: 'One file per job', p: "In Python, with the cryptography library, this packet fits in a messagerie folder and four files, each with a single job. crypto_utils.py: AES and HMAC, nothing else. rsa_utils.py: the RSA key pair, locking and opening the keys. messenger.py: send_message makes Alice's four moves and returns the packet; receive_message makes Bob's three moves and returns the order, or raises an exception if the seal is wrong. main.py: the demo. You should be able to read crypto_utils.py knowing nothing about RSA, and main.py knowing nothing about AES. Finally, README.md draws the path of a message and justifies the choices.",
      n: 'One job per file: each one reads without the others.' },
    main: { t: 'The main.py scene', p: "main.py tells the scene from start to finish. Bob creates his RSA key pair. Alice writes him “Hello Bob!”, with fresh keys and IV; Bob reads it, and the program checks that the message received is the one sent. Then Eve changes one byte of the ciphertext in transit, and Bob must refuse the packet. Launch the scene: two riders set out, and the terminal shows, line for line, what python main.py must print.",
      go: 'Run python main.py ▶' },
    readme: { t: 'What the README justifies', p: "The README says why each choice was made. The card goes through them: the key sizes, the mode, the padding, the seal, OAEP, the order of checking and decrypting, the constant-time comparison, and the randomness everything starts from. Each line answers one of Eve's tricks seen in the saga: reading, spotting an order that comes back, changing a byte, copying a key, timing a comparison.",
      a: "Each choice answers one of Eve's tricks." },
    end: { t: 'Your turn', p: "In the sandbox, write your order, choose the byte Eve changes (in which brick, at which place) and the order of Bob's moves: the card shows each move and what Bob reads. Each brick has its own episode, in detail: 1.2 for AES-256-CBC, 1.3 for the HMAC seal, 1.4 for the RSA padlock. And Eve still has tricks: Bob's padlock is public, so she can build a whole packet with keys of her own. That is episode 1.6.",
      go: 'Try the sandbox', go2: 'Take the quiz', link: ['Episode 1.2: AES ▶', 'Episode 1.3: the seal ▶', 'Episode 1.4: the RSA padlock ▶', 'Episode 1.6: Eve Has More Tricks ▶'] },
  },

  'sb.title': 'Sandbox',
  'sb.hint': "Write an order, choose the byte Eve changes and the order of Bob's moves, and watch what he reads.",
  'sb.order': 'The order', 'sb.eve': 'Eve', 'sb.bob': 'Bob',
  'sb.pass': 'lets the packet through', 'sb.flip': 'changes a byte of:',
  'sb.byte': 'at place no.',
  'sb.check': 'checks the seal, then decrypts', 'sb.decrypt': 'decrypts, then checks the seal (the mistake)',
  'sb.send': 'Send the messenger ▶',
  'sb.stats': 'Sent <b>{sent}</b> · accepted <b>{ok}</b> · rejected <b>{rejected}</b> · decrypted before rejection <b>{late}</b>',
  'sb.empty': 'Write an order first.',

  'quiz.check': 'Check', 'quiz.next': 'Next question ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score: {s}', 'quiz.multi': 'Several answers', 'quiz.pick': 'Pick at least one answer.',
  'quiz.end': 'Quiz complete', 'quiz.again': 'Start again', 'quiz.back': 'Back to the story',
  'quiz.endText': '{s} correct answer(s) out of {n}.',
};

const dicts = { fr, en };
const listeners = [];
const fromUrl = new URLSearchParams(location.search).get('lang');
export let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

export function raw(key) { return key.split('.').reduce((o, k) => o?.[k], dicts[lang]) ?? dicts[lang][key] ?? dicts.fr[key] ?? key; }
// a French ordinal (1er, 2e…), passed as {o} next to {n} wherever a byte is counted
export const nth = n => n === 1 ? '1er' : n + 'e';
export function t(key, vars = {}) {
  if (vars.n !== undefined && vars.o === undefined) vars = { ...vars, o: nth(vars.n) };
  if (vars.i !== undefined && vars.o === undefined) vars = { ...vars, o: nth(vars.i) };
  let s = raw(key);
  if (typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

export function applyStatic() {
  document.documentElement.lang = lang;
  document.title = t('tab');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const b of document.querySelectorAll('#lang button')) b.classList.toggle('active', b.dataset.lang === lang);
  for (const a of document.querySelectorAll('a.series')) a.href = '../?lang=' + lang;   // the series home, same language
}
export function setLang(l) {
  lang = l; localStorage.setItem('dg-lang', l);
  applyStatic(); listeners.forEach(f => f(l));
}
export function onLang(f) { listeners.push(f); }
// the sandbox starts with the story's order, in the reader's language
export const ORDER_DEFAULT = () => lang === 'en' ? 'ATTACK AT 6AM TOMORROW' : 'ATTAQUE A 6H DEMAIN';
