// Every visible word of episode 1.7 « À toi de jouer », in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// TRAP: a key missing from en shows the French: add every key to both.
// A step's choices are steps.<id>.choices.<k> = [name, one line, the outcome told after it played];
// what Eve and Bob say during the ride is m.<step>.<k>.e / .b, with the real bytes as {vars}.

const fr = {
  series: 'Crypto en visuel',
  tab: 'À toi de jouer — Crypto en visuel',
  title: 'À toi de jouer',
  subtitle: "Faire passer l'ordre d'Alice sous les yeux d'Eve : à chaque étape, trois choix, et c'est vous qui choisissez.",
  loading: 'Construction des châteaux…',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  // the choice engine's words (lib/choices.js)
  'choices.wrong': 'Eve gagne', 'choices.right': 'Bien joué',
  'choices.continue': 'Continuer ▶', 'choices.again': 'Essayer un autre choix',

  // what Eve and Bob say when the rider passes; {c1} {c2} the first bytes of each block, {h} of a fingerprint
  m: {
    text: {
      clear: { e: '« ATTAQUE A 6H DEMAIN ». Merci, Alice : mes troupes seront prêtes à 6h.', b: 'Je lis : « ATTAQUE A 6H DEMAIN ». Reçu.' },
      ecb: { e: 'Bloc 1 : {c1}… Bloc 2 : {c2}… Les mêmes qu’hier, tous les deux. Et hier, c’était 6h.', b: 'Je déchiffre : « ATTAQUE A 6H DEMAIN ». Reçu.' },
      cbc: { e: '{c1}… {c2}… Rien de commun avec hier. Je ne sais pas ce qu’il dit.', b: 'Je déchiffre : « ATTAQUE A 6H DEMAIN ». Reçu.' },
    },
    seal: {
      none: { e: 'Le 11e octet de l’IV, XOR 0f. Je ne sais pas ce qu’il dit, mais je sais ce qu’il deviendra.', b: 'Je déchiffre : « {m} ». Reçu : j’attaque à 9h.' },
      sum: { e: 'Le 11e octet de l’IV, XOR 0f. Puis je refais leur empreinte : {h}… Pas besoin de clé.', b: 'Empreinte juste. Je déchiffre : « {m} ». J’attaque à 9h.' },
      hmac: { e: 'Le 11e octet de l’IV, XOR 0f. Le sceau, je ne peux pas le refaire : il me faudrait leur clé.', b: 'Le sceau ne correspond pas : paquet rejeté. Je ne déchiffre rien.' },
    },
  },

  // the story
  steps: {
    intro: { t: "Faire passer l'ordre", p: "Alice doit faire parvenir à Bob l'ordre « ATTAQUE A 6H DEMAIN ». La route passe sous les murs d'Eve, et la saga a montré ce qu'Eve y fait :\n- elle lit l'ordre (épisode 1.2) ;\n- elle change un octet du paquet (épisode 1.3) ;\n- elle fabrique un faux paquet, ou renvoie un vieux paquet (épisode 1.6).\n\nÀ chaque étape, c'est vous qui choisissez comment Alice se protège, parmi trois choix. Le messager part avec votre choix, et vous voyez ce qu'Eve en fait :\n- un mauvais choix, Eve gagne, et vous choisissez de nouveau ;\n- un bon choix, l'histoire continue.",
      e: 'Tout ce qui va chez Bob passe sous mes murs. Voyons ce qu’Alice a appris.' },
    text: { t: "1. Cacher l'ordre", p: "Eve arrête chaque messager sous ses murs et regarde ce qu'il porte. Hier, Alice a envoyé le même ordre, de la même façon, et Eve a vu l'armée attaquer à 6h : elle a gardé dans son carnet ce que portait le messager d'hier.\n\nAlice et Bob partagent une clé secrète de 32 octets, qu'Eve n'a pas.",
      q: "Comment Alice envoie-t-elle l'ordre ?",
      choices: {
        clear: ['En clair', "L'ordre tel quel, sur le parchemin",
          "Eve lit « ATTAQUE A 6H DEMAIN » et prépare ses troupes pour 6h. Sans chiffrement, tous ceux qui tiennent le parchemin lisent l'ordre (épisode 1.2)."],
        ecb: ['AES-ECB', 'Chaque bloc de 16 octets chiffré à part, avec la clé',
          "Eve ne sait pas lire, mais les deux blocs sont ceux d'hier : en mode ECB, le même bloc avec la même clé donne toujours le même chiffré. Eve reconnaît l'ordre d'hier, et sait qu'il veut dire 6h. Des blocs qui se répètent se voient à travers ECB : c'est le pingouin de l'épisode 6."],
        cbc: ['AES-CBC, IV neuf', "Les blocs chaînés, partant d'un IV tiré au hasard à chaque envoi",
          "Avec un {2|IV} neuf, le même ordre donne un chiffré qui n'a rien de commun avec celui d'hier : Eve ne lit rien et ne reconnaît rien. Bob, qui a la clé, déchiffre l'ordre (épisode 1.2)."],
      } },
    seal: { t: "2. Sceller l'ordre", p: "L'ordre voyage maintenant chiffré en AES-CBC avec un {2|IV} neuf : Eve ne le lit plus. Mais elle connaît la forme des ordres d'Alice : l'heure est le 11e octet.\n\nEt chaque octet de l'{2|IV} tombe, au déchiffrement, sur l'octet de même rang du premier bloc. En changeant le 11e octet de l'{2|IV}, Eve change donc l'heure que Bob lira : « 6 » devient « {r|9} » (épisode 1.3).",
      q: "Que met Alice dans le paquet, pour que Bob voie si un octet a changé ?",
      choices: {
        none: ['Rien de plus', 'Le chiffré suffit : Eve ne sait pas le lire',
          "Bob déchiffre « ATTAQUE A {r|9H} DEMAIN » : le padding est bon, le texte se lit, rien ne cloche. Demain à 6h, Alice attaquera seule. Chiffrer cache l'ordre, mais ne le protège pas (épisode 1.3)."],
        hmac: ['Un sceau HMAC', "HMAC-SHA256 de l'IV et du chiffré, avec une deuxième clé secrète",
          "Eve change l'octet, mais sans la clé HMAC, elle ne peut pas refaire le {4|sceau}. Bob recalcule le sceau, voit qu'il ne correspond pas, et rejette le paquet sans le déchiffrer : il ne lira pas « {r|9H} », et attend qu'Alice renvoie l'ordre (épisode 1.3)."],
        sum: ['Une empreinte SHA-256', "Le SHA-256 de l'IV et du chiffré, sans clé",
          "Eve change l'octet, puis refait l'empreinte : SHA-256 n'a pas de clé, tout le monde peut la calculer. Bob trouve une empreinte juste et lit « ATTAQUE A {r|9H} DEMAIN ». Une empreinte sans clé voit un octet abîmé par accident, jamais un octet changé par Eve."],
      } },
  },
};

