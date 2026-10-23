// Every visible word of episode 1.7 « À toi de jouer », in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.
// A step's choices are steps.<id>.choices.<k> = [name, one line, the outcome told after it played];
// what Eve and Bob say during the ride is m.<step>.<k>.e / .b, with the real bytes as {vars}.

const fr = {
  series: 'Crypto en visuel',
  tab: 'À toi de jouer — Crypto en visuel',
  title: 'À toi de jouer',
  subtitle: "Faire passer l'ordre d'Alice sous les yeux d'Eve : à chaque étape, trois choix, et c'est vous qui choisissez.",
  loading: 'Construction des châteaux…',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  // the choice engine's words (lib/choices.js)
  'choices.wrong': 'Eve gagne', 'choices.right': 'Bien joué',
  'choices.continue': 'Continuer ▶', 'choices.again': 'Essayer un autre choix',

  // what Eve and Bob say when the rider passes; {c1} {c2} the first bytes of each block, {h} of a fingerprint
  m: {
    text: {
      clear: { e: '« ATTAQUE A 6H DEMAIN ». Merci, Alice : mes troupes seront prêtes à 6h.', b: 'Je lis : « ATTAQUE A 6H DEMAIN ». Reçu.' },
      ecb: { e: 'Bloc 1 : {c1}… Bloc 2 : {c2}… Les mêmes qu’hier, tous les deux. Et hier, c’était 6h.', b: 'Je déchiffre : « ATTAQUE A 6H DEMAIN ». Reçu.' },
      cbc: { e: '{c1}… {c2}… Rien de commun avec hier. Je ne sais pas ce qu’il dit.', b: 'Je déchiffre : « ATTAQUE A 6H DEMAIN ». Reçu.' },
    },
    seal: {
      none: { e: 'Le 11e octet de l’IV, XOR 0f. Je ne sais pas ce qu’il dit, mais je sais ce qu’il deviendra.', b: 'Je déchiffre : « {m} ». Reçu : j’attaque à 9h.' },
      sum: { e: 'Le 11e octet de l’IV, XOR 0f. Puis je refais leur empreinte : {h}… Pas besoin de clé.', b: 'Empreinte juste. Je déchiffre : « {m} ». J’attaque à 9h.' },
      hmac: { e: 'Le 11e octet de l’IV, XOR 0f. Le sceau, je ne peux pas le refaire : il me faudrait leur clé.', b: 'Le sceau ne correspond pas : paquet rejeté. Je ne déchiffre rien.' },
    },
    keys: {
      clear: { e: 'Clé AES : {k1}… Clé HMAC : {k2}… Je recopie les 64 octets. Merci, Alice.', b: 'Le sceau est bon. Je déchiffre : « {m} ». J’attaque à 9h.' },
      rsa: { e: '256 octets fermés : {c}… J’ai le cadenas de Bob, moi aussi, mais il ferme, il n’ouvre pas.', b: 'Ma clé privée ouvre les clés. Le sceau est bon. Je déchiffre : « {m} ».' },
      same: { e: 'Pas de clés dans ce paquet : ce sont celles d’hier, et de tous les jours d’avant. J’en garde la copie, avec les autres.', b: 'Mes clés de toujours. Le sceau est bon. Je déchiffre : « {m} ».' },
    },
    bob: {
      dec: { e: 'Le dernier octet du premier bloc chiffré, XOR 0f. Voyons ce que Bob répond.', b: 'Je déchiffre d’abord… le padding est faux ! Paquet rejeté.' },
      check: { e: 'Le dernier octet du premier bloc chiffré, XOR 0f. Voyons ce que Bob répond.', b: 'Le sceau ne correspond pas : paquet rejeté. Je ne déchiffre rien.' },
      skip: { e: 'Le 11e octet de l’IV, XOR 0f. Le sceau, je n’y touche pas : Bob ne le regarde pas.', b: 'Je déchiffre : « {m} ». J’attaque à 9h.' },
    },
    forger: {
      hmac: { e: 'Mes clés à moi, fermées au cadenas de Bob : {c}… Mon sceau : {s}… Un paquet aussi complet que ceux d’Alice.', b: 'Les clés s’ouvrent, le sceau est bon. Je déchiffre : « {m} ». J’attaque à minuit.' },
      sign: { e: 'Je signe aussi, avec ma clé à moi : une vraie signature, mais la mienne.', b: 'Cette signature n’est pas celle d’Alice : paquet rejeté. Je n’ouvre rien.' },
      two: { e: 'Deux clés HMAC ? J’en tire deux, je fais les deux sceaux, et je ferme le tout au cadenas de Bob.', b: 'Les clés s’ouvrent, les deux sceaux sont bons. Je déchiffre : « {m} ». J’attaque à minuit.' },
    },
    replay: {
      nothing: { e1: 'Je ne change rien : tout se verrait. Je garde une copie, octet pour octet.', b1: 'Signature d’Alice, sceau bon : « {m} ».',
        e: 'Le lendemain, je renvoie la copie, telle quelle.', b: 'Signature d’Alice, sceau bon : « {m} ». J’attaque à 6h.' },
      num: { e1: 'N° 42. Je ne change rien, je garde une copie.', b1: 'N° 42, plus grand que 41 : je lis « {m} », et je retiens 42.',
        e: 'Le lendemain, je renvoie la copie du n° 42.', b: 'N° 42 : pas plus grand que 42, paquet rejeté.' },
      date: { e1: 'Daté d’aujourd’hui. Je ne change rien, je garde une copie.', b1: 'Signature d’Alice, daté du jour : « {m} ».',
        e: 'Le lendemain, la copie, avec la date du jour : la date n’est pas sous la signature.', b: 'Signature bonne, daté du jour : « {m} ». J’attaque à 6h.' },
    },
  },

  // the story
  steps: {
    intro: { t: "Faire passer l'ordre", p: "Alice doit faire parvenir à Bob l'ordre « ATTAQUE A 6H DEMAIN ». La route passe sous les murs d'Eve, et la saga a montré ce qu'Eve y fait :\n- elle lit l'ordre (épisode 1.2) ;\n- elle change un octet du paquet (épisode 1.3) ;\n- elle fabrique un faux paquet, ou renvoie un vieux paquet (épisode 1.6).\n\nÀ chaque étape, c'est vous qui choisissez comment Alice se protège, parmi trois choix. Le messager part avec votre choix, et vous voyez ce qu'Eve en fait :\n- un mauvais choix, Eve gagne, et vous choisissez de nouveau ;\n- un bon choix, l'histoire continue.",
      e: 'Tout ce qui va chez Bob passe sous mes murs. Voyons ce qu’Alice a appris.' },
    text: { t: "1. Cacher l'ordre", p: "Eve arrête chaque messager sous ses murs et regarde ce qu'il porte. Hier, Alice a envoyé le même ordre, de la même façon, et Eve a vu l'armée attaquer à 6h : elle a gardé dans son carnet ce que portait le messager d'hier.\n\nAlice et Bob partagent une clé secrète de 32 octets, qu'Eve n'a pas.",
      q: "Comment Alice envoie-t-elle l'ordre ?",
      choices: {
        clear: ['En clair', "L'ordre tel quel, sur le parchemin",
          "Eve lit « ATTAQUE A 6H DEMAIN » et prépare ses troupes pour 6h. Sans chiffrement, tous ceux qui tiennent le parchemin lisent l'ordre (épisode 1.2)."],
        ecb: ['AES-ECB', 'Chaque bloc de 16 octets chiffré à part, avec la clé',
          "Eve ne sait pas lire, mais les deux blocs sont ceux d'hier : en mode ECB, le même bloc avec la même clé donne toujours le même chiffré. Eve reconnaît l'ordre d'hier, et sait qu'il veut dire 6h. Des blocs qui se répètent se voient à travers ECB : c'est le pingouin de l'épisode 6."],
        cbc: ['AES-CBC, IV neuf', "Les blocs chaînés, partant d'un IV tiré au hasard à chaque envoi",
          "Avec un {2|IV} neuf, le même ordre donne un chiffré qui n'a rien de commun avec celui d'hier : Eve ne lit rien et ne reconnaît rien. Bob, qui a la clé, déchiffre l'ordre (épisode 1.2)."],
      } },
    seal: { t: "2. Sceller l'ordre", p: "L'ordre voyage maintenant chiffré en AES-CBC avec un {2|IV} neuf : Eve ne le lit plus. Mais elle connaît la forme des ordres d'Alice : l'heure est le 11e octet.\n\nEt chaque octet de l'{2|IV} tombe, au déchiffrement, sur l'octet de même rang du premier bloc. En changeant le 11e octet de l'{2|IV}, Eve change donc l'heure que Bob lira : « 6 » devient « {r|9} » (épisode 1.3).",
      q: "Que met Alice dans le paquet, pour que Bob voie si un octet a changé ?",
      choices: {
        none: ['Rien de plus', 'Le chiffré suffit : Eve ne sait pas le lire',
          "Bob déchiffre « ATTAQUE A {r|9H} DEMAIN » : le padding est bon, le texte se lit, rien ne cloche. Demain à 6h, Alice attaquera seule. Chiffrer cache l'ordre, mais ne le protège pas (épisode 1.3)."],
        hmac: ['Un sceau HMAC', "HMAC-SHA256 de l'IV et du chiffré, avec une deuxième clé secrète",
          "Eve change l'octet, mais sans la clé HMAC, elle ne peut pas refaire le {4|sceau}. Bob recalcule le sceau, voit qu'il ne correspond pas, et rejette le paquet sans le déchiffrer : il ne lira pas « {r|9H} », et attend qu'Alice renvoie l'ordre (épisode 1.3)."],
        sum: ['Une empreinte SHA-256', "Le SHA-256 de l'IV et du chiffré, sans clé",
          "Eve change l'octet, puis refait l'empreinte : SHA-256 n'a pas de clé, tout le monde peut la calculer. Bob trouve une empreinte juste et lit « ATTAQUE A {r|9H} DEMAIN ». Une empreinte sans clé voit un octet abîmé par accident, jamais un octet changé par Eve."],
      } },
    keys: { t: '3. Faire passer les clés', p: "Jusqu'ici, Alice et Bob avaient les mêmes deux clés : une {1|clé AES}, pour chiffrer, et une {4|clé HMAC}, pour sceller. Mais ils ne se sont jamais vus, et rien n'a été convenu d'avance : les clés doivent traverser la vallée, elles aussi, sous les murs d'Eve.\n\nBob a un cadenas, une paire de clés RSA :\n- le cadenas ouvert, sa **clé publique**, il le donne à qui en veut ; Eve l'a aussi ;\n- pour l'ouvrir, il faut sa **clé privée**, que Bob est seul à avoir (épisode 1.4).",
      q: "Comment les clés d'Alice arrivent-elles chez Bob ?",
      choices: {
        clear: ['En clair', 'Le cavalier porte les deux clés telles quelles, avec le paquet',
          "Eve recopie les 64 octets des clés et laisse repartir le cavalier : une copie ne laisse pas de trace. Avec la {1|clé AES}, elle déchiffre l'ordre, écrit « ATTAQUE A {r|9H} DEMAIN » et le rechiffre ; avec la {4|clé HMAC}, elle refait le {4|sceau}. Bob trouve un sceau bon, et lit {r|9H}. Le chiffrement et le sceau ne valent que le secret de leurs clés (épisode 1.4)."],
        rsa: ['RSA-OAEP, clés neuves', 'Deux clés neuves à chaque ordre, fermées au cadenas de Bob',
          "Eve recopie les 256 octets des {1|clés fermées}, mais le cadenas de Bob ferme, il n'ouvre pas. Bob les ouvre avec sa clé privée, vérifie le {4|sceau} et déchiffre l'ordre. Et à l'ordre suivant, tout est neuf : si les clés d'un ordre fuyaient un jour, elles n'ouvriraient que cet ordre-là (épisode 1.4)."],
        same: ['Les mêmes pour toujours', 'Deux clés fermées une seule fois au cadenas de Bob, puis gardées pour tous les ordres',
          "Aujourd'hui, Eve ne lit rien. Mais elle garde la copie de chaque paquet, et tous tiennent aux deux mêmes clés. Le jour où ces clés fuient (un parchemin perdu, un garde acheté), Eve ouvre d'un coup tous les ordres d'Alice, ceux d'hier comme ceux de demain. Avec des clés neuves à chaque ordre, une clé qui fuit n'ouvre que son ordre (épisode 1.4)."],
      } },
    bob: { t: '4. Les gestes de Bob', p: "Le paquet est complet : {1|les clés} fermées au cadenas de Bob, {2|l'IV}, {3|le chiffré} et {4|le sceau}. Eve ne le lit pas, et ne sait pas refaire le sceau.\n\nMais elle peut changer des octets, envoyer le paquet à Bob, et écouter ce qu'il répond, autant de fois qu'elle veut. Bob a ouvert les clés ; il lui reste deux gestes : vérifier le {4|sceau}, et déchiffrer.",
      q: 'Que fait Bob, et dans quel ordre ?',
      choices: {
        dec: ['Déchiffrer, puis vérifier', "D'abord déchiffrer l'ordre, ensuite vérifier le sceau",
          "Bob rejette le paquet, mais il a d'abord fait travailler AES sur les octets d'Eve, et il l'a dit : « {r|padding faux} », pas « sceau faux ». Une réponse qui change selon ce qui est faux apprend quelque chose à Eve à chaque paquet : en 2002, Serge Vaudenay a montré que cela suffit à déchiffrer un message octet par octet. C'est l'attaque par oracle de padding (épisode 1.5)."],
        check: ['Vérifier, puis déchiffrer', "D'abord vérifier le sceau ; déchiffrer seulement s'il est bon",
          "Le {4|sceau} ne correspond plus : Bob rejette le paquet sans rien déchiffrer. Quoi qu'Eve change, et où qu'elle le change, Bob répond la même chose : le sceau est faux. Eve n'apprend rien (épisode 1.5)."],
        skip: ['Déchiffrer, sans vérifier', 'Le sceau est dans le paquet, mais Bob ne le vérifie pas',
          "Un sceau que personne ne vérifie ne protège rien : Eve change le 11e octet de l'{2|IV}, comme à l'étape 2, et Bob déchiffre « ATTAQUE A {r|9H} DEMAIN »."],
      } },
    forger: { t: '5. Le faux cavalier', p: "Le cadenas de Bob est public : Eve l'a, comme tout le monde. Alors, dans sa ville, elle fait les gestes d'Alice avec ses propres tirages :\n- une {1|clé AES} et une {4|clé HMAC} à elle, et un {2|IV} ;\n- l'ordre « ATTAQUE A {r|MINUIT} », chiffré, puis scellé ;\n- ses deux clés, fermées au cadenas de Bob.\n\nUn cavalier sort de sa ville aux couleurs d'Alice, et prend la route de Bob (épisode 1.6).",
      q: "Comment Bob sait-il que le paquet vient d'Alice ?",
      choices: {
        hmac: ['Le sceau HMAC suffit', "Un sceau bon, et Bob croit que le paquet vient d'Alice",
          "Bob ouvre les clés, puisqu'Eve les a fermées avec son cadenas ; le sceau, recalculé avec la clé HMAC qu'il vient d'ouvrir, est bon ; il lit « ATTAQUE A {r|MINUIT} ». Un {4|sceau} HMAC prouve « quelqu'un qui avait la clé », et c'est l'expéditeur qui tire la clé : ici, Eve (épisode 1.6)."],
        sign: ['Alice signe', "Alice signe le paquet avec sa clé privée ; Bob vérifie avec sa clé publique",
          "Eve signe aussi, mais avec sa clé à elle. Bob vérifie avec la clé publique d'Alice : la {b|signature} ne correspond pas, et le paquet est rejeté avant même d'ouvrir les clés. Seule Alice sait faire sa signature ; tout le monde sait la vérifier (épisode 1.6)."],
        two: ['Une deuxième clé HMAC', 'Deux sceaux, avec deux clés HMAC fermées au cadenas de Bob',
          "Eve tire deux clés HMAC, fait les deux sceaux, et ferme ses clés au cadenas de Bob, comme Alice. Bob trouve deux sceaux bons et lit « ATTAQUE A {r|MINUIT} ». Une clé de plus dans le paquet, c'est une clé de plus qu'Eve tire elle-même : le cadenas de Bob garantit que lui seul ouvrira, pas qui a fermé."],
      } },
    replay: { t: '6. La copie', p: "Alice signe maintenant ses paquets : Eve ne sait plus en fabriquer.\n\nMais elle peut arrêter le cavalier d'Alice, ne rien changer, puisque tout se verrait, et garder une copie du paquet, octet pour octet. Le lendemain, elle la renvoie à Bob (épisode 1.6).",
      q: 'Que met Alice dans le paquet, pour que Bob refuse la copie ?',
      choices: {
        nothing: ['Rien de plus', "La signature suffit : la copie est d'Alice",
          "La copie est parfaite : la signature est celle d'Alice, le sceau est bon. Bob lit de nouveau « ATTAQUE A 6H DEMAIN », un jour trop tard, et attaque {r|seul}. Rien, dans une copie, ne la distingue de l'original (épisode 1.6)."],
        num: ['Un numéro, sous la signature', 'Alice numérote ses paquets ; Bob retient le plus grand reçu',
          "Le paquet d'hier porte le n° 42, et Bob a retenu 42 : pas plus grand, {r|rejeté}. Eve ne peut pas écrire 43 à la place : le numéro est sous la {b|signature}, qui ne correspondrait plus. C'est la mémoire de Bob qui arrête la copie (épisode 1.6)."],
        date: ['Une date, hors de la signature', 'Alice écrit la date en tête du paquet ; la signature porte sur le reste',
          "Eve efface la date d'hier et écrit celle du jour : la date n'est pas sous la {b|signature}, qui reste bonne. Bob lit une date fraîche, accepte la copie, et attaque {r|seul}. Une date arrête une copie, mais seulement si elle est signée avec le reste (épisode 1.6)."],
      } },
    end: { t: "L'ordre est passé", p: "Alice a répondu à chacun des tours d'Eve :\n- Eve {r|ne lit pas} l'ordre : AES-CBC, avec un {2|IV} neuf ;\n- elle {r|ne change pas un octet} : le {4|sceau} HMAC, que Bob vérifie avant de déchiffrer ;\n- elle {r|ne vole pas les clés} : neuves à chaque ordre, fermées au cadenas de Bob ;\n- elle {r|ne se fait pas passer pour Alice} : la {b|signature} ;\n- elle {r|ne rejoue pas} : le numéro, sous la signature.\n\nChaque brique a son épisode : l'épisode 1.2 pour AES, l'épisode 1.3 pour le sceau, l'épisode 1.4 pour le cadenas, l'épisode 1.5 pour les gestes de Bob, l'épisode 1.6 pour la signature et le numéro.",
      b: "Un ordre d'Alice, d'aujourd'hui, que personne n'a touché. À 6h, nous attaquons ensemble.",
      doors: { saga: ['Épisode 1.1 · Les deux généraux', 'La saga depuis le début'], home: ['Tous les épisodes', 'La série Crypto en visuel'],
        next: ['Épisode 2 · Le cadenas de Bob ▶', 'Tout le monde peut fermer le cadenas, seul Bob peut l’ouvrir'] } },
  },
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'Your move — Crypto, Visualized',
  title: 'Your move',
  subtitle: "Get Alice's order past Eve: three choices at every step, and you choose.",
  loading: 'Building the castles…',
  'nav.prev': '◀ Previous', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  'choices.wrong': 'Eve wins', 'choices.right': 'Well played',
  'choices.continue': 'Continue ▶', 'choices.again': 'Try another choice',

  m: {
    text: {
      clear: { e: '“ATTACK AT 6AM TOMORROW”. Thank you, Alice: my troops will be ready at 6.', b: 'I read: “ATTACK AT 6AM TOMORROW”. Received.' },
      ecb: { e: 'Block 1: {c1}… Block 2: {c2}… Both the same as yesterday, and yesterday it meant 6am.', b: 'I decrypt: “ATTACK AT 6AM TOMORROW”. Received.' },
      cbc: { e: '{c1}… {c2}… Nothing in common with yesterday. I cannot tell what it says.', b: 'I decrypt: “ATTACK AT 6AM TOMORROW”. Received.' },
    },
    seal: {
      none: { e: 'Byte 11 of the IV, XOR 0f. I cannot tell what it says, but I know what it will become.', b: 'I decrypt: “{m}”. Received: I attack at 9.' },
      sum: { e: 'Byte 11 of the IV, XOR 0f. Then I redo their fingerprint: {h}… No key needed.', b: 'The fingerprint matches. I decrypt: “{m}”. I attack at 9.' },
      hmac: { e: 'Byte 11 of the IV, XOR 0f. The seal I cannot redo: I would need their key.', b: 'The seal does not match: packet rejected. I decrypt nothing.' },
    },
    keys: {
      clear: { e: 'AES key: {k1}… HMAC key: {k2}… I copy the 64 bytes. Thank you, Alice.', b: 'The seal is good. I decrypt: “{m}”. I attack at 9.' },
      rsa: { e: '256 locked bytes: {c}… I have Bob’s padlock too, but it locks, it does not open.', b: 'My private key opens the keys. The seal is good. I decrypt: “{m}”.' },
      same: { e: 'No keys in this packet: they are yesterday’s, and every day’s before. I keep a copy, with the others.', b: 'My keys of always. The seal is good. I decrypt: “{m}”.' },
    },
    bob: {
      dec: { e: 'The last byte of the first ciphertext block, XOR 0f. Let us hear what Bob answers.', b: 'I decrypt first… the padding is wrong! Packet rejected.' },
      check: { e: 'The last byte of the first ciphertext block, XOR 0f. Let us hear what Bob answers.', b: 'The seal does not match: packet rejected. I decrypt nothing.' },
      skip: { e: 'Byte 11 of the IV, XOR 0f. The seal I leave alone: Bob does not look at it.', b: 'I decrypt: “{m}”. I attack at 9.' },
    },
    forger: {
      hmac: { e: 'My own keys, locked with Bob’s padlock: {c}… My seal: {s}… A packet as complete as Alice’s.', b: 'The keys open, the seal is good. I decrypt: “{m}”. I attack at midnight.' },
      sign: { e: 'I sign too, with my own key: a real signature, but mine.', b: 'This signature is not Alice’s: packet rejected. I open nothing.' },
      two: { e: 'Two HMAC keys? I draw two, make both seals, and lock it all with Bob’s padlock.', b: 'The keys open, both seals are good. I decrypt: “{m}”. I attack at midnight.' },
    },
    replay: {
      nothing: { e1: 'I change nothing: it would all show. I keep a copy, byte for byte.', b1: 'Alice’s signature, the seal is good: “{m}”.',
        e: 'The next day, I send the copy again, as it is.', b: 'Alice’s signature, the seal is good: “{m}”. I attack at 6.' },
      num: { e1: 'No. 42. I change nothing, I keep a copy.', b1: 'No. 42, above 41: I read “{m}”, and I remember 42.',
        e: 'The next day, I send the copy of no. 42 again.', b: 'No. 42: not above 42, packet rejected.' },
      date: { e1: 'Dated today. I change nothing, I keep a copy.', b1: 'Alice’s signature, dated today: “{m}”.',
        e: 'The next day, the copy, with today’s date: the date is not under the signature.', b: 'The signature is good, dated today: “{m}”. I attack at 6.' },
    },
  },

  steps: {
    intro: { t: 'Get the order through', p: "Alice must get the order “ATTACK AT 6AM TOMORROW” to Bob. The road runs under Eve's walls, and the saga showed what Eve does there:\n- she reads the order (episode 1.2);\n- she changes one byte of the packet (episode 1.3);\n- she builds a fake packet, or sends an old one again (episode 1.6).\n\nAt every step, you choose how Alice protects herself, out of three choices. The messenger leaves with your choice, and you see what Eve makes of it:\n- a wrong choice, Eve wins, and you choose again;\n- a right one, the story goes on.",
      e: 'Everything going to Bob passes under my walls. Let us see what Alice has learned.' },
    text: { t: '1. Hide the order', p: "Eve stops every messenger under her walls and looks at what he carries. Yesterday Alice sent the same order, the same way, and Eve saw the army attack at 6am: she kept in her notebook what yesterday's messenger carried.\n\nAlice and Bob share a 32-byte secret key, which Eve does not have.",
      q: 'How does Alice send the order?',
      choices: {
        clear: ['In the clear', 'The order as it is, on the scroll',
          'Eve reads “ATTACK AT 6AM TOMORROW” and gets her troops ready for 6am. Without encryption, whoever holds the scroll reads the order (episode 1.2).'],
        ecb: ['AES-ECB', 'Each 16-byte block encrypted on its own, with the key',
          "Eve cannot read, but both blocks are yesterday's: in ECB mode, the same block under the same key always gives the same ciphertext. Eve recognises yesterday's order, and knows it means 6am. Blocks that repeat show through ECB: that is the penguin of episode 6."],
        cbc: ['AES-CBC, fresh IV', 'The blocks chained, starting from an IV drawn at random for every send',
          "With a fresh {2|IV}, the same order gives a ciphertext with nothing in common with yesterday's: Eve reads nothing and recognises nothing. Bob, who has the key, decrypts the order (episode 1.2)."],
      } },
    seal: { t: '2. Seal the order', p: "The order now travels encrypted with AES-CBC and a fresh {2|IV}: Eve cannot read it any more. But she knows the shape of Alice's orders: the hour is byte 11.\n\nAnd when Bob decrypts, each byte of the {2|IV} lands on the byte in the same place of the first block. So by changing byte 11 of the {2|IV}, Eve changes the hour Bob will read: “6” becomes “{r|9}” (episode 1.3).",
      q: 'What does Alice put in the packet, so Bob sees whether a byte has changed?',
      choices: {
        none: ['Nothing more', 'The ciphertext is enough: Eve cannot read it',
          'Bob decrypts “ATTACK AT {r|9AM} TOMORROW”: the padding is right, the text reads, nothing looks wrong. Tomorrow at 6, Alice will attack alone. Encryption hides the order, but does not protect it (episode 1.3).'],
        hmac: ['An HMAC seal', 'HMAC-SHA256 of the IV and the ciphertext, with a second secret key',
          "Eve changes the byte, but without the HMAC key she cannot redo the {4|seal}. Bob computes the seal again, sees it does not match, and rejects the packet without decrypting it: he will not read “{r|9AM}”, and waits for Alice to send the order again (episode 1.3)."],
        sum: ['A SHA-256 fingerprint', 'The SHA-256 of the IV and the ciphertext, with no key',
          'Eve changes the byte, then redoes the fingerprint: SHA-256 has no key, anyone can compute it. Bob finds a matching fingerprint and reads “ATTACK AT {r|9AM} TOMORROW”. A fingerprint without a key sees a byte damaged by accident, never a byte changed by Eve.'],
      } },
    keys: { t: '3. Get the keys across', p: "Until now, Alice and Bob had the same two keys: an {1|AES key}, to encrypt, and an {4|HMAC key}, to seal. But they have never met, and nothing was agreed beforehand: the keys must cross the valley too, under Eve's walls.\n\nBob has a padlock, an RSA key pair:\n- the open padlock, his **public key**, he gives to whoever wants one; Eve has one too;\n- to open it takes his **private key**, which only Bob has (episode 1.4).",
      q: "How do Alice's keys reach Bob?",
      choices: {
        clear: ['In the clear', 'The messenger carries the two keys as they are, with the packet',
          "Eve copies the 64 bytes of the keys and lets the messenger go: a copy leaves no trace. With the {1|AES key} she decrypts the order, writes “ATTACK AT {r|9AM} TOMORROW” and encrypts it again; with the {4|HMAC key} she redoes the {4|seal}. Bob finds a good seal, and reads {r|9AM}. Encryption and the seal are only worth the secrecy of their keys (episode 1.4)."],
        rsa: ['RSA-OAEP, fresh keys', "Two fresh keys for every order, locked with Bob's padlock",
          "Eve copies the 256 bytes of the {1|locked keys}, but Bob's padlock locks, it does not open. Bob opens them with his private key, checks the {4|seal} and decrypts the order. And for the next order, everything is fresh: if one order's keys ever leaked, they would open that order only (episode 1.4)."],
        same: ['The same ones forever', "Two keys locked with Bob's padlock once, then kept for every order",
          "Today Eve reads nothing. But she keeps a copy of every packet, and they all hang on the same two keys. The day those keys leak (a lost scroll, a bribed guard), Eve opens every one of Alice's orders at once, yesterday's and tomorrow's. With fresh keys for every order, a key that leaks opens its own order only (episode 1.4)."],
      } },
    bob: { t: "4. Bob's moves", p: "The packet is complete: {1|the keys} locked with Bob's padlock, {2|the IV}, {3|the ciphertext} and {4|the seal}. Eve cannot read it, and cannot redo the seal.\n\nBut she can change bytes, send the packet to Bob, and listen to what he answers, as many times as she likes. Bob has opened the keys; two moves are left: check the {4|seal}, and decrypt.",
      q: 'What does Bob do, and in which order?',
      choices: {
        dec: ['Decrypt, then check', 'First decrypt the order, then check the seal',
          "Bob rejects the packet, but he first set AES to work on Eve's bytes, and he said so: “{r|bad padding}”, not “bad seal”. An answer that changes with what is wrong teaches Eve something with every packet: in 2002, Serge Vaudenay showed this is enough to decrypt a message byte by byte. That is the padding oracle attack (episode 1.5)."],
        check: ['Check, then decrypt', 'First check the seal; decrypt only if it is good',
          "The {4|seal} no longer matches: Bob rejects the packet without decrypting anything. Whatever Eve changes, wherever she changes it, Bob gives the same answer: the seal is wrong. Eve learns nothing (episode 1.5)."],
        skip: ['Decrypt, no check', 'The seal is in the packet, but Bob does not check it',
          "A seal nobody checks protects nothing: Eve changes byte 11 of the {2|IV}, as in step 2, and Bob decrypts “ATTACK AT {r|9AM} TOMORROW”."],
      } },
    forger: { t: '5. The fake rider', p: "Bob's padlock is public: Eve has it, like everyone. So in her city she makes Alice's moves with draws of her own:\n- an {1|AES key} and an {4|HMAC key} of hers, and an {2|IV};\n- the order “ATTACK AT {r|MIDNIGHT}”, encrypted, then sealed;\n- her two keys, locked with Bob's padlock.\n\nA rider leaves her city in Alice's colours, and takes the road to Bob (episode 1.6).",
      q: 'How does Bob know the packet comes from Alice?',
      choices: {
        hmac: ['The HMAC seal is enough', 'A good seal, and Bob believes the packet is from Alice',
          "Bob opens the keys, since Eve locked them with his padlock; the seal, computed again with the HMAC key he just opened, is good; he reads “ATTACK AT {r|MIDNIGHT}”. An HMAC {4|seal} proves “someone who had the key”, and the sender draws the key: here, Eve (episode 1.6)."],
        sign: ['Alice signs', 'Alice signs the packet with her private key; Bob checks it with her public key',
          "Eve signs too, but with her own key. Bob checks with Alice's public key: the {b|signature} does not match, and the packet is rejected before the keys are even opened. Only Alice can make her signature; anyone can check it (episode 1.6)."],
        two: ['A second HMAC key', "Two seals, with two HMAC keys locked with Bob's padlock",
          "Eve draws two HMAC keys, makes both seals, and locks her keys with Bob's padlock, like Alice. Bob finds two good seals and reads “ATTACK AT {r|MIDNIGHT}”. One more key in the packet is one more key Eve draws herself: Bob's padlock guarantees that only he will open, not who locked."],
      } },
    replay: { t: '6. The copy', p: "Alice now signs her packets: Eve can no longer make one.\n\nBut she can stop Alice's rider, change nothing, since it would all show, and keep a copy of the packet, byte for byte. The next day, she sends it to Bob again (episode 1.6).",
      q: 'What does Alice put in the packet, so Bob refuses the copy?',
      choices: {
        nothing: ['Nothing more', "The signature is enough: the copy is Alice's",
          "The copy is perfect: the signature is Alice's, the seal is good. Bob reads “ATTACK AT 6AM TOMORROW” again, a day too late, and attacks {r|alone}. Nothing in a copy tells it from the original (episode 1.6)."],
        num: ['A number, under the signature', 'Alice numbers her packets; Bob remembers the highest he got',
          "Yesterday's packet bears no. 42, and Bob remembered 42: not above it, {r|rejected}. Eve cannot write 43 instead: the number is under the {b|signature}, which would no longer match. Bob's memory is what stops the copy (episode 1.6)."],
        date: ['A date, outside the signature', 'Alice writes the date at the head of the packet; the signature covers the rest',
          "Eve wipes yesterday's date and writes today's: the date is not under the {b|signature}, which stays good. Bob reads a fresh date, accepts the copy, and attacks {r|alone}. A date stops a copy, but only when it is signed with the rest (episode 1.6)."],
      } },
    end: { t: 'The order got through', p: "Alice has answered each of Eve's tricks:\n- Eve {r|does not read} the order: AES-CBC, with a fresh {2|IV};\n- she {r|does not change a byte}: the HMAC {4|seal}, which Bob checks before decrypting;\n- she {r|does not steal the keys}: fresh for every order, locked with Bob's padlock;\n- she {r|does not pass for Alice}: the {b|signature};\n- she {r|does not replay}: the number, under the signature.\n\nEach brick has its episode: episode 1.2 for AES, episode 1.3 for the seal, episode 1.4 for the padlock, episode 1.5 for Bob's moves, episode 1.6 for the signature and the number.",
      b: 'An order from Alice, from today, that nobody touched. At 6, we attack together.',
      doors: { saga: ['Episode 1.1 · The Two Generals', 'The saga from the start'], home: ['All episodes', 'The Crypto, Visualized series'],
        next: ['Episode 2 · Bob’s Padlock ▶', 'Anyone can lock the padlock, only Bob can open it'] } },
  },
};

const dicts = { fr, en };
const listeners = [];
const fromUrl = new URLSearchParams(location.search).get('lang');
export let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

export function raw(key) { return key.split('.').reduce((o, k) => o?.[k], dicts[lang]) ?? dicts[lang][key] ?? dicts.fr[key] ?? key; }
export function t(key, vars = {}) {
  const s = raw(key);
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
