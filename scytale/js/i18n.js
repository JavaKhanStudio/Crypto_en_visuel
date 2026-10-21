// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The story follows the course's slide « Une histoire de casse - La scytale »: around 700 BC,
// a strip wound on a stick, written along its length; the diameter is the key, the letters
// change place, not value. The message is the episode's own (the slide gives none), the same
// shape in both languages: 20 letters, 4 lines of 5 on a stick of 4 letters per turn.

const fr = {
  series: 'Crypto en visuel',
  tab: 'La scytale — Crypto en visuel',
  title: 'La scytale',
  subtitle: 'Un bâton, une bandelette : les lettres ne changent pas, elles changent de place.',
  loading: 'On taille les bâtons…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Le messager' },
  msg: 'ATTAQUEZ DEMAIN À L’AUBE',
  'stick.per': '{k} lettres par tour',
  stick: { a: 'Bâton d’Alice', b: 'Bâton de Bob', eT: 'Bâton fin d’Eve', eG: 'Bâton gros d’Eve' },
  table: { a: 'Déroulée, sur la table d’Alice', e: 'Déroulée, sur la table d’Eve', b: 'Déroulée, sur la table de Bob' },
  card: { title: 'La bandelette', legend: 'Couleur : la ligne où Alice a écrit la lettre.', front: 'devant', blank: 'Rien d’écrit encore.' },
  ch: ['Le problème', 'Chiffrer', 'Eve intercepte', 'Bob relit', 'La clé'],
  steps: {
    s1: { t: 'Un bâton, une bandelette, un ordre secret',
      p: "Vers 700 av. J.-C., les Spartiates envoient leurs ordres sur une bandelette enroulée sur un bâton, la scytale. Rejouons-le avec Alice et Bob : Alice doit envoyer à Bob « ATTAQUEZ DEMAIN À L’AUBE ». Un messager portera la bandelette, et sa route passe au pied de la tour d’Eve, qui l’arrêtera. Alice et Bob ont chacun un bâton, et les deux ont exactement le même diamètre.",
      a: 'Bob doit lire mon ordre, et personne d’autre.', b: 'Mon bâton a le même diamètre que celui d’Alice.', e: 'Tout ce qui passe sur cette route, je le lis.' },
    s2: { t: 'Le diamètre fixe les lettres par tour',
      p: "Sur la table d’Alice : son bâton et une longue bandelette de cuir, vierge. Enroulée en spirale, chaque tour de bandelette fait le tour du bâton, bord contre bord. Le nombre de lettres qu’un tour reçoit dépend du bâton :\n- autour du bâton d’Alice, un tour reçoit 4 lettres ;\n- un bâton plus gros a un tour plus long, qui reçoit plus de lettres ;\n- un bâton plus fin, moins.\n\n**Le diamètre décide du nombre de lettres par tour.**",
      go: 'Enrouler la bandelette', a: 'Mon bâton : 4 lettres par tour.' },
    s3: { t: 'Écrire dans la longueur',
      p: "Alice écrit le long du bâton, pas le long de la bandelette. Elle écrit une ligne d’un bout à l’autre, tourne le bâton d’un quart de tour, et écrit la suivante :\n- ligne 1 : {1|ATTAQ} ;\n- ligne 2 : {2|UEZDE} ;\n- ligne 3 : {3|MAINA} ;\n- ligne 4 : {4|LAUBE}.\n\nChaque ligne passe sur 5 tours de bandelette, une lettre sur chaque tour. Le tableau, en haut à droite, montre les 4 lignes.",
      go: 'Revoir l’écriture', a: 'Quatre lignes de cinq lettres : tout le message.' },
    s4: { t: 'Dérouler : du charabia',
      p: "Alice déroule la bandelette. Les lettres sortent tour après tour, et chaque tour porte une lettre de chaque ligne :\n- premier tour : {1|A} (ligne 1), {2|U} (ligne 2), {3|M} (ligne 3), {4|L} (ligne 4) ;\n- deuxième tour : {1|T}, {2|E}, {3|A}, {4|A} ;\n- et ainsi de suite, jusqu’au cinquième tour.\n\nSur la bandelette, on lit {1|A}{2|U}{3|M}{4|L}{1|T}{2|E}{3|A}{4|A}{1|T}{2|Z}{3|I}{4|U}{1|A}{2|D}{3|N}{4|B}{1|Q}{2|E}{3|A}{4|E}.",
      go: 'Revoir le déroulage', a: 'AUMLTEAATZ… Même moi, je ne le lis plus.' },
    s5: { t: 'Les lettres ne changent pas, elles changent de place',
      p: "Ce sont les 20 lettres du message, toutes là, aucune remplacée. Seul leur ordre a changé :\n- Alice a écrit le tableau ligne par ligne ;\n- la bandelette le lit colonne par colonne.\n\nChiffrer en déplaçant les lettres sans les changer s’appelle une **transposition** : la scytale est le premier chiffrement par transposition.",
      go: 'Suivre l’ordre des lettres', a: 'Une lettre de chaque ligne, puis on recommence.' },
    s6: { t: 'Le messager part, sans le bâton',
      p: "Le messager emporte la bandelette roulée. Le bâton, lui, reste chez Alice. Au pied de la tour, Eve arrête le messager et déroule la bandelette sur sa table.",
      go: 'Revoir le trajet', e: 'AUMLTEAATZIUADNBQEAE ? Ça ne veut rien dire.', n: 'Je n’ai que la bandelette. Le bâton est resté chez Alice.' },
    s7: { t: 'Eve essaie un bâton plus fin',
      p: "Eve sait comment marche une scytale : il lui faut le bon diamètre. Elle enroule la bandelette sur un bâton plus fin, qui ne prend que 3 lettres par tour. Les lettres s’alignent bien en 3 lignes, mais ce ne sont pas celles d’Alice :\n- {1|A}{4|L}{3|A}{2|Z}{1|A}{4|B}{3|A} ;\n- {2|U}{1|T}{4|A}{3|I}{2|D}{1|Q}{4|E} ;\n- {3|M}{2|E}{1|T}{4|U}{3|N}{2|E}.",
      go: 'Enrouler sur le bâton fin', go2: 'Tourner le bâton', e: 'ALAZABA, UTAIDQE, METUNE… Du charabia.' },
    s8: { t: 'Puis un bâton plus gros',
      p: "Elle essaie un bâton plus gros, de 5 lettres par tour. Il donne 5 lignes :\n- {1|A}{2|E}{3|I}{4|B} ;\n- {2|U}{3|A}{4|U}{1|Q} ;\n- {3|M}{4|A}{1|A}{2|E} ;\n- {4|L}{1|T}{2|D}{3|A} ;\n- {1|T}{2|Z}{3|N}{4|E}.\n\nToujours rien. Sur un autre diamètre, des lettres de lignes différentes se retrouvent côte à côte : les couleurs du tableau se mélangent.",
      go: 'Enrouler sur le bâton gros', go2: 'Tourner le bâton', e: 'AEIB, UAUQ… Pas mieux.' },
    s9: { t: 'La bandelette arrive chez Bob',
      p: "Eve recopie les lettres et laisse repartir le messager, pour ne pas se faire remarquer. Il apporte la bandelette à Bob.",
      go: 'Revoir le trajet', b: 'Une bandelette d’Alice. J’ai le bâton qu’il faut.' },
    s10: { t: 'Le bon diamètre',
      p: "Bob enroule la bandelette sur son bâton, du même diamètre que celui d’Alice : 4 lettres par tour. Chaque lettre retombe à la place où Alice l’a écrite. En tournant le bâton, il lit {1|ATTAQ}, {2|UEZDE}, {3|MAINA}, {4|LAUBE} : « Attaquez demain à l’aube ».",
      go: 'Enrouler sur le bâton de Bob', go2: 'Tourner le bâton', b: 'ATTAQ UEZDE MAINA LAUBE : attaquez demain à l’aube !' },
    s11: { t: 'La clé, c’est le diamètre',
      p: "Le secret d’Alice et Bob, c’est le diamètre de leur bâton : la **clé**. Avec la bandelette et sans le bon bâton, on ne lit que du charabia. Mais c’est une clé faible :\n- il n’y a pas beaucoup de diamètres possibles ;\n- Eve peut les essayer un par un, jusqu’à voir apparaître des mots.\n\nCésar, lui, fait l’inverse : il garde l’ordre des lettres et remplace chaque lettre par une autre.",
      a: 'Sans le bon bâton, la bandelette ne dit rien.', e: 'Il n’y a pas tant de diamètres. Je finirai par trouver.' },
    s12: { t: 'À vous',
      p: "Dans le bac à sable, écrivez votre propre message, choisissez le bâton d’Alice et celui avec lequel on essaie de relire. Ou testez-vous avec le quiz. Puis la suite : Enigma, la machine à rotors de la Seconde Guerre mondiale, qui remplace chaque lettre par une autre, et jamais de la même façon deux fois de suite.",
      doors: { sandbox: ['Bac à sable', 'Votre message, vos deux bâtons'], quiz: ['Quiz', 'Six questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 5 · Enigma ▶', 'Une touche, des rotors qui tournent'] } },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Écrivez un message, choisissez les deux bâtons, et lancez.',
    msg: 'Message (lettres seulement, 20 au plus)', alice: 'Bâton d’Alice, pour écrire', reader: 'Bâton d’Eve, pour relire',
    per: '{k} par tour', run: 'Chiffrer puis relire ▶', turn: 'Tourner le bâton', reset: 'Recommencer',
    ready: 'Prêt : choisissez, puis lancez.', empty: 'Écrivez au moins une lettre.',
    strip: 'Sur la bandelette', lines: 'Lu sur le bâton de {k} par tour',
    same: 'Même diamètre : le message revient.', differ: 'Pas le même diamètre : du charabia.',
  },
  quiz: {
    progress: 'Question {i} / {n}', score: 'Score : {s}', multi: 'Plusieurs réponses possibles.',
    check: 'Valider', next: 'Question suivante ▶', pick: 'Choisissez une réponse.',
  },
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revenir à l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'The Scytale — Crypto, Visualized',
  title: 'The Scytale',
  subtitle: 'A stick and a strip: the letters do not change, they change place.',
  loading: 'Carving the sticks…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'The messenger' },
  msg: 'ATTACK TOMORROW AT DAWN',
  'stick.per': '{k} letters per turn',
  stick: { a: 'Alice’s stick', b: 'Bob’s stick', eT: 'Eve’s thin stick', eG: 'Eve’s thick stick' },
  table: { a: 'Unwound, on Alice’s table', e: 'Unwound, on Eve’s table', b: 'Unwound, on Bob’s table' },
  card: { title: 'The strip', legend: 'Colour: the line Alice wrote the letter on.', front: 'in front', blank: 'Nothing written yet.' },
  ch: ['The problem', 'Encrypting', 'Eve intercepts', 'Bob reads', 'The key'],
  steps: {
    s1: { t: 'A stick, a strip, a secret order',
      p: "Around 700 BC, the Spartans sent their orders on a strip wound around a stick, the scytale. Let us play it with Alice and Bob: Alice must send Bob “ATTACK TOMORROW AT DAWN”. A messenger will carry the strip, and his road runs past the foot of Eve’s tower, where she will stop him. Alice and Bob each have a stick, and the two have exactly the same diameter.",
      a: 'Bob must read my order, and nobody else.', b: 'My stick has the same diameter as Alice’s.', e: 'Whatever passes on this road, I read.' },
    s2: { t: 'The diameter sets the letters per turn',
      p: "On Alice’s table: her stick and a long blank leather strip. Wound as a spiral, each turn of the strip goes once around the stick, edge against edge. How many letters a turn takes depends on the stick:\n- around Alice’s stick, one turn takes 4 letters;\n- a thicker stick has a longer turn, which takes more letters;\n- a thinner one, fewer.\n\n**The diameter decides how many letters fit in a turn.**",
      go: 'Wind the strip', a: 'My stick: 4 letters per turn.' },
    s3: { t: 'Writing along the length',
      p: "Alice writes along the stick, not along the strip. She writes a line from one end to the other, turns the stick a quarter turn, and writes the next one:\n- line 1: {1|ATTAC};\n- line 2: {2|KTOMO};\n- line 3: {3|RROWA};\n- line 4: {4|TDAWN}.\n\nEach line crosses 5 turns of the strip, one letter on each turn. The table, top right, shows the 4 lines.",
      go: 'Watch the writing again', a: 'Four lines of five letters: the whole message.' },
    s4: { t: 'Unwinding: gibberish',
      p: "Alice unwinds the strip. The letters come off turn after turn, and each turn carries one letter of each line:\n- first turn: {1|A} (line 1), {2|K} (line 2), {3|R} (line 3), {4|T} (line 4);\n- second turn: {1|T}, {2|T}, {3|R}, {4|D};\n- and so on, up to the fifth turn.\n\nOn the strip, it reads {1|A}{2|K}{3|R}{4|T}{1|T}{2|T}{3|R}{4|D}{1|T}{2|O}{3|O}{4|A}{1|A}{2|M}{3|W}{4|W}{1|C}{2|O}{3|A}{4|N}.",
      go: 'Watch the unwinding again', a: 'AKRTTTRDTO… Even I cannot read it now.' },
    s5: { t: 'The letters do not change, they change place',
      p: "These are the 20 letters of the message, all there, none replaced. Only their order has changed:\n- Alice wrote the table line by line;\n- the strip reads it column by column.\n\nEncrypting by moving the letters without changing them is called a **transposition**: the scytale is the first transposition cipher.",
      go: 'Follow the order of the letters', a: 'One letter from each line, then again.' },
    s6: { t: 'The messenger leaves, without the stick',
      p: "The messenger takes the strip, rolled up. The stick stays at Alice’s. At the foot of the tower, Eve stops the messenger and unrolls the strip on her table.",
      go: 'Watch the journey again', e: 'AKRTTTRDTOOAAMWWCOAN? That means nothing.', n: 'I only have the strip. The stick stayed with Alice.' },
    s7: { t: 'Eve tries a thinner stick',
      p: "Eve knows how a scytale works: she needs the right diameter. She winds the strip on a thinner stick, which only takes 3 letters per turn. The letters do line up in 3 lines, but not Alice’s:\n- {1|A}{4|T}{3|R}{2|O}{1|A}{4|W}{3|A};\n- {2|K}{1|T}{4|D}{3|O}{2|M}{1|C}{4|N};\n- {3|R}{2|T}{1|T}{4|A}{3|W}{2|O}.",
      go: 'Wind it on the thin stick', go2: 'Turn the stick', e: 'ATROAWA, KTDOMCN, RTTAWO… Gibberish.' },
    s8: { t: 'Then a thicker stick',
      p: "She tries a thicker stick, 5 letters per turn. It gives 5 lines:\n- {1|A}{2|T}{3|O}{4|W};\n- {2|K}{3|R}{4|A}{1|C};\n- {3|R}{4|D}{1|A}{2|O};\n- {4|T}{1|T}{2|M}{3|A};\n- {1|T}{2|O}{3|W}{4|N}, which looks like a word, by chance.\n\nStill nothing. On another diameter, letters from different lines end up side by side: the colours in the table mix.",
      go: 'Wind it on the thick stick', go2: 'Turn the stick', e: 'ATOW, KRAC… TOWN? A fluke. No better.' },
    s9: { t: 'The strip reaches Bob',
      p: "Eve copies the letters and lets the messenger go on, so as not to be noticed. He brings the strip to Bob.",
      go: 'Watch the journey again', b: 'A strip from Alice. I have the right stick.' },
    s10: { t: 'The right diameter',
      p: "Bob winds the strip on his stick, the same diameter as Alice’s: 4 letters per turn. Each letter falls back to the place where Alice wrote it. Turning the stick, he reads {1|ATTAC}, {2|KTOMO}, {3|RROWA}, {4|TDAWN}: “Attack tomorrow at dawn”.",
      go: 'Wind it on Bob’s stick', go2: 'Turn the stick', b: 'ATTAC KTOMO RROWA TDAWN: attack tomorrow at dawn!' },
    s11: { t: 'The key is the diameter',
      p: "Alice and Bob’s secret is the diameter of their stick: the **key**. With the strip but without the right stick, all you read is gibberish. But it is a weak key:\n- there are not many possible diameters;\n- Eve can try them one by one, until words appear.\n\nCaesar, for his part, does the opposite: he keeps the order of the letters and replaces each letter with another.",
      a: 'Without the right stick, the strip says nothing.', e: 'There are not that many diameters. I will find it.' },
    s12: { t: 'Your turn',
      p: "In the sandbox, write your own message, pick Alice’s stick and the one used to try to read it back. Or test yourself with the quiz. Then what comes next: Enigma, the Second World War rotor machine, which replaces each letter with another, and never the same way twice in a row.",
      doors: { sandbox: ['Sandbox', 'Your message, both sticks'], quiz: ['Quiz', 'Six questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 5 · Enigma ▶', 'One key, rotors that turn'] } },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Write a message, pick both sticks, and run.',
    msg: 'Message (letters only, 20 at most)', alice: 'Alice’s stick, to write', reader: 'Eve’s stick, to read back',
    per: '{k} per turn', run: 'Encrypt, then read back ▶', turn: 'Turn the stick', reset: 'Start over',
    ready: 'Ready: choose, then run.', empty: 'Write at least one letter.',
    strip: 'On the strip', lines: 'Read on the stick of {k} per turn',
    same: 'Same diameter: the message comes back.', differ: 'Not the same diameter: gibberish.',
  },
  quiz: {
    progress: 'Question {i} / {n}', score: 'Score: {s}', multi: 'Several answers possible.',
    check: 'Check', next: 'Next question ▶', pick: 'Pick an answer.',
  },
  'quiz.end': 'Quiz complete', 'quiz.again': 'Start again', 'quiz.back': 'Back to the story',
  'quiz.endText': '{s} correct answer(s) out of {n}.',
};

const dicts = { fr, en };
const listeners = [];
const fromUrl = new URLSearchParams(location.search).get('lang');
export let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

export function raw(key) { return key.split('.').reduce((o, k) => o?.[k], dicts[lang]) ?? dicts[lang][key] ?? dicts.fr[key] ?? key; }
export function t(key, vars = {}) {
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
