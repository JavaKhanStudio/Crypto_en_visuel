// The built-in quiz of episode 1.2. Written to review/QUIZ_GUIDE.md: each question stands on its
// own (a new scene, never the episode's own order), 5 options, the right answer is not the
// longest, positions are spread, feedback says why. `correct` is a list: more than one index
// makes it a multiple-answer question.
// Draft for Simon's review (tools/quiz_review.py): he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [2],
    fr: {
      q: "Une appli envoie le code d'une porte d'immeuble au téléphone du gardien, sans le chiffrer. En chemin, le message passe par trois routeurs qui appartiennent à d'autres entreprises. Qui peut lire le code ?",
      o: ['Le gardien seulement, puisque le message lui est adressé', "Le gardien et l'appli, qui sont les deux bouts", 'Le gardien, et chaque routeur que le message traverse', "Personne en dehors du gardien, tant que le réseau est fiable", 'Seulement quelqu’un qui connaît le mot de passe du gardien'],
      ok: "Correct! Un message en clair se lit partout où il passe : chaque machine sur le chemin le tient entier. Être adressé à quelqu'un ne le protège pas. C'est ce que règle la confidentialité : chiffrer pour que seul le destinataire puisse lire.",
      ko: "Erreur. L'adresse dit où va le message, elle n'empêche personne de le lire en route. Chaque routeur traversé tient le message entier, et en clair, il le lit.",
    },
    en: {
      q: "An app sends a building's door code to the caretaker's phone, without encrypting it. On its way, the message passes three routers owned by other companies. Who can read the code?",
      o: ['Only the caretaker, since the message is addressed to him', 'The caretaker and the app, the two ends', 'The caretaker, and every router the message crosses', 'Nobody but the caretaker, as long as the network is reliable', "Only someone who knows the caretaker's password"],
      ok: 'Correct! A message in the clear can be read wherever it passes: every machine on the way holds it whole. Being addressed to someone does not protect it. That is what confidentiality fixes: encrypt so that only the recipient can read.',
      ko: 'Wrong. The address says where the message goes, it stops nobody from reading it on the way. Every router it crosses holds the whole message, and in the clear, reads it.',
    },
  },
  {
    correct: [1],
    fr: {
      q: 'Une appli chiffre en AES-CBC, avec le padding PKCS7, un message de 40 octets. Que contient le padding ajouté ?',
      o: ['8 octets qui valent 0', '8 octets qui valent 8', '24 octets qui valent 24', 'Rien : 40 octets se chiffrent tels quels', '8 octets tirés au hasard'],
      ok: "Correct! AES travaille par blocs de 16 octets : 40 octets demandent 3 blocs, 48 octets, il en manque 8. PKCS7 met 8 octets qui valent 8. À l'arrivée, le dernier octet, 08, dit combien en retirer.",
      ko: "Erreur. AES ne chiffre que des blocs entiers de 16 octets, donc 40 octets ne passent pas tels quels : il en faut 48, il manque 8. PKCS7 les remplit avec leur propre nombre, 8, pour que le destinataire sache combien en retirer. Des zéros ou du hasard ne le lui diraient pas.",
    },
    en: {
      q: 'An app encrypts a 40-byte message with AES-CBC and PKCS7 padding. What does the added padding hold?',
      o: ['8 bytes worth 0', '8 bytes worth 8', '24 bytes worth 24', 'Nothing: 40 bytes are encrypted as they are', '8 bytes drawn at random'],
      ok: 'Correct! AES works in 16-byte blocks: 40 bytes need 3 blocks, 48 bytes, so 8 are missing. PKCS7 puts 8 bytes worth 8. On arrival, the last byte, 08, says how many to remove.',
      ko: 'Wrong. AES only encrypts whole 16-byte blocks, so 40 bytes cannot go as they are: it takes 48, 8 are missing. PKCS7 fills them with their own count, 8, so the recipient knows how many to remove. Zeros or random bytes would not tell him.',
    },
  },
  {
    correct: [3],
    fr: {
      q: "Un message fait exactement 32 octets, deux blocs pleins. On le chiffre en AES-CBC avec le padding PKCS7. Combien d'octets de chiffré obtient-on ?",
      o: ['32', '33', '40', '48', '64'],
      ok: "Correct! Même quand le message tombe juste, PKCS7 ajoute du padding : un bloc entier de 16 octets qui valent 16. Sans lui, le destinataire ne saurait pas si le dernier octet du message est du padding ou une vraie donnée.",
      ko: "Erreur. PKCS7 ajoute toujours au moins un octet. Quand le message remplit déjà ses blocs, c'est un bloc entier de 16 octets qui valent 16 : 32 + 16 = 48. Le chiffré fait toujours un nombre entier de blocs, jamais 33 ni 40.",
    },
    en: {
      q: 'A message is exactly 32 bytes, two full blocks. It is encrypted with AES-CBC and PKCS7 padding. How many bytes of ciphertext come out?',
      o: ['32', '33', '40', '48', '64'],
      ok: 'Correct! Even when the message falls right, PKCS7 adds padding: a whole block of 16 bytes worth 16. Without it, the recipient could not tell whether the last byte of the message is padding or real data.',
      ko: 'Wrong. PKCS7 always adds at least one byte. When the message already fills its blocks, it is a whole block of 16 bytes worth 16: 32 + 16 = 48. The ciphertext is always a whole number of blocks, never 33 or 40.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "Un capteur envoie chaque minute sa mesure chiffrée en AES-256-CBC, avec un IV neuf tiré au hasard et envoyé en clair à côté du chiffré. Un collègue veut garder l'IV secret, comme la clé. Qu'en dire ?",
      o: ['Inutile : il doit être neuf et imprévisible, pas secret', "Indispensable : avec l'IV, un espion déchiffre le premier bloc", "Indispensable : l'IV et le chiffré suffisent à retrouver la clé", "Inutile, mais seulement parce que la clé fait 256 bits", "Utile : sans IV, le destinataire déchiffre plus vite"],
      ok: "Correct! Le destinataire a besoin de l'IV pour déchiffrer le premier bloc, alors il voyage en clair. Ce qui protège, c'est la clé. L'IV, lui, sert à ce que deux messages identiques ne donnent pas le même chiffré : il doit changer à chaque envoi et ne pas se deviner.",
      ko: "Erreur. Sans la clé, l'IV ne permet de rien déchiffrer, ni le premier bloc ni les autres, et il ne dit rien de la clé. Il voyage en clair parce que le destinataire en a besoin ; son rôle est d'être neuf à chaque envoi.",
    },
    en: {
      q: 'A sensor sends its reading every minute, encrypted with AES-256-CBC, with a fresh random IV sent in the clear beside the ciphertext. A colleague wants to keep the IV secret, like the key. What do you say?',
      o: ['No need: it must be fresh and unpredictable, not secret', 'Essential: with the IV, a spy decrypts the first block', 'Essential: the IV and the ciphertext are enough to find the key', 'No need, but only because the key is 256 bits', 'Useful: without an IV, the recipient decrypts faster'],
      ok: 'Correct! The recipient needs the IV to decrypt the first block, so it travels in the clear. What protects is the key. The IV is there so that two identical messages do not give the same ciphertext: it must change with every message and not be guessable.',
      ko: 'Wrong. Without the key, the IV decrypts nothing, neither the first block nor the others, and it says nothing about the key. It travels in the clear because the recipient needs it; its job is to be fresh every time.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Un thermostat envoie chaque soir à 22 h l'ordre « CHAUFFAGE OFF » à la chaudière, chiffré en AES-CBC, toujours avec la même clé et le même IV. Un voisin capte le réseau. Sans la clé, que peut-il apprendre ?",
      o: ['Rien du tout : sans la clé, AES ne laisse rien passer', "Le texte de l'ordre, en comparant les chiffrés de deux soirs", 'La clé, à force de voir passer le même chiffré', "La longueur exacte de l'ordre, au caractère près", "Que l'ordre de ce soir est le même que celui d'hier"],
      ok: "Correct! Même clé, même IV, même message : même chiffré, octet pour octet. Le voisin ne lit pas « CHAUFFAGE OFF », mais il voit que l'ordre revient, et s'il apprend une fois ce qu'il voulait dire, il le reconnaîtra toujours. Un IV neuf à chaque envoi l'en empêche.",
      ko: "Erreur. AES ne laisse lire ni le texte ni la clé, même à force de répétitions. Mais avec la même clé et le même IV, un même ordre donne exactement le même chiffré : le voisin ne lit rien, il reconnaît. Quant à la longueur, le chiffré ne la donne qu'au bloc de 16 octets près.",
    },
    en: {
      q: 'Every evening at 10 pm, a thermostat sends the boiler the order “HEATING OFF”, encrypted with AES-CBC, always with the same key and the same IV. A neighbour listens to the network. Without the key, what can he learn?',
      o: ['Nothing at all: without the key, AES lets nothing through', 'The text of the order, by comparing two evenings’ ciphertexts', 'The key, by seeing the same ciphertext over and over', 'The exact length of the order, to the character', "That tonight's order is the same as yesterday's"],
      ok: 'Correct! Same key, same IV, same message: same ciphertext, byte for byte. The neighbour does not read “HEATING OFF”, but he sees the order come back, and once he learns what it meant, he will always recognise it. A fresh IV every time prevents that.',
      ko: 'Wrong. AES lets him read neither the text nor the key, however often it repeats. But with the same key and the same IV, the same order gives exactly the same ciphertext: the neighbour reads nothing, he recognises. As for the length, the ciphertext only gives it to the nearest 16-byte block.',
    },
  },
  {
    correct: [1, 3],
    fr: {
      q: "Une messagerie chiffre chaque message en AES-256-CBC. Un espion ne doit pas pouvoir reconnaître qu'un même message est envoyé deux fois. Qu'est-ce qui l'en empêche ?",
      o: ['Un padding PKCS7 plus long que le minimum', 'Un IV neuf, tiré au hasard à chaque envoi', 'Une clé de 256 bits plutôt que de 128 bits', 'Une clé AES neuve, tirée au hasard à chaque envoi', "Chiffrer l'IV, avec la même clé, avant chaque envoi"],
      ok: "Correct! Le chiffré dépend du message, de la clé et de l'IV : changer l'IV ou la clé à chaque envoi suffit à ce que deux messages identiques donnent des chiffrés sans rien de commun. Le projet fait les deux : clé neuve et IV neuf.",
      ko: "Erreur. La taille de la clé rend la clé impossible à deviner, mais avec la même clé et le même IV, un même message donne toujours le même chiffré. Plus de padding ou un IV chiffré toujours identique n'y changent rien. Ce qui casse la répétition, c'est ce qui change à chaque envoi : l'IV, la clé.",
    },
    en: {
      q: 'A messaging app encrypts each message with AES-256-CBC. A spy must not be able to tell that the same message is sent twice. What prevents it?',
      o: ['PKCS7 padding longer than the minimum', 'A fresh IV, drawn at random for every message', 'A 256-bit key rather than a 128-bit one', 'A fresh AES key, drawn at random for every message', 'Encrypting the IV with the same key before sending it'],
      ok: 'Correct! The ciphertext depends on the message, the key and the IV: changing the IV or the key with every message is enough for two identical messages to give ciphertexts with nothing in common. The project does both: fresh key and fresh IV.',
      ko: 'Wrong. The key size makes the key impossible to guess, but with the same key and the same IV, the same message always gives the same ciphertext. More padding, or an encrypted IV that is always the same, changes nothing. What breaks the repetition is what changes with every message: the IV, the key.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Deux agences d'une banque s'envoient les virements chiffrés en AES-256-CBC, avec une clé et un IV neufs à chaque envoi. Un employé malveillant, sur le réseau entre les deux, ne peut pas lire les virements. Que peut-il encore faire ?",
      o: ['Lire le montant en essayant toutes les clés une à une', "Retrouver la clé à partir de l'IV, qui voyage en clair", "Changer des octets du chiffré sans que l'agence le voie", 'Rien : le chiffrement protège aussi contre les modifications', 'Déchiffrer le premier bloc, qui ne dépend que de l’IV public'],
      ok: "Correct! Le chiffrement cache le contenu, il ne le scelle pas. Un octet changé dans le chiffré donne un autre message au déchiffrement, et l'agence n'a aucun moyen de le voir. Il faut une deuxième brique pour cela, l'intégrité : un HMAC, l'épisode 1.3.",
      ko: "Erreur. Essayer 2²⁵⁶ clés est hors de portée, l'IV ne dit rien de la clé, et le premier bloc dépend de la clé comme les autres. Mais chiffrer n'est pas sceller : rien n'empêche de changer des octets du chiffré, et rien ne le signale à l'arrivée. C'est le rôle d'un HMAC.",
    },
    en: {
      q: 'Two branches of a bank send each other transfers encrypted with AES-256-CBC, with a fresh key and IV every time. A rogue employee on the network between them cannot read the transfers. What can he still do?',
      o: ['Read the amount by trying every key one by one', 'Find the key from the IV, which travels in the clear', 'Change bytes of the ciphertext without the branch noticing', 'Nothing: encryption also protects against changes', 'Decrypt the first block, which depends only on the public IV'],
      ok: 'Correct! Encryption hides the content, it does not seal it. A byte changed in the ciphertext gives another message on decryption, and the branch has no way to see it. That takes a second brick, integrity: an HMAC, episode 1.3.',
      ko: 'Wrong. Trying 2²⁵⁶ keys is out of reach, the IV says nothing about the key, and the first block depends on the key like the others. But encrypting is not sealing: nothing stops bytes of the ciphertext from being changed, and nothing flags it on arrival. That is the job of an HMAC.',
    },
  },
];
