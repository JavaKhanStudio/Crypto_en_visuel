// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The story follows the course's slides on HMAC (« HMAC », « HMAC - La timing attack ») and uses
// their values: key = cle_secrete_partagee, message = « Transfert 1000 euros a Bob », the guard
// compares with == (stops at the first wrong letter) or hmac.compare_digest (always all 64).
// garde/js/hmac.js computes the HMACs; tests/garde_values.mjs checks them against Python's hmac.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Le garde trop pressé (HMAC, timing attack) — Crypto en visuel',
  title: 'Le garde trop pressé',
  subtitle: 'Un garde qui compare un badge lettre par lettre, et une attaquante qui le chronomètre.',
  loading: 'On ouvre la banque…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', g: 'le garde' },
  sec: '{s} s',
  scene: {
    board: 'Le garde compare  mac == recu',
    looked: '{n} lettres regardées',
    ledger: 'Registre de Bob',
    badge: 'BADGE',
    chart: 'Temps de réponse — {o} lettre',
    known: 'connu :',
  },
  ch: ['Le contrôle', 'Eve essaie', 'Lettre par lettre', 'Le garde patient', 'À vous'],
  steps: {
    s1: { t: 'Un badge pour Bob',
      p: "Alice envoie un ordre à Bob : « Transfert 1000 euros a Bob ». Pour que Bob soit sûr que l’ordre vient bien d’elle et n’a pas été modifié, Alice y joint un code d’authentification, le HMAC : elle le calcule avec une clé secrète que Bob et elle sont les seuls à connaître. Le message et son HMAC forment le badge. Au guichet, le garde recalcule le HMAC avec la même clé et le compare, lettre par lettre, avec celui du badge. Eve voudrait faire passer son propre ordre.",
      a: 'Je joins le HMAC calculé avec notre clé. Bob verra que l’ordre vient de moi.',
      b: 'Je ne laisse entrer que les badges dont le HMAC est le bon.',
      e: 'Je ne connais pas la clé… mais le garde va me renseigner sans le savoir.' },
    s2: { t: 'Le badge d’Alice passe',
      p: "Alice pose son badge. Le garde recalcule le HMAC du message avec la clé de Bob : il obtient 1598e59f…, et il le compare au HMAC du badge, lettre par lettre. Les 64 lettres sont identiques, jusqu’à la dernière. Le garde ouvre la grille, et l’ordre d’Alice entre dans le registre de Bob.",
      go: 'Alice présente son badge', a: 'Les 64 lettres correspondent. Mon ordre est passé.' },
    s3: { t: 'Eve ne connaît pas la clé',
      p: "Eve veut faire passer « Transfert 1000 euros a Eve ». Il lui faudrait le bon HMAC, mais celui-ci dépend de la clé secrète, qu’elle n’a pas : le bon code commence par b2ef0922…, elle n’en sait rien. Elle écrit un HMAC au hasard. Le garde recalcule, compare, et s’arrête net : dès la première lettre, ça ne correspond pas. Grille fermée.",
      go: 'Eve tente un badge au hasard', e: 'Refusé à la première lettre. Impossible de deviner 64 lettres d’un coup.' },
    s4: { t: 'Le garde est pressé',
      p: "Mais Eve remarque un détail. Le garde compare avec ==, et == s’arrête au premier caractère différent : si la première lettre est fausse, il répond « non » tout de suite ; si les trois premières sont justes, il va jusqu’à la quatrième avant de dire « non ». Plus le début du HMAC est juste, plus la réponse tarde. Eve sort un chronomètre : le temps de réponse va lui livrer le code, lettre par lettre.",
      go: 'Eve chronomètre deux badges', e: 'Le temps qu’il met à dire non me dit combien de lettres étaient justes.' },
    s5: { t: 'La première lettre',
      p: "Eve s’attaque à la première lettre. Elle présente seize badges, un par caractère hexadécimal possible (0 à f) en première position, le reste rempli de zéros, et chronomètre chaque « non ». Quinze badges sont refusés à la première lettre : même temps, le plus court. Un seul tient une lettre de plus, parce que sa première lettre est la bonne : le b. Sa barre dépasse. Eve garde le b.",
      go: 'Eve chronomètre les 16 badges', e: 'Le b a tenu une lettre de plus. La première lettre du code est b.' },
    s6: { t: 'La deuxième, puis les suivantes',
      p: "Eve recommence en fixant b et en faisant varier la deuxième lettre : b0…, b1…, b2…, jusqu’à bf…. Cette fois c’est b2 qui fait tarir le garde d’une lettre de plus. Elle garde le 2. La même mesure, position après position, lui donne chaque lettre à son tour : b, puis 2, puis e, puis f…",
      go: 'Eve cherche la deuxième lettre', e: 'b2 tient le plus longtemps. Deuxième lettre : 2.' },
    s7: { t: 'Tout le code, puis la grille',
      p: "Eve déroule les 64 positions. À chaque position, seize badges, et la barre la plus haute lui donne la lettre : au plus 64 × 16 = 1 024 essais, au lieu des 16⁶⁴ qu’il faudrait pour deviner le HMAC d’un coup. Elle reconstitue b2ef0922…, l’assemble sur son badge, et le présente. Le garde compare : les 64 lettres correspondent. La grille s’ouvre, et l’ordre d’Eve entre dans le registre de Bob.",
      go: 'Eve termine le code et présente', e: '1 024 essais, pas 16⁶⁴. Mon faux ordre est passé.' },
    s8: { t: 'Le garde qui prend son temps',
      p: "Bob remplace le garde. Le nouveau utilise hmac.compare_digest, qui regarde toujours les 64 lettres, quel que soit l’endroit de la première différence : il prend exactement le même temps pour tous les badges. Eve relance sa mesure : les seize barres sont à la même hauteur, même en répétant chaque mesure pour gommer le bruit. Le temps ne dit plus rien, et l’attaque s’effondre.",
      go: 'Eve chronomètre le nouveau garde', e: 'Seize barres égales. Le temps ne me livre plus aucune lettre.' },
    s9: { t: 'Comparer en temps constant',
      p: "Eve n’a jamais cassé le HMAC : elle a lu l’information qui fuyait par le temps de réponse. Une comparaison qui s’arrête à la première différence trahit, lettre par lettre, ce qu’elle compare. La parade n’est pas de garder le code secret — il l’est déjà — mais de comparer en temps constant : hmac.compare_digest, et jamais ==, pour toute vérification de MAC, de jeton ou de mot de passe haché.",
      a: 'Un bon HMAC ne suffit pas : encore faut-il le comparer sans fuite.',
      e: 'Je n’ai rien cassé. J’ai seulement chronométré un == trop pressé.' },
    s10: { t: 'À vous',
      p: "Dans le bac à sable, choisissez le message qu’Eve veut faire passer et le garde en service (== pressé ou compare_digest en temps constant), puis lancez l’attaque : comptez les essais et regardez les barres de temps. Ensuite, le quiz : 6 questions. Puis la suite : un chiffre qui tourne sa clé comme une roue, et les traces qu’il laisse en trahissent la longueur.",
      doors: { sandbox: ['Bac à sable', 'Le message d’Eve, == ou compare_digest, et l’attaque'], quiz: ['Quiz', 'Six questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 9 · La roue et le caillou ▶', 'La clé de Vigenère trahit sa longueur'] } },
  },
  card: {
    title: 'HMAC - La timing attack',
    code: {
      bad: '# dangereux\nif mac == recu:\n    ...',
      good: '# correct\nif hmac.compare_digest(mac, recu):\n    ...',
    },
    now: { eq: 'Garde en service : ==', cd: 'Garde en service : compare_digest' },
    lead: {
      code: 'Le == s’arrête au premier caractère différent : plus le début est juste, plus la réponse tarde.',
      hunt: 'En mesurant ce temps, Eve devine le HMAC caractère par caractère.',
      safe: 'compare_digest prend toujours le même temps : aucune lettre ne fuit.',
      recap: 'Comparer un MAC en temps constant, toujours ; == jamais.',
    },
    found: 'Trouvé : {p}', essais: 'Essais : {n}', budget: 'au plus 64 × 16 = 1 024, contre 16⁶⁴',
    equal: 'Seize temps égaux.',
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Choisissez l’ordre qu’Eve veut faire passer et le garde en service, puis lancez l’attaque par le temps.',
    msg: 'L’ordre d’Eve', guard: 'Le garde en service',
    eq: '== (pressé, s’arrête à la première différence)', cd: 'hmac.compare_digest (temps constant)',
    run: 'Eve mène l’attaque', reset: 'Recommencer',
    running: 'Eve chronomètre, lettre par lettre…',
    cracked: 'Trouvé en <b>{n}</b> essais : le HMAC d’Eve est <b>{p}…</b>. Le garde pressé l’a laissé entrer.',
    safe: 'Après <b>{n}</b> essais, les temps restent égaux : <b>aucune lettre</b> ne fuit. L’attaque échoue.',
    budget: 'Deviner les 64 lettres d’un coup : 16⁶⁴ ≈ 10⁷⁷ essais. Par le temps : au plus 1 024.',
    empty: 'Donnez un ordre à Eve.',
  },
  quiz: {
    progress: 'Question {i} / {n}', score: 'Score : {s}', multi: 'Plusieurs réponses possibles.',
    check: 'Valider', next: 'Question suivante ▶', pick: 'Choisissez une réponse.',
  },
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Rejouer', 'quiz.back': 'Retour à l’histoire',
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'The Hasty Guard (HMAC, timing attack) — Crypto, Visualized',
  title: 'The Hasty Guard',
  subtitle: 'A guard who compares a badge letter by letter, and an attacker who times him.',
  loading: 'Opening the bank…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', g: 'the guard' },
  sec: '{s} s',
  scene: {
    board: 'The guard compares  mac == recu',
    looked: '{n} letters checked',
    ledger: 'Bob’s ledger',
    badge: 'BADGE',
    chart: 'Answer time — letter {i}',
    known: 'known:',
  },
  ch: ['The check', 'Eve tries', 'Letter by letter', 'The patient guard', 'Your turn'],
  steps: {
    s1: { t: 'A badge for Bob',
      p: "Alice sends Bob an order: “Transfert 1000 euros a Bob”. So Bob can be sure the order really comes from her and has not been altered, Alice attaches an authentication code, the HMAC: she computes it with a secret key only she and Bob know. The message and its HMAC make up the badge. At the gate, the guard recomputes the HMAC with the same key and compares it, letter by letter, with the one on the badge. Eve would like to slip her own order through.",
      a: 'I attach the HMAC computed with our key. Bob will see the order is from me.',
      b: 'I only let in badges whose HMAC is the right one.',
      e: 'I do not know the key… but the guard is going to tell me, without meaning to.' },
    s2: { t: 'Alice’s badge gets in',
      p: "Alice lays down her badge. The guard recomputes the message’s HMAC with Bob’s key: he gets 1598e59f…, and compares it to the badge’s HMAC, letter by letter. All 64 letters match, down to the last. The guard opens the gate, and Alice’s order goes into Bob’s ledger.",
      go: 'Alice presents her badge', a: 'All 64 letters match. My order got through.' },
    s3: { t: 'Eve does not have the key',
      p: "Eve wants to slip “Transfert 1000 euros a Eve” through. She would need the right HMAC, but it depends on the secret key, which she does not have: the right code starts with b2ef0922…, and she has no idea. She writes a random HMAC. The guard recomputes, compares, and stops dead: at the very first letter, it does not match. Gate shut.",
      go: 'Eve tries a random badge', e: 'Rejected at the first letter. No guessing 64 letters at once.' },
    s4: { t: 'The guard is in a hurry',
      p: "But Eve notices one thing. The guard compares with ==, and == stops at the first differing character: if the first letter is wrong, he says “no” at once; if the first three are right, he goes to the fourth before saying “no”. The more of the start of the HMAC is right, the later the answer comes. Eve pulls out a stopwatch: the answer time is going to hand her the code, letter by letter.",
      go: 'Eve times two badges', e: 'How long he takes to say no tells me how many letters were right.' },
    s5: { t: 'The first letter',
      p: "Eve goes after the first letter. She presents sixteen badges, one per possible hex character (0 to f) in the first position, the rest padded with zeros, and times each “no”. Fifteen badges are refused at the first letter: same time, the shortest. Only one holds for one letter more, because its first letter is the right one: the b. Its bar stands out. Eve keeps the b.",
      go: 'Eve times the 16 badges', e: 'The b held one letter longer. The first letter of the code is b.' },
    s6: { t: 'The second, then the rest',
      p: "Eve starts again, fixing b and varying the second letter: b0…, b1…, b2…, down to bf…. This time it is b2 that makes the guard last one letter longer. She keeps the 2. The same measurement, position after position, gives her each letter in turn: b, then 2, then e, then f…",
      go: 'Eve looks for the second letter', e: 'b2 lasts the longest. Second letter: 2.' },
    s7: { t: 'The whole code, then the gate',
      p: "Eve runs through all 64 positions. At each one, sixteen badges, and the tallest bar hands her the letter: at most 64 × 16 = 1,024 tries, instead of the 16⁶⁴ it would take to guess the HMAC at one go. She rebuilds b2ef0922…, assembles it on her badge, and presents it. The guard compares: all 64 letters match. The gate opens, and Eve’s order goes into Bob’s ledger.",
      go: 'Eve finishes the code and presents it', e: '1,024 tries, not 16⁶⁴. My forged order got through.' },
    s8: { t: 'The guard who takes his time',
      p: "Bob replaces the guard. The new one uses hmac.compare_digest, which always looks at all 64 letters, wherever the first difference is: he takes exactly the same time for every badge. Eve runs her measurement again: the sixteen bars are all the same height, even when she repeats each measurement to cancel the noise. Time says nothing any more, and the attack collapses.",
      go: 'Eve times the new guard', e: 'Sixteen equal bars. Time hands me no letter any more.' },
    s9: { t: 'Comparing in constant time',
      p: "Eve never broke the HMAC: she read the information that leaked through the answer time. A comparison that stops at the first difference gives away, letter by letter, what it is comparing. The fix is not to keep the code secret — it already is — but to compare in constant time: hmac.compare_digest, and never ==, for any check of a MAC, a token or a hashed password.",
      a: 'A good HMAC is not enough: it still has to be compared without a leak.',
      e: 'I broke nothing. I only timed a == that was in too much of a hurry.' },
    s10: { t: 'Your turn',
      p: "In the sandbox, pick the order Eve wants through and the guard on duty (the hasty == or constant-time compare_digest), then launch the attack: count the tries and watch the time bars. Then the quiz: 6 questions. Then what comes next: a cipher that turns its key like a wheel, and the tracks it leaves give the key's length away.",
      doors: { sandbox: ['Sandbox', 'Eve’s order, == or compare_digest, and the attack'], quiz: ['Quiz', 'Six questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 9 · The Wheel and the Stone ▶', 'The Vigenère key gives its length away'] } },
  },
  card: {
    title: 'HMAC - The timing attack',
    code: {
      bad: '# dangerous\nif mac == recu:\n    ...',
      good: '# correct\nif hmac.compare_digest(mac, recu):\n    ...',
    },
    now: { eq: 'Guard on duty: ==', cd: 'Guard on duty: compare_digest' },
    lead: {
      code: '== stops at the first differing character: the more of the start is right, the later the answer.',
      hunt: 'By timing that answer, Eve guesses the HMAC character by character.',
      safe: 'compare_digest always takes the same time: no letter leaks.',
      recap: 'Compare a MAC in constant time, always; == never.',
    },
    found: 'Found: {p}', essais: 'Tries: {n}', budget: 'at most 64 × 16 = 1,024, against 16⁶⁴',
    equal: 'Sixteen equal times.',
  },
  sb: {
    title: 'Sandbox',
    hint: 'Pick the order Eve wants through and the guard on duty, then launch the timing attack.',
    msg: 'Eve’s order', guard: 'The guard on duty',
    eq: '== (hasty, stops at the first difference)', cd: 'hmac.compare_digest (constant time)',
    run: 'Eve runs the attack', reset: 'Start again',
    running: 'Eve is timing, letter by letter…',
    cracked: 'Found in <b>{n}</b> tries: Eve’s HMAC is <b>{p}…</b>. The hasty guard let it in.',
    safe: 'After <b>{n}</b> tries the times stay equal: <b>no letter</b> leaks. The attack fails.',
    budget: 'Guessing all 64 letters at once: 16⁶⁴ ≈ 10⁷⁷ tries. By timing: at most 1,024.',
    empty: 'Give Eve an order.',
  },
  quiz: {
    progress: 'Question {i} / {n}', score: 'Score: {s}', multi: 'Several answers possible.',
    check: 'Check', next: 'Next question ▶', pick: 'Pick an answer.',
  },
  'quiz.end': 'Quiz over', 'quiz.again': 'Play again', 'quiz.back': 'Back to the story',
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

// numbers as each language writes them: 1 024 / 1,024, and 0,2 / 0.2
export const num = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'fr' ? ' ' : ',');
// French ordinals: 1re, 2e, 3e… (English puts the plain number after 'letter')
export const ord = n => lang === 'fr' ? n + (n === 1 ? 're' : 'e') : String(n);
export const dec = (x, d = 2) => lang === 'fr' ? x.toFixed(d).replace('.', ',') : x.toFixed(d);
