// The built-in quiz of episode 1.5. Written to review/QUIZ_GUIDE.md: each question stands on its
// own (a new scene, never the episode's own valley), 5 options, the right answer is not the
// longest, positions are spread, feedback says why. `correct` is a list: more than one index
// makes it a multiple-answer question.
// Draft for Simon's review (tools/quiz_review.py): he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [3],
    fr: {
      q: "Le serveur d'une banque reçoit des paquets chiffrés en AES-CBC et scellés d'un HMAC. Il déchiffre d'abord, puis vérifie le HMAC, et répond « padding incorrect » ou « HMAC incorrect » selon l'erreur qu'il rencontre en premier. Un attaquant peut envoyer autant de paquets modifiés qu'il veut. Quel est le danger ?",
      o: ['Aucun : le HMAC finit toujours par rejeter le paquet modifié', "Le serveur perd du temps sur les faux paquets, sans plus", "L'attaquant obtient la clé HMAC en comparant les deux messages", "Les réponses du serveur l'aident à déchiffrer un vrai paquet", 'Le serveur accepte les paquets dont le padding est correct'],
      ok: "Correct! En déchiffrant avant de vérifier, le serveur fait travailler AES sur des octets choisis par l'attaquant, et sa réponse dit si le padding de ce qu'il a obtenu est bon. C'est l'attaque par oracle de padding (Vaudenay, 2002) : paquet après paquet, l'attaquant déchiffre un vrai message octet par octet. Vérifier le HMAC d'abord ferme la porte : un paquet modifié est rejeté avant qu'un seul octet passe par AES.",
      ko: "Erreur. Le rejet arrive bien, mais trop tard : le serveur a déjà déchiffré des octets choisis par l'attaquant, et ses deux réponses différentes disent si le padding obtenu est bon. Paquet après paquet, cette information suffit à déchiffrer un vrai message (l'attaque par oracle de padding). D'où la règle : vérifier le HMAC, puis déchiffrer.",
    },
    en: {
      q: "A bank's server receives packets encrypted with AES-CBC and sealed with an HMAC. It decrypts first, then checks the HMAC, and answers “wrong padding” or “wrong HMAC” depending on the error it meets first. An attacker can send as many modified packets as he likes. What is the danger?",
      o: ['None: the HMAC always ends up rejecting the modified packet', 'The server wastes time on the fake packets, nothing more', 'The attacker gets the HMAC key by comparing the two messages', "The server's answers help him decrypt a real packet", 'The server accepts the packets whose padding is right'],
      ok: 'Correct! By decrypting before checking, the server makes AES work on bytes the attacker chose, and its answer says whether the padding of what it got is right. That is the padding oracle attack (Vaudenay, 2002): packet after packet, the attacker decrypts a real message byte by byte. Checking the HMAC first shuts the door: a modified packet is rejected before a single byte goes through AES.',
      ko: 'Wrong. The rejection does come, but too late: the server has already decrypted bytes the attacker chose, and its two different answers say whether the padding it got is right. Packet after packet, that is enough to decrypt a real message (the padding oracle attack). Hence the rule: check the HMAC, then decrypt.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Une appli de domotique envoie des ordres chiffrés en AES-256-CBC à une serrure, avec l'IV devant le chiffré. Pour gagner du temps, le HMAC ne porte que sur le chiffré, pas sur l'IV. Un voisin malveillant intercepte « OUVRIR A 22H00 ». Que peut-il faire sans aucune clé ?",
      o: ["Changer un octet de l'IV : la serrure lit une autre heure", "Lire l'ordre, puisque l'IV voyage en clair", 'Rien : le HMAC sur le chiffré suffit à protéger tout le paquet', "Remplacer le HMAC par celui d'un ancien ordre", "Retrouver la clé AES à partir de l'IV et du chiffré"],
      ok: "Correct! En CBC, le premier bloc déchiffré est mêlé à l'IV : changer un octet de l'IV change le même octet de l'ordre, exactement comme l'attaquant le veut. Le HMAC ne couvre pas l'IV, donc il reste valide et la serrure accepte. Le sceau doit porter sur l'IV et le chiffré ensemble.",
      ko: "Erreur. L'IV en clair ne donne ni l'ordre ni la clé : c'est sa place hors du sceau qui pose problème. En CBC, le premier bloc déchiffré est mêlé à l'IV : un octet changé dans l'IV change le même octet de l'ordre, et le HMAC, calculé sur le chiffré seul, reste valide. Il faut sceller l'IV et le chiffré ensemble.",
    },
    en: {
      q: 'A home-automation app sends orders encrypted with AES-256-CBC to a door lock, with the IV in front of the ciphertext. To save time, the HMAC covers only the ciphertext, not the IV. A malicious neighbour intercepts “OPEN AT 22:00”. What can he do without any key?',
      o: ['Change a byte of the IV so the lock reads another time', 'Read the order, since the IV travels in the clear', 'Nothing: the HMAC on the ciphertext protects the whole packet', "Replace the HMAC with an old order's", 'Find the AES key from the IV and the ciphertext'],
      ok: 'Correct! In CBC, the first decrypted block is mixed with the IV: changing a byte of the IV changes the same byte of the order, exactly as the attacker wants. The HMAC does not cover the IV, so it stays valid and the lock accepts it. The seal must cover the IV and the ciphertext together.',
      ko: 'Wrong. An IV in the clear gives neither the order nor the key: the trouble is that it sits outside the seal. In CBC, the first decrypted block is mixed with the IV: a byte changed in the IV changes the same byte of the order, and the HMAC, computed over the ciphertext alone, stays valid. The IV and the ciphertext must be sealed together.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Un paquet de messagerie contient : deux clés fermées en RSA-2048-OAEP (256 octets), un IV, un chiffré AES-256-CBC et un HMAC-SHA256 de l'IV et du chiffré. En route, un câble défectueux change un seul octet parmi les 256 des clés fermées. Que se passe-t-il chez le destinataire, s'il suit les règles ?",
      o: ["Il ouvre les clés, mais l'AES déchiffre un message brouillé", 'Il ouvre les clés, et seul le premier bloc du message déchiffré est faux', "Rien de visible : OAEP corrige l'octet changé", "Il ouvre les clés, puis c'est le HMAC qui rejette le paquet", "Pas de bloc OAEP valide, donc pas de clés : rejet, rien de déchiffré"],
      ok: "Correct! Un octet changé dans le bloc RSA donne, une fois ouvert avec la clé privée, un bloc qui n'a plus la forme qu'OAEP impose : le destinataire n'obtient aucune clé, et rejette le paquet avant même le HMAC. Le message n'est jamais déchiffré. N'importe quel octet du paquet, changé, mène au rejet.",
      ko: "Erreur. OAEP ne corrige rien, et le destinataire n'obtient pas de clés du tout : un octet changé dans le bloc RSA donne, une fois ouvert, un bloc qui n'a plus la forme qu'OAEP impose. Le paquet est rejeté là, avant le HMAC et sans rien déchiffrer.",
    },
    en: {
      q: 'A messaging packet holds: two keys locked with RSA-2048-OAEP (256 bytes), an IV, an AES-256-CBC ciphertext and an HMAC-SHA256 of the IV and the ciphertext. On the way, a faulty cable changes a single byte among the 256 of the locked keys. What happens at the receiver, if it follows the rules?',
      o: ['It opens the keys, but AES decrypts a scrambled message', 'It opens the keys, and only the first block of the message is wrong', 'Nothing visible: OAEP corrects the changed byte', 'It opens the keys, then the HMAC rejects the packet', 'No valid OAEP block, so no keys: rejected, nothing decrypted'],
      ok: 'Correct! A byte changed in the RSA block gives, once opened with the private key, a block that no longer has the shape OAEP requires: the receiver gets no keys at all, and rejects the packet before even the HMAC. The message is never decrypted. Any byte of the packet, changed, leads to rejection.',
      ko: 'Wrong. OAEP corrects nothing, and the receiver gets no keys at all: a byte changed in the RSA block gives, once opened, a block that no longer has the shape OAEP requires. The packet is rejected right there, before the HMAC and with nothing decrypted.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Pour économiser RSA, une appli de livraison tire une clé AES et un IV au premier message, puis les réutilise pour tous les suivants. Chaque soir, le dépôt envoie au livreur « TOURNEE NORMALE » ou « TOURNEE ANNULEE ». Un concurrent voit passer les paquets chiffrés. Qu'apprend-il ?",
      o: ['Rien : sans la clé AES, aucun chiffré ne dit quoi que ce soit', 'La clé AES, après quelques soirs de paquets', 'Les soirs où le message est le même qu\'un soir déjà vu', 'Le texte exact du message, dès le deuxième soir', "Seulement la longueur du message, qu'AES ne cache pas"],
      ok: "Correct! Même clé, même IV, même message : même chiffré, octet pour octet. Le concurrent ne lit pas les messages, mais il voit lesquels se répètent ; dès qu'il apprend une seule fois ce que veut dire un chiffré (une tournée annulée qu'il constate), il reconnaît ce chiffré tous les soirs suivants. Une clé et un IV neufs à chaque message rendent chaque chiffré unique.",
      ko: "Erreur. La clé AES ne se retrouve pas ainsi, et le texte ne se lit pas directement. Mais avec la même clé et le même IV, le même message donne le même chiffré : le concurrent voit quels soirs se répètent, et il lui suffit d'apprendre une fois ce que veut dire un chiffré. D'où une clé et un IV neufs à chaque message.",
    },
    en: {
      q: 'To save on RSA, a delivery app draws an AES key and an IV with the first message, then reuses them for all the next ones. Every evening, the depot sends the driver “ROUND AS USUAL” or “ROUND CANCELLED”. A competitor sees the encrypted packets go by. What does he learn?',
      o: ['Nothing: without the AES key, no ciphertext says anything', 'The AES key, after a few evenings of packets', 'The evenings whose message repeats one already seen', "The exact text of the message, from the second evening on", 'Only the length of the message, which AES does not hide'],
      ok: 'Correct! Same key, same IV, same message: same ciphertext, byte for byte. The competitor cannot read the messages, but he sees which ones repeat; once he learns what one ciphertext means (a cancelled round he notices), he recognises that ciphertext every evening after. A fresh key and IV for every message make each ciphertext unique.',
      ko: 'Wrong. The AES key cannot be found this way, and the text cannot be read directly. But with the same key and IV, the same message gives the same ciphertext: the competitor sees which evenings repeat, and he only needs to learn once what a ciphertext means. Hence a fresh key and IV for every message.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Un badge d'accès envoie à la porte un code accompagné de son HMAC. La porte recalcule le HMAC et le compare à celui reçu avec ==, qui s'arrête au premier octet différent. Un intrus peut essayer des milliers de badges falsifiés et mesurer le temps de réponse de la porte à la microseconde. Que peut-il faire ?",
      o: ['Rien : un HMAC ne se devine pas sans sa clé', 'Trouver le bon HMAC octet par octet, au temps de réponse', 'Retrouver la clé HMAC à partir des temps de réponse mesurés', 'Ouvrir la porte en envoyant un HMAC vide', 'Lire le code des vrais badges à partir des temps'],
      ok: "Correct! Avec ==, la porte répond un peu plus tard quand le premier octet est bon, puis quand les deux premiers le sont, et ainsi de suite. L'intrus essaie les 256 valeurs du premier octet, garde la plus lente, passe au suivant : 32 × 256 essais au lieu de 2²⁵⁶. hmac.compare_digest compare tous les octets quoi qu'il arrive : le temps ne dit plus rien.",
      ko: "Erreur. Il ne retrouve ni la clé ni le code, mais il n'en a pas besoin : avec ==, le temps de réponse grandit avec le nombre de premiers octets justes. Il trouve le bon HMAC octet par octet, en gardant à chaque fois la valeur la plus lente. Une comparaison en temps constant (hmac.compare_digest) supprime ce signal.",
    },
    en: {
      q: 'An access badge sends the door a code along with its HMAC. The door recomputes the HMAC and compares it with the one it received using ==, which stops at the first differing byte. An intruder can try thousands of forged badges and time the door’s answer to the microsecond. What can he do?',
      o: ['Nothing: an HMAC cannot be guessed without its key', 'Find the right HMAC byte by byte, from the answer time', 'Recover the HMAC key from the measured answer times', 'Open the door by sending an empty HMAC', 'Read the codes of the real badges from the answer times'],
      ok: 'Correct! With ==, the door answers a little later when the first byte is right, then when the first two are, and so on. The intruder tries the 256 values of the first byte, keeps the slowest, moves on to the next: 32 × 256 tries instead of 2²⁵⁶. hmac.compare_digest compares every byte whatever happens: the time says nothing any more.',
      ko: 'Wrong. He finds neither the key nor the code, but he does not need them: with ==, the answer time grows with the number of right leading bytes. He finds the right HMAC byte by byte, keeping the slowest value each time. A constant-time comparison (hmac.compare_digest) removes that signal.',
    },
  },
  {
    correct: [0, 2, 4],
    fr: {
      q: "Une messagerie chiffre chaque message en AES-256-CBC, le scelle d'un HMAC-SHA256 et ferme les deux clés avec la clé publique RSA du destinataire. Parmi ces éléments, lesquels peuvent voyager sur le réseau, lisibles par tous, sans affaiblir la messagerie ?",
      o: ["L'IV", 'La clé AES', 'Le HMAC du message', 'La clé HMAC', 'Les deux clés une fois fermées en RSA-OAEP'],
      ok: "Correct! L'IV n'a pas à être secret, seulement neuf et sous le sceau. Le HMAC ne se refait pas sans la clé HMAC. Les clés fermées ne s'ouvrent qu'avec la clé privée du destinataire. En revanche, la clé AES en clair donne le message, et la clé HMAC en clair permet de sceller de faux messages.",
      ko: "Erreur. Trois éléments sont faits pour voyager à découvert : l'IV (neuf, et sous le sceau), le HMAC (inutile sans la clé HMAC) et les clés fermées en RSA-OAEP (seule la clé privée les ouvre). La clé AES et la clé HMAC, elles, ne voyagent jamais en clair : l'une donne le message, l'autre permet d'en forger.",
    },
    en: {
      q: "A messaging app encrypts each message with AES-256-CBC, seals it with an HMAC-SHA256 and locks both keys with the receiver's RSA public key. Which of these can travel over the network, readable by anyone, without weakening the app?",
      o: ['The IV', 'The AES key', "The message's HMAC", 'The HMAC key', 'Both keys once locked with RSA-OAEP'],
      ok: "Correct! The IV need not be secret, only fresh and under the seal. The HMAC cannot be remade without the HMAC key. The locked keys only open with the receiver's private key. On the other hand, the AES key in the clear gives away the message, and the HMAC key in the clear lets anyone seal fake messages.",
      ko: 'Wrong. Three items are made to travel in the open: the IV (fresh, and under the seal), the HMAC (useless without the HMAC key) and the keys locked with RSA-OAEP (only the private key opens them). The AES key and the HMAC key never travel in the clear: one gives away the message, the other lets anyone forge one.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Dans une messagerie, l'expéditeur ferme la clé AES avec la clé publique RSA du destinataire, chiffre le message en AES, et calcule un HMAC avec une clé HMAC qu'il garde pour lui. Le destinataire reçoit la clé AES fermée, l'IV, le chiffré et le HMAC. Que peut faire le destinataire ?",
      o: ["Vérifier le HMAC avec la clé AES, qui suffit", 'Vérifier le HMAC avec sa clé privée RSA', 'Déchiffrer, mais pas vérifier le HMAC, faute de clé', "Rien : sans la clé HMAC, il ne peut pas non plus déchiffrer", "Vérifier le HMAC en le recalculant sans clé"],
      ok: "Correct! Un HMAC ne se vérifie qu'en le recalculant avec la même clé que l'expéditeur. Sans la clé HMAC, le destinataire peut déchiffrer (il a ouvert la clé AES), mais il ne peut pas savoir si le paquet a été modifié. La clé HMAC doit voyager avec la clé AES, fermée avec elle en RSA-OAEP : 64 octets en tout, qui tiennent dans un seul bloc.",
      ko: "Erreur. Un HMAC ne se vérifie qu'avec la clé qui l'a produit : ni la clé AES ni la clé privée RSA ne la remplacent, et sans clé, on ne peut rien recalculer. Le destinataire peut déchiffrer, mais pas vérifier. La clé HMAC doit voyager avec la clé AES, fermées ensemble en RSA-OAEP.",
    },
    en: {
      q: "In a messaging app, the sender locks the AES key with the receiver's RSA public key, encrypts the message with AES, and computes an HMAC with an HMAC key it keeps to itself. The receiver gets the locked AES key, the IV, the ciphertext and the HMAC. What can the receiver do?",
      o: ['Check the HMAC with the AES key, which is enough', 'Check the HMAC with its RSA private key', 'Decrypt, but not check the HMAC: it lacks the key', 'Nothing: without the HMAC key, it cannot decrypt either', 'Check the HMAC by recomputing it with no key'],
      ok: 'Correct! An HMAC can only be checked by recomputing it with the same key as the sender. Without the HMAC key, the receiver can decrypt (it opened the AES key), but it cannot tell whether the packet was modified. The HMAC key must travel with the AES key, locked with it using RSA-OAEP: 64 bytes in all, which fit in a single block.',
      ko: 'Wrong. An HMAC can only be checked with the key that produced it: neither the AES key nor the RSA private key can stand in for it, and with no key, nothing can be recomputed. The receiver can decrypt, but not check. The HMAC key must travel with the AES key, locked together with RSA-OAEP.',
    },
  },
];
