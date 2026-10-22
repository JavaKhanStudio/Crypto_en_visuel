// The built-in quiz of episode 11. Written like the other episodes' quizzes: each question stands on
// its own (a new scene, never the episode's own order), 5 options, the right answer is not the
// longest, positions are spread, feedback says why. `correct` is a list: more than one index makes
// it a multiple-answer question.
// Draft for Simon's review (tools/quiz_review.py): he keeps the veto on every question.

export const QUIZ = [
  {
    correct: [3],
    fr: {
      q: "Pour accélérer son chiffrement, une développeuse propose de garder les 14 tours d'AES mais d'en retirer l'étape SubBytes (la S-box). Que devient son chiffrement ?",
      o: ['Aussi sûr, puisque la clé entre toujours à chaque tour', 'Plus sûr, car il reste plus de tours pour mélanger', 'Aussi sûr, tant que la clé fait 256 bits', 'Cassable : sans la S-box, tout se ramène à des équations simples', 'Illisible même pour Bob, qui ne peut plus déchiffrer'],
      ok: "Correct! SubBytes est la seule étape non linéaire. ShiftRows, MixColumns et AddRoundKey ne font que déplacer et mélanger les bits par des XOR : sans la S-box, la sortie est une fonction simple de l'entrée et de la clé, et une seule paire connue suffit pour résoudre les équations et tout déchiffrer, même sans retrouver la clé.",
      ko: "Erreur. Le nombre de tours et la taille de la clé ne sauvent rien : sans SubBytes, chaque étape qui reste est un mélange de XOR, et 14 mélanges de XOR à la suite en font un seul. Une seule paire connue suffit alors pour résoudre les équations et tout déchiffrer, même sans retrouver la clé.",
    },
    en: {
      q: "To speed up her encryption, a developer proposes to keep AES's 14 rounds but remove the SubBytes step (the S-box). What becomes of her encryption?",
      o: ['Just as safe, since the key still goes in every round', 'Safer, since more rounds are left to mix', 'Just as safe, as long as the key is 256 bits', 'Breakable: without the S-box, it all comes down to simple equations', 'Unreadable even to Bob, who can no longer decrypt'],
      ok: 'Correct! SubBytes is the only non-linear step. ShiftRows, MixColumns and AddRoundKey only move and mix bits with XORs: without the S-box, the output is a simple function of the input and the key, and a single known pair is enough to solve the equations and decrypt everything, even without recovering the key.',
      ko: 'Wrong. The number of rounds and the key size save nothing: without SubBytes, every step left is a mix of XORs, and 14 mixes of XORs in a row make a single one. A single known pair is then enough to solve the equations and decrypt everything, even without recovering the key.',
    },
  },
  {
    correct: [1],
    fr: {
      q: "Un serveur chiffre une photo avec AES-256 en mode CBC. Quels 16 octets la boîte AES reçoit-elle pour le premier bloc ?",
      o: ['Les 16 premiers octets de la photo, tels quels', 'Les 16 premiers octets de la photo XOR l’IV', 'L’IV seul, la photo n’entre qu’au deuxième bloc', 'Les 16 premiers octets de la clé', 'Les 16 premiers octets de la photo XOR la clé'],
      ok: "Correct! En CBC, chaque bloc est mélangé au bloc chiffré précédent avant d'entrer dans AES ; le premier n'a pas de bloc d'avant, il est mélangé à l'IV. AES ne voit jamais le premier bloc de la photo tel quel.",
      ko: "Erreur. En CBC, rien n'entre dans AES tel quel : le premier bloc est d'abord mélangé à l'IV par un XOR, les suivants au bloc chiffré d'avant. La clé, elle, entre par AddRoundKey, à l'intérieur de la boîte.",
    },
    en: {
      q: 'A server encrypts a photo with AES-256 in CBC mode. Which 16 bytes does the AES box receive for the first block?',
      o: ['The first 16 bytes of the photo, as they are', 'The first 16 bytes of the photo XOR the IV', 'The IV alone, the photo only goes in at the second block', 'The first 16 bytes of the key', 'The first 16 bytes of the photo XOR the key'],
      ok: "Correct! In CBC, each block is mixed with the previous encrypted block before going into AES; the first has no block before it, so it is mixed with the IV. AES never sees the photo's first block as it is.",
      ko: 'Wrong. In CBC, nothing goes into AES as it is: the first block is first mixed with the IV by an XOR, the next ones with the encrypted block before. The key goes in through AddRoundKey, inside the box.',
    },
  },
  {
    correct: [4],
    fr: {
      q: "Un tour d'AES compte quatre étapes. Si un espion connaissait le détail des quatre étapes mais pas la clé, laquelle l'empêcherait encore de défaire le tour ?",
      o: ['SubBytes, parce que la S-box est secrète', 'ShiftRows, parce que le décalage change à chaque tour', 'MixColumns, parce que le mélange dépend du message', 'Aucune : connaître les étapes suffit à défaire le tour', 'AddRoundKey, la seule étape où la clé entre'],
      ok: "Correct! La S-box, le décalage des lignes et le mélange des colonnes sont publics et les mêmes pour tout le monde : n'importe qui peut les défaire. Seul AddRoundKey utilise la clé de tour, et sans elle on ne peut pas défaire le XOR.",
      ko: "Erreur. Tout AES est public : la S-box est une table publiée, ShiftRows décale toujours de 0, 1, 2 et 3 cases, MixColumns suit toujours la même règle. Le seul secret est la clé, qui entre par AddRoundKey.",
    },
    en: {
      q: 'A round of AES has four steps. If a spy knew the details of all of them but not the key, which one would still stop him from undoing the round?',
      o: ['SubBytes, because the S-box is secret', 'ShiftRows, because the shift changes every round', 'MixColumns, because the mixing depends on the message', 'None: knowing the steps is enough to undo the round', 'AddRoundKey, the only step where the key goes in'],
      ok: 'Correct! The S-box, the row shift and the column mixing are public and the same for everyone: anyone can undo them. Only AddRoundKey uses the round key, and without it the XOR cannot be undone.',
      ko: 'Wrong. All of AES is public: the S-box is a published table, ShiftRows always shifts by 0, 1, 2 and 3 places, MixColumns always follows the same rule. The only secret is the key, which goes in through AddRoundKey.',
    },
  },
  {
    correct: [0],
    fr: {
      q: "On note les 16 valeurs de l'état juste avant ShiftRows, puis juste après. Combien de valeurs différentes trouve-t-on après qui n'étaient pas là avant ?",
      o: ['Aucune : les octets changent de place, pas de valeur', 'Quatre : une par ligne', 'Douze : toutes sauf la première ligne', 'Seize : chaque octet est recalculé', 'Ça dépend de la clé de tour'],
      ok: "Correct! ShiftRows ne fait que décaler les lignes : la première ne bouge pas, les autres glissent de 1, 2 et 3 cases. Les 16 valeurs sont les mêmes, à d'autres places ; c'est MixColumns qui en calcule de nouvelles.",
      ko: "Erreur. ShiftRows ne calcule rien : il déplace. Les mêmes 16 valeurs se retrouvent après, à d'autres places (les cubes gardent leur couleur). La clé n'y entre pas non plus.",
    },
    en: {
      q: 'We write down the 16 values of the state just before ShiftRows, then just after. How many values are there after that were not there before?',
      o: ['None: the bytes change place, not value', 'Four: one per row', 'Twelve: all but the first row', 'Sixteen: every byte is recomputed', 'It depends on the round key'],
      ok: 'Correct! ShiftRows only shifts the rows: the first does not move, the others move by 1, 2 and 3 places. The 16 values are the same, in other places; MixColumns is what computes new ones.',
      ko: 'Wrong. ShiftRows computes nothing: it moves. The same 16 values are there after, in other places (the cubes keep their colour). The key does not go in either.',
    },
  },
  {
    correct: [2],
    fr: {
      q: "Deux contrats ne diffèrent que d'un chiffre dans leurs 16 premiers octets. On les chiffre avec la même clé et le même IV. Après combien de tours d'AES les 16 octets de l'état sont-ils, en général, tous différents ?",
      o: ['Après le dernier tour seulement', 'Jamais : un seul octet diffère jusqu’au bout', 'Après 2 tours', 'Après 1 tour', 'Après 8 tours, la moitié du chemin'],
      ok: "Correct! Au départ, 1 octet diffère. MixColumns du tour 1 l'étend à sa colonne (4 octets), ShiftRows du tour 2 répartit ces 4 octets dans les 4 colonnes, et MixColumns du tour 2 les étend aux 16. AES fait 14 tours : il reste 12 tours de marge.",
      ko: "Erreur. Après le tour 1, la différence occupe une colonne : 4 octets. Au tour 2, ShiftRows envoie ces 4 octets dans 4 colonnes différentes, et MixColumns étend chacun à sa colonne : les 16. Ça va vite, et c'est voulu.",
    },
    en: {
      q: 'Two contracts differ by a single digit in their first 16 bytes. They are encrypted with the same key and the same IV. After how many rounds of AES do all 16 bytes of the state usually differ?',
      o: ['Only after the last round', 'Never: only one byte differs to the end', 'After 2 rounds', 'After 1 round', 'After 8 rounds, halfway'],
      ok: "Correct! At the start, 1 byte differs. Round 1's MixColumns spreads it to its column (4 bytes), round 2's ShiftRows sends those 4 bytes into the 4 columns, and round 2's MixColumns spreads them to all 16. AES does 14 rounds: 12 rounds of margin are left.",
      ko: "Wrong. After round 1, the difference fills one column: 4 bytes. In round 2, ShiftRows sends those 4 bytes into 4 different columns, and MixColumns spreads each to its column: all 16. It is fast, and that is on purpose.",
    },
  },
  {
    correct: [1, 3],
    fr: {
      q: "Une banque reçoit un bloc chiffré avec AES-256 et sa clé. Qu'est-ce qui est vrai de la façon dont elle le déchiffre ?",
      o: ['Elle refait les 14 tours dans le même ordre, et le résultat redevient lisible', 'Elle défait chaque étape avec son inverse, en partant du dernier tour', 'Elle doit deviner MixColumns, qui ne se défait pas', 'Elle tire les mêmes 15 clés de tour de la clé', 'Elle a besoin du bloc en clair pour calculer les clés de tour'],
      ok: "Correct! Chaque étape a son inverse (la S-box inverse, un décalage vers la droite, le mélange inverse, le même XOR), et la banque les applique du dernier tour au premier. Les 15 clés de tour se tirent de la clé seule, comme au chiffrement.",
      ko: "Erreur. Rejouer les tours dans le même ordre chiffrerait une deuxième fois. Il faut défaire chaque étape avec son inverse, du dernier tour au premier ; MixColumns a bien un inverse, et les clés de tour ne viennent que de la clé.",
    },
    en: {
      q: 'A bank receives a block encrypted with AES-256, and its key. What is true about how it decrypts it?',
      o: ['It replays the 14 rounds in the same order, and the result becomes readable again', 'It undoes each step with its inverse, starting from the last round', 'It has to guess MixColumns, which cannot be undone', 'It draws the same 15 round keys from the key', 'It needs the plaintext block to compute the round keys'],
      ok: 'Correct! Each step has its inverse (the inverse S-box, a shift to the right, the inverse mixing, the same XOR), and the bank applies them from the last round to the first. The 15 round keys are drawn from the key alone, as for encryption.',
      ko: 'Wrong. Replaying the rounds in the same order would encrypt a second time. Each step must be undone with its inverse, from the last round to the first; MixColumns does have an inverse, and the round keys come from the key alone.',
    },
  },
];
