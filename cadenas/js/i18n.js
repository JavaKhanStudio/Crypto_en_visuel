// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The words follow the course's slide « Deux clés - Le cadenas de Bob ».

const fr = {
  series: 'Crypto en visuel',
  tab: 'Le cadenas de Bob — Crypto en visuel',
  title: 'Le cadenas de Bob',
  subtitle: 'Tout le monde peut fermer le cadenas, seul Bob peut l’ouvrir.',
  loading: 'Bob forge ses cadenas…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Le messager' },
  label: { pub: 'clé publique', priv: 'clé privée' },
  ch: ['Le problème', 'Les cadenas de Bob', 'Alice ferme', 'Eve intercepte', 'Seul Bob'],
  steps: {
    s1: { t: 'Un secret pour Bob',
      p: "Alice veut envoyer un message secret à Bob, à l'autre bout du village. Tout ce qu'elle envoie passe par la route, et la route passe au pied de la tour d'Eve : Eve peut intercepter n'importe quel colis.",
      a: "J'ai un message pour Bob, et pour lui seul.", e: 'Tout ce qui passe sur cette route passe devant chez moi.' },
    s2: { t: 'Le paradoxe du coffre-fort',
      p: "Alice met son message dans une boîte et la ferme avec son propre cadenas. Mais :\n- si elle envoie la boîte fermée, Bob ne peut pas l'ouvrir ;\n- si elle envoie la clé avec, Eve prend les deux.",
      go: 'Envoyer la boîte fermée', go2: 'Envoyer la clé avec',
      b: "Fermée… et je n'ai pas la clé d'Alice.", e: 'Merci pour la clé !' },
    s3: { t: 'Bob fabrique des cadenas',
      p: "Bob a une autre idée. Il fabrique des cadenas, tous pareils, tous ouverts.\n- Pour en fermer un, il suffit de pousser ;\n- pour l'ouvrir, il faut une clé.\n\nCette clé, Bob en a une seule, et il la garde sur lui.",
      go: 'Revoir', b: "Des cadenas ouverts, autant qu'on en veut. Et une seule clé : la mienne." },
    s4: { t: 'Il les distribue partout',
      p: "Bob distribue ses cadenas ouverts partout : à Alice, aux voisins, et même à Eve. Ces cadenas sont sa clé publique : il peut les donner à tout le monde sans risque. Sa clé, il ne la donne à personne : c'est sa clé privée.",
      go: 'Revoir', e: 'Un cadenas de Bob ? Je le prends, merci.' },
    s5: { t: 'Alice ferme sa boîte',
      p: "Alice met son message dans la boîte, accroche un cadenas de Bob et pousse. Clic. Elle n'a eu besoin d'aucune clé pour fermer.",
      go: 'Fermer le cadenas', a: 'Clic. Fermé.' },
    s6: { t: "Même Alice ne peut plus l'ouvrir",
      p: "Le cadenas fermé, même Alice ne peut plus rouvrir sa boîte : elle n'a pas la clé de Bob. Ce n'est pas grave, elle connaît son message, et il est pour Bob.",
      go: 'Alice essaie de rouvrir', a: 'Et moi non plus, je ne peux plus l’ouvrir !' },
    s7: { t: 'Eve intercepte la boîte',
      p: "Un messager emporte la boîte vers Bob. Au pied de sa tour, Eve l'arrête et prend la boîte.",
      go: 'Envoyer la boîte', e: 'À moi, cette boîte.' },
    s8: { t: 'Eve a le même cadenas',
      p: "Eve a reçu le même cadenas que tout le monde, et elle ne peut toujours pas ouvrir la boîte. Un cadenas ouvert sert à fermer, pas à ouvrir : avoir la clé publique de Bob ne donne pas sa clé privée.",
      go: 'Eve essaie avec son cadenas', e: 'J’ai le même cadenas… et il ne m’ouvre rien.' },
    s9: { t: 'Seul Bob peut ouvrir la boîte',
      p: "Eve ne peut rien tirer de la boîte et la laisse repartir. (Elle pourrait aussi la garder : Bob ne recevrait rien, mais Eve ne lirait rien non plus.) Seul Bob, à la réception, peut ouvrir la boîte d'Alice, avec la seule clé qui ouvre ses cadenas.",
      go: 'La boîte repart vers Bob', b: 'Mon cadenas, ma clé : la boîte s’ouvre.' },
    s10: { t: 'Clé publique, clé privée',
      p: "- La clé publique, c'est le cadenas ouvert : Bob la donne à tout le monde, et elle sert à fermer une boîte pour lui.\n- La clé privée, c'est la clé : Bob ne la donne à personne, et elle seule ouvre ce que ses cadenas ont fermé.\n\nPuis la suite : Alice et Bob fabriquent un secret commun en mélangeant des couleurs en public, sous les yeux d'Eve.",
      doors: { sandbox: ['Bac à sable', 'Fermez, envoyez, laissez Eve essayer'], quiz: ['Quiz', 'Six questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 3 · Les couleurs de Diffie-Hellman ▶', 'Un secret commun mélangé en public'] } },
  },
  sb: {
    title: 'Bac à sable',
    hint: "Fermez la boîte d'Alice, envoyez-la, et essayez de l'ouvrir à la place de chacun.",
    box: "La boîte d'Alice", lock: 'Fermer avec un cadenas de Bob', send: 'Envoyer vers Bob ▶',
    enemy: 'Eve', intercept: 'Eve intercepte la boîte en route', stolen: 'Eve a volé la clé de Bob',
    try: "Qui essaie d'ouvrir ?", reset: 'Recommencer',
    where: { a: 'La boîte est chez Alice.', e: 'La boîte est chez Eve.', b: 'La boîte est chez Bob.' },
    locked: 'Cadenas de Bob : fermé.', unlocked: 'Pas de cadenas fermé.', opened: 'La boîte est ouverte.',
    notHere: { a: "La boîte n'est pas chez Alice.", e: "La boîte n'est pas chez Eve.", b: "La boîte n'est pas chez Bob." },
    already: 'Déjà fermée.', gone: "Le cadenas ne se pose que chez Alice, avant l'envoi.", atBob: 'Elle est déjà chez Bob.',
    isOpen: 'Elle est déjà ouverte.',
    openNoLock: 'Pas de cadenas : la boîte s’ouvre sans effort, pour n’importe qui.',
    okB: 'Bob ouvre la boîte : sa clé ouvre ses cadenas.',
    failA: "Alice n'a pas la clé de Bob : elle ne peut plus rouvrir sa boîte.",
    failE: "Le cadenas d'Eve ne l'aide pas : pour ouvrir, il faut la clé.",
    okE: 'Avec la clé volée, Eve ouvre la boîte. Une clé privée volée, et tout est compromis.',
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
  tab: 'Bob’s Padlock — Crypto, Visualized',
  title: 'Bob’s Padlock',
  subtitle: 'Anyone can snap the padlock shut, only Bob can open it.',
  loading: 'Bob is forging his padlocks…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'The courier' },
  label: { pub: 'public key', priv: 'private key' },
  ch: ['The problem', 'Bob’s padlocks', 'Alice locks', 'Eve intercepts', 'Only Bob'],
  steps: {
    s1: { t: 'A secret for Bob',
      p: 'Alice wants to send a secret message to Bob, at the other end of the village. Everything she sends goes along the road, and the road runs at the foot of Eve’s tower: Eve can grab any parcel.',
      a: 'I have a message for Bob, and for him alone.', e: 'Everything on this road goes past my door.' },
    s2: { t: 'The safe paradox',
      p: 'Alice puts her message in a box and locks it with her own padlock. But:\n- if she sends the box locked, Bob cannot open it;\n- if she sends the key along, Eve takes both.',
      go: 'Send the locked box', go2: 'Send the key along',
      b: 'Locked… and I don’t have Alice’s key.', e: 'Thanks for the key!' },
    s3: { t: 'Bob makes padlocks',
      p: 'Bob has another idea. He makes padlocks, all alike, all open.\n- To lock one, you just push;\n- to open it, you need a key.\n\nBob has exactly one such key, and he keeps it on him.',
      go: 'Replay', b: 'Open padlocks, as many as you like. And one key: mine.' },
    s4: { t: 'He hands them out everywhere',
      p: 'Bob hands out his open padlocks everywhere: to Alice, to the neighbours, even to Eve. These padlocks are his public key: he can give them to anyone without risk. His key he gives to no one: it is his private key.',
      go: 'Replay', e: 'One of Bob’s padlocks? I’ll take it, thanks.' },
    s5: { t: 'Alice locks her box',
      p: 'Alice puts her message in the box, hooks one of Bob’s padlocks on it and pushes. Click. She needed no key to lock it.',
      go: 'Snap the padlock shut', a: 'Click. Locked.' },
    s6: { t: 'Not even Alice can open it',
      p: 'Once the padlock is shut, not even Alice can reopen her box: she does not have Bob’s key. That is fine: she knows her message, and it is meant for Bob.',
      go: 'Alice tries to reopen it', a: 'And I can’t open it anymore either!' },
    s7: { t: 'Eve intercepts the box',
      p: 'A courier carries the box towards Bob. At the foot of her tower, Eve stops him and takes the box.',
      go: 'Send the box', e: 'This box is mine.' },
    s8: { t: 'Eve has the same padlock',
      p: 'Eve got the same padlock as everyone else, and she still cannot open the box. An open padlock is for locking, not for opening: having Bob’s public key does not give you his private key.',
      go: 'Eve tries with her padlock', e: 'I have the very same padlock… and it opens nothing.' },
    s9: { t: 'Only Bob can open the box',
      p: 'Eve gets nothing out of the box and lets it go on. (She could also keep it: Bob would receive nothing, but Eve would read nothing either.) Only Bob, on arrival, can open Alice’s box, with the one key that opens his padlocks.',
      go: 'The box goes on to Bob', b: 'My padlock, my key: the box opens.' },
    s10: { t: 'Public key, private key',
      p: '- The public key is the open padlock: Bob gives it to everyone, and it is used to lock a box for him.\n- The private key is the key: Bob gives it to no one, and it alone opens what his padlocks have locked.\n\nThen what comes next: Alice and Bob make a shared secret by mixing colours in public, right under Eve’s eyes.',
      doors: { sandbox: ['Sandbox', 'Lock, send, let Eve try'], quiz: ['Quiz', 'Six questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 3 · Diffie-Hellman’s Colours ▶', 'A shared secret mixed in public'] } },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Lock Alice’s box, send it, and try to open it as each of them.',
    box: 'Alice’s box', lock: 'Lock it with one of Bob’s padlocks', send: 'Send to Bob ▶',
    enemy: 'Eve', intercept: 'Eve intercepts the box on the way', stolen: 'Eve has stolen Bob’s key',
    try: 'Who tries to open it?', reset: 'Start over',
    where: { a: 'The box is at Alice’s.', e: 'The box is at Eve’s.', b: 'The box is at Bob’s.' },
    locked: 'Bob’s padlock: shut.', unlocked: 'No padlock shut.', opened: 'The box is open.',
    notHere: { a: 'The box is not at Alice’s.', e: 'The box is not at Eve’s.', b: 'The box is not at Bob’s.' },
    already: 'Already locked.', gone: 'The padlock goes on at Alice’s, before sending.', atBob: 'It is already at Bob’s.',
    isOpen: 'It is already open.',
    openNoLock: 'No padlock: the box opens with no effort, for anyone.',
    okB: 'Bob opens the box: his key opens his padlocks.',
    failA: 'Alice does not have Bob’s key: she cannot reopen her box.',
    failE: 'Eve’s padlock does not help her: opening takes the key.',
    okE: 'With the stolen key, Eve opens the box. A stolen private key, and everything is compromised.',
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
