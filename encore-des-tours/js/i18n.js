// Every visible word of episode 1.6 « Eve a encore des tours », in French (the course language) and
// English. t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.
// Python names (functions, AESGCM, padding.PSS) are code: the same in both languages.
// A number in a string is {k}: {n} and {i} also bring a French ordinal {o} with them.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Eve a encore des tours — Crypto en visuel',
  title: 'Eve a encore des tours',
  subtitle: 'Un faux paquet, un vieux paquet rejoué : la signature d’Alice, un numéro, AES-GCM. Puis à vous de jouer Eve.',
  loading: 'Construction des châteaux…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  'nav.more': 'Lire la suite ▾', 'nav.less': 'Replier ▴',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chroniqueur' },

  // what Eve and Bob say when a rider passes
  'm.eveForge': 'Mes clés, mon ordre, le cadenas de Bob : voilà un paquet « d’Alice ». Va, cavalier.',
  'm.eveForgeSig': 'Et cette fois, je le signe. Avec ma clé privée, bien sûr. Va.',
  'm.eveCopy': 'Signé d’Alice : je n’y change rien. Mais j’en garde une copie, {h}…',
  'm.eveCopyNum': 'Le n° {k}, signé d’Alice. J’en garde une copie, comme hier.',
  'm.eveReplay': 'Le lendemain. La copie, octet pour octet. Va, cavalier.',
  'm.evePass': 'Je ne sais rien ouvrir. Repars.',
  'm.eveFlip': 'Je ne lis rien… mais je change le 1er octet du chiffré. Repars.',
  'm.okSig': 'Signature d’Alice ✔. ', 'm.okNum': 'N° {k} ✔. ',
  'm.bobRead': 'Clés ouvertes, sceau vérifié, je déchiffre : « {m} ».',
  'm.bobSig': 'La signature ne correspond pas : ce paquet n’est pas celui qu’Alice a signé. Rejeté, je n’ouvre rien.',
  'm.bobNum': 'N° {k} : pas plus grand que le dernier reçu. Une copie : rejetée. Je n’ouvre rien.',
  'm.bobNoNum': 'Pas de numéro : paquet rejeté. Je n’ouvre rien.',
  'm.bobReject': 'ALERTE : HMAC invalide, paquet rejeté. Je ne déchiffre rien.',
  'm.bobNoKeys': 'Ma clé privée n’ouvre pas ces clés : paquet rejeté.',
  'm.busy': 'Un messager est déjà en route.',

  // Eve's four tricks, as [trick, what stops it, stopped already]
  tricks: [
    ['Lire', 'tout ce qui passe : AES-256-CBC l’en empêche (épisode 1.2)', true],
    ['Modifier', 'un octet en transit : le sceau HMAC, vérifié avant de déchiffrer (1.3, 1.5)', true],
    ['Se faire passer pour Alice', 'fabriquer un paquet entier, à son nom', false],
    ['Rejouer', 'renvoyer à Bob un vrai paquet d’Alice, plus tard', false],
  ],
  // the attack-defense questions, as [trick, question to ask of the other pair's code]
  play: [
    ['Lire', 'La clé AES et l’IV sont-ils neufs à chaque envoi, tirés avec os.urandom ? Une clé écrite en dur dans le code ? ECB quelque part ?'],
    ['Modifier', 'Le HMAC couvre-t-il l’IV ET le chiffré ? Est-il vérifié avant de déchiffrer, avec hmac.compare_digest et non == ?'],
    ['Écouter les erreurs', 'Le programme répond-il « padding incorrect » ou « HMAC incorrect » selon le cas ? Chaque différence renseigne Eve.'],
    ['Se faire passer pour Alice', 'Avec la clé publique de Bob, fabriquez un paquet : est-il accepté ?'],
    ['Rejouer', 'Renvoyez deux fois le même paquet : est-il accepté deux fois ?'],
    ['Les clés publiques', 'Comment Alice a-t-elle reçu le cadenas de Bob ? Eve aurait-elle pu glisser le sien à la place, en route ?'],
    ['RSA', 'OAEP, ou RSA sans padding ? 2048 bits au moins ?'],
  ],

  // the corner card
  card: {
    more: '⋮ {k} lignes de plus', bytes: '{k} octets',
    fields: { num: 'n°', ek: 'clés fermées', iv: 'IV', ct: 'chiffré', tag: 'sceau', sig: 'signature' },
    tricks: 'Les tours d’Eve', stopped: 'arrêté', notYet: 'pas encore',
    tricksNote: 'Les quatre tours qu’Eve a dans son sac, quand le réseau lui appartient : elle lit tout, peut modifier un octet, rejouer un vieux paquet ou se faire passer pour Alice.',
    forge: 'Le paquet d’Eve', hers: 'les siennes',
    cbcArrow: 'AES-256-CBC, avec la clé AES d’Eve et son IV', ctL: 'le chiffré ({k} octets)', tagL: 'le sceau : HMAC-SHA256 de IV ‖ chiffré, avec la clé HMAC d’Eve',
    forgeNote: 'Les quatre gestes d’Alice, faits par Eve avec ses propres clés. Le cadenas de Bob est public : elle a pu fermer ses clés pour lui.',
    bobForged: 'Bob reçoit le paquet d’Eve', mine: 'le sceau que Bob recalcule', sealOk: 'égal au sceau du paquet',
    fooled: 'Accepté : Bob croit qu’Alice lui demande le code.',
    who: 'Le HMAC prouve « quelqu’un qui a la clé »',
    whoThen: 'Une clé convenue d’avance', whoThenText: 'Alice et Bob seuls l’ont : un sceau valide veut dire « Alice » (ou Bob).',
    whoNow: 'Une clé tirée par l’expéditeur', whoNowText: 'Elle voyage dans le paquet, fermée pour Bob : qui que soit l’expéditeur, son sceau est valide.',
    whoNote: 'Le cadenas de Bob garantit que seul Bob ouvrira, pas qui a fermé. Le sceau prouve que le paquet n’a pas changé depuis qu’on l’a scellé, pas qui l’a scellé.',
    sign: 'Alice signe le paquet', signedL: 'ce qu’Alice signe : le paquet, bout à bout', digest: 'son empreinte SHA-256 (32 octets)',
    pssArrow: 'PSS : l’empreinte, 32 octets de sel au hasard, mis en forme sur 256 octets', emL: 'le bloc PSS (256 octets)',
    dArrow: 'puissance d (la clé privée d’Alice), modulo n', sigL: 'la signature (256 octets)',
    verify: 'Bob vérifie avec la clé publique d’Alice', eArrow: 'puissance e = 65537 (la clé publique d’Alice), modulo n',
    emBack: 'le bloc retrouvé', hIn: 'l’empreinte que le bloc porte', hMine: 'celle que Bob recalcule sur le paquet reçu',
    sigOk: 'les deux correspondent : c’est Alice qui a signé ce paquet-là',
    padlock: 'Le cadenas de Bob', padlockText: 'Tout le monde ferme (clé publique), Bob seul ouvre (clé privée).',
    signature: 'La signature d’Alice', signatureText: 'Alice seule signe (clé privée), tout le monde vérifie (clé publique).',
    evilSig: 'Eve signe… avec sa clé', sigEve: 'la signature d’Eve, faite avec sa clé privée',
    sigBad: 'ne correspond pas : ce n’est pas la clé d’Alice qui a signé',
    tooBig: 'Ce nombre dépasse même le n d’Alice : pour sa clé publique, ce n’est pas une signature possible.',
    replay: 'Le même paquet, deux fois', day1: 'jour 1 : le paquet d’Alice', day2: 'jour 2 : la copie d’Eve (pas un octet de différence)',
    again: 'Encore :', replayNote: 'La copie est parfaite : signature, sceau, tout est d’Alice. Rien dans le paquet ne dit qu’il est déjà passé.',
    num: 'Un numéro sous la signature', numL: 'le n° 42, sur 8 octets',
    numFirst: 'le n° 42, la première fois (Bob avait vu le 41)', numAgain: 'le n° 42, une seconde fois', numBumped: 'Eve change 42 en 43',
    numNote: 'Bob retient le plus grand numéro reçu d’Alice. Une date fait aussi l’affaire : Bob refuse ce qui a plus de quelques minutes, et se souvient de ce qu’il a reçu pendant ces minutes-là.',
    replayNum: 'Le rejeu arrêté', day1n: 'jour 1 : Bob avait vu le n° {k}', day2n: 'jour 2 : Bob a vu le n° {k}',
    opSig: 'vérifier la signature d’Alice', opNum: 'numéro plus grand que {k} ?', op1: 'ouvrir les clés', op2: 'vérifier le sceau', op3: 'déchiffrer',
    gcm: 'AES-256-GCM : un seul geste', keyL: 'la clé AES (32 octets), une seule', nonceL: 'le nonce (12 octets), jamais deux fois avec cette clé',
    ctrArrow: 'AES(nonce ‖ compteur 2, 3…), XOR l’ordre', gctL: 'le chiffré ({k} octets, la longueur de l’ordre : pas de padding)',
    ghashArrow: 'GHASH, puis XOR AES(nonce ‖ compteur 1)', gtagL: 'le tag (16 octets)',
    before: 'CBC + HMAC', beforeText: 'deux clés, deux algorithmes, et l’ordre des gestes à ne pas oublier.',
    after: 'GCM', afterText: 'une clé, un geste ; le tag est vérifié avant que le moindre octet soit rendu.',
    gcmEve: 'Eve change un octet du chiffré GCM', ctSent: 'le chiffré envoyé', ctGot: 'le chiffré reçu', gtagGot: 'le tag du paquet (intact)',
    invalidTag: 'InvalidTag : rien n’est rendu, pas un octet de l’ordre',
    nonceNote: 'Le piège de GCM : deux messages avec la même clé et le même nonce. Le XOR des deux chiffrés est alors le XOR des deux messages, et Eve peut fabriquer des tags valides.',
    final: 'Un paquet qui arrête les quatre tours',
    finalFields: { num: 'n°', ek: 'clé fermée', iv: 'nonce', ct: 'chiffré GCM', tag: 'tag', sig: 'signature' },
    finalRole: { num: 'sous la signature : contre le rejeu', ek: 'une clé AES, RSA-2048-OAEP : Bob seul l’ouvre', iv: 'neuf à chaque message',
      ct: 'AES-256-GCM : contre la lecture', tag: 'GCM : contre la modification', sig: 'RSA-PSS d’Alice sur tout le reste : contre l’usurpation' },
    bobFinal: 'Bob', op1one: 'ouvrir la clé', opGcm: 'déchiffrer en GCM (le tag d’abord)',
    finalNote: 'Une façon de faire, parmi d’autres : Ed25519 au lieu de RSA-PSS, une date au lieu d’un numéro, ChaCha20-Poly1305 au lieu d’AES-GCM.',
    play: 'À votre tour : les questions d’Eve',
    verdict: { ok: 'accepté', reject: 'rejeté, rien de déchiffré', fooled: 'accepté… et ce n’est pas un nouvel ordre d’Alice : Eve gagne' },
    sbPass: 'Eve laisse passer le paquet d’Alice', sbFlip: 'Eve change le 1er octet du chiffré', sbForge: 'Eve fabrique un paquet, signé de sa clé',
    sbReplay: 'Eve renvoie la copie du n° {k}',
    sbSig: 'Bob vérifie la signature', sbNum: 'Bob vérifie le numéro', sbNone: 'Bob ne vérifie que le sceau',
  },

  // inside the keeps (inside.js): Alice signs and Bob checks (chapter 2), AES-GCM and Eve's byte
  // (chapter 4); the colours are the card's
  'in.zeros8': '8 octets à 00', 'in.digest': 'l’empreinte SHA-256 du paquet · 32 octets', 'in.salt': 'le sel · 32 octets au hasard',
  'in.h': 'H = SHA-256(8 × 00 ‖ empreinte ‖ sel)', 'in.bc': 'bc : la fin du bloc', 'in.dbZeros': '{n} octets à 00',
  'in.one': '01 : le sel suit', 'in.dbSalt': 'le sel', 'in.masked': 'masqué · {n} octets', 'in.mask': '⊕ SHA-256 de H, étiré à {n} octets',
  'in.em': 'le bloc PSS · 256 octets, lus comme un seul nombre', 'in.priv': 'd : la clé privée d’Alice', 'in.signCalc': 'signature = bloc^d mod n',
  'in.sig': 'la signature · 256 octets', 'in.sigGot': 'la signature reçue · 256 octets', 'in.pub': 'n, e = 65537 : la clé publique d’Alice',
  'in.verCalc': 'bloc = signature^e mod n', 'in.unmask': '⊕ SHA-256 de H : le sel réapparaît',
  'in.key': 'la clé AES · 32 octets', 'in.nonce': 'le nonce · 12 octets', 'in.ctr': 'nonce ‖ compteur 2, puis 3', 'in.zero': '16 octets à 00',
  'in.ctr1': 'nonce ‖ compteur 1', 'in.ks': 'le flux : AES des compteurs', 'in.order': '⊕ l’ordre · {n} octets', 'in.ct': 'le chiffré · {n} octets',
  'in.nopad': 'pas de padding : la longueur de l’ordre', 'in.hkey': 'H = AES(clé, 16 × 00) : la clé de GHASH', 'in.s': 'GHASH du chiffré · 16 octets',
  'in.ej0': '⊕ AES(nonce ‖ 1)', 'in.tag': 'le tag · 16 octets', 'in.ctGot': 'le chiffré reçu', 'in.flip': 'Eve a changé le 1er octet',
  'in.mineTag': 'le tag que Bob recalcule', 'in.diff': '{d} octets sur 16 diffèrent', 'in.invalid': 'InvalidTag',
  'in.nothing': 'l’ordre : pas un octet n’est rendu',

  // story
  ch: ['Le faux paquet', 'La signature', 'Le rejeu', 'AES-GCM', 'À votre tour'],
  steps: {
    intro: { t: 'Eve a encore des tours', p: "Le paquet complet de l'épisode 1.5 arrête deux tours d'Eve :\n- elle lit : elle ne voit qu'un {3|chiffré} ;\n- elle modifie : un octet changé, un {4|sceau} faux, et le paquet est rejeté sans être déchiffré.\n\nMais Eve a d'autres tours dans son sac, et le paquet de 1.5 n'arrête ni l'un ni l'autre :\n- {r|se faire passer pour Alice}, en fabriquant un paquet entier à son nom ;\n- {r|rejouer} : renvoyer à Bob, plus tard, un vrai paquet d'Alice, tel quel.\n\nCet épisode montre les deux tours, puis ce qui les arrête : une {b|signature}, et un numéro. Puis AES-GCM, qui chiffre et scelle d'un seul geste. Et à la fin, c'est vous qui jouerez Eve.",
      e: 'Lire, non. Modifier, non. Il me reste deux tours.' },
    forge: { t: 'Le cadenas de Bob est public', p: "Le cadenas de Bob, sa clé publique, n'a rien de secret : Bob l'a distribué pour qu'Alice puisse lui fermer des clés (épisode 1.4). Eve l'a aussi, comme tout le monde. Alors, dans sa ville, elle fait exactement les quatre gestes d'Alice, avec ses propres tirages :\n- elle tire une {1|clé AES} et une {4|clé HMAC} à elle, et un {2|IV} ;\n- elle chiffre « JE SUIS ALICE, DONNE-MOI LE CODE » : le {3|chiffré} ;\n- elle scelle l'IV et le chiffré avec sa clé HMAC : le {4|sceau} ;\n- elle ferme ses deux clés au cadenas de Bob.\n\nLa carte montre ses octets : un paquet aussi complet que ceux d'Alice.",
      e: 'Le cadenas de Bob ? Tout le monde l’a. Moi aussi.' },
    forged: { t: 'Bob reçoit le paquet d’Eve', p: "Un cavalier sort de la ville d'Eve aux couleurs d'Alice, et prend la route de Bob. Lancez-le. Bob fait ses trois gestes, comme il faut :\n- sa clé privée ouvre les {1|clés}, puisqu'Eve les a fermées avec son cadenas ;\n- le {4|sceau} qu'il recalcule avec la clé HMAC qu'il vient d'ouvrir correspond ;\n- il déchiffre.\n\nTout est valide. Bob accepte le paquet, et croit qu'Alice lui demande le code.",
      go: 'Envoyer le cavalier d’Eve ▶' },
    who: { t: 'Le HMAC prouve « quelqu’un qui a la clé »', p: "Pourquoi tout est-il valide ? Un {4|sceau} HMAC prouve une seule chose : celui qui l'a fait avait la clé HMAC. Ce que cela veut dire dépend de qui tire la clé :\n- quand Alice et Bob partagent une clé que personne d'autre n'a, cela veut dire « Alice » ;\n- ici, la clé HMAC voyage dans le paquet, et c'est l'expéditeur qui la tire : Eve a tiré la sienne. Son sceau prouve « quelqu'un qui avait cette clé », c'est-à-dire {r|Eve}.\n\nLe cadenas de Bob ne dit rien non plus de l'expéditeur : il garantit que seul Bob ouvrira, pas qui a fermé. Rien, dans le paquet de l'épisode 1.5, ne dit qui l'a écrit.",
      b: 'Clés, sceau, tout est bon… et rien ne me dit qui l’a écrit.' },
    sign: { t: 'Alice signe le paquet', p: "Il faut à Alice quelque chose qu'elle seule sait faire, et que tout le monde sait vérifier : une {b|signature}. Alice a sa propre paire de clés RSA-2048, distincte de celle de Bob : une clé privée, qu'elle garde, et une clé publique, que Bob a reçue comme Alice a reçu son cadenas. Pour signer :\n- elle calcule l'empreinte SHA-256 du paquet, 32 octets ;\n- le schéma PSS la met en forme sur 256 octets, en y mêlant 32 octets tirés au hasard, le sel ;\n- elle élève ce bloc à la puissance de sa clé privée, modulo n, comme Bob ouvre son cadenas.\n\nIl en sort 256 octets : la {b|signature}, ajoutée au paquet. Changez un seul octet du paquet, l'empreinte change ; et sans la clé privée d'Alice, personne ne sait faire la signature qui va avec.",
      a: 'Ma clé privée signe. Personne d’autre ne l’a.' },
    verify: { t: 'Bob vérifie avec la clé publique d’Alice', p: "Bob reçoit le paquet. Avant même d'ouvrir les clés, il vérifie la {b|signature} :\n- il l'élève à la puissance de la clé publique d'Alice, modulo n, et retrouve le bloc PSS qu'Alice avait mis en forme ;\n- il recalcule l'empreinte SHA-256 du paquet qu'il a reçu : elle doit correspondre à celle que le bloc porte.\n\nC'est RSA à l'envers du cadenas :\n- le cadenas de Bob, tout le monde le ferme et lui seul l'ouvre ;\n- la signature d'Alice, elle seule la fait et tout le monde la vérifie.\n\nRSA-PSS n'est pas la seule signature : Ed25519, sur une courbe elliptique, fait le même travail avec une clé publique de 32 octets et une signature de 64.",
      b: 'La clé publique d’Alice le confirme : c’est bien elle.' },
    evilSig: { t: 'Eve signe aussi… avec sa clé', p: "Eve recommence. Elle fabrique son paquet, et le signe : elle a, elle aussi, une paire de clés RSA, et sa signature est une vraie signature RSA-PSS. Mais c'est {r|la sienne}. Lancez son cavalier. Bob vérifie avec la clé publique d'Alice :\n- le bloc qui en sort n'a pas la forme PSS ;\n- l'empreinte qu'il porte n'est pas celle du paquet.\n\n{r|Rejeté}, avant même d'ouvrir les clés. Pour réussir, il faudrait à Eve la clé privée d'Alice.",
      go: 'Envoyer le cavalier d’Eve ▶' },
    replay: { t: 'Le rejeu', p: "Eve ne sait plus fabriquer un paquet d'Alice. Mais elle peut garder la copie d'un vrai. Lancez les deux cavaliers.\n\nLe premier est celui d'Alice : « ATTAQUE A 6H DEMAIN », signé. Eve l'arrête, n'y change rien, puisque tout se verrait, et en garde une copie, octet pour octet. Bob vérifie la signature, ouvre les clés, vérifie le sceau, lit.\n\nLe lendemain, Eve renvoie {r|la copie}. La signature est celle d'Alice, le sceau est bon : Bob lit de nouveau « attaque à 6h demain », un jour trop tard, et attaque seul.",
      go: 'Envoyer, puis rejouer ▶' },
    num: { t: 'Un numéro sous la signature', p: "Une copie est parfaite par nature : rien en elle ne la distingue de l'original. Ce qui l'arrête, c'est la mémoire de Bob :\n- Alice numérote ses paquets : le n° 41 hier, le n° 42 aujourd'hui. Le numéro voyage en tête du paquet, et il passe sous la {b|signature} avec le reste ;\n- Bob retient le plus grand numéro reçu d'Alice, et refuse tout paquet dont le numéro n'est pas plus grand.\n\nEve essaie deux fois :\n- elle renvoie le n° 42 : pas plus grand que 42, {r|rejeté} ;\n- elle change 42 en 43 : la signature ne correspond plus, {r|rejeté}.\n\nUne date ferait aussi l'affaire : Bob refuse ce qui a plus de quelques minutes, et se souvient de ce qu'il a reçu pendant ces minutes-là.",
      a: 'Le n° 42, sous ma signature : Eve ne peut pas le changer.' },
    replayNum: { t: 'Le rejeu arrêté', p: "Rejouons la scène, avec le numéro. Lancez les deux cavaliers :\n- Alice envoie le n° 42 ; Bob vérifie la signature, voit que 42 est plus grand que 41, le dernier qu'il ait reçu, lit l'ordre et retient 42 ;\n- le lendemain, Eve renvoie sa copie. La signature est toujours bonne, mais le n° 42 n'est pas plus grand que 42 : {r|rejeté}, sans rien ouvrir.",
      go: 'Envoyer, puis rejouer ▶' },
    gcm: { t: 'AES-GCM : chiffrer et sceller d’un seul geste', p: "Le paquet chiffre avec AES-CBC, puis scelle avec HMAC : deux algorithmes, deux clés, et un ordre des gestes à ne pas oublier. AES-GCM (pour Galois/Counter Mode) fait les deux d'un seul geste, c'est ce qu'on appelle du chiffrement authentifié :\n- il prend une seule {1|clé}, et un {2|nonce} de 12 octets : un nombre qui ne doit jamais servir deux fois avec la même clé ;\n- AES chiffre le nonce suivi d'un compteur, 2, 3, 4…, et le résultat est mêlé (XOR) à l'ordre : pas de padding, le {3|chiffré} a la longueur de l'ordre ;\n- une fonction, GHASH, replie le chiffré en une étiquette de 16 octets, le {4|tag}, qui joue le rôle du sceau.\n\nLa carte montre le même ordre, chiffré en AES-256-GCM avec la clé AES de la saga.",
      a: 'Une clé, un nonce, un geste : chiffré et scellé.' },
    gcmEve: { t: 'GCM vérifie avant de rendre quoi que ce soit', p: "Eve change le premier octet du {3|chiffré} GCM. Bob déchiffre, avec AESGCM en Python : avant de rendre quoi que ce soit, la fonction recalcule le {4|tag} ; il ne correspond plus, et elle lève une erreur, {r|InvalidTag}, sans rendre un seul octet de l'ordre. La règle « vérifier, puis déchiffrer » est dans l'algorithme lui-même : impossible de l'oublier.\n\nLe piège de GCM, c'est le {2|nonce}. Deux messages chiffrés avec la même clé et le même nonce sont mêlés au même flux :\n- le XOR des deux chiffrés donne le XOR des deux messages ;\n- Eve peut même calculer des tags valides.\n\nUn nonce neuf à chaque message, comme l'IV.",
      b: 'Un octet changé : InvalidTag. Je ne lis rien.' },
    final: { t: 'Un paquet qui arrête les quatre tours', p: "Mis bout à bout, voici une façon de tout arrêter :\n- le numéro ;\n- une seule {1|clé AES}, fermée au cadenas de Bob ;\n- le {2|nonce} ;\n- l'ordre, {3|chiffré} et {4|scellé} en AES-256-GCM ;\n- et la {b|signature} d'Alice sur tout cela.\n\nBob vérifie la signature et le numéro, ouvre la clé, déchiffre, et GCM vérifie le tag avant de rendre l'ordre. Eve ne lit pas (AES), ne modifie pas (le tag, et la signature), ne se fait pas passer pour Alice (la signature), ne rejoue pas (le numéro).\n\nLa carte montre ce paquet avec ses vrais octets. Ce n'est pas la seule façon : chaque brique a sa variante.",
      a: 'Lire, modifier, usurper, rejouer : quatre tours, et de quoi les arrêter.' },
    end: { t: 'À votre tour de jouer Eve', p: "Dans l'atelier attaque-défense, c'est vous qui jouez Eve, contre la messagerie d'un autre binôme. La carte donne les questions à poser à leur code, tour par tour : chaque réponse qui ouvre une porte est une faiblesse à consigner sur votre fiche. Dans le bac à sable, choisissez le tour d'Eve et les défenses de Bob, et regardez ce qui passe. Le paquet de base a son épisode, en détail : l'épisode 1.5 pour le paquet complet, l'épisode 1.3 pour le sceau, l'épisode 1.4 pour le cadenas.",
      doors: { sandbox: ['Bac à sable', 'Le tour d’Eve contre les défenses de Bob : ce qui passe'], quiz: ['Quiz', 'Sept questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 2 · Le cadenas de Bob ▶', 'Tout le monde peut fermer le cadenas, seul Bob peut l’ouvrir'] } },
  },

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': "Écrivez un ordre, choisissez le tour d'Eve et les défenses de Bob, et regardez ce qu'il accepte.",
  'sb.order': "L'ordre d'Alice", 'sb.eve': 'Eve', 'sb.bob': 'Bob, en plus du sceau',
  'sb.pass': 'laisse passer le paquet d’Alice', 'sb.flip': 'change un octet du chiffré',
  'sb.forge': 'fabrique son propre paquet', 'sb.replay': 'renvoie une copie du dernier paquet d’Alice',
  'sb.sig': 'vérifie la signature d’Alice', 'sb.num': 'refuse un numéro déjà vu',
  'sb.send': 'Envoyer le messager ▶',
  'sb.stats': 'Envoyés <b>{sent}</b> · acceptés <b>{ok}</b> · rejetés <b>{rejected}</b> · Eve gagne <b>{eve}</b>',
  'sb.empty': 'Écrivez un ordre d’abord.',
  'sb.noCopy': 'Alice n’a encore rien envoyé : Eve n’a rien à copier.',

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'Eve Has More Tricks — Crypto, Visualized',
  title: 'Eve Has More Tricks',
  subtitle: 'A forged packet, an old packet replayed: Alice’s signature, a number, AES-GCM. Then your turn to play Eve.',
  loading: 'Building the castles…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  'nav.more': 'Read more ▾', 'nav.less': 'Fold ▴',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chronicler' },

  'm.eveForge': 'My keys, my order, Bob’s padlock: here is a packet “from Alice”. Go, rider.',
  'm.eveForgeSig': 'And this time I sign it. With my own private key, naturally. Go.',
  'm.eveCopy': 'Signed by Alice: I change nothing. But I keep a copy, {h}…',
  'm.eveCopyNum': 'No. {k}, signed by Alice. I keep a copy, like yesterday.',
  'm.eveReplay': 'The next day. The copy, byte for byte. Go, rider.',
  'm.evePass': 'I can open nothing. Ride on.',
  'm.eveFlip': 'I read nothing… but I change byte 1 of the ciphertext. Ride on.',
  'm.okSig': 'Alice’s signature ✔. ', 'm.okNum': 'No. {k} ✔. ',
  'm.bobRead': 'Keys opened, seal checked, I decrypt: “{m}”.',
  'm.bobSig': 'The signature does not match: this is not the packet Alice signed. Rejected, I open nothing.',
  'm.bobNum': 'No. {k}: not above the last one I got. A copy: rejected. I open nothing.',
  'm.bobNoNum': 'No number: packet rejected. I open nothing.',
  'm.bobReject': 'ALERT: invalid HMAC, packet rejected. I decrypt nothing.',
  'm.bobNoKeys': 'My private key does not open these keys: packet rejected.',
  'm.busy': 'A messenger is already on the road.',

  tricks: [
    ['Read', 'everything that passes: AES-256-CBC stops her (episode 1.2)', true],
    ['Modify', 'a byte in transit: the HMAC seal, checked before decrypting (1.3, 1.5)', true],
    ['Pose as Alice', 'build a whole packet in her name', false],
    ['Replay', 'send Bob a real packet of Alice’s again, later', false],
  ],
  play: [
    ['Read', 'Are the AES key and the IV fresh for every send, drawn with os.urandom? A key written in the code? ECB anywhere?'],
    ['Modify', 'Does the HMAC cover the IV AND the ciphertext? Is it checked before decrypting, with hmac.compare_digest and not ==?'],
    ['Listen to the errors', 'Does the program answer “wrong padding” or “wrong HMAC” depending on the case? Every difference tells Eve something.'],
    ['Pose as Alice', 'With Bob’s public key, build a packet: is it accepted?'],
    ['Replay', 'Send the same packet twice: is it accepted twice?'],
    ['The public keys', 'How did Alice get Bob’s padlock? Could Eve have slipped in her own on the way?'],
    ['RSA', 'OAEP, or RSA with no padding? 2048 bits at least?'],
  ],

  card: {
    more: '⋮ {k} more rows', bytes: '{k} bytes',
    fields: { num: 'no.', ek: 'locked keys', iv: 'IV', ct: 'ciphertext', tag: 'seal', sig: 'signature' },
    tricks: 'Eve’s tricks', stopped: 'stopped', notYet: 'not yet',
    tricksNote: 'The four tricks Eve has up her sleeve when the network is hers: she reads everything, can modify a byte, replay an old packet or pose as Alice.',
    forge: 'Eve’s packet', hers: 'her own',
    cbcArrow: 'AES-256-CBC, with Eve’s AES key and her IV', ctL: 'the ciphertext ({k} bytes)', tagL: 'the seal: HMAC-SHA256 of IV ‖ ciphertext, with Eve’s HMAC key',
    forgeNote: 'Alice’s four moves, made by Eve with keys of her own. Bob’s padlock is public: she could lock her keys for him.',
    bobForged: 'Bob gets Eve’s packet', mine: 'the seal Bob recomputes', sealOk: 'equal to the packet’s seal',
    fooled: 'Accepted: Bob believes Alice is asking him for the code.',
    who: 'The HMAC proves “someone with the key”',
    whoThen: 'A key agreed beforehand', whoThenText: 'Only Alice and Bob have it: a valid seal means “Alice” (or Bob).',
    whoNow: 'A key drawn by the sender', whoNowText: 'It travels in the packet, locked for Bob: whoever the sender is, their seal is valid.',
    whoNote: 'Bob’s padlock guarantees only Bob will open, not who locked. The seal proves the packet has not changed since it was sealed, not who sealed it.',
    sign: 'Alice signs the packet', signedL: 'what Alice signs: the packet, end to end', digest: 'its SHA-256 digest (32 bytes)',
    pssArrow: 'PSS: the digest and 32 random bytes of salt, laid out on 256 bytes', emL: 'the PSS block (256 bytes)',
    dArrow: 'to the power d (Alice’s private key), modulo n', sigL: 'the signature (256 bytes)',
    verify: 'Bob checks with Alice’s public key', eArrow: 'to the power e = 65537 (Alice’s public key), modulo n',
    emBack: 'the block, back', hIn: 'the digest the block carries', hMine: 'the one Bob recomputes on the packet he got',
    sigOk: 'they match: Alice signed this very packet',
    padlock: 'Bob’s padlock', padlockText: 'Anyone locks (public key), only Bob opens (private key).',
    signature: 'Alice’s signature', signatureText: 'Only Alice signs (private key), anyone checks (public key).',
    evilSig: 'Eve signs… with her key', sigEve: 'Eve’s signature, made with her private key',
    sigBad: 'no match: it was not Alice’s key that signed',
    tooBig: 'This number is even larger than Alice’s n: for her public key, it cannot be a signature at all.',
    replay: 'The same packet, twice', day1: 'day 1: Alice’s packet', day2: 'day 2: Eve’s copy (not one byte different)',
    again: 'Again:', replayNote: 'The copy is perfect: signature, seal, all of it is Alice’s. Nothing in the packet says it has passed before.',
    num: 'A number under the signature', numL: 'no. 42, on 8 bytes',
    numFirst: 'no. 42, the first time (Bob had seen 41)', numAgain: 'no. 42, a second time', numBumped: 'Eve changes 42 to 43',
    numNote: 'Bob keeps the highest number he got from Alice. A date works too: Bob refuses anything older than a few minutes, and remembers what he got during those minutes.',
    replayNum: 'The replay stopped', day1n: 'day 1: Bob had seen no. {k}', day2n: 'day 2: Bob has seen no. {k}',
    opSig: 'check Alice’s signature', opNum: 'number above {k}?', op1: 'open the keys', op2: 'check the seal', op3: 'decrypt',
    gcm: 'AES-256-GCM: one move', keyL: 'the AES key (32 bytes), just one', nonceL: 'the nonce (12 bytes), never twice with this key',
    ctrArrow: 'AES(nonce ‖ counter 2, 3…), XOR the order', gctL: 'the ciphertext ({k} bytes, the order’s length: no padding)',
    ghashArrow: 'GHASH, then XOR AES(nonce ‖ counter 1)', gtagL: 'the tag (16 bytes)',
    before: 'CBC + HMAC', beforeText: 'two keys, two algorithms, and the order of the moves to remember.',
    after: 'GCM', afterText: 'one key, one move; the tag is checked before a single byte is given back.',
    gcmEve: 'Eve changes a byte of the GCM ciphertext', ctSent: 'the ciphertext sent', ctGot: 'the ciphertext received', gtagGot: 'the packet’s tag (untouched)',
    invalidTag: 'InvalidTag: nothing given back, not one byte of the order',
    nonceNote: 'GCM’s trap: two messages under the same key and the same nonce. The XOR of the two ciphertexts is then the XOR of the two messages, and Eve can make valid tags.',
    final: 'A packet that stops all four tricks',
    finalFields: { num: 'no.', ek: 'locked key', iv: 'nonce', ct: 'GCM ciphertext', tag: 'tag', sig: 'signature' },
    finalRole: { num: 'under the signature: against replay', ek: 'one AES key, RSA-2048-OAEP: only Bob opens it', iv: 'fresh for every message',
      ct: 'AES-256-GCM: against reading', tag: 'GCM: against modifying', sig: 'Alice’s RSA-PSS over all the rest: against posing as her' },
    bobFinal: 'Bob', op1one: 'open the key', opGcm: 'decrypt with GCM (the tag first)',
    finalNote: 'One way to do it among others: Ed25519 instead of RSA-PSS, a date instead of a number, ChaCha20-Poly1305 instead of AES-GCM.',
    play: 'Your turn: Eve’s questions',
    verdict: { ok: 'accepted', reject: 'rejected, nothing decrypted', fooled: 'accepted… and it is not a new order from Alice: Eve wins' },
    sbPass: 'Eve lets Alice’s packet through', sbFlip: 'Eve changes byte 1 of the ciphertext', sbForge: 'Eve builds a packet, signed with her key',
    sbReplay: 'Eve sends the copy of no. {k} again',
    sbSig: 'Bob checks the signature', sbNum: 'Bob checks the number', sbNone: 'Bob checks the seal only',
  },

  'in.zeros8': '8 bytes of 00', 'in.digest': 'the packet’s SHA-256 digest · 32 bytes', 'in.salt': 'the salt · 32 random bytes',
  'in.h': 'H = SHA-256(8 × 00 ‖ digest ‖ salt)', 'in.bc': 'bc: the block’s end', 'in.dbZeros': '{n} bytes of 00',
  'in.one': '01: the salt follows', 'in.dbSalt': 'the salt', 'in.masked': 'masked · {n} bytes', 'in.mask': '⊕ SHA-256 of H, stretched to {n} bytes',
  'in.em': 'the PSS block · 256 bytes, read as one number', 'in.priv': 'd: Alice’s private key', 'in.signCalc': 'signature = block^d mod n',
  'in.sig': 'the signature · 256 bytes', 'in.sigGot': 'the signature received · 256 bytes', 'in.pub': 'n, e = 65537: Alice’s public key',
  'in.verCalc': 'block = signature^e mod n', 'in.unmask': '⊕ SHA-256 of H: the salt shows again',
  'in.key': 'the AES key · 32 bytes', 'in.nonce': 'the nonce · 12 bytes', 'in.ctr': 'nonce ‖ counter 2, then 3', 'in.zero': '16 bytes of 00',
  'in.ctr1': 'nonce ‖ counter 1', 'in.ks': 'the stream: AES of the counters', 'in.order': '⊕ the order · {n} bytes', 'in.ct': 'the ciphertext · {n} bytes',
  'in.nopad': 'no padding: the order’s length', 'in.hkey': 'H = AES(key, 16 × 00): GHASH’s key', 'in.s': 'GHASH of the ciphertext · 16 bytes',
  'in.ej0': '⊕ AES(nonce ‖ 1)', 'in.tag': 'the tag · 16 bytes', 'in.ctGot': 'the ciphertext received', 'in.flip': 'Eve changed the 1st byte',
  'in.mineTag': 'the tag Bob recomputes', 'in.diff': '{d} of 16 bytes differ', 'in.invalid': 'InvalidTag',
  'in.nothing': 'the order: not one byte given back',

  ch: ['The forged packet', 'The signature', 'The replay', 'AES-GCM', 'Your turn'],
  steps: {
    intro: { t: 'Eve Has More Tricks', p: "Episode 1.5's whole packet stops two of Eve's tricks:\n- she reads: all she sees is a {3|ciphertext};\n- she modifies: one byte changed, a wrong {4|seal}, and the packet is rejected without being decrypted.\n\nBut Eve has other tricks up her sleeve, and the packet of 1.5 stops neither:\n- {r|posing as Alice}, by building a whole packet in her name;\n- {r|replaying}: sending Bob, later, a real packet of Alice's, as it was.\n\nThis episode shows both tricks, then what stops them: a {b|signature}, and a number. Then AES-GCM, which encrypts and seals in one move. And at the end, you will be the one playing Eve.",
      e: 'Read, no. Modify, no. I have two tricks left.' },
    forge: { t: 'Bob’s padlock is public', p: "Bob's padlock, his public key, is no secret: Bob handed it out so that Alice could lock keys for him (episode 1.4). Eve has it too, like everyone. So, in her city, she makes exactly Alice's four moves, with draws of her own:\n- she draws an {1|AES key} and an {4|HMAC key} of hers, and an {2|IV};\n- she encrypts “I AM ALICE, GIVE ME THE CODE”: the {3|ciphertext};\n- she seals the IV and the ciphertext with her HMAC key: the {4|seal};\n- she locks her two keys with Bob's padlock.\n\nThe card shows her bytes: a packet as complete as Alice's.",
      e: 'Bob’s padlock? Everyone has it. So do I.' },
    forged: { t: 'Bob gets Eve’s packet', p: "A rider leaves Eve's city in Alice's colours and takes the road to Bob. Send him. Bob makes his three moves, the right way:\n- his private key opens the {1|keys}, since Eve locked them with his padlock;\n- the {4|seal} he recomputes with the HMAC key he just opened matches;\n- he decrypts.\n\nEverything is valid. Bob accepts the packet, and believes Alice is asking him for the code.",
      go: 'Send Eve’s rider ▶' },
    who: { t: 'The HMAC proves “someone with the key”', p: "Why is everything valid? An HMAC {4|seal} proves one thing only: whoever made it had the HMAC key. What that means depends on who draws the key:\n- when Alice and Bob share a key nobody else has, it means “Alice”;\n- here the HMAC key travels in the packet, and the sender draws it: Eve drew her own. Her seal proves “someone who had this key”, that is, {r|Eve}.\n\nBob's padlock says nothing about the sender either: it guarantees only Bob will open, not who locked. Nothing in episode 1.5's packet says who wrote it.",
      b: 'Keys, seal, all good… and nothing tells me who wrote it.' },
    sign: { t: 'Alice signs the packet', p: "Alice needs something only she can do, and anyone can check: a {b|signature}. Alice has her own RSA-2048 key pair, separate from Bob's: a private key, which she keeps, and a public key, which Bob received the way Alice received his padlock. To sign:\n- she computes the packet's SHA-256 digest, 32 bytes;\n- the PSS scheme lays it out on 256 bytes, mixing in 32 random bytes, the salt;\n- she raises that block to the power of her private key, modulo n, the way Bob opens his padlock.\n\nOut come 256 bytes: the {b|signature}, added to the packet. Change a single byte of the packet and the digest changes; and without Alice's private key, nobody can make the signature that goes with it.",
      a: 'My private key signs. Nobody else has it.' },
    verify: { t: 'Bob checks with Alice’s public key', p: "Bob gets the packet. Before he even opens the keys, he checks the {b|signature}:\n- he raises it to the power of Alice's public key, modulo n, and gets back the PSS block Alice laid out;\n- he recomputes the SHA-256 digest of the packet he got: it must match the one the block carries.\n\nThis is RSA the other way round from the padlock:\n- Bob's padlock, anyone locks and only he opens;\n- Alice's signature, only she makes and anyone checks.\n\nRSA-PSS is not the only signature: Ed25519, on an elliptic curve, does the same job with a 32-byte public key and a 64-byte signature.",
      b: 'Alice’s public key confirms it: it is her.' },
    evilSig: { t: 'Eve signs too… with her key', p: "Eve tries again. She builds her packet, and signs it: she too has an RSA key pair, and her signature is a real RSA-PSS signature. But it is {r|hers}. Send her rider. Bob checks with Alice's public key:\n- the block that comes out does not have the PSS shape;\n- the digest it carries is not the packet's.\n\n{r|Rejected}, before the keys are even opened. To succeed, Eve would need Alice's private key.",
      go: 'Send Eve’s rider ▶' },
    replay: { t: 'The replay', p: "Eve can no longer build a packet of Alice's. But she can keep a copy of a real one. Send the two riders.\n\nThe first is Alice's: “ATTACK AT 6AM TOMORROW”, signed. Eve stops it, changes nothing, since it would all show, and keeps a copy, byte for byte. Bob checks the signature, opens the keys, checks the seal, reads.\n\nThe next day, Eve sends {r|the copy}. The signature is Alice's, the seal is good: Bob reads “attack at 6am tomorrow” again, a day too late, and attacks alone.",
      go: 'Send, then replay ▶' },
    num: { t: 'A number under the signature', p: "A copy is perfect by nature: nothing in it tells it from the original. What stops it is Bob's memory:\n- Alice numbers her packets: no. 41 yesterday, no. 42 today. The number travels at the head of the packet, and goes under the {b|signature} with the rest;\n- Bob keeps the highest number he got from Alice, and refuses any packet whose number is not higher.\n\nEve tries twice:\n- she sends no. 42 again: not above 42, {r|rejected};\n- she changes 42 to 43: the signature no longer matches, {r|rejected}.\n\nA date would do too: Bob refuses anything older than a few minutes, and remembers what he got during those minutes.",
      a: 'No. 42, under my signature: Eve cannot change it.' },
    replayNum: { t: 'The replay stopped', p: "Let us play the scene again, with the number. Send the two riders:\n- Alice sends no. 42; Bob checks the signature, sees 42 is above 41, the last one he got, reads the order and remembers 42;\n- the next day, Eve sends her copy. The signature is still good, but no. 42 is not above 42: {r|rejected}, with nothing opened.",
      go: 'Send, then replay ▶' },
    gcm: { t: 'AES-GCM: encrypt and seal in one move', p: "The packet encrypts with AES-CBC, then seals with HMAC: two algorithms, two keys, and an order of moves to remember. AES-GCM (Galois/Counter Mode) does both in one move, which is called authenticated encryption:\n- it takes a single {1|key}, and a 12-byte {2|nonce}: a number that must never be used twice with the same key;\n- AES encrypts the nonce followed by a counter, 2, 3, 4…, and the result is mixed (XOR) into the order: no padding, the {3|ciphertext} is as long as the order;\n- a function, GHASH, folds the ciphertext into a 16-byte label, the {4|tag}, which plays the seal's part.\n\nThe card shows the same order, encrypted with AES-256-GCM under the saga's AES key.",
      a: 'One key, one nonce, one move: encrypted and sealed.' },
    gcmEve: { t: 'GCM checks before it gives anything back', p: "Eve changes the first byte of the GCM {3|ciphertext}. Bob decrypts, with AESGCM in Python: before giving anything back, the function recomputes the {4|tag}; it no longer matches, and it raises an error, {r|InvalidTag}, without giving back a single byte of the order. The rule “check, then decrypt” is in the algorithm itself: impossible to forget.\n\nGCM's trap is the {2|nonce}. Two messages encrypted under the same key and the same nonce are mixed with the same stream:\n- the XOR of the two ciphertexts gives the XOR of the two messages;\n- Eve can even compute valid tags.\n\nA fresh nonce for every message, like the IV.",
      b: 'One byte changed: InvalidTag. I read nothing.' },
    final: { t: 'A packet that stops all four tricks', p: "Put end to end, here is one way to stop it all:\n- the number;\n- a single {1|AES key}, locked with Bob's padlock;\n- the {2|nonce};\n- the order, {3|encrypted} and {4|sealed} with AES-256-GCM;\n- and Alice's {b|signature} over all of it.\n\nBob checks the signature and the number, opens the key, decrypts, and GCM checks the tag before giving the order back. Eve does not read (AES), does not modify (the tag, and the signature), does not pose as Alice (the signature), does not replay (the number).\n\nThe card shows this packet with its real bytes. It is not the only way: every brick has its variant.",
      a: 'Read, modify, pose, replay: four tricks, and what stops them.' },
    end: { t: 'Your turn to play Eve', p: "In the attack-defense workshop, you play Eve, against another pair's messenger. The card gives the questions to ask of their code, trick by trick: every answer that opens a door is a weakness to write down on your sheet. In the sandbox, choose Eve's trick and Bob's defenses, and watch what gets through. The base packet has its own episode, in detail: episode 1.5 for the whole packet, episode 1.3 for the seal, episode 1.4 for the padlock.",
      doors: { sandbox: ['Sandbox', 'Eve’s trick against Bob’s defenses: what gets through'], quiz: ['Quiz', 'Seven questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 2 · Bob’s Padlock ▶', 'Anyone can snap the padlock shut, only Bob can open it'] } },
  },

  'sb.title': 'Sandbox',
  'sb.hint': "Write an order, choose Eve's trick and Bob's defenses, and watch what he accepts.",
  'sb.order': "Alice's order", 'sb.eve': 'Eve', 'sb.bob': 'Bob, besides the seal',
  'sb.pass': 'lets Alice’s packet through', 'sb.flip': 'changes a byte of the ciphertext',
  'sb.forge': 'builds her own packet', 'sb.replay': 'sends a copy of Alice’s last packet again',
  'sb.sig': 'checks Alice’s signature', 'sb.num': 'refuses a number already seen',
  'sb.send': 'Send the messenger ▶',
  'sb.stats': 'Sent <b>{sent}</b> · accepted <b>{ok}</b> · rejected <b>{rejected}</b> · Eve wins <b>{eve}</b>',
  'sb.empty': 'Write an order first.',
  'sb.noCopy': 'Alice has sent nothing yet: Eve has nothing to copy.',

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
