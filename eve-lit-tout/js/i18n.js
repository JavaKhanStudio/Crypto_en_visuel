// Every visible word of episode 1.2 « Eve lit tout », in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Eve lit tout — Crypto en visuel',
  title: 'Eve lit tout',
  subtitle: "Eve lit l'ordre au passage. Alice le chiffre avec AES-256-CBC.",
  loading: 'Construction des châteaux…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chroniqueur' },

  // what Eve and Bob say when a rider passes
  'm.readPlain': 'Je lis : « {m} ». Merci, cavalier, tu peux repartir.',
  'm.readCipher': 'Je lis… {h} … Rien. Je recopie quand même.',
  'm.seen': 'Ce chiffré, je l’ai déjà vu : octet pour octet le même.',
  'm.bobPlain': 'Reçu : « {m} ».',
  'm.bobCipher': 'Je déchiffre avec la clé, je retire le padding : « {m} ».',
  'm.busy': 'Un messager est déjà en route.',

  // the corner card
  card: {
    order: "L'ordre d'Alice", plainNote: 'En clair : quiconque tient le parchemin le lit.',
    key: 'La clé (32 octets, 256 bits)', keyNote: 'Tirée au hasard. Alice et Bob l’ont, Eve non.',
    aes: 'AES sur un bloc', aesNote: '16 octets et la clé entrent, 16 octets sortent.',
    blocks: "L'ordre en blocs de 16 octets", padNote: '{n} octets, plus {k} octets de padding qui valent {k} ({h} en hexadécimal).', padNote1: '{n} octets, plus 1 octet de padding qui vaut 1 (01 en hexadécimal).',
    cbc: 'CBC : chaque bloc mélangé au précédent', iv: 'IV (16 octets, en clair)',
    step1: 'P1 ⊕ IV → AES → C1', step2: 'P2 ⊕ C1 → AES → C2',
    cipher: 'Ce qui voyage : IV + chiffré', cipherNote: 'Bob déchiffre avec la clé et retire le padding.',
    notebook: "Le carnet d'Eve", day: 'Jour {n}', same: 'le même !', other: 'rien en commun',
    packet: 'Le paquet du projet', have: 'là', later: 'épisode {n}',
    bricks: { k: 'clés (RSA-OAEP)', iv: 'IV', ct: 'chiffré AES-256-CBC', mac: 'HMAC-SHA256' },
    plain: 'en clair', withKey: 'avec la clé', keyShort: 'La clé',
  },

  // story
  ch: ['Eve lit', 'AES', 'Neuf à chaque envoi', 'Le paquet'],
  steps: {
    intro: { t: 'Eve change de tactique', p: "Dans l'épisode 1.1, Eve capturait les messagers. Mais un messager qui ne revient pas, Alice finit par le remarquer, et elle en renvoie un autre. Eve a trouvé mieux : arrêter le messager, lire l'ordre, et le laisser repartir. Personne ne saura qu'elle l'a lu.",
      e: 'Capturer un messager ? Alice en renvoie un autre. Le lire, c’est bien mieux.' },
    read: { t: "Eve lit l'ordre", p: "Alice envoie à Bob l'ordre « ATTAQUE DEMAIN A L'AUBE ». Lancez le messager : les gardes d'Eve l'arrêtent sous ses murs, Eve déroule le parchemin, le lit, et le laisse repartir. Bob reçoit l'ordre comme si de rien n'était.",
      go: 'Envoyer le messager ▶', e: 'Mes troupes seront prêtes à l’aube.' },
    why: { t: "La route n'est pas à eux", p: "Alice ne choisit pas la route : elle passe sous les murs d'Eve. Sur un réseau, c'est pareil : un message traverse des machines qui ne sont ni à Alice ni à Bob, et chacune peut le lire. Ce qu'il faut : que seul Bob puisse lire l'ordre, même quand Eve le tient entre ses mains. C'est la confidentialité.",
      n: 'On ne peut pas empêcher Eve de tenir le parchemin. On peut l’empêcher de le comprendre.' },
    key: { t: 'Une clé secrète', p: "Alice et Bob partagent une clé secrète : 32 octets tirés au hasard, soit 256 bits. Il existe 2²⁵⁶ clés possibles, un nombre à 78 chiffres : Eve ne peut pas toutes les essayer. Comment cette clé est arrivée chez Bob sans passer par Eve, c'est l'épisode 1.4. Pour l'instant, ils l'ont tous les deux, et Eve ne l'a pas.",
      a: 'Ma clé : 32 octets au hasard. Bob a exactement la même.' },
    aes: { t: 'AES, une boîte à 16 octets', p: "AES (Advanced Encryption Standard) prend 16 octets et la clé, et rend 16 octets qui ont l'air tirés au hasard. Avec la même clé, Bob fait le chemin inverse et retrouve les 16 octets de départ. Sans la clé, rien ne relie la sortie à l'entrée. AES travaille toujours ainsi, par blocs de 16 octets : ici, les 16 premiers octets de l'ordre.",
      a: 'Les 16 premiers octets de mon ordre entrent, 16 octets illisibles sortent.' },
    pad: { t: 'Des blocs de 16 octets : le padding', p: "L'ordre fait 23 octets : un octet par lettre, espaces et apostrophe compris. Il faut donc 2 blocs, et il manque 9 octets au second. Le padding PKCS7 les remplit avec 9 octets qui valent tous 9 (09 en hexadécimal). À l'arrivée, Bob lit le dernier octet, 09, et en retire 9. Si l'ordre tombait juste sur 16 octets, PKCS7 ajouterait un bloc entier de 16 octets qui valent 16 : le dernier octet dit toujours combien en retirer.",
      a: 'Deux blocs. Le second finit par neuf fois 09.' },
    cbc: { t: 'Chaîner les blocs : le mode CBC', p: "Chiffrer chaque bloc à part trahirait les blocs qui se répètent : l'épisode 6, le pingouin, le montre. En mode CBC, chaque bloc est d'abord mélangé au bloc chiffré d'avant par un XOR (⊕ : chaque bit est inversé là où l'autre bloc a un 1), puis passé à AES. Le premier bloc n'a pas de bloc d'avant : on le mélange à l'IV, 16 octets tirés au hasard. L'IV n'est pas secret : il voyage en clair avec le chiffré, car Bob en a besoin pour déchiffrer.",
      a: 'P1 ⊕ IV, puis AES : C1. P2 ⊕ C1, puis AES : C2.' },
    cipher: { t: 'Eve lit… du bruit', p: "Alice envoie l'IV et le chiffré : 48 octets. Lancez le messager. Eve l'arrête et déroule le parchemin comme avant, mais sans la clé, elle ne lit que des octets au hasard. Bob, lui, a la clé : il déchiffre, retire le padding, et lit l'ordre.",
      go: 'Envoyer le messager ▶' },
    again: { t: 'Le lendemain, le même ordre', p: "Hier, Alice et Bob ont attaqué à l'aube, et Eve l'a vu : elle sait maintenant ce que voulait dire le chiffré d'hier. Aujourd'hui, Alice renvoie le même ordre, avec la même clé et le même IV. Lancez le messager : Eve ne sait toujours pas lire, mais elle compare avec son carnet.",
      go: 'Envoyer le même ordre ▶', e: 'Le même chiffré qu’hier, et hier ils ont attaqué à l’aube. Je n’ai pas besoin de la clé.' },
    fresh: { t: 'Une clé neuve et un IV neuf', p: "Le correctif : à chaque envoi, une clé neuve et un IV neuf, tirés au hasard. Lancez le messager : le même ordre donne un chiffré qui n'a plus rien de commun avec celui d'hier, et Eve ne peut plus reconnaître un ordre qui revient. Un IV neuf suffirait déjà à changer le chiffré ; le projet tire aussi une clé neuve, et l'épisode 1.4 montre comment elle voyage jusqu'à Bob.",
      go: 'Envoyer avec une clé et un IV neufs ▶', e: 'Rien de commun avec hier. Est-ce le même ordre ? Je n’en sais rien.' },
    packet: { t: "Le paquet, jusqu'ici", p: "Ce qui voyage maintenant : l'IV (16 octets, en clair) et le chiffré (32 octets). C'est le début du paquet que vous construisez dans le projet. Deux briques manquent encore. Eve ne peut pas lire, mais elle peut changer un octet du chiffré, et Bob ne s'en apercevrait pas : c'est l'épisode 1.3. Et la clé neuve doit arriver chez Bob sans qu'Eve la lise : c'est l'épisode 1.4.",
      e: 'Je ne sais plus lire. Mais qui m’empêche de changer un octet ?', link: 'Épisode 1.3 : l’octet changé ▶' },
    end: { t: 'À vous', p: "Dans le bac à sable, écrivez votre propre ordre, regardez ses blocs et son padding, et envoyez-le en clair, avec la même clé, ou avec une clé et un IV neufs : le carnet d'Eve montre ce qu'elle reconnaît. Pour voir de près pourquoi on chaîne les blocs, et ce qui arrive sans CBC, l'épisode 6, le pingouin, entre dans le détail.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz', link: 'Épisode 6 : le pingouin ▶' },
  },

  // sandbox
  'sb.title': 'Bac à sable',
  'sb.hint': "Écrivez un ordre, choisissez comment Alice l'envoie, et regardez ce qu'Eve en tire.",
  'sb.order': "L'ordre", 'sb.how': 'Alice envoie',
  'sb.plain': 'en clair', 'sb.same': 'chiffré, toujours la même clé et le même IV', 'sb.fresh': 'chiffré, une clé et un IV neufs à chaque envoi',
  'sb.send': 'Envoyer le messager ▶', 'sb.reset': 'Vider le carnet d’Eve',
  'sb.stats': 'Envoyés <b>{sent}</b> · lus par Eve <b>{read}</b> · reconnus par Eve <b>{seen}</b>',
  'sb.empty': 'Écrivez un ordre d’abord.',

  // quiz
  'quiz.check': 'Valider', 'quiz.next': 'Question suivante ▶', 'quiz.progress': 'Question {i} / {n}',
  'quiz.score': 'Score : {s}', 'quiz.multi': 'Plusieurs réponses', 'quiz.pick': 'Choisissez au moins une réponse.',
  'quiz.end': 'Quiz terminé', 'quiz.again': 'Recommencer', 'quiz.back': "Revoir l'histoire",
  'quiz.endText': '{s} bonne(s) réponse(s) sur {n}.',
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'Eve Reads Everything — Crypto, Visualized',
  title: 'Eve Reads Everything',
  subtitle: 'Eve reads the order on its way. Alice encrypts it with AES-256-CBC.',
  loading: 'Building the castles…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Chronicler' },

  'm.readPlain': 'I read: “{m}”. Thank you, rider, you may go on.',
  'm.readCipher': 'I read… {h} … Nothing. I copy it down all the same.',
  'm.seen': 'I have seen this ciphertext before: the same, byte for byte.',
  'm.bobPlain': 'Received: “{m}”.',
  'm.bobCipher': 'I decrypt with the key, I strip the padding: “{m}”.',
  'm.busy': 'A messenger is already on the road.',

  card: {
    order: "Alice's order", plainNote: 'In the clear: whoever holds the scroll reads it.',
    key: 'The key (32 bytes, 256 bits)', keyNote: 'Drawn at random. Alice and Bob have it, Eve does not.',
    aes: 'AES on one block', aesNote: '16 bytes and the key go in, 16 bytes come out.',
    blocks: 'The order in 16-byte blocks', padNote: '{n} bytes, plus {k} bytes of padding worth {k} ({h} in hexadecimal).', padNote1: '{n} bytes, plus 1 byte of padding worth 1 (01 in hexadecimal).',
    cbc: 'CBC: each block mixed with the one before', iv: 'IV (16 bytes, in the clear)',
    step1: 'P1 ⊕ IV → AES → C1', step2: 'P2 ⊕ C1 → AES → C2',
    cipher: 'What travels: IV + ciphertext', cipherNote: 'Bob decrypts with the key and strips the padding.',
    notebook: "Eve's notebook", day: 'Day {n}', same: 'the same!', other: 'nothing in common',
    packet: "The project's packet", have: 'in', later: 'episode {n}',
    bricks: { k: 'keys (RSA-OAEP)', iv: 'IV', ct: 'AES-256-CBC ciphertext', mac: 'HMAC-SHA256' },
    plain: 'in the clear', withKey: 'with the key', keyShort: 'The key',
  },

  ch: ['Eve reads', 'AES', 'Fresh every time', 'The packet'],
  steps: {
    intro: { t: 'Eve changes tactics', p: 'In episode 1.1, Eve captured the messengers. But a messenger who never comes back, Alice ends up noticing, and she sends another. Eve has found better: stop the messenger, read the order, and let him go on. Nobody will know she read it.',
      e: 'Capture a messenger? Alice sends another. Reading him is much better.' },
    read: { t: 'Eve reads the order', p: 'Alice sends Bob the order “ATTACK AT DAWN TOMORROW”. Launch the messenger: Eve\'s guards stop him under her walls, Eve unrolls the scroll, reads it, and lets him go on. Bob receives the order as if nothing had happened.',
      go: 'Send the messenger ▶', e: 'My troops will be ready at dawn.' },
    why: { t: 'The road is not theirs', p: 'Alice does not choose the road: it runs under Eve\'s walls. On a network it is the same: a message crosses machines that belong neither to Alice nor to Bob, and any of them can read it. What is needed: that only Bob can read the order, even when Eve holds it in her hands. That is confidentiality.',
      n: 'We cannot stop Eve from holding the scroll. We can stop her from understanding it.' },
    key: { t: 'A secret key', p: 'Alice and Bob share a secret key: 32 bytes drawn at random, that is 256 bits. There are 2²⁵⁶ possible keys, a 78-digit number: Eve cannot try them all. How this key reached Bob without passing Eve is episode 1.4. For now, they both have it, and Eve does not.',
      a: 'My key: 32 random bytes. Bob has exactly the same.' },
    aes: { t: 'AES, a 16-byte box', p: 'AES (the Advanced Encryption Standard) takes 16 bytes and the key, and gives back 16 bytes that look drawn at random. With the same key, Bob goes the other way and gets the original 16 bytes back. Without the key, nothing links the output to the input. AES always works this way, in 16-byte blocks: here, the first 16 bytes of the order.',
      a: 'The first 16 bytes of my order go in, 16 unreadable bytes come out.' },
    pad: { t: '16-byte blocks: the padding', p: 'The order is 23 bytes: one byte per letter, spaces included. So it takes 2 blocks, and the second is 9 bytes short. PKCS7 padding fills them with 9 bytes that are all worth 9 (09 in hexadecimal). On arrival, Bob reads the last byte, 09, and removes 9. If the order fell right on 16 bytes, PKCS7 would add a whole block of 16 bytes worth 16: the last byte always says how many to remove.',
      a: 'Two blocks. The second ends with nine times 09.' },
    cbc: { t: 'Chaining the blocks: CBC mode', p: 'Encrypting each block on its own would give away the blocks that repeat: episode 6, the penguin, shows it. In CBC mode, each block is first mixed with the ciphertext block before it by an XOR (⊕: each bit is flipped where the other block has a 1), then fed to AES. The first block has no block before it: it is mixed with the IV, 16 bytes drawn at random. The IV is not secret: it travels in the clear with the ciphertext, because Bob needs it to decrypt.',
      a: 'P1 ⊕ IV, then AES: C1. P2 ⊕ C1, then AES: C2.' },
    cipher: { t: 'Eve reads… noise', p: 'Alice sends the IV and the ciphertext: 48 bytes. Launch the messenger. Eve stops him and unrolls the scroll as before, but without the key she only reads random-looking bytes. Bob has the key: he decrypts, strips the padding, and reads the order.',
      go: 'Send the messenger ▶' },
    again: { t: 'The next day, the same order', p: 'Yesterday, Alice and Bob attacked at dawn, and Eve saw it: she now knows what yesterday\'s ciphertext meant. Today, Alice sends the same order again, with the same key and the same IV. Launch the messenger: Eve still cannot read, but she checks her notebook.',
      go: 'Send the same order ▶', e: 'The same ciphertext as yesterday, and yesterday they attacked at dawn. I do not need the key.' },
    fresh: { t: 'A fresh key and a fresh IV', p: 'The fix: for every message, a fresh key and a fresh IV, drawn at random. Launch the messenger: the same order gives a ciphertext with nothing in common with yesterday\'s, and Eve can no longer spot an order that comes back. A fresh IV alone would already change the ciphertext; the project draws a fresh key too, and episode 1.4 shows how it travels to Bob.',
      go: 'Send with a fresh key and IV ▶', e: 'Nothing in common with yesterday. Is it the same order? I cannot tell.' },
    packet: { t: 'The packet, so far', p: 'What travels now: the IV (16 bytes, in the clear) and the ciphertext (32 bytes). It is the start of the packet you build in the project. Two bricks are still missing. Eve cannot read, but she can change a byte of the ciphertext, and Bob would not notice: that is episode 1.3. And the fresh key must reach Bob without Eve reading it: that is episode 1.4.',
      e: 'I cannot read any more. But who stops me from changing a byte?', link: 'Episode 1.3: the changed byte ▶' },
    end: { t: 'Your turn', p: 'In the sandbox, write your own order, look at its blocks and its padding, and send it in the clear, with the same key, or with a fresh key and IV: Eve\'s notebook shows what she recognises. To see up close why the blocks are chained, and what happens without CBC, episode 6, the penguin, goes into the detail.',
      go: 'Try the sandbox', go2: 'Take the quiz', link: 'Episode 6: the penguin ▶' },
  },

  'sb.title': 'Sandbox',
  'sb.hint': 'Write an order, choose how Alice sends it, and watch what Eve gets out of it.',
  'sb.order': 'The order', 'sb.how': 'Alice sends it',
  'sb.plain': 'in the clear', 'sb.same': 'encrypted, always the same key and IV', 'sb.fresh': 'encrypted, a fresh key and IV every time',
  'sb.send': 'Send the messenger ▶', 'sb.reset': "Clear Eve's notebook",
  'sb.stats': 'Sent <b>{sent}</b> · read by Eve <b>{read}</b> · recognised by Eve <b>{seen}</b>',
  'sb.empty': 'Write an order first.',

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
// the sandbox starts with the story's order, in the reader's language
export const ORDER_DEFAULT = () => lang === 'en' ? 'ATTACK AT DAWN TOMORROW' : "ATTAQUE DEMAIN A L'AUBE";
