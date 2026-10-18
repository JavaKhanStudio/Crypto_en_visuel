// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The story follows the course's slides on the modes of operation (« Modes d'opération - ECB -
// Le pingouin », « ECB - Un exemple », « CBC - Un exemple », « CBC - L'IV - Un exemple »,
// « Bit-flip - Un exemple », « L'attaque bit-flip - La parade ») and uses their values in both
// languages: key cle-de-16-octets, message VIREMENT URGENT! | montant=00100EUR | VIREMENT URGENT!
// | Alice, IV 7e fa 5a 79 fc d3 ... pingouin/js/aes.js computes them, tests/pingouin_values.mjs
// checks them against the slides.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Le pingouin et la chaîne — Crypto en visuel',
  title: 'Le pingouin et la chaîne',
  subtitle: 'ECB laisse voir les motifs, CBC enchaîne les blocs, et un bit retourné change le message.',
  loading: 'On met les caisses sur le tapis…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  wall: { plain: 'image' },
  check: { bob: 'Bob calcule', row: 'HMAC de Bob' },
  recap: { ecb: 'à proscrire, les motifs restent visibles', cbc: 'sûr avec un IV aléatoire et un HMAC', gcm: 'chiffre et authentifie : TLS, choix recommandé' },
  card: {
    title: { recap: 'Modes d’opération - Récapitulatif', msg: 'Le message en blocs', ecb: 'ECB - Un exemple', cbc: 'CBC - Un exemple', flip: 'Bit-flip - Un exemple', dec: 'Bob déchiffre (CBC)', decEcb: 'Bob déchiffre (ECB)', mac: 'Le HMAC' },
    head: {},
    key: 'clé « cle-de-16-octets », blocs de 16 octets',
    blank: 'Rien encore.',
    verdict: { ok: 'Les deux HMAC sont égaux : Bob déchiffre.', bad: 'Les HMAC diffèrent : Bob refuse, il ne déchiffre rien.' },
  },
  ch: ['Le message', 'ECB', 'CBC', 'Le bit-flip', 'La parade', 'À vous'],
  steps: {
    s1: { t: 'Un ordre de paiement',
      p: "Alice envoie un ordre de paiement à Bob, sur le tapis roulant qui traverse la halle. Il fait 53 octets : VIREMENT URGENT!, puis montant=00100EUR, puis VIREMENT URGENT! encore, puis Alice. Alice et Bob partagent une clé secrète de 16 octets, « cle-de-16-octets ». Au milieu du tapis, Eve ne connaît pas la clé, mais elle voit passer tout ce qui roule, et elle peut y toucher.",
      a: 'Cent euros pour Bob, et personne ne doit lire ni changer le montant.', b: 'J’ai la même clé qu’Alice : cle-de-16-octets.', e: 'Pas de clé… mais tout passe devant moi.' },
    s2: { t: 'Des blocs de 16 octets',
      p: "AES ne chiffre qu’un bloc de 16 octets exactement, pas un de plus. Alice découpe donc son message en caisses de 16 octets : P1 VIREMENT URGENT!, P2 montant=00100EUR, P3 VIREMENT URGENT!, P4 Alice. Le dernier bloc ne porte que 5 octets : le padding PKCS#7 le complète avec 11 octets qui valent tous 0b, c’est-à-dire 11. Le même bloc est en premier et en troisième, exprès.",
      go: 'Découper le message', a: 'P1 et P3 sont pareils : VIREMENT URGENT!.' },
    s3: { t: 'ECB : chaque bloc seul',
      p: "Le mode le plus simple s’appelle ECB : chaque caisse passe seule dans la presse AES, avec la même clé K, et en ressort chiffrée. Sur chaque caisse chiffrée, une case par octet, en hexadécimal ; la couleur de la case ne dépend que de l’octet : deux octets égaux ont la même couleur. P1 donne C1 = ac b5 67 95 2d 53…",
      go: 'Chiffrer en ECB', a: 'Quatre blocs chiffrés. Personne ne peut les lire sans la clé.' },
    s4: { t: 'Le même bloc, le même chiffré',
      p: "Regardons C1 et C3. P1 et P3 sont identiques, la clé est la même : AES donne exactement le même résultat, ac b5 67 95 2d 53 86 c6… En ECB, deux blocs clairs identiques donnent deux blocs chiffrés identiques. Eve ne lit pas le message, mais elle voit qu’il se répète : la structure du message reste visible.",
      go: 'Comparer les blocs', e: 'C1 et C3 sont pareils. Sans la clé, je sais déjà que le message se répète.' },
    s5: { t: 'Le pingouin',
      p: "C’est l’image de la diapositive « ECB - Le pingouin ». Une image, ce sont des octets : ici un octet par pixel, rangés ligne après ligne, donc un bloc, c’est 16 pixels d’une ligne. Dans une zone de couleur unie, tous les blocs sont identiques, et en ECB ils donnent tous le même bloc chiffré. Faisons passer le pingouin dans la presse, en ECB, avec la même clé.",
      go: 'Chiffrer l’image en ECB', e: 'Des couleurs au hasard… et pourtant, je vois un pingouin.' },
    s6: { t: 'CBC : la chaîne',
      p: "Le mode CBC ajoute un anneau avant la presse : chaque bloc clair y passe d’abord par un XOR avec le bloc chiffré précédent, puis va dans AES. Le premier bloc n’a pas de précédent : Alice tire un IV, 16 octets au hasard, 7e fa 5a 79 fc d3… P1 ⊕ IV donne 28 b3 08 3c, qui devient C1 = 01 a1 da 22. Puis C1 remonte au-dessus de l’anneau, pour P2. C’est la chaîne : C1 = AES(P1 ⊕ IV), C2 = AES(P2 ⊕ C1), C3 = AES(P3 ⊕ C2).",
      go: 'Chiffrer en CBC', a: 'L’IV part en premier, en clair : Bob en aura besoin.' },
    s7: { t: 'La répétition a disparu',
      p: "P1 et P3 sont toujours identiques. Mais P1 est passé au XOR avec l’IV, P3 avec C2 : AES a reçu 28 b3 08 3c d’un côté et e2 5d c4 80 de l’autre. C1 commence par 01 a1, C3 par 17 b9 : plus rien ne se répète dans le chiffré. Faisons passer le pingouin en CBC, avec le même IV.",
      go: 'Chiffrer l’image en CBC', e: 'Cette fois, du bruit partout. Plus de pingouin.' },
    s8: { t: 'Un IV neuf à chaque message',
      p: "Alice rechiffre le même message, avec la même clé, mais un nouvel IV tiré au hasard : 1a 2f 1c 3c c6 a8… C1 passe de 01 a1 à 20 02, et la différence se propage jusqu’au dernier bloc : C4 passe de f8 e2 à e8 61. Qui lit les deux chiffrés ne peut même pas dire que c’est le même message. L’IV n’est pas secret, il voyage en clair ; il doit seulement être imprévisible, et ne jamais resservir.",
      go: 'Rechiffrer avec un autre IV', a: 'Même message, autre IV : un tout autre chiffré.' },
    s9: { t: 'Eve retourne deux bits',
      p: "Retour au premier envoi, IV 7e fa 5a. Les caisses roulent vers Bob, et Eve arrête C1 devant elle. Elle ne connaît pas la clé, mais elle sait où est le montant : octet 8 de P2, le premier 0 de 00100. Au déchiffrement, P2 = AES⁻¹(C2) ⊕ C1 : chaque bit de C1 retourné retourne le même bit de P2. Pour changer '0' (30) en '9' (39), il faut le masque 30 ⊕ 39 = 09 : Eve retourne ces deux bits dans l’octet 8 de C1, et ff devient f6.",
      go: 'Envoyer, et Eve retourne les bits', e: 'ff ⊕ 09 = f6. Deux bits, pas de clé.' },
    s10: { t: 'Bob déchiffre',
      p: "Bob reçoit l’IV et les quatre blocs. Chaque bloc passe dans sa presse AES⁻¹, puis dans son anneau, au XOR avec le bloc chiffré qui le précède. C1, retouché, ressort en charabia : AES⁻¹ mélange tout le bloc, et le premier bloc est détruit. Mais pour P2, AES⁻¹(C2) donne toujours cf en octet 8, et cf ⊕ f6 = 39 : '9'. Bob lit montant=90100EUR. P3 et P4 sont intacts.",
      go: 'Bob déchiffre', b: 'montant=90100EUR… Un bloc abîmé, mais le montant est clair.', e: 'Cent euros devenus 90 100, sans jamais avoir eu la clé.' },
    s11: { t: 'La parade : un HMAC',
      p: "Le chiffrement garde le message secret, il ne garantit pas qu’il est intact. La parade : Alice calcule un HMAC sur l’IV et tout le chiffré, avec une seconde clé que seuls Bob et elle connaissent, et le pose sur l’IV comme un sceau. Eve retourne les mêmes deux bits. Bob, avant de déchiffrer quoi que ce soit, recalcule le HMAC de ce qu’il a reçu et le compare au sceau.",
      go: 'Envoyer avec un HMAC', b: 'Le HMAC ne correspond pas. Je ne déchiffre rien.', e: 'Pour refaire le sceau, il me faudrait l’autre clé.' },
    s12: { t: 'Ce qu’il faut retenir',
      p: "ECB : à proscrire, les motifs restent visibles. CBC : sûr avec un IV aléatoire, neuf à chaque message, et un HMAC vérifié avant tout déchiffrement. Encore mieux, AES-GCM chiffre et authentifie en une seule opération : c’est le mode de TLS, le choix recommandé. Eve n’a jamais touché à la clé ni à AES : elle a joué sur l’assemblage des blocs.",
      a: 'Un IV neuf, et rien ne se déchiffre sans avoir été authentifié.', e: 'Je n’ai pas cassé AES, j’ai joué avec les blocs.' },
    s13: { t: 'À vous',
      p: "Dans le bac à sable, écrivez votre message, choisissez ECB ou CBC, et laissez Eve retourner le bit de votre choix, avec ou sans HMAC : regardez quels blocs Bob lit. Ou testez-vous avec le quiz.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz' },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Écrivez un message (63 octets au plus, 4 blocs), chiffrez-le, puis envoyez-le à Bob.',
    msg: 'Le message', mode: 'Le mode', newIv: 'Un nouvel IV au hasard', encrypt: 'Chiffrer',
    eve: 'Eve', flip: 'Eve retourne un bit', block: 'bloc', byte: 'octet', bit: 'bit',
    hmac: 'Alice ajoute un HMAC, Bob le vérifie', send: 'Envoyer à Bob', reset: 'Recommencer',
    blocks: 'Blocs', same: 'blocs chiffrés identiques : {n}', read: 'Bob lit', ready: 'Prêt : chiffrez le message.',
    sent: 'Prêt : envoyez-le à Bob.', refused: 'Bob refuse : le HMAC ne correspond pas.', garbage: 'illisible', changed: 'changé', intact: 'intact',
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
  tab: 'The Penguin and the Chain — Crypto, Visualized',
  title: 'The Penguin and the Chain',
  subtitle: 'ECB shows the patterns, CBC chains the blocks, and one flipped bit changes the message.',
  loading: 'Putting the crates on the belt…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  wall: { plain: 'image' },
  check: { bob: 'Bob computes', row: 'Bob’s HMAC' },
  recap: { ecb: 'never, the patterns stay visible', cbc: 'safe with a random IV and an HMAC', gcm: 'encrypts and authenticates: TLS, the recommended choice' },
  card: {
    title: { recap: 'Modes of operation - Summary', msg: 'The message in blocks', ecb: 'ECB - An example', cbc: 'CBC - An example', flip: 'Bit-flip - An example', dec: 'Bob decrypts (CBC)', decEcb: 'Bob decrypts (ECB)', mac: 'The HMAC' },
    head: {},
    key: 'key “cle-de-16-octets”, 16-byte blocks',
    blank: 'Nothing yet.',
    verdict: { ok: 'The two HMACs match: Bob decrypts.', bad: 'The HMACs differ: Bob refuses and decrypts nothing.' },
  },
  ch: ['The message', 'ECB', 'CBC', 'The bit-flip', 'The fix', 'Your turn'],
  steps: {
    s1: { t: 'A payment order',
      p: "Alice sends Bob a payment order, on the conveyor belt that runs across the hall. It is 53 bytes long: VIREMENT URGENT! (French for URGENT TRANSFER!), then montant=00100EUR (French for amount=00100EUR, as on the course slides), then VIREMENT URGENT! again, then Alice. Alice and Bob share a secret 16-byte key, “cle-de-16-octets”. In the middle of the belt, Eve does not know the key, but she sees everything that rolls past, and she can touch it.",
      a: 'A hundred euros for Bob, and nobody may read or change the amount.', b: 'I have the same key as Alice: cle-de-16-octets.', e: 'No key… but everything goes past me.' },
    s2: { t: '16-byte blocks',
      p: "AES encrypts one block of exactly 16 bytes, not one more. So Alice cuts her message into crates of 16 bytes: P1 VIREMENT URGENT!, P2 montant=00100EUR, P3 VIREMENT URGENT!, P4 Alice. The last block only holds 5 bytes: PKCS#7 padding fills it with 11 bytes that are all 0b, that is 11. The same block is first and third, on purpose.",
      go: 'Cut the message', a: 'P1 and P3 are the same: VIREMENT URGENT!.' },
    s3: { t: 'ECB: each block alone',
      p: "The simplest mode is called ECB: each crate goes through the AES press on its own, with the same key K, and comes out encrypted. On each encrypted crate, one tile per byte, in hexadecimal; a tile’s colour depends only on its byte: two equal bytes have the same colour. P1 gives C1 = ac b5 67 95 2d 53…",
      go: 'Encrypt in ECB', a: 'Four encrypted blocks. Nobody can read them without the key.' },
    s4: { t: 'Same block, same cipher',
      p: "Look at C1 and C3. P1 and P3 are identical, the key is the same: AES gives exactly the same result, ac b5 67 95 2d 53 86 c6… In ECB, two identical plaintext blocks give two identical ciphertext blocks. Eve cannot read the message, but she can see that it repeats: the structure of the message stays visible.",
      go: 'Compare the blocks', e: 'C1 and C3 are the same. Without the key, I already know the message repeats.' },
    s5: { t: 'The penguin',
      p: "This is the picture on the slide “ECB - The penguin”. A picture is bytes: here one byte per pixel, stored row after row, so a block is 16 pixels of a row. In an area of one colour, all the blocks are identical, and in ECB they all give the same encrypted block. Let us put the penguin through the press, in ECB, with the same key.",
      go: 'Encrypt the picture in ECB', e: 'Random colours… and yet I can see a penguin.' },
    s6: { t: 'CBC: the chain',
      p: "The CBC mode adds a ring before the press: each plaintext block first goes through an XOR with the previous ciphertext block, then into AES. The first block has no previous one: Alice draws an IV, 16 random bytes, 7e fa 5a 79 fc d3… P1 ⊕ IV gives 28 b3 08 3c, which becomes C1 = 01 a1 da 22. Then C1 goes up over the ring, for P2. That is the chain: C1 = AES(P1 ⊕ IV), C2 = AES(P2 ⊕ C1), C3 = AES(P3 ⊕ C2).",
      go: 'Encrypt in CBC', a: 'The IV goes first, in the clear: Bob will need it.' },
    s7: { t: 'The repetition is gone',
      p: "P1 and P3 are still identical. But P1 went through the XOR with the IV, P3 with C2: AES got 28 b3 08 3c on one side and e2 5d c4 80 on the other. C1 starts with 01 a1, C3 with 17 b9: nothing repeats in the ciphertext any more. Let us put the penguin through in CBC, with the same IV.",
      go: 'Encrypt the picture in CBC', e: 'This time, noise everywhere. No more penguin.' },
    s8: { t: 'A fresh IV for every message',
      p: "Alice encrypts the same message again, with the same key, but a new random IV: 1a 2f 1c 3c c6 a8… C1 goes from 01 a1 to 20 02, and the difference runs all the way to the last block: C4 goes from f8 e2 to e8 61. Whoever reads both ciphertexts cannot even tell it is the same message. The IV is not secret, it travels in the clear; it only has to be unpredictable, and never used twice.",
      go: 'Encrypt again with another IV', a: 'Same message, another IV: a completely different ciphertext.' },
    s9: { t: 'Eve flips two bits',
      p: "Back to the first sending, IV 7e fa 5a. The crates roll towards Bob, and Eve stops C1 in front of her. She does not know the key, but she knows where the amount is: byte 8 of P2, the first 0 of 00100. On decryption, P2 = AES⁻¹(C2) ⊕ C1: every bit flipped in C1 flips the same bit of P2. To turn '0' (30) into '9' (39), the mask is 30 ⊕ 39 = 09: Eve flips those two bits in byte 8 of C1, and ff becomes f6.",
      go: 'Send, and Eve flips the bits', e: 'ff ⊕ 09 = f6. Two bits, no key.' },
    s10: { t: 'Bob decrypts',
      p: "Bob receives the IV and the four blocks. Each block goes through his AES⁻¹ press, then through his ring, XORed with the ciphertext block before it. C1, tampered with, comes out as gibberish: AES⁻¹ scrambles the whole block, and the first block is destroyed. But for P2, AES⁻¹(C2) still gives cf at byte 8, and cf ⊕ f6 = 39: '9'. Bob reads montant=90100EUR. P3 and P4 are intact.",
      go: 'Bob decrypts', b: 'montant=90100EUR… One block damaged, but the amount is clear.', e: 'A hundred euros became 90,100, and I never had the key.' },
    s11: { t: 'The fix: an HMAC',
      p: "Encryption keeps the message secret; it does not guarantee that it is intact. The fix: Alice computes an HMAC over the IV and the whole ciphertext, with a second key that only Bob and she know, and puts it on the IV like a seal. Eve flips the same two bits. Bob, before decrypting anything, computes the HMAC of what he received and compares it with the seal.",
      go: 'Send with an HMAC', b: 'The HMAC does not match. I decrypt nothing.', e: 'To redo the seal, I would need the other key.' },
    s12: { t: 'What to remember',
      p: "ECB: never, the patterns stay visible. CBC: safe with a random IV, fresh for every message, and an HMAC checked before any decryption. Better still, AES-GCM encrypts and authenticates in one operation: it is TLS’s mode, the recommended choice. Eve never touched the key or AES: she played with the way the blocks are put together.",
      a: 'A fresh IV, and nothing is decrypted before it is authenticated.', e: 'I did not break AES, I played with the blocks.' },
    s13: { t: 'Your turn',
      p: "In the sandbox, write your own message, pick ECB or CBC, and let Eve flip the bit of your choice, with or without an HMAC: see which blocks Bob reads. Or test yourself with the quiz.",
      go: 'Try the sandbox', go2: 'Take the quiz' },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Write a message (63 bytes at most, 4 blocks), encrypt it, then send it to Bob.',
    msg: 'The message', mode: 'The mode', newIv: 'A new random IV', encrypt: 'Encrypt',
    eve: 'Eve', flip: 'Eve flips a bit', block: 'block', byte: 'byte', bit: 'bit',
    hmac: 'Alice adds an HMAC, Bob checks it', send: 'Send to Bob', reset: 'Start again',
    blocks: 'Blocks', same: 'identical cipher blocks: {n}', read: 'Bob reads', ready: 'Ready: encrypt the message.',
    sent: 'Ready: send it to Bob.', refused: 'Bob refuses: the HMAC does not match.', garbage: 'unreadable', changed: 'changed', intact: 'intact',
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
