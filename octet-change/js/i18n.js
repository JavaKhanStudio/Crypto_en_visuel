// Every visible word of episode 1.3 « L'octet changé », in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.

const fr = {
  series: 'Crypto en visuel',
  tab: "L'octet changé — Crypto en visuel",
  title: "L'octet changé",
  subtitle: "Eve change un octet du paquet. Alice le scelle d'un HMAC-SHA256.",
  loading: 'Construction des châteaux…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chroniqueur' },

  // what Eve and Bob say when a rider passes
  'm.pass': 'Je lis… {h} … Rien. Tu peux repartir.',
  'm.flip': "{o} octet de l'IV : {a} ⊕ 0f = {b}. Repars, cavalier.",
  'm.flipCt': '{o} octet du chiffré : {a} ⊕ 0f = {b}. Repars, cavalier.',
  'm.forge': 'Mon cavalier, aux couleurs d’Alice, et un paquet bien scellé… avec mes clés.',
  'm.bobRead': 'Sceau vérifié, je déchiffre : « {m} ».',
  'm.bobNoCheck': 'Je déchiffre : « {m} ». Bien reçu.',
  'm.bobPad': 'Je déchiffre… le padding est faux : erreur.',
  'm.bobReject': 'Sceau invalide : paquet rejeté. Je ne déchiffre rien.',
  'm.alone': 'À 6h, Alice attaque. Bob attend 9h : Alice est seule.',
  'm.busy': 'Un messager est déjà en route.',

  // the corner card
  card: {
    sent: 'Ce qui voyage : IV + chiffré', order: "L'ordre d'Alice", sentNote: 'Eve ne peut pas lire ces octets. Elle peut les changer.',
    iv: 'IV (16 octets, en clair)', flip: "Eve change le {o} octet de l'IV", before: 'avant', after: 'après',
    flipNote: "P1 = AES⁻¹(C1) ⊕ IV : l'octet changé de l'IV change le même octet de P1. {a} ⊕ 0f = {b}.",
    bobGets: 'Ce que Bob déchiffre', ctFlip: 'Eve change le {o} octet du chiffré',
    ctNote: 'Le bloc touché devient du bruit ; le même octet du bloc suivant change.',
    padBad: 'padding faux : erreur', padOk: 'padding bon : aucune erreur',
    macKey: 'La clé HMAC (32 octets)', macKeyNote: 'Une deuxième clé, qui ne sert qu’à sceller. Alice et Bob l’ont, Eve non.',
    hmac: 'Le sceau : HMAC-SHA256', hmacIn: 'IV ‖ chiffré ({n} octets)', withMac: 'avec la clé HMAC', tag: 'sceau (32 octets)',
    avalanche: 'Un octet changé, un autre sceau', sealA: "sceau d'Alice", sealB: 'sceau recalculé par Bob',
    diff: '{d} octets sur 32 diffèrent.',
    order2: "L'ordre de Bob, à l'arrivée", ops: ['Recalculer le sceau sur IV ‖ chiffré, avec la clé HMAC', 'Comparer avec le sceau reçu, en temps constant', 'Seulement s’il est bon : déchiffrer, retirer le padding'],
    opsNote: 'Un sceau faux : le paquet est rejeté sans avoir été déchiffré.',
    compare: 'Comparer les 32 octets', compareNote: 'Premier octet qui diffère : le {o}. Bob compare quand même les 32, et répond après.',
    compareSame: 'Les 32 octets sont égaux.',
    packet: 'Le paquet du projet', later: 'épisode {n}',
    bricks: { k: 'clés (RSA-OAEP)', iv: 'IV', ct: 'chiffré AES-256-CBC', mac: 'HMAC-SHA256' },
    forged: "Le paquet d'Eve", forgedNote: 'Chiffré et scellé avec ses clés à elle : Bob recalcule avec la sienne.',
    verdict: { ok: 'accepté', reject: 'rejeté, non déchiffré', wrong: 'accepté, mais changé !', pad: 'erreur de padding' },
    eveDid: { none: 'Eve ne touche à rien', iv: "Eve change le {o} octet de l'IV", ct: "Eve change le {o} octet du chiffré", forge: 'Eve envoie son propre cavalier' },
  },

  // story
  ch: ['Eve écrit', 'Le sceau', 'Vérifier d’abord', 'Le paquet'],
  steps: {
    intro: { t: 'Eve ne sait plus lire', p: "Dans l'épisode 1.2, Alice s'est mise à chiffrer ses ordres en AES-256-CBC. Les gardes d'Eve arrêtent toujours le messager sous ses murs, mais Eve ne lit plus que des octets qui ont l'air tirés au hasard. Elle n'a pas dit son dernier mot : le parchemin est entre ses mains. Elle ne peut pas le lire, mais elle peut écrire dessus.",
      e: 'Je ne sais plus lire. Mais personne ne m’empêche d’écrire.' },
    flip: { t: "Un octet de l'IV", p: "Aujourd'hui, l'ordre d'Alice est « ATTAQUE A 6H DEMAIN ». Eve ne peut pas le lire, mais elle connaît la forme des ordres d'Alice, pour en avoir lu en clair : l'heure est le 11e octet. Or Bob déchiffre le premier bloc ainsi : P1 = AES⁻¹(C1) ⊕ IV, où AES⁻¹ est le déchiffrement d'un bloc avec la clé, et ⊕ le XOR, qui inverse chaque bit là où l'autre octet a un 1. Chaque octet de l'IV tombe donc sur l'octet de même rang de l'ordre. Eve fait un XOR avec 0f sur le 11e octet de l'IV : elle inverse ses 4 derniers bits, et le 11e octet de l'ordre change de la même façon. « 6 » (36 en hexadécimal) devient « 9 » (39).",
      e: 'Le 11e octet de l’IV, XOR 0f. Je ne sais pas ce qu’il dit, mais je sais ce qu’il deviendra.' },
    ride: { t: 'Bob lit « 9H »', p: "Lancez le messager. Eve l'arrête, change l'octet de l'IV, et le laisse repartir. Bob déchiffre avec la bonne clé : le padding est bon, le texte est lisible, rien ne cloche. Il lit « ATTAQUE A 9H DEMAIN ». Demain à 6h, Alice attaquera seule, et Eve n'a jamais eu besoin de la clé.",
      go: 'Envoyer le messager ▶' },
    why: { t: 'Chiffrer n’est pas sceller', p: "Le chiffrement cache l'ordre, il ne le protège pas. AES-CBC déchiffre n'importe quels octets et rend toujours quelque chose : rien dans le chiffré ne dit à Bob s'il est arrivé tel qu'Alice l'a écrit. Changer un octet du chiffré marche aussi : le bloc touché devient du bruit, et l'octet de même rang du bloc suivant change (la carte le montre, sur le 1er octet de C1). Ce qui manque, c'est l'intégrité : que Bob voie si un seul octet a changé en route.",
      n: 'Eve ne lit pas l’ordre, mais elle le réécrit. Bob doit pouvoir le voir.' },
    key: { t: 'Une deuxième clé', p: "Alice et Bob partagent une deuxième clé secrète, elle aussi de 32 octets tirés au hasard, qui ne sert qu'à sceller : la clé HMAC. Pourquoi pas la clé AES ? Une clé, un usage : chaque clé ne fait qu'un travail, et une faiblesse dans l'un ne s'étend pas à l'autre. Comme la clé AES, elle doit arriver chez Bob sans passer par Eve : c'est l'épisode 1.4. Pour l'instant, ils l'ont tous les deux, et Eve ne l'a pas.",
      a: 'Deux clés : l’une chiffre, l’autre scelle. Eve n’a ni l’une ni l’autre.' },
    hmac: { t: 'Le sceau : HMAC-SHA256', p: "SHA-256 est une fonction de hachage : elle prend autant d'octets qu'on veut et rend une empreinte de 32 octets. Le même message donne toujours la même empreinte ; un seul octet changé en donne une sans rapport. HMAC fait entrer une clé dans le calcul (deux passes de SHA-256, la clé dans chacune) : sans la clé, impossible de calculer la bonne empreinte d'un message. Alice calcule HMAC-SHA256 avec la clé HMAC sur l'IV et le chiffré mis bout à bout (on l'écrit IV ‖ chiffré). Ces 32 octets, le sceau, voyagent avec le paquet.",
      a: 'L’IV et le chiffré, bout à bout, et ma clé HMAC : 32 octets de sceau.' },
    avalanche: { t: 'Un octet changé, un autre sceau', p: "À l'arrivée, Bob refait le calcul avec sa clé HMAC, sur l'IV et le chiffré qu'il a reçus, et compare avec le sceau du paquet. Si Eve a changé le 11e octet de l'IV, le sceau que Bob calcule n'a plus rien à voir avec celui d'Alice : la carte compare les deux, octet par octet. Eve pourrait-elle refaire le sceau de son paquet changé ? Il lui faudrait la clé HMAC.",
      b: 'Mon sceau et celui du paquet ne se ressemblent en rien. Quelqu’un a touché au paquet.' },
    sealed: { t: 'Le sceau à la porte de Bob', p: "Même ordre, même octet changé, mais cette fois le paquet porte son sceau. Lancez le messager : Eve change l'octet de l'IV comme avant, sans pouvoir refaire le sceau. À sa porte, Bob recalcule le sceau, voit qu'il ne correspond pas, et rejette le paquet sans le déchiffrer. Il ne lira pas « 9H » : il sait qu'il n'a pas reçu d'ordre valable, et attend qu'Alice en renvoie un.",
      go: 'Envoyer le paquet scellé ▶' },
    forged: { t: 'Le faux cavalier', p: "Eve essaie autre chose : un de ses cavaliers, aux couleurs d'Alice, porte un paquet qu'elle a fabriqué en entier. « ATTAQUE A MINUIT », chiffré et scellé, mais avec des clés à elle : elle n'a pas celles d'Alice. Lancez son cavalier. Bob recalcule le sceau avec sa clé HMAC, qui n'est pas celle d'Eve, et rejette le paquet.",
      go: 'Envoyer le faux cavalier ▶' },
    first: { t: 'Vérifier avant de déchiffrer', p: "Bob vérifie le sceau d'abord, et ne déchiffre que les paquets dont le sceau est bon. Dans l'autre ordre, il déchiffrerait les paquets retouchés d'Eve, et ses réponses la renseigneraient : un padding faux donne une erreur, un padding bon n'en donne pas. Envoyer à Bob des milliers de paquets retouchés, en notant à chaque fois s'il se plaint du padding, suffit à retrouver l'ordre octet par octet, sans la clé : c'est l'attaque par oracle de padding. Un paquet dont le sceau ne va pas est rejeté sans avoir été déchiffré.",
      b: 'D’abord le sceau. Je ne déchiffre que ce qu’Alice a scellé.' },
    compare: { t: 'Comparer en temps constant', p: "Reste la comparaison elle-même. Un Bob pressé comparerait les deux sceaux octet par octet et s'arrêterait au premier qui diffère : il refuserait un peu plus vite un sceau faux dès le 1er octet qu'un sceau faux au 10e. En chronométrant ses refus, Eve trouverait le bon sceau d'un paquet changé, octet par octet. Alors Bob compare toujours les 32 octets jusqu'au bout, et ne répond qu'après : en Python, hmac.compare_digest. L'épisode 8, le garde trop pressé, montre cette attaque en détail.",
      b: 'Les 32 octets, tous, à chaque fois. Ma réponse prend toujours le même temps.' },
    packet: { t: "Le paquet, jusqu'ici", p: "Ce qui voyage maintenant : l'IV (16 octets), le chiffré, et le sceau HMAC de l'IV et du chiffré (32 octets). Une brique manque : les deux clés, AES et HMAC, doivent arriver chez Bob sans qu'Eve les lise, c'est l'épisode 1.4. Et le sceau ne prouve que deux choses : le paquet vient de quelqu'un qui a la clé HMAC, et il n'a pas changé. Un vrai paquet d'Alice, gardé par Eve et renvoyé le lendemain, passerait encore : c'est l'un des tours de l'épisode 1.6.",
      e: 'Plus moyen de changer un octet. Mais un vrai paquet, je peux le garder, et le renvoyer plus tard.' },
    end: { t: 'À vous', p: "Dans le bac à sable, écrivez votre ordre, choisissez ce que fait Eve (rien, un octet de l'IV, un octet du chiffré, ou son propre cavalier) et si Bob vérifie le sceau : la carte montre ce que Bob déchiffre, ou pourquoi il refuse. L'épisode 8, le garde trop pressé, montre l'attaque au chronomètre sur une comparaison pressée ; l'épisode 6, le pingouin, montre de près un bit retourné dans un chiffré CBC.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz', link: ['Épisode 8 : le garde ▶', 'Épisode 6 : le pingouin ▶'] },
  },

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': "Écrivez un ordre, choisissez ce que fait Eve et si Bob vérifie le sceau, et regardez ce que Bob lit.",
  'sb.order': "L'ordre", 'sb.eve': 'Eve',
  'sb.none': 'ne touche à rien', 'sb.iv': "change un octet de l'IV", 'sb.ct': 'change un octet du chiffré', 'sb.forge': 'envoie son propre cavalier',
  'sb.byte': 'Octet n°', 'sb.check': 'Bob vérifie le sceau avant de déchiffrer',
  'sb.send': 'Envoyer le messager ▶',
  'sb.stats': 'Envoyés <b>{sent}</b> · changés par Eve <b>{hit}</b> · acceptés changés <b>{fooled}</b> · rejetés <b>{rejected}</b>',
  'sb.empty': 'Écrivez un ordre d’abord.',

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'The Changed Byte — Crypto, Visualized',
  title: 'The Changed Byte',
  subtitle: 'Eve changes one byte of the packet. Alice seals it with HMAC-SHA256.',
  loading: 'Building the castles…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chronicler' },

  'm.pass': 'I read… {h} … Nothing. You may go on.',
  'm.flip': 'Byte {n} of the IV: {a} ⊕ 0f = {b}. Ride on, rider.',
  'm.flipCt': 'Byte {n} of the ciphertext: {a} ⊕ 0f = {b}. Ride on, rider.',
  'm.forge': 'My rider, in Alice’s colours, with a well-sealed packet… sealed with my keys.',
  'm.bobRead': 'Seal checked, I decrypt: “{m}”.',
  'm.bobNoCheck': 'I decrypt: “{m}”. Received.',
  'm.bobPad': 'I decrypt… the padding is wrong: error.',
  'm.bobReject': 'Invalid seal: packet rejected. I decrypt nothing.',
  'm.alone': 'At 6 am, Alice attacks. Bob waits for 9: Alice is alone.',
  'm.busy': 'A messenger is already on the road.',

  card: {
    sent: 'What travels: IV + ciphertext', order: "Alice's order", sentNote: 'Eve cannot read these bytes. She can change them.',
    iv: 'IV (16 bytes, in the clear)', flip: 'Eve changes byte {n} of the IV', before: 'before', after: 'after',
    flipNote: 'P1 = AES⁻¹(C1) ⊕ IV: the changed byte of the IV changes the same byte of P1. {a} ⊕ 0f = {b}.',
    bobGets: 'What Bob decrypts', ctFlip: 'Eve changes byte {n} of the ciphertext',
    ctNote: 'The block she touched turns to noise; the same byte of the next block changes.',
    padBad: 'wrong padding: error', padOk: 'padding fine: no error',
    macKey: 'The HMAC key (32 bytes)', macKeyNote: 'A second key, used only to seal. Alice and Bob have it, Eve does not.',
    hmac: 'The seal: HMAC-SHA256', hmacIn: 'IV ‖ ciphertext ({n} bytes)', withMac: 'with the HMAC key', tag: 'seal (32 bytes)',
    avalanche: 'One byte changed, another seal', sealA: "Alice's seal", sealB: 'seal recomputed by Bob',
    diff: '{d} bytes out of 32 differ.',
    order2: "Bob's order of work, on arrival", ops: ['Recompute the seal over IV ‖ ciphertext, with the HMAC key', 'Compare it with the seal received, in constant time', 'Only if it matches: decrypt, strip the padding'],
    opsNote: 'A wrong seal: the packet is rejected without being decrypted.',
    compare: 'Comparing the 32 bytes', compareNote: 'First byte that differs: byte {i}. Bob still compares all 32, and answers after.',
    compareSame: 'All 32 bytes are equal.',
    packet: "The project's packet", later: 'episode {n}',
    bricks: { k: 'keys (RSA-OAEP)', iv: 'IV', ct: 'AES-256-CBC ciphertext', mac: 'HMAC-SHA256' },
    forged: "Eve's packet", forgedNote: 'Encrypted and sealed with her own keys: Bob recomputes with his.',
    verdict: { ok: 'accepted', reject: 'rejected, not decrypted', wrong: 'accepted, but changed!', pad: 'padding error' },
    eveDid: { none: 'Eve touches nothing', iv: 'Eve changes byte {n} of the IV', ct: 'Eve changes byte {n} of the ciphertext', forge: 'Eve sends her own rider' },
  },

  ch: ['Eve writes', 'The seal', 'Check first', 'The packet'],
  steps: {
    intro: { t: 'Eve cannot read any more', p: 'In episode 1.2, Alice started encrypting her orders with AES-256-CBC. Eve\'s guards still stop the messenger under her walls, but Eve only reads bytes that look drawn at random. She has not given up: the scroll is in her hands. She cannot read it, but she can write on it.',
      e: 'I cannot read any more. But nobody stops me from writing.' },
    flip: { t: 'One byte of the IV', p: 'Today, Alice\'s order is “ATTACK AT 6AM TOMORROW”. Eve cannot read it, but she knows the shape of Alice\'s orders, from reading some in the clear: the hour is byte 11. And Bob decrypts the first block this way: P1 = AES⁻¹(C1) ⊕ IV, where AES⁻¹ is the decryption of one block with the key, and ⊕ is XOR, which flips each bit where the other byte has a 1. So each byte of the IV lands on the byte of the order in the same place. Eve XORs byte 11 of the IV with 0f: she flips its last 4 bits, and byte 11 of the order changes the same way. “6” (36 in hexadecimal) becomes “9” (39).',
      e: 'Byte 11 of the IV, XOR 0f. I do not know what it says, but I know what it will become.' },
    ride: { t: 'Bob reads “9AM”', p: 'Launch the messenger. Eve stops him, changes the byte of the IV, and lets him go on. Bob decrypts with the right key: the padding is fine, the text is readable, nothing looks wrong. He reads “ATTACK AT 9AM TOMORROW”. Tomorrow at 6, Alice will attack alone, and Eve never needed the key.',
      go: 'Send the messenger ▶' },
    why: { t: 'Encrypting is not sealing', p: 'Encryption hides the order, it does not protect it. AES-CBC decrypts any bytes at all and always gives something back: nothing in the ciphertext tells Bob whether it arrived as Alice wrote it. Changing a byte of the ciphertext works too: the block she touched turns to noise, and the byte in the same place of the next block changes (the card shows it, on byte 1 of C1). What is missing is integrity: for Bob to see whether a single byte changed on the way.',
      n: 'Eve does not read the order, but she rewrites it. Bob must be able to see that.' },
    key: { t: 'A second key', p: 'Alice and Bob share a second secret key, also 32 bytes drawn at random, used only to seal: the HMAC key. Why not the AES key? One key, one job: each key does a single thing, and a weakness in one job does not spread to the other. Like the AES key, it must reach Bob without passing Eve: that is episode 1.4. For now, they both have it, and Eve does not.',
      a: 'Two keys: one encrypts, the other seals. Eve has neither.' },
    hmac: { t: 'The seal: HMAC-SHA256', p: 'SHA-256 is a hash function: it takes as many bytes as you like and gives back a 32-byte fingerprint. The same message always gives the same fingerprint; a single changed byte gives an unrelated one. HMAC brings a key into the computation (two passes of SHA-256, the key in each): without the key, nobody can compute the right fingerprint of a message. Alice computes HMAC-SHA256 with the HMAC key over the IV and the ciphertext laid end to end (written IV ‖ ciphertext). These 32 bytes, the seal, travel with the packet.',
      a: 'The IV and the ciphertext, end to end, and my HMAC key: 32 bytes of seal.' },
    avalanche: { t: 'One byte changed, another seal', p: 'On arrival, Bob redoes the computation with his HMAC key, over the IV and the ciphertext he received, and compares it with the seal in the packet. If Eve changed byte 11 of the IV, the seal Bob computes has nothing to do with Alice\'s: the card compares them, byte by byte. Could Eve redo the seal of her changed packet? She would need the HMAC key.',
      b: 'My seal and the packet\'s look nothing alike. Someone has touched the packet.' },
    sealed: { t: 'The seal at Bob\'s gate', p: 'Same order, same changed byte, but this time the packet carries its seal. Launch the messenger: Eve changes the byte of the IV as before, with no way to redo the seal. At his gate, Bob recomputes the seal, sees it does not match, and rejects the packet without decrypting it. He will not read “9AM”: he knows he has received no valid order, and waits for Alice to send one again.',
      go: 'Send the sealed packet ▶' },
    forged: { t: 'The forged rider', p: 'Eve tries something else: one of her riders, in Alice\'s colours, carries a packet she made from scratch. “ATTACK AT MIDNIGHT”, encrypted and sealed, but with keys of her own: she does not have Alice\'s. Launch her rider. Bob recomputes the seal with his HMAC key, which is not Eve\'s, and rejects the packet.',
      go: 'Send the forged rider ▶' },
    first: { t: 'Check before decrypting', p: 'Bob checks the seal first, and only decrypts packets whose seal is right. The other way round, he would decrypt Eve\'s doctored packets, and his answers would tell her things: a wrong padding gives an error, a right one does not. Sending Bob thousands of doctored packets, noting each time whether he complains about the padding, is enough to recover the order byte by byte, without the key: that is the padding oracle attack. A packet whose seal is wrong is rejected without ever being decrypted.',
      b: 'The seal first. I only decrypt what Alice sealed.' },
    compare: { t: 'Comparing in constant time', p: 'One thing is left: the comparison itself. A Bob in a hurry would compare the two seals byte by byte and stop at the first one that differs: he would refuse a seal wrong at byte 1 a little faster than one wrong at byte 10. By timing his refusals, Eve would find the right seal of a changed packet, byte by byte. So Bob always compares all 32 bytes to the end, and answers only then: in Python, hmac.compare_digest. Episode 8, the guard in a hurry, shows this attack in detail.',
      b: 'All 32 bytes, every time. My answer always takes the same time.' },
    packet: { t: 'The packet, so far', p: 'What travels now: the IV (16 bytes), the ciphertext, and the HMAC seal of the IV and the ciphertext (32 bytes). One brick is missing: both keys, AES and HMAC, must reach Bob without Eve reading them, that is episode 1.4. And the seal proves only two things: the packet comes from someone holding the HMAC key, and it has not changed. A real packet from Alice, kept by Eve and sent again the next day, would still pass: that is one of the tricks of episode 1.6.',
      e: 'No more changing a byte. But a real packet, I can keep, and send again later.' },
    end: { t: 'Your turn', p: 'In the sandbox, write your order, choose what Eve does (nothing, a byte of the IV, a byte of the ciphertext, or her own rider) and whether Bob checks the seal: the card shows what Bob decrypts, or why he refuses. Episode 8, the guard in a hurry, shows the stopwatch attack on a hasty comparison; episode 6, the penguin, shows a flipped bit in a CBC ciphertext up close.',
      go: 'Try the sandbox', go2: 'Take the quiz', link: ['Episode 8: the guard ▶', 'Episode 6: the penguin ▶'] },
  },

  'sb.title': 'Sandbox',
  'sb.hint': 'Write an order, choose what Eve does and whether Bob checks the seal, and watch what Bob reads.',
  'sb.order': 'The order', 'sb.eve': 'Eve',
  'sb.none': 'touches nothing', 'sb.iv': 'changes a byte of the IV', 'sb.ct': 'changes a byte of the ciphertext', 'sb.forge': 'sends her own rider',
  'sb.byte': 'Byte no.', 'sb.check': 'Bob checks the seal before decrypting',
  'sb.send': 'Send the messenger ▶',
  'sb.stats': 'Sent <b>{sent}</b> · changed by Eve <b>{hit}</b> · accepted changed <b>{fooled}</b> · rejected <b>{rejected}</b>',
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
