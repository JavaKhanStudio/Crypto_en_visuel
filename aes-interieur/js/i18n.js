// Every visible word of episode 11 « AES de l'intérieur », in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// A step's text may hold {name}: story.js fills it from the real bytes (aes.js), so a number on
// screen is always the one the cubes show.
// TRAP: a key missing from en shows the French: add every key to both.

const fr = {
  series: 'Crypto en visuel',
  tab: "AES de l'intérieur — Crypto en visuel",
  title: "AES de l'intérieur",
  subtitle: "On ouvre la boîte AES-256 : 16 octets, 14 tours, la même sortie qu'à l'épisode 1.2.",
  loading: 'On allume les torches du donjon…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}', 'nav.replay': 'Rejouer',
  who: { a: 'Alice', n: 'Chroniqueur' },

  // in the room (room.js)
  'in.k': 'clé de tour {r}', 'in.round': 'tour {n} / 14', 'in.round0': 'avant le tour 1', 'in.c1': 'C1 · épisode 1.2',
  'in.diff': '{n} octets sur 16 diffèrent', 'in.diff1': '1 octet sur 16 diffère',

  // the corner card
  card: {
    box: 'AES-256 sur un bloc', boxNote: "Ce qu'on voyait de la boîte dans l'épisode 1.2 : 16 octets et la clé entrent, 16 octets sortent.",
    in: 'entre', out: 'sort', key: 'clé', keyNote: 'La clé d’Alice : 32 octets, 256 bits.',
    block: 'Ce que la boîte reçoit', blockNote: 'P1 ⊕ IV : chaque octet de P1 XOR l’octet de l’IV à la même place.',
    state: "L'état, colonne par colonne", stateNote: 'Le 1er octet en haut à gauche, le 2e en dessous, le 5e en haut de la 2e colonne.',
    keys: 'Les 15 clés de tour', keysNote: 'Les clés 0 et 1 sont la clé d’Alice coupée en deux ; les 13 autres en sont tirées.',
    before: 'avant', after: 'après', roundKey: 'clé de tour {r}',
    ark: 'AddRoundKey', arkNote: 'Chaque octet XOR l’octet de la clé de tour à la même place : {a} ⊕ {b} = {c}.',
    sub: 'SubBytes', subNote: 'Chaque octet remplacé par sa case de la S-box : S({a}) = {b}.',
    shift: 'ShiftRows', shiftNote: 'La ligne 1 ne bouge pas, la 2 glisse d’une case, la 3 de deux, la 4 de trois.',
    mix: 'MixColumns', mixNote: 'Chaque colonne (a, b, c, d) devient quatre octets neufs ; le premier vaut 2·a ⊕ 3·b ⊕ c ⊕ d.',
    fast: 'Tours 2 à 13', fastNote: 'Les mêmes quatre étapes, chaque tour avec sa clé de tour.',
    after1: 'après le tour 1', after13: 'après le tour 13',
    last: 'Tour 14 : la sortie', c1: 'C1 de l’épisode 1.2', same: 'identique, octet pour octet ✓',
    spread: 'Une lettre change', spreadNote: 'Octets qui diffèrent du chiffrement d’Alice, après chaque tour :', r0: 'avant',
    sum: "Ce qu'il y a dans la boîte",
    sumList: ['AddRoundKey avec la clé de tour 0', 'tours 1 à 13 : SubBytes, ShiftRows, MixColumns, AddRoundKey', 'tour 14 : SubBytes, ShiftRows, AddRoundKey'],
    sb: 'Votre bloc', sbRef: 'celui d’Alice', sbOut: 'sortie',
  },

  // story
  ch: ['La boîte', 'Le tour 1', 'Les 13 autres tours', 'Une lettre'],
  steps: {
    intro: { t: "La boîte qu'on n'avait pas ouverte", p: "Dans l'épisode 1.2, Alice chiffrait son ordre avec AES-256 : 16 octets et la clé entraient dans une boîte, 16 octets illisibles en sortaient. Nous sommes de retour dans son donjon, devant la même boîte.\n\nCette fois, on l'ouvre. On va suivre les 16 octets à l'intérieur, étape par étape, jusqu'à ce qu'ils ressortent.",
      a: 'La même clé, le même ordre. Cette fois, je regarde dedans.' },
    block: { t: "Ce qu'AES reçoit vraiment", p: "L'ordre d'Alice est « ATTAQUE DEMAIN A L'AUBE ». AES travaille par blocs de 16 octets : le premier bloc, P1, est « {p1} », un octet par lettre, espaces compris.\n\nMais en mode CBC, AES ne voit jamais P1 tel quel. P1 est d'abord mélangé à l'{b|IV} par un XOR (⊕ : chaque bit est inversé là où l'autre octet a un 1). Ce sont ces 16 octets, P1 ⊕ IV, qui entrent dans la boîte. Chacun est un nombre de 0 à 255, écrit en hexadécimal, de 00 à ff : le premier vaut {x}.",
      a: 'P1 ⊕ IV : voilà les 16 octets que la boîte reçoit.' },
    state: { t: "L'état : une grille de 4 × 4", p: "AES range ses 16 octets dans une grille de 4 lignes et 4 colonnes, qu'on appelle l'état. Il la remplit colonne par colonne : les 4 premiers octets forment la première colonne, les 4 suivants la deuxième, et ainsi de suite.\n\nChaque cube porte un octet, et sa couleur dépend de sa valeur : quand un octet change, son cube change de couleur. Tout le chiffrement consiste à transformer cette grille, encore et encore.",
      a: 'Seize cubes, un par octet. Leur couleur suit leur valeur.' },
    key: { t: 'Une clé pour chaque tour', p: "La clé d'Alice fait 32 octets. AES-256 travaille en 14 tours, et il mélange l'état avec une clé de tour de 16 octets avant le premier tour, puis à la fin de chaque tour : il en faut 15.\n\nLes clés de tour 0 et 1 sont les 32 octets de la clé, coupés en deux. Les 13 autres en sont tirées une à une, par un calcul fixe que Bob refait de son côté avec la même clé. Sans la clé, Eve ne connaît aucune des 15.",
      a: '32 octets de clé, 15 clés de tour.' },
    ark0: { t: 'AddRoundKey : la clé entre', p: "Avant le premier tour, AES fait un XOR entre l'état et la clé de tour 0 : chaque octet de l'état avec l'octet de la clé à la même place. C'est l'étape AddRoundKey (ajouter la clé de tour). Le premier octet : {x} ⊕ {k} = {y}.\n\nC'est la seule étape où la clé entre. Les trois autres font le même calcul pour tout le monde : sans AddRoundKey, n'importe qui pourrait défaire le chiffrement.",
      a: 'Ma clé entre ici, et seulement ici.' },
    sub1: { t: 'Tour 1 · SubBytes : la S-box', p: "Le tour 1 commence. Chaque octet passe par la S-box, une table fixe de 256 cases : à chaque valeur de 00 à ff, elle associe une autre valeur. Le cube tourne et ressort avec un autre octet, donc une autre couleur : S({s}) = {sy}.\n\nLa table est construite pour qu'aucune règle simple, comme « ajouter 3 », ne relie l'entrée à la sortie. C'est la seule étape qui n'est pas linéaire : sans elle, tout AES se ramènerait à des équations simples, qu'on résoudrait pour retrouver la clé.",
      a: 'Chaque octet passe par la table, l’un après l’autre.' },
    shift1: { t: 'Tour 1 · ShiftRows : les lignes glissent', p: "Ensuite, les lignes glissent vers la gauche : la première ne bouge pas, la deuxième glisse d'une case, la troisième de deux, la quatrième de trois. Ce qui sort à gauche revient à droite.\n\nLes valeurs ne changent pas, les cubes gardent leur couleur : ils changent de colonne. Après ShiftRows, chaque colonne contient un octet de chacune des quatre colonnes d'avant.",
      a: 'Une case, deux cases, trois cases.' },
    mix1: { t: 'Tour 1 · MixColumns : les colonnes se mélangent', p: "Puis chaque colonne est mélangée. Si a, b, c, d sont ses octets de haut en bas, son premier nouvel octet vaut 2·a ⊕ 3·b ⊕ c ⊕ d ; les trois autres suivent la même règle, décalée d'un cran. « 2· » décale les bits d'un cran vers la gauche (le bit qui dépasse est replié à l'intérieur), et 3·b = 2·b ⊕ b : le résultat reste un octet.\n\nLa première colonne, {col}, devient {mcol}. Changer un seul octet d'une colonne change ses quatre octets.",
      a: 'Quatre octets entrent dans la colonne, quatre nouveaux en sortent.' },
    ark1: { t: 'Tour 1 · AddRoundKey : la clé de tour 1', p: "Le tour finit comme AES a commencé : un XOR avec une clé de tour, cette fois la clé de tour 1.\n\nUn tour, ce sont donc ces quatre étapes : SubBytes, ShiftRows, MixColumns, AddRoundKey. Comparez avec la grille du départ : plus rien ne ressemble à P1 ⊕ IV, et il reste 13 tours.",
      a: 'Fin du tour 1. Il en reste 13.' },
    fast: { t: 'Tours 2 à 13 : douze fois la même chose', p: "Les tours 2 à 13 refont exactement les mêmes quatre étapes, chacun avec sa propre clé de tour. Ici, en accéléré : une étape toutes les 0,3 secondes.\n\nChaque tour mélange un peu plus. À la fin, chaque octet de la sortie dépend de chaque octet de l'entrée et de chaque octet de la clé.",
      a: 'Douze tours de plus, chacun avec sa clé.' },
    last: { t: 'Tour 14 : la sortie, C1', p: "Le dernier tour saute MixColumns : SubBytes, ShiftRows, puis AddRoundKey avec la clé de tour 14. Mélanger les colonnes tout à la fin n'ajouterait rien : ce mélange ne dépend pas de la clé, n'importe qui pourrait le défaire.\n\nLa grille qui reste, lue colonne par colonne (les cubes se remettent en rang dans cet ordre), c'est {g|C1} : octet pour octet le premier bloc chiffré que le messager d'Alice emportait dans l'épisode 1.2.",
      a: 'Le même C1 qu’à l’épisode 1.2, au bit près.' },
    spread: { t: 'Une seule lettre', p: "Et si Alice changeait une seule lettre ? Le premier octet de P1, « A » (41), devient « C » (43) : un seul bit change. En rouge, les cubes qui diffèrent du chiffrement d'Alice au même moment.\n\nAprès AddRoundKey, 1 octet diffère ; après le tour 1, MixColumns l'a étendu à sa colonne : 4 ; après le tour 2, les 16. Ensuite presque tous, à chaque tour (un octet peut retomber sur la même valeur par hasard, une fois sur 256). C'est la diffusion : un morceau du chiffré ne dit rien d'une lettre.",
      a: 'Une lettre, et tout le bloc change.' },
    end: { t: "Ce qu'il y a dans la boîte", p: "AES-256 sur un bloc, c'est : un AddRoundKey, puis 14 tours de SubBytes, ShiftRows, MixColumns (sauf au dernier) et AddRoundKey. Pour déchiffrer, Bob fait tout à l'envers, avec les mêmes clés de tour : chaque étape a son inverse.\n\nDans le bac à sable, changez un octet du bloc ou de la clé, et regardez-le se répandre.",
      doors: { sandbox: ['Bac à sable', 'Un octet du bloc ou de la clé, et ce qu’il devient'], quiz: ['Quiz', 'Six questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 1.2 · Eve lit tout\u00a0▶', 'La boîte fermée : le padding, CBC et l’IV'] } },
  },

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': "Le bloc d'Alice (P1 ⊕ IV) et sa clé. Changez un octet, lancez les 14 tours : les cubes cerclés de rouge diffèrent du chiffrement d'Alice.",
  'sb.block': 'Le bloc (16 octets, colonne par colonne)', 'sb.key': 'La clé (32 octets)',
  'sb.run': 'Lancer les 14 tours ▶', 'sb.reset': "Revenir au bloc d'Alice",
  'sb.stats': 'Octets modifiés : <b>{n}</b> · octets de la sortie qui diffèrent : <b>{d}</b> / 16',
  'sb.bad': 'Un octet s’écrit avec deux chiffres hexadécimaux, de 00 à ff.',

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'AES from the Inside — Crypto, Visualized',
  title: 'AES from the Inside',
  subtitle: 'We open the AES-256 box: 16 bytes, 14 rounds, the same output as in episode 1.2.',
  loading: 'Lighting the torches of the keep…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}', 'nav.replay': 'Replay',
  who: { a: 'Alice', n: 'Chronicler' },

  'in.k': 'round key {r}', 'in.round': 'round {n} / 14', 'in.round0': 'before round 1', 'in.c1': 'C1 · episode 1.2',
  'in.diff': '{n} bytes out of 16 differ', 'in.diff1': '1 byte out of 16 differs',

  card: {
    box: 'AES-256 on one block', boxNote: 'What we saw of the box in episode 1.2: 16 bytes and the key go in, 16 bytes come out.',
    in: 'in', out: 'out', key: 'key', keyNote: "Alice's key: 32 bytes, 256 bits.",
    block: 'What the box is given', blockNote: 'P1 ⊕ IV: each byte of P1 XOR the byte of the IV in the same place.',
    state: 'The state, column by column', stateNote: 'The 1st byte at the top left, the 2nd below it, the 5th at the top of the 2nd column.',
    keys: 'The 15 round keys', keysNote: "Keys 0 and 1 are Alice's key cut in two; the 13 others are drawn from them.",
    before: 'before', after: 'after', roundKey: 'round key {r}',
    ark: 'AddRoundKey', arkNote: 'Each byte XOR the byte of the round key in the same place: {a} ⊕ {b} = {c}.',
    sub: 'SubBytes', subNote: 'Each byte replaced by its entry in the S-box: S({a}) = {b}.',
    shift: 'ShiftRows', shiftNote: 'Row 1 stays, row 2 moves one place, row 3 two, row 4 three.',
    mix: 'MixColumns', mixNote: 'Each column (a, b, c, d) becomes four new bytes; the first is 2·a ⊕ 3·b ⊕ c ⊕ d.',
    fast: 'Rounds 2 to 13', fastNote: 'The same four steps, each round with its own round key.',
    after1: 'after round 1', after13: 'after round 13',
    last: 'Round 14: the output', c1: "Episode 1.2's C1", same: 'identical, byte for byte ✓',
    spread: 'One letter changes', spreadNote: "Bytes that differ from Alice's encryption, after each round:", r0: 'before',
    sum: "What is in the box",
    sumList: ['AddRoundKey with round key 0', 'rounds 1 to 13: SubBytes, ShiftRows, MixColumns, AddRoundKey', 'round 14: SubBytes, ShiftRows, AddRoundKey'],
    sb: 'Your block', sbRef: "Alice's", sbOut: 'output',
  },

  ch: ['The box', 'Round 1', 'The 13 other rounds', 'One letter'],
  steps: {
    intro: { t: 'The box we never opened', p: 'In episode 1.2, Alice encrypted her order with AES-256: 16 bytes and the key went into a box, 16 unreadable bytes came out. We are back in her keep, in front of the same box.\n\nThis time, we open it. We will follow the 16 bytes inside, step by step, until they come out.',
      a: 'The same key, the same order. This time, I look inside.' },
    block: { t: 'What AES is really given', p: "Alice's order is “ATTACK AT DAWN TOMORROW”. AES works on blocks of 16 bytes: the first block, P1, is “{p1}”, one byte per letter, spaces included.\n\nBut in CBC mode, AES never sees P1 as it is. P1 is first mixed with the {b|IV} by an XOR (⊕: each bit is flipped where the other byte has a 1). These 16 bytes, P1 ⊕ IV, are what goes into the box. Each is a number from 0 to 255, written in hexadecimal, from 00 to ff: the first is {x}.",
      a: 'P1 ⊕ IV: these are the 16 bytes the box is given.' },
    state: { t: 'The state: a 4 × 4 grid', p: 'AES lays its 16 bytes out in a grid of 4 rows and 4 columns, called the state. It fills it column by column: the first 4 bytes make the first column, the next 4 the second, and so on.\n\nEach cube holds a byte, and its colour depends on its value: when a byte changes, its cube changes colour. The whole encryption is transforming this grid, again and again.',
      a: 'Sixteen cubes, one per byte. Their colour follows their value.' },
    key: { t: 'A key for every round', p: "Alice's key is 32 bytes. AES-256 works in 14 rounds, and it mixes the state with a 16-byte round key before the first round, then at the end of every round: it needs 15.\n\nRound keys 0 and 1 are the 32 bytes of the key, cut in two. The 13 others are drawn from them one by one, by a fixed calculation that Bob repeats on his side with the same key. Without the key, Eve knows none of the 15.",
      a: '32 bytes of key, 15 round keys.' },
    ark0: { t: 'AddRoundKey: the key goes in', p: "Before the first round, AES XORs the state with round key 0: each byte of the state with the byte of the key in the same place. This is the AddRoundKey step. The first byte: {x} ⊕ {k} = {y}.\n\nIt is the only step where the key goes in. The three others do the same calculation for everyone: without AddRoundKey, anyone could undo the encryption.",
      a: 'My key goes in here, and only here.' },
    sub1: { t: 'Round 1 · SubBytes: the S-box', p: 'Round 1 begins. Each byte goes through the S-box, a fixed table of 256 entries: to each value from 00 to ff, it gives another value. The cube turns and comes out with another byte, so another colour: S({s}) = {sy}.\n\nThe table is built so that no simple rule, such as “add 3”, links the input to the output. It is the only step that is not linear: without it, all of AES would come down to simple equations, which one would solve to find the key.',
      a: 'Each byte goes through the table, one after the other.' },
    shift1: { t: 'Round 1 · ShiftRows: the rows shift', p: 'Next, the rows move to the left: the first does not move, the second moves one place, the third two, the fourth three. What falls off the left comes back on the right.\n\nThe values do not change, the cubes keep their colour: they change column. After ShiftRows, each column holds one byte from each of the four columns before.',
      a: 'One place, two places, three places.' },
    mix1: { t: 'Round 1 · MixColumns: the columns are mixed', p: "Then each column is mixed. If a, b, c, d are its bytes from top to bottom, its first new byte is 2·a ⊕ 3·b ⊕ c ⊕ d; the three others follow the same rule, shifted one place. “2·” shifts the bits one place to the left (the bit that falls off is folded back in), and 3·b = 2·b ⊕ b: the result is still a byte.\n\nThe first column, {col}, becomes {mcol}. Changing a single byte of a column changes all four of its bytes.",
      a: 'Four bytes go into the column, four new ones come out.' },
    ark1: { t: 'Round 1 · AddRoundKey: round key 1', p: 'The round ends the way AES began: an XOR with a round key, this time round key 1.\n\nA round is therefore these four steps: SubBytes, ShiftRows, MixColumns, AddRoundKey. Compare with the grid we started from: nothing looks like P1 ⊕ IV any more, and 13 rounds are left.',
      a: 'End of round 1. 13 to go.' },
    fast: { t: 'Rounds 2 to 13: the same thing, twelve times', p: 'Rounds 2 to 13 repeat exactly the same four steps, each with its own round key. Here, sped up: one step every 0.3 seconds.\n\nEach round mixes a little more. At the end, every byte of the output depends on every byte of the input and every byte of the key.',
      a: 'Twelve more rounds, each with its key.' },
    last: { t: 'Round 14: the output, C1', p: "The last round skips MixColumns: SubBytes, ShiftRows, then AddRoundKey with round key 14. Mixing the columns at the very end would add nothing: that mixing does not depend on the key, anyone could undo it.\n\nThe grid that is left, read column by column (the cubes line up in that order), is {g|C1}: byte for byte the first encrypted block that Alice's messenger carried in episode 1.2.",
      a: 'The same C1 as in episode 1.2, to the bit.' },
    spread: { t: 'A single letter', p: "What if Alice changed a single letter? The first byte of P1, “A” (41), becomes “C” (43): a single bit changes. In red, the cubes that differ from Alice's encryption at the same moment.\n\nAfter AddRoundKey, 1 byte differs; after round 1, MixColumns has spread it to its column: 4; after round 2, all 16. Then nearly all of them, every round (a byte can land on the same value by chance, once in 256). This is diffusion: a piece of the ciphertext says nothing about a letter.",
      a: 'One letter, and the whole block changes.' },
    end: { t: 'What is in the box', p: 'AES-256 on one block is: one AddRoundKey, then 14 rounds of SubBytes, ShiftRows, MixColumns (except in the last) and AddRoundKey. To decrypt, Bob does everything backwards, with the same round keys: each step has its inverse.\n\nIn the sandbox, change a byte of the block or of the key, and watch it spread.',
      doors: { sandbox: ['Sandbox', 'One byte of the block or of the key, and what becomes of it'], quiz: ['Quiz', 'Six questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 1.2 · Eve Reads Everything\u00a0▶', 'The closed box: padding, CBC and the IV'] } },
  },

  'sb.title': 'Sandbox',
  'sb.hint': "Alice's block (P1 ⊕ IV) and her key. Change a byte, run the 14 rounds: the cubes outlined in red differ from Alice's encryption.",
  'sb.block': 'The block (16 bytes, column by column)', 'sb.key': 'The key (32 bytes)',
  'sb.run': 'Run the 14 rounds ▶', 'sb.reset': "Back to Alice's block",
  'sb.stats': 'Bytes changed: <b>{n}</b> · output bytes that differ: <b>{d}</b> / 16',
  'sb.bad': 'A byte is written with two hexadecimal digits, from 00 to ff.',

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
export function t(key, vars = {}) { return fill(raw(key), vars); }
export function fill(s, vars = {}) {
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
