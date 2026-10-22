// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The words and the values follow the course's slides « Diffie-Hellman - Les couleurs »,
// « - Les calculs », « - Au milieu » and « - Au milieu - La parade ».

const fr = {
  series: 'Crypto en visuel',
  tab: 'Les couleurs de Diffie-Hellman — Crypto en visuel',
  title: 'Les couleurs de Diffie-Hellman',
  subtitle: 'Un secret commun, calculé en public, sans jamais l’envoyer.',
  loading: 'On ouvre les pots de peinture…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'Le messager' },
  // the name of each recipe (see paint.js); a mix with no name is « mélange »
  paint: { J: 'JAUNE', R: 'ROUGE', B: 'BLEU', N: 'NOIR', W: 'BLANC', JR: 'ORANGE', BJ: 'VERT', BJR: 'MARRON',
    JN: 'KAKI', JNR: 'BORDEAUX', BJN: 'SAPIN', BJJR: 'OCRE', JW: 'CRÈME' },
  'paint.mix': 'mélange', 'paint.secret': '(secret)', 'paint.empty': 'vide',
  // the recap cards of the last step: what each pot is, in one word
  recap: { pub: 'public', secret: 'secret', seen: 'vu par Eve', never: 'jamais envoyé' },
  ch: ['Le problème', 'Les couleurs', 'L’échange', 'Le secret commun', 'Eve au milieu', 'La parade'],
  steps: {
    s1: { t: 'Se mettre d’accord sans se parler',
      p: "Alice et Bob veulent un secret commun, par exemple une clé pour chiffrer en AES. Deux obstacles :\n- ils ne partagent rien au départ ;\n- tout ce qu'ils s'envoient passe par la route, au pied de la tour d'Eve, et Eve voit tout passer.\n\n**Comment calculer le même secret en se parlant devant tout le monde, sans jamais l'envoyer ?**",
      a: 'Il nous faut un secret, à Bob et à moi.', b: 'Mais tout ce qu’on s’envoie, Eve le voit.', e: 'Je regarde tout ce qui passe sur cette route.' },
    s2: { t: 'Une couleur publique : JAUNE',
      p: "Diffie et Hellman ont eu l'idée en 1976. Racontée avec de la peinture, elle commence par une couleur que tout le monde connaît. Ici, JAUNE, et chacun en a un pot :\n- Alice ;\n- Bob ;\n- et Eve aussi.\n\n**JAUNE n'a rien de secret.**",
      go: 'Revoir', e: 'JAUNE ? Moi aussi, j’en ai.' },
    s3: { t: 'Chacun sa couleur secrète',
      p: "Ensuite, chacun choisit une couleur secrète :\n- Alice prend ROUGE ;\n- Bob prend BLEU.\n\n**Chacun la garde chez lui et ne l'envoie jamais.** Eve ne les voit pas : ces pots ne quitteront jamais leur table.",
      go: 'Revoir', a: 'ROUGE. Personne d’autre ne le saura.', b: 'Moi, BLEU. Il ne sort pas d’ici.' },
    s4: { t: 'Alice mélange : JAUNE + ROUGE = ORANGE',
      p: "Alice fait son mélange dans un pot vide :\n- d'abord du JAUNE ;\n- puis un peu de son ROUGE secret.\n\nLe mélange donne ORANGE. **C'est ce pot-là qu'elle enverra à Bob.**",
      go: 'Mélanger', a: 'JAUNE + ROUGE = ORANGE. Celui-là, je peux l’envoyer.' },
    s5: { t: 'Bob mélange : JAUNE + BLEU = VERT',
      p: "Bob fait la même chose avec sa couleur secrète :\n- d'abord du JAUNE ;\n- puis son BLEU.\n\nSon mélange donne VERT. **C'est VERT qu'il enverra à Alice.**",
      go: 'Mélanger', b: 'JAUNE + BLEU = VERT. Pour Alice.' },
    s6: { t: 'ORANGE et VERT passent devant Eve',
      p: "Les deux pots partent sur la route :\n- Alice envoie ORANGE à Bob ;\n- Bob envoie VERT à Alice.\n\nTous deux passent au pied de la tour, et Eve les voit passer : elle s'en prend une copie au passage. **Elle a maintenant JAUNE, ORANGE et VERT.**",
      go: 'Échanger les pots', e: 'ORANGE, VERT… je copie tout.' },
    s7: { t: 'Eve ne sait pas démélanger',
      p: "Pour trouver le secret, il faudrait à Eve le ROUGE d'Alice ou le BLEU de Bob. Elle essaie deux choses :\n- verser son ORANGE dans deux pots : elle obtient deux fois ORANGE, jamais JAUNE et ROUGE ;\n- mélanger ORANGE et VERT : elle met deux fois du JAUNE, et obtient un OCRE, trop jaune, pas le MARRON d'Alice et Bob.\n\n**On ne démélange pas une peinture.**",
      go: 'Eve essaie de démélanger', go2: 'Eve mélange ORANGE et VERT',
      e: 'Deux pots… et deux fois ORANGE. Le ROUGE ne ressort pas.', e2: 'OCRE : il y a deux fois du JAUNE là-dedans.' },
    s8: { t: 'Le même MARRON, des deux côtés',
      p: "Chacun ajoute sa couleur secrète à ce qu'il a reçu :\n- Alice verse son ROUGE secret dans le VERT reçu de Bob ;\n- Bob verse son BLEU secret dans l'ORANGE reçu d'Alice.\n\nLes deux pots contiennent la même chose, JAUNE + ROUGE + BLEU : le même MARRON, des deux côtés. **Personne ne l'a envoyé.**",
      go: 'Ajouter sa couleur secrète', a: 'VERT + ROUGE = MARRON.', b: 'ORANGE + BLEU = MARRON. Le même !' },
    s9: { t: 'La même chose, avec des nombres',
      p: "Dans le vrai Diffie-Hellman, la peinture devient un calcul. JAUNE, ce sont deux nombres publics : {g|p = 23}, un nombre premier, et {g|g = 5}. Mélanger avec son secret, c'est élever à la puissance de ce secret, modulo p.\n- Alice garde {r|a = 6} et envoie 5⁶ mod 23 = 8 ;\n- Bob garde {b|b = 15} et envoie 5¹⁵ mod 23 = 19.\n\nAlice calcule 19⁶ mod 23 = **2**, Bob calcule 8¹⁵ mod 23 = **2** : tous deux trouvent **2**, sans l'avoir envoyé.",
      go: 'Revoir',
      a: 'a = 6 reste chez moi. J’ai envoyé 8, j’ai reçu 19 : 19⁶ mod 23 = 2.',
      e: 'Je vois passer 8 et 19. Avec p = 23, je peux essayer tous les secrets. Avec un p de 2 048 bits, retrouver le secret à partir de ce qui passe est insoluble.',
      b: 'b = 15 reste chez moi. J’ai reçu 8 : 8¹⁵ mod 23 = 2.' },
    s10: { t: 'Eve se met au milieu',
      p: "Eve peut faire plus que regarder :\n- elle arrête les deux pots : l'ORANGE d'Alice et le VERT de Bob n'arriveront jamais ;\n- elle a aussi sa propre couleur secrète, NOIR.\n\n**Rien ne l'en empêche : Diffie-Hellman ne vérifie pas qui est à l'autre bout.**",
      go: 'Envoyer les pots', e: 'Ces deux pots restent chez moi.' },
    s11: { t: 'Eve envoie son propre mélange',
      p: "Eve mélange JAUNE et son NOIR : KAKI. Elle en envoie deux pots :\n- un à Alice, en se faisant passer pour Bob ;\n- un à Bob, en se faisant passer pour Alice.\n\n**Un pot ne dit pas qui l'a rempli** : Alice et Bob n'y voient que du feu.",
      go: 'Eve mélange et envoie', a: 'Voilà la couleur de Bob.', b: 'Voilà la couleur d’Alice.' },
    s12: { t: 'Deux secrets, et Eve a les deux',
      p: "Chacun ajoute sa couleur secrète à ce qu'il a reçu :\n- Alice obtient BORDEAUX (JAUNE + NOIR + ROUGE) ;\n- Bob obtient SAPIN (JAUNE + NOIR + BLEU).\n\nEve, elle, fait les deux : son NOIR dans l'ORANGE d'Alice donne BORDEAUX, son NOIR dans le VERT de Bob donne SAPIN.\n\n**Un secret 1 avec Alice, un secret 2 avec Bob : Eve a les deux.**",
      go: 'Ajouter les couleurs secrètes', a: 'Notre secret : BORDEAUX.', b: 'Notre secret : SAPIN.', e: 'BORDEAUX avec Alice, SAPIN avec Bob : j’ai les deux.' },
    s13: { t: 'Eve lit, modifie, rechiffre',
      p: "Alice envoie un message à Bob dans un coffre fermé avec son secret, BORDEAUX. En route, Eve :\n- l'ouvre avec le même BORDEAUX ;\n- lit le message et le modifie ;\n- referme le coffre avec SAPIN, le secret qu'elle partage avec Bob.\n\n**Bob l'ouvre sans difficulté et ne se doute de rien.**",
      go: 'Envoyer un message', e: 'BORDEAUX ouvre ce coffre. Je lis… et je change deux mots.', b: 'Un message d’Alice, tout va bien.' },
    s14: { t: 'La parade : une signature',
      p: "La parade est d'authentifier l'échange. Sur le Web :\n- Bob est le serveur : il signe sa part avec la clé d'un certificat ;\n- Alice est le navigateur : elle sait vérifier ce certificat.\n\nIci, le VERT de Bob porte son sceau d'or, et Alice a le certificat de Bob pour le comparer. **Eve peut toujours relayer les messages, mais elle ne peut plus produire cette signature.**",
      go: 'Eve essaie encore', go2: 'Eve se contente de relayer',
      a: 'Ce sceau n’est pas celui du certificat de Bob : je refuse cet échange.', e: 'Je peux arrêter son pot, pas imiter son sceau.',
      a2: 'Le sceau correspond au certificat : c’est bien la part de Bob.', e2: 'Je n’ai qu’une copie de VERT : je suis revenue au chapitre 3.' },
    s15: { t: 'Ce qu’il faut retenir',
      p: "Deux idées :\n- un secret commun se calcule en public : seuls JAUNE, ORANGE et VERT passent devant Eve, et MARRON n'est jamais envoyé ;\n- Diffie-Hellman ne sait pas qui est en face : c'est la signature du certificat qui le dit.\n\nPuis la suite : on remonte à l'Antiquité, avec un ruban enroulé sur un bâton, où le diamètre du bâton est la clé.",
      doors: { sandbox: ['Bac à sable', 'Choisissez les couleurs, laissez Eve écouter ou s’interposer'], quiz: ['Quiz', 'Sept questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 4 · La scytale ▶', 'Un ruban enroulé sur un bâton'] } },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Choisissez les couleurs secrètes, ce que fait Eve, et lancez l’échange.',
    alice: 'Couleur secrète d’Alice', bob: 'Couleur secrète de Bob',
    enemy: 'Eve', listen: 'Eve regarde passer les pots', middle: 'Eve se met au milieu',
    sign: 'Bob signe sa part (certificat)',
    run: 'Lancer l’échange ▶', reset: 'Recommencer',
    ready: 'Prêt : choisissez, puis lancez l’échange.',
    aliceHas: 'Alice obtient', bobHas: 'Bob obtient', eveHas: 'Eve a',
    same: 'Alice et Bob ont la même couleur : un secret commun.',
    differ: 'Alice et Bob n’ont pas la même couleur.',
    eveKnowsBoth: 'Eve connaît les deux secrets : elle lit et modifie tout.',
    eveBlind: 'Eve ne connaît pas le secret : elle ne peut pas démélanger.',
    refused: 'Alice refuse : la part reçue ne porte pas la signature de Bob. L’échange s’arrête, Eve n’apprend rien.',
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
  tab: 'Diffie-Hellman’s Colours — Crypto, Visualized',
  title: 'Diffie-Hellman’s Colours',
  subtitle: 'A shared secret, worked out in public, never sent.',
  loading: 'Opening the paint pots…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', n: 'The courier' },
  paint: { J: 'YELLOW', R: 'RED', B: 'BLUE', N: 'BLACK', W: 'WHITE', JR: 'ORANGE', BJ: 'GREEN', BJR: 'BROWN',
    JN: 'KHAKI', JNR: 'BURGUNDY', BJN: 'PINE', BJJR: 'OCHRE', JW: 'CREAM' },
  'paint.mix': 'mix', 'paint.secret': '(secret)', 'paint.empty': 'empty',
  recap: { pub: 'public', secret: 'secret', seen: 'seen by Eve', never: 'never sent' },
  ch: ['The problem', 'The colours', 'The exchange', 'The shared secret', 'Eve in the middle', 'The fix'],
  steps: {
    s1: { t: 'Agreeing without talking',
      p: "Alice and Bob want a shared secret, for instance a key to encrypt with AES. Two obstacles:\n- they share nothing to begin with;\n- everything they send each other goes along the road, at the foot of Eve’s tower, and Eve sees everything go by.\n\n**How can they work out the same secret while talking in front of everyone, without ever sending it?**",
      a: 'Bob and I need a secret.', b: 'But Eve sees everything we send.', e: 'I watch everything on this road.' },
    s2: { t: 'A public colour: YELLOW',
      p: "Diffie and Hellman had the idea in 1976. Told with paint, it starts with a colour everyone knows. Here, YELLOW, and everyone has a pot of it:\n- Alice;\n- Bob;\n- and Eve too.\n\n**There is nothing secret about YELLOW.**",
      go: 'Replay', e: 'YELLOW? I have some too.' },
    s3: { t: 'Each picks a secret colour',
      p: "Then each of them picks a secret colour:\n- Alice takes RED;\n- Bob takes BLUE.\n\n**Each keeps theirs at home and never sends it.** Eve does not see them: these pots will never leave their table.",
      go: 'Replay', a: 'RED. Nobody else will know.', b: 'BLUE for me. It stays right here.' },
    s4: { t: 'Alice mixes: YELLOW + RED = ORANGE',
      p: "Alice makes her mix in an empty pot:\n- first some YELLOW;\n- then a little of her secret RED.\n\nThe mix is ORANGE. **That is the pot she will send to Bob.**",
      go: 'Mix', a: 'YELLOW + RED = ORANGE. This one I can send.' },
    s5: { t: 'Bob mixes: YELLOW + BLUE = GREEN',
      p: "Bob does the same with his secret colour:\n- first some YELLOW;\n- then his BLUE.\n\nHis mix is GREEN. **GREEN is what he will send to Alice.**",
      go: 'Mix', b: 'YELLOW + BLUE = GREEN. For Alice.' },
    s6: { t: 'ORANGE and GREEN go past Eve',
      p: "Both pots set off along the road:\n- Alice sends ORANGE to Bob;\n- Bob sends GREEN to Alice.\n\nBoth go past the foot of the tower, and Eve sees them go by: she takes a copy of each on the way. **She now has YELLOW, ORANGE and GREEN.**",
      go: 'Swap the pots', e: 'ORANGE, GREEN… I copy everything.' },
    s7: { t: 'Eve cannot unmix paint',
      p: "To find the secret, Eve would need Alice’s RED or Bob’s BLUE. She tries two things:\n- pour her ORANGE into two pots: she gets ORANGE twice, never YELLOW and RED;\n- mix ORANGE and GREEN: she puts in YELLOW twice, and gets an OCHRE, too yellow, not Alice and Bob’s BROWN.\n\n**Paint cannot be unmixed.**",
      go: 'Eve tries to unmix', go2: 'Eve mixes ORANGE and GREEN',
      e: 'Two pots… and ORANGE twice. The RED does not come out.', e2: 'OCHRE: there is YELLOW in here twice.' },
    s8: { t: 'The same BROWN, on both sides',
      p: "Each adds their secret colour to what they received:\n- Alice pours her secret RED into the GREEN she got from Bob;\n- Bob pours his secret BLUE into the ORANGE he got from Alice.\n\nBoth pots hold the same thing, YELLOW + RED + BLUE: the same BROWN, on both sides. **Nobody sent it.**",
      go: 'Add the secret colour', a: 'GREEN + RED = BROWN.', b: 'ORANGE + BLUE = BROWN. The same!' },
    s9: { t: 'The same thing, with numbers',
      p: 'In the real Diffie-Hellman, the paint becomes arithmetic. YELLOW is two public numbers: {g|p = 23}, a prime, and {g|g = 5}. Mixing in your secret means raising to the power of that secret, modulo p.\n- Alice keeps {r|a = 6} and sends 5⁶ mod 23 = 8;\n- Bob keeps {b|b = 15} and sends 5¹⁵ mod 23 = 19.\n\nAlice computes 19⁶ mod 23 = **2**, Bob computes 8¹⁵ mod 23 = **2**: both find **2**, without sending it.',
      go: 'Replay',
      a: 'a = 6 stays with me. I sent 8, I got 19: 19⁶ mod 23 = 2.',
      e: 'I see 8 and 19 go by. With p = 23, I can try every secret. With a 2,048-bit p, finding the secret from what goes by is out of reach.',
      b: 'b = 15 stays with me. I got 8: 8¹⁵ mod 23 = 2.' },
    s10: { t: 'Eve steps into the middle',
      p: "Eve can do more than watch:\n- she stops both pots: Alice’s ORANGE and Bob’s GREEN will never arrive;\n- she also has a secret colour of her own, BLACK.\n\n**Nothing stops her: Diffie-Hellman does not check who is at the other end.**",
      go: 'Send the pots', e: 'These two pots stay with me.' },
    s11: { t: 'Eve sends her own mix',
      p: "Eve mixes YELLOW and her BLACK: KHAKI. She sends out two pots of it:\n- one to Alice, posing as Bob;\n- one to Bob, posing as Alice.\n\n**A pot does not say who filled it**: Alice and Bob notice nothing.",
      go: 'Eve mixes and sends', a: 'Here is Bob’s colour.', b: 'Here is Alice’s colour.' },
    s12: { t: 'Two secrets, and Eve has both',
      p: "Each adds their secret colour to what they received:\n- Alice gets BURGUNDY (YELLOW + BLACK + RED);\n- Bob gets PINE (YELLOW + BLACK + BLUE).\n\nEve does both: her BLACK in Alice’s ORANGE gives BURGUNDY, her BLACK in Bob’s GREEN gives PINE.\n\n**Secret 1 with Alice, secret 2 with Bob: Eve has both.**",
      go: 'Add the secret colours', a: 'Our secret: BURGUNDY.', b: 'Our secret: PINE.', e: 'BURGUNDY with Alice, PINE with Bob: I have both.' },
    s13: { t: 'Eve reads, changes, re-encrypts',
      p: "Alice sends Bob a message in a chest locked with her secret, BURGUNDY. On the way, Eve:\n- opens it with the same BURGUNDY;\n- reads the message and changes it;\n- locks the chest again with PINE, the secret she shares with Bob.\n\n**Bob opens it without trouble and suspects nothing.**",
      go: 'Send a message', e: 'BURGUNDY opens this chest. I read… and change a couple of words.', b: 'A message from Alice, all is well.' },
    s14: { t: 'The fix: a signature',
      p: "The fix is to authenticate the exchange. On the Web:\n- Bob is the server: he signs his part with the key of a certificate;\n- Alice is the browser: she knows how to check that certificate.\n\nHere, Bob’s GREEN carries his gold seal, and Alice has Bob’s certificate to compare it with. **Eve can still relay the messages, but she can no longer produce that signature.**",
      go: 'Eve tries again', go2: 'Eve only relays',
      a: 'This seal is not the one on Bob’s certificate: I refuse this exchange.', e: 'I can stop his pot, not fake his seal.',
      a2: 'The seal matches the certificate: this really is Bob’s part.', e2: 'All I have is a copy of GREEN: I am back to chapter 3.' },
    s15: { t: 'What to remember',
      p: "Two ideas:\n- a shared secret is worked out in public: only YELLOW, ORANGE and GREEN go past Eve, and BROWN is never sent;\n- Diffie-Hellman does not know who is on the other side: the certificate’s signature is what tells.\n\nThen what comes next: back to Antiquity, with a strip wound around a stick, where the stick’s diameter is the key.",
      doors: { sandbox: ['Sandbox', 'Pick the colours, let Eve listen or step in'], quiz: ['Quiz', 'Seven questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 4 · The Scytale ▶', 'A strip wound around a stick'] } },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Pick the secret colours, what Eve does, and run the exchange.',
    alice: 'Alice’s secret colour', bob: 'Bob’s secret colour',
    enemy: 'Eve', listen: 'Eve watches the pots go by', middle: 'Eve steps into the middle',
    sign: 'Bob signs his part (certificate)',
    run: 'Run the exchange ▶', reset: 'Start over',
    ready: 'Ready: choose, then run the exchange.',
    aliceHas: 'Alice gets', bobHas: 'Bob gets', eveHas: 'Eve has',
    same: 'Alice and Bob have the same colour: a shared secret.',
    differ: 'Alice and Bob do not have the same colour.',
    eveKnowsBoth: 'Eve knows both secrets: she reads and changes everything.',
    eveBlind: 'Eve does not know the secret: she cannot unmix.',
    refused: 'Alice refuses: the part she got does not carry Bob’s signature. The exchange stops, Eve learns nothing.',
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
