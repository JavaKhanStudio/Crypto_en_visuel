// The built-in quiz of episode 1.6. Written to review/QUIZ_GUIDE.md: each question stands on its
// own (a new scene, never the episode's own valley), 5 options, the right answer is not the
// longest, positions are spread, feedback says why. `correct` is a list: more than one index
// makes it a multiple-answer question.
// Draft for Simon's review (tools/quiz_review.py): he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [1],
    fr: {
      q: "Une messagerie chiffre chaque message en AES, le scelle d'un HMAC, et envoie les deux clés fermées avec la clé publique RSA du destinataire. À l'arrivée, l'appli affiche « message authentique » dès que le HMAC est bon. Pourquoi cette mention est-elle trompeuse ?",
      o: ['La clé publique RSA du destinataire se casse en quelques heures', "N'importe qui peut fabriquer un paquet avec ses propres clés", "Le HMAC ne couvre jamais l'IV dans ce schéma", 'Un HMAC bon ne garantit pas que le message est chiffré', 'Le HMAC doit être calculé après RSA, pas avant'],
      ok: "Correct! La clé publique du destinataire est publique : n'importe qui peut tirer ses propres clés AES et HMAC, chiffrer, sceller et fermer les clés pour lui. Le HMAC sera bon, puisque le faussaire a scellé avec la clé qu'il a lui-même choisie. Un HMAC prouve « quelqu'un qui avait la clé », et ici c'est l'expéditeur qui la choisit. Pour prouver qui a écrit, il faut une signature.",
      ko: "Erreur. Le problème est ailleurs : la clé publique du destinataire est publique, et la clé HMAC est choisie par l'expéditeur. N'importe qui peut donc fabriquer un paquet complet, avec ses propres clés, et son HMAC sera bon. Le HMAC prouve « quelqu'un qui avait la clé », pas « cette personne-là » : pour cela, il faut une signature.",
    },
    en: {
      q: 'A messenger app encrypts each message with AES, seals it with an HMAC, and sends the two keys locked with the recipient’s RSA public key. On arrival, the app shows “authentic message” as soon as the HMAC is right. Why is that label misleading?',
      o: ['The recipient’s RSA public key breaks in a few hours', 'Anyone can build a packet with keys of their own', 'In this scheme the HMAC never covers the IV', 'A right HMAC does not guarantee the message is encrypted', 'The HMAC must be computed after RSA, not before'],
      ok: 'Correct! The recipient’s public key is public: anyone can draw their own AES and HMAC keys, encrypt, seal and lock the keys for them. The HMAC will be right, since the forger sealed with the key they chose themselves. An HMAC proves “someone who had the key”, and here the sender chooses the key. To prove who wrote it, you need a signature.',
      ko: 'Wrong. The problem lies elsewhere: the recipient’s public key is public, and the HMAC key is chosen by the sender. So anyone can build a whole packet with keys of their own, and its HMAC will be right. An HMAC proves “someone who had the key”, not “that person”: for that, you need a signature.',
    },
  },
  {
    correct: [3],
    fr: {
      q: "Une mairie publie ses arrêtés en ligne, signés numériquement. Avec quelle clé un habitant vérifie-t-il qu'un arrêté vient bien de la mairie ?",
      o: ['La clé privée de la mairie', "Sa propre clé privée, celle de l'habitant", "Sa propre clé publique, celle de l'habitant", 'La clé publique de la mairie', 'Une clé secrète partagée avec la mairie'],
      ok: "Correct! La mairie signe avec sa clé privée, qu'elle seule possède ; tout le monde vérifie avec sa clé publique. C'est l'inverse d'un cadenas, où tout le monde ferme avec la clé publique et seul le propriétaire ouvre avec la clé privée.",
      ko: "Erreur. Une signature se fait avec la clé privée de celui qui signe, qu'il est seul à avoir, et se vérifie avec sa clé publique, que tout le monde a. Ici : la mairie signe avec sa clé privée, l'habitant vérifie avec la clé publique de la mairie. Les clés de l'habitant n'y sont pour rien, et une clé secrète partagée ferait un HMAC, pas une signature que tout le monde peut vérifier.",
    },
    en: {
      q: 'A town hall publishes its by-laws online, digitally signed. With which key does a resident check that a by-law really comes from the town hall?',
      o: ['The town hall’s private key', 'Their own private key, the resident’s', 'Their own public key, the resident’s', 'The town hall’s public key', 'A secret key shared with the town hall'],
      ok: 'Correct! The town hall signs with its private key, which only it has; everyone checks with its public key. It is the reverse of a padlock, where everyone locks with the public key and only the owner opens with the private key.',
      ko: 'Wrong. A signature is made with the signer’s private key, which only they have, and checked with their public key, which everyone has. Here: the town hall signs with its private key, the resident checks with the town hall’s public key. The resident’s keys play no part, and a shared secret key would make an HMAC, not a signature anyone can check.',
    },
  },
  {
    correct: [1, 4],
    fr: {
      q: "Une serrure connectée accepte l'ordre « OUVRIR », chiffré et signé par l'appli de sa propriétaire. Un voleur enregistre le paquet un matin et le renvoie tel quel le soir. Qu'est-ce qui empêche la serrure de s'ouvrir le soir ?",
      o: ['Une signature plus longue, en RSA-4096 au lieu de RSA-2048, plus dure à casser', "Un compteur sous la signature, que la serrure retient et qui doit augmenter", 'Chiffrer l’ordre en AES-GCM au lieu d’AES-CBC', 'Un compteur ajouté au paquet, après la signature', "L'heure d'envoi sous la signature, refusée au-delà de quelques secondes"],
      ok: "Correct! Une copie est identique à l'original : signature, chiffrement, tout est valide. Ce qui l'arrête, c'est quelque chose qui change d'un envoi à l'autre et que la serrure vérifie : un compteur qu'elle retient, ou l'heure d'envoi avec une fenêtre courte. Il faut que ce soit sous la signature, sinon le voleur le change à sa guise.",
      ko: "Erreur. Le paquet rejoué est une copie parfaite : une signature plus longue ou un autre mode de chiffrement le laissent tout aussi valide. Il faut que la serrure reconnaisse un paquet déjà vu : un compteur qu'elle retient, ou l'heure d'envoi avec une fenêtre courte. Et ce numéro ou cette heure doivent être sous la signature : placés après, le voleur les change sans que rien ne se voie.",
    },
    en: {
      q: 'A smart lock accepts the order “OPEN”, encrypted and signed by its owner’s app. A thief records the packet one morning and sends it again, as it is, in the evening. What stops the lock from opening in the evening?',
      o: ['A longer signature, with RSA-4096 instead of RSA-2048, so much harder to break', 'A counter under the signature, which the lock remembers and which must go up', 'Encrypting the order with AES-GCM instead of AES-CBC', 'A counter added to the packet, after the signature', 'The sending time under the signature, refused after a few seconds'],
      ok: 'Correct! A copy is identical to the original: signature, encryption, all valid. What stops it is something that changes from one send to the next and that the lock checks: a counter it remembers, or the sending time with a short window. It has to be under the signature, or the thief changes it at will.',
      ko: 'Wrong. The replayed packet is a perfect copy: a longer signature or another encryption mode leave it just as valid. The lock must recognise a packet it has seen: a counter it remembers, or the sending time with a short window. And that number or time must be under the signature: placed after it, the thief changes it and nothing shows.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Un jeu en ligne numérote les messages de chaque joueur, et le numéro est signé en RSA-PSS avec le reste du message. Le serveur refuse un numéro déjà vu. Un tricheur intercepte le message n° 815 et change le numéro en 816 pour le faire accepter une seconde fois. Que se passe-t-il ?",
      o: ['Le serveur accepte : 816 n’a jamais été vu', 'Le serveur accepte, mais seulement si le message est court', 'La signature ne correspond plus : le message est rejeté', 'Le serveur rejette, parce que 816 est trop proche de 815', 'Le tricheur doit aussi changer le HMAC, ce qui suffit'],
      ok: "Correct! Le numéro est sous la signature : le changer change l'empreinte SHA-256 du message, et la signature ne correspond plus. Pour en faire une nouvelle, il faudrait la clé privée du joueur. C'est pour cela que le numéro doit être signé avec le reste.",
      ko: "Erreur. Le numéro fait partie de ce qui est signé : en le changeant, le tricheur change l'empreinte du message, et la signature, faite sur l'ancien numéro, ne correspond plus. Il lui faudrait la clé privée du joueur pour en refaire une. Le message est rejeté avant même que le numéro soit regardé.",
    },
    en: {
      q: 'An online game numbers each player’s messages, and the number is signed with RSA-PSS together with the rest of the message. The server refuses a number it has seen. A cheater intercepts message no. 815 and changes the number to 816 to get it accepted a second time. What happens?',
      o: ['The server accepts: 816 has never been seen', 'The server accepts, but only if the message is short', 'The signature no longer matches: the message is rejected', 'The server rejects it, because 816 is too close to 815 to be new', 'The cheater must also change the HMAC, which is enough'],
      ok: 'Correct! The number is under the signature: changing it changes the message’s SHA-256 digest, and the signature no longer matches. To make a new one, the cheater would need the player’s private key. That is why the number must be signed with the rest.',
      ko: 'Wrong. The number is part of what is signed: by changing it, the cheater changes the message’s digest, and the signature, made over the old number, no longer matches. They would need the player’s private key to make a new one. The message is rejected before the number is even looked at.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Une équipe remplace AES-CBC + HMAC-SHA256 par AES-GCM dans son application. Que gagne-t-elle ?",
      o: ['Chiffrer et contrôler l’intégrité en un seul appel, avec une seule clé', "La preuve que le message vient bien de l'expéditeur annoncé", "La protection contre un paquet rejoué plus tard, sans rien ajouter d'autre au paquet", 'Plus besoin de nonce : GCM s’en passe', 'Un chiffré plus court que le message de départ'],
      ok: "Correct! AES-GCM est du chiffrement authentifié : un seul appel chiffre et calcule un tag de 16 octets, vérifié avant que le moindre octet soit rendu, avec une seule clé. Mais comme le HMAC, le tag prouve « quelqu'un qui a la clé », pas qui ; il n'arrête pas un rejeu ; et il faut un nonce neuf à chaque message. Le chiffré a la longueur du message, ni plus court ni plus long.",
      ko: "Erreur. AES-GCM remplace le couple chiffrement + HMAC, et rien de plus : un seul appel chiffre et scelle, avec une seule clé. Son tag prouve, comme le HMAC, « quelqu'un qui a la clé », pas l'expéditeur ; une copie rejouée reste valide ; il exige un nonce neuf à chaque message ; et le chiffré a exactement la longueur du message.",
    },
    en: {
      q: 'A team replaces AES-CBC + HMAC-SHA256 with AES-GCM in its application. What does it gain?',
      o: ['Encryption and an integrity check in one call, with one key', 'Proof that the message comes from the sender it names', 'Protection against a packet replayed later, with nothing else', 'No more nonce: GCM does without', 'A ciphertext shorter than the original message'],
      ok: 'Correct! AES-GCM is authenticated encryption: one call encrypts and computes a 16-byte tag, checked before a single byte is given back, with a single key. But like the HMAC, the tag proves “someone who has the key”, not who; it does not stop a replay; and it needs a fresh nonce for every message. The ciphertext is as long as the message, no shorter and no longer.',
      ko: 'Wrong. AES-GCM replaces the encryption + HMAC pair, and nothing more: one call encrypts and seals, with one key. Its tag proves, like the HMAC, “someone who has the key”, not the sender; a replayed copy stays valid; it needs a fresh nonce for every message; and the ciphertext is exactly as long as the message.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Un capteur de jardin chiffre ses relevés en AES-GCM, avec une clé fixe et un nonce toujours égal à zéro. Un voisin curieux capte deux relevés. Que peut-il en tirer ?",
      o: ['Rien : tant que la clé reste secrète, le nonce importe peu', 'La clé AES, en la déduisant du nonce nul', 'Le contenu des deux relevés, mais seulement s’ils sont parfaitement identiques', 'Rien : le tag de 16 octets protège le contenu', 'Le XOR des deux relevés, et de quoi fabriquer des tags valides'],
      ok: "Correct! En GCM, le nonce et un compteur passent dans AES pour produire un flux mêlé (XOR) au message. Même clé, même nonce : même flux. Le XOR des deux chiffrés est alors le XOR des deux relevés, et un relevé connu révèle l'autre. Pire, la clé interne de GHASH peut être retrouvée, et l'attaquant fabrique des tags valides. Un nonce neuf à chaque message.",
      ko: "Erreur. La clé ne fuit pas, mais elle n'a pas besoin de fuir : en GCM, la clé et le nonce produisent un flux mêlé (XOR) au message, et avec le même nonce, c'est le même flux pour les deux relevés. Le XOR des deux chiffrés donne le XOR des deux relevés, et la clé interne de GHASH peut être retrouvée, de quoi fabriquer des tags valides. Le nonce ne doit jamais servir deux fois avec la même clé.",
    },
    en: {
      q: 'A garden sensor encrypts its readings with AES-GCM, with a fixed key and a nonce always equal to zero. A curious neighbour captures two readings. What can they get out of them?',
      o: ['Nothing: as long as the key stays secret, the nonce hardly matters', 'The AES key, worked out from the zero nonce', 'The contents, but only if the two readings are identical', 'Nothing: the 16-byte tag protects the contents', 'The XOR of the two readings, and what it takes to make valid tags'],
      ok: 'Correct! In GCM, the nonce and a counter go through AES to produce a stream mixed (XOR) into the message. Same key, same nonce: same stream. The XOR of the two ciphertexts is then the XOR of the two readings, and one known reading reveals the other. Worse, GHASH’s internal key can be recovered, and the attacker makes valid tags. A fresh nonce for every message.',
      ko: 'Wrong. The key does not leak, but it does not need to: in GCM, the key and the nonce produce a stream mixed (XOR) into the message, and with the same nonce it is the same stream for both readings. The XOR of the two ciphertexts gives the XOR of the two readings, and GHASH’s internal key can be recovered, enough to make valid tags. A nonce must never be used twice with the same key.',
    },
  },
  {
    correct: [3],
    fr: {
      q: "Lors d'un atelier attaque-défense, vous lisez le code d'un autre binôme : Bob vérifie la signature d'Alice avec une clé publique rangée dans le paquet lui-même, à côté de la signature. Que pouvez-vous faire, en jouant Eve ?",
      o: ['Rien : la signature RSA-PSS ne se falsifie pas', "Lire le message, puisque la clé publique est en clair", "Retrouver la clé privée d'Alice à partir de sa clé publique, rangée en clair", 'Signer avec votre clé et mettre votre clé publique dans le paquet', 'Rejouer le paquet, mais pas en fabriquer un'],
      ok: "Correct! Une signature prouve « celui qui a la clé privée correspondant à cette clé publique ». Si Bob prend la clé publique dans le paquet, Eve y met la sienne, signe avec sa clé privée, et la vérification réussit. Bob doit vérifier avec une clé publique d'Alice qu'il a obtenue autrement, et à laquelle il fait confiance : c'est le rôle des certificats.",
      ko: "Erreur. La signature est solide, mais Bob la vérifie avec n'importe quelle clé publique que le paquet lui tend. Eve met la sienne dans le paquet, signe avec sa clé privée, et la vérification réussit : le paquet dit « Alice », mais c'est Eve qui l'a écrit. Bob doit vérifier avec la clé publique d'Alice qu'il a obtenue autrement, et à laquelle il fait confiance.",
    },
    en: {
      q: 'In an attack-defense workshop, you read another pair’s code: Bob checks Alice’s signature with a public key stored in the packet itself, next to the signature. What can you do, playing Eve?',
      o: ['Nothing: an RSA-PSS signature cannot be forged', 'Read the message, since the public key is in the clear', 'Recover Alice’s private key from her public key, stored in the clear', 'Sign with your key and put your public key in the packet', 'Replay the packet, but not build one'],
      ok: 'Correct! A signature proves “whoever has the private key matching this public key”. If Bob takes the public key from the packet, Eve puts hers there, signs with her private key, and the check succeeds. Bob must check with a public key of Alice’s that he got some other way and trusts: that is what certificates are for.',
      ko: 'Wrong. The signature is sound, but Bob checks it with whatever public key the packet hands him. Eve puts hers in the packet, signs with her private key, and the check succeeds: the packet says “Alice”, but Eve wrote it. Bob must check with Alice’s public key, got some other way and trusted.',
    },
  },
];
