// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The story follows the course's slides « Kasiski - La roue » to « Kasiski - Les 5 colonnes »: a stone
// in a tyre (about 2 m a turn), marks seen only in the mud, gaps of 4, 6 or 10 m, a few gravel marks; then
// the deck's values: key LEMON, a 399-letter paragraph, LA MEME LETTRE at 51 and 81 -> PMARXIXSGEVQ,
// 48 distances, 5 divides 44 (2: 36), columns P I Q S R -> LEMON. The paragraph is French in both
// languages: it is the ciphertext Eve has, so its numbers stay. tests/kasiski_values.mjs checks every
// figure written here against js/kasiski.js.

const fr = {
  series: 'Crypto en visuel',
  tab: 'La roue et le caillou — Crypto en visuel',
  title: 'La roue et le caillou',
  subtitle: 'La clé de Vigenère tourne comme une roue, et ses traces trahissent sa longueur.',
  loading: 'On gonfle les pneus…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Le chroniqueur' },
  ch: ['La roue', 'La trace', 'La clé tourne', 'Les distances', 'La clé'],
  card: {
    trace: 'La trace', gaps: 'Écarts mesurés, d’une marque à la suivante', none: 'Pas encore de mesure.',
    count: 'Combien d’écarts chaque tour divise', of: '{n} sur {m}',
    vig: 'Le chiffrement', text: 'texte', key: 'clé', cipher: 'chiffré',
    repeat: 'Le même morceau, deux fois', pos: 'position {i}',
    tri: 'Les groupes qui reviennent', triHead: ['groupe', 'positions', 'distance'], triMore: '… 48 distances en tout',
    ccount: 'Combien de distances chaque longueur divise', len: 'longueur',
    cols: 'Cinq colonnes, cinq Césars', col: 'colonne', top: 'la plus fréquente', times: '{n} fois sur {m}', minusE: 'moins E',
    legendRed: 'En rouge : un écart que la roue n’explique pas.',
  },
  steps: {
    s1: { t: 'Une roue, un caillou, une trace',
      p: "Après la pluie, Alice part en voiture sur un chemin de terre. Un caillou s’est coincé dans la sculpture de son pneu avant droit. Eve arrive après elle : elle ne voit pas la voiture, seulement la trace qu’elle a laissée. Peut-elle dire quelle taille de pneu est passée ? C’est ce que fait l’attaque de Kasiski contre le chiffrement de Vigenère, dont la clé se répète comme un tour de roue : elle retrouve la longueur de la clé à partir des traces qu’elle laisse.",
      a: 'Un caillou dans le pneu ? On verra plus tard.', e: 'Une trace dans la boue. Elle va me dire quel pneu est passé.' },
    s2: { t: 'Un tour, une marque',
      p: "Le pneu d’Alice est un 205/55 R16, un pneu de voiture courant : environ 2 m de tour. Ici, on prend 2 m tout juste. À chaque tour de roue, le caillou revient en bas et s’enfonce dans le sol : une marque tous les 2 m, toujours la même. Sur le sec, le sol est trop dur pour la garder ; dans la boue, elle reste.",
      go: 'Avancer de trois tours', a: 'Un tour, deux mètres, une marque… si c’est boueux.' },
    s3: { t: 'Alice passe',
      p: "Alice roule jusqu’au bout du chemin. La boue n’est que par flaques : le caillou frappe tous les 2 m, mais la trace ne garde que les marques tombées dans une flaque. Entre deux flaques, rien.",
      go: 'Revoir le passage', e: 'Des marques ici et là, seulement dans la boue.' },
    s4: { t: 'Eve mesure les écarts',
      p: "Eve tend son mètre ruban d’une marque à la suivante. Elle relève des écarts de {g|4, 6 ou 10 m}, jamais 2 m : entre deux flaques, le caillou a frappé sur le sec. Les enquêteurs font la même chose sur une vraie trace de pneu : parmi leurs mesures, il y a la circonférence de roulement, la longueur que le pneu parcourt en un tour.",
      go: 'Mesurer la trace', e: '4 m, 6 m, 10 m… et quelques écarts bizarres.' },
    s5: { t: 'Le gravier',
      p: "Quatre écarts ne tombent pas juste : {r|3,7 m} et {r|2,3 m}, puis {r|7,6 m} et {r|2,4 m}. Deux des marques ne viennent pas du caillou d’Alice : ce sont des gravillons qui traînaient dans la boue, enfoncés par le pneu. Leur marque ressemble à l’autre et Eve ne peut pas les trier à l’œil : ils restent dans ses mesures et les brouillent.",
      go: 'Montrer les écarts qui clochent', e: 'Ces deux marques-là sont tombées au hasard.' },
    s6: { t: 'Le pas qui revient',
      p: "Pour chaque tour de pneu possible, de 1,5 m à 4 m, Eve compte combien des 14 écarts il divise exactement :\n- un tour de {g|2 m} en divise {g|10} : tous ceux du caillou, car 4, 6 et 10 sont des multiples de 2 ;\n- un tour de {b|4 m} n’en divise que 5 ;\n- un tour de {b|3 m} ou de {b|1,5 m}, que 3.\n\nUn tour de 1 m diviserait aussi les 10, puisqu’il divise 2 m, mais aucune voiture n’a un pneu de 1 m de tour : Eve garde **le plus grand pas qui marche**. La roue fait {g|2 m} de tour.",
      go: 'Compter', e: '2 m de tour : je sais quel pneu est passé.' },
    s7: { t: 'Vigenère : une clé qui tourne',
      p: "Le chiffrement de Vigenère décale chaque lettre du message d’autant de rangs que la lettre de la clé qui lui correspond : A décale de 0, B de 1, et L de 11. Alice prend la clé LEMON et l’écrit sur une roue à cinq faces, une lettre par face. La roue roule sur le message : chaque lettre est décalée par la face qui la touche. L + L donne W, E + E donne I, C + M donne O. Après 5 lettres, la roue a fait un tour et LEMON recommence.",
      go: 'Faire rouler la clé', a: 'Une lettre de clé par lettre du message.' },
    s8: { t: 'Le même mot au même endroit de la clé',
      p: "Le message dit deux fois « LA MEME LETTRE », à la position 51 et à la position 81. Entre les deux, 30 lettres : la roue a fait exactement 6 tours, car {g|30 = 5 × 6}. Elle pose donc la même face sur la même lettre du mot, et le même morceau sort deux fois : {g|PMARXIXSGEVQ}. Comme le caillou : la même marque, un nombre entier de tours plus loin.",
      go: 'Rouler jusqu’au bout', a: 'Six tours plus loin, les mêmes faces sur les mêmes lettres.' },
    s9: { t: 'Eve ne voit que le chiffré',
      p: "Eve n’a que les lettres chiffrées, sans espace : 399 en tout. Elle cherche chaque groupe de 3 lettres qui revient, comme une marque dans la boue, et mesure l’écart. Ici, {g|PMA} revient {g|30} lettres plus loin, puis MAR, ARX, tout le morceau de 12. Mais {r|IED} revient {r|37} lettres plus loin : un hasard, comme le gravier. Sur les 399 lettres, elle relève 48 distances.",
      go: 'Relier les groupes qui reviennent', e: 'PMA… et encore PMA, 30 lettres plus loin.' },
    s10: { t: 'La division',
      p: "Pour chaque longueur de clé possible, de 2 à 8 lettres, Eve compte combien des 48 distances elle divise :\n- une longueur de {g|5} lettres en divise {g|44} ; les 4 autres, {r|37}, {r|76}, {r|86} et {r|154}, sont des coïncidences ;\n- une longueur de {b|2} lettres suit avec 36, parce que 30, 90 ou 120 sont pairs aussi, mais elle rate 45 et 245.\n\nUne longueur de 1 diviserait tout, mais une clé d’une seule lettre décale toutes les lettres du même nombre de rangs : c’est le chiffre de César, pas Vigenère. **La clé fait {g|5} lettres.**",
      go: 'Compter', e: '5 lettres. La clé fait un tour toutes les 5 lettres.' },
    s11: { t: 'Cinq Césars',
      p: "Eve connaît la longueur : elle range les 399 lettres en 5 colonnes. La colonne 1 reçoit les lettres 0, 5, 10, et ainsi de suite, toutes décalées par la même lettre de la clé : chaque colonne est un simple chiffre de César. En français, E est la lettre la plus fréquente. Dans la colonne 1, P sort 17 fois sur 80 ; si ce P cache un E, le décalage est de 11, la lettre L. Colonne après colonne : {g|L, E, M, O, N}.",
      go: 'Casser les cinq colonnes', e: 'LEMON. Je lis tout.' },
    s12: { t: 'À vous',
      p: "Dans le bac à sable, changez le tour de la roue et le gravier, ou chiffrez le message avec votre propre clé : la bonne longueur ressort-elle toujours ? Ou testez-vous avec le quiz.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz' },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'La roue : choisissez son tour et le gravier, puis roulez. Le chiffre : choisissez une clé, puis comptez.',
    wheel: 'La roue', C: 'Tour de roue', gravel: 'Marques de gravier', roll: 'Rouler et mesurer ▶',
    cipher: 'Le chiffre', key: 'Votre clé (2 à 8 lettres)', count: 'Chiffrer et compter ▶', reset: 'Recommencer',
    ready: 'Prêt : choisissez, puis lancez.', badKey: 'Une clé de 2 à 8 lettres.',
    gaps: '{n} écarts mesurés', best: 'Le pas retenu, le plus grand qui divise presque autant d’écarts que le meilleur : {L}', right: 'C’est bien le tour de la roue.',
    wrong: 'Le gravier a trompé le compte : la roue fait {C}.',
    dists: '{n} distances', bestLen: 'La longueur retenue, la plus grande qui divise presque autant de distances que la meilleure : {L}', keyFound: 'Clé retrouvée, colonne par colonne : {k}',
    keyRight: 'C’est bien votre clé.', keyWrong: 'Pas tout à fait votre clé : le texte est trop court pour chaque colonne.',
    lenWrong: 'Pas la longueur de votre clé ({n}) : trop peu de groupes reviennent.',
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
  tab: 'The Wheel and the Stone — Crypto, Visualized',
  title: 'The Wheel and the Stone',
  subtitle: 'The Vigenère key turns like a wheel, and its tracks give its length away.',
  loading: 'Pumping up the tyres…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'The chronicler' },
  ch: ['The wheel', 'The track', 'The key turns', 'The distances', 'The key'],
  card: {
    trace: 'The track', gaps: 'Gaps measured, from one mark to the next', none: 'No measurement yet.',
    count: 'How many gaps each turn divides', of: '{n} of {m}',
    vig: 'The encryption', text: 'text', key: 'key', cipher: 'cipher',
    repeat: 'The same piece, twice', pos: 'position {i}',
    tri: 'The groups that come back', triHead: ['group', 'positions', 'distance'], triMore: '… 48 distances in all',
    ccount: 'How many distances each length divides', len: 'length',
    cols: 'Five columns, five Caesars', col: 'column', top: 'most frequent', times: '{n} times in {m}', minusE: 'minus E',
    legendRed: 'In red: a gap the wheel does not explain.',
  },
  steps: {
    s1: { t: 'A wheel, a stone, a track',
      p: "After the rain, Alice drives off down a dirt road. A stone has got stuck in the tread of her front right tyre. Eve comes along after her: she does not see the car, only the track it left. Can she tell what size of tyre went by? That is what the Kasiski attack does against the Vigenère cipher, whose key repeats like a turn of a wheel: it finds the length of the key from the tracks the key leaves.",
      a: 'A stone in the tyre? Later.', e: 'A track in the mud. It will tell me which tyre went by.' },
    s2: { t: 'One turn, one mark',
      p: "Alice’s tyre is a 205/55 R16, a common car tyre: about 2 m around. Here we take exactly 2 m. At every turn of the wheel the stone comes back down and presses into the ground: a mark every 2 m, always the same. On dry ground the soil is too hard to keep it; in mud, it stays.",
      go: 'Roll three turns', a: 'One turn, two metres, one mark… if it is muddy.' },
    s3: { t: 'Alice drives by',
      p: "Alice drives to the end of the road. The mud is only in puddles: the stone strikes every 2 m, but the track keeps only the marks that fell in a puddle. Between two puddles, nothing.",
      go: 'Watch it again', e: 'Marks here and there, only in the mud.' },
    s4: { t: 'Eve measures the gaps',
      p: "Eve stretches her tape measure from one mark to the next. She finds gaps of {g|4, 6 or 10 m}, never 2 m: between two puddles, the stone struck dry ground. Investigators do the same on a real tyre track: among their measurements is the rolling circumference, the distance the tyre covers in one turn.",
      go: 'Measure the track', e: '4 m, 6 m, 10 m… and a few odd gaps.' },
    s5: { t: 'The gravel',
      p: "Four gaps do not fit: {r|3.7 m} and {r|2.3 m}, then {r|7.6 m} and {r|2.4 m}. Two of the marks do not come from Alice’s stone: they are bits of gravel that lay in the mud and that the tyre pressed in. Their mark looks like the other one and Eve cannot sort them by eye: they stay in her measurements and blur them.",
      go: 'Show the gaps that do not fit', e: 'Those two marks fell there by chance.' },
    s6: { t: 'The step that comes back',
      p: "For every possible tyre turn, from 1.5 m to 4 m, Eve counts how many of the 14 gaps it divides exactly:\n- a turn of {g|2 m} divides {g|10}: all the stone’s, since 4, 6 and 10 are multiples of 2;\n- a turn of {b|4 m} divides only 5;\n- a turn of {b|3 m} or {b|1.5 m}, only 3.\n\nA turn of 1 m would divide the 10 too, since it divides 2 m, but no car has a tyre 1 m around: Eve keeps **the longest step that works**. The wheel is {g|2 m} around.",
      go: 'Count', e: '2 m around: I know which tyre went by.' },
    s7: { t: 'Vigenère: a key that turns',
      p: "The Vigenère cipher shifts each letter of the message by as many places as the key letter that goes with it: A shifts by 0, B by 1, and L by 11. Alice takes the key LEMON and writes it on a five-sided wheel, one letter per face. The wheel rolls over the message: each letter is shifted by the face that touches it. L + L gives W, E + E gives I, C + M gives O. After 5 letters the wheel has made one turn and LEMON starts again. The message is a French paragraph.",
      go: 'Roll the key', a: 'One key letter per letter of the message.' },
    s8: { t: 'The same word at the same place of the key',
      p: "The message says « LA MEME LETTRE » (« the same letter ») twice, at position 51 and at position 81. In between, 30 letters: the wheel made exactly 6 turns, since {g|30 = 5 × 6}. So it lays the same face on the same letter of the word, and the same piece comes out twice: {g|PMARXIXSGEVQ}. Like the stone: the same mark, a whole number of turns further on.",
      go: 'Roll to the end', a: 'Six turns on, the same faces on the same letters.' },
    s9: { t: 'Eve sees only the ciphertext',
      p: "Eve has only the encrypted letters, without spaces: 399 in all. She looks for every group of 3 letters that comes back, like a mark in the mud, and measures the gap. Here {g|PMA} comes back {g|30} letters further on, then MAR, ARX, the whole 12-letter piece. But {r|IED} comes back {r|37} letters further on: chance, like the gravel. Over the 399 letters she finds 48 distances.",
      go: 'Join the groups that come back', e: 'PMA… and PMA again, 30 letters on.' },
    s10: { t: 'The division',
      p: "For every possible key length, from 2 to 8 letters, Eve counts how many of the 48 distances it divides:\n- a length of {g|5} letters divides {g|44}; the other 4, {r|37}, {r|76}, {r|86} and {r|154}, are coincidences;\n- a length of {b|2} letters comes next with 36, because 30, 90 or 120 are even too, but it misses 45 and 245.\n\nA length of 1 would divide everything, but a one-letter key shifts every letter by the same number of places: that is Caesar’s cipher, not Vigenère. **The key is {g|5} letters long.**",
      go: 'Count', e: '5 letters. The key turns once every 5 letters.' },
    s11: { t: 'Five Caesars',
      p: "Eve knows the length: she lays the 399 letters out in 5 columns. Column 1 gets letters 0, 5, 10 and so on, all shifted by the same key letter: each column is a plain Caesar cipher. In French, E is the most frequent letter. In column 1, P comes up 17 times in 80; if that P hides an E, the shift is 11, the letter L. Column after column: {g|L, E, M, O, N}.",
      go: 'Break the five columns', e: 'LEMON. I can read it all.' },
    s12: { t: 'Your turn',
      p: "In the sandbox, change the wheel’s turn and the gravel, or encrypt the message with your own key: does the right length always come out? Or test yourself with the quiz.",
      go: 'Try it in the sandbox', go2: 'Take the quiz' },
  },
  sb: {
    title: 'Sandbox',
    hint: 'The wheel: pick its turn and the gravel, then roll. The cipher: pick a key, then count.',
    wheel: 'The wheel', C: 'Wheel turn', gravel: 'Gravel marks', roll: 'Roll and measure ▶',
    cipher: 'The cipher', key: 'Your key (2 to 8 letters)', count: 'Encrypt and count ▶', reset: 'Start over',
    ready: 'Ready: choose, then run.', badKey: 'A key of 2 to 8 letters.',
    gaps: '{n} gaps measured', best: 'The step kept, the longest that divides almost as many gaps as the best: {L}', right: 'That is the wheel’s turn.',
    wrong: 'The gravel fooled the count: the wheel is {C} around.',
    dists: '{n} distances', bestLen: 'The length kept, the longest that divides almost as many distances as the best: {L}', keyFound: 'Key found, column by column: {k}',
    keyRight: 'That is your key.', keyWrong: 'Not quite your key: the text is too short for every column.',
    lenWrong: 'Not your key’s length ({n}): too few groups come back.',
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
// for tests/kasiski_values.mjs, which reads the words without a browser
export const DICTS = dicts;
