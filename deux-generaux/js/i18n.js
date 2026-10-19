// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].

const fr = {
  series: 'Crypto en visuel',
  tab: 'Deux généraux — Crypto en visuel',
  title: 'Le problème des deux généraux',
  subtitle: "Peut-on se mettre d'accord quand chaque message peut se perdre ?",
  loading: 'Construction des châteaux…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chroniqueur' },
  plan: "« attaque à l'aube »",

  // ladder
  'ladder.title': 'Qui sait quoi ?',
  'ladder.empty': "Pour l'instant, seule Alice connaît le plan.",
  'ladder.unknown': 'Niveau {n} : jamais garanti, le dernier messager peut toujours tomber.',
  'ladder.verdict0': 'Bob ignore même qu’il faut attaquer.',
  'ladder.verdict': "{who} ne sait pas si son dernier messager est arrivé : aucun des deux ne peut attaquer en étant certain que l'autre attaque aussi.",
  knows: (who, inner) => inner ? `${who} sait ${/^[AEIOUÉ]/.test(inner) ? "qu'" : 'que '}${inner}` : `${who} connaît le plan`,
  ellipsis: n => `… (${n} niveaux) …`,

  // messenger bubbles
  'm.capturedE': 'Capturé ! Ce message n’arrivera jamais.',
  'm.deliveredPlan': "Reçu : on attaque à l'aube !",
  'm.deliveredAck': 'Accusé n°{n} reçu.',
  'm.duplicate': 'Encore une copie du message n°{n}. Déjà reçu.',
  'm.nothingToAck': "Bob n'a rien reçu : il n'a rien à confirmer.",
  'm.busy': 'Un messager est déjà en route.',
  'm.burstResult': '{ok} messagers sur 10 sont passés. Il en suffisait d’un.',

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': 'Envoyez des messagers, réglez le danger, et regardez la certitude ne jamais arriver.',
  'sb.messengers': 'Messagers', 'sb.sendA': 'Alice envoie ▶', 'sb.sendB': '◀ Bob répond',
  'sb.auto': 'Protocole automatique', 'sb.burst': 'Rafale de 10',
  'sb.danger': 'Probabilité de capture', 'sb.nextCaught': 'Le prochain messager sera capturé',
  'sb.dawn': "L'aube", 'sb.rule': "Chaque général attaque s'il a reçu au moins", 'sb.ruleEnd': 'message(s)',
  'sb.dawnGo': 'Lever le soleil ☀', 'sb.reset': 'Réinitialiser', 'sb.follow': 'Suivre le messager',
  'sb.stats': 'Envoyés <b>{sent}</b> · arrivés <b>{ok}</b> · capturés <b>{lost}</b><br>Avec {p} % de capture, au moins un messager sur 10 passe avec une probabilité de <b>{burst}</b>.',
  'sb.autoStop': 'Le protocole s’arrête au premier messager perdu… et son expéditeur ne le sait pas.',

  // dawn outcomes
  'dawn.both': 'Victoire ! Alice et Bob attaquent ensemble.',
  'dawn.a': 'Défaite : Alice attaque seule, Bob attend.',
  'dawn.b': 'Défaite : Bob attaque seul, Alice attend.',
  'dawn.none': 'Personne n’attaque. Pas de défaite, pas de victoire : le siège continue.',

  // story
  ch: ['Le problème', 'Un messager', "L'accusé", 'La régression', 'Le monde réel', 'Et ensuite ?'],
  steps: {
    s1: { t: 'Deux armées, une ville', p: "Au fond de la vallée, la ville d'Eve. Sur les collines, deux armées alliées : celle d'Alice à l'ouest, celle de Bob à l'est. Seule, chacune se ferait écraser. Ensemble, elles prennent la ville.",
      e: 'La vallée est à moi. Personne ne la traverse sans que je le voie.' },
    s2: { t: 'Ensemble, ou pas du tout', p: "Alice et Bob doivent attaquer à la même heure. Ensemble, ils gagnent. Seul, un général perd son armée. Ne pas attaquer du tout vaut donc mieux qu'attaquer seul.",
      a: 'Je n’attaquerai que si je suis sûr que Bob attaque aussi.' },
    s3: { t: 'Un seul chemin', p: "Ni pigeon, ni signal : pour se parler, il faut un messager à cheval, et la seule route passe sous les murs d'Eve. Eve peut l'attraper, et l'expéditeur n'en saura rien.",
      e: 'Tout messager qui passe ici peut finir dans mes cachots.' },
    s4: { t: 'Alice envoie le plan', p: "Alice écrit « attaque à l'aube » et envoie un messager. Lancez-le et suivez-le jusqu'au château de Bob. Gare au projecteur rouge d'Eve : s'il éclaire le messager, celui-ci est capturé.", go: 'Envoyer le messager ▶',
      caught: 'Pris dans ma lumière ! Alice ne saura jamais qu’il n’est pas arrivé.' },
    s5: { t: 'Alice ne sait pas', p: "Bob connaît le plan. Mais de son château, Alice n'a aucun moyen de savoir si le messager est passé. S'il avait été capturé, Bob n'attaquerait pas, et Alice mourrait seule. Elle ne peut pas attaquer sur cette base.",
      a: 'Est-il arrivé ? Je n’en sais rien…' },
    s6: { t: 'Bob confirme', p: 'Bob renvoie un messager : « bien reçu ». C’est un accusé de réception. Lui aussi doit passer sous le projecteur d’Eve.', go: '◀ Bob envoie l’accusé',
      caught: 'Pris ! Et Bob croit son accusé en route…',
      a: 'Bob a le plan, je peux compter sur lui !' },
    s7: { t: 'Le doute a changé de camp', p: "Alice est rassurée. Mais c'est Bob qui doute maintenant : son accusé est-il arrivé ? S'il a été capturé, Alice, prudente, n'attaquera pas, et Bob attaquerait seul.",
      b: 'Et si mon messager a été pris ? Alice n’attaquera pas…' },
    s8: { t: "L'accusé de l'accusé", p: "Alors Alice accuse réception de l'accusé, puis Bob de celui-là, et ainsi de suite. Chaque messager arrivé ajoute un barreau à l'échelle « qui sait quoi ». Lancez quatre messagers.", go: 'Lancer 4 messagers',
      n: 'Six barreaux… et le dernier messager reste un doute pour celui qui l’a envoyé.' },
    s10: { t: 'Pourquoi c’est impossible', p: "Raisonnons par l'absurde. Prenez le plus court protocole qui garantirait l'accord. Son dernier messager peut être capturé. Si l'accord tient sans lui, ce messager ne servait à rien et il existe un protocole plus court : contradiction. S'il ne tient pas sans lui, le protocole ne garantit rien. Aucun nombre fini de messages ne suffit." },
    s11: { t: 'Doubler les messagers', p: "On renonce à la certitude et on vise la probabilité. Si Eve attrape un messager sur deux, en envoyer dix laisse une chance sur 1 024 qu'aucun ne passe. Envoyez-en dix.", go: 'Envoyer 10 messagers (capture 50 %)' },
    s12: { t: 'Ce que fait TCP', p: "Internet a le même problème : un paquet peut se perdre. TCP numérote, confirme (ACK) et renvoie après un délai. Il ouvre une connexion en trois messages, SYN, SYN-ACK, ACK, et s'arrête là : un quatrième ne donnerait pas la certitude non plus. Le doute est réduit et accepté, jamais éliminé.",
      tcp: 'SYN → SYN-ACK → ACK : trois messages, et un doute minuscule que tout Internet accepte.' },
    s13: { t: "L'aube", p: "Règle choisie : chaque général attaque s'il a reçu au moins un message. Alice a reçu l'accusé, Bob a reçu le plan. Levez le soleil, puis rejouez en perdant l'accusé.", go: 'Lever le soleil ☀', go2: "Rejouer : l'accusé est capturé" },
    tricks: { t: 'Eve a d’autres tours', p: "Jusqu'ici, Eve capturait les messagers : contre la perte, aucune clé ne peut rien. Mais elle peut faire pire, et contre ces quatre ruses, il y a la cryptographie. La suite de la série construit, épisode par épisode, le paquet que le messager emporte pour lui résister.",
      e: 'Capturer vos messagers ? Ce n’était que le début.',
      tiles: [['👁', 'Lire', "Elle ouvre l'ordre et apprend l'heure de l'attaque.", 'Épisodes 1.2 et 1.4'],
        ['✏️', 'Modifier', "Elle change un mot, puis laisse repartir le messager.", 'Épisode 1.3'],
        ['🎭', 'Se faire passer pour Alice', "Elle envoie un faux ordre, aux couleurs d'Alice.", 'Épisodes 1.3 et 1.6'],
        ['🔁', 'Rejouer', "Elle garde un vrai ordre et le renvoie plus tard.", 'Épisode 1.6']] },
    s17: { t: 'À vous', p: 'Le bac à sable vous laisse tout essayer : danger, rafales, protocole automatique, règle de l’aube. Le quiz vérifie ensuite ce qui reste.', go: 'Ouvrir le bac à sable', go2: 'Passer au quiz',
      n: 'Ce problème a été posé par Akkoyunlu, Ekanadham et Huber en 1975. Jim Gray lui donne son nom en 1978.' },
  },

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'Two Generals — Crypto, Visualized',
  title: 'The Two Generals’ Problem',
  subtitle: 'Can two parties agree when any message may be lost?',
  loading: 'Building the castles…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chronicler' },
  plan: '“attack at dawn”',

  'ladder.title': 'Who knows what?',
  'ladder.empty': 'For now, only Alice knows the plan.',
  'ladder.unknown': 'Level {n}: never guaranteed, the last messenger can always fall.',
  'ladder.verdict0': 'Bob does not even know there is an attack.',
  'ladder.verdict': '{who} does not know whether the last messenger arrived: neither can attack while certain the other will too.',
  knows: (who, inner) => inner ? `${who} knows that ${inner}` : `${who} knows the plan`,
  ellipsis: n => `… (${n} levels) …`,

  'm.capturedE': 'Caught! This message will never arrive.',
  'm.deliveredPlan': 'Received: we attack at dawn!',
  'm.deliveredAck': 'Acknowledgement #{n} received.',
  'm.duplicate': 'Another copy of message #{n}. Already have it.',
  'm.nothingToAck': 'Bob has received nothing: there is nothing to confirm.',
  'm.busy': 'A messenger is already on the road.',
  'm.burstResult': '{ok} messengers out of 10 got through. One was enough.',

  'sb.title': 'Sandbox',
  'sb.hint': 'Send messengers, set the danger, and watch certainty never arrive.',
  'sb.messengers': 'Messengers', 'sb.sendA': 'Alice sends ▶', 'sb.sendB': '◀ Bob replies',
  'sb.auto': 'Automatic protocol', 'sb.burst': 'Burst of 10',
  'sb.danger': 'Capture probability', 'sb.nextCaught': 'The next messenger will be caught',
  'sb.dawn': 'Dawn', 'sb.rule': 'Each general attacks after receiving at least', 'sb.ruleEnd': 'message(s)',
  'sb.dawnGo': 'Raise the sun ☀', 'sb.reset': 'Reset', 'sb.follow': 'Follow the messenger',
  'sb.stats': 'Sent <b>{sent}</b> · arrived <b>{ok}</b> · caught <b>{lost}</b><br>With {p}% capture, at least one of 10 messengers gets through with probability <b>{burst}</b>.',
  'sb.autoStop': 'The protocol stops at the first lost messenger… and its sender does not know.',

  'dawn.both': 'Victory! Alice and Bob attack together.',
  'dawn.a': 'Defeat: Alice attacks alone, Bob waits.',
  'dawn.b': 'Defeat: Bob attacks alone, Alice waits.',
  'dawn.none': 'Nobody attacks. No defeat, no victory: the siege goes on.',

  ch: ['The problem', 'One messenger', 'The ack', 'The regress', 'Real world', 'What’s next?'],
  steps: {
    s1: { t: 'Two armies, one city', p: 'In the valley lies Eve’s city. On the hills, two allied armies: Alice’s to the west, Bob’s to the east. Alone, either would be crushed. Together, they take the city.',
      e: 'The valley is mine. Nobody crosses it without me seeing.' },
    s2: { t: 'Together, or not at all', p: 'Alice and Bob must attack at the same hour. Together they win. Alone, a general loses their army. Not attacking at all is better than attacking alone.',
      a: 'I only attack if I am sure Bob attacks too.' },
    s3: { t: 'One road', p: 'No pigeons, no signals: to talk they need a messenger on horseback, and the only road runs under Eve’s walls. Eve can catch him, and the sender will never know.',
      e: 'Any messenger passing here may end up in my dungeons.' },
    s4: { t: 'Alice sends the plan', p: 'Alice writes “attack at dawn” and sends a messenger. Launch him and follow him to Bob’s castle. Beware Eve’s red searchlight: if it lights the messenger up, he is captured.', go: 'Send the messenger ▶',
      caught: 'Caught in my light! Alice will never know he did not arrive.' },
    s5: { t: 'Alice does not know', p: 'Bob knows the plan. But from her castle, Alice has no way to know the messenger got through. Had he been caught, Bob would not attack, and Alice would die alone. She cannot attack on that basis.',
      a: 'Did he arrive? I have no idea…' },
    s6: { t: 'Bob confirms', p: 'Bob sends a messenger back: “received”. That is an acknowledgement. It too must pass under Eve’s searchlight.', go: '◀ Bob sends the ack',
      caught: 'Caught! And Bob thinks his ack is on its way…',
      a: 'Bob has the plan, I can count on him!' },
    s7: { t: 'The doubt changed sides', p: 'Alice is reassured. But now Bob doubts: did his ack arrive? If it was caught, a careful Alice will not attack, and Bob would attack alone.',
      b: 'What if my messenger was taken? Alice won’t attack…' },
    s8: { t: 'The ack of the ack', p: 'So Alice acknowledges the ack, then Bob acknowledges that one, and so on. Each messenger that arrives adds a rung to the “who knows what” ladder. Launch four messengers.', go: 'Launch 4 messengers',
      n: 'Six rungs… and the last messenger is still a doubt for whoever sent it.' },
    s10: { t: 'Why it is impossible', p: 'Argue by contradiction. Take the shortest protocol that would guarantee agreement. Its last messenger can be caught. If agreement holds without it, that messenger was useless and a shorter protocol exists: contradiction. If it does not hold, the protocol guarantees nothing. No finite number of messages is enough.' },
    s11: { t: 'More messengers', p: 'We give up on certainty and aim for probability. If Eve catches one messenger in two, sending ten leaves a 1 in 1,024 chance that none gets through. Send ten.', go: 'Send 10 messengers (50% capture)' },
    s12: { t: 'What TCP does', p: 'The Internet has the same problem: a packet can be lost. TCP numbers, acknowledges (ACK) and resends after a timeout. It opens a connection in three messages, SYN, SYN-ACK, ACK, and stops there: a fourth would not bring certainty either. The doubt is reduced and accepted, never removed.',
      tcp: 'SYN → SYN-ACK → ACK: three messages, and a tiny doubt the whole Internet accepts.' },
    s13: { t: 'Dawn', p: 'Chosen rule: each general attacks after receiving at least one message. Alice received the ack, Bob received the plan. Raise the sun, then replay with the ack lost.', go: 'Raise the sun ☀', go2: 'Replay: the ack is caught' },
    tricks: { t: 'Eve has other tricks', p: 'So far Eve caught messengers: against loss, no key can help. But she can do worse, and against these four tricks there is cryptography. The rest of the series builds, episode by episode, the packet the messenger carries to resist her.',
      e: 'Catching your messengers? That was only the start.',
      tiles: [['👁', 'Read', 'She opens the order and learns the hour of the attack.', 'Episodes 1.2 and 1.4'],
        ['✏️', 'Modify', 'She changes a word, then lets the messenger go on.', 'Episode 1.3'],
        ['🎭', 'Pretend to be Alice', 'She sends a forged order, in Alice’s colours.', 'Episodes 1.3 and 1.6'],
        ['🔁', 'Replay', 'She keeps a real order and sends it again later.', 'Episode 1.6']] },
    s17: { t: 'Your turn', p: 'The sandbox lets you try everything: danger, bursts, the automatic protocol, the dawn rule. Then the quiz checks what stuck.', go: 'Open the sandbox', go2: 'Take the quiz',
      n: 'Akkoyunlu, Ekanadham and Huber posed this problem in 1975. Jim Gray named it in 1978.' },
  },

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
