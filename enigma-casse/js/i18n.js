// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The values are this episode's own (r114), computed by enigma-casse/js/enigma.js and
// enigma-casse/js/story.js and checked by tests/enigma-casse_values.mjs, which also reads the
// figures written here: 5.2's sheet of the day (I II III, right ring on B, cables BS CZ DN ER FI GU
// HO KW LM QY), start IXX, HEUTEXWETTERBERICHTXEIS -> EBOWTASBRMHCEFBMMXEFFPA; H at IXX goes in at O,
// Y B R, the reflector, B R B R, lamp E; the crib WETTERBERICHT is ruled out at places 1 2 3 4 6 9
// (place 1: R under R, letter 9), places 5 7 8 10 11 left; the loop of place 7 at IXW: E→A gives
// J I G and back S, E→R gives S E T and back R; 5 menus × 17 576 = 87 880 positions, 9 stops, one
// holds (place 7, IXW, E–R); with rings A, IXW and those 7 cables the cipher reads
// HEGTEXWETTERBERICHTXEIS, and with G–U the message.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Enigma, la casse — Crypto en visuel',
  title: 'Enigma, la casse',
  subtitle: 'Une lettre n’est jamais chiffrée en elle-même, un mot deviné glisse sous le chiffré, et la bombe de Turing trouve le réglage.',
  loading: 'On fait chauffer la bombe…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  part: { entry: 'entrée', ref: 'réflecteur B' },
  notchWord: 'encoche',
  card: { title: 'Le trajet du courant', key: 'touche', from: 'départ', ref: 'réf', whose: { a: 'Machine d’Alice', b: 'Machine de Bob', e: 'Machine d’Eve' },
    setup: 'rotors {r}', rings: 'bagues {g}', pos: 'position {p}', start: 'départ {p}', cables: 'câbles :', noCable: 'aucun',
    blank: 'Aucune touche encore.' },
  pane: {
    ref: { title: 'Le réflecteur B', sub: '13 fils, chacun relie deux contacts. Aucun contact n’est relié à lui-même.' },
    crib: { title: 'Le mot probable', sub: '{n} places possibles dans le chiffré', place: 'place', out: 'exclue : {c} sous {c} (lettre {n})', ok: 'possible', left: 'Places restantes :' },
    menu: { title: 'Le menu de la place {k}', sub: 'lettre du message : lettre du mot – lettre du chiffré',
      guess: 'À la position {p} :', holds: 'la boucle tient', falls: 'tombe : {a} ≠ {b}' },
    bombe: { title: 'La bombe', checkTitle: 'Le commis vérifie les arrêts', sub: 'rotors {r} dans cet ordre, bagues sur A, lettre testée : {x}',
      tried: 'positions essayées', stops: 'arrêts', total: '{n} positions, {s} arrêt(s)', pos: 'position', guess: 'câble', bad: '✗ {c} aurait deux câbles', good: '✓ tient :' },
  },
  ch: ['Le bulletin', 'Jamais elle-même', 'Le mot probable', 'Le menu', 'La bombe', 'La vérification', 'L’histoire'],
  steps: {
    s1: { t: 'Le bulletin météo',
      p: "Six heures du matin. Comme chaque jour, Alice envoie à Bob le bulletin météo. Même machine et même feuille du jour que pour « OUI » : rotors I, II et III, bague du rotor de droite sur B, les dix câbles. Pour ce message, elle part de IXX et tape HEUTEXWETTERBERICHTXEIS, « aujourd’hui, bulletin météo : glace » en allemand, avec des X à la place des espaces. Sa machine allume EBOWTASBRMHCEFBMMXEFFPA.",
      a: 'Le bulletin, comme tous les matins.', b: 'Je l’attends, avec la même feuille.', e: 'Vingt-trois lettres, chaque matin à la même heure…' },
    s2: { t: 'Par radio',
      p: "Alice envoie les 23 lettres par radio, et Eve les note au passage. Elle a même une copie de la machine sur son bureau. Mais sans la feuille du jour, il lui faudrait essayer environ 1,59 × 10²⁰ réglages, sans compter les bagues. Elle ne va pas les essayer un à un : elle va chercher un défaut.",
      go: 'Revoir l’envoi', e: 'EBOWTASBRMHCEFBMMXEFFPA. Tout essayer ? Non : je cherche un défaut.' },
    s3: { t: 'Une lettre, un chemin',
      p: "Revenons chez Alice, au départ IXX, pour la première lettre. Elle appuie sur H. Le rotor de droite avance en IXY, et le câble H–O fait entrer le courant en O. Le rotor III l’envoie en Y, le II en B, le I en R. Le réflecteur le renvoie en B ; il repasse les rotors I, II et III : R, B, R. Le câble R–E allume la lampe E. H devient E.",
      go: 'Appuyer sur H', a: 'H allume E.' },
    s4: { t: 'Jamais elle-même',
      p: "La lampe H, elle, ne pourrait jamais s’allumer. Pour cela, le courant devrait ressortir des rotors sur le contact même où il y est entré, le O, avant de reprendre le câble O–H. Or, au retour, il traverse les mêmes rotors à l’envers : ressortir là où il est entré, c’est quitter le réflecteur sur le contact même où il y est arrivé. Le réflecteur B relie ses 26 contacts deux à deux, par 13 fils : aucun ne revient sur lui-même. Câbles ou pas, à n’importe quelle position, une lettre n’est jamais chiffrée en elle-même.",
      e: 'Jamais elle-même. C’est par là que j’entre.' },
    s5: { t: 'Le mot probable',
      p: "Eve fait un pari : chaque matin à cette heure-là, le message est le bulletin météo, et il contient le mot WETTERBERICHT, « bulletin météo ». Un mot qu’on devine dans un message chiffré s’appelle un mot probable. Eve ne sait pas où il se trouve. Elle écrit les 23 lettres du chiffré sur son ardoise, les numérote, et pose les 13 lettres du mot dessous. Le mot peut commencer sous la lettre 1, 2, et ainsi de suite jusqu’à 11 : 11 places.",
      e: 'Le mot y est. Mais où ?' },
    s6: { t: 'Une lettre sur elle-même',
      p: "Place 1 : le mot commence sous la première lettre du chiffré. Eve compare, colonne par colonne. À la 9e lettre, le R du mot tombe sous un R du chiffré. Si le mot était là, la machine aurait chiffré un R en R : c’est impossible. La place 1 est exclue.",
      go: 'Comparer à la place 1', e: 'R sous R : pas ici.' },
    s7: { t: 'Faire glisser le mot',
      p: "Eve fait glisser le mot d’un cran, puis d’un autre, jusqu’à la place 11, la dernière où il tient en entier. À chaque place, il suffit d’une lettre sous elle-même pour l’exclure. Six places tombent : 1, 2, 3, 4, 6 et 9. Il en reste cinq : 5, 7, 8, 10 et 11. Le mot est à l’une d’elles.",
      go: 'Faire glisser le mot', e: 'Onze places, il en reste cinq.' },
    s8: { t: 'Le menu',
      p: "Eve fait le même travail pour chacune des cinq places ; suivons la place 7. Chaque colonne relie deux lettres : à la 7e lettre du message, la machine a changé W en S ; à la 8e, E en B ; et ainsi de suite jusqu’à la 19e, T en E. Ce sont les câbles qui comptent ici : à la 7e lettre, le W passe son câble, traverse les rotors, et ressort par le câble de S. Eve écrit chaque lettre une fois, et chaque colonne comme un trait entre deux lettres, numéroté par sa place dans le message. Ce dessin s’appelle un menu.",
      go: 'Dessiner le menu', e: 'Treize traits, douze lettres.' },
    s9: { t: 'Une boucle',
      p: "Le menu a des boucles. De E, le trait 8 mène à B, le 15 à R, le 9 à T, et le 19 ramène à E. Prenons une position des rotors, IXW, et une supposition : « le câble de E va à A ». Le trait 8 dit : à la 8e lettre, A traverse les rotors et ressort en J ; donc le câble de B va à J. Le trait 15 donne de même le câble de R, en I ; le 9, celui de T, en G ; et le 19 ramène à E, en S. Mais on avait supposé A : la supposition tombe. Avec « le câble de E va à R », la boucle revient sur R : elle tient. Une boucle seule laisse passer quelques suppositions ; les autres traits du menu les arrêtent.",
      go: 'Suivre deux suppositions', e: 'A ne tient pas. R tient.' },
    s10: { t: 'La bombe',
      p: "Faire cela à la main pour 17 576 positions prendrait des semaines. En 1939, Alan Turing conçoit une machine qui le fait : la bombe. Chaque groupe de trois tambours fait le travail des rotors et du réflecteur d’une Enigma ; il y a un groupe par trait du menu, avancé d’autant de crans que la place de son trait, et des fils entre les groupes recopient le menu. On envoie le courant dans un fil : « le câble de E va à A ». Toutes les suites de cette supposition s’allument d’un coup, et un câble allant dans les deux sens, si E va à A, alors A va à E : c’est le tableau diagonal, ajouté par Gordon Welchman.",
      e: 'Une Enigma par trait du menu, toutes reliées.' },
    s11: { t: 'La bombe tourne',
      p: "La bombe essaie les 17 576 positions une à une. Si les 26 fils de E s’allument, toutes les suppositions sur le câble de E tombent : position suivante. S’il en reste un seul éteint, c’est la seule supposition qui tient : la bombe s’arrête. Ici, elle tourne avec les rotors I, II et III dans cet ordre, les bagues sur A, pour les menus des cinq places. C’est un raccourci : Eve ne connaît pas l’ordre des rotors, et la vraie bombe recommençait pour chacun des 60 ordres. Cinq menus, 87 880 positions : 9 arrêts.",
      go: 'Lancer la bombe', e: 'Neuf arrêts sur 87 880 positions.' },
    s12: { t: 'Les arrêts',
      p: "Un arrêt n’est pas encore une réponse. Pour chacun, Eve suit la supposition à travers tout le menu et en tire un câble pour chaque lettre. Huit arrêts donnent à une lettre deux câbles à la fois : impossible, ils tombent. Un seul tient : place 7, position IXW, le câble E–R, et avec lui B–S, C–Z, F–I, H–O, K–W et L–M ; T et X n’ont pas de câble.",
      go: 'Vérifier les arrêts', e: 'Un seul tient : place 7, IXW.' },
    s13: { t: 'Sur la machine',
      p: "Reste à essayer. En juillet 1939, les cryptologues polonais avaient donné une copie d’Enigma aux Britanniques et une aux Français ; Eve a la sienne. Elle place les rotors I, II et III, les bagues sur A, les sept câbles trouvés, la position IXW, et tape le chiffré. La machine allume HEGTEXWETTERBERICHTXEIS.",
      go: 'Taper le chiffré', e: 'HEGTE… WETTERBERICHT… EIS. Presque !' },
    s14: { t: 'Le message se lit',
      p: "HEGTE doit être HEUTE, « aujourd’hui » : il manque un câble entre G et U, deux lettres absentes du menu. Eve le branche, remet IXW et retape : HEUTEXWETTERBERICHTXEIS. La feuille d’Alice et Bob disait bague B et départ IXX ; la bombe a trouvé bague A et IXW. Un cran de bague contre un cran de départ : les fils du rotor de droite sont au même endroit, et le rotor du milieu n’avance pas dans ce message. Eve tient les rotors et les câbles du jour : ils servent, ce jour-là, à tous les messages.",
      go: 'Brancher G–U et retaper', e: 'HEUTE X WETTERBERICHT X EIS. Bonjour, Alice.' },
    s15: { t: 'La vraie histoire',
      p: "L’histoire est simplifiée ; ses idées sont celles de la vraie. En Pologne, Marian Rejewski reconstitue le câblage des rotors d’Enigma fin 1932, et avec Jerzy Różycki et Henryk Zygalski, il lit des messages allemands pendant des années. En 1938, leur « bomba » cherche le réglage autrement, à partir de la clé de message que les opérateurs tapaient deux fois. En juillet 1939, ils montrent tout aux Britanniques et aux Français. À Bletchley Park, Alan Turing conçoit la bombe à mots probables ; la première tourne en 1940, Gordon Welchman y ajoute le tableau diagonal, et à la fin de la guerre, la Grande-Bretagne en a environ deux cents.",
      e: 'Le défaut était dans le réflecteur depuis le début.' },
    s16: { t: 'À vous',
      p: "Dans le bac à sable, faites glisser un mot probable sous un chiffré : chaque place où une lettre tombe sous elle-même est exclue. Lancez la bombe sur une place qui reste : elle essaie les 17 576 positions des rotors I, II et III, et le commis vérifie ses arrêts. Ou testez-vous avec le quiz.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz' },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Faites glisser le mot probable sous le chiffré, puis lancez la bombe sur une place qui reste.',
    cipher: 'Chiffré intercepté', crib: 'Mot probable', place: 'Place du mot', placeOf: 'place {k} / {n}',
    sweep: 'Faire glisser jusqu’au bout', bad: 'Lettres de A à Z seulement, et un mot plus court que le chiffré.',
    out: 'Place {k} exclue : {c} sous {c} (lettre {n}).', ok: 'Place {k} possible : aucune lettre sous elle-même.',
    bombe: 'Lancer la bombe sur cette place', note: 'Rotors I, II, III dans cet ordre, bagues sur A, lettre testée : {x}.',
    running: 'La bombe tourne…', none: 'Aucun arrêt : à cette place, avec cet ordre des rotors, le mot ne tient pas.',
    stops: 'Arrêts : {n}. Qui tiennent : {g}.', try: 'Essayer sur la machine d’Eve', reads: 'La machine d’Eve lit : {m}',
    reset: 'Reprendre le message d’Eve',
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
  tab: 'Enigma, the Break — Crypto, Visualized',
  title: 'Enigma, the Break',
  subtitle: 'A letter never encrypts to itself, a guessed word moves along under the cipher, and Turing’s bombe finds the setting.',
  loading: 'Warming up the bombe…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  part: { entry: 'entry', ref: 'reflector B' },
  notchWord: 'notch',
  card: { title: 'The path of the current', key: 'key', from: 'start', ref: 'ref', whose: { a: 'Alice’s machine', b: 'Bob’s machine', e: 'Eve’s machine' },
    setup: 'rotors {r}', rings: 'rings {g}', pos: 'position {p}', start: 'from {p}', cables: 'cables:', noCable: 'none',
    blank: 'No key pressed yet.' },
  pane: {
    ref: { title: 'Reflector B', sub: '13 wires, each joining two contacts. No contact is joined to itself.' },
    crib: { title: 'The crib', sub: '{n} possible places in the cipher', place: 'place', out: 'ruled out: {c} under {c} (letter {n})', ok: 'possible', left: 'Places left:' },
    menu: { title: 'The menu of place {k}', sub: 'letter of the message: crib letter – cipher letter',
      guess: 'At position {p}:', holds: 'the loop holds', falls: 'falls: {a} ≠ {b}' },
    bombe: { title: 'The bombe', checkTitle: 'The clerk checks the stops', sub: 'rotors {r} in that order, rings at A, test letter: {x}',
      tried: 'positions tried', stops: 'stops', total: '{n} positions, {s} stop(s)', pos: 'position', guess: 'cable', bad: '✗ {c} would have two cables', good: '✓ holds:' },
  },
  ch: ['The report', 'Never itself', 'The crib', 'The menu', 'The bombe', 'The check', 'The history'],
  steps: {
    s1: { t: 'The weather report',
      p: "Six in the morning. As every day, Alice sends Bob the weather report. Same machine and same sheet of the day as for « OUI »: rotors I, II and III, the right rotor’s ring on B, the ten cables. For this message she starts from IXX and types HEUTEXWETTERBERICHTXEIS, “today, weather report: ice” in German, with X for the spaces. Her machine lights EBOWTASBRMHCEFBMMXEFFPA.",
      a: 'The report, as every morning.', b: 'I’m waiting for it, with the same sheet.', e: 'Twenty-three letters, every morning at the same hour…' },
    s2: { t: 'By radio',
      p: "Alice sends the 23 letters by radio, and Eve writes them down as they pass. She even has a copy of the machine on her desk. But without the sheet of the day she would have to try about 1.59 × 10²⁰ settings, not counting the rings. She will not try them one by one: she will look for a flaw.",
      go: 'Replay the sending', e: 'EBOWTASBRMHCEFBMMXEFFPA. Try them all? No: I look for a flaw.' },
    s3: { t: 'One letter, one path',
      p: "Back at Alice’s, from IXX, for the first letter. She presses H. The right rotor steps to IXY, and the H–O cable brings the current in at O. Rotor III sends it to Y, II to B, I to R. The reflector sends it back to B; it crosses rotors I, II and III again: R, B, R. The R–E cable lights lamp E. H becomes E.",
      go: 'Press H', a: 'H lights E.' },
    s4: { t: 'Never itself',
      p: "Lamp H, though, could never light. For that, the current would have to leave the rotors at the very contact it came in by, O, before taking the O–H cable back. But on the way back it crosses the same rotors the other way: leaving where it came in means leaving the reflector at the very contact it arrived at. Reflector B joins its 26 contacts in pairs, with 13 wires: none comes back to itself. Cables or not, at any position, a letter never encrypts to itself.",
      e: 'Never itself. That is my way in.' },
    s5: { t: 'The crib',
      p: "Eve makes a bet: every morning at this hour the message is the weather report, and it holds the word WETTERBERICHT, “weather report”. A word one guesses in an encrypted message is called a crib. Eve does not know where it sits. She writes the 23 cipher letters on her slate, numbers them, and lays the 13 letters of the word underneath. The word can start under letter 1, 2, and so on up to 11: 11 places.",
      e: 'The word is in there. But where?' },
    s6: { t: 'A letter over itself',
      p: "Place 1: the word starts under the first cipher letter. Eve compares, column by column. At the 9th letter, the R of the word falls under an R of the cipher. If the word were there, the machine would have encrypted an R as R: that cannot happen. Place 1 is ruled out.",
      go: 'Compare at place 1', e: 'R under R: not here.' },
    s7: { t: 'Shifting the word',
      p: "Eve shifts the word one step, then another, up to place 11, the last where it fits whole. At each place, one letter under itself is enough to rule it out. Six places fall: 1, 2, 3, 4, 6 and 9. Five are left: 5, 7, 8, 10 and 11. The word is at one of them.",
      go: 'Shift the word', e: 'Eleven places, five left.' },
    s8: { t: 'The menu',
      p: "Eve does the same work for each of the five places; let us follow place 7. Each column joins two letters: at the 7th letter of the message the machine turned W into S; at the 8th, E into B; and so on up to the 19th, T into E. The cables count here: at the 7th letter, the W goes through its cable, across the rotors, and out through the cable of S. Eve writes each letter once, and each column as a line between two letters, numbered by its place in the message. This drawing is called a menu.",
      go: 'Draw the menu', e: 'Thirteen lines, twelve letters.' },
    s9: { t: 'A loop',
      p: "The menu has loops. From E, line 8 leads to B, 15 to R, 9 to T, and 19 back to E. Take one position of the rotors, IXW, and one guess: “E’s cable goes to A”. Line 8 says: at the 8th letter, A crosses the rotors and comes out at J; so B’s cable goes to J. Line 15 gives R’s cable the same way, I; line 9 gives T’s, G; and 19 comes back to E, at S. But we guessed A: the guess falls. With “E’s cable goes to R”, the loop comes back to R: it holds. One loop alone lets a few guesses through; the other lines of the menu stop them.",
      go: 'Follow two guesses', e: 'A does not hold. R holds.' },
    s10: { t: 'The bombe',
      p: "Doing this by hand for 17,576 positions would take weeks. In 1939 Alan Turing designs a machine that does it: the bombe. Each group of three drums does the work of an Enigma’s rotors and reflector; there is one group per line of the menu, set ahead by as many steps as its line’s place, and wires between the groups copy the menu. Current is sent into one wire: “E’s cable goes to A”. Everything that guess implies lights up at once, and since a cable goes both ways, if E goes to A then A goes to E: that is the diagonal board, added by Gordon Welchman.",
      e: 'One Enigma per line of the menu, all wired together.' },
    s11: { t: 'The bombe runs',
      p: "The bombe tries the 17,576 positions one by one. If all 26 wires of E light up, every guess about E’s cable falls: next position. If a single one stays dark, it is the only guess that holds: the bombe stops. Here it runs with rotors I, II and III in that order, the rings at A, for the menus of the five places. That is a shortcut: Eve does not know the order of the rotors, and the real bombe started again for each of the 60 orders. Five menus, 87,880 positions: 9 stops.",
      go: 'Run the bombe', e: 'Nine stops out of 87,880 positions.' },
    s12: { t: 'The stops',
      p: "A stop is not an answer yet. For each one, Eve follows the guess through the whole menu and gets a cable for each letter. Eight stops give some letter two cables at once: impossible, they fall. Only one holds: place 7, position IXW, the E–R cable, and with it B–S, C–Z, F–I, H–O, K–W and L–M; T and X have no cable.",
      go: 'Check the stops', e: 'Only one holds: place 7, IXW.' },
    s13: { t: 'On the machine',
      p: "Now to try it. In July 1939 the Polish cryptologists had given a copy of Enigma to the British and one to the French; Eve has hers. She puts in rotors I, II and III, the rings at A, the seven cables found, position IXW, and types the cipher. The machine lights HEGTEXWETTERBERICHTXEIS.",
      go: 'Type the cipher', e: 'HEGTE… WETTERBERICHT… EIS. Nearly!' },
    s14: { t: 'The message reads',
      p: "HEGTE must be HEUTE, “today”: a cable is missing between G and U, two letters the menu did not hold. Eve plugs it, sets IXW again and types again: HEUTEXWETTERBERICHTXEIS. Alice and Bob’s sheet said ring B and start IXX; the bombe found ring A and IXW. One step of ring against one step of start: the right rotor’s wires sit in the same place, and the middle rotor does not move in this message. Eve holds the rotors and the cables of the day: that day, they serve for every message.",
      go: 'Plug G–U and type again', e: 'HEUTE X WETTERBERICHT X EIS. Good morning, Alice.' },
    s15: { t: 'The true story',
      p: "This story is simplified; its ideas are those of the real one. In Poland, Marian Rejewski works out the wiring of Enigma’s rotors at the end of 1932, and with Jerzy Różycki and Henryk Zygalski he reads German messages for years. In 1938 their “bomba” looks for the setting another way, from the message key the operators typed twice. In July 1939 they show everything to the British and the French. At Bletchley Park, Alan Turing designs the crib-based bombe; the first one runs in 1940, Gordon Welchman adds the diagonal board, and by the end of the war Britain has about two hundred of them.",
      e: 'The flaw was in the reflector from the start.' },
    s16: { t: 'Your turn',
      p: "In the sandbox, move a crib along under a cipher: every place where a letter falls under itself is ruled out. Run the bombe on a place that is left: it tries the 17,576 positions of rotors I, II and III, and the clerk checks its stops. Or test yourself with the quiz.",
      go: 'Try the sandbox', go2: 'Take the quiz' },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Move the crib along under the cipher, then run the bombe on a place that is left.',
    cipher: 'Intercepted cipher', crib: 'Crib', place: 'Place of the word', placeOf: 'place {k} / {n}',
    sweep: 'Shift it all the way', bad: 'Letters A to Z only, and a word shorter than the cipher.',
    out: 'Place {k} ruled out: {c} under {c} (letter {n}).', ok: 'Place {k} possible: no letter under itself.',
    bombe: 'Run the bombe on this place', note: 'Rotors I, II, III in that order, rings at A, test letter: {x}.',
    running: 'The bombe is running…', none: 'No stop: at this place, with this order of the rotors, the word does not hold.',
    stops: 'Stops: {n}. Holding: {g}.', try: 'Try it on Eve’s machine', reads: 'Eve’s machine reads: {m}',
    reset: 'Back to Eve’s message',
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
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = t(el.dataset.i18nPh);
  for (const b of document.querySelectorAll('#lang button')) b.classList.toggle('active', b.dataset.lang === lang);
  for (const a of document.querySelectorAll('a.series')) a.href = '../?lang=' + lang;   // the series home, same language
}
export function setLang(l) {
  lang = l; localStorage.setItem('dg-lang', l);
  applyStatic(); listeners.forEach(f => f(l));
}
export function onLang(f) { listeners.push(f); }
