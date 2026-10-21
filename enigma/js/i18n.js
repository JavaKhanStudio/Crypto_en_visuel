// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The story follows the course's slide « Enigma - À la main » (r24s03) and uses its values,
// in both languages: rotors I II III, reflector B, start AAA; O at AAA lights T through
// D K N K B J T; O at AAB lights I through G R U C Y V I; OUI from AAA gives TVG.
// enigma/js/enigma.js computes them, tests/enigma_values.mjs checks them against the slide.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Enigma, une touche — Crypto en visuel',
  title: 'Enigma, une touche',
  subtitle: 'On appuie sur une touche : les rotors tournent, le courant fait l’aller-retour jusqu’à une lampe.',
  loading: 'On câble les rotors…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  part: { entry: 'entrée', III: 'III', II: 'II', I: 'I', ref: 'réflecteur B' },
  card: { title: 'Le trajet du courant', key: 'touche', from: 'départ', ref: 'réf', whose: { a: 'Machine d’Alice', b: 'Machine de Bob' },
    setup: 'rotors I II III, réflecteur B', pos: 'position {p}', start: 'départ {p}', blank: 'Aucune touche encore.' },
  ch: ['La machine', 'Une touche', 'La même touche', 'Le message', 'Bob déchiffre', 'La clé'],
  steps: {
    s1: { t: 'Une touche, une lampe',
      p: "Seconde Guerre mondiale. Alice doit répondre « OUI » à Bob, par radio. Mais la radio, tout le monde l’entend, et Eve écoute dans sa cabane. Alice et Bob ont chacun une machine Enigma, réglée de la même façon : rotors I, II et III, réflecteur B, départ AAA.",
      a: 'Je dois répondre OUI à Bob, mais toute la forêt entend la radio.', b: 'Ma machine est réglée comme celle d’Alice : I, II, III, départ AAA.', e: 'Tout ce qui passe sur les ondes, je le note.' },
    s2: { t: 'La machine',
      p: "Devant Alice : un clavier de 26 touches, derrière lui un tableau de 26 lampes, et au fond, couvercle ouvert, trois roues côte à côte : les rotors. Appuyer sur une touche allume une lampe, celle de la lettre chiffrée. Entre les deux, un courant électrique traverse les rotors. Sur la face avant, le tableau de connexions reste vide : aucun câble, pour que le calcul reste simple à suivre. Pour voir le courant, sortons les rotors et écartons-les.",
      go: 'Sortir les rotors', a: 'J’appuie sur une touche, une autre lettre s’allume.' },
    s3: { t: 'De droite à gauche',
      p: "De droite à gauche :\n- la plaque d’entrée, fixe, les 26 lettres sur son bord ;\n- les rotors III, II et I ;\n- enfin le réflecteur B.\n\nChaque rotor porte 26 contacts sur chaque face, reliés à l’intérieur par 26 fils emmêlés : le fil qui part d’un contact à droite arrive sur un autre contact, à gauche. Un rotor tourne, ses fils avec lui. La lettre du haut, en jaune, est celle qu’on lit dans sa fenêtre : ici {g|A, A et A}, la position {g|AAA}.",
      go: 'Montrer les pièces une à une', a: 'Départ AAA : les trois fenêtres montrent A.' },
    s4: { t: 'Le rotor avance d’abord',
      p: "Alice appuie sur O. Avant que le moindre courant passe, le rotor de droite, le III, avance d’un cran : sa fenêtre passe de A à B. La machine est maintenant en AAB. Ce cran, à chaque touche, c’est ce qui change tout.",
      go: 'Appuyer sur O', a: 'Le rotor III a tourné : AAB.' },
    s5: { t: 'L’aller : III, II, I',
      p: "Le courant part de la touche O et entre dans la plaque d’entrée à la lettre O. Le fil du rotor III le fait sortir en face du {g|D}. Les lettres du trajet sont celles de la plaque d’entrée : fixes, elles disent où le courant passe d’une pièce à la suivante. Le rotor II l’envoie du {g|D} au {g|K}, le rotor I du {g|K} au {g|N}. C’est le début de la ligne du tableau : {g|D, K, N}.",
      go: 'Faire passer le courant', a: 'D, K, N : il arrive au réflecteur.' },
    s6: { t: 'Le réflecteur renvoie',
      p: "Le réflecteur n’a de contacts que d’un côté : il renvoie le courant du {g|N} au {r|K}, et le courant repart vers la droite, par d’autres fils. Le rotor I l’envoie du {r|K} au {r|B}, le II du {r|B} au {r|J}, le III du {r|J} au {r|T}. Il ressort de la plaque d’entrée à la lettre {r|T} : c’est la lampe {r|T} qui s’allume. Le O d’Alice devient {r|T}.",
      go: 'Faire revenir le courant', a: 'Lampe T : mon O devient T.' },
    s7: { t: 'La même touche, un autre chemin',
      p: "Alice tape encore O. Le rotor III avance d’un cran de plus : AAC. Ses fils ont tourné avec lui, et le courant ne prend plus les mêmes : {g|G, R, U}, le réflecteur le renvoie en {r|C}, puis {r|Y, V et I}. Cette fois, c’est la lampe {r|I} qui s’allume. Le chemin d’avant reste dessiné en pâle.",
      go: 'Appuyer encore sur O', a: 'Le même O, et c’est I qui s’allume.' },
    s8: { t: 'Une lettre répétée ne se voit plus',
      p: "Deux fois la même touche O, deux lampes différentes : T, puis I.\n- Avec César, un O donne toujours la même lettre, et compter les lettres du chiffré, comme Al-Kindi, finit par trouver le E.\n- Avec Enigma, chaque touche fait avancer les rotors et change la substitution : une lettre répétée ne se voit plus dans le chiffré, et compter les lettres ne dit plus rien.",
      go: 'Revoir les deux chemins', a: 'O, puis O : T, puis I.' },
    s9: { t: 'OUI devient TVG',
      p: "Pour le vrai message, Alice remet ses rotors sur AAA, le départ convenu avec Bob, et tape O, U, I.\n- O, parti de AAA, allume T, comme tout à l’heure.\n- U part de AAB et allume V.\n- I part de AAC et allume G.\n\nAlice note **TVG**.",
      go: 'Taper OUI', a: 'TVG. Prêt à partir.' },
    s10: { t: 'Par radio, sous les oreilles d’Eve',
      p: "Alice envoie TVG par radio, lettre après lettre. Les ondes passent au-dessus de la cabane d’Eve, qui les note toutes. Eve a le chiffré en entier ; ce qu’elle n’a pas, c’est une machine réglée comme celles d’Alice et de Bob.",
      go: 'Revoir l’envoi', e: 'TVG… Trois lettres, et rien qui se répète.' },
    s11: { t: 'Bob tape TVG',
      p: "Bob a réglé sa machine sur AAA, le même départ qu’Alice. Il tape T : le rotor III avance en AAB, comme chez Alice, et le courant suit exactement le chemin du O d’Alice, à l’envers : {g|J, B, K}, {r|N, K, D}, et c’est la lampe {r|O} qui s’allume. Grâce au réflecteur, la même machine, au même réglage, chiffre et déchiffre. Puis V allume U, et G allume I.",
      go: 'Taper TVG', b: 'O, U, I : OUI !' },
    s12: { t: 'La clé, c’est le réglage',
      p: "Le secret d’Alice et de Bob, c’est le réglage du jour : quels rotors, dans quel ordre, et la position de départ. Avec ces trois rotors, il y a **6** ordres possibles et **26 × 26 × 26 = 17 576** départs. Sur la vraie machine s’y ajoutaient le réglage des bagues et les câbles du tableau de connexions.\n\nMais le réflecteur a un défaut : le courant ne revient jamais sur sa propre lettre, alors une lettre n’est jamais chiffrée en elle-même. Alan Turing et Bletchley Park s’en serviront, avec des mots devinés, pour casser Enigma.",
      a: 'Sans le réglage du jour, TVG ne dit rien.', e: 'Une lettre n’est jamais chiffrée en elle-même… Voilà un indice.' },
    s13: { t: 'À vous',
      p: "Dans le bac à sable, réglez les trois rotors et tapez sur le clavier : chaque touche montre son chemin. Remettez le même départ et tapez le chiffré : le message revient. Ou testez-vous avec le quiz. Puis la suite : les câbles, les bagues et les deux autres rotors qui tournent, le vrai réglage.",
      doors: { sandbox: ['Bac à sable', 'Réglez les rotors, tapez, voyez le chemin'], quiz: ['Quiz', 'Sept questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 5.2 · Le vrai réglage ▶', 'Câbles, bagues, le double pas'] } },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Réglez la position de départ, puis tapez des lettres, ici ou sur votre clavier.',
    start: 'Position de départ (rotors I, II, III)', keys: 'Clavier', slow: 'Au ralenti (tout le chemin)',
    reset: 'Remettre au départ', replay: 'Remettre au départ et taper le chiffré',
    typed: 'Tapé', lit: 'Allumé', pos: 'Position des rotors : {p}', ready: 'Prêt : tapez une lettre.',
    back: 'Même départ, on a tapé le chiffré : le message revient.',
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
  tab: 'Enigma, One Key Press — Crypto, Visualized',
  title: 'Enigma, One Key Press',
  subtitle: 'Press one key: the rotors step, and the current runs there and back to a lamp.',
  loading: 'Wiring the rotors…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  part: { entry: 'entry', III: 'III', II: 'II', I: 'I', ref: 'reflector B' },
  card: { title: 'The path of the current', key: 'key', from: 'start', ref: 'ref', whose: { a: 'Alice’s machine', b: 'Bob’s machine' },
    setup: 'rotors I II III, reflector B', pos: 'position {p}', start: 'from {p}', blank: 'No key pressed yet.' },
  ch: ['The machine', 'One key', 'The same key', 'The message', 'Bob decrypts', 'The key'],
  steps: {
    s1: { t: 'One key, one lamp',
      p: "World War II. Alice must answer Bob « OUI » (French for yes), by radio. But anyone can hear the radio, and Eve is listening in her hut. Alice and Bob each have an Enigma machine, set the same way: rotors I, II and III, reflector B, start AAA.",
      a: 'I must answer OUI to Bob, but the whole forest can hear the radio.', b: 'My machine is set like Alice’s: I, II, III, start AAA.', e: 'Everything on the airwaves, I write down.' },
    s2: { t: 'The machine',
      p: "In front of Alice: a keyboard of 26 keys, behind it a board of 26 lamps, and at the back, lid open, three wheels side by side: the rotors. Pressing a key lights a lamp, the letter of the cipher. In between, an electric current runs through the rotors. On the front, the plugboard stays empty: no cable, to keep the calculation easy to follow. To see the current, let us take the rotors out and spread them apart.",
      go: 'Take the rotors out', a: 'I press one key, another letter lights up.' },
    s3: { t: 'From right to left',
      p: "From right to left:\n- the entry plate, fixed, with the 26 letters on its rim;\n- rotors III, II and I;\n- last, reflector B.\n\nEach rotor has 26 contacts on each face, joined inside by 26 tangled wires: the wire from one contact on the right ends on another contact, on the left. A rotor turns, its wires with it. The letter on top, in yellow, is the one seen through its window: here {g|A, A and A}, position {g|AAA}.",
      go: 'Show the parts one by one', a: 'Start AAA: all three windows show A.' },
    s4: { t: 'The rotor steps first',
      p: "Alice presses O. Before any current flows, the right rotor, III, steps one notch: its window goes from A to B. The machine is now at AAB. That notch, at every key, is what changes everything.",
      go: 'Press O', a: 'Rotor III has turned: AAB.' },
    s5: { t: 'Going: III, II, I',
      p: "The current leaves the O key and enters the entry plate at letter O. The wire of rotor III brings it out facing {g|D}. The letters of the path are those of the entry plate: fixed, they say where the current passes from one part to the next. Rotor II sends it from {g|D} to {g|K}, rotor I from {g|K} to {g|N}. That is the start of the table's row: {g|D, K, N}.",
      go: 'Let the current through', a: 'D, K, N: it reaches the reflector.' },
    s6: { t: 'The reflector sends it back',
      p: "The reflector has contacts on one side only: it sends the current back from {g|N} to {r|K}, and the current heads right again, through other wires. Rotor I sends it from {r|K} to {r|B}, II from {r|B} to {r|J}, III from {r|J} to {r|T}. It comes out of the entry plate at letter {r|T}: lamp {r|T} lights up. Alice's O becomes {r|T}.",
      go: 'Bring the current back', a: 'Lamp T: my O becomes T.' },
    s7: { t: 'The same key, another path',
      p: "Alice types O again. Rotor III steps one more notch: AAC. Its wires turned with it, and the current no longer takes the same ones: {g|G, R, U}, the reflector sends it back at {r|C}, then {r|Y, V and I}. This time lamp {r|I} lights up. The path from before stays drawn, faint.",
      go: 'Press O again', a: 'The same O, and I lights up.' },
    s8: { t: 'A repeated letter no longer shows',
      p: "The same key O twice, two different lamps: T, then I.\n- With Caesar, an O always gives the same letter, and counting the letters of the cipher, as Al-Kindi did, ends up finding the E.\n- With Enigma, every key steps the rotors and changes the substitution: a repeated letter no longer shows in the cipher, and counting letters tells nothing any more.",
      go: 'Replay both paths', a: 'O, then O: T, then I.' },
    s9: { t: 'OUI becomes TVG',
      p: "For the real message, Alice sets her rotors back to AAA, the start agreed with Bob, and types O, U, I.\n- O, from AAA, lights T, as before.\n- U starts at AAB and lights V.\n- I starts at AAC and lights G.\n\nAlice writes down **TVG**.",
      go: 'Type OUI', a: 'TVG. Ready to send.' },
    s10: { t: 'By radio, within Eve’s earshot',
      p: "Alice sends TVG by radio, letter by letter. The waves pass over Eve's hut, and she writes them all down. Eve has the whole cipher; what she lacks is a machine set like Alice's and Bob's.",
      go: 'Replay the sending', e: 'TVG… Three letters, and nothing repeats.' },
    s11: { t: 'Bob types TVG',
      p: "Bob has set his machine to AAA, the same start as Alice. He types T: rotor III steps to AAB, as on Alice's, and the current follows exactly the path of Alice's O, backwards: {g|J, B, K}, {r|N, K, D}, and lamp {r|O} lights up. Thanks to the reflector, the same machine, with the same setting, encrypts and decrypts. Then V lights U, and G lights I.",
      go: 'Type TVG', b: 'O, U, I: OUI!' },
    s12: { t: 'The key is the setting',
      p: "Alice and Bob's secret is the setting of the day: which rotors, in which order, and the start position. With these three rotors there are **6** possible orders and **26 × 26 × 26 = 17,576** starts. The real machine added the ring settings and the plugboard cables.\n\nBut the reflector has a flaw: the current never comes back on its own letter, so a letter is never encrypted as itself. Alan Turing and Bletchley Park would use it, with guessed words, to break Enigma.",
      a: 'Without the setting of the day, TVG says nothing.', e: 'A letter is never encrypted as itself… That is a clue.' },
    s13: { t: 'Your turn',
      p: "In the sandbox, set the three rotors and type on the keyboard: every key shows its path. Set the same start again and type the cipher: the message comes back. Or test yourself with the quiz. Then what comes next: the cables, the rings and the other two rotors turning, the real setting.",
      doors: { sandbox: ['Sandbox', 'Set the rotors, type, watch the path'], quiz: ['Quiz', 'Seven questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 5.2 · The Real Setting ▶', 'Cables, rings, the double step'] } },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Set the start position, then type letters, here or on your own keyboard.',
    start: 'Start position (rotors I, II, III)', keys: 'Keyboard', slow: 'Slow motion (the whole path)',
    reset: 'Back to the start', replay: 'Back to the start and type the cipher',
    typed: 'Typed', lit: 'Lit', pos: 'Rotor position: {p}', ready: 'Ready: type a letter.',
    back: 'Same start, the cipher typed: the message comes back.',
  },
  quiz: {
    progress: 'Question {i} / {n}', score: 'Score: {s}', multi: 'Several answers possible.',
    check: 'Check', next: 'Next question ▶', pick: 'Pick an answer.',
  },
  'quiz.end': 'Quiz over', 'quiz.again': 'Play again', 'quiz.back': 'Back to the story',
  'quiz.endText': '{s} right answer(s) out of {n}.',
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
