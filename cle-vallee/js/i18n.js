// Every visible word of episode 1.4 « La clé qui traverse la vallée », in French (the course language)
// and English. t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.

const fr = {
  series: 'Crypto en visuel',
  tab: 'La clé qui traverse la vallée — Crypto en visuel',
  title: 'La clé qui traverse la vallée',
  subtitle: 'Les deux clés doivent arriver chez Bob. Il envoie son cadenas ouvert : RSA-2048 avec OAEP.',
  loading: 'Construction des châteaux…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  'nav.more': 'Lire la suite ▾', 'nav.less': 'Replier ▴',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chroniqueur' },

  // what Eve, Alice and Bob say when a rider passes
  'm.keysClear': 'Clé AES : {a}… clé HMAC : {b}… En clair. Je les recopie. Repars, cavalier.',
  'm.bobKeys': 'Les deux clés d’Alice. Me voilà prêt à lire ses ordres.',
  'm.padlockEve': 'Le cadenas de Bob : n, 256 octets, et e = 65537. Je le recopie… il ferme, il n’ouvre pas.',
  'm.aliceGot': 'Le cadenas ouvert de Bob. Je peux fermer pour lui.',
  'm.lockedEve': '256 octets fermés au cadenas de Bob : {h}… J’ai le même cadenas. Il n’ouvre rien. Repars.',
  'm.bobOpen': 'Ma clé privée ouvre le cadenas : les clés d’Alice. Sceau vérifié, je déchiffre : « {m} ».',
  'm.eveRead': 'Les clés sont en clair : je déchiffre. « {m} ». Repars, cavalier.',
  'm.eveRewrite': 'Les clés sont en clair : je lis « {m} », j’écris « {w} », et je refais le sceau. Repars.',
  'm.eveFlip': 'Clés fermées au cadenas de Bob… Je change le 11e octet de l’IV, au hasard. Repars.',
  'm.bobRead': 'Sceau vérifié, je déchiffre : « {m} ».',
  'm.bobReject': 'Sceau invalide : paquet rejeté. Je ne déchiffre rien.',
  'm.busy': 'Un messager est déjà en route.',

  // the corner card
  card: {
    keys: "Les deux clés d'Alice", aes: 'clé AES (32 octets)', mac: 'clé HMAC (32 octets)',
    keysNote: 'Tirées au hasard pour cet ordre. Bob doit avoir les mêmes, et Eve aucune.',
    clear: "Ce qu'Eve recopie", clearNote: 'En clair : Eve a maintenant les mêmes clés qu’Alice et Bob.',
    fall: 'Eve, avec les clés recopiées', reads: 'Elle déchiffre l’ordre d’Alice', writes: 'Elle écrit, chiffre et scelle',
    tag: 'son sceau (32 octets)', bobCheck: 'Bob vérifie le sceau avec sa clé HMAC', sealOk: 'sceau valide',
    toy: 'RSA à la main', pub: 'publique', priv: 'privée', lockL: 'fermer 7', openL: 'ouvrir 13',
    toyNote: 'mod 55 : le reste de la division par 55. d se calcule à partir de 5 et 11 ; avec 55 seul, il faut d’abord retrouver 5 et 11.',
    pubkey: 'La clé publique de Bob', nL: 'n = p × q (256 octets)', more: '⋮ {n} lignes de plus', below: '▾ la suite plus bas', eL: 'e',
    pubNote: 'n s’écrit avec {d} chiffres en décimal. p et q, 128 octets chacun, ne quittent pas le château de Bob.',
    oaep: 'Alice ferme ses deux clés', mL: 'clé AES ‖ clé HMAC (64 octets)', seedL: 'graine OAEP (32 octets, au hasard)',
    emL: 'EM : 00 ‖ graine masquée ‖ bloc masqué (256 octets)', lockArrow: 'c = EM<sup>65537</sup> mod n', cL: 'c, les clés fermées (256 octets)',
    oaepNote: 'Le bloc avant masque : SHA-256 du label vide (32) ‖ {z} octets à 00 ‖ 01 ‖ les 64 octets des clés.',
    seed: 'Mêmes clés, deux graines', c1: 'graine 1', c2: 'graine 2', diff: '{d} octets sur 256 diffèrent.',
    open: 'Bob ouvre le cadenas', openArrow: 'EM = c<sup>d</sup> mod n, puis OAEP retiré', got: 'les 64 octets retrouvés',
    same: 'Les clés d’Alice, octet pour octet.',
    hybrid: 'Qui porte quoi', limit: 'RSA-2048 avec OAEP porte au plus 256 − 2 × 32 − 2 = {max} octets.',
    rows: [['clés fermées (RSA-OAEP)', '{k} octets', 'pour 64 octets de clés'], ['IV', '16 octets', ''], ['chiffré (AES-256-CBC)', '{c} octets', 'pour un ordre de {n} octets'], ['sceau (HMAC-SHA256)', '32 octets', '']],
    fresh: 'Le même ordre, envoyé deux fois', send1: 'envoi 1', send2: 'envoi 2',
    fields: { ek: 'clés fermées', iv: 'IV', ct: 'chiffré', tag: 'sceau' },
    freshNote: 'Clés, IV et graine neufs : rien en commun, sauf le hasard. Octets égaux à la même place : {n} sur {t}, ce que donnent deux tirages au hasard (1 chance sur 256 par octet).',
    packet: 'Le paquet complet',
    bricks: { k: 'clés (RSA-OAEP)', iv: 'IV', ct: 'chiffré AES-256-CBC', mac: 'HMAC-SHA256' },
    verdict: { ok: 'accepté', reject: 'rejeté, non déchiffré', wrong: 'accepté, mais changé !' },
    keysHow: { clear: 'Les clés voyagent en clair', rsa: 'Les clés voyagent fermées au cadenas de Bob' },
    eveGets: 'Ce qu’Eve obtient', eveKeys: 'les deux clés, et l’ordre : « {m} »', eveNothing: 'rien : 256 octets qu’elle ne sait pas ouvrir',
    bobGets: 'Ce que Bob lit',
  },

  // inside Alice's keep: OAEP and RSA at work on her two keys (inside.js); its colours are the card's
  'in.aes': 'clé AES · 32 octets', 'in.mac': 'clé HMAC · 32 octets', 'in.one': '01 en bout de ligne : les clés suivent',
  'in.zeros': '{n} octets à 00', 'in.lhash': 'SHA-256 du label vide · 32 octets', 'in.seed': 'la graine · 32 octets au hasard',
  'in.mask1': '⊕ SHA-256 de la graine, étiré à {n} octets', 'in.mask2': '⊕ SHA-256 du bloc masqué',
  'in.mseed': 'graine masquée', 'in.mdb': 'bloc masqué · {n} octets', 'in.em': 'EM · 256 octets, lus comme un seul nombre',
  'in.pad': 'cadenas de Bob : n, e', 'in.lock': 'c = EM⁶⁵⁵³⁷ mod n', 'in.c': 'c, les clés fermées · 256 octets',
  // inside Bob's keep: RSA by hand, then RSA-2048 (inside.js rsaRoom, r363)
  'in.phi': '({p} − 1) × ({q} − 1) = {phi}', 'in.dcalc': '{e} × {d} = {ed} = {k} × {phi} + 1',
  'in.pub': 'clé publique ({n}, {e}) : le cadenas', 'in.priv': 'clé privée ({n}, {d}) : la clé de Bob',
  'in.p1024': '{x} · 1 024 bits · Bob seul le connaît', 'in.n2048': 'n = p × q · 2 048 bits = 256 octets',
  'in.rsa250': '829 bits : RSA-250,\nle plus grand nombre de ce genre\njamais factorisé en public (2020)',

  // story
  ch: ['Les clés en clair', 'Le cadenas de Bob', 'Hybride', 'Le paquet'],
  steps: {
    intro: { t: 'Deux clés à faire passer', p: "Dans les épisodes 1.2 et 1.3, Alice chiffre ses ordres avec une {1|clé AES} et les scelle avec une {4|clé HMAC}, et Bob a les deux mêmes clés. Mais d'où les tient-il ?\n\nAlice et Bob ne se sont jamais vus : entre le château d'Alice, à l'ouest, et celui de Bob, à l'est, il y a la vallée, et la seule route passe sous les murs de la cité d'Eve. Rien n'a été convenu d'avance.\n\nÀ chaque ordre, Alice tire au hasard deux clés neuves de 32 octets :\n- une {1|clé AES}, pour chiffrer ;\n- une {4|clé HMAC}, pour sceller.\n\nElles doivent arriver chez Bob, et chez lui seul.",
      a: 'Deux clés neuves, 64 octets. Comment les donner à Bob sans les donner à Eve ?' },
    clear: { t: 'Les clés en clair', p: "Le plus simple : un cavalier porte les deux clés à Bob, telles quelles. Lancez-le. Les gardes d'Eve l'arrêtent sous ses murs, comme tous les messagers ; Eve lit les 64 octets, les recopie, et le laisse repartir. Bob reçoit ses clés, et rien ne lui dit qu'Eve les a lues : une copie ne laisse pas de trace.",
      go: 'Envoyer les clés en clair ▶' },
    fall: { t: 'Tout tombe', p: "Alice envoie ensuite son ordre, chiffré et scellé comme dans l'épisode 1.3. Mais Eve a les deux clés :\n- elle déchiffre « ATTAQUE A 6H DEMAIN » ;\n- elle écrit « ATTAQUE A {r|9H} DEMAIN » et le chiffre avec la {1|clé AES} ;\n- elle refait le sceau avec la {4|clé HMAC}.\n\nBob vérifie le sceau, il est bon, et il lit {r|9H}. Le chiffrement et le sceau ne valent que le secret de leurs clés.\n\nChiffrer les clés ? Avec quelle clé ? Il faudrait d'abord la faire passer, elle aussi : le problème recule d'un pas, il ne disparaît pas.",
      e: 'Avec vos clés, je lis l’ordre, je le réécris, et mon sceau est valide.' },
    padlock: { t: 'Le cadenas de Bob', p: "Bob a une autre idée. Il fabrique des cadenas ouverts, tous pareils, et en donne à qui en veut :\n- pour fermer un cadenas, il suffit de pousser : le cadenas ouvert est sa **clé publique** ;\n- pour l'ouvrir, il faut la clé, que Bob est seul à avoir : sa **clé privée**.\n\nRSA fait ce cadenas avec des nombres. Bob choisit deux nombres premiers, ici 5 et 11, et publie leur produit n = 55 avec e = 3 :\n- fermer 7 : 7³ = 343, dont on garde le reste de la division par 55 (on écrit mod 55) : 13 ;\n- ouvrir 13 : 13²⁷ mod 55 = 7.\n\nCe 27, la clé privée d, Bob l'a tiré de 5 et 11 : (5 − 1) × (11 − 1) = 40, et 3 × 27 = 81 laisse 1 quand on le divise par 40.",
      b: 'Mes cadenas ouverts, pour tout le monde. Ma clé, pour moi seul.' },
    rsa2048: { t: 'Le vrai cadenas : RSA-2048', p: "Avec 55, n'importe qui retrouve 5 × 11 de tête, puis la clé privée.\n\nLe vrai cadenas de Bob part de deux nombres premiers p et q de 1 024 bits, tirés au hasard. Sa clé publique :\n- n = p × q, qui fait 2 048 bits, soit 256 octets, ou 617 chiffres en décimal ;\n- e = 65537.\n\nMultiplier p par q est instantané ; retrouver p et q à partir de n, personne ne sait le faire pour un nombre de cette taille : le plus grand nombre de ce genre jamais factorisé en public fait 829 bits (RSA-250, en 2020). Bob garde p, q et d pour lui.",
      b: 'n et e : mon cadenas, pour tout le monde. p, q et d ne quittent pas mon château.' },
    deliver: { t: 'Le cadenas traverse la vallée', p: "Bob envoie son cadenas ouvert à Alice : n (256 octets) et e. Lancez le cavalier. Eve l'arrête sous ses murs et recopie le cadenas : qu'elle le garde, il est fait pour être distribué. Un cadenas ouvert ferme, il n'ouvre pas : avoir la clé publique de Bob ne donne pas sa clé privée.\n\n(Eve pourrait aussi glisser son propre cadenas à la place de celui de Bob ; contre ce tour, il faut prouver à qui appartient une clé publique, avec un certificat. Ici, elle se contente de recopier.)",
      go: 'Envoyer le cadenas à Alice ▶' },
    close: { t: 'Alice ferme le cadenas', p: "Alice met ses deux clés bout à bout, la {1|clé AES} puis la {4|clé HMAC} : 64 octets. RSA ne ferme pas des octets nus :\n- OAEP les range d'abord dans un bloc de 256 octets, la taille de n, avec 32 octets tirés au hasard, la graine : c'est le bloc EM ;\n- EM, lu comme un seul grand nombre, est fermé comme 7 l'était : c = EM⁶⁵⁵³⁷ mod n.\n\nLes 256 octets de c, les clés fermées, voyagent avec le paquet. Une fois le cadenas fermé, même Alice ne peut plus rouvrir ses clés : elle n'a pas la clé privée de Bob.",
      a: 'Mes deux clés, fermées au cadenas de Bob. Même moi, je ne peux plus les rouvrir.' },
    seed: { t: 'Pourquoi OAEP', p: "Sans OAEP, RSA ferme toujours de la même façon : les mêmes octets donnent toujours le même c. Eve, qui a le cadenas, pourrait fermer elle-même ce qu'elle devine (« oui », « non », « 6H », « 9H ») et comparer avec ce qui passe.\n\nOAEP mêle au message les 32 octets au hasard de la graine, à l'aide de SHA-256 : les mêmes deux clés, fermées deux fois avec deux graines, donnent deux blocs sans rapport, la carte le montre. Bob, en ouvrant, retrouve la graine et la retire.\n\nUne règle : **jamais RSA sans OAEP**.",
      e: 'Les mêmes clés, fermées deux fois : deux blocs sans rapport. Je n’ai rien à comparer.' },
    ride: { t: 'Les clés fermées traversent', p: "Le paquet part maintenant avec ses clés fermées. Lancez le messager. Eve l'arrête et lit les 256 octets ; le cadenas de Bob qu'elle a recopié ferme, il n'ouvre pas. Elle le laisse repartir.\n\nChez Bob, avec sa clé privée d :\n- il calcule cᵈ mod n ;\n- il retire OAEP et retrouve les 64 octets : la {1|clé AES} et la {4|clé HMAC} d'Alice ;\n- alors seulement, il vérifie le sceau et déchiffre l'ordre.",
      go: 'Envoyer le paquet ▶' },
    hybrid: { t: 'RSA pour les clés, AES pour le reste', p: "Pourquoi ne pas fermer l'ordre lui-même au cadenas de Bob ? Pour deux raisons :\n- c'est petit : un bloc RSA-2048 avec OAEP et SHA-256 porte 190 octets au plus ;\n- c'est lent : sur un ordinateur ordinaire, le temps d'ouvrir un seul bloc RSA-2048, un demi-millième de seconde, AES chiffre plus d'un demi-mégaoctet.\n\nAlors chacun son travail : RSA ne porte que les 64 octets des clés, et AES chiffre l'ordre, quelle que soit sa longueur. C'est le **chiffrement hybride** ; HTTPS et PGP partagent le travail de la même façon, l'asymétrique pour la clé, AES pour le reste.",
      n: 'RSA porte les clés, AES porte l’ordre. Chacun ce qu’il fait de mieux.' },
    fresh: { t: 'Des clés neuves à chaque ordre', p: "Pour l'ordre suivant, Alice ne réutilise rien. Tout est neuf :\n- la {1|clé AES} ;\n- la {4|clé HMAC} ;\n- l'{2|IV} ;\n- la graine d'OAEP.\n\nLa carte montre deux envois du même ordre : rien ne se ressemble, et Eve ne voit même pas que c'est le même ordre. Si les clés d'un message fuyaient un jour, elles n'ouvriraient que ce message-là.\n\nLa clé privée de Bob, elle, ouvre toutes les clés jamais fermées pour lui : c'est elle qu'il garde le mieux.",
      a: 'Le même ordre, deux fois : rien ne se ressemble.' },
    packet: { t: 'Le paquet complet', p: "Les quatre briques sont là :\n- {1|les deux clés}, fermées en RSA-OAEP, 256 octets ;\n- {2|l'IV}, 16 octets ;\n- {3|le chiffré} AES-256-CBC ;\n- {4|le sceau} HMAC-SHA256 de l'IV et du chiffré, 32 octets.\n\nL'épisode 1.5 les assemble dans l'ordre, côté Alice puis côté Bob. Mais le cadenas de Bob est public : n'importe qui peut fermer des clés pour lui, Eve comprise. C'est l'un des tours de l'épisode 1.6.",
      e: 'Le cadenas de Bob est public. Moi aussi, je peux fermer des clés pour lui…' },
    end: { t: 'À vous', p: "Dans le bac à sable, écrivez votre ordre, puis choisissez :\n- si les clés voyagent en clair ou fermées au cadenas de Bob ;\n- ce que fait Eve : lire, ou changer l'ordre en route.\n\nLa carte montre ce qu'Eve obtient et ce que Bob lit.\n\nL'épisode 2, le cadenas de Bob, raconte le cadenas sans les nombres. L'épisode 3, Diffie-Hellman, montre une autre façon d'avoir une clé en commun : Alice et Bob la calculent chacun de leur côté, sans qu'elle voyage jamais.",
      doors: { sandbox: ['Bac à sable', 'Votre ordre, les clés en clair ou au cadenas, et ce qu’Eve en fait'], quiz: ['Quiz', 'Sept questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 1.5 · Le paquet complet ▶', 'Les quatre briques dans l’ordre, côté Alice puis côté Bob'] } },
  },

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': "Écrivez un ordre, choisissez comment voyagent les clés et ce que fait Eve, et regardez ce que lit Bob.",
  'sb.order': "L'ordre", 'sb.keys': 'Les deux clés', 'sb.eve': 'Eve',
  'sb.clear': 'voyagent en clair', 'sb.rsa': 'voyagent fermées au cadenas de Bob (RSA-OAEP)',
  'sb.read': "lit ce qu'elle peut", 'sb.rewrite': "change l'ordre en route",
  'sb.send': 'Envoyer le messager ▶',
  'sb.stats': 'Envoyés <b>{sent}</b> · clés lues par Eve <b>{keys}</b> · ordres changés acceptés <b>{fooled}</b> · rejetés <b>{rejected}</b>',
  'sb.empty': 'Écrivez un ordre d’abord.',

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'The Key That Crosses the Valley — Crypto, Visualized',
  title: 'The Key That Crosses the Valley',
  subtitle: 'Both keys must reach Bob. He sends his open padlock: RSA-2048 with OAEP.',
  loading: 'Building the castles…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  'nav.more': 'Read more ▾', 'nav.less': 'Fold ▴',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chronicler' },

  'm.keysClear': 'AES key: {a}… HMAC key: {b}… In the clear. I copy them. Ride on, rider.',
  'm.bobKeys': 'Alice’s two keys. Now I am ready to read her orders.',
  'm.padlockEve': 'Bob’s padlock: n, 256 bytes, and e = 65537. I copy it… it locks, it does not open.',
  'm.aliceGot': 'Bob’s open padlock. I can lock things for him.',
  'm.lockedEve': '256 bytes locked with Bob’s padlock: {h}… I have the same padlock. It opens nothing. Ride on.',
  'm.bobOpen': 'My private key opens the padlock: Alice’s keys. Seal checked, I decrypt: “{m}”.',
  'm.eveRead': 'The keys are in the clear: I decrypt. “{m}”. Ride on, rider.',
  'm.eveRewrite': 'The keys are in the clear: I read “{m}”, I write “{w}”, and I redo the seal. Ride on.',
  'm.eveFlip': 'Keys locked with Bob’s padlock… I change byte 11 of the IV, blindly. Ride on.',
  'm.bobRead': 'Seal checked, I decrypt: “{m}”.',
  'm.bobReject': 'Invalid seal: packet rejected. I decrypt nothing.',
  'm.busy': 'A messenger is already on the road.',

  card: {
    keys: "Alice's two keys", aes: 'AES key (32 bytes)', mac: 'HMAC key (32 bytes)',
    keysNote: 'Drawn at random for this order. Bob must have the same ones, and Eve neither.',
    clear: 'What Eve copies', clearNote: 'In the clear: Eve now has the same keys as Alice and Bob.',
    fall: 'Eve, with the copied keys', reads: "She decrypts Alice's order", writes: 'She writes, encrypts and seals',
    tag: 'her seal (32 bytes)', bobCheck: 'Bob checks the seal with his HMAC key', sealOk: 'valid seal',
    toy: 'RSA by hand', pub: 'public', priv: 'private', lockL: 'lock 7', openL: 'open 13',
    toyNote: 'mod 55: the remainder of the division by 55. d is computed from 5 and 11; with 55 alone, you must first find 5 and 11.',
    pubkey: "Bob's public key", nL: 'n = p × q (256 bytes)', more: '⋮ {n} more rows', below: '▾ more below', eL: 'e',
    pubNote: 'n has {d} digits in decimal. p and q, 128 bytes each, never leave Bob’s castle.',
    oaep: 'Alice locks her two keys', mL: 'AES key ‖ HMAC key (64 bytes)', seedL: 'OAEP seed (32 bytes, random)',
    emL: 'EM: 00 ‖ masked seed ‖ masked block (256 bytes)', lockArrow: 'c = EM<sup>65537</sup> mod n', cL: 'c, the locked keys (256 bytes)',
    oaepNote: 'The block before masking: SHA-256 of the empty label (32) ‖ {z} bytes of 00 ‖ 01 ‖ the 64 bytes of the keys.',
    seed: 'Same keys, two seeds', c1: 'seed 1', c2: 'seed 2', diff: '{d} bytes out of 256 differ.',
    open: 'Bob opens the padlock', openArrow: 'EM = c<sup>d</sup> mod n, then OAEP removed', got: 'the 64 bytes recovered',
    same: "Alice's keys, byte for byte.",
    hybrid: 'Who carries what', limit: 'RSA-2048 with OAEP carries at most 256 − 2 × 32 − 2 = {max} bytes.',
    rows: [['locked keys (RSA-OAEP)', '{k} bytes', 'for 64 bytes of keys'], ['IV', '16 bytes', ''], ['ciphertext (AES-256-CBC)', '{c} bytes', 'for an order of {n} bytes'], ['seal (HMAC-SHA256)', '32 bytes', '']],
    fresh: 'The same order, sent twice', send1: 'send 1', send2: 'send 2',
    fields: { ek: 'locked keys', iv: 'IV', ct: 'ciphertext', tag: 'seal' },
    freshNote: 'Fresh keys, IV and seed: nothing in common but chance. Bytes equal at the same place: {n} out of {t}, what two random draws give (1 chance in 256 per byte).',
    packet: 'The whole packet',
    bricks: { k: 'keys (RSA-OAEP)', iv: 'IV', ct: 'AES-256-CBC ciphertext', mac: 'HMAC-SHA256' },
    verdict: { ok: 'accepted', reject: 'rejected, not decrypted', wrong: 'accepted, but changed!' },
    keysHow: { clear: 'The keys travel in the clear', rsa: "The keys travel locked with Bob's padlock" },
    eveGets: 'What Eve gets', eveKeys: 'both keys, and the order: “{m}”', eveNothing: 'nothing: 256 bytes she cannot open',
    bobGets: 'What Bob reads',
  },

  'in.aes': 'AES key · 32 bytes', 'in.mac': 'HMAC key · 32 bytes', 'in.one': '01 at the end of the line: the keys follow',
  'in.zeros': '{n} bytes of 00', 'in.lhash': 'SHA-256 of the empty label · 32 bytes', 'in.seed': 'the seed · 32 random bytes',
  'in.mask1': '⊕ SHA-256 of the seed, stretched to {n} bytes', 'in.mask2': '⊕ SHA-256 of the masked block',
  'in.mseed': 'masked seed', 'in.mdb': 'masked block · {n} bytes', 'in.em': 'EM · 256 bytes, read as one number',
  'in.pad': "Bob's padlock: n, e", 'in.lock': 'c = EM⁶⁵⁵³⁷ mod n', 'in.c': 'c, the locked keys · 256 bytes',
  'in.phi': '({p} − 1) × ({q} − 1) = {phi}', 'in.dcalc': '{e} × {d} = {ed} = {k} × {phi} + 1',
  'in.pub': 'public key ({n}, {e}): the padlock', 'in.priv': "private key ({n}, {d}): Bob's key",
  'in.p1024': '{x} · 1,024 bits · only Bob knows it', 'in.n2048': 'n = p × q · 2,048 bits = 256 bytes',
  'in.rsa250': '829 bits: RSA-250,\nthe largest number of this kind\never factored in public (2020)',

  ch: ['Keys in the clear', "Bob's padlock", 'Hybrid', 'The packet'],
  steps: {
    intro: { t: 'Two keys to get across', p: "In episodes 1.2 and 1.3, Alice encrypts her orders with an {1|AES key} and seals them with an {4|HMAC key}, and Bob has the same two keys. But where did he get them?\n\nAlice and Bob have never met: between Alice's castle, in the west, and Bob's, in the east, lies the valley, and the only road runs under the walls of Eve's city. Nothing was agreed in advance.\n\nFor every order, Alice draws two fresh keys of 32 random bytes:\n- an {1|AES key}, to encrypt;\n- an {4|HMAC key}, to seal.\n\nThey must reach Bob, and Bob alone.",
      a: 'Two fresh keys, 64 bytes. How do I give them to Bob without giving them to Eve?' },
    clear: { t: 'The keys in the clear', p: "The simplest way: a rider carries both keys to Bob, as they are. Launch him. Eve's guards stop him under her walls, like every messenger; Eve reads the 64 bytes, copies them, and lets him go on. Bob receives his keys, and nothing tells him Eve has read them: a copy leaves no trace.",
      go: 'Send the keys in the clear ▶' },
    fall: { t: 'Everything falls', p: "Then Alice sends her order, encrypted and sealed as in episode 1.3. But Eve has both keys:\n- she decrypts “ATTACK AT 6AM TOMORROW”;\n- she writes “ATTACK AT {r|9AM} TOMORROW” and encrypts it with the {1|AES key};\n- she redoes the seal with the {4|HMAC key}.\n\nBob checks the seal, it is right, and he reads {r|9AM}. Encryption and the seal are worth only as much as the secrecy of their keys.\n\nEncrypt the keys? With what key? It would have to get across first, too: the problem moves back one step, it does not go away.",
      e: 'With your keys, I read the order, I rewrite it, and my seal is valid.' },
    padlock: { t: "Bob's padlock", p: "Bob has another idea. He makes open padlocks, all alike, and gives them to anyone who wants one:\n- to lock a padlock, you just push: the open padlock is his **public key**;\n- to open it, you need the key, and Bob alone has it: his **private key**.\n\nRSA makes this padlock out of numbers. Bob picks two prime numbers, here 5 and 11, and publishes their product n = 55 with e = 3:\n- locking 7: 7³ = 343, and we keep the remainder of the division by 55 (written mod 55): 13;\n- opening 13: 13²⁷ mod 55 = 7.\n\nThat 27, the private key d, Bob drew from 5 and 11: (5 − 1) × (11 − 1) = 40, and 3 × 27 = 81 leaves 1 when divided by 40.",
      b: 'My open padlocks, for everyone. My key, for me alone.' },
    rsa2048: { t: 'The real padlock: RSA-2048', p: "With 55, anyone finds 5 × 11 in their head, and then the private key.\n\nBob's real padlock starts from two prime numbers p and q of 1,024 bits, drawn at random. His public key:\n- n = p × q, which is 2,048 bits long, that is 256 bytes, or 617 digits in decimal;\n- e = 65537.\n\nMultiplying p by q is instant; finding p and q from n, nobody knows how to do for a number this size: the largest number of this kind ever factored in public is 829 bits long (RSA-250, in 2020). Bob keeps p, q and d to himself.",
      b: 'n and e: my padlock, for everyone. p, q and d never leave my castle.' },
    deliver: { t: 'The padlock crosses the valley', p: "Bob sends his open padlock to Alice: n (256 bytes) and e. Launch the rider. Eve stops him under her walls and copies the padlock: let her keep it, it is made to be handed out. An open padlock locks, it does not open: having Bob's public key does not give you his private key.\n\n(Eve could also slip in her own padlock instead of Bob's; against that trick, you need to prove whom a public key belongs to, with a certificate. Here, she only copies.)",
      go: 'Send the padlock to Alice ▶' },
    close: { t: 'Alice locks the padlock', p: "Alice lays her two keys end to end, the {1|AES key} then the {4|HMAC key}: 64 bytes. RSA does not lock bare bytes:\n- OAEP first fits them into a block of 256 bytes, the size of n, with 32 bytes drawn at random, the seed: that is the block EM;\n- EM, read as one big number, is locked the way 7 was: c = EM⁶⁵⁵³⁷ mod n.\n\nThe 256 bytes of c, the locked keys, travel with the packet. Once the padlock is shut, not even Alice can reopen her keys: she does not have Bob's private key.",
      a: "My two keys, locked with Bob's padlock. Not even I can reopen them." },
    seed: { t: 'Why OAEP', p: "Without OAEP, RSA always locks the same way: the same bytes always give the same c. Eve, who has the padlock, could lock what she guesses herself (“yes”, “no”, “6AM”, “9AM”) and compare it with what goes by.\n\nOAEP mixes the 32 random bytes of the seed into the message, using SHA-256: the same two keys, locked twice with two seeds, give two unrelated blocks, as the card shows. Bob, when he opens it, finds the seed and removes it.\n\nOne rule: **never RSA without OAEP**.",
      e: 'The same keys, locked twice: two unrelated blocks. I have nothing to compare.' },
    ride: { t: 'The locked keys cross', p: "The packet now leaves with its keys locked. Launch the messenger. Eve stops him and reads the 256 bytes; the copy of Bob's padlock she made locks, it does not open. She lets him go on.\n\nAt Bob's, with his private key d:\n- he computes cᵈ mod n;\n- he removes OAEP and finds the 64 bytes: Alice's {1|AES key} and {4|HMAC key};\n- only then does he check the seal and decrypt the order.",
      go: 'Send the packet ▶' },
    hybrid: { t: 'RSA for the keys, AES for the rest', p: "Why not lock the order itself with Bob's padlock? For two reasons:\n- it is small: an RSA-2048 block with OAEP and SHA-256 carries 190 bytes at most;\n- it is slow: on an ordinary computer, in the time it takes to open a single RSA-2048 block, half a thousandth of a second, AES encrypts more than half a megabyte.\n\nSo each does its own job: RSA carries only the 64 bytes of the keys, and AES encrypts the order, however long it is. This is **hybrid encryption**; HTTPS and PGP split the work the same way, public-key crypto for the key, AES for the rest.",
      n: 'RSA carries the keys, AES carries the order. Each does what it does best.' },
    fresh: { t: 'Fresh keys for every order', p: "For the next order, Alice reuses nothing. Everything is fresh:\n- the {1|AES key};\n- the {4|HMAC key};\n- the {2|IV};\n- the OAEP seed.\n\nThe card shows two sends of the same order: nothing looks alike, and Eve cannot even tell it is the same order. If the keys of one message ever leaked, they would open that message only.\n\nBob's private key, on the other hand, opens every key ever locked for him: that is the one he guards best.",
      a: 'The same order, twice: nothing looks alike.' },
    packet: { t: 'The whole packet', p: "All four bricks are here:\n- {1|both keys}, locked with RSA-OAEP, 256 bytes;\n- {2|the IV}, 16 bytes;\n- {3|the ciphertext}, AES-256-CBC;\n- {4|the seal}, the HMAC-SHA256 of the IV and the ciphertext, 32 bytes.\n\nEpisode 1.5 puts them together in order, on Alice's side and then on Bob's. But Bob's padlock is public: anyone can lock keys for him, Eve included. That is one of the tricks of episode 1.6.",
      e: "Bob's padlock is public. I can lock keys for him too…" },
    end: { t: 'Your turn', p: "In the sandbox, write your order, then choose:\n- whether the keys travel in the clear or locked with Bob's padlock;\n- what Eve does: read, or change the order on the way.\n\nThe card shows what Eve gets and what Bob reads.\n\nEpisode 2, Bob's padlock, tells the padlock story without the numbers. Episode 3, Diffie-Hellman, shows another way to share a key: Alice and Bob each compute it on their own side, and it never travels.",
      doors: { sandbox: ['Sandbox', 'Your order, the keys in the clear or padlocked, and what Eve does with them'], quiz: ['Quiz', 'Seven questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 1.5 · The Whole Packet ▶', 'The four bricks in order, on Alice’s side and then on Bob’s'] } },
  },

  'sb.title': 'Sandbox',
  'sb.hint': 'Write an order, choose how the keys travel and what Eve does, and watch what Bob reads.',
  'sb.order': 'The order', 'sb.keys': 'The two keys', 'sb.eve': 'Eve',
  'sb.clear': 'travel in the clear', 'sb.rsa': "travel locked with Bob's padlock (RSA-OAEP)",
  'sb.read': 'reads what she can', 'sb.rewrite': 'changes the order on the way',
  'sb.send': 'Send the messenger ▶',
  'sb.stats': 'Sent <b>{sent}</b> · keys read by Eve <b>{keys}</b> · changed orders accepted <b>{fooled}</b> · rejected <b>{rejected}</b>',
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
