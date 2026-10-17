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
  who: { a: 'Arnaud', b: 'Bastien', e: 'Étienne', n: 'Chroniqueur' },
  plan: "« attaque à l'aube »",

  // ladder
  'ladder.title': 'Qui sait quoi ?',
  'ladder.empty': "Pour l'instant, seul Arnaud connaît le plan.",
  'ladder.unknown': 'Niveau {n} : jamais garanti, le dernier messager peut toujours tomber.',
  'ladder.verdict0': 'Bastien ignore même qu’il faut attaquer.',
  'ladder.verdict': "{who} ne sait pas si son dernier messager est arrivé : aucun des deux ne peut attaquer en étant certain que l'autre attaque aussi.",
  'ladder.forged': "Bastien croit aussi un faux ordre : « attaque à minuit ».",
  knows: (who, inner) => inner ? `${who} sait ${/^[AEIOUÉ]/.test(inner) ? "qu'" : 'que '}${inner}` : `${who} connaît le plan`,
  ellipsis: n => `… (${n} niveaux) …`,

  // messenger bubbles
  'm.capturedE': 'Capturé ! Ce message n’arrivera jamais.',
  'm.deliveredPlan': "Reçu : on attaque à l'aube !",
  'm.deliveredAck': 'Accusé n°{n} reçu.',
  'm.duplicate': 'Encore une copie du message n°{n}. Déjà reçu.',
  'm.forgedAccepted': "Ordre d'Arnaud : attaque à minuit !",
  'm.forgedRejected': 'Sceau HMAC invalide : faux ordre rejeté.',
  'm.forgedE': 'Un de mes cavaliers, aux couleurs d’Arnaud…',
  'm.nothingToAck': "Bastien n'a rien reçu : il n'a rien à confirmer.",
  'm.busy': 'Un messager est déjà en route.',
  'm.burstResult': '{ok} messagers sur 10 sont passés. Il en suffisait d’un.',

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': 'Envoyez des messagers, réglez le danger, et regardez la certitude ne jamais arriver.',
  'sb.messengers': 'Messagers', 'sb.sendA': 'Arnaud envoie ▶', 'sb.sendB': '◀ Bastien répond',
  'sb.auto': 'Protocole automatique', 'sb.burst': 'Rafale de 10',
  'sb.danger': 'Probabilité de capture', 'sb.nextCaught': 'Le prochain messager sera capturé',
  'sb.enemy': "L'ennemi triche", 'sb.forge': 'Envoyer un faux messager',
  'sb.hmac': 'Les généraux scellent leurs messages (HMAC, clé convenue avant la guerre)',
  'sb.dawn': "L'aube", 'sb.rule': "Chaque général attaque s'il a reçu au moins", 'sb.ruleEnd': 'message(s)',
  'sb.dawnGo': 'Lever le soleil ☀', 'sb.reset': 'Réinitialiser', 'sb.follow': 'Suivre le messager',
  'sb.stats': 'Envoyés <b>{sent}</b> · arrivés <b>{ok}</b> · capturés <b>{lost}</b><br>Avec {p} % de capture, au moins un messager sur 10 passe avec une probabilité de <b>{burst}</b>.',
  'sb.autoStop': 'Le protocole s’arrête au premier messager perdu… et son expéditeur ne le sait pas.',

  // dawn outcomes
  'dawn.both': 'Victoire ! Arnaud et Bastien attaquent ensemble.',
  'dawn.a': 'Défaite : Arnaud attaque seul, Bastien attend.',
  'dawn.b': 'Défaite : Bastien attaque seul, Arnaud attend.',
  'dawn.none': 'Personne n’attaque. Pas de défaite, pas de victoire : le siège continue.',
  'dawn.forged': 'Défaite : Bastien a attaqué à minuit, sur un faux ordre.',

  // story
  ch: ['Le problème', 'Un messager', "L'accusé", 'La régression', 'Le monde réel', 'Et la crypto ?'],
  steps: {
    s1: { t: 'Deux armées, une ville', p: "Au fond de la vallée, la ville d'Étienne. Sur les collines, deux armées alliées : celle d'Arnaud à l'ouest, celle de Bastien à l'est. Seule, chacune se ferait écraser. Ensemble, elles prennent la ville.",
      e: 'La vallée est à moi. Personne ne la traverse sans que je le voie.' },
    s2: { t: 'Ensemble, ou pas du tout', p: "Arnaud et Bastien doivent attaquer à la même heure. Ensemble, ils gagnent. Seul, un général perd son armée. Ne pas attaquer du tout vaut donc mieux qu'attaquer seul.",
      a: 'Je n’attaquerai que si je suis sûr que Bastien attaque aussi.' },
    s3: { t: 'Un seul chemin', p: "Ni pigeon, ni signal : pour se parler, il faut un messager à cheval, et la seule route passe sous les murs d'Étienne. Étienne peut l'attraper, et l'expéditeur n'en saura rien.",
      e: 'Tout messager qui passe ici peut finir dans mes cachots.' },
    s4: { t: 'Arnaud envoie le plan', p: "Arnaud écrit « attaque à l'aube » et envoie un messager. Lancez-le et suivez-le jusqu'au château de Bastien.", go: 'Envoyer le messager ▶' },
    s5: { t: 'Arnaud ne sait pas', p: "Bastien connaît le plan. Mais de son château, Arnaud n'a aucun moyen de savoir si le messager est passé. S'il avait été capturé, Bastien n'attaquerait pas, et Arnaud mourrait seul. Il ne peut pas attaquer sur cette base.",
      a: 'Est-il arrivé ? Je n’en sais rien…' },
    s6: { t: 'Bastien confirme', p: 'Bastien renvoie un messager : « bien reçu ». C’est un accusé de réception.', go: '◀ Bastien envoie l’accusé',
      a: 'Bastien a le plan, je peux compter sur lui !' },
    s7: { t: 'Le doute a changé de camp', p: "Arnaud est rassuré. Mais c'est Bastien qui doute maintenant : son accusé est-il arrivé ? S'il a été capturé, Arnaud, prudent, n'attaquera pas, et Bastien attaquerait seul.",
      b: 'Et si mon messager a été pris ? Arnaud n’attaquera pas…' },
    s8: { t: "L'accusé de l'accusé", p: "Alors Arnaud accuse réception de l'accusé, puis Bastien de celui-là, et ainsi de suite. Chaque messager arrivé ajoute un barreau à l'échelle « qui sait quoi ». Lancez quatre messagers.", go: 'Lancer 4 messagers',
      n: 'Six barreaux… et le dernier messager reste un doute pour celui qui l’a envoyé.' },
    s9: { t: 'Le dernier messager', p: "Quelle que soit la longueur de l'échange, le dernier messager peut être capturé, et son expéditeur ne peut pas le savoir. Rejouez la scène : cette fois, Étienne attrape le troisième.", go: 'Rejouer : Étienne attrape le 3ᵉ' },
    s10: { t: 'Pourquoi c’est impossible', p: "Raisonnons par l'absurde. Prenez le plus court protocole qui garantirait l'accord. Son dernier messager peut être capturé. Si l'accord tient sans lui, ce messager ne servait à rien et il existe un protocole plus court : contradiction. S'il ne tient pas sans lui, le protocole ne garantit rien. Aucun nombre fini de messages ne suffit.",
      n: 'Akkoyunlu, Ekanadham et Huber, 1975. Jim Gray lui donne son nom en 1978.' },
    s11: { t: 'Doubler les messagers', p: "On renonce à la certitude et on vise la probabilité. Si Étienne attrape un messager sur deux, en envoyer dix laisse une chance sur 1 024 qu'aucun ne passe. Envoyez-en dix.", go: 'Envoyer 10 messagers (capture 50 %)' },
    s12: { t: 'Ce que fait TCP', p: "Internet a le même problème : un paquet peut se perdre. TCP numérote, confirme (ACK) et renvoie après un délai. Il ouvre une connexion en trois messages, SYN, SYN-ACK, ACK, et s'arrête là : un quatrième ne donnerait pas la certitude non plus. Le doute est réduit et accepté, jamais éliminé.",
      tcp: 'SYN → SYN-ACK → ACK : trois messages, et un doute minuscule que tout Internet accepte.' },
    s13: { t: "L'aube", p: "Règle choisie : chaque général attaque s'il a reçu au moins un message. Arnaud a reçu l'accusé, Bastien a reçu le plan. Levez le soleil, puis rejouez en perdant l'accusé.", go: 'Lever le soleil ☀', go2: "Rejouer : l'accusé est capturé" },
    s14: { t: 'Étienne change de tactique', p: "Jusqu'ici Étienne attrapait les messagers. Il peut faire pire : habiller un de ses cavaliers aux couleurs d'Arnaud et porter à Bastien un faux ordre, « attaque à minuit ». Bastien n'a aucun moyen de reconnaître le faux.", go: 'Envoyer le faux messager' },
    s15: { t: 'Sceller le message', p: "Avant la guerre, Arnaud et Bastien ont convenu d'une clé secrète. Chaque ordre porte un HMAC calculé avec cette clé. Étienne, qui n'a pas la clé, ne peut pas produire un sceau valide : Bastien rejette le faux à sa porte.", go: 'Rejouer avec le HMAC' },
    s16: { t: 'Ce que la crypto ne fait pas', p: "Le HMAC protège l'intégrité et l'authenticité : un ordre accepté vient de quelqu'un qui a la clé, et n'a pas été modifié. Il ne ramène pas un messager capturé : la perte reste le problème des deux généraux, aucune clé ne le résout. Et si Étienne renvoyait plus tard un vrai ordre capturé, il passerait encore le HMAC : il faut un numéro ou une date contre le rejeu.",
      b: 'Le sceau me dit qui a écrit. Il ne me dit pas ce qui ne m’est jamais parvenu.' },
    s17: { t: 'À vous', p: 'Le bac à sable vous laisse tout essayer : danger, rafales, faux messagers, règle de l’aube. Le quiz vérifie ensuite ce qui reste.', go: 'Ouvrir le bac à sable', go2: 'Passer au quiz' },
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
  who: { a: 'Arnaud', b: 'Bastien', e: 'Étienne', n: 'Chronicler' },
  plan: '“attack at dawn”',

  'ladder.title': 'Who knows what?',
  'ladder.empty': 'For now, only Arnaud knows the plan.',
  'ladder.unknown': 'Level {n}: never guaranteed, the last messenger can always fall.',
  'ladder.verdict0': 'Bastien does not even know there is an attack.',
  'ladder.verdict': '{who} does not know whether the last messenger arrived: neither can attack while certain the other will too.',
  'ladder.forged': 'Bastien also believes a forged order: “attack at midnight”.',
  knows: (who, inner) => inner ? `${who} knows that ${inner}` : `${who} knows the plan`,
  ellipsis: n => `… (${n} levels) …`,

  'm.capturedE': 'Caught! This message will never arrive.',
  'm.deliveredPlan': 'Received: we attack at dawn!',
  'm.deliveredAck': 'Acknowledgement #{n} received.',
  'm.duplicate': 'Another copy of message #{n}. Already have it.',
  'm.forgedAccepted': 'Order from Arnaud: attack at midnight!',
  'm.forgedRejected': 'Invalid HMAC seal: forged order rejected.',
  'm.forgedE': 'One of my riders, in Arnaud’s colours…',
  'm.nothingToAck': 'Bastien has received nothing: there is nothing to confirm.',
  'm.busy': 'A messenger is already on the road.',
  'm.burstResult': '{ok} messengers out of 10 got through. One was enough.',

  'sb.title': 'Sandbox',
  'sb.hint': 'Send messengers, set the danger, and watch certainty never arrive.',
  'sb.messengers': 'Messengers', 'sb.sendA': 'Arnaud sends ▶', 'sb.sendB': '◀ Bastien replies',
  'sb.auto': 'Automatic protocol', 'sb.burst': 'Burst of 10',
  'sb.danger': 'Capture probability', 'sb.nextCaught': 'The next messenger will be caught',
  'sb.enemy': 'The enemy cheats', 'sb.forge': 'Send a forged messenger',
  'sb.hmac': 'The generals seal their messages (HMAC, key agreed before the war)',
  'sb.dawn': 'Dawn', 'sb.rule': 'Each general attacks after receiving at least', 'sb.ruleEnd': 'message(s)',
  'sb.dawnGo': 'Raise the sun ☀', 'sb.reset': 'Reset', 'sb.follow': 'Follow the messenger',
  'sb.stats': 'Sent <b>{sent}</b> · arrived <b>{ok}</b> · caught <b>{lost}</b><br>With {p}% capture, at least one of 10 messengers gets through with probability <b>{burst}</b>.',
  'sb.autoStop': 'The protocol stops at the first lost messenger… and its sender does not know.',

  'dawn.both': 'Victory! Arnaud and Bastien attack together.',
  'dawn.a': 'Defeat: Arnaud attacks alone, Bastien waits.',
  'dawn.b': 'Defeat: Bastien attacks alone, Arnaud waits.',
  'dawn.none': 'Nobody attacks. No defeat, no victory: the siege goes on.',
  'dawn.forged': 'Defeat: Bastien attacked at midnight, on a forged order.',

  ch: ['The problem', 'One messenger', 'The ack', 'The regress', 'Real world', 'And crypto?'],
  steps: {
    s1: { t: 'Two armies, one city', p: 'In the valley lies Étienne’s city. On the hills, two allied armies: Arnaud’s to the west, Bastien’s to the east. Alone, either would be crushed. Together, they take the city.',
      e: 'The valley is mine. Nobody crosses it without me seeing.' },
    s2: { t: 'Together, or not at all', p: 'Arnaud and Bastien must attack at the same hour. Together they win. Alone, a general loses his army. Not attacking at all is better than attacking alone.',
      a: 'I only attack if I am sure Bastien attacks too.' },
    s3: { t: 'One road', p: 'No pigeons, no signals: to talk they need a messenger on horseback, and the only road runs under Étienne’s walls. Étienne can catch him, and the sender will never know.',
      e: 'Any messenger passing here may end up in my dungeons.' },
    s4: { t: 'Arnaud sends the plan', p: 'Arnaud writes “attack at dawn” and sends a messenger. Launch him and follow him to Bastien’s castle.', go: 'Send the messenger ▶' },
    s5: { t: 'Arnaud does not know', p: 'Bastien knows the plan. But from his castle, Arnaud has no way to know the messenger got through. Had he been caught, Bastien would not attack, and Arnaud would die alone. He cannot attack on that basis.',
      a: 'Did he arrive? I have no idea…' },
    s6: { t: 'Bastien confirms', p: 'Bastien sends a messenger back: “received”. That is an acknowledgement.', go: '◀ Bastien sends the ack',
      a: 'Bastien has the plan, I can count on him!' },
    s7: { t: 'The doubt changed sides', p: 'Arnaud is reassured. But now Bastien doubts: did his ack arrive? If it was caught, a careful Arnaud will not attack, and Bastien would attack alone.',
      b: 'What if my messenger was taken? Arnaud won’t attack…' },
    s8: { t: 'The ack of the ack', p: 'So Arnaud acknowledges the ack, then Bastien acknowledges that one, and so on. Each messenger that arrives adds a rung to the “who knows what” ladder. Launch four messengers.', go: 'Launch 4 messengers',
      n: 'Six rungs… and the last messenger is still a doubt for whoever sent it.' },
    s9: { t: 'The last messenger', p: 'However long the exchange, the last messenger can be caught, and its sender cannot know. Replay the scene: this time, Étienne catches the third.', go: 'Replay: Étienne catches the 3rd' },
    s10: { t: 'Why it is impossible', p: 'Argue by contradiction. Take the shortest protocol that would guarantee agreement. Its last messenger can be caught. If agreement holds without it, that messenger was useless and a shorter protocol exists: contradiction. If it does not hold, the protocol guarantees nothing. No finite number of messages is enough.',
      n: 'Akkoyunlu, Ekanadham and Huber, 1975. Jim Gray named it in 1978.' },
    s11: { t: 'More messengers', p: 'We give up on certainty and aim for probability. If Étienne catches one messenger in two, sending ten leaves a 1 in 1,024 chance that none gets through. Send ten.', go: 'Send 10 messengers (50% capture)' },
    s12: { t: 'What TCP does', p: 'The Internet has the same problem: a packet can be lost. TCP numbers, acknowledges (ACK) and resends after a timeout. It opens a connection in three messages, SYN, SYN-ACK, ACK, and stops there: a fourth would not bring certainty either. The doubt is reduced and accepted, never removed.',
      tcp: 'SYN → SYN-ACK → ACK: three messages, and a tiny doubt the whole Internet accepts.' },
    s13: { t: 'Dawn', p: 'Chosen rule: each general attacks after receiving at least one message. Arnaud received the ack, Bastien received the plan. Raise the sun, then replay with the ack lost.', go: 'Raise the sun ☀', go2: 'Replay: the ack is caught' },
    s14: { t: 'Étienne changes tactics', p: 'So far Étienne caught messengers. He can do worse: dress one of his riders in Arnaud’s colours and bring Bastien a forged order, “attack at midnight”. Bastien has no way to tell it is fake.', go: 'Send the forged messenger' },
    s15: { t: 'Seal the message', p: 'Before the war, Arnaud and Bastien agreed on a secret key. Each order carries an HMAC computed with it. Étienne, without the key, cannot produce a valid seal: Bastien rejects the forgery at his gate.', go: 'Replay with HMAC' },
    s16: { t: 'What crypto does not do', p: 'HMAC protects integrity and authenticity: an accepted order comes from someone holding the key, unaltered. It does not bring back a captured messenger: loss is still the two generals’ problem, and no key solves it. And if Étienne later re-sent a real captured order, it would still pass the HMAC: a number or a date is needed against replay.',
      b: 'The seal tells me who wrote. It cannot tell me what never reached me.' },
    s17: { t: 'Your turn', p: 'The sandbox lets you try everything: danger, bursts, forged messengers, the dawn rule. Then the quiz checks what stuck.', go: 'Open the sandbox', go2: 'Take the quiz' },
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
}
export function setLang(l) {
  lang = l; localStorage.setItem('dg-lang', l);
  applyStatic(); listeners.forEach(f => f(l));
}
export function onLang(f) { listeners.push(f); }