const en = {
  series: 'Crypto, Visualized',
  tab: 'Your move — Crypto, Visualized',
  title: 'Your move',
  subtitle: "Get Alice's order past Eve: three choices at every step, and you choose.",
  loading: 'Building the castles…',
  'nav.prev': '◀ Previous', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  'choices.wrong': 'Eve wins', 'choices.right': 'Well played',
  'choices.continue': 'Continue ▶', 'choices.again': 'Try another choice',

  m: {
    text: {
      clear: { e: '“ATTACK AT 6AM TOMORROW”. Thank you, Alice: my troops will be ready at 6.', b: 'I read: “ATTACK AT 6AM TOMORROW”. Received.' },
      ecb: { e: 'Block 1: {c1}… Block 2: {c2}… Both the same as yesterday, and yesterday it meant 6am.', b: 'I decrypt: “ATTACK AT 6AM TOMORROW”. Received.' },
      cbc: { e: '{c1}… {c2}… Nothing in common with yesterday. I cannot tell what it says.', b: 'I decrypt: “ATTACK AT 6AM TOMORROW”. Received.' },
    },
    seal: {
      none: { e: 'Byte 11 of the IV, XOR 0f. I cannot tell what it says, but I know what it will become.', b: 'I decrypt: “{m}”. Received: I attack at 9.' },
      sum: { e: 'Byte 11 of the IV, XOR 0f. Then I redo their fingerprint: {h}… No key needed.', b: 'The fingerprint matches. I decrypt: “{m}”. I attack at 9.' },
      hmac: { e: 'Byte 11 of the IV, XOR 0f. The seal I cannot redo: I would need their key.', b: 'The seal does not match: packet rejected. I decrypt nothing.' },
    },
  },

  steps: {
    intro: { t: 'Get the order through', p: "Alice must get the order “ATTACK AT 6AM TOMORROW” to Bob. The road runs under Eve's walls, and the saga showed what Eve does there:\n- she reads the order (episode 1.2);\n- she changes one byte of the packet (episode 1.3);\n- she builds a fake packet, or sends an old one again (episode 1.6).\n\nAt every step, you choose how Alice protects herself, out of three choices. The messenger leaves with your choice, and you see what Eve makes of it:\n- a wrong choice, Eve wins, and you choose again;\n- a right one, the story goes on.",
      e: 'Everything going to Bob passes under my walls. Let us see what Alice has learned.' },
    text: { t: '1. Hide the order', p: "Eve stops every messenger under her walls and looks at what he carries. Yesterday Alice sent the same order, the same way, and Eve saw the army attack at 6am: she kept in her notebook what yesterday's messenger carried.\n\nAlice and Bob share a 32-byte secret key, which Eve does not have.",
      q: 'How does Alice send the order?',
      choices: {
        clear: ['In the clear', 'The order as it is, on the scroll',
          'Eve reads “ATTACK AT 6AM TOMORROW” and gets her troops ready for 6am. Without encryption, whoever holds the scroll reads the order (episode 1.2).'],
        ecb: ['AES-ECB', 'Each 16-byte block encrypted on its own, with the key',
          "Eve cannot read, but both blocks are yesterday's: in ECB mode, the same block under the same key always gives the same ciphertext. Eve recognises yesterday's order, and knows it means 6am. Blocks that repeat show through ECB: that is the penguin of episode 6."],
        cbc: ['AES-CBC, fresh IV', 'The blocks chained, starting from an IV drawn at random for every send',
          "With a fresh {2|IV}, the same order gives a ciphertext with nothing in common with yesterday's: Eve reads nothing and recognises nothing. Bob, who has the key, decrypts the order (episode 1.2)."],
      } },
    seal: { t: '2. Seal the order', p: "The order now travels encrypted with AES-CBC and a fresh {2|IV}: Eve cannot read it any more. But she knows the shape of Alice's orders: the hour is byte 11.\n\nAnd when Bob decrypts, each byte of the {2|IV} lands on the byte in the same place of the first block. So by changing byte 11 of the {2|IV}, Eve changes the hour Bob will read: “6” becomes “{r|9}” (episode 1.3).",
      q: 'What does Alice put in the packet, so Bob sees whether a byte has changed?',
      choices: {
        none: ['Nothing more', 'The ciphertext is enough: Eve cannot read it',
          'Bob decrypts “ATTACK AT {r|9AM} TOMORROW”: the padding is right, the text reads, nothing looks wrong. Tomorrow at 6, Alice will attack alone. Encryption hides the order, but does not protect it (episode 1.3).'],
        hmac: ['An HMAC seal', 'HMAC-SHA256 of the IV and the ciphertext, with a second secret key',
          "Eve changes the byte, but without the HMAC key she cannot redo the {4|seal}. Bob computes the seal again, sees it does not match, and rejects the packet without decrypting it: he will not read “{r|9AM}”, and waits for Alice to send the order again (episode 1.3)."],
        sum: ['A SHA-256 fingerprint', 'The SHA-256 of the IV and the ciphertext, with no key',
          'Eve changes the byte, then redoes the fingerprint: SHA-256 has no key, anyone can compute it. Bob finds a matching fingerprint and reads “ATTACK AT {r|9AM} TOMORROW”. A fingerprint without a key sees a byte damaged by accident, never a byte changed by Eve.'],
      } },
  },
};

const dicts = { fr, en };
const listeners = [];
const fromUrl = new URLSearchParams(location.search).get('lang');
export let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';

export function raw(key) { return key.split('.').reduce((o, k) => o?.[k], dicts[lang]) ?? dicts[lang][key] ?? dicts.fr[key] ?? key; }
export function t(key, vars = {}) {
  const s = raw(key);
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
