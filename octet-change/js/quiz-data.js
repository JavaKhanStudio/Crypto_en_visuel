// The built-in quiz of episode 1.3. Written to review/QUIZ_GUIDE.md: each question stands on its
// own (a new scene, never the episode's own order), 5 options, the right answer is not the
// longest, positions are spread, feedback says why. `correct` is a list: more than one index
// makes it a multiple-answer question. Questions 6 and 7 come from episode 1.1's quiz (r93).
// Draft for Simon's review (tools/quiz_review.py): he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [3],
    fr: {
      q: "Une appli envoie « PAYER 100 € » chiffré en AES-CBC, sans sceau. Un attaquant qui n'a pas la clé change un octet de l'IV en route. Que lit le destinataire en déchiffrant ?",
      o: ['Une erreur, car AES refuse un IV modifié', 'Du bruit sur tout le message', 'Le message intact : l’IV n’est pas secret', "Le message, avec le même octet du premier bloc changé", 'Rien : sans le bon IV, il ne peut plus rien déchiffrer'],
      ok: "Correct! Le premier bloc se déchiffre en P1 = AES⁻¹(C1) ⊕ IV : un octet changé de l'IV change le même octet de P1, et rien d'autre. Aucune erreur ne prévient le destinataire : c'est pour cela qu'il faut un sceau.",
      ko: "Erreur. AES-CBC déchiffre n'importe quels octets sans rien signaler. Le premier bloc vaut AES⁻¹(C1) ⊕ IV : l'octet changé de l'IV tombe sur le même octet du premier bloc, le reste est intact.",
    },
    en: {
      q: 'An app sends “PAY €100” encrypted with AES-CBC, with no seal. An attacker without the key changes one byte of the IV on the way. What does the recipient read when decrypting?',
      o: ['An error, because AES refuses a modified IV', 'Noise over the whole message', 'The message intact: the IV is not secret', 'The message, with the same byte of the first block changed', 'Nothing at all: without the right IV, no block can be decrypted any more'],
      ok: 'Correct! The first block decrypts as P1 = AES⁻¹(C1) ⊕ IV: a changed byte of the IV changes the same byte of P1, and nothing else. No error warns the recipient: that is why a seal is needed.',
      ko: 'Wrong. AES-CBC decrypts any bytes without complaint. The first block is AES⁻¹(C1) ⊕ IV: the changed byte of the IV lands on the same byte of the first block, the rest is intact.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Pour vérifier qu'un fichier n'a pas été modifié en route, un développeur joint au fichier son empreinte SHA-256, sans clé. Un attaquant peut écrire sur le réseau. Pourquoi cette protection ne l'arrête-t-elle pas ?",
      o: ["Il modifie le fichier et recalcule lui-même l'empreinte", 'SHA-256 est trop court pour un fichier entier', "L'empreinte révèle le contenu du fichier", 'Deux fichiers différents ont souvent la même empreinte', "Elle l'arrête : une empreinte SHA-256 ne se falsifie pas"],
      ok: "Correct! SHA-256 n'a pas de clé : tout le monde peut la calculer, l'attaquant aussi. Il change le fichier et joint la nouvelle empreinte. Un HMAC fait entrer une clé secrète dans le calcul : sans elle, pas de sceau valide.",
      ko: "Erreur. Le problème n'est pas la solidité de SHA-256, c'est l'absence de clé : l'attaquant modifie le fichier et recalcule l'empreinte, qui correspond. Il faut un HMAC, calculé avec une clé qu'il n'a pas.",
    },
    en: {
      q: 'To check that a file was not modified on the way, a developer attaches its SHA-256 hash, with no key. An attacker can write on the network. Why does this not stop him?',
      o: ['He modifies the file and recomputes the hash himself', 'SHA-256 is too short for a whole file', 'The hash reveals the file’s content', 'Two different files often have the same hash', 'It does stop him: nobody can forge a SHA-256 hash, the attacker included'],
      ok: 'Correct! SHA-256 has no key: anyone can compute it, the attacker too. He changes the file and attaches the new hash. An HMAC brings a secret key into the computation: without it, no valid seal.',
      ko: 'Wrong. The problem is not SHA-256’s strength, it is the missing key: the attacker modifies the file and recomputes the hash, which matches. An HMAC is needed, computed with a key he does not have.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Une messagerie envoie l'IV, le chiffré AES-CBC, et un HMAC calculé sur le chiffré seul. Un attaquant change un octet de l'IV. Que se passe-t-il chez le destinataire ?",
      o: ['Le HMAC ne correspond plus, le message est rejeté', "Le déchiffrement échoue, faute d'IV valide", 'Le HMAC correspond, et le premier bloc est changé', 'Le message arrive intact, puisque le HMAC protège tout le paquet', "L'attaquant découvre la clé HMAC"],
      ok: "Correct! L'IV n'entre pas dans le HMAC : le sceau recalculé sur le chiffré correspond toujours, et le premier bloc déchiffré porte l'octet changé. C'est pourquoi le sceau couvre l'IV et le chiffré mis bout à bout.",
      ko: "Erreur. Le HMAC ne voit que ce qu'on lui donne : ici le chiffré, qui n'a pas changé. Le sceau correspond, et l'octet changé de l'IV passe dans le premier bloc. Il faut sceller IV ‖ chiffré.",
    },
    en: {
      q: 'A messaging app sends the IV, the AES-CBC ciphertext, and an HMAC computed over the ciphertext alone. An attacker changes one byte of the IV. What happens at the recipient’s?',
      o: ['The HMAC no longer matches, the message is rejected', 'Decryption fails, for lack of a valid IV', 'The HMAC matches, and the first block is changed', 'The message arrives intact, since the HMAC protects the whole packet', 'The attacker learns the HMAC key'],
      ok: 'Correct! The IV does not go into the HMAC: the seal recomputed over the ciphertext still matches, and the first decrypted block carries the changed byte. That is why the seal covers the IV and the ciphertext end to end.',
      ko: 'Wrong. The HMAC only sees what it is given: here the ciphertext, which has not changed. The seal matches, and the changed byte of the IV goes into the first block. IV ‖ ciphertext must be sealed.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Un serveur reçoit des messages chiffrés en AES-CBC et scellés d'un HMAC. Il déchiffre d'abord, répond « padding invalide » si le padding est faux, puis vérifie le HMAC. Qu'est-ce qui ne va pas ?",
      o: ["Rien : l'ordre des deux contrôles est sans importance", "Ses réponses renseignent l'attaquant sur le message", 'Le HMAC ne peut pas être vérifié après le déchiffrement', 'Déchiffrer avant de vérifier rend chaque vérification du HMAC plus lente', "Le padding invalide prouve que la clé est fausse"],
      ok: "Correct! En renvoyant des milliers de chiffrés retouchés et en notant lesquels ont un padding valide, l'attaquant retrouve le message octet par octet, sans la clé : l'attaque par oracle de padding. Vérifier le HMAC d'abord rejette ces paquets sans les déchiffrer.",
      ko: "Erreur. Le danger, c'est ce que le serveur dit : « padding invalide » ou non, pour des paquets que l'attaquant a fabriqués. Ces réponses suffisent à retrouver le message octet par octet. Le HMAC doit être vérifié avant tout déchiffrement.",
    },
    en: {
      q: 'A server receives messages encrypted with AES-CBC and sealed with an HMAC. It decrypts first, answers “invalid padding” if the padding is wrong, then checks the HMAC. What is wrong?',
      o: ['Nothing: the order of the two checks does not matter', 'Its answers tell the attacker about the message', 'The HMAC cannot be checked after decryption', 'Decrypting before checking makes every HMAC check much slower', 'An invalid padding proves the key is wrong'],
      ok: 'Correct! By sending thousands of doctored ciphertexts and noting which have a valid padding, the attacker recovers the message byte by byte, without the key: the padding oracle attack. Checking the HMAC first rejects those packets without decrypting them.',
      ko: 'Wrong. The danger is what the server says: “invalid padding” or not, for packets the attacker made. Those answers are enough to recover the message byte by byte. The HMAC must be checked before any decryption.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "En Python, un développeur vérifie un sceau avec « if recu == calcule: ». Un relecteur lui demande d'écrire « hmac.compare_digest(recu, calcule) ». Pourquoi ?",
      o: ['compare_digest est plus rapide sur 32 octets', '== ne sait pas comparer des octets', "compare_digest vérifie aussi que la clé est la bonne", '== accepte deux sceaux qui ne diffèrent que d’un seul bit, à la fin', "== s'arrête au premier octet faux, et sa durée le trahit"],
      ok: "Correct! == répond dès le premier octet différent : un sceau faux au 1er octet est refusé un peu plus vite qu'un sceau faux au 10e. En chronométrant les refus, un attaquant construit le bon sceau octet par octet. compare_digest compare tout, en temps constant.",
      ko: "Erreur. == compare juste, mais il s'arrête au premier octet qui diffère : sa durée dit où les sceaux divergent. Un attaquant qui chronomètre les refus trouve le bon sceau octet par octet. compare_digest compare tous les octets, quoi qu'il arrive.",
    },
    en: {
      q: 'In Python, a developer checks a seal with “if received == computed:”. A reviewer asks him to write “hmac.compare_digest(received, computed)”. Why?',
      o: ['compare_digest is faster on 32 bytes', '== cannot compare bytes', 'compare_digest also checks that the key is right', '== accepts two seals that differ only by a single bit, at the end', '== stops at the first wrong byte, and its timing gives it away'],
      ok: 'Correct! == answers at the first differing byte: a seal wrong at byte 1 is refused a little faster than one wrong at byte 10. By timing the refusals, an attacker builds the right seal byte by byte. compare_digest compares everything, in constant time.',
      ko: 'Wrong. == compares correctly, but stops at the first byte that differs: its timing says where the seals diverge. An attacker timing the refusals finds the right seal byte by byte. compare_digest compares every byte, whatever happens.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Deux bases militaires partagent une clé secrète convenue à l'avance et scellent chaque ordre d'un HMAC calculé avec elle. Un ennemi guette les messagers sur la route. Contre quoi le HMAC les protège-t-il ?",
      o: ['Contre la perte des ordres en chemin', "Contre un faux ordre fabriqué par l'ennemi", "Contre la lecture des ordres par l'ennemi", 'Contre le retard des messagers sur la route', "Contre un vieil ordre renvoyé plus tard par l'ennemi"],
      ok: "Correct! Sans la clé, l'ennemi ne peut pas produire un sceau valide : son faux ordre est rejeté. Le HMAC ne chiffre rien (l'ordre reste lisible), ne ramène pas un messager capturé, et un vrai ordre renvoyé plus tard passerait encore : contre le rejeu, il faut un numéro ou une date.",
      ko: "Erreur. Le HMAC prouve l'intégrité et l'origine (quelqu'un qui a la clé) : il bloque le faux ordre. Il ne chiffre pas, ne garantit pas la livraison, et seul il n'empêche pas le rejeu d'un vrai ordre capturé.",
    },
    en: {
      q: 'Two military bases share a secret key agreed in advance and seal every order with an HMAC computed with it. An enemy lies in wait for messengers on the road. What does the HMAC protect them against?',
      o: ['Orders being lost on the way', 'A fake order made by the enemy', 'The enemy reading the orders', 'Messengers being delayed on the road', 'An old order re-sent later by the enemy'],
      ok: 'Correct! Without the key, the enemy cannot produce a valid seal: the forgery is rejected. HMAC encrypts nothing (the order stays readable), does not bring back a captured messenger, and a real order re-sent later would still pass: replay needs a number or a date.',
      ko: 'Wrong. HMAC proves integrity and origin (someone holding the key): it stops the forged order. It does not encrypt, does not guarantee delivery, and on its own does not stop the replay of a real captured order.',
    },
  },
  {
    correct: [0, 3],
    fr: {
      q: "Un service de paiement envoie « débiter 50 € » à une banque, par un réseau qui peut perdre des messages et sur lequel un attaquant peut écrire. Quelles mesures répondent à un problème que ce scénario pose réellement ?",
      o: ["Renvoyer l'ordre numéroté tant qu'aucun accusé ne revient", "Chiffrer l'ordre pour qu'il arrive plus sûrement", 'Supprimer les accusés, pour gagner du temps à chaque envoi', "Sceller l'ordre d'un HMAC à clé partagée", 'Allonger la clé pour que les messages se perdent moins'],
      ok: "Correct! Deux menaces, deux réponses : la perte se traite par des renvois (numérotés, pour que la banque ignore les doublons), la falsification par un sceau HMAC. Chiffrer cacherait le montant, mais ne fait arriver aucun message et ne prouve pas l'origine.",
      ko: "Erreur. La perte ne se règle pas par la cryptographie (chiffrer ou allonger la clé ne fait rien arriver) : elle se règle par des renvois numérotés. La falsification se règle par un HMAC. Supprimer les accusés retire le seul moyen de savoir qu'il faut renvoyer.",
    },
    en: {
      q: 'A payment service sends “debit €50” to a bank over a network that can lose messages and that an attacker can write to. Which measures answer a problem this scenario really raises?',
      o: ['Resend the numbered order until an ack comes back', 'Encrypt the order so that it is more likely to arrive', 'Drop acknowledgements to go faster', 'Seal the order with a shared-key HMAC', 'Use a longer key so fewer messages get lost'],
      ok: 'Correct! Two threats, two answers: loss is handled by resends (numbered, so the bank ignores duplicates), forgery by an HMAC seal. Encryption would hide the amount, but makes no message arrive and proves no origin.',
      ko: 'Wrong. Loss is not solved by cryptography (encrypting or a longer key delivers nothing): it is solved by numbered resends. Forgery is solved by an HMAC. Dropping acks removes the only way to know a resend is needed.',
    },
  },
];
