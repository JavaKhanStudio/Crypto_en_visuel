// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The story follows the course's slides on storing passwords (« Mots de passe - Dictionnaire »,
// « - Les rainbow tables », « - Le sel », « - SHA-256 est trop rapide », « - bcrypt », « - bcrypt -
// La lenteur », « Ce que l'attaquant manipule - La base volée ») and uses their values in both
// languages: password -> 5f4dcc3b, password+x7k2m -> cffbee8f, password+r3n8q -> 648c5237, bcrypt
// rounds=12 in 0.24 s. sel/js/hash.js computes them, tests/sel_values.mjs checks them.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Le sel (et la lenteur de bcrypt) — Crypto en visuel',
  title: 'Le sel (et la lenteur de bcrypt)',
  subtitle: 'Deux mots de passe identiques, deux empreintes différentes, et un attaquant qui n’avance plus.',
  loading: 'On allume les serveurs…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  sec: '{s} s', min: '{n} min', hours: '{n} h', days: '{n} jours', years: '{n} ans',
  scene: {
    base: { md5: 'La base du site (MD5)', bcrypt: 'La base du site (bcrypt)' },
    cols: ['utilisateur', 'sel', 'empreinte'],
    copy: 'La copie d’Eve', empty: '(rien encore)', book: 'Mots de passe courants → MD5',
    site: 'Connexion', signup: 'Inscription', saved: 'Compte enregistré', leak: 'la base',
    counter: { head: { md5: 'Eve essaie, en MD5', bcrypt: 'Eve essaie, en bcrypt (rounds=12)' }, unit: 'essais par seconde', all: 'tous les mots de 8 caractères a-z A-Z 0-9 : {d}' },
  },
  head: { nosalt: 'sans sel', salt: 'avec sel (MD5)' },
  speed: { md5: 'plus de 10 milliards d’essais / s ; 8 caractères : 6 h environ', bcrypt: 'quelques milliers d’essais / s ; 8 caractères : plus de 1 000 ans' },
  recap: {
    salt: { k: 'le sel', v: 'lui interdit de précalculer' },
    slow: { k: 'la lenteur', v: 'lui interdit d’aller vite (bcrypt, Argon2id)' },
    weak: { k: 'il lui reste', v: 'les mots de passe vraiment faibles' },
    order: { k: 'l’ordre de préférence', v: 'Argon2id, puis bcrypt, puis scrypt ; jamais un SHA seul' },
  },
  card: {
    title: { sel: 'Mots de passe - Le sel', slow: 'Mots de passe - bcrypt - La lenteur', book: 'La table précalculée d’Eve', speed: 'Eve essaie, un par un', recap: 'Ce que l’attaquant manipule - La base volée' },
    where: { sel: 'une ligne par inscription', slow: 'rounds=12 : 2^12 tours de calcul par hachage', book: 'chaque empreinte de la base, cherchée dans son livre', speed: 'SHA-256 est trop rapide, bcrypt est lent', recap: 'il vole la base, puis il joue sur le temps' },
    blank: 'Rien encore.', notIn: 'absente du livre', took: 'a pris',
  },
  ch: ['Le site', 'La fuite', 'Le sel', 'Un par un', 'La lenteur', 'À vous'],
  steps: {
    s1: { t: 'Un site, deux comptes',
      p: "Alice et Bob s’inscrivent sur le même site, et tous les deux ont choisi le même mot de passe : **password**. Le site doit vérifier ce mot de passe à chaque connexion, mais il ne doit jamais pouvoir le relire : s’il le gardait en clair, une fuite de sa base livrerait tous les comptes.\n\nAu fond de la salle, Eve attend justement cette fuite.",
      a: 'Mon mot de passe : password. Facile à retenir.', b: 'Moi aussi : password. Personne ne le saura.', e: 'Qu’on me donne la base, je ferai le reste.' },
    s2: { t: 'Une empreinte, pas le mot de passe',
      p: "Alice tape **password**. Le site ne le range pas tel quel :\n- il le passe dans une fonction de hachage, ici MD5 ;\n- il ne garde que l’empreinte, {g|5f4dcc3b5aa765d61d8327deb882cf99}, abrégée en {g|5f4dcc3b…} dans la scène ;\n- à chaque connexion, il hachera ce qu’Alice tape et comparera les deux empreintes.\n\nDepuis l’empreinte, impossible de remonter au mot de passe : le hachage est à sens unique.",
      go: 'Alice s’inscrit', a: 'Le site ne connaît que 5f4dcc3b. Mon mot de passe n’est écrit nulle part.' },
    s3: { t: 'Bob a le même',
      p: "Bob s’inscrit à son tour, avec **password** lui aussi. Le hachage est déterministe : la même entrée donne toujours la même empreinte. Bob obtient donc exactement {g|5f4dcc3b}, comme Alice, et dans la base les deux lignes sont identiques.",
      go: 'Bob s’inscrit', b: 'La même empreinte qu’Alice… Qui lit la base voit qu’on a le même mot de passe.' },
    s4: { t: 'La base fuit',
      p: "Un jour, la base du site fuit, et Eve en obtient une copie : les noms et les empreintes. Elle n’a toujours pas les mots de passe.\n\nMais elle voit déjà une chose : alice et bob ont la même empreinte, donc le même mot de passe, quel qu’il soit.",
      go: 'Eve vole la base', e: 'Deux empreintes pareilles : un seul mot de passe à trouver, et j’ouvre deux comptes.' },
    s5: { t: 'La table précalculée',
      p: "Eve n’inverse rien. Bien avant la fuite, elle a haché à l’avance les mots de passe les plus courants :\n- **password** donne {g|5f4dcc3b} ;\n- **123456** donne {g|e10adc39} ;\n- **admin** donne {g|21232f29}…\n\nC’est sa table précalculée ; les rainbow tables en sont une version compacte, qui couvre des milliards de mots de passe. Il lui suffit de chercher chaque empreinte de la base dans son livre.",
      go: 'Eve cherche dans sa table', e: '5f4dcc3b, c’est password. Une recherche, deux comptes ouverts.' },
    s6: { t: 'Un sel pour Alice',
      p: "Le site se corrige. Pour chaque utilisateur, il tire au hasard une petite valeur, le sel : pour Alice, {b|x7k2m}.\n\nIl colle le sel au bout du mot de passe avant de hacher :\n- MD5 reçoit **password**{b|x7k2m} (on l’écrit aussi password+x7k2m) ;\n- il rend {g|cffbee8f}.\n\nLe sel n’est pas secret : le site le range en clair à côté de l’empreinte, il en a besoin à chaque connexion.",
      go: 'Alice s’inscrit, avec un sel', a: 'Mon sel : x7k2m. Mon empreinte : cffbee8f.' },
    s7: { t: 'Un autre sel pour Bob',
      p: "Bob reçoit son propre sel, tiré lui aussi au hasard : {b|r3n8q}. Le même mot de passe qu’Alice, mais deux empreintes qui n’ont plus rien à voir :\n- Alice : MD5 reçoit **password**{b|x7k2m} et rend {g|cffbee8f} ;\n- Bob : MD5 reçoit **password**{b|r3n8q} et rend {g|648c5237}.\n\nDans la base, plus rien ne montre qu’ils ont le même.",
      go: 'Bob s’inscrit, avec un sel', b: '648c5237 pour moi, cffbee8f pour Alice. Plus personne ne peut voir qu’on a le même.' },
    s8: { t: 'La table ne sert plus',
      p: "La base fuit encore. Eve cherche {g|cffbee8f} et {g|648c5237} dans son livre : {r|rien}.\n\nSa table a été calculée sans sel. Pour qu’elle serve, il faudrait la recalculer pour {b|x7k2m}, puis encore pour {b|r3n8q} : une table par utilisateur. Toute table précalculée devient inutile, et Eve ne voit même plus qu’Alice et Bob partagent un mot de passe.",
      go: 'Eve vole la base et cherche', e: 'Rien dans mon livre. Ma table ne vaut plus rien.' },
    s9: { t: 'Essayer, un par un',
      p: "Il reste une voie à Eve : le sel est dans la base, sous ses yeux. Pour Alice, elle prend chaque mot de passe possible, puis :\n- elle y colle {b|x7k2m} ;\n- elle le hache ;\n- elle compare avec {g|cffbee8f}.\n\nC’est un utilisateur à la fois, mais MD5 est rapide, comme SHA-256 : conçus pour aller vite, une carte graphique en calcule plus de dix milliards par seconde. Tous les mots de passe de 8 caractères alphanumériques y passent en six heures environ. Et **password** est parmi les premiers de sa liste.",
      go: 'Eve essaie pour Alice', e: 'passwordx7k2m donne cffbee8f. Le sel m’a seulement obligée à recommencer pour chacun.' },
    s10: { t: 'bcrypt : lent exprès',
      p: "Le site remplace MD5 par bcrypt, fait pour les mots de passe. bcrypt.gensalt() tire le sel, et bcrypt le range dans la chaîne qu’il rend :\n- $2b$12$, l’algorithme et ses rounds ;\n- puis 22 caractères de {b|sel} ;\n- puis l’{g|empreinte}.\n\nSurtout, bcrypt est lent exprès : rounds=12, c’est 2^12 = 4\u00a0096 tours de calcul. Sur la machine du professeur, un seul hachage a pris 0,24\u00a0seconde. Alice ne remarque rien en se connectant.",
      go: 'Alice se connecte, en bcrypt', a: '0,24 seconde. Je ne l’ai même pas senti.' },
    s11: { t: 'Eve n’avance plus',
      p: "Eve vole la nouvelle base et relance son matériel. Mais chaque essai coûte maintenant ces 4\u00a0096 tours :\n- elle passe de milliards d’essais par seconde à quelques milliers ;\n- les mots de passe de 8 caractères ne tombent plus en six heures, mais en plus de mille ans.\n\nCe que bcrypt ne sauve pas : un mot de passe que sa liste essaie en premier. **password** tombe encore, en deux essais.",
      go: 'Le compteur d’Eve', e1: 'De dix milliards par seconde à deux mille. Mes six heures deviennent des siècles.', e2: 'password tombe quand même. Il ne me reste que les mots de passe faibles.' },
    s12: { t: 'Ce que l’attaquant manipule',
      p: "Contre les mots de passe, l’attaquant ne casse aucune fonction : il vole la base, puis il joue sur le temps. Face à lui :\n- le sel lui interdit de précalculer ;\n- la lenteur de bcrypt, ou d’Argon2id, lui interdit d’aller vite ;\n- il ne lui reste que les mots de passe vraiment faibles.\n\nL’ordre de préférence : Argon2id, puis bcrypt, puis scrypt ; jamais un SHA seul.",
      a: 'Un sel, un hachage lent… et un vrai mot de passe.', e: 'Je n’ai cassé ni MD5 ni bcrypt. J’ai seulement compté.' },
    s13: { t: 'À vous',
      p: "Dans le bac à sable :\n- choisissez les mots de passe d’Alice et de Bob, avec ou sans sel, en MD5 ou en bcrypt ;\n- laissez Eve voler la base : elle cherche dans sa table, puis estime le temps qu’il lui faudrait pour essayer tous les mots de passe de la même forme ;\n- mesurez bcrypt sur votre machine.\n\nEnsuite, le quiz : 7 questions. Puis la suite : un garde qui compare un badge lettre par lettre, et l’attaquant qui, encore une fois, ne casse rien : il chronomètre.",
      doors: { sandbox: ['Bac à sable', 'Vos mots de passe, avec ou sans sel, en MD5 ou en bcrypt'], quiz: ['Quiz', 'Sept questions pour vérifier'],
        home: ['Tous les épisodes', 'La série Crypto en visuel'], next: ['Épisode 8 · Le garde trop pressé ▶', 'Un badge vérifié lettre par lettre'] } },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Choisissez deux mots de passe et la façon dont le site les range, inscrivez Alice et Bob, puis laissez Eve voler la base.',
    pw: 'Les mots de passe', store: 'Le site range', md5: 'MD5, sans sel', salt: 'MD5, avec un sel', bcrypt: 'bcrypt, rounds=12',
    newSalt: 'Tirer d’autres sels', salts: 'Les sels :', signup: 'Inscrire Alice et Bob', steal: 'Eve vole la base', reset: 'Recommencer',
    here: 'Sur votre machine', measure: 'Mesurer bcrypt et MD5',
    measuring: 'Mesure en cours…', measured: 'Ici, un bcrypt (rounds=12) prend <b>{b}</b> ; MD5 tourne à <b>{m}</b> par seconde dans ce navigateur, sans carte graphique.',
    computing: 'bcrypt calcule l’empreinte de {u}…',
    ready: 'Prêt : inscrivez Alice et Bob.', signed: 'Prêt : Eve peut voler la base.',
    same: 'alice et bob ont la même empreinte : Eve voit qu’ils ont le même mot de passe.',
    found: '{u} : <span class="ko">dans la table d’Eve, {w}</span>, ouvert sans aucun calcul',
    inList: '{u} : absente de la table, mais {w} est dans la liste d’Eve : <span class="ko">trouvé aux premiers essais</span>',
    space: '{u} : {n} symboles possibles, {l} caractères, soit {s} essais au pire ; à {r} essais par seconde : <b>{d}</b>',
    empty: 'Un mot de passe vide ne se range pas.',
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
  tab: 'Salt (and the slowness of bcrypt) — Crypto, Visualized',
  title: 'Salt (and the slowness of bcrypt)',
  subtitle: 'Two identical passwords, two different fingerprints, and an attacker who stops getting anywhere.',
  loading: 'Switching the servers on…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  sec: '{s} s', min: '{n} min', hours: '{n} h', days: '{n} days', years: '{n} years',
  scene: {
    base: { md5: 'The site’s database (MD5)', bcrypt: 'The site’s database (bcrypt)' },
    cols: ['user', 'salt', 'fingerprint'],
    copy: 'Eve’s copy', empty: '(nothing yet)', book: 'Common passwords → MD5',
    site: 'Log in', signup: 'Sign up', saved: 'Account saved', leak: 'the database',
    counter: { head: { md5: 'Eve tries, with MD5', bcrypt: 'Eve tries, with bcrypt (rounds=12)' }, unit: 'tries per second', all: 'every 8-character a-z A-Z 0-9 word: {d}' },
  },
  head: { nosalt: 'no salt', salt: 'with salt (MD5)' },
  speed: { md5: 'over 10 billion tries / s; 8 characters: about 6 h', bcrypt: 'a few thousand tries / s; 8 characters: over 1,000 years' },
  recap: {
    salt: { k: 'the salt', v: 'stops them precomputing' },
    slow: { k: 'slowness', v: 'stops them going fast (bcrypt, Argon2id)' },
    weak: { k: 'what is left', v: 'the truly weak passwords' },
    order: { k: 'the order of preference', v: 'Argon2id, then bcrypt, then scrypt; never a bare SHA' },
  },
  card: {
    title: { sel: 'Passwords - The salt', slow: 'Passwords - bcrypt - The slowness', book: 'Eve’s precomputed table', speed: 'Eve tries, one at a time', recap: 'What the attacker plays with - The stolen database' },
    where: { sel: 'one row per sign-up', slow: 'rounds=12: 2^12 rounds of work per hash', book: 'each fingerprint of the database, looked up in her book', speed: 'SHA-256 is too fast, bcrypt is slow', recap: 'they steal the database, then play on time' },
    blank: 'Nothing yet.', notIn: 'not in the book', took: 'took',
  },
  ch: ['The site', 'The leak', 'The salt', 'One at a time', 'Slowness', 'Your turn'],
  steps: {
    s1: { t: 'One site, two accounts',
      p: "Alice and Bob sign up on the same site, and both chose the same password: **password**. The site has to check that password at every login, but it must never be able to read it back: if it kept it in the clear, a leak of its database would give away every account.\n\nAt the back of the room, Eve is waiting for exactly that leak.",
      a: 'My password: password. Easy to remember.', b: 'Mine too: password. Nobody will know.', e: 'Just give me the database, I’ll do the rest.' },
    s2: { t: 'A fingerprint, not the password',
      p: "Alice types **password**. The site does not store it as it is:\n- it runs it through a hash function, here MD5;\n- it keeps only the fingerprint, {g|5f4dcc3b5aa765d61d8327deb882cf99}, shortened to {g|5f4dcc3b…} in the scene;\n- at every login, it will hash what Alice types and compare the two fingerprints.\n\nFrom the fingerprint there is no way back to the password: hashing is one-way.",
      go: 'Alice signs up', a: 'The site only knows 5f4dcc3b. My password is written nowhere.' },
    s3: { t: 'Bob has the same one',
      p: "Bob signs up in turn, with **password** as well. Hashing is deterministic: the same input always gives the same fingerprint. So Bob gets exactly {g|5f4dcc3b}, like Alice, and the two rows of the database are identical.",
      go: 'Bob signs up', b: 'The same fingerprint as Alice… Anyone who reads the database sees we have the same password.' },
    s4: { t: 'The database leaks',
      p: "One day the site’s database leaks, and Eve gets a copy: the names and the fingerprints. She still does not have the passwords.\n\nBut she already sees one thing: alice and bob have the same fingerprint, so the same password, whatever it is.",
      go: 'Eve steals the database', e: 'Two identical fingerprints: one password to find, and I open two accounts.' },
    s5: { t: 'The precomputed table',
      p: "Eve reverses nothing. Long before the leak, she hashed the most common passwords in advance:\n- **password** gives {g|5f4dcc3b};\n- **123456** gives {g|e10adc39};\n- **admin** gives {g|21232f29}…\n\nThat is her precomputed table; rainbow tables are a compact version of it that covers billions of passwords. All she has to do is look each fingerprint of the database up in her book.",
      go: 'Eve looks it up', e: '5f4dcc3b is password. One look-up, two accounts open.' },
    s6: { t: 'A salt for Alice',
      p: "The site fixes itself. For each user it draws a small random value, the salt: for Alice, {b|x7k2m}.\n\nIt glues the salt to the end of the password before hashing:\n- MD5 gets **password**{b|x7k2m} (also written password+x7k2m);\n- it gives {g|cffbee8f}.\n\nThe salt is not secret: the site keeps it in the clear next to the fingerprint, it needs it at every login.",
      go: 'Alice signs up, with a salt', a: 'My salt: x7k2m. My fingerprint: cffbee8f.' },
    s7: { t: 'Another salt for Bob',
      p: "Bob gets his own salt, drawn at random too: {b|r3n8q}. The same password as Alice, but two fingerprints that have nothing to do with each other:\n- Alice: MD5 gets **password**{b|x7k2m} and gives {g|cffbee8f};\n- Bob: MD5 gets **password**{b|r3n8q} and gives {g|648c5237}.\n\nNothing in the database shows any more that they share it.",
      go: 'Bob signs up, with a salt', b: '648c5237 for me, cffbee8f for Alice. Nobody can tell we have the same one.' },
    s8: { t: 'The table is useless now',
      p: "The database leaks again. Eve looks up {g|cffbee8f} and {g|648c5237} in her book: {r|nothing}.\n\nHer table was computed without salt. To be of use it would have to be computed again for {b|x7k2m}, then again for {b|r3n8q}: one table per user. Every precomputed table becomes useless, and Eve cannot even see any more that Alice and Bob share a password.",
      go: 'Eve steals the database and looks', e: 'Nothing in my book. My table is worth nothing now.' },
    s9: { t: 'Trying, one at a time',
      p: "Eve has one way left: the salt is in the database, right in front of her. For Alice, she takes every possible password, then:\n- she glues {b|x7k2m} to it;\n- she hashes it;\n- she compares with {g|cffbee8f}.\n\nThat is one user at a time, but MD5 is fast, like SHA-256: built to go fast, a graphics card computes more than ten billion of them a second. Every 8-character alphanumeric password goes through in about six hours. And **password** is among the first of her list.",
      go: 'Eve tries for Alice', e: 'passwordx7k2m gives cffbee8f. The salt only made me start again for each one.' },
    s10: { t: 'bcrypt: slow on purpose',
      p: "The site replaces MD5 with bcrypt, made for passwords. bcrypt.gensalt() draws the salt, and bcrypt keeps it in the string it returns:\n- $2b$12$, the algorithm and its rounds;\n- then 22 characters of {b|salt};\n- then the {g|fingerprint}.\n\nAbove all, bcrypt is slow on purpose: rounds=12 means 2^12 = 4,096 rounds of work. On the teacher’s machine one single hash took 0.24\u00a0seconds. Alice notices nothing when she logs in.",
      go: 'Alice logs in, with bcrypt', a: '0.24 seconds. I did not even feel it.' },
    s11: { t: 'Eve gets nowhere',
      p: "Eve steals the new database and starts her hardware again. But every try now costs those 4,096 rounds:\n- she drops from billions of tries a second to a few thousand;\n- passwords of 8 characters no longer fall in six hours, but in more than a thousand years.\n\nWhat bcrypt does not save: a password her list tries first. **password** still falls, in two tries.",
      go: 'Eve’s counter', e1: 'From ten billion a second to two thousand. My six hours become centuries.', e2: 'password falls all the same. All I have left are the weak passwords.' },
    s12: { t: 'What the attacker plays with',
      p: "Against passwords, the attacker breaks no function: they steal the database, then play on time. Against them:\n- the salt stops them precomputing;\n- the slowness of bcrypt, or Argon2id, stops them going fast;\n- all they have left are the truly weak passwords.\n\nThe order of preference: Argon2id, then bcrypt, then scrypt; never a bare SHA.",
      a: 'A salt, a slow hash… and a real password.', e: 'I broke neither MD5 nor bcrypt. I only counted.' },
    s13: { t: 'Your turn',
      p: "In the sandbox:\n- pick Alice’s and Bob’s passwords, with or without salt, with MD5 or bcrypt;\n- let Eve steal the database: she looks in her table, then works out how long it would take her to try every password of the same shape;\n- measure bcrypt on your machine.\n\nThen the quiz: 7 questions. Then what comes next: a guard who checks a badge letter by letter, and an attacker who, once again, breaks nothing: they time it.",
      doors: { sandbox: ['Sandbox', 'Your passwords, salted or not, with MD5 or bcrypt'], quiz: ['Quiz', 'Seven questions to check'],
        home: ['All episodes', 'The Crypto, Visualized series'], next: ['Episode 8 · The Hasty Guard ▶', 'A badge checked letter by letter'] } },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Pick two passwords and how the site stores them, sign Alice and Bob up, then let Eve steal the database.',
    pw: 'The passwords', store: 'The site stores', md5: 'MD5, no salt', salt: 'MD5, with a salt', bcrypt: 'bcrypt, rounds=12',
    newSalt: 'Draw other salts', salts: 'The salts:', signup: 'Sign Alice and Bob up', steal: 'Eve steals the database', reset: 'Start again',
    here: 'On your machine', measure: 'Measure bcrypt and MD5',
    measuring: 'Measuring…', measured: 'Here, one bcrypt (rounds=12) takes <b>{b}</b>; MD5 runs at <b>{m}</b> a second in this browser, with no graphics card.',
    computing: 'bcrypt is computing {u}’s fingerprint…',
    ready: 'Ready: sign Alice and Bob up.', signed: 'Ready: Eve can steal the database.',
    same: 'alice and bob have the same fingerprint: Eve sees they have the same password.',
    found: '{u}: <span class="ko">in Eve’s table, {w}</span>, opened with no computing at all',
    inList: '{u}: not in the table, but {w} is in Eve’s list: <span class="ko">found in the first tries</span>',
    space: '{u}: {n} possible symbols, {l} characters, so {s} tries at worst; at {r} tries a second: <b>{d}</b>',
    empty: 'An empty password cannot be stored.',
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

// numbers as each language writes them: 10 000 000 000 / 10,000,000,000, and 0,24 / 0.24
export const num = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'fr' ? ' ' : ',');
export const dec = (x, d = 2) => lang === 'fr' ? x.toFixed(d).replace('.', ',') : x.toFixed(d);
