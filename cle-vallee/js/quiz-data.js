// The built-in quiz of episode 1.4. Written to review/QUIZ_GUIDE.md: each question stands on its
// own (a new scene, never the episode's own valley), 5 options, the right answer is not the
// longest, positions are spread, feedback says why. `correct` is a list: more than one index
// makes it a multiple-answer question.
// Draft for Simon's review (tools/quiz_review.py): he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [2],
    fr: {
      q: "Une appli de messagerie chiffre chaque message en AES et le scelle d'un HMAC. Au premier contact, elle envoie la clé AES et la clé HMAC au destinataire, en clair, sur le Wi-Fi d'un café. Un attaquant enregistre tout ce qui passe sur ce Wi-Fi. Que peut-il faire ?",
      o: ['Rien : les messages sont chiffrés en AES-256', 'Lire les messages, sans pouvoir les modifier à cause du HMAC', 'Lire les messages, et en forger de valides', 'Modifier les messages en route, sans jamais pouvoir les lire', "Lire seulement les messages envoyés avant l'échange des clés"],
      ok: "Correct! Avec les deux clés, l'attaquant déchiffre tout, et il calcule pour ses propres messages un HMAC que le destinataire trouvera bon. Le chiffrement et le sceau ne valent que le secret de leurs clés : il faut faire passer les clés sans qu'on puisse les lire, par exemple fermées avec la clé publique RSA du destinataire.",
      ko: "Erreur. AES et HMAC protègent tant que l'attaquant n'a pas les clés. Ici, il les a lues en clair : il déchiffre chaque message, et il scelle ses faux messages avec la vraie clé HMAC, donc le destinataire les accepte.",
    },
    en: {
      q: 'A messaging app encrypts every message with AES and seals it with an HMAC. On first contact, it sends the AES key and the HMAC key to the recipient, in the clear, over a café’s Wi-Fi. An attacker records everything on that Wi-Fi. What can he do?',
      o: ['Nothing: the messages are encrypted with AES-256', 'Read the messages, but not change them because of the HMAC', 'Read the messages, and forge valid ones', 'Change the messages on the way, but not read them', 'Read only the messages sent before the keys were exchanged'],
      ok: 'Correct! With both keys, the attacker decrypts everything, and computes for his own messages an HMAC the recipient will find right. Encryption and the seal are worth only the secrecy of their keys: the keys must get across unreadable, for instance locked with the recipient’s RSA public key.',
      ko: 'Wrong. AES and HMAC protect only as long as the attacker lacks the keys. Here he read them in the clear: he decrypts every message, and seals his forged ones with the real HMAC key, so the recipient accepts them.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Une journaliste publie sa clé publique RSA sur son site, pour que des sources lui envoient des documents. Un concurrent télécharge la même clé publique. Que peut-il en faire ?",
      o: ['Ouvrir les documents que les sources envoient à la journaliste', 'Retrouver la clé privée à partir de la clé publique en quelques heures', 'Modifier la clé publique pour que les sources lui écrivent à lui', 'Déchiffrer les documents, mais seulement ceux de moins de 190 octets', "Chiffrer pour elle un document qu'elle seule pourra ouvrir"],
      ok: "Correct! Une clé publique sert à fermer, pas à ouvrir : n'importe qui peut chiffrer pour la journaliste, et seule sa clé privée ouvre ce qui a été fermé. La clé publique se distribue sans risque ; retrouver la clé privée demande de factoriser n, hors de portée pour 2 048 bits.",
      ko: "Erreur. Avoir la clé publique ne donne pas la clé privée : elle permet seulement de fermer pour la journaliste. Ouvrir demande la clé privée, que seule une factorisation de n donnerait, hors de portée pour une clé de 2 048 bits. Et la copie du concurrent ne change pas celle publiée sur le site.",
    },
    en: {
      q: 'A journalist publishes her RSA public key on her website, so that sources can send her documents. A competitor downloads the same public key. What can he do with it?',
      o: ['Open the documents the sources send to the journalist', 'Find the private key from the public key in a few hours', 'Change the public key so the sources write to him instead', 'Decrypt the documents, but only those under 190 bytes', 'Encrypt for her a document only she can open'],
      ok: 'Correct! A public key is for locking, not opening: anyone can encrypt for the journalist, and only her private key opens what was locked. A public key is handed out without risk; finding the private key means factoring n, out of reach at 2,048 bits.',
      ko: 'Wrong. Having the public key does not give the private key: it only lets you lock for the journalist. Opening needs the private key, which only factoring n would give, out of reach for a 2,048-bit key. And the competitor’s copy does not change the one published on the site.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Un vote en ligne chiffre chaque bulletin, « OUI » ou « NON », avec la clé publique RSA du bureau de vote, sans padding. Un curieux voit passer tous les bulletins chiffrés, avec le nom de chaque votant. Comment apprend-il le vote de chacun ?",
      o: ['Il chiffre OUI et NON avec la clé publique, et compare', 'Il factorise n pour en tirer la clé privée du bureau', 'Il ne peut pas : sans la clé privée, rien ne se déchiffre', 'Il mesure la taille des bulletins chiffrés : OUI est plus court', 'Il renvoie un bulletin au bureau et regarde le résultat changer'],
      ok: "Correct! Sans padding, RSA est déterministe : le même bulletin donne toujours le même chiffré. Avec la clé publique, le curieux fabrique les deux chiffrés possibles et les compare à ce qui passe, sans rien ouvrir. OAEP mêle au bulletin des octets tirés au hasard : deux OUI ne se ressemblent plus.",
      ko: "Erreur. Il n'a pas besoin d'ouvrir les bulletins : RSA sans padding chiffre toujours OUI de la même façon. Il chiffre OUI et NON lui-même avec la clé publique, et reconnaît chaque bulletin. Un chiffré RSA fait toujours la taille de n, quel que soit le message ; OAEP, avec sa graine au hasard, empêche cette comparaison.",
    },
    en: {
      q: 'An online vote encrypts every ballot, “YES” or “NO”, with the polling office’s RSA public key, with no padding. A snoop sees every encrypted ballot go by, with each voter’s name. How does he learn how each person voted?',
      o: ['He encrypts YES and NO himself with the public key, and compares', 'He factors n to get the office’s private key', 'He cannot: without the private key, nothing decrypts', 'He measures the size of the encrypted ballots: YES is shorter', 'He sends a ballot back to the office and watches the result change'],
      ok: 'Correct! Without padding, RSA is deterministic: the same ballot always gives the same ciphertext. With the public key, the snoop makes both possible ciphertexts and compares them with what goes by, opening nothing. OAEP mixes random bytes into the ballot: two YES votes no longer look alike.',
      ko: 'Wrong. He does not need to open the ballots: RSA without padding always encrypts YES the same way. He encrypts YES and NO himself with the public key, and recognises every ballot. An RSA ciphertext is always the size of n, whatever the message; OAEP, with its random seed, stops this comparison.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Un logiciel de sauvegarde doit envoyer chaque nuit un fichier de 2 Go, chiffré, à un serveur dont il connaît la clé publique RSA-2048. Aucune clé n'a été partagée d'avance. Quelle façon de faire est la bonne ?",
      o: ['Chiffrer le fichier en RSA-OAEP, découpé en blocs de 190 octets', 'Tirer une clé AES neuve, chiffrer le fichier en AES, et fermer la clé AES en RSA-OAEP', "Chiffrer le fichier en RSA avec une clé assez longue pour qu'il tienne en un seul bloc", 'Chiffrer le fichier en AES, avec pour clé les 32 premiers octets de la clé publique', 'Chiffrer le fichier en AES, et envoyer la clé AES à part, sur une autre connexion'],
      ok: "Correct! C'est le chiffrement hybride : RSA ne porte que la clé (petite, et RSA est lent), AES chiffre les 2 Go. Le serveur ouvre la clé AES avec sa clé privée, puis déchiffre le fichier. Une clé neuve chaque nuit : une clé qui fuit n'ouvre qu'une sauvegarde.",
      ko: "Erreur. Découper 2 Go en blocs RSA de 190 octets ferait des millions d'opérations RSA, des milliers de fois plus lentes qu'AES. Une clé tirée de la clé publique, tout le monde peut la calculer ; une clé AES envoyée à part, en clair, se lit en route. RSA ferme la clé, AES chiffre le fichier.",
    },
    en: {
      q: 'A backup tool must send a 2 GB file, encrypted, every night to a server whose RSA-2048 public key it knows. No key was shared in advance. Which way of doing it is right?',
      o: ['Encrypt the file with RSA-OAEP, cut into blocks of 190 bytes', 'Draw a fresh AES key, encrypt the file with it, lock that key with RSA-OAEP', 'Encrypt the file with RSA, with a key long enough for it to fit in one block', 'Encrypt the file with AES, using the first 32 bytes of the public key as the key', 'Encrypt the file with AES, and send the AES key separately, over another connection'],
      ok: 'Correct! This is hybrid encryption: RSA carries only the key (small, and RSA is slow), AES encrypts the 2 GB. The server opens the AES key with its private key, then decrypts the file. A fresh key every night: a key that leaks opens only one backup.',
      ko: 'Wrong. Cutting 2 GB into 190-byte RSA blocks would take millions of RSA operations, thousands of times slower than AES. A key drawn from the public key, anyone can compute; an AES key sent separately, in the clear, is read on the way. RSA locks the key, AES encrypts the file.',
    },
  },
  {
    correct: [3],
    fr: {
      q: "Pour gagner du temps, une appli tire une clé AES et une clé HMAC une seule fois, les envoie fermées en RSA-OAEP avec le premier message, puis s'en sert pour tous les messages suivants. Un jour, les clés d'un message fuient d'un téléphone volé. Qu'est-ce qui est exposé ?",
      o: ['Ce message-là seulement, puisque les autres ont leur propre IV', 'Rien : les clés voyagent fermées en RSA-OAEP', 'Seulement les messages envoyés après la fuite', 'Tous les messages chiffrés avec ces clés', 'Seulement les messages dont le HMAC a été vérifié'],
      ok: "Correct! Toutes les conversations partagent ces deux clés : qui les a lit tout ce qui a été envoyé, et peut sceller de faux messages. Avec des clés neuves à chaque message, une fuite n'ouvre que ce message-là. Fermer les clés en RSA protège leur trajet, pas leur réutilisation.",
      ko: "Erreur. RSA-OAEP a protégé les clés en route, mais une fois connues, elles ouvrent chaque message chiffré avec elles, passé comme à venir. C'est pour cela que chaque message tire ses propres clés : une fuite n'expose alors qu'un message.",
    },
    en: {
      q: 'To save time, an app draws an AES key and an HMAC key only once, sends them locked with RSA-OAEP with the first message, then uses them for every message after. One day, the keys of one message leak from a stolen phone. What is exposed?',
      o: ['That message only, since the others have their own IV', 'Nothing: the keys travel locked with RSA-OAEP', 'Only the messages sent after the leak', 'Every message encrypted with those keys', 'Only the messages whose HMAC was checked'],
      ok: 'Correct! Every conversation shares those two keys: whoever has them reads everything ever sent, and can seal forged messages. With fresh keys for every message, a leak opens that message only. Locking the keys with RSA protects their journey, not their reuse.',
      ko: 'Wrong. RSA-OAEP protected the keys on the way, but once known, they open every message encrypted with them, past and future. That is why every message draws its own keys: a leak then exposes one message only.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Une appli veut fermer en une fois, avec RSA-2048, OAEP et SHA-256, une clé AES de 32 octets, une clé HMAC de 32 octets et un identifiant de session de 100 octets, mis bout à bout. Que se passe-t-il ?",
      o: ['Les 164 octets tiennent dans un seul bloc RSA-OAEP', 'Il faut trois blocs RSA, un par élément', 'RSA-2048 ne porte que 32 octets : une seule clé à la fois', "Il faut d'abord compléter soi-même jusqu'à 256 octets avec des zéros", 'RSA-2048 porte jusqu’à 2 048 octets : il reste de la place'],
      ok: "Correct! Avec une clé de 2 048 bits (256 octets), OAEP et SHA-256 prennent 2 × 32 + 2 = 66 octets : il reste 190 octets pour le message, et 164 y tiennent. OAEP fait lui-même le remplissage, avec sa graine au hasard.",
      ko: "Erreur. 2 048, ce sont des bits : 256 octets. OAEP avec SHA-256 en garde 66 (2 × 32 + 2), il reste 190 octets pour le message, et 164 tiennent dans un seul bloc. Compléter avec des zéros soi-même, c'est faire du RSA sans padding : OAEP s'occupe du remplissage.",
    },
    en: {
      q: 'An app wants to lock in one go, with RSA-2048, OAEP and SHA-256, a 32-byte AES key, a 32-byte HMAC key and a 100-byte session ID, laid end to end. What happens?',
      o: ['The 164 bytes fit in a single RSA-OAEP block', 'It takes three RSA blocks, one per item', 'RSA-2048 carries only 32 bytes: one key at a time', 'You must first pad it yourself to 256 bytes with zeros', 'RSA-2048 carries up to 2,048 bytes: there is room to spare'],
      ok: 'Correct! With a 2,048-bit key (256 bytes), OAEP and SHA-256 take 2 × 32 + 2 = 66 bytes: 190 bytes are left for the message, and 164 fit. OAEP does the padding itself, with its random seed.',
      ko: 'Wrong. 2,048 is bits: 256 bytes. OAEP with SHA-256 keeps 66 of them (2 × 32 + 2), leaving 190 bytes for the message, and 164 fit in one block. Padding with zeros yourself is RSA without padding: OAEP takes care of the filling.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Un attaquant a copié la clé publique RSA-2048 d'un serveur (n et e = 65537), et enregistré un bloc de 256 octets où un client a fermé ses clés AES et HMAC pour ce serveur, en RSA-OAEP. Que lui manque-t-il pour rouvrir ces clés ?",
      o: ['La graine OAEP, qui voyage en clair à côté du bloc', 'Les deux nombres premiers dont n est le produit', 'Rien : il refait le calcul à l’envers avec e = 65537', 'Le sceau HMAC du message, qui contient la clé AES', 'Assez de temps pour essayer toutes les clés AES de 32 octets'],
      ok: "Correct! Ouvrir demande d, la clé privée, et d se calcule à partir des deux facteurs premiers de n. Retrouver ces facteurs pour un n de 2 048 bits est hors de portée : le record public est de 829 bits. La graine OAEP n'est pas à côté du bloc : elle est dedans, masquée, et seul celui qui ouvre le bloc la retrouve.",
      ko: "Erreur. e sert à fermer ; défaire c = m^e mod n sans d est justement ce que personne ne sait faire pour 2 048 bits. La graine OAEP est cachée dans le bloc, pas à côté ; le HMAC ne contient aucune clé ; et essayer 2^256 clés AES est sans espoir. Il faut d, donc les deux facteurs premiers de n.",
    },
    en: {
      q: 'An attacker has copied a server’s RSA-2048 public key (n and e = 65537), and recorded a 256-byte block in which a client locked its AES and HMAC keys for that server, with RSA-OAEP. What is he missing to reopen those keys?',
      o: ['The OAEP seed, which travels in the clear next to the block', 'The two prime numbers whose product is n', 'Nothing: he runs the computation backwards with e = 65537', 'The message’s HMAC seal, which contains the AES key', 'Enough time to try every 32-byte AES key'],
      ok: 'Correct! Opening needs d, the private key, and d is computed from the two prime factors of n. Finding those factors for a 2,048-bit n is out of reach: the public record is 829 bits. The OAEP seed is not next to the block: it is inside, masked, and only whoever opens the block finds it.',
      ko: 'Wrong. e is for locking; undoing c = m^e mod n without d is exactly what nobody knows how to do at 2,048 bits. The OAEP seed is hidden inside the block, not next to it; the HMAC holds no key; and trying 2^256 AES keys is hopeless. He needs d, hence the two prime factors of n.',
    },
  },
];
